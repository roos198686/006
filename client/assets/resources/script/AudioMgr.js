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
        bgmVolume:1.0,
        sfxVolume:1.0,
        
        bgmAudioID:-1,
    },

    // use this for initialization
    init: function () {
        if (this._inited) return;
        this._inited = true;
        this._clips = {};        // 已加载音频缓存: 手机端每次 play 都走异步加载会延迟/漏播短音效
        this._bgmUrl = null;     // 当前应播放的背景音乐, 供手势解锁后补播
        this._unlocked = false;
        var self = this;
        // 手工 new 出来的实例拿不到 properties 默认值, 这里兜底, 否则 play 时音量是 undefined
        if (typeof this.bgmVolume !== "number") this.bgmVolume = 1.0;
        if (typeof this.sfxVolume !== "number") this.sfxVolume = 1.0;
        var t = cc.sys.localStorage.getItem("bgmVolume");
        if(t != null){
            var v = parseFloat(t);
            if(v >= 0 && v <= 1) this.bgmVolume = v;
        }

        var t2 = cc.sys.localStorage.getItem("sfxVolume");
        if(t2 != null){
            var v2 = parseFloat(t2);
            if(v2 >= 0 && v2 <= 1) this.sfxVolume = v2;
        }

        cc.game.on(cc.game.EVENT_HIDE, function () {
            console.log("cc.audioEngine.pauseAll");
            cc.audioEngine.pauseAll();
        });
        cc.game.on(cc.game.EVENT_SHOW, function () {
            console.log("cc.audioEngine.resumeAll");
            self.resumeAll();
        });

        // 手机端浏览器/WebView/微信小游戏: 首次用户触摸之前, 浏览器会拦截自动播放, 表现为进游戏后全程没声音.
        // 这里监听首个手势, 解锁后再把当前背景音乐重放一次
        var unlock = function () { self._onUserGesture(); };
        if (typeof document !== "undefined" && document.addEventListener) {
            document.addEventListener("touchstart", unlock, false);
            document.addEventListener("touchend", unlock, false);
            document.addEventListener("mousedown", unlock, false);
        }
        // 微信小游戏没有 document, 用 wx 的触摸回调解锁
        if (typeof wx !== "undefined" && wx && wx.onTouchStart) {
            wx.onTouchStart(unlock);
        }
    },

    // 首个用户手势: 唤醒 WebAudio 并补播被浏览器拦截的背景音乐(只做一次)
    _onUserGesture: function () {
        if (this._unlocked) return;
        this._unlocked = true;
        // 原生 App 没有自动播放限制, 不需要重播
        var isWX = (typeof wx !== "undefined" && wx && wx.getSystemInfoSync);
        if (!cc.sys.isBrowser && !isWX) return;
        try { cc.audioEngine.resumeAll(); } catch (e) {}
        if (this._bgmUrl) {
            if (this.bgmAudioID >= 0) {
                try { cc.audioEngine.stop(this.bgmAudioID); } catch (e) {}
                this.bgmAudioID = -1;
            }
            this.playBGM(this._bgmUrl);
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
    
    //通过resources加载AudioClip,避免cc.url.raw弃用及"Wrong type of AudioClip"错误
    // 命中缓存直接回调; 未命中按 带扩展名 -> 去扩展名 -> 换另一格式 顺序尝试(手机端部分平台只认其一)
    _loadClip:function(url, cb){
        var self = this;
        var cache = this._clips || (this._clips = {});
        if(cache[url]){ cb(cache[url]); return; }
        var hasExt = /\.[^\/]+$/.test(url);
        var noExt = hasExt ? url.replace(/\.[^\/]+$/, "") : url;
        var wav = /\.wav$/i.test(url);
        var tries = hasExt
            ? ["sounds/" + url, "sounds/" + noExt, "sounds/" + noExt + (wav ? ".mp3" : ".wav")]
            : ["sounds/" + url + ".mp3", "sounds/" + url, "sounds/" + url + ".wav"];
        var i = 0;
        function next(){
            if(i >= tries.length){ console.log("[AudioMgr]加载失败:", url); cb(null); return; }
            var path = tries[i++];
            cc.resources.load(path, cc.AudioClip, function(err, clip){
                if(err || !clip){ next(); return; }
                cache[url] = clip;
                cb(clip);
            });
        }
        next();
    },
    
    playBGM(url){
        var self = this;
        this._bgmUrl = url;
        this._loadClip(url, function(clip){
            if(!clip) return;
            if(self.bgmAudioID >= 0){
                try { cc.audioEngine.stop(self.bgmAudioID); } catch (e) {}
                self.bgmAudioID = -1;
            }
            self.bgmAudioID = cc.audioEngine.play(clip,true,self.bgmVolume);
        });
    },
    
    playSFX(url){
        var self = this;
        if(this.sfxVolume > 0){
            this._loadClip(url, function(clip){
                if(!clip) return;
                cc.audioEngine.play(clip,false,self.sfxVolume);
            });
        }
    },
    
    setSFXVolume:function(v){
        if(this.sfxVolume != v){
            cc.sys.localStorage.setItem("sfxVolume",v);
            this.sfxVolume = v;
        }
    },
    
    setBGMVolume:function(v,force){
        if(this.bgmAudioID >= 0){
            if(v > 0){
                cc.audioEngine.resume(this.bgmAudioID);
            }
            else{
                cc.audioEngine.pause(this.bgmAudioID);
            }
            //cc.audioEngine.setVolume(this.bgmAudioID,this.bgmVolume);
        }
        if(this.bgmVolume != v || force){
            cc.sys.localStorage.setItem("bgmVolume",v);
            this.bgmVolume = v;
            if(this.bgmAudioID >= 0) cc.audioEngine.setVolume(this.bgmAudioID,v);
        }
    },
    
    pauseAll:function(){
        cc.audioEngine.pauseAll();
    },
    
    resumeAll:function(){
        cc.audioEngine.resumeAll();
        //音乐开关处于关闭时, 切回前台/录音结束的 resumeAll 不能把静音的音乐重新放出来
        if(this.bgmVolume <= 0 && this.bgmAudioID >= 0){
            cc.audioEngine.pause(this.bgmAudioID);
        }
    }
});
