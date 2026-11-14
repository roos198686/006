// 可按旧主包 hash 下发的热更包生成器
// 用法: node tools/make_hotfix_oldhash.js <构建目录> <输出zip> <版本号> <公网地址> <主包旧hash>
// 例:   node tools/make_hotfix_oldhash.js client/build/jsb-default hotfix.zip 1.0.12 http://47.239.100.68:9100/hotupdate e7d09
//
// 背景: 装机包里的 src/settings.<hash>.jsc(编译进 main.js) 固定记录了主包文件名 index.<旧hash>.jsc / config.<旧hash>.json。
// 热更包只含 assets/, 主包 hash 一变引擎就找不到新文件, 会回落到装机包里的旧代码。
// 所以这里把新主包文件按装机包的旧 hash 重命名, 清单 key 同步, 让引擎按旧名字命中热更目录里的新文件。

var fs = require('fs');
var os = require('os');
var path = require('path');
var crypto = require('crypto');
var cp = require('child_process');

var buildDir = process.argv[2];
var outZip = process.argv[3];
var version = process.argv[4];
var publicBase = (process.argv[5] || '').replace(/\/+$/, '');
var mainOldHash = process.argv[6];

if (!buildDir || !outZip || !version || !publicBase || !mainOldHash) {
    console.error('用法: node tools/make_hotfix_oldhash.js <构建目录> <输出zip> <版本号> <公网地址> <主包旧hash>');
    process.exit(1);
}

var assetsRoot = path.join(buildDir, 'assets');
if (!fs.existsSync(assetsRoot)) {
    console.error('找不到目录: ' + assetsRoot);
    process.exit(1);
}

// 1. 拷贝 assets 到临时目录
var staging = path.join(os.tmpdir(), 'hotfix_oldhash_' + Date.now());
function copyDir(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    fs.readdirSync(src).forEach(function (name) {
        var s = path.join(src, name), d = path.join(dst, name);
        if (fs.statSync(s).isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
    });
}
console.log('staging: ' + staging);
copyDir(assetsRoot, path.join(staging, 'assets'));

// 2. 主包 index/config 按旧 hash 重命名
var mainDir = path.join(staging, 'assets', 'main');
var renamed = [];
fs.readdirSync(mainDir).forEach(function (name) {
    var m = /^(index|config)\.([0-9a-f]+)\.(json|jsc)$/.exec(name);
    if (!m) return;
    var target = m[1] + '.' + mainOldHash + '.' + m[3];
    if (name === target) return;
    fs.renameSync(path.join(mainDir, name), path.join(mainDir, target));
    renamed.push(name + ' -> ' + target);
});
if (!renamed.length) {
    console.error('主包 index/config 没有找到, 请检查构建目录');
    process.exit(1);
}
console.log('重命名: ' + renamed.join(', '));

// 3. 按临时目录内容生成清单(与 gen_manifest.js 同格式)
function walk(dir, prefix, out) {
    fs.readdirSync(dir).forEach(function (name) {
        var full = path.join(dir, name);
        var rel = prefix ? (prefix + '/' + name) : name;
        if (fs.statSync(full).isDirectory()) walk(full, rel, out);
        else out.push({ full: full, key: rel });
    });
}
var files = [];
walk(path.join(staging, 'assets'), '', files);
var assets = {};
files.forEach(function (f) {
    var buf = fs.readFileSync(f.full);
    assets['assets/' + f.key] = {
        md5: crypto.createHash('md5').update(buf).digest('hex'),
        compressed: false,
        size: buf.length
    };
});
fs.writeFileSync(path.join(staging, 'project.manifest'), JSON.stringify({
    packageUrl: publicBase,
    remoteManifestUrl: publicBase + '/project.manifest',
    remoteVersionUrl: publicBase + '/version.manifest',
    version: version,
    assets: assets
}), 'utf8');
fs.writeFileSync(path.join(staging, 'version.manifest'), JSON.stringify({
    packageUrl: publicBase,
    remoteManifestUrl: publicBase + '/project.manifest',
    remoteVersionUrl: publicBase + '/version.manifest',
    version: version
}), 'utf8');

// 4. 打包(bsdtar 按扩展名生成 zip)
if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
var r = cp.spawnSync('tar', ['-a', '-c', '-f', outZip, '-C', staging, '.'], { stdio: 'inherit' });
if (r.status !== 0) {
    console.error('打包失败, 退出码 ' + r.status + ', 临时目录保留: ' + staging);
    process.exit(1);
}

console.log('版本 ' + version + ' 资源 ' + Object.keys(assets).length + ' 个');
console.log('输出: ' + outZip + ' (' + (fs.statSync(outZip).size / 1048576).toFixed(1) + ' MB)');
console.log('主包文件名: index.' + mainOldHash + '.jsc / config.' + mainOldHash + '.json');
fs.rmSync(staging, { recursive: true, force: true });
