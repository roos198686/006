cc.Class({
    extends: cc.Component,
    properties: {
        account:null,  //账户
	    userId:null,   //userid
		userName:null,  //用户名字
		lv:0,          //等级
		exp:0,       //经验
		coins:0,      //金币
		gems:0,      //房卡(宝宝豆)
		safe_beans:0, //保险柜宝宝豆(不参与游戏)
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
        this._authType = "guest";
        //请求参数 account ,ip(可省略)
        ///guest只在账号服:登录后再回登录页时HTTP.url已是大厅服,必须显式指定master_url,否则请求打到9101失败
        cc.vv.http.sendRequest("/guest",{account:account},this.onAuth,cc.vv.http.master_url);  //游客请求登入
    },

    //账号密码登录:调账号服/auth,返回{account,halladdr,sign},成功后走onAuth进大厅
    pwdAuth:function(account,password){
        if(!account || !password){
            if(cc.vv.wc){ cc.vv.wc.showError("请输入账号和密码"); }
            return;
        }
        this._authType = "pwd";
        cc.vv.http.sendRequest("/auth",{account:account,password:password},this.onAuth,cc.vv.http.master_url);
    },

    //本地是否保存了上次的登录态
    hasSavedSession:function(){
        var acc = cc.sys.localStorage.getItem("login_account");
        var sign = cc.sys.localStorage.getItem("login_sign");
        return !!(acc && sign);
    },

    //用本地保存的登录态自动登录:true=已发起登录,false=没有登录态
    autoLogin:function(onFail){
        if(!this.hasSavedSession()){ return false; }
        this.account = cc.sys.localStorage.getItem("login_account");
        this.sign = cc.sys.localStorage.getItem("login_sign");
        //登录态存在时HTTP.url可能还是账号服,这里切回大厅服(与onAuth一致)
        if(cc.vv.SI && cc.vv.SI.hall){
            cc.vv.http.url = "http://" + (window.__rewriteHost ? window.__rewriteHost(cc.vv.SI.hall) : cc.vv.SI.hall);
        }
        this._autoLoginFail = onFail || null;
        this.login();
        return true;
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
            if(cc.vv.wc){ cc.vv.wc.showError(ret.errmsg || "登录失败"); }
        }
        else{
            self.account = ret.account; //账号
            self.sign = ret.sign;   //标志
            //保存登录态:下次打开APP直接用这里自动登录进大厅
            cc.sys.localStorage.setItem("login_account", self.account);
            cc.sys.localStorage.setItem("login_sign", self.sign == null ? "" : String(self.sign));
            cc.sys.localStorage.setItem("login_type", self._authType || "guest");
            cc.vv.http.url = "http://" + (window.__rewriteHost ? window.__rewriteHost(cc.vv.SI.hall) : cc.vv.SI.hall);  //设置URL为取得版本接口时 ret.hall
            self.login();  //获取成功后登陆
        }   
    },
    
    //WaitingConnection节点在场景里默认隐藏,组件onLoad不执行,cc.vv.wc可能未绑定;先激活一次让其onLoad完成绑定(内部会按_isShow立即隐藏)
    _ensureWc:function(){
        if(!cc.vv.wc || !cc.isValid(cc.vv.wc.node)){
            var wcn = cc.find("Canvas/WaitingConnection");
            if(wcn){ wcn.active = true; }
        }
        return cc.vv.wc;
    },
    //登录
    login:function(){
        var self = this; 
        //登录方法
        var onLogin = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
                //本地登录态失效(账号被删/数据回档):清掉登录态,回到登录按钮
                cc.sys.localStorage.removeItem("login_account");
                cc.sys.localStorage.removeItem("login_sign");
                if(cc.vv.wc){ cc.vv.wc.hide(); }
                var f = self._autoLoginFail;
                self._autoLoginFail = null;
                if(f){ f(ret); }
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
                    self._autoLoginFail = null;
        			// 用 SceneMgr 带过渡进大厅,解决白闪/冻结
        			if(cc.vv && cc.vv.sceneMgr){
        			    cc.vv.sceneMgr.load("hall");
        			}else{
        			    cc.director.loadScene("hall");
        			}
                }
            }
        };
        this._ensureWc();
        cc.vv.wc.show("正在登录游戏");  //显示dialog
        //登录请求参数 账户 标志
        cc.vv.http.sendRequest("/login",{account:this.account,sign:this.sign},onLogin);
    },
    
    //生成默认昵称(首次游客登录自动建档用): 复姓+双字名, 固定四个汉字, 看起来像正常人名
    _genDefaultName:function(){
        var xing = ["欧阳","上官","诸葛","宇文","司马","南宫","慕容","皇甫","端木","独孤","轩辕","东方","夏侯","长孙","令狐","司徒"];
        var ming = ["子墨","清和","知远","嘉言","景行","若溪","书言","思远","亦辰","星野","明轩","修文","语嫣","安然","星河","沐阳","若尘","文昊","念安","雨辰"];
        return xing[Math.floor(Math.random() * xing.length)] + ming[Math.floor(Math.random() * ming.length)];
    },

    //生成默认头像(首次建档随机取一个内置头像 avatar_01~avatar_18), 不再使用默认占位图
    _genDefaultAvatar:function(){
        var n = Math.floor(Math.random() * 18) + 1;
        return "avatar_" + (n < 10 ? "0" + n : n);
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
            name:name,
            headimg:this._genDefaultAvatar()
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
        this._ensureWc();
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
