// 麻将房间内个性化:切换桌面背景(绿色/蓝色/深棕) + 牌面滑杆放大(100%~150%), 选择存localStorage
var BG_KEY = "mj_table_bg";
var SCALE_KEY = "mj_card_scale_v2";
// ===== 出牌手势设置(客户端房间设置, 与后台无关) =====
// 手势多选: 麻将+扑克共用(水平滑动选中多张牌)
var GESTURE_MULTI_SELECT_KEY = "gesture_multi_select";
// 手势上滑出牌: 仅麻将(向上滑动手牌直接出牌)
var MJ_GESTURE_SWIPE_UP_KEY = "mj_gesture_swipe_up";
// 出牌点击方式: 仅麻将, "single"=单击出牌, "double"=双击出牌(二选一)
var MJ_PLAY_MODE_KEY = "mj_play_mode";
// 桌面背景: 图片直接摆在场景弹窗 Canvas/popups/bg_choose/panel/itemN/preview 上,
// 点哪个item就把哪个preview的spriteFrame换到桌面背景, 代码里不维护图片列表、不动态加载.
// 牌面缩放范围: 滑杆progress 0~1 映射 1.0~1.25
var SCALE_MIN = 1.0, SCALE_MAX = 1.25;

function loadJson(key, def) {
    try {
        var s = cc.sys.localStorage.getItem(key);
        if (s == null || s === "") { return def; }
        return JSON.parse(s);
    } catch (e) { return def; }
}

function saveJson(key, v) {
    try { cc.sys.localStorage.setItem(key, JSON.stringify(v)); } catch (e) { }
}

function addClick(node, target, comp, handler, custom) {
    var btn = node.getComponent(cc.Button) || node.addComponent(cc.Button);
    btn.transition = cc.Button.Transition.SCALE;
    btn.duration = 0.1;
    btn.zoomScale = 0.95;
    var ev = new cc.Component.EventHandler();
    ev.target = target;
    ev.component = comp;
    ev.handler = handler;
    ev.customEventData = custom || "";
    btn.clickEvents.push(ev);
    return btn;
}

cc.Class({
    extends: cc.Component,

    properties: {
        _bgIndex: 0,        // 0=默认(场景原图) 1..3=BG_LIST
        _cardScale: 1,      // 牌面缩放倍率(SCALE_MIN~SCALE_MAX)
        _bgSpr: null,       // Canvas/bg/Z_backgroud 的Sprite
        _panel: null,       // 背景选择弹窗根节点
        _scaleLabel: null,  // 设置面板里"牌面大小"百分比Label
        _bgNameLabel: null, // 设置面板里"桌面背景"当前值Label
        _slider: null,      // 牌面大小滑杆
        _baseScales: null,  // 放大模式基准缩放缓存 {node:base}
        // ===== 出牌手势设置 =====
        _gestureMultiSelect: false, // 手势多选(麻将+扑克)
        _gestureSwipeUp: false,     // 手势上滑出牌(仅麻将)
        _mjPlayMode: "single",      // 单击/双击出牌(仅麻将,二选一)
    },

    onLoad: function () {
        if (cc.vv == null) { return; }
        cc.vv.deskStyle = this;
        this._bgIndex = loadJson(BG_KEY, 0);
        this._cardScale = loadJson(SCALE_KEY, 1);
        if (typeof this._cardScale !== "number" || this._cardScale < SCALE_MIN || this._cardScale > SCALE_MAX) {
            //旧存档可能超出新上限(如1.5),钳到边界而不是重置回100%
            this._cardScale = (typeof this._cardScale === "number") ? Math.min(SCALE_MAX, Math.max(SCALE_MIN, this._cardScale)) : 1;
        }
        // 出牌手势设置
        this._gestureMultiSelect = !!loadJson(GESTURE_MULTI_SELECT_KEY, false);
        this._gestureSwipeUp = !!loadJson(MJ_GESTURE_SWIPE_UP_KEY, false);
        var pm = loadJson(MJ_PLAY_MODE_KEY, "single");
        this._mjPlayMode = (pm === "double") ? "double" : "single";
        var bgRoot = cc.find("Canvas/bg");
        if (bgRoot && bgRoot.children.length > 0) {
            this._bgSpr = bgRoot.children[0].getComponent(cc.Sprite);
            if (this._bgSpr) { this._defaultFrame = this._bgSpr.spriteFrame; } //场景原始背景帧(默认项)
        }
        // 等resources里的白图就绪后再应用(白图用于着色背景)
        var self = this;
        cc.resources.load("images/ui/white", cc.SpriteFrame, function (err, frame) {
            if (!err && frame) {
                self._whiteFrame = frame;
                self._applyBg();
            }
        });
        // 绑定场景里摆好的背景选择弹窗并应用上次选择(图片都在场景上, 无需加载)
        this._tryBindScenePanel();
        this._applyBg();
        // 绑定设置面板:桌面背景按钮文字 + 牌面大小滑杆
        var bgBtn = cc.find("Canvas/popups/settings/btn_desk_bg");
        var bgLab = bgBtn ? bgBtn.getChildByName("lbl_desk_bg") : null;
        this._bgNameLabel = bgLab ? bgLab.getComponent(cc.Label) : null;

        var sliderNode = cc.find("Canvas/popups/settings/card_scale/slider");
        if (sliderNode) {
            this._slider = sliderNode.getComponent(cc.Slider);
            var vLab = sliderNode.parent ? sliderNode.parent.getChildByName("lbl_card_scale") : null;
            this._scaleLabel = vLab ? vLab.getComponent(cc.Label) : null;
            if (this._slider) {
                // 场景里 slider 的 handle 引用损坏(handle组件在但node丢失), _updateHandlePosition 访问 handle.node.parent 必抛异常;
                // 该异常不只打断 onLoad: 每次打开设置面板 Slider.onEnable 都会抛, 且发生在触摸事件(TOUCH_END>Button click)分发栈里,
                // 会炸断引擎事件分发循环, 导致之后手牌触摸全部失灵("点过设置就打不出牌")
                // 根治: handle 引用损坏时运行时重建 Handle 节点并重新绑定, 既防异常又恢复滑杆拖动(全场景生效, 不动场景文件)
                if (this._slider.handle && !this._slider.handle.node) {
                    console.warn('[DeskStyle] slider handle 引用损坏, 运行时重建');
                    var handleNode = sliderNode.getChildByName("Handle") || sliderNode.getChildByName("handle");
                    if (!handleNode) {
                        handleNode = new cc.Node("Handle");
                        sliderNode.addChild(handleNode);
                        handleNode.setContentSize(44, 44);
                        var hsp = handleNode.addComponent(cc.Sprite);
                        hsp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                        if (this._whiteFrame) { hsp.spriteFrame = this._whiteFrame; }
                        handleNode.color = cc.color(255, 214, 90); //金色圆点,与麻将桌风格一致
                    }
                    var hBtn = handleNode.getComponent(cc.Button);
                    if (!hBtn) { hBtn = handleNode.addComponent(cc.Button); }
                    this._slider.handle = hBtn;
                }
                try {
                    this._slider.progress = (this._cardScale - SCALE_MIN) / (SCALE_MAX - SCALE_MIN);
                } catch (e) {
                    console.warn('[DeskStyle] slider progress 设置失败, 跳过: ' + e.message);
                }
                var ev = new cc.Component.EventHandler();
                ev.target = this.node;
                ev.component = "DeskStyle";
                ev.handler = "onCardScaleSlide";
                this._slider.slideEvents.push(ev);
            }
        }
        this._buildGestureSettings();
        this._syncSettingLabels();
        // 牌面放大需要等牌局UI初始化后执行, 延迟一拍
        this.scheduleOnce(function () { self._applyCardScale(); }, 0);
    },

    // 滑杆拖动回调: progress 0~1 -> 倍率 SCALE_MIN~SCALE_MAX
    onCardScaleSlide: function (slider) {
        this._cardScale = SCALE_MIN + slider.progress * (SCALE_MAX - SCALE_MIN);
        saveJson(SCALE_KEY, Math.round(this._cardScale * 100) / 100);
        this._applyCardScale();
        this._syncSettingLabels();
    },

    // ===== 出牌手势设置 UI =====
    // 控件已固化在场景: Canvas/popups/settings/gesture_section 下按名字绑定, 位置/样式在场景里调
    // 场景需提供(名字必须一致): gesture_multi(check子节点) / gesture_swipe(check) / play_single(inner) / play_double(inner)
    _buildGestureSettings: function () {
        var settings = cc.find("Canvas/popups/settings");
        if (!settings) { return; }
        var section = settings.getChildByName("gesture_section");
        if (!section) {
            console.warn("[DeskStyle] 场景缺少 settings/gesture_section, 出牌手势设置不可用(请在场景中补节点)");
            return;
        }
        this._bindGestureItem(section, "gesture_multi", "onToggleMultiSelect");
        this._bindGestureItem(section, "gesture_swipe", "onToggleSwipeUp");
        this._bindGestureItem(section, "play_single", "onPickPlayMode", "single");
        this._bindGestureItem(section, "play_double", "onPickPlayMode", "double");
        this._refreshGestureUI();
    },

    // 绑定一个手势设置项的点击(场景节点无Button组件时自动补挂)
    _bindGestureItem: function (section, name, handler, custom) {
        var node = section.getChildByName(name);
        if (!node) {
            console.warn("[DeskStyle] gesture_section 缺少子节点: " + name);
            return;
        }
        addClick(node, this.node, "DeskStyle", handler, custom);
    },

    // 手势多选开关
    onToggleMultiSelect: function () {
        this._gestureMultiSelect = !this._gestureMultiSelect;
        saveJson(GESTURE_MULTI_SELECT_KEY, this._gestureMultiSelect);
        this._refreshGestureUI();
    },

    // 上滑出牌开关
    onToggleSwipeUp: function () {
        this._gestureSwipeUp = !this._gestureSwipeUp;
        saveJson(MJ_GESTURE_SWIPE_UP_KEY, this._gestureSwipeUp);
        this._refreshGestureUI();
    },

    // 单击/双击出牌单选
    onPickPlayMode: function (event, custom) {
        this._mjPlayMode = (custom === "double") ? "double" : "single";
        saveJson(MJ_PLAY_MODE_KEY, this._mjPlayMode);
        this._refreshGestureUI();
    },

    // 刷新手势设置控件的选中状态
    _refreshGestureUI: function () {
        var settings = cc.find("Canvas/popups/settings");
        if (!settings) { return; }
        var section = settings.getChildByName("gesture_section");
        if (!section) { return; }
        var ms = section.getChildByName("gesture_multi");
        if (ms) { var mc = ms.getChildByName("check"); if (mc) mc.active = this._gestureMultiSelect; }
        var su = section.getChildByName("gesture_swipe");
        if (su) { var sc = su.getChildByName("check"); if (sc) sc.active = this._gestureSwipeUp; }
        var ps = section.getChildByName("play_single");
        if (ps) { var pi = ps.getChildByName("inner"); if (pi) pi.active = this._mjPlayMode === "single"; }
        var pd = section.getChildByName("play_double");
        if (pd) { var di = pd.getChildByName("inner"); if (di) di.active = this._mjPlayMode === "double"; }
    },

    // ===== 对外: 获取手势设置(供 MJGame / GPGame 调用) =====
    getGestureSettings: function () {
        return {
            multiSelect: this._gestureMultiSelect,
            swipeUp: this._gestureSwipeUp,
            playMode: this._mjPlayMode // "single" | "double"
        };
    },

    // ===== 对外:设置面板调用 =====
    // 绑定场景里固化的"切换桌面背景"弹窗(Canvas/popups/bg_choose).
    // 场景摆好 mask/panel/title/item0..itemN(每个item的preview上就是背景图)/btn_default,
    // 这里只做点击绑定与显隐/换图, 不创建节点、不维护图片列表.
    // 按名字 item0..itemN 收集场景里摆好的选项(下标=数字后缀)
    _getItems: function (panel) {
        var items = [];
        if (!panel) { return items; }
        for (var i = 0; i < panel.childrenCount; ++i) {
            var c = panel.children[i];
            var m = /^item(\d+)$/.exec(c.name);
            if (m) { items[parseInt(m[1], 10)] = c; }
        }
        return items;
    },

    _tryBindScenePanel: function () {
        if (this._panel) { return; }
        var root = cc.find("Canvas/popups/bg_choose");
        if (!root) { return; }
        this._panel = root;
        var mask = root.getChildByName("mask");
        if (mask) { addClick(mask, this.node, "DeskStyle", "_onMaskClick"); }
        // 场景 bg_choose 下新增的 noSprite: 点它也关闭弹窗
        var noSprite = root.getChildByName("noSprite");
        if (noSprite) { addClick(noSprite, this.node, "DeskStyle", "_onMaskClick"); }
        var panel = root.getChildByName("panel");
        if (panel) {
            var items = this._getItems(panel);
            for (var i = 0; i < items.length; ++i) {
                if (items[i]) { addClick(items[i], this.node, "DeskStyle", "_onPickBg", String(i + 1)); }
            }
            var defBtn = panel.getChildByName("btn_default");
            if (defBtn) { addClick(defBtn, this.node, "DeskStyle", "_onPickBg", "0"); }
        }
        root.active = false;
    },

    // "桌面背景"按钮:弹出选择窗
    openBgChoose: function () {
        if (!this._panel) { this._tryBindScenePanel(); }
        if (!this._panel) {
            console.warn("[DeskStyle] 场景缺少 Canvas/popups/bg_choose, 请在场景中摆好背景选择弹窗");
            return;
        }
        this._panel.active = true;
    },

    // ===== 背景 =====
    _applyBg: function () {
        if (!this._bgSpr) { return; }
        var idx = this._bgIndex;
        if (idx <= 0) {
            // 恢复默认: 场景原始背景帧
            if (this._defaultFrame) {
                this._bgSpr.spriteFrame = this._defaultFrame;
                this._bgSpr.node.color = cc.Color.WHITE;
            }
            return;
        }
        // 点哪个item, 就把哪个item里preview的图换到桌面背景上
        var panel = this._panel ? this._panel.getChildByName("panel") : null;
        var item = this._getItems(panel)[idx - 1];
        var preview = item ? item.getChildByName("preview") : null;
        var spr = preview ? preview.getComponent(cc.Sprite) : null;
        if (!spr || !spr.spriteFrame) { return; }
        this._bgSpr.spriteFrame = spr.spriteFrame;
        this._bgSpr.node.color = cc.Color.WHITE;
    },

    // ===== 牌面放大 =====
    // 只放大自己一侧的手牌/副露/弃牌容器(放大是为看清自己的牌, 对家/上家/下家的牌不放大)
    _applyCardScale: function () {
        var k = this._cardScale;
        var game = cc.find("Canvas/game");
        if (!game) { return; }
        if (!this._baseScales) { this._baseScales = new Map(); }
        var self = this;
        var sides = ["myself"];
        var subs = ["holds", "penggangs", "folds", "ChuPai", "hupailist"];
        for (var i = 0; i < sides.length; ++i) {
            var sideRoot = game.getChildByName(sides[i]);
            if (!sideRoot) { continue; }
            for (var j = 0; j < subs.length; ++j) {
                var sub = sideRoot.getChildByName(subs[j]);
                if (!sub) { continue; }
                var base = self._baseScales.get(sub.uuid);
                if (base == null) {
                    base = sub.scaleX; // 基准=首次进入时场景/代码设定的缩放(含窄屏适配)
                    self._baseScales.set(sub.uuid, base);
                }
                sub.scaleX = base * k;
                sub.scaleY = base * k;
            }
        }
        //吃碰杠胡操作区跟随牌面放大(减半跟随:牌面1.5倍时按钮只到1.25倍,避免按钮过大)
        var ops = game.getChildByName("ops");
        if (ops) {
            var opsBase = self._baseScales.get(ops.uuid);
            if (opsBase == null) {
                opsBase = ops.scaleX;
                self._baseScales.set(ops.uuid, opsBase);
            }
            var opsK = 1 + (k - 1) * 0.5;
            ops.scaleX = opsBase * opsK;
            ops.scaleY = opsBase * opsK;
        }
    },

    _onPickBg: function (event, custom) {
        this._bgIndex = parseInt(custom, 10) || 0;
        saveJson(BG_KEY, this._bgIndex);
        this._applyBg();
        this._syncSettingLabels();
        if (this._panel) { this._panel.active = false; }
    },

    _onMaskClick: function () {
        if (this._panel) { this._panel.active = false; }
    },

    // ===== 设置面板文字同步 =====
    _syncSettingLabels: function () {
        if (this._bgNameLabel) {
            var name = "默认";
            if (this._bgIndex > 0) {
                var panel = this._panel ? this._panel.getChildByName("panel") : null;
                var item = this._getItems(panel)[this._bgIndex - 1];
                var nameNode = item ? item.getChildByName("name") : null;
                var lab = nameNode ? nameNode.getComponent(cc.Label) : null;
                name = lab ? lab.string : ("背景" + this._bgIndex);
            }
            this._bgNameLabel.string = "桌面背景: " + name;
        }
        if (this._scaleLabel) {
            this._scaleLabel.string = Math.round(this._cardScale * 100) + "%";
        }
    },
});
