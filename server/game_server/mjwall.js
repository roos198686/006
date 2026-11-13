// 牌墙通用规则:置灰不可摸数量 + 每杠增加不可摸数量
// 各玩法 gamemgr 统一从这里取值,后台 tai_rules 里同名 key 即生效
function taiRule(game, key, def){
    var v = (game && game.taiRules) ? game.taiRules[key] : null;
    if(v != null && v !== '' && !isNaN(Number(v))) return Number(v);
    return def;
}
//置灰不可摸数量(剩N张荒庄/不可摸,0=不置灰,可以摸到最后一张)
function liujuLeft(game, def){
    return Math.max(0, taiRule(game, 'liuju_left', def == null ? 26 : def));
}
//每杠增加的不可摸数量
function gangLiuju(game){
    return Math.max(0, taiRule(game, 'gang_liuju', 0));
}
//场上总杠数(不同玩法字段不同:诸暨赖倒胡用gangs,其余用暗杠/点杠/弯杠三组)
function gangTiles(game){
    var n = 0;
    var list = (game && game.gameSeats) ? game.gameSeats : [];
    for(var i = 0; i < list.length; ++i){
        var s = list[i];
        if(!s) continue;
        if((s.gangs instanceof Array) && s.gangs.length > 0){ n += s.gangs.length; continue; }
        n += (s.angangs ? s.angangs.length : 0) + (s.diangangs ? s.diangangs.length : 0) + (s.wangangs ? s.wangangs.length : 0);
    }
    return n;
}
//当前总不可摸张数 = 置灰数量 + 每杠加张*杠数
function deadLimit(game, def){
    return liujuLeft(game, def) + gangLiuju(game) * gangTiles(game);
}
module.exports = {
    taiRule: taiRule,
    liujuLeft: liujuLeft,
    gangLiuju: gangLiuju,
    gangTiles: gangTiles,
    deadLimit: deadLimit
};
