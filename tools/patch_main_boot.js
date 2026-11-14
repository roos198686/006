// 给构建产物打热更启动补丁(幂等, 可重复执行)
// 用法: node tools/patch_main_boot.js <构建目录>
//   node tools/patch_main_boot.js client/build/jsb-link
//   node tools/patch_main_boot.js client/build/jsb-default
//
// 为什么需要: main.js 里 require 的 src/settings.<hash>.js、cocos2d-jsb.<hash>.js、physics.<hash>.js
// 文件名带构建哈希, 每次构建都变。旧 APK 的 main.js 只认自己那套名字, 所以热更下载下来的新
// src 文件永远加载不到, 引擎仍按旧 settings 的 bundleVers 去加载旧 assets/main/index.<hash>.jsc。
// 这里把 require 改成: 先到热更搜索目录里读 project.manifest, 找到本次构建真实的 src 文件名,
// 存在就加载它, 不存在再回退到构建时写死的名字。
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
var BOOT_CALL = /^[ \t]*window\.boot\(\);/m;

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

// 已经打过补丁: 校验指纹块的位置和取值, 不对就重写(旧版把它插在内层分支里并引用了不存在的 settings 变量)
if (src.indexOf(MARK) >= 0 && src.indexOf(STAMP_MARK) >= 0) {
    var s = src.indexOf(STAMP_MARK);
    var e = src.indexOf(STAMP_END, s);
    if (e < 0) {
        console.error('已有构建指纹块结构不符: ' + mainPath);
        process.exit(1);
    }
    var cleaned = (src.slice(0, s) + src.slice(e + STAMP_END.length)).replace(/^[ \t]*\r?\n/, '');
    var rebuilt = insertStamp(cleaned);
    if (rebuilt === null) {
        console.error('main.js 里没找到 window.boot(); 调用');
        process.exit(1);
    }
    if (rebuilt === src) {
        console.log('已打过补丁, 跳过: ' + mainPath);
    } else {
        fs.writeFileSync(mainPath, rebuilt, 'utf8');
        console.log('已重写构建指纹(位置/取值修正): ' + mainPath);
    }
    process.exit(0);
}

// 在 if (window.jsb) 之前插入 helper, 并替换 require(仅首次)
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

if (src.indexOf(STAMP_MARK) >= 0) {
    // require 与指纹块都已存在(结构上不会再发生), 保持原样
    fs.writeFileSync(mainPath, src, 'utf8');
    console.log('已补 require, 指纹块已存在: ' + mainPath);
} else {
    var out = insertStamp(src);
    if (out === null) {
        console.error('main.js 里没找到 window.boot(); 调用');
        process.exit(1);
    }
    fs.writeFileSync(mainPath, out, 'utf8');
    console.log('补丁完成: ' + mainPath);
}

console.log('  settings : ' + settingsFile);
if (jsbFile) { console.log('  jsb       : ' + jsbFile); }
if (physicsFile) { console.log('  physics   : ' + physicsFile); }
