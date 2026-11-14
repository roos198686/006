// 热更新清单生成器
// 用法: node tools/gen_manifest.js <构建目录> <版本号> <资源公网地址>
// 例:   node tools/gen_manifest.js client/build/jsb-default 1.0.6 http://47.239.100.68:9100/hotupdate
//
// 为什么需要它: Creator 构建在 md5Cache 下有时不重写 project.manifest(或写成上一版的),
// 导致清单里的文件名和实际产物对不上, 热更会漏下/错下文件。这里按磁盘上真实文件重算 md5。
// 清单格式对齐引擎 extensions/assets-manager/Manifest.cpp:
//   {packageUrl, remoteManifestUrl, remoteVersionUrl, version, assets:{路径:{md5,compressed,size}}}
// 路径以 "assets/" 开头, 即相对 game 资源根目录。

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var buildDir = process.argv[2];
var version = process.argv[3];
var publicBase = (process.argv[4] || '').replace(/\/+$/, '');

if (!buildDir || !version || !publicBase) {
    console.error('用法: node tools/gen_manifest.js <构建目录> <版本号> <公网地址>');
    process.exit(1);
}

var assetsRoot = path.join(buildDir, 'assets');
if (!fs.existsSync(assetsRoot)) {
    console.error('找不到目录: ' + assetsRoot);
    process.exit(1);
}

// 热更要覆盖的目录:
//   assets/      资源与 bundle(主包 index.<hash>.jsc 等)
//   src/         settings / cocos2d-jsb / physics, 文件名带 hash, 必须能被热更替换
//   jsb-adapter/ 适配层, 名字固定
// 不含 frameworks/ (原生库), 那部分只能重新打包
var ROOTS = ['assets', 'src', 'jsb-adapter'];

// 递归收集文件, key 用 posix 风格相对路径(含根目录名)
function walk(dir, prefix, out) {
    var list = fs.readdirSync(dir);
    for (var i = 0; i < list.length; i++) {
        var full = path.join(dir, list[i]);
        var rel = prefix ? (prefix + '/' + list[i]) : list[i];
        var st = fs.statSync(full);
        if (st.isDirectory()) {
            walk(full, rel, out);
        } else {
            out.push({ full: full, key: rel });
        }
    }
}

var files = [];
ROOTS.forEach(function (root) {
    var dir = path.join(buildDir, root);
    if (!fs.existsSync(dir)) { return; }
    walk(dir, root, files);
});

var assets = {};
files.forEach(function (f) {
    var buf = fs.readFileSync(f.full);
    assets[f.key] = {
        md5: crypto.createHash('md5').update(buf).digest('hex'),
        compressed: false,
        size: buf.length
    };
});

var manifest = {
    packageUrl: publicBase,
    remoteManifestUrl: publicBase + '/project.manifest',
    remoteVersionUrl: publicBase + '/version.manifest',
    version: version,
    assets: assets
};

fs.writeFileSync(path.join(buildDir, 'project.manifest'), JSON.stringify(manifest), 'utf8');
fs.writeFileSync(path.join(buildDir, 'version.manifest'), JSON.stringify({
    packageUrl: publicBase,
    remoteManifestUrl: publicBase + '/project.manifest',
    remoteVersionUrl: publicBase + '/version.manifest',
    version: version
}), 'utf8');

console.log('版本 ' + version + ' 资源 ' + Object.keys(assets).length + ' 个');
console.log('project.manifest: ' + path.join(buildDir, 'project.manifest'));
console.log('version.manifest: ' + path.join(buildDir, 'version.manifest'));
