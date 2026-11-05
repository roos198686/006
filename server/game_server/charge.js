//宝宝玩法扣豆: 进房首局开局 / 房间发表情 / 点洗牌 三种扣费, 并按比率把扣掉金额的一部分分给用户所属俱乐部的代理(社长)
//扣费额度来自全局玩法配置 t_game_config.tai_rules:
//   enter_cost   进房后第一局扣多少豆
//   emoji_cost   每次发表情扣多少豆
//   shuffle_cost 每次点洗牌扣多少豆
//   agent_rate   分给代理的百分比(0~100)
var db = require("../utils/db");

var CACHE_MS = 60 * 1000;
var cache = {};

function toNum(v){
    var n = Number(v);
    return isFinite(n) && n > 0 ? n : 0;
}

//读配置(60秒缓存, 改后台最多1分钟生效)
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

//扣豆并写流水; 同时按比率给代理加豆
function deduct(userId, amount, roomId, gameType, changeType, agentRate, done){
    if(!(amount > 0)){
        if(done) done();
        return;
    }
    db.add_user_gems(userId, -amount, function(ok){
        if(agentRate > 0){
            db.get_user_agent(userId, function(agentId){
                var share = agentId ? Math.floor(amount * agentRate / 100) : 0;
                if(share > 0){
                    db.add_user_gems(agentId, share, null, {roomid: roomId, gameType: gameType, changeType: "代理分成"});
                }
                if(done) done();
            });
        }
        else if(done){
            done();
        }
    }, {roomid: roomId, gameType: gameType, changeType: changeType});
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
