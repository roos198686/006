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

    if(cc.vv.baseInfoMap[userid] != null){
        callback(userid,cc.vv.baseInfoMap[userid]);
    }
    else{
        cc.vv.http.sendRequest('/base_info',{userid:userid},function(ret){
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
            cc.vv.baseInfoMap[userid] = info;
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
        this.setupSpriteFrame();
    },

    setUserID:function(userid){
        //Web/Native 都加载真实头像(之前isNative判断导致浏览器里一直显示场景默认占位图)
        if(!userid){
            return;
        }
        if(cc.vv.images == null){
            cc.vv.images = {};
        }

        var self = this;
        getBaseInfo(userid,function(code,info){
            if(info && info.localKey){
                //内置头像:从本地资源加载
                loadLocalAvatar(info.localKey,userid,function(code2,spriteFrame){
                    if(spriteFrame){
                        self._spriteFrame = spriteFrame;
                        self.setupSpriteFrame();
                    }
                });
                return;
            }
           if(info && info.url){
                loadImage(info.url,userid,function (err,spriteFrame) {
                    if(spriteFrame){
                        self._spriteFrame = spriteFrame;
                        self.setupSpriteFrame();
                    }
                });
            }
        });
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
