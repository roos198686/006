cc.Class({
    extends: cc.Component,

    properties: {
        _gameresult:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }

        this._gameresult = this.node.getChildByName("game_result");
        //结算面板宽度/列表容器/行模板都在场景里摆好,JS不再创建节点或改尺寸

        var btnClose = cc.find("Canvas/game_result/btnClose");
        var btnShare = cc.find("Canvas/game_result/btnShare");
        if(btnShare){
            //按钮样式/位置/文字已固化在场景文件中(红底+退出房间),JS只绑定点击事件
            cc.vv.utils.addClickEvent(btnShare,this.node,"GameResult","onBtnCloseClicked");
        }
        if(btnClose){
            btnClose.active = false;
        }

        //初始化网络事件监听器
        var self = this;
        this.node.on('game_end',function(data){
            var d = data.detail || {};
            self._pendingEnd = {endinfo:d.endinfo, roundHistory:d.roundHistory};
            //最后一小局:小局结算弹窗还没弹出或仍在显示时,总局结算必须等它关闭后再显示
            var pending = false;
            var g1 = self.getComponent("GameOver");
            if(g1 && g1._isRoundSettlePending && g1._isRoundSettlePending()){ pending = true; }
            var g2 = self.getComponent("GameOverZP");
            if(!pending && g2 && g2._isRoundSettlePending && g2._isRoundSettlePending()){ pending = true; }
            if(pending){ return; }
            self._flushGameEnd();
        });
        //小局结算弹窗关闭后再展示整场总结算(正常局没有缓存的game_end,这里直接跳过)
        this.node.on('game_over_popup_closed',function(){
            self._flushGameEnd();
        });
    },

    //渲染缓存的整场结算数据(没有缓存时什么都不做)
    _flushGameEnd:function(){
        var p = this._pendingEnd;
        if(!p){ return; }
        this._pendingEnd = null;
        this.onGameEnd(p.endinfo, p.roundHistory);
    },

    //数值转带符号文本:正数加"+",0显示"0"
    signedNum:function(v){
        v = v || 0;
        return v > 0 ? ("+" + v) : ("" + v);
    },

    //结算渲染(参考 mjgame_bb_shou 的 game_result):
    //顶部信息条(房号/玩法/扣费/倍率/时间) + 每个座位一张玩家卡片(头像/昵称/ID/总分/大赢家)
    renderList:function(endinfo, roundHistory){
        if(this._gameresult == null){ return; }
        var root = this._gameresult;
        this.setInfoLine(root);

        var cards = this.getCards(root);
        if(cards.length === 0){
            console.error('[GameResult] 场景缺少 game_result/card0、card1 玩家卡片');
            return;
        }
        var seats = cc.vv.gameNetMgr.seats || [];
        if(seats.length > cards.length){
            console.warn('[GameResult] 座位数(' + seats.length + ')多于卡片数(' + cards.length + '),多出的座位不显示');
        }
        //大赢家 = 总分最高且为正
        var maxscore = -Infinity;
        for(var i = 0; i < seats.length; ++i){
            var v = seats[i] ? (Number(seats[i].score) || 0) : 0;
            if(v > maxscore){ maxscore = v; }
        }
        for(var c = 0; c < cards.length; ++c){
            var card = cards[c];
            var s = seats[c];
            card.node.active = !!s;
            if(!s){ continue; }
            var sc = Number(s.score) || 0;
            if(card.bg){ card.bg.color = sc > 0 ? cc.color(255,132,112) : (sc < 0 ? cc.color(128,166,255) : cc.color(235,235,235)); }
            if(card.avatar && s.userid){
                var il = card.avatar.getComponent("ImageLoader");
                if(il == null){
                    try{ il = card.avatar.addComponent("ImageLoader"); }catch(e){}
                }
                if(il && il.setUserID){ il.setUserID(s.userid); }
            }
            this.setText(card.name, s.name || "");
            this.setText(card.id, (s.userid != null) ? ("ID:" + s.userid) : "");
            this.setText(card.score, this.signedNum(sc));
            if(card.score){ card.score.color = sc > 0 ? cc.color(255,212,70) : (sc < 0 ? cc.color(92,232,160) : cc.color(240,240,255)); }
            if(card.win){ card.win.active = sc > 0 && sc == maxscore; }
        }
    },

    //取 game_result 下按序号排列的玩家卡片(card0/card1/...)
    getCards:function(root){
        var found = [];
        for(var i = 0; i < root.childrenCount; ++i){
            var ch = root.children[i];
            if(!ch || !/^card\d+$/.test(ch.name)){ continue; }
            found.push({ idx: parseInt(ch.name.substring(4), 10), node: ch });
        }
        found.sort(function(x, y){ return x.idx - y.idx; });
        var out = [];
        for(var k = 0; k < found.length; ++k){
            var n = found[k].node;
            out.push({
                node: n,
                bg: n.getChildByName("bbCardBg"),
                win: n.getChildByName("bbWinTag"),
                avatar: n.getChildByName("bbAvatar"),
                name: n.getChildByName("bbPName"),
                id: n.getChildByName("bbPId"),
                score: n.getChildByName("bbPScore")
            });
        }
        return out;
    },

    //顶部信息条:房号/玩法/扣费/倍率/时间
    setInfoLine:function(root){
        var bar = root.getChildByName("infoBar");
        var lbl = bar ? bar.getChildByName("infoLabel") : null;
        var lb = lbl ? lbl.getComponent(cc.Label) : null;
        if(lb == null){ return; }
        var nm = cc.vv.gameNetMgr || {};
        var conf = nm.conf || {};
        var wanfa = nm.getWanfa ? (nm.getWanfa() || "") : "";
        var cost = (conf.cost != null) ? conf.cost : ((conf.fangka != null) ? conf.fangka : "-");
        var rate = (conf.rate != null) ? conf.rate : ((conf.multiple != null) ? conf.multiple : 1);
        var d = new Date();
        var pad = function(v){ return v < 10 ? ("0" + v) : ("" + v); };
        var time = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
        lb.string = "房号：" + (nm.roomId || "") + "   " + wanfa + "   扣费:" + cost + "   倍率:" + rate + "倍   " + time;
    },

    //给节点上的 Label 填字
    setText:function(node, text){
        if(node == null){ return; }
        var lb = node.getComponent(cc.Label);
        if(lb){ lb.string = (text == null) ? "" : ("" + text); }
    },

    //整场结束(无endinfo):仅显示昵称+本次累计总分列表
    showTotalScore:function(){
        this.renderList(null, null);
    },

    //game_end入口:整场结束优先展示每局得分明细+总成绩(roundHistory),无明细时降级
    onGameEnd:function(endinfo, roundHistory){
        if(this._gameresult == null){
            this._gameresult = this.node.getChildByName("game_result");
        }
        //game_result 的位置/大小/缩放全部在场景里配置,JS只控制显隐
        if(this._gameresult){ this._gameresult.active = true; }
        if(roundHistory && roundHistory.length > 0){
            //需求:结算列表按局列出每局得分明细(正绿负红),最终总成绩保持显示,不展示全局统计数据
            this.renderList(null, roundHistory);
        }
        else if(endinfo){
            this.renderList(endinfo, null);
        }
        else{
            this.showTotalScore();
        }
    },

    onBtnCloseClicked:function(){
        if(cc.vv && cc.vv.net && cc.vv.net.send){
            cc.vv.net.send("leave_room");
        }
        //按进入来源返回:来源为俱乐部→club场景(由clubScene根据fromClubId直达玩法详情页),否则回大厅
        var nm = cc.vv.gameNetMgr;
        var backClub = (nm && nm.roomBackScene === "club") || cc.vv.fromClubId;
        if(backClub){
            cc.vv.fromClub = true;
            if(nm && nm.roomBackClubId && !cc.vv.fromClubId){ cc.vv.fromClubId = nm.roomBackClubId; }
            if(cc.vv.sceneMgr){ cc.vv.sceneMgr.load("club"); } else { cc.director.loadScene("club"); }
        }
        else{
            if(cc.vv.sceneMgr){ cc.vv.sceneMgr.load("hall"); } else { cc.director.loadScene("hall"); }
        }
    },

    onBtnShareClicked:function(){
        cc.vv.anysdkMgr.shareResult();
    }
});
