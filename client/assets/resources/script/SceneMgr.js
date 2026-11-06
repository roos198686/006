// SceneMgr.js —— 统一场景切换管理:
//   1. 预加载所有场景(preloadScene),首次 loadScene 不再卡壳
//   2. 直接切换场景,不加任何黑幕/淡入淡出过渡
//
// 使用:
//   var SceneMgr = require("SceneMgr");
//   cc.vv.sceneMgr = new SceneMgr();
//   cc.vv.sceneMgr.init();
//   cc.vv.sceneMgr.load("hall", onLaunched);

cc.Class({
    extends: cc.Component,

    ctor: function () {
        this.SCENE_LIST = ["login", "loading", "hall", "club", "mjgame_bb_mian", "mjgame_bb_shou", "mjgame",
            "mjgame_ldh", "mjgame_bmj", "mjgame_zjlao", "mjgame_zjzx", "mjgame_zjzx4",
            "mjgame_zp", "mjgame_zp4", "mjgame_wujin", "mjgame_gp2", "mjgame_gp3"];
        this._preloaded = {};
        this._isTransitioning = false;
    },

    init: function () {
        var self = this;
        var remaining = this.SCENE_LIST.slice();
        var inFlight = 0;
        var MAX_FLIGHT = 3;
        var doNext = function () {
            if (remaining.length === 0) return;
            if (inFlight >= MAX_FLIGHT) return;
            var name = remaining.shift();
            inFlight++;
            try {
                cc.director.preloadScene(name, null, function (err) {
                    inFlight--;
                    if (!err) {
                        self._preloaded[name] = true;
                    } else {
                        console.warn("[SceneMgr] preloadScene(" + name + ") err:", err);
                    }
                    doNext();
                });
            } catch (e) {
                inFlight--;
                console.warn("[SceneMgr] preloadScene(" + name + ") exc:", e.message);
                doNext();
            }
            doNext();
        };
        doNext();
    },

    load: function (sceneName, onLaunched, opts) {
        opts = opts || {};
        if (this._isTransitioning) {
            console.warn("[SceneMgr] 已有切换在进行,忽略重复切场景:", sceneName);
            return false;
        }
        if (!sceneName) {
            console.warn("[SceneMgr] load: sceneName empty");
            return false;
        }
        var cur = cc.director.getScene();
        var curName = cur ? cur.name : "";
        if (curName === sceneName && !opts.force) {
            console.log("[SceneMgr] 已经在 " + sceneName + ", 跳过");
            if (onLaunched) onLaunched();
            return true;
        }
        this._isTransitioning = true;
        var self = this;
        var cb = function () {
            if (onLaunched) {
                try { onLaunched(); } catch (e) { console.warn("[SceneMgr] onLaunched err:", e.message); }
            }
            self._isTransitioning = false;
        };
        var ok = false;
        try {
            ok = cc.director.loadScene(sceneName, cb);
        } catch (e) {
            console.warn("[SceneMgr] loadScene(" + sceneName + ") exc:", e.message);
            self._isTransitioning = false;
        }
        if (ok === false) {
            console.warn("[SceneMgr] loadScene(" + sceneName + ") returned false (scene not imported?)");
            self._isTransitioning = false;
        }
        return true;
    },
});
