function loadImage(url,code,callback){
    cc.assetManager.loadRemote(url,function (err,tex) {
        if(err || !tex){ callback(code,null); return; }
        var spriteFrame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));
        callback(code,spriteFrame);
    });
};

//加载内置头像(服务器headimg存的本地key,如 avatar_01)
function loadLocalAvatar(key,code,callback){
    cc.resources.load("images/avatars/" + key, cc.SpriteFrame, function(err, sf){
        if(err || !sf){ callback(code,null); return; }
        callback(code,sf);
    });
};

//基础信息(含头像)缓存5分钟: 过期后重新拉取, 玩家换头像/改名能同步到座位头像
var BASE_INFO_TTL = 5 * 60 * 1000;

function getBaseInfo(userid,callback){
    if(cc.vv.baseInfoMap == null){
        cc.vv.baseInfoMap = {};
    }

    var now = Date.now();
    var cached = cc.vv.baseInfoMap[userid];
    //只有真正拿到头像地址(localKey/url)的缓存才算"新鲜":
    //俱乐部场景写进来的精简条目(只有 name/sex/url:null)不能当成有效缓存,否则会一直显示默认头像
    var hasKey = !!(cached && (cached.localKey || cached.url));
    if(hasKey && (now - (cached.ts || 0) < BASE_INFO_TTL)){
        callback(userid,cached);
        return;
    }
    //没拿到头像(服务端可能正在分配)时最多每5秒重试一次,避免座位反复刷新时刷屏请求
    if(cached && cached._tryAt && (now - cached._tryAt) < 5000){
        callback(userid,cached);
        return;
    }
    if(cached){ cached._tryAt = now; }
    else{ cc.vv.baseInfoMap[userid] = { _tryAt: now }; }

    cc.vv.http.sendRequest('/base_info',{userid:userid},function(ret){
        if(!ret || ret.errcode){
            var bad = cc.vv.baseInfoMap[userid] || {};
            bad._tryAt = Date.now();
            cc.vv.baseInfoMap[userid] = bad;
            callback(userid,{url:null,localKey:null});
            return;
        }
        var url = null;
        var localKey = null;
        if(ret.headimgurl){
            if(/^avatar_\d{1,3}$/.test(ret.headimgurl)){
                localKey = ret.headimgurl; //内置头像key
            }
            else{
                url = ret.headimgurl + ".jpg"; //微信等远程头像
            }
        }
        var info = {
            name:ret.name,
            sex:ret.sex,
            url:url,
            localKey:localKey,
            ts:Date.now(),
            _tryAt: Date.now()
        }
        if(url || localKey){
            cc.vv.baseInfoMap[userid] = info;
        }
        else{
            //没头像地址:保留昵称/性别,记下这次请求时间,稍后再重试拉取
            var keep = cc.vv.baseInfoMap[userid] || {};
            keep.name = info.name;
            keep.sex = info.sex;
            keep.url = null;
            keep.localKey = null;
            keep.ts = keep.ts || info.ts;
            keep._tryAt = info._tryAt;
            cc.vv.baseInfoMap[userid] = keep;
        }
        callback(userid,info);

    },cc.vv.http.master_url);
};

cc.Class({
    extends: cc.Component,

    properties: {
    },

    //onLoad 不做任何布局操作:头像直接设到本节点场景里已有的 Sprite 上
    onLoad: function () {
        //记下场景里的默认占位头像: 换人/清空时回到它, 而不是留着上一位玩家的脸
        this._defaultFrame = null;
        var spr0 = this.node.getComponent(cc.Sprite);
        if(spr0){ this._defaultFrame = spr0.spriteFrame; }
        this.setupSpriteFrame();
    },

    setUserID:function(userid){
        //Web/Native 都加载真实头像(之前isNative判断导致浏览器里一直显示场景默认占位图)
        if(!userid){
            this.clearAvatar();
            return;
        }
        var uid = "" + userid;
        var self = this;
        if(this._userid === uid && this._spriteFrame){
            //同一个人: 缓存过期会重新拉一次, 只有头像地址变了才换图, 没变保持当前图不闪
            getBaseInfo(userid,function(code,info){
                if(self._userid !== uid){ return; }
                var key = (info && (info.localKey || info.url)) || null;
                if(!key || key === self._appliedKey){ return; }
                self._applyInfo(uid,info);
            });
            return;
        }
        //座位节点会被复用: 记录当前要显示的用户, 异步回调回来时若座位已换人则丢弃, 避免把上一位玩家的头像贴到新玩家身上
        if(this._userid !== uid){ this._avatarRetry = 0; } //换人才重置重试次数(同一人重试时保留计数,避免无限重试)
        this._userid = uid;
        this._spriteFrame = null;
        this._appliedKey = null;
        var spr = this.node.getComponent(cc.Sprite);
        if(spr){ spr.spriteFrame = this._defaultFrame || null; } //先回到占位图, 不残留旧头像
        getBaseInfo(userid,function(code,info){
            if(self._userid !== uid){ return; }
            self._applyInfo(uid,info);
        });
    },

    //按基础信息加载头像(内置头像走本地资源, 微信头像走远程URL)
    _applyInfo:function(uid,info){
        var self = this;
        var key = (info && (info.localKey || info.url)) || null;
        this._appliedKey = key;
        if(info && info.localKey){
            //内置头像:从本地资源加载
            loadLocalAvatar(info.localKey,uid,function(code2,spriteFrame){
                if(!spriteFrame || self._userid !== uid || self._appliedKey !== key){ return; }
                self._spriteFrame = spriteFrame;
                self.setupSpriteFrame();
            });
            return;
        }
        if(info && info.url){
            loadImage(info.url,uid,function(err,spriteFrame){
                if(!spriteFrame || self._userid !== uid || self._appliedKey !== key){ return; }
                self._spriteFrame = spriteFrame;
                self.setupSpriteFrame();
            });
            return;
        }
        //没拿到头像地址(服务端可能还没分配/请求失败):过几秒自动重试,避免座位一直停在默认头像
        if(this._avatarRetry == null){ this._avatarRetry = 0; }
        if(this._avatarRetry < 3){
            this._avatarRetry++;
            var uid2 = uid;
            setTimeout(function(){
                if(!self.node || !cc.isValid(self.node)){ return; }
                if(self._userid !== uid2 || self._spriteFrame){ return; }
                self.setUserID(parseInt(uid2) || uid2);
            }, 5200);
        }
    },

    //清空头像(座位隐藏/换人时调用): 同时清掉记录的 userid, 让还在路上的异步结果失效
    clearAvatar:function(){
        this._userid = null;
        this._spriteFrame = null;
        this._appliedKey = null;
        var spr = this.node.getComponent(cc.Sprite);
        if(spr){ spr.spriteFrame = this._defaultFrame || null; }
    },

    //只把头像帧设到本节点的 Sprite 上:不新建节点、不改尺寸/位置/锚点/遮罩/圆角
    setupSpriteFrame:function(){
        if(this._spriteFrame){
            var spr = this.node.getComponent(cc.Sprite);
            if(spr){
                spr.spriteFrame = this._spriteFrame;
            }
        }
    },
});
