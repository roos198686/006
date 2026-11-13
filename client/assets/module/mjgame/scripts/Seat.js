cc.Class({
    extends: cc.Component,

    properties: {
        _sprIcon:null,  
        _zhuang:null,
        _ready:null,
        _offline:null,
        _lblName:null,
        _lblScore:null,
        _scoreBg:null,
        _nddayingjia:null,
        _voicemsg:null,
        
        _chatBubble:null,
        _emoji:null,
        _lastChatTime:-1,
        
        //场景里额外那棵 ncSprite 子树(昵称+积分, 玩家进来才显示; 没进座位 active=false)
        _ncSprite:null,
        _ncLblName:null,
        _ncLblScore:null,
        
        _userName:"",
        _score:0,
        _dayingjia:false,
        _isOffline:false,
        _isReady:false,
        _isZhuang:false,
        _userId:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        this._sprIcon = this.node.getChildByName("icon").getComponent("ImageLoader");
        //兼容:场景icon节点漏挂ImageLoader时运行时补挂,保证头像一定能加载
        if(!this._sprIcon){
            this._sprIcon = this.node.getChildByName("icon").addComponent("ImageLoader");
        }
        //头像尺寸/位置/层级以场景内icon节点的设计值为准(80x80、玻璃底层之上),此处不再覆盖
        //获取名字(宽度对齐头像框,字号缩小,不换行,超出部分裁剪隐藏)
        //场景可能改用 ncSprite 子树显示昵称(老布局才有直接子节点 name),取不到时为 null,不能直接 getComponent
        var nameNode = this.node.getChildByName("name");
        this._lblName = nameNode ? nameNode.getComponent(cc.Label) : null;
        var iconNode = this.node.getChildByName("icon");
        if(iconNode && this._lblName){
            this._lblName.node.width = iconNode.width + 16;
        }
        if(this._lblName){
            this._lblName.fontSize = Math.min(this._lblName.fontSize, 18);
            this._lblName.lineHeight = this._lblName.fontSize + 2;
            this._lblName.enableWrapText = false;
            this._lblName.overflow = cc.Label.Overflow.CLAMP;
        }
        //获取分数(同上,老布局才有直接子节点 score)
        var scoreNode = this.node.getChildByName("score");
        this._lblScore = scoreNode ? scoreNode.getComponent(cc.Label) : null;
        //获取语音
        this._voicemsg = this.node.getChildByName("voicemsg");
        
        //判断语音出了你是否有其他人在说话
        if(this._voicemsg){
            this._voicemsg.active = false;
        }
        
        if(this._sprIcon && this._sprIcon.getComponent(cc.Button)){
            cc.vv.utils.addClickEvent(this._sprIcon,this.node,"Seat","onIconClicked");    
        }
        
        
        this._offline = this.node.getChildByName("offline");
        
        this._ready = this.node.getChildByName("ready");
        
        //庄标用场景自带zhuang节点;场景里默认active=true,先隐藏,等setZhuang按真实庄家显示
        this._zhuang = this.node.getChildByName("zhuang");
        if(this._zhuang){ this._zhuang.active = false; }
        
        this._scoreBg = this.node.getChildByName("Z_money_frame");
        this._nddayingjia = this.node.getChildByName("dayingjia");
        
        //ncSprite: 场景里额外那棵昵称+积分子树(默认active=false, 玩家进来才显示)
        this._ncSprite = this.node.getChildByName("ncSprite");
        if(this._ncSprite){
            var ncNameNode = this._ncSprite.getChildByName("name");
            var ncScoreNode = this._ncSprite.getChildByName("score");
            this._ncLblName = ncNameNode ? ncNameNode.getComponent(cc.Label) : null;
            this._ncLblScore = ncScoreNode ? ncScoreNode.getComponent(cc.Label) : null;
            this._ncSprite.active = false; //初始未入座时强制隐藏, refresh()里按 userName 自动打开
        }
        
        this._chatBubble = this.node.getChildByName("ChatBubble");
        if(this._chatBubble != null){
            this._chatBubble.active = false;
            // 初始化: New Label 默认 inactive, chat() 里启用
            var newLbl = this._chatBubble.getChildByName("New Label");
            if(newLbl) newLbl.active = false;
        }
        
        this._emoji = this.node.getChildByName("emoji");
        if(this._emoji != null){
            this._emoji.active = false;
        }
        
        this.refresh();
        
        if(this._sprIcon && this._userId){
            this._sprIcon.setUserID(this._userId);
        }
    },
    
    onIconClicked:function(){
        var iconSprite = this._sprIcon.node.getComponent(cc.Sprite);
        if(this._userId != null && this._userId > 0){
           var seat = cc.vv.gameNetMgr.getSeatByID(this._userId);
            var sex = 0;
            if(cc.vv.baseInfoMap){
                var info = cc.vv.baseInfoMap[this._userId];
                if(info){
                    sex = info.sex;
                }                
            }
            cc.vv.userinfoShow.show(seat.name,seat.userid,iconSprite,sex,seat.ip);         
        }
    },
    
    refresh:function(){
        if(this._lblName != null){
            this._lblName.string = this._userName;    
        }
        
        if(this._lblScore != null){
            this._lblScore.string = this._score;            
        }

        //ncSprite: 玩家入座后显示昵称+积分, 离开自动隐藏
        if(this._ncSprite){
            var hasUser = (this._userName != null && this._userName !== "");
            this._ncSprite.active = hasUser;
            if(this._ncLblName){ this._ncLblName.string = this._userName || ""; }
            if(this._ncLblScore){ this._ncLblScore.string = this._score != null ? this._score : 0; }
        }        
        
        if(this._nddayingjia != null){
            this._nddayingjia.active = this._dayingjia == true;
        }
        
        if(this._offline){
            this._offline.active = this._isOffline && this._userName != "";
        }
        
        if(this._ready){
            this._ready.active = this._isReady && this._canShowReady();
        }
        
        if(this._zhuang){
            this._zhuang.active = this._isZhuang;    
        }
        
        this.node.active = this._userName != null && this._userName != ""; 
    },
    
    setInfo(name,score,dayingjia){
        this._userName = name;
        this._score = score;
        if(this._score == null){
            this._score = 0;
        }
        this._dayingjia = dayingjia;
        
        if(this._scoreBg != null){
            this._scoreBg.active = this._score != null;            
        }

        if(this._lblScore != null){
            this._lblScore.node.active = this._score != null;            
        }

        this.refresh();    
    },
    
    setZhuang:function(value){
        this._isZhuang = value;
        if(this._zhuang == null){ this._zhuang = this.node.getChildByName("zhuang"); }
        if(this._zhuang){ this._zhuang.active = value; }
    },

    //老庄(连庄)标识:连庄次数>=1时在庄标下方显示"老庄X"
    setLaoZhuang:function(count){
        var lz = this.node.getChildByName("laozhuang");
        if(lz == null){
            var icon = this.node.getChildByName("icon");
            var bx = icon ? icon.x + 28 : 34;
            var by = icon ? icon.y + 28 : 34;
            lz = new cc.Node("laozhuang");
            lz.setContentSize(90,22);
            lz.setPosition(bx,by - 24);
            this.node.addChild(lz);
            var lbl = lz.addComponent(cc.Label);
            lbl.fontSize = 18;
            lbl.lineHeight = 22;
            lbl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            lbl.verticalAlign = cc.Label.VerticalAlign.CENTER;
            lbl.overflow = cc.Label.Overflow.NONE;
            lz.color = cc.color(255,225,120);
            var ol = lz.addComponent(cc.LabelOutline);
            ol.color = cc.color(60,30,0);
            ol.width = 2;
        }
        var show = (count != null && count >= 1);
        lz.active = show;
        if(show){
            var l = lz.getComponent(cc.Label);
            if(l){ l.string = "老庄" + count; }
        }
    },

    //"已准备"标识只在首局开局前显示;开局后(含胡牌结算期点准备)永久隐藏,不再出现在牌桌上
    _canShowReady:function(){
        return !!(cc.vv && cc.vv.gameNetMgr && cc.vv.gameNetMgr.numOfGames == 0);
    },

    setReady:function(isReady){
        this._isReady = isReady;
        if(this._ready){
            this._ready.active = this._isReady && this._canShowReady();
        }
    },
    
    setID:function(id){
        var idNode = this.node.getChildByName("id");
        if(idNode){
            var lbl = idNode.getComponent(cc.Label);
            lbl.string = "ID:" + id;            
        }
        
        this._userId = id;
        if(this._sprIcon){
            this._sprIcon.setUserID(id); 
        }
    },
    
    setOffline:function(isOffline){
        this._isOffline = isOffline;
        if(this._offline){
            this._offline.active = this._isOffline && this._userName != "";
        }
    },
    
    chat:function(content){
        if(this._chatBubble == null){
            return;
        }
        this._chatBubble.active = true;
        this._emoji.active = false;
        var lblNode = this._chatBubble.getChildByName("New Label");
        if(lblNode){
            lblNode.active = true;
            var lbl = lblNode.getComponent(cc.Label);
            if(lbl){
                lbl.string = content;
                lbl.node.color = cc.color(255,255,255,255);
            }
        }
        // chatbg_ld: 气泡底图
        var bgNode = this._chatBubble.getChildByName("chatbg_ld");
        if(bgNode){
            bgNode.active = true;
            var bgSprite = bgNode.getComponent(cc.Sprite);
            if(bgSprite && !bgSprite.spriteFrame){
                cc.loader.loadRes("images/chat/chat_backbg", cc.SpriteFrame, function(err, sf){
                    if(!err && bgSprite){ bgSprite.spriteFrame = sf; }
                });
            }
        }
        this._lastChatTime = 3;
    },
    
    emoji:function(emoji){
        if(this._emoji == null){
            return;
        }
        this._chatBubble.active = false;
        this._emoji.active = true;
        this._emoji.getComponent(cc.Animation).play(emoji);
        this._lastChatTime = 3;
    },
    
    voiceMsg:function(show){
        if(this._voicemsg){
            this._voicemsg.active = show;
        }
    },
   
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if(this._lastChatTime > 0){
            this._lastChatTime -= dt;
            if(this._lastChatTime < 0){
                this._chatBubble.active = false;
                this._emoji.active = false;
                this._emoji.getComponent(cc.Animation).stop();
            }
        }
    },
});
