// 十三水(2人/4人/6人) 牌桌
// 界面全部在 mjgame_sss 场景节点中(本脚本不创建/不布局任何控件, 只做数据绑定与刷新)
// 流程: 发牌(开始动画) -> 手摆/自动摆(可来回切换) -> 确认出牌 -> 比牌
// 协议:
//   sss_start_push {myCards, mySeat, seats, arrangeDeadline, arrangeSeconds, confirm, confirmed, arrange, conf}
//   sss_arrange_ok_push {head, mid, tail, auto}
//   sss_ready_push {seatindex, userid}
//   sss_error_push {msg}
//   sss_result_push {results:[{userid,name,seatindex,arrange,special,invalid,quanleida,gun,delta,totalscore}], baseScore, details}
//   上行: sss_arrange {head,mid,tail} | {auto:true}, sss_confirm, ready, exit, dissolve_request ...

var SUIT_FRAMES = ["Spade", "Heart", "Club", "Diamond"];
var SUIT_SYMBOLS = ["\u2660", "\u2665", "\u2663", "\u2666"];
var RANK_NAMES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
var ROAD_CAP = { head: 3, mid: 5, tail: 5 };
var ROAD_NAMES = { head: "\u5934\u9053", mid: "\u4e2d\u9053", tail: "\u5c3e\u9053" };
var ROADS = ["tail", "mid", "head"];
var HAND_SLOTS = 13;
var TYPE_LEGEND = ["\u5bf9\u5b50", "\u4e24\u5bf9", "\u4e09\u6761", "\u987a\u5b50", "\u540c\u82b1", "\u846b\u82a6", "\u94c1\u652f", "\u540c\u82b1\u987a", "\u4e94\u540c"];
var TYPE_DESC = [
    "\u4e24\u5f20\u540c\u70b9\u6570, \u5934/\u4e2d/\u5c3e\u9053\u90fd\u53ef",
    "\u4e24\u526f\u5bf9\u5b50+\u5355\u5f20, \u4ec5\u4e2d/\u5c3e\u9053",
    "\u4e09\u5f20\u540c\u70b9\u6570, \u5934\u9053\u4e09\u6761\u5956 3 \u6ce8",
    "\u4e94\u5f20\u8fde\u7eed, \u4ec5\u4e2d/\u5c3e\u9053",
    "\u4e94\u5f20\u540c\u82b1\u8272, \u4ec5\u4e2d/\u5c3e\u9053",
    "\u4e09\u6761+\u5bf9\u5b50, \u4ec5\u4e2d/\u5c3e\u9053, \u5956 1 \u6ce8",
    "\u56db\u5f20\u540c\u70b9\u6570, \u4ec5\u4e2d/\u5c3e\u9053, \u5956 4 \u6ce8",
    "\u540c\u82b1\u8272\u4e14\u8fde\u7eed, \u5956 5 \u6ce8",
    "\u4e94\u5f20\u540c\u70b9\u6570, \u4ec5\u4e2d/\u5c3e\u9053, \u6700\u9ad8\u724c\u578b"
];

// ================= 牌型算法(与服务端 gamemgr_sss.js 一致) =================
// 6人桌为两副牌(id 0..103), 显示/比牌时按 id % 52 还原成一张牌
function suitOf(id) { return Math.floor((id % 52) / 13); }
function rankVal(id) { var i = id % 52 % 13; return i == 0 ? 14 : i + 1; }

function eval5(cards) {
    var vals = cards.map(rankVal).sort(function (a, b) { return b - a; });
    var suits = cards.map(suitOf);
    var flush = (suits[0] == suits[1] && suits[1] == suits[2] && suits[2] == suits[3] && suits[3] == suits[4]);
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
    if (stHigh && flush) return { lv: 8, key: [stHigh] };
    if (c0 == 4) return { lv: 7, key: [groups[0], groups[1]] };
    if (c0 == 3 && c1 == 2) return { lv: 6, key: [groups[0], groups[1]] };
    if (flush) return { lv: 5, key: vals };
    if (stHigh) return { lv: 4, key: [stHigh] };
    if (c0 == 3) {
        var k3 = [groups[0]];
        for (var i3 = 0; i3 < groups.length; ++i3) { if (cnt[groups[i3]] == 1) k3.push(groups[i3]); }
        k3.sort(function (a, b) { if (a == groups[0]) return -1; if (b == groups[0]) return 1; return b - a; });
        return { lv: 3, key: k3 };
    }
    if (c0 == 2 && c1 == 2) {
        var pairHi = Math.max(groups[0], groups[1]), pairLo = Math.min(groups[0], groups[1]);
        var kicker = 0;
        for (var i2 = 0; i2 < groups.length; ++i2) { if (cnt[groups[i2]] == 1) kicker = groups[i2]; }
        return { lv: 2, key: [pairHi, pairLo, kicker] };
    }
    if (c0 == 2) {
        var kp = [groups[0]];
        for (var i1 = 1; i1 < groups.length; ++i1) kp.push(groups[i1]);
        return { lv: 1, key: kp };
    }
    return { lv: 0, key: vals };
}

function eval3(cards) {
    var vals = cards.map(rankVal).sort(function (a, b) { return b - a; });
    if (vals[0] == vals[1] && vals[1] == vals[2]) return { lv: 3, key: [vals[0]] };
    if (vals[0] == vals[1]) return { lv: 1, key: [vals[0], vals[2]] };
    if (vals[1] == vals[2]) return { lv: 1, key: [vals[1], vals[0]] };
    return { lv: 0, key: vals };
}

function cmpHand(a, b) {
    if (a.lv != b.lv) return a.lv - b.lv;
    var n = Math.min(a.key.length, b.key.length);
    for (var i = 0; i < n; ++i) {
        if (a.key[i] != b.key[i]) return a.key[i] - b.key[i];
    }
    return 0;
}

// 本地穷举最优摆法(与服务端 autoArrange 评分一致)
function autoArrange(cards) {
    var best = null, bestScore = -1;
    var n = cards.length;
    if (n < 13) return null;
    var combos5 = [];
    (function pick5(start, acc) {
        if (acc.length == 5) { combos5.push(acc.slice()); return; }
        for (var k = start; k < n; ++k) { acc.push(k); pick5(k + 1, acc); acc.pop(); }
    })(0, []);
    for (var i = 0; i < combos5.length; ++i) {
        var tail = combos5[i];
        var tailHand = eval5(tail.map(function (x) { return cards[x]; }));
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
            for (var h = 0; h < n; ++h) {
                if (tail.indexOf(h) < 0 && mid.indexOf(h) < 0) head.push(h);
            }
            var headHand = eval3(head.map(function (x) { return cards[x]; }));
            var midHand = eval5(mid.map(function (x) { return cards[x]; }));
            if (cmpHand(headHand, midHand) > 0) continue;
            if (cmpHand(midHand, tailHand) > 0) continue;
            var sc = (tailHand.lv * 1000000 + (tailHand.key[0] || 0) * 10000)
                   + (midHand.lv * 1000 + (midHand.key[0] || 0) * 10)
                   + (headHand.lv * 10 + (headHand.key[0] || 0));
            if (sc > bestScore) {
                bestScore = sc;
                best = {
                    head: head.map(function (x) { return cards[x]; }),
                    mid: mid.map(function (x) { return cards[x]; }),
                    tail: tail.map(function (x) { return cards[x]; })
                };
            }
        }
    }
    return best;
}

function handTypeName(road, hand) {
    if (hand.lv == 0) return "\u4e4c\u9f99";
    if (hand.lv == 1) return "\u5bf9\u5b50";
    if (hand.lv == 2) return "\u4e24\u5bf9";
    if (hand.lv == 3) return "\u4e09\u6761";
    if (hand.lv == 4) return "\u987a\u5b50";
    if (hand.lv == 5) return "\u540c\u82b1";
    if (hand.lv == 6) return "\u846b\u82a6";
    if (hand.lv == 7) return "\u94c1\u652f";
    if (hand.lv == 8) return "\u540c\u82b1\u987a";
    return "";
}

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad: function () {
        if (!cc.vv) {
            cc.director.loadScene("loading");
            return;
        }
        this._leaving = false;
        this._playing = false;
        this._final = false;
        this._dealing = false;
        this._hand = [];
        this._handSlotIds = [];
        this._cards = [];
        this._conf = null;
        this._roads = { head: [], mid: [], tail: [] };
        this._manualRoads = { head: [], mid: [], tail: [] };
        this._confirmed = false;
        this._pendingConfirm = false;
        this._autoMode = false;
        this._mySeat = -1;
        this._readyMap = {};
        this._selectRoad = "tail";
        this._frames = null;
        this._leftSec = 0;
        this._myUserId = (cc.vv && cc.vv.userMgr) ? cc.vv.userMgr.userId : 0;
        this._n = {};
        this._startFrames = null;
        this._startFramesLoaded = false;
        this._startFxPlaying = false;
        this._pendingStart = null;
        this._pendingStartTimer = null;
        this._revealTimer = null;
        this._revealToken = 0;
        this._dealingSec = 0;
        //服务端 sss_ready_push 用"牌局座位号", 房间 seats 用"房间座位号", 需要用户id映射
        this._gameSeatOf = {};
        this._gameSeatTotal = 0;
        this._bindUI();
        this._bindNet();
        this._loadCards();
        this._loadStartFx();
        this.renderAll();
        if (cc.vv.audioMgr) cc.vv.audioMgr.playBGM("bgFight.mp3");
        this.schedule(this._tick, 1);
    },

    onDestroy: function () {
        this.unschedule(this._tick);
        if (this._fxTimer) { clearInterval(this._fxTimer); this._fxTimer = null; }
        if (this._pendingStartTimer) { clearTimeout(this._pendingStartTimer); this._pendingStartTimer = null; }
        this._pendingStart = null;
        if (this._tipTimer) { clearTimeout(this._tipTimer); this._tipTimer = null; }
        this._cancelReveal();
        if (this._sio && this._sioListeners) {
            this._sio.removeListener('exit_result', this._sioListeners.exit_result);
            this._sio.removeListener('dispress_push', this._sioListeners.dispress_push);
            this._sioListeners = null;
        }
        if (cc.vv && cc.vv.gameNetMgr && cc.vv.gameNetMgr.dataEventHandler == this.node) {
            cc.vv.gameNetMgr.dataEventHandler = null;
        }
    },

    // ================= 场景节点绑定(只取节点/挂事件, 不做布局) =================
    _find: function (name) {
        var stack = [this.node];
        while (stack.length) {
            var n = stack.pop();
            if (n.name === name) return n;
            var ch = n.children;
            for (var i = 0; i < ch.length; ++i) stack.push(ch[i]);
        }
        console.log("[SSS] scene node missing:", name);
        return null;
    },

    _labelOf: function (node) {
        return node ? node.getComponent(cc.Label) : null;
    },

    _spriteOf: function (node) {
        return node ? node.getComponent(cc.Sprite) : null;
    },

    _bindTap: function (node, cb) {
        if (!node) return;
        node.on(cc.Node.EventType.TOUCH_END, function () {
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("btnClick.wav");
            if (cb) cb();
        });
    },

    // 遮罩拦截穿透点击
    _blockTouch: function (node) {
        if (!node) return;
        node.on(cc.Node.EventType.TOUCH_START, function () {});
        node.on(cc.Node.EventType.TOUCH_END, function () {});
    },

    _bindUI: function () {
        var self = this;
        var n = this._n;

        n.tip = this._labelOf(this._find("tipLabel"));
        n.countdown = this._labelOf(this._find("countdownLabel"));
        n.progress = this._labelOf(this._find("progressLabel"));
        n.time = this._labelOf(this._find("timeLabel"));
        n.oppRoot = this._find("oppRoot");
        //对手位: 2/4人桌用 opp0..opp2, 6人桌用 opp0..opp4, 位置全部在场景里摆好
        n.opps = [];
        for (var oi = 0; oi < 5; ++oi) {
            var ob = this._find("opp" + oi);
            if (ob) n.opps.push(ob);
        }
        n.selfSeat = this._find("selfSeat");
        n.selfName = this._labelOf(this._find("selfSeat") ? this._find("selfSeat").getChildByName("name") : null);
        n.selfScore = this._labelOf(this._find("selfSeat") ? this._find("selfSeat").getChildByName("score") : null);
        n.selfState = this._labelOf(this._find("selfSeat") ? this._find("selfSeat").getChildByName("state") : null);

        n.arrangeRoot = this._find("arrangeRoot");
        n.cdRoot = this._find("cdRoot");

        n.rows = {};
        ROADS.forEach(function (road) {
            // 必须从 arrangeRoot 下取: 比牌面板里也有同名的 headRow/midRow/tailRow
            var row = n.arrangeRoot ? n.arrangeRoot.getChildByName(road + "Row") : self._find(road + "Row");
            if (!row) return;
            var labelNode = row.getChildByName(road + "RowLabel");
            var slotsWrap = row.getChildByName(road + "Slots");
            var capName = road.charAt(0).toUpperCase() + road.slice(1);
            n.rows[road] = {
                row: row,
                label: self._labelOf(labelNode),
                labelNode: labelNode,
                ok: row.getChildByName("ok"),
                typeNode: row.getChildByName("typeLabel"),
                typeLabel: self._labelOf(row.getChildByName("typeLabel")),
                slots: slotsWrap ? slotsWrap.children : [],
                clearBtn: row.getChildByName("btnClear" + capName)
            };
        });

        var handRoot = this._find("handRoot");
        n.handRoot = handRoot;
        n.handSlots = handRoot ? handRoot.children : [];
        n.typeBar = this._find("typeBar");
        if (n.typeBar) {
            //牌型说明条: 点任意牌型弹说明(不是死按钮)
            for (var ti = 0; ti < n.typeBar.children.length; ++ti) {
                (function (idx, item) {
                    item.on(cc.Node.EventType.TOUCH_END, function () {
                        var nm = TYPE_LEGEND[idx] || "";
                        var ds = TYPE_DESC[idx] || "";
                        self.showTip(nm + "\uff1a" + ds);
                    });
                })(ti, n.typeBar.children[ti]);
            }
        }

        n.btnAuto = this._find("btnAuto");
        n.btnManual = this._find("btnManual");
        n.btnSwap = this._find("btnSwap");
        n.btnConfirm = this._find("btnConfirm");
        n.btnReady = this._find("btnReady");
        n.statPanel = this._find("statPanel");
        n.statLabels = [];
        if (n.statPanel) {
            for (var si = 0; si < 6; ++si) n.statLabels.push(this._labelOf(n.statPanel.getChildByName("stat" + si)));
        }

        n.resultPanel = this._find("resultPanel");
        n.resultTitle = n.resultPanel ? this._labelOf(n.resultPanel.getChildByName("title")) : null;
        n.resultDetail = n.resultPanel ? this._labelOf(n.resultPanel.getChildByName("detailLabel")) : null;
        n.resultPlayers = [];
        for (var pi = 0; pi < 6; ++pi) {
            var pb = this._find("player" + pi);
            if (!pb) { n.resultPlayers.push(null); continue; }
            n.resultPlayers.push({
                box: pb,
                name: this._labelOf(pb.getChildByName("name")),
                tags: this._labelOf(pb.getChildByName("tags")),
                delta: this._labelOf(pb.getChildByName("delta")),
                rows: {
                    head: pb.getChildByName("headRow"),
                    mid: pb.getChildByName("midRow"),
                    tail: pb.getChildByName("tailRow")
                }
            });
        }

        n.finalPanel = this._find("finalPanel");
        n.finalLabel = n.finalPanel ? this._labelOf(n.finalPanel.getChildByName("finalLabel")) : null;
        n.dissolvePanel = this._find("dissolvePanel");
        n.dissolveMsg = n.dissolvePanel ? this._labelOf(n.dissolvePanel.getChildByName("dissolveMsg")) : null;
        n.confirmPanel = this._find("confirmPanel");
        n.confirmLabel = n.confirmPanel ? this._labelOf(n.confirmPanel.getChildByName("confirmLabel")) : null;

        n.fxStart = this._find("fxStart");

        // 按钮(场景中已摆好位置/尺寸)
        this._bindTap(this._find("btnExit"), this.onExit.bind(this));
        this._bindTap(this._find("btnDissolve"), this.onDissolve.bind(this));
        this._bindTap(n.btnAuto, this.onAuto.bind(this));
        this._bindTap(n.btnManual, this.onManual.bind(this));
        this._bindTap(n.btnSwap, this.onSwap.bind(this));
        this._bindTap(n.btnConfirm, this.onConfirm.bind(this));
        this._bindTap(n.btnReady, this.onReady.bind(this));

        // 每道 X 清除
        ROADS.forEach(function (road) {
            var info = n.rows[road];
            if (!info) return;
            self._bindTap(info.clearBtn, function () { self.onClearRoad(road); });
        });

        if (n.resultPanel) {
            this._blockTouch(n.resultPanel.getChildByName("dim"));
            this._bindTap(n.resultPanel.getChildByName("btnResultReady"), function () {
                n.resultPanel.active = false;
                self.onReady();
            });
        }
        if (n.finalPanel) {
            this._blockTouch(n.finalPanel.getChildByName("dim"));
            this._bindTap(n.finalPanel.getChildByName("btnFinalExit"), this.leaveRoom.bind(this));
        }
        if (n.dissolvePanel) {
            this._blockTouch(n.dissolvePanel.getChildByName("dim"));
            this._bindTap(n.dissolvePanel.getChildByName("btnDsAgree"), function () {
                cc.vv.net.send("dissolve_agree");
                n.dissolvePanel.active = false;
            });
            this._bindTap(n.dissolvePanel.getChildByName("btnDsReject"), function () {
                cc.vv.net.send("dissolve_reject");
                n.dissolvePanel.active = false;
            });
        }
        if (n.confirmPanel) {
            this._blockTouch(n.confirmPanel.getChildByName("dim"));
            this._bindTap(n.confirmPanel.getChildByName("btnCfOk"), function () {
                var cb = self._confirmOk;
                n.confirmPanel.active = false;
                self._confirmOk = null;
                if (cb) cb();
            });
            this._bindTap(n.confirmPanel.getChildByName("btnCfCancel"), function () {
                n.confirmPanel.active = false;
                self._confirmOk = null;
            });
        }

        // 手牌槽位(13个固定节点)
        for (var i = 0; i < n.handSlots.length; ++i) {
            this._bindHandSlot(n.handSlots[i], i);
        }
        // 三道槽位
        ROADS.forEach(function (road) {
            var row = n.rows[road];
            if (!row) return;
            for (var i = 0; i < row.slots.length; ++i) {
                self._bindRoadSlot(row.slots[i], road, i);
            }
        });
    },

    _bindHandSlot: function (slot, index) {
        var self = this;
        if (!slot) return;
        var handler = function () {
            var id = self._handSlotIds[index];
            if (id == null || id < 0) return;
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("select.wav");
            self.onTapHand(id);
        };
        slot.on(cc.Node.EventType.TOUCH_END, handler);
        var card = slot.getChildByName("card");
        if (card) {
            card.on(cc.Node.EventType.TOUCH_END, function (e) {
                if (e) e.stopPropagation();
                handler();
            });
        }
    },

    _bindRoadSlot: function (slot, road, index) {
        var self = this;
        if (!slot) return;
        var handler = function (e) {
            if (e && e.propagationStopped) return;
            var cards = self._roads[road] || [];
            var id = cards[index];
            if (id == null) return;
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("select.wav");
            self.onTapRoadCard(road, id);
        };
        slot.on(cc.Node.EventType.TOUCH_END, handler);
        //牌面在子节点上, 单独挂一次并阻止冒泡, 防止事件被子节点吃掉导致点了没反应
        var card = slot.getChildByName("card");
        if (card) {
            card.on(cc.Node.EventType.TOUCH_END, function (e) {
                if (e) e.stopPropagation();
                handler(e);
            });
        }
    },

    _confirm: function (msg, onOk) {
        if (!this._n.confirmPanel) { if (onOk) onOk(); return; }
        this._confirmOk = onOk;
        if (this._n.confirmLabel) this._n.confirmLabel.string = msg || "";
        this._n.confirmPanel.active = true;
    },

    // ================= 牌图 =================
    _loadCards: function () {
        var self = this;
        cc.resources.load("images/atlas/cards", cc.SpriteAtlas, function (err, atlas) {
            if (err || !atlas) {
                console.log("[SSS] 牌图加载失败", err);
                return;
            }
            self._frames = atlas;
            self.renderAll();
            // 比牌先于牌图到达: 加载完成后补绘明牌
            if (self._lastResult && self._n.resultPanel && self._n.resultPanel.active) {
                var rs = self._lastResult.results || [];
                for (var p = 0; p < self._n.resultPlayers.length; ++p) {
                    var pb = self._n.resultPlayers[p];
                    var r = rs[p];
                    if (!pb || !r) continue;
                    var arr = r.arrange || {};
                    self._fillResultRow(pb.rows.head, arr.head);
                    self._fillResultRow(pb.rows.mid, arr.mid);
                    self._fillResultRow(pb.rows.tail, arr.tail);
                }
            }
        });
    },

    // 开局动画帧(与宝宝玩法同一套 bbfx_start)
    _loadStartFx: function () {
        var self = this;
        cc.resources.loadDir("images/bbfx_start", cc.SpriteFrame, function (err, frames) {
            if (err || !frames || !frames.length) {
                console.log("[SSS] 开始动画加载失败", err);
            } else {
                frames.sort(function (a, b) {
                    var na = parseInt(a.name, 10), nb = parseInt(b.name, 10);
                    return (na || 0) - (nb || 0);
                });
                self._startFrames = frames;
            }
            self._startFramesLoaded = true;
            // 开局推送常常比帧加载先到: 加载完成后补播
            var pend = self._pendingStart;
            if (pend && cc.isValid(self.node)) {
                self._pendingStart = null;
                if (self._pendingStartTimer) { clearTimeout(self._pendingStartTimer); self._pendingStartTimer = null; }
                self._playStartFx(pend);
            }
        });
    },

    _frameOf: function (id) {
        if (!this._frames) return null;
        id = Number(id) % 52;
        if (!(id >= 0 && id < 52)) return null;
        var suit = Math.floor(id / 13);
        var rank = id % 13;
        var key = SUIT_FRAMES[suit] + RANK_NAMES[rank];
        return this._frames.getSpriteFrame(key + ".png") || this._frames.getSpriteFrame(key) || this._frames.getSpriteFrame("card_back.png");
    },

    _cardName: function (id) {
        id = Number(id) % 52;
        var suit = Math.floor(id / 13);
        var rank = id % 13;
        return SUIT_SYMBOLS[suit] + RANK_NAMES[rank];
    },

    // ================= 开局动画 =================
    _playStartFx: function (done) {
        var self = this;
        // 帧还没加载完: 记下回调, 加载完成后补播(最多等 2s, 超时直接进入摆牌)
        if (!this._startFramesLoaded) {
            this._pendingStart = done;
            if (this._pendingStartTimer) clearTimeout(this._pendingStartTimer);
            this._pendingStartTimer = setTimeout(function () {
                self._pendingStart = null;
                self._pendingStartTimer = null;
                if (done) done();
            }, 2000);
            return;
        }
        var node = this._n.fxStart;
        if (!node || !this._startFrames || !this._startFrames.length) {
            if (done) done();
            return;
        }
        this._startFxPlaying = true;
        node.active = true;
        var sp = this._spriteOf(node);
        if (sp) sp.spriteFrame = this._startFrames[0];
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("start_game.mp3");
        var idx = 0, cnt = this._startFrames.length;
        if (this._fxTimer) { clearInterval(this._fxTimer); this._fxTimer = null; }
        this._fxTimer = setInterval(function () {
            if (!cc.isValid(self.node) || !cc.isValid(node)) {
                clearInterval(self._fxTimer); self._fxTimer = null; self._startFxPlaying = false; return;
            }
            idx++;
            if (idx >= cnt) {
                clearInterval(self._fxTimer); self._fxTimer = null;
                self._startFxPlaying = false;
                node.active = false;
                if (done) done();
                return;
            }
            if (sp) sp.spriteFrame = self._startFrames[idx];
        }, 50);
    },

    // ================= 网络事件 =================
    _bindNet: function () {
        var nm = cc.vv.gameNetMgr;
        var self = this;

        this.node.on('sss_start', function (d) { self.applyStart(d && d.detail); });
        this.node.on('sss_arrange_ok', function (d) { self.onArrangeOk(d && d.detail); });
        this.node.on('sss_ready', function (d) { self.onSssReady(d && d.detail); });
        this.node.on('sss_error', function (d) {
            // 服务端校验不通过(如牌型顺序/倒水): 解锁, 让玩家改牌
            self._pendingConfirm = false;
            self._confirmed = false;
            self.showTip((d && d.detail && d.detail.msg) || "操作失败");
            self.renderAll();
        });
        this.node.on('sss_result', function (d) { self.onResult(d && d.detail); });
        this.node.on('game_over', function () {
            //兜底: 比牌推送(sss_result)若未弹出结算, 用缓存的结算数据补一次亮牌
            var cached = nm.sssResult;
            if (cached && (!self._n.resultPanel || !self._n.resultPanel.active)) self.onResult(cached);
            else self._refreshSeats();
        });
        this.node.on('game_end', function (d) { self.onGameEnd(d && d.detail); });
        this.node.on('game_num', function () { self._refreshTitle(); });
        this.node.on('user_state_changed', function () { self._refreshSeats(); });
        this.node.on('new_user', function () { self._refreshSeats(); });
        this.node.on('dissolve_notice', function () { if (self._n.dissolvePanel) self._n.dissolvePanel.active = true; });
        this.node.on('dissolve_cancel', function () { if (self._n.dissolvePanel) self._n.dissolvePanel.active = false; });
        this.node.on('exit_result', function () { self.leaveRoom(); });
        this.node.on('dispress_push', function () { self.leaveRoom(); });
        this.node.on('kick_offline', function () { self.leaveRoom(); });

        // exit_result / dispress_push 由网络层直接派发, 不走 GameNetMgr(与关牌一致)
        var sio = cc.vv.net ? cc.vv.net.sio : null;
        if (sio) {
            var onExitResult = function () { self.leaveRoom(); };
            var onDispress = function () { self.leaveRoom(); };
            sio.on('exit_result', onExitResult);
            sio.on('dispress_push', onDispress);
            this._sio = sio;
            this._sioListeners = { exit_result: onExitResult, dispress_push: onDispress };
        }

        // 监听全部就绪后再绑定: GameNetMgr 会在此刻重放场景加载期间排队的推送
        nm.dataEventHandler = this.node;

        // 兜底: 用 GameNetMgr 缓存恢复
        if (!this._playing && nm.sssStart) {
            this.applyStart(nm.sssStart, true);
        }
    },

    applyStart: function (data, resend) {
        if (!data) return;
        this._cancelReveal();
        this._dealingSec = 0;
        this._playing = true;
        this._final = false;
        this._confirmed = !!(data.confirmed || data.confirm);
        this._autoMode = false;
        this._readyMap = {};
        this._gameSeatOf = {};
        this._gameSeatTotal = (data.seats && data.seats.length) || 0;
        if (data.seats) {
            for (var gi = 0; gi < data.seats.length; ++gi) {
                var gs = data.seats[gi];
                if (gs && gs.userid != null) this._gameSeatOf[gs.userid] = gs.seatindex;
            }
        }
        this._selectRoad = "tail";
        this._conf = data.conf || this._conf;
        this._mySeat = (data.mySeat != null) ? data.mySeat : this._mySeat;
        this._cards = (data.myCards || []).slice();
        this._roads = { head: [], mid: [], tail: [] };
        var used = {};
        var self = this;
        if (data.arrange) {
            ROADS.forEach(function (road) {
                var arr = data.arrange[road] || [];
                for (var i = 0; i < arr.length; ++i) {
                    self._roads[road].push(Number(arr[i]));
                    used[Number(arr[i])] = true;
                }
            });
        }
        this._manualRoads = {
            head: this._roads.head.slice(),
            mid: this._roads.mid.slice(),
            tail: this._roads.tail.slice()
        };
        this._hand = this._cards.filter(function (c) { return !used[c]; }).sort(function (a, b) { return a - b; });
        if (this._confirmed) this._leftSec = 0;
        else this._leftSec = (data.arrangeSeconds != null) ? data.arrangeSeconds : ((this._conf && this._conf.arrangeTimeout) || 30);

        if (this._n.resultPanel) this._n.resultPanel.active = false;
        if (this._n.finalPanel) this._n.finalPanel.active = false;

        // 已有摆牌(断线重连)直接进入摆牌界面; 首次发牌先播开局动画
        var hasArrange = (this._roads.head.length + this._roads.mid.length + this._roads.tail.length) > 0;
        var playFx = !this._confirmed && !hasArrange;
        this._dealing = playFx;
        if (playFx) {
            this.showTip("\u53d1\u724c\u4e2d...");
            this.renderAll();
            this._playStartFx(function () {
                self._dealing = false;
                self.showTip("");
                self.renderAll();
            });
        } else {
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("deal.wav");
            this.showTip("");
            this.renderAll();
        }
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
        ROADS.forEach(function (r) {
            self._roads[r].forEach(function (c) { used[c] = true; });
        });
        this._hand = this._cards.filter(function (c) { return !used[c]; });
        if (data.auto) {
            this._confirmed = true;
            this._autoMode = true;
            this._leftSec = 0;
            this.showTip("\u5df2\u81ea\u52a8\u6446\u724c\u5e76\u786e\u5b9a");
        } else if (this._pendingConfirm) {
            // 服务端只校验并保存摆牌, 需要再发 sss_confirm 才算确定
            this._pendingConfirm = false;
            cc.vv.net.send("sss_confirm");
            this.showTip("\u5df2\u63d0\u4ea4\u6446\u724c,\u7b49\u5f85\u5176\u4ed6\u73a9\u5bb6");
        }
        this.renderAll();
    },

    onSssReady: function (data) {
        if (data && data.seatindex != null) this._readyMap[data.seatindex] = true;
        // 自己超时被服务端自动摆牌确定: 锁住界面等比牌
        if (data && data.auto && (data.userid == this._myUserId || data.seatindex === this._mySeat)) {
            this._confirmed = true;
            this._autoMode = true;
            this._leftSec = 0;
            this.showTip("\u8d85\u65f6\u5df2\u81ea\u52a8\u6446\u724c");
            this.renderAll();
            return;
        }
        this._refreshSeats();
    },

    // ================= 比牌结果 =================
    onResult: function (data) {
        if (!data) return;
        this._playing = false;
        this._dealing = false;
        this._leftSec = 0;
        this._refreshSeats();

        var results = data.results || [];
        this._lastResult = data;
        var myDelta = 0;
        for (var i = 0; i < results.length; ++i) {
            if (results[i] && results[i].userid == this._myUserId) myDelta = results[i].delta || 0;
        }

        // 先填好所有玩家的牌面和分数, 但全部隐藏, 稍后逐家亮牌
        var revealList = [];
        for (var p = 0; p < this._n.resultPlayers.length; ++p) {
            var pb = this._n.resultPlayers[p];
            if (!pb) continue;
            var r = results[p];
            pb.box.active = false;
            if (!r) continue;
            if (pb.name) pb.name.string = r.name || ("\u73a9\u5bb6" + ((r.seatindex || 0) + 1));
            var tags = [];
            if (r.special) tags.push(r.special);
            if (r.invalid) tags.push("\u5012\u6c34");
            if (r.gun > 0) tags.push("\u6253\u67aa\u00d7" + r.gun);
            if (r.quanleida) tags.push("\u5168\u5792\u6253");
            if (pb.tags) pb.tags.string = tags.join("  ");
            var d = r.delta || 0;
            if (pb.delta) {
                pb.delta.string = (d >= 0 ? "+" : "") + d;
                pb.delta.node.color = d >= 0 ? cc.color(120, 235, 150) : cc.color(255, 130, 130);
            }
            var arr = r.arrange || {};
            this._fillResultRow(pb.rows.head, arr.head);
            this._fillResultRow(pb.rows.mid, arr.mid);
            this._fillResultRow(pb.rows.tail, arr.tail);
            if (r.userid == this._myUserId) revealList.unshift(pb);
            else revealList.push(pb);
        }

        if (this._n.resultDetail) {
            this._n.resultDetail.string = "\u672c\u5c40\u5f97\u5206 " + (myDelta >= 0 ? "+" : "") + myDelta;
            this._n.resultDetail.node.color = myDelta >= 0 ? cc.color(120, 235, 150) : cc.color(255, 130, 130);
            this._n.resultDetail.node.active = false;
        }
        if (this._n.resultPanel) this._n.resultPanel.active = true;
        if (this._n.arrangeRoot) this._n.arrangeRoot.active = false;
        if (this._n.selfSeat) this._n.selfSeat.active = false;
        if (this._n.btnReady) this._n.btnReady.active = false;
        var btnRR = this._n.resultPanel ? this._n.resultPanel.getChildByName("btnResultReady") : null;
        if (btnRR) btnRR.active = false;
        this._refreshCountdown();

        // 亮牌比牌过程: 一家一家翻牌, 全部亮完后出分数和继续按钮
        this._cancelReveal();
        var self = this;
        var token = ++this._revealToken;
        var idx = 0;
        var total = revealList.length;
        var step = function () {
            if (!cc.isValid(self.node) || token != self._revealToken) return;
            if (idx >= revealList.length) {
                self.showTip("");
                if (self._n.resultTitle) self._n.resultTitle.string = "\u672c\u5c40\u7ed3\u7b97";
                if (self._n.resultDetail) {
                    self._n.resultDetail.string = self._compareText(data, myDelta);
                    self._n.resultDetail.node.active = true;
                }
                if (btnRR && cc.isValid(btnRR)) btnRR.active = true;
                if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX(myDelta >= 0 ? "win.wav" : "lose.wav");
                return;
            }
            var box = revealList[idx++].box;
            if (box && cc.isValid(box)) box.active = true;
            var nmNode = (box && cc.isValid(box)) ? box.getChildByName("name") : null;
            var nm = nmNode ? nmNode.getComponent(cc.Label) : null;
            if (self._n.resultTitle) self._n.resultTitle.string = "\u4eae\u724c\u6bd4\u724c " + idx + "/" + total + (nm ? ("  " + nm.string) : "");
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("deal.wav");
            self._revealTimer = setTimeout(step, 550);
        };
        if (this._n.resultTitle) this._n.resultTitle.string = "\u4eae\u724c\u6bd4\u724c 0/" + total;
        this.showTip("\u4eae\u724c\u6bd4\u724c\u4e2d...");
        step();
    },

    // 把服务端 details 拼成一行"我和每家比三道"的结果
    _compareText: function (data, myDelta) {
        var head = "\u672c\u5c40\u5f97\u5206 " + (myDelta >= 0 ? "+" : "") + myDelta;
        var details = (data && data.details) || [];
        var results = (data && data.results) || [];
        var bySeat = {};
        for (var i = 0; i < results.length; ++i) {
            var r = results[i];
            if (!r) continue;
            bySeat[r.gameSeat != null ? r.gameSeat : r.seatindex] = r;
        }
        var parts = [];
        for (var d = 0; d < details.length; ++d) {
            var it = details[d];
            var seatA = bySeat[it.a], seatB = bySeat[it.b];
            var meA = !!(seatA && seatA.userid == this._myUserId);
            var meB = !!(seatB && seatB.userid == this._myUserId);
            if (!meA && !meB) continue;
            var other = meA ? seatB : seatA;
            var oname = other ? other.name : "\u5bf9\u624b";
            var w = [];
            var roads = it.roads || [];
            for (var k = 0; k < roads.length; ++k) {
                var mine = meA ? (roads[k].win || 0) : -(roads[k].win || 0);
                var rn = roads[k].road == "head" ? "\u5934" : (roads[k].road == "mid" ? "\u4e2d" : "\u5c3e");
                w.push(rn + (mine > 0 ? "\u80dc" : (mine < 0 ? "\u8d1f" : "\u5e73")));
            }
            var txt = oname + " " + w.join("/");
            if (it.note) txt += "(" + it.note + ")";
            parts.push(txt);
        }
        var line = parts.length ? (head + "   " + parts.slice(0, 2).join("  \u00b7  ")) : head;
        console.log("[SSS] onResult delta=" + myDelta + " pairs=" + details.length + " -> " + line);
        return line;
    },

    _cancelReveal: function () {
        if (this._revealTimer) { clearTimeout(this._revealTimer); this._revealTimer = null; }
        this._revealToken = (this._revealToken || 0) + 1;
    },

    _fillResultRow: function (rowNode, ids) {
        if (!rowNode) return;
        ids = ids || [];
        var ci = 0;
        for (var i = 0; i < rowNode.children.length; ++i) {
            var child = rowNode.children[i];
            if (child.name.indexOf("card") !== 0) continue;
            if (ci >= ids.length) {
                child.active = false;
            } else {
                child.active = true;
                var sp = this._spriteOf(child);
                if (sp) sp.spriteFrame = this._frameOf(ids[ci]);
            }
            ci++;
        }
    },

    onGameEnd: function (data) {
        this._cancelReveal();
        var lines = [];
        var endinfo = (data && data.endinfo) || [];
        for (var i = 0; i < endinfo.length; ++i) {
            var e = endinfo[i];
            var s = e.score || 0;
            lines.push((e.name || "\u73a9\u5bb6") + "   " + (s >= 0 ? "+" : "") + s);
        }
        if (this._n.finalLabel) this._n.finalLabel.string = lines.join("\n");
        if (this._n.resultPanel) this._n.resultPanel.active = false;
        if (this._n.arrangeRoot) this._n.arrangeRoot.active = false;
        if (this._n.selfSeat) this._n.selfSeat.active = false;
        if (this._n.finalPanel) this._n.finalPanel.active = true;
        this._playing = false;
        this._final = true;
        this._refreshTitle();
    },

    _cardsText: function (ids) {
        var arr = [];
        for (var i = 0; i < (ids || []).length; ++i) arr.push(this._cardName(ids[i]));
        return arr.length ? arr.join(" ") : "-";
    },

    // ================= 渲染(只改数据/显隐/牌图) =================
    _refreshTitle: function () {
        var nm = cc.vv.gameNetMgr;
        var conf = (nm && nm.conf) || this._conf || {};
        if (this._n.progress) {
            this._n.progress.string = "\u5e95\u5206 " + (conf.baseScore || 1) + "   \u7b2c" + ((nm && nm.numOfGames) || 0) + "/" + (conf.maxGames || "-") + " \u5c40";
        }
        if (this._n.time) {
            var d = new Date();
            var mm = d.getMonth() + 1, dd = d.getDate(), hh = d.getHours(), mi = d.getMinutes();
            this._n.time.string = mm + "." + dd + " " + (hh < 10 ? "0" + hh : hh) + ":" + (mi < 10 ? "0" + mi : mi);
        }
    },

    _refreshSeats: function () {
        var nm = cc.vv.gameNetMgr;
        if (!nm || !nm.seats || !this._n.opps) return;
        var opps = [];
        for (var i = 0; i < nm.seats.length; ++i) {
            var s = nm.seats[i];
            if (!s || !(s.userid > 0)) continue;
            if (s.userid == this._myUserId) continue;
            opps.push(s);
        }
        // 1人→居中(opp1), 2人→左右(opp0/opp2), 3人→opp0..2, 4/5人依次用 opp0..3/opp0..4; 节点位置固定
        var keep = [[], [1], [0, 2], [0, 1, 2], [0, 1, 2, 3], [0, 1, 2, 3, 4]];
        var idxs = keep[Math.min(opps.length, 5)];
        for (var k = 0; k < this._n.opps.length; ++k) {
            var box = this._n.opps[k];
            if (!box) continue;
            var seatIndex = idxs.indexOf(k);
            var seat = (seatIndex >= 0) ? opps[seatIndex] : null;
            box.active = !!seat;
            if (!seat) continue;
            var nameLb = this._labelOf(box.getChildByName("name"));
            var stateLb = this._labelOf(box.getChildByName("state"));
            var scoreLb = this._labelOf(box.getChildByName("score"));
            var confirmed = this._readyMap[this._gameSeatOf[seat.userid]];
            var st;
            if (!this._playing) st = seat.ready ? "\u5df2\u51c6\u5907" : "\u672a\u51c6\u5907";
            else if (this._dealing) st = "\u7406\u724c\u4e2d";
            else st = confirmed ? "\u5df2\u786e\u5b9a\u6446\u724c" : "\u7406\u724c\u4e2d...";
            if (nameLb) nameLb.string = (seat.name || "\u73a9\u5bb6") + (seat.online === false ? "(\u79bb\u7ebf)" : "");
            if (stateLb) stateLb.string = st;
            if (scoreLb) scoreLb.string = "\u91d1\u5e01:" + (seat.score || 0);
            //每个座位显示13张牌背(牌背节点在场景里摆好, 这里只控制显隐)
            for (var bi = 0; bi < 13; ++bi) {
                var back = box.getChildByName("back" + bi);
                if (back) back.active = this._playing;
            }
        }
        // 自己
        var me = null;
        for (var mi = 0; mi < nm.seats.length; ++mi) {
            if (nm.seats[mi] && nm.seats[mi].userid == this._myUserId) { me = nm.seats[mi]; break; }
        }
        if (me) {
            if (this._n.selfName) this._n.selfName.string = me.name || ("\u6211");
            if (this._n.selfScore) this._n.selfScore.string = "\u91d1\u5e01:" + (me.score || 0);
            if (this._n.selfState) {
                if (this._confirmed) {
                    var cnt = 0;
                    for (var uid in this._gameSeatOf) {
                        if (this._readyMap[this._gameSeatOf[uid]]) cnt++;
                    }
                    var tot = this._gameSeatTotal || 0;
                    this._n.selfState.string = "\u5df2\u786e\u5b9a\u6446\u724c, \u7b49\u5f85\u5176\u4ed6\u73a9\u5bb6(" + cnt + "/" + tot + ")";
                } else {
                    this._n.selfState.string = this._playing ? "\u7406\u724c\u4e2d" : "\u7b49\u5f85\u4e2d";
                }
            }
        }
        this._refreshTitle();
    },

    renderAll: function () {
        this._refreshPhase();
        this._renderHand();
        this._renderRoads();
        this._refreshSeats();
        this._refreshButtons();
        this._refreshCountdown();
    },

    _refreshPhase: function () {
        //摆牌界面只要在对局中就显示(发牌动画只是盖在上面的一层), 避免动画卡住时按钮/手牌全不见
        var showArrange = this._playing && !this._final;
        if (this._n.arrangeRoot) this._n.arrangeRoot.active = showArrange;
        if (this._n.selfSeat) this._n.selfSeat.active = !showArrange;
        if (this._n.cdRoot) this._n.cdRoot.active = showArrange;
    },

    _renderHand: function () {
        var slots = this._n.handSlots || [];
        var n = this._hand.length;
        var show = !this._autoMode && !this._confirmed && !this._dealing;
        if (this._n.handRoot) this._n.handRoot.active = show;
        var start = Math.floor((HAND_SLOTS - n) / 2);
        for (var i = 0; i < slots.length; ++i) {
            var slot = slots[i];
            var src = (i >= start && i < start + n) ? this._hand[i - start] : null;
            this._handSlotIds[i] = (src == null) ? -1 : src;
            if (!slot) continue;
            slot.active = show && (src != null);
            if (src == null) continue;
            var card = slot.getChildByName("card");
            var sp = card ? card.getComponent(cc.Sprite) : null;
            if (sp) sp.spriteFrame = this._frameOf(src);
        }
    },

    _renderRoads: function () {
        var self = this;
        ROADS.forEach(function (road) {
            var info = self._n.rows && self._n.rows[road];
            if (!info) return;
            var cap = ROAD_CAP[road];
            var cards = self._roads[road] || [];
            if (info.label) info.label.string = ROAD_NAMES[road] + " " + cards.length + "/" + cap;
            if (info.labelNode) info.labelNode.color = (self._selectRoad == road) ? cc.color(255, 226, 130) : cc.color(190, 235, 215);

            var full = (cards.length == cap);
            var showType = self._autoMode && full;
            if (info.ok) info.ok.active = showType;
            if (info.typeNode) info.typeNode.active = showType;
            if (showType && info.typeLabel) {
                var hand = (road == "head") ? eval3(cards) : eval5(cards);
                info.typeLabel.string = handTypeName(road, hand);
            }
            if (info.labelNode) info.labelNode.active = !self._autoMode;
            if (info.clearBtn) info.clearBtn.active = !self._autoMode && !self._confirmed && !self._dealing;

            for (var i = 0; i < info.slots.length; ++i) {
                var slot = info.slots[i];
                var has = (i < cards.length);
                var empty = slot.getChildByName("empty");
                var card = slot.getChildByName("card");
                if (empty) empty.active = !has;
                if (card) {
                    card.active = has;
                    if (has) {
                        var sp = card.getComponent(cc.Sprite);
                        if (sp) sp.spriteFrame = self._frameOf(cards[i]);
                    }
                }
            }
        });

        // 右侧牌型统计(自动摆时显示)
        if (this._n.statPanel) this._n.statPanel.active = this._autoMode;
        if (this._autoMode) {
            var roads = [
                ["\u5934\u9053", this._roads.head, eval3],
                ["\u4e2d\u9053", this._roads.mid, eval5],
                ["\u5c3e\u9053", this._roads.tail, eval5]
            ];
            for (var si = 0; si < 3; ++si) {
                var nameLb = this._n.statLabels[si * 2];
                var typeLb = this._n.statLabels[si * 2 + 1];
                var cds = roads[si][1];
                var cap2 = (si === 0) ? 3 : 5;
                if (nameLb) nameLb.string = roads[si][0];
                if (typeLb) typeLb.string = (cds.length == cap2) ? handTypeName(ROADS[2 - si], roads[si][2](cds)) : "";
            }
        }

        // 底部牌型说明: 自动摆时把已组成的牌型点亮
        if (this._n.typeBar) {
            var hot = {};
            if (this._autoMode && this._roads.head.length == 3 && this._roads.mid.length == 5 && this._roads.tail.length == 5) {
                hot[handTypeName("head", eval3(this._roads.head))] = true;
                hot[handTypeName("mid", eval5(this._roads.mid))] = true;
                hot[handTypeName("tail", eval5(this._roads.tail))] = true;
            }
            for (var t = 0; t < this._n.typeBar.children.length; ++t) {
                var tn = this._n.typeBar.children[t];
                var tl = tn.getChildByName("lbl");
                if (!tl) continue;
                var lb = tl.getComponent(cc.Label);
                tn.color = (hot[TYPE_LEGEND[t]]) ? cc.color(255, 226, 130) : cc.color(255, 255, 255);
                if (lb) lb.node.color = tn.color;
            }
        }
    },

    _refreshButtons: function () {
        var n = this._n;
        var playing = this._playing && !this._dealing;
        var done = this._confirmed;
        //自动摆/手动摆/重新摆/确认 四个按钮在整局摆牌期间一直显示(确认后点击会提示等待)
        if (n.btnAuto) n.btnAuto.active = playing;
        if (n.btnManual) n.btnManual.active = playing;
        if (n.btnSwap) n.btnSwap.active = playing;
        if (n.btnConfirm) n.btnConfirm.active = playing && !done;
        if (n.btnReady) n.btnReady.active = !this._playing && !this._final;
    },

    _refreshCountdown: function () {
        if (!this._n.countdown) return;
        if (!this._playing || this._dealing) { this._n.countdown.string = ""; return; }
        if (this._confirmed) { this._n.countdown.string = "\u5df2\u5b9a"; return; }
        this._n.countdown.string = Math.max(0, this._leftSec);
    },

    _tick: function () {
        this._refreshTitle();
        // 发牌动画兜底: 卡住超过6秒直接进入摆牌, 避免按钮/倒计时一直不出现
        if (this._dealing) {
            this._dealingSec = (this._dealingSec || 0) + 1;
            if (this._dealingSec >= 6) {
                this._dealing = false;
                this._dealingSec = 0;
                this.showTip("");
                this.renderAll();
            }
            return;
        }
        this._dealingSec = 0;
        if (!this._playing || this._confirmed) return;
        if (this._leftSec > 0) this._leftSec--;
        this._refreshCountdown();
        if (this._leftSec <= 0) this._refreshSeats();
    },

    // ================= 操作 =================
    showTip: function (msg) {
        if (!this._n.tip) return;
        this._n.tip.string = msg || "";
        if (this._tipTimer) { clearTimeout(this._tipTimer); this._tipTimer = null; }
        if (msg) {
            var self = this;
            this._tipTimer = setTimeout(function () {
                if (self._n.tip) self._n.tip.string = "";
            }, 2500);
        }
    },

    //已确认摆牌后点了任何操作都给提示, 避免"点了没反应"
    _locked: function () {
        if (this._confirmed) {
            this.showTip("\u5df2\u786e\u8ba4\u6446\u724c, \u7b49\u5f85\u5176\u4ed6\u73a9\u5bb6\u2026");
            return true;
        }
        return false;
    },

    _nextRoad: function () {
        if (this._roads.tail.length < ROAD_CAP.tail) return "tail";
        if (this._roads.mid.length < ROAD_CAP.mid) return "mid";
        if (this._roads.head.length < ROAD_CAP.head) return "head";
        return null;
    },

    onTapHand: function (id) {
        if (this._locked()) return;
        if (!this._playing || this._dealing || this._autoMode) return;
        var road = this._nextRoad();
        if (!road) { this.showTip("\u5df2\u6446\u6ee1\u4e09\u9053\u4e86"); return; }
        var ix = this._hand.indexOf(id);
        if (ix < 0) return;
        this._hand.splice(ix, 1);
        this._roads[road].push(id);
        this._selectRoad = this._nextRoad() || "head";
        this.renderAll();
    },

    onTapRoadCard: function (road, id) {
        if (this._locked()) return;
        if (!this._playing || this._dealing) return;
        if (this._autoMode) { this.showTip("\u5148\u70b9\u300c\u624b\u52a8\u6446\u724c\u300d\u624d\u80fd\u53d6\u56de"); return; }
        var arr = this._roads[road];
        var ix = arr.indexOf(id);
        if (ix < 0) return;
        arr.splice(ix, 1);
        this._hand.push(id);
        this._hand.sort(function (a, b) { return a - b; });
        this._selectRoad = road;
        this.renderAll();
    },

    // 某道 X: 该道牌全部退回手牌
    onClearRoad: function (road) {
        if (this._locked()) return;
        if (!this._playing || this._dealing || this._autoMode) return;
        var arr = this._roads[road] || [];
        if (!arr.length) return;
        for (var i = 0; i < arr.length; ++i) this._hand.push(arr[i]);
        this._roads[road] = [];
        this._hand.sort(function (a, b) { return a - b; });
        this._selectRoad = road;
        this.renderAll();
    },

    // 自动理牌: 本地计算最优搭配(可再切回手动)
    onAuto: function () {
        if (this._locked()) return;
        if (!this._playing || this._dealing) return;
        if (this._cards.length < 13) { this.showTip("\u724c\u672a\u53d1\u5b8c"); return; }
        this._manualRoads = {
            head: this._roads.head.slice(),
            mid: this._roads.mid.slice(),
            tail: this._roads.tail.slice()
        };
        var best = autoArrange(this._cards.slice());
        if (!best) { this.showTip("\u81ea\u52a8\u7406\u724c\u5931\u8d25"); return; }
        this._roads = best;
        this._hand = [];
        this._autoMode = true;
        this._selectRoad = "tail";
        this.showTip("\u5df2\u81ea\u52a8\u7406\u724c, \u53ef\u70b9\u786e\u8ba4\u51fa\u724c");
        this.renderAll();
    },

    // 手动理牌: 回到自动前的摆法
    onManual: function () {
        if (this._locked()) return;
        if (!this._playing || this._dealing) return;
        if (!this._autoMode) return; //已经是手动摆牌, 不覆盖当前手动摆的牌
        this._autoMode = false;
        this._roads = {
            head: (this._manualRoads.head || []).slice(),
            mid: (this._manualRoads.mid || []).slice(),
            tail: (this._manualRoads.tail || []).slice()
        };
        var used = {};
        var self = this;
        ROADS.forEach(function (r) { self._roads[r].forEach(function (c) { used[c] = true; }); });
        this._hand = this._cards.filter(function (c) { return !used[c]; }).sort(function (a, b) { return a - b; });
        this.renderAll();
    },

    // 重摆: 13 张全部退回手牌
    onSwap: function () {
        if (this._locked()) return;
        if (!this._playing || this._dealing) return;
        this._autoMode = false;
        this._roads = { head: [], mid: [], tail: [] };
        this._hand = this._cards.slice().sort(function (a, b) { return a - b; });
        this._selectRoad = "tail";
        this.renderAll();
    },

    onConfirm: function () {
        if (this._locked()) return;
        if (!this._playing) return;
        if (this._hand.length > 0) {
            this.showTip("\u8bf7\u628a 13 \u5f20\u724c\u5168\u90e8\u6446\u5230\u4e09\u9053\u4e2d");
            return;
        }
        this._pendingConfirm = true;
        cc.vv.net.send("sss_arrange", {
            head: this._roads.head,
            mid: this._roads.mid,
            tail: this._roads.tail
        });
        this._confirmed = true;
        this.showTip("\u6b63\u5728\u63d0\u4ea4\u6446\u724c...");
        this.renderAll();
    },

    onReady: function () {
        var nm = cc.vv && cc.vv.gameNetMgr;
        if (nm && nm.maxNumOfGames > 0 && nm.numOfGames >= nm.maxNumOfGames) {
            this.showTip("\u5df2\u662f\u6700\u540e\u4e00\u5c40");
            return;
        }
        cc.vv.net.send("ready");
        this.showTip("\u5df2\u51c6\u5907,\u7b49\u5f85\u5176\u4ed6\u73a9\u5bb6");
        if (this._n.btnReady) this._n.btnReady.active = false;
        if (this._n.resultPanel) this._n.resultPanel.active = false;
    },

    onExit: function () {
        var self = this;
        var doSend = function () {
            cc.vv.net.send("exit");
            setTimeout(function () {
                if (cc.isValid(self.node) && !self._leaving) {
                    if (cc.vv.gameNetMgr.clearRoomState) cc.vv.gameNetMgr.clearRoomState();
                    self.leaveRoom();
                }
            }, 2000);
        };
        if (this._final) {
            cc.vv.net.send("leave_room");
            setTimeout(function () { self.leaveRoom(); }, 500);
            return;
        }
        this._confirm("\u662f\u5426\u786e\u5b9a\u9000\u51fa\u623f\u95f4?", doSend);
    },

    onDissolve: function () {
        var self = this;
        var doSend = function () {
            if (cc.vv.gameNetMgr.gamestate == "begin") {
                cc.vv.net.send("dissolve_request");
                self.showTip("\u5df2\u53d1\u8d77\u89e3\u6563\u7533\u8bf7,\u7b49\u5f85\u5176\u4ed6\u73a9\u5bb6\u54cd\u5e94");
            } else {
                cc.vv.net.send("dispress");
            }
        };
        this._confirm("\u89e3\u6563\u623f\u95f4\u5c06\u7ed3\u675f\u672c\u5c40,\u662f\u5426\u786e\u5b9a\u89e3\u6563?", doSend);
    },

    leaveRoom: function () {
        if (this._leaving) return;
        this._leaving = true;
        var curScene = cc.director.getScene ? cc.director.getScene() : null;
        var curName = (curScene && curScene.name) ? curScene.name : "";
        if (curName === "hall" || curName === "club") return;
        if (cc.vv.fromClub || cc.vv.fromClubId) cc.director.loadScene("club");
        else cc.director.loadScene("hall");
    }
});
