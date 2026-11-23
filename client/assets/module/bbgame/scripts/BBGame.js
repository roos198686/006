// 宝宝(6张) 客户端 —— 免摆/手摆 两种玩法共用
// 场景: mjgame_bb_shou.fire (免摆/手摆共用), 本脚本共用
// 牌 id: (rank-2)*4+suit, rank 2..14(JQKA=11..14), suit 0黑1红2梅3方
// 服务端协议:
//   bb_start_push  {maxPlayers,seats[{userid,name,seatindex,roomSeatIndex,count,arranged}],mySeat,
//                   myCards[6],bankerSeat,bankerMode,gameType,phase,arrangeDeadline,conf}
//   bb_reveal_push 免摆 {players:[{seat,cards[6],groups[3][2],typeKey,typeName,rate}],gameType}
//                  手摆 {players:[{seat,daos[3]{cards[2],desc,rate},wulong,auto}],gameType}
//   game_over_push {results[roomSeatIndex]={userid,name,delta,totalscore,holds,typeKey/typeName/rate,
//                   daos/wulong},bankerSeat,bankerMode,gameType,details,endinfo?}
cc.Class({
    extends: cc.Component,

    properties: {},

    // 6 个座位槽在场景中的固定摆位(bbSeat0~5), 按人数选用哪几个槽, 不改坐标
    seatLayout: function (total) {
        // 逆时针落座: 自己=最下方(bbSeat0), 第二位=最右侧(bbSeat5), 第三位=右上(bbSeat4),
        // 第四位=上方(bbSeat3), 第五位=左上(bbSeat2), 第六位=左下(bbSeat1)
        var RING = [0, 5, 4, 3, 2, 1];
        if (total === 2) return [0, 3];
        return RING.slice(0, total);
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
    // 按钮文字: Label 可能挂在自己身上或子节点, 原版按钮文字是「免摆出牌」
    _setBtnText: function (node, s) {
        if (!node) return;
        var lb = node.getComponent(cc.Label) || node.getComponentInChildren(cc.Label);
        if (lb) lb.string = s;
    },
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
        node.on(cc.Node.EventType.TOUCH_END, function () {
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("btnClick.wav");
            handler.call(target);
        });
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
            if (self._arrangeRoot && self._arrangeRoot.active) self._renderArrange();
            // 结算明牌先于图集加载: 加载完成后补绘一次
            if (self._n.resultPanel && self._n.resultPanel.active && self._lastResults) {
                var ok = self._renderSettleCards(self._lastResults, self._lastDetails);
                if (self._n.resultContent) self._n.resultContent.active = !ok;
            }
            // 免摆确认弹窗里的预览牌同理: 图集到得晚时先显示牌背, 到了再补绘
            if (self._confirmRoot && self._confirmRoot.active) self._renderConfirmPreview();
            if (self._started) self.renderCards();
        });
    },

    // 结算弹窗专用牌面: pokei_x 图集(pkp_js 牌表), 帧名 n_花色_点数
    // 1=♦ 2=♣ 3=♥ 4=♠; 点数 1=A 2~9 10=10 11=J 12=Q 13=K
    loadSettleCards: function () {
        var self = this;
        cc.resources.load("images/atlas/pokei_x", cc.SpriteAtlas, function (err, atlas) {
            if (err || !atlas) { console.log("[BB] 结算牌面加载失败, 沿用牌桌牌面", err); return; }
            self._jsFrames = {};
            for (var s = 1; s <= 4; ++s) {
                for (var r = 1; r <= 13; ++r) {
                    var nm = "n_" + s + "_" + r;
                    var f = atlas.getSpriteFrame(nm + ".png") || atlas.getSpriteFrame(nm);
                    if (f) self._jsFrames[nm] = f;
                }
            }
            console.log("[BB] 结算牌面加载完成(pokei_x), 帧数=" + Object.keys(self._jsFrames).length);
            if (self._n.resultPanel && self._n.resultPanel.active && self._lastResults) {
                var ok = self._renderSettleCards(self._lastResults, self._lastDetails);
                if (self._n.resultContent) self._n.resultContent.active = !ok;
            }
        });
    },

    // 结算牌面帧: 牌 id -> 单张牌资源 n_花色_点数, 加载未完成时返回 null 由调用方回退
    jsFrameOf: function (id) {
        if (!this._jsFrames || id == null) return null;
        var suit = this.suitOf(id);                 // 0♠ 1♥ 2♣ 3♦
        var r = this.rankOf(id);                    // 2..14
        var s = suit === 0 ? 4 : (suit === 1 ? 3 : (suit === 2 ? 2 : 1));
        var rn = (r === 14) ? 1 : r;                // 牌表点数编号: 1=A, 2~10, 11=J, 12=Q, 13=K
        return this._jsFrames["n_" + s + "_" + rn] || null;
    },

    // 预加载特效帧(全部来自逆向原包 gamepdk):
    //   bbfx_start 开局动画(20帧@50ms) bbfx_dq 打枪(12帧@50ms) bbfx_zq 中枪(3帧@300ms)
    //   bbfx_qld 全垒打(19帧@60ms)
    loadFireFrames: function () {
        var self = this;
        function loadDir(dir, key) {
            cc.resources.loadDir(dir, cc.SpriteFrame, function (err, arr) {
                if (err || !arr || !arr.length) { console.log("[BB] load " + dir + " failed", err); return; }
                arr.sort(function (a, b) {
                    var na = parseInt(a.name, 10), nb = parseInt(b.name, 10);
                    if (!isNaN(na) && !isNaN(nb)) return na - nb;
                    return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
                });
                self[key] = arr;
            });
        }
        loadDir("images/bbfx_start", "_startFrames");
        loadDir("images/bbfx_dq", "_dqFrames");
        loadDir("images/bbfx_zq", "_zqFrames");
        loadDir("images/bbfx_qld", "_qldFrames");
        // 洗牌 spine(逆向原版 Pk_XiPaiAnimat): qiepai.json + qiepai.atlas + qiepai.png
        cc.resources.load("anims/qiepai/qiepai", sp.SkeletonData, function (err, sd) {
            if (err || !sd) { console.log("[BB] qiepai spine 加载失败", err); return; }
            self._qiepaiSpine = sd;
            console.log("[BB] qiepai spine 加载完成");
        });
    },

    onLoad: function () {
        var nm = cc.vv.gameNetMgr;

        //麻将同款设置逻辑(桌面背景/牌面大小/出牌手势): UI 已固化在场景 popups/settings 与 popups/bg_choose
        try {
            if (!this.getComponent("DeskStyle")) { this.addComponent("DeskStyle"); }
        } catch (e) {
            console.error("[BB] DeskStyle 挂载失败: " + (e && e.message || e));
        }

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
        this._inArrangePhase = false;   // 本机是否处于手摆的摆牌阶段(牌桌按人显示牌背)
        this._arrangeRemainAt = 0;
        this._daoSel = [[null, null], [null, null], [null, null]];
        this._arrangeRows = null;
        this._arrangeRoot = null;
        this._confirmRoot = null;
        this._confirmRemain = 0;
        this._confirmRemainAt = 0;
        this._confirmCount = 0;
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
            this.loadSettleCards();     // 结算弹窗专用牌面(pkp_js 牌表)
            this.loadFireFrames();
            this._preloadBackScene();   // 提前加载退出要回的场景, 退出时不再现加载导致卡一下
            this._bindButtons();
            this._initUserInfo();
            this._initChat();
            this._bindEvents();
            // 回放模式: 从俱乐部「我的战绩/我的乐豆详情」的详情按钮进来, 只播录像, 不连房间也不恢复房间状态
            var rp = cc.vv && cc.vv.bbReplayData;
            if (rp) { this._enterReplay(rp); return; }
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
        n.bbWatermark = this.findNode(root, "bbWatermark");   // 场景水印: 显示本房间牌桌名称
        n.prepare = this.findNode(root, "prepare");
        n.game = this.findNode(root, "game");
        n.up = this.findNode(n.game, "up");
        n.tipLabel = this.findNode(n.game, "tipLabel");
        n.countdownLabel = this.findNode(n.game, "countdownLabel");
        n.bbMidCd = this.findNode(n.game, "bbMidCd");          // 图八: 确定出牌后牌桌正中间倒计时

        // 按钮
        n.readyBtn = this.findNode(n.prepare, "readyBtn");
        n.exitBtn = this.findNode(n.prepare, "exitBtn");
        n.dissolveBtn = this.findNode(n.prepare, "dissolveBtn");
        n.ruleBtn = this.findNode(n.prepare, "bbRuleBtn");           // 图四: 左上绿色?查看规则
        n.changeDeskBtn = this.findNode(n.prepare, "bbChangeDeskBtn"); // 图四: 右下换桌

        // 规则弹窗(图五)
        n.ruleWin = this.findNode(root, "bbRuleWin");
        // 规则文案是场景节点(bbRuleContent 下的 bbRuleLine0~5), JS 只填动态数值
        n.ruleCost = this.findNode(n.ruleWin, "bbRuleLine0");
        n.ruleGames = this.findNode(n.ruleWin, "bbRuleLine2");
        n.ruleBase = this.findNode(n.ruleWin, "bbRuleLine3");
        n.ruleClose = this.findNode(n.ruleWin, "bbRuleClose");

        // 结算(settlePanel 及其子节点)
        n.resultPanel = this.findNode(root, "settlePanel");
        n.resultTitle = this.findNode(n.resultPanel, "settleTitle");
        // 结算顶部结果图(场景 topSprite 下): 失败/胜利/平局
        n.sbSprite = this.findNode(n.resultPanel, "sbSprite");
        n.slSprite = this.findNode(n.resultPanel, "slSprite");
        n.hjSprite = this.findNode(n.resultPanel, "hjSprite");
        n.resultContent = this.findNode(n.resultPanel, "settleContent");
        n.settleRound = this.findNode(n.resultPanel, "settleRound");   // 左上「第几局」文字(场景节点)
        // 记录场景里结算文字的字号/位置: 本局结算用场景默认值, 整场总结算行数少, 改用更小字号
        var rcLabel = n.resultContent ? n.resultContent.getComponent(cc.Label) : null;
        this._settleFontSize = rcLabel ? rcLabel.fontSize : 32;
        this._settleLineHeight = rcLabel ? rcLabel.lineHeight : 46;
        this._settleContentY = n.resultContent ? n.resultContent.y : 108;
        n.resultCloseBtn = this.findNode(n.resultPanel, "settleAgainBtn");
        n.resultExitBtn = this.findNode(n.resultPanel, "settleExitBtn");
        // 结算左上角「申请解散」: 点了只让自己退出房间, 不发起解散
        n.disbandBtn = this.findNode(n.resultPanel, "bbDisbandBtn");
        n.resultCloseLabel = this.findNode(n.resultCloseBtn, "settleAgainBtnLabel");
        n.resultExitLabel = this.findNode(n.resultExitBtn, "settleExitBtnLabel");
        n.resultList = this.findNode(n.resultPanel, "result_list");
        n.btnReady = this.findNode(n.resultPanel, "btnReady");

        // 解散投票
        n.dissolvePanel = this.findNode(root, "dissolvePanel");
        n.dissolveAgreeBtn = this.findNode(root, "dissolveAgreeBtn");
        n.dissolveRejectBtn = this.findNode(root, "dissolveRejectBtn");

        // 整场(房间)结束总结算弹窗: 场景 game_result 节点, 与单局结算 settlePanel 完全独立
        n.finalPanel = this.findNode(root, "game_result");
        n.finalInfo = this.findNode(n.finalPanel, "bbFinalInfo");
        n.finalBackBtn = this.findNode(n.finalPanel, "bbFinalBack");
        n.finalJoinBtn = this.findNode(n.finalPanel, "bbFinalJoin");
        n.finalClose = this.findNode(n.finalPanel, "btnClose");
        n.finalCards = [];
        for (var fi = 0; fi < 6; ++fi) {
            var fc = this.findNode(n.finalPanel, "bbFinalCard" + fi);
            if (!fc) continue;
            n.finalCards.push({
                root: fc,
                bg: this.findNode(fc, "bbCardBg"),
                win: this.findNode(fc, "bbWinTag"),
                avatar: this.findNode(fc, "bbAvatar"),
                name: this.findNode(fc, "bbPName"),
                id: this.findNode(fc, "bbPId"),
                score: this.findNode(fc, "bbPScore")
            });
        }
        if (n.finalPanel) n.finalPanel.active = false;
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
            // 场景里为了让编辑器能看到/调整, 这一排默认是勾上的; 运行时先统一关掉, 只在免摆亮牌时打开
            var rowCards = this.findNode(seat, "bbRowCards");
            if (rowCards) rowCards.active = false;

            this._seatNodes[i] = {
                root: seat,
                icon: icon,
                userSprite: this.findNode(seat, "username"),   // 座位人影底板(空位时染灰=占位人影)
                nameLabel: lblName,
                scoreLabel: lblScore,
                zhuang: zhuang,
                readyMark: ready,
                okSprite: this.findNode(seat, "okSprite"),   // 坐下标记: 有人坐下显示, 开局隐藏
                swSprite: this.findNode(seat, "swSprite"),   // 头像区标记: 有玩家时与头像/昵称同时段显示
                cardsNode: this.findNode(seat, "bbCards"),   // 牌桌牌区: 摆牌弹窗打开时整块隐藏
                slots: slots,
                // 免摆整手展示用的一排六个牌位(场景里新增, 缺失时退化为原来的三排)
                rowCards: rowCards,
                rowSlots: (function () {
                    var rs = [];
                    for (var rk = 0; rk < 6; ++rk) {
                        var rn = this.findNode(seat, "bbRowCard" + rk);
                        if (rn) rn.zIndex = rk;   //同 butSprite 那排: 后一张盖前一张
                        rs.push(rn);
                    }
                    return rs;
                }).call(this),
                daoLabels: labels,
                summary: summary,
                bubble: this.findNode(seat, "bbBubble"),
                mianType: this.findNode(seat, "bbMianType")   // 免摆牌型文字(场景里配, 位置/字号可调)
            };
            // 点头像弹玩家信息(userinfo)
            (function (idx, iconNode) {
                if (iconNode) this.bindButton(iconNode, function () { this.onSeatIconClick(this._seatNodes[idx]); }, this);
            }).call(this, i, icon);
        }
    },

    // ===== 玩家信息弹窗(点头像) =====
    // 场景 Canvas/userinfo: 点击任意玩家头像弹出; 点自己显示在头像上方, 点他人显示在头像下方并左对齐
    _initUserInfo: function () {
        var ui = cc.find("Canvas/userinfo") || this.findNode(this.node, "userinfo");
        this._userinfo = ui;
        if (!ui) return;
        // Widget 四边拉伸会在激活时把节点拉回画布中心, 关掉它才能按头像位置自由摆放
        var wg = ui.getComponent(cc.Widget);
        if (wg) wg.enabled = false;
        ui.active = false;
        this.bindButton(ui, this.onUserInfoClose, this);
    },

    onUserInfoClose: function () {
        if (this._userinfo) this._userinfo.active = false;
    },

    onSeatIconClick: function (sn) {
        var ui = this._userinfo;
        if (!ui || !sn || !(Number(sn._uid) > 0)) return;
        ui.active = true;
        ui.setSiblingIndex(9999);
        // 表情面板里的动态表情播放到"这位玩家"的头像上
        this._userinfoUserId = Number(sn._uid) || 0;
        if (this._dynEmojiList) {
            this._dynEmojiList.active = true;
            this._dynEmojiList.setSiblingIndex(ui.children.length - 1);
        }
        // 头像: 直接复用座位上已加载好的头像帧
        var iconSprite = sn.icon ? sn.icon.getComponent(cc.Sprite) : null;
        var uiIcon = this.findNode(ui, "icon");
        if (uiIcon && iconSprite) {
            var sp = uiIcon.getComponent(cc.Sprite);
            if (sp) sp.spriteFrame = iconSprite.spriteFrame;
        }
        this.setStr(this.findNode(ui, "name"), sn._uname || "");
        this.setStr(this.findNode(ui, "ip"), "IP: " + String(sn._ip || "").replace("::ffff:", ""));
        this.setStr(this.findNode(ui, "id"), "ID: " + sn._uid);
        var female = this.findNode(ui, "sex_female");
        if (female) female.active = (sn._sex == 2);
        var male = this.findNode(ui, "sex_male");
        if (male) male.active = (sn._sex == 1);
        this._placeUserInfo(ui, sn);
    },

    _placeUserInfo: function (ui, sn) {
        var frame = ui.getChildByName("public_frame_a") || ui;
        var icon = sn.icon;
        var parent = ui.parent;
        if (!icon || !parent) return;
        var pr = frame.getBoundingBoxToWorld();
        var ar = icon.getBoundingBoxToWorld();
        var gap = 10;
        var left, bottom;
        if (!this._watching && sn === this._seatNodes[0]) {
            // 自己: 面板底边在头像上方, 水平居中
            left = ar.x + ar.width / 2 - pr.width / 2;
            bottom = ar.y + ar.height + gap;
        } else {
            // 他人: 面板顶边在头像下方; 右侧两个座位右对齐, 其余左对齐
            var rightSide = (sn === this._seatNodes[4] || sn === this._seatNodes[5]);
            left = rightSide ? (ar.x + ar.width - pr.width) : ar.x;
            bottom = ar.y - gap - pr.height;
        }
        var p0 = parent.convertToNodeSpaceAR(cc.v2(pr.x, pr.y));
        var p1 = parent.convertToNodeSpaceAR(cc.v2(left, bottom));
        ui.x += p1.x - p0.x;
        ui.y += p1.y - p0.y;
    },

    // 摆牌弹窗打开时隐藏牌桌上所有牌(6 个座位的 bbCards), 收起/确认出牌后恢复
    _setSeatCardsVisible: function (visible) {
        // 摆牌阶段禁止整桌打开: 只有已确认出牌的那几家显示自己的牌背
        if (visible && this._isArrangeTurn()) { this._applyArrangeSeatVisible(); return; }
        var dbg = [];
        for (var i = 0; i < this._seatNodes.length; ++i) {
            var sn = this._seatNodes[i];
            if (!sn) continue;
            if (sn.cardsNode) sn.cardsNode.active = !!visible;
            if (!visible && sn.rowCards) sn.rowCards.active = false;
            // 容器缺失时直接关单卡, 保证不会残留在桌面上
            if (!visible && sn.slots) {
                for (var j = 0; j < sn.slots.length; ++j) { if (sn.slots[j]) sn.slots[j].active = false; }
            }
            if (dbg.length < 6) dbg.push((sn.root ? sn.root.name : "?") + ":" + (sn.cardsNode ? "1" : "0"));
        }
        console.log("[BB] seatCards visible=" + visible + " " + dbg.join(" "));
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
        // 图三: 每行右侧 X 删除按钮 + 弹窗外底部「全部取消」
        this._arrangeDelBtns = [];
        for (var dx = 0; dx < 3; ++dx) this._arrangeDelBtns.push(this.findNode(root, "bbArrDelX" + dx));
        this._arrangeCancelAllBtn = this.findNode(root, "bbCancelAllBtn");
        // 右上角 X 关闭按钮 + 收起后右下角「摆牌」重开按钮(后者在 bbArrange 同级, 默认隐藏)
        this._n.bbArrClose = this.findNode(root, "bbArrCloseBtn");
        this._n.bbArrReopen = this.findNode(this.node, "bbArrReopen");
        if (this._n.bbArrReopen) this._n.bbArrReopen.active = false;
        // 弹窗内底部 6 个手牌位(场景已烘焙 bbArrHand0-5): 弹窗盖住主屏手牌, 拖拽在这排上进行
        // 同时记录场景静止位: 每局重开都按它复位, 避免上一局拖拽落点残留
        this._arrangeHandSlots = [];
        this._arrangeHandHome = [];
        for (var h = 0; h < 6; ++h) {
            var hn = this.findNode(root, "bbArrHand" + h);
            this._arrangeHandSlots.push(hn);
            this._arrangeHandHome.push(hn ? { x: hn.x, y: hn.y, sx: hn.scaleX, sy: hn.scaleY } : null);
            //后一张必须盖住前一张: 六个牌位是同级节点, 统一按序号设 zIndex, 不依赖场景里的兄弟顺序
            if (hn) hn.zIndex = h;
        }
        this._bindArrangeDrag();
        root.active = false;
    },

    // 免摆确认弹窗: 场景 bbConfirm 下只保留「免摆出牌」按钮
    _buildConfirmUI: function () {
        var root = this.findNode(this.node, "bbConfirm");
        if (!root) return;
        if (this._confirmRoot) return;
        this._confirmRoot = root;
        this._confirmAutoBtn = this.findNode(root, "bbConfirmBtn-a");
        // 结算弹窗的倒计时(场景内节点, 位置由编辑器调); bbArrangeCd 在 _buildArrangeUI 收集
        this._settleCd = this.findNode(this._n.resultPanel, "settleCd");
        // 预览牌位/牌型名全部在场景里: bbConfirmPreview > bbConfirmCard0-5, bbConfirmTypeLabel
        this._confirmPreview = this.findNode(root, "bbConfirmPreview");
        this._confirmSlots = [];
        for (var i = 0; i < 6; ++i) {
            var cs = this.findNode(root, "bbConfirmCard" + i);
            this._confirmSlots.push(cs);
            //同 butSprite 那排: 后一张盖前一张
            if (cs) cs.zIndex = i;
        }
        var typeNode = this.findNode(root, "bbConfirmTypeLabel");
        this._confirmTypeLabel = typeNode ? typeNode.getComponent(cc.Label) : null;
        if (this._confirmTypeLabel) this._confirmTypeLabel.string = "";
        root.active = false;
    },

    // 填免摆预览: 6 张牌取服务端 myMian.cards(已按最优牌型排好), 名称取 myMian.typeName
    _renderConfirmPreview: function () {
        if (!this._confirmRoot || !this._confirmRoot.active) return;
        var nm = cc.vv && cc.vv.gameNetMgr;
        var mian = nm && nm.bbMyMian;
        var cards = mian && mian.cards;
        var has = !!(cards && cards.length >= 6);
        if (this._confirmPreview) this._confirmPreview.active = has;
        if (this._confirmTypeLabel) this._confirmTypeLabel.string = has ? (mian.typeName || "") : "";
        if (!has || !this._confirmSlots) return;
        for (var i = 0; i < this._confirmSlots.length; ++i) {
            var sp = this._confirmSlots[i].getComponent(cc.Sprite);
            if (!sp) continue;
            sp.spriteFrame = this.frameOf(cards[i]) || this._cardBack || null;
        }
    },

    _bindButtons: function () {
        this.bindButton(this._n.readyBtn, this.onReady, this);
        this.bindButton(this._n.exitBtn, this.onExit, this);
        this.bindButton(this._n.dissolveBtn, this.onDissolve, this);
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
        // 设置面板:右上角设置按钮 -> 打开 popups/settings;桌面背景按钮 -> 背景选择弹窗(DeskStyle)
        // 注意:findNode 只按节点名递归查找,不支持 "a/b/c" 这种路径写法,这里统一用 cc.find 取路径
        var settingsRoot = cc.find("Canvas/popups/settings");
        this._settingsRoot = settingsRoot;
        this._deskBgBtn = settingsRoot ? settingsRoot.getChildByName("btn_desk_bg") : null;
        this.bindButton(this._deskBgBtn, this.onDeskBgClick, this);
        // 右上角设置按钮:场景里该按钮的 clickEvents 目标已丢失,运行时绑定
        this.bindButton(cc.find("Canvas/btn_settings"), this.onBtnSettingsClicked, this);
        // 图四~图八新增: 规则弹窗 / 换桌 / 分享战绩 / 申请解散 / 摆牌行删除 / 全部取消
        this.bindButton(this._n.ruleBtn, this.onRuleOpen, this);
        this.bindButton(this._n.ruleClose, this.onRuleClose, this);
        this.bindButton(this._n.changeDeskBtn, this.onChangeDesk, this);
        this.bindButton(this._n.shareBtn, this.onShareResult, this);
        // 结算弹窗左上「申请解散」: 只让自己退出房间, 不发起整房解散, 不参加下一局
        this.bindButton(this._n.disbandBtn, this.onExit, this);
        this.bindButton(this._arrangeCancelAllBtn, this.onCancelAllArrange, this);
        this.bindButton(this._n.bbArrClose, this.onArrangeCloseTap, this);
        this.bindButton(this._n.bbArrReopen, this.onArrangeReopenTap, this);
        // 整场结束总结算弹窗(场景 game_result): 返回大厅 / 快速加入 / 右上角关闭
        this.bindButton(this._n.finalBackBtn, this.onFinalBack, this);
        this.bindButton(this._n.finalJoinBtn, this.onFinalJoin, this);
        this.bindButton(this._n.finalClose, this.onFinalBack, this);
        for (var bd = 0; bd < 3; ++bd) {
            (function (dd, btnNode) {
                this.bindButton(btnNode, function () { this.onDaoTap(dd); }, this);
            }).call(this, bd, this._arrangeDelBtns && this._arrangeDelBtns[bd]);
        }
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

    // ===== 房间聊天(文字/快捷语/表情) =====
    // 场景 Canvas 下有两套同名 btn_chat/chat(旧拷贝组件被禁用), 取后面复制出来的那套可用节点
    _initChat: function () {
        if (this._chatInited) return;
        var canvas = this.node;
        var pickLast = function (name) {
            var arr = canvas.children, found = null;
            for (var i = 0; i < arr.length; ++i) {
                if (arr[i].name === name) found = arr[i];
            }
            return found;
        };
        var btnChat = pickLast("btn_chat");
        var panel = pickLast("chat");
        if (!btnChat || !panel) { console.log("[BB] 场景里没有聊天节点, 跳过"); return; }
        this._chatInited = true;
        this._chatPanel = panel;
        panel.active = false;
        var self = this;
        var bg = this.findNode(panel, "chat_emojibg");
        if (bg) this.bindButton(bg, function () { panel.active = false; }, this);
        // 打开弹窗默认落在快捷语
        this.bindButton(btnChat, function () { self._switchChatTab(true); panel.active = true; }, this);
        this._chatQuickList = this.findNode(panel, "quickchatlist");
        this._chatEmojiList = this.findNode(panel, "emojis");
        // userinfo 只放新互动表情(扣费); chat 放原 16 个动态表情(免费)
        this._dynEmojiList = this.findNode(this._userinfo, "emojis");
        // chat 场景里没有原表情网格时, 在 userinfo 改造前克隆原 15 格, 再补 xgd
        if (!this._chatEmojiList && this._dynEmojiList) {
            var emoClone = cc.instantiate(this._dynEmojiList);
            // 不能叫 emojis: 场景上的 Chat.js 会按名字找到它并把静态格子换成骨骼动画
            emoClone.name = "emojisStatic";
            emoClone.active = false;
            panel.addChild(emoClone);
            // 模板带 Widget 拉伸, 克隆到聊天面板会改变格子布局, 去掉
            emoClone.getComponentsInChildren(cc.Widget).forEach(function (w) { w.destroy(); });
            var emoBg = this.findNode(panel, "chat_emojibg");
            var ebw = emoBg ? emoBg.width : 920;
            var ebh = emoBg ? emoBg.height : 460;
            var esw = this._dynEmojiList.width || 1400;
            var esh = this._dynEmojiList.height || 700;
            emoClone.scale = Math.min(ebw / esw, ebh / esh) * 0.98;
            emoClone.setPosition(emoBg ? emoBg.x : 0, emoBg ? emoBg.y : -20);
            this._chatEmojiList = emoClone;
            console.log("[BB] 聊天静态表情面板已克隆: scale=" + emoClone.scale.toFixed(2));
        }
        var tabQuick = this.findNode(panel, "tabQuick");
        var tabEmoji = this.findNode(panel, "tabEmoji");
        this.bindButton(tabQuick, function () { self._switchChatTab(true); }, this);
        this.bindButton(tabEmoji, function () { self._switchChatTab(false); }, this);
        var iptN = this.findNode(panel, "iptChat");
        this._chatIpt = iptN ? iptN.getComponent(cc.EditBox) : null;
        // 发送/关闭按钮: 弹窗里同名的 btnSend 可能有两个, 小的那个(50x50)是右上角关闭, 其余是发送
        var chatSendNodes = [];
        (function collect(n) { if (n.name === "btnSend") chatSendNodes.push(n); (n.children || []).forEach(collect); })(panel);
        chatSendNodes.forEach(function (bn) {
            if (bn.width <= 60) self.bindButton(bn, function () { panel.active = false; }, self);
            else self.bindButton(bn, function () { self._sendChatInput(); }, self);
        });
        if (iptN) {
            iptN.on("editing-return", function () { self._sendChatInput(); });
            iptN.on("editing-did-ended", function () { self._sendChatInput(); });
        }
        // 快捷语 item0~item8 / 表情条目: 容器里所有带名字的叶子节点逐个绑
        this._chatQuickInfo = {
            0: { content: "快点啊，都等到我花儿都谢谢了！" },
            1: { content: "怎么又断线了，网络怎么这么差啊！" },
            2: { content: "不要走，决战到天亮！" },
            3: { content: "你的牌打得也太好了！" },
            4: { content: "你是妹妹还是哥哥啊？" },
            5: { content: "和你合作真是太愉快了！" },
            6: { content: "大家好，很高兴见到各位！" },
            7: { content: "各位，真是不好意思，我得离开一会儿。" },
            8: { content: "不要吵了，专心玩游戏吧！" }
        };
        this._bindChatItems(this._chatQuickList, true);
        this._bindChatItems(this._chatEmojiList, false);
        this._chatBubbles = [];
        this._emojiFrames = {};
        this._chatBgFrame = null;
        // 表情帧直接取场景 emoji 条目节点的 SpriteFrame(节点名即表情id), 不再依赖图集异步加载:
        // 图集加载失败/未完成时也能显示表情, 收到别人发的表情同样按名字取帧
        var collectEmoji = function (node) {
            if (!node) return;
            var kids = node.children || [];
            if (kids.length > 0) { for (var k = 0; k < kids.length; ++k) collectEmoji(kids[k]); return; }
            if (!node.name || node.name === "sp" || node.name === "New Node") return;
            var sp = node.getComponent(cc.Sprite);
            var sf = sp && sp.spriteFrame;
            if (!sf) return;
            self._emojiFrames[node.name] = sf;
            self._emojiFrames[node.name + ".png"] = sf;
        };
        collectEmoji(this._chatEmojiList);
        console.log("[BB] 场景表情帧=" + Object.keys(this._emojiFrames).length);
        // 动态表情(逆向原包 SmileMJ/SmileGirl 骨骼): 静态帧只作骨骼未就绪时的回退
        this._emojiSpine = {};
        this._emojiPanelBuilt = false;
        this._loadEmojiSpines();
        // userinfo 下的动态表情面板: 只做引用补齐与关闭按钮(含 x)绑定
        this._setupUserInfoEmoji();
        // preload 表情 atlas + 气泡底图(Cocos 2.4 没有 cc.SpriteFrameCache, 自己存引用)
        var self2 = this;
        cc.resources.load("images/chat/emoji_action_texture", cc.SpriteAtlas, function (err, atlas) {
            if (atlas) {
                atlas.getSpriteFrames().forEach(function (f) {
                    self2._emojiFrames[f.name + ".png"] = f;
                    self2._emojiFrames[f.name] = f;
                });
                self2._emojiAtlasLoaded = true;
            } else { self2._emojiAtlasLoaded = false; }
        });
        cc.resources.load("images/chat/chat_emojibg.png", cc.SpriteFrame, function (err, sf) {
            if (sf) self2._chatBgFrame = sf;
        });
        this._switchChatTab(true);
        console.log("[BB] 聊天已接上");
    },

    _switchChatTab: function (quick) {
        if (this._chatQuickList) this._chatQuickList.active = !!quick;
        if (this._chatEmojiList) this._chatEmojiList.active = !quick;
    },

    // ===== 动态表情骨骼 =====
    // 面板 15 个格子依次对应的骨骼(逆向原包 SmileMJ 12 个麻将表情 + SmileGirl 3 个女生表情)
    // 数组不能直接挂在 cc.Class 原型上(会报 Unknown type), 统一在 ctor 里初始化
    ctor: function () {
        this._emojiSpineNames = ["yihuo", "kuaidian", "zhenbang", "aini", "daxiao", "yunle",
                                 "yishoulanpai", "dengchang", "jingle", "huaixiao", "keshui", "886",
                                 "wolaile", "dalaozaici", "biepao"];
        // 互动表情(逆向包 Common/chat/anim): 只放在 userinfo, 发送扣费
        // 后 23 个为逆向包 dtg/amgs 里其余聊天/礼物表情(牛牛、色子等游戏特效未收)
        this._interactNames = ["dianzan", "baoza1", "jidan1", "huaban1", "xin", "chuizi2", "dapao",
                               "gongjian", "jiguanqiang", "e1004", "chuizi", "jidan", "huaban",
                               "baoza", "zhuaji", "bingtong", "dong", "xi", "nan", "bei", "zhong",
                               "ainio", "anzhongguancha", "dacuopaile", "emo", "haixiu", "kuaidianba",
                               "shanyaodengchang", "tuoguan", "yiqifacai", "bixin", "bobo", "caishen",
                               "fanqie", "hua", "huojian", "jubaopen", "pencaoqiang", "tiangou",
                               "xinxin", "youting", "zhadan", "zhichi", "zhuoji"];
        this._interactSpine = {};
    },

    _loadEmojiSpines: function () {
        var self = this;
        var normalNames = this._emojiSpineNames;
        var names = normalNames.concat(this._interactNames);
        var loadOne = function (i) {
            if (i >= names.length) {
                console.log("[BB] 动态表情骨骼加载完成=" + Object.keys(self._emojiSpine).length);
                console.log("[BB] 互动表情骨骼加载完成=" + Object.keys(self._interactSpine).length);
                self._buildEmojiPanel();
                self._buildUserInfoInteract();
                return;
            }
            var name = names[i];
            var isInteract = i >= normalNames.length;
            cc.resources.load("anims/smile/" + name, sp.SkeletonData, function (err, sd) {
                if (sd) (isInteract ? self._interactSpine : self._emojiSpine)[name] = sd;
                else console.log("[BB] 表情骨骼缺失: " + name, err);
                loadOne(i + 1);
            });
        };
        loadOne(0);
    },

    // 骨骼尺寸(JSON skeleton.width/height), 缺失时给个经验值
    _emojiSpineSize: function (sd) {
        var sk = sd && sd.skeletonJson && sd.skeletonJson.skeleton;
        return { w: (sk && sk.width) || 240, h: (sk && sk.height) || 270 };
    },

    // 素材实际包围盒(骨骼坐标系, 原点不一定是素材中心): 用 setup pose 的骨骼/附件顶点算一遍并缓存
    _emojiBounds: function (sd) {
        if (!sd) return { minX: -120, minY: 0, maxX: 120, maxY: 270 };
        if (sd.__emojiBounds) return sd.__emojiBounds;
        var sz = this._emojiSpineSize(sd);
        var fallback = { minX: -sz.w / 2, minY: 0, maxX: sz.w / 2, maxY: sz.h };
        var j = sd.skeletonJson;
        if (!j || !j.bones || !j.slots) { sd.__emojiBounds = fallback; return fallback; }
        var byName = {};
        j.bones.forEach(function (b) { byName[b.name] = b; });
        var cache = {};
        function world(name) {
            if (cache[name]) return cache[name];
            var b = byName[name];
            if (!b) return (cache[name] = { x: 0, y: 0, rot: 0 });
            var px = b.x || 0, py = b.y || 0, rot = b.rotation || 0;
            var p = b.parent ? world(b.parent) : { x: 0, y: 0, rot: 0 };
            var rad = p.rot * Math.PI / 180;
            return (cache[name] = {
                x: p.x + px * Math.cos(rad) - py * Math.sin(rad),
                y: p.y + px * Math.sin(rad) + py * Math.cos(rad),
                rot: p.rot + rot
            });
        }
        function tp(boneName, x, y) {
            var w = world(boneName);
            var rad = w.rot * Math.PI / 180;
            return {
                x: w.x + x * Math.cos(rad) - y * Math.sin(rad),
                y: w.y + x * Math.sin(rad) + y * Math.cos(rad)
            };
        }
        var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
        function add(p) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
        var skins = j.skins || {};
        var def = skins["default"] || skins[Object.keys(skins)[0]] || {};
        j.slots.forEach(function (slot) {
            var skin = def[slot.name];
            if (!skin) return;
            var att = skin[slot.attachment];
            if (!att) return;
            var verts = att.vertices;
            if (!verts) {
                // 区域附件: 以附件原点为中心的四角
                if (att.width != null && att.height != null) {
                    var w2 = att.width / 2 * (att.scaleX == null ? 1 : att.scaleX);
                    var h2 = att.height / 2 * (att.scaleY == null ? 1 : att.scaleY);
                    var rr = ((world(slot.bone).rot || 0) + (att.rotation || 0)) * Math.PI / 180;
                    var cx = att.x || 0, cy = att.y || 0;
                    [[-w2, -h2], [w2, -h2], [w2, h2], [-w2, h2]].forEach(function (p) {
                        add(tp(slot.bone, cx + p[0] * Math.cos(rr) - p[1] * Math.sin(rr),
                                               cy + p[0] * Math.sin(rr) + p[1] * Math.cos(rr)));
                    });
                }
                return;
            }
            var i = 0;
            while (i < verts.length) {
                var bc = verts[i++];
                if (!(bc > 0 && bc <= 4)) {
                    // 非蒙皮网格: 顶点是成对的坐标
                    i -= 1;
                    var px0 = verts[i++], py0 = verts[i++];
                    add(tp(slot.bone, px0, py0));
                    continue;
                }
                var sx = 0, sy = 0, tw = 0;
                for (var k = 0; k < bc; ++k) {
                    var bi = verts[i++], bx = verts[i++], by = verts[i++], bw = verts[i++];
                    var bn = (j.bones[bi] || {}).name;
                    var p2 = tp(bn, bx, by);
                    sx += p2.x * bw; sy += p2.y * bw; tw += bw;
                }
                if (tw > 0) { sx /= tw; sy /= tw; }
                add({ x: sx, y: sy });
            }
        });
        var b = (minX > maxX) ? fallback : { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
        sd.__emojiBounds = b;
        return b;
    },

    // 图集动图 xgd: 6 张逐帧图(xg1~xg6)在 anims/xgd 下, 与骨骼表情共用发送链路
    _loadXgdFrames: function () {
        if (this._xgdFrames || this._xgdLoading) return;
        this._xgdLoading = true;
        var self = this;
        cc.resources.load("anims/xgd/xgd", cc.SpriteAtlas, function (err, atlas) {
            self._xgdLoading = false;
            if (err || !atlas) { console.log("[BB] xgd 图集加载失败", err); return; }
            var arr = [];
            for (var i = 1; i <= 6; ++i) {
                var fr = atlas.getSpriteFrame("xg" + i + ".png") || atlas.getSpriteFrame("xg" + i);
                if (!fr) break;
                arr.push(fr);
            }
            if (!arr.length) { console.log("[BB] xgd 图集里没有帧"); return; }
            self._xgdFrames = arr;
            console.log("[BB] xgd 动图帧数=" + arr.length);
            if (self._xgdCell && cc.isValid(self._xgdCell)) {
                var sp = self._xgdCell.getComponent(cc.Sprite) || self._xgdCell.addComponent(cc.Sprite);
                if (sp) { sp.enabled = true; sp.sizeMode = cc.Sprite.SizeMode.CUSTOM; sp.spriteFrame = arr[0]; }
            }
        });
    },

    // chat 原动态表情面板: 15 个骨骼表情 + xgd, 免费发送且保持动态播放
    _buildEmojiPanel: function () {
        var panel = this._chatEmojiList;
        if (this._emojiPanelBuilt || !panel) return;
        this._loadXgdFrames();
        var grid = panel.children && panel.children[0];
        if (!grid || !grid.children || !grid.children.length) return;

        // 场景列表高700，弹框底图只有460高；以底图作为可视窗口，避免第三排伸出弹框。
        // 调整列表后反向补偿格子容器，首屏表情仍保持场景原来的屏幕坐标。
        var listBg = panel.parent ? this.findNode(panel.parent, "chat_emojibg") : null;
        if (listBg && listBg.height > 0) {
            var listSX = Math.abs(panel.scaleX) || 1;
            var listSY = Math.abs(panel.scaleY) || 1;
            var oldListX = panel.x, oldListY = panel.y;
            panel.height = listBg.height / listSY;
            panel.setPosition(listBg.x, listBg.y);
            grid.setPosition(
                grid.x + (oldListX - panel.x) / listSX,
                grid.y + (oldListY - panel.y) / listSY
            );
        }
        var listMask = panel.getComponent(cc.Mask) || panel.addComponent(cc.Mask);
        listMask.type = cc.Mask.Type.RECT;
        listMask.enabled = true;
        var listScroll = panel.getComponent(cc.ScrollView) || panel.addComponent(cc.ScrollView);
        listScroll.horizontal = false;
        listScroll.vertical = true;
        listScroll.inertia = true;
        listScroll.cancelInnerEvents = true;
        listScroll.content = grid;
        this._emojiListScroll = listScroll;

        this._emojiPanelBuilt = true;
        var self = this;
        var olds = grid.children.slice();
        var cells = [];
        this._emojiStaticOf = {};
        olds.forEach(function (old, idx) {
            var name = self._emojiSpineNames[idx];
            // chat 表情页只放原 15 格
            if (!name) { old.active = false; return; }
            old.active = true;
            cells.push({ name: name });
            if (self._emojiFrames && self._emojiFrames[old.name]) self._emojiStaticOf[name] = self._emojiFrames[old.name];
            // 显示完全由场景节点决定, 代码只绑点击
            var btn = old.getComponent(cc.Button);
            if (btn) btn.enabled = false;
            old.on(cc.Node.EventType.TOUCH_END, function () {
                if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("btnClick.wav");
                self._sendEmoji(name);
            });
        });
        // 图集逐帧动图(xgd): 节点在场景里, 代码只在上面播放帧, 不改位置/尺寸
        var xgd = grid.getChildByName("xgd");
        if (xgd) {
            xgd.active = true;
            var cbtn = xgd.getComponent(cc.Button);
            if (cbtn) cbtn.enabled = false;
            xgd.on(cc.Node.EventType.TOUCH_END, function () {
                if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("btnClick.wav");
                self._sendEmoji("xgd");
            });
            this._xgdCell = xgd;
        }
        cells.push({ name: "xgd" });
        if (!cells.length) return;
        console.log("[BB] chat 原动态表情格子=" + cells.length + " 骨骼=" + Object.keys(this._emojiSpine).length);
    },

    // userinfo 互动表情: 显示由场景节点决定, 代码只绑点击(扣费)
    _buildUserInfoInteract: function () {
        var emo = this._dynEmojiList;
        if (!emo || this._uiInteractBuilt) return;
        var grid = this.findNode(emo, "New Layout") || (emo.children && emo.children[0]);
        if (!grid) return;
        this._uiInteractBuilt = true;
        var self = this;
        var cells = [];
        this._interactNames.forEach(function (name) {
            var cell = grid.getChildByName(name);
            if (!cell) return;
            cell.on(cc.Node.EventType.TOUCH_END, function () {
                if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("btnClick.wav");
                self._sendDynEmoji(name);
            });
            cells.push(cell);
        });
        // 场景里原有的旧表情格(不属于互动列表)隐藏, 不参与这个列表
        grid.children.forEach(function (c) {
            if (self._interactNames.indexOf(c.name) < 0) {
                var btn = c.getComponent(cc.Button);
                if (btn) { btn.clickEvents = []; btn.enabled = false; }
                c.off(cc.Node.EventType.TOUCH_END);
                c.active = false;
            }
        });
        this._uiInteractCells = cells;
        this._uiInteractGrid = grid;
        console.log("[BB] userinfo 互动表情格子=" + cells.length);
    },

    // ===== 互动表情(逆向包 Common/chat/anim) =====
    // 资源与原表情统一放在 anims/smile, 由 _loadEmojiSpines 一起加载

    // 骨骼里主动画通常叫 animation, 东南西北中叫 1
    _firstAnimName: function (sd) {
        var j = sd && sd.skeletonJson;
        var ks = (j && j.animations) ? Object.keys(j.animations) : [];
        if (ks.indexOf("animation") >= 0) return "animation";
        return ks.length ? ks[0] : "animation";
    },

    // userinfo 内的动态表情面板: 场景里已放好布局, 这里只补输入拦截和关闭绑定
    _setupUserInfoEmoji: function () {
        var emo = this._dynEmojiList;
        var ui = this._userinfo;
        if (!emo || !ui || !cc.isValid(emo) || !cc.isValid(ui)) return;
        if (!emo.getComponent(cc.BlockInputEvents)) emo.addComponent(cc.BlockInputEvents);
        emo.setSiblingIndex(ui.children.length - 1);
        // 关闭按钮: 场景 public_frame_a/closeBtn 与右上角 x 节点
        var close = this.findNode(ui, "closeBtn");
        if (close) this.bindButton(close, this.onUserInfoClose, this);
        var x = this.findNode(ui, "x");
        if (x) this.bindButton(x, this.onUserInfoClose, this);
    },

    // 动态表情点击: 在该玩家头像上播放、扣费发送, 并关闭弹窗
    _onEmojiPicked: function (name) {
        if (!name) return;
        this._sendDynEmoji(name);
    },

    // 发送动态表情(扣费): 本地在头像上播放, 服务端广播给其他玩家
    _sendDynEmoji: function (name) {
        var uid = this._userinfoUserId;
        if (uid) this._playEmojiOnAvatar(uid, name);
        // target: 让其他端也播在"被点击的这位玩家"头像上, 而不是发送者自己头上
        if (cc.vv && cc.vv.net && !this._replay) cc.vv.net.send("emoji", { name: name, free: false, target: uid });
        this.onUserInfoClose();
    },

    // 在指定座位头像上生成动态表情节点(挂 Canvas 最上层); loop=true 循环播放
    _spawnSeatEmoji: function (slot, name, loop) {
        if (name === "xgd") return this._spawnXgdEmoji(slot, loop);
        var sn = this._seatNodes[slot];
        var root = (sn && sn.root) ? sn.root : this.findNode(this.node, "bbSeat" + slot);
        if (!root) return null;
        var icon = this.findNode(root, "icon") || root;
        var sd = (this._emojiSpine && this._emojiSpine[name]) ||
                 (this._interactSpine && this._interactSpine[name]);
        if (!sd) return null;
        var old = icon.getChildByName("emoteSpine");
        if (old) old.destroy();
        var sz = this._emojiSpineSize(sd);
        var bd = this._emojiBounds(sd);
        // 挂到 Canvas 最上层: 挂在头像下会被座位/牌面/弹窗盖住
        var wr = icon.getBoundingBoxToWorld();
        var w = wr.width > 0 ? wr.width : 120;
        var h = wr.height > 0 ? wr.height : w;
        var scale = (w / sz.w) * 3.6;
        // 屏幕可视范围(转到本节点坐标系): 表情整体必须落在这个范围内
        var vs = cc.view.getVisibleSize(), vo = cc.view.getVisibleOrigin();
        var p0 = this.node.convertToNodeSpaceAR(cc.v2(vo.x, vo.y));
        var p1 = this.node.convertToNodeSpaceAR(cc.v2(vo.x + vs.width, vo.y + vs.height));
        var scrMinX = Math.min(p0.x, p1.x), scrMaxX = Math.max(p0.x, p1.x);
        var scrMinY = Math.min(p0.y, p1.y), scrMaxY = Math.max(p0.y, p1.y);
        var bdW = (bd.maxX - bd.minX) * scale;
        var bdH = (bd.maxY - bd.minY) * scale;
        // 素材比屏幕还大时按屏幕缩放, 否则只做位置约束
        var fit = Math.min(1, (scrMaxX - scrMinX) * 0.98 / bdW, (scrMaxY - scrMinY) * 0.98 / bdH);
        if (fit < 1) {
            scale *= fit;
            bdW *= fit;
            bdH *= fit;
        }
        var n = new cc.Node("emoteSpine");
        n.parent = this.node;
        n.zIndex = 9999;
        n.setSiblingIndex(this.node.children.length - 1);
        var wp = icon.convertToWorldSpaceAR(cc.v2(0, 0));
        var pos = this.node.convertToNodeSpaceAR(wp);
        // 骨骼原点不在素材中心: 按素材实际包围盒对齐, 否则整张图会整体偏上
        var artCX = (bd.minX + bd.maxX) / 2 * scale;
        var artCY = (bd.minY + bd.maxY) / 2 * scale;
        pos.x -= artCX;
        if (slot === 3) {
            // 最上面的座位(bbSeat3): 素材顶边与头像顶边平齐, 往下展开, 避免超出屏幕
            pos.y = pos.y + h / 2 - bd.maxY * scale;
        } else {
            pos.y -= artCY;
        }
        // 位置约束: 素材包围盒整块挪进屏幕
        var hw = bdW / 2, hh = bdH / 2;
        if (pos.x - hw < scrMinX) pos.x = scrMinX + hw;
        if (pos.x + hw > scrMaxX) pos.x = scrMaxX - hw;
        if (pos.y - hh < scrMinY) pos.y = scrMinY + hh;
        if (pos.y + hh > scrMaxY) pos.y = scrMaxY - hh;
        n.setPosition(pos);
        n.scale = scale;
        var sk = n.addComponent(sp.Skeleton);
        sk.skeletonData = sd;
        // 互动特效只播一次, 播完自动移除; 普通表情按 loop 循环
        var oneShot = !!(this._interactSpine && this._interactSpine[name]);
        sk.setAnimation(0, this._firstAnimName(sd), oneShot ? false : !!loop);
        if (oneShot && sk.setCompleteListener) {
            sk.setCompleteListener(function () { if (cc.isValid(n)) n.destroy(); });
        }
        return n;
    },

    // 图集动图(xgd)播放: 定位/层级规则与骨骼表情一致(Canvas 最上层、按头像宽缩放、上座顶边对齐)
    _spawnXgdEmoji: function (slot, loop) {
        var frames = this._xgdFrames;
        if (!frames || !frames.length) { this._loadXgdFrames(); return null; }
        var sn = this._seatNodes[slot];
        var root = (sn && sn.root) ? sn.root : this.findNode(this.node, "bbSeat" + slot);
        if (!root) return null;
        var icon = this.findNode(root, "icon") || root;
        var old = icon.getChildByName("emoteAnim");
        if (old) old.destroy();
        var fo = frames[0].getOriginalSize();
        var wr = icon.getBoundingBoxToWorld();
        var w = wr.width > 0 ? wr.width : 120;
        var h = wr.height > 0 ? wr.height : w;
        var scale = (w / fo.width) * 3.6;
        // 帧尺寸不一(300/350/460), 按最大帧约束, 保证每一帧都不出屏
        var maxFW = 0, maxFH = 0;
        for (var fi = 0; fi < frames.length; ++fi) {
            var fs = frames[fi].getOriginalSize();
            if (fs.width > maxFW) maxFW = fs.width;
            if (fs.height > maxFH) maxFH = fs.height;
        }
        var vs = cc.view.getVisibleSize(), vo = cc.view.getVisibleOrigin();
        var p0 = this.node.convertToNodeSpaceAR(cc.v2(vo.x, vo.y));
        var p1 = this.node.convertToNodeSpaceAR(cc.v2(vo.x + vs.width, vo.y + vs.height));
        var scrMinX = Math.min(p0.x, p1.x), scrMaxX = Math.max(p0.x, p1.x);
        var scrMinY = Math.min(p0.y, p1.y), scrMaxY = Math.max(p0.y, p1.y);
        var bdW = maxFW * scale, bdH = maxFH * scale;
        var fit = Math.min(1, (scrMaxX - scrMinX) * 0.98 / bdW, (scrMaxY - scrMinY) * 0.98 / bdH);
        if (fit < 1) {
            scale *= fit;
            bdW *= fit;
            bdH *= fit;
        }
        var n = new cc.Node("emoteAnim");
        n.parent = this.node;
        n.zIndex = 9999;
        n.setSiblingIndex(this.node.children.length - 1);
        var sp = n.addComponent(cc.Sprite);
        sp.sizeMode = cc.Sprite.SizeMode.RAW;   // 每帧宽度不同(300/350/460), 用原始尺寸
        sp.spriteFrame = frames[0];
        var wp = icon.convertToWorldSpaceAR(cc.v2(0, 0));
        var pos = this.node.convertToNodeSpaceAR(wp);
        if (slot === 3) {
            // 最上座: 素材顶边与头像顶边平齐, 往下展开
            pos.y = pos.y + h / 2 - bdH / 2;
        }
        var hw = bdW / 2, hh = bdH / 2;
        if (pos.x - hw < scrMinX) pos.x = scrMinX + hw;
        if (pos.x + hw > scrMaxX) pos.x = scrMaxX - hw;
        if (pos.y - hh < scrMinY) pos.y = scrMinY + hh;
        if (pos.y + hh > scrMaxY) pos.y = scrMaxY - hh;
        n.scale = scale;
        n.setPosition(pos);
        var idx = 0;
        var step = function () {
            if (!cc.isValid(n)) return;
            sp.spriteFrame = frames[idx % frames.length];
            idx++;
        };
        step();
        var tick = cc.sequence(cc.delayTime(0.22), cc.callFunc(step));
        if (loop) {
            n.runAction(cc.repeatForever(tick));
        } else {
            // 只播一遍(~1.3 秒), 播完销毁
            n.runAction(cc.sequence(cc.repeat(tick, frames.length), cc.callFunc(function () {
                if (cc.isValid(n)) n.destroy();
            })));
        }
        return n;
    },

    // 在指定玩家头像上播放一次动态表情, 播完自动销毁
    _playEmojiOnAvatar: function (userId, name) {
        var slot = this._slotIdxOfUser(userId);
        if (slot < 0) return;
        var n = this._spawnSeatEmoji(slot, name, false);
        if (!n) return;
        var sk = n.getComponent(sp.Skeleton);
        if (sk && sk.setCompleteListener) {
            sk.setCompleteListener(function () {
                if (cc.isValid(n)) n.destroy();
            });
        }
        // 兜底: 骨骼事件异常时也保证移除
        n.runAction(cc.sequence(cc.delayTime(4), cc.callFunc(function () {
            if (cc.isValid(n)) n.destroy();
        })));
    },

    _clearEmojiSpine: function (sn) {
        if (!sn || !sn._emojiSpineNode) return;
        if (cc.isValid(sn._emojiSpineNode)) {
            sn._emojiSpineNode.active = false;
            sn._emojiSpineNode.destroy();
        }
        sn._emojiSpineNode = null;
    },

    // 按 userId 找到座位节点序号 (0~5): 优先用桌面上实际渲染的座位(renderSeats 写入 _uid),
    // 其次才按座位表索引换算, 避免两边数据不一致时算到别人头上
    _slotIdxOfUser: function (userId) {
        if (!userId) return -1;
        var uid = Number(userId);
        for (var s = 0; s < this._seatNodes.length; ++s) {
            var sn0 = this._seatNodes[s];
            // 只认当前显示中的座位: 隐藏槽位里的 _uid 是上一阶段残留的, 用它会把表情播到别人头上
            if (sn0 && sn0.root && sn0.root.active && Number(sn0._uid) === uid) return s;
        }
        var nm = cc.vv && cc.vv.gameNetMgr;
        if (!nm) return -1;
        var list = null, myIdx = 0;
        if (this._started && nm.bbSeats && nm.bbSeats.length > 0) {
            list = nm.bbSeats; myIdx = this._mySeat || 0;
        } else if (nm.seats && nm.seats.length > 0) {
            list = nm.seats; myIdx = nm.seatIndex >= 0 ? nm.seatIndex : 0;
        }
        if (!list) return -1;
        var total = Math.max(2, Math.min(6, list.length));
        for (var i = 0; i < list.length; ++i) {
            if (list[i] && list[i].userid == userId) {
                var rel = (i - myIdx + list.length) % list.length;
                if (rel >= total) return -1;
                return this._layoutOf(total)[rel];
            }
        }
        return -1;
    },

    // 在指定玩家座位边上显示气泡(节点与位置全在场景 bbSeatX/bbBubble), 2 秒后自动隐藏
    _showBubble: function (senderUserId, content, isEmoji) {
        if (!content) return;
        var slot = this._slotIdxOfUser(senderUserId);
        // 动态表情必须落在发送者自己的头像上: 找不到座位就不播, 免得播到别人头上
        if (isEmoji && slot < 0) return;
        var sn = slot >= 0 ? this._seatNodes[slot] : null;
        if (!sn || !sn.root) {
            // 还没开局(座位还没渲染)时, 直接用场景里的 bbSeatN 兜底, 否则房间里发表情看不到
            var seatNode = slot >= 0 ? this.findNode(this.node, "bbSeat" + slot) : null;
            if (seatNode) {
                sn = { root: seatNode, bubble: this.findNode(seatNode, "bbBubble") || seatNode };
            } else {
                // 找不到座位节点, 用第一个有效座位兜底
                var fs = this._seatNodes.findIndex(function (s) { return s && s.root; });
                if (fs < 0) return;
                sn = this._seatNodes[fs];
            }
        }
        var bubble = sn.bubble;
        if (!bubble) return;

        var txt = this.findNode(bubble, "bbBubbleText");
        // 表情节点用场景里的 bbBubbleEmoji: 坐标/尺寸/父节点/层级一律不动, JS 只切图集帧和显隐
        var em = this.findNode(sn.root, "bbBubbleEmoji");

        if (isEmoji) {
            var raw = String(content).replace(/\.png$/i, "");
            // 动态表情: 在场景 bbBubbleEmoji 上叠加骨骼动画(位置/尺寸/层级不动), 循环播到气泡收起
            var isXgd = (raw === "xgd");
            var sd = !isXgd &&
                     ((this._emojiSpine && this._emojiSpine[raw]) ||
                      (this._interactSpine && this._interactSpine[raw]));
            console.log("[BB] emoji-bubble 内容=" + raw + " 骨骼=" + (!!sd) + " 图集=" + isXgd + " 槽位=" + slot);
            if (em && (sd || isXgd)) {
                this._clearEmojiSpine(sn);
                // 位置以发送者头像为准: 气泡节点的坐标是给文字气泡用的, 直接用它会出现"播到别人头像上"
                em.active = false;
                if (txt) txt.active = false;
                var en = this._spawnSeatEmoji(slot, raw, true);
                if (en) {
                    var baseScale = en.scale;
                    // 收到时先放大再回落到原大小
                    en.runAction(cc.sequence(
                        cc.scaleTo(0.12, baseScale * 1.4),
                        cc.scaleTo(0.18, baseScale)
                    ));
                    sn._emojiSpineNode = en;
                }
            } else {
                // 骨骼未就绪: 退回图集/场景静态帧(图集帧带序号, 且 smile 在图集里拼作 smaile)
                var base = (raw === "smile") ? "smaile" : raw;
                var fr = this._emojiFrames || {};
                // 骨骼名(yihuo...)在静态帧里对应的是场景节点名(happy...), 用构建面板时存的映射兜底
                var emFrame = fr[raw] || (this._emojiStaticOf && this._emojiStaticOf[raw]) ||
                              fr[base + "0.png"] || fr[base] || null;
                if (em) {
                    em.active = !!emFrame;
                    if (emFrame) {
                        var emSp = em.getComponent(cc.Sprite);
                        if (emSp) { emSp.enabled = true; emSp.sizeMode = cc.Sprite.SizeMode.CUSTOM; emSp.spriteFrame = emFrame; }
                    }
                }
                if (txt) {
                    txt.active = !emFrame;   // 图集没加载出来时才退回文字
                    if (!emFrame) {
                        var lb0 = txt.getComponent(cc.Label);
                        if (lb0) lb0.string = content;
                    }
                }
            }
            // 气泡节点本身保持 active: 老场景里表情节点还挂在 bbBubble 底下,
            // 直接 active=false 会把表情一起隐藏掉; 只有真显示文字时才打开气泡底图
            bubble.active = true;
            var bubSp0 = bubble.getComponent(cc.Sprite);
            if (bubSp0) bubSp0.enabled = !isEmoji || !!(txt && txt.active);
        } else {
            this._clearEmojiSpine(sn);
            if (em) em.active = false;
            if (txt) {
                txt.active = true;
                var lb = txt.getComponent(cc.Label);
                if (lb) {
                    lb.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
                    var tw = 20 + String(content).length * 20;
                    if (tw < 80) tw = 80;
                    if (tw > 240) tw = 240;
                    txt.width = tw;
                    lb.string = content;
                    // 与包麻将等浅色气泡场景一致，使用深灰字保证可读性。
                    lb.node.color = cc.color(60, 60, 60);
                }
            }
            bubble.active = true;
            var bubSp1 = bubble.getComponent(cc.Sprite);
            if (bubSp1) bubSp1.enabled = true;   // 文字消息恢复气泡底图
        }

        // 文字气泡: 下一帧按 Label 实际宽高撑开底图(只改尺寸, 坐标一律用场景里的)
        if (!isEmoji && bubble.active && txt) {
            this.scheduleOnce(function () {
                if (!cc.isValid(bubble) || !cc.isValid(txt)) return;
                var w2 = Math.max(80, txt.width + 20);
                var h2 = Math.max(40, txt.height + 16);
                bubble.setContentSize(w2, h2);
            }, 0);
        }

        // 同一座位连发多条时, 以最后一次为准重新计时
        sn._bubbleSeq = (sn._bubbleSeq || 0) + 1;
        var seq = sn._bubbleSeq;
        var self = this;
        this.scheduleOnce(function () {
            if (sn._bubbleSeq !== seq) return;
            if (cc.isValid(bubble)) bubble.active = false;
            if (cc.isValid(em)) em.active = false;
            self._clearEmojiSpine(sn);
        }, 2.0);
    },

    _bindChatItems: function (root, isQuick) {
        if (!root) return;
        var self = this;
        var walk = function (node) {
            // 表情/快捷语条目上的 Button 还挂着场景里 Chat.js 的 clickEvent, 会和这里重复发送导致重复扣豆
            // 统一清掉场景点击事件, 只保留本脚本这一个发送入口
            var btn = node.getComponent(cc.Button);
            if (btn) btn.clickEvents = [];
            // item0~item8 走 quick_chat(下标), 其余叶子节点按节点名当表情 id
            if (isQuick) {
                var m = /^item(\d+)$/.exec(node.name);
                if (m) self.bindButton(node, function () { self._sendQuickChat(parseInt(m[1], 10)); }, self);
            } else if (node.children && node.children.length === 0 &&
                       node.name !== "sp" && !/^cc/.test(node.name) && node.name !== "New Node") {
                self.bindButton(node, function () { self._sendEmoji(node.name); }, self);
            }
            var kids = node.children || [];
            for (var i = 0; i < kids.length; ++i) walk(kids[i]);
        };
        var kids = root.children || [];
        for (var i = 0; i < kids.length; ++i) walk(kids[i]);
    },

    _sendChatInput: function () {
        if (!this._chatIpt) { console.log("[BB] chat: 输入框未绑定(iptChat缺失)"); return; }
        var text = (this._chatIpt.string || "").replace(/^\s+|\s+$/g, "");
        if (!text) { console.log("[BB] chat: 输入为空, 不发送"); return; }
        this._chatIpt.string = "";
        if (this._chatPanel) this._chatPanel.active = false;
        var myUid = cc.vv && cc.vv.userMgr && cc.vv.userMgr.userId;
        console.log("[BB] chat send: " + text);
        this._showBubble(myUid, text, false);
        if (cc.vv && cc.vv.net && !this._replay) cc.vv.net.send("chat", text);
    },

    _sendQuickChat: function (index) {
        if (this._chatPanel) this._chatPanel.active = false;
        var info = this._chatQuickInfo && this._chatQuickInfo[index];
        console.log("[BB] quick_chat send: " + index);
        if (info) {
            var myUid = cc.vv && cc.vv.userMgr && cc.vv.userMgr.userId;
            this._showBubble(myUid, info.content, false);
        }
        if (cc.vv && cc.vv.net && !this._replay) cc.vv.net.send("quick_chat", index);
    },

    // chat 原 16 个动态表情: 免费发送; free 只控制扣费, 不影响动态播放
    _sendEmoji: function (name) {
        if (this._chatPanel) this._chatPanel.active = false;
        var myUid = cc.vv && cc.vv.userMgr && cc.vv.userMgr.userId;
        console.log("[BB] emoji send: " + name);
        this._showBubble(myUid, name, true);
        if (cc.vv && cc.vv.net && !this._replay) cc.vv.net.send("emoji", { name: name, free: true });
    },

    onChatPush: function (d) {
        if (!d || !d.content) return;
        this._showBubble(d.sender, d.content, false);
    },

    onQuickChatPush: function (d) {
        if (!d) return;
        var info = this._chatQuickInfo && this._chatQuickInfo[d.content];
        if (!info) return;
        this._showBubble(d.sender, info.content, false);
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX(info.sound);
    },

    onEmojiPush: function (d) {
        if (!d) return;
        var content = d.content;
        // 兼容旧协议/旧服务端把 {name,free} 原样广播的情况: 取出表情名
        if (typeof content === "string" && content.charAt(0) === "{") {
            try {
                var obj = JSON.parse(content);
                if (obj && obj.name) content = obj.name;
            } catch (e) {}
        }
        // 播放位置以 target(被指定的玩家)为准, 老协议没有 target 时退回发送者
        // free 只决定是否扣费; 原 16 个免费表情仍按骨骼或 xgd 图集动态播放
        this._showBubble(d.target || d.sender, content, true);
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
        // 聊天推送: 文字 / 快捷语(带语音) / 表情
        this.node.on('chat_push', function (d) { self.onChatPush(d && d.detail); });
        this.node.on('quick_chat_push', function (d) { self.onQuickChatPush(d && d.detail); });
        this.node.on('emoji_push', function (d) { self.onEmojiPush(d && d.detail); });
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

    // 预加载退出后要返回的场景(牌桌大厅=club场景): 房间内提前把场景资源加载好,
    // 点退出时直接切场景, 不会出现"点一下卡住"的加载停顿
    _preloadBackScene: function () {
        try { cc.director.preloadScene("club", function () {}); } catch (e) {}
    },

    // ===== 场景加载/重连恢复 =====
    refreshFromState: function () {
        var nm = cc.vv.gameNetMgr;
        this.updateRoomInfo();
        if (nm.gamestate == "begin" && ((nm.bbMyCards && nm.bbMyCards.length > 0) || nm.bbWatching)) {
            this._started = true;
            this._final = false;
            this._gameType = nm.bbGameType;
            this._applyBbConf(null);   // 重连恢复: 从 nm.conf 读同点比较方式
            this._watching = !!nm.bbWatching;
            this._mySeat = (!this._watching && nm.bbMySeat >= 0) ? nm.bbMySeat : 0;
            this._revealByGs = {};
            if (nm.bbMyDaos && nm.bbMyDaos.length == 3) {
                this._daoSel = this._normDaos(nm.bbMyDaos);
            }
            this._showGameUI();
            this.renderSeats();
            this.renderCards();
            if (this._watching) {
                // 观战重进: 不弹摆牌/确认/结算任何弹窗, 按阶段摆桌面(已亮牌直接摆明牌)
                this.hideArrangeUI();
                this.hideConfirmUI();
                var rvw = nm.bbReveal && nm.bbReveal.players ? nm.bbReveal.players : null;
                if (rvw) {
                    for (var rw = 0; rw < rvw.length; ++rw) { if (rvw[rw].seat != null) this._revealByGs[rvw[rw].seat] = rvw[rw]; }
                    this._revealCounts = [];
                    for (var cw = 0; cw < (this._total || 2); ++cw) this._revealCounts.push(6);
                    this._revealDone = true;
                } else {
                    this._revealCounts = null;
                    this._revealDone = false;
                }
                this.renderCards();
                var selfSeatW = (nm.seats && nm.seatIndex >= 0) ? nm.seats[nm.seatIndex] : null;
                var readyW = !!(selfSeatW && selfSeatW.ready);
                if (this._n.readyBtn) this._n.readyBtn.active = !readyW;
                if (this._n.exitBtn) this._n.exitBtn.active = true;
                this.showTip(readyW ? "本局进行中，结束后自动加入下一局" : "本局进行中，观战中");
            } else if (this._gameType == "baobao_shou" && nm.bbPhase == "arrange" && !nm.bbArranged) {
                // 重进恢复: bbArrangeDeadline 是绝对时间戳, 必须先换算成剩余秒数,
                // 直接当剩余秒传会把整串时间戳显示在倒计时上
                if (nm.bbArrangeDeadline) { this._arrangeRemain = Math.max(0, Math.ceil((nm.bbArrangeDeadline - Date.now()) / 1000)); this._arrangeRemainAt = Date.now(); }
                this.showArrangeUI(this._arrangeRemain);
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

    // ===== 回放(俱乐部「我的战绩/我的乐豆详情」→详情) =====
    // 录像由服务端 replaymgr 录制(bb_start/bb_reveal/game_over 三条推送), 这里只把它们当数据源重放:
    // 六家明牌(上帝视角), 全程不发任何网络包; 控制条用场景里原有的 Canvas/replay 节点
    _enterReplay: function (rp) {
        var self = this;
        var nm = cc.vv.gameNetMgr;
        this._replay = rp;
        this._watching = true;   // 上帝视角: 不区分自己/别人, 六家牌都翻开
        this._mySeat = 0;
        this._started = true;
        this._roundSeq = this._roundSeq || 0;

        var meUid = cc.vv.userMgr && cc.vv.userMgr.userId;
        var ev = rp.events || [];
        var start = null, myStart = null, reveal = null, over = null, overAny = null;
        for (var i = 0; i < ev.length; ++i) {
            var e = ev[i];
            if (!e || !e.d) continue;
            if (e.e == "bb_start_push") {
                if (!start) start = e.d;
                if (!myStart && e.u == meUid) myStart = e.d;
            } else if (e.e == "bb_reveal_push") {
                if (!reveal) reveal = e.d;
            } else if (e.e == "game_over_push") {
                if (!overAny) overAny = e.d;
                if (!over && e.u == meUid) over = e.d;
            }
        }
        var seatsSrc = (start && start.seats) || [];
        var total = Math.max(2, Math.min(6, seatsSrc.length || (rp.players || []).length));
        // 先保存会被改写的房间状态: 退出回放时还原, 不影响之后正常进房
        var KEEP = ["seats", "seatIndex", "bbSeats", "bbMySeat", "bbBankerSeat", "bbBankerMode", "bbGameType",
            "bbMyCards", "bbMyDaos", "bbPhase", "bbArranged", "conf", "roomId", "numOfGames", "maxNumOfGames",
            "overData", "bbOverDetails", "gamestate"];
        this._savedNm = {};
        for (var k = 0; k < KEEP.length; ++k) this._savedNm[KEEP[k]] = nm[KEEP[k]];

        var overData = over || overAny || {};
        var results = overData.results || [];
        var bbSeats = [], seats = [];
        for (i = 0; i < 6; ++i) seats.push(null);
        for (i = 0; i < total; ++i) {
            var s0 = seatsSrc[i] || (rp.players && rp.players[i]) || {};
            var rsIdx = (s0.roomSeatIndex != null) ? s0.roomSeatIndex : i;
            bbSeats.push({
                userid: s0.userid, name: s0.name || "", sex: s0.sex || 0, ip: s0.ip || "",
                seatindex: i, roomSeatIndex: rsIdx, arranged: true
            });
            seats[rsIdx] = { userid: s0.userid, name: s0.name || "", ip: s0.ip || "", score: 0, ready: true };
        }
        // 座位分用结算里的总分回填, 回放牌桌看到的就是本局结束时的总分
        for (i = 0; i < results.length; ++i) {
            var rr = results[i];
            if (!rr) continue;
            var rIdx = (rr.roomSeatIndex != null) ? rr.roomSeatIndex : i;
            if (seats[rIdx] && rr.totalscore != null) seats[rIdx].score = rr.totalscore;
        }

        nm.seats = seats;
        nm.seatIndex = 0;
        nm.bbSeats = bbSeats;
        // 结算文字里的「我对某家」用真实座位号(录像里就是自己那一份的 mySeat);
        // 组件自己的 _mySeat 保持 0: 上帝视角下 gs 直接等于 off, 不参与座位换算
        nm.bbMySeat = (myStart && myStart.mySeat != null) ? myStart.mySeat : 0;
        nm.bbBankerSeat = (start && start.bankerSeat != null) ? start.bankerSeat : -1;
        nm.bbBankerMode = !!(start && start.bankerMode);
        nm.bbGameType = (start && start.gameType) || rp.type;
        nm.bbMyCards = (myStart && myStart.myCards) || [];
        nm.bbMyDaos = null;
        nm.bbPhase = null;
        nm.bbArranged = true;
        nm.conf = (start && start.conf) || {};
        if (!nm.conf.type) nm.conf.type = rp.type;
        nm.roomId = rp.roomid || 0;
        nm.numOfGames = rp.index || 1;
        nm.maxNumOfGames = nm.conf.maxGames || 0;
        nm.overData = overData;
        nm.bbOverDetails = overData.details || null;
        nm.gamestate = "begin";
        this._gameType = nm.bbGameType;
        this._total = total;

        this._showGameUI();
        if (this._n.ruleWin) this._n.ruleWin.active = false;
        // 设置面板里的「退出房间」在回放时直接回俱乐部(不能真发离房请求)
        cc.vv.bbExitHook = function () { self._exitReplay(); };
        this._revealByGs = {};
        this._revealCounts = null;
        this.renderSeats();
        this.renderCards();
        this.updateRoomInfo();
        this.showTip("回放 · 第" + nm.numOfGames + "局");
        this._showReplayBar();

        // 开播: 亮牌动画复用正式对局的处理(数据全部来自录像), 亮完自动弹本局结算
        // 结算先放 _lastOver: 亮牌流程结束时会取它弹窗, 不会走"1秒兜底"提前弹
        if (overData.results) { this._lastOver = overData; this._lastOverSeq = this._roundSeq; }
        this.scheduleOnce(function () {
            if (!cc.isValid(self.node)) return;
            if (reveal) self.onBbReveal(reveal);
            else if (overData.results) self.applyGameOver(overData, null);
            else self.showTip("该局录像不完整");
        }, 1.2);
    },

    // 回放控制条: 场景节点 Canvas/replay(默认隐藏), 暂停/继续 + 返回俱乐部
    _showReplayBar: function () {
        var bar = this._replayBar = this._replayBar || this.findNode(this.node, "replay");
        if (!bar) { console.log("[BB] 场景缺少 replay 控制条节点"); return; }
        bar.active = true;
        var names = [["btn_pause", this._pauseReplay], ["btn_play", this._resumeReplay], ["btn_back", this._exitReplay]];
        for (var i = 0; i < names.length; ++i) {
            var b = this.findNode(bar, names[i][0]);
            if (!b) continue;
            var btn = b.getComponent(cc.Button);
            if (btn) btn.clickEvents = [];   // 清掉场景里指向麻将脚本的点击事件
            this.bindButton(b, names[i][1], this);
        }
        this._setReplayPaused(false);
    },
    _setReplayPaused: function (paused) {
        this._replayPaused = !!paused;
        if (!this._replayBar) return;
        var bp = this.findNode(this._replayBar, "btn_pause");
        var bl = this.findNode(this._replayBar, "btn_play");
        if (bp) bp.active = !paused;
        if (bl) bl.active = paused;
    },
    // 暂停: 只停本组件的定时器(亮牌时间轴), 继续时从原进度接着播
    _pauseReplay: function () {
        if (!this._replay || this._replayPaused) return;
        this._setReplayPaused(true);
        cc.director.getScheduler().pauseTarget(this);
        if (cc.audioEngine) cc.audioEngine.pauseAll();
    },
    _resumeReplay: function () {
        if (!this._replay || !this._replayPaused) return;
        this._setReplayPaused(false);
        cc.director.getScheduler().resumeTarget(this);
        if (cc.audioEngine) cc.audioEngine.resumeAll();
    },
    // 退出回放: 回俱乐部场景(会重新拉俱乐部信息, 再点详情可继续看别的局)
    _exitReplay: function () {
        if (this._leaving) return;
        this._leaving = true;
        cc.director.getScheduler().resumeTarget(this);
        if (cc.audioEngine) cc.audioEngine.resumeAll();
        if (cc.vv) cc.vv.bbReplayData = null;
        cc.director.loadScene("club");
    },

    _clearChatBubbles: function () {
        for (var i = 0; i < this._chatBubbles.length; ++i) {
            if (cc.isValid(this._chatBubbles[i])) this._chatBubbles[i].destroy();
        }
        this._chatBubbles = [];
    },

    showPrepareUI: function () {
        this._started = false;
        this._arranging = false;
        this._revealByGs = {};
        this._clearMianTypeLabels();
        this.hideArrangeUI();
        this.hideConfirmUI();
        if (this._n.bbMidCd) this._setMidCd(false);
        if (this._n.ruleWin) this._n.ruleWin.active = false;
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
            if (sn.rowCards) sn.rowCards.active = false;
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
        if (data.confirmedCount != null) this._confirmCount = data.confirmedCount;
        if (nm.bbConfirmed) {
            this.hideConfirmUI();
            this.showTip("已确定 (" + (data.confirmedCount != null ? data.confirmedCount : this._confirmCount) + "/" + (data.total || this._total) + ")，等待其他玩家…");
        }
    },

    showConfirmUI: function () {
        this._buildConfirmUI();
        var root = this._confirmRoot;
        if (!root) { console.error("[BB] 场景内找不到 bbConfirm 节点"); return; }
        // 父链全部激活, 避免弹窗挂在未激活的父节点下导致不显示
        var p = root.parent;
        while (p && p.parent) { if (!p.active) p.active = true; p = p.parent; }
        root.active = true;
        var par = root.parent;
        if (par) root.setSiblingIndex(par.children.length - 1);
        // 逆向 Pk.Lb.Out: 免摆只留「免摆出牌」按钮, 无标题/提示/倒计时
        this._stopCountdown();
        if (this._confirmAutoBtn) {
            this._confirmAutoBtn.active = true;
            this._confirmAutoBtn.opacity = 255;
            this._setBtnText(this._confirmAutoBtn, "免摆出牌");
            this.bindButton(this._confirmAutoBtn, this.onConfirmTap, this);
        }
        this._renderConfirmPreview();
        this._confirmCount = 0;
    },

    // 手摆房里的免摆: 与原版一致, 收起摆牌区只留「免摆出牌」按钮, 点了按最优三道提交
    showMianFreeUI: function () {
        this._buildConfirmUI();
        var root = this._confirmRoot;
        if (!root) { console.error("[BB] 场景内找不到 bbConfirm 节点"); return; }
        var p = root.parent;
        while (p && p.parent) { if (!p.active) p.active = true; p = p.parent; }
        root.active = true;
        var par = root.parent;
        if (par) root.setSiblingIndex(par.children.length - 1);
        // 逆向 Pk.Lb.Out: 免摆玩家只给一个「免摆出牌」按钮, 点了按最优三道直接提交
        this._stopCountdown();
        if (this._confirmAutoBtn) {
            this._confirmAutoBtn.active = true;
            this._confirmAutoBtn.opacity = 255;
            this._setBtnText(this._confirmAutoBtn, "免摆出牌");
            this.bindButton(this._confirmAutoBtn, this.onConfirmMianFree, this);
        }
        this._renderConfirmPreview();
        this._confirmCount = 0;
    },

    // 手摆免摆确认: 按本地最优摆法提交 bb_arrange, 关弹窗, 倒计时挪中间等待亮牌
    onConfirmMianFree: function () {
        var nm = cc.vv.gameNetMgr;
        if (!this._confirmRoot || !this._confirmRoot.active) return;
        if (nm.bbMianConfirmed) return;
        var arr = this._mianDaos() || this.autoArrangeLocal((nm.bbMyCards || []).slice());
        if (!arr) { this.showTip("牌数据异常，请重进"); return; }
        nm.bbMianConfirmed = true;
        cc.vv.net.send("bb_arrange", { front: arr[0].slice(), mid: arr[1].slice(), back: arr[2].slice() });
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("sort.wav");
        this.hideConfirmUI();
        this._stopCountdown();
        if (this._n.bbMidCd) {
            this._setMidCd(true);
            this._startCountdown(this._leftOf(this._arrangeRemain, this._arrangeRemainAt), this._n.bbMidCd, null);
        }
        this.showTip("已确定，等待其他玩家…");
    },

    hideConfirmUI: function () {
        if (this._confirmRoot) this._confirmRoot.active = false;
        this._stopCountdown();
    },

    onConfirmTap: function () {
        var nm = cc.vv.gameNetMgr;
        if (!this._confirmRoot || !this._confirmRoot.active) return;
        if (nm.bbConfirmed) return;
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

    // 牌桌正中间的倒计时(bbMidCd): 场景里它可能挂在底图 djsSprite 下面,
    // 只开 bbMidCd 时若底图默认隐藏, 数字会被父节点一起藏掉, 所以父节点是 djsSprite 时一并显隐
    _setMidCd: function (on) {
        var n = this._n.bbMidCd;
        if (!n || !cc.isValid(n)) return;
        n.active = !!on;
        var p = n.parent;
        if (p && p !== this._n.game && p.name === "djsSprite") p.active = !!on;
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
        // 回放退出/场景切换: 还原被回放临时改写的房间状态, 之后正常进房不受影响
        if (this._savedNm && cc.vv && cc.vv.gameNetMgr) {
            for (var k in this._savedNm) cc.vv.gameNetMgr[k] = this._savedNm[k];
            this._savedNm = null;
        }
        if (this._replay && cc.vv) cc.vv.bbReplayData = null;   // 回放数据只在本次回放有效
    },

    // ===== 座位渲染 =====
    _layoutOf: function (total) {
        total = Math.max(2, Math.min(6, total));
        return this.seatLayout(total);
    },

    _seatInfoOfOffsetInGame: function (offset, total) {
        var nm = cc.vv.gameNetMgr;
        var gs = this._watching ? offset : (this._mySeat + offset) % total;   // 观战: 没有"自己", 座位按游戏座位号直排
        var bs = nm.bbSeats ? nm.bbSeats[gs] : null;
        var rs = bs && nm.seats ? nm.seats[bs.roomSeatIndex] : null;
        return {
            gs: gs,
            userid: bs ? bs.userid : null,
            name: bs ? (bs.name || "") : "",
            ip: (rs && rs.ip) || (bs && bs.ip) || "",
            sex: (bs && bs.sex) || 0,
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
            // 准备阶段(图四): 按房间全部座位排环, 空座位显示灰色人影占位
            var seats = nm.seats || [];
            var len = seats.length;
            var myIdx = nm.seatIndex >= 0 ? nm.seatIndex : 0;
            total = Math.max(2, Math.min(6, len));
            this._total = total;
            for (var i = 0; i < len; ++i) {
                var rel = (i - myIdx + len) % len;
                if (rel >= total) continue;
                var s = seats[i];
                if (s && s.userid) {
                    infos.push({
                        offset: rel,
                        info: {
                            gs: i,
                            userid: s.userid,
                            name: s.name || "",
                            ip: s.ip || "",
                            sex: s.sex || 0,
                            score: s.score != null ? s.score : 0,
                            isBanker: false,
                            ready: !!s.ready
                        }
                    });
                } else {
                    // 空位占位(灰色人影)
                    infos.push({ offset: rel, info: { gs: i, userid: null, name: "", score: null, isBanker: false, ready: false, empty: true } });
                }
            }
        }
        // 先全部隐藏 + 清头像(防止上一局/上一阶段的玩家头像残留), 人影底板恢复白色
        for (var i2 = 0; i2 < 6; ++i2) {
            var sn0 = this._seatNodes[i2];
            if (!sn0) continue;
            sn0.root.active = false;
            sn0._uid = 0;   // 清掉上一次渲染的玩家id, 否则按uid找座位会命中隐藏的旧槽位
            sn0._uname = "";
            if (sn0.okSprite) sn0.okSprite.active = false;   // 默认隐藏, 只有点了准备才亮
            if (sn0.swSprite) sn0.swSprite.active = false;   // 未占位不显示
            if (sn0.userSprite) sn0.userSprite.color = cc.Color.WHITE;
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
            // 记录本槽位的玩家信息, 供点头像弹 userinfo 使用
            sn._uid = infos[j].info.userid || 0;
            sn._uname = infos[j].info.name || "";
            sn._ip = infos[j].info.ip || "";
            sn._sex = infos[j].info.sex || 0;
            if (infos[j].info.empty) {
                // 空座位: 灰色人影占位, 不显示名字/分数/准备标记
                this.setStr(sn.nameLabel, "");
                this.setStr(sn.scoreLabel, "");
                if (sn.zhuang) sn.zhuang.active = false;
                if (sn.readyMark) sn.readyMark.active = false;
                if (sn.okSprite) sn.okSprite.active = false;
                if (sn.icon) sn.icon.active = false;
                if (sn.swSprite) sn.swSprite.active = false;   // 空位: 与头像一样隐藏
                if (sn.userSprite) { sn.userSprite.active = true; sn.userSprite.color = cc.Color.WHITE; }
                continue;
            }
            if (sn.icon) sn.icon.active = true;
            if (sn.swSprite) sn.swSprite.active = true;   // 有玩家: 与头像/昵称同时段显示
            if (sn.userSprite) sn.userSprite.color = cc.Color.WHITE;
            this.setStr(sn.nameLabel, infos[j].info.name || "");
            this.setStr(sn.scoreLabel, infos[j].info.score != null ? ("" + infos[j].info.score) : "");
            //玩家座位不再显示庄家标识,庄家数据仍用于结算和亮牌顺序
            if (sn.zhuang) sn.zhuang.active = false;
            if (sn.readyMark) sn.readyMark.active = !!infos[j].info.ready;
            // 坐下标记: 点「准备」后才显示, 开局后隐藏
            if (sn.okSprite) sn.okSprite.active = !this._started && !!infos[j].info.ready;
            // 头像加载: icon 节点已在场景 fire 里挂了 ImageLoader, 这里只调 setUserID
            if (sn.icon) {
                var iconLoader = sn.icon.getComponent("ImageLoader");
                if (!iconLoader) { try { iconLoader = sn.icon.addComponent("ImageLoader"); } catch (e) {} }
                if (iconLoader && infos[j].info.userid) {
                    iconLoader.setUserID(infos[j].info.userid);
                }
            }
        }

        // 开局后没有玩家的座位不隐藏: 保留默认空位(人影底板 + 空名字), 其余玩法元素一律收起
        if (inGame) {
            for (var k2 = 0; k2 < 6; ++k2) {
                var snE = this._seatNodes[k2];
                if (!snE || !snE.root || Number(snE._uid) > 0) continue;
                snE.root.active = true;
                if (snE.icon) snE.icon.active = false;
                if (snE.userSprite) { snE.userSprite.active = true; snE.userSprite.color = cc.Color.WHITE; }
                this.setStr(snE.nameLabel, "");
                this.setStr(snE.scoreLabel, "");
                if (snE.zhuang) snE.zhuang.active = false;
                if (snE.readyMark) snE.readyMark.active = false;
                if (snE.okSprite) snE.okSprite.active = false;
                if (snE.swSprite) snE.swSprite.active = false;   // 开局后空位同样隐藏
                if (snE.cardsNode) snE.cardsNode.active = false;
                if (snE.rowCards) snE.rowCards.active = false;
                if (snE.summary) snE.summary.active = false;
                if (snE.bubble) snE.bubble.active = false;
                if (snE.mianType) snE.mianType.active = false;
                var slotsE = snE.slots || [], rsE = snE.rowSlots || [], dlE = snE.daoLabels || [];
                for (var q1 = 0; q1 < slotsE.length; ++q1) { if (slotsE[q1]) slotsE[q1].active = false; }
                for (var q2 = 0; q2 < rsE.length; ++q2) { if (rsE[q2]) rsE[q2].active = false; }
                for (var q3 = 0; q3 < dlE.length; ++q3) { if (dlE[q3]) dlE[q3].active = false; }
                var bem = this.findNode(snE.root, "bbBubbleEmoji");
                if (bem) bem.active = false;
            }
        }
    },

    updateRoomInfo: function () {
        var nm = cc.vv.gameNetMgr;
        var conf = nm.conf || {};
        // 玩法名(记号): type → 中文
        var wanfaName = "血战宝宝";
        if (conf.type === "baobao_mian") wanfaName = "免摆宝宝";
        else if (conf.type === "baobao_shou") wanfaName = "血战宝宝";
        else if (conf.type) wanfaName = conf.type;
        // 底分: conf.baseScore (gamemgr 结算用的倍率基础)
        var baseScore = conf.baseScore != null ? conf.baseScore : (conf.base != null ? conf.base : 1);
        // 局数: conf.maxGames
        var maxGames = conf.maxGames != null ? conf.maxGames : (conf.jushuxuanze != null ? conf.jushuxuanze : "-");
        // 入场豆: 牌桌配置的 min_bean (进房最低宝宝豆门槛)
        var minBean = Number(conf.min_bean) || 0;
        // 离场豆: 牌桌配置的 kick_bean (结算后低于该值请出房间)
        var kickBean = Number(conf.kick_bean) || 0;
        var txt = "记号:" + wanfaName + "  底分:" + baseScore + "  局数:" + maxGames;
        txt += "  入场:" + minBean + "  离场:" + kickBean;
        // 进度: 已打第几局/总局
        if (nm.maxNumOfGames > 0) txt += "  第" + nm.numOfGames + "/" + nm.maxNumOfGames + "局";
        this.setStr(this._n.titleLabel, txt);
        // 左上角水印: 显示本房间的牌桌名称(俱乐部牌桌用玩家录入的名称, 普通房间沿用"宝宝")
        var wmName = conf.club_table_name || conf.table_name || conf.name || "宝宝";
        if (this._n.bbWatermark) {
            var wmLb = this._n.bbWatermark.getComponent(cc.Label);
            if (wmLb) {
                wmLb.string = wmName;
                wmLb.enableWrapText = false;                     // 牌桌名可能较长, 不换行
                wmLb.overflow = cc.Label.Overflow.NONE;          // 超出也不裁剪, 保持水印完整
            }
        }
    },

    // 右上角设置按钮: 打开场景内popups/settings面板(音效/音乐开关由setting组件处理,btn_close自行关闭)
    onBtnSettingsClicked: function () {
        var settings = this._settingsRoot || cc.find("Canvas/popups/settings") || this.findNode(this.node, "settings");
        if (settings) settings.active = true;
    },

    // 设置面板「桌面背景」: 打开背景选择弹窗
    onDeskBgClick: function () {
        var ds = (cc.vv && cc.vv.deskStyle) || this.getComponent("DeskStyle");
        if (!ds) {
            //DeskStyle 没挂上时兜底补挂一次(挂到本脚本所在节点, 与 onLoad 一致)
            try { ds = this.getComponent("DeskStyle") || this.addComponent("DeskStyle"); } catch (e) { ds = null; }
        }
        if (ds && ds.openBgChoose) { ds.openBgChoose(); }
        else { console.warn("[BB] 打开背景选择失败: DeskStyle 不可用"); }
    },

    // ===== 牌面渲染 =====
    // 免摆明牌按牌型排列: 同点牌成组(三条/对子在前), 其余按点数降序(顺子自然连续)
    // 3组9(level 490) 按三个9点分组(与服务端 mianOrder 一致): 7+2 / 6+3 / 6+3, 组间按组内最大点数降序
    _mianOrder: function (cards, level) {
        var self = this;
        if (level == 490 && cards && cards.length == 6) {
            var idx9 = [0, 1, 2, 3, 4, 5], pairs9 = [];
            for (var a9 = 0; a9 < 6; ++a9) for (var b9 = a9 + 1; b9 < 6; ++b9) pairs9.push([a9, b9]);
            var v9 = cards.map(function (c) { return self.dianVal(self.rankOf(c)); });
            for (var i9 = 0; i9 < pairs9.length; ++i9) {
                var p19 = pairs9[i9];
                var rest9 = idx9.filter(function (x) { return x != p19[0] && x != p19[1]; });
                for (var j9 = 0; j9 < rest9.length; ++j9) {
                    for (var k9 = j9 + 1; k9 < rest9.length; ++k9) {
                        var p29 = [rest9[j9], rest9[k9]];
                        var p39 = rest9.filter(function (x) { return x != p29[0] && x != p29[1]; });
                        if (v9[p19[0]] + v9[p19[1]] == 9 && v9[p29[0]] + v9[p29[1]] == 9 && v9[p39[0]] + v9[p39[1]] == 9) {
                            var gs9 = [
                                [cards[p19[0]], cards[p19[1]]],
                                [cards[p29[0]], cards[p29[1]]],
                                [cards[p39[0]], cards[p39[1]]]
                            ];
                            gs9.sort(function (g1, g2) {
                                var m1 = Math.max(self.rankOf(g1[0]), self.rankOf(g1[1]));
                                var m2 = Math.max(self.rankOf(g2[0]), self.rankOf(g2[1]));
                                if (m1 != m2) return m2 - m1;
                                return self.suitOf(g1[0]) - self.suitOf(g2[0]);
                            });
                            var out9 = [];
                            gs9.forEach(function (g) {
                                g.sort(function (x, y) { return self.rankOf(y) - self.rankOf(x) || self.suitOf(x) - self.suitOf(y); });
                                out9 = out9.concat(g);
                            });
                            return out9;
                        }
                    }
                }
            }
        }
        var cnt = {};
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
            if (sn.rowCards) sn.rowCards.active = false;
            for (var d = 0; d < 3; ++d) this.setStr(sn.daoLabels[d], "");
            this.setStr(sn.summary, "");
        }
        if (!this._started) { this._renderArrange(); return; }

        for (var off = 0; off < total; ++off) {
            var seatIdx = this._layoutOf(total)[off];
            var seat = this._seatNodes[seatIdx];
            if (!seat || !seat.root.active) continue;
            var gs = this._watching ? off : (this._mySeat + off) % total;
            // 牌区被收起(还没确认出牌/摆牌弹窗开着)时不能重绘, 否则会把别人的牌背也摆回桌面
            if (seat.cardsNode && !seat.cardsNode.active) continue;
            // 亮牌: 按轮次进行, _revealCounts[off] = 该家已亮出的张数(其余仍是牌背)
            var shown = this._revealCounts ? (this._revealCounts[off] || 0) : 0;
            var p = shown > 0 ? (this._revealByGs[gs] || null) : null;
            var isMe = !this._watching && off == 0;
            var faces = [];
            var backs = false;
            var labels = ["", "", ""];
            var summary = "";

            if (p) {
                if (p.mianFree && p.cards && p.cards.length == 6) {
                    // 手摆场景里的免摆玩家: 按牌型结构亮牌(3组9 → 前/中/后各一组9点), 不用系统最优三道
                    for (var md = 0; md < 3; ++md) {
                        var mdc = [p.cards[md * 2], p.cards[md * 2 + 1]];
                        faces = faces.concat(mdc);
                        labels[md] = this.daoDescText(mdc[0], mdc[1]);
                    }
                    summary = p.typeName || "";
                } else if (p.daos) {
                    for (var i = 0; i < p.daos.length; ++i) {
                        faces = faces.concat(p.daos[i].cards || []);
                        labels[i] = p.daos[i].desc;
                    }
                    // 免摆玩家(系统自动摆三道): 只显示整手牌型名, 不显示乌龙/自动摆牌提示
                    if (p.mianFree) summary = p.typeName || "";
                    else if (p.wulong) summary = "乌龙(三道全输)";
                } else if (p.groups) {
                    for (var g = 0; g < p.groups.length; ++g) {
                        faces = faces.concat(p.groups[g] || []);
                    }
                    // 免摆亮牌后只显示牌型(二张点数只用于手摆的三道)
                    summary = p.typeName || "";
                }
                // 逐道显示: 该道两张亮出后就显示该道牌型/点数; 牌型总名(含乌龙)仍等六张全亮
                for (var ld = 0; ld < 3; ++ld) { if (shown < (ld + 1) * 2) labels[ld] = ""; }
                if (shown < 6) summary = "";
            } else {
                // 未亮牌前一律显示牌背(自己的位置也从牌背开始, 手摆看的是下面摆牌区的牌)
                backs = true;
            }

            // 免摆牌型: 六张牌在场景里预留的一排牌位上一起展示(手摆里的免摆玩家 / 纯免摆局), 不再三排两列
            var rowMode = !!(p && shown >= 6 && (p.mianFree || (p.groups && !p.daos)));
            // 免摆牌型未亮牌前也用"一排六张牌背": 不显示成三道(两列三排)的摆法,
            // 亮牌开始时才整排一次性翻开(免摆是整手比大小, 没有三道结构)
            var gsSeat = nm.bbSeats ? nm.bbSeats[gs] : null;
            var isMianSeat = (this._gameType == "baobao_mian") || !!(gsSeat && gsSeat.mianFree);
            var backRow = !!(isMianSeat && !p);
            if (rowMode) { labels = ["", "", ""]; summary = ""; }   // 一排展示时不再显示三道点数文字和 bbSummary(牌型名由 bbMb 横幅显示)
            this._setMianRow(seat, rowMode || backRow, rowMode ? faces : null, backRow);
            // 一排亮牌和牌型横幅(bbMb 里的 bbMianType)始终同步: 重连恢复亮牌状态时也要补上
            if (rowMode && p && p.typeName && p.typeKey > 0) this._showMianTypeAtSeat(seatIdx, p.typeName);
            for (var s = 0; s < 6; ++s) {
                var cardNode = seat.slots[s];
                if (!cardNode) continue;
                if (rowMode || backRow) { cardNode.active = false; continue; }
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

    // 免摆整手展示: 场景里每个座位预留了一排六个牌位(bbRowCards/bbRowCard0~5)
    // 六张牌直接横向排开, 不再按三道两列叠放
    // asBack: 未亮牌时也占用这一排, 但六张全部显示牌背(免摆整手比大小, 不能摆成三道)
    _setMianRow: function (seat, on, faces, asBack) {
        if (!seat || !seat.rowCards) return;   // 场景没配就保持原三排布局
        seat.rowCards.active = !!on;
        if (!on) return;
        for (var k = 0; k < 6; ++k) {
            var c = seat.rowSlots[k];
            if (!c) continue;
            if (asBack) {
                c.active = true;
                c.color = cc.Color.WHITE;
                var bsp = c.getComponent(cc.Sprite);
                if (bsp) bsp.spriteFrame = this._cardBack || null;
                continue;
            }
            var face = faces ? faces[k] : null;
            if (face == null) { c.active = false; continue; }
            c.active = true;
            c.color = cc.Color.WHITE;
            var sp = c.getComponent(cc.Sprite);
            if (sp) sp.spriteFrame = this.frameOf(face) || this._cardBack || null;
        }
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
        // ===== 先强制隐藏上一局残留的结算/摆牌弹窗 + 清服务端缓存 =====
        if (this._n.resultPanel) this._n.resultPanel.active = false;
        if (this._n.finalPanel) this._n.finalPanel.active = false;
        if (this.hideConfirmUI) { try { this.hideConfirmUI(); } catch (e) {} }
        if (this.hideArrangeUI) { try { this.hideArrangeUI(); } catch (e) {} }
        this._stopCountdown();
        nm.overData = null;
        nm.bbOverDetails = null;
        nm.bbPhase = null;
        nm.bbMyMian = null;
        nm.bbArranged = false;
        this._endDetail = null;
        this._lastResults = null;
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
        this._watching = !!(data && (data.watching || data.mySeat < 0));   // 本局未参与: 观战模式, 只看桌面不弹窗
        this._final = false;
        this._roomEnd = false;
        this._settle1Done = true;
        this._summaryShown = false;
        this._endDetail = null;
        this._arranging = false;
        this._inArrangePhase = false;
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
        this._daqiangList = [];
        this._quanleidaList = [];
        this._gameType = data ? data.gameType : nm.bbGameType;
        this._applyBbConf(data);   // 后台同点比较方式 tongdian_mode
        nm.bbMianFree = !!(data && data.mianFree);   // 手摆场景: 本局我是否免摆(非散牌)
        // 上面已把 bbMyMian 清空, 这里必须先从本局推送补回来, 否则下面的重排永远不生效
        if (data && data.myMian) nm.bbMyMian = data.myMian;
        // 免摆牌型: 手牌自身也按免摆牌型结构排, 保证摆牌弹窗的上下两排与拖动时的下标一致
        // 其它牌型也必须排序(成组的牌挨在一起, 再按点数降序), 不能直接按发牌顺序展示
        var selfHand = this;
        var myHand = (nm.bbMyCards || []).slice();
        if (nm.bbMianFree && nm.bbMyMian && nm.bbMyMian.cards && nm.bbMyMian.cards.length == myHand.length) {
            myHand = nm.bbMyMian.cards.slice();
        } else if (myHand.length > 1) {
            var handCnt = {};
            for (var hci = 0; hci < myHand.length; ++hci) {
                var hcr = selfHand.rankOf(myHand[hci]);
                handCnt[hcr] = (handCnt[hcr] || 0) + 1;
            }
            var handTmp = [];
            for (var hti = 0; hti < myHand.length; ++hti) {
                var hidT = myHand[hti];
                var hrt = selfHand.rankOf(hidT);
                handTmp.push({ id: hidT, r: hrt, s: selfHand.suitOf(hidT), n: handCnt[hrt] || 1 });
            }
            handTmp.sort(function (a, b) {
                if (a.n != b.n) return b.n - a.n;   // 成组(对子/三条)的排前面
                if (a.r != b.r) return b.r - a.r;   // 再按点数从大到小
                return a.s - b.s;                   // 同点数按花色
            });
            myHand = handTmp.map(function (x) { return x.id; });
        }
        nm.bbMyCards = myHand;
        nm.bbMianConfirmed = false;   // 免摆确认按钮: 每局重置
        this._mySeat = (data && data.mySeat != null) ? data.mySeat : (nm.bbMySeat >= 0 ? nm.bbMySeat : 0);
        // 重连补发(bb_resend_push)会带已摆好的三道
        if (data && data.myDaos && data.myDaos.length == 3) {
            this._daoSel = this._normDaos(data.myDaos);
        }
        try { this._showGameUI(); this.updateRoomInfo(); this.renderSeats(); } catch (e) { console.error("[BB] 开局UI异常", e); }
        // 观战(本局未参与): 不播发牌/洗牌动画, 不弹摆牌/确认/结算任何弹窗, 只按当前阶段摆桌面
        if (this._watching) {
            this.hideConfirmUI();
            this.hideArrangeUI();
            this._stopCountdown();
            this._dealing = false;
            this._animBusy = false;
            var rvw = data && data.reveal && data.reveal.players ? data.reveal.players : null;
            if (rvw) {
                this._revealByGs = {};
                for (var rw = 0; rw < rvw.length; ++rw) { if (rvw[rw].seat != null) this._revealByGs[rvw[rw].seat] = rvw[rw]; }
                this._revealCounts = [];
                for (var cw = 0; cw < (this._total || 2); ++cw) this._revealCounts.push(6);
                this._revealDone = true;
            } else {
                this._revealByGs = {};
                this._revealCounts = null;   // 未亮牌: 全桌牌背
                this._revealDone = false;
            }
            this.renderCards();
            // 观战也要能退出房间/点开始加入下一局: 把准备态按钮放出来(_showGameUI 刚把它们藏了)
            var nmW = cc.vv.gameNetMgr;
            var selfSeatW = (nmW.seats && nmW.seatIndex >= 0) ? nmW.seats[nmW.seatIndex] : null;
            var readyW = !!(selfSeatW && selfSeatW.ready);
            if (this._n.readyBtn) this._n.readyBtn.active = !readyW;
            if (this._n.exitBtn) this._n.exitBtn.active = true;
            this.showTip(readyW ? "本局进行中，结束后自动加入下一局" : "本局进行中，观战中");
            return;
        }
        var self = this;
        // 重连补发: 不重播洗牌/发牌动画, 直接按服务端阶段恢复
        if (data && data.resend) {
            this._dealing = false;
            try { this.renderCards(); this._showPhaseUI(data, nm); } catch (e) { console.error("[BB] 补发恢复异常", e); }
            return;
        }
        function startDeal() {
            console.log("[BB][时序] 开始发牌 距收到开局 " + (Date.now() - self._pushAt) + "ms");
            // 开局特效(项10): 每局发牌时播 startAnimat 帧动画 + start_game 音; 有庄模式随后播定庄音
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("start_game.mp3");
            try { self._fxStartAnim(); } catch (e2) { console.log("[BB] 开局动画异常", e2 && e2.message); }
            if ((data && data.bankerMode) && data.bankerSeat != null && data.bankerSeat >= 0) {
                self.scheduleOnce(function () {
                    if (cc.isValid(self.node) && cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("dingzhuang.mp3");
                }, 0.8);
            }
            try {
                self._dealSeq(function () {
                    if (!self._started) return;
                    // 开局动画播完(帧数*50ms)才允许弹摆牌弹窗, 弹窗不能压在开始动画上
                    var animMs = (self._startFrames && self._startFrames.length ? self._startFrames.length * 50 : 0) + 150;
                    console.log("[BB] 开局动画gate " + animMs + "ms 后弹阶段弹窗");
                    self.scheduleOnce(function () {
                        self._animBusy = false;   // 洗牌+发牌+开局动画全部结束, 解除阶段推送屏蔽
                        if (!self._started || !cc.isValid(self.node)) return;
                        try { self._showPhaseUI(data, nm); } catch (e) { console.error("[BB] 阶段UI异常", e); }
                    }, animMs / 1000);
                    self._startArrangeWatchdog();   // 兜底: 任何一环失败导致弹窗6秒未出, 强开
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
        // 本机记录的摆牌阶段标志: 服务端 bb_start_push 只给 phase="deal",
        // 摆牌阶段是后续 bb_arrange_start_push 推的(不带 phase), 所以不能用 nm.bbPhase 判断
        this._inArrangePhase = false;
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
            this._inArrangePhase = true;
            this.hideConfirmUI();
            // 免摆只是牌型标记: 摆牌流程与手摆完全一致(弹窗预填最优三道, 可自由调整)
            // 这里必须同步 bbMianFree: 只赋值 bbMyMian 时, showArrangeUI 仍判定非免摆而弹出摆牌区
            if (data.mianFree != null) nm.bbMianFree = !!data.mianFree;
            if (data.mianFree && data.myMian) nm.bbMyMian = data.myMian;
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
        this._inArrangePhase = true;   // 进入摆牌阶段(bb_start 的 phase 只到 deal, 摆牌阶段靠这条推送切)
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
        this._startArrangeWatchdog();   // 兜底: 弹窗6秒未出则强开
    },

    // 摆牌弹窗看门狗: 弹窗链路(开局动画gate/阶段推送)任何一环静默失败都会表现为"卡死",
    // 这里6秒后巡检一次, 只要还在摆牌阶段且弹窗没出来就直接强开, 宁可不等动画也不能卡死
    _startArrangeWatchdog: function () {
        var self = this;
        this.scheduleOnce(function () {
            if (!cc.isValid(self.node) || !self._started) return;
            var nm = cc.vv.gameNetMgr;
            if (!nm || nm.bbArranged) return;
            if (self._gameType != "baobao_shou") return;
            if (self._arranging && self._arrangeRoot && self._arrangeRoot.active) return;   // 弹窗已出, 正常
            console.warn("[BB] 摆牌弹窗超时未出现, 看门狗强开");
            self._animBusy = false;
            self.showArrangeUI(self._arrangeRemain);
        }, 6);
    },

    onArrangeOk: function (data) {
        var nm = cc.vv.gameNetMgr;
        if (data && data.seatIndex != null && nm.bbSeats && nm.bbSeats[data.seatIndex]) {
            nm.bbSeats[data.seatIndex].arranged = true;
            if (data.seatIndex == nm.bbMySeat) nm.bbArranged = true;
            // 该玩家已确认出牌: 只恢复他那一家的牌, 其余玩家仍未摆好, 继续空桌
            var uid = nm.bbSeats[data.seatIndex].userid;
            var slot = this._slotIdxOfUser(uid);
            if (slot >= 0 && this._seatNodes[slot] && this._seatNodes[slot].cardsNode) {
                this._seatNodes[slot].cardsNode.active = true;
            }
        }
        this.renderSeats();
        // 单卡在上一次隐藏时也被关掉了, 需要重绘一遍把该家牌位重新激活(其余家容器仍关闭)
        this.renderCards();
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

    // 发牌: 无动画, 牌直接落位(原逐张飞牌动画已按需求移除)
    _dealSeq: function (onDone) {
        this._stopDeal();
        this._dealing = false;
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("deal.wav");
        this._resetSlotPos();
        this.renderCards();
        if (onDone) { try { onDone(); } catch (e) { console.error("[BB] 发牌完成回调异常", e); } }
    },
    _stopDeal: function () {
        if (this._dealTimer) { clearTimeout(this._dealTimer); this._dealTimer = null; }
        if (this._dealGuard) { clearTimeout(this._dealGuard); this._dealGuard = null; }
        this._dealing = false;
    },

    // ===== 亮牌(图六): 每家轮流整手亮出(从自己开始, 每家间隔1.5秒), 亮牌时播翻牌音+报牌语音;
    //       全部亮完后播打枪/全垒打特效与语音, 再进结算 =====
    onBbReveal: function (data) {
        if (!data || !data.players) return;
        // 本局未参与(刚进房/排队等下一局): 不观看本局亮牌, 不弹牌型/结算, 等下一局开局
        if (!this._started) return;
        // 结算弹窗已弹出: 亮牌阶段早已结束, 重复到达的亮牌推送不能再切回牌局界面(否则结算弹窗会被提前关掉)
        if (this._n.resultPanel && this._n.resultPanel.active) return;
        var nm = cc.vv.gameNetMgr;
        // 观战判定: 我本局不在游戏座位里(牌局进行中进房) → 只观看亮牌过程, 不弹牌型/结算弹窗
        var myUid = cc.vv && cc.vv.userMgr && cc.vv.userMgr.userId;
        var sl = data.seats || nm.bbSeats || [];
        var inG = false;
        for (var sg = 0; sg < sl.length; ++sg) { if (sl[sg] && sl[sg].userid == myUid) { inG = true; break; } }
        if (!inG) this._watching = true;
        this._stopDeal();
        this._revealRunning = true;   // 先置牌: 下面 hideArrangeUI 要按亮牌阶段整桌恢复
        this._inArrangePhase = false;
        this.hideConfirmUI();
        this.hideArrangeUI();
        this._arranging = false;
        this._stopCountdown();
        if (this._n.bbMidCd) this._setMidCd(false);   // 摆牌等待倒计时结束
        this._daqiangList = data.daqiang || [];
        this._quanleidaList = data.quanleida || [];
        this._revealByGs = {};
        for (var i = 0; i < data.players.length; ++i) {
            var p = data.players[i];
            if (p.seat == null) continue;
            this._revealByGs[p.seat] = p;
        }
        var ORDER = data.players.length;
        var counts = [];
        for (var c = 0; c < (this._total || ORDER); ++c) counts.push(0);
        this._revealCounts = counts;
        this._revealDone = false;
        this._revealRunning = true;
        this._resetSlotPos();
        this.renderCards();   // 亮牌开始: 全部盖着
        console.log("[BB] 亮牌开始 座位顺序=" + Object.keys(this._revealByGs).join(",") + " 共" + ORDER + "家 打枪" + this._daqiangList.length + "对 全垒打" + this._quanleidaList.length);
        var self = this;
        // 开始比牌语音
        this._playVoice(this._mySex(), "begin");
        function finish() {
            if (self._revealDone) return;
            self._revealRunning = false;
            self._revealDone = true;
            self.showTip("");
            console.log("[BB] 亮牌结束");
            // 牌型专属特效已全部去掉: 打枪/全垒打只在亮牌结束后由 _playDaqiangFx 统一播放
            var afterFx = function () {
                if (!cc.isValid(self.node)) return;
                // 亮牌(含打枪/全垒打)结束后短暂停留, 然后跳结算弹窗
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
                }, 0.25);
            };
            afterFx();
        }
        // 亮牌顺序: 道优先轮转 —— 每轮所有玩家各亮一道(2张), 全部亮完这道再亮下一道; 每轮内庄家先亮
        var total = this._total || 2;
        var layout = this._layoutOf(total);
        var banker = (data.bankerSeat != null && data.bankerSeat >= 0) ? data.bankerSeat : 0;
        var STEP = 1.5;   // 每家每道 1.5 秒: 翻2张 + 播一条报牌语音, 语音还没播完不能翻下一家
        // 本局实际玩法(以亮牌推送里的 gameType 为准, 避免重连时 _gameType 还是旧值)
        var revealType = (data && data.gameType) || this._gameType;
        // 手摆局: 拿到免摆牌型的玩家开局一次性亮完6张, 之后不再参与逐道亮牌
        var autoSeats = {};
        if (revealType == "baobao_shou") {
            for (var ai = 0; ai < data.players.length; ++ai) {
                var ap = data.players[ai];
                if (ap.seat == null || !ap.mianFree) continue;
                var aoff = this._watching ? ap.seat : ((ap.seat - this._mySeat + total) % total);
                var aidx = layout[aoff];
                autoSeats[ap.seat] = true;
                this._revealCounts[aoff] = 6;
                if (aidx != null) {
                    for (var ak = 0; ak < 6; ++ak) self._flipOne(aidx, ak);
                    if (ap.typeName && ap.typeKey > 0) self._showMianTypeAtSeat(aidx, ap.typeName);
                }
            }
            if (Object.keys(autoSeats).length) this.renderCards();
        }
        // 纯免摆局(baobao_mian): 每家都是免摆牌型, 开局直接亮整手最优三道(一排),
        // 不再按道一对一对翻牌
        if (revealType == "baobao_mian") {
            var mianCount = 0;
            for (var mi = 0; mi < data.players.length; ++mi) {
                var mp = data.players[mi];
                if (mp.seat == null) continue;
                var moff = this._watching ? mp.seat : ((mp.seat - this._mySeat + total) % total);
                var midx = layout[moff];
                autoSeats[mp.seat] = true;
                this._revealCounts[moff] = 6;
                if (midx == null) continue;
                for (var mk = 0; mk < 6; ++mk) self._flipOne(midx, mk);
                if (mp.typeName && mp.typeKey > 0) self._showMianTypeAtSeat(midx, mp.typeName);
                mianCount++;
            }
            if (mianCount > 0) {
                this.renderCards();
                if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("fanpai.mp3");
            }
        }
        this._revealOrder = [];
        for (var t = 0; t < total && this._revealOrder.length < ORDER; ++t) {
            var g2 = (banker + t) % total;
            if (this._revealByGs[g2]) this._revealOrder.push(g2);
        }
        for (var k2 = 0; k2 < data.players.length; ++k2) {   // 兜底: 没排上的追加最后
            var g3 = data.players[k2].seat;
            if (g3 != null && this._revealOrder.indexOf(g3) < 0) this._revealOrder.push(g3);
        }
        var stepIdx = 0;
        for (var s3 = 0; s3 < 3; ++s3) {          // 先按道轮
            for (var o = 0; o < this._revealOrder.length; ++o) {   // 每道内所有玩家各亮2张
                if (autoSeats[this._revealOrder[o]]) continue;      // 免摆玩家已整手亮完, 不参与逐道亮牌
                (function (ss, oo, idx) {
                    self.scheduleOnce(function () {
                        if (!cc.isValid(self.node)) return;
                        var gs = self._revealOrder[oo];
                        var off = self._watching ? gs : ((gs - self._mySeat + total) % total);
                        var seatIdx = layout[off];
                        var p = self._revealByGs[gs];
                        var pname = (nm.bbSeats && nm.bbSeats[gs] && nm.bbSeats[gs].name) || "";
                        self.showTip("亮牌 " + pname);
                        self._revealCounts[off] = (ss + 1) * 2;
                        if (seatIdx != null) { self._flipOne(seatIdx, ss * 2); self._flipOne(seatIdx, ss * 2 + 1); }
                        self.renderCards();
                        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("fanpai.mp3");
                        if (p) self._reportDaoVoice(p, ss);
                        // 免摆玩家三道全亮后: 牌旁显示牌型名(逆向 Pk_Lb_Player ShowOutCard outListType)
                        if (p && ss == 2 && (p.mianFree || (p.groups && !p.daos)) && p.typeName && p.typeKey > 0 && seatIdx != null) self._showMianTypeAtSeat(seatIdx, p.typeName);
                    }, idx * STEP);
                })(s3, o, stepIdx);
                stepIdx++;
            }
        }
        // 全部亮完: 打枪/全垒打特效+语音, 播完再结算
        this.scheduleOnce(function () {
            if (!cc.isValid(self.node)) return;
            try { self._playDaqiangFx(finish); }
            catch (e) { console.log("[BB] 打枪特效异常:", e && e.message); finish(); }
        }, Math.max(stepIdx, 1) * STEP);
    },

    // 逐道报牌: 每翻开一道按 desc 报牌型(宝→bao, N点→dianN);
    // 手摆局免摆玩家有 daos 数据也逐道报, 最后一道额外补播 lipai(免摆/立牌);
    // 纯免摆局(只有 groups 没有 daos)只在最后一道播 lipai
    _reportDaoVoice: function (p, daoIdx) {
        var sex = p.sex || 0;
        var d = (p.daos || [])[daoIdx];
        if (d && d.desc) {
            var v = this._voiceOfDao(d.desc);
            if (v) this._playVoice(sex, v);
        }
        // 免摆玩家最后一道额外补播"免摆"(手摆局免摆 + 纯免摆局都算)
        var isMian = p.mianFree || (p.groups && !p.daos);
        if (isMian && daoIdx == 2) this._playVoice(sex, "lipai");
    },
    // 免摆玩家亮牌后牌旁显示牌型名(金色描边大字, 逆向 Pk_Lb_Player outListType[0].text = typename[mianbai])
    _showMianTypeAtSeat: function (seatIdx, typeName) {
        var seat = this._seatNodes && this._seatNodes[seatIdx];
        if (!seat || !seat.root) return;
        this._mianTypeLabels = this._mianTypeLabels || {};
        // 优先用场景里每个座位下配好的 bbMianType(位置/大小/颜色在场景里调)
        var n = (seat.mianType && cc.isValid(seat.mianType)) ? seat.mianType : this.findNode(seat.root, "bbMianType");
        var showNode = null;
        if (!n) {
            // 场景里没有该节点时兜底动态创建
            var old = this._mianTypeLabels[seatIdx];
            if (old && cc.isValid(old)) old.destroy();
            n = new cc.Node("bbMianType");
            n.parent = seat.root;
            n.setPosition(0, seatIdx == 0 ? 150 : 110);
            var lb0 = n.addComponent(cc.Label);
            lb0.fontSize = 36;
            lb0.lineHeight = 40;
            lb0.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            n.color = new cc.Color(255, 220, 90, 255);
            var ol = n.addComponent(cc.LabelOutline);
            ol.color = new cc.Color(120, 40, 0, 255);
            ol.width = 3;
            n._bbDynamic = true;
            showNode = n;
        } else {
            // bbMianType 外面套了底图(如 bbMb)时, 从最外层一起显示/隐藏
            showNode = n;
            var p = n.parent;
            while (p && p !== seat.root) { showNode = p; p = p.parent; }
        }
        var lb = n.getComponent(cc.Label);
        if (lb) lb.string = typeName;
        showNode.active = true;
        this._mianTypeLabels[seatIdx] = showNode;
    },
    _clearMianTypeLabels: function () {
        if (!this._mianTypeLabels) return;
        for (var k in this._mianTypeLabels) {
            var n = this._mianTypeLabels[k];
            if (!n || !cc.isValid(n)) continue;
            // 场景里的节点只隐藏(销毁会把场景节点删掉), 动态创建的才销毁
            if (n._bbDynamic) n.destroy();
            else n.active = false;
        }
        this._mianTypeLabels = {};
    },
    _voiceOfDao: function (desc) {
        if (!desc) return null;
        if (("" + desc).indexOf("对") == 0 || ("" + desc).indexOf("宝") == 0) return "bao";
        var m = ("" + desc).match(/^(\d+)/);
        return m ? ("dian" + (+m[1])) : null;
    },
    _playVoice: function (sex, name) {
        // 语音性别: 大厅设置里可强制 男声(nan)/女声(nv), 默认按玩家性别
        var pref = "";
        try { pref = cc.sys.localStorage.getItem("bb_voice") || ""; } catch (e) {}
        var g = pref == "nv" ? "nv" : (pref == "nan" ? "nan" : (sex == 2 ? "nv" : "nan"));
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("bb/" + g + "/" + name + ".mp3");
    },
    _playVoiceDelay: function (sex, name, ms) {
        var self = this;
        setTimeout(function () { if (cc.isValid(self.node)) self._playVoice(sex, name); }, ms);
    },
    _mySex: function () { return (cc.vv && cc.vv.userMgr && cc.vv.userMgr.sex) || 1; },

    // 后台动画开关: t_game_config.tai_rules 里 anim_xxx 值
    // withVal=true 时返回实际值(0/1/2), false 时返回 bool(兼容旧调用)
    // defVal: 字段缺失时的默认值(不传=0, 即默认关); 打枪/全垒打传 1, 老配置没这两个键也能播
    _animOn: function (key, withVal, defVal) {
        var nm = cc.vv && cc.vv.gameNetMgr;
        var tr = nm && nm.conf && nm.conf.taiRules;
        if (typeof tr === "string") { try { tr = JSON.parse(tr); } catch (e) { tr = null; } }
        var raw = tr ? tr[key] : null;
        var val = (raw == null || isNaN(Number(raw))) ? (defVal != null ? defVal : 0) : Number(raw);
        return withVal ? val : val > 0;
    },

    // 打枪/全垒打(图六后): 由后台开关控制启动; 按对轮播, 每对1.5秒, 播报打枪语音+三连枪声
    _playDaqiangFx: function (done) {
        var self = this;
        var list = this._animOn("anim_dq", false, 1) ? (this._daqiangList || []) : [];
        var ql = this._animOn("anim_qld", false, 1) ? (this._quanleidaList || []) : [];
        if (!list.length && !ql.length) { if (done) done(); return; }
        // 打枪按实际对数一枪一枪串行播, 但总时长固定 1.5 秒(按对数均分间隔),
        // 这样 2 人和 6 人从亮牌结束到小局结算弹窗的时间一致; 之前是按每枪固定 1.5 秒串行, 对数越多等得越久
        var DQ_TOTAL = 1.5;
        var gap = list.length > 1 ? (DQ_TOTAL / list.length) : 0;
        for (var i = 0; i < list.length; ++i) {
            (function (idx, pr) {
                self.scheduleOnce(function () {
                    if (!cc.isValid(self.node)) return;
                    var shooter = self._revealByGs[pr.from];
                    self._playVoice(shooter && shooter.sex, "daqiang");
                    for (var k = 0; k < 3; ++k) {
                        (function (kk) {
                            setTimeout(function () {
                                if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("da_qiang_one.mp3");
                            }, kk * 300);
                        })(k);
                    }
                    self._fxGunShot(pr.from, pr.to);
                }, idx * gap);
            })(i, list[i]);
        }
        self.scheduleOnce(function () {
            if (!cc.isValid(self.node)) return;
            if (ql.length) {
                var p0 = self._revealByGs[ql[0]];
                self._playVoice(p0 && p0.sex, "quanleida");
                self._fxQuanleida();
                self.scheduleOnce(function () { if (done) done(); }, 2.0);
            } else if (done) done();
        }, list.length ? DQ_TOTAL : 0);
    },
    // 全垒打: qldAnimat 19帧@60ms 播屏幕中心
    _fxQuanleida: function (done) {
        var frames = this._qldFrames;
        if (!frames || !frames.length) { if (done) done(); return; }
        var center = this._tableCenter();
        var node = this._fxNode(center, "bbFxQld");
        var sp = node.addComponent(cc.Sprite);
        sp.spriteFrame = frames[0];
        node.setScale(1.5);
        var idx = 0, cnt = frames.length;
        var timer = setInterval(function () {
            if (!cc.isValid(node)) { clearInterval(timer); if (done) done(); return; }
            if (++idx >= cnt) { clearInterval(timer); node.destroy(); if (done) done(); return; }
            sp.spriteFrame = frames[idx];
        }, 60);
    },
    // 开局动画(逆向 startAnimat): 20帧@50ms 播屏幕中心, 发牌开始时调用
    _fxStartAnim: function () {
        var frames = this._startFrames;
        if (!frames || !frames.length) return;
        var center = this._tableCenter();
        var node = this._fxNode(center, "bbFxStart");
        var sp = node.addComponent(cc.Sprite);
        sp.spriteFrame = frames[0];
        var fw = frames[0].getOriginalSize().width, fh = frames[0].getOriginalSize().height;
        node.setScale(Math.min(cc.winSize.width / fw, cc.winSize.height / fh) * 0.9);
        var idx = 0, cnt = frames.length;
        var timer = setInterval(function () {
            if (!cc.isValid(node)) { clearInterval(timer); return; }
            if (++idx >= cnt) { clearInterval(timer); node.destroy(); return; }
            sp.spriteFrame = frames[idx];
        }, 50);
    },
    // 打枪(逆向版): 打枪动画播在射击者位置, 枪口朝目标旋转(朝左则水平翻转); 中枪动画同时播在被打者处
    _fxGunShot: function (fromGs, toGs) {
        var total = this._total || 2;
        var offFrom = this._watching ? fromGs : ((fromGs - this._mySeat + total) % total);
        var offTo = this._watching ? toGs : ((toGs - this._mySeat + total) % total);
        var fromPos = this._avatarLocalPos(offFrom);
        var toPos = this._avatarLocalPos(offTo);
        // 打枪: dqAnimat 12帧@100ms(共1.2秒), 播在射击者头像处, 枪口朝目标
        var frames = this._dqFrames;
        if (fromPos && frames && frames.length) {
            var node = this._fxNode(fromPos, "bbFxDq");
            var sp = node.addComponent(cc.Sprite);
            sp.spriteFrame = frames[0];
            if (toPos) {
                // 逆向: 枪口默认朝右; 目标在左时 scaleX=-0.8 翻转, 旋转要 angle+180 才是真朝向
                // 注意必须用 angle 而不是 rotation: Cocos2d 的 node.rotation = -angle(顺时针为正),
                // 用 rotation 会把朝向转反; angle 才是逆时针为正, 与 Unity Quaternion.Euler(0,0,z) 一致
                var ang = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x) * 180 / Math.PI;
                if (toPos.x < fromPos.x) { node.scaleX = -0.8; node.scaleY = 0.8; node.angle = ang + 180; }
                else { node.setScale(0.8); node.angle = ang; }
            } else { node.setScale(0.8); }
            var idx = 0, cnt = frames.length;
            var timer = setInterval(function () {
                if (!cc.isValid(node)) { clearInterval(timer); return; }
                if (++idx >= cnt) { clearInterval(timer); node.destroy(); return; }
                sp.spriteFrame = frames[idx];
            }, 100);
        } else if (fromPos) {
            var g2 = this._fxNode(fromPos, "bbFxDq").addComponent(cc.Graphics);
            g2.fillColor = cc.color(255, 60, 0, 220);
            g2.circle(0, 0, 40); g2.fill();
            g2.node.setScale(0.2);
            g2.node.runAction(cc.sequence(cc.scaleTo(0.2, 1), cc.delayTime(0.6), cc.fadeOut(0.3), cc.removeSelf()));
        }
        // 中枪(爆炸): zqAnimat 3帧@400ms(共1.2秒), 播在被打者头像处
        var zq = this._zqFrames;
        if (toPos && zq && zq.length) {
            var znode = this._fxNode(toPos, "bbFxZq");
            var zsp = znode.addComponent(cc.Sprite);
            zsp.spriteFrame = zq[0];
            var zi = 0, zc = zq.length;
            var ztimer = setInterval(function () {
                if (!cc.isValid(znode)) { clearInterval(ztimer); return; }
                if (++zi >= zc) { clearInterval(ztimer); znode.destroy(); return; }
                zsp.spriteFrame = zq[zi];
            }, 400);
        }
    },

    // 免摆牌型的三道: 直接按服务端 mianOrder 的牌型结构切(如 3组9 = 72/63/63),
    // 不能用 autoArrangeLocal 的系统最优三道(会摆成 66/33/72)
    _mianDaos: function () {
        var nm = cc.vv.gameNetMgr;
        var mo = nm && nm.bbMianFree && nm.bbMyMian && nm.bbMyMian.cards;
        if (!mo || mo.length != 6) return null;
        return [[mo[0], mo[1]], [mo[2], mo[3]], [mo[4], mo[5]]];
    },

    // ===== 手摆: 摆牌交互 =====
    showArrangeUI: function (remain) {
        this._arranging = true;
        this._inArrangePhase = true;
        this._wulongWarned = false;
        this._arrangeRemain = remain != null ? remain : (this._arrangeRemain || 0);
        // 免摆只是牌型标记: 流程与手摆一致, 弹窗打开时预填最优三道(可自由调整/全部取消)
        var nm = cc.vv.gameNetMgr;
        if (nm.bbMianFree) {
            var empty = true;
            for (var mi = 0; mi < 3; ++mi) { if (this._daoSel[mi] && (this._daoSel[mi][0] != null || this._daoSel[mi][1] != null)) { empty = false; break; } }
            if (empty) {
                // 免摆牌型: 前/中/后 直接按免摆牌型的结构切(与服务端 mianOrder 一致), 不再用最优三道
                var md = this._mianDaos();
                if (md) this._daoSel = [md[0].slice(), md[1].slice(), md[2].slice()];
                else {
                    var pre = this.autoArrangeLocal((nm.bbMyCards || []).slice());
                    if (pre) this._daoSel = [pre[0].slice(), pre[1].slice(), pre[2].slice()];
                }
            }
        }
        if (this._n.bbMidCd) this._setMidCd(false);
        if (this._n.bbArrReopen) this._n.bbArrReopen.active = false;
        if (this._arrangeRoot) {
            this._arrangeRoot.active = true;
            if (this._arrangeRoot.parent) this._arrangeRoot.setSiblingIndex(this._arrangeRoot.parent.children.length - 1);
        }
        // 请出牌语音(进摆牌阶段)
        this._playVoice(this._mySex(), "qingchupai");
        this._resetArrangeSlotPos();   // 上一局被拖走的牌先归位, 否则第二局弹窗里会残留上一局的牌、异常中断的拖动落点
        this._arrangeTipActive = false;
        this._arrangeWarnSeq = (this._arrangeWarnSeq || 0) + 1;   // 作废上一局未到时的提示回调
        this._renderArrange();
        this.renderCards();
        this._setSeatCardsVisible(false);   // 摆牌时牌桌上的牌全部收起, 只弹窗里显示
        if (nm.bbMianFree && nm.bbMyMian) {
            // 逆向 Pk.Lb.Out: 免摆玩家不弹摆牌区, 只留一个「免摆出牌」按钮
            if (this._arrangeRoot) this._arrangeRoot.active = false;
            this.showMianFreeUI();
        } else {
            this.showTip("请摆牌：拖手牌到前/中/后道位，道内牌可再拖动换位，点道内牌退回");
        }
        this._startCountdown(this._leftOf(this._arrangeRemain, this._arrangeRemainAt), this._arrangeCd, function () {
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
        if (this._n.bbArrReopen) this._n.bbArrReopen.active = false;
        if (this._arrangeCd) this.setStr(this._arrangeCd, "");
        this._hideMianOutBtn();
        this._stopCountdown();
        // 摆牌阶段不能整桌恢复: 只恢复已确认出牌的那几家, 未确认的继续空桌
        this._restoreSeatCardsVisible();
    },

    // 摆牌阶段按人恢复牌桌: 只有已确认出牌的玩家显示自己的牌背;
    // 亮牌/结算/准备等其它阶段才统一恢复所有座位的牌
    // 是否处于手摆的摆牌阶段(未亮牌): 三个信号任一成立都算, 避免某条推送漏置标志就整桌恢复
    _isArrangeTurn: function () {
        if (this._revealDone || this._revealRunning) return false;
        if (!this._started || this._gameType != "baobao_shou") return false;
        var nm = cc.vv.gameNetMgr;
        return !!(this._inArrangePhase || this._arranging || (nm && nm.bbPhase == "arrange"));
    },

    _restoreSeatCardsVisible: function () {
        if (!this._isArrangeTurn()) { this._setSeatCardsVisible(true); return; }
        this._applyArrangeSeatVisible();
    },

    // 摆牌阶段: 只打开已确认出牌那几家的牌区, 其余保持空桌
    _applyArrangeSeatVisible: function () {
        var nm = cc.vv.gameNetMgr;
        var total = this._total || 2;
        var layout = this._layoutOf(total);
        var seats = (nm && nm.bbSeats) || [];
        var vis = {};
        for (var gs = 0; gs < seats.length; ++gs) {
            var rel = (gs - (this._mySeat || 0) + seats.length) % seats.length;
            if (rel >= total) continue;
            vis[layout[rel]] = !!(seats[gs] && seats[gs].arranged);
        }
        for (var i = 0; i < this._seatNodes.length; ++i) {
            var sn = this._seatNodes[i];
            if (sn && sn.cardsNode) sn.cardsNode.active = !!vis[i];
        }
    },

    // 摆牌弹窗右上角 X: 收起弹窗看牌桌, 右下角浮出「摆牌」小按钮可随时再打开
    onArrangeCloseTap: function () {
        if (!this._arranging) return;
        if (this._arrangeRoot) this._arrangeRoot.active = false;
        if (this._n.bbArrReopen) this._n.bbArrReopen.active = true;
        // 摆牌期间牌桌保持空桌(用户要求只有点确定出牌后才显示牌), 收起弹窗也不恢复
    },
    onArrangeReopenTap: function () {
        if (!this._arranging) return;
        if (this._arrangeRoot) {
            this._arrangeRoot.active = true;
            if (this._arrangeRoot.parent) this._arrangeRoot.setSiblingIndex(this._arrangeRoot.parent.children.length - 1);
        }
        if (this._n.bbArrReopen) this._n.bbArrReopen.active = false;
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
        var best = null, bestDx = 0, bestDy = 0, bestDist = -1, bestNode = null;
        for (var d = 0; d < rows.length; ++d) {
            var rh = homes[d];
            if (!rh) continue;
            for (var k = 0; k < 2; ++k) {
                var n = rows[d].slots[k];
                if (!n || !n.parent || !rh[k]) continue;
                var c = n.parent.convertToWorldSpaceAR(cc.v2(rh[k].x, rh[k].y));
                var dx = worldLoc.x - c.x, dy = worldLoc.y - c.y;
                var dist = dx * dx + dy * dy;
                if (bestDist < 0 || dist < bestDist) { bestDist = dist; bestDx = dx; bestDy = dy; best = { d: d, k: k }; bestNode = n; }
            }
        }
        if (!best) return null;
        // 命中范围直接按场景里牌位的实际尺寸算(半宽/半高各外扩 24px), 场景里改牌的位置/大小都不用再动代码
        var rx = (bestNode ? bestNode.width : 84) * 0.5 + 24;
        var ry = (bestNode ? bestNode.height : 116) * 0.5 + 24;
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
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("select.wav");
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
        if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("select.wav");
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
            var arrangeNm = cc.vv.gameNetMgr;
            // 开局时已按显示顺序排好(免摆按牌型结构, 其它按成组优先+点数降序), 这里直接用
            var myCards = arrangeNm.bbMyCards || [];
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
        // 摆满三道后校验 前>=中>=后, 违反即提示将判乌龙
        if (this._arrangeTip && !this._arrangeTipActive) {
            this.setStr(this._arrangeTip, this._daoOrderOkLocal()
                ? "拖手牌到道位放入, 道内牌可再拖动换位, 点道内牌退回; 前道 ≥ 中道 ≥ 后道"
                : "警告: 当前摆法 前<中 或 中<后, 将判乌龙三道全输!");
        }
    },

    // 客户端道型展示(与服务端 evalDao/daoDesc 一致)
    daoDescText: function (c1, c2) {
        var r1 = this.rankOf(c1), r2 = this.rankOf(c2);
        if (r1 == r2) {
            var names = { 11: "J", 12: "Q", 13: "K", 14: "A" };
            return "对" + (names[r1] || r1);
        }
        return ((this.dianVal(r1) + this.dianVal(r2)) % 10) + "点";
    },

    onConfirmArrange: function () {
        if (!this._arranging) return;
        if (!this._daoFull(this._daoSel[0]) || !this._daoFull(this._daoSel[1]) || !this._daoFull(this._daoSel[2])) {
            this.showTip("请摆满三道(每道2张)");
            return;
        }
        // 摆法违反 前>=中>=后: 首次点击仅警告, 再点一次才确认提交(提交后判乌龙三道全输)
        // 免摆牌型的摆法由服务端按牌型统一结算, 不走乌龙判定, 这里也不提示
        if (!this._daoOrderOkLocal() && !this._wulongWarned && !(cc.vv.gameNetMgr && cc.vv.gameNetMgr.bbMianFree)) {
            this._wulongWarned = true;
            this.showTip("摆法违反前≥中≥后, 将判乌龙全输! 再点一次确定提交");
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
        this._hideMianOutBtn();
        if (this._arrangeRoot) this._arrangeRoot.active = false;
        this._stopCountdown();
        // 只恢复自己这一家的牌: 其他玩家各自确认后才显示自己的牌
        var myUid = cc.vv && cc.vv.userMgr && cc.vv.userMgr.userId;
        // 本地先标记自己已确认, 否则 renderCards 会按「未确认」把自己的牌区又收起
        var gnm = cc.vv.gameNetMgr;
        if (gnm && gnm.bbSeats && gnm.bbSeats[gnm.bbMySeat]) gnm.bbSeats[gnm.bbMySeat].arranged = true;
        var mySlot = this._slotIdxOfUser(myUid);
        if (mySlot >= 0 && this._seatNodes[mySlot] && this._seatNodes[mySlot].cardsNode) {
            this._seatNodes[mySlot].cardsNode.active = true;
        }
        this.renderCards();   // 重绘牌位: 只让自己这一家的单卡重新激活
        if (this._n.countdownLabel) this.setStr(this._n.countdownLabel, "");
        // 图八: 确定出牌后关闭摆牌弹窗, 倒计时挪到牌桌正中间, 等待其他玩家
        if (this._n.bbMidCd) {
            this._setMidCd(true);
            this._startCountdown(this._leftOf(this._arrangeRemain, this._arrangeRemainAt), this._n.bbMidCd, null);
        }
        this.showTip("已提交，等待其他玩家…");
    },

    // 图三: 全部取消 —— 清空三道重新摆
    onCancelAllArrange: function () {
        if (!this._arranging) return;
        this._daoSel = [[null, null], [null, null], [null, null]];
        this._wulongWarned = false;
        this._renderArrange();
        this.renderCards();
    },

    // 免摆提示(逆向 Pk_Lb_Out mianbaiout): 牌桌中间弹金色「免摆出牌」大按钮,
    // 上面一行小字显示牌型名, 点按钮=播 lipai 音效并出牌(手摆房里按预填三道提交)
    // parent/handler/y 可选: 免摆玩法直接挂到房间节点上, 不弹摆牌弹窗
    _showMianOutBtn: function (parent, handler, y) {
        this._hideMianOutBtn();
        var root = parent || this._arrangeRoot;
        if (!root) return;
        var nm = cc.vv.gameNetMgr;
        var mian = nm && nm.bbMyMian;
        var wrap = new cc.Node("bbMianOutBtn");
        wrap.parent = root;
        wrap.setPosition(0, y == null ? -150 : y);
        wrap.setContentSize(340, 120);
        wrap.setSiblingIndex(root.children.length - 1);
        // 牌型名(按钮上方)
        var tn = new cc.Node("typeName");
        tn.parent = wrap;
        tn.setPosition(0, 78);
        var tnl = tn.addComponent(cc.Label);
        tnl.string = "免摆牌型：" + (mian ? mian.typeName : "") + "  ×" + (mian ? (mian.rate || 1) : 1);
        tnl.fontSize = 30;
        tnl.lineHeight = 34;
        tnl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        var tnc = tnl.node.color;
        tnc.setR(255); tnc.setG(220); tnc.setB(90);   // 金色
        // 按钮底
        var bg = new cc.Node("bg");
        bg.parent = wrap;
        bg.setContentSize(320, 88);
        var g = bg.addComponent(cc.Graphics);
        g.fillColor = new cc.Color(30, 140, 60, 255);
        g.roundRect(-160, -44, 320, 88, 16);
        g.fill();
        g.strokeColor = new cc.Color(255, 220, 90, 255);
        g.lineWidth = 3;
        g.roundRect(-160, -44, 320, 88, 16);
        g.stroke();
        var lb = new cc.Node("label");
        lb.parent = bg;
        var l = lb.addComponent(cc.Label);
        l.string = "免摆出牌";
        l.fontSize = 42;
        l.lineHeight = 46;
        l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        var btn = bg.addComponent(cc.Button);
        btn.transition = cc.Button.Transition.SCALE;
        btn.duration = 0.08;
        var self = this;
        bg.on(cc.Node.EventType.TOUCH_END, function () {
            self._playVoice(self._mySex(), "lipai");   // 原包免摆确认播 lipai
            (handler || self.onConfirmArrange).call(self);
        });
        this._mianOutBtn = wrap;
    },
    _hideMianOutBtn: function () {
        if (this._mianOutBtn) {
            if (cc.isValid(this._mianOutBtn)) this._mianOutBtn.destroy();
            this._mianOutBtn = null;
        }
    },

    onAutoArrange: function () {
        if (!this._arranging) return;
        var nm = cc.vv.gameNetMgr;
        var best = this._mianDaos() || this.autoArrangeLocal(nm.bbMyCards || []);
        if (best) { this._daoSel = best; this._wulongWarned = false; this.renderCards(); }
        else this.showTip("自动摆牌失败，请手动摆牌");
    },

    // 单道评估(与服务端 evalDao 一致)
    // 宝: 对子, rank 为对子点数, suit 取其中花色大的
    // 散牌: point=(p1+p2)%10, maxRank/maxSuit=最大单张点数牌
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
    // 3) 散牌 vs 散牌: 先比点数(9最大/0最小), 同点(含0点)按后台配置比较:
    //    1=最大牌花色, 2=和, 3=最大单张点数再比花色
    _cmpD: function (a, b) {
        if (a.bao != b.bao) return a.bao ? 1 : -1;
        if (a.bao) {
            if (a.rank != b.rank) return a.rank > b.rank ? 1 : -1;
            return this._cmpSuit(a.suit, b.suit);
        }
        if (a.point != b.point) return a.point > b.point ? 1 : -1;
        var mode = this._tdMode || 3;
        if (mode == 2) return 0;
        if (mode != 3) return this._cmpSuit(a.maxSuit, b.maxSuit);
        if (a.maxRank != b.maxRank) return a.maxRank > b.maxRank ? 1 : -1;
        return this._cmpSuit(a.maxSuit, b.maxSuit);
    },
    // 同点比较模式(后台 tai_rules.tongdian_mode): 1=比最大牌花色 2=和(打平) 3=先比最大单张点数再比花色
    // 老配置 tongdian_flower 兼容: 1→1(比花色), 0→3(老的"和"改为完整比法)
    _applyBbConf: function (data) {
        var nm = cc.vv && cc.vv.gameNetMgr;
        // 开局推送里的 conf 是最新的(taiRules 可能含俱乐部牌桌自配): 同步到 gameNetMgr,
        // 否则只认 login_result 的旧 conf, 后台改了开关本局不生效
        if (data && data.conf && nm) nm.conf = data.conf;
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
    // 当前三道是否满足 前>=中>=后(未摆满视为合法, 不告警)
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
                if (this._cmpD(vals[i], vals[j]) < 0) return names[i] + "不能小于" + names[j];
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

    // 摆牌专用比较(与服务端 cmpArrange 一致): 不读 tongdian_mode, 只比 点数→最大单张点数→花色
    // 例: 678JQK → K8/Q7/J6; 5789JK → K9/J8/57
    _cmpArrange: function (a, b) {
        if (a.bao != b.bao) return a.bao ? 1 : -1;
        if (a.bao) {
            if (a.rank != b.rank) return a.rank > b.rank ? 1 : -1;
            return this._cmpSuit(a.suit, b.suit);
        }
        if (a.point != b.point) return a.point > b.point ? 1 : -1;
        if (a.maxRank != b.maxRank) return a.maxRank > b.maxRank ? 1 : -1;
        return this._cmpSuit(a.maxSuit, b.maxSuit);
    },
    // 本地版 autoArrange(与服务端一致: 枚举90种, 前>=中>=后按 _cmpD 校验不摆乌龙,
    // 候选按 _cmpArrange 取(前,中,后)最大 —— 点数相同比最大单张)
    autoArrangeLocal: function (cards) {
        if (!cards || cards.length != 6) return null;
        var evalD = this._evalD.bind(this);
        var cmpD = this._cmpD.bind(this);
        var cmpA = this._cmpArrange.bind(this);
        var best = null, bestCards = null;
        var idx = [0, 1, 2, 3, 4, 5], pairs = [];
        for (var a = 0; a < 6; ++a) for (var b = a + 1; b < 6; ++b) pairs.push([a, b]);
        function better(x, y) {
            if (!y) return true;
            for (var d = 0; d <= 2; ++d) { var c = cmpA(x[d], y[d]); if (c != 0) return c > 0; }
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
                        if (cmpD(arr[0], arr[1]) < 0 || cmpD(arr[1], arr[2]) < 0) continue;
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
        // 展示统一大牌在前(与服务端 autoArrange 一致)
        var self2 = this;
        bestCards.forEach(function (p) {
            p.sort(function (a, b) { return self2.rankOf(b) - self2.rankOf(a) || self2.suitOf(a) - self2.suitOf(b); });
        });
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
            // 重进房间时亮牌动画不会重跑, 结算会一直挂在缓存里弹不出来: 1 秒兜底强制弹结算
            var selfP = this;
            this.scheduleOnce(function () {
                if (!cc.isValid(selfP.node) || !selfP._pendingOver) return;
                var d = selfP._pendingOver;
                selfP._pendingOver = null;
                selfP._revealRunning = false;
                selfP._fxRunning = false;
                selfP._revealDone = true;
                selfP.applyGameOver(d, null);
            }, 1.0);
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
            if (r.mianFree && r.typeName) {
                // 免摆玩家(逆向 Pk_Lb_OneResult): 显示「牌型名免摆」, 不再列三道
                desc = r.typeName + "免摆";
            } else if (r.daos) {
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
        this._inArrangePhase = false;
        this.hideArrangeUI();
        this.hideConfirmUI();
        if (this._n.bbMidCd) this._setMidCd(false);

        if (this._n.resultPanel) this._n.resultPanel.active = true;
        this._clearMianTypeLabels();   // 结算弹窗盖住牌桌, 亮牌时的免摆牌型名标签清掉
        // 按钮贴图再确认一次(父节点刚激活时重新赋值可避免首帧只剩文字)
        this._ensureSettleBtnFrames();
        // 按钮激活放在明牌渲染之前: 渲染任何异常都不能影响按钮显示
        // 按钮文字已固化在场景里, 这里只控制显示/隐藏, 不改文字
        // 整场最后一局也先弹本局结算: 「确定」或倒计时结束后再弹总结算弹窗, 退出按钮只在总结算里出现
        // 场景里没有独立的退出按钮节点, 两段结算复用 settleAgainBtn: 第一段文字「确定」, 第二段改成「退出」
        // 房间无法续局时直接把按钮改成「退出房间」, 点击即离房
        this._setSettleActionBtn(roomEnd ? "退出房间" : "继续游戏", roomEnd);
        // 最后一局/无法续局: 洗牌按钮不隐藏, 置灰不可点(续局时才可点)
        if (this._resultShuffleBtn) {
            var shuffleOff = isFinal || roomEnd;
            this._resultShuffleBtn.active = true;
            this._resultShuffleBtn.opacity = shuffleOff ? 120 : 255;
            if (shuffleOff) this._resultShuffleBtn.off(cc.Node.EventType.TOUCH_END);
            else this.bindButton(this._resultShuffleBtn, this.onResultShuffle, this);
        }
        if (this._n.resultExitBtn) this._n.resultExitBtn.active = false;
        this._settle1Done = !isFinal;   // 整场结束: 本局结算还没看完
        this._setSettleContentStyle(this._settleFontSize, this._settleLineHeight, this._settleContentY);
        this.setStr(this._n.resultContent, lines.join("\n"));
        // 单局结算左上角: 第几局(局数由服务端下发, 文字节点在场景里)
        if (this._n.settleRound) {
            this._n.settleRound.active = true;
            this.setStr(this._n.settleRound, nm.maxNumOfGames > 0
                ? "第" + nm.numOfGames + "/" + nm.maxNumOfGames + "局"
                : "第" + nm.numOfGames + "局");
        }
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
        // 顶部结果图: 胜利/失败/平局用场景里的 slSprite/sbSprite/hjSprite, 不再用文字
        if (this._n.slSprite) this._n.slSprite.active = myDelta > 0;
        if (this._n.sbSprite) this._n.sbSprite.active = myDelta < 0;
        if (this._n.hjSprite) this._n.hjSprite.active = myDelta === 0;
        if (this._n.resultTitle) this._n.resultTitle.active = false;
        // 图二: 左上申请解散 + 底部分享战绩(总结算时才隐藏解散)
        if (this._n.disbandBtn) this._n.disbandBtn.active = !isFinal;
        if (this._n.shareBtn) this._n.shareBtn.active = true;
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
        // 回放: 结算只用来查看本局结果, 不续局/不分享, 动作按钮改成「返回」直接回俱乐部
        if (this._replay) {
            this._stopCountdown();
            if (this._settleCd) this.setStr(this._settleCd, "");
            this._final = false;
            this._roomEnd = false;
            this._settle1Done = true;
            if (this._n.disbandBtn) this._n.disbandBtn.active = false;
            if (this._n.shareBtn) this._n.shareBtn.active = false;
            if (this._n.resultExitBtn) this._n.resultExitBtn.active = false;
            if (this._resultShuffleBtn) this._resultShuffleBtn.active = false;
            this._setSettleActionBtn("返回", false);
            this.bindButton(this._n.resultCloseBtn, this._exitReplay, this);
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
        // 视口高度/位置直接对齐场景里的列表占位节点 bbSettleCards(640x400): 列表范围就是背景框的范围
        var VIEW_W = 800;
        var VIEW_H = (root.height > 100) ? Math.round(root.height) : 400;
        var VIEW_X = root.x || 0, VIEW_Y = root.y || 0;
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
            scrollNode.setPosition(VIEW_X, VIEW_Y);   // 与场景列表占位节点重合
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
        // 某家本局加减分(服务端 results 里各自的 delta, 不是「与我」的口径)
        var ownScore = function (res) {
            return res && res.delta != null ? res.delta : 0;
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
        // 行距固定: 不管本局几个人, 每行占的高度都一样(按 6 人刚好铺满列表区算), 行内容等比缩放也固定
        var tplH = (this._settleRowTpl && this._settleRowTpl.height) || 75;
        var viewH = this._settleViewH || 400;
        var ROW_H = Math.floor(viewH / 6);
        var rowScale = Math.min(1, ROW_H / tplH);
        // 行从上往下排: 第一行贴列表区顶部, 行距固定不随人数变化
        root.setContentSize(this._settleViewW || 840, viewH);   // 顶部锚点: 内容从视口顶部往下排
        var rowIdx = 0;                        // 行的显示序号(与座位号无关, 保证两行紧挨着)
        var self = this;
        // 一行: 昵称 | 六张明牌(按牌型排列) | 牌型文字 | 分数
        // 整行全部克隆场景固化的行模板(rowIcon/rowName/card0-5/rowDesc/rowScore), JS 只填数据
        var rowTpl = this._settleRowTpl;
        var renderRow = function (r, gIdx, score) {
            var name = (r.name || "") + (gIdx == myGs ? "(我)" : "") + (gIdx == bankerGs ? "(庄)" : "");
            var ids = [], desc = "";
            if (!r.mianFree && r.daos) {
                // 手摆: 前/中/后三道各两张
                for (var d = 0; d < r.daos.length; ++d) { var dc = r.daos[d].cards || []; ids.push(dc[0], dc[1]); }
                //结算弹窗不显示倍率, 改为只看本局分数加减
                desc = r.daos.map(function (x2) { return x2.desc; }).join(" ");
                if (r.wulong) desc = "乌龙 " + desc;
            } else {
                // 免摆(含手摆房里自动免摆的非散牌): 六张按牌型排列(同点成组在前), 显示整手牌型
                ids = self._mianOrder(r.holds || [], r.typeKey);
                var tn = r.typeName || "";
                // 逆向 Pk_Lb_OneResult: 免摆行显示 牌型名 .. "免摆"(手摆房的免摆玩家 / 免摆玩法的非散牌)
                if (r.mianFree || (self._gameType == "baobao_mian" && r.typeKey > 0)) tn += "免摆";
                // 散牌额外列出构成(一对/单张), 如 散牌(一对Q 单A 单K 单7)
                var parts = (r.typeKey == 0 || tn == "散牌") ? self._mianParts(r.holds) : "";
                desc = tn + (parts ? "(" + parts + ")" : "");
            }
            // 其他玩家的分数一律是「我与他」之间的结算(各人视角不同), 不是他自己的本局结果
            // 分数只显示 +/- 数值
            var scoreStr = typeof score === "string" ? score
                : (score == null ? "0" : (score > 0 ? "+" : "") + score);
            var rowY = -ROW_H * (rowIdx + 0.5);
            rowIdx++;
            if (rowTpl && cc.isValid(rowTpl)) {
                var row = cc.instantiate(rowTpl);
                row.active = true;
                row.parent = root;
                row.setPosition(0, rowY);
                row.setScale(rowScale);   // 行多时整行等比缩小, 保证 6 行全部落在视口内
                self.setStr(self.findNode(row, "rowName"), name);
                var descNode = self.findNode(row, "rowDesc");
                self.setStr(descNode, desc);
                if (descNode) descNode.active = !!desc;
                self.setStr(self.findNode(row, "rowScore"), scoreStr);
                // 每行左侧玩家头像: 用场景 rowIcon(已挂 ImageLoader), 这里只填 userid
                var iconNode = self.findNode(row, "rowIcon");
                if (iconNode) {
                    var il = iconNode.getComponent("ImageLoader");
                    if (il && r.userid) { iconNode.active = true; il.setUserID(r.userid); }
                    else if (il) { iconNode.active = true; il.clearAvatar(); }
                }
                for (var ci = 0; ci < 6; ++ci) {
                    var cn = self.findNode(row, "card" + ci);
                    if (!cn) continue;
                    if (ids[ci] != null) {
                        cn.active = true;
                        var sp = cn.getComponent(cc.Sprite);
                        if (sp) sp.spriteFrame = self.jsFrameOf(ids[ci]) || self.frameOf(ids[ci]) || self._cardBack || null;
                    } else cn.active = false;
                }
                return;
            }
        };
        // 自己行: 本局合计 + 本房间总积分(账户宝宝豆余额)
        var myDelta = my.delta || 0;
        // 分数只显示 +/- 数值(本局各自加减分)
        var myScoreText = (myDelta > 0 ? "+" : "") + myDelta;
        renderRow(my, myGs, myScoreText);
        for (var o = 0; o < opps.length; ++o) {
            var or = resOfGs(opps[o]);
            if (!or) continue;
            renderRow(or, opps[o], ownScore(or));
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

    // 整场结束总结算: 独立弹窗(场景 game_result), 不再复用单局结算 settlePanel
    _showFinalSummary: function () {
        if (this._summaryShown) return;
        this._summaryShown = true;
        this._settle1Done = true;
        this._stopCountdown();
        var detail = this._endDetail || {};
        var endinfo = detail.endinfo || [];
        // endinfo 缺失时用房间座位上的积分兜底
        if (endinfo.length == 0 && cc.vv.gameNetMgr && cc.vv.gameNetMgr.seats) {
            var ss = cc.vv.gameNetMgr.seats;
            for (var k = 0; k < ss.length; ++k) {
                if (ss[k] && ss[k].userId > 0) endinfo.push({ userid: ss[k].userId, name: ss[k].name, score: ss[k].score });
            }
        }
        // 按总分从高到低排列: 大赢家卡片排在左侧(与结算图一致)
        endinfo.sort(function (a, b) { return (Number(b && b.score) || 0) - (Number(a && a.score) || 0); });
        console.log("[BB] 弹整场总结算(独立弹窗), 总分人数=" + endinfo.length);
        if (this._n.resultPanel) this._n.resultPanel.active = false;   // 单局结算弹窗关掉
        this._renderFinalPanel(endinfo);
    },

    // 总结算弹窗数据填充: 顶部信息条 + 每玩家卡片(头像/名字/ID/总分), 布局全部在场景里
    _renderFinalPanel: function (endinfo) {
        var n = this._n;
        var panel = n.finalPanel;
        if (!panel || !cc.isValid(panel)) { console.log("[BB] 场景缺少 game_result 总结算弹窗"); return false; }
        panel.active = true;
        panel.setSiblingIndex(panel.parent.childrenCount - 1);   // 压在最上层
        var nm = cc.vv.gameNetMgr || {};
        var conf = nm.conf || {};
        var wanfa = nm.getWanfa ? (nm.getWanfa() || "") : "";
        var cost = conf.cost != null ? conf.cost : (conf.fangka != null ? conf.fangka : "管理员");
        var rate = conf.rate != null ? conf.rate : (conf.multiple != null ? conf.multiple : 1);
        var d = new Date();
        var pad = function (v) { return v < 10 ? "0" + v : "" + v; };
        var time = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
        this.setStr(n.finalInfo, "房号：" + (nm.roomId || "") + "   " + wanfa + "    扣费:" + cost + "   倍率:" + rate + "倍    " + time);
        // 大赢家 = 总分最高且为正
        var maxScore = -Infinity;
        for (var i = 0; i < endinfo.length; ++i) {
            var v = Number(endinfo[i].score) || 0;
            if (v > maxScore) maxScore = v;
        }
        var total = Math.min(n.finalCards.length, endinfo.length);
        var cardW = (n.finalCards[0] && n.finalCards[0].root.width) || 180;
        var SPACING = cardW + 8;                 // 卡片宽 + 8 间距, 6 张卡也能居中放下一排
        var startX = -((total - 1) * SPACING) / 2;
        for (var c = 0; c < n.finalCards.length; ++c) {
            var card = n.finalCards[c];
            var on = c < total;
            card.root.active = on;
            if (!on) continue;
            card.root.setPosition(startX + c * SPACING, card.root.y);
            var e = endinfo[c] || {};
            var sc = Number(e.score) || 0;
            var isWin = sc > 0 && sc == maxScore;
            if (card.win) card.win.active = isWin;
            if (card.bg) card.bg.color = sc > 0 ? cc.color(255, 132, 112) : (sc < 0 ? cc.color(128, 166, 255) : cc.color(235, 235, 235));
            if (card.avatar) {
                var il = card.avatar.getComponent("ImageLoader");
                if (!il) { try { il = card.avatar.addComponent("ImageLoader"); } catch (err) {} }
                if (il && e.userid) il.setUserID(e.userid);
            }
            this.setStr(card.name, e.name || "");
            this.setStr(card.id, e.userid != null ? ("ID:" + e.userid) : "");
            this.setStr(card.score, (sc > 0 ? "+" : "") + sc);
            if (card.score) {
                card.score.color = sc > 0 ? cc.color(255, 212, 70) : (sc < 0 ? cc.color(92, 232, 160) : cc.color(240, 240, 240));
                card.score.opacity = 255;
            }
        }
        return true;
    },

    // 总结算弹窗按钮: 返回大厅(按进房来源) / 快速加入(回俱乐部后自动挑一张未满桌)
    onFinalBack: function () {
        var nm = cc.vv && cc.vv.gameNetMgr;
        // 返回大厅: 从俱乐部进的桌子回俱乐部大厅(该俱乐部的玩法详情页), 大厅进的才回大厅
        if (nm && nm.roomBackScene === "club" && nm.roomBackClubId) cc.vv.fromClubId = nm.roomBackClubId;
        this._leaveFinalRoom(false);
    },
    onFinalJoin: function () {
        var nm = cc.vv && cc.vv.gameNetMgr;
        // 快速回入: 回俱乐部后直接进第一张「同玩法且有空位」的牌桌
        if (nm && nm.bbGameType) cc.vv.lastGameType = nm.bbGameType;
        cc.vv.autoQuickJoin = { gameType: nm ? (nm.bbGameType || null) : null };
        this._leaveFinalRoom(true);
    },
    _leaveFinalRoom: function () {
        if (this._leaving) return;
        this._summaryShown = true;
        this._stopCountdown();
        if (this._n.finalPanel) this._n.finalPanel.active = false;
        this._myContinued = true;
        if (cc.vv.gameNetMgr && cc.vv.gameNetMgr.clearRoomState) cc.vv.gameNetMgr.clearRoomState();
        cc.vv.net.send("leave_room");
        var self = this;
        this._exitTimer = setTimeout(function () {
            self._exitTimer = null;
            if (!cc.isValid(self.node) || self._leaving) return;
            self.leaveRoom();
        }, 500);
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
        if (this._summaryShown) { this._leaveFinalRoom(); return; }
        if (this._n.resultPanel) this._n.resultPanel.active = false;
        if (this._final) { this._showFinalSummary(); return; }
        this._settleClosedAt = Date.now();   // 计时起点: 结算关掉到收到下一局开局之间耗时
        if (!this._myContinued) {
            this._myContinued = true;
            cc.vv.net.send("bb_continue");
            this._startContinueRetry();
        }
        this.showTip("已确定，等待其他玩家…");
        this._settleCdToTable();
    },

    // 结算弹窗收起后, 剩余倒计时挪到牌桌正中继续走(弹窗里的倒计时节点已不可见)
    _settleCdToTable: function () {
        var left = 0;
        if (this._cdBase != null && this._cdStartAt != null) {
            left = Math.max(0, this._cdBase - Math.floor((Date.now() - this._cdStartAt) / 1000));
        }
        var self = this;
        if (left > 0 && this._n.bbMidCd) {
            this._setMidCd(true);
            this._startCountdown(left, this._n.bbMidCd, function () {
                if (self._n.bbMidCd) self._n.bbMidCd.active = false;
            });
        }
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
            this._settleCdToTable();
            return;
        }
        this._myContinued = true;
        this.showTip("已确定，等待其他玩家…");
        cc.vv.net.send("bb_continue", { shuffle: true });
        this._startContinueRetry();
        this._settleCdToTable();
    },

    // 洗牌动画(逆向 Pk.XiPaiAnimat): spine 播 1.6 秒收拢 -> 换成一张静止牌背 -> 3 秒整关闭发牌
    _playShuffleAnim: function (onDone) {
        var self = this;
        var done = false;
        function finish() { if (done) return; done = true; if (onDone) onDone(); }
        try {
            if (!this._shuffleRoot || !cc.isValid(this._shuffleRoot)) {
                this._shuffleRoot = this.findNode(this.node, "bbShuffleAnim") || cc.find("Canvas/bbShuffleAnim");
            }
            // 先收起上一局的牌, 动画期间桌面上只有洗牌画面
            this._clearCards();
            if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("shuffle.wav");
            var center = this._tableCenter();
            var animNode = null;
            if (this._qiepaiSpine) {
                animNode = this._fxNode(center, "bbFxQiepaiSpine");
                var sk = animNode.addComponent(sp.Skeleton);
                sk.skeletonData = this._qiepaiSpine;
                sk.premultipliedAlpha = false;
                sk.setAnimation(0, "animation", false);
            } else {
                console.log("[BB] qiepai spine 未就绪, 本次跳过洗牌画面");
            }
            // 1.6 秒: spine 播完直接收起, 不再显示那张静止牌背
            this.scheduleOnce(function () {
                if (!cc.isValid(self.node)) return;
                if (cc.isValid(animNode)) animNode.destroy();
            }, 1.6);
            // 3 秒: 关闭, 开始发牌(逆向 3 秒自动关闭)
            this.scheduleOnce(function () {
                finish();
            }, 3.0);
        } catch (e) {
            console.error("[BB] 洗牌动画异常, 直接继续发牌", e);
            finish();
        }
    },

    // 头像中心的本地坐标
    _avatarLocalPos: function (off) {
        var sn = this._seatNodes[this._layoutOf(this._total || 2)[off]];
        var icon = sn && (sn.icon || sn.root);
        if (!icon || !cc.isValid(icon)) return null;
        return this.node.convertToNodeSpaceAR(icon.convertToWorldSpaceAR(cc.v2(0, 0)));
    },

    // 全屏特效(开局/打枪/中枪/全垒打)必须播在屏幕正中心(逆向 SetAnchorLocalPos("Center",0,0)),
    // 不能取所有头像的平均位置, 否则会偏到牌桌一角
    _tableCenter: function () {
        var vs = cc.view.getVisibleSize();
        var world = cc.v2(vs.width / 2, vs.height / 2);
        return this.node.convertToNodeSpaceAR(world);
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

    // 图五: 查看规则弹窗
    onRuleOpen: function () {
        if (!this._n.ruleWin) return;
        var nm = cc.vv.gameNetMgr, conf = nm.conf || {};
        var tr = conf.taiRules;
        if (tr != null && typeof tr === "string") { try { tr = JSON.parse(tr); } catch (e) { tr = null; } }
        var base = (tr && (tr.base_score || tr.baseScore)) != null ? (tr.base_score || tr.baseScore)
            : (conf.baseScore != null ? conf.baseScore : (conf.base_score != null ? conf.base_score : (conf.base || "-")));
        var cost = conf.cost != null ? conf.cost : (conf.fangka != null ? conf.fangka : "-");
        // 静态文案都在场景节点里, 这里只填房卡消耗/局数/底分三个动态值
        this.setStr(this._n.ruleCost, "房卡消耗:" + cost);
        this.setStr(this._n.ruleGames, "局数:" + (nm.maxNumOfGames || "-") + "局  2人即可开始");
        this.setStr(this._n.ruleBase, "底分:" + base);
        this._n.ruleWin.active = true;
        if (this._n.ruleWin.parent) this._n.ruleWin.setSiblingIndex(this._n.ruleWin.parent.children.length - 1);
    },
    onRuleClose: function () {
        if (this._n.ruleWin) this._n.ruleWin.active = false;
    },

    // 图四: 换桌 = 退出当前房间回大厅(未开局才可换)
    onChangeDesk: function () {
        if (this._started) { this.showTip("牌局已开始，无法换桌"); return; }
        this.showTip("正在换桌…");
        cc.vv.net.send("exit");
        var self = this;
        if (!this._exitTimer) {
            this._exitTimer = setTimeout(function () {
                self._exitTimer = null;
                if (!cc.isValid(self.node) || self._leaving) return;
                if (cc.vv.gameNetMgr && cc.vv.gameNetMgr.clearRoomState) cc.vv.gameNetMgr.clearRoomState();
                self.leaveRoom();
            }, 500);
        }
    },

    // 图二/图七: 分享战绩(复用大厅分享通道)
    onShareResult: function () {
        // 结算弹窗分享: 复制APP链接, 好友点开链接即可拉起/下载APP(与大厅分享一致)
        if (cc.vv && cc.vv.anysdkMgr && cc.vv.anysdkMgr.copyShareLink) {
            var ok = cc.vv.anysdkMgr.copyShareLink();
            this.showTip(ok ? "链接已复制，粘贴发送给好友，点开链接即可进入游戏" : "链接复制失败，请稍后重试");
            return;
        }
        this.showTip("分享功能暂未开放");
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
        //统一回牌桌大厅(该俱乐部玩法/牌桌列表页),不再按来源回系统大厅
        if (nm && nm.exitToTableHall) { nm.exitToTableHall(); }
        else if (cc.vv.sceneMgr) { cc.vv.sceneMgr.load("club"); } else { cc.director.loadScene("club"); }
    },

    showTip: function (msg) {
        this.setStr(this._n.tipLabel, msg || "");
    }
});
