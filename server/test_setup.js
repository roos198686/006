const mysql = require('mysql');
const conn = mysql.createConnection({
    host: '127.0.0.1', user: 'root', password: 'qwe12233', database: 'db_baobao'
});
conn.connect(function (e) {
    if (e) { console.log('connect fail', e.message); process.exit(1); }

    // === Step 1: 清今日数据 ===
    console.log('=== Step 1: 重置今日 partner_stats ===');
    conn.query('UPDATE t_partner_stats SET today_rake=0, today_hidden_rake=0, today_partner_profit=0, today_game_score=0', function (err, info) {
        console.log('  cleared rows:', info.affectedRows);

        // === Step 2: 设置三级链 profit_ratio ===
        // 385127(顶级) → 552407(一级): ratio=80 (552407 留 80%, 385127 抽 20%)
        // 552407(一级) → 807150(二级): ratio=80 (807150 留 80%, 552407 抽 20%)
        console.log('\n=== Step 2: 设置 profit_ratio ===');
        conn.query('UPDATE t_partner_stats SET profit_ratio=80 WHERE club_id=385127 AND partner_club_id=552407', function () {});
        conn.query('UPDATE t_partner_stats SET profit_ratio=80 WHERE club_id=552407 AND partner_club_id=807150', function () {});
        // 如果这两条关系不存在, 用 INSERT
        conn.query('INSERT INTO t_partner_stats(club_id,partner_club_id,profit_ratio,create_time,update_time) VALUES(385127,552407,80,UNIX_TIMESTAMP(),UNIX_TIMESTAMP()) ON DUPLICATE KEY UPDATE profit_ratio=80', function () {});
        conn.query('INSERT INTO t_partner_stats(club_id,partner_club_id,profit_ratio,create_time,update_time) VALUES(552407,807150,80,UNIX_TIMESTAMP(),UNIX_TIMESTAMP()) ON DUPLICATE KEY UPDATE profit_ratio=80', function () {});

        setTimeout(function () {
            conn.query('SELECT club_id,partner_club_id,profit_ratio,today_rake,today_partner_profit FROM t_partner_stats WHERE club_id IN (385127,552407) AND partner_club_id IN (552407,807150) ORDER BY club_id', function (err, rows) {
                console.log('  当前比例配置:');
                rows.forEach(function (r) {
                    const clubName = {385127:'顶级', 552407:'一级'}[r.club_id] || r.club_id;
                    const pName = {552407:'一级', 807150:'二级'}[r.partner_club_id] || r.partner_club_id;
                    console.log('  ' + clubName + '(' + r.club_id + ') → ' + pName + '(' + r.partner_club_id + ') ratio=' + r.profit_ratio + '%');
                });
                conn.end();
            });
        }, 200);
    });
});
