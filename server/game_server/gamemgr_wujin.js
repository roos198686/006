/**
 * 漳浦无金16张麻将（二人/四人共用）
 * 108张万筒条，无字花金、无七对；5组面子+1将。
 * 分数=底分×台数，杠钱独立结算；二人/四人只改变座位数与去花色规则。
 */
var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var db = require("../utils/db");

var games = {};

function seatCount(game){ return game.seatCount || 4; }
function getMJType(id){
    if(id >= 0 && id < 9) return 0;
    if(id >= 9 && id < 18) return 1;
    if(id >= 18 && id < 27) return 2;
    return -1;
}
function normalizeRules(rules){
    if(typeof rules === 'string'){
        try{ rules = JSON.parse(rules); }catch(e){ rules = null; }
    }
    return (rules && typeof rules === 'object') ? rules : {};
}
function taiRule(game, key, def){
    var v = game.taiRules ? game.taiRules[key] : null;
    if(v != null && v !== '' && !isNaN(Number(v))) return Number(v);
    return def;
}
function ruleOn(game, key, def){ return taiRule(game, key, def) == 1; }
function getChupaiTimeout(game){ return taiRule(game, 'chupai_timeout', 15); }
function numOfMJ(game){ return game.tailIndex - game.currentIndex + 1; }
function drawHead(game){
    if(game.currentIndex > game.tailIndex) return -1;
    return game.mahjongs[game.currentIndex++];
}
function drawTail(game){
    if(game.tailIndex < game.currentIndex) return -1;
    return game.mahjongs[game.tailIndex--];
}
function mopai(game, seatIndex, fromTail){
    var pai = fromTail ? drawTail(game) : drawHead(game);
    if(pai < 0) return -1;
    var sd = game.gameSeats[seatIndex];
    sd.holds.push(pai);
    sd.hasDrawn = true;
    return pai;
}

// 二人局可按后台去花色，但至少保留一色；四人局始终使用108张。
function shuffle(game){
    var removed = {};
    if(seatCount(game) == 2){
        removed[0] = ruleOn(game, 'remove_tong', 0);
        removed[1] = ruleOn(game, 'remove_tiao', 0);
        removed[2] = ruleOn(game, 'remove_wan', 0);
        if(removed[0] && removed[1] && removed[2]) removed = {};
    }
    var mahjongs = game.mahjongs = [];
    for(var p = 0; p < 27; ++p){
        if(removed[getMJType(p)]) continue;
        for(var c = 0; c < 4; ++c) mahjongs.push(p);
    }
    for(var i = 0; i < mahjongs.length; ++i){
        var last = mahjongs.length - 1 - i;
        var idx = Math.floor(Math.random() * (last + 1));
        var t = mahjongs[idx];
        mahjongs[idx] = mahjongs[last];
        mahjongs[last] = t;
    }
}
function deal(game){
    game.currentIndex = 0;
    game.tailIndex = game.mahjongs.length - 1;
    for(var r = 0; r < 16; ++r){
        for(var k = 0; k < seatCount(game); ++k){
            mopai(game, (game.button + k) % seatCount(game), false);
        }
    }
    // 发牌不视为摸牌，天地胡只认起手牌。
    for(var i = 0; i < seatCount(game); ++i) game.gameSeats[i].hasDrawn = false;
    mopai(game, game.button, false);
    game.gameSeats[game.button].hasDrawn = false;
    game.turn = game.button;
}

function rebuildCountMap(sd){
    var cm = {};
    for(var i = 0; i < sd.holds.length; ++i) cm[sd.holds[i]] = (cm[sd.holds[i]] || 0) + 1;
    sd.countMap = cm;
}
function splitHolds(game, sd){
    var cm = {};
    for(var i = 0; i < sd.holds.length; ++i) cm[sd.holds[i]] = (cm[sd.holds[i]] || 0) + 1;
    return {cm:cm, wilds:0};
}
function copyMap(cm){
    var out = {};
    for(var k in cm) if(cm[k] > 0) out[k] = cm[k];
    return out;
}

// 所有剩余牌组成顺子或刻子；shape用于区分碰碰胡与含顺子的普通胡。
function canFormMelds(cm, shape){
    var keys = [];
    for(var k in cm) if(cm[k] > 0) keys.push(parseInt(k));
    if(keys.length == 0) return true;
    keys.sort(function(a,b){ return a-b; });
    var t = keys[0];
    if(cm[t] >= 3){
        cm[t] -= 3;
        if(canFormMelds(cm, shape)){ cm[t] += 3; return true; }
        cm[t] += 3;
    }
    var v = t % 9;
    if(getMJType(t) >= 0 && v <= 7 && (cm[t+1] || 0) > 0 && (cm[t+2] || 0) > 0){
        cm[t]--; cm[t+1]--; cm[t+2]--;
        if(shape) shape.sequenceCount++;
        if(canFormMelds(cm, shape)){ cm[t]++; cm[t+1]++; cm[t+2]++; return true; }
        if(shape) shape.sequenceCount--;
        cm[t]++; cm[t+1]++; cm[t+2]++;
    }
    return false;
}
function checkHuStructure(cm){
    cm = copyMap(cm);
    for(var k in cm){
        k = parseInt(k);
        if(cm[k] >= 2){
            cm[k] -= 2;
            if(canFormMelds(cm)) return true;
            cm[k] += 2;
        }
    }
    return false;
}
function canAllTriplets(cm){
    cm = copyMap(cm);
    for(var k in cm){
        k = parseInt(k);
        if(cm[k] < 2) continue;
        cm[k] -= 2;
        if(allKe(cm)) return true;
        cm[k] += 2;
    }
    return false;
}
function allKe(cm){
    for(var k in cm) if(cm[k] != 0 && cm[k] != 3) return false;
    return true;
}
function hasSequenceDecomposition(cm){
    cm = copyMap(cm);
    for(var k in cm){
        k = parseInt(k);
        if(cm[k] < 2) continue;
        cm[k] -= 2;
        var shape = {sequenceCount:0};
        if(canFormMelds(cm, shape) && shape.sequenceCount > 0) return true;
        cm[k] += 2;
    }
    return false;
}
function canHuNow(game, sd){
    if(sd.holds.length % 3 != 2) return false;
    return checkHuStructure(splitHolds(game, sd).cm);
}
function canDianPao(game, sd, pai){
    if(sd.guoShui || sd.holds.length % 3 != 1 || pai < 0 || pai > 26) return false;
    var cm = splitHolds(game, sd).cm;
    cm[pai] = (cm[pai] || 0) + 1;
    return checkHuStructure(cm);
}

function getSeatIndex(userId){ return roomMgr.getUserSeat(userId); }
function getGameByUserID(userId){
    var roomId = roomMgr.getUserRoom(userId);
    return roomId == null ? null : games[roomId];
}
function hasOperations(sd){ return !!(sd.canGang || sd.canPeng || sd.canHu || sd.canChi); }
function clearAllOptions(game, sd){
    function clear(s){
        s.canPeng = false; s.canGang = false; s.canChi = false; s.canHu = false;
        s.gangPai = []; s.chiPai = null;
    }
    if(sd) clear(sd);
    else for(var i = 0; i < seatCount(game); ++i) clear(game.gameSeats[i]);
}
function sendOperations(game, sd, pai){
    if(!hasOperations(sd)){
        userMgr.sendMsg(sd.userId, 'game_action_push');
        return;
    }
    if(pai == -1 || pai == null) pai = sd.holds[sd.holds.length - 1];
    userMgr.sendMsg(sd.userId, 'game_action_push', {
        pai:pai, hu:sd.canHu, peng:sd.canPeng, gang:sd.canGang, chi:sd.canChi,
        gangpai:sd.gangPai, chipai:sd.chiPai,
        qiangjin:false, youjin:null, youjingo:false
    });
}
function sendOpToAll(game, event, build){
    for(var i = 0; i < seatCount(game); ++i){
        var sd = game.gameSeats[i];
        userMgr.sendMsg(sd.userId, event, build(i, sd));
    }
}
function checkCanPeng(game, sd, targetPai){
    if(!ruleOn(game, 'can_peng', 1) || targetPai < 0) return;
    if((sd.countMap[targetPai] || 0) >= 2) sd.canPeng = true;
}
function checkCanGangDian(game, sd, targetPai){
    if(!ruleOn(game, 'can_gang', 1) || numOfMJ(game) <= 0 || targetPai < 0) return;
    if((sd.countMap[targetPai] || 0) >= 3){
        sd.canGang = true;
        sd.gangPai.push(targetPai);
    }
}
function checkCanAnGang(game, sd){
    if(!ruleOn(game, 'can_gang', 1) || numOfMJ(game) <= 0) return;
    for(var k in sd.countMap){
        if(sd.countMap[k] == 4){
            sd.canGang = true;
            sd.gangPai.push(parseInt(k));
        }
    }
}
function checkCanWanGang(game, sd){
    if(!ruleOn(game, 'can_gang', 1) || numOfMJ(game) <= 0) return;
    for(var i = 0; i < sd.pengs.length; ++i){
        var pai = sd.pengs[i];
        if((sd.countMap[pai] || 0) >= 1){
            sd.canGang = true;
            sd.gangPai.push(pai);
        }
    }
}
function checkCanChi(game, sd, targetPai, discarderSeat){
    if(!ruleOn(game, 'can_chi', 1) || targetPai < 0) return;
    if((discarderSeat + 1) % seatCount(game) != sd.seatIndex) return;
    var type = getMJType(targetPai);
    if(type < 0) return;
    var combos = [[targetPai-2,targetPai-1],[targetPai-1,targetPai+1],[targetPai+1,targetPai+2]];
    for(var i = 0; i < combos.length; ++i){
        var p1 = combos[i][0], p2 = combos[i][1];
        if(p1 >= type*9 && p1 < type*9+9 && p2 >= type*9 && p2 < type*9+9 &&
            (sd.countMap[p1] || 0) > 0 && (sd.countMap[p2] || 0) > 0){
            sd.canChi = true;
            if(!sd.chiPai) sd.chiPai = [];
            sd.chiPai.push([p1,p2,targetPai]);
        }
    }
}

function clearMoPaiTimeout(game){
    if(game && game.mopaiTimeoutId){ clearTimeout(game.mopaiTimeoutId); game.mopaiTimeoutId = null; }
}
function scheduleMoPai(game){
    clearMoPaiTimeout(game);
    game.mopaiTimeoutId = setTimeout(function(){
        game.mopaiTimeoutId = null;
        doUserMoPai(game);
    }, 500);
}
function clearTurnTimeout(game){
    if(game && game.turnTimeoutId){ clearTimeout(game.turnTimeoutId); game.turnTimeoutId = null; }
}
function scheduleTurnTimeout(game, seatIndex, isAction){
    clearTurnTimeout(game);
    var sec = getChupaiTimeout(game);
    if(sec <= 0) return;
    game.turnTimeoutId = setTimeout(function(){
        game.turnTimeoutId = null;
        if(!game || game.gameOver || game.finishing) return;
        if(isAction){ autoGuoAll(game); return; }
        var sd = game.gameSeats[seatIndex];
        if(!sd || seatIndex != game.turn || game.chuPai != -1) return;
        var pai = sd.holds[sd.holds.length - 1];
        if(pai != null) exports.chuPai(sd.userId, pai);
    }, sec * 1000);
}
function moveToNextUser(game){ game.turn = (game.turn + 1) % seatCount(game); }

function doUserMoPai(game){
    if(!game || game.gameOver || game.finishing) return;
    game.chuPai = -1;
    var turnSeat = game.gameSeats[game.turn];
    var pai = mopai(game, game.turn, game.gangBuPai === true);
    game.gangBuPai = false;
    if(pai < 0){ doGameOver(game); return; }
    turnSeat.lastMoPai = pai;
    turnSeat.lastHaiDi = numOfMJ(game) <= 0;
    rebuildCountMap(turnSeat);
    clearAllOptions(game, turnSeat);
    checkCanAnGang(game, turnSeat);
    checkCanWanGang(game, turnSeat);
    if(canHuNow(game, turnSeat)) turnSeat.canHu = true;
    sendOpToAll(game, 'game_mopai_push', function(i){
        var mine = i == game.turn;
        return {si:game.turn, pai:mine ? pai : -1, numofmj:numOfMJ(game),
            holds:mine ? turnSeat.holds.slice() : turnSeat.holds.length, hua:[], youjin:0};
    });
    sendOperations(game, turnSeat, pai);
    scheduleTurnTimeout(game, game.turn, false);
}

function meldTilesOf(sd){
    var tiles = [];
    for(var i = 0; i < sd.pengs.length; ++i) tiles.push(sd.pengs[i]);
    for(var g = 0; g < sd.gangs.length; ++g) tiles.push(sd.gangs[g].pai);
    for(var c = 0; c < sd.chis.length; ++c) tiles = tiles.concat(sd.chis[c]);
    return tiles;
}
function isMenQing(sd){
    if(sd.pengs.length > 0 || sd.chis.length > 0) return false;
    for(var i = 0; i < sd.gangs.length; ++i) if(sd.gangs[i].type != 'an') return false;
    return true;
}
function calculateTai(game, sd, opts){
    opts = opts || {};
    var extra = opts.extra || {};
    var tailog = [];
    var tai = 0;
    // 天地胡是固定总台数，不再叠加门清、牌型、自摸或连庄台。
    if(extra.tianHu || extra.diHu){
        var key = extra.tianHu ? 'tian_hu' : 'di_hu';
        tai = taiRule(game, key, 8);
        tailog.push((extra.tianHu ? '天胡' : '地胡') + tai + '台');
        return {tai:tai, tailog:tailog};
    }
    var cm = splitHolds(game, sd).cm;
    var pengPeng = sd.chis.length == 0 && canAllTriplets(cm);
    var hasSequence = sd.chis.length > 0 || hasSequenceDecomposition(cm);
    if(pengPeng){
        var pp = taiRule(game, 'peng_peng', 2);
        if(pp > 0){ tai += pp; tailog.push('碰碰胡+' + pp); }
    } else if(hasSequence){
        var ph = taiRule(game, 'ping_hu', 1);
        if(ph > 0){ tai += ph; tailog.push('平胡+' + ph); }
    }
    var type = -1, qing = sd.holds.length > 0;
    var tiles = sd.holds.concat(meldTilesOf(sd));
    for(var i = 0; i < tiles.length; ++i){
        var t = getMJType(tiles[i]);
        if(t < 0 || (type >= 0 && type != t)){ qing = false; break; }
        type = t;
    }
    if(qing){
        var qy = taiRule(game, 'qing_yise', 3);
        if(qy > 0){ tai += qy; tailog.push('清一色+' + qy); }
    }
    if(isMenQing(sd)){
        var mq = taiRule(game, 'men_qing', 1);
        if(mq > 0){ tai += mq; tailog.push('门清+' + mq); }
    }
    if(extra.gangKai){
        var gk = taiRule(game, 'gang_kai', 2);
        if(gk > 0){ tai += gk; tailog.push('杠上开花+' + gk); }
    }
    if(extra.haiDi){
        var hd = taiRule(game, 'hai_di', 2);
        if(hd > 0){ tai += hd; tailog.push('海底捞月+' + hd); }
    }
    if(extra.qiangGang){
        var qg = taiRule(game, 'qiang_gang', 2);
        if(qg > 0){ tai += qg; tailog.push('抢杠胡+' + qg); }
    }
    if(opts.isZimo && !extra.gangKai && !extra.haiDi && !extra.qiangGang){
        var zm = taiRule(game, 'zi_mo', 1);
        if(zm > 0){ tai += zm; tailog.push('自摸+' + zm); }
    }
    // 连庄只给庄家胡牌加台；荒庄虽连庄，但没有胡牌结算。
    if(sd.seatIndex == game.button && game.laozhuangCount > 0){
        var lzUnit = taiRule(game, 'lian_zhuang', 1);
        var lz = game.laozhuangCount * lzUnit;
        if(lz > 0){ tai += lz; tailog.push('连庄' + game.laozhuangCount + '次+' + lz); }
    }
    return {tai:tai, tailog:tailog};
}

function transfer(game, from, to, amount, kind){
    if(amount <= 0) return;
    game.gameSeats[from].score -= amount;
    game.gameSeats[to].score += amount;
    var field = kind == 'gang' ? 'gangScore' : 'huScore';
    game.gameSeats[from][field] -= amount;
    game.gameSeats[to][field] += amount;
}
function scoreSnapshot(game){
    var scores = [];
    for(var i = 0; i < seatCount(game); ++i) scores.push(game.gameSeats[i].score);
    return scores;
}
function settleGangMoney(game, seatIndex, gangtype){
    if(!ruleOn(game, 'gang_money_on', 1)) return;
    var base = game.conf.baseScore || 1;
    var n = seatCount(game);
    if(gangtype == 'ming'){
        var from = game.turn;
        if(from != seatIndex){
            transfer(game, from, seatIndex, base * taiRule(game, 'ming_gang_score', 1), 'gang');
        }
        return;
    }
    var key = gangtype == 'an' ? 'an_gang_score' : 'ming_gang_score';
    var amount = base * taiRule(game, key, gangtype == 'an' ? 2 : 1);
    for(var i = 0; i < n; ++i) if(i != seatIndex) transfer(game, i, seatIndex, amount, 'gang');
}
function doHuSettle(game, seatIndex, huPai, huType, payFrom, extra2){
    var sd = game.gameSeats[seatIndex];
    var extra = {
        qiangGang:huType == 'qianggang', gangKai:huType == 'gangkai',
        haiDi:!!(extra2 && extra2.haiDi), tianHu:!!(extra2 && extra2.tianHu), diHu:!!(extra2 && extra2.diHu)
    };
    var actualZimo = huType == 'zimo' || huType == 'gangkai' || huType == 'tianhu';
    var r = calculateTai(game, sd, {isZimo:actualZimo, extra:extra});
    var tai = r.tai;
    var maxTai = Number(game.maxTai) || 10;
    if(maxTai > 0 && tai > maxTai){ tai = maxTai; r.tailog.push('封顶' + maxTai + '台'); }
    var unit = (game.conf.baseScore || 1) * tai;
    var n = seatCount(game);
    var zmul = taiRule(game, 'zhuang_multiplier', 2);
    if(zmul <= 0) zmul = 1;
    var roomId = roomMgr.getRoomIdOfUser(sd.userId);
    var roomInfo = roomMgr.getRoom(roomId);

    if(huType == 'qianggang'){
        // 抢杠按自摸付款口径由杠家全包；闲家抢杠不加庄倍。
        var each = unit * (seatIndex == game.button ? zmul : 1);
        transfer(game, payFrom, seatIndex, each * (n - 1), 'hu');
    } else if(actualZimo){
        var amount = unit * (seatIndex == game.button ? zmul : 1);
        for(var i = 0; i < n; ++i) if(i != seatIndex) transfer(game, i, seatIndex, amount, 'hu');
    } else {
        var allPay = ruleOn(game, 'dian_pao_all_pay', 0);
        for(var p = 0; p < n; ++p){
            if(p == seatIndex || (!allPay && p != payFrom)) continue;
            var mul = (p == payFrom && (seatIndex == game.button || payFrom == game.button)) ? zmul : 1;
            transfer(game, p, seatIndex, unit * mul, 'hu');
        }
    }
    if(roomInfo){
        var rs = roomInfo.seats[seatIndex];
        if(actualZimo || huType == 'qianggang') rs.numZiMo = (rs.numZiMo || 0) + 1;
        else{
            rs.numJiePao = (rs.numJiePao || 0) + 1;
            roomInfo.seats[payFrom].numDianPao = (roomInfo.seats[payFrom].numDianPao || 0) + 1;
            game.gameSeats[payFrom].fangpaoInfo = {pai:huPai, target:sd.userId};
        }
    }
    sd.hued = true;
    sd.huInfo = {hupai:huPai, zimo:actualZimo || huType == 'qianggang', tai:tai, huType:huType,
        tianhu:extra.tianHu, dihu:extra.diHu, haidihu:extra.haiDi};
    sd.taiLog = r.tailog;
    userMgr.brocastInRoom(roomId, 'game_hu_push', {
        si:seatIndex, pai:huPai, zimo:sd.huInfo.zimo, tai:tai, tailog:r.tailog,
        //胡牌亮明牌:下发胡牌者手牌(含所胡的牌),客户端据此翻回正向展示
        holds:game.gameSeats[seatIndex].holds.slice(),
        score:unit, scores:scoreSnapshot(game), hutype:huType
    });
}

function doGameOver(game){
    if(game.resultSent) return;
    game.gameOver = true;
    game.finishing = false;
    clearTurnTimeout(game); clearMoPaiTimeout(game);
    var roomId = roomMgr.getRoomIdOfUser(game.gameSeats[0].userId);
    var roomInfo = roomMgr.getRoom(roomId);
    if(!roomInfo) return;
    game.resultSent = true;
    var results = [];
    for(var i = 0; i < seatCount(game); ++i){
        var seat = game.gameSeats[i];
        var angangs = [], diangangs = [], wangangs = [];
        for(var g = 0; g < seat.gangs.length; ++g){
            var gang = seat.gangs[g];
            if(gang.type == 'an') angangs.push(gang.pai);
            else if(gang.type == 'ming') diangangs.push(gang.pai);
            else wangangs.push(gang.pai);
        }
        var huinfo = [];
        if(seat.hued && seat.huInfo){
            huinfo.push({ishupai:true, pai:seat.huInfo.hupai, action:seat.huInfo.zimo ? 'zimo' : 'hu',
                pattern:seat.huInfo.huType || '', haidihu:!!seat.huInfo.haidihu,
                tianhu:!!seat.huInfo.tianhu, dihu:!!seat.huInfo.dihu,
                fan:seat.huInfo.tai, tailog:seat.taiLog || [], numofgen:0});
        }
        if(seat.fangpaoInfo){
            huinfo.push({ishupai:false, pai:seat.fangpaoInfo.pai, action:'fangpao', pattern:'',
                haidihu:false, tianhu:false, dihu:false, fan:0, numofgen:0,
                target:seat.fangpaoInfo.target, index:0});
        }
        results.push({userid:seat.userId, name:seat.name, seatindex:i,
            score:seat.score - seat.startScore, totalscore:seat.score,
            gangScore:seat.gangScore, huScore:seat.huScore,
            holds:seat.holds.slice(), pengs:seat.pengs.slice(), chis:seat.chis.slice(),
            folds:seat.folds.slice(), hua:[], angangs:angangs, diangangs:diangangs, wangangs:wangangs,
            huinfo:huinfo, dingque:-1, qingyise:false, menqing:isMenQing(seat), jingouhu:false, zhongzhang:false});
        roomInfo.seats[i].score = seat.score;
    }
    roomInfo.lastHuIsBanker = false;
    var anyHu = false;
    for(var h = 0; h < seatCount(game); ++h){
        if(game.gameSeats[h].hued){
            anyHu = true;
            if(h == game.button) roomInfo.lastHuIsBanker = true;
        }
    }
    if(!anyHu) roomInfo.lastHuIsBanker = true;
    if(!roomInfo.roundHistory) roomInfo.roundHistory = [];
    var roundItem = {index:roomInfo.numOfGames, scores:[]};
    for(var r = 0; r < results.length; ++r){
        var item = {userid:results[r].userid, name:results[r].name, score:results[r].score};
        for(var hi = 0; hi < results[r].huinfo.length; ++hi){
            var info = results[r].huinfo[hi];
            if(info.ishupai){ item.tai = info.fan || 0; item.zimo = info.action == 'zimo'; break; }
        }
        roundItem.scores.push(item);
    }
    roomInfo.roundHistory.push(roundItem);
    var pushData = {results:results};
    if(roomInfo.numOfGames >= roomInfo.conf.maxGames){
        var endinfo = [];
        for(var e = 0; e < seatCount(game); ++e){
            var es = roomInfo.seats[e];
            endinfo.push({numzimo:es.numZiMo || 0, numjiepao:es.numJiePao || 0,
                numdianpao:es.numDianPao || 0, numangang:es.numAnGang || 0,
                numminggang:es.numMingGang || 0, numchadajiao:es.numChaJiao || 0});
        }
        pushData.endinfo = endinfo;
        pushData.final = true;
        pushData.roundHistory = roomInfo.roundHistory;
    }
    userMgr.brocastInRoom(roomId, 'game_over_push', pushData);
    game.lastResult = pushData;
    var cost = roomInfo.conf.cost || 0;
    if(roomInfo.numOfGames === 1 && cost > 0){
        for(var c = 0; c < roomInfo.seats.length; ++c){
            (function(uid){
                if(uid > 0) db.cost_gems(uid, cost, function(){});
            })(roomInfo.seats[c].userId);
        }
    }
    var index = roomInfo.numOfGames;
    var dbResults = [];
    for(var d = 0; d < results.length; ++d) dbResults.push({userid:results[d].userid, totalscore:results[d].totalscore});
    db.create_game(roomInfo.uuid, index, JSON.stringify({button:game.button, jinPai:-1, fanPai:-1}), function(){
        db.update_game_result(roomInfo.uuid, index, JSON.stringify(dbResults), function(){});
    });
    if(roomInfo.numOfGames >= roomInfo.conf.maxGames){
        var historyItem = {id:roomInfo.id, uuid:roomInfo.uuid, time:Math.ceil(Date.now()/1000), seats:[]};
        for(var s = 0; s < seatCount(game); ++s) historyItem.seats.push({name:roomInfo.seats[s].name, score:roomInfo.seats[s].score});
        for(var u = 0; u < seatCount(game); ++u){
            (function(uid){
                db.get_user_history(uid, function(oldHistory){
                    var history = oldHistory || [];
                    history.unshift(historyItem);
                    if(history.length > 20) history = history.slice(0,20);
                    db.update_user_history(uid, history, function(){});
                });
            })(roomInfo.seats[u].userId);
        }
    }
}

function opPriority(sd){
    if(sd.canHu) return 4;
    if(sd.canGang) return 3;
    if(sd.canPeng) return 2;
    if(sd.canChi) return 1;
    return 0;
}
function hasHigherPending(game, seatIndex, pri){
    if(!game.pendingOps) return false;
    for(var k in game.pendingOps){
        var si = parseInt(k);
        if(si != seatIndex && !game.pendingOps[si].resolved && opPriority(game.gameSeats[si]) > pri) return true;
    }
    return false;
}
function allPendingResolved(game){
    if(!game.pendingOps) return true;
    for(var k in game.pendingOps) if(!game.pendingOps[k].resolved) return false;
    return true;
}
function removeFold(game, seatIndex, pai){
    var folds = game.gameSeats[seatIndex].folds;
    var idx = folds.lastIndexOf(pai);
    if(idx >= 0) folds.splice(idx,1);
}
function clearLowerAfterHu(game, fromSeat){
    for(var i = 0; i < seatCount(game); ++i){
        var sd = game.gameSeats[i];
        if(i == fromSeat || sd.canHu) continue;
        if(hasOperations(sd)){
            clearAllOptions(game, sd);
            userMgr.sendMsg(sd.userId, 'game_action_push');
        }
        if(game.pendingOps && game.pendingOps[i]) game.pendingOps[i].resolved = true;
    }
}
function nearestHuOnly(game, fromSeat){
    var best = -1, distance = seatCount(game) + 1;
    for(var i = 0; i < seatCount(game); ++i){
        if(!game.gameSeats[i].canHu) continue;
        var d = (i - fromSeat + seatCount(game)) % seatCount(game);
        if(d > 0 && d < distance){ distance = d; best = i; }
    }
    for(var j = 0; j < seatCount(game); ++j) if(j != best) game.gameSeats[j].canHu = false;
}

exports.chuPai = function(userId, pai){
    var game = getGameByUserID(userId);
    if(!game || game.gameOver || game.finishing) return;
    var seatIndex = getSeatIndex(userId);
    if(seatIndex == null || seatIndex != game.turn || game.chuPai != -1) return;
    for(var i = 0; i < seatCount(game); ++i) if(i != seatIndex && hasOperations(game.gameSeats[i])) return;
    var sd = game.gameSeats[seatIndex];
    var idx = sd.holds.indexOf(pai);
    if(idx < 0) return;
    clearTurnTimeout(game);
    clearAllOptions(game, sd);
    userMgr.sendMsg(userId, 'game_action_push');
    sd.holds.splice(idx,1);
    rebuildCountMap(sd);
    sd.folds.push(pai);
    sd.guoShui = false; // 成功出牌后解除过水限制。
    sd.lastGangHua = false;
    sd.lastHaiDi = false;
    game.chuPai = pai;
    game.discardCount++;
    if(seatIndex == game.button) game.firstChuPaiDone = true;
    var roomId = roomMgr.getRoomIdOfUser(userId);
    userMgr.brocastInRoom(roomId, 'game_chupai_push', {si:seatIndex, pai:pai});
    sendOpToAll(game, 'game_chupai_notify_push', function(i){
        return {userId:userId, pai:pai, holds:i == seatIndex ? sd.holds.slice() : sd.holds.length};
    });
    game.pendingOps = {};
    game.multiHuInfo = null;
    for(var s = 0; s < seatCount(game); ++s){
        if(s == seatIndex) continue;
        var other = game.gameSeats[s];
        clearAllOptions(game, other);
        rebuildCountMap(other);
        checkCanPeng(game, other, pai);
        checkCanGangDian(game, other, pai);
        checkCanChi(game, other, pai, seatIndex);
        if(canDianPao(game, other, pai)) other.canHu = true;
    }
    if(!ruleOn(game, 'yi_pao_duo_xiang', 1)) nearestHuOnly(game, seatIndex);
    for(var p = 0; p < seatCount(game); ++p){
        if(p == seatIndex) continue;
        var ps = game.gameSeats[p];
        if(hasOperations(ps)){
            game.pendingOps[p] = {resolved:false};
            sendOperations(game, ps, pai);
        } else userMgr.sendMsg(ps.userId, 'game_action_push');
    }
    if(Object.keys(game.pendingOps).length == 0){
        game.pendingOps = null;
        moveToNextUser(game);
        scheduleMoPai(game);
    } else scheduleTurnTimeout(game, seatIndex, true);
};

exports.peng = function(userId){
    var game = getGameByUserID(userId);
    if(!game || game.gameOver || game.finishing) return;
    var seatIndex = getSeatIndex(userId), sd = game.gameSeats[seatIndex];
    if(!sd || !sd.canPeng) return;
    if(hasHigherPending(game, seatIndex, 2)){ sendOperations(game, sd, game.chuPai); return; }
    clearTurnTimeout(game);
    var pai = game.chuPai;
    for(var i = 0; i < 2; ++i) sd.holds.splice(sd.holds.indexOf(pai),1);
    sd.pengs.push(pai); sd.pengTiles.push([pai,pai,pai]);
    rebuildCountMap(sd);
    removeFold(game, game.turn, pai);
    game.turn = seatIndex; game.chuPai = -1; game.pendingOps = null;
    clearAllOptions(game);
    sendOpToAll(game, 'game_peng_push', function(i){
        return {si:seatIndex, pai:pai, holds:i == seatIndex ? sd.holds.slice() : sd.holds.length,
            pengTiles:JSON.parse(JSON.stringify(sd.pengTiles))};
    });
    scheduleTurnTimeout(game, seatIndex, false);
};

exports.chi = function(userId, chiPais){
    var game = getGameByUserID(userId);
    if(!game || game.gameOver || game.finishing) return;
    var seatIndex = getSeatIndex(userId), sd = game.gameSeats[seatIndex];
    if(!sd || !sd.canChi || !chiPais || chiPais.length != 3) return;
    if(hasHigherPending(game, seatIndex, 1)){ sendOperations(game, sd, game.chuPai); return; }
    var target = game.chuPai, others = [];
    for(var i = 0; i < 3; ++i) if(chiPais[i] != target) others.push(chiPais[i]);
    if(others.length != 2) return;
    var arr = [others[0],others[1],target].sort(function(a,b){return a-b;});
    if(getMJType(arr[0]) < 0 || getMJType(arr[0]) != getMJType(arr[2]) || arr[1] != arr[0]+1 || arr[2] != arr[0]+2) return;
    var i1 = sd.holds.indexOf(others[0]);
    var i2 = sd.holds.indexOf(others[1], i1 + 1);
    if(i1 < 0 || i2 < 0) return;
    clearTurnTimeout(game);
    sd.holds.splice(i2,1); sd.holds.splice(i1,1);
    sd.chis.push(arr); rebuildCountMap(sd);
    removeFold(game, game.turn, target);
    game.turn = seatIndex; game.chuPai = -1; game.pendingOps = null;
    clearAllOptions(game);
    sendOpToAll(game, 'game_chi_push', function(i){
        return {si:seatIndex, pais:arr, holds:i == seatIndex ? sd.holds.slice() : sd.holds.length};
    });
    scheduleTurnTimeout(game, seatIndex, false);
};

exports.gang = function(userId, pai){
    var game = getGameByUserID(userId);
    if(!game || game.gameOver || game.finishing) return;
    var seatIndex = getSeatIndex(userId), sd = game.gameSeats[seatIndex];
    if(!sd || !sd.canGang || sd.gangPai.indexOf(pai) < 0) return;
    var isAn = (sd.countMap[pai] || 0) == 4;
    var isWan = !isAn && sd.pengs.indexOf(pai) >= 0 && (sd.countMap[pai] || 0) >= 1;
    var isDian = !isAn && !isWan && game.chuPai == pai && (sd.countMap[pai] || 0) >= 3;
    if(isDian && hasHigherPending(game, seatIndex, 3)){ sendOperations(game, sd, pai); return; }
    clearTurnTimeout(game);
    if(isWan){
        game.qiangGangState = {si:seatIndex, pai:pai};
        game.pendingOps = {};
        for(var i = 0; i < seatCount(game); ++i){
            if(i == seatIndex) continue;
            var other = game.gameSeats[i];
            clearAllOptions(game, other);
            rebuildCountMap(other);
            if(canDianPao(game, other, pai)){
                other.canHu = true;
                game.pendingOps[i] = {resolved:false};
                sendOperations(game, other, pai);
            }
        }
        if(Object.keys(game.pendingOps).length > 0){
            if(!ruleOn(game, 'yi_pao_duo_xiang', 1)) nearestHuOnly(game, seatIndex);
            game.pendingOps = {};
            for(var j = 0; j < seatCount(game); ++j){
                if(game.gameSeats[j].canHu) game.pendingOps[j] = {resolved:false};
                else if(j != seatIndex){ clearAllOptions(game, game.gameSeats[j]); userMgr.sendMsg(game.gameSeats[j].userId, 'game_action_push'); }
            }
            scheduleTurnTimeout(game, seatIndex, true);
            return;
        }
        game.qiangGangState = null; game.pendingOps = null;
        doGang(game, seatIndex, pai, 'wan');
        return;
    }
    if(isAn) doGang(game, seatIndex, pai, 'an');
    else if(isDian) doGang(game, seatIndex, pai, 'ming');
};
function doGang(game, seatIndex, pai, gangtype){
    var sd = game.gameSeats[seatIndex];
    var removeCount = gangtype == 'an' ? 4 : (gangtype == 'ming' ? 3 : 1);
    for(var i = 0; i < removeCount; ++i){
        var idx = sd.holds.indexOf(pai);
        if(idx >= 0) sd.holds.splice(idx,1);
    }
    if(gangtype == 'wan'){
        var pi = sd.pengs.indexOf(pai);
        if(pi >= 0) sd.pengs.splice(pi,1);
        for(var t = 0; t < sd.pengTiles.length; ++t){
            if(sd.pengTiles[t][0] == pai){ sd.pengTiles.splice(t,1); break; }
        }
    }
    if(gangtype == 'ming') removeFold(game, game.turn, pai);
    settleGangMoney(game, seatIndex, gangtype); // 必须在game.turn改写前结算点杠。
    sd.gangs.push({pai:pai, type:gangtype});
    rebuildCountMap(sd);
    var roomId = roomMgr.getRoomIdOfUser(sd.userId);
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo){
        if(gangtype == 'an') roomInfo.seats[seatIndex].numAnGang = (roomInfo.seats[seatIndex].numAnGang || 0) + 1;
        else roomInfo.seats[seatIndex].numMingGang = (roomInfo.seats[seatIndex].numMingGang || 0) + 1;
    }
    game.turn = seatIndex; game.chuPai = -1; game.pendingOps = null; game.multiHuInfo = null;
    clearAllOptions(game);
    sd.lastGangHua = true; sd.lastHaiDi = false; game.gangBuPai = true;
    sendOpToAll(game, 'game_gang_push', function(i){
        return {si:seatIndex, pai:pai, gangtype:gangtype,
            holds:i == seatIndex ? sd.holds.slice() : sd.holds.length,
            pengs:sd.pengs.slice(), pengTiles:JSON.parse(JSON.stringify(sd.pengTiles)),
            scores:scoreSnapshot(game), gangScore:sd.gangScore};
    });
    scheduleMoPai(game);
}

exports.hu = function(userId){
    var game = getGameByUserID(userId);
    if(!game || game.gameOver || game.finishing) return;
    var seatIndex = getSeatIndex(userId), sd = game.gameSeats[seatIndex];
    if(!sd || !sd.canHu) return;
    clearTurnTimeout(game); clearMoPaiTimeout(game);
    if(game.qiangGangState && game.qiangGangState.si != seatIndex){
        var qp = game.qiangGangState.pai, gs = game.qiangGangState.si;
        sd.holds.push(qp); rebuildCountMap(sd);
        clearAllOptions(game, sd); userMgr.sendMsg(userId, 'game_action_push');
        if(game.pendingOps && game.pendingOps[seatIndex]) game.pendingOps[seatIndex].resolved = true;
        doHuSettle(game, seatIndex, qp, 'qianggang', gs);
        if(!game.multiHuInfo) game.multiHuInfo = {fromSeat:gs, huedSeats:{}, qianggang:true};
        game.multiHuInfo.huedSeats[seatIndex] = true;
        clearLowerAfterHu(game, gs);
        if(hasRemainingHu(game)) scheduleTurnTimeout(game, seatIndex, true);
        else finishHuRound(game);
        return;
    }
    if(game.chuPai != -1 && game.turn != seatIndex){
        var pai = game.chuPai, fromSeat = game.turn;
        sd.holds.push(pai); rebuildCountMap(sd);
        if(!game.multiHuInfo) removeFold(game, fromSeat, pai);
        clearAllOptions(game, sd); userMgr.sendMsg(userId, 'game_action_push');
        if(game.pendingOps && game.pendingOps[seatIndex]) game.pendingOps[seatIndex].resolved = true;
        var diHu = fromSeat == game.button && game.discardCount == 1 && !sd.hasDrawn && taiRule(game, 'di_hu', 8) > 0;
        doHuSettle(game, seatIndex, pai, diHu ? 'dihu' : 'dianpao', fromSeat, {diHu:diHu});
        if(!game.multiHuInfo) game.multiHuInfo = {fromSeat:fromSeat, huedSeats:{}};
        game.multiHuInfo.huedSeats[seatIndex] = true;
        clearLowerAfterHu(game, fromSeat);
        if(hasRemainingHu(game)) scheduleTurnTimeout(game, seatIndex, true);
        else finishHuRound(game);
        return;
    }
    if(game.turn == seatIndex && game.chuPai == -1){
        var huPai = sd.lastMoPai != null ? sd.lastMoPai : sd.holds[sd.holds.length - 1];
        var tianHu = seatIndex == game.button && game.discardCount == 0 && !sd.hasDrawn && taiRule(game, 'tian_hu', 8) > 0;
        var huType = tianHu ? 'tianhu' : (sd.lastGangHua ? 'gangkai' : 'zimo');
        clearAllOptions(game);
        doHuSettle(game, seatIndex, huPai, huType, -1, {haiDi:sd.lastHaiDi, tianHu:tianHu});
        finishHuRound(game);
    }
};
function hasRemainingHu(game){
    if(!game.multiHuInfo) return false;
    for(var i = 0; i < seatCount(game); ++i){
        if(i != game.multiHuInfo.fromSeat && !game.multiHuInfo.huedSeats[i] && game.gameSeats[i].canHu) return true;
    }
    return false;
}
function finishHuRound(game){
    if(game.finishing || game.gameOver) return;
    game.finishing = true;
    clearTurnTimeout(game); clearMoPaiTimeout(game);
    clearAllOptions(game);
    game.pendingOps = null; game.qiangGangState = null;
    setTimeout(function(){
        game.multiHuInfo = null;
        doGameOver(game);
    }, 1500);
}

exports.guo = function(userId){
    var game = getGameByUserID(userId);
    if(!game || game.gameOver || game.finishing) return;
    var seatIndex = getSeatIndex(userId), sd = game.gameSeats[seatIndex];
    if(!sd || !hasOperations(sd)) return;
    clearTurnTimeout(game);
    var passedHu = sd.canHu && (game.chuPai != -1 || game.qiangGangState);
    if(passedHu) sd.guoShui = true;
    var ownTurn = game.turn == seatIndex && game.chuPai == -1 && !game.qiangGangState;
    clearAllOptions(game, sd); userMgr.sendMsg(userId, 'game_action_push');
    if(game.pendingOps && game.pendingOps[seatIndex]) game.pendingOps[seatIndex].resolved = true;
    if(game.multiHuInfo){
        if(hasRemainingHu(game)) scheduleTurnTimeout(game, seatIndex, true);
        else finishHuRound(game);
        return;
    }
    if(game.qiangGangState){
        if(allPendingResolved(game)){
            var qg = game.qiangGangState;
            game.qiangGangState = null; game.pendingOps = null;
            doGang(game, qg.si, qg.pai, 'wan');
        } else scheduleTurnTimeout(game, seatIndex, true);
        return;
    }
    if(ownTurn){ scheduleTurnTimeout(game, seatIndex, false); return; }
    if(allPendingResolved(game)){
        game.pendingOps = null;
        moveToNextUser(game); scheduleMoPai(game);
    } else scheduleTurnTimeout(game, seatIndex, true);
};
function autoGuoAll(game){
    if(!game || game.gameOver || game.finishing) return;
    for(var i = 0; i < seatCount(game); ++i){
        var sd = game.gameSeats[i];
        if(!hasOperations(sd)) continue;
        if(sd.canHu && (game.chuPai != -1 || game.qiangGangState)) sd.guoShui = true;
        clearAllOptions(game, sd);
        userMgr.sendMsg(sd.userId, 'game_action_push');
        if(game.pendingOps && game.pendingOps[i]) game.pendingOps[i].resolved = true;
    }
    if(game.multiHuInfo){ finishHuRound(game); return; }
    if(game.qiangGangState){
        var qg = game.qiangGangState;
        game.qiangGangState = null; game.pendingOps = null;
        doGang(game, qg.si, qg.pai, 'wan');
        return;
    }
    game.pendingOps = null;
    moveToNextUser(game); scheduleMoPai(game);
}

exports.start = function(roomInfo){
    if(games[roomInfo.id]){
        clearMoPaiTimeout(games[roomInfo.id]); clearTurnTimeout(games[roomInfo.id]);
    }
    var n = roomInfo.seats.length;
    var game = {
        roomId:roomInfo.id, seatCount:n, mahjongs:[], currentIndex:0, tailIndex:-1,
        button:roomInfo.nextButton || 0, turn:0, chuPai:-1, jinPai:-1, fanPai:-1,
        gangBuPai:false, qiangGangState:null, pendingOps:null, multiHuInfo:null,
        firstChuPaiDone:false, discardCount:0, gameSeats:[], gameOver:false, finishing:false,
        conf:roomInfo.conf, maxTai:roomInfo.conf.maxTai || 10,
        taiRules:normalizeRules(roomInfo.conf.taiRules), laozhuangCount:roomInfo.laozhuangCount || 0
    };
    for(var i = 0; i < n; ++i){
        var s = roomInfo.seats[i];
        game.gameSeats.push({userId:s.userId, name:s.name, seatIndex:i,
            holds:[], hua:[], countMap:{}, pengs:[], pengTiles:[], gangs:[], chis:[], folds:[],
            canPeng:false, canGang:false, canChi:false, canHu:false, gangPai:[], chiPai:null,
            hued:false, score:s.score || 0, startScore:s.score || 0, gangScore:0, huScore:0,
            lastGangHua:false, lastHaiDi:false, lastMoPai:null, hasDrawn:false, guoShui:false});
    }
    shuffle(game); deal(game);
    for(var r = 0; r < n; ++r) rebuildCountMap(game.gameSeats[r]);
    games[roomInfo.id] = game;
    var zhuang = game.gameSeats[game.button];
    checkCanAnGang(game, zhuang);
    if(canHuNow(game, zhuang)) zhuang.canHu = true;
    var baseData = {button:game.button, laozhuang:game.laozhuangCount, turn:game.turn,
        caishen:-1, fanPai:-1, playStyle:roomInfo.conf.type || (n == 4 ? 'wujin4' : 'wujin'),
        chupaiTimeout:getChupaiTimeout(game), numofmj:numOfMJ(game), seats:[]};
    for(var b = 0; b < n; ++b){
        var bs = game.gameSeats[b];
        baseData.seats.push({userid:bs.userId, name:bs.name, score:bs.score, holds:0, folds:[],
            pengs:[], pengTiles:[], chis:[], angangs:[], diangangs:[], wangangs:[], hua:[], youjin:0});
    }
    for(var u = 0; u < n; ++u){
        var data = JSON.parse(JSON.stringify(baseData));
        for(var j = 0; j < n; ++j) data.seats[j].holds = j == u ? game.gameSeats[j].holds.slice() : game.gameSeats[j].holds.length;
        userMgr.sendMsg(game.gameSeats[u].userId, 'game_start_push', data);
    }
    if(hasOperations(zhuang)) sendOperations(game, zhuang, zhuang.holds[zhuang.holds.length - 1]);
    scheduleTurnTimeout(game, game.button, false);
};

exports.hasOperations = hasOperations;
exports.__getGame = function(roomId){ return games[roomId]; };
exports.__calculateTai = calculateTai;
exports.__internals = {
    canFormMelds:canFormMelds, checkHuStructure:checkHuStructure, canDianPao:canDianPao,
    canHuNow:canHuNow, canAllTriplets:canAllTriplets, hasSequenceDecomposition:hasSequenceDecomposition,
    splitHolds:splitHolds, isMenQing:isMenQing
};

exports.resendGameState = function(roomId, userId){
    var game = games[roomId];
    if(!game) return;
    var roomInfo = roomMgr.getRoom(roomId);
    if(game.gameOver){
        if(game.lastResult){
            if(roomInfo) userMgr.sendMsg(userId, 'game_num_push', roomInfo.numOfGames);
            userMgr.sendMsg(userId, 'game_over_push', game.lastResult);
        }
        return;
    }
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null || !game.gameSeats[seatIndex]) return;
    var data = {button:game.button, laozhuang:roomInfo ? roomInfo.laozhuangCount || 0 : 0,
        turn:game.turn, caishen:-1, fanPai:-1,
        playStyle:game.conf.type || (seatCount(game) == 4 ? 'wujin4' : 'wujin'),
        chupaiTimeout:getChupaiTimeout(game), numofmj:numOfMJ(game), seats:[]};
    for(var i = 0; i < seatCount(game); ++i){
        var s = game.gameSeats[i], angangs = [], diangangs = [], wangangs = [];
        for(var g = 0; g < s.gangs.length; ++g){
            if(s.gangs[g].type == 'an') angangs.push(s.gangs[g].pai);
            else if(s.gangs[g].type == 'ming') diangangs.push(s.gangs[g].pai);
            else wangangs.push(s.gangs[g].pai);
        }
        data.seats.push({userid:s.userId, name:s.name, score:s.score,
            holds:i == seatIndex ? s.holds.slice() : s.holds.length, folds:s.folds,
            pengs:s.pengs, pengTiles:s.pengTiles, chis:s.chis,
            angangs:angangs, diangangs:diangangs, wangangs:wangangs, hua:[], youjin:0});
    }
    if(roomInfo) userMgr.sendMsg(userId, 'game_num_push', roomInfo.numOfGames);
    userMgr.sendMsg(userId, 'game_start_push', data);
    var sd = game.gameSeats[seatIndex];
    if(hasOperations(sd)) sendOperations(game, sd, game.chuPai != -1 ? game.chuPai : -1);
};

exports.youjin = function(){};
exports.youjinContinue = function(){};
exports.bao = function(){};
exports.huanSanZhang = function(){};
exports.dingQue = function(){};
exports.isPlaying = function(roomId){ return games[roomId] != null; };
exports.hasBegan = function(roomId){ var g = games[roomId]; return g != null && !g.gameOver; };
exports.setReady = function(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return;
    var roomInfo = roomMgr.getRoom(roomId);
    if(!roomInfo) return;
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null) return;
    var s = roomInfo.seats[seatIndex];
    if(s.ready) return;
    s.ready = true;
    if(roomInfo.numOfGames >= roomInfo.conf.maxGames) return;
    if(games[roomId] && !games[roomId].gameOver) return;
    var readyCount = 0, onlineCount = 0;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(rs.userId > 0 && userMgr.isOnline(rs.userId)){
            onlineCount++;
            if(rs.ready) readyCount++;
        }
    }
    if(onlineCount == roomInfo.seats.length && readyCount == onlineCount){
        setTimeout(function(){
            if(roomInfo.numOfGames >= roomInfo.conf.maxGames) return;
            if(games[roomId] && !games[roomId].gameOver) return;
            var room = roomMgr.getRoom(roomId);
            if(room) exports.begin(room);
        },1000);
    }
};
exports.begin = function(roomInfo){
    var n = roomInfo.seats.length;
    if(roomInfo.numOfGames > 0){
        if(roomInfo.lastHuIsBanker) roomInfo.laozhuangCount = (roomInfo.laozhuangCount || 0) + 1;
        else{
            roomInfo.nextButton = (roomInfo.nextButton + 1) % n;
            roomInfo.laozhuangCount = 0;
        }
    } else roomInfo.laozhuangCount = 0;
    roomInfo.numOfGames++;
    db.update_num_of_turns(roomInfo.id, roomInfo.numOfGames);
    for(var i = 0; i < n; ++i) roomInfo.seats[i].ready = false;
    var anyUserId = roomInfo.seats[0].userId;
    userMgr.broacastInRoom('game_num_push', roomInfo.numOfGames, anyUserId, true);
    userMgr.broacastInRoom('game_begin_push', roomInfo.nextButton, anyUserId, true);
    exports.start(roomInfo);
};
exports.dissolveRequest = function(roomId, userId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(!roomInfo) return null;
    if(roomInfo.dr) return {dr:roomInfo.dr};
    var states = [];
    for(var i = 0; i < roomInfo.seats.length; ++i) states.push(roomInfo.seats[i].userId == userId);
    roomInfo.dr = {endTime:Date.now()+300000, states:states};
    return {dr:roomInfo.dr};
};
exports.dissolveAgree = function(roomId, userId, agree){
    var roomInfo = roomMgr.getRoom(roomId);
    if(!roomInfo || !roomInfo.dr) return null;
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null) return null;
    roomInfo.dr.states[seatIndex] = agree;
    return {dr:roomInfo.dr};
};
exports.doDissolve = function(roomId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(!roomInfo) return;
    var game = games[roomId];
    if(game){ clearMoPaiTimeout(game); clearTurnTimeout(game); delete games[roomId]; }
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var uid = roomInfo.seats[i].userId;
        if(uid > 0) userMgr.sendMsg(uid, 'dispress_push', {});
    }
    roomInfo.dr = null;
    roomMgr.destroy(roomId);
};
