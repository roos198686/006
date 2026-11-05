var roomMgr = require('./roommgr');
var replayMgr = require('./replaymgr');
var userList = {};
var userOnline = 0;
//玩家最后真实操作时间(心跳game_ping不计入)与断线开始时间,供房间无动作/断线自动解散扫描使用
var lastActivity = {};
var offlineSince = {};

exports.bind = function(userId,socket){
    userList[userId] = socket;
    userOnline++;
    exports.touchActivity(userId);
};

exports.del = function(userId,socket){
    delete userList[userId];
    userOnline--;
    //记录断线开始时间
    if(offlineSince[userId] == null){
        offlineSince[userId] = Date.now();
    }
};

//刷新玩家活跃时间(任意真实操作消息触发,心跳除外)
exports.touchActivity = function(userId){
    if(userId == null){
        return;
    }
    lastActivity[userId] = Date.now();
    delete offlineSince[userId];
};

exports.getLastActivity = function(userId){
    return lastActivity[userId] || 0;
};

exports.getOfflineSince = function(userId){
    return offlineSince[userId] || 0;
};

exports.get = function(userId){
    return userList[userId];
};

exports.isOnline = function(userId){
    var data = userList[userId];
    if(data != null){
        return true;
    }
    return false;
};

exports.getOnlineCount = function(){
    return userOnline;
}

exports.sendMsg = function(userId,event,msgdata){
    console.log(event);
    //录像录制:只记录,不额外推送
    replayMgr.onSend(roomMgr.getUserRoom(userId), userId, event, msgdata);
    var userInfo = userList[userId];
    if(userInfo == null){
        return;
    }
    var socket = userInfo;
    if(socket == null){
        return;
    }

    socket.emit(event,msgdata);
};

//房间里所有玩家(含坐下和只在房里没入座的)的 userId 列表
function roomAllUserIds(roomId, roomInfo){
    var uids = [];
    var mark = {};
    if(roomInfo){
        for(var i = 0; i < roomInfo.seats.length; ++i){
            var uid = roomInfo.seats[i].userId;
            if(uid > 0 && !mark[uid]){ mark[uid] = 1; uids.push(uid); }
        }
    }
    //进了房间但没占座的玩家: userLocation 里有记录但不在座位上
    var locs = roomMgr.getUserLocations ? roomMgr.getUserLocations() : null;
    if(locs){
        for(var k in locs){
            var loc = locs[k];
            var u = Number(k);
            if(loc && loc.roomId == roomId && u > 0 && !mark[u]){ mark[u] = 1; uids.push(u); }
        }
    }
    return uids;
}

exports.kickAllInRoom = function(roomId){
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    var uids = roomAllUserIds(roomId, roomInfo);
    for(var i = 0; i < uids.length; ++i){
        var socket = userList[uids[i]];
        if(socket != null){
            exports.del(uids[i]);
            socket.disconnect();
        }
    }
};

//按房间号广播给房间内所有玩家(含发送方)
exports.brocastInRoom = function(roomId,event,data){
    if(roomId == null){
        return;
    }
    //录像录制:广播同样需要入档
    replayMgr.onSend(roomId, 0, event, data);
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }
    //座位上 + 只进房没入座的玩家都要收到(结算清退/散场广播等)
    var uids = roomAllUserIds(roomId, roomInfo);
    for(var i = 0; i < uids.length; ++i){
        var socket = userList[uids[i]];
        if(socket != null){
            socket.emit(event,data);
        }
    }
};

exports.broacastInRoom = function(event,data,sender,includingSender){
    var roomId = roomMgr.getUserRoom(sender);
    if(roomId == null){
        return;
    }
    //录像录制:广播同样需要入档
    replayMgr.onSend(roomId, 0, event, data);
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];

        //如果不需要发给发送方，则跳过
        if(rs.userId == sender && includingSender != true){
            continue;
        }
        var socket = userList[rs.userId];
        if(socket != null){
            socket.emit(event,data);
        }
    }
};