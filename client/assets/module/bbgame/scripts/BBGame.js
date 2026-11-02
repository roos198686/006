// 宝宝(6张) 客户端 —— 免摆/手摆 两种玩法共用
// 场景: mjgame_bb_mian.fire / mjgame_bb_shou.fire (免摆/手摆两个独立场景), 本脚本共用
// 牌 id: (rank-2)*4+suit, rank 2..14(JQKA=11..14), suit 0黑1红2梅3方
// 服务端协议:
//   bb_start_push  {maxPlayers,seats[{userid,name,seatindex,roomSeatIndex,count,arranged}],mySeat,
//                   myCards[6],bankerSeat,bankerMode,gameType,phase,arrangeDeadline,conf}
//   bb_reveal_push 免摆 {players:[{seat,cards[6],groups[3][2],typeKey,typeName,rate}],gameType}
//                  手摆 {players:[{seat,daos[3]{cards[2],desc,rate},wulong,auto}],gameType}
//   game_over_push {results[roomSeatIndex]={userid,name,delta,totalscore,holds,typeKey/typeName/rate,
//                   daos/wulong},bankerSeat,bankerMode,gameType,details,endinfo?}
// 牌型特效音效: 从美术提供的特效视频里提取(裁到特效时长); 手牌聚焦不配音
var BB_FX_SFX = { fire: "bbfx_fire.mp3", bomb: "bbfx_bomb.mp3", pairs: "bbfx_pairs.mp3", nine: "bbfx_pairs.mp3" };
cc.Class({
    extends: cc.Component,

    properties: {},

    // 6 个座位槽在场景中的固定摆位(bbSeat0~5), 按人数选用哪几个槽, 不改坐标
    seatLayout: function (total) {
        var L = {
            2: [0, 3],
            3: [0, 1, 4],
            4: [0, 1, 3, 4],
            5: [0, 1, 2, 3, 4],
            6: [0, 1, 2, 3, 4, 5]
        };
        return L[total] || L[6];
    },

    // ===== 工具 =====
    findNode: function (root, name) {
        if (!root) return null;
        if (root.name == name) return root;
        var cs = root.children;
        for (var i = 0; i < cs.length; ++i) {
            var r = this.findNode(cs[i], name);
            if (r) return r;
        }
        return null;
    },
    setStr: function (node, s) { if (node) { var lb = node.getComponent(cc.Label); if (lb) lb.string = s; } },
    // 结算文字样式: 本局结算明牌行多, 用场景默认字号; 整场总结算只有总分几行, 用更小字号
    _setSettleContentStyle: function (fontSize, lineHeight, y) {
        var node = this._n.resultContent;
        if (!node || !cc.isValid(node)) return;
        var lb = node.getComponent(cc.Label);
        if (lb) { lb.fontSize = fontSize; lb.lineHeight = lineHeight; }
        if (y != null) node.y = y;
    },
    // 只挂点击回调, 不改按钮外观: 不加 Button 组件, 也不让已有 Button 用 COLOR 过渡覆盖 Sprite 的
    // 颜色(否则场景里调好的蓝色底图会被运行时重置成白色, 不同玩家看到的按钮就不一样)
    bindButton: function (node, handler, target) {
        if (!node) return;
        var btn = node.getComponent(cc.Button);
        if (btn) btn.transition = cc.Button.Transition.NONE;
        node.off(cc.Node.EventType.TOUCH_END);
        node.on(cc.Node.EventType.TOUCH_END, function () { handler.call(target); });
    },
    rankOf: function (id) { return Math.floor(id / 4) + 2; },
    suitOf: function (id) { return id % 4; },
    // 手摆算点: 2..10面值, JQK=0, A=1
    dianVal: function (r) { if (r >= 11 && r <= 13) return 0; return r == 14 ? 1 : r; },
    cardFrameKey: function (id) {
        var suits = ["Spade", "Heart", "Club", "Diamond"];
        var rankNames = { 11: "J", 12: "Q", 13: "K", 14: "A" };
        var r = this.rankOf(id);
        return suits[this.suitOf(id)] + (rankNames[r] || ("" + r));
    },
    frameOf: function (id) {
        if (!this._cardFrames) return null;
        return this._cardFrames[this.cardFrameKey(id)] || null;
    },
    loadCardFrames: function () {
        var self = this;
        this._cardFrames = {};
        cc.resources.load("images/atlas/cards", cc.SpriteAtlas, function (err, atlas) {
            if (err || !atlas) { console.log("[BB] load cards atlas failed", err); return; }
            function get(nm) { return atlas.getSpriteFrame(nm + ".png") || atlas.getSpriteFrame(nm); }
            var suits = ["Spade", "Heart", "Club", "Diamond"];
            var ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
            for (var i = 0; i < suits.length; ++i) {
                for (var j = 0; j < ranks.length; ++j) {
                    var nm = suits[i] + ranks[j];
                    var fr = get(nm);
                    if (fr) self._cardFrames[nm] = fr;
                }
            }
            self._cardBack = get("card_back");
            // 图集异步加载完成: 补填已打开的弹窗/牌面(否则先到的推送会显示空白牌)
            if (self._confirmRoot && self._confirmRoot.active) self._fillConfirmCards();
            if (self._arrangeRoot && self._arrangeRoot.active) self._renderArrange();
            // 结算明牌先于图集加载: 加载完成后补绘一次
            if (self._n.resultPanel && self._n.resultPanel.active && self._lastResults) {
                var ok = self._renderSettleCards(self._lastResults, self._lastDetails);
                if (self._n.resultContent) self._n.resultContent.active = !ok;
            }
            if (self._started) self.renderCards();
        });
    },

    // 预加载特效帧: 同花顺火箭升空(bbfx_fire 288x512) + 炸弹爆炸(bbfx_bomb 512x288) + 3对/3组9玩具枪(bbfx_pairs 512x288)
    loadFireFrames: function () {
        var self = this;
        function loadDir(dir, key) {
            cc.resources.loadDir(dir, cc.SpriteFrame, function (err, arr) {
                if (err || !arr || !arr.length) { console.log("[BB] load " + dir + " failed", err); return; }
                arr.sort(function (a, b) { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0); });
                self[key] = arr;
            });
        }
        loadDir("images/bbfx_fire", "_fireFrames");
        loadDir("images/bbfx_bomb", "_bombFrames");
        loadDir("images/bbfx_pairs", "_pairsFrames");
    },

    onLoad: function () {
        var nm = cc.vv.gameNetMgr;

        this._n = {};
        this._seatNodes = [];
        this._revealByGs = {};
        this._revealCounts = null;
        this._revealDone = false;
        this._revealRunning = false;
        this._started = false;
        this._final = false;
        this._leaving = false;
        this._arranging = false;
        this._arrangeRemain = 0;
        this._arrangeRemainAt = 0;
        this._daoSel = [[null, null], [null, null], [null, null]];
        this._arrangeRows = null;
        this._arrangeRoot = null;
        this._confirmRoot = null;
        this._confirmRemain = 0;
        this._confirmRemainAt = 0;
        this._confirmCount = 0;
        this._confirmAutoShown = false;   // 免摆弹窗: 点了「免摆」按钮后才在上排摆最大牌型
        this._confirmMoving = false;      // 免摆上移动画进行中: 期间确认按钮不可点
        this._cdTimer = null;
        this._dealTimer = null;
        this._dealing = false;
        this._slotHome = null;
        this._cdLabel = null;
        this._myContinued = false;
        this._shufflePending = false;   // 点了洗牌, 等全员确认后再播洗牌动画
        this._shuffleRoot = null;       // 场景里的整副牌背洗牌节点(bbShuffleAnim)
        this._watching = false;         // 本局没参与, 只观看亮牌过程, 不弹牌型/结算弹窗
        this._mySeat = 0;
        this._total = 2;
        this._gameType = null;
        this._exitPending = false;      // 本局进行中点了退出: 等本局结算完成后再退
        this._settle1Done = true;       // 本局结算是否已看完(整场最后一局要先看完本局再弹总结算)
        this._summaryShown = false;     // 总结算弹窗是否已弹出
        this._roomEnd = false;          // 结算后房间人数不足, 无法再续局: 弹窗显示「退出房间」
        this._backTimer = null;         // 被请出/断线后返回来源页的兜底定时器
        this._endDetail = null;         // 整场结束推送(endinfo 总分), 等本局结算关掉后使用
        this._settleClosedAt = 0;       // 本局结算关闭时刻: 用于统计到下一局开局的耗时
        // 房间内「设置」面板的退出房间按钮统一走这里(见 setting.js): 本局未结束则排队到结算后
        var selfHook = this;
        if (cc.vv) cc.vv.bbExitHook = function () { selfHook.onExitRequest(); };
        //房间音乐(大厅音乐由登录/大厅场景负责,进入牌桌切换到房间音乐)
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playBGM("bgFight.mp3");

        try {
            this._findNodes();
            if (this._n.prepare && this._n.game) {
                this._n.prepare.setSiblingIndex(this._n.game.getSiblingIndex() + 1);
            }
            this._buildSeatContainers();
            this._buildArrangeUI();
            this._buildConfirmUI();
            this._shuffleRoot = this.findNode(this.node, "bbShuffleAnim");
            if (this._shuffleRoot) this._shuffleRoot.active = false;
            this.loadCardFrames();
            this.loadFireFrames();
            this._preloadBackScene();   // 提前加载退出要回的场景, 退出时不再现加载导致卡一下
            this._bindButtons();
            this._bindEvents();
            // UI全部就绪后再绑定dataEventHandler: 排队的重连补发事件此时才重放, 恢复流程不再因节点未初始化被吞
            if (nm) nm.dataEventHandler = this.node;
            this.refreshFromState();
        } catch (e) {
            console.error("[BB] onLoad failed: " + (e && e.message || e) + " @ " + (e && e.stack || ""));
        }
        console.log("[BB] onLoad done");
    },

    _findNodes: function () {
        var n = this._n;
        var root = this.node;
        n.infobar = this.findNode(root, "infobar");
        n.titleLabel = this.findNode(n.infobar, "titleLabel");
        n.prepare = this.findNode(root, "prepare");
        n.game = this.findNode(root, "game");
        n.up = this.findNode(n.game, "up");
        n.tipLabel = this.findNode(n.game, "tipLabel");
        n.countdownLabel = this.findNode(n.game, "countdownLabel");

        // 按钮
        n.readyBtn = this.findNode(n.prepare, "readyBtn");
        n.exitBtn = this.findNode(n.prepare, "exitBtn");
        n.dissolveBtn = this.findNode(n.prepare, "dissolveBtn");

        // 结算(settlePanel 及其子节点)
        n.resultPanel = this.findNode(root, "settlePanel");
        n.resultTitle = this.findNode(n.resultPanel, "settleTitle");
        n.resultContent = this.findNode(n.resultPanel, "settleContent");
        // 记录场景里结算文字的字号/位置: 本局结算用场景默认值, 整场总结算行数少, 改用更小字号
        var rcLabel = n.resultContent ? n.resultContent.getComponent(cc.Label) : null;
        this._settleFontSize = rcLabel ? rcLabel.fontSize : 32;
        this._settleLineHeight = rcLabel ? rcLabel.lineHeight : 46;
        this._settleContentY = n.resultContent ? n.resultContent.y : 108;
        n.resultCloseBtn = this.findNode(n.resultPanel, "settleAgainBtn");
        n.resultExitBtn = this.findNode(n.resultPanel, "settleExitBtn");
        n.resultCloseLabel = this.findNode(n.resultCloseBtn, "settleAgainBtnLabel");
        n.resultExitLabel = this.findNode(n.resultExitBtn, "settleExitBtnLabel");
        n.resultList = this.findNode(n.resultPanel, "result_list");
        n.settleWin = this.findNode(n.resultPanel, "win");
        n.settleLose = this.findNode(n.resultPanel, "lose");
        n.btnReady = this.findNode(n.resultPanel, "btnReady");

        // 解散投票
        n.dissolvePanel = this.findNode(root, "dissolvePanel");
        n.dissolveAgreeBtn = this.findNode(root, "dissolveAgreeBtn");
        n.dissolveRejectBtn = this.findNode(root, "dissolveRejectBtn");
    },

    // ===== 座位/牌位构建 =====
    // 6 个座位 bbSeat0~5 已放在场景 game/up 下, 这里只取引用
    _buildSeatContainers: function () {
        var n = this._n;
        if (!n.up) return;
        for (var i = 0; i < 6; ++i) {
            var seat = this.findNode(n.up, "bbSeat" + i);
            if (seat) {
                // 场景内已摆好的座位: 只取节点引用, 不再改尺寸/坐标
                seat.active = false;
            } else {
                seat = this._makeSeatFallback(i);
                n.up.addChild(seat);
            }
            seat.name = "bbSeat" + i;

            var icon = this.findNode(seat, "icon");
            var lblName = this.findNode(seat, "name");
            var lblScore = this.findNode(seat, "score");
            var zhuang = this.findNode(seat, "bbZhuang");
            var ready = this.findNode(seat, "ready");
            var slots = [];
            var labels = [];
            for (var d = 0; d < 3; ++d) {
                for (var k = 0; k < 2; ++k) {
                    var sp = this.findNode(seat, "bbCard" + (d * 2 + k));
                    if (sp) { sp.active = false; slots.push(sp); }
                }
                var dl = this.findNode(seat, "bbDao" + d);
                labels.push(dl);
            }
            var summary = this.findNode(seat, "bbSummary");
            if (zhuang) zhuang.active = false;

            this._seatNodes[i] = {
                root: seat,
                icon: icon,
                nameLabel: lblName,
                scoreLabel: lblScore,
                zhuang: zhuang,
                readyMark: ready,
                slots: slots,
                daoLabels: labels,
                summary: summary
            };
        }
    },

    // 兜底: 用模板克隆出来的座位, 统一缩放/摆位
    _layoutSeatFallback: function (seat, i) {
        var pos = [[0, -197], [-420, 110], [-420, -40], [0, 150], [420, 110], [420, -40]][i];
        seat.setContentSize(260, 180);
        seat.setScale(0.85);
        seat.setPosition(pos[0], pos[1]);
    },

    _makeSeatFallback: function (i) {
        // 场景已放 bbSeat0~5; 仅在场景缺失时补空节点, 不创建任何文字
        var seat = new cc.Node("bbSeat");
        var icon = new cc.Node("icon");
        icon.addComponent(cc.Sprite);
        try { icon.addComponent("ImageLoader"); } catch (e) {}
        seat.addChild(icon);
        for (var c = 0; c < 6; ++c) {
            var sp = new cc.Node("bbCard" + c);
            sp.addComponent(cc.Sprite);
            seat.addChild(sp);
        }
        this._layoutSeatFallback(seat, i);
        return seat;
    },


    // 手摆摆牌弹窗: 全部使用场景内 bbArrange 节点(文字/牌位/按钮都在场景里)
    _buildArrangeUI: function () {
        var root = this.findNode(this.node, "bbArrange");
        if (!root) return;
        if (this._arrangeRoot) return;
        var rows = [];
        for (var d = 0; d < 3; ++d) {
            rows.push({
                nameLbl: this.findNode(root, "bbArrName" + d),
                slots: [this.findNode(root, "bbArrCard" + (d * 2)), this.findNode(root, "bbArrCard" + (d * 2 + 1))],
                desc: this.findNode(root, "bbArrDesc" + d)
            });
        }
        this._arrangeRoot = root;
        this._arrangeRows = rows;
        // 道位静止坐标: 道内牌被拖起后按它复位
        this._arrangeDaoHome = [];
        for (var di = 0; di < 3; ++di) {
            var rowHome = [];
            for (var ki = 0; ki < 2; ++ki) {
                var dn = rows[di].slots[ki];
                rowHome.push(dn ? { x: dn.x, y: dn.y, sx: dn.scaleX, sy: dn.scaleY } : null);
            }
            this._arrangeDaoHome.push(rowHome);
        }
        this._arrangeTip = this.findNode(root, "bbArrangeTip");
        this._arrangeTitle = this.findNode(root, "bbArrangeTitle");
        this._arrangeAutoBtn = this.findNode(root, "bbAutoBtn");
        this._arrangeOkBtn = this.findNode(root, "bbOkBtn");
        this._arrangeCd = this.findNode(root, "bbArrangeCd");
        if (this._arrangeCd) this._arrangeCd.active = true;   // 场景里若为隐藏, 先激活才能看到倒计时数字
        // 弹窗内底部 6 个手牌位(场景已烘焙 bbArrHand0-5): 弹窗盖住主屏手牌, 拖拽在这排上进行
        // 同时记录场景静止位: 每局重开都按它复位, 避免上一局拖拽落点残留
        this._arrangeHandSlots = [];
        this._arrangeHandHome = [];
        for (var h = 0; h < 6; ++h) {
            var hn = this.findNode(root, "bbArrHand" + h);
            this._arrangeHandSlots.push(hn);
            this._arrangeHandHome.push(hn ? { x: hn.x, y: hn.y, sx: hn.scaleX, sy: hn.scaleY } : null);
        }
        this._bindArrangeDrag();
        root.active = false;
    },

    // 免摆确认弹窗: 全部使用场景内 bbConfirm 节点(文字/牌位/按钮都在场景里)
    _buildConfirmUI: function () {
        var root = this.findNode(this.node, "bbConfirm");
        if (!root) return;
        if (this._confirmRoot) return;
        var slots = [];
        for (var i = 0; i < 6; ++i) slots.push(this.findNode(root, "bbConfirmCard" + i));
        var topSlots = [];
        for (var t = 0; t < 6; ++t) topSlots.push(this.findNode(root, "bbConfirmTopCard" + t));
        this._confirmRoot = root;
        this._confirmType = this.findNode(root, "bbConfirmType");
        this._confirmCards = slots;
        this._confirmTopCards = topSlots;
        this._confirmHint = this.findNode(root, "bbConfirmHint");
        this._confirmCd = this.findNode(root, "bbConfirmCd");
        if (this._confirmCd) this._confirmCd.active = true;   // 场景里该节点默认隐藏: 先激活才能看到倒计时数字
        this._confirmBtn = this.findNode(root, "bbConfirmBtn");
        this._confirmAutoBtn = this.findNode(root, "bbConfirmBtn-a");   // 免摆按钮: 点击后下排牌依次上移成最大牌型
        this._confirmTitle = this.findNode(root, "bbConfirmTitle");
        // 手摆弹窗 / 结算弹窗的倒计时(场景内节点, 位置由编辑器调); bbArrangeCd 在 _buildArrangeUI 收集
        this._settleCd = this.findNode(this._n.resultPanel, "settleCd");
        for (var z = 0; z < slots.length; ++z) if (slots[z]) slots[z].active = false;
        root.active = false;
    },

    _bindButtons: function () {
        this.bindButton(this._n.readyBtn, this.onReady, this);
        this.bindButton(this._n.exitBtn, this.onExit, this);
        this.bindButton(this._n.dissolveBtn, this.onDissolve, this);
        this.bindButton(this._confirmBtn, this.onConfirmTap, this);
        this.bindButton(this._confirmAutoBtn, this.onConfirmAuto, this);
        this.bindButton(this._arrangeOkBtn, this.onConfirmArrange, this);
        this.bindButton(this._arrangeAutoBtn, this.onAutoArrange, this);
        this.bindButton(this._n.resultCloseBtn, this.onResultClose, this);
        this._resultShuffleBtn = this.findNode(this.node, "bbShuffleBtn");
        this.bindButton(this._resultShuffleBtn, this.onResultShuffle, this);
        this._exitRoomBtn = this.findNode(this.node, "bbExitRoomBtn");
        this.bindButton(this._exitRoomBtn, this.onExitRoom, this);
        // 结算弹窗两个按钮底图: 场景引用的是 resources 里的散图, 首次弹出可能还没进缓存只剩文字, 进房时预取一次
        this._ensureSettleBtnFrames();
        this.bindButton(this._n.resultExitBtn, this.onExit, this);
        this.bindButton(this._n.dissolveAgreeBtn, this.onDissolveAgree, this);
        this.bindButton(this._n.dissolveRejectBtn, this.onDissolveReject, this);
        // 三道区(含道内牌再次拖动)统一交给弹窗根节点处理(见 _bindArrangeDrag):
        // 牌节点单独绑定会把触摸 claim 走, 冒泡时父节点收不到 MOVE/END, 拖动状态清不掉就会导致之后全部拖不动
        // 自己的 6 张手牌: 拖动到上方道位摆放(点按兜底)
        var self = this._seatNodes[0];
        if (self && self.slots) {
            for (var k = 0; k < 6; ++k) {
                (function (kk, cardNode) {
                    if (!cardNode) return;
                    cardNode.on(cc.Node.EventType.TOUCH_START, function (e) { this.onHandTouchStart(kk, e); }, this);
                    cardNode.on(cc.Node.EventType.TOUCH_MOVE, function (e) { this.onHandTouchMove(kk, e); }, this);
                    cardNode.on(cc.Node.EventType.TOUCH_END, function (e) { this.onHandTouchEnd(kk, e); }, this);
                    cardNode.on(cc.Node.EventType.TOUCH_CANCEL, function (e) { this.onHandTouchEnd(kk, e); }, this);
                })(k, self.slots[k]);
            }
        }
        // 摆牌弹窗内的手牌拖拽改由 bbArrange 根节点统一处理(见 _bindArrangeDrag)
    },

    _bindEvents: function () {
        var self = this;
        this.node.on('bb_start', function (d) { self.onBbStart(d && d.detail); });
        this.node.on('bb_reveal', function (d) { self.onBbReveal(d && d.detail); });
        this.node.on('bb_arrange_start', function (d) { self.onArrangeStart(d && d.detail); });
        this.node.on('bb_arrange_ok', function (d) { self.onArrangeOk(d && d.detail); });
        this.node.on('bb_confirm_start', function (d) { self.onConfirmStart(d && d.detail); });
        this.node.on('bb_confirm_ok', function (d) { self.onConfirmOk(d && d.detail); });
        this.node.on('bb_continue_ok', function (d) { self.onContinueOk(d && d.detail); });
        this.node.on('bb_wait_next', function () {
            self.showTip("本局进行中，本局结束后自动加入下一局");
            self._queuedNext = true;
        });
        this.node.on('bb_error', function (d) {
            var info = d && d.detail;
            self.showTip((info && info.msg) || "操作错误");
            // 摆牌被拒(如未满足前<=中<=后): 重新打开摆牌界面, 允许调整后再提交
            if (self._gameType == "baobao_shou" && !cc.vv.gameNetMgr.bbArranged) {
                self.showArrangeUI(self._arrangeRemain);
            }
        });
        this.node.on('game_over', function (d) { self.onGameOver(d && d.detail); });
        this.node.on('game_end', function (d) { self.onGameEnd(d && d.detail); });
        this.node.on('user_state_changed', function (d) { self.onUserStateChanged(d && d.detail); });
        this.node.on('new_user', function () { self.renderSeats(); });
        this.node.on('exit_notify', function () { self.renderSeats(); });
        this.node.on('game_num', function () { self.updateRoomInfo(); });
        this.node.on('game_begin', function () { self.updateRoomInfo(); });
        this.node.on('dissolve_notice', function () { if (self._n.dissolvePanel) self._n.dissolvePanel.active = true; });
        this.node.on('dissolve_cancel', function () { if (self._n.dissolvePanel) self._n.dissolvePanel.active = false; });
        this.node.on('dispress_push', function () { self.leaveRoom(); });
        this.node.on('bb_kicked', function (d) {
            var info = d && d.detail;
            // 请出提示留到回到牌桌列表页时弹窗, 房间内只做文字提示
            if (cc.vv) cc.vv.bbKickTip = "因宝宝豆不足，已自动退出房间！";
            self.showTip((info && info.msg) || "宝宝豆不足，已被请出房间");
            // 兜底: dispress_push 若因断线丢失, 800ms后仍返回进房前的页面
            if (!self._backTimer) {
                self._backTimer = setTimeout(function () {
                    self._backTimer = null;
                    if (cc.isValid(self.node) && !self._leaving) self.leaveRoom();
                }, 800);
            }
        });
        // 宝宝场景没有重连组件: 断线即视为已离开房间, 3秒后回到进房前的页面(俱乐部进桌回俱乐部, 大厅进桌回大厅)
        this.node.on('disconnect', function () {
            self.showTip("连接断开，正在返回…");
            if (!self._backTimer) {
                self._backTimer = setTimeout(function () {
                    self._backTimer = null;
                    if (cc.isValid(self.node) && !self._leaving) self.leaveRoom();
                }, 3000);
            }
        });
        this.node.on('reconnect', function () {
            self.showTip("");
            if (self._backTimer) { clearTimeout(self._backTimer); self._backTimer = null; }
        });
        // 服务端已释放座位并回包(exit_result): 立刻切场景, 不再空等固定时长
        this.node.on('exit_result', function () {
            if (self._exitTimer) { clearTimeout(self._exitTimer); self._exitTimer = null; }
            if (!self._leaving) self.leaveRoom();
        });
    },

    // 预加载退出后要返回的场景(大厅/俱乐部): 房间内提前把场景资源加载好,
    // 点退出时直接切场景, 不会出现"点一下卡住"的加载停顿
    _preloadBackScene: function () {
        var nm = cc.vv.gameNetMgr;
        var name = ((nm && nm.roomBackScene === "club") || cc.vv.fromClubId) ? "club" : "hall";
        try { cc.director.preloadScene(name, function () {}); } catch (e) {}
    },

    // ===== 场景加载/重连恢复 =====
    refreshFromState: function () {
        var nm = cc.vv.gameNetMgr;
        this.updateRoomInfo();
        if (nm.gamestate == "begin" && nm.bbMyCards && nm.bbMyCards.length > 0) {
            this._started = true;
            this._final = false;
            this._gameType = nm.bbGameType;
            this._applyBbConf(null);   // 重连恢复: 从 nm.conf 读同点比较方式
            this._mySeat = nm.bbMySeat >= 0 ? nm.bbMySeat : 0;
            this._revealByGs = {};
            if (nm.bbMyDaos && nm.bbMyDaos.length == 3) {
                this._daoSel = this._normDaos(nm.bbMyDaos);
            }
            this._showGameUI();
            this.renderSeats();
            this.renderCards();
            if (this._gameType == "baobao_shou" && nm.bbPhase == "arrange" && !nm.bbArranged) {
                this.showArrangeUI(nm.bbArrangeDeadline);
            } else {
                this.hideArrangeUI();
                if (nm.bbGameType == "baobao_mian") {
                    // 重进恢复: 按服务端阶段直接恢复到对应UI, 不能停在"系统拆牌中"空等
                    if (nm.bbPhase == "confirm") {
                        if (nm.bbConfirmDeadline) { this._confirmRemain = Math.max(0, Math.ceil((nm.bbConfirmDeadline - Date.now()) / 1000)); this._confirmRemainAt = Date.now(); }
                        if (nm.bbConfirmed) { this.hideConfirmUI(); this.showTip("已确定，等待其他玩家…"); }
                        else this.showConfirmUI();
                    } else if (nm.bbPhase == "reveal") {
                        this.showTip("等待结算…");
                    } else {
                        this.showTip("系统拆牌中…");
                    }
                }
            }
        } else if (!(this._n.resultPanel && this._n.resultPanel.active)) {
            this.showPrepareUI();
        }
        if (nm.numOfGames >= nm.maxNumOfGames && nm.maxNumOfGames > 0) this._final = true;
    },

    _showGameUI: function () {
        if (this._n.readyBtn) this._n.readyBtn.active = false;
        // 开局后隐藏退出/解散按钮: 房间内只保留牌局界面
        if (this._n.dissolveBtn) this._n.dissolveBtn.active = false;
        if (this._n.exitBtn) this._n.exitBtn.active = false;
        if (this._exitRoomBtn) this._exitRoomBtn.active = false;
        if (this._n.resultPanel) this._n.resultPanel.active = false;
    },

    showPrepareUI: function () {
        this._started = false;
        this._arranging = false;
        this._revealByGs = {};
        this.hideArrangeUI();
        if (this._n.resultPanel) this._n.resultPanel.active = false;
        var nm = cc.vv.gameNetMgr;
        var selfSeat = (nm.seats && nm.seatIndex >= 0) ? nm.seats[nm.seatIndex] : null;
        var isReady = !!(selfSeat && selfSeat.ready);
        if (this._n.readyBtn) this._n.readyBtn.active = !isReady;
        // 未开局: 只保留退出房间按钮, 不再提供解散按钮
        if (this._n.dissolveBtn) this._n.dissolveBtn.active = false;
        if (this._n.exitBtn) this._n.exitBtn.active = true;
        this._clearCards();
        this.renderSeats();
        this.updateRoomInfo();
        this.showTip("");
    },

    _clearCards: function () {
        for (var i = 0; i < this._seatNodes.length; ++i) {
            var sn = this._seatNodes[i];
            for (var k = 0; k < 6; ++k) {
                if (sn.slots[k]) { sn.slots[k].active = false; sn.slots[k].color = cc.Color.WHITE; }
            }
            for (var d = 0; d < 3; ++d) this.setStr(sn.daoLabels[d], "");
            this.setStr(sn.summary, "");
        }
        this._renderArrange();
    },

    // ===== 免摆: 发牌后确认弹窗 =====
    onConfirmStart: function (data) {
        var nm = cc.vv.gameNetMgr;
        if (data) {
            if (data.remain != null) { this._confirmRemain = data.remain; this._confirmRemainAt = Date.now(); nm.bbConfirmRemain = data.remain; }
            else if (data.deadline) { this._confirmRemain = Math.max(0, Math.ceil((data.deadline - Date.now()) / 1000)); this._confirmRemainAt = Date.now(); nm.bbConfirmRemain = this._confirmRemain; }
        }
        if (data && data.myMian) nm.bbMyMian = data.myMian;
        if (nm.bbConfirmed) { this.hideConfirmUI(); this.showTip("已确认，等待其他玩家…"); return; }
        // 洗牌/发牌动画还没结束(或还没开始): 先不弹窗, 由发牌结束回调统一弹出
        if (this._animBusy || this._dealing || !this._started) return;
        this.showConfirmUI();
    },

    onConfirmOk: function (data) {
        if (!data) return;
        var nm = cc.vv.gameNetMgr;
        if (data.seatIndex == nm.bbMySeat) nm.bbConfirmed = true;
        if (data.confirmedCount != null) {
            this._confirmCount = data.confirmedCount;
            if (this._confirmHint) this.setStr(this._confirmHint, "已确定 " + data.confirmedCount + "/" + (data.total || this._total) + "，等待其他玩家…");
        }
        if (nm.bbConfirmed) {
            this.hideConfirmUI();
            this.showTip("已确定 (" + (data.confirmedCount != null ? data.confirmedCount : this._confirmCount) + "/" + (data.total || this._total) + ")，等待其他玩家…");
        }
    },

    showConfirmUI: function () {
        var nm = cc.vv.gameNetMgr;
        this._buildConfirmUI();
        var root = this._confirmRoot;
        console.log("[BB] 免摆弹窗 root=" + !!root + " phase=" + nm.bbPhase + " mian=" + JSON.stringify(nm.bbMyMian));
        if (!root) { console.error("[BB] 场景内找不到 bbConfirm 节点"); return; }
        // 父链全部激活, 避免弹窗挂在未激活的父节点下导致不显示
        var p = root.parent;
        while (p && p.parent) { if (!p.active) p.active = true; p = p.parent; }
        root.active = true;
        var par = root.parent;
        if (par) root.setSiblingIndex(par.children.length - 1);
        this._clearConfirmFly(); //弹窗前先清掉上一局残留的飞牌副本
        var mian = nm.bbMyMian;
        if (this._confirmType) {
            this.setStr(this._confirmType, mian ? ((mian.typeName || "") + "  ×" + (mian.rate || 1)) : "计算中…");
        }
        // 弹出后不先摆最大牌型: 等用户点「免摆」按钮再依次上移; 未点免摆前确认按钮禁用
        this._confirmAutoShown = false;
        this._confirmMoving = false;
        if (this._confirmAutoBtn) this._confirmAutoBtn.opacity = 255;
        if (this._confirmBtn) this._confirmBtn.opacity = 120;
        this._fillConfirmCards();
        this._confirmCount = 0;
        this._startCountdown(this._leftOf(this._confirmRemain != null ? this._confirmRemain : (nm.bbConfirmRemain || 0), this._confirmRemainAt), this._confirmCd, function () {
            // 超时未点免摆/确认: 关闭弹窗, 自动按免摆(最大牌型)确认亮牌
            this.hideConfirmUI();
            this.showTip("超时未操作，系统自动免摆亮牌");
            cc.vv.net.send("bb_confirm");
        });
    },

    // 弹窗: 下排是发到手的原始 6 张, 上排是排序后的最大牌型(大图)
    _fillConfirmCards: function () {
        var nm = cc.vv.gameNetMgr;
        var raw = (nm.bbMyCards || []);
        var mian = nm.bbMyMian;
        var top = (mian && mian.cards && mian.cards.length ? mian.cards : raw);
        for (var i = 0; i < 6; ++i) {
            var cn = this._confirmCards && this._confirmCards[i];
            if (cn) {
                if (raw[i] != null) {
                    cn.active = true;
                    var sp = cn.getComponent(cc.Sprite);
                    if (sp) sp.spriteFrame = this.frameOf(raw[i]) || this._cardBack || null;
                } else cn.active = false;
            }
            var tn = this._confirmTopCards && this._confirmTopCards[i];
            if (tn) {
                // 未点「免摆」前上排不显示最大牌型
                if (this._confirmAutoShown && top[i] != null) {
                    tn.active = true;
                    var tsp = tn.getComponent(cc.Sprite);
                    if (tsp) tsp.spriteFrame = this.frameOf(top[i]) || this._cardBack || null;
                } else tn.active = false;
            }
        }
    },

    // 免摆按钮: 下方原始牌依次往上移动, 组成最大牌型
    onConfirmAuto: function () {
        if (this._confirmAutoShown || this._confirmMoving) return;
        this._confirmAutoShown = true;
        this._confirmMoving = true;
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("sort.wav");   //免摆摆牌音效
        if (this._confirmAutoBtn) this._confirmAutoBtn.opacity = 120;
        var nm = cc.vv.gameNetMgr;
        var raw = (nm.bbMyCards || []).slice();
        var mian = nm.bbMyMian;
        var top = (mian && mian.cards && mian.cards.length) ? mian.cards : raw;
        var used = {};   // 下排已被上移走的索引
        var self = this;
        for (var i = 0; i < 6; ++i) {
            var id = top[i];
            if (id == null) continue;
            var from = -1;
            for (var j = 0; j < 6; ++j) { if (!used[j] && raw[j] === id) { from = j; break; } }
            if (from < 0) continue;
            used[from] = true;
            (function (fromIdx, toIdx, cardId) {
                setTimeout(function () { self._moveConfirmCard(fromIdx, toIdx, cardId); }, toIdx * 150);
            })(from, i, id);
        }
        // 全部上移动画结束后才放开确认按钮(最后一张 5*150ms 起飞 + 飞行 250ms)
        setTimeout(function () {
            if (!cc.isValid(self.node)) return;
            self._confirmMoving = false;
            if (self._confirmBtn) self._confirmBtn.opacity = 255;
        }, 5 * 150 + 300);
    },

    // 一张牌从弹窗下排飞到上排: 副本飞行, 落位后上排显示牌面, 下排让出
    _moveConfirmCard: function (fromIdx, toIdx, id) {
        var bottom = this._confirmCards && this._confirmCards[fromIdx];
        var top = this._confirmTopCards && this._confirmTopCards[toIdx];
        var frame = this.frameOf(id) || this._cardBack || null;
        if (!bottom || !top || !cc.isValid(bottom) || !cc.isValid(top)) {
            if (top && cc.isValid(top)) { top.active = true; var sp0 = top.getComponent(cc.Sprite); if (sp0) sp0.spriteFrame = frame; }
            return;
        }
        var parent = bottom.parent;
        var targetPos = top.position;
        if (top.parent !== parent) {
            var w = top.convertToWorldSpaceAR(cc.v2(0, 0));
            targetPos = parent.convertToNodeSpaceAR(w);
        }
        var ghost = new cc.Node("confirmFly");
        var gsp = ghost.addComponent(cc.Sprite);
        gsp.spriteFrame = frame;
        ghost.parent = parent;
        ghost.setPosition(bottom.position);
        ghost.setScale(bottom.scaleX, bottom.scaleY);
        bottom.active = false;
        ghost.runAction(cc.sequence(
            cc.moveTo(0.25, targetPos),
            cc.callFunc(function () {
                ghost.destroy();
                if (!cc.isValid(top)) return;
                top.active = true;
                var sp = top.getComponent(cc.Sprite);
                if (sp) sp.spriteFrame = frame;
            })
        ));
    },

    hideConfirmUI: function () {
        this._clearConfirmFly();
        this._confirmMoving = false;
        // 清掉上/下排牌面贴图, 避免下一局弹窗刚出现时先闪一帧上一局的残留牌
        var i, sp;
        for (i = 0; this._confirmCards && i < 6; ++i) {
            var cn = this._confirmCards[i];
            if (cn) { cn.active = false; sp = cn.getComponent(cc.Sprite); if (sp) sp.spriteFrame = null; }
        }
        for (i = 0; this._confirmTopCards && i < 6; ++i) {
            var tn = this._confirmTopCards[i];
            if (tn) { tn.active = false; sp = tn.getComponent(cc.Sprite); if (sp) sp.spriteFrame = null; }
        }
        if (this._confirmRoot) this._confirmRoot.active = false;
        this._stopCountdown();
    },

    // 清掉上一局残留的"飞牌"副本(弹窗关闭会暂停节点动作, destroy回调不执行, 副本会一直留着并在下次弹窗时露出)
    // 副本可能挂在下排牌所在的容器里(不是 bbConfirm 的直接子节点), 必须递归整棵子树查找
    _clearConfirmFly: function () {
        var root = this._confirmRoot;
        if (!root) return;
        var stack = [root];
        while (stack.length > 0) {
            var p = stack.pop();
            var ch = p.children.slice();
            for (var i = 0; i < ch.length; ++i) {
                if (!cc.isValid(ch[i])) continue;
                if (ch[i].name === "confirmFly") {
                    ch[i].stopAllActions();
                    ch[i].destroy();
                } else {
                    stack.push(ch[i]);
                }
            }
        }
    },

    onConfirmTap: function () {
        var nm = cc.vv.gameNetMgr;
        if (!this._confirmRoot || !this._confirmRoot.active) return;
        if (nm.bbConfirmed) return;
        // 免摆上移动画未结束前确认按钮不可点
        if (this._confirmMoving) { this.showTip("摆牌中，请稍候…"); return; }
        // 未点「免摆」前确认按钮禁用
        if (!this._confirmAutoShown) { this.showTip("请先点击「免摆」按钮"); return; }
        nm.bbConfirmed = true;
        cc.vv.net.send("bb_confirm");
        this.hideConfirmUI();
        this.showTip("已确定 (" + (this._confirmCount + 1) + "/" + (this._total || 2) + ")，等待其他玩家…");
    },

    // ===== 倒计时(秒级, 仅在需要时启用) =====
    // 弹窗倒计时: 统一用服务端下发的剩余秒数, 从收到那一刻起本地逐秒递减,
    // 不再用"绝对时间戳 - 本机时钟", 避免各玩家设备时间不同导致同一房间倒计时不一致
    // 由"服务端下发剩余秒数 + 本机收到该推送的时刻"推算当前真实剩余秒数。
    // 只用本机时间差值, 不受玩家设备时钟偏差影响, 全房玩家起点一致
    _leftOf: function (remain, at) {
        var base = Number(remain) || 0;
        if (!at) return base;
        return Math.max(0, base - Math.floor((Date.now() - at) / 1000));
    },

    _startCountdown: function (remain, label, onEnd) {
        this._stopCountdown();
        if (!label) return;
        var self = this;
        this._cdLabel = label;
        this._cdEnd = onEnd || null;
        this._cdBase = Math.max(0, Math.floor(Number(remain) || 0));
        this._cdStartAt = Date.now();     // 用本机时间差算剩余, setInterval 漂移不影响秒数准确
        this._cdAlarmed = false;          // 最后5秒报警音只播一次
        this._cdTick();
        this._cdTimer = setInterval(function () { self._cdTick(); }, 200);
    },

    _cdTick: function () {
        if (!this._cdLabel) return;
        var left = Math.max(0, this._cdBase - Math.floor((Date.now() - this._cdStartAt) / 1000));
        this.setStr(this._cdLabel, "" + left);
        //倒计时进入最后5秒播放一次报警音
        if (left > 0 && left <= 5 && !this._cdAlarmed) {
            this._cdAlarmed = true;
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("timeup_alarm.wav");
        }
        if (left <= 0) {
            var cb = this._cdEnd;
            this._stopCountdown();
            if (cb) cb.call(this);
        }
    },

    _stopCountdown: function () {
        if (this._cdTimer) { clearInterval(this._cdTimer); this._cdTimer = null; }
        this._cdLabel = null;
        this._cdEnd = null;
    },

    onDestroy: function () {
        if (this._backTimer) { clearTimeout(this._backTimer); this._backTimer = null; }
        if (cc.vv && cc.vv.bbExitHook) cc.vv.bbExitHook = null;
        this._stopCountdown(); this._stopDeal();
    },

    // ===== 座位渲染 =====
    _layoutOf: function (total) {
        total = Math.max(2, Math.min(6, total));
        return this.seatLayout(total);
    },

    _seatInfoOfOffsetInGame: function (offset, total) {
        var nm = cc.vv.gameNetMgr;
        var gs = (this._mySeat + offset) % total;
        var bs = nm.bbSeats ? nm.bbSeats[gs] : null;
        var rs = bs && nm.seats ? nm.seats[bs.roomSeatIndex] : null;
        return {
            gs: gs,
            userid: bs ? bs.userid : null,
            name: bs ? (bs.name || "") : "",
            score: rs && rs.score != null ? rs.score : (bs && bs.score != null ? bs.score : null),
            isBanker: !!nm.bbBankerMode && gs == nm.bbBankerSeat,
            ready: !!(bs && bs.arranged)
        };
    },

    renderSeats: function () {
        var nm = cc.vv.gameNetMgr;
        var inGame = this._started && nm.bbSeats && nm.bbSeats.length > 0;
        var total;
        var infos = [];
        if (inGame) {
            total = Math.max(2, Math.min(6, nm.bbSeats.length));
            this._total = total;
            for (var o = 0; o < total; ++o) infos.push({ offset: o, info: this._seatInfoOfOffsetInGame(o, total) });
        } else {
            // 准备阶段: 只按实际在坐的玩家排环(允许房间座位数 > 实际人数)
            var seats = nm.seats || [];
            var len = seats.length;
            var myIdx = nm.seatIndex >= 0 ? nm.seatIndex : 0;
            var occ = [];
            for (var i = 0; i < len; ++i) {
                var s = seats[i];
                if (!s || !s.userid) continue;
                occ.push({ i: i, rel: (i - myIdx + len) % len });
            }
            occ.sort(function (a, b) { return a.rel - b.rel; });
            total = Math.max(2, Math.min(6, occ.length));
            this._total = total;
            for (var k = 0; k < occ.length && k < total; ++k) {
                var s2 = seats[occ[k].i];
                infos.push({
                    offset: k,
                    info: {
                        gs: occ[k].i,
                        userid: s2.userid,
                        name: s2.name || "",
                        score: s2.score != null ? s2.score : 0,
                        isBanker: false,
                        ready: !!s2.ready
                    }
                });
            }
        }
        // 先全部隐藏 + 清头像(防止上一局/上一阶段的玩家头像残留)
        for (var i2 = 0; i2 < 6; ++i2) {
            var sn0 = this._seatNodes[i2];
            if (!sn0) continue;
            sn0.root.active = false;
            if (sn0.icon) {
                var clr = sn0.icon.getComponent("ImageLoader");
                if (clr) { clr.clearAvatar ? clr.clearAvatar() : (clr._spriteFrame = null, clr.setupSpriteFrame()); }
                else { var sp0 = sn0.icon.getComponent(cc.Sprite); if (sp0) sp0.spriteFrame = null; }
            }
        }

        var layout = this._layoutOf(total);
        for (var j = 0; j < infos.length; ++j) {
            var off2 = infos[j].offset;
            var slotIdx = layout[off2];
            var sn = this._seatNodes[slotIdx];
            if (!sn) continue;
            sn.root.active = true;
            this.setStr(sn.nameLabel, infos[j].info.name || "");
            this.setStr(sn.scoreLabel, infos[j].info.score != null ? ("" + infos[j].info.score) : "");
            if (sn.zhuang) sn.zhuang.active = !!infos[j].info.isBanker;
            if (sn.readyMark) sn.readyMark.active = !!infos[j].info.ready;
            // 头像加载: icon 节点已在场景 fire 里挂了 ImageLoader, 这里只调 setUserID
            if (sn.icon) {
                var iconLoader = sn.icon.getComponent("ImageLoader");
                if (!iconLoader) { try { iconLoader = sn.icon.addComponent("ImageLoader"); } catch (e) {} }
                if (iconLoader && infos[j].info.userid) {
                    iconLoader.setUserID(infos[j].info.userid);
                }
            }
        }
    },

    updateRoomInfo: function () {
        var nm = cc.vv.gameNetMgr;
        var conf = nm.conf || {};
        //是否有庄:banker_mode未配置默认有庄,0为无庄
        var bankerTxt = (conf.banker_mode != null && !Number(conf.banker_mode)) ? "无庄" : "有庄";
        var minBean = Number(conf.min_bean) || 0;
        //getWanfa已含玩法名+底分+局数,这里补上有庄/无庄和进入最低宝宝豆
        var txt = "房号:" + (nm.roomId || "") + "  " + nm.getWanfa() + "  " + bankerTxt + "  最低豆" + minBean;
        if (nm.maxNumOfGames > 0) txt += "  第" + nm.numOfGames + "/" + nm.maxNumOfGames + "局";
        if (nm.bbSeats && nm.bbSeats[nm.bbBankerSeat] && nm.bbBankerMode) {
            txt += "  庄:" + (nm.bbSeats[nm.bbBankerSeat].name || "");
        }
        this.setStr(this._n.titleLabel, txt);
    },

    // 右上角设置按钮: 打开场景内popups/settings面板(音效/音乐开关由setting组件处理,btn_close自行关闭)
    onBtnSettingsClicked: function () {
        var settings = this.findNode(this.node, "settings");
        if (settings) settings.active = true;
    },

    // ===== 牌面渲染 =====
    // 免摆明牌按牌型排列: 同点牌成组(三条/对子在前), 其余按点数降序(顺子自然连续)
    _mianOrder: function (cards) {
        var cnt = {}, self = this;
        for (var i = 0; i < cards.length; ++i) {
            var r = self.rankOf(cards[i]);
            (cnt[r] = cnt[r] || []).push(cards[i]);
        }
        var ranks = Object.keys(cnt).map(Number).sort(function (a, b) {
            return cnt[b].length - cnt[a].length || b - a;
        });
        var out = [];
        for (var k = 0; k < ranks.length; ++k) {
            out = out.concat(cnt[ranks[k]].slice().sort(function (a, b) { return self.suitOf(a) - self.suitOf(b); }));
        }
        return out;
    },

    // 免摆散牌构成(只给一句): 一对 / 二对 / 全单时写最大的一张(单A)
    _mianParts: function (holds) {
        var self = this, cnt = {}, pairs = 0, max = 0;
        for (var i = 0; i < (holds || []).length; ++i) {
            var rk = self.rankOf(holds[i]);
            cnt[rk] = (cnt[rk] || 0) + 1;
            if (rk > max) max = rk;
        }
        for (var r in cnt) { if (cnt[r] == 2) pairs++; }
        if (pairs >= 2) return "二对";
        if (pairs == 1) return "一对";
        var names = { 11: "J", 12: "Q", 13: "K", 14: "A" };
        return "单" + (names[max] || max);
    },

    renderCards: function () {
        if (this._dealing) return;   // 发牌动画进行中: 牌面/显隐由 _dealSeq 控制, 一律牌背
        var nm = cc.vv.gameNetMgr;
        var myCards = (nm.bbMyCards || []).slice();
        var total = this._total || 2;

        for (var o = 0; o < 6; ++o) {
            var sn = this._seatNodes[o];
            if (!sn) continue;
            for (var k = 0; k < 6; ++k) { if (sn.slots[k]) { sn.slots[k].active = false; } }
            for (var d = 0; d < 3; ++d) this.setStr(sn.daoLabels[d], "");
            this.setStr(sn.summary, "");
        }
        if (!this._started) { this._renderArrange(); return; }

        for (var off = 0; off < total; ++off) {
            var seat = this._seatNodes[this._layoutOf(total)[off]];
            if (!seat || !seat.root.active) continue;
            var gs = this._watching ? off : (this._mySeat + off) % total;
            // 亮牌: 按轮次进行, _revealCounts[off] = 该家已亮出的张数(其余仍是牌背)
            var shown = this._revealCounts ? (this._revealCounts[off] || 0) : 0;
            var p = shown > 0 ? (this._revealByGs[gs] || null) : null;
            var isMe = !this._watching && off == 0;
            var faces = [];
            var backs = false;
            var labels = ["", "", ""];
            var summary = "";

            if (p) {
                if (p.daos) {
                    for (var i = 0; i < p.daos.length; ++i) {
                        faces = faces.concat(p.daos[i].cards || []);
                        labels[i] = p.daos[i].desc + "×" + p.daos[i].rate;
                    }
                    if (p.wulong) summary = "乌龙(三道全输)";
                    else if (p.auto) summary = "系统自动摆牌";
                } else if (p.groups) {
                    for (var g = 0; g < p.groups.length; ++g) {
                        faces = faces.concat(p.groups[g] || []);
                    }
                    // 免摆亮牌后只显示牌型(二张点数只用于手摆的三道)
                    summary = (p.typeName || "") + " ×" + (p.rate || 1);
                }
                // 逐道显示: 该道两张亮出后就显示该道牌型/点数; 牌型总名(含乌龙)仍等六张全亮
                for (var ld = 0; ld < 3; ++ld) { if (shown < (ld + 1) * 2) labels[ld] = ""; }
                if (shown < 6) summary = "";
            } else if (isMe && !this._revealRunning && !this._revealCounts && !this._dealing) {
                for (var m = 0; m < 6; ++m) faces.push(myCards[m] != null ? myCards[m] : null);
            } else {
                // 未轮到的玩家显示牌背
                backs = true;
            }

            for (var s = 0; s < 6; ++s) {
                var cardNode = seat.slots[s];
                if (!cardNode) continue;
                var sp = cardNode.getComponent(cc.Sprite);
                cardNode.active = true;
                if (backs || (p && s >= shown)) {
                    if (sp) sp.spriteFrame = this._cardBack || null;
                    cardNode.color = cc.Color.WHITE;
                } else if (faces[s] != null) {
                    if (sp) sp.spriteFrame = this.frameOf(faces[s]) || this._cardBack || null;
                    var used = this._arranging && isMe && !p && this._isUsed(faces[s]);
                    cardNode.color = used ? cc.color(120, 120, 120) : cc.Color.WHITE;
                } else {
                    cardNode.active = false;
                }
            }
            for (var d2 = 0; d2 < 3; ++d2) this.setStr(seat.daoLabels[d2], labels[d2]);
            // 免摆场景不再显示亮牌后的牌型文字(手摆的乌龙/自动摆牌提示保留)
            this.setStr(seat.summary, this._gameType == "baobao_mian" ? "" : summary);
        }
        this._renderArrange();
    },

    // 服务端给的三道(每道 2 张数组)转成固定 2 槽位: 缺的位置用 null 占位
    _normDaos: function (daos) {
        var out = [[null, null], [null, null], [null, null]];
        for (var d = 0; d < 3; ++d) {
            var a = daos && daos[d];
            if (!a) continue;
            if (a[0] != null) out[d][0] = a[0];
            if (a[1] != null) out[d][1] = a[1];
        }
        return out;
    },
    // 某道是否摆满 2 张
    _daoFull: function (arr) {
        return !!arr && arr[0] != null && arr[1] != null;
    },
    // 某道的空槽位(0/1); 已摆满返回 -1
    _daoFreeSlot: function (arr) {
        if (!arr) return 0;
        if (arr[0] == null) return 0;
        if (arr[1] == null) return 1;
        return -1;
    },

    _isUsed: function (id) {
        if (id == null) return false;
        return this._daoSel[0].indexOf(id) >= 0 || this._daoSel[1].indexOf(id) >= 0 || this._daoSel[2].indexOf(id) >= 0;
    },

    // ===== 开局 =====
    onBbStart: function (data) {
        var nm = cc.vv.gameNetMgr;
        // 上一局有人点了洗牌(服务端统一标记): 全员确认后所有端同时播洗牌动画再发牌, 多人点也只播一次
        var playShuffle = (data && data.shuffle) || this._shufflePending;
        // 定位"结算关闭后迟迟不发牌": 记录关窗到收到开局推送的耗时, 超过 1.5 秒会在控制台告警
        if (this._settleClosedAt) {
            var gap = Date.now() - this._settleClosedAt;
            console.log("[BB][时序] 结算关闭→收到开局 " + gap + "ms" + (data && data.resend ? " (补发)" : "") + (playShuffle ? " +洗牌动画" : ""));
            if (gap > 1500) console.warn("[BB][时序] 开局推送延迟 " + gap + "ms, 请对照服务端 [宝宝][时序] bb_start 时间");
            this._settleClosedAt = 0;
        }
        this._shufflePending = false;
        this._roundSeq = (this._roundSeq || 0) + 1;   // 局令牌: 用于丢弃上一局延迟到达的结算, 避免打断本局发牌
        this._started = true;
        this._watching = false;
        this._final = false;
        this._roomEnd = false;
        this._settle1Done = true;
        this._summaryShown = false;
        this._endDetail = null;
        this._arranging = false;
        this._myContinued = false;
        this._stopContinueRetry();
        this._pushAt = Date.now();   // 本机收到本局推送的时刻(倒计时统一起点)
        this._confirmRemainAt = 0;
        this._arrangeRemainAt = 0;
        this._overAt = 0;
        this._daoSel = [[null, null], [null, null], [null, null]];
        this._revealByGs = {};
        this._revealCounts = null;
        this._revealDone = false;
        this._revealRunning = false;
        this._pendingOver = null;
        this._lastOver = null;
        this._pendingSeq = null;
        this._lastOverSeq = null;
        this._fxRunning = false;
        this._animBusy = false;   // 洗牌+发牌动画进行中标志: 期间屏蔽阶段推送直接弹窗
        this._clearFxNodes();
        this._gameType = data ? data.gameType : nm.bbGameType;
        this._applyBbConf(data);   // 后台同点比较方式 tongdian_mode
        this._mySeat = (data && data.mySeat != null) ? data.mySeat : (nm.bbMySeat >= 0 ? nm.bbMySeat : 0);
        // 重连补发(bb_resend_push)会带已摆好的三道
        if (data && data.myDaos && data.myDaos.length == 3) {
            this._daoSel = this._normDaos(data.myDaos);
        }
        try { this._showGameUI(); this.updateRoomInfo(); this.renderSeats(); } catch (e) { console.error("[BB] 开局UI异常", e); }
        var self = this;
        // 重连补发: 不重播洗牌/发牌动画, 直接按服务端阶段恢复
        if (data && data.resend) {
            this._dealing = false;
            try { this.renderCards(); this._showPhaseUI(data, nm); } catch (e) { console.error("[BB] 补发恢复异常", e); }
            return;
        }
        function startDeal() {
            console.log("[BB][时序] 开始发牌 距收到开局 " + (Date.now() - self._pushAt) + "ms");
            try {
                self._dealSeq(function () {
                    self._animBusy = false;   // 洗牌+发牌动画全部结束, 解除阶段推送屏蔽
                    if (!self._started) return;
                    try { self._showPhaseUI(data, nm); } catch (e) { console.error("[BB] 阶段UI异常", e); }
                });
            } catch (e) {
                // 发牌流程异常不能卡住: 结束发牌态, 直接按当前阶段显示UI
                console.error("[BB] 发牌异常, 直接显示阶段UI", e);
                self._animBusy = false;
                self._dealing = false;
                try { self.renderCards(); self._showPhaseUI(data, nm); } catch (e2) { console.error("[BB] 阶段UI异常", e2); }
            }
        }
        var dealStarted = false;
        function startDealOnce() {
            if (dealStarted) return;
            dealStarted = true;
            startDeal();
        }
        try {
            if (playShuffle) {
                this._animBusy = true;   // 洗牌动画期间屏蔽 bb_confirm_start 直接弹窗
                this._clearCards();   // 洗牌动画期间不显示新牌
                this._playShuffleAnim(startDealOnce);
                // 洗牌看门狗: 动画回调丢失(节点异常/组件重载)也不会停在"洗牌中"卡住
                this.scheduleOnce(function () {
                    if (!dealStarted) {
                        console.warn("[BB] 洗牌动画未回调, 强制进入发牌");
                        self._animBusy = false;
                        startDealOnce();
                    }
                }, 2.6);
            } else {
                this.renderCards();
                startDealOnce();
            }
        } catch (e) {
            console.error("[BB] 开局渲染异常, 兜底直接发牌", e);
            this._animBusy = false;
            this._dealing = false;
            startDealOnce();
        }
    },

    // 发完牌后按阶段显示弹窗(免摆确认/手摆摆牌)
    _showPhaseUI: function (data, nm) {
        if (data && data.phase == "reveal") {
            // 重连时已亮牌: 直接显示各家明牌, 不播动画/不倒计时, 等结算推送
            this.hideConfirmUI();
            this.hideArrangeUI();
            this._stopCountdown();
            var rv = data.reveal && data.reveal.players ? data.reveal.players : [];
            this._revealByGs = {};
            for (var ri = 0; ri < rv.length; ++ri) {
                if (rv[ri].seat != null) this._revealByGs[rv[ri].seat] = rv[ri];
            }
            this._revealCounts = [];
            var totalR = this._total || 2;
            for (var rc = 0; rc < totalR; ++rc) this._revealCounts.push(6);
            this._revealRunning = false;
            this._revealDone = true;
            this.renderCards();
            this.showTip("等待结算…");
        } else if (data && data.phase == "result") {
            // 重连时本局已结算: 隐藏阶段 UI, 结算推送随后到达
            this.hideConfirmUI();
            this.hideArrangeUI();
            this._stopCountdown();
            this.showTip("等待结算…");
        } else if (this._gameType == "baobao_shou" && data && data.phase == "arrange") {
            this.hideConfirmUI();
            if (data.arranged || nm.bbArranged) {
                this.hideArrangeUI();
                this.showTip("已提交，等待其他玩家…");
            } else {
                if (data.arrangeRemain != null) { this._arrangeRemain = data.arrangeRemain; this._arrangeRemainAt = this._pushAt || Date.now(); }
                else if (data.arrangeDeadline) { this._arrangeRemain = Math.max(0, Math.ceil((data.arrangeDeadline - Date.now()) / 1000)); this._arrangeRemainAt = Date.now(); }
                this.showArrangeUI(this._arrangeRemain);
            }
        } else if (data && data.phase == "confirm") {
            this.hideArrangeUI();
            // 免摆: 发牌后弹窗展示系统最大牌型
            if (data.myMian) nm.bbMyMian = data.myMian;
            if (data.confirmRemain != null) { this._confirmRemain = data.confirmRemain; this._confirmRemainAt = this._pushAt || Date.now(); }
            else if (data.confirmDeadline) { this._confirmRemain = Math.max(0, Math.ceil((data.confirmDeadline - Date.now()) / 1000)); this._confirmRemainAt = Date.now(); }
            if (data.confirmed) {
                this.hideConfirmUI();
                this.showTip("已确定，等待其他玩家…");
            } else {
                this.showConfirmUI();
            }
        } else {
            // 兜底: 免摆(非手摆)一律发牌后弹确认窗, 即使服务端没带 phase 字段
            this.hideArrangeUI();
            if (this._gameType != "baobao_shou") {
                if (data && data.myMian) nm.bbMyMian = data.myMian;
                if (data && data.confirmRemain != null) { this._confirmRemain = data.confirmRemain; this._confirmRemainAt = this._pushAt || Date.now(); }
                else if (data && data.confirmDeadline) { this._confirmRemain = Math.max(0, Math.ceil((data.confirmDeadline - Date.now()) / 1000)); this._confirmRemainAt = Date.now(); }
                if (data && data.confirmed) {
                    this.hideConfirmUI();
                    this.showTip("已确定，等待其他玩家…");
                } else {
                    this.showConfirmUI();
                }
            } else {
                this.hideConfirmUI();
            }
        }
    },

    onArrangeStart: function (data) {
        var nm = cc.vv.gameNetMgr;
        this._gameType = "baobao_shou";
        if (data && data.remain != null) { this._arrangeRemain = data.remain; this._arrangeRemainAt = Date.now(); }
        else if (data && data.deadline) { this._arrangeRemain = Math.max(0, Math.ceil((data.deadline - Date.now()) / 1000)); this._arrangeRemainAt = Date.now(); }
        // bb_start 已先处理: 发牌动画由 onBbStart 负责, 摆牌弹窗由发牌结束回调(_showPhaseUI)统一弹出,
        // 这里不能再跑一遍 _dealSeq, 否则发了一半的牌会被收起重发(表现为发牌卡住)
        if (this._started) return;
        this._started = true;
        this._showGameUI();
        this.renderCards();
        var self = this;
        this._dealSeq(function () {
            if (!self._started) return;
            if (cc.vv.gameNetMgr.bbArranged) {
                self.hideArrangeUI();
                self.showTip("已提交，等待其他玩家…");
                return;
            }
            self.showArrangeUI(self._arrangeRemain);
        });
    },

    onArrangeOk: function (data) {
        var nm = cc.vv.gameNetMgr;
        if (data && data.seatIndex != null && nm.bbSeats && nm.bbSeats[data.seatIndex]) {
            nm.bbSeats[data.seatIndex].arranged = true;
            if (data.seatIndex == nm.bbMySeat) nm.bbArranged = true;
        }
        this.renderSeats();
        if (data && data.arrangedCount != null) {
            var total = (nm.bbSeats || []).length;
            this.showTip("已摆牌 " + data.arrangedCount + "/" + total + "，等待其他玩家…");
        }
    },

    // ===== 发牌动画: 各座位逐张亮出(先手上牌, 再发下家), 发完回调 =====
    // 记录牌位在场景中的原始位置/缩放, 动画结束后归位用
    _homeOf: function (slot) {
        if (!this._slotHome) this._slotHome = [];
        for (var i = 0; i < this._slotHome.length; ++i) if (this._slotHome[i].node === slot) return this._slotHome[i];
        var h = { node: slot, x: slot.x, y: slot.y, sx: slot.scaleX, sy: slot.scaleY };
        this._slotHome.push(h);
        return h;
    },
    // 屏幕中心的坐标(转换到 slot.parent 的节点空间)
    _centerIn: function (node) {
        var world = this.node.convertToWorldSpaceAR(cc.v2(0, 0));
        return node.parent.convertToNodeSpaceAR(world);
    },
    // 一张牌从桌面中心飞到牌位
    _flyCard: function (slot) {
        var h = this._homeOf(slot);
        var c = this._centerIn(slot);
        slot.stopAllActions();
        slot.setPosition(c.x, c.y);
        slot.setScale(h.sx * 0.55, h.sy * 0.55);
        slot.runAction(cc.sequence(
            cc.scaleTo(0.35, h.sx, h.sy),
            cc.moveTo(0.35, cc.v2(h.x, h.y))
        ));
    },
    // 单张翻牌: 压扁到 0 宽再弹回(牌面已在 renderCards 中换好)
    _flipOne: function (seatIdx, k) {
        var seat = this._seatNodes[seatIdx];
        if (!seat || !seat.slots[k]) return;
        var sl = seat.slots[k];
        var h = this._homeOf(sl);
        sl.stopAllActions();
        sl.setScale(h.sx * 0.02, h.sy);
        sl.runAction(cc.scaleTo(0.18, h.sx, h.sy));
    },
    // 归位所有牌位(下一局/动画被打断时)
    _resetSlotPos: function () {
        if (!this._slotHome) return;
        for (var i = 0; i < this._slotHome.length; ++i) {
            var h = this._slotHome[i];
            if (!cc.isValid(h.node)) continue;
            h.node.stopAllActions();
            h.node.setPosition(h.x, h.y);
            h.node.setScale(h.sx, h.sy);
        }
    },
    // 摆牌弹窗内 6 张手牌归位到场景静止位(每局打开弹窗时调用, 清掉上一局的拖拽落点)
    _resetArrangeHandPos: function () {
        var arr = this._arrangeHandSlots || [], home = this._arrangeHandHome || [];
        for (var i = 0; i < arr.length; ++i) {
            var n = arr[i], h = home[i];
            if (!n || !h || !cc.isValid(n)) continue;
            n.stopAllActions();
            n.setPosition(h.x, h.y);
            n.setScale(h.sx, h.sy);
        }
    },

    // 摆牌弹窗内所有牌位归位到场景静止位(底部手牌排 + 三道)
    _resetArrangeSlotPos: function () {
        this._resetArrangeHandPos();
        var rows = this._arrangeRows || [], homes = this._arrangeDaoHome || [];
        for (var d = 0; d < rows.length; ++d) {
            for (var k = 0; k < 2; ++k) {
                var n = rows[d].slots[k], h = homes[d] && homes[d][k];
                if (!n || !h || !cc.isValid(n)) continue;
                n.stopAllActions();
                n.setPosition(h.x, h.y);
                n.setScale(h.sx, h.sy);
            }
        }
    },

    _dealSeq: function (onDone) {
        this._stopDeal();
        this._dealing = true;
        var total = this._total || 2;
        var layout = this._layoutOf(total);
        var self = this;
        this._resetSlotPos();
        // 发牌看门狗: 任何一次中断(!_started/节点异常/动作异常)都不会让 _dealing 永久为 true 卡住后续流程
        if (this._dealGuard) { clearTimeout(this._dealGuard); this._dealGuard = null; }
        this._dealGuard = setTimeout(function () {
            self._dealGuard = null;
            if (!self._dealing) return;
            console.warn("[BB] 发牌超时兜底, 强制结束发牌");
            if (self._dealTimer) { clearTimeout(self._dealTimer); self._dealTimer = null; }
            self._dealing = false;
            try { onDone && onDone(); } catch (e) { console.error("[BB] 发牌兜底回调异常", e); }
        }, layout.length * 6 * 120 + 2500);
        // 先全部收起
        for (var o = 0; o < 6; ++o) {
            var sn = this._seatNodes[o];
            if (!sn || !sn.slots) continue;
            for (var k = 0; k < 6; ++k) if (sn.slots[k]) sn.slots[k].active = false;
        }
        // 每家依次发: 一家 6 张发完再发下一家, 每张间隔 120ms, 每张从桌面中心飞 0.35 秒
        var seatAt = 0, cardAt = 0, PER = 120;
        function tick() {
            self._dealTimer = null;
            if (!self._dealing) return;   // 已被看门狗/停止发牌终止: 直接结束链路, 避免重复发牌
            try {
                // 被打断也必须回调 onDone: 否则半发牌后既不显示阶段弹窗也不再继续, 表现为发牌卡住
                if (!cc.isValid(self.node)) { self._dealing = false; return; }
                if (!self._started) { self._dealing = false; try { onDone && onDone(); } catch (e) { } return; }
                if (seatAt >= layout.length) {
                    // 等最后一张落地再弹窗(飞行0.35秒,留少量余量)
                    self._dealTimer = setTimeout(function () {
                        self._dealing = false;
                        try { onDone && onDone(); } catch (e) { console.error("[BB] 发牌完成回调异常", e); }
                    }, 450);
                    return;
                }
                var seat = self._seatNodes[layout[seatAt]];
                if (seat && seat.root.active && seat.slots) {
                    //每发一家牌播一次发牌音效,避免逐张播放过于密集
                    if (cardAt === 0 && cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("deal.wav");
                    var sl = seat.slots[cardAt];
                    if (sl) {
                        var sp = sl.getComponent(cc.Sprite);
                        // 发牌阶段一律用牌背, 不能因为场景/上一次渲染残留的牌面而露出明牌
                        if (sp) sp.spriteFrame = self._cardBack || sp.spriteFrame;
                        sl.color = cc.Color.WHITE;
                        sl.active = true;
                        self._flyCard(sl);
                    }
                }
            } catch (e) {
                // 单张发牌异常不能中断发牌链, 否则 _dealing 永远为 true 表现为发牌卡住
                console.error("[BB] 发牌tick异常 seat=" + seatAt + " card=" + cardAt, e);
            }
            if (++cardAt >= 6) { cardAt = 0; ++seatAt; }
            self._dealTimer = setTimeout(tick, PER);
        }
        tick();
    },
    _stopDeal: function () {
        if (this._dealTimer) { clearTimeout(this._dealTimer); this._dealTimer = null; }
        if (this._dealGuard) { clearTimeout(this._dealGuard); this._dealGuard = null; }
        this._dealing = false;
    },

    // ===== 亮牌: 按道进行, 每轮所有玩家同时亮出同一道的两张牌(每道间隔 1 秒), 三道共 3 轮;
    //       某家六张全亮后显示该家牌型名称和倍率, 全部亮完再结算 =====
    onBbReveal: function (data) {
        if (!data || !data.players) return;
        // 结算弹窗已弹出: 亮牌阶段早已结束, 重复到达的亮牌推送不能再切回牌局界面(否则结算弹窗会被提前关掉)
        if (this._n.resultPanel && this._n.resultPanel.active) return;
        var nm = cc.vv.gameNetMgr;
        // 本局没参与的玩家(后进入/排队等下一局): 可以观看这一局的过程, 但只观看
        if (!this._started) {
            this._watching = true;
            this._started = true;
            this._final = false;
            this._myContinued = false;
            this._mySeat = 0;
            this._total = data.players.length;
            this._gameType = data.gameType || nm.bbGameType;
            if (data.seats) nm.bbSeats = data.seats;
            this._showGameUI();
            this.updateRoomInfo();
            this.renderSeats();
            console.log("[BB] 观战模式: 本局未参与, 只观看亮牌");
        }
        this._stopDeal();
        this.hideConfirmUI();
        this.hideArrangeUI();
        this._arranging = false;
        this._revealByGs = {};
        for (var i = 0; i < data.players.length; ++i) {
            var p = data.players[i];
            if (p.seat == null) continue;
            this._revealByGs[p.seat] = p;
        }
        var ORDER = data.players.length;
        var counts = [];
        for (var c = 0; c < ORDER; ++c) counts.push(0);
        this._revealCounts = counts;
        this._revealDone = false;
        this._revealRunning = true;
        this._resetSlotPos();
        this.renderCards();   // 亮牌开始: 全部盖着
        this.showTip("亮牌 第1张");
        console.log("[BB] 亮牌开始 座位顺序=" + Object.keys(this._revealByGs).join(",") + " 共" + ORDER + "家");
        var self = this;
        var PER = 1.6;   // 每道亮牌间隔 1.6 秒(看得清每一道)
        function finish() {
            if (self._revealDone) return;
            self._revealRunning = false;
            self._revealDone = true;
            self.showTip("");
            console.log("[BB] 亮牌结束");
            // 免摆: 有同花顺/炸弹先播牌型特效, 全部播完才弹结算弹窗
            var afterFx = function () {
                if (!cc.isValid(self.node)) return;
                if (self._watching) {
                    // 观战: 不弹牌型/结算弹窗, 亮完回准备界面等下一局
                    self.showTip("本局结束，等待下一局开始…");
                    self.scheduleOnce(function () {
                        if (!cc.isValid(self.node) || !self._watching) return;
                        self._watching = false;
                        self.showPrepareUI();
                    }, 1.2);
                    return;
                }
                // 亮牌(含同花顺/炸弹特效)结束后短暂停留, 然后跳结算弹窗
                self._fxRunning = true;   // 这段时间内到达的结算继续缓存
                self.scheduleOnce(function () {
                    if (!cc.isValid(self.node)) return;
                    self._fxRunning = false;
                    if (self._pendingOver || self._lastOver) {
                        var od = self._pendingOver || self._lastOver;
                        var oseq = self._pendingOver ? self._pendingSeq : self._lastOverSeq;
                        self._pendingOver = null;
                        self._lastOver = null;
                        self._pendingSeq = null;
                        self._lastOverSeq = null;
                        self.applyGameOver(od, oseq);
                    }
                }, 1.0);
            };
            try { self._playHandFx(afterFx); }
            catch (e) { console.log("[BB] 牌型特效异常:", e && e.message); self._fxRunning = false; self._clearFxNodes(); afterFx(); }
        }
        // 第 r 轮: 所有玩家同时亮出各自第 r+1 道的两张牌(一次亮两张)
        var DAO_NAMES = ["前道", "中道", "后道"];
        for (var r = 0; r < 3; ++r) {
            (function (rr) {
                self.scheduleOnce(function () {
                    if (!cc.isValid(self.node)) return;
                    var layout = self._layoutOf(self._total || 2);
                    for (var o = 0; o < ORDER; ++o) {
                        self._revealCounts[o] = (rr + 1) * 2;
                        if (layout[o] != null) { self._flipOne(layout[o], rr * 2); self._flipOne(layout[o], rr * 2 + 1); }
                    }
                    self.renderCards();
                    //亮每一道时播放亮牌音效
                    if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("select.wav");
                    self.showTip("亮牌 " + DAO_NAMES[rr]);
                    console.log("[BB] 亮牌 " + DAO_NAMES[rr] + " 全部 " + ORDER + " 家");
                }, rr * PER);
            })(r);
        }
        // 第 3 道(第5、6张)在 2*PER 亮出, 亮完后 1 秒出结算
        this.scheduleOnce(finish, 2 * PER + 1.0);
    },

    // ===== 手摆: 摆牌交互 =====
    showArrangeUI: function (remain) {
        this._arranging = true;
        this._wulongWarned = false;
        this._arrangeRemain = remain != null ? remain : (this._arrangeRemain || 0);
        if (this._arrangeRoot) {
            this._arrangeRoot.active = true;
            if (this._arrangeRoot.parent) this._arrangeRoot.setSiblingIndex(this._arrangeRoot.parent.children.length - 1);
        }
        this._resetArrangeSlotPos();   // 上一局被拖走的牌先归位, 否则第二局弹窗里会残留上一局的牌、异常中断的拖动落点
        this._arrangeTipActive = false;
        this._arrangeWarnSeq = (this._arrangeWarnSeq || 0) + 1;   // 作废上一局未到时的提示回调
        this._renderArrange();
        this.renderCards();
        this.showTip("请摆牌：拖手牌到前/中/后道位，道内牌可再拖动换位，点道内牌退回");
        this._startCountdown(this._leftOf(this._arrangeRemain, this._arrangeRemainAt), this._arrangeCd, function () {
            this.showTip("摆牌超时，系统自动摆牌");
            this.onAutoArrange();
        });
    },

    hideArrangeUI: function () {
        this._arranging = false;
        var di = this._dragInfo;
        this._dragInfo = null;
        if (di) this._dragTopEnd(di.node);
        if (this._dragTopNode) this._dragTopEnd(this._dragTopNode);
        this._resetArrangeSlotPos();   // 拖动中途被自动摆牌/阶段切换打断时, 把牌还原回牌位
        this._arrangeRemain = 0;
        if (this._arrangeRoot) this._arrangeRoot.active = false;
        if (this._arrangeCd) this.setStr(this._arrangeCd, "");
        this._stopCountdown();
    },

    // 手牌拖拽: 起始(仅摆牌阶段且未入道的牌可拖)
    onHandTouchStart: function (cardIdx, e) {
        this._dragInfo = null;
        if (!this._arranging) return;
        var nm = cc.vv.gameNetMgr;
        var id = (nm.bbMyCards || [])[cardIdx];
        if (id == null || this._isUsed(id)) return;
        // 摆牌弹窗打开时拖弹窗内手牌位(主屏手牌被弹窗盖住), 否则拖座位手牌
        var node = null;
        if (this._arrangeRoot && this._arrangeRoot.active && this._arrangeHandSlots) node = this._arrangeHandSlots[cardIdx];
        if (!node) {
            var seat = this._seatNodes[0];
            node = seat && seat.slots ? seat.slots[cardIdx] : null;
        }
        if (!node) return;
        // 原位必须在拖动前取: _homeOf 首次调用会缓存当前位置, 拖完再取会把落点当原位, 牌就永久停在落点
        var home = (this._arrangeHandSlots && this._arrangeHandSlots[cardIdx] === node && this._arrangeHandHome)
            ? this._arrangeHandHome[cardIdx] : this._homeOf(node);
        this._dragInfo = { idx: cardIdx, id: id, node: node, home: home, startPos: e.touch.getLocation(), moved: false };
        this._dragTopBegin(node);   // 拖到弹窗最上层
    },

    onHandTouchMove: function (cardIdx, e) {
        var di = this._dragInfo;
        if (!di || di.idx != cardIdx) return;
        if (!di.moved && e.touch.getLocation().sub(di.startPos).mag() > 20) di.moved = true;
        if (di.moved) di.node.setPosition(di.node.parent.convertToNodeSpaceAR(e.touch.getLocation()));
    },

    onHandTouchEnd: function (cardIdx, e) {
        var di = this._dragInfo;
        this._dragInfo = null;
        if (!di) return;
        this._dragTopEnd(di.node);   // 先还原父节点, 下面归位坐标才是相对原父节点的
        if (di.idx != cardIdx) return;
        if (!di.moved) {
            // 按下没移动(只有主屏手牌的旧路径会进这里): 手牌走点按逻辑, 道内牌只复位
            if (di.fromD == null) this.onHandTap(cardIdx);
            else {
                var h0 = di.home;
                if (h0) { di.node.stopAllActions(); di.node.setPosition(h0.x, h0.y); di.node.setScale(h0.sx, h0.sy); }
            }
            return;
        }
        var loc = e.touch.getLocation();
        var hit = this._hitDaoSlot(loc);
        if (hit) {
            // 先在副本上试放: 摆进去会违反 前<=中<=后 就不允许摆入
            var sel = [this._daoSel[0].slice(), this._daoSel[1].slice(), this._daoSel[2].slice()];
            this._applyPlace(sel, di, hit);
            var err = this._daoOrderErr(sel);
            if (err) {
                this._showArrangeWarn("摆不上：" + err);
                var hw = di.home || this._homeOf(di.node);
                if (hw) { di.node.stopAllActions(); di.node.setPosition(hw.x, hw.y); di.node.setScale(hw.sx, hw.sy); }
                this.renderCards();
                return;
            }
            this._daoSel = sel;
            this._wulongWarned = false;
        } else if (di.fromD != null) {
            // 拖出道外(手牌区/空白): 来源槽位清空, 回到手牌排
            this._daoSel[di.fromD][di.fromK] = null;
        }
        var h = di.home || this._homeOf(di.node); // 拖动的牌归位到原牌位
        if (h) { di.node.stopAllActions(); di.node.setPosition(h.x, h.y); di.node.setScale(h.sx, h.sy); }
        this.renderCards(); // 命中放入/未命中回位, 统一重排
    },

    // 把拖动的牌放进 sel 指定的牌位(sel 为固定 2 槽位的三道副本)
    // 放到玩家拖到的那个槽位: 目标槽位已有牌就被挤掉(不再属于任何道, 自动回到底部手牌排)
    _applyPlace: function (sel, di, hit) {
        var src = di.fromD != null ? sel[di.fromD] : null;
        var dst = sel[hit.d];
        if (!dst) return;
        if (src && di.fromD === hit.d) {
            // 同一条道内换位: 两个槽位直接互换(含拖到空槽)
            var t = src[di.fromK]; src[di.fromK] = src[hit.k]; src[hit.k] = t;
            return;
        }
        if (src) src[di.fromK] = null;   // 来源道原槽位清空
        dst[hit.k] = di.id;
    },

    // 命中检测: 遍历所有牌位, 取世界坐标离得最近的一个
    // 三道在场景里可能是竖排也可能是横排(用户可在编辑器调整), 不能假设固定方向
    _hitDaoSlot: function (worldLoc) {
        var rows = this._arrangeRows || [], homes = this._arrangeDaoHome || [];
        var best = null, bestDx = 0, bestDy = 0, bestDist = -1;
        for (var d = 0; d < rows.length; ++d) {
            var rh = homes[d];
            if (!rh) continue;
            for (var k = 0; k < 2; ++k) {
                var n = rows[d].slots[k];
                if (!n || !n.parent || !rh[k]) continue;
                var c = n.parent.convertToWorldSpaceAR(cc.v2(rh[k].x, rh[k].y));
                var dx = worldLoc.x - c.x, dy = worldLoc.y - c.y;
                var dist = dx * dx + dy * dy;
                if (bestDist < 0 || dist < bestDist) { bestDist = dist; bestDx = dx; bestDy = dy; best = { d: d, k: k }; }
            }
        }
        if (!best) return null;
        // 牌 84x116(半宽42/半高58): 中心外扩 24px 的椭圆内算命中, 否则视为没放进道里
        var rx = 66, ry = 82;
        if ((bestDx * bestDx) / (rx * rx) + (bestDy * bestDy) / (ry * ry) > 1) return null;
        return best;
    },

    // 拖动时把牌临时提到弹窗根节点最上层: 手牌、三道牌的父节点各不相同,
      // 只在本父节点内提层, 拖过其他道时仍会被后面的道/底板遮住
    _dragTopBegin: function (node) {
        if (!node || !node.parent || !this._arrangeRoot) return;
        if (!cc.isValid(node) || !cc.isValid(this._arrangeRoot)) return;
        if (node.parent === this._arrangeRoot) { node.setSiblingIndex(this._arrangeRoot.children.length - 1); return; }
        node._bbOldParent = node.parent;
        var wp = node.convertToWorldSpaceAR(cc.v2(0, 0));
        node.parent = this._arrangeRoot;
        node.setPosition(this._arrangeRoot.convertToNodeSpaceAR(wp));   // 换父节点后保持视觉位置不变
        node.setSiblingIndex(this._arrangeRoot.children.length - 1);
        this._dragTopNode = node;
    },
    // 松手后还原回原父节点(归位坐标都是相对原父节点的, 必须先还原父节点再 setPosition)
    _dragTopEnd: function (node) {
        if (node && this._dragTopNode === node) this._dragTopNode = null;
        if (!node || !cc.isValid(node)) return;
        var old = node._bbOldParent;
        node._bbOldParent = null;
        if (!old || !cc.isValid(old) || node.parent === old) return;
        node.parent = old;
    },

    // 摆牌弹窗拖拽: 监听整个弹窗根节点, 按触点命中的手牌位解析(不依赖每张牌节点自身能否命中)
    _bindArrangeDrag: function () {
        var root = this._arrangeRoot;
        if (!root || root._bbDragBound) return;
        root._bbDragBound = true;
        root.on(cc.Node.EventType.TOUCH_START, this._onArrDragStart, this);
        root.on(cc.Node.EventType.TOUCH_MOVE, this._onArrDragMove, this);
        root.on(cc.Node.EventType.TOUCH_END, this._onArrDragEnd, this);
        root.on(cc.Node.EventType.TOUCH_CANCEL, this._onArrDragCancel, this);
    },

    _onArrDragStart: function (e) {
        if (!this._arranging) return;
        // 每次按下都强制清掉上一次的拖动状态: 上一轮即使异常中断没走完 END, 也不会把后续拖动全部卡死
        this._dragInfo = null;
        if (this._dragTopNode) { this._dragTopEnd(this._dragTopNode); this._resetArrangeSlotPos(); }   // 兜底还原上次没还原的父节点
        var loc = e.touch.getLocation();
        // 道内已有牌: 优先拖它出来换位(命中按静止坐标判定)
        var hd = this._hitDaoSlot(loc);
        if (hd && this._daoSel[hd.d] && this._daoSel[hd.d][hd.k] != null) { this.onDaoTouchStart(hd.d, hd.k, e); return; }
        var idx = this._hitHandSlot(loc);
        if (idx >= 0) this.onHandTouchStart(idx, e);
    },

    _onArrDragMove: function (e) {
        var di = this._dragInfo;
        if (!di || !this._arranging) return;
        this.onHandTouchMove(di.idx, e);
    },

    _onArrDragEnd: function (e) {
        var di = this._dragInfo;
        if (!di) {
            // 没有拖起任何牌 = 点按: 道内牌点哪张退哪张, 手牌位按点按逻辑摆入
            var loc0 = e.touch.getLocation();
            var dh = this._hitDaoSlot(loc0);
            if (dh && this._daoSel[dh.d] && this._daoSel[dh.d][dh.k] != null) { this.onDaoTap(dh.d, dh.k); return; }
            var hi = this._hitHandSlot(loc0);
            if (hi >= 0) this.onHandTap(hi);
            return;
        }
        if (!di.moved) {
            // 按下没移动: 道内牌点哪张退哪张; 手牌走点按摆入
            this._dragInfo = null;
            this._dragTopEnd(di.node);
            var hm = di.home;
            if (hm) { di.node.stopAllActions(); di.node.setPosition(hm.x, hm.y); di.node.setScale(hm.sx, hm.sy); }
            if (di.fromD == null) this.onHandTap(di.idx);
            else this.onDaoTap(di.fromD, di.fromK);
            return;
        }
        this.onHandTouchEnd(di.idx, e);
    },

    // 触摸被系统打断(来电/切后台): 只复位, 不做点按/摆放判定
    _onArrDragCancel: function () {
        var di = this._dragInfo;
        this._dragInfo = null;
        if (!di) return;
        this._dragTopEnd(di.node);
        var h = di.home;
        if (h) { di.node.stopAllActions(); di.node.setPosition(h.x, h.y); di.node.setScale(h.sx, h.sy); }
        this.renderCards();
    },

    // 触点命中的弹窗手牌位(外扩10px, 手指压边也能拖)
    _hitHandSlot: function (worldLoc) {
        var arr = this._arrangeHandSlots || [];
        for (var i = 0; i < arr.length; ++i) {
            var n = arr[i];
            if (!n || !n.activeInHierarchy) continue;
            var box = n.getBoundingBoxToWorld();
            box.x -= 10; box.y -= 10; box.width += 20; box.height += 20;
            if (box.contains(worldLoc)) return i;
        }
        return -1;
    },

    onHandTap: function (cardIdx) {
        if (!this._arranging) return;
        var nm = cc.vv.gameNetMgr;
        var myCards = nm.bbMyCards || [];
        var id = myCards[cardIdx];
        if (id == null) return;
        // 已在某道 → 从该槽位摘回手牌
        for (var d = 0; d < 3; ++d) {
            var sel0 = this._daoSel[d];
            if (sel0[0] === id) { sel0[0] = null; this._wulongWarned = false; this.renderCards(); return; }
            if (sel0[1] === id) { sel0[1] = null; this._wulongWarned = false; this.renderCards(); return; }
        }
        for (var d2 = 0; d2 < 3; ++d2) {
            var fk = this._daoFreeSlot(this._daoSel[d2]);
            if (fk < 0) continue;
            // 试放: 违反 后≥中≥前 则不摆入, 换下一条道
            var sel = [this._daoSel[0].slice(), this._daoSel[1].slice(), this._daoSel[2].slice()];
            sel[d2][fk] = id;
            if (!this._daoOrderOkWith(sel)) continue;
            this._daoSel = sel;
            this._wulongWarned = false;
            this.renderCards();
            return;
        }
        if (this._daoFull(this._daoSel[0]) && this._daoFull(this._daoSel[1]) && this._daoFull(this._daoSel[2])) {
            this.showTip("三道已满，点道内牌可退回");
        } else {
            this._showArrangeWarn("摆不上：必须 后道 ≥ 中道 ≥ 前道");
        }
    },

    // 点道内牌退回: 传 k 只退这一张, 不传整道退回
    onDaoTap: function (d, k) {
        if (!this._arranging) return;
        var sel = this._daoSel[d];
        if (!sel) return;
        if (k != null) {
            if (sel[k] == null) return;
            sel[k] = null;
        } else if (sel[0] == null && sel[1] == null) {
            return;
        } else {
            this._daoSel[d] = [null, null];
        }
        this._wulongWarned = false;
        this.renderCards();
    },

    // 道内已摆好的牌再次拖起: 记录来源道/牌位与原坐标, 落点统一由根节点 _onArrDragEnd 处理
    onDaoTouchStart: function (d, k, e) {
        if (!this._arranging || this._dragInfo) return;
        var sel = this._daoSel && this._daoSel[d];
        var id = sel ? sel[k] : null;
        if (id == null) return;
        var row = (this._arrangeRows || [])[d];
        var node = row && row.slots ? row.slots[k] : null;
        if (!node) return;
        var homeRow = this._arrangeDaoHome ? this._arrangeDaoHome[d] : null;
        this._dragInfo = {
            idx: (cc.vv.gameNetMgr.bbMyCards || []).indexOf(id),
            id: id, node: node,
            home: homeRow ? homeRow[k] : this._homeOf(node),
            fromD: d, fromK: k, startPos: e.touch.getLocation(), moved: false
        };
        this._dragTopBegin(node);   // 拖到弹窗最上层
    },

    _renderArrange: function () {
        if (!this._arrangeRows) return;
        for (var d = 0; d < 3; ++d) {
            var row = this._arrangeRows[d];
            var sel = this._daoSel[d] || [];
            for (var k = 0; k < 2; ++k) {
                var cn = row.slots[k];
                if (!cn) continue;
                if (sel[k] != null) {
                    cn.active = true;
                    var sp = cn.getComponent(cc.Sprite);
                    if (sp) sp.spriteFrame = this.frameOf(sel[k]) || this._cardBack || null;
                    cn.color = cc.Color.WHITE;
                } else {
                    cn.active = false;
                }
            }
            this.setStr(row.desc, this._daoFull(sel) ? this.daoDescText(sel[0], sel[1]) : "");
        }
        // 弹窗内 6 张手牌: 全部亮牌面, 已入道的置灰不可再拖
        if (this._arrangeHandSlots) {
            var myCards = cc.vv.gameNetMgr.bbMyCards || [];
            for (var h = 0; h < this._arrangeHandSlots.length; ++h) {
                var hn = this._arrangeHandSlots[h];
                if (!hn) continue;
                var hid = myCards[h];
                if (hid == null) { hn.active = false; continue; }
                // 已入道的牌直接从手牌排上收起: 否则道位和手牌排会各显示一张, 看起来像"拖过去变成两张"
                var used = this._isUsed(hid);
                hn.active = !used;
                if (used) continue;
                var hsp = hn.getComponent(cc.Sprite);
                if (hsp) hsp.spriteFrame = this.frameOf(hid) || this._cardBack || null;
                hn.color = cc.Color.WHITE;
            }
        }
        // 摆满三道后校验 前<=中<=后, 违反即提示将判乌龙
        if (this._arrangeTip && !this._arrangeTipActive) {
            this.setStr(this._arrangeTip, this._daoOrderOkLocal()
                ? "拖手牌到道位放入, 道内牌可再拖动换位, 点道内牌退回; 前道 ≤ 中道 ≤ 后道"
                : "警告: 当前摆法 前>中 或 中>后, 将判乌龙三道全输!");
        }
    },

    // 客户端道型展示(与服务端 evalDao/daoDesc 一致)
    daoDescText: function (c1, c2) {
        var r1 = this.rankOf(c1), r2 = this.rankOf(c2);
        if (r1 == r2) {
            var names = { 11: "J", 12: "Q", 13: "K", 14: "A" };
            return "宝" + (names[r1] || r1);
        }
        return ((this.dianVal(r1) + this.dianVal(r2)) % 10) + "点";
    },

    onConfirmArrange: function () {
        if (!this._arranging) return;
        if (!this._daoFull(this._daoSel[0]) || !this._daoFull(this._daoSel[1]) || !this._daoFull(this._daoSel[2])) {
            this.showTip("请摆满三道(每道2张)");
            return;
        }
        // 摆法违反 前<=中<=后: 首次点击仅警告, 再点一次才确认提交(提交后判乌龙三道全输)
        if (!this._daoOrderOkLocal() && !this._wulongWarned) {
            this._wulongWarned = true;
            this.showTip("摆法违反前≤中≤后, 将判乌龙全输! 再点一次确定提交");
            return;
        }
        cc.vv.net.send("bb_arrange", {
            front: this._daoSel[0].slice(),
            mid: this._daoSel[1].slice(),
            back: this._daoSel[2].slice()
        });
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("sort.wav");   //确认摆牌音效
        cc.vv.gameNetMgr.bbArranged = false;
        this._arranging = false;
        if (this._arrangeRoot) this._arrangeRoot.active = false;
        this._stopCountdown();
        if (this._n.countdownLabel) this.setStr(this._n.countdownLabel, "");
        this.showTip("已提交，等待其他玩家…");
    },

    onAutoArrange: function () {
        if (!this._arranging) return;
        var nm = cc.vv.gameNetMgr;
        var best = this.autoArrangeLocal(nm.bbMyCards || []);
        if (best) { this._daoSel = best; this._wulongWarned = false; this.renderCards(); }
        else this.showTip("自动摆牌失败，请手动摆牌");
    },

    // 单道评估(与服务端 evalDao 一致)
    // 宝: 对子, rank 为对子点数, suit 取其中花色大的
    // 散牌: point=(p1+p2)%10, sum=两张点数原始和(同点比和用), maxRank/maxSuit=最大单张点数牌
    _evalD: function (c1, c2) {
        var r1 = this.rankOf(c1), r2 = this.rankOf(c2);
        if (r1 == r2) {
            return { bao: true, rank: r1, suit: Math.min(this.suitOf(c1), this.suitOf(c2)), cards: [c1, c2] };
        }
        var v1 = this.dianVal(r1), v2 = this.dianVal(r2);
        var big = r1 > r2 ? this.suitOf(c1) : this.suitOf(c2);
        return {
            bao: false, point: (v1 + v2) % 10, sum: v1 + v2,
            maxRank: r1 > r2 ? r1 : r2, maxSuit: big, cards: [c1, c2]
        };
    },
    // 花色比较: 黑桃>红桃>梅花>方片(suit 越小越大)
    _cmpSuit: function (s1, s2) {
        return s1 < s2 ? 1 : (s1 > s2 ? -1 : 0);
    },
    // 单道比较(与服务端 cmpDao 一致): >0 a胜, <0 b胜, 0 和
    // 1) 宝 vs 散牌 → 宝胜
    // 2) 宝 vs 宝: 比对子点数, 相同比花色
    // 3) 散牌 vs 散牌: 比点数(9最大/0最小), 点数相同:
    //    0点: 后台配置 1=比最大牌花色, 2=和
    //    非0点: 总和不相等比总和; 总和相等按后台配置 1=比最大牌花色; 3=先比最大单张点数再比最大牌花色; 2=和
    _cmpD: function (a, b) {
        if (a.bao != b.bao) return a.bao ? 1 : -1;
        if (a.bao) {
            if (a.rank != b.rank) return a.rank > b.rank ? 1 : -1;
            return this._cmpSuit(a.suit, b.suit);
        }
        if (a.point != b.point) return a.point > b.point ? 1 : -1;
        var mode = this._tdMode || 3;
        if (a.point == 0) {
            if (mode == 2) return 0;
            return this._cmpSuit(a.maxSuit, b.maxSuit);
        }
        if (a.sum != b.sum) return a.sum > b.sum ? 1 : -1;
        if (mode == 2) return 0;
        if (mode != 3) return this._cmpSuit(a.maxSuit, b.maxSuit);
        if (a.maxRank != b.maxRank) return a.maxRank > b.maxRank ? 1 : -1;
        return this._cmpSuit(a.maxSuit, b.maxSuit);
    },
    // 同点比较模式(后台 tai_rules.tongdian_mode): 1=比最大牌花色 2=和(打平) 3=先比最大单张点数再比花色
    // 老配置 tongdian_flower 兼容: 1→1(比花色), 0→3(老的"和"改为完整比法)
    _applyBbConf: function (data) {
        var nm = cc.vv && cc.vv.gameNetMgr;
        var conf = data && data.conf;
        if (!conf && nm) conf = nm.conf;
        var tr = conf ? conf.taiRules : null;
        if (tr != null && typeof tr === "string") { try { tr = JSON.parse(tr); } catch (e) { tr = null; } }
        var m = tr ? Number(tr.tongdian_mode) : NaN;
        if (!(m >= 1 && m <= 3)) {
            m = tr && tr.tongdian_flower != null ? (Number(tr.tongdian_flower) ? 1 : 3) : 3;
        }
        this._tdMode = m;
        if (cc.vv && cc.vv.gameNetMgr) cc.vv.gameNetMgr.bbTongdianMode = m;
    },
    // 当前三道是否满足 前<=中<=后(未摆满视为合法, 不告警)
    _daoOrderOkLocal: function () {
        return this._daoOrderOkWith(this._daoSel);
    },
    // 三道顺序检查: 只有摆满 2 张的道才参与比较(拖入某道的第 2 张时, 才和已成组的道对比)
    // 返回 null = 合法; 否则返回具体违规原因(仅文字提示用)
    _daoOrderErr: function (sel) {
        var names = ["前道", "中道", "后道"], vals = [];
        for (var d = 0; d < 3; ++d) {
            var a = sel[d];
            vals.push(this._daoFull(a) ? this._evalD(a[0], a[1]) : null);
        }
        for (var i = 0; i < 3; ++i) {
            if (!vals[i]) continue;
            for (var j = i + 1; j < 3; ++j) {
                if (!vals[j]) continue;
                if (this._cmpD(vals[i], vals[j]) > 0) return names[i] + "不能大于" + names[j];
            }
        }
        return null;
    },
    _daoOrderOkWith: function (sel) {
        return this._daoOrderErr(sel) == null;
    },
    // 弹窗上方提示(仅文字): 1 秒后恢复常规提示
    _showArrangeWarn: function (txt) {
        if (!this._arrangeTip) return;
        var self = this;
        this._arrangeTipActive = true;
        this._arrangeWarnSeq = (this._arrangeWarnSeq || 0) + 1;
        var seq = this._arrangeWarnSeq;
        this.setStr(this._arrangeTip, txt);
        // 场景中排在提示后面的底板会盖住文字: 提到最上层(只改层级, 不动位置和尺寸)
        if (this._arrangeTip.parent) this._arrangeTip.setSiblingIndex(this._arrangeTip.parent.children.length - 1);
        this.scheduleOnce(function () {
            if (seq !== self._arrangeWarnSeq || !self._arranging) return;
            self._arrangeTipActive = false;
            self._renderArrange();
        }, 1);
    },

    // 本地版 autoArrange(与服务端一致: 枚举90种, 前<=中<=后, 取(后,中,前)最大)
    autoArrangeLocal: function (cards) {
        if (!cards || cards.length != 6) return null;
        var evalD = this._evalD.bind(this);
        var cmpD = this._cmpD.bind(this);
        var best = null, bestCards = null;
        var idx = [0, 1, 2, 3, 4, 5], pairs = [];
        for (var a = 0; a < 6; ++a) for (var b = a + 1; b < 6; ++b) pairs.push([a, b]);
        function better(x, y) {
            if (!y) return true;
            for (var d = 2; d >= 0; --d) { var c = cmpD(x[d], y[d]); if (c != 0) return c > 0; }
            return false;
        }
        for (var i = 0; i < pairs.length; ++i) {
            var p1 = pairs[i];
            var rest1 = idx.filter(function (x) { return x != p1[0] && x != p1[1]; });
            for (var j = 0; j < rest1.length; ++j) {
                for (var k = j + 1; k < rest1.length; ++k) {
                    var p2 = [rest1[j], rest1[k]];
                    var p3 = rest1.filter(function (x) { return x != p2[0] && x != p2[1]; });
                    var daos = [evalD(cards[p1[0]], cards[p1[1]]), evalD(cards[p2[0]], cards[p2[1]]), evalD(cards[p3[0]], cards[p3[1]])];
                    var perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
                    for (var m = 0; m < perms.length; ++m) {
                        var pm = perms[m];
                        var arr = [daos[pm[0]], daos[pm[1]], daos[pm[2]]];
                        if (cmpD(arr[0], arr[1]) > 0 || cmpD(arr[1], arr[2]) > 0) continue;
                        if (better(arr, best)) {
                            best = arr;
                            bestCards = [arr[0].cards.slice(), arr[1].cards.slice(), arr[2].cards.slice()];
                        }
                    }
                }
            }
        }
        if (!bestCards && cards.length == 6) {
            bestCards = [[cards[0], cards[1]], [cards[2], cards[3]], [cards[4], cards[5]]];
        }
        return bestCards;
    },

    // ===== 结算 =====
    // 收到结算时若正在依次亮牌, 先缓存, 亮完再弹
    onGameOver: function (detail) {
        this._overAt = Date.now();   // 本机收到结算推送的时刻(结算倒计时统一起点)
        var seq = this._roundSeq;    // 记下结算所属的局, 延迟播放时若已开新局则丢弃
        this._lastOver = detail;     // 兜底缓存: 特效流程异常时也能弹出结算
        this._lastOverSeq = seq;
        if (this._fxRunning || this._revealRunning || (!this._revealDone && this._revealCounts)) {
            this._pendingOver = detail;
            this._pendingSeq = seq;
            return;
        }
        this.applyGameOver(detail, seq);
        return;
    },

    applyGameOver: function (detail, seq) {
        // 上一局的结算延迟到达时本局可能已开始: 直接丢弃, 否则会把 _started 置 false 打断新局发牌
        if (seq != null && seq !== this._roundSeq) return;
        var nm = cc.vv.gameNetMgr;
        // 已点确定/洗牌后重复到达的同一局结算推送(补发/重发)直接忽略, 避免结算弹窗再次弹出
        var round = nm.numOfGames || 0;
        if (this._myContinued && this._overRound === round) return;
        var results = [];
        if (detail instanceof Array) results = detail;
        else if (detail && detail.results) results = detail.results;
        // 本局没参与的玩家(排队等下一局/中途进来的): 不弹上一局的结算
        var meUid = cc.vv.userMgr && cc.vv.userMgr.userId;
        var joined = false;
        for (var j = 0; j < results.length; ++j) {
            if (results[j] && results[j].userid == meUid) { joined = true; break; }
        }
        if (!joined) {
            this._pendingOver = null;
            this.showTip("本局已结束，等待下一局开始…");
            return;
        }
        this._overRound = round;
        //结算音效: 自己赢播 win, 输播 lose; 宝宝豆有加扣时再补一声 dropCoin
        var myDelta = 0;
        for (var m = 0; m < results.length; ++m) {
            if (results[m] && results[m].userid == meUid) { myDelta = results[m].delta || 0; break; }
        }
        if (cc.vv && cc.vv.audioMgr) {
            cc.vv.audioMgr.playSFX(myDelta > 0 ? "win.wav" : "lose.wav");
            if (myDelta != 0) {
                var selfCd = this;
                this.scheduleOnce(function () {
                    if (cc.isValid(selfCd.node) && cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("dropCoin.wav");
                }, 0.5);
            }
        }
        var bankerGs = nm.bbBankerSeat;

        // 结算文字兜底行: 自己行=本局净输赢+总分; 其他行=「我与该玩家」之间的本局结算(不是他们的本局结果)
        var myGs0 = nm.bbMySeat;
        if ((myGs0 == null || myGs0 < 0) && nm.bbSeats) {
            for (var gz = 0; gz < nm.bbSeats.length; ++gz) {
                if (nm.bbSeats[gz] && nm.bbSeats[gz].userid == meUid) { myGs0 = gz; break; }
            }
        }
        var pairNet = function (uid) {
            var gs = -1, dets = nm.bbOverDetails;
            if (!dets || !nm.bbSeats || myGs0 == null || myGs0 < 0) return null;
            for (var g2 = 0; g2 < nm.bbSeats.length; ++g2) {
                if (nm.bbSeats[g2] && nm.bbSeats[g2].userid == uid) { gs = g2; break; }
            }
            if (gs < 0) return null;
            var sum = 0, found = false;
            for (var dd = 0; dd < dets.length; ++dd) {
                var dt = dets[dd];
                if (!((dt.a == myGs0 && dt.b == gs) || (dt.a == gs && dt.b == myGs0))) continue;
                found = true;
                if (dt.winner == gs) sum += (dt.score || 0); else sum -= (dt.score || 0);
            }
            return found ? sum : null;
        };

        var lines = [];
        for (var i = 0; i < results.length; ++i) {
            var r = results[i];
            if (!r) continue;
            var name = (r.name || "") + (nm.bbBankerMode && nm.bbSeats && nm.bbSeats[bankerGs] && nm.bbSeats[bankerGs].userid == r.userid ? "(庄)" : "");
            var desc = "";
            if (r.daos) {
                //结算弹窗不显示倍率, 倍率已在分数加减里体现
                desc = (r.daos || []).map(function (d) { return d.desc; }).join(" ");
                if (r.wulong) desc = "乌龙 " + desc;
            } else if (r.typeName) {
                desc = r.typeName || "";
            }
            var d0 = r.delta || 0;
            if (r.userid == meUid) {
                lines.push(name + "  " + desc + "  本局 " + (d0 > 0 ? "+" : "") + d0 + "  (总:" + (r.totalscore != null ? r.totalscore : 0) + ")");
            } else {
                var pn = pairNet(r.userid);
                lines.push(name + "  " + desc + "  与我 " + (pn == null ? "0" : (pn > 0 ? "+" : "") + pn));
            }
        }

        // 整场最后一局判定: game_over 载荷只有 results, 整场标记在 gameNetMgr.overData.endinfo 里
        var overDataNow = nm.overData || {};
        var isFinal = !!(detail && detail.endinfo) || !!overDataNow.endinfo ||
            (nm.maxNumOfGames > 0 && nm.numOfGames >= nm.maxNumOfGames);
        // 房间剩余人数不足两人(其他玩家宝宝豆不足/主动退出): 本局结算后无法续局, 弹窗显示「退出房间」
        var roomEnd = !!(detail && detail.roomEnd) || !!overDataNow.roomEnd;
        if (isFinal) roomEnd = false;
        this._final = isFinal;
        this._roomEnd = roomEnd;
        this._arranging = false;
        this.hideArrangeUI();
        this.hideConfirmUI();

        if (this._n.resultPanel) this._n.resultPanel.active = true;
        // 按钮贴图再确认一次(父节点刚激活时重新赋值可避免首帧只剩文字)
        this._ensureSettleBtnFrames();
        // 按钮激活放在明牌渲染之前: 渲染任何异常都不能影响按钮显示
        // 按钮文字已固化在场景里, 这里只控制显示/隐藏, 不改文字
        // 整场最后一局也先弹本局结算: 「确定」或倒计时结束后再弹总结算弹窗, 退出按钮只在总结算里出现
        // 场景里没有独立的退出按钮节点, 两段结算复用 settleAgainBtn: 第一段文字「确定」, 第二段改成「退出」
        // 房间无法续局时直接把按钮改成「退出房间」, 点击即离房
        this._setSettleActionBtn(roomEnd ? "退出房间" : "确定", roomEnd);
        if (this._resultShuffleBtn) { this._resultShuffleBtn.active = !isFinal && !roomEnd; this._resultShuffleBtn.opacity = 255; }
        if (this._n.resultExitBtn) this._n.resultExitBtn.active = false;
        this._settle1Done = !isFinal;   // 整场结束: 本局结算还没看完
        var title = nm.maxNumOfGames > 0
            ? ("第 " + nm.numOfGames + "/" + nm.maxNumOfGames + " 局结算")
            : ("第 " + nm.numOfGames + " 局结算");
        this.setStr(this._n.resultTitle, title);
        this._setSettleContentStyle(this._settleFontSize, this._settleLineHeight, this._settleContentY);
        this.setStr(this._n.resultContent, lines.join("\n"));
        this._lastLines = lines.slice();
        // 结算明牌: 只显示与本人相关的行(明牌按牌型排列 + 牌型文字 + 分数)
        // 明细来自 gameNetMgr.bbOverDetails(game_over 事件只带 results 数组)
        var cardsOk = false;
        try {
            cardsOk = this._renderSettleCards(results, nm.bbOverDetails || null);
        } catch (e) { console.error("[BB] 结算明牌渲染异常", e); }
        // 明牌行渲染失败(如座位信息缺失)时退回整段文字, 避免弹窗空白
        if (this._n.resultContent) this._n.resultContent.active = !cardsOk;
        if (this._n.resultList) this._n.resultList.active = false;
        if (this._n.settleWin) this._n.settleWin.active = false;
        if (this._n.settleLose) this._n.settleLose.active = false;
        if (this._n.btnReady) this._n.btnReady.active = false;
        // 牌局已开始: 右下角退出房间按钮保持隐藏(退出仅在未开局/整场结算弹窗内提供)
        if (this._exitRoomBtn) this._exitRoomBtn.active = false;
        if (this._n.exitBtn) this._n.exitBtn.active = false;
        if (this._n.dissolveBtn) this._n.dissolveBtn.active = false;
        if (this._n.readyBtn) this._n.readyBtn.active = false;
        this._started = false;
        this.showTip(roomEnd ? "其他玩家已离开，房间无法继续" : "");
        // 本局进行中点过退出房间: 结算弹出后再清退, 玩家至少能看到本局结果
        if (this._exitPending) {
            this._exitPending = false;
            var selfX = this;
            this.scheduleOnce(function () {
                if (!cc.isValid(selfX.node) || selfX._leaving) return;
                selfX.onExitRoom();
            }, 1.2);
        }
        // 单局结算: 倒计时结束前未点继续 → 自动进入下一把(服务端计时为准)
        // 整场最后一局: 倒计时到点 → 弹总结算弹窗, 不自动退出房间
        this._stopCountdown();
        if (this._settleCd) this.setStr(this._settleCd, "");
        // 房间人数不足时不再自动续局(服务端也不会推进下一局), 不启动结算倒计时, 等玩家点「退出房间」
        if (this._settleCd && !roomEnd) {
            // 倒计时全房统一: 锚点是收到结算推送的时刻(onGameOver已记录_overAt),
            // 秒数完全来自后台「结算倒计时(秒)」配置(服务端下发), 代码里不再兜底任何固定秒数
            var rem;
            if (detail && detail.resultRemainTotal != null) rem = this._leftOf(detail.resultRemainTotal, this._overAt);
            else if (detail && detail.resultRemain != null) rem = detail.resultRemain;
            else rem = nm.bbResultRemain != null ? nm.bbResultRemain : (nm.bbResultTimeout || 0);
            var self = this;
            this._startCountdown(rem, this._settleCd, function () {
                if (this._final) { this._showFinalSummary(); return; }
                if (this._n.resultPanel) this._n.resultPanel.active = false;
                this._settleClosedAt = Date.now();   // 计时起点: 结算关掉到收到下一局开局之间耗时
                if (!this._myContinued) { this._myContinued = true; cc.vv.net.send("bb_continue"); this._startContinueRetry(); }
                this.showTip("已准备，等待其他玩家…");
            });
        }
    },

    // 结算弹窗动作按钮(场景里的 settleAgainBtn): 第一段显示「确定」, 第二段(整场结算)同一按钮改成「退出」并居中
    _setSettleActionBtn: function (text, center) {
        var btn = this._n.resultCloseBtn;
        if (!btn || !cc.isValid(btn)) return;
        if (!this._settleCloseHome) this._settleCloseHome = { x: btn.x, y: btn.y };
        btn.active = true;
        btn.opacity = 255;
        btn.setPosition(center ? 0 : this._settleCloseHome.x, this._settleCloseHome.y);
        // 场景里按钮文字 Label 挂在子节点上(settleAgainBtnLabel/New Label), 不能用 setStr 取节点自身组件
        var lb = btn.getComponentInChildren(cc.Label);
        if (lb) lb.string = text;
    },

    // 结算弹窗两个按钮底图兜底: 首次弹出时贴图还没就绪会只剩文字。
    _ensureSettleBtnFrames: function () {
        // 登录阶段已预载 resources/images, 这里优先用缓存里的 SpriteFrame;
        // 纹理没就绪(宽高为0)时不能赋给 Sprite, 否则首帧就是空白按钮, 先保留场景自带底图等异步加载完成
        var self = this;
        if (!this._settleBtnFrames) this._settleBtnFrames = {};
        if (!this._settleBtnSceneFrames) this._settleBtnSceneFrames = {};
        var pairs = [[this._n.resultCloseBtn, "images/other/按钮12", "ok"], [this._resultShuffleBtn, "images/other/按钮11", "shuffle"]];
        pairs.forEach(function (p) {
            var btn = p[0];
            if (!btn || !cc.isValid(btn)) return;
            var sp = btn.getComponent(cc.Sprite);
            if (!sp) return;
            sp.enabled = true;
            // 记住场景原始底图: 资源图没加载好时用它兜底, 保证第一次弹出就有底图
            if (self._settleBtnSceneFrames[p[2]] === undefined) self._settleBtnSceneFrames[p[2]] = sp.spriteFrame;
            var cached = self._settleBtnFrames[p[2]];
            if (cached) { sp.spriteFrame = cached; return; }
            // 固定 CUSTOM 尺寸模式并记住场景尺寸: 赋值后恢复, 按钮大小仍由场景控制
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            var w = btn.width, h = btn.height;
            var applyFrame = function (sf) {
                if (!sf || !sf.texture || !sf.texture.width) return; //纹理未就绪不赋值
                self._settleBtnFrames[p[2]] = sf;
                if (cc.isValid(sp) && cc.isValid(btn)) {
                    sp.spriteFrame = sf;
                    btn.width = w; btn.height = h;
                }
            };
            var sf = cc.resources.get(p[1], cc.SpriteFrame);
            if (sf && sf.texture && sf.texture.width > 0) { applyFrame(sf); return; }
            var fallback = self._settleBtnSceneFrames[p[2]];
            if (fallback) sp.spriteFrame = fallback;
            cc.resources.load(p[1], cc.SpriteFrame, function (err, sf2) {
                if (err || !sf2) { console.log("[BB] 结算按钮贴图加载失败:", p[1], err && err.message); return; }
                applyFrame(sf2);
            });
        });
    },

    // ===== 结算明牌: 容器与行模板已固化在场景 settlePanel/bbSettleCards 下(可在编辑器调位置) =====
    _ensureSettleCards: function () {
        if (!this._n.resultPanel) return null;
        if (this._settleCardsRoot && cc.isValid(this._settleCardsRoot)) return this._settleCardsRoot;
        var panel = this._n.resultPanel;
        var root = this.findNode(panel, "bbSettleCards");
        if (!root) {
            root = new cc.Node("bbSettleCards");
            root.parent = panel;
            root.setContentSize(800, 300);
        }
        // 固定视口 + ScrollView: 行多时上下滚动, 不会盖住底部「确定/洗牌」按钮
        // 视口宽度按场景行模板内容实际占用算: 视口太窄时 rowScore(分数)会被 Mask 裁掉, 看着像没有积分
        var VIEW_W = 800, VIEW_H = 300;
        var rowTplNode = this.findNode(root, "bbSettleRow");
        if (rowTplNode && rowTplNode.children) {
            for (var ci0 = 0; ci0 < rowTplNode.children.length; ++ci0) {
                var cn0 = rowTplNode.children[ci0];
                var ext = Math.abs(cn0.x) + cn0.width / 2 + 10;
                if (ext * 2 > VIEW_W) VIEW_W = Math.ceil(ext * 2);
            }
        }
        var scrollNode = (root.parent && root.parent.name === "bbSettleScroll") ? root.parent : null;
        if (!scrollNode) {
            scrollNode = new cc.Node("bbSettleScroll");
            scrollNode.parent = panel;
            scrollNode.setContentSize(VIEW_W, VIEW_H);
            scrollNode.setPosition(0, 0);
            scrollNode.setSiblingIndex(panel.children.length - 1);
            var mask = scrollNode.addComponent(cc.Mask);
            mask.type = cc.Mask.Type.RECT;
            var sv = scrollNode.addComponent(cc.ScrollView);
            sv.horizontal = false;
            sv.vertical = true;
            sv.inertia = true;
            sv.bounceDuration = 0.15;
            root.parent = scrollNode;
        }
        // 内容锚点改为顶部, 行从视口顶部依次往下排
        root.anchorX = 0.5;
        root.anchorY = 1;
        root.setPosition(0, VIEW_H / 2);
        this._settleScrollView = scrollNode.getComponent(cc.ScrollView);
        this._settleViewH = VIEW_H;
        this._settleViewW = VIEW_W;
        var rowTpl = this.findNode(root, "bbSettleRow");
        this._settleCardsRoot = root;
        this._settleRowTpl = rowTpl;
        return root;
    },

    // 结算明牌: 只展示与本人相关的对局(有庄=自己与庄家; 无庄=自己与各玩家)
    // 每行 = 明牌(按牌型排列) + 后面的牌型文字 + 本行输赢分
    _renderSettleCards: function (results, details) {
        var root = this._ensureSettleCards();
        if (!root) return false;
        this._lastResults = results;
        this._lastDetails = details || null;
        // 清掉上次克隆的行, 保留场景固化的行模板(removeAllChildren会把模板一起销毁)
        var tpl = this._settleRowTpl;
        var old = root.children.slice();
        for (var oi = 0; oi < old.length; ++oi) { if (old[oi] !== tpl) old[oi].destroy(); }
        if (!this._n.resultPanel || !results) { root.active = false; return false; }

        var nm = cc.vv.gameNetMgr;
        var meUid = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
        var myGs = nm.bbMySeat;
        var my = null, i;
        // bbMySeat 异常(重进/补发结算没走过 bb_start)时用座位表反查, 避免拿不到座位直接退回整段文字
        if ((myGs == null || myGs < 0) && nm.bbSeats) {
            for (i = 0; i < nm.bbSeats.length; ++i) {
                if (nm.bbSeats[i] && nm.bbSeats[i].userid == meUid) { myGs = i; break; }
            }
        }
        for (i = 0; i < results.length; ++i) {
            if (results[i] && results[i].userid == meUid) { my = results[i]; break; }
        }
        if (!my || myGs == null || myGs < 0) { root.active = false; return false; }

        var bankerGs = nm.bbBankerMode ? nm.bbBankerSeat : -1;
        // 对手: 有庄时闲家只看与庄家的结算、庄家看与各闲家的结算; 无庄看与所有其他玩家
        var opps = [], totalSeats = this._total || 2;
        for (var g = 0; g < totalSeats; ++g) {
            if (g == myGs) continue;
            if (bankerGs >= 0 && myGs != bankerGs && g != bankerGs) continue;
            opps.push(g);
        }
        // 某家与我的本局输赢分(取服务端明细, 按该家视角计分, 没有明细则不显示分数)
        var pairScore = function (oppGs) {
            var sum = 0, found = false;
            for (var d = 0; d < (details || []).length; ++d) {
                var dt = details[d];
                if (!((dt.a == myGs && dt.b == oppGs) || (dt.a == oppGs && dt.b == myGs))) continue;
                found = true;
                if (dt.winner == oppGs) sum += (dt.score || 0);
                else sum -= (dt.score || 0);
            }
            return found ? sum : null;
        };
        // 按座位号取该家的结算行(用 userid 对齐 results, 避免座位号体系不同)
        var resOfGs = function (gs) {
            var uid = (nm.bbSeats && nm.bbSeats[gs]) ? nm.bbSeats[gs].userid : -1;
            for (var k = 0; k < results.length; ++k) {
                if (results[k] && results[k].userid == uid) return results[k];
            }
            return null;
        };

        root.active = true;
        var totalRows = opps.length + 1;
        var ROW_H = 56;
        var contentH = Math.max(this._settleViewH || 300, totalRows * ROW_H + 8);
        root.setContentSize(this._settleViewW || 840, contentH);   // 顶部锚点: 内容从视口顶部往下排
        var rowIdx = 0;                        // 行的显示序号(与座位号无关, 保证两行紧挨着)
        var self = this;
        // 用场景里已有的结算文字节点克隆, 保证字体/颜色/材质与场景一致(运行时新建 Label 会看不见)
        var mkLabel = function (row, x, w, size, align, str) {
            var node = self._n.resultContent ? cc.instantiate(self._n.resultContent) : new cc.Node("lbl");
            node.name = "lbl";
            node.active = true;
            node.opacity = 255;
            node.parent = row;
            node.setContentSize(w, ROW_H - 4);
            node.setPosition(x, 0);
            var lb = node.getComponent(cc.Label);
            if (!lb) lb = node.addComponent(cc.Label);
            lb.fontSize = size;
            lb.lineHeight = size + 4;
            lb.horizontalAlign = align;
            lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
            lb.overflow = cc.Label.Overflow.SHRINK;
            lb.string = str || "";
            return lb;
        };
        var mkCard = function (row, x, id) {
            var cn = new cc.Node("bbSettleCard");
            cn.parent = row;
            cn.setContentSize(38, 52);
            cn.setPosition(x, 0);
            var sp = cn.addComponent(cc.Sprite);
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            sp.spriteFrame = (id != null ? self.frameOf(id) : null) || self._cardBack || null;
        };
        // 一行: 昵称 | 六张明牌(按牌型排列) | 牌型文字 | 分数
        // 优先克隆场景固化的行模板(rowName/card0-5/rowDesc/rowScore), JS 只填数据; 模板缺失走代码兜底
        var rowTpl = this._settleRowTpl;
        var renderRow = function (r, gIdx, score) {
            var name = (r.name || "") + (gIdx == myGs ? "(我)" : "") + (gIdx == bankerGs ? "(庄)" : "");
            var ids = [], desc = "";
            if (r.daos) {
                // 手摆: 前/中/后三道各两张
                for (var d = 0; d < r.daos.length; ++d) { var dc = r.daos[d].cards || []; ids.push(dc[0], dc[1]); }
                //结算弹窗不显示倍率, 改为只看本局分数加减
                desc = r.daos.map(function (x2) { return x2.desc; }).join(" ");
                if (r.wulong) desc = "乌龙 " + desc;
            } else {
                // 免摆: 六张按牌型排列(同点成组在前)
                ids = self._mianOrder(r.holds || []);
                var tn = r.typeName || "";
                // 散牌额外列出构成(一对/单张), 如 散牌(一对Q 单A 单K 单7)
                var parts = (r.typeKey == 1 || tn == "散牌") ? self._mianParts(r.holds) : "";
                desc = tn + (parts ? "(" + parts + ")" : "");
            }
            // 其他玩家的分数一律是「我与他」之间的结算(各人视角不同), 不是他自己的本局结果
            var scoreStr = typeof score === "string" ? score
                : (score == null ? "与我 0" : "与我 " + (score > 0 ? "+" : "") + score);
            var rowY = -ROW_H * (rowIdx + 0.5);
            rowIdx++;
            if (rowTpl && cc.isValid(rowTpl)) {
                var row = cc.instantiate(rowTpl);
                row.active = true;
                row.parent = root;
                row.setPosition(0, rowY);
                self.setStr(self.findNode(row, "rowName"), name);
                self.setStr(self.findNode(row, "rowDesc"), desc);
                self.setStr(self.findNode(row, "rowScore"), scoreStr);
                for (var ci = 0; ci < 6; ++ci) {
                    var cn = self.findNode(row, "card" + ci);
                    if (!cn) continue;
                    if (ids[ci] != null) {
                        cn.active = true;
                        var sp = cn.getComponent(cc.Sprite);
                        if (sp) sp.spriteFrame = self.frameOf(ids[ci]) || self._cardBack || null;
                    } else cn.active = false;
                }
                return;
            }
            // 兜底: 场景无行模板时代码创建
            var row2 = new cc.Node("bbSettleRow");
            row2.parent = root;
            row2.setPosition(0, rowY);
            mkLabel(row2, -470, 140, 20, cc.Label.HorizontalAlign.RIGHT, name);
            var x = -360;
            for (var m2 = 0; m2 < 6; ++m2) {
                mkCard(row2, x, ids[m2]);
                // 手摆道与道之间留空隙
                x += (r.daos && m2 % 2 == 1) ? 56 : 40;
            }
            mkLabel(row2, 55, 380, 19, cc.Label.HorizontalAlign.LEFT, desc);
            mkLabel(row2, 430, 200, 20, cc.Label.HorizontalAlign.RIGHT, scoreStr);
        };
        // 自己行: 本局合计 + 本房间总积分(账户宝宝豆余额)
        var myDelta = my.delta || 0;
        var myScoreText = "本局 " + (myDelta > 0 ? "+" : "") + myDelta
            + "  总:" + (my.totalscore != null ? my.totalscore : 0);
        renderRow(my, myGs, myScoreText);
        for (var o = 0; o < opps.length; ++o) {
            var or = resOfGs(opps[o]);
            if (!or) continue;
            renderRow(or, opps[o], pairScore(opps[o]));
        }
        if (this._settleScrollView && cc.isValid(root)) {
            this._settleScrollView.content = root;
            if (typeof this._settleScrollView.scrollToTop === "function") this._settleScrollView.scrollToTop(0);
        }
        return true;
    },

    // 整场结束推送: 先缓存总分, 等本局结算关掉后再弹总结算弹窗
    onGameEnd: function (detail) {
        this._final = true;
        this._stopContinueRetry();
        this._endDetail = detail || {};
        console.log("[BB] 收到 game_end, endinfo 人数=" + ((this._endDetail.endinfo || []).length) + ", 结算面板显示中=" + !!(this._n.resultPanel && this._n.resultPanel.active));
        if (this._summaryShown) return;
        // 结算还没真正弹出(亮牌/特效未播完, 结算被缓存在 _pendingOver): 等 applyGameOver 后再走本局结算
        if (this._pendingOver) return;
        // 第一段本局结算正在显示: 标记为"未看完", 由「确定」/倒计时结束时触发总结算
        if (this._n.resultPanel && this._n.resultPanel.active) {
            this._settle1Done = false;
            return;
        }
        if (!this._settle1Done) return;   // 本局结算还开着(或亮牌未结束), 由它关闭时触发总结算
        // game_over 与 game_end 在同一帧先后派发: 延后一帧再判定, 避免总结算抢在本局结算之前弹出
        var self = this;
        this.scheduleOnce(function () {
            if (!cc.isValid(self.node) || self._summaryShown) return;
            if (self._pendingOver || !self._settle1Done) return;
            self._showFinalSummary();
        }, 0);
    },

    // 总结算弹窗: 整场所有玩家的总积分, 停留120秒(可点「退出」立即离开)
    _showFinalSummary: function () {
        if (this._summaryShown) return;
        this._summaryShown = true;
        this._settle1Done = true;
        this._stopCountdown();
        var detail = this._endDetail || {};
        var totals = [];
        var endinfo = detail.endinfo || [];
        for (var i = 0; i < endinfo.length; ++i) {
            var e = endinfo[i];
            totals.push((e.name || "") + "  总分:" + (e.score != null ? e.score : 0));
        }
        // endinfo 缺失时用房间座位上的积分兜底
        if (totals.length == 0 && cc.vv.gameNetMgr && cc.vv.gameNetMgr.seats) {
            var ss = cc.vv.gameNetMgr.seats;
            for (var k = 0; k < ss.length; ++k) {
                if (ss[k] && ss[k].userId > 0) totals.push((ss[k].name || "") + "  总分:" + (ss[k].score != null ? ss[k].score : 0));
            }
        }
        // 只显示整场总分: 不再拼接上一局的明牌文字, 否则看起来和本局结算弹窗一样
        var lines = [];
        if (totals.length > 0) { lines.push("— 整场总分 —"); lines = lines.concat(totals); }
        console.log("[BB] 弹整场结算, 总分人数=" + totals.length + ", 倒计时=120s");
        if (this._n.resultPanel) this._n.resultPanel.active = true;
        this.setStr(this._n.resultTitle, "整场结算");
        if (this._n.resultContent) {
            this._n.resultContent.active = true;
            this._setSettleContentStyle(24, 32, 60);
            this.setStr(this._n.resultContent, lines.length > 0 ? lines.join("\n") : "");
        }
        if (this._n.resultList) this._n.resultList.active = false;
        if (this._settleCardsRoot && cc.isValid(this._settleCardsRoot)) this._settleCardsRoot.active = false;
        if (this._resultShuffleBtn) this._resultShuffleBtn.active = false;
        this._ensureSettleBtnFrames();
        // 总结算只保留一个按钮: 复用「确定」按钮, 文字改为「退出」, 点击立即离房
        this._setSettleActionBtn("退出", true);
        if (this._n.resultExitBtn) this._n.resultExitBtn.active = false;
        if (this._settleCd) {
            var self = this;
            this._startCountdown(120, this._settleCd, function () {
                if (cc.isValid(self.node)) self.onExitRoom();
            });
        }
    },

    // 结算确认重发: 偶发丢包会让服务端一直显示"还有玩家没点确认", 这里每2秒补发一次直到下一局开始
    _startContinueRetry: function () {
        var self = this;
        if (this._continueRetryTimer) return;
        var tries = 0;
        this._continueRetryTimer = setInterval(function () {
            if (!cc.isValid(self.node) || self._started || self._final || !self._myContinued || (++tries) > 10) {
                self._stopContinueRetry();
                return;
            }
            cc.vv.net.send("bb_continue", self._shufflePending ? { shuffle: true } : undefined);
        }, 800);
    },

    _stopContinueRetry: function () {
        if (this._continueRetryTimer) { clearInterval(this._continueRetryTimer); this._continueRetryTimer = null; }
    },

    // 结算弹窗「确定」: 立即进入下一把; 整场结束则进入总结算弹窗
    onResultClose: function () {
        this._stopCountdown();
        // 房间无法续局: 同一个按钮已改成「退出房间」, 点击立即离房
        if (this._roomEnd) { this.onExitRoom(); return; }
        // 总结算弹窗里同一个按钮已改成「退出」: 点击立即离房
        if (this._summaryShown) { this.onExitRoom(); return; }
        if (this._n.resultPanel) this._n.resultPanel.active = false;
        if (this._final) { this._showFinalSummary(); return; }
        this._settleClosedAt = Date.now();   // 计时起点: 结算关掉到收到下一局开局之间耗时
        if (this._myContinued) return;
        this._myContinued = true;
        cc.vv.net.send("bb_continue");
        this._startContinueRetry();
        this.showTip("已确定，等待其他玩家…");
    },

    // 结算弹窗「洗牌」: 等同确定(关闭弹窗)+ 标记下一局全员先播洗牌动画再发牌
    onResultShuffle: function () {
        this._stopCountdown();
        if (this._final || this._roomEnd) return;
        this._shufflePending = true;   // 先打标记: 即使已自动确认也要把洗牌意图发给服务端
        if (this._n.resultPanel) this._n.resultPanel.active = false;
        this._settleClosedAt = Date.now();   // 计时起点: 结算关掉到收到下一局开局之间耗时
        if (this._myContinued) {
            // 已被倒计时自动确认过: 补发一次带洗牌标记的继续, 让下一局仍然播洗牌动画
            cc.vv.net.send("bb_continue", { shuffle: true });
            this.showTip("已确定，等待其他玩家…");
            return;
        }
        this._myContinued = true;
        this.showTip("已确定，等待其他玩家…");
        cc.vv.net.send("bb_continue", { shuffle: true });
        this._startContinueRetry();
    },

    // 洗牌动画: 用场景里的整副牌背(bbShuffleAnim)左右搓洗, 播完回调
    _playShuffleAnim: function (onDone) {
        var done = false;
        function finish() { if (done) return; done = true; if (onDone) onDone(); }
        try {
            if (!this._shuffleRoot || !cc.isValid(this._shuffleRoot)) {
                this._shuffleRoot = this.findNode(this.node, "bbShuffleAnim") || cc.find("Canvas/bbShuffleAnim");
            }
            var root = this._shuffleRoot;
            if (!root || !cc.isValid(root) || !root.children || root.children.length == 0) {
                console.log("[BB] 洗牌动画节点缺失, 跳过动画直接发牌");
                finish();
                return;
            }
            var A = [], B = [];
            for (var i = 0; i < root.children.length; ++i) {
                var ch = root.children[i];
                ch.stopAllActions();
                var h = this._homeOf(ch);
                ch.setPosition(h.x, h.y);
                ch.setScale(h.sx, h.sy);
                if (ch.name.indexOf("cardA") == 0) A.push(ch);
                else if (ch.name.indexOf("cardB") == 0) B.push(ch);
            }
            // 先把上一局的牌全部收起, 动画期间桌面上只有这幅牌背
            this._clearCards();
            root.active = true;
            //洗牌动画音效
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("shuffle.wav");
            if (root.parent) root.setSiblingIndex(root.parent.children.length - 1);
            var OFF = 70;
            function shove(list, dir) {
                for (var k = 0; k < list.length; ++k) {
                    list[k].runAction(cc.sequence(
                        cc.delayTime(k * 0.015),
                        cc.moveBy(0.3, cc.v2(OFF * dir, 0)),
                        cc.moveBy(0.3, cc.v2(-OFF * dir, 0))
                    ));
                }
            }
            shove(A, 1);
            shove(B, -1);
            this.scheduleOnce(function () {
                if (cc.isValid(root)) root.active = false;
                finish();
            }, 1.0);
        } catch (e) {
            // 动画异常绝不能卡住发牌: 记录后直接放行
            console.error("[BB] 洗牌动画异常, 直接继续发牌", e);
            finish();
        }
    },

    // ===== 免摆牌型特效: 同花顺喷火 / 炸弹炸头像 (纯代码绘制光效, 无需图片) =====
    // 头像中心的本地坐标
    _avatarLocalPos: function (off) {
        var sn = this._seatNodes[this._layoutOf(this._total || 2)[off]];
        var icon = sn && (sn.icon || sn.root);
        if (!icon || !cc.isValid(icon)) return null;
        return this.node.convertToNodeSpaceAR(icon.convertToWorldSpaceAR(cc.v2(0, 0)));
    },

    // 桌面中心 = 各家头像位置的平均点
    _tableCenter: function () {
        var total = this._total || 2, sx = 0, sy = 0, n = 0;
        for (var o = 0; o < total; ++o) {
            var p = this._avatarLocalPos(o);
            if (p) { sx += p.x; sy += p.y; ++n; }
        }
        return n > 0 ? cc.v2(sx / n, sy / n) : cc.v2(0, 0);
    },

    _clearFxNodes: function () {
        var arr = this._fxNodes || [];
        for (var i = 0; i < arr.length; ++i) { if (cc.isValid(arr[i])) arr[i].destroy(); }
        this._fxNodes = [];
    },

    _fxNode: function (pos, name) {
        var node = new cc.Node(name);
        node.parent = this.node;
        if (node.parent) node.setSiblingIndex(node.parent.children.length - 1);
        node.setPosition(pos);
        if (!this._fxNodes) this._fxNodes = [];
        this._fxNodes.push(node);
        return node;
    },

    // 亮牌结束后的牌型特效队列: 每家先播手牌放大聚焦, 再播喷火/炸弹; 全部播完再回调
    _playHandFx: function (done) {
        var self = this;
        var total = this._total || 2;
        var lv = {}, queue = [];
        for (var off = 0; off < total; ++off) {
            var gs = this._watching ? off : (this._mySeat + off) % total;
            var p = this._revealByGs[gs];
            lv[off] = p && p.typeKey != null ? p.typeKey : null;
            if (lv[off] == null) continue;
            // 特效规则: 同花顺(11/12)播喷火, 炸弹(4条=10)播爆炸, 3对(3)/3组9(2)播玩具枪, 其余牌型不播特效
            var fk = null;
            if (lv[off] >= 11) fk = "fire";
            else if (lv[off] == 10) fk = "bomb";
            else if (lv[off] == 3) fk = "pairs";   // 3个对子(level=3)
            else if (lv[off] == 2) fk = "nine";    // 3组九点(level=2)
            if (fk) {
                queue.push({ kind: "hand", off: off, type: fk });
                queue.push({ kind: fk, off: off });
            }
        }
        if (queue.length == 0) { if (done) done(); return; }
        this._fxRunning = true;
        var i = 0, guard = 0;
        function next() {
            if (!cc.isValid(self.node) || i >= queue.length) {
                self._fxRunning = false;
                self._clearFxNodes();
                if (done) done();
                return;
            }
            guard = ++guard;   // 每一步的看门狗令牌
            var it = queue[i++];
            var token = guard;
            // 兜底: 单步动画若因节点被隐藏/动作暂停而没回调, 6秒后强制进入下一步, 保证结算弹窗一定会弹出
            setTimeout(function () {
                if (!cc.isValid(self.node) || token !== guard) return;
                console.log("[BB] 特效步骤超时强制结束 step=" + token);
                next();
            }, 6000);
            if (it.kind == "hand") self._fxHandFocus(it.off, it.type, next);
            else if (it.kind == "fire") self._fxFire(it.off, next);
            else if (it.kind == "bomb") self._fxBomb(it.off, lv, next);
            else self._fxPairsFx(it.kind, next);
        }
        next();
    },

    // 手牌聚焦动画: 把某家 6 张手牌移到屏幕中心放大, 中心显示牌型名图片(从0放大+抖动1秒), 之后手牌归位
    _fxHandFocus: function (off, type, done) {
        var self = this;
        var total = this._total || 2;
        var gs = this._watching ? off : (this._mySeat + off) % total;
        var seat = this._seatNodes[this._layoutOf(total)[off]];
        if (!seat || !seat.slots) { if (done) done(); return; }

        var center = this._tableCenter();
        var slots = [];
        for (var k = 0; k < 6; ++k) {
            if (seat.slots[k] && seat.slots[k].active) slots.push(seat.slots[k]);
        }
        if (slots.length == 0) { if (done) done(); return; }

        // 牌型名称图片(同花顺/炸/3对/3组9), 透明背景; 启动已预载, 直接 get
        var NAME_KEYS = { fire: "flush", bomb: "bomb", pairs: "pairs3", nine: "nine" };
        var frame = cc.resources.get("images/bbHandName_" + (NAME_KEYS[type] || "flush"), cc.SpriteFrame);
        var nameNode = null;
        if (frame) {
            nameNode = new cc.Node("bbFxHandName");
            nameNode.parent = this.node;
            nameNode.setPosition(center.x, center.y + 200);
            nameNode.setSiblingIndex(this.node.children.length - 1);
            var sp = nameNode.addComponent(cc.Sprite);
            sp.spriteFrame = frame;
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            // 按屏幕宽度等比缩放, 避免大图超出屏幕
            var fw = frame.getOriginalSize().width, fh = frame.getOriginalSize().height;
            var k = Math.min((cc.winSize.width * 0.62) / fw, 360 / fh, 1);
            nameNode.setContentSize(fw * k, fh * k);
            nameNode.setScale(0);
            this._fxNodes.push(nameNode);
        }

        var spacing = 56;
        var startX = -((slots.length - 1) * spacing) / 2;
        var targetScale = 1.9;
        // center 是 this.node 空间坐标, 牌的父节点是各自座位节点, 必须逐张转换到牌的父节点空间,
        // 否则侧边座位的牌会朝座位外侧(如最左侧朝屏幕左外)移动放大
        var centerW = this.node.convertToWorldSpaceAR(center);

        for (var j = 0; j < slots.length; ++j) {
            var sl = slots[j];
            var h = this._homeOf(sl);
            var cl = sl.parent.convertToNodeSpaceAR(centerW);
            sl.stopAllActions();
            sl.setSiblingIndex(sl.parent.children.length - 1);
            sl.runAction(cc.sequence(
                cc.spawn(
                    cc.moveTo(0.4, cc.v2(cl.x + startX + j * spacing, cl.y)),
                    cc.scaleTo(0.4, targetScale)
                ),
                // 抖动 1 秒(5 轮, 每轮 0.2s, 净位移为0)
                cc.repeat(cc.sequence(
                    cc.moveBy(0.05, cc.v2(-3, 2)),
                    cc.moveBy(0.05, cc.v2(3, -2)),
                    cc.moveBy(0.05, cc.v2(2, -3)),
                    cc.moveBy(0.05, cc.v2(-2, 3))
                ), 5),
                cc.spawn(
                    cc.moveTo(0.4, cc.v2(h.x, h.y)),
                    cc.scaleTo(0.4, h.sx, h.sy)
                )
            ));
        }
        // 牌型名图片: 从0放大 -> 抖动1秒 -> 淡出销毁
        if (nameNode) {
            nameNode.runAction(cc.sequence(
                cc.scaleTo(0.5, 1.0),
                cc.repeat(cc.sequence(
                    cc.moveBy(0.05, cc.v2(-3, 2)),
                    cc.moveBy(0.05, cc.v2(3, -2)),
                    cc.moveBy(0.05, cc.v2(2, -3)),
                    cc.moveBy(0.05, cc.v2(-2, 3))
                ), 25),
                cc.fadeOut(0.3),
                cc.removeSelf()
            ));
        }
        // 总时长: 0.4 手牌放大 + 1.0 抖动 + 0.4 手牌归位 = 1.8s; 图片 0.5放大+1.0抖+0.3淡出=1.8s
        this.scheduleOnce(function () {
            if (cc.isValid(self.node) && done) done();
        }, 1.9);
    },

    // 3对 / 3组9 牌型特效: 玩具枪喷彩虹+爆炸帧动画(美术视频抠掉底色导出, 24fps)
    _fxPairsFx: function (kind, done) {
        var frames = this._pairsFrames;
        // 帧图未导入时退回场景动画(场景里有 bbFxPairs3/bbFxNine 才有效果)
        if (!frames || !frames.length) { this._fxSceneAnim(kind, done); return; }
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX(BB_FX_SFX[kind]);
        var center = this._tableCenter();
        var node = this._fxNode(center, "bbFxPairsNine");
        var sp = node.addComponent(cc.Sprite);
        sp.spriteFrame = frames[0];
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        var fw = frames[0].getOriginalSize().width, fh = frames[0].getOriginalSize().height;
        node.setContentSize(fw, fh);
        node.setScale(Math.min(cc.winSize.width / fw, cc.winSize.height / fh));
        var idx = 0, total = frames.length, FPS = 24;
        var timer = setInterval(function () {
            if (!cc.isValid(node)) { clearInterval(timer); return; }
            if (++idx >= total) {
                clearInterval(timer);
                node.destroy();
                if (done) done();
                return;
            }
            sp.spriteFrame = frames[idx];
        }, 1000 / FPS);
    },

    // 3对 / 3组9 的场景动画: 直接播场景里预制好的节点动画(bbFxPairs3 / bbFxNine),
    // 节点由美术生成后在场景里放好即可生效; 节点不存在时直接跳过, 不阻塞结算流程
    _fxSceneAnim: function (kind, done) {
        var self = this;
        var NAMES = { pairs: "bbFxPairs3", nine: "bbFxNine" };
        // 3对/3组9 特效音效(与是否放了场景动画节点无关, 声音照常播)
        var sfx = BB_FX_SFX[kind];
        if (sfx && cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX(sfx);
        var node = this.findNode(this.node, NAMES[kind]);
        if (!node) { if (done) done(); return; }
        node.active = true;
        if (node.parent) node.setSiblingIndex(node.parent.children.length - 1);
        var anim = node.getComponent(cc.Animation);
        var dur = 1.0;
        if (anim) {
            try { anim.play(); } catch (e) { console.warn("[BB] 牌型动画播放异常", e); }
            if (anim.defaultClip && anim.defaultClip.duration > 0) dur = anim.defaultClip.duration;
        }
        var finished = false;
        this.scheduleOnce(function () {
            if (finished) return;
            finished = true;
            if (!cc.isValid(self.node)) return;
            if (cc.isValid(node)) node.active = false;
            if (done) done();
        }, dur + 0.1);
    },

    // 同花顺火剪: 放屏幕中心, 放大画面
    _fxFire: function (off, done) {
        var center = this._tableCenter();
        var frames = this._fireFrames;
        if (frames && frames.length) {
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX(BB_FX_SFX.fire);
            var node = this._fxNode(center, "bbFxFire");
            var sp = node.addComponent(cc.Sprite);
            sp.spriteFrame = frames[0];
            node.setScale(1.6);   // 288x512 -> 约461x819, 放大铺满桌面
            var idx = 0, total = frames.length, FPS = 30;   // 73帧/30fps ≈ 2.4秒播完
            var timer = setInterval(function () {
                if (!cc.isValid(node)) { clearInterval(timer); return; }
                if (++idx >= total) {
                    clearInterval(timer);
                    node.destroy();
                    if (done) done();
                    return;
                }
                sp.spriteFrame = frames[idx];
            }, 1000 / FPS);
            return;
        }
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX(BB_FX_SFX.fire);
        var node = this._fxNode(center, "bbFxFire");
        var g = node.addComponent(cc.Graphics);
        g.fillColor = cc.color(255, 130, 0, 70); g.circle(0, 0, 86); g.fill();       // 光晕
        g.fillColor = cc.color(255, 160, 30, 245); g.ellipse(0, 10, 46, 80); g.fill();  // 外焰
        g.fillColor = cc.color(255, 90, 0, 245); g.ellipse(0, -4, 30, 56); g.fill();    // 内焰
        g.fillColor = cc.color(255, 244, 180, 255); g.ellipse(0, -18, 15, 32); g.fill(); // 焰心
        node.setScale(0.12);
        node.runAction(cc.sequence(
            cc.spawn(cc.scaleTo(0.5, 1.15, 1.3), cc.fadeIn(0.2)),
            cc.spawn(cc.moveBy(1.5, cc.v2(0, 620)), cc.scaleTo(1.5, 0.62, 0.9), cc.fadeOut(1.5)),
            cc.removeSelf()
        ));
        this.scheduleOnce(function () {
            if (cc.isValid(node)) node.destroy();
            if (done) done();
        }, 2.1);
    },

    // 炸弹: 直接在屏幕中心炸一次, 加长时长
    _fxBomb: function (off, lv, done) {
        var self = this;
        var pos = this._tableCenter();
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX(BB_FX_SFX.bomb);
        var frames = this._bombFrames;
        if (frames && frames.length) {
            var bnode = this._fxNode(pos, "bbFxBomb");
            var bsp = bnode.addComponent(cc.Sprite);
            bsp.spriteFrame = frames[0];
            bnode.setScale(1.4);   // 512x288 -> 约717x403, 放大铺满桌面
            var bidx = 0, btotal = frames.length, BFPS = 30;
            var btimer = setInterval(function () {
                if (!cc.isValid(bnode)) { clearInterval(btimer); return; }
                if (++bidx >= btotal) { clearInterval(btimer); bnode.destroy(); return; }
                bsp.spriteFrame = frames[bidx];
            }, 1000 / BFPS);
            // 帧动画播完后再停 1 秒让玩家看清
            this.scheduleOnce(function () { if (cc.isValid(self.node) && done) done(); }, btotal / BFPS + 1.0);
            return;
        }
        var node = this._fxNode(pos, "bbFxBomb");
        var g = node.addComponent(cc.Graphics);
        function star(R, r, n) {
            for (var i = 0; i < n * 2; ++i) {
                var a = Math.PI * i / n - Math.PI / 2;
                var rad = (i % 2 == 0) ? R : r;
                var px = Math.cos(a) * rad, py = Math.sin(a) * rad;
                if (i == 0) g.moveTo(px, py); else g.lineTo(px, py);
            }
            g.close();
        }
        g.fillColor = cc.color(255, 70, 0, 230); star(68, 26, 12); g.fill();
        g.fillColor = cc.color(255, 190, 40, 255); star(40, 16, 12); g.fill();
        g.fillColor = cc.color(255, 255, 220, 255); g.circle(0, 0, 20); g.fill();
        var ring = this._fxNode(pos, "bbFxWave");
        var rg = ring.addComponent(cc.Graphics);
        rg.strokeColor = cc.color(255, 230, 120, 210);
        rg.lineWidth = 8;
        rg.circle(0, 0, 46); rg.stroke();
        node.setScale(0.12);
        node.runAction(cc.sequence(
            cc.scaleTo(0.25, 1.35),
            cc.spawn(cc.scaleTo(0.4, 1.8), cc.fadeOut(0.4)),
            cc.removeSelf()
        ));
        ring.setScale(0.3);
        ring.opacity = 230;
        ring.runAction(cc.sequence(
            cc.scaleTo(0.45, 1.9),
            cc.spawn(cc.scaleTo(0.3, 2.5), cc.fadeOut(0.3)),
            cc.removeSelf()
        ));
        this.scheduleOnce(function () {
            if (cc.isValid(node)) node.destroy();
            if (cc.isValid(ring)) ring.destroy();
            if (cc.isValid(self.node) && done) done();
        }, 2.0);
    },

    // 某家点了确定/洗牌: 只更新提示, 不关闭其他人的弹窗
    onContinueOk: function (data) {
        if (!data) return;
        var total = data.total || this._total;
        var ready = data.continuedCount != null ? data.continuedCount : (data.readyCount || 0);
        if (this._myContinued) this.showTip("已准备 (" + ready + "/" + total + ")");
        else if (this._n.resultPanel && this._n.resultPanel.active) this.showTip("有玩家已准备 (" + ready + "/" + total + ")");
    },

    onUserStateChanged: function (seat) {
        this.renderSeats();
        var nm = cc.vv.gameNetMgr;
        // 结算面板显示期间不要切回准备界面(game_over_push 之后 GameNetMgr 会逐座派发 user_state_changed)
        if (this._n.resultPanel && this._n.resultPanel.active) return;
        if (seat && nm.seats && nm.seatIndex >= 0 && nm.seats[nm.seatIndex] &&
            seat.userid == nm.seats[nm.seatIndex].userid) {
            if (!this._started) this.showPrepareUI();
        }
    },

    onReady: function () {
        cc.vv.net.send("ready");
        if (this._n.readyBtn) this._n.readyBtn.active = false;
        if (this._n.dissolveBtn) this._n.dissolveBtn.active = false;
    },

    // 设置面板「退出房间」: 整场没结束时不能立刻走, 等本局结束+结算完成后再清退
    onExitRequest: function () {
        var inSettle = !!(this._n.resultPanel && this._n.resultPanel.active);
        if (this._started && !inSettle && !this._final) {
            this._exitPending = true;
            var st = this.findNode(this.node, "settings");
            if (st) st.active = false;
            this.showTip("本局结束后自动退出房间");
            return;
        }
        this.onExitRoom();
    },

    // 结算弹窗「退出房间」: 仅在未发牌时可退, 牌局已开始则无效
    onExitRoom: function () {
        if (this._started) { this.showTip("牌局已开始，无法退出房间"); return; }
        this._stopCountdown();
        this._myContinued = true;
        if (cc.vv.gameNetMgr && cc.vv.gameNetMgr.clearRoomState) cc.vv.gameNetMgr.clearRoomState();
        var self = this;
        cc.vv.net.send("leave_room");
        // 正常路径是服务端回包 exit_result 立即切场景; 这里只做兜底, 不空等
        this._exitTimer = setTimeout(function () {
            self._exitTimer = null;
            if (!cc.isValid(self.node) || self._leaving) return;
            self.leaveRoom();
        }, 500);
    },

    // ===== 退出/解散 =====
    onExit: function () {
        var self = this;
        var doSend = function () {
            if (self._n.resultPanel) self._n.resultPanel.active = false;
            self.showTip("正在退出房间…");
            cc.vv.net.send(self._final ? "leave_room" : "exit");
            self._exitTimer = setTimeout(function () {
                self._exitTimer = null;
                if (!cc.isValid(self.node) || self._leaving) return;
                if (cc.vv.gameNetMgr && cc.vv.gameNetMgr.clearRoomState) cc.vv.gameNetMgr.clearRoomState();
                self.leaveRoom();
            }, 500);
        };
        if (!this._final && cc.vv.alert && cc.vv.alert.show) {
            cc.vv.alert.show(null, "是否确定退出房间？", doSend, true);
        } else { doSend(); }
    },

    onDissolve: function () {
        var self = this;
        var doSend = function () {
            if (cc.vv.gameNetMgr.gamestate == "begin") {
                cc.vv.net.send("dissolve_request");
                self.showTip("已发起解散申请，等待其他玩家同意");
            } else {
                cc.vv.net.send("dispress");
            }
        };
        if (cc.vv.alert && cc.vv.alert.show) {
            cc.vv.alert.show(null, "解散房间不扣宝宝豆，是否确定解散？", doSend, true);
        } else { doSend(); }
    },

    onDissolveAgree: function () {
        cc.vv.net.send("dissolve_agree");
        if (this._n.dissolvePanel) this._n.dissolvePanel.active = false;
    },
    onDissolveReject: function () {
        cc.vv.net.send("dissolve_reject");
        if (this._n.dissolvePanel) this._n.dissolvePanel.active = false;
    },

    leaveRoom: function () {
        if (this._leaving) return;
        this._leaving = true;
        this._stopContinueRetry();
        var curScene = cc.director.getScene ? cc.director.getScene() : null;
        var curName = (curScene && curScene.name) ? curScene.name : "";
        if (curName === "hall" || curName === "club") return;
        var nm = cc.vv.gameNetMgr;
        if (nm) nm._ignoreDisconnectOnce = true; //服务端即将断 socket, 别让 disconnect 再切一次场景
        //按进房时记录的来源场景返回:俱乐部进桌回俱乐部详情页,大厅进桌回大厅
        var backClub = (nm && nm.roomBackScene === "club") || cc.vv.fromClubId || (nm && nm.roomBackClubId);
        if (backClub) {
            cc.vv.fromClub = true;
            if (nm && nm.roomBackClubId && !cc.vv.fromClubId) cc.vv.fromClubId = nm.roomBackClubId;
            if(cc.vv.sceneMgr){ cc.vv.sceneMgr.load("club"); } else { cc.director.loadScene("club"); }
        } else {
            if(cc.vv.sceneMgr){ cc.vv.sceneMgr.load("hall"); } else { cc.director.loadScene("hall"); }
        }
    },

    showTip: function (msg) {
        this.setStr(this._n.tipLabel, msg || "");
    }
});
