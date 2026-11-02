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

function getBaseInfo(userid,callback){
    if(cc.vv.baseInfoMap == null){
        cc.vv.baseInfoMap = {};
    }

    //缓存可能是俱乐部场景写的(只有 name/sex/url, 没有 localKey), 这种条目要重新拉, 否则内置头像会被当成远程地址加载失败
    var cached = cc.vv.baseInfoMap[userid];
    if(cached != null && ("localKey" in cached || "url" in cached)){
        callback(userid,cached);
    }
    else{
        cc.vv.http.sendRequest('/base_info',{userid:userid},function(ret){
            if(!ret || ret.errcode){ callback(userid,{url:null,localKey:null}); return; }
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
            }
            //没有头像地址的响应不缓存: 服务端可能正在补随机头像, 下次重新拉取就能拿到
            if(url || localKey){ cc.vv.baseInfoMap[userid] = info; }
            callback(userid,info);

        },cc.vv.http.master_url);
    }
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
        if(this._userid === uid && this._spriteFrame){ return; } //同一个人重复渲染不重载
        //座位节点会被复用: 记录当前要显示的用户, 异步回调回来时若座位已换人则丢弃, 避免把上一位玩家的头像贴到新玩家身上
        this._userid = uid;
        this._spriteFrame = null;
        var spr = this.node.getComponent(cc.Sprite);
        if(spr){ spr.spriteFrame = this._defaultFrame || null; } //先回到占位图, 不残留旧头像
        var self = this;
        getBaseInfo(userid,function(code,info){
            if(self._userid !== uid){ return; }
            if(info && info.localKey){
                //内置头像:从本地资源加载
                loadLocalAvatar(info.localKey,userid,function(code2,spriteFrame){
                    if(!spriteFrame || self._userid !== uid){ return; }
                    self._spriteFrame = spriteFrame;
                    self.setupSpriteFrame();
                });
                return;
            }
           if(info && info.url){
                loadImage(info.url,userid,function (err,spriteFrame) {
                    if(!spriteFrame || self._userid !== uid){ return; }
                    self._spriteFrame = spriteFrame;
                    self.setupSpriteFrame();
                });
            }
        });
    },

    //清空头像(座位隐藏/换人时调用): 同时清掉记录的 userid, 让还在路上的异步结果失效
    clearAvatar:function(){
        this._userid = null;
        this._spriteFrame = null;
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
