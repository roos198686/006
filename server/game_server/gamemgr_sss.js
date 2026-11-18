// 十三水（2人/4人/6人）服务端逻辑
// 牌编码: id = suit*13 + idx, suit 0..3(黑桃/红桃/梅花/方块), idx 0..12(A,2,3...K)
// 点数: A=14, K=13 ... 2=2; 花色: 黑桃>红桃>梅花>方块
// 流程: 发牌(每人13张) -> 各自摆牌(头3/中5/尾5, 顺序非法不允许摆) -> 全部确定 -> 比牌 -> 结算
// 牌型: 头道 三尖刀>对子>散牌; 中/尾道 五同>同花顺>炸弹>葫芦>同花>顺子>三条>两对>一对>散牌
// 特殊: 至尊青龙/一条龙/十二皇族/三同花顺/三套炸弹/全大/全小/凑一色/四套三条/五对三条/六对半/三同花/三顺子
// 结算: 逐道比,取该墩水数;同对手三道全胜=打枪,该组水数×2;水数在后台"玩法配置→十三水"可调
var db = require('../utils/db');
var userMgr = require('./usermgr');
var roomMgr = require('./roommgr');

var games = {};
var ARRANGE_SECONDS = 30;   // 摆牌倒计时(秒)

// ============ 牌面基础 ============
function suitOf(id){ return Math.floor((id % 52) / 13); }
function idxOf(id){ return id % 52 % 13; }
function rankVal(id){ var i = idxOf(id); return i == 0 ? 14 : i + 1; } // A=14 ... 2=2

function buildDeck(copies){
    // 6人桌两副牌(104张, id 0..103 保证唯一), 2/4人桌单副牌(52张)
    copies = copies || 1;
    var deck = [];
    for(var c = 0; c < copies; ++c){
        for(var i = 0; i < 52; ++i) deck.push(c * 52 + i);
    }
    return deck;
}
// 各玩法最少开局人数
function minPlayersOf(conf){
    // 2/4/6人桌都允许2人开局(房内已就座玩家全部准备即开始)
    return 2;
}
function shuffle(a){
    for(var i = a.length - 1; i > 0; --i){
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
    }
}

// ============ 规则参数(后台"玩法配置 → 十三水"写 tai_rules) ============
// 单项水数直接作为该墩的水数(不再额外+1基础水); sp_stack=1 时特殊牌型可与中/尾墩五同、同花顺、炸弹叠加
var SSS_DEFAULTS = {
    w_head3:3,
    w_mid5k:20, w_tail5k:10,
    w_mid_sf:10, w_tail_sf:5,
    w_mid_bomb:8, w_tail_bomb:4,
    w_mid_hl:3,
    sp_zql:52, sp_yl:26, sp_12hz:24, sp_3ths:20, sp_3bomb:20,
    sp_alld:15, sp_alls:12, sp_samecolor:10,
    sp_4t3:6, sp_5d3:5, sp_6d:3, sp_3th:3, sp_3sz:3,
    sp_stack:0
};
function rulesOf(conf){
    var src = conf && conf.taiRules;
    if(typeof src === 'string'){ try{ src = JSON.parse(src); }catch(e){ src = null; } }
    src = src || {};
    var out = {};
    for(var k in SSS_DEFAULTS){
        var v = src[k];
        out[k] = (v != null && v !== '' && !isNaN(Number(v))) ? Number(v) : SSS_DEFAULTS[k];
    }
    return out;
}

// ============ 牌型判定 ============
// 花色强弱: 黑桃>红桃>梅花>方块 (id: suit 0=黑桃 1=红桃 2=梅花 3=方块)
function suitPow(id){ return 3 - suitOf(id); }
function mkHand(lv, key, suitKey, name){
    return {lv:lv, key:key, suit:suitKey || [], name:name};
}
// 同牌型比较用: 取某点数里最大的花色
function bestSuitOf(cards, v){
    var s = -1;
    for(var i = 0; i < cards.length; ++i){
        if(rankVal(cards[i]) == v){ s = Math.max(s, suitPow(cards[i])); }
    }
    return s;
}

// 返回 {lv, key:[...], suit:[...], name}; lv 越大越强, key 比点数, suit 比花色
function eval5(cards){
    var cs = cards.slice().sort(function(a,b){ return (rankVal(b) - rankVal(a)) || (suitPow(b) - suitPow(a)); });
    var vals = cs.map(rankVal);
    var flush = true;
    for(var i = 1; i < 5; ++i){ if(suitOf(cs[i]) != suitOf(cs[0])){ flush = false; break; } }
    var cnt = {};
    for(var i = 0; i < 5; ++i){ cnt[vals[i]] = (cnt[vals[i]] || 0) + 1; }
    var groups = Object.keys(cnt).map(Number);
    groups.sort(function(a,b){ return (cnt[b] - cnt[a]) || (b - a); });
    var c0 = cnt[groups[0]] || 0, c1 = cnt[groups[1]] || 0;
    var uniq = groups.length;
    var stHigh = 0;
    if(uniq == 5){
        if(vals[0] - vals[4] == 4) stHigh = vals[0];
        else if(vals[0] == 14 && vals[1] == 5 && vals[2] == 4 && vals[3] == 3 && vals[4] == 2) stHigh = 5; // A2345
    }
    // 五同(两副牌): 五张同点数
    if(c0 == 5) return mkHand(9, [groups[0]], [bestSuitOf(cs, groups[0])], '五同');
    if(stHigh && flush) return mkHand(8, [stHigh], [bestSuitOf(cs, stHigh)], stHigh == 14 ? '皇家同花顺' : '同花顺');
    if(c0 == 4) return mkHand(7, [groups[0], groups[1]], [bestSuitOf(cs, groups[0]), bestSuitOf(cs, groups[1])], '炸弹');
    if(c0 == 3 && c1 == 2) return mkHand(6, [groups[0], groups[1]], [bestSuitOf(cs, groups[0]), bestSuitOf(cs, groups[1])], '葫芦');
    if(flush) return mkHand(5, vals, cs.map(suitPow), '同花');
    if(stHigh) return mkHand(4, [stHigh], [bestSuitOf(cs, stHigh)], '顺子');
    if(c0 == 3){
        var k3 = [groups[0]], s3 = [bestSuitOf(cs, groups[0])];
        for(var i = 0; i < groups.length; ++i){
            if(cnt[groups[i]] == 1){ k3.push(groups[i]); s3.push(bestSuitOf(cs, groups[i])); }
        }
        return mkHand(3, k3, s3, '三条');
    }
    if(c0 == 2 && c1 == 2){
        var pairHi = Math.max(groups[0], groups[1]), pairLo = Math.min(groups[0], groups[1]);
        var kicker = 0;
        for(var i = 0; i < groups.length; ++i){ if(cnt[groups[i]] == 1) kicker = groups[i]; }
        return mkHand(2, [pairHi, pairLo, kicker],
            [bestSuitOf(cs, pairHi), bestSuitOf(cs, pairLo), bestSuitOf(cs, kicker)], '两对');
    }
    if(c0 == 2){
        var kp = [groups[0]], sp = [bestSuitOf(cs, groups[0])];
        for(var i = 1; i < groups.length; ++i){ kp.push(groups[i]); sp.push(bestSuitOf(cs, groups[i])); }
        return mkHand(1, kp, sp, '一对');
    }
    return mkHand(0, vals, cs.map(suitPow), '散牌');
}

function eval3(cards){
    var cs = cards.slice().sort(function(a,b){ return (rankVal(b) - rankVal(a)) || (suitPow(b) - suitPow(a)); });
    var vals = cs.map(rankVal);
    if(vals[0] == vals[1] && vals[1] == vals[2]) return mkHand(3, [vals[0]], [bestSuitOf(cs, vals[0])], '三尖刀');
    if(vals[0] == vals[1]) return mkHand(1, [vals[0], vals[2]], [bestSuitOf(cs, vals[0]), bestSuitOf(cs, vals[2])], '对子');
    if(vals[1] == vals[2]) return mkHand(1, [vals[1], vals[0]], [bestSuitOf(cs, vals[1]), bestSuitOf(cs, vals[0])], '对子');
    return mkHand(0, vals, cs.map(suitPow), '散牌');
}

// 牌型比较: >0 表示 a 赢; 先比点数, 全同再比花色, 完全一样算和
function cmpHand(a, b){
    if(a.lv != b.lv) return a.lv - b.lv;
    var n = Math.min(a.key.length, b.key.length);
    for(var i = 0; i < n; ++i){
        if(a.key[i] != b.key[i]) return a.key[i] - b.key[i];
    }
    var sn = Math.min((a.suit || []).length, (b.suit || []).length);
    for(var i = 0; i < sn; ++i){
        if((a.suit[i] || 0) != (b.suit[i] || 0)) return (a.suit[i] || 0) - (b.suit[i] || 0);
    }
    return 0;
}

// 该墩的水数: 普通墩1水, 有牌型时取配置水数(作为总水数)
function roadWater(road, hand, R){
    if(road == 'head') return hand.lv == 3 ? R.w_head3 : 1;
    if(road == 'mid'){
        if(hand.lv == 9) return R.w_mid5k;
        if(hand.lv == 8) return R.w_mid_sf;
        if(hand.lv == 7) return R.w_mid_bomb;
        if(hand.lv == 6) return R.w_mid_hl;
        return 1;
    }
    if(hand.lv == 9) return R.w_tail5k;
    if(hand.lv == 8) return R.w_tail_sf;
    if(hand.lv == 7) return R.w_tail_bomb;
    return 1;
}

// 特殊牌型叠加用: 只累加中/尾墩的五同、同花顺、炸弹
function stackWater(seatHands, R){
    var w = 0;
    if(seatHands.midHand){
        if(seatHands.midHand.lv == 9) w += R.w_mid5k;
        else if(seatHands.midHand.lv == 8) w += R.w_mid_sf;
        else if(seatHands.midHand.lv == 7) w += R.w_mid_bomb;
    }
    if(seatHands.tailHand){
        if(seatHands.tailHand.lv == 9) w += R.w_tail5k;
        else if(seatHands.tailHand.lv == 8) w += R.w_tail_sf;
        else if(seatHands.tailHand.lv == 7) w += R.w_tail_bomb;
    }
    return w;
}

// 13张特殊牌型: 返回 {name, mult} 或 null
// 优先级: 至尊青龙 > 一条龙 > 十二皇族 > 三同花顺 > 三套炸弹 > 全大 > 全小
//        > 凑一色 > 四套三条 > 五对三条 > 六对半 > 三同花 > 三顺子
function detectSpecial(cards, arranged, R){
    R = R || SSS_DEFAULTS;
    var vals = cards.map(rankVal);
    var cnt = {};
    vals.forEach(function(v){ cnt[v] = (cnt[v] || 0) + 1; });
    var rankList = Object.keys(cnt).map(Number);
    var counts = rankList.map(function(k){ return cnt[k]; });
    var uniq = rankList.length;
    var fourN = 0, threeN = 0, twoN = 0, oneN = 0;
    counts.forEach(function(c){
        if(c >= 4) fourN++;
        else if(c == 3) threeN++;
        else if(c == 2) twoN++;
        else oneN++;
    });

    // 至尊青龙: 13张同一花色
    var oneSuit = true;
    for(var i = 1; i < cards.length; ++i){ if(suitOf(cards[i]) != suitOf(cards[0])){ oneSuit = false; break; } }
    if(oneSuit) return {name:'至尊青龙', mult:R.sp_zql};
    // 一条龙: A~K 各一张
    if(uniq == 13) return {name:'一条龙', mult:R.sp_yl};
    // 十二皇族: 12种点数(缺一种)+ 其中一张成对
    if(uniq == 12) return {name:'十二皇族', mult:R.sp_12hz};

    // 需要按头3/中5/尾5摆好才能判的三项
    var h = null, m = null, t = null, allFlush = false, allStraight = false;
    if(arranged && arranged.head && arranged.mid && arranged.tail){
        h = arranged.head; m = arranged.mid; t = arranged.tail;
        allFlush = isFlush(h) && isFlush(m) && isFlush(t);
        allStraight = isStraight(h, 3) && isStraight(m, 5) && isStraight(t, 5);
        if(isFlush(h) && isStraight(h, 3) && isFlush(m) && isStraight(m, 5) && isFlush(t) && isStraight(t, 5)){
            return {name:'三同花顺', mult:R.sp_3ths};
        }
    }
    // 三套炸弹: 3个四条 + 1张
    if(fourN == 3) return {name:'三套炸弹', mult:R.sp_3bomb};
    // 全大 / 全小
    var allBig = true, allSmall = true;
    for(var i = 0; i < vals.length; ++i){
        if(vals[i] < 8) allBig = false;
        if(vals[i] > 8) allSmall = false;
    }
    if(allBig) return {name:'全大', mult:R.sp_alld};
    if(allSmall) return {name:'全小', mult:R.sp_alls};
    // 凑一色: 全黑(黑桃/梅花) 或 全红(红桃/方块)
    var black = true, red = true;
    for(var i = 0; i < cards.length; ++i){
        var s = suitOf(cards[i]);
        if(s != 0 && s != 2) black = false;
        if(s != 1 && s != 3) red = false;
    }
    if(black || red) return {name:'凑一色', mult:R.sp_samecolor};
    // 四套三条: 4个三条 + 1张
    if(threeN == 4) return {name:'四套三条', mult:R.sp_4t3};
    // 五对三条: 5个对子 + 1个三条
    if(threeN == 1 && twoN == 5) return {name:'五对三条', mult:R.sp_5d3};
    // 六对半: 6个对子 + 1张
    if(twoN == 6 && oneN == 1) return {name:'六对半', mult:R.sp_6d};
    if(arranged && allFlush) return {name:'三同花', mult:R.sp_3th};
    if(arranged && allStraight) return {name:'三顺子', mult:R.sp_3sz};
    return null;
}
function isFlush(cards){
    var s = suitOf(cards[0]);
    for(var i = 1; i < cards.length; ++i){ if(suitOf(cards[i]) != s) return false; }
    return true;
}
function isStraight(cards, n){
    var vals = cards.map(rankVal).sort(function(a,b){ return b - a; });
    if(n == 3){
        if(vals[0] == 14 && vals[1] == 3 && vals[2] == 2) return true; // A23
        return vals[0] - vals[2] == 2 && vals[0] != vals[1] && vals[1] != vals[2];
    }
    if(vals[0] == 14 && vals[1] == 5 && vals[2] == 4 && vals[3] == 3 && vals[4] == 2) return true;
    return vals[0] - vals[4] == 4 && vals[0] != vals[1] && vals[1] != vals[2] && vals[2] != vals[3] && vals[3] != vals[4];
}

// 检查摆牌是否合法(head<=mid<=tail); 特殊牌型不受此限制
function checkOrder(head, mid, tail){
    var h = eval3(head), m = eval5(mid), t = eval5(tail);
    if(cmpHand(h, m) > 0) return false;
    if(cmpHand(m, t) > 0) return false;
    return true;
}

// ============ 自动摆牌: 穷举尾道/中道组合, 取总强度最高且合法的方案 ============
function autoArrange(cards){
    var best = null, bestScore = -1;
    var n = cards.length;
    var i, j;
    // 尾道组合: C(13,5)
    var tailIdx = [], midIdx = [];
    var combos5 = [];
    (function pick5(start, acc){
        if(acc.length == 5){ combos5.push(acc.slice()); return; }
        for(var k = start; k < n; ++k){ acc.push(k); pick5(k + 1, acc); acc.pop(); }
    })(0, []);
    for(i = 0; i < combos5.length; ++i){
        var tail = combos5[i];
        var tailHand = eval5(tail.map(function(x){ return cards[x]; }));
        var rest = [];
        for(j = 0; j < n; ++j){ if(tail.indexOf(j) < 0) rest.push(j); }
        // 中道组合: C(8,5)
        var midCombos = [];
        (function pick5b(start, acc){
            if(acc.length == 5){ midCombos.push(acc.slice()); return; }
            for(var k = start; k < rest.length; ++k){ acc.push(k); pick5b(k + 1, acc); acc.pop(); }
        })(0, []);
        for(j = 0; j < midCombos.length; ++j){
            var mid = midCombos[j].map(function(x){ return rest[x]; });
            var head = [];
            for(var k = 0; k < n; ++k){
                if(tail.indexOf(k) < 0 && mid.indexOf(k) < 0) head.push(k);
            }
            var headHand = eval3(head.map(function(x){ return cards[x]; }));
            var midHand = eval5(mid.map(function(x){ return cards[x]; }));
            if(cmpHand(headHand, midHand) > 0) continue;
            if(cmpHand(midHand, tailHand) > 0) continue;
            // 强度评分: 重点保尾道,其次中道,同型比点数
            var sc = (tailHand.lv * 1000000 + (tailHand.key[0] || 0) * 10000)
                   + (midHand.lv * 1000 + (midHand.key[0] || 0) * 10)
                   + (headHand.lv * 10 + (headHand.key[0] || 0));
            if(sc > bestScore){
                bestScore = sc;
                best = { head: head.map(function(x){ return cards[x]; }),
                         mid: mid.map(function(x){ return cards[x]; }),
                         tail: tail.map(function(x){ return cards[x]; }) };
            }
        }
    }
    return best;
}

// ============ 游戏对象 ============
function getGameByUserID(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return null;
    return games[roomId];
}

function collectSeats(roomInfo){
    var arr = [];
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(rs.userId > 0){
            arr.push({roomSeatIndex:i, userId:rs.userId, name:rs.name, score:rs.score || 0});
        }
    }
    return arr;
}

function getSeatsInfo(game){
    var info = [];
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        info.push({
            userid: s.userId,
            name: s.name,
            seatindex: i,
            roomSeatIndex: s.roomSeatIndex,
            confirmed: !!s.confirmed
        });
    }
    return info;
}

function sendStart(game){
    var seatsInfo = getSeatsInfo(game);
    var leftSec = Math.max(0, Math.round((game.arrangeDeadline - Date.now()) / 1000));
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        userMgr.sendMsg(s.userId, 'sss_start_push', {
            maxPlayers: game.gameSeats.length,
            seats: seatsInfo,
            mySeat: i,
            myCards: s.holds.slice().sort(function(a,b){ return a - b; }),
            arrangeDeadline: game.arrangeDeadline,
            arrangeSeconds: leftSec,
            confirmed: !!s.confirmed,
            arrange: s.arrange ? {head: s.arrange.head.slice(), mid: s.arrange.mid.slice(), tail: s.arrange.tail.slice()} : null,
            conf: game.conf
        });
    }
    scheduleArrangeTimeout(game);
}

// 摆牌超时: 未确定的自动摆牌并确定
function scheduleArrangeTimeout(game){
    if(game.arrangeTimer){ clearTimeout(game.arrangeTimer); game.arrangeTimer = null; }
    var seq = ++game.arrangeSeq;
    //按剩余时间计算(重连resend时会重新调度,不能按整段超时重新计时)
    var leftMs = (game.arrangeDeadline ? Math.max(0, game.arrangeDeadline - Date.now()) : ((game.conf && game.conf.arrangeTimeout) || ARRANGE_SECONDS) * 1000);
    game.arrangeTimer = setTimeout(function(){
        if(game.gameOver || seq != game.arrangeSeq) return;
        for(var i = 0; i < game.gameSeats.length; ++i){
            var s = game.gameSeats[i];
            if(s.confirmed) continue;
            var plan = autoArrange(s.holds);
            if(plan){ applyArrange(game, s, plan); }
            s.confirmed = true;
            userMgr.brocastInRoom(game.roomId, 'sss_ready_push', {seatindex: i, userid: s.userId, auto: true});
        }
        doCompare(game);
    }, leftMs + 800);
}

function applyArrange(game, seat, plan){
    seat.arrange = {head: plan.head, mid: plan.mid, tail: plan.tail};
    seat.headHand = eval3(plan.head);
    seat.midHand = eval5(plan.mid);
    seat.tailHand = eval5(plan.tail);
    seat.special = detectSpecial(seat.holds, seat.arrange, game.rules);
    seat.invalid = false; // 摆牌顺序非法在 arrange 入口已拦截
}

// ============ 比牌与结算 ============
function roadResult(seat, road){
    if(road == 'head') return seat.headHand;
    if(road == 'mid') return seat.midHand;
    return seat.tailHand;
}

function comparePair(game, i, j){
    var R = game.rules || SSS_DEFAULTS;
    var a = game.gameSeats[i], b = game.gameSeats[j];
    var detail = {a: i, b: j, roads: [], delta: 0, note: '', gun: false};

    // 特殊牌型: 按水数通吃; 同水数算和
    if(a.special || b.special){
        var wa = a.special ? (a.special.mult + (R.sp_stack ? stackWater(a, R) : 0)) : 0;
        var wb = b.special ? (b.special.mult + (R.sp_stack ? stackWater(b, R) : 0)) : 0;
        detail.delta = wa - wb;
        if(a.special) detail.note = a.special.name;
        if(b.special) detail.note = (detail.note ? detail.note + ' 对 ' : '') + b.special.name;
        return detail;
    }

    // 三道逐道比, 每墩取配置水数; 三道全胜=打枪, 该组水数×2
    var roads = ['head', 'mid', 'tail'];
    var winA = 0, winB = 0;
    for(var r = 0; r < roads.length; ++r){
        var road = roads[r];
        var ha = roadResult(a, road), hb = roadResult(b, road);
        var c = cmpHand(ha, hb);
        var item = {road: road, aName: ha.name, bName: hb.name, win: 0, gain: 0};
        if(c > 0){
            var g = roadWater(road, ha, R);
            detail.delta += g; item.win = 1; item.gain = g; winA++;
        } else if(c < 0){
            var g2 = roadWater(road, hb, R);
            detail.delta -= g2; item.win = -1; item.gain = -g2; winB++;
        }
        detail.roads.push(item);
    }
    if(winA == 3){
        detail.delta *= 2;
        detail.gun = true;
        detail.note = '打枪';
        a.gunCount = (a.gunCount || 0) + 1;
    } else if(winB == 3){
        detail.delta *= 2;
        detail.gun = true;
        detail.note = '被打枪';
        b.gunCount = (b.gunCount || 0) + 1;
    }
    return detail;
}

function doCompare(game){
    if(game.gameOver) return;
    game.gameOver = true;
    if(game.arrangeTimer){ clearTimeout(game.arrangeTimer); game.arrangeTimer = null; }

    var n = game.gameSeats.length;
    var deltas = [];
    for(var i = 0; i < n; ++i) deltas.push(0);
    for(var i = 0; i < n; ++i) game.gameSeats[i].gunCount = 0;

    var details = [];
    for(var i = 0; i < n; ++i){
        for(var j = i + 1; j < n; ++j){
            var d = comparePair(game, i, j);
            deltas[i] += d.delta;
            deltas[j] -= d.delta;
            details.push(d);
        }
    }
    // 全垒打: 本规则未启用(只按打枪×2结算)
    var baseScore = (game.conf && game.conf.baseScore) || 1;
    var roomInfo = roomMgr.getRoom(game.roomId);
    //results 按房间座位号对齐(客户端 GameNetMgr 用下标回写 seats[i].score), 空座位留空
    var seatCount = roomInfo ? roomInfo.seats.length : n;
    var results = new Array(seatCount);
    for(var i = 0; i < n; ++i){
        var s = game.gameSeats[i];
        var delta = deltas[i] * baseScore;
        s.score += delta;
        results[s.roomSeatIndex] = {
            userid: s.userId,
            name: s.name,
            seatindex: s.roomSeatIndex,
            roomSeatIndex: s.roomSeatIndex,
            gameSeat: i,
            arrange: s.arrange,
            special: s.special ? s.special.name : null,
            invalid: !!s.invalid,
            quanleida: !!s.quanleida,
            gun: s.gunCount || 0,
            delta: delta,
            score: delta,
            totalscore: s.score
        };
    }

    if(roomInfo){
        for(var i = 0; i < n; ++i){
            roomInfo.seats[game.gameSeats[i].roomSeatIndex].score = game.gameSeats[i].score;
        }
    }

    userMgr.brocastInRoom(game.roomId, 'sss_result_push', {
        results: results,
        details: details,
        baseScore: baseScore
    });
    console.log("[十三水] 比牌结算 room=" + game.roomId + " 人数=" + n + " 分数=" + JSON.stringify(deltas));
    // 本局结束: 清掉准备状态, 下一局必须玩家重新点准备/继续才开始
    if(roomInfo){
        for(var ri = 0; ri < roomInfo.seats.length; ++ri){ roomInfo.seats[ri].ready = false; }
    }
    userMgr.brocastInRoom(game.roomId, 'game_over_push', {
        results: results,
        baseScore: baseScore
    });

    // 房卡: 第一局结束一次性扣整场
    if(roomInfo){
        var cost = roomInfo.conf.cost || 0;
        if(roomInfo.numOfGames === 1 && cost > 0){
            for(var ci = 0; ci < roomInfo.seats.length; ++ci){
                var cuid = roomInfo.seats[ci].userId;
                if(cuid > 0){
                    (function(uid){
                        db.cost_gems(uid, cost, function(success){
                            console.log("[十三水][房卡扣除] 玩家", uid, "扣除", cost, "结果:", success);
                        });
                    })(cuid);
                }
            }
        }
    }

    // 整场结束 / 下一局
    if(roomInfo && roomInfo.numOfGames >= roomInfo.conf.maxGames){
        var endinfo = [];
        for(var i = 0; i < roomInfo.seats.length; ++i){
            var rs = roomInfo.seats[i];
            if(rs.userId > 0) endinfo.push({userid: rs.userId, name: rs.name, score: rs.score});
        }
        // 等客户端把亮牌动画播完(每家每道约 0.42s, 共 3 道)+ 本局结算展示, 再发总结算
        var revealMs = 2000 + n * 1200;
        setTimeout(function(){
            userMgr.brocastInRoom(game.roomId, 'game_end_push', {endinfo: endinfo});
            setTimeout(function(){
                userMgr.brocastInRoom(game.roomId, 'dispress_push', {});
                setTimeout(function(){
                    userMgr.kickAllInRoom(game.roomId);
                    roomMgr.destroy(game.roomId);
                    delete games[game.roomId];
                }, 500);
            }, 5000);
        }, revealMs);
    } else {
        delete games[game.roomId];
    }
}

// ============ 对外接口 ============
exports.start = function(roomInfo){
    // 已有一局在进行时不再重复发牌
    var running = games[roomInfo.id];
    if(running != null && !running.gameOver){
        console.log("[十三水] 已在对局中, 忽略重复开局 room=" + roomInfo.id);
        return;
    }
    var seatedPlayers = collectSeats(roomInfo);
    var minPlayers = minPlayersOf(roomInfo.conf);
    if(seatedPlayers.length < minPlayers){
        console.log("[十三水] 人数不足, 无法开局(", seatedPlayers.length, "/", minPlayers, ")");
        return;
    }

    //6人桌需要78张, 单副牌不够, 用两副牌
    var deck = buildDeck(roomInfo.conf.type == 'sss6' ? 2 : 1);
    shuffle(deck);

    var game = {
        roomId: roomInfo.id,
        gameSeats: [],
        gameOver: false,
        conf: roomInfo.conf,
        rules: rulesOf(roomInfo.conf),
        arrangeDeadline: Date.now() + ((roomInfo.conf && roomInfo.conf.arrangeTimeout) || ARRANGE_SECONDS) * 1000,
        arrangeSeq: 0,
        arrangeTimer: null
    };
    for(var i = 0; i < seatedPlayers.length; ++i){
        var sp = seatedPlayers[i];
        game.gameSeats.push({
            userId: sp.userId,
            name: sp.name,
            roomSeatIndex: sp.roomSeatIndex,
            holds: [],
            arrange: null,
            confirmed: false,
            invalid: false,
            special: null,
            score: sp.score,
            gunCount: 0
        });
    }
    // 发牌: 每人13张
    for(var r = 0; r < 13; ++r){
        for(var i = 0; i < game.gameSeats.length; ++i){
            game.gameSeats[i].holds.push(deck.pop());
        }
    }
    games[roomInfo.id] = game;
    console.log("[十三水] 开局 room=" + roomInfo.id + " 人数=" + game.gameSeats.length + " 底分=" + game.conf.baseScore);
    sendStart(game);
};

// 摆牌: data = {head:[3],mid:[5],tail:[5]} 或 {auto:true}
exports.arrange = function(userId, data){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    var seat = null, seatIndex = -1;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){ seat = game.gameSeats[i]; seatIndex = i; break; }
    }
    if(seat == null || seat.confirmed) return;

    var plan = null;
    if(!data || data.auto){
        plan = autoArrange(seat.holds);
    } else {
        var head = data.head, mid = data.mid, tail = data.tail;
        if(!head || !mid || !tail || head.length != 3 || mid.length != 5 || tail.length != 5){
            userMgr.sendMsg(userId, 'sss_error_push', {msg:'摆牌数量不对(需要头3/中5/尾5)'});
            return;
        }
        var all = head.concat(mid).concat(tail);
        var used = {};
        for(var i = 0; i < all.length; ++i){
            var c = Number(all[i]);
            if(seat.holds.indexOf(c) < 0 || used[c]){
                userMgr.sendMsg(userId, 'sss_error_push', {msg:'有牌不在手上或重复'});
                return;
            }
            used[c] = true;
        }
        plan = {head: head.map(Number), mid: mid.map(Number), tail: tail.map(Number)};
        var special = detectSpecial(seat.holds, plan, game.rules);
        if(!special && !checkOrder(plan.head, plan.mid, plan.tail)){
            userMgr.sendMsg(userId, 'sss_error_push', {msg:'牌型顺序错误: 头道须小于等于中道, 中道须小于等于尾道'});
            return;
        }
    }
    if(plan == null){
        userMgr.sendMsg(userId, 'sss_error_push', {msg:'自动摆牌失败'});
        return;
    }
    applyArrange(game, seat, plan);
    userMgr.sendMsg(userId, 'sss_arrange_ok_push', {
        head: seat.arrange.head,
        mid: seat.arrange.mid,
        tail: seat.arrange.tail,
        auto: !!(data && data.auto)
    });
    if(data && data.auto) exports.confirm(userId, true);
};

// 确定摆牌: 全部确定后开始比牌
exports.confirm = function(userId, silent){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    var seat = null, seatIndex = -1;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){ seat = game.gameSeats[i]; seatIndex = i; break; }
    }
    if(seat == null || seat.confirmed) return;
    if(!seat.arrange){
        var plan = autoArrange(seat.holds);
        if(plan == null) return;
        applyArrange(game, seat, plan);
    }
    seat.confirmed = true;
    if(!silent){
        userMgr.brocastInRoom(game.roomId, 'sss_ready_push', {seatindex: seatIndex, userid: userId});
    }
    var allConfirmed = true;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(!game.gameSeats[i].confirmed){ allConfirmed = false; break; }
    }
    if(allConfirmed){
        if(game.arrangeTimer){ clearTimeout(game.arrangeTimer); game.arrangeTimer = null; }
        setTimeout(function(){ doCompare(game); }, 800);
    }
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
    if(game != null && !game.gameOver){
        exports.resendGameState(roomId, userId);
        return;
    }
    //整场已打完(末尾结算/踢人窗口期内)不再接受准备, 避免多开一局
    if(roomInfo.conf.maxGames > 0 && roomInfo.numOfGames >= roomInfo.conf.maxGames){
        return;
    }
    if(s.ready) return;
    s.ready = true;

    var count = 0, total = 0;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        if(roomInfo.seats[i].userId > 0) total++;
        if(roomInfo.seats[i].ready) count++;
    }
    var minPlayers = minPlayersOf(roomInfo.conf);
    if(count >= minPlayers && count >= total && !roomInfo._sssStarting){
        roomInfo._sssStarting = true;
        setTimeout(function(){
            roomInfo._sssStarting = false;
            var room = roomMgr.getRoom(roomId);
            if(room != null) exports.begin(room);
        }, 1000);
    }
};

exports.begin = function(roomInfo){
    // 防重复开局: 两端几乎同时准备/重发ready会多次触发begin, 重复开局会让客户端反复重播发牌动画
    var cur = games[roomInfo.id];
    if(cur != null && !cur.gameOver){
        console.log("[十三水] 房间已开局, 忽略重复开始 room=" + roomInfo.id);
        return;
    }
    // 人数不足直接返回: 不递增局数、不清准备状态, 避免房间卡死
    var minPlayers = minPlayersOf(roomInfo.conf);
    if(collectSeats(roomInfo).length < minPlayers){
        console.log("[十三水] 人数不足, 无法开局(" + collectSeats(roomInfo).length + "/" + minPlayers + ")");
        return;
    }
    roomInfo.numOfGames++;
    for(var i = 0; i < roomInfo.seats.length; ++i){ roomInfo.seats[i].ready = false; }
    db.update_num_of_turns(roomInfo.id, roomInfo.numOfGames);

    var anySeat = null;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        if(roomInfo.seats[i].userId > 0){ anySeat = roomInfo.seats[i]; break; }
    }
    if(anySeat == null) return;
    userMgr.broacastInRoom('game_num_push', roomInfo.numOfGames, anySeat.userId, true);
    userMgr.broacastInRoom('game_begin_push', roomInfo.nextButton, anySeat.userId, true);
    exports.start(roomInfo);
};

exports.isPlaying = function(roomId){
    return games[roomId] != null;
};

exports.hasBegan = function(roomId){
    var game = games[roomId];
    return game != null && game.gameOver != true;
};

exports.resendGameState = function(roomId, userId){
    var game = games[roomId];
    if(game == null || game.gameOver) return;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){
            var s = game.gameSeats[i];
            userMgr.sendMsg(userId, 'sss_start_push', {
                maxPlayers: game.gameSeats.length,
                seats: getSeatsInfo(game),
                mySeat: i,
                myCards: s.holds.slice().sort(function(a,b){ return a - b; }),
                arrangeDeadline: game.arrangeDeadline,
                arrangeSeconds: Math.max(0, Math.round((game.arrangeDeadline - Date.now()) / 1000)),
                arrange: s.arrange,
                confirmed: s.confirmed,
                conf: game.conf
            });
            return;
        }
    }
};

// 玩家中途退出: 未确定则自动摆牌确定, 避免整桌卡住
exports.onPlayerExit = function(roomId, userId){
    var game = games[roomId];
    if(game == null || game.gameOver) return;
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        if(s.userId != userId || s.confirmed) continue;
        var plan = autoArrange(s.holds);
        if(plan) applyArrange(game, s, plan);
        s.confirmed = true;
        userMgr.brocastInRoom(game.roomId, 'sss_ready_push', {seatindex: i, userid: userId, auto: true});
    }
    var allConfirmed = true;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(!game.gameSeats[i].confirmed){ allConfirmed = false; break; }
    }
    if(allConfirmed) setTimeout(function(){ doCompare(game); }, 500);
};

exports.allowExit = function(roomId){
    var game = games[roomId];
    return game == null;
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
    roomInfo.dr = {endTime: Date.now() + 300000, states: states};
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
        if(userId > 0) userMgr.sendMsg(userId, 'dispress_push', {});
    }
    roomInfo.dr = null;
    delete games[roomId];
    // 先让 dispress_push 发出去再销毁, 否则底层写缓冲会被丢弃
    setTimeout(function(){
        try{ userMgr.kickAllInRoom(roomId); }catch(e){}
        roomMgr.destroy(roomId);
    }, 150);
};

// 其他玩法的操作事件: 空实现, 避免 socket_service 调用报错
exports.chupai = function(){};
exports.peng = function(){};
exports.gang = function(){};
exports.hu = function(){};
exports.chi = function(){};
exports.guo = function(){};
exports.bao = function(){};
exports.bet = function(){};
exports.continueRound = function(){};
