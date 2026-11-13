// 操作按钮上方的"组合牌提示"(吃/碰/杠/胡) + 点组合牌直接执行操作
// 模板来自场景 game/opTpl:牌的大小、间距、底色板都在编辑器里摆好,这里只按模板复制并换牌面,不写死坐标
// 逻辑与 zjlao 的 _buildOpTiles / _showOpTiles 一致:
//  - 展示的牌是"手里真实牌"(缺的面值用财神顶),点哪组就用那组直接发包
//  - 每组用底色板包起来,每行最多2组,超过2组向上换行
var OpTiles = {
    //清掉按钮上已有的提示
    clear: function(btn){
        if(!btn){ return; }
        var old = btn.getChildByName("opTiles");
        if(old){ old.destroy(); }
    },

    //是否财神(含双财神第二张)
    isCaishen: function(pai){
        var conf = cc.vv && cc.vv.gameNetMgr ? cc.vv.gameNetMgr.conf : null;
        if(!conf || pai == null || pai < 0){ return false; }
        return pai == conf.caishen || (conf.caishen2 != null && conf.caishen2 >= 0 && pai == conf.caishen2);
    },

    //把"面值需求"换算成手里的真实牌:缺的用财神顶(服务端吃碰杠都支持财神补位)
    //换算结果同时用于组合展示和吃牌发包
    build: function(faceIds){
        var nm = cc.vv ? cc.vv.gameNetMgr : null;
        if(!nm || !faceIds){ return faceIds ? faceIds.slice() : []; }
        var seatData = nm.seats ? nm.seats[nm.seatIndex] : null;
        if(!seatData && nm.getSelfData){ seatData = nm.getSelfData(); }
        var countMap = {};
        if(seatData && seatData.holds){
            for(var i = 0; i < seatData.holds.length; ++i){
                countMap[seatData.holds[i]] = (countMap[seatData.holds[i]] || 0) + 1;
            }
        }
        var conf = nm.conf || {};
        var csPool = [];
        if(conf.caishen != null && conf.caishen >= 0){ csPool.push(conf.caishen); }
        if(conf.caishen2 != null && conf.caishen2 >= 0 && conf.caishen2 != conf.caishen){ csPool.push(conf.caishen2); }
        var used = {};
        var out = [];
        for(var k = 0; k < faceIds.length; ++k){
            var p = faceIds[k];
            var avail = (countMap[p] || 0) - (used[p] || 0);
            if(avail > 0){
                used[p] = (used[p] || 0) + 1;
                out.push(p);
                continue;
            }
            var picked = p; //兜底:没这张也没财神时按原面值(理论上不会发生)
            for(var j = 0; j < csPool.length; ++j){
                var c = csPool[j];
                var cavail = (countMap[c] || 0) - (used[c] || 0);
                if(cavail > 0){
                    used[c] = (used[c] || 0) + 1;
                    picked = c;
                    break;
                }
            }
            out.push(picked);
        }
        return out;
    },

    //提示牌财神角标:克隆场景 game/csCornerOp 节点,位置/大小在场景里直接调,代码只切显隐
    setCaishenCorner: function(owner, tileNode, pai){
        if(!tileNode){ return; }
        var corner = tileNode.getChildByName("csCorner");
        if(!this.isCaishen(pai)){
            if(corner){ corner.active = false; }
            return;
        }
        if(!corner){
            var root = owner ? owner.node : null;
            var gameChild = root ? root.getChildByName("game") : null;
            var template = gameChild ? gameChild.getChildByName("csCornerOp") : null;
            if(!template){ return; }
            corner = cc.instantiate(template);
            corner.name = "csCorner";
            tileNode.addChild(corner);
        }
        corner.active = true;
    },

    //多个可吃/可杠组合时,点按钮本身只闪烁提示
    flash: function(btn){
        var ot = btn ? btn.getChildByName("opTiles") : null;
        if(!ot){ return; }
        ot.stopAllActions();
        ot.scale = 1;
        ot.runAction(cc.sequence(cc.scaleTo(0.12, 1.08), cc.scaleTo(0.12, 1)));
    },

    //短暂浮动提示(吃牌超时/组合不合法反馈)
    toast: function(owner, txt){
        var root = owner ? owner.node : null;
        if(!root){ return; }
        var gameChild = root.getChildByName("game") || root;
        var old = gameChild.getChildByName("opToast");
        if(old){ old.destroy(); }
        var n = new cc.Node("opToast");
        gameChild.addChild(n);
        n.setPosition(0, -250);
        var lb = n.addComponent(cc.Label);
        lb.string = txt;
        lb.fontSize = 32;
        lb.lineHeight = 36;
        lb.overflow = cc.Label.Overflow.NONE;
        n.color = cc.color(255, 220, 80);
        var ol = n.addComponent(cc.LabelOutline);
        ol.color = cc.color(60, 30, 0);
        ol.width = 3;
        n.runAction(cc.sequence(cc.delayTime(1.6), cc.removeSelf()));
    },

    //groups: 二维数组,每组是一副要展示的牌(如碰=[p,p,被碰牌],杠=[g,g,g],胡=[p],吃=[a,b,被吃牌])
    //onPick(grp): 点某组直接执行(吃发chi/杠发gang/碰胡直发)
    show: function(owner, btn, groups, onPick){
        if(!btn){ return; }
        this.clear(btn);
        if(!groups || !groups.length){ return; }
        var tpl = owner ? owner._opTpl : null;
        if(tpl && !cc.isValid(tpl)){ tpl = null; }
        //模板里的牌节点(排除底色板 plate)
        var tplTiles = [];
        if(tpl){
            for(var i = 0; i < tpl.childrenCount; ++i){
                var cn = tpl.children[i];
                if(cn.name != "plate"){ tplTiles.push(cn); }
            }
        }
        var tileW = 55, tileH = 84, step = 47;   //兜底值:场景模板 game/opTpl 存在时以模板为准
        if(tplTiles.length >= 2){
            if(tplTiles[0].width > 0){ tileW = tplTiles[0].width; }
            if(tplTiles[0].height > 0){ tileH = tplTiles[0].height; }
            step = tplTiles[1].x - tplTiles[0].x;
        }
        var padX = 8, padY = 6, gapG = 14, gapRow = 10, perRow = 2;
        var tplPlate = tpl ? tpl.getChildByName("plate") : null;
        if(tplPlate && tplTiles.length >= 1 && tplPlate.width > 0){
            var padFromTpl = (tplPlate.width - (step * (tplTiles.length - 1) + tileW)) / 2;
            if(padFromTpl > 0){ padX = padFromTpl; }
        }
        var tplPlateH = (tplPlate && tplPlate.height > 0) ? tplPlate.height : 0;
        var grpH = tplPlateH > 0 ? tplPlateH : (tileH + padY * 2);
        var plateH = tileH + padY * 2;
        //分行:每行最多perRow组
        var rows = [];
        for(var g = 0; g < groups.length; g += perRow){
            var rgs = groups.slice(g, g + perRow);
            var rw = 0;
            for(var ri = 0; ri < rgs.length; ++ri){
                var n = rgs[ri].length;
                rw += step * (n - 1) + tileW + padX * 2;
            }
            rw += (rgs.length - 1) * gapG;
            rows.push({ groups: rgs, w: rw });
        }
        var root = new cc.Node("opTiles");
        btn.addChild(root);
        var baseY = 150 + plateH / 2;   //第一行底板中心y(按钮250高,顶部125,留25空隙)
        var rowH = plateH + gapRow;
        for(var r = 0; r < rows.length; ++r){
            var row = rows[r];
            var x = -row.w / 2;
            var cy = baseY + r * rowH;  //超过一行时向上叠
            for(var gi = 0; gi < row.groups.length; ++gi){
                var grp = row.groups[gi];
                var gw = step * (grp.length - 1) + tileW + padX * 2;
                var pn = new cc.Node("grp");
                root.addChild(pn);
                pn.setContentSize(gw, grpH);
                pn.setPosition(x + gw / 2, cy);
                if(tpl && tplTiles.length >= grp.length){
                    //整组克隆模板:牌大小/间距/底色板/财神角标位置全用编辑器里摆的
                    var grpNode = cc.instantiate(tpl);
                    grpNode.active = true;
                    pn.addChild(grpNode);
                    var allTiles = [];
                    for(var ti = 0; ti < grpNode.childrenCount; ++ti){
                        var c2 = grpNode.children[ti];
                        if(c2.name != "plate"){ allTiles.push(c2); }
                    }
                    var firstX = tplTiles[0].x;
                    var lastX = tplTiles[grp.length - 1].x;
                    var cx = (firstX + lastX) / 2;
                    grpNode.setPosition(-cx, 0); //整组按可见牌居中
                    var plateNode = grpNode.getChildByName("plate");
                    if(plateNode){
                        plateNode.width = (lastX - firstX) + tileW + padX * 2;
                        plateNode.x = cx;
                    }
                    for(var t = 0; t < allTiles.length; ++t){
                        var tn = allTiles[t];
                        tn.active = (t < grp.length);
                        if(!tn.active){ continue; }
                        var sp = tn.getComponent(cc.Sprite);
                        if(sp){
                            var tw = tn.width, th = tn.height;
                            sp.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", grp[t]);
                            if(tw > 0 && th > 0){ tn.setContentSize(tw, th); }
                        }
                        if(this.isCaishen(grp[t])){
                            tn.color = cc.color(255, 208, 90); //财神牌和手牌财神同一个金色
                        }
                        this.setCaishenCorner(owner, tn, grp[t]);
                    }
                }else{
                    //模板缺牌时兜底:直接用牌图拼,尺寸取模板牌宽高
                    var gfx = pn.addComponent(cc.Graphics);
                    gfx.roundRect(-gw / 2, -grpH / 2, gw, grpH, 6);
                    gfx.fillColor = cc.color(0, 0, 0, 150);
                    gfx.fill();
                    gfx.strokeColor = cc.color(255, 200, 90, 220);
                    gfx.lineWidth = 2;
                    gfx.stroke();
                    var gx = -(step * (grp.length - 1) + tileW) / 2 + tileW / 2;
                    for(var t2 = 0; t2 < grp.length; ++t2){
                        var nn = new cc.Node("t");
                        pn.addChild(nn);
                        var sp2 = nn.addComponent(cc.Sprite);
                        sp2.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", grp[t2]);
                        sp2.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                        nn.setContentSize(tileW, tileH);
                        nn.setPosition(gx, 0);
                        if(this.isCaishen(grp[t2])){
                            nn.color = cc.color(255, 208, 90);
                        }
                        this.setCaishenCorner(owner, nn, grp[t2]);
                        gx += step;
                    }
                }
                //整组可点:点哪组就直接执行哪组
                if(onPick){
                    (function(pnode, g2){
                        pnode.on(cc.Node.EventType.TOUCH_END, function(e){
                            onPick(g2);
                            if(e){ e.stopPropagation(); }
                        });
                    })(pn, grp);
                }
                x += gw + gapG;
            }
        }
    }
};

module.exports = OpTiles;
