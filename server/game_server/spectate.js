// 管理员观战:把进行中的麻将牌局导成一份"全明牌"快照
// 供 game_server /spectate 接口使用(账号服管理后台代理调用)
var roomMgr = require('./roommgr');

function arr(x){
    return Array.isArray(x) ? x : [];
}

// 牌值 → 中文名(与客户端牌面一致: 0-8筒 9-17条 18-26万 27中 28发 29白 30东 31西 32南 33北)
var ZI_NAMES = ["中", "发", "白", "东", "西", "南", "北"];
var NUM_NAMES = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
var SUIT_NAMES = ["筒", "条", "万"];

function tileName(v){
    v = Number(v);
    if(!(v >= 0 && v < 34)) return "?";
    if(v >= 27) return ZI_NAMES[v - 27] || "?";
    var suit = Math.floor(v / 9);
    var num = v % 9;
    return NUM_NAMES[num] + SUIT_NAMES[suit];
}

function buildSeat(roomSeat, gameSeat, i){
    var rs = roomSeat || {};
    var gs = gameSeat || null;
    var seat = {
        seatIndex: i,
        userid: rs.userId != null ? rs.userId : (gs ? gs.userId : 0),
        name: rs.name || (gs && gs.name) || ("座位" + (i + 1)),
        score: gs && gs.score != null ? gs.score : (rs.score || 0),
        ready: !!rs.ready,
        holds: [],
        folds: [],
        pengs: [],
        pengTiles: [],
        chis: [],
        angangs: [],
        diangangs: [],
        wangangs: [],
        gangs: [],
        hued: false
    };
    if(gs){
        seat.holds = arr(gs.holds).slice();
        seat.folds = arr(gs.folds).slice();
        seat.pengs = arr(gs.pengs).slice();
        seat.pengTiles = arr(gs.pengTiles).slice();
        seat.chis = arr(gs.chis).slice();
        seat.angangs = arr(gs.angangs).slice();
        seat.diangangs = arr(gs.diangangs).slice();
        seat.wangangs = arr(gs.wangangs).slice();
        seat.gangs = arr(gs.gangs).slice();
        seat.hued = !!gs.hued;
    }
    return seat;
}

// 返回结构:
// { ok, msg, room:{id,type,name,numOfGames,maxGames,status},
//   game:{playing,button,turn,caishen,caishen2,fanPai,playStyle,gameOver},
//   seats:[{seatIndex,userid,name,score,holds(明牌),folds,pengs,chis,...}],
//   wall:{remaining,nextFive:[牌值...],tailDraw:bool} }
exports.getSnapshot = function(roomId){
    var room = roomMgr.getRoom(roomId);
    if(room == null){
        return { ok: false, msg: "房间不存在或已解散", roomId: roomId };
    }
    var conf = room.conf || {};
    var mgr = room.gameMgr;
    var game = null;
    try{
        if(mgr && typeof mgr.__getGame === "function"){
            game = mgr.__getGame(roomId);
        }
    }catch(e){
        game = null;
    }

    var seatCount = (room.seats && room.seats.length) || (game && game.gameSeats ? game.gameSeats.length : 0);
    var seats = [];
    for(var i = 0; i < seatCount; ++i){
        var rs = room.seats ? room.seats[i] : null;
        if(rs == null && !(game && game.gameSeats && game.gameSeats[i])) continue;
        seats.push(buildSeat(rs, game && game.gameSeats ? game.gameSeats[i] : null, i));
    }

    var wall = game ? arr(game.mahjongs) : [];
    var cur = game ? (Number(game.currentIndex) || 0) : 0;
    // 部分玩法(zp/wujin)杠后从牌尾补牌, 剩余张数按 tailIndex 计算
    var tail = (game && game.tailIndex != null) ? Number(game.tailIndex) : (wall.length - 1);
    var nextFive = [];
    for(var k = 0; k < 5; ++k){
        var idx = cur + k;
        if(idx > tail || idx >= wall.length) break;
        nextFive.push(wall[idx]);
    }
    var remaining = Math.max(0, tail - cur + 1);

    var status = "waiting";
    if(game){
        if(game.gameOver) status = "over";
        else status = "playing";
    }

    return {
        ok: true,
        msg: "",
        room: {
            id: room.id,
            type: conf.type || "",
            name: conf.club_table_name || conf.name || conf.type || "",
            numOfGames: room.numOfGames || 0,
            maxGames: conf.maxGames || 0,
            baseScore: conf.baseScore != null ? conf.baseScore : conf.base_score,
            status: status,
            seatCount: seatCount
        },
        game: game ? {
            playing: !game.gameOver,
            button: game.button,
            turn: game.turn,
            caishen: game.caishen,
            caishen2: game.caishen2,
            fanPai: game.fanPai,
            playStyle: game.playStyle || "",
            gameOver: !!game.gameOver
        } : null,
        seats: seats,
        wall: {
            total: wall.length,
            remaining: remaining,
            nextFive: nextFive,
            nextFiveNames: nextFive.map(tileName),
            tailDraw: !!(game && game.tailIndex != null)
        }
    };
};

exports.tileName = tileName;
