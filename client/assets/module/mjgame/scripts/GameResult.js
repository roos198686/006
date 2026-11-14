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
        //赢家卡片背景: baoqei_f 图集里的"大赢家"
        this._winBgFrame = null;
        this._lastRenderArgs = null;
        cc.resources.load("images/atlas/baoqei_f", cc.SpriteAtlas, function (err, atlas) {
            if (err || !atlas) { console.log("[GameResult] 大赢家图集加载失败", err); return; }
            var fr = atlas.getSpriteFrame("大赢家.png") || atlas.getSpriteFrame("大赢家");
            if (!fr) { console.log("[GameResult] 图集里没有大赢家帧"); return; }
            self._winBgFrame = fr;
            //图集晚于结算数据到达: 用缓存的数据重绘一次
            if (self._lastRenderArgs) {
                self.renderList(self._lastRenderArgs[0], self._lastRenderArgs[1]);
            }
        });
        this.node.on('game_end',function(data){
            var d = data.detail || {};
            self._pendingEnd = {endinfo:d.endinfo, roundHistory:d.roundHistory};
            //最后一小局:总局结算必须等小局结算弹窗关闭后再显示。
            //roundSettleAwait 由 GameNetMgr 在收到 game_over_push 时置位,不依赖 GameOver 组件是否就绪
            var nm = cc.vv ? cc.vv.gameNetMgr : null;
            if(nm && nm.roundSettleAwait){ self._armEndFallback(); return; }
            var pending = false;
            var g1 = self.getComponent("GameOver");
            if(g1 && g1._isRoundSettlePending && g1._isRoundSettlePending()){ pending = true; }
            var g2 = self.getComponent("GameOverZP");
            if(!pending && g2 && g2._isRoundSettlePending && g2._isRoundSettlePending()){ pending = true; }
            if(pending){ self._armEndFallback(); return; }
            self._flushGameEnd();
        });
        //小局结算弹窗关闭后再展示整场总结算(正常局没有缓存的game_end,这里直接跳过)
        this.node.on('game_over_popup_closed',function(){
            var nm = cc.vv ? cc.vv.gameNetMgr : null;
            if(nm){ nm.roundSettleAwait = false; }
            self._clearEndFallback();
            self._flushGameEnd();
        });
    },

    //小局结算弹窗异常(未弹出/组件缺失)时的兜底:限时后直接展示整场结算,避免一直不弹。
    //小局弹窗正在显示时不能抢弹:继续等 game_over_popup_closed(弹窗自带30秒倒计时一定会关闭)
    _armEndFallback:function(){
        var self = this;
        this._clearEndFallback();
        this._endFallbackTimer = setTimeout(function(){
            self._endFallbackTimer = null;
            if(self._isRoundSettleShowing()){
                self._armEndFallback();
                return;
            }
            if(cc.vv && cc.vv.gameNetMgr){ cc.vv.gameNetMgr.roundSettleAwait = false; }
            self._flushGameEnd();
        }, 8000);
    },

    //小局结算弹窗当前是否正在显示
    _isRoundSettleShowing:function(){
        var g1 = this.getComponent("GameOver");
        if(g1 && g1._gameover && g1._gameover.active){ return true; }
        var g2 = this.getComponent("GameOverZP");
        if(g2 && g2._gameover && g2._gameover.active){ return true; }
        var n1 = cc.find("Canvas/game_over_xlch");
        if(n1 && n1.active){ return true; }
        var n2 = cc.find("Canvas/game_over");
        if(n2 && n2.active){ return true; }
        return false;
    },

    _clearEndFallback:function(){
        if(this._endFallbackTimer){ clearTimeout(this._endFallbackTimer); this._endFallbackTimer = null; }
    },

    onDestroy:function(){
        this._clearEndFallback();
        this._stopExitCountdown();
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
        this._lastRenderArgs = [endinfo, roundHistory];
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
            var isWin = (sc > 0 && sc == maxscore);
            if(card.bg){
                var bgSp = card.bg.getComponent(cc.Sprite);
                if(bgSp){
                    if(!card._bgFrame){ card._bgFrame = bgSp.spriteFrame; }
                    //赢家换成"大赢家"背景,其余恢复默认背景
                    if(this._winBgFrame){ bgSp.spriteFrame = isWin ? this._winBgFrame : card._bgFrame; }
                }
                card.bg.color = isWin ? cc.color(255,255,255) : (sc > 0 ? cc.color(255,132,112) : (sc < 0 ? cc.color(128,166,255) : cc.color(235,235,235)));
            }
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
        //整场结算页倒计时:时间到自动退出房间
        this._startExitCountdown(30);
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

    //整场结算页倒计时(数字显示在场景 game_result 下名为 countdown 的节点上),归零自动退出房间
    _startExitCountdown:function(sec){
        this._stopExitCountdown();
        var root = this._gameresult || this.node.getChildByName("game_result");
        //countdown 不一定是 game_result 的直接子节点(编辑器里被拖进其他容器),按名字递归查找
        var node = root ? this._findChildByName(root, "countdown") : null;
        if(node == null){
            console.warn("[GameResult] 场景 game_result 下找不到 countdown 倒计时节点");
        }
        this._cdLabel = node ? node.getComponent(cc.Label) : null;
        if(node){ node.active = true; }
        this._cdLeft = sec;
        var self = this;
        this._cdCb = function(){
            self._cdLeft--;
            if(self._cdLabel){ self._cdLabel.string = "" + Math.max(0, self._cdLeft); }
            if(self._cdLeft <= 0){
                self._stopExitCountdown();
                self.onBtnCloseClicked();
            }
        };
        if(this._cdLabel){ this._cdLabel.string = "" + this._cdLeft; }
        this.schedule(this._cdCb, 1);
    },

    //递归按名字找子节点
    _findChildByName:function(node, name){
        if(node == null){ return null; }
        if(node.name === name){ return node; }
        var children = node.children || [];
        for(var i = 0; i < children.length; ++i){
            var r = this._findChildByName(children[i], name);
            if(r){ return r; }
        }
        return null;
    },

    _stopExitCountdown:function(){
        if(this._cdCb){ this.unschedule(this._cdCb); this._cdCb = null; }
    },

    onBtnCloseClicked:function(){
        //手动退出/倒计时到点:都要停掉倒计时,避免重复触发
        this._stopExitCountdown();
        if(cc.vv && cc.vv.net && cc.vv.net.send){
            cc.vv.net.send("leave_room");
        }
        //统一回牌桌大厅(该俱乐部玩法/牌桌列表页),不再按来源回系统大厅
        var nm = cc.vv.gameNetMgr;
        if(nm && nm.exitToTableHall){
            nm.exitToTableHall();
        }
        else if(cc.vv.sceneMgr){ cc.vv.sceneMgr.load("club"); }
        else{ cc.director.loadScene("club"); }
    },

    onBtnShareClicked:function(){
        cc.vv.anysdkMgr.shareResult();
    }
});
