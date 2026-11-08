var Net = require("Net")  //长连接socket
var Global = require("Global")  //mj所需方法

//创建房间弹窗里展示的玩法简介(与 HallHelp 的玩法说明保持一致,按 game_type 取)
var GAME_INTROS = {
    baobao_mian: "6张免摆宝宝(最多6人)。每人发6张牌,系统自动遍历所有拆分,选出最大的一副牌型亮牌。\n" +
        "· 牌型从大到小:6同花顺 > 5同花顺带1 > 4条带2单 > 3条带3条 > 3条带对带1 > 6同花 > 6连顺 > 5同花带1 > 5连顺带1 > 3对 > 3组9 > 散牌。\n" +
        "· 花色优先级:黑桃 > 红桃 > 梅花 > 方片。A在长顺里算最小(A23456的A当1)。\n" +
        "· 有庄时闲家只与庄家比;无庄时六家两两互比(后台开关)。\n" +
        "· 各牌型倍率由管理后台设置。",
    baobao_shou: "6张手动摆宝宝(最多6人)。每人发6张牌,自己摆成前2/中2/后2三道。\n" +
        "· 单道规则:对子为宝,宝>散点(两牌相加取个位,9最大0最小);宝排序 宝A>宝K/Q/J>宝10~2。\n" +
        "· 强制 前道≤中道≤后道,摆错为乌龙,三道全输(后台可关校验)。\n" +
        "· 三道独立结算,每道按赢家道型倍率:宝A=10倍,宝K/Q/J=6倍,宝10~2=5倍,9点=4倍,8点=3倍,7点=2倍,6~0点=1倍(后台可配)。\n" +
        "· 有庄时闲家只与庄家比;无庄时六家两两互比(后台开关)。"
};

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        createRoomWin:cc.Node,//创建房间
        settingsWin:cc.Node, //设置
        helpWin:cc.Node, //帮助
        xiaoxiWin:cc.Node,//消息
        zhanjiWin:cc.Node,//战绩
        btnJoinGame:cc.Node, //加入游戏
        btnReturnGame:cc.Node,//返回游戏
        joinGameWin:cc.Node,//加入房间
        notice:{
            default:null,
            type:cc.Label
        },
        lblName:cc.Label,
        lblMoney:cc.Label,
        lblGems:cc.Label,
      
    },
    //获取该this
    initNetHandlers:function(){
        var self = this;
    },
    
    // use this for initialization
    onLoad: function () {
        //回到大厅即离开俱乐部上下文:清掉来源俱乐部标记,下次从大厅进俱乐部时显示俱乐部主页而非旧详情页
        if(cc.vv){
            cc.vv.fromClub = false;
            cc.vv.fromClubId = null;
            //游戏服记录的返回来源一并清掉:留旧值会让无房断线兜底把人又带回俱乐部页
            if(cc.vv.gameNetMgr){
                cc.vv.gameNetMgr.roomBackScene = "";
                cc.vv.gameNetMgr.roomBackClubId = null;
            }
        }
        var cvs = this.node.getComponent(cc.Canvas);
        cvs.fitHeight = true;
        cvs.fitWidth = false;
        // 所有平台（浏览器预览 / Android 模拟器 / 真机）都把大厅背景拉伸铺满
        // 旧逻辑只在非原生平台执行(if(!cc.sys.isNative))，导致模拟器里背景位置不对
        var globalNode = this.node.getChildByName("global");
        var mainNode = globalNode ? globalNode.getChildByName("main") : null;
        var hallBg = mainNode ? mainNode.getChildByName("bg") : this.node.getChildByName("bg");
        var userNode = mainNode ? mainNode.getChildByName("user") : null;
        var userBar = userNode ? userNode.getChildByName("用户栏-底") : null; //顶部用户区横条
        //子元素位置以场景为准,按"左缘"定位:首次执行时采集各子元素左缘相对横条左缘的偏移,
        //运行时按左缘平移(宽屏保持固定左边距)。文字标签(昵称/房卡数)变长时只向右伸展,
        //不会被头像/底框盖住,也不再在代码里硬编码任何坐标
        var childOffsets = null;
        if(hallBg){
            var resizeHallBg = function(){
                if(!cc.isValid(hallBg)){ return; }
                //首次执行时按场景原始坐标采集偏移(必须在改动横条/子元素坐标之前,场景里摆什么位置运行时就保持什么相对位置)
                if(childOffsets == null && cc.isValid(userBar) && userNode){
                    var left0 = userBar.x - userBar.width * userBar.anchorX; //场景中横条左缘
                    childOffsets = {};
                    for(var j = 0; j < userNode.children.length; j++){
                        var c0 = userNode.children[j];
                        if(c0 === userBar){ continue; }
                        childOffsets[c0.name] = (c0.x - c0.width * c0.anchorX) - left0; //左缘偏移
                    }
                }
                var w = hallBg.getComponent(cc.Widget);
                if(w){ w.enabled = false; } //关闭残留对齐组件，防止把背景钉在画布边缘
                var vs = cc.view.getVisibleSize(); var vo = cc.view.getVisibleOrigin(); //实际可见区域尺寸(含黑边外区域)
                hallBg.setContentSize(vs.width, vs.height);
                hallBg.setPosition(hallBg.parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width/2, vo.y + vs.height/2))); //世界中心=可见区中心，父链位置不影响
                if(cc.isValid(userBar)){ //顶部用户区横条:X方向铺满,Y保持贴顶(坐标换算已包含父容器位移)
                    var w2 = userBar.getComponent(cc.Widget);
                    if(w2){ w2.enabled = false; }
                    userBar.setContentSize(vs.width, userBar.height);
                    var lp2 = userBar.parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width/2, 0));
                    userBar.setPosition(lp2.x, userBar.y);
                    //横条左缘在user容器坐标系中的X,子元素按 左缘偏移 定位:文字变长只向右伸,不会被头像盖住
                    var barLeft = userBar.x - userBar.width * userBar.anchorX;
                    for(var i = 0; i < userNode.children.length; i++){
                        var ch = userNode.children[i];
                        if(ch === userBar){ continue; }
                        var off = childOffsets[ch.name];
                        if(off == null){ continue; }
                        var wg = ch.getComponent(cc.Widget);
                        if(wg){ wg.enabled = false; } //关掉Label上残留的对齐Widget,防止运行时改坐标造成堆叠
                        ch.x = barLeft + off + ch.width * ch.anchorX;
                    }
                }
            };
            resizeHallBg();
            this.scheduleOnce(resizeHallBg, 0); //延迟一帧重算，避免onLoad时父链矩阵未就位导致定位偏移
            cc.view.setResizeCallback(resizeHallBg);
        }
        if(!cc.vv){
            cc.director.loadScene("login"); // cc.vv 未初始化时跳 login(login 自带初始化)
            return;
        }
        //加载用户信息
        this.initLabels();
         //判断房间id是否为空 显示创建房间和返回房间
         cc.log("roomid",cc.vv.gameNetMgr.roomId);
        if(cc.vv.gameNetMgr.roomId == null){
            if(this.btnJoinGame) this.btnJoinGame.active = true;
            if(this.btnReturnGame) this.btnReturnGame.active = false;
        }
        else{
            if(this.btnJoinGame) this.btnJoinGame.active = false;
            if(this.btnReturnGame) this.btnReturnGame.active = true;
        }
        
        //var params = cc.vv.args;
        //获取到roomid
        var roomId = cc.vv.userMgr.oldRoomId; 
        cc.log("roomold",roomId);
        if( roomId != null){
            //不为空进入房间
            cc.vv.userMgr.oldRoomId = null;
            cc.vv.userMgr.enterRoom(roomId);
        }

    
        
        cc.vv.audioMgr.playBGM("bgMain.mp3");
        //获取设置 帮助 邮件 按钮
        this.initButtonHandler("Canvas/global/main/menu/btn_setting");
        this.initButtonHandler("Canvas/global/main/menu/btn_help");
        this.initButtonHandler("Canvas/global/main/menu/btn_xiaoxi");
        this.initButtonHandler("Canvas/global/main/menu/btn_zhanji");
        //原商城入口改为加入房间入口:与其他菜单按钮走同一绑定机制
        this.initButtonHandler("Canvas/global/main/menu/菜单-商城");
        //分享按钮:复制APP链接,好友点开链接直接拉起/下载APP
        this.initButtonHandler("Canvas/global/main/menu/菜单-分享");
        //用户头像点击:打开个人信息弹窗
        this.initButtonHandler("Canvas/global/main/user/用户栏-默认头像");
        //大厅用户栏头像:加载当前登录用户真实头像(否则一直显示场景默认占位图)
        this.refreshBarAvatar();
        //清理菜单上残留的失效点击事件(分享/反馈等按钮点击会抛 getComponent: Type must be non-nil)
        this.sanitizeEvents(this.node);
        //设置按钮返回事件
        this.helpWin.addComponent("OnBack");
        //玩法介绍弹窗整体等比缩小,上下留出外边距(文字不变形)
        this.helpWin.setScale(0.88);
        this.xiaoxiWin.addComponent("OnBack");
        //战绩面板:列表与录像回放全部由 History 组件控制(房间->局 两级)
        //场景 Canvas 上已有 History 组件(它负责查找 history 节点并认领列表模板),
        //不能再给 history 节点挂第二个实例,否则模板已被第一个实例拿走,新实例列表为空
        if(this.zhanjiWin && this.node.getComponent("History") == null){
            try{
                this.node.addComponent("History");
            }catch(e){
                cc.log("[zhanji] History 组件挂载失败:" + (e && e.message));
            }
        }

        //notice滚动条获取值
        //初始化notice值
        if(!cc.vv.userMgr.notice){
            cc.vv.userMgr.notice = {
                version:null,
                msg:"数据请求中...",
            }
        }
        
        //赋值
        this.notice.string = cc.vv.userMgr.notice.msg;
        
        this.refreshInfo();//刷新房卡信息
        this.refreshNotice();//刷新滚动条信息
        // this.refreshGemsTip(); //刷新房卡信息

        //大厅入口按钮:second=加入房间(打开录入弹窗),clubEntryBtn=创建房间(仅俱乐部创建人,需选玩法)
        this.initClub();
        //登录检测:未绑定账号密码且未绑微信时弹出绑定提示
        this._checkBindOnLogin();
    },
    //刷新房卡信息
    refreshInfo:function(){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                if(ret.gems != null){
                    this.lblGems.string = ret.gems;    //房卡刷新
                }
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_user_status",data,onGet.bind(this));
    },

    //刷新滚动条信息
    refreshNotice:function(){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                cc.vv.userMgr.notice.version = ret.version;
                cc.vv.userMgr.notice.msg = ret.msg;
                this.notice.string = ret.msg;
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            type:"notice",
            version:cc.vv.userMgr.notice.version
        };
        cc.vv.http.sendRequest("/get_message",data,onGet.bind(this));
    },
   
    //通过路径获取按钮并且添加点击事件
    initButtonHandler:function(btnPath){
        var btn = cc.find(btnPath);
        if(btn == null){
            cc.log("[hall] 未找到按钮:" + btnPath);
            return;
        }
        //场景里遗留的点击事件若组件ID为空,点击时会抛 getComponent: Type must be non-nil,
        //并中断同级后续事件,先清理;绑定改用节点触摸监听,不依赖 clickEvents 解析
        this.sanitizeEvents(btn);
        var self = this;
        btn.on(cc.Node.EventType.TOUCH_END, function(){
            if(!cc.isValid(btn)){ return; }
            self.onBtnClicked({target:btn});
        });
    },

    //递归清理节点树上无法解析的点击事件(组件ID/组件名都已失效的旧事件)
    sanitizeEvents:function(node){
        if(node == null){ return; }
        var btns = node.getComponentsInChildren(cc.Button);
        for(var i = 0; i < btns.length; ++i){
            var list = btns[i].clickEvents;
            if(list == null || list.length == 0){ continue; }
            var keep = [];
            for(var k = 0; k < list.length; ++k){
                var h = list[k];
                if(h == null || h.target == null){ continue; }
                if(h._componentId){
                    if(cc.js._getClassById(h._componentId)){ keep.push(h); }
                }
                else if(h.component && cc.js.getClassByName(h.component)){
                    keep.push(h);
                }
            }
            btns[i].clickEvents = keep;
        }
    },
   
    //玩法介绍弹窗:内容区左侧玩法列表 + 右侧玩法说明(逻辑在 HallHelp)
    openHelp:function(){
        if(this.helpWin == null){ return; }
        this.helpWin.active = true;
        var help = this.node.getComponent("HallHelp");
        if(help == null){
            try{
                help = this.node.addComponent("HallHelp");
            }catch(e){
                cc.log("[help] HallHelp 组件挂载失败:" + (e && e.message));
            }
        }
        if(help){ help.open(this.helpWin); }
    },

    //点击事件返回值
    onBtnClicked:function(event){
        cc.log("[hall] click:" + event.target.name);
        if(event.target.name == "btn_setting"){
            this.settingsWin.active = true;
        }   
        else if(event.target.name == "btn_help"){
            this.openHelp();
        }
        else if(event.target.name == "btn_xiaoxi"){
            this.xiaoxiWin.active = true;
        }
        else if(event.target.name == "btn_zhanji"){
            this.openZhanji();
        }
        else if(event.target.name == "菜单-商城"){
            this.onJoinGameClicked(); //商城入口已改为加入房间:打开输入房号弹窗
        }
        else if(event.target.name == "菜单-分享"){
            this.onShareLinkClicked();
        }
        else if(event.target.name == "用户栏-默认头像"){
            this._showUserInfoPanel();
        }
    },

    //分享:复制APP链接到剪贴板,好友点开链接即可拉起/下载APP
    onShareLinkClicked:function(){
        var ok = cc.vv.anysdkMgr && cc.vv.anysdkMgr.copyShareLink ? cc.vv.anysdkMgr.copyShareLink() : false;
        var msg = ok ? "链接已复制，粘贴发送给好友，好友点开链接即可进入游戏" : "链接复制失败，请稍后重试";
        if(cc.vv.wc && cc.vv.wc.showAlert){ cc.vv.wc.showAlert(msg, "分享"); }
        else if(cc.vv.wc && cc.vv.wc.showError){ cc.vv.wc.showError(msg); }
    },

    //==================== 个人信息/绑定账号/修改头像(窗口骨架固化在hall.fire,JS只绑事件/填数据) ====================
    //内置头像池(资源位于 resources/images/avatars/,共18张)
    _avatarPool:function(){
        if(!this._avatarPoolCache){
            this._avatarPoolCache = [];
            for(var i = 1; i <= 18; i++){ this._avatarPoolCache.push("avatar_" + (i < 10 ? "0" + i : i)); }
        }
        return this._avatarPoolCache;
    },

    //场景内用户窗口查找(hall.fire的Canvas直下):userInfoWin/bindWin/avatarWin/bindTipWin
    _userWin:function(name){
        var canvas = cc.find("Canvas");
        var win = canvas ? canvas.getChildByName(name) : null;
        if(win){ this["_" + name] = win; }
        return win;
    },
    //打开场景固化的用户窗口:激活并把提示节点提到最上层(否则错误/成功提示被窗口盖住)
    _userWinOpen:function(name){
        var win = this._userWin(name);
        if(!win){ return null; }
        win.active = true;
        var canvas = cc.find("Canvas");
        var wc = canvas.getChildByName("WaitingConnection");
        if(wc){ wc.setSiblingIndex(canvas.children.length - 1); }
        var al = canvas.getChildByName("alert");
        if(al){ al.setSiblingIndex(canvas.children.length - 1); }
        return win;
    },

    _closeWin:function(name){
        var win = this._userWin(name);
        if(win){ win.active = false; }
    },

    //窗口内递归查找子节点(编辑器里可能分组/换父级,getChildByName只查直接子节点会找不到导致绑定失败)
    _winFind:function(node,name){
        if(!node){ return null; }
        if(node.name === name){ return node; }
        var cs = node.children;
        for(var i = 0; i < cs.length; i++){
            var r = this._winFind(cs[i], name);
            if(r){ return r; }
        }
        return null;
    },

    //给窗口内按钮绑事件(找不到就跳过,不让一个缺失节点毁掉整组绑定)
    _winBind:function(win,name,fn){
        var n = this._winFind(win,name);
        if(n){ n.on(cc.Node.EventType.TOUCH_END,fn); }
    },

    //大厅用户栏头像加载/刷新:清缓存后经ImageLoader重新拉取(换头像后调用)
    refreshBarAvatar:function(){
        var barIcon = cc.find("Canvas/global/main/user/用户栏-默认头像");
        if(!barIcon){ return; }
        if(cc.vv.baseInfoMap){ delete cc.vv.baseInfoMap[cc.vv.userMgr.userId]; }
        var il = barIcon.getComponent("ImageLoader");
        if(il){
            il._spriteFrame = null; //清掉旧帧,否则setupSpriteFrame会先画回旧头像
            il.setUserID(cc.vv.userMgr.userId);
        }
    },

    //加载自己的头像到指定Sprite节点(headimg为内置key或远程URL,无则显示默认head)
    _loadSelfAvatar:function(spriteNode){
        var self = this;
        var setFrame = function(sf){
            if(cc.isValid(spriteNode) && sf){
                var sp = spriteNode.getComponent(cc.Sprite);
                if(sp){ sp.spriteFrame = sf; }
            }
        };
        cc.vv.http.sendRequest("/base_info",{userid:cc.vv.userMgr.userId},function(ret){
            if(!cc.isValid(spriteNode)){ return; }
            if(ret && ret.headimgurl && /^avatar_\d{1,3}$/.test(ret.headimgurl)){
                cc.resources.load("images/avatars/" + ret.headimgurl, cc.SpriteFrame, function(err,sf){ setFrame(sf); });
            }
            else if(ret && ret.headimgurl){
                cc.assetManager.loadRemote(ret.headimgurl + ".jpg", function(err,tex){
                    if(err || !tex){ return; }
                    setFrame(new cc.SpriteFrame(tex, cc.Rect(0,0,tex.width,tex.height)));
                });
            }
            else{
                cc.resources.load("images/other/head", cc.SpriteFrame, function(err,sf){ setFrame(sf); });
            }
        },cc.vv.http.master_url);
    },

    //图一:个人信息(头像+名称/ID/性别/账号+修改头像+修改密码+注销登录),节点全部在场景中
    _showUserInfoPanel:function(){
        var self = this;
        var win = this._userWinOpen("userInfoWin");
        if(!win){ return; }
        var panel = this._winFind(win,"panel") || win;
        if(!win._bound){
            win._bound = true;
            this._winBind(win,"btnClose",function(){ self._closeWin("userInfoWin"); });
            this._winBind(win,"btnChangeAvatar",function(){ self._showAvatarWin(); });
            this._winBind(win,"btnBind",function(){ self._showBindWin(); });
            this._winBind(win,"btnLogout",function(){ self._logout(); });
        }
        //左侧头像
        this._loadSelfAvatar(this._winFind(win,"icon"));
        //右侧信息行(val0=名称 val1=ID val2=性别 val3=账号)
        var sexStr = cc.vv.userMgr.sex == 1 ? "男" : (cc.vv.userMgr.sex == 2 ? "女" : "保密");
        var keys = ["名称","ID","性别","账号"];
        var vals = [cc.vv.userMgr.userName || "", String(cc.vv.userMgr.userId || ""), sexStr, this._bindAccount || "无"];
        this._userInfoValueLabels = {};
        for(var i = 0; i < keys.length; i++){
            var vNode = this._winFind(win,"val" + i);
            var v = vNode ? vNode.getComponent(cc.Label) : null;
            if(v){
                v.string = vals[i];
                this._userInfoValueLabels[keys[i]] = v;
            }
        }
        //打开时拉取最新绑定状态
        this._refreshBindStatus(function(){
            var lbl = self._userInfoValueLabels && self._userInfoValueLabels["账号"];
            if(lbl && cc.isValid(lbl.node)){ lbl.string = self._bindAccount || "无"; }
        });
    },

    //拉取绑定状态并缓存(个人信息页显示"账号"字段用)
    _refreshBindStatus:function(cb){
        var self = this;
        cc.vv.http.sendRequest("/bind_status",{account:cc.vv.userMgr.account,sign:cc.vv.userMgr.sign},function(ret){
            if(ret && ret.errcode === 0){
                self._bindAccount = ret.bound_account;
                self._wxBound = !!ret.wx;
            }
            self._bindStatusLoaded = true;
            if(cb){ cb(); }
        },cc.vv.http.master_url);
    },

    //图二:绑定账号(账号x2+密码x2+保存;已绑定过则为修改密码),节点全部在场景中
    _showBindWin:function(){
        var self = this;
        var win = this._userWinOpen("bindWin");
        if(!win){ return; }
        var panel = this._winFind(win,"panel") || win;
        //每次打开重置输入框状态(密码框/长度限制)
        this._bindInputs = {};
        for(var i = 0; i < 4; i++){
            var n = this._winFind(win,"bindInput" + i);
            var eb = n ? n.getComponent(cc.EditBox) : null;
            if(!eb){ continue; }
            eb.string = "";
            // 场景里这几个输入框的 inputMode 是数字键盘, 会把字母过滤掉; 账号/密码都要字母+数字, 统一改成任意字符
            eb.inputMode = cc.EditBox.InputMode.ANY;
            if(i >= 2){ eb.inputFlag = cc.EditBox.InputFlag.PASSWORD; eb.maxLength = 15; }
            else{ eb.inputFlag = cc.EditBox.InputFlag.DEFAULT; eb.maxLength = 11; }
            this._autoHidePlaceholder(eb);
            this._bindInputs["input" + i] = eb;
        }
        // 已绑定账号时把账号回填到两个账号框: 玩家一眼能看到已绑定的账号, 且服务端已绑定后只允许改密码
        var fillBound = function(acc){
            if(!acc || !cc.isValid(win)){ return; }
            for(var k = 0; k < 2; k++){
                var box = self._bindInputs["input" + k];
                if(box && String(box.string || "") === ""){ box.string = acc; }
            }
        };
        if(this._bindAccount){
            fillBound(this._bindAccount);
        } else if(!this._bindStatusLoaded){
            this._refreshBindStatus(function(){ fillBound(self._bindAccount); });
        }
        if(!win._bound){
            win._bound = true;
            this._winBind(win,"btnClose",function(){ self._closeWin("bindWin"); });
            this._winBind(win,"btnSave",function(){ self._submitBind(); });
        }
    },

    // 输入框点击(获得焦点)即隐藏占位提示, 失焦且没输入内容时再恢复;
    // 场景里这四个输入框自带 placeholderLabel, 引擎只在内容变化时更新, 点一下不会消失
    _autoHidePlaceholder:function(eb){
        if(!eb || eb._phAutoHide || !eb.placeholderLabel || !eb.placeholderLabel.node){ return; }
        eb._phAutoHide = true;
        var phNode = eb.placeholderLabel.node;
        var show = function(v){ if(cc.isValid(phNode)){ phNode.active = v; } };
        eb.node.on('editing-did-began', function(){ show(false); });
        eb.node.on('editing-did-ended', function(){ show((eb.string || "") === ""); });
        eb.node.on('text-changed', function(){ show((eb.string || "") === ""); });
    },

    //提交绑定/修改密码
    _submitBind:function(){
        var self = this;
        var acc = String(this._bindInputs.input0.string || "").trim();
        var acc2 = String(this._bindInputs.input1.string || "").trim();
        var pwd = String(this._bindInputs.input2.string || "").trim();
        var pwd2 = String(this._bindInputs.input3.string || "").trim();
        if(acc === "" || pwd === ""){ cc.vv.wc.showError("请输入账号和密码"); return; }
        if(acc !== acc2){ cc.vv.wc.showError("两次输入的账号不一致"); return; }
        if(pwd !== pwd2){ cc.vv.wc.showError("两次输入的密码不一致"); return; }
        cc.vv.wc.show("正在保存");
        cc.vv.http.sendRequest("/bind_account",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            name:acc,
            password:pwd
        },function(ret){
            if(!ret || ret.errcode !== 0){
                cc.vv.wc.showError((ret && ret.errmsg) ? ret.errmsg : "保存失败");
                return;
            }
            cc.vv.wc.hide();
            self._bindAccount = acc; //更新个人信息页显示
            cc.vv.wc.showAlert(ret.changed ? "密码修改成功" : "绑定成功");
            self._closeWin("bindWin");
            //同步刷新个人信息弹窗的账号字段
            var lbl = self._userInfoValueLabels && self._userInfoValueLabels["账号"];
            if(lbl && cc.isValid(lbl.node)){ lbl.string = acc; }
        },cc.vv.http.master_url);
    },

    //图三:修改头像(grid容器在场景中,12个头像cell为随机内容仍由JS填进grid)
    _showAvatarWin:function(){
        var self = this;
        var win = this._userWinOpen("avatarWin");
        if(!win){ return; }
        var panel = this._winFind(win,"panel") || win;
        this._avatarSel = null;
        this._avatarCells = [];
        this._avatarGridNode = this._winFind(win,"grid");
        if(!win._bound){
            win._bound = true;
            this._winBind(win,"btnClose",function(){ self._closeWin("avatarWin"); });
            this._winBind(win,"btnShuffle",function(){ self._refreshAvatarGrid(true); });
            this._winBind(win,"btnConfirm",function(){ self._submitAvatar(); });
        }
        this._refreshAvatarGrid();
    },

    //渲染头像网格:场景 grid 下只有一个 cellTemplate 节点(尺寸在编辑器里调), JS 克隆出12个 cell
    _refreshAvatarGrid:function(reshuffle){
        var self = this;
        var grid = this._avatarGridNode;
        if(!grid || !cc.isValid(grid)){ return; }
        // 模板节点:优先 cellTemplate, 兼容旧命名(只用来取尺寸和默认头像帧,不再克隆)
        var template = grid.getChildByName("cellTemplate") || grid.getChildByName("cell_0");
        if(!template){
            console.warn("[hall] avatarWin/grid 下缺少 cellTemplate, 使用默认尺寸建头像格");
        }
        // 清掉上一次克隆出来的 cell(保留模板)
        var children = grid.children.slice();
        for(var ci = 0; ci < children.length; ci++){
            if(children[ci] && children[ci] !== template){ children[ci].destroy(); }
        }
        this._avatarCells = [];
        // 随机抽取12个头像key
        var pool = this._avatarPool().slice();
        if(reshuffle || !this._avatarShowKeys){
            for(var i = pool.length - 1; i > 0; i--){
                var j = Math.floor(Math.random() * (i + 1));
                var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
            }
            this._avatarShowKeys = pool.slice(0,12);
        }
        var keys = this._avatarShowKeys;
        // 尺寸/间距全部取自模板节点(编辑器里改模板即可)
        var cellW = template ? template.width : 100;
        var cellH = template ? template.height : 100;
        var gapX = 24;
        var gapY = 24;
        var cols = 6;
        var totalW = cols * cellW + (cols - 1) * gapX;
        var startX = -totalW / 2 + cellW / 2;
        var startY = (cellH + gapY) / 2;
        var tplSp = template ? template.getComponent(cc.Sprite) : null;
        for(var idx = 0; idx < keys.length; idx++){
            (function(key,index){
                // 直接新建头像格,不克隆隐藏模板(避免模板未激活导致克隆体不渲染)
                var cell = new cc.Node("cell_" + index);
                cell.setContentSize(cellW, cellH);
                if(grid.layer !== undefined){ cell.layer = grid.layer; }
                cell.parent = grid;
                cell.setPosition(startX + (index % cols) * (cellW + gapX), startY - Math.floor(index / cols) * (cellH + gapY));
                var sp = cell.addComponent(cc.Sprite);
                sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                // 先把模板上的默认帧放上去,保证资源异常时也有图
                if(tplSp && tplSp.spriteFrame){ sp.spriteFrame = tplSp.spriteFrame; }
                cc.resources.load("images/avatars/" + key, cc.SpriteFrame, function(err,sf){
                    if(cc.isValid(cell) && sf){ sp.spriteFrame = sf; }
                });
                // 选中框: Graphics 必须放子节点,同一节点再加渲染组件会把先加的 Sprite 禁用掉(头像就看不见了)
                var frameN = new cc.Node("selFrame");
                cell.addChild(frameN);
                var frame = frameN.addComponent(cc.Graphics);
                cell._key = key;
                cell._frame = frame;
                cell._cellSize = { w: cellW, h: cellH };
                cell.on(cc.Node.EventType.TOUCH_END,function(){
                    self._avatarSel = key;
                    self._redrawAvatarSel();
                });
                self._avatarCells.push(cell);
            })(keys[idx],idx);
        }
        this._redrawAvatarSel();
    },

    //选中框重绘(尺寸从 cell 自己记录的 size 读, 不再写死 120)
    _redrawAvatarSel:function(){
        var cells = this._avatarCells || [];
        for(var i = 0; i < cells.length; i++){
            var c = cells[i];
            if(!cc.isValid(c)){ continue; }
            var g = c._frame;
            g.clear();
            if(c._key === this._avatarSel){
                var sz = c._cellSize || { w: 120, h: 120 };
                g.lineWidth = 6;
                g.strokeColor = new cc.Color(255,200,60,255);
                g.rect(-sz.w / 2, -sz.h / 2, sz.w, sz.h);
                g.stroke();
            }
        }
    },

    //确定选择:上传服务端并刷新大厅头像显示
    _submitAvatar:function(){
        var self = this;
        if(!this._avatarSel){ cc.vv.wc.showError("请先选择一个头像"); return; }
        cc.vv.wc.show("正在保存");
        cc.vv.http.sendRequest("/set_avatar",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            avatar:this._avatarSel
        },function(ret){
            if(!ret || ret.errcode !== 0){
                cc.vv.wc.showError((ret && ret.errmsg) ? ret.errmsg : "保存失败");
                return;
            }
            cc.vv.wc.hide();
            //刷新大厅顶部用户栏头像(内部已清baseInfo缓存,房间内座位头像下次进房时会重新拉取)
            self.refreshBarAvatar();
            cc.vv.wc.showAlert("头像修改成功");
            self._closeWin("avatarWin");
            //个人信息弹窗还开着的话刷新其头像
            var uw = self._userWin("userInfoWin");
            if(uw && uw.active){
                var icon = self._winFind(uw,"icon");
                if(icon){ self._loadSelfAvatar(icon); }
            }
        },cc.vv.http.master_url);
    },

    //图四:登录绑定检测提示(未绑定账号且未绑微信时弹出),节点全部在场景中
    _showBindTip:function(){
        var self = this;
        var win = this._userWinOpen("bindTipWin");
        if(!win){ return; }
        if(!win._bound){
            win._bound = true;
            this._winBind(win,"btnClose",function(){ self._closeWin("bindTipWin"); });
            this._winBind(win,"btnGoBind",function(){
                self._closeWin("bindTipWin");
                self._showBindWin();
            });
        }
    },

    //登录后检测:用户名密码/微信都未绑定时弹出绑定提示(每次启动只弹一次)
    _checkBindOnLogin:function(){
        var self = this;
        if(cc.vv._bindTipShown){ return; }
        cc.vv.http.sendRequest("/bind_status",{account:cc.vv.userMgr.account,sign:cc.vv.userMgr.sign},function(ret){
            if(ret && ret.errcode === 0){
                self._bindAccount = ret.bound_account;
                self._wxBound = !!ret.wx;
                if(!ret.bound_account && !ret.wx){
                    cc.vv._bindTipShown = true;
                    self._showBindTip();
                }
            }
        },cc.vv.http.master_url);
    },

    //注销账号:弹确认框→调服务端删除(含创建人俱乐部)→清本地登录态→回登录场景
    _logout:function(){
        var self = this;
        var doDelete = function(){
            cc.vv.wc.show("正在注销账户...");
            cc.vv.http.sendRequest("/delete_account",{
                account:cc.vv.userMgr.account,
                sign:cc.vv.userMgr.sign
            },function(ret){
                cc.vv.wc.hide();
                if(!ret || ret.errcode !== 0){
                    cc.vv.wc.showError((ret && ret.errmsg) ? ret.errmsg : "注销失败，请重试");
                    return;
                }
                //注销成功:清除本地登录态
                cc.sys.localStorage.removeItem("account");
                cc.sys.localStorage.removeItem("wx_account");
                cc.sys.localStorage.removeItem("wx_sign");
                cc.sys.localStorage.removeItem("login_account");
                cc.sys.localStorage.removeItem("login_sign");
                cc.sys.localStorage.removeItem("login_type");
                cc.vv.wc.showAlert("账户已注销");
                //稍延迟回登录场景,让提示可见
                setTimeout(function(){
                    // 注销后跳 login(login 自带初始化)
                    cc.director.loadScene("login");
                },1000);
            },cc.vv.http.master_url);
        };
        if(cc.vv.alert && cc.vv.alert.show){
            cc.vv.alert.show("注销账户","确定要注销账户吗？\n此操作不可恢复，您的俱乐部和数据将被清空！",doDelete,true);
        }
        else{
            //Alert组件未就绪时直接执行(兜底)
            doDelete();
        }
    },

   //获取用户信息 
    initLabels:function(){
        //场景里若有Label引用丢失(编辑场景后节点改名/删除),不能直接抛异常中断onLoad,否则大厅进不去
        if(cc.isValid(this.lblName)){
            this.lblName.string = cc.vv.userMgr.userName + " (ID:" + cc.vv.userMgr.userId + ")"; //用户名+用户ID
            this.lblName.node.color = cc.color(0,0,0); //昵称用黑色字体
        }
        if(cc.isValid(this.lblMoney)) this.lblMoney.string = cc.vv.userMgr.coins;//金币
        if(cc.isValid(this.lblGems)) this.lblGems.string = cc.vv.userMgr.gems;//房卡
    },
    
    //创建房间按钮显示
    onJoinGameClicked:function(){
        this.joinGameWin.active = true;
    },

    //打开战绩面板(内部为 房间->局 两级列表,点击某局进入录像回放)
    openZhanji:function(){
        if(this.zhanjiWin == null){ return; }
        this.zhanjiWin.active = true;
        //用 Canvas 上场景自带的 History 实例(它已认领列表模板),不要新建第二个实例
        var history = this.node.getComponent("History");
        if(history == null){
            try{
                history = this.node.addComponent("History");
            }catch(e){
                cc.log("[zhanji] History 组件挂载失败:" + (e && e.message));
            }
        }
        cc.log("[zhanji] open, history=" + (history != null) + " active=" + this.zhanjiWin.active);
        if(history){ history.open(); }
        else{ cc.log("[zhanji] History 组件加载失败"); }
    },
    
    //返回按钮显示（按当前玩法分流到对应游戏场景）
    onReturnGameClicked:function(){
        var name = cc.vv.gameNetMgr.getGameScene();
        if(cc.vv.sceneMgr){
            cc.vv.sceneMgr.load(name);
        }else{
            cc.director.loadScene(name);
        }
    },
    
    //创建房间按钮点击
    onCreateRoomClicked:function(){
        if(cc.vv.gameNetMgr.roomId != null){
            cc.vv.wc.showError("房间已经创建!\n必须解散当前房间才能创建新的房间");
            return;
        }
        console.log("onCreateRoomClicked");
        this.createRoomWin.active = true;   
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        var x = this.notice.node.x;
        x -= dt*120;
        if(x + this.notice.node.width < -360){
            x = 600;
        }
        this.notice.node.x = x;
        if(cc.vv && cc.vv.userMgr.roomData != null){
            cc.vv.userMgr.enterRoom(cc.vv.userMgr.roomData);
            cc.vv.userMgr.roomData = null;
        }
    },

    //==================== 大厅入口按钮(加入房间/创建房间) ====================
    //second=加入房间:打开大厅现有录入弹窗(joinGameWin),房间存在性/进入限制由服务端校验并提示
    //first=创建房间:仅俱乐部创建人可用,弹窗选择玩法创建牌桌并直接进入房间
    //clubEntryBtn=进入俱乐部:直接loadScene("club")跳转俱乐部场景
    initClub:function(){
        var self = this;
        var joinBtn = cc.find("Canvas/content/second");
        if(joinBtn && !joinBtn._hallBound){
            joinBtn._hallBound = true;
            joinBtn.on(cc.Node.EventType.TOUCH_END,function(){
                self.onJoinGameClicked();
            });
        }
        //first=创建房间:暂不开放,点击只提示;建房统一在俱乐部的"添加牌桌"里做
        var firstBtn = cc.find("Canvas/content/first");
        if(firstBtn && !firstBtn._hallBound){
            firstBtn._hallBound = true;
            firstBtn.on(cc.Node.EventType.TOUCH_END,function(){
                if(cc.vv.wc && cc.vv.wc.showAlert){ cc.vv.wc.showAlert("暂不能使用", "提示"); }
                else if(cc.vv.wc && cc.vv.wc.showError){ cc.vv.wc.showError("暂不能使用"); }
            });
        }
        var btn = cc.find("Canvas/content/clubEntryBtn");
        if(btn && !btn._hallBound){
            btn._hallBound = true;
            btn.on(cc.Node.EventType.TOUCH_END,function(){
                //从大厅主动进俱乐部:清掉所有来源标记,确保club场景显示clubPage列表页而不是旧详情页
                cc.vv.fromClub = false;
                cc.vv.fromClubId = null;
                if(cc.vv.gameNetMgr){
                    cc.vv.gameNetMgr.roomBackScene = "";
                    cc.vv.gameNetMgr.roomBackClubId = null;
                }
                if(cc.vv.sceneMgr){
                    cc.vv.sceneMgr.load("club");
                }else{
                    cc.director.loadScene("club");
                }
            });
        }
    },

    //创建房间入口:验证是否俱乐部创建人,不是则提示无权限
    _onCreateRoomEntry:function(){
        var self = this;
        cc.vv.wc.show("正在验证身份");
        cc.vv.http.sendRequest("/club_list",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign
        },function(ret){
            if(!ret || ret.errcode !== 0){
                cc.vv.wc.showError((ret && ret.errmsg) ? ret.errmsg : "验证失败");
                return;
            }
            var owned = null;
            var clubs = ret.clubs || [];
            for(var i = 0; i < clubs.length; i++){
                if(clubs[i].owner_userid == cc.vv.userMgr.userId){ owned = clubs[i]; break; }
            }
            if(!owned){
                cc.vv.wc.showError("您不是俱乐部创建人，无权创建房间");
                return;
            }
            self._fetchOwnerClubGames(owned);
        });
    },

    //拉取自有俱乐部已启用玩法后打开创建弹窗
    _fetchOwnerClubGames:function(club){
        var self = this;
        cc.vv.http.sendRequest("/club_games",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:club.id
        },function(ret){
            cc.vv.wc.hide();
            if(!ret || ret.errcode !== 0){
                cc.vv.wc.showError((ret && ret.errmsg) ? ret.errmsg : "获取玩法失败");
                return;
            }
            var games = ret.games || [];
            if(games.length === 0){
                cc.vv.wc.showError("俱乐部尚未配置玩法");
                return;
            }
            self._openCreateWin(club,games);
        });
    },

    //==================== 创建房间弹窗(动态构建,零贴图依赖) ====================
    //绘制圆角矩形到底层Graphics(按钮/输入框底通用)
    _drawRoundRect:function(g,w,h,r,color){
        g.clear();
        g.fillColor = color;
        g.roundRect(-w/2,-h/2,w,h,r);
        g.fill();
    },

    _makeLabel:function(parent,str,fontSize,x,y,color){
        var n = new cc.Node("label");
        n.parent = parent;
        var l = n.addComponent(cc.Label);
        l.string = str;
        l.fontSize = fontSize;
        l.color = color || cc.Color.WHITE;
        n.setPosition(x,y);
        return l;
    },

    //数字输入框:深色底+白字;opts可指定inputMode/password/maxLength(默认数字输入)
    _makeEditBox:function(parent,name,x,y,w,h,defStr,placeholder,opts){
        var self = this;
        var bgN = new cc.Node(name + "_bg");
        bgN.parent = parent;
        bgN.setContentSize(w,h);
        bgN.setPosition(x,y);
        var g = bgN.addComponent(cc.Graphics);
        self._drawRoundRect(g,w,h,8,new cc.Color(60,64,76,255));
        var n = new cc.Node(name);
        n.parent = parent;
        n.setContentSize(w,h);
        n.setPosition(x,y);
        n.addComponent(cc.Sprite);
        var eb = n.addComponent(cc.EditBox);
        var tn = new cc.Node("TEXT_LABEL");
        tn.parent = n;
        var tl = tn.addComponent(cc.Label);
        tl.fontSize = 26;
        tl.color = cc.Color.WHITE;
        var pn = new cc.Node("PLACEHOLDER_LABEL");
        pn.parent = n;
        var pl = pn.addComponent(cc.Label);
        pl.fontSize = 26;
        pl.color = new cc.Color(150,150,150,255);
        eb.textLabel = tl;
        eb.placeholderLabel = pl;
        eb.placeholder = placeholder || "";
        eb.inputMode = (opts && opts.inputMode) ? opts.inputMode : cc.EditBox.InputMode.NUMERIC;
        if(opts && opts.password){ eb.inputFlag = cc.EditBox.InputFlag.PASSWORD; }
        if(opts && opts.maxLength){ eb.maxLength = opts.maxLength; }
        eb.string = defStr;
        return eb;
    },

    //通用文字按钮(Graphics底+Label,点击回调)
    _makeTextButton:function(parent,name,str,x,y,w,h,color,cb){
        var self = this;
        var n = new cc.Node(name);
        n.parent = parent;
        n.setContentSize(w,h);
        n.setPosition(x,y);
        var g = n.addComponent(cc.Graphics);
        self._drawRoundRect(g,w,h,10,color);
        var ln = new cc.Node("text");
        ln.parent = n;
        var l = ln.addComponent(cc.Label);
        l.string = str;
        l.fontSize = 28;
        l.color = cc.Color.WHITE;
        n._btnLabel = l;
        n.on(cc.Node.EventType.TOUCH_END,function(){
            if(cc.isValid(n)){ cb(n); }
        });
        return n;
    },

    //打开创建房间弹窗:玩法选择(必选)+底分/局数/最低宝宝豆/请出阈值
    _openCreateWin:function(club,games){
        var self = this;
        this._closeCreateWin();
        var canvas = cc.find("Canvas");
        if(!canvas){ return; }
        var vs = cc.view.getVisibleSize();
        //根节点+遮罩
        var win = new cc.Node("hallCreateWin");
        win.parent = canvas;
        win.setContentSize(vs.width,vs.height);
        var mask = new cc.Node("mask");
        mask.parent = win;
        mask.setContentSize(vs.width,vs.height);
        var mg = mask.addComponent(cc.Graphics); //Sprite无贴图不渲染,遮罩用Graphics画实底
        mg.fillColor = new cc.Color(0,0,0,160);
        mg.rect(-vs.width/2,-vs.height/2,vs.width,vs.height);
        mg.fill();
        mask.addComponent(cc.BlockInputEvents);
        this._createWin = win;
        this._createClub = club;
        this._createGames = games;
        this._createSelGame = games[0];
        //面板(加高以容纳玩法简介)
        var panel = new cc.Node("panel");
        panel.parent = win;
        panel.setContentSize(720,840);
        var pg = panel.addComponent(cc.Graphics);
        this._drawRoundRect(pg,720,840,16,new cc.Color(30,34,44,245));
        this._makeLabel(panel,"创建房间",36,0,370);
        this._makeLabel(panel,"俱乐部：" + (club.name || ""),22,0,322,new cc.Color(180,180,180,255));
        //玩法选择行
        this._makeLabel(panel,"玩法：",26,-300,240);
        this._createGameBtns = [];
        var startX = -300 + 90;
        for(var i = 0; i < games.length; i++){
            (function(idx){
                var g = games[idx];
                var bx = startX + idx * 180;
                var b = self._makeTextButton(panel,"game_" + idx,g.name || g.game_type,bx,240,160,64,new cc.Color(70,76,92,255),function(){
                    self._createSelGame = g;
                    self._refreshCreateGameBtns();
                    self._fillCreateDefaults();
                });
                b._game = g;
                self._createGameBtns.push(b);
            })(i);
        }
        //玩法简介:标题+多行说明(随选中玩法切换)
        this._makeLabel(panel,"玩法简介：",22,-290,165,new cc.Color(120,170,255,255));
        var introNode = new cc.Node("createIntro");
        introNode.parent = panel;
        introNode.setAnchorPoint(0.5,1);
        introNode.setPosition(0,140);
        introNode.setContentSize(640,200);
        var introLabel = introNode.addComponent(cc.Label);
        introLabel.fontSize = 20;
        introLabel.lineHeight = 28;
        introLabel.enableWrapText = true;
        introLabel.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        introLabel.verticalAlign = cc.Label.VerticalAlign.TOP;
        introLabel.color = new cc.Color(220,220,220,255);
        introLabel.overflow = cc.Label.Overflow.NONE;
        this._createIntroLabel = introLabel;
        //输入行:底分/局数/最低宝宝豆/请出阈值
        var rows = [["底分：","difenInput"],["局数：","jushuInput"],["最低宝宝豆：","minInput"],["请出阈值：","kickInput"]];
        this._createInputs = {};
        for(var r = 0; r < rows.length; r++){
            var ry = -80 - r * 80;
            this._makeLabel(panel,rows[r][0],26,-210,ry);
            this._createInputs[rows[r][1]] = this._makeEditBox(panel,rows[r][1],100,ry,300,56,"0","");
        }
        //确定/取消
        this._makeTextButton(panel,"btnOk","确定",-140,-380,200,72,new cc.Color(41,121,211,255),function(){
            self._submitCreateWin();
        });
        this._makeTextButton(panel,"btnCancel","取消",140,-380,200,72,new cc.Color(90,94,106,255),function(){
            self._closeCreateWin();
        });
        this._refreshCreateGameBtns();
        this._fillCreateDefaults();
    },

    //玩法按钮选中态刷新 + 玩法简介同步
    _refreshCreateGameBtns:function(){
        var btns = this._createGameBtns || [];
        for(var i = 0; i < btns.length; i++){
            var b = btns[i];
            var sel = (b._game === this._createSelGame);
            var g = b.getComponent(cc.Graphics);
            this._drawRoundRect(g,b.width,b.height,10,sel ? new cc.Color(41,121,211,255) : new cc.Color(70,76,92,255));
        }
        //刷新当前选中玩法的简介
        if(this._createIntroLabel && this._createSelGame){
            var t = this._createSelGame.game_type || this._createSelGame.type;
            this._createIntroLabel.string = GAME_INTROS[t] || "该玩法暂无说明。";
        }
    },

    //按当前选中玩法回填默认底分/局数
    _fillCreateDefaults:function(){
        var g = this._createSelGame;
        if(!g || !this._createInputs){ return; }
        var difens = g.difen_options || [];
        var jushus = g.jushu_options || [];
        var dv = Number(difens[0]);
        this._createInputs.difenInput.string = String((isFinite(dv) && dv > 0) ? dv : 1);
        this._createInputs.jushuInput.string = String(jushus[0] != null ? jushus[0] : "");
        this._createInputs.minInput.string = "0";
        this._createInputs.kickInput.string = "0";
    },

    _closeCreateWin:function(){
        if(this._createWin && cc.isValid(this._createWin)){
            this._createWin.destroy();
        }
        this._createWin = null;
        this._createGameBtns = null;
        this._createInputs = null;
        this._createIntroLabel = null;
    },

    //提交创建:服务端校验创建人身份并按序号自动命名,成功后直接进入房间
    _submitCreateWin:function(){
        var self = this;
        var g = this._createSelGame;
        var club = this._createClub;
        if(!g || !club || !this._createInputs){ return; }
        var read = function(eb){ return String(eb.string || "").replace(/[^0-9]/g,""); };
        var difen = parseInt(read(this._createInputs.difenInput));
        if(!(difen > 0)){ cc.vv.wc.showError("请输入正确的底分"); return; }
        var jushus = g.jushu_options || [];
        var jushu = parseInt(read(this._createInputs.jushuInput));
        var jushuIdx = -1;
        for(var i = 0; i < jushus.length; i++){
            if(Number(jushus[i]) === jushu){ jushuIdx = i; break; }
        }
        if(jushuIdx < 0){ cc.vv.wc.showError("局数只能为：" + (jushus.length ? jushus.join(" / ") : "玩法未配置")); return; }
        var min = parseInt(read(this._createInputs.minInput));
        var kick = parseInt(read(this._createInputs.kickInput));
        if(!(min >= 0)){ min = 0; }
        if(!(kick >= 0)){ kick = 0; }
        cc.vv.wc.show("正在创建房间");
        cc.vv.http.sendRequest("/club_add_table",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:club.id,
            game_type:g.game_type,
            difen_value:difen,
            jushuxuanze:jushuIdx,
            banker_mode:0, //与牌桌列表页一致:固定无庄
            min_bean:min,
            kick_bean:kick
        },function(ret){
            if(!ret || ret.errcode !== 0){
                cc.vv.wc.showError((ret && ret.errmsg) ? ret.errmsg : "创建房间失败");
                return;
            }
            self._closeCreateWin();
            self._enterCreatedTable(ret.tableid, club.id);
        });
    },

    //创建成功后直接进入新房间(服务端复用/建房并绑定牌桌,含宝宝豆门槛校验)
    _enterCreatedTable:function(tableId, clubId){
        var wc = cc.vv.wc;
        wc.show("正在进入房间");
        var guard = setTimeout(function(){
            if(cc.vv.wc !== wc){ return; } //场景已切换则不再提示
            wc.showError("进入房间失败,请重试(服务未响应)");
        },12000);
        cc.vv.http.sendRequest("/club_enter_table",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            tableid:tableId
        },function(ret){
            clearTimeout(guard);
            if(!ret || ret.errcode !== 0){
                if(ret && ret.errcode == 2222){
                    wc.hide();
                    cc.vv.wc.showAlert(ret.errmsg || "宝宝豆不足，无法进入房间");
                }else{
                    wc.showError((ret && ret.errmsg) ? ret.errmsg : "进入房间失败");
                }
                return;
            }
            //从大厅俱乐部页进的桌:记住来源俱乐部,牌局结束回俱乐部详情页而不是大厅首页
            cc.vv.fromClub = true;
            cc.vv.fromClubId = clubId || null;
            cc.vv.gameNetMgr.connectGameServer(ret);
        });
    },

});
