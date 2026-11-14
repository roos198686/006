// 诸暨麻将（赖倒胡/翻财神/包麻将）客户端网络数据层
// 协议与服务端 gamemgr_ldh/fcs/bmj 对应：
//   game_start_push {button,caishen,caishen2,fanPai,playStyle,numofmj,seats:[{userid,name,score,holds}]}
//   game_mopai_push {si,pai,numofmj,holds}  自己holds为数组，对手为数量
//   game_chupai_push {si,pai}
//   game_chupai_notify_push {userId,pai,holds}
//   game_peng_push/game_gang_push {si,pai,holds[,gangtype]}
//   game_chi_push {si,pais,holds}
//   game_action_push {pai,hu,peng,gang,chi,gangpai,chipai} 或空
//   game_hu_push {si,pai,zimo,tai,score}
//   bao_select_push/bao_turn_push/bao_result_push（包麻将）
//   game_over_push {results:[...],endinfo?}
cc.Class({
    extends: cc.Component,

    properties: {
        dataEventHandler:null,
        roomId:null,   //房间id
        maxNumOfGames:0, //最大几局
        numOfGames:0, //第几局
        numOfMJ:0,  //剩余几张牌
        seatIndex:-1,
        seats:null,
        turn:-1,
        button:-1,
        chupai:-1,
        gamestate:"",
        isOver:false,
        dissoveData:null,
        waitCaishenMode:null, //包麻将:等待包家定财神的模式缓存(事件在场景就绪前到达被丢弃时,场景onLoad据此补发)
        waitBaoData:null,     //包麻将:轮到自己叫台的请求缓存(同上)
        //宝宝(6张)
        bbMyCards:null,
        bbMySeat:-1,
        bbSeats:null,
        bbBankerSeat:0,
        bbBankerMode:true,
        bbGameType:null,
        bbPhase:null,
        bbArrangeDeadline:0,
        bbMyDaos:null,
        bbArranged:false,
        _ignoreDisconnectOnce:false, //主动退出/解散后服务端会断socket,此标记避免disconnect再次切场景造成页面跳动
        roomBackScene:"", //进房间时所在的场景(hall/club),退出时按它回到来源页,而不是固定回大厅
        roomBackClubId:null, //从俱乐部进桌时记住俱乐部id,退出回俱乐部场景直达该详情页
    },

    reset:function(){
        this.turn = -1;
        this.chupai = -1;
        this.button = -1;
        this.gamestate = "";
        this.curaction = null;
        if(this.seats == null) return;
        for(var i = 0; i < this.seats.length; ++i){
            this.seats[i].holds = [];
            this.seats[i].folds = [];
            this.seats[i].pengs = [];
            this.seats[i].chis = [];
            this.seats[i].angangs = [];
            this.seats[i].diangangs = [];
            this.seats[i].wangangs = [];
            this.seats[i].hua = []; //漳浦:花牌数组,新一局必须清,否则沿用上一局的花牌
            this.seats[i].ready = false;
            this.seats[i].hued = false;
        }
    },

    clear:function(){
        this.dataEventHandler = null;
        if(this.isOver == null){
            this.seats = null;
            this.roomId = null;
            this.maxNumOfGames = 0;
            this.numOfGames = 0;
        }
    },

    //解散/退出房间后彻底清理牌局残留状态。
    //只清 roomId/turn/seats 会把 gamestate 留在 "begin"、剩余牌数/财神配置(conf)等也残留,
    //各玩法脚本 onGameBeign 以 gamestate=="" 判定"本局未进行":残留时再进(新)房间会被误判为牌局进行中,
    //直接亮出牌桌(含场景内静态牌墙),即"房间已解散/已退出,一进新房间就有牌"。
    clearRoomState:function(){
        this.reset();   //清 turn/chupai/button/gamestate/curaction,并清空各座位 holds/副露/弃牌
        this.roomId = null;
        this.seats = null;
        this.conf = null;
        this.numOfMJ = 0;
        this.numOfGames = 0;
        this.maxNumOfGames = 0;
        this.laozhuang = 0;
        this.isOver = false;
        this.dissoveData = null;
        this.overData = null; //清结算补发缓存:防止退出后进新房间场景加载时错误重放上一局的结算弹窗
        this.waitCaishenMode = null; //清包麻将定财神等待缓存
        this.waitBaoData = null;     //清包麻将叫台请求缓存
        //清宝宝状态
        this.bbMyCards = null;
        this.bbMySeat = -1;
        this.bbSeats = null;
        this.bbBankerSeat = 0;
        this.bbBankerMode = true;
        this.bbGameType = null;
        this.bbPhase = null;
        this.bbArrangeDeadline = 0;
        this.bbMyDaos = null;
        this.bbArranged = false;
        this.bbWatching = false;
        this.bbReveal = null;
        this.bbOverDetails = null;
        //清十三水状态
        this.sssStart = null;
        this.sssMyCards = null;
        this.sssMySeat = -1;
        this.sssSeats = null;
        this.sssArrange = null;
        this.sssArrangeDeadline = 0;
        this.sssConfirmed = null;
        this.sssResult = null;
        this._pendingEvents = [];    //清事件队列:防止上一房间残留事件重放进新房间场景
    },

    //退出房间统一回"牌桌大厅"(club场景按fromClubId直达该俱乐部的玩法/牌桌列表页)。
    //俱乐部id优先取进房来源(俱乐部进桌),其次房间配置conf.clubid(从大厅按房号进桌也有),
    //两处都取不到才落到俱乐部列表页;不再回系统大厅。
    exitToTableHall:function(){
        var cid = 0;
        if(this.roomBackClubId){ cid = parseInt(this.roomBackClubId) || 0; }
        if(!(cid > 0) && cc.vv.fromClubId){ cid = parseInt(cc.vv.fromClubId) || 0; }
        if(!(cid > 0) && this.conf && this.conf.clubid){ cid = parseInt(this.conf.clubid) || 0; }
        if(cid > 0){
            cc.vv.fromClub = true;
            cc.vv.fromClubId = cid;
        }
        console.log("[退出房间]回牌桌大厅 clubId=" + cid);
        if(cc.vv.sceneMgr){ cc.vv.sceneMgr.load("club"); }
        else{ cc.director.loadScene("club"); }
    },

    onLoad:function(){
        //dataEventHandler改为存取器:场景一绑定立即按序重放排队事件(场景异步加载期间事件不再丢弃)
        this._pendingEvents = [];
        var handler = null, self = this;
        Object.defineProperty(this,'dataEventHandler',{
            configurable:true,
            get:function(){ return handler; },
            set:function(v){
                handler = v;
                if(v && self._pendingEvents.length){
                    var q = self._pendingEvents;
                    self._pendingEvents = [];
                    for(var i = 0; i < q.length; ++i){
                        console.log('[GameNetMgr] 重放事件', q[i].event);
                        v.emit(q[i].event, {detail:q[i].data});
                    }
                }
            }
        });
    },

    //派发事件：统一包装成 {detail:data}，与各玩法脚本 data.detail 的取值约定保持一致
    dispatchEvent(event,data){
        console.log('[GameNetMgr.dispatchEvent] event=',event,' dataEventHandler=',!!this.dataEventHandler);
        if(this.dataEventHandler){
            this.dataEventHandler.emit(event,{detail:data});
        } else {
            if(this._pendingEvents == null) this._pendingEvents = [];
            if(this._pendingEvents.length < 300) this._pendingEvents.push({event:event,data:data});
            console.error('[GameNetMgr.dispatchEvent] dataEventHandler is NULL! event=' + event + ' 已入队待重放');
        }
    },

    getSeatIndexByID:function(userId){
        for(var i = 0; i < this.seats.length; ++i){
            var s = this.seats[i];
            if(s.userid == userId){
                return i;
            }
        }
        return -1;
    },

    isOwner:function(){
        return this.seatIndex == 0;
    },

    getSeatByID:function(userId){
        var seatIndex = this.getSeatIndexByID(userId);
        var seat = this.seats[seatIndex];
        return seat;
    },

    getSelfData:function(){
        return this.seats[this.seatIndex];
    },

    getLocalIndex:function(index){
        var len = this.seats ? this.seats.length : 2;
        var ret = (index - this.seatIndex + len) % len;
        return ret;
    },

    //按玩法类型返回牌桌场景名(进入房间/回放共用)
    sceneForType:function(t){
        t = String(t || "");
        if(t.indexOf("baobao_shou") === 0) return "mjgame_bb_shou";
        if(t.indexOf("baobao") === 0) return "mjgame_bb_mian";
        if(t == "zj_lao") return "mjgame_zjlao";
        if(t == "zj_bt") return "mjgame_bmj";
        if(t == "zj_zx") return "mjgame_zjzx";
        if(t == "zp") return "mjgame_zp";
        if(t == "wujin") return "mjgame_wujin";
        if(t == "wujin4") return "mjgame_wujin4";
        if(t == "guanpai2") return "mjgame_gp2";
        if(t == "guanpai3") return "mjgame_gp3";
        if(t == "sss2" || t == "sss4" || t == "sss6") return "mjgame_sss";
        if(t == "zj" || t == "zj4" || t == "zj4_bt") return "mjgame_ldh";
        return "mjgame_bb_mian";
    },

    //当前玩法的游戏场景名
    getGameScene:function(){
        return this.sceneForType(this.conf && this.conf.type);
    },

    prepareReplay:function(roomInfo,detailOfGame){
        this.roomId = roomInfo.id;
        this.seats = roomInfo.seats;
        this.turn = detailOfGame.base_info.button;
        var baseInfo = detailOfGame.base_info;
        for(var i = 0; i < this.seats.length; ++i){
            var s = this.seats[i];
            s.seatindex = i;
            s.score = null;
            s.holds = baseInfo.game_seats[i];
            s.pengs = [];
            s.chis = [];
            s.angangs = [];
            s.diangangs = [];
            s.wangangs = [];
            s.folds = [];
            if(cc.vv.userMgr.userId == s.userid){
                this.seatIndex = i;
            }
        }
        this.conf = {
            type:baseInfo.type,
        }
        if(this.conf.type == null){
            this.conf.type = "zj";
        }
    },

    getWanfa:function(){
        var conf = this.conf;
        if(conf == null){ console.log("[getWanfa] conf IS NULL"); return ""; }
        // 诊断:把 conf 所有字段都打出来,一目了然
        var dbg = {};
        for(var k in conf){ dbg[k] = typeof conf[k] === "string" && conf[k].length > 60 ? conf[k].substring(0,60)+"..." : conf[k]; }
        console.log("[getWanfa] conf keys=", Object.keys(conf), "dbg=", JSON.stringify(dbg));
        var name = "宝宝";
        if(conf.type == "baobao_mian") name = "宝宝免摆";
        else if(conf.type == "baobao_shou") name = "宝宝手动摆";
        else if(conf.club_table_name) name = conf.club_table_name; //俱乐部牌桌:显示玩家录入的真实牌桌名,不再显示英文玩法码
        else if(conf.type) name = conf.type;
        var strArr = [name];
        // 底分:优先 conf.baseScore (roommgr驼峰),fallback conf.base_score/conf.base (兼容旧版)
        var baseScore = conf.baseScore != null ? conf.baseScore : (conf.base_score != null ? conf.base_score : conf.base);
        console.log("[getWanfa] baseScore=", baseScore, " conf.baseScore=", conf.baseScore, " conf.base_score=", conf.base_score, " conf.base=", conf.base);
        if(baseScore != null && baseScore !== "" && baseScore > 0) strArr.push("底分" + baseScore);
        else console.log("[getWanfa] baseScore SKIPPED (null/empty/0)");
        // 台封顶:优先 conf.maxTai,fallback conf.max_tai (兼容旧版);宝宝玩法无台数概念不显示
        var maxTaiVal = conf.maxTai != null ? conf.maxTai : conf.max_tai;
        var isBaobao = (conf.type == "baobao_mian" || conf.type == "baobao_shou");
        console.log("[getWanfa] maxTaiVal=", maxTaiVal, " conf.maxTai=", conf.maxTai);
        if(!isBaobao && maxTaiVal != null && maxTaiVal > 0) strArr.push(maxTaiVal + "台封顶");
        // 局数
        console.log("[getWanfa] maxGames=", conf.maxGames, " conf.max_games=", conf.max_games);
        if(conf.maxGames != null && conf.maxGames > 0) strArr.push(conf.maxGames + "局");
        // 诸暨系显示起胡台数
        var isZJTai = (conf.type == "zj" || conf.type == "zj_bt" || conf.type == "zj4" || conf.type == "zj4_bt" || conf.type == "zj_zx" || conf.type == "zj4_zx");
        if(isZJTai){
            // taiRules 可能是字符串(admin_api JSON.stringify 入库),也可能是对象,也可能是 null
            var tr = conf.taiRules;
            if(tr != null && typeof tr === "string"){
                try{ tr = JSON.parse(tr); }catch(e){ console.log("[getWanfa] taiRules parse FAIL:", e.message); tr = null; }
            }
            console.log("[getWanfa] taiRules after parse=", tr);
            var minTai = (tr && tr.min_tai != null) ? Number(tr.min_tai) : 1;
            if(minTai > 0){ strArr.push(minTai + "台起胡"); }
        }
        var result = strArr.join(" ");
        console.log("[getWanfa] FINAL=", result);
        return result;
    },

    //应用服务端下发的手牌数据：本座位为完整数组，其他座位仅为数量(number)。
    //只有数组才覆盖 seatData.holds，数字则单独记录为 holdCount，避免对手座位 holds 被写成数字后
    //在按数组处理的地方(排序/渲染/重连合并)出现错乱。
    applyPushHolds:function(seatData,holds){
        if(seatData == null || holds == null){ return; }
        if(Object.prototype.toString.call(holds) === '[object Array]'){
            seatData.holds = holds;
        }
        else if(typeof(holds) === "number"){
            seatData.holdCount = holds;
        }
    },

    //初始化单个座位的游戏数据结构（缺省数组，防空引用）
    initSeatData:function(s){
        if(s.holds == null) s.holds = [];
        if(s.folds == null) s.folds = [];
        if(s.pengs == null) s.pengs = [];
        if(s.chis == null) s.chis = [];
        if(s.angangs == null) s.angangs = [];
        if(s.diangangs == null) s.diangangs = [];
        if(s.wangangs == null) s.wangangs = [];
        if(s.hued == null) s.hued = false;
        if(s.ready == null) s.ready = false;
    },

    initHandlers:function(){
        var self = this;
        cc.vv.net.addHandler("login_result",function(data){
            console.log(data);
            //收到登录回应:清除进入房间超时检测
            if(self._loginTimer){
                clearTimeout(self._loginTimer);
                self._loginTimer = null;
            }
            if(data.errcode === 0){
                var data = data.data;
                self.roomId = data.roomid;
                self.conf = data.conf;
                self.maxNumOfGames = data.conf.maxGames;
                self.numOfGames = data.numofgames;
                self.seats = data.seats;
                //房间seats只有seatIndex(大写),麻将逻辑全用seatindex(小写),统一补齐否则getLocalIndex算出NaN
                for(var si = 0; si < self.seats.length; ++si){ self.seats[si].seatindex = si; }
                self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
                self.isOver = false;
                // 新进房间先清掉上一房间残留的宝宝对局/结算缓存:
                // 否则场景加载时会把上一局(或别人)的结算弹窗重放到新玩家屏幕上。
                // 本局真实状态由服务端 login_finished 之后的 resendGameState 重新补发
                self.overData = null;
                self.bbOverDetails = null;
                self.bbMyCards = null;
                self.bbMyDaos = null;
                self.bbPhase = null;
                self.bbArranged = false;
                self.bbMyMian = null;
                //记录本局玩法类型:退出/结算回俱乐部时用于直达该玩法的牌桌页,而不是默认玩法列表
                if(data.conf && data.conf.type){ cc.vv.lastGameType = data.conf.type; }
                //记录房间所属俱乐部:从大厅按房号进桌时没有来源俱乐部,靠它退出时也能回该俱乐部的牌桌页
                //(按本局实际房间覆盖,避免上一间俱乐部房间的id带到普通房间)
                var _cid = (data.conf && Number(data.conf.clubid)) || Number(cc.vv.fromClubId) || 0;
                self.roomBackClubId = (_cid > 0) ? _cid : null;
            }
            else{
                //进房失败:必须清掉上一房间残留(seats/conf/gamestate),否则服务端重启/房间不存在时,
                //客户端会拿旧数据误判牌局进行中,带着残留座位名+默认牌面直接亮出牌桌
                var hadRoom = (self.roomId != null);
                self.clearRoomState();
                //进房失败:宝宝豆不足用弹窗提示(需点击确定关闭),其他原因用3秒文字提示
                var failMsg = data.errmsg || "进入房间失败";
                if(failMsg.indexOf("宝宝豆") >= 0){
                    cc.vv.wc.showAlert(failMsg);
                }else{
                    cc.vv.wc.showError(failMsg);
                }
                //重连旧房失败(房间已失效):人还停在旧牌桌场景,必须切回牌桌大厅,否则面对一桌假牌无法操作
                if(hadRoom){
                    setTimeout(function(){
                        self.exitToTableHall();
                    }, 1200); //略作停留让错误提示可见
                }
            }
        });

        cc.vv.net.addHandler("login_finished",function(data){
            console.log("login_finished");
            if(self._loginTimer){ clearTimeout(self._loginTimer); self._loginTimer = null; }
            var sceneName = self.getGameScene();
            console.log("[进入房间]加载场景 " + sceneName);
            //场景就绪回调:重放错过的结算补发(结算停留期重进,game_over_push早于场景加载到达,
            //此时弹窗组件尚未注册监听直接dispatch会错过,导致重进后停在无按钮的空准备界面)
            var onSceneLaunched = function(){
                if(self.overData){
                    var od = self.overData;
                    self.overData = null;
                    self.bbOverDetails = od.details || null;
                    self.dispatchEvent('game_over', od.results);
                    if(od.endinfo){
                        self.isOver = true;
                        self.dispatchEvent('game_end',{endinfo: od.endinfo, roundHistory: od.roundHistory || null});
                    }
                }
            };
            //场景若未导入,loadScene只返回false且仅打日志,这里必须给出可见提示,避免永久卡在"正在进入房间"
            var ok = null;
            try{
                if(cc.vv.sceneMgr){
                    ok = cc.vv.sceneMgr.load(sceneName, onSceneLaunched);
                }else{
                    ok = cc.director.loadScene(sceneName, onSceneLaunched);
                }
            }catch(e){
                console.log("[进入房间]加载场景异常:" + (e && e.message));
            }
            if(ok === false){
                cc.vv.wc.showError("场景 " + sceneName + " 未导入,请在Cocos Creator中刷新资源后重试");
            }
        });

        cc.vv.net.addHandler("exit_result",function(data){
            //退出房间:彻底清残留(gamestate/剩余牌数/财神配置等),否则退出后进新房间会直接亮出牌桌
            //服务端回包后约150ms会断开socket:标记忽略这次disconnect,否则客户端会再切一次场景(页面跳动/被带回默认列表)
            //3秒兜底自动复位,防止标记残留影响后续真实断线
            self._ignoreDisconnectOnce = true;
            setTimeout(function(){ self._ignoreDisconnectOnce = false; }, 3000);
            self.clearRoomState();
            //座位/牌桌已在服务端释放完成, 通知场景立即切回大厅/俱乐部(不再固定空等)
            self.dispatchEvent('exit_result', {});
        });

        cc.vv.net.addHandler("exit_notify_push",function(data){
           var userId = data;
           var s = self.getSeatByID(userId);
           if(s != null){
               s.userid = 0;
               s.name = "";
               self.dispatchEvent("user_state_changed",s);
           }
        });

        cc.vv.net.addHandler("dispress_push",function(data){
            //解散房间:清除牌局残留状态。原实现只清 roomId/turn/seats,gamestate 会停留在 "begin",
            //再进(新)房间时 onGameBeign 误判"牌局进行中"直接显示牌桌(牌墙) => "解散后重进还有牌"
            //注意:事件名必须与服务端一致(dispress_push),之前写成dispess_push永远收不到,房间状态残留
            //服务端解散后会踢socket:标记忽略这次disconnect,返回页由房间/结算流程统一处理,避免二次切场景跳动
            self._ignoreDisconnectOnce = true;
            setTimeout(function(){ self._ignoreDisconnectOnce = false; }, 3000);
            self.clearRoomState();
            self.dispatchEvent("dispress_push", null);
        });

        // 同一账号在其他设备登录被踢下线: 立即清房间状态,弹窗提示后回大厅
        cc.vv.net.addHandler("kick_offline", function(data){
            console.log("[kick_offline] 被其他设备顶下线:", data && data.reason);
            self._ignoreDisconnectOnce = true;
            self.clearRoomState();
            self.dispatchEvent('kick_offline', data);
            // 提示语留在登录页/大厅页展示, 这里先切场景
            setTimeout(function(){
                if(cc.vv.sceneMgr){ cc.vv.sceneMgr.load("hall"); }
                else{ cc.director.loadScene("hall"); }
            }, 100);
        });

        cc.vv.net.addHandler("disconnect",function(data){
            if(self._ignoreDisconnectOnce){
                //主动退出/解散导致的断开:场景已在退出流程中切换,这里不再重复加载
                //不主动清零:置位3秒兜底用于异步socket真正断开时的二次触发,防止时间差导致误放行
                return;
            }
            // 辅助:SceneMgr 若已有过渡进行中,本回调等过渡完成再切
            var doLoad = function(name){
                if(cc.vv.sceneMgr){
                    cc.vv.sceneMgr.load(name);
                }else{
                    cc.director.loadScene(name);
                }
            };
            if(self.roomId == null){
                //无房断线:统一回牌桌大厅(俱乐部玩法/牌桌列表页),不再固定回系统大厅
                self.exitToTableHall();
            }
            else{
                if(self.isOver == false){
                    cc.vv.userMgr.oldRoomId = self.roomId;
                    self.dispatchEvent("disconnect");
                }
                else{
                    self.roomId = null;
                }
            }
        });

        cc.vv.net.addHandler("new_user_comes_push",function(data){
            var seatIndex = data.seatindex;
            if(self.seats[seatIndex].userid > 0){
                self.seats[seatIndex].online = true;
            }
            else{
                data.online = true;
                self.seats[seatIndex] = data;
            }
            self.dispatchEvent('new_user',self.seats[seatIndex]);
        });

        cc.vv.net.addHandler("user_state_push",function(data){
            var userId = data.userid;
            var seat = self.getSeatByID(userId);
            seat.online = data.online;
            self.dispatchEvent('user_state_changed',seat);
        });

        cc.vv.net.addHandler("user_ready_push",function(data){
            console.log("[BB] user_ready_push recv", JSON.stringify(data));
            var userId = data.userid;
            var seat = self.getSeatByID(userId);
            seat.ready = data.ready;
            self.dispatchEvent('user_state_changed',seat);
        });

        // ===== 诸暨三玩法协议 =====

        // 开局：完整座位数据（自己holds为数组，对手为数量）
        cc.vv.net.addHandler("game_start_push",function(data){
            console.log("game_start_push");
            self.button = data.button;
            self.laozhuang = data.laozhuang || 0; //连庄次数,庄标下方显示"老庄X"
            //重连补发带真实turn(当前该谁出牌);普通开局没有turn字段,用button(庄家先出)
            self.turn = (data.turn != null) ? data.turn : data.button;
            self.numOfMJ = data.numofmj;
            self.gamestate = "begin";
            if(self.conf == null) self.conf = {};
            //后台:流局留牌数(剩N张荒庄),牌墙的死墙/置灰张数按它来;
            //非无金玩法服务端不下发,这里显式置空,避免沿用上一局的配置
            self.conf.liuju_left = (data.liuju_left != null) ? Math.max(0, Number(data.liuju_left) || 0) : null;
            //后台:胡牌后延时打开小局结算弹窗的秒数(缺省2秒)
            self.conf.hu_delay = (data.hu_delay != null) ? Math.max(0, Number(data.hu_delay) || 0) : null;
            self.dispatchEvent('mj_count'); //刷新"剩余X张"显示
            self.conf.caishen = data.caishen;
            self.conf.caishen2 = data.caishen2;
            self.conf.fanPai = data.fanPai;
            self.conf.playStyle = data.playStyle;
            //后台开关:可胡点过是否弹二次确认(缺省开)
            if(data.hu_guo_confirm != null){ self.conf.hu_guo_confirm = data.hu_guo_confirm; }
            //后台:每杠流局加张,牌墙据此把可摸牌尾部对应张数置灰转死墙
            self.conf.gang_liuju = data.gang_liuju || 0;
            self.conf.baoDone = false; //新一局重置:叫台+选财神完成后才置true
            //包麻将:每局(含重连补发)都以服务端下发的叫台状态为准, 否则上一局的baoMode会残留
            self.conf.baoMode = (data.baoMode != null) ? data.baoMode : -1;
            self.conf.baoSeatIndex = (data.baoSeatIndex != null) ? data.baoSeatIndex : -1;
            self.conf.baoTai = (data.baoTai != null) ? data.baoTai : 0;
            //出牌倒计时(秒),服务端随开局下发(后台taiRules.chupai_timeout可配)
            if(data.chupaiTimeout != null){ self.chupaiTimeout = data.chupaiTimeout; }
            for(var i = 0; i < data.seats.length; ++i){
                var sd = data.seats[i];
                var seat = self.seats[i];
                seat.seatindex = i; //座位对象被复用/替换后seatindex会丢,开局强制回填
                seat.userid = sd.userid;
                seat.name = sd.name;
                seat.score = sd.score;
                self.applyPushHolds(seat,sd.holds);
                //重连补发的game_start_push携带副露/弃牌数据,必须一并恢复,否则重进后碰/吃/杠组和弃牌区全部丢失
                if(sd.pengs instanceof Array) seat.pengs = sd.pengs;
                if(sd.pengTiles instanceof Array) seat.pengTiles = sd.pengTiles; //碰组真实组成(含财神)
                if(sd.chis instanceof Array) seat.chis = sd.chis;
                if(sd.angangs instanceof Array) seat.angangs = sd.angangs;
                if(sd.diangangs instanceof Array) seat.diangangs = sd.diangangs;
                if(sd.wangangs instanceof Array) seat.wangangs = sd.wangangs;
                if(sd.folds instanceof Array) seat.folds = sd.folds;
                if(sd.hua instanceof Array) seat.hua = sd.hua; //漳浦:花牌数组
                if(sd.youjin != null) seat.youjinLevel = sd.youjin; //漳浦:游金等级
                self.initSeatData(seat);
                seat.ready = false;
                seat.hued = false;
            }
            // 重进房间: 原样呈现服务端状态, 不自动做任何操作(不自动mopai/不自动弹窗)
            // 服务端已补发: game_caishen_plans_push(选财神中)、game_action_push(有操作选项)
            self.selectingCaishen = !!data.selectingCaishen;
            // 选财神方案直接在game_start_push里带过来, 不依赖game_caishen_plans_push时序
            if(data.plans && data.plans.length > 0){
                self.waitCaishenPlans = data.plans;
            }
            self.dispatchEvent('game_start');
        });

        // 摸牌：holds 直接覆盖（自己为数组，对手为数量）
        cc.vv.net.addHandler("game_mopai_push",function(data){
            console.log('game_mopai_push');
            var seat = self.seats[data.si];
            if(seat == null) return;
            self.applyPushHolds(seat,data.holds);
            self.numOfMJ = data.numofmj;
            self.turn = data.si;
            self.dispatchEvent('mj_count'); //刷新"剩余X张"显示
            self.dispatchEvent('game_mopai',{seatIndex:data.si,pai:data.pai});
        });

        // 出牌广播：{si,pai}
        cc.vv.net.addHandler("game_chupai_push",function(data){
            console.log('game_chupai_push');
            self.doTurnChange(data.si);
        });

        // 出牌数据通知：{userId,pai,holds} 出牌者收到完整手牌
        cc.vv.net.addHandler("game_chupai_notify_push",function(data){
            var si = self.getSeatIndexByID(data.userId);
            if(si < 0) return;
            var seatData = self.seats[si];
            self.applyPushHolds(seatData,data.holds);
            self.chupai = data.pai;
            if(seatData.folds == null) seatData.folds = [];
            seatData.folds.push(data.pai);
            self.dispatchEvent('game_chupai_notify',{seatData:seatData,pai:data.pai});
        });

        // 碰：{si,pai,holds}
        cc.vv.net.addHandler("game_peng_push",function(data){
            console.log('game_peng_push',JSON.stringify(data));
            var seatData = self.seats[data.si];
            if(seatData == null) return;
            // 从出牌者弃牌堆移除被碰的牌
            self.removeFoldOfTurn(data.pai);
            //服务端对本座位下发完整holds数组,对其他座位只下发数量(number)。
            //仅当是数组时才覆盖,避免把对手座位的holds写成数字导致后续按数组处理时错乱。
            self.applyPushHolds(seatData,data.holds);
            if(seatData.pengs == null) seatData.pengs = [];
            seatData.pengs.push(data.pai);
            if(data.pengTiles instanceof Array) seatData.pengTiles = data.pengTiles; //服务端下发的碰组真实组成(含财神)
            self.turn = data.si;
            console.log('[game_peng_push] seatIndex=',self.seatIndex,'updated holds=',seatData.holds ? (typeof seatData.holds === 'object' ? seatData.holds.length : seatData.holds) : 'null');
            self.dispatchEvent('peng_notify',seatData);
        });

        // 杠：{si,pai,holds,gangtype} gangtype: an/ming/wan
        cc.vv.net.addHandler("game_gang_push",function(data){
            console.log('game_gang_push');
            var seatData = self.seats[data.si];
            if(seatData == null) return;
            self.applyPushHolds(seatData,data.holds);
            if(data.pengs instanceof Array) seatData.pengs = data.pengs; //服务端权威数据(弯杠已移除对应碰组)
            if(data.pengTiles instanceof Array) seatData.pengTiles = data.pengTiles;
            if(seatData.pengs == null) seatData.pengs = [];
            if(seatData.angangs == null) seatData.angangs = [];
            if(seatData.diangangs == null) seatData.diangangs = [];
            if(seatData.wangangs == null) seatData.wangangs = [];
            var gangtype = data.gangtype || "";
            if(gangtype == "wan"){
                // 补杠：从碰牌移到弯杠
                var idx = seatData.pengs.indexOf(data.pai);
                if(idx != -1) seatData.pengs.splice(idx,1);
                seatData.wangangs.push(data.pai);
            }
            else if(gangtype == "ming"){
                // 点杠：从出牌者弃牌堆移除被杠的牌
                self.removeFoldOfTurn(data.pai);
                seatData.diangangs.push(data.pai);
            }
            else{
                seatData.angangs.push(data.pai);
            }
            self.turn = data.si;
            self.dispatchEvent('gang_notify',{seatData:seatData,gangtype:gangtype == "wan" ? "wangang" : (gangtype == "ming" ? "diangang" : "angang"),pai:data.pai});
        });

        // 吃：{si,pais,holds}
        cc.vv.net.addHandler("game_chi_push",function(data){
            console.log('game_chi_push');
            var seatData = self.seats[data.si];
            if(seatData == null) return;
            // 从出牌者弃牌堆移除被吃的牌
            self.removeFoldOfTurn(self.chupai);
            self.applyPushHolds(seatData,data.holds);
            if(seatData.chis == null) seatData.chis = [];
            var pais = data.pais.slice().sort(function(a,b){return a-b;});
            seatData.chis.push(pais);
            self.turn = data.si;
            self.dispatchEvent('chi_notify',seatData);
        });

        // 操作选项：{pai,hu,peng,gang,chi,gangpai,chipai} 或空（隐藏）
        cc.vv.net.addHandler("game_action_push",function(data){
            self.curaction = data;
            console.log(data);
            self.dispatchEvent('game_action',data);
        });

        // 胡牌：{si,pai,zimo,tai,score}
        cc.vv.net.addHandler("game_hu_push",function(data){
            console.log('game_hu_push');
            self.dispatchEvent('hupai',data);
        });

        // 漳浦：补花 {si,pai,hua,numofmj}
        cc.vv.net.addHandler("game_hua_push",function(data){
            console.log('game_hua_push');
            var seat = self.seats[data.si];
            if(seat){
                if(data.hua instanceof Array) seat.hua = data.hua;
            }
            if(data.numofmj != null){
                self.numOfMJ = data.numofmj;
                self.dispatchEvent('mj_count');
            }
            self.dispatchEvent('game_hua',data);
        });

        // 漳浦：游金等级 {si,level}
        cc.vv.net.addHandler("game_youjin_push",function(data){
            console.log('game_youjin_push');
            var seat = self.seats[data.si];
            if(seat) seat.youjinLevel = data.level || 0;
            self.dispatchEvent('game_youjin',data);
        });

        // 漳浦：分饼通知(仅4人) {si,score}
        cc.vv.net.addHandler("game_fenbing_push",function(data){
            console.log('game_fenbing_push');
            self.dispatchEvent('game_fenbing',data);
        });

        // 包麻将：叫台选择（轮到自己）
        cc.vv.net.addHandler("bao_select_push",function(data){
            console.log('bao_select_push');
            self.waitBaoData = data; //缓存:场景未就绪时本事件会被丢弃,场景onLoad据此补发
            self.dispatchEvent('bao_select',data);
        });

        // 包麻将：叫台轮转通知
        cc.vv.net.addHandler("bao_turn_push",function(data){
            console.log('bao_turn_push');
            self.dispatchEvent('bao_turn',data);
        });

        // 包麻将：叫台/定财神结果
        cc.vv.net.addHandler("bao_result_push",function(data){
            console.log('bao_result_push', JSON.stringify(data));
            self.waitBaoData = null; //叫台结束,清除叫台缓存
            if(self.conf == null) self.conf = {};
            self.conf.baoMode = data.baoMode;
            // 只有定完财神的 bao_result 才带 caishen, 才清 waitCaishenMode
            if(data.caishen != null && data.caishen >= 0){
                self.conf.caishen = data.caishen;
                self.conf.caishen2 = data.caishen2;
                self.conf.fanPai = data.fanPai;
                self.conf.baoDone = true;
                self.waitCaishenMode = null; // 定财神完成, 清除等待状态
            }
            if(data.numofmj != null) self.numOfMJ = data.numofmj;
            self.dispatchEvent('bao_result',data);
        });

        // 包麻将：等待包家选定财神(缓存状态:重进房间时本消息在场景加载前到达,事件会被丢弃,
        // 场景onLoad据此状态补发caishen_select事件,保证重进后仍能定财神)
        cc.vv.net.addHandler("caishen_select_push",function(data){
            console.log('caishen_select_push');
            self.waitCaishenMode = (data && data.mode != null) ? data.mode : 1;
            self.dispatchEvent('caishen_select',data);
        });

        cc.vv.net.addHandler("game_caishen_plans_push",function(data){
            console.log('game_caishen_plans_push', JSON.stringify(data));
            if(!data || !data.plans){
                self.waitCaishenPlans = null;
                self.dispatchEvent('game_caishen_plans',{plans:[]});
                return;
            }
            self.waitCaishenPlans = data.plans;
            self.dispatchEvent('game_caishen_plans',{plans:data.plans});
        });

        // ===== 关牌(扑克) 推送桥接 =====
        function onGpStartData(data){
            self.gamestate = "begin";
            self.gpMyCards = (data && data.myCards ? data.myCards : []).slice();
            self.gpMySeat = (data && data.mySeat != null) ? data.mySeat : self.seatIndex;
            self.gpTurn = data ? (data.startSeat != null ? data.startSeat : data.turn) : 0;
            self.gpFreePlay = data ? !!data.freePlay : true;
            self.gpLastPlay = (data && data.lastPlay) ? data.lastPlay : null;
            self.gpSeats = data ? data.seats : null;
            self.gpTurnDeadline = data ? data.turnDeadline : 0;
            self.waitGpStart = data;
            self.dispatchEvent('gp_start', data);
        }
        cc.vv.net.addHandler("gp_start_push",function(data){
            console.log('gp_start_push', data ? JSON.stringify(data.myCards) : '');
            onGpStartData(data);
        });
        // 重连补发, 事件同名(GPGame 走同一条恢复流程)
        cc.vv.net.addHandler("gp_resend_push",function(data){
            console.log('gp_resend_push', data ? JSON.stringify(data.myCards) : '');
            onGpStartData(data);
        });
        cc.vv.net.addHandler("gp_chupai_push",function(data){
            if(!data) return;
            console.log('gp_chupai_push seat=', data.seatIndex);
            if(data.seatIndex == self.gpMySeat && self.gpMyCards){
                var rest = self.gpMyCards.slice();
                (data.pais || []).forEach(function(p){
                    var ix = rest.indexOf(p);
                    if(ix >= 0) rest.splice(ix, 1);
                });
                self.gpMyCards = rest;
            }
            if(data.seats) self.gpSeats = data.seats;
            self.gpFreePlay = false;
            self.gpLastPlay = {
                seatIndex: data.seatIndex, type: data.type, key: data.key,
                len: data.len, bombLevel: data.bombLevel || 0, pais: (data.pais || []).slice()
            };
            self.dispatchEvent('gp_chupai', data);
        });
        cc.vv.net.addHandler("gp_turn_push",function(data){
            if(!data) return;
            console.log('gp_turn_push turn=', data.turn);
            self.gpTurn = data.turn;
            self.gpFreePlay = !!data.freePlay;
            self.gpLastPlay = data.lastPlay || null;
            if(data.seats) self.gpSeats = data.seats;
            self.gpTurnDeadline = data.turnDeadline;
            self.dispatchEvent('gp_turn', data);
        });
        cc.vv.net.addHandler("gp_pass_push",function(data){
            if(!data) return;
            console.log('gp_pass_push seat=', data.seatIndex);
            self.dispatchEvent('gp_pass', data);
        });
        cc.vv.net.addHandler("gp_newround_push",function(data){
            if(!data) return;
            console.log('gp_newround_push turn=', data.turn);
            self.gpTurn = data.turn;
            self.gpTurnDeadline = data.turnDeadline;
            self.gpFreePlay = true;
            self.gpLastPlay = null;
            self.dispatchEvent('gp_newround', data);
        });
        cc.vv.net.addHandler("gp_error_push",function(data){
            console.log('gp_error_push', data && data.msg);
            self.dispatchEvent('gp_error', data);
        });

        // ============ 宝宝(6张) 事件桥接 ============
        function onBbStartData(data){
            self.gamestate = "begin";
            self.bbMyCards = (data && data.myCards ? data.myCards : []).slice();
            self.bbMySeat = (data && data.mySeat != null) ? data.mySeat : self.seatIndex;
            self.bbWatching = !!(data && (data.watching || data.mySeat < 0));   // 本局未参与: 观战模式, 不弹任何阶段弹窗
            self.bbReveal = (data && data.reveal) ? data.reveal : null;          // 观战/重连补发的已亮牌数据
            self.bbSeats = data ? data.seats : null;
            self.bbBankerSeat = data ? data.bankerSeat : 0;
            self.bbBankerMode = data ? !!data.bankerMode : true;
            self.bbGameType = data ? data.gameType : null;
            self.bbPhase = data ? data.phase : null;
            self.bbArrangeDeadline = data ? (data.arrangeDeadline || 0) : 0;
            self.bbConfirmDeadline = data ? (data.confirmDeadline || 0) : 0;
            self.bbConfirmed = data ? !!data.confirmed : false;
            self.bbMyMian = data && data.myMian ? data.myMian : null;
            self.bbMyDaos = data && data.myDaos ? data.myDaos : null;
            self.bbArranged = data ? !!data.arranged : false;
            self.dispatchEvent('bb_start', data);
        }
        cc.vv.net.addHandler("bb_start_push",function(data){
            console.log('bb_start_push', data ? JSON.stringify(data.myCards) : '');
            onBbStartData(data);
        });
        // 重连补发: 标记 resend, 客户端跳过发牌动画并按当前阶段恢复
        cc.vv.net.addHandler("bb_resend_push",function(data){
            console.log('bb_resend_push', data ? JSON.stringify(data.myCards) : '');
            if(data) data.resend = true;
            onBbStartData(data);
        });
        // 亮牌(免摆直接亮/手摆全部摆完亮)
        cc.vv.net.addHandler("bb_reveal_push",function(data){
            console.log('bb_reveal_push');
            self.dispatchEvent('bb_reveal', data);
        });
        // 本局进行中点开始: 排队等下一局
        cc.vv.net.addHandler("bb_wait_next_push",function(data){
            console.log('bb_wait_next_push');
            self.dispatchEvent('bb_wait_next', data || {});
        });
        // 手摆开始摆牌(带截止时间)
        cc.vv.net.addHandler("bb_arrange_start_push",function(data){
            console.log('bb_arrange_start_push deadline=', data && data.deadline);
            if(data) self.bbArrangeDeadline = data.deadline || 0;
            self.dispatchEvent('bb_arrange_start', data);
        });
        // 某家摆好
        cc.vv.net.addHandler("bb_arrange_ok_push",function(data){
            self.dispatchEvent('bb_arrange_ok', data);
        });
        // 摆牌错误
        cc.vv.net.addHandler("bb_error_push",function(data){
            console.log('bb_error_push', data && data.msg);
            self.dispatchEvent('bb_error', data);
        });
        // 免摆: 发牌后确认弹窗开始(带截止时间)
        cc.vv.net.addHandler("bb_confirm_start_push",function(data){
            console.log('bb_confirm_start_push deadline=', data && data.deadline);
            if(data) self.bbConfirmDeadline = data.deadline || 0;
            self.dispatchEvent('bb_confirm_start', data);
        });
        // 免摆: 某家已确认
        cc.vv.net.addHandler("bb_confirm_ok_push",function(data){
            self.dispatchEvent('bb_confirm_ok', data);
        });
        // 单局结算后: 某家点了准备
        cc.vv.net.addHandler("bb_continue_ok_push",function(data){
            self.dispatchEvent('bb_continue_ok', data);
        });
        // 宝宝豆不足被请出房间
        cc.vv.net.addHandler("bb_kicked_push",function(data){
            console.log('bb_kicked_push', data && data.msg);
            self.dispatchEvent('bb_kicked', data);
        });

        // ============ 十三水 事件桥接 ============
        function onSssStartData(data){
            self.gamestate = "begin";
            self.sssStart = data;
            self.sssMyCards = (data && data.myCards ? data.myCards : []).slice();
            self.sssMySeat = (data && data.mySeat != null) ? data.mySeat : self.seatIndex;
            self.sssSeats = (data && data.seats) ? data.seats : null;
            self.sssArrangeDeadline = data ? (data.arrangeDeadline || 0) : 0;
            self.sssConfirmed = {};
            if(data && data.seats){
                for(var i = 0; i < data.seats.length; ++i){
                    if(data.seats[i] && data.seats[i].confirmed){ self.sssConfirmed[data.seats[i].userid] = true; }
                }
            }
            self.dispatchEvent('sss_start', data);
        }
        cc.vv.net.addHandler("sss_start_push",function(data){
            console.log('sss_start_push', data ? JSON.stringify(data.myCards) : '');
            onSssStartData(data);
        });
        // 自己摆牌成功(含自动摆牌)
        cc.vv.net.addHandler("sss_arrange_ok_push",function(data){
            console.log('sss_arrange_ok_push');
            self.sssArrange = data;
            self.dispatchEvent('sss_arrange_ok', data);
        });
        // 某家已确定摆牌
        cc.vv.net.addHandler("sss_ready_push",function(data){
            if(data && data.userid != null){
                if(self.sssConfirmed == null) self.sssConfirmed = {};
                self.sssConfirmed[data.userid] = true;
            }
            self.dispatchEvent('sss_ready', data);
        });
        // 摆牌非法
        cc.vv.net.addHandler("sss_error_push",function(data){
            console.log('sss_error_push', data && data.msg);
            self.dispatchEvent('sss_error', data);
        });
        // 比牌结果明细(结算弹窗以 game_over_push 为准,这里只做亮牌/道型展示)
        cc.vv.net.addHandler("sss_result_push",function(data){
            console.log('sss_result_push');
            self.sssResult = data;
            self.dispatchEvent('sss_result', data);
        });

        cc.vv.net.addHandler("game_begin_push",function(data){
            console.log('game_begin_push');
            self.button = data;
            self.turn = self.button;
            self.gamestate = "begin";
            self.dispatchEvent('game_begin');
        });

        cc.vv.net.addHandler("game_num_push",function(data){
            self.numOfGames = data;
            self.dispatchEvent('game_num',data);
        });

        cc.vv.net.addHandler("game_over_push",function(data){
            console.log('game_over_push');
            //结算数据携带本局财神:单局结算弹窗用牌图展示(包麻将无财模式为-1)
            if(self.conf == null) self.conf = {};
            if(data.caishen != null){ self.conf.caishen = data.caishen; }
            if(data.caishen2 != null){ self.conf.caishen2 = data.caishen2; }
            var results = data.results;
            for(var i = 0; i < self.seats.length; ++i){
                var seat = self.seats[i];
                if(results && results[i]){
                    var r = results[i];
                    seat.score = r.totalscore;
                    // 结算展示：完整手牌与副露
                    seat.holds = r.holds || [];
                    seat.pengs = r.pengs || [];
                    seat.chis = r.chis || [];
                    seat.folds = r.folds || [];
                    seat.angangs = r.angangs || [];
                    seat.diangangs = r.diangangs || [];
                    seat.wangangs = r.wangangs || [];
                    seat.hued = false;
                    if(r.huinfo){
                        for(var h = 0; h < r.huinfo.length; ++h){
                            if(r.huinfo[h].ishupai) seat.hued = true;
                        }
                    }
                }
                else{
                    seat.score = 0;
                }
            }
            self.bbResultDeadline = data.resultDeadline || 0;
            self.bbResultTimeout = data.resultTimeout || 0;
            //宝宝牌结算明细(每场/每道 a,b,winner,score): 结算弹窗按明细只显示与本人相关的输赢
            self.bbOverDetails = data.details || null;
            //先缓存本次结算数据(含整场 endinfo), 再派发 game_over: 
            //宝宝结算面板要靠 overData.endinfo 判定"整场最后一局", 否则会误显示洗牌按钮/直接弹总结算
            self.overData = data;
            //本轮小局结算待关闭:整场结算面板必须等小局结算弹窗关闭后再显示
            self.roundSettleAwait = true;
            self.dispatchEvent('game_over',results);
            //缓存最近一次结算数据:结算停留期断线/刷新重进时,服务端补发的game_over_push
            //会先于游戏场景加载到达,弹窗组件尚未注册监听会错过,场景就绪后由login_finished重放
            if(data.endinfo){
                self.isOver = true;
                // endinfo=统计次数, roundHistory=每局分数明细(整场结算面板展示)
                self.dispatchEvent('game_end',{endinfo:data.endinfo, roundHistory:data.roundHistory || null});
            }
            self.reset();
            for(var i = 0; i < self.seats.length; ++i){
                self.dispatchEvent('user_state_changed',self.seats[i]);
            }
        });

        // ===== 通用 =====

        cc.vv.net.addHandler("chat_push",function(data){
            self.dispatchEvent("chat_push",data);
        });

        cc.vv.net.addHandler("quick_chat_push",function(data){
            self.dispatchEvent("quick_chat_push",data);
        });

        cc.vv.net.addHandler("emoji_push",function(data){
            self.dispatchEvent("emoji_push",data);
        });

        //洗牌/表情扣豆后, 服务端把最新宝宝豆推到座位, 让房间里立刻看到分数变化
        cc.vv.net.addHandler("bb_gems_push",function(data){
            if(!data || data.userid == null) return;
            var seat = self.getSeatByID(data.userid);
            if(seat == null) return;
            if(data.score != null) seat.score = data.score;
            self.dispatchEvent("user_state_changed",seat);
        });

        cc.vv.net.addHandler("dissolve_notice_push",function(data){
            console.log("dissolve_notice_push");
            self.dissoveData = data;
            self.dispatchEvent("dissolve_notice",data);
        });

        cc.vv.net.addHandler("dissolve_cancel_push",function(data){
            self.dissoveData = null;
            self.dispatchEvent("dissolve_cancel",data);
        });

        cc.vv.net.addHandler("voice_msg_push",function(data){
            self.dispatchEvent("voice_msg",data);
        });
    },

    //从当前出牌方（turn）的弃牌堆移除一张被吃/碰/杠用掉的牌
    removeFoldOfTurn:function(pai){
        if(this.turn < 0 || this.seats == null) return;
        var discarder = this.seats[this.turn];
        if(discarder && discarder.folds){
            var fi = discarder.folds.lastIndexOf(pai);
            if(fi != -1) discarder.folds.splice(fi,1);
        }
    },

    doTurnChange:function(si){
        var data = {
            last:this.turn,
            turn:si,
        }
        this.turn = si;
        this.dispatchEvent('game_chupai',data);
    },

    //连接服务器 请求
    connectGameServer:function(data){
        this.dissoveData = null;
        //进房间前记下来源场景与俱乐部id:退出时按来源页返回(从俱乐部进桌回俱乐部详情,大厅进桌回大厅)
        var _bs = cc.director.getScene ? cc.director.getScene() : null;
        //断线重连时当前场景可能是 hall/loading:若已有俱乐部来源标记,保持俱乐部来源不被覆盖
        if(cc.vv.fromClub || cc.vv.fromClubId){
            this.roomBackScene = "club";
        }else{
            this.roomBackScene = (_bs && _bs.name) ? _bs.name : "";
        }
        this.roomBackClubId = cc.vv.fromClubId || this.roomBackClubId || null;
        cc.vv.net.ip = (window.__rewriteHost ? window.__rewriteHost(data.ip) : data.ip) + ":" + data.port;
        console.log(cc.vv.net.ip);
        var self = this;

        var onConnectOK = function(){
            console.log("onConnectOK");
            var sd = {
                token:data.token,
                roomid:data.roomid,
                time:data.time,
                sign:data.sign,
            };
            cc.vv.net.send("login",sd);
        };

        var onConnectFailed = function(){
            console.log("failed.");
            //连接游戏服失败:直接用等待遮罩显示原因,不使用恒为undefined的cc.vv.alert
            cc.vv.wc.showError("连接游戏服失败(" + cc.vv.net.ip + "),请确认游戏服已启动");
        };
        cc.vv.wc.show("正在进入房间");
        console.log("[进入房间]连接游戏服 " + cc.vv.net.ip);
        //登录超时检测:8秒无回应则提示,避免永久卡在等待弹窗
        var self2 = this;
        this._loginTimer = setTimeout(function(){
            self2._loginTimer = null;
            cc.vv.wc.showError("进入房间超时(" + cc.vv.net.ip + "),请重试");
        },8000);
        try{
            cc.vv.net.connect(onConnectOK,onConnectFailed);
        }catch(e){
            console.log("[进入房间]连接初始化异常:" + (e && e.message));
            if(this._loginTimer){ clearTimeout(this._loginTimer); this._loginTimer = null; }
            cc.vv.wc.showError("连接初始化失败:" + (e && e.message));
        }
    }
});
