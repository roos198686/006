var mysql=require("mysql");  
var crypto = require('./crypto');

var pool = null;

function nop(a,b,c,d,e,f,g){

}
  
function generateUserId() {
    var Id = "";
    for (var i = 0; i < 6; ++i) {
        if (i > 0) {
            Id += Math.floor(Math.random() * 10);
        } else {
            Id += Math.floor(Math.random() * 9) + 1;
        }
    }
    return Id;
}

function query(sql,callback){  
    pool.getConnection(function(err,conn){  
        if(err){  
            callback(err,null,null);  
        }else{  
            conn.query(sql,function(qerr,vals,fields){  
                //释放连接  
                conn.release();  
                //事件驱动回调  
                callback(qerr,vals,fields);  
            });  
        }  
    });  
};

exports.init = function(config){
    pool = mysql.createPool({  
        host: config.HOST,
        user: config.USER,
        password: config.PSWD,
        database: config.DB,
        port: config.PORT,
        connectionLimit: 50,   //默认仅10,100在线时数据库操作会排队
        queueLimit: 0,         //排队请求不限数量
    });
    //账号绑定表(游客账号<->微信账号),表不存在时自动创建,保证部署环境可直接跑
    var sql = 'CREATE TABLE IF NOT EXISTS `t_account_bind` (' +
        '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,' +
        '`account_a` varchar(64) NOT NULL COMMENT "游客账号",' +
        '`account_b` varchar(64) NOT NULL COMMENT "微信账号",' +
        '`primary_account` varchar(64) NOT NULL COMMENT "主账号",' +
        '`create_time` int(11) NOT NULL DEFAULT 0,' +
        'PRIMARY KEY (`id`),UNIQUE KEY `account_a` (`account_a`),UNIQUE KEY `account_b` (`account_b`)' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8';
    setTimeout(function(){
        query(sql, function(err){
            if(err){ console.log("create t_account_bind failed:" + err.message); }
        });
    }, 300);

    //对局录像表(保留3天),不存在时自动创建
    var sql2 = 'CREATE TABLE IF NOT EXISTS `t_replays` (' +
        '`room_uuid` char(20) NOT NULL,' +
        '`game_index` smallint(6) NOT NULL,' +
        '`type` varchar(32) NOT NULL,' +
        '`roomid` int(11) NOT NULL DEFAULT 0,' +
        '`players` varchar(255) NOT NULL,' +
        '`table_name` varchar(64) NOT NULL DEFAULT "",' +
        '`data` longtext NOT NULL,' +
        '`create_time` int(11) NOT NULL DEFAULT 0,' +
        'PRIMARY KEY (`room_uuid`,`game_index`)' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8';
    setTimeout(function(){
        query(sql2, function(err){
            if(err){ console.log("create t_replays failed:" + err.message); }
        });
    }, 600);

    //俱乐部玩法台数规则列(老库自动升级;已存在会报 Duplicate column,忽略即可)
    setTimeout(function(){
        query('ALTER TABLE `t_club_games` ADD COLUMN `tai_rules` TEXT NULL COMMENT "台数规则JSON(俱乐部自配,空=用默认)"', function(err){
            if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_club_games.tai_rules failed:" + err.message); }
        });
    }, 900);

    //俱乐部上级(子俱乐部记录所属社长俱乐部;0=顶级,由代理/管理员创建)
    setTimeout(function(){
        query('ALTER TABLE `t_clubs` ADD COLUMN `parent_clubid` INT(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT "上级俱乐部ID,0=顶级"', function(err){
            if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_clubs.parent_clubid failed:" + err.message); }
        });
    }, 1200);

    //一级俱乐部标记: 社长增减豆豆不受自身余额限制(0=普通俱乐部)
    setTimeout(function(){
        query('ALTER TABLE `t_clubs` ADD COLUMN `is_top_level` TINYINT(1) NOT NULL DEFAULT 0 COMMENT "1=一级俱乐部,增减豆豆不受自身余额限制"', function(err){
            if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_clubs.is_top_level failed:" + err.message); }
        });
    }, 1400);

    //乐豆(宝宝豆)变动流水,用于俱乐部"我的乐豆详情"记录页
    var sql3 = 'CREATE TABLE IF NOT EXISTS `t_bean_logs` (' +
        '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,' +
        '`userid` int(11) NOT NULL DEFAULT 0,' +
        '`roomid` int(11) NOT NULL DEFAULT 0,' +
        '`room_uuid` char(20) NOT NULL DEFAULT "",' +
        '`game_index` smallint(6) NOT NULL DEFAULT 0,' +
        '`game_type` varchar(32) NOT NULL DEFAULT "",' +
        '`table_name` varchar(64) NOT NULL DEFAULT "",' +
        '`change_type` varchar(32) NOT NULL DEFAULT "",' +
        '`amount` int(11) NOT NULL DEFAULT 0,' +
        '`create_time` int(11) NOT NULL DEFAULT 0,' +
        'PRIMARY KEY (`id`),KEY `userid_time` (`userid`,`create_time`)' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8';
    setTimeout(function(){
        query(sql3, function(err){
            if(err){ console.log("create t_bean_logs failed:" + err.message); }
        });
    }, 1500);

    //老库补列:乐豆流水关联到具体一局(room_uuid+game_index),用于「详情」按钮进回放
    setTimeout(function(){
        query('ALTER TABLE `t_bean_logs` ADD COLUMN `room_uuid` CHAR(20) NOT NULL DEFAULT "" COMMENT "房间uuid(回放用)"', function(err){
            if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_bean_logs.room_uuid failed:" + err.message); }
        });
    }, 1800);
    setTimeout(function(){
        query('ALTER TABLE `t_bean_logs` ADD COLUMN `game_index` SMALLINT(6) NOT NULL DEFAULT 0 COMMENT "第几局(回放用)"', function(err){
            if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_bean_logs.game_index failed:" + err.message); }
        });
    }, 2100);

    //管理后台登录token列(老库自动升级,缺列会导致登录报错/进程崩溃)
    setTimeout(function(){
        query('ALTER TABLE `t_admin_users` ADD COLUMN `token` VARCHAR(64) NULL DEFAULT NULL COMMENT "登录token"', function(err){
            if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_admin_users.token failed:" + err.message); }
        });
    }, 2400);
    setTimeout(function(){
        query('ALTER TABLE `t_admin_users` ADD UNIQUE KEY `uniq_token` (`token`)', function(err){
            if(err && !/Duplicate key name/i.test(err.message)){ console.log("add t_admin_users.uniq_token failed:" + err.message); }
        });
    }, 2700);

    //玩法配置:纯财神吃碰杠开关(0=至少需1张真牌,1=允许纯财神凑吃碰杠)
    setTimeout(function(){
        query('ALTER TABLE `t_game_config` ADD COLUMN `cai_pure` TINYINT(1) NOT NULL DEFAULT 0 COMMENT "纯财神吃碰杠:0=需真牌 1=允许纯财神凑"', function(err){
            if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_game_config.cai_pure failed:" + err.message); }
        });
    }, 2800);

    //观战账号表:由超级后台录入账号密码,观战网页用它登录(与管理员账号完全独立)
    setTimeout(function(){
        var sqlSp = 'CREATE TABLE IF NOT EXISTS `t_spectate_users` (' +
            '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,' +
            '`username` varchar(64) NOT NULL COMMENT "观战账号",' +
            '`password` varchar(64) NOT NULL COMMENT "密码md5",' +
            '`enabled` tinyint(1) NOT NULL DEFAULT 1 COMMENT "1启用 0禁用",' +
            '`token` varchar(64) NULL DEFAULT NULL COMMENT "登录token",' +
            '`last_login` int(11) NOT NULL DEFAULT 0,' +
            '`created_at` int(11) NOT NULL DEFAULT 0,' +
            'PRIMARY KEY (`id`),' +
            'UNIQUE KEY `uniq_username` (`username`),' +
            'UNIQUE KEY `uniq_spectate_token` (`token`)' +
            ') ENGINE=InnoDB DEFAULT CHARSET=utf8';
        query(sqlSp, function(err){
            if(err){ console.log("create t_spectate_users failed:" + err.message); }
        });
    }, 3000);

    //俱乐部玩法配置扩展列(几人开局/最多几人/抽水/暗水/房费)
    setTimeout(function(){
        var alters = [
            'ALTER TABLE `t_club_games` ADD COLUMN `min_players` TINYINT(4) NOT NULL DEFAULT 2 COMMENT "几人开局(最少人数)"',
            'ALTER TABLE `t_club_games` ADD COLUMN `max_players_custom` TINYINT(4) NOT NULL DEFAULT 6 COMMENT "最多几人(自定义,覆盖全局)"',
            'ALTER TABLE `t_club_games` ADD COLUMN `rake_percent` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT "抽水比例(%)"',
            'ALTER TABLE `t_club_games` ADD COLUMN `hidden_rake_percent` DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT "暗水比例(%)"',
            'ALTER TABLE `t_club_games` ADD COLUMN `rake_per_round` TINYINT(1) NOT NULL DEFAULT 1 COMMENT "1=每小局抽 0=整场抽"',
            'ALTER TABLE `t_club_games` ADD COLUMN `room_fee` INT(11) NOT NULL DEFAULT 0 COMMENT "房费数量"',
            'ALTER TABLE `t_club_games` ADD COLUMN `room_fee_payer` TINYINT(1) NOT NULL DEFAULT 0 COMMENT "0=比赛场出(不扣) 1=大赢家出"',
            'ALTER TABLE `t_club_games` ADD COLUMN `face_score` INT(11) NOT NULL DEFAULT 0 COMMENT "表情分"',
            'ALTER TABLE `t_club_games` ADD COLUMN `shuffle_score` INT(11) NOT NULL DEFAULT 0 COMMENT "洗牌分"',
            'ALTER TABLE `t_club_games` ADD COLUMN `min_bean` INT(11) NOT NULL DEFAULT 0 COMMENT "进场豆豆"',
            'ALTER TABLE `t_club_games` ADD COLUMN `kick_bean` INT(11) NOT NULL DEFAULT 0 COMMENT "出场豆豆"'
        ];
        alters.forEach(function(sql, i){
            setTimeout(function(){
                query(sql, function(err){
                    if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_club_games failed:" + err.message); }
                });
            }, 3000 + i * 300);
        });
    }, 3000);

    //牌桌关联玩法配置id
    setTimeout(function(){
        query('ALTER TABLE `t_club_tables` ADD COLUMN `game_config_id` INT(11) NOT NULL DEFAULT 0 COMMENT "关联的玩法配置id"', function(err){
            if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_club_tables.game_config_id failed:" + err.message); }
        });
    }, 5400);

    //老库补列:录像记录牌桌真实名称(战绩列表"玩法"列显示)
    setTimeout(function(){
        query('ALTER TABLE `t_replays` ADD COLUMN `table_name` VARCHAR(64) NOT NULL DEFAULT "" COMMENT "牌桌真实名称"', function(err){
            if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_replays.table_name failed:" + err.message); }
        });
    }, 5700);

    //老库补列:乐豆流水记录牌桌真实名称(乐豆记录/战绩"玩法"列显示)
    setTimeout(function(){
        query('ALTER TABLE `t_bean_logs` ADD COLUMN `table_name` VARCHAR(64) NOT NULL DEFAULT "" COMMENT "牌桌真实名称"', function(err){
            if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_bean_logs.table_name failed:" + err.message); }
        });
    }, 6000);

    //合伙人收益统计表
    var sqlPartner = 'CREATE TABLE IF NOT EXISTS `t_partner_stats` (' +
        '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,' +
        '`club_id` int(11) NOT NULL DEFAULT 0 COMMENT "上级俱乐部",' +
        '`partner_club_id` int(11) NOT NULL DEFAULT 0 COMMENT "下级俱乐部/合伙人",' +
        '`profit_ratio` decimal(5,2) NOT NULL DEFAULT 0 COMMENT "下级留成比例(%)"' +
        ',`today_game_score` int(11) NOT NULL DEFAULT 0 COMMENT "今日整链游戏分",' +
        '`today_rake` decimal(14,2) NOT NULL DEFAULT 0 COMMENT "今日抽水",' +
        '`today_hidden_rake` decimal(14,2) NOT NULL DEFAULT 0 COMMENT "今日暗水",' +
        '`today_partner_profit` decimal(14,2) NOT NULL DEFAULT 0 COMMENT "今日合伙人收益",' +
        '`yesterday_game_score` int(11) NOT NULL DEFAULT 0,' +
        '`yesterday_rake` decimal(14,2) NOT NULL DEFAULT 0,' +
        '`yesterday_hidden_rake` decimal(14,2) NOT NULL DEFAULT 0,' +
        '`yesterday_partner_profit` decimal(14,2) NOT NULL DEFAULT 0,' +
        '`total_game_score` int(11) NOT NULL DEFAULT 0 COMMENT "整链总游戏分",' +
        '`total_rake` decimal(14,2) NOT NULL DEFAULT 0 COMMENT "累计抽水",' +
        '`total_hidden_rake` decimal(14,2) NOT NULL DEFAULT 0 COMMENT "累计暗水",' +
        '`total_partner_profit` decimal(14,2) NOT NULL DEFAULT 0 COMMENT "累计合伙人收益",' +
        '`member_count` int(11) NOT NULL DEFAULT 0 COMMENT "成员数",' +
        '`direct_member_count` int(11) NOT NULL DEFAULT 0 COMMENT "直属成员数",' +
        '`chain_member_count` int(11) NOT NULL DEFAULT 0 COMMENT "整链成员数",' +
        '`total_gems` int(11) NOT NULL DEFAULT 0 COMMENT "整链总乐豆",' +
        '`warning_value` int(11) NOT NULL DEFAULT 0 COMMENT "警戒值",' +
        '`create_time` int(11) NOT NULL DEFAULT 0,' +
        '`update_time` int(11) NOT NULL DEFAULT 0,' +
        'PRIMARY KEY (`id`),UNIQUE KEY `club_partner` (`club_id`,`partner_club_id`),KEY `partner_club_id` (`partner_club_id`)' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8';
    setTimeout(function(){
        query(sqlPartner, function(err){
            if(err){ console.log("create t_partner_stats failed:" + err.message); }
        });
    }, 5700);

    //奖励明细表
    var sqlReward = 'CREATE TABLE IF NOT EXISTS `t_reward_logs` (' +
        '`id` int(11) unsigned NOT NULL AUTO_INCREMENT,' +
        '`club_id` int(11) NOT NULL DEFAULT 0,' +
        '`partner_club_id` int(11) NOT NULL DEFAULT 0 COMMENT "获得奖励的合伙人",' +
        '`reward_type` varchar(32) NOT NULL DEFAULT "" COMMENT "奖励类型:游戏奖励/保底奖励/切牌奖励/表情奖励/门票奖励/暗水奖励",' +
        '`amount` decimal(16,4) NOT NULL DEFAULT 0 COMMENT "奖励数量",' +
        '`game_type` varchar(32) NOT NULL DEFAULT "" COMMENT "所属玩法",' +
        '`table_name` varchar(64) NOT NULL DEFAULT "" COMMENT "牌桌真实名称",' +
        '`roomid` int(11) NOT NULL DEFAULT 0 COMMENT "房间号",' +
        '`room_uuid` char(20) NOT NULL DEFAULT "",' +
        '`game_index` smallint(6) NOT NULL DEFAULT 0,' +
        '`create_time` int(11) NOT NULL DEFAULT 0,' +
        'PRIMARY KEY (`id`),KEY `club_time` (`club_id`,`create_time`),KEY `partner_time` (`partner_club_id`,`create_time`)' +
        ') ENGINE=InnoDB DEFAULT CHARSET=utf8';
    setTimeout(function(){
        query(sqlReward, function(err){
            if(err){ console.log("create t_reward_logs failed:" + err.message); }
        });
    }, 6000);
    //老库补列:奖励明细记录牌桌真实名称;缺列会导致线上奖励写入全部失败
    setTimeout(function(){
        query('ALTER TABLE `t_reward_logs` ADD COLUMN `table_name` VARCHAR(64) NOT NULL DEFAULT "" COMMENT "牌桌真实名称" AFTER `game_type`', function(err){
            if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_reward_logs.table_name failed:" + err.message); }
        });
    }, 6300);

    //乐豆流水关联俱乐部和合伙人
    setTimeout(function(){
        query('ALTER TABLE `t_bean_logs` ADD COLUMN `club_id` INT(11) NOT NULL DEFAULT 0 COMMENT "所属俱乐部"', function(err){
            if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_bean_logs.club_id failed:" + err.message); }
        });
    }, 6300);
    setTimeout(function(){
        query('ALTER TABLE `t_bean_logs` ADD COLUMN `partner_club_id` INT(11) NOT NULL DEFAULT 0 COMMENT "分成合伙人"', function(err){
            if(err && !/Duplicate column/i.test(err.message)){ console.log("alter t_bean_logs.partner_club_id failed:" + err.message); }
        });
    }, 6600);

    //老库升级: 合伙人收益/奖励明细金额改成2位小数(逐级分成可能出现小数点)
    setTimeout(function(){
        var cols = ['today_rake','today_hidden_rake','today_partner_profit',
            'yesterday_rake','yesterday_hidden_rake','yesterday_partner_profit',
            'total_rake','total_hidden_rake','total_partner_profit'];
        cols.forEach(function(col, i){
            setTimeout(function(){
                query('ALTER TABLE `t_partner_stats` MODIFY COLUMN `' + col + '` DECIMAL(16,4) NOT NULL DEFAULT 0', function(err){
                    if(err){ console.log("alter t_partner_stats." + col + " failed:" + err.message); }
                });
            }, i * 200);
        });
        query('ALTER TABLE `t_reward_logs` MODIFY COLUMN `amount` DECIMAL(16,4) NOT NULL DEFAULT 0', function(err){
            if(err){ console.log("alter t_reward_logs.amount failed:" + err.message); }
        });
    }, 6900);
};

//写入一条乐豆流水(对局结算/保险柜存取等),失败不影响主流程
//roomUuid/gameIndex 用于「详情」按钮直接打开该局回放(取不到时为空,按钮不可点)
//tableName=牌桌真实名称,记录弹窗"玩法"列显示用
exports.add_bean_log = function(userid,roomid,gameType,changeType,amount,callback,roomUuid,gameIndex,clubId,partnerClubId,tableName){
    callback = callback == null? nop:callback;
    if(userid == null || amount == null || amount === 0){ callback(false); return; }
    var t = Math.ceil(Date.now()/1000);
    //amount 保留2位小数(抽水/分成可为分), 非法数值按0记
    var amt = Math.round((Number(amount) || 0) * 100) / 100;
    var sql = 'INSERT INTO t_bean_logs(userid,roomid,room_uuid,game_index,game_type,table_name,change_type,amount,create_time,club_id,partner_club_id) VALUES(' +
        parseInt(userid) + ',' + (parseInt(roomid) || 0) + ',"' + (roomUuid || '') + '",' + (parseInt(gameIndex) || 0) + ',"' +
        (gameType || '') + '","' + String(tableName || '').replace(/\\/g, "\\\\").replace(/'/g, "\\'") + '","' + (changeType || '') + '",' +
        amt + ',' + t + ',' + (parseInt(clubId) || 0) + ',' + (parseInt(partnerClubId) || 0) + ')';
    query(sql,function(err,rows){
        if(err){ console.log("add_bean_log failed:" + err.message); callback(false); return; }
        callback(true);
    });
};

//查询乐豆流水(按时间倒序,可传起始时间戳)
exports.get_bean_logs = function(userid,fromTime,callback,onlySettle){
    callback = callback == null? nop:callback;
    if(userid == null){ callback([]); return; }
    var sql = 'SELECT roomid,room_uuid,game_index,game_type,table_name,change_type,amount,create_time FROM t_bean_logs WHERE userid = ' + parseInt(userid);
    if(fromTime > 0){ sql += ' AND create_time >= ' + parseInt(fromTime); }
    if(onlySettle){ sql += ' AND change_type = "对局结算"'; }
    sql += ' ORDER BY create_time DESC,id DESC LIMIT 60';
    query(sql,function(err,rows){
        if(err){ console.log("get_bean_logs failed:" + err.message); callback([]); return; }
        callback(rows || []);
    });
};

exports.is_account_exist = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(false);
        return;
    }

    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else{
            if(rows.length > 0){
                callback(true);
            }
            else{
                callback(false);
            }
        }
    });
};

exports.create_account = function(account,password,callback){
    callback = callback == null? nop:callback;
    if(account == null || password == null){
        callback(false);
        return;
    }

    var psw = crypto.md5(password);
    var sql = 'INSERT INTO t_accounts(account,password) VALUES("' + account + '","' + psw + '")';
    query(sql, function(err, rows, fields) {
        if (err) {
            if(err.code == 'ER_DUP_ENTRY'){
                callback(false);
                return;         
            }
            callback(false);
            throw err;
        }
        else{
            callback(true);            
        }
    });
};

exports.get_account_info = function(account,password,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }  

    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        
        if(rows.length == 0){
            callback(null);
            return;
        }
        
        if(password != null){
        var psw = crypto.md5(password);
        if(rows[0].password != psw){
            callback(null); //密码不匹配
            return;
        }
    }

    callback(rows[0]);
    }); 
};

exports.is_user_exist = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(false);
        return;
    }

    var sql = 'SELECT userid FROM t_users WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }

        if(rows.length == 0){
            callback(false);
            return;
        }

        callback(true);
    });  
}


exports.get_user_data = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }

    var sql = 'SELECT userid,account,name,lv,exp,coins,gems,roomid FROM t_users WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.get_user_data_by_userid = function(userid,callback){
    callback = callback == null? nop:callback;
    if(userid == null){
        callback(null);
        return;
    }

    var sql = 'SELECT userid,account,name,lv,exp,coins,gems,roomid FROM t_users WHERE userid = ' + userid;
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

/**增加玩家房卡 */
exports.add_user_gems = function(userid,gems,callback,extra){
    callback = callback == null? nop:callback;
    if(userid == null){
        callback(false);
        return;
    }
    //金额统一收敛到2位小数(抽水/分成可为分); 0或非法值直接成功返回,不打扰主流程
    gems = Math.round((Number(gems) || 0) * 100) / 100;
    if(gems === 0){
        callback(true);
        return;
    }
    var sql = 'UPDATE t_users SET gems = gems +' + gems + ' WHERE userid = ' + userid;
    console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            console.log(err);
            callback(false);
            return;
        }
        else{
            //extra={roomid,gameType,changeType,roomUuid,gameIndex,clubId,partnerClubId,tableName}:记录一条乐豆流水(有额外信息时才写)
            if(extra){
                exports.add_bean_log(userid,extra.roomid,extra.gameType,extra.changeType,gems,null,extra.roomUuid,extra.gameIndex,extra.clubId,extra.partnerClubId,extra.tableName);
            }
            callback(rows.affectedRows > 0);
            return; 
        } 
    });
};

//查询玩家宝宝豆与保险柜余额
exports.get_user_safe = function(userid,callback){
    callback = callback == null? nop:callback;
    if(userid == null){ callback(null); return; }
    query('SELECT gems,safe_beans FROM t_users WHERE userid = ' + userid, function(err, rows){
        if(err || !rows || rows.length == 0){ callback(null); return; }
        callback({gems: Number(rows[0].gems) || 0, safe_beans: Number(rows[0].safe_beans) || 0});
    });
};

//保险柜存取:amount>0 存入(gems→safe_beans), amount<0 取出(safe_beans→gems)
//余额不足时返回 false,成功返回 {gems, safe_beans}
exports.safe_transfer = function(userid,amount,callback){
    callback = callback == null? nop:callback;
    if(userid == null || amount == null || amount === 0){ callback(false); return; }
    amount = parseInt(amount);
    if(!isFinite(amount)){ callback(false); return; }
    //先查当前余额
    exports.get_user_safe(userid, function(bal){
        if(bal == null){ callback(false); return; }
        if(amount > 0){
            //存入:gems 要足够
            if(bal.gems < amount){ callback(false,'宝宝豆不足'); return; }
            query('UPDATE t_users SET gems = gems - ' + amount + ', safe_beans = safe_beans + ' + amount + ' WHERE userid = ' + userid, function(err, rows){
                if(err){ console.log(err); callback(false); return; }
                exports.add_bean_log(userid,0,'','存入保险柜',-amount); //存保险柜:宝宝豆减少
                callback({gems: bal.gems - amount, safe_beans: bal.safe_beans + amount});
            });
        }
        else{
            //取出:safe_beans 要足够
            var wd = -amount;
            if(bal.safe_beans < wd){ callback(false,'保险柜余额不足'); return; }
            query('UPDATE t_users SET gems = gems + ' + wd + ', safe_beans = safe_beans - ' + wd + ' WHERE userid = ' + userid, function(err, rows){
                if(err){ console.log(err); callback(false); return; }
                exports.add_bean_log(userid,0,'','从保险柜取出',wd); //取保险柜:宝宝豆增加
                callback({gems: bal.gems + wd, safe_beans: bal.safe_beans - wd});
            });
        }
    });
};

exports.get_gems = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }

    var sql = 'SELECT gems FROM t_users WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }

        callback(rows[0]);
    });
}; 

exports.get_user_history = function(userId,callback){
    callback = callback == null? nop:callback;
    if(userId == null){
        callback(null);
        return;
    }

    var sql = 'SELECT history FROM t_users WHERE userid = "' + userId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        var history = rows[0].history;
        if(history == null || history == ""){
            callback(null);    
        }
        else{
            console.log(history.length);
            history = JSON.parse(history);
            callback(history);
        }        
    });
};

exports.update_user_history = function(userId,history,callback){
    callback = callback == null? nop:callback;
    if(userId == null || history == null){
        callback(false);
        return;
    }

    history = JSON.stringify(history);
    var sql = 'UPDATE t_users SET roomid = null, history = \'' + history + '\' WHERE userid = "' + userId + '"';
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }

        if(rows.length == 0){
            callback(false);
            return;
        }

        callback(true);
    });
};

exports.get_games_of_room = function(room_uuid,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null){
        callback(null);
        return;
    }

    var sql = 'SELECT game_index,create_time,result FROM t_games_archive WHERE room_uuid = "' + room_uuid + '"';
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }

        callback(rows);
    });
};

exports.get_detail_of_game = function(room_uuid,index,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null || index == null){
        callback(null);
        return;
    }
    var sql = 'SELECT base_info,action_records FROM t_games_archive WHERE room_uuid = "' + room_uuid + '" AND game_index = ' + index ;
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        callback(rows[0]);
    });
}

exports.create_user = function(account,name,coins,gems,sex,headimg,callback){
    callback = callback == null? nop:callback;
    if(account == null || name == null || coins==null || gems==null){
        callback(false);
        return;
    }
    if(headimg){
        headimg = '"' + headimg + '"';
    }
    else{
        headimg = 'null';
    }
    name = crypto.toBase64(name);
    var userId = generateUserId();

    var sql = 'INSERT INTO t_users(userid,account,name,coins,gems,sex,headimg) VALUES("{0}", "{1}","{2}",{3},{4},{5},{6})';
    sql = sql.format(userId,account,name,coins,gems,sex,headimg);
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(true);
    });
};

exports.update_user_info = function(userid,name,headimg,sex,callback){
    callback = callback == null? nop:callback;
    if(userid == null){
        callback(null);
        return;
    }
 
    if(headimg){
        headimg = '"' + headimg + '"';
    }
    else{
        headimg = 'null';
    }
    name = crypto.toBase64(name);
    var sql = 'UPDATE t_users SET name="{0}",headimg={1},sex={2} WHERE account="{3}"';
    sql = sql.format(name,headimg,sex,userid);
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(rows);
    });
};

exports.get_user_base_info = function(userid,callback){
    callback = callback == null? nop:callback;
    if(userid == null){
        callback(null);
        return;
    }
    var sql = 'SELECT name,sex,headimg FROM t_users WHERE userid={0}';
    sql = sql.format(userid);
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if(!rows || rows.length == 0){ callback(null); return; }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.is_room_exist = function(roomId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql, function(err, rows, fields) {
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(rows.length > 0);
        }
    });
};

exports.cost_gems = function(userid,cost,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_users SET gems = gems -' + cost + ' WHERE userid = ' + userid;
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(rows.length > 0);
        }
    });
};

//设置用户当前房间绑定:roomId=null时清空;oldRoomId传入时仅当当前绑定仍指向oldRoomId才清,
//防止"退出→立刻重进新房间"时退出线程的清绑定SQL后到误清新绑定(竞态)
exports.set_room_id_of_user = function(userId,roomId,oldRoomId,callback){
    if(typeof oldRoomId == 'function'){ callback = oldRoomId; oldRoomId = null; }
    callback = callback == null? nop:callback;
    if(roomId != null){
        roomId = '"' + roomId + '"';
    }
    var cond = 'userid = "' + userId + '"';
    if(roomId == null && oldRoomId != null){
        cond += ' AND roomid = "' + oldRoomId + '"';
    }
    var sql = 'UPDATE t_users SET roomid = '+ roomId + ' WHERE ' + cond;
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if(err){
            console.log(err);
            callback(false);
            throw err;
        }
        else{
            callback(rows.length > 0);
        }
    });
};

exports.get_room_id_of_user = function(userId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT roomid FROM t_users WHERE userid = "' + userId + '"';
    query(sql, function(err, rows, fields) {
        if(err){
            callback(null);
            throw err;
        }
        else{
            if(rows.length > 0){
                callback(rows[0].roomid);
            }
            else{
                callback(null);
            }
        }
    });
};


exports.clear_user_room_id = function(userId,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_users SET roomid = null WHERE userid = "' + userId + '"';
    query(sql, function(err, rows, fields) {
        if(err){
            callback(false);
            throw err;
        }
        callback(true);
    });
};

exports.create_room = function(roomId,conf,ip,port,create_time,callback){
    callback = callback == null? nop:callback;
    var sql = "INSERT INTO t_rooms(uuid,id,base_info,ip,port,create_time) \
                VALUES('{0}','{1}','{2}','{3}',{4},{5})";
    var uuid = Date.now() + roomId;
    var baseInfo = JSON.stringify(conf);
    sql = sql.format(uuid,roomId,baseInfo,ip,port,create_time);
    console.log(sql);
    query(sql,function(err,row,fields){
        if(err){
            callback(null);
            throw err;
        }
        else{
            callback(uuid);
        }
    });
};

exports.get_room_uuid = function(roomId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT uuid FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(null);
            throw err;
        }
        else{
            callback(rows[0].uuid);
        }
    });
};

exports.update_seat_info = function(roomId,seatIndex,userId,icon,name,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_rooms SET user_id{0} = {1},user_icon{0} = "{2}",user_name{0} = "{3}" WHERE id = "{4}"';
    name = crypto.toBase64(name);
    sql = sql.format(seatIndex,userId,icon,name,roomId);
    //console.log(sql);
    query(sql,function(err,row,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
}

//仅更新某座位积分(座位易主/退出/开局结算时持久化,服务重启恢复房间时用)
exports.update_seat_score = function(roomId,seatIndex,score,callback){
    callback = callback == null? nop:callback;
    if(seatIndex == null || seatIndex < 0 || seatIndex > 5){ callback(false); return; }
    var val = Number(score);
    if(isNaN(val)){ val = 0; }
    query('UPDATE t_rooms SET user_score' + seatIndex + ' = ' + val + ' WHERE id = "' + roomId + '"',function(err){
        if(err){ console.log('[update_seat_score] failed:',err.message); callback(false); return; }
        callback(true);
    });
};

exports.update_num_of_turns = function(roomId,numOfTurns,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_rooms SET num_of_turns = {0} WHERE id = "{1}"'
    sql = sql.format(numOfTurns,roomId);
    //console.log(sql);
    query(sql,function(err,row,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
};


exports.update_next_button = function(roomId,nextButton,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_rooms SET next_button = {0} WHERE id = "{1}"'
    sql = sql.format(nextButton,roomId);
    //console.log(sql);
    query(sql,function(err,row,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
};

exports.get_room_addr = function(roomId,callback){
    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(false,null,null);
        return;
    }

    var sql = 'SELECT ip,port FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql, function(err, rows, fields) {
        if(err){
            callback(false,null,null);
            throw err;
        }
        if(rows.length > 0){
            callback(true,rows[0].ip,rows[0].port);
        }
        else{
            callback(false,null,null);
        }
    });
};

exports.get_room_data = function(roomId,callback){
    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql, function(err, rows, fields) {
        if(err){
            callback(null);
            throw err;
        }
        if(rows.length > 0){
            //user_name 列存的是 base64, 统一解成明文再返回(空/NULL 跳过, 不再 break, 避免后面座位漏解)
            for(var i = 0; i < 16; ++i){
                var k = "user_name" + i;
                if(rows[0][k]){
                    try{ rows[0][k] = crypto.fromBase64(rows[0][k]); }catch(e){}
                }
            }
            callback(rows[0]);
        }
        else{
            callback(null);
        }
    });
};

exports.delete_room = function(roomId,callback){

    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(false);
    }
    var sql = "DELETE FROM t_rooms WHERE id = '{0}'";
    sql = sql.format(roomId);
    console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
}

//删除所有房间记录(GS启动时内存房间为空,库内房间均为死房间)
exports.delete_all_rooms = function(callback){
    callback = callback == null? nop:callback;
    query('DELETE FROM t_rooms',function(err){
        if(err){ console.log(err); callback(false); return; }
        callback(true);
    });
};

//清空所有用户房间映射(配合delete_all_rooms清理死房间残留)
exports.clear_all_user_roomids = function(callback){
    callback = callback == null? nop:callback;
    query('UPDATE t_users SET roomid = NULL WHERE roomid IS NOT NULL',function(err){
        if(err){ console.log(err); callback(false); return; }
        callback(true);
    });
};

//清空所有俱乐部桌面的房间绑定
exports.clear_all_club_table_rooms = function(callback){
    callback = callback == null? nop:callback;
    query('UPDATE t_club_tables SET roomid = NULL WHERE roomid IS NOT NULL',function(err){
        if(err){ console.log(err); callback(false); return; }
        callback(true);
    });
};

exports.create_game = function(room_uuid,index,base_info,callback){
    callback = callback == null? nop:callback;
    var sql = "INSERT INTO t_games(room_uuid,game_index,base_info,create_time) VALUES('{0}',{1},'{2}',unix_timestamp(now())) ON DUPLICATE KEY UPDATE base_info=VALUES(base_info)";
    sql = sql.format(room_uuid,index,base_info);
    //console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(null);
            console.log("create_game error:", err.message);
        }
        else{
            callback(rows.insertId);
        }
    });
};

exports.delete_games = function(room_uuid,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null){
        callback(false);
    }    
    var sql = "DELETE FROM t_games WHERE room_uuid = '{0}'";
    sql = sql.format(room_uuid);
    console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
}

exports.archive_games = function(room_uuid,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null){
        callback(false);
    }
    var sql = "INSERT INTO t_games_archive(SELECT * FROM t_games WHERE room_uuid = '{0}')";
    sql = sql.format(room_uuid);
    console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            exports.delete_games(room_uuid,function(ret){
                callback(ret);
            });
        }
    });
}

exports.update_game_action_records = function(room_uuid,index,actions,callback){
    callback = callback == null? nop:callback;
    var sql = "UPDATE t_games SET action_records = '"+ actions +"' WHERE room_uuid = '" + room_uuid + "' AND game_index = " + index ;
    //console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
};

exports.update_game_result = function(room_uuid,index,result,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null || !result){
        callback(false);
        return;
    }
    
    var sql = "UPDATE t_games SET result = '"+ result +"' WHERE room_uuid = '" + room_uuid + "' AND game_index = " + index ;
    //console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
};

//保存单局录像(覆盖同房间同局号);tableName=牌桌真实名称,战绩列表显示用
exports.save_replay = function(room_uuid,index,type,roomid,players,data,tableName,callback){
    if(callback == null && typeof tableName === 'function'){ callback = tableName; tableName = ''; }
    callback = callback == null? nop:callback;
    if(room_uuid == null || index == null || data == null){
        callback(false);
        return;
    }
    var tn = String(tableName || '').replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    var sql = "INSERT INTO t_replays(room_uuid,game_index,type,roomid,players,table_name,data,create_time) VALUES('" +
        room_uuid + "'," + index + ",'" + type + "'," + roomid + ",'" + players + "','" + tn + "','" + data + "',unix_timestamp(now()))" +
        " ON DUPLICATE KEY UPDATE type=VALUES(type),roomid=VALUES(roomid),players=VALUES(players),table_name=VALUES(table_name),data=VALUES(data),create_time=VALUES(create_time)";
    query(sql,function(err,rows,fields){
        if(err){
            console.log("save_replay error:", err.message);
            callback(false);
            return;
        }
        callback(true);
    });
};

//读取单局录像全量数据
exports.get_replay = function(room_uuid,index,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null || index == null){
        callback(null);
        return;
    }
    var sql = 'SELECT room_uuid,game_index,type,roomid,players,data,create_time FROM t_replays WHERE room_uuid = "' +
        room_uuid + '" AND game_index = ' + index;
    query(sql, function(err, rows){
        if(err){
            console.log("get_replay error:", err.message);
            callback(null);
            return;
        }
        if(rows.length == 0){
            callback(null);
            return;
        }
        callback(rows[0]);
    });
};

//某玩家3天内的录像列表,按 房间 -> 局 两级返回
exports.get_replay_list = function(userid,days,callback){
    callback = callback == null? nop:callback;
    if(userid == null){
        callback([]);
        return;
    }
    var span = (days || 3) * 86400;
    var sql = 'SELECT room_uuid,game_index,type,roomid,table_name,create_time FROM t_replays' +
        ' WHERE FIND_IN_SET(' + userid + ',players) AND create_time >= unix_timestamp(now()) - ' + span +
        ' ORDER BY create_time DESC';
    query(sql, function(err, rows){
        if(err){
            console.log("get_replay_list error:", err.message);
            callback([]);
            return;
        }
        var list = [];
        var map = {};
        for(var i = 0; i < rows.length; ++i){
            var r = rows[i];
            var g = map[r.room_uuid];
            if(g == null){
                g = {uuid: r.room_uuid, roomid: r.roomid, type: r.type, table_name: r.table_name || "", create_time: r.create_time, games: []};
                map[r.room_uuid] = g;
                list.push(g);
            }
            g.games.push({index: r.game_index, create_time: r.create_time});
        }
        callback(list);
    });
};

//清理超过保留期的录像
exports.clean_expired_replays = function(days,callback){
    callback = callback == null? nop:callback;
    var span = (days || 3) * 86400;
    var sql = 'DELETE FROM t_replays WHERE create_time < unix_timestamp(now()) - ' + span;
    query(sql, function(err, rows){
        if(err){
            console.log("clean_expired_replays error:", err.message);
            callback(false);
            return;
        }
        callback(true);
    });
};

exports.get_message = function(type,version,callback){
    callback = callback == null? nop:callback;

    //公告(大厅跑马灯)统一取后台「系统配置-公告内容」,不再读旧的 t_message,
    //避免后台改了配置、客户端仍显示旧公告
    if(type === 'notice'){
        query('SELECT v FROM t_sys_config WHERE k = "notice"', function(err, rows){
            if(err){
                console.log("get_message(notice) error:", err.message);
                callback(null);
                return;
            }
            callback(rows.length > 0 ? {msg: rows[0].v || "", version: "sys"} : null);
        });
        return;
    }
    
    var sql = 'SELECT * FROM t_message WHERE type = "'+ type + '"';
    
    if(version == "null"){
        version = null;
    }
    
    if(version){
        version = '"' + version + '"';
        sql += ' AND version != ' + version;   
    }
     
    query(sql, function(err, rows, fields) {
        if(err){
            callback(false);
            throw err;
        }
        else{
            if(rows.length > 0){
                callback(rows[0]);    
            }
            else{
                callback(null);
            }
        }
    });
};

exports.query = query;

/*==================== 系统配置 / 账号绑定 ====================*/
//读取全部系统配置(k->v)
exports.get_sys_config = function(callback){
    callback = callback == null? nop:callback;
    query('SELECT k,v FROM t_sys_config', function(err, rows){
        if(err){
            console.log(err);
            callback({});
            return;
        }
        var map = {};
        (rows || []).forEach(function(r){ map[r.k] = r.v; });
        callback(map);
    });
};

//查询账号绑定的主账号(未绑定返回null)
exports.get_bind_primary = function(account, callback){
    callback = callback == null? nop:callback;
    if(account == null || account == ""){
        callback(null);
        return;
    }
    var sql = 'SELECT primary_account FROM t_account_bind WHERE account_a = "' + account + '" OR account_b = "' + account + '" LIMIT 1';
    query(sql, function(err, rows){
        if(err || rows.length == 0){
            callback(null);
            return;
        }
        callback(rows[0].primary_account);
    });
};

//绑定游客账号与微信账号(已存在任一绑定则返回已有主账号,不重复绑定)
exports.bind_accounts = function(guestAccount, wxAccount, callback){
    callback = callback == null? nop:callback;
    var fn = function(){
        //主账号:优先取已有角色(存档)的游客账号,其次微信账号
        exports.is_user_exist(guestAccount, function(guestHas){
            var primaryAccount = guestHas ? guestAccount : wxAccount;
            var sql = 'INSERT INTO t_account_bind(account_a,account_b,primary_account,create_time) VALUES("' +
                guestAccount + '","' + wxAccount + '","' + primaryAccount + '",' + Math.ceil(Date.now()/1000) + ')';
            query(sql, function(err){
                if(err){
                    console.log("bind_accounts failed:" + err.message);
                    callback(null);
                    return;
                }
                callback(primaryAccount);
            });
        });
    };
    exports.get_bind_primary(guestAccount, function(p1){
        if(p1){ callback(p1); return; }
        exports.get_bind_primary(wxAccount, function(p2){
            if(p2){ callback(p2); return; }
            fn();
        });
    });
};

/*==================== 账号绑定/头像相关 ====================*/
//仅按账号名查询t_accounts记录(不校验密码)
exports.get_account_row = function(account, callback){
    callback = callback == null? nop:callback;
    if(account == null){ callback(null); return; }
    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
    query(sql, function(err, rows){
        if(err){ callback(null); return; }
        callback(rows.length > 0 ? rows[0] : null);
    });
};

//更新账号密码
exports.update_account_password = function(account, password, callback){
    callback = callback == null? nop:callback;
    var psw = crypto.md5(password);
    var sql = 'UPDATE t_accounts SET password = "' + psw + '" WHERE account = "' + account + '"';
    query(sql, function(err, rows){
        callback(!err && rows.affectedRows > 0);
    });
};

//查询主账号下的绑定记录(一个主账号可能有多条:wx/vivi各一条)
exports.get_bind_rows_by_primary = function(primary, callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT * FROM t_account_bind WHERE primary_account = "' + primary + '"';
    query(sql, function(err, rows){
        callback(err ? [] : rows);
    });
};

//把子账号绑定到主账号下(子账号已被绑走则失败)
exports.bind_to_primary = function(primary, subAccount, callback){
    callback = callback == null? nop:callback;
    exports.get_bind_primary(subAccount, function(p){
        if(p){ callback(p === primary); return; }
        var sql = 'INSERT INTO t_account_bind(account_a,account_b,primary_account,create_time) VALUES("' +
            primary + '","' + subAccount + '","' + primary + '",' + Math.ceil(Date.now()/1000) + ')';
        query(sql, function(err){
            if(err){ console.log("bind_to_primary failed:" + err.message); callback(false); return; }
            callback(true);
        });
    });
};

//按登录账号更新用户头像
exports.update_user_headimg = function(account, headimg, callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_users SET headimg = "' + headimg + '" WHERE account = "' + account + '"';
    query(sql, function(err, rows){
        callback(!err && rows.affectedRows > 0);
    });
};

//按登录账号更新用户昵称(name列存base64,与create_user/update_user_info一致)
exports.update_user_name = function(account, name, callback){
    callback = callback == null? nop:callback;
    if(account == null || name == null){
        callback(false);
        return;
    }
    var b64 = crypto.toBase64(name);
    var sql = 'UPDATE t_users SET name = "' + b64 + '" WHERE account = "' + account + '"';
    query(sql, function(err, rows){
        callback(!err && rows.affectedRows > 0);
    });
};

/*==================== 俱乐部相关 ====================*/
//查询用户是否代理
exports.is_agent = function(userid,callback){
    callback = callback == null? nop:callback;
    if(userid == null){
        callback(false);
        return;
    }
    var sql = 'SELECT is_agent FROM t_users WHERE userid = ' + userid;
    query(sql, function(err, rows){
        if(err || rows.length == 0){
            callback(false);
            return;
        }
        callback(rows[0].is_agent == 1);
    });
};

//创建俱乐部:parentClubId>0 表示社长开的子俱乐部,t_clubs 记录上级俱乐部
exports.club_create = function(name,ownerUserid,parentClubId,callback){
    if(typeof parentClubId === "function"){ //兼容旧调用(不传上级)
        callback = parentClubId;
        parentClubId = 0;
    }
    callback = callback == null? nop:callback;
    var pid = parseInt(parentClubId);
    if(!(pid > 0)){ pid = 0; }
    var createTime = Math.ceil(Date.now()/1000);
    var tries = 0;
    var attempt = function(){
        tries++;
        var clubId = 100000 + Math.floor(Math.random()*900000); //6位俱乐部ID
        var sql = 'INSERT INTO t_clubs(id,name,owner_userid,create_time,parent_clubid) VALUES(' + clubId + ',"' + name + '",' + ownerUserid + ',' + createTime + ',' + pid + ')';
        query(sql, function(err, rows){
            if(err){
                if(err.code == 'ER_DUP_ENTRY' && tries < 20){ attempt(); return; } //ID冲突重试
                console.log(err);
                callback(null);
                return;
            }
            //创建者自动加入为成员
            var sql2 = 'INSERT IGNORE INTO t_club_members(club_id,userid,join_time) VALUES(' + clubId + ',' + ownerUserid + ',' + createTime + ')';
            query(sql2, function(){ });
            callback(clubId);
        });
    };
    attempt();
};

//查询单个俱乐部
exports.club_get = function(clubId,callback){
    callback = callback == null? nop:callback;
    if(clubId == null){
        callback(null);
        return;
    }
    var sql = 'SELECT * FROM t_clubs WHERE id = ' + clubId;
    query(sql, function(err, rows){
        if(err || rows.length == 0){
            callback(null);
            return;
        }
        callback(rows[0]);
    });
};

//判断是否俱乐部成员
exports.club_is_member = function(clubId,userid,callback){
    callback = callback == null? nop:callback;
    if(clubId == null || userid == null){
        callback(false);
        return;
    }
    var sql = 'SELECT userid FROM t_club_members WHERE club_id = ' + clubId + ' AND userid = ' + userid;
    query(sql, function(err, rows){
        if(err){
            callback(false);
            return;
        }
        callback(rows.length > 0);
    });
};

//加入俱乐部
exports.club_join = function(clubId,userid,callback){
    callback = callback == null? nop:callback;
    var joinTime = Math.ceil(Date.now()/1000);
    var sql = 'INSERT IGNORE INTO t_club_members(club_id,userid,join_time) VALUES(' + clubId + ',' + userid + ',' + joinTime + ')';
    query(sql, function(err, rows){
        if(err){
            console.log(err);
            callback(false);
            return;
        }
        callback(rows.affectedRows > 0 || rows.insertId > 0);
    });
};

//退出俱乐部(普通成员)
exports.club_quit = function(clubId,userid,callback){
    callback = callback == null? nop:callback;
    var sql = 'DELETE FROM t_club_members WHERE club_id = ' + clubId + ' AND userid = ' + userid;
    query(sql, function(err, rows){
        callback(!err && rows.affectedRows > 0);
    });
};

//查用户所属俱乐部(取最新一个)的社长, 用于扣豆分成给代理; 无俱乐部或社长就是自己时返回 null
exports.get_user_agent = function(userid,callback){
    callback = callback == null ? nop : callback;
    if(userid == null){
        callback(null);
        return;
    }
    var sql = 'SELECT c.owner_userid FROM t_clubs c '
        + 'JOIN t_club_members m ON m.club_id = c.id AND m.userid = ' + userid
        + ' ORDER BY c.id DESC LIMIT 1';
    query(sql, function(err, rows){
        if(err || !rows || rows.length == 0){
            callback(null);
            return;
        }
        var owner = rows[0].owner_userid;
        if(owner == null || owner == userid){
            callback(null);
            return;
        }
        callback(owner);
    });
};

//我的俱乐部列表(含成员数)
exports.club_list_of_user = function(userid,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT c.id,c.name,c.owner_userid,c.parent_clubid,c.create_time,'
        + '(SELECT COUNT(*) FROM t_club_members m WHERE m.club_id = c.id) AS member_count,'
        + 'u.name AS owner_name '
        + 'FROM t_clubs c JOIN t_club_members m2 ON m2.club_id = c.id AND m2.userid = ' + userid
        + ' LEFT JOIN t_users u ON u.userid = c.owner_userid'
        + ' ORDER BY c.id DESC';
    query(sql, function(err, rows){
        if(err){
            console.log(err);
            callback([]);
            return;
        }
        // t_users.name 是 base64 存储, 与 club_list_admin 一致先解码再下发(否则俱乐部列表社长昵称显示成英文数字串)
        rows.forEach(function(r){ if(r.owner_name){ r.owner_name = crypto.fromBase64(r.owner_name); } });
        callback(rows);
    });
};

//查询某用户作为创建人的所有俱乐部
exports.clubs_by_owner = function(userid,callback){
    callback = callback == null? nop:callback;
    if(userid == null){ callback([]); return; }
    query('SELECT id,name FROM t_clubs WHERE owner_userid = ' + userid, function(err, rows){
        if(err){ console.log(err); callback([]); return; }
        callback(rows || []);
    });
};

//成员管理页:俱乐部成员详情(昵称/余额/头像key),按加入时间排序
exports.club_members_detail = function(clubId,callback){
    callback = callback == null? nop:callback;
    if(!(clubId > 0)){ callback([]); return; }
    var sql = 'SELECT m.userid,u.name,u.gems,u.headimg FROM t_club_members m JOIN t_users u ON u.userid = m.userid WHERE m.club_id = ' + parseInt(clubId) + ' ORDER BY m.join_time';
    query(sql, function(err, rows){
        if(err){ console.log(err); callback([]); return; }
        (rows || []).forEach(function(r){ try{ r.name = crypto.fromBase64(r.name); }catch(e){} });
        callback(rows || []);
    });
};

//豆豆管理页:俱乐部豆豆流水(本俱乐部成员的全部变动,按时间倒序)
exports.club_bean_logs = function(clubId,callback){
    callback = callback == null? nop:callback;
    if(!(clubId > 0)){ callback([]); return; }
    var sql = 'SELECT l.userid,u.name,l.roomid,l.game_type,l.table_name,l.change_type,l.amount,l.create_time FROM t_bean_logs l'
        + ' JOIN t_club_members m ON m.club_id = ' + parseInt(clubId) + ' AND m.userid = l.userid'
        + ' LEFT JOIN t_users u ON u.userid = l.userid'
        + ' ORDER BY l.create_time DESC,l.id DESC LIMIT 200';
    query(sql, function(err, rows){
        if(err){ console.log(err); callback([]); return; }
        (rows || []).forEach(function(r){ try{ r.name = crypto.fromBase64(r.name); }catch(e){ r.name = ''; } });
        callback(rows || []);
    });
};

//子俱乐部页:某俱乐部下的子俱乐部列表(名称/ID/人数/成员总豆豆)
exports.club_sub_list = function(clubId,callback){
    callback = callback == null? nop:callback;
    if(!(clubId > 0)){ callback([]); return; }
    var sql = 'SELECT c.id,c.name,'
        + '(SELECT COUNT(*) FROM t_club_members m WHERE m.club_id = c.id) AS member_count,'
        + '(SELECT IFNULL(SUM(u.gems),0) FROM t_club_members m2 JOIN t_users u ON u.userid = m2.userid WHERE m2.club_id = c.id) AS total_gems'
        + ' FROM t_clubs c WHERE c.parent_clubid = ' + parseInt(clubId) + ' ORDER BY c.id DESC';
    query(sql, function(err, rows){
        if(err){ console.log(err); callback([]); return; }
        callback(rows || []);
    });
};

//注销账号:删除用户及其创建的俱乐部、成员关系、绑定关系
exports.delete_user_account = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){ callback(false); return; }
    exports.get_user_data(account,function(data){
        if(data == null){ callback(false); return; }
        var userid = data.userid;
        //1. 删除该用户创建的所有俱乐部(级联清理成员/牌桌/玩法/管理员绑定)
        exports.clubs_by_owner(userid,function(clubs){
            var idx = 0;
            var delNextClub = function(){
                if(idx >= clubs.length){
                    //2. 从所有俱乐部成员表中移除该用户
                    query('DELETE FROM t_club_members WHERE userid = ' + userid, function(){
                        //3. 删除绑定关系
                        query('DELETE FROM t_user_bindings WHERE account_a = "' + account + '" OR account_b = "' + account + '"', function(){
                            //4. 删除用户主记录
                            query('DELETE FROM t_users WHERE account = "' + account + '"', function(err, rows){
                                if(err){ console.log(err); callback(false); return; }
                                callback(true);
                            });
                        });
                    });
                    return;
                }
                var cid = clubs[idx].id;
                idx++;
                exports.admin_club_delete(cid, function(){ delNextClub(); });
            };
            delNextClub();
        });
    });
};

//后台添加俱乐部桌面
exports.club_add_table = function(clubId,gameType,name,conf,callback){
    callback = callback == null? nop:callback;
    var createTime = Math.ceil(Date.now()/1000);
    //conf为JSON字符串含双引号,需SQL转义
    var escConf = String(conf).replace(/\\/g,"\\\\").replace(/"/g,'\\"');
    var escName = String(name).replace(/\\/g,"\\\\").replace(/"/g,'\\"');
    var sql = 'INSERT INTO t_club_tables(club_id,game_type,name,conf,create_time) VALUES('
        + clubId + ',"' + gameType + '","' + escName + '","' + escConf + '",' + createTime + ')';
    query(sql, function(err, rows){
        if(err){
            console.log(err);
            callback(null);
            return;
        }
        callback(rows.insertId);
    });
};

//删除俱乐部桌面
exports.club_delete_table = function(tableId,callback){
    callback = callback == null? nop:callback;
    var sql = 'DELETE FROM t_club_tables WHERE id = ' + tableId;
    query(sql, function(err, rows){
        callback(!err && rows.affectedRows > 0);
    });
};

//统计某个玩法配置下还剩多少张牌桌(后台删桌后判断是否可以顺带清掉空玩法)
exports.club_table_count_by_config = function(configId,callback){
    callback = callback == null? nop:callback;
    queryP('SELECT COUNT(*) AS cnt FROM t_club_tables WHERE game_config_id = ?',[configId],function(err,rows){
        callback(!err && rows && rows.length ? (Number(rows[0].cnt) || 0) : 0);
    });
};

//只删除玩法配置行(不动牌桌;用于牌桌删完后清理空玩法,不影响同类型的其它配置)
exports.club_game_delete_config_only = function(id,callback){
    callback = callback == null? nop:callback;
    queryP('DELETE FROM t_club_games WHERE id = ?',[id],function(err,rows){
        callback(!err && rows.affectedRows > 0);
    });
};

//俱乐部玩法列表(去重)
exports.club_game_types = function(clubId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT game_type,COUNT(*) AS table_count FROM t_club_tables WHERE club_id = ' + clubId + ' GROUP BY game_type ORDER BY game_type';
    query(sql, function(err, rows){
        if(err){
            callback([]);
            return;
        }
        callback(rows);
    });
};

//俱乐部某玩法的桌面列表(带当前人数);gameType为空时返回该俱乐部全部玩法的桌面
//玩法关闭(enabled=0)后,该玩法绑定的牌桌不再下发,客户端看不到也无法进入
exports.club_tables = function(clubId,gameType,callback,includeDisabled){
    callback = callback == null? nop:callback;
    //includeDisabled=true时(俱乐部管理页)不过滤已关闭玩法的牌桌;玩家大厅默认只显示启用玩法的牌桌
    var where = 'WHERE t.club_id = ' + clubId;
    if(!includeDisabled){
        where += ' AND ('
        + '  (t.game_config_id > 0 AND EXISTS(SELECT 1 FROM t_club_games g1 WHERE g1.id = t.game_config_id AND g1.enabled = 1))'
        + '  OR (t.game_config_id = 0 AND EXISTS(SELECT 1 FROM t_club_games g2 WHERE g2.club_id = t.club_id AND g2.game_type = t.game_type AND g2.enabled = 1))'
        + '  OR (t.game_config_id = 0 AND NOT EXISTS(SELECT 1 FROM t_club_games g3 WHERE g3.club_id = t.club_id AND g3.game_type = t.game_type))'
        + ')';
    }
    if(gameType){
        where += ' AND t.game_type = "' + gameType + '"';
    }
    var sql = 'SELECT t.id,t.name,t.game_type,t.roomid,t.conf,t.game_config_id,c.max_players AS max_players,'
        + 'IF(r.id IS NULL,0,(r.user_id0 > 0) + (r.user_id1 > 0) + (r.user_id2 > 0) + (r.user_id3 > 0)'
        + ' + (r.user_id4 > 0) + (r.user_id5 > 0)) AS player_count,'
        + 'r.num_of_turns,r.user_id0,r.user_id1,r.user_id2,r.user_id3,r.user_id4,r.user_id5,'
        + 'u0.name AS user_name0,u1.name AS user_name1,u2.name AS user_name2,'
        + 'u3.name AS user_name3,u4.name AS user_name4,u5.name AS user_name5 '
        + 'FROM t_club_tables t LEFT JOIN t_rooms r ON r.id = t.roomid '
        + 'LEFT JOIN t_game_config c ON c.type = t.game_type '
        + 'LEFT JOIN t_users u0 ON u0.userid = r.user_id0 '
        + 'LEFT JOIN t_users u1 ON u1.userid = r.user_id1 '
        + 'LEFT JOIN t_users u2 ON u2.userid = r.user_id2 '
        + 'LEFT JOIN t_users u3 ON u3.userid = r.user_id3 '
        + 'LEFT JOIN t_users u4 ON u4.userid = r.user_id4 '
        + 'LEFT JOIN t_users u5 ON u5.userid = r.user_id5 '
        + where + ' ORDER BY t.id';
    query(sql, function(err, rows){
        if(err){
            console.log(err);
            callback([]);
            return;
        }
        //t_users.name 存的是 base64, 直接返给客户端会显示成一串英文, 这里统一解码
        (rows || []).forEach(function(r){
            for(var i = 0; i <= 5; ++i){
                var k = "user_name" + i;
                if(r[k]){ try{ r[k] = crypto.fromBase64(r[k]); }catch(e){} }
            }
        });
        callback(rows);
    });
};

//更新牌桌自身参数(桌名+conf), 只影响这一张牌桌, 不影响同玩法的其它牌桌
exports.club_update_table_conf = function(tableId,name,conf,callback){
    callback = callback == null? nop:callback;
    if(!(tableId > 0)){ callback(false); return; }
    queryP('UPDATE t_club_tables SET name = ?, conf = ? WHERE id = ?',[name || "",JSON.stringify(conf || {}),tableId],function(err){
        callback(!err);
    });
};

//查询桌面
exports.club_get_table = function(tableId,callback){
    callback = callback == null? nop:callback;
    if(tableId == null){
        callback(null);
        return;
    }
    var sql = 'SELECT * FROM t_club_tables WHERE id = ' + tableId;
    query(sql, function(err, rows){
        if(err || rows.length == 0){
            callback(null);
            return;
        }
        callback(rows[0]);
    });
};

//绑定桌面当前房间
exports.club_set_table_room = function(tableId,roomId,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_club_tables SET roomid = ' + (roomId != null ? ('"' + roomId + '"') : 'NULL') + ' WHERE id = ' + tableId;
    query(sql, function(err){
        callback(!err);
    });
};

//按房间号解绑牌桌:房间销毁/释放时调用,把所有绑定到该房间的牌桌roomid置NULL,
//避免牌桌列表LEFT JOIN出已销毁房间的旧座位数据导致"牌桌一直显示被占用"
exports.club_unbind_room = function(roomId,callback){
    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(false);
        return;
    }
    var sql = "UPDATE t_club_tables SET roomid = NULL WHERE roomid = '{0}'".format(roomId);
    query(sql, function(err){
        if(err){ console.log(err); }
        callback(!err);
    });
};

/*==================== 俱乐部玩法(独立表)/后台管理 ====================*/
//带参数的查询(防注入)
function queryP(sql,params,callback){
    callback = callback == null? nop:callback;
    pool.getConnection(function(err,conn){
        if(err){
            callback(err,null);
            return;
        }
        conn.query(sql,params,function(qerr,vals,fields){
            conn.release();
            callback(qerr,vals,fields);
        });
    });
}

//解析俱乐部的顶级(一级)俱乐部:沿 parent_clubid 上溯, parent_clubid=0 即一级俱乐部
function resolve_top_club_id(clubId,callback,depth){
    callback = callback == null? nop:callback;
    depth = depth || 0;
    if(!(clubId > 0) || depth > 10){ callback(0); return; }
    queryP('SELECT id,parent_clubid FROM t_clubs WHERE id = ?',[clubId],function(err,rows){
        if(err || !rows || rows.length == 0){ callback(0); return; }
        var pid = parseInt(rows[0].parent_clubid) || 0;
        if(!(pid > 0) || pid == clubId){ callback(parseInt(rows[0].id) || 0); return; }
        resolve_top_club_id(pid,callback,depth + 1);
    });
}

//一级俱乐部的玩法对下级俱乐部全部继承:本俱乐部玩法优先, 同名(game_type)不重复下发
function merge_inherited_games(rows,clubId,topClubId){
    var ownTypes = {};
    (rows || []).forEach(function(r){
        if(Number(r.club_id) == Number(clubId)){ ownTypes[String(r.game_type)] = 1; }
    });
    var out = [];
    (rows || []).forEach(function(r){
        var inherited = (Number(r.club_id) != Number(clubId));
        if(inherited && topClubId && ownTypes[String(r.game_type)]){ return; }
        r.inherited = inherited ? 1 : 0;
        out.push(r);
    });
    return out;
}

//俱乐部玩法列表(含该玩法下的牌桌数/人数上限)
exports.club_games_with_count = function(clubId,callback){
    callback = callback == null? nop:callback;
    //联表全局玩法配置取max_players及玩法开关(cai7/remove_tiao/cai_chi等),供后台显示真实状态
    var sql = 'SELECT g.*, c.max_players AS max_players, '
        + 'c.cai7 AS cai7, c.remove_tiao AS remove_tiao, c.cai_chi AS cai_chi, c.cai_peng AS cai_peng, '
        + 'c.cai_gang AS cai_gang, c.dianpao_hu AS dianpao_hu, c.tianhu_di AS tianhu_di, c.cai_diao AS cai_diao, '
        + 'c.gp_bomb AS gp_bomb, c.gp_bomb_four AS gp_bomb_four, c.gp_four_two AS gp_four_two, c.gp_four_three AS gp_four_three, '
        + 'c.gp_three_one AS gp_three_one, c.gp_last_three_one AS gp_last_three_one, c.gp_last_four_two_three AS gp_last_four_two_three, '
        + 'c.gp_straight_a2 AS gp_straight_a2, c.gp_card_history AS gp_card_history, '
        //牌桌数按"当前俱乐部"统计:继承来的玩法也要显示本俱乐部已开的桌数
        + '(SELECT COUNT(*) FROM t_club_tables t WHERE t.club_id = ? AND t.game_type = g.game_type) AS table_count '
        + 'FROM t_club_games g LEFT JOIN t_game_config c ON c.type = g.game_type ';
    resolve_top_club_id(clubId,function(topClubId){
        var where, params;
        if(topClubId > 0 && topClubId != clubId){
            //本俱乐部 + 一级俱乐部(祖先)的玩法一起返回, 本俱乐部排前面
            where = 'WHERE (g.club_id = ? OR g.club_id = ?) ORDER BY (g.club_id = ?) DESC, g.sort, g.id';
            params = [clubId, clubId, topClubId, clubId];
        }else{
            where = 'WHERE g.club_id = ? ORDER BY g.sort, g.id';
            params = [clubId, clubId];
        }
        queryP(sql + where,params,function(err,rows){
            if(err){ console.log(err); callback([]); return; }
            callback(merge_inherited_games(rows,clubId,topClubId));
        });
    });
};

//单个俱乐部玩法
exports.club_game_get = function(id,callback){
    callback = callback == null? nop:callback;
    queryP('SELECT * FROM t_club_games WHERE id = ?',[id],function(err,rows){
        if(err || rows.length == 0){ callback(null); return; }
        callback(rows[0]);
    });
};

//新增俱乐部玩法
exports.club_game_add = function(clubId,gameType,name,difen,jushu,cost,sort,taiRules,callback){
    if(typeof taiRules === 'function'){ callback = taiRules; taiRules = undefined; }
    callback = callback == null? nop:callback;
    var createTime = Math.ceil(Date.now()/1000);
    var taiRulesStr = taiRules ? JSON.stringify(taiRules) : null;
    var sql = 'INSERT INTO t_club_games(club_id,game_type,name,difen_options,jushu_options,cost_options,sort,tai_rules,enabled,create_time) VALUES(?,?,?,?,?,?,?,?,1,?)';
    queryP(sql,[clubId,gameType,name,JSON.stringify(difen),JSON.stringify(jushu),JSON.stringify(cost),sort||0,taiRulesStr,createTime],function(err,rows){
        if(err){ console.log(err); callback(null); return; }
        callback(rows.insertId);
    });
};

//单个俱乐部玩法(按俱乐部+玩法类型)
exports.club_game_get_by_type = function(clubId,gameType,callback){
    callback = callback == null? nop:callback;
    queryP('SELECT * FROM t_club_games WHERE club_id = ? AND game_type = ? ORDER BY id LIMIT 1',[clubId,gameType],function(err,rows){
        if(err || rows.length == 0){ callback(null); return; }
        callback(rows[0]);
    });
};

//更新俱乐部玩法
exports.club_game_update = function(id,fields,callback){
    callback = callback == null? nop:callback;
    var sets = [];
    var params = [];
    if(fields.name != null){ sets.push('name = ?'); params.push(fields.name); }
    if(fields.difen_options){ sets.push('difen_options = ?'); params.push(JSON.stringify(fields.difen_options)); }
    if(fields.jushu_options){ sets.push('jushu_options = ?'); params.push(JSON.stringify(fields.jushu_options)); }
    if(fields.cost_options){ sets.push('cost_options = ?'); params.push(JSON.stringify(fields.cost_options)); }
    //台数规则:显式传 null 表示清空(留空按默认值)
    if(fields.tai_rules !== undefined){ sets.push('tai_rules = ?'); params.push(fields.tai_rules == null ? null : JSON.stringify(fields.tai_rules)); }
    if(fields.sort != null){ sets.push('sort = ?'); params.push(fields.sort); }
    if(fields.enabled != null){ sets.push('enabled = ?'); params.push(fields.enabled ? 1 : 0); }
    if(sets.length == 0){ callback(false); return; }
    params.push(id);
    queryP('UPDATE t_club_games SET ' + sets.join(',') + ' WHERE id = ?',params,function(err,rows){
        if(err){ console.log(err); callback(false); return; }
        callback(rows.affectedRows > 0);
    });
};

//删除俱乐部玩法(连同该玩法下的牌桌)
exports.club_game_delete = function(id,callback){
    callback = callback == null? nop:callback;
    exports.club_game_get(id,function(g){
        if(g == null){ callback(false); return; }
        queryP('DELETE FROM t_club_tables WHERE club_id = ? AND game_type = ?',[g.club_id,g.game_type],function(){
            queryP('DELETE FROM t_club_games WHERE id = ?',[id],function(err,rows){
                if(err){ console.log(err); callback(false); return; }
                callback(rows.affectedRows > 0);
            });
        });
    });
};

// ============ 俱乐部玩法配置(多配置/抽水/暗水/房费) ============

//牌桌conf:把玩法配置里与牌桌展示/开局相关的数据一起写进牌桌,保证牌桌直接可用
function buildTableConf(gameType,config){
    var difens = config.difen_options || [];
    var jushus = config.jushu_options || [];
    return JSON.stringify({
        type: gameType,
        difen: 0,
        difen_value: difens.length > 0 ? Number(difens[0]) : 0,
        jushuxuanze: 0,
        jushu_value: jushus.length > 0 ? Number(jushus[0]) : 0,
        //房卡单价: 俱乐部为本桌单独配置的扣费(开局按局扣), 未配置时由游戏服按全局option取
        cost: (config.cost_options && config.cost_options.length) ? Number(config.cost_options[0]) : 0,
        banker_mode: 1,
        min_players: config.min_players || 2,
        max_players: config.max_players_custom || 6,
        min_bean: config.min_bean || 0,
        kick_bean: config.kick_bean || 0,
        face_score: config.face_score || 0,
        shuffle_score: config.shuffle_score || 0,
        rake_percent: config.rake_percent || 0,
        hidden_rake_percent: config.hidden_rake_percent || 0,
        rake_per_round: config.rake_per_round != null ? Number(config.rake_per_round) : 1,
        room_fee: config.room_fee || 0,
        room_fee_payer: config.room_fee_payer || 0
    });
}

//新增俱乐部玩法配置并自动创建一张牌桌
exports.club_game_add_with_config = function(clubId,gameType,name,config,callback){
    callback = callback == null? nop:callback;
    var createTime = Math.ceil(Date.now()/1000);
    //去万/去条/去筒并入 tai_rules JSON 存储(三选互斥,客户端提交全量三键)
    var trAdd = config.tai_rules;
    if(typeof trAdd === 'string'){ try{ trAdd = JSON.parse(trAdd); }catch(e){ trAdd = null; } }
    if(config.remove_wan != null || config.remove_tiao != null || config.remove_tong != null){
        trAdd = trAdd || {};
        ['remove_wan','remove_tiao','remove_tong'].forEach(function(k){
            if(config[k] != null){ trAdd[k] = config[k] ? 1 : 0; }
        });
    }
    var taiRulesStr = trAdd ? JSON.stringify(trAdd) : null;
    //同一俱乐部同一玩法只允许一条配置(club_type唯一键): 已存在时更新配置并再开一张牌桌, 不再插入
    queryP('SELECT id FROM t_club_games WHERE club_id = ? AND game_type = ?',[clubId,gameType],function(e0,ex){
        if(e0){ console.log(e0); callback(null); return; }
        if(ex && ex.length){
            var oldId = ex[0].id;
            //不把 name 传给配置: 避免把该玩法下已有牌桌一起改名(桌名只属于牌桌)
            var cfgFields = {};
            for(var k in config){ if(k !== 'name'){ cfgFields[k] = config[k]; } }
            exports.club_game_update_config(oldId,cfgFields,function(){
                exports.club_add_table(clubId,gameType,name,buildTableConf(gameType,config),function(tableId){
                    if(tableId != null){
                        queryP('UPDATE t_club_tables SET game_config_id = ? WHERE id = ?',[oldId,tableId],function(){});
                    }
                    callback(oldId);
                });
            });
            return;
        }
        var sql = 'INSERT INTO t_club_games(club_id,game_type,name,difen_options,jushu_options,cost_options,sort,tai_rules,enabled,create_time,min_players,max_players_custom,rake_percent,hidden_rake_percent,rake_per_round,room_fee,room_fee_payer,face_score,shuffle_score,min_bean,kick_bean) VALUES(?,?,?,?,?,?,?,?,1,?,?,?,?,?,?,?,?,?,?,?,?)';
        queryP(sql,[
            clubId, gameType, name,
            JSON.stringify(config.difen_options || [1,2,5]),
            JSON.stringify(config.jushu_options || [4,8]),
            JSON.stringify(config.cost_options || [2,3]),
            config.sort || 0, taiRulesStr, createTime,
            config.min_players || 2,
            config.max_players_custom || 6,
            config.rake_percent || 0,
            config.hidden_rake_percent || 0,
            config.rake_per_round != null ? config.rake_per_round : 1,
            config.room_fee || 0,
            config.room_fee_payer || 0,
            config.face_score || 0,
            config.shuffle_score || 0,
            config.min_bean || 0,
            config.kick_bean || 0
        ],function(err,rows){
            if(err){ console.log(err); callback(null); return; }
            var configId = rows.insertId;
            //自动创建一张牌桌:桌名=用户输入的玩法名,配置数据一并写进牌桌conf
            exports.club_add_table(clubId, gameType, name, buildTableConf(gameType,config), function(tableId){
                if(tableId != null){
                    queryP('UPDATE t_club_tables SET game_config_id = ? WHERE id = ?',[configId, tableId],function(){});
                }
                callback(configId);
            });
        });
    });
};

//更新俱乐部玩法配置(含扩展字段)
exports.club_game_update_config = function(id,fields,callback){
    callback = callback == null? nop:callback;
    //去万/去条/去筒:先读出已有 tai_rules 合并后再更新(客户端提交全量三键,0 也要写入防残留)
    if(fields.remove_wan != null || fields.remove_tiao != null || fields.remove_tong != null){
        var removeVals = {};
        ['remove_wan','remove_tiao','remove_tong'].forEach(function(k){
            if(fields[k] != null){ removeVals[k] = fields[k] ? 1 : 0; }
            delete fields[k];
        });
        queryP('SELECT tai_rules FROM t_club_games WHERE id = ?',[id],function(e,rows){
            var tr = null;
            if(!e && rows && rows.length && rows[0].tai_rules){
                try{ tr = typeof rows[0].tai_rules === 'string' ? JSON.parse(rows[0].tai_rules) : rows[0].tai_rules; }catch(e2){ tr = null; }
            }
            tr = tr || {};
            for(var k in removeVals){ tr[k] = removeVals[k]; }
            fields.tai_rules = tr;
            exports.club_game_update_config(id,fields,callback);
        });
        return;
    }
    var sets = [];
    var params = [];
    if(fields.name != null){ sets.push('name = ?'); params.push(fields.name); }
    if(fields.difen_options){ sets.push('difen_options = ?'); params.push(JSON.stringify(fields.difen_options)); }
    if(fields.jushu_options){ sets.push('jushu_options = ?'); params.push(JSON.stringify(fields.jushu_options)); }
    if(fields.cost_options){ sets.push('cost_options = ?'); params.push(JSON.stringify(fields.cost_options)); }
    if(fields.tai_rules !== undefined){ sets.push('tai_rules = ?'); params.push(fields.tai_rules == null ? null : JSON.stringify(fields.tai_rules)); }
    if(fields.sort != null){ sets.push('sort = ?'); params.push(fields.sort); }
    if(fields.enabled != null){ sets.push('enabled = ?'); params.push(fields.enabled ? 1 : 0); }
    if(fields.min_players != null){ sets.push('min_players = ?'); params.push(fields.min_players); }
    if(fields.max_players_custom != null){ sets.push('max_players_custom = ?'); params.push(fields.max_players_custom); }
    if(fields.rake_percent != null){ sets.push('rake_percent = ?'); params.push(fields.rake_percent); }
    if(fields.hidden_rake_percent != null){ sets.push('hidden_rake_percent = ?'); params.push(fields.hidden_rake_percent); }
    if(fields.rake_per_round != null){ sets.push('rake_per_round = ?'); params.push(fields.rake_per_round); }
    if(fields.room_fee != null){ sets.push('room_fee = ?'); params.push(fields.room_fee); }
    if(fields.room_fee_payer != null){ sets.push('room_fee_payer = ?'); params.push(fields.room_fee_payer); }
    if(fields.face_score != null){ sets.push('face_score = ?'); params.push(fields.face_score); }
    if(fields.shuffle_score != null){ sets.push('shuffle_score = ?'); params.push(fields.shuffle_score); }
    if(fields.min_bean != null){ sets.push('min_bean = ?'); params.push(fields.min_bean); }
    if(fields.kick_bean != null){ sets.push('kick_bean = ?'); params.push(fields.kick_bean); }
    if(sets.length == 0){ callback(false); return; }
    params.push(id);
    queryP('UPDATE t_club_games SET ' + sets.join(',') + ' WHERE id = ?',params,function(err,rows){
        if(err){ console.log(err); callback(false); return; }
        //不再把配置同步写回牌桌conf: 每张牌桌的参数独立(在牌桌编辑里单独改),
        //否则改一张牌桌会连带把同玩法的其它牌桌参数覆盖掉
        callback(rows.affectedRows > 0);
    });
};

//获取俱乐部玩法配置列表(含扩展字段;一级俱乐部玩法对下级全部继承)
exports.club_game_get_configs = function(clubId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT g.*, c.max_players AS max_players_global, '
        + '(SELECT COUNT(*) FROM t_club_tables t WHERE t.club_id = ? AND t.game_type = g.game_type) AS table_count '
        + 'FROM t_club_games g LEFT JOIN t_game_config c ON c.type = g.game_type ';
    resolve_top_club_id(clubId,function(topClubId){
        var where, params;
        if(topClubId > 0 && topClubId != clubId){
            where = 'WHERE (g.club_id = ? OR g.club_id = ?) ORDER BY (g.club_id = ?) DESC, g.sort, g.id';
            params = [clubId, clubId, topClubId, clubId];
        }else{
            where = 'WHERE g.club_id = ? ORDER BY g.sort, g.id';
            params = [clubId, clubId];
        }
        queryP(sql + where,params,function(err,rows){
            if(err){ console.log(err); callback([]); return; }
            rows = merge_inherited_games(rows,clubId,topClubId);
            rows.forEach(function(r){
                try{ r.difen_options = JSON.parse(r.difen_options); }catch(e){}
                try{ r.jushu_options = JSON.parse(r.jushu_options); }catch(e){}
                try{ r.cost_options = JSON.parse(r.cost_options); }catch(e){}
                try{ r.tai_rules = r.tai_rules ? JSON.parse(r.tai_rules) : null; }catch(e){ r.tai_rules = null; }
            });
            callback(rows || []);
        });
    });
};

//按配置id获取俱乐部玩法
exports.club_game_get_config = function(id,callback){
    callback = callback == null? nop:callback;
    queryP('SELECT * FROM t_club_games WHERE id = ?',[id],function(err,rows){
        if(err || rows.length == 0){ callback(null); return; }
        var r = rows[0];
        try{ r.difen_options = JSON.parse(r.difen_options); }catch(e){}
        try{ r.jushu_options = JSON.parse(r.jushu_options); }catch(e){}
        try{ r.cost_options = JSON.parse(r.cost_options); }catch(e){}
        try{ r.tai_rules = r.tai_rules ? JSON.parse(r.tai_rules) : null; }catch(e){ r.tai_rules = null; }
        callback(r);
    });
};

//按俱乐部+玩法类型获取第一个启用的配置(房间创建时注入用)
exports.club_game_get_config_by_club_type = function(clubId,gameType,callback){
    callback = callback == null? nop:callback;
    queryP('SELECT * FROM t_club_games WHERE club_id = ? AND game_type = ? AND enabled = 1 ORDER BY sort,id LIMIT 1',[clubId,gameType],function(err,rows){
        if(err || rows.length == 0){ callback(null); return; }
        var r = rows[0];
        try{ r.difen_options = JSON.parse(r.difen_options); }catch(e){}
        try{ r.jushu_options = JSON.parse(r.jushu_options); }catch(e){}
        try{ r.cost_options = JSON.parse(r.cost_options); }catch(e){}
        try{ r.tai_rules = r.tai_rules ? JSON.parse(r.tai_rules) : null; }catch(e){ r.tai_rules = null; }
        callback(r);
    });
};

// ============ 合伙人(子俱乐部)管理 ============

//合伙人列表: 递归所有下级俱乐部(BFS 子树, 最多 5 层防环路)
//每行附加 parent_clubid / parent_club_name / level, 前端据此显示"归属"
exports.partner_list = function(clubId,callback){
    callback = callback == null? nop:callback;
    var MAX_DEPTH = 5;
    var visited = {};
    var queue = [{ club_id: clubId, depth: 0 }];
    var results = [];
    var inFlight = 0; //未完成的 DB 查询数(BFS 查询子级 + 每条的详情查询)

    var tryFinalize = function(){
        if(queue.length > 0 || inFlight > 0){ return; }
        if(results.length === 0){ callback([]); return; }
        //最后一轮: 每个结果行查顶级俱乐部视角下的 stats(顶级 owner 对 2 级/3 级可能没直接行, 填零)
        var pending = results.length;
        results.forEach(function(r){
            exports.partner_stats_row(clubId, r.id, function(st){
                if(st){
                    r.profit_ratio = st.profit_ratio != null ? st.profit_ratio : 0;
                    r.fee_profit_ratio = st.fee_profit_ratio != null ? st.fee_profit_ratio : 0;
                    r.hidden_profit_ratio = st.hidden_profit_ratio != null ? st.hidden_profit_ratio : 0;
                    r.today_game_score = st.today_game_score != null ? st.today_game_score : 0;
                    r.today_rake = st.today_rake != null ? st.today_rake : 0;
                    r.today_hidden_rake = st.today_hidden_rake != null ? st.today_hidden_rake : 0;
                    r.today_partner_profit = st.today_partner_profit != null ? st.today_partner_profit : 0;
                    r.yesterday_game_score = st.yesterday_game_score != null ? st.yesterday_game_score : 0;
                    r.yesterday_rake = st.yesterday_rake != null ? st.yesterday_rake : 0;
                    r.yesterday_hidden_rake = st.yesterday_hidden_rake != null ? st.yesterday_hidden_rake : 0;
                    r.yesterday_partner_profit = st.yesterday_partner_profit != null ? st.yesterday_partner_profit : 0;
                    r.total_game_score = st.total_game_score != null ? st.total_game_score : 0;
                    r.total_rake = st.total_rake != null ? st.total_rake : 0;
                    r.total_hidden_rake = st.total_hidden_rake != null ? st.total_hidden_rake : 0;
                    r.total_partner_profit = st.total_partner_profit != null ? st.total_partner_profit : 0;
                    r.direct_member_count = st.direct_member_count != null ? st.direct_member_count : 0;
                    r.chain_member_count = st.chain_member_count != null ? st.chain_member_count : 0;
                    r.chain_total_gems = st.total_gems != null ? st.total_gems : 0;
                    r.warning_value = st.warning_value != null ? st.warning_value : 0;
                } else {
                    r.profit_ratio = 0; r.fee_profit_ratio = 0; r.hidden_profit_ratio = 0; r.today_game_score = 0; r.today_rake = 0; r.today_hidden_rake = 0; r.today_partner_profit = 0;
                    r.yesterday_game_score = 0; r.yesterday_rake = 0; r.yesterday_hidden_rake = 0; r.yesterday_partner_profit = 0;
                    r.total_game_score = 0; r.total_rake = 0; r.total_hidden_rake = 0; r.total_partner_profit = 0;
                    r.direct_member_count = 0; r.chain_member_count = 0; r.chain_total_gems = 0; r.warning_value = 0;
                }
                pending--;
                if(pending <= 0){
                    results.sort(function(a,b){ return b.id - a.id; });
                    callback(results);
                }
            });
        });
    };

    var bfsNext = function(){
        if(queue.length === 0){ tryFinalize(); return; }
        var cur = queue.shift();
        visited[cur.club_id] = true;
        //查子级俱乐部
        inFlight++;
        queryP('SELECT id,parent_clubid FROM t_clubs WHERE parent_clubid = ? AND id != ?',[cur.club_id, cur.club_id],function(err,kids){
            inFlight--;
            if(err){ bfsNext(); return; }
            //把未访问的入队(同时并行查详情)
            var todo = [];
            for(var i = 0; i < kids.length; ++i){
                var k = kids[i];
                if(visited[k.id]){ continue; } //防环路
                visited[k.id] = true;
                if(cur.depth + 1 < MAX_DEPTH){ queue.push({ club_id: k.id, depth: cur.depth + 1 }); }
                todo.push(k);
            }
            //并行查每个 kid 的详情
            for(var j = 0; j < todo.length; ++j){
                inFlight++;
                (function(kid){
                    queryP('SELECT c.id,c.name,c.owner_userid,c.create_time,'
                        + '(SELECT COUNT(*) FROM t_club_members m WHERE m.club_id = c.id) AS member_count,'
                        + '(SELECT IFNULL(SUM(u2.gems),0) FROM t_club_members m2 JOIN t_users u2 ON u2.userid = m2.userid WHERE m2.club_id = c.id) AS total_gems,'
                        + 'u.headimg, u.name AS owner_name, pc.name AS parent_club_name '
                        + 'FROM t_clubs c LEFT JOIN t_clubs pc ON pc.id = c.parent_clubid '
                        + 'LEFT JOIN t_users u ON u.userid = c.owner_userid '
                        + 'WHERE c.id = ?',[kid.id],function(err2,rows2){
                        inFlight--;
                        if(!err2 && rows2 && rows2.length){
                            var r = rows2[0];
                            r.level = cur.depth + 1;
                            r.parent_clubid = kid.parent_clubid;
                            if(r.parent_clubid == clubId){ r.parent_club_name = "顶级合伙人"; }
                            //t_users.name 是 base64, 解成明文再给前端
                            if(r.owner_name){ try{ r.owner_name = crypto.fromBase64(r.owner_name); }catch(e){} }
                            results.push(r);
                        }
                        tryFinalize();
                    });
                })(todo[j]);
            }
            bfsNext(); //继续处理下一层
        });
    };

    visited[clubId] = true;
    bfsNext();
};

//查单个合伙人的顶级俱乐部视角 stats 行(可能不存在则返回 null)
exports.partner_stats_row = function(topClubId,partnerClubId,callback){
    callback = callback == null? nop:callback;
    queryP('SELECT * FROM t_partner_stats WHERE club_id = ? AND partner_club_id = ?',[topClubId,partnerClubId],function(err,rows){
        if(err || !rows || rows.length === 0){ callback(null); return; }
        callback(rows[0]);
    });
};

//获取单个合伙人信息
exports.partner_get = function(clubId,partnerClubId,callback){
    callback = callback == null? nop:callback;
    queryP('SELECT * FROM t_partner_stats WHERE club_id = ? AND partner_club_id = ?',[clubId,partnerClubId],function(err,rows){
        if(err || rows.length == 0){ callback(null); return; }
        callback(rows[0]);
    });
};

//创建/更新合伙人统计记录
//用 INSERT ... ON DUPLICATE KEY UPDATE 单语句完成: 先 SELECT 再 INSERT/UPDATE 存在并发窗口,
//"设为合伙人"刚建完记录时立刻改比例会因 INSERT 撞唯一键(club_id,partner_club_id)而失败
exports.partner_upsert = function(clubId,partnerClubId,fields,callback){
    callback = callback == null? nop:callback;
    var now = Math.ceil(Date.now()/1000);
    var hasRatio = fields.profit_ratio != null;
    var hasFeeRatio = fields.fee_profit_ratio != null;
    var hasHiddenRatio = fields.hidden_profit_ratio != null;
    var hasWarn = fields.warning_value != null;
    var cols = ['club_id','partner_club_id','profit_ratio','create_time','update_time'];
    var params = [clubId,partnerClubId,hasRatio ? fields.profit_ratio : 0,now,now];
    var dup = ['update_time = VALUES(update_time)'];
    if(hasRatio){ dup.push('profit_ratio = VALUES(profit_ratio)'); }
    if(hasFeeRatio){
        cols.push('fee_profit_ratio'); params.push(fields.fee_profit_ratio);
        dup.push('fee_profit_ratio = VALUES(fee_profit_ratio)');
    }
    if(hasHiddenRatio){
        cols.push('hidden_profit_ratio'); params.push(fields.hidden_profit_ratio);
        dup.push('hidden_profit_ratio = VALUES(hidden_profit_ratio)');
    }
    if(hasWarn){
        cols.push('warning_value'); params.push(fields.warning_value);
        dup.push('warning_value = VALUES(warning_value)');
    }
    var sql = 'INSERT INTO t_partner_stats(' + cols.join(',') + ') VALUES('
        + cols.map(function(){ return '?'; }).join(',') + ') ON DUPLICATE KEY UPDATE ' + dup.join(',');
    queryP(sql,params,function(err){
        if(err){ console.log(err); callback(false); return; }
        callback(true);
    });
};

//更新合伙人统计(累加)
exports.partner_add_stats = function(clubId,partnerClubId,fields,callback){
    callback = callback == null? nop:callback;
    var now = Math.ceil(Date.now()/1000);
    var sets = [];
    var params = [];
    if(fields.game_score != null && fields.game_score > 0){ sets.push('today_game_score = today_game_score + ?'); params.push(fields.game_score); sets.push('total_game_score = total_game_score + ?'); params.push(fields.game_score); }
    if(fields.rake != null && fields.rake > 0){ sets.push('today_rake = today_rake + ?'); params.push(fields.rake); sets.push('total_rake = total_rake + ?'); params.push(fields.rake); }
    if(fields.hidden_rake != null && fields.hidden_rake > 0){ sets.push('today_hidden_rake = today_hidden_rake + ?'); params.push(fields.hidden_rake); sets.push('total_hidden_rake = total_hidden_rake + ?'); params.push(fields.hidden_rake); }
    // partner_profit 只累加正数(分成收入); 负数可能来自错误调用 partner_gems, 忽略
    if(fields.partner_profit != null && fields.partner_profit > 0){ sets.push('today_partner_profit = today_partner_profit + ?'); params.push(fields.partner_profit); sets.push('total_partner_profit = total_partner_profit + ?'); params.push(fields.partner_profit); }
    // partner_total: 从下级抽到的总额(未扣给上级), club_overview 用它算"被上级抽走了多少"
    if(fields.partner_total != null && fields.partner_total > 0){ sets.push('partner_total = partner_total + ?'); params.push(fields.partner_total); }
    if(sets.length == 0){ callback(true); return; }
    sets.push('update_time = ?'); params.push(now);
    params.push(clubId); params.push(partnerClubId);
    queryP('UPDATE t_partner_stats SET ' + sets.join(',') + ' WHERE club_id = ? AND partner_club_id = ?',params,function(err,rows){
        if(err){ console.log(err); callback(false); return; }
        callback(true);
    });
};

//合伙人收益详情(按天分组)
exports.partner_profit_detail = function(clubId,partnerClubId,fromTime,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT DATE_FORMAT(FROM_UNIXTIME(create_time),"%Y-%m-%d") AS day,'
        + 'SUM(amount) AS total, COUNT(*) AS cnt '
        + 'FROM t_bean_logs WHERE club_id = ? AND partner_club_id = ? AND change_type = "合伙人分成" ';
    var params = [clubId,partnerClubId];
    if(fromTime > 0){ sql += 'AND create_time >= ? '; params.push(fromTime); }
    sql += 'GROUP BY day ORDER BY day DESC LIMIT 30';
    queryP(sql,params,function(err,rows){
        if(err){ console.log(err); callback([]); return; }
        callback(rows || []);
    });
};

//合伙人统计(按日/累计)
exports.partner_stats_overview = function(clubId,callback){
    callback = callback == null? nop:callback;
    var today = new Date(); today.setHours(0,0,0,0);
    var todayTs = Math.ceil(today.getTime()/1000);
    var yesterday = new Date(today.getTime() - 86400000);
    var yesterdayTs = Math.ceil(yesterday.getTime()/1000);
    var beforeYesterday = new Date(today.getTime() - 172800000);
    var beforeYesterdayTs = Math.ceil(beforeYesterday.getTime()/1000);
    var sql = 'SELECT '
        + 'SUM(CASE WHEN create_time >= ? THEN amount ELSE 0 END) AS today_total,'
        + 'SUM(CASE WHEN create_time >= ? AND create_time < ? THEN amount ELSE 0 END) AS yesterday_total,'
        + 'SUM(CASE WHEN create_time >= ? AND create_time < ? THEN amount ELSE 0 END) AS before_yesterday_total,'
        + 'SUM(amount) AS total '
        + 'FROM t_bean_logs WHERE club_id = ? AND change_type = "合伙人分成"';
    queryP(sql,[todayTs,yesterdayTs,todayTs,beforeYesterdayTs,yesterdayTs,clubId],function(err,rows){
        if(err){ console.log(err); callback(null); return; }
        callback(rows[0] || null);
    });
};

//奖励明细查询
exports.reward_logs = function(clubId,partnerClubId,rewardType,fromTime,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT * FROM t_reward_logs WHERE club_id = ? ';
    var params = [clubId];
    if(partnerClubId > 0){ sql += 'AND partner_club_id = ? '; params.push(partnerClubId); }
    if(rewardType){ sql += 'AND reward_type = ? '; params.push(rewardType); }
    if(fromTime > 0){ sql += 'AND create_time >= ? '; params.push(fromTime); }
    sql += 'ORDER BY create_time DESC LIMIT 200';
    queryP(sql,params,function(err,rows){
        if(err){ console.log(err); callback([]); return; }
        callback(rows || []);
    });
};

//写入奖励明细
exports.add_reward_log = function(clubId,partnerClubId,rewardType,amount,gameType,roomid,roomUuid,gameIndex,tableName,callback){
    if(callback == null && typeof tableName === 'function'){ callback = tableName; tableName = ''; }
    callback = callback == null? nop:callback;
    var t = Math.ceil(Date.now()/1000);
    queryP('INSERT INTO t_reward_logs(club_id,partner_club_id,reward_type,amount,game_type,table_name,roomid,room_uuid,game_index,create_time) VALUES(?,?,?,?,?,?,?,?,?,?)',
        [clubId,partnerClubId,rewardType,amount,gameType || '',tableName || '',roomid || 0,roomUuid || '',gameIndex || 0,t],function(err,rows){
            if(err){ console.log(err); callback(false); return; }
            callback(true);
        });
};

//俱乐部总览数据
exports.club_overview = function(clubId,callback){
    callback = callback == null? nop:callback;
    var cid = Number(clubId) || 0;
    var today = new Date(); today.setHours(0,0,0,0);
    var todayTs = Math.ceil(today.getTime()/1000);
    var yesterdayTs = todayTs - 86400;
    var beforeYesterdayTs = todayTs - 172800;
    // 社长实收包含全部收入类流水(进房费也是俱乐部收入, 不能漏)
    var REW2 = '("抽水","暗水","房费","洗牌扣豆","表情扣豆","进房首局扣豆","合伙人分成")';
    // 收集本级及所有下级俱乐部 id
    var ids = [cid];
    (function next(){
        var ph = ids.map(function(){ return '?'; }).join(',');
        queryP('SELECT id FROM t_clubs WHERE parent_clubid IN (' + ph + ')', ids, function(err, rows){
            var added = 0;
            (rows || []).forEach(function(r){
                var v = Number(r.id);
                if(ids.indexOf(v) < 0){ ids.push(v); added++; }
            });
            if(added > 0 && ids.length < 500){ next(); return; }
            finish();
        });
    })();
    function finish(){
        var inPh = ids.map(function(){ return '?'; }).join(',');
        // 实收: 本级社长本人实际到账(抽水类 + 上级分成), 已扣掉被上级抽走的部分
        queryP('SELECT owner_userid FROM t_clubs WHERE id = ?', [cid], function(e0, owners){
            var oids = (owners || []).map(function(o){ return Number(o.owner_userid); }).filter(function(v){ return v > 0; });
            var oPh = oids.length ? oids.map(function(){ return '?'; }).join(',') : '0';
            var sqlNet = 'SELECT '
                + 'SUM(CASE WHEN create_time >= ' + todayTs + ' AND change_type IN ' + REW2 + ' AND amount > 0 THEN amount ELSE 0 END) AS today_net,'
                + 'SUM(CASE WHEN create_time >= ' + yesterdayTs + ' AND create_time < ' + todayTs + ' AND change_type IN ' + REW2 + ' AND amount > 0 THEN amount ELSE 0 END) AS yesterday_net,'
                + 'SUM(CASE WHEN create_time >= ' + beforeYesterdayTs + ' AND create_time < ' + yesterdayTs + ' AND change_type IN ' + REW2 + ' AND amount > 0 THEN amount ELSE 0 END) AS before_net '
                + 'FROM t_bean_logs WHERE userid IN (' + oPh + ')';
            queryP(sqlNet, oids, function(errN, rowsN){
                var rn = (rowsN && rowsN[0]) || {};
                // 人次: 本级 + 所有下级的对局结算人次
                var sqlRounds = 'SELECT '
                    + 'SUM(CASE WHEN create_time >= ' + todayTs + ' AND change_type = "对局结算" THEN 1 ELSE 0 END) AS today_rounds,'
                    + 'SUM(CASE WHEN create_time >= ' + yesterdayTs + ' AND create_time < ' + todayTs + ' AND change_type = "对局结算" THEN 1 ELSE 0 END) AS yesterday_rounds,'
                    + 'SUM(CASE WHEN create_time >= ' + beforeYesterdayTs + ' AND create_time < ' + yesterdayTs + ' AND change_type = "对局结算" THEN 1 ELSE 0 END) AS before_rounds '
                    + 'FROM t_bean_logs WHERE club_id IN (' + inPh + ')';
                queryP(sqlRounds, ids, function(errR, rowsR){
                    var rr = (rowsR && rowsR[0]) || {};
                    // 人数 / 乐豆: 本级 + 所有下级的成员汇总
                    queryP('SELECT COUNT(*) AS member_count, IFNULL(SUM(u.gems),0) AS total_gems FROM t_club_members m JOIN t_users u ON u.userid = m.userid WHERE m.club_id IN (' + inPh + ')', ids, function(err2, rows2){
                        var r2 = (rows2 && rows2[0]) || {};
                        var todayNet = round4(Number(rn.today_net || 0));
                        callback({
                            // 累收与实收一致: 显示社长实际到账(已扣被上级抽走的部分)
                            today_rake: todayNet,
                            yesterday_rake: round4(Number(rn.yesterday_net || 0)),
                            before_yesterday_rake: round4(Number(rn.before_net || 0)),
                            today_net: todayNet,
                            yesterday_net: round4(Number(rn.yesterday_net || 0)),
                            before_yesterday_net: round4(Number(rn.before_net || 0)),
                            today_rounds: Number(rr.today_rounds || 0),
                            yesterday_rounds: Number(rr.yesterday_rounds || 0),
                            before_yesterday_rounds: Number(rr.before_rounds || 0),
                            member_count: Number(r2.member_count || 0),
                            total_gems: round4(Number(r2.total_gems || 0))
                        });
                    });
                });
            });
        });
    }
};
function round4(v){ return Math.round(v * 10000) / 10000; }

// ============ 俱乐部成员扩展操作 ============

//删除成员(从俱乐部移除)
exports.club_member_delete = function(clubId,userid,callback){
    callback = callback == null? nop:callback;
    queryP('DELETE FROM t_club_members WHERE club_id = ? AND userid = ?',[clubId,userid],function(err,rows){
        if(err){ console.log(err); callback(false); return; }
        callback(rows.affectedRows > 0);
    });
};

//设为合伙人(创建下级俱乐部并绑定)
exports.club_member_set_partner = function(clubId,userid,partnerName,callback){
    callback = callback == null? nop:callback;
    //先检查用户是否已经是合伙人
    queryP('SELECT id FROM t_clubs WHERE owner_userid = ? AND parent_clubid = ?',[userid,clubId],function(err,rows){
        if(err){ console.log(err); callback(null); return; }
        if(rows.length > 0){ callback(rows[0].id); return; }
        //创建下级俱乐部
        var createTime = Math.ceil(Date.now()/1000);
        //随机生成的俱乐部id可能与已有id撞主键,撞了就换一个重试
        var tryInsert = function(left){
            var newClubId = 100000 + Math.floor(Math.random()*900000);
            queryP('INSERT INTO t_clubs(id,name,owner_userid,parent_clubid,create_time) VALUES(?,?,?,?,?)',
                [newClubId,partnerName || ('合伙人' + newClubId),userid,clubId,createTime],function(err2){
                if(err2){
                    if(err2.code == 'ER_DUP_ENTRY' && left > 0){ tryInsert(left - 1); return; }
                    console.log('[club_member_set_partner] insert club failed:',err2.message);
                    callback(null); return;
                }
                //把用户加入新俱乐部
                queryP('INSERT IGNORE INTO t_club_members(club_id,userid,join_time) VALUES(?,?,?)',[newClubId,userid,createTime],function(){});
                //给新下级的**所有祖先**都写一条 partner_stats(顶级 owner 视角下能查到 stats)
                //注意: partner_stats 里的 club_id 必须是祖先, partner_club_id 固定是新下级; 直接上级自己那条也要写
                var ancestors = [];
                var walkUp = function(curClubId, depth){
                    if(depth > 5 || !curClubId || curClubId <= 0){ return; }
                    queryP('SELECT parent_clubid FROM t_clubs WHERE id = ?',[curClubId],function(e,rs){
                        if(e || !rs || !rs.length){ return; }
                        var pid = rs[0].parent_clubid;
                        if(pid > 0 && ancestors.indexOf(pid) < 0){
                            ancestors.push(pid);
                            //异步 upsert, 不阻塞 callback
                            exports.partner_upsert(pid,newClubId,{profit_ratio:0},function(){});
                            walkUp(pid, depth + 1);
                        }
                    });
                };
                exports.partner_upsert(clubId,newClubId,{profit_ratio:0},function(){}); //直接上级
                walkUp(clubId, 0);
                callback(newClubId);
            });
        };
        tryInsert(5);
    });
};

//添加成员(已存在则忽略)
exports.club_member_add = function(clubId,userid,callback){
    callback = callback == null? nop:callback;
    var joinTime = Math.ceil(Date.now()/1000);
    queryP('INSERT IGNORE INTO t_club_members(club_id,userid,join_time) VALUES(?,?,?)',[clubId,userid,joinTime],function(err){
        if(err){ console.log(err); callback(false); return; }
        callback(true);
    });
};

//成员战绩(按天汇总)
exports.club_member_records = function(clubId,userid,fromTime,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT roomid,game_type,change_type,amount,create_time FROM t_bean_logs WHERE club_id = ? AND userid = ? AND change_type = "对局结算" ';
    var params = [clubId,userid];
    if(fromTime > 0){ sql += 'AND create_time >= ? '; params.push(fromTime); }
    sql += 'ORDER BY create_time DESC LIMIT 100';
    queryP(sql,params,function(err,rows){
        if(err){ console.log(err); callback([]); return; }
        callback(rows || []);
    });
};

//成员豆豆明细
exports.club_member_bean_logs = function(clubId,userid,fromTime,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT roomid,game_type,change_type,amount,create_time FROM t_bean_logs WHERE club_id = ? AND userid = ? ';
    var params = [clubId,userid];
    if(fromTime > 0){ sql += 'AND create_time >= ? '; params.push(fromTime); }
    sql += 'ORDER BY create_time DESC LIMIT 100';
    queryP(sql,params,function(err,rows){
        if(err){ console.log(err); callback([]); return; }
        callback(rows || []);
    });
};

//俱乐部成员列表(含房卡)
//绑定过账号的成员按主账号合并: 绑定账号与主账号视为同一成员, 只保留一行, 房卡取主账号的数值
exports.club_members = function(clubId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT u.userid,u.account,u.name,u.gems,m.join_time FROM t_club_members m '
        + 'LEFT JOIN t_users u ON u.userid = m.userid WHERE m.club_id = ? ORDER BY m.join_time DESC';
    queryP(sql,[clubId],function(err,rows){
        if(err){ console.log(err); callback([]); return; }
        if(rows.length == 0){ callback([]); return; }
        rows.forEach(function(r){ if(r.name){ r.name = crypto.fromBase64(r.name); } });
        //先把每个成员解析到绑定后的主账号
        var pending = rows.length;
        rows.forEach(function(r){
            if(!r.account){ r._primary = null; if(--pending === 0){ build(); } return; }
            exports.get_bind_primary(r.account,function(primary){
                r._primary = primary || r.account;
                if(--pending === 0){ build(); }
            });
        });
        function build(){
            var groups = [], map = {};
            rows.forEach(function(r){
                var key = r._primary || r.account || ("uid_" + r.userid);
                var g = map[key];
                if(!g){ g = map[key] = {key:key,rows:[],join_time:r.join_time,account:r.account}; groups.push(g); }
                g.rows.push(r);
                if(r.join_time && (!g.join_time || r.join_time < g.join_time)){ g.join_time = r.join_time; }
            });
            var out = [], remain = groups.length;
            groups.forEach(function(g){
                //主账号自己的成员行优先(它的房卡/昵称就是主账号的)
                var own = null;
                for(var i = 0; i < g.rows.length; ++i){ if(g.rows[i].account === g.key){ own = g.rows[i]; break; } }
                if(own){
                    out.push({userid:own.userid,account:g.key,name:own.name,gems:own.gems,join_time:g.join_time});
                    if(--remain === 0){ done(); }
                    return;
                }
                if(g.key.indexOf("uid_") === 0){
                    var r0 = g.rows[0];
                    out.push({userid:r0.userid,account:r0.account,name:r0.name,gems:r0.gems,join_time:g.join_time});
                    if(--remain === 0){ done(); }
                    return;
                }
                //成员只有绑定账号: 展示主账号的账号/昵称/房卡
                exports.get_user_data(g.key,function(pu){
                    if(pu){
                        out.push({userid:pu.userid,account:pu.account,name:pu.name,gems:pu.gems,join_time:g.join_time});
                    } else {
                        var r1 = g.rows[0];
                        out.push({userid:r1.userid,account:r1.account,name:r1.name,gems:r1.gems,join_time:g.join_time});
                    }
                    if(--remain === 0){ done(); }
                });
            });
            function done(){
                out.sort(function(a,b){ return (b.join_time || 0) - (a.join_time || 0); });
                callback(out);
            }
        }
    });
};

//俱乐部管理员给成员增减房卡(仅限本俱乐部成员)
//绑定账号与主账号视为同一成员: 成员校验认绑定组, 房卡加到实际登录使用的主账号上
exports.club_member_gems = function(clubId,userid,gems,callback){
    callback = callback == null? nop:callback;
    exports.get_user_data_by_userid(userid,function(u){
        if(!u){ callback(false,'not_member'); return; }
        exports.get_bind_primary(u.account,function(primary){
            var pr = primary || u.account;
            var sql = 'SELECT m.userid FROM t_club_members m JOIN t_users u ON u.userid = m.userid'
                + ' WHERE m.club_id = ' + clubId + ' AND u.account IN ("' + u.account + '","' + pr + '") LIMIT 1';
            query(sql,function(err,rows){
                if(err || rows.length == 0){ callback(false,'not_member'); return; }
                var apply = function(targetId){
                    exports.add_user_gems(targetId,gems,function(ok){
                        callback(ok,ok?null:'failed');
                    });
                };
                if(pr === u.account){ apply(u.userid); return; }
                exports.get_user_data(pr,function(pu){
                    apply(pu ? pu.userid : u.userid);
                });
            });
        });
    });
};

//后台:俱乐部列表(含社长信息/成员数/玩法数/牌桌数)
exports.admin_club_list = function(callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT c.id,c.name,c.owner_userid,c.is_top_level,c.create_time,u.account AS owner_account,u.name AS owner_name,'
        + '(SELECT COUNT(*) FROM t_club_members m WHERE m.club_id = c.id) AS member_count,'
        + '(SELECT COUNT(*) FROM t_club_games g WHERE g.club_id = c.id) AS game_count,'
        + '(SELECT COUNT(*) FROM t_club_tables t WHERE t.club_id = c.id) AS table_count,'
        + '(SELECT GROUP_CONCAT(a.username) FROM t_admin_users a WHERE a.club_id = c.id) AS admin_names '
        + 'FROM t_clubs c LEFT JOIN t_users u ON u.userid = c.owner_userid ORDER BY c.id DESC';
    query(sql,function(err,rows){
        if(err){ console.log(err); callback([]); return; }
        rows.forEach(function(r){ if(r.owner_name){ r.owner_name = crypto.fromBase64(r.owner_name); } });
        callback(rows);
    });
};

//后台:添加俱乐部(并把社长加入成员表),俱乐部ID为6位数字(客户端加入俱乐部弹窗输入6位)
exports.admin_club_add = function(name,ownerUserid,callback){
    callback = callback == null? nop:callback;
    var createTime = Math.ceil(Date.now()/1000);
    var tries = 0;
    var attempt = function(){
        tries++;
        var clubId = 100000 + Math.floor(Math.random()*900000); //6位俱乐部ID
        queryP('INSERT INTO t_clubs(id,name,owner_userid,create_time) VALUES(?,?,?,?)',[clubId,name,ownerUserid,createTime],function(err,rows){
            if(err){
                if(err.code == 'ER_DUP_ENTRY' && tries < 20){ attempt(); return; } //ID冲突重试
                console.log(err); callback(null); return;
            }
            queryP('INSERT IGNORE INTO t_club_members(club_id,userid,join_time) VALUES(?,?,?)',[clubId,ownerUserid,createTime],function(){});
            callback(clubId);
        });
    };
    attempt();
};

//后台:设置/取消一级俱乐部(社长增减豆豆不受自身余额限制)
exports.admin_club_set_top_level = function(id,isTop,callback){
    callback = callback == null? nop:callback;
    if(!(id > 0)){ callback(false); return; }
    queryP('UPDATE t_clubs SET is_top_level = ? WHERE id = ?',[isTop ? 1 : 0,id],function(err,rows){
        if(err){ console.log(err); callback(false); return; }
        callback(rows.affectedRows > 0);
    });
};

//后台:修改俱乐部(名称/社长)
exports.admin_club_update = function(id,name,ownerUserid,callback){
    callback = callback == null? nop:callback;
    var sets = [];
    var params = [];
    if(name != null){ sets.push('name = ?'); params.push(name); }
    if(ownerUserid != null){ sets.push('owner_userid = ?'); params.push(ownerUserid); }
    if(sets.length == 0){ callback(false); return; }
    params.push(id);
    queryP('UPDATE t_clubs SET ' + sets.join(',') + ' WHERE id = ?',params,function(err,rows){
        if(err){ console.log(err); callback(false); return; }
        if(ownerUserid != null){
            var joinTime = Math.ceil(Date.now()/1000);
            queryP('INSERT IGNORE INTO t_club_members(club_id,userid,join_time) VALUES(?,?,?)',[id,ownerUserid,joinTime],function(){});
        }
        callback(rows.affectedRows > 0);
    });
};

//后台:删除俱乐部(连同成员/玩法/牌桌,并解绑其管理员)
exports.admin_club_delete = function(id,callback){
    callback = callback == null? nop:callback;
    queryP('DELETE FROM t_club_members WHERE club_id = ?',[id],function(){
        queryP('DELETE FROM t_club_tables WHERE club_id = ?',[id],function(){
            queryP('DELETE FROM t_club_games WHERE club_id = ?',[id],function(){
                queryP('UPDATE t_admin_users SET club_id = NULL WHERE club_id = ?',[id],function(){
                    queryP('DELETE FROM t_clubs WHERE id = ?',[id],function(err,rows){
                        if(err){ console.log(err); callback(false); return; }
                        callback(rows.affectedRows > 0);
                    });
                });
            });
        });
    });
};

//后台:管理员账号列表
exports.admin_user_list = function(callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT a.id,a.username,a.role,a.club_id,a.created_at,c.name AS club_name '
        + 'FROM t_admin_users a LEFT JOIN t_clubs c ON c.id = a.club_id ORDER BY a.id';
    query(sql,function(err,rows){
        if(err){ console.log(err); callback([]); return; }
        callback(rows);
    });
};

//后台:单个管理员账号
exports.admin_user_get = function(id,callback){
    callback = callback == null? nop:callback;
    queryP('SELECT * FROM t_admin_users WHERE id = ?',[id],function(err,rows){
        if(err || rows.length == 0){ callback(null); return; }
        callback(rows[0]);
    });
};

//后台:添加管理员账号(role=super 超级管理员 / club 俱乐部管理员,club管理员必须绑定club_id)
exports.admin_user_add = function(username,password,role,clubId,callback){
    callback = callback == null? nop:callback;
    var createTime = Math.ceil(Date.now()/1000);
    var sql = 'INSERT INTO t_admin_users(username,password,role,club_id,created_at) VALUES(?,?,?,?,?)';
    queryP(sql,[username,password,role,clubId == null ? null : clubId,createTime],function(err,rows){
        if(err){ console.log(err); callback(null,err); return; }
        callback(rows.insertId,null);
    });
};

//后台:更新管理员账号(密码/角色/绑定俱乐部)
exports.admin_user_update = function(id,fields,callback){
    callback = callback == null? nop:callback;
    var sets = [];
    var params = [];
    if(fields.password != null){ sets.push('password = ?'); params.push(fields.password); }
    if(fields.role != null){ sets.push('role = ?'); params.push(fields.role); }
    if(fields.club_id !== undefined){ sets.push('club_id = ?'); params.push(fields.club_id); }
    if(sets.length == 0){ callback(false); return; }
    params.push(id);
    queryP('UPDATE t_admin_users SET ' + sets.join(',') + ' WHERE id = ?',params,function(err,rows){
        if(err){ console.log(err); callback(false); return; }
        callback(rows.affectedRows > 0);
    });
};

//后台:删除管理员账号
exports.admin_user_delete = function(id,callback){
    callback = callback == null? nop:callback;
    queryP('DELETE FROM t_admin_users WHERE id = ?',[id],function(err,rows){
        if(err){ console.log(err); callback(false); return; }
        callback(rows.affectedRows > 0);
    });
};

//按用户名查管理员(用于校验唯一)
exports.admin_user_by_name = function(username,callback){
    callback = callback == null? nop:callback;
    queryP('SELECT * FROM t_admin_users WHERE username = ?',[username],function(err,rows){
        if(err || rows.length == 0){ callback(null); return; }
        callback(rows[0]);
    });
};

// ===== Admin Token 持久化(存在 t_admin_users.token 列) =====
exports.admin_token_get = function(token, callback){
    callback = callback == null? nop:callback;
    queryP('SELECT id, username, role, club_id FROM t_admin_users WHERE token = ?',[token],function(err,rows){
        if(err || rows.length === 0){ callback(null); return; }
        var r = rows[0];
        callback({id:r.id, username:r.username, role:r.role, club_id:r.club_id});
    });
};
exports.admin_token_set = function(id, token, callback){
    queryP('UPDATE t_admin_users SET token = ? WHERE id = ?',[token,id],function(){
        if(callback) callback();
    });
};
exports.admin_token_del = function(token, callback){
    queryP('UPDATE t_admin_users SET token = NULL WHERE token = ?',[token],function(){
        if(callback) callback();
    });
};

// ===== 观战账号(t_spectate_users) =====
// 后台录入账号密码, 观战网页独立登录; 与管理员账号体系完全隔离
exports.spectate_user_list = function(callback){
    queryP('SELECT id, username, enabled, last_login, created_at FROM t_spectate_users ORDER BY id', [], function(err, rows){
        callback(err ? [] : rows);
    });
};
exports.spectate_user_add = function(username, password, callback){
    queryP('INSERT INTO t_spectate_users(username,password,enabled,created_at) VALUES(?,?,1,?)',
        [username, password, Math.floor(Date.now()/1000)], function(err){
            callback(err ? err.message : null);
        });
};
exports.spectate_user_update = function(id, fields, callback){
    var sets = [], params = [];
    if(fields.password != null){ sets.push('password = ?'); params.push(fields.password); }
    if(fields.enabled != null){ sets.push('enabled = ?'); params.push(fields.enabled ? 1 : 0); }
    if(sets.length === 0){ callback(null); return; }
    params.push(id);
    queryP('UPDATE t_spectate_users SET ' + sets.join(',') + ' WHERE id = ?', params, function(err){
        callback(err ? err.message : null);
    });
};
exports.spectate_user_delete = function(id, callback){
    queryP('DELETE FROM t_spectate_users WHERE id = ?', [id], function(err){
        callback(err ? err.message : null);
    });
};
// 登录校验: 返回 {id, username, password, enabled} 或 null
exports.spectate_user_get = function(username, callback){
    queryP('SELECT id, username, password, enabled FROM t_spectate_users WHERE username = ?', [username], function(err, rows){
        if(err || rows.length === 0){ callback(null); return; }
        callback(rows[0]);
    });
};
exports.spectate_token_set = function(id, token, callback){
    queryP('UPDATE t_spectate_users SET token = ?, last_login = ? WHERE id = ?',
        [token, Math.floor(Date.now()/1000), id], function(){
            if(callback) callback();
        });
};
// token 换账号信息: 返回 {id, username} 或 null(禁用账号视为失效)
exports.spectate_token_get = function(token, callback){
    queryP('SELECT id, username FROM t_spectate_users WHERE token = ? AND enabled = 1', [token], function(err, rows){
        if(err || rows.length === 0){ callback(null); return; }
        callback({id: rows[0].id, username: rows[0].username});
    });
};
exports.spectate_token_del = function(token, callback){
    queryP('UPDATE t_spectate_users SET token = NULL WHERE token = ?', [token], function(){
        if(callback) callback();
    });
};

// 获取玩法配置
exports.get_game_config = function(type, callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT * FROM t_game_config WHERE type = "' + type + '"';
    query(sql, function(err, rows){
        if(err || rows.length == 0){
            callback(null);
            return;
        }
        var r = rows[0];
        callback({
            type: r.type,
            name: r.name,
            difen_options: JSON.parse(r.difen_options),
            jushu_options: JSON.parse(r.jushu_options),
            cost_options: JSON.parse(r.cost_options),
            chips_options: r.chips_options ? JSON.parse(r.chips_options) : null,
            max_players: r.max_players,
            max_tai: r.max_tai || 10,
            caishen_cpg: r.caishen_cpg != null ? r.caishen_cpg : 1,
            cai_chi: r.cai_chi != null ? r.cai_chi : (r.caishen_cpg != null ? r.caishen_cpg : 1),
            cai_peng: r.cai_peng != null ? r.cai_peng : (r.caishen_cpg != null ? r.caishen_cpg : 1),
            cai_gang: r.cai_gang != null ? r.cai_gang : (r.caishen_cpg != null ? r.caishen_cpg : 1),
            cai_pure: r.cai_pure != null ? r.cai_pure : 0,
            hu_guo_confirm: r.hu_guo_confirm != null ? r.hu_guo_confirm : 1,
            dianpao_hu: r.dianpao_hu != null ? r.dianpao_hu : 1,
            remove_tiao: r.remove_tiao != null ? r.remove_tiao : 0,
            cai7: r.cai7 != null ? r.cai7 : 0,
            laozhuang_multiplier: r.laozhuang_multiplier != null ? r.laozhuang_multiplier : 2,
            // 诸暨赖倒胡专属开关（t_game_config 里还没这些列时用兜底值）
            tianhu_di: r.tianhu_di != null ? r.tianhu_di : 1,
            cai_diao: r.cai_diao != null ? r.cai_diao : 1,
            // 包财神专属:每台包台分数（列不存在时用兜底值1）
            bao_tai_score: r.bao_tai_score != null ? r.bao_tai_score : 1,
            // 关牌专属开关
            gp_bomb: r.gp_bomb != null ? r.gp_bomb : 1,
            gp_bomb_four: r.gp_bomb_four != null ? r.gp_bomb_four : 1,
            gp_four_two: r.gp_four_two != null ? r.gp_four_two : 1,
            gp_four_three: r.gp_four_three != null ? r.gp_four_three : 1,
            gp_three_one: r.gp_three_one != null ? r.gp_three_one : 1,
            gp_last_three_one: r.gp_last_three_one != null ? r.gp_last_three_one : 0,
            gp_last_four_two_three: r.gp_last_four_two_three != null ? r.gp_last_four_two_three : 0,
            gp_straight_a2: r.gp_straight_a2 != null ? r.gp_straight_a2 : 1,
            gp_card_history: r.gp_card_history != null ? r.gp_card_history : 0,
            tai_rules: r.tai_rules ? JSON.parse(r.tai_rules) : null,
            auto_dissolve_seconds: r.auto_dissolve_seconds != null ? r.auto_dissolve_seconds : 300,
            enabled: r.enabled
        });
    });
};

//后台启用的玩法列表(大厅玩法介绍弹窗左侧列表)
exports.game_config_list = function(callback){
    callback = callback == null ? nop : callback;
    var sql = 'SELECT type,name,max_players FROM t_game_config WHERE enabled = 1 ORDER BY sort ASC, id ASC';
    query(sql, function(err, rows){
        if(err){
            callback([]);
            return;
        }
        callback(rows || []);
    });
};
//删除合伙人关系(连带删除其下级俱乐部, 与后台 /admin/partner/:id 行为一致)
exports.partner_delete = function(clubId,partnerClubId,callback){
    callback = callback == null? nop:callback;
    queryP('DELETE FROM t_partner_stats WHERE club_id = ? AND partner_club_id = ?',[clubId,partnerClubId],function(err){
        if(err){ console.log(err); callback(false); return; }
        //只删挂在本俱乐部下的子俱乐部, 避免误删其他俱乐部
        queryP('SELECT id FROM t_clubs WHERE id = ? AND parent_clubid = ?',[partnerClubId,clubId],function(err2,rows){
            if(err2){ console.log(err2); callback(false); return; }
            if(!rows || rows.length == 0){ callback(true); return; }
            exports.admin_club_delete(partnerClubId,function(ok){ callback(ok); });
        });
    });
};