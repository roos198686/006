// === 防崩兜底: 未捕获异常只打日志不退出 ===
process.on('uncaughtException', function(err){
    console.error('[uncaughtException]', new Date().toISOString(), err && err.stack || err);
    try { require('fs').appendFileSync(__dirname + '/../logs/crash.log', '[' + new Date().toISOString() + '] uncaughtException\n' + (err && err.stack || err) + '\n\n'); } catch(e){}
});
process.on('unhandledRejection', function(reason, p){
    console.error('[unhandledRejection]', new Date().toISOString(), reason);
});

var db = require('../utils/db');
var configs = require(process.argv[2]);

//init db pool.
db.init(configs.mysql());

//

var config = configs.account_server();
var as = require('./account_server');
as.start(config);

var dapi = require('./dealer_api');
dapi.start(config);

var admin = require('./admin_api');
admin.start(config);