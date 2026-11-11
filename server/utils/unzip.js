// 极简 zip 解压工具(零第三方依赖, 服务端无 adm-zip/unzipper 时使用)
// 仅支持常规 zip: store(0)/deflate(8), 无加密、无分卷、文件名限 ASCII(热更包来自 Cocos 构建产物, 路径全 ASCII)
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

function readUInt(buf, off, len){
    var v = 0;
    for(var i = len - 1; i >= 0; --i){ v = v * 256 + buf[off + i]; }
    return v;
}

// 从尾部向前找 End Of Central Directory(0x06054b50), 容忍尾部注释
function findEOCD(buf){
    var min = Math.max(0, buf.length - 65557);
    for(var i = buf.length - 22; i >= min; --i){
        if(buf[i] === 0x50 && buf[i+1] === 0x4b && buf[i+2] === 0x05 && buf[i+3] === 0x06){
            return i;
        }
    }
    return -1;
}

// 递归删除目录(解压失败/目录替换用)
function rmdirDeep(p){
    if(!fs.existsSync(p)) return;
    var list = fs.readdirSync(p);
    for(var i = 0; i < list.length; ++i){
        var fp = path.join(p, list[i]);
        if(fs.statSync(fp).isDirectory()) rmdirDeep(fp);
        else fs.unlinkSync(fp);
    }
    fs.rmdirSync(p);
}

exports.rmdirDeep = rmdirDeep;

// 解压 zipFile 到 destDir, callback(err, files[])  files=解压出的文件相对路径列表
exports.unzip = function(zipFile, destDir, callback){
    fs.readFile(zipFile, function(err, buf){
        if(err){ callback(err); return; }
        try{
            var eocd = findEOCD(buf);
            if(eocd < 0){ callback(new Error("不是有效的 zip 文件")); return; }
            var entryCount = readUInt(buf, eocd + 10, 2);
            var cdOffset = readUInt(buf, eocd + 16, 4);
            if(entryCount === 0xFFFF){ callback(new Error("不支持分卷/超大 zip")); return; }
            fs.mkdirSync(destDir, { recursive: true });
            var files = [];
            var p = cdOffset;
            for(var i = 0; i < entryCount; ++i){
                // 中央目录文件头签名 0x02014b50
                if(!(buf[p] === 0x50 && buf[p+1] === 0x4b && buf[p+2] === 0x01 && buf[p+3] === 0x02)){
                    callback(new Error("zip 中央目录解析失败(可能使用了不支持的压缩工具)"));
                    return;
                }
                var flags = readUInt(buf, p + 8, 2);
                var method = readUInt(buf, p + 10, 2);
                var compSize = readUInt(buf, p + 20, 4);
                var nameLen = readUInt(buf, p + 28, 2);
                var extraLen = readUInt(buf, p + 30, 2);
                var cmtLen = readUInt(buf, p + 32, 2);
                var extAttrs = readUInt(buf, p + 38, 4);
                var localOff = readUInt(buf, p + 42, 4);
                var name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
                var isDir = (extAttrs & 0x10) !== 0 || name.charAt(name.length - 1) === '/';
                if(flags & 0x1){ callback(new Error("zip 带密码, 不支持")); return; }
                p += 46 + nameLen + extraLen + cmtLen;
                if(isDir) continue;
                // 防路径穿越
                if(name.indexOf('..') >= 0 || name.charAt(0) === '/' || name.indexOf(':') >= 0){
                    callback(new Error("zip 内含非法路径: " + name));
                    return;
                }
                // 本地文件头: 数据区起始 = localOff + 30 + nameLen + extraLen(以本地头字段为准)
                var lnameLen = readUInt(buf, localOff + 26, 2);
                var lextraLen = readUInt(buf, localOff + 28, 2);
                var dataStart = localOff + 30 + lnameLen + lextraLen;
                var raw = buf.slice(dataStart, dataStart + compSize);
                var out;
                if(method === 0){
                    out = raw;
                } else if(method === 8){
                    out = zlib.inflateRawSync(raw);
                } else {
                    callback(new Error("不支持的压缩方式: " + method));
                    return;
                }
                var target = path.join(destDir, name);
                fs.mkdirSync(path.dirname(target), { recursive: true });
                fs.writeFileSync(target, out);
                files.push(name);
            }
            callback(null, files);
        } catch(e){
            callback(e);
        }
    });
};
