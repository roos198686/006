// 麻将开局顺序(唯一入口,所有玩法共用)
// 顺序:进房 -> 掷色子 -> 色子结束显示局数/剩余张数/色子点数 -> 发牌 -> 显示财神 -> 开始游戏
//       结束一局弹结算 -> 关闭弹窗清桌/色子点数/财神 -> 下一局再掷色子
// 场景只提供动作,不写时序:
//   begin(comp,{before,clear})                  新一局:清桌后掷色子
//   start(comp,{info,render,deal,caishen})      发牌数据到达:色子没播完就排队,播完再执行
//   restore(comp,{info,render,caishen})         重进房间:直接铺牌,不播色子/发牌动画
//   end(comp,{clear})                           关闭结算弹窗:清桌
// 状态只在这里流转:dice(色子中) -> waiting(色子中数据到了) -> diceDone(色子完数据没到) -> playing
var DiceRoll = require("DiceRoll");

function isReplay(){
    return !!(cc.vv && cc.vv.replayMgr && cc.vv.replayMgr.isReplay && cc.vv.replayMgr.isReplay());
}

//色子结束:数据到了就按 信息->发牌->财神 渲染;没到就等 game_start
function diceDone(comp){
    if(!comp || !comp.node || !cc.isValid(comp.node)){ return; }
    if(comp._ofState === "waiting"){ render(comp, true); }
    else{ comp._ofState = "diceDone"; }
}

//固定顺序:先亮局数/剩余张数/色子点数,再发牌,最后财神
function render(comp, withDeal){
    var h = comp._ofHooks || {};
    comp._ofState = "playing";
    var data = comp._ofData;
    comp._ofData = null;
    if(h.info){ try{ h.info(); }catch(e){ console.error("[OpeningFlow] info 异常:", (e && e.stack) ? e.stack : e); } }
    if(h.render){ try{ h.render(data); }catch(e){ console.error("[OpeningFlow] render 异常:", (e && e.stack) ? e.stack : e); } }
    if(withDeal && h.deal){ try{ h.deal(); }catch(e){ console.error("[OpeningFlow] deal 异常:", (e && e.stack) ? e.stack : e); } }
    if(h.caishen){ try{ h.caishen(); }catch(e){ console.error("[OpeningFlow] caishen 异常:", (e && e.stack) ? e.stack : e); } }
}

var OpeningFlow = {
    //新一局:先清空桌面,再掷色子;色子播完才允许渲染
    begin: function(comp, hooks){
        if(!comp || !comp.node){ return; }
        comp._ofHooks = hooks || {};
        comp._ofData = null;
        if(hooks && hooks.before){ try{ hooks.before(); }catch(e){ console.error("[OpeningFlow] before 异常:", (e && e.stack) ? e.stack : e); } }
        if(isReplay()){ comp._ofState = "idle"; return; }
        comp._ofState = "dice";
        if(hooks && hooks.clear){ try{ hooks.clear(); }catch(e){ console.error("[OpeningFlow] clear 异常:", (e && e.stack) ? e.stack : e); } }
        var done = function(){ diceDone(comp); };
        //场景可以替换色子播放器(无金有自己的色子动画),但结束时机必须回到这里
        if(hooks && hooks.roll){
            try{ hooks.roll(done); }catch(e){ console.error("[OpeningFlow] roll 异常:", (e && e.stack) ? e.stack : e); done(); }
            return;
        }
        DiceRoll.play(comp.node, done);
    },

    //发牌数据到达:色子还在播就排队,播完由 diceDone 渲染;否则直接渲染
    start: function(comp, hooks, data){
        if(!comp || !comp.node){ return; }
        if(hooks){ comp._ofHooks = hooks; }
        comp._ofData = data;
        var st = comp._ofState;
        if(st === "dice"){ comp._ofState = "waiting"; return; }
        if(st === "waiting"){ return; }
        //色子已经播完、发牌数据才到(服务端延后2400ms下发,通常都会走到这里):
        //这一份是新一局的首份数据,必须走发牌动画
        if(st === "diceDone"){ render(comp, true); return; }
        render(comp, false);
    },

    //重进房间:已有牌局数据,直接铺牌,不播色子也不播发牌动画
    restore: function(comp, hooks, data){
        if(!comp || !comp.node){ return; }
        if(hooks){ comp._ofHooks = hooks; }
        comp._ofData = data || null;
        render(comp, false);
    },

    //关闭结算弹窗:清桌/色子点数/财神
    end: function(comp, hooks){
        var h = hooks || (comp && comp._ofHooks) || {};
        if(cc.vv && cc.vv.replayMgr && cc.vv.replayMgr.isReplay && cc.vv.replayMgr.isReplay()){ return; }
        if(h.clear){ try{ h.clear(); }catch(e){ console.error("[OpeningFlow] clear 异常:", (e && e.stack) ? e.stack : e); } }
    },

    isOpening: function(comp){
        return !!(comp && (comp._ofState === "dice" || comp._ofState === "waiting" || comp._ofState === "diceDone"));
    }
};

module.exports = OpeningFlow;
