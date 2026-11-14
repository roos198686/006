var express = require('express');
var path = require('path');
var fs = require('fs');
var crypto = require('../utils/crypto');
var db = require('../utils/db');
var http = require('../utils/http');

var app = express();
// APK上传走base64 JSON体,允许较大的请求体(单包通常几十到上百MB)
app.use(express.json({limit:'300mb'}));
// 静态文件：后台管理页面
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
// 公开下载页及图标(手机浏览器访问)
app.use(express.static(path.join(__dirname, '..', 'public')));
// APK文件下载目录
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
    setHeaders: function(res, filePath){
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', 'attachment; filename="baobao.apk"');
    }
}));
app.get('/', function(req, res){ res.redirect('/admin/index.html'); });

var config = null;

// 跨域
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,X-Requested-With,Authorization");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Content-Type", "application/json;charset=utf-8");
    if(req.method == "OPTIONS"){
        res.send(200);
    } else {
        next();
    }
});

function send(res, code, msg, data){
    res.send(JSON.stringify({code: code, msg: msg, data: data || null}));
}

// 认证中间件 - token存MySQL, 进程重启不丢
function auth(req, res, next){
    var token = req.headers['authorization'] || req.query.token;
    if(!token){ send(res, 401, "未登录"); return; }
    db.admin_token_get(token, function(user){
        if(!user){ send(res, 401, "登录已过期, 请重新登录"); return; }
        req.adminUser = user;
        next();
    });
}

exports.start = function(cfg){
    config = cfg;
    app.listen(config.ADMIN_API_PORT, config.ADMIN_API_IP);
    console.log("admin api is listening on " + config.ADMIN_API_IP + ":" + config.ADMIN_API_PORT);
};

// ============ 认证 ============
app.post('/admin/login', function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    if(!username || !password){
        send(res, 1, "用户名或密码不能为空");
        return;
    }
    var psw = crypto.md5(password);
    var sql = 'SELECT * FROM t_admin_users WHERE username="' + username + '" AND password="' + psw + '"';
    db.query(sql, function(err, rows){
        if(err){
            send(res, 500, "数据库错误");
            return;
        }
        if(rows.length == 0){
            send(res, 1, "用户名或密码错误");
            return;
        }
        var token = crypto.md5(username + Date.now() + Math.random());
        // token存MySQL, 进程重启不丢
        db.admin_token_set(rows[0].id, token, function(){
            var ret = {token: token, username: rows[0].username, role: rows[0].role, club_id: rows[0].club_id};
            if(rows[0].role == "club"){
                db.club_get(rows[0].club_id, function(club){
                    ret.club_name = club ? club.name : null;
                    send(res, 0, "ok", ret);
                });
                return;
            }
            send(res, 0, "ok", ret);
        });
    });
});

app.post('/admin/logout', auth, function(req, res){
    db.admin_token_del(req.headers['authorization'], function(){
        send(res, 0, "ok");
    });
});

// 自己改密码(验证旧密码)
app.post('/admin/change_password', auth, function(req, res){
    var oldPwd = req.body.old_password;
    var newPwd = req.body.new_password;
    if(!oldPwd || !newPwd){ send(res, 1, "旧密码和新密码不能为空"); return; }
    if(newPwd.length < 4){ send(res, 1, "新密码至少4位"); return; }
    var id = req.adminUser.id;
    db.query('SELECT password FROM t_admin_users WHERE id=' + id + ' LIMIT 1', function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        if(!rows || rows.length === 0){ send(res, 1, "账号不存在"); return; }
        if(rows[0].password !== crypto.md5(oldPwd)){ send(res, 1, "旧密码错误"); return; }
        db.query('UPDATE t_admin_users SET password="' + crypto.md5(newPwd) + '" WHERE id=' + id, function(err2){
            if(err2){ send(res, 500, "数据库错误"); return; }
            send(res, 0, "密码已修改, 请重新登录");
        });
    });
});

// 当前登录管理员的真实身份(前端据此校验角色,避免用俱乐部管理员token进超级管理后台)
app.get('/admin/me', auth, function(req, res){
    var u = req.adminUser;
    send(res, 0, "ok", {id: u.id, username: u.username, role: u.role, club_id: u.club_id});
});

// ============ 玩法配置管理 ============
// 获取所有玩法配置
app.get('/admin/game_configs', auth, function(req, res){
    db.query('SELECT * FROM t_game_config ORDER BY sort ASC', function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        var list = rows.map(function(r){
            return {
                id: r.id,
                type: r.type,
                name: r.name,
                difen_options: JSON.parse(r.difen_options),
                jushu_options: JSON.parse(r.jushu_options),
                cost_options: JSON.parse(r.cost_options),
                chips_options: r.chips_options ? JSON.parse(r.chips_options) : null,
                max_players: r.max_players,
                max_tai: r.max_tai,
                tai_rules: r.tai_rules ? JSON.parse(r.tai_rules) : null,
                caishen_cpg: r.caishen_cpg,
                cai_chi: r.cai_chi,
                cai_peng: r.cai_peng,
                cai_gang: r.cai_gang,
                cai_pure: r.cai_pure != null ? r.cai_pure : 0,
                hu_guo_confirm: r.hu_guo_confirm != null ? r.hu_guo_confirm : 1,
                dianpao_hu: r.dianpao_hu,
                remove_tiao: r.remove_tiao != null ? r.remove_tiao : 0,
                cai7: r.cai7 != null ? r.cai7 : 0,
                laozhuang_multiplier: r.laozhuang_multiplier != null ? r.laozhuang_multiplier : 2,
                tianhu_di: r.tianhu_di != null ? r.tianhu_di : 1,
                cai_diao: r.cai_diao != null ? r.cai_diao : 1,
                bao_tai_score: r.bao_tai_score != null ? r.bao_tai_score : 1,
                gp_bomb: r.gp_bomb != null ? r.gp_bomb : 1,
                gp_bomb_four: r.gp_bomb_four != null ? r.gp_bomb_four : 1,
                gp_four_two: r.gp_four_two != null ? r.gp_four_two : 1,
                gp_four_three: r.gp_four_three != null ? r.gp_four_three : 1,
                gp_three_one: r.gp_three_one != null ? r.gp_three_one : 1,
                gp_last_three_one: r.gp_last_three_one != null ? r.gp_last_three_one : 0,
                gp_last_four_two_three: r.gp_last_four_two_three != null ? r.gp_last_four_two_three : 0,
                gp_straight_a2: r.gp_straight_a2 != null ? r.gp_straight_a2 : 1,
                gp_card_history: r.gp_card_history != null ? r.gp_card_history : 0,
                auto_dissolve_seconds: r.auto_dissolve_seconds != null ? r.auto_dissolve_seconds : 300,
                unified_charge: r.unified_charge != null ? Number(r.unified_charge) : 0,
                enabled: r.enabled,
                sort: r.sort
            };
        });
        send(res, 0, "ok", list);
    });
});

// 新增玩法
app.post('/admin/game_config', auth, function(req, res){
    var c = req.body;
    if(!c.type || !c.name){
        send(res, 1, "玩法类型和名称不能为空");
        return;
    }
    var difen = JSON.stringify(c.difen_options || [1,2,5]);
    var jushu = JSON.stringify(c.jushu_options || [4,8]);
    var cost = JSON.stringify(c.cost_options || [2,3]);
    var chips = JSON.stringify(c.chips_options || [1000,2000,5000]);
    var taiRules = c.tai_rules ? JSON.stringify(c.tai_rules) : null;
    var caiChi = c.cai_chi != null ? c.cai_chi : (c.caishen_cpg != null ? c.caishen_cpg : 1);
    var caiPeng = c.cai_peng != null ? c.cai_peng : (c.caishen_cpg != null ? c.caishen_cpg : 1);
    var caiGang = c.cai_gang != null ? c.cai_gang : (c.caishen_cpg != null ? c.caishen_cpg : 1);
    var caiPure = c.cai_pure != null ? c.cai_pure : 0;
    var huGuoConfirm = c.hu_guo_confirm != null ? (c.hu_guo_confirm ? 1 : 0) : 1;
    var dianpaoHu = c.dianpao_hu != null ? c.dianpao_hu : 1;
    var removeTiao = c.remove_tiao != null ? c.remove_tiao : 0;
    var cai7 = c.cai7 != null ? c.cai7 : 0;
    var laozhuangMul = c.laozhuang_multiplier != null ? (parseInt(c.laozhuang_multiplier) || 2) : 2;
    var tianhuDi = c.tianhu_di != null ? c.tianhu_di : 1;
    var caiDiao = c.cai_diao != null ? c.cai_diao : 1;
    var baoTaiScore = c.bao_tai_score != null ? (parseInt(c.bao_tai_score) || 0) : 1;
    var autoDissolve = parseInt(c.auto_dissolve_seconds) || 300;
    //收费模式:1=抽水扣豆 0=仅房卡
    var unifiedCharge = c.unified_charge != null ? (parseInt(c.unified_charge) ? 1 : 0) : 0;
    // 关牌开关(仅 guanpai2/guanpai3 使用)
    function gpVal(k, def){ return c[k] != null ? (c[k] ? 1 : 0) : def; }
    var gpBomb = gpVal('gp_bomb', 1);
    var gpBombFour = gpVal('gp_bomb_four', 1);
    var gpFourTwo = gpVal('gp_four_two', 1);
    var gpFourThree = gpVal('gp_four_three', 1);
    var gpThreeOne = gpVal('gp_three_one', 1);
    var gpLastThreeOne = gpVal('gp_last_three_one', 0);
    var gpLastFourTwoThree = gpVal('gp_last_four_two_three', 0);
    var gpStraightA2 = gpVal('gp_straight_a2', 1);
    var gpCardHistory = gpVal('gp_card_history', 0);
    var sql = 'INSERT INTO t_game_config(type,name,difen_options,jushu_options,cost_options,chips_options,max_players,max_tai,caishen_cpg,cai_chi,cai_peng,cai_gang,cai_pure,hu_guo_confirm,dianpao_hu,remove_tiao,cai7,laozhuang_multiplier,tianhu_di,cai_diao,bao_tai_score,caishen_seconds,bao_seconds,auto_dissolve_seconds,unified_charge,tai_rules,gp_bomb,gp_bomb_four,gp_four_two,gp_four_three,gp_three_one,gp_last_three_one,gp_last_four_two_three,gp_straight_a2,gp_card_history,enabled,sort) VALUES("'
        + c.type + '","' + c.name + '","' + difen + '","' + jushu + '","' + cost + '","' + chips + '",'
        + (c.max_players || 2) + ',' + (c.max_tai || 10) + ',' + (c.caishen_cpg != null ? c.caishen_cpg : 1) + ','
        + caiChi + ',' + caiPeng + ',' + caiGang + ',' + caiPure + ',' + huGuoConfirm + ',' + dianpaoHu + ',' + removeTiao + ',' + cai7 + ',' + laozhuangMul + ',' + tianhuDi + ',' + caiDiao + ',' + baoTaiScore + ',' + ((parseInt(c.caishen_seconds) > 0) ? parseInt(c.caishen_seconds) : 60) + ',' + ((parseInt(c.bao_seconds) > 0) ? parseInt(c.bao_seconds) : 15) + ',' + autoDissolve + ',' + unifiedCharge + ','
        + (taiRules ? "'" + taiRules + "'" : 'NULL') + ','
        + gpBomb + ',' + gpBombFour + ',' + gpFourTwo + ',' + gpFourThree + ',' + gpThreeOne + ',' + gpLastThreeOne + ',' + gpLastFourTwoThree + ',' + gpStraightA2 + ',' + gpCardHistory + ','
        + (c.enabled ? 1 : 0) + ',' + (c.sort || 0) + ')';
    db.query(sql, function(err, result){
        if(err){ send(res, 500, "数据库错误: " + err.message); return; }
        send(res, 0, "ok");
    });
});

// 更新玩法
app.put('/admin/game_config/:id', auth, function(req, res){
    var id = req.params.id;
    var c = req.body;
    var sets = [];
    if(c.name != null) sets.push('name="' + c.name + '"');
    if(c.difen_options) sets.push('difen_options="' + JSON.stringify(c.difen_options) + '"');
    if(c.jushu_options) sets.push('jushu_options="' + JSON.stringify(c.jushu_options) + '"');
    if(c.cost_options) sets.push('cost_options="' + JSON.stringify(c.cost_options) + '"');
    if(c.chips_options) sets.push('chips_options="' + JSON.stringify(c.chips_options) + '"');
    if(c.max_players != null) sets.push('max_players=' + c.max_players);
    if(c.max_tai != null) sets.push('max_tai=' + c.max_tai);
    if(c.tai_rules != null) sets.push("tai_rules='" + JSON.stringify(c.tai_rules) + "'");
    if(c.caishen_cpg != null) sets.push('caishen_cpg=' + (c.caishen_cpg ? 1 : 0));
    if(c.cai_chi != null) sets.push('cai_chi=' + (c.cai_chi ? 1 : 0));
    if(c.cai_peng != null) sets.push('cai_peng=' + (c.cai_peng ? 1 : 0));
    if(c.cai_gang != null) sets.push('cai_gang=' + (c.cai_gang ? 1 : 0));
    if(c.cai_pure != null) sets.push('cai_pure=' + (c.cai_pure ? 1 : 0));
    if(c.hu_guo_confirm != null) sets.push('hu_guo_confirm=' + (c.hu_guo_confirm ? 1 : 0));
    if(c.dianpao_hu != null) sets.push('dianpao_hu=' + (c.dianpao_hu ? 1 : 0));
    if(c.remove_tiao != null) sets.push('remove_tiao=' + (c.remove_tiao ? 1 : 0));
    if(c.cai7 != null) sets.push('cai7=' + (c.cai7 ? 1 : 0));
    if(c.laozhuang_multiplier != null) sets.push('laozhuang_multiplier=' + (parseInt(c.laozhuang_multiplier) || 2));
    if(c.tianhu_di != null) sets.push('tianhu_di=' + (c.tianhu_di ? 1 : 0));
    if(c.cai_diao != null) sets.push('cai_diao=' + (c.cai_diao ? 1 : 0));
    if(c.bao_tai_score != null) sets.push('bao_tai_score=' + (parseInt(c.bao_tai_score) || 0));
    if(c.caishen_seconds != null) sets.push('caishen_seconds=' + ((parseInt(c.caishen_seconds) > 0) ? parseInt(c.caishen_seconds) : 60));
    if(c.bao_seconds != null) sets.push('bao_seconds=' + ((parseInt(c.bao_seconds) > 0) ? parseInt(c.bao_seconds) : 15));
    // 关牌开关
    ['gp_bomb','gp_bomb_four','gp_four_two','gp_four_three','gp_three_one','gp_last_three_one','gp_last_four_two_three','gp_straight_a2','gp_card_history'].forEach(function(k){
        if(c[k] != null) sets.push(k + '=' + (c[k] ? 1 : 0));
    });
    if(c.auto_dissolve_seconds != null) sets.push('auto_dissolve_seconds=' + (parseInt(c.auto_dissolve_seconds) || 300));
    if(c.unified_charge != null) sets.push('unified_charge=' + (parseInt(c.unified_charge) ? 1 : 0));
    if(c.enabled != null) sets.push('enabled=' + (c.enabled ? 1 : 0));
    if(c.sort != null) sets.push('sort=' + c.sort);
    if(sets.length == 0){ send(res, 1, "无更新内容"); return; }
    var sql = 'UPDATE t_game_config SET ' + sets.join(',') + ' WHERE id=' + id;
    db.query(sql, function(err, result){
        if(err){ send(res, 500, "数据库错误"); return; }
        send(res, 0, "ok");
    });
});

// 删除玩法
app.delete('/admin/game_config/:id', auth, function(req, res){
    var id = req.params.id;
    db.query('DELETE FROM t_game_config WHERE id=' + id, function(err, result){
        if(err){ send(res, 500, "数据库错误"); return; }
        send(res, 0, "ok");
    });
});

// ============ 用户管理 ============
// 查询用户:super 看全部,club 只看本俱乐部成员
app.get('/admin/users', auth, function(req, res){
    var keyword = req.query.keyword || '';
    var page = parseInt(req.query.page) || 1;
    var pageSize = parseInt(req.query.pageSize) || 20;
    var offset = (page - 1) * pageSize;
    var kwName = keyword ? (/[^\x00-\x7F]/.test(keyword) ? Buffer.from(keyword, 'utf8').toString('base64') : keyword) : '';

// club 角色现在也看全部,不按俱乐部过滤
    var joinSql = '';
    var extraWhere = '';

    if(keyword){
        extraWhere = ' WHERE t_users.userid LIKE "%' + keyword + '%" OR t_users.account LIKE "%' + keyword + '%" OR t_users.name LIKE "%' + kwName + '%"';
    }
    // club 角色 + keyword 时,where 需要跟 join 结合
    // club 无 keyword: join 本身就过滤了; club 有 keyword: join + where 都生效
    var countSql = 'SELECT COUNT(*) as total FROM t_users' + joinSql + extraWhere;
    db.query(countSql, function(err, countRows){
        if(err){ send(res, 500, "数据库错误"); return; }
        var total = countRows[0].total;
        var sql = 'SELECT t_users.userid,t_users.account,t_users.name,t_users.sex,t_users.gems,t_users.coins,t_users.roomid FROM t_users' + joinSql + extraWhere + ' ORDER BY t_users.userid DESC LIMIT ' + offset + ',' + pageSize;
        db.query(sql, function(err, rows){
            if(err){ send(res, 500, "数据库错误"); return; }
            rows.forEach(function(r){ if(r.name){ r.name = crypto.fromBase64(r.name); } });
            send(res, 0, "ok", {list: rows, total: total, page: page, pageSize: pageSize});
        });
    });
});

// 加减房卡（钻石）
app.post('/admin/user/gems', auth, function(req, res){
    var userid = req.body.userid;
    var gems = req.body.gems; // 正数加，负数减
    if(!userid || gems == null){
        send(res, 1, "参数错误");
        return;
    }
    db.add_user_gems(userid, gems, function(suc){
        if(suc){
            send(res, 0, "ok");
        } else {
            send(res, 1, "操作失败");
        }
    });
});

// 删除玩家（超级管理员/俱乐部管理员都可以）
app.delete('/admin/user/:userid', auth, function(req, res){
    var userid = parseInt(req.params.userid);
    if(!userid){ send(res, 1, "参数错误"); return; }
    // 先查是否是俱乐部社长，不能删
    db.query('SELECT COUNT(*) as c FROM t_clubs WHERE owner_userid = ' + userid, function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        if(rows[0].c > 0){ send(res, 1, "该玩家是俱乐部社长，不能删除"); return; }
        // 踢下线
        db.query('UPDATE t_users SET roomid = NULL WHERE userid = ' + userid, function(){
            // 删用户相关数据
            db.query('DELETE FROM t_club_members WHERE userid = ' + userid, function(){
                db.query('DELETE FROM t_users WHERE userid = ' + userid, function(err2){
                    if(err2){ send(res, 500, "删除失败"); return; }
                    send(res, 0, "ok");
                });
            });
        });
    });
});

// ============ 系统配置 ============
app.get('/admin/sys_config', auth, function(req, res){
    db.query('SELECT * FROM t_sys_config', function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        var map = {};
        rows.forEach(function(r){ map[r.k] = r.v; });
        send(res, 0, "ok", map);
    });
});

app.post('/admin/sys_config', auth, function(req, res){
    var items = req.body.items || {};
    var sqls = [];
    for(var k in items){
        sqls.push('("' + k + '","' + items[k] + '","")');
    }
    if(sqls.length == 0){ send(res, 1, "无数据"); return; }
    var sql = 'INSERT INTO t_sys_config(k,v,remark) VALUES ' + sqls.join(',') + ' ON DUPLICATE KEY UPDATE v=VALUES(v)';
    db.query(sql, function(err, result){
        if(err){ send(res, 500, "数据库错误"); return; }
        send(res, 0, "ok");
    });
});

// ============ 房间统计 ============
app.get('/admin/rooms/stats', auth, function(req, res){
    // 返回当前在线房间数（从 game_server 获取，这里简化为查数据库）
    db.query('SELECT COUNT(*) as total FROM t_rooms', function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        send(res, 0, "ok", {online_rooms: rows[0].total});
    });
});

// ============ 战绩查询 ============
// 查询所有游戏记录
app.get('/admin/games', auth, function(req, res){
    var limit = parseInt(req.query.limit) || 50;
    var offset = parseInt(req.query.offset) || 0;
    var sql = 'SELECT g.*, r.id as room_id FROM t_games g LEFT JOIN t_rooms r ON g.room_uuid = r.uuid ORDER BY g.create_time DESC LIMIT ' + offset + ',' + limit;
    db.query(sql, function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        // 解析 result 和 base_info
        rows.forEach(function(r){
            if(r.result){
                try { r.result = JSON.parse(r.result); } catch(e){}
            }
            if(r.base_info){
                try { r.base_info = JSON.parse(r.base_info); } catch(e){}
            }
        });
        send(res, 0, "ok", rows);
    });
});

// 查询某用户的战绩历史
app.get('/admin/history/:userId', auth, function(req, res){
    var userId = req.params.userId;
    db.get_user_history(userId, function(history){
        send(res, 0, "ok", history || []);
    });
});

// ============ 权限辅助 ============
// 超级管理员:拥有全部权限
function requireSuper(req, res, next){
    var role = String((req.adminUser && req.adminUser.role) || '').trim().toLowerCase();
    if(role !== 'super'){
        send(res, 403, "需要超级管理员权限");
        return;
    }
    next();
}

// 校验是否可操作指定俱乐部:所有管理员都可操作
function checkClubOwn(req, res, clubId){
    if(!req.adminUser){ send(res, 403, "未登录"); return false; }
    return true;
}

// 解析当前操作的俱乐部ID:所有角色都从参数取club_id,club 角色能操作任何俱乐部
function resolveClubId(req, res){
    if(!req.adminUser){ send(res, 403, "未登录"); return null; }
    var cid = parseInt(req.query.club_id || (req.body && req.body.club_id));
    if(!(cid > 0)){ send(res, 1, "club_id required"); return null; }
    return cid;
}

// ============ 俱乐部内容管理(超级管理员/俱乐部管理员均可,按角色限权) ============
// 俱乐部信息
app.get('/admin/club_detail', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    db.club_get(cid, function(club){
        if(!club){ send(res, 1, "俱乐部不存在"); return; }
        send(res, 0, "ok", club);
    });
});

// 俱乐部玩法列表
app.get('/admin/club_games', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    db.club_games_with_count(cid, function(rows){
        var list = rows.map(function(r){
            return {
                id: r.id, club_id: r.club_id, game_type: r.game_type, name: r.name,
                difen_options: JSON.parse(r.difen_options),
                jushu_options: JSON.parse(r.jushu_options),
                cost_options: JSON.parse(r.cost_options),
                sort: r.sort, enabled: r.enabled, table_count: r.table_count,
                max_players: r.max_players,
                cai7: r.cai7 != null ? r.cai7 : 0,
                remove_tiao: r.remove_tiao != null ? r.remove_tiao : 0,
                cai_chi: r.cai_chi != null ? r.cai_chi : 1,
                cai_peng: r.cai_peng != null ? r.cai_peng : 1,
                cai_gang: r.cai_gang != null ? r.cai_gang : 1,
                cai_pure: r.cai_pure != null ? r.cai_pure : 0,
                hu_guo_confirm: r.hu_guo_confirm != null ? r.hu_guo_confirm : 1,
                dianpao_hu: r.dianpao_hu != null ? r.dianpao_hu : 1,
                tianhu_di: r.tianhu_di != null ? r.tianhu_di : 1,
                cai_diao: r.cai_diao != null ? r.cai_diao : 1,
                gp_bomb: r.gp_bomb != null ? r.gp_bomb : 1,
                gp_bomb_four: r.gp_bomb_four != null ? r.gp_bomb_four : 1,
                gp_four_two: r.gp_four_two != null ? r.gp_four_two : 1,
                gp_four_three: r.gp_four_three != null ? r.gp_four_three : 1,
                gp_three_one: r.gp_three_one != null ? r.gp_three_one : 1,
                gp_last_three_one: r.gp_last_three_one != null ? r.gp_last_three_one : 0,
                gp_last_four_two_three: r.gp_last_four_two_three != null ? r.gp_last_four_two_three : 0,
                gp_straight_a2: r.gp_straight_a2 != null ? r.gp_straight_a2 : 1,
                gp_card_history: r.gp_card_history != null ? r.gp_card_history : 0,
                auto_dissolve_seconds: r.auto_dissolve_seconds != null ? r.auto_dissolve_seconds : 300,
                tai_rules: r.tai_rules || null
            };
        });
        send(res, 0, "ok", list);
    });
});

// 可添加的玩法(返回全局全部启用玩法,附带 added 标记,前端据此禁选已添加项)
app.get('/admin/club_available_games', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    db.query('SELECT type,name,difen_options,jushu_options,cost_options,max_players,sort,cai7,remove_tiao,cai_chi,cai_peng,cai_gang,cai_pure,hu_guo_confirm,dianpao_hu,tianhu_di,cai_diao,gp_bomb,gp_bomb_four,gp_four_two,gp_four_three,gp_three_one,gp_last_three_one,gp_last_four_two_three,gp_straight_a2,gp_card_history FROM t_game_config WHERE enabled=1 ORDER BY sort', function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        db.club_games_with_count(cid, function(used){
            var usedTypes = {};
            used.forEach(function(u){ usedTypes[u.game_type] = 1; });
            var list = rows.map(function(r){
                return {
                    type: r.type, name: r.name,
                    added: !!usedTypes[r.type],
                    difen_options: JSON.parse(r.difen_options),
                    jushu_options: JSON.parse(r.jushu_options),
                    cost_options: JSON.parse(r.cost_options),
                    max_players: r.max_players,
                    cai7: r.cai7 != null ? r.cai7 : 0,
                    remove_tiao: r.remove_tiao != null ? r.remove_tiao : 0,
                    cai_chi: r.cai_chi != null ? r.cai_chi : 1,
                    cai_peng: r.cai_peng != null ? r.cai_peng : 1,
                    cai_gang: r.cai_gang != null ? r.cai_gang : 1,
                cai_pure: r.cai_pure != null ? r.cai_pure : 0,
                    hu_guo_confirm: r.hu_guo_confirm != null ? r.hu_guo_confirm : 1,
                    dianpao_hu: r.dianpao_hu != null ? r.dianpao_hu : 1,
                    tianhu_di: r.tianhu_di != null ? r.tianhu_di : 1,
                    cai_diao: r.cai_diao != null ? r.cai_diao : 1
                };
            });
            send(res, 0, "ok", list);
        });
    });
});

// 新增俱乐部玩法
app.post('/admin/club_game', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var c = req.body || {};
    if(!c.game_type || !c.name){ send(res, 1, "玩法类型和名称不能为空"); return; }
    db.club_game_add(cid, c.game_type, c.name,
        c.difen_options || [1, 2, 5], c.jushu_options || [4, 8], c.cost_options || [2, 3],
        c.sort || 0, c.tai_rules || null, function(id){
            if(id == null){ send(res, 1, "添加失败(该玩法可能已存在)"); return; }
            send(res, 0, "ok", {id: id});
        });
});

// 修改俱乐部玩法
app.put('/admin/club_game/:id', auth, function(req, res){
    var id = parseInt(req.params.id);
    db.club_game_get(id, function(g){
        if(!g){ send(res, 1, "玩法不存在"); return; }
        if(!checkClubOwn(req, res, g.club_id)) return;
        db.club_game_update(id, req.body || {}, function(ok){
            send(res, ok ? 0 : 1, ok ? "ok" : "更新失败");
        });
    });
});

// 删除俱乐部玩法(连同该玩法下的牌桌)
app.delete('/admin/club_game/:id', auth, function(req, res){
    var id = parseInt(req.params.id);
    db.club_game_get(id, function(g){
        if(!g){ send(res, 1, "玩法不存在"); return; }
        if(!checkClubOwn(req, res, g.club_id)) return;
        db.club_game_delete(id, function(ok){
            send(res, ok ? 0 : 1, ok ? "ok" : "删除失败");
        });
    });
});

// 某玩法下的牌桌列表
app.get('/admin/club_tables', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var gt = req.query.game_type;
    if(!gt){ send(res, 1, "game_type required"); return; }
    db.club_tables(cid, gt, function(rows){
        send(res, 0, "ok", rows);
    });
});

// 新增牌桌
app.post('/admin/club_table', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var c = req.body || {};
    if(!c.game_type || !c.name){ send(res, 1, "玩法类型和牌桌名称不能为空"); return; }
    if(!checkClubOwn(req, res, cid)) return;
    var conf = c.conf;
    if(conf == null || conf === ''){ conf = {type: c.game_type, difen: 0, jushuxuanze: 0}; }
    if(typeof conf !== 'string'){ conf = JSON.stringify(conf); }
    db.club_add_table(cid, c.game_type, c.name, conf, function(id){
        if(id == null){ send(res, 1, "添加失败"); return; }
        send(res, 0, "ok", {id: id});
    });
});

// 删除牌桌
app.delete('/admin/club_table/:id', auth, function(req, res){
    var id = parseInt(req.params.id);
    db.club_get_table(id, function(t){
        if(!t){ send(res, 1, "牌桌不存在"); return; }
        if(!checkClubOwn(req, res, t.club_id)) return;
        db.club_delete_table(id, function(ok){
            send(res, ok ? 0 : 1, ok ? "ok" : "删除失败");
        });
    });
});

// ============ 清空牌桌(强制释放房间占用) ============
//按牌桌清空:解散该牌桌绑定的房间,踢出所有玩家并释放占用;成功后解绑牌桌。
//超级管理员可清任意俱乐部,俱乐部管理员只能清自己俱乐部的牌桌
app.post('/admin/club_table/clear', auth, function(req, res){
    var c = req.body || {};
    var tableId = parseInt(c.tableid);
    var roomId = c.roomid != null ? String(c.roomid) : null;
    var priKey = (config && config.ROOM_PRI_KEY) ? config.ROOM_PRI_KEY : '~!@#$(*&^%$&';
    var callGameServer = function(rid, cb){
        db.get_room_data(rid, function(roomData){
            if(roomData == null){ cb(false, "房间不存在或已释放"); return; }
            var sign = crypto.md5(rid + priKey);
            http.get(roomData.ip, roomData.port, '/clear_room?roomid=' + rid + '&sign=' + sign, null, function(ret, data){
                cb(ret && data && data.errcode == 0, ret ? (data && data.errmsg) : "游戏服无响应");
            });
        });
    };
    if(tableId > 0){
        db.club_get_table(tableId, function(t){
            if(!t){ send(res, 1, "牌桌不存在"); return; }
            if(!checkClubOwn(req, res, t.club_id)) return;
            if(t.roomid == null){ send(res, 0, "ok"); return; }
            callGameServer(String(t.roomid), function(ok, why){
                if(ok){
                    db.club_set_table_room(tableId, null, function(){ send(res, 0, "ok"); });
                    return;
                }
                //房间已不存在(游戏服已销毁/重启丢失)时直接解绑也算成功
                db.get_room_data(String(t.roomid), function(rd){
                    if(rd == null){
                        db.club_set_table_room(tableId, null, function(){ send(res, 0, "ok"); });
                    }
                    else{
                        send(res, 1, why || "清空失败");
                    }
                });
            });
        });
        return;
    }
    if(roomId != null){
        if(req.adminUser.role !== 'super'){ send(res, 403, "仅超级管理员可按房间号清空"); return; }
        callGameServer(roomId, function(ok, why){
            if(ok){ send(res, 0, "ok"); } else { send(res, 1, why || "清空失败"); }
        });
        return;
    }
    send(res, 1, "tableid或roomid必填其一");
});

// 俱乐部成员列表(含房卡)
app.get('/admin/club_members', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    db.club_members(cid, function(rows){
        send(res, 0, "ok", rows);
    });
});

// 给本俱乐部成员增减房卡(仅限成员)
app.post('/admin/club_member/gems', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var c = req.body || {};
    var userid = parseInt(c.userid);
    var gems = parseInt(c.gems);
    if(!(userid > 0) || isNaN(gems)){ send(res, 1, "参数错误"); return; }
    db.club_member_gems(cid, userid, gems, function(ok, why){
        if(ok){ send(res, 0, "ok"); return; }
        send(res, 1, why === 'not_member' ? "该用户不是本俱乐部成员" : "操作失败");
    });
});

// ============ 俱乐部成员扩展操作 ============
// 添加成员
app.post('/admin/club_member/add', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var c = req.body || {};
    var userid = parseInt(c.userid);
    if(!(userid > 0)){ send(res, 1, "参数错误"); return; }
    db.club_member_add(cid, userid, function(ok){
        send(res, ok ? 0 : 1, ok ? "ok" : "添加失败");
    });
});

// 删除成员
app.post('/admin/club_member/delete', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var c = req.body || {};
    var userid = parseInt(c.userid);
    if(!(userid > 0)){ send(res, 1, "参数错误"); return; }
    db.club_member_delete(cid, userid, function(ok){
        send(res, ok ? 0 : 1, ok ? "ok" : "删除失败");
    });
});

// 踢出成员(从房间中踢出,不删成员关系)
app.post('/admin/club_member/kick', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var c = req.body || {};
    var userid = parseInt(c.userid);
    if(!(userid > 0)){ send(res, 1, "参数错误"); return; }
    // 通过游戏服踢人
    var priKey = (config && config.ROOM_PRI_KEY) ? config.ROOM_PRI_KEY : '~!@#$(*&^%$&';
    var sign = crypto.md5(String(userid) + priKey);
    // 先查用户所在房间
    db.query('SELECT roomid FROM t_users WHERE userid = ' + userid, function(err, rows){
        if(err || !rows || rows.length == 0 || !rows[0].roomid){
            send(res, 0, "ok"); return; // 不在房间也算成功
        }
        var roomId = rows[0].roomid;
        var rsign = crypto.md5(String(roomId) + priKey);
        http.get(roomData.ip, roomData.port, '/kick_user?roomid=' + roomId + '&userid=' + userid + '&sign=' + rsign, null, function(ret, data){
            send(res, 0, "ok");
        });
    });
});

// 成员战绩
app.get('/admin/club_member/records', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var userid = parseInt(req.query.userid);
    var fromTime = parseInt(req.query.from_time) || 0;
    if(!(userid > 0)){ send(res, 1, "参数错误"); return; }
    db.club_member_records(cid, userid, fromTime, function(rows){
        send(res, 0, "ok", rows);
    });
});

// 成员豆豆明细
app.get('/admin/club_member/bean_logs', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var userid = parseInt(req.query.userid);
    var fromTime = parseInt(req.query.from_time) || 0;
    if(!(userid > 0)){ send(res, 1, "参数错误"); return; }
    db.club_member_bean_logs(cid, userid, fromTime, function(rows){
        send(res, 0, "ok", rows);
    });
});

// 设为合伙人
app.post('/admin/club_member/set_partner', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var c = req.body || {};
    var userid = parseInt(c.userid);
    var name = c.name || null;
    if(!(userid > 0)){ send(res, 1, "参数错误"); return; }
    db.club_member_set_partner(cid, userid, name, function(newClubId){
        if(newClubId == null){ send(res, 1, "设置失败"); return; }
        send(res, 0, "ok", {partner_club_id: newClubId});
    });
});

// ============ 玩法配置管理(多配置) ============
// 玩法配置列表
app.get('/admin/club_game_configs', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    db.club_game_get_configs(cid, function(rows){
        send(res, 0, "ok", rows);
    });
});

// 新建玩法配置(自动加牌桌)
app.post('/admin/club_game_config', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    if(!checkClubOwn(req, res, cid)) return;
    var c = req.body || {};
    if(!c.game_type || !c.name){ send(res, 1, "玩法类型和名称不能为空"); return; }
    db.club_game_add_with_config(cid, c.game_type, c.name, c, function(id){
        if(id == null){ send(res, 1, "添加失败(该玩法可能已存在)"); return; }
        send(res, 0, "ok", {id: id});
    });
});

// 修改玩法配置
app.put('/admin/club_game_config/:id', auth, function(req, res){
    var id = parseInt(req.params.id);
    db.club_game_get_config(id, function(g){
        if(!g){ send(res, 1, "玩法配置不存在"); return; }
        if(!checkClubOwn(req, res, g.club_id)) return;
        db.club_game_update_config(id, req.body || {}, function(ok){
            send(res, ok ? 0 : 1, ok ? "ok" : "更新失败");
        });
    });
});

// 删除玩法配置
app.delete('/admin/club_game_config/:id', auth, function(req, res){
    var id = parseInt(req.params.id);
    db.club_game_get_config(id, function(g){
        if(!g){ send(res, 1, "玩法配置不存在"); return; }
        if(!checkClubOwn(req, res, g.club_id)) return;
        db.club_game_delete(id, function(ok){
            send(res, ok ? 0 : 1, ok ? "ok" : "删除失败");
        });
    });
});

// 关闭/开启玩法配置
app.post('/admin/club_game_config/:id/close', auth, function(req, res){
    var id = parseInt(req.params.id);
    var enabled = parseInt(req.body.enabled);
    db.club_game_get_config(id, function(g){
        if(!g){ send(res, 1, "玩法配置不存在"); return; }
        if(!checkClubOwn(req, res, g.club_id)) return;
        db.club_game_update_config(id, {enabled: enabled}, function(ok){
            send(res, ok ? 0 : 1, ok ? "ok" : "操作失败");
        });
    });
});

// ============ 合伙人管理 ============
// 合伙人列表
app.get('/admin/partners', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    db.partner_list(cid, function(rows){
        send(res, 0, "ok", rows);
    });
});

// 合伙人加减豆豆(给合伙人俱乐部社长加, 支持直接下级+二级+三级)
app.post('/admin/partner/gems', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var c = req.body || {};
    var partnerClubId = parseInt(c.partner_club_id);
    var gems = parseInt(c.gems);
    if(!(partnerClubId > 0) || isNaN(gems)){ send(res, 1, "参数错误"); return; }
    // 校验: partnerClubId 必须是 cid 的下级(递归任意层级)
    db.query('SELECT owner_userid, parent_clubid FROM t_clubs WHERE id = ' + partnerClubId, function(err, club){
        if(err || !club || club.length === 0){ send(res, 1, "合伙人不存在"); return; }
        // BFS 反向走祖先链, 看 cid 是否在祖先里(最多 5 层)
        var cur = club[0].parent_clubid;
        var depth = 0;
        var found = false;
        var walkUp = function(){
            if(found){
                db.add_user_gems(club[0].owner_userid, gems, function(ok){
                    send(res, ok ? 0 : 1, ok ? "ok" : "操作失败");
                }, {changeType: "合伙人豆豆调整", clubId: cid, partnerClubId: partnerClubId});
                return;
            }
            if(depth++ > 5 || !(cur > 0)){ send(res, 1, "合伙人不属于当前顶级俱乐部"); return; }
            if(cur === cid){ found = true; walkUp(); return; }
            db.query('SELECT parent_clubid FROM t_clubs WHERE id = ' + cur, function(e, r){
                if(e || !r || !r.length){ send(res, 1, "合伙人归属验证失败"); return; }
                cur = r[0].parent_clubid; walkUp();
            });
        };
        walkUp();
    });
});

// 调整合伙人比例
app.put('/admin/partner/ratio', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var c = req.body || {};
    var partnerClubId = parseInt(c.partner_club_id);
    var ratio = parseFloat(c.ratio);
    if(!(partnerClubId > 0) || isNaN(ratio) || ratio < 0 || ratio > 100){ send(res, 1, "参数错误"); return; }
    db.partner_upsert(cid, partnerClubId, {profit_ratio: ratio}, function(ok){
        send(res, ok ? 0 : 1, ok ? "ok" : "操作失败");
    });
});

// 合伙人收益详情
app.get('/admin/partner/profit', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var partnerClubId = parseInt(req.query.partner_club_id);
    var fromTime = parseInt(req.query.from_time) || 0;
    if(!(partnerClubId > 0)){ send(res, 1, "参数错误"); return; }
    db.partner_profit_detail(cid, partnerClubId, fromTime, function(rows){
        send(res, 0, "ok", rows);
    });
});

// 删除合伙人
// 删除合伙人(解除归属, 支持任意层级, 向上走祖先链验证)
app.delete('/admin/partner/:id', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var partnerClubId = parseInt(req.params.id);
    if(!(partnerClubId > 0)){ send(res, 1, "参数错误"); return; }
    db.query('SELECT id, parent_clubid FROM t_clubs WHERE id = ' + partnerClubId, function(err, rows){
        if(err || !rows || !rows.length){ send(res, 1, "合伙人不存在"); return; }
        var cur = rows[0].parent_clubid; var depth = 0; var found = false;
        var walkUp = function(){
            if(found){
                db.admin_club_delete(partnerClubId, function(ok){
                    send(res, ok ? 0 : 1, ok ? "ok" : "删除失败");
                });
                return;
            }
            if(depth++ > 5 || !(cur > 0)){ send(res, 1, "合伙人不属于当前顶级俱乐部"); return; }
            if(cur === cid){ found = true; walkUp(); return; }
            db.query('SELECT parent_clubid FROM t_clubs WHERE id = ' + cur, function(e, r){
                if(e || !r || !r.length){ send(res, 1, "验证失败"); return; }
                cur = r[0].parent_clubid; walkUp();
            });
        };
        walkUp();
    });
});

// 合伙人统计
app.get('/admin/partner/stats', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    db.partner_stats_overview(cid, function(data){
        send(res, 0, "ok", data || {});
    });
});

// ============ 奖励明细 ============
app.get('/admin/rewards', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var partnerClubId = parseInt(req.query.partner_club_id) || 0;
    var rewardType = req.query.reward_type || null;
    var fromTime = parseInt(req.query.from_time) || 0;
    db.reward_logs(cid, partnerClubId, rewardType, fromTime, function(rows){
        send(res, 0, "ok", rows);
    });
});

// ============ 俱乐部总览 ============
app.get('/admin/club/overview', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    db.club_overview(cid, function(data){
        send(res, 0, "ok", data || {});
    });
});

// ============ 俱乐部管理(仅超级管理员增删改,所有管理员可读列表) ============
app.get('/admin/clubs', auth, function(req, res){
    db.admin_club_list(function(rows){
        send(res, 0, "ok", rows);
    });
});

app.post('/admin/club', auth, function(req, res){
    var c = req.body || {};
    var owner = parseInt(c.owner_userid);
    if(!c.name || !(owner > 0)){ send(res, 1, "俱乐部名称和社长用户ID不能为空"); return; }
    db.admin_club_add(c.name, owner, function(id){
        if(id == null){ send(res, 1, "创建失败"); return; }
        send(res, 0, "ok", {id: id});
    });
});

//录入/取消一级俱乐部: 一级俱乐部的社长增减豆豆不受自身豆豆数量限制
app.post('/admin/club/top_level', auth, function(req, res){
    var c = req.body || {};
    var id = parseInt(c.id);
    if(!(id > 0)){ send(res, 1, "俱乐部ID不能为空"); return; }
    db.club_get(id, function(club){
        if(club == null){ send(res, 1, "俱乐部不存在"); return; }
        db.admin_club_set_top_level(id, !!Number(c.is_top_level), function(ok){
            send(res, ok ? 0 : 1, ok ? "ok" : "设置失败");
        });
    });
});

app.put('/admin/club/:id', auth, function(req, res){
    var id = parseInt(req.params.id);
    var c = req.body || {};
    db.admin_club_update(id, c.name || null, c.owner_userid ? parseInt(c.owner_userid) : null, function(ok){
        send(res, ok ? 0 : 1, ok ? "ok" : "更新失败");
    });
});

app.delete('/admin/club/:id', auth, function(req, res){
    var id = parseInt(req.params.id);
    var priKey = (config && config.ROOM_PRI_KEY) ? config.ROOM_PRI_KEY : '~!@#$(*&^%$&';
    // 先查出所有该俱乐部的牌桌,逐个清场(解散运行中房间)
    db.query('SELECT id, roomid FROM t_club_tables WHERE club_id = ' + id, function(err, tables){
        if(err){ send(res, 500, "数据库错误"); return; }
        if(!tables || tables.length === 0){
            // 没有牌桌,直接删
            db.admin_club_delete(id, function(ok){
                send(res, ok ? 0 : 1, ok ? "ok" : "删除失败");
            });
            return;
        }
        // 逐个清理有房间占用的牌桌
        var idx = 0;
        function clearNext(){
            if(idx >= tables.length){
                // 所有牌桌清完,开始级联删除
                db.admin_club_delete(id, function(ok){
                    send(res, ok ? 0 : 1, ok ? "ok" : "删除失败");
                });
                return;
            }
            var t = tables[idx++];
            if(t.roomid == null){ clearNext(); return; }
            // 调 game_server clear_room 解散房间
            db.get_room_data(String(t.roomid), function(roomData){
                if(roomData == null){
                    // 房间已不存在,直接解绑牌桌
                    db.query('UPDATE t_club_tables SET roomid = NULL WHERE id = ' + t.id, function(){ clearNext(); });
                    return;
                }
                var sign = crypto.md5(String(t.roomid) + priKey);
                http.get(roomData.ip, roomData.port, '/clear_room?roomid=' + t.roomid + '&sign=' + sign, null, function(){
                    db.query('UPDATE t_club_tables SET roomid = NULL WHERE id = ' + t.id, function(){ clearNext(); });
                });
            });
        }
        clearNext();
    });
});

// ============ 管理员账号管理 ============
// GET 列表:super 看全部; club 只看非 super 的管理员(不能看超级管理员)
app.get('/admin/admin_users', auth, function(req, res){
    db.admin_user_list(function(rows){
        if(req.adminUser.role !== 'super'){
            rows = (rows || []).filter(function(u){ return u.role !== 'super'; });
        }
        send(res, 0, "ok", rows);
    });
});

// POST 新建:新建管理员,不绑定俱乐部
app.post('/admin/admin_user', auth, function(req, res){
    var c = req.body || {};
    var role = c.role === 'club' ? 'club' : 'super';
    if(!c.username || !c.password){ send(res, 1, "用户名和密码不能为空"); return; }
    db.admin_user_add(c.username, crypto.md5(c.password), role, null, function(id, err){
        if(id == null){
            send(res, 1, (err && err.code === 'ER_DUP_ENTRY') ? "用户名已存在" : "创建失败");
            return;
        }
        send(res, 0, "ok", {id: id});
    });
});

// PUT 更新:super 可改任意管理员密码/role/club_id; club 只能改非 super 的密码
app.put('/admin/admin_user/:id', auth, function(req, res){
    var id = parseInt(req.params.id);
    var c = req.body || {};
    var fields = {};
    var isSuper = req.adminUser.role === 'super';
    db.query('SELECT role FROM t_admin_users WHERE id=' + id + ' LIMIT 1', function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        if(!rows || rows.length === 0){ send(res, 1, "管理员不存在"); return; }
        if(!isSuper && rows[0].role === 'super'){ send(res, 403, "无权修改超级管理员"); return; }
        if(c.password){ fields.password = crypto.md5(c.password); }
        if(isSuper){
            if(c.role){ fields.role = c.role === 'club' ? 'club' : 'super'; }
            if(c.club_id !== undefined && c.club_id !== null){
                fields.club_id = c.club_id === '' ? null : parseInt(c.club_id);
            }
        }
        db.admin_user_update(id, fields, function(ok){
            send(res, ok ? 0 : 1, ok ? "ok" : "更新失败");
        });
    });
});

// DELETE 删除:super 可删任意;club 只能删非 super 的管理员
app.delete('/admin/admin_user/:id', auth, function(req, res){
    var id = parseInt(req.params.id);
    if(id === 1){ send(res, 1, "默认超级管理员账号不可删除"); return; }
    var delUserRole = null;
    db.query('SELECT role FROM t_admin_users WHERE id=' + id + ' LIMIT 1', function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        if(!rows || rows.length === 0){ send(res, 1, "管理员不存在"); return; }
        delUserRole = rows[0].role;
        if(req.adminUser.role !== 'super' && delUserRole === 'super'){
            send(res, 403, "无权删除超级管理员"); return;
        }
        db.admin_user_delete(id, function(ok){ send(res, ok ? 0 : 1, ok ? "ok" : "删除失败"); });
    });
});

// ============ APP包发布(仅超级管理员) ============
var UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
var APK_FILE = path.join(UPLOAD_DIR, 'baobao.apk');

// 读取当前发布的APP信息(版本号/大小/更新时间/下载地址)
function getAppInfo(callback){
    db.query('SELECT k,v FROM t_sys_config WHERE k IN ("app_version","app_size","app_update_time")', function(err, rows){
        var info = { version: '', size: 0, update_time: 0, has_file: fs.existsSync(APK_FILE), url: '/uploads/baobao.apk' };
        if(!err && rows){
            rows.forEach(function(r){
                if(r.k === 'app_version') info.version = r.v;
                else if(r.k === 'app_size') info.size = parseInt(r.v) || 0;
                else if(r.k === 'app_update_time') info.update_time = parseInt(r.v) || 0;
            });
        }
        callback(info);
    });
}

// 管理后台查询当前APP发布信息
app.get('/admin/app/info', auth, function(req, res){
    getAppInfo(function(info){ send(res, 0, "ok", info); });
});

// 上传APP安装包(APK):优先直接上传二进制,避免Base64增加约33%请求体积;兼容旧base64方式
app.post('/admin/app/upload', auth, requireSuper, express.raw({
    type: ['application/vnd.android.package-archive', 'application/octet-stream'],
    limit: '512mb'
}), function(req, res){
    var body = req.body || {};
    var version = String(req.query.version || body.version || '').trim();
    if(!version){ send(res, 1, "版本号不能为空"); return; }
    var buf;
    if(Buffer.isBuffer(body)){
        buf = body;
    } else {
        var base64 = body.base64 || '';
        if(!base64){ send(res, 1, "文件内容为空"); return; }
        // 去掉 data URI 前缀(如 "data:application/vnd.android.package-archive;base64,")
        var commaIdx = base64.indexOf(',');
        if(commaIdx >= 0 && base64.indexOf('base64') >= 0){ base64 = base64.substring(commaIdx + 1); }
        try { buf = Buffer.from(base64, 'base64'); }
        catch(e){ send(res, 1, "文件解析失败"); return; }
    }
    if(buf.length < 1024){ send(res, 1, "文件过小,可能不是有效APK"); return; }
    // 先写临时文件,成功后再rename,避免中途失败留下残缺包
    var tmpFile = APK_FILE + '.tmp';
    fs.writeFile(tmpFile, buf, function(err){
        if(err){ send(res, 1, "写入文件失败: " + err.message); return; }
        fs.rename(tmpFile, APK_FILE, function(err){
            if(err){ send(res, 1, "替换安装包失败"); return; }
            var now = Math.floor(Date.now()/1000);
            var items = { app_version: version, app_size: String(buf.length), app_update_time: String(now) };
            var sqls = [];
            for(var k in items){ sqls.push('("' + k + '","' + items[k] + '","APP发布")'); }
            var sql = 'INSERT INTO t_sys_config(k,v,remark) VALUES ' + sqls.join(',') + ' ON DUPLICATE KEY UPDATE v=VALUES(v)';
            db.query(sql, function(err){
                if(err){ send(res, 0, "安装包已上传,但版本信息保存失败: " + err.message, {version: version, size: buf.length}); return; }
                send(res, 0, "ok", {version: version, size: buf.length});
            });
        });
    });
});

// ============ 观战:实时查看进行中的麻将牌局(全明牌) ============
// 观战使用独立账号(t_spectate_users, 由超级后台录入), 与管理员账号互不影响
function spectateAuth(req, res, next){
    var token = req.headers['authorization'] || req.query.token;
    if(!token){ send(res, 401, "未登录"); return; }
    db.spectate_token_get(token, function(user){
        if(!user){ send(res, 401, "登录已过期, 请重新登录"); return; }
        req.spectateUser = user;
        next();
    });
}

var SPECTATE_PWD_MIN = 4;
function validSpectatePwd(pwd){
    return typeof pwd === "string" && pwd.length >= SPECTATE_PWD_MIN && pwd.length <= 32;
}

// 观战账号登录
app.post('/admin/spectate/login', function(req, res){
    var username = String((req.body && req.body.username) || "").trim();
    var password = String((req.body && req.body.password) || "");
    if(!username || !password){ send(res, 1, "账号或密码不能为空"); return; }
    db.spectate_user_get(username, function(user){
        if(!user){ send(res, 1, "账号或密码错误"); return; }
        if(!user.enabled){ send(res, 1, "该账号已被禁用"); return; }
        if(user.password !== crypto.md5(password)){ send(res, 1, "账号或密码错误"); return; }
        var token = crypto.md5("spectate_" + username + Date.now() + Math.random());
        db.spectate_token_set(user.id, token, function(){
            send(res, 0, "ok", {token: token, username: user.username});
        });
    });
});

// 观战账号退出
app.post('/admin/spectate/logout', spectateAuth, function(req, res){
    db.spectate_token_del(req.headers['authorization'], function(){
        send(res, 0, "ok");
    });
});

// 当前登录账号
app.get('/admin/spectate/me', spectateAuth, function(req, res){
    send(res, 0, "ok", {username: req.spectateUser.username});
});

// 修改自己的密码(校验旧密码)
app.post('/admin/spectate/change_password', spectateAuth, function(req, res){
    var oldPwd = String((req.body && req.body.old_password) || "");
    var newPwd = String((req.body && req.body.new_password) || "");
    if(!validSpectatePwd(newPwd)){ send(res, 1, "新密码长度为" + SPECTATE_PWD_MIN + "-32位"); return; }
    db.spectate_user_get(req.spectateUser.username, function(user){
        if(!user){ send(res, 1, "账号不存在"); return; }
        if(user.password !== crypto.md5(oldPwd)){ send(res, 1, "旧密码不正确"); return; }
        if(oldPwd === newPwd){ send(res, 1, "新密码不能与旧密码相同"); return; }
        db.spectate_user_update(user.id, {password: crypto.md5(newPwd)}, function(err){
            if(err){ send(res, 500, "修改失败: " + err); return; }
            // 改密后让旧 token 失效, 强制重新登录
            db.spectate_token_del(req.headers['authorization'], function(){
                send(res, 0, "ok");
            });
        });
    });
});

// 观战:实时查看进行中的牌局
// 牌局数据在游戏服进程内, 账号服通过游戏服HTTP端口代理取快照
app.get('/admin/spectate/room', spectateAuth, function(req, res){
    var roomId = String(req.query.roomid || '').trim();
    if(!roomId){ send(res, 1, "请输入房间号"); return; }
    var cfg = config || {};
    var ip = cfg.GAME_HTTP_IP || '127.0.0.1';
    var port = cfg.GAME_HTTP_PORT || 9103;
    var sign = crypto.md5(roomId + (cfg.ROOM_PRI_KEY || ''));
    // 快照可能较大(全明牌+弃牌), 自己累积分片, 不用 utils/http 的单包解析
    var nodeHttp = require('http');
    var url = '/spectate?roomid=' + encodeURIComponent(roomId) + '&sign=' + sign;
    var reqGs = nodeHttp.request({hostname: ip, port: port, path: url, method: 'GET'}, function(resGs){
        var body = '';
        resGs.setEncoding('utf8');
        resGs.on('data', function(chunk){ body += chunk; });
        resGs.on('end', function(){
            var data = null;
            try { data = JSON.parse(body); } catch(e){ data = null; }
            if(data == null){ send(res, 2, "游戏服返回数据异常"); return; }
            if(data.errcode != 0){ send(res, data.errcode, data.errmsg || "查询失败"); return; }
            send(res, 0, "ok", data.data);
        });
    });
    reqGs.on('error', function(){ send(res, 2, "连接游戏服失败, 请确认游戏服已启动"); });
    reqGs.setTimeout(5000, function(){ reqGs.abort(); });
    reqGs.end();
});

// ---- 观战账号管理(超级后台录入/改密/禁用/删除) ----
app.get('/admin/spectate/users', auth, requireSuper, function(req, res){
    db.spectate_user_list(function(list){
        send(res, 0, "ok", list);
    });
});
app.post('/admin/spectate/user', auth, requireSuper, function(req, res){
    var username = String((req.body && req.body.username) || "").trim();
    var password = String((req.body && req.body.password) || "");
    if(!/^[a-zA-Z0-9_]{3,20}$/.test(username)){ send(res, 1, "账号需为3-20位字母/数字/下划线"); return; }
    if(!validSpectatePwd(password)){ send(res, 1, "密码长度为" + SPECTATE_PWD_MIN + "-32位"); return; }
    db.spectate_user_add(username, crypto.md5(password), function(err){
        if(err){
            if(/Duplicate/i.test(err)) send(res, 1, "该账号已存在");
            else send(res, 500, "新增失败: " + err);
            return;
        }
        send(res, 0, "ok");
    });
});
app.put('/admin/spectate/user/:id', auth, requireSuper, function(req, res){
    var id = parseInt(req.params.id, 10);
    if(!(id > 0)){ send(res, 1, "参数错误"); return; }
    var fields = {};
    if(req.body && req.body.password != null && req.body.password !== ""){
        var password = String(req.body.password);
        if(!validSpectatePwd(password)){ send(res, 1, "密码长度为" + SPECTATE_PWD_MIN + "-32位"); return; }
        fields.password = crypto.md5(password);
    }
    if(req.body && req.body.enabled != null){
        fields.enabled = !!req.body.enabled;
    }
    db.spectate_user_update(id, fields, function(err){
        if(err){ send(res, 500, "修改失败: " + err); return; }
        send(res, 0, "ok");
    });
});
app.delete('/admin/spectate/user/:id', auth, requireSuper, function(req, res){
    var id = parseInt(req.params.id, 10);
    if(!(id > 0)){ send(res, 1, "参数错误"); return; }
    db.spectate_user_delete(id, function(err){
        if(err){ send(res, 500, "删除失败: " + err); return; }
        send(res, 0, "ok");
    });
});


// 公开接口:下载页获取APP信息(手机端调用,无需登录)
app.get('/app/info', function(req, res){
    getAppInfo(function(info){
        res.setHeader("Content-Type","application/json;charset=utf-8");
        res.send(JSON.stringify({code:0,msg:"ok",data:info}));
    });
});

// ============ APP热更新发布(仅超级管理员) ============
var HOTUPDATE_DIR = path.join(__dirname, 'hotupdate');
var unzipUtil = require('../utils/unzip');

// 读取热更信息:版本号取version.manifest, 递归统计文件数/总大小
function getHotupdateInfo(callback){
    var info = { has_update: false, version: '', file_count: 0, total_size: 0, update_time: 0 };
    var manifestFile = path.join(HOTUPDATE_DIR, 'version.manifest');
    if(fs.existsSync(manifestFile)){
        info.has_update = true;
        try {
            var m = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
            info.version = m.version || '';
        } catch(e) {
            info.version = '(清单解析失败)';
        }
        try {
            var stat = fs.statSync(manifestFile);
            info.update_time = Math.floor(stat.mtime.getTime() / 1000);
            var count = 0, size = 0;
            (function walk(dir){
                var list = fs.readdirSync(dir);
                for(var i = 0; i < list.length; ++i){
                    var f = path.join(dir, list[i]);
                    var st = fs.statSync(f);
                    if(st.isDirectory()) walk(f);
                    else { count++; size += st.size; }
                }
            })(HOTUPDATE_DIR);
            info.file_count = count;
            info.total_size = size;
        } catch(e) {}
    }
    callback(info);
}

// 管理后台查询当前热更信息
app.get('/admin/hotupdate/info', auth, function(req, res){
    getHotupdateInfo(function(info){ send(res, 0, "ok", info); });
});

// 上传热更包(zip): base64方式, 解压校验后原子替换 hotupdate 目录
// zip 内容 = Cocos 构建产物目录(build/jsb-default 或 jsb-link)整体打包, 必须含 project.manifest 与 version.manifest
app.post('/admin/hotupdate/upload', auth, requireSuper, function(req, res){
    var body = req.body || {};
    var base64 = body.base64 || '';
    if(!base64){ send(res, 1, "文件内容为空"); return; }
    var commaIdx = base64.indexOf(',');
    if(commaIdx >= 0 && base64.indexOf('base64') >= 0){ base64 = base64.substring(commaIdx + 1); }
    var buf;
    try { buf = Buffer.from(base64, 'base64'); }
    catch(e){ send(res, 1, "文件解析失败"); return; }
    if(buf.length < 100){ send(res, 1, "文件过小, 可能不是有效zip"); return; }

    var tmpZip = path.join(UPLOAD_DIR, 'hotupdate_upload.zip');
    var tmpDir = path.join(UPLOAD_DIR, 'hotupdate_extract');
    // 1. 写临时zip
    fs.writeFile(tmpZip, buf, function(err){
        if(err){ send(res, 1, "写入临时文件失败: " + err.message); return; }
        // 2. 清空临时解压目录后解压
        unzipUtil.rmdirDeep(tmpDir);
        unzipUtil.unzip(tmpZip, tmpDir, function(err2, files){
            if(err2){ send(res, 1, "解压失败: " + err2.message); return; }
            // 3. zip 根目录若包了一层文件夹(整目录右键压缩常见), 下钻到含清单的一层
            var root = tmpDir;
            if(!fs.existsSync(path.join(root, 'project.manifest'))){
                var subs = fs.readdirSync(root).filter(function(f){
                    return fs.statSync(path.join(root, f)).isDirectory();
                });
                if(subs.length === 1 && fs.existsSync(path.join(root, subs[0], 'project.manifest'))){
                    root = path.join(root, subs[0]);
                }
            }
            // 4. 校验清单齐全
            if(!fs.existsSync(path.join(root, 'project.manifest')) || !fs.existsSync(path.join(root, 'version.manifest'))){
                send(res, 1, "热更包缺少 project.manifest / version.manifest, 请确认打包的是 Cocos 构建产物目录");
                return;
            }
            // 5. 清单里的下载地址: 只修正"本机回环地址"的情况
            //    构建清单里写的是公网地址(http://47.239.100.68:9100/hotupdate), 直接用即可;
            //    之前按请求 Host 强制改写, 经过 nginx 反代后 Host 变成 127.0.0.1:9100,
            //    结果手机上拿到 127.0.0.1 下载自己本机, 热更全部失败
            try {
                ['project.manifest', 'version.manifest'].forEach(function(mf){
                    var mp = path.join(root, mf);
                    var m = JSON.parse(fs.readFileSync(mp, 'utf8'));
                    var cur = String(m.packageUrl || '');
                    if(cur && !/127\.0\.0\.1|localhost|0\.0\.0\.0|::1/.test(cur)){ return; }
                    var xfHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
                    var xfProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() || 'http';
                    var hostIp = (req.headers.host || '').split(':')[0] || '';
                    var pkgUrl = '';
                    if(xfHost && !/127\.0\.0\.1|localhost/.test(xfHost)){
                        pkgUrl = xfProto + '://' + xfHost + '/hotupdate';
                    } else if(hostIp && !/^(127\.|localhost|0\.0\.0\.0|::1)/.test(hostIp)){
                        pkgUrl = 'http://' + hostIp + ':' + ((config && config.CLIENT_PORT) || 9100) + '/hotupdate';
                    }
                    if(!pkgUrl){ console.log('[hotupdate] 无法推断公网地址, 保留清单原地址:', cur); return; }
                    m.packageUrl = pkgUrl;
                    m.remoteManifestUrl = pkgUrl + '/project.manifest';
                    m.remoteVersionUrl = pkgUrl + '/version.manifest';
                    fs.writeFileSync(mp, JSON.stringify(m));
                    console.log('[hotupdate] 清单下载地址已修正为:', pkgUrl);
                });
            } catch(e) {
                console.log('[hotupdate] 清单地址修正失败(按原样发布):', e.message);
            }
            // 6. 原子替换: 旧目录挪到 bak, 新目录挪进来, 再删 bak
            var bakDir = HOTUPDATE_DIR + '_bak';
            unzipUtil.rmdirDeep(bakDir);
            try { fs.mkdirSync(HOTUPDATE_DIR); } catch(e){} // 静态托管在账号服启动时建过, 保证存在
            fs.rename(HOTUPDATE_DIR, bakDir, function(err3){
                if(err3){ send(res, 1, "替换热更目录失败: " + err3.message); return; }
                fs.rename(root, HOTUPDATE_DIR, function(err4){
                    if(err4){
                        // 回滚: 新目录进不来就把旧的挪回去
                        fs.rename(bakDir, HOTUPDATE_DIR, function(){});
                        send(res, 1, "发布失败: " + err4.message);
                        return;
                    }
                    unzipUtil.rmdirDeep(bakDir);
                    unzipUtil.rmdirDeep(tmpDir);
                    fs.unlink(tmpZip, function(){});
                    getHotupdateInfo(function(info){
                        send(res, 0, "ok", info);
                    });
                });
            });
        });
    });
});

// 提供给游戏服读取玩法配置（无需认证）
app.get('/game_config/:type', function(req, res){
    var type = req.params.type;
    db.query('SELECT * FROM t_game_config WHERE type="' + type + '"', function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        if(rows.length == 0){
            send(res, 1, "玩法不存在");
            return;
        }
        var r = rows[0];
        send(res, 0, "ok", {
            type: r.type,
            name: r.name,
            difen_options: JSON.parse(r.difen_options),
            jushu_options: JSON.parse(r.jushu_options),
            cost_options: JSON.parse(r.cost_options),
            chips_options: r.chips_options ? JSON.parse(r.chips_options) : null,
            max_players: r.max_players,
            enabled: r.enabled
        });
    });
});

//请求体过大等解析错误统一返回JSON,避免前端只收到Unexpected token '<'
app.use(function(err, req, res, next){
    if(err && (err.status === 413 || err.type === 'entity.too.large')){
        send(res, 413, '文件超过账号服上传大小限制');
        return;
    }
    console.error('[admin api]', err && err.stack || err);
    send(res, 500, '服务器处理请求失败');
});
