// === 防崩兜底: 未捕获异常只打日志不退出 ===
process.on('uncaughtException', function(err){
    console.error('[uncaughtException]', new Date().toISOString(), err && err.stack || err);
    try { require('fs').appendFileSync(__dirname + '/../logs/crash.log', '[' + new Date().toISOString() + '] uncaughtException (hall)\n' + (err && err.stack || err) + '\n\n'); } catch(e){}
});
process.on('unhandledRejection', function(reason, p){
    console.error('[unhandledRejection]', new Date().toISOString(), reason);
});

var client_service = require("./client_service");
var room_service = require("./room_service");

var configs = require(process.argv[2]);
var config = configs.hall_server();

var db = require('../utils/db');
db.init(configs.mysql());

client_service.start(config);
room_service.start(config);