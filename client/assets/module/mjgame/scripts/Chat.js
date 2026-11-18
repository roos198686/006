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
        _chatRoot:null,
        _tabQuick:null,
        _tabEmoji:null,
        _iptChat:null,
        
        _quickChatInfo:null,
        _btnChat:null,
    },

    //动态表情骨骼名(与宝宝场景共用 anims/smile 下同一套 15 个)
    //放在 ctor 里: cc.Class 原型上不允许挂裸数据
    ctor: function () {
        this._emojiSpineNames = ["yihuo", "kuaidian", "zhenbang", "aini", "daxiao",
            "yunle", "yishoulanpai", "dengchang", "jingle", "huaixiao",
            "keshui", "886", "wolaile", "dalaozaici", "biepao"];
        this._emojiSpine = null;
        this._emojiPanelBuilt = false;
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        cc.vv.chat = this;
        
        // 场景 Canvas 下有两套同名 btn_chat/chat(前一套是禁用的旧拷贝), 必须取后面那套可用的,
        // 否则面板能打开但输入/发送都作用在隐藏的那套上 -> 消息发不出去
        // 注意: 必须用 self 闭包引用, 普通函数调用里 this 是 undefined(严格模式), 直接写 this.node 会崩
        var self = this;
        var pickLast = function (name) {
            var arr = self.node.children, found = null;
            for (var i = 0; i < arr.length; ++i) { if (arr[i].name === name) found = arr[i]; }
            return found;
        };
        this._btnChat = pickLast("btn_chat");
        if (this._btnChat) this._btnChat.active = cc.vv.replayMgr.isReplay() == false;
        
        this._chatRoot = pickLast("chat");
        if (!this._chatRoot) return;
        this._chatRoot.active = false;
        
        this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
        this._tabEmoji = this._chatRoot.getChildByName("emojis");
        
        this._iptChat = this._chatRoot.getChildByName("iptChat").getComponent(cc.EditBox);
        
        
        this._quickChatInfo = {};
        this._quickChatInfo["item0"] = {index:0,content:"快点啊，都等到我花儿都谢谢了！"};
        this._quickChatInfo["item1"] = {index:1,content:"怎么又断线了，网络怎么这么差啊！"};
        this._quickChatInfo["item2"] = {index:2,content:"不要走，决战到天亮！"};
        this._quickChatInfo["item3"] = {index:3,content:"你的牌打得也太好了！"};
        this._quickChatInfo["item4"] = {index:4,content:"你是妹妹还是哥哥啊？"};
        this._quickChatInfo["item5"] = {index:5,content:"和你合作真是太愉快了！"};
        this._quickChatInfo["item6"] = {index:6,content:"大家好，很高兴见到各位！"};
        this._quickChatInfo["item7"] = {index:7,content:"各位，真是不好意思，我得离开一会儿。"};
        this._quickChatInfo["item8"] = {index:8,content:"不要吵了，专心玩游戏吧！"};

        //表情页: 把场景里的静态表情格子换成骨骼动画(资源加载完自动替换)
        this._initEmojiSpine();
    },
    
    getQuickChatInfo(index){
        var key = "item" + index;
        return this._quickChatInfo[key];   
    },
    
    onBtnChatClicked:function(){
        if(!this._chatRoot) return;
        this._chatRoot.active = true;
    },
    
    onBgClicked:function(){
        if(!this._chatRoot) return;
        this._chatRoot.active = false;
    },
    
    onTabClicked:function(event){
        if(!this._chatRoot) return;
        if(event.target.name == "tabQuick"){
            if(this._tabQuick) this._tabQuick.active = true;
            if(this._tabEmoji) this._tabEmoji.active = false;
        }
        else if(event.target.name == "tabEmoji"){
            if(this._tabQuick) this._tabQuick.active = false;
            if(this._tabEmoji) this._tabEmoji.active = true;
        }
    },
    
    onQuickChatItemClicked:function(event){
        if(!this._chatRoot) return;
        this._chatRoot.active = false;
        var info = this._quickChatInfo[event.target.name];
        cc.vv.net.send("quick_chat",info.index); 
    },
    
    onEmojiItemClicked:function(event){
        if(!this._chatRoot) return;
        console.log(event.target.name);
        this._chatRoot.active = false;
        cc.vv.net.send("emoji",event.target.name);
    },
    
    //================== 动态表情(骨骼) ==================
    _initEmojiSpine: function(){
        if(!this._tabEmoji) return;
        var self = this;
        this._emojiSpine = {};
        var names = this._emojiSpineNames || [];
        var loadOne = function(i){
            if(i >= names.length){
                //座位气泡(Seat.js)也从这里取骨骼数据
                if(cc.vv){ cc.vv.emojiSpines = self._emojiSpine; }
                self._buildEmojiSpinePanel();
                return;
            }
            cc.resources.load("anims/smile/" + names[i], sp.SkeletonData, function(err, sd){
                if(sd){ self._emojiSpine[names[i]] = sd; }
                loadOne(i + 1);
            });
        };
        loadOne(0);
    },

    _emojiSpineSize: function(sd){
        var sk = sd && sd.skeletonJson && sd.skeletonJson.skeleton;
        return {w:(sk && sk.width) || 240, h:(sk && sk.height) || 270};
    },

    //场景里的表情格子当锚点: 隐藏原静态图, 挂骨骼子节点循环播放, 点击按最近格子发送
    _buildEmojiSpinePanel: function(){
        if(this._emojiPanelBuilt || !this._tabEmoji) return;
        //有的场景是 emojis 下套一层 grid, 有的是 15 个格子直接挂在 emojis 上
        var grid = this._tabEmoji;
        if(this._tabEmoji.children.length === 1 && this._tabEmoji.children[0].children.length > 0){
            grid = this._tabEmoji.children[0];
        }
        if(!grid || !grid.children || !grid.children.length) return;
        this._emojiPanelBuilt = true;
        var self = this;
        var names = this._emojiSpineNames;
        grid.children.slice().forEach(function(old, idx){
            var name = names[idx];
            if(!name) return;
            var btn = old.getComponent(cc.Button);
            if(btn) btn.enabled = false;      //停用原来的静态表情点击
            old.off(cc.Node.EventType.TOUCH_END);
            //每个格子自己接收点击: 不用坐标算最近格, 避免面板缩放/Widget重排后点击位置偏移
            old.on(cc.Node.EventType.TOUCH_END, function(){
                self._sendEmoji(name);
            });
            var sd = self._emojiSpine[name];
            if(!sd) return;
            var spr = old.getComponent(cc.Sprite);
            if(spr) spr.enabled = false;
            var sz = self._emojiSpineSize(sd);
            var cw = old.width > 0 ? old.width : 80;
            var ch = old.height > 0 ? old.height : 80;
            var vis = new cc.Node("skel");
            vis.parent = old;
            vis.setPosition(0, 0);
            vis.scale = Math.min(cw / sz.w, ch / sz.h) * 0.9;
            var com = vis.addComponent(sp.Skeleton);
            com.skeletonData = sd;
            com.setAnimation(0, "animation", true);
        });
    },

    _sendEmoji: function(name){
        if(this._chatRoot) this._chatRoot.active = false;
        cc.vv.net.send("emoji", name);
    },
    
    onBtnSendChatClicked:function(){
        if(!this._chatRoot) return;
        this._chatRoot.active = false;
        if(!this._iptChat || this._iptChat.string == ""){
            return;
        }
        cc.vv.net.send("chat",this._iptChat.string);
        this._iptChat.string = "";
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
