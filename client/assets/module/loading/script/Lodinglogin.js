// Compatible with v1.5.0+: loadResAll 指向 cc.resources.loadDir,避免 cc.loader 弃用警告
// 注意:构建worker环境中 cc.loader/cc.resources 可能不存在,必须判空,否则模块加载失败导致场景里的组件被剔除
if (cc.loader && !cc.loader.loadResAll && cc.resources) {
    cc.loader.loadResAll = cc.resources.loadDir.bind(cc.resources);
}

//版本号按数字逐段比较("1.0.10" > "1.0.9")
//引擎不传比较函数时是按字符串比较的, 会把 1.0.10 判定成小于 1.0.9,
//导致装了1.0.10的新包后每次启动都认为远端(1.0.9)有新版本, 反复下载/重启 -> 卡在检查更新且页面闪烁
function compareVersion(v1, v2){
    var a = String(v1 == null ? "" : v1).split(".");
    var b = String(v2 == null ? "" : v2).split(".");
    var n = Math.max(a.length, b.length);
    for(var i = 0; i < n; ++i){
        var x = parseInt(a[i], 10); if(isNaN(x)) x = 0;
        var y = parseInt(b[i], 10); if(isNaN(y)) y = 0;
        if(x > y) return 1;
        if(x < y) return -1;
    }
    return 0;
}

//APP热更总开关: 开启。
//启动时先判断设备上热更目录里的清单版本: 只有比包内版本更高才恢复热更并重启一次, 否则清掉,
//避免旧包的热更资源盖住新包代码(旧代码按字符串比较版本, 会把1.0.9当成比1.0.10新, 无限下载重启)
var HOT_UPDATE_ENABLED = true;


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
        _splash:null,    //启动页引导图
        tipLabel:cc.Label,  //加载标签
        _stateStr:'',        //标签文字
        _progress:0.0,      //进度条(显示值,单调递增)
        _targetProgress:0.0,//进度条(真实目标值)
        _isLoading:false,    //是否加载中

    },

    // use this for initialization
    onLoad: function () {
        console.log("[Lodinglogin] onLoad enter");
        //标记本次启动已跑过热更检查(login 场景据此判断是否需要补跑)
        window.__huChecked = true;
        if(HOT_UPDATE_ENABLED){
            //恢复热更搜索路径: 只有热更版本真的比包内高才恢复并重启一次
            if(this.applyHotUpdateSearchPaths()){
                return; //已发起重启, 本场景生命周期到此为止
            }
        } else {
            this.clearHotUpdate();
        }
        //判断是否原生，是否为手机
        if(!cc.sys.isNative ){   //&& cc.sys.isMobile
            //获取canvas节点
            var cvs = this.node.getComponent(cc.Canvas);
            //填充宽高度
            cvs.fitHeight = true;
            cvs.fitWidth = false;
            //宽屏下把加载背景拉伸铺满，去除两侧黑边
            var loadBg = this.node.getChildByName("bg");
            if(loadBg){
                var resizeLoadBg = function(){
                    if(!cc.isValid(loadBg)){ return; }
                    var w = loadBg.getComponent(cc.Widget);
                    if(w){ w.enabled = false; } //关闭残留对齐组件，防止把背景钉在画布边缘
                    var vs = cc.view.getVisibleSize(); var vo = cc.view.getVisibleOrigin(); //实际可见区域尺寸(含黑边外区域)
                    loadBg.setContentSize(vs.width, vs.height);
                    loadBg.setPosition(loadBg.parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width/2, vo.y + vs.height/2))); //居中到可见区中心
                };
                resizeLoadBg();
                this.scheduleOnce(resizeLoadBg, 0); //延迟一帧重算，避免onLoad时父链矩阵未就位导致定位偏移
                cc.view.setResizeCallback(resizeLoadBg);
            }
        }
        this.initMgr();//初始化各组件脚本
        //标签内容赋值
        this.tipLabel.string = this._stateStr;  
        this._splash = cc.find("Canvas/splash"); //获取引导图
        if(this._splash){ this._splash.active = false; } //去掉白底引导图(节点缺失时跳过,避免崩溃)

    },
    //引导图显示加载
    start:function(){
        console.log("[Lodinglogin] start enter");
        if(this._bootStarted){ return; } //只跑一次, 防止场景重进时重复检查热更
        this._bootStarted = true;
        //原生环境先做APP热更新检查(服务器未发布热更清单时自动跳过), 完成后走 checkVersion
        if(HOT_UPDATE_ENABLED && cc.sys.isNative && typeof jsb !== "undefined" && jsb.AssetsManager){
            this.checkHotUpdate();
        } else {
            this.checkVersion();
        }
    },

    //==================== APP热更新 ====================
    //删除设备上残留的热更路径和热更资源(热更版本过期时调用)
    clearHotUpdate:function(){
        try { cc.sys.localStorage.removeItem("HotUpdateSearchPaths"); } catch(e){}
        try { cc.sys.localStorage.removeItem("HotUpdateAppliedPaths"); } catch(e){}
        if(!cc.sys.isNative || typeof jsb === "undefined" || !jsb.fileUtils){
            return;
        }
        try {
            var p = this._hotStoragePath();
            if(jsb.fileUtils.isDirectoryExist && jsb.fileUtils.isDirectoryExist(p)){
                jsb.fileUtils.removeDirectory(p);
                console.error("[HotUpdate] 已清除旧热更目录:" + p);
            }
        } catch(e) {}
    },

    //恢复上次热更写入的资源搜索路径, 返回true表示已发起重启
    applyHotUpdateSearchPaths:function(){
        if(!cc.sys.isNative || typeof jsb === "undefined" || !jsb.fileUtils){
            return false;
        }
        var saved = cc.sys.localStorage.getItem("HotUpdateSearchPaths");
        if(!saved){
            return false;
        }
        var obj = null;
        try { obj = JSON.parse(saved); } catch(e){ obj = null; }
        var paths = Array.isArray(obj) ? obj : (obj && obj.paths); //兼容旧格式(纯数组)与新格式{paths}
        if(!paths || !paths.length){
            cc.sys.localStorage.removeItem("HotUpdateSearchPaths");
            return false;
        }
        var flat = this._flattenPaths(paths);
        var cur = null;
        try { cur = jsb.fileUtils.getSearchPaths(); } catch(e){ cur = null; }
        if(cur && this._flattenPaths(cur) === flat){
            return false; //已经生效, 不需要重启(此时读到的包内清单可能也是热更目录里的, 不能做版本判断)
        }
        //包指纹变化(打了新包)时, 旧热更资源一律作废。
        //指纹用构建时烘焙进包的 bundleVers, 每个构建都不同, 不依赖读APK里的清单/版本号
        var stamp = this._buildStamp();
        var savedStamp = cc.sys.localStorage.getItem("HotUpdateBuildStamp");
        if(!stamp || savedStamp !== stamp){
            console.error("[HotUpdate] 包指纹变化或旧热更无指纹, 丢弃: 记录=" + savedStamp + " 当前=" + stamp);
            this.clearHotUpdate();
            return false;
        }
        //热更目录实际不存在(被清理/系统回收): 直接作废, 避免带着无效路径重启
        var hotDir = this._hotStoragePath();
        if(jsb.fileUtils.isDirectoryExist && !jsb.fileUtils.isDirectoryExist(hotDir)){
            console.error("[HotUpdate] 热更目录不存在, 丢弃记录:" + hotDir);
            this.clearHotUpdate();
            return false;
        }
        jsb.fileUtils.setSearchPaths(paths);
        //重启会把JS上下文整个重来(window上的标记也一起丢), "是否已为这组路径重启过"必须存localStorage:
        //否则重启后路径被重置->又判断不一致->再重启, 真机上就是loading/login反复闪
        var applied = cc.sys.localStorage.getItem("HotUpdateAppliedPaths");
        if(applied === flat){
            console.error("[HotUpdate] 同一组热更路径已重启过, 跳过重复重启");
            return false;
        }
        cc.sys.localStorage.setItem("HotUpdateAppliedPaths", flat);
        console.error("[HotUpdate] 已恢复热更搜索路径, 重启生效");
        cc.game.restart();
        return true;
    },

    //热更资源存放目录(必须与 checkHotUpdate 里的 storagePath 保持一致)
    _hotStoragePath:function(){
        return (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/") + "baobao_hotupdate/";
    },

    //当前包的构建指纹: bundleVers 是构建时烘焙进包的各 bundle 版本号(换包必变)。
    //main.js 里 _CCSettings 会被清空, 运行时从 cc.assetManager.bundleVers 取
    _buildStamp:function(){
        var s = null;
        try { s = cc.assetManager && cc.assetManager.bundleVers; } catch(e){ s = null; }
        if(!s){ try { s = window._CCSettings && window._CCSettings.bundleVers; } catch(e){ s = null; } }
        if(!s){ return null; }
        var keys = [];
        for(var k in s){ if(Object.prototype.hasOwnProperty.call(s, k)){ keys.push(k + ":" + s[k]); } }
        keys.sort();
        return keys.join("|");
    },

    _flattenPaths:function(arr){
        var out = [];
        (function walk(x){
            for(var i = 0; i < x.length; ++i){
                if(Array.isArray(x[i])) walk(x[i]);
                else out.push(String(x[i]));
            }
        })(arr);
        return out.join("|");
    },

    //热更检查:拉取远端清单, 有新版本自动下载, 完成后重启; 失败/无清单跳过热更继续原流程
    checkHotUpdate:function(){
        var self = this;
        var base = (cc.vv && cc.vv.http && cc.vv.http.master_url) ? cc.vv.http.master_url : "";
        //第一个参数必须是"本地清单路径": AssetsManagerEx 内部用它对本地清单做 parseFile,
        //远端清单/资源地址由本地清单里的 remoteManifestUrl / packageUrl 决定。传远端URL必然报 ERROR_NO_LOCAL_MANIFEST
        var manifestUrl = "project.manifest";
        var storagePath = this._hotStoragePath().replace(/\/$/, "");
        //release 包会剥离 console.log, 这里统一用 console.error 保证日志可见
        console.error("[HotUpdate] 本地清单:" + manifestUrl + " 服务器:" + base);
        this.showHotTip("检查更新");
        this._stateStr = "正在检查更新";
        var am = null;
        try {
            //第三个参数是版本比较函数: 必须按数字比较, 否则 1.0.10 会被当成小于 1.0.9
            am = new jsb.AssetsManager(manifestUrl, storagePath, compareVersion);
        } catch(e) {
            console.error("[HotUpdate] 创建管理器失败:" + e);
            this.checkVersion();
            return;
        }
        am.retain();
        this._hotAm = am;
        this._hotFailCount = 0;
        am.setVerifyCallback(function(path, asset){
            return true; //资源校验放行(清单md5校验由引擎下载完整性保障, 这里不做二次md5)
        });
        am.setEventCallback(function(event){
            var code = event.getEventCode();
            console.error("[HotUpdate] event:" + code + " " + (event.getMessage ? (event.getMessage() || "") : ""));
            var EV = jsb.EventAssetsManager;
            switch(code){
                case EV.ERROR_NO_LOCAL_MANIFEST:
                case EV.ERROR_DOWNLOAD_MANIFEST:
                case EV.ERROR_PARSE_MANIFEST:
                    //服务器未发布热更/清单异常:跳过热更, 直接走版本检查
                    self.showHotTip("无需热更, 继续启动");
                    self._finishHot();
                    self.checkVersion();
                    break;
                case EV.ALREADY_UP_TO_DATE:
                    self.showHotTip("已是最新版本");
                    self._finishHot();
                    self.checkVersion();
                    break;
                case EV.NEW_VERSION_FOUND:
                    self._hotCheckDone = true; //检查阶段结束, 进入下载, 不再受检查超时限制
                    self.showHotTip("发现新版本, 正在更新");
                    self.scheduleOnce(function(){
                        if(self._hotAm === am) am.update();
                    }, 0);
                    break;
                case EV.UPDATE_PROGRESSION:
                    self._stateStr = "正在更新资源";
                    self._isLoading = true;
                    var pct = event.getPercent();
                    if(pct > 100) pct = 100;
                    if(pct / 100 > self._targetProgress){
                        self._targetProgress = pct / 100; //只增不减, 复用 update() 的进度显示
                    }
                    break;
                case EV.UPDATE_FINISHED:
                    //保存搜索路径并重启; 重启后 onLoad -> applyHotUpdateSearchPaths 会应用新路径
                    try {
                        var searchPaths = jsb.fileUtils.getSearchPaths();
                        var newPaths = am.getLocalManifest().getSearchPaths();
                        if(newPaths && newPaths.length){
                            Array.prototype.unshift.apply(searchPaths, newPaths);
                        }
                        cc.sys.localStorage.setItem("HotUpdateSearchPaths", JSON.stringify({paths: searchPaths}));
                        //记录当前包指纹: 下次冷启动据此判断这份热更资源是否属于当前APK
                        cc.sys.localStorage.setItem("HotUpdateBuildStamp", self._buildStamp() || "");
                        //新下载的资源路径必须重新应用并重启一次才会加载到新JS, 清掉"已重启"标记
                        cc.sys.localStorage.removeItem("HotUpdateAppliedPaths");
                    } catch(e) {
                        console.log("[HotUpdate] 保存搜索路径失败:", e);
                    }
                    self._stateStr = "更新完成, 正在重启";
                    self._finishHot();
                    cc.game.restart();
                    break;
                case EV.UPDATE_FAILED:
                    self._hotFailCount++;
                    if(self._hotFailCount <= 3){
                        console.log("[HotUpdate] 下载失败, 第" + self._hotFailCount + "次重试");
                        am.downloadFailedAssets();
                    } else {
                        self.showHotTip("更新失败, 跳过热更");
                        self._finishHot();
                        self.checkVersion();
                    }
                    break;
                case EV.ERROR_UPDATING:
                case EV.ERROR_DECOMPRESS:
                    console.log("[HotUpdate] 资源异常:", event.getAssetId(), event.getMessage());
                    self._hotFailCount++;
                    if(self._hotFailCount > 3){
                        self.showHotTip("更新失败, 跳过热更");
                        self._finishHot();
                        self.checkVersion();
                    }
                    break;
                default:
                    break;
            }
        });
        //看门狗: 检查阶段服务器不可达/清单拉不下来时不能永远停在"检查更新", 超时后跳过热更继续启动
        this._hotCheckDone = false;
        if(this._hotWatchdog){ clearTimeout(this._hotWatchdog); }
        this._hotWatchdog = setTimeout(function(){
            if(self._hotCheckDone || self._hotAm !== am){ return; }
            console.error("[HotUpdate] 检查更新超时, 跳过热更");
            self.showHotTip("检查更新超时, 跳过");
            self._finishHot();
            self.checkVersion();
        }, 15000);
        am.checkUpdate();
    },

    //热更结束(成功重启前/跳过热更)清理事件回调; 管理器引用留到 onDestroy 统一释放
    _finishHot:function(){
        this._hotCheckDone = true;
        if(this._hotWatchdog){ clearTimeout(this._hotWatchdog); this._hotWatchdog = null; }
        if(this._hotAm){
            try { this._hotAm.setEventCallback(null); } catch(e){}
            this._hotAm = null;
        }
    },

    //热更阶段提示(不打断进度条显示)
    showHotTip:function(msg){
        console.error("[HotUpdate] " + msg);
        //同时写到加载页文字上, 真机/release 包也能直接看到热更走到哪一步
        if(this.tipLabel && cc.isValid(this.tipLabel.node)){ this.tipLabel.string = msg; }
    },

    onDestroy:function(){
        if(this._hotWatchdog){ clearTimeout(this._hotWatchdog); this._hotWatchdog = null; }
        if(this._hotAm){
            try { this._hotAm.setEventCallback(null); this._hotAm.release(); } catch(e){}
            this._hotAm = null;
        }
        if(cc.loader){ cc.loader.onProgress = null; }
    },
    //初始化组件方法
    initMgr:function(){
        cc.vv = {};
        var UserMgr = require("UserMgr");
        cc.vv.userMgr = new UserMgr();   //用户信息
        
        var ReplayMgr = require("ReplayMgr");
        cc.vv.replayMgr = new ReplayMgr();  //重播
        //网络接口
        cc.vv.http = require("HTTP");
        cc.vv.global = require("Global");
        cc.vv.net = require("Net");
        
        var GameNetMgr = require("GameNetMgr");
        cc.vv.gameNetMgr = new GameNetMgr();
        cc.vv.gameNetMgr.initHandlers();
        //anysdk
        var AnysdkMgr = require("AnysdkMgr");
        cc.vv.anysdkMgr = new AnysdkMgr();
        cc.vv.anysdkMgr.init();
        //声音音频控制
        var VoiceMgr = require("VoiceMgr");
        cc.vv.voiceMgr = new VoiceMgr();
        cc.vv.voiceMgr.init();
        
        var AudioMgr = require("AudioMgr");
        // 单例: 已存在就不要重建, 否则正在播放的 BGM 句柄会丢失(旧音乐停不掉/叠音)
        if(!cc.vv.audioMgr) { cc.vv.audioMgr = new AudioMgr(); cc.vv.audioMgr.init(); }
        //全局按钮点击音效(只挂一次, 避免与 login 场景重复包装导致双播)
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
        //工具类
        var Utils = require("Utils");
        cc.vv.utils = new Utils();
        
        // 统一场景管理(预加载 + 淡入淡出过渡,解决切场景白闪/冻结)
        try {
            var SceneMgr = require("SceneMgr");
            cc.vv.sceneMgr = new SceneMgr();
            cc.vv.sceneMgr.init();
        } catch (e) {
            console.warn("[SceneMgr] 加载失败:", e.message);
            // SceneMgr 缺失时的兜底:直接挂一个只转调 cc.director.loadScene 的空壳
            cc.vv.sceneMgr = {
                load: function (name, cb) { return cc.director.loadScene(name, cb); }
            };
        }

        cc.args = this.urlParse();
    },
    
    //获取url及url参数
    urlParse:function(){
        var params = {};
        if(window.location == null){
            return params;
        }
        var name,value; 
        var str=window.location.href; //取得整个地址栏
        var num=str.indexOf("?") 
        str=str.substr(num+1); //取得所有参数   stringvar.substr(start [, length ]
        
        var arr=str.split("&"); //各个参数放到数组里
        for(var i=0;i < arr.length;i++){ 
            num=arr[i].indexOf("="); 
            if(num>0){ 
                name=arr[i].substring(0,num);
                value=arr[i].substr(num+1);
                params[name]=value;
            } 
        }
        return params;
    },
    //检查版本更新: 无论成功/失败都必须继续预载资源并进登录页, 不能卡死在"正在连接服务器"
    checkVersion:function(){
        if(this._versionStarted){ return; } //只允许启动一次, 防止热更回调/看门狗重复触发
        this._versionStarted = true;
        var self = this;
        var tries = 0;
        var done = false;
        var finish = function(ret){
            if(done){ return; }
            done = true;
            if(ret && ret.version != null){
                cc.vv.SI = ret; //定义si接受ret
                //HTTP.url不在此处切,留给UserMgr.onAuth在登录成功后切
                if(String(ret.version) != String(cc.VERSION)){
                    console.error("[Boot] 服务器版本" + ret.version + " 与客户端" + cc.VERSION + " 不同, 继续启动");
                }
            } else {
                console.error("[Boot] 获取服务器信息失败, 继续启动");
            }
            self.startPreloading();
        };
        var request = function(){
            tries++;
            self._stateStr = "正在连接服务器";
            var xhr = null;
            try {
                xhr = cc.vv.http.sendRequest("/get_serverinfo", null, function(ret){ finish(ret); });
            } catch(e) {
                finish(null);
                return;
            }
            setTimeout(function(){
                if(done){ return; }
                if(xhr){ try { xhr.abort(); } catch(e){} }
                if(tries >= 3){
                    self._stateStr = "服务器无响应, 继续启动";
                    finish(null); //服务器连不上也要进登录页, 不能无限重试
                    return;
                }
                self._stateStr = "连接失败，即将重试";
                request();
            }, 5000);
        };
        request();
    },
     
    //开始预载资源(只允许一次)
    startPreloading:function(){
        if(this._preloadingStarted){ return; }
        this._preloadingStarted = true;
        this._stateStr = "正在加载资源，请稍候";
        this._isLoading = true;
        var self = this;

        cc.loader.onProgress = function ( completedCount, totalCount,  item ){
            //console.log("completedCount:" + completedCount + ",totalCount:" + totalCount );
            if(self._isLoading){
                //totalCount会随依赖发现中途变大导致比值回落,这里只增不减,避免进度回滚
                var p = completedCount/totalCount;
                if(p > self._targetProgress){
                    self._targetProgress = p;
                }
            }
        };

        cc.loader.loadResAll("textures", function (err, assets) {
            self.onLoadComplete();
        });
        // 轻量预载宝宝牌弹窗按钮贴图(resources按路径加载, 解决首次弹窗白块; 不做全量加载, 避免抢占连接)
        cc.resources.load("images/atlas/other_a", cc.SpriteAtlas, function () { });
        cc.resources.load("images/other/bb_btn_blue", cc.SpriteFrame, function () { });
        cc.resources.load("images/other/bb_btn_green", cc.SpriteFrame, function () { });
        cc.resources.load("images/other/按钮11", cc.SpriteFrame, function () { });
        cc.resources.load("images/other/按钮12", cc.SpriteFrame, function () { });
        // 宝宝牌牌型名图片(同花顺/炸, 透明背景)
        cc.resources.load("images/bbHandName_flush", cc.SpriteFrame, function () { });
        cc.resources.load("images/bbHandName_bomb", cc.SpriteFrame, function () { });
    },
    //加载完成
    onLoadComplete:function(){
        if(this._loginLaunched){ return; } //防止重复切场景(重复 loadScene 会造成两个页面交替显示)
        this._loginLaunched = true;
        this._isLoading = false;
        this._progress = 1;
        this._stateStr = "准备登陆";
        // 用 SceneMgr 带过渡切到登录页(loading 自己在 SceneMgr 里标记为 bypass,所以不会闪)
        if(cc.vv && cc.vv.sceneMgr){
            cc.vv.sceneMgr.load("login");
        }else{
            cc.director.loadScene("login");
        }
        cc.loader.onComplete = null;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if(this._stateStr.length == 0){
            return;
        }
        this.tipLabel.string = this._stateStr + ' ';
        if(this._isLoading){
            //显示值向目标值平滑追赶且只增不减,加载到99%后等待真实完成再补满
            if(this._progress < this._targetProgress){
                this._progress = Math.min(this._targetProgress, this._progress + dt * 0.5);
            }
            this.tipLabel.string += Math.floor(this._progress * 100) + "%";   
        }
        else{
            var t = Math.floor(Date.now() / 1000) % 4;
            for(var i = 0; i < t; ++ i){
                this.tipLabel.string += '.';
            }            
        }
    }
    
});
