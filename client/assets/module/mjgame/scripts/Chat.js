var EmojiController = require("EmojiController");

cc.Class({
    extends: cc.Component,

    properties: {
        _chatRoot:null,
        _tabQuick:null,
        _tabEmoji:null,
        _iptChat:null,
        _quickChatInfo:null,
        _btnChat:null,
        _emojiController:null,
        _sssGame:null,
    },

    onLoad: function () {
        if(cc.vv == null){
            return;
        }

        cc.vv.chat = this;

        // 场景 Canvas 下可能有两套同名节点，优先使用最后一套启用中的节点。
        var self = this;
        this._sssGame = this.node.getComponent("SSSGame");
        var pickLast = function (name) {
            var arr = self.node.children, found = null;
            for (var i = 0; i < arr.length; ++i) {
                if (arr[i].name === name && (arr[i].active || !found)) found = arr[i];
            }
            return found;
        };
        this._btnChat = pickLast("btn_chat");
        if (this._btnChat) this._btnChat.active = cc.vv.replayMgr.isReplay() == false;

        this._chatRoot = pickLast("chat");
        if (!this._chatRoot) return;
        this._chatRoot.active = false;

        this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
        this._tabEmoji = this._chatRoot.getChildByName("emojis");
        var ipt = this._chatRoot.getChildByName("iptChat");
        this._iptChat = ipt ? ipt.getComponent(cc.EditBox) : null;

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

        this._emojiController = new EmojiController({
            canvas: this.node,
            chatPanel: this._chatRoot,
            chatEmojiList: this._tabEmoji,
            logTag: this._sssGame ? "SSS" : "MJ",
            getSelfUserId: function () {
                return cc.vv && cc.vv.userMgr ? cc.vv.userMgr.userId : 0;
            },
            getInteractTarget: function () {
                if (self._sssGame) return self._sssGame._interactUserId || 0;
                return cc.vv.userinfoShow ? cc.vv.userinfoShow._userId : 0;
            },
            resolveAvatar: function (userId) {
                if (self._sssGame) return self._sssGame._resolveEmojiAvatar(userId);
                return self._resolveAvatar(userId);
            },
            closeUserInfo: function () {
                if (self._sssGame) self._sssGame.onUserInfoClose();
                else if (cc.vv.userinfoShow) cc.vv.userinfoShow.onClicked();
            },
            isReplay: function () {
                return !!(cc.vv && cc.vv.replayMgr && cc.vv.replayMgr.isReplay());
            }
        });
    },

    _resolveAvatar: function (userId) {
        var nm = cc.vv && cc.vv.gameNetMgr;
        var handler = nm && nm.dataEventHandler;
        var room = handler ? handler.getComponent("MJRoom") : null;
        if (!room) return null;
        var primary = room._inGame ? room._seats2 : room._seats;
        var fallback = room._inGame ? room._seats : room._seats2;
        function find(list) {
            if (!list) return null;
            for (var i = 0; i < list.length; ++i) {
                var seat = list[i];
                if (seat && seat.node && seat.node.activeInHierarchy && Number(seat._userId) === Number(userId)) return seat;
            }
            return null;
        }
        var seat = find(primary) || find(fallback);
        if (!seat) return null;
        var gameIndex = room._seats2 ? room._seats2.indexOf(seat) : -1;
        var upIndex = room._seats2 && room._seats2.length === 2 ? 1 : 2;
        var icon = seat._sprIcon ? seat._sprIcon.node : seat.node.getChildByName("icon");
        return { icon: icon, key: "mj:" + userId, topAligned: gameIndex === upIndex };
    },

    handleEmojiPush: function (data) {
        if (this._emojiController) this._emojiController.handlePush(data);
    },

    clearEmoji: function (userId) {
        if (this._emojiController) this._emojiController.clear(userId);
    },

    bindUserInfo: function (userinfo) {
        if (this._emojiController) this._emojiController.bindUserInfo(userinfo);
    },

    sendInteract: function (name, userId) {
        if (this._emojiController) this._emojiController.sendInteract(name, userId);
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
        if(!info) return;
        if(this._sssGame) this._sssGame._showChatBubble(cc.vv.userMgr.userId, info.content);
        cc.vv.net.send("quick_chat",info.index);
    },

    onEmojiItemClicked:function(event){
        this._sendEmoji(event.target.name);
    },

    _sendEmoji: function(name){
        if (this._emojiController) this._emojiController.sendNormal(name);
    },

    onBtnSendChatClicked:function(){
        if(!this._chatRoot) return;
        this._chatRoot.active = false;
        if(!this._iptChat || this._iptChat.string == ""){
            return;
        }
        if(this._sssGame) this._sssGame._showChatBubble(cc.vv.userMgr.userId, this._iptChat.string);
        cc.vv.net.send("chat",this._iptChat.string);
        this._iptChat.string = "";
    },

    onDestroy: function () {
        if (this._emojiController) this._emojiController.destroy();
        this._emojiController = null;
        if (cc.vv && cc.vv.chat === this) cc.vv.chat = null;
    }
});
