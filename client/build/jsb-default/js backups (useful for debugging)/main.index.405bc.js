window.__require = function e(t, i, n) {
function a(o, r) {
if (!i[o]) {
if (!t[o]) {
var c = o.split("/");
c = c[c.length - 1];
if (!t[c]) {
var l = "function" == typeof __require && __require;
if (!r && l) return l(c, !0);
if (s) return s(c, !0);
throw new Error("Cannot find module '" + o + "'");
}
o = c;
}
var h = i[o] = {
exports: {}
};
t[o][0].call(h.exports, function(e) {
return a(t[o][1][e] || e);
}, h, h.exports, e, t, i, n);
}
return i[o].exports;
}
for (var s = "function" == typeof __require && __require, o = 0; o < n.length; o++) a(n[o]);
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
_setBtnText: function(e, t) {
if (e) {
var i = e.getComponent(cc.Label) || e.getComponentInChildren(cc.Label);
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
for (var n = [ "Spade", "Heart", "Club", "Diamond" ], a = [ "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A" ], s = 0; s < n.length; ++s) for (var o = 0; o < a.length; ++o) {
var r = n[s] + a[o], c = h(r);
c && (e._cardFrames[r] = c);
}
e._cardBack = h("card_back");
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
for (var n = this.findNode(i, "icon"), a = this.findNode(i, "name"), s = this.findNode(i, "score"), o = this.findNode(i, "bbZhuang"), r = this.findNode(i, "ready"), c = [], l = [], h = 0; h < 3; ++h) {
for (var d = 0; d < 2; ++d) {
var u = this.findNode(i, "bbCard" + (2 * h + d));
if (u) {
u.active = !1;
c.push(u);
}
}
var g = this.findNode(i, "bbDao" + h);
l.push(g);
}
var v = this.findNode(i, "bbSummary");
o && (o.active = !1);
this._seatNodes[t] = {
root: i,
icon: n,
userSprite: this.findNode(i, "username"),
nameLabel: a,
scoreLabel: s,
zhuang: o,
readyMark: r,
okSprite: this.findNode(i, "okSprite"),
cardsNode: this.findNode(i, "bbCards"),
slots: c,
daoLabels: l,
summary: v,
bubble: this.findNode(i, "bbBubble"),
mianType: this.findNode(i, "bbMianType")
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
for (var a = [], s = 0; s < 2; ++s) {
var o = t[n].slots[s];
a.push(o ? {
x: o.x,
y: o.y,
sx: o.scaleX,
sy: o.scaleY
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
for (var r = 0; r < 3; ++r) this._arrangeDelBtns.push(this.findNode(e, "bbArrDelX" + r));
this._arrangeCancelAllBtn = this.findNode(e, "bbCancelAllBtn");
this._n.bbArrClose = this.findNode(e, "bbArrCloseBtn");
this._n.bbArrReopen = this.findNode(this.node, "bbArrReopen");
this._n.bbArrReopen && (this._n.bbArrReopen.active = !1);
this._arrangeHandSlots = [];
this._arrangeHandHome = [];
for (var c = 0; c < 6; ++c) {
var l = this.findNode(e, "bbArrHand" + c);
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
this._confirmRoot = e;
this._confirmAutoBtn = this.findNode(e, "bbConfirmBtn-a");
this._settleCd = this.findNode(this._n.resultPanel, "settleCd");
e.active = !1;
}
},
_bindButtons: function() {
this.bindButton(this._n.readyBtn, this.onReady, this);
this.bindButton(this._n.exitBtn, this.onExit, this);
this.bindButton(this._n.dissolveBtn, this.onDissolve, this);
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
var a = this, s = this.findNode(n, "chat_emojibg");
s && this.bindButton(s, function() {
n.active = !1;
}, this);
this.bindButton(i, function() {
n.active = !0;
}, this);
this._chatQuickList = this.findNode(n, "quickchatlist");
this._chatEmojiList = this.findNode(n, "emojis");
var o = this.findNode(n, "tabQuick"), r = this.findNode(n, "tabEmoji");
this.bindButton(o, function() {
a._switchChatTab(!0);
}, this);
this.bindButton(r, function() {
a._switchChatTab(!1);
}, this);
var c = this.findNode(n, "iptChat");
this._chatIpt = c ? c.getComponent(cc.EditBox) : null;
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
if (c) {
c.on("editing-return", function() {
a._sendChatInput();
});
c.on("editing-did-ended", function() {
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
(function e(t) {
if (t) {
var i = t.children || [];
if (i.length > 0) for (var n = 0; n < i.length; ++n) e(i[n]); else if (t.name && "sp" !== t.name && "New Node" !== t.name) {
var s = t.getComponent(cc.Sprite), o = s && s.spriteFrame;
if (o) {
a._emojiFrames[t.name] = o;
a._emojiFrames[t.name + ".png"] = o;
}
}
}
})(this._chatEmojiList);
console.log("[BB] 场景表情帧=" + Object.keys(this._emojiFrames).length);
var h = this;
cc.resources.load("images/chat/emoji_action_texture", cc.SpriteAtlas, function(e, t) {
if (t) {
t.getSpriteFrames().forEach(function(e) {
h._emojiFrames[e.name + ".png"] = e;
h._emojiFrames[e.name] = e;
});
h._emojiAtlasLoaded = !0;
} else h._emojiAtlasLoaded = !1;
});
cc.resources.load("images/chat/chat_emojibg.png", cc.SpriteFrame, function(e, t) {
t && (h._chatBgFrame = t);
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
for (var a = Math.max(2, Math.min(6, i.length)), s = 0; s < i.length; ++s) if (i[s] && i[s].userid == e) {
var o = (s - n + i.length) % i.length;
return o >= a ? -1 : this._layoutOf(a)[o];
}
return -1;
},
_showBubble: function(e, t, i) {
if (t) {
var n = this._slotIdxOfUser(e);
if (!(n < 0) && this._seatNodes[n] && this._seatNodes[n].root || !((n = this._seatNodes.findIndex(function(e) {
return e && e.root;
})) < 0)) {
var a = this._seatNodes[n], s = a.bubble;
if (s) {
var o = this.findNode(s, "bbBubbleText"), r = this.findNode(a.root, "bbBubbleEmoji");
if (i) {
var c = String(t).replace(/\.png$/i, ""), l = "smile" === c ? "smaile" : c, h = this._emojiFrames || {}, d = h[c] || h[l + "0.png"] || h[l] || null;
console.log("[BB] emoji-bubble 内容=" + c + " 取到=" + !!d + " 缓存帧数=" + Object.keys(h).length + " 表情节点=" + !!r + " 槽位=" + n);
if (r) {
r.active = !!d;
if (d) {
var u = r.getComponent(cc.Sprite);
if (u) {
u.enabled = !0;
u.sizeMode = cc.Sprite.SizeMode.CUSTOM;
u.spriteFrame = d;
}
}
}
if (o) {
o.active = !d;
if (!d) {
var g = o.getComponent(cc.Label);
g && (g.string = t);
}
}
s.active = !0;
var v = s.getComponent(cc.Sprite);
v && (v.enabled = !d);
} else {
r && (r.active = !1);
if (o) {
o.active = !0;
var _ = o.getComponent(cc.Label);
if (_) {
_.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
var f = 20 + 20 * String(t).length;
f < 80 && (f = 80);
f > 240 && (f = 240);
o.width = f;
_.string = t;
}
}
s.active = !0;
var m = s.getComponent(cc.Sprite);
m && (m.enabled = !0);
}
!i && s.active && o && this.scheduleOnce(function() {
if (cc.isValid(s) && cc.isValid(o)) {
var e = Math.max(80, o.width + 20), t = Math.max(40, o.height + 16);
s.setContentSize(e, t);
}
}, 0);
a._bubbleSeq = (a._bubbleSeq || 0) + 1;
var p = a._bubbleSeq;
this.scheduleOnce(function() {
if (a._bubbleSeq === p) {
cc.isValid(s) && (s.active = !1);
cc.isValid(r) && (r.active = !1);
}
}, 2);
}
}
}
},
_bindChatItems: function(e, t) {
if (e) for (var i = this, n = function e(n) {
if (t) {
var a = /^item(\d+)$/.exec(n.name);
a && i.bindButton(n, function() {
i._sendQuickChat(parseInt(a[1], 10));
}, i);
} else n.children && 0 === n.children.length && "sp" !== n.name && !/^cc/.test(n.name) && "New Node" !== n.name && i.bindButton(n, function() {
i._sendEmoji(n.name);
}, i);
for (var s = n.children || [], o = 0; o < s.length; ++o) e(s[o]);
}, a = e.children || [], s = 0; s < a.length; ++s) n(a[s]);
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
var a = e.seats && e.seatIndex >= 0 ? e.seats[e.seatIndex] : null, s = !(!a || !a.ready);
this._n.readyBtn && (this._n.readyBtn.active = !s);
this._n.exitBtn && (this._n.exitBtn.active = !0);
this.showTip(s ? "本局进行中，结束后自动加入下一局" : "本局进行中，观战中");
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
for (var n = cc.vv.userMgr && cc.vv.userMgr.userId, a = e.events || [], s = null, o = null, r = null, c = null, l = null, h = 0; h < a.length; ++h) {
var d = a[h];
if (d && d.d) if ("bb_start_push" == d.e) {
s || (s = d.d);
o || d.u != n || (o = d.d);
} else if ("bb_reveal_push" == d.e) r || (r = d.d); else if ("game_over_push" == d.e) {
l || (l = d.d);
c || d.u != n || (c = d.d);
}
}
var u = s && s.seats || [], g = Math.max(2, Math.min(6, u.length || (e.players || []).length)), v = [ "seats", "seatIndex", "bbSeats", "bbMySeat", "bbBankerSeat", "bbBankerMode", "bbGameType", "bbMyCards", "bbMyDaos", "bbPhase", "bbArranged", "conf", "roomId", "numOfGames", "maxNumOfGames", "overData", "bbOverDetails", "gamestate" ];
this._savedNm = {};
for (var _ = 0; _ < v.length; ++_) this._savedNm[v[_]] = i[v[_]];
var f = c || l || {}, m = f.results || [], p = [], b = [];
for (h = 0; h < 6; ++h) b.push(null);
for (h = 0; h < g; ++h) {
var C = u[h] || e.players && e.players[h] || {}, y = null != C.roomSeatIndex ? C.roomSeatIndex : h;
p.push({
userid: C.userid,
name: C.name || "",
sex: C.sex || 0,
seatindex: h,
roomSeatIndex: y,
arranged: !0
});
b[y] = {
userid: C.userid,
name: C.name || "",
score: 0,
ready: !0
};
}
for (h = 0; h < m.length; ++h) {
var S = m[h];
if (S) {
var N = null != S.roomSeatIndex ? S.roomSeatIndex : h;
b[N] && null != S.totalscore && (b[N].score = S.totalscore);
}
}
i.seats = b;
i.seatIndex = 0;
i.bbSeats = p;
i.bbMySeat = o && null != o.mySeat ? o.mySeat : 0;
i.bbBankerSeat = s && null != s.bankerSeat ? s.bankerSeat : -1;
i.bbBankerMode = !(!s || !s.bankerMode);
i.bbGameType = s && s.gameType || e.type;
i.bbMyCards = o && o.myCards || [];
i.bbMyDaos = null;
i.bbPhase = null;
i.bbArranged = !0;
i.conf = s && s.conf || {};
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
cc.isValid(t.node) && (r ? t.onBbReveal(r) : f.results ? t.applyGameOver(f, null) : t.showTip("该局录像不完整"));
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
this._clearMianTypeLabels();
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
null != e.confirmedCount && (this._confirmCount = e.confirmedCount);
if (t.bbConfirmed) {
this.hideConfirmUI();
this.showTip("已确定 (" + (null != e.confirmedCount ? e.confirmedCount : this._confirmCount) + "/" + (e.total || this._total) + ")，等待其他玩家…");
}
}
},
showConfirmUI: function() {
this._buildConfirmUI();
var e = this._confirmRoot;
if (e) {
for (var t = e.parent; t && t.parent; ) {
t.active || (t.active = !0);
t = t.parent;
}
e.active = !0;
var i = e.parent;
i && e.setSiblingIndex(i.children.length - 1);
this._stopCountdown();
if (this._confirmAutoBtn) {
this._confirmAutoBtn.active = !0;
this._confirmAutoBtn.opacity = 255;
this._setBtnText(this._confirmAutoBtn, "免摆出牌");
this.bindButton(this._confirmAutoBtn, this.onConfirmTap, this);
}
this._confirmCount = 0;
} else console.error("[BB] 场景内找不到 bbConfirm 节点");
},
showMianFreeUI: function() {
this._buildConfirmUI();
var e = this._confirmRoot;
if (e) {
for (var t = e.parent; t && t.parent; ) {
t.active || (t.active = !0);
t = t.parent;
}
e.active = !0;
var i = e.parent;
i && e.setSiblingIndex(i.children.length - 1);
this._stopCountdown();
if (this._confirmAutoBtn) {
this._confirmAutoBtn.active = !0;
this._confirmAutoBtn.opacity = 255;
this._setBtnText(this._confirmAutoBtn, "免摆出牌");
this.bindButton(this._confirmAutoBtn, this.onConfirmMianFree, this);
}
this._confirmCount = 0;
} else console.error("[BB] 场景内找不到 bbConfirm 节点");
},
onConfirmMianFree: function() {
var e = cc.vv.gameNetMgr;
if (this._confirmRoot && this._confirmRoot.active && !e.bbMianConfirmed) {
var t = this._mianDaos() || this.autoArrangeLocal((e.bbMyCards || []).slice());
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
hideConfirmUI: function() {
this._confirmRoot && (this._confirmRoot.active = !1);
this._stopCountdown();
},
onConfirmTap: function() {
var e = cc.vv.gameNetMgr;
if (this._confirmRoot && this._confirmRoot.active && !e.bbConfirmed) {
e.bbConfirmed = !0;
cc.vv.net.send("bb_confirm");
this.hideConfirmUI();
this.showTip("已确定 (" + (this._confirmCount + 1) + "/" + (this._total || 2) + ")，等待其他玩家…");
}
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
var i = cc.vv.gameNetMgr, n = this._watching ? e : (this._mySeat + e) % t, a = i.bbSeats ? i.bbSeats[n] : null, s = a && i.seats ? i.seats[a.roomSeatIndex] : null;
return {
gs: n,
userid: a ? a.userid : null,
name: a && a.name || "",
score: s && null != s.score ? s.score : a && null != a.score ? a.score : null,
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
var a = t.seats || [], s = a.length, o = t.seatIndex >= 0 ? t.seatIndex : 0;
e = Math.max(2, Math.min(6, s));
this._total = e;
for (var r = 0; r < s; ++r) {
var c = (r - o + s) % s;
if (!(c >= e)) {
var l = a[r];
l && l.userid ? i.push({
offset: c,
info: {
gs: r,
userid: l.userid,
name: l.name || "",
score: null != l.score ? l.score : 0,
isBanker: !1,
ready: !!l.ready
}
}) : i.push({
offset: c,
info: {
gs: r,
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
for (var v = this._layoutOf(e), _ = 0; _ < i.length; ++_) {
var f = v[i[_].offset], m = this._seatNodes[f];
if (m) {
m.root.active = !0;
if (i[_].info.empty) {
this.setStr(m.nameLabel, "");
this.setStr(m.scoreLabel, "");
m.zhuang && (m.zhuang.active = !1);
m.readyMark && (m.readyMark.active = !1);
m.okSprite && (m.okSprite.active = !1);
m.icon && (m.icon.active = !1);
if (m.userSprite) {
m.userSprite.active = !0;
m.userSprite.color = cc.Color.WHITE;
}
} else {
m.icon && (m.icon.active = !0);
m.userSprite && (m.userSprite.color = cc.Color.WHITE);
this.setStr(m.nameLabel, i[_].info.name || "");
this.setStr(m.scoreLabel, null != i[_].info.score ? "" + i[_].info.score : "");
m.zhuang && (m.zhuang.active = !1);
m.readyMark && (m.readyMark.active = !!i[_].info.ready);
m.okSprite && (m.okSprite.active = !this._started && !!i[_].info.ready);
if (m.icon) {
var p = m.icon.getComponent("ImageLoader");
if (!p) try {
p = m.icon.addComponent("ImageLoader");
} catch (e) {}
p && i[_].info.userid && p.setUserID(i[_].info.userid);
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
_mianOrder: function(e, t) {
var i = this;
if (490 == t && e && 6 == e.length) {
for (var n = [ 0, 1, 2, 3, 4, 5 ], a = [], s = 0; s < 6; ++s) for (var o = s + 1; o < 6; ++o) a.push([ s, o ]);
for (var r = e.map(function(e) {
return i.dianVal(i.rankOf(e));
}), c = 0; c < a.length; ++c) for (var l = a[c], h = n.filter(function(e) {
return e != l[0] && e != l[1];
}), d = 0; d < h.length; ++d) for (var u = d + 1; u < h.length; ++u) {
var g = [ h[d], h[u] ], v = h.filter(function(e) {
return e != g[0] && e != g[1];
});
if (r[l[0]] + r[l[1]] == 9 && r[g[0]] + r[g[1]] == 9 && r[v[0]] + r[v[1]] == 9) {
var _ = [ [ e[l[0]], e[l[1]] ], [ e[g[0]], e[g[1]] ], [ e[v[0]], e[v[1]] ] ];
_.sort(function(e, t) {
var n = Math.max(i.rankOf(e[0]), i.rankOf(e[1])), a = Math.max(i.rankOf(t[0]), i.rankOf(t[1]));
return n != a ? a - n : i.suitOf(e[0]) - i.suitOf(t[0]);
});
var f = [];
_.forEach(function(e) {
e.sort(function(e, t) {
return i.rankOf(t) - i.rankOf(e) || i.suitOf(e) - i.suitOf(t);
});
f = f.concat(e);
});
return f;
}
}
}
for (var m = {}, p = 0; p < e.length; ++p) {
var b = i.rankOf(e[p]);
(m[b] = m[b] || []).push(e[p]);
}
for (var C = Object.keys(m).map(Number).sort(function(e, t) {
return m[t].length - m[e].length || t - e;
}), y = [], S = 0; S < C.length; ++S) y = y.concat(m[C[S]].slice().sort(function(e, t) {
return i.suitOf(e) - i.suitOf(t);
}));
return y;
},
_mianParts: function(e) {
for (var t = {}, i = 0, n = 0, a = 0; a < (e || []).length; ++a) {
var s = this.rankOf(e[a]);
t[s] = (t[s] || 0) + 1;
s > n && (n = s);
}
for (var o in t) 2 == t[o] && i++;
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
for (var s = 0; s < e; ++s) {
var o = this._seatNodes[this._layoutOf(e)[s]];
if (o && o.root.active) {
var r = this._watching ? s : (this._mySeat + s) % e;
if (!o.cardsNode || o.cardsNode.active) {
var c = this._revealCounts && this._revealCounts[s] || 0, l = c > 0 && this._revealByGs[r] || null, h = !this._watching && 0 == s, d = [], u = !1, g = [ "", "", "" ], v = "";
if (l) {
if (l.mianFree && l.cards && 6 == l.cards.length) {
for (var _ = 0; _ < 3; ++_) {
var f = [ l.cards[2 * _], l.cards[2 * _ + 1] ];
d = d.concat(f);
g[_] = this.daoDescText(f[0], f[1]);
}
v = l.typeName || "";
} else if (l.daos) {
for (var m = 0; m < l.daos.length; ++m) {
d = d.concat(l.daos[m].cards || []);
g[m] = l.daos[m].desc;
}
l.mianFree ? v = l.typeName || "" : l.wulong ? v = "乌龙(三道全输)" : l.auto && (v = "系统自动摆牌");
} else if (l.groups) {
for (var p = 0; p < l.groups.length; ++p) d = d.concat(l.groups[p] || []);
v = l.typeName || "";
}
for (var b = 0; b < 3; ++b) c < 2 * (b + 1) && (g[b] = "");
c < 6 && (v = "");
} else u = !0;
for (var C = 0; C < 6; ++C) {
var y = o.slots[C];
if (y) {
var S = y.getComponent(cc.Sprite);
y.active = !0;
if (u || l && C >= c) {
S && (S.spriteFrame = this._cardBack || null);
y.color = cc.Color.WHITE;
} else if (null != d[C]) {
S && (S.spriteFrame = this.frameOf(d[C]) || this._cardBack || null);
var N = this._arranging && h && !l && this._isUsed(d[C]);
y.color = N ? cc.color(120, 120, 120) : cc.Color.WHITE;
} else y.active = !1;
}
}
for (var M = 0; M < 3; ++M) this.setStr(o.daoLabels[M], g[M]);
this.setStr(o.summary, "baobao_mian" == this._gameType ? "" : v);
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
e && e.myMian && (t.bbMyMian = e.myMian);
var a = (t.bbMyCards || []).slice();
if (t.bbMianFree && t.bbMyMian && t.bbMyMian.cards && t.bbMyMian.cards.length == a.length) a = t.bbMyMian.cards.slice(); else if (a.length > 1) {
for (var s = {}, o = 0; o < a.length; ++o) {
var r = this.rankOf(a[o]);
s[r] = (s[r] || 0) + 1;
}
for (var c = [], l = 0; l < a.length; ++l) {
var h = a[l], d = this.rankOf(h);
c.push({
id: h,
r: d,
s: this.suitOf(h),
n: s[d] || 1
});
}
c.sort(function(e, t) {
return e.n != t.n ? t.n - e.n : e.r != t.r ? t.r - e.r : e.s - t.s;
});
a = c.map(function(e) {
return e.id;
});
}
t.bbMyCards = a;
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
var u = e && e.reveal && e.reveal.players ? e.reveal.players : null;
if (u) {
this._revealByGs = {};
for (var g = 0; g < u.length; ++g) null != u[g].seat && (this._revealByGs[u[g].seat] = u[g]);
this._revealCounts = [];
for (var v = 0; v < (this._total || 2); ++v) this._revealCounts.push(6);
this._revealDone = !0;
} else {
this._revealByGs = {};
this._revealCounts = null;
this._revealDone = !1;
}
this.renderCards();
var _ = cc.vv.gameNetMgr, f = _.seats && _.seatIndex >= 0 ? _.seats[_.seatIndex] : null, m = !(!f || !f.ready);
this._n.readyBtn && (this._n.readyBtn.active = !m);
this._n.exitBtn && (this._n.exitBtn.active = !0);
this.showTip(m ? "本局进行中，结束后自动加入下一局" : "本局进行中，观战中");
} else {
var p = this;
if (e && e.resend) {
this._dealing = !1;
try {
this.renderCards();
this._showPhaseUI(e, t);
} catch (e) {
console.error("[BB] 补发恢复异常", e);
}
} else {
var b = !1;
try {
if (i) {
this._animBusy = !0;
this._clearCards();
this._playShuffleAnim(y);
this.scheduleOnce(function() {
if (!b) {
console.warn("[BB] 洗牌动画未回调, 强制进入发牌");
p._animBusy = !1;
y();
}
}, 2.6);
} else {
this.renderCards();
y();
}
} catch (e) {
console.error("[BB] 开局渲染异常, 兜底直接发牌", e);
this._animBusy = !1;
this._dealing = !1;
y();
}
}
}
function C() {
console.log("[BB][时序] 开始发牌 距收到开局 " + (Date.now() - p._pushAt) + "ms");
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("start_game.mp3");
try {
p._fxStartAnim();
} catch (e) {
console.log("[BB] 开局动画异常", e && e.message);
}
e && e.bankerMode && null != e.bankerSeat && e.bankerSeat >= 0 && p.scheduleOnce(function() {
cc.isValid(p.node) && cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("dingzhuang.mp3");
}, .8);
try {
p._dealSeq(function() {
if (p._started) {
var i = 150 + (p._startFrames && p._startFrames.length ? 50 * p._startFrames.length : 0);
console.log("[BB] 开局动画gate " + i + "ms 后弹阶段弹窗");
p.scheduleOnce(function() {
p._animBusy = !1;
if (p._started && cc.isValid(p.node)) try {
p._showPhaseUI(e, t);
} catch (e) {
console.error("[BB] 阶段UI异常", e);
}
}, i / 1e3);
p._startArrangeWatchdog();
}
});
} catch (i) {
console.error("[BB] 发牌异常, 直接显示阶段UI", i);
p._animBusy = !1;
p._dealing = !1;
try {
p.renderCards();
p._showPhaseUI(e, t);
} catch (e) {
console.error("[BB] 阶段UI异常", e);
}
}
}
function y() {
if (!b) {
b = !0;
C();
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
for (var a = this._total || 2, s = 0; s < a; ++s) this._revealCounts.push(6);
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
var a = e[i].slots[n], s = t[i] && t[i][n];
if (a && s && cc.isValid(a)) {
a.stopAllActions();
a.setPosition(s.x, s.y);
a.setScale(s.sx, s.sy);
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
for (var t = cc.vv.gameNetMgr, i = cc.vv && cc.vv.userMgr && cc.vv.userMgr.userId, n = e.seats || t.bbSeats || [], a = !1, s = 0; s < n.length; ++s) if (n[s] && n[s].userid == i) {
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
for (var o = 0; o < e.players.length; ++o) {
var r = e.players[o];
null != r.seat && (this._revealByGs[r.seat] = r);
}
for (var c = e.players.length, l = [], h = 0; h < (this._total || c); ++h) l.push(0);
this._revealCounts = l;
this._revealDone = !1;
this._revealRunning = !0;
this._resetSlotPos();
this.renderCards();
console.log("[BB] 亮牌开始 座位顺序=" + Object.keys(this._revealByGs).join(",") + " 共" + c + "家 打枪" + this._daqiangList.length + "对 全垒打" + this._quanleidaList.length);
var d = this;
this._playVoice(this._mySex(), "begin");
var u = this._total || 2, g = this._layoutOf(u), v = null != e.bankerSeat && e.bankerSeat >= 0 ? e.bankerSeat : 0;
this._revealOrder = [];
for (var _ = 0; _ < u && this._revealOrder.length < c; ++_) {
var f = (v + _) % u;
this._revealByGs[f] && this._revealOrder.push(f);
}
for (var m = 0; m < e.players.length; ++m) {
var p = e.players[m].seat;
null != p && this._revealOrder.indexOf(p) < 0 && this._revealOrder.push(p);
}
for (var b = 0, C = 0; C < 3; ++C) for (var y = 0; y < this._revealOrder.length; ++y) {
(function(e, i, n) {
d.scheduleOnce(function() {
if (cc.isValid(d.node)) {
var n = d._revealOrder[i], a = d._watching ? n : (n - d._mySeat + u) % u, s = g[a], o = d._revealByGs[n], r = t.bbSeats && t.bbSeats[n] && t.bbSeats[n].name || "";
d.showTip("亮牌 " + r);
d._revealCounts[a] = 2 * (e + 1);
if (null != s) {
d._flipOne(s, 2 * e);
d._flipOne(s, 2 * e + 1);
}
d.renderCards();
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("fanpai.mp3");
o && d._reportDaoVoice(o, e);
o && 2 == e && (o.mianFree || o.groups && !o.daos) && o.typeName && null != s && d._showMianTypeAtSeat(s, o.typeName);
}
}, 1.5 * n);
})(C, y, b);
b++;
}
this.scheduleOnce(function() {
if (cc.isValid(d.node)) try {
d._playDaqiangFx(S);
} catch (e) {
console.log("[BB] 打枪特效异常:", e && e.message);
S();
}
}, 1.5 * b);
}
function S() {
if (!d._revealDone) {
d._revealRunning = !1;
d._revealDone = !0;
d.showTip("");
console.log("[BB] 亮牌结束");
(function() {
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
})();
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
_showMianTypeAtSeat: function(e, t) {
var i = this._seatNodes && this._seatNodes[e];
if (i && i.root) {
this._mianTypeLabels = this._mianTypeLabels || {};
var n = i.mianType && cc.isValid(i.mianType) ? i.mianType : this.findNode(i.root, "bbMianType"), a = null;
if (n) {
a = n;
for (var s = n.parent; s && s !== i.root; ) {
a = s;
s = s.parent;
}
} else {
var o = this._mianTypeLabels[e];
o && cc.isValid(o) && o.destroy();
(n = new cc.Node("bbMianType")).parent = i.root;
n.setPosition(0, 0 == e ? 150 : 110);
var r = n.addComponent(cc.Label);
r.fontSize = 36;
r.lineHeight = 40;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
n.color = new cc.Color(255, 220, 90, 255);
var c = n.addComponent(cc.LabelOutline);
c.color = new cc.Color(120, 40, 0, 255);
c.width = 3;
n._bbDynamic = !0;
a = n;
}
var l = n.getComponent(cc.Label);
l && (l.string = t);
a.active = !0;
this._mianTypeLabels[e] = a;
}
},
_clearMianTypeLabels: function() {
if (this._mianTypeLabels) {
for (var e in this._mianTypeLabels) {
var t = this._mianTypeLabels[e];
t && cc.isValid(t) && (t._bbDynamic ? t.destroy() : t.active = !1);
}
this._mianTypeLabels = {};
}
},
_voiceOfDao: function(e) {
if (!e) return null;
if (0 == ("" + e).indexOf("对") || 0 == ("" + e).indexOf("宝")) return "bao";
var t = ("" + e).match(/^(\d+)/);
return t ? "dian" + +t[1] : null;
},
_playVoice: function(e, t) {
var i = "";
try {
i = cc.sys.localStorage.getItem("bb_voice") || "";
} catch (e) {}
var n = "nv" == i ? "nv" : "nan" == i ? "nan" : 2 == e ? "nv" : "nan";
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("bb/" + n + "/" + t + ".mp3");
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
_animOn: function(e, t, i) {
var n = cc.vv && cc.vv.gameNetMgr, a = n && n.conf && n.conf.taiRules;
if ("string" == typeof a) try {
a = JSON.parse(a);
} catch (e) {
a = null;
}
var s = a ? a[e] : null, o = null == s || isNaN(Number(s)) ? null != i ? i : 0 : Number(s);
return t ? o : o > 0;
},
_playDaqiangFx: function(e) {
var t = this, i = this._animOn("anim_dq", !1, 1) && this._daqiangList || [], n = this._animOn("anim_qld", !1, 1) && this._quanleidaList || [];
if (i.length || n.length) {
var a = 0;
(function s() {
if (cc.isValid(t.node)) if (a >= i.length) if (n.length) {
var o = t._revealByGs[n[0]];
t._playVoice(o && o.sex, "quanleida");
t._fxQuanleida();
t.scheduleOnce(function() {
e && e();
}, 2);
} else e && e(); else {
var r = i[a++], c = t._revealByGs[r.from];
t._playVoice(c && c.sex, "daqiang");
for (var l = 0; l < 3; ++l) setTimeout(function() {
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("da_qiang_one.mp3");
}, 300 * l);
t._fxGunShot(r.from, r.to);
t.scheduleOnce(s, 1.5);
}
})();
} else e && e();
},
_fxQuanleida: function(e) {
var t = this._qldFrames;
if (t && t.length) {
var i = this._tableCenter(), n = this._fxNode(i, "bbFxQld"), a = n.addComponent(cc.Sprite);
a.spriteFrame = t[0];
n.setScale(1.5);
var s = 0, o = t.length, r = setInterval(function() {
if (cc.isValid(n)) if (++s >= o) {
clearInterval(r);
n.destroy();
e && e();
} else a.spriteFrame = t[s]; else {
clearInterval(r);
e && e();
}
}, 60);
} else e && e();
},
_fxStartAnim: function() {
var e = this._startFrames;
if (e && e.length) {
var t = this._tableCenter(), i = this._fxNode(t, "bbFxStart"), n = i.addComponent(cc.Sprite);
n.spriteFrame = e[0];
var a = e[0].getOriginalSize().width, s = e[0].getOriginalSize().height;
i.setScale(.9 * Math.min(cc.winSize.width / a, cc.winSize.height / s));
var o = 0, r = e.length, c = setInterval(function() {
if (cc.isValid(i)) if (++o >= r) {
clearInterval(c);
i.destroy();
} else n.spriteFrame = e[o]; else clearInterval(c);
}, 50);
}
},
_fxGunShot: function(e, t) {
var i = this._total || 2, n = this._watching ? e : (e - this._mySeat + i) % i, a = this._watching ? t : (t - this._mySeat + i) % i, s = this._avatarLocalPos(n), o = this._avatarLocalPos(a), r = this._dqFrames;
if (s && r && r.length) {
var c = this._fxNode(s, "bbFxDq"), l = c.addComponent(cc.Sprite);
l.spriteFrame = r[0];
if (o) {
var h = 180 * Math.atan2(o.y - s.y, o.x - s.x) / Math.PI;
if (o.x < s.x) {
c.scaleX = -.8;
c.scaleY = .8;
c.angle = h + 180;
} else {
c.setScale(.8);
c.angle = h;
}
} else c.setScale(.8);
var d = 0, u = r.length, g = setInterval(function() {
if (cc.isValid(c)) if (++d >= u) {
clearInterval(g);
c.destroy();
} else l.spriteFrame = r[d]; else clearInterval(g);
}, 100);
} else if (s) {
var v = this._fxNode(s, "bbFxDq").addComponent(cc.Graphics);
v.fillColor = cc.color(255, 60, 0, 220);
v.circle(0, 0, 40);
v.fill();
v.node.setScale(.2);
v.node.runAction(cc.sequence(cc.scaleTo(.2, 1), cc.delayTime(.6), cc.fadeOut(.3), cc.removeSelf()));
}
var _ = this._zqFrames;
if (o && _ && _.length) {
var f = this._fxNode(o, "bbFxZq"), m = f.addComponent(cc.Sprite);
m.spriteFrame = _[0];
var p = 0, b = _.length, C = setInterval(function() {
if (cc.isValid(f)) if (++p >= b) {
clearInterval(C);
f.destroy();
} else m.spriteFrame = _[p]; else clearInterval(C);
}, 400);
}
},
_mianDaos: function() {
var e = cc.vv.gameNetMgr, t = e && e.bbMianFree && e.bbMyMian && e.bbMyMian.cards;
return t && 6 == t.length ? [ [ t[0], t[1] ], [ t[2], t[3] ], [ t[4], t[5] ] ] : null;
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
var a = this._mianDaos();
if (a) this._daoSel = [ a[0].slice(), a[1].slice(), a[2].slice() ]; else {
var s = this.autoArrangeLocal((t.bbMyCards || []).slice());
s && (this._daoSel = [ s[0].slice(), s[1].slice(), s[2].slice() ]);
}
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
if (t.bbMianFree && t.bbMyMian) {
this._arrangeRoot && (this._arrangeRoot.active = !1);
this.showMianFreeUI();
} else this.showTip("请摆牌：拖手牌到前/中/后道位，道内牌可再拖动换位，点道内牌退回");
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
this._hideMianOutBtn();
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
for (var e = cc.vv.gameNetMgr, t = this._total || 2, i = this._layoutOf(t), n = e && e.bbSeats || [], a = {}, s = 0; s < n.length; ++s) {
var o = (s - (this._mySeat || 0) + n.length) % n.length;
o >= t || (a[i[o]] = !(!n[s] || !n[s].arranged));
}
for (var r = 0; r < this._seatNodes.length; ++r) {
var c = this._seatNodes[r];
c && c.cardsNode && (c.cardsNode.active = !!a[r]);
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
var s = this._arrangeHandSlots && this._arrangeHandSlots[e] === n && this._arrangeHandHome ? this._arrangeHandHome[e] : this._homeOf(n);
this._dragInfo = {
idx: e,
id: i,
node: n,
home: s,
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
var s = [ this._daoSel[0].slice(), this._daoSel[1].slice(), this._daoSel[2].slice() ];
this._applyPlace(s, i, a);
var o = this._daoOrderErr(s);
if (o) {
this._showArrangeWarn("摆不上：" + o);
var r = i.home || this._homeOf(i.node);
if (r) {
i.node.stopAllActions();
i.node.setPosition(r.x, r.y);
i.node.setScale(r.sx, r.sy);
}
this.renderCards();
return;
}
this._daoSel = s;
this._wulongWarned = !1;
} else null != i.fromD && (this._daoSel[i.fromD][i.fromK] = null);
var c = i.home || this._homeOf(i.node);
if (c) {
i.node.stopAllActions();
i.node.setPosition(c.x, c.y);
i.node.setScale(c.sx, c.sy);
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
var s = n[t.fromK];
n[t.fromK] = n[i.k];
n[i.k] = s;
} else {
n && (n[t.fromK] = null);
a[i.k] = t.id;
}
},
_hitDaoSlot: function(e) {
for (var t = this._arrangeRows || [], i = this._arrangeDaoHome || [], n = null, a = 0, s = 0, o = -1, r = null, c = 0; c < t.length; ++c) {
var l = i[c];
if (l) for (var h = 0; h < 2; ++h) {
var d = t[c].slots[h];
if (d && d.parent && l[h]) {
var u = d.parent.convertToWorldSpaceAR(cc.v2(l[h].x, l[h].y)), g = e.x - u.x, v = e.y - u.y, _ = g * g + v * v;
if (o < 0 || _ < o) {
o = _;
a = g;
s = v;
n = {
d: c,
k: h
};
r = d;
}
}
}
}
if (!n) return null;
var f = .5 * (r ? r.width : 84) + 24, m = .5 * (r ? r.height : 116) + 24;
return a * a / (f * f) + s * s / (m * m) > 1 ? null : n;
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
var s = this._hitHandSlot(n);
s >= 0 && this.onHandTap(s);
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
var s = this._daoFreeSlot(this._daoSel[a]);
if (!(s < 0)) {
var o = [ this._daoSel[0].slice(), this._daoSel[1].slice(), this._daoSel[2].slice() ];
o[a][s] = t;
if (this._daoOrderOkWith(o)) {
this._daoSel = o;
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
var s = (this._arrangeRows || [])[e], o = s && s.slots ? s.slots[t] : null;
if (o) {
var r = this._arrangeDaoHome ? this._arrangeDaoHome[e] : null;
this._dragInfo = {
idx: (cc.vv.gameNetMgr.bbMyCards || []).indexOf(a),
id: a,
node: o,
home: r ? r[t] : this._homeOf(o),
fromD: e,
fromK: t,
startPos: i.touch.getLocation(),
moved: !1
};
this._dragTopBegin(o);
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
var s = a.getComponent(cc.Sprite);
s && (s.spriteFrame = this.frameOf(i[n]) || this._cardBack || null);
a.color = cc.Color.WHITE;
} else a.active = !1;
}
this.setStr(t.desc, this._daoFull(i) ? this.daoDescText(i[0], i[1]) : "");
}
if (this._arrangeHandSlots) for (var o = cc.vv.gameNetMgr.bbMyCards || [], r = 0; r < this._arrangeHandSlots.length; ++r) {
var c = this._arrangeHandSlots[r];
if (c) {
var l = o[r];
if (null != l) {
var h = this._isUsed(l);
c.active = !h;
if (!h) {
var d = c.getComponent(cc.Sprite);
d && (d.spriteFrame = this.frameOf(l) || this._cardBack || null);
c.color = cc.Color.WHITE;
}
} else c.active = !1;
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
if (this._arranging) if (this._daoFull(this._daoSel[0]) && this._daoFull(this._daoSel[1]) && this._daoFull(this._daoSel[2])) if (this._daoOrderOkLocal() || this._wulongWarned || cc.vv.gameNetMgr && cc.vv.gameNetMgr.bbMianFree) {
cc.vv.net.send("bb_arrange", {
front: this._daoSel[0].slice(),
mid: this._daoSel[1].slice(),
back: this._daoSel[2].slice()
});
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("sort.wav");
cc.vv.gameNetMgr.bbArranged = !1;
this._arranging = !1;
this._hideMianOutBtn();
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
_showMianOutBtn: function(e, t, i) {
this._hideMianOutBtn();
var n = e || this._arrangeRoot;
if (n) {
var a = cc.vv.gameNetMgr, s = a && a.bbMyMian, o = new cc.Node("bbMianOutBtn");
o.parent = n;
o.setPosition(0, null == i ? -150 : i);
o.setContentSize(340, 120);
o.setSiblingIndex(n.children.length - 1);
var r = new cc.Node("typeName");
r.parent = o;
r.setPosition(0, 78);
var c = r.addComponent(cc.Label);
c.string = "免摆牌型：" + (s ? s.typeName : "") + "  ×" + (s && s.rate || 1);
c.fontSize = 30;
c.lineHeight = 34;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
var l = c.node.color;
l.setR(255);
l.setG(220);
l.setB(90);
var h = new cc.Node("bg");
h.parent = o;
h.setContentSize(320, 88);
var d = h.addComponent(cc.Graphics);
d.fillColor = new cc.Color(30, 140, 60, 255);
d.roundRect(-160, -44, 320, 88, 16);
d.fill();
d.strokeColor = new cc.Color(255, 220, 90, 255);
d.lineWidth = 3;
d.roundRect(-160, -44, 320, 88, 16);
d.stroke();
var u = new cc.Node("label");
u.parent = h;
var g = u.addComponent(cc.Label);
g.string = "免摆出牌";
g.fontSize = 42;
g.lineHeight = 46;
g.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
var v = h.addComponent(cc.Button);
v.transition = cc.Button.Transition.SCALE;
v.duration = .08;
var _ = this;
h.on(cc.Node.EventType.TOUCH_END, function() {
_._playVoice(_._mySex(), "lipai");
(t || _.onConfirmArrange).call(_);
});
this._mianOutBtn = o;
}
},
_hideMianOutBtn: function() {
if (this._mianOutBtn) {
cc.isValid(this._mianOutBtn) && this._mianOutBtn.destroy();
this._mianOutBtn = null;
}
},
onAutoArrange: function() {
if (this._arranging) {
var e = cc.vv.gameNetMgr, t = this._mianDaos() || this.autoArrangeLocal(e.bbMyCards || []);
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
var a = this.dianVal(i), s = this.dianVal(n);
return {
bao: !1,
point: (a + s) % 10,
sum: a + s,
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
return 2 == i ? 0 : 3 != i ? this._cmpSuit(e.maxSuit, t.maxSuit) : e.maxRank != t.maxRank ? e.maxRank > t.maxRank ? 1 : -1 : this._cmpSuit(e.maxSuit, t.maxSuit);
},
_applyBbConf: function(e) {
var t = cc.vv && cc.vv.gameNetMgr;
e && e.conf && t && (t.conf = e.conf);
var i = e && e.conf;
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
for (var s = 0; s < 3; ++s) if (i[s]) for (var o = s + 1; o < 3; ++o) if (i[o] && this._cmpD(i[s], i[o]) < 0) return t[s] + "不能小于" + t[o];
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
for (var t = this._evalD.bind(this), i = this._cmpD.bind(this), n = this._cmpArrange.bind(this), a = null, s = null, o = [ 0, 1, 2, 3, 4, 5 ], r = [], c = 0; c < 6; ++c) for (var l = c + 1; l < 6; ++l) r.push([ c, l ]);
function h(e, t) {
if (!t) return !0;
for (var i = 0; i <= 2; ++i) {
var a = n(e[i], t[i]);
if (0 != a) return a > 0;
}
return !1;
}
for (var d = 0; d < r.length; ++d) for (var u = r[d], g = o.filter(function(e) {
return e != u[0] && e != u[1];
}), v = 0; v < g.length; ++v) for (var _ = v + 1; _ < g.length; ++_) for (var f = [ g[v], g[_] ], m = g.filter(function(e) {
return e != f[0] && e != f[1];
}), p = [ t(e[u[0]], e[u[1]]), t(e[f[0]], e[f[1]]), t(e[m[0]], e[m[1]]) ], b = [ [ 0, 1, 2 ], [ 0, 2, 1 ], [ 1, 0, 2 ], [ 1, 2, 0 ], [ 2, 0, 1 ], [ 2, 1, 0 ] ], C = 0; C < b.length; ++C) {
var y = b[C], S = [ p[y[0]], p[y[1]], p[y[2]] ];
if (!(i(S[0], S[1]) < 0 || i(S[1], S[2]) < 0) && h(S, a)) {
a = S;
s = [ S[0].cards.slice(), S[1].cards.slice(), S[2].cards.slice() ];
}
}
s || 6 != e.length || (s = [ [ e[0], e[1] ], [ e[2], e[3] ], [ e[4], e[5] ] ]);
var N = this;
s.forEach(function(e) {
e.sort(function(e, t) {
return N.rankOf(t) - N.rankOf(e) || N.suitOf(e) - N.suitOf(t);
});
});
return s;
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
for (var s = cc.vv.userMgr && cc.vv.userMgr.userId, o = !1, r = 0; r < a.length; ++r) if (a[r] && a[r].userid == s) {
o = !0;
break;
}
if (o) {
this._overRound = n;
for (var c = 0, l = 0; l < a.length; ++l) if (a[l] && a[l].userid == s) {
c = a[l].delta || 0;
break;
}
if (cc.vv && cc.vv.audioMgr) {
cc.vv.audioMgr.playSFX(c > 0 ? "win.wav" : "lose.wav");
if (0 != c) {
var h = this;
this.scheduleOnce(function() {
cc.isValid(h.node) && cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("dropCoin.wav");
}, .5);
}
}
var d = i.bbBankerSeat, u = i.bbMySeat;
if ((null == u || u < 0) && i.bbSeats) for (var g = 0; g < i.bbSeats.length; ++g) if (i.bbSeats[g] && i.bbSeats[g].userid == s) {
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
for (var s = 0, o = !1, r = 0; r < n.length; ++r) {
var c = n[r];
if (c.a == u && c.b == t || c.a == t && c.b == u) {
o = !0;
c.winner == t ? s += c.score || 0 : s -= c.score || 0;
}
}
return o ? s : null;
}, _ = [], f = 0; f < a.length; ++f) {
var m = a[f];
if (m) {
var p = (m.name || "") + (i.bbBankerMode && i.bbSeats && i.bbSeats[d] && i.bbSeats[d].userid == m.userid ? "(庄)" : ""), b = "";
if (m.mianFree && m.typeName) b = m.typeName + "免摆"; else if (m.daos) {
b = (m.daos || []).map(function(e) {
return e.desc;
}).join(" ");
m.wulong && (b = "乌龙 " + b);
} else m.typeName && (b = m.typeName || "");
var C = m.delta || 0;
if (m.userid == s) _.push(p + "  " + b + "  本局 " + (C > 0 ? "+" : "") + C + "  (总:" + (null != m.totalscore ? m.totalscore : 0) + ")"); else {
var y = v(m.userid);
_.push(p + "  " + b + "  与我 " + (null == y ? "0" : (y > 0 ? "+" : "") + y));
}
}
}
var S = i.overData || {}, N = !(!e || !e.endinfo) || !!S.endinfo || i.maxNumOfGames > 0 && i.numOfGames >= i.maxNumOfGames, M = !(!e || !e.roomEnd) || !!S.roomEnd;
N && (M = !1);
this._final = N;
this._roomEnd = M;
this._arranging = !1;
this._inArrangePhase = !1;
this.hideArrangeUI();
this.hideConfirmUI();
this._n.bbMidCd && this._setMidCd(!1);
this._n.resultPanel && (this._n.resultPanel.active = !0);
this._clearMianTypeLabels();
this._ensureSettleBtnFrames();
this._setSettleActionBtn(M ? "退出房间" : "继续游戏", M);
if (this._resultShuffleBtn) {
var B = N || M;
this._resultShuffleBtn.active = !0;
this._resultShuffleBtn.opacity = B ? 120 : 255;
B ? this._resultShuffleBtn.off(cc.Node.EventType.TOUCH_END) : this.bindButton(this._resultShuffleBtn, this.onResultShuffle, this);
}
this._n.resultExitBtn && (this._n.resultExitBtn.active = !1);
this._settle1Done = !N;
this._setSettleContentStyle(this._settleFontSize, this._settleLineHeight, this._settleContentY);
this.setStr(this._n.resultContent, _.join("\n"));
if (this._n.settleRound) {
this._n.settleRound.active = !0;
this.setStr(this._n.settleRound, i.maxNumOfGames > 0 ? "第" + i.numOfGames + "/" + i.maxNumOfGames + "局" : "第" + i.numOfGames + "局");
}
this._lastLines = _.slice();
var w = !1;
try {
w = this._renderSettleCards(a, i.bbOverDetails || null);
} catch (e) {
console.error("[BB] 结算明牌渲染异常", e);
}
this._n.resultContent && (this._n.resultContent.active = !w);
this._n.resultList && (this._n.resultList.active = !1);
this._n.slSprite && (this._n.slSprite.active = c > 0);
this._n.sbSprite && (this._n.sbSprite.active = c < 0);
this._n.hjSprite && (this._n.hjSprite.active = 0 === c);
this._n.resultTitle && (this._n.resultTitle.active = !1);
this._n.disbandBtn && (this._n.disbandBtn.active = !N);
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
var T = this;
this.scheduleOnce(function() {
cc.isValid(T.node) && !T._leaving && T.onExitRoom();
}, 1.2);
}
this._stopCountdown();
this._settleCd && this.setStr(this._settleCd, "");
if (this._settleCd && !M) {
var A;
A = e && null != e.resultRemainTotal ? this._leftOf(e.resultRemainTotal, this._overAt) : e && null != e.resultRemain ? e.resultRemain : null != i.bbResultRemain ? i.bbResultRemain : i.bbResultTimeout || 0;
this._startCountdown(A, this._settleCd, function() {
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
var s = i.width, o = i.height, r = function(a) {
if (a && a.texture && a.texture.width) {
e._settleBtnFrames[t[2]] = a;
if (cc.isValid(n) && cc.isValid(i)) {
n.spriteFrame = a;
i.width = s;
i.height = o;
}
}
}, c = cc.resources.get(t[1], cc.SpriteFrame);
if (c && c.texture && c.texture.width > 0) r(c); else {
var l = e._settleBtnSceneFrames[t[2]];
l && (n.spriteFrame = l);
cc.resources.load(t[1], cc.SpriteFrame, function(e, i) {
!e && i ? r(i) : console.log("[BB] 结算按钮贴图加载失败:", t[1], e && e.message);
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
var i = 800, n = t.height > 100 ? Math.round(t.height) : 400, a = t.x || 0, s = t.y || 0, o = this.findNode(t, "bbSettleRow");
if (o && o.children) for (var r = 0; r < o.children.length; ++r) {
var c = o.children[r], l = Math.abs(c.x) + c.width / 2 + 10;
2 * l > i && (i = Math.ceil(2 * l));
}
var h = t.parent && "bbSettleScroll" === t.parent.name ? t.parent : null;
if (!h) {
(h = new cc.Node("bbSettleScroll")).parent = e;
h.setContentSize(i, n);
h.setPosition(a, s);
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
for (var n = this._settleRowTpl, a = i.children.slice(), s = 0; s < a.length; ++s) a[s] !== n && a[s].destroy();
if (!this._n.resultPanel || !e) {
i.active = !1;
return !1;
}
var o, r = cc.vv.gameNetMgr, c = cc.vv.userMgr ? cc.vv.userMgr.userId : null, l = r.bbMySeat, h = null;
if ((null == l || l < 0) && r.bbSeats) for (o = 0; o < r.bbSeats.length; ++o) if (r.bbSeats[o] && r.bbSeats[o].userid == c) {
l = o;
break;
}
for (o = 0; o < e.length; ++o) if (e[o] && e[o].userid == c) {
h = e[o];
break;
}
if (!h || null == l || l < 0) {
i.active = !1;
return !1;
}
for (var d = r.bbBankerMode ? r.bbBankerSeat : -1, u = [], g = this._total || 2, v = 0; v < g; ++v) v != l && (d >= 0 && l != d && v != d || u.push(v));
var _ = function(t) {
for (var i = r.bbSeats && r.bbSeats[t] ? r.bbSeats[t].userid : -1, n = 0; n < e.length; ++n) if (e[n] && e[n].userid == i) return e[n];
return null;
};
i.active = !0;
u.length;
var f = this._settleRowTpl && this._settleRowTpl.height || 75, m = this._settleViewH || 400, p = Math.floor(m / 6), b = Math.min(1, p / f);
i.setContentSize(this._settleViewW || 840, m);
var C, y = 0, S = this, N = this._settleRowTpl, M = function(e, t, n) {
var a = (e.name || "") + (t == l ? "(我)" : "") + (t == d ? "(庄)" : ""), s = [], o = "";
if (!e.mianFree && e.daos) {
for (var r = 0; r < e.daos.length; ++r) {
var c = e.daos[r].cards || [];
s.push(c[0], c[1]);
}
o = e.daos.map(function(e) {
return e.desc;
}).join(" ");
e.wulong && (o = "乌龙 " + o);
} else {
s = S._mianOrder(e.holds || [], e.typeKey);
var h = e.typeName || "";
(e.mianFree || "baobao_mian" == S._gameType && e.typeKey > 0) && (h += "免摆");
var u = 0 == e.typeKey || "散牌" == h ? S._mianParts(e.holds) : "";
o = h + (u ? "(" + u + ")" : "");
}
var g = "string" == typeof n ? n : null == n ? "0" : (n > 0 ? "+" : "") + n, v = -p * (y + .5);
y++;
if (N && cc.isValid(N)) {
var _ = cc.instantiate(N);
_.active = !0;
_.parent = i;
_.setPosition(0, v);
_.setScale(b);
S.setStr(S.findNode(_, "rowName"), a);
var f = S.findNode(_, "rowDesc");
S.setStr(f, o);
f && (f.active = !!o);
S.setStr(S.findNode(_, "rowScore"), g);
var m = S.findNode(_, "rowIcon");
if (m) {
var C = m.getComponent("ImageLoader");
if (C && e.userid) {
m.active = !0;
C.setUserID(e.userid);
} else if (C) {
m.active = !0;
C.clearAvatar();
}
}
for (var M = 0; M < 6; ++M) {
var B = S.findNode(_, "card" + M);
if (B) if (null != s[M]) {
B.active = !0;
var w = B.getComponent(cc.Sprite);
w && (w.spriteFrame = S.jsFrameOf(s[M]) || S.frameOf(s[M]) || S._cardBack || null);
} else B.active = !1;
}
}
}, B = h.delta || 0;
M(h, l, (B > 0 ? "+" : "") + B);
for (var w = 0; w < u.length; ++w) {
var T = _(u[w]);
T && M(T, u[w], (C = T) && null != C.delta ? C.delta : 0);
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
var n = cc.vv.gameNetMgr || {}, a = n.conf || {}, s = n.getWanfa && n.getWanfa() || "", o = null != a.cost ? a.cost : null != a.fangka ? a.fangka : "管理员", r = null != a.rate ? a.rate : null != a.multiple ? a.multiple : 1, c = new Date(), l = function(e) {
return e < 10 ? "0" + e : "" + e;
}, h = c.getFullYear() + "-" + (c.getMonth() + 1) + "-" + c.getDate() + " " + l(c.getHours()) + ":" + l(c.getMinutes()) + ":" + l(c.getSeconds());
this.setStr(t.finalInfo, "房号：" + (n.roomId || "") + "   " + s + "    扣费:" + o + "   倍率:" + r + "倍    " + h);
for (var d = -Infinity, u = 0; u < e.length; ++u) {
var g = Number(e[u].score) || 0;
g > d && (d = g);
}
for (var v = Math.min(t.finalCards.length, e.length), _ = (t.finalCards[0] && t.finalCards[0].root.width || 180) + 8, f = -(v - 1) * _ / 2, m = 0; m < t.finalCards.length; ++m) {
var p = t.finalCards[m], b = m < v;
p.root.active = b;
if (b) {
p.root.setPosition(f + m * _, p.root.y);
var C = e[m] || {}, y = Number(C.score) || 0, S = y > 0 && y == d;
p.win && (p.win.active = S);
p.bg && (p.bg.color = y > 0 ? cc.color(255, 132, 112) : y < 0 ? cc.color(128, 166, 255) : cc.color(235, 235, 235));
if (p.avatar) {
var N = p.avatar.getComponent("ImageLoader");
if (!N) try {
N = p.avatar.addComponent("ImageLoader");
} catch (e) {}
N && C.userid && N.setUserID(C.userid);
}
this.setStr(p.name, C.name || "");
this.setStr(p.id, null != C.userid ? "ID:" + C.userid : "");
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
var a = this._tableCenter(), s = null;
if (this._qiepaiSpine) {
var o = (s = this._fxNode(a, "bbFxQiepaiSpine")).addComponent(sp.Skeleton);
o.skeletonData = this._qiepaiSpine;
o.premultipliedAlpha = !1;
o.setAnimation(0, "animation", !1);
} else console.log("[BB] qiepai spine 未就绪, 本次跳过洗牌画面");
this.scheduleOnce(function() {
cc.isValid(t.node) && cc.isValid(s) && s.destroy();
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
var n = this._wanfaxuanze[0].checked, a = this._wanfaxuanze[1].checked, s = this._wanfaxuanze[2].checked, o = this._wanfaxuanze[3].checked, r = 0;
for (t = 0; t < this._zuidafanshu.length; ++t) if (this._zuidafanshu[t].checked) {
r = t;
break;
}
var c = 0;
for (t = 0; t < this._jushuxuanze.length; ++t) if (this._jushuxuanze[t].checked) {
c = t;
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
zuidafanshu: r,
jushuxuanze: c,
dianganghua: l,
menqing: s,
tiandihu: o
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
DeskStyle: [ function(e, t) {
"use strict";
cc._RF.push(t, "7c8d94PGitMPY6fChssPU5f", "DeskStyle");
var i = [ {
name: "经典绿",
color: cc.color(36, 92, 56)
}, {
name: "宝石蓝",
color: cc.color(30, 58, 118)
}, {
name: "深咖啡",
color: cc.color(74, 46, 30)
} ];
function n(e, t) {
try {
var i = cc.sys.localStorage.getItem(e);
return null == i || "" === i ? t : JSON.parse(i);
} catch (e) {
return t;
}
}
function a(e, t) {
try {
cc.sys.localStorage.setItem(e, JSON.stringify(t));
} catch (e) {}
}
function s(e, t, i, n, a, s, o, r, c) {
var l = new cc.Node(t);
e.addChild(l);
l.setPosition(i, n);
var h = l.addComponent(cc.Sprite);
h.sizeMode = void 0 === c ? cc.Sprite.SizeMode.CUSTOM : c;
r && (h.spriteFrame = r);
o && (l.color = o);
l.setContentSize(a, s);
return l;
}
function o(e, t, i, n, a, s, o) {
var r = new cc.Node(t);
e.addChild(r);
r.setPosition(a, s);
var c = r.addComponent(cc.Label);
c.string = i;
c.fontSize = n;
c.lineHeight = n + 4;
o && (r.color = o);
return r;
}
function r(e, t, i, n, a) {
var s = e.getComponent(cc.Button) || e.addComponent(cc.Button);
s.transition = cc.Button.Transition.SCALE;
s.duration = .1;
s.zoomScale = .95;
var o = new cc.Component.EventHandler();
o.target = t;
o.component = i;
o.handler = n;
o.customEventData = a || "";
s.clickEvents.push(o);
return s;
}
cc.Class({
extends: cc.Component,
properties: {
_bgIndex: 0,
_cardScale: 1,
_bgSpr: null,
_panel: null,
_scaleLabel: null,
_bgNameLabel: null,
_slider: null,
_baseScales: null,
_gestureMultiSelect: !1,
_gestureSwipeUp: !1,
_mjPlayMode: "single"
},
onLoad: function() {
if (null != cc.vv) {
cc.vv.deskStyle = this;
this._bgIndex = n("mj_table_bg", 0);
this._cardScale = n("mj_card_scale_v2", 1);
("number" != typeof this._cardScale || this._cardScale < 1 || this._cardScale > 1.5) && (this._cardScale = 1);
this._gestureMultiSelect = !!n("gesture_multi_select", !1);
this._gestureSwipeUp = !!n("mj_gesture_swipe_up", !1);
var e = n("mj_play_mode", "single");
this._mjPlayMode = "double" === e ? "double" : "single";
var t = cc.find("Canvas/bg");
if (t && t.children.length > 0) {
this._bgSpr = t.children[0].getComponent(cc.Sprite);
this._bgSpr && (this._defaultFrame = this._bgSpr.spriteFrame);
}
var i = this;
cc.resources.load("images/ui/white", cc.SpriteFrame, function(e, t) {
if (!e && t) {
i._whiteFrame = t;
i._applyBg();
}
});
var a = cc.find("Canvas/popups/settings/btn_desk_bg"), s = a ? a.getChildByName("lbl_desk_bg") : null;
this._bgNameLabel = s ? s.getComponent(cc.Label) : null;
var o = cc.find("Canvas/popups/settings/card_scale/slider");
if (o) {
this._slider = o.getComponent(cc.Slider);
var r = o.parent ? o.parent.getChildByName("lbl_card_scale") : null;
this._scaleLabel = r ? r.getComponent(cc.Label) : null;
if (this._slider) {
if (this._slider.handle && !this._slider.handle.node) {
console.warn("[DeskStyle] slider handle 引用损坏, 运行时重建");
var c = o.getChildByName("Handle") || o.getChildByName("handle");
if (!c) {
c = new cc.Node("Handle");
o.addChild(c);
c.setContentSize(44, 44);
var l = c.addComponent(cc.Sprite);
l.sizeMode = cc.Sprite.SizeMode.CUSTOM;
this._whiteFrame && (l.spriteFrame = this._whiteFrame);
c.color = cc.color(255, 214, 90);
}
var h = c.getComponent(cc.Button);
h || (h = c.addComponent(cc.Button));
this._slider.handle = h;
}
try {
this._slider.progress = (this._cardScale - 1) / .5;
} catch (e) {
console.warn("[DeskStyle] slider progress 设置失败, 跳过: " + e.message);
}
var d = new cc.Component.EventHandler();
d.target = this.node;
d.component = "DeskStyle";
d.handler = "onCardScaleSlide";
this._slider.slideEvents.push(d);
}
}
this._buildGestureSettings();
this._syncSettingLabels();
this.scheduleOnce(function() {
i._applyCardScale();
}, 0);
}
},
onCardScaleSlide: function(e) {
this._cardScale = 1 + .5 * e.progress;
a("mj_card_scale_v2", Math.round(100 * this._cardScale) / 100);
this._applyCardScale();
this._syncSettingLabels();
},
_buildGestureSettings: function() {
var e = cc.find("Canvas/popups/settings");
if (e) {
var t = e.getChildByName("gesture_section");
if (t) {
this._bindGestureItem(t, "gesture_multi", "onToggleMultiSelect");
this._bindGestureItem(t, "gesture_swipe", "onToggleSwipeUp");
this._bindGestureItem(t, "play_single", "onPickPlayMode", "single");
this._bindGestureItem(t, "play_double", "onPickPlayMode", "double");
this._refreshGestureUI();
} else console.warn("[DeskStyle] 场景缺少 settings/gesture_section, 出牌手势设置不可用(请在场景中补节点)");
}
},
_bindGestureItem: function(e, t, i, n) {
var a = e.getChildByName(t);
a ? r(a, this.node, "DeskStyle", i, n) : console.warn("[DeskStyle] gesture_section 缺少子节点: " + t);
},
onToggleMultiSelect: function() {
this._gestureMultiSelect = !this._gestureMultiSelect;
a("gesture_multi_select", this._gestureMultiSelect);
this._refreshGestureUI();
},
onToggleSwipeUp: function() {
this._gestureSwipeUp = !this._gestureSwipeUp;
a("mj_gesture_swipe_up", this._gestureSwipeUp);
this._refreshGestureUI();
},
onPickPlayMode: function(e, t) {
this._mjPlayMode = "double" === t ? "double" : "single";
a("mj_play_mode", this._mjPlayMode);
this._refreshGestureUI();
},
_refreshGestureUI: function() {
var e = cc.find("Canvas/popups/settings");
if (e) {
var t = e.getChildByName("gesture_section");
if (t) {
var i = t.getChildByName("gesture_multi");
if (i) {
var n = i.getChildByName("check");
n && (n.active = this._gestureMultiSelect);
}
var a = t.getChildByName("gesture_swipe");
if (a) {
var s = a.getChildByName("check");
s && (s.active = this._gestureSwipeUp);
}
var o = t.getChildByName("play_single");
if (o) {
var r = o.getChildByName("inner");
r && (r.active = "single" === this._mjPlayMode);
}
var c = t.getChildByName("play_double");
if (c) {
var l = c.getChildByName("inner");
l && (l.active = "double" === this._mjPlayMode);
}
}
}
},
getGestureSettings: function() {
return {
multiSelect: this._gestureMultiSelect,
swipeUp: this._gestureSwipeUp,
playMode: this._mjPlayMode
};
},
openBgChoose: function() {
if (this._panel) {
this._panel.active = !0;
this._refreshPanel();
} else if (this._whiteFrame) this._buildPanel(); else {
var e = this;
cc.resources.load("images/ui/white", cc.SpriteFrame, function(t, i) {
if (!t && i) {
e._whiteFrame = i;
e._applyBg();
e.openBgChoose();
}
});
}
},
_applyBg: function() {
if (this._bgSpr) {
var e = this._bgIndex;
if (e <= 0) {
if (this._defaultFrame) {
this._bgSpr.spriteFrame = this._defaultFrame;
this._bgSpr.node.color = cc.Color.WHITE;
}
} else {
var t = i[e - 1];
if (t && this._whiteFrame) {
this._bgSpr.spriteFrame = this._whiteFrame;
this._bgSpr.node.color = t.color;
}
}
}
},
_applyCardScale: function() {
var e = this._cardScale, t = cc.find("Canvas/game");
if (t) {
this._baseScales || (this._baseScales = new Map());
for (var i = [ "myself" ], n = [ "holds", "penggangs", "folds", "ChuPai", "hupailist" ], a = 0; a < i.length; ++a) {
var s = t.getChildByName(i[a]);
if (s) for (var o = 0; o < n.length; ++o) {
var r = s.getChildByName(n[o]);
if (r) {
var c = this._baseScales.get(r.uuid);
if (null == c) {
c = r.scaleX;
this._baseScales.set(r.uuid, c);
}
r.scaleX = c * e;
r.scaleY = c * e;
}
}
}
var l = t.getChildByName("ops");
if (l) {
var h = this._baseScales.get(l.uuid);
if (null == h) {
h = l.scaleX;
this._baseScales.set(l.uuid, h);
}
var d = 1 + .5 * (e - 1);
l.scaleX = h * d;
l.scaleY = h * d;
}
}
},
_buildPanel: function() {
var e = cc.find("Canvas/popups");
if (e && this._whiteFrame) {
var t = new cc.Node("bg_choose");
e.addChild(t);
t.zIndex = 99;
t.setContentSize(e.getContentSize());
t.setPosition(0, 0);
this._panel = t;
r(s(t, "mask", 0, 0, t.width, t.height, cc.color(0, 0, 0, 160), this._whiteFrame), this.node, "DeskStyle", "_onMaskClick");
var n = s(t, "panel", 0, 0, 620, 380, cc.color(46, 34, 28), this._whiteFrame);
o(n, "title", "选择桌面背景", 34, 0, 150, cc.color(255, 230, 180));
for (var a = 0; a < i.length; ++a) {
var c = new cc.Node("item" + a);
n.addChild(c);
c.setPosition(200 * a - 200, 0);
c.setContentSize(180, 240);
r(c, this.node, "DeskStyle", "_onPickBg", String(a + 1));
s(c, "preview", 0, 30, 160, 100, i[a].color, this._whiteFrame);
o(c, "name", i[a].name, 28, 0, -55, cc.Color.WHITE);
var l = s(c, "selected", 0, 30, 172, 112, null, null);
l.active = !1;
var h = cc.color(255, 196, 0);
s(l, "t", 0, 53, 172, 6, h, this._whiteFrame);
s(l, "b", 0, -53, 172, 6, h, this._whiteFrame);
s(l, "l", -83, 0, 6, 112, h, this._whiteFrame);
s(l, "r", 83, 0, 6, 112, h, this._whiteFrame);
}
var d = new cc.Node("btn_default");
n.addChild(d);
d.setPosition(0, -150);
d.setContentSize(200, 56);
s(d, "bg", 0, 0, 200, 56, cc.color(96, 74, 60), this._whiteFrame);
o(d, "label", "恢复默认", 28, 0, 0, cc.Color.WHITE);
r(d, this.node, "DeskStyle", "_onPickBg", "0");
this._refreshPanel();
}
},
_refreshPanel: function() {
if (this._panel) for (var e = this._panel.getChildByName("panel"), t = 0; t < i.length; ++t) {
var n = e.getChildByName("item" + t);
n && (n.getChildByName("selected").active = this._bgIndex === t + 1);
}
},
_onPickBg: function(e, t) {
this._bgIndex = parseInt(t, 10) || 0;
a("mj_table_bg", this._bgIndex);
this._applyBg();
this._refreshPanel();
this._syncSettingLabels();
this._panel && (this._panel.active = !1);
},
_onMaskClick: function() {
this._panel && (this._panel.active = !1);
},
_syncSettingLabels: function() {
this._bgNameLabel && (this._bgNameLabel.string = "桌面背景: " + (0 === this._bgIndex ? "默认" : i[this._bgIndex - 1].name));
this._scaleLabel && (this._scaleLabel.string = Math.round(100 * this._cardScale) + "%");
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
var s = a.children[i];
this.tips.push(s.getComponent(cc.Label));
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
var a = 65535, s = 0;
for (i = 0; i < t.length; ++i) if (t[i] < a) {
a = t[i];
s = i;
}
var o = [ "tong", "tiao", "wan" ];
for (i = 0; i < o.length; ++i) {
var r = this.queYiMen.getChildByName(o[i]);
s == i ? r.getComponent(cc.Animation).play("dingque_tuijian") : r.getComponent(cc.Animation).stop();
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
this._initDirMarker();
this.initAllFolds();
}
},
_initDirMarker: function() {
this._dirFrame = null;
this._dirMarker = null;
if (null != this.node.getComponent("MJGameZJLAO")) {
var e = this;
cc.loader.loadRes("images/atlas/baoqei_a", cc.SpriteAtlas, function(t, i) {
if (!t && i) {
e._dirFrame = i.getSpriteFrame("方向标");
console.log("[folds] 方向标图集加载完成 frame=", !!e._dirFrame);
} else console.warn("[folds] 方向标图集加载失败", t);
});
}
},
_isZjlao: function() {
return null != this.node.getComponent("MJGameZJLAO");
},
initView: function() {
this._folds = {};
for (var e = this.node.getChildByName("game"), t = [ "myself", "right", "up", "left" ], i = 0; i < t.length; ++i) {
var n = t[i], a = e.getChildByName(n);
if (null != a) {
for (var s = [], o = a.getChildByName("folds"), r = 0; r < o.children.length; ++r) {
var c = o.children[r];
c.active = !1;
var l = c.getComponent(cc.Sprite);
l.spriteFrame = null;
s.push(l);
}
this._folds[n] = s;
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
this.node.on("game_chupai_notify", function(t) {
e.initAllFolds();
var i = t.detail, n = i && (i.seatData || i);
if (n && n.folds && n.folds.length > 0) {
e._flyLastFold(n);
var a = e._lastFoldNode(n);
a && e._showDirMarker(a);
}
});
this.node.on("peng_notify", function() {
e.initAllFolds();
e._hideDirMarker();
});
this.node.on("gang_notify", function() {
e.initAllFolds();
e._hideDirMarker();
});
this.node.on("chi_notify", function() {
e.initAllFolds();
e._hideDirMarker();
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
var i = cc.vv.gameNetMgr.getLocalIndex(e.seatindex), n = cc.vv.mahjongmgr.getFoldPre(i), a = cc.vv.mahjongmgr.getSide(i), s = this._folds[a];
if (0 != s.length) {
for (var o = s[0].node.parent, r = s[0].node.y, c = 0, l = 0; l < s.length; ++l) Math.abs(s[l].node.y - r) < 1 && c++;
c <= 0 && (c = s.length);
var h = 0;
c < s.length && (h = s[c].node.y - r);
0 == h && (h = -40);
var d = 3 * c;
if (d > s.length) for (var u = s.length; u < d; ++u) {
var g = u % c, v = Math.floor(u / c), _ = cc.instantiate(s[g].node);
_.y = r + h * v;
_.active = !1;
o.addChild(_);
s.push(_.getComponent(cc.Sprite));
} else d = s.length;
this._foldLayout || (this._foldLayout = {});
this._foldLayout[a] = {
perRow: c,
maxSlots: d
};
this._foldStacks || (this._foldStacks = {});
for (var f = this._foldStacks[a] || [], m = 0; m < f.length; ++m) cc.isValid(f[m]) && f[m].destroy();
var p = [];
this._foldStacks[a] = p;
for (var b = Math.min(t.length, d), C = 0; C < t.length; ++C) {
var y = C % d, S = Math.floor(C / d), N = y;
"right" != a && "up" != a || (N = s.length - y - 1);
var M = s[N];
if (0 == S) {
M.node.active = !0;
this.setSpriteFrameByMJID(n, M, t[C]);
} else {
var B = M.node, w = cc.instantiate(B);
w.x = B.x;
w.y = B.y + 8 * S;
w.zIndex = B.zIndex + S;
o.addChild(w);
w.active = !0;
this.setSpriteFrameByMJID(n, w.getComponent(cc.Sprite), t[C]);
p.push(w);
}
}
for (C = b; C < s.length; ++C) {
N = C;
"right" != a && "up" != a || (N = s.length - C - 1);
(M = s[N]).spriteFrame = null;
M.node.active = !1;
}
}
}
}
},
_lastFoldNode: function(e) {
var t = cc.vv.gameNetMgr.getLocalIndex(e.seatindex), i = cc.vv.mahjongmgr.getSide(t), n = this._folds[i], a = this._foldLayout && this._foldLayout[i];
if (!n || 0 == n.length || !a) return null;
var s = e.folds;
if (!s || 0 == s.length) return null;
var o = s.length - 1, r = o % a.maxSlots, c = r;
"right" != i && "up" != i || (c = n.length - r - 1);
if (0 == Math.floor(o / a.maxSlots)) return n[c].node;
var l = this._foldStacks && this._foldStacks[i];
return l && l.length > 0 ? l[l.length - 1] : null;
},
_showDirMarker: function(e) {
if (this._isZjlao() && this._dirFrame) {
this._hideDirMarker();
if (e && e.active) {
var t = new cc.Node("dirMarker");
e.parent.addChild(t);
t.zIndex = 1e3;
var i = t.addComponent(cc.Sprite);
i.spriteFrame = this._dirFrame;
i.sizeMode = cc.Sprite.SizeMode.CUSTOM;
t.setContentSize(50, 48);
var n = e.getContentSize().height, a = e.y + n / 2 + 24 + 4;
t.setPosition(e.x, a);
this._dirMarker = t;
console.log("[folds] 方向标显示 side parent=", e.parent.name, "x=", e.x, "y=", a);
cc.tween(t).repeatForever(cc.tween().to(.35, {
y: a + 16
}, {
easing: "sineInOut"
}).to(.35, {
y: a
}, {
easing: "sineInOut"
})).start();
}
}
},
_hideDirMarker: function() {
this._dirMarker && cc.isValid(this._dirMarker) && this._dirMarker.destroy();
this._dirMarker = null;
},
_flyLastFold: function(e) {
var t = cc.vv.gameNetMgr.getLocalIndex(e.seatindex), i = cc.vv.mahjongmgr.getSide(t), n = cc.vv.mahjongmgr.getFoldPre(t), a = this._folds[i], s = this._foldLayout && this._foldLayout[i];
if (a && 0 != a.length && s) {
var o = e.folds, r = o.length - 1, c = r % s.maxSlots, l = c;
"right" != i && "up" != i || (l = a.length - c - 1);
var h = null;
if (0 == Math.floor(r / s.maxSlots)) h = a[l].node; else {
var d = this._foldStacks && this._foldStacks[i];
d && d.length > 0 && (h = d[d.length - 1]);
}
if (h && h.active) {
var u = this.node.getChildByName("game"), g = u ? u.getChildByName(i) : null, v = g ? g.getChildByName("ChuPai") : null, _ = h.parent, f = v ? v.convertToWorldSpaceAR(cc.v2(0, 0)) : h.convertToWorldSpaceAR(cc.v2(0, 0)), m = _.convertToNodeSpaceAR(f), p = new cc.Node("fold_fly");
_.addChild(p);
p.zIndex = 999;
p.setPosition(m);
p.rotation = h.rotation;
p.scaleX = h.scaleX;
p.scaleY = h.scaleY;
p.setContentSize(h.getContentSize());
var b = p.addComponent(cc.Sprite);
b.sizeMode = cc.Sprite.SizeMode.CUSTOM;
b.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(n, o[r]);
cc.tween(p).to(.18, {
position: h.position
}, {
easing: "quadOut"
}).call(function() {
cc.isValid(p) && p.destroy();
}).start();
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
(s = this.findNode(this.node, "ops")) && (s.active = !1);
this._n.playBtn.active = !1;
this._n.passBtn.active = !1;
this._n.hintBtn && (this._n.hintBtn.active = !1);
(o = this.findNode(this.node, "arrow")) && (o.active = !1);
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
var s, o, r = this.findNode(this.node, "cardTemplates");
if (r) {
var c = r.children;
for (t = 0; t < c.length; ++t) {
var l = c[t].name, h = c[t].getComponent(cc.Sprite);
h && h.spriteFrame && (this._cardFrames[l] = h.spriteFrame);
}
r.active = !1;
}
this.loadCardFramesFromRes();
this._handSlots = [];
this._playSlots = [];
for (var d = this, u = 0; u < 16; ++u) {
var g = this.findNode(this._n.handArea, "handSlot" + u);
if (g) {
g.on(cc.Node.EventType.TOUCH_START, function(e) {
return function(t) {
d.onSlotTouchStart(e, t);
};
}(g));
g.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
return function(t) {
d.onSlotTouchMove(e, t);
};
}(g));
g.on(cc.Node.EventType.TOUCH_END, function(e) {
return function(t) {
d.onSlotTouchEnd(e, t);
};
}(g));
g.on(cc.Node.EventType.TOUCH_CANCEL, function(e) {
return function(t) {
d.onSlotTouchEnd(e, t);
};
}(g));
var v = g.getChildByName("selMark");
v && (v.active = !1);
this._handSlots.push(g);
}
var _ = this.findNode(this._n.cardsContainer, "playSlot" + u);
_ && this._playSlots.push(_);
}
if (0 == this._playSlots.length) for (var f = 0; f < 16; ++f) {
var m = this.findNode(this.node, "playSlot" + f);
m && this._playSlots.push(m);
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
this._buildGestureToggle();
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
var b = this, C = this.findNode(this._n.quickchatlist, "content") || this._n.quickchatlist;
C && C.children.forEach(function(e) {
/^item\d+$/.test(e.name) && b.bindButton(e, function() {
cc.vv.net.send("quick_chat", e.name);
b._n.chatPanel && (b._n.chatPanel.active = !1);
}, b);
});
}
this._oppSlots = [];
for (var y = 0; y < 2; ++y) {
for (var S = [], N = 0; N < 16; ++N) {
var M = this.findNode(this.node, "oppCard" + y + "_" + N);
if (M) {
M.active = !1;
S.push(M);
}
}
S.length > 0 && this._oppSlots.push(S);
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
(s = this.findNode(this.node, "ops")) && s.children.forEach(function(e) {
"playBtn" !== e.name && "passBtn" !== e.name && "hintBtn" !== e.name && (e.active = !1);
});
this._clearBoard();
s && (s.active = !1);
(o = this.findNode(this.node, "arrow")) && (o.active = !1);
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
var s = "";
if (a.pais) for (var o = 0; o < a.pais.length; o++) s += this._formatPaiId(a.pais[o]) + " ";
i.push(this._shortName(this.seatName(a.seatIndex)) + "(" + (this._comboName(a.type) || "") + "): " + s);
}
}
var r = (e.height || 250) - 8, c = Math.max(4, Math.floor(r / (1.45 * t.fontSize)));
i.length > c && (i = i.slice(i.length - c));
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
for (var n = [ "Spade", "Heart", "Club", "Diamond" ], a = [ "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2" ], s = 0; s < n.length; ++s) for (var o = 0; o < a.length; ++o) {
var r = n[s] + a[o], c = l(r);
c && (e._cardFrames[r] = c);
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
var s = a.getComponent(cc.Sprite);
if (s && s.spriteFrame === t._cardBack && !e[a.uuid]) {
s.spriteFrame = null;
i.push(a.name);
}
for (var o = a.children || [], r = 0; r < o.length; ++r) n(o[r]);
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
}), s = {}, o = 0; o < a.length; ++o) s[a[o]] = (s[a[o]] || 0) + 1;
for (var r = Object.keys(s).map(Number).sort(function(e, t) {
return e - t;
}), c = 0, l = -1, h = -1, d = 0; d < r.length; ++d) {
var u = s[r[d]];
if (u > c) {
c = u;
l = r[d];
}
4 == u && (h = r[d]);
}
var g = this._gpConf || {}, v = null == g.gp_bomb || !!g.gp_bomb, _ = null == g.gp_bomb_four || !!g.gp_bomb_four;
if (v) {
if (4 == i && s[14] >= 3) return {
type: "bomb",
key: 14,
len: 4,
bombLevel: 2
};
if (4 == i && h > 0 && _) return {
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
if (2 == i && 1 == r.length) return {
type: "pair",
key: r[0],
len: 2
};
if (3 == i && 1 == r.length) return {
type: "triple",
key: r[0],
len: 3
};
if (4 == i && 3 == c) return null == g.gp_three_one || g.gp_three_one || t && null != g.gp_last_three_one && g.gp_last_three_one ? {
type: "triple_one",
key: l,
len: 4
} : null;
if (5 == i && 3 == c && 2 == r.length && 3 == s[l]) return {
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
if (i >= 5 && r.length == i) {
var f = !0;
for (var m in s) if (1 != s[m]) {
f = !1;
break;
}
if (f) {
var p = null == g.gp_straight_a2 || !!g.gp_straight_a2, b = this._straightKey(r, p);
return b > 0 ? {
type: "straight",
key: b,
len: i
} : null;
}
}
if (i >= 4 && i % 2 == 0 && 2 * r.length == i) {
var C = !0;
for (var y in s) if (2 != s[y]) {
C = !1;
break;
}
if (C) {
var S = this._pairStraightKey(r, p);
return S > 0 ? {
type: "pair_straight",
key: S,
len: i
} : null;
}
}
if (i >= 6 && i % 3 == 0 && 3 * r.length == i) {
var N = !0;
for (var M in s) if (3 != s[M]) {
N = !1;
break;
}
if (N) {
var B = this._pairStraightKey(r, p);
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
var s = e.map(this._virtRank).sort(function(e, t) {
return e - t;
}), o = !0;
for (a = 1; a < s.length; ++a) if (s[a] != s[a - 1] + 1) {
o = !1;
break;
}
if (o) return s[s.length - 1];
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
var s = e.map(this._virtRank).sort(function(e, t) {
return e - t;
}), o = !0;
for (a = 1; a < s.length; ++a) if (s[a] != s[a - 1] + 1) {
o = !1;
break;
}
if (o) return s[s.length - 1];
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
}, n = this._cards, a = n.length, s = a, o = {}, r = 1; r < 1 << a; ++r) {
for (var c = [], l = 0; l < a; ++l) r & 1 << l && c.push(n[l]);
var h = c.length == s, d = this._identifyCards(c, h);
if (d && this._canBeat(d, i)) {
var u = c.slice().sort(function(e, t) {
return e - t;
}), g = u.join(",");
if (!o[g]) {
o[g] = !0;
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
var a = e._seatViews, s = e._seatMap, o = s && s.length ? s.indexOf(i) : i === t.seatIndex ? 0 : 1;
if (!(o < 0) && a[o]) {
var r = a[o].root.getChildByName("ChatBubble");
if (r) {
r.active = !0;
var c = r.getComponent(cc.Label);
if (c) {
c.string = n;
c.node.color = cc.color(255, 255, 255);
}
var l = r.getChildByName("New Label");
l && (l.active = !1);
var h = r.getChildByName("chatbg_ld");
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
r.getContentSize().width < 10 && r.setContentSize(220, 68);
e._chatBubbleTimers = e._chatBubbleTimers || {};
e._chatBubbleTimers[i] && clearTimeout(e._chatBubbleTimers[i]);
e._chatBubbleTimers[i] = setTimeout(function() {
r.active = !1;
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
var n = i.detail, s = e._quickChatInfo && e._quickChatInfo[n.content] || n.content;
a(t.getSeatIndexByID(n.sender), s);
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
var s = cc.vv.net ? cc.vv.net.sio : null;
if (s) {
var o = function() {
console.log("[GP] exit_result: 退出成功, 返回大厅/俱乐部");
e.leaveRoom();
}, r = function() {
console.log("[GP] dispress_push: 房间已解散, 返回大厅/俱乐部");
e.leaveRoom();
};
s.on("exit_result", o);
s.on("dispress_push", r);
this._sio = s;
this._sioListeners = {
exit_result: o,
dispress_push: r
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
applyGame: function(e, t, i, n, a, s, o, r) {
this.resetHintState();
this._cards = e instanceof Array ? e.slice() : [];
this._mySeat = null != t ? t : 0;
this._turn = null != i ? i : 0;
this._freePlay = null == n || !!n;
this._lastPlay = a || null;
this._deadline = o || 0;
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
r && this._isFreshDeal() && this._playDealAnim();
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
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 0)), t = [], i = 0, n = this, a = function(n, a, s) {
if (null != a && 0 != n.length) {
var o = a.convertToNodeSpaceAR(e);
s && n.sort(s);
for (var r = 0; r < n.length; ++r) {
var c = n[r], l = c.x, h = c.y, d = c.opacity;
t.push({
node: c,
fx: l,
fy: h,
op: d
});
c.setPosition(o);
c.opacity = 0;
c.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(l, h)), cc.fadeTo(.15, d))));
var u = .06 * r + .15;
u > i && (i = u);
}
}
}, s = [], o = null, r = 0; r < this._handSlots.length; ++r) {
var c = this._handSlots[r];
if (c && c.active && null != c._cardId) {
s.push(c);
o = c.parent;
}
}
a(s, o, function(e, t) {
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
var _ = this._dealAnimId;
this.scheduleOnce(function() {
if (n._dealAnimId == _) {
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
this._bombCount = 0;
this._updateBombMul();
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
"bomb" === e.type && (this._bombCount = (this._bombCount || 0) + 1);
this._updateBombMul();
this._isHistoryEnabled() && this._addHistory({
round: this._historyRound,
seatIndex: e.seatIndex,
type: e.type,
pais: (e.pais || []).slice()
});
this.renderSeats();
this.renderHand();
this.renderLastPlay();
this._flyPlayCards(e);
this._playTypeEfx(e);
this._playPlayVoice(e);
}
},
_playTypeEfx: function(e) {
if (e && e.type) {
var t = null;
"bomb" === e.type ? t = e.bombLevel >= 2 ? "dazhadan" : "xiaozhadan" : "straight" === e.type ? t = "shunzi" : "pair_straight" === e.type ? t = "liandui" : "triple_one" === e.type || "triple_pair" === e.type ? t = "sandaier" : "triple_straight" === e.type && (t = "DDZ_feiji");
t && cc.vv.mahjongmgr && cc.vv.mahjongmgr.playSpineEfx(this._n.playArea || this.node, t);
}
},
_flyPlayCards: function(e) {
var t = this._n.cardsContainer;
if (t && e && e.pais && 0 !== e.pais.length && 0 !== this._playSlots.length) {
var i = cc.vv.gameNetMgr, n = null;
if (e.seatIndex === i.gpMySeat) this._n.handArea && (n = this._n.handArea.convertToWorldSpaceAR(cc.v2(0, 0))); else if (this._seatMap) for (var a = 0; a < this._seatViews.length; ++a) if (this._seatMap[a] === e.seatIndex && this._seatViews[a]) {
n = this._seatViews[a].root.convertToWorldSpaceAR(cc.v2(0, 0));
break;
}
if (n) for (var s = t.convertToNodeSpaceAR(n), o = Math.min(e.pais.length, this._playSlots.length), r = 0; r < o; ++r) (function(i, n) {
var a = i._playSlots[n], o = new cc.Node("play_fly");
t.addChild(o);
o.zIndex = 999;
o.setPosition(s);
o.setContentSize(a.getContentSize());
o.scaleX = a.scaleX;
o.scaleY = a.scaleY;
var r = o.addComponent(cc.Sprite);
r.sizeMode = cc.Sprite.SizeMode.CUSTOM;
r.spriteFrame = i.frameOf(e.pais[n]);
cc.tween(o).delay(.04 * n).to(.16, {
position: a.position
}, {
easing: "quadOut"
}).call(function() {
cc.isValid(o) && o.destroy();
}).start();
})(this, r);
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
this._playPassVoice(e.seatIndex);
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
_playVoice: function(e, t, i) {
var n = this, a = function() {
cc.isValid(n.node) && cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("pdk/" + (2 == e ? "nv" : "nan") + "/" + t + ".mp3");
};
i > 0 ? setTimeout(a, i) : a();
},
_sexOfSeat: function(e) {
var t = cc.vv && cc.vv.gameNetMgr, i = t && t.gpSeats && t.gpSeats[e] || null;
return i && i.sex ? i.sex : e == this._mySeat && cc.vv && cc.vv.userMgr && cc.vv.userMgr.sex || 1;
},
_voiceOfPlay: function(e, t, i) {
t = Number(t) || 0;
switch (e) {
case "single":
return String(t);

case "pair":
return "dui" + t;

case "triple":
return "tuple" + t;

case "triple_one":
return "sandaiyi";

case "triple_pair":
return "sandaier";

case "straight":
return "shunzi";

case "pair_straight":
return "liandui";

case "triple_straight":
return "feiji";

case "bomb":
return "zhadan";

case "four_two":
for (var n = (i || []).map(function(e) {
return this.rankOf(e);
}.bind(this)), a = {}, s = 0; s < n.length; ++s) a[n[s]] = (a[n[s]] || 0) + 1;
for (var o in a) if (o != t && 2 == a[o]) return "sidailiangdui";
return "sidaier";

case "four_three":
return "sidaisan";

default:
return null;
}
},
_playPlayVoice: function(e) {
if (e && e.type) {
var t = this._voiceOfPlay(e.type, e.key, e.pais);
t && this._playVoice(this._sexOfSeat(e.seatIndex), t, 250);
var i = cc.vv && cc.vv.gameNetMgr, n = i && i.gpSeats && i.gpSeats[e.seatIndex] || null, a = n ? n.count || 0 : -1;
1 == a ? this._playVoice(this._sexOfSeat(e.seatIndex), "baojing1", 1e3) : 2 == a && this._playVoice(this._sexOfSeat(e.seatIndex), "baojing2", 1e3);
}
},
_playPassVoice: function(e) {
null != e && this._playVoice(this._sexOfSeat(e), "buyao" + (1 + Math.floor(4 * Math.random())), 150);
},
_isGestureMultiSelect: function() {
try {
return !!JSON.parse(cc.sys.localStorage.getItem("gesture_multi_select") || "false");
} catch (e) {
return !1;
}
},
_buildGestureToggle: function() {
var e = this._n.settingsPanel;
if (e) {
var t = e.getChildByName("gesture_multi_toggle");
if (t) {
var i = this, n = t.getChildByName("check");
n && (n.active = this._isGestureMultiSelect());
t.on(cc.Node.EventType.TOUCH_END, function() {
var e = !i._isGestureMultiSelect();
try {
cc.sys.localStorage.setItem("gesture_multi_select", JSON.stringify(e));
} catch (e) {}
n && (n.active = e);
});
} else console.warn("[GP] 场景缺少 settings/gesture_multi_toggle, 手势多选开关不可用(请在场景中补节点)");
}
},
_findSlotAtPos: function(e) {
for (var t = 0; t < this._handSlots.length; ++t) {
var i = this._handSlots[t];
if (i && i.active && i.getBoundingBoxToWorld().contains(e)) return i;
}
return null;
},
onSlotTouchStart: function(e, t) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this.isMyTurn() && !this._over) {
var i = t.getLocation();
this._gpGestureStart = {
x: i.x,
y: i.y,
slot: e
};
this._gpGestureMoved = !1;
}
},
onSlotTouchMove: function(e, t) {
if (this._gpGestureStart && this._isGestureMultiSelect()) {
var i = t.getLocation(), n = i.x - this._gpGestureStart.x;
if (Math.abs(n) > 8) {
if (!this._gpGestureMoved) {
this._gpGestureMoved = !0;
var a = this._gpGestureStart.slot;
if (a && null != a._cardId && !this._selected[a._cardId]) {
this._selected[a._cardId] = !0;
this._setSlotY(a, this._selectUpOffset);
}
}
var s = this._findSlotAtPos(i);
if (s && null != s._cardId && !this._selected[s._cardId]) {
this._selected[s._cardId] = !0;
this._setSlotY(s, this._selectUpOffset);
}
}
}
},
onSlotTouchEnd: function(e) {
if (this._gpGestureStart) {
var t = this._gpGestureStart;
this._gpGestureStart = null;
this._gpGestureMoved ? this.updateTurnUI() : this.onSlotTouched(t.slot);
} else this.onSlotTouched(e);
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
this._setSlotY(e, this._selected[t] ? this._selectUpOffset : 0);
cc.vv.audioMgr && cc.vv.audioMgr.playSFX("select.mp3");
this.updateTurnUI();
}
}
},
_setSlotY: function(e, t) {
if (e && cc.isValid(e)) {
cc.Tween.stopAllByTarget(e);
cc.tween(e).to(.07, {
y: t
}, {
easing: "quadOut"
}).start();
}
},
_updateBombMul: function() {
var e = this._n.playArea || this.node, t = this._bombMulLabel, i = this._bombCount || 0;
if (i <= 0) t && cc.isValid(t.node) && (t.node.active = !1); else {
if (!t || !cc.isValid(t.node)) {
var n = new cc.Node("bombMulLabel");
e.addChild(n);
n.setPosition(0, 110);
n.zIndex = 60;
(t = n.addComponent(cc.Label)).fontSize = 34;
n.color = cc.color(255, 200, 60);
var a = n.addComponent(cc.LabelOutline);
a.color = cc.color(120, 30, 10);
a.width = 3;
this._bombMulLabel = t;
}
t.string = "炸弹×" + Math.pow(2, i);
t.node.active = !0;
}
},
_updateWarnBadge: function(e, t) {
if (e) {
var i = e.getChildByName("warnBadge");
if (1 === t) {
if (!i) {
i = new cc.Node("warnBadge");
e.addChild(i);
i.setPosition(0, 58);
i.zIndex = 50;
var n = i.addComponent(cc.Label);
n.string = "报单";
n.fontSize = 32;
i.color = cc.color(255, 60, 60);
var a = i.addComponent(cc.LabelOutline);
a.color = cc.color(255, 235, 120);
a.width = 3;
}
if (!i.active) {
i.active = !0;
i.scale = 1;
cc.tween(i).repeatForever(cc.tween().to(.45, {
scale: 1.18
}, {
easing: "sineInOut"
}).to(.45, {
scale: 1
}, {
easing: "sineInOut"
})).start();
cc.vv.mahjongmgr && cc.vv.mahjongmgr.playSpineEfx(e, "baojing");
}
} else if (i) {
cc.Tween.stopAllByTarget(i);
i.active = !1;
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
for (var s = 0; s < this._handSlots.length; ++s) {
var o = this._handSlots[s];
if (s < i) {
var r = e[s];
o._cardId = r;
o.getComponent(cc.Sprite).spriteFrame = this.frameOf(r);
o.active = !0;
o.x = 60 * (s - (i - 1) / 2);
o.y = this._selected[r] ? this._selectUpOffset : 0;
} else {
o._cardId = null;
o.active = !1;
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
var a = this, s = this._n.cardsContainer;
if (s) cc.tween(s).to(.07, {
opacity: 0
}).call(function() {
a._fillPlaySlots(t);
cc.tween(s).to(.07, {
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
var s = this._playSlots[a];
if (a < e.length) {
var o = this.frameOf(e[a]);
s.getComponent(cc.Sprite).spriteFrame = o;
s.active = !0;
} else s.active = !1;
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
var s = [], o = {};
s.push(a);
o[a] = !0;
var r = n ? t ? t.length : 0 : i ? i.length : 0;
r <= 0 && (r = this.maxPlayers || 2);
for (var c = 0; c < r && s.length < 3; ++c) if (!o[c]) {
s.push(c);
o[c] = !0;
}
this._seatMap = s;
for (var l = 0; l < this._seatViews.length; ++l) {
var h = this._seatViews[l];
if (h && h.root) {
var d = l < s.length ? s[l] : l;
if (d >= r) h.root.active = !1; else {
h.root.active = !0;
var u = d == a, g = "", v = 0, _ = "", f = "";
if (n) {
var m = t[d];
if (m) {
g = m.name || (u ? "我" : "玩家" + (d + 1));
v = m.score || 0;
_ = "剩" + (m.count || 0) + "张";
0 == m.count ? f = "已出完" : m.passed ? f = "不要" : d != this._turn || this._over || (f = "出牌中");
}
} else {
var p = i ? i[d] : null;
if (p && p.userid > 0) {
g = p.name || (u ? "我" : "玩家" + (d + 1));
v = p.score || 0;
_ = p.ready ? "已准备" : "未准备";
f = u ? "我" : "";
} else {
g = "等待玩家";
_ = "";
}
}
var b = "等待玩家" !== g;
h.name && this.setStr(h.name, g);
h.count && this.setStr(h.count, b ? "" + v : "");
h.remain && this.setStr(h.remain, _);
if (h.state) {
this.setStr(h.state, f);
h.state.color = d == this._turn && n && !this._over ? cc.color(255, 230, 90) : cc.color(200, 200, 200);
}
this._updateWarnBadge(h.root, n && m ? m.count || 0 : -1);
}
}
}
this.renderOppHands(t, n);
this.updateTurnUI();
},
renderOppHands: function(e, t) {
for (var i = cc.vv.gameNetMgr, n = e || (i ? i.gpSeats : null), a = this._seatMap || [], s = 1; s < this.maxPlayers; ++s) {
var o = this._oppSlots[s - 1];
if (o) for (var r = s < a.length ? a[s] : s, c = t && n && n[r] && n[r].count || 0, l = 0; l < o.length; ++l) o[l].active = l < c;
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
for (e = 0; e < n.length; ++e) for (var a = n[e], s = 0; s < a.length; ++s) a[s].active = !1;
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
var s = this._playableCombos;
s || (s = this.collectPlayableCombos());
this.setBtnEnabled(this._n.hintBtn, s.length > 0);
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
var s = i.getComponent(cc.Label);
s && (s.color = cc.color(200, 200, 200));
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
var s = this._n.arrowPointer.children;
for (a = 0; a < s.length; ++a) s[a].active = a === t;
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
if (e >= 1 && e <= 5 && this._turn === cc.vv.gameNetMgr.gpMySeat) {
if (e !== this._lastRingSec) {
this._lastRingSec = e;
cc.vv.audioMgr && cc.vv.audioMgr.playSFX("timeup_alarm.wav");
}
} else -1 !== this._lastRingSec && (this._lastRingSec = -1);
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
for (var n = !1, a = 0; a < e.length; ++a) if (e[a].allClosed) {
n = !0;
break;
}
n && cc.vv.mahjongmgr && cc.vv.mahjongmgr.playSpineEfx(this.node, "chuntian");
for (var s = 0, o = 0; o < e.length; ++o) if (e[o].seatindex == cc.vv.gameNetMgr.seatIndex) {
s = e[o].delta || 0;
break;
}
cc.vv.audioMgr && (s > 0 ? cc.vv.audioMgr.playSFX("win.mp3") : s < 0 && cc.vv.audioMgr.playSFX("lose.mp3"));
var r = this;
setTimeout(function() {
r.updateActionBtns();
}, 0);
for (var c = [], l = [], h = 0; h < e.length; ++h) {
var d = e[h], u = d.name || "玩家" + (d.seatindex + 1), g = u + "：";
if (d.isWinner) g += "出完手牌  赢 +" + d.delta + "分"; else {
g += "剩" + d.remain + "张";
d.allClosed && (g += "（全关×2）");
g += "  " + d.delta + "分";
}
c.push(g);
l.push(u + " " + (null != d.totalscore ? d.totalscore : d.score));
}
c.push("");
c.push("总分：" + l.join("   "));
this._overRounds = this._overRounds || [];
for (var v = [], _ = 0; _ < e.length; ++_) {
var f = e[_];
v.push({
name: f.name || "玩家" + (f.seatindex + 1),
score: f.delta || 0
});
}
this._overRounds.push({
index: t.numOfGames,
scores: v
});
if (t.maxNumOfGames > 0 && t.numOfGames >= t.maxNumOfGames) this.onGameEnd({
roundHistory: this._overRounds
}); else {
this.setBlackStr(this._n.settleTitle, "本局结算");
this.setBlackStr(this._n.settleContent, c.join("\n"));
this._n.settleAgainBtn && (this._n.settleAgainBtn.active = !0);
this._n.settleExitBtn && (this._n.settleExitBtn.active = !1);
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this._n.settlePanel.active = !0;
this._popIn(this._n.settlePanel);
this._n.settleNewBtn && (this._n.settleNewBtn.active = !0);
this.setStr(this._n.tipLabel, "本局结束");
}
}
},
_popIn: function(e) {
if (e) {
null == this._popBase && (this._popBase = {});
var t = e.uuid;
null == this._popBase[t] && (this._popBase[t] = e.scaleX);
var i = this._popBase[t];
cc.Tween.stopAllByTarget(e);
e.setScale(.6 * i);
e.opacity = 0;
cc.tween(e).to(.28, {
scaleX: i,
scaleY: i,
opacity: 255
}, {
easing: "backOut"
}).start();
}
},
onGameEnd: function(e) {
this._final = !0;
for (var t = [], i = cc.vv.gameNetMgr.seats || [], n = 0; n < i.length; ++n) {
var a = i[n];
a && a.userid > 0 && t.push((a.name || "玩家") + " " + (a.score > 0 ? "+" + a.score : a.score));
}
var s = [ "最终总分：" + t.join("   ") ], o = e && e.roundHistory && e.roundHistory.length ? e.roundHistory : this._overRounds || [];
o.length && s.push("");
for (var r = 0; r < o.length; ++r) {
for (var c = o[r] || {}, l = [], h = c.scores || [], d = 0; d < h.length; ++d) {
var u = h[d] || {};
l.push((u.name || "玩家") + " " + (u.score > 0 ? "+" + u.score : u.score));
}
s.push("第" + (c.index || r + 1) + "局  " + l.join("   "));
}
var g = s.join("\n");
if (this._showFinalResult(s)) {
this._n.settlePanel && (this._n.settlePanel.active = !1);
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this.setStr(this._n.tipLabel, "整场结束");
} else if (null != this._n.finalSettlePanel) {
this._n.settlePanel.active = !1;
this.setBlackStr(this._n.finalSettleTitle, "整场结算");
this._fitSettleFont(this._n.finalSettleContent, s);
this.setBlackStr(this._n.finalSettleContent, g);
this._n.finalSettlePanel.active = !0;
this._popIn(this._n.finalSettlePanel);
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
this._fitSettleFont(this._n.settleContent, s);
this.setBlackStr(this._n.settleContent, g);
this._n.settlePanel.active = !0;
this._popIn(this._n.settlePanel);
this.setStr(this._n.tipLabel, "整场结束");
}
},
_showFinalResult: function(e) {
var t = this._n.gameResult;
if (null == t) return !1;
var i = t.getChildByName("resultList");
i && i.destroy();
for (var n = 0, a = 0; a < e.length; ++a) {
for (var s = 0, o = e[a] || "", r = 0; r < o.length; ++r) s += o.charCodeAt(r) > 255 ? 2 : 1;
s > n && (n = s);
}
var c = n > 0 ? Math.floor(860 / n) : 30, l = Math.floor(480 / Math.max(1, e.length) / 1.3);
c > l && (c = l);
c > 30 && (c = 30);
c < 14 && (c = 14);
var h = new cc.Node("resultList"), d = h.addComponent(cc.Label);
d.string = e.join("\n");
d.fontSize = c;
d.lineHeight = c + 10;
d.enableWrapText = !1;
d.overflow = cc.Label.Overflow.NONE;
d.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
d.verticalAlign = cc.Label.VerticalAlign.CENTER;
h.color = cc.color(0, 0, 0, 255);
h.setPosition(0, 20);
t.addChild(h);
t.active = !0;
this._popIn(t);
return !0;
},
_fitSettleFont: function(e, t) {
if (null != e) {
var i = e.getComponent(cc.Label);
if (i) {
for (var n = 0, a = 0; a < t.length; ++a) {
for (var s = 0, o = t[a] || "", r = 0; r < o.length; ++r) s += o.charCodeAt(r) > 255 ? 2 : 1;
s > n && (n = s);
}
var c = e.width > 0 ? e.width : e.parent ? .9 * e.parent.width : 630, l = n > 0 ? Math.floor(c / n) : 32;
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
var s = a.getComponent(cc.Sprite);
if (s && s.spriteFrame) {
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
s.type = cc.Sprite.Type.SLICED;
}
}
}
this._gameover.getChildByName("wanfa").getComponent(cc.Label).string = cc.vv.gameNetMgr.getWanfa();
for (var o = this._gameover.getChildByName("result_list"), r = 1; r <= 4; ++r) {
var c = "s" + r, l = o.getChildByName(c), h = {};
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
if (u._gameresult) {
u._gameresult.active = !0;
u._popIn(u._gameresult);
}
u._gameover && (u._gameover.active = !1);
});
}
},
_popIn: function(e) {
if (e) {
null == this._popBase && (this._popBase = {});
var t = e.uuid;
null == this._popBase[t] && (this._popBase[t] = e.scaleX);
var i = this._popBase[t];
cc.Tween.stopAllByTarget(e);
e.setScale(.6 * i);
e.opacity = 0;
cc.tween(e).to(.28, {
scaleX: i,
scaleY: i,
opacity: 255
}, {
easing: "backOut"
}).start();
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
this._popIn(this._gameover);
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
for (var t = cc.vv.gameNetMgr.seatIndex, i = 0, n = 0; n < e.length; ++n) if (e[n] && e[n].userid == cc.vv.gameNetMgr.seats[t].userid) {
i = e[n].score;
break;
}
i > 0 ? this._win.active = !0 : i < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (n = 0; n < this._seats.length; ++n) {
var a = this._seats[n], s = e[n], o = a.username.node.parent;
if (s) {
o.active = !0;
for (var r = !1, c = [], l = a.hupai, h = 0; h < l.children.length; ++h) l.children[h].active = !1;
var d = 0, u = s.huinfo || [];
for (h = 0; h < u.length; ++h) {
var g = u[h];
r = r || g.ishupai;
if (g.ishupai) {
if (d < l.children.length) {
var v = l.children[d];
v.active = !0;
v.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", g.pai);
d++;
}
"zimo" == g.action ? c.push("自摸") : "hu" == g.action && c.push("接炮胡");
if (null != g.fan) {
c.push(g.fan + "台");
g.tailog && g.tailog.length && c.push("\n" + g.tailog.join("\n"));
}
} else "fangpao" == g.action && c.push("放炮");
}
a.hu.active = r;
var _ = s.angangs || [], f = s.diangangs || [], m = s.wangangs || [], p = s.pengs || [], b = s.chis || [];
_.length && c.push("暗杠x" + _.length);
f.length && c.push("明杠x" + f.length);
m.length && c.push("补杠x" + m.length);
a.username.string = cc.vv.gameNetMgr.seats[n] ? cc.vv.gameNetMgr.seats[n].name : "";
a.zhuang.active = cc.vv.gameNetMgr.button == n;
var C = cc.vv.gameNetMgr.button == n && cc.vv.gameNetMgr.laozhuang || 0;
this.updateSettleLaoZhuang(a, C);
a.reason.string = c.join("、");
s.score > 0 ? a.score.string = "+" + s.score : a.score.string = "" + s.score;
for (var y = 0; y < a.mahjongs.childrenCount; ++y) a.mahjongs.children[y].active = !1;
var S = (s.holds || []).slice();
"object" == typeof S && null != S.length || (S = []);
cc.vv.mahjongmgr.sortMJ(S);
var N = _.length + m.length + f.length, M = 3 * (p.length + N + b.length);
for (y = 0; y < S.length; ++y) {
var B = S[y], w = a.mahjongs.children[y + M];
if (null == w) break;
w.active = !0;
w.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", B);
}
for (y = 0; y < a._pengandgang.length; ++y) a._pengandgang[y].active = !1;
var T = 0;
for (y = 0; y < _.length; ++y) {
this.initPengAndGangs(a, T, _[y], "angang");
T++;
}
for (y = 0; y < f.length; ++y) {
this.initPengAndGangs(a, T, f[y], "diangang");
T++;
}
for (y = 0; y < m.length; ++y) {
this.initPengAndGangs(a, T, m[y], "wangang");
T++;
}
for (y = 0; y < p.length; ++y) {
var A = s.pengTiles && s.pengTiles[y] || null;
this.initPengAndGangs(a, T, p[y], "peng", A);
T++;
}
for (y = 0; y < b.length; ++y) {
var P = b[y];
if (P && P.length > 0) {
this.initChisGroup(a, T, P);
T++;
}
}
} else o.active = !1;
}
} else {
this._gameresult.active = !0;
this._popIn(this._gameresult);
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
var s = n.addComponent(cc.LabelOutline);
s.color = cc.color(60, 30, 0);
s.width = 2;
}
var o = null != t && t >= 1;
n.active = o;
o && (n.getComponent(cc.Label).string = "老庄" + t);
}
},
onGameOver_XZDD: function(e) {
console.log(e);
if (0 != e.length) {
this._gameover.active = !0;
this._popIn(this._gameover);
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
var t = e[cc.vv.gameNetMgr.seatIndex].score;
t > 0 ? this._win.active = !0 : t < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (var i = 0; i < 4; ++i) {
for (var n = this._seats[i], a = e[i], s = !1, o = a.angangs.length + a.wangangs.length + a.diangangs.length, r = a.numofgen, c = [], l = !1, h = 0; h < a.actions.length; ++h) {
var d = a.actions[h];
if ("zimo" == d.type || "ganghua" == d.type || "dianganghua" == d.type || "hu" == d.type || "gangpaohu" == d.type || "qiangganghu" == d.type || "chadajiao" == d.type) {
"7pairs" == a.pattern ? c.push("七对") : "l7pairs" == a.pattern ? c.push("龙七对") : "j7pairs" == a.pattern ? c.push("将七对") : "duidui" == a.pattern ? c.push("碰碰胡") : "jiangdui" == a.pattern && c.push("将对");
"zimo" == d.type ? c.push("自摸") : "ganghua" == d.type ? c.push("杠上花") : "dianganghua" == d.type ? c.push("点杠花") : "gangpaohu" == d.type ? c.push("杠炮胡") : "qiangganghu" == d.type ? c.push("抢杠胡") : "chadajiao" == d.type && (l = !0);
s = !0;
} else "fangpao" == d.type ? c.push("放炮") : "angang" == d.type ? c.push("暗杠") : "diangang" == d.type ? c.push("明杠") : "wangang" == d.type ? c.push("弯杠") : "fanggang" == d.type ? c.push("放杠") : "zhuanshougang" == d.type ? c.push("转手杠") : "beiqianggang" == d.type ? c.push("被抢杠") : "beichadajiao" == d.type && c.push("被查叫");
}
if (s) {
a.qingyise && c.push("清一色");
a.menqing && c.push("门清");
a.zhongzhang && c.push("中张");
a.jingouhu && c.push("金钩胡");
a.haidihu && c.push("海底胡");
a.tianhu && c.push("天胡");
a.dihu && c.push("地胡");
r > 0 && c.push("根x" + r);
l && c.push("查大叫");
}
for (var u = 0; u < 3; ++u) n.hu.children[u].active = !1;
a.huorder >= 0 && (n.hu.children[a.huorder].active = !0);
n.username.string = cc.vv.gameNetMgr.seats[i].name;
n.zhuang.active = cc.vv.gameNetMgr.button == i;
n.reason.string = c.join("、");
var g = 0;
s && (g = a.fan);
n.fan.string = g + "番";
a.score > 0 ? n.score.string = "+" + a.score : n.score.string = a.score;
var v = -1;
s && (v = a.holds.pop());
cc.vv.mahjongmgr.sortMJ(a.holds, a.dingque);
s && a.holds.push(v);
for (var _ = 0; _ < n.mahjongs.childrenCount; ++_) (m = n.mahjongs.children[_]).active = !1;
var f = 3 * (a.pengs.length + o);
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
var S = a.pengs;
if (S) for (_ = 0; _ < S.length; ++_) {
y = S[_];
this.initPengAndGangs(n, b, y, "peng");
b++;
}
}
} else {
this._gameresult.active = !0;
this._popIn(this._gameresult);
}
},
onGameOver_XLCH: function(e) {
console.log(e);
if (0 != e.length) {
this._gameover.active = !0;
this._popIn(this._gameover);
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
var t = e[cc.vv.gameNetMgr.seatIndex].score;
t > 0 ? this._win.active = !0 : t < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (var i = 0; i < 4; ++i) {
for (var n = this._seats[i], a = e[i], s = !1, o = [], r = n.hupai, c = 0; c < r.children.length; ++c) r.children[c].active = !1;
var l = 0;
for (c = 0; c < a.huinfo.length; ++c) {
var h = a.huinfo[c];
s = s || h.ishupai;
if (h.ishupai && l < r.children.length) {
var d = r.children[l];
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
o.push(u);
}
n.hu.active = s;
a.angangs.length && o.push("暗杠x" + a.angangs.length);
a.diangangs.length && o.push("明杠x" + a.diangangs.length);
a.wangangs.length && o.push("巴杠x" + a.wangangs.length);
n.username.string = cc.vv.gameNetMgr.seats[i].name;
n.zhuang.active = cc.vv.gameNetMgr.button == i;
n.reason.string = o.join("、");
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
var S = y[_];
this.initPengAndGangs(n, C, S, "angang");
C++;
}
for (y = a.diangangs, _ = 0; _ < y.length; ++_) {
S = y[_];
this.initPengAndGangs(n, C, S, "diangang");
C++;
}
for (y = a.wangangs, _ = 0; _ < y.length; ++_) {
S = y[_];
this.initPengAndGangs(n, C, S, "wangang");
C++;
}
var N = a.pengs;
if (N) for (_ = 0; _ < N.length; ++_) {
S = N[_];
this.initPengAndGangs(n, C, S, "peng");
C++;
}
}
} else {
this._gameresult.active = !0;
this._popIn(this._gameresult);
}
},
initPengAndGangs: function(e, t, i, n, a) {
var s = null;
if (e._pengandgang.length <= t) {
s = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e._pengandgang.push(s);
e.mahjongs.addChild(s);
} else (s = e._pengandgang[t]).active = !0;
for (var o = s.getComponentsInChildren(cc.Sprite), r = 0, c = 0; c < o.length; ++c) {
var l = o[c];
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
var d = "peng" == n && a && r < a.length ? a[r] : i;
l.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", d);
r++;
}
}
s.x = 165 * t + 10 * t;
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
}), s = n.getComponentsInChildren(cc.Sprite), o = 0, r = 0; r < s.length; ++r) {
var c = s[r];
if ("gang" == c.node.name) c.node.active = !1; else {
var l = o < a.length ? a[o] : a[a.length - 1];
c.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", l);
o++;
}
}
n.x = 165 * t + 10 * t;
},
onBtnReadyClicked: function() {
console.log("onBtnReadyClicked");
if (this._isGameEnd) {
this._gameresult.active = !0;
this._popIn(this._gameresult);
} else cc.vv.net.send("ready");
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
var s = a.getComponent(cc.Sprite);
if (s && s.spriteFrame) {
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
s.type = cc.Sprite.Type.SLICED;
}
}
}
this._gameover.getChildByName("wanfa").getComponent(cc.Label).string = cc.vv.gameNetMgr.getWanfa();
for (var o = this._gameover.getChildByName("result_list"), r = 1; r <= 4; ++r) {
var c = "s" + r, l = o.getChildByName(c), h = {};
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
if (u._gameresult) {
u._gameresult.active = !0;
u._popIn(u._gameresult);
}
u._gameover && (u._gameover.active = !1);
});
}
},
_popIn: function(e) {
if (e) {
null == this._popBase && (this._popBase = {});
var t = e.uuid;
null == this._popBase[t] && (this._popBase[t] = e.scaleX);
var i = this._popBase[t];
cc.Tween.stopAllByTarget(e);
e.setScale(.6 * i);
e.opacity = 0;
cc.tween(e).to(.28, {
scaleX: i,
scaleY: i,
opacity: 255
}, {
easing: "backOut"
}).start();
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
this._popIn(this._gameover);
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
for (var i = cc.vv.gameNetMgr.seatIndex, n = 0, a = 0; a < e.length; ++a) if (e[a] && e[a].userid == cc.vv.gameNetMgr.seats[i].userid) {
n = e[a].score;
break;
}
n > 0 ? this._win.active = !0 : n < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (a = 0; a < this._seats.length; ++a) {
var s = this._seats[a], o = e[a], r = s.username.node.parent;
if (o) {
r.active = !0;
for (var c = !1, l = [], h = s.hupai, d = 0; d < h.children.length; ++d) h.children[d].active = !1;
var u = 0, g = o.huinfo || [];
for (d = 0; d < g.length; ++d) {
var v = g[d];
c = c || v.ishupai;
if (v.ishupai) {
if (u < h.children.length) {
var _ = h.children[u];
_.active = !0;
_.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", v.pai);
u++;
}
"zimo" == v.action ? l.push("自摸") : "hu" == v.action && l.push("接炮胡");
if ("zj_lao" == t) {
if (v.tailog && v.tailog.length) {
for (var f = [], m = 0; m < v.tailog.length; ++m) v.tailog[m].indexOf("×2") >= 0 && f.push(v.tailog[m]);
f.length && l.push(f.join("，"));
}
} else if (null != v.fan) {
l.push(v.fan + "台");
v.tailog && v.tailog.length && l.push("(" + v.tailog.join("，") + ")");
}
} else "fangpao" == v.action && l.push("放炮");
}
if ("zj_bt" == t) {
if (o.isBao) {
var p = "";
0 === o.baoModeOfRound ? p = "无财" : 1 === o.baoModeOfRound ? p = "独财" : 2 === o.baoModeOfRound && (p = "双财");
var b = "包家" + p;
o.baoTaiOfRound && (b += "包" + o.baoTaiOfRound + "台");
l.unshift(b);
}
var C = o.huBaseScore || 0, y = o.baoTaiScore || 0;
0 != C && l.push("胡牌分" + (C > 0 ? "+" : "") + C);
0 != y && l.push("包台分" + (y > 0 ? "+" : "") + y);
}
s.hu.active = c;
var S = o.angangs || [], N = o.diangangs || [], M = o.wangangs || [], B = o.pengs || [], w = o.chis || [];
S.length && l.push("暗杠x" + S.length);
N.length && l.push("明杠x" + N.length);
M.length && l.push("补杠x" + M.length);
s.username.string = cc.vv.gameNetMgr.seats[a] ? cc.vv.gameNetMgr.seats[a].name : "";
s.zhuang.active = cc.vv.gameNetMgr.button == a;
var T = cc.vv.gameNetMgr.button == a && cc.vv.gameNetMgr.laozhuang || 0;
this.updateSettleLaoZhuang(s, T);
s.reason.string = l.join("、");
o.score > 0 ? s.score.string = "+" + o.score : s.score.string = "" + o.score;
for (var A = 0; A < s.mahjongs.childrenCount; ++A) s.mahjongs.children[A].active = !1;
var P = (o.holds || []).slice();
"object" == typeof P && null != P.length || (P = []);
cc.vv.mahjongmgr.sortMJ(P);
var I = S.length + M.length + N.length, x = 3 * (B.length + I + w.length);
for (A = 0; A < P.length; ++A) {
var L = P[A], O = s.mahjongs.children[A + x];
if (null == O) break;
O.active = !0;
O.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", L);
}
for (A = 0; A < s._pengandgang.length; ++A) s._pengandgang[A].active = !1;
var R = 0;
for (A = 0; A < S.length; ++A) {
this.initPengAndGangs(s, R, S[A], "angang");
R++;
}
for (A = 0; A < N.length; ++A) {
this.initPengAndGangs(s, R, N[A], "diangang");
R++;
}
for (A = 0; A < M.length; ++A) {
this.initPengAndGangs(s, R, M[A], "wangang");
R++;
}
for (A = 0; A < B.length; ++A) {
var j = o.pengTiles && o.pengTiles[A] || null;
this.initPengAndGangs(s, R, B[A], "peng", j);
R++;
}
for (A = 0; A < w.length; ++A) {
var E = w[A];
if (E && E.length > 0) {
this.initChisGroup(s, R, E);
R++;
}
}
} else r.active = !1;
}
this.showSettleCaishen();
this.startAutoReadyTimer();
} else {
this._gameresult.active = !0;
this._popIn(this._gameresult);
}
},
showSettleCaishen: function() {
var e = cc.vv.gameNetMgr.conf || {};
if ("zj_zx" != e.type && "zj4_zx" != e.type) {
var t = null != e.caishen ? e.caishen : -1, i = null != e.caishen2 ? e.caishen2 : -1;
if (!(t < 0)) {
var n = this._gameover.getChildByName("settleCsArea");
if (n) {
n.active = !0;
var a = i >= 0 && i != t ? [ t, i ] : [ t ], s = n.getChildByName("csLab");
s && (s.active = !0);
for (var o = 0; o < 2; ++o) {
var r = n.getChildByName("cs" + o);
if (r) {
var c = r.getComponent(cc.Sprite);
if (o < a.length) {
r.active = !0;
c && (c.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", a[o]));
} else r.active = !1;
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
var s = n.addComponent(cc.LabelOutline);
s.color = cc.color(60, 30, 0);
s.width = 2;
}
var o = null != t && t >= 1;
n.active = o;
o && (n.getComponent(cc.Label).string = "老庄" + t);
}
},
onGameOver_XZDD: function(e) {
console.log(e);
if (0 != e.length) {
this._gameover.active = !0;
this._popIn(this._gameover);
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
var t = e[cc.vv.gameNetMgr.seatIndex].score;
t > 0 ? this._win.active = !0 : t < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (var i = 0; i < 4; ++i) {
for (var n = this._seats[i], a = e[i], s = !1, o = a.angangs.length + a.wangangs.length + a.diangangs.length, r = a.numofgen, c = [], l = !1, h = 0; h < a.actions.length; ++h) {
var d = a.actions[h];
if ("zimo" == d.type || "ganghua" == d.type || "dianganghua" == d.type || "hu" == d.type || "gangpaohu" == d.type || "qiangganghu" == d.type || "chadajiao" == d.type) {
"7pairs" == a.pattern ? c.push("七对") : "l7pairs" == a.pattern ? c.push("龙七对") : "j7pairs" == a.pattern ? c.push("将七对") : "duidui" == a.pattern ? c.push("碰碰胡") : "jiangdui" == a.pattern && c.push("将对");
"zimo" == d.type ? c.push("自摸") : "ganghua" == d.type ? c.push("杠上花") : "dianganghua" == d.type ? c.push("点杠花") : "gangpaohu" == d.type ? c.push("杠炮胡") : "qiangganghu" == d.type ? c.push("抢杠胡") : "chadajiao" == d.type && (l = !0);
s = !0;
} else "fangpao" == d.type ? c.push("放炮") : "angang" == d.type ? c.push("暗杠") : "diangang" == d.type ? c.push("明杠") : "wangang" == d.type ? c.push("弯杠") : "fanggang" == d.type ? c.push("放杠") : "zhuanshougang" == d.type ? c.push("转手杠") : "beiqianggang" == d.type ? c.push("被抢杠") : "beichadajiao" == d.type && c.push("被查叫");
}
if (s) {
a.qingyise && c.push("清一色");
a.menqing && c.push("门清");
a.zhongzhang && c.push("中张");
a.jingouhu && c.push("金钩胡");
a.haidihu && c.push("海底胡");
a.tianhu && c.push("天胡");
a.dihu && c.push("地胡");
r > 0 && c.push("根x" + r);
l && c.push("查大叫");
}
for (var u = 0; u < 3; ++u) n.hu.children[u].active = !1;
a.huorder >= 0 && (n.hu.children[a.huorder].active = !0);
n.username.string = cc.vv.gameNetMgr.seats[i].name;
n.zhuang.active = cc.vv.gameNetMgr.button == i;
n.reason.string = c.join("、");
var g = 0;
s && (g = a.fan);
n.fan.string = g + "番";
a.score > 0 ? n.score.string = "+" + a.score : n.score.string = a.score;
var v = -1;
s && (v = a.holds.pop());
cc.vv.mahjongmgr.sortMJ(a.holds, a.dingque);
s && a.holds.push(v);
for (var _ = 0; _ < n.mahjongs.childrenCount; ++_) (m = n.mahjongs.children[_]).active = !1;
var f = 3 * (a.pengs.length + o);
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
var S = a.pengs;
if (S) for (_ = 0; _ < S.length; ++_) {
y = S[_];
this.initPengAndGangs(n, b, y, "peng");
b++;
}
}
} else {
this._gameresult.active = !0;
this._popIn(this._gameresult);
}
},
onGameOver_XLCH: function(e) {
console.log(e);
if (0 != e.length) {
this._gameover.active = !0;
this._popIn(this._gameover);
this._pingju.active = !1;
this._win.active = !1;
this._lose.active = !1;
var t = e[cc.vv.gameNetMgr.seatIndex].score;
t > 0 ? this._win.active = !0 : t < 0 ? this._lose.active = !0 : this._pingju.active = !0;
for (var i = 0; i < 4; ++i) {
for (var n = this._seats[i], a = e[i], s = !1, o = [], r = n.hupai, c = 0; c < r.children.length; ++c) r.children[c].active = !1;
var l = 0;
for (c = 0; c < a.huinfo.length; ++c) {
var h = a.huinfo[c];
s = s || h.ishupai;
if (h.ishupai && l < r.children.length) {
var d = r.children[l];
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
o.push(u);
}
n.hu.active = s;
a.angangs.length && o.push("暗杠x" + a.angangs.length);
a.diangangs.length && o.push("明杠x" + a.diangangs.length);
a.wangangs.length && o.push("巴杠x" + a.wangangs.length);
n.username.string = cc.vv.gameNetMgr.seats[i].name;
n.zhuang.active = cc.vv.gameNetMgr.button == i;
n.reason.string = o.join("、");
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
var S = y[_];
this.initPengAndGangs(n, C, S, "angang");
C++;
}
for (y = a.diangangs, _ = 0; _ < y.length; ++_) {
S = y[_];
this.initPengAndGangs(n, C, S, "diangang");
C++;
}
for (y = a.wangangs, _ = 0; _ < y.length; ++_) {
S = y[_];
this.initPengAndGangs(n, C, S, "wangang");
C++;
}
var N = a.pengs;
if (N) for (_ = 0; _ < N.length; ++_) {
S = N[_];
this.initPengAndGangs(n, C, S, "peng");
C++;
}
}
} else {
this._gameresult.active = !0;
this._popIn(this._gameresult);
}
},
initPengAndGangs: function(e, t, i, n, a) {
var s = null;
if (e._pengandgang.length <= t) {
s = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e._pengandgang.push(s);
e.mahjongs.addChild(s);
} else (s = e._pengandgang[t]).active = !0;
for (var o = s.getComponentsInChildren(cc.Sprite), r = 0, c = 0; c < o.length; ++c) {
var l = o[c];
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
var d = "peng" == n && a && r < a.length ? a[r] : i;
l.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", d);
r++;
}
}
s.x = 165 * t + 10 * t;
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
}), s = n.getComponentsInChildren(cc.Sprite), o = 0, r = 0; r < s.length; ++r) {
var c = s[r];
if ("gang" == c.node.name) c.node.active = !1; else {
var l = o < a.length ? a[o] : a[a.length - 1];
c.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", l);
o++;
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
if (this._isGameEnd) {
this._gameresult.active = !0;
this._popIn(this._gameresult);
} else cc.vv.net.send("ready");
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
var s = i.getChildByName("resultList");
s && s.destroy();
var o = cc.vv.gameNetMgr.seats;
if (o) {
for (var r = -1, c = 0; c < o.length; ++c) o[c] && "number" == typeof o[c].score && o[c].score > r && (r = o[c].score);
var l = new cc.Node("resultList");
i.addChild(l);
var h = 220, d = cc.vv.gameNetMgr.seatIndex;
for (c = 0; c < o.length; ++c) {
var u = o[c];
if (u) {
var g = "number" == typeof u.score ? u.score : 0, v = (g > 0 && g == r ? "【大赢家】" : "") + (c === d ? "[自家] " : "[对家] ") + (u.name || "玩家") + "(" + u.userid + ")";
if (e && null != e[c]) {
var _ = e[c];
v += "   自摸" + this.signedNum(_.numzimo) + "  接炮" + this.signedNum(_.numjiepao) + "  点炮" + this.signedNum(_.numdianpao) + "  暗杠" + this.signedNum(_.numangang) + "  明杠" + this.signedNum(_.numminggang) + "  查叫" + this.signedNum(_.numchadajiao);
}
v += "   总成绩:" + this.signedNum(g);
h -= this.addListRow(l, v, 28, h, g > 0 ? cc.color(40, 120, 40) : g < 0 ? cc.color(170, 40, 40) : cc.color(90, 90, 90));
}
}
if (t && t.length > 0) for (var f = d >= 0 && o[d] ? o[d].userid : -1, m = 0; m < t.length; ++m) {
for (var p = t[m], b = 0, C = 0, y = "", S = 0, N = !1, M = 0; M < p.scores.length; ++M) {
var B = p.scores[M];
B.userid == f ? b = B.score : C = B.score;
if (null != B.tai) {
y = B.userid == f ? "自家" : "对家";
S = B.tai;
N = !!B.zimo;
}
}
var w = "第" + p.index + "局   自家" + this.signedNum(b) + "  对家" + this.signedNum(C);
"" != y && (w += "   " + y + "胡" + S + "台" + (N ? "(自摸)" : ""));
h -= this.addListRow(l, w, 22, h, b > 0 ? cc.color(34, 120, 34) : b < 0 ? cc.color(180, 40, 40) : cc.color(120, 120, 120));
}
}
}
},
addListRow: function(e, t, i, n, a) {
var s = new cc.Node("row"), o = s.addComponent(cc.Label);
o.string = t;
o.fontSize = i;
o.lineHeight = i + 10;
o.overflow = cc.Label.Overflow.NONE;
o.enableWrapText = !1;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = a || cc.color(90, 90, 90);
s.setPosition(0, n);
e.addChild(s);
return i + 14;
},
showTotalScore: function() {
this.renderList(null, null);
},
_popIn: function(e) {
if (e) {
null == this._popBase && (this._popBase = {});
var t = e.uuid;
null == this._popBase[t] && (this._popBase[t] = e.scaleX);
var i = this._popBase[t];
cc.Tween.stopAllByTarget(e);
e.setScale(.6 * i);
e.opacity = 0;
cc.tween(e).to(.28, {
scaleX: i,
scaleY: i,
opacity: 255
}, {
easing: "backOut"
}).start();
}
},
onGameEnd: function(e, t) {
null == this._gameresult && (this._gameresult = this.node.getChildByName("game_result"));
if (this._gameresult) {
this._gameresult.active = !0;
this._popIn(this._gameresult);
}
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
var s = i.getChildByName("resultList");
s && s.destroy();
var o = cc.vv.gameNetMgr.seats;
if (o) {
for (var r = -1, c = 0; c < o.length; ++c) o[c] && "number" == typeof o[c].score && o[c].score > r && (r = o[c].score);
var l = new cc.Node("resultList");
i.addChild(l);
var h = [], d = cc.vv.gameNetMgr.seatIndex;
for (c = 0; c < o.length; ++c) {
var u = o[c];
if (u) {
var g = "number" == typeof u.score ? u.score : 0, v = (g > 0 && g == r ? "【大赢家】" : "") + (c === d ? "[自家] " : "[对家] ") + (u.name || "玩家") + "(" + u.userid + ")";
if (e && null != e[c]) {
var _ = e[c];
v += "   自摸" + this.signedNum(_.numzimo) + "  接炮" + this.signedNum(_.numjiepao) + "  点炮" + this.signedNum(_.numdianpao) + "  暗杠" + this.signedNum(_.numangang) + "  明杠" + this.signedNum(_.numminggang) + "  查叫" + this.signedNum(_.numchadajiao);
}
v += "   总成绩:" + this.signedNum(g);
h.push({
text: v,
fontSize: 28,
color: g > 0 ? cc.color(40, 120, 40) : g < 0 ? cc.color(170, 40, 40) : cc.color(90, 90, 90)
});
}
}
if (t && t.length > 0) for (var f = d >= 0 && o[d] ? o[d].userid : -1, m = 0; m < t.length; ++m) {
for (var p = t[m], b = 0, C = 0, y = "", S = 0, N = !1, M = !1, B = 0; B < p.scores.length; ++B) {
var w = p.scores[B];
w.userid == f ? b = w.score : C = w.score;
if (null != w.tai) {
y = w.userid == f ? "自家" : "对家";
S = w.tai;
N = !!w.zimo;
M = !!w.laozhuang;
}
}
var T = "第" + p.index + "局   自家" + this.signedNum(b) + "  对家" + this.signedNum(C);
"" != y && (T += "   " + y + "胡" + S + "台" + (N ? "(自摸)" : "") + (M ? "(老庄)" : ""));
h.push({
text: T,
fontSize: 22,
color: b > 0 ? cc.color(34, 120, 34) : b < 0 ? cc.color(180, 40, 40) : cc.color(120, 120, 120)
});
}
var A = 0;
for (c = 0; c < h.length; ++c) A += h[c].fontSize + 14;
var P = A / 2;
for (c = 0; c < h.length; ++c) P -= this.addListRow(l, h[c].text, h[c].fontSize, P, h[c].color);
}
}
},
addListRow: function(e, t, i, n, a) {
var s = new cc.Node("row"), o = s.addComponent(cc.Label);
o.string = t;
o.fontSize = i;
o.lineHeight = i + 10;
o.overflow = cc.Label.Overflow.NONE;
o.enableWrapText = !1;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = a || cc.color(90, 90, 90);
s.setPosition(0, n);
e.addChild(s);
return i + 14;
},
showTotalScore: function() {
this.renderList(null, null);
},
_popIn: function(e) {
if (e) {
null == this._popBase && (this._popBase = {});
var t = e.uuid;
null == this._popBase[t] && (this._popBase[t] = e.scaleX);
var i = this._popBase[t];
cc.Tween.stopAllByTarget(e);
e.setScale(.6 * i);
e.opacity = 0;
cc.tween(e).to(.28, {
scaleX: i,
scaleY: i,
opacity: 255
}, {
easing: "backOut"
}).start();
}
},
onGameEnd: function(e, t) {
null == this._gameresult && (this._gameresult = this.node.getChildByName("game_result"));
if (this._gameresult) {
this._gameresult.active = !0;
this._popIn(this._gameresult);
}
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
guanpai2: "诸暨关牌",
sss2: "十三水(2人)",
sss4: "十三水(4人)"
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
sss2: "十三水(2人)。52张牌每人发13张,摆成头3/中5/尾5三道后与对手逐道比牌。\n· 牌型从大到小:同花顺 > 铁支 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 对子 > 单张。\n· 必须头道≤中道≤尾道,顺序不符不允许提交。\n· 每赢一道+1注;三道全胜打枪再+3注。\n· 特殊牌型通吃:一条龙×3、六对半×4、三同花/三顺子×5、三分天下×6。\n· 摆牌限时,超时系统自动摆牌;也可点「自动摆牌」。",
sss4: "十三水(4人)。规则与2人十三水一致,每人13张,与其余3家逐道比牌。\n· 牌型从大到小:同花顺 > 铁支 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 对子 > 单张。\n· 必须头道≤中道≤尾道,顺序不符不允许提交。\n· 每赢一道+1注;三道全胜打枪再+3注;赢过全部对手为全垒打,每家再+3注。\n· 特殊牌型通吃:一条龙×3、六对半×4、三同花/三顺子×5、三分天下×6。\n· 摆牌限时,超时系统自动摆牌;也可点「自动摆牌」。",
baobao_mian: "6张免摆宝宝(最多6人)。每人发6张牌,系统自动遍历所有拆分,选出最大的一副牌型亮牌。\n· 牌型从大到小:6同花顺 > 4条带对 > 4条带2单 > 3条带3条 > 3条带对带1 > 6同花 > 6连顺 > 5同花带1 > 5连顺带1 > 3对 > 3组9 > 散牌。\n· 花色优先级:黑桃 > 红桃 > 梅花 > 方片。A在长顺里算最小(A23456的A当1)。",
baobao_shou: "6张手动摆宝宝(最多6人)。每人发6张牌,自己摆成前2/中2/后2三道。\n· 单道规则:对子为宝,宝>散点(两牌相加取个位,9最大0最小);宝排序 宝A>宝K/Q/J>宝10~2。\n· 强制 前道≤中道≤后道,摆错为乌龙,三道全输。\n· 三道独立结算,每道按赢家道型倍率:宝A=10倍,宝K/Q/J=6倍,宝10~2=5倍,9点=4倍,8点=3倍,7点=2倍,6~0点=1倍。",
baobao: "宝宝(6张玩法,最多6人同桌),分免摆与手摆两种:\n每人发6张牌。免摆由系统自动选出最大牌型亮牌,整手比大小;手摆由自己摆成前2/中2/后2三道,逐道比大小。\n· 牌型从大到小:6同花顺 > 4条带对 > 4条带2单 > 3条带3条 > 3条带对带1 > 6同花 > 6连顺 > 5同花带1 > 5连顺带1 > 3对 > 3组9 > 散牌。\n· 花色优先级:黑桃 > 红桃 > 梅花 > 方片。A在长顺里算最小(A23456的A当1)。\n· 手摆单道:对子为宝,宝>散点(两牌相加取个位,9最大0最小);宝排序 宝A>宝K/Q/J>宝10~2。\n· 手摆强制 前道≤中道≤后道,摆错为乌龙,三道全输。\n· 手摆三道独立结算,每道按赢家道型倍率:宝A=10倍,宝K/Q/J=6倍,宝10~2=5倍,9点=4倍,8点=3倍,7点=2倍,6~0点=1倍。"
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
}, {
type: "sss2",
name: "十三水(2人)"
}, {
type: "sss4",
name: "十三水(4人)"
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
var s = i[a];
if (null == s) {
s = this.makeFallbackItem(a);
cc.log("[help] 场景缺少列表项节点,已用代码兜底:请在 help/helpList 下添加 item" + a);
}
var o = s.getChildByName("Label");
if (null == o) {
(o = new cc.Node("Label")).parent = s;
o.addComponent(cc.Label);
}
var r = o.getComponent(cc.Label);
null == r && (r = o.addComponent(cc.Label));
r.string = n(this._games[a]);
if (s._helpAutoCreated) {
r.fontSize = 22;
r.lineHeight = 26;
o.color = cc.color(255, 255, 255);
}
null == s.getComponent(cc.Button) && s.addComponent(cc.Button);
s.idx = a;
if (!s._helpBound) {
s._helpBound = !0;
var c = this;
s.on(cc.Node.EventType.TOUCH_END, function(e) {
return function() {
c.select(e.idx);
};
}(s));
}
this._items.push(s);
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
var s = this._body.getComponent(cc.Label);
s && (s.string = a[t.type] || "该玩法暂无说明。");
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
function s(e, t) {
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
setItemText: function(e, t, i, n, a, s, o) {
e.idx = o;
e.getChildByName("title").getComponent(cc.Label).string = t;
e.getChildByName("roomNo").getComponent(cc.Label).string = i;
e.getChildByName("time").getComponent(cc.Label).string = n;
for (var r = 0; r < 4; ++r) {
var c = e.getChildByName("info" + r);
null != c && (c.getComponent(cc.Label).string = a[r] || "");
}
var l = e.getChildByName("btnOp");
l.idx = o;
l.getChildByName("Label").getComponent(cc.Label).string = s;
},
showRooms: function() {
this.clearList();
this._flat = [];
for (var e = this._rooms || [], t = 0, i = 0; i < e.length; ++i) for (var n = e[i], a = n.games || [], s = 0; s < a.length; ++s) {
var o = a[s];
this._flat.push({
room: n,
game: o
});
var r = this.getItem(t);
this.setItemText(r, n.table_name || this.typeName(n.type), "房间:" + n.roomid, this.dateFormat(o.create_time), [ "第" + o.index + "局", "", "", "" ], "详情", t);
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
return null == t ? null : s(this._atlas, "M_" + t);
},
makeTile: function(e, t, i, n) {
var s = new cc.Node("tile");
s.parent = e;
s.setContentSize(i, n);
var o = s.addComponent(cc.Sprite);
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var r = this.tileFrame(t);
if (r) o.spriteFrame = r; else {
s.removeComponent(o);
var c = s.addComponent(cc.Label);
c.string = a(t);
c.fontSize = Math.round(.5 * n);
c.lineHeight = n;
s.color = cc.color(20, 20, 20);
}
return s;
},
buildReplay: function(e) {
this.closeReplay();
var t = cc.find("Canvas"), i = cc.view.getVisibleSize(), n = new cc.Node("replayView");
n.parent = t;
n.setContentSize(i.width, i.height);
var a = new cc.Node("table");
a.parent = n;
a.setContentSize(i.width, i.height);
var o = a.addComponent(cc.Sprite);
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
this._bgSpr = o;
var r = this;
cc.resources.load("images/atlas/table_bg", cc.SpriteAtlas, function(e, t) {
!e && t && (o.spriteFrame = s(t, "背景可随意拉伸铺满"));
});
var c = {
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
this._rp = c;
for (var l = 0; l < c.players.length; ++l) {
var h = c.players[l], d = e.hands && e.hands[h.userid];
!d && e.finalHands && (d = e.finalHands[h.userid]);
c.hands[h.userid] = (d || []).slice();
c.melds[h.userid] = [];
c.folds[h.userid] = [];
}
this.buildSeats(c, i);
this.buildControls(c, i);
var u = new cc.Node("result");
u.parent = n;
u.setPosition(0, i.height / 2 - 34);
var g = u.addComponent(cc.Label);
g.string = "";
g.fontSize = 26;
g.lineHeight = 32;
u.color = cc.color(255, 226, 120);
c.resultLabel = g;
this.refresh(c);
this.loadAtlas(function() {
r.refresh(c);
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
var s = this.seatPos(e, i, t);
a.setPosition(s.x, s.y);
var o = new cc.Node("head");
o.parent = a;
o.setContentSize(60, 60);
o.addComponent(cc.Mask).type = cc.Mask.Type.ELLIPSE;
var r = new cc.Node("face");
r.parent = o;
r.setContentSize(60, 60);
r.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
if (n.userid) {
var c = r.addComponent("ImageLoader");
c && c.setUserID(n.userid);
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
var _ = this.foldPos(e, i, t);
v.setPosition(_.x, _.y);
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
var s = new cc.Node("progress");
s.parent = i;
s.setPosition(210, 0);
var o = s.addComponent(cc.Label);
o.string = "";
o.fontSize = 20;
o.lineHeight = 26;
s.color = cc.color(255, 255, 255);
e.progLabel = o;
var r = new cc.Node("wall");
r.parent = i;
r.setPosition(340, 0);
var c = r.addComponent(cc.Label);
c.string = "剩余" + e.wall + "张";
c.fontSize = 20;
c.lineHeight = 26;
r.color = cc.color(255, 255, 255);
e.wallLabel = c;
},
makeBtn: function(e, t, i, n, a) {
var o = new cc.Node("btn");
o.parent = e;
o.setPosition(i, n);
o.setContentSize(110, 46);
var r = o.addComponent(cc.Sprite);
r.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(e, t) {
!e && t && cc.isValid(o) && (r.spriteFrame = s(t, "按钮-蓝"));
});
var c = new cc.Node("Label");
c.parent = o;
var l = c.addComponent(cc.Label);
l.string = t;
l.fontSize = 20;
l.lineHeight = 26;
c.color = cc.color(255, 255, 255);
o.on(cc.Node.EventType.TOUCH_END, a);
return o;
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
var s = a(i.si);
null != s && (null != i.holds && "number" != typeof i.holds && i.holds.slice ? e.hands[s] = i.holds.slice() : null != i.pai && i.pai >= 0 && e.hands[s] && e.hands[s].push(i.pai));
null != i.numofmj && (e.wall = i.numofmj);
break;

case "game_chupai_push":
var o = a(i.si);
if (null != o && null != i.pai) {
e.folds[o] && e.folds[o].push(i.pai);
var r = e.hands[o];
if (r) {
var c = r.indexOf(i.pai);
c >= 0 && r.splice(c, 1);
}
e.lastDiscard = {
uid: o,
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
for (var s = [], o = n.chis || [], r = 0; r < o.length; ++r) s.push({
t: "chi",
pais: o[r]
});
for (var c = n.pengs || [], l = 0; l < c.length; ++l) s.push({
t: "peng",
pai: c[l]
});
for (var h = (n.angangs || []).concat(n.diangangs || []).concat(n.wangangs || []), d = 0; d < h.length; ++d) s.push({
t: "gang",
pai: h[d]
});
e.melds[a] = s;
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
}), s = [], o = 0; o < a.length; ++o) s.push(a[o]);
for (var r = e.melds[i] || [], c = 0; c < r.length; ++c) {
var l = r[c], h = "chi" == l.t ? l.pais || [] : [ l.pai, l.pai, l.pai, l.pai ].slice(0, "peng" == l.t ? 3 : 4);
s.push(null);
for (var d = 0; d < h.length; ++d) s.push(h[d]);
}
for (var u = 0, g = 0; g < s.length; ++g) u += null == s[g] ? 22 : 52;
for (var v = -u / 2 + 25, _ = 0; _ < s.length; ++_) if (null != s[_]) {
this.makeTile(n, s[_], 50, 68).setPosition(v, 0);
v += 52;
} else v += 22;
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
for (var S = 0; S < e.seatNodes.length; ++S) {
var N = e.seatNodes[S].getChildByName("name");
N && (N.color = S == e.winner ? cc.color(255, 210, 0) : cc.color(255, 255, 255));
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
cc.resources.load("images/avatars/" + e, cc.SpriteFrame, function(e, n) {
i(t, !e && n ? n : null);
});
}
var n = 3e5;
function a(e, t) {
null == cc.vv.baseInfoMap && (cc.vv.baseInfoMap = {});
var i = cc.vv.baseInfoMap[e];
null != i && ("localKey" in i || "url" in i) && Date.now() - (i.ts || 0) < n ? t(e, i) : cc.vv.http.sendRequest("/base_info", {
userid: e
}, function(i) {
if (i && !i.errcode) {
var n = null, a = null;
i.headimgurl && (/^avatar_\d{1,3}$/.test(i.headimgurl) ? a = i.headimgurl : n = i.headimgurl + ".jpg");
var s = {
name: i.name,
sex: i.sex,
url: n,
localKey: a,
ts: Date.now()
};
(n || a) && (cc.vv.baseInfoMap[e] = s);
t(e, s);
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
var t = "" + e, i = this;
if (this._userid === t && this._spriteFrame) a(e, function(e, n) {
if (i._userid === t) {
var a = n && (n.localKey || n.url) || null;
a && a !== i._appliedKey && i._applyInfo(t, n);
}
}); else {
this._userid = t;
this._spriteFrame = null;
this._appliedKey = null;
var n = this.node.getComponent(cc.Sprite);
n && (n.spriteFrame = this._defaultFrame || null);
a(e, function(e, n) {
i._userid === t && i._applyInfo(t, n);
});
}
} else this.clearAvatar();
},
_applyInfo: function(e, t) {
var n = this, a = t && (t.localKey || t.url) || null;
this._appliedKey = a;
if (t && t.localKey) i(t.localKey, e, function(t, i) {
if (i && n._userid === e && n._appliedKey === a) {
n._spriteFrame = i;
n.setupSpriteFrame();
}
}); else {
t && t.url && (s = t.url, e, o = function(t, i) {
if (i && n._userid === e && n._appliedKey === a) {
n._spriteFrame = i;
n.setupSpriteFrame();
}
}, cc.assetManager.loadRemote(s, function(e, t) {
if (!e && t) {
var i = new cc.SpriteFrame(t, cc.Rect(0, 0, t.width, t.height));
o(0, i);
} else o(0, null);
}));
var s, o;
}
},
clearAvatar: function() {
this._userid = null;
this._spriteFrame = null;
this._appliedKey = null;
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
if (!this.applyHotUpdateSearchPaths()) {
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
}
},
start: function() {
console.log("[Lodinglogin] start enter");
cc.sys.isNative && "undefined" != typeof jsb && jsb.AssetsManager ? this.checkHotUpdate() : this.checkVersion();
},
applyHotUpdateSearchPaths: function() {
if (!cc.sys.isNative || "undefined" == typeof jsb || !jsb.fileUtils) return !1;
var e = cc.sys.localStorage.getItem("HotUpdateSearchPaths");
if (!e) return !1;
var t = null;
try {
t = JSON.parse(e);
} catch (e) {
t = null;
}
var i = Array.isArray(t) ? t : t && t.paths;
if (!i || !i.length) {
cc.sys.localStorage.removeItem("HotUpdateSearchPaths");
return !1;
}
var n = null;
try {
n = jsb.fileUtils.getSearchPaths();
} catch (e) {
n = null;
}
if (n && this._flattenPaths(n) === this._flattenPaths(i)) return !1;
jsb.fileUtils.setSearchPaths(i);
console.log("[HotUpdate] 已恢复热更搜索路径, 重启生效");
cc.game.restart();
return !0;
},
_flattenPaths: function(e) {
var t = [];
(function e(i) {
for (var n = 0; n < i.length; ++n) Array.isArray(i[n]) ? e(i[n]) : t.push(String(i[n]));
})(e);
return t.join("|");
},
checkHotUpdate: function() {
var e = this, t = cc.vv && cc.vv.http && cc.vv.http.master_url ? cc.vv.http.master_url : "";
if (t) {
var i = t + "/hotupdate/project.manifest", n = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/") + "baobao_hotupdate";
console.log("[HotUpdate] 检查热更:", i);
console.log("[HotUpdate] 存储目录:", n);
this._stateStr = "正在检查更新";
var a = new jsb.AssetsManager(i, n);
a.retain();
this._hotAm = a;
this._hotFailCount = 0;
a.setVerifyCallback(function() {
return !0;
});
a.setEventCallback(function(t) {
var i = t.getEventCode();
console.log("[HotUpdate] event:", i);
var n = jsb.EventAssetsManager;
switch (i) {
case n.ERROR_NO_LOCAL_MANIFEST:
case n.ERROR_DOWNLOAD_MANIFEST:
case n.ERROR_PARSE_MANIFEST:
e.showHotTip("无需热更, 继续启动");
e._finishHot();
e.checkVersion();
break;

case n.ALREADY_UP_TO_DATE:
e.showHotTip("已是最新版本");
e._finishHot();
e.checkVersion();
break;

case n.NEW_VERSION_FOUND:
e.showHotTip("发现新版本, 正在更新");
e.scheduleOnce(function() {
e._hotAm === a && a.update();
}, 0);
break;

case n.UPDATE_PROGRESSION:
e._stateStr = "正在更新资源";
e._isLoading = !0;
var s = t.getPercent();
s > 100 && (s = 100);
s / 100 > e._targetProgress && (e._targetProgress = s / 100);
break;

case n.UPDATE_FINISHED:
try {
var o = jsb.fileUtils.getSearchPaths(), r = a.getLocalManifest().getSearchPaths();
r && r.length && Array.prototype.unshift.apply(o, r);
cc.sys.localStorage.setItem("HotUpdateSearchPaths", JSON.stringify({
paths: o
}));
} catch (e) {
console.log("[HotUpdate] 保存搜索路径失败:", e);
}
e._stateStr = "更新完成, 正在重启";
e._finishHot();
cc.game.restart();
break;

case n.UPDATE_FAILED:
e._hotFailCount++;
if (e._hotFailCount <= 3) {
console.log("[HotUpdate] 下载失败, 第" + e._hotFailCount + "次重试");
a.downloadFailedAssets();
} else {
e.showHotTip("更新失败, 跳过热更");
e._finishHot();
e.checkVersion();
}
break;

case n.ERROR_UPDATING:
case n.ERROR_DECOMPRESS:
console.log("[HotUpdate] 资源异常:", t.getAssetId(), t.getMessage());
}
});
a.checkUpdate();
} else this.checkVersion();
},
_finishHot: function() {
if (this._hotAm) {
try {
this._hotAm.setEventCallback(null);
} catch (e) {}
this._hotAm = null;
}
},
showHotTip: function(e) {
console.log("[HotUpdate]", e);
},
onDestroy: function() {
if (this._hotAm) {
try {
this._hotAm.setEventCallback(null);
this._hotAm.release();
} catch (e) {}
this._hotAm = null;
}
cc.loader && (cc.loader.onProgress = null);
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
var s = e("VoiceMgr");
cc.vv.voiceMgr = new s();
cc.vv.voiceMgr.init();
var o = e("AudioMgr");
if (!cc.vv.audioMgr) {
cc.vv.audioMgr = new o();
cc.vv.audioMgr.init();
}
if (!cc.Node.prototype._bbBtnSoundHooked) {
cc.Node.prototype._bbBtnSoundHooked = !0;
var r = cc.Node.prototype.emit;
cc.Node.prototype.emit = function(e) {
if ("touch-end" === e && cc.vv && cc.vv.audioMgr) {
var t = this.getComponent ? this.getComponent(cc.Button) : null;
(t && !1 !== t.interactable || /^btn/i.test(this.name) || /button/i.test(this.name)) && cc.vv.audioMgr.playSFX("btnClick.wav");
}
return r.apply(this, arguments);
};
}
var c = e("Utils");
cc.vv.utils = new c();
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
for (var n = window.location.href, a = n.indexOf("?"), s = (n = n.substr(a + 1)).split("&"), o = 0; o < s.length; o++) if ((a = s[o].indexOf("=")) > 0) {
e = s[o].substring(0, a);
t = s[o].substr(a + 1);
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
setTimeout(s, 5e3);
}, s = function() {
if (!n) if (i) {
i.abort();
e._stateStr = "连接失败，即将重试";
setTimeout(function() {
a();
}, 5e3);
} else a();
};
s();
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
function i(e, t) {
var i = t ? cc.color(255, 208, 90) : cc.Color.WHITE;
e.color = i;
var n = e.getComponent(cc.Button);
if (n && n.transition === cc.Button.Transition.COLOR) {
n._mjOrigCol || (n._mjOrigCol = {
n: n.normalColor,
h: n.hoverColor,
p: n.pressedColor,
d: n.disabledColor
});
var a = n._mjOrigCol;
if (t) {
n.normalColor = i;
n.hoverColor = i;
n.pressedColor = cc.color(235, 185, 75);
} else {
n.normalColor = a.n;
n.hoverColor = a.h;
n.pressedColor = a.p;
n.disabledColor = a.d;
}
}
}
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
for (var n = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow", "DeskStyle", "Alert" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
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
var s = n.children[a].getComponent(cc.Sprite);
this._myMJArr.push(s);
s.spriteFrame = null;
}
this._setupHandGestures();
var o = cc.view.getVisibleSize().width / 1280;
if (o < 1) {
n.scaleX *= o;
n.scaleY *= o;
}
var r = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < r; ++a) {
var c = cc.vv.mahjongmgr.getSide(a), l = e.getChildByName(c);
if (null != l) {
this._hupaiTips.push(l.getChildByName("HuPai"));
this._hupaiLists.push(l.getChildByName("hupailist"));
this._playEfxs.push(l.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(l.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var h = l.getChildByName("opt");
h.active = !1;
s = h.getChildByName("pai").getComponent(cc.Sprite);
var d = {
node: h,
sprite: s
};
this._opts.push(d);
}
}
var u = e.getChildByName("ops");
this._options = u;
if (u) for (var g = 0; g < u.childrenCount; ++g) {
var v = u.children[g];
if ("op" == v.name) {
var _ = v.getComponent(cc.Sprite);
_ && (_.enabled = !1);
var f = v.getChildByName("opTarget");
f && (f.active = !1);
}
}
var m = u ? u.getChildByName("New Layout") : null;
if (m) {
var p = m.getComponent(cc.Button);
p && (p.enabled = !1);
m.active = !1;
}
this._baoPanel = u ? u.getChildByName("baoPanel") : null;
if (this._baoPanel) {
this._baoPanel.active = !1;
this._baoMode = 2;
this._baoTai = 2;
for (var b = [ {
name: "btnNoCai",
mode: 0
}, {
name: "btnDuCai",
mode: 1
}, {
name: "btnShuangCai",
mode: 2
} ], C = 0; C < b.length; ++C) this._bindBaoButton(this._baoPanel.getChildByName(b[C].name), b[C].mode, "onBaoModeClicked");
for (var y = 2; y <= 7; ++y) this._bindBaoButton(this._baoPanel.getChildByName("btnTai" + y), y, "onBaoTaiClicked");
this._bindBaoButton(this._baoPanel.getChildByName("btnNoBao"), 0, "onBaoNoBaoClicked");
}
this._csPanel = u ? u.getChildByName("csPanel") : null;
if (this._csPanel) {
this._csPanel.active = !1;
var S = this._csPanel.getChildByName("btnSetCaishen");
S && cc.vv.utils.addClickEvent(S, this.node, "MJGameBMJ", "onSetCaishenClicked");
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
var s = this.node;
this.scheduleOnce(function() {
if (cc.isValid(s)) {
e.waitBaoData && s.emit("bao_select", {
detail: e.waitBaoData
});
null != e.waitCaishenMode && s.emit("caishen_select", {
detail: {
mode: e.waitCaishenMode
}
});
}
}, 0);
var o = this;
this.node.on("game_start", function(e) {
var t = e && e.detail, i = cc.vv.gameNetMgr.conf, n = i && null != i.caishen ? parseInt(i.caishen) : -1, a = i && null != i.caishen2 ? parseInt(i.caishen2) : null, s = i && null != i.baoMode ? parseInt(i.baoMode) : -1, r = o.node.getChildByName("game"), c = r ? r.getChildByName("caishenTip") : null;
if (n < 0) {
o._curBaoMode = null;
o._caishen = null;
o._caishen2 = null;
o._csRetryCount = 0;
o._csRetryScheduled = !1;
o._clearBaoFlag();
if (c) {
var l = c.getChildByName("baoTaiLabel");
l && (l.active = !1);
0 !== s && (c.active = !1);
}
} else {
o._curBaoMode = s >= 0 ? s : null;
o._caishen = n;
o._caishen2 = a;
o._csRetryCount = 0;
o.scheduleOnce(function() {
if (cc.isValid(o.node)) {
o._showBaoInfo(t || {
baoTai: i ? i.baoTai : null,
baoMode: s,
baoSeatIndex: i ? i.baoSeatIndex : null
});
o.initCaishenTip();
}
}, 0);
}
o.onGameBeign(!0, t);
o.initCaishenTip();
});
this.node.on("game_begin", function() {
o.onGameBeign();
});
this.node.on("bao_select", function(e) {
o.onBaoSelect(e && e.detail);
});
this.node.on("bao_result", function(e) {
o.onBaoResult(e && e.detail);
});
this.node.on("caishen_select", function(e) {
o.onCaishenSelect(e && e.detail);
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
o.playEfx(i, "play_chi");
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
var a = n.getChildByName("opTarget");
a && (a.active = !1);
var s = n.getChildByName(e);
s.active = !0;
s.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
var n = i.getChildByName("opTarget");
n && (n.active = !1);
var a = this.getChiButton(i);
if (a) {
a.active = !0;
a.pai = e;
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
var s = t.getChildByName("btnLabel");
s && (s.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var s = a.addComponent(cc.Label);
s.string = "吃";
s.fontSize = 40;
s.lineHeight = 40;
s.overflow = cc.Label.Overflow.NONE;
s.enableWrapText = !1;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
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
var a = null != this._caishen ? this._caishen : i ? i.caishen : null, s = null != this._caishen2 ? this._caishen2 : i ? i.caishen2 : null, o = null != a && a >= 0, r = t.getChildByName("title"), c = r ? r.getComponent(cc.Label) : null, l = t.getChildByName("cs1"), h = t.getChildByName("cs2"), d = t.getChildByName("wu");
if (o) {
t.active = !0;
!c || "无财" !== c.string && 0 !== c.string.length || (c.string = "财神");
var u = function(e, t) {
var i = e.getComponent(cc.Sprite);
if (i) try {
var n = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", t);
n && (i.spriteFrame = n);
} catch (e) {
console.warn("[caishenTip] 取牌面失败 pai=" + t, e);
}
}, g = null != s && s >= 0;
if (g) {
if (l) {
l.active = !0;
u(l, a);
}
if (h) {
h.active = !0;
u(h, s);
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
var _ = this, f = g && l ? l.getComponent(cc.Sprite) : null, m = h ? h.getComponent(cc.Sprite) : null;
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
c && (c.string = "无财");
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
var t = null != e.baoTai ? parseInt(e.baoTai) : this._baoTai || 0, i = null != e.baoMode ? parseInt(e.baoMode) : this._curBaoMode, n = ((0 === i ? "无财" : 1 === i ? "独财" : 2 === i ? "双财" : "") || "") + (t > 0 ? t + "台" : ""), a = cc.vv.gameNetMgr, s = null != e.baoSeatIndex ? parseInt(e.baoSeatIndex) : a && null != a.baoSeatIndex ? parseInt(a.baoSeatIndex) : -1, o = this.node.getChildByName("game"), r = o ? o.getChildByName("caishenTip") : null;
if (r) {
var c = r.getChildByName("baoTaiLabel");
if (c) {
var l = c.getComponent(cc.Label);
l && (l.string = n);
c.active = n.length > 0;
}
}
this._showBaoFlag(s);
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
for (var i = cc.vv.gameNetMgr, n = i.seats ? i.seats.length : t._seats2.length, a = null != i.seatIndex ? parseInt(i.seatIndex) : 0, s = 0; s < t._seats2.length; ++s) {
var o = t._seats2[s];
if (o && o.node) {
var r = this._getBaoFlagNode(o.node);
r && (r.active = !1);
}
}
if (!(null == e || e < 0)) {
var c = ((e - a) % n + n) % n, l = t._seats2[c];
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
var s = n[a], o = s.getComponent(cc.Sprite);
if (o && o.spriteFrame) {
s.pai = t;
s.getComponent(cc.Button) || (s.addComponent(cc.Button).transition = cc.Button.Transition.NONE);
cc.vv.utils.addClickEvent(s, this.node, "MJGameBMJ", i);
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
var s = a.getComponent(cc.Label);
if (s) if (this._baoForced) s.string = "双方均未叫台，你被强制包，请选择包法（2台）"; else if (this._baoCurRank < 0) s.string = "请叫台"; else {
var o = Math.floor(this._baoCurRank / 10), r = this._baoCurRank % 10, c = 2 === r ? "无财" : 1 === r ? "独财" : "双财";
s.string = "对家叫" + c + o + "台";
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
for (var s = n.children || [], o = 0; o < s.length; ++o) s[o].getComponent(cc.Sprite) && (s[o].opacity = a);
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
if (cc.vv && cc.vv.mahjongmgr) {
var n = null;
"play_hu" == t ? n = "mj_hu" : "play_zimo" == t ? n = "mj_zimo" : "play_chi" == t ? n = "mj_chi" : "play_peng" == t ? n = "mj_peng" : "play_guafeng" != t && "play_xiayu" != t && "play_gang" != t || (n = "mj_gang");
n && cc.vv.mahjongmgr.playSpineEfx(i.node, n);
}
},
onGameBeign: function(e) {
this._hideWaitCaishenTip();
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), s = this._hupaiTips[a];
s.active = n.hued;
if (n.hued) {
s.getChildByName("sprHu").active = !n.iszimo;
s.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var o = this.node.getChildByName("game");
this._clearBaoFlag();
var r = o.getChildByName("caishenTip");
if (r) {
var c = r.getChildByName("baoTaiLabel");
if (c) {
var l = c.getComponent(cc.Label);
l && (l.string = "");
c.active = !1;
}
}
var h = o.getChildByName("huanpaiinfo");
null != h && (h.active = !1);
var d = [ "right", "up", "left" ];
for (t = 0; t < d.length; ++t) {
var u = o.getChildByName(d[t]);
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
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, s) {
if (null != a && 0 != n.length) {
var o = a.convertToNodeSpaceAR(e);
n.sort(s);
for (var r = 0; r < n.length; ++r) {
var c = n[r], l = c.x, h = c.y, d = c.opacity;
t.push({
node: c,
x: l,
y: h,
op: d
});
c.setPosition(o);
c.opacity = 0;
c.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(l, h)), cc.fadeTo(.15, d))));
var u = .06 * r + .15;
u > i && (i = u);
}
}
}, a = [], s = null, o = 0; o < this._myMJArr.length; ++o) {
var r = this._myMJArr[o];
if (r && r.node && r.node.active && null != r.node.mjId) {
a.push(r.node);
s = r.node.parent;
}
}
n(a, s, function(e, t) {
return e.x - t.x;
});
for (var c = this.node.getChildByName("game"), l = cc.vv.gameNetMgr.seats || [], h = 0; h < l.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var u = cc.vv.mahjongmgr.getSide(d), g = c ? c.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var _ = [], f = 0; f < v.childrenCount; ++f) {
var m = v.children[f];
m.active && _.push(m);
}
n(_, v, "up" == u ? function(e, t) {
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
_getGestureSettings: function() {
var e = cc.vv.deskStyle;
if (e && e.getGestureSettings) return e.getGestureSettings();
try {
return {
multiSelect: !!JSON.parse(cc.sys.localStorage.getItem("gesture_multi_select") || "false"),
swipeUp: !!JSON.parse(cc.sys.localStorage.getItem("mj_gesture_swipe_up") || "false"),
playMode: JSON.parse(cc.sys.localStorage.getItem("mj_play_mode") || '"single"')
};
} catch (e) {
return {
multiSelect: !1,
swipeUp: !1,
playMode: "single"
};
}
},
_setupHandGestures: function() {
this._gestureSel = [];
this._gestureStart = null;
this._gesturePlayed = !1;
this._gestureMoved = !1;
this._lastTapTile = null;
this._lastTapTime = 0;
for (var e = 0; e < this._myMJArr.length; ++e) {
var t = this._myMJArr[e].node;
if (cc.isValid(t)) {
var i = t.getComponent(cc.Button);
i && (i.clickEvents = []);
t.on(cc.Node.EventType.TOUCH_START, function(e) {
this._onHandTouchStart(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
this._onHandTouchMove(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_END, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_CANCEL, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
}
}
},
_onHandTouchStart: function(e, t) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect || this._csPanel && this._csPanel.active) {
this.onMJClicked({
node: t,
currentTarget: t
});
e.stopPropagation();
} else {
var i = e.getLocation();
this._gestureStart = {
x: i.x,
y: i.y,
t: Date.now(),
node: t
};
this._gesturePlayed = !1;
this._gestureMoved = !1;
for (var n = 0; n < this._gestureSel.length; ++n) cc.isValid(this._gestureSel[n]) && (this._gestureSel[n].y = 0);
this._gestureSel = [];
}
},
_onHandTouchMove: function(e) {
if (this._gestureStart && !this._gesturePlayed) {
var t = this._getGestureSettings(), i = e.getLocation(), n = i.x - this._gestureStart.x, a = i.y - this._gestureStart.y;
if (t.swipeUp && a < -30) {
this._playTile(this._gestureStart.node);
this._gesturePlayed = !0;
e.stopPropagation();
} else if (t.multiSelect && Math.abs(n) > 8) {
this._gestureMoved = !0;
var s = this._findTileAtPos(i);
if (s && -1 == this._gestureSel.indexOf(s)) {
this._gestureSel.push(s);
this._setTileY(s, 15);
}
}
}
},
_onHandTouchEnd: function(e) {
if (this._gestureStart) {
var t = this._gestureStart;
this._gestureStart = null;
if (!this._gesturePlayed) if (this._gestureMoved && this._gestureSel.length > 0) e.stopPropagation(); else {
var i = this._getGestureSettings(), n = Date.now(), a = this._lastTapTile, s = a == t.node && n - this._lastTapTime < 300;
this._lastTapTile = t.node;
this._lastTapTime = n;
if ("double" === i.playMode) if (s) this._playTile(t.node); else {
a && a != t.node && cc.isValid(a) && this._setTileY(a, 0);
this._setTileY(t.node, 15);
} else this._playTile(t.node);
e.stopPropagation();
}
}
},
_playTile: function(e) {
if (cc.isValid(e) && null != e.mjId && cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
this.shoot(e.mjId);
e.y = 0;
this._selectedMJ = null;
for (var t = 0; t < this._gestureSel.length; ++t) cc.isValid(this._gestureSel[t]) && (this._gestureSel[t].y = 0);
this._gestureSel = [];
}
},
_findTileAtPos: function(e) {
for (var t = 0; t < this._myMJArr.length; ++t) {
var i = this._myMJArr[t].node;
if (cc.isValid(i) && i.active && i.getBoundingBoxToWorld().contains(e)) return i;
}
return null;
},
_handleChiSelect: function(e) {
if (null != e && null != e.mjId) for (var t = 0; t < this._myMJArr.length; ++t) if (e == this._myMJArr[t].node) {
var i = this._chiSelect.tiles, n = i.indexOf(e);
if (-1 != n) {
i.splice(n, 1);
this._setTileY(e, 0);
return;
}
if (i.length >= 2) return;
i.push(e);
this._setTileY(e, 15);
if (2 == i.length) {
var a = i[0].mjId, s = i[1].mjId, o = this._chiSelect.pai;
i[0].y = 0;
i[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ a, s, o ]);
}
return;
}
},
_setTileY: function(e, t) {
if (e && cc.isValid(e)) {
cc.Tween.stopAllByTarget(e);
cc.tween(e).to(.08, {
y: t
}, {
easing: "quadOut"
}).start();
}
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
for (var s = 0; s < this._myMJArr.length; ++s) if (a == this._myMJArr[s].node) {
var o = this._chiSelect.tiles, r = o.indexOf(a);
if (-1 != r) {
o.splice(r, 1);
this._setTileY(a, 0);
return;
}
if (o.length >= 2) return;
o.push(a);
this._setTileY(a, 15);
if (2 == o.length) {
var c = o[0].mjId, l = o[1].mjId, h = this._chiSelect.pai;
o[0].y = 0;
o[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ c, l, h ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) if (null == cc.vv.gameNetMgr.waitCaishenMode) {
var d = this._findMJNode(e);
if (null != d) for (var u = 0; u < this._myMJArr.length; ++u) if (d == this._myMJArr[u].node) {
if (d == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._setTileY(this._selectedMJ, 0);
this._selectedMJ = null;
return;
}
null != this._selectedMJ && this._setTileY(this._selectedMJ, 0);
this._setTileY(d, 15);
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
var n = cc.vv.gameNetMgr.getLocalIndex(e), a = cc.vv.mahjongmgr.getSide(n), s = cc.vv.mahjongmgr.getFoldPre(n), o = this.node.getChildByName("game").getChildByName(a).getChildByName("holds"), r = this.getMJIndex(a, 13), c = o.children[r];
if (null != c) {
c.scaleX = 1;
c.scaleY = 1;
if (null == t) c.active = !1; else if (t >= 0) {
c.active = !0;
if ("up" == a) {
c.scaleX = .73;
c.scaleY = .73;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(s, t);
if (0 == n) {
var l = cc.vv.gameNetMgr.conf || {};
i(c, l.caishen >= 0 && t == l.caishen || null != l.caishen2 && l.caishen2 >= 0 && t == l.caishen2);
}
} else if (null != t) {
c.active = !0;
if ("up" == a) {
c.scaleX = 1;
c.scaleY = 1;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(a);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), s = 0; s < n.childrenCount; ++s) {
var o = n.children[s];
o.scaleX = 1;
o.scaleY = 1;
o.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, s = a ? a.getChildByName("holds") : null;
if (null != s) {
var o = e.chis || [], r = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + o.length;
r *= 3;
for (var c = 0; c < r; ++c) {
var l = this.getMJIndex(i, c);
null != s.children[l] && (s.children[l].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (c = 0; c < d.length; ++c) {
l = this.getMJIndex(i, c + r);
if (null != s.children[l]) {
var u = s.children[l].getComponent(cc.Sprite);
if (null != u) {
if ("up" == i) {
u.node.scaleX = .73;
u.node.scaleY = .73;
}
u.node.active = !0;
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[c]);
}
}
}
this._hideUnusedHolds(i, s, r + d.length);
} else {
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (c = r; c < r + g; ++c) {
l = this.getMJIndex(i, c);
var v = s.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, s, r + g);
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
for (var s = cc.vv.gameNetMgr.conf, o = s ? s.caishen : -1, r = s ? s.caishen2 : -1, c = [], l = [], h = 0; h < i.length; ++h) {
var d = i[h];
o >= 0 && d == o || null != r && r >= 0 && d == r ? c.push(d) : l.push(d);
}
cc.vv.mahjongmgr.sortMJ(l);
i.length = 0;
for (var u = 0; u < c.length; ++u) i.push(c[u]);
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
var a, s = i.chis || [], o = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + s.length), r = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (r = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (r = 0);
a = r > 0 ? .5 * r : 20;
var c = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), l = this._myMJArr[o], h = l ? l.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", o, "holds.length=", n.length, "startSlot=", o, "endSlot=", o + n.length - 1);
for (var d = [], u = 0; u < n.length; ++u) {
var g = n[u];
if (null == (_ = this._myMJArr[u + o]) || null == _.node) {
d.push("SLOT_" + (u + o) + "=NULL");
break;
}
_.node.mjId = g;
_.node.y = 0;
var v = c && u == n.length - 1;
r > 0 && (_.node.x = h + u * r + (v ? a : 0));
this.setSpriteFrameByMJID("M_", _, g);
d.push("SLOT_" + (u + o) + "=" + g);
}
console.log("[initMahjongs] render:", d.join("|"));
for (u = 0; u < o; ++u) if (null != (_ = this._myMJArr[u]) && null != _.node) {
_.node.mjId = null;
_.spriteFrame = null;
_.node.active = !1;
}
for (u = o + n.length; u < this._myMJArr.length; ++u) {
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
setSpriteFrameByMJID: function(e, t, n) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, n);
t.node.active = !0;
var a = cc.vv.gameNetMgr.conf || {}, s = null != n && n >= 0 && (a.caishen >= 0 && n == a.caishen || null != a.caishen2 && a.caishen2 >= 0 && n == a.caishen2);
i(t.node, s);
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
for (var i = [], n = 36, a = 0; a < e.length; ++a) {
a > 0 && (n += 30);
var s = 46 * e[a].pais.length + 4 * (e[a].pais.length - 1);
i.push(s);
n += s;
}
var o = new cc.Node("chiPanel");
o.setContentSize(n, 120);
o.setPosition(0, -140);
t.addChild(o);
var r = new cc.Node("bg");
r.setContentSize(n, 120);
o.addChild(r);
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(18, 18, 24, 235);
c.strokeColor = cc.color(255, 200, 90, 255);
c.lineWidth = 3;
c.rect(-n / 2, -60, n, 120);
c.fill();
c.stroke();
var l = new cc.Node("cap");
l.setContentSize(n, 26);
l.setPosition(0, 37);
o.addChild(l);
var h = l.addComponent(cc.Label);
h.string = "点击组合完成操作";
h.fontSize = 22;
h.lineHeight = 26;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
l.color = cc.color(255, 225, 150);
for (var d = 18, u = 0; u < e.length; ++u) {
var g = e[u], v = g.pais, _ = i[u], f = new cc.Node("cpgItem" + u);
f.setContentSize(_, 66);
f.setPosition(-n / 2 + d + _ / 2, -13);
d += _ + 30;
o.addChild(f);
f.addComponent(cc.Button);
f.actType = g.type;
f.paiList = v;
f.targetPai = g.pai;
cc.vv.utils.addClickEvent(f, this.node, "MJGameBMJ", "onChiItemClicked");
for (var m = 0; m < v.length; ++m) {
var p = new cc.Node("p" + m);
p.setContentSize(46, 66);
p.setPosition(-_ / 2 + 23 + 50 * m, 0);
f.addChild(p);
var b = p.addComponent(cc.Sprite);
b.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", v[m]);
b.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = o;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e && (e.node || e.currentTarget || e.target) || null;
if (null != t) {
if ("peng" == t.actType) cc.vv.net.send("peng"); else if ("gang" == t.actType) cc.vv.net.send("gang", t.targetPai); else if (t.paiList) {
for (var i = t.targetPai, n = [], a = cc.vv.gameNetMgr.getSelfData(), s = a && a.holds ? a.holds : [], o = cc.vv.gameNetMgr.conf || {}, r = o.caishen, c = o.caishen2, l = 0; l < t.paiList.length; ++l) {
var h = t.paiList[l];
h != i && (h != r && h != c && -1 != s.indexOf(h) ? n.push(h) : r >= 0 && -1 != s.indexOf(r) ? n.push(r) : null != c && c >= 0 && -1 != s.indexOf(c) && n.push(c));
}
n.push(i);
3 == n.length && cc.vv.net.send("chi", n);
}
this.hideChiPanel();
this.hideOptions();
}
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i) cc.vv.net.send("hu"); else if ("btnGuo" == i) {
var n = this._options.getChildByName("btnHu");
if (n && n.active && cc.vv.alert && cc.vv.alert.show) {
var a = this;
cc.vv.alert.show(null, "当前可以胡牌，确定要过吗？", function() {
cc.vv.net.send("guo");
a.hideOptions();
}, !0);
return;
}
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
function i(e, t) {
var i = t ? cc.color(255, 208, 90) : cc.Color.WHITE;
e.color = i;
var n = e.getComponent(cc.Button);
if (n && n.transition === cc.Button.Transition.COLOR) {
n._mjOrigCol || (n._mjOrigCol = {
n: n.normalColor,
h: n.hoverColor,
p: n.pressedColor,
d: n.disabledColor
});
var a = n._mjOrigCol;
if (t) {
n.normalColor = i;
n.hoverColor = i;
n.pressedColor = cc.color(235, 185, 75);
} else {
n.normalColor = a.n;
n.hoverColor = a.h;
n.pressedColor = a.p;
n.disabledColor = a.d;
}
}
}
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
for (var n = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow", "DeskStyle", "Alert" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
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
var s = n.children[a].getComponent(cc.Sprite);
this._myMJArr.push(s);
s.spriteFrame = null;
}
this._setupHandGestures();
var o = cc.view.getVisibleSize().width / 1280;
if (o < 1) {
n.scaleX *= o;
n.scaleY *= o;
}
var r = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < r; ++a) {
var c = cc.vv.mahjongmgr.getSide(a), l = e.getChildByName(c);
if (null != l) {
this._hupaiTips.push(l.getChildByName("HuPai"));
this._hupaiLists.push(l.getChildByName("hupailist"));
this._playEfxs.push(l.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(l.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var h = l.getChildByName("opt");
h.active = !1;
s = h.getChildByName("pai").getComponent(cc.Sprite);
var d = {
node: h,
sprite: s
};
this._opts.push(d);
}
}
var u = e.getChildByName("ops");
this._options = u;
if (u) for (var g = 0; g < u.childrenCount; ++g) {
var v = u.children[g];
if ("op" == v.name) {
var _ = v.getComponent(cc.Sprite);
_ && (_.enabled = !1);
var f = v.getChildByName("opTarget");
f && (f.active = !1);
}
}
var m = u ? u.getChildByName("New Layout") : null;
if (m) {
var p = m.getComponent(cc.Button);
p && (p.enabled = !1);
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
var s = this;
this.node.on("game_start", function(e) {
try {
s.onGameBeign(!0, e && e.detail);
} catch (e) {
console.error("[LDH] onGameBeign error:", e);
}
s.initCaishenTip();
});
this.node.on("game_begin", function() {
s.onGameBeign();
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
s.playEfx(i, "play_chi");
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
var a = n.getChildByName("opTarget");
a && (a.active = !1);
var s = n.getChildByName(e);
s.active = !0;
s.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
var n = i.getChildByName("opTarget");
n && (n.active = !1);
var a = this.getChiButton(i);
if (a) {
a.active = !0;
a.pai = e;
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
var s = t.getChildByName("btnLabel");
s && (s.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var s = a.addComponent(cc.Label);
s.string = "吃";
s.fontSize = 40;
s.lineHeight = 40;
s.overflow = cc.Label.Overflow.NONE;
s.enableWrapText = !1;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
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
}, s = t.getChildByName("cs1");
if (s) {
s.active = !0;
a(s, i.caishen);
}
var o = t.getChildByName("cs2");
if (o) {
var r = null != i.caishen2 && i.caishen2 >= 0;
o.active = r;
r && a(o, i.caishen2);
}
}
}
}
},
playEfx: function(e, t) {
var i = this._playEfxs[e];
i.node.active = !0;
i.play(t);
if (cc.vv && cc.vv.mahjongmgr) {
var n = null;
"play_hu" == t ? n = "mj_hu" : "play_zimo" == t ? n = "mj_zimo" : "play_chi" == t ? n = "mj_chi" : "play_peng" == t ? n = "mj_peng" : "play_guafeng" != t && "play_xiayu" != t && "play_gang" != t || (n = "mj_gang");
n && cc.vv.mahjongmgr.playSpineEfx(i.node, n);
}
},
onGameBeign: function(e) {
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), s = this._hupaiTips[a];
s.active = n.hued;
if (n.hued) {
s.getChildByName("sprHu").active = !n.iszimo;
s.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var o = this.node.getChildByName("game"), r = o.getChildByName("huanpaiinfo");
null != r && (r.active = !1);
var c = [ "right", "up", "left" ];
for (t = 0; t < c.length; ++t) {
var l = o.getChildByName(c[t]);
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
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, s) {
if (null != a && 0 != n.length) {
var o = a.convertToNodeSpaceAR(e);
n.sort(s);
for (var r = 0; r < n.length; ++r) {
var c = n[r], l = c.x, h = c.y, d = c.opacity;
t.push({
node: c,
x: l,
y: h,
op: d
});
c.setPosition(o);
c.opacity = 0;
c.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(l, h)), cc.fadeTo(.15, d))));
var u = .06 * r + .15;
u > i && (i = u);
}
}
}, a = [], s = null, o = 0; o < this._myMJArr.length; ++o) {
var r = this._myMJArr[o];
if (r && r.node && r.node.active && null != r.node.mjId) {
a.push(r.node);
s = r.node.parent;
}
}
n(a, s, function(e, t) {
return e.x - t.x;
});
for (var c = this.node.getChildByName("game"), l = cc.vv.gameNetMgr.seats || [], h = 0; h < l.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var u = cc.vv.mahjongmgr.getSide(d), g = c ? c.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var _ = [], f = 0; f < v.childrenCount; ++f) {
var m = v.children[f];
m.active && _.push(m);
}
n(_, v, "up" == u ? function(e, t) {
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
_getGestureSettings: function() {
var e = cc.vv.deskStyle;
if (e && e.getGestureSettings) return e.getGestureSettings();
try {
return {
multiSelect: !!JSON.parse(cc.sys.localStorage.getItem("gesture_multi_select") || "false"),
swipeUp: !!JSON.parse(cc.sys.localStorage.getItem("mj_gesture_swipe_up") || "false"),
playMode: JSON.parse(cc.sys.localStorage.getItem("mj_play_mode") || '"single"')
};
} catch (e) {
return {
multiSelect: !1,
swipeUp: !1,
playMode: "single"
};
}
},
_setupHandGestures: function() {
this._gestureSel = [];
this._gestureStart = null;
this._gesturePlayed = !1;
this._gestureMoved = !1;
this._lastTapTile = null;
this._lastTapTime = 0;
for (var e = 0; e < this._myMJArr.length; ++e) {
var t = this._myMJArr[e].node;
if (cc.isValid(t)) {
var i = t.getComponent(cc.Button);
i && (i.clickEvents = []);
t.on(cc.Node.EventType.TOUCH_START, function(e) {
this._onHandTouchStart(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
this._onHandTouchMove(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_END, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_CANCEL, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
}
}
},
_onHandTouchStart: function(e, t) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect || this._csPanel && this._csPanel.active) {
this.onMJClicked({
node: t,
currentTarget: t
});
e.stopPropagation();
} else {
var i = e.getLocation();
this._gestureStart = {
x: i.x,
y: i.y,
t: Date.now(),
node: t
};
this._gesturePlayed = !1;
this._gestureMoved = !1;
for (var n = 0; n < this._gestureSel.length; ++n) cc.isValid(this._gestureSel[n]) && (this._gestureSel[n].y = 0);
this._gestureSel = [];
}
},
_onHandTouchMove: function(e) {
if (this._gestureStart && !this._gesturePlayed) {
var t = this._getGestureSettings(), i = e.getLocation(), n = i.x - this._gestureStart.x, a = i.y - this._gestureStart.y;
if (t.swipeUp && a < -30) {
this._playTile(this._gestureStart.node);
this._gesturePlayed = !0;
e.stopPropagation();
} else if (t.multiSelect && Math.abs(n) > 8) {
this._gestureMoved = !0;
var s = this._findTileAtPos(i);
if (s && -1 == this._gestureSel.indexOf(s)) {
this._gestureSel.push(s);
this._setTileY(s, 15);
}
}
}
},
_onHandTouchEnd: function(e) {
if (this._gestureStart) {
var t = this._gestureStart;
this._gestureStart = null;
if (!this._gesturePlayed) if (this._gestureMoved && this._gestureSel.length > 0) e.stopPropagation(); else {
var i = this._getGestureSettings(), n = Date.now(), a = this._lastTapTile, s = a == t.node && n - this._lastTapTime < 300;
this._lastTapTile = t.node;
this._lastTapTime = n;
if ("double" === i.playMode) if (s) this._playTile(t.node); else {
a && a != t.node && cc.isValid(a) && this._setTileY(a, 0);
this._setTileY(t.node, 15);
} else this._playTile(t.node);
e.stopPropagation();
}
}
},
_playTile: function(e) {
if (cc.isValid(e) && null != e.mjId && cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
this.shoot(e.mjId);
e.y = 0;
this._selectedMJ = null;
for (var t = 0; t < this._gestureSel.length; ++t) cc.isValid(this._gestureSel[t]) && (this._gestureSel[t].y = 0);
this._gestureSel = [];
}
},
_findTileAtPos: function(e) {
for (var t = 0; t < this._myMJArr.length; ++t) {
var i = this._myMJArr[t].node;
if (cc.isValid(i) && i.active && i.getBoundingBoxToWorld().contains(e)) return i;
}
return null;
},
_handleChiSelect: function(e) {
if (null != e && null != e.mjId) for (var t = 0; t < this._myMJArr.length; ++t) if (e == this._myMJArr[t].node) {
var i = this._chiSelect.tiles, n = i.indexOf(e);
if (-1 != n) {
i.splice(n, 1);
this._setTileY(e, 0);
return;
}
if (i.length >= 2) return;
i.push(e);
this._setTileY(e, 15);
if (2 == i.length) {
var a = i[0].mjId, s = i[1].mjId, o = this._chiSelect.pai;
i[0].y = 0;
i[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ a, s, o ]);
}
return;
}
},
_setTileY: function(e, t) {
if (e && cc.isValid(e)) {
cc.Tween.stopAllByTarget(e);
cc.tween(e).to(.08, {
y: t
}, {
easing: "quadOut"
}).start();
}
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
this._setTileY(t, 0);
return;
}
if (n.length >= 2) return;
n.push(t);
this._setTileY(t, 15);
if (2 == n.length) {
var s = n[0].mjId, o = n[1].mjId, r = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ s, o, r ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var c = this._findMJNode(e);
if (null != c) for (var l = 0; l < this._myMJArr.length; ++l) if (c == this._myMJArr[l].node) {
if (c == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._setTileY(this._selectedMJ, 0);
this._selectedMJ = null;
return;
}
null != this._selectedMJ && this._setTileY(this._selectedMJ, 0);
this._setTileY(c, 15);
this._selectedMJ = c;
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
var n = cc.vv.gameNetMgr.getLocalIndex(e), a = cc.vv.mahjongmgr.getSide(n), s = cc.vv.mahjongmgr.getFoldPre(n), o = this.node.getChildByName("game").getChildByName(a).getChildByName("holds"), r = this.getMJIndex(a, 13), c = o.children[r];
if (null != c) {
c.scaleX = 1;
c.scaleY = 1;
if (null == t) c.active = !1; else if (t >= 0) {
c.active = !0;
if ("up" == a) {
c.scaleX = .73;
c.scaleY = .73;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(s, t);
if (0 == n) {
var l = cc.vv.gameNetMgr.conf || {};
i(c, l.caishen >= 0 && t == l.caishen || null != l.caishen2 && l.caishen2 >= 0 && t == l.caishen2);
}
} else if (null != t) {
c.active = !0;
if ("up" == a) {
c.scaleX = 1;
c.scaleY = 1;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(a);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), s = 0; s < n.childrenCount; ++s) {
var o = n.children[s];
o.scaleX = 1;
o.scaleY = 1;
o.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, s = a ? a.getChildByName("holds") : null;
if (null != s) {
var o = e.chis || [], r = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + o.length;
r *= 3;
for (var c = 0; c < r; ++c) {
var l = this.getMJIndex(i, c);
null != s.children[l] && (s.children[l].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (c = 0; c < d.length; ++c) {
l = this.getMJIndex(i, c + r);
if (null != s.children[l]) {
var u = s.children[l].getComponent(cc.Sprite);
if (null != u) {
if ("up" == i) {
u.node.scaleX = .73;
u.node.scaleY = .73;
}
u.node.active = !0;
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[c]);
}
}
}
this._hideUnusedHolds(i, s, r + d.length);
} else {
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (c = r; c < r + g; ++c) {
l = this.getMJIndex(i, c);
var v = s.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, s, r + g);
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
for (var s = cc.vv.gameNetMgr.conf, o = s ? s.caishen : -1, r = s ? s.caishen2 : -1, c = [], l = [], h = 0; h < i.length; ++h) {
var d = i[h];
o >= 0 && d == o || null != r && r >= 0 && d == r ? c.push(d) : l.push(d);
}
cc.vv.mahjongmgr.sortMJ(l);
i.length = 0;
for (var u = 0; u < c.length; ++u) i.push(c[u]);
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
var a, s = i.chis || [], o = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + s.length), r = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (r = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (r = 0);
a = r > 0 ? .5 * r : 20;
var c = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), l = this._myMJArr[o], h = l ? l.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", o, "holds.length=", n.length, "startSlot=", o, "endSlot=", o + n.length - 1);
for (var d = [], u = 0; u < n.length; ++u) {
var g = n[u];
if (null == (_ = this._myMJArr[u + o]) || null == _.node) {
d.push("SLOT_" + (u + o) + "=NULL");
break;
}
_.node.mjId = g;
_.node.y = 0;
var v = c && u == n.length - 1;
r > 0 && (_.node.x = h + u * r + (v ? a : 0));
this.setSpriteFrameByMJID("M_", _, g);
d.push("SLOT_" + (u + o) + "=" + g);
}
console.log("[initMahjongs] render:", d.join("|"));
for (u = 0; u < o; ++u) if (null != (_ = this._myMJArr[u]) && null != _.node) {
_.node.mjId = null;
_.spriteFrame = null;
_.node.active = !1;
}
for (u = o + n.length; u < this._myMJArr.length; ++u) {
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
setSpriteFrameByMJID: function(e, t, n) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, n);
t.node.active = !0;
var a = cc.vv.gameNetMgr.conf || {}, s = null != n && n >= 0 && (a.caishen >= 0 && n == a.caishen || null != a.caishen2 && a.caishen2 >= 0 && n == a.caishen2);
i(t.node, s);
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
for (var i = [], n = 36, a = 0; a < e.length; ++a) {
a > 0 && (n += 30);
var s = 46 * e[a].pais.length + 4 * (e[a].pais.length - 1);
i.push(s);
n += s;
}
var o = new cc.Node("chiPanel");
o.setContentSize(n, 120);
o.setPosition(0, -140);
t.addChild(o);
var r = new cc.Node("bg");
r.setContentSize(n, 120);
o.addChild(r);
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(18, 18, 24, 235);
c.strokeColor = cc.color(255, 200, 90, 255);
c.lineWidth = 3;
c.rect(-n / 2, -60, n, 120);
c.fill();
c.stroke();
var l = new cc.Node("cap");
l.setContentSize(n, 26);
l.setPosition(0, 37);
o.addChild(l);
var h = l.addComponent(cc.Label);
h.string = "点击组合完成操作";
h.fontSize = 22;
h.lineHeight = 26;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
l.color = cc.color(255, 225, 150);
for (var d = 18, u = 0; u < e.length; ++u) {
var g = e[u], v = g.pais, _ = i[u], f = new cc.Node("cpgItem" + u);
f.setContentSize(_, 66);
f.setPosition(-n / 2 + d + _ / 2, -13);
d += _ + 30;
o.addChild(f);
f.addComponent(cc.Button);
f.actType = g.type;
f.paiList = v;
f.targetPai = g.pai;
cc.vv.utils.addClickEvent(f, this.node, "MJGameLDH", "onChiItemClicked");
for (var m = 0; m < v.length; ++m) {
var p = new cc.Node("p" + m);
p.setContentSize(46, 66);
p.setPosition(-_ / 2 + 23 + 50 * m, 0);
f.addChild(p);
var b = p.addComponent(cc.Sprite);
b.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", v[m]);
b.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = o;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e && (e.node || e.currentTarget || e.target) || null;
if (null != t) {
if ("peng" == t.actType) cc.vv.net.send("peng"); else if ("gang" == t.actType) cc.vv.net.send("gang", t.targetPai); else if (t.paiList) {
for (var i = t.targetPai, n = [], a = cc.vv.gameNetMgr.getSelfData(), s = a && a.holds ? a.holds : [], o = cc.vv.gameNetMgr.conf || {}, r = o.caishen, c = o.caishen2, l = 0; l < t.paiList.length; ++l) {
var h = t.paiList[l];
h != i && (h != r && h != c && -1 != s.indexOf(h) ? n.push(h) : r >= 0 && -1 != s.indexOf(r) ? n.push(r) : null != c && c >= 0 && -1 != s.indexOf(c) && n.push(c));
}
n.push(i);
3 == n.length && cc.vv.net.send("chi", n);
}
this.hideChiPanel();
this.hideOptions();
}
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) cc.vv.net.send("gang", t.pai); else if ("btnHu" == i) cc.vv.net.send("hu"); else if ("btnGuo" == i) {
var n = this._options.getChildByName("btnHu");
if (n && n.active && cc.vv.alert && cc.vv.alert.show) {
var a = this;
cc.vv.alert.show(null, "当前可以胡牌，确定要过吗？", function() {
cc.vv.net.send("guo");
a.hideOptions();
}, !0);
return;
}
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
function i(e, t) {
var i = t ? cc.color(255, 208, 90) : cc.Color.WHITE;
e.color = i;
var n = e.getComponent(cc.Button);
if (n && n.transition === cc.Button.Transition.COLOR) {
n._mjOrigCol || (n._mjOrigCol = {
n: n.normalColor,
h: n.hoverColor,
p: n.pressedColor,
d: n.disabledColor
});
var a = n._mjOrigCol;
if (t) {
n.normalColor = i;
n.hoverColor = i;
n.pressedColor = cc.color(235, 185, 75);
} else {
n.normalColor = a.n;
n.hoverColor = a.h;
n.pressedColor = a.p;
n.disabledColor = a.d;
}
}
}
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
for (var n = [ "NoticeTip", "GameOverZP", "PengGangs", "MJRoom", "TimePointer", "GameResultZP", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow", "DeskStyle", "Alert" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
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
var s = n.children[a].getComponent(cc.Sprite);
this._myMJArr.push(s);
s.spriteFrame = null;
}
this._setupHandGestures();
var o = cc.view.getVisibleSize().width / 1280;
if (o < 1) {
n.scaleX *= o;
n.scaleY *= o;
}
var r = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < r; ++a) {
var c = cc.vv.mahjongmgr.getSide(a), l = e.getChildByName(c);
if (null != l) {
this._hupaiTips.push(l.getChildByName("HuPai"));
this._hupaiLists.push(l.getChildByName("hupailist"));
this._playEfxs.push(l.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(l.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var h = l.getChildByName("opt");
h.active = !1;
s = h.getChildByName("pai").getComponent(cc.Sprite);
var d = {
node: h,
sprite: s
};
this._opts.push(d);
}
}
var u = e.getChildByName("ops");
this._options = u;
if (u) for (var g = 0; g < u.childrenCount; ++g) {
var v = u.children[g];
if ("op" == v.name) {
var _ = v.getComponent(cc.Sprite);
_ && (_.enabled = !1);
var f = v.getChildByName("opTarget");
f && (f.active = !1);
}
}
var m = u ? u.getChildByName("New Layout") : null;
if (m) {
var p = m.getComponent(cc.Button);
p && (p.enabled = !1);
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
var s = this;
this.node.on("game_start", function(e) {
s.onGameBeign(!0, e && e.detail);
s.initCaishenTip();
});
this.node.on("game_begin", function() {
s.onGameBeign();
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
s.hideYoujinPanel();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
s.initHuaArea(t.si);
s._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
}
});
this.node.on("game_youjin", function(e) {
var t = e.detail;
t && s.showYoujinLevel(t.si, t.level);
});
this.node.on("game_fenbing", function(e) {
var t = e.detail;
if (t) {
var i = cc.vv.gameNetMgr.seats[t.si], n = i ? i.name : "" + t.si;
cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(n + " 分饼 " + t.score + " 分");
}
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
s.playEfx(i, "play_chi");
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
var a = n.getChildByName("opTarget");
a && (a.active = !1);
var s = n.getChildByName(e);
s.active = !0;
s.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
var n = i.getChildByName("opTarget");
n && (n.active = !1);
var a = this.getChiButton(i);
if (a) {
a.active = !0;
a.pai = e;
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
var s = t.getChildByName("btnLabel");
s && (s.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var s = a.addComponent(cc.Label);
s.string = "吃";
s.fontSize = 40;
s.lineHeight = 40;
s.overflow = cc.Label.Overflow.NONE;
s.enableWrapText = !1;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
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
var s = e.getChildByName("btnPeng");
a = new cc.Node(t);
e.addChild(a);
if (s) {
a.setPosition(s.getPosition());
a.setContentSize(s.getContentSize());
a.scaleX = s.scaleX;
a.scaleY = s.scaleY;
}
var o = a.addComponent(cc.Sprite);
o.type = cc.Sprite.Type.SIMPLE;
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(a)) {
var i = a.getComponent(cc.Sprite);
i && (i.spriteFrame = t);
}
});
a.addComponent(cc.Button);
var r = new cc.Node("btnLabel");
a.addChild(r);
var c = r.addComponent(cc.Label);
c.string = i;
c.fontSize = n || 40;
c.lineHeight = c.fontSize;
c.overflow = cc.Label.Overflow.NONE;
c.enableWrapText = !1;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
r.color = cc.color(255, 255, 255);
r.setPosition(0, 0);
cc.vv.utils.addClickEvent(a, this.node, "MJGameWujin", "onOptionClicked");
a.active = !1;
return a;
},
addZpOption: function(e, t, i, n) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var s = this._options.children[a];
if ("op" == s.name && 0 == s.active) {
s.active = !0;
s.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = null != i && i >= 0 ? cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", i) : null;
var o = this.getZpOpButton(s, e, t, n);
o.active = !0;
o.pai = i;
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
var s = t.getChildByName("btnYouJinGo");
s && (s.active = !1);
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
}, s = t.getChildByName("cs1");
if (s) {
s.active = !0;
a(s, i.caishen);
}
var o = t.getChildByName("cs2");
if (o) {
var r = null != i.caishen2 && i.caishen2 >= 0;
o.active = r;
r && a(o, i.caishen2);
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
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game") || this.node, a = new cc.Node("huaArea_" + i), s = this._huaAreaPos(i);
a.setPosition(s.x, s.y);
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
if (0 != n.length) for (var a = cc.vv.mahjongmgr.bottomAtlas, s = 0; s < n.length; ++s) {
var o = n[s], r = new cc.Node("hua" + s);
r.setContentSize(44, 64);
r.setPosition(48 * s + 22, 0);
i.addChild(r);
var c = r.addComponent(cc.Sprite);
c.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var l = o - 34, h = l >= 0 && l < 8 ? "M_" + [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][l] : null, d = h ? a.getSpriteFrame(h) : null;
if (null != d) c.spriteFrame = d; else {
var u = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
c.spriteFrame = u;
var g = new cc.Node("name");
r.addChild(g);
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
var a = cc.vv.mahjongmgr.getSide(i), s = this.getHuaArea(e);
n = new cc.Node("youjin_" + a);
s.parent.addChild(n);
var o = n.addComponent(cc.Label);
o.fontSize = 30;
o.lineHeight = 34;
o.overflow = cc.Label.Overflow.NONE;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
n.color = cc.color(255, 90, 90);
var r = n.addComponent(cc.LabelOutline);
r.color = cc.color(80, 0, 0);
r.width = 2;
this._youjinLabels[i] = n;
}
var c = this.getHuaArea(e);
n.setPosition(c.x, c.y + 80);
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
var s = a.addComponent(cc.Graphics);
s.fillColor = cc.color(18, 18, 24, 235);
s.strokeColor = cc.color(255, 200, 90, 255);
s.lineWidth = 3;
s.rect(-i / 2, -73, i, 146);
s.fill();
s.stroke();
var o = new cc.Node("cap");
o.setContentSize(i, 28);
o.setPosition(0, 49);
n.addChild(o);
var r = o.addComponent(cc.Label);
r.string = "选择一张牌宣告游金";
r.fontSize = 22;
r.lineHeight = 28;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.verticalAlign = cc.Label.VerticalAlign.CENTER;
o.color = cc.color(255, 225, 150);
for (var c = 0; c < e.length; ++c) {
var l = new cc.Node("yjItem" + c);
l.setContentSize(62, 90);
l.setPosition(51 + -i / 2 + 78 * c, -14);
n.addChild(l);
l.addComponent(cc.Button);
l.pai = e[c];
cc.vv.utils.addClickEvent(l, this.node, "MJGameWujin", "onYoujinItemClicked");
var h = l.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[c]);
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
if (cc.vv && cc.vv.mahjongmgr) {
var n = null;
"play_hu" == t ? n = "mj_hu" : "play_zimo" == t ? n = "mj_zimo" : "play_chi" == t ? n = "mj_chi" : "play_peng" == t ? n = "mj_peng" : "play_guafeng" != t && "play_xiayu" != t && "play_gang" != t || (n = "mj_gang");
n && cc.vv.mahjongmgr.playSpineEfx(i.node, n);
}
},
onGameBeign: function(e) {
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), s = this._hupaiTips[a];
s.active = n.hued;
if (n.hued) {
s.getChildByName("sprHu").active = !n.iszimo;
s.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var o = this.node.getChildByName("game"), r = o.getChildByName("huanpaiinfo");
null != r && (r.active = !1);
var c = [ "right", "up", "left" ];
for (t = 0; t < c.length; ++t) {
var l = o.getChildByName(c[t]);
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
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, s) {
if (null != a && 0 != n.length) {
var o = a.convertToNodeSpaceAR(e);
n.sort(s);
for (var r = 0; r < n.length; ++r) {
var c = n[r], l = c.x, h = c.y, d = c.opacity;
t.push({
node: c,
x: l,
y: h,
op: d
});
c.setPosition(o);
c.opacity = 0;
c.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(l, h)), cc.fadeTo(.15, d))));
var u = .06 * r + .15;
u > i && (i = u);
}
}
}, a = [], s = null, o = 0; o < this._myMJArr.length; ++o) {
var r = this._myMJArr[o];
if (r && r.node && r.node.active && null != r.node.mjId) {
a.push(r.node);
s = r.node.parent;
}
}
n(a, s, function(e, t) {
return e.x - t.x;
});
for (var c = this.node.getChildByName("game"), l = cc.vv.gameNetMgr.seats || [], h = 0; h < l.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var u = cc.vv.mahjongmgr.getSide(d), g = c ? c.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var _ = [], f = 0; f < v.childrenCount; ++f) {
var m = v.children[f];
m.active && _.push(m);
}
n(_, v, "up" == u ? function(e, t) {
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
btnChi: 1,
btnQiangJin: 1,
btnYouJin: 1,
btnYouJinGo: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
_getGestureSettings: function() {
var e = cc.vv.deskStyle;
if (e && e.getGestureSettings) return e.getGestureSettings();
try {
return {
multiSelect: !!JSON.parse(cc.sys.localStorage.getItem("gesture_multi_select") || "false"),
swipeUp: !!JSON.parse(cc.sys.localStorage.getItem("mj_gesture_swipe_up") || "false"),
playMode: JSON.parse(cc.sys.localStorage.getItem("mj_play_mode") || '"single"')
};
} catch (e) {
return {
multiSelect: !1,
swipeUp: !1,
playMode: "single"
};
}
},
_setupHandGestures: function() {
this._gestureSel = [];
this._gestureStart = null;
this._gesturePlayed = !1;
this._gestureMoved = !1;
this._lastTapTile = null;
this._lastTapTime = 0;
for (var e = 0; e < this._myMJArr.length; ++e) {
var t = this._myMJArr[e].node;
if (cc.isValid(t)) {
var i = t.getComponent(cc.Button);
i && (i.clickEvents = []);
t.on(cc.Node.EventType.TOUCH_START, function(e) {
this._onHandTouchStart(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
this._onHandTouchMove(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_END, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_CANCEL, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
}
}
},
_onHandTouchStart: function(e, t) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect || this._csPanel && this._csPanel.active) {
this.onMJClicked({
node: t,
currentTarget: t
});
e.stopPropagation();
} else {
var i = e.getLocation();
this._gestureStart = {
x: i.x,
y: i.y,
t: Date.now(),
node: t
};
this._gesturePlayed = !1;
this._gestureMoved = !1;
for (var n = 0; n < this._gestureSel.length; ++n) cc.isValid(this._gestureSel[n]) && (this._gestureSel[n].y = 0);
this._gestureSel = [];
}
},
_onHandTouchMove: function(e) {
if (this._gestureStart && !this._gesturePlayed) {
var t = this._getGestureSettings(), i = e.getLocation(), n = i.x - this._gestureStart.x, a = i.y - this._gestureStart.y;
if (t.swipeUp && a < -30) {
this._playTile(this._gestureStart.node);
this._gesturePlayed = !0;
e.stopPropagation();
} else if (t.multiSelect && Math.abs(n) > 8) {
this._gestureMoved = !0;
var s = this._findTileAtPos(i);
if (s && -1 == this._gestureSel.indexOf(s)) {
this._gestureSel.push(s);
this._setTileY(s, 15);
}
}
}
},
_onHandTouchEnd: function(e) {
if (this._gestureStart) {
var t = this._gestureStart;
this._gestureStart = null;
if (!this._gesturePlayed) if (this._gestureMoved && this._gestureSel.length > 0) e.stopPropagation(); else {
var i = this._getGestureSettings(), n = Date.now(), a = this._lastTapTile, s = a == t.node && n - this._lastTapTime < 300;
this._lastTapTile = t.node;
this._lastTapTime = n;
if ("double" === i.playMode) if (s) this._playTile(t.node); else {
a && a != t.node && cc.isValid(a) && this._setTileY(a, 0);
this._setTileY(t.node, 15);
} else this._playTile(t.node);
e.stopPropagation();
}
}
},
_playTile: function(e) {
if (cc.isValid(e) && null != e.mjId && cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
this.shoot(e.mjId);
e.y = 0;
this._selectedMJ = null;
for (var t = 0; t < this._gestureSel.length; ++t) cc.isValid(this._gestureSel[t]) && (this._gestureSel[t].y = 0);
this._gestureSel = [];
}
},
_findTileAtPos: function(e) {
for (var t = 0; t < this._myMJArr.length; ++t) {
var i = this._myMJArr[t].node;
if (cc.isValid(i) && i.active && i.getBoundingBoxToWorld().contains(e)) return i;
}
return null;
},
_handleChiSelect: function(e) {
if (null != e && null != e.mjId) for (var t = 0; t < this._myMJArr.length; ++t) if (e == this._myMJArr[t].node) {
var i = this._chiSelect.tiles, n = i.indexOf(e);
if (-1 != n) {
i.splice(n, 1);
this._setTileY(e, 0);
return;
}
if (i.length >= 2) return;
i.push(e);
this._setTileY(e, 15);
if (2 == i.length) {
var a = i[0].mjId, s = i[1].mjId, o = this._chiSelect.pai;
i[0].y = 0;
i[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ a, s, o ]);
}
return;
}
},
_setTileY: function(e, t) {
if (e && cc.isValid(e)) {
cc.Tween.stopAllByTarget(e);
cc.tween(e).to(.08, {
y: t
}, {
easing: "quadOut"
}).start();
}
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
this._setTileY(t, 0);
return;
}
if (n.length >= 2) return;
n.push(t);
this._setTileY(t, 15);
if (2 == n.length) {
var s = n[0].mjId, o = n[1].mjId, r = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ s, o, r ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var c = this._findMJNode(e);
if (null != c) for (var l = 0; l < this._myMJArr.length; ++l) if (c == this._myMJArr[l].node) {
if (c == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._setTileY(this._selectedMJ, 0);
this._selectedMJ = null;
return;
}
null != this._selectedMJ && this._setTileY(this._selectedMJ, 0);
this._setTileY(c, 15);
this._selectedMJ = c;
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
var n = cc.vv.gameNetMgr.getLocalIndex(e), a = cc.vv.mahjongmgr.getSide(n), s = cc.vv.mahjongmgr.getFoldPre(n), o = this.node.getChildByName("game").getChildByName(a).getChildByName("holds"), r = this.getMJIndex(a, 13), c = o.children[r];
if (null != c) {
c.scaleX = 1;
c.scaleY = 1;
if (null == t) c.active = !1; else if (t >= 0) {
c.active = !0;
if ("up" == a) {
c.scaleX = .73;
c.scaleY = .73;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(s, t);
if (0 == n) {
var l = cc.vv.gameNetMgr.conf || {};
i(c, l.caishen >= 0 && t == l.caishen || null != l.caishen2 && l.caishen2 >= 0 && t == l.caishen2);
}
} else if (null != t) {
c.active = !0;
if ("up" == a) {
c.scaleX = 1;
c.scaleY = 1;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(a);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), s = 0; s < n.childrenCount; ++s) {
var o = n.children[s];
o.scaleX = 1;
o.scaleY = 1;
o.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, s = a ? a.getChildByName("holds") : null;
if (null != s) {
var o = e.chis || [], r = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + o.length;
r *= 3;
for (var c = 0; c < r; ++c) {
var l = this.getMJIndex(i, c);
null != s.children[l] && (s.children[l].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (c = 0; c < d.length; ++c) {
l = this.getMJIndex(i, c + r);
if (null != s.children[l]) {
var u = s.children[l].getComponent(cc.Sprite);
if (null != u) {
if ("up" == i) {
u.node.scaleX = .73;
u.node.scaleY = .73;
}
u.node.active = !0;
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[c]);
}
}
}
this._hideUnusedHolds(i, s, r + d.length);
} else {
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (c = r; c < r + g; ++c) {
l = this.getMJIndex(i, c);
var v = s.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, s, r + g);
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
for (var s = cc.vv.gameNetMgr.conf, o = s ? s.caishen : -1, r = s ? s.caishen2 : -1, c = [], l = [], h = 0; h < i.length; ++h) {
var d = i[h];
o >= 0 && d == o || null != r && r >= 0 && d == r ? c.push(d) : l.push(d);
}
cc.vv.mahjongmgr.sortMJ(l);
i.length = 0;
for (var u = 0; u < c.length; ++u) i.push(c[u]);
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
var a, s = i.chis || [], o = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + s.length), r = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (r = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (r = 0);
a = r > 0 ? .5 * r : 20;
var c = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), l = this._myMJArr[o], h = l ? l.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", o, "holds.length=", n.length, "startSlot=", o, "endSlot=", o + n.length - 1);
for (var d = cc.vv.gameNetMgr.conf, u = d ? d.caishen : -1, g = d ? d.caishen2 : -1, v = [], _ = 0; _ < n.length; ++_) {
var f = n[_];
if (null == (b = this._myMJArr[_ + o]) || null == b.node) {
v.push("SLOT_" + (_ + o) + "=NULL");
break;
}
b.node.mjId = f;
b.node.y = 0;
var m = c && _ == n.length - 1;
r > 0 && (b.node.x = h + _ * r + (m ? a : 0));
this.setSpriteFrameByMJID("M_", b, f);
var p = u >= 0 && f == u || null != g && g >= 0 && f == g;
b.node.color = p ? cc.color(255, 200, 90) : cc.Color.WHITE;
v.push("SLOT_" + (_ + o) + "=" + f);
}
console.log("[initMahjongs] render:", v.join("|"));
for (_ = 0; _ < o; ++_) if (null != (b = this._myMJArr[_]) && null != b.node) {
b.node.mjId = null;
b.spriteFrame = null;
b.node.active = !1;
}
for (_ = o + n.length; _ < this._myMJArr.length; ++_) {
var b;
if (null != (b = this._myMJArr[_]) && null != b.node) {
b.node.mjId = null;
b.spriteFrame = null;
b.node.active = !1;
}
}
}
} else console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", i ? i.holds : i);
},
setSpriteFrameByMJID: function(e, t, n) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, n);
t.node.active = !0;
var a = cc.vv.gameNetMgr.conf || {}, s = null != n && n >= 0 && (a.caishen >= 0 && n == a.caishen || null != a.caishen2 && a.caishen2 >= 0 && n == a.caishen2);
i(t.node, s);
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
for (var i = [], n = 36, a = 0; a < e.length; ++a) {
a > 0 && (n += 30);
var s = 46 * e[a].pais.length + 4 * (e[a].pais.length - 1);
i.push(s);
n += s;
}
var o = new cc.Node("chiPanel");
o.setContentSize(n, 120);
o.setPosition(0, -140);
t.addChild(o);
var r = new cc.Node("bg");
r.setContentSize(n, 120);
o.addChild(r);
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(18, 18, 24, 235);
c.strokeColor = cc.color(255, 200, 90, 255);
c.lineWidth = 3;
c.rect(-n / 2, -60, n, 120);
c.fill();
c.stroke();
var l = new cc.Node("cap");
l.setContentSize(n, 26);
l.setPosition(0, 37);
o.addChild(l);
var h = l.addComponent(cc.Label);
h.string = "点击组合完成操作";
h.fontSize = 22;
h.lineHeight = 26;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
l.color = cc.color(255, 225, 150);
for (var d = 18, u = 0; u < e.length; ++u) {
var g = e[u], v = g.pais, _ = i[u], f = new cc.Node("cpgItem" + u);
f.setContentSize(_, 66);
f.setPosition(-n / 2 + d + _ / 2, -13);
d += _ + 30;
o.addChild(f);
f.addComponent(cc.Button);
f.actType = g.type;
f.paiList = v;
f.targetPai = g.pai;
cc.vv.utils.addClickEvent(f, this.node, "MJGameWujin", "onChiItemClicked");
for (var m = 0; m < v.length; ++m) {
var p = new cc.Node("p" + m);
p.setContentSize(46, 66);
p.setPosition(-_ / 2 + 23 + 50 * m, 0);
f.addChild(p);
var b = p.addComponent(cc.Sprite);
b.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", v[m]);
b.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = o;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e && (e.node || e.currentTarget || e.target) || null;
if (null != t) {
if ("peng" == t.actType) cc.vv.net.send("peng"); else if ("gang" == t.actType) cc.vv.net.send("gang", t.targetPai); else if (t.paiList) {
for (var i = t.targetPai, n = [], a = cc.vv.gameNetMgr.getSelfData(), s = a && a.holds ? a.holds : [], o = cc.vv.gameNetMgr.conf || {}, r = o.caishen, c = o.caishen2, l = 0; l < t.paiList.length; ++l) {
var h = t.paiList[l];
h != i && (h != r && h != c && -1 != s.indexOf(h) ? n.push(h) : r >= 0 && -1 != s.indexOf(r) ? n.push(r) : null != c && c >= 0 && -1 != s.indexOf(c) && n.push(c));
}
n.push(i);
3 == n.length && cc.vv.net.send("chi", n);
}
this.hideChiPanel();
this.hideOptions();
}
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
var s = this._options.getChildByName("btnHu");
if (s && s.active && cc.vv.alert && cc.vv.alert.show) {
var o = this;
cc.vv.alert.show(null, "当前可以胡牌，确定要过吗？", function() {
cc.vv.net.send("guo");
o.hideOptions();
}, !0);
return;
}
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
function i(e, t) {
var i = t ? cc.color(255, 208, 90) : cc.Color.WHITE;
e.color = i;
var n = e.getComponent(cc.Button);
if (n && n.transition === cc.Button.Transition.COLOR) {
n._mjOrigCol || (n._mjOrigCol = {
n: n.normalColor,
h: n.hoverColor,
p: n.pressedColor,
d: n.disabledColor
});
var a = n._mjOrigCol;
if (t) {
n.normalColor = i;
n.hoverColor = i;
n.pressedColor = cc.color(235, 185, 75);
} else {
n.normalColor = a.n;
n.hoverColor = a.h;
n.pressedColor = a.p;
n.disabledColor = a.d;
}
}
}
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
_playEfxs: [],
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
for (var n = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow", "DeskStyle", "Alert" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
this.initView();
this.initEventHandlers();
this.gameRoot.active = !0;
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
this._gamecount.string = "剩余" + Math.max(0, cc.vv.gameNetMgr.maxNumOfGames - cc.vv.gameNetMgr.numOfGames) + "局";
for (var t = e.getChildByName("myself").getChildByName("holds"), i = 0; i < t.children.length; ++i) {
var n = t.children[i].getComponent(cc.Sprite);
this._myMJArr.push(n);
n.spriteFrame = null;
}
for (i = 0; i < this._myMJArr.length; ++i) {
var a = this._myMJArr[i].node.getComponent(cc.Button);
if (null != a) {
var s = new cc.Component.EventHandler();
s.target = this.node;
s.component = "MJGameZJLAO";
s.handler = "onMJClicked";
s.customEventData = "";
a.clickEvents = [ s ];
}
}
this._setupHandGestures();
var o = cc.view.getVisibleSize().width / 1280;
if (o < 1) {
t.scaleX *= o;
t.scaleY *= o;
}
var r = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (i = 0; i < r; ++i) {
var c = cc.vv.mahjongmgr.getSide(i), l = e.getChildByName(c);
if (null != l) {
this._playEfxs.push(l.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(l.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
}
}
var h = e.getChildByName("ops");
this._options = h;
if (h) for (var d = 0; d < h.childrenCount; ++d) {
var u = h.children[d];
if ("op" == u.name) {
var g = u.getComponent(cc.Sprite);
g && (g.enabled = !1);
var v = u.getChildByName("opTarget");
v && (v.active = !1);
}
}
var _ = h ? h.getChildByName("New Layout") : null;
if (_) {
var f = _.getComponent(cc.Button);
f && (f.enabled = !1);
_.active = !1;
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
var s = this;
this.node.on("game_start", function(e) {
try {
s.onGameBeign(!0, e && e.detail);
} catch (e) {
console.error("[ZJLAO] onGameBeign error:", e);
}
s.initCaishenTip();
});
this.node.on("game_begin", function() {
s.onGameBeign();
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
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t);
0 == i && s.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
s.initMopai(t, e.pai);
e.zimo ? s.playEfx(i, "play_zimo") : s.playEfx(i, "play_hu");
cc.vv.mahjongmgr.playRandSFX(e.zimo ? "zimo" : "hu", e.zimo ? 2 : 3);
});
this.node.on("mj_count", function() {
s._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
});
this.node.on("game_num", function() {
s._gamecount.string = "剩余" + Math.max(0, cc.vv.gameNetMgr.maxNumOfGames - cc.vv.gameNetMgr.numOfGames) + "局";
});
this.node.on("game_over", function() {
s.gameRoot.active = !0;
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
s._chiJustSent = !1;
s.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? s.initMahjongs(!1, t) : s.initOtherMahjongs(t);
var i = s.getLocalIndex(t.seatindex);
s.playEfx(i, "play_chi");
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
addOption: function(e, t, i) {
for (var n = 0; n < this._options.childrenCount; ++n) {
var a = this._options.children[n];
if ("op" == a.name && 0 == a.active) {
a.active = !0;
var s = a.getChildByName("opTarget");
s && (s.active = !1);
var o = a.getChildByName(e);
o.active = !0;
o.pai = t;
o.gangpai = i && i.length ? i.slice() : null;
var r, c = this;
if (o.gangpai) r = o.gangpai.map(function(e) {
var t = c._buildOpTiles([ e, e, e ]);
t.opPai = e;
return t;
}); else if ("btnPeng" == e) {
var l = c._buildOpTiles([ t, t ]);
l.push(t);
r = [ l.sort(function(e, t) {
return e - t;
}) ];
} else r = [ [ t ] ];
var h = null;
"btnGang" == e ? h = function(e) {
cc.vv.net.send("gang", null != e.opPai ? e.opPai : e[0]);
c.hideOptions();
} : "btnPeng" == e ? h = function() {
cc.vv.net.send("peng");
c.hideOptions();
} : "btnHu" == e && (h = function() {
cc.vv.net.send("hu");
c.hideOptions();
});
this._showOpTiles(o, r, h);
return;
}
}
},
addChiOption: function(e, t) {
for (var i = 0; i < this._options.childrenCount; ++i) {
var n = this._options.children[i];
if ("op" == n.name && 0 == n.active) {
n.active = !0;
var a = n.getChildByName("opTarget");
a && (a.active = !1);
var s = this.getChiButton(n);
if (s) {
s.active = !0;
s.pai = e;
s.chipai = t || null;
var o = [];
if (t && t.length) for (var r = 0; r < t.length; ++r) {
var c = t[r];
if (c && c.length >= 3) {
var l = this._buildOpTiles([ c[0], c[1] ]);
l.push(c[2]);
o.push(l.sort(function(e, t) {
return e - t;
}));
}
}
!o.length && null != e && e >= 0 && o.push([ e ]);
var h = this;
this._showOpTiles(s, o, function(e) {
e.length >= 3 && h._sendChi(e);
});
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
var i = t.getComponent(cc.Button);
if (i) {
var n = new cc.Component.EventHandler();
n.target = this.node;
n.component = "MJGameZJLAO";
n.handler = "onOptionClicked";
n.customEventData = "";
i.clickEvents = [ n ];
}
}
return t;
}
var a = e.getChildByName("btnPeng");
t = new cc.Node("btnChi");
e.addChild(t);
if (a) {
t.setPosition(a.getPosition());
t.setContentSize(a.getContentSize());
t.scaleX = a.scaleX;
t.scaleY = a.scaleY;
}
var s = t.addComponent(cc.Sprite);
s.type = cc.Sprite.Type.SIMPLE;
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
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
var s = t.getChildByName("btnLabel");
s && (s.active = !1);
}
});
t.addComponent(cc.Button);
var o = new cc.Node("btnLabel");
t.addChild(o);
var r = o.addComponent(cc.Label);
r.string = "吃";
r.fontSize = 40;
r.lineHeight = 40;
r.overflow = cc.Label.Overflow.NONE;
r.enableWrapText = !1;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.verticalAlign = cc.Label.VerticalAlign.CENTER;
o.color = cc.color(255, 255, 255);
o.setPosition(0, 0);
cc.vv.utils.addClickEvent(t, this.node, "MJGameZJLAO", "onOptionClicked");
t.active = !1;
return t;
},
_isCaishenPai: function(e) {
var t = cc.vv.gameNetMgr.conf;
return !(!t || null == e || e < 0) && (e == t.caishen || null != t.caishen2 && t.caishen2 >= 0 && e == t.caishen2);
},
_setOpCaishenCorner: function(e, t) {
if (e) {
var i = e.getChildByName("csCorner");
if (this._isCaishenPai(t)) {
if (!i) {
var n = this.node.getChildByName("game"), a = n ? n.getChildByName("csCornerOp") : null;
if (!a) return;
(i = cc.instantiate(a)).name = "csCorner";
e.addChild(i);
}
i.active = !0;
} else i && (i.active = !1);
}
},
_buildOpTiles: function(e) {
var t = cc.vv.gameNetMgr.seats && cc.vv.gameNetMgr.seats[cc.vv.gameNetMgr.seatIndex], i = {};
if (t && t.holds) for (var n = 0; n < t.holds.length; ++n) i[t.holds[n]] = (i[t.holds[n]] || 0) + 1;
var a = cc.vv.gameNetMgr.conf || {}, s = [];
null != a.caishen && a.caishen >= 0 && s.push(a.caishen);
null != a.caishen2 && a.caishen2 >= 0 && a.caishen2 != a.caishen && s.push(a.caishen2);
var o = {}, r = [];
for (n = 0; n < e.length; ++n) {
var c = e[n];
if ((i[c] || 0) - (o[c] || 0) > 0) {
o[c] = (o[c] || 0) + 1;
r.push(c);
} else {
for (var l = c, h = 0; h < s.length; ++h) {
var d = s[h];
if ((i[d] || 0) - (o[d] || 0) > 0) {
o[d] = (o[d] || 0) + 1;
l = d;
break;
}
}
r.push(l);
}
}
return r;
},
_showOpTiles: function(e, t, i) {
if (e) {
var n = e.getChildByName("opTiles");
n && n.destroy();
if (t && t.length) {
var a = new cc.Node("opTiles");
e.addChild(a);
for (var s = [], o = 0; o < t.length; ++o) {
var r = t[o].length;
s.push({
w: 71 + 47 * (r - 1),
h: 96
});
}
var c = [];
for (o = 0; o < t.length; o += 2) {
for (var l = t.slice(o, o + 2), h = s.slice(o, o + 2), d = 0, u = 0; u < h.length; ++u) d += h[u].w;
d += 14 * (h.length - 1);
c.push({
groups: l,
plates: h,
w: d
});
}
for (var g = 0; g < c.length; ++g) for (var v = c[g], _ = -v.w / 2, f = 198 + 106 * g, m = 0; m < v.groups.length; ++m) {
var p = v.groups[m], b = v.plates[m], C = new cc.Node("grp");
a.addChild(C);
C.setContentSize(b.w, b.h);
C.setPosition(_ + b.w / 2, f);
var y = C.addComponent(cc.Graphics);
y.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 6);
y.fillColor = cc.color(0, 0, 0, 150);
y.fill();
y.strokeColor = cc.color(255, 200, 90, 220);
y.lineWidth = 2;
y.stroke();
for (var S = -(47 * (p.length - 1) + 55) / 2 + 27.5, N = 0; N < p.length; ++N) {
var M = new cc.Node("t");
C.addChild(M);
var B = M.addComponent(cc.Sprite);
B.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", p[N]);
B.sizeMode = cc.Sprite.SizeMode.CUSTOM;
M.setContentSize(55, 84);
M.setPosition(S, 0);
this._isCaishenPai(p[N]) && (M.color = cc.color(255, 208, 90));
this._setOpCaishenCorner(M, p[N]);
S += 47;
}
i && function(e, t) {
C.on(cc.Node.EventType.TOUCH_END, function(e) {
i(t);
e && e.stopPropagation();
});
}(0, p);
_ += b.w + 14;
}
}
}
},
_sendChi: function(e) {
console.log("[chi] send", e[0], e[1], e[2]);
this._chiJustSent = !0;
var t = this;
this.scheduleOnce(function() {
if (t._chiJustSent) {
t._chiJustSent = !1;
t._toast("吃牌超时,下次手快一点");
}
}, 2);
cc.vv.net.send("chi", e.slice());
this.hideOptions();
},
_flashOpTiles: function(e) {
var t = e ? e.getChildByName("opTiles") : null;
if (t) {
t.stopAllActions();
t.scale = 1;
t.runAction(cc.sequence(cc.scaleTo(.12, 1.08), cc.scaleTo(.12, 1)));
}
},
_toast: function(e) {
var t = this.node.getChildByName("game") || this.node, i = t.getChildByName("opToast");
i && i.destroy();
var n = new cc.Node("opToast");
t.addChild(n);
n.setPosition(0, -250);
var a = n.addComponent(cc.Label);
a.string = e;
a.fontSize = 32;
a.lineHeight = 36;
a.overflow = cc.Label.Overflow.NONE;
n.color = cc.color(255, 220, 80);
var s = n.addComponent(cc.LabelOutline);
s.color = cc.color(60, 30, 0);
s.width = 3;
this.scheduleOnce(function() {
cc.isValid(n) && n.destroy();
}, 1.6);
},
enterChiSelect: function(e, t) {
this.cancelChiSelect();
this._chiSelect = {
pai: e,
tiles: [],
chipai: t && t.length ? t : null
};
var i = this.node.getChildByName("game") || this.node, n = i.getChildByName("chiHint");
this._chiHintBaked = !!n;
if (null == n) {
(n = new cc.Node("chiHint")).setPosition(0, -200);
i.addChild(n);
var a = n.addComponent(cc.Label);
a.string = "请选择两张手牌";
a.fontSize = 36;
a.lineHeight = 40;
a.overflow = cc.Label.Overflow.NONE;
n.color = cc.color(255, 220, 80);
var s = n.addComponent(cc.LabelOutline);
s.color = cc.color(60, 30, 0);
s.width = 3;
}
var o = n.getComponent(cc.Label);
o && (o.string = "请选择两张手牌");
n.active = !0;
this._chiHintBaked || n.setPosition(0, -200);
this._chiHint = n;
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
for (var n = 0; n < t.childrenCount; ++n) {
var a = t.children[n];
if (/^btn/.test(a.name)) {
var s = a.getChildByName("opTiles");
s && s.destroy();
}
}
}
}
this.hideChiPanel();
this.cancelChiSelect();
}
},
showAction: function(e) {
if (this._chiSelect) {
if (e && e.chi) return;
this.cancelChiSelect();
}
if (e && e.chi && this._chiJustSent) {
this._chiJustSent = !1;
this._toast("这两张不能吃,请重选");
}
this._options.active && this.hideOptions();
if (e && (e.hu || e.gang || e.peng || e.chi)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) {
var t = e.gangpai && e.gangpai.length ? e.gangpai[0] : e.pai;
this.addOption("btnGang", t, e.gangpai);
}
e.chi && this.addChiOption(e.pai, e.chipai);
var i = this._options.getChildByName("btnGuo");
i && (i.active = !0);
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
}, s = t.getChildByName("cs1");
if (s) {
s.active = !0;
s.color = cc.color(255, 208, 90);
a(s, i.caishen);
}
var o = t.getChildByName("cs2");
if (o) {
var r = null != i.caishen2 && i.caishen2 >= 0;
o.active = r;
if (r) {
o.color = cc.color(255, 208, 90);
a(o, i.caishen2);
}
}
}
}
}
},
playEfx: function(e, t) {
var i = this._playEfxs[e];
i.node.active = !0;
i.play(t);
if (cc.vv && cc.vv.mahjongmgr) {
var n = null;
"play_hu" == t ? n = "mj_hu" : "play_zimo" == t ? n = "mj_zimo" : "play_chi" == t ? n = "mj_chi" : "play_peng" == t ? n = "mj_peng" : "play_guafeng" != t && "play_xiayu" != t && "play_gang" != t || (n = "mj_gang");
n && cc.vv.mahjongmgr.playSpineEfx(i.node, n);
}
},
onGameBeign: function(e) {
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
this.hideChupai();
this.hideOptions();
var i = this.node.getChildByName("game"), n = i.getChildByName("huanpaiinfo");
null != n && (n.active = !1);
var a = [ "right", "up", "left" ];
for (t = 0; t < a.length; ++t) {
var s = i.getChildByName(a[t]);
if (null != s) if (cc.vv.mahjongmgr.getLocalIndexBySlot(t + 1) < 0) s.active = !1; else {
s.active = !0;
for (var o = s.getChildByName("holds"), r = 0; r < o.childrenCount; ++r) o.children[r].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var c = cc.vv.gameNetMgr.seats;
for (var t in c) {
var l = c[t];
if (0 != cc.vv.gameNetMgr.getLocalIndex(t)) {
this.initOtherMahjongs(l);
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
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, s) {
if (null != a && 0 != n.length) {
var o = a.convertToNodeSpaceAR(e);
n.sort(s);
for (var r = 0; r < n.length; ++r) {
var c = n[r], l = c.x, h = c.y, d = c.opacity;
t.push({
node: c,
x: l,
y: h,
op: d
});
c.setPosition(o);
c.opacity = 0;
c.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(l, h)), cc.fadeTo(.15, d))));
var u = .06 * r + .15;
u > i && (i = u);
}
}
}, a = [], s = null, o = 0; o < this._myMJArr.length; ++o) {
var r = this._myMJArr[o];
if (r && r.node && r.node.active && null != r.node.mjId) {
a.push(r.node);
s = r.node.parent;
}
}
n(a, s, function(e, t) {
return e.x - t.x;
});
for (var c = this.node.getChildByName("game"), l = cc.vv.gameNetMgr.seats || [], h = 0; h < l.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var u = cc.vv.mahjongmgr.getSide(d), g = c ? c.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var _ = [], f = 0; f < v.childrenCount; ++f) {
var m = v.children[f];
m.active && _.push(m);
}
n(_, v, "up" == u ? function(e, t) {
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
_getGestureSettings: function() {
var e = cc.vv.deskStyle;
if (e && e.getGestureSettings) return e.getGestureSettings();
try {
return {
multiSelect: !!JSON.parse(cc.sys.localStorage.getItem("gesture_multi_select") || "false"),
swipeUp: !!JSON.parse(cc.sys.localStorage.getItem("mj_gesture_swipe_up") || "false"),
playMode: JSON.parse(cc.sys.localStorage.getItem("mj_play_mode") || '"single"')
};
} catch (e) {
return {
multiSelect: !1,
swipeUp: !1,
playMode: "single"
};
}
},
_setupHandGestures: function() {
this._gestureSel = [];
this._gestureStart = null;
this._gesturePlayed = !1;
this._gestureMoved = !1;
this._lastTapTile = null;
this._lastTapTime = 0;
for (var e = 0; e < this._myMJArr.length; ++e) {
var t = this._myMJArr[e].node;
if (cc.isValid(t)) {
var i = t.getComponent(cc.Button);
i && (i.clickEvents = []);
t.on(cc.Node.EventType.TOUCH_START, function(e) {
this._onHandTouchStart(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
this._onHandTouchMove(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_END, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_CANCEL, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
}
}
},
_onHandTouchStart: function(e, t) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect) {
this._handleChiSelect(t);
e.stopPropagation();
} else if (this._csPanel && this._csPanel.active) {
this.onMJClicked({
node: t,
currentTarget: t
});
e.stopPropagation();
} else {
var i = e.getLocation();
this._gestureStart = {
x: i.x,
y: i.y,
t: Date.now(),
node: t
};
this._gesturePlayed = !1;
this._gestureMoved = !1;
for (var n = 0; n < this._gestureSel.length; ++n) cc.isValid(this._gestureSel[n]) && (this._gestureSel[n].y = 0);
this._gestureSel = [];
}
},
_onHandTouchMove: function(e) {
if (this._gestureStart && !this._gesturePlayed) {
var t = this._getGestureSettings(), i = e.getLocation(), n = i.x - this._gestureStart.x, a = i.y - this._gestureStart.y;
if (t.swipeUp && a < -30) {
this._playTile(this._gestureStart.node);
this._gesturePlayed = !0;
e.stopPropagation();
} else if (t.multiSelect && Math.abs(n) > 8) {
this._gestureMoved = !0;
var s = this._findTileAtPos(i);
if (s && -1 == this._gestureSel.indexOf(s)) {
this._gestureSel.push(s);
this._setTileY(s, 15);
}
}
}
},
_onHandTouchEnd: function(e) {
if (this._gestureStart) {
var t = this._gestureStart;
this._gestureStart = null;
if (!this._gesturePlayed) if (this._gestureMoved && this._gestureSel.length > 0) e.stopPropagation(); else {
var i = this._getGestureSettings(), n = Date.now(), a = this._lastTapTile, s = a == t.node && n - this._lastTapTime < 300;
this._lastTapTile = t.node;
this._lastTapTime = n;
if ("double" === i.playMode) if (s) this._playTile(t.node); else {
a && a != t.node && cc.isValid(a) && this._setTileY(a, 0);
this._setTileY(t.node, 15);
} else this._playTile(t.node);
e.stopPropagation();
}
}
},
_playTile: function(e) {
if (cc.isValid(e) && null != e.mjId && cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
this.shoot(e.mjId);
e.y = 0;
this._selectedMJ = null;
for (var t = 0; t < this._gestureSel.length; ++t) cc.isValid(this._gestureSel[t]) && (this._gestureSel[t].y = 0);
this._gestureSel = [];
}
},
_findTileAtPos: function(e) {
for (var t = 0; t < this._myMJArr.length; ++t) {
var i = this._myMJArr[t].node;
if (cc.isValid(i) && i.active && i.getBoundingBoxToWorld().contains(e)) return i;
}
return null;
},
_handleChiSelect: function(e) {
if (null != this._chiSelect && cc.isValid(e)) if (null != e.mjId) {
var t = this._chiSelect.tiles, i = t.indexOf(e);
if (-1 == i) {
if (!(t.length >= 2)) {
t.push(e);
this._setTileY(e, 15);
if (2 == t.length) {
var n = t[0].mjId, a = t[1].mjId, s = this._chiSelect.pai;
t[0].y = 0;
t[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
console.log("[chi] send", n, a, s);
this._chiJustSent = !0;
var o = this;
this.scheduleOnce(function() {
if (o._chiJustSent) {
o._chiJustSent = !1;
o._toast("吃牌超时,下次手快一点");
}
}, 2);
cc.vv.net.send("chi", [ n, a, s ]);
}
}
} else {
t.splice(i, 1);
this._setTileY(e, 0);
}
} else console.log("[chi] 该手牌不可选:", e.name);
},
_setTileY: function(e, t) {
if (e && cc.isValid(e)) {
cc.Tween.stopAllByTarget(e);
cc.tween(e).to(.08, {
y: t
}, {
easing: "quadOut"
}).start();
}
},
onMJClicked: function(e) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect) this._handleChiSelect(this._findMJNode(e)); else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var t = this._findMJNode(e);
if (null != t) for (var i = 0; i < this._myMJArr.length; ++i) if (t == this._myMJArr[i].node) {
if (t == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._setTileY(this._selectedMJ, 0);
this._selectedMJ = null;
return;
}
null != this._selectedMJ && this._setTileY(this._selectedMJ, 0);
this._setTileY(t, 15);
this._selectedMJ = t;
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
var n = cc.vv.gameNetMgr.getLocalIndex(e), a = cc.vv.mahjongmgr.getSide(n), s = cc.vv.mahjongmgr.getFoldPre(n), o = this.node.getChildByName("game").getChildByName(a).getChildByName("holds"), r = this.getMJIndex(a, 13), c = o.children[r];
if (null != c) {
c.scaleX = 1;
c.scaleY = 1;
if (null == t) c.active = !1; else if (t >= 0) {
c.active = !0;
if ("up" == a) {
c.scaleX = .73;
c.scaleY = .73;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(s, t);
if (0 == n) {
var l = cc.vv.gameNetMgr.conf || {}, h = l.caishen >= 0 && t == l.caishen || null != l.caishen2 && l.caishen2 >= 0 && t == l.caishen2;
i(c, h);
var d = c.getChildByName("csCorner");
d && (d.active = h);
}
} else if (null != t) {
c.active = !0;
if ("up" == a) {
c.scaleX = 1;
c.scaleY = 1;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(a);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), s = 0; s < n.childrenCount; ++s) {
var o = n.children[s];
o.scaleX = 1;
o.scaleY = 1;
o.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, s = a ? a.getChildByName("holds") : null;
if (null != s) {
var o = e.chis || [], r = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + o.length;
r *= 3;
for (var c = 0; c < r; ++c) {
var l = this.getMJIndex(i, c);
null != s.children[l] && (s.children[l].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (c = 0; c < d.length; ++c) {
l = this.getMJIndex(i, c + r);
if (null != s.children[l]) {
var u = s.children[l].getComponent(cc.Sprite);
if (null != u) {
if ("up" == i) {
u.node.scaleX = .73;
u.node.scaleY = .73;
}
u.node.active = !0;
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[c]);
}
}
}
this._hideUnusedHolds(i, s, r + d.length);
} else {
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (c = r; c < r + g; ++c) {
l = this.getMJIndex(i, c);
var v = s.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, s, r + g);
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
for (var s = cc.vv.gameNetMgr.conf, o = s ? s.caishen : -1, r = s ? s.caishen2 : -1, c = [], l = [], h = 0; h < i.length; ++h) {
var d = i[h];
o >= 0 && d == o || null != r && r >= 0 && d == r ? c.push(d) : l.push(d);
}
cc.vv.mahjongmgr.sortMJ(l);
i.length = 0;
for (var u = 0; u < c.length; ++u) i.push(c[u]);
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
var a, s = i.chis || [], o = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + s.length), r = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (r = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (r = 0);
a = r > 0 ? .5 * r : 20;
var c = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), l = this._myMJArr[o], h = l ? l.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", o, "holds.length=", n.length, "startSlot=", o, "endSlot=", o + n.length - 1);
for (var d = [], u = 0; u < n.length; ++u) {
var g = n[u];
if (null == (_ = this._myMJArr[u + o]) || null == _.node) {
d.push("SLOT_" + (u + o) + "=NULL");
break;
}
_.node.mjId = g;
_.node.y = 0;
var v = c && u == n.length - 1;
r > 0 && (_.node.x = h + u * r + (v ? a : 0));
this.setSpriteFrameByMJID("M_", _, g);
d.push("SLOT_" + (u + o) + "=" + g);
}
console.log("[initMahjongs] render:", d.join("|"));
for (u = 0; u < o; ++u) if (null != (_ = this._myMJArr[u]) && null != _.node) {
_.node.mjId = null;
_.spriteFrame = null;
_.node.active = !1;
}
for (u = o + n.length; u < this._myMJArr.length; ++u) {
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
setSpriteFrameByMJID: function(e, t, n) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, n);
t.node.active = !0;
var a = cc.vv.gameNetMgr.conf || {}, s = null != n && n >= 0 && (a.caishen >= 0 && n == a.caishen || null != a.caishen2 && a.caishen2 >= 0 && n == a.caishen2);
i(t.node, s);
var o = t.node.getChildByName("csCorner");
o && (o.active = s);
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
for (var i = [], n = 36, a = 0; a < e.length; ++a) {
a > 0 && (n += 30);
var s = 46 * e[a].pais.length + 4 * (e[a].pais.length - 1);
i.push(s);
n += s;
}
var o = new cc.Node("chiPanel");
o.setContentSize(n, 120);
o.setPosition(0, -140);
t.addChild(o);
var r = new cc.Node("bg");
r.setContentSize(n, 120);
o.addChild(r);
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(18, 18, 24, 235);
c.strokeColor = cc.color(255, 200, 90, 255);
c.lineWidth = 3;
c.rect(-n / 2, -60, n, 120);
c.fill();
c.stroke();
var l = new cc.Node("cap");
l.setContentSize(n, 26);
l.setPosition(0, 37);
o.addChild(l);
var h = l.addComponent(cc.Label);
h.string = "点击组合完成操作";
h.fontSize = 22;
h.lineHeight = 26;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
l.color = cc.color(255, 225, 150);
for (var d = 18, u = 0; u < e.length; ++u) {
var g = e[u], v = g.pais, _ = i[u], f = new cc.Node("cpgItem" + u);
f.setContentSize(_, 66);
f.setPosition(-n / 2 + d + _ / 2, -13);
d += _ + 30;
o.addChild(f);
f.addComponent(cc.Button);
f.actType = g.type;
f.paiList = v;
f.targetPai = g.pai;
cc.vv.utils.addClickEvent(f, this.node, "MJGameZJLAO", "onChiItemClicked");
for (var m = 0; m < v.length; ++m) {
var p = new cc.Node("p" + m);
p.setContentSize(46, 66);
p.setPosition(-_ / 2 + 23 + 50 * m, 0);
f.addChild(p);
var b = p.addComponent(cc.Sprite);
b.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", v[m]);
b.sizeMode = cc.Sprite.SizeMode.CUSTOM;
this._setOpCaishenCorner(p, v[m]);
}
}
this._chiPanel = o;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e && (e.node || e.currentTarget || e.target) || null;
if (null != t) {
if ("peng" == t.actType) cc.vv.net.send("peng"); else if ("gang" == t.actType) cc.vv.net.send("gang", t.targetPai); else if (t.paiList) {
for (var i = t.targetPai, n = [], a = cc.vv.gameNetMgr.getSelfData(), s = a && a.holds ? a.holds : [], o = cc.vv.gameNetMgr.conf || {}, r = o.caishen, c = o.caishen2, l = 0; l < t.paiList.length; ++l) {
var h = t.paiList[l];
h != i && (h != r && h != c && -1 != s.indexOf(h) ? n.push(h) : r >= 0 && -1 != s.indexOf(r) ? n.push(r) : null != c && c >= 0 && -1 != s.indexOf(c) && n.push(c));
}
n.push(i);
3 == n.length && cc.vv.net.send("chi", n);
}
this.hideChiPanel();
this.hideOptions();
}
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) {
var n = t.gangpai && t.gangpai.length ? t.gangpai : [ t.pai ];
if (n.length > 1) {
this._flashOpTiles(t);
return;
}
cc.vv.net.send("gang", n[0]);
} else if ("btnHu" == i) cc.vv.net.send("hu"); else if ("btnGuo" == i) {
for (var a = !(cc.vv.gameNetMgr.conf && 0 === cc.vv.gameNetMgr.conf.hu_guo_confirm), s = null, o = 0; o < this._options.childrenCount; ++o) {
var r = this._options.children[o];
if ("op" == r.name && r.active) {
var c = r.getChildByName("btnHu");
if (c && c.active) {
s = c;
break;
}
}
}
if (a && s && cc.vv.alert && cc.vv.alert.show) {
var l = this;
cc.vv.alert.show(null, "当前可以胡牌，确定要过吗？", function() {
cc.vv.net.send("guo");
l.hideOptions();
}, !0);
return;
}
cc.vv.net.send("guo");
this.hideOptions();
}
}
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
function i(e, t) {
var i = t ? cc.color(255, 208, 90) : cc.Color.WHITE;
e.color = i;
var n = e.getComponent(cc.Button);
if (n && n.transition === cc.Button.Transition.COLOR) {
n._mjOrigCol || (n._mjOrigCol = {
n: n.normalColor,
h: n.hoverColor,
p: n.pressedColor,
d: n.disabledColor
});
var a = n._mjOrigCol;
if (t) {
n.normalColor = i;
n.hoverColor = i;
n.pressedColor = cc.color(235, 185, 75);
} else {
n.normalColor = a.n;
n.hoverColor = a.h;
n.pressedColor = a.p;
n.disabledColor = a.d;
}
}
}
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
for (var n = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow", "DeskStyle", "Alert" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
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
for (var a = e.getChildByName("myself").getChildByName("holds"), s = 0; s < a.children.length; ++s) {
var o = a.children[s].getComponent(cc.Sprite);
this._myMJArr.push(o);
o.spriteFrame = null;
}
this._setupHandGestures();
var r = cc.view.getVisibleSize().width / 1280;
if (r < 1) {
a.scaleX *= r;
a.scaleY *= r;
}
var c = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (s = 0; s < c; ++s) {
var l = cc.vv.mahjongmgr.getSide(s), h = e.getChildByName(l);
if (null != h) {
this._hupaiTips.push(h.getChildByName("HuPai"));
this._hupaiLists.push(h.getChildByName("hupailist"));
this._playEfxs.push(h.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(h.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var d = h.getChildByName("opt");
d.active = !1;
o = d.getChildByName("pai").getComponent(cc.Sprite);
var u = {
node: d,
sprite: o
};
this._opts.push(u);
}
}
var g = e.getChildByName("ops");
this._options = g;
if (g) for (var v = 0; v < g.childrenCount; ++v) {
var _ = g.children[v];
if ("op" == _.name) {
var f = _.getComponent(cc.Sprite);
f && (f.enabled = !1);
var m = _.getChildByName("opTarget");
m && (m.active = !1);
}
}
if (g) for (var p = 0; p < g.childrenCount; ++p) {
var b = g.children[p];
if ("op" == b.name) {
var C = b.getChildByName("btnChi");
if (C) {
var y = C.getComponent(cc.Button);
y && 0 == y.clickEvents.length && cc.vv.utils.addClickEvent(C, this.node, "MJGameZJZX", "onOptionClicked");
}
}
}
var S = g ? g.getChildByName("New Layout") : null;
if (S) {
var N = S.getComponent(cc.Button);
N && (N.enabled = !1);
S.active = !1;
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
var a = this.node, s = this;
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
s._pendingPlans = e.waitCaishenPlans;
e.waitCaishenPlans = null;
s.showCaishenPlanPanel();
}
}
}, 0);
}
}
(s = this)._pendingPlans = null;
this.node.on("game_start", function(e) {
s.onGameBeign(!0, e && e.detail);
s.initCaishenTip();
cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex && s._startCountdown();
});
this.node.on("game_begin", function() {
s.onGameBeign();
});
this.node.on("bao_result", function() {
s.initCaishenTip();
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
s._stopCountdown();
s.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && s.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || s.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
if (0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex)) {
s._startCountdown();
s.initMahjongs(!0);
} else cc.vv.replayMgr.isReplay() && s.initMopai(e.seatIndex, t);
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
this.node.on("game_caishen_plans", function(e) {
if ((e = e.detail) && e.plans && 0 !== e.plans.length) {
s._pendingPlans = e.plans;
s.showCaishenPlanPanel();
}
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
s.hideYoujinPanel();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
s.initHuaArea(t.si);
s._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
}
});
this.node.on("game_youjin", function(e) {
var t = e.detail;
t && s.showYoujinLevel(t.si, t.level);
});
this.node.on("game_fenbing", function(e) {
var t = e.detail;
if (t) {
var i = cc.vv.gameNetMgr.seats[t.si], n = i ? i.name : "" + t.si;
cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(n + " 分饼 " + t.score + " 分");
}
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
s.playEfx(i, "play_chi");
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
var a = n.getChildByName("opTarget");
a && (a.active = !1);
var s = n.getChildByName(e);
s.active = !0;
s.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
var n = i.getChildByName("opTarget");
n && (n.active = !1);
var a = this.getChiButton(i);
if (a) {
a.active = !0;
a.pai = e;
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
var s = t.getChildByName("btnLabel");
s && (s.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var s = a.addComponent(cc.Label);
s.string = "吃";
s.fontSize = 40;
s.lineHeight = 40;
s.overflow = cc.Label.Overflow.NONE;
s.enableWrapText = !1;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
a.color = cc.color(255, 255, 255);
a.setPosition(0, 0);
cc.vv.utils.addClickEvent(t, this.node, "MJGameZJZX", "onOptionClicked");
t.active = !1;
return t;
},
getZpOpButton: function(e, t, i, n) {
var a = e.getChildByName(t);
if (a) return a;
var s = e.getChildByName("btnPeng");
a = new cc.Node(t);
e.addChild(a);
if (s) {
a.setPosition(s.getPosition());
a.setContentSize(s.getContentSize());
a.scaleX = s.scaleX;
a.scaleY = s.scaleY;
}
var o = a.addComponent(cc.Sprite);
o.type = cc.Sprite.Type.SIMPLE;
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/atlas/other_a/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(a)) {
var i = a.getComponent(cc.Sprite);
i && (i.spriteFrame = t);
}
});
a.addComponent(cc.Button);
var r = new cc.Node("btnLabel");
a.addChild(r);
var c = r.addComponent(cc.Label);
c.string = i;
c.fontSize = n || 40;
c.lineHeight = c.fontSize;
c.overflow = cc.Label.Overflow.NONE;
c.enableWrapText = !1;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
r.color = cc.color(255, 255, 255);
r.setPosition(0, 0);
cc.vv.utils.addClickEvent(a, this.node, "MJGameZJZX", "onOptionClicked");
a.active = !1;
return a;
},
addZpOption: function(e, t, i, n) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var s = this._options.children[a];
if ("op" == s.name && 0 == s.active) {
s.active = !0;
s.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = null != i && i >= 0 ? cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", i) : null;
var o = this.getZpOpButton(s, e, t, n);
o.active = !0;
o.pai = i;
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
var s = t.getChildByName("btnYouJinGo");
s && (s.active = !1);
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
var s = this._options.getChildByName("btnGuo");
s && (s.active = !0);
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
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game") || this.node, a = new cc.Node("huaArea_" + i), s = this._huaAreaPos(i);
a.setPosition(s.x, s.y);
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
if (0 != n.length) for (var a = cc.vv.mahjongmgr.bottomAtlas, s = 0; s < n.length; ++s) {
var o = n[s], r = new cc.Node("hua" + s);
r.setContentSize(44, 64);
r.setPosition(48 * s + 22, 0);
i.addChild(r);
var c = r.addComponent(cc.Sprite);
c.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var l = o - 34, h = l >= 0 && l < 8 ? "M_" + [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][l] : null, d = h ? a.getSpriteFrame(h) : null;
if (null != d) c.spriteFrame = d; else {
var u = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
c.spriteFrame = u;
var g = new cc.Node("name");
r.addChild(g);
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
var a = cc.vv.mahjongmgr.getSide(i), s = this.getHuaArea(e);
n = new cc.Node("youjin_" + a);
s.parent.addChild(n);
var o = n.addComponent(cc.Label);
o.fontSize = 30;
o.lineHeight = 34;
o.overflow = cc.Label.Overflow.NONE;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
n.color = cc.color(255, 90, 90);
var r = n.addComponent(cc.LabelOutline);
r.color = cc.color(80, 0, 0);
r.width = 2;
this._youjinLabels[i] = n;
}
var c = this.getHuaArea(e);
n.setPosition(c.x, c.y + 80);
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
var s = a.addComponent(cc.Graphics);
s.fillColor = cc.color(18, 18, 24, 235);
s.strokeColor = cc.color(255, 200, 90, 255);
s.lineWidth = 3;
s.rect(-i / 2, -73, i, 146);
s.fill();
s.stroke();
var o = new cc.Node("cap");
o.setContentSize(i, 28);
o.setPosition(0, 49);
n.addChild(o);
var r = o.addComponent(cc.Label);
r.string = "选择一张牌宣告游金";
r.fontSize = 22;
r.lineHeight = 28;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.verticalAlign = cc.Label.VerticalAlign.CENTER;
o.color = cc.color(255, 225, 150);
for (var c = 0; c < e.length; ++c) {
var l = new cc.Node("yjItem" + c);
l.setContentSize(62, 90);
l.setPosition(51 + -i / 2 + 78 * c, -14);
n.addChild(l);
l.addComponent(cc.Button);
l.pai = e[c];
cc.vv.utils.addClickEvent(l, this.node, "MJGameZJZX", "onYoujinItemClicked");
var h = l.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[c]);
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
if (cc.vv && cc.vv.mahjongmgr) {
var n = null;
"play_hu" == t ? n = "mj_hu" : "play_zimo" == t ? n = "mj_zimo" : "play_chi" == t ? n = "mj_chi" : "play_peng" == t ? n = "mj_peng" : "play_guafeng" != t && "play_xiayu" != t && "play_gang" != t || (n = "mj_gang");
n && cc.vv.mahjongmgr.playSpineEfx(i.node, n);
}
},
onGameBeign: function(e) {
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), s = this._hupaiTips[a];
s.active = n.hued;
if (n.hued) {
s.getChildByName("sprHu").active = !n.iszimo;
s.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var o = this.node.getChildByName("game"), r = o.getChildByName("huanpaiinfo");
null != r && (r.active = !1);
var c = [ "right", "up", "left" ];
for (t = 0; t < c.length; ++t) {
var l = o.getChildByName(c[t]);
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
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, s) {
if (null != a && 0 != n.length) {
var o = a.convertToNodeSpaceAR(e);
n.sort(s);
for (var r = 0; r < n.length; ++r) {
var c = n[r], l = c.x, h = c.y, d = c.opacity;
t.push({
node: c,
x: l,
y: h,
op: d
});
c.setPosition(o);
c.opacity = 0;
c.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(l, h)), cc.fadeTo(.15, d))));
var u = .06 * r + .15;
u > i && (i = u);
}
}
}, a = [], s = null, o = 0; o < this._myMJArr.length; ++o) {
var r = this._myMJArr[o];
if (r && r.node && r.node.active && null != r.node.mjId) {
a.push(r.node);
s = r.node.parent;
}
}
n(a, s, function(e, t) {
return e.x - t.x;
});
for (var c = this.node.getChildByName("game"), l = cc.vv.gameNetMgr.seats || [], h = 0; h < l.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var u = cc.vv.mahjongmgr.getSide(d), g = c ? c.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var _ = [], f = 0; f < v.childrenCount; ++f) {
var m = v.children[f];
m.active && _.push(m);
}
n(_, v, "up" == u ? function(e, t) {
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
btnChi: 1,
btnQiangJin: 1,
btnYouJin: 1,
btnYouJinGo: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
_getGestureSettings: function() {
var e = cc.vv.deskStyle;
if (e && e.getGestureSettings) return e.getGestureSettings();
try {
return {
multiSelect: !!JSON.parse(cc.sys.localStorage.getItem("gesture_multi_select") || "false"),
swipeUp: !!JSON.parse(cc.sys.localStorage.getItem("mj_gesture_swipe_up") || "false"),
playMode: JSON.parse(cc.sys.localStorage.getItem("mj_play_mode") || '"single"')
};
} catch (e) {
return {
multiSelect: !1,
swipeUp: !1,
playMode: "single"
};
}
},
_setupHandGestures: function() {
this._gestureSel = [];
this._gestureStart = null;
this._gesturePlayed = !1;
this._gestureMoved = !1;
this._lastTapTile = null;
this._lastTapTime = 0;
for (var e = 0; e < this._myMJArr.length; ++e) {
var t = this._myMJArr[e].node;
if (cc.isValid(t)) {
var i = t.getComponent(cc.Button);
i && (i.clickEvents = []);
t.on(cc.Node.EventType.TOUCH_START, function(e) {
this._onHandTouchStart(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
this._onHandTouchMove(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_END, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_CANCEL, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
}
}
},
_onHandTouchStart: function(e, t) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect || this._csPanel && this._csPanel.active) {
this.onMJClicked({
node: t,
currentTarget: t
});
e.stopPropagation();
} else {
var i = e.getLocation();
this._gestureStart = {
x: i.x,
y: i.y,
t: Date.now(),
node: t
};
this._gesturePlayed = !1;
this._gestureMoved = !1;
for (var n = 0; n < this._gestureSel.length; ++n) cc.isValid(this._gestureSel[n]) && (this._gestureSel[n].y = 0);
this._gestureSel = [];
}
},
_onHandTouchMove: function(e) {
if (this._gestureStart && !this._gesturePlayed) {
var t = this._getGestureSettings(), i = e.getLocation(), n = i.x - this._gestureStart.x, a = i.y - this._gestureStart.y;
if (t.swipeUp && a < -30) {
this._playTile(this._gestureStart.node);
this._gesturePlayed = !0;
e.stopPropagation();
} else if (t.multiSelect && Math.abs(n) > 8) {
this._gestureMoved = !0;
var s = this._findTileAtPos(i);
if (s && -1 == this._gestureSel.indexOf(s)) {
this._gestureSel.push(s);
this._setTileY(s, 15);
}
}
}
},
_onHandTouchEnd: function(e) {
if (this._gestureStart) {
var t = this._gestureStart;
this._gestureStart = null;
if (!this._gesturePlayed) if (this._gestureMoved && this._gestureSel.length > 0) e.stopPropagation(); else {
var i = this._getGestureSettings(), n = Date.now(), a = this._lastTapTile, s = a == t.node && n - this._lastTapTime < 300;
this._lastTapTile = t.node;
this._lastTapTime = n;
if ("double" === i.playMode) if (s) this._playTile(t.node); else {
a && a != t.node && cc.isValid(a) && this._setTileY(a, 0);
this._setTileY(t.node, 15);
} else this._playTile(t.node);
e.stopPropagation();
}
}
},
_playTile: function(e) {
if (cc.isValid(e) && null != e.mjId && cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
this.shoot(e.mjId);
e.y = 0;
this._selectedMJ = null;
for (var t = 0; t < this._gestureSel.length; ++t) cc.isValid(this._gestureSel[t]) && (this._gestureSel[t].y = 0);
this._gestureSel = [];
}
},
_findTileAtPos: function(e) {
for (var t = 0; t < this._myMJArr.length; ++t) {
var i = this._myMJArr[t].node;
if (cc.isValid(i) && i.active && i.getBoundingBoxToWorld().contains(e)) return i;
}
return null;
},
_handleChiSelect: function(e) {
if (null != e && null != e.mjId) for (var t = 0; t < this._myMJArr.length; ++t) if (e == this._myMJArr[t].node) {
var i = this._chiSelect.tiles, n = i.indexOf(e);
if (-1 != n) {
i.splice(n, 1);
this._setTileY(e, 0);
return;
}
if (i.length >= 2) return;
i.push(e);
this._setTileY(e, 15);
if (2 == i.length) {
var a = i[0].mjId, s = i[1].mjId, o = this._chiSelect.pai;
i[0].y = 0;
i[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ a, s, o ]);
}
return;
}
},
_setTileY: function(e, t) {
if (e && cc.isValid(e)) {
cc.Tween.stopAllByTarget(e);
cc.tween(e).to(.08, {
y: t
}, {
easing: "quadOut"
}).start();
}
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
this._setTileY(t, 0);
return;
}
if (n.length >= 2) return;
n.push(t);
this._setTileY(t, 15);
if (2 == n.length) {
var s = n[0].mjId, o = n[1].mjId, r = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ s, o, r ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var c = this._findMJNode(e);
if (null != c) for (var l = 0; l < this._myMJArr.length; ++l) if (c == this._myMJArr[l].node) {
if (c == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._setTileY(this._selectedMJ, 0);
this._selectedMJ = null;
return;
}
null != this._selectedMJ && this._setTileY(this._selectedMJ, 0);
this._setTileY(c, 15);
this._selectedMJ = c;
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
var n = cc.vv.gameNetMgr.getLocalIndex(e), a = cc.vv.mahjongmgr.getSide(n), s = cc.vv.mahjongmgr.getFoldPre(n), o = this.node.getChildByName("game").getChildByName(a).getChildByName("holds"), r = this.getMJIndex(a, 13), c = o.children[r];
if (null != c) {
c.scaleX = 1;
c.scaleY = 1;
if (null == t) c.active = !1; else if (t >= 0) {
c.active = !0;
if ("up" == a) {
c.scaleX = .73;
c.scaleY = .73;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(s, t);
if (0 == n) {
var l = cc.vv.gameNetMgr.conf || {};
i(c, l.caishen >= 0 && t == l.caishen || null != l.caishen2 && l.caishen2 >= 0 && t == l.caishen2);
}
} else if (null != t) {
c.active = !0;
if ("up" == a) {
c.scaleX = 1;
c.scaleY = 1;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(a);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), s = 0; s < n.childrenCount; ++s) {
var o = n.children[s];
o.scaleX = 1;
o.scaleY = 1;
o.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, s = a ? a.getChildByName("holds") : null;
if (null != s) {
var o = e.chis || [], r = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + o.length;
r *= 3;
for (var c = 0; c < r; ++c) {
var l = this.getMJIndex(i, c);
null != s.children[l] && (s.children[l].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (c = 0; c < d.length; ++c) {
l = this.getMJIndex(i, c + r);
if (null != s.children[l]) {
var u = s.children[l].getComponent(cc.Sprite);
if (null != u) {
if ("up" == i) {
u.node.scaleX = .73;
u.node.scaleY = .73;
}
u.node.active = !0;
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[c]);
}
}
}
this._hideUnusedHolds(i, s, r + d.length);
} else {
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (c = r; c < r + g; ++c) {
l = this.getMJIndex(i, c);
var v = s.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, s, r + g);
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
for (var s = cc.vv.gameNetMgr.conf, o = s ? s.caishen : -1, r = s ? s.caishen2 : -1, c = [], l = [], h = 0; h < i.length; ++h) {
var d = i[h];
o >= 0 && d == o || null != r && r >= 0 && d == r ? c.push(d) : l.push(d);
}
cc.vv.mahjongmgr.sortMJ(l);
i.length = 0;
for (var u = 0; u < c.length; ++u) i.push(c[u]);
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
var a, s = i.chis || [], o = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + s.length), r = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (r = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (r = 0);
a = r > 0 ? .5 * r : 20;
var c = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), l = this._myMJArr[o], h = l ? l.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", o, "holds.length=", n.length, "startSlot=", o, "endSlot=", o + n.length - 1);
for (var d = cc.vv.gameNetMgr.conf, u = d ? d.caishen : -1, g = d ? d.caishen2 : -1, v = [], _ = 0; _ < n.length; ++_) {
var f = n[_];
if (null == (b = this._myMJArr[_ + o]) || null == b.node) {
v.push("SLOT_" + (_ + o) + "=NULL");
break;
}
b.node.mjId = f;
b.node.y = 0;
var m = c && _ == n.length - 1;
r > 0 && (b.node.x = h + _ * r + (m ? a : 0));
this.setSpriteFrameByMJID("M_", b, f);
var p = u >= 0 && f == u || null != g && g >= 0 && f == g;
b.node.color = p ? cc.color(255, 200, 90) : cc.Color.WHITE;
v.push("SLOT_" + (_ + o) + "=" + f);
}
console.log("[initMahjongs] render:", v.join("|"));
for (_ = 0; _ < o; ++_) if (null != (b = this._myMJArr[_]) && null != b.node) {
b.node.mjId = null;
b.spriteFrame = null;
b.node.active = !1;
}
for (_ = o + n.length; _ < this._myMJArr.length; ++_) {
var b;
if (null != (b = this._myMJArr[_]) && null != b.node) {
b.node.mjId = null;
b.spriteFrame = null;
b.node.active = !1;
}
}
}
} else console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", i ? i.holds : i);
},
setSpriteFrameByMJID: function(e, t, n) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, n);
t.node.active = !0;
var a = cc.vv.gameNetMgr.conf || {}, s = null != n && n >= 0 && (a.caishen >= 0 && n == a.caishen || null != a.caishen2 && a.caishen2 >= 0 && n == a.caishen2);
i(t.node, s);
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
for (var i = [], n = 36, a = 0; a < e.length; ++a) {
a > 0 && (n += 30);
var s = 46 * e[a].pais.length + 4 * (e[a].pais.length - 1);
i.push(s);
n += s;
}
var o = new cc.Node("chiPanel");
o.setContentSize(n, 120);
o.setPosition(0, -140);
t.addChild(o);
var r = new cc.Node("bg");
r.setContentSize(n, 120);
o.addChild(r);
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(18, 18, 24, 235);
c.strokeColor = cc.color(255, 200, 90, 255);
c.lineWidth = 3;
c.rect(-n / 2, -60, n, 120);
c.fill();
c.stroke();
var l = new cc.Node("cap");
l.setContentSize(n, 26);
l.setPosition(0, 37);
o.addChild(l);
var h = l.addComponent(cc.Label);
h.string = "点击组合完成操作";
h.fontSize = 22;
h.lineHeight = 26;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
l.color = cc.color(255, 225, 150);
for (var d = 18, u = 0; u < e.length; ++u) {
var g = e[u], v = g.pais, _ = i[u], f = new cc.Node("cpgItem" + u);
f.setContentSize(_, 66);
f.setPosition(-n / 2 + d + _ / 2, -13);
d += _ + 30;
o.addChild(f);
f.addComponent(cc.Button);
f.actType = g.type;
f.paiList = v;
f.targetPai = g.pai;
cc.vv.utils.addClickEvent(f, this.node, "MJGameZJZX", "onChiItemClicked");
for (var m = 0; m < v.length; ++m) {
var p = new cc.Node("p" + m);
p.setContentSize(46, 66);
p.setPosition(-_ / 2 + 23 + 50 * m, 0);
f.addChild(p);
var b = p.addComponent(cc.Sprite);
b.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", v[m]);
b.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = o;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e && (e.node || e.currentTarget || e.target) || null;
if (null != t) {
if ("peng" == t.actType) cc.vv.net.send("peng"); else if ("gang" == t.actType) cc.vv.net.send("gang", t.targetPai); else if (t.paiList) {
for (var i = t.targetPai, n = [], a = cc.vv.gameNetMgr.getSelfData(), s = a && a.holds ? a.holds : [], o = cc.vv.gameNetMgr.conf || {}, r = o.caishen, c = o.caishen2, l = 0; l < t.paiList.length; ++l) {
var h = t.paiList[l];
h != i && (h != r && h != c && -1 != s.indexOf(h) ? n.push(h) : r >= 0 && -1 != s.indexOf(r) ? n.push(r) : null != c && c >= 0 && -1 != s.indexOf(c) && n.push(c));
}
n.push(i);
3 == n.length && cc.vv.net.send("chi", n);
}
this.hideChiPanel();
this.hideOptions();
}
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
var s = this._options.getChildByName("btnHu");
if (s && s.active && cc.vv.alert && cc.vv.alert.show) {
var o = this;
cc.vv.alert.show(null, "当前可以胡牌，确定要过吗？", function() {
cc.vv.net.send("guo");
o.hideOptions();
}, !0);
return;
}
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
var s = this._caishenPlanPanel;
console.log("[ZJZX] panel found, active=", s.active);
var o = [ "btnWuCai", "btnDanCai", "btnShuangCai", "btnReselect" ];
for (n = 0; n < o.length; ++n) {
var r = s.getChildByName(o[n]);
r && (r.active = !1);
}
var c = s.getChildByName("btnSetCaishen");
c && (c.active = !0);
s.active = !0;
var l = s.parent;
l && s.setSiblingIndex(l.childrenCount - 1);
var h = this._pendingPlans || [];
if (0 !== h.length) {
var d = h[0], u = s.getChildByName("taiLabel");
if (u) {
u.active = !0;
u.getComponent(cc.Label).string = "胡" + d.tai + "台";
}
var g = s.getChildByName("modeLabel");
if (g) {
g.active = !0;
g.getComponent(cc.Label).string = 0 === d.mode ? "无财" : 1 === d.mode ? "独财" : "双财";
}
var v = function(e, t) {
var i = s.getChildByName(e);
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
function i(e, t) {
var i = t ? cc.color(255, 208, 90) : cc.Color.WHITE;
e.color = i;
var n = e.getComponent(cc.Button);
if (n && n.transition === cc.Button.Transition.COLOR) {
n._mjOrigCol || (n._mjOrigCol = {
n: n.normalColor,
h: n.hoverColor,
p: n.pressedColor,
d: n.disabledColor
});
var a = n._mjOrigCol;
if (t) {
n.normalColor = i;
n.hoverColor = i;
n.pressedColor = cc.color(235, 185, 75);
} else {
n.normalColor = a.n;
n.hoverColor = a.h;
n.pressedColor = a.p;
n.disabledColor = a.d;
}
}
}
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
for (var n = [ "NoticeTip", "GameOverZP", "PengGangs", "MJRoom", "TimePointer", "GameResultZP", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow", "DeskStyle", "Alert" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
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
var s = n.children[a].getComponent(cc.Sprite);
this._myMJArr.push(s);
s.spriteFrame = null;
}
this._setupHandGestures();
var o = cc.view.getVisibleSize().width / 1280;
if (o < 1) {
n.scaleX *= o;
n.scaleY *= o;
}
var r = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < r; ++a) {
var c = cc.vv.mahjongmgr.getSide(a), l = e.getChildByName(c);
if (null != l) {
this._hupaiTips.push(l.getChildByName("HuPai"));
this._hupaiLists.push(l.getChildByName("hupailist"));
this._playEfxs.push(l.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(l.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var h = l.getChildByName("opt");
h.active = !1;
s = h.getChildByName("pai").getComponent(cc.Sprite);
var d = {
node: h,
sprite: s
};
this._opts.push(d);
}
}
var u = e.getChildByName("ops");
this._options = u;
if (u) for (var g = 0; g < u.childrenCount; ++g) {
var v = u.children[g];
if ("op" == v.name) {
var _ = v.getComponent(cc.Sprite);
_ && (_.enabled = !1);
var f = v.getChildByName("opTarget");
f && (f.active = !1);
}
}
var m = u ? u.getChildByName("New Layout") : null;
if (m) {
var p = m.getComponent(cc.Button);
p && (p.enabled = !1);
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
var s = this;
this.node.on("game_start", function(e) {
s.onGameBeign(!0, e && e.detail);
s.initCaishenTip();
});
this.node.on("game_begin", function() {
s.onGameBeign();
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
s.hideYoujinPanel();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
s.initHuaArea(t.si);
s._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
}
});
this.node.on("game_youjin", function(e) {
var t = e.detail;
t && s.showYoujinLevel(t.si, t.level);
});
this.node.on("game_fenbing", function(e) {
var t = e.detail;
if (t) {
var i = cc.vv.gameNetMgr.seats[t.si], n = i ? i.name : "" + t.si;
cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(n + " 分饼 " + t.score + " 分");
}
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
s.playEfx(i, "play_chi");
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
var a = n.getChildByName("opTarget");
a && (a.active = !1);
var s = n.getChildByName(e);
s.active = !0;
s.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
var n = i.getChildByName("opTarget");
n && (n.active = !1);
var a = this.getChiButton(i);
if (a) {
a.active = !0;
a.pai = e;
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
var s = t.getChildByName("btnLabel");
s && (s.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var s = a.addComponent(cc.Label);
s.string = "吃";
s.fontSize = 40;
s.lineHeight = 40;
s.overflow = cc.Label.Overflow.NONE;
s.enableWrapText = !1;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
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
var s = e.getChildByName("btnPeng");
a = new cc.Node(t);
e.addChild(a);
if (s) {
a.setPosition(s.getPosition());
a.setContentSize(s.getContentSize());
a.scaleX = s.scaleX;
a.scaleY = s.scaleY;
}
var o = a.addComponent(cc.Sprite);
o.type = cc.Sprite.Type.SIMPLE;
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(a)) {
var i = a.getComponent(cc.Sprite);
i && (i.spriteFrame = t);
}
});
a.addComponent(cc.Button);
var r = new cc.Node("btnLabel");
a.addChild(r);
var c = r.addComponent(cc.Label);
c.string = i;
c.fontSize = n || 40;
c.lineHeight = c.fontSize;
c.overflow = cc.Label.Overflow.NONE;
c.enableWrapText = !1;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
r.color = cc.color(255, 255, 255);
r.setPosition(0, 0);
cc.vv.utils.addClickEvent(a, this.node, "MJGameZP4", "onOptionClicked");
a.active = !1;
return a;
},
addZpOption: function(e, t, i, n) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var s = this._options.children[a];
if ("op" == s.name && 0 == s.active) {
s.active = !0;
s.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = null != i && i >= 0 ? cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", i) : null;
var o = this.getZpOpButton(s, e, t, n);
o.active = !0;
o.pai = i;
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
var s = t.getChildByName("btnYouJinGo");
s && (s.active = !1);
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
}, s = t.getChildByName("cs1");
if (s) {
s.active = !0;
a(s, i.caishen);
}
var o = t.getChildByName("cs2");
if (o) {
var r = null != i.caishen2 && i.caishen2 >= 0;
o.active = r;
r && a(o, i.caishen2);
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
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game") || this.node, a = new cc.Node("huaArea_" + i), s = this._huaAreaPos(i);
a.setPosition(s.x, s.y);
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
if (0 != n.length) for (var a = cc.vv.mahjongmgr.bottomAtlas, s = 0; s < n.length; ++s) {
var o = n[s], r = new cc.Node("hua" + s);
r.setContentSize(44, 64);
r.setPosition(48 * s + 22, 0);
i.addChild(r);
var c = r.addComponent(cc.Sprite);
c.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var l = o - 34, h = l >= 0 && l < 8 ? "M_" + [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][l] : null, d = h ? a.getSpriteFrame(h) : null;
if (null != d) c.spriteFrame = d; else {
var u = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
c.spriteFrame = u;
var g = new cc.Node("name");
r.addChild(g);
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
var a = cc.vv.mahjongmgr.getSide(i), s = this.getHuaArea(e);
n = new cc.Node("youjin_" + a);
s.parent.addChild(n);
var o = n.addComponent(cc.Label);
o.fontSize = 30;
o.lineHeight = 34;
o.overflow = cc.Label.Overflow.NONE;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
n.color = cc.color(255, 90, 90);
var r = n.addComponent(cc.LabelOutline);
r.color = cc.color(80, 0, 0);
r.width = 2;
this._youjinLabels[i] = n;
}
var c = this.getHuaArea(e);
n.setPosition(c.x, c.y + 80);
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
var s = a.addComponent(cc.Graphics);
s.fillColor = cc.color(18, 18, 24, 235);
s.strokeColor = cc.color(255, 200, 90, 255);
s.lineWidth = 3;
s.rect(-i / 2, -73, i, 146);
s.fill();
s.stroke();
var o = new cc.Node("cap");
o.setContentSize(i, 28);
o.setPosition(0, 49);
n.addChild(o);
var r = o.addComponent(cc.Label);
r.string = "选择一张牌宣告游金";
r.fontSize = 22;
r.lineHeight = 28;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.verticalAlign = cc.Label.VerticalAlign.CENTER;
o.color = cc.color(255, 225, 150);
for (var c = 0; c < e.length; ++c) {
var l = new cc.Node("yjItem" + c);
l.setContentSize(62, 90);
l.setPosition(51 + -i / 2 + 78 * c, -14);
n.addChild(l);
l.addComponent(cc.Button);
l.pai = e[c];
cc.vv.utils.addClickEvent(l, this.node, "MJGameZP4", "onYoujinItemClicked");
var h = l.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[c]);
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
if (cc.vv && cc.vv.mahjongmgr) {
var n = null;
"play_hu" == t ? n = "mj_hu" : "play_zimo" == t ? n = "mj_zimo" : "play_chi" == t ? n = "mj_chi" : "play_peng" == t ? n = "mj_peng" : "play_guafeng" != t && "play_xiayu" != t && "play_gang" != t || (n = "mj_gang");
n && cc.vv.mahjongmgr.playSpineEfx(i.node, n);
}
},
onGameBeign: function(e) {
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), s = this._hupaiTips[a];
s.active = n.hued;
if (n.hued) {
s.getChildByName("sprHu").active = !n.iszimo;
s.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var o = this.node.getChildByName("game"), r = o.getChildByName("huanpaiinfo");
null != r && (r.active = !1);
var c = [ "right", "up", "left" ];
for (t = 0; t < c.length; ++t) {
var l = o.getChildByName(c[t]);
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
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, s) {
if (null != a && 0 != n.length) {
var o = a.convertToNodeSpaceAR(e);
n.sort(s);
for (var r = 0; r < n.length; ++r) {
var c = n[r], l = c.x, h = c.y, d = c.opacity;
t.push({
node: c,
x: l,
y: h,
op: d
});
c.setPosition(o);
c.opacity = 0;
c.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(l, h)), cc.fadeTo(.15, d))));
var u = .06 * r + .15;
u > i && (i = u);
}
}
}, a = [], s = null, o = 0; o < this._myMJArr.length; ++o) {
var r = this._myMJArr[o];
if (r && r.node && r.node.active && null != r.node.mjId) {
a.push(r.node);
s = r.node.parent;
}
}
n(a, s, function(e, t) {
return e.x - t.x;
});
for (var c = this.node.getChildByName("game"), l = cc.vv.gameNetMgr.seats || [], h = 0; h < l.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var u = cc.vv.mahjongmgr.getSide(d), g = c ? c.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var _ = [], f = 0; f < v.childrenCount; ++f) {
var m = v.children[f];
m.active && _.push(m);
}
n(_, v, "up" == u ? function(e, t) {
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
btnChi: 1,
btnQiangJin: 1,
btnYouJin: 1,
btnYouJinGo: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
_getGestureSettings: function() {
var e = cc.vv.deskStyle;
if (e && e.getGestureSettings) return e.getGestureSettings();
try {
return {
multiSelect: !!JSON.parse(cc.sys.localStorage.getItem("gesture_multi_select") || "false"),
swipeUp: !!JSON.parse(cc.sys.localStorage.getItem("mj_gesture_swipe_up") || "false"),
playMode: JSON.parse(cc.sys.localStorage.getItem("mj_play_mode") || '"single"')
};
} catch (e) {
return {
multiSelect: !1,
swipeUp: !1,
playMode: "single"
};
}
},
_setupHandGestures: function() {
this._gestureSel = [];
this._gestureStart = null;
this._gesturePlayed = !1;
this._gestureMoved = !1;
this._lastTapTile = null;
this._lastTapTime = 0;
for (var e = 0; e < this._myMJArr.length; ++e) {
var t = this._myMJArr[e].node;
if (cc.isValid(t)) {
var i = t.getComponent(cc.Button);
i && (i.clickEvents = []);
t.on(cc.Node.EventType.TOUCH_START, function(e) {
this._onHandTouchStart(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
this._onHandTouchMove(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_END, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_CANCEL, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
}
}
},
_onHandTouchStart: function(e, t) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect || this._csPanel && this._csPanel.active) {
this.onMJClicked({
node: t,
currentTarget: t
});
e.stopPropagation();
} else {
var i = e.getLocation();
this._gestureStart = {
x: i.x,
y: i.y,
t: Date.now(),
node: t
};
this._gesturePlayed = !1;
this._gestureMoved = !1;
for (var n = 0; n < this._gestureSel.length; ++n) cc.isValid(this._gestureSel[n]) && (this._gestureSel[n].y = 0);
this._gestureSel = [];
}
},
_onHandTouchMove: function(e) {
if (this._gestureStart && !this._gesturePlayed) {
var t = this._getGestureSettings(), i = e.getLocation(), n = i.x - this._gestureStart.x, a = i.y - this._gestureStart.y;
if (t.swipeUp && a < -30) {
this._playTile(this._gestureStart.node);
this._gesturePlayed = !0;
e.stopPropagation();
} else if (t.multiSelect && Math.abs(n) > 8) {
this._gestureMoved = !0;
var s = this._findTileAtPos(i);
if (s && -1 == this._gestureSel.indexOf(s)) {
this._gestureSel.push(s);
this._setTileY(s, 15);
}
}
}
},
_onHandTouchEnd: function(e) {
if (this._gestureStart) {
var t = this._gestureStart;
this._gestureStart = null;
if (!this._gesturePlayed) if (this._gestureMoved && this._gestureSel.length > 0) e.stopPropagation(); else {
var i = this._getGestureSettings(), n = Date.now(), a = this._lastTapTile, s = a == t.node && n - this._lastTapTime < 300;
this._lastTapTile = t.node;
this._lastTapTime = n;
if ("double" === i.playMode) if (s) this._playTile(t.node); else {
a && a != t.node && cc.isValid(a) && this._setTileY(a, 0);
this._setTileY(t.node, 15);
} else this._playTile(t.node);
e.stopPropagation();
}
}
},
_playTile: function(e) {
if (cc.isValid(e) && null != e.mjId && cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
this.shoot(e.mjId);
e.y = 0;
this._selectedMJ = null;
for (var t = 0; t < this._gestureSel.length; ++t) cc.isValid(this._gestureSel[t]) && (this._gestureSel[t].y = 0);
this._gestureSel = [];
}
},
_findTileAtPos: function(e) {
for (var t = 0; t < this._myMJArr.length; ++t) {
var i = this._myMJArr[t].node;
if (cc.isValid(i) && i.active && i.getBoundingBoxToWorld().contains(e)) return i;
}
return null;
},
_handleChiSelect: function(e) {
if (null != e && null != e.mjId) for (var t = 0; t < this._myMJArr.length; ++t) if (e == this._myMJArr[t].node) {
var i = this._chiSelect.tiles, n = i.indexOf(e);
if (-1 != n) {
i.splice(n, 1);
this._setTileY(e, 0);
return;
}
if (i.length >= 2) return;
i.push(e);
this._setTileY(e, 15);
if (2 == i.length) {
var a = i[0].mjId, s = i[1].mjId, o = this._chiSelect.pai;
i[0].y = 0;
i[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ a, s, o ]);
}
return;
}
},
_setTileY: function(e, t) {
if (e && cc.isValid(e)) {
cc.Tween.stopAllByTarget(e);
cc.tween(e).to(.08, {
y: t
}, {
easing: "quadOut"
}).start();
}
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
this._setTileY(t, 0);
return;
}
if (n.length >= 2) return;
n.push(t);
this._setTileY(t, 15);
if (2 == n.length) {
var s = n[0].mjId, o = n[1].mjId, r = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ s, o, r ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var c = this._findMJNode(e);
if (null != c) for (var l = 0; l < this._myMJArr.length; ++l) if (c == this._myMJArr[l].node) {
if (c == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._setTileY(this._selectedMJ, 0);
this._selectedMJ = null;
return;
}
null != this._selectedMJ && this._setTileY(this._selectedMJ, 0);
this._setTileY(c, 15);
this._selectedMJ = c;
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
var n = cc.vv.gameNetMgr.getLocalIndex(e), a = cc.vv.mahjongmgr.getSide(n), s = cc.vv.mahjongmgr.getFoldPre(n), o = this.node.getChildByName("game").getChildByName(a).getChildByName("holds"), r = this.getMJIndex(a, 13), c = o.children[r];
if (null != c) {
c.scaleX = 1;
c.scaleY = 1;
if (null == t) c.active = !1; else if (t >= 0) {
c.active = !0;
if ("up" == a) {
c.scaleX = .73;
c.scaleY = .73;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(s, t);
if (0 == n) {
var l = cc.vv.gameNetMgr.conf || {};
i(c, l.caishen >= 0 && t == l.caishen || null != l.caishen2 && l.caishen2 >= 0 && t == l.caishen2);
}
} else if (null != t) {
c.active = !0;
if ("up" == a) {
c.scaleX = 1;
c.scaleY = 1;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(a);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), s = 0; s < n.childrenCount; ++s) {
var o = n.children[s];
o.scaleX = 1;
o.scaleY = 1;
o.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, s = a ? a.getChildByName("holds") : null;
if (null != s) {
var o = e.chis || [], r = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + o.length;
r *= 3;
for (var c = 0; c < r; ++c) {
var l = this.getMJIndex(i, c);
null != s.children[l] && (s.children[l].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (c = 0; c < d.length; ++c) {
l = this.getMJIndex(i, c + r);
if (null != s.children[l]) {
var u = s.children[l].getComponent(cc.Sprite);
if (null != u) {
if ("up" == i) {
u.node.scaleX = .73;
u.node.scaleY = .73;
}
u.node.active = !0;
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[c]);
}
}
}
this._hideUnusedHolds(i, s, r + d.length);
} else {
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (c = r; c < r + g; ++c) {
l = this.getMJIndex(i, c);
var v = s.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, s, r + g);
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
for (var s = cc.vv.gameNetMgr.conf, o = s ? s.caishen : -1, r = s ? s.caishen2 : -1, c = [], l = [], h = 0; h < i.length; ++h) {
var d = i[h];
o >= 0 && d == o || null != r && r >= 0 && d == r ? c.push(d) : l.push(d);
}
cc.vv.mahjongmgr.sortMJ(l);
i.length = 0;
for (var u = 0; u < c.length; ++u) i.push(c[u]);
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
var a, s = i.chis || [], o = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + s.length), r = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (r = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (r = 0);
a = r > 0 ? .5 * r : 20;
var c = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), l = this._myMJArr[o], h = l ? l.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", o, "holds.length=", n.length, "startSlot=", o, "endSlot=", o + n.length - 1);
for (var d = cc.vv.gameNetMgr.conf, u = d ? d.caishen : -1, g = d ? d.caishen2 : -1, v = [], _ = 0; _ < n.length; ++_) {
var f = n[_];
if (null == (b = this._myMJArr[_ + o]) || null == b.node) {
v.push("SLOT_" + (_ + o) + "=NULL");
break;
}
b.node.mjId = f;
b.node.y = 0;
var m = c && _ == n.length - 1;
r > 0 && (b.node.x = h + _ * r + (m ? a : 0));
this.setSpriteFrameByMJID("M_", b, f);
var p = u >= 0 && f == u || null != g && g >= 0 && f == g;
b.node.color = p ? cc.color(255, 200, 90) : cc.Color.WHITE;
v.push("SLOT_" + (_ + o) + "=" + f);
}
console.log("[initMahjongs] render:", v.join("|"));
for (_ = 0; _ < o; ++_) if (null != (b = this._myMJArr[_]) && null != b.node) {
b.node.mjId = null;
b.spriteFrame = null;
b.node.active = !1;
}
for (_ = o + n.length; _ < this._myMJArr.length; ++_) {
var b;
if (null != (b = this._myMJArr[_]) && null != b.node) {
b.node.mjId = null;
b.spriteFrame = null;
b.node.active = !1;
}
}
}
} else console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", i ? i.holds : i);
},
setSpriteFrameByMJID: function(e, t, n) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, n);
t.node.active = !0;
var a = cc.vv.gameNetMgr.conf || {}, s = null != n && n >= 0 && (a.caishen >= 0 && n == a.caishen || null != a.caishen2 && a.caishen2 >= 0 && n == a.caishen2);
i(t.node, s);
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
for (var i = [], n = 36, a = 0; a < e.length; ++a) {
a > 0 && (n += 30);
var s = 46 * e[a].pais.length + 4 * (e[a].pais.length - 1);
i.push(s);
n += s;
}
var o = new cc.Node("chiPanel");
o.setContentSize(n, 120);
o.setPosition(0, -140);
t.addChild(o);
var r = new cc.Node("bg");
r.setContentSize(n, 120);
o.addChild(r);
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(18, 18, 24, 235);
c.strokeColor = cc.color(255, 200, 90, 255);
c.lineWidth = 3;
c.rect(-n / 2, -60, n, 120);
c.fill();
c.stroke();
var l = new cc.Node("cap");
l.setContentSize(n, 26);
l.setPosition(0, 37);
o.addChild(l);
var h = l.addComponent(cc.Label);
h.string = "点击组合完成操作";
h.fontSize = 22;
h.lineHeight = 26;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
l.color = cc.color(255, 225, 150);
for (var d = 18, u = 0; u < e.length; ++u) {
var g = e[u], v = g.pais, _ = i[u], f = new cc.Node("cpgItem" + u);
f.setContentSize(_, 66);
f.setPosition(-n / 2 + d + _ / 2, -13);
d += _ + 30;
o.addChild(f);
f.addComponent(cc.Button);
f.actType = g.type;
f.paiList = v;
f.targetPai = g.pai;
cc.vv.utils.addClickEvent(f, this.node, "MJGameZP4", "onChiItemClicked");
for (var m = 0; m < v.length; ++m) {
var p = new cc.Node("p" + m);
p.setContentSize(46, 66);
p.setPosition(-_ / 2 + 23 + 50 * m, 0);
f.addChild(p);
var b = p.addComponent(cc.Sprite);
b.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", v[m]);
b.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = o;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e && (e.node || e.currentTarget || e.target) || null;
if (null != t) {
if ("peng" == t.actType) cc.vv.net.send("peng"); else if ("gang" == t.actType) cc.vv.net.send("gang", t.targetPai); else if (t.paiList) {
for (var i = t.targetPai, n = [], a = cc.vv.gameNetMgr.getSelfData(), s = a && a.holds ? a.holds : [], o = cc.vv.gameNetMgr.conf || {}, r = o.caishen, c = o.caishen2, l = 0; l < t.paiList.length; ++l) {
var h = t.paiList[l];
h != i && (h != r && h != c && -1 != s.indexOf(h) ? n.push(h) : r >= 0 && -1 != s.indexOf(r) ? n.push(r) : null != c && c >= 0 && -1 != s.indexOf(c) && n.push(c));
}
n.push(i);
3 == n.length && cc.vv.net.send("chi", n);
}
this.hideChiPanel();
this.hideOptions();
}
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
var s = this._options.getChildByName("btnHu");
if (s && s.active && cc.vv.alert && cc.vv.alert.show) {
var o = this;
cc.vv.alert.show(null, "当前可以胡牌，确定要过吗？", function() {
cc.vv.net.send("guo");
o.hideOptions();
}, !0);
return;
}
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
function i(e, t) {
var i = t ? cc.color(255, 208, 90) : cc.Color.WHITE;
e.color = i;
var n = e.getComponent(cc.Button);
if (n && n.transition === cc.Button.Transition.COLOR) {
n._mjOrigCol || (n._mjOrigCol = {
n: n.normalColor,
h: n.hoverColor,
p: n.pressedColor,
d: n.disabledColor
});
var a = n._mjOrigCol;
if (t) {
n.normalColor = i;
n.hoverColor = i;
n.pressedColor = cc.color(235, 185, 75);
} else {
n.normalColor = a.n;
n.hoverColor = a.h;
n.pressedColor = a.p;
n.disabledColor = a.d;
}
}
}
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
for (var n = [ "NoticeTip", "GameOverZP", "PengGangs", "MJRoom", "TimePointer", "GameResultZP", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow", "DeskStyle", "Alert" ], a = 0; a < n.length; ++a) null == this.getComponent(n[a]) && this.addComponent(n[a]);
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
var s = n.children[a].getComponent(cc.Sprite);
this._myMJArr.push(s);
s.spriteFrame = null;
}
this._setupHandGestures();
var o = cc.view.getVisibleSize().width / 1280;
if (o < 1) {
n.scaleX *= o;
n.scaleY *= o;
}
var r = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < r; ++a) {
var c = cc.vv.mahjongmgr.getSide(a), l = e.getChildByName(c);
if (null != l) {
this._hupaiTips.push(l.getChildByName("HuPai"));
this._hupaiLists.push(l.getChildByName("hupailist"));
this._playEfxs.push(l.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(l.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
var h = l.getChildByName("opt");
h.active = !1;
s = h.getChildByName("pai").getComponent(cc.Sprite);
var d = {
node: h,
sprite: s
};
this._opts.push(d);
}
}
var u = e.getChildByName("ops");
this._options = u;
if (u) for (var g = 0; g < u.childrenCount; ++g) {
var v = u.children[g];
if ("op" == v.name) {
var _ = v.getComponent(cc.Sprite);
_ && (_.enabled = !1);
var f = v.getChildByName("opTarget");
f && (f.active = !1);
}
}
var m = u ? u.getChildByName("New Layout") : null;
if (m) {
var p = m.getComponent(cc.Button);
p && (p.enabled = !1);
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
var s = this;
this.node.on("game_start", function(e) {
s.onGameBeign(!0, e && e.detail);
s.initCaishenTip();
});
this.node.on("game_begin", function() {
s.onGameBeign();
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
s.hideYoujinPanel();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
s.initHuaArea(t.si);
s._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
}
});
this.node.on("game_youjin", function(e) {
var t = e.detail;
t && s.showYoujinLevel(t.si, t.level);
});
this.node.on("game_fenbing", function(e) {
var t = e.detail;
if (t) {
var i = cc.vv.gameNetMgr.seats[t.si], n = i ? i.name : "" + t.si;
cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError(n + " 分饼 " + t.score + " 分");
}
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
s.playEfx(i, "play_chi");
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
var a = n.getChildByName("opTarget");
a && (a.active = !1);
var s = n.getChildByName(e);
s.active = !0;
s.pai = t;
return;
}
}
},
addChiOption: function(e) {
for (var t = 0; t < this._options.childrenCount; ++t) {
var i = this._options.children[t];
if ("op" == i.name && 0 == i.active) {
i.active = !0;
var n = i.getChildByName("opTarget");
n && (n.active = !1);
var a = this.getChiButton(i);
if (a) {
a.active = !0;
a.pai = e;
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
var s = t.getChildByName("btnLabel");
s && (s.active = !1);
}
});
t.addComponent(cc.Button);
var a = new cc.Node("btnLabel");
t.addChild(a);
var s = a.addComponent(cc.Label);
s.string = "吃";
s.fontSize = 40;
s.lineHeight = 40;
s.overflow = cc.Label.Overflow.NONE;
s.enableWrapText = !1;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
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
var s = e.getChildByName("btnPeng");
a = new cc.Node(t);
e.addChild(a);
if (s) {
a.setPosition(s.getPosition());
a.setContentSize(s.getContentSize());
a.scaleX = s.scaleX;
a.scaleY = s.scaleY;
}
var o = a.addComponent(cc.Sprite);
o.type = cc.Sprite.Type.SIMPLE;
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(a)) {
var i = a.getComponent(cc.Sprite);
i && (i.spriteFrame = t);
}
});
a.addComponent(cc.Button);
var r = new cc.Node("btnLabel");
a.addChild(r);
var c = r.addComponent(cc.Label);
c.string = i;
c.fontSize = n || 40;
c.lineHeight = c.fontSize;
c.overflow = cc.Label.Overflow.NONE;
c.enableWrapText = !1;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
r.color = cc.color(255, 255, 255);
r.setPosition(0, 0);
cc.vv.utils.addClickEvent(a, this.node, "MJGameZP", "onOptionClicked");
a.active = !1;
return a;
},
addZpOption: function(e, t, i, n) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var s = this._options.children[a];
if ("op" == s.name && 0 == s.active) {
s.active = !0;
s.getChildByName("opTarget").getComponent(cc.Sprite).spriteFrame = null != i && i >= 0 ? cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", i) : null;
var o = this.getZpOpButton(s, e, t, n);
o.active = !0;
o.pai = i;
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
var s = t.getChildByName("btnYouJinGo");
s && (s.active = !1);
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
}, s = t.getChildByName("cs1");
if (s) {
s.active = !0;
a(s, i.caishen);
}
var o = t.getChildByName("cs2");
if (o) {
var r = null != i.caishen2 && i.caishen2 >= 0;
o.active = r;
r && a(o, i.caishen2);
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
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game") || this.node, a = new cc.Node("huaArea_" + i), s = this._huaAreaPos(i);
a.setPosition(s.x, s.y);
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
if (0 != n.length) for (var a = cc.vv.mahjongmgr.bottomAtlas, s = 0; s < n.length; ++s) {
var o = n[s], r = new cc.Node("hua" + s);
r.setContentSize(44, 64);
r.setPosition(48 * s + 22, 0);
i.addChild(r);
var c = r.addComponent(cc.Sprite);
c.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var l = o - 34, h = l >= 0 && l < 8 ? "M_" + [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][l] : null, d = h ? a.getSpriteFrame(h) : null;
if (null != d) c.spriteFrame = d; else {
var u = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
c.spriteFrame = u;
var g = new cc.Node("name");
r.addChild(g);
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
var a = cc.vv.mahjongmgr.getSide(i), s = this.getHuaArea(e);
n = new cc.Node("youjin_" + a);
s.parent.addChild(n);
var o = n.addComponent(cc.Label);
o.fontSize = 30;
o.lineHeight = 34;
o.overflow = cc.Label.Overflow.NONE;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
n.color = cc.color(255, 90, 90);
var r = n.addComponent(cc.LabelOutline);
r.color = cc.color(80, 0, 0);
r.width = 2;
this._youjinLabels[i] = n;
}
var c = this.getHuaArea(e);
n.setPosition(c.x, c.y + 80);
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
var s = a.addComponent(cc.Graphics);
s.fillColor = cc.color(18, 18, 24, 235);
s.strokeColor = cc.color(255, 200, 90, 255);
s.lineWidth = 3;
s.rect(-i / 2, -73, i, 146);
s.fill();
s.stroke();
var o = new cc.Node("cap");
o.setContentSize(i, 28);
o.setPosition(0, 49);
n.addChild(o);
var r = o.addComponent(cc.Label);
r.string = "选择一张牌宣告游金";
r.fontSize = 22;
r.lineHeight = 28;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.verticalAlign = cc.Label.VerticalAlign.CENTER;
o.color = cc.color(255, 225, 150);
for (var c = 0; c < e.length; ++c) {
var l = new cc.Node("yjItem" + c);
l.setContentSize(62, 90);
l.setPosition(51 + -i / 2 + 78 * c, -14);
n.addChild(l);
l.addComponent(cc.Button);
l.pai = e[c];
cc.vv.utils.addClickEvent(l, this.node, "MJGameZP", "onYoujinItemClicked");
var h = l.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[c]);
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
if (cc.vv && cc.vv.mahjongmgr) {
var n = null;
"play_hu" == t ? n = "mj_hu" : "play_zimo" == t ? n = "mj_zimo" : "play_chi" == t ? n = "mj_chi" : "play_peng" == t ? n = "mj_peng" : "play_guafeng" != t && "play_xiayu" != t && "play_gang" != t || (n = "mj_gang");
n && cc.vv.mahjongmgr.playSpineEfx(i.node, n);
}
},
onGameBeign: function(e) {
for (var t = 0; t < this._playEfxs.length; ++t) this._playEfxs[t].node.active = !1;
for (t = 0; t < this._hupaiLists.length; ++t) for (var i = 0; i < this._hupaiLists[t].childrenCount; ++i) this._hupaiLists[t].children[i].active = !1;
if (cc.vv.gameNetMgr.seats) for (t = 0; t < cc.vv.gameNetMgr.seats.length; ++t) {
var n = cc.vv.gameNetMgr.seats[t], a = cc.vv.gameNetMgr.getLocalIndex(t), s = this._hupaiTips[a];
s.active = n.hued;
if (n.hued) {
s.getChildByName("sprHu").active = !n.iszimo;
s.getChildByName("sprZimo").active = n.iszimo;
}
}
this.hideChupai();
this.hideOptions();
var o = this.node.getChildByName("game"), r = o.getChildByName("huanpaiinfo");
null != r && (r.active = !1);
var c = [ "right", "up", "left" ];
for (t = 0; t < c.length; ++t) {
var l = o.getChildByName(c[t]);
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
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, s) {
if (null != a && 0 != n.length) {
var o = a.convertToNodeSpaceAR(e);
n.sort(s);
for (var r = 0; r < n.length; ++r) {
var c = n[r], l = c.x, h = c.y, d = c.opacity;
t.push({
node: c,
x: l,
y: h,
op: d
});
c.setPosition(o);
c.opacity = 0;
c.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(l, h)), cc.fadeTo(.15, d))));
var u = .06 * r + .15;
u > i && (i = u);
}
}
}, a = [], s = null, o = 0; o < this._myMJArr.length; ++o) {
var r = this._myMJArr[o];
if (r && r.node && r.node.active && null != r.node.mjId) {
a.push(r.node);
s = r.node.parent;
}
}
n(a, s, function(e, t) {
return e.x - t.x;
});
for (var c = this.node.getChildByName("game"), l = cc.vv.gameNetMgr.seats || [], h = 0; h < l.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var u = cc.vv.mahjongmgr.getSide(d), g = c ? c.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
if (null != v) {
for (var _ = [], f = 0; f < v.childrenCount; ++f) {
var m = v.children[f];
m.active && _.push(m);
}
n(_, v, "up" == u ? function(e, t) {
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
btnChi: 1,
btnQiangJin: 1,
btnYouJin: 1,
btnYouJinGo: 1
}; t && !i[t.name] && t.parent; ) t = t.parent;
return t;
},
_getGestureSettings: function() {
var e = cc.vv.deskStyle;
if (e && e.getGestureSettings) return e.getGestureSettings();
try {
return {
multiSelect: !!JSON.parse(cc.sys.localStorage.getItem("gesture_multi_select") || "false"),
swipeUp: !!JSON.parse(cc.sys.localStorage.getItem("mj_gesture_swipe_up") || "false"),
playMode: JSON.parse(cc.sys.localStorage.getItem("mj_play_mode") || '"single"')
};
} catch (e) {
return {
multiSelect: !1,
swipeUp: !1,
playMode: "single"
};
}
},
_setupHandGestures: function() {
this._gestureSel = [];
this._gestureStart = null;
this._gesturePlayed = !1;
this._gestureMoved = !1;
this._lastTapTile = null;
this._lastTapTime = 0;
for (var e = 0; e < this._myMJArr.length; ++e) {
var t = this._myMJArr[e].node;
if (cc.isValid(t)) {
var i = t.getComponent(cc.Button);
i && (i.clickEvents = []);
t.on(cc.Node.EventType.TOUCH_START, function(e) {
this._onHandTouchStart(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
this._onHandTouchMove(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_END, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
t.on(cc.Node.EventType.TOUCH_CANCEL, function(e) {
this._onHandTouchEnd(e, e.getCurrentTarget());
}, this);
}
}
},
_onHandTouchStart: function(e, t) {
if (this._dealAnimating) {
if (Date.now() < (this._dealAnimUntil || 0)) return;
this._dealAnimating = !1;
}
if (this._chiSelect || this._csPanel && this._csPanel.active) {
this.onMJClicked({
node: t,
currentTarget: t
});
e.stopPropagation();
} else {
var i = e.getLocation();
this._gestureStart = {
x: i.x,
y: i.y,
t: Date.now(),
node: t
};
this._gesturePlayed = !1;
this._gestureMoved = !1;
for (var n = 0; n < this._gestureSel.length; ++n) cc.isValid(this._gestureSel[n]) && (this._gestureSel[n].y = 0);
this._gestureSel = [];
}
},
_onHandTouchMove: function(e) {
if (this._gestureStart && !this._gesturePlayed) {
var t = this._getGestureSettings(), i = e.getLocation(), n = i.x - this._gestureStart.x, a = i.y - this._gestureStart.y;
if (t.swipeUp && a < -30) {
this._playTile(this._gestureStart.node);
this._gesturePlayed = !0;
e.stopPropagation();
} else if (t.multiSelect && Math.abs(n) > 8) {
this._gestureMoved = !0;
var s = this._findTileAtPos(i);
if (s && -1 == this._gestureSel.indexOf(s)) {
this._gestureSel.push(s);
this._setTileY(s, 15);
}
}
}
},
_onHandTouchEnd: function(e) {
if (this._gestureStart) {
var t = this._gestureStart;
this._gestureStart = null;
if (!this._gesturePlayed) if (this._gestureMoved && this._gestureSel.length > 0) e.stopPropagation(); else {
var i = this._getGestureSettings(), n = Date.now(), a = this._lastTapTile, s = a == t.node && n - this._lastTapTime < 300;
this._lastTapTile = t.node;
this._lastTapTime = n;
if ("double" === i.playMode) if (s) this._playTile(t.node); else {
a && a != t.node && cc.isValid(a) && this._setTileY(a, 0);
this._setTileY(t.node, 15);
} else this._playTile(t.node);
e.stopPropagation();
}
}
},
_playTile: function(e) {
if (cc.isValid(e) && null != e.mjId && cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
this.shoot(e.mjId);
e.y = 0;
this._selectedMJ = null;
for (var t = 0; t < this._gestureSel.length; ++t) cc.isValid(this._gestureSel[t]) && (this._gestureSel[t].y = 0);
this._gestureSel = [];
}
},
_findTileAtPos: function(e) {
for (var t = 0; t < this._myMJArr.length; ++t) {
var i = this._myMJArr[t].node;
if (cc.isValid(i) && i.active && i.getBoundingBoxToWorld().contains(e)) return i;
}
return null;
},
_handleChiSelect: function(e) {
if (null != e && null != e.mjId) for (var t = 0; t < this._myMJArr.length; ++t) if (e == this._myMJArr[t].node) {
var i = this._chiSelect.tiles, n = i.indexOf(e);
if (-1 != n) {
i.splice(n, 1);
this._setTileY(e, 0);
return;
}
if (i.length >= 2) return;
i.push(e);
this._setTileY(e, 15);
if (2 == i.length) {
var a = i[0].mjId, s = i[1].mjId, o = this._chiSelect.pai;
i[0].y = 0;
i[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ a, s, o ]);
}
return;
}
},
_setTileY: function(e, t) {
if (e && cc.isValid(e)) {
cc.Tween.stopAllByTarget(e);
cc.tween(e).to(.08, {
y: t
}, {
easing: "quadOut"
}).start();
}
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
this._setTileY(t, 0);
return;
}
if (n.length >= 2) return;
n.push(t);
this._setTileY(t, 15);
if (2 == n.length) {
var s = n[0].mjId, o = n[1].mjId, r = this._chiSelect.pai;
n[0].y = 0;
n[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ s, o, r ]);
}
return;
}
} else if (cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex) {
var c = this._findMJNode(e);
if (null != c) for (var l = 0; l < this._myMJArr.length; ++l) if (c == this._myMJArr[l].node) {
if (c == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._setTileY(this._selectedMJ, 0);
this._selectedMJ = null;
return;
}
null != this._selectedMJ && this._setTileY(this._selectedMJ, 0);
this._setTileY(c, 15);
this._selectedMJ = c;
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
var n = cc.vv.gameNetMgr.getLocalIndex(e), a = cc.vv.mahjongmgr.getSide(n), s = cc.vv.mahjongmgr.getFoldPre(n), o = this.node.getChildByName("game").getChildByName(a).getChildByName("holds"), r = this.getMJIndex(a, 13), c = o.children[r];
if (null != c) {
c.scaleX = 1;
c.scaleY = 1;
if (null == t) c.active = !1; else if (t >= 0) {
c.active = !0;
if ("up" == a) {
c.scaleX = .73;
c.scaleY = .73;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(s, t);
if (0 == n) {
var l = cc.vv.gameNetMgr.conf || {};
i(c, l.caishen >= 0 && t == l.caishen || null != l.caishen2 && l.caishen2 >= 0 && t == l.caishen2);
}
} else if (null != t) {
c.active = !0;
if ("up" == a) {
c.scaleX = 1;
c.scaleY = 1;
}
c.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(a);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), s = 0; s < n.childrenCount; ++s) {
var o = n.children[s];
o.scaleX = 1;
o.scaleY = 1;
o.getComponent(cc.Sprite).spriteFrame = a;
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game"), a = n ? n.getChildByName(i) : null, s = a ? a.getChildByName("holds") : null;
if (null != s) {
var o = e.chis || [], r = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + o.length;
r *= 3;
for (var c = 0; c < r; ++c) {
var l = this.getMJIndex(i, c);
null != s.children[l] && (s.children[l].active = !1);
}
var h = cc.vv.mahjongmgr.getFoldPre(t), d = this.sortHolds(e);
if (null != d && "object" == typeof d && null != d.length && 0 !== d.length) {
for (c = 0; c < d.length; ++c) {
l = this.getMJIndex(i, c + r);
if (null != s.children[l]) {
var u = s.children[l].getComponent(cc.Sprite);
if (null != u) {
if ("up" == i) {
u.node.scaleX = .73;
u.node.scaleY = .73;
}
u.node.active = !0;
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(h, d[c]);
}
}
}
this._hideUnusedHolds(i, s, r + d.length);
} else {
var g = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (c = r; c < r + g; ++c) {
l = this.getMJIndex(i, c);
var v = s.children[l];
null != v && (v.active = !0);
}
this._hideUnusedHolds(i, s, r + g);
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
for (var s = cc.vv.gameNetMgr.conf, o = s ? s.caishen : -1, r = s ? s.caishen2 : -1, c = [], l = [], h = 0; h < i.length; ++h) {
var d = i[h];
o >= 0 && d == o || null != r && r >= 0 && d == r ? c.push(d) : l.push(d);
}
cc.vv.mahjongmgr.sortMJ(l);
i.length = 0;
for (var u = 0; u < c.length; ++u) i.push(c[u]);
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
var a, s = i.chis || [], o = 3 * ((i.pengs ? i.pengs.length : 0) + (i.angangs ? i.angangs.length : 0) + (i.diangangs ? i.diangangs.length : 0) + (i.wangangs ? i.wangangs.length : 0) + s.length), r = 0;
this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1] && (r = this._myMJArr[1].node.x - this._myMJArr[0].node.x) < 0 && (r = 0);
a = r > 0 ? .5 * r : 20;
var c = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), l = this._myMJArr[o], h = l ? l.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", o, "holds.length=", n.length, "startSlot=", o, "endSlot=", o + n.length - 1);
for (var d = cc.vv.gameNetMgr.conf, u = d ? d.caishen : -1, g = d ? d.caishen2 : -1, v = [], _ = 0; _ < n.length; ++_) {
var f = n[_];
if (null == (b = this._myMJArr[_ + o]) || null == b.node) {
v.push("SLOT_" + (_ + o) + "=NULL");
break;
}
b.node.mjId = f;
b.node.y = 0;
var m = c && _ == n.length - 1;
r > 0 && (b.node.x = h + _ * r + (m ? a : 0));
this.setSpriteFrameByMJID("M_", b, f);
var p = u >= 0 && f == u || null != g && g >= 0 && f == g;
b.node.color = p ? cc.color(255, 200, 90) : cc.Color.WHITE;
v.push("SLOT_" + (_ + o) + "=" + f);
}
console.log("[initMahjongs] render:", v.join("|"));
for (_ = 0; _ < o; ++_) if (null != (b = this._myMJArr[_]) && null != b.node) {
b.node.mjId = null;
b.spriteFrame = null;
b.node.active = !1;
}
for (_ = o + n.length; _ < this._myMJArr.length; ++_) {
var b;
if (null != (b = this._myMJArr[_]) && null != b.node) {
b.node.mjId = null;
b.spriteFrame = null;
b.node.active = !1;
}
}
}
} else console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", i ? i.holds : i);
},
setSpriteFrameByMJID: function(e, t, n) {
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, n);
t.node.active = !0;
var a = cc.vv.gameNetMgr.conf || {}, s = null != n && n >= 0 && (a.caishen >= 0 && n == a.caishen || null != a.caishen2 && a.caishen2 >= 0 && n == a.caishen2);
i(t.node, s);
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
for (var i = [], n = 36, a = 0; a < e.length; ++a) {
a > 0 && (n += 30);
var s = 46 * e[a].pais.length + 4 * (e[a].pais.length - 1);
i.push(s);
n += s;
}
var o = new cc.Node("chiPanel");
o.setContentSize(n, 120);
o.setPosition(0, -140);
t.addChild(o);
var r = new cc.Node("bg");
r.setContentSize(n, 120);
o.addChild(r);
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(18, 18, 24, 235);
c.strokeColor = cc.color(255, 200, 90, 255);
c.lineWidth = 3;
c.rect(-n / 2, -60, n, 120);
c.fill();
c.stroke();
var l = new cc.Node("cap");
l.setContentSize(n, 26);
l.setPosition(0, 37);
o.addChild(l);
var h = l.addComponent(cc.Label);
h.string = "点击组合完成操作";
h.fontSize = 22;
h.lineHeight = 26;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
l.color = cc.color(255, 225, 150);
for (var d = 18, u = 0; u < e.length; ++u) {
var g = e[u], v = g.pais, _ = i[u], f = new cc.Node("cpgItem" + u);
f.setContentSize(_, 66);
f.setPosition(-n / 2 + d + _ / 2, -13);
d += _ + 30;
o.addChild(f);
f.addComponent(cc.Button);
f.actType = g.type;
f.paiList = v;
f.targetPai = g.pai;
cc.vv.utils.addClickEvent(f, this.node, "MJGameZP", "onChiItemClicked");
for (var m = 0; m < v.length; ++m) {
var p = new cc.Node("p" + m);
p.setContentSize(46, 66);
p.setPosition(-_ / 2 + 23 + 50 * m, 0);
f.addChild(p);
var b = p.addComponent(cc.Sprite);
b.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", v[m]);
b.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
}
this._chiPanel = o;
},
hideChiPanel: function() {
this._chiPanel && cc.isValid(this._chiPanel) && this._chiPanel.destroy();
this._chiPanel = null;
},
onChiItemClicked: function(e) {
var t = e && (e.node || e.currentTarget || e.target) || null;
if (null != t) {
if ("peng" == t.actType) cc.vv.net.send("peng"); else if ("gang" == t.actType) cc.vv.net.send("gang", t.targetPai); else if (t.paiList) {
for (var i = t.targetPai, n = [], a = cc.vv.gameNetMgr.getSelfData(), s = a && a.holds ? a.holds : [], o = cc.vv.gameNetMgr.conf || {}, r = o.caishen, c = o.caishen2, l = 0; l < t.paiList.length; ++l) {
var h = t.paiList[l];
h != i && (h != r && h != c && -1 != s.indexOf(h) ? n.push(h) : r >= 0 && -1 != s.indexOf(r) ? n.push(r) : null != c && c >= 0 && -1 != s.indexOf(c) && n.push(c));
}
n.push(i);
3 == n.length && cc.vv.net.send("chi", n);
}
this.hideChiPanel();
this.hideOptions();
}
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
var s = this._options.getChildByName("btnHu");
if (s && s.active && cc.vv.alert && cc.vv.alert.show) {
var o = this;
cc.vv.alert.show(null, "当前可以胡牌，确定要过吗？", function() {
cc.vv.net.send("guo");
o.hideOptions();
}, !0);
return;
}
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
var i = e.getChildByName("seats");
if (i) for (var n = 0; n < i.children.length; ++n) this._seats.push(i.children[n].getComponent("Seat"));
this.refreshBtns();
this.lblRoomNo = cc.find("Canvas/infobar/Z_room_txt/New Label").getComponent(cc.Label);
this._timeLabel = cc.find("Canvas/infobar/time").getComponent(cc.Label);
var a = cc.vv.gameNetMgr.roomId;
this.lblRoomNo.string = "房号:" + a;
var s = this.node.getChildByName("game"), o = cc.vv.mahjongmgr.is2Player() ? [ "myself", "up" ] : [ "myself", "right", "up", "left" ];
for (n = 0; n < o.length; ++n) {
var r = s.getChildByName(o[n]);
if (null != r) {
var c = r.getChildByName("seat");
null != c && this._seats2.push(c.getComponent("Seat"));
}
}
0 == this._seats.length && (this._seats = this._seats2);
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
var e = this.node.getChildByName("prepare"), t = e.getChildByName("btnDissolve"), i = e.getChildByName("btnWeichat"), n = e.getChildByName("btnBack"), a = 0 == cc.vv.gameNetMgr.numOfGames, s = cc.vv.gameNetMgr.seats, o = s ? s[cc.vv.gameNetMgr.seatIndex] : null, r = !(!o || !o.ready);
t && (t.active = a && r);
i && (i.active = a);
n && (n.active = a && !r);
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
var s = t.getComponent(cc.Widget);
s && t.removeComponent(s);
var o = t.getComponent(cc.Button);
if (o) {
o.transition = cc.Button.Transition.NONE;
o.clickEvents = [];
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
var s = e.getComponent(cc.Button);
s && (s.interactable = !0);
}
},
applyCustomBtnSkins: function() {
var e = this.node.getChildByName("prepare");
if (null != e) {
var t = this, i = function(e, i) {
var n = t._atlasCache = t._atlasCache || {}, a = n["images/atlas/game_ui"];
a ? i(a.getSpriteFrame(e)) : cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(t, s) {
if (!t && s) {
n["images/atlas/game_ui"] = s;
a = s;
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
var s = a.getComponent(cc.Label);
null == s && (s = a.addComponent(cc.Label));
s.string = t;
s.fontSize = i;
s.lineHeight = i;
s.overflow = cc.Label.Overflow.NONE;
s.enableWrapText = !1;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
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
this._brickDrawable = [];
for (var i = [], n = 0; n < 31; ++n) {
var a = t.getChildByName("LT" + (n < 10 ? "0" : "") + n);
a && i.push(a);
}
i.sort(function(e, t) {
return e.y - t.y;
});
for (n = 0; n < i.length; ++n) this._brickDrawable.push(i[n]);
for (n = 0; n < 16; ++n) this._brickDrawable.push(t.getChildByName("U" + (n < 10 ? "0" : "") + n));
this._brickDead = [];
for (n = 16; n < 36; ++n) {
var s = t.getChildByName("U" + n);
s && this._brickDead.push(s);
}
for (n = 0; n < 6; ++n) {
var o = t.getChildByName("RT0" + n);
o && this._brickDead.push(o);
}
this.refreshBrickWall();
} else this._brickBuilt = !1;
}
},
refreshBrickWall: function() {
if (this._brickBuilt) {
var e = cc.vv.gameNetMgr, t = e.numOfMJ;
(null == t || t < 0) && (t = 0);
for (var i = 0, n = e.seats || [], a = 0; a < n.length; ++a) {
var s = n[a];
s && (i += (s.angangs ? s.angangs.length : 0) + (s.diangangs ? s.diangangs.length : 0) + (s.wangangs ? s.wangangs.length : 0));
}
var o = e.conf && e.conf.gang_liuju ? e.conf.gang_liuju * i : 0, r = t >= 26;
if (this._brickDead) for (var c = 0; c < this._brickDead.length; ++c) {
var l = this._brickDead[c];
l && (l.active = r);
}
var h = this._brickDrawable, d = Math.max(0, Math.min(t - 26 - o, h.length)), u = h.length - d, g = h.length - o;
for (c = 0; c < h.length; ++c) {
var v = h[c];
if (v) {
v.active = c >= u;
v.color = o > 0 && c >= g ? new cc.Color(140, 140, 140, 255) : cc.Color.WHITE;
}
}
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
}, s = function(e) {
if (e && (1 == e.final || e.endinfo)) {
console.log("[room] game_over_push(final):显示本次游戏总分数");
t.showTotalScorePanel(e);
}
}, o = function() {
console.log("[room] exit_result:退出成功,返回大厅/俱乐部");
t.leaveToHall();
};
e.on("dispress_push", i);
e.on("exit_notify_push", n);
e.on("game_all_over_push", a);
e.on("game_over_push", s);
e.on("exit_result", o);
this._sioHandlers = {
sio: e,
listeners: [ i, n, a, s, o ]
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
var s = e || {};
a.onGameEnd ? a.onGameEnd(s.endinfo || null, s.roundHistory || null) : a.showTotalScore && a.showTotalScore();
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
var i = cc.vv.gameNetMgr.getSeatIndexByID(t.sender), n = cc.vv.gameNetMgr.getLocalIndex(i), a = t.content, s = cc.vv.chat.getQuickChatInfo(a), o = e._inGame ? e._seats2[n] : e._seats[n];
o && o.chat(s.content);
cc.vv.audioMgr.playSFX(s.sound);
});
this.node.on("emoji_push", function(t) {
t = t.detail;
var i = cc.vv.gameNetMgr.getSeatIndexByID(t.sender), n = cc.vv.gameNetMgr.getLocalIndex(i), a = e._inGame ? e._seats2[n] : e._seats[n];
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
this.node.on("gang_notify", function() {
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
var s = cc.vv.gameNetMgr.seats;
for (var o in s) this.onPengGangChanged(s[o]);
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
_isZjlao: function() {
return null != this.node.getComponent("MJGameZJLAO");
},
_setCaishenCorner: function(e, t) {
if (this._isZjlao() && e) {
var i = e.getChildByName("csCorner"), n = cc.vv.gameNetMgr && cc.vv.gameNetMgr.conf || {};
if (null != t && t >= 0 && (t == n.caishen || null != n.caishen2 && n.caishen2 >= 0 && t == n.caishen2)) {
if (!i) {
var a = this.node.getChildByName("game"), s = a ? a.getChildByName("csCornerMeld") : null;
if (!s) return;
(i = cc.instantiate(s)).name = "csCorner";
e.addChild(i);
}
i.active = !0;
} else i && (i.active = !1);
}
},
_tightenMeld: function(e) {
for (var t = 0, i = 0; i < e.childrenCount; ++i) {
var n = e.children[i];
if ("gang" != n.name) {
n.x = 47 * t;
t++;
} else n.x = 47;
}
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
var a = cc.vv.gameNetMgr.getLocalIndex(t), s = cc.vv.mahjongmgr.getSide(a), o = cc.vv.mahjongmgr.getFoldPre(a);
console.log("onPengGangChanged" + a);
var r = this.node.getChildByName("game");
if (null != r) {
var c = r.getChildByName(s);
if (null != c) {
var l = c.getChildByName("penggangs");
if (null != l) {
for (var h = 0; h < l.childrenCount; ++h) l.children[h].active = !1;
var d = 0, u = e.angangs || [];
for (h = 0; h < u.length; ++h) {
var g = u[h];
this.initPengAndGangs(l, s, o, d, g, "angang");
d++;
}
for (u = e.diangangs || [], h = 0; h < u.length; ++h) {
g = u[h];
this.initPengAndGangs(l, s, o, d, g, "diangang");
d++;
}
for (u = e.wangangs || [], h = 0; h < u.length; ++h) {
g = u[h];
this.initPengAndGangs(l, s, o, d, g, "wangang");
d++;
}
var v = e.pengs || [];
for (h = 0; h < v.length; ++h) {
g = v[h];
var _ = e.pengTiles && e.pengTiles[h] || null;
this.initPengAndGangs(l, s, o, d, g, "peng", _);
d++;
}
var f = e.chis || [];
for (h = 0; h < f.length; ++h) {
this.initChis(l, s, o, d, f[h]);
d++;
}
}
}
}
}
}
},
initChis: function(e, t, i, n, a) {
var s = null;
if (e.childrenCount <= n) {
s = "left" == t || "right" == t ? cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft) : cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e.addChild(s);
!this._isZjlao() || "myself" != t && "up" != t || this._tightenMeld(s);
} else (s = e.children[n]).active = !0;
if ("left" == t) s.y = -75 * n; else if ("right" == t) {
s.y = 75 * n;
s.zIndex = -n;
} else s.x = "myself" == t ? this._isZjlao() ? 141 * n + 12 * n : 165 * n + 10 * n : this._isZjlao() ? -141 * n : -165 * n;
for (var o = s.getComponentsInChildren(cc.Sprite), r = 0, c = 0; c < o.length; ++c) {
var l = o[c];
if ("csCorner" != l.node.name) if ("gang" == l.node.name) {
l.node.active = !1;
this._setCaishenCorner(l.node, null);
} else {
var h = r < a.length ? a[r] : a[a.length - 1];
l.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(i, h);
this._setCaishenCorner(l.node, h);
r++;
}
}
},
initPengAndGangs: function(e, t, i, n, a, s, o) {
var r = null;
if (e.childrenCount <= n) {
r = "left" == t || "right" == t ? cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft) : cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e.addChild(r);
!this._isZjlao() || "myself" != t && "up" != t || this._tightenMeld(r);
} else (r = e.children[n]).active = !0;
if ("left" == t) r.y = -75 * n; else if ("right" == t) {
r.y = 75 * n;
r.zIndex = -n;
} else r.x = "myself" == t ? this._isZjlao() ? 141 * n + 12 * n : 165 * n + 10 * n : this._isZjlao() ? -141 * n : -165 * n;
for (var c = r.getComponentsInChildren(cc.Sprite), l = 0, h = 0; h < c.length; ++h) {
var d = c[h];
if ("csCorner" != d.node.name) if ("gang" == d.node.name) {
var u = "peng" != s;
d.node.active = u;
d.node.scaleX = 1;
d.node.scaleY = 1;
if ("angang" == s) {
d.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(t);
if ("myself" == t || "up" == t) {
d.node.scaleX = 1.4;
d.node.scaleY = 1.4;
}
} else d.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(i, a);
this._setCaishenCorner(d.node, u && "angang" != s ? a : null);
} else {
var g = "peng" == s && o && l < o.length ? o[l] : a;
d.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(i, g);
this._setCaishenCorner(d.node, g);
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
this.addBtnHandler("settings/btn_desk_bg");
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
if ("btn_agree" == t) cc.vv.net.send("dissolve_agree"); else if ("btn_reject" == t) cc.vv.net.send("dissolve_reject"); else if ("btn_desk_bg" == t) {
this.showSettings();
cc.vv.deskStyle && cc.vv.deskStyle.openBgChoose();
} else "btn_sqjsfj" == t && (cc.vv.gameNetMgr && "begin" == cc.vv.gameNetMgr.gamestate ? cc.vv.net.send("dissolve_request") : cc.vv.net.send("exit_release"));
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
SSSGame: [ function(e, t) {
"use strict";
cc._RF.push(t, "3509eI+XEhMD4tZLehq8WqQ", "SSSGame");
var i = [ "Spade", "Heart", "Club", "Diamond" ], n = [ "♠", "♥", "♣", "♦" ], a = [ "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K" ], s = {
head: 3,
mid: 5,
tail: 5
}, o = {
head: "头道",
mid: "中道",
tail: "尾道"
}, r = [ "tail", "mid", "head" ];
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {
if (cc.vv) {
this._leaving = !1;
this._playing = !1;
this._final = !1;
this._hand = [];
this._handSlotIds = [];
this._cards = [];
this._conf = null;
this._roads = {
head: [],
mid: [],
tail: []
};
this._confirmed = !1;
this._selectRoad = "tail";
this._frames = null;
this._leftSec = 0;
this._myUserId = cc.vv && cc.vv.userMgr ? cc.vv.userMgr.userId : 0;
this._n = {};
this._bindUI();
this._bindNet();
this._loadCards();
this.renderAll();
cc.vv.audioMgr && cc.vv.audioMgr.playBGM("bgFight.mp3");
this.schedule(this._tick, 1);
} else cc.director.loadScene("loading");
},
onDestroy: function() {
this.unschedule(this._tick);
if (this._tipTimer) {
clearTimeout(this._tipTimer);
this._tipTimer = null;
}
if (this._sio && this._sioListeners) {
this._sio.removeListener("exit_result", this._sioListeners.exit_result);
this._sio.removeListener("dispress_push", this._sioListeners.dispress_push);
this._sioListeners = null;
}
cc.vv && cc.vv.gameNetMgr && cc.vv.gameNetMgr.dataEventHandler == this.node && (cc.vv.gameNetMgr.dataEventHandler = null);
},
_find: function(e) {
for (var t = [ this.node ]; t.length; ) {
var i = t.pop();
if (i.name === e) return i;
for (var n = i.children, a = 0; a < n.length; ++a) t.push(n[a]);
}
console.log("[SSS] scene node missing:", e);
return null;
},
_labelOf: function(e) {
return e ? e.getComponent(cc.Label) : null;
},
_bindTap: function(e, t) {
if (e) {
e.on(cc.Node.EventType.TOUCH_START, function() {
e.setScale(.96, .96);
});
e.on(cc.Node.EventType.TOUCH_CANCEL, function() {
e.setScale(1, 1);
});
e.on(cc.Node.EventType.TOUCH_END, function() {
e.setScale(1, 1);
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("btnClick.mp3");
t && t();
});
}
},
_blockTouch: function(e) {
if (e) {
e.on(cc.Node.EventType.TOUCH_START, function() {});
e.on(cc.Node.EventType.TOUCH_END, function() {});
}
},
_bindUI: function() {
var e = this, t = this._n;
t.title = this._labelOf(this._find("titleLabel"));
t.tip = this._labelOf(this._find("tipLabel"));
t.countdown = this._labelOf(this._find("countdownLabel"));
t.progress = this._labelOf(this._find("progressLabel"));
t.oppRoot = this._find("oppRoot");
t.opps = [ this._find("opp0"), this._find("opp1"), this._find("opp2") ];
t.rows = {};
r.forEach(function(i) {
var n = e._find(i + "Row");
if (n) {
var a = n.getChildByName(i + "Label"), s = n.getChildByName(i + "Slots");
t.rows[i] = {
row: n,
label: e._labelOf(a),
labelNode: a,
slots: s ? s.children : []
};
}
});
var i = this._find("handRoot");
t.handSlots = i ? i.children : [];
t.btnAuto = this._find("btnAuto");
t.btnConfirm = this._find("btnConfirm");
t.btnReady = this._find("btnReady");
t.resultPanel = this._find("resultPanel");
t.resultLabel = t.resultPanel ? this._labelOf(t.resultPanel.getChildByName("resultLabel")) : null;
t.finalPanel = this._find("finalPanel");
t.finalLabel = t.finalPanel ? this._labelOf(t.finalPanel.getChildByName("finalLabel")) : null;
t.dissolvePanel = this._find("dissolvePanel");
t.confirmPanel = this._find("confirmPanel");
t.confirmLabel = t.confirmPanel ? this._labelOf(t.confirmPanel.getChildByName("confirmLabel")) : null;
this._bindTap(this._find("btnExit"), this.onExit.bind(this));
this._bindTap(this._find("btnDissolve"), this.onDissolve.bind(this));
this._bindTap(t.btnAuto, this.onAuto.bind(this));
this._bindTap(t.btnConfirm, this.onConfirm.bind(this));
this._bindTap(t.btnReady, this.onReady.bind(this));
if (t.resultPanel) {
this._blockTouch(t.resultPanel.getChildByName("dim"));
this._bindTap(t.resultPanel.getChildByName("btnResultReady"), function() {
t.resultPanel.active = !1;
e.onReady();
});
}
if (t.finalPanel) {
this._blockTouch(t.finalPanel.getChildByName("dim"));
this._bindTap(t.finalPanel.getChildByName("btnFinalExit"), this.leaveRoom.bind(this));
}
if (t.dissolvePanel) {
this._blockTouch(t.dissolvePanel.getChildByName("dim"));
this._bindTap(t.dissolvePanel.getChildByName("btnDsAgree"), function() {
cc.vv.net.send("dissolve_agree");
t.dissolvePanel.active = !1;
});
this._bindTap(t.dissolvePanel.getChildByName("btnDsReject"), function() {
cc.vv.net.send("dissolve_reject");
t.dissolvePanel.active = !1;
});
}
if (t.confirmPanel) {
this._blockTouch(t.confirmPanel.getChildByName("dim"));
this._bindTap(t.confirmPanel.getChildByName("btnCfOk"), function() {
var i = e._confirmOk;
t.confirmPanel.active = !1;
e._confirmOk = null;
i && i();
});
this._bindTap(t.confirmPanel.getChildByName("btnCfCancel"), function() {
t.confirmPanel.active = !1;
e._confirmOk = null;
});
}
for (var n = 0; n < t.handSlots.length; ++n) this._bindHandSlot(t.handSlots[n], n);
r.forEach(function(i) {
var n = t.rows[i];
if (n) for (var a = 0; a < n.slots.length; ++a) e._bindRoadSlot(n.slots[a], i, a);
});
},
_bindHandSlot: function(e, t) {
var i = this;
e && e.on(cc.Node.EventType.TOUCH_END, function() {
var e = i._handSlotIds[t];
if (!(null == e || e < 0)) {
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("select.mp3");
i.onTapHand(e);
}
});
},
_bindRoadSlot: function(e, t, i) {
var n = this;
e && e.on(cc.Node.EventType.TOUCH_END, function() {
var e = (n._roads[t] || [])[i];
if (null != e) {
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("select.mp3");
n.onTapRoadCard(t, e);
}
});
},
_confirm: function(e, t) {
if (this._n.confirmPanel) {
this._confirmOk = t;
this._n.confirmLabel && (this._n.confirmLabel.string = e || "");
this._n.confirmPanel.active = !0;
} else t && t();
},
_loadCards: function() {
var e = this;
cc.resources.load("images/atlas/cards", cc.SpriteAtlas, function(t, i) {
if (!t && i) {
e._frames = i;
e.renderAll();
} else console.log("[SSS] 牌图加载失败", t);
});
},
_frameOf: function(e) {
if (!this._frames) return null;
if (!((e = Number(e)) >= 0 && e < 52)) return null;
var t = Math.floor(e / 13), n = i[t] + a[e % 13];
return this._frames.getSpriteFrame(n + ".png") || this._frames.getSpriteFrame(n) || this._frames.getSpriteFrame("card_back.png");
},
_cardName: function(e) {
e = Number(e);
var t = Math.floor(e / 13);
return n[t] + a[e % 13];
},
_bindNet: function() {
var e = cc.vv.gameNetMgr, t = this;
this.node.on("sss_start", function(e) {
t.applyStart(e && e.detail);
});
this.node.on("sss_arrange_ok", function(e) {
t.onArrangeOk(e && e.detail);
});
this.node.on("sss_ready", function(e) {
t.onSssReady(e && e.detail);
});
this.node.on("sss_error", function(e) {
t.showTip(e && e.detail && e.detail.msg || "操作失败");
});
this.node.on("sss_result", function(e) {
t.onResult(e && e.detail);
});
this.node.on("game_over", function() {
t._refreshSeats();
});
this.node.on("game_end", function(e) {
t.onGameEnd(e && e.detail);
});
this.node.on("game_num", function() {
t._refreshTitle();
});
this.node.on("user_state_changed", function() {
t._refreshSeats();
});
this.node.on("new_user", function() {
t._refreshSeats();
});
this.node.on("dissolve_notice", function() {
t._n.dissolvePanel && (t._n.dissolvePanel.active = !0);
});
this.node.on("dissolve_cancel", function() {
t._n.dissolvePanel && (t._n.dissolvePanel.active = !1);
});
this.node.on("exit_result", function() {
t.leaveRoom();
});
this.node.on("dispress_push", function() {
t.leaveRoom();
});
this.node.on("kick_offline", function() {
t.leaveRoom();
});
var i = cc.vv.net ? cc.vv.net.sio : null;
if (i) {
var n = function() {
t.leaveRoom();
}, a = function() {
t.leaveRoom();
};
i.on("exit_result", n);
i.on("dispress_push", a);
this._sio = i;
this._sioListeners = {
exit_result: n,
dispress_push: a
};
}
e.dataEventHandler = this.node;
!this._playing && e.sssStart && this.applyStart(e.sssStart, !0);
},
applyStart: function(e) {
if (e) {
this._playing = !0;
this._final = !1;
this._confirmed = !!e.confirmed;
this._selectRoad = "tail";
this._conf = e.conf || this._conf;
this._cards = (e.myCards || []).slice();
this._roads = {
head: [],
mid: [],
tail: []
};
var t = {};
if (e.arrange) {
var i = this;
r.forEach(function(n) {
for (var a = e.arrange[n] || [], s = 0; s < a.length; ++s) {
i._roads[n].push(Number(a[s]));
t[Number(a[s])] = !0;
}
});
}
this._hand = this._cards.filter(function(e) {
return !t[e];
}).sort(function(e, t) {
return e - t;
});
this._confirmed ? this._leftSec = 0 : this._leftSec = null != e.arrangeSeconds ? e.arrangeSeconds : this._conf && this._conf.arrangeTimeout || 30;
this._n.resultPanel && (this._n.resultPanel.active = !1);
this._n.finalPanel && (this._n.finalPanel.active = !1);
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("deal.mp3");
this.showTip("");
this.renderAll();
}
},
onArrangeOk: function(e) {
if (e) {
this._roads = {
head: (e.head || []).map(Number),
mid: (e.mid || []).map(Number),
tail: (e.tail || []).map(Number)
};
var t = {}, i = this;
r.forEach(function(e) {
i._roads[e].forEach(function(e) {
t[e] = !0;
});
});
this._hand = this._cards.filter(function(e) {
return !t[e];
});
if (e.auto) {
this._confirmed = !0;
this._leftSec = 0;
this.showTip("已自动摆牌并确定");
}
this.renderAll();
}
},
onSssReady: function() {
this._refreshSeats();
},
onResult: function(e) {
if (e) {
this._playing = !1;
this._leftSec = 0;
this._refreshSeats();
for (var t = [], i = e.results || [], n = 0, a = 0; a < i.length; ++a) {
var s = i[a];
if (s) {
s.userid == this._myUserId && (n = s.delta || 0);
var o = s.arrange ? s.arrange.head : [], r = s.arrange ? s.arrange.mid : [], c = s.arrange ? s.arrange.tail : [], l = "";
s.special && (l += " 【" + s.special + "】");
s.invalid && (l += " 【倒水】");
s.gun > 0 && (l += " 打枪×" + s.gun);
s.quanleida && (l += " 全垒打");
var h = s.delta || 0;
t.push((s.name || "玩家" + (s.seatindex + 1)) + l + "  " + (h >= 0 ? "+" : "") + h);
t.push("  头: " + this._cardsText(o) + "   中: " + this._cardsText(r) + "   尾: " + this._cardsText(c));
}
}
this._n.resultLabel && (this._n.resultLabel.string = t.join("\n"));
this._n.resultPanel && (this._n.resultPanel.active = !0);
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX(n >= 0 ? "win.mp3" : "lose.mp3");
this.renderAll();
}
},
onGameEnd: function(e) {
for (var t = [], i = e && e.endinfo || [], n = 0; n < i.length; ++n) {
var a = i[n], s = a.score || 0;
t.push((a.name || "玩家") + "   " + (s >= 0 ? "+" : "") + s);
}
this._n.finalLabel && (this._n.finalLabel.string = t.join("\n"));
this._n.resultPanel && (this._n.resultPanel.active = !1);
this._n.finalPanel && (this._n.finalPanel.active = !0);
this._playing = !1;
this._final = !0;
this.renderAll();
},
_cardsText: function(e) {
for (var t = [], i = 0; i < (e || []).length; ++i) t.push(this._cardName(e[i]));
return t.length ? t.join(" ") : "-";
},
_refreshTitle: function() {
if (this._n.progress) {
var e = cc.vv.gameNetMgr, t = e && e.conf || this._conf || {}, i = "底分 " + (t.baseScore || 1) + "   第" + (e && e.numOfGames || 0) + "/" + (t.maxGames || "-") + " 局";
this._n.progress.string = i;
}
},
_refreshSeats: function() {
var e = cc.vv.gameNetMgr;
if (e && e.seats && this._n.opps) {
for (var t = [], i = 0; i < e.seats.length; ++i) {
var n = e.seats[i];
n && n.userid > 0 && n.userid != this._myUserId && t.push(n);
}
for (var a = t.length <= 1 ? [ 1 ] : 2 === t.length ? [ 0, 2 ] : [ 0, 1, 2 ], s = 0; s < this._n.opps.length; ++s) {
var o = this._n.opps[s];
if (o) {
var r = a.indexOf(s), c = r >= 0 ? t[r] : null;
o.active = !!c;
if (c) {
var l = this._labelOf(o.getChildByName("name")), h = this._labelOf(o.getChildByName("state")), d = e.sssConfirmed && e.sssConfirmed[c.userid], u = this._playing ? d ? "已确定摆牌" : "摆牌中..." : c.ready ? "已准备" : "未准备";
l && (l.string = (c.name || "玩家") + (!1 === c.online ? "(离线)" : ""));
h && (h.string = u + "   分:" + (c.score || 0));
}
}
}
this._refreshTitle();
}
},
renderAll: function() {
this._renderHand();
this._renderRoads();
this._refreshSeats();
this._refreshButtons();
this._refreshCountdown();
},
_renderHand: function() {
for (var e = this._n.handSlots || [], t = this._hand.length, i = Math.floor((13 - t) / 2), n = 0; n < e.length; ++n) {
var a = e[n], s = n >= i && n < i + t ? this._hand[n - i] : null;
this._handSlotIds[n] = null == s ? -1 : s;
if (a) {
a.active = null != s;
if (null != s) {
var o = a.getChildByName("card"), r = o ? o.getComponent(cc.Sprite) : null;
r && (r.spriteFrame = this._frameOf(s));
}
}
}
},
_renderRoads: function() {
var e = this;
r.forEach(function(t) {
var i = e._n.rows && e._n.rows[t];
if (i) {
var n = s[t], a = e._roads[t] || [];
i.label && (i.label.string = o[t] + " " + a.length + "/" + n);
i.labelNode && (i.labelNode.color = e._selectRoad == t ? cc.color(255, 226, 130) : cc.color(190, 235, 215));
for (var r = 0; r < i.slots.length; ++r) {
var c = i.slots[r], l = r < a.length, h = c.getChildByName("empty"), d = c.getChildByName("card");
h && (h.active = !l);
if (d) {
d.active = l;
if (l) {
var u = d.getComponent(cc.Sprite);
u && (u.spriteFrame = e._frameOf(a[r]));
}
}
}
}
});
},
_refreshButtons: function() {
var e = this._playing, t = this._confirmed;
this._n.btnAuto && (this._n.btnAuto.active = e && !t);
this._n.btnConfirm && (this._n.btnConfirm.active = e && !t);
this._n.btnReady && (this._n.btnReady.active = !e);
},
_refreshCountdown: function() {
this._n.countdown && (this._playing ? this._confirmed ? this._n.countdown.string = "已确定" : this._n.countdown.string = "摆牌剩余 " + Math.max(0, this._leftSec) + "s" : this._n.countdown.string = "");
},
_tick: function() {
if (this._playing && !this._confirmed) {
this._leftSec > 0 && this._leftSec--;
this._refreshCountdown();
}
},
showTip: function(e) {
if (this._n.tip) {
this._n.tip.string = e || "";
if (this._tipTimer) {
clearTimeout(this._tipTimer);
this._tipTimer = null;
}
if (e) {
var t = this;
this._tipTimer = setTimeout(function() {
t._n.tip && (t._n.tip.string = "");
}, 2500);
}
}
},
_nextRoad: function() {
return this._roads.tail.length < s.tail ? "tail" : this._roads.mid.length < s.mid ? "mid" : this._roads.head.length < s.head ? "head" : null;
},
onTapHand: function(e) {
if (this._playing && !this._confirmed) {
var t = this._nextRoad();
if (t) {
var i = this._hand.indexOf(e);
if (!(i < 0)) {
this._hand.splice(i, 1);
this._roads[t].push(e);
this._selectRoad = this._nextRoad() || "head";
this.renderAll();
}
} else this.showTip("已摆满三道了");
}
},
onTapRoadCard: function(e, t) {
if (this._playing && !this._confirmed) {
var i = this._roads[e], n = i.indexOf(t);
if (!(n < 0)) {
i.splice(n, 1);
this._hand.push(t);
this._hand.sort(function(e, t) {
return e - t;
});
this._selectRoad = e;
this.renderAll();
}
}
},
onAuto: function() {
if (this._playing && !this._confirmed) {
cc.vv.net.send("sss_arrange", {
auto: !0
});
this.showTip("正在自动摆牌...");
}
},
onConfirm: function() {
if (this._playing && !this._confirmed) if (this._hand.length > 0) this.showTip("请把 13 张牌全部摆到三道中"); else {
cc.vv.net.send("sss_arrange", {
head: this._roads.head,
mid: this._roads.mid,
tail: this._roads.tail
});
this._confirmed = !0;
this.showTip("已提交摆牌,等待其他玩家");
this.renderAll();
}
},
onReady: function() {
var e = cc.vv && cc.vv.gameNetMgr;
if (e && e.maxNumOfGames > 0 && e.numOfGames >= e.maxNumOfGames) this.showTip("已是最后一局"); else {
cc.vv.net.send("ready");
this.showTip("已准备,等待其他玩家");
this._n.btnReady && (this._n.btnReady.active = !1);
}
},
onExit: function() {
var e = this;
if (this._final) {
cc.vv.net.send("leave_room");
setTimeout(function() {
e.leaveRoom();
}, 500);
} else this._confirm("是否确定退出房间?", function() {
cc.vv.net.send("exit");
setTimeout(function() {
if (cc.isValid(e.node) && !e._leaving) {
cc.vv.gameNetMgr.clearRoomState && cc.vv.gameNetMgr.clearRoomState();
e.leaveRoom();
}
}, 2e3);
});
},
onDissolve: function() {
var e = this;
this._confirm("解散房间将结束本局,是否确定解散?", function() {
if ("begin" == cc.vv.gameNetMgr.gamestate) {
cc.vv.net.send("dissolve_request");
e.showTip("已发起解散申请,等待其他玩家响应");
} else cc.vv.net.send("dispress");
});
},
leaveRoom: function() {
if (!this._leaving) {
this._leaving = !0;
var e = cc.director.getScene ? cc.director.getScene() : null, t = e && e.name ? e.name : "";
"hall" !== t && "club" !== t && (cc.vv.fromClub || cc.vv.fromClubId ? cc.director.loadScene("club") : cc.director.loadScene("hall"));
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
_ncSprite: null,
_ncLblName: null,
_ncLblScore: null,
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
this._voicemsg && (this._voicemsg.active = !1);
this._sprIcon && this._sprIcon.getComponent(cc.Button) && cc.vv.utils.addClickEvent(this._sprIcon, this.node, "Seat", "onIconClicked");
this._offline = this.node.getChildByName("offline");
this._ready = this.node.getChildByName("ready");
this._zhuang = this.node.getChildByName("zhuang");
this._zhuang && (this._zhuang.active = !1);
this._scoreBg = this.node.getChildByName("Z_money_frame");
this._nddayingjia = this.node.getChildByName("dayingjia");
this._ncSprite = this.node.getChildByName("ncSprite");
if (this._ncSprite) {
var t = this._ncSprite.getChildByName("name"), i = this._ncSprite.getChildByName("score");
this._ncLblName = t ? t.getComponent(cc.Label) : null;
this._ncLblScore = i ? i.getComponent(cc.Label) : null;
this._ncSprite.active = !1;
}
this._chatBubble = this.node.getChildByName("ChatBubble");
if (null != this._chatBubble) {
this._chatBubble.active = !1;
var n = this._chatBubble.getChildByName("New Label");
n && (n.active = !1);
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
if (this._ncSprite) {
var e = null != this._userName && "" !== this._userName;
this._ncSprite.active = e;
this._ncLblName && (this._ncLblName.string = this._userName || "");
this._ncLblScore && (this._ncLblScore.string = null != this._score ? this._score : 0);
}
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
var s = t.addComponent(cc.Label);
s.fontSize = 18;
s.lineHeight = 22;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.overflow = cc.Label.Overflow.NONE;
t.color = cc.color(255, 225, 120);
var o = t.addComponent(cc.LabelOutline);
o.color = cc.color(60, 30, 0);
o.width = 2;
}
var r = null != e && e >= 1;
t.active = r;
if (r) {
var c = t.getComponent(cc.Label);
c && (c.string = "老庄" + e);
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
if (null != this._chatBubble) {
this._chatBubble.active = !0;
this._emoji.active = !1;
var t = this._chatBubble.getChildByName("New Label");
if (t) {
t.active = !0;
var i = t.getComponent(cc.Label);
if (i) {
i.string = e;
i.node.color = cc.color(255, 255, 255, 255);
}
}
var n = this._chatBubble.getChildByName("chatbg_ld");
if (n) {
n.active = !0;
var a = n.getComponent(cc.Sprite);
a && !a.spriteFrame && cc.loader.loadRes("images/chat/chat_backbg", cc.SpriteFrame, function(e, t) {
!e && a && (a.spriteFrame = t);
});
}
this._lastChatTime = 3;
}
},
emoji: function(e) {
if (null != this._emoji) {
this._chatBubble.active = !1;
this._emoji.active = !0;
this._emoji.getComponent(cc.Animation).play(e);
this._lastChatTime = 3;
}
},
voiceMsg: function(e) {
this._voicemsg && (this._voicemsg.active = e);
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
var s = this._userinfo.getChildByName("sex_female");
s.active = !1;
var o = this._userinfo.getChildByName("sex_male");
o.active = !1;
1 == n ? o.active = !0 : 2 == n && (s.active = !0);
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
clubAdmin: [ function(e, t) {
"use strict";
cc._RF.push(t, "bb029EoXlRIfa6VfmdJvO7U", "clubAdmin");
var i = {
"/club_overview": "/club_admin/overview",
"/club_members_detail": "/club_admin/members",
"/partners": "/club_admin/partners",
"/rewards": "/club_admin/rewards",
"/club_game_configs": "/club_admin/game_configs",
"/partner/gems": "/club_admin/partner_gems",
"/partner/ratio": "/club_admin/partner_ratio",
"/partner/profit": "/club_admin/partner_profit",
"/partner/bean_logs": "/club_admin/partner_bean_logs",
"/club_member/add": "/club_admin/member_add",
"/club_member/delete": "/club_admin/member_delete",
"/club_member/kick": "/club_admin/member_kick",
"/club_member/records": "/club_admin/member_records",
"/club_member/bean_logs": "/club_admin/member_bean_logs",
"/club_member/set_partner": "/club_admin/member_set_partner"
};
function n(e, t, n) {
var a = t || {};
cc.vv && cc.vv.userMgr && cc.vv.userMgr.account && (a.account = cc.vv.userMgr.account);
a.sign || (a.sign = "1");
if (null == a.club_id && null == a.clubid) {
var s = cc.vv && cc.vv.adminClubId ? parseInt(cc.vv.adminClubId) : 0;
s > 0 || (s = parseInt(cc.sys.localStorage.getItem("admin_club_id")) || 0);
s > 0 && (a.club_id = s);
}
var o, r = e;
if (o = /^\/partner\/(\d+)$/.exec(e)) {
a.partner_id = o[1];
r = "/club_admin/partner_delete";
} else if (o = /^\/club_game_config\/(\d+)\/close$/.exec(e)) {
a.id = o[1];
r = "/club_admin/game_config_close";
} else if (o = /^\/club_game_config\/(\d+)\/delete$/.exec(e)) {
a.id = o[1];
r = "/club_admin/game_config_delete";
} else if (o = /^\/club_game_config\/(\d+)$/.exec(e)) {
a.id = o[1];
r = "/club_admin/game_config_update";
} else r = "/club_game_config" === e ? "/club_admin/game_config_save" : i[e] || e;
cc.vv.http.sendRequest(r, a, n);
}
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {
this._clubId = this._resolveClubId();
this._clubName = "";
this._currentPage = "overview";
this._members = [];
this._partners = [];
this._gameConfigs = [];
this._allGameTypes = [];
this._selectedGameType = "";
this._clubTables = [];
this._rewards = [];
this._overview = {};
this._bindUI();
this._loadClubInfo();
},
_find: function(e, t) {
if ((t = t || this.node).name === e) return t;
for (var i = t.children, n = 0; n < i.length; n++) {
var a = this._find(e, i[n]);
if (a) return a;
}
return null;
},
_bindUI: function() {
var e = this;
this._clubInfoLabel = this._find("clubInfo");
this._myGemsLabel = this._find("myGems");
var t = this._find("closeBtn");
t && t.on(cc.Node.EventType.TOUCH_END, function() {
if (e._clubId > 0) {
cc.vv.fromClubId = e._clubId;
cc.vv.fromClub = !0;
}
cc.director.loadScene("club");
});
this._menuBtns = {};
for (var i = [ "overview", "member", "partner", "partnerStats", "reward", "gameConfig", "operationLog" ], n = 0; n < i.length; n++) (function(t) {
var i = e._find("menu_" + t);
if (i) {
e._menuBtns[t] = i;
i.on(cc.Node.EventType.TOUCH_END, function() {
e._showPage(t);
});
}
})(i[n]);
this._pages = {};
for (var a = 0; a < i.length; a++) {
var s = this._find(i[a] + "Page");
s && (this._pages[i[a]] = s);
}
this._bindOverviewPage();
this._bindMemberPage();
this._bindPartnerPage();
this._bindPartnerStatsPage();
this._bindRewardPage();
this._bindGameConfigPage();
this._bindPopups();
this._showPage("overview", !0);
},
_resolveClubId: function() {
var e = cc.vv && cc.vv.adminClubId ? parseInt(cc.vv.adminClubId) : 0;
e > 0 || (e = parseInt(cc.sys.localStorage.getItem("admin_club_id")) || 0);
return e > 0 ? e : 0;
},
_bindOverviewPage: function() {
var e = [ "今日累收", "昨日累收", "前日累收", "当日实收", "昨日实收", "前日实收", "当日人次", "昨日人次", "前日人次", "整链总乐豆", "总人数" ];
this._overviewLabels = {};
for (var t = 0; t < e.length; t++) {
var i = this._find("card_" + t);
if (i) {
var n = i.getChildByName("value");
n && (this._overviewLabels[e[t]] = n);
}
}
},
_renderOverview: function() {
var e = this._overview;
(e.club_name || e.club_id) && this._clubInfoLabel && (this._clubInfoLabel.getComponent(cc.Label).string = (e.club_name || "未命名俱乐部") + "  (ID:" + (e.club_id || this._clubId || 0) + ")");
this._myGemsLabel && (this._myGemsLabel.getComponent(cc.Label).string = "我的豆豆: " + (e.my_gems || 0));
this._setOverviewLabel("今日累收", e.today_rake || 0);
this._setOverviewLabel("昨日累收", e.yesterday_rake || 0);
this._setOverviewLabel("前日累收", e.before_yesterday_rake || 0);
this._setOverviewLabel("当日实收", void 0 !== e.today_net ? e.today_net : e.today_rake || 0);
this._setOverviewLabel("昨日实收", void 0 !== e.yesterday_net ? e.yesterday_net : e.yesterday_rake || 0);
this._setOverviewLabel("前日实收", void 0 !== e.before_yesterday_net ? e.before_yesterday_net : e.before_yesterday_rake || 0);
this._setOverviewLabel("当日人次", e.today_rounds || 0);
this._setOverviewLabel("昨日人次", e.yesterday_rounds || 0);
this._setOverviewLabel("前日人次", e.before_yesterday_rounds || 0);
this._setOverviewLabel("整链总乐豆", e.total_gems || 0);
this._setOverviewLabel("总人数", e.member_count || 0);
},
_setOverviewLabel: function(e, t) {
this._overviewLabels[e] && (this._overviewLabels[e].getComponent(cc.Label).string = String(t));
},
_bindMemberPage: function() {
var e = this, t = this._pages.member;
if (t) {
var i = t.getChildByName("addBtn");
i && i.on(cc.Node.EventType.TOUCH_END, function() {
e._showAddMemberDialog();
});
this._memberSearch = t.getChildByName("searchBox");
var n = t.getChildByName("searchBtn");
n && n.on(cc.Node.EventType.TOUCH_END, function() {
e._renderMembers();
});
var a = t.getChildByName("memberScroll");
a && (this._memberContent = a.getChildByName("content"));
}
},
_clearList: function(e, t) {
for (var i = e.children.length - 1; i >= 0; i--) {
var n = e.children[i];
if (n !== t) {
n.removeFromParent();
n.destroy();
}
}
},
_renderMembers: function() {
var e = this._memberContent;
if (e) {
var t = e.getChildByName("rowTpl");
this._clearList(e, t);
if (t) {
t.active = !1;
var i = this._memberSearch ? this._memberSearch.getComponent(cc.EditBox).string : "", n = this._members;
i && (n = this._members.filter(function(e) {
return String(e.userid).indexOf(i) >= 0 || e.name && e.name.indexOf(i) >= 0;
}));
for (var a = 0; a < n.length; a++) {
var s = n[a], o = this._createMemberRow(t, s);
if (o) {
o.parent = e;
o.active = !0;
}
}
}
}
},
_createMemberRow: function(e, t) {
if (!e) return null;
var i = cc.instantiate(e);
i.name = "member_" + t.userid;
this._setAvatar(i, "avatar", t.headimg, t.userid);
this._setLabel(i, "name", t.name || "未知");
this._setLabel(i, "uid", "ID:" + t.userid);
this._setLabel(i, "gems", String(t.gems || 0));
var n = this, a = {
btn_del: "delete",
btn_kick: "kick",
btn_records: "records",
btn_beans: "beanLogs",
btn_partner: "setPartner",
btn_addgems: "addGems"
};
for (var s in a) (function(e) {
var a = i.getChildByName(s);
a && a.on(cc.Node.EventType.TOUCH_END, function() {
n._onMemberAction(e, t);
});
})(a[s]);
return i;
},
_setLabel: function(e, t, i) {
var n = e.getChildByName(t);
if (n) {
var a = n.getComponent(cc.Label);
a && (a.string = i);
}
},
_ratioText: function(e) {
function t(e) {
return Number(e) || 0;
}
return t(e.profit_ratio) + "/" + t(e.hidden_profit_ratio) + "/" + t(e.fee_profit_ratio);
},
_setRatioLabel: function(e, t) {
var i = e.getChildByName("ratio");
if (i) {
var n = i.getComponent(cc.Label);
if (n) {
n.overflow = cc.Label.Overflow.SHRINK;
n.string = t;
}
}
},
_setAvatar: function(e, t, i, n) {
var a = e.getChildByName(t);
if (a && a.getComponent(cc.Sprite)) {
var s = a.getComponent("ImageLoader") || a.addComponent("ImageLoader");
if (i && n > 0) {
var o = /^avatar_\d{1,3}$/.test(i);
null == cc.vv.baseInfoMap && (cc.vv.baseInfoMap = {});
cc.vv.baseInfoMap[n] = {
localKey: o ? i : null,
url: o ? null : i + ".jpg",
ts: Date.now()
};
s.setUserID(n);
} else s.clearAvatar();
}
},
_onMemberAction: function(e, t) {
var i = this, a = t.userid, s = this._clubId;
"delete" === e ? this._confirm("确定删除成员 " + t.name + "?", function() {
n("/club_member/delete", {
club_id: s,
userid: a
}, function(e) {
e && 0 === e.errcode && i._loadMembers();
});
}) : "kick" === e ? this._confirm("确定踢出成员 " + t.name + "?", function() {
n("/club_member/kick", {
club_id: s,
userid: a
}, function(e) {
e && 0 === e.errcode && i._loadMembers();
});
}) : "records" === e ? this._showMemberRecords(t) : "beanLogs" === e ? this._showMemberBeanLogs(t) : "addGems" === e ? this._showMemberGemsDialog(t) : "setPartner" === e && this._confirm("将 " + t.name + " 设为合伙人?", function() {
n("/club_member/set_partner", {
club_id: s,
userid: a
}, function(e) {
if (e && 0 === e.errcode) {
i._loadPartners();
i._loadMembers();
}
});
});
},
_bindPartnerPage: function() {
var e = this, t = this._pages.partner;
if (t) {
var i = t.getChildByName("addPartnerBtn");
i && i.on(cc.Node.EventType.TOUCH_END, function() {
e._showAddPartnerDialog();
});
var n = t.getChildByName("partnerScroll");
if (n) {
this._partnerScroll = n;
this._partnerContent = n.getChildByName("content");
this._partnerSv = n.getComponent(cc.ScrollView);
}
if (this._partnerContent) {
var a = this._partnerContent.getComponent(cc.Widget);
a && (a.enabled = !1);
this._partnerLayout = this._partnerContent.getComponent(cc.Layout);
this._partnerContent.anchorX = .5;
this._partnerContent.anchorY = 1;
}
}
},
_refreshPartnerScroll: function() {
if (this._partnerContent && this._partnerScroll) {
this._partnerLayout && this._partnerLayout.updateLayout();
this._partnerContent.setPosition(0, this._partnerScroll.height / 2);
this._partnerSv && this._partnerSv.node.activeInHierarchy && this._partnerSv.scrollToTop(.01);
var e = this._partnerStatsContent, t = this._partnerStatsScroll || this._pages.partnerStats && this._pages.partnerStats.getChildByName("statsScroll");
if (e && t) {
this._partnerStatsLayout || (this._partnerStatsLayout = e.getComponent(cc.Layout));
this._partnerStatsSv || (this._partnerStatsSv = t.getComponent(cc.ScrollView));
this._partnerStatsScroll = t;
this._partnerStatsLayout && this._partnerStatsLayout.updateLayout();
e.setPosition(0, t.height / 2);
this._partnerStatsSv && this._partnerStatsSv.node.activeInHierarchy && this._partnerStatsSv.scrollToTop(.01);
}
}
},
_renderPartners: function() {
var e = this._partnerContent;
console.log("[partnerPage render] content=", !!e, "_partners.length=", this._partners.length, "this._partnerContent=", !!this._partnerContent);
if (e) {
var t = e.getChildByName("rowTpl");
this._clearList(e, t);
if (t) {
t.active = !1;
var i = this._partners.filter(function(e) {
return 1 === (e.level || 1);
});
console.log("[partnerPage render] direct children count=", i.length, "of total=", this._partners.length);
for (var n = 0; n < i.length; n++) {
var a = i[n], s = this._createPartnerRow(t, a);
if (s) {
s.parent = e;
s.active = !0;
}
}
var o = e.getComponent(cc.Layout);
o && o.updateLayout();
this._partnerContent.setPosition(0, this._partnerScroll.height / 2);
this._partnerSv && this._partnerSv.scrollToTop(.01);
e.getPosition();
console.log("[partnerPage render] done, content.children=" + e.children.length + " contentSize=" + e.width + "x" + e.height);
}
}
},
_createPartnerRow: function(e, t) {
if (!e) return null;
var i = cc.instantiate(e);
i.name = "partner_" + t.id;
var n = t.owner_name ? t.owner_name + "(" + t.owner_userid + ")" : "";
this._setAvatar(i, "avatar", t.headimg, t.owner_userid);
this._setLabel(i, "name", t.name || "未命名");
this._setLabel(i, "uid", n || "ID:" + t.id);
this._setLabel(i, "members", String(t.member_count || 0));
this._setLabel(i, "gems", String(Number(t.total_gems) || 0));
this._setRatioLabel(i, this._ratioText(t));
var a = this, s = {
btn_gems: "gems",
btn_ratio: "ratio",
btn_profit: "profit",
btn_del: "delete"
};
for (var o in s) (function(e) {
var n = i.getChildByName(o);
n && n.on(cc.Node.EventType.TOUCH_END, function(i) {
i.stopPropagation && i.stopPropagation();
a._onPartnerAction(e, t);
});
})(s[o]);
var r = i.getChildByName("btn_sub");
r && r.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation && e.stopPropagation();
a._showPartnerChildrenDialog(t);
});
return i;
},
_onPartnerAction: function(e, t) {
var i = this, a = this._clubId, s = t.id;
"gems" === e ? this._showPartnerGemsDialog(t) : "ratio" === e ? this._showPartnerRatioDialog(t) : "profit" === e ? this._showPartnerProfitDialog(t) : "delete" === e && this._confirm("确定删除合伙人 " + t.name + "?", function() {
n("/partner/" + s, {
club_id: a
}, function(e) {
e && 0 === e.errcode && i._loadPartners();
});
});
},
_bindPartnerStatsPage: function() {
var e = this._pages.partnerStats;
if (e) {
var t = e.getChildByName("statsScroll");
if (t) {
var i = t.getChildByName("content");
if (i) {
this._partnerStatsContent = i;
var n = i.getComponent(cc.Widget);
n && (n.enabled = !1);
i.anchorX = .5;
i.anchorY = 1;
i.setPosition(0, t.height / 2);
var a = t.getComponent(cc.ScrollView);
a && (a.content = i);
}
}
}
},
_renderPartnerStats: function() {
var e = this._partnerStatsContent;
if (e) {
var t = e.getChildByName("rowTpl");
this._clearList(e, t);
if (t) {
t.active = !1;
for (var i = this, n = this._partners.filter(function(e) {
return 1 === (e.level || 1);
}), a = 0; a < n.length; a++) {
var s = n[a], o = cc.instantiate(t);
o.name = "stats_" + s.id;
o.active = !0;
o.parent = e;
this._setAvatar(o, "avatar", s.headimg, s.owner_userid);
var r = s.owner_name || "未命名";
this._setLabel(o, "name", s.name || "-");
this._setLabel(o, "uid", r + "(" + s.owner_userid + ")");
this._setLabel(o, "members", String(s.member_count || 0));
this._setLabel(o, "gems", String(Number(s.total_gems) || 0));
this._setRatioLabel(o, this._ratioText(s));
this._setLabel(o, "rake", String(Number(s.today_rake) || 0));
this._setLabel(o, "profit", String(Number(s.today_partner_profit) || 0));
this._setLabel(o, "total", String(Number(s.total_partner_profit) || 0));
var c = o.getChildByName("btn_detail");
c && function(e) {
c.on(cc.Node.EventType.TOUCH_END, function() {
i._showPartnerBeanLogs(e);
});
}(s);
var l = o.getChildByName("btn_sub");
l && function(e) {
l.on(cc.Node.EventType.TOUCH_END, function() {
i._showPartnerChildrenDialog(e);
});
}(s);
}
var h = e.getComponent(cc.Layout);
h && h.updateLayout();
}
}
},
_bindRewardPage: function() {
var e = this._pages.reward;
if (e) {
var t = e.getChildByName("rewardScroll");
if (t) {
var i = t.getChildByName("content");
if (i) {
this._rewardScroll = t;
this._rewardSv = t.getComponent(cc.ScrollView);
this._rewardContent = i;
var n = i.getComponent(cc.Layout);
if (!n) {
(n = i.addComponent(cc.Layout)).type = cc.Layout.Type.VERTICAL;
n.paddingTop = 10;
n.spacingY = 16;
}
n.resizeMode = cc.Layout.ResizeMode.CONTAINER;
n.verticalDirection = cc.Layout.VerticalDirection.TOP_TO_BOTTOM;
i.anchorX = .5;
i.anchorY = 1;
i.setPosition(0, t.height / 2);
this._rewardLayout = n;
this._rewardSv && (this._rewardSv.content = i);
}
}
}
},
_renderRewards: function() {
var e = this._rewardContent;
if (e) {
var t = e.getChildByName("rowTpl");
this._clearList(e, t);
if (t) {
t.active = !1;
for (var i = 0; i < this._rewards.length; i++) {
var n = this._rewards[i], a = this._createRewardRow(t, n);
if (a) {
a.parent = e;
a.active = !0;
}
}
this._refreshRewardScroll();
}
}
},
_refreshRewardScroll: function() {
if (this._rewardContent) {
this._rewardLayout && this._rewardLayout.updateLayout();
this._rewardScroll && this._rewardContent.setPosition(0, this._rewardScroll.height / 2);
this._rewardSv && this._rewardSv.node.activeInHierarchy && this._rewards.length > 0 && this._rewardSv.scrollToTop(.01);
}
},
_createRewardRow: function(e, t) {
if (!e) return null;
var i = cc.instantiate(e);
i.name = "reward_" + t.id;
this._setLabel(i, "type", this._rewardTypeName(t.reward_type));
this._setLabel(i, "amount", String(Number(t.amount) || 0));
this._setLabel(i, "game", this._rewardGameName(t));
this._setLabel(i, "room", String(t.roomid || 0));
this._setLabel(i, "date", new Date(1e3 * t.create_time).toLocaleString());
return i;
},
_rewardTypeName: function(e) {
var t = String(e || "");
return t ? "游戏奖励" === t ? "合伙人分成" : t : "其他";
},
_rewardGameName: function(e) {
var t = e && e.table_name ? String(e.table_name) : "";
if (t) return t;
var i = e ? e.game_type : "", n = this._gameTypeName(i);
if (n && n !== i) return n;
var a = String(i || "");
return 0 === a.indexOf("baobao_mian") ? "六宝免摆" : 0 === a.indexOf("baobao_shou") ? "六宝手动" : 0 === a.indexOf("baobao") ? "六宝" : n || "-";
},
_bindGameConfigPage: function() {
var e = this, t = this._pages.gameConfig;
if (t) {
this._gameTypeList = t.getChildByName("typeList");
this._gameConfigList = t.getChildByName("configList");
var i = t.getChildByName("newBtn");
i && i.on(cc.Node.EventType.TOUCH_END, function() {
e._showGameConfigDialog(null, e._selectedGameType);
});
}
},
_renderGameConfigs: function() {
var e = this._gameConfigList;
if (e) {
this._renderGameTypes();
var t = e.getChildByName("configRowTpl");
this._clearList(e, t);
if (t) {
t.active = !1;
for (var i = 0; i < this._clubTables.length; i++) {
var n = this._clubTables[i];
if (String(n.game_type) === String(this._selectedGameType)) {
var a = this._createTableRow(t, n);
if (a) {
a.parent = e;
a.active = !0;
}
}
}
}
}
},
_renderGameTypes: function() {
var e = this._gameTypeList;
if (e) {
var t = e.getChildByName("typeTpl");
this._clearList(e, t);
if (t) {
t.active = !1;
for (var i = this, n = {}, a = [], s = 0; s < this._gameConfigs.length; s++) {
var o = String(this._gameConfigs[s].game_type || "");
if (o && !n[o]) {
n[o] = !0;
a.push(o);
}
}
for (var r = 0; r < a.length; r++) (function(n) {
var a = cc.instantiate(t);
a.name = "type_" + n;
var s = i._selectedGameType === n, o = a.getChildByName("bgOff"), r = a.getChildByName("bgOn");
o && (o.active = !s);
r && (r.active = s);
var c = a.getChildByName("Label"), l = c ? c.getComponent(cc.Label) : a.getComponent(cc.Label);
l && (l.string = i._gameTypeName(n));
c && (c.color = s ? cc.color(255, 255, 255) : cc.color(60, 40, 0));
a.on(cc.Node.EventType.TOUCH_END, function() {
i._selectedGameType = n;
i._loadClubTables();
});
a.parent = e;
a.active = !0;
})(a[r]);
}
}
},
_createTableRow: function(e, t) {
if (!e) return null;
var i = cc.instantiate(e);
i.name = "table_" + t.id;
this._setLabel(i, "cname", t.name || "牌桌" + t.id);
var n = {};
try {
n = JSON.parse(t.conf || "{}") || {};
} catch (e) {
n = {};
}
var a = 0 === String(n.type || t.game_type || "").indexOf("baobao"), s = "底分:" + (null != n.difen_value ? n.difen_value : "-") + " 局数:" + (null != n.jushu_value ? n.jushu_value : "-");
a && (s += " 人数:" + (n.min_players || 2) + "-" + (n.max_players || t.max_players || 2) + "人 进场:" + (n.min_bean || 0) + " 离场:" + (n.kick_bean || 0));
this._setLabel(i, "params", s);
var o = this, r = i.getChildByName("btn_close");
if (r) {
var c = this._findConfigForTable(t), l = !(!c || !Number(c.enabled));
this._setNodeLabel(r.getChildByName("Label"), l ? "关闭" : "开启");
r.on(cc.Node.EventType.TOUCH_END, function() {
o._toggleTableConfig(t);
});
}
var h = i.getChildByName("btn_edit");
h && h.on(cc.Node.EventType.TOUCH_END, function() {
o._editTable(t);
});
var d = i.getChildByName("btn_del");
d && d.on(cc.Node.EventType.TOUCH_END, function() {
o._deleteTable(t);
});
return i;
},
_findConfigForTable: function(e) {
for (var t = Number(e.game_config_id) || 0, i = null, n = 0; n < this._gameConfigs.length; n++) {
var a = this._gameConfigs[n];
if (t > 0 && Number(a.id) === t) return a;
i || String(a.game_type) !== String(e.game_type) || 1 === Number(a.inherited) || (i = a);
}
return i;
},
_editTable: function(e) {
var t = this._findConfigForTable(e);
this._showGameConfigDialog(this._tableAsDlgCfg(e, t), null, e);
},
_tableAsDlgCfg: function(e, t) {
var i = {};
try {
i = JSON.parse(e.conf || "{}") || {};
} catch (e) {
i = {};
}
var n = function(e, t) {
return null == e || "" === e || isNaN(Number(e)) ? t : Number(e);
}, a = n(i.difen_value, null);
null == a && null != i.difen && t && t.difen_options && (a = t.difen_options[Number(i.difen) || 0]);
null == a && (a = t && t.difen_options && t.difen_options[0] || 1);
var s = n(i.jushu_value, 0);
s > 0 || (s = t && t.jushu_options && t.jushu_options[0] || 8);
var o = n(i.cost, null);
null == o && (o = t && t.cost_options && t.cost_options.length ? Number(t.cost_options[0]) : 2);
return {
id: t ? t.id : 0,
game_type: e.game_type,
name: e.name || (t ? t.name : ""),
inherited: 0,
difen_options: [ a ],
jushu_options: [ s ],
cost_options: [ o ],
min_players: n(i.min_players, t ? t.min_players : 2),
max_players_custom: n(i.max_players, t ? t.max_players_custom : 6),
face_score: n(i.face_score, t ? t.face_score : 0),
shuffle_score: n(i.shuffle_score, t ? t.shuffle_score : 0),
min_bean: n(i.min_bean, t ? t.min_bean : 0),
kick_bean: n(i.kick_bean, t ? t.kick_bean : 0),
rake_percent: n(i.rake_percent, t ? t.rake_percent : 0),
hidden_rake_percent: n(i.hidden_rake_percent, t ? t.hidden_rake_percent : 0),
rake_per_round: n(i.rake_per_round, t && null != t.rake_per_round ? t.rake_per_round : 1),
room_fee: n(i.room_fee, t ? t.room_fee : 0),
room_fee_payer: n(i.room_fee_payer, t && null != t.room_fee_payer ? t.room_fee_payer : 1)
};
},
_toggleTableConfig: function(e) {
var t = this, i = this._findConfigForTable(e);
if (i) if (1 !== Number(i.inherited)) {
var a = Number(i.enabled) ? 0 : 1;
n("/club_game_config/" + i.id + "/close", {
club_id: this._clubId,
enabled: a
}, function(e) {
if (e && 0 === e.errcode) {
t._tip(a ? "已开启" : "已关闭");
t._loadGameConfigs();
} else t._tip(e && e.errmsg ? e.errmsg : "操作失败");
});
} else this._tip("一级俱乐部的玩法请到上级俱乐部修改"); else this._tip("该牌桌没有可修改的玩法配置");
},
_deleteTable: function(e) {
var t = this;
this._confirm("确定删除牌桌 " + (e.name || e.id) + "?", function() {
n("/club_admin/table_delete", {
club_id: t._clubId,
id: e.id
}, function(e) {
if (e && 0 === e.errcode) {
t._tip("已删除");
t._loadGameConfigs();
} else t._tip(e && e.errmsg ? e.errmsg : "删除失败");
});
});
},
_showPage: function(e, t) {
this._currentPage = e;
for (var i in this._pages) this._pages[i].active = i === e;
if (this._menuBtns) for (var n in this._menuBtns) {
var a = this._menuBtns[n].getChildByName("selBg");
a && (a.active = n === e);
}
if (!t) {
"reward" === e && this._refreshRewardScroll();
"partner" !== e && "partnerStats" !== e || this._refreshPartnerScroll(e);
this._clubId > 0 && ("overview" === e ? this._loadOverview() : "member" === e ? this._loadMembers() : "partner" === e ? this._loadPartners() : "partnerStats" === e ? this._loadPartners() : "reward" === e ? this._loadRewards() : "gameConfig" === e && this._loadGameConfigs());
}
},
_loadClubInfo: function() {
this._clubId > 0 || (this._clubId = this._resolveClubId());
if (this._clubId > 0 && this._canRequest()) {
this._renderOverview();
this._renderMembers();
this._renderPartners();
this._renderPartnerStats();
this._renderGameConfigs();
this._renderRewards();
this._loadOverview();
this._loadMembers();
this._loadPartners();
this._loadGameConfigs();
this._loadRewards();
} else {
this._members = [];
this._partners = [];
this._gameConfigs = [];
this._rewards = [];
this._overview = {};
this._clubInfoLabel && (this._clubInfoLabel.getComponent(cc.Label).string = "俱乐部: 未登录或未选择俱乐部");
this._myGemsLabel && (this._myGemsLabel.getComponent(cc.Label).string = "我的豆豆: 0");
this._renderOverview();
this._renderMembers();
this._renderPartners();
this._renderPartnerStats();
this._renderGameConfigs();
this._renderRewards();
}
},
_canRequest: function() {
return !!(cc.vv && cc.vv.http && cc.vv.http.sendRequest);
},
_loadOverview: function() {
if (this._canRequest()) {
var e = this;
n("/club_overview", {
club_id: this._clubId
}, function(t) {
e._overview = t && 0 === t.errcode && t.data ? t.data : {};
e._renderOverview();
});
}
},
_loadMembers: function() {
if (this._canRequest()) {
var e = this;
n("/club_members_detail", {
club_id: this._clubId
}, function(t) {
e._members = t && 0 === t.errcode && t.data ? t.data : [];
e._renderMembers();
});
}
},
_loadPartners: function() {
if (this._canRequest()) {
var e = this;
n("/partners", {
club_id: this._clubId
}, function(t) {
e._partners = t && 0 === t.errcode && t.data ? t.data : [];
console.log("[loadPartners] _partners.length=", e._partners.length, "raw=", JSON.stringify(e._partners).substring(0, 200));
e._renderPartners();
e._renderPartnerStats();
});
}
},
_loadGameConfigs: function() {
if (this._canRequest()) {
var e = this;
n("/club_game_configs", {
club_id: this._clubId
}, function(t) {
e._gameConfigs = t && 0 === t.errcode && t.data ? t.data : [];
n("/game_list", {}, function(t) {
e._allGameTypes = t && 0 === t.errcode && t.games ? t.games : [];
e._selectedGameType && e._hasClubGameType(e._selectedGameType) || (e._selectedGameType = e._gameConfigs.length ? String(e._gameConfigs[0].game_type) : "");
e._loadClubTables();
});
});
}
},
_hasClubGameType: function(e) {
for (var t = 0; t < this._gameConfigs.length; t++) if (String(this._gameConfigs[t].game_type) === String(e)) return !0;
return !1;
},
_findGameType: function(e) {
for (var t = this._allGameTypes || [], i = 0; i < t.length; i++) if (String(t[i].type) === String(e)) return t[i];
return null;
},
_gameTypeName: function(e) {
if (e && this._gameConfigs) {
for (var t = "", i = 0; i < this._gameConfigs.length; i++) {
var n = this._gameConfigs[i];
if (String(n.game_type) === String(e)) {
var a = String(n.name || "");
if (a) {
if (1 !== Number(n.inherited)) return a;
t || (t = a);
}
}
}
if (t) return t;
}
var s = this._findGameType(e);
return s && s.name ? s.name : e || "";
},
_loadClubTables: function() {
if (this._canRequest()) if (this._selectedGameType) {
var e = this;
n("/club_tables", {
clubid: this._clubId,
game_type: this._selectedGameType,
all: 1
}, function(t) {
e._clubTables = t && 0 === t.errcode && t.tables ? t.tables : [];
e._renderGameConfigs();
});
} else {
this._clubTables = [];
this._renderGameConfigs();
}
},
_loadRewards: function() {
if (this._canRequest()) {
var e = this;
n("/rewards", {
club_id: this._clubId
}, function(t) {
e._rewards = t && 0 === t.errcode && t.data ? t.data : [];
e._renderRewards();
});
}
},
_createLabel: function(e, t, i) {
var n = new cc.Node("label"), a = n.addComponent(cc.Label);
a.string = e;
a.fontSize = t;
a.lineHeight = t + 4;
n.color = i || new cc.Color(255, 255, 255);
a.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
a.verticalAlign = cc.Label.VerticalAlign.CENTER;
return n;
},
_bindPopups: function() {
var e = this;
this._popups = {};
this._rakePerRound = 1;
this._roomFeePayer = 1;
this._gemsMode = 1;
var t = this.node.getChildByName("popups");
if (t) for (var i = [ "memberRecordsWin", "memberBeanLogsWin", "partnerBeanLogsWin", "partnerChildrenWin", "partnerGemsWin", "partnerRatioWin", "partnerProfitWin", "gameConfigWin", "confirmWin", "addMemberWin", "addPartnerWin" ], n = 0; n < i.length; n++) (function(i) {
var n = t.getChildByName(i);
if (n) {
e._popups[i] = n;
var a = n.getChildByName("panel");
if (a) {
var s = a.getChildByName("closeBtn");
s && s.on(cc.Node.EventType.TOUCH_END, function() {
n.active = !1;
});
var o = a.getChildByName("content");
if (o) {
var r = o.getChildByName("okBtn");
r && r.on(cc.Node.EventType.TOUCH_END, function() {
e._onPopupOk(i);
});
var c = o.getChildByName("cancelBtn");
c && c.on(cc.Node.EventType.TOUCH_END, function() {
n.active = !1;
});
if ("gameConfigWin" === i) {
var l = o.getChildByName("rakeSwitchBtn");
l && l.on(cc.Node.EventType.TOUCH_END, function() {
e._toggleRakeSwitch();
});
var h = o.getChildByName("payerBtn");
h && h.on(cc.Node.EventType.TOUCH_END, function() {
e._togglePayer();
});
}
if ("partnerGemsWin" === i) {
var d = o.getChildByName("btn_add");
d && d.on(cc.Node.EventType.TOUCH_END, function() {
e._setGemsMode(1);
});
var u = o.getChildByName("btn_sub");
u && u.on(cc.Node.EventType.TOUCH_END, function() {
e._setGemsMode(-1);
});
e._gemsAddSpr = d ? d.getComponent(cc.Sprite) : null;
e._gemsSubSpr = u ? u.getComponent(cc.Sprite) : null;
e._gemsAddSpr && (e._gemsAddNormal = e._gemsAddSpr.spriteFrame);
e._gemsSubSpr && (e._gemsSubNormal = e._gemsSubSpr.spriteFrame);
cc.loader.loadRes("images/other/ref_btn_add2", cc.SpriteFrame, function(t, i) {
if (!t && i) {
e._gemsAddSel = i;
e._refreshGemsButtons();
}
});
cc.loader.loadRes("images/other/ref_btn_sub2", cc.SpriteFrame, function(t, i) {
if (!t && i) {
e._gemsSubSel = i;
e._refreshGemsButtons();
}
});
}
}
}
}
})(i[n]);
},
_openPopup: function(e, t) {
var i = this._popups ? this._popups[e] : null;
if (!i) return null;
this._popupCtx = t || {};
i.active = !0;
i.setSiblingIndex(9999);
if ("confirmWin" === e) {
var n = i.getChildByName("panel");
if (n) {
var a = n.getChildByName("content");
if (a) {
var s = a.getChildByName("msgLabel") || a.getChildByName("tipLabel") || a.children[0];
if (s) {
var o = s.getComponent(cc.Label);
if (o) {
o.enableWrapText = !0;
o.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
}
}
}
}
}
return i;
},
_popupPanel: function(e) {
return e ? e.getChildByName("panel") : null;
},
_setNodeLabel: function(e, t) {
if (e) {
var i = e.getComponent(cc.Label);
i && (i.string = t);
}
},
_ensurePopupScroll: function(e) {
if (e._popupScroll) return e._popupScroll;
for (var t = e.width, i = e.height, n = null, a = 0; a < e.childrenCount; a++) {
var s = e.children[a];
if (0 === s.name.indexOf("col")) {
var o = s.y - s.height / 2;
(null === n || o < n) && (n = o);
}
}
var r = null === n ? i / 2 - 60 : n - 6, c = r - (-i / 2 + 20);
if (c < 120) {
c = Math.max(120, i - 140);
r = i / 2 - 40;
}
var l = t - 20, h = r - c / 2, d = new cc.Node("listView");
d.parent = e;
d.setContentSize(l, c);
d.setPosition(0, h);
d.addComponent(cc.Mask).type = cc.Mask.Type.RECT;
var u = new cc.Node("listContent");
u.parent = d;
u.anchorX = .5;
u.anchorY = 1;
u.setContentSize(l, c);
u.setPosition(0, c / 2);
var g = d.addComponent(cc.ScrollView);
g.horizontal = !1;
g.vertical = !0;
g.inertia = !0;
g.brake = .75;
g.elastic = !0;
g.bounceDuration = .23;
g.content = u;
g.enabled = !1;
g.enabled = !0;
e._popupScroll = {
view: d,
sv: g,
list: u,
viewW: l,
viewH: c
};
return e._popupScroll;
},
_fillPopupList: function(e, t) {
if (e) {
for (var i = e.getChildByName("rowTpl"), n = this._ensurePopupScroll(e), a = e.children.length - 1; a >= 0; a--) {
var s = e.children[a];
if ("rowClone" === s.name) {
s.removeFromParent();
s.destroy();
}
}
for (var o = n.list.children.length - 1; o >= 0; o--) {
var r = n.list.children[o];
r.removeFromParent();
r.destroy();
}
if (i && t) {
i.active = !1;
var c = i.height + 8, l = i.height;
n.list.setContentSize(n.viewW, Math.max(n.viewH, t.length * c + 6));
n.list.setPosition(0, n.viewH / 2);
for (var h = 0; h < t.length; h++) {
var d = cc.instantiate(i);
d.name = "rowClone";
d.active = !0;
d.parent = n.list;
d.x = 0;
d.y = -(l / 2 + h * c);
for (var u = t[h] || [], g = 0; g < d.children.length; g++) {
var v = d.children[g];
v.active = !0;
if (void 0 !== u[g] && null !== u[g]) {
var _ = v.getComponent(cc.Label);
_ && (_.string = String(u[g]));
}
}
}
t.length > 0 && n.sv.scrollToTop(.01);
}
}
},
_getInput: function(e, t) {
var i = e ? e.getChildByName(t) : null, n = i ? i.getComponent(cc.EditBox) : null;
return n ? String(n.string || "").trim() : "";
},
_setInput: function(e, t, i) {
var n = e ? e.getChildByName(t) : null, a = n ? n.getComponent(cc.EditBox) : null;
a && (a.string = null == i ? "" : String(i));
},
_ratioDialogNodes: function(e) {
var t = [], i = [];
if (!e) return {};
(function e(n) {
for (var a = n.children, s = 0; s < a.length; ++s) {
var o = a[s];
o.getComponent(cc.Label) && t.push(o);
o.getComponent(cc.EditBox) && i.push(o);
e(o);
}
})(e);
(t = t.filter(function(e) {
return !(e.parent && e.parent.getComponent(cc.EditBox) || e.parent && /(okBtn|cancelBtn|closeBtn)$/.test(e.parent.name));
})).sort(function(e, t) {
return t.y - e.y;
});
i.sort(function(e, t) {
return t.y - e.y;
});
var n = {
tipRake: t[0],
tipHidden: t[1],
tipFee: t[2],
inputRake: i[0],
inputHidden: i[1],
inputFee: i[2]
};
console.log("[partnerRatio] labels=" + t.length + " inputs=" + i.length + " tips=[" + t.map(function(e) {
return e.getComponent(cc.Label).string;
}).join(" | ") + "]");
return n;
},
_setInputNode: function(e, t) {
var i = e ? e.getComponent(cc.EditBox) : null;
i && (i.string = null == t ? "" : String(t));
},
_getInputNode: function(e) {
var t = e ? e.getComponent(cc.EditBox) : null;
return t && t.string || "";
},
_showMemberRecords: function(e) {
var t = this, i = this._openPopup("memberRecordsWin", {
member: e
});
if (i) {
var a = this._popupPanel(i), s = a.getChildByName("content");
this._setNodeLabel(a.getChildByName("titleLabel"), "战绩 - " + e.name);
this._setNodeLabel(s.getChildByName("tipLabel"), e.name + " (ID:" + e.userid + ")");
this._setAvatar(s, "avatar", e.headimg, e.userid);
this._fillPopupList(s, []);
n("/club_member/records", {
club_id: this._clubId,
userid: e.userid
}, function(e) {
var i = [];
if (e && 0 === e.errcode) {
for (var n = e.data || [], a = [], o = {}, r = 0; r < n.length; r++) {
var c = n[r], l = c.create_time ? new Date(1e3 * c.create_time) : null, h = l ? l.getFullYear() + "-" + (l.getMonth() + 1) + "-" + l.getDate() : "未知日期";
if (!o[h]) {
o[h] = {
day: h,
rounds: 0,
win: 0,
lose: 0,
score: 0
};
a.push(o[h]);
}
var d = o[h], u = Number(c.amount) || 0;
d.rounds++;
u > 0 ? d.win++ : u < 0 && d.lose++;
d.score += u;
}
for (var g = 0; g < a.length; g++) {
var v = a[g];
i.push([ v.day, v.rounds, v.win, v.lose, v.score ]);
}
}
0 === i.length && i.push([ "暂无战绩", "", "", "", "" ]);
t._fillPopupList(s, i);
});
}
},
_showMemberBeanLogs: function(e) {
var t = this, i = this._openPopup("memberBeanLogsWin", {
member: e
});
if (i) {
var a = this._popupPanel(i), s = a.getChildByName("content");
this._setNodeLabel(a.getChildByName("titleLabel"), "豆豆明细 - " + e.name);
this._setNodeLabel(s.getChildByName("tipLabel"), e.name + " (ID:" + e.userid + ")");
this._setAvatar(s, "avatar", e.headimg, e.userid);
this._fillPopupList(s, []);
n("/club_member/bean_logs", {
club_id: this._clubId,
userid: e.userid
}, function(e) {
var i = [];
if (e && 0 === e.errcode) for (var n = e.data || [], a = 0; a < n.length; a++) {
var o = n[a], r = o.create_time ? new Date(1e3 * o.create_time).toLocaleString() : "";
i.push([ r, o.change_type || "", o.amount || 0, o.roomid || "", o.remark || "" ]);
}
0 === i.length && i.push([ "暂无明细", "", "", "", "" ]);
t._fillPopupList(s, i);
});
}
},
_showPartnerBeanLogs: function(e) {
var t = this, i = this._openPopup("partnerBeanLogsWin", {
partner: e
});
if (i) {
var a = this._popupPanel(i), s = a.getChildByName("content");
this._setNodeLabel(a.getChildByName("titleLabel"), "豆豆明细 - " + (e.name || ""));
this._setNodeLabel(s.getChildByName("tipLabel"), (e.name || "") + " (ID:" + e.id + ")");
this._setAvatar(s, "avatar", e.headimg, e.owner_userid);
this._fillPopupList(s, []);
n("/partner/bean_logs", {
club_id: this._clubId,
partner_club_id: e.id
}, function(e) {
var i = [];
if (e && 0 === e.errcode) for (var n = e.data || [], a = 0; a < n.length; a++) {
var o = n[a], r = o.create_time ? new Date(1e3 * o.create_time).toLocaleString() : "";
i.push([ r, o.change_type || "", o.amount || 0, o.roomid || "", o.name || "" ]);
}
0 === i.length && i.push([ "暂无明细", "", "", "", "" ]);
t._fillPopupList(s, i);
});
}
},
_showPartnerChildrenDialog: function(e) {
var t = this._openPopup("partnerChildrenWin", {
partner: e
});
t || (t = this._openPopup("partnerBeanLogsWin", {
partner: e
}));
if (t) {
var i = this._popupPanel(t), n = i.getChildByName("content"), a = i.getChildByName("titleLabel") || i.getChildByName("title") || i.getChildByName("titleLbl");
a && this._setNodeLabel(a, "下级俱乐部 - " + (e.name || ""));
for (var s = this._partners.filter(function(t) {
return Number(t.parent_clubid) === Number(e.id);
}), o = [], r = 0; r < s.length; r++) {
var c = s[r], l = c.level || 2;
o.push([ 2 === l ? "二级" : "三级", c.name || "-", c.owner_name ? c.owner_name + "(" + c.owner_userid + ")" : "ID:" + c.id, String(c.member_count || 0), String(Number(c.total_gems) || 0), this._ratioText(c) ]);
}
o.length || o.push([ "暂无下级", "", "", "", "", "" ]);
console.log("[partnerChildren] parent=" + e.id + " children=" + s.length);
this._fillPopupList(n, o);
}
},
_showPartnerProfitDialog: function(e) {
var t = this, i = this._openPopup("partnerProfitWin", {
partner: e
});
if (i) {
var a = this._popupPanel(i), s = a.getChildByName("content");
this._setNodeLabel(a.getChildByName("titleLabel"), "收益详情 - " + e.name);
this._fillPopupList(s, []);
n("/partner/profit", {
club_id: this._clubId,
partner_club_id: e.id
}, function(e) {
var i = [];
if (e && 0 === e.errcode) for (var n = e.data || [], a = 0; a < n.length; a++) {
var o = n[a];
i.push([ o.day || "", Number(o.total) || 0, o.cnt || 0 ]);
}
0 === i.length && i.push([ "暂无收益记录", "", "" ]);
t._fillPopupList(s, i);
});
}
},
_setGemsMode: function(e) {
this._gemsMode = e;
this._refreshGemsButtons();
this._updateGemsTip();
},
_refreshGemsButtons: function() {
this._gemsAddSpr && (this._gemsAddSpr.spriteFrame = this._gemsMode > 0 && this._gemsAddSel ? this._gemsAddSel : this._gemsAddNormal);
this._gemsSubSpr && (this._gemsSubSpr.spriteFrame = this._gemsMode < 0 && this._gemsSubSel ? this._gemsSubSel : this._gemsSubNormal);
},
_updateGemsTip: function() {
var e = this._popups ? this._popups.partnerGemsWin : null;
if (e) {
var t = this._popupPanel(e).getChildByName("content"), i = this._popupCtx || {}, n = i.member ? i.member.gems || 0 : i.partner && i.partner.total_gems || 0, a = this._gemsMode > 0 ? "加豆豆" : "减豆豆";
this._setNodeLabel(t.getChildByName("tipLabel"), "当前乐豆: " + n + "    方式: " + a);
}
},
_showPartnerGemsDialog: function(e) {
var t = this._openPopup("partnerGemsWin", {
partner: e
});
if (t) {
var i = this._popupPanel(t).getChildByName("content");
this._gemsMode = 1;
this._setInput(i, "amountInput", "");
this._refreshGemsButtons();
this._updateGemsTip();
}
},
_showMemberGemsDialog: function(e) {
var t = this._openPopup("partnerGemsWin", {
member: e
});
if (t) {
var i = this._popupPanel(t).getChildByName("content");
this._gemsMode = 1;
this._setInput(i, "amountInput", "");
this._refreshGemsButtons();
this._updateGemsTip();
}
},
_showPartnerRatioDialog: function(e) {
var t = this._openPopup("partnerRatioWin", {
partner: e
});
if (t) {
var i = this._popupPanel(t).getChildByName("content"), n = this._ratioDialogNodes(i);
this._setNodeLabel(n.tipRake, "当前抽水比例：" + (e.profit_ratio || 0) + "%");
this._setNodeLabel(n.tipHidden, "当前暗水比例：" + (e.hidden_profit_ratio || 0) + "%");
this._setNodeLabel(n.tipFee, "当前房费/洗牌/表情比例：" + (e.fee_profit_ratio || 0) + "%");
this._setInputNode(n.inputRake, "");
this._setInputNode(n.inputHidden, "");
this._setInputNode(n.inputFee, "");
}
},
_showAddMemberDialog: function() {
var e = this._openPopup("addMemberWin", {});
if (e) {
var t = this._popupPanel(e).getChildByName("content");
this._setInput(t, "uidInput", "");
}
},
_showAddPartnerDialog: function() {
var e = this._openPopup("addPartnerWin", {});
if (e) {
var t = this._popupPanel(e).getChildByName("content");
this._setInput(t, "uidInput", "");
}
},
_confirm: function(e, t) {
var i = this._openPopup("confirmWin", {
onOk: t
});
if (i) {
var n = this._popupPanel(i).getChildByName("content");
this._setNodeLabel(n.getChildByName("msgLabel"), e);
} else t && t();
},
_tip: function(e) {
var t = this._openPopup("confirmWin", {});
if (t) {
var i = this._popupPanel(t).getChildByName("content");
this._setNodeLabel(i.getChildByName("msgLabel"), e);
}
},
_toggleRakeSwitch: function() {
this._rakePerRound = this._rakePerRound ? 0 : 1;
this._refreshRakePayerUi();
},
_togglePayer: function() {
this._roomFeePayer = this._roomFeePayer ? 0 : 1;
this._refreshRakePayerUi();
},
_refreshRakePayerUi: function() {
var e = this._dlgContent;
if (e) {
this._setNodeLabel(e.getChildByName("rakeSwitchLabel"), this._rakePerRound ? "抽水方式：每小局" : "抽水方式：整场");
var t = e.getChildByName("rakeSwitchBtn");
this._setNodeLabel(t ? t.getChildByName("Label") : null, this._rakePerRound ? "每小局" : "整场");
this._setNodeLabel(e.getChildByName("payerLabel"), this._roomFeePayer ? "房费谁出：大赢家" : "房费谁出：不扣");
var i = e.getChildByName("payerBtn");
this._setNodeLabel(i ? i.getChildByName("Label") : null, this._roomFeePayer ? "大赢家" : "不扣");
}
},
_showGameConfigDialog: function(e, t, i) {
var n = this, a = !!e;
this._dlgGameType = e ? e.game_type : t || this._selectedGameType || "baobao_shou";
var s = this._openPopup("gameConfigWin", {
cfg: e,
isEdit: a,
gameType: this._dlgGameType,
table: i || null
});
if (s) {
var o = this._popupPanel(s);
this._dlgPanel = o;
this._dlgContent = o.getChildByName("content");
this._dlgCfg = e;
this._dlgIsEdit = a;
this._dlgTable = i || null;
if (!this._gameTypePickerBound) {
this._gameTypePickerBound = !0;
var r = o.getChildByName("gameTypeBtn");
r && r.on(cc.Node.EventType.TOUCH_END, function() {
n._dlgIsEdit || n._toggleGameTypeDrop();
});
}
this._applyDlgGameType();
}
},
_applyDlgGameType: function() {
var e = this._dlgPanel, t = this._dlgContent;
if (e && t) {
var i = this._dlgIsEdit, n = this._dlgCfg, a = this._dlgTable ? "修改牌桌" : i ? "修改玩法" : "新建玩法";
this._setNodeLabel(e.getChildByName("titleLabel"), a + " - " + this._gameTypeName(this._dlgGameType));
var s = e.getChildByName("gameTypeBtn");
this._setNodeLabel(s ? s.getChildByName("Label") : null, this._gameTypeName(this._dlgGameType));
for (var o = /^baobao/.test(this._dlgGameType), r = [ "shuffle_scoreLabel", "shuffle_scoreInput", "min_beanLabel", "min_beanInput", "kick_beanLabel", "kick_beanInput", "rake_percentLabel", "rake_percentInput", "hidden_rake_percentLabel", "hidden_rake_percentInput", "__feeRateHidden__", "room_feeLabel", "room_feeInput", "rakeSwitchLabel", "rakeSwitchBtn", "payerLabel", "payerBtn", "min_playersLabel", "min_playersInput", "max_playersLabel", "max_playersInput" ], c = 0; c < r.length; c++) {
var l = t.getChildByName(r[c]);
l && (l.active = o);
}
for (var h = [ "fee_rake_percentLabel", "fee_rake_percentInput" ], d = 0; d < h.length; d++) {
var u = t.getChildByName(h[d]);
u && (u.active = !1);
}
this._setNodeLabel(t.getChildByName("face_scoreLabel"), o ? "表情分:" : "房卡:");
var g = n;
if (!g) for (var v = 0; v < this._gameConfigs.length; v++) {
var _ = this._gameConfigs[v];
if (_.game_type === this._dlgGameType && !_.inherited) {
g = _;
break;
}
}
var f = this._findGameType(this._dlgGameType), m = f && f.max_players ? f.max_players : 6;
this._setInput(t, "nameInput", n ? n.name : this._gameTypeName(this._dlgGameType));
this._setInput(t, "difenInput", g && g.difen_options ? g.difen_options[0] : 1);
this._setInput(t, "jushuInput", g && g.jushu_options ? g.jushu_options[0] : 8);
this._setInput(t, "min_playersInput", g ? g.min_players : 2);
this._setInput(t, "max_playersInput", g ? g.max_players_custom : m);
var p = 0;
g ? p = o ? g.face_score || 0 : g.cost_options && g.cost_options.length ? Number(g.cost_options[0]) : 2 : o || (p = 2);
this._setInput(t, "face_scoreInput", p);
this._setInput(t, "shuffle_scoreInput", g && g.shuffle_score || 0);
this._setInput(t, "min_beanInput", g && g.min_bean || 0);
this._setInput(t, "kick_beanInput", g && g.kick_bean || 0);
this._setInput(t, "rake_percentInput", g ? g.rake_percent : 0);
this._setInput(t, "hidden_rake_percentInput", g ? g.hidden_rake_percent : 0);
this._setInput(t, "room_feeInput", g ? g.room_fee : 0);
this._rakePerRound = g && null != g.rake_per_round ? Number(g.rake_per_round) : 1;
this._roomFeePayer = g && null != g.room_fee_payer ? Number(g.room_fee_payer) : 1;
this._refreshRakePayerUi();
}
},
_toggleGameTypeDrop: function() {
var e = this._dlgPanel ? this._dlgPanel.getChildByName("gameTypeDrop") : null;
if (e) if (e.active) e.active = !1; else {
this._renderGameTypeDrop(e);
e.active = !0;
}
},
_renderGameTypeDrop: function(e) {
var t = e.getChildByName("gameTypeItemTpl");
if (t) {
this._clearList(e, t);
t.active = !1;
for (var i = this, n = {}, a = [], s = 0; s < this._gameConfigs.length; s++) {
var o = String(this._gameConfigs[s].game_type || "");
if (o && !n[o]) {
n[o] = !0;
a.push(o);
}
}
if (!a.length) for (var r = 0; r < this._allGameTypes.length; r++) {
var c = String(this._allGameTypes[r].type || "");
if (c && !n[c]) {
n[c] = !0;
a.push(c);
}
}
for (var l = 0; l < a.length; l++) (function(n) {
var a = cc.instantiate(t);
a.name = "gameType_" + n;
var s = a.getChildByName("Label");
if (s) {
var o = s.getComponent(cc.Label);
if (o) {
o.string = i._gameTypeName(n);
s.color = n === i._dlgGameType ? cc.color(220, 60, 40) : cc.color(0, 0, 0);
}
}
a.on(cc.Node.EventType.TOUCH_END, function() {
e.active = !1;
if (n !== i._dlgGameType) {
i._dlgGameType = n;
i._popupCtx && (i._popupCtx.gameType = n);
i._applyDlgGameType();
}
});
a.parent = e;
a.active = !0;
})(a[l]);
}
},
_onPopupOk: function(e) {
var t = this, i = this._popupCtx || {}, a = this._popups ? this._popups[e] : null;
if (a) {
var s = this._popupPanel(a).getChildByName("content");
if ("memberRecordsWin" !== e && "memberBeanLogsWin" !== e && "partnerProfitWin" !== e) if ("confirmWin" !== e) if ("addMemberWin" !== e) if ("addPartnerWin" !== e) if ("partnerGemsWin" !== e) if ("partnerRatioWin" !== e) {
if ("gameConfigWin" === e) {
var o = i.cfg, r = i.gameType || this._dlgGameType || "baobao_shou", c = /^baobao/.test(r), l = this._findGameType(r), h = l && l.max_players ? Number(l.max_players) : 2, d = {
club_id: this._clubId,
game_type: r,
name: this._getInput(s, "nameInput"),
difen_options: [ parseInt(this._getInput(s, "difenInput")) || 1 ],
jushu_options: [ parseInt(this._getInput(s, "jushuInput")) || 8 ],
min_players: c ? parseInt(this._getInput(s, "min_playersInput")) || 2 : h,
max_players_custom: c ? parseInt(this._getInput(s, "max_playersInput")) || 6 : h,
face_score: c && parseInt(this._getInput(s, "face_scoreInput")) || 0,
shuffle_score: c && parseInt(this._getInput(s, "shuffle_scoreInput")) || 0,
min_bean: c && parseInt(this._getInput(s, "min_beanInput")) || 0,
kick_bean: c && parseInt(this._getInput(s, "kick_beanInput")) || 0,
rake_percent: c && parseFloat(this._getInput(s, "rake_percentInput")) || 0,
hidden_rake_percent: c && parseFloat(this._getInput(s, "hidden_rake_percentInput")) || 0,
room_fee: c && parseInt(this._getInput(s, "room_feeInput")) || 0,
rake_per_round: c ? this._rakePerRound : 1,
room_fee_payer: c ? this._roomFeePayer : 1
};
if (!d.name) {
t._tip("请填写配置名称");
return;
}
c || (d.cost_options = [ parseInt(this._getInput(s, "face_scoreInput")) || 0 ]);
var u = this._dlgTable || i.table;
if (u && u.id) {
d.id = u.id;
n("/club_admin/table_update", d, function(e) {
if (e && 0 === e.errcode) {
a.active = !1;
t._loadGameConfigs();
} else t._tip(e && e.errmsg ? e.errmsg : "操作失败");
});
return;
}
n(i.isEdit ? "/club_game_config/" + o.id : "/club_game_config", d, function(e) {
if (e && 0 === e.errcode) {
a.active = !1;
t._loadGameConfigs();
} else t._tip(e && e.errmsg ? e.errmsg : "操作失败");
});
}
} else {
var g = this._ratioDialogNodes(s), v = parseFloat(this._getInputNode(g.inputRake));
if (isNaN(v) || v < 0 || v > 100) {
t._tip("请输入0-100之间的数字");
return;
}
var _ = this._getInputNode(g.inputFee), f = parseFloat(_);
if ("" !== _ && (isNaN(f) || f < 0 || f > 100)) {
t._tip("费用比例请输入0-100之间的数字");
return;
}
var m = this._getInputNode(g.inputHidden), p = parseFloat(m);
if ("" !== m && (isNaN(p) || p < 0 || p > 100)) {
t._tip("暗水比例请输入0-100之间的数字");
return;
}
var b = {
club_id: this._clubId,
partner_club_id: i.partner.id,
ratio: v
};
isNaN(f) || (b.fee_ratio = f);
isNaN(p) || (b.hidden_ratio = p);
console.log("[partnerRatio] save " + JSON.stringify(b));
n("/partner/ratio", b, function(e) {
if (e && 0 === e.errcode) {
a.active = !1;
t._loadPartners();
} else t._tip(e && e.errmsg ? e.errmsg : "操作失败");
});
} else {
var C = Math.abs(parseInt(this._getInput(s, "amountInput")));
if (isNaN(C) || 0 === C) {
t._tip("请输入有效数字");
return;
}
var y = this._gemsMode > 0 ? C : -C;
if (i.member) {
n("/club_member_gems", {
clubid: this._clubId,
userid: i.member.userid,
gems: y
}, function(e) {
if (e && 0 === e.errcode) {
a.active = !1;
t._loadMembers();
} else t._tip(e && e.errmsg ? e.errmsg : "操作失败");
});
return;
}
n("/partner/gems", {
club_id: this._clubId,
partner_club_id: i.partner.id,
gems: y
}, function(e) {
if (e && 0 === e.errcode) {
a.active = !1;
t._loadPartners();
} else t._tip(e && e.errmsg ? e.errmsg : "操作失败");
});
} else {
var S = parseInt(this._getInput(s, "uidInput"));
if (!(S > 0)) return;
n("/club_member/set_partner", {
club_id: this._clubId,
userid: S
}, function(e) {
if (e && 0 === e.errcode) {
a.active = !1;
t._loadPartners();
}
});
} else {
var N = parseInt(this._getInput(s, "uidInput"));
if (!(N > 0)) return;
n("/club_member/add", {
club_id: this._clubId,
userid: N
}, function(e) {
if (e && 0 === e.errcode) {
a.active = !1;
t._loadMembers();
}
});
} else {
a.active = !1;
i.onOk && i.onOk();
} else a.active = !1;
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
this._clubTpl2 = this._clubFind(e, "sampleCard2");
[ "zhanjiWin", "recordWin", "memLogWin", "alert" ].forEach(function(t) {
var i = e.getChildByName(t);
i && (i.active = !1);
});
var i = e.getChildByName("clubPage"), n = e.getChildByName("wfPage");
console.log("[club] onLoad fromClubId=", cc.vv.fromClubId, "fromClub=", cc.vv.fromClub);
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
_clubClampLabel: function(e, t) {
if (e) {
var i = e.node.width;
e.overflow = cc.Label.Overflow.NONE;
e.string = t || "";
if (i > 0) {
e._forceUpdateRenderData && e._forceUpdateRenderData();
if (!(e.node.width <= i)) for (var n = e.string; n.length > 1; ) {
n = n.slice(0, -1);
e.string = n;
e._forceUpdateRenderData && e._forceUpdateRenderData();
if (e.node.width <= i) break;
}
}
}
},
_clubPaintRect: function(e, t, i, n, a, s) {
e.fillColor = n;
e.rect(-t / 2, -i / 2, t, i);
e.fill();
e.strokeColor = a;
e.lineWidth = s;
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
for (var s = [ this._clubBtnMine, this._clubBtnCreate, this._clubBtnJoin ], o = 0; o < s.length; ++o) if (s[o]) {
s[o]._clubW = s[o].width;
s[o]._clubH = s[o].height;
}
if (!i._clubBound) {
i._clubBound = !0;
this._clubMask && this._clubMask.on(cc.Node.EventType.TOUCH_START, function() {});
if (this._clubCloseBtn) {
var r = this._clubCloseBtn.getComponent(cc.Button);
r && (r.clickEvents = []);
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
var a = e.getChildByName("PopupScene20"), s = a ? a.getChildByName("New Label") : null;
if (s) {
var o = s.getComponent(cc.Label);
o && (o.string = "请输入俱乐部ID");
}
var r = e.getComponent("JoinGameInput");
if (r) {
t._clubJoinComp = r;
r.onInputFinished = function(e) {
t._clubDoJoin(e);
};
}
}
}
};
i(e.getChildByName("clubCreateWin"), !1);
i(e.getChildByName("clubJoinWin"), !0);
},
_clubStretchPopupDim: function() {},
_clubLayoutPage: function() {},
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
var s = a.getComponent(cc.Graphics);
if (s) {
s.clear();
this._clubPaintRect(s, e.width, e.height, t ? cc.color(96, 78, 150) : cc.color(52, 42, 84), t ? cc.color(255, 200, 90) : cc.color(120, 100, 170), 2);
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
_clubAddRow: function(e, t, i, n, a, s, o) {
var r = this;
s = s || 760;
var c = new cc.Node("row" + t);
c.setContentSize(s, 68);
var l = e.height ? e.height / 2 - 34 : 110;
c.setPosition(0, l - 73 * t);
e.addChild(c);
var h = -s / 2 + 20, d = 26, u = 0, g = cc.Label.HorizontalAlign.LEFT;
if (o) {
h = 0;
d = 24;
u = .5;
g = cc.Label.HorizontalAlign.CENTER;
var v = new cc.Node("bgimg");
v.setContentSize(s, 68);
c.addChild(v);
var _ = v.addComponent(cc.Sprite);
_.sizeMode = cc.Sprite.SizeMode.CUSTOM;
_.type = cc.Sprite.Type.SIMPLE;
c._iconSp = _;
r._loadAtlasFrame("images/atlas/hall_ui", "club_game.png", function(e) {
if (e && cc.isValid(v)) {
c._iconNormal = e;
if (!c._selected || !c._iconSel) {
_.spriteFrame = e;
v.setContentSize(s, 68);
}
}
});
r._loadAtlasFrame("images/atlas/hall_ui", "club_game_on.png", function(e) {
if (e && cc.isValid(v)) {
c._iconSel = e;
if (c._selected) {
_.spriteFrame = e;
v.setContentSize(s, 68);
}
}
});
}
var f = new cc.Node("l");
f.anchorX = u;
f.setContentSize(.5 === u ? s : s - (h + s / 2) - 70, 68);
f.setPosition(h, 0);
c.addChild(f);
var m = f.addComponent(cc.Label);
m.string = i;
m.fontSize = d;
m.lineHeight = 68;
m.horizontalAlign = g;
m.verticalAlign = cc.Label.VerticalAlign.CENTER;
m.overflow = cc.Label.Overflow.NONE;
f.color = cc.color(0, 0, 0);
if (null != n && "" != n) {
var p = new cc.Node("s");
p.anchorX = 1;
p.setContentSize(100, 68);
p.setPosition(s / 2 - 20, 0);
c.addChild(p);
var b = p.addComponent(cc.Label);
b.string = n;
b.fontSize = 24;
b.lineHeight = 68;
b.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
b.verticalAlign = cc.Label.VerticalAlign.CENTER;
p.color = cc.color(0, 0, 0);
}
a && c.on(cc.Node.EventType.TOUCH_END, function() {
r._clubScrollMoved ? r._clubScrollMoved = !1 : a(c);
});
return c;
},
_clubMakeScrollBox: function(e, t, i, n) {
var a = this, s = this._clubFind(e, "box");
if (s) {
var o = this._clubFind(s, "view"), r = o ? this._clubFind(o, "content") : null, c = o ? o.width : 0, l = o ? o.height : 0;
if (r) {
var h = r.getChildByName("rowTpl"), d = r.getChildByName("emptyTip");
r.removeAllChildren();
h && r.addChild(h);
d && r.addChild(d);
}
this._clubScroll = {
view: o,
content: r,
vw: c,
vh: l
};
if (o && !s._clubScrollBound) {
s._clubScrollBound = !0;
var u = 0, g = 0;
o.on(cc.Node.EventType.TOUCH_START, function(e) {
u = e.getLocation().y;
g = a._clubScroll && a._clubScroll.content ? a._clubScroll.content.y : 0;
a._clubScrollMoved = !1;
});
o.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
var t = a._clubScroll;
if (t && t.content && !(t.content.height <= t.vh)) {
var i = e.getLocation().y - u;
Math.abs(i) > 6 && (a._clubScrollMoved = !0);
var n = (t.vh - t.content.height) / 2, s = (t.content.height - t.vh) / 2;
t.content.y = Math.max(n, Math.min(s, g + i));
}
});
o.on(cc.Node.EventType.TOUCH_CANCEL, function() {
a._clubScrollMoved = !1;
});
}
return r;
}
var v = new cc.Node("box");
v.setContentSize(t, i);
e.addChild(v);
var _ = new cc.Node("bg");
_.setContentSize(t, i);
v.addChild(_);
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
v.addChild(b);
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
var S = 0, N = 0;
b.on(cc.Node.EventType.TOUCH_START, function(e) {
S = e.getLocation().y;
N = y.y;
a._clubScrollMoved = !1;
});
b.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
if (!(y.height <= p)) {
var t = e.getLocation().y - S;
Math.abs(t) > 6 && (a._clubScrollMoved = !0);
var i = (p - y.height) / 2, n = (y.height - p) / 2;
y.y = Math.max(i, Math.min(n, N + t));
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
var s = this._clubFind(this._clubListArea, "box"), o = s ? s.getChildByName("view") : null, r = o ? o.getChildByName("content") : null;
if (r) {
var c = r.getChildByName("rowTpl"), l = r.getChildByName("emptyTip");
r.removeAllChildren();
c && r.addChild(c);
if (l) {
r.addChild(l);
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
var e = this, t = cc.find("Canvas/clubPage");
t && (t.active = !0);
this.openClubPanel();
cc.vv.http.sendRequest("/club_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(t) {
if (cc.isValid(e.node) && 0 === t.errcode) {
e._myClubs = t.clubs || [];
if ("mine" === e._clubState) {
e._clubSetTop();
e._clubRenderMine();
}
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
var i = this._myClubs || [], n = Math.min(t.width || 880, 920), a = (t.height || 460) - 10, s = i.length > 0 ? i.length : 1;
this._clubMakeScrollBox(t, n, a, 80 * s + 20);
var o = this._clubScroll ? this._clubScroll.content : t;
if (o) {
var r = o.getChildByName("rowTpl");
r && (r.active = !1);
var c = o.getChildByName("emptyTip");
if (c) {
c.active = 0 == i.length;
if (0 == i.length) {
var l = c.getComponent(cc.Label);
l && (l.string = "您还没有加入任何俱乐部，请创建或加入！");
}
}
if (0 != i.length) {
var h = !!o.getComponent(cc.Layout), d = (r ? r.width : 360) + 20;
i.forEach(function(t, n) {
var a = r ? cc.instantiate(r) : new cc.Node("row" + n);
a.active = !0;
o.addChild(a);
if (!h) {
a.x = (n - (i.length - 1) / 2) * d;
a.y = 0;
}
var s = a.getChildByName("name");
if (s) {
var c = s.getComponent(cc.Label);
c && e._clubClampLabel(c, t.name || "");
}
var l = a.getChildByName("sub");
if (l) {
var u = l.getComponent(cc.Label);
u && e._clubClampLabel(u, (t.member_count || 0) + "人");
}
var g = cc.vv.userMgr ? cc.vv.userMgr.userId : 0, v = a.getChildByName("username-a");
if (v) {
var _ = v.getComponent(cc.Label);
_ && e._clubClampLabel(_, t.owner_name || "");
}
var f = a.getChildByName("userid-a");
if (f) {
var m = f.getComponent(cc.Label);
m && e._clubClampLabel(m, t.owner_userid ? String(t.owner_userid) : "");
}
var p = a.getChildByName("js-a");
if (p) {
var b = p.getComponent(cc.Label);
if (b) {
b.overflow = cc.Label.Overflow.NONE;
b.string = t.owner_userid == g ? "合伙人" : "普通用户";
}
}
a.on(cc.Node.EventType.TOUCH_END, function() {
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
var s = i.getChildByName("mask");
s && (i._clubBound || s.on(cc.Node.EventType.TOUCH_START, function() {}));
i._clubBound = !0;
var o = i.getChildByName("listArea");
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
this._clubListArea = o;
this._clubCloseBtn = null;
this._wfSaved.panel && (this._wfSaved.panel.active = !1);
this._clubDetailBgNode = i.getChildByName("detailBgImg");
this._clubDetailFullBg = i.getChildByName("detailFullBg");
var r = this._clubFind(i, "nameLabel");
if (r) {
var c = r.getComponent(cc.Label);
c && this._clubClampLabel(c, e.name || "");
}
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
var e = cc.find("Canvas");
if (e) {
var t = e.getChildByName("zhanjiWin");
t && (t.active = !1);
var i = e.getChildByName("recordWin");
i && (i.active = !1);
}
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
var a = i.getChildByName("boot"), s = (a ? a.getChildByName("glSprite") : null) || i.getChildByName("glSprite") || this._clubFind(i, "glSprite");
if (s) {
s.active = n;
if (!s._admBound) {
s._admBound = !0;
s.on(cc.Node.EventType.TOUCH_END, function() {
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
var r = i.getChildByName("KsSprite01") || this._clubFind(i, "KsSprite01");
if (r && !r._wfRefreshBound) {
r._wfRefreshBound = !0;
r.active = !0;
r.on(cc.Node.EventType.TOUCH_END, function() {
t._clubTablesSig = null;
t._clubLoadTables();
});
}
var c = i.getChildByName("Sprite1") || (a ? a.getChildByName("Sprite1") : null) || this._clubFind(i, "Sprite1");
if (c && !c._wfRecBound) {
c._wfRecBound = !0;
c.on(cc.Node.EventType.TOUCH_END, function() {
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
var s = this._clubFind(i, "btn_cancel");
s && s.on(cc.Node.EventType.TOUCH_END, function() {
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
var a = i.getPosition(), s = i.getSiblingIndex(), o = i.getContentSize(), r = Math.max(o.width, n ? n.width : 0);
i._wfViewH = o.height;
var c = new cc.Node("sv");
c.setContentSize(r, o.height);
c.setPosition(a);
p.addChild(c);
c.setSiblingIndex(s);
var l = new cc.Node("view");
l.setContentSize(r, o.height);
c.addChild(l);
l.addComponent(cc.Mask).type = cc.Mask.Type.RECT;
var h = c.addComponent(cc.ScrollView);
h.horizontal = !1;
h.vertical = !0;
h.inertia = !0;
h.brake = .75;
i.parent = l;
i.setAnchorPoint(.5, 1);
i.setPosition(0, o.height / 2);
h.content = i;
i._wfScroll = h;
}
}
},
_wfPopupClearRows: function(e, t) {
if (e) {
var i = e.getChildByName("content") || e;
i.active || (i.active = !0);
for (var n = i.children.slice(), a = 0; a < n.length; ++a) if (n[a] !== t) {
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
var a, s = e.getChildByName("content") || e, o = t.height || 36, r = o + 2;
if (e._wfViewH) {
var c = (i + 1) * r;
s.height < c && (s.height = c);
a = -o / 2 - i * r;
} else {
if (i >= 8) return null;
a = (s.height || 330) / 2 - o / 2 - i * r;
}
var l = cc.instantiate(t);
l.active = !0;
l.setPosition(0, a);
s.addChild(l);
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
var s = 1 === e.errcode ? "该局录像已过期" : 2 === e.errcode ? "没有该局回放权限" : e.errmsg || "获取回放失败";
cc.vv.wc.showError(s);
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
return 0 === t.indexOf("baobao_mian") ? "六宝免摆" : 0 === t.indexOf("baobao_shou") ? "六宝手动" : 0 === t.indexOf("baobao") ? "六宝" : "sss2" == t ? "十三水(2人)" : "sss4" == t ? "十三水(4人)" : t || "-";
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
}, function(s) {
if (cc.isValid(t) && t.active && t._wfSeq === i) if (0 === s.errcode) {
for (var o = s.list || [], r = 0, c = 0; c < o.length; ++c) r += (o[c].games || []).length;
e._wfPopupSetLabel(t, "sum1", "牌局数：" + r);
for (var l = 0, h = 0; h < o.length; ++h) for (var d = o[h], u = d.games || [], g = 0; g < u.length; ++g) {
var v = u[g], _ = e._wfPopupAddRow(n.list, n.tpl, l, [ l + 1, d.table_name || e._wfGameName(d.type), "-", e._wfPopupTime(v.create_time), "-", d.roomid, v.index, "-", "-" ]), f = 0 === String(d.type || "").indexOf("baobao");
_ && e._wfBindDetail(_, f && d.uuid || "", f && v.index || 0);
l++;
}
a && cc.isValid(a) && (a.active = 0 == l);
} else cc.vv.wc.showError(s.errmsg || "获取战绩失败");
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
var a = this._clubFind(e, "todayBtn"), s = this._clubFind(e, "allBtn");
a && (a.color = cc.color(t ? 255 : 245, t ? 200 : 240, t ? 90 : 230));
s && (s.color = cc.color(t ? 245 : 255, t ? 240 : 200, t ? 230 : 90));
var o = this._clubFind(e, "emptyTip");
o && (o.active = !1);
var r = 0;
if (t) {
var c = new Date();
c.setHours(0, 0, 0, 0);
r = Math.floor(c.getTime() / 1e3);
}
var l = e._wfLogSeq = (e._wfLogSeq || 0) + 1;
cc.vv.http.sendRequest("/my_bean_logs", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
from: r
}, function(t) {
if (cc.isValid(e) && e.active && e._wfLogSeq === l) if (0 === t.errcode) {
for (var a = t.logs || [], s = 0; s < a.length; ++s) {
var r = a[s], c = Number(r.amount) || 0, h = i._wfPopupAddRow(n.list, n.tpl, s, [ i._wfPopupTime(r.create_time), r.roomid || "-", r.table_name || i._wfGameName(r.game_type), r.change_type || "-", c > 0 ? "+" + c : String(c), "-" ]), d = 0 === String(r.game_type || "").indexOf("baobao");
h && i._wfBindDetail(h, d && r.room_uuid || "", d && parseInt(r.game_index) || 0);
}
o && cc.isValid(o) && (o.active = 0 == a.length);
} else cc.vv.wc.showError(t.errmsg || "获取乐豆记录失败");
});
}
},
_admOpen: function() {
var e = this._clubCur ? parseInt(this._clubCur.id) : 0;
e > 0 || (e = parseInt(cc.vv.fromClubId) || 0);
if (e > 0) {
cc.vv.adminClubId = e;
cc.sys.localStorage.setItem("admin_club_id", e);
}
cc.director.loadScene("clubAdmin");
},
_wfQuickJoin: function() {
for (var e = this._clubTableList || [], t = null, i = -1, n = 0; n < e.length; ++n) {
var a = e[n], s = this._clubMaxPlayers(a), o = Number(a.player_count) || 0, r = a.roomid && this._clubTableCardMap ? this._clubTableCardMap["r_" + a.roomid] : null;
if (r && r.slots) {
for (var c = 0, l = 0; l < r.slots.length; ++l) r.slots[l] && r.slots[l]._uid > 0 && ++c;
c > o && (o = c);
}
if (!(o >= s) && o > i) {
i = o;
t = a;
}
}
t ? this._clubEnterTable(t) : cc.vv.wc.showError("当前没有可加入的牌桌");
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
var s = this._clubFind(t, "btnBack");
if (s) {
s._clubW = s.width;
s._clubH = s.height;
if (!s._clubBound) {
s._clubBound = !0;
s.on(cc.Node.EventType.TOUCH_END, function() {
e._wfBack();
});
}
this._clubBackBtn = s;
}
var o = this._clubFind(t, "clubName");
if (o) {
o.active = !0;
var r = o.getComponent(cc.Label);
r && this._clubClampLabel(r, this._clubCur && this._clubCur.name || "");
}
var c = this._clubFind(t, "clubGems");
this._clubGemsNode = c;
var l = c && c.parent, h = l ? l.getChildByName("New Node") : null, d = h ? h.getChildByName("name") : null;
if (d && cc.vv.userMgr && cc.vv.userMgr.userId) {
cc.vv.baseInfoMap && delete cc.vv.baseInfoMap[cc.vv.userMgr.userId];
(d.getComponent("ImageLoader") || d.addComponent("ImageLoader")).setUserID(cc.vv.userMgr.userId);
}
var u = function(e) {
if (cc.isValid(c)) {
var t = c.getComponent(cc.Label);
t && (t.string = String(null == e ? 0 : e));
}
};
c && u(cc.vv.userMgr.gems);
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
if (c && c.parent) {
var g = c.parent.getChildByName("safeBtn") || this._clubFind(t, "safeBtn");
if (g) {
g.off(cc.Node.EventType.TOUCH_END);
g.on(cc.Node.EventType.TOUCH_END, function() {
e._openSafeWin();
});
}
}
var v = this._clubFind(t, "games");
if (v) {
var _ = v.getChildByName("sampleRow0") || v.getChildByName("gameRowTpl"), f = v.getChildByName("allRow"), m = v.getChildByName("emptyTip"), p = v.getChildByName("samptext"), b = [];
[ "gameRowTpl", "sampleRow0", "sampleRow1", "sampleRow2" ].forEach(function(e) {
var t = v.getChildByName(e);
t && b.push(t);
});
v.removeAllChildren();
p && v.addChild(p);
b.forEach(function(e) {
v.addChild(e);
e.active = !1;
});
if (f) {
v.addChild(f);
f.active = !0;
}
m && v.addChild(m);
this._clubGameRows = [];
var C = [ {
_all: !0,
game_type: "",
name: "全部",
difen_options: [],
jushu_options: []
} ].concat(this._clubGames || []);
this._clubGamesWithAll = C;
_ && _.height;
var y = null, S = 0, N = v.getChildByName("emptyTip");
N && (N.active = 0 == (this._clubGames || []).length);
C.forEach(function(t, i) {
var n = null;
if (0 === i && f) {
(n = f).active = !0;
y = f.x + f.width / 2;
S = f.y;
} else {
(n = _ ? cc.instantiate(_) : new cc.Node("row" + i)).active = !0;
if (null != y) {
n.setPosition(y + 0 + n.width / 2, S);
y += 0 + n.width;
}
v.addChild(n);
}
n._gm = t;
var a = n.getChildByName("l");
if (a) {
var s = a.getComponent(cc.Label);
s && (s.string = t.name || "");
}
var o = n.getChildByName("bgimg");
if (o) {
var r = o.getComponent(cc.Sprite);
n._iconSp = r;
n._iconNormal = r ? r.spriteFrame : null;
n._iconSel = null;
cc.resources.load("images/other/button_yellow", cc.SpriteFrame, function(e, t) {
if (!e && t && cc.isValid(o)) {
n._iconSel = t;
n._selected && (r.spriteFrame = t);
}
});
}
n.off(cc.Node.EventType.TOUCH_END);
n.on(cc.Node.EventType.TOUCH_END, function() {
e._clubScrollMoved ? e._clubScrollMoved = !1 : e._clubSelectGame(t, n);
});
e._clubGameRows.push(n);
});
var M = this._clubFind(t, "tablesView") || this._clubFind(cc.find("Canvas"), "tablesView");
if (M) {
this._clubTablesNode = M.getChildByName("tables");
if (this._clubTablesNode) {
var B = this._clubFind(this._clubTablesNode, "sampleCard0");
B && (this._clubTpl = B);
var w = this._clubFind(this._clubTablesNode, "sampleCard2");
w && (this._clubTpl2 = w);
this._clubTablesNode.removeAllChildren();
if (!M._clubBound) {
M._clubBound = !0;
var T = 0, A = 0;
M.on(cc.Node.EventType.TOUCH_START, function(t) {
T = t.getLocation().x;
A = e._clubTablesNode ? e._clubTablesNode.x : 0;
e._clubTablesScrollMoved = !1;
});
M.on(cc.Node.EventType.TOUCH_MOVE, function(t) {
if (e._clubTablesNode) {
var i = M.width, n = e._clubTablesNode.width;
if (!(n <= i)) {
var a = t.getLocation().x - T;
Math.abs(a) > 6 && (e._clubTablesScrollMoved = !0);
var s = e._clubTablesRestX || 0, o = n - i;
e._clubTablesNode.x = Math.max(s - o, Math.min(s, A + a));
}
}
});
M.on(cc.Node.EventType.TOUCH_CANCEL, function() {
e._clubTablesScrollMoved = !1;
});
}
null == this._clubTablesRestY && (this._clubTablesRestY = this._clubTablesNode.y);
null == this._clubTablesRestX && (this._clubTablesRestX = this._clubTablesNode.x);
if (!this._clubCurGame && C.length > 0) {
var P = cc.vv.lastGameType, I = null;
if (P) for (var x = 0; x < C.length; ++x) {
var L = C[x].game_type || C[x].type;
if (L && L == P) {
I = C[x];
break;
}
}
this._clubCurGame = I || C[0];
}
for (var O = 0; O < this._clubGameRows.length; ++O) this._clubPaintRow(this._clubGameRows[O], C[O] === this._clubCurGame);
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
var s = this._clubCurGame || {}, o = (this._clubTableList || []).filter(function(e) {
return s._all || !s.game_type || e.game_type === s.game_type;
});
if (o.length) {
var r = this, c = n.width, l = n.height, h = this._clubChipsAnchor && cc.isValid(this._clubChipsAnchor) ? this._clubChipsAnchor : a, d = h.x - h.width / 2, u = h.y - h.height / 2 - 6 - l / 2, g = (t.width || 1920) / 2 - 10, v = d, _ = u;
o.forEach(function(e) {
var i = cc.instantiate(n);
i.name = "tchip";
i.active = !0;
var a = e.name || "", s = i.getChildByName("l"), o = s ? s.getComponent(cc.Label) : null;
if (o) {
o.overflow = cc.Label.Overflow.NONE;
o.string = a;
o._forceUpdateRenderData && o._forceUpdateRenderData();
}
var h = o && o.node.width > 0 ? o.node.width : 20 * a.length, u = Math.max(c, Math.ceil(h + 28));
i.width = u;
var f = i.getChildByName("bgimg");
f && (f.width = u);
if (v + u > g && v > d) {
v = d;
_ -= l + 6;
}
i.setPosition(v + u / 2, _);
v += u + 8;
t.addChild(i);
i.on(cc.Node.EventType.TOUCH_END, function() {
if (r._clubScrollMoved) r._clubScrollMoved = !1; else {
r._clubTablesSig = null;
r._clubLoadTables();
}
});
});
}
}
}
}
},
_clubCardTpl: function(e) {
var t = cc.find("Canvas");
if (2 === e) {
if (this._clubTpl2 && cc.isValid(this._clubTpl2)) return this._clubTpl2;
var i = t ? this._clubFind(t, "sampleCard2") : null;
if (i) {
this._clubTpl2 = i;
return i;
}
}
if (this._clubTpl && cc.isValid(this._clubTpl)) return this._clubTpl;
var n = t ? this._clubFind(t, "sampleCard0") : null;
n && (this._clubTpl = n);
return n || null;
},
_clubMaxPlayers: function(e) {
if (e) {
var t = e.max_players || e.maxPlayers;
if (t) return (t = parseInt(t)) > 6 ? 6 : t;
}
var i = e && e.game_type ? e.game_type : this._clubCurGame && this._clubCurGame.game_type ? this._clubCurGame.game_type : "";
return 0 === i.indexOf("baobao") ? 6 : 0 === i.indexOf("zj4") || 0 === i.indexOf("zp4") || "wujin" == i || "sss4" == i ? 4 : 2;
},
_clubAddTableCard: function(e, t, i) {
var n = this, a = this._clubMaxPlayers(i), s = this._clubCardTpl(a);
if (s) {
var o = s.width, r = s.height, c = 5 + o / 2 + Math.floor(t / 2) * (o + 5), l = -(5 + r / 2 + t % 2 * (r + 5)), h = cc.instantiate(s);
h.active = !0;
h.setPosition(c, l);
e.addChild(h);
for (var d = [ "下左", "左", "上左", "上右", "右", "下右" ], u = [ h.getChildByName("seat2p0"), h.getChildByName("seat2p1") ], g = !(2 !== a || !u[0] || !u[1]), v = g ? [ 0, 1 ] : {
2: [ 0, 3 ],
3: [ 0, 1, 4 ],
4: [ 0, 1, 3, 4 ],
5: [ 0, 1, 2, 3, 4 ],
6: [ 0, 1, 2, 3, 4, 5 ]
}[a] || [ 0, 1, 2, 3, 4, 5 ], _ = [ 0, 0, 0, 0, 0, 0 ], f = [ "", "", "", "", "", "" ], m = this._clubUidNames = this._clubUidNames || {}, p = 0; p < v.length; p++) {
var b = Number(i["user_id" + p]) || 0, C = i["user_name" + p] || "";
if (b > 0 && v[p] < _.length) {
_[v[p]] = b;
f[v[p]] = C;
m[b] = C;
}
}
for (var y = [ null, null, null, null, null, null ], S = 0; S < 6; S++) {
var N = h.getChildByName("seat" + S);
if (N) if (g || v.indexOf(S) < 0) N.active = !1; else {
N._side = d[S];
y[S] = N;
this._clubSetSeat(N, _[S] || 0, f[S] || "");
}
}
u[0] && (u[0].active = g);
u[1] && (u[1].active = g);
if (g) for (var M = 0; M < 2; M++) {
var B = u[M];
B._side = 0 === M ? "下左" : "上右";
y[M] = B;
this._clubSetSeat(B, _[M] || 0, f[M] || "");
}
this._clubTableCardMap || (this._clubTableCardMap = {});
var w = {
card: h,
slots: y,
uids: _,
map: v
};
this._clubTableCardMap[i.id] = w;
i.roomid && (this._clubTableCardMap["r_" + i.roomid] = w);
var T = h.getChildByName("cb") || h.getChildByName("n");
if (T) {
var A = T.getComponent(cc.Label);
A && (A.string = i.name || "");
}
var P = {};
try {
P = JSON.parse(i.conf) || {};
} catch (e) {}
for (var I = this._clubCurGame || {}, x = I.difen_options || [], L = I.jushu_options || [], O = null != P.difen_value ? P.difen_value : "number" == typeof P.difen && null != x[P.difen] ? x[P.difen] : P.difen, R = null != P.jushu_value ? P.jushu_value : "number" == typeof P.jushuxuanze && null != L[P.jushuxuanze] ? L[P.jushuxuanze] : P.jushuxuanze, j = Number(P.min_bean) || 0, E = 0; E < h.children.length; ++E) {
var k = h.children[E];
if ("c" === k.name || "C" === k.name) {
var F = k.getComponent(cc.Label);
F && (F.string = "底分" + (null != O ? O : "-") + "  局数" + (null != R ? R : "-"));
}
}
var H = h.getChildByName("ca");
if (H) {
var D = 0 === String(i.game_type || P.type || "").indexOf("baobao");
H.active = D;
if (D) {
var G = H.getComponent(cc.Label);
G && (G.string = "入场：" + j + "，离场：" + (Number(P.kick_bean) || 0));
}
}
var J = h.getChildByName("btnClear");
if (J) {
J.active = !!i.can_clear;
if (i.can_clear) {
J.off(cc.Node.EventType.TOUCH_END);
J.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
n._clubTablesScrollMoved ? n._clubTablesScrollMoved = !1 : n._clubClearTable(i);
});
}
}
h.on(cc.Node.EventType.TOUCH_END, function() {
n._clubTablesScrollMoved ? n._clubTablesScrollMoved = !1 : n._clubEnterTable(i);
});
return h;
}
console.log("[俱乐部]场景缺少sampleCard0模板,无法建牌桌卡片");
},
_clubShowConfirm: function(e, t, i) {
var n = cc.find("Canvas/alert");
if (n) {
var a = this;
if (!this._clubAlertBound) {
this._clubAlertBound = !0;
var s = n.getChildByName("btn_ok"), o = n.getChildByName("btn_cancel");
s && s.on(cc.Node.EventType.TOUCH_END, function() {
n.active = !1;
var e = a._clubAlertOk;
a._clubAlertOk = null;
e && e();
});
o && o.on(cc.Node.EventType.TOUCH_END, function() {
n.active = !1;
a._clubAlertOk = null;
});
}
var r = cc.find("Canvas/alert/title"), c = cc.find("Canvas/alert/content");
r && (r = r.getComponent(cc.Label)) && (r.string = e);
c && (c = c.getComponent(cc.Label)) && (c.string = t);
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
var n = t.getChildByName("panel") || t, a = n.getChildByName("gemsLb"), s = n.getChildByName("safeLb");
this._safeGemsLb = a ? a.getComponent(cc.Label) : null;
this._safeSafeLb = s ? s.getComponent(cc.Label) : null;
var o = n.getChildByName("amount");
this._safeAmountEb = o ? o.getComponent(cc.EditBox) : null;
this._safeAmountEb && (this._safeAmountEb.string = "");
if (!this._safeBound) {
this._safeBound = !0;
var r = function(e, t) {
if (e) {
e.off(cc.Node.EventType.TOUCH_END);
e.on(cc.Node.EventType.TOUCH_END, t);
}
};
r(n.getChildByName("depBtn"), function() {
var t = e._safeAmountEb ? parseInt(e._safeAmountEb.string) : NaN;
!isFinite(t) || t <= 0 ? cc.vv.wc.showError("请输入有效金额") : e._safeDoTransfer(t);
});
r(n.getChildByName("wdBtn"), function() {
var t = e._safeAmountEb ? parseInt(e._safeAmountEb.string) : NaN;
!isFinite(t) || t <= 0 ? cc.vv.wc.showError("请输入有效金额") : e._safeDoTransfer(-t);
});
r(n.getChildByName("closeBtn"), function() {
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
this._clubShowConfirm("清空牌桌", "确定清空「" + (e.name || "") + "」?将解散房间并踢出所有玩家", function() {
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
this._clubShowConfirm("删除牌桌", "确定删除「" + (e.name || "") + "」?删除后不可恢复", function() {
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
e._uid = t;
e._seatName = i;
var s = e.getChildByName("chara"), o = e.getChildByName("charaF"), r = e.getChildByName("head");
if (s || o) if (t <= 0) {
s && (s.active = !1);
o && (o.active = !1);
r && (r.active = !1);
} else {
var c = this, l = function(i) {
var n = i && 2 === Number(i.sex), a = e._side || "下左", l = n && o ? o : s;
if (l && cc.isValid(l)) {
s && (s.active = !(n && o));
o && (o.active = !!n);
c._clubApplyFrame(l, "bbt_" + (n ? "女" : "男") + a);
if (r && cc.isValid(r)) {
r.active = !0;
var h = r.getChildByName("img");
if (h) {
var d = h.getComponent(cc.Sprite), u = h.getComponent("ImageLoader"), g = !(!u || u._userid !== "" + t || !u._spriteFrame);
d && !g && (c._clubHeadFrame ? d.spriteFrame = c._clubHeadFrame : cc.resources.load("images/other/head", cc.SpriteFrame, function(e, t) {
if (!e && t) {
c._clubHeadFrame = t;
!cc.isValid(d) || u && u._spriteFrame || (d.spriteFrame = t);
}
}));
u && u.setUserID(t);
}
}
}
}, h = cc.vv.baseInfoMap && cc.vv.baseInfoMap[t];
null != h && null != h.sex && Date.now() - (h.ts || 0) < 3e5 ? l(h) : cc.vv.http.sendRequest("/base_info", {
userid: t
}, function(e) {
if (e && !e.errcode) {
var i = e.headimgurl || null, n = i && /^avatar_\d{1,3}$/.test(i), a = {
name: e.name || "",
sex: e.sex,
localKey: n ? i : null,
url: i && !n ? i + ".jpg" : null,
ts: Date.now()
};
null == cc.vv.baseInfoMap && (cc.vv.baseInfoMap = {});
cc.vv.baseInfoMap[t] = a;
l(a);
} else l(null);
}, cc.vv.http.master_url);
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
var s = t(this._clubTableCardMap, e);
if (s) {
for (var o = e.seats || [], r = [ 0, 0, 0, 0, 0, 0 ], c = this._clubUidNames || (this._clubUidNames = {}), l = 0; l < o.length; ++l) {
var h = o[l].seatindex, d = o[l].userid || 0;
d > 0 && o[l].name && (c[d] = o[l].name);
var u = s.map && h >= 0 && h < s.map.length ? s.map[h] : h;
u >= 0 && u < r.length && (r[u] = d);
}
for (var g = 0; g < s.slots.length; ++g) this._clubSetSeat(s.slots[g], r[g], c[r[g]] || "");
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
var s = e._clubFind(cc.find("Canvas"), "tablesView");
e._clubTablesNode = s ? s.getChildByName("tables") : null;
if (!e._clubTablesNode) {
console.log("[俱乐部]tables容器缺失,无法渲染牌桌列表");
return;
}
}
var o = e._clubCardTpl();
o && (o.active = !1);
e._clubTablesNode.removeAllChildren();
var r = e._clubTablesNode.parent.width, c = o ? o.width : 360, l = Math.max(1, Math.ceil(i.length / 2));
e._clubTablesNode.width = Math.max(r, l * (c + 5) + 5);
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
for (var i = "object" == typeof t && t.gameType || null, n = this, a = null, s = 0; s < e.length; ++s) {
var o = e[s];
if (i) {
var r = o.game_type || o.type;
if (r && r != i) continue;
}
if ((Number(o.player_count) || 0) < this._clubMaxPlayers(o)) {
a = o;
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
var t = this, i = cc.vv.wc, n = Date.now(), a = this._gemsCache, s = function(n) {
t._gemsCache = {
gems: n,
at: Date.now()
};
if (n > 0) t._doEnterTable(e); else {
i.hide();
t._clubShowConfirm("提示", "宝宝豆不足，无法进入桌面", null);
}
};
if (a && n - a.at < 5e3) s(a.gems); else {
i.show("正在进入「" + e.name + "」");
cc.vv.http.sendRequest("/get_user_status", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(e) {
var t = e && null != e.gems ? Number(e.gems) : 0;
s(t);
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
baobao_mian: "6张免摆宝宝(最多6人)。每人发6张牌,系统自动遍历所有拆分,选出最大的一副牌型亮牌。\n· 牌型从大到小:6同花顺 > 4条带对 > 4条带2单 > 3条带3条 > 3条带对带1 > 6同花 > 6连顺 > 5同花带1 > 5连顺带1 > 3对 > 3组9 > 散牌。\n· 花色优先级:黑桃 > 红桃 > 梅花 > 方片。A在长顺里算最小(A23456的A当1)。\n· 血战模式:无庄,六家两两互比。\n· 各牌型倍率由管理后台设置。",
baobao_shou: "6张手动摆宝宝(最多6人)。每人发6张牌,自己摆成前2/中2/后2三道。\n· 单道规则:对子为宝,宝>散点(两牌相加取个位,9最大0最小);宝排序 宝A>宝K/Q/J>宝10~2。\n· 强制 前道≤中道≤后道,摆错为乌龙,三道全输(后台可关校验)。\n· 三道独立结算,每道按赢家道型倍率:宝A=10倍,宝K/Q/J=6倍,宝10~2=5倍,9点=4倍,8点=3倍,7点=2倍,6~0点=1倍(后台可配)。\n· 血战模式:无庄,六家两两互比。",
sss2: "十三水(2人)。52张牌每人13张,摆成头3/中5/尾5三道后与其他玩家逐道比牌。\n· 牌型从大到小:同花顺 > 铁支 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 对子 > 单张。\n· 必须头道≤中道≤尾道,顺序不符不允许提交。\n· 每赢一道+1注,三道全胜打枪再+3注;赢过全部对手为全垒打,每家再+3注。\n· 特殊牌型通吃:一条龙×3、六对半×4、三同花/三顺子×5、三分天下×6。\n· 摆牌限时,超时系统自动摆牌。",
sss4: "十三水(4人)。52张牌每人13张,摆成头3/中5/尾5三道后与其他玩家逐道比牌。\n· 牌型从大到小:同花顺 > 铁支 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 对子 > 单张。\n· 必须头道≤中道≤尾道,顺序不符不允许提交。\n· 每赢一道+1注,三道全胜打枪再+3注;赢过全部对手为全垒打,每家再+3注。\n· 特殊牌型通吃:一条龙×3、六对半×4、三同花/三顺子×5、三分天下×6。\n· 摆牌限时,超时系统自动摆牌。"
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
var t = this.node.getChildByName("global"), i = t ? t.getChildByName("main") : null, n = i ? i.getChildByName("bg") : this.node.getChildByName("bg"), a = i ? i.getChildByName("user") : null, s = a ? a.getChildByName("用户栏-底") : null, o = null;
if (n) {
var r = function() {
if (cc.isValid(n)) {
if (null == o && cc.isValid(s) && a) {
var e = s.x - s.width * s.anchorX;
o = {};
for (var t = 0; t < a.children.length; t++) {
var i = a.children[t];
i !== s && (o[i.name] = i.x - i.width * i.anchorX - e);
}
}
var r = n.getComponent(cc.Widget);
r && (r.enabled = !1);
var c = cc.view.getVisibleSize(), l = cc.view.getVisibleOrigin();
n.setContentSize(c.width, c.height);
n.setPosition(n.parent.convertToNodeSpaceAR(cc.v2(l.x + c.width / 2, l.y + c.height / 2)));
if (cc.isValid(s)) {
var h = s.getComponent(cc.Widget);
h && (h.enabled = !1);
s.setContentSize(c.width, s.height);
var d = s.parent.convertToNodeSpaceAR(cc.v2(l.x + c.width / 2, 0));
s.setPosition(d.x, s.y);
for (var u = s.x - s.width * s.anchorX, g = 0; g < a.children.length; g++) {
var v = a.children[g];
if (v !== s) {
var _ = o[v.name];
if (null != _) {
var f = v.getComponent(cc.Widget);
f && (f.enabled = !1);
v.x = u + _ + v.width * v.anchorX;
}
}
}
}
}
};
r();
this.scheduleOnce(r, 0);
cc.view.setResizeCallback(r);
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
var c = cc.vv.userMgr.oldRoomId;
cc.log("roomold", c);
if (null != c) {
cc.vv.userMgr.oldRoomId = null;
cc.vv.userMgr.enterRoom(c);
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
_fmtGems: function(e) {
return (e = Math.round(100 * (Number(e) || 0)) / 100) % 1 == 0 ? String(e) : e.toFixed(2);
},
refreshInfo: function() {
var e = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
};
cc.vv.http.sendRequest("/get_user_status", e, function(e) {
0 !== e.errcode ? console.log(e.errmsg) : null != e.gems && (this.lblGems.string = this._fmtGems(e.gems));
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
for (var a = [], s = 0; s < n.length; ++s) {
var o = n[s];
null != o && null != o.target && (o._componentId ? cc.js._getClassById(o._componentId) && a.push(o) : o.component && cc.js.getClassByName(o.component) && a.push(o));
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
if ("btn_setting" == e.target.name) {
this.settingsWin.active = !0;
this._initVoiceSwitch();
} else "btn_help" == e.target.name ? this.openHelp() : "btn_xiaoxi" == e.target.name ? this.xiaoxiWin.active = !0 : "btn_zhanji" == e.target.name ? this.openZhanji() : "菜单-商城" == e.target.name ? this.onJoinGameClicked() : "菜单-分享" == e.target.name ? this.onShareLinkClicked() : "用户栏-默认头像" == e.target.name && this._showUserInfoPanel();
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
_initVoiceSwitch: function() {
var e = this.settingsWin;
if (e) {
var t = e.getChildByName("voiceSwitch");
if (!t) {
(t = new cc.Node("voiceSwitch")).parent = e;
t.setPosition(0, -200);
var i = new cc.Node("title");
i.parent = t;
i.setPosition(-190, 0);
var n = i.addComponent(cc.Label);
n.string = "语音";
n.fontSize = 26;
n.lineHeight = 30;
n.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
for (var a = [ [ "跟随玩家", "" ], [ "男声", "nan" ], [ "女声", "nv" ] ], s = 0; s < a.length; ++s) (function(e) {
var i = new cc.Node("opt" + e);
i.parent = t;
i.setPosition(120 * e - 60, 0);
i.setContentSize(110, 44);
var n = i.addComponent(cc.Graphics), s = new cc.Node("lb");
s.parent = i;
var o = s.addComponent(cc.Label);
o.string = a[e][0];
o.fontSize = 22;
o.lineHeight = 26;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
i._val = a[e][1];
i._g = n;
i._lb = o;
i.on(cc.Node.EventType.TOUCH_END, function() {
try {
cc.sys.localStorage.setItem("bb_voice", i._val);
} catch (e) {}
var e = cc.vv && cc.vv.userMgr && cc.vv.userMgr.sex || 1, n = i._val || (2 == e ? "nv" : "nan");
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("bb/" + n + "/begin.mp3");
t._refresh();
});
})(s);
t._refresh = function() {
var e = "";
try {
e = cc.sys.localStorage.getItem("bb_voice") || "";
} catch (e) {}
for (var i = 0; i < t.children.length; ++i) {
var n = t.children[i];
if (void 0 !== n._val && n._g) {
var a = n._val === e;
n._g.clear();
n._g.fillColor = a ? new cc.Color(30, 140, 60, 255) : new cc.Color(70, 70, 70, 255);
n._g.roundRect(-55, -22, 110, 44, 10);
n._g.fill();
n._g.strokeColor = a ? new cc.Color(255, 220, 90, 255) : new cc.Color(120, 120, 120, 255);
n._g.lineWidth = 2;
n._g.roundRect(-55, -22, 110, 44, 10);
n._g.stroke();
n._lb && (n._lb.node.color = a ? cc.Color.WHITE : new cc.Color(180, 180, 180, 255));
}
}
};
}
t._refresh();
}
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
for (var s = 0; s < n.length; s++) {
var o = this._winFind(t, "val" + s), r = o ? o.getComponent(cc.Label) : null;
if (r) {
r.string = a[s];
this._userInfoValueLabels[n[s]] = r;
}
}
this._refreshBindStatus(function() {
var t = e._userInfoValueLabels && e._userInfoValueLabels["账号"];
t && cc.isValid(t.node) && (t.string = e._bindAccount || "无");
});
var c = this._winFind(t, "btnRename");
if (c && cc.isValid(c)) {
if (!c._bbRenameBound) {
c._bbRenameBound = !0;
c.on(cc.Node.EventType.TOUCH_END, function() {
e._showRenameWin();
});
}
this._btnRename = c;
(function e(t) {
for (var i = t.children.slice(), n = 0; n < i.length; n++) i[n] !== c && "btnRename" === String(i[n].name).trim() ? i[n].destroy() : e(i[n]);
})(t);
}
}
},
_bindRenameWin: function() {
var e = cc.director.getScene();
if (e) {
var t = function(e, t) {
if (!e) return null;
for (var i = e.children, n = 0; n < i.length; ++n) if (String(i[n].name).trim() === t) return i[n];
return null;
}, i = function e(t, i) {
if (String(t.name).trim() === i) return t;
for (var n = t.children, a = 0; a < n.length; ++a) {
var s = e(n[a], i);
if (s) return s;
}
return null;
};
this._renameWin = t(e, "hallRenameWin") || i(e, "hallRenameWin");
if (this._renameWin) {
var n = t(this._renameWin, "panel");
if (n) {
var a = t(n, "renameInput"), s = null;
if (a) {
if (!(s = a.getComponent(cc.EditBox))) for (var o = 0; o < a.children.length && !(s = a.children[o].getComponent(cc.EditBox)); ++o) ;
if (s && (!s.textLabel || !s.placeholderLabel)) {
var r = i(a, "TEXT_LABEL"), c = i(a, "PLACEHOLDER_LABEL");
if (!s.textLabel && r) {
r.active = !0;
s.textLabel = r.getComponent(cc.Label);
}
!s.placeholderLabel && c && (s.placeholderLabel = c.getComponent(cc.Label));
}
}
this._renameInput = s || a;
var l = t(n, "btnOk"), h = t(n, "btnCancel"), d = this;
l && l.on(cc.Node.EventType.TOUCH_END, function() {
d._submitRename();
});
h && h.on(cc.Node.EventType.TOUCH_END, function() {
d._closeRenameWin();
});
this._renameBound = !0;
}
} else cc.log("[rename] 找不到 hallRenameWin");
}
},
_showRenameWin: function() {
this._renameWin && cc.isValid(this._renameWin) && this._renameBound || this._bindRenameWin();
if (this._renameWin) {
this._renameWin.active = !0;
var e = this._renameWin.getChildByName("mask");
e && (e.active = !0);
var t = this._renameWin.getChildByName("panel");
t && (t.active = !0);
if (this._renameInput) {
var i = this._renameInput.getComponent ? this._renameInput.getComponent(cc.EditBox) : this._renameInput;
i && (i.string = cc.vv.userMgr.userName || "");
}
this._renameWin.setSiblingIndex(9999);
}
},
_closeRenameWin: function() {
this._renameWin && (this._renameWin.active = !1);
},
_submitRename: function() {
var e = this, t = String(this._renameInput ? this._renameInput.string : "").trim();
if ("" !== t) if (t.length > 12) cc.vv.wc.showError("昵称最长12个字符"); else if (t !== cc.vv.userMgr.userName) {
cc.vv.wc.show("正在修改");
cc.vv.http.sendRequest("/set_name", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
name: t
}, function(i) {
if (i && 0 === i.errcode) {
cc.vv.wc.hide();
cc.vv.userMgr.userName = t;
e._closeRenameWin();
var n = e._userInfoValueLabels && e._userInfoValueLabels["名称"];
n && cc.isValid(n.node) && (n.string = t);
e.initLabels();
cc.vv.wc.showAlert("昵称修改成功");
} else cc.vv.wc.showError(i && i.errmsg ? i.errmsg : "修改失败");
}, cc.vv.http.master_url);
} else cc.vv.wc.showError("昵称未变化"); else cc.vv.wc.showError("请输入新昵称");
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
var s = function(i) {
if (i && cc.isValid(t)) for (var n = 0; n < 2; n++) {
var a = e._bindInputs["input" + n];
a && "" === String(a.string || "") && (a.string = i);
}
};
this._bindAccount ? s(this._bindAccount) : this._bindStatusLoaded || this._refreshBindStatus(function() {
s(e._bindAccount);
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
for (var a = i.children.slice(), s = 0; s < a.length; s++) a[s] && a[s] !== n && a[s].destroy();
this._avatarCells = [];
var o = this._avatarPool().slice();
if (e || !this._avatarShowKeys) {
for (var r = o.length - 1; r > 0; r--) {
var c = Math.floor(Math.random() * (r + 1)), l = o[r];
o[r] = o[c];
o[c] = l;
}
this._avatarShowKeys = o.slice(0, 12);
}
for (var h = this._avatarShowKeys, d = n ? n.width : 100, u = n ? n.height : 100, g = -(6 * d + 120) / 2 + d / 2, v = (u + 24) / 2, _ = n ? n.getComponent(cc.Sprite) : null, f = 0; f < h.length; f++) (function(e, n) {
var a = new cc.Node("cell_" + n);
a.setContentSize(d, u);
void 0 !== i.layer && (a.layer = i.layer);
a.parent = i;
a.setPosition(g + n % 6 * (d + 24), v - Math.floor(n / 6) * (u + 24));
var s = a.addComponent(cc.Sprite);
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
_ && _.spriteFrame && (s.spriteFrame = _.spriteFrame);
cc.resources.load("images/avatars/" + e, cc.SpriteFrame, function(e, t) {
cc.isValid(a) && t && (s.spriteFrame = t);
});
var o = new cc.Node("selFrame");
a.addChild(o);
var r = o.addComponent(cc.Graphics);
a._key = e;
a._frame = r;
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
cc.isValid(this.lblGems) && (this.lblGems.string = this._fmtGems(cc.vv.userMgr.gems));
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
cc.vv.fromClub = !1;
cc.vv.fromClubId = null;
if (cc.vv.gameNetMgr) {
cc.vv.gameNetMgr.roomBackScene = "";
cc.vv.gameNetMgr.roomBackClubId = null;
}
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
_makeLabel: function(e, t, i, n, a, s) {
var o = new cc.Node("label");
o.parent = e;
var r = o.addComponent(cc.Label);
r.string = t;
r.fontSize = i;
r.color = s || cc.Color.WHITE;
o.setPosition(n, a);
return r;
},
_makeEditBox: function(e, t, i, n, a, s, o, r, c) {
var l = new cc.Node(t + "_bg");
l.parent = e;
l.setContentSize(a, s);
l.setPosition(i, n);
var h = l.addComponent(cc.Graphics);
this._drawRoundRect(h, a, s, 8, new cc.Color(60, 64, 76, 255));
var d = new cc.Node(t);
d.parent = e;
d.setContentSize(a, s);
d.setPosition(i, n);
d.addComponent(cc.Sprite);
var u = d.addComponent(cc.EditBox), g = new cc.Node("TEXT_LABEL");
g.parent = d;
var v = g.addComponent(cc.Label);
v.fontSize = 26;
v.color = cc.Color.WHITE;
var _ = new cc.Node("PLACEHOLDER_LABEL");
_.parent = d;
var f = _.addComponent(cc.Label);
f.fontSize = 26;
f.color = new cc.Color(150, 150, 150, 255);
u.textLabel = v;
u.placeholderLabel = f;
u.placeholder = r || "";
u.inputMode = c && c.inputMode ? c.inputMode : cc.EditBox.InputMode.NUMERIC;
c && c.password && (u.inputFlag = cc.EditBox.InputFlag.PASSWORD);
c && c.maxLength && (u.maxLength = c.maxLength);
u.string = o;
return u;
},
_makeTextButton: function(e, t, i, n, a, s, o, r, c) {
var l = new cc.Node(t);
l.parent = e;
l.setContentSize(s, o);
l.setPosition(n, a);
var h = l.addComponent(cc.Graphics);
this._drawRoundRect(h, s, o, 10, r);
var d = new cc.Node("text");
d.parent = l;
var u = d.addComponent(cc.Label);
u.string = i;
u.fontSize = 28;
u.color = cc.Color.WHITE;
l._btnLabel = u;
l.on(cc.Node.EventType.TOUCH_END, function() {
cc.isValid(l) && c(l);
});
return l;
},
_openCreateWin: function(e, t) {
var i = this;
this._closeCreateWin();
var n = cc.find("Canvas");
if (n) {
var a = cc.view.getVisibleSize(), s = new cc.Node("hallCreateWin");
s.parent = n;
s.setContentSize(a.width, a.height);
var o = new cc.Node("mask");
o.parent = s;
o.setContentSize(a.width, a.height);
var r = o.addComponent(cc.Graphics);
r.fillColor = new cc.Color(0, 0, 0, 160);
r.rect(-a.width / 2, -a.height / 2, a.width, a.height);
r.fill();
o.addComponent(cc.BlockInputEvents);
this._createWin = s;
this._createClub = e;
this._createGames = t;
this._createSelGame = t[0];
var c = new cc.Node("panel");
c.parent = s;
c.setContentSize(720, 840);
var l = c.addComponent(cc.Graphics);
this._drawRoundRect(l, 720, 840, 16, new cc.Color(30, 34, 44, 245));
this._makeLabel(c, "创建房间", 36, 0, 370);
this._makeLabel(c, "俱乐部：" + (e.name || ""), 22, 0, 322, new cc.Color(180, 180, 180, 255));
this._makeLabel(c, "玩法：", 26, -300, 240);
this._createGameBtns = [];
for (var h = 0; h < t.length; h++) (function(e) {
var n = t[e], a = 180 * e - 210, s = i._makeTextButton(c, "game_" + e, n.name || n.game_type, a, 240, 160, 64, new cc.Color(70, 76, 92, 255), function() {
i._createSelGame = n;
i._refreshCreateGameBtns();
i._fillCreateDefaults();
});
s._game = n;
i._createGameBtns.push(s);
})(h);
this._makeLabel(c, "玩法简介：", 22, -290, 165, new cc.Color(120, 170, 255, 255));
var d = new cc.Node("createIntro");
d.parent = c;
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
var _ = -80 - 80 * v;
this._makeLabel(c, g[v][0], 26, -210, _);
this._createInputs[g[v][1]] = this._makeEditBox(c, g[v][1], 100, _, 300, 56, "0", "");
}
this._makeTextButton(c, "btnOk", "确定", -140, -380, 200, 72, new cc.Color(41, 121, 211, 255), function() {
i._submitCreateWin();
});
this._makeTextButton(c, "btnCancel", "取消", 140, -380, 200, 72, new cc.Color(90, 94, 106, 255), function() {
i._closeCreateWin();
});
this._refreshCreateGameBtns();
this._fillCreateDefaults();
}
},
_refreshCreateGameBtns: function() {
for (var e = this._createGameBtns || [], t = 0; t < e.length; t++) {
var n = e[t], a = n._game === this._createSelGame, s = n.getComponent(cc.Graphics);
this._drawRoundRect(s, n.width, n.height, 10, a ? new cc.Color(41, 121, 211, 255) : new cc.Color(70, 76, 92, 255));
}
if (this._createIntroLabel && this._createSelGame) {
var o = this._createSelGame.game_type || this._createSelGame.type;
this._createIntroLabel.string = i[o] || "该玩法暂无说明。";
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
for (var s = t.jushu_options || [], o = parseInt(n(this._createInputs.jushuInput)), r = -1, c = 0; c < s.length; c++) if (Number(s[c]) === o) {
r = c;
break;
}
if (r < 0) cc.vv.wc.showError("局数只能为：" + (s.length ? s.join(" / ") : "玩法未配置")); else {
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
jushuxuanze: r,
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
var s = this._findBtnRoot();
if (s) {
s.active = !1;
this._loginBtnRoot = s;
var o = s.getChildByName("btn_yk");
o && (o.active = !0);
var r = s.getChildByName("button1");
if (r) {
r.active = !(cc.vv.SI && 0 === cc.vv.SI.wxlogin);
cc.vv.utils.addClickEvent(r, this.node, "login", "onBtnWechatClicked");
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
var s = e("VoiceMgr");
cc.vv.voiceMgr = new s();
cc.vv.voiceMgr.init();
var o = e("AudioMgr");
if (!cc.vv.audioMgr) {
cc.vv.audioMgr = new o();
cc.vv.audioMgr.init();
}
if (!cc.Node.prototype._bbBtnSoundHooked) {
cc.Node.prototype._bbBtnSoundHooked = !0;
var r = cc.Node.prototype.emit;
cc.Node.prototype.emit = function(e) {
if ("touch-end" === e && cc.vv && cc.vv.audioMgr) {
var t = this.getComponent ? this.getComponent(cc.Button) : null;
(t && !1 !== t.interactable || /^btn/i.test(this.name) || /button/i.test(this.name)) && cc.vv.audioMgr.playSFX("btnClick.wav");
}
return r.apply(this, arguments);
};
}
var c = e("Utils");
cc.vv.utils = new c();
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
var s = n[a].substr(0, i), o = n[a].substr(i + 1);
e[s] = o;
}
return e;
},
_checkVersion: function() {
var e = this, t = null, i = !1, n = function(t) {
t && null != t.version && (cc.vv.SI = t);
var i = e._findBtnRoot(), n = i ? i.getChildByName("button1") : null;
n && (n.active = !(cc.vv.SI && 0 === cc.vv.SI.wxlogin));
}, a = 0, s = function() {
a++;
t = cc.vv.http.sendRequest("/get_serverinfo", null, function(e) {
t = null;
i = !0;
n(e);
}, cc.vv.http.master_url);
setTimeout(o, 5e3);
}, o = function() {
if (!i) if (t) {
t.abort();
a < 3 && setTimeout(function() {
s();
}, 5e3);
} else a < 3 && s();
};
o();
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
var s = new cc.Node("barBg");
s.setContentSize(520, 24);
i.addChild(s);
var o = new cc.Node("barFill");
o.setPosition(-250, 0);
i.addChild(o);
var r = new cc.Node("pct");
r.setPosition(0, -34);
i.addChild(r);
var c = r.addComponent(cc.Label);
c.string = "0%";
c.fontSize = 22;
c.lineHeight = 26;
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
var a = 0, s = 0;
for (var o in g) {
a += g[o].c;
s += g[o].t;
}
e._drawLoadProgress(s > 0 ? a / s : 0);
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
var a = n ? this._findChildByName(n, "pwdAcc") : t ? this._findChildByName(t, "pwdAcc") : null, s = n ? this._findChildByName(n, "pwdPwd") : t ? this._findChildByName(t, "pwdPwd") : null;
this._pwdAccBox = a ? a.getComponent(cc.EditBox) : null;
this._pwdPwdBox = s ? s.getComponent(cc.EditBox) : null;
if (!this._pwdAccBox && !this._pwdPwdBox && t) {
var o = t.getComponentsInChildren(cc.EditBox);
if (o.length >= 2) {
this._pwdAccBox = o[0];
this._pwdPwdBox = o[1];
}
}
if (n) {
var r = this._findChildByName(n, "btnLogin");
r && r.on(cc.Node.EventType.TOUCH_END, function() {
e._submitPwdLogin();
});
var c = this._findChildByName(n, "btnCancel");
c && c.on(cc.Node.EventType.TOUCH_END, function() {
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
var s = a.addComponent(cc.Graphics);
s.fillColor = cc.color(0, 0, 0, 170);
s.rect(-1e3, -1e3, 2e3, 2e3);
s.fill();
n.addChild(a);
a.on(cc.Node.EventType.TOUCH_END, function() {
n.active = !1;
});
var o = new cc.Node("panel");
o.setContentSize(t, i);
var r = o.addComponent(cc.Graphics);
r.fillColor = cc.color(255, 255, 255, 255);
r.roundRect(-310, -200, t, i, 16);
r.fill();
r.strokeColor = cc.color(180, 180, 180, 255);
r.lineWidth = 2;
r.roundRect(-310, -200, t, i, 16);
r.stroke();
n.addChild(o);
var c = new cc.Node("title");
c.setPosition(0, 150);
c.addComponent(cc.Label);
var l = c.getComponent(cc.Label);
l.fontSize = 32;
l.lineHeight = 38;
l.string = "账号登录";
c.color = cc.color(40, 40, 40, 255);
o.addChild(c);
this._pwdAccBox = this._makePwdBox(o, "pwdAcc", 62, "请输入账号", !1);
this._pwdPwdBox = this._makePwdBox(o, "pwdPwd", -14, "请输入密码", !0);
var h = this._findBtnRoot(), d = h ? h.getChildByName("btn_yk") : null, u = d && d.getComponent(cc.Sprite) ? d.getComponent(cc.Sprite).spriteFrame : null;
this._makePwdBtn(o, "btnLogin", 100, -118, "登录", u, function() {
var t = (e._pwdAccBox && e._pwdAccBox.string || "").trim(), i = (e._pwdPwdBox && e._pwdPwdBox.string || "").trim();
if (t && i) {
n.active = !1;
cc.vv.userMgr.pwdAuth(t, i);
} else cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError("请输入账号和密码");
});
this._makePwdBtn(o, "btnCancel", -100, -118, "取消", u, function() {
n.active = !1;
});
this._pwdWin = n;
}
},
_makePwdBox: function(e, t, i, n, a) {
var s = new cc.Node(t);
s.setContentSize(440, 64);
s.setPosition(0, i);
e.addChild(s);
var o = s.addComponent(cc.Graphics);
o.fillColor = cc.color(245, 245, 245, 255);
o.roundRect(-220, -32, 440, 64, 10);
o.fill();
o.strokeColor = cc.color(200, 200, 200, 255);
o.lineWidth = 2;
o.roundRect(-220, -32, 440, 64, 10);
o.stroke();
var r = new cc.Node("textLabel");
r.setContentSize(420, 64);
r.setAnchorPoint(0, .5);
r.setPosition(-210, 0);
r.addComponent(cc.Label);
var c = r.getComponent(cc.Label);
c.fontSize = 26;
c.lineHeight = 32;
c.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
r.color = cc.color(30, 30, 30, 255);
s.addChild(r);
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
s.addChild(l);
var d = s.addComponent(cc.EditBox);
d.textLabel = c;
d.placeholderLabel = h;
d.placeholder = n;
d.maxLength = 24;
a && (d.inputFlag = cc.EditBox.InputFlag.PASSWORD);
return d;
},
_makePwdBtn: function(e, t, i, n, a, s, o) {
var r = new cc.Node(t);
r.setContentSize(200, 72);
r.setPosition(i, n);
e.addChild(r);
var c = r.addComponent(cc.Sprite);
c.sizeMode = cc.Sprite.SizeMode.CUSTOM;
s && (c.spriteFrame = s);
var l = new cc.Node("lbl");
l.addComponent(cc.Label);
var h = l.getComponent(cc.Label);
h.string = a;
h.fontSize = 28;
h.lineHeight = 34;
l.color = cc.color(255, 255, 255, 255);
r.addChild(l);
r.on(cc.Node.EventType.TOUCH_END, o);
return r;
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
}, {}, [ "use_v2.0.x_cc.Toggle_event", "BBGame", "clubAdmin", "clubScene", "GPGame", "Alert", "CheckBox", "CreateRoom", "HallHelp", "History", "ImageLoader", "JoinGameInput", "hall", "setting", "Lodinglogin", "login", "Chat", "DeskStyle", "DingQue", "Folds", "GameOver", "GameOverZP", "GameResult", "GameResultZP", "HuanSanZhang", "MJGameBMJ", "MJGameLDH", "MJGameWujin", "MJGameZJLAO", "MJGameZJZX", "MJGameZP", "MJGameZP4", "MJRoom", "NoticeTip", "PengGangs", "PopupMgr", "RadioButton", "RadioGroupMgr", "ReConnect", "ReplayCtrl", "Seat", "TimePointer", "UserInfoShow", "Voice", "SSSGame" ]);