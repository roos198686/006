window.boot = function () {
    var settings = window._CCSettings;
    window._CCSettings = undefined;
    var onProgress = null;
    
    var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
    var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
    var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;
    function setLoadingDisplay () {
        // Loading splash scene
        var splash = document.getElementById('splash');
        var progressBar = splash.querySelector('.progress-bar span');
        onProgress = function (finish, total) {
            var percent = 100 * finish / total;
            if (progressBar) {
                progressBar.style.width = percent.toFixed(2) + '%';
            }
        };
        splash.style.display = 'block';
        progressBar.style.width = '0%';

        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
            splash.style.display = 'none';
        });
    }

    var onStart = function () {

        cc.view.enableRetina(true);
        cc.view.resizeWithBrowserSize(true);

        if (cc.sys.isBrowser) {
            setLoadingDisplay();
        }

        if (cc.sys.isMobile) {
            if (settings.orientation === 'landscape') {
                cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
            }
            else if (settings.orientation === 'portrait') {
                cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
            }
            cc.view.enableAutoFullScreen([
                cc.sys.BROWSER_TYPE_BAIDU,
                cc.sys.BROWSER_TYPE_BAIDU_APP,
                cc.sys.BROWSER_TYPE_WECHAT,
                cc.sys.BROWSER_TYPE_MOBILE_QQ,
                cc.sys.BROWSER_TYPE_MIUI,
                cc.sys.BROWSER_TYPE_HUAWEI,
                cc.sys.BROWSER_TYPE_UC,
            ].indexOf(cc.sys.browserType) < 0);
        }

        // Limit downloading max concurrent task to 2,
        // more tasks simultaneously may cause performance draw back on some android system / browsers.
        // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
        if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
            cc.assetManager.downloader.maxConcurrency = 2;
            cc.assetManager.downloader.maxRequestsPerFrame = 2;
        }

        var launchScene = settings.launchScene;
        var bundle = cc.assetManager.bundles.find(function (b) {
            return b.getSceneInfo(launchScene);
        });
        
        bundle.loadScene(launchScene, null, onProgress,
            function (err, scene) {
                if (!err) {
                    cc.director.runSceneImmediate(scene);
                    if (cc.sys.isBrowser) {
                        // show canvas
                        var canvas = document.getElementById('GameCanvas');
                        canvas.style.visibility = '';
                        var div = document.getElementById('GameDiv');
                        if (div) {
                            div.style.backgroundImage = '';
                        }
                        console.log('Success to load scene: ' + launchScene);
                    }
                }
            }
        );

    };

    var option = {
        id: 'GameCanvas',
        debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
        showFPS: settings.debug,
        frameRate: 60,
        groupList: settings.groupList,
        collisionMatrix: settings.collisionMatrix,
    };

    cc.assetManager.init({ 
        bundleVers: settings.bundleVers,
        remoteBundles: settings.remoteBundles,
        server: settings.server
    });
    
    var bundleRoot = [INTERNAL];
    settings.hasResourcesBundle && bundleRoot.push(RESOURCES);

    var count = 0;
    function cb (err) {
        if (err) return console.error(err.message, err.stack);
        count++;
        if (count === bundleRoot.length + 1) {
            cc.assetManager.loadBundle(MAIN, function (err) {
                if (!err) cc.game.run(option, onStart);
            });
        }
    }

    cc.assetManager.loadScript(settings.jsList.map(function (x) { return 'src/' + x;}), cb);

    for (var i = 0; i < bundleRoot.length; i++) {
        cc.assetManager.loadBundle(bundleRoot[i], cb);
    }
};

/* bobao_hotfix_boot */
if (window.jsb) {
    window.__bbResolveSrc = function (name, fallback) {
        try {
            var fu = jsb.fileUtils;
            var paths = fu.getSearchPaths() || [];
            var re = new RegExp("^src/" + name + "\\.[^/]+\\.jsc?$");
            for (var i = 0; i < paths.length; i++) {
                var dir = paths[i].replace(/\/+$/, "");
                var mf = dir + "/project.manifest";
                if (!fu.isFileExist(mf)) { continue; }
                var data = JSON.parse(fu.getStringFromFile(mf));
                var assets = (data && data.assets) || {};
                for (var k in assets) {
                    if (re.test(k) && fu.isFileExist(dir + "/" + k)) { return k.replace(/\.jsc$/, ".js"); }
                }
            }
        } catch (e) {}
        return fallback;
    };
}

/* bobao_hotupdate_boot */
if (window.jsb && window.localStorage) {
    try {
        var __hbRaw = localStorage.getItem("HotUpdateSearchPaths");
        if (__hbRaw) {
            var __hbObj = JSON.parse(__hbRaw);
            var __hbList = Array.isArray(__hbObj) ? __hbObj : (__hbObj && __hbObj.paths);
            if (__hbList && __hbList.length) {
                var __hbFu = jsb.fileUtils;
                var __hbVer = function (dirs) {
                    for (var __i = 0; __i < dirs.length; __i++) {
                        var __d = String(dirs[__i]).replace(/\/+$/, "");
                        var __mf = __d ? (__d + "/project.manifest") : "project.manifest";
                        if (!__hbFu.isFileExist(__mf)) { continue; }
                        try {
                            var __v = JSON.parse(__hbFu.getStringFromFile(__mf)).version;
                            if (__v) { return String(__v); }
                        } catch (__e) {}
                    }
                    return "";
                };
                var __hbCmp = function (a, b) {
                    var __x = String(a).split("."), __y = String(b).split(".");
                    var __n = Math.max(__x.length, __y.length);
                    for (var __i = 0; __i < __n; __i++) {
                        var __p = parseInt(__x[__i], 10) || 0;
                        var __q = parseInt(__y[__i], 10) || 0;
                        if (__p > __q) { return 1; }
                        if (__p < __q) { return -1; }
                    }
                    return 0;
                };
                var __hbApkVer = __hbVer(__hbFu.getSearchPaths() || []);
                var __hbHotVer = __hbVer(__hbList);
                if (__hbHotVer && (!__hbApkVer || __hbCmp(__hbHotVer, __hbApkVer) > 0)) {
                    __hbFu.setSearchPaths(__hbList);
                    window.__bbHotBootApplied = true;
                    window.__bbHotBootVersion = __hbHotVer;
                } else if (__hbHotVer) {
                    localStorage.removeItem("HotUpdateSearchPaths");
                    localStorage.removeItem("HotUpdateAppliedPaths");
                    localStorage.removeItem("HotUpdateBuildStamp");
                }
            }
        }
    } catch (__hbErr) {}
}
/* bobao_hotupdate_boot_end */

if (window.jsb) {
    var isRuntime = (typeof loadRuntime === 'function');
    if (isRuntime) {
        require(__bbResolveSrc('settings', 'src/settings.821cc.js'));
        require('src/cocos2d-runtime.js');
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require(__bbResolveSrc('physics', 'src/physics.10dc9.js'));
        }
        require('jsb-adapter/engine/index.js');
    }
    else {
        require(__bbResolveSrc('settings', 'src/settings.821cc.js'));
        require(__bbResolveSrc('cocos2d-jsb', 'src/cocos2d-jsb.8491d.js'));
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require(__bbResolveSrc('physics', 'src/physics.10dc9.js'));
        }
        require('jsb-adapter/jsb-engine.js');
    }

    cc.macro.CLEANUP_IMAGE_CACHE = true;
/* bobao_build_stamp */
try {
    var __bv = (window._CCSettings || {}).bundleVers || {};
    var __ks = [];
    for (var __k in __bv) { if (Object.prototype.hasOwnProperty.call(__bv, __k)) { __ks.push(__k + ":" + __bv[__k]); } }
    __ks.sort();
    window.__bbBuildStamp = __ks.join("|");
} catch (e) { window.__bbBuildStamp = ""; }
    window.boot();
}