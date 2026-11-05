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
        _isCapturing:false,
    },

    // use this for initialization
    onLoad: function () {
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
    
    init:function(){
        this.ANDROID_API = "com/vivigames/scmj/WXAPI";
        this.IOS_API = "AppController";
    },
    
    login:function(){
        if(cc.sys.os == cc.sys.OS_ANDROID){ 
            jsb.reflection.callStaticMethod(this.ANDROID_API, "Login", "()V");
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod(this.IOS_API, "login");
        }
        else{
            console.log("platform:" + cc.sys.os + " dosn't implement share.");
        }
    },
    
    share:function(title,desc){
        if(cc.sys.os == cc.sys.OS_ANDROID){
            jsb.reflection.callStaticMethod(this.ANDROID_API, "Share", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V",cc.vv.SI.appweb,title,desc);
        }
        else if(cc.sys.os == cc.sys.OS_IOS){
            jsb.reflection.callStaticMethod(this.IOS_API, "share:shareTitle:shareDesc:",cc.vv.SI.appweb,title,desc);
        }
        else{
            console.log("platform:" + cc.sys.os + " dosn't implement share.");
        }
    },

    //复制文本到剪贴板: 原生走 AppActivity.copyText(Android) / AppController.copyText:(iOS),
    //Web/预览用隐藏输入框兜底; 返回是否复制成功
    copyText:function(text){
        text = "" + (text == null ? "" : text);
        if(cc.sys.isNative && typeof jsb != "undefined" && jsb.reflection){
            try{
                if(cc.sys.os == cc.sys.OS_ANDROID){
                    return !!jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "copyText", "(Ljava/lang/String;)Z", text);
                }
                if(cc.sys.os == cc.sys.OS_IOS){
                    return !!jsb.reflection.callStaticMethod(this.IOS_API, "copyText:", text);
                }
            }catch(e){ console.log("[anysdk] copyText native fail", e); }
        }
        try{
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.left = "-9999px";
            ta.style.top = "0";
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            var ok = document.execCommand("copy");
            document.body.removeChild(ta);
            return !!ok;
        }catch(e2){ console.log("[anysdk] copyText dom fail", e2); }
        return false;
    },

    //复制APP链接(好友点开链接可直接拉起/下载APP); 返回是否复制成功
    copyShareLink:function(){
        var url = (cc.vv.SI && cc.vv.SI.appweb) ? ("" + cc.vv.SI.appweb) : "";
        if(!url){ return false; }
        return this.copyText(url);
    },
    
    shareResult:function(){
        if(this._isCapturing){
            return;
        }
        this._isCapturing = true;
        var size = cc.director.getWinSize();
        var currentDate = new Date();
        var fileName = "result_share.jpg";
        var fullPath = jsb.fileUtils.getWritablePath() + fileName;
        if(jsb.fileUtils.isFileExist(fullPath)){
            jsb.fileUtils.removeFile(fullPath);
        }
        var texture = new cc.RenderTexture(Math.floor(size.width), Math.floor(size.height));
        texture.setPosition(cc.p(size.width/2, size.height/2));
        texture.begin();
        cc.director.getRunningScene().visit();
        texture.end();
        texture.saveToFile(fileName, cc.IMAGE_FORMAT_JPG);
        
        var self = this;
        var tryTimes = 0;
        var fn = function(){
            if(jsb.fileUtils.isFileExist(fullPath)){
                var height = 100;
                var scale = height/size.height;
			    var width = Math.floor(size.width * scale);
                
                if(cc.sys.os == cc.sys.OS_ANDROID){
                    jsb.reflection.callStaticMethod(self.ANDROID_API, "ShareIMG", "(Ljava/lang/String;II)V",fullPath,width,height);
                }
                else if(cc.sys.os == cc.sys.OS_IOS){
                    jsb.reflection.callStaticMethod(self.IOS_API, "shareIMG:width:height:",fullPath,width,height);
                }
                else{
                    console.log("platform:" + cc.sys.os + " dosn't implement share.");
                }
                self._isCapturing = false;
            }
            else{
                tryTimes++;
                if(tryTimes > 10){
                    console.log("time out...");
                    return;
                }
                setTimeout(fn,50); 
            }
        }
        setTimeout(fn,50);
    },
    
    onLoginResp:function(code){
        var data = {code:code,os:cc.sys.os};
        //本机已有游客账号时带上,服务端自动完成游客账号与微信账号的绑定
        var guest = cc.sys.localStorage.getItem("account");
        if(guest && guest.indexOf("guest_") === 0){
            data.bind_account = guest;
        }
        var fn = function(ret){
            if(ret.errcode == 0){
                cc.sys.localStorage.setItem("wx_account",ret.account);
                cc.sys.localStorage.setItem("wx_sign",ret.sign);
            }
            else if(cc.vv.wc && cc.vv.wc.showError){
                cc.vv.wc.showError(ret.errmsg == "wechat login disabled" ? "后台已关闭微信登录" : "微信登录失败,请重试");
                return;
            }
            cc.vv.userMgr.onAuth(ret);
        }
        cc.vv.http.sendRequest("/wechat_auth",data,fn);
    },
});
