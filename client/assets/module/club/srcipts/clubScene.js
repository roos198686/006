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
        var clubPage = canvas.getChildByName("clubPage");
        var wfPage = canvas.getChildByName("wfPage");
        if(cc.vv.fromClubId){
            //从牌桌退出/结算返回:直接进入该俱乐部的独立玩法详情页(原玩法页面),
            //中途不显示俱乐部列表,避免"先闪一下列表再切详情"的页面跳动
            if(clubPage){ clubPage.active = false; }
            if(wfPage){ wfPage.active = false; }
            this._clubBackToDetail(cc.vv.fromClubId);
        }
        else{
            if(clubPage){ clubPage.active = true; } //进入场景默认显示俱乐部页
            if(wfPage){ wfPage.active = false; } //玩法详情页初始隐藏
            //顶部三按钮(我的俱乐部/创建/加入)贴图已固化在场景文件中(俱乐部-我的/创建/加入),JS不再动态加载或替换
            this.openClubPanel(); //打开俱乐部页(列表默认收起)
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

    //宽屏下把弹窗暗色遮罩拉伸到实际可见区(原生遮罩只有1280x720)
    _clubStretchPopupDim:function(win){
        if(!win){ return; }
        var dim = win.getChildByName("New Layout");
        if(dim){
            var vs = cc.view.getVisibleSize();
            dim.setContentSize(vs.width, vs.height);
            dim.setPosition(0, 0);
        }
    },

    //按当前可见区布局俱乐部页面(构建与打开时调用,适配窗口尺寸)
    _clubLayoutPage:function(){
        var page = this._clubPanel;
        if(!page){ return; }
        var vs = cc.view.getVisibleSize();
        var vo = cc.view.getVisibleOrigin();
        page.setContentSize(vs.width, vs.height);
        page.setPosition(page.parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width/2, vo.y + vs.height/2)));
        if(this._clubPageBg){
            this._clubPageBg.setContentSize(vs.width, vs.height);
            this._clubPageBg.setPosition(0,0);
        }
        if(this._clubMask){ this._clubMask.setContentSize(vs.width, vs.height); }
        //按钮位置已在场景编辑器中排好,代码不再强制重排,仅保留背景/遮罩的全屏拉伸
        //listArea列表区同样使用场景里排好的节点与尺寸,代码不再强制调整
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
            sp.spriteFrame = f;
            sp.node.setContentSize(row.width, row.height); //赋图后强制恢复行尺寸
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
                    //保留gameRowTpl模板、emptyTip提示、samptext标题图(场景固化,按钮上方的"玩法列表"标签),只清动态克隆的行
                    var grt = games.getChildByName("gameRowTpl");
                    var get = games.getChildByName("emptyTip");
                    var gst = games.getChildByName("samptext");
                    games.removeAllChildren();
                    if(gst){ games.addChild(gst); }
                    if(grt){ games.addChild(grt); }
                    if(get){ games.addChild(get); get.active = false; }
                }
                var tv = this._clubFind(this._clubListArea,"tablesView");
                var tables = tv ? tv.getChildByName("tables") : null;
                if(tables){ tables.removeAllChildren(); }
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
        var ROW_H = rowTpl ? rowTpl.height : 68;
        var ROW_GAP = ROW_H + 5;
        var topY = content.height/2 - ROW_H/2;
        clubs.forEach(function(c,i){
            var row = rowTpl ? cc.instantiate(rowTpl) : new cc.Node("row"+i);
            row.active = true;
            row.setPosition(0, topY - i * ROW_GAP);
            content.addChild(row);
            var nameLbl = row.getChildByName("name");
            if(nameLbl){ var nl = nameLbl.getComponent(cc.Label); if(nl){ nl.string = c.name || ""; } }
            var subLbl = row.getChildByName("sub");
            if(subLbl){ var sl = subLbl.getComponent(cc.Label); if(sl){ sl.string = (c.member_count || 0) + "人"; } }
            row.on(cc.Node.EventType.TOUCH_END,function(){
                if(self._clubScrollMoved){ self._clubScrollMoved = false; return; }
                self._wfOpenDetail(c);
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
                //新加入成功:关闭弹窗,刷新列表,进入俱乐部
                if(self._clubJoinWin){ self._clubJoinWin.active = false; }
                cc.vv.wc.showError("已加入俱乐部「" + ret.name + "」");
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
            var club = null;
            for(var i = 0; i < self._myClubs.length; i++){
                if(self._myClubs[i].id == clubid){ club = self._myClubs[i]; break; } //id可能number/string混用,宽松比较防止===类型不一致匹配失败回落列表页
            }
            if(club){ self._wfOpenDetail(club); } //直达独立玩法详情页
            else{ self.openClubPanel(); } //俱乐部不存在了,兜底回俱乐部页
        });
    },

    //打开独立玩法详情页:整页独立节点(点俱乐部/牌桌返回都走这里)
    _wfOpenDetail:function(club){
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
            this._clubOpenDetail(club); //复用原详情渲染(左玩法右牌桌),全部画到独立页上
            this._wfBindAddTable(club); //左下角添加牌桌按钮+弹窗(场景固化节点,只绑事件)
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
        this._admHideWins();
        if(this._admPanel && cc.isValid(this._admPanel)){ this._admPanel.active = false; }
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
        var mgr = page.getChildByName("glSprite");
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
    },

    //管理面板内节点查找:先按层级找,找不到再在admin子树里递归兜底(编辑器里拖到别的位置也不会失效)
    _admNode:function(name){
        var adm = this._admPanel;
        if(!adm){ return null; }
        var all = adm.getChildByName("AllLayout");
        var n = all ? all.getChildByName(name) : null;
        if(n){ return n; }
        n = adm.getChildByName(name);
        return n || this._clubFind(adm, name);
    },

    //打开管理面板(admin):按钮/弹窗全部是场景节点,JS只绑事件、填文字
    _admOpen:function(){
        var self = this;
        var canvas = cc.find("Canvas");
        var adm = canvas ? canvas.getChildByName("admin") : null;
        if(!adm){ cc.vv.wc.showError("管理面板缺失"); return; }
        this._admPanel = adm;
        //管理面板盖住全屏时,把提示层(等待转圈/错误提示/alert弹窗)提到最上层,保证"正在…/提示"可见
        var wcNode = canvas.getChildByName("WaitingConnection");
        if(wcNode){ wcNode.setSiblingIndex(canvas.children.length - 1); }
        var alertNode = canvas.getChildByName("alert");
        if(alertNode){ alertNode.setSiblingIndex(canvas.children.length - 1); }
        //全屏触摸遮罩(场景节点):吞掉触摸,防止点穿到下层;尺寸跟随可见区
        var mask = self._admNode("mask");
        if(mask){
            var mvs = cc.view.getVisibleSize();
            mask.setContentSize(mvs.width, mvs.height);
            mask.setPosition(0,0);
            if(!mask._admBound){
                mask._admBound = true;
                mask.on(cc.Node.EventType.TOUCH_START,function(){});
            }
        }
        adm.active = true;
        if(adm._admBound){ return; }
        adm._admBound = true;
        var btnTable = self._admNode("btnAddTable"); //添加牌桌
        var btnMember = self._admNode("addTablePz"); //添加成员
        var btnBean = self._admNode("btnBean"); //豆豆管理
        var btnClose = self._admNode("btnAdmClose"); //关闭
        if(btnTable){ btnTable.active = true; btnTable.on(cc.Node.EventType.TOUCH_END,function(){ self._wfOpenAddTable(); }); }
        if(btnMember){ btnMember.active = true; btnMember.on(cc.Node.EventType.TOUCH_END,function(){ self._wfOpenPull(); }); }
        if(btnBean){ btnBean.active = true; btnBean.on(cc.Node.EventType.TOUCH_END,function(){ self._admOpenBean(); }); }
        if(btnClose){ btnClose.active = true; btnClose.on(cc.Node.EventType.TOUCH_END,function(){ self._admClose(); }); }
        //添加牌桌弹窗
        var addWin = self._admNode("addTableWin");
        this._admAddWin = addWin;
        if(addWin){ self._admBindOkCancel(addWin,function(){ self._wfSubmitAddTable(); },function(){ self._wfCloseAddTable(); }); }
        //添加成员弹窗
        var memberWin = self._admNode("admMemberWin");
        this._admMemberWin = memberWin;
        if(memberWin){ self._admBindOkCancel(memberWin,function(){ self._wfSubmitPull(); },function(){ self._wfClosePull(); }); }
        //豆豆管理弹窗
        var beanWin = self._admNode("admBeanWin");
        this._admBeanWin = beanWin;
        if(beanWin){
            var bbg = beanWin.getChildByName("bg");
            var q = bbg ? bbg.getChildByName("btnQuery") : null;
            if(q){ q.active = true; q.on(cc.Node.EventType.TOUCH_END,function(){ self._admQueryBean(); }); }
            self._admBindOkCancel(beanWin,function(){ self._admApplyBean(); },function(){ self._wfCloseBean(); });
        }
        //玩法配置弹窗(台数规则,按俱乐部+玩法保存;底分/局数在添加牌桌时输入)
        var btnCfg = self._admNode("btnGameCfg");
        if(btnCfg){ btnCfg.active = true; btnCfg.on(cc.Node.EventType.TOUCH_END,function(){ self._admOpenGameCfg(); }); }
        var cfgWin = self._admNode("gameCfgWin");
        this._admCfgWin = cfgWin;
        if(cfgWin){ self._admBindOkCancel(cfgWin,function(){ self._admCfgSave(); },function(){ self._admCfgClose(); }); }
    },

    _admClose:function(){
        if(this._admPanel && cc.isValid(this._admPanel)){ this._admPanel.active = false; }
        this._admHideWins();
    },

    _admHideWins:function(){
        if(this._admAddWin && cc.isValid(this._admAddWin)){ this._admAddWin.active = false; }
        if(this._admMemberWin && cc.isValid(this._admMemberWin)){ this._admMemberWin.active = false; }
        if(this._admBeanWin && cc.isValid(this._admBeanWin)){ this._admBeanWin.active = false; }
        if(this._admCfgWin && cc.isValid(this._admCfgWin)){ this._admCfgWin.active = false; }
    },

    // ===== 管理面板:玩法配置(底分/局数/台数规则) =====
    //台数规则字段定义(与服务端 key 一致);输入框留空 = 该项按默认值
    _admCfgFields:function(type){
        var t = String(type || "");
        if(t == "baobao_shou"){
            return [
                {key:'banker_mode', label:'有无庄(1有庄/0无庄)'},
                {key:'arrange_timeout', label:'摆牌超时(秒)'},
                {key:'result_timeout', label:'结算倒计时(秒)'},
                {key:'wulong_check', label:'乌龙校验(1开/0关)'},
                {key:'tongdian_mode', label:'同点比较(3/1/2)'},
                {key:'s_bao_14', label:'宝A 倍率'},
                {key:'s_bao_13', label:'宝K 倍率'},
                {key:'s_bao_12', label:'宝Q 倍率'},
                {key:'s_bao_11', label:'宝J 倍率'},
                {key:'s_bao_10', label:'宝10 倍率'},
                {key:'s_bao_9', label:'宝9 倍率'},
                {key:'s_bao_8', label:'宝8 倍率'},
                {key:'s_bao_7', label:'宝7 倍率'},
                {key:'s_bao_6', label:'宝6 倍率'},
                {key:'s_bao_5', label:'宝5 倍率'},
                {key:'s_bao_4', label:'宝4 倍率'},
                {key:'s_bao_3', label:'宝3 倍率'},
                {key:'s_bao_2', label:'宝2 倍率'},
                {key:'s_dian9', label:'9点 倍率'},
                {key:'s_dian8', label:'8点 倍率'},
                {key:'s_dian7', label:'7点 倍率'},
                {key:'s_dianlow', label:'6~0点 倍率'}
            ];
        }
        if(t == "baobao_mian"){
            return [
                {key:'banker_mode', label:'有无庄(1有庄/0无庄)'},
                {key:'arrange_timeout', label:'确认弹窗倒计时(秒)'},
                {key:'result_timeout', label:'结算倒计时(秒)'},
                {key:'m_sf6', label:'6同花顺 倍率'},
                {key:'m_sf5', label:'5同花顺带1 倍率'},
                {key:'m_4', label:'4条带2单 倍率'},
                {key:'m_33', label:'3条带3条 倍率'},
                {key:'m_3p1', label:'3条带对带1 倍率'},
                {key:'m_f6', label:'6同花 倍率'},
                {key:'m_s6', label:'6连顺 倍率'},
                {key:'m_f5', label:'5同花带1 倍率'},
                {key:'m_s5', label:'5连顺带1 倍率'},
                {key:'m_p3', label:'3对 倍率'},
                {key:'m_n9', label:'3组9 倍率'},
                {key:'m_san', label:'散牌 倍率'}
            ];
        }
        if(t == "wujin"){
            return [
                {key:'ping_hu', label:'平胡台数'}, {key:'zi_mo', label:'自摸加台'},
                {key:'men_qing', label:'门清加台'}, {key:'peng_peng', label:'碰碰胡台数'},
                {key:'cou_yise', label:'凑一色台数'}, {key:'qing_yise', label:'清一色台数'},
                {key:'qi_dui', label:'七对台数'}, {key:'da_sanyuan', label:'大三元台数'},
                {key:'da_sixi', label:'大四喜台数'}, {key:'ming_gang', label:'明杠台数'},
                {key:'an_gang', label:'暗杠台数'}, {key:'gang_kai', label:'杠上开花台数'},
                {key:'qiang_gang', label:'抢杠胡台数'}, {key:'hai_di', label:'海底捞月台数'},
                {key:'tian_hu', label:'天胡台数'}, {key:'di_hu', label:'地胡台数'},
                {key:'can_chi', label:'允许吃牌(0禁1允)'}, {key:'yi_pao_duo_xiang', label:'一炮多响(0关1开)'},
                {key:'dian_pao_bao', label:'点炮包牌(0不包1包)'}, {key:'chupai_timeout', label:'出牌超时(秒)'}
            ];
        }
        if(t.indexOf("zp") == 0){
            return [
                {key:'hua_tai', label:'每朵花台数'}, {key:'jin_tai', label:'每张金牌台数'},
                {key:'ming_gang', label:'明杠台数'}, {key:'an_gang', label:'暗杠台数'},
                {key:'san_jin_dao', label:'三金倒台数'}, {key:'qiang_jin', label:'抢金台数'},
                {key:'qi_dui', label:'七对台数'}, {key:'hun_yise', label:'混一色台数'},
                {key:'qing_yise', label:'清一色台数'}, {key:'gang_kai', label:'杠上开花台数'},
                {key:'qiang_gang', label:'抢杠胡台数'}, {key:'ping_hu', label:'平胡台数'},
                {key:'you_jin_multi', label:'游金每级倍数'}, {key:'you_jin_max', label:'游金最高级数'},
                {key:'fenbing', label:'分饼开关(0关1开)'}, {key:'chupai_timeout', label:'出牌超时(秒)'}
            ];
        }
        return [
            {key:'min_tai', label:'起胡台数门槛'}, {key:'dong_ke', label:'东风刻(每个)'},
            {key:'zfb_ke', label:'中发白刻(每个)'}, {key:'ping_hu', label:'平胡'},
            {key:'duidui_hu', label:'对对胡'}, {key:'hun_yise', label:'混一色'},
            {key:'qing_yise', label:'清一色'}, {key:'gang_kai', label:'杠上开花'},
            {key:'qiang_gang', label:'抢杠胡'}, {key:'wu_cai', label:'无财'},
            {key:'chupai_timeout', label:'出牌倒计时(秒,0关托管)'}
        ];
    },

    //打开玩法配置:向服务端拉取本俱乐部各玩法的底分/局数/台数规则
    _admOpenGameCfg:function(){
        var self = this;
        var win = this._admCfgWin;
        if(!win){ cc.vv.wc.showAlert("玩法配置弹窗节点缺失,请检查club场景admin下的gameCfgWin", "提示"); return; }
        var bg = win.getChildByName("bg");
        if(!bg){ return; }
        var club = this._clubCur;
        if(!club){ cc.vv.wc.showAlert("请先进入俱乐部详情再配置玩法", "提示"); return; }
        cc.vv.wc.show("正在读取配置");
        cc.vv.http.sendRequest("/club_game_configs",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:club.id
        },function(ret){
            cc.vv.wc.hide();
            if(!ret || ret.errcode !== 0){
                cc.vv.wc.showAlert((ret && ret.errmsg) ? ret.errmsg : "读取配置失败", "提示");
                return;
            }
            self._admCfgList = ret.list || [];
            if(!self._admCfgList.length){ cc.vv.wc.showAlert("该俱乐部暂无玩法", "提示"); return; }
            var keep = null;
            for(var i = 0; i < self._admCfgList.length; ++i){
                if(self._admCfgSel && self._admCfgList[i].game_type == self._admCfgSel.game_type){ keep = self._admCfgList[i]; break; }
            }
            self._admCfgSel = keep || self._admCfgList[0];
            self._admCfgBuildDrop(bg);
            self._admCfgFill(bg);
            self._admStretchWin(win);
            win.active = true;
        });
    },

    //玩法下拉列表(场景节点 cfgDrop/cfgDropList)
    _admCfgBuildDrop:function(bg){
        var self = this;
        var drop = bg.getChildByName("cfgDrop");
        var list = bg.getChildByName("cfgDropList");
        if(list){
            list.active = false;
            var rows = list.children.slice();
            for(var i = 0; i < rows.length; ++i){
                (function(idx){
                    var row = rows[idx];
                    row.off(cc.Node.EventType.TOUCH_END);
                    var g = self._admCfgList[idx];
                    if(idx < self._admCfgList.length){
                        row.active = true;
                        var lbNode = row.getChildByName("lbl");
                        if(lbNode && lbNode.getComponent(cc.Label)){ lbNode.getComponent(cc.Label).string = g.name || g.game_type; }
                        row.on(cc.Node.EventType.TOUCH_END,function(){
                            self._admCfgSel = g;
                            self._admCfgFill(bg);
                            var l2 = bg.getChildByName("cfgDropList");
                            if(l2){ l2.active = false; }
                        });
                    }
                    else{ row.active = false; }
                })(i);
            }
        }
        if(drop && !drop._cfgBound){
            drop._cfgBound = true;
            drop.on(cc.Node.EventType.TOUCH_END,function(){
                var l3 = bg.getChildByName("cfgDropList");
                if(l3){ l3.active = !l3.active; }
            });
        }
    },

    //把当前玩法的配置填进弹窗(台数规则按玩法类型显示对应字段,未配置的留空显示默认提示)
    _admCfgFill:function(bg){
        var g = this._admCfgSel;
        if(!bg || !g){ return; }
        var drop = bg.getChildByName("cfgDrop");
        var dl = drop ? drop.getChildByName("dl") : null;
        if(dl && dl.getComponent(cc.Label)){ dl.getComponent(cc.Label).string = g.name || g.game_type || ""; }
        //提示文字:宝宝手动摆玩法额外说明同点比较方式
        var tipN = bg.getChildByName("tip");
        if(tipN && tipN.getComponent(cc.Label)){
            tipN.getComponent(cc.Label).string = (String(g.game_type) == "baobao_shou")
                ? "台数规则留空按默认;同点比较 3=点数优先 1=花色优先 2=和"
                : "台数规则留空按默认值";
        }
        var rows = bg.getChildByName("rows");
        var fields = this._admCfgFields(g.game_type);
        var tai = g.tai_rules || {};
        //后台全局默认台数规则:未配置的项直接显示默认数值,不再只显示"默认"两个字
        var defTai = g.default_tai_rules || {};
        //按字段数量自动分列:<=8 一列,9~16 两列(8+7),>16 三列;每列最多8行,避免空列/拥挤
        var cols = fields.length > 16 ? 3 : (fields.length > 8 ? 2 : 1);
        var colX = (cols === 3) ? [-330, 0, 330] : ((cols === 2) ? [-170, 170] : [0]);
        var perCol = Math.ceil(fields.length / cols);
        var cnt = rows ? rows.children.length : 0;
        for(var i = 0; i < cnt; ++i){
            var row = rows.children[i];
            if(!row){ continue; }
            if(i < fields.length){
                row.active = true;
                row._cfgKey = fields[i].key;
                //每行 32 高,列宽 320:名字在左、输入框在右,行与列都不重叠
                row.setPosition(colX[Math.floor(i / perCol)], 62 - (i % perCol) * 32);
                var lbNode = row.getChildByName("name");
                if(lbNode && lbNode.getComponent(cc.Label)){ lbNode.getComponent(cc.Label).string = fields[i].label; }
                var eb = row.getChildByName("e") ? row.getChildByName("e").getComponent(cc.EditBox) : null;
                if(eb){
                    var v = tai[fields[i].key];
                    eb.string = (v != null) ? String(v) : "";
                    var phNode = row.getChildByName("e").getChildByName("PLACEHOLDER_LABEL");
                    var phLb = phNode ? phNode.getComponent(cc.Label) : null;
                    if(phLb){
                        var dv = defTai[fields[i].key];
                        phLb.string = (dv != null) ? String(dv) : "默认";
                    }
                }
            }
            else{
                row.active = false;
                row._cfgKey = null;
            }
        }
    },

    _admCfgClose:function(){
        if(this._admCfgWin && cc.isValid(this._admCfgWin)){ this._admCfgWin.active = false; }
    },

    //保存玩法配置:只提交台数规则(底分/局数在添加牌桌时输入,不在这里配)
    _admCfgSave:function(){
        var self = this, g = this._admCfgSel, win = this._admCfgWin;
        if(!g || !win){ return; }
        var bg = win.getChildByName("bg");
        if(!bg){ return; }
        var tai = {};
        var rows = bg.getChildByName("rows");
        var cnt = rows ? rows.children.length : 0;
        for(var i = 0; i < cnt; ++i){
            var row = rows.children[i];
            if(!row || !row.active || !row._cfgKey){ continue; }
            var eb = row.getChildByName("e") ? row.getChildByName("e").getComponent(cc.EditBox) : null;
            var s = eb ? String(eb.string || "").replace(/[^0-9]/g,"") : "";
            if(s !== ""){ tai[row._cfgKey] = parseInt(s,10); }
        }
        cc.vv.wc.show("正在保存");
        cc.vv.http.sendRequest("/club_game_config_save",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:this._clubCur.id,
            game_type:g.game_type,
            tai_rules:JSON.stringify(tai)
        },function(ret){
            cc.vv.wc.hide();
            if(!ret || ret.errcode !== 0){
                cc.vv.wc.showAlert((ret && ret.errmsg) ? ret.errmsg : "保存失败", "提示");
                return;
            }
            //同步本地缓存,下次打开立即回显;同时刷新加桌弹窗用的玩法列表
            g.tai_rules = (Object.keys(tai).length > 0) ? tai : null;
            var gl = self._clubGames || [];
            for(var k = 0; k < gl.length; ++k){
                if(gl[k].game_type == g.game_type){
                    gl[k].tai_rules = g.tai_rules;
                    break;
                }
            }
            cc.vv.wc.showAlert("配置已保存", "提示");
        });
    },

    //管理面板-添加牌桌:玩法改为弹窗内下拉框选择(不再依赖左侧玩法行的高亮状态)
    _wfOpenAddTable:function(){
        var adm = this._admPanel;
        var win = adm ? adm.getChildByName("addTableWin") : null;
        var bg = win ? win.getChildByName("bg") : null;
        if(!win || !bg){ return; }
        var games = this._clubGames || [];
        if(!games.length){ cc.vv.wc.showAlert("该俱乐部暂无玩法，请先在后台添加玩法", "提示"); return; }
        this._admAddWin = win;
        if(!this._admGame){ this._admGame = games[0]; }
        this._admBuildDrop(bg,games);
        this._wfFillAddTable(bg,this._admGame);
        this._admStretchWin(win);
        win.active = true;
    },

    //弹窗暗色遮罩铺满可见区(禁用Widget,避免被弹窗根节点对齐回1280x720)
    _admStretchWin:function(win){
        var dim = win ? win.getChildByName("New Layout") : null;
        if(!dim){ return; }
        var wd = dim.getComponent(cc.Widget);
        if(wd){ wd.enabled = false; }
        var vs = cc.view.getVisibleSize();
        dim.setContentSize(vs.width, vs.height);
        dim.setPosition(0,0);
    },

    //玩法下拉框(节点在场景里):填当前玩法名,并给下拉列表行绑点击
    _admBuildDrop:function(bg,games){
        var self = this;
        var drop = bg.getChildByName("admDrop");
        var dl = drop ? drop.getChildByName("dl") : null;
        var text = this._admGame ? (this._admGame.name || this._admGame.game_type || "") : "";
        if(dl && dl.getComponent(cc.Label)){ dl.getComponent(cc.Label).string = text; }
        var list = bg.getChildByName("admDropList");
        if(list){
            list.active = false; //每次打开默认收起
            var rows = list.children;
            for(var i = 0; i < rows.length; ++i){
                (function(idx){
                    var row = rows[idx];
                    row.off(cc.Node.EventType.TOUCH_END); //每行只保留本次绑定的点击
                    if(idx < games.length){
                        row.active = true;
                        var rl = row.getComponent(cc.Label);
                        if(rl){ rl.string = games[idx].name || games[idx].game_type || ""; }
                        row.on(cc.Node.EventType.TOUCH_END,function(){
                            self._admGame = games[idx];
                            var d2 = bg.getChildByName("admDrop");
                            var lab = d2 ? d2.getChildByName("dl") : null;
                            if(lab && lab.getComponent(cc.Label)){ lab.getComponent(cc.Label).string = games[idx].name || games[idx].game_type || ""; }
                            self._wfFillAddTable(bg,games[idx]);
                            var l2 = bg.getChildByName("admDropList");
                            if(l2){ l2.active = false; }
                        });
                    }
                    else{ row.active = false; }
                })(i);
            }
        }
        if(drop && !drop._admBound){
            drop._admBound = true;
            drop.on(cc.Node.EventType.TOUCH_END,function(){
                var l3 = bg.getChildByName("admDropList");
                if(l3){ l3.active = !l3.active; }
            });
        }
    },

    //填弹窗:标题带玩法名,输入框留空由用户直接输入(不使用后台配置的默认值)
    _wfFillAddTable:function(bg,g){
        if(!bg || !g){ return; }
        var setInput = function(name,val){
            var n = bg.getChildByName(name);
            var eb = n ? n.getComponent(cc.EditBox) : null;
            if(eb){ eb.string = String(val); }
        };
        var tl = bg.getChildByName("title");
        if(tl && tl.getComponent(cc.Label)){ tl.getComponent(cc.Label).string = "添加" + (g.name || g.game_type || "") + "牌桌"; }
        setInput("difenInput","");
        setInput("jushuInput","");
        setInput("minInput",0);
        setInput("kickInput",0);
    },

    _wfCloseAddTable:function(){
        if(this._admAddWin && cc.isValid(this._admAddWin)){ this._admAddWin.active = false; }
    },

    //提交添加牌桌:底分/局数直接用输入值,服务端校验馆主身份并按序号自动命名(玩法取下拉框选择)
    _wfSubmitAddTable:function(){
        var self = this, g = this._admGame;
        if(!g || !this._admAddWin){ return; }
        var bg = this._admAddWin.getChildByName("bg");
        if(!bg){ return; }
        var read = function(name){
            var n = bg.getChildByName(name);
            var eb = n ? n.getComponent(cc.EditBox) : null;
            return eb ? String(eb.string).replace(/[^0-9]/g,"") : "";
        };
        var difen = parseInt(read("difenInput"));
        if(!(difen > 0)){ cc.vv.wc.showAlert("请输入正确的底分", "提示"); return; }
        var jushu = parseInt(read("jushuInput"));
        if(!(jushu > 0)){ cc.vv.wc.showAlert("请输入正确的局数", "提示"); return; }
        var min = parseInt(read("minInput"));
        var kick = parseInt(read("kickInput"));
        if(!(min >= 0)){ min = 0; }
        if(!(kick >= 0)){ kick = 0; }
        cc.vv.wc.show("正在添加牌桌");
        cc.vv.http.sendRequest("/club_add_table",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:this._clubCur.id,
            game_type:g.game_type,
            difen_value:difen,
            jushuxuanze:0, //下标字段保留兼容,游戏服优先用jushu_value实际值
            jushu_value:jushu, //底分/局数都是输入的实际值,不再走后台选项下标
            banker_mode:0, //固定无庄
            min_bean:min,
            kick_bean:kick
        },function(ret){
            cc.vv.wc.hide();
            if(!ret || ret.errcode !== 0){
                var msg = (ret && ret.errmsg) ? ret.errmsg : "添加牌桌失败";
                if(ret && ret.errcode === 4){ msg = "只有俱乐部创建者可以添加牌桌"; }
                if(ret && ret.errcode === 5){ msg = "该玩法未加入俱乐部，请先在后台添加该玩法"; }
                cc.vv.wc.showAlert(msg, "提示");
                return;
            }
            self._wfCloseAddTable();
            self._clubTablesSig = null; //强制按最新数据重建牌桌列表
            self._clubLoadTables();
        });
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

    // ===== 管理面板:添加成员 =====
    _wfOpenPull:function(){
        var win = this._admMemberWin;
        if(!win){ return; }
        var bg = win.getChildByName("bg");
        var ebNode = bg ? bg.getChildByName("difenInput") : null;
        var eb = ebNode ? ebNode.getComponent(cc.EditBox) : null;
        if(eb){ eb.string = ""; }
        this._admStretchWin(win);
        win.active = true;
    },
    _wfClosePull:function(){
        if(this._admMemberWin && cc.isValid(this._admMemberWin)){ this._admMemberWin.active = false; }
    },
    //添加成员:输入玩家ID直接拉入俱乐部(服务端校验ID不存在/已加入)
    _wfSubmitPull:function(){
        var self = this;
        var win = this._admMemberWin;
        if(!win){ return; }
        var bg = win.getChildByName("bg");
        var n = bg ? bg.getChildByName("difenInput") : null;
        var eb = n ? n.getComponent(cc.EditBox) : null;
        var uid = eb ? parseInt(String(eb.string).replace(/[^0-9]/g,"")) : NaN;
        if(!(uid > 0)){ cc.vv.wc.showAlert("请输入正确的玩家ID", "提示"); return; }
        cc.vv.wc.show("正在添加");
        cc.vv.http.sendRequest("/club_pull",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:this._clubCur.id,
            userid:uid
        },function(ret){
            cc.vv.wc.hide();
            if(!ret || ret.errcode !== 0){
                // ID 不存在 / 已在俱乐部中 都按服务端明确提示弹出(用可确认的弹窗,避免3秒提示一闪而过)
                var msg = (ret && ret.errmsg) ? ret.errmsg : "添加失败";
                if(ret && ret.errcode === 5){ msg = "该玩家ID不存在，请确认后重试"; }
                if(ret && ret.errcode === 6){ msg = "该玩家已加入俱乐部"; }
                cc.vv.wc.showAlert(msg, "提示");
                return;
            }
            self._wfClosePull();
            cc.vv.wc.showAlert("添加成功", "提示");
        });
    },

    _admBindOkCancel:function(win,onOk,onCancel){
        var bg = win ? win.getChildByName("bg") : null;
        if(!bg){ return; }
        var ok = bg.getChildByName("btnOk");
        if(ok){ ok.on(cc.Node.EventType.TOUCH_END,onOk); }
        var cancel = bg.getChildByName("btnCancel");
        if(cancel){ cancel.on(cc.Node.EventType.TOUCH_END,onCancel); }
    },

    _admOpenBean:function(){
        var win = this._admBeanWin;
        if(!win){ return; }
        var bg = win.getChildByName("bg");
        this._admBeanUid = 0;
        this._admBeanGems = 0;
        if(bg){
            var eb1 = bg.getChildByName("difenInput");
            if(eb1 && eb1.getComponent(cc.EditBox)){ eb1.getComponent(cc.EditBox).string = ""; }
            var eb2 = bg.getChildByName("deltaInput");
            if(eb2 && eb2.getComponent(cc.EditBox)){ eb2.getComponent(cc.EditBox).string = ""; }
            var info = bg.getChildByName("info");
            if(info && info.getComponent(cc.Label)){ info.getComponent(cc.Label).string = ""; }
        }
        this._admStretchWin(win);
        win.active = true;
    },

    _wfCloseBean:function(){
        if(this._admBeanWin && cc.isValid(this._admBeanWin)){ this._admBeanWin.active = false; }
    },

    //按玩家ID查询昵称与宝宝豆余额
    _admQueryBean:function(){
        var self = this;
        var win = this._admBeanWin;
        if(!win){ return; }
        var bg = win.getChildByName("bg");
        var n = bg ? bg.getChildByName("difenInput") : null;
        var eb = n ? n.getComponent(cc.EditBox) : null;
        var uid = eb ? parseInt(String(eb.string).replace(/[^0-9]/g,"")) : NaN;
        if(!(uid > 0)){ cc.vv.wc.showAlert("请输入正确的玩家ID", "提示"); return; }
        cc.vv.wc.show("正在查询");
        cc.vv.http.sendRequest("/club_member_info",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:this._clubCur.id,
            userid:uid
        },function(ret){
            cc.vv.wc.hide();
            if(!ret || ret.errcode !== 0){
                var msg = (ret && ret.errmsg) ? ret.errmsg : "查询失败";
                if(ret && ret.errcode === 4){ msg = "仅俱乐部创建者可操作"; }
                if(ret && ret.errcode === 5){ msg = "该玩家ID不存在，请确认后重试"; }
                cc.vv.wc.showAlert(msg, "提示");
                return;
            }
            self._admBeanUid = Number(ret.userid) || uid;
            self._admBeanGems = Number(ret.gems) || 0;
            var info = bg.getChildByName("info");
            var il = info ? info.getComponent(cc.Label) : null;
            if(il){ il.string = "昵称：" + (ret.name || "-") + "\n宝宝豆：" + self._admBeanGems; }
        });
    },

    //给已查询到的玩家增减宝宝豆(可为负)
    _admApplyBean:function(){
        var self = this;
        var win = this._admBeanWin;
        if(!win){ return; }
        if(!(this._admBeanUid > 0)){ cc.vv.wc.showAlert("请先查询玩家ID", "提示"); return; }
        var bg = win.getChildByName("bg");
        var n = bg ? bg.getChildByName("deltaInput") : null;
        var eb = n ? n.getComponent(cc.EditBox) : null;
        var delta = parseInt(eb ? String(eb.string).replace(/[^0-9\-]/g,"") : "");
        if(!delta){ cc.vv.wc.showAlert("请输入要增减的宝宝豆数量", "提示"); return; }
        cc.vv.wc.show("正在修改");
        cc.vv.http.sendRequest("/club_member_gems",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:this._clubCur.id,
            userid:this._admBeanUid,
            gems:delta
        },function(ret){
            cc.vv.wc.hide();
            if(!ret || ret.errcode !== 0){
                var msg = (ret && ret.errmsg) ? ret.errmsg : "修改宝宝豆失败";
                if(ret && ret.errcode === 4){ msg = "仅俱乐部创建者可操作"; }
                if(ret && ret.errcode === 5){ msg = "该玩家ID不存在，请确认后重试"; }
                cc.vv.wc.showAlert(msg, "提示");
                return;
            }
            self._admBeanGems = Number(ret.gems) || 0;
            //改的是自己时同步本地余额
            if(cc.vv.userMgr && cc.vv.userMgr.userId == self._admBeanUid){ cc.vv.userMgr.gems = self._admBeanGems; }
            //成功后关闭弹窗,再弹成功提示(提示层已提到管理面板之上,可见)
            self._wfCloseBean();
            cc.vv.wc.showAlert("修改成功", "提示");
        });
    },

    //俱乐部详情:左侧玩法列表+右侧桌面列表
    _clubOpenDetail:function(club){
        var self = this;
        this._clubCur = club;
        this._clubCurGame = null;
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
        var fullBg = this._clubPanel.getChildByName("detailFullBg"); //固化场景节点(Graphics组件已挂)
        this._clubDetailFullBg = fullBg;
        var fbg = fullBg.getComponent(cc.Graphics);
        fbg.clear();
        //详情页右上角退出按钮禁用,离开详情用左上角返回按钮
        if(this._clubCloseBtn){ this._clubCloseBtn.active = false; }
        //左上角返回按钮(固化节点 btnBack,贴图 club_btn_back 自带文字已配置,文字Label在场景中隐藏)
        var backBtn = this._clubFind(area,"btnBack");
        if(backBtn){
        //位置由场景控制(编辑器里调整),JS只绑定点击
        backBtn._clubW = backBtn.width; backBtn._clubH = backBtn.height;
        if(!backBtn._clubBound){
            backBtn._clubBound = true;
            backBtn.on(cc.Node.EventType.TOUCH_END,function(){ self._wfBack(); }); //独立页返回:回俱乐部页
        }
        this._clubBackBtn = backBtn;
        }
        //返回按钮右边显示俱乐部名称(顶部通栏内,白底通栏用黑字),与返回按钮间距固定30px
        var cnNode = this._clubFind(area,"clubName");
        if(cnNode){
            var cl = cnNode.getComponent(cc.Label);
            var cobj = this._clubCur || {};
            //俱乐部名字段兼容:服务器可能返回 name / club_name / clubName
            var cname = cobj.name || cobj.club_name || cobj.clubName || "";
            if(cl && cname){ cl.string = cname; } //取不到名字时保留场景里的默认文字,不置空
            cnNode.active = true;
            //俱乐部名称:黑色字体
            cnNode.color = new cc.Color(0,0,0,255);
            //与返回按钮右侧边缘保持30px间距(两节点可能不同父节点,用世界坐标换算避免偏差)
            if(backBtn && cnNode.parent){
                var backRightWorld = backBtn.convertToWorldSpaceAR(cc.v2((1 - backBtn.anchorX) * backBtn.width, 0));
                var backRightLocal = cnNode.parent.convertToNodeSpaceAR(backRightWorld);
                cnNode.x = backRightLocal.x + 30 + cnNode.anchorX * cnNode.width;
            }
        }
        //俱乐部名称后面显示玩家房卡数(节点clubGems固化在场景listArea下,位置由编辑器控制,JS只填文字)
        var gemsNode = this._clubFind(area,"clubGems");
        this._clubGemsNode = gemsNode; //缓存引用,供保险柜存取后同步显示 //rc2
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
        //保留gameRowTpl模板、emptyTip提示、samptext标题图(场景固化,按钮上方的"玩法列表"标签),只清动态克隆的行
        var grTpl = gamesNode.getChildByName("gameRowTpl");
        var etNode = gamesNode.getChildByName("emptyTip");
        var tiNode = gamesNode.getChildByName("samptext");
        gamesNode.removeAllChildren();
        if(tiNode){ gamesNode.addChild(tiNode); }
        if(grTpl){ gamesNode.addChild(grTpl); grTpl.active = false; }
        if(etNode){ gamesNode.addChild(etNode); }
        this._clubGameRows = [];
        var games = this._clubGames || [];
        var ROW_H = grTpl ? grTpl.height : 68;
        var ROW_GAP = ROW_H + 5;
        //行组在games容器内从顶部往下排列(容器尺寸/位置由场景Widget控制,JS不碰)
        var topY = gamesNode.height / 2 - ROW_H / 2 - 130; //按钮自身再下移130,容器保持原位
        //暂无玩法提示:固化在场景games下的emptyTip节点(文案/样式在编辑器调),JS只控制显隐
        var et = gamesNode.getChildByName("emptyTip");
        if(et){ et.active = (games.length == 0); }
        games.forEach(function(gm,i){
            var row = grTpl ? cc.instantiate(grTpl) : new cc.Node("row"+i);
            row.active = true;
            row._gm = gm; //行绑定的玩法(添加牌桌按高亮行取类型)
            row.setPosition(0, topY - i * ROW_GAP);
            gamesNode.addChild(row);
            var lNode = row.getChildByName("l");
            if(lNode){
                //文字布局运行时强制:占满整行+居中+白字+自动缩放
                //(场景文件会被编辑器保存冲掉,关键排版以JS为准,编辑器里仍可改颜色/字号)
                lNode.setContentSize(row.width, row.height);
                lNode.setPosition(0, 0);
                var ll = lNode.getComponent(cc.Label);
                if(ll){
                    ll.string = gm.name || "";
                    ll.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
                    ll.verticalAlign = cc.Label.VerticalAlign.CENTER;
                    ll.overflow = cc.Label.Overflow.SHRINK;
                }
            }
            var bgimg = row.getChildByName("bgimg");
            if(bgimg){
                //按钮底图:默认态=game_btn_normal.png(场景gameRowTpl>bgimg已固化),点击态=game_btn_pressed.png
                var bsp = bgimg.getComponent(cc.Sprite);
                row._iconSp = bsp;
                row._iconNormal = bsp ? bsp.spriteFrame : null;
                row._iconSel = null;
                cc.resources.load("images/club/game_btn_normal", cc.SpriteFrame, function(err,sf){
                    if(err || !sf || !cc.isValid(bgimg)){ return; }
                    row._iconNormal = sf;
                    if(!row._selected){ bsp.spriteFrame = sf; } //默认态显示按钮图
                });
                cc.resources.load("images/club/game_btn_pressed", cc.SpriteFrame, function(err,sf){
                    if(err || !sf || !cc.isValid(bgimg)){ return; }
                    row._iconSel = sf;
                    if(row._selected){ bsp.spriteFrame = sf; } //点击态换图
                });
            }
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
        //牌桌卡片模板=场景里配置的那一个 sampleCard0(必须在清空列表前取到)
        var tplNode = this._clubFind(this._clubTablesNode, "sampleCard0");
        if(tplNode){ this._clubTpl = tplNode; }
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
                var half = (cW - vw) / 2; //锚点0.5:可左右偏移半个溢出量
                self._clubTablesNode.x = Math.max(restX - half,Math.min(restX + half,svBaseX + dx));
            });
            svView.on(cc.Node.EventType.TOUCH_CANCEL,function(){ self._clubTablesScrollMoved = false; });
        }
        if(this._clubTablesRestY == null){ this._clubTablesRestY = this._clubTablesNode.y; } //记录场景里配置的初始位置,重建时回到这里
        if(this._clubTablesRestX == null){ this._clubTablesRestX = this._clubTablesNode.x; }
        //默认选中玩法:从牌桌退出/结算返回时优先回到刚玩过的那个玩法(直达它的牌桌页),
        //没有记录或该玩法不在本俱乐部时才选第一个
        if(!this._clubCurGame && games.length > 0){
            var wanted = cc.vv.lastGameType;
            var picked = null;
            if(wanted){
                for(var gi = 0; gi < games.length; ++gi){
                    var gt = games[gi].game_type || games[gi].type;
                    if(gt == wanted){ picked = games[gi]; break; }
                }
            }
            this._clubCurGame = picked || games[0];
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

    //选中玩法:高亮行并刷新右侧牌桌
    _clubSelectGame:function(gm,row){
        this._clubCurGame = gm;
        for(var k = 0; k < this._clubGameRows.length; ++k){
            this._clubPaintRow(this._clubGameRows[k],this._clubGameRows[k] === row);
        }
        this._clubLoadTables();
    },

    //牌桌卡片模板=场景 tables 下的 sampleCard0(场景里只配置这一个,列表全部由它克隆)
    _clubCardTpl:function(){
        if(this._clubTpl && cc.isValid(this._clubTpl)){ return this._clubTpl; }
        //不依赖tables容器状态:直接从场景根递归找,场景里只有这一个sampleCard0
        var root = cc.find("Canvas");
        var t = root ? this._clubFind(root,"sampleCard0") : null;
        if(t){ this._clubTpl = t; }
        return t || null;
    },

    //当前玩法的实际人数:牌桌数据带max_players时以它为准(最多6),否则4人玩法按zj4/zp4/wujin判定,其余为2人
    _clubMaxPlayers:function(t){
        if(t){
            var mp = t.max_players || t.maxPlayers;
            if(mp) { mp = parseInt(mp); return mp > 6 ? 6 : mp; }
        }
        var gt = (this._clubCurGame && this._clubCurGame.game_type) ? this._clubCurGame.game_type : "";
        if(gt.indexOf("baobao") === 0){ return 6; } //宝宝牌固定6座
        return (gt.indexOf("zj4") === 0 || gt.indexOf("zp4") === 0 || gt == "wujin") ? 4 : 2;
    },

    //创建牌桌卡片(绿色桌面+按玩法人数画座位+名称+人数),返回卡片节点
    _clubAddTableCard:function(parent,idx,t){
        var self = this;
        var PAD = 10, GAP = 8; //页边距/卡片间距(横向排列常量)
        var pf = this._clubCardTpl();
        if(!pf){ console.log("[俱乐部]场景缺少sampleCard0模板,无法建牌桌卡片"); return; }
        //卡片尺寸/内部布局完全来自场景模板,JS只克隆+摆到排位、填数据
        var CW = pf.width, CH = pf.height;
        //两行显示:row-major排列(第一行排满再排第二行),列数由渲染时桌数算好存在_clubTableCols
        var cols = this._clubTableCols || (idx + 1);
        var col = idx % cols;
        var row = Math.floor(idx / cols);
        //从左到右左靠齐排列(内容节点锚点(0.5,1),x=-width/2为内容左缘)
        var x = -parent.width / 2 + PAD + CW / 2 + col * (CW + GAP);
        var y = -PAD - CH / 2 - row * (CH + GAP);
        var card = cc.instantiate(pf);
        card.active = true; //模板节点是隐藏的,克隆出来要显式打开
        card.setPosition(x,y);
        parent.addChild(card);
        //座位:六座牌桌图(下左/左/上左/上右/右/下右),按实际人数取对称的子集;座位内人物/位置由场景模板决定
        var sides = ["下左","左","上左","上右","右","下右"];
        var maxP = this._clubMaxPlayers(t);
        //useSet:房间座位号(0..maxP-1)依次对应的牌桌显示位(下左/左/上左/上右/右/下右),推送里的seatindex要按它换算
        var useSet = {2:[0,3],3:[0,1,4],4:[0,1,3,4],5:[0,1,2,3,4],6:[0,1,2,3,4,5]}[maxP] || [0,1,2,3,4,5];
        //初始座位:用列表接口返回的 user_id0..5(下标=房间座位号)按map换算到显示位直接渲染,
        //否则打开页面前已落座的玩家永远显示不出来,后续变化再由长连接推送增量更新
        var uids = [0,0,0,0,0,0]; //下标=显示位
        for(var s = 0; s < useSet.length; s++){
            var su = Number(t["user_id" + s]) || 0;
            if(su > 0 && useSet[s] < uids.length){ uids[useSet[s]] = su; }
        }
        var slotList = [null,null,null,null,null,null]; //下标=显示位,与uids同序,增量刷新时按显示位写座位
        for(var i = 0; i < 6; i++){
            var st = card.getChildByName("seat" + i);
            if(!st){ continue; }
            if(useSet.indexOf(i) < 0){ st.active = false; continue; }
            st._side = sides[i];
            slotList[i] = st;
            this._clubSetSeat(st,uids[i] || 0);
        }
        if(!this._clubTableCardMap){ this._clubTableCardMap = {}; }
        var ent = {card:card,slots:slotList,uids:uids,map:useSet}; //map:房间座位号→显示位
        this._clubTableCardMap[t.id] = ent; //供长连接推送增量刷新落座人物
        if(t.roomid){ this._clubTableCardMap["r_" + t.roomid] = ent; } //推送按roomid定位卡片,避免走DB全表刷新(异步写库有时序差)
        //桌面名称:牌桌号后面加"号桌"二字
        var nn = card.getChildByName("n");
        if(nn){
            var nl = nn.getComponent(cc.Label);
            if(nl){ nl.string = (t.name || "") + "号桌"; }
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
        //是否有庄:banker_mode未配置默认有庄,0为无庄
        var bankerTxt = (confObj.banker_mode != null && !Number(confObj.banker_mode)) ? "无庄" : "有庄";
        var minBean = Number(confObj.min_bean) || 0;
        var cn = card.getChildByName("c");
        if(cn){
            var cl = cn.getComponent(cc.Label);
            if(cl){
                //Label为NONE时节点宽度被文字接管,编辑器里改不了宽度也不会换行;改成CLAMP由场景宽度控制换行
                if(cl.overflow === cc.Label.Overflow.NONE){
                    cl.overflow = cc.Label.Overflow.CLAMP;
                    cl.enableWrapText = true;
                }
                cl.string = "底分" + (df != null ? df : "-") + "  " + bankerTxt + "  最低豆" + minBean + "  " + (js != null ? js : "-") + "局";
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
        //删除牌桌按钮(场景模板sampleCard0内的btnDel节点):仅俱乐部创建者可见
        var btnDel = this._clubFind(card,"btnDel");
        if(btnDel){
            var isOwner = !!(this._clubCur && cc.vv.userMgr && String(this._clubCur.owner_userid) === String(cc.vv.userMgr.userId));
            btnDel.active = isOwner;
            btnDel.off(cc.Node.EventType.TOUCH_END);
            if(isOwner){
                btnDel.on(cc.Node.EventType.TOUCH_END,function(ev){
                    ev.stopPropagation(); //阻止冒泡触发卡片进桌点击
                    if(self._clubTablesScrollMoved){ self._clubTablesScrollMoved = false; return; }
                    self._clubDelTable(t);
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
        this._clubShowConfirm("清空牌桌","确定清空「" + (t.name || "") + "号桌」?将解散房间并踢出所有玩家",function(){
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
        this._clubShowConfirm("删除牌桌","确定删除「" + (t.name || "") + "号桌」?删除后不可恢复",function(){
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

    //设置牌桌座位人物:uid>0按性别显示落座人物(sex=2为女性,无法区分默认男性),0=恢复空位
    _clubSetSeat:function(slotNode,uid){
        if(!slotNode || !cc.isValid(slotNode)){ return; }
        uid = uid || 0;
        if(slotNode._uid === uid){ return; } //同一玩家不重复加载
        slotNode._uid = uid;
        var chara = slotNode.getChildByName("chara");    //男
        var charaF = slotNode.getChildByName("charaF");  //女(位置在编辑器里单独调好)
        var head = slotNode.getChildByName("head");      //头顶圆形头像(位置在场景里调)
        if(!chara && !charaF){ return; }
        if(uid <= 0){
            if(chara){ chara.active = false; } //空位:只显示空椅子
            if(charaF){ charaF.active = false; }
            if(head){ head.active = false; }
            return;
        }
        var self = this;
        var apply = function(info){
            var female = info && Number(info.sex) === 2; //性别不明默认男性
            //座位方位直接对应 clud_pz 图集帧名(下左/左/上左/上右/右/下右),按性别取男/女
            var side = slotNode._side || "下左";
            var node = (female && charaF) ? charaF : chara;
            if(!node || !cc.isValid(node)){ return; }
            if(chara){ chara.active = !(female && charaF); }
            if(charaF){ charaF.active = !!female; }
            self._clubApplyFrame(node, "bbt_" + (female ? "女" : "男") + side);
            //头顶头像:仅填数据,布局全在场景里
            if(head && cc.isValid(head)){
                head.active = true;
                var img = head.getChildByName("img");
                if(img){
                    var spr = img.getComponent(cc.Sprite);
                    var il = img.getComponent("ImageLoader");
                    if(il){ il._spriteFrame = null; }
                    //先显示默认头像,真实头像加载完成后由ImageLoader覆盖
                    if(spr){
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
        if(cc.vv.baseInfoMap && cc.vv.baseInfoMap[uid] != null && cc.vv.baseInfoMap[uid].sex != null){
            apply(cc.vv.baseInfoMap[uid]);
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
                url:(key && !isLocal) ? key + ".jpg" : null
            };
            if(cc.vv.baseInfoMap == null){ cc.vv.baseInfoMap = {}; }
            cc.vv.baseInfoMap[uid] = info;
            apply(info);
        },cc.vv.http.master_url);
    },

    //牌桌列表改为「打开时拉一次 + 游戏服长连接推送」,取消3秒轮询
    //说明:俱乐部场景下 cc.vv.net 并未建立连接,故这里单独向游戏服建立一条轻量订阅连接(句柄独立于 cc.vv.net)
    _clubStartTableWatch:function(){
        if(!this._clubCur || !this._clubCur.id){ return; }
        this._clubSubConnect(this._clubCur.id);
    },

    _clubStopTableWatch:function(){
        this._clubSubStop();
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
            for(var j = 0; j < seats.length; ++j){
                var si = seats[j].seatindex;
                //房间座位号按map换算成显示位,否则2人桌的第二个玩家会落到隐藏座位(seat1)上
                var slot = (ent.map && si >= 0 && si < ent.map.length) ? ent.map[si] : si;
                if(slot >= 0 && slot < uids.length){ uids[slot] = seats[j].userid || 0; }
            }
            for(var k = 0; k < ent.slots.length; ++k){
                this._clubSetSeat(ent.slots[k],uids[k]);
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

    //加载当前玩法下的桌面列表(数据无变化时不重建节点,避免抖动)
    _clubLoadTables:function(){
        this._clubStartTableWatch();
        var self = this;
        cc.vv.http.sendRequest("/club_tables",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:this._clubCur.id,
            game_type:this._clubCurGame.game_type
        },function(ret){
            if(ret.errcode !== 0){
                cc.vv.wc.showError(ret.errmsg || "获取桌面失败");
                return;
            }
            var tables = ret.tables || [];
            self._clubTableList = tables; //留存最新桌面列表,快速加入用
            //签名比对:桌面数据未变化则跳过重建,消除刷新造成的列表抖动(玩家ID也纳入,头像变化触发重建)
            var sig = "";
            for(var i = 0; i < tables.length; ++i){
                sig += (tables[i].id || "") + ":" + (tables[i].player_count || 0) + ":"
                    + (tables[i].user_id0 || 0) + "," + (tables[i].user_id1 || 0) + ","
                    + (tables[i].user_id2 || 0) + "," + (tables[i].user_id3 || 0) + ","
                    + (tables[i].user_id4 || 0) + "," + (tables[i].user_id5 || 0) + ",";
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
            self._clubTablesNode.y = (self._clubTablesRestY != null) ? self._clubTablesRestY : self._clubTablesNode.parent.height/2; //重建后回到场景里配置的初始位置
            //两行横向排列:每行 ceil(n/2) 张,内容宽度随列数增长,超出视口后可左右拖动(卡片尺寸直接取场景模板,不做额外缩放)
            var viewW = self._clubTablesNode.parent.width;
            var viewH = self._clubTablesNode.parent.height;
            var cardW = tpl ? tpl.width : 0;
            var cols = Math.max(1, Math.ceil(tables.length / 2)); //两行显示
            self._clubTableCols = cols;
            var cW = Math.max(viewW, 10 + cols * cardW + Math.max(0,cols - 1) * 8 + 10);
            self._clubTablesNode.setContentSize(cW,viewH);
            //超宽时初始对齐左缘(锚点0.5:向右偏半个溢出量),未超宽回到场景配置位
            var restX = (self._clubTablesRestX != null) ? self._clubTablesRestX : 0;
            self._clubTablesNode.x = cW > viewW ? restX + (cW - viewW) / 2 : restX;
            if(tables.length == 0){
                self._clubAddRow(self._clubTablesNode,0,"暂无桌面(管理员后台添加)","",null,520);
                return;
            }
            tables.forEach(function(t,i){
                self._clubAddTableCard(self._clubTablesNode,i,t);
            });
        });
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
                cc.vv.fromClubId = self._clubCur ? self._clubCur.id : null; //记住来源俱乐部,回俱乐部场景直达它的玩法详情页
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
