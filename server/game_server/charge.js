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

//牌桌conf取数值(缺失/非法用默认)
function pickNum(src, k, def){
    if(!src || src[k] == null || src[k] === ''){ return def; }
    var v = Number(src[k]);
    return isNaN(v) ? def : v;
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

//玩家所属俱乐部(60秒缓存): 收费/进场费/房费/表情/洗牌都按玩家自己的俱乐部算
//fallback: 玩家没有俱乐部时回退到牌桌俱乐部(保持原行为)
var userClubCache = {};
var USER_CLUB_MS = 60 * 1000;
function clubIdOfUser(userId, fallback, cb){
    var uid = Number(userId) || 0;
    var fb = Number(fallback) || 0;
    if(!(uid > 0)){ cb(fb); return; }
    var c = userClubCache[uid];
    if(c && Date.now() - c.t < USER_CLUB_MS){ cb(c.id > 0 ? c.id : fb); return; }
    db.club_member_clubid(uid, function(cid){
        var id = Number(cid) || 0;
        userClubCache[uid] = { id: id, t: Date.now() };
        cb(id > 0 ? id : fb);
    });
}

//俱乐部玩法配置(60秒缓存), 用于读取非牌桌俱乐部的收费参数
var clubCfgCache = {};
var CLUB_CFG_MS = 60 * 1000;
function clubConfigOf(clubId, type, cb){
    var cid = Number(clubId) || 0;
    if(!(cid > 0) || !type){ cb(null); return; }
    var key = cid + '_' + type;
    var c = clubCfgCache[key];
    if(c && Date.now() - c.t < CLUB_CFG_MS){ cb(c.cfg); return; }
    db.club_game_get_config_by_club_type(cid, type, function(cfg){
        clubCfgCache[key] = { t: Date.now(), cfg: cfg || null };
        cb(cfg || null);
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

function splitPartnerShare(clubId, amount, roomId, gameType, roomUuid, gameIndex, tableName, statsExtras, done, ratioField, creatorUid){
    if(!(amount > 0) || !(clubId > 0)){ done(amount); return; }
    //费用类收入(进房/表情/洗牌)走独立的 fee_profit_ratio, 抽水走 profit_ratio
    var rf = (ratioField === 'fee_profit_ratio' || ratioField === 'hidden_profit_ratio') ? ratioField : 'profit_ratio';
    loadClubChain(clubId, function(chain){
        //顶级俱乐部(没有上级): 抽水归开桌的合伙人, 上级只拿设置点数, 与下级俱乐部的分配方向保持一致
        //例: 抽水70, 上级点数10% -> 上级7, 二级合伙人63
        if(!chain || chain.length <= 1){
            var topId = (chain && chain[0] && chain[0].id) || clubId;
            db.query('SELECT partner_club_id, ' + rf + ' AS profit_ratio FROM t_partner_stats WHERE club_id = ' + topId +
                ' AND partner_club_id = (SELECT id FROM t_clubs WHERE owner_userid = ' + parseInt(creatorUid || 0) + ' ORDER BY create_time DESC LIMIT 1)' +
                ' AND ' + rf + ' > 0', function(err, rows){
                var list = [];
                (rows || []).forEach(function(r){
                    var r1 = Number(r.profit_ratio) || 0;
                    var pid = Number(r.partner_club_id) || 0;
                    if(pid > 0 && r1 > 0 && r1 <= 100){ list.push({childId: pid, r: r1}); }
                });
                if(err || list.length == 0){ done(amount); return; }
                var remain = amount;
                var pending = list.length;
                var finish = function(){
                    if(--pending === 0){
                        console.log('[分成-顶级] club=' + topId + ' amount=' + amount + ' 合伙人分走=' + round4(amount - remain) + ' 留自己=' + round4(remain));
                        done(round4(remain));
                    }
                };
                list.forEach(function(x){
                    //填X表示给下级X%, 上级留100-X
                    var pay = round4(amount * x.r / 100);
                    if(pay <= 0){ finish(); return; }
                    db.partner_add_stats(topId, x.childId, {partner_profit: pay, partner_total: pay}, function(){
                        //合伙人分成记在合伙人俱乐部自己名下
                        db.add_reward_log(x.childId, 0, "合伙人分成", pay, gameType, roomId, roomUuid, gameIndex, tableName, function(){
                            remain = round4(remain - pay);
                            finish();
                        });
                    });
                });
            });
            return;
        }
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
                var fee = round4(prevBase * (100 - r) / 100);
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
            var chainStr = chain.map(function(x){ return x.id; }).join('>');
            var netLog = function(){ console.log('[分成-链] club=' + clubId + ' amount=' + amount + ' 净留=' + last.pay + ' chain=' + chainStr); };
            if(pending <= 0){ netLog(); done(last.pay); return; }
            var tick = function(){ if(--pending === 0){ netLog(); done(last.pay); } };
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
                    //上级从下级抽走的分成记在上级俱乐部名下
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
//俱乐部牌桌: 金额取后台系统设置(全局固定), 与牌桌/玩法配置无关
exports.chargeRoom = function(conf, userId, kind, roomId, done){
    unifiedCharge(conf && conf.type, function(on){
    if(!on){
        if(done) done();
        return;
    }
    var tableClub = (conf.clubGameConfig && conf.clubGameConfig.clubId) || conf.clubid || 0;
    //扣费: 表情/洗牌各自金额, 扣下来的部分进该玩家所属俱乐部的分账链
    var doCharge = function(amount, clubId){
        amount = Number(amount) || 0;
        if(amount <= 0){
            if(done) done();
            return;
        }
        var label = kind === "emoji" ? "表情扣豆" : "洗牌扣豆";
        deduct(userId, amount, roomId, conf.type, label, 0, function(){
            if(!(clubId > 0)){
                if(done) done();
                return;
            }
            //抽取部分归俱乐部收入(下级俱乐部的收入要按比例分给上级), 并写入奖励明细
            splitPartnerShare(clubId, round4(amount), roomId, conf.type, conf.room_uuid || "", 0, conf.club_table_name || "", null, function(net){
                //奖励明细改为手动领取(超过7天自动到账)
                db.add_reward_log(clubId, 0, label, net, conf.type, roomId, conf.room_uuid || "", 0, conf.club_table_name || "", function(){});
                if(done) done();
            }, 'fee_profit_ratio');
        }, { clubId: clubId, tableName: conf.club_table_name || "" });
    };
    if(!(tableClub > 0)){
        //非俱乐部房间: 仍按房间conf扣, 不进俱乐部分账
        doCharge(kind === "emoji" ? conf.face_score : conf.shuffle_score, 0);
        return;
    }
    loadSysFees(function(fees){
        var amount = kind === "emoji" ? fees.face : fees.shuffle;
        conf.face_score = fees.face;
        conf.shuffle_score = fees.shuffle;
        clubIdOfUser(userId, tableClub, function(clubId){ doCharge(amount, clubId); });
    });
    });
};

//系统固定收费(进场费/表情费/洗牌费): 全局设置, 所有俱乐部牌桌统一按此扣, 不随牌桌/玩法配置变化
var sysFeeCache = null;
var SYS_FEE_MS = 10 * 1000;
function loadSysFees(cb){
    if(sysFeeCache && Date.now() - sysFeeCache.t < SYS_FEE_MS){ cb(sysFeeCache.fees); return; }
    var map = { enterFee: 'club_enter_fee', face: 'club_face_score', shuffle: 'club_shuffle_score' };
    var defs = { enterFee: 1, face: 0.1, shuffle: 0.5 };
    var out = {};
    var pending = 3;
    Object.keys(map).forEach(function(k){
        db.setting_get(map[k], function(v){
            var n = Number(v);
            out[k] = (v == null || v === '' || isNaN(n)) ? defs[k] : n;
            if(--pending === 0){
                sysFeeCache = { t: Date.now(), fees: out };
                cb(out);
            }
        });
    });
}

//进场费: 第一局开局时对每位在坐玩家各扣一次, 金额取系统设置(所有俱乐部牌桌统一固定)
//由 roommgr.hookEnterFee 统一包在各玩法 begin() 前调用, 不需要逐个玩法改
exports.chargeEnterFee = function(roomInfo){
    var conf = roomInfo && roomInfo.conf;
    if(!conf || Number(roomInfo.numOfGames) !== 0){ return; } //只扣第一局
    var tableClub = (conf.clubGameConfig && conf.clubGameConfig.clubId) || conf.clubid || 0;
    if(!(tableClub > 0)){ return; }
    unifiedCharge(conf.type, function(on){
    if(!on){ return; }
    loadSysFees(function(fees){
        var amount = Number(fees.enterFee) || 0;
        if(!(amount > 0)){ return; }
        var charged = roomInfo._enterFeeCharged || (roomInfo._enterFeeCharged = {});
        var seats = roomInfo.seats || [];
        //桌名回填(奖励明细用)
        var fillName = function(cb){
            if(conf.club_table_name){ cb(); return; }
            var tableId = Number(conf.club_table_id) || 0;
            if(!(tableId > 0)){ cb(); return; }
            db.club_get_table(tableId, function(t){
                if(t && t.name){ conf.club_table_name = t.name; }
                cb();
            });
        };
        fillName(function(){
            for(var i = 0; i < seats.length; i++){
                var uid = seats[i] ? (Number(seats[i].userId) || 0) : 0;
                if(!(uid > 0) || charged[uid]){ continue; }
                charged[uid] = 1;
                (function(userId){
                    clubIdOfUser(userId, tableClub, function(clubId){
                        if(!(clubId > 0)){ return; }
                        deduct(userId, amount, roomInfo.id, conf.type, "进场扣豆", 0, function(){
                            //费用全额进该玩家俱乐部的分账链, 上下级比例走 fee_profit_ratio
                            splitPartnerShare(clubId, round4(amount), roomInfo.id, conf.type, conf.room_uuid || "", 0, conf.club_table_name || "", null, function(net){
                                db.add_reward_log(clubId, 0, "进场费", net, conf.type, roomInfo.id, conf.room_uuid || "", 0, conf.club_table_name || "", function(){});
                            }, 'fee_profit_ratio');
                        }, { clubId: clubId, tableName: conf.club_table_name || "" });
                    });
                })(uid);
            }
        });
    });
    });
};

//单局结算抽水/暗水
//deltas: {seatIndex: delta} 本局盈亏(正为赢)
//winners: [seatIndex] 赢家列表
//roomInfo: {roomId, clubId, gameType, roomUuid, gameIndex}
//rules: 俱乐部玩法规则(含rakePercent/hiddenRakePercent/rakePerRound)
// 抽水按"赢家自己所属俱乐部"算: 用该俱乐部的玩法配置扣, 收益进该俱乐部及其上级链;
// 玩家没有俱乐部时回退到牌桌所属俱乐部(保持原行为)
function seatClubId(roomInfo, seatIdx){
    var m = (roomInfo && roomInfo.clubIdOfSeat) || {};
    var cid = Number(m[seatIdx]) || 0;
    return cid > 0 ? cid : (Number(roomInfo && roomInfo.clubId) || 0);
}

// 抽水归属固定为开桌人的俱乐部, 与谁赢无关; 比例按玩法配置
// 普通场没有开桌人时回退到赢家自己的俱乐部
function seatRakeRules(roomInfo, seatIdx, rules, cache, cb){
    //按玩家身份归属: 社长->自己俱乐部, 普通成员->上级俱乐部(结算前由玩法环节算好)
    var rakeMap = (roomInfo && roomInfo.rakeClubOfSeat) || null;
    if(rakeMap && Number(rakeMap[seatIdx]) > 0){
        cb(rules, Number(rakeMap[seatIdx]));
        return;
    }
    if(cache.__cid !== undefined){ cb(rules, cache.__cid); return; }
    var creator = Number(roomInfo && roomInfo.creator) || 0;
    if(!(creator > 0)){
        var c0 = seatClubId(roomInfo, seatIdx);
        cache.__cid = c0;
        cb(rules, c0);
        return;
    }
    db.club_member_clubid(creator, function(cid){
        var finalCid = cid > 0 ? cid : seatClubId(roomInfo, seatIdx);
        cache.__cid = finalCid;
        cb(rules, finalCid);
    });
}

// 按俱乐部汇总后各自分成(明水/暗水分别按比例)
function splitRakeByClub(roomInfo, rakeByClub, hiddenByClub, done){
    var cids = [];
    Object.keys(rakeByClub).forEach(function(c){ if(cids.indexOf(c) < 0) cids.push(c); });
    Object.keys(hiddenByClub).forEach(function(c){ if(cids.indexOf(c) < 0) cids.push(c); });
    if(cids.length === 0){ done(); return; }
    var left = cids.length;
    var tick = function(){ if(--left === 0){ done(); } };
    cids.forEach(function(cid){
        var clubId = Number(cid) || 0;
        var rake = rakeByClub[cid] || 0;
        var hidden = hiddenByClub[cid] || 0;
        splitPartnerShare(clubId, rake, roomInfo.roomId, roomInfo.gameType, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "",
            {rake: rake}, function(rakeNet){
            splitPartnerShare(clubId, hidden, roomInfo.roomId, roomInfo.gameType, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "",
                {hidden_rake: hidden}, function(hiddenNet){
                var total = round4(rake + hidden);
                var net = round4(rakeNet + hiddenNet);
                //俱乐部自己的奖励明细: 抽水/暗水按"扣完上级后实得"记(与总览一致); 手动领取
                var factor = total > 0 ? net / total : 0;
                if(rake > 0){
                    db.add_reward_log(clubId, 0, "抽水", round4(rake * factor), roomInfo.gameType, roomInfo.roomId, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", function(){});
                }
                if(hidden > 0){
                    db.add_reward_log(clubId, 0, "暗水", round4(hidden * factor), roomInfo.gameType, roomInfo.roomId, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", function(){});
                }
                tick();
            }, 'hidden_profit_ratio', Number(roomInfo.creator) || 0);
        }, 'profit_ratio', Number(roomInfo.creator) || 0);
    });
}

exports.chargeRake = function(deltas, winners, roomInfo, rules, done){
    unifiedCharge(roomInfo && roomInfo.gameType, function(on){
    if(!on || !rules){
        console.log('[抽水]跳过 room=' + (roomInfo && roomInfo.roomId) + ' 原因=' + (!on ? '收费模式未开启(unified_charge!=1)' : '无俱乐部规则(rules为空)'));
        if(done) done();
        return;
    }
    var list = (winners || []).filter(function(s){ return (deltas[s] || 0) > 0; });
    if(list.length === 0){
        console.log('[抽水]跳过 room=' + (roomInfo && roomInfo.roomId) + ' 原因=本局没有赢家');
        if(done) done();
        return;
    }
    var cache = {};
    var rakeByClub = {};
    var hiddenByClub = {};
    var pending = list.length;
    list.forEach(function(seatIdx){
        var delta = deltas[seatIdx] || 0;
        seatRakeRules(roomInfo, seatIdx, rules, cache, function(r, clubId){
            //该玩家俱乐部是整场抽水模式: 单局不扣
            if(!r || !(clubId > 0) || !r.rakePerRound || (r.rakePercent <= 0 && r.hiddenRakePercent <= 0)){
                console.log('[抽水]跳过 seat=' + seatIdx + ' uid=' + ((roomInfo.userIdOfSeat || [])[seatIdx] || 0) +
                    ' 原因=' + (!r ? '无规则' : (!(clubId > 0) ? '赢家不属于任何俱乐部' :
                    (!r.rakePerRound ? '抽水方式是整场(本局不扣)' : '抽水比例=0'))) +
                    ' clubId=' + clubId + ' rake=' + (r ? r.rakePercent : '-') + ' hidden=' + (r ? r.hiddenRakePercent : '-'));
                if(--pending === 0){ finish(); }
                return;
            }
            var rake = round4(delta * r.rakePercent / 100);
            var hiddenRake = round4(delta * r.hiddenRakePercent / 100);
            var totalDeduct = round4(rake + hiddenRake);
            if(totalDeduct <= 0){
                if(--pending === 0){ finish(); }
                return;
            }
            //扣赢家
            deduct(roomInfo.userIdOfSeat[seatIdx], totalDeduct, roomInfo.roomId, roomInfo.gameType, "抽水", 0, function(){
                console.log('[抽水]扣除 uid=' + roomInfo.userIdOfSeat[seatIdx] + ' 明水=' + rake + ' 暗水=' + hiddenRake + ' clubId=' + clubId);
                rakeByClub[clubId] = round4((rakeByClub[clubId] || 0) + rake);
                hiddenByClub[clubId] = round4((hiddenByClub[clubId] || 0) + hiddenRake);
                if(--pending === 0){ finish(); }
            }, {clubId: clubId, tableName: roomInfo.tableName || ""});
        });
    });
    function finish(){
        splitRakeByClub(roomInfo, rakeByClub, hiddenByClub, function(){ if(done) done(); });
    }
    });
};

//整场结束抽水/暗水(按总盈利)
//totalDeltas: {seatIndex: totalDelta} 整场总盈亏
exports.chargeRakeTotal = function(totalDeltas, winners, roomInfo, rules, done){
    unifiedCharge(roomInfo && roomInfo.gameType, function(on){
    if(!on || !rules){
        if(done) done();
        return;
    }
    var list = (winners || []).filter(function(s){ return (totalDeltas[s] || 0) > 0; });
    if(list.length === 0){
        if(done) done();
        return;
    }
    var cache = {};
    var rakeByClub = {};
    var hiddenByClub = {};
    var pending = list.length;
    list.forEach(function(seatIdx){
        var delta = totalDeltas[seatIdx] || 0;
        seatRakeRules(roomInfo, seatIdx, rules, cache, function(r, clubId){
            //该玩家俱乐部是每局抽水模式: 整场不再扣
            if(!r || !(clubId > 0) || r.rakePerRound || (r.rakePercent <= 0 && r.hiddenRakePercent <= 0)){
                if(--pending === 0){ finish(); }
                return;
            }
            var rake = round4(delta * r.rakePercent / 100);
            var hiddenRake = round4(delta * r.hiddenRakePercent / 100);
            var totalDeduct = round4(rake + hiddenRake);
            if(totalDeduct <= 0){
                if(--pending === 0){ finish(); }
                return;
            }
            deduct(roomInfo.userIdOfSeat[seatIdx], totalDeduct, roomInfo.roomId, roomInfo.gameType, "抽水", 0, function(){
                rakeByClub[clubId] = round4((rakeByClub[clubId] || 0) + rake);
                hiddenByClub[clubId] = round4((hiddenByClub[clubId] || 0) + hiddenRake);
                if(--pending === 0){ finish(); }
            }, {clubId: clubId, tableName: roomInfo.tableName || ""});
        });
    });
    function finish(){
        splitRakeByClub(roomInfo, rakeByClub, hiddenByClub, function(){ if(done) done(); });
    }
    });
};

//整场结束扣房费
//payerSeatIndex: 支付方座位(0=比赛场出 1=大赢家出)
//bigWinnerSeat: 大赢家座位
exports.chargeRoomFee = function(roomInfo, rules, payerSeatIndex, bigWinnerSeat, done){
    unifiedCharge(roomInfo && roomInfo.gameType, function(on){
    if(!on || !rules){
        if(done) done();
        return;
    }
    //大赢家出: 用大赢家自己所属俱乐部的房费配置, 收入进该俱乐部链
    var userId = roomInfo.userIdOfSeat[bigWinnerSeat];
    if(!userId){
        if(done) done();
        return;
    }
    var tableClub = Number(roomInfo.clubId) || 0;
    clubIdOfUser(userId, tableClub, function(clubId){
        if(!(clubId > 0)){ if(done) done(); return; }
        var useTable = (Number(clubId) === tableClub);
        var run = function(cfg){
            var c = cfg || {};
            var fee = useTable ? (Number(rules.roomFee) || 0) : (Number(c.room_fee) || 0);
            var payer = useTable ? Number(rules.roomFeePayer) : (c.room_fee_payer != null ? Number(c.room_fee_payer) : 0);
            if(!(fee > 0) || payer === 0){
                //比赛场出(不扣)
                if(done) done();
                return;
            }
            deduct(userId, fee, roomInfo.roomId, roomInfo.gameType, "房费", 0, function(){
                //房费也属于俱乐部收入, 需要按比例逐级上缴给上级俱乐部
                splitPartnerShare(clubId, fee, roomInfo.roomId, roomInfo.gameType, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", null, function(net){
                    //奖励明细: 房费按扣完上级后实得记; 改为手动领取(超过7天自动到账)
                    db.add_reward_log(clubId, 0, "房费", net, roomInfo.gameType, roomInfo.roomId, roomInfo.roomUuid, roomInfo.gameIndex, roomInfo.tableName || "", function(){});
                    if(done) done();
                });
            }, {clubId: clubId, tableName: roomInfo.tableName || ""});
        };
        if(useTable){ run(rules); return; }
        clubConfigOf(clubId, roomInfo.gameType, run);
    });
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
                userIdOfSeat: userIdOfSeat,
                clubIdOfSeat: {}
            };
            var maxGames = Number(conf.maxGames) || 0;
            var isLast = !!data.final || (maxGames > 0 && (Number(roomInfo.numOfGames) || 0) >= maxGames);

            //抽水按赢家自己所属俱乐部: 先把参与抽水的赢家俱乐部查出来
            var needSeats = roundWinners.concat(totalWinners).filter(function(s, i, a){ return a.indexOf(s) === i; });
            var fillSeatClubs = function(cb){
                if(needSeats.length === 0){ cb(); return; }
                var pending = needSeats.length;
                needSeats.forEach(function(si){
                    var uid = Number(userIdOfSeat[si]) || 0;
                    if(!(uid > 0)){ if(--pending === 0){ cb(); } return; }
                    db.club_member_clubid(uid, function(cid){
                        if(Number(cid) > 0){ cri.clubIdOfSeat[si] = Number(cid); }
                        if(--pending === 0){ cb(); }
                    });
                });
            };

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
                //整场抽水: 每个赢家按自己俱乐部的抽水模式决定, 每局模式在chargeRakeTotal内部跳过
                exports.chargeRakeTotal(totalDeltas, totalWinners, cri, rules, afterTotal);
            };
            fillSeatClubs(function(){
                exports.chargeRake(deltas, roundWinners, cri, rules, afterRake);
            });
        });
    });
};

