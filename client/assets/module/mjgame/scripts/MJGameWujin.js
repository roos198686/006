// 漳浦无金麻将(4人)游戏主脚本：克隆自MJGameZP4，服务端下发caishen=-1/hua=[]/youjin=0，金/花/游金显示自动失效，无需额外屏蔽
// 财神手牌金色固定: 同步Button过渡色, 防止鼠标滑过(hover)被按钮过渡重置回原色
function tintHandCard(node, isCs){
    var col = isCs ? cc.color(255, 208, 90) : cc.Color.WHITE;
    node.color = col;
    var btn = node.getComponent(cc.Button);
    if (btn && btn.transition === cc.Button.Transition.COLOR) {
        if (!btn._mjOrigCol) {
            btn._mjOrigCol = { n: btn.normalColor, h: btn.hoverColor, p: btn.pressedColor, d: btn.disabledColor };
        }
        var o = btn._mjOrigCol;
        if (isCs) {
            btn.normalColor = col;
            btn.hoverColor = col;
            btn.pressedColor = cc.color(235, 185, 75);
        } else {
            btn.normalColor = o.n; btn.hoverColor = o.h; btn.pressedColor = o.p; btn.disabledColor = o.d;
        }
    }
}

var OpTiles = require("OpTiles");

cc.Class({
    extends: cc.Component,

    properties: {
        gameRoot:{
            default:null,
            type:cc.Node
        },
        prepareRoot:{
            default:null,
            type:cc.Node
        },

        _myMJArr:[],  //自己麻将手牌
        _holdsSlotCount:17, //手牌槽位数(无金16张:庄家17张=16手牌+摸牌位,闲家16张)
        _options:null,  //操作选择
        _selectedMJ:null,
        _chupaiSprite:[], //出牌数组
        _mjcount:null,
        _gamecount:null,
        _playEfxs:[],
        _chiPanel:null, //吃牌组合选择面板
        _chiSelect:null, //吃牌手牌二选状态 {pai,tiles:[]}
        _chiHint:null, //吃牌选牌提示Label节点
        _huaAreas:[], //各座位花牌区(按本机localIndex)
        _youjinLabels:[], //各座位游金等级Label(按本机localIndex)
        _youjinPanel:null, //游金选牌面板
        _dealAnimating:false, //开局发牌动画播放中(期间屏蔽自己手牌触摸)
        _dealAnimNodes:null,  //发牌动画节点最终状态备份(取消时瞬间归位用)
        _dealAnimId:0,        //发牌动画令牌(防止过期的结束回调误清状态)
    },

    onLoad: function () {
        //换花动画状态(放在运行时初始化,避免被CCClass当作属性序列化)
        this._dicePlaying = false;
        //登录进房后服务端会补发一份残局(game_start_push):3秒内的第一份game_start属于重连补发,
        //不能重播掷色子/发牌动画,否则每次重进房间都会重放一遍
        this._skipNextStartUntil = (cc.vv && cc.vv.justEnteredRoom) ? (Date.now() + 3000) : 0;
        this._skipThisStart = false;
        if(cc.vv){ cc.vv.justEnteredRoom = false; }
        //记录自家花牌区在场景里的初始位置,运行时始终保持该位置,不随花牌数量变化
        var gc0 = this.node.getChildByName("game");
        var hm0 = gc0 ? gc0.getChildByName("hua_myself") : null;
        this._huaSelfPos = hm0 ? cc.v2(hm0.x, hm0.y) : null;
        var cvs = this.node.getComponent(cc.Canvas);
        if(cvs == null){
            //场景内存在误挂本脚本的游离节点(无Canvas组件),跳过初始化,避免整场景激活报错
            return;
        }
        if(!cc.sys.isNative){
            cvs.fitHeight = true;
            cvs.fitWidth = false;
            //相机清屏色用牌桌边缘深棕色:即使有亚像素缝隙也露深色不露白
            var cams = cc.director.getScene().getComponentsInChildren(cc.Camera);
            for(var ci = 0; ci < cams.length; ci++){
                cams[ci].clearFlags = cc.Camera.ClearFlags.COLOR;
                cams[ci].backgroundColor = cc.color(30, 18, 12);
            }
            //背景图完全由场景文件控制,代码不再动态拉伸/替换
        }
        if(!cc.vv){
            cc.director.loadScene("loading");
            return;
        }
        //结算弹窗只保留 s1/s2:无金是二人玩法,删除场景里多余的 s3/s4 行(不进 .fire,避免场景索引损坏)
        try{
            var goXlch = this.node.getChildByName("game_over_xlch");
            if(goXlch){
                ["s3","s4"].forEach(function(nm){
                    var sn = goXlch.getChildByName(nm);
                    if(sn){ sn.removeFromParent(); sn.destroy(); }
                });
            }
            //GameOver 若已先初始化,剔除指向已删除节点的座位行
            var overComp = this.getComponent("GameOver");
            if(overComp && overComp._seats && overComp._seats.length){
                overComp._seats = overComp._seats.filter(function(v){
                    return v && v.username && v.username.node && v.username.node.parent;
                });
            }
        }catch(e){
            console.error("[Wujin] 清理结算弹窗 s3/s4 异常:", (e && e.stack) ? e.stack : e);
        }
        //加载以下脚本（漳浦玩法无定缺/换三张）;组件已固化到场景,存在则跳过避免重复挂载
        //注意:结算弹窗必须用场景里实际挂的 GameOver/GameResult(与其他麻将房间一致)。
        //之前写成 GameOverZP/GameResultZP:场景没有这两个组件,addComponent 会调用到它们的 onLoad,
        //而它们按 ZP 老场景层级取 game_over_xlch/wanfa 拿不到节点直接抛异常,
        //整个 onLoad 中断 → 牌桌层不隐藏(残留静态"三万")、game_start监听没注册(双方准备也不发牌)。
        var deps = ["NoticeTip","GameOver","PengGangs","MJRoom","TimePointer","GameResult","Chat","Folds","ReplayCtrl","PopupMgr","ReConnect","Voice","UserInfoShow","DeskStyle","Alert"];
        for(var di = 0; di < deps.length; ++di){
            //单个依赖挂载失败不能中断整个onLoad:否则后面的initView/initEventHandlers都不执行,
            //收不到game_start → 进房永远不发牌,且牌桌层不会隐藏、局数label停留在场景里的默认文字
            try{
                if(this.getComponent(deps[di]) == null){
                    this.addComponent(deps[di]);
                }
            }catch(e){
                console.error("[Wujin] 依赖脚本挂载失败 " + deps[di] + ":", (e && e.stack) ? e.stack : e);
            }
        }
        //初始化:各步骤独立try,任一节点缺失都不影响后续(尤其是事件监听)
        try{
            this.initView();
        }catch(e){
            console.error("[Wujin] initView 异常:", (e && e.stack) ? e.stack : e);
        }
        //事件监听必须无条件注册,漏掉就收不到game_start,进房不发牌
        try{
            this.initEventHandlers();
        }catch(e){
            console.error("[Wujin] initEventHandlers 异常:", (e && e.stack) ? e.stack : e);
        }

        //场景里这两个引用可能丢失或被误指向子节点/组件(编辑器重存场景后常见),按名字纠正;
        //否则牌桌层(game)进房后不隐藏,一直显示默认牌面,且手牌触摸会吞掉退出按钮的点击
        try{
            if(!this.gameRoot || this.gameRoot.name !== "game"){ this.gameRoot = this.node.getChildByName("game"); }
            if(!this.prepareRoot || this.prepareRoot.name !== "prepare"){ this.prepareRoot = this.node.getChildByName("prepare"); }
            if(this.gameRoot){ this.gameRoot.active = false; }
            if(this.prepareRoot){ this.prepareRoot.active = true; }
            //未开局(准备阶段)隐藏色子
            this._setSeiziVisible(false);
            this.initWanfaLabel();
            this.onGameBeign();
            this.initCaishenTip(); //场景加载时若已开局(错过game_start事件)也补绘金牌
        }catch(e){
            console.error("[Wujin] onLoad 收尾异常:", (e && e.stack) ? e.stack : e);
        }
        cc.vv.audioMgr.playBGM("bgFight.mp3");
        //提前加载色子图集,避免开局掷色子时才开始异步加载
        var selfDice = this;
        cc.resources.load("images/atlas/baoqei_g", cc.SpriteAtlas, function(err, atlas){
            if(!err && atlas){ selfDice._diceAtlas = atlas; }
        });
    },

    //色子节点显隐(seizi在game节点下,未开局时隐藏)
    _setSeiziVisible:function(visible){
        var gameChild = this.node ? this.node.getChildByName("game") : null;
        var box = gameChild ? gameChild.getChildByName("seizi") : null;
        if(box){ box.active = !!visible; }
    },

    //初始化
    initView:function(){
        this._captureHoldBackFrames(); //先记录场景默认牌背,后面胡牌明牌会改槽位贴图
        //game节点(缺失就直接返回,后面全是基于它的节点查找)
        var gameChild = this.node.getChildByName("game");
        if(gameChild == null){ return; }
        //mj剩余数和剩余局数:节点/组件缺失时跳过,不能抛异常,否则initEventHandlers不会注册(进房不发牌)
        var mjcountNode = gameChild.getChildByName('mjcount');
        if(mjcountNode){
            this._mjcount = mjcountNode.getComponent(cc.Label);
            this._updateMjCount();
        }
        var gamecountNode = gameChild.getChildByName('gamecount');
        if(gamecountNode){
            this._gamecount = gamecountNode.getComponent(cc.Label);
            if(this._gamecount){ this._gamecount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局"; }
        }
        //剩余牌数/剩余局数只填文字,节点位置完全按场景里配置,JS不再调整
        //取到手牌节点
        var myselfChild = gameChild.getChildByName("myself");
        var myholds = myselfChild ? myselfChild.getChildByName("holds") : null;
        //无金16张玩法:每人16张手牌,庄家摸牌后17张;场景固化的14个槽不够,先补齐到17槽(自己+各方位)
        this._ensureHoldsSlots(gameChild,"myself",this._holdsSlotCount);
        var sideNames = ["up","right","left"];
        for(var sni = 0; sni < sideNames.length; ++sni){
            this._ensureHoldsSlots(gameChild,sideNames[sni],this._holdsSlotCount);
        }

        //手牌数放到myMjarr数组中
        for(var i = 0; myholds && i < myholds.children.length; ++i){
            var sprite = myholds.children[i].getComponent(cc.Sprite);
            if(sprite == null){ continue; }
            this._myMJArr.push(sprite);
            sprite.spriteFrame = null;
        }
        this._setupHandGestures();
        //获取真实宽度(2.4无cc.director.getVisibleSize,必须用cc.view)
        var realwidth = cc.view.getVisibleSize().width;
        var mjscale = realwidth/1280;
        if(myholds && mjscale < 1){ //仅窄屏时缩放手牌,宽屏保持原始布局防止手牌超出屏幕右缘
            myholds.scaleX *= mjscale;
            myholds.scaleY *= mjscale;
        }
        //加载前后左右(按本机座位取方位:2人玩法对手在上方,4人玩法保持原方位)
        var seatCount = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
        for(var i = 0; i < seatCount; ++i){
            var side = cc.vv.mahjongmgr.getSide(i);
            var sideChild = gameChild.getChildByName(side);
            if(sideChild == null){ continue; }
            var efxNode = sideChild.getChildByName("play_efx");
            this._playEfxs.push(efxNode ? efxNode.getComponent(cc.Animation) : null);
            //出牌数组将出牌节点获取进来
            var chuPai = sideChild.getChildByName("ChuPai");
            this._chupaiSprite.push((chuPai && chuPai.childrenCount > 0) ? chuPai.children[0].getComponent(cc.Sprite) : null);
        }
        //获取到ops节点
        var opts = gameChild.getChildByName("ops");
        this._options = opts;
        //吃碰杠胡的组合提示模板(场景 game/opTpl:牌大小/间距/底板都在编辑器里配)
        this._opTpl = gameChild.getChildByName("opTpl");
        //操作区只留文字按钮:去掉每个op槽位的底图(op节点自身的Sprite)和牌面
        if(opts){
            for(var oi = 0; oi < opts.childrenCount; ++oi){
                var opc = opts.children[oi];
                if(opc.name != "op"){ continue; }
                var opBg = opc.getComponent(cc.Sprite);
                if(opBg){ opBg.enabled = false; }
                var opTgt = opc.getChildByName("opTarget");
                if(opTgt){ opTgt.active = false; }
            }
        }
        //ops下的全屏New Layout挂了无事件Button,操作栏弹出时会吞掉全屏触摸导致吃牌无法选手牌,永久禁用其Button
        //并直接隐藏该遮罩节点(视觉上不再出现全屏暗色遮罩)
        var opsMask = opts ? opts.getChildByName("New Layout") : null;
        if(opsMask){
            var maskBtn = opsMask.getComponent(cc.Button);
            if(maskBtn){ maskBtn.enabled = false; }
            opsMask.active = false;
        }
        this.hideOptions();
        this.hideChupai();
    },

    //把场景固化的手牌槽补齐到need个(克隆末槽,保留贴图/缩放/翻转)
    //左右两家是竖排:补槽后按可用高度压缩间距并居中,避免17张超出上下屏
    _ensureHoldsSlots:function(gameChild, sideName, need){
        var sideChild = gameChild.getChildByName(sideName);
        var holds = sideChild ? sideChild.getChildByName("holds") : null;
        if(holds == null || !need){ return; }
        var count = holds.childrenCount;
        if(count >= need || count < 2){ return; }
        var last = holds.children[count - 1];
        var prev = holds.children[count - 2];
        if(last == null || prev == null){ return; }
        var dx = last.x - prev.x;
        var dy = last.y - prev.y;
        var vertical = Math.abs(dy) > Math.abs(dx);
        for(var k = count; k < need; ++k){
            var nc = cc.instantiate(last);
            if(vertical){
                nc.x = last.x;
                nc.y = last.y + dy * (k - count + 1);
            }
            else{
                nc.x = last.x + dx * (k - count + 1);
                nc.y = last.y;
            }
            holds.addChild(nc);
        }
        if(!vertical){ return; }
        //竖排(左右两家):统一压缩间距并整体居中(高度按牌面实际显示尺寸计算)
        var maxSpan = 900;
        var tileH = Math.abs((last.height || 88) * (last.scaleY || 1));
        var spacing = Math.abs(dy);
        if(spacing * (need - 1) + tileH > maxSpan){
            spacing = Math.max(20, (maxSpan - tileH) / (need - 1));
        }
        var top = (need - 1) * spacing / 2;
        var step = dy > 0 ? 1 : -1;
        for(var j = 0; j < holds.childrenCount; ++j){
            holds.children[j].y = step > 0 ? (-top + j * spacing) : (top - j * spacing);
        }
    },

    //剩余张数 = 牌墙上还亮着的牌减掉置灰不可摸的死墙(即还能摸几张),由MJRoom刷新牌墙时算好
    _updateMjCount:function(){
        var room = this.getComponent("MJRoom") || this.node.getComponent("MJRoom");
        //无条件刷新:牌墙若因初始化异常没建好,MJRoom 内部会补建,避免墙牌一直不动
        if(room){ room.refreshBrickWall(); }
        if(!this._mjcount){ return; }
        var n = (room && room._brickRemainCount != null) ? room._brickRemainCount : cc.vv.gameNetMgr.numOfMJ;
        this._mjcount.string = "剩余" + n + "张";
    },

    //隐藏出牌
    hideChupai:function(){
        for(var i = 0; i < this._chupaiSprite.length; ++i){
            if(this._chupaiSprite[i] && this._chupaiSprite[i].node){ this._chupaiSprite[i].node.active = false; }
        }
    },

    //小局结束:按后台hu_delay(缺省2秒)延后切到等待界面,结算弹窗同样延时打开,期间保留牌桌展示胡牌明牌
    _delayShowPrepare:function(){
        //胡牌后牌桌(含对家明牌)一直保留到小局结算弹窗关闭,期间不隐藏;
        //弹窗关闭时由 GameOver.onBtnReadyClicked 发出 game_over_popup_closed,这里再切回等待界面。
        //(以前固定hu_delay秒后就隐藏牌桌,弹窗还开着牌面就全没了)
        var self = this;
        this._pendingShowPrepare = true;
        if(!this._overClosedHooked){
            this._overClosedHooked = true;
            this.node.on('game_over_popup_closed', function(){
                //2人房:必须两名玩家都点关闭(服务端开新局)才隐藏牌桌,自己点关闭时桌面牌保持显示
                if(cc.vv.mahjongmgr && cc.vv.mahjongmgr.is2Player()){ return; }
                if(!self._pendingShowPrepare){ return; }
                self._pendingShowPrepare = false;
                if(self.gameRoot){ self.gameRoot.active = false; }
                if(self.prepareRoot){ self.prepareRoot.active = true; }
                self._setSeiziVisible(false); //回到准备阶段隐藏色子
            });
        }
    },

    //事件监听
    initEventHandlers:function(){
        cc.vv.gameNetMgr.dataEventHandler = this.node;
        //重进房间竞态修复:补发牌局状态的game_start_push可能在场景加载完成前到达(dataEventHandler未绑定/指向已销毁旧场景,事件被丢弃),
        //场景就绪后若牌局已在进行(gamestate=begin且有手牌数据),下一拍补发事件恢复牌面/局数/牌墙
        var nm = cc.vv.gameNetMgr;
        if(nm.gamestate == "begin" && nm.seats){
            var hasHolds = false;
            for(var hi = 0; hi < nm.seats.length; ++hi){
                var st = nm.seats[hi];
                if(st && (st.holds instanceof Array) && st.holds.length > 0){ hasHolds = true; break; }
            }
            if(hasHolds){
                var evtNode = this.node;
                this.scheduleOnce(function(){
                    if(!cc.isValid(evtNode)){ return; }
                    evtNode.emit('game_num',{detail:nm.numOfGames});
                    evtNode.emit('mj_count',{detail:null});
                    evtNode.emit('game_start',{detail:null});
                    //兜底:开局操作(如天胡)事件若在监听器绑定前到达被丢弃,此处补发确保胡/碰/杠按钮一定显示
                    if(nm.curaction){
                        var action = nm.curaction;
                        nm.curaction = null;
                        evtNode.emit('game_action',{detail:action});
                    }
                },0);
            }
        }

        var self = this;
        //开始（zp协议开局完整座位数据）
        this.node.on('game_start',function(data){
            //进房后的第一份状态是服务端补发的残局:不重播色子/发牌动画(正常新一局不受影响)
            var resend = Date.now() < self._skipNextStartUntil;
            self._skipNextStartUntil = 0;
            self._skipThisStart = resend;
            //牌桌渲染某一步异常不能把后面的掷色子一起废掉
            try{ self.onGameBeign(true, data && data.detail); }
            catch(e){ console.error("[Wujin] onGameBeign异常:", (e && e.stack) ? e.stack : e); }
            //先掷色子,避免后面的初始化抛异常导致色子动画被跳过
            if(!resend){
                try{ self._rollDiceForRound(); }catch(e){ console.error("[Wujin] 掷色子异常:", e); }
            }
            try{ self.initCaishenTip(); }
            catch(e){ console.error("[Wujin] initCaishenTip异常:", (e && e.stack) ? e.stack : e); }
        });

        this.node.on('game_begin',function(data){
            //game_begin 紧跟 game_start,会重新 initMahjongs 取消发牌动画;这里同样按开局处理,让动画在最终渲染后重播
            self._skipThisStart = false;
            try{ self.onGameBeign(true); }
            catch(e){ console.error("[Wujin] onGameBeign异常:", (e && e.stack) ? e.stack : e); }
            try{ self._rollDiceForRound(); }catch(e){ console.error("[Wujin] 掷色子异常:", e); } //game_start漏收时兜底(同局只掷一次)
        });

        //出牌轮次切换
        this.node.on('game_chupai',function(data){
            data = data.detail;
            if(!data){ return; }
            self.hideChupai();
            if(data.last != cc.vv.gameNetMgr.seatIndex){
                self.initMopai(data.last,null);
            }
            if(!cc.vv.replayMgr.isReplay() && data.turn != cc.vv.gameNetMgr.seatIndex){
                self.initMopai(data.turn,-1);
            }
        });
        //摸牌
        this.node.on('game_mopai',function(data){
            data = data.detail;
            if(!data){ return; }
            self.applyMopai(data);
            //摸牌后剩余牌数一定变了,这里再兜底刷一次牌墙(MJRoom 内部会补建/去重)
            self._updateMjCount();
        });

        this.node.on('game_action',function(data){
            self.showAction(data.detail);
        });

        this.node.on('hupai',function(data){
            var data = data.detail;
            var seatIndex = data.si != null ? data.si : data.seatindex;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
            if(localIndex == 0){
                self.hideOptions();
            }
            var seatData = cc.vv.gameNetMgr.seats[seatIndex];
            seatData.hued = true;

            self.initMopai(seatIndex,data.pai);
            //对家胡牌亮明牌:把上下翻转的牌背(scaleY=-1)翻回正向并显示真实牌面
            self.revealOtherHolds(seatIndex,data.holds,data.pai);

            if(data.zimo){
                self.playEfx(localIndex,"play_zimo");
            }
            else{
                self.playEfx(localIndex,"play_hu");
            }

            cc.vv.mahjongmgr.playRandSFX(data.zimo ? "zimo" : "hu", data.zimo ? 2 : 3);
        });

        this.node.on('mj_count',function(data){
            self._updateMjCount();
        });

        this.node.on('game_num',function(data){
            self._gamecount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
        });

        this.node.on('game_over',function(data){
            self.hideChiPanel();
            self.hideYoujinPanel();
            //亮牌:无论谁胡牌,对家的手牌都要翻开成明牌(自己胡牌时同样要亮对家)
            self.revealAllOtherHolds(data.detail);
            //结算弹窗按后台hu_delay延迟打开,期间保留牌桌让明牌可见,延时后再切到等待界面
            //胡牌后到结算弹窗弹出前,牌桌(含胡牌明牌)必须保持显示,不能被任何等待界面逻辑隐藏
            if(self.gameRoot){ self.gameRoot.active = true; }
            self._delayShowPrepare();
        });

        //漳浦:补花通知 {si,pai,hua,numofmj}
        this.node.on('game_hua',function(data){
            var d = data.detail;
            if(!d){ return; }
            //与漳浦一致:补花动画用于所有座位(自己的花先出现在摸牌位再飞入花牌区)
            self._playHuaHaixiu(d.si); //换牌表情动画(同座位一次换多张只播一次)
            self.playHuaExchange(d);
        });

        //漳浦:游金等级通知 {si,level}
        this.node.on('game_youjin',function(data){
            var d = data.detail;
            if(!d){ return; }
            self.showYoujinLevel(d.si, d.level);
        });

        //漳浦:分饼通知(仅4人) {si,score}
        this.node.on('game_fenbing',function(data){
            var d = data.detail;
            if(!d){ return; }
            var seat = cc.vv.gameNetMgr.seats[d.si];
            var name = seat ? seat.name : ("" + d.si);
            if(cc.vv.wc && cc.vv.wc.showError){
                cc.vv.wc.showError(name + " 分饼 " + d.score + " 分");
            }
        });

        this.node.on('game_chupai_notify',function(data){
            self.hideChupai();
            //打出牌即视为放弃摸牌后的杠/胡选择:自动收起操作弹窗(不点过直接打出时,提示自动消失)
            self.hideOptions();
            var d = data.detail;
            if(!d || !d.seatData){ return; }
            var seatData = d.seatData;
            //如果是自己，则刷新手牌（seatindex 可能缺失，用 userId 兜底判定）
            var isSelf = (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) || (seatData.userid != null && seatData.userid == cc.vv.userMgr.userId);
            if(isSelf){
                self.initMahjongs();
            }
            else{
                self.initOtherMahjongs(seatData);
            }
            self.showChupai();
            var audioUrl = cc.vv.mahjongmgr.getAudioURLByMJID(d.pai);
            cc.vv.audioMgr.playSFX(audioUrl);
        });

        //碰
        this.node.on('peng_notify',function(data){
            self.hideChupai();

            var seatData = data.detail;
            console.log('[peng_notify] seatData.userid=',seatData.userid,'seatindex=',seatData.seatindex,'holds=',typeof seatData.holds === 'object' ? seatData.holds.length+':'+JSON.stringify(seatData.holds) : seatData.holds);
            var isSelf = (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) || (seatData.userid != null && seatData.userid == cc.vv.userMgr.userId);
            console.log('[peng_notify] selfId=',cc.vv.userMgr.userId,'seatIndex=',cc.vv.gameNetMgr.seatIndex,'isSelf=',isSelf);
            if(isSelf){
                self.initMahjongs(false, seatData);
            }
            else{
                self.initOtherMahjongs(seatData);
            }
            var localIndex = self.getLocalIndex(seatData.seatindex);
            self.playEfx(localIndex,"play_peng");
            cc.vv.mahjongmgr.playRandSFX("peng", 5);
            self.hideOptions();
        });
        //杠
        this.node.on('gang_notify',function(data){
            self.hideChupai();
            var data = data.detail;
            var seatData = data.seatData;
            var gangtype = data.gangtype;
            console.log('[gang_notify] seatData.userid=',seatData.userid,'holds=',typeof seatData.holds === 'object' ? seatData.holds.length+':'+JSON.stringify(seatData.holds) : seatData.holds);
            var isSelf = (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) || (seatData.userid != null && seatData.userid == cc.vv.userMgr.userId);
            if(isSelf){
                self.initMahjongs(false, seatData);
            }
            else{
                self.initOtherMahjongs(seatData);
            }

            var localIndex = self.getLocalIndex(seatData.seatindex);
            if(gangtype == "wangang"){
                self.playEfx(localIndex,"play_guafeng");
                cc.vv.audioMgr.playSFX("guafeng.mp3");
            }
            else{
                self.playEfx(localIndex,"play_xiayu");
                cc.vv.audioMgr.playSFX("rain.mp3");
            }
            self.hideOptions();
        });
        //吃
        this.node.on('chi_notify',function(data){
            self.hideChupai();
            var seatData = data.detail;
            console.log('[chi_notify] seatData.userid=',seatData.userid,'holds=',typeof seatData.holds === 'object' ? seatData.holds.length+':'+JSON.stringify(seatData.holds) : seatData.holds);
            var isSelf = (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) || (seatData.userid != null && seatData.userid == cc.vv.userMgr.userId);
            if(isSelf){
                self.initMahjongs(false, seatData);
            }
            else{
                self.initOtherMahjongs(seatData);
            }
            var localIndex = self.getLocalIndex(seatData.seatindex);
            self.playEfx(localIndex,"play_chi");
            cc.vv.mahjongmgr.playRandSFX("chi", 4);
            self.hideOptions();
        });
    },
    //显示出牌节点
    showChupai:function(){
        var pai = cc.vv.gameNetMgr.chupai;
        if( pai >= 0 ){
            var localIndex = this.getLocalIndex(cc.vv.gameNetMgr.turn);
            var sprite = this._chupaiSprite[localIndex];
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_",pai);
            sprite.node.active = true;
        }
    },

    //出牌位置显示
    addOption:function(btnName,pai,gangpai){
        for(var i = 0; i < this._options.childrenCount; ++i){
            var child = this._options.children[i];
            if(child.name == "op" && child.active == false){
                child.active = true;
                //操作区只显示文字按钮,不再显示目标牌(opTarget隐藏)
                var target = child.getChildByName("opTarget");
                if(target){ target.active = false; }
                var btn = child.getChildByName(btnName);
                btn.active = true;
                btn.pai = pai;
                btn.gangpai = (gangpai && gangpai.length) ? gangpai.slice() : null;
                //按钮上方按"组合"显示整副牌(与zjlao一致):碰=3张(缺的真牌用财神补位)、杠=每个可杠组合3张、胡=1张
                var self = this;
                var groups;
                if(btn.gangpai){
                    groups = btn.gangpai.map(function(gp){
                        var g = OpTiles.build([gp, gp, gp]);
                        g.opPai = gp; //发包必须发面值,不能用换算后的财神id
                        return g;
                    });
                }else if(btnName == "btnPeng"){
                    var pg = OpTiles.build([pai, pai]);
                    pg.push(pai);
                    groups = [pg.sort(function(m, n){ return m - n; })];
                }else{
                    groups = [[pai]];
                }
                var onPick = null;
                if(btnName == "btnGang"){
                    onPick = function(grp){ cc.vv.net.send("gang", grp.opPai != null ? grp.opPai : grp[0]); self.hideOptions(); };
                }else if(btnName == "btnPeng"){
                    onPick = function(){ cc.vv.net.send("peng"); self.hideOptions(); };
                }else if(btnName == "btnHu"){
                    onPick = function(){ cc.vv.net.send("hu"); self.hideOptions(); };
                }
                OpTiles.show(this, btn, groups, onPick);
                return;
            }
        }
    },
    //吃按钮选项：与碰/杠/胡同级显示在op栏（全新创建按钮，克隆btnPeng会残留"碰"字精灵）
    addChiOption:function(pai, chipai){
        for(var i = 0; i < this._options.childrenCount; ++i){
            var child = this._options.children[i];
            if(child.name == "op" && child.active == false){
                child.active = true;
                //操作区只显示文字按钮,不再显示目标牌(opTarget隐藏)
                var target = child.getChildByName("opTarget");
                if(target){ target.active = false; }
                var btn = this.getChiButton(child);
                if(btn){
                    btn.active = true;
                    btn.pai = pai;
                    btn.chipai = chipai || null;
                    //按钮上方显示可吃组合(每组三张:两张手牌+被吃的牌,按顺子排好)
                    //注意:直接展示服务端下发的真实组合,不做财神补位(服务端吃牌校验要求真实牌)
                    var groups = [];
                    if(chipai && chipai.length){
                        for(var ci = 0; ci < chipai.length; ++ci){
                            var c = chipai[ci];
                            if(c && c.length >= 3){
                                groups.push([c[0], c[1], c[2]].sort(function(m, n){ return m - n; }));
                            }
                        }
                    }
                    if(!groups.length && pai != null && pai >= 0){ groups.push([pai]); }
                    //点哪个组合就直接吃哪组,不再回手牌选
                    var self = this;
                    OpTiles.show(this, btn, groups, function(grp){
                        if(grp.length >= 3){ self._sendChi(grp); }
                    });
                }
                return;
            }
        }
    },

    getChiButton:function(opChild){
        var btn = opChild.getChildByName("btnChi");
        if(btn){
            //场景底图(吃-1.png)本身已带"吃"字, 场景里的 btnLabel 再叠一层会重复, 统一隐藏
            var lbl = btn.getChildByName("btnLabel");
            if(lbl){ lbl.active = false; }
            //场景固化的btnChi首用时补挂点击事件,防重复绑定
            if(!btn._chiBound){
                btn._chiBound = true;
                cc.vv.utils.addClickEvent(btn, this.node, "MJGameWujin", "onOptionClicked");
            }
            return btn;
        }
        var srcBtn = opChild.getChildByName("btnPeng");
        btn = new cc.Node("btnChi");
        opChild.addChild(btn);
        if(srcBtn){
            btn.setPosition(srcBtn.getPosition());
            btn.setContentSize(srcBtn.getContentSize());
            btn.scaleX = srcBtn.scaleX;
            btn.scaleY = srcBtn.scaleY;
        }
        var sp = btn.addComponent(cc.Sprite);
        sp.type = cc.Sprite.Type.SIMPLE;
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(err, frame){
            if(!err && frame && cc.isValid(btn)){
                var s = btn.getComponent(cc.Sprite);
                if(s){ s.spriteFrame = frame; }
            }
        });
        //自定义"吃"字图(已并入game_ui图集mj_btn_chi.png帧)：存在则替换背景并隐藏文字Label,不存在保持红底白字
        cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(err, atlas){
            var frame = atlas ? atlas.getSpriteFrame("mj_btn_chi.png") : null;
            if(frame && cc.isValid(btn)){
                var s = btn.getComponent(cc.Sprite);
                if(s){ s.spriteFrame = frame; }
                var lblNode = btn.getChildByName("btnLabel");
                if(lblNode){ lblNode.active = false; }
            }
        });
        btn.addComponent(cc.Button);
        var ln = new cc.Node("btnLabel");
        btn.addChild(ln);
        var lb = ln.addComponent(cc.Label);
        lb.string = "吃";
        lb.fontSize = 40;
        lb.lineHeight = 40;
        lb.overflow = cc.Label.Overflow.NONE;
        lb.enableWrapText = false;
        lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
        ln.color = cc.color(255,255,255);
        ln.setPosition(0,0);
        cc.vv.utils.addClickEvent(btn, this.node, "MJGameWujin", "onOptionClicked");
        btn.active = false;
        return btn;
    },

    //漳浦玩法操作按钮(抢金/游金/继续游金):与btnChi同模式运行时创建,避免改动场景
    getZpOpButton:function(opChild, btnName, text, fontSize){
        var btn = opChild.getChildByName(btnName);
        if(btn){
            if(!btn._zpBound){
                btn._zpBound = true;
                cc.vv.utils.addClickEvent(btn, this.node, "MJGameWujin", "onOptionClicked");
            }
            return btn;
        }
        var srcBtn = opChild.getChildByName("btnPeng");
        btn = new cc.Node(btnName);
        opChild.addChild(btn);
        if(srcBtn){
            btn.setPosition(srcBtn.getPosition());
            btn.setContentSize(srcBtn.getContentSize());
            btn.scaleX = srcBtn.scaleX;
            btn.scaleY = srcBtn.scaleY;
        }
        var sp = btn.addComponent(cc.Sprite);
        sp.type = cc.Sprite.Type.SIMPLE;
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(err, frame){
            if(!err && frame && cc.isValid(btn)){
                var s = btn.getComponent(cc.Sprite);
                if(s){ s.spriteFrame = frame; }
            }
        });
        btn.addComponent(cc.Button);
        var ln = new cc.Node("btnLabel");
        btn.addChild(ln);
        var lb = ln.addComponent(cc.Label);
        lb.string = text;
        lb.fontSize = fontSize || 40;
        lb.lineHeight = lb.fontSize;
        lb.overflow = cc.Label.Overflow.NONE;
        lb.enableWrapText = false;
        lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
        ln.color = cc.color(255,255,255);
        ln.setPosition(0,0);
        cc.vv.utils.addClickEvent(btn, this.node, "MJGameWujin", "onOptionClicked");
        btn.active = false;
        return btn;
    },

    //漳浦自定义操作选项:抢金/游金/继续游金按钮占用一个空闲op槽
    addZpOption:function(btnName, text, pai, fontSize){
        for(var i = 0; i < this._options.childrenCount; ++i){
            var child = this._options.children[i];
            if(child.name == "op" && child.active == false){
                child.active = true;
                //操作区只显示文字按钮,不再显示目标牌(opTarget已移除)
                var btn = this.getZpOpButton(child, btnName, text, fontSize);
                btn.active = true;
                btn.pai = pai;
                return;
            }
        }
    },

    // ===== 吃牌：从手牌中自选两张 =====
    enterChiSelect:function(pai){
        this.cancelChiSelect();
        this._chiSelect = { pai: pai, tiles: [] };
        var gameChild = this.node.getChildByName("game") || this.node;
        //优先复用场景固化的 chiHint,没有才运行时创建
        var hint = gameChild.getChildByName("chiHint");
        this._chiHintBaked = !!hint;
        if(hint == null){
            hint = new cc.Node("chiHint");
            hint.setPosition(0, -200);
            gameChild.addChild(hint);
            var lb = hint.addComponent(cc.Label);
            lb.string = "请选择两张手牌";
            lb.fontSize = 36;
            lb.lineHeight = 40;
            lb.overflow = cc.Label.Overflow.NONE;
            hint.color = cc.color(255, 220, 80);
            var ol = hint.addComponent(cc.LabelOutline);
            ol.color = cc.color(60, 30, 0);
            ol.width = 3;
        }
        hint.active = true;
        hint.setPosition(0, -200);
        this._chiHint = hint;
    },

    cancelChiSelect:function(){
        if(this._chiSelect){
            for(var i = 0; i < this._chiSelect.tiles.length; ++i){
                var t = this._chiSelect.tiles[i];
                if(cc.isValid(t)){ t.y = 0; }
            }
        }
        this._chiSelect = null;
        if(this._chiHint && cc.isValid(this._chiHint)){
            //场景固化的只隐藏,运行时建的才销毁
            if(this._chiHintBaked){ this._chiHint.active = false; }
            else{ this._chiHint.destroy(); }
        }
        this._chiHint = null;
    },

    //隐藏轮到自己后选择碰杠胡过操作
    hideOptions:function(data){
        if(this._options == null){ return; }
        this._options.active = false;
        for(var i = 0; i < this._options.childrenCount; ++i){
            var child = this._options.children[i];
            if(child.name == "op"){
                child.active = false;
                child.getChildByName("btnPeng").active = false;
                child.getChildByName("btnGang").active = false;
                child.getChildByName("btnHu").active = false;
                var btnChi = child.getChildByName("btnChi");
                if(btnChi){ btnChi.active = false; }
                //清掉上一轮按钮上方的组合牌提示
                for(var bi = 0; bi < child.childrenCount; ++bi){
                    OpTiles.clear(child.children[bi]);
                }
                var btnQJ = child.getChildByName("btnQiangJin");
                if(btnQJ){ btnQJ.active = false; }
                var btnYJ = child.getChildByName("btnYouJin");
                if(btnYJ){ btnYJ.active = false; }
                var btnYJG = child.getChildByName("btnYouJinGo");
                if(btnYJG){ btnYJG.active = false; }
            }
        }
        this.hideChiPanel();
        this.cancelChiSelect();
        this.hideYoujinPanel();
    },
    //显示动作
    showAction:function(data){
        if(this._options.active){
            this.hideOptions();
        }

        var hasYouJin = !!(data && data.youjin && data.youjin.length > 0);
        if(data && (data.hu || data.gang || data.peng || data.chi || data.qiangjin || hasYouJin || data.youjingo)){
            this._options.active = true;
            if(data.hu){
                this.addOption("btnHu",data.pai);
            }
            //吃碰杠：按钮上方显示组合牌，点组合牌直接执行（与zjlao一致）
            if(data.peng){
                this.addOption("btnPeng",data.pai);
            }

            if(data.gang){
                //无论几种可杠都只显示一个杠按钮:全部可杠的牌并列显示在按钮上方,多张时点小牌选杠
                var gp0 = (data.gangpai && data.gangpai.length) ? data.gangpai[0] : data.pai;
                this.addOption("btnGang", gp0, data.gangpai);
            }

            if(data.chi){
                //吃：显示"吃"按钮，点按钮上方的组合牌直接吃（服务端已保证存在可吃组合，否则chi为false按钮不显示）
                this.addChiOption(data.pai, data.chipai);
            }
            //漳浦:抢金(等同胡,点击发hu)
            if(data.qiangjin){
                this.addZpOption("btnQiangJin","抢金",data.pai,32);
            }
            //漳浦:可宣告游金(从候选牌中选一张打出)
            if(hasYouJin){
                this.addZpOption("btnYouJin","游金",data.pai);
            }
            //漳浦:继续游金(放弃本次胡,提升倍数),与胡按钮并存
            if(data.youjingo){
                this.addZpOption("btnYouJinGo","继续游金",data.pai,28);
            }
            //"过"按钮常驻，便于跳过任意可选操作
            var btnGuo = this._options.getChildByName("btnGuo");
            if(btnGuo){ btnGuo.active = true; }
        }
    },
    //加载玩法
    initWanfaLabel:function(){
        var wanfaNode = cc.find("Canvas/infobar/wanfa") || cc.find("Canvas/infobar/New Sprite/wanfa");
        if(!wanfaNode){ return; }
        var wanfa = wanfaNode.getComponent(cc.Label);
        if(wanfa){ wanfa.string = cc.vv.gameNetMgr.getWanfa(); }
    },

    //金牌提示（漳浦玩法：开局即显示金牌）
    //节点结构在场景文件中(caishenTip下title/cs1/cs2),位置缩放在编辑器里手动调,代码只设牌面与显隐
    initCaishenTip:function(){
        var gameChild = this.node.getChildByName("game");
        if(gameChild == null){ return; }
        var tipNode = gameChild.getChildByName("caishenTip");
        if(tipNode == null){ return; }

        var conf = cc.vv.gameNetMgr.conf;
        var has = conf != null && conf.caishen != null && conf.caishen >= 0;
        tipNode.active = has;
        if(!has){ return; }

        var setIcon = function(node, pai){
            var sp = node.getComponent(cc.Sprite);
            if(sp){ sp.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", pai); }
        };
        var cs1 = tipNode.getChildByName("cs1");
        if(cs1){ cs1.active = true; setIcon(cs1, conf.caishen); }
        var cs2 = tipNode.getChildByName("cs2");
        if(cs2){
            var has2 = conf.caishen2 != null && conf.caishen2 >= 0;
            cs2.active = has2;
            if(has2){ setIcon(cs2, conf.caishen2); }
        }
    },

    // ===== 漳浦:花牌区（使用图集中真实花牌图片,34-41 → 梅兰竹菊春夏秋冬） =====
    //花牌在 Z_my/Z_left/Z_right 图集中的英文名（M_ 前缀，bottomAtlas 含全部8张）

    //花牌区各方位锚点(相对game节点)
    _huaAreaPos:function(side){
        if(side == "myself"){ return cc.v2(-540, -230); }
        if(side == "up"){ return cc.v2(430, 210); }
        if(side == "right"){ return cc.v2(540, 40); }
        return cc.v2(-540, 40);
    },

    //取某座位的花牌区容器:优先用场景里摆好的 game/hua_<方位>(已含8个槽位),
    //场景缺失时才按 _huaAreaPos 运行时创建
    getHuaArea:function(seatIndex){
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        if(this._huaAreas[localIndex] && cc.isValid(this._huaAreas[localIndex])){
            return this._huaAreas[localIndex];
        }
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var gameChild = this.node.getChildByName("game") || this.node;
        var area = gameChild.getChildByName("hua_" + side);
        if(area == null){
            area = new cc.Node("huaArea_" + side);
            var pos = this._huaAreaPos(side);
            area.setPosition(pos.x, pos.y);
            gameChild.addChild(area);
        }
        this._huaAreas[localIndex] = area;
        //自家花牌区位置固定在场景里摆好的位置,不随花牌数量/手牌变化左右移动
        if(side == "myself" && this._huaSelfPos != null){
            area.setPosition(this._huaSelfPos.x, this._huaSelfPos.y);
        }
        return area;
    },

    //花牌的空白牌体:图集里 M_/L_/R_/B_ + 花名 = 带立体边缘的空白牌面(花形贴在它上面)
    _tileBodyFrame:function(side, idx){
        var names = ["plum","orchid","bamboo","chrysanthemum","spring","summer","autumn","winter"];
        var name = names[idx];
        var mgr = cc.vv.mahjongmgr;
        if(name == null || mgr == null){ return null; }
        if(side == "up"){
            var bAtlas = mgr.bottomFoldAtlas;
            var bsf = bAtlas ? bAtlas.getSpriteFrame("B_" + name) : null;
            if(bsf){ return bsf; }
            return mgr.bottomAtlas ? mgr.bottomAtlas.getSpriteFrame("M_" + name) : null;
        }
        var pre = (side == "left") ? "L_" : ((side == "right") ? "R_" : "M_");
        var atlas = (pre == "L_") ? mgr.leftAtlas : ((pre == "R_") ? mgr.rightAtlas : mgr.bottomAtlas);
        return atlas ? atlas.getSpriteFrame(pre + name) : null;
    },

    //花形贴图(透明底,叠在牌体上);资源缺失时显示花名文字
    _fillHuaArt:function(node, sprite, idx, side){
        var self = this;
        cc.vv.mahjongmgr.getHuaSpriteFrame(idx, function(sf){
            if(!cc.isValid(node) || !cc.isValid(sprite)){ return; }
            if(sf != null){ sprite.spriteFrame = sf; return; }
            sprite.spriteFrame = self._tileBodyFrame(side, idx);
            var ln = new cc.Node("name");
            node.addChild(ln);
            var lb = ln.addComponent(cc.Label);
            lb.string = (idx >= 0 && idx < 8) ? ["梅","兰","竹","菊","春","夏","秋","冬"][idx] : "花";
            lb.fontSize = 26;
            lb.lineHeight = 28;
            lb.overflow = cc.Label.Overflow.NONE;
            lb.enableWrapText = false;
            lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
            ln.color = cc.color(220, 40, 40);
        });
    },

    //换牌表情动画(害羞贴图):一个玩家一次补多张花只播一次(同座位1.6秒内的后续补花不再重复播)
    _playHuaHaixiu:function(seatIndex){
        if(!this._haixiuUntil){ this._haixiuUntil = {}; }
        var now = Date.now();
        var key = (seatIndex == null) ? -1 : seatIndex;
        if(this._haixiuUntil[key] && now < this._haixiuUntil[key]){ return; }
        this._haixiuUntil[key] = now + 2400;
        var self = this;
        var play = function(sf){
            if(!sf || !cc.isValid(self.node)){ return; }
            var n = new cc.Node("huaHaixiu");
            var sp = n.addComponent(cc.Sprite);
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            sp.spriteFrame = sf;
            var rect = sf.getRect();
            var w = 300;
            var h = Math.round(w * rect.height / rect.width);
            n.setContentSize(w, h);
            n.setPosition(0, 120);
            n.scale = 0.4;
            n.opacity = 0;
            self.node.addChild(n);
            n.setSiblingIndex(self.node.childrenCount - 1);
            cc.tween(n)
                .to(0.35, { scale: 1.1, opacity: 255 }, { easing: 'backOut' })
                .to(0.15, { scale: 1.0 })
                .delay(1.0)
                .to(0.35, { opacity: 0, position: cc.v3(0, 160, 0) })
                .call(function(){ if(cc.isValid(n)){ n.destroy(); } })
                .start();
        };
        if(this._haixiuFrame){ play(this._haixiuFrame); return; }
        cc.resources.load("images/MJ/hua/haixiu", cc.SpriteFrame, function(err, sf){
            if(err || !sf){ return; }
            self._haixiuFrame = sf;
            play(sf);
        });
    },

    //摸牌展示(自己被服务端holds覆盖后重排,对家点亮摸牌位或回放显示真实牌)
    applyMopai:function(data){
        if(!data){ return; }
        var pai = data.pai;
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(data.seatIndex);
        if(localIndex == 0){
            this.initMahjongs(true);
        }
        else if(cc.vv.replayMgr.isReplay()){
            this.initMopai(data.seatIndex,pai);
        }
        else{
            this.initMopai(data.seatIndex,-1);
        }
    },

    //换花过程动画:花牌从手牌处亮出飞入亮牌区,再从牌墙最末端摸一张回到手牌位
    //服务端补花是从牌墙尾部取牌,所以牌墙同时从末端少一张(MJRoom.consumeBrickTail)
    playHuaExchange:function(d){
        var gameChild = this.node.getChildByName("game");
        if(gameChild == null || d == null){ return; }
        var self = this;
        var room = this.getComponent("MJRoom");
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(d.si);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var sideNode = gameChild.getChildByName(side);
        var holds = sideNode ? sideNode.getChildByName("holds") : null;
        //摸牌位(手牌最后一格):打牌过程中摸到花牌先亮在这里,再开始换牌动画
        var moNode = null;
        if(holds){
            var moIdx = this.getMJIndex(side, this._holdsSlotCount - 1);
            moNode = holds.children[moIdx] || null;
        }
        var handPos = holds ? cc.v2(holds.x, holds.y) : cc.v2(0, 0);
        if(moNode != null){
            var moWorld = holds.convertToWorldSpaceAR(cc.v2(moNode.x, moNode.y));
            handPos = gameChild.convertToNodeSpaceAR(moWorld);
        }
        //牌墙最末端(最后一张)位置:换牌动画起点
        var tailPos = null;
        var tailNode = room ? room.getBrickTailNode() : null;
        if(tailNode && tailNode.parent){
            var wp = tailNode.parent.convertToWorldSpaceAR(cc.v2(tailNode.x, tailNode.y));
            tailPos = gameChild.convertToNodeSpaceAR(wp);
        }
        //亮牌区落点:本张花对应的槽位(座位的 hua 数组最后一个)
        var area = this.getHuaArea(d.si);
        var slotPos = cc.v2(area ? area.x : 0, area ? area.y : 0);
        if(area && area.childrenCount > 0){
            var seat0 = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[d.si] : null;
            var hi = (seat0 && seat0.hua && seat0.hua.length) ? seat0.hua.length - 1 : 0;
            if(hi < 0){ hi = 0; }
            if(hi > area.childrenCount - 1){ hi = area.childrenCount - 1; }
            var slot = area.children[hi];
            slotPos = cc.v2(area.x + slot.x, area.y + slot.y);
        }
        var hIdx = (d.pai != null) ? (d.pai - 34) : -1;
        //只有真正的花牌(34-41)才播换花动画,其他牌不触发
        if(hIdx < 0 || hIdx > 7){ return; }
        var SW = 55, SH = 83;
        var bodySf = this._tileBodyFrame(side, hIdx);
        //1)花牌从摸牌位亮起,短暂停顿后飞入亮牌区;落位立即进花牌区,再从牌墙尾补一张飞回摸牌位
        //(牌墙末端少一张由MJRoom在game_hua时处理)
        var flyBack = function(){
            if(!tailPos){ self._updateMjCount(); return; }
            var back = new cc.Node("huaDrawFx");
            var bsp = back.addComponent(cc.Sprite);
            //牌背贴图直接取牌墙末端节点自己的,保证和场景牌墙一致
            var tailSp = tailNode.getComponent(cc.Sprite);
            bsp.spriteFrame = tailSp ? tailSp.spriteFrame : (room ? room._brickFrame : null);
            bsp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            back.setContentSize(64, 82);
            back.setPosition(tailPos.x, tailPos.y);
            gameChild.addChild(back);
            cc.tween(back)
                .to(0.95, { position: cc.v3(handPos.x, handPos.y, 0) }, { easing: 'quadInOut' })
                .call(function(){
                    if(cc.isValid(back)){ back.destroy(); }
                    self._updateMjCount();
                })
                .start();
        };
        var fx = new cc.Node("huaFx");
        var fsp = fx.addComponent(cc.Sprite);
        fsp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        fx.setContentSize(SW, SH);
        if(bodySf != null){ fsp.spriteFrame = bodySf; }
        this._fillHuaArt(fx, fsp, hIdx, side);
        fx.setPosition(handPos.x, handPos.y);
        fx.scale = 0.85;
        fx.color = cc.color(255, 208, 90); //与包麻将财神一致的金色
        gameChild.addChild(fx);
        //花牌先停在摸牌位,再起飞
        cc.tween(fx)
            .delay(0.12)
            .to(1.05, { position: cc.v3(slotPos.x, slotPos.y, 0), scale: 1.0 }, { easing: 'quadOut' })
            .call(function(){
                if(cc.isValid(fx)){ fx.destroy(); }
                cc.vv.audioMgr.playSFX("fanpai.mp3"); //翻牌音效:花牌亮出
                self.initHuaArea(d.si); //花牌落到花牌区后立即显示,不依赖后续事件
                self._updateMjCount();
            })
            .delay(0.4)
            .call(flyBack)
            .start();
    },

    //场景槽位版:8个槽位已摆好,只填花牌"牌体+花形"/按亮花张数显隐
    _fillHuaSlots:function(area, hua, side){
        for(var i = 0; i < area.childrenCount; ++i){
            var slot = area.children[i];
            var idx = (i < hua.length) ? (hua[i] - 34) : -1;
            var valid = (idx >= 0 && idx < 8);
            slot.active = valid;
            //花牌牌面按包麻将财神的金色展示
            slot.color = valid ? cc.color(255, 208, 90) : cc.Color.WHITE;
            var sp = slot.getComponent(cc.Sprite);
            if(sp == null){ continue; }
            var stale = slot.getChildByName("huaArt");
            if(stale){ stale.destroy(); }
            if(!valid){ sp.spriteFrame = null; continue; }
            //花牌美术是整张牌(已含牌面/牌体), 直接用一张图铺满槽位, 不再叠牌底
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            sp.spriteFrame = this._tileBodyFrame(side, idx); //先占位, 图片加载完成后替换
            this._fillHuaArt(slot, sp, idx, side);
        }
    },

    //按座位当前 hua 数组重绘花牌区(牌体+花形)
    initHuaArea:function(seatIndex){
        var seat = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[seatIndex] : null;
        if(seat == null){ return; }
        var area = this.getHuaArea(seatIndex);
        if(area == null){ return; }
        //场景里已摆好8个槽位;万一没有,补建同样尺寸/间距的8个槽位
        if(area.childrenCount == 0){
            for(var k = 0; k < 8; ++k){
                var tn = new cc.Node("slot" + k);
                tn.setContentSize(44, 64);
                tn.setPosition(k * 48 + 22, 0);
                var sp2 = tn.addComponent(cc.Sprite);
                sp2.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                area.addChild(tn);
            }
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        this._fillHuaSlots(area, seat.hua || [], side);
    },

    //开局/重连时全量重绘所有座位花牌区与游金等级
    initAllHuaAreas:function(){
        var seats = cc.vv.gameNetMgr.seats;
        if(!seats){ return; }
        for(var i = 0; i < seats.length; ++i){
            this.initHuaArea(i);
            this.showYoujinLevel(i, seats[i].youjinLevel || 0);
        }
    },

    //漳浦:游金等级显示(座位旁"单游/双游/三游"),level=0时隐藏
    showYoujinLevel:function(seatIndex, level){
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        var lblNode = this._youjinLabels[localIndex];
        if(!lblNode || !cc.isValid(lblNode)){
            var side = cc.vv.mahjongmgr.getSide(localIndex);
            var area = this.getHuaArea(seatIndex);
            lblNode = new cc.Node("youjin_" + side);
            area.parent.addChild(lblNode);
            var lb = lblNode.addComponent(cc.Label);
            lb.fontSize = 30;
            lb.lineHeight = 34;
            lb.overflow = cc.Label.Overflow.NONE;
            lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
            lblNode.color = cc.color(255, 90, 90);
            var ol = lblNode.addComponent(cc.LabelOutline);
            ol.color = cc.color(80, 0, 0);
            ol.width = 2;
            this._youjinLabels[localIndex] = lblNode;
        }
        //挂在花牌区上方,花牌区为空时也按固定锚点显示
        var area2 = this.getHuaArea(seatIndex);
        lblNode.setPosition(area2.x, area2.y + 80);
        var names = ["", "单游", "双游", "三游"];
        if(level > 0){
            lblNode.active = true;
            lblNode.getComponent(cc.Label).string = names[level] || (level + "游");
        }
        else{
            lblNode.active = false;
        }
    },

    // ===== 漳浦:游金选牌面板（从候选牌中选一张打出,发 'youjin'） =====
    showYoujinPanel:function(pais){
        this.hideYoujinPanel();
        if(!pais || pais.length == 0){ return; }
        var parent = this.node.getChildByName("game");
        if(parent == null){ parent = this.node; }
        var TW = 62, TH = 90, GAP = 16, PADX = 20, PADY = 14, CAPH = 28;
        var w = PADX * 2 + pais.length * TW + (pais.length - 1) * GAP;
        var h = PADY * 2 + TH + CAPH;
        var panel = new cc.Node("youjinPanel");
        panel.setContentSize(w, h);
        panel.setPosition(0, -30);
        parent.addChild(panel);
        var bgn = new cc.Node("bg");
        bgn.setContentSize(w, h);
        panel.addChild(bgn);
        var g = bgn.addComponent(cc.Graphics);
        g.fillColor = cc.color(18, 18, 24, 235);
        g.strokeColor = cc.color(255, 200, 90, 255);
        g.lineWidth = 3;
        g.rect(-w / 2, -h / 2, w, h);
        g.fill();
        g.stroke();
        var cap = new cc.Node("cap");
        cap.setContentSize(w, CAPH);
        cap.setPosition(0, h / 2 - PADY - CAPH / 2 + 4);
        panel.addChild(cap);
        var capLbl = cap.addComponent(cc.Label);
        capLbl.string = "选择一张牌宣告游金";
        capLbl.fontSize = 22;
        capLbl.lineHeight = CAPH;
        capLbl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        capLbl.verticalAlign = cc.Label.VerticalAlign.CENTER;
        cap.color = cc.color(255, 225, 150);

        for(var c = 0; c < pais.length; ++c){
            var item = new cc.Node("yjItem" + c);
            item.setContentSize(TW, TH);
            item.setPosition(-w / 2 + PADX + TW / 2 + c * (TW + GAP), -h / 2 + PADY + TH / 2);
            panel.addChild(item);
            item.addComponent(cc.Button);
            item.pai = pais[c];
            cc.vv.utils.addClickEvent(item, this.node, "MJGameWujin", "onYoujinItemClicked");
            var sp = item.addComponent(cc.Sprite);
            sp.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", pais[c]);
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        }
        this._youjinPanel = panel;
    },

    hideYoujinPanel:function(){
        if(this._youjinPanel && cc.isValid(this._youjinPanel)){
            this._youjinPanel.destroy();
        }
        this._youjinPanel = null;
    },

    onYoujinItemClicked:function(event){
        var pai = event.target.pai;
        if(pai != null){
            cc.vv.net.send("youjin", pai);
        }
        this.hideYoujinPanel();
        this.hideOptions();
    },

    //碰杠胡行为实现
    playEfx:function(index,name){
        var efx = this._playEfxs[index];
        var efxNode = efx ? efx.node : null;
        if(efxNode == null){
            //进场景时座位数据还没同步会取不到play_efx,这里按方位名现取一次并缓存,
            //否则吃/碰/杠/胡会在这里抛异常,整个座位spine动画直接没有
            var gameChild = this.node.getChildByName("game");
            var sideName = cc.vv.mahjongmgr.getSide(index);
            var sideChild = gameChild ? gameChild.getChildByName(sideName) : null;
            efxNode = sideChild ? sideChild.getChildByName("play_efx") : null;
            if(efxNode){
                efx = efxNode.getComponent(cc.Animation);
                this._playEfxs[index] = efx;
            }
        }
        if(efxNode == null){ return; }
        efxNode.active = true;
        if(efx){ efx.play(name); }
        //吃/碰/杠/胡/自摸叠加逆向包 spine 动画(资源未导入时静默跳过)
        if(cc.vv && cc.vv.mahjongmgr){
            var spKey = null;
            if(name == "play_hu"){ spKey = "mj_hu"; }
            else if(name == "play_zimo"){ spKey = "mj_zimo"; }
            else if(name == "play_chi"){ spKey = "mj_chi"; }
            else if(name == "play_peng"){ spKey = "mj_peng"; }
            else if(name == "play_guafeng" || name == "play_xiayu" || name == "play_gang"){ spKey = "mj_gang"; }
            if(spKey){ cc.vv.mahjongmgr.playSpineEfx(efxNode, spKey); }
        }
    },
    //游戏开始
    onGameBeign:function(fromGameStart, startData){
        //新一局开始,取消上一局结算遗留的"延时切等待界面"
        if(this._overHideCb){ this.unschedule(this._overHideCb); this._overHideCb = null; }
        this._clearHuaFx(); //清上一局残留的换花飞牌节点
        this._pendingShowPrepare = false; //新一局开始,清掉上局"弹窗关闭才切等待界面"的标记

        for(var i = 0; i < this._playEfxs.length; ++i){
            if(this._playEfxs[i] && this._playEfxs[i].node){ this._playEfxs[i].node.active = false; }
        }

        this.hideChupai();
        this.hideOptions();
        var gameChild = this.node.getChildByName("game");
        //漳浦玩法没有换三张:隐藏左上角换三张占位牌(hp1/hp2/hp3),该位置改用于显示金牌
        var huanpaiinfo = gameChild.getChildByName("huanpaiinfo");
        if(huanpaiinfo != null){ huanpaiinfo.active = false; }
        //对家方位:2人玩法只保留上方(up),4人玩法右/上/左三方位全留
        var sides = ["right","up","left"];
        for(var i = 0; i < sides.length; ++i){
            var sideChild = gameChild.getChildByName(sides[i]);
            if(sideChild == null){ continue; }
            //该方位对应的本机座位,-1表示本局不参与(老版本MahjongMgr没有getLocalIndexBySlot时退回getLocalIndex)
            var li = (cc.vv.mahjongmgr.getLocalIndexBySlot ? cc.vv.mahjongmgr.getLocalIndexBySlot(i + 1) : cc.vv.gameNetMgr.getLocalIndex(i + 1));
            if(li < 0){
                sideChild.active = false;
                continue;
            }
            sideChild.active = true;
            var holds = sideChild.getChildByName("holds");
            if(holds == null){ continue; }
            //手牌槽(已由initView补齐到17槽)这里一律先全暗;点亮由 initOtherMahjongs 按真实手牌数负责,
            //否则无对局数据(重进房间/结算后)时会残留显示满手的牌背
            for(var j = 0; j < holds.childrenCount; ++j){
                holds.children[j].active = false; //只切显隐,贴图/缩放完全由场景控制
            }
        }

        if(cc.vv.gameNetMgr.gamestate == "" && !(cc.vv.replayMgr && cc.vv.replayMgr.isReplay())){
            return;
        }

        this.gameRoot.active = true;
        this.prepareRoot.active = false;
        //开局庄家17张牌时末张(多发的一张)要放摸牌位;闲家16张不弹,sortHolds内部按张数判断
        this.initMahjongs(true);
        var seats = cc.vv.gameNetMgr.seats;
        for(var i in seats){
            var seatData = seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            if(localIndex != 0){
                this.initOtherMahjongs(seatData);
                if(i == cc.vv.gameNetMgr.turn){
                    this.initMopai(i,-1);
                }
                else{
                    this.initMopai(i,null);
                }
            }
        }
        //漳浦:重绘全部花牌区与游金等级(开局/重连)
        this.initAllHuaAreas();
        this.showChupai();
        if(cc.vv.gameNetMgr.curaction != null){
            this.showAction(cc.vv.gameNetMgr.curaction);
            cc.vv.gameNetMgr.curaction = null;
        }
        //开局首次发牌:手牌从牌墙依次飞出(仅game_start触发且本局无任何弃牌/副露/补花;断线重连保持瞬间渲染)
        //必须先播完掷色子动画再发牌:先把刚渲染出来的手牌/牌背藏起来,色子结束后再走发牌动画
        if(fromGameStart && !this._skipThisStart && this._isFreshDeal()){
            this._dealPending = true;
            this._dealAnimating = true;   //色子+发牌期间屏蔽手牌触摸
            this._dealAnimUntil = Date.now() + 6000;
            this._hideHandsForDice();
            var selfDeal = this;
            //兜底:色子异常没回调时也不能一直不发牌
            this.scheduleOnce(function(){
                if(selfDeal._dealPending && !selfDeal._dicePlaying){ selfDeal._flushPendingDeal(); }
            }, 4.5);
        }
        //牌桌渲染完成的最后一个位置再兜底掷一次:此处onGameBeign已经执行成功(牌桌可见),
        //不管事件监听顺序如何,色子动画都能播出(同局内由时间戳去重,不会重复播;重连不掷)
        if(fromGameStart && !this._skipThisStart){
            try{ this._rollDiceForRound(); }catch(e){ console.error("[Wujin] 掷色子兜底异常:", e); }
        }
    },

    //把运行时诊断打到服务端日志(浏览器控制台看不到时用来定位)
    _dbg:function(msg){
        try{
            if(cc.vv && cc.vv.http){
                cc.vv.http.sendRequest('/dbg_log',{m:String(msg).substring(0,300)},function(){});
            }
        }catch(e){}
    },

    //每局开局掷一次色子(game_start与game_begin几乎同时触发,短时间内只播一次)
    _rollDiceForRound:function(force){
        var now = Date.now();
        if(!force && this._diceRollAt && (now - this._diceRollAt) < 1500){ this._dbg('roll 跳过(1500ms内)'); return; }
        this._diceRollAt = now;
        this._diceWait = 0;
        this._dbg('roll 触发 force=' + !!force);
        var self = this;
        //色子播完(或异常中止)后才允许发牌
        this._playDiceAnim(function(){ self._flushPendingDeal(); });
    },

    //色子结束后补发本局发牌动画(只发一次)
    _flushPendingDeal:function(){
        if(!this._dealPending){ return; }
        this._dealPending = false;
        //牌墙和发牌同时出现(色子期间一直是隐藏的)
        try{
            var gameChild = this.node ? this.node.getChildByName("game") : null;
            var wall = gameChild ? gameChild.getChildByName("brickWall") : null;
            if(wall){
                wall.active = true;
                var room = this.getComponent("MJRoom");
                if(room && room.refreshBrickWall){ room.refreshBrickWall(); }
            }
        }catch(e){
            console.error("[Wujin] 牌墙显示异常:", (e && e.stack) ? e.stack : e);
        }
        try{
            this._playDealAnim();
        }catch(e){
            console.error("[Wujin] 发牌动画异常:", (e && e.stack) ? e.stack : e);
        }
    },

    //色子动画期间先把刚渲染出来的手牌/对手牌背隐藏,等色子播完再由发牌动画从牌墙逐张飞出
    _hideHandsForDice:function(){
        try{
            for(var i = 0; i < this._myMJArr.length; ++i){
                var sp = this._myMJArr[i];
                if(sp && sp.node && sp.node.active && sp.node.mjId != null){ sp.node.opacity = 0; }
            }
            var gameChild = this.node ? this.node.getChildByName("game") : null;
            var seats = (cc.vv.gameNetMgr && cc.vv.gameNetMgr.seats) || [];
            for(var si = 0; si < seats.length; ++si){
                var localIndex = cc.vv.gameNetMgr.getLocalIndex(si);
                if(localIndex == 0){ continue; }
                var sideRoot = gameChild ? gameChild.getChildByName(cc.vv.mahjongmgr.getSide(localIndex)) : null;
                var sideHolds = sideRoot ? sideRoot.getChildByName("holds") : null;
                if(sideHolds == null){ continue; }
                for(var ci = 0; ci < sideHolds.childrenCount; ++ci){
                    var child = sideHolds.children[ci];
                    if(child.active){ child.opacity = 0; }
                }
            }
            //牌墙也等色子播完再显示
            var wall = gameChild ? gameChild.getChildByName("brickWall") : null;
            if(wall){ wall.active = false; }
        }catch(e){
            console.error("[Wujin] 色子阶段隐藏手牌异常:", (e && e.stack) ? e.stack : e);
        }
    },

    //清理换花动画残留节点(动画被打断时节点可能留在牌桌上,表现为多一张牌叠在一起)
    _clearHuaFx:function(gameChild){
        gameChild = gameChild || (this.node ? this.node.getChildByName("game") : null);
        if(!gameChild){ return; }
        for(var i = gameChild.childrenCount - 1; i >= 0; --i){
            var n = gameChild.children[i];
            if(n && (n.name === "huaFx" || n.name === "huaDrawFx")){
                n.stopAllActions();
                n.destroy();
            }
        }
    },

    //掷色子动画:seizi节点下两个色子快速随机翻面,结束后停在最终点数上
    _playDiceAnim:function(done){
        var self = this;
        try{
            var gameChild = this.node ? this.node.getChildByName("game") : null;
            //牌桌层还没显示时动画会在隐藏层里播完(看起来就是"没播"),等它显示后再掷
            if(gameChild && !gameChild.active){
                this._diceWait = (this._diceWait || 0) + 1;
                if(this._diceWait > 15){
                    console.warn("[色子] 牌桌层一直未显示,放弃本轮掷色子");
                    if(done){ done(); }
                    return;
                }
                this.scheduleOnce(function(){ self._playDiceAnim(done); }, 0.2);
                return;
            }
            var box = gameChild ? gameChild.getChildByName("seizi") : null;
            var d0 = box ? box.getChildByName("Spriteseizi0") : null;
            var d1 = box ? box.getChildByName("Spriteseizi1") : null;
            if(box == null || d0 == null || d1 == null){
                console.warn("[色子] 节点缺失 game=" + !!gameChild + " seizi=" + !!box + " d0=" + !!d0 + " d1=" + !!d1);
                if(done){ done(); }
                return;
            }
            var sp0 = d0.getComponent(cc.Sprite);
            var sp1 = d1.getComponent(cc.Sprite);
            this._dbg('play 进入 game=' + !!gameChild + ' active=' + (gameChild ? gameChild.active : '-') + ' seizi=' + !!box + ' sp0=' + !!sp0 + ' sp1=' + !!sp1);
            if(sp0 == null || sp1 == null){
                console.warn("[色子] Spriteseizi 缺少 cc.Sprite 组件");
                if(done){ done(); }
                return;
            }
            //兜底点数面:场景里两个色子本来就绑了图集里的点数帧,图集取不到时用它俩来回翻,保证动画一定看得见
            var fallback = [];
            if(sp0.spriteFrame){ fallback.push(sp0.spriteFrame); }
            if(sp1.spriteFrame && sp1.spriteFrame !== fallback[0]){ fallback.push(sp1.spriteFrame); }
            var run = function(atlas){
                if(!cc.isValid(box)){ if(done){ done(); } return; }
                var faces = [];
                if(atlas){
                    for(var i = 1; i <= 6; ++i){
                        var f = atlas.getSpriteFrame("dice_" + i + ".png") || atlas.getSpriteFrame("dice_" + i);
                        if(f){ faces.push(f); }
                    }
                }
                if(faces.length == 0){
                    faces = fallback;
                    console.warn("[色子] 图集里没取到 dice_1~6 帧,改用场景已有牌面兜底,数量=" + faces.length);
                }
                if(faces.length == 0){
                    console.warn("[色子] 没有任何可用牌面,无法播放");
                    if(done){ done(); }
                    return;
                }
                self._dicePlaying = true;
                box.active = true;
                box.opacity = 255;
                box.color = cc.Color.WHITE;
                //底框(seizi)保持场景原位置不动:只让底框里的两颗色子各自飞出去、再各自飞回来
                if(box.parent){ box.setSiblingIndex(box.parent.childrenCount - 1); }
                var vs = cc.view.getVisibleSize();
                var vo = cc.view.getVisibleOrigin();
                //落点用牌桌中央 arrow 节点的世界坐标;起点用可视区右下角的世界坐标。
                //注意:game/seizi 上的 Widget 对齐是延迟到帧末执行的,开播瞬间算好的局部坐标会偏,
                //所以这里只存世界坐标,每帧再换算到底框局部,保证落点始终对准 arrow
                var arrow = gameChild ? gameChild.getChildByName("arrow") : null;
                var centerW = (arrow && cc.isValid(arrow))
                    ? arrow.convertToWorldSpaceAR(cc.v2(0, 0))
                    : cc.v2(vo.x + vs.width / 2, vo.y + vs.height / 2);
                var startW0 = cc.v2(vo.x + vs.width - vs.width * 0.10, vo.y + vs.height * 0.08);
                var startW1 = cc.v2(vo.x + vs.width - vs.width * 0.04, vo.y + vs.height * 0.16);
                var randFace = function(){ return faces[Math.floor(Math.random() * faces.length)]; };
                //两颗色子分开扔:第二颗延迟0.22秒起飞,起点/落点/转速都不同,落下后各自回原位
                var dice = [
                    { n: d0, sp: sp0, startW: startW0, off: cc.v2(-52, 8), hx: d0.x, hy: d0.y, delay: 0, spin: 0, speed: 900, lastFace: 0, final: randFace(), backAt: 1.50 },
                    { n: d1, sp: sp1, startW: startW1, off: cc.v2(52, -8), hx: d1.x, hy: d1.y, delay: 0.22, spin: 0, speed: 760, lastFace: 0, final: randFace(), backAt: 1.62 }
                ];
                d1.active = false;   //后扔的那颗先藏起来,否则会静止停在右下角起点
                var seq = self._diceSeq = (self._diceSeq || 0) + 1;
                var FLY = 0.72, BACK = 0.45, TOTAL = 2.15;
                var t0 = Date.now(), lastT = 0;
                self._dbg('faces=' + faces.length + ' centerW=' + Math.round(centerW.x) + ',' + Math.round(centerW.y) +
                    ' startW0=' + Math.round(startW0.x) + ',' + Math.round(startW0.y) +
                    ' startW1=' + Math.round(startW1.x) + ',' + Math.round(startW1.y) +
                    ' home=' + Math.round(d0.x) + ',' + Math.round(d0.y) +
                    ' vs=' + Math.round(vs.width) + 'x' + Math.round(vs.height) + ' inHier=' + box.activeInHierarchy);
                console.log("[色子] 开始播放,牌面数=" + faces.length);
                var timer = setInterval(function(){
                    if(seq !== self._diceSeq || !cc.isValid(box) || !cc.isValid(d0) || !cc.isValid(d1)){
                        clearInterval(timer);
                        return;
                    }
                    var t = (Date.now() - t0) / 1000;
                    var dt = Math.min(0.05, Math.max(0, t - lastT));
                    lastT = t;
                    //每帧按最新父节点变换换算局部坐标(Widget 对齐/窗口变化后落点不会漂)
                    var cW = (arrow && cc.isValid(arrow)) ? arrow.convertToWorldSpaceAR(cc.v2(0, 0)) : centerW;
                    var cL = box.convertToNodeSpaceAR(cW);
                    for(var i = 0; i < dice.length; ++i){
                        var d = dice[i], n = d.n, sp = d.sp;
                        if(t < d.delay){ continue; }
                        if(!n.active){ n.active = true; }
                        var sL = box.convertToNodeSpaceAR(d.startW);
                        var tL = cc.v2(cL.x + d.off.x, cL.y + d.off.y);
                        var ft = t - d.delay;
                        if(ft < FLY){
                            //第一段:两颗色子错开起飞,各走各的弧线,从右下侧边滚边飞向桌中心
                            var k = ft / FLY;
                            var e = 1 - Math.pow(1 - k, 3);
                            n.setPosition(
                                sL.x + (tL.x - sL.x) * e,
                                sL.y + (tL.y - sL.y) * e + Math.sin(Math.PI * k) * vs.height * 0.10
                            );
                            d.spin += d.speed * dt;
                            n.angle = -(d.spin % 360);
                            n.setScale(2);
                            if(t - d.lastFace >= 0.07){ d.lastFace = t; sp.spriteFrame = randFace(); }
                        } else if(t < d.backAt){
                            //第二段:在桌中心继续滚动,最后0.2秒减速停住并定格点数
                            var left = d.backAt - t;
                            var factor = left < 0.2 ? Math.max(0, left / 0.2) : 1;
                            n.setPosition(tL.x, tL.y);
                            d.spin += d.speed * dt * factor;
                            n.angle = -(d.spin % 360);
                            n.setScale(2);
                            if(left < 0.2){
                                n.angle = 0;
                                sp.spriteFrame = d.final;
                            } else if(t - d.lastFace >= 0.07){
                                d.lastFace = t;
                                sp.spriteFrame = randFace();
                            }
                        } else if(t < d.backAt + BACK){
                            //第三段:各自带着最终点数飞回底框里原来的位置
                            var bk = (t - d.backAt) / BACK;
                            var be = bk * bk * (3 - 2 * bk);
                            n.angle = 0;
                            sp.spriteFrame = d.final;
                            n.setPosition(tL.x + (d.hx - tL.x) * be, tL.y + (d.hy - tL.y) * be);
                            n.setScale(2 - be);
                        } else {
                            n.setPosition(d.hx, d.hy);
                            n.setScale(1);
                            n.angle = 0;
                            sp.spriteFrame = d.final;
                        }
                    }
                    if(t >= TOTAL){
                        clearInterval(timer);
                        self._dicePlaying = false;
                        self._dbg('done active=' + box.activeInHierarchy);
                        if(done){ done(); }
                    }
                }, 30);
            };
            if(this._diceAtlas){ run(this._diceAtlas); return; }
            cc.resources.load("images/atlas/baoqei_g", cc.SpriteAtlas, function(err, atlas){
                if(err){ console.warn("[色子] 图集加载失败:", (err && (err.message || err)) || err); }
                else if(atlas){ self._diceAtlas = atlas; }
                run(err ? null : atlas);
            });
        }catch(e){
            console.error("[色子] 播放异常:", (e && e.stack) ? e.stack : e);
            if(done){ done(); }
        }
    },

    // ===== 开局发牌动画：手牌从牌墙依次飞出（仅开局首次发牌触发） =====
    //是否本局首次发牌:全场无弃牌/无吃碰杠/无人补花,且非回放。断线重连局已进行时返回false,保持瞬间渲染
    _isFreshDeal:function(){
        if(cc.vv.replayMgr && cc.vv.replayMgr.isReplay()){ return false; }
        var seats = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null;
        if(!seats){ return false; }
        for(var i = 0; i < seats.length; ++i){
            var s = seats[i];
            if(!s){ continue; }
            if(s.folds instanceof Array && s.folds.length > 0){ return false; }
            if(s.pengs instanceof Array && s.pengs.length > 0){ return false; }
            if(s.chis instanceof Array && s.chis.length > 0){ return false; }
            if(s.angangs instanceof Array && s.angangs.length > 0){ return false; }
            if(s.diangangs instanceof Array && s.diangangs.length > 0){ return false; }
            if(s.wangangs instanceof Array && s.wangangs.length > 0){ return false; }
            //注意:发完牌就补花,开局势位一进场就有hua,不能用hua判断"局已进行",否则发牌动画永远不播
        }
        return true;
    },

    //发牌动画:原渲染逻辑已把所有手牌摆到最终位,此处仅记录最终状态→移到牌墙起始位并透明→逐张飞回
    _playDealAnim:function(){
        var STEP = 0.06; //每张起飞间隔
        var FLY = 0.15;  //单张飞行时长
        this._cancelDealAnim(); //防御:清掉可能未播完的上一次动画
        //桌子中央牌墙区域(画布坐标(0,80))换算到各手牌父节点坐标系
        var wallWorld = this.node.convertToWorldSpaceAR(cc.v2(0, 80));
        var animNodes = [];
        var maxEnd = 0;
        var collect = function(nodes, parent, orderFn){
            if(parent == null || nodes.length == 0){ return; }
            var start = parent.convertToNodeSpaceAR(wallWorld);
            nodes.sort(orderFn);
            for(var i = 0; i < nodes.length; ++i){
                var nc = nodes[i];
                var fx = nc.x, fy = nc.y, fop = nc.opacity;
                if(!(fop > 0)){ fop = 255; }   //色子阶段提前隐藏的牌,飞回时恢复不透明
                animNodes.push({node:nc, x:fx, y:fy, op:fop});
                nc.setPosition(start);
                nc.opacity = 0;
                nc.runAction(cc.sequence(
                    cc.delayTime(i * STEP),
                    cc.spawn(cc.moveTo(FLY, cc.v2(fx, fy)), cc.fadeTo(FLY, fop))
                ));
                var end = i * STEP + FLY;
                if(end > maxEnd){ maxEnd = end; }
            }
        };
        //自己手牌:从左到右依次飞出
        var myTiles = [];
        var myParent = null;
        for(var i = 0; i < this._myMJArr.length; ++i){
            var sp = this._myMJArr[i];
            if(sp && sp.node && sp.node.active && sp.node.mjId != null){
                myTiles.push(sp.node);
                myParent = sp.node.parent;
            }
        }
        collect(myTiles, myParent, function(a, b){ return a.x - b.x; });
        //对手手牌(牌背):up从右到左,left从上到下,right从下到上
        var gameChild = this.node.getChildByName("game");
        var seats = cc.vv.gameNetMgr.seats || [];
        for(var si = 0; si < seats.length; ++si){
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(si);
            if(localIndex == 0){ continue; }
            var side = cc.vv.mahjongmgr.getSide(localIndex);
            var sideRoot = gameChild ? gameChild.getChildByName(side) : null;
            var sideHolds = sideRoot ? sideRoot.getChildByName("holds") : null;
            if(sideHolds == null){ continue; }
            var tiles = [];
            for(var ci = 0; ci < sideHolds.childrenCount; ++ci){
                var child = sideHolds.children[ci];
                if(child.active){ tiles.push(child); }
            }
            var orderFn;
            if(side == "up"){
                orderFn = function(a, b){ return b.convertToWorldSpaceAR(cc.v2(0,0)).x - a.convertToWorldSpaceAR(cc.v2(0,0)).x; };
            }
            else if(side == "left"){
                orderFn = function(a, b){ return b.convertToWorldSpaceAR(cc.v2(0,0)).y - a.convertToWorldSpaceAR(cc.v2(0,0)).y; };
            }
            else{
                orderFn = function(a, b){ return a.convertToWorldSpaceAR(cc.v2(0,0)).y - b.convertToWorldSpaceAR(cc.v2(0,0)).y; };
            }
            collect(tiles, sideHolds, orderFn);
        }
        if(animNodes.length == 0){ return; }
        this._dealAnimNodes = animNodes;
        this._dealAnimating = true; //动画期间屏蔽自己手牌触摸
        this._dealAnimUntil = Date.now() + (maxEnd + 0.3) * 1000; //解锁截止时间(兜底,回调丢失也必解锁)
        this._dealAnimId = (this._dealAnimId || 0) + 1;
        var animId = this._dealAnimId;
        var self = this;
        this.scheduleOnce(function(){
            if(self._dealAnimId == animId){
                self._dealAnimating = false;
                self._dealAnimNodes = null;
            }
        }, maxEnd + 0.05);
    },

    //取消发牌动画并瞬间归位:任何手牌重绘(摸/打/吃碰杠/重连补发)到来时调用,保证后续渲染不受动画影响
    _cancelDealAnim:function(){
        if(!this._dealAnimating){ return; }
        this._dealAnimating = false;
        this._dealAnimId = (this._dealAnimId || 0) + 1;
        var list = this._dealAnimNodes || [];
        for(var i = 0; i < list.length; ++i){
            var it = list[i];
            if(cc.isValid(it.node)){
                it.node.stopAllActions();
                it.node.setPosition(it.x, it.y);
                it.node.opacity = it.op;
            }
        }
        this._dealAnimNodes = null;
    },

    //从点击事件中解析出真正的麻将牌节点（兼容点击到子节点/Label的情况，向上查找挂了 mjId 的节点）
    _findMJNode:function(event){
        var n = (event && (event.node || event.currentTarget || event.target)) || null;
        while(n && n.mjId == null && n.parent){
            n = n.parent;
        }
        return n;
    },

    //从点击事件中解析出按钮节点（点击到 Label 子节点时向上查找）
    _findBtnNode:function(event){
        var n = (event && (event.node || event.currentTarget || event.target)) || null;
        var known = {btnPeng:1,btnGang:1,btnHu:1,btnGuo:1,btnChi:1,btnQiangJin:1,btnYouJin:1,btnYouJinGo:1};
        while(n && !known[n.name] && n.parent){
            n = n.parent;
        }
        return n;
    },

    //========== 出牌手势(单击/双击/上滑/滑动多选) START ==========
    //客户端房间设置(DeskStyle.getGestureSettings): 手势多选/上滑出牌/单击·双击出牌
    _getGestureSettings:function(){
        var ds = cc.vv.deskStyle;
        if(ds && ds.getGestureSettings){ return ds.getGestureSettings(); }
        // 兜底: 直接读 localStorage
        try{
            return {
                multiSelect: !!JSON.parse(cc.sys.localStorage.getItem("gesture_multi_select") || "false"),
                swipeUp: !!JSON.parse(cc.sys.localStorage.getItem("mj_gesture_swipe_up") || "false"),
                playMode: JSON.parse(cc.sys.localStorage.getItem("mj_play_mode") || '"single"')
            };
        }catch(e){
            return { multiSelect:false, swipeUp:false, playMode:"single" };
        }
    },

    //绑定手势到所有手牌节点(替代 Button clickEvents) —— 始终绑定, 行为由客户端设置控制
    _setupHandGestures:function(){
        this._gestureSel = [];       //滑动多选的牌节点
        this._gestureStart = null;   //{x,y,t,node}
        this._gesturePlayed = false; //上滑已出牌标记
        this._gestureMoved = false;  //本次触摸是否产生了水平移动
        this._lastTapTile = null;    //上一次点击的牌(用于双击判断)
        this._lastTapTime = 0;
        for(var i = 0; i < this._myMJArr.length; ++i){
            var node = this._myMJArr[i].node;
            if(!cc.isValid(node)){ continue; }
            //清除 Button 点击事件, 改由触摸事件统一处理
            var btn = node.getComponent(cc.Button);
            if(btn){ btn.clickEvents = []; }
            node.on(cc.Node.EventType.TOUCH_START, function(e){ this._onHandTouchStart(e, e.getCurrentTarget()); }, this);
            node.on(cc.Node.EventType.TOUCH_MOVE,  function(e){ this._onHandTouchMove(e,  e.getCurrentTarget()); }, this);
            node.on(cc.Node.EventType.TOUCH_END,   function(e){ this._onHandTouchEnd(e,   e.getCurrentTarget()); }, this);
            node.on(cc.Node.EventType.TOUCH_CANCEL,function(e){ this._onHandTouchEnd(e,   e.getCurrentTarget()); }, this);
        }
    },

    //触摸开始
    _onHandTouchStart:function(e, tileNode){
        if(this._dealAnimating){
            if(Date.now() < (this._dealAnimUntil || 0)){ return; }
            this._dealAnimating = false;
        }
        //特殊选牌模式(吃牌/定财神等): 复用 onMJClicked 原逻辑
        if(this._chiSelect || (this._csPanel && this._csPanel.active)){
            this.onMJClicked({node: tileNode, currentTarget: tileNode});
            e.stopPropagation();
            return;
        }
        var p = e.getLocation();
        this._gestureStart = { x:p.x, y:p.y, t:Date.now(), node:tileNode };
        this._gesturePlayed = false;
        this._gestureMoved = false;
        //清除上一轮多选高亮
        for(var i = 0; i < this._gestureSel.length; ++i){
            if(cc.isValid(this._gestureSel[i])){ this._gestureSel[i].y = 0; }
        }
        this._gestureSel = [];
    },

    //触摸移动: 上滑出牌 / 水平滑动多选
    _onHandTouchMove:function(e, tileNode){
        if(!this._gestureStart || this._gesturePlayed){ return; }
        var gs = this._getGestureSettings();
        var p = e.getLocation();
        var dx = p.x - this._gestureStart.x;
        var dy = p.y - this._gestureStart.y;
        //上滑出牌(阈值 -30) —— 仅当设置开启
        if(gs.swipeUp && dy < -30){
            this._playTile(this._gestureStart.node);
            this._gesturePlayed = true;
            e.stopPropagation();
            return;
        }
        //水平滑动多选 —— 仅当设置开启
        if(gs.multiSelect && Math.abs(dx) > 8){
            this._gestureMoved = true;
            var hit = this._findTileAtPos(p);
            if(hit && this._gestureSel.indexOf(hit) == -1){
                this._gestureSel.push(hit);
                this._setTileY(hit, 15);
            }
        }
    },

    //触摸结束: 单击/双击出牌
    _onHandTouchEnd:function(e, tileNode){
        if(!this._gestureStart){ return; }
        var start = this._gestureStart;
        this._gestureStart = null;
        if(this._gesturePlayed){ return; }
        //水平滑动多选: 保持选中状态(不下牌, 供用户确认/继续)
        if(this._gestureMoved && this._gestureSel.length > 0){
            e.stopPropagation();
            return;
        }
        var gs = this._getGestureSettings();
        var now = Date.now();
        var prevTile = this._lastTapTile;
        var isDouble = (prevTile == start.node) && (now - this._lastTapTime < 300);
        this._lastTapTile = start.node;
        this._lastTapTime = now;
        if(gs.playMode === "double"){
            // 双击出牌: 第一次单击只选中(浮起), 第二次单击同一张牌才出牌
            if(isDouble){
                this._playTile(start.node);
            }else{
                // 选中浮起, 若之前选中了别的牌则复位
                if(prevTile && prevTile != start.node && cc.isValid(prevTile)){
                    this._setTileY(prevTile, 0);
                }
                this._setTileY(start.node, 15);
            }
        }else{
            // 单击出牌(默认)
            this._playTile(start.node);
        }
        e.stopPropagation();
    },

    //出牌
    _playTile:function(tileNode){
        if(!cc.isValid(tileNode) || tileNode.mjId == null){ return; }
        if(cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex){ return; }
        //包财神等模式保护(若存在 shoot 的额外判断则走 shoot)
        this.shoot(tileNode.mjId);
        tileNode.y = 0;
        this._selectedMJ = null;
        //清多选
        for(var i = 0; i < this._gestureSel.length; ++i){
            if(cc.isValid(this._gestureSel[i])){ this._gestureSel[i].y = 0; }
        }
        this._gestureSel = [];
    },

    //根据世界坐标查找命中的手牌节点
    _findTileAtPos:function(worldPos){
        for(var i = 0; i < this._myMJArr.length; ++i){
            var node = this._myMJArr[i].node;
            if(!cc.isValid(node) || !node.active){ continue; }
            var box = node.getBoundingBoxToWorld();
            if(box.contains(worldPos)){ return node; }
        }
        return null;
    },

    //吃牌选牌(从手牌选两张) —— 从 onMJClicked 抽出, 供手势复用
    _handleChiSelect:function(cnode){
        if(cnode == null || cnode.mjId == null){ return; }
        for(var ci = 0; ci < this._myMJArr.length; ++ci){
            if(cnode == this._myMJArr[ci].node){
                var tiles = this._chiSelect.tiles;
                var ti = tiles.indexOf(cnode);
                if(ti != -1){
                    tiles.splice(ti, 1);
                    this._setTileY(cnode, 0);
                    return;
                }
                if(tiles.length >= 2){ return; }
                tiles.push(cnode);
                this._setTileY(cnode, 15);
                if(tiles.length == 2){
                    var p0 = tiles[0].mjId;
                    var p1 = tiles[1].mjId;
                    var target = this._chiSelect.pai;
                    tiles[0].y = 0;
                    tiles[1].y = 0;
                    this.cancelChiSelect();
                    this.hideOptions();
                    cc.vv.net.send("chi", [p0, p1, target]);
                }
                return;
            }
        }
    },
    //========== 出牌手势 END ==========

    //手牌点选弹起/落下动画(仅交互时调用,布局重排不经过这里)
    _setTileY:function(node, y){
        if(!node || !cc.isValid(node)){ return; }
        cc.Tween.stopAllByTarget(node);
        cc.tween(node).to(0.08, {y:y}, {easing:"quadOut"}).start();
    },

    onMJClicked:function(event){
        //开局发牌动画播放中,屏蔽手牌触摸,防止误点
        if(this._dealAnimating){
            if(Date.now() < (this._dealAnimUntil || 0)){ return; }
            this._dealAnimating = false; //动画解锁回调丢失时按时间戳兜底解锁
        }
        //吃牌选牌模式：从手牌中自选两张（发生在对方回合，必须放在轮次拦截之前）
        if(this._chiSelect){
            var cnode = this._findMJNode(event);
            if(cnode == null || cnode.mjId == null){ return; }
            for(var ci = 0; ci < this._myMJArr.length; ++ci){
                if(cnode == this._myMJArr[ci].node){
                    var tiles = this._chiSelect.tiles;
                    var ti = tiles.indexOf(cnode);
                    if(ti != -1){
                        tiles.splice(ti, 1);
                        this._setTileY(cnode, 0);
                        return;
                    }
                    if(tiles.length >= 2){ return; }
                    tiles.push(cnode);
                    this._setTileY(cnode, 15);
                    if(tiles.length == 2){
                        var p0 = tiles[0].mjId;
                        var p1 = tiles[1].mjId;
                        var target = this._chiSelect.pai;
                        tiles[0].y = 0;
                        tiles[1].y = 0;
                        this.cancelChiSelect();
                        this.hideOptions();
                        cc.vv.net.send("chi", [p0, p1, target]);
                    }
                    return;
                }
            }
            return;
        }
        //如果不是自己的轮次，则忽略
        if(cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex){
            console.log("not your turn." + cc.vv.gameNetMgr.turn);
            return;
        }

        //兼容两种回调形态:Button回调传组件(节点取event.node),触摸事件传event(节点取currentTarget/target)
        var node = this._findMJNode(event);
        if(node == null){ return; }
        for(var i = 0; i < this._myMJArr.length; ++i){
            if(node == this._myMJArr[i].node){
                //如果是再次点击，则出牌
                if(node == this._selectedMJ){
                    this.shoot(this._selectedMJ.mjId);
                    this._setTileY(this._selectedMJ, 0);
                    this._selectedMJ = null;
                    return;
                }
                if(this._selectedMJ != null){
                    this._setTileY(this._selectedMJ, 0);
                }
                this._setTileY(node, 15);
                this._selectedMJ = node;
                return;
            }
        }
    },

    //出牌
    shoot:function(mjId){
        if(mjId == null){
            return;
        }
        cc.vv.net.send('chupai',mjId);
    },

    getMJIndex:function(side,index){
        //槽位数按16张玩法的17槽计算(右/上两家槽位倒序排列,摸牌位在槽0)
        if(side == "right" || side == "up"){
            return this._holdsSlotCount - 1 - index;
        }
        return index;
    },

    initMopai:function(seatIndex,pai){
        this._cancelDealAnim(); //手牌相关重绘到来即终止发牌动画并归位
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);

        var gameChild = this.node.getChildByName("game");
        var sideChild = gameChild.getChildByName(side);
        var holds = sideChild.getChildByName("holds");

        var lastIndex = this.getMJIndex(side,this._holdsSlotCount - 1);
        var nc = holds.children[lastIndex];
        if(nc == null){ return; }

        //对家牌背的翻转完全由场景固化的scaleY=-1控制,JS不再改写对家缩放,避免摸牌位被重置
        if(side != "up"){
            nc.scaleX = 1.0;
            nc.scaleY = 1.0;
        }

        if(pai == null){
            nc.active = false;
            if(localIndex == 0){
                var c0 = nc.getChildByName("csCorner");
                if(c0){ c0.active = false; }
            }
        }
        else if(pai >= 0){
            nc.active = true;
            var sprite = nc.getComponent(cc.Sprite);
            if(pai >= 34 && pai <= 41){
                //花牌(34-41)不在普通牌名表里: 整张花牌图
                sprite.spriteFrame = this._tileBodyFrame(side, pai - 34);
                this._fillHuaArt(nc, sprite, pai - 34, side);
            }
            else{
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,pai);
            }
            //自己的摸牌若为财神同样金色区分
            if(localIndex == 0){
                var conf = cc.vv.gameNetMgr.conf || {};
                var isCs = (conf.caishen >= 0 && pai == conf.caishen) || (conf.caishen2 != null && conf.caishen2 >= 0 && pai == conf.caishen2);
                tintHandCard(nc, isCs);
                //摸牌位的角标跟随这张牌, 否则自摸时角标会留在旁边那张牌上
                var corner = nc.getChildByName("csCorner");
                if(corner){ corner.active = isCs; }
            }
        }
        else if(pai != null){
            nc.active = true;
            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(side);
            if(localIndex == 0){
                var ce = nc.getChildByName("csCorner");
                if(ce){ ce.active = false; }
            }
        }
    },

    initEmptySprites:function(seatIndex){
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);

        var gameChild = this.node.getChildByName("game");
        var sideChild = gameChild.getChildByName(side);
        var holds = sideChild.getChildByName("holds");
        var spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
        for(var i = 0; i < holds.childrenCount; ++i){
            var nc = holds.children[i];
            if(side != "up"){
                nc.scaleX = 1.0;
                nc.scaleY = 1.0;
            }

            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
        }
    },

    //记录场景里各方位手牌槽的默认牌背贴图:胡牌亮明牌会覆盖槽位贴图,新一局必须还原成牌背
    _captureHoldBackFrames:function(){
        if(this._holdBackFrames){ return; }
        this._holdBackFrames = {};
        var game = this.node.getChildByName("game");
        if(game == null){ return; }
        var sides = ["myself","up","right","left"];
        for(var si = 0; si < sides.length; ++si){
            var sideNode = game.getChildByName(sides[si]);
            var holds = sideNode ? sideNode.getChildByName("holds") : null;
            if(holds == null || holds.childrenCount === 0){ continue; }
            var sp = holds.children[0].getComponent(cc.Sprite);
            if(sp && sp.spriteFrame){ this._holdBackFrames[sides[si]] = sp.spriteFrame; }
        }
    },

    initOtherMahjongs:function(seatData){
        this._cancelDealAnim(); //手牌相关重绘到来即终止发牌动画并归位
        if(seatData == null){ return; }
        var localIndex = this.getLocalIndex(seatData.seatindex);
        if(localIndex == 0){
            return;
        }
        //已胡牌的座位是明牌,对家(up)的牌槽必须保持正立(scaleY=1),否则牌面上下颠倒
        var upright = !!seatData.hued;
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var game = this.node.getChildByName("game");
        var sideRoot = game ? game.getChildByName(side) : null;
        var sideHolds = sideRoot ? sideRoot.getChildByName("holds") : null;
        if(sideHolds == null){ return; }
        var chis = seatData.chis || [];
        var num = (seatData.pengs ? seatData.pengs.length : 0) + (seatData.angangs ? seatData.angangs.length : 0) + (seatData.diangangs ? seatData.diangangs.length : 0) + (seatData.wangangs ? seatData.wangangs.length : 0) + chis.length;
        num *= 3;
        for(var i = 0; i < num; ++i){
            var idx = this.getMJIndex(side,i);
            if(sideHolds.children[idx] == null){ continue; }
            sideHolds.children[idx].active = false;
        }

        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var holds = this.sortHolds(seatData);
        if(holds == null || typeof(holds) != "object" || holds.length == null || holds.length === 0){
            //对家手牌仅有数量(不下发数组;applyPushHolds把数量归一化到holdCount,holds保持空数组):按数量点亮牌背槽(up/right槽位倒序),多余槽位隐藏
            var n2 = (typeof(seatData.holds) == "number") ? seatData.holds : (seatData.holdCount || 0);
            for(var i = num; i < num + n2; ++i){
                var idx = this.getMJIndex(side,i);
                var slotNode = sideHolds.children[idx];
                if(slotNode == null){ continue; }
                slotNode.active = true;
                //还原场景默认牌背:上局胡牌亮明牌把槽位贴图改成了真实牌面,不还原新一局对家会一直是明牌
                var backSf = this._holdBackFrames ? this._holdBackFrames[side] : null;
                var slotSp = slotNode.getComponent(cc.Sprite);
                if(backSf && slotSp){ slotSp.spriteFrame = backSf; }
                if(side == "up"){ slotNode.scaleX = 1.0; slotNode.scaleY = upright ? 1.0 : -1; } //未胡牌保持对家牌背翻转,已胡牌明牌正立
            }
            this._hideUnusedHolds(side,sideHolds,num + n2);
            return;
        }
        for(var i = 0; i < holds.length; ++i){
            var idx = this.getMJIndex(side,i + num);
            if(sideHolds.children[idx] == null){ continue; }
            var sprite = sideHolds.children[idx].getComponent(cc.Sprite);
            if(sprite == null){ continue; }
            sprite.node.active = true;
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,holds[i]);
            //数组手牌即真实牌面(明牌/回放),对家牌槽必须正立,否则上下颠倒
            if(side == "up"){ sprite.node.scaleX = 1.0; sprite.node.scaleY = 1.0; }
        }
        //真实手牌之后的固化槽位全部隐藏:槽位数按实际节点数(无金16张已补齐到17槽)
        this._hideUnusedHolds(side,sideHolds,num + holds.length);
    },

    //隐藏对家手牌区未使用的固化槽位:已用槽位数=used,其余(active仍为true的场景槽)全部关掉
    _hideUnusedHolds:function(side,sideHolds,used){
        for(var i = used; i < sideHolds.childrenCount; ++i){
            var idx = this.getMJIndex(side,i);
            if(sideHolds.children[idx] == null){ continue; }
            sideHolds.children[idx].active = false;
        }
    },

    //对家胡牌亮明牌:对家牌背在场景里是上下翻转(scaleY=-1)的,胡牌后恢复正常朝向并显示真实牌面
    revealOtherHolds:function(seatIndex,holds,pai){
        if(!holds || typeof(holds) != "object" || holds.length == null || holds.length === 0){ return; }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        if(localIndex == 0){ return; }
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        if(side != "up"){ return; }
        var game = this.node.getChildByName("game");
        var sideRoot = game ? game.getChildByName(side) : null;
        var sideHolds = sideRoot ? sideRoot.getChildByName("holds") : null;
        if(sideHolds == null){ return; }
        //先把胡牌者的真实手牌铺到对家手牌区(点炮时服务端手牌不含所胡的牌,补齐;16张玩法减副露后仍满足len%3==1)
        var arr = holds.slice();
        if(pai != null && pai >= 0 && (arr.length % 3) == 1){ arr.push(pai); }
        var seatData = cc.vv.gameNetMgr.seats[seatIndex];
        if(!seatData){ return; }
        var oldHolds = seatData.holds;
        seatData.holds = arr;
        this.initOtherMahjongs(seatData);
        seatData.holds = oldHolds;
        //再翻回正向:全部牌槽(含16张玩法第15~17槽)scaleY -1 => 1,明牌可正常阅读
        for(var i = 0; i < sideHolds.childrenCount; ++i){
            var nc = sideHolds.children[i];
            if(nc){ nc.scaleX = 1.0; nc.scaleY = 1.0; }
        }
    },

    //结算亮牌:把其余座位的手牌也翻成明牌(自己胡牌、荒庄都亮)
    revealAllOtherHolds:function(results){
        if(!results || typeof(results) != "object" || results.length == null){ return; }
        for(var i = 0; i < results.length; ++i){
            var rs = results[i];
            if(!rs || rs.seatindex == null){ continue; }
            if(cc.vv.gameNetMgr.getLocalIndex(rs.seatindex) == 0){ continue; } //自己的手牌本来就在自己面前
            if(!rs.holds || typeof(rs.holds) != "object" || rs.holds.length == null || rs.holds.length === 0){ continue; }
            this.revealOtherHolds(rs.seatindex,rs.holds,null);
        }
    },

    sortHolds:function(seatData, allowMopai){
        var holds = seatData.holds;
        if(holds == null || typeof(holds) != "object" || holds.length == null){
            //对手手牌可能仅返回数量，无法排序展示
            return null;
        }
        //在副本上排序,禁止原地修改服务端座位数据,避免重复排序/摸牌弹出互相污染
        holds = holds.slice();
        //只有"自己摸牌"推送时才把最后一张当摸牌单独放到右边;
        //碰/吃/杠后手牌数同样可能是11/8/5,此时没有摸牌,误弹会导致排序错乱、末张高亮像多出一张
        var mopai = null;
        var l = holds.length;
        if(allowMopai && ( l == 2 || l == 5 || l == 8 || l == 11 || l == 14 || l == 17)){
            mopai = holds.pop();
        }

        //金牌单独放到手牌最左边
        var conf = cc.vv.gameNetMgr.conf;
        var cs = conf ? conf.caishen : -1;
        var cs2 = conf ? conf.caishen2 : -1;
        var caishenTiles = [];
        var others = [];
        for(var i = 0; i < holds.length; ++i){
            var p = holds[i];
            if((cs >= 0 && p == cs) || (cs2 != null && cs2 >= 0 && p == cs2)){
                caishenTiles.push(p);
            } else {
                others.push(p);
            }
        }
        cc.vv.mahjongmgr.sortMJ(others);
        holds.length = 0;
        for(var j = 0; j < caishenTiles.length; ++j){ holds.push(caishenTiles[j]); }
        for(var k = 0; k < others.length; ++k){ holds.push(others[k]); }

        //将摸牌添加到最后
        if(mopai != null){
            holds.push(mopai);
        }
        return holds;
    },

    initMahjongs:function(allowMopai, forceSeatData){
        this._cancelDealAnim(); //手牌相关重绘到来即终止发牌动画并归位
        var seatData = forceSeatData || this.getSelfSeatData();
        console.log("[initMahjongs] allowMopai=",allowMopai,"forceSeatData=",!!forceSeatData,"seatData.holds=",seatData ? (typeof seatData.holds === 'object' ? seatData.holds.length + ':' + JSON.stringify(seatData.holds) : seatData.holds) : 'null');
        //需求1:收到吃/碰/杠/出牌/摸牌等notify后,一律以服务端下发的完整 holds 数组整体覆盖重绘,
        //禁止客户端自行增删手牌。服务端对本座位的 holds 为完整数组;若拿到数量(number)则跳过并告警,避免手牌错位。
        if(seatData == null || seatData.holds == null || typeof(seatData.holds) != "object" || seatData.holds.length == null){
            console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", seatData ? seatData.holds : seatData);
            return;
        }
        var holds = this.sortHolds(seatData, allowMopai);
        if(holds == null){
            return;
        }
        //整体覆盖重绘后,原选中牌引用已失效,必须清空,否则点新牌会被误判为"再次点击"而出牌
        this._selectedMJ = null;

        //初始化手牌（含吃牌组数量）
        var chis = seatData.chis || [];
        var lackingNum = ((seatData.pengs ? seatData.pengs.length : 0) + (seatData.angangs ? seatData.angangs.length : 0) + (seatData.diangangs ? seatData.diangangs.length : 0) + (seatData.wangangs ? seatData.wangangs.length : 0) + chis.length)*3;
        //手牌连续排布,真实摸到的牌(末张)加摸牌间隙放摸牌位;吃/碰/杠后不挑牌
        var tileW = 0, gapExtra = 0;
        if(this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1]){
            tileW = this._myMJArr[1].node.x - this._myMJArr[0].node.x;
            if(tileW < 0){ tileW = 0; }
        }
        //摸牌位固定半张牌宽的位移,不再从场景槽位推算(场景槽位未预留间隙时位移为0,用户看不到摸牌位)
        gapExtra = tileW > 0 ? tileW * 0.5 : 20;
        var hasMopai = !!allowMopai && (holds.length == 2 || holds.length == 5 || holds.length == 8 || holds.length == 11 || holds.length == 14 || holds.length == 17);
        var baseSprite = this._myMJArr[lackingNum];
        var baseX = baseSprite ? baseSprite.node.x : 0;
        //17张(庄家16手牌+摸牌位)时按屏幕可用宽度压缩间距,避免整排超出1920屏宽;无副露时整排居中
        var maxRight = 790; //手牌最右可到(holds局部坐标,scale 1.1)
        var mopaiGap = hasMopai ? gapExtra : 0;
        var rowW = (holds.length - 1) * tileW + mopaiGap;
        if(tileW > 0 && holds.length > 1 && baseX + rowW > maxRight){
            tileW = Math.max(40, (maxRight - baseX - mopaiGap) / (holds.length - 1));
            rowW = (holds.length - 1) * tileW + mopaiGap;
            if(lackingNum == 0){
                baseX = -rowW / 2;
            }
        }
        console.log("[initMahjongs] _myMJArr.length=",this._myMJArr.length,"lackingNum=",lackingNum,"holds.length=",holds.length,"startSlot=",lackingNum,"endSlot=",lackingNum+holds.length-1);
        //漳浦:金牌高亮染色
        var conf = cc.vv.gameNetMgr.conf;
        var cs = conf ? conf.caishen : -1;
        var cs2 = conf ? conf.caishen2 : -1;
        var renderLog = [];
        for(var i = 0; i < holds.length; ++i){
            var mjid = holds[i];
            var sprite = this._myMJArr[i + lackingNum];
            if(sprite == null || sprite.node == null){ renderLog.push("SLOT_"+(i+lackingNum)+"=NULL"); break; }
            sprite.node.mjId = mjid;
            sprite.node.y = 0;
            var isMo = hasMopai && (i == holds.length - 1);
            if(tileW > 0){
                sprite.node.x = baseX + i * tileW + (isMo ? gapExtra : 0);
            }
            this.setSpriteFrameByMJID("M_",sprite,mjid);
            //金牌位金色标记(漳浦金不代牌,仅醒目提示)
            var isJin = (cs >= 0 && mjid == cs) || (cs2 != null && cs2 >= 0 && mjid == cs2);
            sprite.node.color = isJin ? cc.color(255, 200, 90) : cc.Color.WHITE;
            renderLog.push("SLOT_"+(i+lackingNum)+"="+mjid);
        }
        console.log("[initMahjongs] render:",renderLog.join("|"));
        for(var i = 0; i < lackingNum; ++i){
            var sprite = this._myMJArr[i];
            if(sprite == null || sprite.node == null){ continue; }
            sprite.node.mjId = null;
            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
        for(var i = lackingNum + holds.length; i < this._myMJArr.length; ++i){
            var sprite = this._myMJArr[i];
            if(sprite == null || sprite.node == null){ continue; }
            sprite.node.mjId = null;
            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
    },

    setSpriteFrameByMJID:function(pre,sprite,mjid){
        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,mjid);
        sprite.node.active = true;
        //财神手牌用金色区分显示,非财神复位为原色
        var conf = cc.vv.gameNetMgr.conf || {};
        var isCs = (mjid != null && mjid >= 0) && ((conf.caishen >= 0 && mjid == conf.caishen) || (conf.caishen2 != null && conf.caishen2 >= 0 && mjid == conf.caishen2));
        tintHandCard(sprite.node, isCs);
        //财神角标: 场景里手牌下的csCorner子节点, 位置/大小在编辑器里调, 代码只控制显隐
        var corner = sprite.node.getChildByName("csCorner");
        if(corner){ corner.active = isCs; }
    },

    //自己座位数据:优先 seatIndex 命中,异常时用 userId 兜底(2人房/4人房都适用)
    getSelfSeatData:function(){
        var gnm = cc.vv.gameNetMgr;
        var seats = gnm ? gnm.seats : null;
        if(!seats){ return null; }
        var idx = gnm.seatIndex;
        if(idx != null && idx >= 0 && idx < seats.length && seats[idx]){ return seats[idx]; }
        var uid = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
        if(uid != null){
            for(var i = 0; i < seats.length; ++i){
                if(seats[i] && seats[i].userid == uid){ return seats[i]; }
            }
        }
        return null;
    },

    getLocalIndex:function(index){
        var len = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
        var ret = (index - cc.vv.gameNetMgr.seatIndex + len) % len;
        return ret;
    },

    // ===== 吃牌组合选择面板（以麻将牌图案展示，可点选） =====
    showChiPanel:function(combos){
        this.hideChiPanel();
        //面板挂在game节点下，居中位于手牌上方
        var parent = this.node.getChildByName("game");
        if(parent == null){ parent = this.node; }
        //固定尺寸布局：2.4下嵌套Layout有时序问题会导致面板整体不渲染
        var TW = 46, TH = 66, TGAP = 4, CGAP = 30, PADX = 18, PADY = 14, CAPH = 26;
        //每组宽度按实际牌数计算(吃/碰3张、杠4张)
        var itemW = [];
        var w = PADX * 2;
        for(var ci = 0; ci < combos.length; ++ci){
            if(ci > 0){ w += CGAP; }
            var iw = combos[ci].pais.length * TW + (combos[ci].pais.length - 1) * TGAP;
            itemW.push(iw);
            w += iw;
        }
        var h = PADY * 2 + TH + CAPH;
        var panel = new cc.Node("chiPanel");
        panel.setContentSize(w, h);
        panel.setPosition(0, -140);
        parent.addChild(panel);
        //底板（独立bg子节点，避免父节点Graphics覆盖内容子节点）
        var bgn = new cc.Node("bg");
        bgn.setContentSize(w, h);
        panel.addChild(bgn);
        var g = bgn.addComponent(cc.Graphics);
        g.fillColor = cc.color(18, 18, 24, 235);
        g.strokeColor = cc.color(255, 200, 90, 255);
        g.lineWidth = 3;
        g.rect(-w / 2, -h / 2, w, h);
        g.fill();
        g.stroke();
        //提示文字
        var cap = new cc.Node("cap");
        cap.setContentSize(w, CAPH);
        cap.setPosition(0, h / 2 - PADY - CAPH / 2 + 4);
        panel.addChild(cap);
        var capLbl = cap.addComponent(cc.Label);
        capLbl.string = "点击组合完成操作";
        capLbl.fontSize = 22;
        capLbl.lineHeight = CAPH;
        capLbl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        capLbl.verticalAlign = cc.Label.VerticalAlign.CENTER;
        cap.color = cc.color(255, 225, 150);

        var x = PADX;
        for(var c = 0; c < combos.length; ++c){
            var combo = combos[c];
            var pais = combo.pais;
            var perW = itemW[c];
            //每个组合一个可点击节点
            var item = new cc.Node("cpgItem" + c);
            item.setContentSize(perW, TH);
            item.setPosition(-w / 2 + x + perW / 2, -h / 2 + PADY + TH / 2);
            x += perW + CGAP;
            panel.addChild(item);
            item.addComponent(cc.Button);
            item.actType = combo.type;
            item.paiList = pais;
            item.targetPai = combo.pai;
            cc.vv.utils.addClickEvent(item, this.node, "MJGameWujin", "onChiItemClicked");
            for(var p = 0; p < pais.length; ++p){
                var pn = new cc.Node("p" + p);
                pn.setContentSize(TW, TH);
                pn.setPosition(-perW / 2 + TW / 2 + p * (TW + TGAP), 0);
                item.addChild(pn);
                var sp = pn.addComponent(cc.Sprite);
                sp.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", pais[p]);
                sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            }
        }
        this._chiPanel = panel;
    },

    hideChiPanel:function(){
        if(this._chiPanel && cc.isValid(this._chiPanel)){
            this._chiPanel.destroy();
        }
        this._chiPanel = null;
    },

    onChiItemClicked:function(event){
        //Button回调传组件,触摸回调传事件,统一解析出组合节点
        var t = (event && (event.node || event.currentTarget || event.target)) || null;
        if(t == null){ return; }
        if(t.actType == "peng"){
            cc.vv.net.send("peng");
        }
        else if(t.actType == "gang"){
            cc.vv.net.send("gang", t.targetPai);
        }
        else if(t.paiList){
            //吃:直接发服务端下发的组合(服务端只认真实手牌)
            this._sendChi(t.paiList);
            return;
        }
        this.hideChiPanel();
        this.hideOptions();
    },

    //发吃牌请求:直接发服务端下发的组合(服务端校验三张都是手中真实牌,按顺子排序)
    _sendChi:function(combo){
        if(!combo || combo.length < 3){ this.hideOptions(); return; }
        var send = combo.slice().sort(function(a, b){ return a - b; });
        cc.vv.net.send("chi", send);
        this.hideOptions();
    },

    //点"吃"按钮:只有一组时直接吃, 多组时弹出组合选择面板
    _onChiButton:function(btn){
        var combos = (btn && btn.chipai) ? btn.chipai : [];
        if(!combos.length){ return; }
        if(combos.length == 1){
            this._sendChi(combos[0]);
            return;
        }
        var list = [];
        for(var i = 0; i < combos.length; ++i){
            var c = combos[i];
            if(!c || c.length < 3){ continue; }
            list.push({ pais: c.slice().sort(function(a, b){ return a - b; }), type: "chi", pai: btn.pai });
        }
        if(!list.length){ return; }
        this.showChiPanel(list);
    },

    //碰杠过胡 点击事件
    onOptionClicked:function(event){
        var btn = this._findBtnNode(event);
        if(btn == null){ return; }
        var name = btn.name;
        if(name == "btnChi"){
            //直接点"吃"按钮也要能吃:单组直接吃,多组弹组合面板
            this._onChiButton(btn);
            return;
        }
        this.cancelChiSelect();
        if(name == "btnPeng"){
            cc.vv.net.send("peng");
        }
        else if(name == "btnGang"){
            var gps = (btn.gangpai && btn.gangpai.length) ? btn.gangpai : [btn.pai];
            if(gps.length > 1){
                //多个可杠:点按钮上方对应组合牌选杠,点按钮本身只闪烁提示
                OpTiles.flash(btn);
                return;
            }
            cc.vv.net.send("gang", gps[0]);
        }
        else if(name == "btnHu" || name == "btnQiangJin"){
            //漳浦:抢金与胡同协议(服务端按当前可胡类型判定)
            cc.vv.net.send("hu");
        }
        else if(name == "btnYouJin"){
            //漳浦:弹出候选牌选择面板,选一张打出并宣告游金
            var cur = cc.vv.gameNetMgr.curaction;
            var yj = (cur && cur.youjin) ? cur.youjin : (this._lastYoujin || []);
            this._lastYoujin = yj;
            this.showYoujinPanel(yj);
            return; //不隐藏操作栏,等选牌后一并收起
        }
        else if(name == "btnYouJinGo"){
            cc.vv.net.send("youjin_go");
            this.hideOptions();
        }
        else if(name == "btnGuo"){
            //可胡时点过需二次确认,防止误过胡(取消则操作栏保持原样)
            var btnHu = this._options.getChildByName("btnHu");
            if(btnHu && btnHu.active && cc.vv.alert && cc.vv.alert.show){
                var self = this;
                cc.vv.alert.show(null, "当前可以胡牌，确定要过吗？", function(){
                    cc.vv.net.send("guo");
                    self.hideOptions();
                }, true);
                return;
            }
            cc.vv.net.send("guo");
            //过后立即收起操作栏(连带全屏遮罩),否则操作栏残留会挡住后续手牌点击
            this.hideOptions();
        }
    },

    update: function (dt) {
    },

    onDestroy:function(){
        console.log("onDestroy");
        if(cc.vv){
            cc.vv.gameNetMgr.clear();
        }
    }
});
