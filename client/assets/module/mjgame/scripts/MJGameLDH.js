﻿// 诸暨赖倒胡（翻财神，无台数门槛，推倒胡）游戏主脚本
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
        _options:null,  //操作选择
        _selectedMJ:null,
        _chupaiSprite:[], //出牌数组
        _mjcount:null,
        _gamecount:null,
        _hupaiTips:[],
        _hupaiLists:[],
        _playEfxs:[],
        _opts:[], //胡牌自摸数组
        _chiPanel:null, //吃牌组合选择面板
        _chiSelect:null, //吃牌手牌二选状态 {pai,tiles:[]}
        _chiHint:null, //吃牌选牌提示Label节点
        _dealAnimating:false, //开局发牌动画播放中(期间屏蔽自己手牌触摸)
        _dealAnimNodes:null,  //发牌动画节点最终状态备份(取消时瞬间归位用)
        _dealAnimId:0,        //发牌动画令牌(防止过期的结束回调误清状态)
    },

    onLoad: function () {
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
        //加载以下脚本（诸暨玩法无定缺/换三张）;组件已固化到场景,存在则跳过避免重复挂载
        var deps = ["NoticeTip","GameOver","PengGangs","MJRoom","TimePointer","GameResult","Chat","Folds","ReplayCtrl","PopupMgr","ReConnect","Voice","UserInfoShow","DeskStyle","Alert"];
        for(var di = 0; di < deps.length; ++di){
            if(this.getComponent(deps[di]) == null){
                this.addComponent(deps[di]);
            }
        }
        //初始化
        this.initView();
        this.initEventHandlers();

        //场景里这两个引用可能丢失或被误指向子节点/组件(编辑器重存场景后常见),按名字纠正;
        //否则牌桌层(game)进房后不隐藏,一直显示默认牌面,且手牌触摸会吞掉退出按钮的点击
        if(!this.gameRoot || this.gameRoot.name !== "game"){ this.gameRoot = this.node.getChildByName("game"); }
        if(!this.prepareRoot || this.prepareRoot.name !== "prepare"){ this.prepareRoot = this.node.getChildByName("prepare"); }
        if(this.gameRoot){ this.gameRoot.active = false; }
        if(this.prepareRoot){ this.prepareRoot.active = true; }
        this.initWanfaLabel();
        this.onGameBeign();
        this.initCaishenTip(); //场景加载时若已开局(错过game_start事件)也补绘财神
        cc.vv.audioMgr.playBGM("bgFight.mp3");
    },

    //初始化
    initView:function(){
        this._captureHoldBackFrames(); //先记录场景默认牌背,后面胡牌明牌会改槽位贴图
        //game节点
        var gameChild = this.node.getChildByName("game");
        //mj剩余数和剩余局数
        this._mjcount = gameChild.getChildByName('mjcount').getComponent(cc.Label);
        this._updateMjCount();
        this._gamecount = gameChild.getChildByName('gamecount').getComponent(cc.Label);
        this._gamecount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
        //剩余牌数/局数的位置全部按场景里摆好的来, 代码不再改写
        //取到手牌节点
        var myselfChild = gameChild.getChildByName("myself");
        var myholds = myselfChild.getChildByName("holds");

        //手牌数放到myMjarr数组中
        for(var i = 0; i < myholds.children.length; ++i){
            var sprite = myholds.children[i].getComponent(cc.Sprite);
            this._myMJArr.push(sprite);
            sprite.spriteFrame = null;
        }
        this._setupHandGestures();
        //获取真实宽度(2.4无cc.director.getVisibleSize,必须用cc.view)
        var realwidth = cc.view.getVisibleSize().width;
        var mjscale = realwidth/1280;
        if(mjscale < 1){ //仅窄屏时缩放手牌,宽屏保持原始布局防止手牌超出屏幕右缘
            myholds.scaleX *= mjscale;
            myholds.scaleY *= mjscale;
        }
        //加载前后左右(按本机座位取方位:2人玩法对手在上方,4人玩法保持原方位)
        var seatCount = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
        for(var i = 0; i < seatCount; ++i){
            var side = cc.vv.mahjongmgr.getSide(i);
            var sideChild = gameChild.getChildByName(side);
            if(sideChild == null){ continue; }
            this._hupaiTips.push(sideChild.getChildByName("HuPai"));
            this._hupaiLists.push(sideChild.getChildByName("hupailist"));

            //获取胡后显示节点
            var opt = sideChild.getChildByName("opt");
            opt.active = false;
            var sprite = opt.getChildByName("pai").getComponent(cc.Sprite);
            var data = {
                node:opt,
                sprite:sprite
            };
            this._opts.push(data);
            this._playEfxs.push(sideChild.getChildByName("play_efx").getComponent(cc.Animation));
            //出牌数组将出牌节点获取进来
            this._chupaiSprite.push(sideChild.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
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

    //剩余张数 = 牌墙上还亮着的牌减掉置灰不可摸的死墙(即还能摸几张),由MJRoom刷新牌墙时算好
    _updateMjCount:function(){
        if(!this._mjcount){ return; }
        var room = this.getComponent("MJRoom") || this.node.getComponent("MJRoom");
        if(room && room._brickBuilt){ room.refreshBrickWall(); }
        var n = (room && room._brickRemainCount != null) ? room._brickRemainCount : cc.vv.gameNetMgr.numOfMJ;
        this._mjcount.string = "剩余" + n + "张";
    },

    //隐藏出牌
    hideChupai:function(){
        for(var i = 0; i < this._chupaiSprite.length; ++i){
            this._chupaiSprite[i].node.active = false;
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
        //开始（zj协议开局完整座位数据）
        this.node.on('game_start',function(data){
            //onGameBeign任何异常都不能影响财神区刷新,否则财神永远不显示
            try{ self.onGameBeign(true, data && data.detail); }catch(e){ console.error('[LDH] onGameBeign error:', e); }
            self.initCaishenTip();
        });

        this.node.on('game_begin',function(data){
            self.onGameBeign();
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
            //不再隐藏上家打出的牌：出牌标记要保留到下一次出牌，否则摸牌后打出的牌立刻消失
            var pai = data.pai;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(data.seatIndex);
            if(localIndex == 0){
                //自己摸牌：手牌已由服务端holds覆盖，直接重排(末张为摸到的牌)
                self.initMahjongs(true);
            }
            else if(cc.vv.replayMgr.isReplay()){
                self.initMopai(data.seatIndex,pai);
            }
            else{
                //对家摸牌:点亮其摸牌位牌背(缩放沿用场景固化值,保证翻转方向)
                self.initMopai(data.seatIndex,-1);
            }
        });

        this.node.on('game_action',function(data){
            self.showAction(data.detail);
        });

        this.node.on('hupai',function(data){
            var data = data.detail;
            var seatIndex = data.si != null ? data.si : data.seatindex;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
            //座位旁的"胡/自摸"大字图片去掉(只保留spine特效那一套)
            var hupai = self._hupaiTips[localIndex];
            if(hupai){ hupai.active = false; }

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
            //亮牌:无论谁胡牌,对家的手牌都要翻开成明牌(自己胡牌时同样要亮对家)
            self.revealAllOtherHolds(data.detail);
            //结算弹窗按后台hu_delay延迟打开,期间保留牌桌让明牌可见,延时后再切到等待界面
            //胡牌后到结算弹窗弹出前,牌桌(含胡牌明牌)必须保持显示,不能被任何等待界面逻辑隐藏
            if(self.gameRoot){ self.gameRoot.active = true; }
            self._delayShowPrepare();
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
            self._chiJustSent = false; //吃牌成功,清掉超时/拒绝侦测标记
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
                    //按钮上方显示可吃组合(每组三张:两张手牌+被吃的牌,缺的手牌用财神补位展示,按顺子排好)
                    var groups = [];
                    if(chipai && chipai.length){
                        for(var ci = 0; ci < chipai.length; ++ci){
                            var c = chipai[ci];
                            if(c && c.length >= 3){
                                var tiles = OpTiles.build([c[0], c[1]]);
                                tiles.push(c[2]);
                                groups.push(tiles.sort(function(m, n){ return m - n; }));
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
            //场景固化的btnChi首用时补挂点击事件,防重复绑定
            if(!btn._chiBound){
                btn._chiBound = true;
                cc.vv.utils.addClickEvent(btn, this.node, "MJGameLDH", "onOptionClicked");
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
        cc.vv.utils.addClickEvent(btn, this.node, "MJGameLDH", "onOptionClicked");
        btn.active = false;
        return btn;
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
            }
        }
        this.hideChiPanel();
        this.cancelChiSelect();
    },
    //显示动作
    showAction:function(data){
        //刚发过吃牌请求又收到带chi的操作推送:服务端判组合不合法,给个可见反馈(否则玩家以为点了没反应)
        if(data && data.chi && this._chiJustSent){
            this._chiJustSent = false;
            OpTiles.toast(this, "这两张不能吃,请重选");
        }
        if(this._options.active){
            this.hideOptions();
        }

        if(data && (data.hu || data.gang || data.peng || data.chi)){
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
            //"过"按钮常驻，便于跳过任意可选操作
            var btnGuo = this._options.getChildByName("btnGuo");
            if(btnGuo){ btnGuo.active = true; }
        }
    },
    //加载玩法
    initWanfaLabel:function(){
        // 尝试多个可能路径:不同场景 Canvas 层级可能有差异
        var paths = ["Canvas/infobar/wanfa", "Canvas/infobar/New Sprite/wanfa", "Canvas/infobar/infobar/wanfa"];
        var wanfaNode = null;
        for(var p = 0; p < paths.length; ++p){
            wanfaNode = cc.find(paths[p]);
            if(wanfaNode){ break; }
        }
        if(!wanfaNode){
            console.warn("[initWanfaLabel] wanfa node NOT FOUND, tried:", paths.join(" | "));
            // 打印场景里所有叫 wanfa 的节点路径帮助定位
            var all = cc.director.getScene();
            if(all){
                var tryFind = function(n, depth){
                    if(!n) return;
                    if(n.name === "wanfa") console.warn("[initWanfaLabel] found wanfa at depth", depth, "name=", n.name, "parent=", n.parent && n.parent.name);
                    for(var c = 0; c < n.children && c < 100; ++c){ tryFind(n.children[c], depth+1); }
                };
                tryFind(all, 0);
            }
            return;
        }
        var wanfa = wanfaNode.getComponent(cc.Label);
        if(wanfa){ wanfa.string = cc.vv.gameNetMgr.getWanfa(); }
        else{ console.warn("[initWanfaLabel] wanfa node has no cc.Label component"); }
    },

    //财神提示（翻财神模式：开局即显示财神）
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
        //提到最上层,防止被牌墙/桌面等后加全屏节点盖住导致财神不显示
        tipNode.setSiblingIndex(tipNode.parent.childrenCount - 1);

        var setIcon = function(node, pai){
            var sp = node.getComponent(cc.Sprite);
            //场景里cs1的Sprite组件被禁用(_enabled:false),运行时强制启用,否则财神牌永远不渲染
            if(sp){ sp.enabled = true; sp.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", pai); }
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
        this._pendingShowPrepare = false; //新一局开始,清掉上局"弹窗关闭才切等待界面"的标记

        for(var i = 0; i < this._playEfxs.length; ++i){
            if(this._playEfxs[i] && this._playEfxs[i].node){ this._playEfxs[i].node.active = false; }
        }

        for(var i = 0; i < this._hupaiLists.length; ++i){
            for(var j = 0; j < this._hupaiLists[i].childrenCount; ++j){
                this._hupaiLists[i].children[j].active = false;
            }
        }

        if(cc.vv.gameNetMgr.seats){ //无房间数据时跳过,避免null.length崩溃
        for(var i = 0; i < cc.vv.gameNetMgr.seats.length; ++i){
            var seatData = cc.vv.gameNetMgr.seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            var hupai = this._hupaiTips[localIndex];
            //胡牌座位不再显示"胡/自摸"大字图片(只保留spine特效)
            if(hupai){ hupai.active = false; }
        }
        }

        this.hideChupai();
        this.hideOptions();
        var gameChild = this.node.getChildByName("game");
        //诸暨玩法没有换三张:隐藏左上角换三张占位牌(hp1/hp2/hp3),该位置改用于显示财神
        var huanpaiinfo = gameChild.getChildByName("huanpaiinfo");
        if(huanpaiinfo != null){ huanpaiinfo.active = false; }
        //对家方位:2人玩法只保留上方(up),4人玩法右/上/左三方位全留
        var sides = ["right","up","left"];
        for(var i = 0; i < sides.length; ++i){
            var sideChild = gameChild.getChildByName(sides[i]);
            if(sideChild == null){ continue; }
            //该方位对应的本机座位,-1表示本局不参与
            var li = cc.vv.mahjongmgr.getLocalIndexBySlot(i + 1);
            if(li < 0){
                sideChild.active = false;
                continue;
            }
            sideChild.active = true;
            var holds = sideChild.getChildByName("holds");
            //场景固化14个手牌槽,这里一律先全暗;点亮由 onGameStart/initOtherMahjongs 按真实手牌数负责,
            //否则无对局数据(重进房间/结算后)时会残留显示满手的牌背,看起来像两人各有13张牌
            for(var j = 0; j < holds.childrenCount; ++j){
                holds.children[j].active = false; //只切显隐,贴图/缩放完全由场景控制
            }
        }

        if(cc.vv.gameNetMgr.gamestate == "" && cc.vv.replayMgr.isReplay() == false){
            return;
        }

        this.gameRoot.active = true;
        this.prepareRoot.active = false;
        //开局庄家14张牌时末张(多发的一张)要放摸牌位;非庄家13张不弹,sortHolds内部按张数判断
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
        this.showChupai();
        if(cc.vv.gameNetMgr.curaction != null){
            this.showAction(cc.vv.gameNetMgr.curaction);
            cc.vv.gameNetMgr.curaction = null;
        }
        //开局首次发牌:手牌从牌墙依次飞出(仅game_start触发且本局无任何弃牌/副露/补花;断线重连保持瞬间渲染)
        if(fromGameStart && this._isFreshDeal()){
            this._playDealAnim();
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
            if(s.hua instanceof Array && s.hua.length > 0){ return false; }
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
        var known = {btnPeng:1,btnGang:1,btnHu:1,btnGuo:1,btnChi:1};
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
        if(side == "right" || side == "up"){
            return 13 - index;
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

        var lastIndex = this.getMJIndex(side,13);
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
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,pai);
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
        //真实手牌之后的固化槽位全部隐藏:场景固化14槽且全部active,不隐藏会残留多余的牌背
        this._hideUnusedHolds(side,sideHolds,num + holds.length);
    },

    //隐藏对家手牌区未使用的固化槽位:已用槽位数=used,其余(active仍为true的场景槽)全部关掉
    _hideUnusedHolds:function(side,sideHolds,used){
        for(var i = used; i < 14; ++i){
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
        //先把胡牌者的真实手牌铺到对家手牌区(点炮时服务端手牌可能只有13张,补上所胡的牌)
        var arr = holds.slice();
        if(arr.length < 14 && pai != null && pai >= 0){ arr.push(pai); }
        var seatData = cc.vv.gameNetMgr.seats[seatIndex];
        if(!seatData){ return; }
        var oldHolds = seatData.holds;
        seatData.holds = arr;
        this.initOtherMahjongs(seatData);
        seatData.holds = oldHolds;
        //再翻回正向:全部牌槽(不再限于前14槽)scaleY -1 => 1,明牌可正常阅读
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
        if(allowMopai && ( l == 2 || l == 5 || l == 8 || l == 11 || l == 14)){
            mopai = holds.pop();
        }

        //财神单独放到手牌最左边
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
        //摸牌位固定半张牌宽的位移,不再从场景槽位推算(场景14槽无预留间隙时位移为0,用户看不到摸牌位)
        gapExtra = tileW > 0 ? tileW * 0.5 : 20;
        var hasMopai = !!allowMopai && (holds.length == 2 || holds.length == 5 || holds.length == 8 || holds.length == 11 || holds.length == 14);
        var baseSprite = this._myMJArr[lackingNum];
        var baseX = baseSprite ? baseSprite.node.x : 0;
        console.log("[initMahjongs] _myMJArr.length=",this._myMJArr.length,"lackingNum=",lackingNum,"holds.length=",holds.length,"startSlot=",lackingNum,"endSlot=",lackingNum+holds.length-1);
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

    // ===== 吃碰杠组合面板：手牌上方展示可操作组合，点击即完成 =====
    //combos: [{type:"chi"|"peng"|"gang", pais:[...], pai:杠牌(仅gang)}]
    showChiPanel:function(combos){
        this.hideChiPanel();
        //面板挂在game节点下，居中位于手牌上方(手牌y≈-273)
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
            cc.vv.utils.addClickEvent(item, this.node, "MJGameLDH", "onChiItemClicked");
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
            //吃:组合按顺子面值展示,缺失面值需换成手中真实财神牌再发(服务端校验真实牌/财神)
            var target = t.targetPai;
            var send = [];
            var sd = cc.vv.gameNetMgr.getSelfData();
            var holds = (sd && sd.holds) ? sd.holds : [];
            var conf = cc.vv.gameNetMgr.conf || {};
            var cs = conf.caishen, cs2 = conf.caishen2;
            for(var k = 0; k < t.paiList.length; ++k){
                var f = t.paiList[k];
                if(f == target){ continue; }
                if(f != cs && f != cs2 && holds.indexOf(f) != -1){
                    send.push(f);
                }
                else if(cs >= 0 && holds.indexOf(cs) != -1){
                    send.push(cs);
                }
                else if(cs2 != null && cs2 >= 0 && holds.indexOf(cs2) != -1){
                    send.push(cs2);
                }
            }
            send.push(target);
            if(send.length == 3){
                cc.vv.net.send("chi", send);
            }
        }
        this.hideChiPanel();
        this.hideOptions();
    },

    //发吃牌请求:带2秒无响应超时反馈(服务端校验失败会重推操作栏,超时则静默)
    _sendChi:function(combo){
        this._chiJustSent = true;
        var self = this;
        this.scheduleOnce(function(){
            if(self._chiJustSent){
                self._chiJustSent = false;
                OpTiles.toast(self, "吃牌超时,下次手快一点");
            }
        }, 2.0);
        cc.vv.net.send("chi", combo.slice());
        this.hideOptions();
    },

    //碰杠过胡 点击事件
    onOptionClicked:function(event){
        var btn = this._findBtnNode(event);
        if(btn == null){ return; }
        var name = btn.name;
        if(name == "btnChi"){
            //吃按钮仅作展示,不响应点击:只能点按钮上方的组合牌吃
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
        else if(name == "btnHu"){
            cc.vv.net.send("hu");
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
