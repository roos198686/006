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
return 2 === e ? [ 0, 3 ] : [ 0, 5, 4, 3, 2, 1 ].slice(0, e);
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
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("btnClick.wav");
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
loadSettleCards: function() {
var e = this;
cc.resources.loadDir("images/cards_js", cc.SpriteFrame, function(t, i) {
if (!t && i && i.length) {
e._jsFrames = {};
i.forEach(function(t) {
e._jsFrames[t.name] = t;
});
console.log("[BB] 结算牌面加载完成, 帧数=" + i.length);
if (e._n.resultPanel && e._n.resultPanel.active && e._lastResults) {
var n = e._renderSettleCards(e._lastResults, e._lastDetails);
e._n.resultContent && (e._n.resultContent.active = !n);
}
} else console.log("[BB] 结算牌面加载失败, 沿用牌桌牌面", t);
});
},
jsFrameOf: function(e) {
if (!this._jsFrames || null == e) return null;
var t = this.suitOf(e), i = this.rankOf(e), n = 0 === t ? 4 : 1 === t ? 3 : 2 === t ? 2 : 1, a = 14 === i ? 1 : i;
return this._jsFrames["n_" + n + "_" + a] || null;
},
loadFireFrames: function() {
var e = this;
function t(t, i) {
cc.resources.loadDir(t, cc.SpriteFrame, function(n, a) {
if (!n && a && a.length) {
a.sort(function(e, t) {
var i = parseInt(e.name, 10), n = parseInt(t.name, 10);
return isNaN(i) || isNaN(n) ? e.name < t.name ? -1 : e.name > t.name ? 1 : 0 : i - n;
});
e[i] = a;
} else console.log("[BB] load " + t + " failed", n);
});
}
t("images/bbfx_start", "_startFrames");
t("images/bbfx_dq", "_dqFrames");
t("images/bbfx_zq", "_zqFrames");
t("images/bbfx_qld", "_qldFrames");
t("images/bbfx_pairs", "_pairsFrames");
cc.resources.load("anims/qiepai/qiepai", sp.SkeletonData, function(t, i) {
if (!t && i) {
e._qiepaiSpine = i;
console.log("[BB] qiepai spine 加载完成");
} else console.log("[BB] qiepai spine 加载失败", t);
});
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
this._inArrangePhase = !1;
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
this.loadSettleCards();
this.loadFireFrames();
this._preloadBackScene();
this._bindButtons();
this._initChat();
this._bindEvents();
var i = cc.vv && cc.vv.bbReplayData;
if (i) {
this._enterReplay(i);
return;
}
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
e.bbMidCd = this.findNode(e.game, "bbMidCd");
e.readyBtn = this.findNode(e.prepare, "readyBtn");
e.exitBtn = this.findNode(e.prepare, "exitBtn");
e.dissolveBtn = this.findNode(e.prepare, "dissolveBtn");
e.ruleBtn = this.findNode(e.prepare, "bbRuleBtn");
e.changeDeskBtn = this.findNode(e.prepare, "bbChangeDeskBtn");
e.ruleWin = this.findNode(t, "bbRuleWin");
e.ruleCost = this.findNode(e.ruleWin, "bbRuleLine0");
e.ruleGames = this.findNode(e.ruleWin, "bbRuleLine2");
e.ruleBase = this.findNode(e.ruleWin, "bbRuleLine3");
e.ruleClose = this.findNode(e.ruleWin, "bbRuleClose");
e.resultPanel = this.findNode(t, "settlePanel");
e.resultTitle = this.findNode(e.resultPanel, "settleTitle");
e.sbSprite = this.findNode(e.resultPanel, "sbSprite");
e.slSprite = this.findNode(e.resultPanel, "slSprite");
e.hjSprite = this.findNode(e.resultPanel, "hjSprite");
e.resultContent = this.findNode(e.resultPanel, "settleContent");
e.settleRound = this.findNode(e.resultPanel, "settleRound");
var i = e.resultContent ? e.resultContent.getComponent(cc.Label) : null;
this._settleFontSize = i ? i.fontSize : 32;
this._settleLineHeight = i ? i.lineHeight : 46;
this._settleContentY = e.resultContent ? e.resultContent.y : 108;
e.resultCloseBtn = this.findNode(e.resultPanel, "settleAgainBtn");
e.resultExitBtn = this.findNode(e.resultPanel, "settleExitBtn");
e.disbandBtn = this.findNode(e.resultPanel, "bbDisbandBtn");
e.resultCloseLabel = this.findNode(e.resultCloseBtn, "settleAgainBtnLabel");
e.resultExitLabel = this.findNode(e.resultExitBtn, "settleExitBtnLabel");
e.resultList = this.findNode(e.resultPanel, "result_list");
e.btnReady = this.findNode(e.resultPanel, "btnReady");
e.dissolvePanel = this.findNode(t, "dissolvePanel");
e.dissolveAgreeBtn = this.findNode(t, "dissolveAgreeBtn");
e.dissolveRejectBtn = this.findNode(t, "dissolveRejectBtn");
e.finalPanel = this.findNode(t, "game_result");
e.finalInfo = this.findNode(e.finalPanel, "bbFinalInfo");
e.finalBackBtn = this.findNode(e.finalPanel, "bbFinalBack");
e.finalJoinBtn = this.findNode(e.finalPanel, "bbFinalJoin");
e.finalClose = this.findNode(e.finalPanel, "btnClose");
e.finalCards = [];
for (var n = 0; n < 6; ++n) {
var a = this.findNode(e.finalPanel, "bbFinalCard" + n);
a && e.finalCards.push({
root: a,
bg: this.findNode(a, "bbCardBg"),
win: this.findNode(a, "bbWinTag"),
avatar: this.findNode(a, "bbAvatar"),
name: this.findNode(a, "bbPName"),
id: this.findNode(a, "bbPId"),
score: this.findNode(a, "bbPScore")
});
}
e.finalPanel && (e.finalPanel.active = !1);
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
var g = this.findNode(i, "bbDao" + h);
l.push(g);
}
var v = this.findNode(i, "bbSummary");
s && (s.active = !1);
this._seatNodes[t] = {
root: i,
icon: n,
userSprite: this.findNode(i, "username"),
nameLabel: a,
scoreLabel: o,
zhuang: s,
readyMark: c,
okSprite: this.findNode(i, "okSprite"),
cardsNode: this.findNode(i, "bbCards"),
slots: r,
daoLabels: l,
summary: v,
bubble: this.findNode(i, "bbBubble")
};
}
},
_setSeatCardsVisible: function(e) {
if (e && this._isArrangeTurn()) this._applyArrangeSeatVisible(); else {
for (var t = [], i = 0; i < this._seatNodes.length; ++i) {
var n = this._seatNodes[i];
if (n) {
n.cardsNode && (n.cardsNode.active = !!e);
if (!e && n.slots) for (var a = 0; a < n.slots.length; ++a) n.slots[a] && (n.slots[a].active = !1);
t.length < 6 && t.push((n.root ? n.root.name : "?") + ":" + (n.cardsNode ? "1" : "0"));
}
}
console.log("[BB] seatCards visible=" + e + " " + t.join(" "));
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
this._arrangeDelBtns = [];
for (var c = 0; c < 3; ++c) this._arrangeDelBtns.push(this.findNode(e, "bbArrDelX" + c));
this._arrangeCancelAllBtn = this.findNode(e, "bbCancelAllBtn");
this._n.bbArrClose = this.findNode(e, "bbArrCloseBtn");
this._n.bbArrReopen = this.findNode(this.node, "bbArrReopen");
this._n.bbArrReopen && (this._n.bbArrReopen.active = !1);
this._arrangeHandSlots = [];
this._arrangeHandHome = [];
for (var r = 0; r < 6; ++r) {
var l = this.findNode(e, "bbArrHand" + r);
this._arrangeHandSlots.push(l);
this._arrangeHandHome.push(l ? {
x: l.x,
y: l.y,
sx: l.scaleX,
sy: l.scaleY
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
this.bindButton(this._n.ruleBtn, this.onRuleOpen, this);
this.bindButton(this._n.ruleClose, this.onRuleClose, this);
this.bindButton(this._n.changeDeskBtn, this.onChangeDesk, this);
this.bindButton(this._n.shareBtn, this.onShareResult, this);
this.bindButton(this._n.disbandBtn, this.onExit, this);
this.bindButton(this._arrangeCancelAllBtn, this.onCancelAllArrange, this);
this.bindButton(this._n.bbArrClose, this.onArrangeCloseTap, this);
this.bindButton(this._n.bbArrReopen, this.onArrangeReopenTap, this);
this.bindButton(this._n.finalBackBtn, this.onFinalBack, this);
this.bindButton(this._n.finalJoinBtn, this.onFinalJoin, this);
this.bindButton(this._n.finalClose, this.onFinalBack, this);
for (var e = 0; e < 3; ++e) (function(e, t) {
this.bindButton(t, function() {
this.onDaoTap(e);
}, this);
}).call(this, e, this._arrangeDelBtns && this._arrangeDelBtns[e]);
var t = this._seatNodes[0];
if (t && t.slots) for (var i = 0; i < 6; ++i) (function(e, t) {
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
})(i, t.slots[i]);
},
_initChat: function() {
if (!this._chatInited) {
var e = this.node, t = function(t) {
for (var i = e.children, n = null, a = 0; a < i.length; ++a) i[a].name === t && (n = i[a]);
return n;
}, i = t("btn_chat"), n = t("chat");
if (i && n) {
this._chatInited = !0;
this._chatPanel = n;
n.active = !1;
var a = this, o = this.findNode(n, "chat_emojibg");
o && this.bindButton(o, function() {
n.active = !1;
}, this);
this.bindButton(i, function() {
n.active = !0;
}, this);
this._chatQuickList = this.findNode(n, "quickchatlist");
this._chatEmojiList = this.findNode(n, "emojis");
var s = this.findNode(n, "tabQuick"), c = this.findNode(n, "tabEmoji");
this.bindButton(s, function() {
a._switchChatTab(!0);
}, this);
this.bindButton(c, function() {
a._switchChatTab(!1);
}, this);
var r = this.findNode(n, "iptChat");
this._chatIpt = r ? r.getComponent(cc.EditBox) : null;
var l = [];
(function e(t) {
"btnSend" === t.name && l.push(t);
(t.children || []).forEach(e);
})(n);
l.forEach(function(e) {
e.width <= 60 ? a.bindButton(e, function() {
n.active = !1;
}, a) : a.bindButton(e, function() {
a._sendChatInput();
}, a);
});
if (r) {
r.on("editing-return", function() {
a._sendChatInput();
});
r.on("editing-did-ended", function() {
a._sendChatInput();
});
}
this._chatQuickInfo = {
0: {
content: "快点啊，都等到我花儿都谢谢了！"
},
1: {
content: "怎么又断线了，网络怎么这么差啊！"
},
2: {
content: "不要走，决战到天亮！"
},
3: {
content: "你的牌打得也太好了！"
},
4: {
content: "你是妹妹还是哥哥啊？"
},
5: {
content: "和你合作真是太愉快了！"
},
6: {
content: "大家好，很高兴见到各位！"
},
7: {
content: "各位，真是不好意思，我得离开一会儿。"
},
8: {
content: "不要吵了，专心玩游戏吧！"
}
};
this._bindChatItems(this._chatQuickList, !0);
this._bindChatItems(this._chatEmojiList, !1);
this._chatBubbles = [];
this._emojiFrames = {};
this._chatBgFrame = null;
var h = function(e) {
if (e) {
var t = e.children || [];
if (t.length > 0) for (var i = 0; i < t.length; ++i) h(t[i]); else if (e.name && "sp" !== e.name && "New Node" !== e.name) {
var n = e.getComponent(cc.Sprite), o = n && n.spriteFrame;
if (o) {
a._emojiFrames[e.name] = o;
a._emojiFrames[e.name + ".png"] = o;
}
}
}
};
h(this._chatEmojiList);
console.log("[BB] 场景表情帧=" + Object.keys(this._emojiFrames).length);
var d = this;
cc.resources.load("images/chat/emoji_action_texture", cc.SpriteAtlas, function(e, t) {
if (t) {
t.getSpriteFrames().forEach(function(e) {
d._emojiFrames[e.name + ".png"] = e;
d._emojiFrames[e.name] = e;
});
d._emojiAtlasLoaded = !0;
} else d._emojiAtlasLoaded = !1;
});
cc.resources.load("images/chat/chat_emojibg.png", cc.SpriteFrame, function(e, t) {
t && (d._chatBgFrame = t);
});
this._switchChatTab(!0);
console.log("[BB] 聊天已接上");
} else console.log("[BB] 场景里没有聊天节点, 跳过");
}
},
_switchChatTab: function(e) {
this._chatQuickList && (this._chatQuickList.active = !!e);
this._chatEmojiList && (this._chatEmojiList.active = !e);
},
_slotIdxOfUser: function(e) {
if (!e) return -1;
var t = cc.vv && cc.vv.gameNetMgr;
if (!t) return -1;
var i = null, n = 0;
if (this._started && t.bbSeats && t.bbSeats.length > 0) {
i = t.bbSeats;
n = this._mySeat || 0;
} else if (t.seats && t.seats.length > 0) {
i = t.seats;
n = t.seatIndex >= 0 ? t.seatIndex : 0;
}
if (!i) return -1;
for (var a = Math.max(2, Math.min(6, i.length)), o = 0; o < i.length; ++o) if (i[o] && i[o].userid == e) {
var s = (o - n + i.length) % i.length;
return s >= a ? -1 : this._layoutOf(a)[s];
}
return -1;
},
_showBubble: function(e, t, i) {
if (t) {
var n = this._slotIdxOfUser(e);
if (!(n < 0) && this._seatNodes[n] && this._seatNodes[n].root || !((n = this._seatNodes.findIndex(function(e) {
return e && e.root;
})) < 0)) {
var a = this._seatNodes[n], o = a.bubble;
if (o) {
var s = this.findNode(o, "bbBubbleText"), c = this.findNode(a.root, "bbBubbleEmoji");
if (i) {
var r = String(t).replace(/\.png$/i, ""), l = "smile" === r ? "smaile" : r, h = this._emojiFrames || {}, d = h[r] || h[l + "0.png"] || h[l] || null;
console.log("[BB] emoji-bubble 内容=" + r + " 取到=" + !!d + " 缓存帧数=" + Object.keys(h).length + " 表情节点=" + !!c + " 槽位=" + n);
if (c) {
c.active = !!d;
if (d) {
var u = c.getComponent(cc.Sprite);
if (u) {
u.enabled = !0;
u.sizeMode = cc.Sprite.SizeMode.CUSTOM;
u.spriteFrame = d;
}
}
}
if (s) {
s.active = !d;
if (!d) {
var g = s.getComponent(cc.Label);
g && (g.string = t);
}
}
o.active = !0;
var v = o.getComponent(cc.Sprite);
v && (v.enabled = !d);
} else {
c && (c.active = !1);
if (s) {
s.active = !0;
var m = s.getComponent(cc.Label);
if (m) {
m.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
var f = 20 + 20 * String(t).length;
f < 80 && (f = 80);
f > 240 && (f = 240);
s.width = f;
m.string = t;
}
}
o.active = !0;
var _ = o.getComponent(cc.Sprite);
_ && (_.enabled = !0);
}
!i && o.active && s && this.scheduleOnce(function() {
if (cc.isValid(o) && cc.isValid(s)) {
var e = Math.max(80, s.width + 20), t = Math.max(40, s.height + 16);
o.setContentSize(e, t);
}
}, 0);
a._bubbleSeq = (a._bubbleSeq || 0) + 1;
var p = a._bubbleSeq;
this.scheduleOnce(function() {
if (a._bubbleSeq === p) {
cc.isValid(o) && (o.active = !1);
cc.isValid(c) && (c.active = !1);
}
}, 2);
}
}
}
},
_bindChatItems: function(e, t) {
if (e) for (var i = this, n = function(e) {
if (t) {
var a = /^item(\d+)$/.exec(e.name);
a && i.bindButton(e, function() {
i._sendQuickChat(parseInt(a[1], 10));
}, i);
} else e.children && 0 === e.children.length && "sp" !== e.name && !/^cc/.test(e.name) && "New Node" !== e.name && i.bindButton(e, function() {
i._sendEmoji(e.name);
}, i);
for (var o = e.children || [], s = 0; s < o.length; ++s) n(o[s]);
}, a = e.children || [], o = 0; o < a.length; ++o) n(a[o]);
},
_sendChatInput: function() {
if (this._chatIpt) {
var e = (this._chatIpt.string || "").replace(/^\s+|\s+$/g, "");
if (e) {
this._chatIpt.string = "";
this._chatPanel && (this._chatPanel.active = !1);
var t = cc.vv && cc.vv.userMgr && cc.vv.userMgr.userId;
console.log("[BB] chat send: " + e);
this._showBubble(t, e, !1);
cc.vv && cc.vv.net && !this._replay && cc.vv.net.send("chat", e);
} else console.log("[BB] chat: 输入为空, 不发送");
} else console.log("[BB] chat: 输入框未绑定(iptChat缺失)");
},
_sendQuickChat: function(e) {
this._chatPanel && (this._chatPanel.active = !1);
var t = this._chatQuickInfo && this._chatQuickInfo[e];
console.log("[BB] quick_chat send: " + e);
if (t) {
var i = cc.vv && cc.vv.userMgr && cc.vv.userMgr.userId;
this._showBubble(i, t.content, !1);
}
cc.vv && cc.vv.net && !this._replay && cc.vv.net.send("quick_chat", e);
},
_sendEmoji: function(e) {
this._chatPanel && (this._chatPanel.active = !1);
var t = cc.vv && cc.vv.userMgr && cc.vv.userMgr.userId;
console.log("[BB] emoji send: " + e);
this._showBubble(t, e, !0);
cc.vv && cc.vv.net && !this._replay && cc.vv.net.send("emoji", e);
},
onChatPush: function(e) {
e && e.content && this._showBubble(e.sender, e.content, !1);
},
onQuickChatPush: function(e) {
if (e) {
var t = this._chatQuickInfo && this._chatQuickInfo[e.content];
if (t) {
this._showBubble(e.sender, t.content, !1);
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX(t.sound);
}
}
},
onEmojiPush: function(e) {
e && this._showBubble(e.sender, e.content, !0);
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
this.node.on("chat_push", function(t) {
e.onChatPush(t && t.detail);
});
this.node.on("quick_chat_push", function(t) {
e.onQuickChatPush(t && t.detail);
});
this.node.on("emoji_push", function(t) {
e.onEmojiPush(t && t.detail);
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
if ("begin" == e.gamestate && (e.bbMyCards && e.bbMyCards.length > 0 || e.bbWatching)) {
this._started = !0;
this._final = !1;
this._gameType = e.bbGameType;
this._applyBbConf(null);
this._watching = !!e.bbWatching;
this._mySeat = !this._watching && e.bbMySeat >= 0 ? e.bbMySeat : 0;
this._revealByGs = {};
e.bbMyDaos && 3 == e.bbMyDaos.length && (this._daoSel = this._normDaos(e.bbMyDaos));
this._showGameUI();
this.renderSeats();
this.renderCards();
if (this._watching) {
this.hideArrangeUI();
this.hideConfirmUI();
var t = e.bbReveal && e.bbReveal.players ? e.bbReveal.players : null;
if (t) {
for (var i = 0; i < t.length; ++i) null != t[i].seat && (this._revealByGs[t[i].seat] = t[i]);
this._revealCounts = [];
for (var n = 0; n < (this._total || 2); ++n) this._revealCounts.push(6);
this._revealDone = !0;
} else {
this._revealCounts = null;
this._revealDone = !1;
}
this.renderCards();
var a = e.seats && e.seatIndex >= 0 ? e.seats[e.seatIndex] : null, o = !(!a || !a.ready);
this._n.readyBtn && (this._n.readyBtn.active = !o);
this._n.exitBtn && (this._n.exitBtn.active = !0);
this.showTip(o ? "本局进行中，结束后自动加入下一局" : "本局进行中，观战中");
} else if ("baobao_shou" != this._gameType || "arrange" != e.bbPhase || e.bbArranged) {
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
} else {
if (e.bbArrangeDeadline) {
this._arrangeRemain = Math.max(0, Math.ceil((e.bbArrangeDeadline - Date.now()) / 1e3));
this._arrangeRemainAt = Date.now();
}
this.showArrangeUI(this._arrangeRemain);
}
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
_enterReplay: function(e) {
var t = this, i = cc.vv.gameNetMgr;
this._replay = e;
this._watching = !0;
this._mySeat = 0;
this._started = !0;
this._roundSeq = this._roundSeq || 0;
for (var n = cc.vv.userMgr && cc.vv.userMgr.userId, a = e.events || [], o = null, s = null, c = null, r = null, l = null, h = 0; h < a.length; ++h) {
var d = a[h];
if (d && d.d) if ("bb_start_push" == d.e) {
o || (o = d.d);
s || d.u != n || (s = d.d);
} else if ("bb_reveal_push" == d.e) c || (c = d.d); else if ("game_over_push" == d.e) {
l || (l = d.d);
r || d.u != n || (r = d.d);
}
}
var u = o && o.seats || [], g = Math.max(2, Math.min(6, u.length || (e.players || []).length)), v = [ "seats", "seatIndex", "bbSeats", "bbMySeat", "bbBankerSeat", "bbBankerMode", "bbGameType", "bbMyCards", "bbMyDaos", "bbPhase", "bbArranged", "conf", "roomId", "numOfGames", "maxNumOfGames", "overData", "bbOverDetails", "gamestate" ];
this._savedNm = {};
for (var m = 0; m < v.length; ++m) this._savedNm[v[m]] = i[v[m]];
var f = r || l || {}, _ = f.results || [], p = [], C = [];
for (h = 0; h < 6; ++h) C.push(null);
for (h = 0; h < g; ++h) {
var b = u[h] || e.players && e.players[h] || {}, y = null != b.roomSeatIndex ? b.roomSeatIndex : h;
p.push({
userid: b.userid,
name: b.name || "",
sex: b.sex || 0,
seatindex: h,
roomSeatIndex: y,
arranged: !0
});
C[y] = {
userid: b.userid,
name: b.name || "",
score: 0,
ready: !0
};
}
for (h = 0; h < _.length; ++h) {
var N = _[h];
if (N) {
var S = null != N.roomSeatIndex ? N.roomSeatIndex : h;
C[S] && null != N.totalscore && (C[S].score = N.totalscore);
}
}
i.seats = C;
i.seatIndex = 0;
i.bbSeats = p;
i.bbMySeat = s && null != s.mySeat ? s.mySeat : 0;
i.bbBankerSeat = o && null != o.bankerSeat ? o.bankerSeat : -1;
i.bbBankerMode = !(!o || !o.bankerMode);
i.bbGameType = o && o.gameType || e.type;
i.bbMyCards = s && s.myCards || [];
i.bbMyDaos = null;
i.bbPhase = null;
i.bbArranged = !0;
i.conf = o && o.conf || {};
i.conf.type || (i.conf.type = e.type);
i.roomId = e.roomid || 0;
i.numOfGames = e.index || 1;
i.maxNumOfGames = i.conf.maxGames || 0;
i.overData = f;
i.bbOverDetails = f.details || null;
i.gamestate = "begin";
this._gameType = i.bbGameType;
this._total = g;
this._showGameUI();
this._n.ruleWin && (this._n.ruleWin.active = !1);
cc.vv.bbExitHook = function() {
t._exitReplay();
};
this._revealByGs = {};
this._revealCounts = null;
this.renderSeats();
this.renderCards();
this.updateRoomInfo();
this.showTip("回放 · 第" + i.numOfGames + "局");
this._showReplayBar();
if (f.results) {
this._lastOver = f;
this._lastOverSeq = this._roundSeq;
}
this.scheduleOnce(function() {
cc.isValid(t.node) && (c ? t.onBbReveal(c) : f.results ? t.applyGameOver(f, null) : t.showTip("该局录像不完整"));
}, 1.2);
},
_showReplayBar: function() {
var e = this._replayBar = this._replayBar || this.findNode(this.node, "replay");
if (e) {
e.active = !0;
for (var t = [ [ "btn_pause", this._pauseReplay ], [ "btn_play", this._resumeReplay ], [ "btn_back", this._exitReplay ] ], i = 0; i < t.length; ++i) {
var n = this.findNode(e, t[i][0]);
if (n) {
var a = n.getComponent(cc.Button);
a && (a.clickEvents = []);
this.bindButton(n, t[i][1], this);
}
}
this._setReplayPaused(!1);
} else console.log("[BB] 场景缺少 replay 控制条节点");
},
_setReplayPaused: function(e) {
this._replayPaused = !!e;
if (this._replayBar) {
var t = this.findNode(this._replayBar, "btn_pause"), i = this.findNode(this._replayBar, "btn_play");
t && (t.active = !e);
i && (i.active = e);
}
},
_pauseReplay: function() {
if (this._replay && !this._replayPaused) {
this._setReplayPaused(!0);
cc.director.getScheduler().pauseTarget(this);
cc.audioEngine && cc.audioEngine.pauseAll();
}
},
_resumeReplay: function() {
if (this._replay && this._replayPaused) {
this._setReplayPaused(!1);
cc.director.getScheduler().resumeTarget(this);
cc.audioEngine && cc.audioEngine.resumeAll();
}
},
_exitReplay: function() {
if (!this._leaving) {
this._leaving = !0;
cc.director.getScheduler().resumeTarget(this);
cc.audioEngine && cc.audioEngine.resumeAll();
cc.vv && (cc.vv.bbReplayData = null);
cc.director.loadScene("club");
}
},
_clearChatBubbles: function() {
for (var e = 0; e < this._chatBubbles.length; ++e) cc.isValid(this._chatBubbles[e]) && this._chatBubbles[e].destroy();
this._chatBubbles = [];
},
showPrepareUI: function() {
this._started = !1;
this._arranging = !1;
this._revealByGs = {};
this.hideArrangeUI();
this.hideConfirmUI();
this._n.bbMidCd && this._setMidCd(!1);
this._n.ruleWin && (this._n.ruleWin.active = !1);
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
if (this._confirmAutoBtn) {
this._confirmAutoBtn.active = !0;
this._confirmAutoBtn.opacity = 255;
}
if (this._confirmBtn) {
this._confirmBtn.active = !0;
this._confirmBtn.opacity = 120;
}
this._confirmCd && (this._confirmCd.active = !0);
this._fillConfirmCards();
this._confirmCount = 0;
this._startCountdown(this._leftOf(null != this._confirmRemain ? this._confirmRemain : e.bbConfirmRemain || 0, this._confirmRemainAt), this._confirmCd, function() {
this.hideConfirmUI();
this.showTip("超时未操作，系统自动免摆亮牌");
cc.vv.net.send("bb_confirm");
});
} else console.error("[BB] 场景内找不到 bbConfirm 节点");
},
showMianFreeUI: function() {
var e = cc.vv.gameNetMgr;
this._buildConfirmUI();
var t = this._confirmRoot;
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
this._confirmTitle && this.setStr(this._confirmTitle, "免摆");
this._confirmType && this.setStr(this._confirmType, a ? (a.typeName || "") + "  ×" + (a.rate || 1) : "");
if (this._confirmHint) {
this._confirmHint.active = !0;
this.setStr(this._confirmHint, "免摆无需摆牌，点确定等待亮牌");
}
this._confirmCd && this.setStr(this._confirmCd, "");
if (this._confirmBtn) {
this._confirmBtn.active = !0;
this.bindButton(this._confirmBtn, this.onConfirmMianFree, this);
}
this._confirmAutoBtn && (this._confirmAutoBtn.active = !1);
this._confirmAutoShown = !0;
this._confirmMoving = !1;
this._fillConfirmCards();
console.log("[BB] 手摆免摆弹窗 mian=" + JSON.stringify(a));
} else console.error("[BB] 场景内找不到 bbConfirm 节点");
},
onConfirmMianFree: function() {
var e = cc.vv.gameNetMgr;
if (this._confirmRoot && this._confirmRoot.active && !e.bbMianConfirmed) {
var t = this.autoArrangeLocal((e.bbMyCards || []).slice());
if (t) {
e.bbMianConfirmed = !0;
cc.vv.net.send("bb_arrange", {
front: t[0].slice(),
mid: t[1].slice(),
back: t[2].slice()
});
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("sort.wav");
this.hideConfirmUI();
this._stopCountdown();
if (this._n.bbMidCd) {
this._setMidCd(!0);
this._startCountdown(this._leftOf(this._arrangeRemain, this._arrangeRemainAt), this._n.bbMidCd, null);
}
this.showTip("已确定，等待其他玩家…");
} else this.showTip("牌数据异常，请重进");
}
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
_setMidCd: function(e) {
var t = this._n.bbMidCd;
if (t && cc.isValid(t)) {
t.active = !!e;
var i = t.parent;
i && i !== this._n.game && "djsSprite" === i.name && (i.active = !!e);
}
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
if (this._savedNm && cc.vv && cc.vv.gameNetMgr) {
for (var e in this._savedNm) cc.vv.gameNetMgr[e] = this._savedNm[e];
this._savedNm = null;
}
this._replay && cc.vv && (cc.vv.bbReplayData = null);
},
_layoutOf: function(e) {
e = Math.max(2, Math.min(6, e));
return this.seatLayout(e);
},
_seatInfoOfOffsetInGame: function(e, t) {
var i = cc.vv.gameNetMgr, n = this._watching ? e : (this._mySeat + e) % t, a = i.bbSeats ? i.bbSeats[n] : null, o = a && i.seats ? i.seats[a.roomSeatIndex] : null;
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
var a = t.seats || [], o = a.length, s = t.seatIndex >= 0 ? t.seatIndex : 0;
e = Math.max(2, Math.min(6, o));
this._total = e;
for (var c = 0; c < o; ++c) {
var r = (c - s + o) % o;
if (!(r >= e)) {
var l = a[c];
l && l.userid ? i.push({
offset: r,
info: {
gs: c,
userid: l.userid,
name: l.name || "",
score: null != l.score ? l.score : 0,
isBanker: !1,
ready: !!l.ready
}
}) : i.push({
offset: r,
info: {
gs: c,
userid: null,
name: "",
score: null,
isBanker: !1,
ready: !1,
empty: !0
}
});
}
}
}
for (var h = 0; h < 6; ++h) {
var d = this._seatNodes[h];
if (d) {
d.root.active = !1;
d.okSprite && (d.okSprite.active = !1);
d.userSprite && (d.userSprite.color = cc.Color.WHITE);
if (d.icon) {
var u = d.icon.getComponent("ImageLoader");
if (u) u.clearAvatar ? u.clearAvatar() : (u._spriteFrame = null, u.setupSpriteFrame()); else {
var g = d.icon.getComponent(cc.Sprite);
g && (g.spriteFrame = null);
}
}
}
}
for (var v = this._layoutOf(e), m = 0; m < i.length; ++m) {
var f = v[i[m].offset], _ = this._seatNodes[f];
if (_) {
_.root.active = !0;
if (i[m].info.empty) {
this.setStr(_.nameLabel, "");
this.setStr(_.scoreLabel, "");
_.zhuang && (_.zhuang.active = !1);
_.readyMark && (_.readyMark.active = !1);
_.okSprite && (_.okSprite.active = !1);
_.icon && (_.icon.active = !1);
if (_.userSprite) {
_.userSprite.active = !0;
_.userSprite.color = cc.Color.WHITE;
}
} else {
_.icon && (_.icon.active = !0);
_.userSprite && (_.userSprite.color = cc.Color.WHITE);
this.setStr(_.nameLabel, i[m].info.name || "");
this.setStr(_.scoreLabel, null != i[m].info.score ? "" + i[m].info.score : "");
_.zhuang && (_.zhuang.active = !!i[m].info.isBanker);
_.readyMark && (_.readyMark.active = !!i[m].info.ready);
_.okSprite && (_.okSprite.active = !this._started && !!i[m].info.ready);
if (_.icon) {
var p = _.icon.getComponent("ImageLoader");
if (!p) try {
p = _.icon.addComponent("ImageLoader");
} catch (e) {}
p && i[m].info.userid && p.setUserID(i[m].info.userid);
}
}
}
}
},
updateRoomInfo: function() {
var e = cc.vv.gameNetMgr, t = e.conf || {}, i = "血战宝宝";
"baobao_mian" === t.type ? i = "免摆宝宝" : "baobao_shou" === t.type ? i = "血战宝宝" : t.type && (i = t.type);
var n = "记号:" + i + "  底分:" + (null != t.baseScore ? t.baseScore : null != t.base ? t.base : 1) + "  局数:" + (null != t.maxGames ? t.maxGames : null != t.jushuxuanze ? t.jushuxuanze : "-");
n += "  入场:" + (Number(t.min_bean) || 0) + "  离场:" + (Number(t.kick_bean) || 0);
e.maxNumOfGames > 0 && (n += "  第" + e.numOfGames + "/" + e.maxNumOfGames + "局");
this.setStr(this._n.titleLabel, n);
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
(cc.vv.gameNetMgr.bbMyCards || []).slice();
for (var e = this._total || 2, t = 0; t < 6; ++t) {
var i = this._seatNodes[t];
if (i) {
for (var n = 0; n < 6; ++n) i.slots[n] && (i.slots[n].active = !1);
for (var a = 0; a < 3; ++a) this.setStr(i.daoLabels[a], "");
this.setStr(i.summary, "");
}
}
if (this._started) {
for (var o = 0; o < e; ++o) {
var s = this._seatNodes[this._layoutOf(e)[o]];
if (s && s.root.active) {
var c = this._watching ? o : (this._mySeat + o) % e;
if (!s.cardsNode || s.cardsNode.active) {
var r = this._revealCounts && this._revealCounts[o] || 0, l = r > 0 && this._revealByGs[c] || null, h = !this._watching && 0 == o, d = [], u = !1, g = [ "", "", "" ], v = "";
if (l) {
if (l.daos) {
for (var m = 0; m < l.daos.length; ++m) {
d = d.concat(l.daos[m].cards || []);
g[m] = l.daos[m].desc;
}
l.mianFree ? v = l.typeName || "" : l.wulong ? v = "乌龙(三道全输)" : l.auto && (v = "系统自动摆牌");
} else if (l.groups) {
for (var f = 0; f < l.groups.length; ++f) d = d.concat(l.groups[f] || []);
v = l.typeName || "";
} else if (l.mianFree && l.cards) {
d = (l.cards || []).slice();
v = l.typeName || "";
}
for (var _ = 0; _ < 3; ++_) r < 2 * (_ + 1) && (g[_] = "");
r < 6 && (v = "");
} else u = !0;
for (var p = 0; p < 6; ++p) {
var C = s.slots[p];
if (C) {
var b = C.getComponent(cc.Sprite);
C.active = !0;
if (u || l && p >= r) {
b && (b.spriteFrame = this._cardBack || null);
C.color = cc.Color.WHITE;
} else if (null != d[p]) {
b && (b.spriteFrame = this.frameOf(d[p]) || this._cardBack || null);
var y = this._arranging && h && !l && this._isUsed(d[p]);
C.color = y ? cc.color(120, 120, 120) : cc.Color.WHITE;
} else C.active = !1;
}
}
for (var N = 0; N < 3; ++N) this.setStr(s.daoLabels[N], g[N]);
this.setStr(s.summary, "baobao_mian" == this._gameType ? "" : v);
}
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
var t = cc.vv.gameNetMgr;
this._n.resultPanel && (this._n.resultPanel.active = !1);
this._n.finalPanel && (this._n.finalPanel.active = !1);
if (this.hideConfirmUI) try {
this.hideConfirmUI();
} catch (e) {}
if (this.hideArrangeUI) try {
this.hideArrangeUI();
} catch (e) {}
this._stopCountdown();
t.overData = null;
t.bbOverDetails = null;
t.bbPhase = null;
t.bbMyMian = null;
t.bbArranged = !1;
this._endDetail = null;
this._lastResults = null;
var i = e && e.shuffle || this._shufflePending;
if (this._settleClosedAt) {
var n = Date.now() - this._settleClosedAt;
console.log("[BB][时序] 结算关闭→收到开局 " + n + "ms" + (e && e.resend ? " (补发)" : "") + (i ? " +洗牌动画" : ""));
n > 1500 && console.warn("[BB][时序] 开局推送延迟 " + n + "ms, 请对照服务端 [宝宝][时序] bb_start 时间");
this._settleClosedAt = 0;
}
this._shufflePending = !1;
this._roundSeq = (this._roundSeq || 0) + 1;
this._started = !0;
this._watching = !(!e || !(e.watching || e.mySeat < 0));
this._final = !1;
this._roomEnd = !1;
this._settle1Done = !0;
this._summaryShown = !1;
this._endDetail = null;
this._arranging = !1;
this._inArrangePhase = !1;
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
this._daqiangList = [];
this._quanleidaList = [];
this._gameType = e ? e.gameType : t.bbGameType;
this._applyBbConf(e);
t.bbMianFree = !(!e || !e.mianFree);
t.bbMianConfirmed = !1;
this._mySeat = e && null != e.mySeat ? e.mySeat : t.bbMySeat >= 0 ? t.bbMySeat : 0;
e && e.myDaos && 3 == e.myDaos.length && (this._daoSel = this._normDaos(e.myDaos));
try {
this._showGameUI();
this.updateRoomInfo();
this.renderSeats();
} catch (e) {
console.error("[BB] 开局UI异常", e);
}
if (this._watching) {
this.hideConfirmUI();
this.hideArrangeUI();
this._stopCountdown();
this._dealing = !1;
this._animBusy = !1;
var a = e && e.reveal && e.reveal.players ? e.reveal.players : null;
if (a) {
this._revealByGs = {};
for (var o = 0; o < a.length; ++o) null != a[o].seat && (this._revealByGs[a[o].seat] = a[o]);
this._revealCounts = [];
for (var s = 0; s < (this._total || 2); ++s) this._revealCounts.push(6);
this._revealDone = !0;
} else {
this._revealByGs = {};
this._revealCounts = null;
this._revealDone = !1;
}
this.renderCards();
var c = cc.vv.gameNetMgr, r = c.seats && c.seatIndex >= 0 ? c.seats[c.seatIndex] : null, l = !(!r || !r.ready);
this._n.readyBtn && (this._n.readyBtn.active = !l);
this._n.exitBtn && (this._n.exitBtn.active = !0);
this.showTip(l ? "本局进行中，结束后自动加入下一局" : "本局进行中，观战中");
} else {
var h = this;
if (e && e.resend) {
this._dealing = !1;
try {
this.renderCards();
this._showPhaseUI(e, t);
} catch (e) {
console.error("[BB] 补发恢复异常", e);
}
} else {
var d = !1;
try {
if (i) {
this._animBusy = !0;
this._clearCards();
this._playShuffleAnim(g);
this.scheduleOnce(function() {
if (!d) {
console.warn("[BB] 洗牌动画未回调, 强制进入发牌");
h._animBusy = !1;
g();
}
}, 2.6);
} else {
this.renderCards();
g();
}
} catch (e) {
console.error("[BB] 开局渲染异常, 兜底直接发牌", e);
this._animBusy = !1;
this._dealing = !1;
g();
}
}
}
function u() {
console.log("[BB][时序] 开始发牌 距收到开局 " + (Date.now() - h._pushAt) + "ms");
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("start_game.mp3");
try {
h._fxStartAnim();
} catch (e) {
console.log("[BB] 开局动画异常", e && e.message);
}
e && e.bankerMode && null != e.bankerSeat && e.bankerSeat >= 0 && h.scheduleOnce(function() {
cc.isValid(h.node) && cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("dingzhuang.mp3");
}, .8);
try {
h._dealSeq(function() {
if (h._started) {
var i = 150 + (h._startFrames && h._startFrames.length ? 50 * h._startFrames.length : 0);
console.log("[BB] 开局动画gate " + i + "ms 后弹阶段弹窗");
h.scheduleOnce(function() {
h._animBusy = !1;
if (h._started && cc.isValid(h.node)) try {
h._showPhaseUI(e, t);
} catch (e) {
console.error("[BB] 阶段UI异常", e);
}
}, i / 1e3);
h._startArrangeWatchdog();
}
});
} catch (i) {
console.error("[BB] 发牌异常, 直接显示阶段UI", i);
h._animBusy = !1;
h._dealing = !1;
try {
h.renderCards();
h._showPhaseUI(e, t);
} catch (e) {
console.error("[BB] 阶段UI异常", e);
}
}
}
function g() {
if (!d) {
d = !0;
u();
}
}
},
_showPhaseUI: function(e, t) {
this._inArrangePhase = !1;
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
this._inArrangePhase = !0;
this.hideConfirmUI();
e.mianFree && e.myMian && (t.bbMyMian = e.myMian);
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
this._inArrangePhase = !0;
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
this._startArrangeWatchdog();
}
},
_startArrangeWatchdog: function() {
var e = this;
this.scheduleOnce(function() {
if (cc.isValid(e.node) && e._started) {
var t = cc.vv.gameNetMgr;
if (t && !t.bbArranged && "baobao_shou" == e._gameType && !(e._arranging && e._arrangeRoot && e._arrangeRoot.active)) {
console.warn("[BB] 摆牌弹窗超时未出现, 看门狗强开");
e._animBusy = !1;
e.showArrangeUI(e._arrangeRemain);
}
}
}, 6);
},
onArrangeOk: function(e) {
var t = cc.vv.gameNetMgr;
if (e && null != e.seatIndex && t.bbSeats && t.bbSeats[e.seatIndex]) {
t.bbSeats[e.seatIndex].arranged = !0;
e.seatIndex == t.bbMySeat && (t.bbArranged = !0);
var i = t.bbSeats[e.seatIndex].userid, n = this._slotIdxOfUser(i);
n >= 0 && this._seatNodes[n] && this._seatNodes[n].cardsNode && (this._seatNodes[n].cardsNode.active = !0);
}
this.renderSeats();
this.renderCards();
if (e && null != e.arrangedCount) {
var a = (t.bbSeats || []).length;
this.showTip("已摆牌 " + e.arrangedCount + "/" + a + "，等待其他玩家…");
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
this._dealing = !1;
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("deal.wav");
this._resetSlotPos();
this.renderCards();
if (e) try {
e();
} catch (e) {
console.error("[BB] 发牌完成回调异常", e);
}
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
if (e && e.players && this._started && (!this._n.resultPanel || !this._n.resultPanel.active)) {
for (var t = cc.vv.gameNetMgr, i = cc.vv && cc.vv.userMgr && cc.vv.userMgr.userId, n = e.seats || t.bbSeats || [], a = !1, o = 0; o < n.length; ++o) if (n[o] && n[o].userid == i) {
a = !0;
break;
}
a || (this._watching = !0);
this._stopDeal();
this._revealRunning = !0;
this._inArrangePhase = !1;
this.hideConfirmUI();
this.hideArrangeUI();
this._arranging = !1;
this._stopCountdown();
this._n.bbMidCd && this._setMidCd(!1);
this._daqiangList = e.daqiang || [];
this._quanleidaList = e.quanleida || [];
this._revealByGs = {};
for (var s = 0; s < e.players.length; ++s) {
var c = e.players[s];
null != c.seat && (this._revealByGs[c.seat] = c);
}
for (var r = e.players.length, l = [], h = 0; h < (this._total || r); ++h) l.push(0);
this._revealCounts = l;
this._revealDone = !1;
this._revealRunning = !0;
this._resetSlotPos();
this.renderCards();
console.log("[BB] 亮牌开始 座位顺序=" + Object.keys(this._revealByGs).join(",") + " 共" + r + "家 打枪" + this._daqiangList.length + "对 全垒打" + this._quanleidaList.length);
var d = this;
this._playVoice(this._mySex(), "begin");
var u = this._total || 2, g = this._layoutOf(u), v = null != e.bankerSeat && e.bankerSeat >= 0 ? e.bankerSeat : 0;
this._revealOrder = [];
for (var m = 0; m < u && this._revealOrder.length < r; ++m) {
var f = (v + m) % u;
this._revealByGs[f] && this._revealOrder.push(f);
}
for (var _ = 0; _ < e.players.length; ++_) {
var p = e.players[_].seat;
null != p && this._revealOrder.indexOf(p) < 0 && this._revealOrder.push(p);
}
for (var C = 0, b = 0; b < 3; ++b) for (var y = 0; y < this._revealOrder.length; ++y) {
(function(e, i, n) {
d.scheduleOnce(function() {
if (cc.isValid(d.node)) {
var n = d._revealOrder[i], a = d._watching ? n : (n - d._mySeat + u) % u, o = g[a], s = d._revealByGs[n], c = t.bbSeats && t.bbSeats[n] && t.bbSeats[n].name || "";
d.showTip("亮牌 " + c);
d._revealCounts[a] = 2 * (e + 1);
if (null != o) {
d._flipOne(o, 2 * e);
d._flipOne(o, 2 * e + 1);
}
d.renderCards();
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("fanpai.mp3");
s && d._reportDaoVoice(s, e);
}
}, 1.5 * n);
})(b, y, C);
C++;
}
this.scheduleOnce(function() {
if (cc.isValid(d.node)) try {
d._playDaqiangFx(N);
} catch (e) {
console.log("[BB] 打枪特效异常:", e && e.message);
N();
}
}, 1.5 * C);
}
function N() {
if (!d._revealDone) {
d._revealRunning = !1;
d._revealDone = !0;
d.showTip("");
console.log("[BB] 亮牌结束");
var e = function() {
if (cc.isValid(d.node)) {
d._fxRunning = !0;
d.scheduleOnce(function() {
if (cc.isValid(d.node)) {
d._fxRunning = !1;
if (d._pendingOver || d._lastOver) {
var e = d._pendingOver || d._lastOver, t = d._pendingOver ? d._pendingSeq : d._lastOverSeq;
d._pendingOver = null;
d._lastOver = null;
d._pendingSeq = null;
d._lastOverSeq = null;
d.applyGameOver(e, t);
}
}
}, .25);
}
};
try {
d._playHandFx(e);
} catch (t) {
console.log("[BB] 牌型特效异常:", t && t.message);
d._fxRunning = !1;
d._clearFxNodes();
e();
}
}
}
},
_reportDaoVoice: function(e, t) {
var i = e.sex || 0, n = (e.daos || [])[t];
if (n && n.desc) {
var a = this._voiceOfDao(n.desc);
a && this._playVoice(i, a);
}
(e.mianFree || e.groups && !e.daos) && 2 == t && this._playVoice(i, "lipai");
},
_voiceOfDao: function(e) {
if (!e) return null;
if (0 == ("" + e).indexOf("对") || 0 == ("" + e).indexOf("宝")) return "bao";
var t = ("" + e).match(/^(\d+)/);
return t ? "dian" + +t[1] : null;
},
_playVoice: function(e, t) {
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("bb/" + (2 == e ? "nv" : "nan") + "/" + t + ".mp3");
},
_playVoiceDelay: function(e, t, i) {
var n = this;
setTimeout(function() {
cc.isValid(n.node) && n._playVoice(e, t);
}, i);
},
_mySex: function() {
return cc.vv && cc.vv.userMgr && cc.vv.userMgr.sex || 1;
},
_animOn: function(e, t) {
var i = cc.vv && cc.vv.gameNetMgr, n = i && i.conf && i.conf.taiRules;
if ("string" == typeof n) try {
n = JSON.parse(n);
} catch (e) {
n = null;
}
var a = n && Number(n[e]) || 0;
return t ? a : a > 0;
},
_playDaqiangFx: function(e) {
var t = this, i = this._animOn("anim_dq") && this._daqiangList || [], n = this._animOn("anim_qld") && this._quanleidaList || [];
if (i.length || n.length) {
var a = 0;
(function o() {
if (cc.isValid(t.node)) if (a >= i.length) if (n.length) {
var s = t._revealByGs[n[0]];
t._playVoice(s && s.sex, "quanleida");
t._fxQuanleida();
t.scheduleOnce(function() {
e && e();
}, 2);
} else e && e(); else {
var c = i[a++], r = t._revealByGs[c.from];
t._playVoice(r && r.sex, "daqiang");
for (var l = 0; l < 3; ++l) setTimeout(function() {
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("da_qiang_one.mp3");
}, 300 * l);
t._fxGunShot(c.from, c.to);
t.scheduleOnce(o, 1.5);
}
})();
} else e && e();
},
_fxQuanleida: function() {
var e = this._qldFrames;
if (e && e.length) {
var t = this._tableCenter(), i = this._fxNode(t, "bbFxQld"), n = i.addComponent(cc.Sprite);
n.spriteFrame = e[0];
i.setScale(1.5);
var a = 0, o = e.length, s = setInterval(function() {
if (cc.isValid(i)) if (++a >= o) {
clearInterval(s);
i.destroy();
} else n.spriteFrame = e[a]; else clearInterval(s);
}, 60);
}
},
_fxStartAnim: function() {
var e = this._startFrames;
if (e && e.length) {
var t = this._tableCenter(), i = this._fxNode(t, "bbFxStart"), n = i.addComponent(cc.Sprite);
n.spriteFrame = e[0];
var a = e[0].getOriginalSize().width, o = e[0].getOriginalSize().height;
i.setScale(.9 * Math.min(cc.winSize.width / a, cc.winSize.height / o));
var s = 0, c = e.length, r = setInterval(function() {
if (cc.isValid(i)) if (++s >= c) {
clearInterval(r);
i.destroy();
} else n.spriteFrame = e[s]; else clearInterval(r);
}, 50);
}
},
_fxGunShot: function(e, t) {
var i = this._total || 2, n = this._watching ? e : (e - this._mySeat + i) % i, a = this._watching ? t : (t - this._mySeat + i) % i, o = this._avatarLocalPos(n), s = this._avatarLocalPos(a), c = this._dqFrames;
if (o && c && c.length) {
var r = this._fxNode(o, "bbFxDq"), l = r.addComponent(cc.Sprite);
l.spriteFrame = c[0];
if (s) {
var h = 180 * Math.atan2(s.y - o.y, s.x - o.x) / Math.PI;
if (s.x < o.x) {
r.scaleX = -.8;
r.scaleY = .8;
r.angle = h + 180;
} else {
r.setScale(.8);
r.angle = h;
}
} else r.setScale(.8);
var d = 0, u = c.length, g = setInterval(function() {
if (cc.isValid(r)) if (++d >= u) {
clearInterval(g);
r.destroy();
} else l.spriteFrame = c[d]; else clearInterval(g);
}, 100);
} else if (o) {
var v = this._fxNode(o, "bbFxDq").addComponent(cc.Graphics);
v.fillColor = cc.color(255, 60, 0, 220);
v.circle(0, 0, 40);
v.fill();
v.node.setScale(.2);
v.node.runAction(cc.sequence(cc.scaleTo(.2, 1), cc.delayTime(.6), cc.fadeOut(.3), cc.removeSelf()));
}
var m = this._zqFrames;
if (s && m && m.length) {
var f = this._fxNode(s, "bbFxZq"), _ = f.addComponent(cc.Sprite);
_.spriteFrame = m[0];
var p = 0, C = m.length, b = setInterval(function() {
if (cc.isValid(f)) if (++p >= C) {
clearInterval(b);
f.destroy();
} else _.spriteFrame = m[p]; else clearInterval(b);
}, 400);
}
},
showArrangeUI: function(e) {
this._arranging = !0;
this._inArrangePhase = !0;
this._wulongWarned = !1;
this._arrangeRemain = null != e ? e : this._arrangeRemain || 0;
var t = cc.vv.gameNetMgr;
if (t.bbMianFree) {
for (var i = !0, n = 0; n < 3; ++n) if (this._daoSel[n] && (null != this._daoSel[n][0] || null != this._daoSel[n][1])) {
i = !1;
break;
}
if (i) {
var a = this.autoArrangeLocal((t.bbMyCards || []).slice());
a && (this._daoSel = [ a[0].slice(), a[1].slice(), a[2].slice() ]);
}
}
this._n.bbMidCd && this._setMidCd(!1);
this._n.bbArrReopen && (this._n.bbArrReopen.active = !1);
if (this._arrangeRoot) {
this._arrangeRoot.active = !0;
this._arrangeRoot.parent && this._arrangeRoot.setSiblingIndex(this._arrangeRoot.parent.children.length - 1);
}
this._playVoice(this._mySex(), "qingchupai");
this._resetArrangeSlotPos();
this._arrangeTipActive = !1;
this._arrangeWarnSeq = (this._arrangeWarnSeq || 0) + 1;
this._renderArrange();
this.renderCards();
this._setSeatCardsVisible(!1);
t.bbMianFree && t.bbMyMian ? this.showTip("免摆牌型：" + t.bbMyMian.typeName + " ×" + (t.bbMyMian.rate || 1) + "，已预填最优摆法，可调整或确定") : this.showTip("请摆牌：拖手牌到前/中/后道位，道内牌可再拖动换位，点道内牌退回");
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
this._n.bbArrReopen && (this._n.bbArrReopen.active = !1);
this._arrangeCd && this.setStr(this._arrangeCd, "");
this._stopCountdown();
this._restoreSeatCardsVisible();
},
_isArrangeTurn: function() {
if (this._revealDone || this._revealRunning) return !1;
if (!this._started || "baobao_shou" != this._gameType) return !1;
var e = cc.vv.gameNetMgr;
return !!(this._inArrangePhase || this._arranging || e && "arrange" == e.bbPhase);
},
_restoreSeatCardsVisible: function() {
this._isArrangeTurn() ? this._applyArrangeSeatVisible() : this._setSeatCardsVisible(!0);
},
_applyArrangeSeatVisible: function() {
for (var e = cc.vv.gameNetMgr, t = this._total || 2, i = this._layoutOf(t), n = e && e.bbSeats || [], a = {}, o = 0; o < n.length; ++o) {
var s = (o - (this._mySeat || 0) + n.length) % n.length;
s >= t || (a[i[s]] = !(!n[o] || !n[o].arranged));
}
for (var c = 0; c < this._seatNodes.length; ++c) {
var r = this._seatNodes[c];
r && r.cardsNode && (r.cardsNode.active = !!a[c]);
}
},
onArrangeCloseTap: function() {
if (this._arranging) {
this._arrangeRoot && (this._arrangeRoot.active = !1);
this._n.bbArrReopen && (this._n.bbArrReopen.active = !0);
}
},
onArrangeReopenTap: function() {
if (this._arranging) {
if (this._arrangeRoot) {
this._arrangeRoot.active = !0;
this._arrangeRoot.parent && this._arrangeRoot.setSiblingIndex(this._arrangeRoot.parent.children.length - 1);
}
this._n.bbArrReopen && (this._n.bbArrReopen.active = !1);
}
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
for (var t = this._arrangeRows || [], i = this._arrangeDaoHome || [], n = null, a = 0, o = 0, s = -1, c = null, r = 0; r < t.length; ++r) {
var l = i[r];
if (l) for (var h = 0; h < 2; ++h) {
var d = t[r].slots[h];
if (d && d.parent && l[h]) {
var u = d.parent.convertToWorldSpaceAR(cc.v2(l[h].x, l[h].y)), g = e.x - u.x, v = e.y - u.y, m = g * g + v * v;
if (s < 0 || m < s) {
s = m;
a = g;
o = v;
n = {
d: r,
k: h
};
c = d;
}
}
}
}
if (!n) return null;
var f = .5 * (c ? c.width : 84) + 24, _ = .5 * (c ? c.height : 116) + 24;
return a * a / (f * f) + o * o / (_ * _) > 1 ? null : n;
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
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("select.wav");
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
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("select.wav");
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
this._arrangeTip && !this._arrangeTipActive && this.setStr(this._arrangeTip, this._daoOrderOkLocal() ? "拖手牌到道位放入, 道内牌可再拖动换位, 点道内牌退回; 前道 ≥ 中道 ≥ 后道" : "警告: 当前摆法 前<中 或 中<后, 将判乌龙三道全输!");
}
},
daoDescText: function(e, t) {
var i = this.rankOf(e), n = this.rankOf(t);
return i == n ? "对" + ({
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
var e = cc.vv && cc.vv.userMgr && cc.vv.userMgr.userId, t = cc.vv.gameNetMgr;
t && t.bbSeats && t.bbSeats[t.bbMySeat] && (t.bbSeats[t.bbMySeat].arranged = !0);
var i = this._slotIdxOfUser(e);
i >= 0 && this._seatNodes[i] && this._seatNodes[i].cardsNode && (this._seatNodes[i].cardsNode.active = !0);
this.renderCards();
this._n.countdownLabel && this.setStr(this._n.countdownLabel, "");
if (this._n.bbMidCd) {
this._setMidCd(!0);
this._startCountdown(this._leftOf(this._arrangeRemain, this._arrangeRemainAt), this._n.bbMidCd, null);
}
this.showTip("已提交，等待其他玩家…");
} else {
this._wulongWarned = !0;
this.showTip("摆法违反前≥中≥后, 将判乌龙全输! 再点一次确定提交");
} else this.showTip("请摆满三道(每道2张)");
},
onCancelAllArrange: function() {
if (this._arranging) {
this._daoSel = [ [ null, null ], [ null, null ], [ null, null ] ];
this._wulongWarned = !1;
this._renderArrange();
this.renderCards();
}
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
for (var o = 0; o < 3; ++o) if (i[o]) for (var s = o + 1; s < 3; ++s) if (i[s] && this._cmpD(i[o], i[s]) < 0) return t[o] + "不能小于" + t[s];
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
_cmpArrange: function(e, t) {
return e.bao != t.bao ? e.bao ? 1 : -1 : e.bao ? e.rank != t.rank ? e.rank > t.rank ? 1 : -1 : this._cmpSuit(e.suit, t.suit) : e.point != t.point ? e.point > t.point ? 1 : -1 : e.maxRank != t.maxRank ? e.maxRank > t.maxRank ? 1 : -1 : this._cmpSuit(e.maxSuit, t.maxSuit);
},
autoArrangeLocal: function(e) {
if (!e || 6 != e.length) return null;
for (var t = this._evalD.bind(this), i = this._cmpD.bind(this), n = this._cmpArrange.bind(this), a = null, o = null, s = [ 0, 1, 2, 3, 4, 5 ], c = [], r = 0; r < 6; ++r) for (var l = r + 1; l < 6; ++l) c.push([ r, l ]);
function h(e, t) {
if (!t) return !0;
for (var i = 0; i <= 2; ++i) {
var a = n(e[i], t[i]);
if (0 != a) return a > 0;
}
return !1;
}
for (var d = 0; d < c.length; ++d) for (var u = c[d], g = s.filter(function(e) {
return e != u[0] && e != u[1];
}), v = 0; v < g.length; ++v) for (var m = v + 1; m < g.length; ++m) for (var f = [ g[v], g[m] ], _ = g.filter(function(e) {
return e != f[0] && e != f[1];
}), p = [ t(e[u[0]], e[u[1]]), t(e[f[0]], e[f[1]]), t(e[_[0]], e[_[1]]) ], C = [ [ 0, 1, 2 ], [ 0, 2, 1 ], [ 1, 0, 2 ], [ 1, 2, 0 ], [ 2, 0, 1 ], [ 2, 1, 0 ] ], b = 0; b < C.length; ++b) {
var y = C[b], N = [ p[y[0]], p[y[1]], p[y[2]] ];
if (!(i(N[0], N[1]) < 0 || i(N[1], N[2]) < 0) && h(N, a)) {
a = N;
o = [ N[0].cards.slice(), N[1].cards.slice(), N[2].cards.slice() ];
}
}
o || 6 != e.length || (o = [ [ e[0], e[1] ], [ e[2], e[3] ], [ e[4], e[5] ] ]);
var S = this;
o.forEach(function(e) {
e.sort(function(e, t) {
return S.rankOf(t) - S.rankOf(e) || S.suitOf(e) - S.suitOf(t);
});
});
return o;
},
onGameOver: function(e) {
this._overAt = Date.now();
var t = this._roundSeq;
this._lastOver = e;
this._lastOverSeq = t;
if (this._fxRunning || this._revealRunning || !this._revealDone && this._revealCounts) {
this._pendingOver = e;
this._pendingSeq = t;
var i = this;
this.scheduleOnce(function() {
if (cc.isValid(i.node) && i._pendingOver) {
var e = i._pendingOver;
i._pendingOver = null;
i._revealRunning = !1;
i._fxRunning = !1;
i._revealDone = !0;
i.applyGameOver(e, null);
}
}, 1);
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
if ((null == u || u < 0) && i.bbSeats) for (var g = 0; g < i.bbSeats.length; ++g) if (i.bbSeats[g] && i.bbSeats[g].userid == o) {
u = g;
break;
}
for (var v = function(e) {
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
}, m = [], f = 0; f < a.length; ++f) {
var _ = a[f];
if (_) {
var p = (_.name || "") + (i.bbBankerMode && i.bbSeats && i.bbSeats[d] && i.bbSeats[d].userid == _.userid ? "(庄)" : ""), C = "";
if (_.daos) {
C = (_.daos || []).map(function(e) {
return e.desc;
}).join(" ");
_.wulong && (C = "乌龙 " + C);
} else _.typeName && (C = _.typeName || "");
var b = _.delta || 0;
if (_.userid == o) m.push(p + "  " + C + "  本局 " + (b > 0 ? "+" : "") + b + "  (总:" + (null != _.totalscore ? _.totalscore : 0) + ")"); else {
var y = v(_.userid);
m.push(p + "  " + C + "  与我 " + (null == y ? "0" : (y > 0 ? "+" : "") + y));
}
}
}
var N = i.overData || {}, S = !(!e || !e.endinfo) || !!N.endinfo || i.maxNumOfGames > 0 && i.numOfGames >= i.maxNumOfGames, M = !(!e || !e.roomEnd) || !!N.roomEnd;
S && (M = !1);
this._final = S;
this._roomEnd = M;
this._arranging = !1;
this._inArrangePhase = !1;
this.hideArrangeUI();
this.hideConfirmUI();
this._n.bbMidCd && this._setMidCd(!1);
this._n.resultPanel && (this._n.resultPanel.active = !0);
this._ensureSettleBtnFrames();
this._setSettleActionBtn(M ? "退出房间" : "继续游戏", M);
if (this._resultShuffleBtn) {
var B = S || M;
this._resultShuffleBtn.active = !0;
this._resultShuffleBtn.opacity = B ? 120 : 255;
B ? this._resultShuffleBtn.off(cc.Node.EventType.TOUCH_END) : this.bindButton(this._resultShuffleBtn, this.onResultShuffle, this);
}
this._n.resultExitBtn && (this._n.resultExitBtn.active = !1);
this._settle1Done = !S;
this._setSettleContentStyle(this._settleFontSize, this._settleLineHeight, this._settleContentY);
this.setStr(this._n.resultContent, m.join("\n"));
if (this._n.settleRound) {
this._n.settleRound.active = !0;
this.setStr(this._n.settleRound, i.maxNumOfGames > 0 ? "第" + i.numOfGames + "/" + i.maxNumOfGames + "局" : "第" + i.numOfGames + "局");
}
this._lastLines = m.slice();
var w = !1;
try {
w = this._renderSettleCards(a, i.bbOverDetails || null);
} catch (e) {
console.error("[BB] 结算明牌渲染异常", e);
}
this._n.resultContent && (this._n.resultContent.active = !w);
this._n.resultList && (this._n.resultList.active = !1);
this._n.slSprite && (this._n.slSprite.active = r > 0);
this._n.sbSprite && (this._n.sbSprite.active = r < 0);
this._n.hjSprite && (this._n.hjSprite.active = 0 === r);
this._n.resultTitle && (this._n.resultTitle.active = !1);
this._n.disbandBtn && (this._n.disbandBtn.active = !S);
this._n.shareBtn && (this._n.shareBtn.active = !0);
this._n.btnReady && (this._n.btnReady.active = !1);
this._exitRoomBtn && (this._exitRoomBtn.active = !1);
this._n.exitBtn && (this._n.exitBtn.active = !1);
this._n.dissolveBtn && (this._n.dissolveBtn.active = !1);
this._n.readyBtn && (this._n.readyBtn.active = !1);
this._started = !1;
this.showTip(M ? "其他玩家已离开，房间无法继续" : "");
if (this._exitPending) {
this._exitPending = !1;
var A = this;
this.scheduleOnce(function() {
cc.isValid(A.node) && !A._leaving && A.onExitRoom();
}, 1.2);
}
this._stopCountdown();
this._settleCd && this.setStr(this._settleCd, "");
if (this._settleCd && !M) {
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
if (this._replay) {
this._stopCountdown();
this._settleCd && this.setStr(this._settleCd, "");
this._final = !1;
this._roomEnd = !1;
this._settle1Done = !0;
this._n.disbandBtn && (this._n.disbandBtn.active = !1);
this._n.shareBtn && (this._n.shareBtn.active = !1);
this._n.resultExitBtn && (this._n.resultExitBtn.active = !1);
this._resultShuffleBtn && (this._resultShuffleBtn.active = !1);
this._setSettleActionBtn("返回", !1);
this.bindButton(this._n.resultCloseBtn, this._exitReplay, this);
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
var i = 800, n = t.height > 100 ? Math.round(t.height) : 400, a = t.x || 0, o = t.y || 0, s = this.findNode(t, "bbSettleRow");
if (s && s.children) for (var c = 0; c < s.children.length; ++c) {
var r = s.children[c], l = Math.abs(r.x) + r.width / 2 + 10;
2 * l > i && (i = Math.ceil(2 * l));
}
var h = t.parent && "bbSettleScroll" === t.parent.name ? t.parent : null;
if (!h) {
(h = new cc.Node("bbSettleScroll")).parent = e;
h.setContentSize(i, n);
h.setPosition(a, o);
h.setSiblingIndex(e.children.length - 1);
h.addComponent(cc.Mask).type = cc.Mask.Type.RECT;
var d = h.addComponent(cc.ScrollView);
d.horizontal = !1;
d.vertical = !0;
d.inertia = !0;
d.bounceDuration = .15;
t.parent = h;
}
t.anchorX = .5;
t.anchorY = 1;
t.setPosition(0, n / 2);
this._settleScrollView = h.getComponent(cc.ScrollView);
this._settleViewH = n;
this._settleViewW = i;
var u = this.findNode(t, "bbSettleRow");
this._settleCardsRoot = t;
this._settleRowTpl = u;
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
for (var d = c.bbBankerMode ? c.bbBankerSeat : -1, u = [], g = this._total || 2, v = 0; v < g; ++v) v != l && (d >= 0 && l != d && v != d || u.push(v));
var m = function(t) {
for (var i = c.bbSeats && c.bbSeats[t] ? c.bbSeats[t].userid : -1, n = 0; n < e.length; ++n) if (e[n] && e[n].userid == i) return e[n];
return null;
};
i.active = !0;
u.length;
var f = this._settleRowTpl && this._settleRowTpl.height || 75, _ = this._settleViewH || 400, p = Math.floor(_ / 6), C = Math.min(1, p / f);
i.setContentSize(this._settleViewW || 840, _);
var b, y = 0, N = this, S = this._settleRowTpl, M = function(e, t, n) {
var a = (e.name || "") + (t == l ? "(我)" : "") + (t == d ? "(庄)" : ""), o = [], s = "";
if (!e.mianFree && e.daos) {
for (var c = 0; c < e.daos.length; ++c) {
var r = e.daos[c].cards || [];
o.push(r[0], r[1]);
}
s = e.daos.map(function(e) {
return e.desc;
}).join(" ");
e.wulong && (s = "乌龙 " + s);
} else {
o = N._mianOrder(e.holds || []);
var h = e.typeName || "", u = 1 == e.typeKey || "散牌" == h ? N._mianParts(e.holds) : "";
s = h + (u ? "(" + u + ")" : "");
}
var g = "string" == typeof n ? n : null == n ? "0" : (n > 0 ? "+" : "") + n, v = -p * (y + .5);
y++;
if (S && cc.isValid(S)) {
var m = cc.instantiate(S);
m.active = !0;
m.parent = i;
m.setPosition(0, v);
m.setScale(C);
N.setStr(N.findNode(m, "rowName"), a);
var f = N.findNode(m, "rowDesc");
N.setStr(f, s);
f && (f.active = !!s);
N.setStr(N.findNode(m, "rowScore"), g);
var _ = N.findNode(m, "rowIcon");
if (_) {
var b = _.getComponent("ImageLoader");
if (b && e.userid) {
_.active = !0;
b.setUserID(e.userid);
} else if (b) {
_.active = !0;
b.clearAvatar();
}
}
for (var M = 0; M < 6; ++M) {
var B = N.findNode(m, "card" + M);
if (B) if (null != o[M]) {
B.active = !0;
var w = B.getComponent(cc.Sprite);
w && (w.spriteFrame = N.jsFrameOf(o[M]) || N.frameOf(o[M]) || N._cardBack || null);
} else B.active = !1;
}
}
}, B = h.delta || 0;
M(h, l, (B > 0 ? "+" : "") + B);
for (var w = 0; w < u.length; ++w) {
var A = m(u[w]);
A && M(A, u[w], (b = A) && null != b.delta ? b.delta : 0);
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
var e = (this._endDetail || {}).endinfo || [];
if (0 == e.length && cc.vv.gameNetMgr && cc.vv.gameNetMgr.seats) for (var t = cc.vv.gameNetMgr.seats, i = 0; i < t.length; ++i) t[i] && t[i].userId > 0 && e.push({
userid: t[i].userId,
name: t[i].name,
score: t[i].score
});
e.sort(function(e, t) {
return (Number(t && t.score) || 0) - (Number(e && e.score) || 0);
});
console.log("[BB] 弹整场总结算(独立弹窗), 总分人数=" + e.length);
this._n.resultPanel && (this._n.resultPanel.active = !1);
this._renderFinalPanel(e);
}
},
_renderFinalPanel: function(e) {
var t = this._n, i = t.finalPanel;
if (!i || !cc.isValid(i)) {
console.log("[BB] 场景缺少 game_result 总结算弹窗");
return !1;
}
i.active = !0;
i.setSiblingIndex(i.parent.childrenCount - 1);
var n = cc.vv.gameNetMgr || {}, a = n.conf || {}, o = n.getWanfa && n.getWanfa() || "", s = null != a.cost ? a.cost : null != a.fangka ? a.fangka : "管理员", c = null != a.rate ? a.rate : null != a.multiple ? a.multiple : 1, r = new Date(), l = function(e) {
return e < 10 ? "0" + e : "" + e;
}, h = r.getFullYear() + "-" + (r.getMonth() + 1) + "-" + r.getDate() + " " + l(r.getHours()) + ":" + l(r.getMinutes()) + ":" + l(r.getSeconds());
this.setStr(t.finalInfo, "房号：" + (n.roomId || "") + "   " + o + "    扣费:" + s + "   倍率:" + c + "倍    " + h);
for (var d = -Infinity, u = 0; u < e.length; ++u) {
var g = Number(e[u].score) || 0;
g > d && (d = g);
}
for (var v = Math.min(t.finalCards.length, e.length), m = (t.finalCards[0] && t.finalCards[0].root.width || 180) + 8, f = -(v - 1) * m / 2, _ = 0; _ < t.finalCards.length; ++_) {
var p = t.finalCards[_], C = _ < v;
p.root.active = C;
if (C) {
p.root.setPosition(f + _ * m, p.root.y);
var b = e[_] || {}, y = Number(b.score) || 0, N = y > 0 && y == d;
p.win && (p.win.active = N);
p.bg && (p.bg.color = y > 0 ? cc.color(255, 132, 112) : y < 0 ? cc.color(128, 166, 255) : cc.color(235, 235, 235));
if (p.avatar) {
var S = p.avatar.getComponent("ImageLoader");
if (!S) try {
S = p.avatar.addComponent("ImageLoader");
} catch (e) {}
S && b.userid && S.setUserID(b.userid);
}
this.setStr(p.name, b.name || "");
this.setStr(p.id, null != b.userid ? "ID:" + b.userid : "");
this.setStr(p.score, (y > 0 ? "+" : "") + y);
if (p.score) {
p.score.color = y > 0 ? cc.color(255, 212, 70) : y < 0 ? cc.color(92, 232, 160) : cc.color(240, 240, 240);
p.score.opacity = 255;
}
}
}
return !0;
},
onFinalBack: function() {
var e = cc.vv && cc.vv.gameNetMgr;
e && "club" === e.roomBackScene && e.roomBackClubId && (cc.vv.fromClubId = e.roomBackClubId);
this._leaveFinalRoom(!1);
},
onFinalJoin: function() {
var e = cc.vv && cc.vv.gameNetMgr;
e && e.bbGameType && (cc.vv.lastGameType = e.bbGameType);
cc.vv.autoQuickJoin = {
gameType: e && e.bbGameType || null
};
this._leaveFinalRoom(!0);
},
_leaveFinalRoom: function() {
if (!this._leaving) {
this._summaryShown = !0;
this._stopCountdown();
this._n.finalPanel && (this._n.finalPanel.active = !1);
this._myContinued = !0;
cc.vv.gameNetMgr && cc.vv.gameNetMgr.clearRoomState && cc.vv.gameNetMgr.clearRoomState();
cc.vv.net.send("leave_room");
var e = this;
this._exitTimer = setTimeout(function() {
e._exitTimer = null;
cc.isValid(e.node) && !e._leaving && e.leaveRoom();
}, 500);
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
if (this._roomEnd) this.onExitRoom(); else if (this._summaryShown) this._leaveFinalRoom(); else {
this._n.resultPanel && (this._n.resultPanel.active = !1);
if (this._final) this._showFinalSummary(); else {
this._settleClosedAt = Date.now();
if (!this._myContinued) {
this._myContinued = !0;
cc.vv.net.send("bb_continue");
this._startContinueRetry();
}
this.showTip("已确定，等待其他玩家…");
this._settleCdToTable();
}
}
},
_settleCdToTable: function() {
var e = 0;
null != this._cdBase && null != this._cdStartAt && (e = Math.max(0, this._cdBase - Math.floor((Date.now() - this._cdStartAt) / 1e3)));
var t = this;
if (e > 0 && this._n.bbMidCd) {
this._setMidCd(!0);
this._startCountdown(e, this._n.bbMidCd, function() {
t._n.bbMidCd && (t._n.bbMidCd.active = !1);
});
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
this._settleCdToTable();
} else {
this._myContinued = !0;
this.showTip("已确定，等待其他玩家…");
cc.vv.net.send("bb_continue", {
shuffle: !0
});
this._startContinueRetry();
this._settleCdToTable();
}
}
},
_playShuffleAnim: function(e) {
var t = this, i = !1;
function n() {
if (!i) {
i = !0;
e && e();
}
}
try {
this._shuffleRoot && cc.isValid(this._shuffleRoot) || (this._shuffleRoot = this.findNode(this.node, "bbShuffleAnim") || cc.find("Canvas/bbShuffleAnim"));
this._clearCards();
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("shuffle.wav");
var a = this._tableCenter(), o = null;
if (this._qiepaiSpine) {
var s = (o = this._fxNode(a, "bbFxQiepaiSpine")).addComponent(sp.Skeleton);
s.skeletonData = this._qiepaiSpine;
s.premultipliedAlpha = !1;
s.setAnimation(0, "animation", !1);
} else console.log("[BB] qiepai spine 未就绪, 本次跳过洗牌画面");
this.scheduleOnce(function() {
cc.isValid(t.node) && cc.isValid(o) && o.destroy();
}, 1.6);
this.scheduleOnce(function() {
n();
}, 3);
} catch (e) {
console.error("[BB] 洗牌动画异常, 直接继续发牌", e);
n();
}
},
_avatarLocalPos: function(e) {
var t = this._seatNodes[this._layoutOf(this._total || 2)[e]], i = t && (t.icon || t.root);
return i && cc.isValid(i) ? this.node.convertToNodeSpaceAR(i.convertToWorldSpaceAR(cc.v2(0, 0))) : null;
},
_tableCenter: function() {
var e = cc.view.getVisibleSize(), t = cc.v2(e.width / 2, e.height / 2);
return this.node.convertToNodeSpaceAR(t);
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
for (var t = this, i = this._total || 2, n = {}, a = [], o = {
13: "anim_sf6",
12: "anim_sf5",
11: "anim_4p",
10: "anim_4",
9: "anim_33",
8: "anim_3p1",
7: "anim_f6",
6: "anim_s6",
5: "anim_f5",
4: "anim_s5",
3: "anim_p3",
2: "anim_n9"
}, s = {
1: "fire",
2: "bomb"
}, c = 0; c < i; ++c) {
var r = this._watching ? c : (this._mySeat + c) % i, l = this._revealByGs[r];
n[c] = l && null != l.typeKey ? l.typeKey : null;
if (null != n[c]) {
var h = this._animOn(o[n[c]], !0);
if (h) {
var d = s[h] || null;
if (d) {
a.push({
kind: "hand",
off: c,
type: d
});
a.push({
kind: d,
off: c
});
}
}
}
}
if (0 != a.length) {
this._fxRunning = !0;
var u = 0, g = 0;
(function i() {
if (!cc.isValid(t.node) || u >= a.length) {
t._fxRunning = !1;
t._clearFxNodes();
e && e();
} else {
g = ++g;
var n = a[u++], o = g;
setTimeout(function() {
if (cc.isValid(t.node) && o === g) {
console.log("[BB] 特效步骤超时强制结束 step=" + o);
i();
}
}, 6e3);
"hand" == n.kind ? t._fxHandFocus(n.off, n.type, i) : "fire" == n.kind ? t._fxFire(i) : "bomb" == n.kind ? t._fxBomb(i) : t._fxPairsFx(n.kind, i);
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
var u = l.getOriginalSize().width, g = l.getOriginalSize().height;
r = Math.min(.62 * cc.winSize.width / u, 360 / g, 1);
h.setContentSize(u * r, g * r);
h.setScale(0);
this._fxNodes.push(h);
}
for (var v = -56 * (c.length - 1) / 2, m = this.node.convertToWorldSpaceAR(s), f = 0; f < c.length; ++f) {
var _ = c[f], p = this._homeOf(_), C = _.parent.convertToNodeSpaceAR(m);
_.stopAllActions();
_.setSiblingIndex(_.parent.children.length - 1);
_.runAction(cc.sequence(cc.spawn(cc.moveTo(.4, cc.v2(C.x + v + 56 * f, C.y)), cc.scaleTo(.4, 1.9)), cc.repeat(cc.sequence(cc.moveBy(.05, cc.v2(-3, 2)), cc.moveBy(.05, cc.v2(3, -2)), cc.moveBy(.05, cc.v2(2, -3)), cc.moveBy(.05, cc.v2(-2, 3))), 5), cc.spawn(cc.moveTo(.4, cc.v2(p.x, p.y)), cc.scaleTo(.4, p.sx, p.sy))));
}
h && h.runAction(cc.sequence(cc.scaleTo(.5, 1), cc.repeat(cc.sequence(cc.moveBy(.05, cc.v2(-3, 2)), cc.moveBy(.05, cc.v2(3, -2)), cc.moveBy(.05, cc.v2(2, -3)), cc.moveBy(.05, cc.v2(-2, 3))), 25), cc.fadeOut(.3), cc.removeSelf()));
this.scheduleOnce(function() {
cc.isValid(n.node) && i && i();
}, 1.9);
} else i && i();
} else i && i();
},
_fxFire: function(e) {
this._fxBurst("fire", 1.6, e);
},
_fxBomb: function(e) {
this._fxBurst("bomb", 1.2, e);
},
_fxBurst: function(e, t, n) {
var a = this._dqFrames;
if (a && a.length) {
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX(i[e]);
var o = this._tableCenter(), s = this._fxNode(o, "bbFx" + e), c = s.addComponent(cc.Sprite);
c.spriteFrame = a[0];
s.setScale(t);
var r = 0, l = a.length, h = setInterval(function() {
if (cc.isValid(s)) if (++r >= l) {
clearInterval(h);
s.destroy();
n && n();
} else c.spriteFrame = a[r]; else clearInterval(h);
}, 50);
} else n && n();
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
onRuleOpen: function() {
if (this._n.ruleWin) {
var e = cc.vv.gameNetMgr, t = e.conf || {}, i = t.taiRules;
if (null != i && "string" == typeof i) try {
i = JSON.parse(i);
} catch (e) {
i = null;
}
var n = null != (i && (i.base_score || i.baseScore)) ? i.base_score || i.baseScore : null != t.baseScore ? t.baseScore : null != t.base_score ? t.base_score : t.base || "-", a = null != t.cost ? t.cost : null != t.fangka ? t.fangka : "-";
this.setStr(this._n.ruleCost, "房卡消耗:" + a);
this.setStr(this._n.ruleGames, "局数:" + (e.maxNumOfGames || "-") + "局  2人即可开始");
this.setStr(this._n.ruleBase, "底分:" + n);
this._n.ruleWin.active = !0;
this._n.ruleWin.parent && this._n.ruleWin.setSiblingIndex(this._n.ruleWin.parent.children.length - 1);
}
},
onRuleClose: function() {
this._n.ruleWin && (this._n.ruleWin.active = !1);
},
onChangeDesk: function() {
if (this._started) this.showTip("牌局已开始，无法换桌"); else {
this.showTip("正在换桌…");
cc.vv.net.send("exit");
var e = this;
this._exitTimer || (this._exitTimer = setTimeout(function() {
e._exitTimer = null;
if (cc.isValid(e.node) && !e._leaving) {
cc.vv.gameNetMgr && cc.vv.gameNetMgr.clearRoomState && cc.vv.gameNetMgr.clearRoomState();
e.leaveRoom();
}
}, 500));
}
},
onShareResult: function() {
if (cc.vv && cc.vv.anysdkMgr && cc.vv.anysdkMgr.copyShareLink) {
var e = cc.vv.anysdkMgr.copyShareLink();
this.showTip(e ? "链接已复制，粘贴发送给好友，点开链接即可进入游戏" : "链接复制失败，请稍后重试");
} else this.showTip("分享功能暂未开放");
},
leaveRoom: function() {
if (!this._leaving) {
this._leaving = !0;
this._stopContinueRetry();
var e = cc.director.getScene ? cc.director.getScene() : null, t = e && e.name ? e.name : "";
if ("hall" !== t && "club" !== t) {
var i = cc.vv.gameNetMgr;
i && (i._ignoreDisconnectOnce = !0);
if (i && "club" === i.roomBackScene || cc.vv.fromClubId) {
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
var e = this, t = function(t) {
for (var i = e.node.children, n = null, a = 0; a < i.length; ++a) i[a].name === t && (n = i[a]);
return n;
};
this._btnChat = t("btn_chat");
this._btnChat && (this._btnChat.active = 0 == cc.vv.replayMgr.isReplay());
this._chatRoot = t("chat");
if (this._chatRoot) {
this._chatRoot.active = !1;
this._tabQuick = this._chatRoot.getChildByName("quickchatlist");
this._tabEmoji = this._chatRoot.getChildByName("emojis");
this._iptChat = this._chatRoot.getChildByName("iptChat").getComponent(cc.EditBox);
this._quickChatInfo = {};
this._quickChatInfo.item0 = {
index: 0,
content: "快点啊，都等到我花儿都谢谢了！"
};
this._quickChatInfo.item1 = {
index: 1,
content: "怎么又断线了，网络怎么这么差啊！"
};
this._quickChatInfo.item2 = {
index: 2,
content: "不要走，决战到天亮！"
};
this._quickChatInfo.item3 = {
index: 3,
content: "你的牌打得也太好了！"
};
this._quickChatInfo.item4 = {
index: 4,
content: "你是妹妹还是哥哥啊？"
};
this._quickChatInfo.item5 = {
index: 5,
content: "和你合作真是太愉快了！"
};
this._quickChatInfo.item6 = {
index: 6,
content: "大家好，很高兴见到各位！"
};
this._quickChatInfo.item7 = {
index: 7,
content: "各位，真是不好意思，我得离开一会儿。"
};
this._quickChatInfo.item8 = {
index: 8,
content: "不要吵了，专心玩游戏吧！"
};
}
}
},
getQuickChatInfo: function(e) {
var t = "item" + e;
return this._quickChatInfo[t];
},
onBtnChatClicked: function() {
this._chatRoot && (this._chatRoot.active = !0);
},
onBgClicked: function() {
this._chatRoot && (this._chatRoot.active = !1);
},
onTabClicked: function(e) {
if (this._chatRoot) if ("tabQuick" == e.target.name) {
this._tabQuick && (this._tabQuick.active = !0);
this._tabEmoji && (this._tabEmoji.active = !1);
} else if ("tabEmoji" == e.target.name) {
this._tabQuick && (this._tabQuick.active = !1);
this._tabEmoji && (this._tabEmoji.active = !0);
}
},
onQuickChatItemClicked: function(e) {
if (this._chatRoot) {
this._chatRoot.active = !1;
var t = this._quickChatInfo[e.target.name];
cc.vv.net.send("quick_chat", t.index);
}
},
onEmojiItemClicked: function(e) {
if (this._chatRoot) {
console.log(e.target.name);
this._chatRoot.active = !1;
cc.vv.net.send("emoji", e.target.name);
}
},
onBtnSendChatClicked: function() {
if (this._chatRoot) {
this._chatRoot.active = !1;
if (this._iptChat && "" != this._iptChat.string) {
cc.vv.net.send("chat", this._iptChat.string);
this._iptChat.string = "";
}
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
DingQue: [ function(e, t) {
"use strict";
cc._RF.push(t, "02fc7NMBp9JxajVjy/4rO2p", "DingQue");
cc.Class({
extends: cc.Component,
properties: {
queYiMen: null,
tips: [],
selected: [],
dingques: []
},
onLoad: function() {
if (null != cc.vv) {
this.initView();
this.initDingQue();
this.initEventHandlers();
}
},
initView: function() {
var e = this.node.getChildByName("game");
this.queYiMen = e.getChildByName("dingque");
this.queYiMen.active = cc.vv.gameNetMgr.isDingQueing;
for (var t = [ "myself", "right", "up", "left" ], i = 0; i < t.length; ++i) {
var n = e.getChildByName(t[i]).getChildByName("seat").getChildByName("que");
this.dingques.push(n);
}
this.reset();
var a = this.queYiMen.getChildByName("tips");
for (i = 0; i < a.childrenCount; ++i) {
var o = a.children[i];
this.tips.push(o.getComponent(cc.Label));
}
"dingque" == cc.vv.gameNetMgr.gamestate && this.showDingQueChoice();
},
initEventHandlers: function() {
var e = this;
this.node.on("game_dingque", function() {
e.showDingQueChoice();
});
this.node.on("game_dingque_notify", function(t) {
var i = cc.vv.gameNetMgr.getSeatIndexByID(t.detail), n = cc.vv.gameNetMgr.getLocalIndex(i);
console.log("game_dingque_notify:" + n);
e.tips[n].node.active = !0;
});
this.node.on("game_dingque_finish", function() {
e.queYiMen.active = !1;
cc.vv.gameNetMgr.isDingQueing = !1;
e.initDingQue();
});
},
showDingQueChoice: function() {
this.queYiMen.active = !0;
for (var e = cc.vv.gameNetMgr.getSelfData(), t = [ 0, 0, 0 ], i = 0; i < e.holds.length; ++i) {
var n = e.holds[i];
t[cc.vv.mahjongmgr.getMahjongType(n)]++;
}
var a = 65535, o = 0;
for (i = 0; i < t.length; ++i) if (t[i] < a) {
a = t[i];
o = i;
}
var s = [ "tong", "tiao", "wan" ];
for (i = 0; i < s.length; ++i) {
var c = this.queYiMen.getChildByName(s[i]);
o == i ? c.getComponent(cc.Animation).play("dingque_tuijian") : c.getComponent(cc.Animation).stop();
}
this.reset();
for (i = 0; i < this.tips.length; ++i) {
this.tips[i].node.active = !(i > 0);
}
},
initDingQue: function() {
var e = [ "tong", "tiao", "wan" ], t = cc.vv.gameNetMgr.seats;
if (t) for (var i = 0; i < t.length; ++i) {
var n = t[i].dingque;
n = null == n || n < 0 || n >= e.length ? null : e[n];
var a = cc.vv.gameNetMgr.getLocalIndex(i);
n && (this.dingques[a].getChildByName(n).active = !0);
}
},
reset: function() {
this.setInteractable(!0);
this.selected.push(this.queYiMen.getChildByName("tong_selected"));
this.selected.push(this.queYiMen.getChildByName("tiao_selected"));
this.selected.push(this.queYiMen.getChildByName("wan_selected"));
for (var e = 0; e < this.selected.length; ++e) this.selected[e].active = !1;
for (e = 0; e < this.dingques.length; ++e) for (var t = 0; t < this.dingques[e].children.length; ++t) this.dingques[e].children[t].active = !1;
},
onQueYiMenClicked: function(e) {
var t = 0;
"tong" == e.target.name ? t = 0 : "tiao" == e.target.name ? t = 1 : "wan" == e.target.name && (t = 2);
for (var i = 0; i < this.selected.length; ++i) this.selected[i].active = !1;
this.selected[t].active = !0;
cc.vv.gameNetMgr.dingque = t;
cc.vv.net.send("dingque", t);
},
setInteractable: function(e) {
this.queYiMen.getChildByName("tong").getComponent(cc.Button).interactable = e;
this.queYiMen.getChildByName("tiao").getComponent(cc.Button).interactable = e;
this.queYiMen.getChildByName("wan").getComponent(cc.Button).interactable = e;
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
var g = u % r, v = Math.floor(u / r), m = cc.instantiate(o[g].node);
m.y = c + h * v;
m.active = !1;
s.addChild(m);
o.push(m.getComponent(cc.Sprite));
} else d = o.length;
this._foldStacks || (this._foldStacks = {});
for (var f = this._foldStacks[a] || [], _ = 0; _ < f.length; ++_) cc.isValid(f[_]) && f[_].destroy();
var p = [];
this._foldStacks[a] = p;
for (var C = Math.min(t.length, d), b = 0; b < t.length; ++b) {
var y = b % d, N = Math.floor(b / d), S = y;
"right" != a && "up" != a || (S = o.length - y - 1);
var M = o[S];
if (0 == N) {
M.node.active = !0;
this.setSpriteFrameByMJID(n, M, t[b]);
} else {
var B = M.node, w = cc.instantiate(B);
w.x = B.x;
w.y = B.y + 8 * N;
w.zIndex = B.zIndex + N;
s.addChild(w);
w.active = !0;
this.setSpriteFrameByMJID(n, w.getComponent(cc.Sprite), t[b]);
p.push(w);
}
}
for (b = C; b < o.length; ++b) {
S = b;
"right" != a && "up" != a || (S = o.length - b - 1);
(M = o[S]).spriteFrame = null;
M.node.active = !1;
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
GPGame: [ function(e, t) {
"use strict";
cc._RF.push(t, "2d195LYN55N5bfuaRB5fJ5r", "GPGame");
cc.Class({
extends: cc.Component,
properties: {
maxPlayers: {
default: 3,
type: cc.Integer
}
},
onLoad: function() {
if (cc.vv) {
this._cards = [];
this._selected = {};
this._mySeat = -1;
this._turn = -1;
this._freePlay = !0;
this._lastPlay = null;
this._deadline = 0;
this._over = !1;
this._final = !1;
this._selectUpOffset = 28;
this._gpConf = {};
this._dealAnimating = !1;
this._dealAnimNodes = null;
this._dealAnimId = 0;
this._playAnimBusy = !1;
this._pendingRenderPais = null;
this._playHistory = [];
this._historyRound = 0;
if (!this.node.getComponent("Alert")) {
var e = cc.js.getClassByName("Alert");
e && this.node.addComponent(e);
}
if (!cc.sys.isNative) {
var t = this.node.getComponent(cc.Canvas);
if (t) {
t.fitHeight = !0;
t.fitWidth = !1;
}
}
this.initView();
this.initEvents();
this.refreshFromState();
cc.vv.audioMgr && cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("loading");
},
onDestroy: function() {
if (this._sio && this._sioListeners) {
this._sio.removeListener("exit_result", this._sioListeners.exit_result);
this._sio.removeListener("dispress_push", this._sioListeners.dispress_push);
this._sioListeners = null;
}
cc.vv && cc.vv.gameNetMgr && cc.vv.gameNetMgr.dataEventHandler == this.node && (cc.vv.gameNetMgr.dataEventHandler = null);
},
findNode: function(e, t) {
if (null == e) return null;
if (e.name == t) return e;
for (var i = e.children, n = 0; n < i.length; ++n) {
var a = this.findNode(i[n], t);
if (a) return a;
}
return null;
},
initView: function() {
this._n = {};
for (var e = [ "bg", "game", "prepare", "titleLabel", "roundLabel", "tipLabel", "countdownLabel", "handArea", "playArea", "playOwnerLabel", "cardsContainer", "playBtn", "passBtn", "hintBtn", "readyBtn", "exitBtn", "dissolveBtn", "prepareInfo", "settlePanel", "settleTitle", "settleContent", "settleAgainBtn", "settleAgainLabel", "settleCloseBtn", "settleExitBtn", "finalSettlePanel", "finalSettleTitle", "finalSettleContent", "finalSettleExitBtn", "dissolvePanel", "dissolveLabel", "dissolveAgreeBtn", "dissolveRejectBtn" ], t = 0; t < e.length; ++t) this._n[e[t]] = this.findNode(this.node, e[t]);
this._seatViews = [];
for (var i = 0; i < 3; ++i) {
var n = this.findNode(this.node, "seatInfo" + i);
this._seatViews.push(n ? {
root: n,
name: this.findNode(n, "nameLabel"),
count: this.findNode(n, "countLabel"),
remain: this.findNode(n, "remainLabel"),
state: this.findNode(n, "stateLabel")
} : null);
}
(function e(t) {
if (t) {
"ChatBubble" === t._name && (t.active = !1);
(t._children || []).forEach(function(t) {
e(t);
});
}
})(this.node);
this._seatMap = null;
this._refreshTitle();
if (this._n.settleAgainBtn) {
this._n.settleAgainLabel = this.findNode(this._n.settleAgainBtn, "settleAgainBtnLabel");
this._n.settleAgainBtn.active = !1;
this._n.settleAgainLabel && (this._n.settleAgainLabel.active = !1);
var a = this._n.settleAgainBtn.getComponent(cc.Label);
if (a) {
a.enabled = !0;
a.string = "准备";
}
}
this._n.settlePanel.active = !1;
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this._n.dissolvePanel.active = !1;
this._n.prepareInfo.active = !1;
(o = this.findNode(this.node, "ops")) && (o.active = !1);
this._n.playBtn.active = !1;
this._n.passBtn.active = !1;
this._n.hintBtn && (this._n.hintBtn.active = !1);
(s = this.findNode(this.node, "arrow")) && (s.active = !1);
this.setStr(this._n.tipLabel, "");
this.setStr(this._n.countdownLabel, "");
this.setStr(this._n.playOwnerLabel, "");
this._n.arrow = this.findNode(this.node, "arrow");
if (this._n.arrow) {
this._n.arrowPointer = this.findNode(this._n.arrow, "pointer");
this._n.arrowTime = this.findNode(this._n.arrow, "lblTime");
this._n.arrow.active = !1;
}
this.setArrowTime("");
[ "holds", "folds", "penggangs", "ChuPai", "settlePokerResult" ].forEach(function(e) {
var t = this.findNode(this.node, e);
t && (t.active = !1);
}.bind(this));
this._cardFrames = {};
var o, s, c = this.findNode(this.node, "cardTemplates");
if (c) {
var r = c.children;
for (t = 0; t < r.length; ++t) {
var l = r[t].name, h = r[t].getComponent(cc.Sprite);
h && h.spriteFrame && (this._cardFrames[l] = h.spriteFrame);
}
c.active = !1;
}
this.loadCardFramesFromRes();
this._handSlots = [];
this._playSlots = [];
for (var d = this, u = 0; u < 16; ++u) {
var g = this.findNode(this._n.handArea, "handSlot" + u);
if (g) {
g.on(cc.Node.EventType.TOUCH_END, function(e) {
return function() {
d.onSlotTouched(e);
};
}(g));
var v = g.getChildByName("selMark");
v && (v.active = !1);
this._handSlots.push(g);
}
var m = this.findNode(this._n.cardsContainer, "playSlot" + u);
m && this._playSlots.push(m);
}
if (0 == this._playSlots.length) for (var f = 0; f < 16; ++f) {
var _ = this.findNode(this.node, "playSlot" + f);
_ && this._playSlots.push(_);
}
console.log("[GP] init cardsContainer=", this._n.cardsContainer ? "OK" : "NULL", "_playSlots.length=", this._playSlots.length);
console.log("[GP] _handSlots.length=", this._handSlots.length, "_cardFrames count=", Object.keys(this._cardFrames).length);
this._n.btnSettings = this.findNode(this.node, "btn_settings");
this._n.btnChat = this.findNode(this.node, "btn_chat");
this._n.btnVoice = this.findNode(this.node, "btn_voice");
this._n.settingsPanel = this.findNode(this.node, "settings");
this._n.chatPanel = this.findNode(this.node, "chat");
this._n.settingsPanel && (this._n.settingsPanel.active = !1);
this._n.chatPanel && (this._n.chatPanel.active = !1);
this.bindButton(this._n.btnSettings, this.onBtnSettings, this);
this.bindButton(this._n.btnChat, this.onBtnChat, this);
this.bindButton(this._n.btnVoice, this.onBtnVoice, this);
if (this._n.settingsPanel) {
this._n.btnSettingsClose = this.findNode(this._n.settingsPanel, "btn_close");
this._n.btnSettingsDissolve = this.findNode(this._n.settingsPanel, "btn_sqjsfj");
this._n.btnSettingsExit = this.findNode(this._n.settingsPanel, "btn_exit");
this.bindButton(this._n.btnSettingsClose, this.onBtnSettingsClose, this);
this.bindButton(this._n.btnSettingsDissolve, this.onBtnSettingsDissolve, this);
this.bindButton(this._n.btnSettingsExit, this.onExit, this);
}
if (this._n.chatPanel) {
this._n.btnChatSend = this.findNode(this._n.chatPanel, "btnSend");
this._n.iptChat = this.findNode(this._n.chatPanel, "iptChat");
this._n.tabQuick = this.findNode(this._n.chatPanel, "tabQuick");
this._n.tabEmoji = this.findNode(this._n.chatPanel, "tabEmoji");
this._n.quickchatlist = this.findNode(this._n.chatPanel, "quickchatlist");
this._n.emojis = this.findNode(this._n.chatPanel, "emojis");
this.bindButton(this._n.btnChatSend, this.onBtnChatSend, this);
this.bindButton(this._n.tabQuick, this.onTabQuick, this);
this.bindButton(this._n.tabEmoji, this.onTabEmoji, this);
var p = this.findNode(this._n.chatPanel, "bg");
this.bindButton(p, this.onBtnChatClose, this);
this._quickChatInfo = {
item0: "快点啊，都等到我花儿都谢了！",
item1: "怎么又断线了，网络怎么这么差啊！",
item2: "不要走，决战到天亮！",
item3: "你的牌打得也太好了！",
item4: "你是妹妹还是哥哥啊？",
item5: "和你合作真是太愉快了！",
item6: "大家好，很高兴见到各位！",
item7: "各位，真是不好意思，我得离开一会儿。",
item8: "不要吵了，专心玩游戏吧！"
};
var C = this, b = this.findNode(this._n.quickchatlist, "content") || this._n.quickchatlist;
b && b.children.forEach(function(e) {
/^item\d+$/.test(e.name) && C.bindButton(e, function() {
cc.vv.net.send("quick_chat", e.name);
C._n.chatPanel && (C._n.chatPanel.active = !1);
}, C);
});
}
this._oppSlots = [];
for (var y = 0; y < 2; ++y) {
for (var N = [], S = 0; S < 16; ++S) {
var M = this.findNode(this.node, "oppCard" + y + "_" + S);
if (M) {
M.active = !1;
N.push(M);
}
}
N.length > 0 && this._oppSlots.push(N);
}
this.loadCardBack();
this.bindButton(this._n.playBtn, this.onPlay, this);
this.bindButton(this._n.passBtn, this.onPass, this);
this.bindButton(this._n.hintBtn, this.onHint, this);
this.bindButton(this._n.readyBtn, this.onReady, this);
this.bindButton(this._n.exitBtn, this.onExit, this);
this.bindButton(this._n.dissolveBtn, this.onDissolve, this);
this.bindButton(this._n.settleAgainBtn, this.onSettleAgain, this);
this.bindButton(this._n.settleExitBtn, this.onExit, this);
this.bindButton(this._n.settleCloseBtn, this.onSettleClose, this);
this._n.settleNewBtn = this._n.settlePanel ? this._n.settlePanel.getChildByName("New Sprite") : null;
this.bindButton(this._n.settleNewBtn, this.onSettleClose, this);
this.bindButton(this._n.finalSettleExitBtn, this.onExit, this);
this.bindButton(this._n.dissolveAgreeBtn, this.onDissolveAgree, this);
this.bindButton(this._n.dissolveRejectBtn, this.onDissolveReject, this);
(o = this.findNode(this.node, "ops")) && o.children.forEach(function(e) {
"playBtn" !== e.name && "passBtn" !== e.name && "hintBtn" !== e.name && (e.active = !1);
});
this._clearBoard();
o && (o.active = !1);
(s = this.findNode(this.node, "arrow")) && (s.active = !1);
this.setStr(this._n.playOwnerLabel, "");
this._n.historyBtn = this.findNode(this.node, "historyBtn");
this._n.historyPanel = this.findNode(this.node, "historyPanel");
this._n.historyContent = this._n.historyPanel ? this.findNode(this._n.historyPanel, "content") : null;
if (this._n.historyBtn) {
this._n.historyBtn.active = !1;
this.bindButton(this._n.historyBtn, this.onHistoryBtn, this);
}
this._n.historyPanel && (this._n.historyPanel.active = !1);
this._n.gameResult = this.node.getChildByName("game_result");
if (this._n.gameResult) {
this._n.gameResult.active = !1;
var B = this._n.gameResult.getChildByName("btnShare");
B && this.bindButton(B, this.onExit, this);
var w = this._n.gameResult.getChildByName("btnClose");
if (w) {
w.active = !1;
this.bindButton(w, this.onExit, this);
}
}
this.updateActionBtns();
},
bindButton: function(e, t, i) {
if (null != e) {
var n = e.name;
e.on("click", function() {
console.log("[GP] btn click:", n);
cc.vv.audioMgr && cc.vv.audioMgr.playSFX("ui_click.mp3");
t.call(i);
});
}
},
_isHistoryEnabled: function() {
return !!(this._gpConf || {}).gp_card_history;
},
onHistoryBtn: function() {
if (this._n.historyPanel) {
this._renderHistory();
this._n.historyPanel.active = !this._n.historyPanel.active;
}
},
_showHistoryIfEnabled: function() {
var e = this._isHistoryEnabled();
this._n.historyBtn && (this._n.historyBtn.active = e);
!e && this._n.historyPanel && (this._n.historyPanel.active = !1);
},
_formatPaiId: function(e) {
if (null == e) return "";
var t = this.rankOf(e);
return 14 === t ? "A" : 11 === t ? "J" : 12 === t ? "Q" : 13 === t ? "K" : String(t);
},
_addHistory: function(e) {
this._playHistory.push(e);
this._playHistory.length > 60 && this._playHistory.shift();
this._renderHistory();
},
_historyNextRound: function() {
this._historyRound++;
this._playHistory.length > 0 && this._playHistory.push({
roundBreak: !0
});
},
_renderHistory: function() {
var e = this._n && this._n.historyContent, t = e ? e.getComponent(cc.Label) : null;
if (t) {
for (var i = [], n = 0; n < this._playHistory.length; ++n) {
var a = this._playHistory[n];
if (a.roundBreak) i.push("── 第" + (this._historyRound + 1) + "轮 ──"); else {
var o = "";
if (a.pais) for (var s = 0; s < a.pais.length; s++) o += this._formatPaiId(a.pais[s]) + " ";
i.push(this._shortName(this.seatName(a.seatIndex)) + "(" + (this._comboName(a.type) || "") + "): " + o);
}
}
var c = (e.height || 250) - 8, r = Math.max(4, Math.floor(c / (1.45 * t.fontSize)));
i.length > r && (i = i.slice(i.length - r));
e.color = cc.color(255, 255, 255, 255);
t.string = i.join("\n");
}
},
_shortName: function(e) {
var t = String(null == e ? "" : e), i = /[\u4e00-\u9fa5]/.test(t) ? 3 : 5;
return t.length > i ? t.substr(0, i) + "…" : t;
},
_comboName: function(e) {
return {
single: "单张",
pair: "对子",
triple: "三张",
triple_one: "三带一",
triple_pair: "三带二",
four_two: "四带二",
four_three: "四带三",
straight: "顺子",
pair_straight: "连对",
triple_straight: "飞机",
bomb: "炸弹"
}[e] || "";
},
_refreshTitle: function() {
var e = cc.vv.gameNetMgr || {}, t = this._gpConf || e.conf || {}, i = e.roomId || "", n = t.baseScore || 1, a = [];
i && a.push("房号 " + i);
a.push("关牌·" + this.maxPlayers + "人");
a.push("底分:" + n);
this._n.titleLabel && this.setStr(this._n.titleLabel, a.join(" · "));
},
rankOf: function(e) {
return Math.floor(e / 4) + 3;
},
suitOf: function(e) {
return e % 4;
},
cardFrameKey: function(e) {
return [ "Spade", "Heart", "Club", "Diamond" ][this.suitOf(e)] + [ "", "", "", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2" ][this.rankOf(e)];
},
loadCardFramesFromRes: function() {
var e = this;
cc.resources.load("images/atlas/cards", cc.SpriteAtlas, function(t, i) {
if (!t && i) {
for (var n = [ "Spade", "Heart", "Club", "Diamond" ], a = [ "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2" ], o = 0; o < n.length; ++o) for (var s = 0; s < a.length; ++s) {
var c = n[o] + a[s], r = l(c);
r && (e._cardFrames[c] = r);
}
e._cardBack = l("card_back") || e._cardBack;
console.log("[GP] 牌面图集加载完成, 缓存张数=", Object.keys(e._cardFrames).length);
e.applyCardBack();
e._cards && e._cards.length && e.renderAll();
} else console.log("[GP] 牌面图集加载失败:", t);
function l(e) {
return i.getSpriteFrame(e + ".png") || i.getSpriteFrame(e);
}
});
cc.resources.load("images/chatbg", cc.SpriteFrame, function(t, i) {
!t && i && (e._chatBgFrame = i);
});
},
loadCardBack: function() {
this.applyCardBack();
},
applyCardBack: function() {
if (this._cardBack && this._oppSlots) {
var e = this._cardBack;
this._oppSlots.forEach(function(t) {
t.forEach(function(t) {
var i = t.getComponent(cc.Sprite);
i && (i.spriteFrame = e);
});
});
this._blankStrayCardBacks();
}
},
_blankStrayCardBacks: function() {
if (this._cardBack) {
var e = {};
(this._oppSlots || []).forEach(function(t) {
t.forEach(function(t) {
e[t.uuid] = !0;
});
});
var t = this, i = [];
(function n(a) {
var o = a.getComponent(cc.Sprite);
if (o && o.spriteFrame === t._cardBack && !e[a.uuid]) {
o.spriteFrame = null;
i.push(a.name);
}
for (var s = a.children || [], c = 0; c < s.length; ++c) n(s[c]);
})(this.node);
i.length && console.log("[GP] 清理残留牌背节点: " + i.join(","));
}
},
frameOf: function(e) {
if (!this._cardFrames) return null;
var t = this.cardFrameKey(e);
return this._cardFrames[t] || null;
},
_identifyCards: function(e, t) {
if (!e || 0 == e.length) return null;
for (var i = e.length, n = this, a = e.map(function(e) {
return n.rankOf(e);
}).sort(function(e, t) {
return e - t;
}), o = {}, s = 0; s < a.length; ++s) o[a[s]] = (o[a[s]] || 0) + 1;
for (var c = Object.keys(o).map(Number).sort(function(e, t) {
return e - t;
}), r = 0, l = -1, h = -1, d = 0; d < c.length; ++d) {
var u = o[c[d]];
if (u > r) {
r = u;
l = c[d];
}
4 == u && (h = c[d]);
}
var g = this._gpConf || {}, v = null == g.gp_bomb || !!g.gp_bomb, m = null == g.gp_bomb_four || !!g.gp_bomb_four;
if (v) {
if (4 == i && o[14] >= 3) return {
type: "bomb",
key: 14,
len: 4,
bombLevel: 2
};
if (4 == i && h > 0 && m) return {
type: "bomb",
key: h,
len: 4,
bombLevel: 1
};
if (5 == i && h > 0) return {
type: "bomb",
key: h,
len: 5,
bombLevel: 0
};
}
if (1 == i) return {
type: "single",
key: a[0],
len: 1
};
if (2 == i && 1 == c.length) return {
type: "pair",
key: c[0],
len: 2
};
if (3 == i && 1 == c.length) return {
type: "triple",
key: c[0],
len: 3
};
if (4 == i && 3 == r) return null == g.gp_three_one || g.gp_three_one || t && null != g.gp_last_three_one && g.gp_last_three_one ? {
type: "triple_one",
key: l,
len: 4
} : null;
if (5 == i && 3 == r && 2 == c.length && 3 == o[l]) return {
type: "triple_pair",
key: l,
len: 5
};
if (6 == i && h > 0) return null != g.gp_four_two && g.gp_four_two || t && g.gp_last_four_two_three ? {
type: "four_two",
key: h,
len: 6
} : null;
if (7 == i && h > 0) return null != g.gp_four_three && g.gp_four_three || t && g.gp_last_four_two_three ? {
type: "four_three",
key: h,
len: 7
} : null;
if (i >= 5 && c.length == i) {
var f = !0;
for (var _ in o) if (1 != o[_]) {
f = !1;
break;
}
if (f) {
var p = null == g.gp_straight_a2 || !!g.gp_straight_a2, C = this._straightKey(c, p);
return C > 0 ? {
type: "straight",
key: C,
len: i
} : null;
}
}
if (i >= 4 && i % 2 == 0 && 2 * c.length == i) {
var b = !0;
for (var y in o) if (2 != o[y]) {
b = !1;
break;
}
if (b) {
var N = this._pairStraightKey(c, p);
return N > 0 ? {
type: "pair_straight",
key: N,
len: i
} : null;
}
}
if (i >= 6 && i % 3 == 0 && 3 * c.length == i) {
var S = !0;
for (var M in o) if (3 != o[M]) {
S = !1;
break;
}
if (S) {
var B = this._pairStraightKey(c, p);
return B > 0 ? {
type: "triple_straight",
key: B,
len: i
} : null;
}
}
return null;
},
_virtRank: function(e) {
return 14 == e ? 1 : 15 == e ? 2 : e;
},
_straightKey: function(e, t) {
if (e.length < 5) return -1;
var i = e[e.length - 1];
if (15 != i) {
for (var n = !0, a = 1; a < e.length; ++a) if (e[a] != e[a - 1] + 1) {
n = !1;
break;
}
if (n) return i;
}
if (t && (e.indexOf(14) >= 0 || e.indexOf(15) >= 0)) {
var o = e.map(this._virtRank).sort(function(e, t) {
return e - t;
}), s = !0;
for (a = 1; a < o.length; ++a) if (o[a] != o[a - 1] + 1) {
s = !1;
break;
}
if (s) return o[o.length - 1];
}
return -1;
},
_pairStraightKey: function(e, t) {
if (e.length < 2) return -1;
var i = e[e.length - 1];
if (15 != i) {
for (var n = !0, a = 1; a < e.length; ++a) if (e[a] != e[a - 1] + 1) {
n = !1;
break;
}
if (n) return i;
}
if (t && (e.indexOf(14) >= 0 || e.indexOf(15) >= 0)) {
var o = e.map(this._virtRank).sort(function(e, t) {
return e - t;
}), s = !0;
for (a = 1; a < o.length; ++a) if (o[a] != o[a - 1] + 1) {
s = !1;
break;
}
if (s) return o[o.length - 1];
}
return -1;
},
_canBeat: function(e, t) {
if (!e || !t) return !1;
var i = "bomb" == e.type, n = "bomb" == t.type;
return !(!i || n) || !(!i && n) && (i && n ? e.bombLevel != t.bombLevel ? e.bombLevel > t.bombLevel : e.key > t.key : e.type == t.type && e.len == t.len && e.key > t.key);
},
collectPlayableCombos: function() {
var e = [];
if (!this._lastPlay) {
this._playableCombos = e;
return e;
}
for (var t = this._lastPlay, i = {
type: t.type,
key: t.key,
len: t.len,
bombLevel: t.bombLevel || 0
}, n = this._cards, a = n.length, o = a, s = {}, c = 1; c < 1 << a; ++c) {
for (var r = [], l = 0; l < a; ++l) c & 1 << l && r.push(n[l]);
var h = r.length == o, d = this._identifyCards(r, h);
if (d && this._canBeat(d, i)) {
var u = r.slice().sort(function(e, t) {
return e - t;
}), g = u.join(",");
if (!s[g]) {
s[g] = !0;
e.push(u);
}
}
}
e.sort(function(e, t) {
return e.length !== t.length ? e.length - t.length : e[0] - t[0];
});
this._playableCombos = e;
return e;
},
hasPlayable: function() {
return !this._lastPlay || this.collectPlayableCombos().length > 0;
},
onHint: function() {
if (this.isMyTurn() && !this._freePlay && this._lastPlay) {
var e = this._playableCombos;
e && 0 !== e.length || (e = this.collectPlayableCombos());
if (0 !== e.length) {
(null == this._hintIndex || this._hintIndex >= e.length) && (this._hintIndex = 0);
var t = e[this._hintIndex];
this._selected = {};
for (var i = 0; i < t.length; ++i) this._selected[t[i]] = !0;
this.renderHand();
this.updateTurnUI();
this._hintIndex = (this._hintIndex + 1) % e.length;
} else this.showTip("没有能压过上家的牌");
} else this.showTip("自由出牌无需提示");
},
checkAutoPass: function() {
if (this.isMyTurn() && !this._freePlay && this._lastPlay && 0 === this.collectPlayableCombos().length) {
this._selected = {};
this.renderHand();
this._playAutoPassAnim();
var e = this;
this._autoPassTimer && clearTimeout(this._autoPassTimer);
this._autoPassTimer = setTimeout(function() {
e.isMyTurn() && !e._over && cc.vv.net.send("guo");
}, 600);
}
},
_playAutoPassAnim: function() {
var e = this._n.passBtn;
if (e) {
cc.vv.audioMgr && cc.vv.audioMgr.playSFX("pass.mp3");
e.active = !0;
e.stopAllActions();
var t = e.scale;
e.scale = 1.3 * t;
cc.tween(e).to(.12, {
scale: 1.15 * t
}).to(.1, {
scale: t
}).start();
} else cc.vv.audioMgr && cc.vv.audioMgr.playSFX("pass.mp3");
},
resetHintState: function() {
this._playableCombos = null;
this._hintIndex = 0;
if (this._autoPassTimer) {
clearTimeout(this._autoPassTimer);
this._autoPassTimer = null;
}
},
initEvents: function() {
var e = this, t = cc.vv.gameNetMgr;
t.dataEventHandler = this.node;
this.node.on("gp_start", function(t) {
e.onGpStart(t && t.detail);
});
this.node.on("gp_chupai", function(t) {
e.onGpChupai(t && t.detail);
});
this.node.on("gp_turn", function(t) {
e.onGpTurn(t && t.detail);
});
this.node.on("gp_pass", function(t) {
e.onGpPass(t && t.detail);
});
this.node.on("gp_newround", function(t) {
e.onGpNewRound(t && t.detail);
});
this.node.on("gp_error", function(t) {
e.showTip(t && t.detail && t.detail.msg || "操作失败");
});
this.node.on("game_over", function(t) {
e.onGameOver(t && t.detail);
});
this.node.on("game_end", function(t) {
e.onGameEnd(t && t.detail);
});
this.node.on("game_begin", function() {
e.onNewGameBegin();
});
this.node.on("game_num", function() {
e.updateRoundLabel();
});
this.node.on("user_ready", function(t) {
e.onUserReady(t && t.detail);
});
this.node.on("new_user", function() {
e.renderSeats();
});
this.node.on("user_state_changed", function() {
e.renderSeats();
});
var i = t._pendingEvents;
if (i && i.length) {
t._pendingEvents = null;
console.log("[GP] 重放场景加载前的推送 " + i.length + " 条");
for (var n = 0; n < i.length; ++n) this.node.emit(i[n].event, {
detail: i[n].data
});
}
if ((!this._cards || 0 == this._cards.length) && t.gpMyCards && t.gpMyCards.length) {
console.log("[GP] 用缓存状态直接重绘 " + t.gpMyCards.length + " 张");
e.onGpStart({
myCards: t.gpMyCards.slice(),
mySeat: t.gpMySeat,
startSeat: t.gpTurn,
freePlay: t.gpFreePlay,
lastPlay: t.gpLastPlay,
seats: t.gpSeats,
turnDeadline: t.gpTurnDeadline
});
}
function a(i, n) {
if (!(null == i || i < 0)) {
var a = e._seatViews, o = e._seatMap, s = o && o.length ? o.indexOf(i) : i === t.seatIndex ? 0 : 1;
if (!(s < 0) && a[s]) {
var c = a[s].root.getChildByName("ChatBubble");
if (c) {
c.active = !0;
var r = c.getComponent(cc.Label);
if (r) {
r.string = n;
r.node.color = cc.color(255, 255, 255);
}
var l = c.getChildByName("New Label");
l && (l.active = !1);
var h = c.getChildByName("chatbg_ld");
if (h) {
h.active = !0;
var d = h.getComponent(cc.Sprite);
if (d && e._chatBgFrame) {
d.spriteFrame = e._chatBgFrame;
d.type = cc.Sprite.Type.SLICED;
d.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
var u = Math.min(420, Math.max(80, 26 * String(n).length + 36));
h.setContentSize(u, 52);
h.color = cc.color(45, 40, 38, 210);
}
c.getContentSize().width < 10 && c.setContentSize(220, 68);
e._chatBubbleTimers = e._chatBubbleTimers || {};
e._chatBubbleTimers[i] && clearTimeout(e._chatBubbleTimers[i]);
e._chatBubbleTimers[i] = setTimeout(function() {
c.active = !1;
}, 3e3);
}
}
}
}
this.node.on("chat_push", function(e) {
var i = e.detail;
a(t.getSeatIndexByID(i.sender), i.content);
});
this.node.on("quick_chat_push", function(i) {
var n = i.detail, o = e._quickChatInfo && e._quickChatInfo[n.content] || n.content;
a(t.getSeatIndexByID(n.sender), o);
});
this.node.on("dissolve_notice", function(t) {
e.onDissolveNotice(t && t.detail);
});
this.node.on("dissolve_cancel", function() {
e._n.dissolvePanel && (e._n.dissolvePanel.active = !1);
});
this.node.on("room_exit", function() {
e.leaveRoom();
});
this.node.on("room_dispress", function() {
e.leaveRoom();
});
var o = cc.vv.net ? cc.vv.net.sio : null;
if (o) {
var s = function() {
console.log("[GP] exit_result: 退出成功, 返回大厅/俱乐部");
e.leaveRoom();
}, c = function() {
console.log("[GP] dispress_push: 房间已解散, 返回大厅/俱乐部");
e.leaveRoom();
};
o.on("exit_result", s);
o.on("dispress_push", c);
this._sio = o;
this._sioListeners = {
exit_result: s,
dispress_push: c
};
}
this.node.on("disconnect", function() {
e.showTip("网络已断开，正在重连...");
});
this.node.on("reconnect", function() {
e.setStr(e._n.tipLabel, "");
});
},
leaveRoom: function() {
if (!this._leaving) {
this._leaving = !0;
var e = cc.director.getScene ? cc.director.getScene() : null, t = e && e.name ? e.name : "";
if ("hall" !== t && "club" !== t) {
console.log("[GP] leaveRoom fromClub=" + cc.vv.fromClub + " fromClubId=" + cc.vv.fromClubId);
cc.vv.fromClub || cc.vv.fromClubId ? cc.director.loadScene("club") : cc.director.loadScene("hall");
}
}
},
refreshFromState: function() {
this._clearBoard();
var e = cc.vv.gameNetMgr;
e.conf && (this._gpConf = e.conf);
this._refreshTitle();
if ("begin" == e.gamestate && e.gpMyCards && e.gpMyCards.length > 0) this.applyGame(e.gpMyCards, e.gpMySeat, e.gpTurn, e.gpFreePlay, e.gpLastPlay, e.gpSeats, e.gpTurnDeadline, !1); else {
this.showPrepare();
this.renderSeats();
this.updateRoundLabel();
var t = e.seats ? e.seats[e.seatIndex] : null;
if (t && t.ready) {
this._n.readyBtn.active = !1;
this._n.prepareInfo.active = !0;
this.setLabel(this._n.prepareInfo, "已准备，等待其他玩家…");
}
e.numOfGames >= e.maxNumOfGames && e.maxNumOfGames > 0 && (this._final = !0);
}
},
applyGame: function(e, t, i, n, a, o, s, c) {
this.resetHintState();
this._cards = e instanceof Array ? e.slice() : [];
this._mySeat = null != t ? t : 0;
this._turn = null != i ? i : 0;
this._freePlay = null == n || !!n;
this._lastPlay = a || null;
this._deadline = s || 0;
this._over = !1;
this.restoreSettleBg();
this._selected = {};
this._n.readyBtn.active = !1;
this._n.prepareInfo.active = !1;
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this._n.handArea.active = !0;
this._n.playArea.active = !0;
this.renderSeats();
this.renderHand();
this.renderLastPlay();
this.updateTurnUI();
this.updateRoundLabel();
this.updateActionBtns();
this._showHistoryIfEnabled();
this.checkAutoPass();
c && this._isFreshDeal() && this._playDealAnim();
},
_isFreshDeal: function() {
if (cc.vv.replayMgr && cc.vv.replayMgr.isReplay()) return !1;
var e = cc.vv.gameNetMgr.gpSeats;
if (!e) return !1;
for (var t = 0; t < e.length; ++t) {
var i = e[t];
if (i && 16 != (i.count || 0)) return !1;
}
return !0;
},
_playDealAnim: function() {
cc.vv.audioMgr && cc.vv.audioMgr.playSFX("deal.mp3");
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 0)), t = [], i = 0, n = this, a = function(n, a, o) {
if (null != a && 0 != n.length) {
var s = a.convertToNodeSpaceAR(e);
o && n.sort(o);
for (var c = 0; c < n.length; ++c) {
var r = n[c], l = r.x, h = r.y, d = r.opacity;
t.push({
node: r,
fx: l,
fy: h,
op: d
});
r.setPosition(s);
r.opacity = 0;
r.runAction(cc.sequence(cc.delayTime(.06 * c), cc.spawn(cc.moveTo(.15, cc.v2(l, h)), cc.fadeTo(.15, d))));
var u = .06 * c + .15;
u > i && (i = u);
}
}
}, o = [], s = null, c = 0; c < this._handSlots.length; ++c) {
var r = this._handSlots[c];
if (r && r.active && null != r._cardId) {
o.push(r);
s = r.parent;
}
}
a(o, s, function(e, t) {
return e.x - t.x;
});
for (var l = 0; l < this._oppSlots.length; ++l) {
var h = this._oppSlots[l];
if (h) {
for (var d = [], u = null, g = 0; g < h.length; ++g) {
var v = h[g];
if (v && v.active) {
d.push(v);
u = v.parent;
}
}
d.length > 0 && a(d, u, function(e, t) {
return e.x - t.x;
});
}
}
if (0 != t.length) {
this._dealAnimNodes = t;
this._dealAnimating = !0;
this._dealAnimUntil = Date.now() + 1e3 * (i + .3);
this._dealAnimId = (this._dealAnimId || 0) + 1;
var m = this._dealAnimId;
this.scheduleOnce(function() {
if (n._dealAnimId == m) {
n._dealAnimating = !1;
n._dealAnimNodes = null;
n._cards && n._cards.length > 0 && n.renderHand();
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
i.node.setPosition(i.fx, i.fy);
i.node.opacity = i.op;
}
}
this._dealAnimNodes = null;
}
},
onGpStart: function(e) {
if (e) {
e.conf && (this._gpConf = e.conf);
this._refreshTitle();
this._playHistory = [];
this._historyRound = 0;
this._showHistoryIfEnabled();
this._renderHistory();
var t = cc.vv.gameNetMgr, i = null != e.startSeat ? e.startSeat : null != e.turn ? e.turn : t.gpTurn;
this.applyGame(e.myCards, null != e.mySeat ? e.mySeat : t.gpMySeat, i, e.freePlay, e.lastPlay, e.seats, e.turnDeadline, !0);
}
},
onGpChupai: function(e) {
if (e) {
this.resetHintState();
this._lastPlay = {
seatIndex: e.seatIndex,
type: e.type,
key: e.key,
len: e.len,
bombLevel: e.bombLevel || 0,
pais: (e.pais || []).slice()
};
this._freePlay = !1;
this._selected = {};
this._cards = (cc.vv.gameNetMgr.gpMyCards || []).slice();
this._isHistoryEnabled() && this._addHistory({
round: this._historyRound,
seatIndex: e.seatIndex,
type: e.type,
pais: (e.pais || []).slice()
});
this.renderSeats();
this.renderHand();
this.renderLastPlay();
}
},
onGpTurn: function(e) {
if (e) {
var t = cc.vv.gameNetMgr;
this.resetHintState();
this._turn = e.turn;
this._freePlay = !!e.freePlay;
this._lastPlay = e.lastPlay || null;
this._deadline = e.turnDeadline || 0;
this._cards = (t.gpMyCards || []).slice();
this.renderSeats();
this.renderHand();
this.renderLastPlay();
this.updateTurnUI();
this.checkAutoPass();
}
},
onGpPass: function(e) {
if (e) {
this.resetHintState();
this.renderSeats();
}
},
onGpNewRound: function(e) {
if (e) {
this.resetHintState();
this._turn = e.turn;
this._freePlay = !0;
this._lastPlay = null;
this._deadline = e.turnDeadline || 0;
this._isHistoryEnabled() && this._historyNextRound();
this.renderSeats();
this.renderLastPlay();
this.updateTurnUI();
}
},
onNewGameBegin: function() {
this._final && (this._overRounds = []);
this._over = !1;
this._final = !1;
this._selected = {};
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this._n.gameResult && (this._n.gameResult.active = !1);
this._n.prepareInfo.active = !1;
this._n.readyBtn.active = !1;
this._n.handArea.active = !0;
this._n.playArea.active = !0;
if (this._n.settleAgainBtn) {
var e = this._n.settleAgainBtn.getComponent(cc.Label);
if (e) {
e.enabled = !0;
e.string = "准备";
}
}
this.updateActionBtns();
},
isMyTurn: function() {
return !this._over && this._turn == this._mySeat;
},
onPlay: function() {
if (this.isMyTurn()) {
var e = [];
for (var t in this._selected) this._selected[t] && e.push(parseInt(t));
if (0 != e.length) {
this.resetHintState();
cc.vv.audioMgr && cc.vv.audioMgr.playSFX("deal.mp3");
cc.vv.net.send("chupai", e);
} else this.showTip("请先选择要出的牌");
} else this.showTip("还没轮到你出牌");
},
onPass: function() {
if (this.isMyTurn()) {
this.resetHintState();
cc.vv.net.send("guo");
this._selected = {};
this.renderHand();
}
},
onSlotTouched: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this.isMyTurn() && !this._over) {
var t = e._cardId;
if (null != t) {
this._selected[t] = !this._selected[t];
e.y = this._selected[t] ? this._selectUpOffset : 0;
cc.vv.audioMgr && cc.vv.audioMgr.playSFX("select.mp3");
this.updateTurnUI();
}
}
},
renderAll: function() {
this.renderHand();
this.renderLastPlay();
this.renderSeats();
this.updateRoundLabel();
this.updateTurnUI();
},
renderHand: function() {
this._cancelDealAnim();
var e = this._cards.slice(), t = this;
e.sort(function(e, i) {
var n = t.rankOf(e) - t.rankOf(i);
return 0 != n ? n : t.suitOf(e) - t.suitOf(i);
});
var i = e.length, n = this, a = e.map(function(e) {
var t = n.frameOf(e);
return e + "=" + (t ? t.name : "NULL");
});
console.log("[GP] renderHand N=" + i + " slots=" + this._handSlots.length + " 牌=" + a.join(" | "));
for (var o = 0; o < this._handSlots.length; ++o) {
var s = this._handSlots[o];
if (o < i) {
var c = e[o];
s._cardId = c;
s.getComponent(cc.Sprite).spriteFrame = this.frameOf(c);
s.active = !0;
s.x = 60 * (o - (i - 1) / 2);
s.y = this._selected[c] ? this._selectUpOffset : 0;
} else {
s._cardId = null;
s.active = !1;
}
}
0 == e.length && this.setStr(this._n.tipLabel, "");
},
renderLastPlay: function() {
var e = this._lastPlay, t = e && e.pais ? e.pais.slice() : [];
this._n.playArea && (this._n.playArea.active = !0);
this._n.cardsContainer && (this._n.cardsContainer.active = !0);
if (this._playAnimBusy) this._pendingRenderPais = t; else {
for (var i = !1, n = 0; n < this._playSlots.length; ++n) if (this._playSlots[n].active) {
i = !0;
break;
}
if (i) {
this._playAnimBusy = !0;
var a = this, o = this._n.cardsContainer;
if (o) cc.tween(o).to(.07, {
opacity: 0
}).call(function() {
a._fillPlaySlots(t);
cc.tween(o).to(.07, {
opacity: 255
}).call(function() {
a._playAnimBusy = !1;
if (null != a._pendingRenderPais) {
var e = a._pendingRenderPais;
a._pendingRenderPais = null;
a._playAnimBusy = !1;
a._lastPlay = {
pais: e
};
a.renderLastPlay();
}
}).start();
}).start(); else {
a._fillPlaySlots(t);
a._playAnimBusy = !1;
}
} else this._fillPlaySlots(t);
}
},
_fillPlaySlots: function(e) {
for (var t = [], i = 0; i < (e || []).length; ++i) {
var n = this.frameOf(e[i]);
t.push(e[i] + ":" + (n ? n.name : "NULL"));
}
console.log("[GP] fillPlaySlots slots=" + this._playSlots.length + " 牌=" + JSON.stringify(e) + " 帧=" + JSON.stringify(t));
for (var a = 0; a < this._playSlots.length; ++a) {
var o = this._playSlots[a];
if (a < e.length) {
var s = this.frameOf(e[a]);
o.getComponent(cc.Sprite).spriteFrame = s;
o.active = !0;
} else o.active = !1;
}
this.setStr(this._n.playOwnerLabel, "");
},
seatName: function(e, t) {
var i = t || (cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null);
if (i && i[e]) {
var n = i[e];
if (n.name) return n.name;
if (n.userid == cc.vv.userMgr.userId) return cc.vv.userMgr.userName || "我";
}
return e == this._mySeat ? "我" : "玩家" + (e + 1);
},
renderSeats: function() {
this._cancelDealAnim();
var e = cc.vv.gameNetMgr, t = e.gpSeats, i = e.seats, n = "begin" == e.gamestate && t && t.length > 0, a = n && t ? null != this._mySeat ? this._mySeat : e.gpMySeat : e.seatIndex;
(null == a || a < 0) && (a = 0);
var o = [], s = {};
o.push(a);
s[a] = !0;
var c = n ? t ? t.length : 0 : i ? i.length : 0;
c <= 0 && (c = this.maxPlayers || 2);
for (var r = 0; r < c && o.length < 3; ++r) if (!s[r]) {
o.push(r);
s[r] = !0;
}
this._seatMap = o;
for (var l = 0; l < this._seatViews.length; ++l) {
var h = this._seatViews[l];
if (h && h.root) {
var d = l < o.length ? o[l] : l;
if (d >= c) h.root.active = !1; else {
h.root.active = !0;
var u = d == a, g = "", v = 0, m = "", f = "";
if (n) {
var _ = t[d];
if (_) {
g = _.name || (u ? "我" : "玩家" + (d + 1));
v = _.score || 0;
m = "剩" + (_.count || 0) + "张";
0 == _.count ? f = "已出完" : _.passed ? f = "不要" : d != this._turn || this._over || (f = "出牌中");
}
} else {
var p = i ? i[d] : null;
if (p && p.userid > 0) {
g = p.name || (u ? "我" : "玩家" + (d + 1));
v = p.score || 0;
m = p.ready ? "已准备" : "未准备";
f = u ? "我" : "";
} else {
g = "等待玩家";
m = "";
}
}
var C = "等待玩家" !== g;
h.name && this.setStr(h.name, g);
h.count && this.setStr(h.count, C ? "" + v : "");
h.remain && this.setStr(h.remain, m);
if (h.state) {
this.setStr(h.state, f);
h.state.color = d == this._turn && n && !this._over ? cc.color(255, 230, 90) : cc.color(200, 200, 200);
}
}
}
}
this.renderOppHands(t, n);
this.updateTurnUI();
},
renderOppHands: function(e, t) {
for (var i = cc.vv.gameNetMgr, n = e || (i ? i.gpSeats : null), a = this._seatMap || [], o = 1; o < this.maxPlayers; ++o) {
var s = this._oppSlots[o - 1];
if (s) for (var c = o < a.length ? a[o] : o, r = t && n && n[c] && n[c].count || 0, l = 0; l < s.length; ++l) s[l].active = l < r;
}
},
_blankSprite: function(e) {
if (null != e) {
var t = e.getComponent(cc.Sprite);
t && (t.spriteFrame = null);
}
},
_clearBoard: function() {
this._cards = [];
this._lastPlay = null;
this._selected = {};
var e, t = this._handSlots || [];
for (e = 0; e < t.length; ++e) {
t[e]._cardId = null;
this._blankSprite(t[e]);
t[e].active = !1;
}
var i = this._playSlots || [];
for (e = 0; e < i.length; ++e) {
this._blankSprite(i[e]);
i[e].active = !1;
}
var n = this._oppSlots || [];
for (e = 0; e < n.length; ++e) for (var a = n[e], o = 0; o < a.length; ++o) a[o].active = !1;
this._n.handArea && (this._n.handArea.active = !1);
this._n.playArea && (this._n.playArea.active = !1);
this._n.cardsContainer && (this._n.cardsContainer.active = !1);
this._n.countdownLabel && this.setStr(this._n.countdownLabel, "");
this._n.playOwnerLabel && this.setStr(this._n.playOwnerLabel, "");
this._n.tipLabel && this.setStr(this._n.tipLabel, "");
},
updateTurnUI: function() {
if (null != this._n.playBtn) {
var e = this.findNode(this.node, "ops"), t = this.findNode(this.node, "arrow");
if (cc.vv.gameNetMgr && "begin" == cc.vv.gameNetMgr.gamestate) {
if (e) {
e.active = !0;
e.opacity = 255;
}
t && (t.active = !0);
var i = this.isMyTurn();
console.log("[GP] updateTurnUI turn=", this._turn, "mySeat=", this._mySeat, "myTurn=", i, "freePlay=", this._freePlay);
var n = !1;
for (var a in this._selected) if (this._selected[a]) {
n = !0;
break;
}
this._n.playBtn.active = i;
this._n.playBtn.opacity = 255;
this._n.playBtn.zIndex = 999;
this.setBtnEnabled(this._n.playBtn, n);
this._n.passBtn.active = i && !this._freePlay;
if (this._n.passBtn) {
this._n.passBtn.opacity = 255;
this._n.passBtn.zIndex = 999;
}
if (this._n.hintBtn) {
this._n.hintBtn.opacity = 255;
this._n.hintBtn.zIndex = 999;
if (i && !this._freePlay && this._lastPlay) {
var o = this._playableCombos;
o || (o = this.collectPlayableCombos());
this.setBtnEnabled(this._n.hintBtn, o.length > 0);
} else this.setBtnEnabled(this._n.hintBtn, !1);
this._n.hintBtn.active = i;
}
this.updateArrowPointer();
i ? this.setStr(this._n.tipLabel, (this._freePlay, "请出牌")) : !this._over && this._turn >= 0 && this.setStr(this._n.tipLabel, "上家出牌中…");
} else {
e && (e.active = !1);
t && (t.active = !1);
this._n.playBtn.active = !1;
this._n.passBtn.active = !1;
this._n.hintBtn && (this._n.hintBtn.active = !1);
this.setStr(this._n.tipLabel, "");
this.setStr(this._n.playOwnerLabel, "");
}
}
},
setBtnEnabled: function(e, t) {
if (e) {
e.getComponent(cc.Sprite);
var i = e.getChildByName("settleAgainBtnLabel") || e.getChildByName("lblTip") || null;
if (!i) for (var n = 0; n < e.children.length; ++n) if (e.children[n].getComponent(cc.Label)) {
i = e.children[n];
break;
}
if (t) {
e.opacity = 255;
e.interactable = !0;
if (i) {
var a = i.getComponent(cc.Label);
a && (a.color = cc.color(255, 255, 255));
}
} else {
e.opacity = 130;
e.interactable = !1;
if (i) {
var o = i.getComponent(cc.Label);
o && (o.color = cc.color(200, 200, 200));
}
}
}
},
updateArrowPointer: function() {
if (this._n.arrowPointer) {
var e = !this._over && this._turn >= 0;
this._n.arrow && (this._n.arrow.active = e);
if (e) {
for (var t, i = this._seatMap || [], n = 0, a = 0; a < i.length; ++a) if (i[a] === this._turn) {
n = a;
break;
}
t = this.maxPlayers >= 3 ? 0 === n ? 0 : 1 === n ? 1 : 3 : 0 === n ? 0 : 2;
var o = this._n.arrowPointer.children;
for (a = 0; a < o.length; ++a) o[a].active = a === t;
}
}
},
setArrowTime: function(e) {
this._n.arrowTime && this.setStr(this._n.arrowTime, e);
},
updateRoundLabel: function() {
var e = cc.vv.gameNetMgr;
if (null != this._n.roundLabel) {
var t = e.numOfGames || 0, i = e.maxNumOfGames || 0;
this.setStr(this._n.roundLabel, i > 0 ? "第" + t + "/" + i + "局" : "");
}
},
update: function() {
if (this._over || this._deadline <= 0) {
this.setArrowTime("");
this._n.countdownLabel && this.setStr(this._n.countdownLabel, "");
} else {
var e = Math.ceil((this._deadline - Date.now()) / 1e3);
e < 0 && (e = 0);
var t = String(e);
t.length < 2 && (t = "0" + t);
this.setArrowTime(t);
this.setStr(this._n.countdownLabel, String(e));
}
},
showTip: function(e) {
if (null != this._n.tipLabel) {
this.setStr(this._n.tipLabel, e || "");
this._lastTip = e || "";
}
},
setLabel: function(e, t) {
if (null != e) {
var i = e.getComponent(cc.Label);
i && (i.string = t);
}
},
setStr: function(e, t) {
if (null != e) {
var i = e.getComponent(cc.Label);
i && (i.string = t || "");
}
},
setBlackStr: function(e, t) {
if (null != e) {
e.color = cc.color(0, 0, 0, 255);
var i = e.getComponent(cc.Label);
if (i) {
i.string = t || "";
i._N$color && (i._N$color = cc.color(0, 0, 0, 255));
i.setColor && i.setColor(cc.color(0, 0, 0, 255));
}
}
},
showPrepare: function() {
this.restoreSettleBg();
this._clearBoard();
this._n.readyBtn.active = !0;
this._n.prepareInfo.active = !1;
this._n.handArea.active = !1;
this._n.playArea.active = !1;
this._n.playBtn.active = !1;
this._n.passBtn.active = !1;
this._n.hintBtn && (this._n.hintBtn.active = !1);
this.setStr(this._n.countdownLabel, "");
this.setStr(this._n.tipLabel, "等待所有玩家准备后开始");
this._n.historyBtn && (this._n.historyBtn.active = !1);
this._n.historyPanel && (this._n.historyPanel.active = !1);
this.updateActionBtns();
},
onReady: function() {
cc.vv.net.send("ready");
this._n.readyBtn.active = !1;
this._n.prepareInfo.active = !0;
this.setLabel(this._n.prepareInfo, "已准备，等待其他玩家…");
this.setStr(this._n.tipLabel, "已准备，等待其他玩家…");
this.updateActionBtns();
},
onUserReady: function(e) {
if (e) {
this.renderSeats();
if (e.userid == cc.vv.userMgr.userId) {
this._n.readyBtn.active = !1;
this._n.prepareInfo.active = !0;
this.setLabel(this._n.prepareInfo, "已准备，等待其他玩家…");
}
this.updateActionBtns();
}
},
onSettleAgain: function() {
if (this._final) cc.vv.net.send("exit"); else {
this._n.settlePanel.active = !1;
this._n.readyBtn.active = !1;
this._n.prepareInfo.active = !0;
this.setLabel(this._n.prepareInfo, "已准备，等待其他玩家…");
this.restoreSettleBg();
this._over = !1;
this.updateActionBtns();
cc.vv.net.send("ready");
}
},
onSettleClose: function() {
this._n.settlePanel && (this._n.settlePanel.active = !1);
if (!this._final) {
this.setStr(this._n.tipLabel, "等待其他玩家准备…");
this.restoreSettleBg();
this._over = !1;
this.updateActionBtns();
cc.vv.net.send("ready");
}
},
onGameOver: function(e) {
if (e) {
var t = cc.vv.gameNetMgr;
this._over = !0;
this.updateActionBtns();
this.resetHintState();
var i = this.findNode(this.node, "ops");
i && (i.active = !1);
this.hideSettleBg();
this._n.playBtn.active = !1;
this._n.passBtn.active = !1;
this._n.hintBtn && (this._n.hintBtn.active = !1);
this._n.arrow && (this._n.arrow.active = !1);
this.setStr(this._n.tipLabel, "");
this.setStr(this._n.countdownLabel, "");
for (var n = 0, a = 0; a < e.length; ++a) if (e[a].seatindex == cc.vv.gameNetMgr.seatIndex) {
n = e[a].delta || 0;
break;
}
cc.vv.audioMgr && (n > 0 ? cc.vv.audioMgr.playSFX("win.mp3") : n < 0 && cc.vv.audioMgr.playSFX("lose.mp3"));
var o = this;
setTimeout(function() {
o.updateActionBtns();
}, 0);
for (var s = [], c = [], r = 0; r < e.length; ++r) {
var l = e[r], h = l.name || "玩家" + (l.seatindex + 1), d = h + "：";
if (l.isWinner) d += "出完手牌  赢 +" + l.delta + "分"; else {
d += "剩" + l.remain + "张";
l.allClosed && (d += "（全关×2）");
d += "  " + l.delta + "分";
}
s.push(d);
c.push(h + " " + (null != l.totalscore ? l.totalscore : l.score));
}
s.push("");
s.push("总分：" + c.join("   "));
this._overRounds = this._overRounds || [];
for (var u = [], g = 0; g < e.length; ++g) {
var v = e[g];
u.push({
name: v.name || "玩家" + (v.seatindex + 1),
score: v.delta || 0
});
}
this._overRounds.push({
index: t.numOfGames,
scores: u
});
if (t.maxNumOfGames > 0 && t.numOfGames >= t.maxNumOfGames) this.onGameEnd({
roundHistory: this._overRounds
}); else {
this.setBlackStr(this._n.settleTitle, "本局结算");
this.setBlackStr(this._n.settleContent, s.join("\n"));
this._n.settleAgainBtn && (this._n.settleAgainBtn.active = !0);
this._n.settleExitBtn && (this._n.settleExitBtn.active = !1);
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this._n.settlePanel.active = !0;
this._n.settleNewBtn && (this._n.settleNewBtn.active = !0);
this.setStr(this._n.tipLabel, "本局结束");
}
}
},
onGameEnd: function(e) {
this._final = !0;
for (var t = [], i = cc.vv.gameNetMgr.seats || [], n = 0; n < i.length; ++n) {
var a = i[n];
a && a.userid > 0 && t.push((a.name || "玩家") + " " + (a.score > 0 ? "+" + a.score : a.score));
}
var o = [ "最终总分：" + t.join("   ") ], s = e && e.roundHistory && e.roundHistory.length ? e.roundHistory : this._overRounds || [];
s.length && o.push("");
for (var c = 0; c < s.length; ++c) {
for (var r = s[c] || {}, l = [], h = r.scores || [], d = 0; d < h.length; ++d) {
var u = h[d] || {};
l.push((u.name || "玩家") + " " + (u.score > 0 ? "+" + u.score : u.score));
}
o.push("第" + (r.index || c + 1) + "局  " + l.join("   "));
}
var g = o.join("\n");
if (this._showFinalResult(o)) {
this._n.settlePanel && (this._n.settlePanel.active = !1);
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this.setStr(this._n.tipLabel, "整场结束");
} else if (null != this._n.finalSettlePanel) {
this._n.settlePanel.active = !1;
this.setBlackStr(this._n.finalSettleTitle, "整场结算");
this._fitSettleFont(this._n.finalSettleContent, o);
this.setBlackStr(this._n.finalSettleContent, g);
this._n.finalSettlePanel.active = !0;
this.setStr(this._n.tipLabel, "整场结束");
} else {
this._n.settleAgainBtn && (this._n.settleAgainBtn.active = !1);
this._n.settleCloseBtn && (this._n.settleCloseBtn.active = !1);
if (this._n.settleExitBtn) {
this._n.settleExitBtn.active = !0;
this._n.settleExitBtn.x = 0;
this._n.settleAgainBtn && (this._n.settleExitBtn.y = this._n.settleAgainBtn.y);
}
this.setBlackStr(this._n.settleTitle, "整场结算");
this._fitSettleFont(this._n.settleContent, o);
this.setBlackStr(this._n.settleContent, g);
this._n.settlePanel.active = !0;
this.setStr(this._n.tipLabel, "整场结束");
}
},
_showFinalResult: function(e) {
var t = this._n.gameResult;
if (null == t) return !1;
var i = t.getChildByName("resultList");
i && i.destroy();
for (var n = 0, a = 0; a < e.length; ++a) {
for (var o = 0, s = e[a] || "", c = 0; c < s.length; ++c) o += s.charCodeAt(c) > 255 ? 2 : 1;
o > n && (n = o);
}
var r = n > 0 ? Math.floor(860 / n) : 30, l = Math.floor(480 / Math.max(1, e.length) / 1.3);
r > l && (r = l);
r > 30 && (r = 30);
r < 14 && (r = 14);
var h = new cc.Node("resultList"), d = h.addComponent(cc.Label);
d.string = e.join("\n");
d.fontSize = r;
d.lineHeight = r + 10;
d.enableWrapText = !1;
d.overflow = cc.Label.Overflow.NONE;
d.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
d.verticalAlign = cc.Label.VerticalAlign.CENTER;
h.color = cc.color(0, 0, 0, 255);
h.setPosition(0, 20);
t.addChild(h);
t.active = !0;
return !0;
},
_fitSettleFont: function(e, t) {
if (null != e) {
var i = e.getComponent(cc.Label);
if (i) {
for (var n = 0, a = 0; a < t.length; ++a) {
for (var o = 0, s = t[a] || "", c = 0; c < s.length; ++c) o += s.charCodeAt(c) > 255 ? 2 : 1;
o > n && (n = o);
}
var r = e.width > 0 ? e.width : e.parent ? .9 * e.parent.width : 630, l = n > 0 ? Math.floor(r / n) : 32;
l > 32 && (l = 32);
l < 14 && (l = 14);
i.fontSize = l;
i.lineHeight = l + 4;
}
}
},
onBtnSettings: function() {
this._n.settingsPanel && (this._n.settingsPanel.active = !this._n.settingsPanel.active);
},
onBtnChat: function() {
this._n.chatPanel && (this._n.chatPanel.active = !this._n.chatPanel.active);
},
onBtnVoice: function() {
this.showTip("语音功能开发中");
},
onBtnSettingsClose: function() {
this._n.settingsPanel && (this._n.settingsPanel.active = !1);
},
onBtnSettingsDissolve: function() {
this._n.settingsPanel && (this._n.settingsPanel.active = !1);
if ("begin" == cc.vv.gameNetMgr.gamestate) {
cc.vv.net.send("dissolve_request");
this.showTip("已发起解散申请，等待其他玩家同意");
} else cc.vv.net.send("dispress");
},
onBtnChatSend: function() {
if (this._n.iptChat) {
var e = this._n.iptChat.getComponent(cc.EditBox), t = e && e.string || "";
if ("" != t) {
cc.vv.net.send("chat", t);
e && (e.string = "");
this._n.chatPanel && (this._n.chatPanel.active = !1);
}
}
},
onTabQuick: function() {
this._n.quickchatlist && (this._n.quickchatlist.active = !0);
this._n.emojis && (this._n.emojis.active = !1);
},
onTabEmoji: function() {
this._n.quickchatlist && (this._n.quickchatlist.active = !1);
this._n.emojis && (this._n.emojis.active = !0);
},
onBtnChatClose: function() {
this._n.chatPanel && (this._n.chatPanel.active = !1);
},
hideSettleBg: function() {
this._settleHidden = [];
for (var e = [ "prepare", "infobar", "msg_set_bg" ], t = 0; t < e.length; ++t) {
var i = this.findNode(this.node, e[t]);
if (i && i.active) {
i.active = !1;
this._settleHidden.push(i);
}
}
for (var n = [ this._n.btnSettings, this._n.btnChat, this._n.btnVoice ], a = 0; a < n.length; ++a) n[a] && (n[a].active = !1);
this._n.prepareInfo && (this._n.prepareInfo.active = !1);
},
restoreSettleBg: function() {
for (var e = this._settleHidden || [], t = 0; t < e.length; ++t) e[t].active = !0;
this._settleHidden = [];
},
updateActionBtns: function() {
var e = cc.vv.gameNetMgr, t = "begin" != e.gamestate && !this._final, i = e.seats ? e.seats[e.seatIndex] : null, n = !(!i || !i.ready);
if (t) {
this._n.exitBtn && (this._n.exitBtn.active = !n);
this._n.dissolveBtn && (this._n.dissolveBtn.active = n);
} else {
this._n.exitBtn && (this._n.exitBtn.active = !1);
this._n.dissolveBtn && (this._n.dissolveBtn.active = !1);
}
var a = !this._over && !this._final;
this._n.btnSettings && (this._n.btnSettings.active = a);
this._n.btnChat && (this._n.btnChat.active = a);
this._n.btnVoice && (this._n.btnVoice.active = a);
if (!a) {
this._n.settingsPanel && (this._n.settingsPanel.active = !1);
this._n.chatPanel && (this._n.chatPanel.active = !1);
}
},
onExit: function() {
var e = this, t = function() {
if (e._final) {
e._n.gameResult && (e._n.gameResult.active = !1);
e._n.finalSettlePanel && (e._n.finalSettlePanel.active = !1);
e._n.settlePanel && (e._n.settlePanel.active = !1);
cc.vv.net.send("leave_room");
setTimeout(function() {
e._leaving || e.leaveRoom();
}, 800);
} else {
cc.vv.net.send("exit");
setTimeout(function() {
if (cc.isValid(e.node) && !e._leaving && null != cc.vv.gameNetMgr.roomId) {
cc.vv.gameNetMgr.clearRoomState && cc.vv.gameNetMgr.clearRoomState();
e.leaveRoom();
}
}, 2e3);
}
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
cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show(null, "解散房间不扣房卡，是否确定解散？", t, !0) : t();
},
onDissolveNotice: function() {
if (null != this._n.dissolvePanel) {
this._n.dissolvePanel.active = !0;
this._n.dissolveLabel && this.setStr(this._n.dissolveLabel, "有玩家申请解散房间，是否同意？");
}
},
onDissolveAgree: function() {
cc.vv.net.send("dissolve_agree");
this._n.dissolvePanel.active = !1;
},
onDissolveReject: function() {
cc.vv.net.send("dissolve_reject");
this._n.dissolvePanel.active = !1;
}
});
cc._RF.pop();
}, {} ],
GameOverZP: [ function(e, t) {
"use strict";
cc._RF.push(t, "40144pIITVBiZLYFIIjZDZV", "GameOverZP");
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
u._gameresult && (u._gameresult.active = !0);
u._gameover && (u._gameover.active = !1);
});
}
},
onGameOver: function(e) {
var t = cc.vv.gameNetMgr.conf.type;
"zp" == t || "zp4" == t || "wujin" == t || "zj" == t || "zj_bt" == t || "zj4" == t || "zj4_bt" == t ? this.onGameOver_ZJ(e) : "xzdd" == t ? this.onGameOver_XZDD(e) : this.onGameOver_XLCH(e);
},
onGameOver_ZJ: function(e) {
console.log(e);
if (e && 0 != e.length) {
this._gameover.active = !0;
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
for (var t = cc.vv.gameNetMgr.seatIndex, i = 0, n = 0; n < e.length; ++n) if (e[n] && e[n].userid == cc.vv.gameNetMgr.seats[t].userid) {
i = e[n].score;
break;
}
i > 0 ? this._win.active = !0 : i < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (n = 0; n < this._seats.length; ++n) {
var a = this._seats[n], o = e[n], s = a.username.node.parent;
if (o) {
s.active = !0;
for (var c = !1, r = [], l = a.hupai, h = 0; h < l.children.length; ++h) l.children[h].active = !1;
var d = 0, u = o.huinfo || [];
for (h = 0; h < u.length; ++h) {
var g = u[h];
c = c || g.ishupai;
if (g.ishupai) {
if (d < l.children.length) {
var v = l.children[d];
v.active = !0;
v.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", g.pai);
d++;
}
"zimo" == g.action ? r.push("自摸") : "hu" == g.action && r.push("接炮胡");
if (null != g.fan) {
r.push(g.fan + "台");
g.tailog && g.tailog.length && r.push("\n" + g.tailog.join("\n"));
}
} else "fangpao" == g.action && r.push("放炮");
}
a.hu.active = c;
var m = o.angangs || [], f = o.diangangs || [], _ = o.wangangs || [], p = o.pengs || [], C = o.chis || [];
m.length && r.push("暗杠x" + m.length);
f.length && r.push("明杠x" + f.length);
_.length && r.push("补杠x" + _.length);
a.username.string = cc.vv.gameNetMgr.seats[n] ? cc.vv.gameNetMgr.seats[n].name : "";
a.zhuang.active = cc.vv.gameNetMgr.button == n;
var b = cc.vv.gameNetMgr.button == n && cc.vv.gameNetMgr.laozhuang || 0;
this.updateSettleLaoZhuang(a, b);
a.reason.string = r.join("、");
o.score > 0 ? a.score.string = "+" + o.score : a.score.string = "" + o.score;
for (var y = 0; y < a.mahjongs.childrenCount; ++y) a.mahjongs.children[y].active = !1;
var N = (o.holds || []).slice();
"object" == typeof N && null != N.length || (N = []);
cc.vv.mahjongmgr.sortMJ(N);
var S = m.length + _.length + f.length, M = 3 * (p.length + S + C.length);
for (y = 0; y < N.length; ++y) {
var B = N[y], w = a.mahjongs.children[y + M];
if (null == w) break;
w.active = !0;
w.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", B);
}
for (y = 0; y < a._pengandgang.length; ++y) a._pengandgang[y].active = !1;
var A = 0;
for (y = 0; y < m.length; ++y) {
this.initPengAndGangs(a, A, m[y], "angang");
A++;
}
for (y = 0; y < f.length; ++y) {
this.initPengAndGangs(a, A, f[y], "diangang");
A++;
}
for (y = 0; y < _.length; ++y) {
this.initPengAndGangs(a, A, _[y], "wangang");
A++;
}
for (y = 0; y < p.length; ++y) {
var x = o.pengTiles && o.pengTiles[y] || null;
this.initPengAndGangs(a, A, p[y], "peng", x);
A++;
}
for (y = 0; y < C.length; ++y) {
var T = C[y];
if (T && T.length > 0) {
this.initChisGroup(a, A, T);
A++;
}
}
} else s.active = !1;
}
} else this._gameresult.active = !0;
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
var g = 0;
o && (g = a.fan);
n.fan.string = g + "番";
a.score > 0 ? n.score.string = "+" + a.score : n.score.string = a.score;
var v = -1;
o && (v = a.holds.pop());
cc.vv.mahjongmgr.sortMJ(a.holds, a.dingque);
o && a.holds.push(v);
for (var m = 0; m < n.mahjongs.childrenCount; ++m) (_ = n.mahjongs.children[m]).active = !1;
var f = 3 * (a.pengs.length + s);
for (m = 0; m < a.holds.length; ++m) {
var _, p = a.holds[m];
(_ = n.mahjongs.children[m + f]).active = !0;
_.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", p);
}
for (m = 0; m < n._pengandgang.length; ++m) n._pengandgang[m].active = !1;
var C = 0, b = a.angangs;
for (m = 0; m < b.length; ++m) {
var y = b[m];
this.initPengAndGangs(n, C, y, "angang");
C++;
}
for (b = a.diangangs, m = 0; m < b.length; ++m) {
y = b[m];
this.initPengAndGangs(n, C, y, "diangang");
C++;
}
for (b = a.wangangs, m = 0; m < b.length; ++m) {
y = b[m];
this.initPengAndGangs(n, C, y, "wangang");
C++;
}
var N = a.pengs;
if (N) for (m = 0; m < N.length; ++m) {
y = N[m];
this.initPengAndGangs(n, C, y, "peng");
C++;
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
var u = "", g = "", v = a;
if (h.ishupai) "hu" == h.action ? u = "接炮胡" : "zimo" == h.action ? u = "自摸" : "ganghua" == h.action ? u = "杠上花" : "dianganghua" == h.action ? u = "点杠花" : "gangpaohu" == h.action ? u = "杠炮胡" : "qiangganghu" == h.action ? u = "抢杠胡" : "chadajiao" == h.action && (u = "查大叫"); else {
u = "fangpao" == h.action ? "放炮" : "gangpao" == h.action ? "杠上炮" : "beiqianggang" == h.action ? "被抢杠" : "被查大叫";
h = (v = e[h.target]).huinfo[h.index];
}
u += "(";
if ("7pairs" == h.pattern) {
u += "七对";
g = "、";
} else if ("l7pairs" == h.pattern) {
u += "龙七对";
g = "、";
} else if ("j7pairs" == h.pattern) {
u += "将七对";
g = "、";
} else if ("duidui" == h.pattern) {
u += "碰碰胡";
g = "、";
} else if ("jiangdui" == h.pattern) {
u += "将对";
g = "、";
}
if (h.haidihu) {
u += g + "海底胡";
g = "、";
}
if (h.tianhu) {
u += g + "天胡";
g = "、";
}
if (h.dihu) {
u += g + "地胡";
g = "、";
}
if (v.qingyise) {
u += g + "清一色";
g = "、";
}
if (v.menqing) {
u += g + "门清";
g = "、";
}
if (v.jingouhu) {
u += g + "金钩胡";
g = "、";
}
if (v.zhongzhang) {
u += g + "中张";
g = "、";
}
if (h.numofgen > 0) {
u += g + "根x" + h.numofgen;
g = "、";
}
"" == g && (u += "平胡");
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
for (var m = 0; m < n.mahjongs.childrenCount; ++m) (p = n.mahjongs.children[m]).active = !1;
cc.vv.mahjongmgr.sortMJ(a.holds, a.dingque);
var f = a.angangs.length + a.wangangs.length + a.diangangs.length, _ = 3 * (a.pengs.length + f);
for (m = 0; m < a.holds.length; ++m) {
var p, C = a.holds[m];
(p = n.mahjongs.children[m + _]).active = !0;
p.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", C);
}
for (m = 0; m < n._pengandgang.length; ++m) n._pengandgang[m].active = !1;
var b = 0, y = a.angangs;
for (m = 0; m < y.length; ++m) {
var N = y[m];
this.initPengAndGangs(n, b, N, "angang");
b++;
}
for (y = a.diangangs, m = 0; m < y.length; ++m) {
N = y[m];
this.initPengAndGangs(n, b, N, "diangang");
b++;
}
for (y = a.wangangs, m = 0; m < y.length; ++m) {
N = y[m];
this.initPengAndGangs(n, b, N, "wangang");
b++;
}
var S = a.pengs;
if (S) for (m = 0; m < S.length; ++m) {
N = S[m];
this.initPengAndGangs(n, b, N, "peng");
b++;
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
this._isGameEnd ? this._gameresult.active = !0 : cc.vv.net.send("ready");
this._gameover.active = !1;
},
onBtnShareClicked: function() {
console.log("onBtnShareClicked");
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
var u = 0, g = s.huinfo || [];
for (d = 0; d < g.length; ++d) {
var v = g[d];
r = r || v.ishupai;
if (v.ishupai) {
if (u < h.children.length) {
var m = h.children[u];
m.active = !0;
m.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", v.pai);
u++;
}
"zimo" == v.action ? l.push("自摸") : "hu" == v.action && l.push("接炮胡");
if ("zj_lao" == t) {
if (v.tailog && v.tailog.length) {
for (var f = [], _ = 0; _ < v.tailog.length; ++_) v.tailog[_].indexOf("×2") >= 0 && f.push(v.tailog[_]);
f.length && l.push(f.join("，"));
}
} else if (null != v.fan) {
l.push(v.fan + "台");
v.tailog && v.tailog.length && l.push("(" + v.tailog.join("，") + ")");
}
} else "fangpao" == v.action && l.push("放炮");
}
if ("zj_bt" == t) {
if (s.isBao) {
var p = "";
0 === s.baoModeOfRound ? p = "无财" : 1 === s.baoModeOfRound ? p = "独财" : 2 === s.baoModeOfRound && (p = "双财");
var C = "包家" + p;
s.baoTaiOfRound && (C += "包" + s.baoTaiOfRound + "台");
l.unshift(C);
}
var b = s.huBaseScore || 0, y = s.baoTaiScore || 0;
0 != b && l.push("胡牌分" + (b > 0 ? "+" : "") + b);
0 != y && l.push("包台分" + (y > 0 ? "+" : "") + y);
}
o.hu.active = r;
var N = s.angangs || [], S = s.diangangs || [], M = s.wangangs || [], B = s.pengs || [], w = s.chis || [];
N.length && l.push("暗杠x" + N.length);
S.length && l.push("明杠x" + S.length);
M.length && l.push("补杠x" + M.length);
o.username.string = cc.vv.gameNetMgr.seats[a] ? cc.vv.gameNetMgr.seats[a].name : "";
o.zhuang.active = cc.vv.gameNetMgr.button == a;
var A = cc.vv.gameNetMgr.button == a && cc.vv.gameNetMgr.laozhuang || 0;
this.updateSettleLaoZhuang(o, A);
o.reason.string = l.join("、");
s.score > 0 ? o.score.string = "+" + s.score : o.score.string = "" + s.score;
for (var x = 0; x < o.mahjongs.childrenCount; ++x) o.mahjongs.children[x].active = !1;
var T = (s.holds || []).slice();
"object" == typeof T && null != T.length || (T = []);
cc.vv.mahjongmgr.sortMJ(T);
var I = N.length + M.length + S.length, P = 3 * (B.length + I + w.length);
for (x = 0; x < T.length; ++x) {
var L = T[x], R = o.mahjongs.children[x + P];
if (null == R) break;
R.active = !0;
R.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", L);
}
for (x = 0; x < o._pengandgang.length; ++x) o._pengandgang[x].active = !1;
var O = 0;
for (x = 0; x < N.length; ++x) {
this.initPengAndGangs(o, O, N[x], "angang");
O++;
}
for (x = 0; x < S.length; ++x) {
this.initPengAndGangs(o, O, S[x], "diangang");
O++;
}
for (x = 0; x < M.length; ++x) {
this.initPengAndGangs(o, O, M[x], "wangang");
O++;
}
for (x = 0; x < B.length; ++x) {
var j = s.pengTiles && s.pengTiles[x] || null;
this.initPengAndGangs(o, O, B[x], "peng", j);
O++;
}
for (x = 0; x < w.length; ++x) {
var k = w[x];
if (k && k.length > 0) {
this.initChisGroup(o, O, k);
O++;
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
var g = 0;
o && (g = a.fan);
n.fan.string = g + "番";
a.score > 0 ? n.score.string = "+" + a.score : n.score.string = a.score;
var v = -1;
o && (v = a.holds.pop());
cc.vv.mahjongmgr.sortMJ(a.holds, a.dingque);
o && a.holds.push(v);
for (var m = 0; m < n.mahjongs.childrenCount; ++m) (_ = n.mahjongs.children[m]).active = !1;
var f = 3 * (a.pengs.length + s);
for (m = 0; m < a.holds.length; ++m) {
var _, p = a.holds[m];
(_ = n.mahjongs.children[m + f]).active = !0;
_.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", p);
}
for (m = 0; m < n._pengandgang.length; ++m) n._pengandgang[m].active = !1;
var C = 0, b = a.angangs;
for (m = 0; m < b.length; ++m) {
var y = b[m];
this.initPengAndGangs(n, C, y, "angang");
C++;
}
for (b = a.diangangs, m = 0; m < b.length; ++m) {
y = b[m];
this.initPengAndGangs(n, C, y, "diangang");
C++;
}
for (b = a.wangangs, m = 0; m < b.length; ++m) {
y = b[m];
this.initPengAndGangs(n, C, y, "wangang");
C++;
}
var N = a.pengs;
if (N) for (m = 0; m < N.length; ++m) {
y = N[m];
this.initPengAndGangs(n, C, y, "peng");
C++;
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
var u = "", g = "", v = a;
if (h.ishupai) "hu" == h.action ? u = "接炮胡" : "zimo" == h.action ? u = "自摸" : "ganghua" == h.action ? u = "杠上花" : "dianganghua" == h.action ? u = "点杠花" : "gangpaohu" == h.action ? u = "杠炮胡" : "qiangganghu" == h.action ? u = "抢杠胡" : "chadajiao" == h.action && (u = "查大叫"); else {
u = "fangpao" == h.action ? "放炮" : "gangpao" == h.action ? "杠上炮" : "beiqianggang" == h.action ? "被抢杠" : "被查大叫";
h = (v = e[h.target]).huinfo[h.index];
}
u += "(";
if ("7pairs" == h.pattern) {
u += "七对";
g = "、";
} else if ("l7pairs" == h.pattern) {
u += "龙七对";
g = "、";
} else if ("j7pairs" == h.pattern) {
u += "将七对";
g = "、";
} else if ("duidui" == h.pattern) {
u += "碰碰胡";
g = "、";
} else if ("jiangdui" == h.pattern) {
u += "将对";
g = "、";
}
if (h.haidihu) {
u += g + "海底胡";
g = "、";
}
if (h.tianhu) {
u += g + "天胡";
g = "、";
}
if (h.dihu) {
u += g + "地胡";
g = "、";
}
if (v.qingyise) {
u += g + "清一色";
g = "、";
}
if (v.menqing) {
u += g + "门清";
g = "、";
}
if (v.jingouhu) {
u += g + "金钩胡";
g = "、";
}
if (v.zhongzhang) {
u += g + "中张";
g = "、";
}
if (h.numofgen > 0) {
u += g + "根x" + h.numofgen;
g = "、";
}
"" == g && (u += "平胡");
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
for (var m = 0; m < n.mahjongs.childrenCount; ++m) (p = n.mahjongs.children[m]).active = !1;
cc.vv.mahjongmgr.sortMJ(a.holds, a.dingque);
var f = a.angangs.length + a.wangangs.length + a.diangangs.length, _ = 3 * (a.pengs.length + f);
for (m = 0; m < a.holds.length; ++m) {
var p, C = a.holds[m];
(p = n.mahjongs.children[m + _]).active = !0;
p.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", C);
}
for (m = 0; m < n._pengandgang.length; ++m) n._pengandgang[m].active = !1;
var b = 0, y = a.angangs;
for (m = 0; m < y.length; ++m) {
var N = y[m];
this.initPengAndGangs(n, b, N, "angang");
b++;
}
for (y = a.diangangs, m = 0; m < y.length; ++m) {
N = y[m];
this.initPengAndGangs(n, b, N, "diangang");
b++;
}
for (y = a.wangangs, m = 0; m < y.length; ++m) {
N = y[m];
this.initPengAndGangs(n, b, N, "wangang");
b++;
}
var S = a.pengs;
if (S) for (m = 0; m < S.length; ++m) {
N = S[m];
this.initPengAndGangs(n, b, N, "peng");
b++;
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
GameResultZP: [ function(e, t) {
"use strict";
cc._RF.push(t, "e7d3b7cEttCGaQ6+TuP+x4X", "GameResultZP");
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
i && cc.vv.utils.addClickEvent(i, this.node, "GameResultZP", "onBtnCloseClicked");
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
var h = 220, d = cc.vv.gameNetMgr.seatIndex;
for (r = 0; r < s.length; ++r) {
var u = s[r];
if (u) {
var g = "number" == typeof u.score ? u.score : 0, v = (g > 0 && g == c ? "【大赢家】" : "") + (r === d ? "[自家] " : "[对家] ") + (u.name || "玩家") + "(" + u.userid + ")";
if (e && null != e[r]) {
var m = e[r];
v += "   自摸" + this.signedNum(m.numzimo) + "  接炮" + this.signedNum(m.numjiepao) + "  点炮" + this.signedNum(m.numdianpao) + "  暗杠" + this.signedNum(m.numangang) + "  明杠" + this.signedNum(m.numminggang) + "  查叫" + this.signedNum(m.numchadajiao);
}
v += "   总成绩:" + this.signedNum(g);
h -= this.addListRow(l, v, 28, h, g > 0 ? cc.color(40, 120, 40) : g < 0 ? cc.color(170, 40, 40) : cc.color(90, 90, 90));
}
}
if (t && t.length > 0) for (var f = d >= 0 && s[d] ? s[d].userid : -1, _ = 0; _ < t.length; ++_) {
for (var p = t[_], C = 0, b = 0, y = "", N = 0, S = !1, M = 0; M < p.scores.length; ++M) {
var B = p.scores[M];
B.userid == f ? C = B.score : b = B.score;
if (null != B.tai) {
y = B.userid == f ? "自家" : "对家";
N = B.tai;
S = !!B.zimo;
}
}
var w = "第" + p.index + "局   自家" + this.signedNum(C) + "  对家" + this.signedNum(b);
"" != y && (w += "   " + y + "胡" + N + "台" + (S ? "(自摸)" : ""));
h -= this.addListRow(l, w, 22, h, C > 0 ? cc.color(34, 120, 34) : C < 0 ? cc.color(180, 40, 40) : cc.color(120, 120, 120));
}
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
if (cc.vv.fromClubId) {
cc.vv.fromClub = !0;
cc.director.loadScene("club");
} else cc.director.loadScene("hall");
},
onBtnShareClicked: function() {
cc.vv.anysdkMgr.shareResult();
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
var g = "number" == typeof u.score ? u.score : 0, v = (g > 0 && g == c ? "【大赢家】" : "") + (r === d ? "[自家] " : "[对家] ") + (u.name || "玩家") + "(" + u.userid + ")";
if (e && null != e[r]) {
var m = e[r];
v += "   自摸" + this.signedNum(m.numzimo) + "  接炮" + this.signedNum(m.numjiepao) + "  点炮" + this.signedNum(m.numdianpao) + "  暗杠" + this.signedNum(m.numangang) + "  明杠" + this.signedNum(m.numminggang) + "  查叫" + this.signedNum(m.numchadajiao);
}
v += "   总成绩:" + this.signedNum(g);
h.push({
text: v,
fontSize: 28,
color: g > 0 ? cc.color(40, 120, 40) : g < 0 ? cc.color(170, 40, 40) : cc.color(90, 90, 90)
});
}
}
if (t && t.length > 0) for (var f = d >= 0 && s[d] ? s[d].userid : -1, _ = 0; _ < t.length; ++_) {
for (var p = t[_], C = 0, b = 0, y = "", N = 0, S = !1, M = !1, B = 0; B < p.scores.length; ++B) {
var w = p.scores[B];
w.userid == f ? C = w.score : b = w.score;
if (null != w.tai) {
y = w.userid == f ? "自家" : "对家";
N = w.tai;
S = !!w.zimo;
M = !!w.laozhuang;
}
}
var A = "第" + p.index + "局   自家" + this.signedNum(C) + "  对家" + this.signedNum(b);
"" != y && (A += "   " + y + "胡" + N + "台" + (S ? "(自摸)" : "") + (M ? "(老庄)" : ""));
h.push({
text: A,
fontSize: 22,
color: C > 0 ? cc.color(34, 120, 34) : C < 0 ? cc.color(180, 40, 40) : cc.color(120, 120, 120)
});
}
var x = 0;
for (r = 0; r < h.length; ++r) x += h[r].fontSize + 14;
var T = x / 2;
for (r = 0; r < h.length; ++r) T -= this.addListRow(l, h[r].text, h[r].fontSize, T, h[r].color);
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
baobao_shou: "6张手动摆宝宝(最多6人)。每人发6张牌,自己摆成前2/中2/后2三道。\n· 单道规则:对子为宝,宝>散点(两牌相加取个位,9最大0最小);宝排序 宝A>宝K/Q/J>宝10~2。\n· 强制 前道≤中道≤后道,摆错为乌龙,三道全输。\n· 三道独立结算,每道按赢家道型倍率:宝A=10倍,宝K/Q/J=6倍,宝10~2=5倍,9点=4倍,8点=3倍,7点=2倍,6~0点=1倍。",
baobao: "宝宝(6张玩法,最多6人同桌),分免摆与手摆两种:\n每人发6张牌。免摆由系统自动选出最大牌型亮牌,整手比大小;手摆由自己摆成前2/中2/后2三道,逐道比大小。\n· 牌型从大到小:6同花顺 > 5同花顺带1 > 4条带2单 > 3条带3条 > 3条带对带1 > 6同花 > 6连顺 > 5同花带1 > 5连顺带1 > 3对 > 3组9 > 散牌。\n· 花色优先级:黑桃 > 红桃 > 梅花 > 方片。A在长顺里算最小(A23456的A当1)。\n· 手摆单道:对子为宝,宝>散点(两牌相加取个位,9最大0最小);宝排序 宝A>宝K/Q/J>宝10~2。\n· 手摆强制 前道≤中道≤后道,摆错为乌龙,三道全输。\n· 手摆三道独立结算,每道按赢家道型倍率:宝A=10倍,宝K/Q/J=6倍,宝10~2=5倍,9点=4倍,8点=3倍,7点=2倍,6~0点=1倍。"
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
this._games = [ {
type: "baobao",
name: "宝宝"
} ];
this.renderList();
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
t._rp ? t.closeReplay() : t._root.active = !1;
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
var t = String(e || "");
return 0 === t.indexOf("baobao_mian") ? "六宝免摆" : 0 === t.indexOf("baobao_shou") ? "六宝手动" : 0 === t.indexOf("baobao") ? "六宝" : i[e] || e || "对局";
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
this._flat = [];
for (var e = this._rooms || [], t = 0, i = 0; i < e.length; ++i) for (var n = e[i], a = n.games || [], o = 0; o < a.length; ++o) {
var s = a[o];
this._flat.push({
room: n,
game: s
});
var c = this.getItem(t);
this.setItemText(c, this.typeName(n.type), "房间:" + n.roomid, this.dateFormat(s.create_time), [ "第" + s.index + "局", "", "", "" ], "详情", t);
t++;
}
this._emptyTip.active = 0 == t;
this._curRoom = null;
},
onItemClicked: function(e) {
var t = this._flat && this._flat[e];
null != t && (0 === String(t.room.type || "").indexOf("baobao") ? this.openBbReplay(t.room.uuid, t.game.index) : this.playReplay(t.room, t.game.index));
},
openBbReplay: function(e, t) {
var i = this;
if (e && t) {
if (!this._bbLoading) {
this._bbLoading = !0;
cc.vv.http.sendRequest("/get_replay", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
uuid: e,
index: t
}, function(e) {
i._bbLoading = !1;
if (null != e && 0 == e.errcode) {
var t = e.replay;
if (t && t.events && t.events.length) {
cc.vv.bbReplayData = t;
var n = String(t.type || "");
cc.director.loadScene(cc.vv.gameNetMgr.sceneForType(n));
} else cc.vv.wc.showError("该局没有录像，无法回放");
} else {
var a = e && 1 === e.errcode ? "该局录像已过期" : e && 2 === e.errcode ? "没有该局回放权限" : e && e.errmsg || "获取回放失败";
cc.vv.wc.showError(a);
}
});
}
} else cc.vv.wc.showError("该局没有录像，无法回放");
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
var g = u.addComponent(cc.Label);
g.string = "";
g.fontSize = 26;
g.lineHeight = 32;
u.color = cc.color(255, 226, 120);
r.resultLabel = g;
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
var g = this.handPos(e, i, t);
u.setPosition(g.x, g.y);
e.handNodes.push(u);
var v = new cc.Node("fold");
v.parent = e.root;
var m = this.foldPos(e, i, t);
v.setPosition(m.x, m.y);
e.foldNodes.push(v);
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
var g = a(e.winner);
if (null != g && !i.zimo && e.lastDiscard && e.lastDiscard.pai == i.pai) {
this.takeDiscard(e, i.pai);
e.hands[g] && e.hands[g].push(i.pai);
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
for (var u = 0, g = 0; g < o.length; ++g) u += null == o[g] ? 22 : 52;
for (var v = -u / 2 + 25, m = 0; m < o.length; ++m) if (null != o[m]) {
this.makeTile(n, o[m], 50, 68).setPosition(v, 0);
v += 52;
} else v += 22;
var f = e.foldNodes[t];
f.removeAllChildren();
for (var _ = e.folds[i] || [], p = 0; p < _.length; ++p) {
var C = Math.floor(p / 8), b = p % 8;
this.makeTile(f, _[p], 36, 48).setPosition(40 * b - 140, 52 * -C);
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
var M = "";
if (e.hu && e.hu.si >= 0) {
var B = e.players[e.hu.si];
M = (B ? B.name || "玩家" + B.userid : "") + (e.hu.zimo ? " 自摸" : " 胡牌") + " " + e.hu.tai + "台";
}
e.resultLabel.string = M;
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
HuanSanZhang: [ function(e, t) {
"use strict";
cc._RF.push(t, "361a9leeXxIEpx5zDk7amE+", "HuanSanZhang");
cc.Class({
extends: cc.Component,
properties: {
_huanpaitip: null,
_huanpaiArr: []
},
onLoad: function() {
this._huanpaitip = cc.find("Canvas/huansanzhang");
this._huanpaitip.active = cc.vv.gameNetMgr.isHuanSanZhang;
this._huanpaitip.active && this.showHuanpai(null == cc.vv.gameNetMgr.getSelfData().huanpais);
this.initHuaipaiInfo();
var e = cc.find("Canvas/huansanzhang/btn_ok");
e && cc.vv.utils.addClickEvent(e, this.node, "HuanSanZhang", "onHuanSanZhang");
var t = this;
this.node.on("game_huanpai", function() {
t._huanpaitip.active = !0;
t.showHuanpai(!0);
});
this.node.on("huanpai_notify", function(e) {
e.detail.seatindex == cc.vv.gameNetMgr.seatIndex && t.initHuaipaiInfo();
});
this.node.on("game_huanpai_over", function() {
t._huanpaitip.active = !1;
for (var e = 0; e < t._huanpaiArr.length; ++e) t._huanpaiArr[e].y = 0;
t._huanpaiArr = [];
t.initHuaipaiInfo();
});
this.node.on("game_huanpai_result", function() {
cc.vv.gameNetMgr.isHuanSanZhang = !1;
t._huanpaitip.active = !1;
for (var e = 0; e < t._huanpaiArr.length; ++e) t._huanpaiArr[e].y = 0;
t._huanpaiArr = [];
});
this.node.on("mj_clicked", function(e) {
var i = e.detail, n = t._huanpaiArr.indexOf(i);
if (-1 != n) {
i.y = 0;
t._huanpaiArr.splice(n, 1);
} else if (t._huanpaiArr.length < 3) {
t._huanpaiArr.push(i);
i.y = 15;
}
});
},
showHuanpai: function(e) {
this._huanpaitip.getChildByName("info").getComponent(cc.Label).string = "请选择三张一样花色的牌";
this._huanpaitip.getChildByName("btn_ok").getComponent(cc.Button).interactable = e;
this._huanpaitip.getChildByName("mask").active = !1;
},
initHuaipaiInfo: function() {
var e = cc.find("Canvas/game/huanpaiinfo"), t = cc.vv.gameNetMgr.getSelfData();
if (t && null != t.huanpais) {
e.active = !0;
for (var i = 0; i < t.huanpais.length; ++i) e.getChildByName("hp" + (i + 1)).getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t.huanpais[i]);
var n = e.getChildByName("hpm");
n.active = !0;
0 == cc.vv.gameNetMgr.huanpaimethod ? n.angle = -90 : 1 == cc.vv.gameNetMgr.huanpaimethod ? n.angle = 0 : 2 == cc.vv.gameNetMgr.huanpaimethod ? n.angle = -180 : n.active = !1;
} else e.active = !1;
},
onHuanSanZhang: function() {
if (3 == this._huanpaiArr.length) {
for (var e = null, t = 0; t < this._huanpaiArr.length; ++t) {
var i = this._huanpaiArr[t].mjId, n = cc.vv.mahjongmgr.getMahjongType(i);
if (null == e) e = n; else if (e != n) return;
}
var a = {
p1: this._huanpaiArr[0].mjId,
p2: this._huanpaiArr[1].mjId,
p3: this._huanpaiArr[2].mjId
};
this._huanpaitip.getChildByName("info").getComponent(cc.Label).string = "等待其他玩家选牌...";
this._huanpaitip.getChildByName("btn_ok").getComponent(cc.Button).interactable = !1;
this._huanpaitip.getChildByName("mask").active = !0;
cc.vv.net.send("huanpai", a);
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
if (4 == t.errcode) i = "房间[" + e + "]已满!"; else {
if (2222 == t.errcode) {
cc.vv.wc.showAlert(t.errmsg || "宝宝豆不足，无法进入房间");
this.onResetClicked();
return;
}
if (3333 == t.errcode) {
cc.vv.wc.showAlert(t.errmsg || "该房间属于其他俱乐部，无法进入");
this.onResetClicked();
return;
}
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
if (!cc.vv.audioMgr) {
cc.vv.audioMgr = new s();
cc.vv.audioMgr.init();
}
if (!cc.Node.prototype._bbBtnSoundHooked) {
cc.Node.prototype._bbBtnSoundHooked = !0;
var c = cc.Node.prototype.emit;
cc.Node.prototype.emit = function(e) {
if ("touch-end" === e && cc.vv && cc.vv.audioMgr) {
var t = this.getComponent ? this.getComponent(cc.Button) : null;
(t && !1 !== t.interactable || /^btn/i.test(this.name) || /button/i.test(this.name)) && cc.vv.audioMgr.playSFX("btnClick.wav");
}
return c.apply(this, arguments);
};
}
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
var g = u ? u.getChildByName("New Layout") : null;
if (g) {
var v = g.getComponent(cc.Button);
v && (v.enabled = !1);
g.active = !1;
}
this._baoPanel = u ? u.getChildByName("baoPanel") : null;
if (this._baoPanel) {
this._baoPanel.active = !1;
this._baoMode = 2;
this._baoTai = 2;
for (var m = [ {
name: "btnNoCai",
mode: 0
}, {
name: "btnDuCai",
mode: 1
}, {
name: "btnShuangCai",
mode: 2
} ], f = 0; f < m.length; ++f) this._bindBaoButton(this._baoPanel.getChildByName(m[f].name), m[f].mode, "onBaoModeClicked");
for (var _ = 2; _ <= 7; ++_) this._bindBaoButton(this._baoPanel.getChildByName("btnTai" + _), _, "onBaoTaiClicked");
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
cc.vv.mahjongmgr.playRandSFX(e.zimo ? "zimo" : "hu", e.zimo ? 2 : 3);
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
cc.vv.mahjongmgr.playRandSFX("peng", 5);
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
cc.vv.mahjongmgr.playRandSFX("chi", 4);
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
}, g = null != o && o >= 0;
if (g) {
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
var v = d.getComponent(cc.Label);
v && (v.string = "独");
d.active = !0;
}
}
var m = this, f = g && l ? l.getComponent(cc.Sprite) : null, _ = h ? h.getComponent(cc.Sprite) : null;
if (null != f && null == f.spriteFrame || null != _ && null == _.spriteFrame) {
cc.vv.mahjongmgr && cc.vv.mahjongmgr.bottomAtlas || console.warn("[caishenTip] bottomAtlas 未就绪, 等待重试");
null == this._csRetryCount && (this._csRetryCount = 0);
if (!this._csRetryScheduled && this._csRetryCount < 600) {
this._csRetryScheduled = !0;
var p = a;
this.scheduleOnce(function() {
m._csRetryScheduled = !1;
if (cc.isValid(m.node) && (null == m._caishen || m._caishen === p)) {
m._csRetryCount++;
m.initCaishenTip();
var e = !f || null != f.spriteFrame, t = !_ || null != _.spriteFrame;
e && t && (m._csRetryCount = 0);
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
var C = d.getComponent(cc.Label);
C && (C.string = "无财");
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
var i = this._playEfxs[e];
i.node.active = !0;
i.play(t);
("play_hu" == t || "play_zimo" == t) && cc.vv && cc.vv.mahjongmgr && cc.vv.mahjongmgr.playHuSpine(i.node, "play_zimo" == t);
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
var g = u.getChildByName("holds");
for (i = 0; i < g.childrenCount; ++i) g.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var v = cc.vv.gameNetMgr.seats;
for (var t in v) {
n = v[t];
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
var u = cc.vv.mahjongmgr.getSide(d), g = r ? r.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var m = [], f = 0; f < v.childrenCount; ++f) {
var _ = v.children[f];
_.active && m.push(_);
}
n(m, v, "up" == u ? function(e, t) {
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
var p = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == p) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
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
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (r = c; r < c + g; ++r) {
l = this.getMJIndex(i, r);
var v = o.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, c + g);
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
for (var g = 0; g < l.length; ++g) i.push(l[g]);
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
var g = n[u];
if (null == (m = this._myMJArr[u + s]) || null == m.node) {
d.push("SLOT_" + (u + s) + "=NULL");
break;
}
m.node.mjId = g;
m.node.y = 0;
var v = r && u == n.length - 1;
c > 0 && (m.node.x = h + u * c + (v ? a : 0));
this.setSpriteFrameByMJID("M_", m, g);
d.push("SLOT_" + (u + s) + "=" + g);
}
console.log("[initMahjongs] render:", d.join("|"));
for (u = 0; u < s; ++u) if (null != (m = this._myMJArr[u]) && null != m.node) {
m.node.mjId = null;
m.spriteFrame = null;
m.node.active = !1;
}
for (u = s + n.length; u < this._myMJArr.length; ++u) {
var m;
if (null != (m = this._myMJArr[u]) && null != m.node) {
m.node.mjId = null;
m.spriteFrame = null;
m.node.active = !1;
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
var g = u.addComponent(cc.Sprite);
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", l[d]);
g.sizeMode = cc.Sprite.SizeMode.CUSTOM;
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
MJGameLDH: [ function(e, t) {
"use strict";
cc._RF.push(t, "85c5aNOTWNCFrgpYPdauSJ3", "MJGameLDH");
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
} else cc.director.loadScene("loading");
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
var g = u ? u.getChildByName("New Layout") : null;
if (g) {
var v = g.getComponent(cc.Button);
v && (v.enabled = !1);
g.active = !1;
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
var o = this;
this.node.on("game_start", function(e) {
try {
o.onGameBeign(!0, e && e.detail);
} catch (e) {
console.error("[LDH] onGameBeign error:", e);
}
o.initCaishenTip();
});
this.node.on("game_begin", function() {
o.onGameBeign();
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
o.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && o.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || o.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? o.initMahjongs(!0) : cc.vv.replayMgr.isReplay() && o.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = o._hupaiTips[i];
n.active = !0;
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
o.initMopai(t, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.mahjongmgr.playRandSFX(e.zimo ? "zimo" : "hu", e.zimo ? 2 : 3);
});
this.node.on("mj_count", function() {
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
o.gameRoot.active = !1;
o.prepareRoot.active = !0;
o.hideChiPanel();
});
this.node.on("game_chupai_notify", function(e) {
o.hideChupai();
o.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? o.initMahjongs() : o.initOtherMahjongs(i);
o.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
o.playEfx(n, "play_peng");
cc.vv.mahjongmgr.playRandSFX("peng", 5);
o.hideOptions();
});
this.node.on("gang_notify", function(e) {
o.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
if ("wangang" == i) {
o.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
o.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
o.hideOptions();
});
this.node.on("chi_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var i = o.getLocalIndex(t.seatindex);
o.playEfx(i, "play_peng");
cc.vv.mahjongmgr.playRandSFX("chi", 4);
o.hideOptions();
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
cc.vv.utils.addClickEvent(t, this.node, "MJGameLDH", "onOptionClicked");
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
cc.vv.utils.addClickEvent(t, this.node, "MJGameLDH", "onOptionClicked");
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
this._options.active = !1;
for (var e = 0; e < this._options.childrenCount; ++e) {
var t = this._options.children[e];
if ("op" == t.name) {
t.active = !1;
t.getChildByName("btnPeng").active = !1;
t.getChildByName("btnGang").active = !1;
t.getChildByName("btnHu").active = !1;
var i = t.getChildByName("btnChi");
i && (i.active = !1);
}
}
this.hideChiPanel();
this.cancelChiSelect();
}
},
showAction: function(e) {
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
},
initWanfaLabel: function() {
for (var e = [ "Canvas/infobar/wanfa", "Canvas/infobar/New Sprite/wanfa", "Canvas/infobar/infobar/wanfa" ], t = null, i = 0; i < e.length && !(t = cc.find(e[i])); ++i) ;
if (t) {
var n = t.getComponent(cc.Label);
n ? n.string = cc.vv.gameNetMgr.getWanfa() : console.warn("[initWanfaLabel] wanfa node has no cc.Label component");
} else {
console.warn("[initWanfaLabel] wanfa node NOT FOUND, tried:", e.join(" | "));
var a = cc.director.getScene();
a && function e(t, i) {
if (t) {
"wanfa" === t.name && console.warn("[initWanfaLabel] found wanfa at depth", i, "name=", t.name, "parent=", t.parent && t.parent.name);
for (var n = 0; n < t.children && n < 100; ++n) e(t.children[n], i + 1);
}
}(a, 0);
}
},
initCaishenTip: function() {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("caishenTip");
if (null != t) {
var i = cc.vv.gameNetMgr.conf, n = null != i && null != i.caishen && i.caishen >= 0;
t.active = n;
if (n) {
t.setSiblingIndex(t.parent.childrenCount - 1);
var a = function(e, t) {
var i = e.getComponent(cc.Sprite);
if (i) {
i.enabled = !0;
i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
}
}, o = t.getChildByName("cs1");
if (o) {
o.active = !0;
a(o, i.caishen);
}
var s = t.getChildByName("cs2");
if (s) {
var c = null != i.caishen2 && i.caishen2 >= 0;
s.active = c;
c && a(s, i.caishen2);
}
}
}
}
},
playEfx: function(e, t) {
var i = this._playEfxs[e];
i.node.active = !0;
i.play(t);
("play_hu" == t || "play_zimo" == t) && cc.vv && cc.vv.mahjongmgr && cc.vv.mahjongmgr.playHuSpine(i.node, "play_zimo" == t);
},
onGameBeign: function(e) {
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
var s = this.node.getChildByName("game"), c = s.getChildByName("huanpaiinfo");
null != c && (c.active = !1);
var r = [ "right", "up", "left" ];
for (t = 0; t < r.length; ++t) {
var l = s.getChildByName(r[t]);
if (null != l) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) l.active = !1; else {
l.active = !0;
var h = l.getChildByName("holds");
for (i = 0; i < h.childrenCount; ++i) h.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var d = cc.vv.gameNetMgr.seats;
for (var t in d) {
n = d[t];
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
var u = cc.vv.mahjongmgr.getSide(d), g = r ? r.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var m = [], f = 0; f < v.childrenCount; ++f) {
var _ = v.children[f];
_.active && m.push(_);
}
n(m, v, "up" == u ? function(e, t) {
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
var p = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == p) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
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
if (this._chiSelect) {
var t = this._findMJNode(e);
if (null == t || null == t.mjId) return;
for (var i = 0; i < this._myMJArr.length; ++i) if (t == this._myMJArr[i].node) {
var n = this._chiSelect.tiles, a = n.indexOf(t);
if (-1 != a) {
n.splice(a, 1);
t.y = 0;
return;
}
if (n.length >= 2) return;
n.push(t);
t.y = 15;
if (2 == n.length) {
var o = n[0].mjId, s = n[1].mjId, c = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ o, s, c ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var r = this._findMJNode(e);
if (null != r) for (var l = 0; l < this._myMJArr.length; ++l) if (r == this._myMJArr[l].node) {
if (r == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
r.y = 15;
this._selectedMJ = r;
return;
}
} else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && cc.vv.net.send("chupai", e);
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
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (r = c; r < c + g; ++r) {
l = this.getMJIndex(i, r);
var v = o.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, c + g);
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
for (var g = 0; g < l.length; ++g) i.push(l[g]);
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
var g = n[u];
if (null == (m = this._myMJArr[u + s]) || null == m.node) {
d.push("SLOT_" + (u + s) + "=NULL");
break;
}
m.node.mjId = g;
m.node.y = 0;
var v = r && u == n.length - 1;
c > 0 && (m.node.x = h + u * c + (v ? a : 0));
this.setSpriteFrameByMJID("M_", m, g);
d.push("SLOT_" + (u + s) + "=" + g);
}
console.log("[initMahjongs] render:", d.join("|"));
for (u = 0; u < s; ++u) if (null != (m = this._myMJArr[u]) && null != m.node) {
m.node.mjId = null;
m.spriteFrame = null;
m.node.active = !1;
}
for (u = s + n.length; u < this._myMJArr.length; ++u) {
var m;
if (null != (m = this._myMJArr[u]) && null != m.node) {
m.node.mjId = null;
m.spriteFrame = null;
m.node.active = !1;
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
cc.vv.utils.addClickEvent(h, this.node, "MJGameLDH", "onChiItemClicked");
for (var d = 0; d < l.length; ++d) {
var u = new cc.Node("p" + d);
u.setContentSize(46, 66);
u.setPosition(50 * d - 50, 0);
h.addChild(u);
var g = u.addComponent(cc.Sprite);
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", l[d]);
g.sizeMode = cc.Sprite.SizeMode.CUSTOM;
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
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {} ],
MJGameWujin: [ function(e, t) {
"use strict";
cc._RF.push(t, "869fe/PjcBKHYmvzxX98Wdg", "MJGameWujin");
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
_huaAreas: [],
_youjinLabels: [],
_youjinPanel: null,
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
for (var n = [ "NoticeTip", "GameOverZP", "PengGangs", "MJRoom", "TimePointer", "GameResultZP", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
this.initView();
this.initEventHandlers();
this.gameRoot.active = !1;
this.prepareRoot.active = !0;
this.initWanfaLabel();
this.onGameBeign();
this.initCaishenTip();
cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("loading");
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
var g = u ? u.getChildByName("New Layout") : null;
if (g) {
var v = g.getComponent(cc.Button);
v && (v.enabled = !1);
g.active = !1;
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
var o = this;
this.node.on("game_start", function(e) {
o.onGameBeign(!0, e && e.detail);
o.initCaishenTip();
});
this.node.on("game_begin", function() {
o.onGameBeign();
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
o.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && o.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || o.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? o.initMahjongs(!0) : cc.vv.replayMgr.isReplay() && o.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = o._hupaiTips[i];
n.active = !0;
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
o.initMopai(t, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.mahjongmgr.playRandSFX(e.zimo ? "zimo" : "hu", e.zimo ? 2 : 3);
});
this.node.on("mj_count", function() {
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
o.gameRoot.active = !1;
o.prepareRoot.active = !0;
o.hideChiPanel();
o.hideYoujinPanel();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
o.initHuaArea(t.si);
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
}
});
this.node.on("game_youjin", function(e) {
var t = e.detail;
t && o.showYoujinLevel(t.si, t.level);
});
this.node.on("game_fenbing", function(e) {
var t = e.detail;
if (t) {
var i = cc.vv.gameNetMgr.seats[t.si], n = i ? i.name : "" + t.si;
cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(n + " 分饼 " + t.score + " 分");
}
});
this.node.on("game_chupai_notify", function(e) {
o.hideChupai();
o.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? o.initMahjongs() : o.initOtherMahjongs(i);
o.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
o.playEfx(n, "play_peng");
cc.vv.mahjongmgr.playRandSFX("peng", 5);
o.hideOptions();
});
this.node.on("gang_notify", function(e) {
o.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
if ("wangang" == i) {
o.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
o.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
o.hideOptions();
});
this.node.on("chi_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var i = o.getLocalIndex(t.seatindex);
o.playEfx(i, "play_peng");
cc.vv.mahjongmgr.playRandSFX("chi", 4);
o.hideOptions();
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
cc.vv.utils.addClickEvent(t, this.node, "MJGameWujin", "onOptionClicked");
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
cc.vv.utils.addClickEvent(t, this.node, "MJGameWujin", "onOptionClicked");
t.active = !1;
return t;
},
getZpOpButton: function(e, t, i, n) {
var a = e.getChildByName(t);
if (a) {
if (!a._zpBound) {
a._zpBound = !0;
cc.vv.utils.addClickEvent(a, this.node, "MJGameWujin", "onOptionClicked");
}
return a;
}
var o = e.getChildByName("btnPeng");
a = new cc.Node(t);
e.addChild(a);
if (o) {
a.setPosition(o.getPosition());
a.setContentSize(o.getContentSize());
a.scaleX = o.scaleX;
a.scaleY = o.scaleY;
}
var s = a.addComponent(cc.Sprite);
s.type = cc.Sprite.Type.SIMPLE;
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(a)) {
var i = a.getComponent(cc.Sprite);
i && (i.spriteFrame = t);
}
});
a.addComponent(cc.Button);
var c = new cc.Node("btnLabel");
a.addChild(c);
var r = c.addComponent(cc.Label);
r.string = i;
r.fontSize = n || 40;
r.lineHeight = r.fontSize;
r.overflow = cc.Label.Overflow.NONE;
r.enableWrapText = !1;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 255, 255);
c.setPosition(0, 0);
cc.vv.utils.addClickEvent(a, this.node, "MJGameWujin", "onOptionClicked");
a.active = !1;
return a;
},
addZpOption: function(e, t, i, n) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var o = this._options.children[a];
if ("op" == o.name && 0 == o.active) {
o.active = !0;
o.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = null != i && i >= 0 ? cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", i) : null;
var s = this.getZpOpButton(o, e, t, n);
s.active = !0;
s.pai = i;
return;
}
}
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
this._options.active = !1;
for (var e = 0; e < this._options.childrenCount; ++e) {
var t = this._options.children[e];
if ("op" == t.name) {
t.active = !1;
t.getChildByName("btnPeng").active = !1;
t.getChildByName("btnGang").active = !1;
t.getChildByName("btnHu").active = !1;
var i = t.getChildByName("btnChi");
i && (i.active = !1);
var n = t.getChildByName("btnQiangJin");
n && (n.active = !1);
var a = t.getChildByName("btnYouJin");
a && (a.active = !1);
var o = t.getChildByName("btnYouJinGo");
o && (o.active = !1);
}
}
this.hideChiPanel();
this.cancelChiSelect();
this.hideYoujinPanel();
}
},
showAction: function(e) {
this._options.active && this.hideOptions();
var t = !!(e && e.youjin && e.youjin.length > 0);
if (e && (e.hu || e.gang || e.peng || e.chi || e.qiangjin || t || e.youjingo)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) for (var i = 0; i < e.gangpai.length; ++i) {
var n = e.gangpai[i];
this.addOption("btnGang", n);
}
e.chi && this.addChiOption(e.pai);
e.qiangjin && this.addZpOption("btnQiangJin", "抢金", e.pai, 32);
t && this.addZpOption("btnYouJin", "游金", e.pai);
e.youjingo && this.addZpOption("btnYouJinGo", "继续游金", e.pai, 28);
var a = this._options.getChildByName("btnGuo");
a && (a.active = !0);
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
var i = cc.vv.gameNetMgr.conf, n = null != i && null != i.caishen && i.caishen >= 0;
t.active = n;
if (n) {
var a = function(e, t) {
var i = e.getComponent(cc.Sprite);
i && (i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t));
}, o = t.getChildByName("cs1");
if (o) {
o.active = !0;
a(o, i.caishen);
}
var s = t.getChildByName("cs2");
if (s) {
var c = null != i.caishen2 && i.caishen2 >= 0;
s.active = c;
c && a(s, i.caishen2);
}
}
}
}
},
_huaAreaPos: function(e) {
return "myself" == e ? cc.v2(-540, -230) : "up" == e ? cc.v2(430, 210) : "right" == e ? cc.v2(540, 40) : cc.v2(-540, 40);
},
getHuaArea: function(e) {
var t = cc.vv.gameNetMgr.getLocalIndex(e);
if (this._huaAreas[t] && cc.isValid(this._huaAreas[t])) return this._huaAreas[t];
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game") || this.node, a = new cc.Node("huaArea_" + i), o = this._huaAreaPos(i);
a.setPosition(o.x, o.y);
n.addChild(a);
this._huaAreas[t] = a;
return a;
},
initHuaArea: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[e] : null;
if (null != t) {
var i = this.getHuaArea(e);
i.removeAllChildren();
var n = t.hua || [];
if (0 != n.length) for (var a = cc.vv.mahjongmgr.bottomAtlas, o = 0; o < n.length; ++o) {
var s = n[o], c = new cc.Node("hua" + o);
c.setContentSize(44, 64);
c.setPosition(48 * o + 22, 0);
i.addChild(c);
var r = c.addComponent(cc.Sprite);
r.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var l = s - 34, h = l >= 0 && l < 8 ? "M_" + [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][l] : null, d = h ? a.getSpriteFrame(h) : null;
if (null != d) r.spriteFrame = d; else {
var u = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
r.spriteFrame = u;
var g = new cc.Node("name");
c.addChild(g);
var v = g.addComponent(cc.Label);
v.string = l >= 0 && l < 8 ? [ "梅", "兰", "竹", "菊", "春", "夏", "秋", "冬" ][l] : "花";
v.fontSize = 26;
v.lineHeight = 28;
v.overflow = cc.Label.Overflow.NONE;
v.enableWrapText = !1;
v.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.verticalAlign = cc.Label.VerticalAlign.CENTER;
g.color = cc.color(220, 40, 40);
g.setPosition(0, 0);
}
}
}
},
initAllHuaAreas: function() {
var e = cc.vv.gameNetMgr.seats;
if (e) for (var t = 0; t < e.length; ++t) {
this.initHuaArea(t);
this.showYoujinLevel(t, e[t].youjinLevel || 0);
}
},
showYoujinLevel: function(e, t) {
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = this._youjinLabels[i];
if (!n || !cc.isValid(n)) {
var a = cc.vv.mahjongmgr.getSide(i), o = this.getHuaArea(e);
n = new cc.Node("youjin_" + a);
o.parent.addChild(n);
var s = n.addComponent(cc.Label);
s.fontSize = 30;
s.lineHeight = 34;
s.overflow = cc.Label.Overflow.NONE;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
n.color = cc.color(255, 90, 90);
var c = n.addComponent(cc.LabelOutline);
c.color = cc.color(80, 0, 0);
c.width = 2;
this._youjinLabels[i] = n;
}
var r = this.getHuaArea(e);
n.setPosition(r.x, r.y + 80);
if (t > 0) {
n.active = !0;
n.getComponent(cc.Label).string = [ "", "单游", "双游", "三游" ][t] || t + "游";
} else n.active = !1;
},
showYoujinPanel: function(e) {
this.hideYoujinPanel();
if (e && 0 != e.length) {
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 40 + 62 * e.length + 16 * (e.length - 1), n = new cc.Node("youjinPanel");
n.setContentSize(i, 146);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 146);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -73, i, 146);
o.fill();
o.stroke();
var s = new cc.Node("cap");
s.setContentSize(i, 28);
s.setPosition(0, 49);
n.addChild(s);
var c = s.addComponent(cc.Label);
c.string = "选择一张牌宣告游金";
c.fontSize = 22;
c.lineHeight = 28;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = cc.color(255, 225, 150);
for (var r = 0; r < e.length; ++r) {
var l = new cc.Node("yjItem" + r);
l.setContentSize(62, 90);
l.setPosition(51 + -i / 2 + 78 * r, -14);
n.addChild(l);
l.addComponent(cc.Button);
l.pai = e[r];
cc.vv.utils.addClickEvent(l, this.node, "MJGameWujin", "onYoujinItemClicked");
var h = l.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[r]);
h.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
this._youjinPanel = n;
}
},
hideYoujinPanel: function() {
this._youjinPanel && cc.isValid(this._youjinPanel) && this._youjinPanel.destroy();
this._youjinPanel = null;
},
onYoujinItemClicked: function(e) {
var t = e.target.pai;
null != t && cc.vv.net.send("youjin", t);
this.hideYoujinPanel();
this.hideOptions();
},
playEfx: function(e, t) {
var i = this._playEfxs[e];
i.node.active = !0;
i.play(t);
("play_hu" == t || "play_zimo" == t) && cc.vv && cc.vv.mahjongmgr && cc.vv.mahjongmgr.playHuSpine(i.node, "play_zimo" == t);
},
onGameBeign: function(e) {
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
var s = this.node.getChildByName("game"), c = s.getChildByName("huanpaiinfo");
null != c && (c.active = !1);
var r = [ "right", "up", "left" ];
for (t = 0; t < r.length; ++t) {
var l = s.getChildByName(r[t]);
if (null != l) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) l.active = !1; else {
l.active = !0;
var h = l.getChildByName("holds");
for (i = 0; i < h.childrenCount; ++i) h.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var d = cc.vv.gameNetMgr.seats;
for (var t in d) {
n = d[t];
if (0 != (a = cc.vv.gameNetMgr.getLocalIndex(t))) {
this.initOtherMahjongs(n);
t == cc.vv.gameNetMgr.turn ? this.initMopai(t, -1) : this.initMopai(t, null);
}
}
this.initAllHuaAreas();
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
var u = cc.vv.mahjongmgr.getSide(d), g = r ? r.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var m = [], f = 0; f < v.childrenCount; ++f) {
var _ = v.children[f];
_.active && m.push(_);
}
n(m, v, "up" == u ? function(e, t) {
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
var p = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == p) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
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
btnChi: 1,
btnQiangJin: 1,
btnYouJin: 1,
btnYouJinGo: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
onMJClicked: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect) {
var t = this._findMJNode(e);
if (null == t || null == t.mjId) return;
for (var i = 0; i < this._myMJArr.length; ++i) if (t == this._myMJArr[i].node) {
var n = this._chiSelect.tiles, a = n.indexOf(t);
if (-1 != a) {
n.splice(a, 1);
t.y = 0;
return;
}
if (n.length >= 2) return;
n.push(t);
t.y = 15;
if (2 == n.length) {
var o = n[0].mjId, s = n[1].mjId, c = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ o, s, c ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var r = this._findMJNode(e);
if (null != r) for (var l = 0; l < this._myMJArr.length; ++l) if (r == this._myMJArr[l].node) {
if (r == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
r.y = 15;
this._selectedMJ = r;
return;
}
} else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && cc.vv.net.send("chupai", e);
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
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (r = c; r < c + g; ++r) {
l = this.getMJIndex(i, r);
var v = o.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, c + g);
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
for (var g = 0; g < l.length; ++g) i.push(l[g]);
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
for (var d = cc.vv.gameNetMgr.conf, u = d ? d.caishen : -1, g = d ? d.caishen2 : -1, v = [], m = 0; m < n.length; ++m) {
var f = n[m];
if (null == (C = this._myMJArr[m + s]) || null == C.node) {
v.push("SLOT_" + (m + s) + "=NULL");
break;
}
C.node.mjId = f;
C.node.y = 0;
var _ = r && m == n.length - 1;
c > 0 && (C.node.x = h + m * c + (_ ? a : 0));
this.setSpriteFrameByMJID("M_", C, f);
var p = u >= 0 && f == u || null != g && g >= 0 && f == g;
C.node.color = p ? cc.color(255, 200, 90) : cc.Color.WHITE;
v.push("SLOT_" + (m + s) + "=" + f);
}
console.log("[initMahjongs] render:", v.join("|"));
for (m = 0; m < s; ++m) if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
}
for (m = s + n.length; m < this._myMJArr.length; ++m) {
var C;
if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
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
cc.vv.utils.addClickEvent(h, this.node, "MJGameWujin", "onChiItemClicked");
for (var d = 0; d < l.length; ++d) {
var u = new cc.Node("p" + d);
u.setContentSize(46, 66);
u.setPosition(50 * d - 50, 0);
h.addChild(u);
var g = u.addComponent(cc.Sprite);
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", l[d]);
g.sizeMode = cc.Sprite.SizeMode.CUSTOM;
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
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i || "btnQiangJin" == i) cc.vv.net.send("hu"); else {
if ("btnYouJin" == i) {
var n = cc.vv.gameNetMgr.curaction, a = n && n.youjin ? n.youjin : this._lastYoujin || [];
this._lastYoujin = a;
this.showYoujinPanel(a);
return;
}
if ("btnYouJinGo" == i) {
cc.vv.net.send("youjin_go");
this.hideOptions();
} else if ("btnGuo" == i) {
cc.vv.net.send("guo");
this.hideOptions();
}
}
} else this._chiSelect ? this.cancelChiSelect() : this.enterChiSelect(t.pai);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {} ],
MJGameZJLAO: [ function(e, t) {
"use strict";
cc._RF.push(t, "5a27cg14QhP2qTfnlzcTacT", "MJGameZJLAO");
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
} else cc.director.loadScene("loading");
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
for (a = 0; a < this._myMJArr.length; ++a) {
var s = this._myMJArr[a].node.getComponent(cc.Button);
if (null != s) {
var c = new cc.Component.EventHandler();
c.target = this.node;
c.component = "MJGameZJLAO";
c.handler = "onMJClicked";
c.customEventData = "";
s.clickEvents = [ c ];
}
}
var r = cc.view.getVisibleSize().width / 1280;
if (r < 1) {
n.scaleX *= r;
n.scaleY *= r;
}
var l = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < l; ++a) {
var h = cc.vv.mahjongmgr.getSide(a), d = e.getChildByName(h);
if (null != d) {
this._hupaiTips.push(d.getChildByName("HuPai"));
this._hupaiLists.push(d.getChildByName("hupailist"));
this._playEfxs.push(d.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(d.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var u = d.getChildByName("opt");
u.active = !1;
o = u.getChildByName("pai").getComponent(cc.Sprite);
var g = {
node: u,
sprite: o
};
this._opts.push(g);
}
}
var v = e.getChildByName("ops");
this._options = v;
var m = v ? v.getChildByName("New Layout") : null;
if (m) {
var f = m.getComponent(cc.Button);
f && (f.enabled = !1);
m.active = !1;
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
var o = this;
this.node.on("game_start", function(e) {
try {
o.onGameBeign(!0, e && e.detail);
} catch (e) {
console.error("[ZJLAO] onGameBeign error:", e);
}
o.initCaishenTip();
});
this.node.on("game_begin", function() {
o.onGameBeign();
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
o.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && o.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || o.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? o.initMahjongs(!0) : cc.vv.replayMgr.isReplay() && o.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = o._hupaiTips[i];
n.active = !0;
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
o.initMopai(t, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.mahjongmgr.playRandSFX(e.zimo ? "zimo" : "hu", e.zimo ? 2 : 3);
});
this.node.on("mj_count", function() {
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
o.gameRoot.active = !1;
o.prepareRoot.active = !0;
o.hideChiPanel();
});
this.node.on("game_chupai_notify", function(e) {
o.hideChupai();
o.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? o.initMahjongs() : o.initOtherMahjongs(i);
o.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
o.playEfx(n, "play_peng");
cc.vv.mahjongmgr.playRandSFX("peng", 5);
o.hideOptions();
});
this.node.on("gang_notify", function(e) {
o.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
if ("wangang" == i) {
o.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
o.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
o.hideOptions();
});
this.node.on("chi_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var i = o.getLocalIndex(t.seatindex);
o.playEfx(i, "play_peng");
cc.vv.mahjongmgr.playRandSFX("chi", 4);
o.hideOptions();
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
cc.vv.utils.addClickEvent(t, this.node, "MJGameZJLAO", "onOptionClicked");
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
cc.vv.utils.addClickEvent(t, this.node, "MJGameZJLAO", "onOptionClicked");
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
this._options.active = !1;
for (var e = 0; e < this._options.childrenCount; ++e) {
var t = this._options.children[e];
if ("op" == t.name) {
t.active = !1;
t.getChildByName("btnPeng").active = !1;
t.getChildByName("btnGang").active = !1;
t.getChildByName("btnHu").active = !1;
var i = t.getChildByName("btnChi");
i && (i.active = !1);
}
}
this.hideChiPanel();
this.cancelChiSelect();
}
},
showAction: function(e) {
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
var i = cc.vv.gameNetMgr.conf, n = null != i && null != i.caishen && i.caishen >= 0;
t.active = n;
if (n) {
t.setSiblingIndex(t.parent.childrenCount - 1);
var a = function(e, t) {
var i = e.getComponent(cc.Sprite);
if (i) {
i.enabled = !0;
i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
}
}, o = t.getChildByName("cs1");
if (o) {
o.active = !0;
a(o, i.caishen);
}
var s = t.getChildByName("cs2");
if (s) {
var c = null != i.caishen2 && i.caishen2 >= 0;
s.active = c;
c && a(s, i.caishen2);
}
}
}
}
},
playEfx: function(e, t) {
var i = this._playEfxs[e];
i.node.active = !0;
i.play(t);
("play_hu" == t || "play_zimo" == t) && cc.vv && cc.vv.mahjongmgr && cc.vv.mahjongmgr.playHuSpine(i.node, "play_zimo" == t);
},
onGameBeign: function(e) {
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
var s = this.node.getChildByName("game"), c = s.getChildByName("huanpaiinfo");
null != c && (c.active = !1);
var r = [ "right", "up", "left" ];
for (t = 0; t < r.length; ++t) {
var l = s.getChildByName(r[t]);
if (null != l) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) l.active = !1; else {
l.active = !0;
var h = l.getChildByName("holds");
for (i = 0; i < h.childrenCount; ++i) h.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var d = cc.vv.gameNetMgr.seats;
for (var t in d) {
n = d[t];
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
var u = cc.vv.mahjongmgr.getSide(d), g = r ? r.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var m = [], f = 0; f < v.childrenCount; ++f) {
var _ = v.children[f];
_.active && m.push(_);
}
n(m, v, "up" == u ? function(e, t) {
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
var p = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == p) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
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
if (this._chiSelect) {
var t = this._findMJNode(e);
if (null == t || null == t.mjId) return;
for (var i = 0; i < this._myMJArr.length; ++i) if (t == this._myMJArr[i].node) {
var n = this._chiSelect.tiles, a = n.indexOf(t);
if (-1 != a) {
n.splice(a, 1);
t.y = 0;
return;
}
if (n.length >= 2) return;
n.push(t);
t.y = 15;
if (2 == n.length) {
var o = n[0].mjId, s = n[1].mjId, c = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ o, s, c ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var r = this._findMJNode(e);
if (null != r) for (var l = 0; l < this._myMJArr.length; ++l) if (r == this._myMJArr[l].node) {
if (r == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
r.y = 15;
this._selectedMJ = r;
return;
}
} else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && cc.vv.net.send("chupai", e);
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
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (r = c; r < c + g; ++r) {
l = this.getMJIndex(i, r);
var v = o.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, c + g);
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
for (var g = 0; g < l.length; ++g) i.push(l[g]);
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
var g = n[u];
if (null == (m = this._myMJArr[u + s]) || null == m.node) {
d.push("SLOT_" + (u + s) + "=NULL");
break;
}
m.node.mjId = g;
m.node.y = 0;
var v = r && u == n.length - 1;
c > 0 && (m.node.x = h + u * c + (v ? a : 0));
this.setSpriteFrameByMJID("M_", m, g);
d.push("SLOT_" + (u + s) + "=" + g);
}
console.log("[initMahjongs] render:", d.join("|"));
for (u = 0; u < s; ++u) if (null != (m = this._myMJArr[u]) && null != m.node) {
m.node.mjId = null;
m.spriteFrame = null;
m.node.active = !1;
}
for (u = s + n.length; u < this._myMJArr.length; ++u) {
var m;
if (null != (m = this._myMJArr[u]) && null != m.node) {
m.node.mjId = null;
m.spriteFrame = null;
m.node.active = !1;
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
cc.vv.utils.addClickEvent(h, this.node, "MJGameZJLAO", "onChiItemClicked");
for (var d = 0; d < l.length; ++d) {
var u = new cc.Node("p" + d);
u.setContentSize(46, 66);
u.setPosition(50 * d - 50, 0);
h.addChild(u);
var g = u.addComponent(cc.Sprite);
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", l[d]);
g.sizeMode = cc.Sprite.SizeMode.CUSTOM;
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
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {} ],
MJGameZJZX: [ function(e, t) {
"use strict";
cc._RF.push(t, "9d93eTiWw9J7psIXQw8O3BB", "MJGameZJZX");
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
_huaAreas: [],
_youjinLabels: [],
_youjinPanel: null,
_dealAnimating: !1,
_dealAnimNodes: null,
_dealAnimId: 0,
_pendingPlans: null,
_caishenPlanPanel: null,
_countdownLabel: null,
_countdownId: null,
_countdownSec: 0
},
onLoad: function() {
try {
var e = this.node.getComponent(cc.Canvas);
if (null == e) return;
if (!cc.sys.isNative) {
e.fitHeight = !0;
e.fitWidth = !1;
for (var t = cc.director.getScene().getComponentsInChildren(cc.Camera), i = 0; i < t.length; i++) {
t[i].clearFlags = cc.Camera.ClearFlags.COLOR;
t[i].backgroundColor = cc.color(30, 18, 12);
}
}
if (!cc.vv) {
cc.director.loadScene("loading");
return;
}
for (var n = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
this.initView();
this.initEventHandlers();
this.gameRoot.active = !1;
this.prepareRoot.active = !0;
this.initWanfaLabel();
this.onGameBeign();
this.initCaishenTip();
this.initCaishenPlanPanel();
if (cc.vv.gameNetMgr.waitCaishenPlans && cc.vv.gameNetMgr.waitCaishenPlans.length > 0) {
this._pendingPlans = cc.vv.gameNetMgr.waitCaishenPlans;
cc.vv.gameNetMgr.waitCaishenPlans = null;
this.showCaishenPlanPanel();
}
cc.vv.audioMgr.playBGM("bgFight.mp3");
} catch (e) {
console.error("[ZJZX] onLoad CRASH:", e.message);
console.error(e.stack);
}
},
initView: function() {
this._selectedMJ = null;
this._chiSelect = null;
this._pendingPlans = null;
this._opts = [];
this._caishenPlanPanel && (this._caishenPlanPanel.active = !1);
this._chiHint && (this._chiHint.active = !1);
var e = this.node.getChildByName("game");
this._mjcount = e.getChildByName("mjcount").getComponent(cc.Label);
this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
this._gamecount = e.getChildByName("gamecount").getComponent(cc.Label);
this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
var t = this.node.getChildByName("infobar");
if (t) {
this._countdownLabel = t.getChildByName("countdownLabel");
this._countdownLabel && !this._countdownLabel.getComponent(cc.Label) && this._countdownLabel.addComponent(cc.Label);
}
var i = this._mjcount.node, n = this._gamecount.node;
this.scheduleOnce(function() {
cc.isValid(i) && cc.isValid(n) && i.setPosition(n.x - n.width / 2 - i.width / 2 - 12, n.y);
}, 0);
for (var a = e.getChildByName("myself").getChildByName("holds"), o = 0; o < a.children.length; ++o) {
var s = a.children[o].getComponent(cc.Sprite);
this._myMJArr.push(s);
s.spriteFrame = null;
}
var c = cc.view.getVisibleSize().width / 1280;
if (c < 1) {
a.scaleX *= c;
a.scaleY *= c;
}
var r = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (o = 0; o < r; ++o) {
var l = cc.vv.mahjongmgr.getSide(o), h = e.getChildByName(l);
if (null != h) {
this._hupaiTips.push(h.getChildByName("HuPai"));
this._hupaiLists.push(h.getChildByName("hupailist"));
this._playEfxs.push(h.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(h.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var d = h.getChildByName("opt");
d.active = !1;
s = d.getChildByName("pai").getComponent(cc.Sprite);
var u = {
node: d,
sprite: s
};
this._opts.push(u);
}
}
var g = e.getChildByName("ops");
this._options = g;
if (g) for (var v = 0; v < g.childrenCount; ++v) {
var m = g.children[v];
if ("op" == m.name) {
var f = m.getChildByName("btnChi");
if (f) {
var _ = f.getComponent(cc.Button);
_ && 0 == _.clickEvents.length && cc.vv.utils.addClickEvent(f, this.node, "MJGameZJZX", "onOptionClicked");
}
}
}
var p = g ? g.getChildByName("New Layout") : null;
if (p) {
var C = p.getComponent(cc.Button);
C && (C.enabled = !1);
p.active = !1;
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
var a = this.node, o = this;
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
if (e.waitCaishenPlans && e.waitCaishenPlans.length > 0) {
o._pendingPlans = e.waitCaishenPlans;
e.waitCaishenPlans = null;
o.showCaishenPlanPanel();
}
}
}, 0);
}
}
(o = this)._pendingPlans = null;
this.node.on("game_start", function(e) {
o.onGameBeign(!0, e && e.detail);
o.initCaishenTip();
cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex && o._startCountdown();
});
this.node.on("game_begin", function() {
o.onGameBeign();
});
this.node.on("bao_result", function() {
o.initCaishenTip();
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
o._stopCountdown();
o.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && o.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || o.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
if (0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex)) {
o._startCountdown();
o.initMahjongs(!0);
} else cc.vv.replayMgr.isReplay() && o.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = o._hupaiTips[i];
n.active = !0;
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
o.initMopai(t, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.mahjongmgr.playRandSFX(e.zimo ? "zimo" : "hu", e.zimo ? 2 : 3);
});
this.node.on("game_caishen_plans", function(e) {
if ((e = e.detail) && e.plans && 0 !== e.plans.length) {
o._pendingPlans = e.plans;
o.showCaishenPlanPanel();
}
});
this.node.on("mj_count", function() {
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
o.gameRoot.active = !1;
o.prepareRoot.active = !0;
o.hideChiPanel();
o.hideYoujinPanel();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
o.initHuaArea(t.si);
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
}
});
this.node.on("game_youjin", function(e) {
var t = e.detail;
t && o.showYoujinLevel(t.si, t.level);
});
this.node.on("game_fenbing", function(e) {
var t = e.detail;
if (t) {
var i = cc.vv.gameNetMgr.seats[t.si], n = i ? i.name : "" + t.si;
cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(n + " 分饼 " + t.score + " 分");
}
});
this.node.on("game_chupai_notify", function(e) {
o.hideChupai();
o.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? o.initMahjongs() : o.initOtherMahjongs(i);
o.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
o.playEfx(n, "play_peng");
cc.vv.mahjongmgr.playRandSFX("peng", 5);
o.hideOptions();
});
this.node.on("gang_notify", function(e) {
o.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
if ("wangang" == i) {
o.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
o.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
o.hideOptions();
});
this.node.on("chi_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var i = o.getLocalIndex(t.seatindex);
o.playEfx(i, "play_peng");
cc.vv.mahjongmgr.playRandSFX("chi", 4);
o.hideOptions();
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
if (t) return t;
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
cc.resources.load("images/atlas/other_a/btn_red3", cc.SpriteFrame, function(e, i) {
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
cc.vv.utils.addClickEvent(t, this.node, "MJGameZJZX", "onOptionClicked");
t.active = !1;
return t;
},
getZpOpButton: function(e, t, i, n) {
var a = e.getChildByName(t);
if (a) return a;
var o = e.getChildByName("btnPeng");
a = new cc.Node(t);
e.addChild(a);
if (o) {
a.setPosition(o.getPosition());
a.setContentSize(o.getContentSize());
a.scaleX = o.scaleX;
a.scaleY = o.scaleY;
}
var s = a.addComponent(cc.Sprite);
s.type = cc.Sprite.Type.SIMPLE;
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/atlas/other_a/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(a)) {
var i = a.getComponent(cc.Sprite);
i && (i.spriteFrame = t);
}
});
a.addComponent(cc.Button);
var c = new cc.Node("btnLabel");
a.addChild(c);
var r = c.addComponent(cc.Label);
r.string = i;
r.fontSize = n || 40;
r.lineHeight = r.fontSize;
r.overflow = cc.Label.Overflow.NONE;
r.enableWrapText = !1;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 255, 255);
c.setPosition(0, 0);
cc.vv.utils.addClickEvent(a, this.node, "MJGameZJZX", "onOptionClicked");
a.active = !1;
return a;
},
addZpOption: function(e, t, i, n) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var o = this._options.children[a];
if ("op" == o.name && 0 == o.active) {
o.active = !0;
o.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = null != i && i >= 0 ? cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", i) : null;
var s = this.getZpOpButton(o, e, t, n);
s.active = !0;
s.pai = i;
return;
}
}
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
this._options.active = !1;
for (var e = 0; e < this._options.childrenCount; ++e) {
var t = this._options.children[e];
if ("op" == t.name) {
t.active = !1;
t.getChildByName("btnPeng").active = !1;
t.getChildByName("btnGang").active = !1;
t.getChildByName("btnHu").active = !1;
var i = t.getChildByName("btnChi");
i && (i.active = !1);
var n = t.getChildByName("btnQiangJin");
n && (n.active = !1);
var a = t.getChildByName("btnYouJin");
a && (a.active = !1);
var o = t.getChildByName("btnYouJinGo");
o && (o.active = !1);
}
}
this.hideChiPanel();
this.cancelChiSelect();
this.hideYoujinPanel();
}
},
showAction: function(e) {
this.hideCaishenPlanPanel();
this._options.active && this.hideOptions();
var t = this._options.getChildByName("New Layout");
t && (t.active = !1);
var i = !!(e && e.youjin && e.youjin.length > 0);
if (e && (e.hu || e.gang || e.peng || e.chi || e.qiangjin || i || e.youjingo)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) for (var n = 0; n < e.gangpai.length; ++n) {
var a = e.gangpai[n];
this.addOption("btnGang", a);
}
e.chi && this.addChiOption(e.pai);
e.qiangjin && this.addZpOption("btnQiangJin", "抢金", e.pai, 32);
i && this.addZpOption("btnYouJin", "游金", e.pai);
e.youjingo && this.addZpOption("btnYouJinGo", "继续游金", e.pai, 28);
var o = this._options.getChildByName("btnGuo");
o && (o.active = !0);
}
},
initWanfaLabel: function() {
var e = cc.find("Canvas/infobar/wanfa") || cc.find("Canvas/infobar/New Sprite/wanfa");
if (null != e) {
var t = e.getComponent(cc.Label);
t && (t.string = cc.vv.gameNetMgr.getWanfa());
}
},
initCaishenTip: function() {
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("caishenTip");
null != t && (t.active = !1);
}
},
_huaAreaPos: function(e) {
return "myself" == e ? cc.v2(-540, -230) : "up" == e ? cc.v2(430, 210) : "right" == e ? cc.v2(540, 40) : cc.v2(-540, 40);
},
getHuaArea: function(e) {
var t = cc.vv.gameNetMgr.getLocalIndex(e);
if (this._huaAreas[t] && cc.isValid(this._huaAreas[t])) return this._huaAreas[t];
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game") || this.node, a = new cc.Node("huaArea_" + i), o = this._huaAreaPos(i);
a.setPosition(o.x, o.y);
n.addChild(a);
this._huaAreas[t] = a;
return a;
},
initHuaArea: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[e] : null;
if (null != t) {
var i = this.getHuaArea(e);
i.removeAllChildren();
var n = t.hua || [];
if (0 != n.length) for (var a = cc.vv.mahjongmgr.bottomAtlas, o = 0; o < n.length; ++o) {
var s = n[o], c = new cc.Node("hua" + o);
c.setContentSize(44, 64);
c.setPosition(48 * o + 22, 0);
i.addChild(c);
var r = c.addComponent(cc.Sprite);
r.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var l = s - 34, h = l >= 0 && l < 8 ? "M_" + [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][l] : null, d = h ? a.getSpriteFrame(h) : null;
if (null != d) r.spriteFrame = d; else {
var u = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
r.spriteFrame = u;
var g = new cc.Node("name");
c.addChild(g);
var v = g.addComponent(cc.Label);
v.string = l >= 0 && l < 8 ? [ "梅", "兰", "竹", "菊", "春", "夏", "秋", "冬" ][l] : "花";
v.fontSize = 26;
v.lineHeight = 28;
v.overflow = cc.Label.Overflow.NONE;
v.enableWrapText = !1;
v.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.verticalAlign = cc.Label.VerticalAlign.CENTER;
g.color = cc.color(220, 40, 40);
g.setPosition(0, 0);
}
}
}
},
initAllHuaAreas: function() {
var e = cc.vv.gameNetMgr.seats;
if (e) for (var t = 0; t < e.length; ++t) {
this.initHuaArea(t);
this.showYoujinLevel(t, e[t].youjinLevel || 0);
}
},
showYoujinLevel: function(e, t) {
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = this._youjinLabels[i];
if (!n || !cc.isValid(n)) {
var a = cc.vv.mahjongmgr.getSide(i), o = this.getHuaArea(e);
n = new cc.Node("youjin_" + a);
o.parent.addChild(n);
var s = n.addComponent(cc.Label);
s.fontSize = 30;
s.lineHeight = 34;
s.overflow = cc.Label.Overflow.NONE;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
n.color = cc.color(255, 90, 90);
var c = n.addComponent(cc.LabelOutline);
c.color = cc.color(80, 0, 0);
c.width = 2;
this._youjinLabels[i] = n;
}
var r = this.getHuaArea(e);
n.setPosition(r.x, r.y + 80);
if (t > 0) {
n.active = !0;
n.getComponent(cc.Label).string = [ "", "单游", "双游", "三游" ][t] || t + "游";
} else n.active = !1;
},
showYoujinPanel: function(e) {
this.hideYoujinPanel();
if (e && 0 != e.length) {
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 40 + 62 * e.length + 16 * (e.length - 1), n = new cc.Node("youjinPanel");
n.setContentSize(i, 146);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 146);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -73, i, 146);
o.fill();
o.stroke();
var s = new cc.Node("cap");
s.setContentSize(i, 28);
s.setPosition(0, 49);
n.addChild(s);
var c = s.addComponent(cc.Label);
c.string = "选择一张牌宣告游金";
c.fontSize = 22;
c.lineHeight = 28;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = cc.color(255, 225, 150);
for (var r = 0; r < e.length; ++r) {
var l = new cc.Node("yjItem" + r);
l.setContentSize(62, 90);
l.setPosition(51 + -i / 2 + 78 * r, -14);
n.addChild(l);
l.addComponent(cc.Button);
l.pai = e[r];
cc.vv.utils.addClickEvent(l, this.node, "MJGameZJZX", "onYoujinItemClicked");
var h = l.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[r]);
h.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
this._youjinPanel = n;
}
},
hideYoujinPanel: function() {
this._youjinPanel && cc.isValid(this._youjinPanel) && this._youjinPanel.destroy();
this._youjinPanel = null;
},
onYoujinItemClicked: function(e) {
var t = e.target.pai;
null != t && cc.vv.net.send("youjin", t);
this.hideYoujinPanel();
this.hideOptions();
},
playEfx: function(e, t) {
var i = this._playEfxs[e];
i.node.active = !0;
i.play(t);
("play_hu" == t || "play_zimo" == t) && cc.vv && cc.vv.mahjongmgr && cc.vv.mahjongmgr.playHuSpine(i.node, "play_zimo" == t);
},
onGameBeign: function(e) {
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
var s = this.node.getChildByName("game"), c = s.getChildByName("huanpaiinfo");
null != c && (c.active = !1);
var r = [ "right", "up", "left" ];
for (t = 0; t < r.length; ++t) {
var l = s.getChildByName(r[t]);
if (null != l) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) l.active = !1; else {
l.active = !0;
var h = l.getChildByName("holds");
for (i = 0; i < h.childrenCount; ++i) h.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!1);
var d = cc.vv.gameNetMgr.seats;
for (var t in d) {
n = d[t];
if (0 != (a = cc.vv.gameNetMgr.getLocalIndex(t))) {
this.initOtherMahjongs(n);
t == cc.vv.gameNetMgr.turn ? this.initMopai(t, -1) : this.initMopai(t, null);
}
}
this.initAllHuaAreas();
this.showChupai();
var u = this;
this.scheduleOnce(function() {
if (cc.isValid(u.node) && null != cc.vv.gameNetMgr.curaction) {
u.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
}, 0);
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
var u = cc.vv.mahjongmgr.getSide(d), g = r ? r.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var m = [], f = 0; f < v.childrenCount; ++f) {
var _ = v.children[f];
_.active && m.push(_);
}
n(m, v, "up" == u ? function(e, t) {
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
var p = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == p) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
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
btnChi: 1,
btnQiangJin: 1,
btnYouJin: 1,
btnYouJinGo: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
onMJClicked: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect) {
var t = this._findMJNode(e);
if (null == t || null == t.mjId) return;
for (var i = 0; i < this._myMJArr.length; ++i) if (t == this._myMJArr[i].node) {
var n = this._chiSelect.tiles, a = n.indexOf(t);
if (-1 != a) {
n.splice(a, 1);
t.y = 0;
return;
}
if (n.length >= 2) return;
n.push(t);
t.y = 15;
if (2 == n.length) {
var o = n[0].mjId, s = n[1].mjId, c = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ o, s, c ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var r = this._findMJNode(e);
if (null != r) for (var l = 0; l < this._myMJArr.length; ++l) if (r == this._myMJArr[l].node) {
if (r == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
r.y = 15;
this._selectedMJ = r;
return;
}
} else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && cc.vv.net.send("chupai", e);
},
getMJIndex: function(e, t) {
return "right" == e || "up" == e ? 13 - t : t;
},
_startCountdown: function() {
this._stopCountdown();
var e = cc.vv && cc.vv.gameNetMgr && cc.vv.gameNetMgr.chupaiTimeout || 15;
if (!(e <= 0)) {
this._countdownSec = e;
if (this._countdownLabel) {
var t = this._countdownLabel.getComponent(cc.Label);
t && (t.string = this._countdownSec + "s");
}
var i = this;
this._countdownId = setInterval(function() {
if (i.node && cc.isValid(i.node)) {
i._countdownSec--;
if (i._countdownLabel) {
var e = i._countdownLabel.getComponent(cc.Label);
e && (e.string = i._countdownSec > 0 ? i._countdownSec + "s" : "");
}
i._countdownSec <= 0 && i._stopCountdown();
} else i._stopCountdown();
}, 1e3);
}
},
_stopCountdown: function() {
if (this._countdownId) {
clearInterval(this._countdownId);
this._countdownId = null;
}
this._countdownSec = 0;
if (this._countdownLabel) {
var e = this._countdownLabel.getComponent(cc.Label);
e && (e.string = "");
}
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
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (r = c; r < c + g; ++r) {
l = this.getMJIndex(i, r);
var v = o.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, c + g);
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
for (var g = 0; g < l.length; ++g) i.push(l[g]);
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
for (var d = cc.vv.gameNetMgr.conf, u = d ? d.caishen : -1, g = d ? d.caishen2 : -1, v = [], m = 0; m < n.length; ++m) {
var f = n[m];
if (null == (C = this._myMJArr[m + s]) || null == C.node) {
v.push("SLOT_" + (m + s) + "=NULL");
break;
}
C.node.mjId = f;
C.node.y = 0;
var _ = r && m == n.length - 1;
c > 0 && (C.node.x = h + m * c + (_ ? a : 0));
this.setSpriteFrameByMJID("M_", C, f);
var p = u >= 0 && f == u || null != g && g >= 0 && f == g;
C.node.color = p ? cc.color(255, 200, 90) : cc.Color.WHITE;
v.push("SLOT_" + (m + s) + "=" + f);
}
console.log("[initMahjongs] render:", v.join("|"));
for (m = 0; m < s; ++m) if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
}
for (m = s + n.length; m < this._myMJArr.length; ++m) {
var C;
if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
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
cc.vv.utils.addClickEvent(h, this.node, "MJGameZJZX", "onChiItemClicked");
for (var d = 0; d < l.length; ++d) {
var u = new cc.Node("p" + d);
u.setContentSize(46, 66);
u.setPosition(50 * d - 50, 0);
h.addChild(u);
var g = u.addComponent(cc.Sprite);
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", l[d]);
g.sizeMode = cc.Sprite.SizeMode.CUSTOM;
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
console.log("[ZJZX] onOptionClicked btn=" + (t ? t.name : "null"));
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i || "btnQiangJin" == i) {
this.hideOptions();
cc.vv.net.send("hu");
} else {
if ("btnYouJin" == i) {
var n = cc.vv.gameNetMgr.curaction, a = n && n.youjin ? n.youjin : this._lastYoujin || [];
this._lastYoujin = a;
this.showYoujinPanel(a);
return;
}
if ("btnYouJinGo" == i) {
cc.vv.net.send("youjin_go");
this.hideOptions();
} else if ("btnGuo" == i) {
cc.vv.net.send("guo");
this.hideOptions();
}
}
} else this._chiSelect ? this.cancelChiSelect() : this.enterChiSelect(t.pai);
}
},
update: function() {},
initCaishenPlanPanel: function() {
var e = this.node.getChildByName("caishenPlanPanel");
if (null == e) {
var t = this.node.getChildByName("game");
t && (e = t.getChildByName("caishenPlanPanel"));
}
if (e) {
this._caishenPlanPanel = e;
e.active = !1;
}
},
_mjIdToName: function(e) {
return null == e || e < 0 ? "?" : e < 9 ? [ "一万", "二万", "三万", "四万", "五万", "六万", "七万", "八万", "九万" ][e] : e < 18 ? [ "一筒", "二筒", "三筒", "四筒", "五筒", "六筒", "七筒", "八筒", "九筒" ][e - 9] : e < 27 ? [ "一条", "二条", "三条", "四条", "五条", "六条", "七条", "八条", "九条" ][e - 18] : e < 31 ? [ "东", "南", "西", "北" ][e - 27] : e < 34 ? [ "中", "发", "白" ][e - 31] : "?";
},
showCaishenPlanPanel: function() {
console.log("[ZJZX] showCaishenPlanPanel called! _pendingPlans=", JSON.stringify(this._pendingPlans));
if (!this._caishenPlanPanel) {
var e = this.node.getChildByName("caishenPlanPanel");
if (null == e) {
var t = this.node.getChildByName("game");
t && (e = t.getChildByName("caishenPlanPanel"));
}
console.log("[ZJZX] caishenPlanPanel lookup: root=", !!e, "this.node.name=", this.node.name);
if (e) this._caishenPlanPanel = e; else {
console.error("[ZJZX] caishenPlanPanel 节点不存在, 全场景搜索...");
for (var i = cc.find("Canvas").children, n = 0; n < i.length; n++) {
var a = i[n].getChildByName && i[n].getChildByName("caishenPlanPanel");
if (a) {
console.log("[ZJZX] 找到! 在 Canvas/" + i[n].name);
this._caishenPlanPanel = a;
break;
}
}
if (!this._caishenPlanPanel) {
console.error("[ZJZX] 全场景也找不到caishenPlanPanel!");
return;
}
}
}
var o = this._caishenPlanPanel;
console.log("[ZJZX] panel found, active=", o.active);
var s = [ "btnWuCai", "btnDanCai", "btnShuangCai", "btnReselect" ];
for (n = 0; n < s.length; ++n) {
var c = o.getChildByName(s[n]);
c && (c.active = !1);
}
var r = o.getChildByName("btnSetCaishen");
r && (r.active = !0);
o.active = !0;
var l = o.parent;
l && o.setSiblingIndex(l.childrenCount - 1);
var h = this._pendingPlans || [];
if (0 !== h.length) {
var d = h[0], u = o.getChildByName("taiLabel");
if (u) {
u.active = !0;
u.getComponent(cc.Label).string = "胡" + d.tai + "台";
}
var g = o.getChildByName("modeLabel");
if (g) {
g.active = !0;
g.getComponent(cc.Label).string = 0 === d.mode ? "无财" : 1 === d.mode ? "独财" : "双财";
}
var v = function(e, t) {
var i = o.getChildByName(e);
if (i) if (null == t || t < 0) i.active = !1; else {
i.active = !0;
i.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
}
};
if (0 === d.mode) {
v("csImg1", null);
v("csImg2", null);
} else if (1 === d.mode) {
v("csImg1", d.c1);
v("csImg2", null);
} else {
v("csImg1", d.c1);
v("csImg2", d.c2);
}
}
},
hideCaishenPlanPanel: function() {
this._caishenPlanPanel && (this._caishenPlanPanel.active = !1);
this._pendingPlans = null;
this._selectedMJ = null;
this._chiSelect = null;
this._chiHint && (this._chiHint.active = !1);
},
onSetCaishenClicked: function() {
var e = this._pendingPlans || [];
if (0 !== e.length) {
var t = e[0];
this.hideCaishenPlanPanel();
cc.vv.net.send("hu", {
c1: t.c1,
c2: t.c2,
mode: t.mode
});
}
},
onQihuClicked: function() {
this.hideCaishenPlanPanel();
cc.vv.net.send("guo");
},
onDestroy: function() {
console.log("onDestroy");
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {} ],
MJGameZP4: [ function(e, t) {
"use strict";
cc._RF.push(t, "1ceectQJ9RACq8HX8M4XEtm", "MJGameZP4");
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
_huaAreas: [],
_youjinLabels: [],
_youjinPanel: null,
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
for (var n = [ "NoticeTip", "GameOverZP", "PengGangs", "MJRoom", "TimePointer", "GameResultZP", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
this.initView();
this.initEventHandlers();
this.gameRoot.active = !1;
this.prepareRoot.active = !0;
this.initWanfaLabel();
this.onGameBeign();
this.initCaishenTip();
cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("loading");
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
var g = u ? u.getChildByName("New Layout") : null;
if (g) {
var v = g.getComponent(cc.Button);
v && (v.enabled = !1);
g.active = !1;
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
var o = this;
this.node.on("game_start", function(e) {
o.onGameBeign(!0, e && e.detail);
o.initCaishenTip();
});
this.node.on("game_begin", function() {
o.onGameBeign();
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
o.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && o.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || o.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? o.initMahjongs(!0) : cc.vv.replayMgr.isReplay() && o.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = o._hupaiTips[i];
n.active = !0;
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
o.initMopai(t, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.mahjongmgr.playRandSFX(e.zimo ? "zimo" : "hu", e.zimo ? 2 : 3);
});
this.node.on("mj_count", function() {
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
o.gameRoot.active = !1;
o.prepareRoot.active = !0;
o.hideChiPanel();
o.hideYoujinPanel();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
o.initHuaArea(t.si);
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
}
});
this.node.on("game_youjin", function(e) {
var t = e.detail;
t && o.showYoujinLevel(t.si, t.level);
});
this.node.on("game_fenbing", function(e) {
var t = e.detail;
if (t) {
var i = cc.vv.gameNetMgr.seats[t.si], n = i ? i.name : "" + t.si;
cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(n + " 分饼 " + t.score + " 分");
}
});
this.node.on("game_chupai_notify", function(e) {
o.hideChupai();
o.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? o.initMahjongs() : o.initOtherMahjongs(i);
o.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
o.playEfx(n, "play_peng");
cc.vv.mahjongmgr.playRandSFX("peng", 5);
o.hideOptions();
});
this.node.on("gang_notify", function(e) {
o.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
if ("wangang" == i) {
o.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
o.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
o.hideOptions();
});
this.node.on("chi_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var i = o.getLocalIndex(t.seatindex);
o.playEfx(i, "play_peng");
cc.vv.mahjongmgr.playRandSFX("chi", 4);
o.hideOptions();
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
cc.vv.utils.addClickEvent(t, this.node, "MJGameZP4", "onOptionClicked");
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
cc.vv.utils.addClickEvent(t, this.node, "MJGameZP4", "onOptionClicked");
t.active = !1;
return t;
},
getZpOpButton: function(e, t, i, n) {
var a = e.getChildByName(t);
if (a) {
if (!a._zpBound) {
a._zpBound = !0;
cc.vv.utils.addClickEvent(a, this.node, "MJGameZP4", "onOptionClicked");
}
return a;
}
var o = e.getChildByName("btnPeng");
a = new cc.Node(t);
e.addChild(a);
if (o) {
a.setPosition(o.getPosition());
a.setContentSize(o.getContentSize());
a.scaleX = o.scaleX;
a.scaleY = o.scaleY;
}
var s = a.addComponent(cc.Sprite);
s.type = cc.Sprite.Type.SIMPLE;
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(a)) {
var i = a.getComponent(cc.Sprite);
i && (i.spriteFrame = t);
}
});
a.addComponent(cc.Button);
var c = new cc.Node("btnLabel");
a.addChild(c);
var r = c.addComponent(cc.Label);
r.string = i;
r.fontSize = n || 40;
r.lineHeight = r.fontSize;
r.overflow = cc.Label.Overflow.NONE;
r.enableWrapText = !1;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 255, 255);
c.setPosition(0, 0);
cc.vv.utils.addClickEvent(a, this.node, "MJGameZP4", "onOptionClicked");
a.active = !1;
return a;
},
addZpOption: function(e, t, i, n) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var o = this._options.children[a];
if ("op" == o.name && 0 == o.active) {
o.active = !0;
o.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = null != i && i >= 0 ? cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", i) : null;
var s = this.getZpOpButton(o, e, t, n);
s.active = !0;
s.pai = i;
return;
}
}
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
this._options.active = !1;
for (var e = 0; e < this._options.childrenCount; ++e) {
var t = this._options.children[e];
if ("op" == t.name) {
t.active = !1;
t.getChildByName("btnPeng").active = !1;
t.getChildByName("btnGang").active = !1;
t.getChildByName("btnHu").active = !1;
var i = t.getChildByName("btnChi");
i && (i.active = !1);
var n = t.getChildByName("btnQiangJin");
n && (n.active = !1);
var a = t.getChildByName("btnYouJin");
a && (a.active = !1);
var o = t.getChildByName("btnYouJinGo");
o && (o.active = !1);
}
}
this.hideChiPanel();
this.cancelChiSelect();
this.hideYoujinPanel();
}
},
showAction: function(e) {
this._options.active && this.hideOptions();
var t = !!(e && e.youjin && e.youjin.length > 0);
if (e && (e.hu || e.gang || e.peng || e.chi || e.qiangjin || t || e.youjingo)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) for (var i = 0; i < e.gangpai.length; ++i) {
var n = e.gangpai[i];
this.addOption("btnGang", n);
}
e.chi && this.addChiOption(e.pai);
e.qiangjin && this.addZpOption("btnQiangJin", "抢金", e.pai, 32);
t && this.addZpOption("btnYouJin", "游金", e.pai);
e.youjingo && this.addZpOption("btnYouJinGo", "继续游金", e.pai, 28);
var a = this._options.getChildByName("btnGuo");
a && (a.active = !0);
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
var i = cc.vv.gameNetMgr.conf, n = null != i && null != i.caishen && i.caishen >= 0;
t.active = n;
if (n) {
var a = function(e, t) {
var i = e.getComponent(cc.Sprite);
i && (i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t));
}, o = t.getChildByName("cs1");
if (o) {
o.active = !0;
a(o, i.caishen);
}
var s = t.getChildByName("cs2");
if (s) {
var c = null != i.caishen2 && i.caishen2 >= 0;
s.active = c;
c && a(s, i.caishen2);
}
}
}
}
},
_huaAreaPos: function(e) {
return "myself" == e ? cc.v2(-540, -230) : "up" == e ? cc.v2(430, 210) : "right" == e ? cc.v2(540, 40) : cc.v2(-540, 40);
},
getHuaArea: function(e) {
var t = cc.vv.gameNetMgr.getLocalIndex(e);
if (this._huaAreas[t] && cc.isValid(this._huaAreas[t])) return this._huaAreas[t];
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game") || this.node, a = new cc.Node("huaArea_" + i), o = this._huaAreaPos(i);
a.setPosition(o.x, o.y);
n.addChild(a);
this._huaAreas[t] = a;
return a;
},
initHuaArea: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[e] : null;
if (null != t) {
var i = this.getHuaArea(e);
i.removeAllChildren();
var n = t.hua || [];
if (0 != n.length) for (var a = cc.vv.mahjongmgr.bottomAtlas, o = 0; o < n.length; ++o) {
var s = n[o], c = new cc.Node("hua" + o);
c.setContentSize(44, 64);
c.setPosition(48 * o + 22, 0);
i.addChild(c);
var r = c.addComponent(cc.Sprite);
r.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var l = s - 34, h = l >= 0 && l < 8 ? "M_" + [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][l] : null, d = h ? a.getSpriteFrame(h) : null;
if (null != d) r.spriteFrame = d; else {
var u = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
r.spriteFrame = u;
var g = new cc.Node("name");
c.addChild(g);
var v = g.addComponent(cc.Label);
v.string = l >= 0 && l < 8 ? [ "梅", "兰", "竹", "菊", "春", "夏", "秋", "冬" ][l] : "花";
v.fontSize = 26;
v.lineHeight = 28;
v.overflow = cc.Label.Overflow.NONE;
v.enableWrapText = !1;
v.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.verticalAlign = cc.Label.VerticalAlign.CENTER;
g.color = cc.color(220, 40, 40);
g.setPosition(0, 0);
}
}
}
},
initAllHuaAreas: function() {
var e = cc.vv.gameNetMgr.seats;
if (e) for (var t = 0; t < e.length; ++t) {
this.initHuaArea(t);
this.showYoujinLevel(t, e[t].youjinLevel || 0);
}
},
showYoujinLevel: function(e, t) {
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = this._youjinLabels[i];
if (!n || !cc.isValid(n)) {
var a = cc.vv.mahjongmgr.getSide(i), o = this.getHuaArea(e);
n = new cc.Node("youjin_" + a);
o.parent.addChild(n);
var s = n.addComponent(cc.Label);
s.fontSize = 30;
s.lineHeight = 34;
s.overflow = cc.Label.Overflow.NONE;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
n.color = cc.color(255, 90, 90);
var c = n.addComponent(cc.LabelOutline);
c.color = cc.color(80, 0, 0);
c.width = 2;
this._youjinLabels[i] = n;
}
var r = this.getHuaArea(e);
n.setPosition(r.x, r.y + 80);
if (t > 0) {
n.active = !0;
n.getComponent(cc.Label).string = [ "", "单游", "双游", "三游" ][t] || t + "游";
} else n.active = !1;
},
showYoujinPanel: function(e) {
this.hideYoujinPanel();
if (e && 0 != e.length) {
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 40 + 62 * e.length + 16 * (e.length - 1), n = new cc.Node("youjinPanel");
n.setContentSize(i, 146);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 146);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -73, i, 146);
o.fill();
o.stroke();
var s = new cc.Node("cap");
s.setContentSize(i, 28);
s.setPosition(0, 49);
n.addChild(s);
var c = s.addComponent(cc.Label);
c.string = "选择一张牌宣告游金";
c.fontSize = 22;
c.lineHeight = 28;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = cc.color(255, 225, 150);
for (var r = 0; r < e.length; ++r) {
var l = new cc.Node("yjItem" + r);
l.setContentSize(62, 90);
l.setPosition(51 + -i / 2 + 78 * r, -14);
n.addChild(l);
l.addComponent(cc.Button);
l.pai = e[r];
cc.vv.utils.addClickEvent(l, this.node, "MJGameZP4", "onYoujinItemClicked");
var h = l.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[r]);
h.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
this._youjinPanel = n;
}
},
hideYoujinPanel: function() {
this._youjinPanel && cc.isValid(this._youjinPanel) && this._youjinPanel.destroy();
this._youjinPanel = null;
},
onYoujinItemClicked: function(e) {
var t = e.target.pai;
null != t && cc.vv.net.send("youjin", t);
this.hideYoujinPanel();
this.hideOptions();
},
playEfx: function(e, t) {
var i = this._playEfxs[e];
i.node.active = !0;
i.play(t);
("play_hu" == t || "play_zimo" == t) && cc.vv && cc.vv.mahjongmgr && cc.vv.mahjongmgr.playHuSpine(i.node, "play_zimo" == t);
},
onGameBeign: function(e) {
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
var s = this.node.getChildByName("game"), c = s.getChildByName("huanpaiinfo");
null != c && (c.active = !1);
var r = [ "right", "up", "left" ];
for (t = 0; t < r.length; ++t) {
var l = s.getChildByName(r[t]);
if (null != l) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) l.active = !1; else {
l.active = !0;
var h = l.getChildByName("holds");
for (i = 0; i < h.childrenCount; ++i) h.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var d = cc.vv.gameNetMgr.seats;
for (var t in d) {
n = d[t];
if (0 != (a = cc.vv.gameNetMgr.getLocalIndex(t))) {
this.initOtherMahjongs(n);
t == cc.vv.gameNetMgr.turn ? this.initMopai(t, -1) : this.initMopai(t, null);
}
}
this.initAllHuaAreas();
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
var u = cc.vv.mahjongmgr.getSide(d), g = r ? r.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var m = [], f = 0; f < v.childrenCount; ++f) {
var _ = v.children[f];
_.active && m.push(_);
}
n(m, v, "up" == u ? function(e, t) {
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
var p = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == p) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
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
btnChi: 1,
btnQiangJin: 1,
btnYouJin: 1,
btnYouJinGo: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
onMJClicked: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect) {
var t = this._findMJNode(e);
if (null == t || null == t.mjId) return;
for (var i = 0; i < this._myMJArr.length; ++i) if (t == this._myMJArr[i].node) {
var n = this._chiSelect.tiles, a = n.indexOf(t);
if (-1 != a) {
n.splice(a, 1);
t.y = 0;
return;
}
if (n.length >= 2) return;
n.push(t);
t.y = 15;
if (2 == n.length) {
var o = n[0].mjId, s = n[1].mjId, c = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ o, s, c ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var r = this._findMJNode(e);
if (null != r) for (var l = 0; l < this._myMJArr.length; ++l) if (r == this._myMJArr[l].node) {
if (r == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
r.y = 15;
this._selectedMJ = r;
return;
}
} else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && cc.vv.net.send("chupai", e);
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
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (r = c; r < c + g; ++r) {
l = this.getMJIndex(i, r);
var v = o.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, c + g);
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
for (var g = 0; g < l.length; ++g) i.push(l[g]);
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
for (var d = cc.vv.gameNetMgr.conf, u = d ? d.caishen : -1, g = d ? d.caishen2 : -1, v = [], m = 0; m < n.length; ++m) {
var f = n[m];
if (null == (C = this._myMJArr[m + s]) || null == C.node) {
v.push("SLOT_" + (m + s) + "=NULL");
break;
}
C.node.mjId = f;
C.node.y = 0;
var _ = r && m == n.length - 1;
c > 0 && (C.node.x = h + m * c + (_ ? a : 0));
this.setSpriteFrameByMJID("M_", C, f);
var p = u >= 0 && f == u || null != g && g >= 0 && f == g;
C.node.color = p ? cc.color(255, 200, 90) : cc.Color.WHITE;
v.push("SLOT_" + (m + s) + "=" + f);
}
console.log("[initMahjongs] render:", v.join("|"));
for (m = 0; m < s; ++m) if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
}
for (m = s + n.length; m < this._myMJArr.length; ++m) {
var C;
if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
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
cc.vv.utils.addClickEvent(h, this.node, "MJGameZP4", "onChiItemClicked");
for (var d = 0; d < l.length; ++d) {
var u = new cc.Node("p" + d);
u.setContentSize(46, 66);
u.setPosition(50 * d - 50, 0);
h.addChild(u);
var g = u.addComponent(cc.Sprite);
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", l[d]);
g.sizeMode = cc.Sprite.SizeMode.CUSTOM;
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
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i || "btnQiangJin" == i) cc.vv.net.send("hu"); else {
if ("btnYouJin" == i) {
var n = cc.vv.gameNetMgr.curaction, a = n && n.youjin ? n.youjin : this._lastYoujin || [];
this._lastYoujin = a;
this.showYoujinPanel(a);
return;
}
if ("btnYouJinGo" == i) {
cc.vv.net.send("youjin_go");
this.hideOptions();
} else if ("btnGuo" == i) {
cc.vv.net.send("guo");
this.hideOptions();
}
}
} else this._chiSelect ? this.cancelChiSelect() : this.enterChiSelect(t.pai);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {} ],
MJGameZP: [ function(e, t) {
"use strict";
cc._RF.push(t, "363304bbn1JJoRak2CpGBov", "MJGameZP");
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
_huaAreas: [],
_youjinLabels: [],
_youjinPanel: null,
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
for (var n = [ "NoticeTip", "GameOverZP", "PengGangs", "MJRoom", "TimePointer", "GameResultZP", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
this.initView();
this.initEventHandlers();
this.gameRoot.active = !1;
this.prepareRoot.active = !0;
this.initWanfaLabel();
this.onGameBeign();
this.initCaishenTip();
cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("loading");
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
var g = u ? u.getChildByName("New Layout") : null;
if (g) {
var v = g.getComponent(cc.Button);
v && (v.enabled = !1);
g.active = !1;
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
var o = this;
this.node.on("game_start", function(e) {
o.onGameBeign(!0, e && e.detail);
o.initCaishenTip();
});
this.node.on("game_begin", function() {
o.onGameBeign();
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
o.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && o.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || o.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? o.initMahjongs(!0) : cc.vv.replayMgr.isReplay() && o.initMopai(e.seatIndex, t);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t), n = o._hupaiTips[i];
n.active = !0;
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
n.getChildByName("sprHu").active = !e.zimo;
n.getChildByName("sprZimo").active = !!e.zimo;
o.initMopai(t, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.mahjongmgr.playRandSFX(e.zimo ? "zimo" : "hu", e.zimo ? 2 : 3);
});
this.node.on("mj_count", function() {
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function() {
o.gameRoot.active = !1;
o.prepareRoot.active = !0;
o.hideChiPanel();
o.hideYoujinPanel();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
o.initHuaArea(t.si);
o._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
}
});
this.node.on("game_youjin", function(e) {
var t = e.detail;
t && o.showYoujinLevel(t.si, t.level);
});
this.node.on("game_fenbing", function(e) {
var t = e.detail;
if (t) {
var i = cc.vv.gameNetMgr.seats[t.si], n = i ? i.name : "" + t.si;
cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(n + " 分饼 " + t.score + " 分");
}
});
this.node.on("game_chupai_notify", function(e) {
o.hideChupai();
o.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? o.initMahjongs() : o.initOtherMahjongs(i);
o.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
o.playEfx(n, "play_peng");
cc.vv.mahjongmgr.playRandSFX("peng", 5);
o.hideOptions();
});
this.node.on("gang_notify", function(e) {
o.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var n = o.getLocalIndex(t.seatindex);
if ("wangang" == i) {
o.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
o.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
o.hideOptions();
});
this.node.on("chi_notify", function(e) {
o.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? o.initMahjongs(!1, t) : o.initOtherMahjongs(t);
var i = o.getLocalIndex(t.seatindex);
o.playEfx(i, "play_peng");
cc.vv.mahjongmgr.playRandSFX("chi", 4);
o.hideOptions();
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
cc.vv.utils.addClickEvent(t, this.node, "MJGameZP", "onOptionClicked");
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
cc.vv.utils.addClickEvent(t, this.node, "MJGameZP", "onOptionClicked");
t.active = !1;
return t;
},
getZpOpButton: function(e, t, i, n) {
var a = e.getChildByName(t);
if (a) {
if (!a._zpBound) {
a._zpBound = !0;
cc.vv.utils.addClickEvent(a, this.node, "MJGameZP", "onOptionClicked");
}
return a;
}
var o = e.getChildByName("btnPeng");
a = new cc.Node(t);
e.addChild(a);
if (o) {
a.setPosition(o.getPosition());
a.setContentSize(o.getContentSize());
a.scaleX = o.scaleX;
a.scaleY = o.scaleY;
}
var s = a.addComponent(cc.Sprite);
s.type = cc.Sprite.Type.SIMPLE;
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(a)) {
var i = a.getComponent(cc.Sprite);
i && (i.spriteFrame = t);
}
});
a.addComponent(cc.Button);
var c = new cc.Node("btnLabel");
a.addChild(c);
var r = c.addComponent(cc.Label);
r.string = i;
r.fontSize = n || 40;
r.lineHeight = r.fontSize;
r.overflow = cc.Label.Overflow.NONE;
r.enableWrapText = !1;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 255, 255);
c.setPosition(0, 0);
cc.vv.utils.addClickEvent(a, this.node, "MJGameZP", "onOptionClicked");
a.active = !1;
return a;
},
addZpOption: function(e, t, i, n) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var o = this._options.children[a];
if ("op" == o.name && 0 == o.active) {
o.active = !0;
o.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = null != i && i >= 0 ? cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", i) : null;
var s = this.getZpOpButton(o, e, t, n);
s.active = !0;
s.pai = i;
return;
}
}
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
this._options.active = !1;
for (var e = 0; e < this._options.childrenCount; ++e) {
var t = this._options.children[e];
if ("op" == t.name) {
t.active = !1;
t.getChildByName("btnPeng").active = !1;
t.getChildByName("btnGang").active = !1;
t.getChildByName("btnHu").active = !1;
var i = t.getChildByName("btnChi");
i && (i.active = !1);
var n = t.getChildByName("btnQiangJin");
n && (n.active = !1);
var a = t.getChildByName("btnYouJin");
a && (a.active = !1);
var o = t.getChildByName("btnYouJinGo");
o && (o.active = !1);
}
}
this.hideChiPanel();
this.cancelChiSelect();
this.hideYoujinPanel();
}
},
showAction: function(e) {
this._options.active && this.hideOptions();
var t = !!(e && e.youjin && e.youjin.length > 0);
if (e && (e.hu || e.gang || e.peng || e.chi || e.qiangjin || t || e.youjingo)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) for (var i = 0; i < e.gangpai.length; ++i) {
var n = e.gangpai[i];
this.addOption("btnGang", n);
}
e.chi && this.addChiOption(e.pai);
e.qiangjin && this.addZpOption("btnQiangJin", "抢金", e.pai, 32);
t && this.addZpOption("btnYouJin", "游金", e.pai);
e.youjingo && this.addZpOption("btnYouJinGo", "继续游金", e.pai, 28);
var a = this._options.getChildByName("btnGuo");
a && (a.active = !0);
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
var i = cc.vv.gameNetMgr.conf, n = null != i && null != i.caishen && i.caishen >= 0;
t.active = n;
if (n) {
var a = function(e, t) {
var i = e.getComponent(cc.Sprite);
i && (i.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t));
}, o = t.getChildByName("cs1");
if (o) {
o.active = !0;
a(o, i.caishen);
}
var s = t.getChildByName("cs2");
if (s) {
var c = null != i.caishen2 && i.caishen2 >= 0;
s.active = c;
c && a(s, i.caishen2);
}
}
}
}
},
_huaAreaPos: function(e) {
return "myself" == e ? cc.v2(-540, -230) : "up" == e ? cc.v2(430, 210) : "right" == e ? cc.v2(540, 40) : cc.v2(-540, 40);
},
getHuaArea: function(e) {
var t = cc.vv.gameNetMgr.getLocalIndex(e);
if (this._huaAreas[t] && cc.isValid(this._huaAreas[t])) return this._huaAreas[t];
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game") || this.node, a = new cc.Node("huaArea_" + i), o = this._huaAreaPos(i);
a.setPosition(o.x, o.y);
n.addChild(a);
this._huaAreas[t] = a;
return a;
},
initHuaArea: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[e] : null;
if (null != t) {
var i = this.getHuaArea(e);
i.removeAllChildren();
var n = t.hua || [];
if (0 != n.length) for (var a = cc.vv.mahjongmgr.bottomAtlas, o = 0; o < n.length; ++o) {
var s = n[o], c = new cc.Node("hua" + o);
c.setContentSize(44, 64);
c.setPosition(48 * o + 22, 0);
i.addChild(c);
var r = c.addComponent(cc.Sprite);
r.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var l = s - 34, h = l >= 0 && l < 8 ? "M_" + [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][l] : null, d = h ? a.getSpriteFrame(h) : null;
if (null != d) r.spriteFrame = d; else {
var u = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
r.spriteFrame = u;
var g = new cc.Node("name");
c.addChild(g);
var v = g.addComponent(cc.Label);
v.string = l >= 0 && l < 8 ? [ "梅", "兰", "竹", "菊", "春", "夏", "秋", "冬" ][l] : "花";
v.fontSize = 26;
v.lineHeight = 28;
v.overflow = cc.Label.Overflow.NONE;
v.enableWrapText = !1;
v.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.verticalAlign = cc.Label.VerticalAlign.CENTER;
g.color = cc.color(220, 40, 40);
g.setPosition(0, 0);
}
}
}
},
initAllHuaAreas: function() {
var e = cc.vv.gameNetMgr.seats;
if (e) for (var t = 0; t < e.length; ++t) {
this.initHuaArea(t);
this.showYoujinLevel(t, e[t].youjinLevel || 0);
}
},
showYoujinLevel: function(e, t) {
var i = cc.vv.gameNetMgr.getLocalIndex(e), n = this._youjinLabels[i];
if (!n || !cc.isValid(n)) {
var a = cc.vv.mahjongmgr.getSide(i), o = this.getHuaArea(e);
n = new cc.Node("youjin_" + a);
o.parent.addChild(n);
var s = n.addComponent(cc.Label);
s.fontSize = 30;
s.lineHeight = 34;
s.overflow = cc.Label.Overflow.NONE;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
n.color = cc.color(255, 90, 90);
var c = n.addComponent(cc.LabelOutline);
c.color = cc.color(80, 0, 0);
c.width = 2;
this._youjinLabels[i] = n;
}
var r = this.getHuaArea(e);
n.setPosition(r.x, r.y + 80);
if (t > 0) {
n.active = !0;
n.getComponent(cc.Label).string = [ "", "单游", "双游", "三游" ][t] || t + "游";
} else n.active = !1;
},
showYoujinPanel: function(e) {
this.hideYoujinPanel();
if (e && 0 != e.length) {
var t = this.node.getChildByName("game");
null == t && (t = this.node);
var i = 40 + 62 * e.length + 16 * (e.length - 1), n = new cc.Node("youjinPanel");
n.setContentSize(i, 146);
n.setPosition(0, -30);
t.addChild(n);
var a = new cc.Node("bg");
a.setContentSize(i, 146);
n.addChild(a);
var o = a.addComponent(cc.Graphics);
o.fillColor = cc.color(18, 18, 24, 235);
o.strokeColor = cc.color(255, 200, 90, 255);
o.lineWidth = 3;
o.rect(-i / 2, -73, i, 146);
o.fill();
o.stroke();
var s = new cc.Node("cap");
s.setContentSize(i, 28);
s.setPosition(0, 49);
n.addChild(s);
var c = s.addComponent(cc.Label);
c.string = "选择一张牌宣告游金";
c.fontSize = 22;
c.lineHeight = 28;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = cc.color(255, 225, 150);
for (var r = 0; r < e.length; ++r) {
var l = new cc.Node("yjItem" + r);
l.setContentSize(62, 90);
l.setPosition(51 + -i / 2 + 78 * r, -14);
n.addChild(l);
l.addComponent(cc.Button);
l.pai = e[r];
cc.vv.utils.addClickEvent(l, this.node, "MJGameZP", "onYoujinItemClicked");
var h = l.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[r]);
h.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
this._youjinPanel = n;
}
},
hideYoujinPanel: function() {
this._youjinPanel && cc.isValid(this._youjinPanel) && this._youjinPanel.destroy();
this._youjinPanel = null;
},
onYoujinItemClicked: function(e) {
var t = e.target.pai;
null != t && cc.vv.net.send("youjin", t);
this.hideYoujinPanel();
this.hideOptions();
},
playEfx: function(e, t) {
var i = this._playEfxs[e];
i.node.active = !0;
i.play(t);
("play_hu" == t || "play_zimo" == t) && cc.vv && cc.vv.mahjongmgr && cc.vv.mahjongmgr.playHuSpine(i.node, "play_zimo" == t);
},
onGameBeign: function(e) {
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
var s = this.node.getChildByName("game"), c = s.getChildByName("huanpaiinfo");
null != c && (c.active = !1);
var r = [ "right", "up", "left" ];
for (t = 0; t < r.length; ++t) {
var l = s.getChildByName(r[t]);
if (null != l) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) l.active = !1; else {
l.active = !0;
var h = l.getChildByName("holds");
for (i = 0; i < h.childrenCount; ++i) h.children[i].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var d = cc.vv.gameNetMgr.seats;
for (var t in d) {
n = d[t];
if (0 != (a = cc.vv.gameNetMgr.getLocalIndex(t))) {
this.initOtherMahjongs(n);
t == cc.vv.gameNetMgr.turn ? this.initMopai(t, -1) : this.initMopai(t, null);
}
}
this.initAllHuaAreas();
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
var u = cc.vv.mahjongmgr.getSide(d), g = r ? r.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var m = [], f = 0; f < v.childrenCount; ++f) {
var _ = v.children[f];
_.active && m.push(_);
}
n(m, v, "up" == u ? function(e, t) {
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
var p = this._dealAnimId, C = this;
this.scheduleOnce(function() {
if (C._dealAnimId == p) {
C._dealAnimating = !1;
C._dealAnimNodes = null;
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
btnChi: 1,
btnQiangJin: 1,
btnYouJin: 1,
btnYouJinGo: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
onMJClicked: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect) {
var t = this._findMJNode(e);
if (null == t || null == t.mjId) return;
for (var i = 0; i < this._myMJArr.length; ++i) if (t == this._myMJArr[i].node) {
var n = this._chiSelect.tiles, a = n.indexOf(t);
if (-1 != a) {
n.splice(a, 1);
t.y = 0;
return;
}
if (n.length >= 2) return;
n.push(t);
t.y = 15;
if (2 == n.length) {
var o = n[0].mjId, s = n[1].mjId, c = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ o, s, c ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var r = this._findMJNode(e);
if (null != r) for (var l = 0; l < this._myMJArr.length; ++l) if (r == this._myMJArr[l].node) {
if (r == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._selectedMJ.y = 0;
this._selectedMJ = null;
return;
}
null != this._selectedMJ && (this._selectedMJ.y = 0);
r.y = 15;
this._selectedMJ = r;
return;
}
} else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && cc.vv.net.send("chupai", e);
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
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (r = c; r < c + g; ++r) {
l = this.getMJIndex(i, r);
var v = o.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, o, c + g);
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
for (var g = 0; g < l.length; ++g) i.push(l[g]);
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
for (var d = cc.vv.gameNetMgr.conf, u = d ? d.caishen : -1, g = d ? d.caishen2 : -1, v = [], m = 0; m < n.length; ++m) {
var f = n[m];
if (null == (C = this._myMJArr[m + s]) || null == C.node) {
v.push("SLOT_" + (m + s) + "=NULL");
break;
}
C.node.mjId = f;
C.node.y = 0;
var _ = r && m == n.length - 1;
c > 0 && (C.node.x = h + m * c + (_ ? a : 0));
this.setSpriteFrameByMJID("M_", C, f);
var p = u >= 0 && f == u || null != g && g >= 0 && f == g;
C.node.color = p ? cc.color(255, 200, 90) : cc.Color.WHITE;
v.push("SLOT_" + (m + s) + "=" + f);
}
console.log("[initMahjongs] render:", v.join("|"));
for (m = 0; m < s; ++m) if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
}
for (m = s + n.length; m < this._myMJArr.length; ++m) {
var C;
if (null != (C = this._myMJArr[m]) && null != C.node) {
C.node.mjId = null;
C.spriteFrame = null;
C.node.active = !1;
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
cc.vv.utils.addClickEvent(h, this.node, "MJGameZP", "onChiItemClicked");
for (var d = 0; d < l.length; ++d) {
var u = new cc.Node("p" + d);
u.setContentSize(46, 66);
u.setPosition(50 * d - 50, 0);
h.addChild(u);
var g = u.addComponent(cc.Sprite);
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", l[d]);
g.sizeMode = cc.Sprite.SizeMode.CUSTOM;
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
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i || "btnQiangJin" == i) cc.vv.net.send("hu"); else {
if ("btnYouJin" == i) {
var n = cc.vv.gameNetMgr.curaction, a = n && n.youjin ? n.youjin : this._lastYoujin || [];
this._lastYoujin = a;
this.showYoujinPanel(a);
return;
}
if ("btnYouJinGo" == i) {
cc.vv.net.send("youjin_go");
this.hideOptions();
} else if ("btnGuo" == i) {
cc.vv.net.send("guo");
this.hideOptions();
}
}
} else this._chiSelect ? this.cancelChiSelect() : this.enterChiSelect(t.pai);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
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
var g = u[h];
this.initPengAndGangs(l, o, s, d, g, "angang");
d++;
}
for (u = e.diangangs || [], h = 0; h < u.length; ++h) {
g = u[h];
this.initPengAndGangs(l, o, s, d, g, "diangang");
d++;
}
for (u = e.wangangs || [], h = 0; h < u.length; ++h) {
g = u[h];
this.initPengAndGangs(l, o, s, d, g, "wangang");
d++;
}
var v = e.pengs || [];
for (h = 0; h < v.length; ++h) {
g = v[h];
var m = e.pengTiles && e.pengTiles[h] || null;
this.initPengAndGangs(l, o, s, d, g, "peng", m);
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
var g = "peng" == o && s && l < s.length ? s[l] : a;
d.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(i, g);
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
[ "admin", "zhanjiWin", "recordWin", "memLogWin", "alert" ].forEach(function(t) {
var i = e.getChildByName(t);
i && (i.active = !1);
});
var i = e.getChildByName("clubPage"), n = e.getChildByName("wfPage");
if (cc.vv.fromClubId) {
i && (i.active = !1);
n && (n.active = !1);
this._clubBackToDetail(cc.vv.fromClubId);
} else {
i && (i.active = !1);
n && (n.active = !1);
this._clubAutoEnter();
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
if (i && n) i.spriteFrame = n; else {
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
var h = -o / 2 + 20, d = 26, u = 0, g = cc.Label.HorizontalAlign.LEFT;
if (s) {
h = 0;
d = 24;
u = .5;
g = cc.Label.HorizontalAlign.CENTER;
var v = new cc.Node("bgimg");
v.setContentSize(o, 68);
r.addChild(v);
var m = v.addComponent(cc.Sprite);
m.sizeMode = cc.Sprite.SizeMode.CUSTOM;
m.type = cc.Sprite.Type.SIMPLE;
r._iconSp = m;
c._loadAtlasFrame("images/atlas/hall_ui", "club_game.png", function(e) {
if (e && cc.isValid(v)) {
r._iconNormal = e;
if (!r._selected || !r._iconSel) {
m.spriteFrame = e;
v.setContentSize(o, 68);
}
}
});
c._loadAtlasFrame("images/atlas/hall_ui", "club_game_on.png", function(e) {
if (e && cc.isValid(v)) {
r._iconSel = e;
if (r._selected) {
m.spriteFrame = e;
v.setContentSize(o, 68);
}
}
});
}
var f = new cc.Node("l");
f.anchorX = u;
f.setContentSize(.5 === u ? o : o - (h + o / 2) - 70, 68);
f.setPosition(h, 0);
r.addChild(f);
var _ = f.addComponent(cc.Label);
_.string = i;
_.fontSize = d;
_.lineHeight = 68;
_.horizontalAlign = g;
_.verticalAlign = cc.Label.VerticalAlign.CENTER;
_.overflow = cc.Label.Overflow.NONE;
f.color = cc.color(0, 0, 0);
if (null != n && "" != n) {
var p = new cc.Node("s");
p.anchorX = 1;
p.setContentSize(100, 68);
p.setPosition(o / 2 - 20, 0);
r.addChild(p);
var C = p.addComponent(cc.Label);
C.string = n;
C.fontSize = 24;
C.lineHeight = 68;
C.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
C.verticalAlign = cc.Label.VerticalAlign.CENTER;
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
var u = 0, g = 0;
s.on(cc.Node.EventType.TOUCH_START, function(e) {
u = e.getLocation().y;
g = a._clubScroll && a._clubScroll.content ? a._clubScroll.content.y : 0;
a._clubScrollMoved = !1;
});
s.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
var t = a._clubScroll;
if (t && t.content && !(t.content.height <= t.vh)) {
var i = e.getLocation().y - u;
Math.abs(i) > 6 && (a._clubScrollMoved = !0);
var n = (t.vh - t.content.height) / 2, o = (t.content.height - t.vh) / 2;
t.content.y = Math.max(n, Math.min(o, g + i));
}
});
s.on(cc.Node.EventType.TOUCH_CANCEL, function() {
a._clubScrollMoved = !1;
});
}
return c;
}
var v = new cc.Node("box");
v.setContentSize(t, i);
e.addChild(v);
var m = new cc.Node("bg");
m.setContentSize(t, i);
v.addChild(m);
var f = m.addComponent(cc.Sprite);
f.sizeMode = cc.Sprite.SizeMode.CUSTOM;
this._clubLoadBg4(function(e) {
if (e) {
f.spriteFrame = e;
f.type = cc.Sprite.Type.SLICED;
}
});
var _ = t - 44, p = i - 44, C = new cc.Node("view");
C.setContentSize(_, p);
v.addChild(C);
var b = C.addComponent(cc.Mask);
cc.Mask.Type && null != cc.Mask.Type.RECT && (b.type = cc.Mask.Type.RECT);
var y = new cc.Node("content");
y.setContentSize(_, Math.max(p, n));
y.setPosition(0, (p - y.height) / 2);
C.addChild(y);
this._clubScroll = {
view: C,
content: y,
vw: _,
vh: p
};
var N = 0, S = 0;
C.on(cc.Node.EventType.TOUCH_START, function(e) {
N = e.getLocation().y;
S = y.y;
a._clubScrollMoved = !1;
});
C.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
if (!(y.height <= p)) {
var t = e.getLocation().y - N;
Math.abs(t) > 6 && (a._clubScrollMoved = !0);
var i = (p - y.height) / 2, n = (y.height - p) / 2;
y.y = Math.max(i, Math.min(n, S + t));
}
});
C.on(cc.Node.EventType.TOUCH_CANCEL, function() {
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
var i = [];
[ "samptext", "gameRowTpl", "sampleRow0", "sampleRow1", "sampleRow2", "allRow", "emptyTip" ].forEach(function(e) {
var n = t.getChildByName(e);
n && i.push(n);
});
t.removeAllChildren();
i.forEach(function(e) {
t.addChild(e);
"emptyTip" === e.name && (e.active = !1);
});
}
var n = this._clubFind(this._clubListArea, "tablesView"), a = n ? n.getChildByName("tables") : null;
a && a.removeAllChildren();
var o = this._clubFind(this._clubListArea, "box"), s = o ? o.getChildByName("view") : null, c = s ? s.getChildByName("content") : null;
if (c) {
var r = c.getChildByName("rowTpl"), l = c.getChildByName("emptyTip");
c.removeAllChildren();
r && c.addChild(r);
if (l) {
c.addChild(l);
l.active = !1;
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
_clubAutoEnter: function() {
var e = this;
cc.vv.http.sendRequest("/club_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(t) {
if (cc.isValid(e.node)) if (0 === t.errcode) {
var i = t.clubs || [];
e._myClubs = i;
if (0 === i.length) {
var n = cc.find("Canvas/clubPage");
n && (n.active = !0);
e.openClubPanel();
} else e._wfOpenDetail(i[0]);
} else {
var a = cc.find("Canvas/clubPage");
a && (a.active = !0);
e.openClubPanel();
}
});
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
var e = cc.find("Canvas");
if (e) {
var t = e.getChildByName("zhanjiWin");
t && (t.active = !1);
var i = e.getChildByName("recordWin");
i && (i.active = !1);
}
this._admPanel && cc.isValid(this._admPanel) && (this._admPanel.active = !1);
var n = this._wfSaved;
this._wfPanel && cc.isValid(this._wfPanel) && (this._wfBaked ? this._wfPanel.active = !1 : this._wfPanel.destroy());
this._wfBaked = !1;
this._wfPanel = null;
this._clubDetailBgNode = null;
this._clubDetailFullBg = null;
this._clubBackBtn = null;
this._clubTablesNode = null;
this._clubGameRows = null;
if (n) {
this._clubPanel = n.panel;
this._clubListArea = n.area;
this._clubCloseBtn = n.closeBtn;
this._clubBaked = n.baked;
this._wfSaved = null;
}
this._clubState = null;
},
_wfBindAddTable: function(e) {
var t = this, i = this._wfPanel;
if (i) {
var n = !!(e && cc.vv.userMgr && cc.vv.userMgr.userId && String(e.owner_userid) === String(cc.vv.userMgr.userId));
this._admGame = null;
var a = i.getChildByName("boot"), o = (a ? a.getChildByName("glSprite") : null) || i.getChildByName("glSprite") || this._clubFind(i, "glSprite");
if (o) {
o.active = n;
if (!o._admBound) {
o._admBound = !0;
o.on(cc.Node.EventType.TOUCH_END, function() {
t._admOpen();
});
}
}
var s = i.getChildByName("KsSprite");
if (s && !s._wfBound) {
s._wfBound = !0;
s.on(cc.Node.EventType.TOUCH_END, function() {
t._wfQuickJoin();
});
}
var c = i.getChildByName("KsSprite01") || this._clubFind(i, "KsSprite01");
if (c && !c._wfRefreshBound) {
c._wfRefreshBound = !0;
c.active = !0;
c.on(cc.Node.EventType.TOUCH_END, function() {
t._clubTablesSig = null;
t._clubLoadTables();
});
}
var r = i.getChildByName("Sprite1") || (a ? a.getChildByName("Sprite1") : null) || this._clubFind(i, "Sprite1");
if (r && !r._wfRecBound) {
r._wfRecBound = !0;
r.on(cc.Node.EventType.TOUCH_END, function() {
t._wfOpenBeanLog();
});
}
var l = i.getChildByName("Sprite2") || (a ? a.getChildByName("Sprite2") : null) || this._clubFind(i, "Sprite2");
if (l && !l._wfZjBound) {
l._wfZjBound = !0;
l.on(cc.Node.EventType.TOUCH_END, function() {
t._wfOpenZhanji();
});
}
}
},
_wfPopupOpen: function(e) {
var t = cc.find("Canvas");
if (!t) return null;
var i = t.getChildByName(e);
if (!i) {
console.log("[俱乐部]场景缺少弹窗:" + e);
return null;
}
i.active = !0;
i.setSiblingIndex(t.children.length - 1);
var n = t.getChildByName("alert");
n && n.setSiblingIndex(t.children.length - 1);
var a = t.getChildByName("WaitingConnection");
a && a.setSiblingIndex(t.children.length - 1);
if (!i._wfPopupBound) {
i._wfPopupBound = !0;
i.on(cc.Node.EventType.TOUCH_START, function() {});
var o = this._clubFind(i, "btn_cancel");
o && o.on(cc.Node.EventType.TOUCH_END, function() {
i.active = !1;
});
}
this._wfPopupMakeScrollable(i);
return i;
},
_wfPopupList: function(e) {
var t = this._clubFind(e, "list"), i = t ? t.getChildByName("content") : null, n = i ? i.getChildByName("rowTpl") : t ? this._clubFind(t, "rowTpl") : null;
return {
list: t,
content: i,
tpl: n
};
},
_wfPopupMakeScrollable: function(e) {
var t = this._wfPopupList(e), i = t.list, n = t.tpl;
if (i && !i._wfScrolled) {
i._wfViewH = i.height;
if (t.content) {
i._wfScrolled = !0;
i._wfScroll = i.getComponent(cc.ScrollView);
} else {
i._wfScrolled = !0;
var a = i.getPosition(), o = i.getSiblingIndex(), s = i.getContentSize(), c = Math.max(s.width, n ? n.width : 0);
i._wfViewH = s.height;
var r = new cc.Node("sv");
r.setContentSize(c, s.height);
r.setPosition(a);
p.addChild(r);
r.setSiblingIndex(o);
var l = new cc.Node("view");
l.setContentSize(c, s.height);
r.addChild(l);
l.addComponent(cc.Mask).type = cc.Mask.Type.RECT;
var h = r.addComponent(cc.ScrollView);
h.horizontal = !1;
h.vertical = !0;
h.inertia = !0;
h.brake = .75;
i.parent = l;
i.setAnchorPoint(.5, 1);
i.setPosition(0, s.height / 2);
h.content = i;
i._wfScroll = h;
}
}
},
_wfPopupClearRows: function(e, t) {
if (e) {
for (var i = e.getChildByName("content") || e, n = i.children.slice(), a = 0; a < n.length; ++a) if (n[a] !== t) {
n[a].removeFromParent();
n[a].destroy();
}
t && (t.active = !1);
if (e._wfViewH) {
if (e._wfScroll) {
e._wfScroll.stopAutoScroll();
e._wfScroll.scrollToTop(0);
}
i.height = e._wfViewH;
i.setPosition(0, e._wfViewH / 2);
}
}
},
_wfPopupAddRow: function(e, t, i, n) {
if (!e || !t) return null;
var a, o = e.getChildByName("content") || e, s = t.height || 36, c = s + 2;
if (e._wfViewH) {
var r = (i + 1) * c;
o.height < r && (o.height = r);
a = -s / 2 - i * c;
} else {
if (i >= 8) return null;
a = (o.height || 330) / 2 - s / 2 - i * c;
}
var l = cc.instantiate(t);
l.active = !0;
l.setPosition(0, a);
o.addChild(l);
for (var h = 0; h < n.length; ++h) {
var d = l.getChildByName("c" + h), u = d ? d.getComponent(cc.Label) : null;
u && (u.string = null == n[h] ? "-" : String(n[h]));
}
return l;
},
_wfBindDetail: function(e, t, i) {
var n = this, a = e ? e.getChildByName("detailBtn") : null;
if (a) {
a.off(cc.Node.EventType.TOUCH_END);
a.on(cc.Node.EventType.TOUCH_END, function(e) {
e && e.stopPropagation && e.stopPropagation();
n._wfOpenReplay(t, i);
});
}
},
_wfOpenReplay: function(e, t) {
var i = this;
if (e && t) {
if (!this._wfReplayLoading) {
this._wfReplayLoading = !0;
cc.vv.http.sendRequest("/get_replay", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
uuid: e,
index: t
}, function(e) {
i._wfReplayLoading = !1;
if (0 === e.errcode) {
var t = e.replay;
if (t && t.events && t.events.length) {
cc.vv.bbReplayData = t;
var n = String(t.type || ""), a = cc.vv.gameNetMgr.sceneForType(n);
cc.director.loadScene(a);
} else cc.vv.wc.showError("该局没有录像，无法回放");
} else {
var o = 1 === e.errcode ? "该局录像已过期" : 2 === e.errcode ? "没有该局回放权限" : e.errmsg || "获取回放失败";
cc.vv.wc.showError(o);
}
});
}
} else cc.vv.wc.showError("该局没有录像，无法回放");
},
_wfPopupSetLabel: function(e, t, i) {
var n = this._clubFind(e, t), a = n ? n.getComponent(cc.Label) : null;
a && (a.string = i);
},
_wfPopupTime: function(e) {
var t = new Date(1e3 * (e || 0));
function i(e) {
return e < 10 ? "0" + e : "" + e;
}
return i(t.getMonth() + 1) + "-" + i(t.getDate()) + " " + i(t.getHours()) + ":" + i(t.getMinutes());
},
_wfGameName: function(e) {
var t = String(e || "");
return 0 === t.indexOf("baobao_mian") ? "六宝免摆" : 0 === t.indexOf("baobao_shou") ? "六宝手动" : 0 === t.indexOf("baobao") ? "六宝" : t || "-";
},
_wfOpenZhanji: function() {
var e = this, t = this._wfPopupOpen("zhanjiWin");
if (t) {
var i = t._wfSeq = (t._wfSeq || 0) + 1, n = this._wfPopupList(t);
this._wfPopupClearRows(n.list, n.tpl);
this._wfPopupSetLabel(t, "sum1", "牌局数：0");
this._wfPopupSetLabel(t, "sum2", "大赢家：-");
this._wfPopupSetLabel(t, "sum3", "分数：-");
var a = this._clubFind(t, "emptyTip");
a && (a.active = !1);
cc.vv.http.sendRequest("/get_replay_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(o) {
if (cc.isValid(t) && t.active && t._wfSeq === i) if (0 === o.errcode) {
for (var s = o.list || [], c = 0, r = 0; r < s.length; ++r) c += (s[r].games || []).length;
e._wfPopupSetLabel(t, "sum1", "牌局数：" + c);
for (var l = 0, h = 0; h < s.length; ++h) for (var d = s[h], u = d.games || [], g = 0; g < u.length; ++g) {
var v = u[g], m = e._wfPopupAddRow(n.list, n.tpl, l, [ l + 1, e._wfGameName(d.type), "-", e._wfPopupTime(v.create_time), "-", d.roomid, v.index, "-", "-" ]), f = 0 === String(d.type || "").indexOf("baobao");
m && e._wfBindDetail(m, f && d.uuid || "", f && v.index || 0);
l++;
}
a && cc.isValid(a) && (a.active = 0 == l);
} else cc.vv.wc.showError(o.errmsg || "获取战绩失败");
});
}
},
_wfOpenBeanLog: function() {
var e = this, t = this._wfPopupOpen("recordWin");
if (t) {
var i = this._clubFind(t, "todayBtn"), n = this._clubFind(t, "allBtn");
if (i && !i._wfBound) {
i._wfBound = !0;
i.on(cc.Node.EventType.TOUCH_END, function() {
e._wfLoadBeanLog(t, !0);
});
}
if (n && !n._wfBound) {
n._wfBound = !0;
n.on(cc.Node.EventType.TOUCH_END, function() {
e._wfLoadBeanLog(t, !1);
});
}
this._wfLoadBeanLog(t, !0);
}
},
_wfLoadBeanLog: function(e, t) {
var i = this;
if (e && cc.isValid(e)) {
var n = this._wfPopupList(e);
this._wfPopupClearRows(n.list, n.tpl);
var a = this._clubFind(e, "todayBtn"), o = this._clubFind(e, "allBtn");
a && (a.color = cc.color(t ? 255 : 245, t ? 200 : 240, t ? 90 : 230));
o && (o.color = cc.color(t ? 245 : 255, t ? 240 : 200, t ? 230 : 90));
var s = this._clubFind(e, "emptyTip");
s && (s.active = !1);
var c = 0;
if (t) {
var r = new Date();
r.setHours(0, 0, 0, 0);
c = Math.floor(r.getTime() / 1e3);
}
var l = e._wfLogSeq = (e._wfLogSeq || 0) + 1;
cc.vv.http.sendRequest("/my_bean_logs", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
from: c
}, function(t) {
if (cc.isValid(e) && e.active && e._wfLogSeq === l) if (0 === t.errcode) {
for (var a = t.logs || [], o = 0; o < a.length; ++o) {
var c = a[o], r = parseInt(c.amount) || 0, h = i._wfPopupAddRow(n.list, n.tpl, o, [ i._wfPopupTime(c.create_time), c.roomid || "-", i._wfGameName(c.game_type), c.change_type || "-", r > 0 ? "+" + r : String(r), "-" ]), d = 0 === String(c.game_type || "").indexOf("baobao");
h && i._wfBindDetail(h, d && c.room_uuid || "", d && parseInt(c.game_index) || 0);
}
s && cc.isValid(s) && (s.active = 0 == a.length);
} else cc.vv.wc.showError(t.errmsg || "获取乐豆记录失败");
});
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
var c = function(t, i, n) {
var a = e._admNode(t), o = a ? a.getChildByName(i) : null, s = o ? o.getComponent(cc.Label) : null;
console.log("[adm]fill", t, "clubCur=" + !!e._clubCur, "node=" + !!a, "child=" + !!o, "label=" + !!s, "value=" + n);
s && (s.string = String(n));
};
if (e._clubCur) {
c("JLBname", "JLBname-a", e._clubCur.name || "");
c("JLBid", "JLBid-a", e._clubCur.id);
}
e._admShowPage("member");
if (!i._admBound) {
i._admBound = !0;
var r = e._admNode("btnAddTable"), l = e._admNode("adminuser") || e._admNode("addTablePz"), h = e._admNode("btnBean"), d = e._admNode("btnAdmClose");
if (r) {
r.active = !0;
r.on(cc.Node.EventType.TOUCH_END, function() {
e._admShowPage("table");
});
}
if (l) {
l.active = !0;
l.on(cc.Node.EventType.TOUCH_END, function() {
e._admShowPage("member");
});
}
if (h) {
h.active = !0;
h.on(cc.Node.EventType.TOUCH_END, function() {
e._admShowPage("bean");
});
}
if (d) {
d.active = !0;
d.on(cc.Node.EventType.TOUCH_END, function() {
e._admClose();
});
}
var u = e._admNode("ropSprite"), g = function(e) {
return u ? u.getChildByName(e) : null;
}, v = g("memberPage");
if (v) {
var m = v.getChildByName("btnAddMember");
m && m.on(cc.Node.EventType.TOUCH_END, function() {
e._wfOpenPull();
});
var f = v.getChildByName("btnSearch");
f && f.on(cc.Node.EventType.TOUCH_END, function() {
e._admRenderMembers();
});
var _ = v.getChildByName("searchInput"), p = _ ? _.getComponent(cc.EditBox) : null;
p && (p.inputFlag = 3);
}
var C = g("tablePage");
if (C) {
var b = C.getChildByName("btnAddTable2");
b && b.on(cc.Node.EventType.TOUCH_END, function() {
e._wfOpenAddTable();
});
}
var y = g("beanPage");
if (y) {
var N = y.getChildByName("btnBean2");
N && N.on(cc.Node.EventType.TOUCH_END, function() {
e._admOpenBean();
});
}
var S = g("subPage");
if (S) {
var M = S.getChildByName("btnSubAdd");
M && M.on(cc.Node.EventType.TOUCH_END, function() {
e._admOpenNewClub();
});
}
var B = e._admNode("addTableWin");
this._admAddWin = B;
B && e._admBindOkCancel(B, function() {
e._wfSubmitAddTable();
}, function() {
e._wfCloseAddTable();
});
var w = e._admNode("admMemberWin");
this._admMemberWin = w;
w && e._admBindOkCancel(w, function() {
e._wfSubmitPull();
}, function() {
e._wfClosePull();
});
var A = e._admNode("admBeanWin");
this._admBeanWin = A;
if (A) {
var x = A.getChildByName("bg"), T = x ? x.getChildByName("btnQuery") : null;
if (T) {
T.active = !0;
T.on(cc.Node.EventType.TOUCH_END, function() {
e._admQueryBean();
});
}
e._admBindOkCancel(A, function() {
e._admApplyBean();
}, function() {
e._wfCloseBean();
});
}
var I = e._admNode("btnGameCfg");
if (I) {
I.active = !0;
I.on(cc.Node.EventType.TOUCH_END, function() {
e._admOpenGameCfg();
});
}
var P = e._admNode("gameCfgWin");
this._admCfgWin = P;
P && e._admBindOkCancel(P, function() {
e._admCfgSave();
}, function() {
e._admCfgClose();
});
var L = e._admNode("btnNewClub");
if (L) {
L.active = !0;
L.on(cc.Node.EventType.TOUCH_END, function() {
e._admShowPage("sub");
});
}
var R = e._admNode("newClubWin");
this._admNewClubWin = R;
R && e._admBindOkCancel(R, function() {
e._admSubmitNewClub();
}, function() {
e._admCloseNewClub();
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
this._admNewClubWin && cc.isValid(this._admNewClubWin) && (this._admNewClubWin.active = !1);
},
_admPageNode: function(e) {
var t = this._admNode("ropSprite");
return t ? t.getChildByName(e) : null;
},
_admShowPage: function(e) {
for (var t = [ "member", "table", "bean", "sub" ], i = 0; i < t.length; ++i) {
var n = this._admPageNode(t[i] + "Page");
n && (n.active = t[i] === e);
}
this._admPage = e;
"member" === e ? this._admLoadMembers() : "table" === e ? this._admLoadTablesAdm() : "bean" === e ? this._admLoadBeanLogs() : "sub" === e && this._admLoadSubs();
},
_admPageList: function(e) {
var t = this._admPageNode(e), i = t ? t.getChildByName("scroll") : null, n = i ? i.getChildByName("view") : null, a = n ? n.getChildByName("content") : null, o = a ? a.getChildByName("rowTpl") : null, s = t ? t.getChildByName("emptyTip") : null;
return {
page: t,
scroll: i,
view: n,
content: a,
tpl: o,
tip: s
};
},
_admClearRows: function(e, t) {
if (e) {
for (var i = e.children.slice(), n = 0; n < i.length; ++n) if (i[n] !== t) {
i[n].removeFromParent();
i[n].destroy();
}
t && (t.active = !1);
}
},
_admAddRow: function(e, t, i) {
var n = e.content, a = e.tpl;
if (!n || !a) return null;
var o = e.view ? e.view.height : 500;
n.height = Math.max(o, (t + 1) * i);
var s = cc.instantiate(a);
s.active = !0;
s.setPosition(0, -(t * i + i / 2));
n.addChild(s);
return s;
},
_admSetRowText: function(e, t, i) {
var n = e.getChildByName(t), a = n ? n.getComponent(cc.Label) : null;
a && (a.string = null == i || "" === i ? "-" : String(i));
},
_admScrollTop: function(e) {
var t = e.scroll ? e.scroll.getComponent(cc.ScrollView) : null;
t && t.scrollToTop();
},
_admLoadMembers: function() {
var e = this;
this._clubCur && this._clubCur.id && cc.vv.http.sendRequest("/club_members_detail", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: this._clubCur.id
}, function(t) {
if (t && 0 === t.errcode) {
e._admMembers = t.members || [];
e._admRenderMembers();
} else cc.vv.wc.showError(t && t.errmsg || "获取成员失败");
});
},
_admRenderMembers: function() {
var e = this, t = this._admPageList("memberPage");
if (t.content && t.tpl) {
var i = "", n = t.page ? t.page.getChildByName("searchInput") : null, a = n ? n.getComponent(cc.EditBox) : null;
a && (i = String(a.string || "").replace(/[^0-9]/g, ""));
var o = this._admMembers || [];
i && (o = o.filter(function(e) {
return String(e.userid).indexOf(i) >= 0;
}));
this._admClearRows(t.content, t.tpl);
t.tip && (t.tip.active = 0 === o.length);
var s = t.tpl.height || 70;
o.forEach(function(i, n) {
var a = e._admAddRow(t, n, s + 4);
if (a) {
e._admSetRowText(a, "lName", i.name);
e._admSetRowText(a, "lId", i.userid);
e._admSetRowText(a, "lGems", i.gems);
var o = a.getChildByName("avatar");
if (o) {
var c = o.getComponent(cc.Sprite);
c && (e._clubHeadFrame ? c.spriteFrame = e._clubHeadFrame : cc.resources.load("images/other/head", cc.SpriteFrame, function(t, i) {
if (!t && i) {
e._clubHeadFrame = i;
cc.isValid(c) && (c.spriteFrame = i);
}
}));
var r = o.getComponent("ImageLoader");
r || (r = o.addComponent("ImageLoader"));
r && r.setUserID && r.setUserID(i.userid);
}
var l = i.userid, h = a.getChildByName("btnBeanM");
h && h.on(cc.Node.EventType.TOUCH_END, function() {
e._admOpenBeanFor(l);
});
var d = a.getChildByName("btnLogsM");
d && d.on(cc.Node.EventType.TOUCH_END, function() {
e._admOpenMemLogs(l);
});
}
});
this._admScrollTop(t);
}
},
_admOpenBeanFor: function(e) {
this._admOpenBean();
var t = this._admBeanWin, i = t ? t.getChildByName("bg") : null, n = i ? i.getChildByName("difenInput") : null, a = n ? n.getComponent(cc.EditBox) : null;
if (a) {
a.string = String(e);
this._admQueryBean();
}
},
_admOpenMemLogs: function(e) {
var t = this, i = this._wfPopupOpen("memLogWin");
if (i) {
this._wfPopupSetLabel(i, "title", "交易明细(ID:" + e + ")");
var n = this._wfPopupList(i);
this._wfPopupClearRows(n.list, n.tpl);
var a = this._clubFind(i, "emptyTip");
a && (a.active = !1);
var o = this._clubFind(i, "todayBtn");
o && (o.active = !1);
var s = this._clubFind(i, "allBtn");
s && (s.active = !1);
var c = i._wfLogSeq = (i._wfLogSeq || 0) + 1;
cc.vv.http.sendRequest("/club_member_logs", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: this._clubCur.id,
userid: e
}, function(e) {
if (cc.isValid(i) && i.active && i._wfLogSeq === c) if (0 === e.errcode) {
for (var o = e.logs || [], s = 0; s < o.length; ++s) {
var r = o[s], l = parseInt(r.amount) || 0;
t._wfPopupAddRow(n.list, n.tpl, s, [ t._wfPopupTime(r.create_time), r.roomid || "-", t._wfGameName(r.game_type), r.change_type || "-", l > 0 ? "+" + l : String(l), "-" ]);
}
a && cc.isValid(a) && (a.active = 0 == o.length);
} else cc.vv.wc.showError(e.errmsg || "获取交易明细失败");
});
}
},
_admLoadTablesAdm: function() {
var e = this;
this._clubCur && this._clubCur.id && cc.vv.http.sendRequest("/club_tables", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: this._clubCur.id
}, function(t) {
if (t && 0 === t.errcode) {
var i = e._admPageList("tablePage");
if (i.content) {
e._admClearRows(i.content, null);
var n = t.tables || [];
i.tip && (i.tip.active = 0 === n.length);
var a = e._clubCardTpl();
a && (a.active = !1);
if (!n.length || a) {
var o = e._clubTableCardMap;
e._clubTableCardMap = {};
var s = a ? a.width : 360, c = a ? a.height : 200, r = i.view ? i.view.width : 980, l = i.view ? i.view.height : 500;
i.content.height = l;
var h = Math.ceil(n.length / 2);
i.content.width = Math.max(r, h * (s + 5) + 5);
n.forEach(function(t, n) {
var a = i.content.childrenCount;
e._clubAddTableCard(i.content, n, t);
if (i.content.childrenCount > a) {
var o = i.content.children[i.content.childrenCount - 1], r = Math.floor(n / 2), l = n % 2;
o.setPosition(5 + s / 2 + r * (s + 5), -(5 + c / 2 + l * (c + 5)));
}
});
e._clubTableCardMap = o;
var d = i.scroll ? i.scroll.getComponent(cc.ScrollView) : null;
d && d.scrollToLeft();
}
}
}
});
},
_admLoadBeanLogs: function() {
var e = this;
this._clubCur && this._clubCur.id && cc.vv.http.sendRequest("/club_bean_logs", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: this._clubCur.id
}, function(t) {
if (t && 0 === t.errcode) {
var i = e._admPageList("beanPage");
if (i.content && i.tpl) {
e._admClearRows(i.content, i.tpl);
var n = t.logs || [];
i.tip && (i.tip.active = 0 === n.length);
var a = (i.tpl.height || 36) + 2;
n.forEach(function(t, n) {
var o = e._admAddRow(i, n, a);
if (o) for (var s = parseInt(t.amount) || 0, c = [ e._wfPopupTime(t.create_time), t.userid, t.name, t.roomid, t.change_type, s > 0 ? "+" + s : String(s) ], r = 0; r < 6; ++r) e._admSetRowText(o, "c" + r, c[r]);
});
e._admScrollTop(i);
}
}
});
},
_admLoadSubs: function() {
var e = this;
this._clubCur && this._clubCur.id && cc.vv.http.sendRequest("/club_sub_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: this._clubCur.id
}, function(t) {
if (t && 0 === t.errcode) {
var i = e._admPageList("subPage");
if (i.content && i.tpl) {
e._admClearRows(i.content, i.tpl);
var n = t.subs || [];
i.tip && (i.tip.active = 0 === n.length);
var a = (i.tpl.height || 44) + 2;
n.forEach(function(t, n) {
var o = e._admAddRow(i, n, a);
if (o) for (var s = [ t.name, t.id, t.member_count, t.total_gems ], c = 0; c < 4; ++c) e._admSetRowText(o, "c" + c, s[c]);
});
e._admScrollTop(i);
}
}
});
},
_admOpenNewClub: function() {
var e = this._admNewClubWin;
if (e) {
var t = e.getChildByName("bg"), i = t ? t.getChildByName("difenInput") : null;
if (i && i.getComponent(cc.EditBox)) {
var n = i.getComponent(cc.EditBox);
n.string = "";
n.inputFlag = 3;
}
var a = t ? t.getChildByName("jushuInput") : null;
if (a && a.getComponent(cc.EditBox)) {
var o = a.getComponent(cc.EditBox);
o.string = "";
o.inputFlag = 3;
}
this._admHideWins();
e.active = !0;
} else cc.vv.wc.showError("缺少开子俱乐部弹窗");
},
_admCloseNewClub: function() {
this._admNewClubWin && cc.isValid(this._admNewClubWin) && (this._admNewClubWin.active = !1);
},
_admSubmitNewClub: function() {
var e = this, t = this._admNewClubWin, i = this._clubCur;
if (t && i && i.id) {
var n = t.getChildByName("bg"), a = n ? n.getChildByName("difenInput") : null, o = a ? a.getComponent(cc.EditBox) : null, s = o ? String(o.string || "").replace(/^\s+|\s+$/g, "") : "";
if (s) {
var c = n ? n.getChildByName("jushuInput") : null, r = c ? c.getComponent(cc.EditBox) : null, l = r ? String(r.string || "").replace(/^\s+|\s+$/g, "") : "";
if (l) if (/^\d{1,9}$/.test(l)) {
cc.vv.wc.show("正在创建");
cc.vv.http.sendRequest("/club_create", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
name: s,
parentclid: i.id,
owneruserid: l
}, function(t) {
cc.vv.wc.hide();
if (t && 0 === t.errcode) {
e._admCloseNewClub();
cc.vv.wc.showAlert("子俱乐部创建成功，ID：" + t.clubid, "提示");
e._clubRefreshList();
"sub" === e._admPage && e._admLoadSubs();
} else {
var i = t && t.errmsg ? t.errmsg : "创建失败";
t && 3 === t.errcode && (i = "上级俱乐部不存在");
t && 4 === t.errcode && (i = "只有社长可以开子俱乐部");
t && 5 === t.errcode && (i = "玩家ID不存在");
cc.vv.wc.showAlert(i, "提示");
}
});
} else cc.vv.wc.showError("玩家ID只能是数字"); else cc.vv.wc.showError("请输入玩家ID");
} else cc.vv.wc.showError("请输入俱乐部名称");
}
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
for (var o = e.getChildByName("rows"), s = this._admCfgFields(t.game_type), c = t.tai_rules || {}, r = t.default_tai_rules || {}, l = s.length > 16 ? 3 : s.length > 8 ? 2 : 1, h = 3 === l ? [ -330, 0, 330 ] : 2 === l ? [ -170, 170 ] : [ 0 ], d = Math.ceil(s.length / l), u = o ? o.children.length : 0, g = 0; g < u; ++g) {
var v = o.children[g];
if (v) if (g < s.length) {
v.active = !0;
v._cfgKey = s[g].key;
v.setPosition(h[Math.floor(g / d)], 62 - g % d * 32);
var m = v.getChildByName("name");
m && m.getComponent(cc.Label) && (m.getComponent(cc.Label).string = s[g].label);
var f = v.getChildByName("e") ? v.getChildByName("e").getComponent(cc.EditBox) : null;
if (f) {
var _ = c[s[g].key];
f.string = null != _ ? String(_) : "";
var p = v.getChildByName("e").getChildByName("PLACEHOLDER_LABEL"), C = p ? p.getComponent(cc.Label) : null;
if (C) {
var b = r[s[g].key];
C.string = null != b ? String(b) : "默认";
}
}
} else {
v.active = !1;
v._cfgKey = null;
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
"table" === e._admPage && e._admLoadTablesAdm();
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
"member" === e._admPage && e._admLoadMembers();
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
"member" === e._admPage && e._admLoadMembers();
"bean" === e._admPage && e._admLoadBeanLogs();
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
if (n) {
var a = n.getComponent(cc.Graphics);
a && a.clear();
}
this._clubCloseBtn && (this._clubCloseBtn.active = !1);
var o = this._clubFind(t, "btnBack");
if (o) {
o._clubW = o.width;
o._clubH = o.height;
if (!o._clubBound) {
o._clubBound = !0;
o.on(cc.Node.EventType.TOUCH_END, function() {
cc.vv.sceneMgr ? cc.vv.sceneMgr.load("hall") : cc.director.loadScene("hall");
});
}
this._clubBackBtn = o;
}
var s = this._clubFind(t, "clubName");
s && (s.active = !1);
var c = this._clubFind(t, "clubGems");
this._clubGemsNode = c;
var r = function(e) {
if (cc.isValid(c)) {
var t = c.getComponent(cc.Label);
t && (t.string = String(null == e ? 0 : e));
}
};
c && r(cc.vv.userMgr.gems);
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
r(cc.vv.userMgr.gems);
}
});
if (c && c.parent) {
var l = c.parent.getChildByName("safeBtn") || this._clubFind(t, "safeBtn");
if (l) {
l.off(cc.Node.EventType.TOUCH_END);
l.on(cc.Node.EventType.TOUCH_END, function() {
e._openSafeWin();
});
}
}
var h = this._clubFind(t, "games");
if (h) {
var d = h.getChildByName("sampleRow0") || h.getChildByName("gameRowTpl"), u = h.getChildByName("allRow"), g = h.getChildByName("emptyTip"), v = h.getChildByName("samptext"), m = [];
[ "gameRowTpl", "sampleRow0", "sampleRow1", "sampleRow2" ].forEach(function(e) {
var t = h.getChildByName(e);
t && m.push(t);
});
h.removeAllChildren();
v && h.addChild(v);
m.forEach(function(e) {
h.addChild(e);
e.active = !1;
});
if (u) {
h.addChild(u);
u.active = !0;
}
g && h.addChild(g);
this._clubGameRows = [];
var f = [ {
_all: !0,
game_type: "",
name: "全部",
difen_options: [],
jushu_options: []
} ].concat(this._clubGames || []);
this._clubGamesWithAll = f;
d && d.height;
var _ = null, p = 0, C = h.getChildByName("emptyTip");
C && (C.active = 0 == (this._clubGames || []).length);
f.forEach(function(t, i) {
var n = null;
if (0 === i && u) {
(n = u).active = !0;
_ = u.x + u.width / 2;
p = u.y;
} else {
(n = d ? cc.instantiate(d) : new cc.Node("row" + i)).active = !0;
if (null != _) {
n.setPosition(_ + 0 + n.width / 2, p);
_ += 0 + n.width;
}
h.addChild(n);
}
n._gm = t;
var a = n.getChildByName("l");
if (a) {
var o = a.getComponent(cc.Label);
o && (o.string = t.name || "");
}
var s = n.getChildByName("bgimg");
if (s) {
var c = s.getComponent(cc.Sprite);
n._iconSp = c;
n._iconNormal = c ? c.spriteFrame : null;
n._iconSel = null;
cc.resources.load("images/other/button_yellow", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(s)) {
n._iconSel = t;
n._selected && (c.spriteFrame = t);
}
});
}
n.off(cc.Node.EventType.TOUCH_END);
n.on(cc.Node.EventType.TOUCH_END, function() {
e._clubScrollMoved ? e._clubScrollMoved = !1 : e._clubSelectGame(t, n);
});
e._clubGameRows.push(n);
});
var b = this._clubFind(t, "tablesView") || this._clubFind(cc.find("Canvas"), "tablesView");
if (b) {
this._clubTablesNode = b.getChildByName("tables");
if (this._clubTablesNode) {
var y = this._clubFind(this._clubTablesNode, "sampleCard0");
y && (this._clubTpl = y);
this._clubTablesNode.removeAllChildren();
if (!b._clubBound) {
b._clubBound = !0;
var N = 0, S = 0;
b.on(cc.Node.EventType.TOUCH_START, function(t) {
N = t.getLocation().x;
S = e._clubTablesNode ? e._clubTablesNode.x : 0;
e._clubTablesScrollMoved = !1;
});
b.on(cc.Node.EventType.TOUCH_MOVE, function(t) {
if (e._clubTablesNode) {
var i = b.width, n = e._clubTablesNode.width;
if (!(n <= i)) {
var a = t.getLocation().x - N;
Math.abs(a) > 6 && (e._clubTablesScrollMoved = !0);
var o = e._clubTablesRestX || 0, s = n - i;
e._clubTablesNode.x = Math.max(o - s, Math.min(o, S + a));
}
}
});
b.on(cc.Node.EventType.TOUCH_CANCEL, function() {
e._clubTablesScrollMoved = !1;
});
}
null == this._clubTablesRestY && (this._clubTablesRestY = this._clubTablesNode.y);
null == this._clubTablesRestX && (this._clubTablesRestX = this._clubTablesNode.x);
if (!this._clubCurGame && f.length > 0) {
var M = cc.vv.lastGameType, B = null;
if (M) for (var w = 0; w < f.length; ++w) {
var A = f[w].game_type || f[w].type;
if (A && A == M) {
B = f[w];
break;
}
}
this._clubCurGame = B || f[0];
}
for (var x = 0; x < this._clubGameRows.length; ++x) this._clubPaintRow(this._clubGameRows[x], f[x] === this._clubCurGame);
this._clubCurGame ? this._clubLoadTables() : this._clubAddRow(this._clubTablesNode, 0, "← 请先选择左侧玩法", "", null, 520);
}
}
}
},
_clubSelectGame: function(e, t) {
if (e !== this._clubCurGame) {
this._clubChipsOpen = !0;
this._clubChipsAnchor = t;
this._clubCurGame = e;
for (var i = 0; i < this._clubGameRows.length; ++i) this._clubPaintRow(this._clubGameRows[i], this._clubGameRows[i] === t);
this._clubTableList = [];
this._clubRenderTableChips();
this._clubLoadTables();
} else {
this._clubChipsOpen = !this._clubChipsOpen;
this._clubChipsAnchor = t;
this._clubRenderTableChips();
}
},
_clubRenderTableChips: function() {
var e = this._clubListArea, t = e ? this._clubFind(e, "games") : null;
if (t) {
var i = [];
t.children.forEach(function(e) {
"tchip" === e.name && i.push(e);
});
i.forEach(function(e) {
e.destroy();
});
if (this._clubChipsOpen) {
var n = t.getChildByName("sampleRow1"), a = t.getChildByName("allRow");
if (n && a) {
var o = this._clubCurGame || {}, s = (this._clubTableList || []).filter(function(e) {
return o._all || !o.game_type || e.game_type === o.game_type;
});
if (s.length) {
var c = this, r = n.width, l = n.height, h = this._clubChipsAnchor && cc.isValid(this._clubChipsAnchor) ? this._clubChipsAnchor : a, d = h.x - h.width / 2, u = h.y - h.height / 2 - 6 - l / 2, g = (t.width || 1920) / 2 - 10, v = d, m = u;
s.forEach(function(e) {
var i = cc.instantiate(n);
i.name = "tchip";
i.active = !0;
var a = (e.name || "") + "号桌", o = i.getChildByName("l"), s = o ? o.getComponent(cc.Label) : null;
if (s) {
s.overflow = cc.Label.Overflow.NONE;
s.string = a;
s._forceUpdateRenderData && s._forceUpdateRenderData();
}
var h = s && s.node.width > 0 ? s.node.width : 20 * a.length, u = Math.max(r, Math.ceil(h + 28));
i.width = u;
var f = i.getChildByName("bgimg");
f && (f.width = u);
if (v + u > g && v > d) {
v = d;
m -= l + 6;
}
i.setPosition(v + u / 2, m);
v += u + 8;
t.addChild(i);
i.on(cc.Node.EventType.TOUCH_END, function() {
if (c._clubScrollMoved) c._clubScrollMoved = !1; else {
c._clubTablesSig = null;
c._clubLoadTables();
}
});
});
}
}
}
}
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
var i = e && e.game_type ? e.game_type : this._clubCurGame && this._clubCurGame.game_type ? this._clubCurGame.game_type : "";
return 0 === i.indexOf("baobao") ? 6 : 0 === i.indexOf("zj4") || 0 === i.indexOf("zp4") || "wujin" == i ? 4 : 2;
},
_clubAddTableCard: function(e, t, i) {
var n = this, a = this._clubCardTpl();
if (a) {
var o = a.width, s = a.height, c = 5 + o / 2 + Math.floor(t / 2) * (o + 5), r = -(5 + s / 2 + t % 2 * (s + 5)), l = cc.instantiate(a);
l.active = !0;
l.setPosition(c, r);
e.addChild(l);
for (var h = [ "下左", "左", "上左", "上右", "右", "下右" ], d = {
2: [ 0, 3 ],
3: [ 0, 1, 4 ],
4: [ 0, 1, 3, 4 ],
5: [ 0, 1, 2, 3, 4 ],
6: [ 0, 1, 2, 3, 4, 5 ]
}[this._clubMaxPlayers(i)] || [ 0, 1, 2, 3, 4, 5 ], u = [ 0, 0, 0, 0, 0, 0 ], g = [ "", "", "", "", "", "" ], v = this._clubUidNames = this._clubUidNames || {}, m = 0; m < d.length; m++) {
var f = Number(i["user_id" + m]) || 0, _ = i["user_name" + m] || "";
if (f > 0 && d[m] < u.length) {
u[d[m]] = f;
g[d[m]] = _;
v[f] = _;
}
}
for (var p = [ null, null, null, null, null, null ], C = 0; C < 6; C++) {
var b = l.getChildByName("seat" + C);
if (b) if (d.indexOf(C) < 0) b.active = !1; else {
b._side = h[C];
p[C] = b;
this._clubSetSeat(b, u[C] || 0, g[C] || "");
}
}
this._clubTableCardMap || (this._clubTableCardMap = {});
var y = {
card: l,
slots: p,
uids: u,
map: d
};
this._clubTableCardMap[i.id] = y;
i.roomid && (this._clubTableCardMap["r_" + i.roomid] = y);
var N = l.getChildByName("cb") || l.getChildByName("n");
if (N) {
var S = N.getComponent(cc.Label);
S && (S.string = (i.name || "") + "号桌");
}
var M = {};
try {
M = JSON.parse(i.conf) || {};
} catch (e) {}
for (var B = this._clubCurGame || {}, w = B.difen_options || [], A = B.jushu_options || [], x = null != M.difen_value ? M.difen_value : "number" == typeof M.difen && null != w[M.difen] ? w[M.difen] : M.difen, T = null != M.jushu_value ? M.jushu_value : "number" == typeof M.jushuxuanze && null != A[M.jushuxuanze] ? A[M.jushuxuanze] : M.jushuxuanze, I = (null == M.banker_mode || Number(M.banker_mode), 
Number(M.min_bean) || 0), P = 0; P < l.children.length; ++P) {
var L = l.children[P];
if ("c" === L.name || "C" === L.name) {
var R = L.getComponent(cc.Label);
R && (R.string = "底分" + (null != x ? x : "-") + "  局数" + (null != T ? T : "-"));
}
}
var O = l.getChildByName("ca");
if (O) {
var j = O.getComponent(cc.Label);
j && (j.string = "入场：" + I + "，离场：" + (Number(M.kick_bean) || 0));
}
var k = l.getChildByName("btnClear");
if (k) {
k.active = !!i.can_clear;
if (i.can_clear) {
k.off(cc.Node.EventType.TOUCH_END);
k.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
n._clubTablesScrollMoved ? n._clubTablesScrollMoved = !1 : n._clubClearTable(i);
});
}
}
var F = this._clubFind(l, "btnDel");
if (F) {
var E = !(!this._clubCur || !cc.vv.userMgr || String(this._clubCur.owner_userid) !== String(cc.vv.userMgr.userId));
F.active = E;
F.off(cc.Node.EventType.TOUCH_END);
E && F.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
n._clubTablesScrollMoved ? n._clubTablesScrollMoved = !1 : n._clubDelTable(i);
});
}
l.on(cc.Node.EventType.TOUCH_END, function() {
n._clubTablesScrollMoved ? n._clubTablesScrollMoved = !1 : n._clubEnterTable(i);
});
return l;
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
_clubSetSeat: function(e, t, i) {
if (e && cc.isValid(e)) {
t = t || 0;
i = i || "";
var n = e.getChildByName("name");
if (n) {
n.active = t > 0;
var a = n.getComponent(cc.Label);
a && (a.string = i);
}
if (e._uid !== t || e._seatName !== i) {
e._uid = t;
e._seatName = i;
var o = e.getChildByName("chara"), s = e.getChildByName("charaF"), c = e.getChildByName("head");
if (o || s) if (t <= 0) {
o && (o.active = !1);
s && (s.active = !1);
c && (c.active = !1);
} else {
var r = this, l = function(i) {
var n = i && 2 === Number(i.sex), a = e._side || "下左", l = n && s ? s : o;
if (l && cc.isValid(l)) {
o && (o.active = !(n && s));
s && (s.active = !!n);
r._clubApplyFrame(l, "bbt_" + (n ? "女" : "男") + a);
if (c && cc.isValid(c)) {
c.active = !0;
var h = c.getChildByName("img");
if (h) {
var d = h.getComponent(cc.Sprite), u = h.getComponent("ImageLoader");
u && (u._spriteFrame = null);
d && (r._clubHeadFrame ? d.spriteFrame = r._clubHeadFrame : cc.resources.load("images/other/head", cc.SpriteFrame, function(e, t) {
if (!e && t) {
r._clubHeadFrame = t;
!cc.isValid(d) || u && u._spriteFrame || (d.spriteFrame = t);
}
}));
u && u.setUserID(t);
}
}
}
};
cc.vv.baseInfoMap && null != cc.vv.baseInfoMap[t] && null != cc.vv.baseInfoMap[t].sex ? l(cc.vv.baseInfoMap[t]) : cc.vv.http.sendRequest("/base_info", {
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
l(a);
} else l(null);
}, cc.vv.http.master_url);
}
}
}
},
_clubStartTableWatch: function() {
if (this._clubCur && this._clubCur.id) {
this._clubSubConnect(this._clubCur.id);
this._clubStartTablePoll();
}
},
_clubStopTableWatch: function() {
this._clubSubStop();
this._clubStopTablePoll();
},
_clubStartTablePoll: function() {
if (!this._clubTablePollTimer) {
var e = this;
this._clubTablePollTimer = setInterval(function() {
cc.isValid(e.node) && "detail" === e._clubState ? e._clubLoadTables() : e._clubStopTablePoll();
}, 5e3);
}
},
_clubStopTablePoll: function() {
if (this._clubTablePollTimer) {
clearInterval(this._clubTablePollTimer);
this._clubTablePollTimer = null;
}
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
for (var s = e.seats || [], c = [ 0, 0, 0, 0, 0, 0 ], r = this._clubUidNames || (this._clubUidNames = {}), l = 0; l < s.length; ++l) {
var h = s[l].seatindex, d = s[l].userid || 0;
d > 0 && s[l].name && (r[d] = s[l].name);
var u = o.map && h >= 0 && h < o.map.length ? o.map[h] : h;
u >= 0 && u < c.length && (c[u] = d);
}
for (var g = 0; g < o.slots.length; ++g) this._clubSetSeat(o.slots[g], c[g], r[c[g]] || "");
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
var e = this, t = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
clubid: this._clubCur.id
}, i = this._clubCurGame && this._clubCurGame.game_type;
i && (t.game_type = i);
cc.vv.http.sendRequest("/club_tables", t, function(t) {
if (0 === t.errcode) {
var i = t.tables || [];
e._clubTableList = i;
e._clubMaybeQuickJoin(i);
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
var c = e._clubTablesNode.parent.width, r = s ? s.width : 360, l = Math.max(1, Math.ceil(i.length / 2));
e._clubTablesNode.width = Math.max(c, l * (r + 5) + 5);
if (0 != i.length) {
i.forEach(function(t, i) {
e._clubAddTableCard(e._clubTablesNode, i, t);
});
e._clubRenderTableChips();
} else {
e._clubRenderTableChips();
e._clubAddRow(e._clubTablesNode, 0, "暂无桌面(管理员后台添加)", "", null, 520);
}
}
} else cc.vv.wc.showError(t.errmsg || "获取桌面失败");
});
},
_clubMaybeQuickJoin: function(e) {
if (cc.vv.autoQuickJoin && e && e.length) {
var t = cc.vv.autoQuickJoin;
cc.vv.autoQuickJoin = null;
for (var i = "object" == typeof t && t.gameType || null, n = this, a = null, o = 0; o < e.length; ++o) {
var s = e[o];
if (i) {
var c = s.game_type || s.type;
if (c && c != i) continue;
}
if ((Number(s.player_count) || 0) < this._clubMaxPlayers(s)) {
a = s;
break;
}
}
if (a) {
console.log("[club] 快速加入: 自动进入未满桌 " + (a.name || a.id || ""));
setTimeout(function() {
cc.vv && n._clubEnterTable && n._clubEnterTable(a);
}, 300);
}
}
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
if (cc.vv.gameNetMgr) {
cc.vv.gameNetMgr.roomBackScene = "";
cc.vv.gameNetMgr.roomBackClubId = null;
}
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
for (var u = o.x - o.width * o.anchorX, g = 0; g < a.children.length; g++) {
var v = a.children[g];
if (v !== o) {
var m = s[v.name];
if (null != m) {
var f = v.getComponent(cc.Widget);
f && (f.enabled = !1);
v.x = u + m + v.width * v.anchorX;
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
this.initButtonHandler("Canvas/global/main/menu/菜单-分享");
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
"btn_setting" == e.target.name ? this.settingsWin.active = !0 : "btn_help" == e.target.name ? this.openHelp() : "btn_xiaoxi" == e.target.name ? this.xiaoxiWin.active = !0 : "btn_zhanji" == e.target.name ? this.openZhanji() : "菜单-商城" == e.target.name ? this.onJoinGameClicked() : "菜单-分享" == e.target.name ? this.onShareLinkClicked() : "用户栏-默认头像" == e.target.name && this._showUserInfoPanel();
},
onShareLinkClicked: function() {
var e = cc.vv.anysdkMgr && cc.vv.anysdkMgr.copyShareLink && cc.vv.anysdkMgr.copyShareLink() ? "链接已复制，粘贴发送给好友，好友点开链接即可进入游戏" : "链接复制失败，请稍后重试";
cc.vv.wc && cc.vv.wc.showAlert ? cc.vv.wc.showAlert(e, "分享") : cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(e);
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
for (var h = this._avatarShowKeys, d = n ? n.width : 100, u = n ? n.height : 100, g = -(6 * d + 120) / 2 + d / 2, v = (u + 24) / 2, m = n ? n.getComponent(cc.Sprite) : null, f = 0; f < h.length; f++) (function(e, n) {
var a = new cc.Node("cell_" + n);
a.setContentSize(d, u);
void 0 !== i.layer && (a.layer = i.layer);
a.parent = i;
a.setPosition(g + n % 6 * (d + 24), v - Math.floor(n / 6) * (u + 24));
var o = a.addComponent(cc.Sprite);
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
m && m.spriteFrame && (o.spriteFrame = m.spriteFrame);
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
var u = d.addComponent(cc.EditBox), g = new cc.Node("TEXT_LABEL");
g.parent = d;
var v = g.addComponent(cc.Label);
v.fontSize = 26;
v.color = cc.Color.WHITE;
var m = new cc.Node("PLACEHOLDER_LABEL");
m.parent = d;
var f = m.addComponent(cc.Label);
f.fontSize = 26;
f.color = new cc.Color(150, 150, 150, 255);
u.textLabel = v;
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
var g = [ [ "底分：", "difenInput" ], [ "局数：", "jushuInput" ], [ "最低宝宝豆：", "minInput" ], [ "请出阈值：", "kickInput" ] ];
this._createInputs = {};
for (var v = 0; v < g.length; v++) {
var m = -80 - 80 * v;
this._makeLabel(r, g[v][0], 26, -210, m);
this._createInputs[g[v][1]] = this._makeEditBox(r, g[v][1], 100, m, 300, 56, "0", "");
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
e._enterCreatedTable(t.tableid, i.id);
} else cc.vv.wc.showError(t && t.errmsg ? t.errmsg : "创建房间失败");
});
}
} else cc.vv.wc.showError("请输入正确的底分");
}
},
_enterCreatedTable: function(e, t) {
var i = cc.vv.wc;
i.show("正在进入房间");
var n = setTimeout(function() {
cc.vv.wc === i && i.showError("进入房间失败,请重试(服务未响应)");
}, 12e3);
cc.vv.http.sendRequest("/club_enter_table", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
tableid: e
}, function(e) {
clearTimeout(n);
if (e && 0 === e.errcode) {
cc.vv.fromClub = !0;
cc.vv.fromClubId = t || null;
cc.vv.gameNetMgr.connectGameServer(e);
} else if (e && 2222 == e.errcode) {
i.hide();
cc.vv.wc.showAlert(e.errmsg || "宝宝豆不足，无法进入房间");
} else i.showError(e && e.errmsg ? e.errmsg : "进入房间失败");
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
if (!cc.vv.audioMgr) {
cc.vv.audioMgr = new s();
cc.vv.audioMgr.init();
}
if (!cc.Node.prototype._bbBtnSoundHooked) {
cc.Node.prototype._bbBtnSoundHooked = !0;
var c = cc.Node.prototype.emit;
cc.Node.prototype.emit = function(e) {
if ("touch-end" === e && cc.vv && cc.vv.audioMgr) {
var t = this.getComponent ? this.getComponent(cc.Button) : null;
(t && !1 !== t.interactable || /^btn/i.test(this.name) || /button/i.test(this.name)) && cc.vv.audioMgr.playSFX("btnClick.wav");
}
return c.apply(this, arguments);
};
}
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
var u = [ "images", "textures", "sounds", "prefabs" ], g = {}, v = 0;
u.forEach(function(t) {
g[t] = {
c: 0,
t: 0
};
cc.resources.loadDir(t, function(i, n) {
g[t].c = i;
g[t].t = n;
var a = 0, o = 0;
for (var s in g) {
a += g[s].c;
o += g[s].t;
}
e._drawLoadProgress(o > 0 ? a / o : 0);
}, function(i) {
i && console.log("[预载]目录加载失败:" + t, i);
++v >= u.length && e._onAllResLoaded();
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
}, {}, [ "use_v2.0.x_cc.Toggle_event", "BBGame", "clubScene", "GPGame", "Alert", "CheckBox", "CreateRoom", "HallHelp", "History", "ImageLoader", "JoinGameInput", "hall", "setting", "Lodinglogin", "login", "Chat", "DingQue", "Folds", "GameOver", "GameOverZP", "GameResult", "GameResultZP", "HuanSanZhang", "MJGameBMJ", "MJGameLDH", "MJGameWujin", "MJGameZJLAO", "MJGameZJZX", "MJGameZP", "MJGameZP4", "MJRoom", "NoticeTip", "PengGangs", "PopupMgr", "RadioButton", "RadioGroupMgr", "ReConnect", "ReplayCtrl", "Seat", "TimePointer", "UserInfoShow", "Voice" ]);