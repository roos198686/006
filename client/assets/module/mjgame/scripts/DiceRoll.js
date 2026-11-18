// 掷色子动画(所有麻将场景共用,不需要在场景里摆节点)
// 用法:
//   var DiceRoll = require("DiceRoll");
//   DiceRoll.play(this.node);            // 开局(game_begin)掷色子
//   if(DiceRoll.isPlaying()){ DiceRoll.after(cb); } else { cb(); }  // 等色子播完再渲染(game_start)
// 流程:两颗色子先后从屏幕右下角飞出 -> 落到牌桌中央 arrow 位置滚动 -> 减速定格 -> 飞回起点后隐藏
// 发牌数据由服务端在色子动画结束后才下发(game_start_push),色子期间客户端没有牌可显示
var ATLAS_PATH = "images/atlas/baoqei_g";
var SIZE = 50;          //单个色子基准尺寸
var FLY = 0.72;         //起飞到落点
var BACK = 0.45;        //回位
var TOTAL = 2.15;

var atlas = null;
var playing = false;
var pending = [];

//动画结束(含跳过/异常):释放 playing 并补发排队的回调
function finish(){
    playing = false;
    var q = pending;
    pending = [];
    for(var i = 0; i < q.length; ++i){
        try{ q[i](); }
        catch(e){ console.error("[色子] 延时回调异常:", (e && e.stack) ? e.stack : e); }
    }
}

function loadAtlas(cb){
    if(atlas){ cb(atlas); return; }
    cc.resources.load(ATLAS_PATH, cc.SpriteAtlas, function(err, a){
        if(!err && a){ atlas = a; }
        cb(atlas || null);
    });
}

function getFaces(a){
    var faces = [];
    if(a){
        for(var i = 1; i <= 6; ++i){
            var f = a.getSpriteFrame("dice_" + i + ".png") || a.getSpriteFrame("dice_" + i);
            if(f){ faces.push(f); }
        }
    }
    return faces;
}

function findNode(root, name){
    if(!root){ return null; }
    if(root.name === name){ return root; }
    var cs = root.children;
    for(var i = 0; i < cs.length; ++i){
        var r = findNode(cs[i], name);
        if(r){ return r; }
    }
    return null;
}

//开局信息节点:底框 Sprite01(内含两颗色子) + 局数 gamecount + 剩余张数 mjcount
//有的场景(漳浦/无金)没有底框 Sprite01,只有局数/余牌两个Label:同样按开场节奏显隐
function openingNodes(host){
    var game = host ? host.getChildByName("game") : null;
    if(!game){ return null; }
    return [game.getChildByName("Sprite01"), game.getChildByName("gamecount"), game.getChildByName("mjcount")];
}

function applyOpeningVisible(host, visible){
    var list = openingNodes(host);
    if(!list){ return; }
    for(var i = 0; i < list.length; ++i){
        var n = list[i];
        if(!n || !cc.isValid(n)){ continue; }
        n.active = visible;
        n.opacity = visible ? 255 : 0;
    }
}

//诊断:把关键分支上报到大厅服日志(server/logs/hall_run.log 里的 [client-dbg])
function dbg(msg){
    try{
        if(cc.vv && cc.vv.http && cc.vv.http.sendRequest){
            cc.vv.http.sendRequest('/dbg_log',{m:("[dice] " + String(msg)).substring(0,300)},function(){});
        }
    }catch(e){}
}

//返回底框/局数/余牌当前的显隐状态,便于日志确认
function openingState(host){
    var list = openingNodes(host);
    if(!list){ return "none"; }
    var names = ["Sprite01","gamecount","mjcount"], out = [];
    for(var i = 0; i < list.length; ++i){
        var n = list[i];
        out.push(names[i] + "=" + (n ? (n.active ? "on" : "off") : "null"));
    }
    return out.join(",");
}

function makeDice(box, size){
    var n = new cc.Node("dice");
    n.parent = box;
    var sp = n.addComponent(cc.Sprite);
    sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    n.setContentSize(size, size);
    n.active = false;
    return { n: n, sp: sp };
}

function run(host, faces, done){
    var box = new cc.Node("diceRollTemp");
    box.parent = host;
    box.setSiblingIndex(host.childrenCount - 1);

    //落点:优先用牌桌中央的 arrow 节点,没有则用场景中心
    var gameChild = host.getChildByName("game");
    var arrow = gameChild ? gameChild.getChildByName("arrow") : null;
    if(!arrow){ arrow = findNode(host, "arrow"); }
    //部分场景在 game 下摆了底框 Sprite01(内含两颗色子 Sprite0/Sprite1):
    //色子动画结束后要停回底框里,回位目标用它们的场景坐标,尺寸/缩放也保持一致
    var frame = gameChild ? gameChild.getChildByName("Sprite01") : null;
    var fd0 = frame ? frame.getChildByName("Sprite0") : null;
    var fd1 = frame ? frame.getChildByName("Sprite1") : null;
    var useFrame = !!(frame && fd0 && fd1);
    var restScale = 1;
    var size = SIZE;
    if(useFrame){
        restScale = frame.scaleX || 1;
        if(fd0.width > 0){ size = fd0.width; }
    }
    var a = makeDice(box, size);
    var b = makeDice(box, size);
    var vs = cc.view.getVisibleSize();
    var vo = cc.view.getVisibleOrigin();
    var centerW = (arrow && cc.isValid(arrow))
        ? arrow.convertToWorldSpaceAR(cc.v2(0, 0))
        : host.convertToWorldSpaceAR(cc.v2(0, 0));
    //起点:屏幕右下侧,两颗错开
    var startW0 = cc.v2(vo.x + vs.width * 0.90, vo.y + vs.height * 0.08);
    var startW1 = cc.v2(vo.x + vs.width * 0.96, vo.y + vs.height * 0.16);
    var randFace = function(){ return faces[Math.floor(Math.random() * faces.length)]; };

    //回位目标:有底框就回底框里两颗色子的位置,没有就回右下角起点(播完销毁)
    var homeW0 = startW0, homeW1 = startW1;
    if(useFrame){
        var fsx = frame.scaleX || 1, fsy = frame.scaleY || 1;
        homeW0 = gameChild.convertToWorldSpaceAR(cc.v2(frame.x + fd0.x * fsx, frame.y + fd0.y * fsy));
        homeW1 = gameChild.convertToWorldSpaceAR(cc.v2(frame.x + fd1.x * fsx, frame.y + fd1.y * fsy));
    }
    var flyScale = 2 * restScale;

    //两颗分开扔:第二颗延迟0.22秒,起点/落点/转速都不同
    var dice = [
        { d: a, startW: startW0, homeW: homeW0, off: cc.v2(-size * 0.6, 8), delay: 0, spin: 0, speed: 900, lastFace: 0, final: randFace(), backAt: 1.50 },
        { d: b, startW: startW1, homeW: homeW1, off: cc.v2(size * 0.6, -8), delay: 0.22, spin: 0, speed: 760, lastFace: 0, final: randFace(), backAt: 1.62 }
    ];
    var t0 = Date.now(), lastT = 0;
    var timer = setInterval(function(){
        if(!cc.isValid(box) || !cc.isValid(a.n) || !cc.isValid(b.n)){
            clearInterval(timer);
            finish();
            return;
        }
        if(!box.activeInHierarchy){
            clearInterval(timer);
            if(box.isValid){ box.destroy(); }
            finish();
            return;
        }
        var t = (Date.now() - t0) / 1000;
        var dt = Math.min(0.05, Math.max(0, t - lastT));
        lastT = t;
        //每帧按最新父节点变换换算局部坐标,避免 Widget 延迟对齐导致落点漂移
        var cW = (arrow && cc.isValid(arrow)) ? arrow.convertToWorldSpaceAR(cc.v2(0, 0)) : centerW;
        var cL = box.convertToNodeSpaceAR(cW);
        for(var i = 0; i < dice.length; ++i){
            var it = dice[i], n = it.d.n, sp = it.d.sp;
            if(t < it.delay){ continue; }
            if(!n.active){ n.active = true; }
            var sL = box.convertToNodeSpaceAR(it.startW);
            var hL = box.convertToNodeSpaceAR(it.homeW);
            var tL = cc.v2(cL.x + it.off.x, cL.y + it.off.y);
            var ft = t - it.delay;
            if(ft < FLY){
                //第一段:从右下角沿抛物线滚到桌中心
                var k = ft / FLY;
                var e = k * k * (3 - 2 * k);
                n.setPosition(
                    sL.x + (tL.x - sL.x) * e,
                    sL.y + (tL.y - sL.y) * e + Math.sin(Math.PI * k) * vs.height * 0.10
                );
                it.spin += it.speed * dt;
                n.angle = -(it.spin % 360);
                n.setScale(flyScale);
                if(t - it.lastFace >= 0.07){ it.lastFace = t; sp.spriteFrame = randFace(); }
            }
            else if(t < it.backAt){
                //第二段:在桌中心继续滚动,最后0.2秒减速定格
                var left = it.backAt - t;
                var factor = left < 0.2 ? Math.max(0, left / 0.2) : 1;
                n.setPosition(tL.x, tL.y);
                it.spin += it.speed * dt * factor;
                n.angle = -(it.spin % 360);
                n.setScale(flyScale);
                if(left < 0.2){
                    n.angle = 0;
                    sp.spriteFrame = it.final;
                } else if(t - it.lastFace >= 0.07){
                    it.lastFace = t;
                    sp.spriteFrame = randFace();
                }
            }
            else if(t < it.backAt + BACK){
                //第三段:带着最终点数飞回底框里的原位(没有底框则飞回右下角起点)
                var bk = (t - it.backAt) / BACK;
                var be = bk * bk * (3 - 2 * bk);
                n.angle = 0;
                sp.spriteFrame = it.final;
                n.setPosition(tL.x + (hL.x - tL.x) * be, tL.y + (hL.y - tL.y) * be);
                n.setScale(flyScale - (flyScale - restScale) * be);
            }
            else{
                n.setPosition(hL.x, hL.y);
                n.angle = 0;
                n.setScale(restScale);
            }
        }
        if(t >= TOTAL){
            clearInterval(timer);
            //把最终点数写回场景底框里的两颗色子,随后底框显示出来就是定格结果
            if(useFrame && cc.isValid(fd0) && cc.isValid(fd1)){
                var s0 = fd0.getComponent(cc.Sprite), s1 = fd1.getComponent(cc.Sprite);
                if(s0){ s0.spriteFrame = dice[0].final; }
                if(s1){ s1.spriteFrame = dice[1].final; }
            }
            if(cc.isValid(box)){ box.destroy(); }
            done();     //先把发牌交出去,再补发排队的弹窗
            finish();
        }
    }, 30);
}

var DiceRoll = {
    isPlaying: function(){ return playing; },

    //是否刚进/重进房间(此时收到的是服务端补发的残局,不该重播动画)
    isReenter: function(){
        return !!(cc.vv && cc.vv.roomEnteredAt && (Date.now() - cc.vv.roomEnteredAt) < 3000);
    },

    //播放掷色子动画;任何跳过/异常都会回调 done,保证发牌不被卡住
    play: function(host, done){
        done = done || function(){};
        if(playing){ return false; }
        if(!host || !cc.isValid(host)){ done(); return false; }
        //回放不看动画
        if(cc.vv.replayMgr && cc.vv.replayMgr.isReplay && cc.vv.replayMgr.isReplay()){ done(); return false; }
        dbg("play start " + openingState(host));
        playing = true;
        loadAtlas(function(a){
            var faces = getFaces(a);
            if(faces.length == 0){
                console.warn("[色子] 图集里没取到 dice_1~6 帧,跳过动画");
                done();
                finish();
                return;
            }
            try{
                run(host, faces, done);
            }catch(e){
                console.error("[色子] 播放异常:", (e && e.stack) ? e.stack : e);
                done();
                finish();
            }
        });
        return true;
    },

    //色子动画播放期间需要延时执行的操作(如叫台弹窗):播完后再执行;没在播就立即执行
    after: function(cb){
        if(typeof cb !== "function"){ return; }
        if(playing){ pending.push(cb); }
        else{ cb(); }
    },

    //等"色子 + 开局发牌"整段动画都播完再执行(叫台弹窗这类不该盖住开局的弹窗用)
    afterOpening: function(comp, cb){
        if(typeof cb !== "function"){ return; }
        this.after(function(){
            var waitDeal = function(){
                if(comp && !cc.isValid(comp.node)){ return; }
                if(comp && comp._dealAnimating && comp._dealAnimUntil && Date.now() < comp._dealAnimUntil){
                    setTimeout(waitDeal, 80);
                    return;
                }
                cb();
            };
            waitDeal();
        });
    },

    //开局动画期间需要隐藏的节点:底框 Sprite01 + 局数 gamecount + 剩余张数 mjcount
    //(只对摆了 Sprite01 底框的场景生效;wujin4/zp 没有底框,不做处理)
    setOpeningVisible: function(comp, visible){
        try{
            applyOpeningVisible(comp && comp.node, visible);
        }catch(e){
            console.error("[色子] 开局信息显示异常:", (e && e.stack) ? e.stack : e);
        }
    }
};

module.exports = DiceRoll;
