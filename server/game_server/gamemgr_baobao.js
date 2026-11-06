// 宝宝(6张)游戏管理器 —— 两种玩法共用:
//   baobao_mian  6张免摆:系统遍历所有拆分取最大牌型,整手比大小
//   baobao_shou  6张手动摆:玩家摆前2/中2/后2三道,逐道独立结算
// 牌 id 编码: id = (rank-2)*4 + suit, rank 2..14(J=11,Q=12,K=13,A=14), suit 0黑桃 1红桃 2梅花 3方块
// 花色优先级: 黑桃 > 红桃 > 梅花 > 方片 (suit 越小越大)
// 可配置项全部走 t_game_config.tai_rules JSON:
//   公共: banker_mode(1有庄/0无庄,默认1) arrange_timeout(摆牌秒数,默认60)
//   免摆牌型倍率: m_sf6 m_sf5 m_4 m_33 m_3p1 m_f6 m_s6 m_f5 m_s5 m_p3 m_n9 m_san
//   手摆道倍率: s_bao_2..s_bao_14(13张宝独立) s_dian9 s_dian8 s_dian7 s_dianlow
//   手摆: wulong_check(1校验乌龙,默认1) tongdian_mode(同点比较:1比最大牌花色/2和/3先比最大单张点数再比花色,默认3)
var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var db = require("../utils/db");
var charge = require("./charge");

var games = {};

// ============ 牌工具 ============
function buildDeck(){
    var deck = [];
    for(var rank = 2; rank <= 14; ++rank){
        for(var s = 0; s < 4; ++s){ deck.push((rank - 2) * 4 + s); }
    }
    return deck;
}
function rankOf(id){ return Math.floor(id / 4) + 2; }
function suitOf(id){ return id % 4; }
function shuffle(arr){
    for(var i = arr.length - 1; i > 0; --i){
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
}
// 点数(手摆算点用): 2..10=面值, J/Q/K=0, A=1
function dianVal(rank){ if(rank >= 11 && rank <= 13) return 0; return rank == 14 ? 1 : rank; }

// 顺子检测: ranks 为不含重复点的数组, 返回顶端点数(A可作1, A23456顶端为6), 非顺返回 -1
function straightTop(ranks){
    var u = ranks.slice().sort(function(a,b){ return a-b; });
    var seq = true;
    for(var i = 1; i < u.length; ++i){ if(u[i] != u[i-1] + 1){ seq = false; break; } }
    if(seq) return u[u.length - 1];
    if(u.indexOf(14) >= 0){
        var v = u.map(function(r){ return r == 14 ? 1 : r; }).sort(function(a,b){ return a-b; });
        var ok = true;
        for(var i = 1; i < v.length; ++i){ if(v[i] != v[i-1] + 1){ ok = false; break; } }
        if(ok) return v[v.length - 1];
    }
    return -1;
}
// 顺子排序主键: 带A的两档最优先 —— A在末尾(9TJQKA/10JQKA)=100 最大, A在开头(A23456/A2345)=99 第二大,
// 其余按顶端自然点数(K=13 … 2开头最小), 同点数再比花色
function straightPower(ranks){
    var u = ranks.slice().sort(function(a,b){ return a-b; });
    var seq = true;
    for(var i = 1; i < u.length; ++i){ if(u[i] != u[i-1] + 1){ seq = false; break; } }
    if(seq && u[u.length - 1] == 14) return 100;      // 大顺: A 当最大
    if(u.indexOf(14) >= 0){
        var v = u.map(function(r){ return r == 14 ? 1 : r; }).sort(function(a,b){ return a-b; });
        var ok = v[0] == 1;
        for(var j = 1; j < v.length; ++j){ if(v[j] != v[j-1] + 1){ ok = false; break; } }
        if(ok) return 99;                             // 小顺: A 当 1
    }
    return u[u.length - 1];
}
// 顺子的虚拟点列(降序,A当1排最小), 供 keys 使用; 首位换成排序主键
function straightKeys(ranks){
    var out;
    var hasA = ranks.indexOf(14) >= 0;
    var u = ranks.slice().sort(function(a,b){ return a-b; });
    var seq = true;
    for(var i = 1; i < u.length; ++i){ if(u[i] != u[i-1] + 1){ seq = false; break; } }
    if(seq && !hasA){
        out = u.slice().reverse();
    } else if(hasA){
        var v = u.map(function(r){ return r == 14 ? 1 : r; });
        var vs = v.slice().sort(function(a,b){ return a-b; });
        var ok = true;
        for(var k = 1; k < vs.length; ++k){ if(vs[k] != vs[k-1] + 1){ ok = false; break; } }
        out = (ok ? vs : u).slice().reverse();
    } else {
        out = u.slice().reverse();
    }
    return [straightPower(ranks)].concat(out);
}

// ============ 免摆: 整手6张牌型识别 ============
// 牌型 level: 12=6同花顺 11=5同花顺带1 10=4条带2单 9=3条带3条 8=3条带对带1 7=6同花
//             6=6连顺 5=5同花带1 4=5连顺带1 3=3对 2=3组9 1=散牌
var MIAN_NAMES = {12:"6同花顺",11:"5同花顺带1",10:"4条带2单",9:"3条带3条",8:"3条带对带1",7:"6同花",6:"6连顺",5:"5同花带1",4:"5连顺带1",3:"3对",2:"3组9",1:"散牌"};
var MIAN_RATE_KEYS = {12:"m_sf6",11:"m_sf5",10:"m_4",9:"m_33",8:"m_3p1",7:"m_f6",6:"m_s6",5:"m_f5",4:"m_s5",3:"m_p3",2:"m_n9",1:"m_san"};

function identMian(cards){
    var ranks = cards.map(rankOf);
    var suits = cards.map(suitOf);
    var cnt = {};
    ranks.forEach(function(r){ cnt[r] = (cnt[r] || 0) + 1; });
    var uniqRanks = Object.keys(cnt).map(Number);
    var suitCnt = {};
    suits.forEach(function(s){ suitCnt[s] = (suitCnt[s] || 0) + 1; });
    var desc = ranks.slice().sort(function(a,b){ return b-a; });

    // 6张同花
    var flush6 = false;
    for(var s in suitCnt){ if(suitCnt[s] == 6) flush6 = true; }
    var top6 = uniqRanks.length == 6 ? straightTop(uniqRanks) : -1;
    // 1) 6同花顺
    if(flush6 && top6 > 0){
        return { level:12, keys: straightKeys(uniqRanks), cards: cards.slice() };
    }
    // 5张组合枚举辅助
    function combos5(){
        var out = [];
        for(var i = 0; i < 6; ++i){
            var c = cards.slice(); c.splice(i, 1);
            c._kick = cards[i];
            out.push(c);
        }
        return out;
    }
    function flushAll(c5){ var s0 = suitOf(c5[0]); for(var i = 1; i < 5; ++i){ if(suitOf(c5[i]) != s0) return false; } return true; }
    // 2) 5同花顺带1
    var c5s = combos5();
    for(var i = 0; i < c5s.length; ++i){
        var c5 = c5s[i];
        if(!flushAll(c5)) continue;
        var r5 = c5.map(rankOf);
        if(straightTop(r5) > 0){
            return { level:11, keys: straightKeys(r5).concat([rankOf(c5._kick)]), kick: c5._kick, cards: cards.slice() };
        }
    }
    // 3) 4条带2单(含带对)
    for(var r in cnt){
        if(cnt[r] == 4){
            var kickers = cards.filter(function(c){ return rankOf(c) != r; }).map(rankOf).sort(function(a,b){ return b-a; });
            return { level:10, keys: [Number(r)].concat(kickers), cards: cards.slice() };
        }
    }
    // 4) 3条带3条
    var triples = uniqRanks.filter(function(r){ return cnt[r] == 3; }).sort(function(a,b){ return b-a; });
    if(triples.length == 2){
        return { level:9, keys: triples, cards: cards.slice() };
    }
    // 5) 3条带对带1
    var pairs = uniqRanks.filter(function(r){ return cnt[r] == 2; }).sort(function(a,b){ return b-a; });
    var singles = uniqRanks.filter(function(r){ return cnt[r] == 1; }).sort(function(a,b){ return b-a; });
    if(triples.length == 1 && pairs.length == 1 && singles.length == 1){
        return { level:8, keys: [triples[0], pairs[0], singles[0]], cards: cards.slice() };
    }
    // 6) 6同花(不成顺)
    if(flush6){
        return { level:7, keys: desc, cards: cards.slice() };
    }
    // 7) 6连顺(不同花)
    if(top6 > 0){
        return { level:6, keys: [straightPower(uniqRanks)], cards: cards.slice() };
    }
    // 8) 5同花带1(不连续)
    for(var i = 0; i < c5s.length; ++i){
        var c5 = c5s[i];
        if(!flushAll(c5)) continue;
        var r5d = c5.map(rankOf).sort(function(a,b){ return b-a; });
        return { level:5, keys: r5d.concat([rankOf(c5._kick)]), kick: c5._kick, cards: cards.slice() };
    }
    // 9) 5连顺带1
    for(var i = 0; i < c5s.length; ++i){
        var c5 = c5s[i];
        var r5 = c5.map(rankOf);
        var tp = straightTop(r5);
        if(tp > 0){
            return { level:4, keys: [straightPower(r5), rankOf(c5._kick)], kick: c5._kick, cards: cards.slice() };
        }
    }
    // 10) 3对
    if(pairs.length == 3){
        return { level:3, keys: pairs, cards: cards.slice() };
    }
    // 11) 3组9: 六张分三组,每组点数和为9 (10/J/Q/K=0, A=1)
    if(canSplitNines(cards)){
        return { level:2, keys: desc, cards: cards.slice() };
    }
    // 12) 散牌
    return { level:1, keys: desc, cards: cards.slice() };
}

// 3组9判定: 枚举15种 (2,2,2) 分法
function canSplitNines(cards){
    var v = cards.map(function(c){ return dianVal(rankOf(c)); });
    var idx = [0,1,2,3,4,5];
    var pairs = [];
    for(var a = 0; a < 6; ++a) for(var b = a+1; b < 6; ++b) pairs.push([a,b]);
    for(var i = 0; i < pairs.length; ++i){
        var p1 = pairs[i];
        var rest1 = idx.filter(function(x){ return x != p1[0] && x != p1[1]; });
        for(var j = 0; j < rest1.length; ++j){
            for(var k = j+1; k < rest1.length; ++k){
                var p2 = [rest1[j], rest1[k]];
                var p3 = rest1.filter(function(x){ return x != p2[0] && x != p2[1]; });
                if(v[p1[0]] + v[p1[1]] == 9 && v[p2[0]] + v[p2[1]] == 9 && v[p3[0]] + v[p3[1]] == 9) return true;
            }
        }
    }
    return false;
}

// 整手花色比较: 6张按点数降序排开, 逐张找同点牌比花色(suit小为大)
function cmpWholeSuit(cardsA, cardsB){
    var sa = cardsA.slice().sort(function(a,b){ return rankOf(b) - rankOf(a) || suitOf(a) - suitOf(b); });
    var sb = cardsB.slice().sort(function(a,b){ return rankOf(b) - rankOf(a) || suitOf(a) - suitOf(b); });
    for(var i = 0; i < 6; ++i){
        if(rankOf(sa[i]) == rankOf(sb[i]) && suitOf(sa[i]) != suitOf(sb[i])){
            return suitOf(sa[i]) < suitOf(sb[i]) ? 1 : -1;
        }
    }
    return 0;
}

// 免摆比牌: 返回 >0 a胜, <0 b胜, 0 平
function compareMian(a, b){
    if(a.level != b.level) return a.level > b.level ? 1 : -1;
    var n = Math.max(a.keys.length, b.keys.length);
    for(var i = 0; i < n; ++i){
        var ka = a.keys[i] || 0, kb = b.keys[i] || 0;
        if(ka != kb) return ka > kb ? 1 : -1;
    }
    return cmpWholeSuit(a.cards, b.cards);
}

function mianRate(level, tr){
    var key = MIAN_RATE_KEYS[level];
    var defs = {m_sf6:12, m_sf5:10, m_4:8, m_33:6, m_3p1:5, m_f6:4, m_s6:4, m_f5:3, m_s5:3, m_p3:2, m_n9:2, m_san:1};
    var v = tr && tr[key] != null ? Number(tr[key]) : defs[key];
    return v > 0 ? v : defs[key];
}

// ============ 手摆: 单道(2张)评估 ============
// 返回 {bao, key, dian, sum, maxRank, maxSuit, cards:[c1,c2], rank, suit}
function evalDao(c1, c2){
    var r1 = rankOf(c1), r2 = rankOf(c2);
    if(r1 == r2){
        // 宝(对子): 宝A > 宝K/Q/J > 宝10~2 → key=rank, suit 取两张中大的花色
        return { bao:true, key:r1, rank:r1, suit:Math.min(suitOf(c1), suitOf(c2)), cards:[c1,c2] };
    }
    var v1 = dianVal(r1), v2 = dianVal(r2);
    return {
        bao:false, key:(v1 + v2) % 10, dian:(v1 + v2) % 10, sum:v1 + v2,
        maxRank: r1 > r2 ? r1 : r2,
        maxSuit: r1 > r2 ? suitOf(c1) : suitOf(c2),
        cards:[c1,c2]
    };
}

// 花色比较: 黑桃>红桃>梅花>方片(suit 越小越大)
function cmpSuit(s1, s2){ return s1 < s2 ? 1 : (s1 > s2 ? -1 : 0); }

// 单道比较: >0 a胜, <0 b胜, 0 和
// 1) 宝 vs 散牌 → 宝胜
// 2) 宝 vs 宝: 比对子点数, 相同比花色
// 3) 散牌 vs 散牌: 比点数(9最大/0最小), 点数相同:
//    0点: 模式 1=比本组最大牌花色, 2=和
//    非0点: 总和不相等比总和; 总和相等按模式 1=比最大牌花色, 3=先比最大单张点数再比最大牌花色, 2=和
function cmpDao(a, b, mode){
    if(a.bao != b.bao) return a.bao ? 1 : -1;
    if(a.bao){
        if(a.key != b.key) return a.key > b.key ? 1 : -1;
        return cmpSuit(a.suit, b.suit);
    }
    if(a.dian != b.dian) return a.dian > b.dian ? 1 : -1;
    if(a.dian == 0) return mode == 2 ? 0 : cmpSuit(a.maxSuit, b.maxSuit);
    if(a.sum != b.sum) return a.sum > b.sum ? 1 : -1;
    if(mode == 2) return 0;
    if(mode != 3) return cmpSuit(a.maxSuit, b.maxSuit);
    if(a.maxRank != b.maxRank) return a.maxRank > b.maxRank ? 1 : -1;
    return cmpSuit(a.maxSuit, b.maxSuit);
}

// 单道倍率(按赢家道型)
function daoRate(dao, tr){
    tr = tr || {};
    function g(k, def){ var v = tr[k] != null ? Number(tr[k]) : def; return v > 0 ? v : def; }
    if(dao.bao){
        var defs = {14:10, 13:6, 12:6, 11:6};
        var def = defs[dao.rank] || 5;
        // 13张宝独立配置 s_bao_2..s_bao_14; 老配置的合并键兜底
        var oldKey = dao.rank == 14 ? "s_bao_a" : (dao.rank >= 11 ? "s_bao_kqj" : "s_bao_num");
        var v = tr["s_bao_" + dao.rank] != null ? Number(tr["s_bao_" + dao.rank]) : (tr[oldKey] != null ? Number(tr[oldKey]) : def);
        return v > 0 ? v : def;
    }
    if(dao.dian == 9) return g("s_dian9", 4);
    if(dao.dian == 8) return g("s_dian8", 3);
    if(dao.dian == 7) return g("s_dian7", 2);
    return g("s_dianlow", 1);
}

// 道型描述(结算展示)
function daoDesc(dao){
    if(dao.bao){
        var names = {11:"J", 12:"Q", 13:"K", 14:"A"};
        return "对" + (names[dao.rank] || dao.rank);
    }
    return dao.dian + "点";
}

// 校验 前>=中>=后(前道最大,尾道最小); 返回 true=合法
function daoOrderOk(daos, mode){
    return cmpDao(daos[0], daos[1], mode) >= 0 && cmpDao(daos[1], daos[2], mode) >= 0;
}

// 手摆自动最优摆法: 枚举90种 (2,2,2) 分法, 取满足 前>=中>=后 且 (前,中,后) 字典序最大
function autoArrange(cards, mode){
    var best = null;
    var idx = [0,1,2,3,4,5];
    var pairs = [];
    for(var a = 0; a < 6; ++a) for(var b = a+1; b < 6; ++b) pairs.push([a,b]);
    function better(x, y){ // x 是否优于 y (按 前,中,后 字典序)
        if(y == null) return true;
        for(var d = 0; d <= 2; ++d){
            var c = cmpDao(x[d], y[d], mode);
            if(c != 0) return c > 0;
        }
        return false;
    }
    for(var i = 0; i < pairs.length; ++i){
        var p1 = pairs[i];
        var rest1 = idx.filter(function(x){ return x != p1[0] && x != p1[1]; });
        for(var j = 0; j < rest1.length; ++j){
            for(var k = j+1; k < rest1.length; ++k){
                var p2 = [rest1[j], rest1[k]];
                var p3 = rest1.filter(function(x){ return x != p2[0] && x != p2[1]; });
                var daos = [
                    evalDao(cards[p1[0]], cards[p1[1]]),
                    evalDao(cards[p2[0]], cards[p2[1]]),
                    evalDao(cards[p3[0]], cards[p3[1]])
                ];
                // 前/中/后 三道任意排列, 找满足递增的摆法
                var perms = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
                for(var m = 0; m < perms.length; ++m){
                    var pm = perms[m];
                    var arr = [daos[pm[0]], daos[pm[1]], daos[pm[2]]];
                    if(!daoOrderOk(arr, mode)) continue;
                    if(better(arr, best)) best = arr;
                }
            }
        }
    }
    // 极端兜底(不会到达): 任意分法
    if(best == null){
        best = [evalDao(cards[0], cards[1]), evalDao(cards[2], cards[3]), evalDao(cards[4], cards[5])];
    }
    return best;
}

// ============ 游戏辅助 ============
function getGameByUserID(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return null;
    return games[roomId];
}

function collectSeats(roomInfo, readyUids){
    var arr = [];
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(rs.userId > 0 && (readyUids == null || readyUids.indexOf(rs.userId) >= 0)){
            arr.push({roomSeatIndex:i, userId:rs.userId, name:rs.name, score:rs.score || 0, roomWin:rs.roomWin || 0});
        }
    }
    return arr;
}

// 仅发给本局参与者(未准备的观战者不弹确认/亮牌/结算窗)
function sendToGameSeats(game, ev, data){
    for(var i = 0; i < game.gameSeats.length; ++i){
        userMgr.sendMsg(game.gameSeats[i].userId, ev, data);
    }
}
// 发给房内但未参与本局的玩家(观战): 让他们能看到进行中的牌局, 但不收确认/结算等弹窗数据
function sendToWatchers(game, ev, data){
    var roomInfo = roomMgr.getRoom(game.roomId);
    if(!roomInfo || !roomInfo.seats) return;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var uid = roomInfo.seats[i].userId;
        if(uid <= 0) continue;
        var inGame = false;
        for(var j = 0; j < game.gameSeats.length; ++j){
            if(game.gameSeats[j].userId == uid){ inGame = true; break; }
        }
        if(!inGame) userMgr.sendMsg(uid, ev, data);
    }
}
function getSeatsInfo(game){
    var info = [];
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        info.push({
            userid: s.userId,
            name: s.name,
            sex: s.sex || 0,
            seatindex: i,
            roomSeatIndex: s.roomSeatIndex,
            count: s.holds.length,
            arranged: !!s.arranged,
            mianFree: !!s.mianFree
        });
    }
    return info;
}

function taiRules(game){
    var tr = game.conf.taiRules;
    if(tr != null && typeof tr === "string"){
        try{ tr = JSON.parse(tr); }catch(e){ tr = null; }
    }
    return tr || {};
}
function isShou(game){ return game.conf.type == "baobao_shou"; }
function bankerMode(game){
    // 牌桌级配置(添加牌桌时选有庄/无庄)优先, 老牌桌/老房间回落后台玩法配置
    if(game.conf.banker_mode != null) return !!Number(game.conf.banker_mode);
    var tr = taiRules(game); return tr.banker_mode != null ? !!Number(tr.banker_mode) : true;
}
function wulongCheck(game){ var tr = taiRules(game); return tr.wulong_check != null ? !!Number(tr.wulong_check) : true; }
// 同点比较模式(后台 tai_rules.tongdian_mode): 1=比最大牌花色 2=和(打平) 3=先比最大单张点数再比花色
// 老配置 tongdian_flower 兼容: 1→1(比花色), 0→3(老的"和"改为完整比法)
function tongdianMode(game){
    var tr = taiRules(game);
    var m = Number(tr.tongdian_mode);
    if(!(m >= 1 && m <= 3)) m = tr.tongdian_flower != null ? (Number(tr.tongdian_flower) ? 1 : 3) : 3;
    return m;
}
function arrangeTimeout(game){ var tr = taiRules(game); var v = Number(tr.arrange_timeout); return v > 0 ? v : 60; }
// 免摆发牌后确认弹窗倒计时(秒): 后台可配 confirm_timeout, 未配则用 arrange_timeout(后台“亮牌前等待”), 再兜底 60
function confirmTimeout(game){
    var tr = taiRules(game);
    var v = Number(tr.confirm_timeout);
    if(v > 0) return v;
    v = Number(tr.arrange_timeout);
    return v > 0 ? v : 60;
}
// 亮牌+特效总耗时(毫秒): 服务端等它全部播完再推 game_over_push,
// 让结算倒计时起点=客户端结算弹窗真正弹出的时刻, 特效再长也不会吃掉倒计时
// 牌型特效动画耗时(客户端 BBGame._playHandFx 的动画开关): 只有后台打开对应开关才播, 没开不能预留等待
var FX_ANIM_KEYS = {12:"anim_sf6",11:"anim_sf5",10:"anim_4",9:"anim_33",8:"anim_3p1",7:"anim_f6",6:"anim_s6",5:"anim_f5",4:"anim_s5",3:"anim_p3",2:"anim_n9"};
function handFxMs(level, tr){
    if(!(level >= 2)) return 0;
    var key = FX_ANIM_KEYS[level];
    // anim值 1=fire(1.6s) 2=bomb(1.2s), 统一按fire估多留一点
    if(key && Number(tr[key]) > 0) return 1900 + 1600;
    return 0;
}
function revealFxMs(game){
    // 与客户端 onBbReveal 的真实节奏对齐: 3道 × 每家1.5秒(每步翻2张+报牌语音), 两种玩法一致。
    // 之前手摆多算了打枪等待、免摆写死3秒, 都会造成"亮牌结束→结算弹窗"长时间空等。
    var ms = game.gameSeats.length * 4500;
    var tr = taiRules(game);
    // 打枪/全垒打: 客户端只在后台开启动画开关时才播
    var dq = calcDaqiang(game);
    if(Number(tr.anim_dq) > 0) ms += dq.list.length * 1500;
    if(Number(tr.anim_qld) > 0 && dq.quanleida.length) ms += 2000;
    // 牌型特效: 同样按后台开关计
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        if(s && s.mian) ms += handFxMs(s.mian.level, tr);
    }
    // 客户端亮完停留0.25秒后弹结算; 提前一点推送, 保证结算数据已到达客户端
    return ms + 200;
}
// 结算弹窗倒计时(秒), 到点未点继续自动进入下一局
function resultTimeout(game){ var tr = taiRules(game); var v = Number(tr.result_timeout); return v > 0 ? v : 30; }

// 剩余整秒(不用绝对时间戳, 各玩家设备时钟不同会导致倒计时不一致)
function remainSec(deadline){ return deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : 0; }
// 清全部定时器
function clearGameTimers(game){
    if(game.arrangeTimer){ clearTimeout(game.arrangeTimer); game.arrangeTimer = null; }
    if(game.confirmTimer){ clearTimeout(game.confirmTimer); game.confirmTimer = null; }
    if(game.resultTimer){ clearTimeout(game.resultTimer); game.resultTimer = null; }
}
// 进入下一局(自动续局): 上一局参与者 + 本局进行中已点开始的新玩家(等本局结束后自动加入)
function nextRound(game){
    clearGameTimers(game);
    var roomId = game.roomId;
    var participants = game.gameSeats.map(function(s){ return s.userId; });
    delete games[roomId];
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return;
    // 洗牌标记跨局传递: 房对象与游戏对象都写一份, 保证下一局 bb_start 一定带 shuffle
    if(game.shuffleNext) roomInfo._shuffleNext = true;
    var max = roomInfo.conf.maxGames || 0;
    if(max > 0 && roomInfo.numOfGames >= max) return;
    var uids = participants.slice();
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(rs.userId > 0 && rs.ready && uids.indexOf(rs.userId) < 0) uids.push(rs.userId);
    }
    // 人数不足两人(结算期间有人被请出/退出): 直接散场, 避免卡在"等待下一局"
    if(uids.length < 2){
        console.log("[宝宝] 下一局人数不足(" + uids.length + "), 散场 room=" + roomId);
        userMgr.brocastInRoom(roomId, 'dispress_push', {});
        setTimeout(function(){ roomMgr.destroy(roomId); }, 300);
        return;
    }
    for(var i = 0; i < roomInfo.seats.length; ++i){
        roomInfo.seats[i].ready = uids.indexOf(roomInfo.seats[i].userId) >= 0;
    }
    // 开局失败自动重试: ready 标记被并发流程清掉时不会永久停住
    var tries = 0;
    var tryBegin = function(){
        if(games[roomId] != null) return;
        var room = roomMgr.getRoom(roomId);
        if(room == null) return;
        console.log("[宝宝] 自动下一局 room=" + roomId + " ready=" + room.seats.map(function(s){ return s.userId + ":" + s.ready; }).join(","));
        exports.begin(room);
        if(games[roomId] == null){
            console.log("[宝宝] 下一局开局未成功 room=" + roomId + " tries=" + tries);
            if((++tries) < 5) setTimeout(tryBegin, 300);
        }
    };
    setTimeout(tryBegin, 50);
}
// 全员完成当前阶段才推进: 必须所有"仍在房间里"的参与者都确认(人工点或各自倒计时到点自动确认)
function checkAllReady(game){
    if(game == null) return false;
    var n = game.gameSeats.length;
    if(n <= 0) return false;
    var i;
    // 已离线(掉线未回来)的玩家不可能再点击: 直接按当前阶段自动确认,
    // 否则其他人全点了也会一直显示"还有玩家没点确认"卡住不发下一局。
    // 摆牌阶段例外: 不给离线玩家立刻自动摆牌(短暂断线就会被"自动摆好牌"),
    // 统一等摆牌倒计时结束由 startReveal/buildRevealPayload 补齐。
    for(i = 0; i < n; ++i){
        var os = game.gameSeats[i];
        if(userMgr.isOnline(os.userId)) continue;
        if(game.phase == "confirm"){ os.confirmed = true; }
        else if(game.phase == "result"){ os.continued = true; }
    }
    if(game.phase == "confirm"){
        for(i = 0; i < n; ++i) if(!game.gameSeats[i].confirmed) return false;
        console.log("[宝宝] 全员确认完成, 亮牌 room=" + game.roomId);
        startReveal(game);
        return true;
    }
    if(game.phase == "arrange"){
        for(i = 0; i < n; ++i) if(!game.gameSeats[i].arranged) return false;
        console.log("[宝宝] 全员摆牌完成, 亮牌 room=" + game.roomId);
        startReveal(game);
        return true;
    }
    if(game.phase == "result"){
        for(i = 0; i < n; ++i) if(!game.gameSeats[i].continued) return false;
        console.log("[宝宝] 全员结算确认完成, 进入下一局 room=" + game.roomId);
        nextRound(game);
        return true;
    }
    return false;
}

// 确认/摆牌完成 → 亮牌 → 结算(亮牌与结算同一时刻推送, 不再空等动画)
function startReveal(game){
    clearGameTimers(game);
    game.phase = "reveal";
    game.revealed = true;
    if(isShou(game)) revealShou(game); else revealMian(game);
    // 等亮牌+特效在客户端真实播完再推结算, 结算倒计时起点=结算弹窗真正弹出时刻,
    // 特效有多少家、播多久都不会再吃倒计时
    setTimeout(function(){ doGameOver(game); }, revealFxMs(game));
}

function sendStart(game){
    console.log("[宝宝][时序] bb_start t=" + Date.now() + " room=" + game.roomId);
    var seatsInfo = getSeatsInfo(game);
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        var myCards = s.holds.slice();
        console.log("[宝宝] sendStart user=" + s.userId + " seat=" + i + " cards=" + JSON.stringify(myCards));
        userMgr.sendMsg(s.userId, 'bb_start_push', {
            maxPlayers: game.gameSeats.length,
            seats: seatsInfo,
            mySeat: i,
            myCards: myCards,
            bankerSeat: game.bankerSeat,
            bankerMode: game.bankerMode,
            gameType: game.conf.type,
            phase: game.phase,
            arrangeDeadline: game.arrangeDeadline || 0,
            confirmDeadline: game.confirmDeadline || 0,
            arrangeRemain: remainSec(game.arrangeDeadline),
            confirmRemain: remainSec(game.confirmDeadline),
            confirmed: !!s.confirmed,
            mianFree: !!s.mianFree,
            myMian: (s.mian ? { level: s.mian.level, typeName: MIAN_NAMES[s.mian.level], rate: s.mian.rate, cards: bestOrder(s.holds) } : null),
            shuffle: !!game.shuffle,
            conf: game.conf
        });
    }
    // 房内观战者: 新一局开局同步桌面(不含任何手牌/弹窗数据), 上局明牌清掉重新盖牌
    sendToWatchers(game, 'bb_start_push', {
        maxPlayers: game.gameSeats.length,
        seats: seatsInfo,
        mySeat: -1,
        myCards: [],
        bankerSeat: game.bankerSeat,
        bankerMode: game.bankerMode,
        gameType: game.conf.type,
        phase: game.phase,
        watching: true,
        shuffle: !!game.shuffle,
        conf: game.conf
    });
}

// 展示排序: 成组(对子)的在前, 再按点数降序, 前道最大尾道最小
function bestOrder(cards){
    var cnt = {};
    cards.forEach(function(id){ var r = rankOf(id); cnt[r] = (cnt[r] || 0) + 1; });
    return cards.slice().sort(function(a, b){
        var ra = rankOf(a), rb = rankOf(b);
        if(cnt[ra] != cnt[rb]) return cnt[rb] - cnt[ra];
        if(ra != rb) return rb - ra;
        return suitOf(a) - suitOf(b);
    });
}

// 打枪统计(手摆对局): A 对 B 三道全赢 → A 打枪 B; 对所有对手都打枪 = 全垒打
// 免摆参与的对比是整手比大小, 不算打枪; 亮牌阶段(daos 已齐)与结算阶段共用
function calcDaqiang(game){
    var out = { list: [], quanleida: [] };
    if(!isShou(game)) return out;
    var n = game.gameSeats.length;
    var tf = tongdianMode(game);
    var pairs = [];
    if(game.bankerMode){
        for(var i = 0; i < n; ++i){ if(i != game.bankerSeat) pairs.push([i, game.bankerSeat]); }
    } else {
        for(var a = 0; a < n; ++a) for(var b = a + 1; b < n; ++b) pairs.push([a, b]);
    }
    var winCnt = {};  // "a>b" => a 赢 b 的道数
    pairs.forEach(function(pr){
        var A = game.gameSeats[pr[0]], B = game.gameSeats[pr[1]];
        if(A.mianFree || B.mianFree) return;   // 免摆整手比, 不打枪
        if(!A.daos || !B.daos) return;
        for(var d = 0; d < 3; ++d){
            var win = 0;
            if(A.wulong && B.wulong){ win = 0; }
            else if(A.wulong){ win = -1; }
            else if(B.wulong){ win = 1; }
            else { var c = cmpDao(A.daos[d], B.daos[d], tf); win = c > 0 ? 1 : (c < 0 ? -1 : 0); }
            if(win > 0){ var k = pr[0] + ">" + pr[1]; winCnt[k] = (winCnt[k] || 0) + 1; }
            else if(win < 0){ var k2 = pr[1] + ">" + pr[0]; winCnt[k2] = (winCnt[k2] || 0) + 1; }
        }
    });
    var dqMap = {};
    for(var key in winCnt){
        if(winCnt[key] >= 3){
            var se = key.split(">");
            var from = Number(se[0]), to = Number(se[1]);
            out.list.push({ from: from, to: to });
            (dqMap[from] = dqMap[from] || []).push(to);
        }
    }
    for(var f in dqMap){ if(dqMap[f].length >= n - 1) out.quanleida.push(Number(f)); }
    return out;
}

// 亮牌数据(免摆/手摆共用): 重连补发 verify 阶段也要用到
function buildRevealPayload(game){
    if(isShou(game)){
        // 手摆: 全部摆完(或超时补齐)后亮牌; 免摆玩家整手比, 无需摆牌
        var tf = tongdianMode(game);
        for(var i = 0; i < game.gameSeats.length; ++i){
            var s = game.gameSeats[i];
            if(s.mianFree) continue;
            if(!s.arranged){
                s.daos = autoArrange(s.holds, tf);
                s.arranged = true;
                s.autoArranged = true;
            }
            // 乌龙判定
            s.wulong = wulongCheck(game) ? !daoOrderOk(s.daos, tf) : false;
        }
        var shouPlayers = game.gameSeats.map(function(s, idx){
            if(s.mianFree){
                // 免摆玩家也要逐道显示牌型点数: 用系统最优摆法切三道(不参与乌龙判定)
                var fd = autoArrange(s.holds, tf);
                return {
                    seat: idx,
                    sex: s.sex || 0,
                    mianFree: true,
                    cards: bestOrder(s.holds),
                    daos: fd.map(function(d){ return { cards: d.cards.slice(), desc: daoDesc(d), rate: daoRate(d, taiRules(game)) }; }),
                    typeKey: s.mian.level,
                    typeName: MIAN_NAMES[s.mian.level],
                    rate: s.mian.rate
                };
            }
            return {
                seat: idx,
                sex: s.sex || 0,
                daos: s.daos.map(function(d){ return { cards: d.cards.slice(), desc: daoDesc(d), rate: daoRate(d, taiRules(game)) }; }),
                wulong: !!s.wulong,
                auto: !!s.autoArranged
            };
        });
        var dq = calcDaqiang(game);
        return { players: shouPlayers, gameType: game.conf.type, seats: getSeatsInfo(game), daqiang: dq.list, quanleida: dq.quanleida, bankerSeat: game.bankerSeat };
    }
    // 免摆: 计算各家最优牌型
    for(var j = 0; j < game.gameSeats.length; ++j){
        var ms = game.gameSeats[j];
        ms.mian = identMian(ms.holds);
        ms.mian.rate = mianRate(ms.mian.level, taiRules(game));
    }
    var players = game.gameSeats.map(function(s, idx){
        // 亮牌分组: 按点数降序, 前道最大尾道最小, 切成 前2/中2/后2 供展示
        var ordered = s.holds.slice().sort(function(a,b){ return rankOf(b) - rankOf(a) || suitOf(a) - suitOf(b); });
        return {
            seat: idx,
            sex: s.sex || 0,
            cards: ordered,
            groups: [ordered.slice(0,2), ordered.slice(2,4), ordered.slice(4,6)],
            typeKey: s.mian.level,
            typeName: MIAN_NAMES[s.mian.level],
            rate: s.mian.rate
        };
    });
    return { players: players, gameType: game.conf.type, seats: getSeatsInfo(game), bankerSeat: game.bankerSeat };
}

function revealMian(game){
    // 参与者正常亮牌; 房内观战者也收到亮牌数据(客户端按观战渲染, 不弹任何弹窗)
    var payload = buildRevealPayload(game);
    sendToGameSeats(game, 'bb_reveal_push', payload);
    sendToWatchers(game, 'bb_reveal_push', payload);
}

function revealShou(game){
    var payload = buildRevealPayload(game);
    sendToGameSeats(game, 'bb_reveal_push', payload);
    sendToWatchers(game, 'bb_reveal_push', payload);
}

// ============ 结算 ============
function doGameOver(game){
    if(game.gameOver) return;
    game.gameOver = true;
    if(game.arrangeTimer){ clearTimeout(game.arrangeTimer); game.arrangeTimer = null; }
    if(game.confirmTimer){ clearTimeout(game.confirmTimer); game.confirmTimer = null; }

    var base = game.conf.baseScore || 1;
    var n = game.gameSeats.length;
    var deltas = [];
    for(var i = 0; i < n; ++i) deltas.push(0);

    // 有庄: 闲家只与庄家比; 无庄: 两两互比
    var pairs = [];
    if(game.bankerMode){
        for(var i = 0; i < n; ++i){
            if(i != game.bankerSeat) pairs.push([i, game.bankerSeat]);
        }
    } else {
        for(var a = 0; a < n; ++a) for(var b = a+1; b < n; ++b) pairs.push([a, b]);
    }

    var details = []; // 每场/每道明细(结算弹窗展示)
    if(isShou(game)){
        var tf = tongdianMode(game);
        // 第一遍: 先算免摆整手对比(免摆只与免摆布, 与手摆玩家不交叉结算)
        pairs.forEach(function(pr){
            var A = game.gameSeats[pr[0]], B = game.gameSeats[pr[1]];
            if(!A.mianFree || !B.mianFree) return;
            var mc = compareMian(A.mian, B.mian);
            if(mc == 0) return;
            var mWin = mc > 0 ? 1 : -1;
            var wM = mc > 0 ? A.mian : B.mian;
            var mRate = wM.rate;
            var mDesc = MIAN_NAMES[wM.level];
            var mwSeat = mWin > 0 ? pr[0] : pr[1];
            var mlSeat = mWin > 0 ? pr[1] : pr[0];
            var mScore = base * mRate;
            deltas[mwSeat] += mScore;
            deltas[mlSeat] -= mScore;
            details.push({ a: pr[0], b: pr[1], mian: true, winner: mwSeat, rate: mRate, score: mScore, wDesc: mDesc });
        });
        // 第二遍: 再算手摆玩家的前/中/后三道(每道二张)对比
        pairs.forEach(function(pr){
            var A = game.gameSeats[pr[0]], B = game.gameSeats[pr[1]];
            if(A.mianFree || B.mianFree) return;   // 免摆已在第一遍算完
            for(var d = 0; d < 3; ++d){
                var da = A.daos[d], dbb = B.daos[d];
                var win = 0; // 1=A胜 -1=B胜 0=和
                if(A.wulong && B.wulong){ win = 0; }
                else if(A.wulong){ win = -1; }
                else if(B.wulong){ win = 1; }
                else { var c = cmpDao(da, dbb, tf); win = c > 0 ? 1 : (c < 0 ? -1 : 0); }
                if(win == 0) continue;
                var wSeat = win > 0 ? pr[0] : pr[1];
                var lSeat = win > 0 ? pr[1] : pr[0];
                var wDao = win > 0 ? da : dbb;
                var lDao = win > 0 ? dbb : da;
                var rate = daoRate(wDao, taiRules(game));
                var score = base * rate;
                deltas[wSeat] += score;
                deltas[lSeat] -= score;
                details.push({ a: pr[0], b: pr[1], dao: d, winner: wSeat, rate: rate, score: score, wDesc: daoDesc(wDao), lDesc: daoDesc(lDao) });
            }
        });
    } else {
        pairs.forEach(function(pr){
            var A = game.gameSeats[pr[0]], B = game.gameSeats[pr[1]];
            var c = compareMian(A.mian, B.mian);
            if(c == 0) return;
            var wSeat = c > 0 ? pr[0] : pr[1];
            var lSeat = c > 0 ? pr[1] : pr[0];
            var wMian = c > 0 ? A.mian : B.mian;
            var score = base * wMian.rate;
            deltas[wSeat] += score;
            deltas[lSeat] -= score;
            details.push({ a: pr[0], b: pr[1], winner: wSeat, rate: wMian.rate, score: score, wDesc: MIAN_NAMES[wMian.level] });
        });
    }

    // 宝宝豆结算: 每局按本局输赢分加减账户余额(gems), 余额刷新后用最新余额作为积分推送结算
    var roomInfo = roomMgr.getRoom(game.roomId);
    var kickBean = roomInfo ? (Number(roomInfo.conf.kick_bean) || 0) : 0;

    var finish = function(){
        // 组装结果(与房间座位对齐, 空位为 null, 兼容 GameNetMgr game_over_push 处理)
        var results = [];
        var roomSeatCount = roomInfo ? roomInfo.seats.length : n;
        for(var i = 0; i < roomSeatCount; ++i) results.push(null);
        for(var i = 0; i < n; ++i){
            var s = game.gameSeats[i];
            var r = {
                userid: s.userId,
                name: s.name,
                seatindex: s.roomSeatIndex,
                delta: deltas[i],
                score: deltas[i],
                totalscore: s.score,
                holds: s.holds.slice().sort(function(a,b){ return a - b; }),
                isWinner: deltas[i] > 0
            };
            if(isShou(game)){
                if(s.mianFree){
                    r.mianFree = true;
                    // 免摆玩家: 补三道(系统最优摆法)供结算行显示牌型点数
                    r.daos = autoArrange(s.holds, tongdianMode(game)).map(function(d){
                        return { cards: d.cards.slice(), desc: daoDesc(d), rate: daoRate(d, taiRules(game)) };
                    });
                    r.typeKey = s.mian.level;
                    r.typeName = MIAN_NAMES[s.mian.level];
                    r.rate = s.mian.rate;
                } else {
                    r.daos = s.daos.map(function(d){ return { cards: d.cards.slice(), desc: daoDesc(d), rate: daoRate(d, taiRules(game)) }; });
                    r.wulong = !!s.wulong;
                }
            } else {
                r.typeKey = s.mian.level;
                r.typeName = MIAN_NAMES[s.mian.level];
                r.rate = s.mian.rate;
            }
            results[s.roomSeatIndex] = r;
        }

        // 结算倒计时全房统一: 时长完全等于后台「结算倒计时(秒)」, 不叠加任何硬编码秒数
        var totalRemain = resultTimeout(game);
        game.resultEndAt = Date.now() + totalRemain * 1000;
        var overData = {
            results: results,
            bankerSeat: game.bankerSeat,
            bankerMode: game.bankerMode,
            gameType: game.conf.type,
            details: details,
            daqiang: isShou(game) ? calcDaqiang(game).list : [],
            quanleida: isShou(game) ? calcDaqiang(game).quanleida : [],
            resultDeadline: game.resultEndAt,
            resultRemain: totalRemain,
            resultRemainTotal: totalRemain,
            resultTimeout: totalRemain
        };

        // 整场结束判断: 附 endinfo(复用 GameNetMgr 的 game_end 分发)
        if(roomInfo && roomInfo.numOfGames >= roomInfo.conf.maxGames){
            var endinfo = [];
            for(var i = 0; i < roomInfo.seats.length; ++i){
                var rs = roomInfo.seats[i];
                if(rs.userId > 0){
                    endinfo.push({userid: rs.userId, name: rs.name, score: rs.roomWin || 0});   // 房间累计输赢, 不是余额
                }
            }
            overData.endinfo = endinfo;
        }

        // 房间剩余人数不足两人(其他玩家因宝宝豆不足/主动退出等原因已离座): 本局之后无法再开局,
        // 通知客户端在本局结算弹窗里显示「退出房间」按钮, 玩家看完结果自己离开
        var remainPlayers = 0;
        if(roomInfo && roomInfo.seats){
            for(var pi = 0; pi < roomInfo.seats.length; ++pi){
                if(roomInfo.seats[pi].userId > 0) remainPlayers++;
            }
        }
        // 本局结算后余额低于「请出阈值」的玩家也会被踢出房间, 提前从剩余人数里扣掉,
        // 避免踢人异步清座位时误判成"还能继续开局"
        if(kickBean > 0 && roomInfo && roomInfo.seats){
            for(var gi = 0; gi < game.gameSeats.length; ++gi){
                var gsu = game.gameSeats[gi];
                if(gsu.score >= kickBean) continue;
                for(var pi2 = 0; pi2 < roomInfo.seats.length; ++pi2){
                    if(roomInfo.seats[pi2].userId == gsu.userId){ remainPlayers--; break; }
                }
            }
        }
        if(remainPlayers < 0) remainPlayers = 0;
        var isFinalRound = !!(roomInfo && roomInfo.numOfGames >= roomInfo.conf.maxGames);
        if(remainPlayers < 2 && !isFinalRound){
            overData.roomEnd = true;
            console.log("[宝宝] 房间人数不足(" + remainPlayers + "), 本局结算显示退出房间 room=" + game.roomId);
        }

        // 保存结算数据: 结算阶段重连时补发 game_over_push, 避免重进后空等倒计时
        game.lastOver = overData;

        game.phase = "result";
        sendToGameSeats(game, 'game_over_push', overData);

        // 单局结算: 只有"整场打完"才清退并销毁房间; 否则等玩家在结算弹窗点继续/倒计时结束, 自动进下一局
        if(isFinalRound){
            // 整场结束: 结算倒计时一到立刻清退所有玩家并销毁房间(不再停留120秒)
            console.log("[宝宝] 整场结束, 结算倒计时结束即清退 room=" + game.roomId + " t=" + Date.now());
            setTimeout(function(){
                userMgr.brocastInRoom(game.roomId, 'dispress_push', {});
                setTimeout(function(){
                    var endRoomId = game.roomId;
                    userMgr.kickAllInRoom(endRoomId);
                    roomMgr.destroy(endRoomId);
                    delete games[endRoomId];
                }, 500);
            }, totalRemain * 1000 + 3000);
        } else if(overData.roomEnd){
            // 人数不足: 不自动续局, 等剩余玩家在结算弹窗点「退出房间」; 房间由退房/自动解散定时器兜底
            console.log("[宝宝] 结算后不续局(人数不足), 等待玩家退出 room=" + game.roomId);
        } else {
            // 单局结束: 结算倒计时到点把没点的玩家自动确认, 全员确认后才发下一局
            game.resultTimer = setTimeout(function(){
                game.resultTimer = null;
                console.log("[宝宝] 结算倒计时结束, 未点击的玩家自动确认 room=" + game.roomId);
                for(var j = 0; j < game.gameSeats.length; ++j) game.gameSeats[j].continued = true;
                if(!checkAllReady(game)) nextRound(game);
            }, totalRemain * 1000 + 1000);
        }
    };

    if(roomInfo == null){ finish(); return; }
    var pending = n;
    for(var ci = 0; ci < n; ++ci){
        (function(gs, delta){
            var uid = gs.userId;
            if(uid <= 0){ if(--pending === 0) finish(); return; }
            var after = function(){
                // 回读余额作为最新积分(积分=账户宝宝豆余额), DB失败则内存累计兜底
                db.get_user_data_by_userid(uid, function(ud){
                    if(ud && ud.gems != null){ gs.score = ud.gems; }
                    else { gs.score += delta; }
                    // 房间累计输赢: 总结算弹窗显示本房间所有牌局的加减总和
                    gs.roomWin = (gs.roomWin || 0) + (delta || 0);
                    var rs = roomInfo.seats[gs.roomSeatIndex];
                    if(rs){ rs.score = gs.score; rs.roomWin = gs.roomWin; }
                    if(kickBean > 0 && gs.score < kickBean) kickForBeans(game.roomId, uid, gs.score, kickBean);
                    if(--pending === 0) finish();
                });
            };
            // 分不为0才动账, 也减少无意义的DB写; extra 用于写乐豆流水(房间/玩法/类型)
            if(delta != 0){
                var gt = "";
                try {
                    var cf = roomInfo && roomInfo.conf ? roomInfo.conf : null;
                    if(cf){ gt = cf.game_type || cf.gametype || cf.wanfa || cf.type || ""; }
                } catch(e){ gt = ""; }
                db.add_user_gems(uid, delta, after, { roomid: game.roomId, gameType: gt, changeType: "对局结算", roomUuid: roomInfo.uuid, gameIndex: roomInfo.numOfGames });
            }
            else after();
        })(game.gameSeats[ci], deltas[ci]);
    }
}

// 宝宝豆不足: 请出房间(提示→退出座位→不再等其确认→广播牌桌人数)
function kickForBeans(roomId, userId, beans, need){
    console.log("[宝宝][请出] 宝宝豆不足 user=" + userId + " beans=" + beans + " need=" + need + " room=" + roomId);
    userMgr.sendMsg(userId, 'bb_kicked_push', { msg: "宝宝豆不足" + need + "，已被请出房间", beans: beans, need: need });
    userMgr.sendMsg(userId, 'dispress_push', {});
    roomMgr.exitRoom(userId, function(){
        exports.onPlayerExit(roomId, userId);
        try{
            var ss = require('./socket_service');
            var left = roomMgr.getRoom(roomId);
            if(left != null){ ss.broadcastClubUpdatePublic(roomId, left); }
        }catch(e){}
        roomMgr.destroyIfEmpty(roomId);
    });
}

// ============ 对外接口 ============

exports.start = function(roomInfo, readyUids){
    var seatedPlayers = collectSeats(roomInfo, readyUids);
    if(seatedPlayers.length < 2){
        console.log("[宝宝] 人数不足，无法开局");
        return;
    }
    // 开局不能被数据库读长时间阻塞: 原来要等所有玩家余额都查回来才发牌, MySQL 一慢(或连接池忙)
    // 结算后就要多等几秒才发下一局。现在最多等 300ms: 查回来用最新余额, 超时就用座位上缓存的积分直接开局。
    var started = false;
    var pending = seatedPlayers.length;
    var timer = setTimeout(function(){
        if(started) return;
        started = true;
        console.log("[宝宝][时序] 取余额超时, 用缓存积分开局 room=" + roomInfo.id + " t=" + Date.now());
        doStart(roomInfo, seatedPlayers);
    }, 300);
    seatedPlayers.forEach(function(sp){
        db.get_user_data_by_userid(sp.userId, function(ud){
            if(ud && ud.gems != null){
                sp.score = ud.gems;
                var rs = roomInfo.seats[sp.roomSeatIndex];
                if(rs) rs.score = ud.gems;
            }
            if(--pending === 0){
                clearTimeout(timer);
                if(started) return;
                started = true;
                doStart(roomInfo, seatedPlayers);
            }
        });
    });
};

function doStart(roomInfo, seatedPlayers){
    //进房后第一局开局扣豆: 每人只扣一次, 出房再进重新算(座位上的 entryCharged 在入座时清空)
    seatedPlayers.forEach(function(sp){
        var se = roomInfo.seats[sp.roomSeatIndex];
        if(!se || se.entryCharged) return;
        se.entryCharged = true;
        charge.charge(roomInfo.conf.type, sp.userId, "enter", roomInfo.id);
    });
    // 先批量查每家性别(报牌语音分男/女), 查完再发牌开局
    var sexMap = {};
    var pendingSex = seatedPlayers.length;
    if(pendingSex <= 0) return;
    seatedPlayers.forEach(function(sp){
        db.get_user_base_info(sp.userId, function(info){
            sexMap[sp.userId] = (info && info.sex != null) ? Number(info.sex) : 0;
            if(--pendingSex <= 0) doStartDeal(roomInfo, seatedPlayers, sexMap);
        });
    });
}

function doStartDeal(roomInfo, seatedPlayers, sexMap){
    var game = {
        roomId: roomInfo.id,
        deck: buildDeck(),
        gameSeats: [],
        bankerSeat: 0,
        bankerMode: true,
        phase: "deal", // deal -> arrange(手摆) -> reveal -> over
        gameOver: false,
        arrangeDeadline: 0,
        arrangeTimer: null,
        conf: roomInfo.conf
    };

    shuffle(game.deck);

    // ===== DEBUG: 明确打印 type =====
    console.log("[宝宝] doStartDeal room=" + roomInfo.id + " conf.type=" + (game.conf && game.conf.type) + " conf.game_type=" + (game.conf && game.conf.game_type) + " isShou=" + isShou(game));

    for(var i = 0; i < seatedPlayers.length; ++i){
        var sp = seatedPlayers[i];
        game.gameSeats.push({
            userId: sp.userId,
            name: sp.name,
            sex: sexMap[sp.userId] || 0,
            seatIndex: i,
            roomSeatIndex: sp.roomSeatIndex,
            holds: [],
            arranged: false,
            continued: false,
            autoArranged: false,
            wulong: false,
            daos: null,
            mian: null,
            mianFree: false,
            score: sp.score,
            roomWin: sp.roomWin || 0   // 本房间内累计输赢(总结算弹窗显示这个, 不是宝宝豆余额)
        });
    }

    // 发牌: 每人6张
    for(var r = 0; r < 6; ++r){
        for(var i = 0; i < game.gameSeats.length; ++i){
            game.gameSeats[i].holds.push(game.deck.pop());
        }
    }

    // 庄家随机定
    game.bankerSeat = Math.floor(Math.random() * game.gameSeats.length);
    game.bankerMode = bankerMode(game);

    // 上一局有人点了洗牌: 本局发牌前全员统一播洗牌动画(只播一次)
    game.shuffle = !!roomInfo._shuffleNext;
    roomInfo._shuffleNext = false;

    games[roomInfo.id] = game;

    if(isShou(game)){
        // 手摆: 发牌后先算整手牌型, 非散牌(level>=2)=免摆, 免摆玩家不用手动摆牌直接等亮牌
        for(var i = 0; i < game.gameSeats.length; ++i){
            var ms = game.gameSeats[i];
            ms.mian = identMian(ms.holds);
            ms.mian.rate = mianRate(ms.mian.level, taiRules(game));
            ms.mianFree = ms.mian.level >= 2;   // 非散牌即免摆(散牌才手动摆)
            // 免摆也要点确认按钮: 不再自动 arranged, 和手摆一样进摆牌阶段等确认/超时自动补
        }
        // 手摆: 进入摆牌阶段, 倒计时结束自动补齐未摆的
        game.phase = "arrange";
        game.arrangeDeadline = Date.now() + arrangeTimeout(game) * 1000;
        sendStart(game);
        sendToGameSeats(game, 'bb_arrange_start_push', {
            deadline: game.arrangeDeadline,
            remain: remainSec(game.arrangeDeadline),
            timeout: arrangeTimeout(game)
        });
        game.arrangeTimer = setTimeout(function(){
            console.log("[宝宝] 摆牌超时, 自动补齐 room=" + game.roomId);
            startReveal(game);
        }, (arrangeTimeout(game) + 1) * 1000);
        // 全员免摆(或开局即全部就绪): 不必等摆牌倒计时, 直接亮牌
        checkAllReady(game);
    } else {
        // 免摆玩法(baobao_mian): 与手摆里的"免摆玩家"走同样的 confirm 流程
        // 发牌后弹窗展示系统最大牌型, 全部玩家确认后再亮牌对比
        game.phase = "confirm";
        for(var i = 0; i < game.gameSeats.length; ++i){
            var ms = game.gameSeats[i];
            ms.mian = identMian(ms.holds);
            ms.mian.rate = mianRate(ms.mian.level, taiRules(game));
            ms.confirmed = false;
        }
        game.confirmDeadline = Date.now() + confirmTimeout(game) * 1000;
        game.revealed = false;
        sendStart(game);
        sendToGameSeats(game, 'bb_confirm_start_push', {
            deadline: game.confirmDeadline,
            remain: remainSec(game.confirmDeadline),
            confirmCount: 0,
            total: game.gameSeats.length
        });
        game.confirmTimer = setTimeout(function(){
            game.confirmTimer = null;
            console.log("[宝宝] 确认超时, 未点击的玩家自动确认 room=" + game.roomId);
            for(var j = 0; j < game.gameSeats.length; ++j) game.gameSeats[j].confirmed = true;
            if(!checkAllReady(game)) startReveal(game);   // 兜底: 任何情况下都必须亮牌
        }, confirmTimeout(game) * 1000 + 500);
    }
};

// 免摆: 玩家点击确定 → 记录; 全部玩家都点了(或倒计时结束)才亮牌
exports.confirm = function(userId){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    if(game.phase != "confirm") return;
    var seatIndex = -1;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){ seatIndex = i; break; }
    }
    if(seatIndex == -1) return;
    var s = game.gameSeats[seatIndex];
    if(s.confirmed) return;
    s.confirmed = true;
    var count = game.gameSeats.filter(function(x){ return x.confirmed; }).length;
    console.log("[宝宝] 确认 userId=" + userId + " " + count + "/" + game.gameSeats.length);
    sendToGameSeats(game, 'bb_confirm_ok_push', { seatIndex: seatIndex, confirmedCount: count, total: game.gameSeats.length });
    checkAllReady(game);
};

// 结算弹窗: 每家各自点「确定」/「洗牌」, 只记自己; 全员都点了或倒计时结束才发下一局
exports.continueRound = function(userId, data){
    var game = getGameByUserID(userId);
    if(game == null) return;
    // 结算阶段 gameOver 已为 true, 这里只按 phase 判断
    if(game.phase != "result") return;
    var seatIndex = -1;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){ seatIndex = i; break; }
    }
    if(seatIndex == -1) return;
    var s = game.gameSeats[seatIndex];
    // 点了洗牌: 下一局全员统一播洗牌动画(多人点也只播一次, 挂在房间上跨局传递)
    // 必须放在重复继续判断之前: 已被倒计时自动确认的玩家再点洗牌也要生效
    if(data && data.shuffle){
        var ri0 = roomMgr.getRoom(game.roomId);
        if(ri0) ri0._shuffleNext = true;
        game.shuffleNext = true;
        //点了洗牌就扣豆(谁点扣谁)
        charge.charge(game.conf.type, userId, "shuffle", game.roomId);
    }
    if(s.continued){
        // 重复点击/客户端丢包重发: 只回执当前进度, 让各端提示跟上
        sendToGameSeats(game, 'bb_continue_ok_push', { seatIndex: seatIndex, continuedCount: game.gameSeats.filter(function(x){ return x.continued; }).length, total: game.gameSeats.length });
        return;
    }
    s.continued = true;
    var count = game.gameSeats.filter(function(x){ return x.continued; }).length;
    console.log("[宝宝] 结算继续 userId=" + userId + " " + count + "/" + game.gameSeats.length + " t=" + Date.now());
    sendToGameSeats(game, 'bb_continue_ok_push', { seatIndex: seatIndex, continuedCount: count, total: game.gameSeats.length });
    checkAllReady(game);
};

// 手摆: 玩家提交摆牌 {front:[c1,c2], mid:[c1,c2], back:[c1,c2]}
exports.arrange = function(userId, data){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    if(!isShou(game) || game.phase != "arrange") return;

    var seatIndex = -1;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){ seatIndex = i; break; }
    }
    if(seatIndex == -1) return;
    var s = game.gameSeats[seatIndex];
    if(s.arranged) return;

    if(data == null || !(data.front instanceof Array) || !(data.mid instanceof Array) || !(data.back instanceof Array)
        || data.front.length != 2 || data.mid.length != 2 || data.back.length != 2){
        userMgr.sendMsg(userId, 'bb_error_push', {msg:"摆牌格式错误"});
        return;
    }
    // 校验: 6张牌都在手牌里且不重复
    var all = data.front.concat(data.mid).concat(data.back);
    var handCopy = s.holds.slice();
    for(var i = 0; i < all.length; ++i){
        var idx = handCopy.indexOf(all[i]);
        if(idx < 0){
            userMgr.sendMsg(userId, 'bb_error_push', {msg:"牌不在手中"});
            return;
        }
        handCopy.splice(idx, 1);
    }
    if(all.length != 6 || handCopy.length != 0){
        userMgr.sendMsg(userId, 'bb_error_push', {msg:"必须用完6张牌"});
        return;
    }

    s.daos = [evalDao(data.front[0], data.front[1]), evalDao(data.mid[0], data.mid[1]), evalDao(data.back[0], data.back[1])];
    s.arranged = true;
    console.log("[宝宝] arrange user=" + userId + " daos=" + s.daos.map(daoDesc).join("/"));

    sendToGameSeats(game, 'bb_arrange_ok_push', { seatIndex: seatIndex, arrangedCount: game.gameSeats.filter(function(x){ return x.arranged; }).length });

    // 全部摆完 → 亮牌结算
    checkAllReady(game);
};

// 玩家真正退出房间(座位已移除): 不再等他的确认, 剩余玩家都已就绪则立即推进
exports.onPlayerExit = function(roomId, userId){
    var game = games[roomId];
    if(game == null) return;
    var n0 = game.gameSeats.length;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){
            game.gameSeats.splice(i, 1);
            break;
        }
    }
    console.log("[宝宝] 玩家退出, 不再等待其确认 user=" + userId + " phase=" + game.phase + " " + n0 + "→" + game.gameSeats.length + " room=" + roomId);
    if(game.gameSeats.length <= 0){
        clearGameTimers(game);
        delete games[roomId];
        return;
    }
    checkAllReady(game);
};

// 允许对局中退出房间: 宝宝玩法退出后不破坏其他人的牌局, 只是不再参与本局确认
exports.allowExit = function(roomId){
    return games[roomId] != null;
};

exports.setReady = function(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return;
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return;
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null) return;
    var s = roomInfo.seats[seatIndex];

    var game = games[roomId];
    if(game != null){
        // 本局(含结算阶段)进行中: 已在局内的补发状态; 不在局内的排队等本局结束自动加入下一局
        for(var gi = 0; gi < game.gameSeats.length; ++gi){
            if(game.gameSeats[gi].userId == userId){
                exports.resendGameState(roomId, userId);
                return;
            }
        }
        s.ready = true;
        userMgr.sendMsg(userId, 'bb_wait_next_push', {});
        return;
    }

    if(s.ready) return;
    s.ready = true;

    var count = 0;
    var total = 0;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        if(roomInfo.seats[i].userId > 0) total++;
        if(roomInfo.seats[i].ready) count++;
    }

    // 两人以上准备即自动开局(不再要求全员准备)
    if(count >= 2){
        setTimeout(function(){
            if(games[roomId] != null && !games[roomId].gameOver) return;
            var room = roomMgr.getRoom(roomId);
            if(room != null){
                exports.begin(room);
            }
        }, 1000);
    }
};

exports.begin = function(roomInfo){
    // 只让已准备的玩家入局(两人以上准备即可开局), 未准备的人不入局
    var readyUids = [];
    for(var ri = 0; ri < roomInfo.seats.length; ++ri){
        var rrs = roomInfo.seats[ri];
        if(rrs.userId > 0 && rrs.ready) readyUids.push(rrs.userId);
    }
    if(readyUids.length < 2){
        console.log("[宝宝] 准备人数不足(" + readyUids.length + ")，不开局");
        return;
    }
    roomInfo.numOfGames++;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        roomInfo.seats[i].ready = false;
    }
    db.update_num_of_turns(roomInfo.id, roomInfo.numOfGames);

    var anySeat = null;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        if(roomInfo.seats[i].userId > 0){ anySeat = roomInfo.seats[i]; break; }
    }
    if(anySeat == null) return;
    userMgr.broacastInRoom('game_num_push', roomInfo.numOfGames, anySeat.userId, true);
    userMgr.broacastInRoom('game_begin_push', roomInfo.nextButton, anySeat.userId, true);

    exports.start(roomInfo, readyUids);
};

exports.isPlaying = function(roomId){
    return games[roomId] != null;
};

exports.hasBegan = function(roomId){
    var game = games[roomId];
    return game != null && game.gameOver != true;
};

// 断线重连补发当前状态: 按阶段补发(confirm/arrange/reveal/result), 避免重进后弹失效倒计时或空等
exports.resendGameState = function(roomId, userId){
    var game = games[roomId];
    if(game == null) return;
    var seatIdx = -1;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){ seatIdx = i; break; }
    }
    // 本局未参与(新进房/排队等下一局): 按观战补发 —— 能看到进行中的牌局桌面,
    // 但不发结算/确认等会触发弹窗的数据; 已亮牌阶段附带亮牌数据, 进去即可看到明牌
    if(seatIdx < 0){
        var wdata = {
            resend: true,
            watching: true,
            maxPlayers: game.gameSeats.length,
            seats: getSeatsInfo(game),
            mySeat: -1,
            myCards: [],
            bankerSeat: game.bankerSeat,
            bankerMode: game.bankerMode,
            gameType: game.conf.type,
            phase: game.phase,
            conf: game.conf
        };
        if(game.phase == "reveal" || game.phase == "result" || game.gameOver){
            wdata.reveal = buildRevealPayload(game);
        }
        userMgr.sendMsg(userId, 'bb_resend_push', wdata);
        return;
    }
    var s = game.gameSeats[seatIdx];
    var over = game.gameOver || game.phase == "result";
    var data = {
        resend: true,
        maxPlayers: game.gameSeats.length,
        seats: getSeatsInfo(game),
        mySeat: seatIdx,
        myCards: s.holds.slice().sort(function(a,b){ return a - b; }),
        bankerSeat: game.bankerSeat,
        bankerMode: game.bankerMode,
        gameType: game.conf.type,
        phase: game.phase,
        arrangeDeadline: game.arrangeDeadline || 0,
        confirmDeadline: game.confirmDeadline || 0,
        arrangeRemain: over ? 0 : remainSec(game.arrangeDeadline),
        confirmRemain: over ? 0 : remainSec(game.confirmDeadline),
        confirmed: !!s.confirmed,
        continued: !!s.continued,
        mianFree: !!s.mianFree,
        myMian: (s.mian ? { level: s.mian.level, typeName: MIAN_NAMES[s.mian.level], rate: s.mian.rate } : null),
        arranged: !!s.arranged,
        myDaos: s.arranged && s.daos ? s.daos.map(function(d){ return d.cards.slice(); }) : null,
        conf: game.conf
    };
    if(game.phase == "reveal") data.reveal = buildRevealPayload(game);
    userMgr.sendMsg(userId, 'bb_resend_push', data);
    // 结算阶段: 直接补发结算弹窗数据(客户端收到即弹结算, 不必等下一局); 剩余时间按当前时刻重算, 避免补发后倒计时变长
    if(over && game.lastOver){
        var lo = game.lastOver;
        if(game.resultEndAt){
            lo = Object.assign({}, lo, { resultRemainTotal: Math.max(0, Math.ceil((game.resultEndAt - Date.now()) / 1000)) });
        }
        userMgr.sendMsg(userId, 'game_over_push', lo);
    }
};

// ============ 解散房间 ============
exports.dissolveRequest = function(roomId, userId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return null;
    if(roomInfo.dr != null) return {dr: roomInfo.dr};
    var states = [];
    for(var i = 0; i < roomInfo.seats.length; ++i){
        states.push(roomInfo.seats[i].userId == userId);
    }
    roomInfo.dr = { endTime: Date.now() + 300000, states: states };
    return {dr: roomInfo.dr};
};

exports.dissolveAgree = function(roomId, userId, agree){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null || roomInfo.dr == null) return null;
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null) return null;
    roomInfo.dr.states[seatIndex] = agree;
    return {dr: roomInfo.dr};
};

exports.doDissolve = function(roomId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var userId = roomInfo.seats[i].userId;
        if(userId > 0){
            userMgr.sendMsg(userId, 'dispress_push', {});
        }
    }
    var game = games[roomId];
    if(game && game.arrangeTimer){ clearTimeout(game.arrangeTimer); }
    roomInfo.dr = null;
    delete games[roomId];
    roomMgr.destroy(roomId);
};

// 麻将操作空实现
exports.chupai = function(){};
exports.peng = function(){};
exports.gang = function(){};
exports.hu = function(){};
exports.chi = function(){};
exports.bao = function(){};
exports.huanSanZhang = function(){};
exports.dingQue = function(){};

// ============ 单元测试导出(本地验证用) ============
exports._test = {
    identMian: identMian,
    compareMian: compareMian,
    evalDao: evalDao,
    cmpDao: cmpDao,
    daoRate: daoRate,
    daoOrderOk: daoOrderOk,
    autoArrange: autoArrange,
    canSplitNines: canSplitNines,
    MIAN_NAMES: MIAN_NAMES,
    bankerMode: bankerMode,
    doGameOver: doGameOver,
    nextRound: nextRound,
    getGame: function(roomId){ return games[roomId]; }
};
