// 抢庄牛牛(5张) 游戏管理器
// 牌编码: code = suit*100 + rank   suit 1方块 2梅花 3红桃 4黑桃, rank 2..14(A)
// 客户端牌面图片: resources/images/reference/gamepdk/poker_<code>.png
// 流程: 全员准备 -> 发牌 -> 抢庄(0/1/2/3倍, 最高者坐庄) -> 亮牌 -> 结算 -> 下一局
var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var db = require("../utils/db");

var games = {};

// ================= 牌 =================
function buildDeck(){
    var deck = [];
    for(var s = 1; s <= 4; ++s){
        for(var r = 2; r <= 14; ++r){ deck.push(s * 100 + r); }
    }
    return deck;
}

function shuffle(arr){
    for(var i = arr.length - 1; i > 0; --i){
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
}

function rankOf(code){ return code % 100; }

// 牛型: {niu:0..10, type, mult}
function calcNiu(cards){
    var pts = cards.map(function(c){ var r = rankOf(c); return r >= 10 ? 10 : r; });
    var sum = pts.reduce(function(a,b){ return a + b; }, 0);
    if(sum <= 10 && cards.every(function(c){ return rankOf(c) <= 10; })) return {niu:10, type:'wuxiao', mult:6};
    var cnt = {};
    cards.forEach(function(c){ var r = rankOf(c); cnt[r] = (cnt[r]||0)+1; });
    for(var k in cnt){ if(cnt[k] >= 4) return {niu:10, type:'bomb', mult:5}; }
    if(cards.every(function(c){ return rankOf(c) >= 11; })) return {niu:10, type:'wuhua', mult:5};

    var best = 0;
    for(var i = 0; i < 5; ++i){
        for(var j = i + 1; j < 5; ++j){
            for(var k2 = j + 1; k2 < 5; ++k2){
                if((pts[i] + pts[j] + pts[k2]) % 10 === 0){
                    var rest = 0;
                    for(var m = 0; m < 5; ++m){ if(m != i && m != j && m != k2) rest += pts[m]; }
                    var n = rest % 10;
                    if(n === 0) n = 10;
                    if(n > best) best = n;
                }
            }
        }
    }
    if(best === 0) return {niu:0, type:'none', mult:1};
    if(best === 10) return {niu:10, type:'niuniu', mult:4};
    var mult = best >= 9 ? 3 : (best >= 7 ? 2 : 1);
    return {niu:best, type:'normal', mult:mult};
}

function maxRank(cards){
    var m = 0;
    cards.forEach(function(c){ if(rankOf(c) > m) m = rankOf(c); });
    return m;
}

// ================= 辅助 =================
function getGameByUserID(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return null;
    return games[roomId];
}

function collectSeats(roomInfo){
    var arr = [];
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(rs.userId > 0){
            arr.push({roomSeatIndex:i, userId:rs.userId, name:rs.name, score:rs.score || 0});
        }
    }
    return arr;
}

function getSeatsInfo(game){
    var info = [];
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        info.push({userid:s.userId, name:s.name, seatindex:i, roomSeatIndex:s.roomSeatIndex, ready:!!s.ready, score:s.score, bet:s.bet});
    }
    return info;
}

function buildEndInfo(room){
    var endinfo = [];
    if(room == null) return endinfo;
    for(var i = 0; i < room.seats.length; ++i){
        var r = room.seats[i];
        if(r.userId > 0) endinfo.push({userid:r.userId, name:r.name, score:r.score});
    }
    return endinfo;
}

function syncRoomScore(game){
    var room = roomMgr.getRoom(game.roomId);
    if(room == null) return;
    for(var i = 0; i < game.gameSeats.length; ++i){
        var rseat = room.seats[game.gameSeats[i].roomSeatIndex];
        if(rseat) rseat.score = game.gameSeats[i].score;
    }
}

// ================= 流程 =================
function beginBet(game){
    game.phase = 'bet';
    game.betDeadline = Date.now() + 10 * 1000;
    var seatsInfo = getSeatsInfo(game);
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        userMgr.sendMsg(s.userId, 'nn_start_push', {
            maxPlayers: game.gameSeats.length,
            seats: seatsInfo,
            mySeat: i,
            myCards: s.cards.slice(),
            phase: 'bet',
            betDeadline: game.betDeadline,
            conf: game.conf
        });
    }
    game.betTimer = setTimeout(function(){ resolveBanker(game); }, 10 * 1000);
}

function resolveBanker(game){
    if(game.phase != 'bet') return;
    if(game.betTimer){ clearTimeout(game.betTimer); game.betTimer = null; }
    game.phase = 'reveal';

    var best = -1, cands = [];
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        if(s.bet > best){ best = s.bet; cands = [i]; }
        else if(s.bet == best){ cands.push(i); }
    }
    var bankerSeat = cands[Math.floor(Math.random() * cands.length)];
    game.bankerSeat = bankerSeat;
    game.bankerMultiple = Math.max(1, game.gameSeats[bankerSeat].bet);

    var players = [];
    for(var j = 0; j < game.gameSeats.length; ++j){
        var sj = game.gameSeats[j];
        sj.result = calcNiu(sj.cards);
        players.push({
            seatIndex:j, userId:sj.userId, name:sj.name,
            cards:sj.cards.slice(),
            niu:sj.result.niu, niuType:sj.result.type, mult:sj.result.mult,
            bet:sj.bet, isBanker:(j === bankerSeat)
        });
    }
    userMgr.brocastInRoom(game.roomId, 'nn_reveal_push', {
        bankerSeat: bankerSeat,
        bankerMultiple: game.bankerMultiple,
        players: players,
        settleDeadline: Date.now() + 8 * 1000
    });
    game.settleTimer = setTimeout(function(){ settle(game); }, 8 * 1000);
}

function settle(game){
    if(game.settleTimer){ clearTimeout(game.settleTimer); game.settleTimer = null; }
    game.phase = 'settle';
    var banker = game.gameSeats[game.bankerSeat];
    var difen = Number(game.conf.difen) || 100;
    var deltas = game.gameSeats.map(function(){ return 0; });

    for(var i = 0; i < game.gameSeats.length; ++i){
        if(i === game.bankerSeat) continue;
        var s = game.gameSeats[i];
        var bankWin;
        if(banker.result.niu > s.result.niu) bankWin = true;
        else if(banker.result.niu < s.result.niu) bankWin = false;
        else{
            var bk = maxRank(banker.cards), pk = maxRank(s.cards);
            bankWin = bk >= pk;
        }
        var winMult = bankWin ? banker.result.mult : s.result.mult;
        var amount = difen * game.bankerMultiple * winMult;
        if(bankWin){ deltas[i] -= amount; deltas[game.bankerSeat] += amount; }
        else{ deltas[i] += amount; deltas[game.bankerSeat] -= amount; }
    }

    var results = [];
    for(var j = 0; j < game.gameSeats.length; ++j){
        var sj = game.gameSeats[j];
        sj.score += deltas[j];
        results.push({
            seatIndex:j, userId:sj.userId, name:sj.name,
            niu:sj.result.niu, niuType:sj.result.type, mult:sj.result.mult,
            isBanker:(j === game.bankerSeat), delta:deltas[j], score:sj.score
        });
    }
    syncRoomScore(game);

    var pending = game.gameSeats.length;
    var finished = false;
    function finish(){
        if(finished) return;
        finished = true;
        var room = roomMgr.getRoom(game.roomId);
        userMgr.brocastInRoom(game.roomId, 'nn_result_push', {
            bankerSeat: game.bankerSeat,
            bankerMultiple: game.bankerMultiple,
            difen: difen,
            results: results,
            numOfGames: room ? room.numOfGames : 0,
            maxGames: game.conf.maxGames,
            endinfo: buildEndInfo(room)
        });
        delete games[game.roomId];
        if(room == null) return;
        if(room.numOfGames >= room.conf.maxGames){
            userMgr.brocastInRoom(game.roomId, 'game_end_push', {endinfo: buildEndInfo(room)});
            setTimeout(function(){
                userMgr.brocastInRoom(game.roomId, 'dispress_push', {});
                setTimeout(function(){
                    userMgr.kickAllInRoom(game.roomId);
                    roomMgr.destroy(game.roomId);
                }, 500);
            }, 5000);
        }
    }

    for(var p = 0; p < game.gameSeats.length; ++p){
        (function(gs, delta){
            function done(){
                if(delta != 0){
                    db.get_user_data_by_userid(gs.userId, function(ud){
                        if(ud && ud.gems != null){ gs.score = ud.gems; syncRoomScore(game); }
                        if(--pending === 0) finish();
                    });
                } else if(--pending === 0) finish();
            }
            if(delta != 0) db.add_user_gems(gs.userId, delta, done);
            else done();
        })(game.gameSeats[p], deltas[p]);
    }
}

// ================= 对外接口 =================
exports.start = function(roomInfo){
    var seated = collectSeats(roomInfo);
    if(seated.length < 2){
        console.log("[牛牛] 人数不足，无法开局");
        return;
    }
    var deck = buildDeck();
    shuffle(deck);
    var game = {
        roomId: roomInfo.id, gameSeats: [], phase:'bet',
        bankerSeat:-1, bankerMultiple:1,
        betDeadline:0, betTimer:null, settleTimer:null,
        conf: roomInfo.conf
    };
    for(var i = 0; i < seated.length; ++i){
        var sp = seated[i];
        game.gameSeats.push({
            userId:sp.userId, name:sp.name, seatIndex:i,
            roomSeatIndex:sp.roomSeatIndex, score:sp.score,
            cards:[], bet:0, result:{niu:0, type:'none', mult:1}, ready:false
        });
    }
    for(var r = 0; r < 5; ++r){
        for(var j = 0; j < game.gameSeats.length; ++j){ game.gameSeats[j].cards.push(deck.pop()); }
    }
    games[roomInfo.id] = game;
    console.log("[牛牛] 发牌 room=" + roomInfo.id + " players=" + game.gameSeats.length);
    beginBet(game);
};

exports.setReady = function(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return;
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return;
    var game = games[roomId];
    if(game != null){
        exports.resendGameState(roomId, userId);
        return;
    }
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null) return;
    roomInfo.seats[seatIndex].ready = true;

    var count = 0, total = 0;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        if(roomInfo.seats[i].userId > 0) total++;
        if(roomInfo.seats[i].ready) count++;
    }
    if(count >= 2 && count >= total){
        setTimeout(function(){
            var room = roomMgr.getRoom(roomId);
            if(room != null) exports.begin(room);
        }, 800);
    }
};

exports.begin = function(roomInfo){
    roomInfo.numOfGames++;
    for(var i = 0; i < roomInfo.seats.length; ++i){ roomInfo.seats[i].ready = false; }
    db.update_num_of_turns(roomInfo.id, roomInfo.numOfGames);
    var anySeat = null;
    for(var j = 0; j < roomInfo.seats.length; ++j){
        if(roomInfo.seats[j].userId > 0){ anySeat = roomInfo.seats[j]; break; }
    }
    if(anySeat == null) return;
    userMgr.broacastInRoom('game_num_push', roomInfo.numOfGames, anySeat.userId, true);
    userMgr.broacastInRoom('game_begin_push', roomInfo.nextButton, anySeat.userId, true);
    exports.start(roomInfo);
};

// 抢庄: multiple 0..3; 全员都已表态(或有人0倍也要等全部)后定庄
exports.bet = function(userId, multiple){
    var game = getGameByUserID(userId);
    if(game == null || game.phase != 'bet') return;
    var idx = -1;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){ idx = i; break; }
    }
    if(idx < 0) return;
    multiple = Number(multiple);
    if(isNaN(multiple) || multiple < 0) multiple = 0;
    if(multiple > 3) multiple = 3;
    var st = game.gameSeats[idx];
    if(st.betDone) return;
    st.betDone = true;
    st.bet = multiple;
    userMgr.brocastInRoom(game.roomId, 'nn_bet_push', { seatIndex: idx, userId: userId, multiple: multiple });

    var all = true;
    for(var k = 0; k < game.gameSeats.length; ++k){
        if(!game.gameSeats[k].betDone){ all = false; break; }
    }
    if(all){ resolveBanker(game); }
};

exports.isPlaying = function(roomId){ return games[roomId] != null; };
exports.hasBegan = function(roomId){ return games[roomId] != null; };

exports.resendGameState = function(roomId, userId){
    var game = games[roomId];
    if(game == null) return;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){
            userMgr.sendMsg(userId, 'nn_resend_push', {
                maxPlayers: game.gameSeats.length,
                seats: getSeatsInfo(game),
                mySeat: i,
                myCards: game.gameSeats[i].cards.slice(),
                phase: game.phase,
                bankerSeat: game.bankerSeat,
                betDeadline: game.betDeadline,
                bets: game.gameSeats.map(function(s){ return s.bet; }),
                conf: game.conf
            });
            return;
        }
    }
};

exports.dissolveRequest = function(roomId, userId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return null;
    if(roomInfo.dr != null) return {dr: roomInfo.dr};
    var states = [];
    for(var i = 0; i < roomInfo.seats.length; ++i){ states.push(roomInfo.seats[i].userId == userId); }
    roomInfo.dr = {endTime: Date.now() + 300000, states: states};
    return {dr: roomInfo.dr};
};

exports.dissolveAgree = function(roomId, userId, agree){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null || roomInfo.dr == null) return null;
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null) return null;
    roomInfo.dr.states[seatIndex] = agree;
    return {dr: roomInfo.dr};
};

exports.doDissolve = function(roomId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        if(roomInfo.seats[i].userId > 0) userMgr.sendMsg(roomInfo.seats[i].userId, 'dispress_push', {});
    }
    delete games[roomId];
};

exports.chupai = function(){};
exports.chuPai = function(){};
exports.guo = function(){};
exports.peng = function(){};
exports.gang = function(){};
exports.hu = function(){};
exports.chi = function(){};
exports.bao = function(){};
exports.huanSanZhang = function(){};
exports.dingQue = function(){};
