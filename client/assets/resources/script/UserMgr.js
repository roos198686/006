cc.Class({
    extends: cc.Component,
    properties: {
        account:null,  //账户
	    userId:null,   //userid
		userName:null,  //用户名字
		lv:0,          //等级
		exp:0,       //经验
		coins:0,      //金币
		gems:0,      //房卡
		sign:0,       //标志
        ip:"",      //ip
        sex:0,     //性别
        roomData:null,  //房间数据
        
        oldRoomId:null, //已创房间号
    },
    
    //游客访问 游客注册
    guestAuth:function(){
        //赋初值
        var account = cc.args["account"];
        //判断是否为空
        if(account == null){
            //根据id从本地储存获取
            account = cc.sys.localStorage.getItem("account");
        }
        //取完数据后还为空，则存
        if(account == null){
            account = Date.now(); //date
            cc.sys.localStorage.setItem("account",account); //设置本地存储 账号为本地时间
        }
        //请求参数 account ,ip(可省略)
        ///guest只在账号服:登录后再回登录页时HTTP.url已是大厅服,必须显式指定master_url,否则请求打到9101失败
        cc.vv.http.sendRequest("/guest",{account:account},this.onAuth,cc.vv.http.master_url);  //游客请求登入
    },
    

    //接受返回值 ret  服务端ret
    // var ret = {
	// 	errcode:0,
	// 	errmsg:"ok",
	// 	account:account,
	// 	halladdr:hallAddr,
	// 	sign:sign
	// }    
    onAuth:function(ret){
        var self = cc.vv.userMgr;  //取得当前对象
        if(ret.errcode !== 0){   
            console.log(ret.errmsg);  //返回错误信息
        }
        else{
            self.account = ret.account; //账号
            self.sign = ret.sign;   //标志
            cc.vv.http.url = "http://" + (window.__rewriteHost ? window.__rewriteHost(cc.vv.SI.hall) : cc.vv.SI.hall);  //设置URL为取得版本接口时 ret.hall
            self.login();  //获取成功后登陆
        }   
    },
    
    //登录
    login:function(){
        var self = this; 
        //登录方法
        var onLogin = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                if(!ret.userid){
                    //首次登录: 不再跳创角场景, 直接用默认昵称自动建档, 建档成功后重新登录进大厅
                    self.create(self._genDefaultName());
                }
                else{
                    //已经注册过  将信息获取下来
                    console.log(ret);
                    self.account = ret.account;
        			self.userId = ret.userid;
        			self.userName = ret.name;
        			self.lv = ret.lv;
        			self.exp = ret.exp;
        			self.coins = ret.coins;
        			self.gems = ret.gems;
                    self.roomData = ret.roomid;
                    // cc.sys.localStorage.setItem("roomid",ret.roomid); //设置本地存储 账号为本地时间
                    self.sex = ret.sex;
                    self.ip = ret.ip;
        			cc.director.loadScene("hall"); //登录后先到大厅,再由大厅入口进俱乐部
                }
            }
        };
        cc.vv.wc.show("正在登录游戏");  //显示dialog
        //登录请求参数 账户 标志
        cc.vv.http.sendRequest("/login",{account:this.account,sign:this.sign},onLogin);
    },
    
    //生成默认昵称(首次游客登录自动建档用): YB+随机姓氏
    _genDefaultName:function(){
        var names = ["上官","欧阳","东方","端木","独孤","司马","南宫","诸葛","皇甫","宇文","轩辕","子言","雀圣","赌侠","赌圣","稳赢","不输","好运","自摸","有钱","土豪"];
        return "YB" + names[Math.floor(Math.random() * names.length)];
    },

    //创建用户
    create:function(name){
        var self = this;
        var onCreate = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                self.login();
            }
        };
        //信息
        var data = {
            account:this.account,
            sign:this.sign,
            name:name
        };
        cc.vv.http.sendRequest("/create_user",data,onCreate);    
    },
    
    //连接房间
    enterRoom:function(roomId,callback){
        var self = this;
        var onEnter = function(ret){
            if(ret.errcode !== 0){
                if(ret.errcode == -1){
                    setTimeout(function(){
                        self.enterRoom(roomId,callback);
                    },5000);
                }
                else{
                    cc.vv.wc.hide();
                    if(callback != null){
                        callback(ret);
                    }
                }
            }
            else{
                if(callback != null){
                    callback(ret);
                }
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            roomid:roomId
        };
        cc.vv.wc.show("正在进入房间 " + roomId);
        cc.vv.http.sendRequest("/enter_private_room",data,onEnter);
    },
    getHistoryList:function(callback){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                console.log(ret.history);
                if(callback != null){
                    callback(ret.history);
                }
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_history_list",data,onGet);
    },
    getGamesOfRoom:function(uuid,callback){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                console.log(ret.data);
                callback(ret.data);
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            uuid:uuid,
        };
        cc.vv.http.sendRequest("/get_games_of_room",data,onGet);
    },
    
    getDetailOfGame:function(uuid,index,callback){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                console.log(ret.data);
                callback(ret.data);
            }       
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            uuid:uuid,
            index:index,
        };
        cc.vv.http.sendRequest("/get_detail_of_game",data,onGet);
    }
});
