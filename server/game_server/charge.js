//宝宝玩法扣豆: 进房首局开局 / 房间发表情 / 点洗牌 三种扣费, 并按比率把扣掉金额的一部分分给用户所属俱乐部的代理(社长)
//扣费额度来自全局玩法配置 t_game_config.tai_rules:
//   enter_cost   进房后第一局扣多少豆
//   emoji_cost   每次发表情扣多少豆
//   shuffle_cost 每次点洗牌扣多少豆
//   agent_rate   分给代理的百分比(0~100)
//
//俱乐部玩法配置( t_club_games )可覆盖:
//   rake_percent       抽水比例(%)
//   hidden_rake_percent 暗水比例(%)
//   rake_per_round     1=每小局抽 0=整场抽
//   room_fee           房费数量
//   room_fee_payer     0=比赛场出(不扣) 1=大赢家出
var db = require("../utils/db");

var CACHE_MS = 60 * 1000;
var cache = {};

//每个玩法各自的收费模式开关(t_game_config.unified_charge):
//  1=开启: 该玩法按宝宝模式抽水/暗水/房费/表情费/洗牌费(不扣房卡)
//  0=关闭: 该玩法只保留房卡扣费(进房开局按现有规则扣), 抽水等全部不生效
//不做缓存: 后台改完开关要立即生效
function unifiedCharge(type, callback){
    if(!type){ callback(0); return; }
    db.get_game_config(String(type), function(cfg){
        callback((cfg && Number(cfg.unified_charge) === 1) ? 1 : 0);
    });
}
exports.unifiedCharge = unifiedCharge;

function toNum(v){
    var n = Number(v);
    return isFinite(n) && n > 0 ? n : 0;
}

//读全局配置(60秒缓存, 改后台最多1分钟生效)
function rulesOf(type, callback){
    if(!type){
        callback({});
        return;
    }
    var c = cache[type];
    if(c && Date.now() - c.t < CACHE_MS){
        callback(c.rules);
        return;
    }
    db.get_game_config(type, function(cfg){
        var tr = cfg && cfg.tai_rules;
        if(typeof tr === "string"){
            try{ tr = JSON.parse(tr); }catch(e){ tr = null; }
        }
        var rate = toNum(tr && tr.agent_rate);
        if(rate > 100) rate = 100;
        var rules = {
            enter: toNum(tr && tr.enter_cost),
            emoji: toNum(tr && tr.emoji_cost),
            shuffle: toNum(tr && tr.shuffle_cost),
            agentRate: rate
        };
        cache[type] = {t: Date.now(), rules: rules};
        callback(rules);
    });
}

//读俱乐部玩法配置(优先)或全局配置
//clubConfig: t_club_games 行对象(可能为null)
function rulesOfClub(type, clubConfig, callback){
    if(!type){
        callback({});
        return;
    }
    rulesOf(type, function(globalRules){
        if(!clubConfig){
            callback(globalRules);
            return;
        }
        //俱乐部配置覆盖全局
        var rules = {
            enter: globalRules.enter,
            emoji: globalRules.emoji,
            shuffle: globalRules.shuffle,
            agentRate: globalRules.agentRate,
            minPlayers: toNum(clubConfig.min_players) || 2,
            maxPlayers: toNum(clubConfig.max_players_custom) || 6,
            rakePercent: toNum(clubConfig.rake_percent),
            hiddenRakePercent: toNum(clubConfig.hidden_rake_percent),
            rakePerRound: clubConfig.rake_per_round != null ? clubConfig.rake_per_round : 1,
            roomFee: toNum(clubConfig.room_fee),
            roomFeePayer: clubConfig.room_fee_payer || 0
        };
        callback(rules);
    });
}

//扣豆并写流水; 同时按比率给代理加豆
function deduct(userId, amount, roomId, gameType, changeType, agentRate, done, extra){
    if(!(amount > 0)){
        if(done) done();
        return;
    }
    extra = extra || {};
    db.add_user_gems(userId, -amount, function(ok){
        if(agentRate > 0){
            db.get_user_agent(userId, function(agentId){
                var share = agentId ? round4(amount * agentRate / 100) : 0;
                if(share > 0){
                    db.add_user_gems(agentId, share, null, {roomid: roomId, gameType: gameType, changeType: "代理分成", tableName: extra.tableName});
                }
                if(done) done();
            });
        }
        else if(done){
            done();
        }
    }, {roomid: roomId, gameType: gameType, changeType: changeType, clubId: extra.clubId, partnerClubId: extra.partnerClubId, tableName: extra.tableName});
}

//合伙人分成(逐级上浮): 收入可能产生在任意一级俱乐部, 要从它往上逐级交给上级俱乐部
//比例存于 t_partner_stats: club_id=上级, partner_club_id=直属下级, profit_ratio=上级抽成比例(%)
//  一级对二级设10、二级对三级设10, 三级产生100分 => 三级留81, 二级得9, 一级得10
//  比例=0 或未配置 表示上级不抽成, 收入全留下级
//  金额统计/明细按2位小数记, 实际加豆取整(零头累计到下次), 每笔总额守恒
//statsExtras: 额外累加到各级合伙人统计的字段(如 {rake, hidden_rake})
//done(netAmount): netAmount = 产生收入的本俱乐部最终实得(整数, 已扣掉上缴部分)
var shareRemain = {};
function round4(v){ return Math.round(v * 10000) / 10000; }

//取俱乐部及其全部上级, 返回 [顶级, ..., 本级]
function loadClubChain(clubId, callback){
    var list = [];
    var walk = function(id, depth){
        if(!(id > 0) || depth > 12){ list.reverse(); callback(list); return; }
        db.query('SELECT id, parent_clubid, owner_userid FROM t_clubs WHERE id = ' + id, function(err, rows){
            if(err || !rows || rows.length == 0){ list.reverse(); callback(list); return; }
            var cid = Number(rows[0].id) || 0;
            var pid = Number(rows[0].parent_clubid) || 0;
            list.push({id: cid, ownerId: Number(rows[0].owner_userid) || 0});
            if(pid > 0 && pid != cid){ walk(pid, depth + 1); }
            else { list.reverse(); callback(list); }
        });
    };
    walk(clubId, 0);
}

function splitPartnerShare(clubId, amount, roomId, gameType, roomUuid, gameIndex, tableName, statsExtras, done, ratioField){
    if(!(amount > 0) || !(clubId > 0)){ done(amount); return; }
    //费用类收入(进房/表情/洗牌)走独立的 fee_profit_ratio, 抽水走 profit_ratio
    var rf = (ratioField === 'fee_profit_ratio' || ratioField === 'hidden_profit_ratio') ? ratioField : 'profit_ratio';
    loadClubChain(clubId, function(chain){
        if(!chain || chain.length <= 1){ done(amount); return; }
        //只取链上每条"上级->直属下级"关系的留成比例
        var conds = [];
        for(var i = 0; i < chain.length - 1; i++){
            conds.push('(club_id = ' + chain[i].id + ' AND partner_club_id = ' + chain[i + 1].id + ')');
        }
        db.query('SELECT club_id, partner_club_id, ' + rf + ' AS profit_ratio FROM t_partner_stats WHERE ' + conds.join(' OR '), function(err, rows){
            var ratioMap = {};
            (rows || []).forEach(function(r){
                ratioMap[Number(r.club_id) + '_' + Number(r.partner_club_id)] = Number(r.profit_ratio) || 0;
            });
            // ===== 自下而上算抽成: 下级先从底级抽, 上级再从下级抽到的份额里抽 =====
            // 例: chain=[一级,二级,三级], amount=100, ratio全10
            //   二级从三级抽: fee2 = 100*10% = 10
            //   一级从二级抽到的10里抽: fee1 = 10*10% = 1
            // 然后自顶向下发实得: 一级得1, 二级得10-1=9, 三级得100-10=90
            var fees = [];  // fees[i] = chain[i] 从 chain[i+1] 抽到的总额
            var prevBase = amount;  // 最底级的基数=原始抽水
            for(var i = chain.length - 2; i >= 0; i--){
                var r = ratioMap[chain[i].id + '_' + chain[i + 1].id];
                if(!(r > 0) || r > 100){ r = 0; }
                var fee = round4(prevBase * r / 100);
                fees.unshift(fee);      // 插到队头, 保持和 chain 对齐
                prevBase = fee;         // 上一级的基数 = 我抽到的
            }
            // shares: 自顶向下算每级实发给社长的金额
            var shares = [];
            var left = amount;
            for(var j = 0; j < fees.length; j++){
                // 实得 = 我从下级抽到的 - 上一级从我这抽走的
                var got = round4(fees[j] - (j > 0 ? fees[j - 1] : 0));
                shares.push({
                    clubId: chain[j].id, ownerId: chain[j].ownerId,
                    dec: fees[j],    // 从下级抽到的总额(用 partner_profit 统计)
                    pay: got,        // 实发给社长
                    childId: chain[j + 1].id
                });
                left = round4(left - got);
            }
            // 最终级(底级)拿剩余
            shares.push({clubId: chain[chain.length - 1].id, ownerId: chain[chain.length - 1].ownerId, dec: round4(left), pay: round4(left)});
            var last = shares[shares.length - 1];
            var pending = shares.length - 1;
            if(pending <= 0){ done(last.pay); return; }
            var tick = function(){ if(--pending === 0){ done(last.pay); } };
            shares.forEach(function(s, idx){
                if(idx === shares.length - 1){ return; }
                // ===== 存 pay(净额), 不是 dec(总额) =====
                // 本级从下级抽到的总额是 dec, 但还要给上级分走 fees[idx-1],
                // 本级实得 = dec - fees[idx-1] = pay. DB 存净额才能保证
                // 所有下级的 partner_profit 加起来等于底级 amount.
                var stats = {partner_profit: s.pay, partner_total: s.dec};
                if(statsExtras){
                    // rake/hidden_rake 按 s.dec(从下级抽到的总额) 比例缩放,
                    // 这样 club_overview 查 partner_stats.partner_club_id=clubId 的 rake+hidden_rake
                    // 就等于被上级总共抽走的金额
                    var shareRatio = amount > 0 ? s.dec / amount : 0;
                    for(var k in statsExtras){ stats[k] = round4(Number(statsExtras[k] || 0) * shareRatio); }
                }
                db.partner_add_stats(s.clubId, s.childId, stats, function(){
                    if(!(s.pay > 0)){ tick(); return; }
                    //奖励明细: 存 pay(净额), 和 partner_profit 保持一致;
                    //改为手动领取, 到账在 clubAdmin 奖励明细点"领取"(超过7天服务端自动领取)
                    db.add_reward_log(s.clubId, s.childId, "合伙人分成", s.pay, gameType, roomId, roomUuid, gameIndex, tableName, function(){ tick(); });
                });
            });
        });
    });
}

//kind: "enter" 进房首局 / "emoji" 表情 / "shuffle" 洗牌
exports.charge = function(type, userId, kind, roomId, done){
    unifiedCharge(type, function(on){
        if(!on){
            if(done) done();
            return;
        }
        rulesOf(type, function(rules){
            var amount = rules[kind] || 0;
            if(amount <= 0){
                if(done) done();
                return;
            }
            var label = kind === "enter" ? "进房首局扣豆" : (kind === "emoji" ? "表情扣豆" : "洗牌扣豆");
            deduct(userId, amount, roomId, type, label, rules.agentRate, done);
        });
    });
};

//俱乐部玩法扣费(进房首局/表情/洗牌)
exports.chargeClub = function(type, clubConfig, userId, kind, roomId, done){
    unifiedCharge(type, function(on){
    if(!on){
        if(done) done();
        return;
    }
    rulesOfClub(type, clubConfig, function(rules){
        var amount = rules[kind] || 0;
        if(amount <= 0){
            if(done) done();
            return;
        }
        var label = kind === "enter" ? "进房首局扣豆" : (kind === "emoji" ? "表情扣豆" : "洗牌扣豆");
        var clubId = clubConfig ? (Number(clubConfig.club_id) || Number(clubConfig.clubId) || 0) : 0;
        //扣下来的费用全额进俱乐部分账链(上下级比例在合伙人设置里配)
        var rate = 100;
        deduct(userId, amount, roomId, type, label, rules.agentRate, function(){
            if(!(clubId > 0) || !(rate > 0)){
                if(done) done();
                return;
            }
            //按该费用自身的抽取比例分给社长及上级合伙人
            var share = round4(amount * rate / 100);
            if(!(share > 0)){
                if(done) done();
                return;
            }
            splitPartnerShare(clubId, share, roomId, type, "", 0, "", null, function(net){
                //奖励明细改为手动领取(超过7天自动到账), 这里不再直接加到俱乐部账号
                db.add_reward_log(clubId, 0, label, net, type, roomId, "", 0, "", function(){});
                if(done) done();
            }, 'fee_profit_ratio');
        }, {
            clubId: clubId
        });
    });
    });
};

//房间级扣费: 表情分/洗牌分 优先取该牌桌当前conf, 缺失才回落玩法配置, 0=不扣
//kind: "emoji" 表情 / "shuffle" 洗牌
//实时读取DB, 避免馆主改完配置后老房间仍按旧值不扣; 每张牌桌参数独立
exports.chargeRoom = function(conf, userId, kind, roomId, done){
    unifiedCharge(conf && conf.type, function(on){
    if(!on){
        if(done) done();
        return;
    }
    var doCharge = function(faceScore, shuffleScore, sharePercent){
        var amount = kind === "emoji" ? (Number(faceScore) || 0) : (Number(shuffleScore) || 0);
        if(amount <= 0){
            if(done) done();
            return;
        }
        var label = kind === "emoji" ? "表情扣豆" : "洗牌扣豆";
        var feeName = label; //奖励明细里的类型, 写清楚是表情还是洗牌
        var clubId = (conf.clubGameConfig && conf.clubGameConfig.clubId) || conf.clubid || 0;
        //按表情/洗牌各自的抽取比例分给社长及上级合伙人
        var share = round4(amount * (Number(sharePercent) || 0) / 100);
        deduct(userId, amount, roomId, conf.type, label, 0, function(){
            if(!(clubId > 0) || !(share > 0)){
                if(done) done();
                return;
            }
            //抽取部分归俱乐部收入(下级俱乐部的收入要按比例分给上级), 并写入奖励明细
            splitPartnerShare(clubId, share, roomId, conf.type, conf.room_uuid || "", 0, conf.club_table_name || "", null, function(net){
                //奖励明细改为手动领取(超过7天自动到账)
                db.add_reward_log(clubId, 0, feeName, net, conf.type, roomId, conf.room_uuid || "", 0, conf.club_table_name || "", function(){});
                if(done) done();
            }, 'fee_profit_ratio');
        }, { clubId: clubId, tableName: conf.club_table_name || "" });
    };
    var clubId = (conf.clubGameConfig && conf.clubGameConfig.clubId) || conf.clubid || 0;
    if(!(clubId > 0)){
        doCharge(conf.face_score, conf.shuffle_score, 0);
        return;
    }
    //牌桌自身conf优先(每张牌桌参数独立), 缺失的字段才用玩法配置兜底
    var applyTable = function(tconf, cfg){
        var src = tconf || {};
        var c = cfg || {};
        var pick = function(k, def){
            if(src[k] == null || src[k] === ''){ return def; }
            var v = Number(src[k]);
            return isNaN(v) ? def : v;
        };
        var face = pick('face_score', Number(c.face_score) || 0);
        var shuffle = pick('shuffle_score', Number(c.shuffle_score) || 0);
        conf.face_score = face;
        conf.shuffle_score = shuffle;
        //表情/洗牌扣多少由牌桌配置决定, 扣下来全额进俱乐部分账链(上下级比例在合伙人设置里配)
        doCharge(face, shuffle, 100);
    };
    var apply = function(cfg){
        var tableId = Number(conf.club_table_id) || 0;
        if(!(tableId > 0)){
            applyTable(null, cfg);
            return;
        }
        db.club_get_table(tableId, function(t){
            var tconf = null;
            try{ tconf = t ? (JSON.parse(t.conf || "{}") || null) : null; }catch(e){ tconf = null; }
            //记住玩家自己录入的牌桌名称, 写奖励明细时用真实桌名
            if(t && t.name){ conf.club_table_name = t.name; }
            applyTable(tconf, cfg);
        });
    };
    var cfgId = Number(conf.game_config_id) || 0;
    if(cfgId > 0){
        db.club_game_get_config(cfgId, function(c){
            if(c){ apply(c); }
            else { db.club_game_get_config_by_club_type(clubId, conf.type, apply); }
        });
    } else {
        db.club_game_get_config_by_club_type(clubId, conf.type, apply);
    }
    });
};

//单局结算抽水/暗水
//deltas: {seatIndex: delta} 本局盈亏(正为赢)
//winners: [seatIndex] 赢家列表
//roomInfo: {roomId, clubId, gameType, roomUuid, gameIndex}
//rules: 俱乐部玩法规则(含rakePercent/hiddenRakePercent/rakePerRound)
exports.chargeRake = function(deltas, winners, roomInfo, rules, done){
    unifiedCharge(roomInfo && roomInfo.gameType, function(on){
    if(!on){
        if(done) done();
        return;
    }
    if(!rules || (rules.rakePercent <= 0 && rules.hiddenRakePercent <= 0)){
        if(done) done();
        return;
    }
    if(!rules.rakePerRound){
        //整场才抽,单局不扣
        if(done) done();
        return;
    }
    var rakeTotal = 0;
    var hiddenRakeTotal = 0;
    var pending = winners.length;
    if(pending === 0){
        if(done) done();
        return;
    }
    winners.forEach(function(seatIdx){
        var delta = deltas[seatIdx] || 0;
        if(delta <= 0){
            if(--pending === 0){
                finish();
            }
            return;
        }
        var rake = round4(delta * rules.rakePercent / 100);
        var hiddenRake = round4(delta * rules.hiddenRakePercent / 100);
        var totalDeduct = round4(rake + hiddenRake);
        if(totalDeduct <= 0){
            if(--pending === 0){
                finish();
            }
            return;
        }
        //扣赢家
        deduct(roomInfo.userIdOfSeat[seatIdx], totalDeduct, roomInfo.roomId, roomInfo.gameType, "抽水", 0, function(){
            rakeTotal += rake;
            hiddenRakeTotal += hiddenRake;
            if(--pending === 0){
                finish();
            }
        }, {clubId: roomInfo.clubId, tableName: roomInfo.tableName || ""});
    });
    function finish(){
        //明水(抽水)和暗水分别按各自的比例分成
        var total = rakeTotal + hiddenRakeTotal;
        if(total <= 0){ if(done) done(); return; }
        splitPartnerShare(roomInfo.clubId, rakeTotal, roomInfo.roomId, roomInfo.gameType, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "",
            {rake: rakeTotal}, function(rakeNet){
            splitPartnerShare(roomInfo.clubId, hiddenRakeTotal, roomInfo.roomId, roomInfo.gameType, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "",
                {hidden_rake: hiddenRakeTotal}, function(hiddenNet){
                var net = round4(rakeNet + hiddenNet);
                //俱乐部自己的奖励明细: 抽水/暗水按"扣完上级后实得"记(与总览一致);
                //改为手动领取(超过7天自动到账), 这里不再直接加到俱乐部账号
                var factor = total > 0 ? net / total : 0;
                if(rakeTotal > 0){
                    db.add_reward_log(roomInfo.clubId, 0, "抽水", round4(rakeTotal * factor), roomInfo.gameType, roomInfo.roomId, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", function(){});
                }
                if(hiddenRakeTotal > 0){
                    db.add_reward_log(roomInfo.clubId, 0, "暗水", round4(hiddenRakeTotal * factor), roomInfo.gameType, roomInfo.roomId, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", function(){});
                }
                if(done) done();
            }, 'hidden_profit_ratio');
        }, 'profit_ratio');
    }
    });
};

//整场结束抽水/暗水(按总盈利)
//totalDeltas: {seatIndex: totalDelta} 整场总盈亏
exports.chargeRakeTotal = function(totalDeltas, winners, roomInfo, rules, done){
    unifiedCharge(roomInfo && roomInfo.gameType, function(on){
    if(!on){
        if(done) done();
        return;
    }
    if(!rules || (rules.rakePercent <= 0 && rules.hiddenRakePercent <= 0)){
        if(done) done();
        return;
    }
    if(rules.rakePerRound){
        //每小局已抽,整场不再抽
        if(done) done();
        return;
    }
    var rakeTotal = 0;
    var hiddenRakeTotal = 0;
    var pending = winners.length;
    if(pending === 0){
        if(done) done();
        return;
    }
    winners.forEach(function(seatIdx){
        var delta = totalDeltas[seatIdx] || 0;
        if(delta <= 0){
            if(--pending === 0){ finish(); }
            return;
        }
        var rake = round4(delta * rules.rakePercent / 100);
        var hiddenRake = round4(delta * rules.hiddenRakePercent / 100);
        var totalDeduct = round4(rake + hiddenRake);
        if(totalDeduct <= 0){
            if(--pending === 0){ finish(); }
            return;
        }
        deduct(roomInfo.userIdOfSeat[seatIdx], totalDeduct, roomInfo.roomId, roomInfo.gameType, "抽水", 0, function(){
            rakeTotal += rake;
            hiddenRakeTotal += hiddenRake;
            if(--pending === 0){ finish(); }
        }, {clubId: roomInfo.clubId, tableName: roomInfo.tableName || ""});
    });
    function finish(){
        var total = rakeTotal + hiddenRakeTotal;
        if(total <= 0){ if(done) done(); return; }
        //明水(抽水)和暗水分别按各自的比例分成
        splitPartnerShare(roomInfo.clubId, rakeTotal, roomInfo.roomId, roomInfo.gameType, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "",
            {rake: rakeTotal}, function(rakeNet){
            splitPartnerShare(roomInfo.clubId, hiddenRakeTotal, roomInfo.roomId, roomInfo.gameType, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "",
                {hidden_rake: hiddenRakeTotal}, function(hiddenNet){
                var net = round4(rakeNet + hiddenNet);
                //奖励明细改为手动领取(超过7天自动到账)
                var factor = total > 0 ? net / total : 0;
                if(rakeTotal > 0){
                    db.add_reward_log(roomInfo.clubId, 0, "抽水", round4(rakeTotal * factor), roomInfo.gameType, roomInfo.roomId, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", function(){});
                }
                if(hiddenRakeTotal > 0){
                    db.add_reward_log(roomInfo.clubId, 0, "暗水", round4(hiddenRakeTotal * factor), roomInfo.gameType, roomInfo.roomId, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", function(){});
                }
                if(done) done();
            }, 'hidden_profit_ratio');
        }, 'profit_ratio');
    }
    });
};

//整场结束扣房费
//payerSeatIndex: 支付方座位(0=比赛场出 1=大赢家出)
//bigWinnerSeat: 大赢家座位
exports.chargeRoomFee = function(roomInfo, rules, payerSeatIndex, bigWinnerSeat, done){
    unifiedCharge(roomInfo && roomInfo.gameType, function(on){
    if(!on){
        if(done) done();
        return;
    }
    if(!rules || rules.roomFee <= 0){
        if(done) done();
        return;
    }
    if(rules.roomFeePayer === 0){
        //比赛场出(不扣)
        if(done) done();
        return;
    }
    //大赢家出
    var userId = roomInfo.userIdOfSeat[bigWinnerSeat];
    if(!userId){
        if(done) done();
        return;
    }
    deduct(userId, rules.roomFee, roomInfo.roomId, roomInfo.gameType, "房费", 0, function(){
        //房费也属于俱乐部收入, 需要按比例逐级上缴给上级俱乐部
        splitPartnerShare(roomInfo.clubId, rules.roomFee, roomInfo.roomId, roomInfo.gameType, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", null, function(net){
            //奖励明细: 房费按扣完上级后实得记; 改为手动领取(超过7天自动到账)
            db.add_reward_log(roomInfo.clubId, 0, "房费", net, roomInfo.gameType, roomInfo.roomId, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", function(){});
            if(done) done();
        });
    }, {clubId: roomInfo.clubId, tableName: roomInfo.tableName || ""});
    });
};

//检查人数是否满足开局条件
exports.checkStartPlayers = function(currentCount, rules){
    if(!rules) return {ok: currentCount >= 2, min: 2, max: 6};
    var min = rules.minPlayers || 2;
    var max = rules.maxPlayers || 6;
    return {
        ok: currentCount >= min && currentCount <= max,
        min: min,
        max: max
    };
};

//关闭统一收费时, 宝宝玩法改按房卡扣: 首局结算时给每个在坐玩家扣一次(与其它玩法扣法一致)
exports.chargeRoomCard = function(roomInfo, done){
    done = done || function(){};
    if(!roomInfo || !roomInfo.conf){ done(); return; }
    var conf = roomInfo.conf;
    if(String(conf.type || "").indexOf("baobao") !== 0){ done(); return; }
    if((Number(roomInfo.numOfGames) || 0) !== 1){ done(); return; }
    var cost = Number(conf.cost) || 0;
    if(!(cost > 0)){ done(); return; }
    unifiedCharge(conf.type, function(on){
        if(on){ done(); return; }
        var seats = roomInfo.seats || [];
        for(var i = 0; i < seats.length; ++i){
            var uid = seats[i] && seats[i].userId;
            if(uid > 0){
                db.cost_gems(uid, cost, function(success){
                    console.log("[宝宝房卡扣除] 玩家", uid, "扣除", cost, "结果:", success);
                });
            }
        }
        done();
    });
};

//读牌桌/玩法收费配置(牌桌conf优先, 缺失字段回落玩法配置), 并回写conf供表情/洗牌扣费使用
function loadTableChargeRules(roomInfo, callback){
    var conf = roomInfo.conf || {};
    var clubId = Number(conf.clubid) || 0;
    var apply = function(c, tconf){
        var src = tconf || {};
        var c2 = c || {};
        var pick = function(k, def){
            if(src[k] == null || src[k] === ''){ return def; }
            var v = Number(src[k]);
            return isNaN(v) ? def : v;
        };
        var rules = {
            clubId: clubId,
            rakePercent: pick('rake_percent', Number(c2.rake_percent) || 0),
            hiddenRakePercent: pick('hidden_rake_percent', Number(c2.hidden_rake_percent) || 0),
            rakePerRound: pick('rake_per_round', c2.rake_per_round != null ? Number(c2.rake_per_round) : 1),
            roomFee: pick('room_fee', Number(c2.room_fee) || 0),
            roomFeePayer: pick('room_fee_payer', c2.room_fee_payer != null ? Number(c2.room_fee_payer) : 0),
            faceScore: pick('face_score', Number(c2.face_score) || 0),
            shuffleScore: pick('shuffle_score', Number(c2.shuffle_score) || 0)
        };
        conf.clubGameConfig = rules;
        conf.face_score = rules.faceScore;
        conf.shuffle_score = rules.shuffleScore;
        callback(rules);
    };
    var loadCfg = function(cb){
        var cfgId = Number(conf.game_config_id) || 0;
        if(cfgId > 0){
            db.club_game_get_config(cfgId, function(c){
                if(c){ cb(c); }
                else { db.club_game_get_config_by_club_type(clubId, conf.type, cb); }
            });
        } else {
            db.club_game_get_config_by_club_type(clubId, conf.type, cb);
        }
    };
    var tableId = Number(conf.club_table_id) || 0;
    if(tableId > 0){
        loadCfg(function(c){
            db.club_get_table(tableId, function(t){
                var tconf = null;
                try{ tconf = t ? (JSON.parse(t.conf || "{}") || null) : null; }catch(e){ tconf = null; }
                if(t && t.name){ conf.club_table_name = t.name; }
                apply(c, tconf);
            });
        });
    } else {
        loadCfg(function(c){ apply(c, null); });
    }
}

//统一收费模式下, 非宝宝玩法(麻将/跑得快/十三水等)结算时统一抽水/暗水/房费
//由 replay 收到 game_over_push 时调用; 宝宝玩法已在 gamemgr_baobao 内自行结算, 这里跳过
//幂等: 同一房间同一局只处理一次(断线重进补发结算不会重复扣费)
var settledCharge = {};
var settledChargeCount = 0;

exports.settleGameOver = function(roomId, data, done){
    done = done || function(){};
    var roomMgr = require('./roommgr');
    var roomInfo = roomMgr.getRoom(roomId);
    if(!roomInfo || !roomInfo.conf || !data || !data.results){
        done();
        return;
    }
    var conf = roomInfo.conf;
    var type = String(conf.type || "");
    if(type.indexOf("baobao") === 0){ done(); return; }
    if(!(Number(conf.clubid) > 0)){ done(); return; }

    unifiedCharge(type, function(on){
        if(!on){ done(); return; }
        var key = String(roomInfo.id) + '_' + String(roomInfo.uuid || '') + '_' + String(roomInfo.numOfGames || 0);
        if(settledCharge[key]){ done(); return; }
        settledCharge[key] = Date.now();
        if(++settledChargeCount > 20000){
            settledCharge = {};
            settledChargeCount = 0;
        }
        loadTableChargeRules(roomInfo, function(rules){
            var results = data.results || [];
            var deltas = {};
            var totalDeltas = {};
            var userIdOfSeat = [];
            var roundWinners = [];
            var totalWinners = [];
            results.forEach(function(r, i){
                var uid = Number(r.userid || r.userId || 0);
                userIdOfSeat[i] = uid;
                var d = Number(r.delta != null ? r.delta : (r.score != null ? r.score : 0)) || 0;
                var t = Number(r.totalscore != null ? r.totalscore : d) || 0;
                deltas[i] = d;
                totalDeltas[i] = t;
                if(d > 0){ roundWinners.push(i); }
                if(t > 0){ totalWinners.push(i); }
            });
            if(!userIdOfSeat.length){ done(); return; }

            var cri = {
                roomId: roomInfo.id,
                clubId: rules.clubId || Number(conf.clubid) || 0,
                gameType: type,
                roomUuid: roomInfo.uuid || "",
                gameIndex: Number(roomInfo.numOfGames) || 0,
                tableName: conf.club_table_name || "",
                userIdOfSeat: userIdOfSeat
            };
            var maxGames = Number(conf.maxGames) || 0;
            var isLast = !!data.final || (maxGames > 0 && (Number(roomInfo.numOfGames) || 0) >= maxGames);

            var afterRake = function(){
                if(!isLast){ done(); return; }
                var afterTotal = function(){
                    //房费: 整场结束由大赢家出(房费谁出=比赛场出不扣)
                    var bigSeat = -1, big = -1;
                    for(var i = 0; i < userIdOfSeat.length; i++){
                        var t = totalDeltas[i] || 0;
                        if(t > big){ big = t; bigSeat = i; }
                    }
                    exports.chargeRoomFee(cri, rules, 0, bigSeat, done);
                };
                if(rules.rakePerRound){
                    afterTotal();
                } else {
                    exports.chargeRakeTotal(totalDeltas, totalWinners, cri, rules, afterTotal);
                }
            };
            exports.chargeRake(deltas, roundWinners, cri, rules, afterRake);
        });
    });
};

