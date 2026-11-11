// 十三水(2人/4人) 牌桌
// 界面全部在 mjgame_sss 场景节点中(本脚本不创建/不布局任何控件, 只做数据绑定与刷新)
// 协议:
//   sss_start_push {myCards, mySeat, seats, arrangeDeadline, arrangeSeconds, confirm, arrange, conf}
//   sss_arrange_ok_push {head, mid, tail, auto}
//   sss_ready_push {seatindex, userid}
//   sss_error_push {msg}
//   sss_result_push {results:[{userid,name,seatindex,arrange,special,invalid,quanleida,gun,delta,totalscore}], baseScore}
//   上行: sss_arrange {head,mid,tail} | {auto:true}, sss_confirm, ready, exit, dissolve_request ...

var SUIT_FRAMES = ["Spade", "Heart", "Club", "Diamond"];
var SUIT_SYMBOLS = ["\u2660", "\u2665", "\u2663", "\u2666"];
var RANK_NAMES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
var ROAD_CAP = { head: 3, mid: 5, tail: 5 };
var ROAD_NAMES = { head: "\u5934\u9053", mid: "\u4e2d\u9053", tail: "\u5c3e\u9053" };
var ROADS = ["tail", "mid", "head"];
var HAND_SLOTS = 13;

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
        this._hand = [];
        this._handSlotIds = [];
        this._cards = [];
        this._conf = null;
        this._roads = { head: [], mid: [], tail: [] };
        this._confirmed = false;
        this._selectRoad = "tail";
        this._frames = null;
        this._leftSec = 0;
        this._myUserId = (cc.vv && cc.vv.userMgr) ? cc.vv.userMgr.userId : 0;
        this._n = {};
        this._bindUI();
        this._bindNet();
        this._loadCards();
        this.renderAll();
        if (cc.vv.audioMgr) cc.vv.audioMgr.playBGM("bgFight.mp3");
        this.schedule(this._tick, 1);
    },

    onDestroy: function () {
        this.unschedule(this._tick);
        if (this._tipTimer) { clearTimeout(this._tipTimer); this._tipTimer = null; }
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

    _bindTap: function (node, cb) {
        if (!node) return;
        node.on(cc.Node.EventType.TOUCH_START, function () { node.setScale(0.96, 0.96); });
        node.on(cc.Node.EventType.TOUCH_CANCEL, function () { node.setScale(1, 1); });
        node.on(cc.Node.EventType.TOUCH_END, function () {
            node.setScale(1, 1);
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("btnClick.mp3");
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

        n.title = this._labelOf(this._find("titleLabel"));
        n.tip = this._labelOf(this._find("tipLabel"));
        n.countdown = this._labelOf(this._find("countdownLabel"));
        n.progress = this._labelOf(this._find("progressLabel"));
        n.oppRoot = this._find("oppRoot");
        n.opps = [this._find("opp0"), this._find("opp1"), this._find("opp2")];

        n.rows = {};
        ROADS.forEach(function (road) {
            var row = self._find(road + "Row");
            if (!row) return;
            var labelNode = row.getChildByName(road + "Label");
            var slotsWrap = row.getChildByName(road + "Slots");
            n.rows[road] = {
                row: row,
                label: self._labelOf(labelNode),
                labelNode: labelNode,
                slots: slotsWrap ? slotsWrap.children : []
            };
        });

        var handRoot = this._find("handRoot");
        n.handSlots = handRoot ? handRoot.children : [];

        n.btnAuto = this._find("btnAuto");
        n.btnConfirm = this._find("btnConfirm");
        n.btnReady = this._find("btnReady");

        n.resultPanel = this._find("resultPanel");
        n.resultLabel = n.resultPanel ? this._labelOf(n.resultPanel.getChildByName("resultLabel")) : null;
        n.finalPanel = this._find("finalPanel");
        n.finalLabel = n.finalPanel ? this._labelOf(n.finalPanel.getChildByName("finalLabel")) : null;
        n.dissolvePanel = this._find("dissolvePanel");
        n.confirmPanel = this._find("confirmPanel");
        n.confirmLabel = n.confirmPanel ? this._labelOf(n.confirmPanel.getChildByName("confirmLabel")) : null;

        // 按钮(场景中已摆好位置/尺寸)
        this._bindTap(this._find("btnExit"), this.onExit.bind(this));
        this._bindTap(this._find("btnDissolve"), this.onDissolve.bind(this));
        this._bindTap(n.btnAuto, this.onAuto.bind(this));
        this._bindTap(n.btnConfirm, this.onConfirm.bind(this));
        this._bindTap(n.btnReady, this.onReady.bind(this));

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
        slot.on(cc.Node.EventType.TOUCH_END, function () {
            var id = self._handSlotIds[index];
            if (id == null || id < 0) return;
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("select.mp3");
            self.onTapHand(id);
        });
    },

    _bindRoadSlot: function (slot, road, index) {
        var self = this;
        if (!slot) return;
        slot.on(cc.Node.EventType.TOUCH_END, function () {
            var cards = self._roads[road] || [];
            var id = cards[index];
            if (id == null) return;
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("select.mp3");
            self.onTapRoadCard(road, id);
        });
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
        });
    },

    _frameOf: function (id) {
        if (!this._frames) return null;
        id = Number(id);
        if (!(id >= 0 && id < 52)) return null;
        var suit = Math.floor(id / 13);
        var rank = id % 13;
        var key = SUIT_FRAMES[suit] + RANK_NAMES[rank];
        // 图集帧名带 .png 后缀(TexturePacker), 两种都试
        return this._frames.getSpriteFrame(key + ".png") || this._frames.getSpriteFrame(key) || this._frames.getSpriteFrame("card_back.png");
    },

    _cardName: function (id) {
        id = Number(id);
        var suit = Math.floor(id / 13);
        var rank = id % 13;
        return SUIT_SYMBOLS[suit] + RANK_NAMES[rank];
    },

    // ================= 网络事件 =================
    _bindNet: function () {
        var nm = cc.vv.gameNetMgr;
        var self = this;

        this.node.on('sss_start', function (d) { self.applyStart(d && d.detail); });
        this.node.on('sss_arrange_ok', function (d) { self.onArrangeOk(d && d.detail); });
        this.node.on('sss_ready', function (d) { self.onSssReady(d && d.detail); });
        this.node.on('sss_error', function (d) { self.showTip((d && d.detail && d.detail.msg) || "操作失败"); });
        this.node.on('sss_result', function (d) { self.onResult(d && d.detail); });
        this.node.on('game_over', function () { self._refreshSeats(); });
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
        this._playing = true;
        this._final = false;
        this._confirmed = !!data.confirmed;
        this._selectRoad = "tail";
        this._conf = data.conf || this._conf;
        this._cards = (data.myCards || []).slice();
        this._roads = { head: [], mid: [], tail: [] };
        var used = {};
        if (data.arrange) {
            var self = this;
            ROADS.forEach(function (road) {
                var arr = data.arrange[road] || [];
                for (var i = 0; i < arr.length; ++i) {
                    self._roads[road].push(Number(arr[i]));
                    used[Number(arr[i])] = true;
                }
            });
        }
        this._hand = this._cards.filter(function (c) { return !used[c]; }).sort(function (a, b) { return a - b; });
        if (this._confirmed) this._leftSec = 0;
        else this._leftSec = (data.arrangeSeconds != null) ? data.arrangeSeconds : ((this._conf && this._conf.arrangeTimeout) || 30);
        if (this._n.resultPanel) this._n.resultPanel.active = false;
        if (this._n.finalPanel) this._n.finalPanel.active = false;
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("deal.mp3");
        this.showTip("");
        this.renderAll();
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
            this._leftSec = 0;
            this.showTip("已自动摆牌并确定");
        }
        this.renderAll();
    },

    onSssReady: function (data) {
        this._refreshSeats();
    },

    onResult: function (data) {
        if (!data) return;
        this._playing = false;
        this._leftSec = 0;
        this._refreshSeats();
        var lines = [];
        var results = data.results || [];
        var myDelta = 0;
        for (var i = 0; i < results.length; ++i) {
            var r = results[i];
            if (!r) continue;
            if (r.userid == this._myUserId) myDelta = r.delta || 0;
            var head = r.arrange ? r.arrange.head : [];
            var mid = r.arrange ? r.arrange.mid : [];
            var tail = r.arrange ? r.arrange.tail : [];
            var tag = "";
            if (r.special) tag += " \u3010" + r.special + "\u3011";
            if (r.invalid) tag += " \u3010\u5012\u6c34\u3011";
            if (r.gun > 0) tag += " 打枪\u00d7" + r.gun;
            if (r.quanleida) tag += " 全垒打";
            var d = r.delta || 0;
            lines.push((r.name || ("\u73a9\u5bb6" + (r.seatindex + 1))) + tag + "  " + (d >= 0 ? "+" : "") + d);
            lines.push("  头: " + this._cardsText(head) + "   中: " + this._cardsText(mid) + "   尾: " + this._cardsText(tail));
        }
        if (this._n.resultLabel) this._n.resultLabel.string = lines.join("\n");
        if (this._n.resultPanel) this._n.resultPanel.active = true;
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX(myDelta >= 0 ? "win.mp3" : "lose.mp3");
        this.renderAll();
    },

    onGameEnd: function (data) {
        var lines = [];
        var endinfo = (data && data.endinfo) || [];
        for (var i = 0; i < endinfo.length; ++i) {
            var e = endinfo[i];
            var s = e.score || 0;
            lines.push((e.name || "玩家") + "   " + (s >= 0 ? "+" : "") + s);
        }
        if (this._n.finalLabel) this._n.finalLabel.string = lines.join("\n");
        if (this._n.resultPanel) this._n.resultPanel.active = false;
        if (this._n.finalPanel) this._n.finalPanel.active = true;
        this._playing = false;
        this._final = true;
        this.renderAll();
    },

    _cardsText: function (ids) {
        var arr = [];
        for (var i = 0; i < (ids || []).length; ++i) arr.push(this._cardName(ids[i]));
        return arr.length ? arr.join(" ") : "-";
    },

    // ================= 渲染(只改数据/显隐/牌图) =================
    _refreshTitle: function () {
        if (!this._n.progress) return;
        var nm = cc.vv.gameNetMgr;
        var conf = (nm && nm.conf) || this._conf || {};
        var txt = "底分 " + (conf.baseScore || 1) + "   第" + ((nm && nm.numOfGames) || 0) + "/" + (conf.maxGames || "-") + " 局";
        this._n.progress.string = txt;
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
        // 1人→居中(opp1), 2人→左右(opp0/opp2), 3人→全部; 节点位置固定
        var idxs = opps.length <= 1 ? [1] : (opps.length === 2 ? [0, 2] : [0, 1, 2]);
        for (var k = 0; k < this._n.opps.length; ++k) {
            var box = this._n.opps[k];
            if (!box) continue;
            var seatIndex = idxs.indexOf(k);
            var seat = (seatIndex >= 0) ? opps[seatIndex] : null;
            box.active = !!seat;
            if (!seat) continue;
            var nameLb = this._labelOf(box.getChildByName("name"));
            var stateLb = this._labelOf(box.getChildByName("state"));
            var confirmed = nm.sssConfirmed && nm.sssConfirmed[seat.userid];
            var st = !this._playing ? (seat.ready ? "已准备" : "未准备") : (confirmed ? "已确定摆牌" : "摆牌中...");
            if (nameLb) nameLb.string = (seat.name || "玩家") + (seat.online === false ? "(离线)" : "");
            if (stateLb) stateLb.string = st + "   \u5206:" + (seat.score || 0);
        }
        this._refreshTitle();
    },

    renderAll: function () {
        this._renderHand();
        this._renderRoads();
        this._refreshSeats();
        this._refreshButtons();
        this._refreshCountdown();
    },

    _renderHand: function () {
        var slots = this._n.handSlots || [];
        var n = this._hand.length;
        var start = Math.floor((HAND_SLOTS - n) / 2);
        for (var i = 0; i < slots.length; ++i) {
            var slot = slots[i];
            var src = (i >= start && i < start + n) ? this._hand[i - start] : null;
            this._handSlotIds[i] = (src == null) ? -1 : src;
            if (!slot) continue;
            slot.active = (src != null);
            if (src == null) continue;
            var card = slot.getChildByName("card");
            var sp = card ? card.getComponent(cc.Sprite) : null;
            if (sp) sp.spriteFrame = this._frameOf(src);
        }
    },

    _renderRoads: function () {
        var self = this;
        ROADS.forEach(function (road) {
            var rowInfo = self._n.rows && self._n.rows[road];
            if (!rowInfo) return;
            var cap = ROAD_CAP[road];
            var cards = self._roads[road] || [];
            if (rowInfo.label) rowInfo.label.string = ROAD_NAMES[road] + " " + cards.length + "/" + cap;
            if (rowInfo.labelNode) rowInfo.labelNode.color = (self._selectRoad == road) ? cc.color(255, 226, 130) : cc.color(190, 235, 215);
            for (var i = 0; i < rowInfo.slots.length; ++i) {
                var slot = rowInfo.slots[i];
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
    },

    _refreshButtons: function () {
        var playing = this._playing;
        var done = this._confirmed;
        if (this._n.btnAuto) this._n.btnAuto.active = playing && !done;
        if (this._n.btnConfirm) this._n.btnConfirm.active = playing && !done;
        if (this._n.btnReady) this._n.btnReady.active = !playing;
    },

    _refreshCountdown: function () {
        if (!this._n.countdown) return;
        if (!this._playing) { this._n.countdown.string = ""; return; }
        if (this._confirmed) { this._n.countdown.string = "已确定"; return; }
        this._n.countdown.string = "摆牌剩余 " + Math.max(0, this._leftSec) + "s";
    },

    _tick: function () {
        if (!this._playing || this._confirmed) return;
        if (this._leftSec > 0) this._leftSec--;
        this._refreshCountdown();
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

    _nextRoad: function () {
        if (this._roads.tail.length < ROAD_CAP.tail) return "tail";
        if (this._roads.mid.length < ROAD_CAP.mid) return "mid";
        if (this._roads.head.length < ROAD_CAP.head) return "head";
        return null;
    },

    onTapHand: function (id) {
        if (!this._playing || this._confirmed) return;
        var road = this._nextRoad();
        if (!road) { this.showTip("已摆满三道了"); return; }
        var ix = this._hand.indexOf(id);
        if (ix < 0) return;
        this._hand.splice(ix, 1);
        this._roads[road].push(id);
        this._selectRoad = this._nextRoad() || "head";
        this.renderAll();
    },

    onTapRoadCard: function (road, id) {
        if (!this._playing || this._confirmed) return;
        var arr = this._roads[road];
        var ix = arr.indexOf(id);
        if (ix < 0) return;
        arr.splice(ix, 1);
        this._hand.push(id);
        this._hand.sort(function (a, b) { return a - b; });
        this._selectRoad = road;
        this.renderAll();
    },

    onAuto: function () {
        if (!this._playing || this._confirmed) return;
        cc.vv.net.send("sss_arrange", { auto: true });
        this.showTip("正在自动摆牌...");
    },

    onConfirm: function () {
        if (!this._playing || this._confirmed) return;
        if (this._hand.length > 0) {
            this.showTip("请把 13 张牌全部摆到三道中");
            return;
        }
        cc.vv.net.send("sss_arrange", {
            head: this._roads.head,
            mid: this._roads.mid,
            tail: this._roads.tail
        });
        this._confirmed = true;
        this.showTip("已提交摆牌,等待其他玩家");
        this.renderAll();
    },

    onReady: function () {
        var nm = cc.vv && cc.vv.gameNetMgr;
        if (nm && nm.maxNumOfGames > 0 && nm.numOfGames >= nm.maxNumOfGames) {
            this.showTip("已是最后一局");
            return;
        }
        cc.vv.net.send("ready");
        this.showTip("已准备,等待其他玩家");
        if (this._n.btnReady) this._n.btnReady.active = false;
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
        this._confirm("是否确定退出房间?", doSend);
    },

    onDissolve: function () {
        var self = this;
        var doSend = function () {
            if (cc.vv.gameNetMgr.gamestate == "begin") {
                cc.vv.net.send("dissolve_request");
                self.showTip("已发起解散申请,等待其他玩家响应");
            } else {
                cc.vv.net.send("dispress");
            }
        };
        this._confirm("解散房间将结束本局,是否确定解散?", doSend);
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
