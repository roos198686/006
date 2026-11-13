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
    },

    // use this for initialization
    onLoad: function () {
        if(!cc.vv){
            return;
        }
        
        var gameChild = this.node.getChildByName("game");
        if(gameChild == null){ return; }
        var myself = gameChild.getChildByName("myself");
        if(myself == null){ return; }
        var pengangroot = myself.getChildByName("penggangs");
        if(pengangroot == null){ return; }
        var realwidth = cc.view.getVisibleSize().width; //实际可见宽度(2.4无cc.director.getVisibleSize,必须用cc.view)
        var scale = realwidth / 1280;
        if(scale < 1){ //仅窄屏时缩放,宽屏保持原始布局防止超出屏幕
            pengangroot.scaleX *= scale;
            pengangroot.scaleY *= scale;
        }
        
        var self = this;
        //场景里的副露模板节点(meldTpl)只用于克隆,必须常驻隐藏,否则会当成一组副露显示出来
        ["myself","up","left","right"].forEach(function(s){
            var sn = gameChild.getChildByName(s);
            var pr = sn ? sn.getChildByName("penggangs") : null;
            var tpl = pr ? pr.getChildByName("meldTpl") : null;
            if(tpl){ tpl.active = false; }
        });
        this.node.on('peng_notify',function(data){
            //刷新所有的牌
            //console.log(data.detail);
            var data = data.detail;
            self.onPengGangChanged(data);
        });
        
        this.node.on('gang_notify',function(data){
            //刷新所有的牌
            //console.log(data.detail);
            var data = data.detail;
            self.onPengGangChanged(data.seatData);
        });

        //吃牌通知（诸暨玩法）
        this.node.on('chi_notify',function(data){
            var data = data.detail;
            self.onPengGangChanged(data);
        });

        this.node.on('game_start',function(data){
            self.onGameBein();
            //开局/重连事件后按座位数据重绘副露(吃/碰/杠)。
            //必须延到下一帧执行:若在本事件回调内同步重绘,onPengGangChanged 抛错会中断 emit 事件链,
            //使同节点其他 game_start 监听(MJGameLDH 手牌渲染)被跳过,出现"重进房间全部牌都看不到"。
            self.scheduleOnce(function(){
                if(!cc.isValid(self.node)){ return; }
                try{
                    var seats = cc.vv.gameNetMgr.seats;
                    for(var i in seats){
                        self.onPengGangChanged(seats[i]);
                    }
                }catch(e){
                    cc.warn('[PengGangs] 重连副露重绘失败: ' + (e && e.message ? e.message : e));
                }
            }, 0);
        });
        
        var seats = cc.vv.gameNetMgr.seats;
        for(var i in seats){
            this.onPengGangChanged(seats[i]);
        }
    },
    
    onGameBein:function(){
        this.hideSide("myself");
        this.hideSide("right");
        this.hideSide("up");
        this.hideSide("left");
    },

    //带财神的玩法判定:赖倒胡(zjlao)/翻财神(ldh)/自选财神(zjzx)的副露里出现财神时要变色+角标,
    //其他不带财神的玩法不受影响
    _isCaishenMeld:function(){
        return this.node.getComponent("MJGameZJLAO") != null
            || this.node.getComponent("MJGameLDH") != null
            || this.node.getComponent("MJGameZJZX") != null;
    },

    //副露财神角标: 角标节点已做进预制体PengGangMyself(或场景csCornerMeld),位置/大小在编辑器里直接调,
    //运行时只切换显隐,代码不再算坐标
    _setCaishenCorner:function(tileNode,pai){
        if(!this._isCaishenMeld() || !tileNode){ return; }
        var corner = tileNode.getChildByName("csCorner");
        var conf = (cc.vv.gameNetMgr && cc.vv.gameNetMgr.conf) || {};
        var isCs = pai != null && pai >= 0 && (pai == conf.caishen || (conf.caishen2 != null && conf.caishen2 >= 0 && pai == conf.caishen2));
        if(!isCs){
            if(corner){ corner.active = false; }
            tileNode.color = cc.Color.WHITE;
            return;
        }
        if(!corner){
            var gameChild = this.node.getChildByName("game");
            var template = gameChild ? gameChild.getChildByName("csCornerMeld") : null;
            if(!template){ return; }
            corner = cc.instantiate(template);
            corner.name = "csCorner";
            tileNode.addChild(corner);
        }
        corner.active = true;
        //财神牌牌面染金黄(与吃碰杠提示里的财神牌同色)
        tileNode.color = cc.color(255, 208, 90);
    },

    //换牌面时保持预制体/场景里摆好的尺寸(避免Sprite为TRIMMED时被图片原始大小覆盖)
    _setTileFrame:function(sprite, frame){
        if(!sprite || !frame){ return; }
        var w = sprite.node.width;
        var h = sprite.node.height;
        sprite.spriteFrame = frame;
        if(w > 0 && h > 0){ sprite.node.setContentSize(w, h); }
    },

    //副露组实例池:场景penggangs下的meldTpl只作模板,不参与槽位计数,所以已创建的副露组单独用数组管理
    _meldPool:function(pengangroot){
        if(!pengangroot._meldPool){ pengangroot._meldPool = []; }
        return pengangroot._meldPool;
    },

    //优先用场景game下的meldTplUp/meldTplSelf(牌面+财神角标都在场景里,可在编辑器直接摆),没有则回退到原预制体
    _createMeld:function(pengangroot,side){
        var gameChild = this.node.getChildByName("game");
        var tpl = null;
        if(gameChild && (side == "up" || side == "myself")){
            tpl = gameChild.getChildByName(side == "up" ? "meldTplUp" : "meldTplSelf");
        }
        if(!tpl){ tpl = pengangroot.getChildByName("meldTpl"); }
        var pg = null;
        if(tpl){
            pg = cc.instantiate(tpl);
        }
        else if(side == "left" || side == "right"){
            pg = cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft);
        }
        else{
            pg = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
        }
        pg.active = true;
        //模板自身带缩放(场景里按实际显示比例摆),实例化后归1,大小交给所在penggangs节点
        pg.setPosition(0, 0);
        pg.setScale(1, 1);
        pengangroot.addChild(pg);
        this._meldPool(pengangroot).push(pg);
        return pg;
    },

    hideSide:function(side){
        var gameChild = this.node.getChildByName("game");
        if(gameChild == null){ return; }
        var myself = gameChild.getChildByName(side);
        if(myself == null){ return; }
        var pengangroot = myself.getChildByName("penggangs");
        if(pengangroot){
            var pool = this._meldPool(pengangroot);
            for(var i = 0; i < pool.length; ++i){
                pool[i].active = false;
            }
        }
    },
    
    onPengGangChanged:function(seatData){
        if(seatData == null){ return; }
        if(seatData.angangs == null && seatData.diangangs == null && seatData.wangangs == null && seatData.pengs == null && seatData.chis == null){
            return;
        }
        //座位对象可能被动态替换导致seatindex丢失,用userId兜底定位
        var si = seatData.seatindex;
        if(si == null && seatData.userid != null){
            var seats = cc.vv.gameNetMgr.seats || [];
            for(var k = 0; k < seats.length; ++k){
                if(seats[k] && seats[k].userid == seatData.userid){ si = k; break; }
            }
        }
        if(si == null){ return; }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(si);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);

        console.log("onPengGangChanged" + localIndex);

        var gameChild = this.node.getChildByName("game");
        if(gameChild == null){ return; }
        var myself = gameChild.getChildByName(side);
        if(myself == null){ return; }
        var pengangroot = myself.getChildByName("penggangs");
        if(pengangroot == null){ return; }

        var pool = this._meldPool(pengangroot);
        for(var i = 0; i < pool.length; ++i){
            pool[i].active = false;
        }
        var index = 0;

        var gangs = seatData.angangs || [];
        for(var i = 0; i < gangs.length; ++i){
            var mjid = gangs[i];
            this.initPengAndGangs(pengangroot,side,pre,index,mjid,"angang");
            index++;
        }
        var gangs = seatData.diangangs || [];
        for(var i = 0; i < gangs.length; ++i){
            var mjid = gangs[i];
            this.initPengAndGangs(pengangroot,side,pre,index,mjid,"diangang");
            index++;
        }

        var gangs = seatData.wangangs || [];
        for(var i = 0; i < gangs.length; ++i){
            var mjid = gangs[i];
            this.initPengAndGangs(pengangroot,side,pre,index,mjid,"wangang");
            index++;
        }

        //初始化碰牌
        var pengs = seatData.pengs || [];
        for(var i = 0; i < pengs.length; ++i){
            var mjid = pengs[i];
            //碰组真实组成牌(含财神),有则按真实组成渲染,区分真碰/财神碰
            var tiles = (seatData.pengTiles && seatData.pengTiles[i]) || null;
            this.initPengAndGangs(pengangroot,side,pre,index,mjid,"peng",tiles);
            index++;
        }

        //初始化吃牌（诸暨玩法，chis为二维数组）
        var chis = seatData.chis || [];
        for(var i = 0; i < chis.length; ++i){
            this.initChis(pengangroot,side,pre,index,chis[i]);
            index++;
        }
    },

    //吃牌组渲染：3张牌平铺（复用碰预制体，三张都亮牌，无杠背）
    initChis:function(pengangroot,side,pre,index,pais){
        var pgroot = null;
        var pool = this._meldPool(pengangroot);
        if(pool.length <= index){
            pgroot = this._createMeld(pengangroot,side);
        }
        else{
            pgroot = pool[index];
            pgroot.active = true;
        }

        if(side == "left"){
            pgroot.y = -(index * 25 * 3);
        }
        else if(side == "right"){
            pgroot.y = (index * 25 * 3);
            pgroot.zIndex = -index;
        }
        else if(side == "myself"){
            pgroot.x = index * 55 * 3 + index * 10;
        }
        else{
            //对家:组间距按模板里牌的实际宽度算,写死间距比一组牌还窄时相邻组会把牌盖住(看起来像少一张)
            pgroot.x = -(index * this._meldStride(pgroot, 55 * 3));
        }

        var sprites = this._meldTileSprites(pgroot);
        var pi = 0;
        for(var s = 0; s < sprites.length; ++s){
            var sprite = sprites[s];
            if(sprite.node.name == "gang"){
                sprite.node.active = false; //吃牌无杠背
            }
            else{
                var mj = (pi < pais.length) ? pais[pi] : pais[pais.length - 1];
                this._setTileFrame(sprite, cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,mj));
                this._setCaishenCorner(sprite.node,mj);
                pi++;
            }
        }
    },

    //取副露组里的牌(直接子节点,排除杠背与角标),顺序按层级顺序,保证张数确定
    _meldTileSprites:function(pgroot){
        var list = [];
        for(var i = 0; i < pgroot.childrenCount; ++i){
            var n = pgroot.children[i];
            if(n.name == "gang" || n.name.indexOf("csCorner") == 0){ continue; }
            var sp = n.getComponent(cc.Sprite);
            if(!sp){ continue; }
            n.active = true; //模板里可能被关掉过,渲染前统一打开
            list.push(sp);
        }
        var gangNode = pgroot.getChildByName("gang");
        if(gangNode){
            var gsp = gangNode.getComponent(cc.Sprite);
            if(gsp){ list.push(gsp); }
        }
        return list;
    },

    //一组副露实际占的宽度(按场景里摆好的牌宽/位置算),组间距用它,避免JS写死间距把牌盖住
    _meldStride:function(pgroot,minStep){
        var left = null;
        var right = null;
        var tiles = this._meldTileSprites(pgroot);
        for(var i = 0; i < tiles.length; ++i){
            var n = tiles[i].node;
            var l = n.x - n.width * n.anchorX;
            var r = n.x + n.width * (1 - n.anchorX);
            if(left == null || l < left){ left = l; }
            if(right == null || r > right){ right = r; }
        }
        if(left == null){ return minStep; }
        return Math.max(minStep, (right - left) + 6);
    },
    
    initPengAndGangs:function(pengangroot,side,pre,index,mjid,flag,tiles){
        var pgroot = null;
        var pool = this._meldPool(pengangroot);
        if(pool.length <= index){
            pgroot = this._createMeld(pengangroot,side);
        }
        else{
            pgroot = pool[index];
            pgroot.active = true;
        }

        if(side == "left"){
            pgroot.y = -(index * 25 * 3);
        }
        else if(side == "right"){
            pgroot.y = (index * 25 * 3);
            pgroot.zIndex = -index;
        }
        else if(side == "myself"){
            pgroot.x = index * 55 * 3 + index * 10;
        }
        else{
            //对家:组间距按模板里牌的实际宽度算,避免相邻组互相盖住
            pgroot.x = -(index * this._meldStride(pgroot, 55 * 3));
        }

        var sprites = this._meldTileSprites(pgroot);
        var pi = 0; //碰组真实组成的渲染索引(仅peng且有tiles时使用)
        for(var s = 0; s < sprites.length; ++s){
            var sprite = sprites[s];
            if(sprite.node.name == "gang"){
                var isGang = flag != "peng";
                sprite.node.active = isGang;
                if(flag == "angang"){
                    this._setTileFrame(sprite, cc.vv.mahjongmgr.getEmptySpriteFrame(side));
                }
                else{
                    this._setTileFrame(sprite, cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,mjid));
                }
                this._setCaishenCorner(sprite.node,(isGang && flag != "angang") ? mjid : null);
            }
            else{
                //碰组有真实组成数据时按实际牌渲染(财神碰会显示出财神),否则三张同牌
                var showMj = (flag == "peng" && tiles && pi < tiles.length) ? tiles[pi] : mjid;
                this._setTileFrame(sprite, cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,showMj));
                this._setCaishenCorner(sprite.node,showMj);
                pi++;
            }
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
