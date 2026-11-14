//字符串拼接
String.prototype.format = function(args) { 
    //调用的实际参数的个数>0
    if (arguments.length>0) { 
        var result = this; 
        if (arguments.length == 1 && typeof (args) == "object") { 
            for (var key in args) { 
                var reg=new RegExp ("({"+key+"})","g"); 
                result = result.replace(reg, args[key]); 
            } 
        } 
        else { 
            for (var i = 0; i < arguments.length; i++) { 
                if(arguments[i]==undefined) { 
                    return ""; 
                } 
                else { 
                    var reg=new RegExp ("({["+i+"]})","g"); 
                    result = result.replace(reg, arguments[i]); 
                } 
            } 
        } 
        return result; 
    } 
    else { 
        return this; 
    } 
};
 
cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _mima:null,
        _mimaIndex:0,
    },

    // 初始化
    onLoad: function () {
        // 兜底: 热更检查在 loading 场景; 若构建时起始场景被误设成 login, 这里先补跑一次热更检查
        // (window.__huChecked 只在本次进程内有效, 不会影响下次冷启动)
        if(cc.sys.isNative && typeof jsb !== "undefined" && jsb.AssetsManager && !window.__huChecked){
            window.__huChecked = true;
            cc.director.loadScene("loading");
            return;
        }
        // 合并 loading 场景职责: cc.vv 未初始化时在这里初始化所有管理器
        if(!cc.vv){
            this._initMgr();
        }
        //回登录页时HTTP.url可能还指向大厅服(9101),登录相关请求必须切回账号服(9100),否则会提示无法连接服务器
        if(cc.vv && cc.vv.http){ cc.vv.http.url = cc.vv.http.master_url; }
        if(!cc.sys.isNative){
            var cvs = this.node.getComponent(cc.Canvas); //获取当前节点Canvas
            //填充宽高度
            cvs.fitHeight = true; 
            cvs.fitWidth = false;
            //宽屏下把登录背景拉伸铺满，去除两侧黑边(真实路径 Canvas/global/image/bg)
            var loginBg = this.node.getChildByName("bg");
            if(!loginBg){
                var g = this.node.getChildByName("global");
                var img = g ? g.getChildByName("image") : null;
                loginBg = img ? img.getChildByName("bg") : null;
            }
            if(loginBg){
                var resizeLoginBg = function(){
                    if(!cc.isValid(loginBg)){ return; }
                    var w = loginBg.getComponent(cc.Widget);
                    if(w){ w.enabled = false; } //关闭残留对齐组件，防止把背景钉在画布边缘
                    var vs = cc.view.getVisibleSize(); var vo = cc.view.getVisibleOrigin(); //实际可见区域尺寸(含黑边外区域)
                    loginBg.setContentSize(vs.width, vs.height);
                    loginBg.setPosition(loginBg.parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width/2, vo.y + vs.height/2))); //居中到可见区中心
                };
                resizeLoginBg();
                this.scheduleOnce(resizeLoginBg, 0); //延迟一帧重算，避免onLoad时父链矩阵未就位导致定位偏移
                cc.view.setResizeCallback(resizeLoginBg);
            }
        }
        //先开始预载资源:不能等服务器信息,否则服务器没启动时会一直卡在"资源加载中"
        this._initPreloadUI();
        //服务器信息只用于登录开关(如微信登录),后台获取,失败也不影响资源加载
        this._checkVersion();
        //sockect连接模块  参数 事件 方法
        //首次登录不再跳创角场景: 由UserMgr.login检测到无角色时自动生成默认昵称建档后直接进大厅

        cc.vv.audioMgr.playBGM("bgMain.mp3");
        
        this._mima = ["A","A","B","B","A","B","A","B","A","A","A","B","B","B"];
        
        //三个登录按钮(游客/微信/账号登录):资源加载完成前整块隐藏, 加载完再显示
        var btnRoot = this._findBtnRoot();
        if(btnRoot){
            btnRoot.active = false;
            this._loginBtnRoot = btnRoot;
            //游客登录按钮
            var btnYk = btnRoot.getChildByName("btn_yk");
            if(btnYk){ btnYk.active = true; }
            //微信登录按钮(场景内 button1 = 微信登录按钮图):后台关闭微信登录时隐藏
            var btnWx = btnRoot.getChildByName("button1");
            if(btnWx){
                btnWx.active = !(cc.vv.SI && cc.vv.SI.wxlogin === 0);
                cc.vv.utils.addClickEvent(btnWx,this.node,"login","onBtnWechatClicked");
            }
        }
        //账号登录按钮绑定(隐藏状态下也能绑)
        this._initPwdLoginUI();
    },
    
    // 初始化所有管理器(原 loading 场景的职责,合并到 login)
    _initMgr:function(){
        cc.vv = {};
        var UserMgr = require("UserMgr");
        cc.vv.userMgr = new UserMgr();
        var ReplayMgr = require("ReplayMgr");
        cc.vv.replayMgr = new ReplayMgr();
        cc.vv.http = require("HTTP");
        cc.vv.global = require("Global");
        cc.vv.net = require("Net");
        var GameNetMgr = require("GameNetMgr");
        cc.vv.gameNetMgr = new GameNetMgr();
        cc.vv.gameNetMgr.initHandlers();
        var AnysdkMgr = require("AnysdkMgr");
        cc.vv.anysdkMgr = new AnysdkMgr();
        cc.vv.anysdkMgr.init();
        var VoiceMgr = require("VoiceMgr");
        cc.vv.voiceMgr = new VoiceMgr();
        cc.vv.voiceMgr.init();
        var AudioMgr = require("AudioMgr");
        // 单例: 已存在就不要重建, 否则正在播放的 BGM 句柄会丢失(旧音乐停不掉/叠音)
        if(!cc.vv.audioMgr) { cc.vv.audioMgr = new AudioMgr(); cc.vv.audioMgr.init(); }
        // 全局按钮点击音效(只挂一次: loading/login 两处都会执行, 重复包装会让每次点击播两遍)
        if (!cc.Node.prototype._bbBtnSoundHooked) {
            cc.Node.prototype._bbBtnSoundHooked = true;
            var _nodeEmit = cc.Node.prototype.emit;
            cc.Node.prototype.emit = function(type){
                if(type === "touch-end" && cc.vv && cc.vv.audioMgr){
                    var btn = this.getComponent ? this.getComponent(cc.Button) : null;
                    if((btn && btn.interactable !== false) || /^btn/i.test(this.name) || /button/i.test(this.name)){
                        cc.vv.audioMgr.playSFX("btnClick.wav");
                    }
                }
                return _nodeEmit.apply(this, arguments);
            };
        }
        var Utils = require("Utils");
        cc.vv.utils = new Utils();
        try {
            var SceneMgr = require("SceneMgr");
            cc.vv.sceneMgr = new SceneMgr();
            cc.vv.sceneMgr.init();
        } catch (e) {
            console.warn("[SceneMgr] 加载失败:", e.message);
            cc.vv.sceneMgr = {
                load: function (name, cb) { return cc.director.loadScene(name, cb); }
            };
        }
        cc.args = this.urlParse();
    },

    //获取url及url参数
    urlParse:function(){
        var params = {};
        if(window.location == null){ return params; }
        var str = window.location.href;
        var num = str.indexOf("?");
        str = str.substr(num + 1);
        var arr = str.split("&");
        for(var i = 0; i < arr.length; i++){
            num = arr[i].indexOf("=");
            if(num > 0){
                var name = arr[i].substr(0, num);
                var value = arr[i].substr(num + 1);
                params[name] = value;
            }
        }
        return params;
    },

    //检查版本+获取服务器信息(原 loading 场景职责), 成功后开始预载资源
    _checkVersion:function(){
        var self = this;
        var xhr = null;
        var complete = false;
        var onGetVersion = function(ret){
            if(ret && ret.version != null){
                cc.vv.SI = ret;
            }
            //后台拿到开关后同步微信登录按钮可见性
            var btnRoot = self._findBtnRoot();
            var btnWx = btnRoot ? btnRoot.getChildByName("button1") : null;
            if(btnWx){ btnWx.active = !(cc.vv.SI && cc.vv.SI.wxlogin === 0); }
        };
        var tries = 0;
        var fnRequest = function(){
            tries++;
            xhr = cc.vv.http.sendRequest("/get_serverinfo", null, function(ret){
                xhr = null;
                complete = true;
                onGetVersion(ret);
            },cc.vv.http.master_url);
            setTimeout(fn, 5000);
        };
        var fn = function(){
            //最多重试3次,避免服务器未启动时无限重试刷屏
            if(!complete){
                if(xhr){
                    xhr.abort();
                    if(tries < 3){ setTimeout(function(){ fnRequest(); }, 5000); }
                } else if(tries < 3){
                    fnRequest();
                }
            }
        };
        fn();
    },

    //统一查找按钮区:兼容 global/button 和 main/button 两种场景结构
    _findBtnRoot:function(){
        return cc.find("Canvas/global/button") || cc.find("Canvas/main/button") || cc.find("Canvas/button");
    },

    //微信登录
    onBtnWechatClicked:function(){
        if(!cc.sys.isNative){
            if(cc.vv.wc && cc.vv.wc.showError){
                cc.vv.wc.showError("微信登录仅支持APP端,请使用游客登录");
            }
            return;
        }
        cc.vv.anysdkMgr.login();
    },
    
    start:function(){
      
    },

    //登录前资源预载:进度条展示,三个登录按钮隐藏,加载完成后才显示
    _initPreloadUI:function(){
        //只执行一次,防止 _checkVersion 回调重复触发
        if(this._preloadStarted){ return; }
        this._preloadStarted = true;
        var self = this;
        //隐藏登录按钮区(加载完在 _onAllResLoaded 里显示)
        var btnRoot = this._findBtnRoot();
        if(btnRoot){ btnRoot.active = false; this._loginBtnRoot = btnRoot; }
        //进度条UI:优先复用场景里固化的 preloadUI(login.fire),没有才运行时创建
        var root = this.node.getChildByName("preloadUI");
        this._preloadBaked = !!root;
        if(root == null){
            root = new cc.Node("preloadUI");
            this.node.addChild(root);
            root.setPosition(0,-140);
            var tipN = new cc.Node("tip");
            tipN.setPosition(0,34);
            root.addChild(tipN);
            var tip = tipN.addComponent(cc.Label);
            tip.string = "资源加载中...";
            tip.fontSize = 24;
            tip.lineHeight = 30;
            var bgN = new cc.Node("barBg");
            bgN.setContentSize(520,24);
            root.addChild(bgN);
            var fillN0 = new cc.Node("barFill");
            fillN0.setPosition(-250,0);
            root.addChild(fillN0);
            var pctN = new cc.Node("pct");
            pctN.setPosition(0,-34);
            root.addChild(pctN);
            var pct0 = pctN.addComponent(cc.Label);
            pct0.string = "0%";
            pct0.fontSize = 22;
            pct0.lineHeight = 26;
        }
        root.active = true;
        //场景里的位置/尺寸以美术配置为准; 只有运行时临时创建的进度条才需要指定位置
        if(!this._preloadBaked){ root.setPosition(0,-140); }
        //条底:场景已挂Sprite(bg4圆角底)则直接用;没有才用Graphics画深色圆角+金边
        var barBg = root.getChildByName("barBg");
        //条底宽度/高度跟随场景配置(场景里是780x35), 不要强改成固定值, 否则填充条会跟条底错位
        var bgW = barBg.width > 10 ? barBg.width : 520;
        var bgH = barBg.height > 10 ? barBg.height : 30;
        if(barBg.getComponent(cc.Sprite) == null){
            var g = barBg.getComponent(cc.Graphics) || barBg.addComponent(cc.Graphics);
            g.clear();
            g.fillColor = cc.color(0,0,0,160);
            g.roundRect(-bgW / 2, -bgH / 2, bgW, bgH, Math.min(bgH / 2, 12));
            g.fill();
            g.strokeColor = cc.color(255,215,120);
            g.lineWidth = 2;
            g.roundRect(-bgW / 2, -bgH / 2, bgW, bgH, Math.min(bgH / 2, 12));
            g.stroke();
        }
        //填充条(左对齐,随进度增长):有Sprite则改宽度,否则Graphics绘制
        var fillN = root.getChildByName("barFill");
        this._loadFillNode = fillN;
        this._loadFillSprite = fillN.getComponent(cc.Sprite);
        this._loadFill = this._loadFillSprite ? null : (fillN.getComponent(cc.Graphics) || fillN.addComponent(cc.Graphics));
        //填充条左边缘对齐条底左边缘, 宽度按进度增长
        fillN.setPosition(-bgW / 2, 0);
        this._loadFillW = bgW; //填充条满宽=条底宽(白条完全覆盖绿底即100%)
        //百分比文字
        this._loadPct = root.getChildByName("pct").getComponent(cc.Label);
        this._drawLoadProgress(0);
        //预载所有资源目录(script已在包内,无需加载)
        var dirs = ["images","textures","sounds","prefabs"];
        var stat = {};
        var done = 0;
        dirs.forEach(function(d){
            stat[d] = {c:0,t:0};
            cc.resources.loadDir(d, function(c,t){
                stat[d].c = c; stat[d].t = t;
                var ac = 0, at = 0;
                for(var k in stat){ ac += stat[k].c; at += stat[k].t; }
                self._drawLoadProgress(at > 0 ? ac / at : 0);
            }, function(err){
                if(err){ console.log("[预载]目录加载失败:" + d, err); }
                done++;
                if(done >= dirs.length){ self._onAllResLoaded(); }
            });
        });
    },

    _drawLoadProgress:function(p){
        //4个目录并行加载,各自total随依赖发现中途变大,合并比值会回落;进度只增不减
        this._loadMaxP = Math.max(this._loadMaxP || 0, p);
        p = this._loadMaxP;
        if(this._loadFillSprite){
            //Sprite版:左锚点改宽度(编辑器里可见)
            this._loadFillNode.width = Math.max(0.01, this._loadFillW * p);
        }
        else if(this._loadFill){
            var g = this._loadFill;
            g.clear();
            var w = Math.max(0.01, this._loadFillW * p);
            g.fillColor = cc.color(220,60,60);
            g.roundRect(0,-8,w,16,8);
            g.fill();
        }
        if(this._loadPct){ this._loadPct.string = Math.floor(p * 100) + "%"; }
    },

    _onAllResLoaded:function(){
        this._drawLoadProgress(1);
        var ui = this.node.getChildByName("preloadUI");
        if(ui){
            //场景固化的只隐藏(重进场景自动恢复),运行时建的才销毁
            if(this._preloadBaked){ ui.active = false; }
            else{ ui.destroy(); }
        }
        //资源加载完成:有本地登录态就直接自动登录进大厅,没有或失效才显示三个登录按钮
        var root = this._loginBtnRoot;
        if(root && cc.isValid(root)){
            var showBtns = function(){
                if(!cc.isValid(root)){ return; }
                root.active = true;
                var btnYk = root.getChildByName("btn_yk");
                if(btnYk){ btnYk.active = true; }
            };
            if(cc.vv.userMgr && cc.vv.userMgr.autoLogin(showBtns)){
                //已发起自动登录,按钮保持隐藏
            }
            else{
                showBtns();
            }
        }
    },

    //账号密码登录UI:优先绑定场景里固化的 Canvas/pwdWin(pwdAcc/pwdPwd/btnLogin/btnCancel),
    //场景缺失时才用运行时兜底弹窗
    _initPwdLoginUI:function(){
        if(this._pwdLoginBound){ return; }
        this._pwdLoginBound = true;
        var self = this;
        var btnRoot = this._findBtnRoot();
        //优先用场景里做好的账号登录弹窗 Canvas/pwdWin(位置/尺寸都能在编辑器里调)
        var canvas = cc.find("Canvas");
        var win = canvas ? canvas.getChildByName("pwdWin") : null;
        this._pwdWinNode = win || null;
        if(win){ win.active = false; } //默认隐藏,点"账号登录"才弹
        //输入框:场景弹窗里优先;老场景兼容 button 下按名字找
        var accNode = win ? this._findChildByName(win, "pwdAcc") : (btnRoot ? this._findChildByName(btnRoot, "pwdAcc") : null);
        var pwdNode = win ? this._findChildByName(win, "pwdPwd") : (btnRoot ? this._findChildByName(btnRoot, "pwdPwd") : null);
        this._pwdAccBox = accNode ? accNode.getComponent(cc.EditBox) : null;
        this._pwdPwdBox = pwdNode ? pwdNode.getComponent(cc.EditBox) : null;
        if(!this._pwdAccBox && !this._pwdPwdBox && btnRoot){
            var boxes = btnRoot.getComponentsInChildren(cc.EditBox);
            if(boxes.length >= 2){ this._pwdAccBox = boxes[0]; this._pwdPwdBox = boxes[1]; }
        }
        //弹窗内的登录/取消/遮罩:只绑一次
        if(win){
            var btnLogin = this._findChildByName(win, "btnLogin");
            if(btnLogin){ btnLogin.on(cc.Node.EventType.TOUCH_END, function(){ self._submitPwdLogin(); }); }
            var btnCancel = this._findChildByName(win, "btnCancel");
            if(btnCancel){ btnCancel.on(cc.Node.EventType.TOUCH_END, function(){ if(cc.isValid(win)){ win.active = false; } }); }
            var dim = win.getChildByName("dim");
            if(dim){ dim.on(cc.Node.EventType.TOUCH_END, function(){ if(cc.isValid(win)){ win.active = false; } }); }
        }
        //账号登录按钮:有场景弹窗就弹窗,没有才走运行时兜底
        var btn = btnRoot ? (btnRoot.getChildByName("activ") || btnRoot.getChildByName("btnPwdLogin")) : null;
        if(btn){
            btn.on(cc.Node.EventType.TOUCH_END, function(){
                if(self._pwdWinNode && cc.isValid(self._pwdWinNode)){ self._pwdWinNode.active = true; return; }
                self._showPwdLoginWin();
            });
        } else {
            console.warn("[login] 未找到账号登录按钮(activ), 账号登录未绑定");
        }
    },

    //读取账号/密码并登录(场景弹窗和运行时兜底共用)
    _submitPwdLogin:function(){
        var acc = (this._pwdAccBox && this._pwdAccBox.string || "").trim();
        var pwd = (this._pwdPwdBox && this._pwdPwdBox.string || "").trim();
        if(!acc || !pwd){
            if(cc.vv.wc && cc.vv.wc.showError){ cc.vv.wc.showError("请输入账号和密码"); }
            return;
        }
        if(this._pwdWinNode && cc.isValid(this._pwdWinNode)){ this._pwdWinNode.active = false; }
        cc.vv.userMgr.pwdAuth(acc, pwd);
    },

    //账号登录弹窗:场景里没有输入框时兜底创建(账号+密码+登录/取消)
    _showPwdLoginWin:function(){
        var self = this;
        //场景里有 pwdWin 就直接显示,不再用 JS 拼控件
        if(this._pwdWinNode && cc.isValid(this._pwdWinNode)){
            this._pwdWinNode.active = true;
            return;
        }
        if(this._pwdWin && cc.isValid(this._pwdWin)){
            this._pwdWin.active = true;
            return;
        }
        var W = 620, H = 400;
        var win = new cc.Node("pwdLoginWin");
        win.setContentSize(W, H);
        this.node.addChild(win);
        //遮罩:点空白处关闭
        var dim = new cc.Node("dim");
        dim.setContentSize(2000, 2000);
        var dg = dim.addComponent(cc.Graphics);
        dg.fillColor = cc.color(0, 0, 0, 170);
        dg.rect(-1000, -1000, 2000, 2000);
        dg.fill();
        win.addChild(dim);
        dim.on(cc.Node.EventType.TOUCH_END, function(){ win.active = false; });
        //面板
        var panel = new cc.Node("panel");
        panel.setContentSize(W, H);
        var pg = panel.addComponent(cc.Graphics);
        pg.fillColor = cc.color(255, 255, 255, 255);
        pg.roundRect(-W / 2, -H / 2, W, H, 16);
        pg.fill();
        pg.strokeColor = cc.color(180, 180, 180, 255);
        pg.lineWidth = 2;
        pg.roundRect(-W / 2, -H / 2, W, H, 16);
        pg.stroke();
        win.addChild(panel);
        //标题
        var title = new cc.Node("title");
        title.setPosition(0, 150);
        title.addComponent(cc.Label);
        var tl = title.getComponent(cc.Label);
        tl.fontSize = 32;
        tl.lineHeight = 38;
        tl.string = "账号登录";
        title.color = cc.color(40, 40, 40, 255);
        panel.addChild(title);
        //账号/密码输入框
        this._pwdAccBox = this._makePwdBox(panel, "pwdAcc", 62, "请输入账号", false);
        this._pwdPwdBox = this._makePwdBox(panel, "pwdPwd", -14, "请输入密码", true);
        //按钮:登录/取消(复用游客登录按钮的贴图)
        var btnRoot = this._findBtnRoot();
        var ykNode = btnRoot ? btnRoot.getChildByName("btn_yk") : null;
        var frame = ykNode && ykNode.getComponent(cc.Sprite) ? ykNode.getComponent(cc.Sprite).spriteFrame : null;
        var doLogin = function(){
            var acc = (self._pwdAccBox && self._pwdAccBox.string || "").trim();
            var pwd = (self._pwdPwdBox && self._pwdPwdBox.string || "").trim();
            if(!acc || !pwd){
                if(cc.vv.wc && cc.vv.wc.showError){ cc.vv.wc.showError("请输入账号和密码"); }
                return;
            }
            win.active = false;
            cc.vv.userMgr.pwdAuth(acc, pwd);
        };
        this._makePwdBtn(panel, "btnLogin", 100, -118, "登录", frame, doLogin);
        this._makePwdBtn(panel, "btnCancel", -100, -118, "取消", frame, function(){ win.active = false; });
        this._pwdWin = win;
    },

    //创建一个带底色的输入框(含 textLabel / placeholderLabel)
    _makePwdBox:function(parent, name, y, placeholder, isPwd){
        var n = new cc.Node(name);
        n.setContentSize(440, 64);
        n.setPosition(0, y);
        parent.addChild(n);
        var g = n.addComponent(cc.Graphics);
        g.fillColor = cc.color(245, 245, 245, 255);
        g.roundRect(-220, -32, 440, 64, 10);
        g.fill();
        g.strokeColor = cc.color(200, 200, 200, 255);
        g.lineWidth = 2;
        g.roundRect(-220, -32, 440, 64, 10);
        g.stroke();
        var textN = new cc.Node("textLabel");
        textN.setContentSize(420, 64);
        textN.setAnchorPoint(0, 0.5);
        textN.setPosition(-210, 0);
        textN.addComponent(cc.Label);
        var textLb = textN.getComponent(cc.Label);
        textLb.fontSize = 26; textLb.lineHeight = 32;
        textLb.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        textLb.verticalAlign = cc.Label.VerticalAlign.CENTER;
        textN.color = cc.color(30, 30, 30, 255);
        n.addChild(textN);
        var phN = new cc.Node("placeholderLabel");
        phN.setContentSize(420, 64);
        phN.setAnchorPoint(0, 0.5);
        phN.setPosition(-210, 0);
        phN.addComponent(cc.Label);
        var phLb = phN.getComponent(cc.Label);
        phLb.fontSize = 26; phLb.lineHeight = 32;
        phLb.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        phLb.verticalAlign = cc.Label.VerticalAlign.CENTER;
        phLb.string = placeholder;
        phN.color = cc.color(150, 150, 150, 255);
        n.addChild(phN);
        var eb = n.addComponent(cc.EditBox);
        eb.textLabel = textLb;
        eb.placeholderLabel = phLb;
        eb.placeholder = placeholder;
        eb.maxLength = 24;
        if(isPwd){ eb.inputFlag = cc.EditBox.InputFlag.PASSWORD; }
        return eb;
    },

    //创建一个按钮(复用场景按钮贴图 + 白字)
    _makePwdBtn:function(parent, name, x, y, text, frame, cb){
        var n = new cc.Node(name);
        n.setContentSize(200, 72);
        n.setPosition(x, y);
        parent.addChild(n);
        var sp = n.addComponent(cc.Sprite);
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        if(frame){ sp.spriteFrame = frame; }
        var lblN = new cc.Node("lbl");
        lblN.addComponent(cc.Label);
        var lb = lblN.getComponent(cc.Label);
        lb.string = text; lb.fontSize = 28; lb.lineHeight = 34;
        lblN.color = cc.color(255, 255, 255, 255);
        n.addChild(lblN);
        n.on(cc.Node.EventType.TOUCH_END, cb);
        return n;
    },

    //递归按名字找子节点
    _findChildByName:function(node,name){
        if(!node){ return null; }
        var found = node.getChildByName(name);
        if(found){ return found; }
        var ch = node.children;
        for(var i = 0; i < ch.length; i++){
            found = this._findChildByName(ch[i], name);
            if(found){ return found; }
        }
        return null;
    },
    
    //游客登录按钮点击方法
    onBtnQuickStartClicked:function(){
        cc.vv.userMgr.guestAuth();  //调用游客登入
    },
    

    //按钮密码点击方法
    onBtnMIMAClicked:function(event){
        if(this._mima[this._mimaIndex] == event.target.name){
            this._mimaIndex++;
            if(this._mimaIndex == this._mima.length){
                var btnRoot = this._findBtnRoot();
                if(btnRoot){
                    var btnYk = btnRoot.getChildByName("btn_yk");
                    if(btnYk){ btnYk.active = true; }
                }
            }
        }
        else{
            console.log("oh ho~~~");
            this._mimaIndex = 0;
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
//force-recompile-20261102