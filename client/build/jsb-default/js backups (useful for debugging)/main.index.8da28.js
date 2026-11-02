window.__require = function e(t, i, n) {
function a(s, c) {
if (!i[s]) {
if (!t[s]) {
var r = s.split("/");
r = r[r.length - 1];
if (!t[r]) {
var l = "function" == typeof __require && __require;
if (!c && l) return l(r, !0);
if (o) return o(r, !0);
throw new Error("Cannot find module '" + s + "'");
}
s = r;
}
var h = i[s] = {
exports: {}
};
t[s][0].call(h.exports, function(e) {
return a(t[s][1][e] || e);
}, h, h.exports, e, t, i, n);
}
return i[s].exports;
}
for (var o = "function" == typeof __require && __require, s = 0; s < n.length; s++) a(n[s]);
return a;
}({
Alert: [ function(e, t) {
"use strict";
cc._RF.push(t, "f94d6YENh9BzbX+OMiJMLIg", "Alert");
cc.Class({
extends: cc.Component,
properties: {
_alert: null,
_btnOK: null,
_btnCancel: null,
_title: null,
_content: null,
_onok: null
},
onLoad: function() {
if (null != cc.vv) {
this._alert = cc.find("Canvas/alert");
this._title = cc.find("Canvas/alert/title").getComponent(cc.Label);
this._content = cc.find("Canvas/alert/content").getComponent(cc.Label);
this._title.node.color = cc.color(0, 0, 0);
this._content.node.color = cc.color(0, 0, 0);
this._btnOK = cc.find("Canvas/alert/btn_ok");
this._btnCancel = cc.find("Canvas/alert/btn_cancel");
cc.vv.utils.addClickEvent(this._btnOK, this.node, "Alert", "onBtnClicked");
cc.vv.utils.addClickEvent(this._btnCancel, this.node, "Alert", "onBtnClicked");
this._alert.active = !1;
cc.vv.alert = this;
}
},
onBtnClicked: function(e) {
"btn_ok" == e.target.name && this._onok && this._onok();
this._alert.active = !1;
this._onok = null;
},
show: function(e, t, i, n) {
this._alert.active = !0;
this._onok = i;
null != e && this._title && (this._title.string = e);
null != t && this._content && (this._content.string = t);
if (n) {
this._btnCancel.active = !0;
this._btnOK.x = -150;
this._btnCancel.x = 150;
} else {
this._btnCancel.active = !1;
this._btnOK.x = 0;
}
},
onDestroy: function() {
cc.vv && (cc.vv.alert = null);
}
});
cc._RF.pop();
}, {} ],
BBGame: [ function(e, t) {
"use strict";
cc._RF.push(t, "bb6aeHAEABAAIAAugugAAAB", "BBGame");
var i = {
fire: "bbfx_fire.mp3",
bomb: "bbfx_bomb.mp3",
pairs: "bbfx_pairs.mp3",
nine: "bbfx_pairs.mp3"
};
cc.Class({
extends: cc.Component,
properties: {},
seatLayout: function(e) {
var t = {
2: [ 0, 3 ],
3: [ 0, 1, 4 ],
4: [ 0, 1, 3, 4 ],
5: [ 0, 1, 2, 3, 4 ],
6: [ 0, 1, 2, 3, 4, 5 ]
};
return t[e] || t[6];
},
findNode: function(e, t) {
if (!e) return null;
if (e.name == t) return e;
for (var i = e.children, n = 0; n < i.length; ++n) {
var a = this.findNode(i[n], t);
if (a) return a;
}
return null;
},
setStr: function(e, t) {
if (e) {
var i = e.getComponent(cc.Label);
i && (i.string = t);
}
},
_setSettleContentStyle: function(e, t, i) {
var n = this._n.resultContent;
if (n && cc.isValid(n)) {
var a = n.getComponent(cc.Label);
if (a) {
a.fontSize = e;
a.lineHeight = t;
}
null != i && (n.y = i);
}
},
bindButton: function(e, t, i) {
if (e) {
var n = e.getComponent(cc.Button);
n && (n.transition = cc.Button.Transition.NONE);
e.off(cc.Node.EventType.TOUCH_END);
e.on(cc.Node.EventType.TOUCH_END, function() {
t.call(i);
});
}
},
rankOf: function(e) {
return Math.floor(e / 4) + 2;
},
suitOf: function(e) {
return e % 4;
},
dianVal: function(e) {
return e >= 11 && e <= 13 ? 0 : 14 == e ? 1 : e;
},
cardFrameKey: function(e) {
var t = this.rankOf(e);
return [ "Spade", "Heart", "Club", "Diamond" ][this.suitOf(e)] + ({
11: "J",
12: "Q",
13: "K",
14: "A"
}[t] || "" + t);
},
frameOf: function(e) {
return this._cardFrames && this._cardFrames[this.cardFrameKey(e)] || null;
},
loadCardFrames: function() {
var e = this;
this._cardFrames = {};
cc.resources.load("images/atlas/cards", cc.SpriteAtlas, function(t, i) {
if (!t && i) {
for (var n = [ "Spade", "Heart", "Club", "Diamond" ], a = [ "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A" ], o = 0; o < n.length; ++o) for (var s = 0; s < a.length; ++s) {
var c = n[o] + a[s], r = h(c);
r && (e._cardFrames[c] = r);
}
e._cardBack = h("card_back");
e._confirmRoot && e._confirmRoot.active && e._fillConfirmCards();
e._arrangeRoot && e._arrangeRoot.active && e._renderArrange();
if (e._n.resultPanel && e._n.resultPanel.active && e._lastResults) {
var l = e._renderSettleCards(e._lastResults, e._lastDetails);
e._n.resultContent && (e._n.resultContent.active = !l);
}
e._started && e.renderCards();
} else console.log("[BB] load cards atlas failed", t);
function h(e) {
return i.getSpriteFrame(e + ".png") || i.getSpriteFrame(e);
}
});
},
loadFireFrames: function() {
var e = this;
function t(t, i) {
cc.resources.loadDir(t, cc.SpriteFrame, function(n, a) {
if (!n && a && a.length) {
a.sort(function(e, t) {
return e.name < t.name ? -1 : e.name > t.name ? 1 : 0;
});
e[i] = a;
} else console.log("[BB] load " + t + " failed", n);
});
}
t("images/bbfx_fire", "_fireFrames");
t("images/bbfx_bomb", "_bombFrames");
t("images/bbfx_pairs", "_pairsFrames");
},
onLoad: function() {
var e = cc.vv.gameNetMgr;
this._n = {};
this._seatNodes = [];
this._revealByGs = {};
this._revealCounts = null;
this._revealDone = !1;
this._revealRunning = !1;
this._started = !1;
this._final = !1;
this._leaving = !1;
this._arranging = !1;
this._arrangeRemain = 0;
this._arrangeRemainAt = 0;
this._daoSel = [ [ null, null ], [ null, null ], [ null, null ] ];
this._arrangeRows = null;
this._arrangeRoot = null;
this._confirmRoot = null;
this._confirmRemain = 0;
this._confirmRemainAt = 0;
this._confirmCount = 0;
this._confirmAutoShown = !1;
this._confirmMoving = !1;
this._cdTimer = null;
this._dealTimer = null;
this._dealing = !1;
this._slotHome = null;
this._cdLabel = null;
this._myContinued = !1;
this._shufflePending = !1;
this._shuffleRoot = null;
this._watching = !1;
this._mySeat = 0;
this._total = 2;
this._gameType = null;
this._exitPending = !1;
this._settle1Done = !0;
this._summaryShown = !1;
this._roomEnd = !1;
this._backTimer = null;
this._endDetail = null;
this._settleClosedAt = 0;
var t = this;
cc.vv && (cc.vv.bbExitHook = function() {
t.onExitRequest();
});
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playBGM("bgFight.mp3");
try {
this._findNodes();
this._n.prepare && this._n.game && this._n.prepare.setSiblingIndex(this._n.game.getSiblingIndex() + 1);
this._buildSeatContainers();
this._buildArrangeUI();
this._buildConfirmUI();
this._shuffleRoot = this.findNode(this.node, "bbShuffleAnim");
this._shuffleRoot && (this._shuffleRoot.active = !1);
this.loadCardFrames();
this.loadFireFrames();
this._preloadBackScene();
this._bindButtons();
this._bindEvents();
e && (e.dataEventHandler = this.node);
this.refreshFromState();
} catch (e) {
console.error("[BB] onLoad failed: " + (e && e.message || e) + " @ " + (e && e.stack || ""));
}
console.log("[BB] onLoad done");
},
_findNodes: function() {
var e = this._n, t = this.node;
e.infobar = this.findNode(t, "infobar");
e.titleLabel = this.findNode(e.infobar, "titleLabel");
e.prepare = this.findNode(t, "prepare");
e.game = this.findNode(t, "game");
e.up = this.findNode(e.game, "up");
e.tipLabel = this.findNode(e.game, "tipLabel");
e.countdownLabel = this.findNode(e.game, "countdownLabel");
e.readyBtn = this.findNode(e.prepare, "readyBtn");
e.exitBtn = this.findNode(e.prepare, "exitBtn");
e.dissolveBtn = this.findNode(e.prepare, "dissolveBtn");
e.resultPanel = this.findNode(t, "settlePanel");
e.resultTitle = this.findNode(e.resultPanel, "settleTitle");
e.resultContent = this.findNode(e.resultPanel, "settleContent");
var i = e.resultContent ? e.resultContent.getComponent(cc.Label) : null;
this._settleFontSize = i ? i.fontSize : 32;
this._settleLineHeight = i ? i.lineHeight : 46;
this._settleContentY = e.resultContent ? e.resultContent.y : 108;
e.resultCloseBtn = this.findNode(e.resultPanel, "settleAgainBtn");
e.resultExitBtn = this.findNode(e.resultPanel, "settleExitBtn");
e.resultCloseLabel = this.findNode(e.resultCloseBtn, "settleAgainBtnLabel");
e.resultExitLabel = this.findNode(e.resultExitBtn, "settleExitBtnLabel");
e.resultList = this.findNode(e.resultPanel, "result_list");
e.settleWin = this.findNode(e.resultPanel, "win");
e.settleLose = this.findNode(e.resultPanel, "lose");
e.btnReady = this.findNode(e.resultPanel, "btnReady");
e.dissolvePanel = this.findNode(t, "dissolvePanel");
e.dissolveAgreeBtn = this.findNode(t, "dissolveAgreeBtn");
e.dissolveRejectBtn = this.findNode(t, "dissolveRejectBtn");
},
_buildSeatContainers: function() {
var e = this._n;
if (e.up) for (var t = 0; t < 6; ++t) {
var i = this.findNode(e.up, "bbSeat" + t);
if (i) i.active = !1; else {
i = this._makeSeatFallback(t);
e.up.addChild(i);
}
i.name = "bbSeat" + t;
for (var n = this.findNode(i, "icon"), a = this.findNode(i, "name"), o = this.findNode(i, "score"), s = this.findNode(i, "bbZhuang"), c = this.findNode(i, "ready"), r = [], l = [], h = 0; h < 3; ++h) {
for (var d = 0; d < 2; ++d) {
var u = this.findNode(i, "bbCard" + (2 * h + d));
if (u) {
u.active = !1;
r.push(u);
}
}
var v = this.findNode(i, "bbDao" + h);
l.push(v);
}
var g = this.findNode(i, "bbSummary");
s && (s.active = !1);
this._seatNodes[t] = {
root: i,
icon: n,
nameLabel: a,
scoreLabel: o,
zhuang: s,
readyMark: c,
slots: r,
daoLabels: l,
summary: g
};
}
},
_layoutSeatFallback: function(e, t) {
var i = [ [ 0, -197 ], [ -420, 110 ], [ -420, -40 ], [ 0, 150 ], [ 420, 110 ], [ 420, -40 ] ][t];
e.setContentSize(260, 180);
e.setScale(.85);
e.setPosition(i[0], i[1]);
},
_makeSeatFallback: function(e) {
var t = new cc.Node("bbSeat"), i = new cc.Node("icon");
i.addComponent(cc.Sprite);
try {
i.addComponent("ImageLoader");
} catch (e) {}
t.addChild(i);
for (var n = 0; n < 6; ++n) {
var a = new cc.Node("bbCard" + n);
a.addComponent(cc.Sprite);
t.addChild(a);
}
this._layoutSeatFallback(t, e);
return t;
},
_buildArrangeUI: function() {
var e = this.findNode(this.node, "bbArrange");
if (e && !this._arrangeRoot) {
for (var t = [], i = 0; i < 3; ++i) t.push({
nameLbl: this.findNode(e, "bbArrName" + i),
slots: [ this.findNode(e, "bbArrCard" + 2 * i), this.findNode(e, "bbArrCard" + (2 * i + 1)) ],
desc: this.findNode(e, "bbArrDesc" + i)
});
this._arrangeRoot = e;
this._arrangeRows = t;
this._arrangeDaoHome = [];
for (var n = 0; n < 3; ++n) {
for (var a = [], o = 0; o < 2; ++o) {
var s = t[n].slots[o];
a.push(s ? {
x: s.x,
y: s.y,
sx: s.scaleX,
sy: s.scaleY
} : null);
}
this._arrangeDaoHome.push(a);
}
this._arrangeTip = this.findNode(e, "bbArrangeTip");
this._arrangeTitle = this.findNode(e, "bbArrangeTitle");
this._arrangeAutoBtn = this.findNode(e, "bbAutoBtn");
this._arrangeOkBtn = this.findNode(e, "bbOkBtn");
this._arrangeCd = this.findNode(e, "bbArrangeCd");
this._arrangeCd && (this._arrangeCd.active = !0);
this._arrangeHandSlots = [];
this._arrangeHandHome = [];
for (var c = 0; c < 6; ++c) {
var r = this.findNode(e, "bbArrHand" + c);
this._arrangeHandSlots.push(r);
this._arrangeHandHome.push(r ? {
x: r.x,
y: r.y,
sx: r.scaleX,
sy: r.scaleY
} : null);
}
this._bindArrangeDrag();
e.active = !1;
}
},
_buildConfirmUI: function() {
var e = this.findNode(this.node, "bbConfirm");
if (e && !this._confirmRoot) {
for (var t = [], i = 0; i < 6; ++i) t.push(this.findNode(e, "bbConfirmCard" + i));
for (var n = [], a = 0; a < 6; ++a) n.push(this.findNode(e, "bbConfirmTopCard" + a));
this._confirmRoot = e;
this._confirmType = this.findNode(e, "bbConfirmType");
this._confirmCards = t;
this._confirmTopCards = n;
this._confirmHint = this.findNode(e, "bbConfirmHint");
this._confirmCd = this.findNode(e, "bbConfirmCd");
this._confirmCd && (this._confirmCd.active = !0);
this._confirmBtn = this.findNode(e, "bbConfirmBtn");
this._confirmAutoBtn = this.findNode(e, "bbConfirmBtn-a");
this._confirmTitle = this.findNode(e, "bbConfirmTitle");
this._settleCd = this.findNode(this._n.resultPanel, "settleCd");
for (var o = 0; o < t.length; ++o) t[o] && (t[o].active = !1);
e.active = !1;
}
},
_bindButtons: function() {
this.bindButton(this._n.readyBtn, this.onReady, this);
this.bindButton(this._n.exitBtn, this.onExit, this);
this.bindButton(this._n.dissolveBtn, this.onDissolve, this);
this.bindButton(this._confirmBtn, this.onConfirmTap, this);
this.bindButton(this._confirmAutoBtn, this.onConfirmAuto, this);
this.bindButton(this._arrangeOkBtn, this.onConfirmArrange, this);
this.bindButton(this._arrangeAutoBtn, this.onAutoArrange, this);
this.bindButton(this._n.resultCloseBtn, this.onResultClose, this);
this._resultShuffleBtn = this.findNode(this.node, "bbShuffleBtn");
this.bindButton(this._resultShuffleBtn, this.onResultShuffle, this);
this._exitRoomBtn = this.findNode(this.node, "bbExitRoomBtn");
this.bindButton(this._exitRoomBtn, this.onExitRoom, this);
this._ensureSettleBtnFrames();
this.bindButton(this._n.resultExitBtn, this.onExit, this);
this.bindButton(this._n.dissolveAgreeBtn, this.onDissolveAgree, this);
this.bindButton(this._n.dissolveRejectBtn, this.onDissolveReject, this);
var e = this._seatNodes[0];
if (e && e.slots) for (var t = 0; t < 6; ++t) (function(e, t) {
if (t) {
t.on(cc.Node.EventType.TOUCH_START, function(t) {
this.onHandTouchStart(e, t);
}, this);
t.on(cc.Node.EventType.TOUCH_MOVE, function(t) {
this.onHandTouchMove(e, t);
}, this);
t.on(cc.Node.EventType.TOUCH_END, function(t) {
this.onHandTouchEnd(e, t);
}, this);
t.on(cc.Node.EventType.TOUCH_CANCEL, function(t) {
this.onHandTouchEnd(e, t);
}, this);
}
})(t, e.slots[t]);
},
_bindEvents: function() {
var e = this;
this.node.on("bb_start", function(t) {
e.onBbStart(t && t.detail);
});
this.node.on("bb_reveal", function(t) {
e.onBbReveal(t && t.detail);
});
this.node.on("bb_arrange_start", function(t) {
e.onArrangeStart(t && t.detail);
});
this.node.on("bb_arrange_ok", function(t) {
e.onArrangeOk(t && t.detail);
});
this.node.on("bb_confirm_start", function(t) {
e.onConfirmStart(t && t.detail);
});
this.node.on("bb_confirm_ok", function(t) {
e.onConfirmOk(t && t.detail);
});
this.node.on("bb_continue_ok", function(t) {
e.onContinueOk(t && t.detail);
});
this.node.on("bb_wait_next", function() {
e.showTip("本局进行中，本局结束后自动加入下一局");
e._queuedNext = !0;
});
this.node.on("bb_error", function(t) {
var i = t && t.detail;
e.showTip(i && i.msg || "操作错误");
"baobao_shou" != e._gameType || cc.vv.gameNetMgr.bbArranged || e.showArrangeUI(e._arrangeRemain);
});
this.node.on("game_over", function(t) {
e.onGameOver(t && t.detail);
});
this.node.on("game_end", function(t) {
e.onGameEnd(t && t.detail);
});
this.node.on("user_state_changed", function(t) {
e.onUserStateChanged(t && t.detail);
});
this.node.on("new_user", function() {
e.renderSeats();
});
this.node.on("exit_notify", function() {
e.renderSeats();
});
this.node.on("game_num", function() {
e.updateRoomInfo();
});
this.node.on("game_begin", function() {
e.updateRoomInfo();
});
this.node.on("dissolve_notice", function() {
e._n.dissolvePanel && (e._n.dissolvePanel.active = !0);
});
this.node.on("dissolve_cancel", function() {
e._n.dissolvePanel && (e._n.dissolvePanel.active = !1);
});
this.node.on("dispress_push", function() {
e.leaveRoom();
});
this.node.on("bb_kicked", function(t) {
var i = t && t.detail;
cc.vv && (cc.vv.bbKickTip = "因宝宝豆不足，已自动退出房间！");
e.showTip(i && i.msg || "宝宝豆不足，已被请出房间");
e._backTimer || (e._backTimer = setTimeout(function() {
e._backTimer = null;
cc.isValid(e.node) && !e._leaving && e.leaveRoom();
}, 800));
});
this.node.on("disconnect", function() {
e.showTip("连接断开，正在返回…");
e._backTimer || (e._backTimer = setTimeout(function() {
e._backTimer = null;
cc.isValid(e.node) && !e._leaving && e.leaveRoom();
}, 3e3));
});
this.node.on("reconnect", function() {
e.showTip("");
if (e._backTimer) {
clearTimeout(e._backTimer);
e._backTimer = null;
}
});
this.node.on("exit_result", function() {
if (e._exitTimer) {
clearTimeout(e._exitTimer);
e._exitTimer = null;
}
e._leaving || e.leaveRoom();
});
},
_preloadBackScene: function() {
var e = cc.vv.gameNetMgr, t = e && "club" === e.roomBackScene || cc.vv.fromClubId ? "club" : "hall";
try {
cc.director.preloadScene(t, function() {});
} catch (e) {}
},
refreshFromState: function() {
var e = cc.vv.gameNetMgr;
this.updateRoomInfo();
if ("begin" == e.gamestate && e.bbMyCards && e.bbMyCards.length > 0) {
this._started = !0;
this._final = !1;
this._gameType = e.bbGameType;
this._applyBbConf(null);
this._mySeat = e.bbMySeat >= 0 ? e.bbMySeat : 0;
this._revealByGs = {};
e.bbMyDaos && 3 == e.bbMyDaos.length && (this._daoSel = this._normDaos(e.bbMyDaos));
this._showGameUI();
this.renderSeats();
this.renderCards();
if ("baobao_shou" != this._gameType || "arrange" != e.bbPhase || e.bbArranged) {
this.hideArrangeUI();
if ("baobao_mian" == e.bbGameType) if ("confirm" == e.bbPhase) {
if (e.bbConfirmDeadline) {
this._confirmRemain = Math.max(0, Math.ceil((e.bbConfirmDeadline - Date.now()) / 1e3));
this._confirmRemainAt = Date.now();
}
if (e.bbConfirmed) {
this.hideConfirmUI();
this.showTip("已确定，等待其他玩家…");
} else this.showConfirmUI();
} else "reveal" == e.bbPhase ? this.showTip("等待结算…") : this.showTip("系统拆牌中…");
} else this.showArrangeUI(e.bbArrangeDeadline);
} else this._n.resultPanel && this._n.resultPanel.active || this.showPrepareUI();
e.numOfGames >= e.maxNumOfGames && e.maxNumOfGames > 0 && (this._final = !0);
},
_showGameUI: function() {
this._n.readyBtn && (this._n.readyBtn.active = !1);
this._n.dissolveBtn && (this._n.dissolveBtn.active = !1);
this._n.exitBtn && (this._n.exitBtn.active = !1);
this._exitRoomBtn && (this._exitRoomBtn.active = !1);
this._n.resultPanel && (this._n.resultPanel.active = !1);
},
showPrepareUI: function() {
this._started = !1;
this._arranging = !1;
this._revealByGs = {};
this.hideArrangeUI();
this._n.resultPanel && (this._n.resultPanel.active = !1);
var e = cc.vv.gameNetMgr, t = e.seats && e.seatIndex >= 0 ? e.seats[e.seatIndex] : null, i = !(!t || !t.ready);
this._n.readyBtn && (this._n.readyBtn.active = !i);
this._n.dissolveBtn && (this._n.dissolveBtn.active = !1);
this._n.exitBtn && (this._n.exitBtn.active = !0);
this._clearCards();
this.renderSeats();
this.updateRoomInfo();
this.showTip("");
},
_clearCards: function() {
for (var e = 0; e < this._seatNodes.length; ++e) {
for (var t = this._seatNodes[e], i = 0; i < 6; ++i) if (t.slots[i]) {
t.slots[i].active = !1;
t.slots[i].color = cc.Color.WHITE;
}
for (var n = 0; n < 3; ++n) this.setStr(t.daoLabels[n], "");
this.setStr(t.summary, "");
}
this._renderArrange();
},
onConfirmStart: function(e) {
var t = cc.vv.gameNetMgr;
if (e) if (null != e.remain) {
this._confirmRemain = e.remain;
this._confirmRemainAt = Date.now();
t.bbConfirmRemain = e.remain;
} else if (e.deadline) {
this._confirmRemain = Math.max(0, Math.ceil((e.deadline - Date.now()) / 1e3));
this._confirmRemainAt = Date.now();
t.bbConfirmRemain = this._confirmRemain;
}
e && e.myMian && (t.bbMyMian = e.myMian);
if (t.bbConfirmed) {
this.hideConfirmUI();
this.showTip("已确认，等待其他玩家…");
} else this._animBusy || this._dealing || !this._started || this.showConfirmUI();
},
onConfirmOk: function(e) {
if (e) {
var t = cc.vv.gameNetMgr;
e.seatIndex == t.bbMySeat && (t.bbConfirmed = !0);
if (null != e.confirmedCount) {
this._confirmCount = e.confirmedCount;
this._confirmHint && this.setStr(this._confirmHint, "已确定 " + e.confirmedCount + "/" + (e.total || this._total) + "，等待其他玩家…");
}
if (t.bbConfirmed) {
this.hideConfirmUI();
this.showTip("已确定 (" + (null != e.confirmedCount ? e.confirmedCount : this._confirmCount) + "/" + (e.total || this._total) + ")，等待其他玩家…");
}
}
},
showConfirmUI: function() {
var e = cc.vv.gameNetMgr;
this._buildConfirmUI();
var t = this._confirmRoot;
console.log("[BB] 免摆弹窗 root=" + !!t + " phase=" + e.bbPhase + " mian=" + JSON.stringify(e.bbMyMian));
if (t) {
for (var i = t.parent; i && i.parent; ) {
i.active || (i.active = !0);
i = i.parent;
}
t.active = !0;
var n = t.parent;
n && t.setSiblingIndex(n.children.length - 1);
this._clearConfirmFly();
var a = e.bbMyMian;
this._confirmType && this.setStr(this._confirmType, a ? (a.typeName || "") + "  ×" + (a.rate || 1) : "计算中…");
this._confirmAutoShown = !1;
this._confirmMoving = !1;
this._confirmAutoBtn && (this._confirmAutoBtn.opacity = 255);
this._confirmBtn && (this._confirmBtn.opacity = 120);
this._fillConfirmCards();
this._confirmCount = 0;
this._startCountdown(this._leftOf(null != this._confirmRemain ? this._confirmRemain : e.bbConfirmRemain || 0, this._confirmRemainAt), this._confirmCd, function() {
this.hideConfirmUI();
this.showTip("超时未操作，系统自动免摆亮牌");
cc.vv.net.send("bb_confirm");
});
} else console.error("[BB] 场景内找不到 bbConfirm 节点");
},
_fillConfirmCards: function() {
for (var e = cc.vv.gameNetMgr, t = e.bbMyCards || [], i = e.bbMyMian, n = i && i.cards && i.cards.length ? i.cards : t, a = 0; a < 6; ++a) {
var o = this._confirmCards && this._confirmCards[a];
if (o) if (null != t[a]) {
o.active = !0;
var s = o.getComponent(cc.Sprite);
s && (s.spriteFrame = this.frameOf(t[a]) || this._cardBack || null);
} else o.active = !1;
var c = this._confirmTopCards && this._confirmTopCards[a];
if (c) if (this._confirmAutoShown && null != n[a]) {
c.active = !0;
var r = c.getComponent(cc.Sprite);
r && (r.spriteFrame = this.frameOf(n[a]) || this._cardBack || null);
} else c.active = !1;
}
},
onConfirmAuto: function() {
if (!this._confirmAutoShown && !this._confirmMoving) {
this._confirmAutoShown = !0;
this._confirmMoving = !0;
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("sort.wav");
this._confirmAutoBtn && (this._confirmAutoBtn.opacity = 120);
for (var e = cc.vv.gameNetMgr, t = (e.bbMyCards || []).slice(), i = e.bbMyMian, n = i && i.cards && i.cards.length ? i.cards : t, a = {}, o = this, s = 0; s < 6; ++s) {
var c = n[s];
if (null != c) {
for (var r = -1, l = 0; l < 6; ++l) if (!a[l] && t[l] === c) {
r = l;
break;
}
if (!(r < 0)) {
a[r] = !0;
(function(e, t, i) {
setTimeout(function() {
o._moveConfirmCard(e, t, i);
}, 150 * t);
})(r, s, c);
}
}
}
setTimeout(function() {
if (cc.isValid(o.node)) {
o._confirmMoving = !1;
o._confirmBtn && (o._confirmBtn.opacity = 255);
}
}, 1050);
}
},
_moveConfirmCard: function(e, t, i) {
var n = this._confirmCards && this._confirmCards[e], a = this._confirmTopCards && this._confirmTopCards[t], o = this.frameOf(i) || this._cardBack || null;
if (n && a && cc.isValid(n) && cc.isValid(a)) {
var s = n.parent, c = a.position;
if (a.parent !== s) {
var r = a.convertToWorldSpaceAR(cc.v2(0, 0));
c = s.convertToNodeSpaceAR(r);
}
var l = new cc.Node("confirmFly");
l.addComponent(cc.Sprite).spriteFrame = o;
l.parent = s;
l.setPosition(n.position);
l.setScale(n.scaleX, n.scaleY);
n.active = !1;
l.runAction(cc.sequence(cc.moveTo(.25, c), cc.callFunc(function() {
l.destroy();
if (cc.isValid(a)) {
a.active = !0;
var e = a.getComponent(cc.Sprite);
e && (e.spriteFrame = o);
}
})));
} else if (a && cc.isValid(a)) {
a.active = !0;
var h = a.getComponent(cc.Sprite);
h && (h.spriteFrame = o);
}
},
hideConfirmUI: function() {
this._clearConfirmFly();
this._confirmMoving = !1;
var e, t;
for (e = 0; this._confirmCards && e < 6; ++e) {
var i = this._confirmCards[e];
if (i) {
i.active = !1;
(t = i.getComponent(cc.Sprite)) && (t.spriteFrame = null);
}
}
for (e = 0; this._confirmTopCards && e < 6; ++e) {
var n = this._confirmTopCards[e];
if (n) {
n.active = !1;
(t = n.getComponent(cc.Sprite)) && (t.spriteFrame = null);
}
}
this._confirmRoot && (this._confirmRoot.active = !1);
this._stopCountdown();
},
_clearConfirmFly: function() {
var e = this._confirmRoot;
if (e) for (var t = [ e ]; t.length > 0; ) for (var i = t.pop().children.slice(), n = 0; n < i.length; ++n) if (cc.isValid(i[n])) if ("confirmFly" === i[n].name) {
i[n].stopAllActions();
i[n].destroy();
} else t.push(i[n]);
},
onConfirmTap: function() {
var e = cc.vv.gameNetMgr;
if (this._confirmRoot && this._confirmRoot.active && !e.bbConfirmed) if (this._confirmMoving) this.showTip("摆牌中，请稍候…"); else if (this._confirmAutoShown) {
e.bbConfirmed = !0;
cc.vv.net.send("bb_confirm");
this.hideConfirmUI();
this.showTip("已确定 (" + (this._confirmCount + 1) + "/" + (this._total || 2) + ")，等待其他玩家…");
} else this.showTip("请先点击「免摆」按钮");
},
_leftOf: function(e, t) {
var i = Number(e) || 0;
return t ? Math.max(0, i - Math.floor((Date.now() - t) / 1e3)) : i;
},
_startCountdown: function(e, t, i) {
this._stopCountdown();
if (t) {
var n = this;
this._cdLabel = t;
this._cdEnd = i || null;
this._cdBase = Math.max(0, Math.floor(Number(e) || 0));
this._cdStartAt = Date.now();
this._cdAlarmed = !1;
this._cdTick();
this._cdTimer = setInterval(function() {
n._cdTick();
}, 200);
}
},
_cdTick: function() {
if (this._cdLabel) {
var e = Math.max(0, this._cdBase - Math.floor((Date.now() - this._cdStartAt) / 1e3));
this.setStr(this._cdLabel, "" + e);
if (e > 0 && e <= 5 && !this._cdAlarmed) {
this._cdAlarmed = !0;
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("timeup_alarm.wav");
}
if (e <= 0) {
var t = this._cdEnd;
this._stopCountdown();
t && t.call(this);
}
}
},
_stopCountdown: function() {
if (this._cdTimer) {
clearInterval(this._cdTimer);
this._cdTimer = null;
}
this._cdLabel = null;
this._cdEnd = null;
},
onDestroy: function() {
if (this._backTimer) {
clearTimeout(this._backTimer);
this._backTimer = null;
}
cc.vv && cc.vv.bbExitHook && (cc.vv.bbExitHook = null);
this._stopCountdown();
this._stopDeal();
},
_layoutOf: function(e) {
e = Math.max(2, Math.min(6, e));
return this.seatLayout(e);
},
_seatInfoOfOffsetInGame: function(e, t) {
var i = cc.vv.gameNetMgr, n = (this._mySeat + e) % t, a = i.bbSeats ? i.bbSeats[n] : null, o = a && i.seats ? i.seats[a.roomSeatIndex] : null;
return {
gs: n,
userid: a ? a.userid : null,
name: a && a.name || "",
score: o && null != o.score ? o.score : a && null != a.score ? a.score : null,
isBanker: !!i.bbBankerMode && n == i.bbBankerSeat,
ready: !(!a || !a.arranged)
};
},
renderSeats: function() {
var e, t = cc.vv.gameNetMgr, i = [];
if (this._started && t.bbSeats && t.bbSeats.length > 0) {
e = Math.max(2, Math.min(6, t.bbSeats.length));
this._total = e;
for (var n = 0; n < e; ++n) i.push({
offset: n,
info: this._seatInfoOfOffsetInGame(n, e)
});
} else {
for (var a = t.seats || [], o = a.length, s = t.seatIndex >= 0 ? t.seatIndex : 0, c = [], r = 0; r < o; ++r) {
var l = a[r];
l && l.userid && c.push({
i: r,
rel: (r - s + o) % o
});
}
c.sort(function(e, t) {
return e.rel - t.rel;
});
e = Math.max(2, Math.min(6, c.length));
this._total = e;
for (var h = 0; h < c.length && h < e; ++h) {
var d = a[c[h].i];
i.push({
offset: h,
info: {
gs: c[h].i,
userid: d.userid,
name: d.name || "",
score: null != d.score ? d.score : 0,
isBanker: !1,
ready: !!d.ready
}
});
}
}
for (var u = 0; u < 6; ++u) {
var v = this._seatNodes[u];
if (v) {
v.root.active = !1;
if (v.icon) {
var g = v.icon.getComponent("ImageLoader");
if (g) g.clearAvatar ? g.clearAvatar() : (g._spriteFrame = null, g.setupSpriteFrame()); else {
var _ = v.icon.getComponent(cc.Sprite);
_ && (_.spriteFrame = null);
}
}
}
}
for (var f = this._layoutOf(e), m = 0; m < i.length; ++m) {
var p = f[i[m].offset], b = this._seatNodes[p];
if (b) {
b.root.active = !0;
this.setStr(b.nameLabel, i[m].info.name || "");
this.setStr(b.scoreLabel, null != i[m].info.score ? "" + i[m].info.score : "");
b.zhuang && (b.zhuang.active = !!i[m].info.isBanker);
b.readyMark && (b.readyMark.active = !!i[m].info.ready);
if (b.icon) {
var C = b.icon.getComponent("ImageLoader");
if (!C) try {
C = b.icon.addComponent("ImageLoader");
} catch (e) {}
C && i[m].info.userid && C.setUserID(i[m].info.userid);
}
}
}
},
updateRoomInfo: function() {
var e = cc.vv.gameNetMgr, t = e.conf || {}, i = null == t.banker_mode || Number(t.banker_mode) ? "有庄" : "无庄", n = Number(t.min_bean) || 0, a = "房号:" + (e.roomId || "") + "  " + e.getWanfa() + "  " + i + "  最低豆" + n;
e.maxNumOfGames > 0 && (a += "  第" + e.numOfGames + "/" + e.maxNumOfGames + "局");
e.bbSeats && e.bbSeats[e.bbBankerSeat] && e.bbBankerMode && (a += "  庄:" + (e.bbSeats[e.bbBankerSeat].name || ""));
this.setStr(this._n.titleLabel, a);
},
onBtnSettingsClicked: function() {
var e = this.findNode(this.node, "settings");
e && (e.active = !0);
},
_mianOrder: function(e) {
for (var t = {}, i = this, n = 0; n < e.length; ++n) {
var a = i.rankOf(e[n]);
(t[a] = t[a] || []).push(e[n]);
}
for (var o = Object.keys(t).map(Number).sort(function(e, i) {
return t[i].length - t[e].length || i - e;
}), s = [], c = 0; c < o.length; ++c) s = s.concat(t[o[c]].slice().sort(function(e, t) {
return i.suitOf(e) - i.suitOf(t);
}));
return s;
},
_mianParts: function(e) {
for (var t = {}, i = 0, n = 0, a = 0; a < (e || []).length; ++a) {
var o = this.rankOf(e[a]);
t[o] = (t[o] || 0) + 1;
o > n && (n = o);
}
for (var s in t) 2 == t[s] && i++;
return i >= 2 ? "二对" : 1 == i ? "一对" : "单" + ({
11: "J",
12: "Q",
13: "K",
14: "A"
}[n] || n);
},
renderCards: function() {
if (!this._dealing) {
for (var e = (cc.vv.gameNetMgr.bbMyCards || []).slice(), t = this._total || 2, i = 0; i < 6; ++i) {
var n = this._seatNodes[i];
if (n) {
for (var a = 0; a < 6; ++a) n.slots[a] && (n.slots[a].active = !1);
for (var o = 0; o < 3; ++o) this.setStr(n.daoLabels[o], "");
this.setStr(n.summary, "");
}
}
if (this._started) {
for (var s = 0; s < t; ++s) {
var c = this._seatNodes[this._layoutOf(t)[s]];
if (c && c.root.active) {
var r = this._watching ? s : (this._mySeat + s) % t, l = this._revealCounts && this._revealCounts[s] || 0, h = l > 0 && this._revealByGs[r] || null, d = !this._watching && 0 == s, u = [], v = !1, g = [ "", "", "" ], _ = "";
if (h) {
if (h.daos) {
for (var f = 0; f < h.daos.length; ++f) {
u = u.concat(h.daos[f].cards || []);
g[f] = h.daos[f].desc + "×" + h.daos[f].rate;
}
h.wulong ? _ = "乌龙(三道全输)" : h.auto && (_ = "系统自动摆牌");
} else if (h.groups) {
for (var m = 0; m < h.groups.length; ++m) u = u.concat(h.groups[m] || []);
_ = (h.typeName || "") + " ×" + (h.rate || 1);
}
for (var p = 0; p < 3; ++p) l < 2 * (p + 1) && (g[p] = "");
l < 6 && (_ = "");
} else if (!d || this._revealRunning || this._revealCounts || this._dealing) v = !0; else for (var b = 0; b < 6; ++b) u.push(null != e[b] ? e[b] : null);
for (var C = 0; C < 6; ++C) {
var y = c.slots[C];
if (y) {
var N = y.getComponent(cc.Sprite);
y.active = !0;
if (v || h && C >= l) {
N && (N.spriteFrame = this._cardBack || null);
y.color = cc.Color.WHITE;
} else if (null != u[C]) {
N && (N.spriteFrame = this.frameOf(u[C]) || this._cardBack || null);
var S = this._arranging && d && !h && this._isUsed(u[C]);
y.color = S ? cc.color(120, 120, 120) : cc.Color.WHITE;
} else y.active = !1;
}
}
for (var B = 0; B < 3; ++B) this.setStr(c.daoLabels[B], g[B]);
this.setStr(c.summary, "baobao_mian" == this._gameType ? "" : _);
}
}
this._renderArrange();
} else this._renderArrange();
}
},
_normDaos: function(e) {
for (var t = [ [ null, null ], [ null, null ], [ null, null ] ], i = 0; i < 3; ++i) {
var n = e && e[i];
if (n) {
null != n[0] && (t[i][0] = n[0]);
null != n[1] && (t[i][1] = n[1]);
}
}
return t;
},
_daoFull: function(e) {
return !!e && null != e[0] && null != e[1];
},
_daoFreeSlot: function(e) {
return e ? null == e[0] ? 0 : null == e[1] ? 1 : -1 : 0;
},
_isUsed: function(e) {
return null != e && (this._daoSel[0].indexOf(e) >= 0 || this._daoSel[1].indexOf(e) >= 0 || this._daoSel[2].indexOf(e) >= 0);
},
onBbStart: function(e) {
var t = cc.vv.gameNetMgr, i = e && e.shuffle || this._shufflePending;
if (this._settleClosedAt) {
var n = Date.now() - this._settleClosedAt;
console.log("[BB][时序] 结算关闭→收到开局 " + n + "ms" + (e && e.resend ? " (补发)" : "") + (i ? " +洗牌动画" : ""));
n > 1500 && console.warn("[BB][时序] 开局推送延迟 " + n + "ms, 请对照服务端 [宝宝][时序] bb_start 时间");
this._settleClosedAt = 0;
}
this._shufflePending = !1;
this._roundSeq = (this._roundSeq || 0) + 1;
this._started = !0;
this._watching = !1;
this._final = !1;
this._roomEnd = !1;
this._settle1Done = !0;
this._summaryShown = !1;
this._endDetail = null;
this._arranging = !1;
this._myContinued = !1;
this._stopContinueRetry();
this._pushAt = Date.now();
this._confirmRemainAt = 0;
this._arrangeRemainAt = 0;
this._overAt = 0;
this._daoSel = [ [ null, null ], [ null, null ], [ null, null ] ];
this._revealByGs = {};
this._revealCounts = null;
this._revealDone = !1;
this._revealRunning = !1;
this._pendingOver = null;
this._lastOver = null;
this._pendingSeq = null;
this._lastOverSeq = null;
this._fxRunning = !1;
this._animBusy = !1;
this._clearFxNodes();
this._gameType = e ? e.gameType : t.bbGameType;
this._applyBbConf(e);
this._mySeat = e && null != e.mySeat ? e.mySeat : t.bbMySeat >= 0 ? t.bbMySeat : 0;
e && e.myDaos && 3 == e.myDaos.length && (this._daoSel = this._normDaos(e.myDaos));
try {
this._showGameUI();
this.updateRoomInfo();
this.renderSeats();
} catch (e) {
console.error("[BB] 开局UI异常", e);
}
var a = this;
if (e && e.resend) {
this._dealing = !1;
try {
this.renderCards();
this._showPhaseUI(e, t);
} catch (e) {
console.error("[BB] 补发恢复异常", e);
}
} else {
var o = !1;
try {
if (i) {
this._animBusy = !0;
this._clearCards();
this._playShuffleAnim(c);
this.scheduleOnce(function() {
if (!o) {
console.warn("[BB] 洗牌动画未回调, 强制进入发牌");
a._animBusy = !1;
c();
}
}, 2.6);
} else {
this.renderCards();
c();
}
} catch (e) {
console.error("[BB] 开局渲染异常, 兜底直接发牌", e);
this._animBusy = !1;
this._dealing = !1;
c();
}
}
function s() {
console.log("[BB][时序] 开始发牌 距收到开局 " + (Date.now() - a._pushAt) + "ms");
try {
a._dealSeq(function() {
a._animBusy = !1;
if (a._started) try {
a._showPhaseUI(e, t);
} catch (e) {
console.error("[BB] 阶段UI异常", e);
}
});
} catch (i) {
console.error("[BB] 发牌异常, 直接显示阶段UI", i);
a._animBusy = !1;
a._dealing = !1;
try {
a.renderCards();
a._showPhaseUI(e, t);
} catch (e) {
console.error("[BB] 阶段UI异常", e);
}
}
}
function c() {
if (!o) {
o = !0;
s();
}
}
},
_showPhaseUI: function(e, t) {
if (e && "reveal" == e.phase) {
this.hideConfirmUI();
this.hideArrangeUI();
this._stopCountdown();
var i = e.reveal && e.reveal.players ? e.reveal.players : [];
this._revealByGs = {};
for (var n = 0; n < i.length; ++n) null != i[n].seat && (this._revealByGs[i[n].seat] = i[n]);
this._revealCounts = [];
for (var a = this._total || 2, o = 0; o < a; ++o) this._revealCounts.push(6);
this._revealRunning = !1;
this._revealDone = !0;
this.renderCards();
this.showTip("等待结算…");
} else if (e && "result" == e.phase) {
this.hideConfirmUI();
this.hideArrangeUI();
this._stopCountdown();
this.showTip("等待结算…");
} else if ("baobao_shou" == this._gameType && e && "arrange" == e.phase) {
this.hideConfirmUI();
if (e.arranged || t.bbArranged) {
this.hideArrangeUI();
this.showTip("已提交，等待其他玩家…");
} else {
if (null != e.arrangeRemain) {
this._arrangeRemain = e.arrangeRemain;
this._arrangeRemainAt = this._pushAt || Date.now();
} else if (e.arrangeDeadline) {
this._arrangeRemain = Math.max(0, Math.ceil((e.arrangeDeadline - Date.now()) / 1e3));
this._arrangeRemainAt = Date.now();
}
this.showArrangeUI(this._arrangeRemain);
}
} else if (e && "confirm" == e.phase) {
this.hideArrangeUI();
e.myMian && (t.bbMyMian = e.myMian);
if (null != e.confirmRemain) {
this._confirmRemain = e.confirmRemain;
this._confirmRemainAt = this._pushAt || Date.now();
} else if (e.confirmDeadline) {
this._confirmRemain = Math.max(0, Math.ceil((e.confirmDeadline - Date.now()) / 1e3));
this._confirmRemainAt = Date.now();
}
if (e.confirmed) {
this.hideConfirmUI();
this.showTip("已确定，等待其他玩家…");
} else this.showConfirmUI();
} else {
this.hideArrangeUI();
if ("baobao_shou" != this._gameType) {
e && e.myMian && (t.bbMyMian = e.myMian);
if (e && null != e.confirmRemain) {
this._confirmRemain = e.confirmRemain;
this._confirmRemainAt = this._pushAt || Date.now();
} else if (e && e.confirmDeadline) {
this._confirmRemain = Math.max(0, Math.ceil((e.confirmDeadline - Date.now()) / 1e3));
this._confirmRemainAt = Date.now();
}
if (e && e.confirmed) {
this.hideConfirmUI();
this.showTip("已确定，等待其他玩家…");
} else this.showConfirmUI();
} else this.hideConfirmUI();
}
},
onArrangeStart: function(e) {
cc.vv.gameNetMgr;
this._gameType = "baobao_shou";
if (e && null != e.remain) {
this._arrangeRemain = e.remain;
this._arrangeRemainAt = Date.now();
} else if (e && e.deadline) {
this._arrangeRemain = Math.max(0, Math.ceil((e.deadline - Date.now()) / 1e3));
this._arrangeRemainAt = Date.now();
}
if (!this._started) {
this._started = !0;
this._showGameUI();
this.renderCards();
var t = this;
this._dealSeq(function() {
if (t._started) if (cc.vv.gameNetMgr.bbArranged) {
t.hideArrangeUI();
t.showTip("已提交，等待其他玩家…");
} else t.showArrangeUI(t._arrangeRemain);
});
}
},
onArrangeOk: function(e) {
var t = cc.vv.gameNetMgr;
if (e && null != e.seatIndex && t.bbSeats && t.bbSeats[e.seatIndex]) {
t.bbSeats[e.seatIndex].arranged = !0;
e.seatIndex == t.bbMySeat && (t.bbArranged = !0);
}
this.renderSeats();
if (e && null != e.arrangedCount) {
var i = (t.bbSeats || []).length;
this.showTip("已摆牌 " + e.arrangedCount + "/" + i + "，等待其他玩家…");
}
},
_homeOf: function(e) {
this._slotHome || (this._slotHome = []);
for (var t = 0; t < this._slotHome.length; ++t) if (this._slotHome[t].node === e) return this._slotHome[t];
var i = {
node: e,
x: e.x,
y: e.y,
sx: e.scaleX,
sy: e.scaleY
};
this._slotHome.push(i);
return i;
},
_centerIn: function(e) {
var t = this.node.convertToWorldSpaceAR(cc.v2(0, 0));
return e.parent.convertToNodeSpaceAR(t);
},
_flyCard: function(e) {
var t = this._homeOf(e), i = this._centerIn(e);
e.stopAllActions();
e.setPosition(i.x, i.y);
e.setScale(.55 * t.sx, .55 * t.sy);
e.runAction(cc.sequence(cc.scaleTo(.35, t.sx, t.sy), cc.moveTo(.35, cc.v2(t.x, t.y))));
},
_flipOne: function(e, t) {
var i = this._seatNodes[e];
if (i && i.slots[t]) {
var n = i.slots[t], a = this._homeOf(n);
n.stopAllActions();
n.setScale(.02 * a.sx, a.sy);
n.runAction(cc.scaleTo(.18, a.sx, a.sy));
}
},
_resetSlotPos: function() {
if (this._slotHome) for (var e = 0; e < this._slotHome.length; ++e) {
var t = this._slotHome[e];
if (cc.isValid(t.node)) {
t.node.stopAllActions();
t.node.setPosition(t.x, t.y);
t.node.setScale(t.sx, t.sy);
}
}
},
_resetArrangeHandPos: function() {
for (var e = this._arrangeHandSlots || [], t = this._arrangeHandHome || [], i = 0; i < e.length; ++i) {
var n = e[i], a = t[i];
if (n && a && cc.isValid(n)) {
n.stopAllActions();
n.setPosition(a.x, a.y);
n.setScale(a.sx, a.sy);
}
}
},
_resetArrangeSlotPos: function() {
this._resetArrangeHandPos();
for (var e = this._arrangeRows || [], t = this._arrangeDaoHome || [], i = 0; i < e.length; ++i) for (var n = 0; n < 2; ++n) {
var a = e[i].slots[n], o = t[i] && t[i][n];
if (a && o && cc.isValid(a)) {
a.stopAllActions();
a.setPosition(o.x, o.y);
a.setScale(o.sx, o.sy);
}
}
},
_dealSeq: function(e) {
this._stopDeal();
this._dealing = !0;
var t = this._total || 2, i = this._layoutOf(t), n = this;
this._resetSlotPos();
if (this._dealGuard) {
clearTimeout(this._dealGuard);
this._dealGuard = null;
}
this._dealGuard = setTimeout(function() {
n._dealGuard = null;
if (n._dealing) {
console.warn("[BB] 发牌超时兜底, 强制结束发牌");
if (n._dealTimer) {
clearTimeout(n._dealTimer);
n._dealTimer = null;
}
n._dealing = !1;
try {
e && e();
} catch (e) {
console.error("[BB] 发牌兜底回调异常", e);
}
}
}, 720 * i.length + 2500);
for (var a = 0; a < 6; ++a) {
var o = this._seatNodes[a];
if (o && o.slots) for (var s = 0; s < 6; ++s) o.slots[s] && (o.slots[s].active = !1);
}
var c = 0, r = 0;
(function t() {
n._dealTimer = null;
if (n._dealing) {
try {
if (!cc.isValid(n.node)) {
n._dealing = !1;
return;
}
if (!n._started) {
n._dealing = !1;
try {
e && e();
} catch (e) {}
return;
}
if (c >= i.length) {
n._dealTimer = setTimeout(function() {
n._dealing = !1;
try {
e && e();
} catch (e) {
console.error("[BB] 发牌完成回调异常", e);
}
}, 450);
return;
}
var a = n._seatNodes[i[c]];
if (a && a.root.active && a.slots) {
0 === r && cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("deal.wav");
var o = a.slots[r];
if (o) {
var s = o.getComponent(cc.Sprite);
s && (s.spriteFrame = n._cardBack || s.spriteFrame);
o.color = cc.Color.WHITE;
o.active = !0;
n._flyCard(o);
}
}
} catch (e) {
console.error("[BB] 发牌tick异常 seat=" + c + " card=" + r, e);
}
if (++r >= 6) {
r = 0;
++c;
}
n._dealTimer = setTimeout(t, 120);
}
})();
},
_stopDeal: function() {
if (this._dealTimer) {
clearTimeout(this._dealTimer);
this._dealTimer = null;
}
if (this._dealGuard) {
clearTimeout(this._dealGuard);
this._dealGuard = null;
}
this._dealing = !1;
},
onBbReveal: function(e) {
if (e && e.players && (!this._n.resultPanel || !this._n.resultPanel.active)) {
var t = cc.vv.gameNetMgr;
if (!this._started) {
this._watching = !0;
this._started = !0;
this._final = !1;
this._myContinued = !1;
this._mySeat = 0;
this._total = e.players.length;
this._gameType = e.gameType || t.bbGameType;
e.seats && (t.bbSeats = e.seats);
this._showGameUI();
this.updateRoomInfo();
this.renderSeats();
console.log("[BB] 观战模式: 本局未参与, 只观看亮牌");
}
this._stopDeal();
this.hideConfirmUI();
this.hideArrangeUI();
this._arranging = !1;
this._revealByGs = {};
for (var i = 0; i < e.players.length; ++i) {
var n = e.players[i];
null != n.seat && (this._revealByGs[n.seat] = n);
}
for (var a = e.players.length, o = [], s = 0; s < a; ++s) o.push(0);
this._revealCounts = o;
this._revealDone = !1;
this._revealRunning = !0;
this._resetSlotPos();
this.renderCards();
this.showTip("亮牌 第1张");
console.log("[BB] 亮牌开始 座位顺序=" + Object.keys(this._revealByGs).join(",") + " 共" + a + "家");
for (var c = this, r = [ "前道", "中道", "后道" ], l = 0; l < 3; ++l) (function(e) {
c.scheduleOnce(function() {
if (cc.isValid(c.node)) {
for (var t = c._layoutOf(c._total || 2), i = 0; i < a; ++i) {
c._revealCounts[i] = 2 * (e + 1);
if (null != t[i]) {
c._flipOne(t[i], 2 * e);
c._flipOne(t[i], 2 * e + 1);
}
}
c.renderCards();
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("select.wav");
c.showTip("亮牌 " + r[e]);
console.log("[BB] 亮牌 " + r[e] + " 全部 " + a + " 家");
}
}, 1.6 * e);
})(l);
this.scheduleOnce(function() {
if (!c._revealDone) {
c._revealRunning = !1;
c._revealDone = !0;
c.showTip("");
console.log("[BB] 亮牌结束");
var e = function() {
if (cc.isValid(c.node)) if (c._watching) {
c.showTip("本局结束，等待下一局开始…");
c.scheduleOnce(function() {
if (cc.isValid(c.node) && c._watching) {
c._watching = !1;
c.showPrepareUI();
}
}, 1.2);
} else {
c._fxRunning = !0;
c.scheduleOnce(function() {
if (cc.isValid(c.node)) {
c._fxRunning = !1;
if (c._pendingOver || c._lastOver) {
var e = c._pendingOver || c._lastOver, t = c._pendingOver ? c._pendingSeq : c._lastOverSeq;
c._pendingOver = null;
c._lastOver = null;
c._pendingSeq = null;
c._lastOverSeq = null;
c.applyGameOver(e, t);
}
}
}, 1);
}
};
try {
c._playHandFx(e);
} catch (t) {
console.log("[BB] 牌型特效异常:", t && t.message);
c._fxRunning = !1;
c._clearFxNodes();
e();
}
}
}, 4.2);
}
},
showArrangeUI: function(e) {
this._arranging = !0;
this._wulongWarned = !1;
this._arrangeRemain = null != e ? e : this._arrangeRemain || 0;
if (this._arrangeRoot) {
this._arrangeRoot.active = !0;
this._arrangeRoot.parent && this._arrangeRoot.setSiblingIndex(this._arrangeRoot.parent.children.length - 1);
}
this._resetArrangeSlotPos();
this._arrangeTipActive = !1;
this._arrangeWarnSeq = (this._arrangeWarnSeq || 0) + 1;
this._renderArrange();
this.renderCards();
this.showTip("请摆牌：拖手牌到前/中/后道位，道内牌可再拖动换位，点道内牌退回");
this._startCountdown(this._leftOf(this._arrangeRemain, this._arrangeRemainAt), this._arrangeCd, function() {
this.showTip("摆牌超时，系统自动摆牌");
this.onAutoArrange();
});
},
hideArrangeUI: function() {
this._arranging = !1;
var e = this._dragInfo;
this._dragInfo = null;
e && this._dragTopEnd(e.node);
this._dragTopNode && this._dragTopEnd(this._dragTopNode);
this._resetArrangeSlotPos();
this._arrangeRemain = 0;
this._arrangeRoot && (this._arrangeRoot.active = !1);
this._arrangeCd && this.setStr(this._arrangeCd, "");
this._stopCountdown();
},
onHandTouchStart: function(e, t) {
this._dragInfo = null;
if (this._arranging) {
var i = (cc.vv.gameNetMgr.bbMyCards || [])[e];
if (null != i && !this._isUsed(i)) {
var n = null;
this._arrangeRoot && this._arrangeRoot.active && this._arrangeHandSlots && (n = this._arrangeHandSlots[e]);
if (!n) {
var a = this._seatNodes[0];
n = a && a.slots ? a.slots[e] : null;
}
if (n) {
var o = this._arrangeHandSlots && this._arrangeHandSlots[e] === n && this._arrangeHandHome ? this._arrangeHandHome[e] : this._homeOf(n);
this._dragInfo = {
idx: e,
id: i,
node: n,
home: o,
startPos: t.touch.getLocation(),
moved: !1
};
this._dragTopBegin(n);
}
}
}
},
onHandTouchMove: function(e, t) {
var i = this._dragInfo;
if (i && i.idx == e) {
!i.moved && t.touch.getLocation().sub(i.startPos).mag() > 20 && (i.moved = !0);
i.moved && i.node.setPosition(i.node.parent.convertToNodeSpaceAR(t.touch.getLocation()));
}
},
onHandTouchEnd: function(e, t) {
var i = this._dragInfo;
this._dragInfo = null;
if (i) {
this._dragTopEnd(i.node);
if (i.idx == e) if (i.moved) {
var n = t.touch.getLocation(), a = this._hitDaoSlot(n);
if (a) {
var o = [ this._daoSel[0].slice(), this._daoSel[1].slice(), this._daoSel[2].slice() ];
this._applyPlace(o, i, a);
var s = this._daoOrderErr(o);
if (s) {
this._showArrangeWarn("摆不上：" + s);
var c = i.home || this._homeOf(i.node);
if (c) {
i.node.stopAllActions();
i.node.setPosition(c.x, c.y);
i.node.setScale(c.sx, c.sy);
}
this.renderCards();
return;
}
this._daoSel = o;
this._wulongWarned = !1;
} else null != i.fromD && (this._daoSel[i.fromD][i.fromK] = null);
var r = i.home || this._homeOf(i.node);
if (r) {
i.node.stopAllActions();
i.node.setPosition(r.x, r.y);
i.node.setScale(r.sx, r.sy);
}
this.renderCards();
} else if (null == i.fromD) this.onHandTap(e); else {
var l = i.home;
if (l) {
i.node.stopAllActions();
i.node.setPosition(l.x, l.y);
i.node.setScale(l.sx, l.sy);
}
}
}
},
_applyPlace: function(e, t, i) {
var n = null != t.fromD ? e[t.fromD] : null, a = e[i.d];
if (a) if (n && t.fromD === i.d) {
var o = n[t.fromK];
n[t.fromK] = n[i.k];
n[i.k] = o;
} else {
n && (n[t.fromK] = null);
a[i.k] = t.id;
}
},
_hitDaoSlot: function(e) {
for (var t = this._arrangeRows || [], i = this._arrangeDaoHome || [], n = null, a = 0, o = 0, s = -1, c = 0; c < t.length; ++c) {
var r = i[c];
if (r) for (var l = 0; l < 2; ++l) {
var h = t[c].slots[l];
if (h && h.parent && r[l]) {
var d = h.parent.convertToWorldSpaceAR(cc.v2(r[l].x, r[l].y)), u = e.x - d.x, v = e.y - d.y, g = u * u + v * v;
if (s < 0 || g < s) {
s = g;
a = u;
o = v;
n = {
d: c,
k: l
};
}
}
}
}
return n ? a * a / 4356 + o * o / 6724 > 1 ? null : n : null;
},
_dragTopBegin: function(e) {
if (e && e.parent && this._arrangeRoot && cc.isValid(e) && cc.isValid(this._arrangeRoot)) if (e.parent !== this._arrangeRoot) {
e._bbOldParent = e.parent;
var t = e.convertToWorldSpaceAR(cc.v2(0, 0));
e.parent = this._arrangeRoot;
e.setPosition(this._arrangeRoot.convertToNodeSpaceAR(t));
e.setSiblingIndex(this._arrangeRoot.children.length - 1);
this._dragTopNode = e;
} else e.setSiblingIndex(this._arrangeRoot.children.length - 1);
},
_dragTopEnd: function(e) {
e && this._dragTopNode === e && (this._dragTopNode = null);
if (e && cc.isValid(e)) {
var t = e._bbOldParent;
e._bbOldParent = null;
t && cc.isValid(t) && e.parent !== t && (e.parent = t);
}
},
_bindArrangeDrag: function() {
var e = this._arrangeRoot;
if (e && !e._bbDragBound) {
e._bbDragBound = !0;
e.on(cc.Node.EventType.TOUCH_START, this._onArrDragStart, this);
e.on(cc.Node.EventType.TOUCH_MOVE, this._onArrDragMove, this);
e.on(cc.Node.EventType.TOUCH_END, this._onArrDragEnd, this);
e.on(cc.Node.EventType.TOUCH_CANCEL, this._onArrDragCancel, this);
}
},
_onArrDragStart: function(e) {
if (this._arranging) {
this._dragInfo = null;
if (this._dragTopNode) {
this._dragTopEnd(this._dragTopNode);
this._resetArrangeSlotPos();
}
var t = e.touch.getLocation(), i = this._hitDaoSlot(t);
if (i && this._daoSel[i.d] && null != this._daoSel[i.d][i.k]) this.onDaoTouchStart(i.d, i.k, e); else {
var n = this._hitHandSlot(t);
n >= 0 && this.onHandTouchStart(n, e);
}
}
},
_onArrDragMove: function(e) {
var t = this._dragInfo;
t && this._arranging && this.onHandTouchMove(t.idx, e);
},
_onArrDragEnd: function(e) {
var t = this._dragInfo;
if (t) if (t.moved) this.onHandTouchEnd(t.idx, e); else {
this._dragInfo = null;
this._dragTopEnd(t.node);
var i = t.home;
if (i) {
t.node.stopAllActions();
t.node.setPosition(i.x, i.y);
t.node.setScale(i.sx, i.sy);
}
null == t.fromD ? this.onHandTap(t.idx) : this.onDaoTap(t.fromD, t.fromK);
} else {
var n = e.touch.getLocation(), a = this._hitDaoSlot(n);
if (a && this._daoSel[a.d] && null != this._daoSel[a.d][a.k]) {
this.onDaoTap(a.d, a.k);
return;
}
var o = this._hitHandSlot(n);
o >= 0 && this.onHandTap(o);
}
},
_onArrDragCancel: function() {
var e = this._dragInfo;
this._dragInfo = null;
if (e) {
this._dragTopEnd(e.node);
var t = e.home;
if (t) {
e.node.stopAllActions();
e.node.setPosition(t.x, t.y);
e.node.setScale(t.sx, t.sy);
}
this.renderCards();
}
},
_hitHandSlot: function(e) {
for (var t = this._arrangeHandSlots || [], i = 0; i < t.length; ++i) {
var n = t[i];
if (n && n.activeInHierarchy) {
var a = n.getBoundingBoxToWorld();
a.x -= 10;
a.y -= 10;
a.width += 20;
a.height += 20;
if (a.contains(e)) return i;
}
}
return -1;
},
onHandTap: function(e) {
if (this._arranging) {
var t = (cc.vv.gameNetMgr.bbMyCards || [])[e];
if (null != t) {
for (var i = 0; i < 3; ++i) {
var n = this._daoSel[i];
if (n[0] === t) {
n[0] = null;
this._wulongWarned = !1;
this.renderCards();
return;
}
if (n[1] === t) {
n[1] = null;
this._wulongWarned = !1;
this.renderCards();
return;
}
}
for (var a = 0; a < 3; ++a) {
var o = this._daoFreeSlot(this._daoSel[a]);
if (!(o < 0)) {
var s = [ this._daoSel[0].slice(), this._daoSel[1].slice(), this._daoSel[2].slice() ];
s[a][o] = t;
if (this._daoOrderOkWith(s)) {
this._daoSel = s;
this._wulongWarned = !1;
this.renderCards();
return;
}
}
}
this._daoFull(this._daoSel[0]) && this._daoFull(this._daoSel[1]) && this._daoFull(this._daoSel[2]) ? this.showTip("三道已满，点道内牌可退回") : this._showArrangeWarn("摆不上：必须 后道 ≥ 中道 ≥ 前道");
}
}
},
onDaoTap: function(e, t) {
if (this._arranging) {
var i = this._daoSel[e];
if (i) {
if (null != t) {
if (null == i[t]) return;
i[t] = null;
} else {
if (null == i[0] && null == i[1]) return;
this._daoSel[e] = [ null, null ];
}
this._wulongWarned = !1;
this.renderCards();
}
}
},
onDaoTouchStart: function(e, t, i) {
if (this._arranging && !this._dragInfo) {
var n = this._daoSel && this._daoSel[e], a = n ? n[t] : null;
if (null != a) {
var o = (this._arrangeRows || [])[e], s = o && o.slots ? o.slots[t] : null;
if (s) {
var c = this._arrangeDaoHome ? this._arrangeDaoHome[e] : null;
this._dragInfo = {
idx: (cc.vv.gameNetMgr.bbMyCards || []).indexOf(a),
id: a,
node: s,
home: c ? c[t] : this._homeOf(s),
fromD: e,
fromK: t,
startPos: i.touch.getLocation(),
moved: !1
};
this._dragTopBegin(s);
}
}
}
},
_renderArrange: function() {
if (this._arrangeRows) {
for (var e = 0; e < 3; ++e) {
for (var t = this._arrangeRows[e], i = this._daoSel[e] || [], n = 0; n < 2; ++n) {
var a = t.slots[n];
if (a) if (null != i[n]) {
a.active = !0;
var o = a.getComponent(cc.Sprite);
o && (o.spriteFrame = this.frameOf(i[n]) || this._cardBack || null);
a.color = cc.Color.WHITE;
} else a.active = !1;
}
this.setStr(t.desc, this._daoFull(i) ? this.daoDescText(i[0], i[1]) : "");
}
if (this._arrangeHandSlots) for (var s = cc.vv.gameNetMgr.bbMyCards || [], c = 0; c < this._arrangeHandSlots.length; ++c) {
var r = this._arrangeHandSlots[c];
if (r) {
var l = s[c];
if (null != l) {
var h = this._isUsed(l);
r.active = !h;
if (!h) {
var d = r.getComponent(cc.Sprite);
d && (d.spriteFrame = this.frameOf(l) || this._cardBack || null);
r.color = cc.Color.WHITE;
}
} else r.active = !1;
}
}
this._arrangeTip && !this._arrangeTipActive && this.setStr(this._arrangeTip, this._daoOrderOkLocal() ? "拖手牌到道位放入, 道内牌可再拖动换位, 点道内牌退回; 前道 ≤ 中道 ≤ 后道" : "警告: 当前摆法 前>中 或 中>后, 将判乌龙三道全输!");
}
},
daoDescText: function(e, t) {
var i = this.rankOf(e), n = this.rankOf(t);
return i == n ? "宝" + ({
11: "J",
12: "Q",
13: "K",
14: "A"
}[i] || i) : (this.dianVal(i) + this.dianVal(n)) % 10 + "点";
},
onConfirmArrange: function() {
if (this._arranging) if (this._daoFull(this._daoSel[0]) && this._daoFull(this._daoSel[1]) && this._daoFull(this._daoSel[2])) if (this._daoOrderOkLocal() || this._wulongWarned) {
cc.vv.net.send("bb_arrange", {
front: this._daoSel[0].slice(),
mid: this._daoSel[1].slice(),
back: this._daoSel[2].slice()
});
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("sort.wav");
cc.vv.gameNetMgr.bbArranged = !1;
this._arranging = !1;
this._arrangeRoot && (this._arrangeRoot.active = !1);
this._stopCountdown();
this._n.countdownLabel && this.setStr(this._n.countdownLabel, "");
this.showTip("已提交，等待其他玩家…");
} else {
this._wulongWarned = !0;
this.showTip("摆法违反前≤中≤后, 将判乌龙全输! 再点一次确定提交");
} else this.showTip("请摆满三道(每道2张)");
},
onAutoArrange: function() {
if (this._arranging) {
var e = cc.vv.gameNetMgr, t = this.autoArrangeLocal(e.bbMyCards || []);
if (t) {
this._daoSel = t;
this._wulongWarned = !1;
this.renderCards();
} else this.showTip("自动摆牌失败，请手动摆牌");
}
},
_evalD: function(e, t) {
var i = this.rankOf(e), n = this.rankOf(t);
if (i == n) return {
bao: !0,
rank: i,
suit: Math.min(this.suitOf(e), this.suitOf(t)),
cards: [ e, t ]
};
var a = this.dianVal(i), o = this.dianVal(n);
return {
bao: !1,
point: (a + o) % 10,
sum: a + o,
maxRank: i > n ? i : n,
maxSuit: i > n ? this.suitOf(e) : this.suitOf(t),
cards: [ e, t ]
};
},
_cmpSuit: function(e, t) {
return e < t ? 1 : e > t ? -1 : 0;
},
_cmpD: function(e, t) {
if (e.bao != t.bao) return e.bao ? 1 : -1;
if (e.bao) return e.rank != t.rank ? e.rank > t.rank ? 1 : -1 : this._cmpSuit(e.suit, t.suit);
if (e.point != t.point) return e.point > t.point ? 1 : -1;
var i = this._tdMode || 3;
return 0 == e.point ? 2 == i ? 0 : this._cmpSuit(e.maxSuit, t.maxSuit) : e.sum != t.sum ? e.sum > t.sum ? 1 : -1 : 2 == i ? 0 : 3 != i ? this._cmpSuit(e.maxSuit, t.maxSuit) : e.maxRank != t.maxRank ? e.maxRank > t.maxRank ? 1 : -1 : this._cmpSuit(e.maxSuit, t.maxSuit);
},
_applyBbConf: function(e) {
var t = cc.vv && cc.vv.gameNetMgr, i = e && e.conf;
!i && t && (i = t.conf);
var n = i ? i.taiRules : null;
if (null != n && "string" == typeof n) try {
n = JSON.parse(n);
} catch (e) {
n = null;
}
var a = n ? Number(n.tongdian_mode) : NaN;
a >= 1 && a <= 3 || (a = n && null != n.tongdian_flower && Number(n.tongdian_flower) ? 1 : 3);
this._tdMode = a;
cc.vv && cc.vv.gameNetMgr && (cc.vv.gameNetMgr.bbTongdianMode = a);
},
_daoOrderOkLocal: function() {
return this._daoOrderOkWith(this._daoSel);
},
_daoOrderErr: function(e) {
for (var t = [ "前道", "中道", "后道" ], i = [], n = 0; n < 3; ++n) {
var a = e[n];
i.push(this._daoFull(a) ? this._evalD(a[0], a[1]) : null);
}
for (var o = 0; o < 3; ++o) if (i[o]) for (var s = o + 1; s < 3; ++s) if (i[s] && this._cmpD(i[o], i[s]) > 0) return t[o] + "不能大于" + t[s];
return null;
},
_daoOrderOkWith: function(e) {
return null == this._daoOrderErr(e);
},
_showArrangeWarn: function(e) {
if (this._arrangeTip) {
var t = this;
this._arrangeTipActive = !0;
this._arrangeWarnSeq = (this._arrangeWarnSeq || 0) + 1;
var i = this._arrangeWarnSeq;
this.setStr(this._arrangeTip, e);
this._arrangeTip.parent && this._arrangeTip.setSiblingIndex(this._arrangeTip.parent.children.length - 1);
this.scheduleOnce(function() {
if (i === t._arrangeWarnSeq && t._arranging) {
t._arrangeTipActive = !1;
t._renderArrange();
}
}, 1);
}
},
autoArrangeLocal: function(e) {
if (!e || 6 != e.length) return null;
for (var t = this._evalD.bind(this), i = this._cmpD.bind(this), n = null, a = null, o = [ 0, 1, 2, 3, 4, 5 ], s = [], c = 0; c < 6; ++c) for (var r = c + 1; r < 6; ++r) s.push([ c, r ]);
function l(e, t) {
if (!t) return !0;
for (var n = 2; n >= 0; --n) {
var a = i(e[n], t[n]);
if (0 != a) return a > 0;
}
return !1;
}
for (var h = 0; h < s.length; ++h) for (var d = s[h], u = o.filter(function(e) {
return e != d[0] && e != d[1];
}), v = 0; v < u.length; ++v) for (var g = v + 1; g < u.length; ++g) for (var _ = [ u[v], u[g] ], f = u.filter(function(e) {
return e != _[0] && e != _[1];
}), m = [ t(e[d[0]], e[d[1]]), t(e[_[0]], e[_[1]]), t(e[f[0]], e[f[1]]) ], p = [ [ 0, 1, 2 ], [ 0, 2, 1 ], [ 1, 0, 2 ], [ 1, 2, 0 ], [ 2, 0, 1 ], [ 2, 1, 0 ] ], b = 0; b < p.length; ++b) {
var C = p[b], y = [ m[C[0]], m[C[1]], m[C[2]] ];
if (!(i(y[0], y[1]) > 0 || i(y[1], y[2]) > 0) && l(y, n)) {
n = y;
a = [ y[0].cards.slice(), y[1].cards.slice(), y[2].cards.slice() ];
}
}
a || 6 != e.length || (a = [ [ e[0], e[1] ], [ e[2], e[3] ], [ e[4], e[5] ] ]);
return a;
},
onGameOver: function(e) {
this._overAt = Date.now();
var t = this._roundSeq;
this._lastOver = e;
this._lastOverSeq = t;
if (this._fxRunning || this._revealRunning || !this._revealDone && this._revealCounts) {
this._pendingOver = e;
this._pendingSeq = t;
} else this.applyGameOver(e, t);
},
applyGameOver: function(e, t) {
if (null == t || t === this._roundSeq) {
var i = cc.vv.gameNetMgr, n = i.numOfGames || 0;
if (!this._myContinued || this._overRound !== n) {
var a = [];
e instanceof Array ? a = e : e && e.results && (a = e.results);
for (var o = cc.vv.userMgr && cc.vv.userMgr.userId, s = !1, c = 0; c < a.length; ++c) if (a[c] && a[c].userid == o) {
s = !0;
break;
}
if (s) {
this._overRound = n;
for (var r = 0, l = 0; l < a.length; ++l) if (a[l] && a[l].userid == o) {
r = a[l].delta || 0;
break;
}
if (cc.vv && cc.vv.audioMgr) {
cc.vv.audioMgr.playSFX(r > 0 ? "win.wav" : "lose.wav");
if (0 != r) {
var h = this;
this.scheduleOnce(function() {
cc.isValid(h.node) && cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("dropCoin.wav");
}, .5);
}
}
var d = i.bbBankerSeat, u = i.bbMySeat;
if ((null == u || u < 0) && i.bbSeats) for (var v = 0; v < i.bbSeats.length; ++v) if (i.bbSeats[v] && i.bbSeats[v].userid == o) {
u = v;
break;
}
for (var g = function(e) {
var t = -1, n = i.bbOverDetails;
if (!n || !i.bbSeats || null == u || u < 0) return null;
for (var a = 0; a < i.bbSeats.length; ++a) if (i.bbSeats[a] && i.bbSeats[a].userid == e) {
t = a;
break;
}
if (t < 0) return null;
for (var o = 0, s = !1, c = 0; c < n.length; ++c) {
var r = n[c];
if (r.a == u && r.b == t || r.a == t && r.b == u) {
s = !0;
r.winner == t ? o += r.score || 0 : o -= r.score || 0;
}
}
return s ? o : null;
}, _ = [], f = 0; f < a.length; ++f) {
var m = a[f];
if (m) {
var p = (m.name || "") + (i.bbBankerMode && i.bbSeats && i.bbSeats[d] && i.bbSeats[d].userid == m.userid ? "(庄)" : ""), b = "";
if (m.daos) {
b = (m.daos || []).map(function(e) {
return e.desc;
}).join(" ");
m.wulong && (b = "乌龙 " + b);
} else m.typeName && (b = m.typeName || "");
var C = m.delta || 0;
if (m.userid == o) _.push(p + "  " + b + "  本局 " + (C > 0 ? "+" : "") + C + "  (总:" + (null != m.totalscore ? m.totalscore : 0) + ")"); else {
var y = g(m.userid);
_.push(p + "  " + b + "  与我 " + (null == y ? "0" : (y > 0 ? "+" : "") + y));
}
}
}
var N = i.overData || {}, S = !(!e || !e.endinfo) || !!N.endinfo || i.maxNumOfGames > 0 && i.numOfGames >= i.maxNumOfGames, B = !(!e || !e.roomEnd) || !!N.roomEnd;
S && (B = !1);
this._final = S;
this._roomEnd = B;
this._arranging = !1;
this.hideArrangeUI();
this.hideConfirmUI();
this._n.resultPanel && (this._n.resultPanel.active = !0);
this._ensureSettleBtnFrames();
this._setSettleActionBtn(B ? "退出房间" : "确定", B);
if (this._resultShuffleBtn) {
this._resultShuffleBtn.active = !S && !B;
this._resultShuffleBtn.opacity = 255;
}
this._n.resultExitBtn && (this._n.resultExitBtn.active = !1);
this._settle1Done = !S;
var w = i.maxNumOfGames > 0 ? "第 " + i.numOfGames + "/" + i.maxNumOfGames + " 局结算" : "第 " + i.numOfGames + " 局结算";
this.setStr(this._n.resultTitle, w);
this._setSettleContentStyle(this._settleFontSize, this._settleLineHeight, this._settleContentY);
this.setStr(this._n.resultContent, _.join("\n"));
this._lastLines = _.slice();
var M = !1;
try {
M = this._renderSettleCards(a, i.bbOverDetails || null);
} catch (e) {
console.error("[BB] 结算明牌渲染异常", e);
}
this._n.resultContent && (this._n.resultContent.active = !M);
this._n.resultList && (this._n.resultList.active = !1);
this._n.settleWin && (this._n.settleWin.active = !1);
this._n.settleLose && (this._n.settleLose.active = !1);
this._n.btnReady && (this._n.btnReady.active = !1);
this._exitRoomBtn && (this._exitRoomBtn.active = !1);
this._n.exitBtn && (this._n.exitBtn.active = !1);
this._n.dissolveBtn && (this._n.dissolveBtn.active = !1);
this._n.readyBtn && (this._n.readyBtn.active = !1);
this._started = !1;
this.showTip(B ? "其他玩家已离开，房间无法继续" : "");
if (this._exitPending) {
this._exitPending = !1;
var T = this;
this.scheduleOnce(function() {
cc.isValid(T.node) && !T._leaving && T.onExitRoom();
}, 1.2);
}
this._stopCountdown();
this._settleCd && this.setStr(this._settleCd, "");
if (this._settleCd && !B) {
var x;
x = e && null != e.resultRemainTotal ? this._leftOf(e.resultRemainTotal, this._overAt) : e && null != e.resultRemain ? e.resultRemain : null != i.bbResultRemain ? i.bbResultRemain : i.bbResultTimeout || 0;
this._startCountdown(x, this._settleCd, function() {
if (this._final) this._showFinalSummary(); else {
this._n.resultPanel && (this._n.resultPanel.active = !1);
this._settleClosedAt = Date.now();
if (!this._myContinued) {
this._myContinued = !0;
cc.vv.net.send("bb_continue");
this._startContinueRetry();
}
this.showTip("已准备，等待其他玩家…");
}
});
}
} else {
this._pendingOver = null;
this.showTip("本局已结束，等待下一局开始…");
}
}
}
},
_setSettleActionBtn: function(e, t) {
var i = this._n.resultCloseBtn;
if (i && cc.isValid(i)) {
this._settleCloseHome || (this._settleCloseHome = {
x: i.x,
y: i.y
});
i.active = !0;
i.opacity = 255;
i.setPosition(t ? 0 : this._settleCloseHome.x, this._settleCloseHome.y);
var n = i.getComponentInChildren(cc.Label);
n && (n.string = e);
}
},
_ensureSettleBtnFrames: function() {
var e = this;
this._settleBtnFrames || (this._settleBtnFrames = {});
this._settleBtnSceneFrames || (this._settleBtnSceneFrames = {});
[ [ this._n.resultCloseBtn, "images/other/按钮12", "ok" ], [ this._resultShuffleBtn, "images/other/按钮11", "shuffle" ] ].forEach(function(t) {
var i = t[0];
if (i && cc.isValid(i)) {
var n = i.getComponent(cc.Sprite);
if (n) {
n.enabled = !0;
void 0 === e._settleBtnSceneFrames[t[2]] && (e._settleBtnSceneFrames[t[2]] = n.spriteFrame);
var a = e._settleBtnFrames[t[2]];
if (a) n.spriteFrame = a; else {
n.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var o = i.width, s = i.height, c = function(a) {
if (a && a.texture && a.texture.width) {
e._settleBtnFrames[t[2]] = a;
if (cc.isValid(n) && cc.isValid(i)) {
n.spriteFrame = a;
i.width = o;
i.height = s;
}
}
}, r = cc.resources.get(t[1], cc.SpriteFrame);
if (r && r.texture && r.texture.width > 0) c(r); else {
var l = e._settleBtnSceneFrames[t[2]];
l && (n.spriteFrame = l);
cc.resources.load(t[1], cc.SpriteFrame, function(e, i) {
!e && i ? c(i) : console.log("[BB] 结算按钮贴图加载失败:", t[1], e && e.message);
});
}
}
}
}
});
},
_ensureSettleCards: function() {
if (!this._n.resultPanel) return null;
if (this._settleCardsRoot && cc.isValid(this._settleCardsRoot)) return this._settleCardsRoot;
var e = this._n.resultPanel, t = this.findNode(e, "bbSettleCards");
if (!t) {
(t = new cc.Node("bbSettleCards")).parent = e;
t.setContentSize(800, 300);
}
var i = 800, n = this.findNode(t, "bbSettleRow");
if (n && n.children) for (var a = 0; a < n.children.length; ++a) {
var o = n.children[a], s = Math.abs(o.x) + o.width / 2 + 10;
2 * s > i && (i = Math.ceil(2 * s));
}
var c = t.parent && "bbSettleScroll" === t.parent.name ? t.parent : null;
if (!c) {
(c = new cc.Node("bbSettleScroll")).parent = e;
c.setContentSize(i, 300);
c.setPosition(0, 0);
c.setSiblingIndex(e.children.length - 1);
c.addComponent(cc.Mask).type = cc.Mask.Type.RECT;
var r = c.addComponent(cc.ScrollView);
r.horizontal = !1;
r.vertical = !0;
r.inertia = !0;
r.bounceDuration = .15;
t.parent = c;
}
t.anchorX = .5;
t.anchorY = 1;
t.setPosition(0, 150);
this._settleScrollView = c.getComponent(cc.ScrollView);
this._settleViewH = 300;
this._settleViewW = i;
var l = this.findNode(t, "bbSettleRow");
this._settleCardsRoot = t;
this._settleRowTpl = l;
return t;
},
_renderSettleCards: function(e, t) {
var i = this._ensureSettleCards();
if (!i) return !1;
this._lastResults = e;
this._lastDetails = t || null;
for (var n = this._settleRowTpl, a = i.children.slice(), o = 0; o < a.length; ++o) a[o] !== n && a[o].destroy();
if (!this._n.resultPanel || !e) {
i.active = !1;
return !1;
}
var s, c = cc.vv.gameNetMgr, r = cc.vv.userMgr ? cc.vv.userMgr.userId : null, l = c.bbMySeat, h = null;
if ((null == l || l < 0) && c.bbSeats) for (s = 0; s < c.bbSeats.length; ++s) if (c.bbSeats[s] && c.bbSeats[s].userid == r) {
l = s;
break;
}
for (s = 0; s < e.length; ++s) if (e[s] && e[s].userid == r) {
h = e[s];
break;
}
if (!h || null == l || l < 0) {
i.active = !1;
return !1;
}
for (var d = c.bbBankerMode ? c.bbBankerSeat : -1, u = [], v = this._total || 2, g = 0; g < v; ++g) g != l && (d >= 0 && l != d && g != d || u.push(g));
var _ = function(e) {
for (var i = 0, n = !1, a = 0; a < (t || []).length; ++a) {
var o = t[a];
if (o.a == l && o.b == e || o.a == e && o.b == l) {
n = !0;
o.winner == e ? i += o.score || 0 : i -= o.score || 0;
}
}
return n ? i : null;
}, f = function(t) {
for (var i = c.bbSeats && c.bbSeats[t] ? c.bbSeats[t].userid : -1, n = 0; n < e.length; ++n) if (e[n] && e[n].userid == i) return e[n];
return null;
};
i.active = !0;
var m = u.length + 1, p = Math.max(this._settleViewH || 300, 56 * m + 8);
i.setContentSize(this._settleViewW || 840, p);
var b = 0, C = this, y = function(e, t, i, n, a, o) {
var s = C._n.resultContent ? cc.instantiate(C._n.resultContent) : new cc.Node("lbl");
s.name = "lbl";
s.active = !0;
s.opacity = 255;
s.parent = e;
s.setContentSize(i, 52);
s.setPosition(t, 0);
var c = s.getComponent(cc.Label);
c || (c = s.addComponent(cc.Label));
c.fontSize = n;
c.lineHeight = n + 4;
c.horizontalAlign = a;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.overflow = cc.Label.Overflow.SHRINK;
c.string = o || "";
return c;
}, N = function(e, t, i) {
var n = new cc.Node("bbSettleCard");
n.parent = e;
n.setContentSize(38, 52);
n.setPosition(t, 0);
var a = n.addComponent(cc.Sprite);
a.sizeMode = cc.Sprite.SizeMode.CUSTOM;
a.spriteFrame = (null != i ? C.frameOf(i) : null) || C._cardBack || null;
}, S = this._settleRowTpl, B = function(e, t, n) {
var a = (e.name || "") + (t == l ? "(我)" : "") + (t == d ? "(庄)" : ""), o = [], s = "";
if (e.daos) {
for (var c = 0; c < e.daos.length; ++c) {
var r = e.daos[c].cards || [];
o.push(r[0], r[1]);
}
s = e.daos.map(function(e) {
return e.desc;
}).join(" ");
e.wulong && (s = "乌龙 " + s);
} else {
o = C._mianOrder(e.holds || []);
var h = e.typeName || "", u = 1 == e.typeKey || "散牌" == h ? C._mianParts(e.holds) : "";
s = h + (u ? "(" + u + ")" : "");
}
var v = "string" == typeof n ? n : null == n ? "与我 0" : "与我 " + (n > 0 ? "+" : "") + n, g = -56 * (b + .5);
b++;
if (S && cc.isValid(S)) {
var _ = cc.instantiate(S);
_.active = !0;
_.parent = i;
_.setPosition(0, g);
C.setStr(C.findNode(_, "rowName"), a);
C.setStr(C.findNode(_, "rowDesc"), s);
C.setStr(C.findNode(_, "rowScore"), v);
for (var f = 0; f < 6; ++f) {
var m = C.findNode(_, "card" + f);
if (m) if (null != o[f]) {
m.active = !0;
var p = m.getComponent(cc.Sprite);
p && (p.spriteFrame = C.frameOf(o[f]) || C._cardBack || null);
} else m.active = !1;
}
} else {
var B = new cc.Node("bbSettleRow");
B.parent = i;
B.setPosition(0, g);
y(B, -470, 140, 20, cc.Label.HorizontalAlign.RIGHT, a);
for (var w = -360, M = 0; M < 6; ++M) {
N(B, w, o[M]);
w += e.daos && M % 2 == 1 ? 56 : 40;
}
y(B, 55, 380, 19, cc.Label.HorizontalAlign.LEFT, s);
y(B, 430, 200, 20, cc.Label.HorizontalAlign.RIGHT, v);
}
}, w = h.delta || 0, M = "本局 " + (w > 0 ? "+" : "") + w + "  总:" + (null != h.totalscore ? h.totalscore : 0);
B(h, l, M);
for (var T = 0; T < u.length; ++T) {
var x = f(u[T]);
x && B(x, u[T], _(u[T]));
}
if (this._settleScrollView && cc.isValid(i)) {
this._settleScrollView.content = i;
"function" == typeof this._settleScrollView.scrollToTop && this._settleScrollView.scrollToTop(0);
}
return !0;
},
onGameEnd: function(e) {
this._final = !0;
this._stopContinueRetry();
this._endDetail = e || {};
console.log("[BB] 收到 game_end, endinfo 人数=" + (this._endDetail.endinfo || []).length + ", 结算面板显示中=" + !(!this._n.resultPanel || !this._n.resultPanel.active));
if (!this._summaryShown && !this._pendingOver) if (this._n.resultPanel && this._n.resultPanel.active) this._settle1Done = !1; else if (this._settle1Done) {
var t = this;
this.scheduleOnce(function() {
cc.isValid(t.node) && !t._summaryShown && !t._pendingOver && t._settle1Done && t._showFinalSummary();
}, 0);
}
},
_showFinalSummary: function() {
if (!this._summaryShown) {
this._summaryShown = !0;
this._settle1Done = !0;
this._stopCountdown();
for (var e = [], t = (this._endDetail || {}).endinfo || [], i = 0; i < t.length; ++i) {
var n = t[i];
e.push((n.name || "") + "  总分:" + (null != n.score ? n.score : 0));
}
if (0 == e.length && cc.vv.gameNetMgr && cc.vv.gameNetMgr.seats) for (var a = cc.vv.gameNetMgr.seats, o = 0; o < a.length; ++o) a[o] && a[o].userId > 0 && e.push((a[o].name || "") + "  总分:" + (null != a[o].score ? a[o].score : 0));
var s = [];
if (e.length > 0) {
s.push("— 整场总分 —");
s = s.concat(e);
}
console.log("[BB] 弹整场结算, 总分人数=" + e.length + ", 倒计时=120s");
this._n.resultPanel && (this._n.resultPanel.active = !0);
this.setStr(this._n.resultTitle, "整场结算");
if (this._n.resultContent) {
this._n.resultContent.active = !0;
this._setSettleContentStyle(24, 32, 60);
this.setStr(this._n.resultContent, s.length > 0 ? s.join("\n") : "");
}
this._n.resultList && (this._n.resultList.active = !1);
this._settleCardsRoot && cc.isValid(this._settleCardsRoot) && (this._settleCardsRoot.active = !1);
this._resultShuffleBtn && (this._resultShuffleBtn.active = !1);
this._ensureSettleBtnFrames();
this._setSettleActionBtn("退出", !0);
this._n.resultExitBtn && (this._n.resultExitBtn.active = !1);
if (this._settleCd) {
var c = this;
this._startCountdown(120, this._settleCd, function() {
cc.isValid(c.node) && c.onExitRoom();
});
}
}
},
_startContinueRetry: function() {
var e = this;
if (!this._continueRetryTimer) {
var t = 0;
this._continueRetryTimer = setInterval(function() {
!cc.isValid(e.node) || e._started || e._final || !e._myContinued || ++t > 10 ? e._stopContinueRetry() : cc.vv.net.send("bb_continue", e._shufflePending ? {
shuffle: !0
} : void 0);
}, 800);
}
},
_stopContinueRetry: function() {
if (this._continueRetryTimer) {
clearInterval(this._continueRetryTimer);
this._continueRetryTimer = null;
}
},
onResultClose: function() {
this._stopCountdown();
if (this._roomEnd) this.onExitRoom(); else if (this._summaryShown) this.onExitRoom(); else {
this._n.resultPanel && (this._n.resultPanel.active = !1);
if (this._final) this._showFinalSummary(); else {
this._settleClosedAt = Date.now();
if (!this._myContinued) {
this._myContinued = !0;
cc.vv.net.send("bb_continue");
this._startContinueRetry();
this.showTip("已确定，等待其他玩家…");
}
}
}
},
onResultShuffle: function() {
this._stopCountdown();
if (!this._final && !this._roomEnd) {
this._shufflePending = !0;
this._n.resultPanel && (this._n.resultPanel.active = !1);
this._settleClosedAt = Date.now();
if (this._myContinued) {
cc.vv.net.send("bb_continue", {
shuffle: !0
});
this.showTip("已确定，等待其他玩家…");
} else {
this._myContinued = !0;
this.showTip("已确定，等待其他玩家…");
cc.vv.net.send("bb_continue", {
shuffle: !0
});
this._startContinueRetry();
}
}
},
_playShuffleAnim: function(e) {
var t = !1;
function i() {
if (!t) {
t = !0;
e && e();
}
}
try {
var n = function(e, t) {
for (var i = 0; i < e.length; ++i) e[i].runAction(cc.sequence(cc.delayTime(.015 * i), cc.moveBy(.3, cc.v2(h * t, 0)), cc.moveBy(.3, cc.v2(-h * t, 0))));
};
this._shuffleRoot && cc.isValid(this._shuffleRoot) || (this._shuffleRoot = this.findNode(this.node, "bbShuffleAnim") || cc.find("Canvas/bbShuffleAnim"));
var a = this._shuffleRoot;
if (!a || !cc.isValid(a) || !a.children || 0 == a.children.length) {
console.log("[BB] 洗牌动画节点缺失, 跳过动画直接发牌");
i();
return;
}
for (var o = [], s = [], c = 0; c < a.children.length; ++c) {
var r = a.children[c];
r.stopAllActions();
var l = this._homeOf(r);
r.setPosition(l.x, l.y);
r.setScale(l.sx, l.sy);
0 == r.name.indexOf("cardA") ? o.push(r) : 0 == r.name.indexOf("cardB") && s.push(r);
}
this._clearCards();
a.active = !0;
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("shuffle.wav");
a.parent && a.setSiblingIndex(a.parent.children.length - 1);
var h = 70;
n(o, 1);
n(s, -1);
this.scheduleOnce(function() {
cc.isValid(a) && (a.active = !1);
i();
}, 1);
} catch (e) {
console.error("[BB] 洗牌动画异常, 直接继续发牌", e);
i();
}
},
_avatarLocalPos: function(e) {
var t = this._seatNodes[this._layoutOf(this._total || 2)[e]], i = t && (t.icon || t.root);
return i && cc.isValid(i) ? this.node.convertToNodeSpaceAR(i.convertToWorldSpaceAR(cc.v2(0, 0))) : null;
},
_tableCenter: function() {
for (var e = this._total || 2, t = 0, i = 0, n = 0, a = 0; a < e; ++a) {
var o = this._avatarLocalPos(a);
if (o) {
t += o.x;
i += o.y;
++n;
}
}
return n > 0 ? cc.v2(t / n, i / n) : cc.v2(0, 0);
},
_clearFxNodes: function() {
for (var e = this._fxNodes || [], t = 0; t < e.length; ++t) cc.isValid(e[t]) && e[t].destroy();
this._fxNodes = [];
},
_fxNode: function(e, t) {
var i = new cc.Node(t);
i.parent = this.node;
i.parent && i.setSiblingIndex(i.parent.children.length - 1);
i.setPosition(e);
this._fxNodes || (this._fxNodes = []);
this._fxNodes.push(i);
return i;
},
_playHandFx: function(e) {
for (var t = this, i = this._total || 2, n = {}, a = [], o = 0; o < i; ++o) {
var s = this._watching ? o : (this._mySeat + o) % i, c = this._revealByGs[s];
n[o] = c && null != c.typeKey ? c.typeKey : null;
if (null != n[o]) {
var r = null;
n[o] >= 11 ? r = "fire" : 10 == n[o] ? r = "bomb" : 3 == n[o] ? r = "pairs" : 2 == n[o] && (r = "nine");
if (r) {
a.push({
kind: "hand",
off: o,
type: r
});
a.push({
kind: r,
off: o
});
}
}
}
if (0 != a.length) {
this._fxRunning = !0;
var l = 0, h = 0;
(function i() {
if (!cc.isValid(t.node) || l >= a.length) {
t._fxRunning = !1;
t._clearFxNodes();
e && e();
} else {
h = ++h;
var o = a[l++], s = h;
setTimeout(function() {
if (cc.isValid(t.node) && s === h) {
console.log("[BB] 特效步骤超时强制结束 step=" + s);
i();
}
}, 6e3);
"hand" == o.kind ? t._fxHandFocus(o.off, o.type, i) : "fire" == o.kind ? t._fxFire(o.off, i) : "bomb" == o.kind ? t._fxBomb(o.off, n, i) : t._fxPairsFx(o.kind, i);
}
})();
} else e && e();
},
_fxHandFocus: function(e, t, i) {
var n = this, a = this._total || 2, o = (this._watching || this._mySeat, this._seatNodes[this._layoutOf(a)[e]]);
if (o && o.slots) {
for (var s = this._tableCenter(), c = [], r = 0; r < 6; ++r) o.slots[r] && o.slots[r].active && c.push(o.slots[r]);
if (0 != c.length) {
var l = cc.resources.get("images/bbHandName_" + ({
fire: "flush",
bomb: "bomb",
pairs: "pairs3",
nine: "nine"
}[t] || "flush"), cc.SpriteFrame), h = null;
if (l) {
(h = new cc.Node("bbFxHandName")).parent = this.node;
h.setPosition(s.x, s.y + 200);
h.setSiblingIndex(this.node.children.length - 1);
var d = h.addComponent(cc.Sprite);
d.spriteFrame = l;
d.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var u = l.getOriginalSize().width, v = l.getOriginalSize().height;
r = Math.min(.62 * cc.winSize.width / u, 360 / v, 1);
h.setContentSize(u * r, v * r);
h.setScale(0);
this._fxNodes.push(h);
}
for (var g = -56 * (c.length - 1) / 2, _ = this.node.convertToWorldSpaceAR(s), f = 0; f < c.length; ++f) {
var m = c[f], p = this._homeOf(m), b = m.parent.convertToNodeSpaceAR(_);
m.stopAllActions();
m.setSiblingIndex(m.parent.children.length - 1);
m.runAction(cc.sequence(cc.spawn(cc.moveTo(.4, cc.v2(b.x + g + 56 * f, b.y)), cc.scaleTo(.4, 1.9)), cc.repeat(cc.sequence(cc.moveBy(.05, cc.v2(-3, 2)), cc.moveBy(.05, cc.v2(3, -2)), cc.moveBy(.05, cc.v2(2, -3)), cc.moveBy(.05, cc.v2(-2, 3))), 5), cc.spawn(cc.moveTo(.4, cc.v2(p.x, p.y)), cc.scaleTo(.4, p.sx, p.sy))));
}
h && h.runAction(cc.sequence(cc.scaleTo(.5, 1), cc.repeat(cc.sequence(cc.moveBy(.05, cc.v2(-3, 2)), cc.moveBy(.05, cc.v2(3, -2)), cc.moveBy(.05, cc.v2(2, -3)), cc.moveBy(.05, cc.v2(-2, 3))), 25), cc.fadeOut(.3), cc.removeSelf()));
this.scheduleOnce(function() {
cc.isValid(n.node) && i && i();
}, 1.9);
} else i && i();
} else i && i();
},
_fxPairsFx: function(e, t) {
var n = this._pairsFrames;
if (n && n.length) {
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX(i[e]);
var a = this._tableCenter(), o = this._fxNode(a, "bbFxPairsNine"), s = o.addComponent(cc.Sprite);
s.spriteFrame = n[0];
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var c = n[0].getOriginalSize().width, r = n[0].getOriginalSize().height;
o.setContentSize(c, r);
o.setScale(Math.min(cc.winSize.width / c, cc.winSize.height / r));
var l = 0, h = n.length, d = setInterval(function() {
if (cc.isValid(o)) if (++l >= h) {
clearInterval(d);
o.destroy();
t && t();
} else s.spriteFrame = n[l]; else clearInterval(d);
}, 1e3 / 24);
} else this._fxSceneAnim(e, t);
},
_fxSceneAnim: function(e, t) {
var n = this, a = i[e];
a && cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX(a);
var o = this.findNode(this.node, {
pairs: "bbFxPairs3",
nine: "bbFxNine"
}[e]);
if (o) {
o.active = !0;
o.parent && o.setSiblingIndex(o.parent.children.length - 1);
var s = o.getComponent(cc.Animation), c = 1;
if (s) {
try {
s.play();
} catch (e) {
console.warn("[BB] 牌型动画播放异常", e);
}
s.defaultClip && s.defaultClip.duration > 0 && (c = s.defaultClip.duration);
}
var r = !1;
this.scheduleOnce(function() {
if (!r) {
r = !0;
if (cc.isValid(n.node)) {
cc.isValid(o) && (o.active = !1);
t && t();
}
}
}, c + .1);
} else t && t();
},
_fxFire: function(e, t) {
var n = this._tableCenter(), a = this._fireFrames;
if (a && a.length) {
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX(i.fire);
var o = (l = this._fxNode(n, "bbFxFire")).addComponent(cc.Sprite);
o.spriteFrame = a[0];
l.setScale(1.6);
var s = 0, c = a.length, r = setInterval(function() {
if (cc.isValid(l)) if (++s >= c) {
clearInterval(r);
l.destroy();
t && t();
} else o.spriteFrame = a[s]; else clearInterval(r);
}, 1e3 / 30);
} else {
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX(i.fire);
var l, h = (l = this._fxNode(n, "bbFxFire")).addComponent(cc.Graphics);
h.fillColor = cc.color(255, 130, 0, 70);
h.circle(0, 0, 86);
h.fill();
h.fillColor = cc.color(255, 160, 30, 245);
h.ellipse(0, 10, 46, 80);
h.fill();
h.fillColor = cc.color(255, 90, 0, 245);
h.ellipse(0, -4, 30, 56);
h.fill();
h.fillColor = cc.color(255, 244, 180, 255);
h.ellipse(0, -18, 15, 32);
h.fill();
l.setScale(.12);
l.runAction(cc.sequence(cc.spawn(cc.scaleTo(.5, 1.15, 1.3), cc.fadeIn(.2)), cc.spawn(cc.moveBy(1.5, cc.v2(0, 620)), cc.scaleTo(1.5, .62, .9), cc.fadeOut(1.5)), cc.removeSelf()));
this.scheduleOnce(function() {
cc.isValid(l) && l.destroy();
t && t();
}, 2.1);
}
},
_fxBomb: function(e, t, n) {
var a = this, o = this._tableCenter();
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX(i.bomb);
var s = this._bombFrames;
if (s && s.length) {
var c = this._fxNode(o, "bbFxBomb"), r = c.addComponent(cc.Sprite);
r.spriteFrame = s[0];
c.setScale(1.4);
var l = 0, h = s.length, d = setInterval(function() {
if (cc.isValid(c)) if (++l >= h) {
clearInterval(d);
c.destroy();
} else r.spriteFrame = s[l]; else clearInterval(d);
}, 1e3 / 30);
this.scheduleOnce(function() {
cc.isValid(a.node) && n && n();
}, h / 30 + 1);
} else {
var u = this._fxNode(o, "bbFxBomb"), v = u.addComponent(cc.Graphics);
v.fillColor = cc.color(255, 70, 0, 230);
f(68, 26, 12);
v.fill();
v.fillColor = cc.color(255, 190, 40, 255);
f(40, 16, 12);
v.fill();
v.fillColor = cc.color(255, 255, 220, 255);
v.circle(0, 0, 20);
v.fill();
var g = this._fxNode(o, "bbFxWave"), _ = g.addComponent(cc.Graphics);
_.strokeColor = cc.color(255, 230, 120, 210);
_.lineWidth = 8;
_.circle(0, 0, 46);
_.stroke();
u.setScale(.12);
u.runAction(cc.sequence(cc.scaleTo(.25, 1.35), cc.spawn(cc.scaleTo(.4, 1.8), cc.fadeOut(.4)), cc.removeSelf()));
g.setScale(.3);
g.opacity = 230;
g.runAction(cc.sequence(cc.scaleTo(.45, 1.9), cc.spawn(cc.scaleTo(.3, 2.5), cc.fadeOut(.3)), cc.removeSelf()));
this.scheduleOnce(function() {
cc.isValid(u) && u.destroy();
cc.isValid(g) && g.destroy();
cc.isValid(a.node) && n && n();
}, 2);
}
function f(e, t, i) {
for (var n = 0; n < 2 * i; ++n) {
var a = Math.PI * n / i - Math.PI / 2, o = n % 2 == 0 ? e : t, s = Math.cos(a) * o, c = Math.sin(a) * o;
0 == n ? v.moveTo(s, c) : v.lineTo(s, c);
}
v.close();
}
},
onContinueOk: function(e) {
if (e) {
var t = e.total || this._total, i = null != e.continuedCount ? e.continuedCount : e.readyCount || 0;
this._myContinued ? this.showTip("已准备 (" + i + "/" + t + ")") : this._n.resultPanel && this._n.resultPanel.active && this.showTip("有玩家已准备 (" + i + "/" + t + ")");
}
},
onUserStateChanged: function(e) {
this.renderSeats();
var t = cc.vv.gameNetMgr;
this._n.resultPanel && this._n.resultPanel.active || e && t.seats && t.seatIndex >= 0 && t.seats[t.seatIndex] && e.userid == t.seats[t.seatIndex].userid && (this._started || this.showPrepareUI());
},
onReady: function() {
cc.vv.net.send("ready");
this._n.readyBtn && (this._n.readyBtn.active = !1);
this._n.dissolveBtn && (this._n.dissolveBtn.active = !1);
},
onExitRequest: function() {
var e = !(!this._n.resultPanel || !this._n.resultPanel.active);
if (!this._started || e || this._final) this.onExitRoom(); else {
this._exitPending = !0;
var t = this.findNode(this.node, "settings");
t && (t.active = !1);
this.showTip("本局结束后自动退出房间");
}
},
onExitRoom: function() {
if (this._started) this.showTip("牌局已开始，无法退出房间"); else {
this._stopCountdown();
this._myContinued = !0;
cc.vv.gameNetMgr && cc.vv.gameNetMgr.clearRoomState && cc.vv.gameNetMgr.clearRoomState();
var e = this;
cc.vv.net.send("leave_room");
this._exitTimer = setTimeout(function() {
e._exitTimer = null;
cc.isValid(e.node) && !e._leaving && e.leaveRoom();
}, 500);
}
},
onExit: function() {
var e = this, t = function() {
e._n.resultPanel && (e._n.resultPanel.active = !1);
e.showTip("正在退出房间…");
cc.vv.net.send(e._final ? "leave_room" : "exit");
e._exitTimer = setTimeout(function() {
e._exitTimer = null;
if (cc.isValid(e.node) && !e._leaving) {
cc.vv.gameNetMgr && cc.vv.gameNetMgr.clearRoomState && cc.vv.gameNetMgr.clearRoomState();
e.leaveRoom();
}
}, 500);
};
!this._final && cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show(null, "是否确定退出房间？", t, !0) : t();
},
onDissolve: function() {
var e = this, t = function() {
if ("begin" == cc.vv.gameNetMgr.gamestate) {
cc.vv.net.send("dissolve_request");
e.showTip("已发起解散申请，等待其他玩家同意");
} else cc.vv.net.send("dispress");
};
cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show(null, "解散房间不扣宝宝豆，是否确定解散？", t, !0) : t();
},
onDissolveAgree: function() {
cc.vv.net.send("dissolve_agree");
this._n.dissolvePanel && (this._n.dissolvePanel.active = !1);
},
onDissolveReject: function() {
cc.vv.net.send("dissolve_reject");
this._n.dissolvePanel && (this._n.dissolvePanel.active = !1);
},
leaveRoom: function() {
if (!this._leaving) {
this._leaving = !0;
this._stopContinueRetry();
var e = cc.director.getScene ? cc.director.getScene() : null, t = e && e.name ? e.name : "";
if ("hall" !== t && "club" !== t) {
var i = cc.vv.gameNetMgr;
i && (i._ignoreDisconnectOnce = !0);
if (i && "club" === i.roomBackScene || cc.vv.fromClubId || i && i.roomBackClubId) {
cc.vv.fromClub = !0;
i && i.roomBackClubId && !cc.vv.fromClubId && (cc.vv.fromClubId = i.roomBackClubId);
cc.vv.sceneMgr ? cc.vv.sceneMgr.load("club") : cc.director.loadScene("club");
} else cc.vv.sceneMgr ? cc.vv.sceneMgr.load("hall") : cc.director.loadScene("hall");
}
}
},
showTip: function(e) {
this.setStr(this._n.tipLabel, e || "");
}
});
cc._RF.pop();
}, {} ],
Chat: [ function(e, t) {
"use strict";
cc._RF.push(t, "76549noA9RG1IWEXK1ranbY", "Chat");
cc.Class({
extends: cc.Component,
properties: {
_chatRoot: null,
_tabQuick: null,
_tabEmoji: null,
_iptChat: null,
_quickChatInfo: null,
_btnChat: null
},
onLoad: function() {
if (null != cc.vv) {
cc.vv.chat = this;
this._btnChat = this.node.getChildByName("btn_chat");
this._btnChat.active = 0 == cc.vv.replayMgr.isReplay();
this._chatRoot = this.node.getChildByName("chat");
this._chatRoot.active = !1;
this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
this._tabEmoji = this._chatRoot.getChildByName("emojis");
this._iptChat = this._chatRoot.getChildByName("iptChat").getComponent(cc.EditBox);
this._quickChatInfo = {};
this._quickChatInfo.item0 = {
index: 0,
content: "快点啊，都等到我花儿都谢谢了！",
sound: "fix_msg_1.mp3"
};
this._quickChatInfo.item1 = {
index: 1,
content: "怎么又断线了，网络怎么这么差啊！",
sound: "fix_msg_2.mp3"
};
this._quickChatInfo.item2 = {
index: 2,
content: "不要走，决战到天亮！",
sound: "fix_msg_3.mp3"
};
this._quickChatInfo.item3 = {
index: 3,
content: "你的牌打得也太好了！",
sound: "fix_msg_4.mp3"
};
this._quickChatInfo.item4 = {
index: 4,
content: "你是妹妹还是哥哥啊？",
sound: "fix_msg_5.mp3"
};
this._quickChatInfo.item5 = {
index: 5,
content: "和你合作真是太愉快了！",
sound: "fix_msg_6.mp3"
};
this._quickChatInfo.item6 = {
index: 6,
content: "大家好，很高兴见到各位！",
sound: "fix_msg_7.mp3"
};
this._quickChatInfo.item7 = {
index: 7,
content: "各位，真是不好意思，我得离开一会儿。",
sound: "fix_msg_8.mp3"
};
this._quickChatInfo.item8 = {
index: 8,
content: "不要吵了，专心玩游戏吧！",
sound: "fix_msg_9.mp3"
};
}
},
getQuickChatInfo: function(e) {
var t = "item" + e;
return this._quickChatInfo[t];
},
onBtnChatClicked: function() {
this._chatRoot.active = !0;
},
onBgClicked: function() {
this._chatRoot.active = !1;
},
onTabClicked: function(e) {
if ("tabQuick" == e.target.name) {
this._tabQuick.active = !0;
this._tabEmoji.active = !1;
} else if ("tabEmoji" == e.target.name) {
this._tabQuick.active = !1;
this._tabEmoji.active = !0;
}
},
onQuickChatItemClicked: function(e) {
this._chatRoot.active = !1;
var t = this._quickChatInfo[e.target.name];
cc.vv.net.send("quick_chat", t.index);
},
onEmojiItemClicked: function(e) {
console.log(e.target.name);
this._chatRoot.active = !1;
cc.vv.net.send("emoji", e.target.name);
},
onBtnSendChatClicked: function() {
this._chatRoot.active = !1;
if ("" != this._iptChat.string) {
cc.vv.net.send("chat", this._iptChat.string);
this._iptChat.string = "";
}
}
});
cc._RF.pop();
}, {} ],
CheckBox: [ function(e, t) {
"use strict";
cc._RF.push(t, "c28b9sPc5hKn7UEQdim51Ja", "CheckBox");
cc.Class({
extends: cc.Component,
properties: {
target: cc.Node,
sprite: cc.SpriteFrame,
checkedSprite: cc.SpriteFrame,
checked: !1
},
onLoad: function() {
this.refresh();
},
onClicked: function() {
this.checked = !this.checked;
this.refresh();
},
refresh: function() {
var e = this.target.getComponent(cc.Sprite);
this.checked ? e.spriteFrame = this.checkedSprite : e.spriteFrame = this.sprite;
}
});
cc._RF.pop();
}, {} ],
CreateRoom: [ function(e, t) {
"use strict";
cc._RF.push(t, "4f8710GtexB7r0Q7wvjVNEv", "CreateRoom");
cc.Class({
extends: cc.Component,
properties: {
_difenxuanze: null,
_zimo: null,
_wanfaxuanze: null,
_zuidafanshu: null,
_jushuxuanze: null,
_dianganghua: null,
_leixingxuanze: null
},
onLoad: function() {
this._leixingxuanze = [];
for (var e = this.node.getChildByName("leixingxuanze"), t = 0; t < e.childrenCount; ++t) null != (i = e.children[t].getComponent("RadioButton")) && this._leixingxuanze.push(i);
this._difenxuanze = [];
for (e = this.node.getChildByName("difenxuanze"), t = 0; t < e.childrenCount; ++t) null != (i = e.children[t].getComponent("RadioButton")) && this._difenxuanze.push(i);
this._zimo = [];
for (e = this.node.getChildByName("zimojiacheng"), t = 0; t < e.childrenCount; ++t) null != (i = e.children[t].getComponent("RadioButton")) && this._zimo.push(i);
this._wanfaxuanze = [];
for (e = this.node.getChildByName("wanfaxuanze"), t = 0; t < e.childrenCount; ++t) null != (i = e.children[t].getComponent("CheckBox")) && this._wanfaxuanze.push(i);
this._zuidafanshu = [];
for (e = this.node.getChildByName("zuidafanshu"), t = 0; t < e.childrenCount; ++t) null != (i = e.children[t].getComponent("RadioButton")) && this._zuidafanshu.push(i);
this._jushuxuanze = [];
for (e = this.node.getChildByName("xuanzejushu"), t = 0; t < e.childrenCount; ++t) null != (i = e.children[t].getComponent("RadioButton")) && this._jushuxuanze.push(i);
this._dianganghua = [];
for (e = this.node.getChildByName("dianganghua"), t = 0; t < e.childrenCount; ++t) {
var i;
null != (i = e.children[t].getComponent("RadioButton")) && this._dianganghua.push(i);
}
this.node.getChildByName("leixingxuanze").active = !1;
},
onBtnBack: function() {
this.node.active = !1;
},
onBtnOK: function() {
this.node.active = !1;
this.createRoom();
},
createRoom: function() {
for (var e = 0, t = 0; t < this._difenxuanze.length; ++t) if (this._difenxuanze[t].checked) {
e = t;
break;
}
var i = 0;
for (t = 0; t < this._zimo.length; ++t) if (this._zimo[t].checked) {
i = t;
break;
}
var n = this._wanfaxuanze[0].checked, a = this._wanfaxuanze[1].checked, o = this._wanfaxuanze[2].checked, s = this._wanfaxuanze[3].checked, c = 0;
for (t = 0; t < this._zuidafanshu.length; ++t) if (this._zuidafanshu[t].checked) {
c = t;
break;
}
var r = 0;
for (t = 0; t < this._jushuxuanze.length; ++t) if (this._jushuxuanze[t].checked) {
r = t;
break;
}
var l = 0;
for (t = 0; t < this._dianganghua.length; ++t) if (this._dianganghua[t].checked) {
l = t;
break;
}
var h = {
type: "xlch",
difen: e,
zimo: i,
jiangdui: a,
huansanzhang: n,
zuidafanshu: c,
jushuxuanze: r,
dianganghua: l,
menqing: o,
tiandihu: s
}, d = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
conf: JSON.stringify(h)
};
console.log(d);
cc.vv.wc.show("正在创建房间");
cc.vv.http.sendRequest("/create_private_room", d, function(e) {
0 !== e.errcode ? 2222 == e.errcode ? cc.vv.wc.showError("房卡不足，创建房间失败!") : cc.vv.wc.showError("创建房间失败,错误码:" + e.errcode) : cc.vv.gameNetMgr.connectGameServer(e);
});
}
});
cc._RF.pop();
}, {} ],
Folds: [ function(e, t) {
"use strict";
cc._RF.push(t, "9a304jWq+JBAIkQm1bY2h61", "Folds");
cc.Class({
extends: cc.Component,
properties: {
_folds: null
},
onLoad: function() {
if (null != cc.vv) {
this.initView();
this.initEventHandler();
this.initAllFolds();
}
},
initView: function() {
this._folds = {};
for (var e = this.node.getChildByName("game"), t = [ "myself", "right", "up", "left" ], i = 0; i < t.length; ++i) {
var n = t[i], a = e.getChildByName(n);
if (null != a) {
for (var o = [], s = a.getChildByName("folds"), c = 0; c < s.children.length; ++c) {
var r = s.children[c];
r.active = !1;
var l = r.getComponent(cc.Sprite);
l.spriteFrame = null;
o.push(l);
}
this._folds[n] = o;
}
}
this.hideAllFolds();
},
hideAllFolds: function() {
for (var e in this._folds) {
var t = this._folds[e];
for (var i in t) t[i].node.active = !1;
}
},
initEventHandler: function() {
var e = this;
this.node.on("game_begin", function() {
e.initAllFolds();
});
this.node.on("game_start", function() {
e.initAllFolds();
});
this.node.on("game_sync", function() {
e.initAllFolds();
});
this.node.on("game_chupai_notify", function() {
e.initAllFolds();
});
this.node.on("peng_notify", function() {
e.initAllFolds();
});
this.node.on("gang_notify", function() {
e.initAllFolds();
});
this.node.on("chi_notify", function() {
e.initAllFolds();
});
this.node.on("guo_notify", function(t) {
var i = t.detail;
i && i.seatData && e.initFolds(i.seatData);
});
},
initAllFolds: function() {
var e = cc.vv.gameNetMgr.seats;
for (var t in e) this.initFolds(e[t]);
},
initFolds: function(e) {
if (e) {
var t = e.folds;
if (null != t) {
var i = cc.vv.gameNetMgr.getLocalIndex(e.seatindex), n = cc.vv.mahjongmgr.getFoldPre(i), a = cc.vv.mahjongmgr.getSide(i), o = this._folds[a];
if (0 != o.length) {
for (var s = o[0].node.parent, c = o[0].node.y, r = 0, l = 0; l < o.length; ++l) Math.abs(o[l].node.y - c) < 1 && r++;
r <= 0 && (r = o.length);
var h = 0;
r < o.length && (h = o[r].node.y - c);
0 == h && (h = -40);
var d = 3 * r;
if (d > o.length) for (var u = o.length; u < d; ++u) {
var v = u % r, g = Math.floor(u / r), _ = cc.instantiate(o[v].node);
_.y = c + h * g;
_.active = !1;
s.addChild(_);
o.push(_.getComponent(cc.Sprite));
} else d = o.length;
this._foldStacks || (this._foldStacks = {});
for (var f = this._foldStacks[a] || [], m = 0; m < f.length; ++m) cc.isValid(f[m]) && f[m].destroy();
var p = [];
this._foldStacks[a] = p;
for (var b = Math.min(t.length, d), C = 0; C < t.length; ++C) {
var y = C % d, N = Math.floor(C / d), S = y;
"right" != a && "up" != a || (S = o.length - y - 1);
var B = o[S];
if (0 == N) {
B.node.active = !0;
this.setSpriteFrameByMJID(n, B, t[C]);
} else {
var w = B.node, M = cc.instantiate(w);
M.x = w.x;
M.y = w.y + 8 * N;
M.zIndex = w.zIndex + N;
s.addChild(M);
M.active = !0;
this.setSpriteFrameByMJID(n, M.getComponent(cc.Sprite), t[C]);
p.push(M);
}
}
for (C = b; C < o.length; ++C) {
S = C;
"right" != a && "up" != a || (S = o.length - C - 1);
(B = o[S]).spriteFrame = null;
B.node.active = !1;
}
}
}
}
},
setSpriteFrameByMJID: function(e, t, i) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, i);
t.node.active = !0;
}
});
cc._RF.pop();
}, {} ],
GameOver: [ function(e, t) {
"use strict";
cc._RF.push(t, "ce353SCfT5DTo9QXPqOipBU", "GameOver");
cc.Class({
extends: cc.Component,
properties: {
_gameover: null,
_gameresult: null,
_seats: [],
_isGameEnd: !1,
_pingju: null,
_win: null,
_lose: null
},
onLoad: function() {
if (null != cc.vv && null != cc.vv.gameNetMgr.conf) {
"xzdd" == cc.vv.gameNetMgr.conf.type ? this._gameover = this.node.getChildByName("game_over") : this._gameover = this.node.getChildByName("game_over_xlch");
this._gameover.active = !1;
this._pingju = this._gameover.getChildByName("pingju");
this._win = this._gameover.getChildByName("win");
this._lose = this._gameover.getChildByName("lose");
this._gameover.x = 0;
this._gameover.setScale(.85);
for (var e = [ this._win, this._lose, this._pingju ], t = 0; t < e.length; ++t) {
var i = e[t];
i && (i.x = 0);
}
this._gameresult = this.node.getChildByName("game_result");
if (this._gameresult) {
this._gameresult.width = cc.winSize.width;
this._gameresult.x = 0;
var n = this._gameresult.getChildByName("Z_jiesuanditu");
if (n) {
n.width = cc.winSize.width;
n.x = 0;
}
var a = this._gameresult.getChildByName("GameEnd7");
if (a) {
a.width = cc.winSize.width;
a.x = 0;
var o = a.getComponent(cc.Sprite);
if (o && o.spriteFrame) {
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
o.type = cc.Sprite.Type.SLICED;
}
}
}
this._gameover.getChildByName("wanfa").getComponent(cc.Label).string = cc.vv.gameNetMgr.getWanfa();
for (var s = this._gameover.getChildByName("result_list"), c = 1; c <= 4; ++c) {
var r = "s" + c, l = s.getChildByName(r), h = {};
h.username = l.getChildByName("username").getComponent(cc.Label);
h.reason = l.getChildByName("reason").getComponent(cc.Label);
var d = l.getChildByName("fan");
null != d && (h.fan = d.getComponent(cc.Label));
h.score = l.getChildByName("score").getComponent(cc.Label);
h.hu = l.getChildByName("hu");
h.mahjongs = l.getChildByName("pai");
h.zhuang = l.getChildByName("zhuang");
h.hupai = l.getChildByName("hupai");
h._pengandgang = [];
this._seats.push(h);
}
var u = this;
this.node.on("game_over", function(e) {
u.onGameOver(e.detail);
});
this.node.on("game_end", function() {
u._isGameEnd = !0;
if (u._autoReadyCb) {
u.unschedule(u._autoReadyCb);
u._autoReadyCb = null;
}
u._gameresult && (u._gameresult.active = !0);
u._gameover && (u._gameover.active = !1);
});
}
},
onGameOver: function(e) {
var t = cc.vv.gameNetMgr.conf.type;
"zj" == t || "zj_bt" == t || "zj4" == t || "zj4_bt" == t || "zj_lao" == t || "zj_zx" == t || "zj4_zx" == t ? this.onGameOver_ZJ(e) : "xzdd" == t ? this.onGameOver_XZDD(e) : this.onGameOver_XLCH(e);
},
onGameOver_ZJ: function(e) {
var t = cc.vv.gameNetMgr.conf ? cc.vv.gameNetMgr.conf.type : null;
console.log(e);
if (e && 0 != e.length) {
this._gameover.active = !0;
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
for (var i = cc.vv.gameNetMgr.seatIndex, n = 0, a = 0; a < e.length; ++a) if (e[a] && e[a].userid == cc.vv.gameNetMgr.seats[i].userid) {
n = e[a].score;
break;
}
n > 0 ? this._win.active = !0 : n < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (a = 0; a < this._seats.length; ++a) {
var o = this._seats[a], s = e[a], c = o.username.node.parent;
if (s) {
c.active = !0;
for (var r = !1, l = [], h = o.hupai, d = 0; d < h.children.length; ++d) h.children[d].active = !1;
var u = 0, v = s.huinfo || [];
for (d = 0; d < v.length; ++d) {
var g = v[d];
r = r || g.ishupai;
if (g.ishupai) {
if (u < h.children.length) {
var _ = h.children[u];
_.active = !0;
_.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", g.pai);
u++;
}
"zimo" == g.action ? l.push("自摸") : "hu" == g.action && l.push("接炮胡");
if ("zj_lao" == t) {
if (g.tailog && g.tailog.length) {
for (var f = [], m = 0; m < g.tailog.length; ++m) g.tailog[m].indexOf("×2") >= 0 && f.push(g.tailog[m]);
f.length && l.push(f.join("，"));
}
} else if (null != g.fan) {
l.push(g.fan + "台");
g.tailog && g.tailog.length && l.push("(" + g.tailog.join("，") + ")");
}
} else "fangpao" == g.action && l.push("放炮");
}
if ("zj_bt" == t) {
if (s.isBao) {
var p = "";
0 === s.baoModeOfRound ? p = "无财" : 1 === s.baoModeOfRound ? p = "独财" : 2 === s.baoModeOfRound && (p = "双财");
var b = "包家" + p;
s.baoTaiOfRound && (b += "包" + s.baoTaiOfRound + "台");
l.unshift(b);
}
var C = s.huBaseScore || 0, y = s.baoTaiScore || 0;
0 != C && l.push("胡牌分" + (C > 0 ? "+" : "") + C);
0 != y && l.push("包台分" + (y > 0 ? "+" : "") + y);
}
o.hu.active = r;
var N = s.angangs || [], S = s.diangangs || [], B = s.wangangs || [], w = s.pengs || [], M = s.chis || [];
N.length && l.push("暗杠x" + N.length);
S.length && l.push("明杠x" + S.length);
B.length && l.push("补杠x" + B.length);
o.username.string = cc.vv.gameNetMgr.seats[a] ? cc.vv.gameNetMgr.seats[a].name : "";
o.zhuang.active = cc.vv.gameNetMgr.button == a;
var T = cc.vv.gameNetMgr.button == a && cc.vv.gameNetMgr.laozhuang || 0;
this.updateSettleLaoZhuang(o, T);
o.reason.string = l.join("、");
s.score > 0 ? o.score.string = "+" + s.score : o.score.string = "" + s.score;
for (var x = 0; x < o.mahjongs.childrenCount; ++x) o.mahjongs.children[x].active = !1;
var R = (s.holds || []).slice();
"object" == typeof R && null != R.length || (R = []);
cc.vv.mahjongmgr.sortMJ(R);
var I = N.length + B.length + S.length, k = 3 * (w.length + I + M.length);
for (x = 0; x < R.length; ++x) {
var A = R[x], L = o.mahjongs.children[x + k];
if (null == L) break;
L.active = !0;
L.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", A);
}
for (x = 0; x < o._pengandgang.length; ++x) o._pengandgang[x].active = !1;
var P = 0;
for (x = 0; x < N.length; ++x) {
this.initPengAndGangs(o, P, N[x], "angang");
P++;
}
for (x = 0; x < S.length; ++x) {
this.initPengAndGangs(o, P, S[x], "diangang");
P++;
}
for (x = 0; x < B.length; ++x) {
this.initPengAndGangs(o, P, B[x], "wangang");
P++;
}
for (x = 0; x < w.length; ++x) {
var F = s.pengTiles && s.pengTiles[x] || null;
this.initPengAndGangs(o, P, w[x], "peng", F);
P++;
}
for (x = 0; x < M.length; ++x) {
var E = M[x];
if (E && E.length > 0) {
this.initChisGroup(o, P, E);
P++;
}
}
} else c.active = !1;
}
this.showSettleCaishen();
this.startAutoReadyTimer();
} else this._gameresult.active = !0;
},
showSettleCaishen: function() {
var e = cc.vv.gameNetMgr.conf || {};
if ("zj_zx" != e.type && "zj4_zx" != e.type) {
var t = null != e.caishen ? e.caishen : -1, i = null != e.caishen2 ? e.caishen2 : -1;
if (!(t < 0)) {
var n = this._gameover.getChildByName("settleCsArea");
if (n) {
n.active = !0;
var a = i >= 0 && i != t ? [ t, i ] : [ t ], o = n.getChildByName("csLab");
o && (o.active = !0);
for (var s = 0; s < 2; ++s) {
var c = n.getChildByName("cs" + s);
if (c) {
var r = c.getComponent(cc.Sprite);
if (s < a.length) {
c.active = !0;
r && (r.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", a[s]));
} else c.active = !1;
}
}
} else console.log("[结算财神] 场景内未找到 settleCsArea 节点,跳过显示(请在结算弹窗下手动添加)");
}
}
},
startAutoReadyTimer: function() {
if (this._autoReadyCb) {
this.unschedule(this._autoReadyCb);
this._autoReadyCb = null;
}
if (!this._isGameEnd) {
var e = this;
this._autoReadyCb = function() {
e._autoReadyCb = null;
if (e._gameover && e._gameover.active) {
console.log("[结算]30秒未操作,自动准备下一局");
e.onBtnReadyClicked();
}
};
this.scheduleOnce(this._autoReadyCb, 30);
}
},
updateSettleLaoZhuang: function(e, t) {
var i = e.zhuang;
if (i) {
var n = i.getChildByName("laozhuang_ex");
if (null == n) {
(n = new cc.Node("laozhuang_ex")).setContentSize(60, 22);
n.setPosition(0, -34);
i.addChild(n);
var a = n.addComponent(cc.Label);
a.fontSize = 18;
a.lineHeight = 22;
a.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
a.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.overflow = cc.Label.Overflow.NONE;
n.color = cc.color(255, 225, 120);
var o = n.addComponent(cc.LabelOutline);
o.color = cc.color(60, 30, 0);
o.width = 2;
}
var s = null != t && t >= 1;
n.active = s;
s && (n.getComponent(cc.Label).string = "老庄" + t);
}
},
onGameOver_XZDD: function(e) {
console.log(e);
if (0 != e.length) {
this._gameover.active = !0;
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
var t = e[cc.vv.gameNetMgr.seatIndex].score;
t > 0 ? this._win.active = !0 : t < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (var i = 0; i < 4; ++i) {
for (var n = this._seats[i], a = e[i], o = !1, s = a.angangs.length + a.wangangs.length + a.diangangs.length, c = a.numofgen, r = [], l = !1, h = 0; h < a.actions.length; ++h) {
var d = a.actions[h];
if ("zimo" == d.type || "ganghua" == d.type || "dianganghua" == d.type || "hu" == d.type || "gangpaohu" == d.type || "qiangganghu" == d.type || "chadajiao" == d.type) {
"7pairs" == a.pattern ? r.push("七对") : "l7pairs" == a.pattern ? r.push("龙七对") : "j7pairs" == a.pattern ? r.push("将七对") : "duidui" == a.pattern ? r.push("碰碰胡") : "jiangdui" == a.pattern && r.push("将对");
"zimo" == d.type ? r.push("自摸") : "ganghua" == d.type ? r.push("杠上花") : "dianganghua" == d.type ? r.push("点杠花") : "gangpaohu" == d.type ? r.push("杠炮胡") : "qiangganghu" == d.type ? r.push("抢杠胡") : "chadajiao" == d.type && (l = !0);
o = !0;
} else "fangpao" == d.type ? r.push("放炮") : "angang" == d.type ? r.push("暗杠") : "diangang" == d.type ? r.push("明杠") : "wangang" == d.type ? r.push("弯杠") : "fanggang" == d.type ? r.push("放杠") : "zhuanshougang" == d.type ? r.push("转手杠") : "beiqianggang" == d.type ? r.push("被抢杠") : "beichadajiao" == d.type && r.push("被查叫");
}
if (o) {
a.qingyise && r.push("清一色");
a.menqing && r.push("门清");
a.zhongzhang && r.push("中张");
a.jingouhu && r.push("金钩胡");
a.haidihu && r.push("海底胡");
a.tianhu && r.push("天胡");
a.dihu && r.push("地胡");
c > 0 && r.push("根x" + c);
l && r.push("查大叫");
}
for (var u = 0; u < 3; ++u) n.hu.children[u].active = !1;
a.huorder >= 0 && (n.hu.children[a.huorder].active = !0);
n.username.string = cc.vv.gameNetMgr.seats[i].name;
n.zhuang.active = cc.vv.gameNetMgr.button == i;
n.reason.string = r.join("、");
var v = 0;
o && (v = a.fan);
n.fan.string = v + "番";
a.score > 0 ? n.score.string = "+" + a.score : n.score.string = a.score;
var g = -1;
o && (g = a.holds.pop());
cc.vv.mahjongmgr.sortMJ(a.holds, a.dingque);
o && a.holds.push(g);
for (var _ = 0; _ < n.mahjongs.childrenCount; ++_) (m = n.mahjongs.children[_]).active = !1;
var f = 3 * (a.pengs.length + s);
for (_ = 0; _ < a.holds.length; ++_) {
var m, p = a.holds[_];
(m = n.mahjongs.children[_ + f]).active = !0;
m.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", p);
}
for (_ = 0; _ < n._pengandgang.length; ++_) n._pengandgang[_].active = !1;
var b = 0, C = a.angangs;
for (_ = 0; _ < C.length; ++_) {
var y = C[_];
this.initPengAndGangs(n, b, y, "angang");
b++;
}
for (C = a.diangangs, _ = 0; _ < C.length; ++_) {
y = C[_];
this.initPengAndGangs(n, b, y, "diangang");
b++;
}
for (C = a.wangangs, _ = 0; _ < C.length; ++_) {
y = C[_];
this.initPengAndGangs(n, b, y, "wangang");
b++;
}
var N = a.pengs;
if (N) for (_ = 0; _ < N.length; ++_) {
y = N[_];
this.initPengAndGangs(n, b, y, "peng");
b++;
}
}
} else this._gameresult.active = !0;
},
onGameOver_XLCH: function(e) {
console.log(e);
if (0 != e.length) {
this._gameover.active = !0;
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
var t = e[cc.vv.gameNetMgr.seatIndex].score;
t > 0 ? this._win.active = !0 : t < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (var i = 0; i < 4; ++i) {
for (var n = this._seats[i], a = e[i], o = !1, s = [], c = n.hupai, r = 0; r < c.children.length; ++r) c.children[r].active = !1;
var l = 0;
for (r = 0; r < a.huinfo.length; ++r) {
var h = a.huinfo[r];
o = o || h.ishupai;
if (h.ishupai && l < c.children.length) {
var d = c.children[l];
d.active = !0;
d.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", h.pai);
l++;
}
var u = "", v = "", g = a;
if (h.ishupai) "hu" == h.action ? u = "接炮胡" : "zimo" == h.action ? u = "自摸" : "ganghua" == h.action ? u = "杠上花" : "dianganghua" == h.action ? u = "点杠花" : "gangpaohu" == h.action ? u = "杠炮胡" : "qiangganghu" == h.action ? u = "抢杠胡" : "chadajiao" == h.action && (u = "查大叫"); else {
u = "fangpao" == h.action ? "放炮" : "gangpao" == h.action ? "杠上炮" : "beiqianggang" == h.action ? "被抢杠" : "被查大叫";
h = (g = e[h.target]).huinfo[h.index];
}
u += "(";
if ("7pairs" == h.pattern) {
u += "七对";
v = "、";
} else if ("l7pairs" == h.pattern) {
u += "龙七对";
v = "、";
} else if ("j7pairs" == h.pattern) {
u += "将七对";
v = "、";
} else if ("duidui" == h.pattern) {
u += "碰碰胡";
v = "、";
} else if ("jiangdui" == h.pattern) {
u += "将对";
v = "、";
}
if (h.haidihu) {
u += v + "海底胡";
v = "、";
}
if (h.tianhu) {
u += v + "天胡";
v = "、";
}
if (h.dihu) {
u += v + "地胡";
v = "、";
}
if (g.qingyise) {
u += v + "清一色";
v = "、";
}
if (g.menqing) {
u += v + "门清";
v = "、";
}
if (g.jingouhu) {
u += v + "金钩胡";
v = "、";
}
if (g.zhongzhang) {
u += v + "中张";
v = "、";
}
if (h.numofgen > 0) {
u += v + "根x" + h.numofgen;
v = "、";
}
"" == v && (u += "平胡");
u += "、" + h.fan + "番";
u += ")";
s.push(u);
}
n.hu.active = o;
a.angangs.length && s.push("暗杠x" + a.angangs.length);
a.diangangs.length && s.push("明杠x" + a.diangangs.length);
a.wangangs.length && s.push("巴杠x" + a.wangangs.length);
n.username.string = cc.vv.gameNetMgr.seats[i].name;
n.zhuang.active = cc.vv.gameNetMgr.button == i;
n.reason.string = s.join("、");
a.score > 0 ? n.score.string = "+" + a.score : n.score.string = a.score;
for (var _ = 0; _ < n.mahjongs.childrenCount; ++_) (p = n.mahjongs.children[_]).active = !1;
cc.vv.mahjongmgr.sortMJ(a.holds, a.dingque);
var f = a.angangs.length + a.wangangs.length + a.diangangs.length, m = 3 * (a.pengs.length + f);
for (_ = 0; _ < a.holds.length; ++_) {
var p, b = a.holds[_];
(p = n.mahjongs.children[_ + m]).active = !0;
p.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", b);
}
for (_ = 0; _ < n._pengandgang.length; ++_) n._pengandgang[_].active = !1;
var C = 0, y = a.angangs;
for (_ = 0; _ < y.length; ++_) {
var N = y[_];
this.initPengAndGangs(n, C, N, "angang");
C++;
}
for (y = a.diangangs, _ = 0; _ < y.length; ++_) {
N = y[_];
this.initPengAndGangs(n, C, N, "diangang");
C++;
}
for (y = a.wangangs, _ = 0; _ < y.length; ++_) {
N = y[_];
this.initPengAndGangs(n, C, N, "wangang");
C++;
}
var S = a.pengs;
if (S) for (_ = 0; _ < S.length; ++_) {
N = S[_];
this.initPengAndGangs(n, C, N, "peng");
C++;
}
}
} else this._gameresult.active = !0;
},
initPengAndGangs: function(e, t, i, n, a) {
var o = null;
if (e._pengandgang.length <= t) {
o = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e._pengandgang.push(o);
e.mahjongs.addChild(o);
} else (o = e._pengandgang[t]).active = !0;
for (var s = o.getComponentsInChildren(cc.Sprite), c = 0, r = 0; r < s.length; ++r) {
var l = s[r];
if ("gang" == l.node.name) {
var h = "peng" != n;
l.node.active = h;
l.node.scaleX = 1;
l.node.scaleY = 1;
if ("angang" == n) {
l.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
l.node.scaleX = 1.4;
l.node.scaleY = 1.4;
} else l.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", i);
} else {
var d = "peng" == n && a && c < a.length ? a[c] : i;
l.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", d);
c++;
}
}
o.x = 165 * t + 10 * t;
},
initChisGroup: function(e, t, i) {
var n = null;
if (e._pengandgang.length <= t) {
n = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e._pengandgang.push(n);
e.mahjongs.addChild(n);
} else (n = e._pengandgang[t]).active = !0;
for (var a = i.slice().sort(function(e, t) {
return e - t;
}), o = n.getComponentsInChildren(cc.Sprite), s = 0, c = 0; c < o.length; ++c) {
var r = o[c];
if ("gang" == r.node.name) r.node.active = !1; else {
var l = s < a.length ? a[s] : a[a.length - 1];
r.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", l);
s++;
}
}
n.x = 165 * t + 10 * t;
},
onBtnReadyClicked: function() {
console.log("onBtnReadyClicked");
if (this._autoReadyCb) {
this.unschedule(this._autoReadyCb);
this._autoReadyCb = null;
}
this._isGameEnd ? this._gameresult.active = !0 : cc.vv.net.send("ready");
this._gameover.active = !1;
},
onBtnShareClicked: function() {
console.log("onBtnShareClicked");
}
});
cc._RF.pop();
}, {} ],
GameResult: [ function(e, t) {
"use strict";
cc._RF.push(t, "da25b1xg2NHlrS/zlwhbBFd", "GameResult");
cc.Class({
extends: cc.Component,
properties: {
_gameresult: null
},
onLoad: function() {
if (null != cc.vv) {
this._gameresult = this.node.getChildByName("game_result");
if (this._gameresult) {
var e = this._gameresult.getChildByName("GameEnd7");
e && e.setContentSize(880, e.getContentSize().height);
}
var t = cc.find("Canvas/game_result/btnClose"), i = cc.find("Canvas/game_result/btnShare");
i && cc.vv.utils.addClickEvent(i, this.node, "GameResult", "onBtnCloseClicked");
t && (t.active = !1);
var n = this;
this.node.on("game_end", function(e) {
var t = e.detail || {};
n.onGameEnd(t.endinfo, t.roundHistory);
});
}
},
signedNum: function(e) {
return (e = e || 0) > 0 ? "+" + e : "" + e;
},
renderList: function(e, t) {
if (null != this._gameresult) {
var i = this._gameresult, n = i.getChildByName("title");
n && (n.active = !1);
var a = i.getChildByName("seats");
a && (a.active = !1);
var o = i.getChildByName("resultList");
o && o.destroy();
var s = cc.vv.gameNetMgr.seats;
if (s) {
for (var c = -1, r = 0; r < s.length; ++r) s[r] && "number" == typeof s[r].score && s[r].score > c && (c = s[r].score);
var l = new cc.Node("resultList");
i.addChild(l);
var h = [], d = cc.vv.gameNetMgr.seatIndex;
for (r = 0; r < s.length; ++r) {
var u = s[r];
if (u) {
var v = "number" == typeof u.score ? u.score : 0, g = (v > 0 && v == c ? "【大赢家】" : "") + (r === d ? "[自家] " : "[对家] ") + (u.name || "玩家") + "(" + u.userid + ")";
if (e && null != e[r]) {
var _ = e[r];
g += "   自摸" + this.signedNum(_.numzimo) + "  接炮" + this.signedNum(_.numjiepao) + "  点炮" + this.signedNum(_.numdianpao) + "  暗杠" + this.signedNum(_.numangang) + "  明杠" + this.signedNum(_.numminggang) + "  查叫" + this.signedNum(_.numchadajiao);
}
g += "   总成绩:" + this.signedNum(v);
h.push({
text: g,
fontSize: 28,
color: v > 0 ? cc.color(40, 120, 40) : v < 0 ? cc.color(170, 40, 40) : cc.color(90, 90, 90)
});
}
}
if (t && t.length > 0) for (var f = d >= 0 && s[d] ? s[d].userid : -1, m = 0; m < t.length; ++m) {
for (var p = t[m], b = 0, C = 0, y = "", N = 0, S = !1, B = !1, w = 0; w < p.scores.length; ++w) {
var M = p.scores[w];
M.userid == f ? b = M.score : C = M.score;
if (null != M.tai) {
y = M.userid == f ? "自家" : "对家";
N = M.tai;
S = !!M.zimo;
B = !!M.laozhuang;
}
}
var T = "第" + p.index + "局   自家" + this.signedNum(b) + "  对家" + this.signedNum(C);
"" != y && (T += "   " + y + "胡" + N + "台" + (S ? "(自摸)" : "") + (B ? "(老庄)" : ""));
h.push({
text: T,
fontSize: 22,
color: b > 0 ? cc.color(34, 120, 34) : b < 0 ? cc.color(180, 40, 40) : cc.color(120, 120, 120)
});
}
var x = 0;
for (r = 0; r < h.length; ++r) x += h[r].fontSize + 14;
var R = x / 2;
for (r = 0; r < h.length; ++r) R -= this.addListRow(l, h[r].text, h[r].fontSize, R, h[r].color);
}
}
},
addListRow: function(e, t, i, n, a) {
var o = new cc.Node("row"), s = o.addComponent(cc.Label);
s.string = t;
s.fontSize = i;
s.lineHeight = i + 10;
s.overflow = cc.Label.Overflow.NONE;
s.enableWrapText = !1;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
o.color = a || cc.color(90, 90, 90);
o.setPosition(0, n);
e.addChild(o);
return i + 14;
},
showTotalScore: function() {
this.renderList(null, null);
},
onGameEnd: function(e, t) {
null == this._gameresult && (this._gameresult = this.node.getChildByName("game_result"));
this._gameresult && (this._gameresult.active = !0);
t && t.length > 0 ? this.renderList(null, t) : e ? this.renderList(e, null) : this.showTotalScore();
},
onBtnCloseClicked: function() {
cc.vv && cc.vv.net && cc.vv.net.send && cc.vv.net.send("leave_room");
var e = cc.vv.gameNetMgr;
if (e && "club" === e.roomBackScene || cc.vv.fromClubId) {
cc.vv.fromClub = !0;
e && e.roomBackClubId && !cc.vv.fromClubId && (cc.vv.fromClubId = e.roomBackClubId);
cc.vv.sceneMgr ? cc.vv.sceneMgr.load("club") : cc.director.loadScene("club");
} else cc.vv.sceneMgr ? cc.vv.sceneMgr.load("hall") : cc.director.loadScene("hall");
},
onBtnShareClicked: function() {
cc.vv.anysdkMgr.shareResult();
}
});
cc._RF.pop();
}, {} ],
HallHelp: [ function(e, t) {
"use strict";
cc._RF.push(t, "5cfd1dSLRZEroI+ezO6k+TV", "HallHelp");
var i = {
zj_zx: "自选麻将",
guanpai2: "诸暨关牌"
};
function n(e) {
return null == e ? "" : i[e.type] || e.name || e.type;
}
var a = {
zj: "2人诸暨麻将,开局翻出财神,财神可当任意牌使用。\n· 财神可吃、碰、杠。\n· 按台数计分,需达到起胡台数才能胡,台数越多分越高,超过封顶按封顶台数算。\n· 天胡、地胡、漏胡等参与计分。\n· 杠上开花、抢杠等按台数计分。",
zj_bt: "2人玩法,开局先叫包:选择无财/独财/双财并报出包几台,叫台大的一方成为包家,由包家从手牌中定财神。\n· 包家胡牌必须达到自己所包的台数,闲家胡牌只需达到最低起胡台数。\n· 同台数时大小顺序:无财 > 独财 > 双财。\n· 结算分两项:胡牌分按台数每台翻倍,包台分按所包台数每台翻倍。\n· 老庄时包台分翻倍。\n· 包家不包则推给闲家,闲家也不包时由庄家按所包台数硬包。",
zj_lao: "2人推倒胡玩法,没有台数门槛,胡牌即算。\n· 不做台数结算,只有翻倍项(财吊、天胡、地胡等)参与计分。\n· 吃、碰、杠、点炮等规则与诸暨麻将一致。",
zj_zx: "2人玩法,开局不发财神。\n· 胡牌时自选财神方案:无财、独财或双财(双财为相连的两张)。\n· 选定方案后从手牌中选出对应的财神牌,定财神后即满足胡牌条件。\n· 仍需达到起胡台数才能胡。\n· 无财、独财方案计分翻倍。",
zj4_zx: "4人玩法,规则与2人自选麻将一致,开局不发财神,胡牌时自选财神方案。",
guanpai2: "2人扑克玩法,先出完手牌的一方获胜。\n· 牌型:单张、对子、三张、顺子、炸弹。\n· 2 不参与顺子;A 可作最小牌与 2 相连。\n· 首局由持有最小黑桃的一方先出,之后由上一局赢家先出。\n· 记牌器(历史出牌辅助)。",
guanpai3: "3人扑克玩法,先出完手牌的一方获胜,规则与2人关牌一致。",
baobao_mian: "6张免摆宝宝(最多6人)。每人发6张牌,系统自动遍历所有拆分,选出最大的一副牌型亮牌。\n· 牌型从大到小:6同花顺 > 5同花顺带1 > 4条带2单 > 3条带3条 > 3条带对带1 > 6同花 > 6连顺 > 5同花带1 > 5连顺带1 > 3对 > 3组9 > 散牌。\n· 花色优先级:黑桃 > 红桃 > 梅花 > 方片。A在长顺里算最小(A23456的A当1)。",
baobao_shou: "6张手动摆宝宝(最多6人)。每人发6张牌,自己摆成前2/中2/后2三道。\n· 单道规则:对子为宝,宝>散点(两牌相加取个位,9最大0最小);宝排序 宝A>宝K/Q/J>宝10~2。\n· 强制 前道≤中道≤后道,摆错为乌龙,三道全输。\n· 三道独立结算,每道按赢家道型倍率:宝A=10倍,宝K/Q/J=6倍,宝10~2=5倍,9点=4倍,8点=3倍,7点=2倍,6~0点=1倍。"
};
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {},
open: function(e) {
this.initView(e);
this.loadList();
},
initView: function(e) {
this._help = e;
this._games = [];
this._cur = -1;
this._items = [];
var t = this._help;
if (null != t) {
this._title = t.getChildByName("xzdd_title");
this._body = t.getChildByName("xzdd_help");
this._title && (this._title.active = !0);
this._body && (this._body.active = !0);
cc.isValid(this._listRoot) || (this._listRoot = t.getChildByName("helpList"));
if (null == this._listRoot) {
this._listRoot = new cc.Node("helpList");
this._listRoot.parent = t;
}
this._listRoot.active = !0;
var i = this;
null == this._atlas && cc.resources.load("images/atlas/hall_ui", cc.SpriteAtlas, function(e, t) {
i._atlas = e ? null : t;
i.refreshItems();
});
}
},
loadList: function() {
var e = this;
cc.vv.http.sendRequest("/game_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(t) {
if (null != t && 0 == t.errcode) {
e._games = t.games || [];
e.renderList();
} else {
e._title && e._title.getComponent(cc.Label) && (e._title.getComponent(cc.Label).string = "玩法介绍");
e._body && e._body.getComponent(cc.Label) && (e._body.getComponent(cc.Label).string = "玩法列表获取失败,请稍后重试。");
cc.vv.wc && cc.vv.wc.showError("玩法列表获取失败");
}
});
},
renderList: function() {
if (null != this._listRoot) {
for (var e = this._listRoot.childrenCount - 1; e >= 0; --e) {
var t = this._listRoot.children[e];
t._helpAutoCreated && this._listRoot.removeChild(t, !0);
}
var i = this._listRoot.children.slice();
this._items = [];
if (0 != this._games.length) {
for (var a = 0; a < this._games.length; ++a) {
var o = i[a];
if (null == o) {
o = this.makeFallbackItem(a);
cc.log("[help] 场景缺少列表项节点,已用代码兜底:请在 help/helpList 下添加 item" + a);
}
var s = o.getChildByName("Label");
if (null == s) {
(s = new cc.Node("Label")).parent = o;
s.addComponent(cc.Label);
}
var c = s.getComponent(cc.Label);
null == c && (c = s.addComponent(cc.Label));
c.string = n(this._games[a]);
if (o._helpAutoCreated) {
c.fontSize = 22;
c.lineHeight = 26;
s.color = cc.color(255, 255, 255);
}
null == o.getComponent(cc.Button) && o.addComponent(cc.Button);
o.idx = a;
if (!o._helpBound) {
o._helpBound = !0;
var r = this;
o.on(cc.Node.EventType.TOUCH_END, function(e) {
return function() {
r.select(e.idx);
};
}(o));
}
this._items.push(o);
}
this.refreshItems();
this.select(0);
} else {
this._title && this._title.getComponent(cc.Label) && (this._title.getComponent(cc.Label).string = "玩法介绍");
this._body && this._body.getComponent(cc.Label) && (this._body.getComponent(cc.Label).string = "暂无可用玩法。");
this.refreshItems();
}
}
},
makeFallbackItem: function(e) {
var t = new cc.Node("item" + e);
t.parent = this._listRoot;
t._helpAutoCreated = !0;
t.setContentSize(150, 50);
t.setPosition(-255, 130 - 58 * e);
t.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
return t;
},
refreshItems: function() {
if (null != this._atlas && null != this._items) {
var e = this._atlas.getSpriteFrame("按钮-button1.png") || this._atlas.getSpriteFrame("按钮-button1");
if (null != e) {
for (var t = 0; t < this._items.length; ++t) {
var i = this._items[t].getComponent(cc.Sprite);
i && null == i.spriteFrame && (i.spriteFrame = e);
}
this.highlight();
}
}
},
select: function(e) {
var t = this._games[e];
if (null != t) {
cc.log("[help] select " + e + " " + t.type);
this._cur = e;
if (this._title) {
var i = this._title.getComponent(cc.Label);
i && (i.string = n(t));
}
if (this._body) {
var o = this._body.getComponent(cc.Label);
o && (o.string = a[t.type] || "该玩法暂无说明。");
}
this.highlight();
}
},
highlight: function() {
for (var e = 0; e < this._items.length; ++e) this._items[e].color = e == this._cur ? cc.color(255, 255, 255) : cc.color(165, 165, 165);
}
});
cc._RF.pop();
}, {} ],
History: [ function(e, t) {
"use strict";
cc._RF.push(t, "c9827792rdPc7BCe2FXpBCv", "History");
var i = {
baobao_mian: "宝宝麻将(免摆)",
baobao_shou: "宝宝麻将(手摆)",
ldh: "赖倒胡",
zj_lao: "诸暨赖倒胡",
zj_bt: "包麻将",
zj_zx: "自选麻将",
zj4_zx: "自选麻将(四人)",
zj: "翻财神",
zp: "翻财神",
zp4: "翻财神(四人)",
wujin: "五经",
guanpai2: "关牌",
guanpai3: "关牌"
};
function n(e) {
return null == e || e < 0 ? null : e < 9 ? "dot_" + (e + 1) : e < 18 ? "bamboo_" + (e - 8) : e < 27 ? "character_" + (e - 17) : 27 == e ? "red" : 28 == e ? "green" : 29 == e ? "white" : 30 == e ? "wind_east" : 31 == e ? "wind_west" : 32 == e ? "wind_south" : 33 == e ? "wind_north" : null;
}
function a(e) {
var t = n(e);
return null == t ? "?" : 0 == t.indexOf("dot_") ? t.substr(4) + "筒" : 0 == t.indexOf("bamboo_") ? t.substr(7) + "条" : 0 == t.indexOf("character_") ? t.substr(10) + "万" : {
red: "中",
green: "发",
white: "白",
wind_east: "东",
wind_west: "西",
wind_south: "南",
wind_north: "北"
}[t] || "?";
}
function o(e, t) {
return null == e || null == t ? null : e.getSpriteFrame(t) || e.getSpriteFrame(t + ".png") || e.getSpriteFrame(t + ".jpg");
}
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {
this.initNodes();
},
initNodes: function() {
if (!this._inited) {
this._inited = !0;
this._root = "history" == this.node.name ? this.node : this.node.getChildByName("history");
this._rooms = [];
this._curRoom = null;
this._rp = null;
this._atlas = null;
this._atlasTried = !1;
this._ready = !1;
if (null != this._root) {
this._emptyTip = this._root.getChildByName("emptyTip");
if (this._emptyTip) {
var e = this._emptyTip.getComponent(cc.Label);
e && (e.string = "暂无对局记录");
}
this._viewlist = this._root.getChildByName("viewlist");
this._content = cc.find("view/content", this._viewlist);
if (null != this._content && 0 != this._content.childrenCount) {
this._ready = !0;
this._temp = this._content.children[0];
this._content.removeChild(this._temp);
this.clearItemEvents(this._temp);
var t = this, i = this._root.getChildByName("btn_back");
i && i.on(cc.Node.EventType.TOUCH_END, function() {
if (t._rp) t.closeReplay(); else if (null != t._curRoom) {
t._curRoom = null;
t.showRooms();
} else t._root.active = !1;
});
}
}
}
},
open: function() {
this.initNodes();
cc.log("[zhanji] open ready=" + this._ready);
if (this._ready) {
this._curRoom = null;
this.showRooms();
var e = this;
cc.log("[zhanji] request list, account=" + cc.vv.userMgr.account);
cc.vv.http.sendRequest("/get_replay_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(t) {
cc.log("[zhanji] list ret=" + JSON.stringify(t && t.errcode) + " n=" + (t && t.list ? t.list.length : -1));
if (null != t && 0 == t.errcode) {
e._rooms = t.list || [];
e.showRooms();
} else cc.vv.wc && cc.vv.wc.showError("战绩查询失败");
});
}
},
clearItemEvents: function(e) {
for (var t = e.getChildByName("btnOp"), i = [ e.getComponent(cc.Button), t ? t.getComponent(cc.Button) : null ], n = 0; n < i.length; ++n) i[n] && (i[n].clickEvents = []);
},
dateFormat: function(e) {
var t = new Date(1e3 * e);
function i(e) {
return e >= 10 ? e : "0" + e;
}
return i(t.getMonth() + 1) + "-" + i(t.getDate()) + " " + i(t.getHours()) + ":" + i(t.getMinutes());
},
typeName: function(e) {
return i[e] || e || "对局";
},
clearList: function() {
for (;this._content.childrenCount > 0; ) {
var e = this._content.children[this._content.childrenCount - 1];
this._content.removeChild(e, !0);
}
},
getItem: function(e) {
var t = null;
if (this._content.childrenCount > e) t = this._content.children[e]; else {
t = cc.instantiate(this._temp);
this._content.addChild(t);
}
var i = this;
if (!t._rpBound) {
t._rpBound = !0;
t.on(cc.Node.EventType.TOUCH_END, function() {
i.onRowClicked(t);
});
}
var n = t.getChildByName("btnOp");
if (n && !n._rpBound) {
n._rpBound = !0;
n.on(cc.Node.EventType.TOUCH_END, function() {
i.onRowClicked(t);
});
}
return t;
},
onRowClicked: function(e) {
var t = Date.now();
if (!(e._rpClickTime && t - e._rpClickTime < 200)) {
e._rpClickTime = t;
cc.log("[zhanji] click row idx=" + e.idx);
this.onItemClicked(e.idx);
}
},
setItemText: function(e, t, i, n, a, o, s) {
e.idx = s;
e.getChildByName("title").getComponent(cc.Label).string = t;
e.getChildByName("roomNo").getComponent(cc.Label).string = i;
e.getChildByName("time").getComponent(cc.Label).string = n;
for (var c = 0; c < 4; ++c) {
var r = e.getChildByName("info" + c);
null != r && (r.getComponent(cc.Label).string = a[c] || "");
}
var l = e.getChildByName("btnOp");
l.idx = s;
l.getChildByName("Label").getComponent(cc.Label).string = o;
},
showRooms: function() {
this.clearList();
for (var e = this._rooms, t = 0; t < e.length; ++t) {
var i = e[t], n = this.getItem(t);
this.setItemText(n, "" + (t + 1), "房间:" + i.roomid, this.dateFormat(i.create_time), [ this.typeName(i.type), "共" + i.games.length + "局", "", "" ], "详情", t);
}
this._emptyTip.active = 0 == e.length;
this._curRoom = null;
},
showGames: function(e) {
this.clearList();
for (var t = e.games || [], i = 0; i < t.length; ++i) {
var n = t[i], a = this.getItem(i);
this.setItemText(a, "第" + n.index + "局", "房间:" + e.roomid, this.dateFormat(n.create_time), [ this.typeName(e.type), "", "", "" ], "回放", i);
}
this._emptyTip.active = 0 == t.length;
this._curRoom = e;
},
onItemClicked: function(e) {
if (null == this._curRoom) {
var t = this._rooms[e];
if (null == t) return;
this.showGames(t);
} else {
var i = this._curRoom.games[e];
if (null == i) return;
this.playReplay(this._curRoom, i.index);
}
},
playReplay: function(e, t) {
var i = this;
cc.vv.http.sendRequest("/get_replay", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
uuid: e.uuid,
index: t
}, function(e) {
null != e && 0 == e.errcode ? i.buildReplay(e.replay) : cc.vv.wc && cc.vv.wc.showError("录像不存在或已过期");
});
},
loadAtlas: function(e) {
if (this._atlasTried) e(this._atlas); else {
this._atlasTried = !0;
var t = this;
cc.resources.load("images/MJ/my/Z_my", cc.SpriteAtlas, function(i, n) {
t._atlas = i ? null : n;
e(t._atlas);
});
}
},
tileFrame: function(e) {
if (null == this._atlas) return null;
var t = n(e);
return null == t ? null : o(this._atlas, "M_" + t);
},
makeTile: function(e, t, i, n) {
var o = new cc.Node("tile");
o.parent = e;
o.setContentSize(i, n);
var s = o.addComponent(cc.Sprite);
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var c = this.tileFrame(t);
if (c) s.spriteFrame = c; else {
o.removeComponent(s);
var r = o.addComponent(cc.Label);
r.string = a(t);
r.fontSize = Math.round(.5 * n);
r.lineHeight = n;
o.color = cc.color(20, 20, 20);
}
return o;
},
buildReplay: function(e) {
this.closeReplay();
var t = cc.find("Canvas"), i = cc.view.getVisibleSize(), n = new cc.Node("replayView");
n.parent = t;
n.setContentSize(i.width, i.height);
var a = new cc.Node("table");
a.parent = n;
a.setContentSize(i.width, i.height);
var s = a.addComponent(cc.Sprite);
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
this._bgSpr = s;
var c = this;
cc.resources.load("images/atlas/table_bg", cc.SpriteAtlas, function(e, t) {
!e && t && (s.spriteFrame = o(t, "背景可随意拉伸铺满"));
});
var r = {
root: n,
data: e,
players: e.players || [],
hands: {},
melds: {},
folds: {},
lastDiscard: null,
hu: null,
wall: e.start && e.start.numofmj || 0,
idx: 0,
elapsed: 0,
playing: !0,
speed: 1,
winner: -1
};
this._rp = r;
for (var l = 0; l < r.players.length; ++l) {
var h = r.players[l], d = e.hands && e.hands[h.userid];
!d && e.finalHands && (d = e.finalHands[h.userid]);
r.hands[h.userid] = (d || []).slice();
r.melds[h.userid] = [];
r.folds[h.userid] = [];
}
this.buildSeats(r, i);
this.buildControls(r, i);
var u = new cc.Node("result");
u.parent = n;
u.setPosition(0, i.height / 2 - 34);
var v = u.addComponent(cc.Label);
v.string = "";
v.fontSize = 26;
v.lineHeight = 32;
u.color = cc.color(255, 226, 120);
r.resultLabel = v;
this.refresh(r);
this.loadAtlas(function() {
c.refresh(r);
});
},
seatPos: function(e, t, i) {
return e.players.length <= 2 ? 0 == t ? cc.v2(0, .3 * -i.height) : cc.v2(0, .28 * i.height) : 0 == t ? cc.v2(0, .3 * -i.height) : 1 == t ? cc.v2(.3 * i.width, .02 * -i.height) : 2 == t ? cc.v2(0, .28 * i.height) : cc.v2(.3 * -i.width, .02 * -i.height);
},
handPos: function(e, t, i) {
return e.players.length <= 2 ? 0 == t ? cc.v2(0, .225 * -i.height) : cc.v2(0, .18 * i.height) : 0 == t ? cc.v2(0, .2 * -i.height) : 1 == t ? cc.v2(.16 * i.width, .02 * -i.height) : 2 == t ? cc.v2(0, .15 * i.height) : cc.v2(.16 * -i.width, .02 * -i.height);
},
foldPos: function(e, t, i) {
return e.players.length <= 2 ? 0 == t ? cc.v2(0, .05 * -i.height) : cc.v2(0, .06 * i.height) : 0 == t ? cc.v2(0, .07 * -i.height) : 1 == t ? cc.v2(.1 * i.width, .02 * -i.height) : 2 == t ? cc.v2(0, .06 * i.height) : cc.v2(.1 * -i.width, .02 * -i.height);
},
buildSeats: function(e, t) {
e.seatNodes = [];
e.handNodes = [];
e.foldNodes = [];
for (var i = 0; i < e.players.length; ++i) {
var n = e.players[i], a = new cc.Node("seat" + i);
a.parent = e.root;
var o = this.seatPos(e, i, t);
a.setPosition(o.x, o.y);
var s = new cc.Node("head");
s.parent = a;
s.setContentSize(60, 60);
s.addComponent(cc.Mask).type = cc.Mask.Type.ELLIPSE;
var c = new cc.Node("face");
c.parent = s;
c.setContentSize(60, 60);
c.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
if (n.userid) {
var r = c.addComponent("ImageLoader");
r && r.setUserID(n.userid);
}
var l = new cc.Node("name");
l.parent = a;
var h = e.players.length <= 2 ? 1 == i : 2 == i;
l.setPosition(0, h ? 42 : -46);
var d = l.addComponent(cc.Label);
d.string = n.name || "玩家" + (n.userid || "");
d.fontSize = 22;
d.lineHeight = 26;
l.color = cc.color(255, 255, 255);
var u = new cc.Node("hand");
u.parent = e.root;
var v = this.handPos(e, i, t);
u.setPosition(v.x, v.y);
e.handNodes.push(u);
var g = new cc.Node("fold");
g.parent = e.root;
var _ = this.foldPos(e, i, t);
g.setPosition(_.x, _.y);
e.foldNodes.push(g);
e.seatNodes.push(a);
}
},
buildControls: function(e, t) {
var i = new cc.Node("ctrl");
i.parent = e.root;
i.setPosition(0, -t.height / 2 + 42);
e.ctrlBar = i;
var n = this, a = this.makeBtn(i, "退出", -260, 0, function() {
n.closeReplay();
});
e.exitBtn = a;
e.playBtn = this.makeBtn(i, "暂停", -70, 0, function() {
e.playing = !e.playing;
e.playBtn.getChildByName("Label").getComponent(cc.Label).string = e.playing ? "暂停" : "播放";
});
e.speedBtn = this.makeBtn(i, "1倍速", 60, 0, function() {
e.speed = 1 == e.speed ? 2 : 2 == e.speed ? 4 : 1;
e.speedBtn.getChildByName("Label").getComponent(cc.Label).string = e.speed + "倍速";
});
var o = new cc.Node("progress");
o.parent = i;
o.setPosition(210, 0);
var s = o.addComponent(cc.Label);
s.string = "";
s.fontSize = 20;
s.lineHeight = 26;
o.color = cc.color(255, 255, 255);
e.progLabel = s;
var c = new cc.Node("wall");
c.parent = i;
c.setPosition(340, 0);
var r = c.addComponent(cc.Label);
r.string = "剩余" + e.wall + "张";
r.fontSize = 20;
r.lineHeight = 26;
c.color = cc.color(255, 255, 255);
e.wallLabel = r;
},
makeBtn: function(e, t, i, n, a) {
var s = new cc.Node("btn");
s.parent = e;
s.setPosition(i, n);
s.setContentSize(110, 46);
var c = s.addComponent(cc.Sprite);
c.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(e, t) {
!e && t && cc.isValid(s) && (c.spriteFrame = o(t, "按钮-蓝"));
});
var r = new cc.Node("Label");
r.parent = s;
var l = r.addComponent(cc.Label);
l.string = t;
l.fontSize = 20;
l.lineHeight = 26;
r.color = cc.color(255, 255, 255);
s.on(cc.Node.EventType.TOUCH_END, a);
return s;
},
closeReplay: function() {
var e = this._rp;
if (null != e) {
this._rp = null;
e.root && cc.isValid(e.root) && e.root.destroy();
}
},
applyEvent: function(e, t) {
var i = t.d || {}, n = e.players, a = function(e) {
var t = n[e];
return t ? t.userid : null;
};
switch (t.e) {
case "game_mopai_push":
var o = a(i.si);
null != o && (null != i.holds && "number" != typeof i.holds && i.holds.slice ? e.hands[o] = i.holds.slice() : null != i.pai && i.pai >= 0 && e.hands[o] && e.hands[o].push(i.pai));
null != i.numofmj && (e.wall = i.numofmj);
break;

case "game_chupai_push":
var s = a(i.si);
if (null != s && null != i.pai) {
e.folds[s] && e.folds[s].push(i.pai);
var c = e.hands[s];
if (c) {
var r = c.indexOf(i.pai);
r >= 0 && c.splice(r, 1);
}
e.lastDiscard = {
uid: s,
pai: i.pai
};
}
break;

case "game_chupai_notify_push":
var l = function(e) {
for (var t = 0; t < n.length; ++t) if (n[t].userid == e) return n[t];
return null;
}(i.userId);
null != l && null != i.holds && null != i.holds.length && "number" != typeof i.holds && (e.hands[l.userid] = i.holds.slice());
break;

case "game_peng_push":
case "game_gang_push":
var h = a(i.si);
if (null != h && null != i.holds && "number" != typeof i.holds) {
e.hands[h] = i.holds.slice();
e.melds[h].push({
t: "game_peng_push" == t.e ? "peng" : "gang",
pai: i.pai
});
this.takeDiscard(e, i.pai);
}
break;

case "game_chi_push":
var d = a(i.si);
if (null != d && null != i.holds && "number" != typeof i.holds) {
e.hands[d] = i.holds.slice();
e.melds[d].push({
t: "chi",
pais: i.pais || []
});
for (var u = 0; u < (i.pais || []).length && !this.takeDiscard(e, i.pais[u]); ++u) ;
}
break;

case "game_hu_push":
e.winner = null != i.si ? i.si : -1;
e.hu = {
si: e.winner,
tai: i.tai || 0,
zimo: !!i.zimo
};
var v = a(e.winner);
if (null != v && !i.zimo && e.lastDiscard && e.lastDiscard.pai == i.pai) {
this.takeDiscard(e, i.pai);
e.hands[v] && e.hands[v].push(i.pai);
}
break;

case "game_over_push":
this.syncFinal(e, i.results || []);
e.playing = !1;
e.playBtn && (e.playBtn.getChildByName("Label").getComponent(cc.Label).string = "播放");
}
},
takeDiscard: function(e, t) {
if (null == e.lastDiscard || e.lastDiscard.pai != t) return !1;
var i = e.folds[e.lastDiscard.uid];
if (i) {
var n = i.lastIndexOf(t);
n >= 0 && i.splice(n, 1);
}
e.lastDiscard = null;
return !0;
},
syncFinal: function(e, t) {
for (var i = 0; i < t.length; ++i) {
var n = t[i], a = n.userid;
if (null != e.hands[a]) {
n.holds && (e.hands[a] = n.holds.slice());
n.folds && (e.folds[a] = n.folds.slice());
for (var o = [], s = n.chis || [], c = 0; c < s.length; ++c) o.push({
t: "chi",
pais: s[c]
});
for (var r = n.pengs || [], l = 0; l < r.length; ++l) o.push({
t: "peng",
pai: r[l]
});
for (var h = (n.angangs || []).concat(n.diangangs || []).concat(n.wangangs || []), d = 0; d < h.length; ++d) o.push({
t: "gang",
pai: h[d]
});
e.melds[a] = o;
var u = n.huinfo && n.huinfo[0];
if (u && u.ishupai && null == e.hu) {
e.hu = {
si: i,
tai: u.fan || 0,
zimo: "zimo" == u.action
};
e.winner = i;
}
}
}
},
refresh: function(e) {
if (null != e && cc.isValid(e.root)) {
for (var t = 0; t < e.players.length; ++t) {
var i = e.players[t].userid, n = e.handNodes[t];
n.removeAllChildren();
for (var a = (e.hands[i] || []).slice().sort(function(e, t) {
return e - t;
}), o = [], s = 0; s < a.length; ++s) o.push(a[s]);
for (var c = e.melds[i] || [], r = 0; r < c.length; ++r) {
var l = c[r], h = "chi" == l.t ? l.pais || [] : [ l.pai, l.pai, l.pai, l.pai ].slice(0, "peng" == l.t ? 3 : 4);
o.push(null);
for (var d = 0; d < h.length; ++d) o.push(h[d]);
}
for (var u = 0, v = 0; v < o.length; ++v) u += null == o[v] ? 22 : 52;
for (var g = -u / 2 + 25, _ = 0; _ < o.length; ++_) if (null != o[_]) {
this.makeTile(n, o[_], 50, 68).setPosition(g, 0);
g += 52;
} else g += 22;
var f = e.foldNodes[t];
f.removeAllChildren();
for (var m = e.folds[i] || [], p = 0; p < m.length; ++p) {
var b = Math.floor(p / 8), C = p % 8;
this.makeTile(f, m[p], 36, 48).setPosition(40 * C - 140, 52 * -b);
}
}
e.wallLabel && (e.wallLabel.string = "剩余" + e.wall + "张");
if (e.progLabel) {
var y = e.data.events ? e.data.events.length : 0;
e.progLabel.string = (e.idx > y ? y : e.idx) + "/" + y;
}
for (var N = 0; N < e.seatNodes.length; ++N) {
var S = e.seatNodes[N].getChildByName("name");
S && (S.color = N == e.winner ? cc.color(255, 210, 0) : cc.color(255, 255, 255));
}
if (e.resultLabel) {
var B = "";
if (e.hu && e.hu.si >= 0) {
var w = e.players[e.hu.si];
B = (w ? w.name || "玩家" + w.userid : "") + (e.hu.zimo ? " 自摸" : " 胡牌") + " " + e.hu.tai + "台";
}
e.resultLabel.string = B;
}
}
},
update: function(e) {
var t = this._rp;
if (null != t && t.playing && cc.isValid(t.root)) {
t.elapsed += 1e3 * e * t.speed;
for (var i = t.data.events || [], n = !1; t.idx < i.length && i[t.idx].t <= t.elapsed; ) {
this.applyEvent(t, i[t.idx]);
t.idx++;
n = !0;
}
n && this.refresh(t);
if (t.idx >= i.length && i.length > 0) {
t.playing = !1;
t.playBtn && (t.playBtn.getChildByName("Label").getComponent(cc.Label).string = "播放");
}
}
}
});
cc._RF.pop();
}, {} ],
ImageLoader: [ function(e, t) {
"use strict";
cc._RF.push(t, "f253a+5EyVAOo5k1xv6A8v7", "ImageLoader");
function i(e, t, i) {
cc.assetManager.loadRemote(e, function(e, n) {
if (!e && n) {
var a = new cc.SpriteFrame(n, cc.Rect(0, 0, n.width, n.height));
i(t, a);
} else i(t, null);
});
}
function n(e, t, i) {
cc.resources.load("images/avatars/" + e, cc.SpriteFrame, function(e, n) {
i(t, !e && n ? n : null);
});
}
function a(e, t) {
null == cc.vv.baseInfoMap && (cc.vv.baseInfoMap = {});
var i = cc.vv.baseInfoMap[e];
null != i && ("localKey" in i || "url" in i) ? t(e, i) : cc.vv.http.sendRequest("/base_info", {
userid: e
}, function(i) {
if (i && !i.errcode) {
var n = null, a = null;
i.headimgurl && (/^avatar_\d{1,3}$/.test(i.headimgurl) ? a = i.headimgurl : n = i.headimgurl + ".jpg");
var o = {
name: i.name,
sex: i.sex,
url: n,
localKey: a
};
(n || a) && (cc.vv.baseInfoMap[e] = o);
t(e, o);
} else t(e, {
url: null,
localKey: null
});
}, cc.vv.http.master_url);
}
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {
this._defaultFrame = null;
var e = this.node.getComponent(cc.Sprite);
e && (this._defaultFrame = e.spriteFrame);
this.setupSpriteFrame();
},
setUserID: function(e) {
if (e) {
var t = "" + e;
if (this._userid !== t || !this._spriteFrame) {
this._userid = t;
this._spriteFrame = null;
var o = this.node.getComponent(cc.Sprite);
o && (o.spriteFrame = this._defaultFrame || null);
var s = this;
a(e, function(a, o) {
s._userid === t && (o && o.localKey ? n(o.localKey, e, function(e, i) {
if (i && s._userid === t) {
s._spriteFrame = i;
s.setupSpriteFrame();
}
}) : o && o.url && i(o.url, e, function(e, i) {
if (i && s._userid === t) {
s._spriteFrame = i;
s.setupSpriteFrame();
}
}));
});
}
} else this.clearAvatar();
},
clearAvatar: function() {
this._userid = null;
this._spriteFrame = null;
var e = this.node.getComponent(cc.Sprite);
e && (e.spriteFrame = this._defaultFrame || null);
},
setupSpriteFrame: function() {
if (this._spriteFrame) {
var e = this.node.getComponent(cc.Sprite);
e && (e.spriteFrame = this._spriteFrame);
}
}
});
cc._RF.pop();
}, {} ],
JoinGameInput: [ function(e, t) {
"use strict";
cc._RF.push(t, "aebb2CDLFlBaLyTjW6mPofN", "JoinGameInput");
cc.Class({
extends: cc.Component,
properties: {
nums: {
default: [],
type: [ cc.Label ]
},
_inputIndex: 0
},
onLoad: function() {},
onEnable: function() {
this.onResetClicked();
},
onInputFinished: function(e) {
cc.vv.userMgr.enterRoom(e, function(t) {
if (0 == t.errcode) this.node.active = !1; else {
var i = "房间[" + e + "]不存在，请重新输入!";
if (4 == t.errcode) i = "房间[" + e + "]已满!"; else if (2222 == t.errcode) {
cc.vv.wc.showAlert(t.errmsg || "宝宝豆不足，无法进入房间");
this.onResetClicked();
return;
}
cc.vv.wc.showError(i);
this.onResetClicked();
}
}.bind(this));
},
onInput: function(e) {
if (!(this._inputIndex >= this.nums.length)) {
this.nums[this._inputIndex].string = e;
this._inputIndex += 1;
if (this._inputIndex == this.nums.length) {
var t = this.parseRoomID();
console.log("ok:" + t);
this.onInputFinished(t);
}
}
},
onN0Clicked: function() {
this.onInput(0);
},
onN1Clicked: function() {
this.onInput(1);
},
onN2Clicked: function() {
this.onInput(2);
},
onN3Clicked: function() {
this.onInput(3);
},
onN4Clicked: function() {
this.onInput(4);
},
onN5Clicked: function() {
this.onInput(5);
},
onN6Clicked: function() {
this.onInput(6);
},
onN7Clicked: function() {
this.onInput(7);
},
onN8Clicked: function() {
this.onInput(8);
},
onN9Clicked: function() {
this.onInput(9);
},
onResetClicked: function() {
for (var e = 0; e < this.nums.length; ++e) this.nums[e].string = "";
this._inputIndex = 0;
},
onDelClicked: function() {
if (this._inputIndex > 0) {
this._inputIndex -= 1;
this.nums[this._inputIndex].string = "";
}
},
onCloseClicked: function() {
this.node.active = !1;
},
parseRoomID: function() {
for (var e = "", t = 0; t < this.nums.length; ++t) e += this.nums[t].string;
return e;
}
});
cc._RF.pop();
}, {} ],
Lodinglogin: [ function(e, t) {
"use strict";
cc._RF.push(t, "21586CBnz5KWat4e0A5CLFA", "Lodinglogin");
cc.loader && !cc.loader.loadResAll && cc.resources && (cc.loader.loadResAll = cc.resources.loadDir.bind(cc.resources));
cc.Class({
extends: cc.Component,
properties: {
_splash: null,
tipLabel: cc.Label,
_stateStr: "",
_progress: 0,
_targetProgress: 0,
_isLoading: !1
},
onLoad: function() {
console.log("[Lodinglogin] onLoad enter");
if (!cc.sys.isNative) {
var e = this.node.getComponent(cc.Canvas);
e.fitHeight = !0;
e.fitWidth = !1;
var t = this.node.getChildByName("bg");
if (t) {
var i = function() {
if (cc.isValid(t)) {
var e = t.getComponent(cc.Widget);
e && (e.enabled = !1);
var i = cc.view.getVisibleSize(), n = cc.view.getVisibleOrigin();
t.setContentSize(i.width, i.height);
t.setPosition(t.parent.convertToNodeSpaceAR(cc.v2(n.x + i.width / 2, n.y + i.height / 2)));
}
};
i();
this.scheduleOnce(i, 0);
cc.view.setResizeCallback(i);
}
}
this.initMgr();
this.tipLabel.string = this._stateStr;
this._splash = cc.find("Canvas/splash");
this._splash && (this._splash.active = !1);
},
start: function() {
console.log("[Lodinglogin] start enter");
this.checkVersion();
},
initMgr: function() {
cc.vv = {};
var t = e("UserMgr");
cc.vv.userMgr = new t();
var i = e("ReplayMgr");
cc.vv.replayMgr = new i();
cc.vv.http = e("HTTP");
cc.vv.global = e("Global");
cc.vv.net = e("Net");
var n = e("GameNetMgr");
cc.vv.gameNetMgr = new n();
cc.vv.gameNetMgr.initHandlers();
var a = e("AnysdkMgr");
cc.vv.anysdkMgr = new a();
cc.vv.anysdkMgr.init();
var o = e("VoiceMgr");
cc.vv.voiceMgr = new o();
cc.vv.voiceMgr.init();
var s = e("AudioMgr");
cc.vv.audioMgr = new s();
cc.vv.audioMgr.init();
var c = cc.Node.prototype.emit;
cc.Node.prototype.emit = function(e) {
if ("touch-end" === e && cc.vv && cc.vv.audioMgr) {
var t = this.getComponent ? this.getComponent(cc.Button) : null;
(t && !1 !== t.interactable || /^btn/i.test(this.name) || /button/i.test(this.name)) && cc.vv.audioMgr.playSFX("btnClick.wav");
}
return c.apply(this, arguments);
};
var r = e("Utils");
cc.vv.utils = new r();
try {
var l = e("SceneMgr");
cc.vv.sceneMgr = new l();
cc.vv.sceneMgr.init();
} catch (e) {
console.warn("[SceneMgr] 加载失败:", e.message);
cc.vv.sceneMgr = {
load: function(e, t) {
return cc.director.loadScene(e, t);
}
};
}
cc.args = this.urlParse();
},
urlParse: function() {
var e, t, i = {};
if (null == window.location) return i;
for (var n = window.location.href, a = n.indexOf("?"), o = (n = n.substr(a + 1)).split("&"), s = 0; s < o.length; s++) if ((a = o[s].indexOf("=")) > 0) {
e = o[s].substring(0, a);
t = o[s].substr(a + 1);
i[e] = t;
}
return i;
},
checkVersion: function() {
var e = this, t = function(t) {
if (null == t.version) console.log("error."); else {
cc.vv.SI = t;
t.version != cc.VERSION || e.startPreloading();
}
}, i = null, n = !1, a = function() {
e._stateStr = "正在连接服务器";
i = cc.vv.http.sendRequest("/get_serverinfo", null, function(e) {
i = null;
n = !0;
t(e);
});
setTimeout(o, 5e3);
}, o = function() {
if (!n) if (i) {
i.abort();
e._stateStr = "连接失败，即将重试";
setTimeout(function() {
a();
}, 5e3);
} else a();
};
o();
},
startPreloading: function() {
this._stateStr = "正在加载资源，请稍候";
this._isLoading = !0;
var e = this;
cc.loader.onProgress = function(t, i) {
if (e._isLoading) {
var n = t / i;
n > e._targetProgress && (e._targetProgress = n);
}
};
cc.loader.loadResAll("textures", function() {
e.onLoadComplete();
});
cc.resources.load("images/atlas/other_a", cc.SpriteAtlas, function() {});
cc.resources.load("images/other/bb_btn_blue", cc.SpriteFrame, function() {});
cc.resources.load("images/other/bb_btn_green", cc.SpriteFrame, function() {});
cc.resources.load("images/other/按钮11", cc.SpriteFrame, function() {});
cc.resources.load("images/other/按钮12", cc.SpriteFrame, function() {});
cc.resources.load("images/bbHandName_flush", cc.SpriteFrame, function() {});
cc.resources.load("images/bbHandName_bomb", cc.SpriteFrame, function() {});
},
onLoadComplete: function() {
this._isLoading = !1;
this._progress = 1;
this._stateStr = "准备登陆";
cc.vv && cc.vv.sceneMgr ? cc.vv.sceneMgr.load("login") : cc.director.loadScene("login");
cc.loader.onComplete = null;
},
update: function(e) {
if (0 != this._stateStr.length) {
this.tipLabel.string = this._stateStr + " ";
if (this._isLoading) {
this._progress < this._targetProgress && (this._progress = Math.min(this._targetProgress, this._progress + .5 * e));
this.tipLabel.string += Math.floor(100 * this._progress) + "%";
} else for (var t = Math.floor(Date.now() / 1e3) % 4, i = 0; i < t; ++i) this.tipLabel.string += ".";
}
}
});
cc._RF.pop();
}, {
AnysdkMgr: void 0,
AudioMgr: void 0,
GameNetMgr: void 0,
Global: void 0,
HTTP: void 0,
Net: void 0,
ReplayMgr: void 0,
SceneMgr: void 0,
UserMgr: void 0,
Utils: void 0,
VoiceMgr: void 0
} ],
MJGameBMJ: [ function(e, t) {
"use strict";
cc._RF.push(t, "9a5abcvOl5OMp+8EZeUZUGh", "MJGameBMJ");
cc.Class({
extends: cc.Component,
properties: {
gameRoot: {
default: null,
type: cc.Node
},
prepareRoot: {
default: null,
type: cc.Node
},
_myMJArr: [],
_options: null,
_selectedMJ: null,
_chupaiSprite: [],
_mjcount: null,
_gamecount: null,
_hupaiTips: [],
_hupaiLists: [],
_playEfxs: [],
_opts: [],
_chiPanel: null,
_chiSelect: null,
_chiHint: null,
_dealAnimating: !1,
_dealAnimNodes: null,
_dealAnimId: 0
},
onLoad: function() {
var e = this.node.getComponent(cc.Canvas);
if (null != e) {
if (!cc.sys.isNative) {
e.fitHeight = !0;
e.fitWidth = !1;
for (var t = cc.director.getScene().getComponentsInChildren(cc.Camera), i = 0; i < t.length; i++) {
t[i].clearFlags = cc.Camera.ClearFlags.COLOR;
t[i].backgroundColor = cc.color(30, 18, 12);
}
}
if (cc.vv) {
for (var n = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
this.initView();
this.initEventHandlers();
this.gameRoot.active = !1;
this.prepareRoot.active = !0;
this.initWanfaLabel();
this.onGameBeign();
this.initCaishenTip();
cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("login");
}
},
initView: function() {
var e = this.node.getChildByName("game");
this._mjcount = e.getChildByName("mjcount").getComponent(cc.Label);
this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
this._gamecount = e.getChildByName("gamecount").getComponent(cc.Label);
this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
var t = this._mjcount.node, i = this._gamecount.node;
this.scheduleOnce(function() {
cc.isValid(t) && cc.isValid(i) && t.setPosition(i.x - i.width / 2 - t.width / 2 - 12, i.y);
}, 0);
for (var n = e.getChildByName("myself").getChildByName("holds"), a = 0; a < n.children.length; ++a) {
var o = n.children[a].getComponent(cc.Sprite);
this._myMJArr.push(o);
o.spriteFrame = null;
}
var s = cc.view.getVisibleSize().width / 1280;
if (s < 1) {
n.scaleX *= s;
n.scaleY *= s;
}
var c = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < c; ++a) {
var r = cc.vv.mahjongmgr.getSide(a), l = e.getChildByName(r);
if (null != l) {
this._hupaiTips.push(l.getChildByName("HuPai"));
this._hupaiLists.push(l.getChildByName("hupailist"));
this._playEfxs.push(l.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(l.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var h = l.getChildByName("opt");
h.active = !1;
o = h.getChildByName("pai").getComponent(cc.Sprite);
var d = {
node: h,
sprite: o
};
this._opts.push(d);
}
}
var u = e.getChildByName("ops");
this._options = u;
var v = u ? u.getChildByName("New Layout") : null;
if (v) {
var g = v.getComponent(cc.Button);
g && (g.enabled = !1);
v.active = !1;
}
this._baoPanel = u ? u.getChildByName("baoPanel") : null;
if (this._baoPanel) {
this._baoPanel.active = !1;
this._baoMode = 2;
this._baoTai = 2;
for (var _ = [ {
name: "btnNoCai",
mode: 0
}, {
name: "btnDuCai",
mode: 1
}, {
name: "btnShuangCai",
mode: 2
} ], f = 0; f < _.length; ++f) this._bindBaoButton(this._baoPanel.getChildByName(_[f].name), _[f].mode, "onBaoModeClicked");
for (var m = 2; m <= 7; ++m) this._bindBaoButton(this._baoPanel.getChildByName("btnTai" + m), m, "onBaoTaiClicked");
this._bindBaoButton(this._baoPanel.getChildByName("btnNoBao"), 0, "onBaoNoBaoClicked");
}
this._csPanel = u ? u.getChildByName("csPanel") : null;
if (this._csPanel) {
this._csPanel.active = !1;
var p = this._csPanel.getChildByName("btnSetCaishen");
p && cc.vv.utils.addClickEvent(p, this.node, "MJGameBMJ", "onSetCaishenClicked");
}
this.hideOptions();
this.hideChupai();
},
hideChupai: function() {
for (var e = 0; e < this._chupaiSprite.length; ++e) this._chupaiSprite[e].node.active = !1;
},
initEventHandlers: function() {
cc.vv.gameNetMgr.dataEventHandler = this.node;
var e = cc.vv.gameNetMgr;
if ("begin" == e.gamestate && e.seats) {
for (var t = !1, i = 0; i < e.seats.length; ++i) {
var n = e.seats[i];
if (n && n.holds instanceof Array && n.holds.length > 0) {
t = !0;
break;
}
}
if (t) {
var a = this.node;
this.scheduleOnce(function() {
if (cc.isValid(a)) {
a.emit("game_num", {
detail: e.numOfGames
});
a.emit("mj_count", {
detail: null
});
a.emit("game_start", {
detail: null
});
if (e.curaction) {
var t = e.curaction;
e.curaction = null;
a.emit("game_action", {
detail: t
});
}
}
}, 0);
}
}
var o = this.node;
this.scheduleOnce(function() {
if (cc.isValid(o)) {
e.waitBaoData && o.emit("bao_select", {
detail: e.waitBaoData
});
null != e.waitCaishenMode && o.emit("caishen_select", {
detail: {
mode: e.waitCaishenMode
}
});
}
}, 0);
var s = this;
this.node.on("game_start", function(e) {
var t = e && e.detail, i = cc.vv.gameNetMgr.conf, n = i && null != i.caishen ? parseInt(i.caishen) : -1, a = i && null != i.caishen2 ? parseInt(i.caishen2) : null, o = i && null != i.baoMode ? parseInt(i.baoMode) : -1, c = s.node.getChildByName("game"), r = c ? c.getChildByName("caishenTip") : null;
if (n < 0) {
s._curBaoMode = null;
s._caishen = null;
s._caishen2 = null;
s._csRetryCount = 0;
s._csRetryScheduled = !1;
s._clearBaoFlag();
if (r) {
var l = r.getChildByName("baoTaiLabel");
l && (l.active = !1);
0 !== o && (r.active = !1);
}
} else {
s._curBaoMode = o >= 0 ? o : null;
s._caishen = n;
s._caishen2 = a;
s._csRetryCount = 0;
s.scheduleOnce(function() {
if (cc.isValid(s.node)) {
s._showBaoInfo(t || {
baoTai: i ? i.baoTai : null,
baoMode: o,
baoSeatIndex: i ? i.baoSeatIndex : null
});
s.initCaishenTip();
}
}, 0);
}
s.onGameBeign(!0, t);
s.initCaishenTip();
});
this.node.on("game_begin", function() {
s.onGameBeign();
});
this.node.on("bao_select", function(e) {
s.onBaoSelect(e && e.detail);
});
this.node.on("bao_result", function(e) {
s.onBaoResult(e && e.detail);
});
this.node.on("caishen_select", function(e) {
s.onCaishenSelect(e && e.detail);
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
s.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && s.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || s.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? s.initMahjongs(!0) : cc.vv.replayMgr.isReplay() && s.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
s.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = s._hupaiTips[i];
n.active = !0;
0 == i && s.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
s.initMopai(t, e.pai);
e.zimo ? s.playEfx(i, "play_zimo") : s.playEfx(i, "play_hu");
cc.vv.audioMgr.playSFX("nv/hu.mp3");
});
this.node.on("mj_count", function() {
s._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
s._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
s.gameRoot.active = !1;
s.prepareRoot.active = !0;
s.hideChiPanel();
});
this.node.on("game_chupai_notify", function(e) {
s.hideChupai();
s.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? s.initMahjongs() : s.initOtherMahjongs(i);
s.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
s.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? s.initMahjongs(!1, t) : s.initOtherMahjongs(t);
var n = s.getLocalIndex(t.seatindex);
s.playEfx(n, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
s.hideOptions();
});
this.node.on("gang_notify", function(e) {
s.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? s.initMahjongs(!1, t) : s.initOtherMahjongs(t);
var n = s.getLocalIndex(t.seatindex);
if ("wangang" == i) {
s.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
s.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
s.hideOptions();
});
this.node.on("chi_notify", function(e) {
s.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? s.initMahjongs(!1, t) : s.initOtherMahjongs(t);
var i = s.getLocalIndex(t.seatindex);
s.playEfx(i, "play_peng");
cc.vv.audioMgr.playSFX("nv/peng.mp3");
s.hideOptions();
});
},
showChupai: function() {
var e = cc.vv.gameNetMgr.chupai;
if (e >= 0) {
var t = this.getLocalIndex(cc.vv.gameNetMgr.turn), i = this._chupaiSprite[t];
i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
i.node.active = !0;
}
},
addOption: function(e, t) {
for (var i = 0; i < this._options.childrenCount; ++i) {
var n = this._options.children[i];
if ("op" == n.name && 0 == n.active) {
n.active = !0;
n.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
var a = n.getChildByName(e);
a.active = !0;
a.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
i.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", e);
var n = this.getChiButton(i);
if (n) {
n.active = !0;
n.pai = e;
}
return;
}
}
},
getChiButton: function(e) {
var t = e.getChildByName("btnChi");
if (t) {
if (!t._chiBound) {
t._chiBound = !0;
cc.vv.utils.addClickEvent(t, this.node, "MJGameBMJ", "onOptionClicked");
}
return t;
}
var i = e.getChildByName("btnPeng");
t = new cc.Node("btnChi");
e.addChild(t);
if (i) {
t.setPosition(i.getPosition());
t.setContentSize(i.getContentSize());
t.scaleX = i.scaleX;
t.scaleY = i.scaleY;
}
var n = t.addComponent(cc.Sprite);
n.type = cc.Sprite.Type.SIMPLE;
n.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, i) {
if (!e && i && cc.isValid(t)) {
var n = t.getComponent(cc.Sprite);
n && (n.spriteFrame = i);
}
});
cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(e, i) {
var n = i ? i.getSpriteFrame("mj_btn_chi.png") : null;
if (n && cc.isValid(t)) {
var a = t.getComponent(cc.Sprite);
a && (a.spriteFrame = n);
var o = t.getChildByName("btnLabel");
o && (o.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var o = a.addComponent(cc.Label);
o.string = "吃";
o.fontSize = 40;
o.lineHeight = 40;
o.overflow = cc.Label.Overflow.NONE;
o.enableWrapText = !1;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.color = cc.color(255, 255, 255);
a.setPosition(0, 0);
cc.vv.utils.addClickEvent(t, this.node, "MJGameBMJ", "onOptionClicked");
t.active = !1;
return t;
},
enterChiSelect: function(e) {
this.cancelChiSelect();
this._chiSelect = {
pai: e,
tiles: []
};
var t = this.node.getChildByName("game") || this.node, i = t.getChildByName("chiHint");
this._chiHintBaked = !!i;
if (null == i) {
(i = new cc.Node("chiHint")).setPosition(0, -200);
t.addChild(i);
var n = i.addComponent(cc.Label);
n.string = "请选择两张手牌";
n.fontSize = 36;
n.lineHeight = 40;
n.overflow = cc.Label.Overflow.NONE;
i.color = cc.color(255, 220, 80);
var a = i.addComponent(cc.LabelOutline);
a.color = cc.color(60, 30, 0);
a.width = 3;
}
i.active = !0;
i.setPosition(0, -200);
this._chiHint = i;
},
cancelChiSelect: function() {
if (this._chiSelect) for (var e = 0; e < this._chiSelect.tiles.length; ++e) {
var t = this._chiSelect.tiles[e];
cc.isValid(t) && (t.y = 0);
}
this._chiSelect = null;
this._chiHint && cc.isValid(this._chiHint) && (this._chiHintBaked ? this._chiHint.active = !1 : this._chiHint.destroy());
this._chiHint = null;
},
hideOptions: function() {
if (null != this._options) {
for (var e = this._baoPanel && this._baoPanel.active || this._csPanel && this._csPanel.active, t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name) {
i.active = !1;
i.getChildByName("btnPeng").active = !1;
i.getChildByName("btnGang").active = !1;
i.getChildByName("btnHu").active = !1;
var n = i.getChildByName("btnChi");
n && (n.active = !1);
}
}
e || (this._options.active = !1);
this.hideChiPanel();
this.cancelChiSelect();
}
},
showAction: function(e) {
if (!(this._baoPanel && this._baoPanel.active || this._csPanel && this._csPanel.active)) {
this._options.active && this.hideOptions();
if (e && (e.hu || e.gang || e.peng || e.chi)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) for (var t = 0; t < e.gangpai.length; ++t) {
var i = e.gangpai[t];
this.addOption("btnGang", i);
}
e.chi && this.addChiOption(e.pai);
var n = this._options.getChildByName("btnGuo");
n && (n.active = !0);
}
}
},
initWanfaLabel: function() {
var e = cc.find("Canvas/infobar/wanfa") || cc.find("Canvas/infobar/New Sprite/wanfa");
if (e) {
var t = e.getComponent(cc.Label);
t && (t.string = cc.vv.gameNetMgr.getWanfa());
}
},
initCaishenTip: function() {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("caishenTip");
if (null != t) {
var i = cc.vv.gameNetMgr.conf, n = -1;
null != this._curBaoMode ? n = this._curBaoMode : null != i && null != i.baoMode && (n = parseInt(i.baoMode));
var a = null != this._caishen ? this._caishen : i ? i.caishen : null, o = null != this._caishen2 ? this._caishen2 : i ? i.caishen2 : null, s = null != a && a >= 0, c = t.getChildByName("title"), r = c ? c.getComponent(cc.Label) : null, l = t.getChildByName("cs1"), h = t.getChildByName("cs2"), d = t.getChildByName("wu");
if (s) {
t.active = !0;
!r || "无财" !== r.string && 0 !== r.string.length || (r.string = "财神");
var u = function(e, t) {
var i = e.getComponent(cc.Sprite);
if (i) try {
var n = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
n && (i.spriteFrame = n);
} catch (e) {
console.warn("[caishenTip] 取牌面失败 pai=" + t, e);
}
}, v = null != o && o >= 0;
if (v) {
if (l) {
l.active = !0;
u(l, a);
}
if (h) {
h.active = !0;
u(h, o);
}
d && (d.active = !1);
} else {
l && (l.active = !1);
if (h) {
h.active = !0;
u(h, a);
}
if (d) {
var g = d.getComponent(cc.Label);
g && (g.string = "独");
d.active = !0;
}
}
var _ = this, f = v && l ? l.getComponent(cc.Sprite) : null, m = h ? h.getComponent(cc.Sprite) : null;
if (null != f && null == f.spriteFrame || null != m && null == m.spriteFrame) {
cc.vv.mahjongmgr && cc.vv.mahjongmgr.bottomAtlas || console.warn("[caishenTip] bottomAtlas 未就绪, 等待重试");
null == this._csRetryCount && (this._csRetryCount = 0);
if (!this._csRetryScheduled && this._csRetryCount < 600) {
this._csRetryScheduled = !0;
var p = a;
this.scheduleOnce(function() {
_._csRetryScheduled = !1;
if (cc.isValid(_.node) && (null == _._caishen || _._caishen === p)) {
_._csRetryCount++;
_.initCaishenTip();
var e = !f || null != f.spriteFrame, t = !m || null != m.spriteFrame;
e && t && (_._csRetryCount = 0);
}
}, 0);
}
} else this._csRetryCount = 0;
} else if (0 === n) {
t.active = !0;
r && (r.string = "无财");
l && (l.active = !1);
h && (h.active = !1);
if (d) {
var b = d.getComponent(cc.Label);
b && (b.string = "无财");
d.active = !0;
}
} else t.active = !1;
}
}
},
_showBaoInfo: function(e) {
if (e) {
var t = null != e.baoTai ? parseInt(e.baoTai) : this._baoTai || 0, i = null != e.baoMode ? parseInt(e.baoMode) : this._curBaoMode, n = ((0 === i ? "无财" : 1 === i ? "独财" : 2 === i ? "双财" : "") || "") + (t > 0 ? t + "台" : ""), a = cc.vv.gameNetMgr, o = null != e.baoSeatIndex ? parseInt(e.baoSeatIndex) : a && null != a.baoSeatIndex ? parseInt(a.baoSeatIndex) : -1, s = this.node.getChildByName("game"), c = s ? s.getChildByName("caishenTip") : null;
if (c) {
var r = c.getChildByName("baoTaiLabel");
if (r) {
var l = r.getComponent(cc.Label);
l && (l.string = n);
r.active = n.length > 0;
}
}
this._showBaoFlag(o);
}
},
_getBaoFlagNode: function(e) {
if (!e) return null;
var t = e.getChildByName("baoFlag");
if (t) return t;
for (var i = 0; i < e.children.length; ++i) {
var n = e.children[i];
if (n.getChildByName("baoFlag")) return n;
}
return null;
},
_showBaoFlag: function(e) {
null != e && (e = parseInt(e));
var t = this.node.getComponent("MJRoom");
if (t && t._seats2 && 0 !== t._seats2.length) {
for (var i = cc.vv.gameNetMgr, n = i.seats ? i.seats.length : t._seats2.length, a = null != i.seatIndex ? parseInt(i.seatIndex) : 0, o = 0; o < t._seats2.length; ++o) {
var s = t._seats2[o];
if (s && s.node) {
var c = this._getBaoFlagNode(s.node);
c && (c.active = !1);
}
}
if (!(null == e || e < 0)) {
var r = ((e - a) % n + n) % n, l = t._seats2[r];
if (l && l.node) {
var h = this._getBaoFlagNode(l.node);
h && (h.active = !0);
}
}
}
},
_clearBaoFlag: function() {
var e = this.node.getComponent("MJRoom");
if (e && e._seats2) for (var t = 0; t < e._seats2.length; ++t) {
var i = e._seats2[t];
if (i && i.node) {
var n = this._getBaoFlagNode(i.node);
n && (n.active = !1);
}
}
},
_bindBaoButton: function(e, t, i) {
if (e) {
e.pai = t;
cc.vv.utils.addClickEvent(e, this.node, "MJGameBMJ", i);
for (var n = e.children || [], a = 0; a < n.length; ++a) {
var o = n[a], s = o.getComponent(cc.Sprite);
if (s && s.spriteFrame) {
o.pai = t;
o.getComponent(cc.Button) || (o.addComponent(cc.Button).transition = cc.Button.Transition.NONE);
cc.vv.utils.addClickEvent(o, this.node, "MJGameBMJ", i);
}
}
}
},
_baoRank: function(e, t) {
return 10 * (e || 0) + (null == t ? 1 : 0 == t ? 2 : 1 == t ? 1 : 0);
},
onBaoSelect: function(e) {
if (e && this._baoPanel) {
cc.vv.gameNetMgr.waitBaoData = null;
if (e.seatIndex == cc.vv.gameNetMgr.seatIndex) {
this._hideWaitCaishenTip();
var t = this;
this.scheduleOnce(function() {
cc.isValid(t.node) && t._baoShow(e);
}, 0);
}
}
},
_baoShow: function(e) {
if (this._baoPanel) {
var t = e && null != e.currentRank ? e.currentRank : -1;
t < 0 && e && null != e.currentSeat && e.currentSeat >= 0 && null != e.currentTai && (t = this._baoRank(e.currentTai, e.currentMode));
this._baoCurRank = t;
this._baoForced = !(!e || !e.forced);
this._baoMode = 2;
this._baoTai = 2;
this._baoPanel.active = !0;
this._options.active = !0;
var i = this._options.getChildByName("op");
i && (i.active = !1);
var n = this._options.getChildByName("btnGuo");
n && (n.active = !1);
var a = this._baoPanel.getChildByName("lblTip");
if (a) {
var o = a.getComponent(cc.Label);
if (o) if (this._baoForced) o.string = "双方均未叫台，你被强制包，请选择包法（2台）"; else if (this._baoCurRank < 0) o.string = "请叫台"; else {
var s = Math.floor(this._baoCurRank / 10), c = this._baoCurRank % 10, r = 2 === c ? "无财" : 1 === c ? "独财" : "双财";
o.string = "对家叫" + r + s + "台";
}
}
this._refreshBaoButtons();
this._highlightBaoMode(this._baoPanel.getChildByName("btnShuangCai"));
}
},
_refreshBaoButtons: function() {
if (this._baoPanel) for (var e = null != this._baoCurRank ? this._baoCurRank : -1, t = 2; t <= 7; ++t) {
var i = this._baoPanel.getChildByName("btnTai" + t);
i && (this._baoForced ? i.active = 2 === t : i.active = this._baoRank(t, this._baoMode) > e);
}
},
_highlightBaoMode: function(e) {
for (var t = [ "btnNoCai", "btnDuCai", "btnShuangCai" ], i = 0; i < t.length; ++i) {
var n = this._baoPanel.getChildByName(t[i]);
if (n) {
var a = n === e ? 255 : 150;
n.opacity = a;
for (var o = n.children || [], s = 0; s < o.length; ++s) o[s].getComponent(cc.Sprite) && (o[s].opacity = a);
}
}
},
onBaoModeClicked: function(e) {
var t = e && (e.currentTarget || e.node || e.target) || null;
if (null != t) {
var i = null != t.pai ? parseInt(t.pai) : NaN;
isNaN(i) && t.name && (i = parseInt(t.name.replace(/[^0-9]/g, "")));
if (!isNaN(i)) {
this._baoMode = i;
var n = t.parent && t.parent !== this._baoPanel ? t.parent : t;
this._highlightBaoMode(n);
this._refreshBaoButtons();
}
}
},
onBaoTaiClicked: function(e) {
var t = e && (e.currentTarget || e.node || e.target) || null;
if (null != t) {
var i = null != t.pai ? parseInt(t.pai) : NaN;
isNaN(i) && t.name && (i = parseInt(t.name.replace(/[^0-9]/g, "")));
if (!isNaN(i)) {
this._baoTai = i;
cc.vv.net.send("bao", {
isBao: !0,
baoTai: this._baoTai,
baoTaiFee: 0,
caishenMode: this._baoMode
});
this._hideBaoPanel();
var n = [ "无财", "独财", "双财" ][this._baoMode] || "";
this._showWaitCaishenTip("你已叫" + n + this._baoTai + "台，等待对家决策");
}
}
},
onBaoNoBaoClicked: function() {
cc.vv.net.send("bao", {
isBao: !1
});
this._hideBaoPanel();
this._showWaitCaishenTip("你已放弃包，等待对家决策");
},
_hideBaoPanel: function() {
this._baoPanel && (this._baoPanel.active = !1);
var e = this._options ? this._options.getChildByName("btnGuo") : null;
e && (e.active = !0);
this._options && (this._options.active = !1);
},
onBaoResult: function(e) {
if (e) {
this._hideBaoPanel();
if (null != e.baoMode) {
this._curBaoMode = parseInt(e.baoMode);
if (cc.vv.gameNetMgr) {
cc.vv.gameNetMgr.baoMode = this._curBaoMode;
cc.vv.gameNetMgr.baoSeatIndex = e.baoSeatIndex;
cc.vv.gameNetMgr.baoTai = e.baoTai;
}
}
this._showBaoInfo(e);
if (null != e.caishen) {
this._hideWaitCaishenTip();
this._caishen = parseInt(e.caishen);
this._caishen2 = null != e.caishen2 ? parseInt(e.caishen2) : null;
this._hideCsPanel();
this.initCaishenTip();
this.initMahjongs(!1);
} else if (parseInt(e.baoSeatIndex) != cc.vv.gameNetMgr.seatIndex) {
var t = [ "无财", "独财", "双财" ][parseInt(e.baoMode)] || "";
this._showWaitCaishenTip("对家已包" + t + parseInt(e.baoTai) + "台，等待对家定财神");
} else this._hideWaitCaishenTip();
}
},
_showWaitCaishenTip: function(e) {
var t = cc.find("Canvas/tip_notice");
if (t) {
t.active = !0;
var i = t.getChildByName("info");
if (i) {
var n = i.getComponent(cc.Label);
n && (n.string = e);
}
}
},
_hideWaitCaishenTip: function() {
var e = cc.find("Canvas/tip_notice");
e && (e.active = !1);
},
onCaishenSelect: function(e) {
if (e) {
this._csMode = null != e.mode ? parseInt(e.mode) : 2;
this._csPai = null;
if (this._csPaiNode) {
this._csPaiNode.y = 0;
this._csPaiNode = null;
}
var t = this;
this.scheduleOnce(function() {
if (cc.isValid(t.node)) {
t._hideBaoPanel();
t._showCsPanel();
}
}, 0);
}
},
_showCsPanel: function() {
if (this._csPanel) {
this._csPanel.active = !0;
this._options.active = !0;
var e = this._options.getChildByName("op");
e && (e.active = !1);
var t = this._options.getChildByName("btnGuo");
t && (t.active = !1);
var i = this._csPanel.getChildByName("btnSetCaishen");
i && (i.active = !1);
}
},
_hideCsPanel: function() {
this._csPanel && (this._csPanel.active = !1);
if (this._csPaiNode) {
this._csPaiNode.y = 0;
this._csPaiNode = null;
}
this._csPai = null;
},
onSetCaishenClicked: function() {
if (!(null == this._csPai || this._csPai < 0)) {
cc.vv.net.send("caishen_select", {
pai: this._csPai
});
this._hideCsPanel();
}
},
playEfx: function(e, t) {
this._playEfxs[e].node.active = !0;
this._playEfxs[e].play(t);
},
onGameBeign: function(e) {
this._hideWaitCaishenTip();
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), o = this._hupaiTips[a];
o.active = n.hued;
if (n.hued) {
o.getChildByName("sprHu").active = !n.iszimo;
o.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var s = this.node.getChildByName("game");
this._clearBaoFlag();
var c = s.getChildByName("caishenTip");
if (c) {
var r = c.getChildByName("baoTaiLabel");
if (r) {
var l = r.getComponent(cc.Label);
l && (l.string = "");
r.active = !1;
}
}
var h = s.getChildByName("huanpaiinfo");
null != h && (h.active = !1);
var d = [ "right", "up", "left" ];
for (t = 0; t < d.length; ++t) {
var u = s.getChildByName(d[t]);
if (null != u) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) u.active = !1; else {
u.active = !0;
var v = u.getChildByName("holds");
for (i = 0; i < v.childrenCount; ++i) v.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var g = cc.vv.gameNetMgr.seats;
for (var t in g) {
n = g[t];
if (0 != (a = cc.vv.gameNetMgr.getLocalIndex(t))) {
this.initOtherMahjongs(n);
t == cc.vv.gameNetMgr.turn ? this.initMopai(t, -1) : this.initMopai(t, null);
}
}
this.showChupai();
if (null != cc.vv.gameNetMgr.curaction) {
this.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
e && this._isFreshDeal() && this._playDealAnim();
}
},
_isFreshDeal: function() {
if (cc.vv.replayMgr && cc.vv.replayMgr.isReplay()) return !1;
var e = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null;
if (!e) return !1;
for (var t = 0; t < e.length; ++t) {
var i = e[t];
if (i) {
if (i.folds instanceof Array && i.folds.length > 0) return !1;
if (i.pengs instanceof Array && i.pengs.length > 0) return !1;
if (i.chis instanceof Array && i.chis.length > 0) return !1;
if (i.angangs instanceof Array && i.angangs.length > 0) return !1;
if (i.diangangs instanceof Array && i.diangangs.length > 0) return !1;
if (i.wangangs instanceof Array && i.wangangs.length > 0) return !1;
if (i.hua instanceof Array && i.hua.length > 0) return !1;
}
}
return !0;
},
_playDealAnim: function() {
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, o) {
if (null != a && 0 != n.length) {
var s = a.convertToNodeSpaceAR(e);
n.sort(o);
for (var c = 0; c < n.length; ++c) {
var r = n[c], l = r.x, h = r.y, d = r.opacity;
t.push({
node: r,
x: l,
y: h,
op: d
});
r.setPosition(s);
r.opacity = 0;
r.runAction(cc.sequence(cc.delayTime(.06 * c), cc.spawn(cc.moveTo(.15, cc.v2(l, h)), cc.fadeTo(.15, d))));
var u = .06 * c + .15;
u > i && (i = u);
}
}
}, a = [], o = null, s = 0; s < this._myMJArr.length; ++s) {
var c = this._myMJArr[s];
if (c && c.node && c.node.active && null != c.node.mjId) {
a.push(c.node);
o = c.node.parent;
}
}
n(a, o, function(e, t) {
return e.x - t.x;
});
for (var r = this.node.getChildByName("game"), l = cc.vv.gameNetMgr.seats || [], h = 0; h < l.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var u = cc.vv.mahjongmgr.getSide(d), v = r ? r.getChildByName(u) : null, g = v ? v.getChildByName("holds") : null;
if (null != g) {
for (var _ = [], f = 0; f < g.childrenCount; ++f) {
var m = g.children[f];
m.active && _.push(m);
}
n(_, g, "up" == u ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).x - e.convertToWorldSpaceAR(cc.v2(0, 0)).x;
} : "left" == u ? function(e, t) {
return t.convertToWorldSpaceAR(cc.v2(0, 0)).y - e.convertToWorldSpaceAR(cc.v2(0, 0)).y;
} : function(e, t) {
return e.convertToWorldSpaceAR(cc.v2(0, 0)).y - t.convertToWorldSpaceAR(cc.v2(0, 0)).y;
});
}
}
}
if (0 != t.length) {
this._dealAnimNodes = t;
this._dealAnimating = !0;
this._dealAnimUntil = Date.now() + 1e3 * (i + .3);
this._dealAnimId = (this._dealAnimId || 0) + 1;
var p = this._dealAnimId, b = this;
this.scheduleOnce(function() {
if (b._dealAnimId == p) {
b._dealAnimating = !1;
b._dealAnimNodes = null;
}
}, i + .05);
}
},
_cancelDealAnim: function() {
if (this._dealAnimating) {
this._dealAnimating = !1;
this._dealAnimId = (this._dealAnimId || 0) + 1;
for (var e = this._dealAnimNodes || [], t = 0; t < e.length; ++t) {
var i = e[t];
if (cc.isValid(i.node)) {
i.node.stopAllActions();
i.node.setPosition(i.x, i.y);
i.node.opacity = i.op;
}
}
this._dealAnimNodes = null;
}
},
_findMJNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null; t && null == t.mjId && t.parent; ) t = t.parent;
return t;
},
_findBtnNode: function(e) {
for (var t = e && (e.node || e.currentTarget || e.target) || null, i = {
btnPeng: 1,
btnGang: 1,
btnHu: 1,
btnGuo: 1,
btnChi: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
onMJClicked: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (null != this._csPanel && this._csPanel.active) {
var t = this._csPanel.getChildByName("btnSetCaishen"), i = this._findMJNode(e);
if (null == i || null == i.mjId) return;
for (var n = 0; n < this._myMJArr.length; ++n) if (i == this._myMJArr[n].node) {
if (this._csPaiNode == i) {
i.y = 0;
this._csPaiNode = null;
this._csPai = null;
t && (t.active = !1);
return;
}
this._csPaiNode && (this._csPaiNode.y = 0);
i.y = 15;
this._csPaiNode = i;
this._csPai = i.mjId;
t && (t.active = !0);
return;
}
} else if (this._chiSelect) {
var a = this._findMJNode(e);
if (null == a || null == a.mjId) return;
for (var o = 0; o < this._myMJArr.length; ++o) if (a == this._myMJArr[o].node) {
var s = this._chiSelect.tiles, c = s.indexOf(a);
if (-1 != c) {
s.splice(c, 1);
a.y = 0;
return;
}
if (s.length >= 2) return;
s.push(a);
a.y = 15;
if (2 == s.length) {
var r = s[0].mjId, l = s[1].mjId, h = this._chiSelect.pai;
s[0].y = 0;
s[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ r, l, h ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) if (null == cc.vv.gameNetMgr.waitCaishenMode) {
var d = this._findMJNode(e);
if (null != d) for (var u = 0; u < this._myMJArr.length; ++u) if (d == this._myMJArr[u].node) {
if (d == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
d.y = 15;
this._selectedMJ = d;
return;
}
} else console.log("[onMJClicked] 等待定财神,禁止出牌"); else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && (this._baoPanel && this._baoPanel.active ? console.log("[shoot] 叫台进行中,禁止出牌") : null == cc.vv.gameNetMgr.waitCaishenMode ? cc.vv.net.send("chupai", e) : console.log("[shoot] 等待定财神,禁止出牌"));
},
getMJIndex: function(e, t) {
return "right" == e || "up" == e ? 13 - t : t;
},
initMopai: function(e, t) {
this._cancelDealAnim();
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = cc.vv.mahjongmgr.getSide(i), a = cc.vv.mahjongmgr.getFoldPre(i), o = this.node.getChildByName("game").getChildByName(n).getChildByName("holds"), s = this.getMJIndex(n, 13), c = o.children[s];
if (null != c) {
c.scaleX = 1;
c.scaleY = 1;
if (null == t) c.active = !1; else if (t >= 0) {
c.active = !0;
if ("up" == n) {
c.scaleX = .73;
c.scaleY = .73;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(a, t);
} else if (null != t) {
c.active = !0;
if ("up" == n) {
c.scaleX = 1;
c.scaleY = 1;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(n);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), o = 0; o < n.childrenCount; ++o) {
var s = n.children[o];
s.scaleX = 1;
s.scaleY = 1;
s.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, o = a ? a.getChildByName("holds") : null;
if (null != o) {
var s = e.chis || [], c = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + s.length;
c *= 3;
for (var r = 0; r < c; ++r) {
var l = this.getMJIndex(i, r);
null != o.children[l] && (o.children[l].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (r = 0; r < d.length; ++r) {
l = this.getMJIndex(i, r + c);
if (null != o.children[l]) {
var u = o.children[l].getComponent(cc.Sprite);
if (null != u) {
if ("up" == i) {
u.node.scaleX = .73;
u.node.scaleY = .73;
}
u.node.active = !0;
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[r]);
}
}
}
this._hideUnusedHolds(i, o, c + d.length);
} else {
var v = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (r = c; r < c + v; ++r) {
l = this.getMJIndex(i, r);
var g = o.children[l];
null != g && (g.active = !0);
}
this._hideUnusedHolds(i, o, c + v);
}
}
}
}
},
_hideUnusedHolds: function(e, t, i) {
for (var n = i; n < 14; ++n) {
var a = this.getMJIndex(e, n);
null != t.children[a] && (t.children[a].active = !1);
}
},
sortHolds: function(e, t) {
var i = e.holds;
if (null == i || "object" != typeof i || null == i.length) return null;
var n = null, a = (i = i.slice()).length;
!t || 2 != a && 5 != a && 8 != a && 11 != a && 14 != a || (n = i.pop());
for (var o = cc.vv.gameNetMgr.conf, s = o ? o.caishen : -1, c = o ? o.caishen2 : -1, r = [], l = [], h = 0; h < i.length; ++h) {
var d = i[h];
s >= 0 && d == s || null != c && c >= 0 && d == c ? r.push(d) : l.push(d);
}
cc.vv.mahjongmgr.sortMJ(l);
i.length = 0;
for (var u = 0; u < r.length; ++u) i.push(r[u]);
for (var v = 0; v < l.length; ++v) i.push(l[v]);
null != n && i.push(n);
return i;
},
initMahjongs: function(e, t) {
this._cancelDealAnim();
var i = t || this.getSelfSeatData();
console.log("[initMahjongs] allowMopai=", e, "forceSeatData=", !!t, "seatData.holds=", i ? "object" == typeof i.holds ? i.holds.length + ":" + JSON.stringify(i.holds) : i.holds : "null");
if (null != i && null != i.holds && "object" == typeof i.holds && null != i.holds.length) {
var n = this.sortHolds(i, e);
if (null != n) {
this._selectedMJ = null;
var a, o = i.chis || [], s = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + o.length), c = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (c = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (c = 0);
a = c > 0 ? .5 * c : 20;
var r = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), l = this._myMJArr[s], h = l ? l.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", s, "holds.length=", n.length, "startSlot=", s, "endSlot=", s + n.length - 1);
for (var d = [], u = 0; u < n.length; ++u) {
var v = n[u];
if (null == (_ = this._myMJArr[u + s]) || null == _.node) {
d.push("SLOT_" + (u + s) + "=NULL");
break;
}
_.node.mjId = v;
_.node.y = 0;
var g = r && u == n.length - 1;
c > 0 && (_.node.x = h + u * c + (g ? a : 0));
this.setSpriteFrameByMJID("M_", _, v);
d.push("SLOT_" + (u + s) + "=" + v);
}
console.log("[initMahjongs] render:", d.join("|"));
for (u = 0; u < s; ++u) if (null != (_ = this._myMJArr[u]) && null != _.node) {
_.node.mjId = null;
_.spriteFrame = null;
_.node.active = !1;
}
for (u = s + n.length; u < this._myMJArr.length; ++u) {
var _;
if (null != (_ = this._myMJArr[u]) && null != _.node) {
_.node.mjId = null;
_.spriteFrame = null;
_.node.active = !1;
}
}
}
} else console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", i ? i.holds : i);
},
setSpriteFrameByMJID: function(e, t, i) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, i);
t.node.active = !0;
},
getSelfSeatData: function() {
var e = cc.vv.gameNetMgr, t = e ? e.seats : null;
if (!t) return null;
var i = e.seatIndex;
if (null != i && i >= 0 && i < t.length && t[i]) return t[i];
var n = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
if (null != n) for (var a = 0; a < t.length; ++a) if (t[a] && t[a].userid == n) return t[a];
return null;
},
getLocalIndex: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
return (e - cc.vv.gameNetMgr.seatIndex + t) % t;
},
showChiPanel: function(e) {
this.hideChiPanel();
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 36 + 146 * e.length + 30 * (e.length - 1), n = new cc.Node("chiPanel");
n.setContentSize(i, 120);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 120);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -60, i, 120);
o.fill();
o.stroke();
var s = new cc.Node("cap");
s.setContentSize(i, 26);
s.setPosition(0, 37);
n.addChild(s);
var c = s.addComponent(cc.Label);
c.string = "选择吃牌组合";
c.fontSize = 22;
c.lineHeight = 26;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = cc.color(255, 225, 150);
for (var r = 0; r < e.length; ++r) {
var l = e[r], h = new cc.Node("chiItem" + r);
h.setContentSize(146, 66);
h.setPosition(91 + -i / 2 + 176 * r, -13);
n.addChild(h);
h.addComponent(cc.Button);
h.paiList = l;
cc.vv.utils.addClickEvent(h, this.node, "MJGameBMJ", "onChiItemClicked");
for (var d = 0; d < l.length; ++d) {
var u = new cc.Node("p" + d);
u.setContentSize(46, 66);
u.setPosition(50 * d - 50, 0);
h.addChild(u);
var v = u.addComponent(cc.Sprite);
v.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", l[d]);
v.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = n;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e.target.paiList;
t && cc.vv.net.send("chi", t);
this.hideChiPanel();
this.hideOptions();
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i) cc.vv.net.send("hu"); else if ("btnGuo" == i) {
cc.vv.net.send("guo");
this.hideOptions();
}
} else this._chiSelect ? this.cancelChiSelect() : this.enterChiSelect(t.pai);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
this._hideWaitCaishenTip();
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {} ],
MJRoom: [ function(e, t) {
"use strict";
cc._RF.push(t, "9f0aeRoHPlBlp2qaYLq2unR", "MJRoom");
cc.Class({
extends: cc.Component,
properties: {
lblRoomNo: {
default: null,
type: cc.Label
},
_seats: [],
_seats2: [],
_inGame: !1,
_timeLabel: null,
_voiceMsgQueue: [],
_lastPlayingSeat: null,
_playingSeat: null,
_lastPlayTime: null,
_startBtn: null,
_startFrame: null,
_startReadyFrame: null,
_brickWall: null,
_brickStacks: null,
_bricks: [],
_brickFrame: null,
_brickGfx: null,
_brickCap: 0,
_brickX: 0,
_sioHandlers: null,
_leaving: !1
},
onLoad: function() {
if (null != cc.vv) {
this.initView();
this.initSeats();
this.initEventHandlers();
this.initStartButton();
this.applyCustomBtnSkins();
this.initBrickWall();
this.initNetExitListeners();
}
},
initView: function() {
var e = this.node.getChildByName("prepare"), t = e.getChildByName("btnBack");
if (t) {
t.scaleX = .9;
t.scaleY = .9;
}
for (var i = e.getChildByName("seats"), n = 0; n < i.children.length; ++n) this._seats.push(i.children[n].getComponent("Seat"));
this.refreshBtns();
this.lblRoomNo = cc.find("Canvas/infobar/Z_room_txt/New Label").getComponent(cc.Label);
this._timeLabel = cc.find("Canvas/infobar/time").getComponent(cc.Label);
var a = cc.vv.gameNetMgr.roomId;
this.lblRoomNo.string = "房号:" + a;
var o = this.node.getChildByName("game"), s = cc.vv.mahjongmgr.is2Player() ? [ "myself", "up" ] : [ "myself", "right", "up", "left" ];
for (n = 0; n < s.length; ++n) {
var c = o.getChildByName(s[n]);
if (null != c) {
var r = c.getChildByName("seat");
null != r && this._seats2.push(r.getComponent("Seat"));
}
}
var l = cc.find("Canvas/prepare/btnWeichat");
l && cc.vv.utils.addClickEvent(l, this.node, "MJRoom", "onBtnWeichatClicked");
var h = cc.find("Canvas/typeTitle");
if (null != h) {
for (n = 0; n < h.children.length; ++n) h.children[n].active = !1;
if (cc.vv.gameNetMgr.conf) {
var d = cc.vv.gameNetMgr.conf.type;
null != d && "" != d || (d = "xzdd");
var u = h.getChildByName(d);
u && (u.active = !0);
}
}
},
refreshBtns: function() {
this.applySeatCount();
var e = this.node.getChildByName("prepare"), t = e.getChildByName("btnDissolve"), i = e.getChildByName("btnWeichat"), n = e.getChildByName("btnBack"), a = 0 == cc.vv.gameNetMgr.numOfGames, o = cc.vv.gameNetMgr.seats, s = o ? o[cc.vv.gameNetMgr.seatIndex] : null, c = !(!s || !s.ready);
t && (t.active = a && c);
i && (i.active = a);
n && (n.active = a && !c);
this.updateStartBtnState();
},
applySeatCount: function() {
var e = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null;
if (e) {
for (var t = e.length, i = 0; i < this._seats.length; ++i) this._seats[i] && this._seats[i].node && (this._seats[i].node.active = i < t);
for (i = 0; i < this._seats2.length; ++i) this._seats2[i] && this._seats2[i].node && (this._seats2[i].node.active = i < t);
}
},
initStartButton: function() {
var e = this.node.getChildByName("prepare");
if (null != e) {
var t = e.getChildByName("btnStart"), i = null != t;
if (null == t) {
var n = e.getChildByName("btnBack") || e.getChildByName("btnDissolve");
if (null == n) return;
(t = cc.instantiate(n)).name = "btnStart";
e.addChild(t);
}
if (i) {
var a = t.getComponent(cc.Button);
a && a.clickEvents && 0 !== a.clickEvents.length || cc.vv.utils.addClickEvent(t, this.node, "MJRoom", "onBtnStartClicked");
} else {
var o = t.getComponent(cc.Widget);
o && t.removeComponent(o);
var s = t.getComponent(cc.Button);
if (s) {
s.transition = cc.Button.Transition.NONE;
s.clickEvents = [];
}
cc.vv.utils.addClickEvent(t, this.node, "MJRoom", "onBtnStartClicked");
this.retitleButton(t, "开始", 44);
t.setPosition(482, 98);
t.setScale(.5, .78);
}
this._startBtn = t;
this._startBtn.active = 0 == cc.vv.gameNetMgr.numOfGames;
}
},
onBtnStartClicked: function() {
var e = cc.vv.gameNetMgr.seats, t = e ? e[cc.vv.gameNetMgr.seatIndex] : null;
if (!t || !t.ready) {
cc.vv.net.send("ready");
t && (t.ready = !0);
this.updateStartBtnState();
}
},
_applyBtnFrame: function(e, t) {
var i = e.getComponent(cc.Sprite);
if (i) {
i.spriteFrame = t;
i.type = cc.Sprite.Type.SIMPLE;
i.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
var n = e.getChildByName("btnLabel");
n && (n.active = !1);
},
updateStartBtnState: function() {
var e = this._startBtn;
if (null != e) {
var t = "begin" != cc.vv.gameNetMgr.gamestate, i = cc.vv.gameNetMgr.seats, n = i ? i[cc.vv.gameNetMgr.seatIndex] : null, a = !(!n || !n.ready);
e.active = t && !a;
var o = e.getComponent(cc.Button);
o && (o.interactable = !0);
}
},
applyCustomBtnSkins: function() {
var e = this.node.getChildByName("prepare");
if (null != e) {
var t = this, i = function(e, i) {
var n = t._atlasCache = t._atlasCache || {}, a = n["images/atlas/game_ui"];
a ? i(a.getSpriteFrame(e)) : cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(t, o) {
if (!t && o) {
n["images/atlas/game_ui"] = o;
a = o;
}
i(a ? a.getSpriteFrame(e) : null);
});
};
i("mj_btn_start.png", function(e) {
if (e) {
t._startFrame = e;
t.updateStartBtnState();
}
});
i("mj_btn_ready.png", function(e) {
if (e) {
t._startReadyFrame = e;
t.updateStartBtnState();
}
});
var n = e.getChildByName("btnBack");
n && i("mj_btn_back.png", function(e) {
e && cc.isValid(n) && t._applyBtnFrame(n, e);
});
var a = e.getChildByName("btnDissolve");
a && i("mj_btn_dissolve.png", function(e) {
e && cc.isValid(a) && t._applyBtnFrame(a, e);
});
}
},
retitleButton: function(e, t, i) {
if (null != e) {
if (e.getComponent(cc.Sprite)) {
var n = e;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(n)) {
var i = n.getComponent(cc.Sprite);
if (i) {
i.spriteFrame = t;
i.type = cc.Sprite.Type.SIMPLE;
i.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
});
}
i = i || 40;
var a = e.getChildByName("btnLabel");
if (null == a) {
a = new cc.Node("btnLabel");
e.addChild(a);
}
var o = a.getComponent(cc.Label);
null == o && (o = a.addComponent(cc.Label));
o.string = t;
o.fontSize = i;
o.lineHeight = i;
o.overflow = cc.Label.Overflow.NONE;
o.enableWrapText = !1;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.color = cc.color(255, 255, 255);
a.setPosition(0, 0);
}
},
initBrickWall: function() {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("brickWall");
if (null != t) {
this._brickWall = t;
this._brickBuilt = !0;
t.zIndex = -1;
this._brickCap = 72;
this._brickLeft = [];
this._brickRight = [];
for (var i = 0; i < 36; ++i) {
var n = (i < 10 ? "0" : "") + i;
this._brickLeft.push(t.getChildByName("L" + n));
this._brickRight.push(t.getChildByName("R" + n));
}
this._brickCaps = {
farL: t.getChildByName("capFarL"),
farR: t.getChildByName("capFarR"),
nearL: t.getChildByName("capNearL"),
nearR: t.getChildByName("capNearR")
};
this.refreshBrickWall();
} else this._brickBuilt = !1;
}
},
refreshBrickWall: function() {
if (this._brickBuilt) {
var e = cc.vv.gameNetMgr.numOfMJ;
(null == e || e < 0) && (e = 0);
(e = Math.max(0, e - 26)) > this._brickCap && (e = this._brickCap);
for (var t = Math.max(0, e - 36), i = Math.min(e, 36), n = 0; n < 36; ++n) {
this._brickLeft[n] && (this._brickLeft[n].active = n < t);
this._brickRight[n] && (this._brickRight[n].active = n < i);
}
var a = this._brickCaps;
a.farL && (a.farL.active = t > 0);
a.farR && (a.farR.active = i > 0);
a.nearL && (a.nearL.active = t > 0);
a.nearR && (a.nearR.active = i > 0);
}
},
_logSeatPayload: function(e, t) {
null != t ? console.log("[notify]" + e, "seatindex=" + t.seatindex, "userid=" + t.userid, "holds=" + JSON.stringify(t.holds), "pengs=" + JSON.stringify(t.pengs || []), "chis=" + JSON.stringify(t.chis || []), "angangs=" + JSON.stringify(t.angangs || []), "diangangs=" + JSON.stringify(t.diangangs || []), "wangangs=" + JSON.stringify(t.wangangs || [])) : console.log("[notify]" + e + " seatData=null");
},
initNetExitListeners: function() {
var e = cc.vv.net ? cc.vv.net.sio : null;
if (e && e.on && !this._sioHandlers) {
var t = this, i = function() {
console.log("[room] dispress_push:返回大厅");
t.leaveToHall();
}, n = function(e) {
var i = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
if (null != i && e == i) {
console.log("[room] exit_notify_push(自己已被移出房间):返回大厅");
t.leaveToHall();
}
}, a = function() {
console.log("[room] game_all_over_push:显示本次游戏总分数");
t.showTotalScorePanel(null);
}, o = function(e) {
if (e && (1 == e.final || e.endinfo)) {
console.log("[room] game_over_push(final):显示本次游戏总分数");
t.showTotalScorePanel(e);
}
}, s = function() {
console.log("[room] exit_result:退出成功,返回大厅/俱乐部");
t.leaveToHall();
};
e.on("dispress_push", i);
e.on("exit_notify_push", n);
e.on("game_all_over_push", a);
e.on("game_over_push", o);
e.on("exit_result", s);
this._sioHandlers = {
sio: e,
listeners: [ i, n, a, o, s ]
};
}
},
showTotalScorePanel: function(e) {
var t = this.node.getChildByName("game_result");
t && (t.active = !0);
var i = this.node.getChildByName("game_over");
i && (i.active = !1);
var n = this.node.getChildByName("game_over_xlch");
n && (n.active = !1);
var a = this.node.getComponent("GameResult");
if (null != a) {
var o = e || {};
a.onGameEnd ? a.onGameEnd(o.endinfo || null, o.roundHistory || null) : a.showTotalScore && a.showTotalScore();
}
},
leaveToHall: function() {
if (!this._leaving) {
var e = cc.director.getScene ? cc.director.getScene() : null, t = e && e.name ? e.name : "";
if ("hall" != t && "club" != t) {
this._leaving = !0;
cc.vv.gameNetMgr && (cc.vv.gameNetMgr._ignoreDisconnectOnce = !0);
var i = cc.vv.gameNetMgr;
if (i && "club" === i.roomBackScene || cc.vv.fromClubId) {
cc.vv.fromClub = !0;
i && i.roomBackClubId && !cc.vv.fromClubId && (cc.vv.fromClubId = i.roomBackClubId);
cc.vv.sceneMgr ? cc.vv.sceneMgr.load("club") : cc.director.loadScene("club");
} else cc.vv.sceneMgr ? cc.vv.sceneMgr.load("hall") : cc.director.loadScene("hall");
}
}
},
initEventHandlers: function() {
var e = this;
this.node.on("new_user", function(t) {
e.initSingleSeat(t.detail);
});
this.node.on("user_state_changed", function(t) {
e.initSingleSeat(t.detail);
e.refreshBtns();
});
this.node.on("game_begin", function() {
e.refreshBtns();
e.initSeats();
});
this.node.on("game_num", function() {
e.refreshBtns();
});
this.node.on("game_huanpai", function() {
for (var t in e._seats2) e._seats2[t].refreshXuanPaiState();
});
this.node.on("huanpai_notify", function(t) {
var i = t.detail.seatindex, n = cc.vv.gameNetMgr.getLocalIndex(i);
e._seats2[n].refreshXuanPaiState();
});
this.node.on("game_huanpai_over", function() {
for (var t in e._seats2) e._seats2[t].refreshXuanPaiState();
});
this.node.on("voice_msg", function(t) {
t = t.detail;
e._voiceMsgQueue.push(t);
e.playVoice();
});
this.node.on("chat_push", function(t) {
t = t.detail;
var i = cc.vv.gameNetMgr.getSeatIndexByID(t.sender), n = cc.vv.gameNetMgr.getLocalIndex(i), a = e._inGame ? e._seats2[n] : e._seats[n];
a && a.chat(t.content);
});
this.node.on("quick_chat_push", function(t) {
t = t.detail;
var i = cc.vv.gameNetMgr.getSeatIndexByID(t.sender), n = cc.vv.gameNetMgr.getLocalIndex(i), a = t.content, o = cc.vv.chat.getQuickChatInfo(a), s = e._inGame ? e._seats2[n] : e._seats[n];
s && s.chat(o.content);
cc.vv.audioMgr.playSFX(o.sound);
});
this.node.on("emoji_push", function(t) {
t = t.detail;
var i = cc.vv.gameNetMgr.getSeatIndexByID(t.sender), n = cc.vv.gameNetMgr.getLocalIndex(i);
console.log(t);
var a = e._inGame ? e._seats2[n] : e._seats[n];
a && a.emoji(t.content);
});
this.node.on("game_start", function() {
e.refreshBrickWall();
});
this.node.on("mj_count", function() {
e.refreshBrickWall();
});
this.node.on("game_mopai", function() {
e.refreshBrickWall();
});
this.node.on("game_start", function() {
e._inGame = !0;
var t = cc.vv.gameNetMgr.seats;
if (t) {
for (var i = 0; i < t.length; ++i) e._logSeatPayload("game_start seat" + i, t[i]);
e.initSeats();
}
});
this.node.on("peng_notify", function(t) {
e._logSeatPayload("peng_notify", t.detail);
});
this.node.on("chi_notify", function(t) {
e._logSeatPayload("chi_notify", t.detail);
});
this.node.on("gang_notify", function(t) {
e._logSeatPayload("gang_notify", t.detail ? t.detail.seatData : null);
});
this.node.on("game_chupai_notify", function(t) {
e._logSeatPayload("chupai_notify", t.detail ? t.detail.seatData : null);
});
this.node.on("game_mopai", function(t) {
var i = t.detail;
if (null != i) {
var n = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[i.seatIndex] : null;
e._logSeatPayload("game_mopai seat" + i.seatIndex, n);
}
});
},
initSeats: function() {
this.applySeatCount();
var e = cc.vv.gameNetMgr.seats;
if (e) for (var t = 0; t < e.length; ++t) this.initSingleSeat(e[t]);
},
initSingleSeat: function(e) {
this.applySeatCount();
var t = cc.vv.gameNetMgr.getLocalIndex(e.seatindex), i = !e.online, n = e.seatindex == cc.vv.gameNetMgr.button;
console.log("isOffline:" + i);
this._seats[t].setInfo(e.name, e.score);
this._seats[t].setReady(e.ready);
this._seats[t].setOffline(i);
this._seats[t].setID(e.userid);
this._seats[t].voiceMsg(!1);
this._seats2[t].setInfo(e.name, e.score);
this._seats2[t].setZhuang(n);
this._seats[t].setZhuang(n);
var a = cc.vv.gameNetMgr.laozhuang || 0;
this._seats[t].setLaoZhuang(n ? a : 0);
this._seats2[t].setLaoZhuang(n ? a : 0);
this._seats2[t].setOffline(i);
this._seats2[t].setID(e.userid);
this._seats2[t].voiceMsg(!1);
this._seats2[t].refreshXuanPaiState();
},
onBtnSettingsClicked: function() {
cc.vv.popupMgr.showSettings();
},
onBtnBackClicked: function() {
cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show(null, "是否确定退出房间？", function() {
cc.vv.net.send("exit");
}, !0) : cc.vv.net.send("exit");
},
onBtnChatClicked: function() {},
onBtnWeichatClicked: function() {
cc.vv.gameNetMgr.conf.type;
},
onBtnDissolveClicked: function() {
var e = function() {
cc.vv.gameNetMgr && "begin" == cc.vv.gameNetMgr.gamestate ? cc.vv.net.send("dissolve_request") : cc.vv.net.send("dispress");
};
cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show(null, "解散房间不扣房卡，是否确定解散？", e, !0) : e();
},
onBtnExit: function() {
cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show(null, "是否确定退出房间？", function() {
cc.vv.net.send("exit");
}, !0) : cc.vv.net.send("exit");
},
playVoice: function() {
if (null == this._playingSeat && this._voiceMsgQueue.length) {
console.log("playVoice2");
var e = this._voiceMsgQueue.shift(), t = cc.vv.gameNetMgr.getSeatIndexByID(e.sender), i = cc.vv.gameNetMgr.getLocalIndex(t);
this._playingSeat = i;
this._seats[i].voiceMsg(!0);
this._seats2[i].voiceMsg(!0);
var n = JSON.parse(e.content);
console.log(n.msg.length);
cc.vv.voiceMgr.writeVoice("voicemsg.amr", n.msg);
cc.vv.voiceMgr.play("voicemsg.amr");
this._lastPlayTime = Date.now() + n.time;
}
},
update: function() {
var e = Math.floor(Date.now() / 1e3 / 60);
if (this._lastMinute != e) {
this._lastMinute = e;
var t = new Date(), i = t.getHours();
i = i < 10 ? "0" + i : i;
var n = t.getMinutes();
n = n < 10 ? "0" + n : n;
this._timeLabel.string = i + ":" + n;
}
if (null != this._lastPlayTime) {
if (Date.now() > this._lastPlayTime + 200) {
this.onPlayerOver();
this._lastPlayTime = null;
}
} else this.playVoice();
},
onPlayerOver: function() {
cc.vv.audioMgr.resumeAll();
console.log("onPlayCallback:" + this._playingSeat);
var e = this._playingSeat;
this._playingSeat = null;
this._seats[e].voiceMsg(!1);
this._seats2[e].voiceMsg(!1);
},
onDestroy: function() {
cc.vv.voiceMgr.stop();
if (this._sioHandlers && this._sioHandlers.sio) {
for (var e = this._sioHandlers.sio, t = this._sioHandlers.listeners || [], i = 0; i < t.length; ++i) e.removeListener ? e.removeListener(t[i]) : e.off && e.off(t[i]);
this._sioHandlers = null;
}
}
});
cc._RF.pop();
}, {} ],
NoticeTip: [ function(e, t) {
"use strict";
cc._RF.push(t, "0aafcQ/RJxAE7C7z3tIXJ4F", "NoticeTip");
cc.Class({
extends: cc.Component,
properties: {
_guohu: null,
_info: null,
_guohuTime: -1
},
onLoad: function() {
this._guohu = cc.find("Canvas/tip_notice");
this._guohu.active = !1;
this._info = cc.find("Canvas/tip_notice/info").getComponent(cc.Label);
var e = this;
this.node.on("push_notice", function(t) {
t = t.detail;
e._guohu.active = !0;
e._guohuTime = t.time;
e._info.string = t.info;
});
},
update: function(e) {
if (this._guohuTime > 0) {
this._guohuTime -= e;
this._guohuTime < 0 && (this._guohu.active = !1);
}
}
});
cc._RF.pop();
}, {} ],
PengGangs: [ function(e, t) {
"use strict";
cc._RF.push(t, "594e6upScRAKqdCYJ7LQDR6", "PengGangs");
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {
if (cc.vv) {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("myself");
if (null != t) {
var i = t.getChildByName("penggangs");
if (null != i) {
var n = cc.view.getVisibleSize().width / 1280;
if (n < 1) {
i.scaleX *= n;
i.scaleY *= n;
}
var a = this;
this.node.on("peng_notify", function(e) {
e = e.detail;
a.onPengGangChanged(e);
});
this.node.on("gang_notify", function(e) {
e = e.detail;
a.onPengGangChanged(e.seatData);
});
this.node.on("chi_notify", function(e) {
e = e.detail;
a.onPengGangChanged(e);
});
this.node.on("game_start", function() {
a.onGameBein();
a.scheduleOnce(function() {
if (cc.isValid(a.node)) try {
var e = cc.vv.gameNetMgr.seats;
for (var t in e) a.onPengGangChanged(e[t]);
} catch (e) {
cc.warn("[PengGangs] 重连副露重绘失败: " + (e && e.message ? e.message : e));
}
}, 0);
});
var o = cc.vv.gameNetMgr.seats;
for (var s in o) this.onPengGangChanged(o[s]);
}
}
}
}
},
onGameBein: function() {
this.hideSide("myself");
this.hideSide("right");
this.hideSide("up");
this.hideSide("left");
},
hideSide: function(e) {
var t = this.node.getChildByName("game");
if (null != t) {
var i = t.getChildByName(e);
if (null != i) {
var n = i.getChildByName("penggangs");
if (n) for (var a = 0; a < n.childrenCount; ++a) n.children[a].active = !1;
}
}
},
onPengGangChanged: function(e) {
if (null != e && (null != e.angangs || null != e.diangangs || null != e.wangangs || null != e.pengs || null != e.chis)) {
var t = e.seatindex;
if (null == t && null != e.userid) for (var i = cc.vv.gameNetMgr.seats || [], n = 0; n < i.length; ++n) if (i[n] && i[n].userid == e.userid) {
t = n;
break;
}
if (null != t) {
var a = cc.vv.gameNetMgr.getLocalIndex(t), o = cc.vv.mahjongmgr.getSide(a), s = cc.vv.mahjongmgr.getFoldPre(a);
console.log("onPengGangChanged" + a);
var c = this.node.getChildByName("game");
if (null != c) {
var r = c.getChildByName(o);
if (null != r) {
var l = r.getChildByName("penggangs");
if (null != l) {
for (var h = 0; h < l.childrenCount; ++h) l.children[h].active = !1;
var d = 0, u = e.angangs || [];
for (h = 0; h < u.length; ++h) {
var v = u[h];
this.initPengAndGangs(l, o, s, d, v, "angang");
d++;
}
for (u = e.diangangs || [], h = 0; h < u.length; ++h) {
v = u[h];
this.initPengAndGangs(l, o, s, d, v, "diangang");
d++;
}
for (u = e.wangangs || [], h = 0; h < u.length; ++h) {
v = u[h];
this.initPengAndGangs(l, o, s, d, v, "wangang");
d++;
}
var g = e.pengs || [];
for (h = 0; h < g.length; ++h) {
v = g[h];
var _ = e.pengTiles && e.pengTiles[h] || null;
this.initPengAndGangs(l, o, s, d, v, "peng", _);
d++;
}
var f = e.chis || [];
for (h = 0; h < f.length; ++h) {
this.initChis(l, o, s, d, f[h]);
d++;
}
}
}
}
}
}
},
initChis: function(e, t, i, n, a) {
var o = null;
if (e.childrenCount <= n) {
o = "left" == t || "right" == t ? cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft) : cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e.addChild(o);
} else (o = e.children[n]).active = !0;
if ("left" == t) o.y = -75 * n; else if ("right" == t) {
o.y = 75 * n;
o.zIndex = -n;
} else o.x = "myself" == t ? 165 * n + 10 * n : -165 * n;
for (var s = o.getComponentsInChildren(cc.Sprite), c = 0, r = 0; r < s.length; ++r) {
var l = s[r];
if ("gang" == l.node.name) l.node.active = !1; else {
var h = c < a.length ? a[c] : a[a.length - 1];
l.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(i, h);
c++;
}
}
},
initPengAndGangs: function(e, t, i, n, a, o, s) {
var c = null;
if (e.childrenCount <= n) {
c = "left" == t || "right" == t ? cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft) : cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e.addChild(c);
} else (c = e.children[n]).active = !0;
if ("left" == t) c.y = -75 * n; else if ("right" == t) {
c.y = 75 * n;
c.zIndex = -n;
} else c.x = "myself" == t ? 165 * n + 10 * n : -165 * n;
for (var r = c.getComponentsInChildren(cc.Sprite), l = 0, h = 0; h < r.length; ++h) {
var d = r[h];
if ("gang" == d.node.name) {
var u = "peng" != o;
d.node.active = u;
d.node.scaleX = 1;
d.node.scaleY = 1;
if ("angang" == o) {
d.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(t);
if ("myself" == t || "up" == t) {
d.node.scaleX = 1.4;
d.node.scaleY = 1.4;
}
} else d.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(i, a);
} else {
var v = "peng" == o && s && l < s.length ? s[l] : a;
d.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(i, v);
l++;
}
}
}
});
cc._RF.pop();
}, {} ],
PopupMgr: [ function(e, t) {
"use strict";
cc._RF.push(t, "fa18412m3RFrZAD6LACvsmD", "PopupMgr");
cc.Class({
extends: cc.Component,
properties: {
_popuproot: null,
_settings: null,
_dissolveNotice: null,
_endTime: -1,
_extraInfo: null,
_noticeLabel: null
},
onLoad: function() {
if (null != cc.vv) {
cc.vv.popupMgr = this;
this._popuproot = cc.find("Canvas/popups");
this._settings = cc.find("Canvas/popups/settings");
this._dissolveNotice = cc.find("Canvas/popups/dissolve_notice");
this._noticeLabel = this._dissolveNotice.getChildByName("info").getComponent(cc.Label);
this.closeAll();
this.addBtnHandler("settings/btn_close");
this.addBtnHandler("settings/btn_sqjsfj");
this.addBtnHandler("dissolve_notice/btn_agree");
this.addBtnHandler("dissolve_notice/btn_reject");
this.addBtnHandler("dissolve_notice/btn_ok");
var e = this;
this.node.on("dissolve_notice", function(t) {
var i = t.detail;
e.showDissolveNotice(i);
});
this.node.on("dissolve_cancel", function() {
e.closeAll();
});
}
},
start: function() {
cc.vv.gameNetMgr.dissoveData && this.showDissolveNotice(cc.vv.gameNetMgr.dissoveData);
},
addBtnHandler: function(e) {
var t = cc.find("Canvas/popups/" + e);
this.addClickEvent(t, this.node, "PopupMgr", "onBtnClicked");
},
addClickEvent: function(e, t, i, n) {
var a = new cc.Component.EventHandler();
a.target = t;
a.component = i;
a.handler = n;
e.getComponent(cc.Button).clickEvents.push(a);
},
onBtnClicked: function(e) {
this.closeAll();
var t = e.target.name;
"btn_agree" == t ? cc.vv.net.send("dissolve_agree") : "btn_reject" == t ? cc.vv.net.send("dissolve_reject") : "btn_sqjsfj" == t && (cc.vv.gameNetMgr && "begin" == cc.vv.gameNetMgr.gamestate ? cc.vv.net.send("dissolve_request") : cc.vv.net.send("exit_release"));
},
closeAll: function() {
this._fitPopupRoot();
this._popuproot.active = !1;
this._settings.active = !1;
this._dissolveNotice.active = !1;
},
_fitPopupRoot: function() {
if (this._popuproot) {
var e = cc.view.getVisibleSize(), t = cc.view.getVisibleOrigin();
this._popuproot.setContentSize(e.width, e.height);
this._popuproot.setPosition(this._popuproot.parent.convertToNodeSpaceAR(cc.v2(t.x + e.width / 2, t.y + e.height / 2)));
}
},
showSettings: function() {
this.closeAll();
this._popuproot.active = !0;
this._settings.active = !0;
},
showDissolveRequest: function() {
this.closeAll();
this._popuproot.active = !0;
},
showDissolveNotice: function(e) {
this._endTime = Date.now() / 1e3 + e.time;
this._extraInfo = "";
for (var t = 0; t < e.states.length; ++t) {
var i = e.states[t], n = cc.vv.gameNetMgr.seats[t].name;
this._extraInfo += i ? "\n[已同意] " + n : "\n[待确认] " + n;
}
this.closeAll();
this._popuproot.active = !0;
this._dissolveNotice.active = !0;
},
update: function() {
if (this._endTime > 0) {
var e = this._endTime - Date.now() / 1e3;
e < 0 && (this._endTime = -1);
var t = Math.floor(e / 60), i = Math.ceil(e - 60 * t), n = "";
t > 0 && (n += t + "分");
this._noticeLabel.string = n + i + "秒后房间将自动解散" + this._extraInfo;
}
}
});
cc._RF.pop();
}, {} ],
RadioButton: [ function(e, t) {
"use strict";
cc._RF.push(t, "9bb5aKN2AhO9rc9uB+nKZnL", "RadioButton");
cc.Class({
extends: cc.Component,
properties: {
target: cc.Node,
sprite: cc.SpriteFrame,
checkedSprite: cc.SpriteFrame,
checked: !1,
groupId: -1
},
onLoad: function() {
if (null != cc.vv) {
if (null == cc.vv.radiogroupmgr) {
var t = e("RadioGroupMgr");
cc.vv.radiogroupmgr = new t();
cc.vv.radiogroupmgr.init();
}
console.log(typeof cc.vv.radiogroupmgr.add);
cc.vv.radiogroupmgr.add(this);
this.refresh();
}
},
refresh: function() {
var e = this.target.getComponent(cc.Sprite);
this.checked ? e.spriteFrame = this.checkedSprite : e.spriteFrame = this.sprite;
},
check: function(e) {
this.checked = e;
this.refresh();
},
onClicked: function() {
cc.vv.radiogroupmgr.check(this);
},
onDestroy: function() {
cc.vv && cc.vv.radiogroupmgr && cc.vv.radiogroupmgr.del(this);
}
});
cc._RF.pop();
}, {
RadioGroupMgr: "RadioGroupMgr"
} ],
RadioGroupMgr: [ function(e, t) {
"use strict";
cc._RF.push(t, "c78ccvLg3JLFb+ds06R6ds7", "RadioGroupMgr");
cc.Class({
extends: cc.Component,
properties: {
_groups: null
},
init: function() {
this._groups = {};
},
add: function(e) {
var t = e.groupId, i = this._groups[t];
if (null == i) {
i = [];
this._groups[t] = i;
}
i.push(e);
},
del: function(e) {
var t = e.groupId, i = this._groups[t];
if (null != i) {
var n = i.indexOf(e);
-1 != n && i.splice(n, 1);
0 == i.length && delete this._groups[t];
}
},
check: function(e) {
var t = e.groupId, i = this._groups[t];
if (null != i) for (var n = 0; n < i.length; ++n) {
var a = i[n];
a == e ? a.check(!0) : a.check(!1);
}
}
});
cc._RF.pop();
}, {} ],
ReConnect: [ function(e, t) {
"use strict";
cc._RF.push(t, "92090ZoIYtGWYDJARih2HLV", "ReConnect");
cc.Class({
extends: cc.Component,
properties: {
_reconnect: null,
_lblTip: null,
_lastPing: 0
},
onLoad: function() {
this._reconnect = cc.find("Canvas/reconnect");
this._lblTip = cc.find("Canvas/reconnect/tip").getComponent(cc.Label);
var e = this, t = function() {
console.log("[reconnect] 无法回到原牌局,返回来源页");
cc.vv.gameNetMgr && cc.vv.gameNetMgr.clearRoomState();
cc.vv.userMgr.oldRoomId = null;
cc.vv.wc && cc.vv.wc.hide && cc.vv.wc.hide();
cc.vv.sceneMgr ? cc.vv.sceneMgr.load("club") : cc.director.loadScene("club");
}, i = function e() {
cc.vv.net.test(function(i) {
i ? null != (n = cc.vv.userMgr.oldRoomId) ? cc.vv.userMgr.enterRoom(n, function(e) {
null != e && 0 === e.errcode || t();
}) : t() : setTimeout(e, 3e3);
var n;
});
};
this.node.on("disconnect", function t() {
e.node.off("disconnect", t);
e._reconnect.active = !0;
i();
});
},
update: function() {
if (this._reconnect.active) {
var e = Math.floor(Date.now() / 1e3) % 4;
this._lblTip.string = "与服务器断开连接，正在尝试重连";
for (var t = 0; t < e; ++t) this._lblTip.string += ".";
}
}
});
cc._RF.pop();
}, {} ],
ReplayCtrl: [ function(e, t) {
"use strict";
cc._RF.push(t, "cd404pxLQVL243CPrY7hRC9", "ReplayCtrl");
cc.Class({
extends: cc.Component,
properties: {
_nextPlayTime: 1,
_replay: null,
_isPlaying: !0
},
onLoad: function() {
if (null != cc.vv) {
this._replay = cc.find("Canvas/replay");
this._replay.active = cc.vv.replayMgr.isReplay();
}
},
onBtnPauseClicked: function() {
this._isPlaying = !1;
},
onBtnPlayClicked: function() {
this._isPlaying = !0;
},
onBtnBackClicked: function() {
cc.vv.replayMgr.clear();
cc.vv.gameNetMgr.reset();
cc.vv.gameNetMgr.roomId = null;
cc.vv.fromClub = !0;
cc.vv.sceneMgr ? cc.vv.sceneMgr.load("club") : cc.director.loadScene("club");
},
update: function(e) {
if (cc.vv && this._isPlaying && 1 == cc.vv.replayMgr.isReplay() && this._nextPlayTime > 0) {
this._nextPlayTime -= e;
this._nextPlayTime < 0 && (this._nextPlayTime = cc.vv.replayMgr.takeAction());
}
}
});
cc._RF.pop();
}, {} ],
Seat: [ function(e, t) {
"use strict";
cc._RF.push(t, "0a655J0tGxFP5NzRxNN4E+I", "Seat");
cc.Class({
extends: cc.Component,
properties: {
_sprIcon: null,
_zhuang: null,
_ready: null,
_offline: null,
_lblName: null,
_lblScore: null,
_scoreBg: null,
_nddayingjia: null,
_voicemsg: null,
_chatBubble: null,
_emoji: null,
_lastChatTime: -1,
_userName: "",
_score: 0,
_dayingjia: !1,
_isOffline: !1,
_isReady: !1,
_isZhuang: !1,
_userId: null
},
onLoad: function() {
if (null != cc.vv) {
this._sprIcon = this.node.getChildByName("icon").getComponent("ImageLoader");
this._sprIcon || (this._sprIcon = this.node.getChildByName("icon").addComponent("ImageLoader"));
this._lblName = this.node.getChildByName("name").getComponent(cc.Label);
var e = this.node.getChildByName("icon");
e && this._lblName && (this._lblName.node.width = e.width + 16);
if (this._lblName) {
this._lblName.fontSize = Math.min(this._lblName.fontSize, 18);
this._lblName.lineHeight = this._lblName.fontSize + 2;
this._lblName.enableWrapText = !1;
this._lblName.overflow = cc.Label.Overflow.CLAMP;
}
this._lblScore = this.node.getChildByName("score").getComponent(cc.Label);
this._voicemsg = this.node.getChildByName("voicemsg");
this._xuanpai = this.node.getChildByName("xuanpai");
this.refreshXuanPaiState();
this._voicemsg && (this._voicemsg.active = !1);
this._sprIcon && this._sprIcon.getComponent(cc.Button) && cc.vv.utils.addClickEvent(this._sprIcon, this.node, "Seat", "onIconClicked");
this._offline = this.node.getChildByName("offline");
this._ready = this.node.getChildByName("ready");
this._zhuang = this.node.getChildByName("zhuang");
this._zhuang && (this._zhuang.active = !1);
this._scoreBg = this.node.getChildByName("Z_money_frame");
this._nddayingjia = this.node.getChildByName("dayingjia");
this._chatBubble = this.node.getChildByName("ChatBubble");
if (null != this._chatBubble) {
this._chatBubble.active = !1;
var t = this._chatBubble.getChildByName("New Label");
t && (t.active = !1);
}
this._emoji = this.node.getChildByName("emoji");
null != this._emoji && (this._emoji.active = !1);
this.refresh();
this._sprIcon && this._userId && this._sprIcon.setUserID(this._userId);
}
},
onIconClicked: function() {
var e = this._sprIcon.node.getComponent(cc.Sprite);
if (null != this._userId && this._userId > 0) {
var t = cc.vv.gameNetMgr.getSeatByID(this._userId), i = 0;
if (cc.vv.baseInfoMap) {
var n = cc.vv.baseInfoMap[this._userId];
n && (i = n.sex);
}
cc.vv.userinfoShow.show(t.name, t.userid, e, i, t.ip);
}
},
refresh: function() {
null != this._lblName && (this._lblName.string = this._userName);
null != this._lblScore && (this._lblScore.string = this._score);
null != this._nddayingjia && (this._nddayingjia.active = 1 == this._dayingjia);
this._offline && (this._offline.active = this._isOffline && "" != this._userName);
this._ready && (this._ready.active = this._isReady);
this._zhuang && (this._zhuang.active = this._isZhuang);
this.node.active = null != this._userName && "" != this._userName;
},
setInfo: function(e, t, i) {
this._userName = e;
this._score = t;
null == this._score && (this._score = 0);
this._dayingjia = i;
null != this._scoreBg && (this._scoreBg.active = null != this._score);
null != this._lblScore && (this._lblScore.node.active = null != this._score);
this.refresh();
},
setZhuang: function(e) {
this._isZhuang = e;
null == this._zhuang && (this._zhuang = this.node.getChildByName("zhuang"));
this._zhuang && (this._zhuang.active = e);
},
setLaoZhuang: function(e) {
var t = this.node.getChildByName("laozhuang");
if (null == t) {
var i = this.node.getChildByName("icon"), n = i ? i.x + 28 : 34, a = i ? i.y + 28 : 34;
(t = new cc.Node("laozhuang")).setContentSize(90, 22);
t.setPosition(n, a - 24);
this.node.addChild(t);
var o = t.addComponent(cc.Label);
o.fontSize = 18;
o.lineHeight = 22;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
o.overflow = cc.Label.Overflow.NONE;
t.color = cc.color(255, 225, 120);
var s = t.addComponent(cc.LabelOutline);
s.color = cc.color(60, 30, 0);
s.width = 2;
}
var c = null != e && e >= 1;
t.active = c;
if (c) {
var r = t.getComponent(cc.Label);
r && (r.string = "老庄" + e);
}
},
setReady: function(e) {
this._isReady = e;
this._ready && (this._ready.active = this._isReady);
},
setID: function(e) {
var t = this.node.getChildByName("id");
t && (t.getComponent(cc.Label).string = "ID:" + e);
this._userId = e;
this._sprIcon && this._sprIcon.setUserID(e);
},
setOffline: function(e) {
this._isOffline = e;
this._offline && (this._offline.active = this._isOffline && "" != this._userName);
},
chat: function(e) {
if (null != this._chatBubble && null != this._emoji) {
this._emoji.active = !1;
this._chatBubble.active = !0;
var t = new cc.Color(255, 255, 255, 255), i = this._chatBubble.getChildByName("New Label");
(function e(t) {
for (var n = t === i, a = t.getComponents(cc.Label), o = 0; o < a.length; o++) a[o].enabled = !1;
if (!n) {
for (var s = t.getComponents(cc.LabelOutline), c = 0; c < s.length; c++) s[c].enabled = !1;
for (var r = t.getComponents(cc.LabelShadow), l = 0; l < r.length; l++) r[l].enabled = !1;
}
for (var h = 0; h < t.children.length; h++) e(t.children[h]);
})(this._chatBubble);
if (i) {
i.active = !0;
var n = i.getComponent(cc.Label);
if (n) {
n.enabled = !0;
n.string = e;
n.node.color = t;
n.color = t;
}
}
var a = this._chatBubble.getChildByName("chatbg_ld");
if (a) {
a.active = !0;
var o = a.getComponent(cc.Sprite);
o && !o.spriteFrame && cc.loader.loadRes("images/chat/chat_backbg", cc.SpriteFrame, function(e, t) {
!e && o && (o.spriteFrame = t);
});
}
this._lastChatTime = 3;
}
},
emoji: function(e) {
if (null != this._emoji && null != this._emoji) {
console.log(e);
this._chatBubble.active = !1;
this._emoji.active = !0;
this._emoji.getComponent(cc.Animation).play(e);
this._lastChatTime = 3;
}
},
voiceMsg: function(e) {
this._voicemsg && (this._voicemsg.active = e);
},
refreshXuanPaiState: function() {
if (null != this._xuanpai) {
this._xuanpai.active = cc.vv.gameNetMgr.isHuanSanZhang;
if (0 != cc.vv.gameNetMgr.isHuanSanZhang) {
this._xuanpai.getChildByName("xz").active = !1;
this._xuanpai.getChildByName("xd").active = !1;
var e = cc.vv.gameNetMgr.getSeatByID(this._userId);
e && (null == e.huanpais ? this._xuanpai.getChildByName("xz").active = !0 : this._xuanpai.getChildByName("xd").active = !0);
}
}
},
update: function(e) {
if (this._lastChatTime > 0) {
this._lastChatTime -= e;
if (this._lastChatTime < 0) {
this._chatBubble.active = !1;
this._emoji.active = !1;
this._emoji.getComponent(cc.Animation).stop();
}
}
}
});
cc._RF.pop();
}, {} ],
TimePointer: [ function(e, t) {
"use strict";
cc._RF.push(t, "2cec180dg5FbZBjz0vSx8X6", "TimePointer");
cc.Class({
extends: cc.Component,
properties: {
_arrow: null,
_pointer: null,
_timeLabel: null,
_time: -1,
_alertTime: -1
},
onLoad: function() {
var e = this.node.getChildByName("game");
this._arrow = e.getChildByName("arrow");
this._pointer = this._arrow.getChildByName("pointer");
this._timeLabel = this._arrow.getChildByName("lblTime").getComponent(cc.Label);
this._timeLabel.string = "00";
this.initPointer();
var t = this;
this.node.on("game_begin", function() {
t.startTurn();
});
this.node.on("game_start", function() {
t.startTurn();
});
this.node.on("game_chupai", function() {
t.startTurn();
});
this.node.on("game_mopai", function() {
t.startTurn();
});
},
startTurn: function() {
this.initPointer();
if (this._arrow.active) {
var e = cc.vv.gameNetMgr.chupaiTimeout;
(null == e || e <= 0) && (e = 15);
this._time = e;
this._alertTime = 3;
}
},
initPointer: function() {
if (null != cc.vv) {
var e = cc.vv.gameNetMgr.turn;
this._arrow.active = "begin" == cc.vv.gameNetMgr.gamestate && e >= 0;
if (this._arrow.active) {
var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = 0;
"right" == i ? n = 1 : "up" == i ? n = 2 : "left" == i && (n = 3);
for (var a = 0; a < this._pointer.children.length; ++a) this._pointer.children[a].active = a == n;
}
}
},
update: function(e) {
if (this._time > 0) {
this._time -= e;
if (this._alertTime > 0 && this._time < this._alertTime) {
cc.vv.audioMgr.playSFX("timeup_alarm.mp3");
this._alertTime = -1;
}
var t = "";
this._time < 0 && (this._time = 0);
var i = Math.ceil(this._time);
i < 10 && (t = "0");
this._timeLabel.string = t + i;
}
}
});
cc._RF.pop();
}, {} ],
UserInfoShow: [ function(e, t) {
"use strict";
cc._RF.push(t, "28240nr0jlB963YFZ4XkuUL", "UserInfoShow");
cc.Class({
extends: cc.Component,
properties: {
_userinfo: null
},
onLoad: function() {
if (null != cc.vv) {
this._userinfo = cc.find("Canvas/userinfo");
this._userinfo.active = !1;
cc.vv.utils.addClickEvent(this._userinfo, this.node, "UserInfoShow", "onClicked");
cc.vv.userinfoShow = this;
}
},
show: function(e, t, i, n, a) {
if (null != t && t > 0) {
this._userinfo.active = !0;
this._userinfo.getChildByName("icon").getComponent(cc.Sprite).spriteFrame = i.spriteFrame;
this._userinfo.getChildByName("name").getComponent(cc.Label).string = e;
this._userinfo.getChildByName("ip").getComponent(cc.Label).string = "IP: " + a.replace("::ffff:", "");
this._userinfo.getChildByName("id").getComponent(cc.Label).string = "ID: " + t;
var o = this._userinfo.getChildByName("sex_female");
o.active = !1;
var s = this._userinfo.getChildByName("sex_male");
s.active = !1;
1 == n ? s.active = !0 : 2 == n && (o.active = !0);
}
},
onClicked: function() {
this._userinfo.active = !1;
}
});
cc._RF.pop();
}, {} ],
Voice: [ function(e, t) {
"use strict";
cc._RF.push(t, "edcddHQ8s1Jw48/UaWN7x7O", "Voice");
cc.Class({
extends: cc.Component,
properties: {
_lastTouchTime: null,
_voice: null,
_volume: null,
_voice_failed: null,
_lastCheckTime: -1,
_timeBar: null,
_failedTimer: null,
MAX_TIME: 15e3,
FAILED_TIP_MS: 2e3
},
onLoad: function() {
this._voice = cc.find("Canvas/voice");
this._voice.active = !1;
this._voice_failed = cc.find("Canvas/voice/voice_failed");
this._voice_failed.active = !1;
this._timeBar = cc.find("Canvas/voice/time");
this._timeBar.scaleX = 0;
this._volume = cc.find("Canvas/voice/volume");
for (var e = 1; e < this._volume.children.length; ++e) this._volume.children[e].active = !1;
(t = cc.find("Canvas/voice/voice_failed/btn_ok")) && cc.vv.utils.addClickEvent(t, this.node, "Voice", "onBtnOKClicked");
var t, i = this;
if (t = cc.find("Canvas/btn_voice")) {
t.on(cc.Node.EventType.TOUCH_START, function() {
console.log("cc.Node.EventType.TOUCH_START");
i._clearFailedTimer();
cc.vv.voiceMgr.prepare("record.amr");
i._lastTouchTime = Date.now();
i._voice.active = !0;
i._voice_failed.active = !1;
});
t.on(cc.Node.EventType.TOUCH_MOVE, function() {
console.log("cc.Node.EventType.TOUCH_MOVE");
});
t.on(cc.Node.EventType.TOUCH_END, function() {
console.log("cc.Node.EventType.TOUCH_END");
if (Date.now() - i._lastTouchTime < 1e3) {
i._voice_failed.active = !0;
cc.vv.voiceMgr.cancel();
i._scheduleFailedAutoClose();
} else i.onVoiceOK();
i._lastTouchTime = null;
});
t.on(cc.Node.EventType.TOUCH_CANCEL, function() {
console.log("cc.Node.EventType.TOUCH_CANCEL");
cc.vv.voiceMgr.cancel();
i._lastTouchTime = null;
i._voice.active = !1;
});
}
},
onVoiceOK: function() {
if (null != this._lastTouchTime) {
cc.vv.voiceMgr.release();
var e = Date.now() - this._lastTouchTime, t = cc.vv.voiceMgr.getVoiceData("record.amr");
cc.vv.net.send("voice_msg", {
msg: t,
time: e
});
}
this._voice.active = !1;
},
onBtnOKClicked: function() {
this._clearFailedTimer();
this._voice.active = !1;
},
_clearFailedTimer: function() {
if (this._failedTimer) {
clearTimeout(this._failedTimer);
this._failedTimer = null;
}
},
_scheduleFailedAutoClose: function() {
var e = this;
this._clearFailedTimer();
this._failedTimer = setTimeout(function() {
e._failedTimer = null;
e._voice_failed.active = !1;
e._voice.active = !1;
}, this.FAILED_TIP_MS);
},
update: function() {
if (1 == this._voice.active && 0 == this._voice_failed.active && Date.now() - this._lastCheckTime > 300) {
for (var e = 0; e < this._volume.children.length; ++e) this._volume.children[e].active = !1;
var t = cc.vv.voiceMgr.getVoiceLevel(7);
t >= 1 && t <= 7 && (this._volume.children[t - 1].active = !0);
this._lastCheckTime = Date.now();
}
if (this._lastTouchTime) {
var i = Date.now() - this._lastTouchTime;
if (i >= this.MAX_TIME) {
this.onVoiceOK();
this._lastTouchTime = null;
} else {
var n = i / this.MAX_TIME;
this._timeBar.scaleX = 1 - n;
}
}
}
});
cc._RF.pop();
}, {} ],
clubScene: [ function(e, t) {
"use strict";
cc._RF.push(t, "47d77SErCFJl7fxgisdblQt", "clubScene");
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {
console.log("[club] onLoad fired, cc.vv=", !!cc.vv);
if (cc.vv) {
var e = cc.find("Canvas"), t = e ? e.getChildByName("WaitingConnection") : null;
!t || cc.vv.wc && cc.vv.wc.node === t || (t.active = !0);
this._clubTpl = this._clubFind(e, "sampleCard0");
var i = e.getChildByName("clubPage"), n = e.getChildByName("wfPage");
if (cc.vv.fromClubId) {
i && (i.active = !1);
n && (n.active = !1);
this._clubBackToDetail(cc.vv.fromClubId);
} else {
i && (i.active = !0);
n && (n.active = !1);
this.openClubPanel();
}
this.scheduleOnce(function() {
var e = cc.vv && cc.vv.bbKickTip;
if (e) {
cc.vv.bbKickTip = null;
cc.vv.wc && cc.vv.wc.showAlert ? cc.vv.wc.showAlert(e, "提示") : cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(e);
}
}, .3);
} else cc.director.loadScene("login");
},
_clubPaintRect: function(e, t, i, n, a, o) {
e.fillColor = n;
e.rect(-t / 2, -i / 2, t, i);
e.fill();
e.strokeColor = a;
e.lineWidth = o;
e.rect(-t / 2, -i / 2, t, i);
e.stroke();
},
openClubPanel: function() {
null == this._clubPanel && this._clubBuildPanel();
this._clubPanel.active = !0;
this._clubLayoutPage();
this._clubState = "mine";
this._clubListArea && (this._clubListArea.active = !0);
this._clubSetTop();
this._clubRefreshList();
},
_clubBuildPanel: function() {
var e = this, t = cc.find("Canvas");
if (null != t) {
var i = t.getChildByName("clubPage");
if (i) {
this._clubBaked = !0;
this._clubPanel = i;
this._clubPageBg = i.getChildByName("clubBg");
if (this._clubPageBg) {
var n = this._clubPageBg.getComponent(cc.Canvas);
n && n.destroy();
var a = this._clubPageBg.getComponent(cc.Sprite);
a && (a.sizeMode = cc.Sprite.SizeMode.CUSTOM);
}
this._clubMask = i.getChildByName("mask");
this._clubCloseBtn = i.getChildByName("btn_close");
this._clubBtnMine = i.getChildByName("btnMine");
this._clubBtnCreate = i.getChildByName("btnCreate");
this._clubBtnJoin = i.getChildByName("btnJoin");
this._clubListArea = i.getChildByName("listArea");
for (var o = [ this._clubBtnMine, this._clubBtnCreate, this._clubBtnJoin ], s = 0; s < o.length; ++s) if (o[s]) {
o[s]._clubW = o[s].width;
o[s]._clubH = o[s].height;
}
if (!i._clubBound) {
i._clubBound = !0;
this._clubMask && this._clubMask.on(cc.Node.EventType.TOUCH_START, function() {});
if (this._clubCloseBtn) {
var c = this._clubCloseBtn.getComponent(cc.Button);
c && (c.clickEvents = []);
this._clubCloseBtn.on(cc.Node.EventType.TOUCH_END, function() {
e._clubClosePanel();
});
}
this._clubBtnMine && this._clubBtnMine.on(cc.Node.EventType.TOUCH_END, function() {
e._clubShowMine();
e._clubRefreshList();
});
this._clubBtnCreate && this._clubBtnCreate.on(cc.Node.EventType.TOUCH_END, function() {
e._clubShowCreate();
});
this._clubBtnJoin && this._clubBtnJoin.on(cc.Node.EventType.TOUCH_END, function() {
e._clubShowJoin();
});
this._clubBindBakedPopups(i);
}
this._clubLayoutPage();
}
}
},
_clubBindBakedPopups: function(e) {
var t = this, i = function(e, i) {
if (e && !e._clubBound) {
e._clubBound = !0;
var n = e.getChildByName("close");
n && n.on(cc.Node.EventType.TOUCH_END, function() {
t._clubShowMine();
});
if (i) {
var a = e.getChildByName("PopupScene20"), o = a ? a.getChildByName("New Label") : null;
if (o) {
var s = o.getComponent(cc.Label);
s && (s.string = "请输入俱乐部ID");
}
var c = e.getComponent("JoinGameInput");
if (c) {
t._clubJoinComp = c;
c.onInputFinished = function(e) {
t._clubDoJoin(e);
};
}
}
}
};
i(e.getChildByName("clubCreateWin"), !1);
i(e.getChildByName("clubJoinWin"), !0);
},
_clubStretchPopupDim: function(e) {
if (e) {
var t = e.getChildByName("New Layout");
if (t) {
var i = cc.view.getVisibleSize();
t.setContentSize(i.width, i.height);
t.setPosition(0, 0);
}
}
},
_clubLayoutPage: function() {
var e = this._clubPanel;
if (e) {
var t = cc.view.getVisibleSize(), i = cc.view.getVisibleOrigin();
e.setContentSize(t.width, t.height);
e.setPosition(e.parent.convertToNodeSpaceAR(cc.v2(i.x + t.width / 2, i.y + t.height / 2)));
if (this._clubPageBg) {
this._clubPageBg.setContentSize(t.width, t.height);
this._clubPageBg.setPosition(0, 0);
}
this._clubMask && this._clubMask.setContentSize(t.width, t.height);
}
},
_clubPaintBtn: function() {},
_clubRefreshBtnFrames: function() {},
_clubFind: function(e, t) {
if (!e) return null;
if (e.name === t) return e;
for (var i = e.children, n = 0; n < i.length; n++) {
var a = this._clubFind(i[n], t);
if (a) return a;
}
return null;
},
_clubPaintRow: function(e, t) {
e._selected = t;
var i = e._iconSp, n = i ? t && e._iconSel ? e._iconSel : e._iconNormal : null;
if (i && n) {
i.spriteFrame = n;
i.node.setContentSize(e.width, e.height);
} else {
var a = e.getChildByName("bg");
if (a) {
var o = a.getComponent(cc.Graphics);
if (o) {
o.clear();
this._clubPaintRect(o, e.width, e.height, t ? cc.color(96, 78, 150) : cc.color(52, 42, 84), t ? cc.color(255, 200, 90) : cc.color(120, 100, 170), 2);
}
}
}
},
_loadAtlasFrame: function(e, t, i) {
var n = this._atlasCache = this._atlasCache || {}, a = function(e) {
i(e && e.getSpriteFrame(t) || null);
};
n[e] ? a(n[e]) : cc.resources.load(e, cc.SpriteAtlas, function(t, i) {
!t && i && (n[e] = i);
a(n[e]);
});
},
_clubAddRow: function(e, t, i, n, a, o, s) {
var c = this;
o = o || 760;
var r = new cc.Node("row" + t);
r.setContentSize(o, 68);
var l = e.height ? e.height / 2 - 34 : 110;
r.setPosition(0, l - 73 * t);
e.addChild(r);
var h = -o / 2 + 20, d = 26, u = 0, v = cc.Label.HorizontalAlign.LEFT;
if (s) {
h = 0;
d = 24;
u = .5;
v = cc.Label.HorizontalAlign.CENTER;
var g = new cc.Node("bgimg");
g.setContentSize(o, 68);
r.addChild(g);
var _ = g.addComponent(cc.Sprite);
_.sizeMode = cc.Sprite.SizeMode.CUSTOM;
_.type = cc.Sprite.Type.SIMPLE;
r._iconSp = _;
c._loadAtlasFrame("images/atlas/hall_ui", "club_game.png", function(e) {
if (e && cc.isValid(g)) {
r._iconNormal = e;
if (!r._selected || !r._iconSel) {
_.spriteFrame = e;
g.setContentSize(o, 68);
}
}
});
c._loadAtlasFrame("images/atlas/hall_ui", "club_game_on.png", function(e) {
if (e && cc.isValid(g)) {
r._iconSel = e;
if (r._selected) {
_.spriteFrame = e;
g.setContentSize(o, 68);
}
}
});
}
var f = new cc.Node("l");
f.anchorX = u;
f.setContentSize(.5 === u ? o : o - (h + o / 2) - 70, 68);
f.setPosition(h, 0);
r.addChild(f);
var m = f.addComponent(cc.Label);
m.string = i;
m.fontSize = d;
m.lineHeight = 68;
m.horizontalAlign = v;
m.verticalAlign = cc.Label.VerticalAlign.CENTER;
m.overflow = cc.Label.Overflow.NONE;
f.color = cc.color(0, 0, 0);
if (null != n && "" != n) {
var p = new cc.Node("s");
p.anchorX = 1;
p.setContentSize(100, 68);
p.setPosition(o / 2 - 20, 0);
r.addChild(p);
var b = p.addComponent(cc.Label);
b.string = n;
b.fontSize = 24;
b.lineHeight = 68;
b.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
b.verticalAlign = cc.Label.VerticalAlign.CENTER;
p.color = cc.color(0, 0, 0);
}
a && r.on(cc.Node.EventType.TOUCH_END, function() {
c._clubScrollMoved ? c._clubScrollMoved = !1 : a(r);
});
return r;
},
_clubMakeScrollBox: function(e, t, i, n) {
var a = this, o = this._clubFind(e, "box");
if (o) {
var s = this._clubFind(o, "view"), c = s ? this._clubFind(s, "content") : null, r = s ? s.width : 0, l = s ? s.height : 0;
if (c) {
var h = c.getChildByName("rowTpl"), d = c.getChildByName("emptyTip");
c.removeAllChildren();
h && c.addChild(h);
d && c.addChild(d);
}
this._clubScroll = {
view: s,
content: c,
vw: r,
vh: l
};
if (s && !o._clubScrollBound) {
o._clubScrollBound = !0;
var u = 0, v = 0;
s.on(cc.Node.EventType.TOUCH_START, function(e) {
u = e.getLocation().y;
v = a._clubScroll && a._clubScroll.content ? a._clubScroll.content.y : 0;
a._clubScrollMoved = !1;
});
s.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
var t = a._clubScroll;
if (t && t.content && !(t.content.height <= t.vh)) {
var i = e.getLocation().y - u;
Math.abs(i) > 6 && (a._clubScrollMoved = !0);
var n = (t.vh - t.content.height) / 2, o = (t.content.height - t.vh) / 2;
t.content.y = Math.max(n, Math.min(o, v + i));
}
});
s.on(cc.Node.EventType.TOUCH_CANCEL, function() {
a._clubScrollMoved = !1;
});
}
return c;
}
var g = new cc.Node("box");
g.setContentSize(t, i);
e.addChild(g);
var _ = new cc.Node("bg");
_.setContentSize(t, i);
g.addChild(_);
var f = _.addComponent(cc.Sprite);
f.sizeMode = cc.Sprite.SizeMode.CUSTOM;
this._clubLoadBg4(function(e) {
if (e) {
f.spriteFrame = e;
f.type = cc.Sprite.Type.SLICED;
}
});
var m = t - 44, p = i - 44, b = new cc.Node("view");
b.setContentSize(m, p);
g.addChild(b);
var C = b.addComponent(cc.Mask);
cc.Mask.Type && null != cc.Mask.Type.RECT && (C.type = cc.Mask.Type.RECT);
var y = new cc.Node("content");
y.setContentSize(m, Math.max(p, n));
y.setPosition(0, (p - y.height) / 2);
b.addChild(y);
this._clubScroll = {
view: b,
content: y,
vw: m,
vh: p
};
var N = 0, S = 0;
b.on(cc.Node.EventType.TOUCH_START, function(e) {
N = e.getLocation().y;
S = y.y;
a._clubScrollMoved = !1;
});
b.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
if (!(y.height <= p)) {
var t = e.getLocation().y - N;
Math.abs(t) > 6 && (a._clubScrollMoved = !0);
var i = (p - y.height) / 2, n = (y.height - p) / 2;
y.y = Math.max(i, Math.min(n, S + t));
}
});
b.on(cc.Node.EventType.TOUCH_CANCEL, function() {
a._clubScrollMoved = !1;
});
return y;
},
_clubLoadBg4: function(e) {
if (this._clubBg4Frame) e(this._clubBg4Frame); else {
var t = this, i = function(i) {
if (i) {
i.insetLeft = 26;
i.insetRight = 26;
i.insetTop = 26;
i.insetBottom = 26;
t._clubBg4Frame = i;
e(i);
} else e(null);
};
cc.resources.load("images/other/bg4", cc.SpriteFrame, function(t, n) {
!t && n ? i(n) : e(null);
});
}
},
_clubClearList: function() {
this._clubScroll = null;
if (this._clubBaked) {
if (this._clubDetailFullBg && cc.isValid(this._clubDetailFullBg)) {
var e = this._clubDetailFullBg.getComponent(cc.Graphics);
e && e.clear();
}
if (this._clubListArea) {
var t = this._clubFind(this._clubListArea, "games");
if (t) {
var i = t.getChildByName("gameRowTpl"), n = t.getChildByName("emptyTip"), a = t.getChildByName("samptext");
t.removeAllChildren();
a && t.addChild(a);
i && t.addChild(i);
if (n) {
t.addChild(n);
n.active = !1;
}
}
var o = this._clubFind(this._clubListArea, "tablesView"), s = o ? o.getChildByName("tables") : null;
s && s.removeAllChildren();
var c = this._clubFind(this._clubListArea, "box"), r = c ? c.getChildByName("view") : null, l = r ? r.getChildByName("content") : null;
if (l) {
var h = l.getChildByName("rowTpl"), d = l.getChildByName("emptyTip");
l.removeAllChildren();
h && l.addChild(h);
if (d) {
l.addChild(d);
d.active = !1;
}
}
}
} else {
this._clubDetailBgNode && cc.isValid(this._clubDetailBgNode) && this._clubDetailBgNode.destroy();
this._clubDetailBgNode = null;
this._clubDetailFullBg && cc.isValid(this._clubDetailFullBg) && this._clubDetailFullBg.destroy();
this._clubDetailFullBg = null;
this._clubListArea && this._clubListArea.removeAllChildren();
}
},
_clubRefreshList: function() {
var e = this;
cc.vv.http.sendRequest("/club_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(t) {
if (0 === t.errcode) {
e._myClubs = t.clubs || [];
if ("mine" === e._clubState) {
e._clubSetTop();
e._clubRenderMine();
}
} else cc.vv.wc.showError(t.errmsg || "获取俱乐部失败");
});
},
_clubSetTop: function() {},
_clubShowMine: function() {
this._clubCloseJoinWin();
this._clubCloseCreateWin();
this._clubCloseBtn && (this._clubCloseBtn.active = !0);
this._clubState = "mine";
this._clubListArea && (this._clubListArea.active = !0);
this._clubSetTop();
this._clubRenderMine();
},
_clubRenderMine: function() {
var e = this;
this._clubClearList();
var t = this._clubListArea;
if (t) {
var i = this._myClubs || [], n = Math.min(t.width || 880, 920), a = (t.height || 460) - 10, o = i.length > 0 ? i.length : 1;
this._clubMakeScrollBox(t, n, a, 80 * o + 20);
var s = this._clubScroll ? this._clubScroll.content : t;
if (s) {
var c = s.getChildByName("rowTpl");
c && (c.active = !1);
var r = s.getChildByName("emptyTip");
if (r) {
r.active = 0 == i.length;
if (0 == i.length) {
var l = r.getComponent(cc.Label);
l && (l.string = "您还没有加入任何俱乐部，请创建或加入！");
}
}
if (0 != i.length) {
var h = c ? c.height : 68, d = h + 5, u = s.height / 2 - h / 2;
i.forEach(function(t, i) {
var n = c ? cc.instantiate(c) : new cc.Node("row" + i);
n.active = !0;
n.setPosition(0, u - i * d);
s.addChild(n);
var a = n.getChildByName("name");
if (a) {
var o = a.getComponent(cc.Label);
o && (o.string = t.name || "");
}
var r = n.getChildByName("sub");
if (r) {
var l = r.getComponent(cc.Label);
l && (l.string = (t.member_count || 0) + "人");
}
n.on(cc.Node.EventType.TOUCH_END, function() {
e._clubScrollMoved ? e._clubScrollMoved = !1 : e._wfOpenDetail(t);
});
});
}
}
}
},
_clubShowCreate: function() {
this._clubClearList();
this._clubCloseJoinWin();
var e = this._clubPanel ? this._clubPanel.getChildByName("clubCreateWin") : null;
if (e) {
this._clubCreateWin = e;
this._clubStretchPopupDim(e);
e.active = !0;
}
},
_clubShowJoin: function() {
this._clubClearList();
this._clubCloseCreateWin();
var e = this._clubPanel ? this._clubPanel.getChildByName("clubJoinWin") : null;
if (e) {
this._clubJoinWin = e;
this._clubStretchPopupDim(e);
e.active = !0;
}
},
_clubDoJoin: function(e) {
var t = this, i = parseInt(e);
i > 0 ? cc.vv.http.sendRequest("/club_join", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: i
}, function(e) {
if (0 !== e.errcode) if (4 !== e.errcode) if (3 !== e.errcode) {
cc.vv.wc.showError(e.errmsg || "加入失败");
t._clubJoinComp && t._clubJoinComp.onResetClicked && t._clubJoinComp.onResetClicked();
} else {
cc.vv.wc.showError("没有此ID的俱乐部");
t._clubJoinComp && t._clubJoinComp.onResetClicked && t._clubJoinComp.onResetClicked();
} else {
t._clubJoinWin && (t._clubJoinWin.active = !1);
t._clubShowMine();
t._clubRefreshList();
} else {
t._clubJoinWin && (t._clubJoinWin.active = !1);
cc.vv.wc.showError("已加入俱乐部「" + e.name + "」");
t._clubShowMine();
t._clubRefreshList();
}
}) : cc.vv.wc.showError("请输入正确的俱乐部ID");
},
_clubCloseJoinWin: function() {
this._clubJoinWin && (this._clubJoinWin.active = !1);
},
_clubCloseCreateWin: function() {
this._clubCreateWin && (this._clubCreateWin.active = !1);
},
_clubBackToDetail: function(e) {
var t = this;
cc.vv.http.sendRequest("/club_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(i) {
if (0 === i.errcode) {
t._myClubs = i.clubs || [];
for (var n = null, a = 0; a < t._myClubs.length; a++) if (t._myClubs[a].id == e) {
n = t._myClubs[a];
break;
}
n ? t._wfOpenDetail(n) : t.openClubPanel();
} else t.openClubPanel();
});
},
_wfOpenDetail: function(e) {
this._wfPanel && this._wfClose();
var t = cc.find("Canvas");
if (t) {
cc.view.getVisibleSize(), cc.view.getVisibleOrigin();
var i = t.getChildByName("wfPage");
if (i) {
i.active = !0;
for (var n = i.getComponentsInChildren(cc.Widget), a = 0; a < n.length; ++a) n[a].updateAlignment();
var o = i.getChildByName("mask");
o && (i._clubBound || o.on(cc.Node.EventType.TOUCH_START, function() {}));
i._clubBound = !0;
var s = i.getChildByName("listArea");
this._wfPanel = i;
this._wfBaked = !0;
this._wfSaved = {
panel: this._clubPanel,
area: this._clubListArea,
closeBtn: this._clubCloseBtn,
baked: this._clubBaked
};
this._clubBaked = !0;
this._clubPanel = i;
this._clubListArea = s;
this._clubCloseBtn = null;
this._wfSaved.panel && (this._wfSaved.panel.active = !1);
this._clubDetailBgNode = i.getChildByName("detailBgImg");
this._clubDetailFullBg = i.getChildByName("detailFullBg");
this._clubOpenDetail(e);
this._wfBindAddTable(e);
}
}
},
_wfBack: function() {
cc.vv.fromClubId = null;
cc.vv.fromClub = !1;
this._wfClose();
this.openClubPanel();
this._clubShowMine();
},
_wfClose: function() {
this._clubStopTableWatch();
this._admHideWins();
this._admPanel && cc.isValid(this._admPanel) && (this._admPanel.active = !1);
var e = this._wfSaved;
this._wfPanel && cc.isValid(this._wfPanel) && (this._wfBaked ? this._wfPanel.active = !1 : this._wfPanel.destroy());
this._wfBaked = !1;
this._wfPanel = null;
this._clubDetailBgNode = null;
this._clubDetailFullBg = null;
this._clubBackBtn = null;
this._clubTablesNode = null;
this._clubGameRows = null;
if (e) {
this._clubPanel = e.panel;
this._clubListArea = e.area;
this._clubCloseBtn = e.closeBtn;
this._clubBaked = e.baked;
this._wfSaved = null;
}
this._clubState = null;
},
_wfBindAddTable: function(e) {
var t = this, i = this._wfPanel;
if (i) {
var n = !!(e && cc.vv.userMgr && cc.vv.userMgr.userId && String(e.owner_userid) === String(cc.vv.userMgr.userId));
this._admGame = null;
var a = i.getChildByName("glSprite");
if (a) {
a.active = n;
if (!a._admBound) {
a._admBound = !0;
a.on(cc.Node.EventType.TOUCH_END, function() {
t._admOpen();
});
}
}
var o = i.getChildByName("KsSprite");
if (o && !o._wfBound) {
o._wfBound = !0;
o.on(cc.Node.EventType.TOUCH_END, function() {
t._wfQuickJoin();
});
}
}
},
_admNode: function(e) {
var t = this._admPanel;
if (!t) return null;
var i = t.getChildByName("AllLayout"), n = i ? i.getChildByName(e) : null;
return n || (n = t.getChildByName(e)) || this._clubFind(t, e);
},
_admOpen: function() {
var e = this, t = cc.find("Canvas"), i = t ? t.getChildByName("admin") : null;
if (i) {
this._admPanel = i;
var n = t.getChildByName("WaitingConnection");
n && n.setSiblingIndex(t.children.length - 1);
var a = t.getChildByName("alert");
a && a.setSiblingIndex(t.children.length - 1);
var o = e._admNode("mask");
if (o) {
var s = cc.view.getVisibleSize();
o.setContentSize(s.width, s.height);
o.setPosition(0, 0);
if (!o._admBound) {
o._admBound = !0;
o.on(cc.Node.EventType.TOUCH_START, function() {});
}
}
i.active = !0;
if (!i._admBound) {
i._admBound = !0;
var c = e._admNode("btnAddTable"), r = e._admNode("addTablePz"), l = e._admNode("btnBean"), h = e._admNode("btnAdmClose");
if (c) {
c.active = !0;
c.on(cc.Node.EventType.TOUCH_END, function() {
e._wfOpenAddTable();
});
}
if (r) {
r.active = !0;
r.on(cc.Node.EventType.TOUCH_END, function() {
e._wfOpenPull();
});
}
if (l) {
l.active = !0;
l.on(cc.Node.EventType.TOUCH_END, function() {
e._admOpenBean();
});
}
if (h) {
h.active = !0;
h.on(cc.Node.EventType.TOUCH_END, function() {
e._admClose();
});
}
var d = e._admNode("addTableWin");
this._admAddWin = d;
d && e._admBindOkCancel(d, function() {
e._wfSubmitAddTable();
}, function() {
e._wfCloseAddTable();
});
var u = e._admNode("admMemberWin");
this._admMemberWin = u;
u && e._admBindOkCancel(u, function() {
e._wfSubmitPull();
}, function() {
e._wfClosePull();
});
var v = e._admNode("admBeanWin");
this._admBeanWin = v;
if (v) {
var g = v.getChildByName("bg"), _ = g ? g.getChildByName("btnQuery") : null;
if (_) {
_.active = !0;
_.on(cc.Node.EventType.TOUCH_END, function() {
e._admQueryBean();
});
}
e._admBindOkCancel(v, function() {
e._admApplyBean();
}, function() {
e._wfCloseBean();
});
}
var f = e._admNode("btnGameCfg");
if (f) {
f.active = !0;
f.on(cc.Node.EventType.TOUCH_END, function() {
e._admOpenGameCfg();
});
}
var m = e._admNode("gameCfgWin");
this._admCfgWin = m;
m && e._admBindOkCancel(m, function() {
e._admCfgSave();
}, function() {
e._admCfgClose();
});
}
} else cc.vv.wc.showError("管理面板缺失");
},
_admClose: function() {
this._admPanel && cc.isValid(this._admPanel) && (this._admPanel.active = !1);
this._admHideWins();
},
_admHideWins: function() {
this._admAddWin && cc.isValid(this._admAddWin) && (this._admAddWin.active = !1);
this._admMemberWin && cc.isValid(this._admMemberWin) && (this._admMemberWin.active = !1);
this._admBeanWin && cc.isValid(this._admBeanWin) && (this._admBeanWin.active = !1);
this._admCfgWin && cc.isValid(this._admCfgWin) && (this._admCfgWin.active = !1);
},
_admCfgFields: function(e) {
var t = String(e || "");
return "baobao_shou" == t ? [ {
key: "banker_mode",
label: "有无庄(1有庄/0无庄)"
}, {
key: "arrange_timeout",
label: "摆牌超时(秒)"
}, {
key: "result_timeout",
label: "结算倒计时(秒)"
}, {
key: "wulong_check",
label: "乌龙校验(1开/0关)"
}, {
key: "tongdian_mode",
label: "同点比较(3/1/2)"
}, {
key: "s_bao_14",
label: "宝A 倍率"
}, {
key: "s_bao_13",
label: "宝K 倍率"
}, {
key: "s_bao_12",
label: "宝Q 倍率"
}, {
key: "s_bao_11",
label: "宝J 倍率"
}, {
key: "s_bao_10",
label: "宝10 倍率"
}, {
key: "s_bao_9",
label: "宝9 倍率"
}, {
key: "s_bao_8",
label: "宝8 倍率"
}, {
key: "s_bao_7",
label: "宝7 倍率"
}, {
key: "s_bao_6",
label: "宝6 倍率"
}, {
key: "s_bao_5",
label: "宝5 倍率"
}, {
key: "s_bao_4",
label: "宝4 倍率"
}, {
key: "s_bao_3",
label: "宝3 倍率"
}, {
key: "s_bao_2",
label: "宝2 倍率"
}, {
key: "s_dian9",
label: "9点 倍率"
}, {
key: "s_dian8",
label: "8点 倍率"
}, {
key: "s_dian7",
label: "7点 倍率"
}, {
key: "s_dianlow",
label: "6~0点 倍率"
} ] : "baobao_mian" == t ? [ {
key: "banker_mode",
label: "有无庄(1有庄/0无庄)"
}, {
key: "arrange_timeout",
label: "确认弹窗倒计时(秒)"
}, {
key: "result_timeout",
label: "结算倒计时(秒)"
}, {
key: "m_sf6",
label: "6同花顺 倍率"
}, {
key: "m_sf5",
label: "5同花顺带1 倍率"
}, {
key: "m_4",
label: "4条带2单 倍率"
}, {
key: "m_33",
label: "3条带3条 倍率"
}, {
key: "m_3p1",
label: "3条带对带1 倍率"
}, {
key: "m_f6",
label: "6同花 倍率"
}, {
key: "m_s6",
label: "6连顺 倍率"
}, {
key: "m_f5",
label: "5同花带1 倍率"
}, {
key: "m_s5",
label: "5连顺带1 倍率"
}, {
key: "m_p3",
label: "3对 倍率"
}, {
key: "m_n9",
label: "3组9 倍率"
}, {
key: "m_san",
label: "散牌 倍率"
} ] : "wujin" == t ? [ {
key: "ping_hu",
label: "平胡台数"
}, {
key: "zi_mo",
label: "自摸加台"
}, {
key: "men_qing",
label: "门清加台"
}, {
key: "peng_peng",
label: "碰碰胡台数"
}, {
key: "cou_yise",
label: "凑一色台数"
}, {
key: "qing_yise",
label: "清一色台数"
}, {
key: "qi_dui",
label: "七对台数"
}, {
key: "da_sanyuan",
label: "大三元台数"
}, {
key: "da_sixi",
label: "大四喜台数"
}, {
key: "ming_gang",
label: "明杠台数"
}, {
key: "an_gang",
label: "暗杠台数"
}, {
key: "gang_kai",
label: "杠上开花台数"
}, {
key: "qiang_gang",
label: "抢杠胡台数"
}, {
key: "hai_di",
label: "海底捞月台数"
}, {
key: "tian_hu",
label: "天胡台数"
}, {
key: "di_hu",
label: "地胡台数"
}, {
key: "can_chi",
label: "允许吃牌(0禁1允)"
}, {
key: "yi_pao_duo_xiang",
label: "一炮多响(0关1开)"
}, {
key: "dian_pao_bao",
label: "点炮包牌(0不包1包)"
}, {
key: "chupai_timeout",
label: "出牌超时(秒)"
} ] : 0 == t.indexOf("zp") ? [ {
key: "hua_tai",
label: "每朵花台数"
}, {
key: "jin_tai",
label: "每张金牌台数"
}, {
key: "ming_gang",
label: "明杠台数"
}, {
key: "an_gang",
label: "暗杠台数"
}, {
key: "san_jin_dao",
label: "三金倒台数"
}, {
key: "qiang_jin",
label: "抢金台数"
}, {
key: "qi_dui",
label: "七对台数"
}, {
key: "hun_yise",
label: "混一色台数"
}, {
key: "qing_yise",
label: "清一色台数"
}, {
key: "gang_kai",
label: "杠上开花台数"
}, {
key: "qiang_gang",
label: "抢杠胡台数"
}, {
key: "ping_hu",
label: "平胡台数"
}, {
key: "you_jin_multi",
label: "游金每级倍数"
}, {
key: "you_jin_max",
label: "游金最高级数"
}, {
key: "fenbing",
label: "分饼开关(0关1开)"
}, {
key: "chupai_timeout",
label: "出牌超时(秒)"
} ] : [ {
key: "min_tai",
label: "起胡台数门槛"
}, {
key: "dong_ke",
label: "东风刻(每个)"
}, {
key: "zfb_ke",
label: "中发白刻(每个)"
}, {
key: "ping_hu",
label: "平胡"
}, {
key: "duidui_hu",
label: "对对胡"
}, {
key: "hun_yise",
label: "混一色"
}, {
key: "qing_yise",
label: "清一色"
}, {
key: "gang_kai",
label: "杠上开花"
}, {
key: "qiang_gang",
label: "抢杠胡"
}, {
key: "wu_cai",
label: "无财"
}, {
key: "chupai_timeout",
label: "出牌倒计时(秒,0关托管)"
} ];
},
_admOpenGameCfg: function() {
var e = this, t = this._admCfgWin;
if (t) {
var i = t.getChildByName("bg");
if (i) {
var n = this._clubCur;
if (n) {
cc.vv.wc.show("正在读取配置");
cc.vv.http.sendRequest("/club_game_configs", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: n.id
}, function(n) {
cc.vv.wc.hide();
if (n && 0 === n.errcode) {
e._admCfgList = n.list || [];
if (e._admCfgList.length) {
for (var a = null, o = 0; o < e._admCfgList.length; ++o) if (e._admCfgSel && e._admCfgList[o].game_type == e._admCfgSel.game_type) {
a = e._admCfgList[o];
break;
}
e._admCfgSel = a || e._admCfgList[0];
e._admCfgBuildDrop(i);
e._admCfgFill(i);
e._admStretchWin(t);
t.active = !0;
} else cc.vv.wc.showAlert("该俱乐部暂无玩法", "提示");
} else cc.vv.wc.showAlert(n && n.errmsg ? n.errmsg : "读取配置失败", "提示");
});
} else cc.vv.wc.showAlert("请先进入俱乐部详情再配置玩法", "提示");
}
} else cc.vv.wc.showAlert("玩法配置弹窗节点缺失,请检查club场景admin下的gameCfgWin", "提示");
},
_admCfgBuildDrop: function(e) {
var t = this, i = e.getChildByName("cfgDrop"), n = e.getChildByName("cfgDropList");
if (n) {
n.active = !1;
for (var a = n.children.slice(), o = 0; o < a.length; ++o) (function(i) {
var n = a[i];
n.off(cc.Node.EventType.TOUCH_END);
var o = t._admCfgList[i];
if (i < t._admCfgList.length) {
n.active = !0;
var s = n.getChildByName("lbl");
s && s.getComponent(cc.Label) && (s.getComponent(cc.Label).string = o.name || o.game_type);
n.on(cc.Node.EventType.TOUCH_END, function() {
t._admCfgSel = o;
t._admCfgFill(e);
var i = e.getChildByName("cfgDropList");
i && (i.active = !1);
});
} else n.active = !1;
})(o);
}
if (i && !i._cfgBound) {
i._cfgBound = !0;
i.on(cc.Node.EventType.TOUCH_END, function() {
var t = e.getChildByName("cfgDropList");
t && (t.active = !t.active);
});
}
},
_admCfgFill: function(e) {
var t = this._admCfgSel;
if (e && t) {
var i = e.getChildByName("cfgDrop"), n = i ? i.getChildByName("dl") : null;
n && n.getComponent(cc.Label) && (n.getComponent(cc.Label).string = t.name || t.game_type || "");
var a = e.getChildByName("tip");
a && a.getComponent(cc.Label) && (a.getComponent(cc.Label).string = "baobao_shou" == String(t.game_type) ? "台数规则留空按默认;同点比较 3=点数优先 1=花色优先 2=和" : "台数规则留空按默认值");
for (var o = e.getChildByName("rows"), s = this._admCfgFields(t.game_type), c = t.tai_rules || {}, r = t.default_tai_rules || {}, l = s.length > 16 ? 3 : s.length > 8 ? 2 : 1, h = 3 === l ? [ -330, 0, 330 ] : 2 === l ? [ -170, 170 ] : [ 0 ], d = Math.ceil(s.length / l), u = o ? o.children.length : 0, v = 0; v < u; ++v) {
var g = o.children[v];
if (g) if (v < s.length) {
g.active = !0;
g._cfgKey = s[v].key;
g.setPosition(h[Math.floor(v / d)], 62 - v % d * 32);
var _ = g.getChildByName("name");
_ && _.getComponent(cc.Label) && (_.getComponent(cc.Label).string = s[v].label);
var f = g.getChildByName("e") ? g.getChildByName("e").getComponent(cc.EditBox) : null;
if (f) {
var m = c[s[v].key];
f.string = null != m ? String(m) : "";
var p = g.getChildByName("e").getChildByName("PLACEHOLDER_LABEL"), b = p ? p.getComponent(cc.Label) : null;
if (b) {
var C = r[s[v].key];
b.string = null != C ? String(C) : "默认";
}
}
} else {
g.active = !1;
g._cfgKey = null;
}
}
}
},
_admCfgClose: function() {
this._admCfgWin && cc.isValid(this._admCfgWin) && (this._admCfgWin.active = !1);
},
_admCfgSave: function() {
var e = this, t = this._admCfgSel, i = this._admCfgWin;
if (t && i) {
var n = i.getChildByName("bg");
if (n) {
for (var a = {}, o = n.getChildByName("rows"), s = o ? o.children.length : 0, c = 0; c < s; ++c) {
var r = o.children[c];
if (r && r.active && r._cfgKey) {
var l = r.getChildByName("e") ? r.getChildByName("e").getComponent(cc.EditBox) : null, h = l ? String(l.string || "").replace(/[^0-9]/g, "") : "";
"" !== h && (a[r._cfgKey] = parseInt(h, 10));
}
}
cc.vv.wc.show("正在保存");
cc.vv.http.sendRequest("/club_game_config_save", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: this._clubCur.id,
game_type: t.game_type,
tai_rules: JSON.stringify(a)
}, function(i) {
cc.vv.wc.hide();
if (i && 0 === i.errcode) {
t.tai_rules = Object.keys(a).length > 0 ? a : null;
for (var n = e._clubGames || [], o = 0; o < n.length; ++o) if (n[o].game_type == t.game_type) {
n[o].tai_rules = t.tai_rules;
break;
}
cc.vv.wc.showAlert("配置已保存", "提示");
} else cc.vv.wc.showAlert(i && i.errmsg ? i.errmsg : "保存失败", "提示");
});
}
}
},
_wfOpenAddTable: function() {
var e = this._admPanel, t = e ? e.getChildByName("addTableWin") : null, i = t ? t.getChildByName("bg") : null;
if (t && i) {
var n = this._clubGames || [];
if (n.length) {
this._admAddWin = t;
this._admGame || (this._admGame = n[0]);
this._admBuildDrop(i, n);
this._wfFillAddTable(i, this._admGame);
this._admStretchWin(t);
t.active = !0;
} else cc.vv.wc.showAlert("该俱乐部暂无玩法，请先在后台添加玩法", "提示");
}
},
_admStretchWin: function(e) {
var t = e ? e.getChildByName("New Layout") : null;
if (t) {
var i = t.getComponent(cc.Widget);
i && (i.enabled = !1);
var n = cc.view.getVisibleSize();
t.setContentSize(n.width, n.height);
t.setPosition(0, 0);
}
},
_admBuildDrop: function(e, t) {
var i = this, n = e.getChildByName("admDrop"), a = n ? n.getChildByName("dl") : null, o = this._admGame && (this._admGame.name || this._admGame.game_type) || "";
a && a.getComponent(cc.Label) && (a.getComponent(cc.Label).string = o);
var s = e.getChildByName("admDropList");
if (s) {
s.active = !1;
for (var c = s.children, r = 0; r < c.length; ++r) (function(n) {
var a = c[n];
a.off(cc.Node.EventType.TOUCH_END);
if (n < t.length) {
a.active = !0;
var o = a.getComponent(cc.Label);
o && (o.string = t[n].name || t[n].game_type || "");
a.on(cc.Node.EventType.TOUCH_END, function() {
i._admGame = t[n];
var a = e.getChildByName("admDrop"), o = a ? a.getChildByName("dl") : null;
o && o.getComponent(cc.Label) && (o.getComponent(cc.Label).string = t[n].name || t[n].game_type || "");
i._wfFillAddTable(e, t[n]);
var s = e.getChildByName("admDropList");
s && (s.active = !1);
});
} else a.active = !1;
})(r);
}
if (n && !n._admBound) {
n._admBound = !0;
n.on(cc.Node.EventType.TOUCH_END, function() {
var t = e.getChildByName("admDropList");
t && (t.active = !t.active);
});
}
},
_wfFillAddTable: function(e, t) {
if (e && t) {
var i = function(t, i) {
var n = e.getChildByName(t), a = n ? n.getComponent(cc.EditBox) : null;
a && (a.string = String(i));
}, n = e.getChildByName("title");
n && n.getComponent(cc.Label) && (n.getComponent(cc.Label).string = "添加" + (t.name || t.game_type || "") + "牌桌");
i("difenInput", "");
i("jushuInput", "");
i("minInput", 0);
i("kickInput", 0);
}
},
_wfCloseAddTable: function() {
this._admAddWin && cc.isValid(this._admAddWin) && (this._admAddWin.active = !1);
},
_wfSubmitAddTable: function() {
var e = this, t = this._admGame;
if (t && this._admAddWin) {
var i = this._admAddWin.getChildByName("bg");
if (i) {
var n = function(e) {
var t = i.getChildByName(e), n = t ? t.getComponent(cc.EditBox) : null;
return n ? String(n.string).replace(/[^0-9]/g, "") : "";
}, a = parseInt(n("difenInput"));
if (a > 0) {
var o = parseInt(n("jushuInput"));
if (o > 0) {
var s = parseInt(n("minInput")), c = parseInt(n("kickInput"));
s >= 0 || (s = 0);
c >= 0 || (c = 0);
cc.vv.wc.show("正在添加牌桌");
cc.vv.http.sendRequest("/club_add_table", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: this._clubCur.id,
game_type: t.game_type,
difen_value: a,
jushuxuanze: 0,
jushu_value: o,
banker_mode: 0,
min_bean: s,
kick_bean: c
}, function(t) {
cc.vv.wc.hide();
if (t && 0 === t.errcode) {
e._wfCloseAddTable();
e._clubTablesSig = null;
e._clubLoadTables();
} else {
var i = t && t.errmsg ? t.errmsg : "添加牌桌失败";
t && 4 === t.errcode && (i = "只有俱乐部创建者可以添加牌桌");
t && 5 === t.errcode && (i = "该玩法未加入俱乐部，请先在后台添加该玩法");
cc.vv.wc.showAlert(i, "提示");
}
});
} else cc.vv.wc.showAlert("请输入正确的局数", "提示");
} else cc.vv.wc.showAlert("请输入正确的底分", "提示");
}
}
},
_wfQuickJoin: function() {
for (var e = this._clubTableList || [], t = null, i = -1, n = 0; n < e.length; ++n) {
var a = e[n], o = this._clubMaxPlayers(a), s = Number(a.player_count) || 0, c = a.roomid && this._clubTableCardMap ? this._clubTableCardMap["r_" + a.roomid] : null;
if (c && c.slots) {
for (var r = 0, l = 0; l < c.slots.length; ++l) c.slots[l] && c.slots[l]._uid > 0 && ++r;
r > s && (s = r);
}
if (!(s >= o) && s > i) {
i = s;
t = a;
}
}
t ? this._clubEnterTable(t) : cc.vv.wc.showError("当前没有可加入的牌桌");
},
_wfOpenPull: function() {
var e = this._admMemberWin;
if (e) {
var t = e.getChildByName("bg"), i = t ? t.getChildByName("difenInput") : null, n = i ? i.getComponent(cc.EditBox) : null;
n && (n.string = "");
this._admStretchWin(e);
e.active = !0;
}
},
_wfClosePull: function() {
this._admMemberWin && cc.isValid(this._admMemberWin) && (this._admMemberWin.active = !1);
},
_wfSubmitPull: function() {
var e = this, t = this._admMemberWin;
if (t) {
var i = t.getChildByName("bg"), n = i ? i.getChildByName("difenInput") : null, a = n ? n.getComponent(cc.EditBox) : null, o = a ? parseInt(String(a.string).replace(/[^0-9]/g, "")) : NaN;
if (o > 0) {
cc.vv.wc.show("正在添加");
cc.vv.http.sendRequest("/club_pull", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: this._clubCur.id,
userid: o
}, function(t) {
cc.vv.wc.hide();
if (t && 0 === t.errcode) {
e._wfClosePull();
cc.vv.wc.showAlert("添加成功", "提示");
} else {
var i = t && t.errmsg ? t.errmsg : "添加失败";
t && 5 === t.errcode && (i = "该玩家ID不存在，请确认后重试");
t && 6 === t.errcode && (i = "该玩家已加入俱乐部");
cc.vv.wc.showAlert(i, "提示");
}
});
} else cc.vv.wc.showAlert("请输入正确的玩家ID", "提示");
}
},
_admBindOkCancel: function(e, t, i) {
var n = e ? e.getChildByName("bg") : null;
if (n) {
var a = n.getChildByName("btnOk");
a && a.on(cc.Node.EventType.TOUCH_END, t);
var o = n.getChildByName("btnCancel");
o && o.on(cc.Node.EventType.TOUCH_END, i);
}
},
_admOpenBean: function() {
var e = this._admBeanWin;
if (e) {
var t = e.getChildByName("bg");
this._admBeanUid = 0;
this._admBeanGems = 0;
if (t) {
var i = t.getChildByName("difenInput");
i && i.getComponent(cc.EditBox) && (i.getComponent(cc.EditBox).string = "");
var n = t.getChildByName("deltaInput");
n && n.getComponent(cc.EditBox) && (n.getComponent(cc.EditBox).string = "");
var a = t.getChildByName("info");
a && a.getComponent(cc.Label) && (a.getComponent(cc.Label).string = "");
}
this._admStretchWin(e);
e.active = !0;
}
},
_wfCloseBean: function() {
this._admBeanWin && cc.isValid(this._admBeanWin) && (this._admBeanWin.active = !1);
},
_admQueryBean: function() {
var e = this, t = this._admBeanWin;
if (t) {
var i = t.getChildByName("bg"), n = i ? i.getChildByName("difenInput") : null, a = n ? n.getComponent(cc.EditBox) : null, o = a ? parseInt(String(a.string).replace(/[^0-9]/g, "")) : NaN;
if (o > 0) {
cc.vv.wc.show("正在查询");
cc.vv.http.sendRequest("/club_member_info", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: this._clubCur.id,
userid: o
}, function(t) {
cc.vv.wc.hide();
if (t && 0 === t.errcode) {
e._admBeanUid = Number(t.userid) || o;
e._admBeanGems = Number(t.gems) || 0;
var n = i.getChildByName("info"), a = n ? n.getComponent(cc.Label) : null;
a && (a.string = "昵称：" + (t.name || "-") + "\n宝宝豆：" + e._admBeanGems);
} else {
var s = t && t.errmsg ? t.errmsg : "查询失败";
t && 4 === t.errcode && (s = "仅俱乐部创建者可操作");
t && 5 === t.errcode && (s = "该玩家ID不存在，请确认后重试");
cc.vv.wc.showAlert(s, "提示");
}
});
} else cc.vv.wc.showAlert("请输入正确的玩家ID", "提示");
}
},
_admApplyBean: function() {
var e = this, t = this._admBeanWin;
if (t) if (this._admBeanUid > 0) {
var i = t.getChildByName("bg"), n = i ? i.getChildByName("deltaInput") : null, a = n ? n.getComponent(cc.EditBox) : null, o = parseInt(a ? String(a.string).replace(/[^0-9\-]/g, "") : "");
if (o) {
cc.vv.wc.show("正在修改");
cc.vv.http.sendRequest("/club_member_gems", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: this._clubCur.id,
userid: this._admBeanUid,
gems: o
}, function(t) {
cc.vv.wc.hide();
if (t && 0 === t.errcode) {
e._admBeanGems = Number(t.gems) || 0;
cc.vv.userMgr && cc.vv.userMgr.userId == e._admBeanUid && (cc.vv.userMgr.gems = e._admBeanGems);
e._wfCloseBean();
cc.vv.wc.showAlert("修改成功", "提示");
} else {
var i = t && t.errmsg ? t.errmsg : "修改宝宝豆失败";
t && 4 === t.errcode && (i = "仅俱乐部创建者可操作");
t && 5 === t.errcode && (i = "该玩家ID不存在，请确认后重试");
cc.vv.wc.showAlert(i, "提示");
}
});
} else cc.vv.wc.showAlert("请输入要增减的宝宝豆数量", "提示");
} else cc.vv.wc.showAlert("请先查询玩家ID", "提示");
},
_clubOpenDetail: function(e) {
var t = this;
this._clubCur = e;
this._clubCurGame = null;
this._clubState = "detail";
this._clubTablesSig = null;
this._clubSetTop(!0, e.name);
cc.vv.http.sendRequest("/club_games", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: e.id
}, function(e) {
if (0 === e.errcode) {
t._clubGames = e.games || [];
t._clubRenderDetail();
} else cc.vv.wc.showError(e.errmsg || "获取玩法失败");
});
},
_clubRenderDetail: function() {
var e = this;
this._clubClearList();
var t = this._clubListArea, i = (t.height, cc.view.getVisibleSize(), this._clubPanel.getChildByName("detailBgImg"));
this._clubDetailBgNode = i;
var n = this._clubPanel.getChildByName("detailFullBg");
this._clubDetailFullBg = n;
n.getComponent(cc.Graphics).clear();
this._clubCloseBtn && (this._clubCloseBtn.active = !1);
var a = this._clubFind(t, "btnBack");
if (a) {
a._clubW = a.width;
a._clubH = a.height;
if (!a._clubBound) {
a._clubBound = !0;
a.on(cc.Node.EventType.TOUCH_END, function() {
e._wfBack();
});
}
this._clubBackBtn = a;
}
var o = this._clubFind(t, "clubName");
if (o) {
var s = o.getComponent(cc.Label), c = this._clubCur || {}, r = c.name || c.club_name || c.clubName || "";
s && r && (s.string = r);
o.active = !0;
o.color = new cc.Color(0, 0, 0, 255);
if (a && o.parent) {
var l = a.convertToWorldSpaceAR(cc.v2((1 - a.anchorX) * a.width, 0)), h = o.parent.convertToNodeSpaceAR(l);
o.x = h.x + 30 + o.anchorX * o.width;
}
}
var d = this._clubFind(t, "clubGems");
this._clubGemsNode = d;
var u = function(e) {
if (cc.isValid(d)) {
var t = d.getComponent(cc.Label);
t && (t.string = String(null == e ? 0 : e));
}
};
d && u(cc.vv.userMgr.gems);
cc.vv.http.sendRequest("/get_user_status", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(t) {
if (t && null != t.gems) {
cc.vv.userMgr.gems = Number(t.gems);
e._gemsCache = {
gems: cc.vv.userMgr.gems,
at: Date.now()
};
u(cc.vv.userMgr.gems);
}
});
if (d && d.parent) {
var v = d.parent.getChildByName("safeBtn") || this._clubFind(t, "safeBtn");
if (v) {
v.off(cc.Node.EventType.TOUCH_END);
v.on(cc.Node.EventType.TOUCH_END, function() {
e._openSafeWin();
});
}
}
var g = this._clubFind(t, "games");
if (g) {
var _ = g.getChildByName("gameRowTpl"), f = g.getChildByName("emptyTip"), m = g.getChildByName("samptext");
g.removeAllChildren();
m && g.addChild(m);
if (_) {
g.addChild(_);
_.active = !1;
}
f && g.addChild(f);
this._clubGameRows = [];
var p = this._clubGames || [], b = _ ? _.height : 68, C = b + 5, y = g.height / 2 - b / 2 - 130, N = g.getChildByName("emptyTip");
N && (N.active = 0 == p.length);
p.forEach(function(t, i) {
var n = _ ? cc.instantiate(_) : new cc.Node("row" + i);
n.active = !0;
n._gm = t;
n.setPosition(0, y - i * C);
g.addChild(n);
var a = n.getChildByName("l");
if (a) {
a.setContentSize(n.width, n.height);
a.setPosition(0, 0);
var o = a.getComponent(cc.Label);
if (o) {
o.string = t.name || "";
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
o.overflow = cc.Label.Overflow.SHRINK;
}
}
var s = n.getChildByName("bgimg");
if (s) {
var c = s.getComponent(cc.Sprite);
n._iconSp = c;
n._iconNormal = c ? c.spriteFrame : null;
n._iconSel = null;
cc.resources.load("images/club/game_btn_normal", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(s)) {
n._iconNormal = t;
n._selected || (c.spriteFrame = t);
}
});
cc.resources.load("images/club/game_btn_pressed", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(s)) {
n._iconSel = t;
n._selected && (c.spriteFrame = t);
}
});
}
n.on(cc.Node.EventType.TOUCH_END, function() {
e._clubScrollMoved ? e._clubScrollMoved = !1 : e._clubSelectGame(t, n);
});
e._clubGameRows.push(n);
});
var S = this._clubFind(t, "tablesView") || this._clubFind(cc.find("Canvas"), "tablesView");
if (S) {
this._clubTablesNode = S.getChildByName("tables");
if (this._clubTablesNode) {
var B = this._clubFind(this._clubTablesNode, "sampleCard0");
B && (this._clubTpl = B);
this._clubTablesNode.removeAllChildren();
if (!S._clubBound) {
S._clubBound = !0;
var w = 0, M = 0;
S.on(cc.Node.EventType.TOUCH_START, function(t) {
w = t.getLocation().x;
M = e._clubTablesNode ? e._clubTablesNode.x : 0;
e._clubTablesScrollMoved = !1;
});
S.on(cc.Node.EventType.TOUCH_MOVE, function(t) {
if (e._clubTablesNode) {
var i = S.width, n = e._clubTablesNode.width;
if (!(n <= i)) {
var a = t.getLocation().x - w;
Math.abs(a) > 6 && (e._clubTablesScrollMoved = !0);
var o = e._clubTablesRestX || 0, s = (n - i) / 2;
e._clubTablesNode.x = Math.max(o - s, Math.min(o + s, M + a));
}
}
});
S.on(cc.Node.EventType.TOUCH_CANCEL, function() {
e._clubTablesScrollMoved = !1;
});
}
null == this._clubTablesRestY && (this._clubTablesRestY = this._clubTablesNode.y);
null == this._clubTablesRestX && (this._clubTablesRestX = this._clubTablesNode.x);
if (!this._clubCurGame && p.length > 0) {
var T = cc.vv.lastGameType, x = null;
if (T) for (var R = 0; R < p.length; ++R) if ((p[R].game_type || p[R].type) == T) {
x = p[R];
break;
}
this._clubCurGame = x || p[0];
}
for (var I = 0; I < this._clubGameRows.length; ++I) this._clubPaintRow(this._clubGameRows[I], p[I] === this._clubCurGame);
this._clubCurGame ? this._clubLoadTables() : this._clubAddRow(this._clubTablesNode, 0, "← 请先选择左侧玩法", "", null, 520);
}
}
}
},
_clubSelectGame: function(e, t) {
this._clubCurGame = e;
for (var i = 0; i < this._clubGameRows.length; ++i) this._clubPaintRow(this._clubGameRows[i], this._clubGameRows[i] === t);
this._clubLoadTables();
},
_clubCardTpl: function() {
if (this._clubTpl && cc.isValid(this._clubTpl)) return this._clubTpl;
var e = cc.find("Canvas"), t = e ? this._clubFind(e, "sampleCard0") : null;
t && (this._clubTpl = t);
return t || null;
},
_clubMaxPlayers: function(e) {
if (e) {
var t = e.max_players || e.maxPlayers;
if (t) return (t = parseInt(t)) > 6 ? 6 : t;
}
var i = this._clubCurGame && this._clubCurGame.game_type ? this._clubCurGame.game_type : "";
return 0 === i.indexOf("baobao") ? 6 : 0 === i.indexOf("zj4") || 0 === i.indexOf("zp4") || "wujin" == i ? 4 : 2;
},
_clubAddTableCard: function(e, t, i) {
var n = this, a = this._clubCardTpl();
if (a) {
var o = a.width, s = a.height, c = this._clubTableCols || t + 1, r = t % c, l = Math.floor(t / c), h = -e.width / 2 + 10 + o / 2 + r * (o + 8), d = -10 - s / 2 - l * (s + 8), u = cc.instantiate(a);
u.active = !0;
u.setPosition(h, d);
e.addChild(u);
for (var v = [ "下左", "左", "上左", "上右", "右", "下右" ], g = {
2: [ 0, 3 ],
3: [ 0, 1, 4 ],
4: [ 0, 1, 3, 4 ],
5: [ 0, 1, 2, 3, 4 ],
6: [ 0, 1, 2, 3, 4, 5 ]
}[this._clubMaxPlayers(i)] || [ 0, 1, 2, 3, 4, 5 ], _ = [ 0, 0, 0, 0, 0, 0 ], f = 0; f < g.length; f++) {
var m = Number(i["user_id" + f]) || 0;
m > 0 && g[f] < _.length && (_[g[f]] = m);
}
for (var p = [ null, null, null, null, null, null ], b = 0; b < 6; b++) {
var C = u.getChildByName("seat" + b);
if (C) if (g.indexOf(b) < 0) C.active = !1; else {
C._side = v[b];
p[b] = C;
this._clubSetSeat(C, _[b] || 0);
}
}
this._clubTableCardMap || (this._clubTableCardMap = {});
var y = {
card: u,
slots: p,
uids: _,
map: g
};
this._clubTableCardMap[i.id] = y;
i.roomid && (this._clubTableCardMap["r_" + i.roomid] = y);
var N = u.getChildByName("n");
if (N) {
var S = N.getComponent(cc.Label);
S && (S.string = (i.name || "") + "号桌");
}
var B = {};
try {
B = JSON.parse(i.conf) || {};
} catch (e) {}
var w = this._clubCurGame || {}, M = w.difen_options || [], T = w.jushu_options || [], x = null != B.difen_value ? B.difen_value : "number" == typeof B.difen && null != M[B.difen] ? M[B.difen] : B.difen, R = null != B.jushu_value ? B.jushu_value : "number" == typeof B.jushuxuanze && null != T[B.jushuxuanze] ? T[B.jushuxuanze] : B.jushuxuanze, I = null == B.banker_mode || Number(B.banker_mode) ? "有庄" : "无庄", k = Number(B.min_bean) || 0, A = u.getChildByName("c");
if (A) {
var L = A.getComponent(cc.Label);
if (L) {
if (L.overflow === cc.Label.Overflow.NONE) {
L.overflow = cc.Label.Overflow.CLAMP;
L.enableWrapText = !0;
}
L.string = "底分" + (null != x ? x : "-") + "  " + I + "  最低豆" + k + "  " + (null != R ? R : "-") + "局";
}
}
var P = u.getChildByName("btnClear");
if (P) {
P.active = !!i.can_clear;
if (i.can_clear) {
P.off(cc.Node.EventType.TOUCH_END);
P.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
n._clubTablesScrollMoved ? n._clubTablesScrollMoved = !1 : n._clubClearTable(i);
});
}
}
var F = this._clubFind(u, "btnDel");
if (F) {
var E = !(!this._clubCur || !cc.vv.userMgr || String(this._clubCur.owner_userid) !== String(cc.vv.userMgr.userId));
F.active = E;
F.off(cc.Node.EventType.TOUCH_END);
E && F.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
n._clubTablesScrollMoved ? n._clubTablesScrollMoved = !1 : n._clubDelTable(i);
});
}
u.on(cc.Node.EventType.TOUCH_END, function() {
n._clubTablesScrollMoved ? n._clubTablesScrollMoved = !1 : n._clubEnterTable(i);
});
return u;
}
console.log("[俱乐部]场景缺少sampleCard0模板,无法建牌桌卡片");
},
_clubShowConfirm: function(e, t, i) {
var n = cc.find("Canvas/alert");
if (n) {
var a = this;
if (!this._clubAlertBound) {
this._clubAlertBound = !0;
var o = n.getChildByName("btn_ok"), s = n.getChildByName("btn_cancel");
o && o.on(cc.Node.EventType.TOUCH_END, function() {
n.active = !1;
var e = a._clubAlertOk;
a._clubAlertOk = null;
e && e();
});
s && s.on(cc.Node.EventType.TOUCH_END, function() {
n.active = !1;
a._clubAlertOk = null;
});
}
var c = cc.find("Canvas/alert/title"), r = cc.find("Canvas/alert/content");
c && (c = c.getComponent(cc.Label)) && (c.string = e);
r && (r = r.getComponent(cc.Label)) && (r.string = t);
this._clubAlertOk = i;
n.active = !0;
} else i && i();
},
_openSafeWin: function() {
var e = this, t = this._safeWin;
if (!t || !cc.isValid(t)) {
var i = cc.find("Canvas");
t = i ? i.getChildByName("safeWin") : null;
}
if (t) {
this._safeWin = t;
t.active = !0;
var n = t.getChildByName("panel") || t, a = n.getChildByName("gemsLb"), o = n.getChildByName("safeLb");
this._safeGemsLb = a ? a.getComponent(cc.Label) : null;
this._safeSafeLb = o ? o.getComponent(cc.Label) : null;
var s = n.getChildByName("amount");
this._safeAmountEb = s ? s.getComponent(cc.EditBox) : null;
this._safeAmountEb && (this._safeAmountEb.string = "");
if (!this._safeBound) {
this._safeBound = !0;
var c = function(e, t) {
if (e) {
e.off(cc.Node.EventType.TOUCH_END);
e.on(cc.Node.EventType.TOUCH_END, t);
}
};
c(n.getChildByName("depBtn"), function() {
var t = e._safeAmountEb ? parseInt(e._safeAmountEb.string) : NaN;
!isFinite(t) || t <= 0 ? cc.vv.wc.showError("请输入有效金额") : e._safeDoTransfer(t);
});
c(n.getChildByName("wdBtn"), function() {
var t = e._safeAmountEb ? parseInt(e._safeAmountEb.string) : NaN;
!isFinite(t) || t <= 0 ? cc.vv.wc.showError("请输入有效金额") : e._safeDoTransfer(-t);
});
c(n.getChildByName("closeBtn"), function() {
e._hideSafeWin();
});
}
this._safeRefreshInfo();
} else console.warn("[club] 场景缺少 Canvas/safeWin, 保险柜弹窗无法打开");
},
_hideSafeWin: function() {
this._safeWin && cc.isValid(this._safeWin) && (this._safeWin.active = !1);
},
_safeRefreshInfo: function() {
var e = this;
cc.vv.http.sendRequest("/safe_info", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(t) {
if (t && 0 === t.errcode) {
cc.vv.userMgr.gems = Number(t.gems) || 0;
cc.vv.userMgr.safe_beans = Number(t.safe_beans) || 0;
e._safeGemsLb && (e._safeGemsLb.string = "宝宝豆: " + cc.vv.userMgr.gems);
e._safeSafeLb && (e._safeSafeLb.string = "保险柜: " + cc.vv.userMgr.safe_beans);
var i = e._clubGemsNode;
if (cc.isValid(i)) {
var n = i.getComponent(cc.Label);
n && (n.string = String(cc.vv.userMgr.gems));
}
e._gemsCache = {
gems: cc.vv.userMgr.gems,
at: Date.now()
};
}
}, cc.vv.http.master_url);
},
_safeDoTransfer: function(e) {
var t = this;
cc.vv.wc.show("正在处理...");
cc.vv.http.sendRequest("/safe_transfer", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
amount: e
}, function(e) {
cc.vv.wc.hide();
if (e && 0 === e.errcode) {
cc.vv.userMgr.gems = Number(e.gems) || 0;
cc.vv.userMgr.safe_beans = Number(e.safe_beans) || 0;
t._safeGemsLb && (t._safeGemsLb.string = "宝宝豆: " + cc.vv.userMgr.gems);
t._safeSafeLb && (t._safeSafeLb.string = "保险柜: " + cc.vv.userMgr.safe_beans);
var i = t._clubGemsNode;
if (cc.isValid(i)) {
var n = i.getComponent(cc.Label);
n && (n.string = String(cc.vv.userMgr.gems));
}
t._gemsCache = {
gems: cc.vv.userMgr.gems,
at: Date.now()
};
t._safeAmountEb && (t._safeAmountEb.string = "");
} else cc.vv.wc.showError(e && e.errmsg ? e.errmsg : "操作失败");
}, cc.vv.http.master_url);
},
_clubClearTable: function(e) {
var t = this;
this._clubShowConfirm("清空牌桌", "确定清空「" + (e.name || "") + "号桌」?将解散房间并踢出所有玩家", function() {
cc.vv.wc.show("正在清空牌桌");
cc.vv.http.sendRequest("/club_clear_table", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
tableid: e.id
}, function(e) {
cc.vv.wc.hide();
if (0 === e.errcode) {
t._clubTablesSig = null;
t._clubLoadTables();
} else cc.vv.wc.showError(e.errmsg || "清空失败");
});
});
},
_clubDelTable: function(e) {
var t = this;
this._clubShowConfirm("删除牌桌", "确定删除「" + (e.name || "") + "号桌」?删除后不可恢复", function() {
cc.vv.wc.show("正在删除牌桌");
cc.vv.http.sendRequest("/club_del_table", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: t._clubCur.id,
tableid: e.id
}, function(e) {
cc.vv.wc.hide();
if (e && 0 === e.errcode) {
cc.vv.wc.showError("删除成功");
t._clubTablesSig = null;
t._clubLoadTables();
} else {
var i = e && e.errmsg ? e.errmsg : "删除牌桌失败";
e && 4 === e.errcode ? i = "只有俱乐部创建者可以删除牌桌" : e && 6 === e.errcode && (i = "牌桌正在使用中,无法删除");
cc.vv.wc.showError(i);
}
});
});
},
_clubApplyFrame: function(e, t) {
if (e && cc.isValid(e)) {
var i = e.getComponent(cc.Sprite);
i || (i = e.addComponent(cc.Sprite));
i.sizeMode = cc.Sprite.SizeMode.CUSTOM;
0 !== t.indexOf("bbt_") ? 0 !== t.indexOf("club_female") ? this._loadAtlasFrame("images/atlas/club_ui", t + ".png", function(t) {
if (t && cc.isValid(e)) {
var i = e.getComponent(cc.Sprite);
if (i) {
i.sizeMode = cc.Sprite.SizeMode.CUSTOM;
i.spriteFrame = t;
}
}
}) : cc.resources.load("images/club/" + t, cc.SpriteFrame, function(t, i) {
if (!t && i && cc.isValid(e)) {
var n = e.getComponent(cc.Sprite);
if (n) {
n.sizeMode = cc.Sprite.SizeMode.CUSTOM;
n.spriteFrame = i;
}
}
}) : this._loadAtlasFrame("images/bbtable/clud_pz", t.substring(4) + ".png", function(t) {
if (t && cc.isValid(e)) {
var i = e.getComponent(cc.Sprite);
if (i) {
i.sizeMode = cc.Sprite.SizeMode.CUSTOM;
i.spriteFrame = t;
}
}
});
}
},
_clubSetSeat: function(e, t) {
if (e && cc.isValid(e)) {
t = t || 0;
if (e._uid !== t) {
e._uid = t;
var i = e.getChildByName("chara"), n = e.getChildByName("charaF"), a = e.getChildByName("head");
if (i || n) if (t <= 0) {
i && (i.active = !1);
n && (n.active = !1);
a && (a.active = !1);
} else {
var o = this, s = function(s) {
var c = s && 2 === Number(s.sex), r = e._side || "下左", l = c && n ? n : i;
if (l && cc.isValid(l)) {
i && (i.active = !(c && n));
n && (n.active = !!c);
o._clubApplyFrame(l, "bbt_" + (c ? "女" : "男") + r);
if (a && cc.isValid(a)) {
a.active = !0;
var h = a.getChildByName("img");
if (h) {
var d = h.getComponent(cc.Sprite), u = h.getComponent("ImageLoader");
u && (u._spriteFrame = null);
d && (o._clubHeadFrame ? d.spriteFrame = o._clubHeadFrame : cc.resources.load("images/other/head", cc.SpriteFrame, function(e, t) {
if (!e && t) {
o._clubHeadFrame = t;
!cc.isValid(d) || u && u._spriteFrame || (d.spriteFrame = t);
}
}));
u && u.setUserID(t);
}
}
}
};
cc.vv.baseInfoMap && null != cc.vv.baseInfoMap[t] && null != cc.vv.baseInfoMap[t].sex ? s(cc.vv.baseInfoMap[t]) : cc.vv.http.sendRequest("/base_info", {
userid: t
}, function(e) {
if (e && !e.errcode) {
var i = e.headimgurl || null, n = i && /^avatar_\d{1,3}$/.test(i), a = {
name: e.name || "",
sex: e.sex,
localKey: n ? i : null,
url: i && !n ? i + ".jpg" : null
};
null == cc.vv.baseInfoMap && (cc.vv.baseInfoMap = {});
cc.vv.baseInfoMap[t] = a;
s(a);
} else s(null);
}, cc.vv.http.master_url);
}
}
}
},
_clubStartTableWatch: function() {
this._clubCur && this._clubCur.id && this._clubSubConnect(this._clubCur.id);
},
_clubStopTableWatch: function() {
this._clubSubStop();
},
_clubSubConnect: function(e) {
var t = this;
if (e > 0) if (this._clubSubSio && this._clubSubClubId === e) this._clubSubEmit(); else {
this._clubSubStop();
this._clubSubClubId = e;
cc.vv.http.sendRequest("/club_subscribe_info", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: e
}, function(i) {
null != i && 0 === i.errcode && i.ip && i.port ? t._clubSubClubId === e && t._clubSubOpen(i.ip + ":" + i.port) : console.log("[俱乐部订阅]获取游戏服地址失败,静默降级为HTTP拉取");
});
}
},
_clubSubOpen: function(e) {
var t = this;
if ("undefined" != typeof window && null != window.io) {
var i = null;
try {
i = window.io.connect(e, {
reconnection: !0,
reconnectionDelay: 3e3,
"force new connection": !0,
transports: [ "websocket", "polling" ]
});
} catch (e) {
console.log("[俱乐部订阅]连接异常:" + (e && e.message));
return;
}
this._clubSubSio = i;
i.on("connect", function() {
t._clubSubEmit();
});
i.on("connect_error", function() {});
i.on("club_update", function(e) {
t._clubSubOnUpdate(e);
});
}
},
_clubSubEmit: function() {
var e = this._clubSubSio;
if (e && this._clubSubClubId) {
var t = this._clubCurGame && this._clubCurGame.game_type ? this._clubCurGame.game_type : null;
e.emit("club_subscribe", {
clubid: this._clubSubClubId,
game_type: t
});
}
},
_clubSubOnUpdate: function(e) {
console.log("[俱乐部推送]", JSON.stringify(e));
if (this._clubPanel && this._clubPanel.active && "detail" === this._clubState && this._clubCurGame) {
var t = function(e, t) {
return e && t ? null != t.tableid && e[t.tableid] ? e[t.tableid] : t.roomid && e["r_" + t.roomid] ? e["r_" + t.roomid] : null : null;
};
if (e && (0 === e.player_count || e.seats && 0 === e.seats.length)) {
var i = t(this._clubTableCardMap, e);
if (i) {
for (var n = 0; n < i.slots.length; ++n) this._clubSetSeat(i.slots[n], 0);
if (i.uids) for (var a = 0; a < i.uids.length; ++a) i.uids[a] = 0;
e.roomid && delete this._clubTableCardMap["r_" + e.roomid];
}
this._clubTablesSig = null;
this._clubLoadTables();
} else {
var o = t(this._clubTableCardMap, e);
if (o) {
for (var s = e.seats || [], c = [ 0, 0, 0, 0, 0, 0 ], r = 0; r < s.length; ++r) {
var l = s[r].seatindex, h = o.map && l >= 0 && l < o.map.length ? o.map[l] : l;
h >= 0 && h < c.length && (c[h] = s[r].userid || 0);
}
for (var d = 0; d < o.slots.length; ++d) this._clubSetSeat(o.slots[d], c[d]);
} else this._clubLoadTablesRetry(3);
}
}
},
_clubLoadTablesRetry: function(e) {
if (cc.isValid(this.node)) {
var t = this;
this._clubLoadTables();
e > 0 && setTimeout(function() {
cc.isValid(t.node) && "detail" === t._clubState && t._clubLoadTablesRetry(e - 1);
}, 800);
}
},
_clubSubStop: function() {
var e = this._clubSubSio;
if (e) try {
e.off && e.off("club_update");
e.disconnect();
} catch (e) {}
this._clubSubSio = null;
this._clubSubClubId = null;
},
_clubLoadTables: function() {
this._clubStartTableWatch();
var e = this;
cc.vv.http.sendRequest("/club_tables", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: this._clubCur.id,
game_type: this._clubCurGame.game_type
}, function(t) {
if (0 === t.errcode) {
var i = t.tables || [];
e._clubTableList = i;
for (var n = "", a = 0; a < i.length; ++a) n += (i[a].id || "") + ":" + (i[a].player_count || 0) + ":" + (i[a].user_id0 || 0) + "," + (i[a].user_id1 || 0) + "," + (i[a].user_id2 || 0) + "," + (i[a].user_id3 || 0) + "," + (i[a].user_id4 || 0) + "," + (i[a].user_id5 || 0) + ",";
if (!(n === e._clubTablesSig && e._clubTablesNode && e._clubTablesNode.childrenCount > 0)) {
e._clubTablesSig = n;
e._clubTableCardMap = {};
if (!e._clubTablesNode || !cc.isValid(e._clubTablesNode)) {
var o = e._clubFind(cc.find("Canvas"), "tablesView");
e._clubTablesNode = o ? o.getChildByName("tables") : null;
if (!e._clubTablesNode) {
console.log("[俱乐部]tables容器缺失,无法渲染牌桌列表");
return;
}
}
var s = e._clubCardTpl();
s && (s.active = !1);
e._clubTablesNode.removeAllChildren();
e._clubTablesNode.y = null != e._clubTablesRestY ? e._clubTablesRestY : e._clubTablesNode.parent.height / 2;
var c = e._clubTablesNode.parent.width, r = e._clubTablesNode.parent.height, l = s ? s.width : 0, h = Math.max(1, Math.ceil(i.length / 2));
e._clubTableCols = h;
var d = Math.max(c, 10 + h * l + 8 * Math.max(0, h - 1) + 10);
e._clubTablesNode.setContentSize(d, r);
var u = null != e._clubTablesRestX ? e._clubTablesRestX : 0;
e._clubTablesNode.x = d > c ? u + (d - c) / 2 : u;
0 != i.length ? i.forEach(function(t, i) {
e._clubAddTableCard(e._clubTablesNode, i, t);
}) : e._clubAddRow(e._clubTablesNode, 0, "暂无桌面(管理员后台添加)", "", null, 520);
}
} else cc.vv.wc.showError(t.errmsg || "获取桌面失败");
});
},
_clubEnterTable: function(e) {
var t = this, i = cc.vv.wc, n = Date.now(), a = this._gemsCache, o = function(n) {
t._gemsCache = {
gems: n,
at: Date.now()
};
if (n > 0) t._doEnterTable(e); else {
i.hide();
t._clubShowConfirm("提示", "宝宝豆不足，无法进入桌面", null);
}
};
if (a && n - a.at < 5e3) o(a.gems); else {
i.show("正在进入「" + e.name + "」");
cc.vv.http.sendRequest("/get_user_status", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(e) {
var t = e && null != e.gems ? Number(e.gems) : 0;
o(t);
});
}
},
_doEnterTable: function(e) {
var t = this, i = cc.vv.wc;
i.show("正在进入「" + e.name + "」");
console.log("[进入房间]请求桌面 tableid=" + e.id + " name=" + e.name);
var n = setTimeout(function() {
cc.vv.wc === i && i.showError("进入房间失败,请重试(服务未响应)");
}, 12e3);
cc.vv.http.sendRequest("/club_enter_table", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
tableid: e.id
}, function(e) {
try {
if (null == e || 0 !== e.errcode) {
console.log("[进入房间]失败:" + (e ? e.errcode + " " + e.errmsg : "无响应"));
clearTimeout(n);
if (e && 2222 == e.errcode) {
i.hide();
t._clubShowConfirm("提示", e.errmsg || "宝宝豆不足，无法进入桌面", null);
} else i.showError(e && e.errmsg ? e.errmsg : "进入桌面失败");
return;
}
console.log("[进入房间]成功 roomid=" + e.roomid + " ip=" + e.ip + ":" + e.port);
clearTimeout(n);
t._clubPanel && (t._clubPanel.active = !1);
t._clubStopTableWatch();
cc.vv.fromClub = !0;
cc.vv.fromClubId = t._clubCur ? t._clubCur.id : null;
cc.vv.gameNetMgr.connectGameServer(e);
} catch (e) {
console.log("[进入房间]异常:" + (e && e.message));
clearTimeout(n);
i.showError("进入房间异常:" + (e && e.message));
}
});
},
_clubClosePanel: function() {
this._clubStopTableWatch();
cc.vv.sceneMgr ? cc.vv.sceneMgr.load("hall") : cc.director.loadScene("hall");
},
onDestroy: function() {
this._clubStopTableWatch();
}
});
cc._RF.pop();
}, {} ],
hall: [ function(e, t) {
"use strict";
cc._RF.push(t, "a63d9t3AuBKVLfInT9JAVaH", "hall");
e("Net"), e("Global");
var i = {
baobao_mian: "6张免摆宝宝(最多6人)。每人发6张牌,系统自动遍历所有拆分,选出最大的一副牌型亮牌。\n· 牌型从大到小:6同花顺 > 5同花顺带1 > 4条带2单 > 3条带3条 > 3条带对带1 > 6同花 > 6连顺 > 5同花带1 > 5连顺带1 > 3对 > 3组9 > 散牌。\n· 花色优先级:黑桃 > 红桃 > 梅花 > 方片。A在长顺里算最小(A23456的A当1)。\n· 有庄时闲家只与庄家比;无庄时六家两两互比(后台开关)。\n· 各牌型倍率由管理后台设置。",
baobao_shou: "6张手动摆宝宝(最多6人)。每人发6张牌,自己摆成前2/中2/后2三道。\n· 单道规则:对子为宝,宝>散点(两牌相加取个位,9最大0最小);宝排序 宝A>宝K/Q/J>宝10~2。\n· 强制 前道≤中道≤后道,摆错为乌龙,三道全输(后台可关校验)。\n· 三道独立结算,每道按赢家道型倍率:宝A=10倍,宝K/Q/J=6倍,宝10~2=5倍,9点=4倍,8点=3倍,7点=2倍,6~0点=1倍(后台可配)。\n· 有庄时闲家只与庄家比;无庄时六家两两互比(后台开关)。"
};
cc.Class({
extends: cc.Component,
properties: {
createRoomWin: cc.Node,
settingsWin: cc.Node,
helpWin: cc.Node,
xiaoxiWin: cc.Node,
zhanjiWin: cc.Node,
btnJoinGame: cc.Node,
btnReturnGame: cc.Node,
joinGameWin: cc.Node,
notice: {
default: null,
type: cc.Label
},
lblName: cc.Label,
lblMoney: cc.Label,
lblGems: cc.Label
},
initNetHandlers: function() {},
onLoad: function() {
if (cc.vv) {
cc.vv.fromClub = !1;
cc.vv.fromClubId = null;
}
var e = this.node.getComponent(cc.Canvas);
e.fitHeight = !0;
e.fitWidth = !1;
var t = this.node.getChildByName("global"), i = t ? t.getChildByName("main") : null, n = i ? i.getChildByName("bg") : this.node.getChildByName("bg"), a = i ? i.getChildByName("user") : null, o = a ? a.getChildByName("用户栏-底") : null, s = null;
if (n) {
var c = function() {
if (cc.isValid(n)) {
if (null == s && cc.isValid(o) && a) {
var e = o.x - o.width * o.anchorX;
s = {};
for (var t = 0; t < a.children.length; t++) {
var i = a.children[t];
i !== o && (s[i.name] = i.x - i.width * i.anchorX - e);
}
}
var c = n.getComponent(cc.Widget);
c && (c.enabled = !1);
var r = cc.view.getVisibleSize(), l = cc.view.getVisibleOrigin();
n.setContentSize(r.width, r.height);
n.setPosition(n.parent.convertToNodeSpaceAR(cc.v2(l.x + r.width / 2, l.y + r.height / 2)));
if (cc.isValid(o)) {
var h = o.getComponent(cc.Widget);
h && (h.enabled = !1);
o.setContentSize(r.width, o.height);
var d = o.parent.convertToNodeSpaceAR(cc.v2(l.x + r.width / 2, 0));
o.setPosition(d.x, o.y);
for (var u = o.x - o.width * o.anchorX, v = 0; v < a.children.length; v++) {
var g = a.children[v];
if (g !== o) {
var _ = s[g.name];
if (null != _) {
var f = g.getComponent(cc.Widget);
f && (f.enabled = !1);
g.x = u + _ + g.width * g.anchorX;
}
}
}
}
}
};
c();
this.scheduleOnce(c, 0);
cc.view.setResizeCallback(c);
}
if (cc.vv) {
this.initLabels();
cc.log("roomid", cc.vv.gameNetMgr.roomId);
if (null == cc.vv.gameNetMgr.roomId) {
this.btnJoinGame && (this.btnJoinGame.active = !0);
this.btnReturnGame && (this.btnReturnGame.active = !1);
} else {
this.btnJoinGame && (this.btnJoinGame.active = !1);
this.btnReturnGame && (this.btnReturnGame.active = !0);
}
var r = cc.vv.userMgr.oldRoomId;
cc.log("roomold", r);
if (null != r) {
cc.vv.userMgr.oldRoomId = null;
cc.vv.userMgr.enterRoom(r);
}
cc.vv.audioMgr.playBGM("bgMain.mp3");
this.initButtonHandler("Canvas/global/main/menu/btn_setting");
this.initButtonHandler("Canvas/global/main/menu/btn_help");
this.initButtonHandler("Canvas/global/main/menu/btn_xiaoxi");
this.initButtonHandler("Canvas/global/main/menu/btn_zhanji");
this.initButtonHandler("Canvas/global/main/menu/菜单-商城");
this.initButtonHandler("Canvas/global/main/user/用户栏-默认头像");
this.refreshBarAvatar();
this.sanitizeEvents(this.node);
this.helpWin.addComponent("OnBack");
this.helpWin.setScale(.88);
this.xiaoxiWin.addComponent("OnBack");
if (this.zhanjiWin && null == this.node.getComponent("History")) try {
this.node.addComponent("History");
} catch (e) {
cc.log("[zhanji] History 组件挂载失败:" + (e && e.message));
}
cc.vv.userMgr.notice || (cc.vv.userMgr.notice = {
version: null,
msg: "数据请求中..."
});
this.notice.string = cc.vv.userMgr.notice.msg;
this.refreshInfo();
this.refreshNotice();
this.initClub();
this._checkBindOnLogin();
} else cc.director.loadScene("login");
},
refreshInfo: function() {
var e = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
};
cc.vv.http.sendRequest("/get_user_status", e, function(e) {
0 !== e.errcode ? console.log(e.errmsg) : null != e.gems && (this.lblGems.string = e.gems);
}.bind(this));
},
refreshNotice: function() {
var e = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
type: "notice",
version: cc.vv.userMgr.notice.version
};
cc.vv.http.sendRequest("/get_message", e, function(e) {
if (0 !== e.errcode) console.log(e.errmsg); else {
cc.vv.userMgr.notice.version = e.version;
cc.vv.userMgr.notice.msg = e.msg;
this.notice.string = e.msg;
}
}.bind(this));
},
initButtonHandler: function(e) {
var t = cc.find(e);
if (null != t) {
this.sanitizeEvents(t);
var i = this;
t.on(cc.Node.EventType.TOUCH_END, function() {
cc.isValid(t) && i.onBtnClicked({
target: t
});
});
} else cc.log("[hall] 未找到按钮:" + e);
},
sanitizeEvents: function(e) {
if (null != e) for (var t = e.getComponentsInChildren(cc.Button), i = 0; i < t.length; ++i) {
var n = t[i].clickEvents;
if (null != n && 0 != n.length) {
for (var a = [], o = 0; o < n.length; ++o) {
var s = n[o];
null != s && null != s.target && (s._componentId ? cc.js._getClassById(s._componentId) && a.push(s) : s.component && cc.js.getClassByName(s.component) && a.push(s));
}
t[i].clickEvents = a;
}
}
},
openHelp: function() {
if (null != this.helpWin) {
this.helpWin.active = !0;
var e = this.node.getComponent("HallHelp");
if (null == e) try {
e = this.node.addComponent("HallHelp");
} catch (e) {
cc.log("[help] HallHelp 组件挂载失败:" + (e && e.message));
}
e && e.open(this.helpWin);
}
},
onBtnClicked: function(e) {
cc.log("[hall] click:" + e.target.name);
"btn_setting" == e.target.name ? this.settingsWin.active = !0 : "btn_help" == e.target.name ? this.openHelp() : "btn_xiaoxi" == e.target.name ? this.xiaoxiWin.active = !0 : "btn_zhanji" == e.target.name ? this.openZhanji() : "菜单-商城" == e.target.name ? this.onJoinGameClicked() : "用户栏-默认头像" == e.target.name && this._showUserInfoPanel();
},
_avatarPool: function() {
if (!this._avatarPoolCache) {
this._avatarPoolCache = [];
for (var e = 1; e <= 18; e++) this._avatarPoolCache.push("avatar_" + (e < 10 ? "0" + e : e));
}
return this._avatarPoolCache;
},
_userWin: function(e) {
var t = cc.find("Canvas"), i = t ? t.getChildByName(e) : null;
i && (this["_" + e] = i);
return i;
},
_userWinOpen: function(e) {
var t = this._userWin(e);
if (!t) return null;
t.active = !0;
var i = cc.find("Canvas"), n = i.getChildByName("WaitingConnection");
n && n.setSiblingIndex(i.children.length - 1);
var a = i.getChildByName("alert");
a && a.setSiblingIndex(i.children.length - 1);
return t;
},
_closeWin: function(e) {
var t = this._userWin(e);
t && (t.active = !1);
},
_winFind: function(e, t) {
if (!e) return null;
if (e.name === t) return e;
for (var i = e.children, n = 0; n < i.length; n++) {
var a = this._winFind(i[n], t);
if (a) return a;
}
return null;
},
_winBind: function(e, t, i) {
var n = this._winFind(e, t);
n && n.on(cc.Node.EventType.TOUCH_END, i);
},
refreshBarAvatar: function() {
var e = cc.find("Canvas/global/main/user/用户栏-默认头像");
if (e) {
cc.vv.baseInfoMap && delete cc.vv.baseInfoMap[cc.vv.userMgr.userId];
var t = e.getComponent("ImageLoader");
if (t) {
t._spriteFrame = null;
t.setUserID(cc.vv.userMgr.userId);
}
}
},
_loadSelfAvatar: function(e) {
var t = function(t) {
if (cc.isValid(e) && t) {
var i = e.getComponent(cc.Sprite);
i && (i.spriteFrame = t);
}
};
cc.vv.http.sendRequest("/base_info", {
userid: cc.vv.userMgr.userId
}, function(i) {
cc.isValid(e) && (i && i.headimgurl && /^avatar_\d{1,3}$/.test(i.headimgurl) ? cc.resources.load("images/avatars/" + i.headimgurl, cc.SpriteFrame, function(e, i) {
t(i);
}) : i && i.headimgurl ? cc.assetManager.loadRemote(i.headimgurl + ".jpg", function(e, i) {
!e && i && t(new cc.SpriteFrame(i, cc.Rect(0, 0, i.width, i.height)));
}) : cc.resources.load("images/other/head", cc.SpriteFrame, function(e, i) {
t(i);
}));
}, cc.vv.http.master_url);
},
_showUserInfoPanel: function() {
var e = this, t = this._userWinOpen("userInfoWin");
if (t) {
this._winFind(t, "panel");
if (!t._bound) {
t._bound = !0;
this._winBind(t, "btnClose", function() {
e._closeWin("userInfoWin");
});
this._winBind(t, "btnChangeAvatar", function() {
e._showAvatarWin();
});
this._winBind(t, "btnBind", function() {
e._showBindWin();
});
this._winBind(t, "btnLogout", function() {
e._logout();
});
}
this._loadSelfAvatar(this._winFind(t, "icon"));
var i = 1 == cc.vv.userMgr.sex ? "男" : 2 == cc.vv.userMgr.sex ? "女" : "保密", n = [ "名称", "ID", "性别", "账号" ], a = [ cc.vv.userMgr.userName || "", String(cc.vv.userMgr.userId || ""), i, this._bindAccount || "无" ];
this._userInfoValueLabels = {};
for (var o = 0; o < n.length; o++) {
var s = this._winFind(t, "val" + o), c = s ? s.getComponent(cc.Label) : null;
if (c) {
c.string = a[o];
this._userInfoValueLabels[n[o]] = c;
}
}
this._refreshBindStatus(function() {
var t = e._userInfoValueLabels && e._userInfoValueLabels["账号"];
t && cc.isValid(t.node) && (t.string = e._bindAccount || "无");
});
}
},
_refreshBindStatus: function(e) {
var t = this;
cc.vv.http.sendRequest("/bind_status", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(i) {
if (i && 0 === i.errcode) {
t._bindAccount = i.bound_account;
t._wxBound = !!i.wx;
}
t._bindStatusLoaded = !0;
e && e();
}, cc.vv.http.master_url);
},
_showBindWin: function() {
var e = this, t = this._userWinOpen("bindWin");
if (t) {
this._winFind(t, "panel");
this._bindInputs = {};
for (var i = 0; i < 4; i++) {
var n = this._winFind(t, "bindInput" + i), a = n ? n.getComponent(cc.EditBox) : null;
if (a) {
a.string = "";
a.inputMode = cc.EditBox.InputMode.ANY;
if (i >= 2) {
a.inputFlag = cc.EditBox.InputFlag.PASSWORD;
a.maxLength = 15;
} else {
a.inputFlag = cc.EditBox.InputFlag.DEFAULT;
a.maxLength = 11;
}
this._autoHidePlaceholder(a);
this._bindInputs["input" + i] = a;
}
}
var o = function(i) {
if (i && cc.isValid(t)) for (var n = 0; n < 2; n++) {
var a = e._bindInputs["input" + n];
a && "" === String(a.string || "") && (a.string = i);
}
};
this._bindAccount ? o(this._bindAccount) : this._bindStatusLoaded || this._refreshBindStatus(function() {
o(e._bindAccount);
});
if (!t._bound) {
t._bound = !0;
this._winBind(t, "btnClose", function() {
e._closeWin("bindWin");
});
this._winBind(t, "btnSave", function() {
e._submitBind();
});
}
}
},
_autoHidePlaceholder: function(e) {
if (e && !e._phAutoHide && e.placeholderLabel && e.placeholderLabel.node) {
e._phAutoHide = !0;
var t = e.placeholderLabel.node, i = function(e) {
cc.isValid(t) && (t.active = e);
};
e.node.on("editing-did-began", function() {
i(!1);
});
e.node.on("editing-did-ended", function() {
i("" === (e.string || ""));
});
e.node.on("text-changed", function() {
i("" === (e.string || ""));
});
}
},
_submitBind: function() {
var e = this, t = String(this._bindInputs.input0.string || "").trim(), i = String(this._bindInputs.input1.string || "").trim(), n = String(this._bindInputs.input2.string || "").trim(), a = String(this._bindInputs.input3.string || "").trim();
if ("" !== t && "" !== n) if (t === i) if (n === a) {
cc.vv.wc.show("正在保存");
cc.vv.http.sendRequest("/bind_account", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
name: t,
password: n
}, function(i) {
if (i && 0 === i.errcode) {
cc.vv.wc.hide();
e._bindAccount = t;
cc.vv.wc.showAlert(i.changed ? "密码修改成功" : "绑定成功");
e._closeWin("bindWin");
var n = e._userInfoValueLabels && e._userInfoValueLabels["账号"];
n && cc.isValid(n.node) && (n.string = t);
} else cc.vv.wc.showError(i && i.errmsg ? i.errmsg : "保存失败");
}, cc.vv.http.master_url);
} else cc.vv.wc.showError("两次输入的密码不一致"); else cc.vv.wc.showError("两次输入的账号不一致"); else cc.vv.wc.showError("请输入账号和密码");
},
_showAvatarWin: function() {
var e = this, t = this._userWinOpen("avatarWin");
if (t) {
this._winFind(t, "panel");
this._avatarSel = null;
this._avatarCells = [];
this._avatarGridNode = this._winFind(t, "grid");
if (!t._bound) {
t._bound = !0;
this._winBind(t, "btnClose", function() {
e._closeWin("avatarWin");
});
this._winBind(t, "btnShuffle", function() {
e._refreshAvatarGrid(!0);
});
this._winBind(t, "btnConfirm", function() {
e._submitAvatar();
});
}
this._refreshAvatarGrid();
}
},
_refreshAvatarGrid: function(e) {
var t = this, i = this._avatarGridNode;
if (i && cc.isValid(i)) {
var n = i.getChildByName("cellTemplate") || i.getChildByName("cell_0");
n || console.warn("[hall] avatarWin/grid 下缺少 cellTemplate, 使用默认尺寸建头像格");
for (var a = i.children.slice(), o = 0; o < a.length; o++) a[o] && a[o] !== n && a[o].destroy();
this._avatarCells = [];
var s = this._avatarPool().slice();
if (e || !this._avatarShowKeys) {
for (var c = s.length - 1; c > 0; c--) {
var r = Math.floor(Math.random() * (c + 1)), l = s[c];
s[c] = s[r];
s[r] = l;
}
this._avatarShowKeys = s.slice(0, 12);
}
for (var h = this._avatarShowKeys, d = n ? n.width : 100, u = n ? n.height : 100, v = -(6 * d + 120) / 2 + d / 2, g = (u + 24) / 2, _ = n ? n.getComponent(cc.Sprite) : null, f = 0; f < h.length; f++) (function(e, n) {
var a = new cc.Node("cell_" + n);
a.setContentSize(d, u);
void 0 !== i.layer && (a.layer = i.layer);
a.parent = i;
a.setPosition(v + n % 6 * (d + 24), g - Math.floor(n / 6) * (u + 24));
var o = a.addComponent(cc.Sprite);
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
_ && _.spriteFrame && (o.spriteFrame = _.spriteFrame);
cc.resources.load("images/avatars/" + e, cc.SpriteFrame, function(e, t) {
cc.isValid(a) && t && (o.spriteFrame = t);
});
var s = new cc.Node("selFrame");
a.addChild(s);
var c = s.addComponent(cc.Graphics);
a._key = e;
a._frame = c;
a._cellSize = {
w: d,
h: u
};
a.on(cc.Node.EventType.TOUCH_END, function() {
t._avatarSel = e;
t._redrawAvatarSel();
});
t._avatarCells.push(a);
})(h[f], f);
this._redrawAvatarSel();
}
},
_redrawAvatarSel: function() {
for (var e = this._avatarCells || [], t = 0; t < e.length; t++) {
var i = e[t];
if (cc.isValid(i)) {
var n = i._frame;
n.clear();
if (i._key === this._avatarSel) {
var a = i._cellSize || {
w: 120,
h: 120
};
n.lineWidth = 6;
n.strokeColor = new cc.Color(255, 200, 60, 255);
n.rect(-a.w / 2, -a.h / 2, a.w, a.h);
n.stroke();
}
}
}
},
_submitAvatar: function() {
var e = this;
if (this._avatarSel) {
cc.vv.wc.show("正在保存");
cc.vv.http.sendRequest("/set_avatar", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
avatar: this._avatarSel
}, function(t) {
if (t && 0 === t.errcode) {
cc.vv.wc.hide();
e.refreshBarAvatar();
cc.vv.wc.showAlert("头像修改成功");
e._closeWin("avatarWin");
var i = e._userWin("userInfoWin");
if (i && i.active) {
var n = e._winFind(i, "icon");
n && e._loadSelfAvatar(n);
}
} else cc.vv.wc.showError(t && t.errmsg ? t.errmsg : "保存失败");
}, cc.vv.http.master_url);
} else cc.vv.wc.showError("请先选择一个头像");
},
_showBindTip: function() {
var e = this, t = this._userWinOpen("bindTipWin");
if (t && !t._bound) {
t._bound = !0;
this._winBind(t, "btnClose", function() {
e._closeWin("bindTipWin");
});
this._winBind(t, "btnGoBind", function() {
e._closeWin("bindTipWin");
e._showBindWin();
});
}
},
_checkBindOnLogin: function() {
var e = this;
cc.vv._bindTipShown || cc.vv.http.sendRequest("/bind_status", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(t) {
if (t && 0 === t.errcode) {
e._bindAccount = t.bound_account;
e._wxBound = !!t.wx;
if (!t.bound_account && !t.wx) {
cc.vv._bindTipShown = !0;
e._showBindTip();
}
}
}, cc.vv.http.master_url);
},
_logout: function() {
var e = function() {
cc.vv.wc.show("正在注销账户...");
cc.vv.http.sendRequest("/delete_account", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(e) {
cc.vv.wc.hide();
if (e && 0 === e.errcode) {
cc.sys.localStorage.removeItem("account");
cc.sys.localStorage.removeItem("wx_account");
cc.sys.localStorage.removeItem("wx_sign");
cc.sys.localStorage.removeItem("login_account");
cc.sys.localStorage.removeItem("login_sign");
cc.sys.localStorage.removeItem("login_type");
cc.vv.wc.showAlert("账户已注销");
setTimeout(function() {
cc.director.loadScene("login");
}, 1e3);
} else cc.vv.wc.showError(e && e.errmsg ? e.errmsg : "注销失败，请重试");
}, cc.vv.http.master_url);
};
cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show("注销账户", "确定要注销账户吗？\n此操作不可恢复，您的俱乐部和数据将被清空！", e, !0) : e();
},
initLabels: function() {
if (cc.isValid(this.lblName)) {
this.lblName.string = cc.vv.userMgr.userName + " (ID:" + cc.vv.userMgr.userId + ")";
this.lblName.node.color = cc.color(0, 0, 0);
}
cc.isValid(this.lblMoney) && (this.lblMoney.string = cc.vv.userMgr.coins);
cc.isValid(this.lblGems) && (this.lblGems.string = cc.vv.userMgr.gems);
},
onJoinGameClicked: function() {
this.joinGameWin.active = !0;
},
openZhanji: function() {
if (null != this.zhanjiWin) {
this.zhanjiWin.active = !0;
var e = this.node.getComponent("History");
if (null == e) try {
e = this.node.addComponent("History");
} catch (e) {
cc.log("[zhanji] History 组件挂载失败:" + (e && e.message));
}
cc.log("[zhanji] open, history=" + (null != e) + " active=" + this.zhanjiWin.active);
e ? e.open() : cc.log("[zhanji] History 组件加载失败");
}
},
onReturnGameClicked: function() {
var e = cc.vv.gameNetMgr.getGameScene();
cc.vv.sceneMgr ? cc.vv.sceneMgr.load(e) : cc.director.loadScene(e);
},
onCreateRoomClicked: function() {
if (null == cc.vv.gameNetMgr.roomId) {
console.log("onCreateRoomClicked");
this.createRoomWin.active = !0;
} else cc.vv.wc.showError("房间已经创建!\n必须解散当前房间才能创建新的房间");
},
update: function(e) {
var t = this.notice.node.x;
(t -= 120 * e) + this.notice.node.width < -360 && (t = 600);
this.notice.node.x = t;
if (cc.vv && null != cc.vv.userMgr.roomData) {
cc.vv.userMgr.enterRoom(cc.vv.userMgr.roomData);
cc.vv.userMgr.roomData = null;
}
},
initClub: function() {
var e = this, t = cc.find("Canvas/content/second");
if (t && !t._hallBound) {
t._hallBound = !0;
t.on(cc.Node.EventType.TOUCH_END, function() {
e.onJoinGameClicked();
});
}
var i = cc.find("Canvas/content/first");
if (i && !i._hallBound) {
i._hallBound = !0;
i.on(cc.Node.EventType.TOUCH_END, function() {
cc.vv.wc && cc.vv.wc.showAlert ? cc.vv.wc.showAlert("暂不能使用", "提示") : cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError("暂不能使用");
});
}
var n = cc.find("Canvas/content/clubEntryBtn");
if (n && !n._hallBound) {
n._hallBound = !0;
n.on(cc.Node.EventType.TOUCH_END, function() {
cc.vv.sceneMgr ? cc.vv.sceneMgr.load("club") : cc.director.loadScene("club");
});
}
},
_onCreateRoomEntry: function() {
var e = this;
cc.vv.wc.show("正在验证身份");
cc.vv.http.sendRequest("/club_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(t) {
if (t && 0 === t.errcode) {
for (var i = null, n = t.clubs || [], a = 0; a < n.length; a++) if (n[a].owner_userid == cc.vv.userMgr.userId) {
i = n[a];
break;
}
i ? e._fetchOwnerClubGames(i) : cc.vv.wc.showError("您不是俱乐部创建人，无权创建房间");
} else cc.vv.wc.showError(t && t.errmsg ? t.errmsg : "验证失败");
});
},
_fetchOwnerClubGames: function(e) {
var t = this;
cc.vv.http.sendRequest("/club_games", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: e.id
}, function(i) {
cc.vv.wc.hide();
if (i && 0 === i.errcode) {
var n = i.games || [];
0 !== n.length ? t._openCreateWin(e, n) : cc.vv.wc.showError("俱乐部尚未配置玩法");
} else cc.vv.wc.showError(i && i.errmsg ? i.errmsg : "获取玩法失败");
});
},
_drawRoundRect: function(e, t, i, n, a) {
e.clear();
e.fillColor = a;
e.roundRect(-t / 2, -i / 2, t, i, n);
e.fill();
},
_makeLabel: function(e, t, i, n, a, o) {
var s = new cc.Node("label");
s.parent = e;
var c = s.addComponent(cc.Label);
c.string = t;
c.fontSize = i;
c.color = o || cc.Color.WHITE;
s.setPosition(n, a);
return c;
},
_makeEditBox: function(e, t, i, n, a, o, s, c, r) {
var l = new cc.Node(t + "_bg");
l.parent = e;
l.setContentSize(a, o);
l.setPosition(i, n);
var h = l.addComponent(cc.Graphics);
this._drawRoundRect(h, a, o, 8, new cc.Color(60, 64, 76, 255));
var d = new cc.Node(t);
d.parent = e;
d.setContentSize(a, o);
d.setPosition(i, n);
d.addComponent(cc.Sprite);
var u = d.addComponent(cc.EditBox), v = new cc.Node("TEXT_LABEL");
v.parent = d;
var g = v.addComponent(cc.Label);
g.fontSize = 26;
g.color = cc.Color.WHITE;
var _ = new cc.Node("PLACEHOLDER_LABEL");
_.parent = d;
var f = _.addComponent(cc.Label);
f.fontSize = 26;
f.color = new cc.Color(150, 150, 150, 255);
u.textLabel = g;
u.placeholderLabel = f;
u.placeholder = c || "";
u.inputMode = r && r.inputMode ? r.inputMode : cc.EditBox.InputMode.NUMERIC;
r && r.password && (u.inputFlag = cc.EditBox.InputFlag.PASSWORD);
r && r.maxLength && (u.maxLength = r.maxLength);
u.string = s;
return u;
},
_makeTextButton: function(e, t, i, n, a, o, s, c, r) {
var l = new cc.Node(t);
l.parent = e;
l.setContentSize(o, s);
l.setPosition(n, a);
var h = l.addComponent(cc.Graphics);
this._drawRoundRect(h, o, s, 10, c);
var d = new cc.Node("text");
d.parent = l;
var u = d.addComponent(cc.Label);
u.string = i;
u.fontSize = 28;
u.color = cc.Color.WHITE;
l._btnLabel = u;
l.on(cc.Node.EventType.TOUCH_END, function() {
cc.isValid(l) && r(l);
});
return l;
},
_openCreateWin: function(e, t) {
var i = this;
this._closeCreateWin();
var n = cc.find("Canvas");
if (n) {
var a = cc.view.getVisibleSize(), o = new cc.Node("hallCreateWin");
o.parent = n;
o.setContentSize(a.width, a.height);
var s = new cc.Node("mask");
s.parent = o;
s.setContentSize(a.width, a.height);
var c = s.addComponent(cc.Graphics);
c.fillColor = new cc.Color(0, 0, 0, 160);
c.rect(-a.width / 2, -a.height / 2, a.width, a.height);
c.fill();
s.addComponent(cc.BlockInputEvents);
this._createWin = o;
this._createClub = e;
this._createGames = t;
this._createSelGame = t[0];
var r = new cc.Node("panel");
r.parent = o;
r.setContentSize(720, 840);
var l = r.addComponent(cc.Graphics);
this._drawRoundRect(l, 720, 840, 16, new cc.Color(30, 34, 44, 245));
this._makeLabel(r, "创建房间", 36, 0, 370);
this._makeLabel(r, "俱乐部：" + (e.name || ""), 22, 0, 322, new cc.Color(180, 180, 180, 255));
this._makeLabel(r, "玩法：", 26, -300, 240);
this._createGameBtns = [];
for (var h = 0; h < t.length; h++) (function(e) {
var n = t[e], a = 180 * e - 210, o = i._makeTextButton(r, "game_" + e, n.name || n.game_type, a, 240, 160, 64, new cc.Color(70, 76, 92, 255), function() {
i._createSelGame = n;
i._refreshCreateGameBtns();
i._fillCreateDefaults();
});
o._game = n;
i._createGameBtns.push(o);
})(h);
this._makeLabel(r, "玩法简介：", 22, -290, 165, new cc.Color(120, 170, 255, 255));
var d = new cc.Node("createIntro");
d.parent = r;
d.setAnchorPoint(.5, 1);
d.setPosition(0, 140);
d.setContentSize(640, 200);
var u = d.addComponent(cc.Label);
u.fontSize = 20;
u.lineHeight = 28;
u.enableWrapText = !0;
u.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
u.verticalAlign = cc.Label.VerticalAlign.TOP;
u.color = new cc.Color(220, 220, 220, 255);
u.overflow = cc.Label.Overflow.NONE;
this._createIntroLabel = u;
var v = [ [ "底分：", "difenInput" ], [ "局数：", "jushuInput" ], [ "最低宝宝豆：", "minInput" ], [ "请出阈值：", "kickInput" ] ];
this._createInputs = {};
for (var g = 0; g < v.length; g++) {
var _ = -80 - 80 * g;
this._makeLabel(r, v[g][0], 26, -210, _);
this._createInputs[v[g][1]] = this._makeEditBox(r, v[g][1], 100, _, 300, 56, "0", "");
}
this._makeTextButton(r, "btnOk", "确定", -140, -380, 200, 72, new cc.Color(41, 121, 211, 255), function() {
i._submitCreateWin();
});
this._makeTextButton(r, "btnCancel", "取消", 140, -380, 200, 72, new cc.Color(90, 94, 106, 255), function() {
i._closeCreateWin();
});
this._refreshCreateGameBtns();
this._fillCreateDefaults();
}
},
_refreshCreateGameBtns: function() {
for (var e = this._createGameBtns || [], t = 0; t < e.length; t++) {
var n = e[t], a = n._game === this._createSelGame, o = n.getComponent(cc.Graphics);
this._drawRoundRect(o, n.width, n.height, 10, a ? new cc.Color(41, 121, 211, 255) : new cc.Color(70, 76, 92, 255));
}
if (this._createIntroLabel && this._createSelGame) {
var s = this._createSelGame.game_type || this._createSelGame.type;
this._createIntroLabel.string = i[s] || "该玩法暂无说明。";
}
},
_fillCreateDefaults: function() {
var e = this._createSelGame;
if (e && this._createInputs) {
var t = e.difen_options || [], i = e.jushu_options || [], n = Number(t[0]);
this._createInputs.difenInput.string = String(isFinite(n) && n > 0 ? n : 1);
this._createInputs.jushuInput.string = String(null != i[0] ? i[0] : "");
this._createInputs.minInput.string = "0";
this._createInputs.kickInput.string = "0";
}
},
_closeCreateWin: function() {
this._createWin && cc.isValid(this._createWin) && this._createWin.destroy();
this._createWin = null;
this._createGameBtns = null;
this._createInputs = null;
this._createIntroLabel = null;
},
_submitCreateWin: function() {
var e = this, t = this._createSelGame, i = this._createClub;
if (t && i && this._createInputs) {
var n = function(e) {
return String(e.string || "").replace(/[^0-9]/g, "");
}, a = parseInt(n(this._createInputs.difenInput));
if (a > 0) {
for (var o = t.jushu_options || [], s = parseInt(n(this._createInputs.jushuInput)), c = -1, r = 0; r < o.length; r++) if (Number(o[r]) === s) {
c = r;
break;
}
if (c < 0) cc.vv.wc.showError("局数只能为：" + (o.length ? o.join(" / ") : "玩法未配置")); else {
var l = parseInt(n(this._createInputs.minInput)), h = parseInt(n(this._createInputs.kickInput));
l >= 0 || (l = 0);
h >= 0 || (h = 0);
cc.vv.wc.show("正在创建房间");
cc.vv.http.sendRequest("/club_add_table", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: i.id,
game_type: t.game_type,
difen_value: a,
jushuxuanze: c,
banker_mode: 0,
min_bean: l,
kick_bean: h
}, function(t) {
if (t && 0 === t.errcode) {
e._closeCreateWin();
e._enterCreatedTable(t.tableid);
} else cc.vv.wc.showError(t && t.errmsg ? t.errmsg : "创建房间失败");
});
}
} else cc.vv.wc.showError("请输入正确的底分");
}
},
_enterCreatedTable: function(e) {
var t = cc.vv.wc;
t.show("正在进入房间");
var i = setTimeout(function() {
cc.vv.wc === t && t.showError("进入房间失败,请重试(服务未响应)");
}, 12e3);
cc.vv.http.sendRequest("/club_enter_table", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
tableid: e
}, function(e) {
clearTimeout(i);
if (e && 0 === e.errcode) cc.vv.gameNetMgr.connectGameServer(e); else if (e && 2222 == e.errcode) {
t.hide();
cc.vv.wc.showAlert(e.errmsg || "宝宝豆不足，无法进入房间");
} else t.showError(e && e.errmsg ? e.errmsg : "进入房间失败");
});
}
});
cc._RF.pop();
}, {
Global: void 0,
Net: void 0
} ],
login: [ function(e, t) {
"use strict";
cc._RF.push(t, "bbf1b43cW9Ovacibb4rBF7T", "login");
String.prototype.format = function(e) {
if (arguments.length > 0) {
var t = this;
if (1 == arguments.length && "object" == typeof e) for (var i in e) {
var n = new RegExp("({" + i + "})", "g");
t = t.replace(n, e[i]);
} else for (var a = 0; a < arguments.length; a++) {
if (null == arguments[a]) return "";
n = new RegExp("({[" + a + "]})", "g");
t = t.replace(n, arguments[a]);
}
return t;
}
return this;
};
cc.Class({
extends: cc.Component,
properties: {
_mima: null,
_mimaIndex: 0
},
onLoad: function() {
cc.vv || this._initMgr();
cc.vv && cc.vv.http && (cc.vv.http.url = cc.vv.http.master_url);
if (!cc.sys.isNative) {
var e = this.node.getComponent(cc.Canvas);
e.fitHeight = !0;
e.fitWidth = !1;
var t = this.node.getChildByName("bg");
if (!t) {
var i = this.node.getChildByName("global"), n = i ? i.getChildByName("image") : null;
t = n ? n.getChildByName("bg") : null;
}
if (t) {
var a = function() {
if (cc.isValid(t)) {
var e = t.getComponent(cc.Widget);
e && (e.enabled = !1);
var i = cc.view.getVisibleSize(), n = cc.view.getVisibleOrigin();
t.setContentSize(i.width, i.height);
t.setPosition(t.parent.convertToNodeSpaceAR(cc.v2(n.x + i.width / 2, n.y + i.height / 2)));
}
};
a();
this.scheduleOnce(a, 0);
cc.view.setResizeCallback(a);
}
}
this._initPreloadUI();
this._checkVersion();
cc.vv.audioMgr.playBGM("bgMain.mp3");
this._mima = [ "A", "A", "B", "B", "A", "B", "A", "B", "A", "A", "A", "B", "B", "B" ];
var o = this._findBtnRoot();
if (o) {
o.active = !1;
this._loginBtnRoot = o;
var s = o.getChildByName("btn_yk");
s && (s.active = !0);
var c = o.getChildByName("button1");
if (c) {
c.active = !(cc.vv.SI && 0 === cc.vv.SI.wxlogin);
cc.vv.utils.addClickEvent(c, this.node, "login", "onBtnWechatClicked");
}
}
this._initPwdLoginUI();
},
_initMgr: function() {
cc.vv = {};
var t = e("UserMgr");
cc.vv.userMgr = new t();
var i = e("ReplayMgr");
cc.vv.replayMgr = new i();
cc.vv.http = e("HTTP");
cc.vv.global = e("Global");
cc.vv.net = e("Net");
var n = e("GameNetMgr");
cc.vv.gameNetMgr = new n();
cc.vv.gameNetMgr.initHandlers();
var a = e("AnysdkMgr");
cc.vv.anysdkMgr = new a();
cc.vv.anysdkMgr.init();
var o = e("VoiceMgr");
cc.vv.voiceMgr = new o();
cc.vv.voiceMgr.init();
var s = e("AudioMgr");
cc.vv.audioMgr = new s();
cc.vv.audioMgr.init();
var c = cc.Node.prototype.emit;
cc.Node.prototype.emit = function(e) {
if ("touch-end" === e && cc.vv && cc.vv.audioMgr) {
var t = this.getComponent ? this.getComponent(cc.Button) : null;
(t && !1 !== t.interactable || /^btn/i.test(this.name) || /button/i.test(this.name)) && cc.vv.audioMgr.playSFX("btnClick.wav");
}
return c.apply(this, arguments);
};
var r = e("Utils");
cc.vv.utils = new r();
try {
var l = e("SceneMgr");
cc.vv.sceneMgr = new l();
cc.vv.sceneMgr.init();
} catch (e) {
console.warn("[SceneMgr] 加载失败:", e.message);
cc.vv.sceneMgr = {
load: function(e, t) {
return cc.director.loadScene(e, t);
}
};
}
cc.args = this.urlParse();
},
urlParse: function() {
var e = {};
if (null == window.location) return e;
for (var t = window.location.href, i = t.indexOf("?"), n = (t = t.substr(i + 1)).split("&"), a = 0; a < n.length; a++) if ((i = n[a].indexOf("=")) > 0) {
var o = n[a].substr(0, i), s = n[a].substr(i + 1);
e[o] = s;
}
return e;
},
_checkVersion: function() {
var e = this, t = null, i = !1, n = function(t) {
t && null != t.version && (cc.vv.SI = t);
var i = e._findBtnRoot(), n = i ? i.getChildByName("button1") : null;
n && (n.active = !(cc.vv.SI && 0 === cc.vv.SI.wxlogin));
}, a = 0, o = function() {
a++;
t = cc.vv.http.sendRequest("/get_serverinfo", null, function(e) {
t = null;
i = !0;
n(e);
}, cc.vv.http.master_url);
setTimeout(s, 5e3);
}, s = function() {
if (!i) if (t) {
t.abort();
a < 3 && setTimeout(function() {
o();
}, 5e3);
} else a < 3 && o();
};
s();
},
_findBtnRoot: function() {
return cc.find("Canvas/global/button") || cc.find("Canvas/main/button") || cc.find("Canvas/button");
},
onBtnWechatClicked: function() {
cc.sys.isNative ? cc.vv.anysdkMgr.login() : cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError("微信登录仅支持APP端,请使用游客登录");
},
start: function() {},
_initPreloadUI: function() {
if (!this._preloadStarted) {
this._preloadStarted = !0;
var e = this, t = this._findBtnRoot();
if (t) {
t.active = !1;
this._loginBtnRoot = t;
}
var i = this.node.getChildByName("preloadUI");
this._preloadBaked = !!i;
if (null == i) {
i = new cc.Node("preloadUI");
this.node.addChild(i);
i.setPosition(0, -140);
var n = new cc.Node("tip");
n.setPosition(0, 34);
i.addChild(n);
var a = n.addComponent(cc.Label);
a.string = "资源加载中...";
a.fontSize = 24;
a.lineHeight = 30;
var o = new cc.Node("barBg");
o.setContentSize(520, 24);
i.addChild(o);
var s = new cc.Node("barFill");
s.setPosition(-250, 0);
i.addChild(s);
var c = new cc.Node("pct");
c.setPosition(0, -34);
i.addChild(c);
var r = c.addComponent(cc.Label);
r.string = "0%";
r.fontSize = 22;
r.lineHeight = 26;
}
i.active = !0;
i.setPosition(0, -140);
var l = i.getChildByName("barBg");
l.setContentSize(520, 30);
if (null == l.getComponent(cc.Sprite)) {
var h = l.getComponent(cc.Graphics) || l.addComponent(cc.Graphics);
h.clear();
h.fillColor = cc.color(0, 0, 0, 160);
h.roundRect(-260, -12, 520, 24, 12);
h.fill();
h.strokeColor = cc.color(255, 215, 120);
h.lineWidth = 2;
h.roundRect(-260, -12, 520, 24, 12);
h.stroke();
}
var d = i.getChildByName("barFill");
this._loadFillNode = d;
this._loadFillSprite = d.getComponent(cc.Sprite);
this._loadFill = this._loadFillSprite ? null : d.getComponent(cc.Graphics) || d.addComponent(cc.Graphics);
null == this._loadFillSprite && d.setPosition(-250, 0);
this._loadFillW = 520;
this._loadPct = i.getChildByName("pct").getComponent(cc.Label);
this._drawLoadProgress(0);
var u = [ "images", "textures", "sounds", "prefabs" ], v = {}, g = 0;
u.forEach(function(t) {
v[t] = {
c: 0,
t: 0
};
cc.resources.loadDir(t, function(i, n) {
v[t].c = i;
v[t].t = n;
var a = 0, o = 0;
for (var s in v) {
a += v[s].c;
o += v[s].t;
}
e._drawLoadProgress(o > 0 ? a / o : 0);
}, function(i) {
i && console.log("[预载]目录加载失败:" + t, i);
++g >= u.length && e._onAllResLoaded();
});
});
}
},
_drawLoadProgress: function(e) {
this._loadMaxP = Math.max(this._loadMaxP || 0, e);
e = this._loadMaxP;
if (this._loadFillSprite) this._loadFillNode.width = Math.max(.01, this._loadFillW * e); else if (this._loadFill) {
var t = this._loadFill;
t.clear();
var i = Math.max(.01, this._loadFillW * e);
t.fillColor = cc.color(220, 60, 60);
t.roundRect(0, -8, i, 16, 8);
t.fill();
}
this._loadPct && (this._loadPct.string = Math.floor(100 * e) + "%");
},
_onAllResLoaded: function() {
this._drawLoadProgress(1);
var e = this.node.getChildByName("preloadUI");
e && (this._preloadBaked ? e.active = !1 : e.destroy());
var t = this._loginBtnRoot;
if (t && cc.isValid(t)) {
var i = function() {
if (cc.isValid(t)) {
t.active = !0;
var e = t.getChildByName("btn_yk");
e && (e.active = !0);
}
};
cc.vv.userMgr && cc.vv.userMgr.autoLogin(i) || i();
}
},
_initPwdLoginUI: function() {
if (!this._pwdLoginBound) {
this._pwdLoginBound = !0;
var e = this, t = this._findBtnRoot(), i = cc.find("Canvas"), n = i ? i.getChildByName("pwdWin") : null;
this._pwdWinNode = n || null;
n && (n.active = !1);
var a = n ? this._findChildByName(n, "pwdAcc") : t ? this._findChildByName(t, "pwdAcc") : null, o = n ? this._findChildByName(n, "pwdPwd") : t ? this._findChildByName(t, "pwdPwd") : null;
this._pwdAccBox = a ? a.getComponent(cc.EditBox) : null;
this._pwdPwdBox = o ? o.getComponent(cc.EditBox) : null;
if (!this._pwdAccBox && !this._pwdPwdBox && t) {
var s = t.getComponentsInChildren(cc.EditBox);
if (s.length >= 2) {
this._pwdAccBox = s[0];
this._pwdPwdBox = s[1];
}
}
if (n) {
var c = this._findChildByName(n, "btnLogin");
c && c.on(cc.Node.EventType.TOUCH_END, function() {
e._submitPwdLogin();
});
var r = this._findChildByName(n, "btnCancel");
r && r.on(cc.Node.EventType.TOUCH_END, function() {
cc.isValid(n) && (n.active = !1);
});
var l = n.getChildByName("dim");
l && l.on(cc.Node.EventType.TOUCH_END, function() {
cc.isValid(n) && (n.active = !1);
});
}
var h = t ? t.getChildByName("activ") || t.getChildByName("btnPwdLogin") : null;
h ? h.on(cc.Node.EventType.TOUCH_END, function() {
e._pwdWinNode && cc.isValid(e._pwdWinNode) ? e._pwdWinNode.active = !0 : e._showPwdLoginWin();
}) : console.warn("[login] 未找到账号登录按钮(activ), 账号登录未绑定");
}
},
_submitPwdLogin: function() {
var e = (this._pwdAccBox && this._pwdAccBox.string || "").trim(), t = (this._pwdPwdBox && this._pwdPwdBox.string || "").trim();
if (e && t) {
this._pwdWinNode && cc.isValid(this._pwdWinNode) && (this._pwdWinNode.active = !1);
cc.vv.userMgr.pwdAuth(e, t);
} else cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError("请输入账号和密码");
},
_showPwdLoginWin: function() {
var e = this;
if (this._pwdWinNode && cc.isValid(this._pwdWinNode)) this._pwdWinNode.active = !0; else if (this._pwdWin && cc.isValid(this._pwdWin)) this._pwdWin.active = !0; else {
var t = 620, i = 400, n = new cc.Node("pwdLoginWin");
n.setContentSize(t, i);
this.node.addChild(n);
var a = new cc.Node("dim");
a.setContentSize(2e3, 2e3);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(0, 0, 0, 170);
o.rect(-1e3, -1e3, 2e3, 2e3);
o.fill();
n.addChild(a);
a.on(cc.Node.EventType.TOUCH_END, function() {
n.active = !1;
});
var s = new cc.Node("panel");
s.setContentSize(t, i);
var c = s.addComponent(cc.Graphics);
c.fillColor = cc.color(255, 255, 255, 255);
c.roundRect(-310, -200, t, i, 16);
c.fill();
c.strokeColor = cc.color(180, 180, 180, 255);
c.lineWidth = 2;
c.roundRect(-310, -200, t, i, 16);
c.stroke();
n.addChild(s);
var r = new cc.Node("title");
r.setPosition(0, 150);
r.addComponent(cc.Label);
var l = r.getComponent(cc.Label);
l.fontSize = 32;
l.lineHeight = 38;
l.string = "账号登录";
r.color = cc.color(40, 40, 40, 255);
s.addChild(r);
this._pwdAccBox = this._makePwdBox(s, "pwdAcc", 62, "请输入账号", !1);
this._pwdPwdBox = this._makePwdBox(s, "pwdPwd", -14, "请输入密码", !0);
var h = this._findBtnRoot(), d = h ? h.getChildByName("btn_yk") : null, u = d && d.getComponent(cc.Sprite) ? d.getComponent(cc.Sprite).spriteFrame : null;
this._makePwdBtn(s, "btnLogin", 100, -118, "登录", u, function() {
var t = (e._pwdAccBox && e._pwdAccBox.string || "").trim(), i = (e._pwdPwdBox && e._pwdPwdBox.string || "").trim();
if (t && i) {
n.active = !1;
cc.vv.userMgr.pwdAuth(t, i);
} else cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError("请输入账号和密码");
});
this._makePwdBtn(s, "btnCancel", -100, -118, "取消", u, function() {
n.active = !1;
});
this._pwdWin = n;
}
},
_makePwdBox: function(e, t, i, n, a) {
var o = new cc.Node(t);
o.setContentSize(440, 64);
o.setPosition(0, i);
e.addChild(o);
var s = o.addComponent(cc.Graphics);
s.fillColor = cc.color(245, 245, 245, 255);
s.roundRect(-220, -32, 440, 64, 10);
s.fill();
s.strokeColor = cc.color(200, 200, 200, 255);
s.lineWidth = 2;
s.roundRect(-220, -32, 440, 64, 10);
s.stroke();
var c = new cc.Node("textLabel");
c.setContentSize(420, 64);
c.setAnchorPoint(0, .5);
c.setPosition(-210, 0);
c.addComponent(cc.Label);
var r = c.getComponent(cc.Label);
r.fontSize = 26;
r.lineHeight = 32;
r.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
r.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(30, 30, 30, 255);
o.addChild(c);
var l = new cc.Node("placeholderLabel");
l.setContentSize(420, 64);
l.setAnchorPoint(0, .5);
l.setPosition(-210, 0);
l.addComponent(cc.Label);
var h = l.getComponent(cc.Label);
h.fontSize = 26;
h.lineHeight = 32;
h.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
h.string = n;
l.color = cc.color(150, 150, 150, 255);
o.addChild(l);
var d = o.addComponent(cc.EditBox);
d.textLabel = r;
d.placeholderLabel = h;
d.placeholder = n;
d.maxLength = 24;
a && (d.inputFlag = cc.EditBox.InputFlag.PASSWORD);
return d;
},
_makePwdBtn: function(e, t, i, n, a, o, s) {
var c = new cc.Node(t);
c.setContentSize(200, 72);
c.setPosition(i, n);
e.addChild(c);
var r = c.addComponent(cc.Sprite);
r.sizeMode = cc.Sprite.SizeMode.CUSTOM;
o && (r.spriteFrame = o);
var l = new cc.Node("lbl");
l.addComponent(cc.Label);
var h = l.getComponent(cc.Label);
h.string = a;
h.fontSize = 28;
h.lineHeight = 34;
l.color = cc.color(255, 255, 255, 255);
c.addChild(l);
c.on(cc.Node.EventType.TOUCH_END, s);
return c;
},
_findChildByName: function(e, t) {
if (!e) return null;
var i = e.getChildByName(t);
if (i) return i;
for (var n = e.children, a = 0; a < n.length; a++) if (i = this._findChildByName(n[a], t)) return i;
return null;
},
onBtnQuickStartClicked: function() {
cc.vv.userMgr.guestAuth();
},
onBtnMIMAClicked: function(e) {
if (this._mima[this._mimaIndex] == e.target.name) {
this._mimaIndex++;
if (this._mimaIndex == this._mima.length) {
var t = this._findBtnRoot();
if (t) {
var i = t.getChildByName("btn_yk");
i && (i.active = !0);
}
}
} else {
console.log("oh ho~~~");
this._mimaIndex = 0;
}
}
});
cc._RF.pop();
}, {
AnysdkMgr: void 0,
AudioMgr: void 0,
GameNetMgr: void 0,
Global: void 0,
HTTP: void 0,
Net: void 0,
ReplayMgr: void 0,
SceneMgr: void 0,
UserMgr: void 0,
Utils: void 0,
VoiceMgr: void 0
} ],
setting: [ function(e, t) {
"use strict";
cc._RF.push(t, "ca48dCjc1lMDKZsoTXRVIYT", "setting");
cc.Class({
extends: cc.Component,
properties: {
_btnYXOpen: null,
_btnYXClose: null,
_btnYYOpen: null,
_btnYYClose: null
},
onLoad: function() {
if (null != cc.vv) {
this._btnYXOpen = this.node.getChildByName("yinxiao").getChildByName("btn_yx_open");
this._btnYXClose = this.node.getChildByName("yinxiao").getChildByName("btn_yx_close");
this._btnYYOpen = this.node.getChildByName("yinyue").getChildByName("btn_yy_open");
this._btnYYClose = this.node.getChildByName("yinyue").getChildByName("btn_yy_close");
this.initButtonHandler(this.node.getChildByName("btn_close"));
this.initButtonHandler(this.node.getChildByName("btn_exit"));
this.initButtonHandler(this._btnYXOpen);
this.initButtonHandler(this._btnYXClose);
this.initButtonHandler(this._btnYYOpen);
this.initButtonHandler(this._btnYYClose);
var e = this.node.getChildByName("yinxiao").getChildByName("progress");
cc.vv.utils.addSlideEvent(e, this.node, "setting", "onSlided");
e = this.node.getChildByName("yinyue").getChildByName("progress");
cc.vv.utils.addSlideEvent(e, this.node, "setting", "onSlided");
this.refreshVolume();
}
},
onSlided: function(e) {
"yinxiao" == e.node.parent.name ? cc.vv.audioMgr.setSFXVolume(e.progress) : "yinyue" == e.node.parent.name && cc.vv.audioMgr.setBGMVolume(e.progress);
this.refreshVolume();
},
initButtonHandler: function(e) {
cc.vv.utils.addClickEvent(e, this.node, "setting", "onBtnClicked");
},
refreshVolume: function() {
this._btnYXClose.active = cc.vv.audioMgr.sfxVolume > 0;
this._btnYXOpen.active = !this._btnYXClose.active;
var e = this.node.getChildByName("yinxiao"), t = 430 * cc.vv.audioMgr.sfxVolume;
(i = e.getChildByName("progress")).getComponent(cc.Slider).progress = cc.vv.audioMgr.sfxVolume;
i.getChildByName("progress").width = t;
this._btnYYClose.active = cc.vv.audioMgr.bgmVolume > 0;
this._btnYYOpen.active = !this._btnYYClose.active;
var i, n = this.node.getChildByName("yinyue");
t = 430 * cc.vv.audioMgr.bgmVolume;
(i = n.getChildByName("progress")).getComponent(cc.Slider).progress = cc.vv.audioMgr.bgmVolume;
i.getChildByName("progress").width = t;
},
onBtnClicked: function(e) {
if ("btn_close" == e.target.name) this.node.active = !1; else if ("btn_exit" == e.target.name) {
if (cc.vv && "function" == typeof cc.vv.bbExitHook) {
cc.vv.bbExitHook();
return;
}
cc.sys.localStorage.removeItem("login_account");
cc.sys.localStorage.removeItem("login_sign");
cc.sys.localStorage.removeItem("login_type");
cc.vv.sceneMgr ? cc.vv.sceneMgr.load("login") : cc.director.loadScene("login");
} else if ("btn_yx_open" == e.target.name) {
cc.vv.audioMgr.setSFXVolume(1);
this.refreshVolume();
} else if ("btn_yx_close" == e.target.name) {
cc.vv.audioMgr.setSFXVolume(0);
this.refreshVolume();
} else if ("btn_yy_open" == e.target.name) {
cc.vv.audioMgr.setBGMVolume(1);
this.refreshVolume();
} else if ("btn_yy_close" == e.target.name) {
cc.vv.audioMgr.setBGMVolume(0);
this.refreshVolume();
}
}
});
cc._RF.pop();
}, {} ],
"use_v2.0.x_cc.Toggle_event": [ function(e, t) {
"use strict";
cc._RF.push(t, "3d3c7POKptBGaKR0drSDSkI", "use_v2.0.x_cc.Toggle_event");
cc.Toggle && (cc.Toggle._triggerEventInScript_check = !0);
cc._RF.pop();
}, {} ]
}, {}, [ "use_v2.0.x_cc.Toggle_event", "BBGame", "clubScene", "Alert", "CheckBox", "CreateRoom", "HallHelp", "History", "ImageLoader", "JoinGameInput", "hall", "setting", "Lodinglogin", "login", "Chat", "Folds", "GameOver", "GameResult", "MJGameBMJ", "MJRoom", "NoticeTip", "PengGangs", "PopupMgr", "RadioButton", "RadioGroupMgr", "ReConnect", "ReplayCtrl", "Seat", "TimePointer", "UserInfoShow", "Voice" ]);