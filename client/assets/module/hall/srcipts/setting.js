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
        _btnYXOpen:null,
        _btnYXClose:null,
        _btnYYOpen:null,
        _btnYYClose:null,
    },

    // use this for initialization
    onLoad: function () {
        //弹窗遮罩: 与设置面板同级的 popups/New Layout(全屏暗色), 面板显示时同步显示
        this._mask = (this.node.parent) ? this.node.parent.getChildByName("New Layout") : null;
        if(cc.vv == null){
            return;
        }
        //获取音效开关        
        this._btnYXOpen = this.node.getChildByName("yinxiao").getChildByName("btn_yx_open"); 
        this._btnYXClose = this.node.getChildByName("yinxiao").getChildByName("btn_yx_close");
        //获取音乐开关
        this._btnYYOpen = this.node.getChildByName("yinyue").getChildByName("btn_yy_open");
        this._btnYYClose = this.node.getChildByName("yinyue").getChildByName("btn_yy_close");
        //获取关闭按钮 更换账号按钮
        this.initButtonHandler(this.node.getChildByName("btn_close"));
        this.initButtonHandler(this.node.getChildByName("btn_exit"));
        
        //添加监听事件
        this.initButtonHandler(this._btnYXOpen);
        this.initButtonHandler(this._btnYXClose);
        this.initButtonHandler(this._btnYYOpen);
        this.initButtonHandler(this._btnYYClose);
        
        //添加滑动监听 音效
        var slider = this.node.getChildByName("yinxiao").getChildByName("progress");
        cc.vv.utils.addSlideEvent(slider,this.node,"setting","onSlided");
           //添加滑动监听 音乐
        var slider = this.node.getChildByName("yinyue").getChildByName("progress");
        cc.vv.utils.addSlideEvent(slider,this.node,"setting","onSlided");
        //刷新音乐
        this.refreshVolume();
    },
    
    onEnable: function () {
        if(this._mask && cc.isValid(this._mask)){ this._mask.active = true; }
    },

    onDisable: function () {
        if(this._mask && cc.isValid(this._mask)){ this._mask.active = false; }
    },

    //滑动
    onSlided:function(slider){
        if(slider.node.parent.name == "yinxiao"){
            cc.vv.audioMgr.setSFXVolume(slider.progress);
        }
        else if(slider.node.parent.name == "yinyue"){
            cc.vv.audioMgr.setBGMVolume(slider.progress);
        }
        this.refreshVolume();
    },
    
    //按钮绑定监听事件
    initButtonHandler:function(btn){
        //场景里可能已删除对应按钮(如牌桌设置弹窗删掉了btn_exit),取不到节点时跳过,
        //避免addClickEvent空引用抛错中断onLoad导致整个场景激活失败
        if(btn == null){ return; }
        cc.vv.utils.addClickEvent(btn,this.node,"setting","onBtnClicked");
    },
    //刷新音频
    refreshVolume:function(){
        
        this._btnYXClose.active = cc.vv.audioMgr.sfxVolume > 0;
        this._btnYXOpen.active = !this._btnYXClose.active;
        
        var yx = this.node.getChildByName("yinxiao");
        var width = 430 * cc.vv.audioMgr.sfxVolume;
        var progress = yx.getChildByName("progress")
        progress.getComponent(cc.Slider).progress = cc.vv.audioMgr.sfxVolume;
        progress.getChildByName("progress").width = width;  
        //yx.getChildByName("btn_progress").x = progress.x + width;
        
        
        this._btnYYClose.active = cc.vv.audioMgr.bgmVolume > 0;
        this._btnYYOpen.active = !this._btnYYClose.active;
        var yy = this.node.getChildByName("yinyue");
        var width = 430 * cc.vv.audioMgr.bgmVolume;
        var progress = yy.getChildByName("progress");
        progress.getComponent(cc.Slider).progress = cc.vv.audioMgr.bgmVolume; 
        
        progress.getChildByName("progress").width = width;
        //yy.getChildByName("btn_progress").x = progress.x + width;
    },
    
    //按钮点击监听返回事件
    onBtnClicked:function(event){
        if(event.target.name == "btn_close"){
            this.node.active = false;
        }
        else if(event.target.name == "btn_exit"){
            //房间内(宝宝牌等玩法注册了退出钩子): 退出房间, 本局未结束时由玩法排队到结算后再清退
            if(cc.vv && typeof cc.vv.bbExitHook == "function"){
                cc.vv.bbExitHook();
                return;
            }
            // 退出大厅回到登录:用 SceneMgr 过渡,防止 logout 过程中白闪
            // 同时清掉本地登录态,否则下次打开APP/回到login会被自动登录直接带回大厅
            cc.sys.localStorage.removeItem("login_account");
            cc.sys.localStorage.removeItem("login_sign");
            cc.sys.localStorage.removeItem("login_type");
            if(cc.vv.sceneMgr){
                cc.vv.sceneMgr.load("login");
            }else{
                cc.director.loadScene("login");
            }
        }
        else if(event.target.name == "btn_yx_open"){
            cc.vv.audioMgr.setSFXVolume(1.0);
            this.refreshVolume(); 
        }
        else if(event.target.name == "btn_yx_close"){
            cc.vv.audioMgr.setSFXVolume(0);
            this.refreshVolume();
        }
        else if(event.target.name == "btn_yy_open"){
            cc.vv.audioMgr.setBGMVolume(1);
            this.refreshVolume();
        }
        else if(event.target.name == "btn_yy_close"){
            cc.vv.audioMgr.setBGMVolume(0);
            this.refreshVolume();
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
