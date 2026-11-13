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
        _gameover:null,
        _gameresult:null,
        _seats:[],
        _isGameEnd:false,
        _pingju:null,
        _win:null,
        _lose:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        if(cc.vv.gameNetMgr.conf == null){
            return;
        }
        if(cc.vv.gameNetMgr.conf.type == "xzdd"){
            this._gameover = this.node.getChildByName("game_over");
        }
        else{
            this._gameover = this.node.getChildByName("game_over_xlch");
        }
        if(this._gameover == null){
            console.error('[GameOver] 场景里没有结算弹窗节点,跳过初始化');
            return;
        }
        this._gameover.active = false;

        //弹窗内部节点可能被包在容器里,统一递归查找,避免层级调整后取不到而中断onLoad
        this._pingju = this.findDeep(this._gameover, "pingju");
        this._win = this.findDeep(this._gameover, "win");
        this._lose = this.findDeep(this._gameover, "lose");

        //弹窗的层级/位置/大小/缩放全部在场景里配置,JS不再调整

        this._gameresult = this.node.getChildByName("game_result");
        
        var wanfaNode = this.findDeep(this._gameover, "wanfa");
        var wanfa = wanfaNode ? wanfaNode.getComponent(cc.Label) : null;
        if(wanfa){ wanfa.string = cc.vv.gameNetMgr.getWanfa(); }
        
        var listRoot = this.findDeep(this._gameover, "result_list");
        if(listRoot == null){
            console.error('[GameOver] 结算弹窗缺少 result_list 列表节点');
        }
        for(var i = 1; i <= 4; ++i){
            if(listRoot == null){ break; }
            var s = "s" + i;
            var sn = listRoot.getChildByName(s);
            if(sn == null){ break; }
            var viewdata = {};
            viewdata.username = sn.getChildByName('username').getComponent(cc.Label);
            viewdata.reason = sn.getChildByName('reason').getComponent(cc.Label);
            
            var f = sn.getChildByName('fan');
            if(f != null){
                viewdata.fan = f.getComponent(cc.Label);    
            }
            
            viewdata.score = sn.getChildByName('score').getComponent(cc.Label);
            viewdata.hu = sn.getChildByName('hu');
            viewdata.mahjongs = sn.getChildByName('pai');
            viewdata.zhuang = sn.getChildByName('zhuang');
            viewdata.hupai = sn.getChildByName('hupai');
            //结算行头像:场景里每行可放一个 useravatars 节点(带 cc.Sprite),运行时挂 ImageLoader 拉真实头像
            viewdata.avatar = sn.getChildByName('useravatars');
            viewdata._pengandgang = [];
            this._seats.push(viewdata);
        }
        
        //初始化网络事件监听器
        var self = this;
        this.node.on('game_over',function(data){self.onGameOver(data.detail);});
        console.log('[GameOver] 结算弹窗初始化完成, 座位行数=' + this._seats.length);
        
        this.node.on('game_end',function(data){
            self._isGameEnd = true;
            //最终结算:取消单局结算的30秒自动准备定时器,最终弹窗不自动关闭
            if(self._autoReadyCb){
                self.unschedule(self._autoReadyCb);
                self._autoReadyCb = null;
            }
            //需求4:牌局全部结束(服务端下发endinfo/最终结算)时直接展示"本次游戏总分数"面板
            //game_result 的位置/大小/缩放全部在场景里配置,JS只控制显隐
            if(self._gameresult){ self._gameresult.active = true; }
            if(self._gameover){ self._gameover.active = false; }
        });
    },

    //结算行头像:节点上补一个 ImageLoader(场景里该节点需要有 cc.Sprite 作为载体)
    setAvatar:function(node, userid){
        if(node == null || userid == null){ return; }
        var il = node.getComponent("ImageLoader");
        if(il == null){
            try{ il = node.addComponent("ImageLoader"); }catch(e){ il = null; }
        }
        if(il && il.setUserID){ il.setUserID(userid); }
    },

    //切换标题艺术字:win/lose/pingju 只显示一个,"none"全隐藏;节点缺失时跳过
    showTitle:function(which){
        var views = { pingju: this._pingju, win: this._win, lose: this._lose };
        for(var k in views){
            if(views[k]){ views[k].active = (k == which); }
        }
    },

    //按名字递归查找子节点:结算弹窗内部节点可能被包在容器节点里
    findDeep:function(root, name){
        if(root == null){ return null; }
        if(root.name == name){ return root; }
        var ch = root.children || [];
        for(var i = 0; i < ch.length; ++i){
            var r = this.findDeep(ch[i], name);
            if(r){ return r; }
        }
        return null;
    },

    //结算弹窗弹入动画:从60%缩小+透明回弹到正常大小
    _popIn:function(node){
        if(!node){ return; }
        if(this._popBase == null){ this._popBase = {}; }
        var key = node.uuid;
        if(this._popBase[key] == null){ this._popBase[key] = node.scaleX; }
        var base = this._popBase[key];
        cc.Tween.stopAllByTarget(node);
        node.setScale(base * 0.6);
        node.opacity = 0;
        cc.tween(node).to(0.28, {scaleX: base, scaleY: base, opacity: 255}, {easing: "backOut"}).start();
    },
    
    onGameOver(data){
        var type = cc.vv.gameNetMgr.conf.type;
        if(type == "zj" || type == "zj_bt" || type == "zj4" || type == "zj4_bt" || type == "zj_lao" || type == "zj_zx" || type == "zj4_zx"){
            this.onGameOver_ZJ(data);
        }
        else if(type == "xzdd"){
            this.onGameOver_XZDD(data);
        }
        else{
            this.onGameOver_XLCH(data);
        }
    },

    //诸暨三玩法结算（results: [{userid,score,totalscore,holds,pengs,chis,folds,angangs,diangangs,wangangs,huinfo:[{ishupai,pai,action:zimo|hu|fangpao,fan:台数}]}]）
    onGameOver_ZJ:function(data){
        var type = cc.vv.gameNetMgr.conf ? cc.vv.gameNetMgr.conf.type : null;
        console.log(data);
        if(!data || data.length == 0){
            this._gameresult.active = true;
            return;
        }
        this._gameover.active = true;
        this._popIn(this._gameover);
        this.showTitle("none");

        var myIdx = cc.vv.gameNetMgr.seatIndex;
        var myscore = 0;
        for(var i = 0; i < data.length; ++i){
            if(data[i] && data[i].userid == cc.vv.gameNetMgr.seats[myIdx].userid){
                myscore = data[i].score;
                break;
            }
        }
        this.showTitle(myscore > 0 ? "win" : (myscore < 0 ? "lose" : "pingju"));

        //显示玩家信息（按实际座位数渲染，隐藏多余座位行）
        for(var i = 0; i < this._seats.length; ++i){
            var seatView = this._seats[i];
            var userData = data[i];
            var rowRoot = seatView.username.node.parent;
            if(!userData){
                rowRoot.active = false;
                continue;
            }
            rowRoot.active = true;

            var hued = false;
            var actionArr = [];
            var hupaiRoot = seatView.hupai;
            for(var j = 0; j < hupaiRoot.children.length; ++j){
                hupaiRoot.children[j].active = false;
            }

            var hi = 0;
            var huinfo = userData.huinfo || [];
            for(var j = 0; j < huinfo.length; ++j){
                var info = huinfo[j];
                hued = hued || info.ishupai;
                if(info.ishupai){
                    if(hi < hupaiRoot.children.length){
                        var hupaiView = hupaiRoot.children[hi];
                        hupaiView.active = true;
                        hupaiView.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_",info.pai);
                        hi++;
                    }
                    if(info.action == "zimo"){
                        actionArr.push("自摸");
                    }
                    else if(info.action == "hu"){
                        actionArr.push("接炮胡");
                    }
                    if(type == "zj_lao"){
                        //赖倒胡:不算台数,只显示后台开了翻倍的项(财吊/天胡/地胡等),不显示"X台"与台数明细
                        if(info.tailog && info.tailog.length){
                            var laoLogs = [];
                            for(var li = 0; li < info.tailog.length; ++li){
                                if(info.tailog[li].indexOf("×2") >= 0){ laoLogs.push(info.tailog[li]); }
                            }
                            if(laoLogs.length){ actionArr.push(laoLogs.join("，")); }
                        }
                    }
                    else if(info.fan != null){
                        actionArr.push(info.fan + "台");
                        // 台项明细（服务端 taiLog：如 无财+1、对对胡+1）
                        if(info.tailog && info.tailog.length){
                            actionArr.push("(" + info.tailog.join("，") + ")");
                        }
                    }
                }
                else if(info.action == "fangpao"){
                    actionArr.push("放炮");
                }
            }

            //包财神:胡牌分与包台分分开显示,胡牌者为正、赔付方为负;同时标出本局包家与所包台数
            if(type == "zj_bt"){
                if(userData.isBao){
                    //包家信息放最前面: 包家+包法(双财/独财/无财)+包X台
                    var modeText = "";
                    if(userData.baoModeOfRound === 0){ modeText = "无财"; }
                    else if(userData.baoModeOfRound === 1){ modeText = "独财"; }
                    else if(userData.baoModeOfRound === 2){ modeText = "双财"; }
                    var baoText = "包家" + modeText;
                    if(userData.baoTaiOfRound){
                        baoText += "包" + userData.baoTaiOfRound + "台";
                    }
                    actionArr.unshift(baoText);
                }
                var baseSc = userData.huBaseScore || 0;
                var baoSc = userData.baoTaiScore || 0;
                if(baseSc != 0){
                    actionArr.push("胡牌分" + (baseSc > 0 ? "+" : "") + baseSc);
                }
                if(baoSc != 0){
                    actionArr.push("包台分" + (baoSc > 0 ? "+" : "") + baoSc);
                }
            }

            seatView.hu.active = hued;

            var angangs = userData.angangs || [];
            var diangangs = userData.diangangs || [];
            var wangangs = userData.wangangs || [];
            var pengs = userData.pengs || [];
            var chis = userData.chis || [];
            if(angangs.length){
                actionArr.push("暗杠x" + angangs.length);
            }
            if(diangangs.length){
                actionArr.push("明杠x" + diangangs.length);
            }
            if(wangangs.length){
                actionArr.push("补杠x" + wangangs.length);
            }

            seatView.username.string = cc.vv.gameNetMgr.seats[i] ? cc.vv.gameNetMgr.seats[i].name : "";
            this.setAvatar(seatView.avatar, userData.userid);
            seatView.zhuang.active = cc.vv.gameNetMgr.button == i;
            //老庄:庄家连庄>=1时在庄标正下方显示"老庄X"(与游戏内头像庄标规则一致)
            var lzCnt = (cc.vv.gameNetMgr.button == i) ? (cc.vv.gameNetMgr.laozhuang || 0) : 0;
            this.updateSettleLaoZhuang(seatView, lzCnt);
            seatView.reason.string = actionArr.join("、");

            if(userData.score > 0){
                seatView.score.string = "+" + userData.score;
            }
            else{
                seatView.score.string = "" + userData.score;
            }

            //隐藏所有牌
            for(var k = 0; k < seatView.mahjongs.childrenCount; ++k){
                seatView.mahjongs.children[k].active = false;
            }

            var holds = (userData.holds || []).slice();
            //对手结算手牌可能仅返回数量，无法展示则跳过
            if(typeof(holds) != "object" || holds.length == null){
                holds = [];
            }
            cc.vv.mahjongmgr.sortMJ(holds);

            //碰/杠/吃占用位置
            var numOfGangs = angangs.length + wangangs.length + diangangs.length;
            var lackingNum = (pengs.length + numOfGangs + chis.length)*3;
            //显示手牌
            for(var k = 0; k < holds.length; ++k){
                var pai = holds[k];
                var n = seatView.mahjongs.children[k + lackingNum];
                if(n == null){ break; }
                n.active = true;
                var sprite = n.getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_",pai);
            }

            for(var k = 0; k < seatView._pengandgang.length; ++k){
                seatView._pengandgang[k].active = false;
            }

            //初始化杠牌
            var index = 0;
            for(var k = 0; k < angangs.length; ++k){
                this.initPengAndGangs(seatView,index,angangs[k],"angang");
                index++;
            }
            for(var k = 0; k < diangangs.length; ++k){
                this.initPengAndGangs(seatView,index,diangangs[k],"diangang");
                index++;
            }
            for(var k = 0; k < wangangs.length; ++k){
                this.initPengAndGangs(seatView,index,wangangs[k],"wangang");
                index++;
            }
            //初始化碰牌
            for(var k = 0; k < pengs.length; ++k){
                //财神碰的组按真实组成渲染(pengTiles与pengs平行)
                var pt = (userData.pengTiles && userData.pengTiles[k]) || null;
                this.initPengAndGangs(seatView,index,pengs[k],"peng",pt);
                index++;
            }
            //初始化吃牌（chis为二维数组，每组3张平铺展示）
            for(var k = 0; k < chis.length; ++k){
                var chiArr = chis[k];
                if(chiArr && chiArr.length > 0){
                    this.initChisGroup(seatView,index,chiArr);
                    index++;
                }
            }
        }

        //本局财神展示(牌图):自选玩法每人财神不同不展示;无财模式(包麻将选无财)服务端下发-1自动隐藏
        this.showSettleCaishen();
        //30秒未操作自动关闭并准备下一局(最终结算弹窗由game_end接管,不自动关)
        this.startAutoReadyTimer();
    },

    //单局结算弹窗:本局财神展示区(绑定场景内已固化的settleCsArea节点,位置在编辑器里手动调整,代码只设牌面/显隐)
    showSettleCaishen:function(){
        var conf = cc.vv.gameNetMgr.conf || {};
        if(conf.type == "zj_zx" || conf.type == "zj4_zx"){ return; }
        var cs1 = (conf.caishen != null) ? conf.caishen : -1;
        var cs2 = (conf.caishen2 != null) ? conf.caishen2 : -1;
        if(cs1 < 0){ return; }
        // 绑定场景内已固化的财神展示区:路径 game_result/settleCsArea (用户在编辑器里手动摆好位置)
        var area = this.findDeep(this._gameover, "settleCsArea");
        if(!area){
            console.log("[结算财神] 场景内未找到 settleCsArea 节点,跳过显示(请在结算弹窗下手动添加)");
            return;
        }
        area.active = true;
        var ids = (cs2 >= 0 && cs2 != cs1) ? [cs1, cs2] : [cs1];
        // 财神标签 csLab(场景内固化,文字已在编辑器设置好);找不到也跳过
        var lab = area.getChildByName("csLab");
        if(lab) lab.active = true;
        // 财神牌面节点 cs0/cs1(场景内固化,Sprite组件已挂好),代码只赋值 spriteFrame
        for(var i = 0; i < 2; ++i){
            var tn = area.getChildByName("cs" + i);
            if(!tn){ continue; }
            var sp = tn.getComponent(cc.Sprite);
            if(i < ids.length){
                tn.active = true;
                if(sp){ sp.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", ids[i]); }
            } else {
                tn.active = false;
            }
        }
    },

    //单局结算30秒未操作:自动关闭弹窗并发送ready进入下一局(与点击"准备"按钮等价)
    startAutoReadyTimer:function(){
        if(this._autoReadyCb){
            this.unschedule(this._autoReadyCb);
            this._autoReadyCb = null;
        }
        if(this._isGameEnd){ return; }
        var self = this;
        this._autoReadyCb = function(){
            self._autoReadyCb = null;
            if(self._gameover && self._gameover.active){
                console.log("[结算]30秒未操作,自动准备下一局");
                self.onBtnReadyClicked();
            }
        };
        this.scheduleOnce(this._autoReadyCb, 30);
    },

    //结算行老庄标签:节点在场景里(s*/zhuang/laozhuang_ex,含 Label+描边),JS只填字和显隐
    updateSettleLaoZhuang:function(seatView, count){
        var z = seatView.zhuang;
        if(!z){ return; }
        var lz = z.getChildByName("laozhuang_ex");
        if(lz == null){ return; }
        var show = (count != null && count >= 1);
        lz.active = show;
        if(show){
            var lb = lz.getComponent(cc.Label);
            if(lb){ lb.string = "老庄" + count; }
        }
    },

    onGameOver_XZDD(data){
        console.log(data);
        if(data.length == 0){
            this._gameresult.active = true;
            return;
        }
        this._gameover.active = true;
        this._popIn(this._gameover);

        var myscore = data[cc.vv.gameNetMgr.seatIndex].score;
        this.showTitle(myscore > 0 ? "win" : (myscore < 0 ? "lose" : "pingju"));
        
            
        //显示玩家信息
        for(var i = 0; i < 4; ++i){
            var seatView = this._seats[i];
            var userData = data[i];
            var hued = false;
            //胡牌的玩家才显示 是否清一色 根xn的字样
            var numOfGangs = userData.angangs.length + userData.wangangs.length + userData.diangangs.length;
            var numOfGen = userData.numofgen;
            var actionArr = [];
            var is7pairs = false;
            var ischadajiao = false;
            for(var j = 0; j < userData.actions.length; ++j){
                var ac = userData.actions[j];
                if(ac.type == "zimo" || ac.type == "ganghua" || ac.type == "dianganghua" || ac.type == "hu" || ac.type == "gangpaohu" || ac.type == "qiangganghu" || ac.type == "chadajiao"){
                    if(userData.pattern == "7pairs"){
                        actionArr.push("七对");
                    }
                    else if(userData.pattern == "l7pairs"){
                        actionArr.push("龙七对");
                    }
                    else if(userData.pattern == "j7pairs"){
                        actionArr.push("将七对");
                    }
                    else if(userData.pattern == "duidui"){
                        actionArr.push("碰碰胡");
                    }
                    else if(userData.pattern == "jiangdui"){
                        actionArr.push("将对");
                    }
                    
                    if(ac.type == "zimo"){
                        actionArr.push("自摸");
                    }
                    else if(ac.type == "ganghua"){
                        actionArr.push("杠上花");
                    }
                    else if(ac.type == "dianganghua"){
                        actionArr.push("点杠花");
                    }
                    else if(ac.type == "gangpaohu"){
                        actionArr.push("杠炮胡");
                    }
                    else if(ac.type == "qiangganghu"){
                        actionArr.push("抢杠胡");
                    }
                    else if(ac.type == "chadajiao"){
                        ischadajiao = true;
                    }
                    hued = true;
                }
                else if(ac.type == "fangpao"){
                    actionArr.push("放炮");
                }
                else if(ac.type == "angang"){
                    actionArr.push("暗杠");
                }
                else if(ac.type == "diangang"){
                    actionArr.push("明杠");
                }
                else if(ac.type == "wangang"){
                    actionArr.push("弯杠");
                }
                else if(ac.type == "fanggang"){
                   actionArr.push("放杠");
                }
                else if(ac.type == "zhuanshougang"){
                    actionArr.push("转手杠");
                }
                else if(ac.type == "beiqianggang"){
                    actionArr.push("被抢杠");
                }
                else if(ac.type == "beichadajiao"){
                    actionArr.push("被查叫");
                }
            }
            
            if(hued){
                if(userData.qingyise){
                    actionArr.push("清一色");
                }
                
                if(userData.menqing){
                    actionArr.push("门清");
                }
                
                if(userData.zhongzhang){
                    actionArr.push("中张");
                }
                
                if(userData.jingouhu){
                    actionArr.push("金钩胡");
                }
                                
                if(userData.haidihu){
                    actionArr.push("海底胡");
                }
                
                if(userData.tianhu){
                    actionArr.push("天胡");
                }
                
                if(userData.dihu){
                    actionArr.push("地胡");
                }
            
                if(numOfGen > 0){
                    actionArr.push("根x" + numOfGen); 
                }                
                
                if(ischadajiao){
                    actionArr.push("查大叫");
                }
            }
            
            for(var o = 0; o < 3;++o){
                seatView.hu.children[o].active = false;    
            }
            if(userData.huorder >= 0){
                seatView.hu.children[userData.huorder].active = true;    
            }

            seatView.username.string = cc.vv.gameNetMgr.seats[i].name;
            seatView.zhuang.active = cc.vv.gameNetMgr.button == i;
            seatView.reason.string = actionArr.join("、");
            
            //胡牌的玩家才有番
            var fan = 0;
            if(hued){
                fan = userData.fan;
            }
            seatView.fan.string = fan + "番";
            
            //
            if(userData.score > 0){
                seatView.score.string = "+" + userData.score;    
            }
            else{
                seatView.score.string = userData.score;
            }
           
            
            var hupai = -1;
            if(hued){
                hupai = userData.holds.pop();
            }
            
            cc.vv.mahjongmgr.sortMJ(userData.holds,userData.dingque);
            
            //胡牌不参与排序
            if(hued){
                userData.holds.push(hupai);
            }
            
            //隐藏所有牌
            for(var k = 0; k < seatView.mahjongs.childrenCount; ++k){
                var n = seatView.mahjongs.children[k];
                n.active = false;
            }
           
            var lackingNum = (userData.pengs.length + numOfGangs)*3; 
            //显示相关的牌
            for(var k = 0; k < userData.holds.length; ++k){
                var pai = userData.holds[k];
                var n = seatView.mahjongs.children[k + lackingNum];
                n.active = true;
                var sprite = n.getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_",pai);
            }
            
            
            for(var k = 0; k < seatView._pengandgang.length; ++k){
                seatView._pengandgang[k].active = false;
            }
            
            //初始化杠牌
            var index = 0;
            var gangs = userData.angangs;
            for(var k = 0; k < gangs.length; ++k){
                var mjid = gangs[k];
                this.initPengAndGangs(seatView,index,mjid,"angang");
                index++;    
            }
            
            var gangs = userData.diangangs;
            for(var k = 0; k < gangs.length; ++k){
                var mjid = gangs[k];
                this.initPengAndGangs(seatView,index,mjid,"diangang");
                index++;    
            }
            
            var gangs = userData.wangangs;
            for(var k = 0; k < gangs.length; ++k){
                var mjid = gangs[k];
                this.initPengAndGangs(seatView,index,mjid,"wangang");
                index++;    
            }
            
            //初始化碰牌
            var pengs = userData.pengs
            if(pengs){
                for(var k = 0; k < pengs.length; ++k){
                    var mjid = pengs[k];
                    this.initPengAndGangs(seatView,index,mjid,"peng");
                    index++;    
                }    
            }
        }
    },
    onGameOver_XLCH:function(data){
        console.log(data);
        if(data.length == 0){
            this._gameresult.active = true;
            return;
        }
        this._gameover.active = true;
        this._popIn(this._gameover);
        var myscore = data[cc.vv.gameNetMgr.seatIndex].score;
        this.showTitle(myscore > 0 ? "win" : (myscore < 0 ? "lose" : "pingju"));
            
        //显示玩家信息
        for(var i = 0; i < 4; ++i){
            var seatView = this._seats[i];
            var userData = data[i];
            var hued = false;
            var actionArr = [];
            var is7pairs = false;
            var ischadajiao = false;
            var hupaiRoot = seatView.hupai;
            
            for(var j = 0; j < hupaiRoot.children.length; ++j){
                hupaiRoot.children[j].active = false;
            }
            
            var hi = 0;
            for(var j = 0; j < userData.huinfo.length; ++j){
                var info = userData.huinfo[j];
                hued = hued || info.ishupai;
                if(info.ishupai){
                    if(hi < hupaiRoot.children.length){
                        var hupaiView = hupaiRoot.children[hi]; 
                        hupaiView.active = true;
                        hupaiView.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_",info.pai);
                        hi++;   
                    }
                }
                
                var str = ""
                var sep = "";
                
                var dataseat = userData;
                if(!info.ishupai){
                    if(info.action == "fangpao"){
                        str = "放炮";
                    }
                    else if(info.action == "gangpao"){
                        str = "杠上炮";
                    }
                    else if(info.action == "beiqianggang"){
                        str = "被抢杠";
                    }
                    else{
                        str = "被查大叫";
                    }
                    
                    dataseat = data[info.target]; 
                    info = dataseat.huinfo[info.index];
                }
                else{
                    if(info.action == "hu"){
                        str = "接炮胡"
                    }
                    else if(info.action == "zimo"){
                        str = "自摸";
                    }
                    else if(info.action == "ganghua"){
                        str = "杠上花";
                    }
                    else if(info.action == "dianganghua"){
                        str = "点杠花";
                    }
                    else if(info.action == "gangpaohu"){
                        str = "杠炮胡";
                    }
                    else if(info.action == "qiangganghu"){
                        str = "抢杠胡";
                    }
                    else if(info.action == "chadajiao"){
                        str = "查大叫";
                    }   
                }
                
                str += "(";
                
                if(info.pattern == "7pairs"){
                    str += "七对";
                    sep = "、"
                }
                else if(info.pattern == "l7pairs"){
                    str += "龙七对";
                    sep = "、"
                }
                else if(info.pattern == "j7pairs"){
                    str += "将七对";
                    sep = "、"
                }
                else if(info.pattern == "duidui"){
                    str += "碰碰胡";
                    sep = "、"
                }
                else if(info.pattern == "jiangdui"){
                    str += "将对";
                    sep = "、"
                }
                    
                if(info.haidihu){
                    str += sep + "海底胡";
                    sep = "、";
                }
                
                if(info.tianhu){
                    str += sep + "天胡";
                    sep = "、";
                }
                
                if(info.dihu){
                    str += sep + "地胡";
                    sep = "、";
                }
                
                if(dataseat.qingyise){
                    str += sep + "清一色";
                    sep = "、";
                }
                
                if(dataseat.menqing){
                    str += sep + "门清";
                    sep = "、";
                }
                
                if(dataseat.jingouhu){
                    str += sep + "金钩胡";
                    sep = "、";
                }
                         
                if(dataseat.zhongzhang){
                    str += sep + "中张";
                    sep = "、";
                }
            
                if(info.numofgen > 0){
                    str += sep + "根x" + info.numofgen;
                    sep = "、"; 
                }
                
                if(sep == ""){
                    str += "平胡";
                }
                
                str += "、" + info.fan + "番";
                
                str += ")";
                actionArr.push(str);
            }
            
            seatView.hu.active = hued;
            
            if(userData.angangs.length){
                actionArr.push("暗杠x" + userData.angangs.length);
            }
            
            if(userData.diangangs.length){
                actionArr.push("明杠x" + userData.diangangs.length);
            }
            
            if(userData.wangangs.length){
                actionArr.push("巴杠x" + userData.wangangs.length);
            }

            seatView.username.string = cc.vv.gameNetMgr.seats[i].name;
            seatView.zhuang.active = cc.vv.gameNetMgr.button == i;
            seatView.reason.string = actionArr.join("、");
            
            //
            if(userData.score > 0){
                seatView.score.string = "+" + userData.score;    
            }
            else{
                seatView.score.string = userData.score;
            }
           
            //隐藏所有牌
            for(var k = 0; k < seatView.mahjongs.childrenCount; ++k){
                var n = seatView.mahjongs.children[k];
                n.active = false;
            }
            
            cc.vv.mahjongmgr.sortMJ(userData.holds,userData.dingque);
            
            var numOfGangs = userData.angangs.length + userData.wangangs.length + userData.diangangs.length;
           
            var lackingNum = (userData.pengs.length + numOfGangs)*3; 
            //显示相关的牌
            for(var k = 0; k < userData.holds.length; ++k){
                var pai = userData.holds[k];
                var n = seatView.mahjongs.children[k + lackingNum];
                n.active = true;
                var sprite = n.getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_",pai);
            }
            
            
            for(var k = 0; k < seatView._pengandgang.length; ++k){
                seatView._pengandgang[k].active = false;
            }
            
            //初始化杠牌
            var index = 0;
            var gangs = userData.angangs;
            for(var k = 0; k < gangs.length; ++k){
                var mjid = gangs[k];
                this.initPengAndGangs(seatView,index,mjid,"angang");
                index++;    
            }
            
            var gangs = userData.diangangs;
            for(var k = 0; k < gangs.length; ++k){
                var mjid = gangs[k];
                this.initPengAndGangs(seatView,index,mjid,"diangang");
                index++;    
            }
            
            var gangs = userData.wangangs;
            for(var k = 0; k < gangs.length; ++k){
                var mjid = gangs[k];
                this.initPengAndGangs(seatView,index,mjid,"wangang");
                index++;    
            }
            
            //初始化碰牌
            var pengs = userData.pengs
            if(pengs){
                for(var k = 0; k < pengs.length; ++k){
                    var mjid = pengs[k];
                    this.initPengAndGangs(seatView,index,mjid,"peng");
                    index++;    
                }    
            }
        }
    },
    
    initPengAndGangs:function(seatView,index,mjid,flag,tiles){
        var pgroot = null;
        if(seatView._pengandgang.length <= index){
            pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            seatView._pengandgang.push(pgroot);
            seatView.mahjongs.addChild(pgroot);
        }
        else{
            pgroot = seatView._pengandgang[index];
            pgroot.active = true;
        }

        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        var pi = 0; //碰组真实组成渲染索引(仅peng且有tiles时)
        for(var s = 0; s < sprites.length; ++s){
            var sprite = sprites[s];
            if(sprite.node.name == "gang"){
                var isGang = flag != "peng";
                sprite.node.active = isGang;
                sprite.node.scaleX = 1.0;
                sprite.node.scaleY = 1.0;
                if(flag == "angang"){
                    sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
                    sprite.node.scaleX = 1.4;
                    sprite.node.scaleY = 1.4;
                }
                else{
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_",mjid);
                }
            }
            else{
                var showMj = (flag == "peng" && tiles && pi < tiles.length) ? tiles[pi] : mjid;
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_",showMj);
                pi++;
            }
        }
        pgroot.x = index * 55 * 3 + index * 10;
    },

    //吃牌组：3张不同的牌平铺显示（复用碰预制体，隐藏gang背后逐张赋值）
    initChisGroup:function(seatView,index,chiArr){
        var pgroot = null;
        if(seatView._pengandgang.length <= index){
            pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            seatView._pengandgang.push(pgroot);
            seatView.mahjongs.addChild(pgroot);
        }
        else{
            pgroot = seatView._pengandgang[index];
            pgroot.active = true;
        }
        var sorted = chiArr.slice().sort(function(a,b){return a-b;});
        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        var pi = 0;
        for(var s = 0; s < sprites.length; ++s){
            var sprite = sprites[s];
            if(sprite.node.name == "gang"){
                sprite.node.active = false; //吃牌无杠背
            }
            else{
                var mj = (pi < sorted.length) ? sorted[pi] : sorted[sorted.length - 1];
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_",mj);
                pi++;
            }
        }
        pgroot.x = index * 55 * 3 + index * 10;
    },
    
    onBtnReadyClicked:function(){
        console.log("onBtnReadyClicked");
        //手动点准备:取消30秒自动准备定时器,避免重复发送ready
        if(this._autoReadyCb){
            this.unschedule(this._autoReadyCb);
            this._autoReadyCb = null;
        }
        if(this._isGameEnd){
            this._gameresult.active = true;
        }
        else{
            cc.vv.net.send('ready');   
        }
        this._gameover.active = false;
    },
    
    onBtnShareClicked:function(){
        console.log("onBtnShareClicked");
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
