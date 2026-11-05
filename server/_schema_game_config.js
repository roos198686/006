var mysql = require('mysql');
var configs = require('./configs_win');
var c = configs.mysql();
var conn = mysql.createConnection({host:c.HOST, user:c.USER, password:c.PSWD, database:c.DB, port:c.PORT});
conn.connect(function(err){
    if(err){ console.log('CONNECT ERR', err.message); process.exit(1); }
    conn.query('SHOW COLUMNS FROM t_game_config', function(e, rows){
        if(e){ console.log(e.message); process.exit(1); }
        console.log(rows.map(function(r){ return r.Field + ':' + r.Type + ':' + (r.Null==='YES'?'null':'notnull'); }).join('\n'));
        conn.end();
    });
});
