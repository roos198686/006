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
                var share = agentId ? Math.floor(amount * agentRate / 100) : 0;
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

//给总俱乐部账号加豆(抽水/暗水/房费收入);tableName=牌桌真实名称,记录弹窗显示用
function addToClubAccount(clubId, amount, roomId, gameType, changeType, done, tableName){
    if(!(amount > 0) || !(clubId > 0)){
        if(done) done();
        return;
    }
    //总俱乐部账号 = 俱乐部社长
    db.query('SELECT owner_userid FROM t_clubs WHERE id = ' + clubId, function(err, rows){
        if(err || !rows || rows.length == 0){
            if(done) done();
            return;
        }
        var ownerId = rows[0].owner_userid;
        db.add_user_gems(ownerId, amount, null, {
            roomid: roomId, gameType: gameType, changeType: changeType, clubId: clubId, tableName: tableName || ""
        });
        if(done) done();
    });
}

//合伙人分成(逐级上浮): 收入可能产生在任意一级俱乐部, 要从它往上逐级交给上级俱乐部
//比例存于 t_partner_stats: club_id=上级, partner_club_id=直属下级, profit_ratio=下级留成比例(%)
//  一级对二级设80、二级对三级设80, 三级产生100分 => 三级留64, 二级得16, 一级得20
//  比例=100 或未配置(=0) 表示上级不抽成, 收入全留下级
//  金额统计/明细按2位小数记, 实际加豆取整(零头累计到下次), 每笔总额守恒
//statsExtras: 额外累加到各级合伙人统计的字段(如 {rake, hidden_rake})
//done(netAmount): netAmount = 产生收入的本俱乐部最终实得(整数, 已扣掉上缴部分)
var shareRemain = {};
function round2(v){ return Math.round(v * 100) / 100; }

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

function splitPartnerShare(clubId, amount, roomId, gameType, roomUuid, gameIndex, tableName, statsExtras, done){
    if(!(amount > 0) || !(clubId > 0)){ done(amount); return; }
    loadClubChain(clubId, function(chain){
        if(!chain || chain.length <= 1){ done(amount); return; }
        //只取链上每条"上级->直属下级"关系的留成比例
        var conds = [];
        for(var i = 0; i < chain.length - 1; i++){
            conds.push('(club_id = ' + chain[i].id + ' AND partner_club_id = ' + chain[i + 1].id + ')');
        }
        db.query('SELECT club_id, partner_club_id, profit_ratio FROM t_partner_stats WHERE ' + conds.join(' OR '), function(err, rows){
            var ratioMap = {};
            (rows || []).forEach(function(r){
                ratioMap[Number(r.club_id) + '_' + Number(r.partner_club_id)] = Number(r.profit_ratio) || 0;
            });
            //自顶向下算每级应得(2位小数): 上级抽 (1-留成比例), 剩余继续往下
            var shares = [];
            var rest = amount;
            for(var i = 0; i < chain.length; i++){
                if(i === chain.length - 1){
                    shares.push({clubId: chain[i].id, ownerId: chain[i].ownerId, dec: round2(rest)});
                    break;
                }
                var ratio = ratioMap[chain[i].id + '_' + chain[i + 1].id];
                if(!(ratio > 0) || ratio > 100){ ratio = 100; } //未配置=上级不抽成
                var keep = rest * ratio / 100;
                shares.push({
                    clubId: chain[i].id, ownerId: chain[i].ownerId, dec: round2(rest - keep),
                    childId: chain[i + 1].id
                });
                rest = keep;
            }
            //实发整数: 上级按累计零头取整, 末级拿剩余, 保证各层实发之和=这笔收入
            var left = amount;
            for(var j = 0; j < shares.length; j++){
                var s = shares[j];
                if(j === shares.length - 1){ s.pay = left; break; }
                var key = s.clubId + '_' + s.childId;
                var acc = (shareRemain[key] || 0) + s.dec;
                var pay = Math.round(acc);
                if(pay < 0){ pay = 0; }
                if(pay > left){ pay = left; }
                shareRemain[key] = acc - pay;
                s.pay = pay;
                left -= pay;
            }
            var last = shares[shares.length - 1];
            var pending = shares.length - 1;
            if(pending <= 0){ done(last.pay); return; }
            var tick = function(){ if(--pending === 0){ done(last.pay); } };
            shares.forEach(function(s, idx){
                if(idx === shares.length - 1){ return; }
                var stats = {partner_profit: s.dec};
                if(statsExtras){ for(var k in statsExtras){ stats[k] = statsExtras[k]; } }
                db.partner_add_stats(s.clubId, s.childId, stats, function(){
                    if(!(s.pay > 0)){ tick(); return; }
                    //分给上级俱乐部社长
                    db.add_user_gems(s.ownerId, s.pay, null, {
                        roomid: roomId, gameType: gameType, changeType: "合伙人分成", clubId: s.clubId, partnerClubId: s.childId, tableName: tableName || ""
                    });
                    //奖励明细: 该上级从这条下级链上抽到的分成
                    db.add_reward_log(s.clubId, s.childId, "合伙人分成", s.dec, gameType, roomId, roomUuid, gameIndex, tableName, function(){ tick(); });
                });
            });
        });
    });
}

//kind: "enter" 进房首局 / "emoji" 表情 / "shuffle" 洗牌
exports.charge = function(type, userId, kind, roomId, done){
    rulesOf(type, function(rules){
        var amount = rules[kind] || 0;
        if(amount <= 0){
            if(done) done();
            return;
        }
        var label = kind === "enter" ? "进房首局扣豆" : (kind === "emoji" ? "表情扣豆" : "洗牌扣豆");
        deduct(userId, amount, roomId, type, label, rules.agentRate, done);
    });
};

//俱乐部玩法扣费(进房首局/表情/洗牌)
exports.chargeClub = function(type, clubConfig, userId, kind, roomId, done){
    rulesOfClub(type, clubConfig, function(rules){
        var amount = rules[kind] || 0;
        if(amount <= 0){
            if(done) done();
            return;
        }
        var label = kind === "enter" ? "进房首局扣豆" : (kind === "emoji" ? "表情扣豆" : "洗牌扣豆");
        deduct(userId, amount, roomId, type, label, rules.agentRate, done, {
            clubId: clubConfig ? clubConfig.club_id : 0
        });
    });
};

//房间级扣费: 表情分/洗牌分 优先取该牌桌当前conf, 缺失才回落玩法配置, 0=不扣
//kind: "emoji" 表情 / "shuffle" 洗牌
//实时读取DB, 避免馆主改完配置后老房间仍按旧值不扣; 每张牌桌参数独立
exports.chargeRoom = function(conf, userId, kind, roomId, done){
    var doCharge = function(faceScore, shuffleScore){
        var amount = kind === "emoji" ? (Number(faceScore) || 0) : (Number(shuffleScore) || 0);
        if(amount <= 0){
            if(done) done();
            return;
        }
        var label = kind === "emoji" ? "表情扣豆" : "洗牌扣豆";
        var feeName = label; //奖励明细里的类型, 写清楚是表情还是洗牌
        var clubId = (conf.clubGameConfig && conf.clubGameConfig.clubId) || conf.clubid || 0;
        deduct(userId, amount, roomId, conf.type, label, 0, function(){
            if(!(clubId > 0)){
                if(done) done();
                return;
            }
            //洗牌/表情费用归俱乐部收入(下级俱乐部的收入要按比例分给上级), 并写入奖励明细
            splitPartnerShare(clubId, amount, roomId, conf.type, conf.room_uuid || "", 0, conf.club_table_name || "", null, function(net){
                addToClubAccount(clubId, net, roomId, conf.type, feeName, function(){
                    db.add_reward_log(clubId, 0, feeName, amount, conf.type, roomId, conf.room_uuid || "", 0, conf.club_table_name || "", function(){});
                    if(done) done();
                }, conf.club_table_name || "");
            });
        }, { clubId: clubId, tableName: conf.club_table_name || "" });
    };
    var clubId = (conf.clubGameConfig && conf.clubGameConfig.clubId) || conf.clubid || 0;
    if(!(clubId > 0)){
        doCharge(conf.face_score, conf.shuffle_score);
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
        doCharge(face, shuffle);
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
};

//单局结算抽水/暗水
//deltas: {seatIndex: delta} 本局盈亏(正为赢)
//winners: [seatIndex] 赢家列表
//roomInfo: {roomId, clubId, gameType, roomUuid, gameIndex}
//rules: 俱乐部玩法规则(含rakePercent/hiddenRakePercent/rakePerRound)
exports.chargeRake = function(deltas, winners, roomInfo, rules, done){
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
        var rake = Math.floor(delta * rules.rakePercent / 100);
        var hiddenRake = Math.floor(delta * rules.hiddenRakePercent / 100);
        var totalDeduct = rake + hiddenRake;
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
        //抽水+暗水是俱乐部收入; 先按比例分给下级俱乐部(合伙人), 剩下的才归自己
        var total = rakeTotal + hiddenRakeTotal;
        if(total <= 0){ if(done) done(); return; }
        splitPartnerShare(roomInfo.clubId, total, roomInfo.roomId, roomInfo.gameType, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "",
            {rake: rakeTotal, hidden_rake: hiddenRakeTotal}, function(net){
            addToClubAccount(roomInfo.clubId, net, roomInfo.roomId, roomInfo.gameType, "抽水", function(){
                //俱乐部自己的奖励明细: 抽水/暗水按收到的全额记, 合伙人分成单独一行, 方便后台核对
                if(rakeTotal > 0){
                    db.add_reward_log(roomInfo.clubId, 0, "抽水", rakeTotal, roomInfo.gameType, roomInfo.roomId, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", function(){});
                }
                if(hiddenRakeTotal > 0){
                    db.add_reward_log(roomInfo.clubId, 0, "暗水", hiddenRakeTotal, roomInfo.gameType, roomInfo.roomId, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", function(){});
                }
                if(done) done();
            }, roomInfo.tableName || "");
        });
    }
};

//整场结束抽水/暗水(按总盈利)
//totalDeltas: {seatIndex: totalDelta} 整场总盈亏
exports.chargeRakeTotal = function(totalDeltas, winners, roomInfo, rules, done){
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
        var rake = Math.floor(delta * rules.rakePercent / 100);
        var hiddenRake = Math.floor(delta * rules.hiddenRakePercent / 100);
        var totalDeduct = rake + hiddenRake;
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
        //先分给下级俱乐部(合伙人), 剩下的才归自己
        splitPartnerShare(roomInfo.clubId, total, roomInfo.roomId, roomInfo.gameType, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "",
            {rake: rakeTotal, hidden_rake: hiddenRakeTotal}, function(net){
            addToClubAccount(roomInfo.clubId, net, roomInfo.roomId, roomInfo.gameType, "抽水", function(){
                if(rakeTotal > 0){
                    db.add_reward_log(roomInfo.clubId, 0, "抽水", rakeTotal, roomInfo.gameType, roomInfo.roomId, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", function(){});
                }
                if(hiddenRakeTotal > 0){
                    db.add_reward_log(roomInfo.clubId, 0, "暗水", hiddenRakeTotal, roomInfo.gameType, roomInfo.roomId, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", function(){});
                }
                if(done) done();
            }, roomInfo.tableName || "");
        });
    }
};

//整场结束扣房费
//payerSeatIndex: 支付方座位(0=比赛场出 1=大赢家出)
//bigWinnerSeat: 大赢家座位
exports.chargeRoomFee = function(roomInfo, rules, payerSeatIndex, bigWinnerSeat, done){
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
            addToClubAccount(roomInfo.clubId, net, roomInfo.roomId, roomInfo.gameType, "房费", function(){
                //奖励明细: 房费
                db.add_reward_log(roomInfo.clubId, 0, "房费", rules.roomFee, roomInfo.gameType, roomInfo.roomId, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", function(){});
                if(done) done();
            }, roomInfo.tableName || "");
        });
    }, {clubId: roomInfo.clubId, tableName: roomInfo.tableName || ""});
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
