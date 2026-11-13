cc.Class({
    extends: cc.Component,

    properties: {
        lblRoomNo:{
            default:null,
            type:cc.Label
        },
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _seats:[],
        _seats2:[],
        _inGame:false,         //开局后置true:聊天/表情只打到游戏界面Seat(seats2),避免准备界面seats重复弹气泡
        _timeLabel:null,
        _voiceMsgQueue:[],
        _lastPlayingSeat:null,
        _playingSeat:null,
        _lastPlayTime:null,
        _startBtn:null,        //准备界面"开始"按钮(需求3)
        _startFrame:null,      //用户自制"开始"按钮图(textures/mj_btn_start.png),缺失时原生底板兜底
        _startReadyFrame:null, //用户自制"已准备"状态图(textures/mj_btn_ready.png)
        _brickWall:null,       //牌墙容器节点
        _brickStacks:null,     //每墩几何缓存
        _bricks:[],            //牌墙砖块精灵(牌背贴图)
        _brickFrame:null,      //牌背SpriteFrame
        _brickGfx:null,
        _brickCap:0,
        _brickX:0,             //牌墙x坐标(2人房右/4人房左)
        _sioHandlers:null,     //dispress/exit 原生socket监听(离房返厅,需求4)
        _leaving:false,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        //任一初始化步骤异常都不能中断退出监听的注册,否则房间内点"退出房间"会毫无反应
        try{
            this.initView();
            this.initSeats();
            this.initEventHandlers();
            this.initStartButton();
            this.applyCustomBtnSkins();
            this.initBrickWall();
        }catch(e){
            console.error("[MJRoom] 初始化异常(继续注册退出监听):", (e && e.stack) ? e.stack : e);
        }
        this.initNetExitListeners();
    },
    
    initView:function(){
        var prepare = this.node.getChildByName("prepare");
        //prepare层只放退出/解散/开始按钮,渲染层级必须高于game层:否则开局前牌桌层的手牌(带触摸)会吞掉退出按钮的点击
        var gameNode = this.node.getChildByName("game");
        if(prepare && gameNode && prepare.getSiblingIndex() < gameNode.getSiblingIndex()){
            prepare.setSiblingIndex(gameNode.getSiblingIndex());
        }
        //退出按钮:位置/大小/缩放全部用场景配置,代码只补绑点击事件(场景事件丢失时也能退出)
        var btnBack = prepare.getChildByName("btnBack");
        if(btnBack){
            var btnBackComp = btnBack.getComponent(cc.Button);
            if(btnBackComp && btnBackComp.clickEvents.length == 0){
                cc.vv.utils.addClickEvent(btnBack, this.node, "MJRoom", "onBtnBackClicked");
            }
        }
        //场景已统一为一套座位(只在game下),prepare/seats 删除后不再存在
        var seats = prepare.getChildByName("seats");
        if(seats){
            for(var i = 0; i < seats.children.length; ++i){
                this._seats.push(seats.children[i].getComponent("Seat"));
            }
        }
        
        this.refreshBtns();
        
        this.lblRoomNo = cc.find("Canvas/infobar/Z_room_txt/New Label").getComponent(cc.Label);
        this._timeLabel = cc.find("Canvas/infobar/time").getComponent(cc.Label);
        var roomId = cc.vv.gameNetMgr.roomId;
        //顶部左侧仅保留房号:底分已合并进玩法信息串(getWanfa),避免重复显示
        this.lblRoomNo.string = "房号:" + roomId;
        var gameChild = this.node.getChildByName("game");
        //2人玩法对手固定在上方(up)槽位：_seats2按本机座位顺序排列，localIndex才能索引到正确方位，否则对家头像写到右侧空槽位看不到
        var sides = cc.vv.mahjongmgr.is2Player() ? ["myself","up"] : ["myself","right","up","left"];
        for(var i = 0; i < sides.length; ++i){
            var sideNode = gameChild.getChildByName(sides[i]);
            if(sideNode == null){ continue; }
            var seat = sideNode.getChildByName("seat");
            if(seat == null){ continue; }
            this._seats2.push(seat.getComponent("Seat"));
        }
        //只有一套座位时:准备阶段也直接用game下的座位,所有用到 _seats 的逻辑自然落到同一对象
        if(this._seats.length == 0){
            this._seats = this._seats2;
        }
        
        var btnWechat = cc.find("Canvas/prepare/btnWeichat");
        if(btnWechat){
            cc.vv.utils.addClickEvent(btnWechat,this.node,"MJRoom","onBtnWeichatClicked");
        }
        
        
        var titles = cc.find("Canvas/typeTitle");
        if(titles == null){ return; } //场景无玩法标题节点,跳过避免空引用崩溃
        for(var i = 0; i < titles.children.length; ++i){
            titles.children[i].active = false;
        }
        
        if(cc.vv.gameNetMgr.conf){
            var type = cc.vv.gameNetMgr.conf.type;
            if(type == null || type == ""){
                type = "xzdd";
            }
            //诸暨各玩法(zj/zj_bt/zj4*)在typeTitle中无对应子节点,取不到时直接跳过
            var titleNode = titles.getChildByName(type);
            if(titleNode){ titleNode.active = true; }
        }
    },
    
    refreshBtns:function(){
        //按实际房间人数显隐座位(2人房只留2个座位),使准备界面按钮/座位与玩法一致
        this.applySeatCount();
        var prepare = this.node.getChildByName("prepare");
        var btnDispress = prepare.getChildByName("btnDissolve");
        var btnWeichat = prepare.getChildByName("btnWeichat");
        var btnBack = prepare.getChildByName("btnBack");
        var isIdle = cc.vv.gameNetMgr.numOfGames == 0;

        //按钮规则:未准备→显示"准备+退出(btnBack)",隐藏"解散";已准备→隐藏"准备+退出",显示"解散"
        var seats = cc.vv.gameNetMgr.seats;
        var selfSeat = seats ? seats[cc.vv.gameNetMgr.seatIndex] : null;
        var isReady = !!(selfSeat && selfSeat.ready);
        if(btnDispress){ btnDispress.active = isIdle && isReady; }

        if(btnWeichat){ btnWeichat.active = isIdle; }
        if(btnBack){ btnBack.active = isIdle && !isReady; }
        //"开始"按钮:未开局阶段显示,点击后切换为"已准备"状态(由updateStartBtnState统一管理三态)
        this.updateStartBtnState();
    },

    //按实际房间人数(cc.vv.gameNetMgr.seats.length)统一显隐座位框:
    //2人房只保留准备界面2个座位框 + 游戏界面 myself/up 两个玩家位,隐藏多出的4人座位/相关元素
    applySeatCount:function(){
        var seats = (cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null);
        if(!seats){ return; } //无房间数据时不动,避免误隐藏全部座位
        var count = seats.length;
        for(var i = 0; i < this._seats.length; ++i){
            if(this._seats[i] && this._seats[i].node){
                this._seats[i].node.active = (i < count);
            }
        }
        for(var i = 0; i < this._seats2.length; ++i){
            if(this._seats2[i] && this._seats2[i].node){
                this._seats2[i].node.active = (i < count);
            }
        }
    },
    
    // ===== 需求3:准备界面"开始"按钮(优先复用场景固化的btnStart,没有再克隆btnBack) =====
    initStartButton:function(){
        var prepare = this.node.getChildByName("prepare");
        if(prepare == null){ return; }
        var btn = prepare.getChildByName("btnStart");
        var fromScene = (btn != null); //场景已有则原样使用,不覆盖任何场景配置
        if(btn == null){
            //不存在才创建(克隆btnBack)
            var srcBtn = prepare.getChildByName("btnBack") || prepare.getChildByName("btnDissolve");
            if(srcBtn == null){ return; }
            btn = cc.instantiate(srcBtn);
            btn.name = "btnStart";
            prepare.addChild(btn);
        }
        if(fromScene){
            //场景已有btnStart:完全用场景配置,只补点击事件(场景已绑定则不重复加)
            var c2 = btn.getComponent(cc.Button);
            if(!c2 || !c2.clickEvents || c2.clickEvents.length === 0){
                cc.vv.utils.addClickEvent(btn, this.node, "MJRoom", "onBtnStartClicked");
            }
        }else{
            //场景没有才新建:此时才做去Widget/重绑/换底板/归位
            var wg = btn.getComponent(cc.Widget);
            if(wg){ btn.removeComponent(wg); }
            var comp = btn.getComponent(cc.Button);
            if(comp){
                comp.transition = cc.Button.Transition.NONE;
                comp.clickEvents = [];
            }
            cc.vv.utils.addClickEvent(btn, this.node, "MJRoom", "onBtnStartClicked");
            //按钮图集里的文字是烘焙进图片的,不能直接改字;换成原生无文字红色底板,再叠一个Label
            this.retitleButton(btn, "开始", 44);
            btn.setPosition(482, 98);
            btn.setScale(0.5, 0.78);
        }
        this._startBtn = btn;
        this._startBtn.active = (cc.vv.gameNetMgr.numOfGames == 0);
    },

    onBtnStartClicked:function(){
        var seats = cc.vv.gameNetMgr.seats;
        var selfSeat = seats ? seats[cc.vv.gameNetMgr.seatIndex] : null;
        if(selfSeat && selfSeat.ready){ return; } //已准备,防重复发送
        //服务端改为"全员ready才开局",这里只发ready,不要发别的消息
        cc.vv.net.send("ready");
        //本地即时切换"已准备"状态(服务端 user_state_changed 推送后也会同步)
        if(selfSeat){ selfSeat.ready = true; }
        this.updateStartBtnState();
    },

    //应用按钮皮肤:换SpriteFrame并隐藏动态文字(用户图自带文字)
    _applyBtnFrame:function(btnNode, frame){
        var sp = btnNode.getComponent(cc.Sprite);
        if(sp){
            sp.spriteFrame = frame;
            sp.type = cc.Sprite.Type.SIMPLE;
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        }
        var ln = btnNode.getChildByName("btnLabel");
        if(ln){ ln.active = false; }
    },

    //开始按钮三态:未开局未准备→"开始"图可点;未开局已准备→"已准备"图禁点;已开局→隐藏
    updateStartBtnState:function(){
        var btn = this._startBtn;
        if(btn == null){ return; }
        //未在对局中即显示:结算停留期重进时numOfGames>0,旧条件numOfGames==0会让按钮永不出现,
        //与服务端结算后清ready的广播叠加导致"重进只看到空准备界面且无按钮"的死锁
        var isIdle = cc.vv.gameNetMgr.gamestate != "begin";
        var seats = cc.vv.gameNetMgr.seats;
        var selfSeat = seats ? seats[cc.vv.gameNetMgr.seatIndex] : null;
        var isReady = !!(selfSeat && selfSeat.ready);
        //已准备则隐藏"准备"按钮(规则:准备后只显示解散)
        btn.active = isIdle && !isReady;
        var comp = btn.getComponent(cc.Button);
        if(comp){ comp.interactable = true; }
        //按钮完全用场景里的配置:不改位置/缩放/贴图/文字,只切 active 与 interactable
    },

    //用户自制按钮皮肤(已并入game_ui图集,帧不存在时保持原生按钮):
    //mj_btn_start=开始 / mj_btn_ready=已准备 / mj_btn_back=返回大厅 / mj_btn_dissolve=解散大厅
    applyCustomBtnSkins:function(){
        var prepare = this.node.getChildByName("prepare");
        if(prepare == null){ return; }
        var self = this;
        //game_ui图集加载(带缓存),逐帧取出后按原逻辑应用
        var applyFrame = function(frameName, cb){
            var cache = self._atlasCache = self._atlasCache || {};
            var atlas = cache["images/atlas/game_ui"];
            if(atlas){ cb(atlas.getSpriteFrame(frameName)); return; }
            cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(err, a){
                if(!err && a){ cache["images/atlas/game_ui"] = a; atlas = a; }
                cb(atlas ? atlas.getSpriteFrame(frameName) : null);
            });
        };
        applyFrame("mj_btn_start.png", function(f){
            if(f){ self._startFrame = f; self.updateStartBtnState(); }
        });
        applyFrame("mj_btn_ready.png", function(f){
            if(f){ self._startReadyFrame = f; self.updateStartBtnState(); }
        });
        var back = prepare.getChildByName("btnBack");
        if(back){
            applyFrame("mj_btn_back.png", function(f){
                if(f && cc.isValid(back)){ self._applyBtnFrame(back, f); }
            });
        }
        var dis = prepare.getChildByName("btnDissolve");
        if(dis){
            applyFrame("mj_btn_dissolve.png", function(f){
                if(f && cc.isValid(dis)){ self._applyBtnFrame(dis, f); }
            });
        }
    },

    // 复用原生按钮节点:换无文字底板(images/other/btn_red3) + 叠加文字Label
    // 2.4下动态Label禁用SHRINK(会导致完全不渲染),用NONE
    retitleButton:function(btnNode,text,fontSize){
        if(btnNode == null){ return; }
        var sp = btnNode.getComponent(cc.Sprite);
        if(sp){
            var keepNode = btnNode;
            cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(err, frame){
                if(!err && frame && cc.isValid(keepNode)){
                    var s = keepNode.getComponent(cc.Sprite);
                    if(s){
                        s.spriteFrame = frame;
                        s.type = cc.Sprite.Type.SIMPLE;
                        s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                    }
                }
            });
        }
        fontSize = fontSize || 40;
        var ln = btnNode.getChildByName("btnLabel");
        if(ln == null){
            ln = new cc.Node("btnLabel");
            btnNode.addChild(ln);
        }
        var lb = ln.getComponent(cc.Label);
        if(lb == null){ lb = ln.addComponent(cc.Label); }
        lb.string = text;
        lb.fontSize = fontSize;
        lb.lineHeight = fontSize;
        lb.overflow = cc.Label.Overflow.NONE;
        lb.enableWrapText = false;
        lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
        ln.color = cc.color(255,255,255);
        ln.setPosition(0,0);
    },

    // ===== 牌墙:节点全部在场景 game/brickWall 内摆好 =====
    //U00~U35 对家36张, RT00~RT05 右侧6张, LT00~LT30 左侧31张
    //位置/尺寸/颜色都在编辑器里调,代码只切显隐
    initBrickWall:function(){
        var game = this.node.getChildByName("game");
        if(game == null){ return; }
        var wall = game.getChildByName("brickWall");
        if(wall == null){ this._brickBuilt = false; return; }
        this._brickWall = wall;
        this._brickBuilt = true;
        this._brickRemainCount = 0;
        this._brickZJLao = !!(cc.vv.gameNetMgr.conf && cc.vv.gameNetMgr.conf.type == "zj_lao");
        this._brickPendingTail = false;
        wall.zIndex = -1; //压到座位层之下,防止墙牌盖住吃/碰/杠/过提示字

        this._brickDrawable = []; //可摸的47张:左侧31 → 对家前16
        var lts = [];
        for(var i = 0; i < 31; ++i){
            var lt = wall.getChildByName("LT" + (i < 10 ? "0" : "") + i);
            if(lt){ lts.push(lt); }
        }
        var zjLao = this._brickZJLao;
        if(zjLao){
            //诸暨赖倒胡:左侧从下往上摸,每墩先上层后下层;
            //再到对面从左到右摸,同样每墩先上层后下层
            //每墩配对规则:偶数编号是靠近桌心的上层,奇数编号是下层
            var groups = [];
            for(var i = 0; i < lts.length; i += 2){
                var group = [lts[i]];
                if(lts[i + 1]){ group.push(lts[i + 1]); }
                groups.push(group);
            }
            groups.reverse(); //整面墙改为从下往上
            for(var i = 0; i < groups.length; ++i){
                for(var k = 0; k < groups[i].length; ++k){
                    this._brickDrawable.push(groups[i][k]);
                }
            }
            for(var i = 0; i < 16; ++i){
                this._brickDrawable.push(wall.getChildByName("U" + (i < 10 ? "0" : "") + i));
            }
        } else {
            lts.sort(function(a, b){ return a.y - b.y; });
            for(var i = 0; i < lts.length; ++i){
                this._brickDrawable.push(lts[i]);
            }
            for(var i = 0; i < 16; ++i){
                this._brickDrawable.push(wall.getChildByName("U" + (i < 10 ? "0" : "") + i));
            }
        }
        //初始置灰区26张(对家前 U16-U35 + 右侧 RT00-RT05),普通摸牌不可进入;
        //杠补从置灰区末尾RT05开始向前取,取后置灰区向前移一张并新增后台配置N张
        this._brickDead = [];
        for(var i = 16; i < 36; ++i){
            var du = wall.getChildByName("U" + i);
            if(du){ this._brickDead.push(du); }
        }
        for(var i = 0; i < 6; ++i){
            var drt = wall.getChildByName("RT0" + i);
            if(drt){ this._brickDead.push(drt); }
        }
        this.refreshBrickWall();
    },

    refreshBrickWall:function(){
        if(!this._brickBuilt){ return; }
        var nm = cc.vv.gameNetMgr;
        var n = nm.numOfMJ;
        if(n == null || n < 0){ n = 0; }
        //场上总杠数(暗杠+点杠+弯杠):杠后补牌从死墙尾摸,可摸尾部 gang_liuju*杠数 张转死墙置灰
        var gangs = 0;
        var seats = nm.seats || [];
        for(var si = 0; si < seats.length; ++si){
            var st = seats[si];
            if(!st) continue;
            gangs += (st.angangs ? st.angangs.length : 0) + (st.diangangs ? st.diangangs.length : 0) + (st.wangangs ? st.wangangs.length : 0);
        }
        var gangLiuju = (nm.conf && Number(nm.conf.gang_liuju)) || 0;
        var extra = gangLiuju * gangs;
        //死墙26张:进房间(未开局,numOfMJ=0)隐藏;开局后剩余牌数>=26 时与墙牌一样显示
        var showDead = (n >= 26);
        if(this._brickDead){
            for(var i = 0; i < this._brickDead.length; ++i){
                var dn = this._brickDead[i];
                if(dn){ dn.active = showDead; }
            }
        }
        var drawable = this._brickDrawable;
        if(!this._brickZJLao){
            //其他玩法保持原逻辑
            var d = Math.max(0, Math.min(n - 26 - extra, drawable.length));
            var hide = drawable.length - d;
            var grayStart = drawable.length - extra;
            var remain0 = 0;
            for(var i = 0; i < drawable.length; ++i){
                var node = drawable[i];
                if(!node) continue;
                node.active = (i >= hide);
                var isGray0 = (extra > 0 && i >= grayStart);
                node.color = isGray0 ? new cc.Color(140, 140, 140, 255) : cc.Color.WHITE;
                if(node.active && !isGray0){ remain0++; }
            }
            this._brickRemainCount = remain0;
            return;
        }

        //诸暨赖倒胡:普通摸牌从墙头隐藏;杠补从整个置灰区末尾隐藏
        //补牌完成后,置灰区先向前补一张替代被摸走的牌,再新增本次杠的N张
        var tailDraws = Math.max(0, gangs - (this._brickPendingTail ? 1 : 0));
        var all = drawable.concat(this._brickDead || []);
        var total = all.length;
        var tailStart = total - tailDraws;
        var grayLimit = 26 + gangLiuju * tailDraws;
        var headHide = Math.max(0, Math.min(total, total - n - tailDraws));
        var grayStart = tailStart - grayLimit;
        var remain = 0;
        for(var i = 0; i < total; ++i){
            var node = all[i];
            if(!node) continue;
            node.active = (i >= headHide && i < tailStart);
            var isGray = (node.active && i >= grayStart);
            node.color = isGray ? new cc.Color(140, 140, 140, 255) : cc.Color.WHITE;
            if(node.active && !isGray){ remain++; }
        }
        //"剩余X张"用墙上还能摸的牌数(亮着的牌减掉置灰的死墙)
        this._brickRemainCount = remain;
    },

    // ===== 需求1:notify入口打印服务端载荷,便于实机核对 =====
    _logSeatPayload:function(tag,seatData){
        if(seatData == null){ console.log("[notify]" + tag + " seatData=null"); return; }
        console.log("[notify]" + tag,
            "seatindex=" + seatData.seatindex,
            "userid=" + seatData.userid,
            "holds=" + JSON.stringify(seatData.holds),
            "pengs=" + JSON.stringify(seatData.pengs || []),
            "chis=" + JSON.stringify(seatData.chis || []),
            "angangs=" + JSON.stringify(seatData.angangs || []),
            "diangangs=" + JSON.stringify(seatData.diangangs || []),
            "wangangs=" + JSON.stringify(seatData.wangangs || []));
    },

    // ===== 需求4:监听服务端解散/踢出推送,返回大厅 =====
    // GameNetMgr已注册过这两个事件(只做字段清理,不切场景),Net.addHandler同事件仅允许一个处理器,
    // 这里直接在原生socket上追加监听(同事件可多监听,与既有处理器共存,不修改GameNetMgr)
    initNetExitListeners:function(){
        var sio = cc.vv.net ? cc.vv.net.sio : null;
        if(!sio || !sio.on){ return; }
        if(this._sioHandlers){ return; }
        var self = this;
        var onDispress = function(){
            console.log("[room] dispress_push:返回大厅");
            self.leaveToHall();
        };
        var onExit = function(data){
            var uid = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
            if(uid != null && data == uid){
                console.log("[room] exit_notify_push(自己已被移出房间):返回大厅");
                self.leaveToHall();
            }
        };
        //需求4:服务端"全部结束"标记。GameNetMgr只处理 game_over_push 且仅在带 endinfo 时派发 game_end,
        //未透传 final,也不认 game_all_over_push;这里在原生socket上追加监听做兼容(不改GameNetMgr)
        var onAllOver = function(){
            console.log("[room] game_all_over_push:显示本次游戏总分数");
            self.showTotalScorePanel(null);
        };
        var onGameOverFinal = function(data){
            if(data && (data.final == true || data.endinfo)){
                console.log("[room] game_over_push(final):显示本次游戏总分数");
                self.showTotalScorePanel(data);
            }
        };
        //本机点击"退出房间"后服务端回exit_result并断开socket。
        //GameNetMgr的disconnect处理器已被忽略标记屏蔽(防重复切场景),必须在这里主动离开房间页,
        //否则点退出后界面一直停留在房间里不动。
        var onExitResult = function(){
            console.log("[room] exit_result:退出成功,返回大厅/俱乐部");
            self.leaveToHall();
        };
        sio.on('dispress_push', onDispress);
        sio.on('exit_notify_push', onExit);
        sio.on('game_all_over_push', onAllOver);
        sio.on('game_over_push', onGameOverFinal);
        sio.on('exit_result', onExitResult);
        this._sioHandlers = { sio:sio, listeners:[onDispress, onExit, onAllOver, onGameOverFinal, onExitResult] };
    },

    //需求4:显示"本次游戏总分数"面板(隐藏单局结算面板),并驱动 GameResult 填充列表
    //data为game_over_push原始载荷时透传endinfo/roundHistory,保证每局得分明细不被无明细的总分列表覆盖
    showTotalScorePanel:function(data){
        var gr = this.node.getChildByName("game_result");
        if(gr){ gr.active = true; }
        var go1 = this.node.getChildByName("game_over");
        if(go1){ go1.active = false; }
        var go2 = this.node.getChildByName("game_over_xlch");
        if(go2){ go2.active = false; }
        var comp = this.node.getComponent("GameResult");
        if(comp == null){ return; }
        var d = data || {};
        if(comp.onGameEnd){
            comp.onGameEnd(d.endinfo || null, d.roundHistory || null);
        }
        else if(comp.showTotalScore){
            comp.showTotalScore();
        }
    },

    leaveToHall:function(){
        if(this._leaving){ return; }
        //结算页等流程可能已经自行切到大厅/俱乐部,此时不再重复加载(避免同一次退出切两次场景)
        var curScene = cc.director.getScene ? cc.director.getScene() : null;
        var curName = (curScene && curScene.name) ? curScene.name : "";
        if(curName == "hall" || curName == "club"){ return; }
        this._leaving = true;
        //兜底:2秒后仍停在房间里说明这次切场景没成功,复位标记,保证退出按钮之后还能再点
        var self = this;
        this.scheduleOnce(function(){
            if(!cc.isValid(self.node)){ return; }
            var sc = cc.director.getScene();
            var name = (sc && sc.name) ? sc.name : "";
            if(name != "hall" && name != "club"){ self._leaving = false; }
        }, 2);
        //解散/退出/被移出房间:socket即将被服务端断开,标记忽略本次disconnect,
        //否则断开处理器会再切一次场景(房间流程已决定去向),玩家被带到大厅页而非俱乐部
        //3秒兜底自动复位由GameNetMgr的exit_result/dispress_push处理器统一管理
        if(cc.vv.gameNetMgr){
            cc.vv.gameNetMgr._ignoreDisconnectOnce = true;
        }
        //按进房时记录的来源场景返回来源页(俱乐部进桌回俱乐部详情,大厅进桌回大厅),不固定回大厅
        var nm = cc.vv.gameNetMgr;
        var backClub = (nm && nm.roomBackScene === "club") || cc.vv.fromClubId;
        if(backClub){
            cc.vv.fromClub = true; //来自俱乐部:回独立俱乐部场景(club.fire),由clubScene根据fromClubId直达玩法详情页
            if(nm && nm.roomBackClubId && !cc.vv.fromClubId){ cc.vv.fromClubId = nm.roomBackClubId; }
            if(cc.vv.sceneMgr){ cc.vv.sceneMgr.load("club"); } else { cc.director.loadScene("club"); }
        }
        else{
            if(cc.vv.sceneMgr){ cc.vv.sceneMgr.load("hall"); } else { cc.director.loadScene("hall"); }
        }
    },

    initEventHandlers:function(){
        var self = this;
        //退出/解散成功:GameNetMgr 已把服务端事件转发到场景节点(dataEventHandler),
        //这里监听节点事件,不再只依赖原生socket监听(重连换socket后原生监听会丢,导致点退出后界面不动)
        this.node.on('exit_result',function(){ self.leaveToHall(); });
        this.node.on('dispress_push',function(){ self.leaveToHall(); });
        this.node.on('new_user',function(data){
            self.initSingleSeat(data.detail);
        });
        
        this.node.on('user_state_changed',function(data){
            self.initSingleSeat(data.detail);
            self.refreshBtns(); //ready状态变化后同步 准备/退出/解散 三按钮显隐(refreshBtns内含updateStartBtnState)
        });
        
        this.node.on('game_begin',function(data){
            self.refreshBtns();
            self.initSeats();
        });
        
        this.node.on('game_num',function(data){
            self.refreshBtns();
        });
        
        this.node.on('voice_msg',function(data){
            var data = data.detail;
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });
        
        this.node.on('chat_push',function(data){
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            var s = self._inGame ? self._seats2[localIdx] : self._seats[localIdx];
            if(s){ s.chat(data.content); }
        });        
        this.node.on('quick_chat_push',function(data){
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            
            var index = data.content;
            var info = cc.vv.chat.getQuickChatInfo(index);
            var s = self._inGame ? self._seats2[localIdx] : self._seats[localIdx];
            if(s){ s.chat(info.content); }
            
            cc.vv.audioMgr.playSFX(info.sound);
        });

        this.node.on('emoji_push',function(data){
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            var s = self._inGame ? self._seats2[localIdx] : self._seats[localIdx];
            if(s){ s.emoji(data.content); }
        });

        //需求2:剩余牌数变化时刷新牌墙(game_start/mj_count/game_mopai 都会更新 numOfMJ)
        this.node.on('game_start',function(data){
            self._brickPendingTail = false;
            self.refreshBrickWall();
        });
        this.node.on('mj_count',function(data){ self.refreshBrickWall(); });
        this.node.on('game_mopai',function(data){
            if(self._brickZJLao){ self._brickPendingTail = false; }
            self.refreshBrickWall();
        });
        //杠通知先到时保留即将补走的置灰牌;补牌推送后再隐藏并扩大置灰区
        this.node.on('gang_notify',function(data){
            if(self._brickZJLao){ self._brickPendingTail = true; }
            self.refreshBrickWall();
        });

        //需求1:在 notify 入口打印服务端下发的完整载荷(holds/pengs/chis/gangs),便于实机核对
        this.node.on('game_start',function(data){
            self._inGame = true;
            var seats = cc.vv.gameNetMgr.seats;
            if(!seats){ return; }
            for(var i = 0; i < seats.length; ++i){
                self._logSeatPayload("game_start seat" + i, seats[i]);
            }
            //game_start_push才携带button/laozhuang,开局后刷新座位显示庄家与老庄标识
            self.initSeats();
        });
        this.node.on('peng_notify',function(data){ self._logSeatPayload("peng_notify", data.detail); });
        this.node.on('chi_notify',function(data){ self._logSeatPayload("chi_notify", data.detail); });
        this.node.on('gang_notify',function(data){ self._logSeatPayload("gang_notify", data.detail ? data.detail.seatData : null); });
        this.node.on('game_chupai_notify',function(data){
            self._logSeatPayload("chupai_notify", data.detail ? data.detail.seatData : null);
        });
        this.node.on('game_mopai',function(data){
            var d = data.detail;
            if(d == null){ return; }
            var s = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[d.seatIndex] : null;
            self._logSeatPayload("game_mopai seat" + d.seatIndex, s);
        });
    },
    
    initSeats:function(){
        this.applySeatCount(); //进房即按实际人数显隐座位框(2人房隐藏多余的4人座位框)
        var seats = cc.vv.gameNetMgr.seats;
        if(!seats){ return; } //无房间数据时直接返回,避免null.length崩溃
        for(var i = 0; i < seats.length; ++i){
            this.initSingleSeat(seats[i]);
        }
    },
    
    initSingleSeat:function(seat){
        this.applySeatCount(); //new_user/user_state_changed进房阶段即隐藏多余的4人座位框
        var index = cc.vv.gameNetMgr.getLocalIndex(seat.seatindex);
        var isOffline = !seat.online;
        var isZhuang = seat.seatindex == cc.vv.gameNetMgr.button;
        
        console.log("isOffline:" + isOffline);
        
        //4人房进2座场景时索引会越界,必须直接跳过,否则onLoad中断会导致退出监听等后续初始化全部丢失
        if(!this._seats[index] || !this._seats2[index]){
            return;
        }
        this._seats[index].setInfo(seat.name,seat.score);
        this._seats[index].setReady(seat.ready);
        this._seats[index].setOffline(isOffline);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);

        this._seats2[index].setInfo(seat.name,seat.score);
        this._seats2[index].setZhuang(isZhuang);
        //庄/老庄标识同步到两套座位;Seat内部有动态兜底,场景无zhuang节点也能显示
        this._seats[index].setZhuang(isZhuang);
        var lz = cc.vv.gameNetMgr.laozhuang || 0;
        this._seats[index].setLaoZhuang(isZhuang ? lz : 0);
        this._seats2[index].setLaoZhuang(isZhuang ? lz : 0);
        this._seats2[index].setOffline(isOffline);
        this._seats2[index].setID(seat.userid);
        this._seats2[index].voiceMsg(false);
    },
    
    onBtnSettingsClicked:function(){
        cc.vv.popupMgr.showSettings();   
    },

    onBtnBackClicked:function(){
        //"退出房间"按钮:服务端exit为释放式退出(仅自己退出,不再占用房间;房内还有其他玩家时房间保留给他人),
        //服务端回exit_result清本地状态后断开连接,由disconnect处理器按来源回俱乐部/大厅
        var doSend = function(){ cc.vv.net.send("exit"); };
        //弹窗组件异常时也必须能退出,不能被确认框拖死
        try{
            if(cc.vv.alert && cc.vv.alert.show){
                cc.vv.alert.show(null,"是否确定退出房间？",doSend,true);
                return;
            }
        }catch(e){ console.warn("[room] 退出确认框异常,直接发送exit:", e.message); }
        doSend();
    },
    
    onBtnChatClicked:function(){
        
    },
    
    onBtnWeichatClicked:function(){
        var title = "<血战到底>";
        if(cc.vv.gameNetMgr.conf.type == "xlch"){
            var title = "<血流成河>";
        }
     
    },
    
    onBtnDissolveClicked:function(){
        //同上:避免cc.vv.alert未挂载抛错导致"解散房间"点击无效(修复"点击解散房间没有退出房间")
        var doSend = function(){
            //已开局:走投票解散(对家同意后才解散,原有功能);未开局:直接解散整房
            if(cc.vv.gameNetMgr && cc.vv.gameNetMgr.gamestate == "begin"){
                cc.vv.net.send("dissolve_request");
            }
            else{
                cc.vv.net.send("dispress");
            }
        };
        if(cc.vv.alert && cc.vv.alert.show){
            cc.vv.alert.show(null,"解散房间不扣房卡，是否确定解散？",doSend,true);
        }
        else{
            doSend();
        }
    },
    
    onBtnExit:function(){
        //退出前弹确认框,避免误触直接退房(与解散按钮同一原生弹窗组件)
        var doSend = function(){ cc.vv.net.send("exit"); };
        try{
            if(cc.vv.alert && cc.vv.alert.show){
                // title/content 全传 null:保留场景内默认节点文字
                cc.vv.alert.show(null,"是否确定退出房间？",doSend,true);
                return;
            }
        }catch(e){ console.warn("[room] 退出确认框异常,直接发送exit:", e.message); }
        doSend();
    },
    
    playVoice:function(){
        if(this._playingSeat == null && this._voiceMsgQueue.length){
            console.log("playVoice2");
            var data = this._voiceMsgQueue.shift();
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(idx);
            this._playingSeat = localIndex;
            this._seats[localIndex].voiceMsg(true);
            this._seats2[localIndex].voiceMsg(true);
            
            var msgInfo = JSON.parse(data.content);
            
            var msgfile = "voicemsg.amr";
            console.log(msgInfo.msg.length);
            cc.vv.voiceMgr.writeVoice(msgfile,msgInfo.msg);
            cc.vv.voiceMgr.play(msgfile);
            this._lastPlayTime = Date.now() + msgInfo.time;
        }
    },
    
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        var minutes = Math.floor(Date.now()/1000/60);
        if(this._lastMinute != minutes){
            this._lastMinute = minutes;
            var date = new Date();
            var h = date.getHours();
            h = h < 10? "0"+h:h;
            
            var m = date.getMinutes();
            m = m < 10? "0"+m:m;
            this._timeLabel.string = "" + h + ":" + m;             
        }
        
        
        if(this._lastPlayTime != null){
            if(Date.now() > this._lastPlayTime + 200){
                this.onPlayerOver();
                this._lastPlayTime = null;    
            }
        }
        else{
            this.playVoice();
        }
    },
    
        
    onPlayerOver:function(){
        cc.vv.audioMgr.resumeAll();
        console.log("onPlayCallback:" + this._playingSeat);
        var localIndex = this._playingSeat;
        this._playingSeat = null;
        this._seats[localIndex].voiceMsg(false);
        this._seats2[localIndex].voiceMsg(false);
    },
    
    onDestroy:function(){
        cc.vv.voiceMgr.stop();
//        cc.vv.voiceMgr.onPlayCallback = null;
        //移除本场景追加的原生socket监听,避免切场景后句柄堆积
        if(this._sioHandlers && this._sioHandlers.sio){
            var sio = this._sioHandlers.sio;
            var listeners = this._sioHandlers.listeners || [];
            for(var i = 0; i < listeners.length; ++i){
                if(sio.removeListener){ sio.removeListener(listeners[i]); }
                else if(sio.off){ sio.off(listeners[i]); }
            }
            this._sioHandlers = null;
        }
    }
});

// force-recompile
