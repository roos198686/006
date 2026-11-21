// 十三水(2人/4人/6人) 牌桌 —— 按 mjgame_sss 场景节点接入
// 流程:
//   进房/开局 -> 开始动画(bbShuffleAnim) -> 发牌动画(飞到 bbSeatN/bbCards 的 13 个节点)
//   -> 其他玩家 bbMb 播 "理牌中-1/2/3" 动画
//   -> 自己摆牌(默认自动 bbArrange-a, 可切手动 bbArrange) -> 点"开始比牌"(bbOkBtn/-a) 提交
//   -> 其他玩家点确定后 bbMb 显示 "已完成"
//   -> 全部确定后 从头道开始轮流亮牌(亮完头道再中道/尾道), 亮到的一道置顶并在牌面显示牌型图片
//   -> 结算
// 协议:
//   sss_start_push {myCards,mySeat,seats,arrangeDeadline,arrangeSeconds,confirmed,arrange,conf}
//   sss_arrange_ok_push {head,mid,tail,auto} | sss_ready_push {seatindex,userid,auto}
//   sss_error_push {msg} | sss_result_push {results,details,baseScore}
// 上行: sss_arrange {head,mid,tail} | sss_confirm | ready | exit | dissolve_request

var SUIT_FRAMES = ["Spade", "Heart", "Club", "Diamond"];
var SUIT_SYMBOLS = ["\u2660", "\u2665", "\u2663", "\u2666"];
var RANK_NAMES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
var ROAD_CAP = { head: 3, mid: 5, tail: 5 };
var ROAD_START = { head: 0, mid: 3, tail: 8 };
var ROAD_NAMES = { head: "\u524d\u9053", mid: "\u4e2d\u9053", tail: "\u540e\u9053" };
var ROADS = ["tail", "mid", "head"];
var ROAD_BY_ROW = ["head", "mid", "tail"];
var ROAD_ROW = { head: 0, mid: 1, tail: 2 };
// 场景 bbSeat0~5 的逆时针落座顺序(自己=bbSeat0 最下方)
var SEAT_RING = [0, 5, 4, 3, 2, 1];
// 手动面板 bootNode/Sprite0~8 对应的牌型等级(1对子 2两对 3三条 4顺子 5同花 6葫芦 7铁支 8同花顺 9五同)
var TYPE_BTN_LV = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// 牌型图片(png 文件夹)
var IMG_TYPE = {
    head: { 3: "\u51b2\u4e09", 1: "\u5bf9\u5b50" },
    mid: { 9: "\u4e94\u540c", 8: "\u540c\u82b1\u987a", 7: "\u94c1\u652f", 6: "\u846b\u82a6", 5: "\u540c\u82b1", 4: "\u987a\u5b50", 3: "\u4e09\u6761", 2: "\u4e8c\u5bf9", 1: "\u5bf9\u5b50" },
    tail: { 9: "\u4e94\u540c", 8: "\u540c\u82b1\u987a", 7: "\u94c1\u652f", 6: "\u846b\u82a6", 5: "\u540c\u82b1", 4: "\u987a\u5b50", 3: "\u4e09\u6761", 2: "\u4e8c\u5bf9", 1: "\u5bf9\u5b50" }
};
var IMG_NAMES = [
    "\u7406\u724c\u4e2d-1", "\u7406\u724c\u4e2d-2", "\u7406\u724c\u4e2d-3",
    "\u5df2\u5b8c\u6210", "\u7279\u6b8a\u724c\u578b",
    "\u5bf9\u5b50", "\u4e8c\u5bf9", "\u4e09\u6761", "\u51b2\u4e09", "\u987a\u5b50", "\u540c\u82b1", "\u846b\u82a6", "\u94c1\u652f", "\u540c\u82b1\u987a", "\u4e94\u540c"
];

// ================= 牌型算法(与服务端 gamemgr_sss.js 一致) =================
function suitOf(id) { return Math.floor((id % 52) / 13); }
function rankVal(id) { var i = id % 52 % 13; return i == 0 ? 14 : i + 1; }
function suitPow(id) { return 3 - suitOf(id); }
function mkHand(lv, key, suitKey) { return { lv: lv, key: key, suit: suitKey || [] }; }
function bestSuitOf(cards, v) {
    var s = -1;
    for (var i = 0; i < cards.length; ++i) { if (rankVal(cards[i]) == v) s = Math.max(s, suitPow(cards[i])); }
    return s;
}

function eval5(cards) {
    var cs = cards.slice().sort(function (a, b) { return (rankVal(b) - rankVal(a)) || (suitPow(b) - suitPow(a)); });
    var vals = cs.map(rankVal);
    var flush = true;
    for (var i = 1; i < 5; ++i) { if (suitOf(cs[i]) != suitOf(cs[0])) { flush = false; break; } }
    var cnt = {};
    for (var i = 0; i < 5; ++i) { cnt[vals[i]] = (cnt[vals[i]] || 0) + 1; }
    var groups = Object.keys(cnt).map(Number);
    groups.sort(function (a, b) { return (cnt[b] - cnt[a]) || (b - a); });
    var c0 = cnt[groups[0]] || 0, c1 = cnt[groups[1]] || 0;
    var uniq = groups.length;
    var stHigh = 0;
    if (uniq == 5) {
        if (vals[0] - vals[4] == 4) stHigh = vals[0];
        else if (vals[0] == 14 && vals[1] == 5 && vals[2] == 4 && vals[3] == 3 && vals[4] == 2) stHigh = 5;
    }
    if (c0 == 5) return mkHand(9, [groups[0]], [bestSuitOf(cs, groups[0])]);   // 五同
    if (stHigh && flush) return mkHand(8, [stHigh], [bestSuitOf(cs, stHigh)]);  // 同花顺
    if (c0 == 4) return mkHand(7, [groups[0], groups[1]], [bestSuitOf(cs, groups[0]), bestSuitOf(cs, groups[1])]);
    if (c0 == 3 && c1 == 2) return mkHand(6, [groups[0], groups[1]], [bestSuitOf(cs, groups[0]), bestSuitOf(cs, groups[1])]);
    if (flush) return mkHand(5, vals, cs.map(suitPow));
    if (stHigh) return mkHand(4, [stHigh], [bestSuitOf(cs, stHigh)]);
    if (c0 == 3) {
        var k3 = [groups[0]], s3 = [bestSuitOf(cs, groups[0])];
        for (var i3 = 0; i3 < groups.length; ++i3) {
            if (cnt[groups[i3]] == 1) { k3.push(groups[i3]); s3.push(bestSuitOf(cs, groups[i3])); }
        }
        return mkHand(3, k3, s3);
    }
    if (c0 == 2 && c1 == 2) {
        var pairHi = Math.max(groups[0], groups[1]), pairLo = Math.min(groups[0], groups[1]);
        var kicker = 0;
        for (var i2 = 0; i2 < groups.length; ++i2) { if (cnt[groups[i2]] == 1) kicker = groups[i2]; }
        return mkHand(2, [pairHi, pairLo, kicker],
            [bestSuitOf(cs, pairHi), bestSuitOf(cs, pairLo), bestSuitOf(cs, kicker)]);
    }
    if (c0 == 2) {
        var kp = [groups[0]], sp = [bestSuitOf(cs, groups[0])];
        for (var i1 = 1; i1 < groups.length; ++i1) { kp.push(groups[i1]); sp.push(bestSuitOf(cs, groups[i1])); }
        return mkHand(1, kp, sp);
    }
    return mkHand(0, vals, cs.map(suitPow));
}

function eval3(cards) {
    var cs = cards.slice().sort(function (a, b) { return (rankVal(b) - rankVal(a)) || (suitPow(b) - suitPow(a)); });
    var vals = cs.map(rankVal);
    if (vals[0] == vals[1] && vals[1] == vals[2]) return mkHand(3, [vals[0]], [bestSuitOf(cs, vals[0])]);
    if (vals[0] == vals[1]) return mkHand(1, [vals[0], vals[2]], [bestSuitOf(cs, vals[0]), bestSuitOf(cs, vals[2])]);
    if (vals[1] == vals[2]) return mkHand(1, [vals[1], vals[0]], [bestSuitOf(cs, vals[1]), bestSuitOf(cs, vals[0])]);
    return mkHand(0, vals, cs.map(suitPow));
}

function cmpHand(a, b) {
    if (a.lv != b.lv) return a.lv - b.lv;
    var n = Math.min(a.key.length, b.key.length);
    for (var i = 0; i < n; ++i) {
        if (a.key[i] != b.key[i]) return a.key[i] - b.key[i];
    }
    var sn = Math.min((a.suit || []).length, (b.suit || []).length);
    for (var j = 0; j < sn; ++j) {
        if ((a.suit[j] || 0) != (b.suit[j] || 0)) return (a.suit[j] || 0) - (b.suit[j] || 0);
    }
    return 0;
}

function handTypeName(road, hand) {
    if (hand.lv == 0) return "\u6563\u724c";
    if (hand.lv == 1) return "\u5bf9\u5b50";
    if (hand.lv == 2) return "\u4e24\u5bf9";
    if (hand.lv == 3) return road == "head" ? "\u4e09\u5c16\u5200" : "\u4e09\u6761";
    if (hand.lv == 4) return "\u987a\u5b50";
    if (hand.lv == 5) return "\u540c\u82b1";
    if (hand.lv == 6) return "\u846b\u82a6";
    if (hand.lv == 7) return "\u70b8\u5f39";
    if (hand.lv == 8) return "\u540c\u82b1\u987a";
    if (hand.lv == 9) return "\u4e94\u540c";
    return "";
}

function isFlushCards(cards) {
    var s = suitOf(cards[0]);
    for (var i = 1; i < cards.length; ++i) { if (suitOf(cards[i]) != s) return false; }
    return true;
}
function isStraightCards(cards, n) {
    var vals = cards.map(rankVal).sort(function (a, b) { return b - a; });
    if (n == 3) {
        if (vals[0] - vals[2] == 2) return true;
        return (vals[0] == 14 && vals[1] == 3 && vals[2] == 2);
    }
    if (vals[0] - vals[4] == 4) return true;
    return (vals[0] == 14 && vals[1] == 5 && vals[2] == 4 && vals[3] == 3 && vals[4] == 2);
}

// 13 张特殊牌型(与服务端判定顺序一致), 只返回名称
function detectSpecialClient(cards, arranged) {
    if (!cards || cards.length < 13) return null;
    var vals = cards.map(rankVal);
    var cnt = {};
    vals.forEach(function (v) { cnt[v] = (cnt[v] || 0) + 1; });
    var rankList = Object.keys(cnt).map(Number);
    var uniq = rankList.length;
    var fourN = 0, threeN = 0, twoN = 0, oneN = 0;
    rankList.forEach(function (k) {
        var c = cnt[k];
        if (c >= 4) fourN++; else if (c == 3) threeN++; else if (c == 2) twoN++; else oneN++;
    });
    var oneSuit = true;
    for (var i = 1; i < cards.length; ++i) { if (suitOf(cards[i]) != suitOf(cards[0])) { oneSuit = false; break; } }
    if (oneSuit) return "\u81f3\u5c0a\u9752\u9f99";
    if (uniq == 13) return "\u4e00\u6761\u9f99";
    if (uniq == 12) return "\u5341\u4e8c\u7687\u65cf";
    if (arranged && arranged.head && arranged.mid && arranged.tail) {
        var h = arranged.head, m = arranged.mid, t = arranged.tail;
        if (h.length == 3 && m.length == 5 && t.length == 5 &&
            isFlushCards(h) && isFlushCards(m) && isFlushCards(t) &&
            isStraightCards(h, 3) && isStraightCards(m, 5) && isStraightCards(t, 5)) {
            return "\u4e09\u540c\u82b1\u987a";
        }
    }
    if (fourN == 3) return "\u4e09\u5957\u70b8\u5f39";
    var allBig = true, allSmall = true;
    for (var bi = 0; bi < vals.length; ++bi) {
        if (vals[bi] < 8) allBig = false;
        if (vals[bi] > 8) allSmall = false;
    }
    if (allBig) return "\u5168\u5927";
    if (allSmall) return "\u5168\u5c0f";
    var black = true, red = true;
    for (var ci = 0; ci < cards.length; ++ci) {
        var su = suitOf(cards[ci]);
        if (su != 0 && su != 2) black = false;
        if (su != 1 && su != 3) red = false;
    }
    if (black || red) return "\u51d1\u4e00\u8272";
    if (threeN == 4) return "\u56db\u5957\u4e09\u6761";
    if (threeN == 1 && twoN == 5) return "\u4e94\u5bf9\u4e09\u6761";
    if (twoN == 6 && oneN == 1) return "\u516d\u5bf9\u534a";
    if (arranged && arranged.head && arranged.mid && arranged.tail) {
        var h2 = arranged.head, m2 = arranged.mid, t2 = arranged.tail;
        if (h2.length == 3 && m2.length == 5 && t2.length == 5 && isFlushCards(h2) && isFlushCards(m2) && isFlushCards(t2)) return "\u4e09\u540c\u82b1";
        if (h2.length == 3 && m2.length == 5 && t2.length == 5 && isStraightCards(h2, 3) && isStraightCards(m2, 5) && isStraightCards(t2, 5)) return "\u4e09\u987a\u5b50";
    }
    return null;
}

// 穷举合法摆法, 取评分最高的 need 种(自动摆牌 / 右侧 4 个最佳搭配)
function arrangeCandidates(cards, need) {
    var n = cards.length;
    if (n < 13) return [];
    need = need || 4;
    var best = [];
    // 5张/3张牌型只算一次(同一组牌在不同搭配里重复出现)
    var cache5 = {}, cache3 = {};
    var hand5 = function (idxs) {
        var key = idxs.join(",");
        var h = cache5[key];
        if (!h) {
            var cs = [];
            for (var i = 0; i < idxs.length; ++i) cs.push(cards[idxs[i]]);
            h = eval5(cs);
            cache5[key] = h;
        }
        return h;
    };
    var hand3 = function (idxs) {
        var key = idxs.join(",");
        var h = cache3[key];
        if (!h) {
            var cs = [];
            for (var i = 0; i < idxs.length; ++i) cs.push(cards[idxs[i]]);
            h = eval3(cs);
            cache3[key] = h;
        }
        return h;
    };
    // 同一套牌型组合(lv 组合)只保留最强的一副; 保证 4 个搭配看起来不一样
    var byType = {};
    var combos5 = [];
    (function pick5(start, acc) {
        if (acc.length == 5) { combos5.push(acc.slice()); return; }
        for (var k = start; k < n; ++k) { acc.push(k); pick5(k + 1, acc); acc.pop(); }
    })(0, []);
    for (var i = 0; i < combos5.length; ++i) {
        var tail = combos5[i];
        var tailCards = tail.map(function (x) { return cards[x]; });
        var tailHand = hand5(tail);
        var rest = [];
        for (var j = 0; j < n; ++j) { if (tail.indexOf(j) < 0) rest.push(j); }
        var midCombos = [];
        (function pick5b(start, acc) {
            if (acc.length == 5) { midCombos.push(acc.slice()); return; }
            for (var k = start; k < rest.length; ++k) { acc.push(k); pick5b(k + 1, acc); acc.pop(); }
        })(0, []);
        for (var m = 0; m < midCombos.length; ++m) {
            var mid = midCombos[m].map(function (x) { return rest[x]; });
            var head = [];
            for (var hh = 0; hh < n; ++hh) {
                if (tail.indexOf(hh) < 0 && mid.indexOf(hh) < 0) head.push(hh);
            }
            var headHand = hand3(head);
            var midHand = hand5(mid);
            if (cmpHand(headHand, midHand) > 0) continue;
            if (cmpHand(midHand, tailHand) > 0) continue;
            var sc = handScore(tailHand) * 1e6 + handScore(midHand) * 1e3 + handScore(headHand);
            var sig = headHand.lv + "|" + midHand.lv + "|" + tailHand.lv;
            var cur = byType[sig];
            if (cur && cur.sc >= sc) continue;
            byType[sig] = {
                sc: sc,
                head: head.map(function (x) { return cards[x]; }),
                mid: mid.map(function (x) { return cards[x]; }),
                tail: tailCards
            };
        }
    }
    var list = [];
    for (var key in byType) list.push(byType[key]);
    list.sort(function (a, b) { return b.sc - a.sc; });
    return list.slice(0, need);
}

// 单副牌的强度分: 牌型 > 点数 > 花色
function handScore(h) {
    var s = h.lv * 1e4;
    s += (h.key[0] || 0) * 100 + (h.key[1] || 0) * 10 + (h.key[2] || 0);
    s += (h.suit && h.suit[0] ? h.suit[0] : 0) * 0.01;
    return s;
}

// ================= 手动选牌: 按牌型挑出最合适的一组 =================
function groupByRank(ids) {
    var m = {};
    for (var i = 0; i < ids.length; ++i) {
        var v = rankVal(ids[i]);
        (m[v] = m[v] || []).push(ids[i]);
    }
    return m;
}
function sortIdsDesc(ids) {
    return ids.slice().sort(function (a, b) { return (rankVal(b) - rankVal(a)) || (suitPow(b) - suitPow(a)); });
}
function findStraightIds(ids, suit) {
    var byRank = {};
    for (var i = 0; i < ids.length; ++i) {
        if (suit != null && suitOf(ids[i]) != suit) continue;
        var v = rankVal(ids[i]);
        if (!byRank[v] || suitPow(ids[i]) > suitPow(byRank[v])) byRank[v] = ids[i];
    }
    for (var high = 14; high >= 5; --high) {
        var out = [], ok = true;
        for (var d = 0; d < 5; ++d) {
            if (!byRank[high - d]) { ok = false; break; }
            out.push(byRank[high - d]);
        }
        if (ok) return out;
    }
    if (byRank[14] && byRank[5] && byRank[4] && byRank[3] && byRank[2]) {
        return [byRank[14], byRank[5], byRank[4], byRank[3], byRank[2]];
    }
    return null;
}
function findFlushIds(ids) {
    var bySuit = {};
    for (var i = 0; i < ids.length; ++i) {
        var s = suitOf(ids[i]);
        (bySuit[s] = bySuit[s] || []).push(ids[i]);
    }
    var best = null;
    for (var s2 in bySuit) {
        var arr = sortIdsDesc(bySuit[s2]);
        if (arr.length >= 5) {
            if (!best) best = arr.slice(0, 5);
        }
    }
    return best;
}
function pickTypeIds(lv, hand) {
    var byRank = groupByRank(hand);
    var ranks = Object.keys(byRank).map(Number).sort(function (a, b) { return b - a; });
    var i, r;
    if (lv == 9) { // 五同
        for (i = 0; i < ranks.length; ++i) {
            if (byRank[ranks[i]].length >= 5) return sortIdsDesc(byRank[ranks[i]]).slice(0, 5);
        }
        return null;
    }
    if (lv == 8) { // 同花顺
        var suits = [0, 1, 2, 3];
        for (i = 0; i < suits.length; ++i) {
            var st = findStraightIds(hand, suits[i]);
            if (st) return st;
        }
        return null;
    }
    if (lv == 7) { // 铁支(炸弹)+最大散牌
        for (i = 0; i < ranks.length; ++i) {
            r = ranks[i];
            if (byRank[r].length >= 4) {
                var quad = sortIdsDesc(byRank[r]).slice(0, 4);
                var kick = null;
                for (var j = 0; j < ranks.length; ++j) {
                    if (ranks[j] == r) continue;
                    kick = sortIdsDesc(byRank[ranks[j]])[0];
                    break;
                }
                if (kick != null) quad.push(kick);
                return quad;
            }
        }
        return null;
    }
    if (lv == 6) { // 葫芦: 三条+对子
        var tripR = null, pairR = null;
        for (i = 0; i < ranks.length; ++i) {
            if (byRank[ranks[i]].length >= 3 && tripR == null) tripR = ranks[i];
        }
        if (tripR == null) return null;
        for (i = 0; i < ranks.length; ++i) {
            if (ranks[i] != tripR && byRank[ranks[i]].length >= 2) { pairR = ranks[i]; break; }
        }
        if (pairR == null) return null;
        return sortIdsDesc(byRank[tripR]).slice(0, 3).concat(sortIdsDesc(byRank[pairR]).slice(0, 2));
    }
    if (lv == 5) return findFlushIds(hand);
    if (lv == 4) return findStraightIds(hand, null);
    if (lv == 3) { // 三条
        for (i = 0; i < ranks.length; ++i) {
            if (byRank[ranks[i]].length >= 3) return sortIdsDesc(byRank[ranks[i]]).slice(0, 3);
        }
        return null;
    }
    if (lv == 2) { // 两对+散牌
        var pairs = [];
        for (i = 0; i < ranks.length; ++i) {
            if (byRank[ranks[i]].length >= 2) pairs.push(ranks[i]);
        }
        if (pairs.length < 2) return null;
        var two = sortIdsDesc(byRank[pairs[0]]).slice(0, 2)
            .concat(sortIdsDesc(byRank[pairs[1]]).slice(0, 2));
        var kick2 = null;
        for (i = 0; i < ranks.length; ++i) {
            if (ranks[i] == pairs[0] || ranks[i] == pairs[1]) continue;
            kick2 = sortIdsDesc(byRank[ranks[i]])[0];
            break;
        }
        if (kick2 != null) two.push(kick2);
        return two;
    }
    if (lv == 1) { // 对子
        for (i = 0; i < ranks.length; ++i) {
            if (byRank[ranks[i]].length >= 2) return sortIdsDesc(byRank[ranks[i]]).slice(0, 2);
        }
        return null;
    }
    return null;
}
function typeImgOf(road, ids) {
    if (!ids || ids.length != ROAD_CAP[road]) return null;
    var hand = (road == "head") ? eval3(ids) : eval5(ids);
    var m = IMG_TYPE[road] || {};
    return m[hand.lv] || null;
}

// ================= 牌桌 =================
cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad: function () {
        if (!cc.vv) {
            cc.director.loadScene("loading");
            return;
        }
        this._leaving = false;
        this._phase = "idle";        // idle/dealing/arrange/reveal/settle/end
        this._sat = false;
        this._playedOnce = false;    // 本房是否已经开过局(开过之后自己座位不再显示"已准备")
        this._dealing = false;
        this._confirmed = false;
        this._roundRevealed = false;   // 本局是否已经亮完牌(亮完后桌上保持牌面)
        this._pendingGameEnd = null;   // 亮牌期间收到的总结算, 等归位后再弹
        this._pendingConfirm = false;
        this._autoMode = true;
        this._final = false;
        this._revealing = false;
        this._revealToken = 0;
        this._revealTimer = null;
        this._dealingSec = 0;
        this._leftSec = 0;
        this._arrangeDeadline = 0;

        this._cards = [];
        this._hand = [];
        this._roads = { head: [], mid: [], tail: [] };
        this._picked = {};
        this._candidates = [];
        this._autoIdx = 0;
        this._ownSpecial = null;
        this._resultByRoom = {};
        this._lastResult = null;

        this._myUserId = (cc.vv && cc.vv.userMgr) ? cc.vv.userMgr.userId : 0;
        this._seatSig = null;   // 座位数据指纹(座位变化时自动刷新 username/昵称/分数/头像)
        this._imgs = {};
        this._imgsReady = false;
        this._frames = null;
        this._startFrames = null;
        this._fxTimer = null;

        this._n = {};
        this._bindUI();
        // 进房/发牌前, 座位上 13 张手牌全部隐藏(等发牌动画再逐张亮出)
        this._resetSeatsCards(false);
        this._spine = {};
        this._loadCards();
        this._loadSz();
        this._loadImgs();
        this._loadStartFx();
        this._loadSpines();
        this._loadGunFrames();
        this._bindNet();
        this._refreshSeats();
        this._szResetAll();            // 开局前不显示比牌分数
        this.renderAll();
        if (cc.vv.audioMgr) cc.vv.audioMgr.playBGM("bgFight.mp3");
        this.schedule(this._tick, 1);
        this.schedule(this._mbTick, 0.36);
    },

    onDestroy: function () {
        this.unschedule(this._tick);
        this.unschedule(this._mbTick);
        if (this._revealTimer) { clearTimeout(this._revealTimer); this._revealTimer = null; }
        if (this._toastTimer) { clearTimeout(this._toastTimer); this._toastTimer = null; }
        if (this._fxTimer) { clearInterval(this._fxTimer); this._fxTimer = null; }
        if (this._sio && this._sioListeners) {
            this._sio.removeListener("exit_result", this._sioListeners.exit_result);
            this._sio.removeListener("dispress_push", this._sioListeners.dispress_push);
            this._sioListeners = null;
        }
        if (cc.vv && cc.vv.gameNetMgr && cc.vv.gameNetMgr.dataEventHandler == this.node) {
            cc.vv.gameNetMgr.dataEventHandler = null;
        }
    },

    // ================= 场景节点 =================
    _findIn: function (root, name) {
        if (!root) return null;
        if (root.name === name) return root;
        var cs = root.children;
        for (var i = 0; i < cs.length; ++i) {
            var r = this._findIn(cs[i], name);
            if (r) return r;
        }
        return null;
    },
    // 子节点名容错: 场景里节点名可能带多余空格(如 "avatar "), 精确查不到时再按 trim 后比对
    _childLoose: function (root, name) {
        if (!root) return null;
        var c = root.getChildByName(name);
        if (c) return c;
        for (var i = 0; i < root.children.length; ++i) {
            var n = root.children[i];
            if (n.name && n.name.trim() === name) return n;
        }
        return null;
    },
    _find: function (name) {
        var r = this._findIn(this.node, name);
        if (r) return r;
        var sc = cc.director.getScene ? cc.director.getScene() : null;
        if (sc && sc !== this.node) return this._findIn(sc, name);
        return null;
    },
    _labelOf: function (node) { return node ? node.getComponent(cc.Label) : null; },
    _spriteOf: function (node) { return node ? node.getComponent(cc.Sprite) : null; },
    _bindTap: function (node, cb, noSound) {
        if (!node) return;
        node.on(cc.Node.EventType.TOUCH_END, function (ev) {
            if (ev && ev.stopPropagation) ev.stopPropagation();
            if (!noSound && cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("btnClick.wav");
            if (cb) cb(ev);
        });
    },
    _sortedByX: function (nodes) {
        return nodes.slice().sort(function (a, b) { return a.x - b.x; });
    },

    _seatInfo: function (root, k) {
        if (!root) return null;
        var box = null, i, c;
        for (i = 0; i < root.children.length; ++i) {
            c = root.children[i];
            if (c.name === "bbCards" || c.name === "01") { box = c; break; }
        }
        if (!box) {
            for (i = 0; i < root.children.length; ++i) {
                c = root.children[i];
                var cnt = 0;
                for (var j = 0; j < c.children.length; ++j) {
                    if (c.children[j].name.indexOf("bbCard") === 0) cnt++;
                }
                if (cnt >= 10) { box = c; break; }
            }
        }
        // 13 张牌直接按场景节点顺序取(前3/中5/后5 就是场景里节点的排列顺序),
        // 不再用 JS 按坐标重新排序/分行
        var cards = [];
        if (box) {
            for (i = 0; i < box.children.length; ++i) {
                if (box.children[i].name.indexOf("bbCard") === 0) cards.push(box.children[i]);
            }
        }
        var mb = this._findIn(root, "bbMb");
        var mbSp = null;
        if (mb) {
            mbSp = mb.getComponent(cc.Sprite);
            if (!mbSp) mbSp = mb.addComponent(cc.Sprite);
            mb.active = false;
            // 提示图要压在牌背上面
            if (mb.parent) mb.setSiblingIndex(mb.parent.children.length - 1);
            // 自家里自带的"特殊牌型"文字节点, 统一改用图片显示
            var mt = this._findIn(mb, "bbMianType");
            if (mt) mt.active = false;
        }
        var userNode = this._findIn(root, "username");
        var avatarNode = this._childLoose(userNode, "avatar");
        // 亮牌展示组(bbCards01/02/03): 头道/中道/后道各一组, 亮牌时先放大缩小两次再隐藏,
        // 之后才把 bbCards 里对应道的牌翻开; bbDao0 显示这一道的牌型
        var spots = {};
        var SPOT_NAMES = { head: "bbCards01", mid: "bbCards02", tail: "bbCards03" };
        var DAO_NAMES = { head: "bbDao0", mid: "bbDao1", tail: "bbDao2" };
        for (var sr in SPOT_NAMES) {
            var srNode = this._findIn(root, SPOT_NAMES[sr]);
            if (!srNode) continue;
            var srCards = [];
            for (var sc2 = 0; sc2 < srNode.children.length; ++sc2) {
                if (srNode.children[sc2].name.indexOf("bbCargmp") === 0) srCards.push(srNode.children[sc2]);
            }
            srNode.active = false;
            spots[sr] = {
                root: srNode, cards: srCards,
                dao: this._findIn(srNode, DAO_NAMES[sr]),
                bx: srNode.scaleX, by: srNode.scaleY   // 场景里设置好的原始缩放
            };
        }
        // 比牌分数显示: 自己(带 qd/zd/hd/zf)三道常显, 其他座位只有 jklSprite 临时显示本道盈亏
        var szRoot = this._findIn(root, "SZSprite");
        var szJkl = szRoot ? this._findIn(szRoot, "jklSprite") : null;
        var szQd = szRoot ? this._findIn(szRoot, "qdSprite") : null;
        var szZd = szRoot ? this._findIn(szRoot, "zdSprite") : null;
        var szHd = szRoot ? this._findIn(szRoot, "hdSprite") : null;
        var szZf = szRoot ? this._findIn(szRoot, "zfSprite") : null;
        return {
            root: root, k: k, box: box, cards: cards, spots: spots,
            // 牌盒里所有子节点的原始层级(亮牌提到最前层后按这个顺序还原)
            childOrder: box ? box.children.slice() : [],
            mb: mb, mbSp: mbSp, mbAnim: false, mbIdx: 0,
            ok: this._findIn(root, "okSprite"),
            userNode: userNode,
            nameNode: userNode ? userNode.getChildByName("name") : null,
            scoreNode: userNode ? userNode.getChildByName("score") : null,
            avatarNode: avatarNode,
            avatarIcon: avatarNode ? this._findIn(avatarNode, "icon") : null,
            zhuangNode: userNode ? userNode.getChildByName("bbZhuang") : null,
            nameLb: userNode ? this._labelOf(userNode.getChildByName("name")) : null,
            scoreLb: userNode ? this._labelOf(userNode.getChildByName("score")) : null,
            summary: this._labelOf(this._findIn(root, "bbSummary")),
            szRoot: szRoot, szJkl: szJkl, szQd: szQd, szZd: szZd, szHd: szHd, szZf: szZf, _sz: null,
            badges: null, specialBadge: null,
            roomSeat: -1, player: null, confirmed: false, special: null,
            results: null
        };
    },

    _panelInfo: function (root, isAuto) {
        if (!root) return null;
        var self = this;
        var p = { root: root, isAuto: isAuto, rows: [], zd: [], hand: [], handHome: [], typeBtns: [] };
        for (var i = 0; i < 3; ++i) {
            var bg = this._findIn(root, isAuto ? ("bg" + i + "-a") : ("bg" + i));
            if (!bg) continue;
            var wrap = bg;
            for (var w = 0; w < bg.children.length; ++w) {
                if (bg.children[w].name.indexOf("bbarrbg") === 0) { wrap = bg.children[w]; break; }
            }
            var cards = [], typeSp = null, nameSp = null;
            for (var c = 0; c < wrap.children.length; ++c) {
                var cn = wrap.children[c];
                if (cn.name.indexOf("bbArrCard") === 0) cards.push(cn);
                else if (cn.name === "Spritea") typeSp = cn;
                else if (cn.name === "Sprite") nameSp = cn;
            }
            cards = this._sortedByX(cards);
            var row = { bg: bg, wrap: wrap, cards: cards, typeSp: typeSp, nameSp: nameSp, check: null, close: null };
            p.rows.push(row);
            (function (road, rowInfo) {
                self._bindTap(rowInfo.bg, function (ev) {
                    // 点中牌面时由牌自己的回调处理, 避免冒泡重复放牌
                    if (ev && ev.target && ev.target !== rowInfo.bg) return;
                    self.onRowTap(road);
                });
                for (var ci = 0; ci < rowInfo.cards.length; ++ci) {
                    (function (idx) {
                        self._bindTap(rowInfo.cards[idx], function () { self.onRowCardTap(road, idx); }, true);
                    })(ci);
                }
                // 摆满合法时显示绿色 ✓(视频里每道左侧的对勾)
                var check = new cc.Node("rowCheck");
                check.parent = rowInfo.wrap;
                var ty = rowInfo.typeSp;
                check.setPosition(ty ? ty.x : 100, ty ? ty.y + 96 : 60);
                check.setContentSize(64, 64);
                var klb = check.addComponent(cc.Label);
                klb.string = "\u2713";
                klb.fontSize = 52;
                klb.lineHeight = 56;
                klb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
                klb.verticalAlign = cc.Label.VerticalAlign.CENTER;
                check.color = cc.color(90, 230, 120);
                var kol = check.addComponent(cc.LabelOutline);
                kol.color = cc.color(0, 60, 0, 200);
                kol.width = 3;
                check.active = false;
                rowInfo.check = check;
                // 手动摆牌: 每道右侧一个 X, 点一下把这一道的牌收回手牌(视频里的行删除按钮)
                if (!isAuto) {
                    var close = new cc.Node("rowClose");
                    close.parent = rowInfo.bg;
                    var last = rowInfo.cards[rowInfo.cards.length - 1];
                    close.setPosition(last ? last.x + 118 : 200, 0);
                    close.setContentSize(72, 72);
                    var clb = close.addComponent(cc.Label);
                    clb.string = "\u2715";
                    clb.fontSize = 44;
                    clb.lineHeight = 50;
                    clb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
                    clb.verticalAlign = cc.Label.VerticalAlign.CENTER;
                    var col = close.addComponent(cc.LabelOutline);
                    col.color = cc.color(0, 0, 0, 200);
                    col.width = 3;
                    close.active = false;
                    rowInfo.close = close;
                    self._bindTap(close, function () { self.onRevoke(road); });
                }
            })(ROAD_BY_ROW[i], row);
        }
        p.autoBtn = this._findIn(root, isAuto ? "bbAutoBtn-a" : "bbAutoBtn");
        p.okBtn = this._findIn(root, isAuto ? "bbOkBtn-a" : "bbOkBtn");
        p.reopenBtn = this._findIn(root, isAuto ? "bbArrReopen-a" : "bbArrReopen");
        var cd = this._findIn(root, isAuto ? "bbMidCd-a" : "bbMidCd");
        p.cdLabel = this._labelOf(cd);
        p.cdRoot = this._findIn(root, isAuto ? "djsSprite-a" : "djsSprite");
        this._bindTap(p.autoBtn, function () { if (isAuto) self.onManual(); else self.onAuto(); });
        this._bindTap(p.reopenBtn, function () { self.onReopen(); });
        this._bindTap(p.okBtn, function () { self.onOk(); });

        if (isAuto) {
            for (var z = 0; z < 4; ++z) {
                var zn = this._findIn(root, "zdSprite" + z);
                if (!zn) continue;
                var parts = zn.children.slice().sort(function (a, b) { return b.y - a.y; });
                p.zd.push({ root: zn, parts: parts, home: { x: zn.x, y: zn.y } });
                (function (slot) {
                    self._bindTap(zn, function () { self.onPickSlot(slot); });
                })(z);
            }
            // 推荐牌型一页 3 个, 左右箭头翻页(视频里的 ◀ ▶)
            p.page = 0;
            var holder = this._findIn(root, "allNode-a") || root;
            var mkArrow = function (txt, x) {
                var n = new cc.Node("sssArrow");
                n.parent = holder;
                n.setPosition(x, -500);
                n.setContentSize(96, 96);
                var lb = n.addComponent(cc.Label);
                lb.string = txt;
                lb.fontSize = 56;
                lb.lineHeight = 60;
                lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
                lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
                var ol = n.addComponent(cc.LabelOutline);
                ol.color = cc.color(0, 0, 0, 200);
                ol.width = 3;
                return n;
            };
            p.arrowL = mkArrow("\u25c0", -390);
            p.arrowR = mkArrow("\u25b6", 400);
            this._bindTap(p.arrowL, function () { self.onPage(-1); });
            this._bindTap(p.arrowR, function () { self.onPage(1); });
        } else {
            var pk = this._findIn(root, "Spritepk");
            if (pk) {
                p.hand = this._sortedByX(pk.children);
                p.handHome = [];
                for (var hi = 0; hi < p.hand.length; ++hi) {
                    p.handHome.push({ x: p.hand[hi].x, y: p.hand[hi].y, sx: p.hand[hi].scaleX, sy: p.hand[hi].scaleY });
                    (function (idx) {
                        self._bindTap(p.hand[idx], function () { self.onHandTap(idx); }, true);
                    })(hi);
                }
            }
            var boot = this._findIn(root, "bootNode");
            if (boot) {
                p.typeBtns = this._sortedByX(boot.children);
                for (var bi = 0; bi < p.typeBtns.length; ++bi) {
                    (function (idx) {
                        self._bindTap(p.typeBtns[idx], function () { self.onTypeBtn(idx); });
                    })(bi);
                }
            }
        }
        return p;
    },

    _bindUI: function () {
        var self = this, n = this._n;
        n.seats = [];
        for (var k = 0; k < 6; ++k) n.seats.push(this._seatInfo(this._find("bbSeat" + k), k));
        // 场景初始的牌位/角度/缩放记为"家": 亮牌复原一律回到这里, 不受运行期任何改动影响
        for (var si = 0; si < n.seats.length; ++si) {
            var sc = n.seats[si];
            if (!sc) continue;
            for (var ci = 0; ci < sc.cards.length; ++ci) {
                var cn = sc.cards[ci];
                cn.__sssHome = { x: cn.x, y: cn.y, angle: cn.angle, sx: cn.scaleX, sy: cn.scaleY };
            }
        }
        n.auto = this._panelInfo(this._find("bbArrange-a"), true);
        n.manual = this._panelInfo(this._find("bbArrange"), false);
        this._setupPanelLabels(n.auto, true);
        this._setupPanelLabels(n.manual, false);
        n.prepare = this._find("prepare");
        n.settle = this._find("settlePanel");
        n.gameResult = this._find("game_result");
        n.alert = this._find("alert");
        n.shuffle = this._find("bbShuffleAnim");
        n.tableRoot = this._find("up") || this._find("game") || this.node;

        if (n.auto) n.auto.root.active = false;
        if (n.manual) n.manual.root.active = false;
        if (n.settle) n.settle.active = false;
        if (n.gameResult) n.gameResult.active = false;
        if (n.alert) n.alert.active = false;
        if (n.shuffle) n.shuffle.active = false;

        // 准备/退出/解散/规则/继续
        n.readyBtn = this._findIn(n.prepare, "readyBtn");
        this._bindTap(n.readyBtn, function () {
            // 点"坐下"立刻隐藏按钮并显示自己的 okSprite(不等服务端回包)
            self._sat = true;
            if (n.readyBtn) n.readyBtn.active = false;
            self._refreshSitUI();
            self.onReady();
        });
        this._bindTap(this._findIn(n.prepare, "exitBtn"), function () { self.onExit(); });
        this._bindTap(this._find("bbRuleBtn"), function () {
            var win = self._find("bbRuleWin");
            if (win) win.active = !win.active;
        });
        this._bindTap(this._find("bbRuleClose"), function () {
            var win = self._find("bbRuleWin");
            if (win) win.active = false;
        });
        this._bindTap(this._findIn(n.settle, "settleAgainBtn"), function () { self.onReady(); });
        this._bindTap(this._findIn(n.settle, "bbDisbandBtn"), function () { self.onDissolve(); });
        this._bindTap(this._findIn(n.gameResult, "btnClose"), function () { self.leaveRoom(); });
        this._bindTap(this._find("btn_settings"), function () { self.onBtnSettingsClicked(); });

        // 退出确认弹窗
        if (n.alert) {
            this._bindTap(this._findIn(n.alert, "btn_ok"), function () {
                n.alert.active = false;
                var cb = self._confirmOk;
                self._confirmOk = null;
                if (cb) cb();
            }, true);
            this._bindTap(this._findIn(n.alert, "btn_cancel"), function () {
                n.alert.active = false;
                self._confirmOk = null;
            }, true);
        }
    },

    // 摆牌面板按钮文字: 自动页=手动, 手动页=自动; 重置按钮改成"取消"
    _setupPanelLabels: function (p, isAuto) {
        if (!p) return;
        var ln = isAuto ? "bbAutoBtnLabel-a" : "bbAutoBtnLabel";
        var toggle = this._labelOf(this._findIn(p.autoBtn, ln));
        if (toggle) toggle.string = isAuto ? "\u624b\u52a8" : "\u81ea\u52a8";
        var cancel = this._labelOf(this._findIn(p.reopenBtn, ln));
        if (cancel) cancel.string = "\u53d6\u6d88";
    },

    // 逆向包里的十三水动画: 开始比牌/打枪/全垒打(各一个 animation)
    _loadSpines: function () {
        if (typeof sp === "undefined") return;
        var self = this;
        var list = {
            sss_kaishi: "anims/sss_kaishi/sss_kaishi",
            kaiqiang: "anims/kaiqiang/kaiqiang",
            quanleida: "anims/quanleida/quanleida"
        };
        for (var k in list) {
            (function (key, path) {
                cc.resources.load(path, sp.SkeletonData, function (err, sd) {
                    if (err || !sd) { console.log("[SSS] spine 加载失败", key, err); return; }
                    self._spine[key] = sd;
                });
            })(k, list[k]);
        }
    },

    // 打枪/中枪用宝宝场景原来的帧动画(images/bbfx_dq 12帧, images/bbfx_zq 3帧)
    _loadGunFrames: function () {
        var self = this;
        var load = function (dir, key) {
            cc.resources.loadDir(dir, cc.SpriteFrame, function (err, arr) {
                if (err || !arr || !arr.length) return;
                arr.sort(function (a, b) {
                    var na = parseInt(a.name, 10), nb = parseInt(b.name, 10);
                    if (!isNaN(na) && !isNaN(nb)) return na - nb;
                    return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
                });
                self[key] = arr;
            });
        };
        load("images/bbfx_dq", "_dqFrames");
        load("images/bbfx_zq", "_zqFrames");
    },

    // 在桌子中央播一个 spine 动画, 播完回调(带兜底定时器)
    _fxSpine: function (key, scale, done) {
        var sd = this._spine && this._spine[key];
        if (typeof sp === "undefined" || !sd) { if (done) done(); return; }
        var node = null;
        var finished = false;
        var fin = function () {
            if (finished) return;
            finished = true;
            if (node && cc.isValid(node)) node.destroy();
            if (done) done();
        };
        try {
            node = new cc.Node("sssFx_" + key);
            node.parent = this.node;
            var vs = cc.view.getVisibleSize();
            node.setPosition(this.node.convertToNodeSpaceAR(cc.v2(vs.width / 2, vs.height / 2)));
            node.setSiblingIndex(this.node.children.length - 1);
            var sk = node.addComponent(sp.Skeleton);
            sk.skeletonData = sd;
            sk.premultipliedAlpha = false;
            node.setScale(scale || 1);
            sk.setAnimation(0, "animation", false);
            sk.setCompleteListener(fin);
        } catch (e) {
            console.log("[SSS] spine 播放失败", key, e);
            fin();
            return;
        }
        setTimeout(fin, 4000);   // 兜底, 防止 complete 回调丢失卡住流程
    },

    // 打枪对: 从服务端 details 里还原"谁打谁"(note=打枪 则 a 打 b, 被打枪 则 b 打 a)
    _gunPairs: function () {
        var details = (this._lastResult && this._lastResult.details) || [];
        var byGs = {};
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (!seat || !seat.results || seat.results.gameSeat === undefined) continue;
            byGs[seat.results.gameSeat] = seat;
        }
        var out = [];
        for (var i = 0; i < details.length; ++i) {
            var d = details[i];
            if (!d || !d.gun) continue;
            var gunned = d.note === "\u88ab\u6253\u67aa";
            var fs = byGs[gunned ? d.b : d.a], ts = byGs[gunned ? d.a : d.b];
            if (fs && ts) out.push({ from: fs, to: ts });
        }
        return out;
    },

    _seatFxPos: function (seat) {
        var n = seat && (seat.avatarNode || seat.userNode || seat.root);
        if (!n || !cc.isValid(n)) return null;
        return this.node.convertToNodeSpaceAR(n.convertToWorldSpaceAR(cc.v2(0, 0)));
    },

    // 一次打枪: 射击者处播枪口动画(朝目标), 被打者处播中枪爆炸
    _fxGunShot: function (fromSeat, toSeat) {
        var p0 = this._seatFxPos(fromSeat), p1 = this._seatFxPos(toSeat);
        var self = this;
        var dq = this._dqFrames;
        if (p0 && dq && dq.length) {
            var node = new cc.Node("sssDq");
            node.parent = this.node;
            node.zIndex = 999;
            var sp0 = node.addComponent(cc.Sprite);
            sp0.spriteFrame = dq[0];
            node.setPosition(p0);
            if (p1) {
                var ang = Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
                if (p1.x < p0.x) { node.scaleX = -0.8; node.scaleY = 0.8; node.angle = ang + 180; }
                else { node.setScale(0.8); node.angle = ang; }
            } else node.setScale(0.8);
            var idx = 0, cnt = dq.length;
            var timer = setInterval(function () {
                if (!cc.isValid(node)) { clearInterval(timer); return; }
                if (++idx >= cnt) { clearInterval(timer); node.destroy(); return; }
                sp0.spriteFrame = dq[idx];
            }, 100);
        } else if (!dq || !dq.length) {
            // 帧动画没加载到: 退回逆向包 spine
            this._fxSpine("kaiqiang", 1.0, null);
        }
        var zq = this._zqFrames;
        if (p1 && zq && zq.length) {
            var zn = new cc.Node("sssZq");
            zn.parent = this.node;
            zn.zIndex = 999;
            var sp1 = zn.addComponent(cc.Sprite);
            sp1.spriteFrame = zq[0];
            zn.setPosition(p1);
            zn.setScale(0.8);
            var zi = 0, zc = zq.length;
            var zt = setInterval(function () {
                if (!cc.isValid(zn)) { clearInterval(zt); return; }
                if (++zi >= zc) { clearInterval(zt); zn.destroy(); return; }
                sp1.spriteFrame = zq[zi];
            }, 400);
        }
    },

    // 亮牌结束: 有几对打枪就依次开几枪(宝宝原版帧动画), 最后全垒打, 播完再弹结算
    _playEndFx: function (done) {
        var self = this;
        var pairs = this._gunPairs();
        var qld = false;
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (seat && seat.results && seat.results.quanleida) qld = true;
        }
        if (!pairs.length && !qld) { if (done) done(); return; }
        var i = 0;
        var endStep = function () {
            if (!qld) { if (done) done(); return; }
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("win.wav");
            self._fxSpine("quanleida", 1.2, function () { if (done) done(); });
        };
        var gunStep = function () {
            if (!cc.isValid(self.node)) return;
            if (i >= pairs.length) { endStep(); return; }
            var pr = pairs[i++];
            for (var s = 0; s < 3; ++s) {
                (function (kk) {
                    setTimeout(function () {
                        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("da_qiang_one.mp3");
                    }, kk * 300);
                })(s);
            }
            self._fxGunShot(pr.from, pr.to);
            setTimeout(gunStep, 1500);
        };
        gunStep();
    },

    // ================= 比牌盈亏显示(sz 图集: 1 组为加, 2 组为减) =================
    _loadSz: function () {
        var self = this;
        cc.resources.load("images/atlas/sz", cc.SpriteAtlas, function (err, atlas) {
            if (err || !atlas) { console.log("[SSS] sz 图集加载失败", err); return; }
            self._szAtlas = atlas;
            for (var k = 0; k < self._n.seats.length; ++k) self._applySz(self._n.seats[k]);
        });
    },
    // idx: 1=符号位, 2..11=数字 0..9
    _szFrame: function (set, idx) {
        if (!this._szAtlas) return null;
        var nm = "zhuomian_" + set + "_" + (idx < 10 ? "0" + idx : "" + idx);
        return this._szAtlas.getSpriteFrame(nm + ".png") || this._szAtlas.getSpriteFrame(nm) || null;
    },
    // 在一个节点里按位数横向拼数字, 节点本身位置/大小不动
    _szDraw: function (node, val) {
        if (!node) return;
        var sp = node.getComponent(cc.Sprite);
        if (sp) sp.enabled = false;
        for (var c = node.children.length - 1; c >= 0; --c) {
            if (node.children[c].name === "szChar") node.children[c].destroy();
        }
        node.active = true;
        val = Math.round(Number(val) || 0);
        var set = val < 0 ? 2 : 1;
        var frames = [];
        if (val < 0) frames.push(this._szFrame(2, 1));
        else if (val > 0) frames.push(this._szFrame(1, 1));
        var ds = String(Math.abs(val)).split("");
        for (var d = 0; d < ds.length; ++d) frames.push(this._szFrame(set, 2 + Number(ds[d])));
        var n = frames.length, made = 0;
        for (var i = 0; i < n; ++i) {
            if (!frames[i]) continue;
            var cn = new cc.Node("szChar");
            cn.parent = node;
            cn.addComponent(cc.Sprite).spriteFrame = frames[i];
            cn.setPosition((i - (n - 1) / 2) * 30, 0);
            made++;
        }
        if (!made) node.active = false;
    },
    _szHide: function (node) {
        if (!node) return;
        for (var c = node.children.length - 1; c >= 0; --c) {
            if (node.children[c].name === "szChar") node.children[c].destroy();
        }
        node.active = false;
    },
    _szUpdate: function (seat, key, val) {
        if (!seat || !seat.szRoot) return;
        seat._sz = seat._sz || {};
        seat._sz[key] = val;
        this._applySz(seat);
    },
    _applySz: function (seat) {
        if (!seat || !seat.szRoot) return;
        var v = seat._sz || {};
        var self = this;
        var put = function (node, val) { if (val == null) self._szHide(node); else self._szDraw(node, val); };
        if (seat.szQd) {
            // 自己: 前/中/后道 + 总分, 从比牌开始一直显示
            put(seat.szQd, v.head); put(seat.szZd, v.mid); put(seat.szHd, v.tail); put(seat.szZf, v.total);
            seat.szRoot.active = true;
        } else {
            put(seat.szJkl, v.jkl);
            seat.szRoot.active = (v.jkl != null);
        }
    },
    // 从比牌明细算出每家每一道的盈亏(打枪整对 x2, 再乘底分)
    _calcRoadDeltas: function (data) {
        var map = {};
        var results = data.results || [];
        for (var i = 0; i < results.length; ++i) {
            if (results[i]) map[results[i].gameSeat] = i;
        }
        var base = Number(data.baseScore) || 1;
        var out = {};
        var details = data.details || [];
        for (var d = 0; d < details.length; ++d) {
            var dt = details[d];
            var ra = map[dt.a], rb = map[dt.b];
            var mult = dt.gun ? 2 : 1;
            var roads = dt.roads || [];
            for (var r = 0; r < roads.length; ++r) {
                var it = roads[r];
                var g = (Number(it.gain) || 0) * base * mult;
                if (ra != null) {
                    out[ra] = out[ra] || { head: 0, mid: 0, tail: 0, known: true };
                    out[ra][it.road] += g;
                }
                if (rb != null) {
                    out[rb] = out[rb] || { head: 0, mid: 0, tail: 0, known: true };
                    out[rb][it.road] -= g;
                }
            }
        }
        return out;
    },
    // 亮完某家某道: 显示这一道的盈亏(自己写进 qd/zd/hd, 其他座位写 jkl)
    _szShowRoad: function (seat, road) {
        if (!seat || !seat.szRoot) return;
        var d = this._roadDeltas && this._roadDeltas[seat.roomSeat];
        if (!d || !d.known) return;
        var val = Number(d[road]) || 0;
        this._szUpdate(seat, seat.szQd ? road : "jkl", val);
    },
    _szHideJklAll: function () {
        for (var k = 0; k < this._n.seats.length; ++k) {
            var s = this._n.seats[k];
            if (!s || s.szQd || !s.szJkl) continue;
            this._szHide(s.szJkl);
            if (s.szRoot) s.szRoot.active = false;
        }
    },
    // 新一局: 清掉所有分数显示
    _szResetAll: function () {
        this._roadDeltas = null;
        for (var k = 0; k < this._n.seats.length; ++k) {
            var s = this._n.seats[k];
            if (!s) continue;
            s._sz = {};
            if (!s.szQd) this._szHide(s.szJkl);
            this._szHide(s.szQd); this._szHide(s.szZd); this._szHide(s.szHd); this._szHide(s.szZf);
            if (s.szRoot) s.szRoot.active = false;
        }
    },

    // ================= 资源 =================
    _loadCards: function () {
        var self = this;
        cc.resources.load("images/atlas/cards", cc.SpriteAtlas, function (err, atlas) {
            if (err || !atlas) {
                console.log("[SSS] 牌图加载失败", err);
                return;
            }
            self._frames = atlas;
            self.renderAll();
            if (self._phase === "reveal" || self._phase === "settle") {
                // 亮牌时牌图才到: 按当前结果重摆一次牌面
                self._paintAllResults();
            } else {
                self._repaintBacks();
            }
        });
    },

    _loadImgs: function () {
        var self = this;
        var left = IMG_NAMES.length;
        if (!left) { this._imgsReady = true; return; }
        IMG_NAMES.forEach(function (nm) {
            cc.resources.load("images/png/" + nm, cc.SpriteFrame, function (err, sf) {
                if (!err && sf) self._imgs[nm] = sf;
                else console.log("[SSS] 图片加载失败", nm, err);
                if (--left <= 0) {
                    self._imgsReady = true;
                    self.renderAll();
                    self._updateMbs();
                }
            });
        });
    },

    _img: function (name) { return name ? (this._imgs[name] || null) : null; },

    // 图集帧名在运行时没有 ".png" 后缀(cards.plist 导入后键名是 card_back / SpadeA),
    // 两种都试一次, 否则取不到牌背帧会把 spriteFrame 置空, 牌直接不可见
    _atlasFrame: function (name) {
        if (!this._frames || !name) return null;
        return this._frames.getSpriteFrame(name + ".png") || this._frames.getSpriteFrame(name) || null;
    },
    _frameOf: function (id) {
        if (!this._frames) return null;
        var cid = Number(id) % 52;
        if (!(cid >= 0 && cid < 52)) return null;
        var key = SUIT_FRAMES[Math.floor(cid / 13)] + RANK_NAMES[cid % 13];
        return this._atlasFrame(key) || this._backFrame();
    },
    _backFrame: function () {
        return this._atlasFrame("card_back");
    },
    _setCardFrame: function (node, id) {
        if (!node) return;
        var sp = node.getComponent(cc.Sprite);
        if (sp) sp.spriteFrame = this._frameOf(id);
    },

    // ================= 网络 =================
    _bindNet: function () {
        var nm = cc.vv.gameNetMgr;
        var self = this;

        this.node.on("sss_start", function (d) { self.applyStart(d && d.detail); });
        this.node.on("sss_arrange_ok", function (d) { self.onArrangeOk(d && d.detail); });
        this.node.on("sss_ready", function (d) { self.onSssReady(d && d.detail); });
        this.node.on("sss_error", function (d) {
            self._pendingConfirm = false;
            self._confirmed = false;
            self._toast((d && d.detail && d.detail.msg) || "\u64cd\u4f5c\u5931\u8d25");
            var me = self._ownSeat();
            if (me) me.confirmed = false;
            self.renderAll();
            self._updateMbs();
        });
        this.node.on("sss_result", function (d) { self.onResult(d && d.detail); });
        this.node.on("game_over", function () { self._refreshSeats(); });
        this.node.on("game_end", function (d) { self.onGameEnd(d && d.detail); });
        this.node.on("game_num", function () { self.renderAll(); });
        this.node.on("user_state_changed", function () { self._refreshSeats(); });
        this.node.on("new_user", function () { self._refreshSeats(); });
        this.node.on("dissolve_notice", function () {
            self._confirm("\u5bf9\u65b9\u7533\u8bf7\u89e3\u6563\u623f\u95f4, \u662f\u5426\u540c\u610f?", function () {
                cc.vv.net.send("dissolve_agree");
            });
        });
        this.node.on("dissolve_cancel", function () {
            if (self._n.alert) self._n.alert.active = false;
            self._toast("\u5bf9\u65b9\u53d6\u6d88\u4e86\u89e3\u6563");
        });
        this.node.on("exit_result", function () { self.leaveRoom(); });
        this.node.on("dispress_push", function () { self.leaveRoom(); });
        this.node.on("kick_offline", function () { self.leaveRoom(); });

        var sio = cc.vv.net ? cc.vv.net.sio : null;
        if (sio) {
            var onExit = function () { self.leaveRoom(); };
            var onDispress = function () { self.leaveRoom(); };
            sio.on("exit_result", onExit);
            sio.on("dispress_push", onDispress);
            this._sio = sio;
            this._sioListeners = { exit_result: onExit, dispress_push: onDispress };
        }

        nm.dataEventHandler = this.node;
        if (this._phase === "idle" && nm.sssStart) this.applyStart(nm.sssStart);
    },

    // ================= 开局: 开始动画 -> 发牌 =================
    applyStart: function (data) {
        if (!data) return;
        this._cancelReveal();
        this._szResetAll();            // 新一局: 上一局的比牌分数全部清掉
        this._cards = (data.myCards || []).map(Number).sort(function (a, b) { return a - b; });
        this._confirmed = !!(data.confirmed || data.confirm);
        this._pendingConfirm = false;
        this._final = false;
        this._revealing = false;
        this._hand = [];
        this._picked = {};
        this._roads = { head: [], mid: [], tail: [] };   // 新一局: 清掉上一局的摆牌, 免得手摆弹窗残留
        this._autoMode = true;
        this._candidates = [];
        this._autoIdx = 0;
        this._ownSpecial = null;
        this._resultByRoom = {};
        this._lastResult = null;
        this._arrangeDeadline = data.arrangeDeadline || 0;
        this._leftSec = (data.arrangeSeconds != null) ? data.arrangeSeconds
            : (this._arrangeDeadline ? Math.max(0, Math.ceil((this._arrangeDeadline - Date.now()) / 1000)) : 30);

        if (this._n.settle) this._n.settle.active = false;
        if (this._n.gameResult) this._n.gameResult.active = false;
        if (this._n.prepare) this._n.prepare.active = false;
        this._layoutSeats(data);

        // 断线重连: 已有摆牌直接进入摆牌界面
        var arranged = data.arrange && (data.arrange.head || []).length > 0;
        if (arranged) {
            this._roads = {
                head: (data.arrange.head || []).map(Number),
                mid: (data.arrange.mid || []).map(Number),
                tail: (data.arrange.tail || []).map(Number)
            };
            var used = {};
            var self0 = this;
            ROADS.forEach(function (r) { self0._roads[r].forEach(function (c) { used[c] = true; }); });
            this._hand = this._cards.filter(function (c) { return !used[c]; });
            this._ownSpecial = detectSpecialClient(this._cards, this._roads);
            this._phase = "arrange";
            this._dealing = false;
            this._resetSeatsCards(true);
            this.renderAll();
            this._updateMbs();
            return;
        }

        this._phase = "dealing";
        this._dealing = true;
        this._dealingSec = 0;
        this._playedOnce = true;   // 本房已经开过局: 之后不再显示自己座位上的"已准备"标记
        this._roundRevealed = false;
        this._pendingGameEnd = null;
        this._resetSeatsCards(false);
        this.renderAll();
        var self = this;
        this._playStartAnim(function () {
            if (!cc.isValid(self.node)) return;
            self._dealFly(function () {
                if (!cc.isValid(self.node)) return;
                self._enterArrange();
            });
        });
    },

    // 开局动画: 与宝宝场景同一套(images/bbfx_start 20帧@50ms), 播在屏幕中心
    _loadStartFx: function () {
        var self = this;
        cc.resources.loadDir("images/bbfx_start", cc.SpriteFrame, function (err, arr) {
            if (err || !arr || !arr.length) { console.log("[SSS] 开局动画加载失败", err); return; }
            arr.sort(function (a, b) {
                var na = parseInt(a.name, 10), nb = parseInt(b.name, 10);
                if (!isNaN(na) && !isNaN(nb)) return na - nb;
                return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
            });
            self._startFrames = arr;
        });
    },

    _playStartAnim: function (done) {
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("start_game.mp3");
        var frames = this._startFrames;
        if (!frames || !frames.length) { done(); return; }
        var vs = cc.view.getVisibleSize();
        var center = this.node.convertToNodeSpaceAR(cc.v2(vs.width / 2, vs.height / 2));
        var node = new cc.Node("sssFxStart");
        node.parent = this.node;
        node.setSiblingIndex(this.node.children.length - 1);
        node.setPosition(center);
        var sp = node.addComponent(cc.Sprite);
        sp.spriteFrame = frames[0];
        var fw = frames[0].getOriginalSize().width, fh = frames[0].getOriginalSize().height;
        node.setScale(Math.min(cc.winSize.width / fw, cc.winSize.height / fh) * 0.9);
        var idx = 0, cnt = frames.length;
        var self = this;
        if (this._fxTimer) { clearInterval(this._fxTimer); this._fxTimer = null; }
        this._fxTimer = setInterval(function () {
            if (!cc.isValid(node) || !cc.isValid(self.node)) {
                clearInterval(self._fxTimer); self._fxTimer = null; return;
            }
            if (++idx >= cnt) {
                clearInterval(self._fxTimer); self._fxTimer = null;
                node.destroy();
                done();
            } else {
                sp.spriteFrame = frames[idx];
            }
        }, 50);
    },

    _resetSeatsCards: function (showBack) {
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (!seat) continue;
            for (var i = 0; i < seat.cards.length; ++i) {
                var card = seat.cards[i];
                card.stopAllActions();
                // 上一局亮牌时摆直/放大过的牌, 换局前先还原成场景原始状态
                if (card.__sssOrig) {
                    var o0 = card.__sssOrig;
                    card.setPosition(o0.x, o0.y);
                    card.angle = o0.angle;
                    card.setScale(o0.sx, o0.sy);
                    delete card.__sssOrig;
                }
                card.active = false;
                card.opacity = 255;
                var sp = card.getComponent(cc.Sprite);
                if (sp) sp.spriteFrame = showBack ? this._backFrame() : null;
            }
            if (seat.badges) {
                for (var br in seat.badges) { if (seat.badges[br]) seat.badges[br].active = false; }
            }
            if (seat.specialBadge) seat.specialBadge.active = false;
            seat.special = null;
            seat.results = null;
            seat.confirmed = false;
            seat.revealed = {};
        }
        this._hideSpots();
        this._updateMbs();
    },

    // 发牌: 13 张牌背从桌心飞到每个座位 bbCards 的 13 个节点
    _dealFly: function (done) {
        var self = this;
        var seats = [];
        for (var k = 0; k < this._n.seats.length; ++k) {
            if (this._n.seats[k] && this._n.seats[k].player) seats.push(this._n.seats[k]);
        }
        if (!seats.length) { done(); return; }
        var root = this._n.tableRoot;
        var worldCenter = root ? root.convertToWorldSpaceAR(cc.v2(0, 0)) : cc.v2(0, 0);
        var maxDelay = 0;
        var seqIdx = 0;
        var back = this._backFrame();
        var dur = 0.34;
        // 手牌节点本身就是场景摆好的位置/缩放/角度/层级, 发牌全程不动它们:
        // 用一张临时牌背从桌心飞到该节点上, 落位后只把对应手牌节点点亮(换牌背帧)
        for (var r = 0; r < 13; ++r) {
            for (var si = 0; si < seats.length; ++si) {
                var seat = seats[si];
                var card = seat.cards[r];
                if (!card) { seqIdx++; continue; }
                var par = card.parent || seat.box;
                var startPt = par ? par.convertToNodeSpaceAR(worldCenter) : cc.v2(0, 0);
                var endPt = cc.v2(card.x, card.y);   // 目标=这张牌节点自己的位置
                var delay = seqIdx * 0.012;
                if (delay > maxDelay) maxDelay = delay;
                var ghost = new cc.Node("sssDealGhost");
                var gsp = ghost.addComponent(cc.Sprite);
                gsp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                gsp.spriteFrame = back;
                ghost.setContentSize(card.width, card.height);
                // 起飞随机散开/带旋转, 飞行中再转正落到场景节点上(参考原版发牌效果)
                var flyAng = card.angle + (Math.random() * 90 - 45);
                ghost.angle = flyAng;
                ghost.setScale(0.55, 0.55);
                ghost.setPosition(startPt.x + (Math.random() - 0.5) * 260, startPt.y + (Math.random() - 0.5) * 150);
                if (par) par.addChild(ghost);
                (function (gh, cd, to, sx, sy, tgtAng) {
                    gh.runAction(cc.sequence(
                        cc.delayTime(delay),
                        cc.spawn(
                            cc.moveTo(dur, to).easing(cc.easeQuadraticActionOut()),
                            cc.scaleTo(dur, sx, sy),
                            cc.rotateTo(dur, tgtAng)
                        ),
                        cc.callFunc(function () {
                            // 落到场景节点上: 只点亮这张牌, 位置/缩放/角度/层级都不碰
                            cd.active = true;
                            cd.opacity = 255;
                            var csp = cd.getComponent(cc.Sprite);
                            if (csp) csp.spriteFrame = back;
                            if (cc.isValid(gh)) gh.destroy();
                        })
                    ));
                })(ghost, card, endPt, card.scaleX, card.scaleY, card.angle);
                seqIdx++;
            }
        }
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("deal.wav");
        // 最后一张牌落位后才进入摆牌(弹窗在发牌结束后再弹出)
        this.scheduleOnce(function () { if (cc.isValid(self.node)) done(); }, maxDelay + dur + 0.18);
    },

    _enterArrange: function () {
        // 发牌动画的完成回调可能迟到: 只要已经不在发牌阶段(已摆牌/亮牌/结算), 就不能再改阶段
        if (this._phase !== "dealing") return;
        this._dealing = false;
        this._phase = "arrange";
        this._dealingSec = 0;
        this._autoMode = true;
        this._ownSpecial = detectSpecialClient(this._cards, null);
        this._buildCandidates();
        if (this._candidates.length > 0) {
            this._applyCandidate(0);
        } else {
            this._roads = { head: [], mid: [], tail: [] };
            this._hand = this._cards.slice();
        }
        this.renderAll();
        this._updateMbs();
    },

    // ================= 座位 =================
    _layoutSeats: function (data) {
        var nm = cc.vv.gameNetMgr;
        var seats = (nm && nm.seats) ? nm.seats : null;
        var myIdx = (nm && nm.seatIndex >= 0) ? nm.seatIndex : -1;
        var i, k;
        for (k = 0; k < this._n.seats.length; ++k) {
            var s0 = this._n.seats[k];
            if (!s0) continue;
            s0.player = null;
            s0.roomSeat = -1;
            // username 面板默认显示; 空座位上只隐藏昵称/分数/头像, 不隐藏整个座位
            this._seatEmpty(s0);
        }
        var list = seats;
        if (!list || !list.length) {
            // 兜底: 用开局推送里的牌局座位搭一份
            list = [];
            var ds = (data && data.seats) || [];
            for (i = 0; i < ds.length; ++i) {
                var roomIdx = (ds[i].roomSeatIndex != null) ? ds[i].roomSeatIndex : ds[i].seatindex;
                if (roomIdx == null) continue;
                list[roomIdx] = { userid: ds[i].userid, name: ds[i].name, score: 0 };
            }
            for (i = 0; i < list.length; ++i) if (!list[i]) list[i] = { userid: 0 };
        }
        if (myIdx < 0) {
            for (i = 0; i < list.length; ++i) {
                if (list[i] && list[i].userid == this._myUserId) { myIdx = i; break; }
            }
        }
        if (myIdx < 0) myIdx = 0;
        // 以自己为起点, 按真实就座顺序排一圈
        var order = [];
        for (var off = 0; off < list.length; ++off) {
            var ii = (myIdx + off) % list.length;
            if (list[ii] && list[ii].userid > 0) order.push(ii);
        }
        var total = order.length;
        if (!total) {
            // 进房推送还没到: 至少把自己的座位显示出来(username 面板 + 昵称/分数/头像)
            if (this._myUserId > 0) {
                list = (list || []).slice();   // 不改动 gameNetMgr.seats
                list[myIdx] = { userid: this._myUserId, name: (cc.vv.userMgr && cc.vv.userMgr.userName) || "\u6211", score: 0 };
                order = [myIdx];
                total = 1;
            } else {
                return;
            }
        }
        var ring = (total === 2) ? [0, 3] : SEAT_RING.slice(0, total);
        var confirmed = (nm && nm.sssConfirmed) || {};
        for (var rel = 0; rel < total; ++rel) {
            var ridx = order[rel];
            var s = list[ridx];
            var seat = this._n.seats[ring[rel]];
            if (!seat) continue;
            seat.root.active = true;
            seat.roomSeat = ridx;
            seat.player = s;
            // 有人占座: username 面板连同昵称/分数/头像一起显示
            if (seat.userNode) seat.userNode.active = true;
            if (seat.nameNode) seat.nameNode.active = true;
            if (seat.scoreNode) seat.scoreNode.active = true;
            if (seat.avatarNode) seat.avatarNode.active = true;
            if (seat.zhuangNode) seat.zhuangNode.active = true;
            seat.confirmed = !!(confirmed[s.userid] || (this._confirmed && s.userid == this._myUserId));
            if (seat.nameLb) seat.nameLb.string = s.name || ("\u73a9\u5bb6" + (ridx + 1));
            if (seat.scoreLb) seat.scoreLb.string = "\u5206\u6570:" + (s.score || 0);
            // 头像: icon 节点上挂 ImageLoader, 只传 userid 由它拉取/缓存
            if (seat.avatarIcon && s.userid) {
                var il = seat.avatarIcon.getComponent("ImageLoader");
                if (!il) { try { il = seat.avatarIcon.addComponent("ImageLoader"); } catch (e) { il = null; } }
                if (il && il.setUserID) il.setUserID(s.userid);
            }
        }
    },

    // 空座位: username 面板保持显示, 但不显示昵称/分数/头像(庄标记也隐藏)
    _seatEmpty: function (seat) {
        if (!seat) return;
        if (seat.root) seat.root.active = true;
        if (seat.userNode) seat.userNode.active = true;
        if (seat.nameNode) seat.nameNode.active = false;
        if (seat.scoreNode) seat.scoreNode.active = false;
        if (seat.avatarNode) seat.avatarNode.active = false;
        if (seat.zhuangNode) seat.zhuangNode.active = false;
        if (seat.ok) seat.ok.active = false;
    },

    _seatOfRoom: function (roomIdx) {
        for (var k = 0; k < this._n.seats.length; ++k) {
            var s = this._n.seats[k];
            if (s && s.roomSeat === roomIdx) return s;
        }
        return null;
    },
    _seatOfUser: function (userid) {
        for (var k = 0; k < this._n.seats.length; ++k) {
            var s = this._n.seats[k];
            if (s && s.roomSeat >= 0 && s.player && s.player.userid == userid) return s;
        }
        return null;
    },
    _ownSeat: function () {
        for (var k = 0; k < this._n.seats.length; ++k) {
            var s = this._n.seats[k];
            if (s && s.player && s.player.userid == this._myUserId) return s;
        }
        return null;
    },
    _refreshSeats: function () {
        this._layoutSeats(null);
        this._updateMbs();
        this._refreshSitUI();
    },

    // ================= bbMb: 理牌中/已完成/特殊牌型 =================
    _setMb: function (seat, imgName) {
        if (!seat || !seat.mb || !seat.mbSp) return;
        var f = this._img(imgName);
        if (!f) { seat.mb.active = false; return; }
        seat.mbSp.sizeMode = cc.Sprite.SizeMode.RAW;  // 保持原图尺寸
        seat.mbSp.spriteFrame = f;
        seat.mb.active = true;
    },

    _updateMbs: function () {
        // 全部玩家都点了"开始比牌"后, 不再显示"已完成"
        var total = 0, ready = 0;
        for (var t = 0; t < this._n.seats.length; ++t) {
            var st = this._n.seats[t];
            if (st && st.player) { total++; if (st.confirmed) ready++; }
        }
        var allReady = (total > 0 && ready >= total);
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (!seat || !seat.player) continue;
            if (!seat.cards || !seat.cards.length) {
                console.log("[SSS] 座位没找到牌节点 seat=" + seat.k + " uid=" + seat.player.userid);
                continue;
            }
            var mine = (seat.player.userid == this._myUserId);
            // 摆牌阶段: 桌上所有玩家的牌都保持牌背, 等亮牌阶段才翻正面
            if (this._phase === "arrange") {
                var back = this._backFrame();
                for (var ci = 0; ci < seat.cards.length; ++ci) {
                    var cd = seat.cards[ci];
                    if (!cd) continue;
                    // 座位信息比发牌晚到时, 牌可能还处于隐藏状态: 只补显示, 位置/缩放/角度全用场景节点自己的
                    if (!cd.active) {
                        cd.stopAllActions();
                        cd.active = true;
                    }
                    // 发牌动画可能被打断导致透明度停在 0
                    cd.opacity = 255;
                    var csp = cd.getComponent(cc.Sprite);
                    if (csp && back) csp.spriteFrame = back;
                }
            }
            if (this._phase === "reveal" || this._phase === "settle") {
                // 亮牌开始: 关闭"已完成"/"特殊牌型"提示(牌面与结算面板里已有信息)
                seat.mbAnim = false;
                this._setMb(seat, null);
                continue;
            }
            if (this._phase === "idle" || this._phase === "end" || this._phase === "dealing") {
                seat.mbAnim = false;
                this._setMb(seat, null);
                continue;
            }
            if (allReady) {
                // 全部确定, 隐藏"已完成", 进入准备亮牌
                seat.mbAnim = false;
                this._setMb(seat, null);
                continue;
            }
            if (seat.confirmed) {
                seat.mbAnim = false;
                this._setMb(seat, "\u5df2\u5b8c\u6210");
            } else if (mine && this._ownSpecial) {
                seat.mbAnim = false;
                this._setMb(seat, "\u7279\u6b8a\u724c\u578b");
            } else {
                seat.mbAnim = true;
                this._setMb(seat, "\u7406\u724c\u4e2d-" + ((seat.mbIdx % 3) + 1));
            }
        }
    },

    _mbTick: function () {
        if (!this._imgsReady) return;
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (!seat || !seat.player || !seat.mbAnim) continue;
            seat.mbIdx = (seat.mbIdx + 1) % 3;
            this._setMb(seat, "\u7406\u724c\u4e2d-" + (seat.mbIdx + 1));
        }
    },

    // 服务端推送: 某家已确定摆牌
    onSssReady: function (data) {
        if (!data) return;
        var seat = (data.userid != null) ? this._seatOfUser(data.userid) : null;
        if (!seat && data.seatindex != null) {
            // seatindex 是牌局座位号, 用 sssSeats 换房间座位号
            var nm = cc.vv.gameNetMgr;
            var list = (nm && nm.sssSeats) || [];
            for (var i = 0; i < list.length; ++i) {
                if (list[i] && list[i].seatindex == data.seatindex) {
                    seat = this._seatOfRoom(list[i].roomSeatIndex);
                    break;
                }
            }
        }
        if (seat) {
            seat.confirmed = true;
            if (seat.player && seat.player.userid == this._myUserId && data.auto) {
                this._confirmed = true;
                this.renderAll();
            }
        }
        this._updateMbs();
    },

    onArrangeOk: function (data) {
        if (!data) return;
        this._roads = {
            head: (data.head || []).map(Number),
            mid: (data.mid || []).map(Number),
            tail: (data.tail || []).map(Number)
        };
        var used = {};
        var self = this;
        ROADS.forEach(function (r) { self._roads[r].forEach(function (c) { used[c] = true; }); });
        this._hand = this._cards.filter(function (c) { return !used[c]; });
        this._ownSpecial = detectSpecialClient(this._cards, this._roads);
        if (data.auto) {
            this._confirmed = true;
        } else if (this._pendingConfirm) {
            this._pendingConfirm = false;
            cc.vv.net.send("sss_confirm");
        }
        this.renderAll();
        this._updateMbs();
    },

    // ================= 摆牌渲染 =================
    _canArrange: function () {
        return this._phase === "arrange" && !this._confirmed && !this._dealing;
    },

    _renderRow: function (rowInfo, road, ids) {
        if (!rowInfo) return;
        for (var i = 0; i < rowInfo.cards.length; ++i) {
            var node = rowInfo.cards[i];
            var has = i < ids.length;
            node.active = has;
            if (has) this._setCardFrame(node, ids[i]);
        }
        var nm = typeImgOf(road, ids);
        if (rowInfo.typeSp) {
            var sp = rowInfo.typeSp.getComponent(cc.Sprite);
            if (sp) sp.spriteFrame = this._img(nm);
            rowInfo.typeSp.active = !!nm;
        }
        // 摆满且合法时显示 ✓
        if (rowInfo.check) rowInfo.check.active = !!nm;
        // 手动摆牌: 该道有牌才显示右侧 X
        if (rowInfo.close) rowInfo.close.active = ids.length > 0 && this._phase === "arrange" && !this._confirmed;
    },

    _renderPanel: function (p) {
        if (!p) return;
        // 手动面板每次重排都清掉在飞/残留的残影(点清除时最明显), 避免停在牌面上
        if (!p.isAuto) this._cleanFlyGhosts(p);
        for (var i = 0; i < p.rows.length; ++i) {
            var road = ROAD_BY_ROW[i];
            this._renderRow(p.rows[i], road, this._roads[road] || []);
        }
        if (!p.isAuto) return;
        // 推荐牌型: 一页 3 个, 箭头翻页
        var total = this._candidates.length;
        var per = 3;
        var maxPage = Math.max(0, Math.ceil(total / per) - 1);
        if ((p.page || 0) > maxPage) p.page = maxPage;
        for (var z = 0; z < p.zd.length; ++z) {
            var item = p.zd[z];
            var idx = (p.page || 0) * per + z;
            var cand = (z < per && idx < total) ? this._candidates[idx] : null;
            if (!cand) { item.root.active = false; continue; }
            item.root.active = true;
            // 一页 3 个居中排布, 两边留给箭头
            item.root.setPosition((z - 1) * 230, item.home ? item.home.y : item.root.y);
            var sel = (idx === this._autoIdx);
            item.root.color = sel ? cc.color(255, 232, 160) : cc.color(255, 255, 255);
            item.root.opacity = sel ? 255 : 175;
            item.root.setScale(sel ? 1.06 : 1, sel ? 1.06 : 1);
            var roads = [cand.head, cand.mid, cand.tail];
            for (var j = 0; j < item.parts.length && j < 3; ++j) {
                var part = item.parts[j];
                var roadN = ROAD_BY_ROW[j];
                var nm = typeImgOf(roadN, roads[j]);
                var sp2 = part.getComponent(cc.Sprite);
                if (sp2) sp2.spriteFrame = this._img(nm);
                part.active = !!nm;
            }
        }
        if (p.arrowL) p.arrowL.active = total > per && (p.page || 0) > 0;
        if (p.arrowR) p.arrowR.active = total > per && (p.page || 0) < maxPage;
    },

    _renderHand: function () {
        var p = this._n.manual;
        if (!p || !p.hand.length) return;
        var show = this._phase === "arrange" && !this._autoMode;
        for (var i = 0; i < p.hand.length; ++i) {
            var node = p.hand[i];
            var id = this._hand[i];
            node.active = show && (id != null);
            if (!node.active) continue;
            var h = p.handHome[i];
            var raised = !!this._picked[id];
            node.setPosition(h.x, h.y + (raised ? 30 : 0));
            node.setScale(h.sx * (raised ? 1.06 : 1), h.sy * (raised ? 1.06 : 1));
            this._setCardFrame(node, id);
        }
        this._refreshTypeBtns();
    },

    // 手动面板牌型按钮: 手牌里凑不出对应牌型时置灰
    _refreshTypeBtns: function () {
        var p = this._n.manual;
        if (!p || !p.typeBtns || !p.typeBtns.length) return;
        for (var i = 0; i < p.typeBtns.length; ++i) {
            var btn = p.typeBtns[i];
            if (!btn) continue;
            var lv = TYPE_BTN_LV[i];
            var ok = !!(lv && pickTypeIds(lv, this._hand));
            btn.color = ok ? cc.color(255, 255, 255) : cc.color(110, 110, 110);
        }
    },

    _refreshPhase: function () {
        var n = this._n;
        // 点"开始比牌"后立即关闭摆牌弹窗(提交失败 sss_error 会重置 _confirmed 重新打开)
        var arranging = (this._phase === "arrange") && !this._confirmed;
        if (n.auto) n.auto.root.active = arranging && this._autoMode;
        if (n.manual) n.manual.root.active = arranging && !this._autoMode;
        // 自动推荐时只有"确定比牌"; 手动摆牌时才有"取消"
        if (n.auto && n.auto.reopenBtn) n.auto.reopenBtn.active = false;
        if (n.manual && n.manual.reopenBtn) n.manual.reopenBtn.active = arranging && !this._autoMode;
        if (n.prepare) n.prepare.active = (this._phase === "idle" || (this._phase === "end" && !this._final));
    },

    // 坐下/准备: 点了"坐下"隐藏按钮, 座位显示 okSprite; 开局后 okSprite 隐藏
    _refreshSitUI: function () {
        var me = this._ownSeat();
        var meReady = this._sat || !!(me && me.player && me.player.ready);
        if (this._n.readyBtn) this._n.readyBtn.active = !meReady;
        // 开局到整场结束都不显示 okSprite: 亮牌结束后的结算/总结算阶段也不需要"已准备"标记
        var started = (this._phase === "dealing" || this._phase === "arrange" ||
                       this._phase === "reveal" || this._phase === "settle" ||
                       this._phase === "end");
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (!seat || !seat.ok) continue;
            var mine = !!(seat.player && seat.player.userid == this._myUserId);
            var ready = !!(seat.player && (seat.player.ready || (mine && this._sat)));
            // 自己的"已准备"只在开局前显示; 本房打过一局后(含亮牌结束/结算/继续下一局)都不再显示
            if (mine && this._playedOnce) ready = false;
            seat.ok.active = !started && ready;
        }
    },

    _refreshCountdown: function () {
        var p = this._autoMode ? this._n.auto : this._n.manual;
        if (!p) return;
        var show = (this._phase === "arrange") && !this._confirmed;
        if (p.cdRoot) p.cdRoot.active = show;
        if (!p.cdLabel) return;
        p.cdLabel.string = show ? String(Math.max(0, this._leftSec || 0)) : "";
    },

    renderAll: function () {
        // 本局已经亮完牌: 桌上必须保持牌面, 不再刷回牌背(结算/总结算/点继续等重绘都一样)
        if (!this._roundRevealed && this._phase !== "reveal" && this._phase !== "settle") this._repaintBacks();
        this._refreshPhase();
        this._renderPanel(this._n.auto);
        this._renderPanel(this._n.manual);
        this._renderHand();
        this._refreshCountdown();
        this._updateMbs();
        this._refreshSitUI();
    },

    _tick: function () {
        // 进房/座位数据晚到: 每秒比对一次, 有变化就重排座位(username/昵称/分数/头像跟着刷新)
        var nm0 = cc.vv && cc.vv.gameNetMgr;
        var arr0 = (nm0 && nm0.seats) || [];
        var sig = "";
        for (var si0 = 0; si0 < arr0.length; ++si0) sig += ((arr0[si0] && arr0[si0].userid) || 0) + ",";
        if (sig !== this._seatSig) {
            this._seatSig = sig;
            this._refreshSeats();
        }
        if (this._phase === "dealing") {
            this._dealingSec++;
            if (this._dealingSec >= 10) {
                // 动画兜底: 卡住直接进入摆牌
                this._dealing = false;
                this._enterArrange();
            }
            return;
        }
        if (this._phase === "arrange") {
            if (this._arrangeDeadline) {
                this._leftSec = Math.max(0, Math.ceil((this._arrangeDeadline - Date.now()) / 1000));
            } else if (this._leftSec > 0 && !this._confirmed) {
                this._leftSec--;
            }
            this._refreshCountdown();
        }
    },

    // ================= 自动摆牌 =================
    _buildCandidates: function () {
        this._candidates = (this._cards.length >= 13) ? arrangeCandidates(this._cards.slice(), 4) : [];
    },

    _applyCandidate: function (idx) {
        var cand = this._candidates[idx];
        if (!cand) return;
        this._autoIdx = idx;
        this._roads = { head: cand.head.slice(), mid: cand.mid.slice(), tail: cand.tail.slice() };
        this._hand = [];
        this._picked = {};
        this._ownSpecial = detectSpecialClient(this._cards, this._roads);
    },

    onPickCandidate: function (idx) {
        if (!this._canArrange() || !this._autoMode) return;
        if (!this._candidates[idx]) return;
        this._applyCandidate(idx);
        this.renderAll();
    },

    // 翻页后点第 slot 个推荐(一页 3 个)
    onPickSlot: function (slot) {
        if (!this._canArrange() || !this._autoMode) return;
        var p = this._n.auto;
        this.onPickCandidate(((p && p.page) || 0) * 3 + slot);
    },

    onPage: function (dir) {
        if (!this._canArrange() || !this._autoMode) return;
        var p = this._n.auto;
        if (!p) return;
        var maxPage = Math.max(0, Math.ceil(this._candidates.length / 3) - 1);
        var np = Math.max(0, Math.min(maxPage, (p.page || 0) + dir));
        if (np === p.page) return;
        p.page = np;
        this._renderPanel(p);
    },

    onAuto: function () {
        if (!this._canArrange()) return;
        this._autoMode = true;
        this._picked = {};
        if (!this._candidates.length) this._buildCandidates();
        if (!this._candidates.length) { this._toast("\u81ea\u52a8\u6446\u724c\u5931\u8d25"); return; }
        // 尽量保持当前摆法
        var cur = this._roads;
        var same = -1;
        for (var i = 0; i < this._candidates.length; ++i) {
            if (this._sameRoads(cur, this._candidates[i])) { same = i; break; }
        }
        this._applyCandidate(same >= 0 ? same : 0);
        this.renderAll();
    },

    _sameRoads: function (roads, cand) {
        if (!roads || !cand) return false;
        var a = (roads.head || []).slice().sort().join(",") + "|" +
            (roads.mid || []).slice().sort().join(",") + "|" +
            (roads.tail || []).slice().sort().join(",");
        var b = cand.head.slice().sort().join(",") + "|" + cand.mid.slice().sort().join(",") + "|" +
            cand.tail.slice().sort().join(",");
        return a === b;
    },

    onManual: function () {
        if (!this._canArrange()) return;
        this._autoMode = false;
        this._picked = {};
        // 切手动: 13 张全部回到手牌, 由玩家自己点牌型/选牌摆
        this._roads = { head: [], mid: [], tail: [] };
        this._hand = this._cards.slice().sort(function (a, b) { return a - b; });
        this.renderAll();
    },

    onReopen: function () {
        if (!this._canArrange()) return;
        // 手动摆牌点"取消": 回到自动推荐
        if (!this._autoMode) { this.onAuto(); return; }
        this._picked = {};
        this._buildCandidates();
        if (this._candidates.length) this._applyCandidate(0);
        this.renderAll();
    },

    // ================= 手动选牌/放牌 =================
    _pickedIds: function () {
        var out = [];
        for (var i = 0; i < this._hand.length; ++i) {
            if (this._picked[this._hand[i]]) out.push(this._hand[i]);
        }
        return out;
    },

    onTypeBtn: function (idx) {
        if (!this._canArrange() || this._autoMode) return;
        var lv = TYPE_BTN_LV[idx];
        if (!lv) return;
        var ids = pickTypeIds(lv, this._hand);
        if (!ids || !ids.length) { this._toast("\u624b\u724c\u4e2d\u6ca1\u6709\u8be5\u724c\u578b"); return; }
        this._picked = {};
        for (var i = 0; i < ids.length; ++i) this._picked[ids[i]] = true;
        this._renderHand();
    },

    onHandTap: function (slotIdx) {
        if (!this._canArrange() || this._autoMode) return;
        var id = this._hand[slotIdx];
        if (id == null) return;
        if (this._picked[id]) delete this._picked[id];
        else this._picked[id] = true;
        this._renderHand();
    },

    onRowTap: function (road) {
        if (!this._canArrange() || this._autoMode) return;
        var picked = this._pickedIds();
        if (!picked.length) { this._toast("\u5148\u9009\u62e9\u624b\u724c"); return; }
        this._placeInto(road, picked);
    },

    onRowCardTap: function (road, idx) {
        if (!this._canArrange() || this._autoMode) return;
        var arr = this._roads[road] || [];
        if (idx >= arr.length) {
            // 空格子: 当放牌位
            var picked = this._pickedIds();
            if (picked.length) this._placeInto(road, picked);
            return;
        }
        if (this._pickedIds().length) { this._placeInto(road, this._pickedIds()); return; }
        // 点已放入的牌: 收回手牌
        var id = arr.splice(idx, 1)[0];
        this._hand.push(id);
        this._hand.sort(function (a, b) { return a - b; });
        this.renderAll();
    },

    // 点该道右侧 X: 整道收回手牌
    onRevoke: function (road) {
        if (!this._canArrange() || this._autoMode) return;
        var arr = this._roads[road] || [];
        if (!arr.length) return;
        for (var i = 0; i < arr.length; ++i) this._hand.push(arr[i]);
        this._roads[road] = [];
        this._hand.sort(function (a, b) { return a - b; });
        this._picked = {};
        this._cleanFlyGhosts(this._n.manual);   // 清除时把还在飞的残影一起清掉
        this.renderAll();
    },

    _placeInto: function (road, ids) {
        var cap = ROAD_CAP[road];
        var arr = this._roads[road] || (this._roads[road] = []);
        var space = cap - arr.length;
        if (space <= 0) { this._toast(ROAD_NAMES[road] + "\u5df2\u6ee1"); return; }
        var take = ids.slice(0, space);
        this._flyCards(take, road);
        for (var i = 0; i < take.length; ++i) {
            var id = take[i];
            var hi = this._hand.indexOf(id);
            if (hi >= 0) this._hand.splice(hi, 1);
            delete this._picked[id];
            arr.push(id);
        }
        this._renderHand();
        this._renderPanel(this._n.manual);
    },

    // 手牌飞入牌位(在手动面板上做一个小牌影)
    _flyCards: function (ids, road) {
        var p = this._n.manual;
        if (!p || !p.root) return;
        var row = p.rows[ROAD_ROW[road]];
        if (!row) return;
        var self = this;
        var base = (this._roads[road] || []).length;
        for (var k = 0; k < ids.length; ++k) {
            var src = this._handNodeOf(ids[k]);
            var dst = row.cards[base + k];
            if (!src || !dst) continue;
            var p0 = p.root.convertToNodeSpaceAR(src.convertToWorldSpaceAR(cc.v2(0, 0)));
            var p1 = p.root.convertToNodeSpaceAR(dst.convertToWorldSpaceAR(cc.v2(0, 0)));
            var ghost = new cc.Node("sssFly");
            var sp = ghost.addComponent(cc.Sprite);
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            sp.spriteFrame = this._frameOf(ids[k]);
            ghost.setContentSize(150, 195);
            ghost.zIndex = 999;
            p.root.addChild(ghost);
            ghost.setPosition(p0);
            ghost.runAction(cc.sequence(
                cc.moveTo(0.2, p1).easing(cc.easeQuadraticActionIn()),
                cc.callFunc(function () { ghost.destroy(); })
            ));
        }
    },

    // 清理飞牌残影(面板动作在节点不可见时会暂停, 不清理会残留到下一局)
    _cleanFlyGhosts: function (p) {
        if (!p || !p.root) return;
        var kids = p.root.children.slice();
        for (var i = 0; i < kids.length; ++i) {
            if (kids[i] && kids[i].name === "sssFly") kids[i].destroy();
        }
    },

    _handNodeOf: function (id) {
        var p = this._n.manual;
        if (!p) return null;
        var idx = this._hand.indexOf(id);
        if (idx < 0 || idx >= p.hand.length) return null;
        return p.hand[idx];
    },

    // 提交摆牌
    onOk: function () {
        if (this._phase !== "arrange") return;
        if (this._confirmed) return;
        var head = this._roads.head, mid = this._roads.mid, tail = this._roads.tail;
        if (head.length != 3 || mid.length != 5 || tail.length != 5) {
            this._toast("\u8bf7\u628a 13 \u5f20\u724c\u5168\u90e8\u6446\u5230\u4e09\u9053\u4e2d");
            return;
        }
        var special = detectSpecialClient(this._cards, this._roads);
        if (!special) {
            if (cmpHand(eval3(head), eval5(mid)) > 0) { this._toast("\u5012\u6c34\uff1a\u524d\u9053\u4e0d\u80fd\u5927\u4e8e\u4e2d\u9053"); return; }
            if (cmpHand(eval5(mid), eval5(tail)) > 0) { this._toast("\u5012\u6c34\uff1a\u4e2d\u9053\u4e0d\u80fd\u5927\u4e8e\u540e\u9053"); return; }
        }
        this._pendingConfirm = true;
        this._confirmed = true;
        var me = this._ownSeat();
        if (me) me.confirmed = true;
        cc.vv.net.send("sss_arrange", { head: head, mid: mid, tail: tail });
        this.renderAll();
        this._updateMbs();
    },

    // ================= 比牌: 逐道轮流亮牌 =================
    onResult: function (data) {
        if (!data) return;
        this._cancelReveal();
        this._lastResult = data;
        this._resultByRoom = {};
        var results = data.results || [];
        for (var i = 0; i < results.length; ++i) {
            if (results[i]) this._resultByRoom[i] = results[i];
        }
        this._phase = "reveal";
        this._revealing = true;
        this._dealing = false;
        this._confirmed = true;
        this._final = false;
        this._picked = {};
        this._n.auto && (this._n.auto.root.active = false);
        this._n.manual && (this._n.manual.root.active = false);
        if (this._n.prepare) this._n.prepare.active = false;
        if (this._n.settle) this._n.settle.active = false;
        if (this._n.gameResult) this._n.gameResult.active = false;

        // 先把所有人三道牌摆到座位节点上(背面), 等轮到再翻
        this._resetSeatsCards(true);
        var seats = [];
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (!seat || !seat.player) continue;
            var r = this._resultByRoom[seat.roomSeat];
            if (!r) continue;
            seat.results = r;
            seat.special = r.special || null;
            seat.revealed = {};
            seat.confirmed = true;
            this._paintSeat(r, seat, false);
            if (r.special) this._showSeatSpecial(seat);   // 特殊牌型: 亮牌前先压在牌背上
            seats.push(seat);
        }
        this._updateMbs();

        // 分数显示: 自己(带 qd/zd/hd/zf)从比牌开始常显, 其他座位等某道亮完再临时显示
        this._roadDeltas = this._calcRoadDeltas(data);
        for (var sz = 0; sz < this._n.seats.length; ++sz) {
            var ssz = this._n.seats[sz];
            if (!ssz) continue;
            ssz._sz = {};
            this._applySz(ssz);
        }

        // 亮牌顺序: 先头道所有人轮流亮完, 再中道, 最后后道
        var steps = [];
        var order = ["head", "mid", "tail"];
        for (var oi = 0; oi < order.length; ++oi) {
            for (var si = 0; si < seats.length; ++si) {
                steps.push({ seat: seats[si], road: order[oi] });
            }
        }
        var self = this;
        var idx = 0;
        var prevRoad = null;
        var token = ++this._revealToken;
        var next = function () {
            if (!cc.isValid(self.node) || token !== self._revealToken) return;
            if (idx >= steps.length) { self._finishReveal(); return; }
            var st = steps[idx++];
            // 一道亮完: 切换到下一道时, 收起上一道的牌型提示, 并把牌放回场景位置
            if (prevRoad && prevRoad !== st.road) {
                self._hideRoadBadges(prevRoad);
                self._restoreRoadAll(prevRoad);
                self._szHideJklAll();          // 上一道结算完: 其他座位的临时盈亏收起
            }
            prevRoad = st.road;
            var arr = (st.seat.results.arrange && st.seat.results.arrange[st.road]) || [];
            // 单道亮牌出异常不能中断整个亮牌流程
            try { self._revealRoad(st.seat, st.road, arr); } catch (e) { console.log("[SSS] 亮牌异常", st.road, e); }
            try { self._szShowRoad(st.seat, st.road); } catch (e) { }
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("fanpai.mp3");
            // 等这一道放大展示 + 归位做完, 再亮下一个人/下一道
            self._revealTimer = setTimeout(next, 1400);
        };
        // "开始比牌"动画只是氛围, 不能阻塞亮牌: 动画加载失败/播放异常也必须按时亮牌
        try { this._fxSpine("sss_kaishi", 1.0, null); } catch (e) { console.log("[SSS] 开始比牌动画异常", e); }
        this._revealTimer = setTimeout(next, 900);
    },

    // 把某家的三道牌摆到座位 13 个节点(face=true 直接明牌)
    _paintSeat: function (r, seat, face) {
        var arr = (r && r.arrange) || {};
        this._paintRoad(seat, "head", arr.head || [], face);
        this._paintRoad(seat, "mid", arr.mid || [], face);
        this._paintRoad(seat, "tail", arr.tail || [], face);
    },

    _paintRoad: function (seat, road, ids, face) {
        var start = ROAD_START[road];
        for (var i = 0; i < ids.length; ++i) {
            var node = seat.cards[start + i];
            if (!node) continue;
            node.active = true;
            var sp = node.getComponent(cc.Sprite);
            if (sp) sp.spriteFrame = face ? this._frameOf(ids[i]) : this._backFrame();
        }
    },

    // 亮牌前强制所有座位(含自己)都是牌背
    _repaintBacks: function () {
        var back = this._backFrame();
        if (!back) {
            if (!this._warnedBack) { this._warnedBack = true; console.log("[SSS] card_back.png 未加载"); }
            return;
        }
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (!seat || !seat.player) continue;
            for (var i = 0; i < seat.cards.length; ++i) {
                var node = seat.cards[i];
                if (!node.active) continue;
                var sp = node.getComponent(cc.Sprite);
                if (sp) sp.spriteFrame = back;
            }
        }
    },

    _paintAllResults: function () {
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (!seat || !seat.results) continue;
            var arr = seat.results.arrange || {};
            for (var ri = 0; ri < ROAD_BY_ROW.length; ++ri) {
                var road = ROAD_BY_ROW[ri];
                this._paintRoad(seat, road, arr[road] || [], !!(seat.revealed && seat.revealed[road]));
            }
        }
    },

    // 亮牌时这一道临时的横向排列坐标(亮完再放回场景里的位置)
    // 一道亮完后, 按亮牌前记下的场景原始位置/角度/缩放/层级原样放回
    _restoreRoad: function (seat, road) {
        // 亮牌只改了层级(提到最前)和牌面纹理, 位置/角度/缩放没动过, 归位只需还原层级
        this._restoreChildOrder(seat);
    },

    // 兜底: 亮牌被打断时, 把摆直/放大过的牌按原始位置/角度/缩放/层级还原
    _restoreAllRoadsNow: function () {
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (!seat || !seat.cards) continue;
            for (var i = 0; i < seat.cards.length; ++i) {
                var n = seat.cards[i];
                var o = n && (n.__sssHome || n.__sssOrig);
                if (!o) continue;
                n.stopAllActions();
                n.setPosition(o.x, o.y);
                n.angle = o.angle;
                n.setScale(o.sx, o.sy);
            }
            this._restoreChildOrder(seat);
        }
    },

    _restoreChildOrder: function (seat) {
        var order = seat && seat.childOrder;
        if (!order || !order.length || !seat.box) return;
        for (var i = 0; i < order.length; ++i) {
            var c = order[i];
            if (c && cc.isValid(c) && c.parent === seat.box && c.getSiblingIndex() !== i) c.setSiblingIndex(i);
        }
    },

    _restoreRoadAll: function (road) {
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (seat) this._restoreRoad(seat, road);
        }
    },

    _revealRoad: function (seat, road, ids) {
        if (!seat || !ids || !ids.length) return;
        seat.revealed = seat.revealed || {};
        seat.revealed[road] = true;
        // 牌面已翻开, 牌背上的"特殊牌型"图片收起
        if (seat.specialBadge) seat.specialBadge.active = false;
        var disp = this._dispIds(ids);
        // 直接用座位自己的 13 张牌: 提到最前 -> 摆直 -> 放大 -> 上方显示牌型 -> 归位亮面
        this._straightenRoad(seat, road, disp);
    },

    // 按牌型排: 同一组(对子/三条/铁支/葫芦)的牌放一起, 组大的在前, 组内点数从大到小
    _dispIds: function (ids) {
        var cnt = {};
        for (var c = 0; c < ids.length; ++c) { var v0 = rankVal(ids[c]); cnt[v0] = (cnt[v0] || 0) + 1; }
        return ids.slice().sort(function (a, b) {
            var va = rankVal(a), vb = rankVal(b);
            if (cnt[va] != cnt[vb]) return cnt[vb] - cnt[va];
            if (va != vb) return vb - va;
            return suitPow(b) - suitPow(a);
        });
    },

    // 亮这一道: 用座位自己的真实牌节点, 提到最前 -> 旋转归零 -> 排到同一条基准线 -> 放大,
    // 牌型显示在牌的上方; 停留后按原位置/角度/缩放/层级归位, 再亮牌面
    _straightenRoad: function (seat, road, disp) {
        var self = this;
        if (!seat || !seat.box) return;
        // 第一步: 先把这一道牌翻成牌面(亮牌), 之后的摆直/放大/回位全程都是亮着的牌
        this._flipRoad(seat, road, disp);
        var start = ROAD_START[road];
        var nodes = [];
        for (var i = 0; i < disp.length; ++i) {
            var n = seat.cards[start + i];
            if (!n) continue;
            if (!n.__sssOrig) {
                n.__sssOrig = n.__sssHome || { x: n.x, y: n.y, angle: n.angle, sx: n.scaleX, sy: n.scaleY };
            }
            n.stopAllActions();
            n.active = true;
            n.opacity = 255;
            // 放大展示阶段仍是牌背, 牌面等归位后再亮(见 _flipRoad)
            nodes.push(n);
        }
        if (!nodes.length) return;
        // 整道提到牌盒最上层, 牌与牌保持场景里的前后顺序
        var order = seat.childOrder || [];
        nodes.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
        for (var q = 0; q < nodes.length; ++q) nodes[q].setSiblingIndex(seat.box.children.length - 1);

        // 基准线: 这一道牌的平均位置, 横向等间距
        var sumX = 0, sumY = 0;
        for (var s = 0; s < nodes.length; ++s) { sumX += nodes[s].x; sumY += nodes[s].y; }
        var cx = sumX / nodes.length, cy = sumY / nodes.length;
        var up = 1.35;   // 亮牌放大倍数(所有人一致)
        var cw = nodes[0].width * nodes[0].__sssOrig.sx * up;
        // 牌与牌要像原版一样叠着: 间距取这一道在场景里的实际步进(约 40px), 再按放大比例放大
        var gap = 0, gc = 0;
        for (var g = 1; g < nodes.length; ++g) {
            var dx = nodes[g].__sssOrig.x - nodes[g - 1].__sssOrig.x;
            if (dx < 0) dx = -dx;
            if (dx > 0) { gap += dx; gc++; }
        }
        gap = gc ? gap / gc * 1.45 : cw * 0.5;   // 比场景里的叠放再拉开
        gap *= up;
        if (gap > cw * 0.82) gap = cw * 0.82;    // 最多留 82% 牌宽, 仍保持重叠
        for (var t = 0; t < nodes.length; ++t) {
            var node = nodes[t];
            var o = node.__sssOrig;
            var tx = cx + (t - (nodes.length - 1) / 2) * gap;
            // 用 tween 直接写 x/y/angle/scale, 避免 rotateTo 在 2D 下角度不生效
            node.stopAllActions();
            cc.tween(node).to(0.28, {
                x: tx, y: cy, angle: 0,
                scaleX: o.sx * up, scaleY: o.sy * up
            }).start();
        }
        // 牌型压在牌的上方
        var ch = nodes[0].height * nodes[0].__sssOrig.sy * up;
        this._showRoadBadge(seat, road, disp, cy + ch * 0.5 + (seat.k === 0 ? 34 : 24), cx);

        // 第二步: 停留展示 -> 缩小/复位旋转/回原层级(动画) -> 牌型留在原位上方
        // 复原不依赖亮牌 token: 到点必须把牌放回场景原样
        var token = this._revealToken;
        setTimeout(function () {
            if (!cc.isValid(self.node) || !cc.isValid(seat.box)) return;
            self._restoreRoadNodes(seat, road);
            setTimeout(function () {
                if (!cc.isValid(self.node) || !cc.isValid(seat.box)) return;
                if (token === self._revealToken) self._showRoadBadge(seat, road, disp);
            }, 340);
        }, 1200);
    },

    // 这一道牌按原始位置/角度/缩放/层级放回
    _restoreRoadNodes: function (seat, road) {
        var start = ROAD_START[road], cap = ROAD_CAP[road];
        for (var i = 0; i < cap; ++i) {
            var n = seat.cards[start + i];
            var o = n && (n.__sssHome || n.__sssOrig);
            if (!o) continue;
            n.stopAllActions();
            // 位置/角度/缩放全部按原值写回
            cc.tween(n).to(0.25, {
                x: o.x, y: o.y, angle: o.angle,
                scaleX: o.sx, scaleY: o.sy
            }).start();
        }
        var self = this;
        setTimeout(function () { if (cc.isValid(self.node) && cc.isValid(seat.box)) self._restoreChildOrder(seat); }, 260);
    },

    // 收起所有亮牌展示组(换局/重进/取消亮牌)
    _hideSpots: function () {
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (!seat || !seat.spots) continue;
            for (var road in seat.spots) {
                var spot = seat.spots[road];
                if (!spot || !spot.root || !cc.isValid(spot.root)) continue;
                spot.root.stopAllActions();
                spot.root.active = false;
                spot.root.setScale(spot.bx, spot.by);
            }
        }
    },

    // 展示组播完后: 翻开 bbCards 里这一道的牌, 并显示牌型图片
    _flipRoad: function (seat, road, disp) {
        var start = ROAD_START[road];
        var box = seat.box;
        var roadNodes = [];
        for (var i = 0; i < disp.length; ++i) {
            var node = seat.cards[start + i];
            if (!node) continue;
            // 不能 stopAllActions: 归位动作可能还差最后几帧, 打断会停在半路
            node.active = true;
            node.opacity = 255;
            var sp = node.getComponent(cc.Sprite);
            if (sp) sp.spriteFrame = this._frameOf(disp[i]);
            roadNodes.push(node);
        }
        // 亮完按原层级放回, 不再整道提到最上
        this._showRoadBadge(seat, road, disp);
    },

    // 特殊牌型图片: 亮牌前压在牌背上
    _showSeatSpecial: function (seat) {
        if (!seat || !seat.box) return;
        if (!seat.specialBadge) {
            var n = new cc.Node("sssSpecial");
            var sp0 = n.addComponent(cc.Sprite);
            sp0.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            n.setContentSize(seat.k === 0 ? 240 : 160, seat.k === 0 ? 110 : 74);
            n.zIndex = 300;
            seat.box.addChild(n);
            seat.specialBadge = n;
        }
        var sp = seat.specialBadge.getComponent(cc.Sprite);
        if (sp) sp.spriteFrame = this._img("\u7279\u6b8a\u724c\u578b");
        seat.specialBadge.active = true;
        seat.specialBadge.setPosition(0, seat.k === 0 ? 20 : 10);
        seat.specialBadge.setSiblingIndex(seat.box.children.length - 1);
    },

    // 牌面牌型图片(亮到的这一道)
    _showRoadBadge: function (seat, road, ids, aboveY, atX) {
        if (!seat || !seat.box) return;
        var nm = typeImgOf(road, ids);
        if (!nm) return;
        if (!seat.badges) seat.badges = {};
        var badge = seat.badges[road];
        if (!badge) {
            badge = new cc.Node("sssBadge_" + road);
            badge.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
            badge.setContentSize(seat.k === 0 ? 150 : 116, seat.k === 0 ? 75 : 58);
            badge.zIndex = 200;
            seat.box.addChild(badge);
            seat.badges[road] = badge;
        }
        var f = this._img(nm);
        var sp = badge.getComponent(cc.Sprite);
        if (sp) sp.spriteFrame = f;
        badge.active = !!f;
        badge.opacity = 255;
        if (aboveY !== undefined && aboveY !== null) {
            // 放大展示时: 牌型在这道牌正上方
            badge.setPosition(atX || 0, aboveY);
        } else {
            // 归位后: 牌型同样摆在整道牌的上方
            var start = ROAD_START[road];
            var x = 0, y = 0, cnt = 0, hw = 0;
            for (var i = 0; i < ids.length; ++i) {
                var c = seat.cards[start + i];
                if (!c) continue;
                x += c.x; y += c.y; cnt++;
                hw = Math.max(hw, c.height * c.scaleY);
            }
            if (cnt) {
                badge.setPosition(x / cnt, (y / cnt) + hw * 0.5 + (seat.k === 0 ? 20 : 14));
            }
        }
        badge.setSiblingIndex(seat.box.children.length - 1);
        badge.stopAllActions();
        badge.setScale(0.6, 0.6);
        badge.runAction(cc.scaleTo(0.12, 1, 1).easing(cc.easeBackOut()));
    },

    // 收起某一道的牌型提示(亮完一道后调用)
    _hideRoadBadges: function (road) {
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (!seat || !seat.badges) continue;
            var b = seat.badges[road];
            if (!b || !b.active) continue;
            b.stopAllActions();
            b.runAction(cc.sequence(
                cc.fadeOut(0.18),
                cc.callFunc(function () { this.active = false; this.opacity = 255; }, b)
            ));
        }
    },

    _finishReveal: function () {
        this._revealing = false;
        this._phase = "settle";
        this._roundRevealed = true;   // 本局已亮完: 桌上保持牌面, 不再被重绘成牌背
        // 三道全部结算完: 临时盈亏收起, 自己的总分常显到下一局开始
        this._szHideJklAll();
        var meSz = this._ownSeat();
        if (meSz && meSz.results) this._szUpdate(meSz, "total", Number(meSz.results.delta) || 0);
        // 特殊牌型: bbMb 显示特殊牌型图片
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (!seat || !seat.player) continue;
            var r = this._resultByRoom[seat.roomSeat];
            seat.results = r || seat.results;
        }
        this._updateMbs();
        // 每家的本局得分写到 bbSummary / 分数
        for (var k2 = 0; k2 < this._n.seats.length; ++k2) {
            var s2 = this._n.seats[k2];
            if (!s2 || !s2.player) continue;
            var r2 = this._resultByRoom[s2.roomSeat];
            if (!r2) continue;
            var dd = r2.delta || 0;
            if (s2.summary) {
                s2.summary.node.active = true;
                s2.summary.string = (dd >= 0 ? "+" : "") + dd;
            }
            if (s2.scoreLb) s2.scoreLb.string = "\u5206\u6570:" + (r2.totalscore != null ? r2.totalscore : dd);
        }
        var self = this;
        // 最后一道也亮完后, 牌型提示再停留一会儿就收起, 随后弹结算
        this.scheduleOnce(function () {
            if (!cc.isValid(self.node)) return;
            self._hideRoadBadges("head");
            self._hideRoadBadges("mid");
            self._hideRoadBadges("tail");
            self._restoreAllRoadsNow();     // 最后一道亮完: 所有牌强制按原位置/角度/缩放/层级复原
            // 最后一局: 亮牌期间收到的总结算, 现在牌已归位, 可以弹了
            if (self._pendingGameEnd) {
                var pend = self._pendingGameEnd;
                self._pendingGameEnd = null;
                self.onGameEnd(pend);
            }
        }, 1.1);
        // 打枪/全垒打动画播完再弹结算(没有特效时直接弹)
        this.scheduleOnce(function () {
            if (!cc.isValid(self.node)) return;
            self._playEndFx(function () { if (cc.isValid(self.node)) self._showSettle(); });
        }, 1.5);
        // 亮牌结束: 座位上的"已准备"标记要收掉(结算阶段不需要)
        this._refreshSitUI();
        var me = null;
        for (var mi = 0; mi < this._n.seats.length; ++mi) {
            var sm = this._n.seats[mi];
            if (sm && sm.player && sm.player.userid == this._myUserId) { me = sm; break; }
        }
        var myDelta = (me && me.results) ? (me.results.delta || 0) : 0;
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX(myDelta >= 0 ? "win.wav" : "lose.wav");
    },

    _showSettle: function () {
        this._restoreAllRoadsNow();   // 弹结算前再兜底复原一次
        var panel = this._n.settle;
        if (!panel) return;
        var title = this._labelOf(this._findIn(panel, "settleTitle"));
        if (title) { title.node.active = true; title.string = "\u672c\u5c40\u7ed3\u7b97"; }
        var cards = this._findIn(panel, "bbSettleCards");
        if (cards) cards.active = false;
        var lines = [];
        for (var k = 0; k < this._n.seats.length; ++k) {
            var seat = this._n.seats[k];
            if (!seat || !seat.player) continue;
            var r = this._resultByRoom[seat.roomSeat];
            if (!r) continue;
            var dd = r.delta || 0;
            var line = (r.name || seat.player.name || "\u73a9\u5bb6") + "  " + (dd >= 0 ? "+" : "") + dd;
            if (r.totalscore != null) line += "  (\u603b " + r.totalscore + ")";
            if (r.special) line += "  " + r.special;
            if (r.gun > 0) line += "  \u6253\u67aa\u00d7" + r.gun;
            lines.push(line);
        }
        // 用场景里的 settleContent 显示每家的本局得分(总分), settleRound 只留"第x/y局"
        var content = this._findIn(panel, "settleContent");
        var contentLb = this._labelOf(content);
        if (contentLb) {
            content.active = true;
            contentLb.string = lines.join("\n");
        }
        var roundLb = this._labelOf(this._findIn(panel, "settleRound"));
        if (roundLb) {
            var nm2 = cc.vv && cc.vv.gameNetMgr;
            var cur = (nm2 && nm2.numOfGames) || 0;
            var max = (nm2 && nm2.maxNumOfGames) || 0;
            roundLb.string = cur > 0 ? ("\u7b2c" + cur + (max ? "/" + max : "") + "\u5c40") : "";
        }
        panel.active = true;
    },

    // ================= 结束/准备 =================
    onGameEnd: function (data) {
        // 最后一局: 服务端在结算推送后马上发总结算, 此时亮牌动画还没播完.
        // 先记下来, 等亮牌走完并把牌放回场景位置后再弹总结算, 否则牌会停在半翻/横排状态
        if (this._revealing || this._phase === "reveal") {
            this._pendingGameEnd = data;
            return;
        }
        this._cancelReveal();
        // 弹总结算前, 把三道牌立即放回亮牌前记下的场景原位置/角度/缩放/层级
        this._restoreAllRoadsNow();
        this._phase = "end";
        this._revealing = false;
        this._final = true;
        if (this._n.settle) this._n.settle.active = false;
        var lines = [];
        var endinfo = (data && data.endinfo) || [];
        for (var i = 0; i < endinfo.length; ++i) {
            var e = endinfo[i];
            var sc = e.score || 0;
            lines.push((e.name || "\u73a9\u5bb6") + "   " + (sc >= 0 ? "+" : "") + sc);
        }
        var info = this._labelOf(this._findIn(this._n.gameResult, "bbFinalInfo"));
        if (info) info.string = lines.length ? lines.join("\n") : "\u672c\u5c40\u7ed3\u675f";
        if (this._n.gameResult) this._n.gameResult.active = true;
        this.renderAll();
    },

    onReady: function () {
        var nm = cc.vv && cc.vv.gameNetMgr;
        if (nm && nm.maxNumOfGames > 0 && nm.numOfGames >= nm.maxNumOfGames) {
            this._toast("\u5df2\u662f\u6700\u540e\u4e00\u5c40");
            return;
        }
        cc.vv.net.send("ready");
        var me = this._ownSeat();
        if (me && me.player) me.player.ready = true;   // 坐下标记/隐藏坐下按钮
        if (this._n.settle) this._n.settle.active = false;
        if (this._n.gameResult) this._n.gameResult.active = false;
        this._phase = "idle";
        this._final = false;
        this._confirmed = false;
        this.renderAll();
    },

    // ================= 操作 =================
    onBtnSettingsClicked: function () {
        var st = this._find("settings");
        if (st) st.active = true;
    },

    showTip: function (msg) { this._toast(msg); },

    _toast: function (msg) {
        if (!msg) return;
        if (!this._toastNode || !cc.isValid(this._toastNode)) {
            var n = new cc.Node("sssToast");
            var lb = n.addComponent(cc.Label);
            lb.fontSize = 34;
            lb.lineHeight = 44;
            lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            lb.enableWrapText = false;
            var ol = n.addComponent(cc.LabelOutline);
            ol.color = cc.color(0, 0, 0, 220);
            ol.width = 3;
            n.color = cc.color(255, 236, 140);
            n.zIndex = 9999;
            this.node.addChild(n);
            this._toastNode = n;
        }
        var lb2 = this._toastNode.getComponent(cc.Label);
        if (lb2) lb2.string = msg;
        this._toastNode.setPosition(0, 380);
        this._toastNode.active = true;
        this._toastNode.stopAllActions();
        this._toastNode.opacity = 255;
        this._toastNode.runAction(cc.sequence(cc.delayTime(1.6), cc.fadeOut(0.35),
            cc.callFunc(function () { if (this._toastNode) this._toastNode.active = false; }, this)));
    },

    _confirm: function (msg, onOk) {
        var alert = this._n.alert;
        if (!alert) { if (onOk) onOk(); return; }
        var content = this._labelOf(this._findIn(alert, "content"));
        if (content) content.string = msg || "";
        var title = this._labelOf(this._findIn(alert, "title"));
        if (title) title.string = "\u63d0\u793a";
        this._confirmOk = onOk;
        alert.active = true;
    },

    _cancelReveal: function () {
        if (this._revealTimer) { clearTimeout(this._revealTimer); this._revealTimer = null; }
        this._revealToken = (this._revealToken || 0) + 1;
        if (this._n && this._n.seats) {
            this._hideSpots();
            this._restoreAllRoadsNow();
        }
    },

    onExit: function () {
        var self = this;
        if (this._final) {
            cc.vv.net.send("leave_room");
            setTimeout(function () { self.leaveRoom(); }, 500);
            return;
        }
        this._confirm("\u662f\u5426\u786e\u5b9a\u9000\u51fa\u623f\u95f4?", function () {
            cc.vv.net.send("exit");
            setTimeout(function () {
                if (cc.isValid(self.node) && !self._leaving) {
                    if (cc.vv.gameNetMgr.clearRoomState) cc.vv.gameNetMgr.clearRoomState();
                    self.leaveRoom();
                }
            }, 2000);
        });
    },

    onDissolve: function () {
        var self = this;
        this._confirm("\u89e3\u6563\u623f\u95f4\u5c06\u7ed3\u675f\u672c\u5c40, \u662f\u5426\u786e\u5b9a\u89e3\u6563?", function () {
            if (cc.vv.gameNetMgr.gamestate == "begin" || self._phase === "dealing" || self._phase === "arrange" || self._phase === "reveal") {
                cc.vv.net.send("dissolve_request");
            } else {
                cc.vv.net.send("dispress");
            }
        });
    },

    leaveRoom: function () {
        if (this._leaving) return;
        this._leaving = true;
        var curScene = cc.director.getScene ? cc.director.getScene() : null;
        var curName = (curScene && curScene.name) ? curScene.name : "";
        if (curName === "hall" || curName === "club") return;
        var nm = cc.vv.gameNetMgr;
        if (nm && nm.exitToTableHall) nm.exitToTableHall();
        else if (cc.vv.sceneMgr) cc.vv.sceneMgr.load("club");
        else cc.director.loadScene("club");
    }
});
