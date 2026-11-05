// 全局兜底: 之前没有 uncaughtException/unhandledRejection 处理, 任何一处未捕获异常都会让
// node 进程直接退出(表现为"后端又崩了"), 且控制台一闪而过抓不到堆栈。这里统一落盘到 logs/crash.log
var fs = require('fs');
var path = require('path');
var CRASH_LOG = path.join(__dirname, '../logs/crash.log');
function logCrash(tag, e) {
    var s = '[' + new Date().toISOString() + '] ' + tag + '\n' + ((e && e.stack) || e) + '\n\n';
    try { fs.appendFileSync(CRASH_LOG, s); } catch (_) { }
    console.error(s);
}
process.on('uncaughtException', function (e) { logCrash('uncaughtException', e); });
process.on('unhandledRejection', function (e) { logCrash('unhandledRejection', e); });

var http_service = require("./http_service");
var socket_service = require("./socket_service");

//从配置文件获取服务器信息
var configs = require(process.argv[2]);
var config = configs.game_server();

var db = require('../utils/db');
db.init(configs.mysql());

//服务重启后内存房间全部丢失,库内残留房间均为死房间:启动即清库,防止用户被残留映射卡在进房
db.delete_all_rooms();
db.clear_all_user_roomids();
db.clear_all_club_table_rooms();

//开启HTTP服务
http_service.start(config);

//录像保留3天:启动清理一次,之后每小时清理一次(首次延迟2s,等db.init里的建表完成,避免ER_NO_SUCH_TABLE)
setTimeout(function(){ db.clean_expired_replays(3, function(){}); }, 2000);
setInterval(function(){
    db.clean_expired_replays(3, function(){});
}, 3600 * 1000);

//开启外网SOCKET服务
socket_service.start(config);

//require('./gamemgr');