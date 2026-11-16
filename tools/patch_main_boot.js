// 给构建产物打热更启动补丁(幂等, 可重复执行)
// 用法: node tools/patch_main_boot.js <构建目录>
//   node tools/patch_main_boot.js client/build/jsb-link
//   node tools/patch_main_boot.js client/build/jsb-default
//
// 为什么需要(一): main.js 里 require 的 src/settings.<hash>.js、cocos2d-jsb.<hash>.js、physics.<hash>.js
// 文件名带构建哈希, 每次构建都变。旧 APK 的 main.js 只认自己那套名字, 所以热更下载下来的新
// src 文件永远加载不到, 引擎仍按旧 settings 的 bundleVers 去加载旧 assets/main/index.<hash>.jsc。
// 这里把 require 改成: 先到热更搜索目录里读 project.manifest, 找到本次构建真实的 src 文件名,
// 存在就加载它, 不存在再回退到构建时写死的名字。
//
// 为什么需要(二): 光有上面的解析不够——冷启动时 jsb.fileUtils 的搜索路径还是 APK 内置目录,
// 热更目录不在里面, 解析永远命中包内文件。而 cc.game.restart() 只销毁场景、重跑旧的 onStart,
// 不重跑 main.js 也不重新 require settings, 所以"下载完重启生效"在 2.4 原生上根本不成立。
// 必须在 require settings 之前(本文件注入的 __bbApplyHotPaths)把上次保存的热更搜索路径恢复,
// 并按清单版本比较, 只允许"热更版本高于 APK 内置版本"时生效, 防止旧热更盖住新包。
//
// 构建指纹: settings.bundleVers 是每个构建都不同的版本哈希, 用来在启动时判断"设备上的旧热更
// 资源是不是上一个包留下的"。它必须在 window.boot() 之前取到, 因为 boot() 第一件事就是把
// window._CCSettings 置为 undefined; 而 cc.assetManager 上没有公开的 bundleVers(2.4 只把它
// 传给 cc.assetManager.downloader.bundleVers), 所以这里提前存一份到 window.__bbBuildStamp。

var fs = require('fs');
var path = require('path');

var buildDir = process.argv[2];
if (!buildDir) {
    console.error('用法: node tools/patch_main_boot.js <构建目录>');
    process.exit(1);
}

var mainPath = path.join(buildDir, 'main.js');
if (!fs.existsSync(mainPath)) {
    console.error('找不到 ' + mainPath);
    process.exit(1);
}
var src = fs.readFileSync(mainPath, 'utf8');

var MARK = '/* bobao_hotfix_boot */';
var STAMP_MARK = '/* bobao_build_stamp */';
var STAMP_END = '} catch (e) { window.__bbBuildStamp = ""; }';
var HOT_MARK = '/* bobao_hotupdate_boot */';
var HOT_END = '/* bobao_hotupdate_boot_end */';
var BOOT_CALL = /^[ \t]*window\.boot\(\);/m;
var JSB_ANCHOR = 'if (window.jsb) {\n    var isRuntime';

// 取出当前 main.js 里写死的 src 文件名, 作为回退值
function pick(re) {
    var m = src.match(re);
    return m ? m[0] : '';
}
var settingsFile = pick(/src\/settings\.[0-9a-z]+\.js/);
var jsbFile = pick(/src\/cocos2d-jsb\.[0-9a-z]+\.js/);
var runtimeFile = pick(/src\/cocos2d-runtime\.[0-9a-z]+\.js/);
var physicsFile = pick(/src\/physics\.[0-9a-z]+\.js/);

if (!settingsFile) {
    console.error('main.js 里没找到 src/settings.*.js, 构建结构不符');
    process.exit(1);
}

// 运行时解析: 在搜索路径里找到含 project.manifest 且存在该文件的目录, 返回清单里的真实路径
var helper = MARK + '\n' +
'if (window.jsb) {\n' +
'    window.__bbResolveSrc = function (name, fallback) {\n' +
'        try {\n' +
'            var fu = jsb.fileUtils;\n' +
'            var paths = fu.getSearchPaths() || [];\n' +
'            var re = new RegExp("^src/" + name + "\\\\.[^/]+\\\\.jsc?$");\n' +
'            for (var i = 0; i < paths.length; i++) {\n' +
'                var dir = paths[i].replace(/\\/+$/, "");\n' +
'                var mf = dir + "/project.manifest";\n' +
'                if (!fu.isFileExist(mf)) { continue; }\n' +
'                var data = JSON.parse(fu.getStringFromFile(mf));\n' +
'                var assets = (data && data.assets) || {};\n' +
'                for (var k in assets) {\n' +
'                    if (re.test(k) && fu.isFileExist(dir + "/" + k)) { return k.replace(/\\.jsc$/, ".js"); }\n' +
'                }\n' +
'            }\n' +
'        } catch (e) {}\n' +
'        return fallback;\n' +
'    };\n' +
'}\n';

// 启动时恢复热更搜索路径(必须在 require settings 之前执行)
// jsb-builtin.js 先于 main.js 执行, 所以这里 localStorage / jsb.fileUtils 都已可用
var hotPathsCode = HOT_MARK + '\n' +
'if (window.jsb && window.localStorage) {\n' +
'    try {\n' +
'        var __hbRaw = localStorage.getItem("HotUpdateSearchPaths");\n' +
'        if (__hbRaw) {\n' +
'            var __hbObj = JSON.parse(__hbRaw);\n' +
'            var __hbList = Array.isArray(__hbObj) ? __hbObj : (__hbObj && __hbObj.paths);\n' +
'            if (__hbList && __hbList.length) {\n' +
'                var __hbFu = jsb.fileUtils;\n' +
'                var __hbVer = function (dirs) {\n' +
'                    for (var __i = 0; __i < dirs.length; __i++) {\n' +
'                        var __d = String(dirs[__i]).replace(/\\/+$/, "");\n' +
'                        var __mf = __d ? (__d + "/project.manifest") : "project.manifest";\n' +
'                        if (!__hbFu.isFileExist(__mf)) { continue; }\n' +
'                        try {\n' +
'                            var __v = JSON.parse(__hbFu.getStringFromFile(__mf)).version;\n' +
'                            if (__v) { return String(__v); }\n' +
'                        } catch (__e) {}\n' +
'                    }\n' +
'                    return "";\n' +
'                };\n' +
'                var __hbCmp = function (a, b) {\n' +
'                    var __x = String(a).split("."), __y = String(b).split(".");\n' +
'                    var __n = Math.max(__x.length, __y.length);\n' +
'                    for (var __i = 0; __i < __n; __i++) {\n' +
'                        var __p = parseInt(__x[__i], 10) || 0;\n' +
'                        var __q = parseInt(__y[__i], 10) || 0;\n' +
'                        if (__p > __q) { return 1; }\n' +
'                        if (__p < __q) { return -1; }\n' +
'                    }\n' +
'                    return 0;\n' +
'                };\n' +
'                var __hbApkVer = __hbVer(__hbFu.getSearchPaths() || []);\n' +
'                var __hbHotVer = __hbVer(__hbList);\n' +
'                if (__hbHotVer && (!__hbApkVer || __hbCmp(__hbHotVer, __hbApkVer) > 0)) {\n' +
'                    __hbFu.setSearchPaths(__hbList);\n' +
'                    window.__bbHotBootApplied = true;\n' +
'                    window.__bbHotBootVersion = __hbHotVer;\n' +
'                } else if (__hbHotVer) {\n' +
'                    localStorage.removeItem("HotUpdateSearchPaths");\n' +
'                    localStorage.removeItem("HotUpdateAppliedPaths");\n' +
'                    localStorage.removeItem("HotUpdateBuildStamp");\n' +
'                }\n' +
'            }\n' +
'        }\n' +
'    } catch (__hbErr) {}\n' +
'}\n' +
HOT_END + '\n';

// 构建指纹: 必须在 window.boot()(它会把 _CCSettings 置空)之前取值
var stampCode = STAMP_MARK + '\n' +
'try {\n' +
'    var __bv = (window._CCSettings || {}).bundleVers || {};\n' +
'    var __ks = [];\n' +
'    for (var __k in __bv) { if (Object.prototype.hasOwnProperty.call(__bv, __k)) { __ks.push(__k + ":" + __bv[__k]); } }\n' +
'    __ks.sort();\n' +
'    window.__bbBuildStamp = __ks.join("|");\n' +
STAMP_END + '\n';

function insertStamp(text) {
    var m = text.match(BOOT_CALL);
    if (!m) { return null; }
    return text.slice(0, m.index) + stampCode + text.slice(m.index);
}

// 去重: 已有块先摘掉, 统一按最新内容重插(保证补丁内容始终是最新的)
function stripBlock(text, startMark, endMark) {
    var s = text.indexOf(startMark);
    if (s < 0) { return text; }
    var e = text.indexOf(endMark, s);
    if (e < 0) { return text; }
    return (text.slice(0, s) + text.slice(e + endMark.length)).replace(/^[ \t]*\r?\n/, '');
}

src = stripBlock(src, HOT_MARK, HOT_END);
src = stripBlock(src, STAMP_MARK, STAMP_END);

// 1) require 解析补丁(只加一次, 需要把 require 的写死文件名替换掉)
if (src.indexOf(MARK) < 0) {
    var idx = src.indexOf('if (window.jsb)');
    if (idx < 0) {
        console.error('main.js 里没找到 if (window.jsb)');
        process.exit(1);
    }
    src = src.slice(0, idx) + helper + '\n' + src.slice(idx);

    src = src.replace(/require\('src\/settings\.[0-9a-z]+\.js'\)/g,
        "require(__bbResolveSrc('settings', '" + settingsFile + "'))");
    if (jsbFile) {
        src = src.replace(/require\('src\/cocos2d-jsb\.[0-9a-z]+\.js'\)/g,
            "require(__bbResolveSrc('cocos2d-jsb', '" + jsbFile + "'))");
    }
    if (runtimeFile) {
        src = src.replace(/require\('src\/cocos2d-runtime\.[0-9a-z]+\.js'\)/g,
            "require(__bbResolveSrc('cocos2d-runtime', '" + runtimeFile + "'))");
    }
    if (physicsFile) {
        src = src.replace(/require\('src\/physics\.[0-9a-z]+\.js'\)/g,
            "require(__bbResolveSrc('physics', '" + physicsFile + "'))");
    }
}

// 2) 热更路径恢复块: 插在 "if (window.jsb) { var isRuntime" 之前, 即 require settings 之前
var anchor = src.indexOf(JSB_ANCHOR);
if (anchor < 0) {
    console.error('main.js 里没找到启动分支锚点: ' + JSON.stringify(JSB_ANCHOR));
    process.exit(1);
}
src = src.slice(0, anchor) + hotPathsCode + '\n' + src.slice(anchor);

// 3) 构建指纹块: 插在 window.boot(); 之前
var out = insertStamp(src);
if (out === null) {
    console.error('main.js 里没找到 window.boot(); 调用');
    process.exit(1);
}

fs.writeFileSync(mainPath, out, 'utf8');
console.log('补丁完成: ' + mainPath);
console.log('  settings : ' + settingsFile);
if (jsbFile) { console.log('  jsb       : ' + jsbFile); }
if (physicsFile) { console.log('  physics   : ' + physicsFile); }
