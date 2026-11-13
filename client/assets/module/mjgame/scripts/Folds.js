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
        _folds:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        this.initView();
        this.initEventHandler();
        this._initDirMarker();

        this.initAllFolds();
    },

    //方向标(baoqei_a图集)定位最新弃牌:仅诸暨赖倒胡启用,Folds为各玩法共用
    _initDirMarker:function(){
        this._dirFrame = null;
        this._dirMarker = null;
        if(this.node.getComponent("MJGameZJLAO") == null){ return; }
        var self = this;
        cc.loader.loadRes("images/atlas/baoqei_a", cc.SpriteAtlas, function(err, atlas){
            if(err || !atlas){ console.warn("[folds] 方向标图集加载失败", err); return; }
            self._dirFrame = atlas.getSpriteFrame("方向标"); //Cocos图集帧名不带扩展名
            console.log("[folds] 方向标图集加载完成 frame=", !!self._dirFrame);
        });
    },

    _isZjlao:function(){
        return this.node.getComponent("MJGameZJLAO") != null;
    },
    
    initView:function(){
        this._folds = {};
        var game = this.node.getChildByName("game");
        var sides = ["myself","right","up","left"];
        for(var i = 0; i < sides.length; ++i){
            var sideName = sides[i];
            var sideRoot = game.getChildByName(sideName);
            if(sideRoot == null){ continue; } //2人场景已删除right/left子树,跳过不存在的方位
            var folds = [];
            var foldRoot = sideRoot.getChildByName("folds");
            for(var j = 0; j < foldRoot.children.length; ++j){
                var n = foldRoot.children[j];
                n.active = false;
                var sprite = n.getComponent(cc.Sprite); 
                sprite.spriteFrame = null;
                folds.push(sprite);            
            }
            this._folds[sideName] = folds; 
        }
        
        this.hideAllFolds();
    },
    
    hideAllFolds:function(){
        for(var k in this._folds){
            var f = this._folds[k];
            for(var i in f){
                f[i].node.active = false;
            }
        }
    },
    
    initEventHandler:function(){
        var self = this;
        this.node.on('game_begin',function(data){
            self.initAllFolds();
        });  
        
        //断线重连补发的事件名是 game_start 而不是 game_begin, 必须监听
        this.node.on('game_start',function(data){
            self.initAllFolds();
        });
        
        this.node.on('game_sync',function(data){
            self.initAllFolds();
        });
        
        //出牌推送的 payload 是 {seatData,pai}，之前直接当成座位数据传入，
        //导致 initFolds 读不到 folds 字段直接 return，弃牌堆永远不刷新
        this.node.on('game_chupai_notify',function(data){
            self.initAllFolds();
            //最新一张弃牌从出牌指示处飞入弃牌堆
            var d = data.detail;
            var sd = d && (d.seatData || d);
            if(sd && sd.folds && sd.folds.length > 0){
                self._flyLastFold(sd);
                //方向标定位到刚打出的这张牌正上方
                var tn = self._lastFoldNode(sd);
                if(tn){ self._showDirMarker(tn); }
            }
        });

        //吃/碰/杠会把被用的牌从出牌方的弃牌堆移除，需要整体重绘
        this.node.on('peng_notify',function(data){
            self.initAllFolds();
            self._hideDirMarker(); //被碰走,弃牌失效
        });

        this.node.on('gang_notify',function(data){
            self.initAllFolds();
            self._hideDirMarker();
        });

        this.node.on('chi_notify',function(data){
            self.initAllFolds();
            self._hideDirMarker();
        });

        this.node.on('guo_notify',function(data){
            var d = data.detail;
            if(d && d.seatData){ self.initFolds(d.seatData); }
        });
    },
    
    initAllFolds:function(){
        var seats = cc.vv.gameNetMgr.seats;
        for(var i in seats){
            this.initFolds(seats[i]);
        }
    },
    
    initFolds:function(seatData){
        if(!seatData){ return; } //座位数据为空时直接返回,避免崩溃
        var folds = seatData.folds;
        if(folds == null){
            return;
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);

        var foldsSprites = this._folds[side];
        if(foldsSprites.length == 0){ return; }
        var foldRoot = foldsSprites[0].node.parent;

        //每排槽位数与行高
        var y0 = foldsSprites[0].node.y;
        var perRow = 0;
        for(var t = 0; t < foldsSprites.length; ++t){
            if(Math.abs(foldsSprites[t].node.y - y0) < 1) perRow++;
        }
        if(perRow <= 0){ perRow = foldsSprites.length; }
        //槽位数量与位置完全以场景为准:不克隆新槽位,也不改写坐标
        var maxSlots = foldsSprites.length;

        //记录布局参数(出牌飞入动画定位用)
        if(!this._foldLayout){ this._foldLayout = {}; }
        this._foldLayout[side] = { perRow: perRow, maxSlots: maxSlots };

        //清理上一帧的叠放层节点
        if(!this._foldStacks){ this._foldStacks = {}; }
        var oldStacks = this._foldStacks[side] || [];
        for(var s = 0; s < oldStacks.length; ++s){
            if(cc.isValid(oldStacks[s])) oldStacks[s].destroy();
        }
        var stacks = [];
        this._foldStacks[side] = stacks;

        var usedSlots = Math.min(folds.length, maxSlots);
        for(var i = 0; i < folds.length; ++i){
            var slotIdx = i % maxSlots;      //超过3排后回到第一排叠放
            var layer = Math.floor(i / maxSlots); //叠放层数
            var index = slotIdx;
            if(side == "up"){
                //对家:同一排从右往左排,仍然先上排后下排
                index = Math.floor(slotIdx / perRow) * perRow + (perRow - 1 - slotIdx % perRow);
            }
            else if(side == "right"){
                index = foldsSprites.length - slotIdx - 1;
            }
            var sprite = foldsSprites[index];
            if(layer == 0){
                sprite.node.active = true;
                this.setSpriteFrameByMJID(pre,sprite,folds[i]);
            } else {
                //叠放层：克隆槽位节点，轻微偏移露出下层边缘，压在上面
                var base = sprite.node;
                var sn = cc.instantiate(base);
                sn.x = base.x;
                sn.y = base.y + layer * 8;
                sn.zIndex = base.zIndex + layer;
                foldRoot.addChild(sn);
                sn.active = true;
                this.setSpriteFrameByMJID(pre, sn.getComponent(cc.Sprite), folds[i]);
                stacks.push(sn);
            }
        }
        for(var i = usedSlots; i < foldsSprites.length; ++i){
            var index = i;
            if(side == "up"){
                index = Math.floor(i / perRow) * perRow + (perRow - 1 - i % perRow);
            }
            else if(side == "right"){
                index = foldsSprites.length - i - 1;
            }
            var sprite = foldsSprites[index];

            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
    },
    
    //最新弃牌槽位节点(方向标定位/飞入动画共用)
    _lastFoldNode:function(seatData){
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var foldsSprites = this._folds[side];
        var lay = this._foldLayout && this._foldLayout[side];
        if(!foldsSprites || foldsSprites.length == 0 || !lay){ return null; }
        var folds = seatData.folds;
        if(!folds || folds.length == 0){ return null; }
        var idx = folds.length - 1;
        var slotIdx = idx % lay.maxSlots;
        var index = slotIdx;
        if(side == "up"){
            index = Math.floor(slotIdx / lay.perRow) * lay.perRow + (lay.perRow - 1 - slotIdx % lay.perRow);
        }
        else if(side == "right"){
            index = foldsSprites.length - slotIdx - 1;
        }
        var layer = Math.floor(idx / lay.maxSlots);
        if(layer == 0){ return foldsSprites[index].node; }
        var stacks = this._foldStacks && this._foldStacks[side];
        if(stacks && stacks.length > 0){ return stacks[stacks.length - 1]; }
        return null;
    },

    //方向标:显示在刚打出的牌正上方,上下自动跳动(仅诸暨赖倒胡)
    _showDirMarker:function(targetNode){
        if(!this._isZjlao() || !this._dirFrame){ return; }
        this._hideDirMarker();
        if(!targetNode || !targetNode.active){ return; }
        var m = new cc.Node("dirMarker");
        targetNode.parent.addChild(m);
        m.zIndex = 1000;
        var sp = m.addComponent(cc.Sprite);
        sp.spriteFrame = this._dirFrame;
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        m.setContentSize(50, 48);
        var th = targetNode.getContentSize().height;
        var baseY = targetNode.y + th / 2 + 48 / 2 + 4;
        m.setPosition(targetNode.x, baseY);
        this._dirMarker = m;
        console.log("[folds] 方向标显示 side parent=", targetNode.parent.name, "x=", targetNode.x, "y=", baseY);
        cc.tween(m)
            .repeatForever(
                cc.tween()
                    .to(0.35, { y: baseY + 16 }, { easing: "sineInOut" })
                    .to(0.35, { y: baseY }, { easing: "sineInOut" })
            )
            .start();
    },

    _hideDirMarker:function(){
        if(this._dirMarker && cc.isValid(this._dirMarker)){ this._dirMarker.destroy(); }
        this._dirMarker = null;
    },

    //最新弃牌飞入动画: 临时牌从该方位出牌指示处(桌中央)飞到目标槽位后销毁
    _flyLastFold:function(seatData){
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var foldsSprites = this._folds[side];
        var lay = this._foldLayout && this._foldLayout[side];
        if(!foldsSprites || foldsSprites.length == 0 || !lay){ return; }
        var folds = seatData.folds;
        var idx = folds.length - 1;
        var slotIdx = idx % lay.maxSlots;
        var index = slotIdx;
        if(side == "up"){
            index = Math.floor(slotIdx / lay.perRow) * lay.perRow + (lay.perRow - 1 - slotIdx % lay.perRow);
        }
        else if(side == "right"){
            index = foldsSprites.length - slotIdx - 1;
        }
        var layer = Math.floor(idx / lay.maxSlots);
        var targetNode = null;
        if(layer == 0){
            targetNode = foldsSprites[index].node;
        } else {
            var stacks = this._foldStacks && this._foldStacks[side];
            if(stacks && stacks.length > 0){ targetNode = stacks[stacks.length - 1]; }
        }
        if(!targetNode || !targetNode.active){ return; }
        var game = this.node.getChildByName("game");
        var sideRoot = game ? game.getChildByName(side) : null;
        var chu = sideRoot ? sideRoot.getChildByName("ChuPai") : null;
        var foldRoot = targetNode.parent;
        var startWorld = chu ? chu.convertToWorldSpaceAR(cc.v2(0,0)) : targetNode.convertToWorldSpaceAR(cc.v2(0,0));
        var start = foldRoot.convertToNodeSpaceAR(startWorld);
        var fly = new cc.Node("fold_fly");
        foldRoot.addChild(fly);
        fly.zIndex = 999;
        fly.setPosition(start);
        fly.rotation = targetNode.rotation;
        fly.scaleX = targetNode.scaleX;
        fly.scaleY = targetNode.scaleY;
        fly.setContentSize(targetNode.getContentSize());
        var sp = fly.addComponent(cc.Sprite);
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        sp.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, folds[idx]);
        cc.tween(fly)
            .to(0.18, {position: targetNode.position}, {easing: "quadOut"})
            .call(function(){ if(cc.isValid(fly)){ fly.destroy(); } })
            .start();
    },

    setSpriteFrameByMJID:function(pre,sprite,mjid){
        //保持场景里摆好的尺寸:换帧时若Sprite为TRIMMED会按图片原始大小改写节点尺寸,这里还原
        var w = sprite.node.width;
        var h = sprite.node.height;
        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,mjid);
        if(w > 0 && h > 0){ sprite.node.setContentSize(w, h); }
        sprite.node.active = true;
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});

