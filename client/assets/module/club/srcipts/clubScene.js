//独立俱乐部场景(club.fire)控制脚本:挂在场景wfPage节点上
//页面骨架固化在场景文件中(clubPage=俱乐部列表页,wfPage=玩法大厅+牌桌列表页),这里只做JS控制
cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad: function () {
        console.log("[club] onLoad fired, cc.vv=", !!cc.vv);
        if(!cc.vv){
            cc.director.loadScene("login"); // cc.vv 未初始化时跳 login(login 自带初始化)
            return;
        }
        var self = this;
        var canvas = cc.find("Canvas");
        //等待/错误提示层:场景里该节点默认隐藏,组件onLoad不会执行,cc.vv.wc会指向上个场景已销毁的组件
        //这里先激活一次让组件完成绑定(onLoad内部会按 _isShow 立即隐藏),否则 show/showError 全部失效
        var wcNode = canvas ? canvas.getChildByName("WaitingConnection") : null;
        if(wcNode && (!cc.vv.wc || cc.vv.wc.node !== wcNode)){
            wcNode.active = true;
        }
        //场景加载瞬间树必定完整:立刻缓存牌桌卡片模板,之后任何容器清空/查找失败都不影响
        this._clubTpl = this._clubFind(canvas, "sampleCard0");
        this._clubTpl2 = this._clubFind(canvas, "sampleCard2"); //2人桌专用小桌子模板(可选,没有则沿用sampleCard0)
        //编辑器里查看弹窗时可能忘了勾回隐藏:进场景统一强制隐藏,避免常驻遮挡
        ["zhanjiWin","recordWin","memLogWin","alert"].forEach(function(n){
            var w = canvas.getChildByName(n);
            if(w){ w.active = false; }
        });
        var clubPage = canvas.getChildByName("clubPage");
        var wfPage = canvas.getChildByName("wfPage");
        console.log("[club] onLoad fromClubId=", cc.vv.fromClubId, "fromClub=", cc.vv.fromClub);
        if(cc.vv.fromClubId){
            //从牌桌退出/结算返回:直接进入该俱乐部的独立玩法详情页(原玩法页面),
            //中途不显示俱乐部列表,避免"先闪一下列表再切详情"的页面跳动
            if(clubPage){ clubPage.active = false; }
            if(wfPage){ wfPage.active = false; }
            this._clubBackToDetail(cc.vv.fromClubId);
        }
        else{
            //固定先显示clubPage(俱乐部列表页),点击列表中的俱乐部才进wfPage
            if(clubPage){ clubPage.active = false; }
            if(wfPage){ wfPage.active = false; }
            this._clubAutoEnter();
        }
        //注意:fromClubId在这里只读不清——解散/断线可能触发多次club场景加载(dispress_push与disconnect兜底),
        //若第一次加载就清掉,第二次加载会落到俱乐部列表页;清除只发生在用户主动返回列表(_wfBack)或回大厅(hall.onLoad)
        // 因宝宝豆不足被请出房间: 回到牌桌列表页时弹窗提示(用场景里的提示弹窗, 不用暗色遮罩文字)
        this.scheduleOnce(function(){
            var msg = cc.vv && cc.vv.bbKickTip;
            if(!msg) return;
            cc.vv.bbKickTip = null;
            if(cc.vv.wc && cc.vv.wc.showAlert){ cc.vv.wc.showAlert(msg, "提示"); }
            else if(cc.vv.wc && cc.vv.wc.showError){ cc.vv.wc.showError(msg); }
        }, 0.3);
    },

    //文字超宽截断:CLAMP对动态克隆的Label不生效,改为手动逐字截断(以节点当前宽度为准)
    _clubClampLabel:function(lbl,str){
        if(!lbl){ return; }
        var maxW = lbl.node.width;
        lbl.overflow = cc.Label.Overflow.NONE; //自由排版才能测出真实文字宽度
        lbl.string = str || "";
        if(!(maxW > 0)){ return; } //节点未设宽度时不截断
        if(lbl._forceUpdateRenderData){ lbl._forceUpdateRenderData(); }
        if(lbl.node.width <= maxW){ return; }
        var s = lbl.string;
        while(s.length > 1){
            s = s.slice(0,-1);
            lbl.string = s;
            if(lbl._forceUpdateRenderData){ lbl._forceUpdateRenderData(); }
            if(lbl.node.width <= maxW){ break; }
        }
    },

    //画矩形背景(通用,只使用Cocos 2.4存在的Graphics.rect API)
    _clubPaintRect:function(g,w,h,fill,line,lineWidth){
        g.fillColor = fill;
        g.rect(-w/2,-h/2,w,h);
        g.fill();
        g.strokeColor = line;
        g.lineWidth = lineWidth;
        g.rect(-w/2,-h/2,w,h);
        g.stroke();
    },

    //打开俱乐部页面;默认收起列表,需点击"我的俱乐部"才展开
    openClubPanel:function(){
        if(this._clubPanel == null){
            this._clubBuildPanel();
        }
        this._clubPanel.active = true;
        this._clubLayoutPage(); //按当前窗口尺寸重新铺满
        //进入俱乐部场景默认展开"我的俱乐部"列表:listArea直接打开并渲染,无需再点顶部按钮
        this._clubState = "mine";
        if(this._clubListArea){ this._clubListArea.active = true; }
        this._clubSetTop();
        this._clubRefreshList(); //拉到数据后按当前状态渲染列表
    },

    //构建俱乐部全屏页面(页面骨架已固化在 club.fire 的 clubPage 节点下,这里只绑定事件)
    _clubBuildPanel:function(){
        var self = this;
        var canvas = cc.find("Canvas");
        if(canvas == null){ return; }
        var baked = canvas.getChildByName("clubPage");
        if(!baked){ return; }
        this._clubBaked = true;
        this._clubPanel = baked;
        this._clubPageBg = baked.getChildByName("clubBg");
        if(this._clubPageBg){
            //兜底:clubBg上误挂了Canvas组件(把节点尺寸锁死为设计分辨率,宽屏下左右无法拉满),运行时强制移除;并强制贴图跟随节点尺寸
            var strayCanvas = this._clubPageBg.getComponent(cc.Canvas);
            if(strayCanvas){ strayCanvas.destroy(); }
            var bgSp = this._clubPageBg.getComponent(cc.Sprite);
            if(bgSp){ bgSp.sizeMode = cc.Sprite.SizeMode.CUSTOM; }
        }
        this._clubMask = baked.getChildByName("mask");
        this._clubCloseBtn = baked.getChildByName("btn_close");
        this._clubBtnMine = baked.getChildByName("btnMine");
        this._clubBtnCreate = baked.getChildByName("btnCreate");
        this._clubBtnJoin = baked.getChildByName("btnJoin");
        this._clubListArea = baked.getChildByName("listArea");
        var tabs = [this._clubBtnMine,this._clubBtnCreate,this._clubBtnJoin];
        for(var ti = 0; ti < tabs.length; ++ti){ if(tabs[ti]){ tabs[ti]._clubW = tabs[ti].width; tabs[ti]._clubH = tabs[ti].height; } }
        if(!baked._clubBound){
            baked._clubBound = true;
            if(this._clubMask){ this._clubMask.on(cc.Node.EventType.TOUCH_START,function(){}); } //吞触摸防穿透
            if(this._clubCloseBtn){
                var bb = this._clubCloseBtn.getComponent(cc.Button);
                if(bb){ bb.clickEvents = []; }
                this._clubCloseBtn.on(cc.Node.EventType.TOUCH_END,function(){ self._clubClosePanel(); }); //独立场景:关闭俱乐部页=回大厅
            }
            if(this._clubBtnMine){ this._clubBtnMine.on(cc.Node.EventType.TOUCH_END,function(){ self._clubShowMine(); self._clubRefreshList(); }); }
            if(this._clubBtnCreate){ this._clubBtnCreate.on(cc.Node.EventType.TOUCH_END,function(){ self._clubShowCreate(); }); }
            if(this._clubBtnJoin){ this._clubBtnJoin.on(cc.Node.EventType.TOUCH_END,function(){ self._clubShowJoin(); }); }
            this._clubBindBakedPopups(baked); //创建/加入弹窗(场景固化,只绑事件)
        }
        this._clubLayoutPage(); //按当前窗口尺寸重新铺满
    },

    //绑定场景固化的创建/加入弹窗(关闭回我的俱乐部、6位ID输入回调;遮罩宽屏拉伸在打开时做)
    _clubBindBakedPopups:function(panel){
        var self = this;
        var bindOne = function(win,isJoin){
            if(!win || win._clubBound){ return; }
            win._clubBound = true;
            var closeBtn = win.getChildByName("close");
            if(closeBtn){ closeBtn.on(cc.Node.EventType.TOUCH_END,function(){ self._clubShowMine(); }); }
            if(isJoin){
                //标题贴图已在场景中换成俱乐部标题图,但提示文字仍为原生"请输入房间号",这里改掉
                var titleNode = win.getChildByName("PopupScene20");
                var tipLab = titleNode ? titleNode.getChildByName("New Label") : null;
                if(tipLab){
                    var tip = tipLab.getComponent(cc.Label);
                    if(tip){ tip.string = "请输入俱乐部ID"; }
                }
                var comp = win.getComponent("JoinGameInput");
                if(comp){
                    self._clubJoinComp = comp;
                    comp.onInputFinished = function(clubId){ self._clubDoJoin(clubId); };
                }
            }
        };
        bindOne(panel.getChildByName("clubCreateWin"),false);
        bindOne(panel.getChildByName("clubJoinWin"),true);
    },

    //弹窗遮罩尺寸/位置由场景编辑器控制,JS不再调整(保留空函数避免调用处报错)
    _clubStretchPopupDim:function(win){
    },

    //页面/背景/遮罩几何全部由场景编辑器与Widget控制,JS不写任何尺寸位置(保留空函数避免调用处报错)
    _clubLayoutPage:function(){
    },

    //顶部三按钮贴图已固化在场景文件中,JS不再切换贴图(保留空函数避免调用处报错)
    _clubPaintBtn:function(node,frameKey){
    },

    //顶部三按钮贴图已固化在场景文件中,JS不再刷新(保留空函数避免调用处报错)
    _clubRefreshBtnFrames:function(){
    },

    //递归查找子节点(场景内节点可能被编辑器分组包了一层New Node,getChildByName只查直接子节点会找不到)
    _clubFind:function(node,name){
        if(!node){ return null; }
        if(node.name === name){ return node; }
        var cs = node.children;
        for(var i = 0; i < cs.length; i++){
            var r = this._clubFind(cs[i],name);
            if(r){ return r; }
        }
        return null;
    },

    //重画列表行底色(选中高亮);玩法图片按钮行切换默认/点击态整张按钮图
    _clubPaintRow:function(row,selected){
        row._selected = selected;
        var sp = row._iconSp;
        var f = sp ? ((selected && row._iconSel) ? row._iconSel : row._iconNormal) : null;
        if(sp && f){
            sp.spriteFrame = f; //只换图;按钮底图尺寸/偏移完全由场景allRow/gameRowTpl的bgimg节点控制,JS不覆盖
            return; //有按钮图时不重画兜底色块
        }
        var bgN = row.getChildByName("bg");
        if(!bgN){ return; }
        var g = bgN.getComponent(cc.Graphics);
        if(!g){ return; }
        g.clear();
        this._clubPaintRect(g,row.width,row.height,
            selected?cc.color(96,78,150):cc.color(52,42,84),
            selected?cc.color(255,200,90):cc.color(120,100,170),2); //深色底,选中高亮
    },

    //图集帧加载(textures散图已全部并入图集): 带atlas缓存,帧不存在回null由调用方兜底
    _loadAtlasFrame:function(atlasPath, frameName, cb){
        var cache = this._atlasCache = this._atlasCache || {};
        var apply = function(atlas){
            cb((atlas && atlas.getSpriteFrame(frameName)) || null);
        };
        if(cache[atlasPath]){ apply(cache[atlasPath]); return; }
        cc.resources.load(atlasPath, cc.SpriteAtlas, function(err, atlas){
            if(!err && atlas){ cache[atlasPath] = atlas; }
            apply(cache[atlasPath]);
        });
    },

    //创建列表行(背景+左文字+右附加文字),返回行节点;iconType传玩法game_type时左侧加载自制图标
    //四种玩法共用 hall_ui图集帧club_game.png,选中(点击)态切换 club_game_on.png(缺失则用默认图)
    _clubAddRow:function(parent,idx,text,sub,cb,w,iconType){
        var self = this;
        w = w || 760;
        var ROW_H = 68; //行高(上下加高,白底条更醒目)
        var ROW_GAP = 73; //行间距=行高68+5px间隙
        var row = new cc.Node("row" + idx);
        row.setContentSize(w,ROW_H);
        //首行从父容器顶部向下排,兼容不同高度的列表区
        var topY = parent.height ? parent.height/2 - ROW_H/2 : 110; //顶部不留边距
        row.setPosition(0,topY - idx * ROW_GAP);
        parent.addChild(row);
        //列表行不再画兜底色块,由场景底图直接衬托,文字改黑色加粗
        //玩法行整行就是一张按钮图(四种玩法共用club_game.png,选中态club_game_on.png),文字放按钮里面
        var textX = -w/2 + 20, textSize = 26, textAnchor = 0, textAlign = cc.Label.HorizontalAlign.LEFT;
        if(iconType){
            textX = 0; textSize = 24; textAnchor = 0.5; textAlign = cc.Label.HorizontalAlign.CENTER;
            var bgimg = new cc.Node("bgimg");
            bgimg.setContentSize(w,ROW_H);
            row.addChild(bgimg);
            var rsp = bgimg.addComponent(cc.Sprite);
            rsp.sizeMode = cc.Sprite.SizeMode.CUSTOM; //先CUSTOM再赋图,防止节点被图片原始尺寸撑大
            rsp.type = cc.Sprite.Type.SIMPLE;
            row._iconSp = rsp;
            self._loadAtlasFrame("images/atlas/hall_ui", "club_game.png", function(sf){
                if(!sf || !cc.isValid(bgimg)){ return; }
                row._iconNormal = sf;
                if(!row._selected || !row._iconSel){ rsp.spriteFrame = sf; bgimg.setContentSize(w,ROW_H); }
            });
            self._loadAtlasFrame("images/atlas/hall_ui", "club_game_on.png", function(sf){
                if(!sf || !cc.isValid(bgimg)){ return; }
                row._iconSel = sf;
                if(row._selected){ rsp.spriteFrame = sf; bgimg.setContentSize(w,ROW_H); }
            });
        }
        //左文字(玩法行:文字整行居中放按钮图内)
        var ln = new cc.Node("l");
        ln.anchorX = textAnchor;
        ln.setContentSize(textAnchor === 0.5 ? w : (w - (textX + w/2) - 70),ROW_H);
        ln.setPosition(textX,0);
        row.addChild(ln);
        var lbl = ln.addComponent(cc.Label);
        lbl.string = text;
        lbl.fontSize = textSize;
        lbl.lineHeight = ROW_H;
        lbl.horizontalAlign = textAlign;
        lbl.verticalAlign = cc.Label.VerticalAlign.CENTER;
        lbl.overflow = cc.Label.Overflow.NONE; //动态Label用SHRINK/CLAMP会不渲染,必须用NONE
        ln.color = cc.color(0,0,0); //黑色文字
        //右附加文字
        if(sub != null && sub != ""){
            var sn = new cc.Node("s");
            sn.anchorX = 1;
            sn.setContentSize(100,ROW_H);
            sn.setPosition(w/2 - 20,0);
            row.addChild(sn);
            var slbl = sn.addComponent(cc.Label);
            slbl.string = sub;
            slbl.fontSize = 24;
            slbl.lineHeight = ROW_H;
            slbl.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
            slbl.verticalAlign = cc.Label.VerticalAlign.CENTER;
            sn.color = cc.color(0,0,0); //黑色附加文字
        }
        if(cb){
            row.on(cc.Node.EventType.TOUCH_END,function(){
                if(self._clubScrollMoved){ self._clubScrollMoved = false; return; } //拖动滚动时不触发点击
                cb(row);
            });
        }
        return row;
    },

    //创建 bg4 圆角框 + 可上下拖动的列表内容区,返回内容节点
    //contentHeight:所有行叠起来所需高度,超过框内视口高度时可拖动滚动
    _clubMakeScrollBox:function(parent,w,h,contentHeight){
        var self = this;
        //固化场景:复用listArea下已建好的box/bg/view/content,几何完全由场景编辑器控制,JS不写任何尺寸位置贴图
        var bakedBox = this._clubFind(parent,"box");
        if(bakedBox){
            var bView = this._clubFind(bakedBox,"view");
            var bContent = bView ? this._clubFind(bView,"content") : null;
            var bvw = bView ? bView.width : 0, bvh = bView ? bView.height : 0; //视口尺寸读场景节点
            if(bContent){
                //保留rowTpl模板与emptyTip空列表提示(场景固化),只清动态克隆的行
                var tpl = bContent.getChildByName("rowTpl");
                var etip = bContent.getChildByName("emptyTip");
                bContent.removeAllChildren();
                if(tpl){ bContent.addChild(tpl); }
                if(etip){ bContent.addChild(etip); }
            }
            this._clubScroll = {view:bView,content:bContent,vw:bvw,vh:bvh};
            if(bView && !bakedBox._clubScrollBound){
                bakedBox._clubScrollBound = true;
                var bStartY = 0, bBaseY = 0;
                bView.on(cc.Node.EventType.TOUCH_START,function(e){
                    bStartY = e.getLocation().y;
                    bBaseY = self._clubScroll && self._clubScroll.content ? self._clubScroll.content.y : 0;
                    self._clubScrollMoved = false;
                });
                bView.on(cc.Node.EventType.TOUCH_MOVE,function(e){
                    var sc = self._clubScroll;
                    if(!sc || !sc.content){ return; }
                    if(sc.content.height <= sc.vh){ return; } //内容不超出,不滚动
                    var dy = e.getLocation().y - bStartY;
                    if(Math.abs(dy) > 6){ self._clubScrollMoved = true; }
                    var minY = (sc.vh - sc.content.height)/2, maxY = (sc.content.height - sc.vh)/2;
                    sc.content.y = Math.max(minY,Math.min(maxY,bBaseY + dy));
                });
                bView.on(cc.Node.EventType.TOUCH_CANCEL,function(){ self._clubScrollMoved = false; });
            }
            return bContent;
        }
        var box = new cc.Node("box");
        box.setContentSize(w,h);
        parent.addChild(box);
        //bg4 深色圆角底板(9宫格拉伸,保留圆角)
        var bg = new cc.Node("bg");
        bg.setContentSize(w,h);
        box.addChild(bg);
        var sp = bg.addComponent(cc.Sprite);
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        this._clubLoadBg4(function(frame){
            if(!frame){ return; }
            sp.spriteFrame = frame;
            sp.type = cc.Sprite.Type.SLICED;
        });
        //框内裁剪视口
        var pad = 22;
        var vw = w - pad*2, vh = h - pad*2;
        var view = new cc.Node("view");
        view.setContentSize(vw,vh);
        box.addChild(view);
        var mask = view.addComponent(cc.Mask);
        if(cc.Mask.Type && cc.Mask.Type.RECT != null){ mask.type = cc.Mask.Type.RECT; }
        var content = new cc.Node("content");
        content.setContentSize(vw,Math.max(vh,contentHeight));
        content.setPosition(0,(vh - content.height)/2); //默认从顶部开始显示
        view.addChild(content);
        this._clubScroll = {view:view,content:content,vw:vw,vh:vh};
        //拖动滚动
        var startY = 0, baseY = 0;
        view.on(cc.Node.EventType.TOUCH_START,function(e){
            startY = e.getLocation().y;
            baseY = content.y;
            self._clubScrollMoved = false;
        });
        view.on(cc.Node.EventType.TOUCH_MOVE,function(e){
            if(content.height <= vh){ return; } //内容不超出,不滚动
            var dy = e.getLocation().y - startY;
            if(Math.abs(dy) > 6){ self._clubScrollMoved = true; }
            var minY = (vh - content.height)/2, maxY = (content.height - vh)/2;
            content.y = Math.max(minY,Math.min(maxY,baseY + dy));
        });
        view.on(cc.Node.EventType.TOUCH_CANCEL,function(){ self._clubScrollMoved = false; });
        return content;
    },

    //载入 bg4 深色圆角底板(loadRes主路径,与入口jlb同一条稳定路径)
    _clubLoadBg4:function(cb){
        if(this._clubBg4Frame){ cb(this._clubBg4Frame); return; }
        var self = this;
        var apply = function(frame){
            if(!frame){ cb(null); return; }
            frame.insetLeft = 26; frame.insetRight = 26; frame.insetTop = 26; frame.insetBottom = 26;
            self._clubBg4Frame = frame;
            cb(frame);
        };
        cc.resources.load("images/other/bg4", cc.SpriteFrame, function(err, frame){
            //统一走loadRes,去掉native下不存在的 assets/others/native 直载兜底
            if(!err && frame){ apply(frame); }
            else{ cb(null); }
        });
    },

    //清空列表区
    _clubClearList:function(){
        this._clubScroll = null;
        if(this._clubBaked){
            //固化场景:静态骨架保留,仅清动态内容与Graphics
            if(this._clubDetailFullBg && cc.isValid(this._clubDetailFullBg)){
                var fg = this._clubDetailFullBg.getComponent(cc.Graphics);
                if(fg){ fg.clear(); }
            }
            if(this._clubListArea){
                var games = this._clubFind(this._clubListArea,"games");
                if(games){
                    //保留固化模板/按钮/提示节点,只清动态克隆的行
                    var keep0 = [];
                    ["samptext","gameRowTpl","sampleRow0","sampleRow1","sampleRow2","allRow","emptyTip"].forEach(function(nm){
                        var k = games.getChildByName(nm);
                        if(k){ keep0.push(k); }
                    });
                    games.removeAllChildren();
                    keep0.forEach(function(k){ games.addChild(k); if(k.name === "emptyTip"){ k.active = false; } });
                }
                var tv = this._clubFind(this._clubListArea,"tablesView");
                var tables = tv ? tv.getChildByName("tables") : null;
                if(tables){ tables.removeAllChildren(); }
                var drop = this._clubFind(this._clubListArea,"gamesDrop");
                if(drop){ drop.active = false; }
                var bx = this._clubFind(this._clubListArea,"box");
                var bvw = bx ? bx.getChildByName("view") : null;
                var bct = bvw ? bvw.getChildByName("content") : null;
                if(bct){
                    //保留rowTpl模板与emptyTip提示,只清动态克隆的行
                    var tpl = bct.getChildByName("rowTpl");
                    var cet = bct.getChildByName("emptyTip");
                    bct.removeAllChildren();
                    if(tpl){ bct.addChild(tpl); }
                    if(cet){ bct.addChild(cet); cet.active = false; }
                }
            }
            return;
        }
        //详情页背景/紫栏挂在页面层,离开详情或重渲染时一并销毁
        if(this._clubDetailBgNode && cc.isValid(this._clubDetailBgNode)){ this._clubDetailBgNode.destroy(); }
        this._clubDetailBgNode = null;
        if(this._clubDetailFullBg && cc.isValid(this._clubDetailFullBg)){ this._clubDetailFullBg.destroy(); }
        this._clubDetailFullBg = null;
        if(this._clubListArea){
            this._clubListArea.removeAllChildren();
        }
    },

    //进场景固定先显示clubPage(俱乐部列表页),点击列表中的俱乐部才进入wfPage(玩法详情页)
    _clubAutoEnter:function(){
        var self = this;
        var cp = cc.find("Canvas/clubPage");
        if(cp){ cp.active = true; }
        this.openClubPanel(); //内部已展开"我的俱乐部"并渲染列表
        cc.vv.http.sendRequest("/club_list",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign
        },function(ret){
            if(!cc.isValid(self.node)){ return; }
            if(ret.errcode === 0){
                self._myClubs = ret.clubs || [];
                self._hallMode = (ret.hall_mode == 1);
                if(self._clubState === "mine"){
                    self._clubSetTop();
                    self._clubRenderMine();
                }
            }
        });
    },

    //请求我的俱乐部列表
    _clubRefreshList:function(){
        var self = this;
        cc.vv.http.sendRequest("/club_list",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign
        },function(ret){
            if(ret.errcode !== 0){
                cc.vv.wc.showError(ret.errmsg || "获取俱乐部失败");
                return;
            }
            self._myClubs = ret.clubs || [];
            self._hallMode = (ret.hall_mode == 1);
            //仅当用户已点开"我的俱乐部"时才高亮选中态并渲染列表,进入页面默认收起时不渲染
            if(self._clubState === "mine"){
                self._clubSetTop();
                self._clubRenderMine();
            }
        });
    },

    //顶部三按钮:我的俱乐部为选中态,创建/加入为未选中态
    _clubSetTop:function(){
        //顶部三按钮贴图已固化在场景文件中,JS不再切换选中态贴图
    },

    //主页:我的俱乐部(点击顶部"我的俱乐部"才展开列表)
    _clubShowMine:function(){
        this._clubCloseJoinWin(); //互斥:回到我的俱乐部时关闭加入弹窗
        this._clubCloseCreateWin(); //互斥:回到我的俱乐部时关闭创建弹窗
        if(this._clubCloseBtn){ this._clubCloseBtn.active = true; } //离开详情页恢复右上角退出按钮
        this._clubState = "mine";
        if(this._clubListArea){ this._clubListArea.active = true; } //展开列表区
        this._clubSetTop();
        this._clubRenderMine();
    },

    //我的俱乐部:已加入俱乐部列表,行结构(rowTpl含name/sub两个Label)固化在场景content下,JS只克隆填文字
    _clubRenderMine:function(){
        var self = this;
        this._clubClearList();
        var area = this._clubListArea;
        if(!area){ return; }
        var clubs = this._myClubs || [];
        //大厅模式:所有俱乐部只保留一个入口,入口显示自己所属俱乐部信息
        if(this._hallMode && clubs.length > 1){ clubs = [clubs[0]]; }
        var boxW = Math.min(area.width || 880,920);
        var boxH = (area.height || 460) - 10;
        var count = clubs.length > 0 ? clubs.length : 1;
        this._clubMakeScrollBox(area,boxW,boxH,count * 80 + 20);
        var content = this._clubScroll ? this._clubScroll.content : area;
        if(!content){ return; }
        var rowTpl = content.getChildByName("rowTpl");
        if(rowTpl){ rowTpl.active = false; } //模板隐藏,只作克隆源
        //暂无俱乐部提示:固化在场景content下的emptyTip节点(文案/样式在编辑器调),JS只控制显隐
        var et = content.getChildByName("emptyTip");
        if(et){
            et.active = (clubs.length == 0);
            if(clubs.length == 0){
                var etLbl = et.getComponent(cc.Label);
                if(etLbl){ etLbl.string = "您还没有加入任何俱乐部，请创建或加入！"; }
            }
        }
        if(clubs.length == 0){ return; }
        // 横向排列: content 上有 cc.Layout 时由组件排版; 没有时(场景被编辑器覆盖)按行宽均分居中兜底
        var useLayout = !!content.getComponent(cc.Layout);
        var cellW = (rowTpl ? rowTpl.width : 360) + 20;
        clubs.forEach(function(c,i){
            var row = rowTpl ? cc.instantiate(rowTpl) : new cc.Node("row"+i);
            row.active = true;
            content.addChild(row);
            if(!useLayout){
                row.x = (i - (clubs.length - 1) / 2) * cellW;
                row.y = 0;
            }
            var nameLbl = row.getChildByName("name");
            if(nameLbl){ var nl = nameLbl.getComponent(cc.Label); if(nl){ self._clubClampLabel(nl, c.name || ""); } }
            var subLbl = row.getChildByName("sub");
            if(subLbl){ var sl = subLbl.getComponent(cc.Label); if(sl){ self._clubClampLabel(sl, (c.member_count || 0) + "人"); } }
            //社长昵称/社长ID/我的角色(rowTpl下新增节点,超出节点宽度截断隐藏)
            var myId = cc.vv.userMgr ? cc.vv.userMgr.userId : 0;
            var unLbl = row.getChildByName("username-a");
            if(unLbl){ var ul = unLbl.getComponent(cc.Label); if(ul){ self._clubClampLabel(ul, c.owner_name || ""); } }
            var uiLbl = row.getChildByName("userid-a");
            if(uiLbl){ var il = uiLbl.getComponent(cc.Label); if(il){ self._clubClampLabel(il, c.owner_userid ? String(c.owner_userid) : ""); } }
            var jsLbl = row.getChildByName("js-a");
            if(jsLbl){
                var jl = jsLbl.getComponent(cc.Label);
                if(jl){
                    // 角色文字直接写, 不走截断(节点宽 60 会把"合伙人"截成"合伙")
                    jl.overflow = cc.Label.Overflow.NONE;
                    jl.string = (c.owner_userid == myId) ? "合伙人" : "普通用户";
                }
            }
            row.on(cc.Node.EventType.TOUCH_END,function(){
                if(self._clubScrollMoved){ self._clubScrollMoved = false; return; }
                if(self._hallMode){ self._clubOpenHallEntry(c); } //大厅模式:点入口进总牌桌大厅
                else{ self._wfOpenDetail(c); }
            });
        });
    },

    //创建俱乐部:显示场景固化的 clubCreateWin(标题图/隐藏键盘/提示文字均已固化在场景中)
    _clubShowCreate:function(){
        this._clubClearList(); //互斥:点击创建时关闭当前列表
        this._clubCloseJoinWin();
        var win = this._clubPanel ? this._clubPanel.getChildByName("clubCreateWin") : null;
        if(!win){ return; }
        this._clubCreateWin = win;
        this._clubStretchPopupDim(win); //宽屏下遮罩铺满
        win.active = true;
    },

    //加入俱乐部:显示场景固化的 clubJoinWin(数字键盘输入6位俱乐部ID,回调已在构建时绑定)
    _clubShowJoin:function(){
        this._clubClearList(); //互斥:点击加入时关闭当前列表
        this._clubCloseCreateWin();
        var win = this._clubPanel ? this._clubPanel.getChildByName("clubJoinWin") : null;
        if(!win){ return; }
        this._clubJoinWin = win;
        this._clubStretchPopupDim(win); //宽屏下遮罩铺满
        win.active = true;
    },

    //输入满6位后提交加入俱乐部
    _clubDoJoin:function(idStr){
        var self = this;
        var id = parseInt(idStr);
        if(!(id > 0)){ cc.vv.wc.showError("请输入正确的俱乐部ID"); return; }
        cc.vv.http.sendRequest("/club_join",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:id
        },function(ret){
            if(ret.errcode === 0){
                //新加入成功:关闭弹窗,刷新列表,进入俱乐部(不再弹"已加入"提示,直接看到列表里的新俱乐部即可)
                if(self._clubJoinWin){ self._clubJoinWin.active = false; }
                self._clubShowMine();
                self._clubRefreshList();
                return;
            }
            if(ret.errcode === 4){
                //已在该俱乐部中:直接关闭弹窗刷新列表(不用再提示)
                if(self._clubJoinWin){ self._clubJoinWin.active = false; }
                self._clubShowMine();
                self._clubRefreshList();
                return;
            }
            if(ret.errcode === 3){
                //俱乐部不存在:提示并清空输入
                cc.vv.wc.showError("没有此ID的俱乐部");
                if(self._clubJoinComp && self._clubJoinComp.onResetClicked){ self._clubJoinComp.onResetClicked(); }
                return;
            }
            //其他错误:显示服务端errmsg并清空
            cc.vv.wc.showError(ret.errmsg || "加入失败");
            if(self._clubJoinComp && self._clubJoinComp.onResetClicked){ self._clubJoinComp.onResetClicked(); }
        });
    },

    //关闭加入弹窗
    _clubCloseJoinWin:function(){
        if(this._clubJoinWin){ this._clubJoinWin.active = false; }
    },

    //关闭创建俱乐部弹窗
    _clubCloseCreateWin:function(){
        if(this._clubCreateWin){ this._clubCreateWin.active = false; }
    },

    //从牌桌返回俱乐部场景时调用:直接打开指定俱乐部的独立玩法详情页(不经过俱乐部弹窗)
    _clubBackToDetail:function(clubid){
        var self = this;
        cc.vv.http.sendRequest("/club_list",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign
        },function(ret){
            if(ret.errcode !== 0){ self.openClubPanel(); return; } //失败兜底:回俱乐部页
            self._myClubs = ret.clubs || [];
            self._hallMode = (ret.hall_mode == 1);
            //大厅模式:不管从哪个俱乐部的牌桌回来,都回总大厅(入口用自己所属俱乐部)
            if(self._hallMode && self._myClubs.length > 0){
                self._clubOpenHallEntry(self._myClubs[0]);
                return;
            }
            var club = null;
            for(var i = 0; i < self._myClubs.length; i++){
                if(self._myClubs[i].id == clubid){ club = self._myClubs[i]; break; } //id可能number/string混用,宽松比较防止===类型不一致匹配失败回落列表页
            }
            if(club){ self._wfOpenDetail(club); } //直达独立玩法详情页
            else{ self.openClubPanel(); } //俱乐部不存在了,兜底回俱乐部页
        });
    },

    //大厅模式入口:用自己所属俱乐部信息进入总牌桌大厅
    _clubOpenHallEntry:function(club){
        if(!club){ return; }
        this._wfOpenDetail(club, true);
    },

    //总牌桌大厅:左侧只列当前有桌的玩法,右侧汇总全平台所有俱乐部的牌桌
    _clubOpenHallDetail:function(club){
        var self = this;
        this._clubCur = {id:club ? club.id : 0, name:"牌桌大厅", _hall:true, myClub:club};
        this._clubCurGame = null;
        this._clubChipName = null;
        this._clubChipsOpen = false;
        this._clubState = "detail";
        this._clubTablesSig = null;
        this._clubSetTop(true,"牌桌大厅");
        cc.vv.http.sendRequest("/club_hall_games",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign
        },function(ret){
            if(ret.errcode !== 0){
                cc.vv.wc.showError(ret.errmsg || "获取玩法失败");
                return;
            }
            self._clubGames = ret.games || [];
            self._clubRenderDetail();
        });
    },

    //打开独立玩法详情页:整页独立节点(点俱乐部/牌桌返回都走这里)
    _wfOpenDetail:function(club, isHall){
        if(this._wfPanel){ this._wfClose(); } //已打开则先关掉旧页
        var canvas = cc.find("Canvas");
        if(!canvas){ return; }
        var vs = cc.view.getVisibleSize();
        var vo = cc.view.getVisibleOrigin();
        //固化场景(club.fire):复用场景内wfPage骨架,只显示/布局,不重建
        var bakedPage = canvas.getChildByName("wfPage");
        if(bakedPage){
            bakedPage.active = true; //尺寸/位置由场景Widget控制,JS不写几何
            //激活后立即强制应用全部Widget对齐:后续HTTP回调读取几何(tablesView宽度/btnBack世界坐标)
            //时不再依赖"下一帧对齐"的时机,避免从牌桌返回时偶发牌桌不居中、俱乐部名称右移
            var ws = bakedPage.getComponentsInChildren(cc.Widget);
            for(var wi = 0; wi < ws.length; ++wi){ ws[wi].updateAlignment(); }
            var maskB = bakedPage.getChildByName("mask");
            if(maskB){
                if(!bakedPage._clubBound){ maskB.on(cc.Node.EventType.TOUCH_START,function(){}); } //吞触摸,防穿透
            }
            bakedPage._clubBound = true;
            var areaB = bakedPage.getChildByName("listArea"); //listArea几何同样由场景Widget控制
            this._wfPanel = bakedPage;
            this._wfBaked = true;
            this._wfSaved = { panel:this._clubPanel, area:this._clubListArea, closeBtn:this._clubCloseBtn, baked:this._clubBaked };
            this._clubBaked = true; //详情页骨架同为固化节点,_clubClearList据此保留静态背景(否则会被当运行时节点销毁,背景丢失)
            this._clubPanel = bakedPage;
            this._clubListArea = areaB;
            this._clubCloseBtn = null; //独立页无右上角X
            if(this._wfSaved.panel){ this._wfSaved.panel.active = false; } //俱乐部页若开着则隐藏
            //静态背景节点引用,尺寸由场景Widget控制
            this._clubDetailBgNode = bakedPage.getChildByName("detailBgImg");
            this._clubDetailFullBg = bakedPage.getChildByName("detailFullBg");
            if(isHall){
                this._clubOpenHallDetail(club); //总大厅:左玩法右全平台牌桌
            }
            else{
                this._clubOpenDetail(club); //复用原详情渲染(左玩法右牌桌),全部画到独立页上
            }
            //管理/快速加入/刷新/记录按钮绑定:hall 时 club 是玩家自己的俱乐部,管理页仍可进入
            this._wfBindAddTable(club);
            return;
        }
    },

    //独立玩法详情页返回:关闭独立页,恢复并打开俱乐部页(列表保持展开)
    _wfBack:function(){
        cc.vv.fromClubId = null; //用户主动返回俱乐部列表:清掉来源俱乐部标记,避免下次进club场景又跳回详情页
        cc.vv.fromClub = false;
        this._wfClose();
        this.openClubPanel();
        this._clubShowMine(); //从详情页返回属于列表内操作,恢复到"我的俱乐部"列表
    },

    //仅关闭独立玩法详情页并恢复俱乐部页引用(不打开俱乐部页)
    _wfClose:function(){
        this._clubStopTableWatch();
        //离开详情页时收起战绩/乐豆弹窗,避免回到大厅后残留
        var canvas = cc.find("Canvas");
        if(canvas){
            var zw = canvas.getChildByName("zhanjiWin"); if(zw){ zw.active = false; }
            var rw = canvas.getChildByName("recordWin"); if(rw){ rw.active = false; }
        }
        var saved = this._wfSaved;
        if(this._wfPanel && cc.isValid(this._wfPanel)){
            if(this._wfBaked){ this._wfPanel.active = false; } //固化场景节点只隐藏不销毁
            else{ this._wfPanel.destroy(); }
        }
        this._wfBaked = false;
        this._wfPanel = null;
        this._clubDetailBgNode = null;
        this._clubDetailFullBg = null;
        this._clubBackBtn = null;
        this._clubTablesNode = null;
        this._clubGameRows = null;
        if(saved){
            this._clubPanel = saved.panel;
            this._clubListArea = saved.area;
            this._clubCloseBtn = saved.closeBtn;
            this._clubBaked = saved.baked; //恢复俱乐部页自身的固化标记
            this._wfSaved = null;
        }
        this._clubState = null;
    },

    //详情页左下角「管理」按钮(glSprite) + 管理面板(节点固化在club.fire,JS只绑事件/填数据)
    _wfBindAddTable:function(club){
        var self = this;
        var page = this._wfPanel;
        if(!page){ return; }
        //仅俱乐部创建者可看见/打开管理面板(服务端同样校验);用户ID可能number/string混用,统一转字符串比较
        var isOwner = !!(club && cc.vv.userMgr && cc.vv.userMgr.userId && String(club.owner_userid) === String(cc.vv.userMgr.userId));
        this._admGame = null; //玩法选择不跨俱乐部残留
        //管理按钮在 boot 栏内部,不能只查wfPage直接子节点
        var boot = page.getChildByName("boot");
        var mgr = (boot ? boot.getChildByName("glSprite") : null) || page.getChildByName("glSprite") || this._clubFind(page,"glSprite");
        if(mgr){
            mgr.active = isOwner;
            if(!mgr._admBound){
                mgr._admBound = true;
                mgr.on(cc.Node.EventType.TOUCH_END,function(){ self._admOpen(); });
            }
        }
        //快速加入:所有成员可见,点击自动找一张未满员的牌桌进入
        var ks = page.getChildByName("KsSprite");
        if(ks && !ks._wfBound){
            ks._wfBound = true;
            ks.on(cc.Node.EventType.TOUCH_END,function(){ self._wfQuickJoin(); });
        }
        //刷新牌桌列表:强制忽略签名比对,重新拉取并重建
        var refresh = page.getChildByName("KsSprite01") || this._clubFind(page,"KsSprite01");
        if(refresh && !refresh._wfRefreshBound){
            refresh._wfRefreshBound = true;
            refresh.active = true;
            refresh.on(cc.Node.EventType.TOUCH_END,function(){
                self._clubTablesSig = null;
                self._clubLoadTables();
            });
        }
        //记录 / 战绩 弹窗(场景固化,JS只绑事件和填数据)
        var recBtn = page.getChildByName("Sprite1") || (boot ? boot.getChildByName("Sprite1") : null) || this._clubFind(page,"Sprite1");
        if(recBtn && !recBtn._wfRecBound){
            recBtn._wfRecBound = true;
            recBtn.on(cc.Node.EventType.TOUCH_END,function(){ self._wfOpenBeanLog(); });
        }
        var zjBtn = page.getChildByName("Sprite2") || (boot ? boot.getChildByName("Sprite2") : null) || this._clubFind(page,"Sprite2");
        if(zjBtn && !zjBtn._wfZjBound){
            zjBtn._wfZjBound = true;
            zjBtn.on(cc.Node.EventType.TOUCH_END,function(){ self._wfOpenZhanji(); });
        }
    },

    //弹窗节点固化在 club.fire(Canvas/zhanjiWin、recordWin),这里只负责显示/置顶/绑关闭,不建节点不排位
    _wfPopupOpen:function(name){
        var canvas = cc.find("Canvas");
        if(!canvas){ return null; }
        var win = canvas.getChildByName(name);
        if(!win){ console.log("[俱乐部]场景缺少弹窗:" + name); return null; }
        win.active = true;
        win.setSiblingIndex(canvas.children.length - 1); //盖在wfPage/管理面板之上
        var alertNode = canvas.getChildByName("alert");
        if(alertNode){ alertNode.setSiblingIndex(canvas.children.length - 1); } //提示层仍在弹窗之上
        //等待/错误提示层也要压过弹窗:详情回放失败等提示用wc.showError弹在WaitingConnection上,不提层会被弹窗挡住,看着像按钮没反应
        var wcNode = canvas.getChildByName("WaitingConnection");
        if(wcNode){ wcNode.setSiblingIndex(canvas.children.length - 1); }
        if(!win._wfPopupBound){
            win._wfPopupBound = true;
            //吞掉空白区触摸,避免点穿到下层按钮
            win.on(cc.Node.EventType.TOUCH_START,function(){});
            var cancel = this._clubFind(win,"btn_cancel");
            if(cancel){
                cancel.on(cc.Node.EventType.TOUCH_END,function(){ win.active = false; });
            }
        }
        this._wfPopupMakeScrollable(win); //list无滚动组件的弹窗在这里补上,行数超出可拖动
        return win;
    },

    //取列表容器与行模板(模板隐藏,行内容全部克隆它,列位置来自场景)
    //list=滚动可视节点(场景固化ScrollView+Mask),content=滚动内容节点(行都放这里)
    _wfPopupList:function(win){
        var list = this._clubFind(win,"list");
        var content = list ? list.getChildByName("content") : null;
        var tpl = content ? content.getChildByName("rowTpl") : (list ? this._clubFind(list,"rowTpl") : null);
        return {list:list,content:content,tpl:tpl};
    },

    //弹窗列表滚动初始化:场景里 list 已固化 ScrollView+Mask+content 时只记录可视高度;
    //老场景(光板list)兜底运行时包一层 sv>view>list。幂等,三个弹窗共用
    _wfPopupMakeScrollable:function(win){
        var ref = this._wfPopupList(win);
        var list = ref.list;
        var tpl = ref.tpl;
        if(!list || list._wfScrolled){ return; }
        list._wfViewH = list.height; //可视高度固定,content高度之后按行数撑
        if(ref.content){
            list._wfScrolled = true;
            list._wfScroll = list.getComponent(cc.ScrollView);
            return;
        }
        list._wfScrolled = true;
        var pos = list.getPosition();
        var sibIdx = list.getSiblingIndex();
        var size = list.getContentSize();
        //行模板(1100)比list(1000)宽:原无遮罩时整行可见,遮罩宽度按行宽取,保持原视觉不裁列
        var viewW = Math.max(size.width, tpl ? tpl.width : 0);
        list._wfViewH = size.height; //可视高度固定,content高度之后按行数撑
        var sv = new cc.Node("sv");
        sv.setContentSize(viewW, size.height);
        sv.setPosition(pos);
        p.addChild(sv);
        sv.setSiblingIndex(sibIdx);
        var view = new cc.Node("view");
        view.setContentSize(viewW, size.height);
        sv.addChild(view);
        var mask = view.addComponent(cc.Mask);
        mask.type = cc.Mask.Type.RECT;
        var scroll = sv.addComponent(cc.ScrollView);
        scroll.horizontal = false;
        scroll.vertical = true;
        scroll.inertia = true;
        scroll.brake = 0.75;
        list.parent = view;
        list.setAnchorPoint(0.5, 1); //content锚点定到顶边中心,行从0向下排,撑高不影响可视锚定
        list.setPosition(0, size.height / 2);
        scroll.content = list;
        list._wfScroll = scroll;
    },

    _wfPopupClearRows:function(list,tpl){
        if(!list){ return; }
        var content = list.getChildByName("content") || list; //行容器:场景固化content,否则是兜底包装后的list自身
        //场景里 content 默认是隐藏的(只当模板容器), 行克隆到隐藏节点下永远看不到, 这里必须打开
        if(!content.active){ content.active = true; }
        var cs = content.children.slice();
        for(var i = 0; i < cs.length; ++i){
            if(cs[i] !== tpl){ cs[i].removeFromParent(); cs[i].destroy(); }
        }
        if(tpl){ tpl.active = false; }
        if(list._wfViewH){
            //重填前回顶并收回可视高度:最新行显示在可视区顶部
            if(list._wfScroll){ list._wfScroll.stopAutoScroll(); list._wfScroll.scrollToTop(0); }
            content.height = list._wfViewH;
            content.setPosition(0, list._wfViewH / 2);
        }
    },
    _wfPopupAddRow:function(list,tpl,idx,vals){
        if(!list || !tpl){ return null; }
        var content = list.getChildByName("content") || list;
        var ROW_H = tpl.height || 36;
        var ROW_GAP = ROW_H + 2;
        var rowY;
        if(list._wfViewH){
            //已接ScrollView:content锚点在顶边,行从0向下排,高度按行数撑开,不再截断
            var needH = (idx + 1) * ROW_GAP;
            if(content.height < needH){ content.height = needH; }
            rowY = -ROW_H / 2 - idx * ROW_GAP;
        }
        else{
            //兜底:结构异常没接上滚动时维持旧的8行截断,避免画出弹窗外
            if(idx >= 8){ return null; }
            var listH = content.height || 330;
            rowY = listH / 2 - ROW_H / 2 - idx * ROW_GAP;
        }
        var row = cc.instantiate(tpl);
        row.active = true;
        row.setPosition(0, rowY);
        content.addChild(row);
        for(var i = 0; i < vals.length; ++i){
            var c = row.getChildByName("c" + i);
            var lb = c ? c.getComponent(cc.Label) : null;
            if(lb){ lb.string = vals[i] == null ? "-" : String(vals[i]); }
        }
        return row;
    },
    //给列表行最后一列的「详情」按钮绑事件: 点了进这一局的宝宝回放(录像不存在时提示, 不改样式)
    _wfBindDetail:function(row,uuid,index){
        var self = this;
        var btn = row ? row.getChildByName("detailBtn") : null;
        if(!btn){ return; }
        btn.off(cc.Node.EventType.TOUCH_END);
        btn.on(cc.Node.EventType.TOUCH_END,function(ev){
            if(ev && ev.stopPropagation){ ev.stopPropagation(); } //别让点击冒泡到弹窗底板的Button
            self._wfOpenReplay(uuid,index);
        });
    },

    //拉取该局录像 → 交给宝宝牌桌场景做回放(不再进房间, 全程不发牌局包)
    _wfOpenReplay:function(uuid,index){
        var self = this;
        if(!uuid || !index){
            cc.vv.wc.showError("该局没有录像，无法回放");
            return;
        }
        if(this._wfReplayLoading){ return; }
        this._wfReplayLoading = true;
        cc.vv.http.sendRequest("/get_replay",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            uuid:uuid,
            index:index
        },function(ret){
            self._wfReplayLoading = false;
            if(ret.errcode !== 0){
                var msg = ret.errcode === 1 ? "该局录像已过期" : (ret.errcode === 2 ? "没有该局回放权限" : (ret.errmsg || "获取回放失败"));
                cc.vv.wc.showError(msg);
                return;
            }
            var rp = ret.replay;
            if(!rp || !rp.events || !rp.events.length){
                cc.vv.wc.showError("该局没有录像，无法回放");
                return;
            }
            cc.vv.bbReplayData = rp;
            //按录像里的玩法类型进对应牌桌场景
            var t = String(rp.type || "");
            var scene = cc.vv.gameNetMgr.sceneForType(t);
            cc.director.loadScene(scene);
        });
    },

    _wfPopupSetLabel:function(win,name,str){
        var n = this._clubFind(win,name);
        var lb = n ? n.getComponent(cc.Label) : null;
        if(lb){ lb.string = str; }
    },
    _wfPopupTime:function(sec){
        var d = new Date((sec || 0) * 1000);
        function p(n){ return n < 10 ? "0" + n : "" + n; }
        return p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
    },
    _wfGameName:function(t){
        var s = String(t || "");
        if(s.indexOf("baobao_mian") === 0){ return "六宝免摆"; }
        if(s.indexOf("baobao_shou") === 0){ return "六宝手动"; }
        if(s.indexOf("baobao") === 0){ return "六宝"; }
        if(s == "sss2"){ return "十三水(2人)"; }
        if(s == "sss4"){ return "十三水(4人)"; }
        if(s == "sss6"){ return "十三水(6人)"; }
        return s ? s : "-";
    },

    //打开「我的战绩」(boot/Sprite2):数据源 /get_replay_list(3天内房间->局两级)
    _wfOpenZhanji:function(){
        var self = this;
        var win = this._wfPopupOpen("zhanjiWin");
        if(!win){ return; }
        var seq = win._wfSeq = (win._wfSeq || 0) + 1; //丢弃上一次未返回的回包
        var ls = this._wfPopupList(win);
        this._wfPopupClearRows(ls.list,ls.tpl);
        this._wfPopupSetLabel(win,"sum1","牌局数：0");
        this._wfPopupSetLabel(win,"sum2","大赢家：-");
        this._wfPopupSetLabel(win,"sum3","分数：-");
        var tip = this._clubFind(win,"emptyTip");
        if(tip){ tip.active = false; }
        cc.vv.http.sendRequest("/get_replay_list",{account:cc.vv.userMgr.account,sign:cc.vv.userMgr.sign},function(ret){
            if(!cc.isValid(win) || !win.active || win._wfSeq !== seq){ return; }
            if(ret.errcode !== 0){
                cc.vv.wc.showError(ret.errmsg || "获取战绩失败");
                return;
            }
            var rooms = ret.list || [];
            var total = 0;
            for(var r = 0; r < rooms.length; ++r){ total += (rooms[r].games || []).length; }
            self._wfPopupSetLabel(win,"sum1","牌局数：" + total);
            var idx = 0;
            for(var i = 0; i < rooms.length; ++i){
                var rm = rooms[i];
                var games = rm.games || [];
                for(var g = 0; g < games.length; ++g){
                    var gm = games[g];
                    var row = self._wfPopupAddRow(ls.list,ls.tpl,idx,[
                        idx + 1,
                        rm.table_name || self._wfGameName(rm.type),
                        "-",
                        self._wfPopupTime(gm.create_time),
                        "-",
                        rm.roomid,
                        gm.index,
                        "-",
                        "-"
                    ]);
                    //详情按钮: 录像存在(房间uuid+局号)才可点, 否则点了直接提示
                    var isBB = String(rm.type || "").indexOf("baobao") === 0;
                    if(row){ self._wfBindDetail(row, isBB ? (rm.uuid || "") : "", isBB ? (gm.index || 0) : 0); }
                    idx++;
                }
            }
            if(tip && cc.isValid(tip)){ tip.active = (idx == 0); }
        });
    },

    //打开「我的乐豆详情」(boot/Sprite1):数据源 /my_bean_logs(可切换今天/全部)
    _wfOpenBeanLog:function(){
        var self = this;
        var win = this._wfPopupOpen("recordWin");
        if(!win){ return; }
        var todayBtn = this._clubFind(win,"todayBtn");
        var allBtn = this._clubFind(win,"allBtn");
        if(todayBtn && !todayBtn._wfBound){
            todayBtn._wfBound = true;
            todayBtn.on(cc.Node.EventType.TOUCH_END,function(){ self._wfLoadBeanLog(win,true); });
        }
        if(allBtn && !allBtn._wfBound){
            allBtn._wfBound = true;
            allBtn.on(cc.Node.EventType.TOUCH_END,function(){ self._wfLoadBeanLog(win,false); });
        }
        this._wfLoadBeanLog(win,true); //默认今天
    },

    //today=true只查今天0点之后;标签用颜色区分当前筛选
    _wfLoadBeanLog:function(win,today){
        var self = this;
        if(!win || !cc.isValid(win)){ return; }
        var ls = this._wfPopupList(win);
        this._wfPopupClearRows(ls.list,ls.tpl);
        var todayBtn = this._clubFind(win,"todayBtn");
        var allBtn = this._clubFind(win,"allBtn");
        if(todayBtn){ todayBtn.color = cc.color(today ? 255 : 245,today ? 200 : 240,today ? 90 : 230); }
        if(allBtn){ allBtn.color = cc.color(today ? 245 : 255,today ? 240 : 200,today ? 230 : 90); }
        var tip = this._clubFind(win,"emptyTip");
        if(tip){ tip.active = false; }
        var from = 0;
        if(today){
            var d = new Date();
            d.setHours(0,0,0,0);
            from = Math.floor(d.getTime() / 1000);
        }
        var seq = win._wfLogSeq = (win._wfLogSeq || 0) + 1; //切换今天/全部时丢弃旧回包
        cc.vv.http.sendRequest("/my_bean_logs",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            from:from
        },function(ret){
            if(!cc.isValid(win) || !win.active || win._wfLogSeq !== seq){ return; }
            if(ret.errcode !== 0){
                cc.vv.wc.showError(ret.errmsg || "获取乐豆记录失败");
                return;
            }
            var logs = ret.logs || [];
            for(var i = 0; i < logs.length; ++i){
                var lg = logs[i];
                var amt = Number(lg.amount) || 0;
                var row = self._wfPopupAddRow(ls.list,ls.tpl,i,[
                    self._wfPopupTime(lg.create_time),
                    lg.roomid || "-",
                    lg.table_name || self._wfGameName(lg.game_type),
                    lg.change_type || "-",
                    (amt > 0 ? "+" + amt : String(amt)),
                    "-"
                ]);
                //详情按钮: 只有对局结算的流水带房间uuid/局号, 其他流水点了提示没有录像
                var isBB = String(lg.game_type || "").indexOf("baobao") === 0;
                if(row){ self._wfBindDetail(row, isBB ? (lg.room_uuid || "") : "", isBB ? (parseInt(lg.game_index) || 0) : 0); }
            }
            if(tip && cc.isValid(tip)){ tip.active = (logs.length == 0); }
        });
    },

    //打开管理面板(admin):按钮/弹窗全部是场景节点,JS只绑事件、填文字
    _admOpen:function(){
        // 把当前俱乐部ID带给管理场景(管理场景是独立加载的, 拿不到本场景的实例数据)
        var cid = this._clubCur ? parseInt(this._clubCur.id) : 0;
        if(!(cid > 0)){ cid = parseInt(cc.vv.fromClubId) || 0; }
        if(cid > 0){
            cc.vv.adminClubId = cid;
            cc.sys.localStorage.setItem("admin_club_id", cid);
        }
        // 跳转到独立的管理场景
        cc.director.loadScene("clubAdmin");
    },

    //快速加入:从当前玩法的牌桌里挑一张未满员的进入(优先有人但未满的桌;进入门槛由服务端校验)
    _wfQuickJoin:function(){
        var tables = this._clubTableList || [];
        var best = null, bestCnt = -1;
        for(var i = 0; i < tables.length; ++i){
            var t = tables[i];
            var maxP = this._clubMaxPlayers(t);
            //人数:实时座位占用(长连接推送)优先,其次服务端列表的player_count
            var cnt = Number(t.player_count) || 0;
            var ent = (t.roomid && this._clubTableCardMap) ? this._clubTableCardMap["r_" + t.roomid] : null;
            if(ent && ent.slots){
                var live = 0;
                for(var s = 0; s < ent.slots.length; ++s){ if(ent.slots[s] && ent.slots[s]._uid > 0){ ++live; } }
                if(live > cnt){ cnt = live; }
            }
            if(cnt >= maxP){ continue; } //满员跳过
            if(cnt > bestCnt){ bestCnt = cnt; best = t; }
        }
        if(!best){ cc.vv.wc.showError("当前没有可加入的牌桌"); return; }
        this._clubEnterTable(best); //复用现有进入流程(含宝宝豆门槛校验)
    },

    //俱乐部详情:左侧玩法列表+右侧桌面列表
    _clubOpenDetail:function(club){
        var self = this;
        this._clubCur = club;
        this._clubCurGame = null;
        this._clubChipName = null;
        this._clubChipsOpen = false;
        this._clubState = "detail";
        this._clubTablesSig = null; //进入详情强制按服务端最新数据重建一次牌桌列表(占位/人数)
        this._clubSetTop(true,club.name);
        cc.vv.http.sendRequest("/club_games",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:club.id
        },function(ret){
            if(ret.errcode !== 0){
                cc.vv.wc.showError(ret.errmsg || "获取玩法失败");
                return;
            }
            self._clubGames = ret.games || [];
            self._clubRenderDetail();
        });
    },

    _clubRenderDetail:function(){
        var self = this;
        this._clubClearList();
        var area = this._clubListArea;
        var ah = area.height || 460;
        var vs = cc.view.getVisibleSize();
        //整页背景图(固化节点 detailBgImg,贴图 club_detail_bg 已直接配置在场景中),尺寸由场景Widget控制
        var existBg = this._clubPanel.getChildByName("detailBgImg");
        this._clubDetailBgNode = existBg;
        //左侧底色/顶部通栏不再由JS绘制:全部背景交给场景节点(编辑器里控制),JS只清掉残留
        var fullBg = this._clubPanel.getChildByName("detailFullBg"); //固化场景节点(Graphics组件已挂),可能已被编辑器删除
        this._clubDetailFullBg = fullBg;
        if(fullBg){
            var fbg = fullBg.getComponent(cc.Graphics);
            if(fbg){ fbg.clear(); }
        }
        //详情页右上角退出按钮禁用,离开详情用左上角返回按钮
        if(this._clubCloseBtn){ this._clubCloseBtn.active = false; }
        //左上角返回按钮(固化节点 btnBack,贴图 club_btn_back 自带文字已配置,文字Label在场景中隐藏)
        var backBtn = this._clubFind(area,"btnBack");
        if(backBtn){
        //位置由场景控制(编辑器里调整),JS只绑定点击
        backBtn._clubW = backBtn.width; backBtn._clubH = backBtn.height;
        if(!backBtn._clubBound){
            backBtn._clubBound = true;
            backBtn.on(cc.Node.EventType.TOUCH_END,function(){
                //wfPage返回按钮:回到俱乐部列表页(clubPage),不直接回大厅
                self._wfBack();
            });
        }
        this._clubBackBtn = backBtn;
        }
        //返回按钮右边显示俱乐部名称(字号/颜色/位置全部用场景里的设置,JS只填文字,超宽截断)
        var cnNode = this._clubFind(area,"clubName");
        if(cnNode){
            cnNode.active = true;
            var cnl = cnNode.getComponent(cc.Label);
            if(cnl){ this._clubClampLabel(cnl, (this._clubCur && this._clubCur.name) || ""); }
        }
        //俱乐部名称后面显示玩家房卡数(节点clubGems固化在场景listArea下,位置由编辑器控制,JS只填文字)
        var gemsNode = this._clubFind(area,"clubGems");
        this._clubGemsNode = gemsNode; //缓存引用,供保险柜存取后同步显示 //rc2
        //顶部玩家头像:每次进入详情清掉自己的基础信息缓存,确保换头像后立即同步
        var topBar = gemsNode && gemsNode.parent;
        var avatarBox = topBar ? topBar.getChildByName("New Node") : null;
        var topAvatar = avatarBox ? avatarBox.getChildByName("name") : null;
        if(topAvatar && cc.vv.userMgr && cc.vv.userMgr.userId){
            if(cc.vv.baseInfoMap){ delete cc.vv.baseInfoMap[cc.vv.userMgr.userId]; }
            var topLoader = topAvatar.getComponent("ImageLoader") || topAvatar.addComponent("ImageLoader");
            topLoader.setUserID(cc.vv.userMgr.userId);
        }
        var setGems = function(v){
            if(!cc.isValid(gemsNode)){ return; }
            var gl = gemsNode.getComponent(cc.Label);
            if(gl){ gl.string = String(v == null ? 0 : v); }
        };
        if(gemsNode){ setGems(cc.vv.userMgr.gems); }
        //静默刷新真实房卡余额(扣房卡/奖励后同步显示)
        cc.vv.http.sendRequest("/get_user_status",{account:cc.vv.userMgr.account,sign:cc.vv.userMgr.sign},function(ret){
            if(ret && ret.gems != null){
                cc.vv.userMgr.gems = Number(ret.gems);
                self._gemsCache = {gems:cc.vv.userMgr.gems,at:Date.now()}; //同步给进桌前的余额缓存
                setGems(cc.vv.userMgr.gems);
            }
        });

        //保险柜按钮:节点固化在 club.fire(listArea/safeBtn),这里只绑点击
        if(gemsNode && gemsNode.parent){
            var safeBtn = gemsNode.parent.getChildByName("safeBtn") || this._clubFind(area,"safeBtn");
            if(safeBtn){
                safeBtn.off(cc.Node.EventType.TOUCH_END);
                safeBtn.on(cc.Node.EventType.TOUCH_END, function(){
                    self._openSafeWin();
                });
            }
        }

        //左侧玩法列表:行结构(gameRowTpl含bgimg背景图+l名称Label)固化在场景games下,JS只克隆填文字+赋图
        var gamesNode = this._clubFind(area,"games");
        if(!gamesNode){ return; }
        //保留固化模板/按钮/提示节点,只清动态克隆的行;玩法按钮模板优先用sampleRow0(只显示玩法名)
        var grTpl = gamesNode.getChildByName("sampleRow0") || gamesNode.getChildByName("gameRowTpl");
        var allRow = gamesNode.getChildByName("allRow"); //场景固化的「全部」按钮
        var etNode = gamesNode.getChildByName("emptyTip");
        var tiNode = gamesNode.getChildByName("samptext");
        var keeps = [];
        ["gameRowTpl","sampleRow0","sampleRow1","sampleRow2"].forEach(function(nm){
            var k = gamesNode.getChildByName(nm);
            if(k){ keeps.push(k); }
        });
        gamesNode.removeAllChildren();
        if(tiNode){ gamesNode.addChild(tiNode); }
        keeps.forEach(function(k){ gamesNode.addChild(k); k.active = false; });
        if(allRow){ gamesNode.addChild(allRow); allRow.active = true; }
        if(etNode){ gamesNode.addChild(etNode); }
        this._clubGameRows = [];
        //「全部」伪玩法行:置于列表首位,选中时右侧显示本俱乐部所有玩法的牌桌
        var ALL_GAME = {_all:true, game_type:"", name:"全部", difen_options:[], jushu_options:[]};
        var games = [ALL_GAME].concat(this._clubGames || []);
        this._clubGamesWithAll = games; //供行渲染/命中查找统一使用
        var ROW_H = grTpl ? grTpl.height : 68;
        //位置规则:allRow(「全部」按钮)坐标完全由场景控制,JS不改;克隆的玩法行接在allRow右侧依次排开,缝隙0
        var ROW_GAPX = 0; //按钮与按钮之间的缝隙=0
        var cursorX = null; //allRow右缘x(games容器坐标系),由场景里allRow的位置决定
        var baseY = 0;
        //暂无玩法提示:固化在场景games下的emptyTip节点(文案/样式在编辑器调),JS只控制显隐
        var et = gamesNode.getChildByName("emptyTip");
        if(et){ et.active = ((this._clubGames || []).length == 0); }
        games.forEach(function(gm,i){
            //第0行用场景固化的allRow(不再克隆),位置不动(场景控制);其他玩法行克隆gameRowTpl,接在allRow右侧
            var row = null;
            if(i === 0 && allRow){
                row = allRow;
                row.active = true;
                cursorX = allRow.x + allRow.width / 2; //allRow右缘(锚点0.5)
                baseY = allRow.y;
            } else {
                row = grTpl ? cc.instantiate(grTpl) : new cc.Node("row"+i);
                row.active = true;
                if(cursorX != null){
                    row.setPosition(cursorX + ROW_GAPX + row.width / 2, baseY);
                    cursorX += ROW_GAPX + row.width;
                }
                gamesNode.addChild(row);
            }
            row._gm = gm; //行绑定的玩法(添加牌桌按高亮行取类型)
            var lNode = row.getChildByName("l");
            if(lNode){
                //JS只填文字内容;字号/颜色/对齐/尺寸全由场景gameRowTpl/allRow的l节点控制
                var ll = lNode.getComponent(cc.Label);
                if(ll){ ll.string = gm.name || ""; }
            }
            var bgimg = row.getChildByName("bgimg");
            if(bgimg){
                //按钮底图:未选中态直接用场景固化的图(bgimg上已配好),选中态=button_yellow.png
                var bsp = bgimg.getComponent(cc.Sprite);
                row._iconSp = bsp;
                row._iconNormal = bsp ? bsp.spriteFrame : null; //场景固化的未选中底图,JS不覆盖
                row._iconSel = null;
                cc.resources.load("images/other/button_yellow", cc.SpriteFrame, function(err,sf){
                    if(err || !sf || !cc.isValid(bgimg)){ return; }
                    row._iconSel = sf;
                    if(row._selected){ bsp.spriteFrame = sf; } //点击态换button_yellow
                });
            }
            row.off(cc.Node.EventType.TOUCH_END); //allRow为场景固化节点会被反复复用,先清掉历次渲染叠加的旧监听,否则点一次触发多次
            row.on(cc.Node.EventType.TOUCH_END,function(){
                if(self._clubScrollMoved){ self._clubScrollMoved = false; return; }
                self._clubSelectGame(gm,row);
            });
            self._clubGameRows.push(row);
        });
        //右侧桌片区:从左到右排列、左靠齐、超出后左右拖动的牌桌卡片列表
        //固化场景节点 tablesView(Mask)+tables,几何(尺寸/位置/锚点)完全由场景编辑器控制,JS不写
        var svView = this._clubFind(area,"tablesView") || this._clubFind(cc.find("Canvas"),"tablesView");
        if(!svView){ return; }
        this._clubTablesNode = svView.getChildByName("tables");
        if(!this._clubTablesNode){ return; }
        //牌桌卡片模板=场景里配置的 sampleCard0(六座)/sampleCard2(2人小桌子),必须在清空列表前取到
        var tplNode = this._clubFind(this._clubTablesNode, "sampleCard0");
        if(tplNode){ this._clubTpl = tplNode; }
        var tplNode2 = this._clubFind(this._clubTablesNode, "sampleCard2");
        if(tplNode2){ this._clubTpl2 = tplNode2; }
        this._clubTablesNode.removeAllChildren();
        //横向拖动滚动(与俱乐部列表同一手感,拖动时不触发进桌点击),固化场景只绑一次
        if(!svView._clubBound){
            svView._clubBound = true;
            var svStartX = 0, svBaseX = 0;
            svView.on(cc.Node.EventType.TOUCH_START,function(e){
                svStartX = e.getLocation().x;
                svBaseX = self._clubTablesNode ? self._clubTablesNode.x : 0;
                self._clubTablesScrollMoved = false;
            });
            svView.on(cc.Node.EventType.TOUCH_MOVE,function(e){
                if(!self._clubTablesNode){ return; }
                var vw = svView.width;
                var cW = self._clubTablesNode.width;
                if(cW <= vw){ return; } //内容不超出,不滚动
                var dx = e.getLocation().x - svStartX;
                if(Math.abs(dx) > 6){ self._clubTablesScrollMoved = true; }
                var restX = self._clubTablesRestX || 0;
                var over = cW - vw; //锚点(0,1):x为内容左缘,可向左拖出溢出量,右界回到restX
                self._clubTablesNode.x = Math.max(restX - over,Math.min(restX,svBaseX + dx));
            });
            svView.on(cc.Node.EventType.TOUCH_CANCEL,function(){ self._clubTablesScrollMoved = false; });
        }
        if(this._clubTablesRestY == null){ this._clubTablesRestY = this._clubTablesNode.y; } //记录场景里配置的初始位置,重建时回到这里
        if(this._clubTablesRestX == null){ this._clubTablesRestX = this._clubTablesNode.x; }
        //默认选中玩法:从牌桌退出/结算返回时优先回到刚玩过的那个玩法(直达它的牌桌页),
        //没有记录或该玩法不在本俱乐部时默认选「全部」(显示所有玩法的牌桌)
        if(!this._clubCurGame && games.length > 0){
            var wanted = cc.vv.lastGameType;
            var picked = null;
            if(wanted){
                for(var gi = 0; gi < games.length; ++gi){
                    var gt = games[gi].game_type || games[gi].type;
                    if(gt && gt == wanted){ picked = games[gi]; break; }
                }
            }
            this._clubCurGame = picked || games[0]; //games[0]即「全部」伪玩法行
        }
        for(var k = 0; k < this._clubGameRows.length; ++k){
            this._clubPaintRow(this._clubGameRows[k],games[k] === this._clubCurGame);
        }
        if(this._clubCurGame){
            this._clubLoadTables();
        }
        else{
            this._clubAddRow(this._clubTablesNode,0,"← 请先选择左侧玩法","",null,520);
        }
    },

    //选中玩法:高亮行+在它正下方展开该玩法的牌桌列表,并刷新右侧牌桌;重复点击=收起/展开
    _clubSelectGame:function(gm,row){
        if(gm === this._clubCurGame){
            this._clubChipsOpen = !this._clubChipsOpen;
            this._clubChipsAnchor = row;
            //收起时清掉条目筛选,右侧恢复显示该玩法全部牌桌
            if(!this._clubChipsOpen && this._clubChipName){
                this._clubChipName = null;
                this._clubTablesSig = null;
                this._clubLoadTables();
            }
            this._clubRenderTableChips();
            return;
        }
        this._clubChipsOpen = true; //点击后才展开,初始不显示
        this._clubChipsAnchor = row;
        this._clubChipName = null; //换玩法清除上一个玩法的牌桌筛选
        this._clubCurGame = gm;
        for(var k = 0; k < this._clubGameRows.length; ++k){
            this._clubPaintRow(this._clubGameRows[k],this._clubGameRows[k] === row);
        }
        this._clubTableList = []; //清空旧玩法数据,避免下方牌桌列表短暂显示上一个玩法的桌
        this._clubRenderTableChips();
        this._clubLoadTables();
    },

    //把弹窗摆到指定玩法按钮的正下方(弹窗左边缘=按钮左边缘, 顶边=按钮底边-4)
    //按世界包围盒换算到弹窗父节点坐标系, 场景里按钮坐标/尺寸改了也会自动跟随
    _clubPlaceDrop:function(rowNode){
        var panel = this._clubDropNode;
        if(!panel || !cc.isValid(panel) || !panel.parent || !cc.isValid(panel.parent)){ return; }
        if(!rowNode || !cc.isValid(rowNode)){
            //玩法行可能被重建过: 按当前选中的玩法找一条还活着的行
            var rows = this._clubGameRows || [];
            for(var i = 0; i < rows.length; ++i){
                if(rows[i] && cc.isValid(rows[i]) && rows[i]._gm === this._clubCurGame){ rowNode = rows[i]; break; }
            }
            if(!rowNode){ return; }
            this._clubChipsAnchor = rowNode;
        }
        if(!rowNode.parent){ return; }
        //按钮和弹窗都在同一个父节点(listArea)下: 按钮的父节点=games, games与弹窗是兄弟
        //这里只用本地坐标相加, 不碰世界矩阵(克隆行/Widget 的世界矩阵可能还没刷新, 取到旧值就会整体偏一个按钮)
        var gp = rowNode.parent;
        var px, py;
        if(gp.parent === panel.parent){
            px = gp.x + rowNode.x - rowNode.width * rowNode.anchorX + panel.width / 2;
            py = gp.y + rowNode.y - rowNode.height * (1 - rowNode.anchorY) - 4 - panel.height / 2;
        } else {
            //层级不同(理论上不会走到): 退回世界坐标换算
            var bl = gp.convertToWorldSpaceAR(cc.v2(
                rowNode.x - rowNode.width * rowNode.anchorX,
                rowNode.y - rowNode.height * (1 - rowNode.anchorY)
            ));
            var local = panel.parent.convertToNodeSpaceAR(bl);
            px = local.x + panel.width / 2;
            py = local.y - 4 - panel.height / 2;
        }
        panel.setPosition(px, py);
        console.log("[俱乐部]gamesDrop 定位 按钮=" + rowNode.name + " row=(" + rowNode.x + "," + rowNode.y + ") 容器=(" + gp.x + "," + gp.y + ") -> panel=(" + px + "," + py + ")");
    },

    //点击玩法按钮后展开的牌桌列表(纵向滚动面板 gamesDrop 固化在 club.fire)
    //条目按牌桌名称去重;点某条=右侧只显示该名称的牌桌,并收起弹窗
    _clubRenderTableChips:function(){
        var self = this;
        var area = this._clubListArea;
        var panel = (area ? this._clubFind(area,"gamesDrop") : null) || this._clubDropNode;
        if(!panel || !cc.isValid(panel)){ return; }
        this._clubDropNode = panel;
        var open = !!this._clubChipsOpen;
        panel.active = open;
        if(!open){ return; } //只在点击玩法/全部按钮后展开,初始不显示
        //弹窗贴在被点击的玩法按钮正下方: 弹窗左边缘对齐按钮左边缘
        this._clubPlaceDrop(this._clubChipsAnchor);
        //Widget/ScrollView 可能在本帧后才完成对齐, 下一帧再摆一次, 避免用到旧坐标
        var self0 = this;
        if(!this._clubDropPlacing){
            this._clubDropPlacing = true;
            this.scheduleOnce(function(){
                self0._clubDropPlacing = false;
                if(self0._clubChipsOpen){ self0._clubPlaceDrop(self0._clubChipsAnchor); }
            }, 0);
        }
        var list = panel.getChildByName("list");
        var sv = list ? list.getComponent(cc.ScrollView) : null;
        var content = list ? list.getChildByName("content") : null;
        if(!content){ return; }
        //超出弹窗左右的条目/文字由遮罩裁掉
        var mask = list.getComponent(cc.Mask);
        if(mask){ mask.enabled = true; }
        var tpl = content.getChildByName("itemTpl");
        if(!tpl){ console.log("[俱乐部]gamesDrop 缺少 itemTpl 模板"); return; }
        //清掉旧条目(保留模板);先移出父节点再销毁,避免同帧新旧条目叠在一起
        content.children.slice().forEach(function(ch){
            if(ch === tpl){ return; }
            ch.active = false;
            ch.removeFromParent();
            ch.destroy();
        });
        //只列当前玩法的牌桌(「全部」时列所有),防止切换玩法瞬间显示旧数据
        var cur = this._clubCurGame || {};
        var tables = (this._clubTableList || []).filter(function(t){
            return cur._all || !cur.game_type || t.game_type === cur.game_type;
        });
        //按牌桌名称去重(名称相同只保留一条;名称为空按ID各算一条)
        var seen = {}, uniq = [];
        tables.forEach(function(t){
            var nm = String(t.name == null ? "" : t.name).replace(/^\s+|\s+$/g,"");
            var key = nm || ("#" + t.id);
            if(seen[key]){ return; }
            seen[key] = true;
            uniq.push({key:key,name:nm,table:t});
        });
        var et = panel.getChildByName("emptyTip");
        if(et){ et.active = (uniq.length === 0); }
        var IH = tpl.height || 64, GAPY = 6;
        content.height = Math.max(list.height, GAPY + uniq.length * (IH + GAPY));
        //拖动条目时记下"在滚动", 松手不能当成点击(否则一拖就触发筛选并把列表滚回顶部, 看起来像不能滚)
        if(!list._dropScrollBound){
            list._dropScrollBound = true;
            var dStartY = 0;
            list.on(cc.Node.EventType.TOUCH_START,function(e){
                dStartY = e.getLocation().y;
                self._clubScrollMoved = false;
            });
            list.on(cc.Node.EventType.TOUCH_MOVE,function(e){
                if(Math.abs(e.getLocation().y - dStartY) > 6){ self._clubScrollMoved = true; }
            });
            list.on(cc.Node.EventType.TOUCH_CANCEL,function(){ self._clubScrollMoved = false; });
        }
        //选中态底图(与玩法按钮一致),只加载一次
        if(!this._clubChipSel && !this._clubChipLoading){
            this._clubChipLoading = true;
            cc.resources.load("images/other/button_yellow", cc.SpriteFrame, function(err,sf){
                self._clubChipLoading = false;
                if(err || !sf){ return; }
                self._clubChipSel = sf;
                if(!cc.isValid(content)){ return; }
                content.children.forEach(function(ch){
                    if(ch.name !== "tchip" || !ch._selected){ return; }
                    var b = ch.getChildByName("bgimg");
                    var s = b ? b.getComponent(cc.Sprite) : null;
                    if(s){ s.spriteFrame = sf; }
                });
            });
        }
        uniq.forEach(function(u,i){
            var item = cc.instantiate(tpl);
            item.name = "tchip";
            item.active = true;
            item.setPosition(0, -(GAPY + IH / 2 + i * (IH + GAPY)));
            var lNode = item.getChildByName("l");
            if(lNode){
                var lb = lNode.getComponent(cc.Label);
                if(lb){
                    var txt = u.name || ("牌桌" + u.table.id);
                    lb.string = txt;
                    //名字超宽直接截断隐藏, 不许左右冒出弹窗
                    self._clubClampLabel(lb, txt);
                }
            }
            var sel = (self._clubChipName === u.key);
            item._selected = sel;
            var bg = item.getChildByName("bgimg");
            var bsp = bg ? bg.getComponent(cc.Sprite) : null;
            if(bsp && sel && self._clubChipSel){ bsp.spriteFrame = self._clubChipSel; }
            content.addChild(item);
            item.on(cc.Node.EventType.TOUCH_END,function(){
                if(self._clubScrollMoved){ self._clubScrollMoved = false; return; } //拖动滚动时不触发点击
                self._clubChipName = u.key;
                self._clubChipsOpen = false; //选中牌桌名后收起弹窗
                self._clubTablesSig = null; //签名置空确保重建
                self._clubLoadTables();
                self._clubRenderTableChips(); //内部按 _clubChipsOpen 隐藏面板
            });
        });
        if(sv){ sv.scrollToTop(0); }
    },

    //牌桌卡片模板:2人桌优先用场景 tables 下的 sampleCard2(小桌子),没有则沿用 sampleCard0
    _clubCardTpl:function(maxP){
        var root = cc.find("Canvas");
        if(maxP === 2){
            if(this._clubTpl2 && cc.isValid(this._clubTpl2)){ return this._clubTpl2; }
            var t2 = root ? this._clubFind(root,"sampleCard2") : null;
            if(t2){ this._clubTpl2 = t2; return t2; }
        }
        if(this._clubTpl && cc.isValid(this._clubTpl)){ return this._clubTpl; }
        //不依赖tables容器状态:直接从场景根递归找
        var t = root ? this._clubFind(root,"sampleCard0") : null;
        if(t){ this._clubTpl = t; }
        return t || null;
    },

    //当前玩法的实际人数:牌桌数据带max_players时以它为准(最多6),否则按牌桌自身的game_type判定(「全部」模式下_clubCurGame无类型,必须从牌桌取)
    _clubMaxPlayers:function(t){
        if(t){
            var mp = t.max_players || t.maxPlayers;
            if(mp) { mp = parseInt(mp); return mp > 6 ? 6 : mp; }
        }
        var gt = (t && t.game_type) ? t.game_type
            : ((this._clubCurGame && this._clubCurGame.game_type) ? this._clubCurGame.game_type : "");
        if(gt.indexOf("baobao") === 0){ return 6; } //宝宝牌固定6座
        if(gt == "sss6"){ return 6; }
        return (gt.indexOf("zj4") === 0 || gt.indexOf("zp4") === 0 || gt == "wujin4" || gt == "sss4") ? 4 : 2;
    },

    //创建牌桌卡片(绿色桌面+按玩法人数画座位+名称+人数),返回卡片节点
    _clubAddTableCard:function(parent,idx,t){
        var self = this;
        //2人桌用场景里单独摆的小桌子模板 sampleCard2,其余用六座模板 sampleCard0
        var maxP = this._clubMaxPlayers(t);
        var pf = this._clubCardTpl(maxP);
        if(!pf){ console.log("[俱乐部]场景缺少sampleCard0模板,无法建牌桌卡片"); return; }
        //两行显示、靠左对齐:先排满上下两行,多了往右扩列;tables锚点(0,1)原点即左上,超出tablesView后左右拖动
        var GAPX = 5, GAPY = 5, PAD = 5; //卡片间距/边距
        var CW = pf.width, CH = pf.height;
        var col = Math.floor(idx / 2);
        var row = idx % 2;
        var x = PAD + CW / 2 + col * (CW + GAPX);
        var y = -(PAD + CH / 2 + row * (CH + GAPY));
        var card = cc.instantiate(pf);
        card.active = true; //模板节点是隐藏的,克隆出来要显式打开
        card.setPosition(x, y);
        parent.addChild(card);
        //座位:六座牌桌图(下左/左/上左/上右/右/下右),按实际人数取对称的子集;座位内人物/位置由场景模板决定
        var sides = ["下左","左","上左","上右","右","下右"];
        //2人桌:模板里若单独摆了 seat2p0/seat2p1(可在编辑器里自由调整这两个座位的位置),
        //优先用这两个专用座位,否则在六座图上取对称子集兜底
        var seat2p = [card.getChildByName("seat2p0"), card.getChildByName("seat2p1")];
        var use2p = !!(maxP === 2 && seat2p[0] && seat2p[1]);
        //useSet:房间座位号(0..maxP-1)依次对应的牌桌显示位(下左/左/上左/上右/右/下右),推送里的seatindex要按它换算
        var useSet = use2p ? [0,1] : ({2:[0,3],3:[0,1,4],4:[0,1,3,4],5:[0,1,2,3,4],6:[0,1,2,3,4,5]}[maxP] || [0,1,2,3,4,5]);
        //初始座位:用列表接口返回的 user_id0..5(下标=房间座位号)按map换算到显示位直接渲染,
        //否则打开页面前已落座的玩家永远显示不出来,后续变化再由长连接推送增量更新
        var uids = [0,0,0,0,0,0]; //下标=显示位
        var names = ["","","","","",""]; //下标=显示位,与uids同序
        var uidNames = this._clubUidNames = this._clubUidNames || {}; //uid→昵称:推送只带userid时按它补名
        for(var s = 0; s < useSet.length; s++){
            var su = Number(t["user_id" + s]) || 0;
            var sn = t["user_name" + s] || "";
            if(su > 0 && useSet[s] < uids.length){ uids[useSet[s]] = su; names[useSet[s]] = sn; uidNames[su] = sn; }
        }
        var slotList = [null,null,null,null,null,null]; //下标=显示位,与uids同序,增量刷新时按显示位写座位
        for(var i = 0; i < 6; i++){
            var st = card.getChildByName("seat" + i);
            if(!st){ continue; }
            if(use2p || useSet.indexOf(i) < 0){ st.active = false; continue; }
            st._side = sides[i];
            slotList[i] = st;
            this._clubSetSeat(st,uids[i] || 0,names[i] || "");
        }
        if(seat2p[0]){ seat2p[0].active = use2p; }
        if(seat2p[1]){ seat2p[1].active = use2p; }
        if(use2p){
            //2人桌专用座位:下家/上家,人物朝向沿用六座图的 下左/上右 两套图
            for(var q = 0; q < 2; q++){
                var st2 = seat2p[q];
                st2._side = (q === 0) ? "下左" : "上右";
                slotList[q] = st2;
                this._clubSetSeat(st2,uids[q] || 0,names[q] || "");
            }
        }
        if(!this._clubTableCardMap){ this._clubTableCardMap = {}; }
        var ent = {card:card,slots:slotList,uids:uids,map:useSet}; //map:房间座位号→显示位
        this._clubTableCardMap[t.id] = ent; //供长连接推送增量刷新落座人物
        if(t.roomid){ this._clubTableCardMap["r_" + t.roomid] = ent; } //推送按roomid定位卡片,避免走DB全表刷新(异步写库有时序差)
        //桌面名称:大厅和普通模式都只显示牌桌名
        var nn = card.getChildByName("cb") || card.getChildByName("n"); //cb=牌桌名称节点(旧模板叫n)
        if(nn){
            var nl = nn.getComponent(cc.Label);
            if(nl){ nl.string = (t.name || ""); }
        }
        //底分/局数:直接用桌conf里存的实际值(添加牌桌时输入的值),老数据兜底才按选项下标换算
        var confObj = {};
        try{ confObj = JSON.parse(t.conf) || {}; }catch(e){}
        var cgame = this._clubCurGame || {};
        var difens = cgame.difen_options || [];
        var jushus = cgame.jushu_options || [];
        var df = (confObj.difen_value != null) ? confObj.difen_value
            : ((typeof confObj.difen === 'number' && difens[confObj.difen] != null) ? difens[confObj.difen] : confObj.difen);
        var js = (confObj.jushu_value != null) ? confObj.jushu_value
            : ((typeof confObj.jushuxuanze === 'number' && jushus[confObj.jushuxuanze] != null) ? jushus[confObj.jushuxuanze] : confObj.jushuxuanze);
        //血战模式: 固定无庄, 六家两两互比
        var bankerTxt = "血战无庄";
        var minBean = Number(confObj.min_bean) || 0;
        //底分/局数填到所有名为c(或C)的直子节点(模板里有新旧两个c,都填,由场景决定留哪个)
        for(var ci = 0; ci < card.children.length; ++ci){
            var cch = card.children[ci];
            if(cch.name !== "c" && cch.name !== "C"){ continue; }
            var cl = cch.getComponent(cc.Label);
            if(cl){ cl.string = "底分" + (df != null ? df : "-") + "  局数" + (js != null ? js : "-"); }
        }
        //入场/离场豆豆:只有宝宝玩法有(其它玩法是固定人数玩法,卡片只显示底分/局数)
        var caN = card.getChildByName("ca");
        if(caN){
            var isBbCard = String(t.game_type || confObj.type || "").indexOf("baobao") === 0;
            caN.active = isBbCard;
            if(isBbCard){
                var caLab = caN.getComponent(cc.Label);
                if(caLab){ caLab.string = "入场：" + minBean + "，离场：" + (Number(confObj.kick_bean) || 0); }
            }
        }
        //清空按钮(仅俱乐部创建者可见,服务端club_tables下发can_clear标记):解散牌桌绑定房间并踢出所有玩家
        var btnClear = card.getChildByName("btnClear");
        if(btnClear){
            btnClear.active = !!t.can_clear;
            if(t.can_clear){
                btnClear.off(cc.Node.EventType.TOUCH_END);
                btnClear.on(cc.Node.EventType.TOUCH_END,function(ev){
                    ev.stopPropagation(); //阻止冒泡触发卡片进桌点击
                    if(self._clubTablesScrollMoved){ self._clubTablesScrollMoved = false; return; }
                    self._clubClearTable(t);
                });
            }
        }
        //点击进桌(拖动滚动时不触发)
        card.on(cc.Node.EventType.TOUCH_END,function(){
            if(self._clubTablesScrollMoved){ self._clubTablesScrollMoved = false; return; }
            self._clubEnterTable(t);
        });
        return card;
    },

    //确认弹窗(复用场景内已有alert节点:标题/内容/确定/取消,不动态创建节点不写场景文件)
    _clubShowConfirm:function(title,content,onok){
        var alertNode = cc.find("Canvas/alert");
        if(!alertNode){
            if(onok){ onok(); }
            return;
        }
        var self = this;
        if(!this._clubAlertBound){
            this._clubAlertBound = true;
            var okBtn = alertNode.getChildByName("btn_ok");
            var cancelBtn = alertNode.getChildByName("btn_cancel");
            if(okBtn){
                okBtn.on(cc.Node.EventType.TOUCH_END,function(){
                    alertNode.active = false;
                    var f = self._clubAlertOk; self._clubAlertOk = null;
                    if(f){ f(); }
                });
            }
            if(cancelBtn){
                cancelBtn.on(cc.Node.EventType.TOUCH_END,function(){
                    alertNode.active = false;
                    self._clubAlertOk = null;
                });
            }
        }
        var tLb = cc.find("Canvas/alert/title");
        var cLb = cc.find("Canvas/alert/content");
        if(tLb){ tLb = tLb.getComponent(cc.Label); if(tLb){ tLb.string = title; } }
        if(cLb){ cLb = cLb.getComponent(cc.Label); if(cLb){ cLb.string = content; } }
        this._clubAlertOk = onok;
        //弹窗固定显示场景内的两个按钮,不隐藏不挪位
        alertNode.active = true;
    },

    //保险柜弹窗:节点固化在 club.fire(Canvas/safeWin),这里只取引用 + 绑按钮
    _openSafeWin:function(){
        var self = this;
        var win = this._safeWin;
        if(!win || !cc.isValid(win)){
            var canvas = cc.find("Canvas");
            win = canvas ? canvas.getChildByName("safeWin") : null;
        }
        if(!win){
            console.warn("[club] 场景缺少 Canvas/safeWin, 保险柜弹窗无法打开");
            return;
        }
        this._safeWin = win;
        win.active = true;
        var panel = win.getChildByName("panel") || win;
        var gemsNode = panel.getChildByName("gemsLb");
        var safeNode = panel.getChildByName("safeLb");
        this._safeGemsLb = gemsNode ? gemsNode.getComponent(cc.Label) : null;
        this._safeSafeLb = safeNode ? safeNode.getComponent(cc.Label) : null;
        var amtNode = panel.getChildByName("amount");
        this._safeAmountEb = amtNode ? amtNode.getComponent(cc.EditBox) : null;
        if(this._safeAmountEb){ this._safeAmountEb.string = ""; }
        //按钮只绑一次(场景节点常驻, 重复on会叠加)
        if(!this._safeBound){
            this._safeBound = true;
            var bindTouch = function(n, fn){
                if(!n){ return; }
                n.off(cc.Node.EventType.TOUCH_END);
                n.on(cc.Node.EventType.TOUCH_END, fn);
            };
            bindTouch(panel.getChildByName("depBtn"), function(){
                var amt = self._safeAmountEb ? parseInt(self._safeAmountEb.string) : NaN;
                if(!isFinite(amt) || amt <= 0){ cc.vv.wc.showError("请输入有效金额"); return; }
                self._safeDoTransfer(amt);
            });
            bindTouch(panel.getChildByName("wdBtn"), function(){
                var amt = self._safeAmountEb ? parseInt(self._safeAmountEb.string) : NaN;
                if(!isFinite(amt) || amt <= 0){ cc.vv.wc.showError("请输入有效金额"); return; }
                self._safeDoTransfer(-amt);
            });
            bindTouch(panel.getChildByName("closeBtn"), function(){
                self._hideSafeWin();
            });
        }
        this._safeRefreshInfo();
    },

    //关闭保险柜弹窗(场景节点常驻, 只隐藏不销毁)
    _hideSafeWin:function(){
        if(this._safeWin && cc.isValid(this._safeWin)){ this._safeWin.active = false; }
    },

    //刷新保险柜余额显示
    _safeRefreshInfo:function(){
        var self = this;
        cc.vv.http.sendRequest("/safe_info",{account:cc.vv.userMgr.account,sign:cc.vv.userMgr.sign},function(ret){
            if(ret && ret.errcode === 0){
                cc.vv.userMgr.gems = Number(ret.gems) || 0;
                cc.vv.userMgr.safe_beans = Number(ret.safe_beans) || 0;
                if(self._safeGemsLb){ self._safeGemsLb.string = "宝宝豆: " + cc.vv.userMgr.gems; }
                if(self._safeSafeLb){ self._safeSafeLb.string = "保险柜: " + cc.vv.userMgr.safe_beans; }
                //同步顶部clubGems显示
                var gn = self._clubGemsNode;
                if(cc.isValid(gn)){
                    var gl = gn.getComponent(cc.Label);
                    if(gl){ gl.string = String(cc.vv.userMgr.gems); }
                }
                self._gemsCache = {gems:cc.vv.userMgr.gems,at:Date.now()};
            }
        },cc.vv.http.master_url);
    },
    //执行存取:amount>0存入,<0取出
    _safeDoTransfer:function(amount){
        var self = this;
        cc.vv.wc.show("正在处理...");
        cc.vv.http.sendRequest("/safe_transfer",{account:cc.vv.userMgr.account,sign:cc.vv.userMgr.sign,amount:amount},function(ret){
            cc.vv.wc.hide();
            if(ret && ret.errcode === 0){
                cc.vv.userMgr.gems = Number(ret.gems) || 0;
                cc.vv.userMgr.safe_beans = Number(ret.safe_beans) || 0;
                if(self._safeGemsLb){ self._safeGemsLb.string = "宝宝豆: " + cc.vv.userMgr.gems; }
                if(self._safeSafeLb){ self._safeSafeLb.string = "保险柜: " + cc.vv.userMgr.safe_beans; }
                //同步顶部clubGems显示
                var gn = self._clubGemsNode;
                if(cc.isValid(gn)){
                    var gl = gn.getComponent(cc.Label);
                    if(gl){ gl.string = String(cc.vv.userMgr.gems); }
                }
                self._gemsCache = {gems:cc.vv.userMgr.gems,at:Date.now()};
                if(self._safeAmountEb){ self._safeAmountEb.string = ""; }
            }
            else{
                cc.vv.wc.showError((ret && ret.errmsg) ? ret.errmsg : "操作失败");
            }
        },cc.vv.http.master_url);
    },

    //清空牌桌(仅俱乐部创建者):解散牌桌绑定的房间、踢出所有玩家并彻底释放房间占用,
    //清空后被释放的玩家可自由进入其它房间
    _clubClearTable:function(t){
        var self = this;
        this._clubShowConfirm("清空牌桌","确定清空「" + (t.name || "") + "」?将解散房间并踢出所有玩家",function(){
            cc.vv.wc.show("正在清空牌桌");
            cc.vv.http.sendRequest("/club_clear_table",{
                account:cc.vv.userMgr.account,
                sign:cc.vv.userMgr.sign,
                tableid:t.id
            },function(ret){
                cc.vv.wc.hide();
                if(ret.errcode !== 0){
                    cc.vv.wc.showError(ret.errmsg || "清空失败");
                    return;
                }
                self._clubTablesSig = null; //强制重建列表
                self._clubLoadTables();
            });
        });
    },

    //删除牌桌(仅俱乐部创建者;确认后调用服务端删除,牌桌使用中服务端会拒绝)
    _clubDelTable:function(t){
        var self = this;
        this._clubShowConfirm("删除牌桌","确定删除「" + (t.name || "") + "」?删除后不可恢复",function(){
            cc.vv.wc.show("正在删除牌桌");
            cc.vv.http.sendRequest("/club_del_table",{
                account:cc.vv.userMgr.account,
                sign:cc.vv.userMgr.sign,
                clubid:self._clubCur.id,
                tableid:t.id
            },function(ret){
                cc.vv.wc.hide();
                if(!ret || ret.errcode !== 0){
                    var msg = (ret && ret.errmsg) ? ret.errmsg : "删除牌桌失败";
                    if(ret && ret.errcode === 4){ msg = "只有俱乐部创建者可以删除牌桌"; }
                    else if(ret && ret.errcode === 6){ msg = "牌桌正在使用中,无法删除"; }
                    cc.vv.wc.showError(msg);
                    return;
                }
                cc.vv.wc.showError("删除成功");
                self._clubTablesSig = null; //强制重建列表
                self._clubLoadTables();
            });
        });
    },

    //给节点赋图集帧(原textures散图已并入: male/椅子/牌桌在club_ui, female在hall_ui):CUSTOM模式防止节点被图片原始尺寸撑大,加载完成后恢复目标尺寸
    _clubApplyFrame:function(node,texKey){
        if(!node || !cc.isValid(node)){ return; }
        var sp = node.getComponent(cc.Sprite);
        if(!sp){ sp = node.addComponent(cc.Sprite); }
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        //宝宝牌六座牌桌图集(clud_pz):texKey= "bbt_男上左" 之类,按帧名直接取图
        if(texKey.indexOf("bbt_") === 0){
            this._loadAtlasFrame("images/bbtable/clud_pz", texKey.substring(4) + ".png", function(f){
                if(!f || !cc.isValid(node)){ return; }
                var sp2 = node.getComponent(cc.Sprite);
                if(sp2){
                    sp2.sizeMode = cc.Sprite.SizeMode.CUSTOM; //尺寸沿用场景里配置的节点尺寸
                    sp2.spriteFrame = f;
                }
            });
            return;
        }
        //女性人物图不在任何图集里(hall_ui/club_ui均无club_female帧,原路径为死代码),
        //以散图放在resources/images/club/下直接按SpriteFrame加载
        if(texKey.indexOf("club_female") === 0){
            cc.resources.load("images/club/" + texKey, cc.SpriteFrame, function(err, f){
                if(err || !f || !cc.isValid(node)){ return; }
                var sp2 = node.getComponent(cc.Sprite);
                if(sp2){
                    sp2.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                    sp2.spriteFrame = f;
                }
            });
            return;
        }
        this._loadAtlasFrame("images/atlas/club_ui", texKey + ".png", function(f){
            if(!f || !cc.isValid(node)){ return; }
            var sp2 = node.getComponent(cc.Sprite);
            if(sp2){
                sp2.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                sp2.spriteFrame = f;
            }
        });
    },

    //设置牌桌座位:uid>0显示头像与昵称,0=恢复空位(座位人物图已从场景移除)
    _clubSetSeat:function(slotNode,uid,name){
        if(!slotNode || !cc.isValid(slotNode)){ return; }
        uid = uid || 0;
        name = name || "";
        //座位昵称:场景里每个座位下的name节点,有人显示/空位隐藏,样式全由场景控制
        var nameN = slotNode.getChildByName("name");
        if(nameN){
            nameN.active = uid > 0;
            var nameLb = nameN.getComponent(cc.Label);
            if(nameLb){ nameLb.string = name; }
        }
        //同一玩家也要继续往下走: 头像/名字可能在别处改过, 交给 ImageLoader 比对头像地址后再决定要不要换图
        slotNode._uid = uid;
        slotNode._seatName = name;
        var head = slotNode.getChildByName("head");      //头顶圆形头像(位置在场景里调)
        if(!head){ return; }
        if(uid <= 0){
            head.active = false;
            return;
        }
        var self = this;
        var apply = function(info){
            //头顶头像:仅填数据,布局全在场景里
            if(head && cc.isValid(head)){
                head.active = true;
                var img = head.getChildByName("img");
                if(img){
                    var spr = img.getComponent(cc.Sprite);
                    var il = img.getComponent("ImageLoader");
                    //同一个人且头像已加载: 保持现有头像, 不重复贴默认图(否则每次刷新都会闪)
                    var sameUser = !!(il && il._userid === ("" + uid) && il._spriteFrame);
                    //换人时先显示默认头像,真实头像加载完成后由ImageLoader覆盖
                    if(spr && !sameUser){
                        if(self._clubHeadFrame){
                            spr.spriteFrame = self._clubHeadFrame;
                        }
                        else{
                            cc.resources.load("images/other/head", cc.SpriteFrame, function(err, f){
                                if(!err && f){
                                    self._clubHeadFrame = f;
                                    if(cc.isValid(spr) && !(il && il._spriteFrame)){ spr.spriteFrame = f; }
                                }
                            });
                        }
                    }
                    if(il){ il.setUserID(uid); }
                }
            }
        };
        //缓存5分钟内直接复用, 过期重新拉一次(玩家换头像/改名能同步)
        var cachedInfo = cc.vv.baseInfoMap && cc.vv.baseInfoMap[uid];
        if(cachedInfo != null && cachedInfo.sex != null && (Date.now() - (cachedInfo.ts || 0) < 5 * 60 * 1000)){
            apply(cachedInfo);
            return;
        }
        //性别走账号服/base_info(含sex),结果进baseInfoMap缓存
        cc.vv.http.sendRequest("/base_info",{userid:uid},function(ret){
            if(!ret || ret.errcode){ apply(null); return; } //失败不写缓存, 避免把空信息/错误头像缓存给该玩家
            //与 ImageLoader 保持同一种缓存格式: 内置头像存 localKey, 远程头像存 url
            var key = ret.headimgurl || null;
            var isLocal = key && /^avatar_\d{1,3}$/.test(key);
            var info = {
                name:ret.name || "",
                sex:ret.sex,
                localKey:isLocal ? key : null,
                url:(key && !isLocal) ? key + ".jpg" : null,
                ts:Date.now()
            };
            if(cc.vv.baseInfoMap == null){ cc.vv.baseInfoMap = {}; }
            cc.vv.baseInfoMap[uid] = info;
            apply(info);
        },cc.vv.http.master_url);
    },

    //牌桌列表: 打开时拉一次 + 游戏服长连接推送 + 5秒兜底轮询(推送断开也能刷新座位/头像)
    //说明:俱乐部场景下 cc.vv.net 并未建立连接,故这里单独向游戏服建立一条轻量订阅连接(句柄独立于 cc.vv.net)
    _clubStartTableWatch:function(){
        if(!this._clubCur || !this._clubCur.id){ return; }
        this._clubSubConnect(this._clubCur.id);
        this._clubStartTablePoll(); //推送不可达(原生端弱网/订阅失败)时的兜底轮询
    },

    _clubStopTableWatch:function(){
        this._clubSubStop();
        this._clubStopTablePoll();
    },

    //兜底轮询:5秒拉一次牌桌列表(签名比对,数据无变化不重建,不会抖动),
    //保证玩家进房后大厅牌桌座位人物/头像一定能刷新出来,不单纯依赖长连接推送
    _clubStartTablePoll:function(){
        if(this._clubTablePollTimer){ return; }
        var self = this;
        this._clubTablePollTimer = setInterval(function(){
            if(!cc.isValid(self.node) || self._clubState !== "detail"){
                self._clubStopTablePoll();
                return;
            }
            self._clubLoadTables();
        },5000);
    },

    _clubStopTablePoll:function(){
        if(this._clubTablePollTimer){ clearInterval(this._clubTablePollTimer); this._clubTablePollTimer = null; }
    },

    //建立/复用俱乐部订阅连接:同俱乐部只刷新玩法参数,切换俱乐部先断开旧连接
    _clubSubConnect:function(clubId){
        var self = this;
        if(!(clubId > 0)){ return; }
        if(this._clubSubSio && this._clubSubClubId === clubId){
            this._clubSubEmit();
            return;
        }
        this._clubSubStop();
        this._clubSubClubId = clubId;
        //向大厅服询问游戏服socket地址(地址来自服务端配置,客户端不硬编码)
        cc.vv.http.sendRequest("/club_subscribe_info",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:clubId
        },function(ret){
            if(ret == null || ret.errcode !== 0 || !ret.ip || !ret.port){
                console.log("[俱乐部订阅]获取游戏服地址失败,静默降级为HTTP拉取");
                return;
            }
            if(self._clubSubClubId !== clubId){ return; } //期间已切换/离开
            self._clubSubOpen(ret.ip + ":" + ret.port);
        });
    },

    //实际建立订阅连接(独立于 cc.vv.net 的局部句柄,连接失败不打断用户,静默降级)
    _clubSubOpen:function(addr){
        var self = this;
        if(typeof window === "undefined" || window.io == null){ return; }
        var opts = {
            'reconnection':true,
            'reconnectionDelay':3000,
            'force new connection': true,
            'transports':['websocket', 'polling']
        };
        var sio = null;
        try{
            sio = window.io.connect(addr,opts);
        }catch(e){
            console.log("[俱乐部订阅]连接异常:" + (e && e.message));
            return;
        }
        this._clubSubSio = sio;
        sio.on('connect',function(){ self._clubSubEmit(); });   //(重)连接成功后重新订阅
        sio.on('connect_error',function(){ /*静默降级*/ });
        sio.on('club_update',function(data){ self._clubSubOnUpdate(data); });
    },

    //发送订阅请求(携带当前俱乐部与玩法)
    _clubSubEmit:function(){
        var sio = this._clubSubSio;
        if(!sio || !this._clubSubClubId){ return; }
        var gameType = (this._clubCurGame && this._clubCurGame.game_type) ? this._clubCurGame.game_type : null;
        sio.emit('club_subscribe',{clubid:this._clubSubClubId,game_type:gameType});
    },

    //收到服务端推送:仅当俱乐部详情页可见时刷新桌面列表
    //推送处理:优先按payload增量刷新对应牌桌的头像(避免整表重建抖动),无法增量时回退整表刷新
    _clubSubOnUpdate:function(data){
        console.log("[俱乐部推送]",JSON.stringify(data));
        if(!this._clubPanel || !this._clubPanel.active){ return; }
        if(this._clubState !== "detail" || !this._clubCurGame){ return; }
        //定位卡片:优先按推送里的牌桌id(房间conf带入,不依赖DB),旧房间兜底按roomid
        var findCard = function(map,d){
            if(!map || !d){ return null; }
            if(d.tableid != null && map[d.tableid]){ return map[d.tableid]; }
            if(d.roomid && map["r_" + d.roomid]){ return map["r_" + d.roomid]; }
            return null;
        };
        //房间已空(玩家全部退出/房间解散):直接用推送数据清空该桌座位,不依赖DB回查——
        //服务端推送早于异步写库完成,此时拉 /club_tables 会读回旧数据(还是退出前的占位),列表表现为"退出后不更新"
        if(data && (data.player_count === 0 || (data.seats && data.seats.length === 0))){
            var ent0 = findCard(this._clubTableCardMap,data);
            if(ent0){
                for(var k0 = 0; k0 < ent0.slots.length; ++k0){
                    this._clubSetSeat(ent0.slots[k0],0);
                }
                if(ent0.uids){
                    for(var u0 = 0; u0 < ent0.uids.length; ++u0){ ent0.uids[u0] = 0; }
                }
                if(data.roomid){ delete this._clubTableCardMap["r_" + data.roomid]; }
            }
            //签名置空:后续任何拉取都强制按DB最终态重建一次,保证与本地清空后的显示对齐
            this._clubTablesSig = null;
            this._clubLoadTables();
            return;
        }
        var ent = findCard(this._clubTableCardMap,data);
        if(ent){
            var seats = data.seats || [];
            var uids = [0,0,0,0,0,0]; //下标=显示位
            var uidNames2 = this._clubUidNames || (this._clubUidNames = {});
            for(var j = 0; j < seats.length; ++j){
                var si = seats[j].seatindex;
                //推送带昵称:新进玩家在列表接口数据里没有,直接进缓存,不再依赖列表刷新
                var puid = seats[j].userid || 0;
                if(puid > 0 && seats[j].name){ uidNames2[puid] = seats[j].name; }
                //房间座位号按map换算成显示位,否则2人桌的第二个玩家会落到隐藏座位(seat1)上
                var slot = (ent.map && si >= 0 && si < ent.map.length) ? ent.map[si] : si;
                if(slot >= 0 && slot < uids.length){ uids[slot] = puid; }
            }
            for(var k = 0; k < ent.slots.length; ++k){
                this._clubSetSeat(ent.slots[k],uids[k],uidNames2[uids[k]] || "");
            }
            return;
        }
        //未定位到卡片(旧房间无tableid/打开列表后才绑定的房间):整表重拉,DB异步写库有延迟,补拉兜底
        this._clubLoadTablesRetry(3);
    },

    //整表重拉+最多补拉n次(间隔0.8秒):等DB写完,签名变化后自动重建,不再丢落座显示
    _clubLoadTablesRetry:function(n){
        if(!cc.isValid(this.node)){ return; }
        var self = this;
        this._clubLoadTables();
        if(n > 0){
            setTimeout(function(){
                if(cc.isValid(self.node) && self._clubState === "detail"){ self._clubLoadTablesRetry(n - 1); }
            },800);
        }
    },

    //断开订阅连接并移除监听,避免句柄泄漏
    _clubSubStop:function(){
        var sio = this._clubSubSio;
        if(sio){
            try{
                if(sio.off){ sio.off('club_update'); }
                sio.disconnect();
            }catch(e){}
        }
        this._clubSubSio = null;
        this._clubSubClubId = null;
    },

    //加载当前玩法下的桌面列表(数据无变化时不重建节点,避免抖动);「全部」时不传game_type,服务端返回所有玩法桌面
    _clubLoadTables:function(){
        this._clubStartTableWatch();
        var self = this;
        //大厅模式:拉全平台汇总牌桌(不需要clubid);普通模式仍按当前俱乐部拉
        var isHall = !!(this._clubCur && this._clubCur._hall);
        var reqData = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign
        };
        if(!isHall){ reqData.clubid = this._clubCur.id; }
        var gt = this._clubCurGame && this._clubCurGame.game_type;
        if(gt){ reqData.game_type = gt; } //「全部」伪玩法行game_type为空,不传字段
        cc.vv.http.sendRequest(isHall ? "/club_tables_hall" : "/club_tables",reqData,function(ret){
            if(ret.errcode !== 0){
                cc.vv.wc.showError(ret.errmsg || "获取桌面失败");
                return;
            }
            var tables = ret.tables || [];
            self._clubTableList = tables; //留存最新桌面列表,快速加入用
            //整场结算弹窗点了「快速加入」: 列表一回来就自动挑第一张未满桌进入
            self._clubMaybeQuickJoin(tables);
            //展开条目点了某个牌桌名: 右侧只显示该名称的牌桌
            var viewTables = tables;
            var chipKey = self._clubChipName;
            if(chipKey){
                viewTables = tables.filter(function(t){
                    var nm = String(t.name == null ? "" : t.name).replace(/^\s+|\s+$/g,"");
                    return chipKey.charAt(0) === "#" ? ("#" + t.id) === chipKey : nm === chipKey;
                });
            }
            //签名比对:桌面数据未变化则跳过重建,消除刷新造成的列表抖动(玩家ID也纳入,头像变化触发重建)
            var sig = "chip:" + (chipKey || "") + ";";
            for(var i = 0; i < viewTables.length; ++i){
                sig += (viewTables[i].id || "") + ":" + (viewTables[i].player_count || 0) + ":"
                    + (viewTables[i].user_id0 || 0) + "," + (viewTables[i].user_id1 || 0) + ","
                    + (viewTables[i].user_id2 || 0) + "," + (viewTables[i].user_id3 || 0) + ","
                    + (viewTables[i].user_id4 || 0) + "," + (viewTables[i].user_id5 || 0) + ",";
            }
            if(sig === self._clubTablesSig && self._clubTablesNode && self._clubTablesNode.childrenCount > 0){
                return;
            }
            self._clubTablesSig = sig;
            self._clubTableCardMap = {}; //整表重建前清空卡片映射
            //容器引用丢失时从场景根重新找(tablesView>tables为固化结构)
            if(!self._clubTablesNode || !cc.isValid(self._clubTablesNode)){
                var tv = self._clubFind(cc.find("Canvas"),"tablesView");
                self._clubTablesNode = tv ? tv.getChildByName("tables") : null;
                if(!self._clubTablesNode){ console.log("[俱乐部]tables容器缺失,无法渲染牌桌列表"); return; }
            }
            //先取场景模板(克隆源),再清空列表;模板本身隐藏,不显示成一张卡片
            var tpl = self._clubCardTpl();
            if(tpl){ tpl.active = false; }
            self._clubTablesNode.removeAllChildren();
            //两行排列/间距全部由tables节点上的cc.Layout组件控制(场景里调),JS不写位置;
            //只按列数撑开容器宽度,供超出tablesView后左右拖动(容器高度固定530由场景控制,两行排满后往右换列)
            var viewW = self._clubTablesNode.parent.width;
            var cardW = tpl ? tpl.width : 360;
            var cols = Math.max(1, Math.ceil(viewTables.length / 2));
            self._clubTablesNode.width = Math.max(viewW, cols * (cardW + 5) + 5);
            if(viewTables.length == 0){
                self._clubRenderTableChips();
                self._clubAddRow(self._clubTablesNode,0,"暂无桌面(管理员后台添加)","",null,520);
                return;
            }
            viewTables.forEach(function(t,i){
                self._clubAddTableCard(self._clubTablesNode,i,t);
            });
            self._clubRenderTableChips();
        });
    },

    //整场结算弹窗「快速回入」: 回俱乐部后直接进第一张同玩法且未满桌的牌桌(cc.vv.autoQuickJoin 由 BBGame 置位)
    _clubMaybeQuickJoin:function(tables){
        if(!cc.vv.autoQuickJoin || !tables || !tables.length) return;
        var opt = cc.vv.autoQuickJoin;
        cc.vv.autoQuickJoin = null;
        var wantType = (typeof opt === "object") ? (opt.gameType || null) : null; //只进和上一局同玩法的房间
        var self = this;
        var pick = null;
        for(var i = 0; i < tables.length; ++i){
            var t = tables[i];
            if(wantType){
                var gt = t.game_type || t.type;
                if(gt && gt != wantType){ continue; }
            }
            var cnt = Number(t.player_count) || 0;
            if(cnt < this._clubMaxPlayers(t)){ pick = t; break; }
        }
        if(!pick) return;
        console.log("[club] 快速加入: 自动进入未满桌 " + (pick.name || pick.id || ""));
        setTimeout(function(){ if(cc.vv && self._clubEnterTable) self._clubEnterTable(pick); }, 300);
    },

    //点击桌面进入游戏(服务端复用未满房间或自动建房)
    _clubEnterTable:function(t){
        var self = this;
        var wc = cc.vv.wc;
        //前置校验:宝宝豆为0不能进房间(具体最低宝宝豆由服务端牌桌配置校验,不足时回包提示)
        var now = Date.now();
        var cached = this._gemsCache;
        var checkAndEnter = function(gems){
            self._gemsCache = {gems:gems,at:Date.now()};
            if(!(gems > 0)){
                wc.hide(); //收起等待遮罩,避免遮挡弹窗
                self._clubShowConfirm("提示","宝宝豆不足，无法进入桌面",null); //弹窗提示,需点击确定关闭
                return;
            }
            self._doEnterTable(t);
        };
        if(cached && now - cached.at < 5000){
            checkAndEnter(cached.gems);
            return;
        }
        wc.show("正在进入「" + t.name + "」");
        //get_user_status走账号服(hall_url),返回{gems:真实余额}
        cc.vv.http.sendRequest("/get_user_status",{account:cc.vv.userMgr.account,sign:cc.vv.userMgr.sign},function(ret){
            var gems = (ret && ret.gems != null) ? Number(ret.gems) : 0;
            checkAndEnter(gems);
        });
    },

    _doEnterTable:function(t){
        var self = this;
        var wc = cc.vv.wc;
        wc.show("正在进入「" + t.name + "」");
        console.log("[进入房间]请求桌面 tableid=" + t.id + " name=" + t.name);
        //看门狗:12秒内若仍未进入游戏场景,则隐藏遮罩并给出可见原因,避免永久卡住
        var guard = setTimeout(function(){
            if(cc.vv.wc !== wc){ return; }
            wc.showError("进入房间失败,请重试(服务未响应)");
        },12000);
        cc.vv.http.sendRequest("/club_enter_table",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            tableid:t.id
        },function(ret){
            try{
                if(ret == null || ret.errcode !== 0){
                    console.log("[进入房间]失败:" + (ret ? ret.errcode + " " + ret.errmsg : "无响应"));
                    clearTimeout(guard);
                    //宝宝豆不足(2222)弹窗提示,需点击确定关闭;其他失败仍用3秒文字提示
                    if(ret && ret.errcode == 2222){
                        wc.hide();
                        self._clubShowConfirm("提示",(ret.errmsg || "宝宝豆不足，无法进入桌面"),null);
                    }else{
                        wc.showError((ret && ret.errmsg) ? ret.errmsg : "进入桌面失败");
                    }
                    return;
                }
                console.log("[进入房间]成功 roomid=" + ret.roomid + " ip=" + ret.ip + ":" + ret.port);
                clearTimeout(guard);
                if(self._clubPanel){ self._clubPanel.active = false; }
                self._clubStopTableWatch(); //离开俱乐部页进入牌桌:断开订阅连接,避免句柄泄漏
                cc.vv.fromClub = true; //标记本次进桌来自俱乐部,游戏结束回俱乐部场景后直达详情页
                if(self._clubCur && self._clubCur._hall){
                    //总大厅:记住桌子所属俱乐部,退出后仍回总大厅
                    cc.vv.fromClubId = Number(t.club_id) || 0;
                }
                else{
                    cc.vv.fromClubId = self._clubCur ? self._clubCur.id : null; //记住来源俱乐部,回俱乐部场景直达它的玩法详情页
                }
                cc.vv.gameNetMgr.connectGameServer(ret);
            }catch(e){
                console.log("[进入房间]异常:" + (e && e.message));
                clearTimeout(guard);
                wc.showError("进入房间异常:" + (e && e.message));
            }
        });
    },

    //关闭俱乐部页:独立场景下即返回大厅场景
    _clubClosePanel:function(){
        this._clubStopTableWatch();
        if(cc.vv.sceneMgr){
            cc.vv.sceneMgr.load("hall");
        }else{
            cc.director.loadScene("hall");
        }
    },

    onDestroy:function(){
        this._clubStopTableWatch();
    },

});
