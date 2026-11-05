var mysql = require('mysql');
var configs = require('./configs_win');
var c = configs.mysql();
var conn = mysql.createConnection({host:c.HOST, user:c.USER, password:c.PSWD, database:c.DB, port:c.PORT});

var rows = [
    {type:'zj_lao', name:'诸暨赖倒胡(红中)', max_players:2, sort:3, difen:'[100,200,500]', jushu:'[10,20,50]', cost:'[1,2,4]'},
    {type:'zp4', name:'漳浦金麻将(4人)', max_players:4, sort:4, difen:'[100,200,500]', jushu:'[10,20,50]', cost:'[1,2,4]'},
    {type:'guanpai2', name:'跑得快(2人)', max_players:2, sort:5, difen:'[100,200,500]', jushu:'[10,20]', cost:'[1,2,4]'},
    {type:'guanpai3', name:'跑得快(3人)', max_players:3, sort:6, difen:'[100,200,500]', jushu:'[10,20]', cost:'[1,2,4]'},
    {type:'niuniu', name:'抢庄牛牛', max_players:4, sort:7, difen:'[100,200,500]', jushu:'[10,20]', cost:'[1,2,4]'},
];

function insert(row, done){
    conn.query('SELECT id FROM t_game_config WHERE type=?', [row.type], function(e, ex){
        if(e){ console.log('ERR', row.type, e.message); return done(); }
        if(ex.length){ console.log('SKIP exists', row.type); return done(); }
        var sql = 'INSERT INTO t_game_config(type,name,difen_options,jushu_options,cost_options,chips_options,max_players,max_tai,enabled,sort,' +
            'caishen_cpg,cai_chi,cai_peng,cai_gang,dianpao_hu,tai_rules,auto_dissolve_seconds,remove_tiao,laozhuang_multiplier,cai7,' +
            'tianhu_di,cai_diao,bao_tai_score,hu_tai_rate,bao_tai_rate,gp_four_two,gp_four_three,gp_three_one,gp_last_three_one,gp_last_four_two_three,gp_bomb,gp_bomb_four,gp_card_history,gp_straight_a2)' +
            ' VALUES(?,?,?,?,?,?,?,?,1,?,1,1,1,1,1,NULL,300,0,2,0,1,1,1,1,1,1,1,1,0,0,1,1,0,1)';
        var params = [row.type,row.name,row.difen,row.jushu,row.cost,'[1000]',row.max_players,10,row.sort];
        conn.query(sql, params, function(e2){
            if(e2){ console.log('INSERT ERR', row.type, e2.message); }
            else{ console.log('INSERTED', row.type); }
            done();
        });
    });
}

conn.connect(function(err){
    if(err){ console.log('CONNECT ERR', err.message); process.exit(1); }
    var i = 0;
    (function next(){
        if(i >= rows.length){ conn.end(); return; }
        insert(rows[i++], next);
    })();
});
