// 各对局场景共用的表情逻辑：资源加载、面板绑定、协议解析和头像动画。
// 玩法脚本只负责提供 userId -> 头像节点 的适配，不复制座位布局和动画规则。
var NORMAL_NAMES = ["yihuo", "kuaidian", "zhenbang", "aini", "daxiao", "yunle",
    "yishoulanpai", "dengchang", "jingle", "huaixiao", "keshui", "886",
    "wolaile", "dalaozaici", "biepao"];
var INTERACT_NAMES = ["dianzan", "baoza1", "jidan1", "huaban1", "xin", "chuizi2", "dapao",
    "gongjian", "jiguanqiang", "e1004", "chuizi", "jidan", "huaban",
    "baoza", "zhuaji", "bingtong", "dong", "xi", "nan", "bei", "zhong",
    "ainio", "anzhongguancha", "dacuopaile", "emo", "haixiu", "kuaidianba",
    "shanyaodengchang", "tuoguan", "yiqifacai", "bixin", "bobo", "caishen",
    "fanqie", "hua", "huojian", "jubaopen", "pencaoqiang", "tiangou",
    "xinxin", "youting", "zhadan", "zhichi", "zhuoji"];

function findNode(root, name) {
    if (!root) return null;
    if (root.name === name) return root;
    var children = root.children || [];
    for (var i = 0; i < children.length; ++i) {
        var ret = findNode(children[i], name);
        if (ret) return ret;
    }
    return null;
}

function firstSpriteFrame(root) {
    if (!root) return null;
    var sprite = root.getComponent(cc.Sprite);
    if (sprite && sprite.spriteFrame) return sprite.spriteFrame;
    var children = root.children || [];
    for (var i = 0; i < children.length; ++i) {
        var frame = firstSpriteFrame(children[i]);
        if (frame) return frame;
    }
    return null;
}

function EmojiController(options) {
    this.options = options || {};
    this.canvas = this.options.canvas;
    this.chatPanel = this.options.chatPanel || null;
    this.chatEmojiList = this.options.chatEmojiList || null;
    this.userinfo = null;
    this.interactEmojiList = null;
    this._normalSpines = {};
    this._interactSpines = {};
    this._staticFrames = {};
    this._normalStatic = {};
    this._interactStatic = {};
    this._normalCells = [];
    this._interactGrid = null;
    this._xgdCell = null;
    this._xgdFrames = null;
    this._active = {};
    this._touchBinds = [];
    this._destroyed = false;
    this._resourcesReady = false;
    this._collectNormalStatic();
    this._buildNormalPanel();
    this._loadXgdFrames();
    this._loadStaticAtlas();
    this._loadSpines();
    if (this.options.userinfo) this.bindUserInfo(this.options.userinfo);
}

EmojiController.NORMAL_NAMES = NORMAL_NAMES.slice();
EmojiController.INTERACT_NAMES = INTERACT_NAMES.slice();

EmojiController.prototype._log = function (msg) {
    console.log("[" + (this.options.logTag || "Emoji") + "] " + msg);
};

EmojiController.prototype._selfId = function () {
    if (this.options.getSelfUserId) return this.options.getSelfUserId();
    return cc.vv && cc.vv.userMgr ? cc.vv.userMgr.userId : 0;
};

EmojiController.prototype._isReplay = function () {
    if (this.options.isReplay) return !!this.options.isReplay();
    return !!(cc.vv && cc.vv.replayMgr && cc.vv.replayMgr.isReplay && cc.vv.replayMgr.isReplay());
};

EmojiController.prototype._send = function (data) {
    if (this._isReplay()) return;
    var net = this.options.net || (cc.vv && cc.vv.net);
    if (net && net.send) net.send("emoji", data);
};

EmojiController.prototype._clickSound = function () {
    if (cc.vv && cc.vv.audioMgr) cc.vv.audioMgr.playSFX("btnClick.wav");
};

EmojiController.prototype._bindTouch = function (node, handler) {
    if (!node) return;
    node.on(cc.Node.EventType.TOUCH_END, handler, this);
    this._touchBinds.push({ node: node, handler: handler });
};

EmojiController.prototype._gridOf = function (panel) {
    if (!panel) return null;
    var named = findNode(panel, "New Layout");
    if (named) return named;
    if (panel.children && panel.children.length === 1 && panel.children[0].children.length > 0) {
        return panel.children[0];
    }
    return panel;
};

EmojiController.prototype._collectNormalStatic = function () {
    var grid = this._gridOf(this.chatEmojiList);
    if (!grid) return;
    var index = 0;
    var self = this;
    grid.children.forEach(function (cell) {
        if (cell.name === "xgd") return;
        var name = NORMAL_NAMES[index++];
        if (!name) return;
        var frame = firstSpriteFrame(cell);
        if (frame) self._normalStatic[name] = frame;
    });
};

// 聊天表情保留场景里的格子坐标和静态图；内容超出可视区域时，只补裁剪和纵向滚动。
EmojiController.prototype._setupNormalScroll = function (grid) {
    var panel = this.chatEmojiList;
    if (!panel || !grid || this._normalScroll || !(panel.height > 0)) return;
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    var index = 0;
    grid.children.forEach(function (cell) {
        if (cell.name !== "xgd" && index++ >= NORMAL_NAMES.length) return;
        var w = cell.width * Math.abs(cell.scaleX);
        var h = cell.height * Math.abs(cell.scaleY);
        minX = Math.min(minX, cell.x - w / 2);
        maxX = Math.max(maxX, cell.x + w / 2);
        minY = Math.min(minY, cell.y - h / 2);
        maxY = Math.max(maxY, cell.y + h / 2);
    });
    if (minX > maxX || minY > maxY) return;
    var contentHeight = maxY - minY + 40;
    if (contentHeight <= panel.height + 1) return;

    // 居中内容边界，同时反向移动容器，保证首屏仍停在场景原来的位置。
    var offsetX = (minX + maxX) / 2;
    var offsetY = (minY + maxY) / 2;
    grid.children.forEach(function (cell) { cell.setPosition(cell.x - offsetX, cell.y - offsetY); });
    grid.width = Math.max(panel.width, maxX - minX + 40);
    grid.height = contentHeight;
    grid.setPosition(grid.x + offsetX, grid.y + offsetY);

    var mask = panel.getComponent(cc.Mask) || panel.addComponent(cc.Mask);
    mask.type = cc.Mask.Type.RECT;
    mask.enabled = true;
    var scroll = panel.getComponent(cc.ScrollView) || panel.addComponent(cc.ScrollView);
    scroll.horizontal = false;
    scroll.vertical = true;
    scroll.inertia = true;
    scroll.cancelInnerEvents = true;
    scroll.content = grid;
    this._normalScroll = scroll;
};

EmojiController.prototype._buildNormalPanel = function () {
    var grid = this._gridOf(this.chatEmojiList);
    if (!grid || this._normalPanelBuilt) return;
    this._normalPanelBuilt = true;
    this._normalGrid = grid;
    this._setupNormalScroll(grid);
    var self = this;
    var index = 0;
    grid.children.slice().forEach(function (cell) {
        if (cell.name === "xgd") return;
        var name = NORMAL_NAMES[index++];
        var button = cell.getComponent(cc.Button);
        if (button) { button.clickEvents = []; button.enabled = false; }
        cell.off(cc.Node.EventType.TOUCH_END);
        if (!name) { cell.active = false; return; }
        cell.active = true;
        self._normalCells.push({ name: name, node: cell });
        self._bindTouch(cell, function () { self.sendNormal(name); });
    });
    var xgd = grid.getChildByName("xgd");
    if (xgd) {
        var xgdButton = xgd.getComponent(cc.Button);
        if (xgdButton) { xgdButton.clickEvents = []; xgdButton.enabled = false; }
        xgd.off(cc.Node.EventType.TOUCH_END);
        xgd.active = true;
        this._xgdCell = xgd;
        this._bindTouch(xgd, function () { self.sendNormal("xgd"); });
    }
    this._refreshNormalPreviews();
};

EmojiController.prototype._refreshNormalPreviews = function () {
    var self = this;
    this._normalCells.forEach(function (entry) {
        if (!cc.isValid(entry.node)) return;
        // 骨骼只用于发送后的头像动画；列表预览必须保持场景里的原始静态图。
        var old = entry.node.getChildByName("skel");
        if (old) old.destroy();
        var sprite = entry.node.getComponent(cc.Sprite);
        var frame = self._normalStatic[entry.name];
        if (sprite && frame) {
            sprite.enabled = true;
            sprite.spriteFrame = frame;
        }
    });
    if (this._xgdCell && this._xgdFrames && this._xgdFrames.length && cc.isValid(this._xgdCell)) {
        var xgdSprite = this._xgdCell.getComponent(cc.Sprite) || this._xgdCell.addComponent(cc.Sprite);
        xgdSprite.enabled = true;
        xgdSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        xgdSprite.spriteFrame = this._xgdFrames[0];
    }
};

EmojiController.prototype._loadSpines = function () {
    var self = this;
    var names = NORMAL_NAMES.concat(INTERACT_NAMES);
    function loadOne(index) {
        if (self._destroyed) return;
        if (index >= names.length) {
            self._resourcesReady = true;
            self._buildInteractPanel();
            self._log("普通骨骼=" + Object.keys(self._normalSpines).length +
                " 互动骨骼=" + Object.keys(self._interactSpines).length);
            return;
        }
        var name = names[index];
        var interact = index >= NORMAL_NAMES.length;
        cc.resources.load("anims/smile/" + name, sp.SkeletonData, function (err, sd) {
            if (self._destroyed) return;
            if (sd) {
                (interact ? self._interactSpines : self._normalSpines)[name] = sd;
                if (!interact) self._refreshNormalPreviews();
            } else {
                self._log("表情骨骼缺失: " + name);
            }
            loadOne(index + 1);
        });
    }
    loadOne(0);
};

EmojiController.prototype._loadStaticAtlas = function () {
    var self = this;
    cc.resources.load("images/chat/emoji_action_texture", cc.SpriteAtlas, function (err, atlas) {
        if (self._destroyed || !atlas) return;
        atlas.getSpriteFrames().forEach(function (frame) {
            self._staticFrames[frame.name] = frame;
            self._staticFrames[frame.name.replace(/\.png$/i, "")] = frame;
        });
    });
};

EmojiController.prototype._loadXgdFrames = function () {
    var self = this;
    cc.resources.load("anims/xgd/xgd", cc.SpriteAtlas, function (err, atlas) {
        if (self._destroyed || err || !atlas) return;
        var frames = [];
        for (var i = 1; i <= 6; ++i) {
            var frame = atlas.getSpriteFrame("xg" + i + ".png") || atlas.getSpriteFrame("xg" + i);
            if (!frame) break;
            frames.push(frame);
        }
        if (frames.length) {
            self._xgdFrames = frames;
            self._refreshNormalPreviews();
        }
    });
};

EmojiController.prototype.bindUserInfo = function (userinfo) {
    if (!userinfo) return;
    if (this.userinfo !== userinfo) {
        this.userinfo = userinfo;
        this.interactEmojiList = findNode(userinfo, "emojis");
        this._interactGrid = null;
    }
    if (!this.interactEmojiList) this.interactEmojiList = findNode(userinfo, "emojis");
    if (this.interactEmojiList && !this.interactEmojiList.getComponent(cc.BlockInputEvents)) {
        this.interactEmojiList.addComponent(cc.BlockInputEvents);
    }
    if (this.interactEmojiList) this.interactEmojiList.setSiblingIndex(userinfo.children.length - 1);
    this._buildInteractPanel();
};

EmojiController.prototype._buildInteractPanel = function () {
    var grid = this._gridOf(this.interactEmojiList);
    if (!grid || this._interactGrid === grid) return;
    this._interactGrid = grid;
    var self = this;
    grid.children.forEach(function (cell) {
        var button = cell.getComponent(cc.Button);
        if (button) { button.clickEvents = []; button.enabled = false; }
        cell.off(cc.Node.EventType.TOUCH_END);
        var valid = INTERACT_NAMES.indexOf(cell.name) >= 0;
        cell.active = valid;
        if (!valid) return;
        var frame = firstSpriteFrame(cell);
        if (frame) self._interactStatic[cell.name] = frame;
        self._bindTouch(cell, function () {
            var uid = self.options.getInteractTarget ? self.options.getInteractTarget() : 0;
            self.sendInteract(cell.name, uid);
        });
    });
    var selfClose = function () { self._closeUserInfo(); };
    var close = findNode(this.userinfo, "closeBtn");
    var x = findNode(this.userinfo, "x");
    if (close) this._bindTouch(close, selfClose);
    if (x && x !== close) this._bindTouch(x, selfClose);
    this._log("互动表情格子=" + grid.children.filter(function (c) { return INTERACT_NAMES.indexOf(c.name) >= 0; }).length);
};

EmojiController.prototype._closeUserInfo = function () {
    if (this.options.closeUserInfo) this.options.closeUserInfo();
    else if (this.userinfo) this.userinfo.active = false;
};

EmojiController.prototype.sendNormal = function (name) {
    if (name !== "xgd" && NORMAL_NAMES.indexOf(name) < 0) return;
    this._clickSound();
    if (this.options.closeChat) this.options.closeChat();
    else if (this.chatPanel) this.chatPanel.active = false;
    var uid = this._selfId();
    this.showNormal(uid, name);
    this._send({ name: name, free: true });
};

EmojiController.prototype.sendInteract = function (name, userId) {
    if (INTERACT_NAMES.indexOf(name) < 0 || !(Number(userId) > 0)) return;
    this._clickSound();
    this.playInteract(userId, name);
    this._send({ name: name, free: false, target: Number(userId) });
    this._closeUserInfo();
};

EmojiController.prototype.handlePush = function (data) {
    data = data && data.detail ? data.detail : data;
    if (!data) return;
    var sender = data.sender;
    var selfId = this._selfId();
    if (sender != null && selfId != null && Number(sender) === Number(selfId)) return;
    var content = data.content;
    var object = null;
    if (content && typeof content === "object") object = content;
    else if (typeof content === "string" && content.charAt(0) === "{") {
        try { object = JSON.parse(content); } catch (e) { object = null; }
    }
    var name = object && object.name != null ? object.name : content;
    if (name == null || name === "") return;
    name = String(name).replace(/\.png$/i, "");
    var free = data.free;
    if (object && object.free != null) free = object.free;
    if (free == null) free = name === "xgd" || NORMAL_NAMES.indexOf(name) >= 0;
    var target = data.target || (object && object.target) || sender;
    if (!free && INTERACT_NAMES.indexOf(name) >= 0) this.playInteract(target, name);
    else this.showNormal(target, name);
};

EmojiController.prototype._resolve = function (userId) {
    if (!(Number(userId) > 0) || !this.options.resolveAvatar || !this.canvas) return null;
    var target = this.options.resolveAvatar(Number(userId));
    if (!target || !target.icon || !cc.isValid(target.icon) || !target.icon.activeInHierarchy) return null;
    target.userId = Number(userId);
    target.key = target.key != null ? String(target.key) : String(userId);
    return target;
};

EmojiController.prototype._spineSize = function (sd) {
    var skeleton = sd && sd.skeletonJson && sd.skeletonJson.skeleton;
    return { w: (skeleton && skeleton.width) || 240, h: (skeleton && skeleton.height) || 270 };
};

EmojiController.prototype._firstAnimName = function (sd) {
    var json = sd && sd.skeletonJson;
    var keys = json && json.animations ? Object.keys(json.animations) : [];
    if (keys.indexOf("animation") >= 0) return "animation";
    return keys.length ? keys[0] : "animation";
};

EmojiController.prototype._spineBounds = function (sd) {
    if (!sd) return { minX: -120, minY: 0, maxX: 120, maxY: 270 };
    if (sd.__emojiBounds) return sd.__emojiBounds;
    var size = this._spineSize(sd);
    var fallback = { minX: -size.w / 2, minY: 0, maxX: size.w / 2, maxY: size.h };
    var json = sd.skeletonJson;
    if (!json || !json.bones || !json.slots) { sd.__emojiBounds = fallback; return fallback; }
    var byName = {}, cache = {};
    json.bones.forEach(function (bone) { byName[bone.name] = bone; });
    function world(name) {
        if (cache[name]) return cache[name];
        var bone = byName[name];
        if (!bone) return (cache[name] = { x: 0, y: 0, rot: 0 });
        var px = bone.x || 0, py = bone.y || 0, rotation = bone.rotation || 0;
        var parent = bone.parent ? world(bone.parent) : { x: 0, y: 0, rot: 0 };
        var rad = parent.rot * Math.PI / 180;
        return (cache[name] = {
            x: parent.x + px * Math.cos(rad) - py * Math.sin(rad),
            y: parent.y + px * Math.sin(rad) + py * Math.cos(rad),
            rot: parent.rot + rotation
        });
    }
    function transform(boneName, x, y) {
        var bone = world(boneName), rad = bone.rot * Math.PI / 180;
        return { x: bone.x + x * Math.cos(rad) - y * Math.sin(rad),
            y: bone.y + x * Math.sin(rad) + y * Math.cos(rad) };
    }
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    function add(point) {
        minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y); maxY = Math.max(maxY, point.y);
    }
    var skins = json.skins || {};
    var def = skins["default"] || skins[Object.keys(skins)[0]] || {};
    json.slots.forEach(function (slot) {
        var skin = def[slot.name];
        var attachment = skin && skin[slot.attachment];
        if (!attachment) return;
        var vertices = attachment.vertices;
        if (!vertices) {
            if (attachment.width != null && attachment.height != null) {
                var w = attachment.width / 2 * (attachment.scaleX == null ? 1 : attachment.scaleX);
                var h = attachment.height / 2 * (attachment.scaleY == null ? 1 : attachment.scaleY);
                var rotation = ((world(slot.bone).rot || 0) + (attachment.rotation || 0)) * Math.PI / 180;
                var cx = attachment.x || 0, cy = attachment.y || 0;
                [[-w, -h], [w, -h], [w, h], [-w, h]].forEach(function (point) {
                    add(transform(slot.bone, cx + point[0] * Math.cos(rotation) - point[1] * Math.sin(rotation),
                        cy + point[0] * Math.sin(rotation) + point[1] * Math.cos(rotation)));
                });
            }
            return;
        }
        var i = 0;
        while (i < vertices.length) {
            var boneCount = vertices[i++];
            if (!(boneCount > 0 && boneCount <= 4)) {
                i -= 1;
                add(transform(slot.bone, vertices[i++], vertices[i++]));
                continue;
            }
            var sx = 0, sy = 0, totalWeight = 0;
            for (var k = 0; k < boneCount; ++k) {
                var boneIndex = vertices[i++], bx = vertices[i++], by = vertices[i++], weight = vertices[i++];
                var boneName = (json.bones[boneIndex] || {}).name;
                var point = transform(boneName, bx, by);
                sx += point.x * weight; sy += point.y * weight; totalWeight += weight;
            }
            if (totalWeight > 0) { sx /= totalWeight; sy /= totalWeight; }
            add({ x: sx, y: sy });
        }
    });
    var bounds = minX > maxX ? fallback : { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
    sd.__emojiBounds = bounds;
    return bounds;
};

EmojiController.prototype._screenBounds = function () {
    var size = cc.view.getVisibleSize(), origin = cc.view.getVisibleOrigin();
    var p0 = this.canvas.convertToNodeSpaceAR(cc.v2(origin.x, origin.y));
    var p1 = this.canvas.convertToNodeSpaceAR(cc.v2(origin.x + size.width, origin.y + size.height));
    return { minX: Math.min(p0.x, p1.x), maxX: Math.max(p0.x, p1.x),
        minY: Math.min(p0.y, p1.y), maxY: Math.max(p0.y, p1.y) };
};

EmojiController.prototype._spawnSpine = function (target, name, loop, oneShot, complete) {
    var sd = this._normalSpines[name] || this._interactSpines[name];
    if (!sd) return null;
    var icon = target.icon, size = this._spineSize(sd), bounds = this._spineBounds(sd);
    var rect = icon.getBoundingBoxToWorld();
    var width = rect.width > 0 ? rect.width : 120;
    var height = rect.height > 0 ? rect.height : width;
    var scale = width / size.w * 3.6;
    var screen = this._screenBounds();
    var boundW = (bounds.maxX - bounds.minX) * scale;
    var boundH = (bounds.maxY - bounds.minY) * scale;
    var fit = Math.min(1, (screen.maxX - screen.minX) * 0.98 / boundW,
        (screen.maxY - screen.minY) * 0.98 / boundH);
    if (fit < 1) { scale *= fit; boundW *= fit; boundH *= fit; }
    var node = new cc.Node("emoteSpine");
    node.parent = this.canvas;
    node.zIndex = 9999;
    node.setSiblingIndex(this.canvas.children.length - 1);
    var world = icon.convertToWorldSpaceAR(cc.v2(0, 0));
    var pos = this.canvas.convertToNodeSpaceAR(world);
    var artX = (bounds.minX + bounds.maxX) / 2 * scale;
    var artY = (bounds.minY + bounds.maxY) / 2 * scale;
    pos.x -= artX;
    if (target.topAligned) pos.y = pos.y + height / 2 - bounds.maxY * scale;
    else pos.y -= artY;
    var halfW = boundW / 2, halfH = boundH / 2;
    pos.x = Math.max(screen.minX + halfW, Math.min(screen.maxX - halfW, pos.x));
    pos.y = Math.max(screen.minY + halfH, Math.min(screen.maxY - halfH, pos.y));
    node.setPosition(pos);
    node.scale = scale;
    var skeleton = node.addComponent(sp.Skeleton);
    skeleton.skeletonData = sd;
    skeleton.setAnimation(0, this._firstAnimName(sd), oneShot ? false : !!loop);
    if (oneShot && skeleton.setCompleteListener) skeleton.setCompleteListener(complete);
    return node;
};

EmojiController.prototype._spawnFrames = function (target, frames, loop, singlePlay) {
    if (!frames || !frames.length) return null;
    var icon = target.icon;
    var firstSize = frames[0].getOriginalSize();
    if (!(firstSize.width > 0)) return null;
    var rect = icon.getBoundingBoxToWorld();
    var width = rect.width > 0 ? rect.width : 120;
    var height = rect.height > 0 ? rect.height : width;
    var scale = width / firstSize.width * 3.6;
    var maxW = 0, maxH = 0;
    frames.forEach(function (frame) {
        var size = frame.getOriginalSize();
        maxW = Math.max(maxW, size.width); maxH = Math.max(maxH, size.height);
    });
    var screen = this._screenBounds();
    var boundW = maxW * scale, boundH = maxH * scale;
    var fit = Math.min(1, (screen.maxX - screen.minX) * 0.98 / boundW,
        (screen.maxY - screen.minY) * 0.98 / boundH);
    if (fit < 1) { scale *= fit; boundW *= fit; boundH *= fit; }
    var node = new cc.Node(frames.length > 1 ? "emoteAnim" : "emoteStatic");
    node.parent = this.canvas;
    node.zIndex = 9999;
    node.setSiblingIndex(this.canvas.children.length - 1);
    var sprite = node.addComponent(cc.Sprite);
    sprite.sizeMode = cc.Sprite.SizeMode.RAW;
    sprite.spriteFrame = frames[0];
    var world = icon.convertToWorldSpaceAR(cc.v2(0, 0));
    var pos = this.canvas.convertToNodeSpaceAR(world);
    if (target.topAligned) pos.y = pos.y + height / 2 - boundH / 2;
    var halfW = boundW / 2, halfH = boundH / 2;
    pos.x = Math.max(screen.minX + halfW, Math.min(screen.maxX - halfW, pos.x));
    pos.y = Math.max(screen.minY + halfH, Math.min(screen.maxY - halfH, pos.y));
    node.scale = scale;
    node.setPosition(pos);
    if (frames.length > 1) {
        var index = 0;
        var step = function () {
            if (!cc.isValid(node)) return;
            sprite.spriteFrame = frames[index % frames.length];
            index++;
        };
        step();
        var tick = cc.sequence(cc.delayTime(0.22), cc.callFunc(step));
        if (loop) node.runAction(cc.repeatForever(tick));
        else if (singlePlay) node.runAction(cc.sequence(cc.repeat(tick, frames.length), cc.callFunc(function () {
            if (cc.isValid(node)) node.destroy();
        })));
    }
    return node;
};

EmojiController.prototype._staticFrame = function (name) {
    var base = name === "smile" ? "smaile" : name;
    return this._normalStatic[name] || this._interactStatic[name] || this._staticFrames[name] ||
        this._staticFrames[name + ".png"] || this._staticFrames[base + "0.png"] ||
        this._staticFrames[base + "0"] || this._staticFrames[base] || null;
};

EmojiController.prototype._bounce = function (node) {
    var scale = node.scale;
    node.runAction(cc.sequence(cc.scaleTo(0.12, scale * 1.4), cc.scaleTo(0.18, scale)));
};

EmojiController.prototype._clearRecord = function (key) {
    var record = this._active[key];
    if (!record) return;
    if (record.timer) clearTimeout(record.timer);
    if (record.node && cc.isValid(record.node)) {
        record.node.stopAllActions();
        record.node.destroy();
    }
    delete this._active[key];
};

EmojiController.prototype.clear = function (userId) {
    var uid = Number(userId), self = this;
    Object.keys(this._active).forEach(function (key) {
        if (self._active[key].userId === uid) self._clearRecord(key);
    });
};

EmojiController.prototype._track = function (target, node, duration) {
    if (!node) return;
    var self = this, key = target.key;
    this._clearRecord(key);
    var record = { userId: target.userId, node: node, timer: null };
    this._active[key] = record;
    if (duration > 0) {
        record.timer = setTimeout(function () {
            if (self._active[key] === record) self._clearRecord(key);
        }, duration);
    }
};

EmojiController.prototype.showNormal = function (userId, name) {
    var target = this._resolve(userId);
    if (!target) return;
    this.clear(userId);
    var node = name === "xgd" ? this._spawnFrames(target, this._xgdFrames, true, false) :
        this._spawnSpine(target, name, true, false, null);
    if (!node) {
        var frame = this._staticFrame(name);
        if (frame) node = this._spawnFrames(target, [frame], false, false);
    }
    if (!node) return;
    this._bounce(node);
    this._track(target, node, 2000);
};

EmojiController.prototype.playInteract = function (userId, name) {
    var target = this._resolve(userId);
    if (!target) return;
    this.clear(userId);
    var self = this;
    var node = this._spawnSpine(target, name, false, true, function () {
        var record = self._active[target.key];
        if (record && record.node === node) self._clearRecord(target.key);
    });
    if (!node) {
        var frame = this._staticFrame(name);
        if (frame) node = this._spawnFrames(target, [frame], false, false);
    }
    if (!node) return;
    this._track(target, node, 4000);
};

EmojiController.prototype.destroy = function () {
    this._destroyed = true;
    var self = this;
    Object.keys(this._active).forEach(function (key) { self._clearRecord(key); });
    this._touchBinds.forEach(function (bind) {
        if (cc.isValid(bind.node)) bind.node.off(cc.Node.EventType.TOUCH_END, bind.handler, self);
    });
    this._touchBinds = [];
};

module.exports = EmojiController;
