var mysql = require('mysql');
var configs = require('./configs_win');
var c = configs.mysql();
var conn = mysql.createConnection({host:c.HOST, user:c.USER, password:c.PSWD, database:c.DB, port:c.PORT});
conn.connect(function(err){
    if(err){ console.log('CONNECT ERR', err.message); process.exit(1); }
    conn.query('SELECT id,type,name,max_players,enabled,sort,difen_options,jushu_options,cost_options FROM t_game_config ORDER BY sort,id', function(e, rows){
        if(e){ console.log('QUERY ERR', e.message); process.exit(1); }
        console.log('ROWS', rows.length);
        rows.forEach(function(r){
            console.log(JSON.stringify({id:r.id,type:r.type,name:r.name,max:r.max_players,en:r.enabled,sort:r.sort,difen:r.difen_options,jushu:r.jushu_options,cost:r.cost_options}));
        });
        conn.end();
    });
});
