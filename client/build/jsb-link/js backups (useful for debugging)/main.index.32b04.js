window.__require = function e(t, i, n) {
function a(o, r) {
if (!i[o]) {
if (!t[o]) {
var l = o.split("/");
l = l[l.length - 1];
if (!t[l]) {
var c = "function" == typeof __require && __require;
if (!r && c) return c(l, !0);
if (s) return s(l, !0);
throw new Error("Cannot find module '" + o + "'");
}
o = l;
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
var r = n[s] + a[o], l = h(r);
l && (e._cardFrames[r] = l);
}
e._cardBack = h("card_back");
e._arrangeRoot && e._arrangeRoot.active && e._renderArrange();
if (e._n.resultPanel && e._n.resultPanel.active && e._lastResults) {
var c = e._renderSettleCards(e._lastResults, e._lastDetails);
e._n.resultContent && (e._n.resultContent.active = !c);
}
e._confirmRoot && e._confirmRoot.active && e._renderConfirmPreview();
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
try {
this.getComponent("DeskStyle") || this.addComponent("DeskStyle");
} catch (e) {
console.error("[BB] DeskStyle 挂载失败: " + (e && e.message || e));
}
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
this._initUserInfo();
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
e.bbWatermark = this.findNode(t, "bbWatermark");
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
for (var n = this.findNode(i, "icon"), a = this.findNode(i, "name"), s = this.findNode(i, "score"), o = this.findNode(i, "bbZhuang"), r = this.findNode(i, "ready"), l = [], c = [], h = 0; h < 3; ++h) {
for (var d = 0; d < 2; ++d) {
var u = this.findNode(i, "bbCard" + (2 * h + d));
if (u) {
u.active = !1;
l.push(u);
}
}
var g = this.findNode(i, "bbDao" + h);
c.push(g);
}
var v = this.findNode(i, "bbSummary");
o && (o.active = !1);
var _ = this.findNode(i, "bbRowCards");
_ && (_.active = !1);
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
slots: l,
rowCards: _,
rowSlots: function() {
for (var e = [], t = 0; t < 6; ++t) {
var n = this.findNode(i, "bbRowCard" + t);
n && (n.zIndex = t);
e.push(n);
}
return e;
}.call(this),
daoLabels: c,
summary: v,
bubble: this.findNode(i, "bbBubble"),
mianType: this.findNode(i, "bbMianType")
};
(function(e, t) {
t && this.bindButton(t, function() {
this.onSeatIconClick(this._seatNodes[e]);
}, this);
}).call(this, t, n);
}
},
_initUserInfo: function() {
var e = cc.find("Canvas/userinfo") || this.findNode(this.node, "userinfo");
this._userinfo = e;
if (e) {
var t = e.getComponent(cc.Widget);
t && (t.enabled = !1);
e.active = !1;
this.bindButton(e, this.onUserInfoClose, this);
}
},
onUserInfoClose: function() {
this._userinfo && (this._userinfo.active = !1);
},
onSeatIconClick: function(e) {
var t = this._userinfo;
if (t && e && Number(e._uid) > 0) {
t.active = !0;
t.setSiblingIndex(9999);
this._userinfoUserId = Number(e._uid) || 0;
if (this._dynEmojiList) {
this._dynEmojiList.active = !0;
this._dynEmojiList.setSiblingIndex(t.children.length - 1);
}
var i = e.icon ? e.icon.getComponent(cc.Sprite) : null, n = this.findNode(t, "icon");
if (n && i) {
var a = n.getComponent(cc.Sprite);
a && (a.spriteFrame = i.spriteFrame);
}
this.setStr(this.findNode(t, "name"), e._uname || "");
this.setStr(this.findNode(t, "ip"), "IP: " + String(e._ip || "").replace("::ffff:", ""));
this.setStr(this.findNode(t, "id"), "ID: " + e._uid);
var s = this.findNode(t, "sex_female");
s && (s.active = 2 == e._sex);
var o = this.findNode(t, "sex_male");
o && (o.active = 1 == e._sex);
this._placeUserInfo(t, e);
}
},
_placeUserInfo: function(e, t) {
var i = e.getChildByName("public_frame_a") || e, n = t.icon, a = e.parent;
if (n && a) {
var s, o, r = i.getBoundingBoxToWorld(), l = n.getBoundingBoxToWorld();
if (this._watching || t !== this._seatNodes[0]) {
s = t === this._seatNodes[4] || t === this._seatNodes[5] ? l.x + l.width - r.width : l.x;
o = l.y - 10 - r.height;
} else {
s = l.x + l.width / 2 - r.width / 2;
o = l.y + l.height + 10;
}
var c = a.convertToNodeSpaceAR(cc.v2(r.x, r.y)), h = a.convertToNodeSpaceAR(cc.v2(s, o));
e.x += h.x - c.x;
e.y += h.y - c.y;
}
},
_setSeatCardsVisible: function(e) {
if (e && this._isArrangeTurn()) this._applyArrangeSeatVisible(); else {
for (var t = [], i = 0; i < this._seatNodes.length; ++i) {
var n = this._seatNodes[i];
if (n) {
n.cardsNode && (n.cardsNode.active = !!e);
!e && n.rowCards && (n.rowCards.active = !1);
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
for (var l = 0; l < 6; ++l) {
var c = this.findNode(e, "bbArrHand" + l);
this._arrangeHandSlots.push(c);
this._arrangeHandHome.push(c ? {
x: c.x,
y: c.y,
sx: c.scaleX,
sy: c.scaleY
} : null);
c && (c.zIndex = l);
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
this._confirmPreview = this.findNode(e, "bbConfirmPreview");
this._confirmSlots = [];
for (var t = 0; t < 6; ++t) {
var i = this.findNode(e, "bbConfirmCard" + t);
this._confirmSlots.push(i);
i && (i.zIndex = t);
}
var n = this.findNode(e, "bbConfirmTypeLabel");
this._confirmTypeLabel = n ? n.getComponent(cc.Label) : null;
this._confirmTypeLabel && (this._confirmTypeLabel.string = "");
e.active = !1;
}
},
_renderConfirmPreview: function() {
if (this._confirmRoot && this._confirmRoot.active) {
var e = cc.vv && cc.vv.gameNetMgr, t = e && e.bbMyMian, i = t && t.cards, n = !!(i && i.length >= 6);
this._confirmPreview && (this._confirmPreview.active = n);
this._confirmTypeLabel && (this._confirmTypeLabel.string = n && t.typeName || "");
if (n && this._confirmSlots) for (var a = 0; a < this._confirmSlots.length; ++a) {
var s = this._confirmSlots[a].getComponent(cc.Sprite);
s && (s.spriteFrame = this.frameOf(i[a]) || this._cardBack || null);
}
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
var e = cc.find("Canvas/popups/settings");
this._settingsRoot = e;
this._deskBgBtn = e ? e.getChildByName("btn_desk_bg") : null;
this.bindButton(this._deskBgBtn, this.onDeskBgClick, this);
this.bindButton(cc.find("Canvas/btn_settings"), this.onBtnSettingsClicked, this);
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
for (var t = 0; t < 3; ++t) (function(e, t) {
this.bindButton(t, function() {
this.onDaoTap(e);
}, this);
}).call(this, t, this._arrangeDelBtns && this._arrangeDelBtns[t]);
var i = this._seatNodes[0];
if (i && i.slots) for (var n = 0; n < 6; ++n) (function(e, t) {
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
})(n, i.slots[n]);
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
a._switchChatTab(!0);
n.active = !0;
}, this);
this._chatQuickList = this.findNode(n, "quickchatlist");
this._chatEmojiList = this.findNode(n, "emojis");
this._dynEmojiList = this.findNode(this._userinfo, "emojis");
if (!this._chatEmojiList && this._dynEmojiList) {
var o = cc.instantiate(this._dynEmojiList);
o.name = "emojisStatic";
o.active = !1;
n.addChild(o);
o.getComponentsInChildren(cc.Widget).forEach(function(e) {
e.destroy();
});
var r = this.findNode(n, "chat_emojibg"), l = r ? r.width : 920, c = r ? r.height : 460, h = this._dynEmojiList.width || 1400, d = this._dynEmojiList.height || 700;
o.scale = .98 * Math.min(l / h, c / d);
o.setPosition(r ? r.x : 0, r ? r.y : -20);
this._chatEmojiList = o;
console.log("[BB] 聊天静态表情面板已克隆: scale=" + o.scale.toFixed(2));
}
var u = this.findNode(n, "tabQuick"), g = this.findNode(n, "tabEmoji");
this.bindButton(u, function() {
a._switchChatTab(!0);
}, this);
this.bindButton(g, function() {
a._switchChatTab(!1);
}, this);
var v = this.findNode(n, "iptChat");
this._chatIpt = v ? v.getComponent(cc.EditBox) : null;
var _ = [];
(function e(t) {
"btnSend" === t.name && _.push(t);
(t.children || []).forEach(e);
})(n);
_.forEach(function(e) {
e.width <= 60 ? a.bindButton(e, function() {
n.active = !1;
}, a) : a.bindButton(e, function() {
a._sendChatInput();
}, a);
});
if (v) {
v.on("editing-return", function() {
a._sendChatInput();
});
v.on("editing-did-ended", function() {
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
this._emojiSpine = {};
this._emojiPanelBuilt = !1;
this._loadEmojiSpines();
this._setupUserInfoEmoji();
var f = this;
cc.resources.load("images/chat/emoji_action_texture", cc.SpriteAtlas, function(e, t) {
if (t) {
t.getSpriteFrames().forEach(function(e) {
f._emojiFrames[e.name + ".png"] = e;
f._emojiFrames[e.name] = e;
});
f._emojiAtlasLoaded = !0;
} else f._emojiAtlasLoaded = !1;
});
cc.resources.load("images/chat/chat_emojibg.png", cc.SpriteFrame, function(e, t) {
t && (f._chatBgFrame = t);
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
ctor: function() {
this._emojiSpineNames = [ "yihuo", "kuaidian", "zhenbang", "aini", "daxiao", "yunle", "yishoulanpai", "dengchang", "jingle", "huaixiao", "keshui", "886", "wolaile", "dalaozaici", "biepao" ];
},
_loadEmojiSpines: function() {
var e = this, t = this._emojiSpineNames;
(function i(n) {
if (n >= t.length) {
console.log("[BB] 动态表情骨骼加载完成=" + Object.keys(e._emojiSpine).length);
e._buildEmojiPanel();
} else cc.resources.load("anims/smile/" + t[n], sp.SkeletonData, function(a, s) {
s ? e._emojiSpine[t[n]] = s : console.log("[BB] 表情骨骼缺失: " + t[n], a);
i(n + 1);
});
})(0);
},
_emojiSpineSize: function(e) {
var t = e && e.skeletonJson && e.skeletonJson.skeleton;
return {
w: t && t.width || 240,
h: t && t.height || 270
};
},
_emojiBounds: function(e) {
if (!e) return {
minX: -120,
minY: 0,
maxX: 120,
maxY: 270
};
if (e.__emojiBounds) return e.__emojiBounds;
var t = this._emojiSpineSize(e), i = {
minX: -t.w / 2,
minY: 0,
maxX: t.w / 2,
maxY: t.h
}, n = e.skeletonJson;
if (!n || !n.bones || !n.slots) {
e.__emojiBounds = i;
return i;
}
var a = {};
n.bones.forEach(function(e) {
a[e.name] = e;
});
var s = {};
function o(e) {
if (s[e]) return s[e];
var t = a[e];
if (!t) return s[e] = {
x: 0,
y: 0,
rot: 0
};
var i = t.x || 0, n = t.y || 0, r = t.rotation || 0, l = t.parent ? o(t.parent) : {
x: 0,
y: 0,
rot: 0
}, c = l.rot * Math.PI / 180;
return s[e] = {
x: l.x + i * Math.cos(c) - n * Math.sin(c),
y: l.y + i * Math.sin(c) + n * Math.cos(c),
rot: l.rot + r
};
}
function r(e, t, i) {
var n = o(e), a = n.rot * Math.PI / 180;
return {
x: n.x + t * Math.cos(a) - i * Math.sin(a),
y: n.y + t * Math.sin(a) + i * Math.cos(a)
};
}
var l = 1e9, c = 1e9, h = -1e9, d = -1e9;
function u(e) {
e.x < l && (l = e.x);
e.x > h && (h = e.x);
e.y < c && (c = e.y);
e.y > d && (d = e.y);
}
var g = n.skins || {}, v = g.default || g[Object.keys(g)[0]] || {};
n.slots.forEach(function(e) {
var t = v[e.name];
if (t) {
var i = t[e.attachment];
if (i) {
var a = i.vertices;
if (a) for (var s = 0; s < a.length; ) {
var l = a[s++];
if (l > 0 && l <= 4) {
for (var c = 0, h = 0, d = 0, g = 0; g < l; ++g) {
var _ = a[s++], f = a[s++], m = a[s++], p = a[s++], b = r((n.bones[_] || {}).name, f, m);
c += b.x * p;
h += b.y * p;
d += p;
}
if (d > 0) {
c /= d;
h /= d;
}
u({
x: c,
y: h
});
} else {
s -= 1;
var C = a[s++], y = a[s++];
u(r(e.bone, C, y));
}
} else if (null != i.width && null != i.height) {
var S = i.width / 2 * (null == i.scaleX ? 1 : i.scaleX), N = i.height / 2 * (null == i.scaleY ? 1 : i.scaleY), B = ((o(e.bone).rot || 0) + (i.rotation || 0)) * Math.PI / 180, M = i.x || 0, w = i.y || 0;
[ [ -S, -N ], [ S, -N ], [ S, N ], [ -S, N ] ].forEach(function(t) {
u(r(e.bone, M + t[0] * Math.cos(B) - t[1] * Math.sin(B), w + t[0] * Math.sin(B) + t[1] * Math.cos(B)));
});
}
}
}
});
var _ = l > h ? i : {
minX: l,
minY: c,
maxX: h,
maxY: d
};
e.__emojiBounds = _;
return _;
},
_buildEmojiPanel: function() {
var e = this._dynEmojiList;
if (!this._emojiPanelBuilt && e) {
var t = e.children && e.children[0];
if (t && t.children && t.children.length) {
this._emojiPanelBuilt = !0;
var i = this, n = t.children.slice(), a = [];
this._emojiStaticOf = {};
n.forEach(function(e, t) {
var n = i._emojiSpineNames[t];
if (n) {
var s = e.width, o = e.height;
a.push({
x: e.x,
y: e.y,
name: n
});
i._emojiFrames && i._emojiFrames[e.name] && (i._emojiStaticOf[n] = i._emojiFrames[e.name]);
var r = e.getComponent(cc.Button);
r && (r.enabled = !1);
e.off(cc.Node.EventType.TOUCH_END);
var l = i._emojiSpine[n];
if (l) {
var c = i._emojiSpineSize(l), h = e.getComponent(cc.Sprite);
h && (h.enabled = !1);
var d = new cc.Node("skel");
d.parent = e;
var u = .9 * Math.min(s / c.w, o / c.h), g = i._emojiBounds(l);
d.setPosition(-(g.minX + g.maxX) / 2 * u, -(g.minY + g.maxY) / 2 * u);
d.scale = u;
var v = d.addComponent(sp.Skeleton);
v.skeletonData = l;
v.setAnimation(0, "animation", !0);
}
}
});
if (a.length) {
var s = e;
s.off(cc.Node.EventType.TOUCH_END);
s.on(cc.Node.EventType.TOUCH_END, function(e) {
for (var n = t.convertToNodeSpaceAR(cc.v2(e.getLocation())), s = null, o = 1e9, r = 0; r < a.length; ++r) {
var l = n.x - a[r].x, c = n.y - a[r].y, h = l * l + c * c;
if (h < o) {
o = h;
s = a[r];
}
}
if (s) {
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("btnClick.wav");
i._onEmojiPicked(s.name);
}
});
console.log("[BB] 表情区点击已绑定 格子=" + a.length + " 骨骼=" + Object.keys(this._emojiSpine).length);
}
}
}
},
_setupUserInfoEmoji: function() {
var e = this._dynEmojiList, t = this._userinfo;
if (e && t && cc.isValid(e) && cc.isValid(t)) {
e.getComponent(cc.BlockInputEvents) || e.addComponent(cc.BlockInputEvents);
e.setSiblingIndex(t.children.length - 1);
var i = this.findNode(t, "closeBtn");
i && this.bindButton(i, this.onUserInfoClose, this);
var n = this.findNode(t, "x");
n && this.bindButton(n, this.onUserInfoClose, this);
}
},
_onEmojiPicked: function(e) {
e && this._sendDynEmoji(e);
},
_sendDynEmoji: function(e) {
var t = this._userinfoUserId;
t && this._playEmojiOnAvatar(t, e);
cc.vv && cc.vv.net && !this._replay && cc.vv.net.send("emoji", {
name: e,
free: !1,
target: t
});
this.onUserInfoClose();
},
_spawnSeatEmoji: function(e, t, i) {
var n = this._seatNodes[e], a = n && n.root ? n.root : this.findNode(this.node, "bbSeat" + e);
if (!a) return null;
var s = this.findNode(a, "icon") || a, o = this._emojiSpine && this._emojiSpine[t];
if (!o) return null;
var r = s.getChildByName("emoteSpine");
r && r.destroy();
var l = this._emojiSpineSize(o), c = this._emojiBounds(o), h = s.getBoundingBoxToWorld(), d = h.width > 0 ? h.width : 120, u = h.height > 0 ? h.height : d, g = d / l.w * 1.8, v = new cc.Node("emoteSpine");
v.parent = this.node;
v.zIndex = 9999;
v.setSiblingIndex(this.node.children.length - 1);
var _ = s.convertToWorldSpaceAR(cc.v2(0, 0)), f = this.node.convertToNodeSpaceAR(_), m = (c.minX + c.maxX) / 2 * g, p = (c.minY + c.maxY) / 2 * g;
f.x -= m;
3 === e ? f.y = f.y + u / 2 - c.maxY * g : f.y -= p;
v.setPosition(f);
v.scale = g;
var b = v.addComponent(sp.Skeleton);
b.skeletonData = o;
b.setAnimation(0, "animation", !!i);
return v;
},
_playEmojiOnAvatar: function(e, t) {
var i = this._slotIdxOfUser(e);
if (!(i < 0)) {
var n = this._spawnSeatEmoji(i, t, !1);
if (n) {
var a = n.getComponent(sp.Skeleton);
a && a.setCompleteListener && a.setCompleteListener(function() {
cc.isValid(n) && n.destroy();
});
n.runAction(cc.sequence(cc.delayTime(4), cc.callFunc(function() {
cc.isValid(n) && n.destroy();
})));
}
}
},
_clearEmojiSpine: function(e) {
if (e && e._emojiSpineNode) {
if (cc.isValid(e._emojiSpineNode)) {
e._emojiSpineNode.active = !1;
e._emojiSpineNode.destroy();
}
e._emojiSpineNode = null;
}
},
_slotIdxOfUser: function(e) {
if (!e) return -1;
for (var t = Number(e), i = 0; i < this._seatNodes.length; ++i) {
var n = this._seatNodes[i];
if (n && n.root && n.root.active && Number(n._uid) === t) return i;
}
var a = cc.vv && cc.vv.gameNetMgr;
if (!a) return -1;
var s = null, o = 0;
if (this._started && a.bbSeats && a.bbSeats.length > 0) {
s = a.bbSeats;
o = this._mySeat || 0;
} else if (a.seats && a.seats.length > 0) {
s = a.seats;
o = a.seatIndex >= 0 ? a.seatIndex : 0;
}
if (!s) return -1;
for (var r = Math.max(2, Math.min(6, s.length)), l = 0; l < s.length; ++l) if (s[l] && s[l].userid == e) {
var c = (l - o + s.length) % s.length;
return c >= r ? -1 : this._layoutOf(r)[c];
}
return -1;
},
_showBubble: function(e, t, i, n) {
if (t) {
var a = this._slotIdxOfUser(e);
if (!(i && a < 0)) {
var s = a >= 0 ? this._seatNodes[a] : null;
if (!s || !s.root) {
var o = a >= 0 ? this.findNode(this.node, "bbSeat" + a) : null;
if (o) s = {
root: o,
bubble: this.findNode(o, "bbBubble") || o
}; else {
var r = this._seatNodes.findIndex(function(e) {
return e && e.root;
});
if (r < 0) return;
s = this._seatNodes[r];
}
}
var l = s.bubble;
if (l) {
var c = this.findNode(l, "bbBubbleText"), h = this.findNode(s.root, "bbBubbleEmoji");
if (i) {
var d = String(t).replace(/\.png$/i, ""), u = !n && this._emojiSpine && this._emojiSpine[d];
console.log("[BB] emoji-bubble 内容=" + d + " 骨骼=" + !!u + " 槽位=" + a);
if (h && u) {
this._clearEmojiSpine(s);
h.active = !1;
c && (c.active = !1);
var g = this._spawnSeatEmoji(a, d, !0);
if (g) {
var v = g.scale;
g.runAction(cc.sequence(cc.scaleTo(.12, 1.4 * v), cc.scaleTo(.18, v)));
s._emojiSpineNode = g;
}
} else {
var _ = "smile" === d ? "smaile" : d, f = this._emojiFrames || {}, m = f[d] || this._emojiStaticOf && this._emojiStaticOf[d] || f[_ + "0.png"] || f[_] || null;
if (h) {
h.active = !!m;
if (m) {
var p = h.getComponent(cc.Sprite);
if (p) {
p.enabled = !0;
p.sizeMode = cc.Sprite.SizeMode.CUSTOM;
p.spriteFrame = m;
}
}
}
if (c) {
c.active = !m;
if (!m) {
var b = c.getComponent(cc.Label);
b && (b.string = t);
}
}
}
l.active = !0;
var C = l.getComponent(cc.Sprite);
C && (C.enabled = !i || !(!c || !c.active));
} else {
this._clearEmojiSpine(s);
h && (h.active = !1);
if (c) {
c.active = !0;
var y = c.getComponent(cc.Label);
if (y) {
y.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
var S = 20 + 20 * String(t).length;
S < 80 && (S = 80);
S > 240 && (S = 240);
c.width = S;
y.string = t;
}
}
l.active = !0;
var N = l.getComponent(cc.Sprite);
N && (N.enabled = !0);
}
!i && l.active && c && this.scheduleOnce(function() {
if (cc.isValid(l) && cc.isValid(c)) {
var e = Math.max(80, c.width + 20), t = Math.max(40, c.height + 16);
l.setContentSize(e, t);
}
}, 0);
s._bubbleSeq = (s._bubbleSeq || 0) + 1;
var B = s._bubbleSeq, M = this;
this.scheduleOnce(function() {
if (s._bubbleSeq === B) {
cc.isValid(l) && (l.active = !1);
cc.isValid(h) && (h.active = !1);
M._clearEmojiSpine(s);
}
}, 2);
}
}
}
},
_bindChatItems: function(e, t) {
if (e) for (var i = this, n = function e(n) {
var a = n.getComponent(cc.Button);
a && (a.clickEvents = []);
if (t) {
var s = /^item(\d+)$/.exec(n.name);
s && i.bindButton(n, function() {
i._sendQuickChat(parseInt(s[1], 10));
}, i);
} else n.children && 0 === n.children.length && "sp" !== n.name && !/^cc/.test(n.name) && "New Node" !== n.name && i.bindButton(n, function() {
i._sendEmoji(n.name);
}, i);
for (var o = n.children || [], r = 0; r < o.length; ++r) e(o[r]);
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
this._showBubble(t, e, !0, !0);
cc.vv && cc.vv.net && !this._replay && cc.vv.net.send("emoji", {
name: e,
free: !0
});
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
if (e) {
var t = e.content;
if ("string" == typeof t && "{" === t.charAt(0)) try {
var i = JSON.parse(t);
i && i.name && (t = i.name);
} catch (e) {}
this._showBubble(e.target || e.sender, t, !0, !!e.free);
}
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
try {
cc.director.preloadScene("club", function() {});
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
for (var n = cc.vv.userMgr && cc.vv.userMgr.userId, a = e.events || [], s = null, o = null, r = null, l = null, c = null, h = 0; h < a.length; ++h) {
var d = a[h];
if (d && d.d) if ("bb_start_push" == d.e) {
s || (s = d.d);
o || d.u != n || (o = d.d);
} else if ("bb_reveal_push" == d.e) r || (r = d.d); else if ("game_over_push" == d.e) {
c || (c = d.d);
l || d.u != n || (l = d.d);
}
}
var u = s && s.seats || [], g = Math.max(2, Math.min(6, u.length || (e.players || []).length)), v = [ "seats", "seatIndex", "bbSeats", "bbMySeat", "bbBankerSeat", "bbBankerMode", "bbGameType", "bbMyCards", "bbMyDaos", "bbPhase", "bbArranged", "conf", "roomId", "numOfGames", "maxNumOfGames", "overData", "bbOverDetails", "gamestate" ];
this._savedNm = {};
for (var _ = 0; _ < v.length; ++_) this._savedNm[v[_]] = i[v[_]];
var f = l || c || {}, m = f.results || [], p = [], b = [];
for (h = 0; h < 6; ++h) b.push(null);
for (h = 0; h < g; ++h) {
var C = u[h] || e.players && e.players[h] || {}, y = null != C.roomSeatIndex ? C.roomSeatIndex : h;
p.push({
userid: C.userid,
name: C.name || "",
sex: C.sex || 0,
ip: C.ip || "",
seatindex: h,
roomSeatIndex: y,
arranged: !0
});
b[y] = {
userid: C.userid,
name: C.name || "",
ip: C.ip || "",
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
t.rowCards && (t.rowCards.active = !1);
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
this._renderConfirmPreview();
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
this._renderConfirmPreview();
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
ip: s && s.ip || a && a.ip || "",
sex: a && a.sex || 0,
score: s && null != s.score ? s.score : a && null != a.score ? a.score : null,
isBanker: !!i.bbBankerMode && n == i.bbBankerSeat,
ready: !(!a || !a.arranged)
};
},
renderSeats: function() {
var e, t = cc.vv.gameNetMgr, i = this._started && t.bbSeats && t.bbSeats.length > 0, n = [];
if (i) {
e = Math.max(2, Math.min(6, t.bbSeats.length));
this._total = e;
for (var a = 0; a < e; ++a) n.push({
offset: a,
info: this._seatInfoOfOffsetInGame(a, e)
});
} else {
var s = t.seats || [], o = s.length, r = t.seatIndex >= 0 ? t.seatIndex : 0;
e = Math.max(2, Math.min(6, o));
this._total = e;
for (var l = 0; l < o; ++l) {
var c = (l - r + o) % o;
if (!(c >= e)) {
var h = s[l];
h && h.userid ? n.push({
offset: c,
info: {
gs: l,
userid: h.userid,
name: h.name || "",
ip: h.ip || "",
sex: h.sex || 0,
score: null != h.score ? h.score : 0,
isBanker: !1,
ready: !!h.ready
}
}) : n.push({
offset: c,
info: {
gs: l,
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
for (var d = 0; d < 6; ++d) {
var u = this._seatNodes[d];
if (u) {
u.root.active = !1;
u._uid = 0;
u._uname = "";
u.okSprite && (u.okSprite.active = !1);
u.userSprite && (u.userSprite.color = cc.Color.WHITE);
if (u.icon) {
var g = u.icon.getComponent("ImageLoader");
if (g) g.clearAvatar ? g.clearAvatar() : (g._spriteFrame = null, g.setupSpriteFrame()); else {
var v = u.icon.getComponent(cc.Sprite);
v && (v.spriteFrame = null);
}
}
}
}
for (var _ = this._layoutOf(e), f = 0; f < n.length; ++f) {
var m = _[n[f].offset], p = this._seatNodes[m];
if (p) {
p.root.active = !0;
p._uid = n[f].info.userid || 0;
p._uname = n[f].info.name || "";
p._ip = n[f].info.ip || "";
p._sex = n[f].info.sex || 0;
if (n[f].info.empty) {
this.setStr(p.nameLabel, "");
this.setStr(p.scoreLabel, "");
p.zhuang && (p.zhuang.active = !1);
p.readyMark && (p.readyMark.active = !1);
p.okSprite && (p.okSprite.active = !1);
p.icon && (p.icon.active = !1);
if (p.userSprite) {
p.userSprite.active = !0;
p.userSprite.color = cc.Color.WHITE;
}
} else {
p.icon && (p.icon.active = !0);
p.userSprite && (p.userSprite.color = cc.Color.WHITE);
this.setStr(p.nameLabel, n[f].info.name || "");
this.setStr(p.scoreLabel, null != n[f].info.score ? "" + n[f].info.score : "");
p.zhuang && (p.zhuang.active = !1);
p.readyMark && (p.readyMark.active = !!n[f].info.ready);
p.okSprite && (p.okSprite.active = !this._started && !!n[f].info.ready);
if (p.icon) {
var b = p.icon.getComponent("ImageLoader");
if (!b) try {
b = p.icon.addComponent("ImageLoader");
} catch (e) {}
b && n[f].info.userid && b.setUserID(n[f].info.userid);
}
}
}
}
if (i) for (var C = 0; C < 6; ++C) {
var y = this._seatNodes[C];
if (y && y.root && !(Number(y._uid) > 0)) {
y.root.active = !0;
y.icon && (y.icon.active = !1);
if (y.userSprite) {
y.userSprite.active = !0;
y.userSprite.color = cc.Color.WHITE;
}
this.setStr(y.nameLabel, "");
this.setStr(y.scoreLabel, "");
y.zhuang && (y.zhuang.active = !1);
y.readyMark && (y.readyMark.active = !1);
y.okSprite && (y.okSprite.active = !1);
y.cardsNode && (y.cardsNode.active = !1);
y.rowCards && (y.rowCards.active = !1);
y.summary && (y.summary.active = !1);
y.bubble && (y.bubble.active = !1);
y.mianType && (y.mianType.active = !1);
for (var S = y.slots || [], N = y.rowSlots || [], B = y.daoLabels || [], M = 0; M < S.length; ++M) S[M] && (S[M].active = !1);
for (var w = 0; w < N.length; ++w) N[w] && (N[w].active = !1);
for (var T = 0; T < B.length; ++T) B[T] && (B[T].active = !1);
var x = this.findNode(y.root, "bbBubbleEmoji");
x && (x.active = !1);
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
var a = t.club_table_name || t.table_name || t.name || "宝宝";
if (this._n.bbWatermark) {
var s = this._n.bbWatermark.getComponent(cc.Label);
if (s) {
s.string = a;
s.enableWrapText = !1;
s.overflow = cc.Label.Overflow.NONE;
}
}
},
onBtnSettingsClicked: function() {
var e = this._settingsRoot || cc.find("Canvas/popups/settings") || this.findNode(this.node, "settings");
e && (e.active = !0);
},
onDeskBgClick: function() {
var e = cc.vv && cc.vv.deskStyle || this.getComponent("DeskStyle");
if (!e) try {
e = this.getComponent("DeskStyle") || this.addComponent("DeskStyle");
} catch (t) {
e = null;
}
e && e.openBgChoose ? e.openBgChoose() : console.warn("[BB] 打开背景选择失败: DeskStyle 不可用");
},
_mianOrder: function(e, t) {
var i = this;
if (490 == t && e && 6 == e.length) {
for (var n = [ 0, 1, 2, 3, 4, 5 ], a = [], s = 0; s < 6; ++s) for (var o = s + 1; o < 6; ++o) a.push([ s, o ]);
for (var r = e.map(function(e) {
return i.dianVal(i.rankOf(e));
}), l = 0; l < a.length; ++l) for (var c = a[l], h = n.filter(function(e) {
return e != c[0] && e != c[1];
}), d = 0; d < h.length; ++d) for (var u = d + 1; u < h.length; ++u) {
var g = [ h[d], h[u] ], v = h.filter(function(e) {
return e != g[0] && e != g[1];
});
if (r[c[0]] + r[c[1]] == 9 && r[g[0]] + r[g[1]] == 9 && r[v[0]] + r[v[1]] == 9) {
var _ = [ [ e[c[0]], e[c[1]] ], [ e[g[0]], e[g[1]] ], [ e[v[0]], e[v[1]] ] ];
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
for (var e = cc.vv.gameNetMgr, t = ((e.bbMyCards || []).slice(), this._total || 2), i = 0; i < 6; ++i) {
var n = this._seatNodes[i];
if (n) {
for (var a = 0; a < 6; ++a) n.slots[a] && (n.slots[a].active = !1);
n.rowCards && (n.rowCards.active = !1);
for (var s = 0; s < 3; ++s) this.setStr(n.daoLabels[s], "");
this.setStr(n.summary, "");
}
}
if (this._started) {
for (var o = 0; o < t; ++o) {
var r = this._layoutOf(t)[o], l = this._seatNodes[r];
if (l && l.root.active) {
var c = this._watching ? o : (this._mySeat + o) % t;
if (!l.cardsNode || l.cardsNode.active) {
var h = this._revealCounts && this._revealCounts[o] || 0, d = h > 0 && this._revealByGs[c] || null, u = !this._watching && 0 == o, g = [], v = !1, _ = [ "", "", "" ], f = "";
if (d) {
if (d.mianFree && d.cards && 6 == d.cards.length) {
for (var m = 0; m < 3; ++m) {
var p = [ d.cards[2 * m], d.cards[2 * m + 1] ];
g = g.concat(p);
_[m] = this.daoDescText(p[0], p[1]);
}
f = d.typeName || "";
} else if (d.daos) {
for (var b = 0; b < d.daos.length; ++b) {
g = g.concat(d.daos[b].cards || []);
_[b] = d.daos[b].desc;
}
d.mianFree ? f = d.typeName || "" : d.wulong && (f = "乌龙(三道全输)");
} else if (d.groups) {
for (var C = 0; C < d.groups.length; ++C) g = g.concat(d.groups[C] || []);
f = d.typeName || "";
}
for (var y = 0; y < 3; ++y) h < 2 * (y + 1) && (_[y] = "");
h < 6 && (f = "");
} else v = !0;
var S = !!(d && h >= 6 && (d.mianFree || d.groups && !d.daos)), N = e.bbSeats ? e.bbSeats[c] : null, B = !(!("baobao_mian" == this._gameType || N && N.mianFree) || d);
if (S) {
_ = [ "", "", "" ];
f = "";
}
this._setMianRow(l, S || B, S ? g : null, B);
S && d && d.typeName && d.typeKey > 0 && this._showMianTypeAtSeat(r, d.typeName);
for (var M = 0; M < 6; ++M) {
var w = l.slots[M];
if (w) if (S || B) w.active = !1; else {
var T = w.getComponent(cc.Sprite);
w.active = !0;
if (v || d && M >= h) {
T && (T.spriteFrame = this._cardBack || null);
w.color = cc.Color.WHITE;
} else if (null != g[M]) {
T && (T.spriteFrame = this.frameOf(g[M]) || this._cardBack || null);
var x = this._arranging && u && !d && this._isUsed(g[M]);
w.color = x ? cc.color(120, 120, 120) : cc.Color.WHITE;
} else w.active = !1;
}
}
for (var I = 0; I < 3; ++I) this.setStr(l.daoLabels[I], _[I]);
this.setStr(l.summary, "baobao_mian" == this._gameType ? "" : f);
}
}
}
this._renderArrange();
} else this._renderArrange();
}
},
_setMianRow: function(e, t, i, n) {
if (e && e.rowCards) {
e.rowCards.active = !!t;
if (t) for (var a = 0; a < 6; ++a) {
var s = e.rowSlots[a];
if (s) if (n) {
s.active = !0;
s.color = cc.Color.WHITE;
var o = s.getComponent(cc.Sprite);
o && (o.spriteFrame = this._cardBack || null);
} else {
var r = i ? i[a] : null;
if (null != r) {
s.active = !0;
s.color = cc.Color.WHITE;
var l = s.getComponent(cc.Sprite);
l && (l.spriteFrame = this.frameOf(r) || this._cardBack || null);
} else s.active = !1;
}
}
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
for (var l = [], c = 0; c < a.length; ++c) {
var h = a[c], d = this.rankOf(h);
l.push({
id: h,
r: d,
s: this.suitOf(h),
n: s[d] || 1
});
}
l.sort(function(e, t) {
return e.n != t.n ? t.n - e.n : e.r != t.r ? t.r - e.r : e.s - t.s;
});
a = l.map(function(e) {
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
null != e.mianFree && (t.bbMianFree = !!e.mianFree);
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
for (var l = e.players.length, c = [], h = 0; h < (this._total || l); ++h) c.push(0);
this._revealCounts = c;
this._revealDone = !1;
this._revealRunning = !0;
this._resetSlotPos();
this.renderCards();
console.log("[BB] 亮牌开始 座位顺序=" + Object.keys(this._revealByGs).join(",") + " 共" + l + "家 打枪" + this._daqiangList.length + "对 全垒打" + this._quanleidaList.length);
var d = this;
this._playVoice(this._mySex(), "begin");
var u = this._total || 2, g = this._layoutOf(u), v = null != e.bankerSeat && e.bankerSeat >= 0 ? e.bankerSeat : 0, _ = e && e.gameType || this._gameType, f = {};
if ("baobao_shou" == _) {
for (var m = 0; m < e.players.length; ++m) {
var p = e.players[m];
if (null != p.seat && p.mianFree) {
var b = this._watching ? p.seat : (p.seat - this._mySeat + u) % u, C = g[b];
f[p.seat] = !0;
this._revealCounts[b] = 6;
if (null != C) {
for (var y = 0; y < 6; ++y) d._flipOne(C, y);
p.typeName && p.typeKey > 0 && d._showMianTypeAtSeat(C, p.typeName);
}
}
}
Object.keys(f).length && this.renderCards();
}
if ("baobao_mian" == _) {
for (var S = 0, N = 0; N < e.players.length; ++N) {
var B = e.players[N];
if (null != B.seat) {
var M = this._watching ? B.seat : (B.seat - this._mySeat + u) % u, w = g[M];
f[B.seat] = !0;
this._revealCounts[M] = 6;
if (null != w) {
for (var T = 0; T < 6; ++T) d._flipOne(w, T);
B.typeName && B.typeKey > 0 && d._showMianTypeAtSeat(w, B.typeName);
S++;
}
}
}
if (S > 0) {
this.renderCards();
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("fanpai.mp3");
}
}
this._revealOrder = [];
for (var x = 0; x < u && this._revealOrder.length < l; ++x) {
var I = (v + x) % u;
this._revealByGs[I] && this._revealOrder.push(I);
}
for (var P = 0; P < e.players.length; ++P) {
var A = e.players[P].seat;
null != A && this._revealOrder.indexOf(A) < 0 && this._revealOrder.push(A);
}
for (var L = 0, R = 0; R < 3; ++R) for (var k = 0; k < this._revealOrder.length; ++k) if (!f[this._revealOrder[k]]) {
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
o && 2 == e && (o.mianFree || o.groups && !o.daos) && o.typeName && o.typeKey > 0 && null != s && d._showMianTypeAtSeat(s, o.typeName);
}
}, 1.5 * n);
})(R, k, L);
L++;
}
this.scheduleOnce(function() {
if (cc.isValid(d.node)) try {
d._playDaqiangFx(O);
} catch (e) {
console.log("[BB] 打枪特效异常:", e && e.message);
O();
}
}, 1.5 * Math.max(L, 1));
}
function O() {
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
var l = n.addComponent(cc.LabelOutline);
l.color = new cc.Color(120, 40, 0, 255);
l.width = 3;
n._bbDynamic = !0;
a = n;
}
var c = n.getComponent(cc.Label);
c && (c.string = t);
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
var r = i[a++], l = t._revealByGs[r.from];
t._playVoice(l && l.sex, "daqiang");
for (var c = 0; c < 3; ++c) setTimeout(function() {
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("da_qiang_one.mp3");
}, 300 * c);
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
var o = 0, r = e.length, l = setInterval(function() {
if (cc.isValid(i)) if (++o >= r) {
clearInterval(l);
i.destroy();
} else n.spriteFrame = e[o]; else clearInterval(l);
}, 50);
}
},
_fxGunShot: function(e, t) {
var i = this._total || 2, n = this._watching ? e : (e - this._mySeat + i) % i, a = this._watching ? t : (t - this._mySeat + i) % i, s = this._avatarLocalPos(n), o = this._avatarLocalPos(a), r = this._dqFrames;
if (s && r && r.length) {
var l = this._fxNode(s, "bbFxDq"), c = l.addComponent(cc.Sprite);
c.spriteFrame = r[0];
if (o) {
var h = 180 * Math.atan2(o.y - s.y, o.x - s.x) / Math.PI;
if (o.x < s.x) {
l.scaleX = -.8;
l.scaleY = .8;
l.angle = h + 180;
} else {
l.setScale(.8);
l.angle = h;
}
} else l.setScale(.8);
var d = 0, u = r.length, g = setInterval(function() {
if (cc.isValid(l)) if (++d >= u) {
clearInterval(g);
l.destroy();
} else c.spriteFrame = r[d]; else clearInterval(g);
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
var l = this._seatNodes[r];
l && l.cardsNode && (l.cardsNode.active = !!a[r]);
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
var l = i.home || this._homeOf(i.node);
if (l) {
i.node.stopAllActions();
i.node.setPosition(l.x, l.y);
i.node.setScale(l.sx, l.sy);
}
this.renderCards();
} else if (null == i.fromD) this.onHandTap(e); else {
var c = i.home;
if (c) {
i.node.stopAllActions();
i.node.setPosition(c.x, c.y);
i.node.setScale(c.sx, c.sy);
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
for (var t = this._arrangeRows || [], i = this._arrangeDaoHome || [], n = null, a = 0, s = 0, o = -1, r = null, l = 0; l < t.length; ++l) {
var c = i[l];
if (c) for (var h = 0; h < 2; ++h) {
var d = t[l].slots[h];
if (d && d.parent && c[h]) {
var u = d.parent.convertToWorldSpaceAR(cc.v2(c[h].x, c[h].y)), g = e.x - u.x, v = e.y - u.y, _ = g * g + v * v;
if (o < 0 || _ < o) {
o = _;
a = g;
s = v;
n = {
d: l,
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
var l = this._arrangeHandSlots[r];
if (l) {
var c = o[r];
if (null != c) {
var h = this._isUsed(c);
l.active = !h;
if (!h) {
var d = l.getComponent(cc.Sprite);
d && (d.spriteFrame = this.frameOf(c) || this._cardBack || null);
l.color = cc.Color.WHITE;
}
} else l.active = !1;
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
var l = r.addComponent(cc.Label);
l.string = "免摆牌型：" + (s ? s.typeName : "") + "  ×" + (s && s.rate || 1);
l.fontSize = 30;
l.lineHeight = 34;
l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
var c = l.node.color;
c.setR(255);
c.setG(220);
c.setB(90);
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
for (var t = this._evalD.bind(this), i = this._cmpD.bind(this), n = this._cmpArrange.bind(this), a = null, s = null, o = [ 0, 1, 2, 3, 4, 5 ], r = [], l = 0; l < 6; ++l) for (var c = l + 1; c < 6; ++c) r.push([ l, c ]);
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
for (var l = 0, c = 0; c < a.length; ++c) if (a[c] && a[c].userid == s) {
l = a[c].delta || 0;
break;
}
if (cc.vv && cc.vv.audioMgr) {
cc.vv.audioMgr.playSFX(l > 0 ? "win.wav" : "lose.wav");
if (0 != l) {
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
var l = n[r];
if (l.a == u && l.b == t || l.a == t && l.b == u) {
o = !0;
l.winner == t ? s += l.score || 0 : s -= l.score || 0;
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
var S = i.overData || {}, N = !(!e || !e.endinfo) || !!S.endinfo || i.maxNumOfGames > 0 && i.numOfGames >= i.maxNumOfGames, B = !(!e || !e.roomEnd) || !!S.roomEnd;
N && (B = !1);
this._final = N;
this._roomEnd = B;
this._arranging = !1;
this._inArrangePhase = !1;
this.hideArrangeUI();
this.hideConfirmUI();
this._n.bbMidCd && this._setMidCd(!1);
this._n.resultPanel && (this._n.resultPanel.active = !0);
this._clearMianTypeLabels();
this._ensureSettleBtnFrames();
this._setSettleActionBtn(B ? "退出房间" : "继续游戏", B);
if (this._resultShuffleBtn) {
var M = N || B;
this._resultShuffleBtn.active = !0;
this._resultShuffleBtn.opacity = M ? 120 : 255;
M ? this._resultShuffleBtn.off(cc.Node.EventType.TOUCH_END) : this.bindButton(this._resultShuffleBtn, this.onResultShuffle, this);
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
this._n.slSprite && (this._n.slSprite.active = l > 0);
this._n.sbSprite && (this._n.sbSprite.active = l < 0);
this._n.hjSprite && (this._n.hjSprite.active = 0 === l);
this._n.resultTitle && (this._n.resultTitle.active = !1);
this._n.disbandBtn && (this._n.disbandBtn.active = !N);
this._n.shareBtn && (this._n.shareBtn.active = !0);
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
}, l = cc.resources.get(t[1], cc.SpriteFrame);
if (l && l.texture && l.texture.width > 0) r(l); else {
var c = e._settleBtnSceneFrames[t[2]];
c && (n.spriteFrame = c);
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
var l = o.children[r], c = Math.abs(l.x) + l.width / 2 + 10;
2 * c > i && (i = Math.ceil(2 * c));
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
var o, r = cc.vv.gameNetMgr, l = cc.vv.userMgr ? cc.vv.userMgr.userId : null, c = r.bbMySeat, h = null;
if ((null == c || c < 0) && r.bbSeats) for (o = 0; o < r.bbSeats.length; ++o) if (r.bbSeats[o] && r.bbSeats[o].userid == l) {
c = o;
break;
}
for (o = 0; o < e.length; ++o) if (e[o] && e[o].userid == l) {
h = e[o];
break;
}
if (!h || null == c || c < 0) {
i.active = !1;
return !1;
}
for (var d = r.bbBankerMode ? r.bbBankerSeat : -1, u = [], g = this._total || 2, v = 0; v < g; ++v) v != c && (d >= 0 && c != d && v != d || u.push(v));
var _ = function(t) {
for (var i = r.bbSeats && r.bbSeats[t] ? r.bbSeats[t].userid : -1, n = 0; n < e.length; ++n) if (e[n] && e[n].userid == i) return e[n];
return null;
};
i.active = !0;
u.length;
var f = this._settleRowTpl && this._settleRowTpl.height || 75, m = this._settleViewH || 400, p = Math.floor(m / 6), b = Math.min(1, p / f);
i.setContentSize(this._settleViewW || 840, m);
var C, y = 0, S = this, N = this._settleRowTpl, B = function(e, t, n) {
var a = (e.name || "") + (t == c ? "(我)" : "") + (t == d ? "(庄)" : ""), s = [], o = "";
if (!e.mianFree && e.daos) {
for (var r = 0; r < e.daos.length; ++r) {
var l = e.daos[r].cards || [];
s.push(l[0], l[1]);
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
for (var B = 0; B < 6; ++B) {
var M = S.findNode(_, "card" + B);
if (M) if (null != s[B]) {
M.active = !0;
var w = M.getComponent(cc.Sprite);
w && (w.spriteFrame = S.jsFrameOf(s[B]) || S.frameOf(s[B]) || S._cardBack || null);
} else M.active = !1;
}
}
}, M = h.delta || 0;
B(h, c, (M > 0 ? "+" : "") + M);
for (var w = 0; w < u.length; ++w) {
var T = _(u[w]);
T && B(T, u[w], (C = T) && null != C.delta ? C.delta : 0);
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
var n = cc.vv.gameNetMgr || {}, a = n.conf || {}, s = n.getWanfa && n.getWanfa() || "", o = null != a.cost ? a.cost : null != a.fangka ? a.fangka : "管理员", r = null != a.rate ? a.rate : null != a.multiple ? a.multiple : 1, l = new Date(), c = function(e) {
return e < 10 ? "0" + e : "" + e;
}, h = l.getFullYear() + "-" + (l.getMonth() + 1) + "-" + l.getDate() + " " + c(l.getHours()) + ":" + c(l.getMinutes()) + ":" + c(l.getSeconds());
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
i && i.exitToTableHall ? i.exitToTableHall() : cc.vv.sceneMgr ? cc.vv.sceneMgr.load("club") : cc.director.loadScene("club");
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
ctor: function() {
this._emojiSpineNames = [ "yihuo", "kuaidian", "zhenbang", "aini", "daxiao", "yunle", "yishoulanpai", "dengchang", "jingle", "huaixiao", "keshui", "886", "wolaile", "dalaozaici", "biepao" ];
this._emojiSpine = null;
this._emojiPanelBuilt = !1;
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
this._initEmojiSpine();
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
_initEmojiSpine: function() {
if (this._tabEmoji) {
var e = this;
this._emojiSpine = {};
var t = this._emojiSpineNames || [];
(function i(n) {
if (n >= t.length) {
cc.vv && (cc.vv.emojiSpines = e._emojiSpine);
e._buildEmojiSpinePanel();
} else cc.resources.load("anims/smile/" + t[n], sp.SkeletonData, function(a, s) {
s && (e._emojiSpine[t[n]] = s);
i(n + 1);
});
})(0);
}
},
_emojiSpineSize: function(e) {
var t = e && e.skeletonJson && e.skeletonJson.skeleton;
return {
w: t && t.width || 240,
h: t && t.height || 270
};
},
_buildEmojiSpinePanel: function() {
if (!this._emojiPanelBuilt && this._tabEmoji) {
var e = this._tabEmoji;
1 === this._tabEmoji.children.length && this._tabEmoji.children[0].children.length > 0 && (e = this._tabEmoji.children[0]);
if (e && e.children && e.children.length) {
this._emojiPanelBuilt = !0;
var t = this, i = this._emojiSpineNames;
e.children.slice().forEach(function(e, n) {
var a = i[n];
if (a) {
var s = e.getComponent(cc.Button);
s && (s.enabled = !1);
e.off(cc.Node.EventType.TOUCH_END);
e.on(cc.Node.EventType.TOUCH_END, function() {
t._sendEmoji(a);
});
var o = t._emojiSpine[a];
if (o) {
var r = e.getComponent(cc.Sprite);
r && (r.enabled = !1);
var l = t._emojiSpineSize(o), c = e.width > 0 ? e.width : 80, h = e.height > 0 ? e.height : 80, d = new cc.Node("skel");
d.parent = e;
d.setPosition(0, 0);
d.scale = .9 * Math.min(c / l.w, h / l.h);
var u = d.addComponent(sp.Skeleton);
u.skeletonData = o;
u.setAnimation(0, "animation", !0);
}
}
});
}
}
},
_sendEmoji: function(e) {
this._chatRoot && (this._chatRoot.active = !1);
cc.vv.net.send("emoji", e);
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
var l = 0;
for (t = 0; t < this._jushuxuanze.length; ++t) if (this._jushuxuanze[t].checked) {
l = t;
break;
}
var c = 0;
for (t = 0; t < this._dianganghua.length; ++t) if (this._dianganghua[t].checked) {
c = t;
break;
}
var h = {
type: "xlch",
difen: e,
zimo: i,
jiangdui: a,
huansanzhang: n,
zuidafanshu: r,
jushuxuanze: l,
dianganghua: c,
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
function i(e, t) {
try {
var i = cc.sys.localStorage.getItem(e);
return null == i || "" === i ? t : JSON.parse(i);
} catch (e) {
return t;
}
}
function n(e, t) {
try {
cc.sys.localStorage.setItem(e, JSON.stringify(t));
} catch (e) {}
}
function a(e, t, i, n, a) {
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
this._bgIndex = i("mj_table_bg", 0);
this._cardScale = i("mj_card_scale_v2", 1);
("number" != typeof this._cardScale || this._cardScale < 1 || this._cardScale > 1.25) && (this._cardScale = "number" == typeof this._cardScale ? Math.min(1.25, Math.max(1, this._cardScale)) : 1);
this._gestureMultiSelect = !!i("gesture_multi_select", !1);
this._gestureSwipeUp = !!i("mj_gesture_swipe_up", !1);
var e = i("mj_play_mode", "single");
this._mjPlayMode = "double" === e ? "double" : "single";
var t = cc.find("Canvas/bg");
if (t && t.children.length > 0) {
this._bgSpr = t.children[0].getComponent(cc.Sprite);
this._bgSpr && (this._defaultFrame = this._bgSpr.spriteFrame);
}
var n = this;
cc.resources.load("images/ui/white", cc.SpriteFrame, function(e, t) {
if (!e && t) {
n._whiteFrame = t;
n._applyBg();
}
});
this._tryBindScenePanel();
this._applyBg();
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
var l = o.getChildByName("Handle") || o.getChildByName("handle");
if (!l) {
l = new cc.Node("Handle");
o.addChild(l);
l.setContentSize(44, 44);
var c = l.addComponent(cc.Sprite);
c.sizeMode = cc.Sprite.SizeMode.CUSTOM;
this._whiteFrame && (c.spriteFrame = this._whiteFrame);
l.color = cc.color(255, 214, 90);
}
var h = l.getComponent(cc.Button);
h || (h = l.addComponent(cc.Button));
this._slider.handle = h;
}
try {
this._slider.progress = (this._cardScale - 1) / .25;
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
n._applyCardScale();
}, 0);
}
},
onCardScaleSlide: function(e) {
this._cardScale = 1 + .25 * e.progress;
n("mj_card_scale_v2", Math.round(100 * this._cardScale) / 100);
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
var s = e.getChildByName(t);
s ? a(s, this.node, "DeskStyle", i, n) : console.warn("[DeskStyle] gesture_section 缺少子节点: " + t);
},
onToggleMultiSelect: function() {
this._gestureMultiSelect = !this._gestureMultiSelect;
n("gesture_multi_select", this._gestureMultiSelect);
this._refreshGestureUI();
},
onToggleSwipeUp: function() {
this._gestureSwipeUp = !this._gestureSwipeUp;
n("mj_gesture_swipe_up", this._gestureSwipeUp);
this._refreshGestureUI();
},
onPickPlayMode: function(e, t) {
this._mjPlayMode = "double" === t ? "double" : "single";
n("mj_play_mode", this._mjPlayMode);
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
var l = t.getChildByName("play_double");
if (l) {
var c = l.getChildByName("inner");
c && (c.active = "double" === this._mjPlayMode);
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
_getItems: function(e) {
var t = [];
if (!e) return t;
for (var i = 0; i < e.childrenCount; ++i) {
var n = e.children[i], a = /^item(\d+)$/.exec(n.name);
a && (t[parseInt(a[1], 10)] = n);
}
return t;
},
_tryBindScenePanel: function() {
if (!this._panel) {
var e = cc.find("Canvas/popups/bg_choose");
if (e) {
this._panel = e;
var t = e.getChildByName("mask");
t && a(t, this.node, "DeskStyle", "_onMaskClick");
var i = e.getChildByName("noSprite");
i && a(i, this.node, "DeskStyle", "_onMaskClick");
var n = e.getChildByName("panel");
if (n) {
for (var s = this._getItems(n), o = 0; o < s.length; ++o) s[o] && a(s[o], this.node, "DeskStyle", "_onPickBg", String(o + 1));
var r = n.getChildByName("btn_default");
r && a(r, this.node, "DeskStyle", "_onPickBg", "0");
}
e.active = !1;
}
}
},
openBgChoose: function() {
this._panel || this._tryBindScenePanel();
this._panel ? this._panel.active = !0 : console.warn("[DeskStyle] 场景缺少 Canvas/popups/bg_choose, 请在场景中摆好背景选择弹窗");
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
var t = this._panel ? this._panel.getChildByName("panel") : null, i = this._getItems(t)[e - 1], n = i ? i.getChildByName("preview") : null, a = n ? n.getComponent(cc.Sprite) : null;
if (a && a.spriteFrame) {
this._bgSpr.spriteFrame = a.spriteFrame;
this._bgSpr.node.color = cc.Color.WHITE;
}
}
}
},
_applyCardScale: function() {
var e = this._cardScale, t = cc.find("Canvas/game");
if (t) {
this._baseScales || (this._baseScales = new Map());
for (var i = [ "myself" ], n = [ "holds", "penggangs", "ChuPai" ], a = 0; a < i.length; ++a) {
var s = t.getChildByName(i[a]);
if (s) for (var o = 0; o < n.length; ++o) {
var r = s.getChildByName(n[o]);
if (r) {
var l = this._baseScales.get(r.uuid);
if (null == l) {
l = r.scaleX;
this._baseScales.set(r.uuid, l);
}
r.scaleX = l * e;
r.scaleY = l * e;
}
}
}
var c = t.getChildByName("ops");
if (c) {
var h = this._baseScales.get(c.uuid);
if (null == h) {
h = c.scaleX;
this._baseScales.set(c.uuid, h);
}
var d = 1 + .5 * (e - 1);
c.scaleX = h * d;
c.scaleY = h * d;
}
for (var u = [ "handArea", "cardsContainer" ], g = 0; g < u.length; ++g) {
var v = t.getChildByName(u[g]);
if (v) {
var _ = this._baseScales.get(v.uuid);
if (null == _) {
_ = v.scaleX;
this._baseScales.set(v.uuid, _);
}
v.scaleX = _ * e;
v.scaleY = _ * e;
}
}
var f = cc.vv.gameNetMgr && null != cc.vv.gameNetMgr.seatIndex ? cc.vv.gameNetMgr.seatIndex : 0, m = cc.find("Canvas/game/up/bbSeat" + f + "/bbCards");
if (m) {
var p = this._baseScales.get(m.uuid);
if (null == p) {
p = m.scaleX;
this._baseScales.set(m.uuid, p);
}
m.scaleX = p * e;
m.scaleY = p * e;
}
}
},
_onPickBg: function(e, t) {
this._bgIndex = parseInt(t, 10) || 0;
n("mj_table_bg", this._bgIndex);
this._applyBg();
this._syncSettingLabels();
this._panel && (this._panel.active = !1);
},
_onMaskClick: function() {
this._panel && (this._panel.active = !1);
},
_syncSettingLabels: function() {
if (this._bgNameLabel) {
var e = "默认";
if (this._bgIndex > 0) {
var t = this._panel ? this._panel.getChildByName("panel") : null, i = this._getItems(t)[this._bgIndex - 1], n = i ? i.getChildByName("name") : null, a = n ? n.getComponent(cc.Label) : null;
e = a ? a.string : "背景" + this._bgIndex;
}
this._bgNameLabel.string = "桌面背景: " + e;
}
this._scaleLabel && (this._scaleLabel.string = Math.round(100 * this._cardScale) + "%");
}
});
cc._RF.pop();
}, {} ],
DiceRoll: [ function(e, t) {
"use strict";
cc._RF.push(t, "3fbddKNLAxLnrmVgoi6JBM5", "DiceRoll");
var i = 50, n = .72, a = .45, s = 2.15, o = null, r = !1, l = [];
function c() {
r = !1;
var e = l;
l = [];
for (var t = 0; t < e.length; ++t) try {
e[t]();
} catch (e) {
console.error("[色子] 延时回调异常:", e && e.stack ? e.stack : e);
}
}
function h(e) {
var t = [];
if (e) for (var i = 1; i <= 6; ++i) {
var n = e.getSpriteFrame("dice_" + i + ".png") || e.getSpriteFrame("dice_" + i);
n && t.push(n);
}
return t;
}
function d(e, t) {
if (!e) return null;
if (e.name === t) return e;
for (var i = e.children, n = 0; n < i.length; ++n) {
var a = d(i[n], t);
if (a) return a;
}
return null;
}
function u(e) {
var t = e ? e.getChildByName("game") : null;
return t ? [ t.getChildByName("Sprite01"), t.getChildByName("gamecount"), t.getChildByName("mjcount") ] : null;
}
function g(e, t) {
var i = u(e);
if (i) for (var n = 0; n < i.length; ++n) {
var a = i[n];
if (a && cc.isValid(a)) {
a.active = t;
a.opacity = t ? 255 : 0;
}
}
}
function v(e) {
try {
cc.vv && cc.vv.http && cc.vv.http.sendRequest && cc.vv.http.sendRequest("/dbg_log", {
m: ("[dice] " + String(e)).substring(0, 300)
}, function() {});
} catch (e) {}
}
function _(e) {
var t = u(e);
if (!t) return "none";
for (var i = [ "Sprite01", "gamecount", "mjcount" ], n = [], a = 0; a < t.length; ++a) {
var s = t[a];
n.push(i[a] + "=" + (s ? s.active ? "on" : "off" : "null"));
}
return n.join(",");
}
function f(e, t) {
var i = new cc.Node("dice");
i.parent = e;
var n = i.addComponent(cc.Sprite);
n.sizeMode = cc.Sprite.SizeMode.CUSTOM;
i.setContentSize(t, t);
i.active = !1;
return {
n: i,
sp: n
};
}
function m(e, t, o) {
var r = new cc.Node("diceRollTemp");
r.parent = e;
r.setSiblingIndex(e.childrenCount - 1);
var l = e.getChildByName("game"), h = l ? l.getChildByName("arrow") : null;
h || (h = d(e, "arrow"));
var u = l ? l.getChildByName("Sprite01") : null, g = u ? u.getChildByName("Sprite0") : null, v = u ? u.getChildByName("Sprite1") : null, _ = !!(u && g && v), m = 1, p = i;
if (_) {
m = u.scaleX || 1;
g.width > 0 && (p = g.width);
}
var b = f(r, p), C = f(r, p), y = cc.view.getVisibleSize(), S = cc.view.getVisibleOrigin(), N = h && cc.isValid(h) ? h.convertToWorldSpaceAR(cc.v2(0, 0)) : e.convertToWorldSpaceAR(cc.v2(0, 0)), B = cc.v2(S.x + .9 * y.width, S.y + .08 * y.height), M = cc.v2(S.x + .96 * y.width, S.y + .16 * y.height), w = function() {
return t[Math.floor(Math.random() * t.length)];
}, T = B, x = M;
if (_) {
var I = u.scaleX || 1, P = u.scaleY || 1;
T = l.convertToWorldSpaceAR(cc.v2(u.x + g.x * I, u.y + g.y * P));
x = l.convertToWorldSpaceAR(cc.v2(u.x + v.x * I, u.y + v.y * P));
}
var A = 2 * m, L = [ {
d: b,
startW: B,
homeW: T,
off: cc.v2(.6 * -p, 8),
delay: 0,
spin: 0,
speed: 900,
lastFace: 0,
final: w(),
backAt: 1.5
}, {
d: C,
startW: M,
homeW: x,
off: cc.v2(.6 * p, -8),
delay: .22,
spin: 0,
speed: 760,
lastFace: 0,
final: w(),
backAt: 1.62
} ], R = Date.now(), k = 0, O = setInterval(function() {
if (cc.isValid(r) && cc.isValid(b.n) && cc.isValid(C.n)) if (r.activeInHierarchy) {
var e = (Date.now() - R) / 1e3, t = Math.min(.05, Math.max(0, e - k));
k = e;
for (var i = h && cc.isValid(h) ? h.convertToWorldSpaceAR(cc.v2(0, 0)) : N, l = r.convertToNodeSpaceAR(i), d = 0; d < L.length; ++d) {
var u = L[d], f = u.d.n, p = u.d.sp;
if (!(e < u.delay)) {
f.active || (f.active = !0);
var S = r.convertToNodeSpaceAR(u.startW), B = r.convertToNodeSpaceAR(u.homeW), M = cc.v2(l.x + u.off.x, l.y + u.off.y), T = e - u.delay;
if (T < n) {
var x = T / n, I = x * x * (3 - 2 * x);
f.setPosition(S.x + (M.x - S.x) * I, S.y + (M.y - S.y) * I + Math.sin(Math.PI * x) * y.height * .1);
u.spin += u.speed * t;
f.angle = -u.spin % 360;
f.setScale(A);
if (e - u.lastFace >= .07) {
u.lastFace = e;
p.spriteFrame = w();
}
} else if (e < u.backAt) {
var P = u.backAt - e, F = P < .2 ? Math.max(0, P / .2) : 1;
f.setPosition(M.x, M.y);
u.spin += u.speed * t * F;
f.angle = -u.spin % 360;
f.setScale(A);
if (P < .2) {
f.angle = 0;
p.spriteFrame = u.final;
} else if (e - u.lastFace >= .07) {
u.lastFace = e;
p.spriteFrame = w();
}
} else if (e < u.backAt + a) {
var j = (e - u.backAt) / a, E = j * j * (3 - 2 * j);
f.angle = 0;
p.spriteFrame = u.final;
f.setPosition(M.x + (B.x - M.x) * E, M.y + (B.y - M.y) * E);
f.setScale(A - (A - m) * E);
} else {
f.setPosition(B.x, B.y);
f.angle = 0;
f.setScale(m);
}
}
}
if (e >= s) {
clearInterval(O);
if (_ && cc.isValid(g) && cc.isValid(v)) {
var D = g.getComponent(cc.Sprite), H = v.getComponent(cc.Sprite);
D && (D.spriteFrame = L[0].final);
H && (H.spriteFrame = L[1].final);
}
cc.isValid(r) && r.destroy();
o();
c();
}
} else {
clearInterval(O);
r.isValid && r.destroy();
c();
} else {
clearInterval(O);
c();
}
}, 30);
}
var p = {
isPlaying: function() {
return r;
},
isReenter: function() {
return !!(cc.vv && cc.vv.roomEnteredAt && Date.now() - cc.vv.roomEnteredAt < 3e3);
},
play: function(e, t) {
t = t || function() {};
if (r) return !1;
if (!e || !cc.isValid(e)) {
t();
return !1;
}
if (cc.vv.replayMgr && cc.vv.replayMgr.isReplay && cc.vv.replayMgr.isReplay()) {
t();
return !1;
}
v("play start " + _(e));
r = !0;
i = function(i) {
var n = h(i);
if (0 != n.length) try {
m(e, n, t);
} catch (e) {
console.error("[色子] 播放异常:", e && e.stack ? e.stack : e);
t();
c();
} else {
console.warn("[色子] 图集里没取到 dice_1~6 帧,跳过动画");
t();
c();
}
}, o ? i(o) : cc.resources.load("images/atlas/baoqei_g", cc.SpriteAtlas, function(e, t) {
!e && t && (o = t);
i(o || null);
});
var i;
return !0;
},
after: function(e) {
"function" == typeof e && (r ? l.push(e) : e());
},
afterOpening: function(e, t) {
"function" == typeof t && this.after(function() {
(function i() {
e && !cc.isValid(e.node) || (e && e._dealAnimating && e._dealAnimUntil && Date.now() < e._dealAnimUntil ? setTimeout(i, 80) : t());
})();
});
},
setOpeningVisible: function(e, t) {
try {
g(e && e.node, t);
} catch (e) {
console.error("[色子] 开局信息显示异常:", e && e.stack ? e.stack : e);
}
}
};
t.exports = p;
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
var e = this;
cc.loader.loadRes("images/atlas/baoqei_a", cc.SpriteAtlas, function(t, i) {
if (!t && i) {
e._dirFrame = i.getSpriteFrame("方向标");
console.log("[folds] 方向标图集加载完成 frame=", !!e._dirFrame);
} else console.warn("[folds] 方向标图集加载失败", t);
});
},
initView: function() {
this._folds = {};
for (var e = this.node.getChildByName("game"), t = [ "myself", "right", "up", "left" ], i = 0; i < t.length; ++i) {
var n = t[i], a = e.getChildByName(n);
if (null != a) {
for (var s = [], o = a.getChildByName("folds"), r = 0; r < o.children.length; ++r) {
var l = o.children[r];
l.active = !1;
var c = l.getComponent(cc.Sprite);
c.spriteFrame = null;
s.push(c);
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
for (var o = s[0].node.parent, r = s[0].node.y, l = 0, c = 0; c < s.length; ++c) Math.abs(s[c].node.y - r) < 1 && l++;
l <= 0 && (l = s.length);
var h = s.length;
this._foldLayout || (this._foldLayout = {});
this._foldLayout[a] = {
perRow: l,
maxSlots: h
};
this._foldStacks || (this._foldStacks = {});
for (var d = this._foldStacks[a] || [], u = 0; u < d.length; ++u) cc.isValid(d[u]) && d[u].destroy();
var g = [];
this._foldStacks[a] = g;
for (var v = Math.min(t.length, h), _ = 0; _ < t.length; ++_) {
var f = _ % h, m = Math.floor(_ / h), p = f;
"up" == a ? p = Math.floor(f / l) * l + (l - 1 - f % l) : "right" == a && (p = s.length - f - 1);
var b = s[p];
if (0 == m) {
b.node.active = !0;
this.setSpriteFrameByMJID(n, b, t[_]);
} else {
var C = b.node, y = cc.instantiate(C);
y.x = C.x;
y.y = C.y + 8 * m;
y.zIndex = C.zIndex + m;
o.addChild(y);
y.active = !0;
this.setSpriteFrameByMJID(n, y.getComponent(cc.Sprite), t[_]);
g.push(y);
}
}
for (_ = v; _ < s.length; ++_) {
p = _;
"up" == a ? p = Math.floor(_ / l) * l + (l - 1 - _ % l) : "right" == a && (p = s.length - _ - 1);
(b = s[p]).spriteFrame = null;
b.node.active = !1;
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
var o = s.length - 1, r = o % a.maxSlots, l = r;
"up" == i ? l = Math.floor(r / a.perRow) * a.perRow + (a.perRow - 1 - r % a.perRow) : "right" == i && (l = n.length - r - 1);
if (0 == Math.floor(o / a.maxSlots)) return n[l].node;
var c = this._foldStacks && this._foldStacks[i];
return c && c.length > 0 ? c[c.length - 1] : null;
},
_showDirMarker: function(e) {
if (this._dirFrame) {
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
var o = e.folds, r = o.length - 1, l = r % s.maxSlots, c = l;
"up" == i ? c = Math.floor(l / s.perRow) * s.perRow + (s.perRow - 1 - l % s.perRow) : "right" == i && (c = a.length - l - 1);
var h = null;
if (0 == Math.floor(r / s.maxSlots)) h = a[c].node; else {
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
var n = t.node.width, a = t.node.height;
t.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(e, i);
n > 0 && a > 0 && t.node.setContentSize(n, a);
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
},
selectUpOffset: {
default: 28,
type: cc.Float
},
settleCountdown: {
default: 15,
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
this._selectUpOffset = null != this.selectUpOffset ? this.selectUpOffset : 28;
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
if (!cc.vv.deskStyle || !cc.isValid(cc.vv.deskStyle)) {
var i = cc.js.getClassByName("DeskStyle");
i && this.node.addComponent(i);
}
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
for (var e = [ "bg", "game", "prepare", "titleLabel", "roundLabel", "tipLabel", "countdownLabel", "handArea", "playArea", "playOwnerLabel", "cardsContainer", "playBtn", "passBtn", "hintBtn", "readyBtn", "exitBtn", "dissolveBtn", "prepareInfo", "toprepareInfo", "settlePanel", "settleTitle", "settleContent", "settleAgainBtn", "settleAgainLabel", "settleTime", "settleCloseBtn", "settleExitBtn", "finalSettlePanel", "finalSettleTitle", "finalSettleContent", "finalSettleExitBtn", "dissolvePanel", "dissolveLabel", "dissolveAgreeBtn", "dissolveRejectBtn" ], t = 0; t < e.length; ++t) this._n[e[t]] = this.findNode(this.node, e[t]);
this._n.bombMulLabel = this._n.playArea ? this.findNode(this._n.playArea, "bombMulLabel") : null;
this._n.frameEfx = this._n.playArea ? this.findNode(this._n.playArea, "frameEfx") : null;
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
var a = this._n.game ? this._n.game.getChildByName("up") : null, s = this._n.game ? this._n.game.getChildByName("myself") : null;
this._n.upTimer = a ? a.getChildByName("timeSprite") : null;
this._n.myTimer = s ? s.getChildByName("timeSprite") : null;
this._n.upTimerLabel = this._n.upTimer ? this._n.upTimer.getChildByName("countdownLabel") : null;
this._n.myTimerLabel = this._n.myTimer ? this._n.myTimer.getChildByName("countdownLabel") : null;
var o = this.node.getChildByName("timeSprite");
o && (o.active = !1);
this._n.countdownLabel = null;
this.showSeatTimers(!1, !1, 0);
this._refreshTitle();
if (this._n.settleAgainBtn) {
this._n.settleAgainLabel = this.findNode(this._n.settleAgainBtn, "settleAgainBtnLabel");
this._n.settleAgainBtn.active = !1;
this._n.settleAgainLabel && (this._n.settleAgainLabel.active = !1);
var r = this._n.settleAgainBtn.getComponent(cc.Label);
if (r) {
r.enabled = !0;
r.string = "准备";
}
}
this._n.settlePanel.active = !1;
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this._n.dissolvePanel.active = !1;
this._n.prepareInfo.active = !1;
this._n.toprepareInfo && (this._n.toprepareInfo.active = !1);
(l = this.findNode(this.node, "ops")) && (l.active = !1);
this._n.playBtn.active = !1;
this._n.passBtn.active = !1;
this._n.hintBtn && (this._n.hintBtn.active = !1);
(c = this.findNode(this.node, "arrow")) && (c.active = !1);
this.setStr(this._n.tipLabel, "");
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
var l, c, h = this.findNode(this.node, "cardTemplates");
if (h) {
var d = h.children;
for (t = 0; t < d.length; ++t) {
var u = d[t].name, g = d[t].getComponent(cc.Sprite);
g && g.spriteFrame && (this._cardFrames[u] = g.spriteFrame);
}
h.active = !1;
}
this.loadCardFramesFromRes();
this._handSlots = [];
this._playSlots = [];
this._playFlies = [];
for (var v = this, _ = 0; _ < 16; ++_) {
var f = this.findNode(this._n.handArea, "handSlot" + _);
if (f) {
f.on(cc.Node.EventType.TOUCH_START, function(e) {
return function(t) {
v.onSlotTouchStart(e, t);
};
}(f));
f.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
return function(t) {
v.onSlotTouchMove(e, t);
};
}(f));
f.on(cc.Node.EventType.TOUCH_END, function(e) {
return function(t) {
v.onSlotTouchEnd(e, t);
};
}(f));
f.on(cc.Node.EventType.TOUCH_CANCEL, function(e) {
return function(t) {
v.onSlotTouchEnd(e, t);
};
}(f));
var m = f.getChildByName("selMark");
m && (m.active = !1);
f._baseY = f.y;
this._handSlots.push(f);
}
var p = this.findNode(this._n.cardsContainer, "playSlot" + _);
p && this._playSlots.push(p);
var b = this.findNode(this._n.cardsContainer, "playFly" + _);
if (b) {
b._home = b.position.clone();
b.active = !1;
this._playFlies.push(b);
}
}
this._handSlots.sort(function(e, t) {
return e.x - t.x;
});
if (0 == this._playSlots.length) for (var C = 0; C < 16; ++C) {
var y = this.findNode(this.node, "playSlot" + C);
y && this._playSlots.push(y);
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
this._n.btnDeskBg = this.findNode(this._n.settingsPanel, "btn_desk_bg");
this.bindButton(this._n.btnDeskBg, this.onBtnDeskBg, this);
}
if (this._n.chatPanel) {
this._n.btnChatSend = this.findNode(this._n.chatPanel, "btnSend");
this._n.iptChat = this.findNode(this._n.chatPanel, "iptChat");
this._n.tabQuick = this.findNode(this._n.chatPanel, "tabQuick");
this._n.tabEmoji = this.findNode(this._n.chatPanel, "tabEmoji");
this._n.quickchatlist = this.findNode(this._n.chatPanel, "quickchatlist");
this._n.emojis = this.findNode(this._n.chatPanel, "emojis");
this._initEmojiSpine();
this.bindButton(this._n.btnChatSend, this.onBtnChatSend, this);
this.bindButton(this._n.tabQuick, this.onTabQuick, this);
this.bindButton(this._n.tabEmoji, this.onTabEmoji, this);
var S = this.findNode(this._n.chatPanel, "bg");
this.bindButton(S, this.onBtnChatClose, this);
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
var N = this, B = this.findNode(this._n.quickchatlist, "content") || this._n.quickchatlist;
B && B.children.forEach(function(e) {
/^item\d+$/.test(e.name) && N.bindButton(e, function() {
cc.vv.net.send("quick_chat", e.name);
N._n.chatPanel && (N._n.chatPanel.active = !1);
}, N);
});
}
this._oppSlots = [];
this._oppLayout = [];
for (var M = 0; M < 2; ++M) {
for (var w = [], T = 0; T < 16; ++T) {
var x = this.findNode(this.node, "oppCard" + M + "_" + T);
if (x) {
x.active = !1;
w.push(x);
}
}
if (w.length > 0) {
w.sort(function(e, t) {
return e.x - t.x;
});
this._oppSlots.push(w);
var I = w[0].x, P = w[w.length - 1].x;
this._oppLayout.push({
centerX: (I + P) / 2,
gap: w.length > 1 ? (P - I) / (w.length - 1) : 0
});
}
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
(l = this.findNode(this.node, "ops")) && l.children.forEach(function(e) {
"playBtn" !== e.name && "passBtn" !== e.name && "hintBtn" !== e.name && (e.active = !1);
});
this._clearBoard();
l && (l.active = !1);
(c = this.findNode(this.node, "arrow")) && (c.active = !1);
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
var A = this._n.gameResult.getChildByName("btnShare");
if (A) {
var L = A.getComponent(cc.Button);
L && (L.clickEvents = []);
this.bindButton(A, this.onExit, this);
}
var R = this._n.gameResult.getChildByName("btnClose");
R && (R.active = !1);
this._n.resultCountdown = this._n.gameResult.getChildByName("countdown");
var k = this;
this._winBgFrame = null;
cc.resources.load("images/atlas/baoqei_f", cc.SpriteAtlas, function(e, t) {
if (!e && t) {
var i = t.getSpriteFrame("大赢家.png") || t.getSpriteFrame("大赢家");
if (i) {
k._winBgFrame = i;
k._n.gameResult && k._n.gameResult.active && k._showFinalResult(null, k._finalEndinfo);
}
}
});
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
var r = (e.height || 250) - 8, l = Math.max(4, Math.floor(r / (1.45 * t.fontSize)));
i.length > l && (i = i.slice(i.length - l));
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
var r = n[s] + a[o], l = c(r);
l && (e._cardFrames[r] = l);
}
e._cardBack = c("card_back") || e._cardBack;
console.log("[GP] 牌面图集加载完成, 缓存张数=", Object.keys(e._cardFrames).length);
e.applyCardBack();
e._cards && e._cards.length && e.renderAll();
} else console.log("[GP] 牌面图集加载失败:", t);
function c(e) {
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
}), l = 0, c = -1, h = -1, d = 0; d < r.length; ++d) {
var u = s[r[d]];
if (u > l) {
l = u;
c = r[d];
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
if (4 == i && 3 == l) return null == g.gp_three_one || g.gp_three_one || t && null != g.gp_last_three_one && g.gp_last_three_one ? {
type: "triple_one",
key: c,
len: 4
} : null;
if (5 == i && 3 == l && 2 == r.length && 3 == s[c]) return {
type: "triple_pair",
key: c,
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
for (var B in s) if (3 != s[B]) {
N = !1;
break;
}
if (N) {
var M = this._pairStraightKey(r, p);
return M > 0 ? {
type: "triple_straight",
key: M,
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
for (var l = [], c = 0; c < a; ++c) r & 1 << c && l.push(n[c]);
var h = l.length == s, d = this._identifyCards(l, h);
if (d && this._canBeat(d, i)) {
var u = l.slice().sort(function(e, t) {
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
e.onGameEnd(t && (t.detail || t));
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
var l = r.getChildByName("emojiSpine");
l && l.destroy();
var c = r.getComponent(cc.Label);
if (c) {
c.string = n;
c.node.color = cc.color(255, 255, 255);
}
var h = r.getChildByName("New Label");
h && (h.active = !1);
var d = r.getChildByName("chatbg_ld");
if (d) {
d.active = !0;
var u = d.getComponent(cc.Sprite);
if (u && e._chatBgFrame) {
u.spriteFrame = e._chatBgFrame;
u.type = cc.Sprite.Type.SLICED;
u.sizeMode = cc.Sprite.SizeMode.CUSTOM;
}
d.color = cc.color(45, 40, 38, 210);
}
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
this.node.on("emoji_push", function(i) {
var n = i.detail || {};
e.showEmojiBubble(t.getSeatIndexByID(n.sender), n.content);
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
var i = cc.vv.gameNetMgr;
i && i.exitToTableHall ? i.exitToTableHall() : cc.vv.sceneMgr ? cc.vv.sceneMgr.load("club") : cc.director.loadScene("club");
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
this._n.prepareInfo.active = this._canShowPrepareImg();
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
this._n.toprepareInfo && (this._n.toprepareInfo.active = !1);
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
if (r && this._isFreshDeal() && !this._startSeqPlaying) {
this._startSeqPlaying = !0;
for (var l = this, c = 0; c < this._handSlots.length; ++c) this._handSlots[c].active = !1;
cc.vv.audioMgr && cc.vv.audioMgr.playSFX("start_game.mp3");
this._playStartAnim(function() {
if (cc.isValid(l.node)) {
l._startSeqPlaying = !1;
if (!l._over) {
l.renderHand();
l._playDealAnim();
}
}
});
}
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
var l = n[r], c = l.x, h = l.y, d = l.opacity;
t.push({
node: l,
fx: c,
fy: h,
op: d
});
l.setPosition(o);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(c, h)), cc.fadeTo(.15, d))));
var u = .06 * r + .15;
u > i && (i = u);
}
}
}, s = [], o = null, r = 0; r < this._handSlots.length; ++r) {
var l = this._handSlots[r];
if (l && l.active && null != l._cardId) {
s.push(l);
o = l.parent;
}
}
a(s, o, function(e, t) {
return e.x - t.x;
});
for (var c = 0; c < this._oppSlots.length; ++c) {
var h = this._oppSlots[c];
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
var t = e.seats || cc.vv.gameNetMgr.gpSeats;
if (t) for (var i = 0; i < t.length; ++i) {
var n = t[i];
if (n && n.seatindex === e.seatIndex && n.finished) {
this._playScreenFrames("images/bbfx_qld", .06);
break;
}
}
this._playPlayVoice(e);
}
},
_playTypeEfx: function(e) {
if (e && e.type) if ("bomb" !== e.type) if ("triple_straight" !== e.type) {
var t = null;
"straight" === e.type ? t = "shunzi" : "pair_straight" === e.type ? t = "liandui" : "triple_one" !== e.type && "triple_pair" !== e.type || (t = "sandaier");
t && this._spineEfx(this.node, t);
} else this._playScreenFrames("efx/feiji", .042, null, .7); else e.bombLevel >= 2 ? this._playScreenFrames("efx/wangzha", .042, null, .7) : e.bombLevel >= 1 ? this._playScreenFrames("efx/zhadan1", .042, null, .7) : this._playScreenFrames("efx/zhadan", .045, null, .7);
},
_spineEfx: function(e, t) {
if (e && cc.isValid(e) && "undefined" != typeof sp) {
var i = this, n = this._spineCache || (this._spineCache = {}), a = e.getChildByName("gp_spine");
a && a.destroy();
var s = function(n) {
if (n && cc.isValid(e)) {
var a = new cc.Node("gp_spine");
a.layer = e.layer;
e.addChild(a);
a.setPosition(0, 0);
var s = a.addComponent(sp.Skeleton);
s.skeletonData = n;
s.premultipliedAlpha = !1;
s.setAnimation(0, {
shunzi: "shunzi",
liandui: "liandui",
sandaier: "you",
baojing: "animation",
chuntian: "Spring"
}[t] || "animation", !1);
var o = {
shunzi: 914,
liandui: 962,
sandaier: 380,
baojing: 70,
chuntian: 930
}[t] || 0, r = e === i.node ? Math.min(.45 * cc.winSize.width, 860) : 260;
o > 0 && a.setScale(Math.min(r / o, 3));
i.scheduleOnce(function() {
cc.isValid(a) && a.destroy();
}, 1.6);
}
};
n[t] ? s(n[t]) : cc.resources.load("spine/" + t + "/" + t, sp.SkeletonData, function(e, i) {
if (!e && i) {
n[t] = i;
s(i);
} else console.log("[GP] spine特效加载失败:", t, e);
});
}
},
_playStartAnim: function(e) {
this._playScreenFrames("images/bbfx_start", .05, e);
},
_playScreenFrames: function(e, t, i, n) {
var a = this, s = function(e) {
if (cc.isValid(a.node)) {
var s = a._startFxNode;
if (!s || !s.isValid) {
s = new cc.Node("screenFx");
a.node.addChild(s);
s.zIndex = 999;
s.addComponent(cc.Sprite);
a._startFxNode = s;
}
var o = s.getComponent(cc.Sprite);
o.sizeMode = cc.Sprite.SizeMode.TRIMMED;
o.spriteFrame = e[0];
var r = e[0].getOriginalSize().width, l = e[0].getOriginalSize().height, c = Math.min(cc.winSize.width / r, cc.winSize.height / l) * (n || .9);
s.setPosition(0, 0);
s.setScale(c);
s.active = !0;
s.stopAllActions();
for (var h = [], d = 0; d < e.length; ++d) (function(e) {
h.push(cc.callFunc(function() {
o && o.isValid && (o.spriteFrame = e);
}));
h.push(cc.delayTime(t || .05));
})(e[d]);
h.push(cc.callFunc(function() {
s && s.isValid && (s.active = !1);
i && i();
}));
s.runAction(cc.sequence(h));
} else i && i();
}, o = this._screenFramesCache || (this._screenFramesCache = {});
o[e] && o[e].length > 0 ? s(o[e]) : cc.resources.loadDir(e, cc.SpriteFrame, function(t, n) {
if (!t && n && 0 !== n.length) {
n.sort(function(e, t) {
var i = parseInt(e.name, 10), n = parseInt(t.name, 10);
return isNaN(i) || isNaN(n) ? e.name < t.name ? -1 : e.name > t.name ? 1 : 0 : i - n;
});
o[e] = n;
s(n);
} else i && i();
});
},
_playFrameEfx: function(e, t, i) {
this._playFrameDir("efx/" + e, t, i);
},
_playFrameDir: function(e, t, i) {
var n = this, a = this._frameEfxCache || (this._frameEfxCache = {});
a[e] && a[e].length > 0 ? this._runFrameEfx(a[e], t, i) : cc.resources.loadDir(e, cc.SpriteFrame, function(s, o) {
if (!s && o && 0 !== o.length) {
o.sort(function(e, t) {
var i = parseInt(e.name, 10), n = parseInt(t.name, 10);
return isNaN(i) || isNaN(n) ? e.name < t.name ? -1 : e.name > t.name ? 1 : 0 : i - n;
});
a[e] = o;
n._runFrameEfx(o, t, i);
} else i && i();
});
},
_runFrameEfx: function(e, t, i) {
var n = this._n ? this._n.frameEfx : null;
if (n && cc.isValid(n)) {
n.active = !0;
n.stopAllActions();
for (var a = n.getComponent(cc.Sprite), s = 1 / (t || 24), o = [], r = 0; r < e.length; ++r) (function(e) {
o.push(cc.callFunc(function() {
a && a.isValid && (a.spriteFrame = e);
}));
o.push(cc.delayTime(s));
})(e[r]);
o.push(cc.callFunc(function() {
n && n.isValid && (n.active = !1);
i && i();
}));
n.runAction(cc.sequence(o));
} else i && i();
},
_flyPlayCards: function(e) {
var t = this._n.cardsContainer;
if (t && e && e.pais && 0 !== e.pais.length && 0 !== this._playFlies.length) {
var i = cc.vv.gameNetMgr, n = null;
if (e.seatIndex === i.gpMySeat) this._n.handArea && (n = this._n.handArea.convertToWorldSpaceAR(cc.v2(0, 0))); else if (this._seatMap) for (var a = 0; a < this._seatViews.length; ++a) if (this._seatMap[a] === e.seatIndex && this._seatViews[a]) {
n = this._seatViews[a].root.convertToWorldSpaceAR(cc.v2(0, 0));
break;
}
if (n) for (var s = t.convertToNodeSpaceAR(n), o = Math.min(e.pais.length, this._playFlies.length), r = 0; r < o; ++r) (function(t, i) {
var n = t._playFlies[i];
if (n && cc.isValid(n)) {
var a = n._home;
n.stopAllActions();
n.active = !0;
n.opacity = 255;
n.setPosition(s);
var o = n.getComponent(cc.Sprite);
o && (o.spriteFrame = t.frameOf(e.pais[i]));
cc.tween(n).delay(.04 * i).to(.16, {
position: a
}, {
easing: "quadOut"
}).call(function() {
if (cc.isValid(n)) {
n.active = !1;
n.setPosition(a);
}
}).start();
}
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
this._stopResultCountdown();
this._n.gameResult && (this._n.gameResult.active = !1);
this._n.prepareInfo.active = !1;
this._n.toprepareInfo && (this._n.toprepareInfo.active = !1);
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
_getGestureSettings: function() {
var e = cc.vv && cc.vv.deskStyle;
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
_isGestureMultiSelect: function() {
return !!this._getGestureSettings().multiSelect;
},
onBtnDeskBg: function() {
cc.vv.deskStyle && cc.vv.deskStyle.openBgChoose();
},
_findSlotAtPos: function(e) {
for (var t = this._handSlots.length - 1; t >= 0; --t) {
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
t: Date.now(),
slot: e
};
this._gpGestureMoved = !1;
this._gpGesturePlayed = !1;
}
},
onSlotTouchMove: function(e, t) {
if (this._gpGestureStart && !this._gpGesturePlayed) {
var i = this._getGestureSettings(), n = t.getLocation(), a = n.x - this._gpGestureStart.x, s = n.y - this._gpGestureStart.y;
if (i.swipeUp && s < -30) {
this._playGestureCards(this._gpGestureStart.slot);
this._gpGesturePlayed = !0;
t.stopPropagation();
} else if (i.multiSelect && Math.abs(a) > 8) {
if (!this._gpGestureMoved) {
this._gpGestureMoved = !0;
var o = this._gpGestureStart.slot;
if (o && null != o._cardId && !this._selected[o._cardId]) {
this._selected[o._cardId] = !0;
this._setSlotY(o, this._selectUpOffset);
}
}
var r = this._findSlotAtPos(n);
if (r && null != r._cardId && !this._selected[r._cardId]) {
this._selected[r._cardId] = !0;
this._setSlotY(r, this._selectUpOffset);
}
}
}
},
onSlotTouchEnd: function(e) {
if (this._gpGestureStart) {
var t = this._gpGestureStart;
this._gpGestureStart = null;
if (!this._gpGesturePlayed) if (this._gpGestureMoved) this.updateTurnUI(); else {
var i = this._getGestureSettings(), n = Date.now(), a = this._lastTapSlot === t.slot && n - this._lastTapTime < 320;
this._lastTapSlot = t.slot;
this._lastTapTime = n;
"double" === i.playMode && a ? this._playGestureCards(t.slot) : this.onSlotTouched(t.slot);
}
} else this.onSlotTouched(e);
},
_playGestureCards: function(e) {
if (this.isMyTurn() && !this._over) {
var t = !1, i = this._cards || [];
for (var n in this._selected) this._selected[n] && (i.indexOf(parseInt(n, 10)) < 0 ? this._selected[n] = !1 : t = !0);
if (!t) {
if (!e || null == e._cardId) return;
this._selected = {};
this._selected[e._cardId] = !0;
this._setSlotY(e, this._selectUpOffset);
this.updateTurnUI();
}
this.onPlay();
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
y: (e._baseY || 0) + (t || 0)
}, {
easing: "quadOut"
}).start();
}
},
_updateBombMul: function() {
var e = this._n && this._n.bombMulLabel ? this._n.bombMulLabel.getComponent(cc.Label) : null;
if (e) {
var t = this._bombCount || 0;
if (t <= 0) e.node.active = !1; else {
e.string = "炸弹×" + Math.pow(2, t);
e.node.active = !0;
}
}
},
_updateWarnBadge: function(e, t) {
if (e) {
var i = e.getChildByName("warnBadge");
if (i) if (1 === t) {
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
this._spineEfx(e, "baojing");
}
} else if (i.active) {
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
var i = e.length, n = this._handSlots.length, a = Math.floor((n - i) / 2);
a < 0 && (a = 0);
var s = this, o = e.map(function(e) {
var t = s.frameOf(e);
return e + "=" + (t ? t.name : "NULL");
});
console.log("[GP] renderHand N=" + i + " slots=" + n + " start=" + a + " 牌=" + o.join(" | "));
for (var r = 0; r < n; ++r) {
var l = this._handSlots[r], c = r - a;
if (c >= 0 && c < i) {
var h = e[c];
l._cardId = h;
l.getComponent(cc.Sprite).spriteFrame = this.frameOf(h);
l.active = !0;
l.y = (l._baseY || 0) + (this._selected[h] ? this._selectUpOffset : 0);
} else {
l._cardId = null;
l.active = !1;
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
_canShowPrepareImg: function() {
var e = cc.vv.gameNetMgr;
return !(!e || "begin" == e.gamestate || (e.numOfGames || 0) > 0);
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
for (var l = 0; l < r && s.length < 3; ++l) if (!o[l]) {
s.push(l);
o[l] = !0;
}
this._seatMap = s;
for (var c = 0; c < this._seatViews.length; ++c) {
var h = this._seatViews[c];
if (h && h.root) {
var d = c < s.length ? s[c] : c;
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
var C = this.findNode(h.root, "userSprite");
C && (C.active = b);
var y = 0;
if (n) {
var S = t ? t[d] : null;
y = S && S.userid ? S.userid : 0;
} else {
var N = i ? i[d] : null;
y = N && N.userid > 0 ? N.userid : 0;
}
var B = this.findNode(h.root, "icon");
B && (B.active = !0);
var M = this.findNode(h.root, "Z_user");
M && (M.active = !0);
if (B && y > 0) {
var w = B.getComponent("ImageLoader");
if (!w) try {
w = B.addComponent("ImageLoader");
} catch (e) {
w = null;
}
w && w.setUserID && w.setUserID(y);
}
this._updateWarnBadge(h.root, n && m ? m.count || 0 : -1);
}
}
}
var T = !1, x = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
if (i && this._canShowPrepareImg()) for (var I = 0; I < i.length; ++I) {
var P = i[I];
if (P && P.userid > 0 && P.ready && P.userid != x) {
T = !0;
break;
}
}
this._n.toprepareInfo && (this._n.toprepareInfo.active = T);
this.renderOppHands(t, n);
this.updateTurnUI();
},
renderOppHands: function(e, t) {
for (var i = cc.vv.gameNetMgr, n = e || (i ? i.gpSeats : null), a = this._seatMap || [], s = 1; s < this.maxPlayers; ++s) {
var o = this._oppSlots[s - 1];
if (o) {
for (var r = s < a.length ? a[s] : s, l = t && n && n[r] && n[r].count || 0, c = 0; c < o.length; ++c) o[c].active = c < l;
var h = this._oppLayout && this._oppLayout[s - 1];
if (l > 0 && h) for (var d = h.centerX - (l - 1) * h.gap / 2, u = 0; u < l; ++u) o[u].setPosition(d + u * h.gap, o[u].y);
}
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
this.showSeatTimers(!1, !1, 0);
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
this._n.passBtn.active = i;
if (this._n.passBtn) {
this._n.passBtn.opacity = 255;
this._n.passBtn.zIndex = 999;
this.setBtnEnabled(this._n.passBtn, i && !this._freePlay);
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
this._tickSettleCountdown();
if (this._over || this._deadline <= 0) {
this.setArrowTime("");
this.showSeatTimers(!1, !1, 0);
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
var i = null != this._turn && this._turn === cc.vv.gameNetMgr.gpMySeat;
this.showSeatTimers(i, !i, e);
}
},
showSeatTimers: function(e, t, i) {
if (this._n.myTimer) {
this._n.myTimer.active = !!e;
e && this.setStr(this._n.myTimerLabel, String(i));
}
if (this._n.upTimer) {
this._n.upTimer.active = !!t;
t && this.setStr(this._n.upTimerLabel, String(i));
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
this._stopSettleCountdown();
this.restoreSettleBg();
this._clearBoard();
this._n.readyBtn.active = !0;
this._n.prepareInfo.active = !1;
this._n.toprepareInfo && (this._n.toprepareInfo.active = !1);
this._n.handArea.active = !1;
this._n.playArea.active = !1;
this._n.playBtn.active = !1;
this._n.passBtn.active = !1;
this._n.hintBtn && (this._n.hintBtn.active = !1);
this.showSeatTimers(!1, !1, 0);
this.setStr(this._n.tipLabel, "等待所有玩家准备后开始");
this._n.historyBtn && (this._n.historyBtn.active = !1);
this._n.historyPanel && (this._n.historyPanel.active = !1);
this.updateActionBtns();
},
onReady: function() {
cc.vv.net.send("ready");
this._n.readyBtn.active = !1;
this._n.prepareInfo.active = this._canShowPrepareImg();
this.updateActionBtns();
},
onUserReady: function(e) {
if (e) {
this.renderSeats();
var t = e.userid == cc.vv.userMgr.userId, i = this._canShowPrepareImg();
!t && this._n.toprepareInfo && (this._n.toprepareInfo.active = !!e.ready && i);
if (t) {
this._n.readyBtn.active = !1;
this._n.prepareInfo.active = i;
}
this.updateActionBtns();
}
},
onSettleAgain: function() {
this._stopSettleCountdown();
if (this._final) cc.vv.net.send("exit"); else {
this._n.settlePanel.active = !1;
this._n.readyBtn.active = !1;
this._n.prepareInfo.active = this._canShowPrepareImg();
this._n.toprepareInfo && (this._n.toprepareInfo.active = !1);
this.restoreSettleBg();
this._over = !1;
this.updateActionBtns();
cc.vv.net.send("ready");
}
},
onSettleClose: function() {
this._stopSettleCountdown();
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
this.showSeatTimers(!1, !1, 0);
for (var n = !1, a = 0; a < e.length; ++a) if (e[a].allClosed) {
n = !0;
break;
}
n && this._spineEfx(this.node, "chuntian");
for (var s = 0, o = 0; o < e.length; ++o) if (e[o].seatindex == cc.vv.gameNetMgr.seatIndex) {
s = e[o].delta || 0;
break;
}
cc.vv.audioMgr && (s > 0 ? cc.vv.audioMgr.playSFX("win.mp3") : s < 0 && cc.vv.audioMgr.playSFX("lose.mp3"));
var r = this;
setTimeout(function() {
r.updateActionBtns();
}, 0);
for (var l = [], c = [], h = 0; h < e.length; ++h) {
var d = e[h], u = d.name || "玩家" + (d.seatindex + 1), g = u + "：";
if (d.isWinner) g += "出完手牌  赢 +" + d.delta + "分"; else {
g += "剩" + d.remain + "张";
d.allClosed && (g += "（全关×2）");
g += "  " + d.delta + "分";
}
l.push(g);
c.push(u + " " + (null != d.totalscore ? d.totalscore : d.score));
}
l.push("");
l.push("总分：" + c.join("   "));
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
this._fillRoundRows(e) || this.setBlackStr(this._n.settleContent, l.join("\n"));
this._n.settleAgainBtn && (this._n.settleAgainBtn.active = !0);
this._n.settleExitBtn && (this._n.settleExitBtn.active = !1);
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this._n.settlePanel.active = !0;
var m = null != t.gpMySeat ? t.gpMySeat : t.seatIndex, p = !1;
for (o = 0; o < e.length; ++o) {
var b = e[o];
if (b && (b.seatindex == m || b.userid && b.userid == cc.vv.userMgr.userId)) {
p = !!b.isWinner;
break;
}
}
var C = this._n.settlePanel.getChildByName("yesSprite"), y = this._n.settlePanel.getChildByName("noSprite");
C && (C.active = p);
y && (y.active = !p);
this._popIn(this._n.settlePanel);
this._startSettleCountdown();
this._n.settleNewBtn && (this._n.settleNewBtn.active = !0);
this.setStr(this._n.tipLabel, "本局结束");
}
}
},
_fillRoundRows: function(e) {
var t = this._n.settleContent;
if (!t) return !1;
if (!t.getChildByName("row1")) return !1;
for (var i = cc.vv.gameNetMgr && cc.vv.gameNetMgr.seats || [], n = 0; n < 3; ++n) {
var a = t.getChildByName("row" + (n + 1));
if (a) {
var s = e ? e[n] : null;
a.active = !!s;
if (s) {
var o = a.getChildByName("name");
o && this.setStr(o, s.name || "玩家" + ((s.seatindex || 0) + 1));
var r = a.getChildByName("detail");
if (r) {
var l = Number(s.remain);
l >= 0 || (l = 0);
this.setStr(r, "剩" + l + "张");
}
var c = a.getChildByName("score");
if (c) {
var h = Number(s.delta) || 0;
this.setStr(c, (h > 0 ? "+" + h : "" + h) + "分");
}
var d = a.getChildByName("win");
d && (d.active = !!s.isWinner);
var u = a.getChildByName("avatar"), g = i[s.seatindex || 0], v = g && g.userid || s.userid;
if (u && v) {
var _ = u.getComponent("ImageLoader");
if (!_) try {
_ = u.addComponent("ImageLoader");
} catch (e) {
_ = null;
}
_ && _.setUserID(v);
}
}
}
}
var f = t.getChildByName("total");
if (f) {
for (var m = [], p = 0; e && p < e.length; ++p) {
var b = e[p] || {};
m.push((b.name || "玩家" + ((b.seatindex || 0) + 1)) + " " + (null != b.totalscore ? b.totalscore : b.score));
}
this.setStr(f, "总分：" + m.join("   "));
}
return !0;
},
_startSettleCountdown: function() {
var e = this.settleCountdown > 0 ? this.settleCountdown : 15;
this._stopSettleCountdown(!0);
this._settleDeadline = Date.now() + 1e3 * e;
this._settleLeft = e;
this.setStr(this._n.settleTime, "" + e);
},
_tickSettleCountdown: function() {
if (this._settleDeadline) if (this._n.settlePanel && this._n.settlePanel.active) {
var e = Math.ceil((this._settleDeadline - Date.now()) / 1e3);
if (e > 0) {
if (e !== this._settleLeft) {
this._settleLeft = e;
this.setStr(this._n.settleTime, "" + e);
}
} else {
this._stopSettleCountdown();
this.onSettleAgain();
}
} else this._stopSettleCountdown();
},
_stopSettleCountdown: function(e) {
this._settleDeadline = 0;
this._settleLeft = 0;
e || this.setStr(this._n.settleTime, "");
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
this._stopSettleCountdown();
var t = cc.vv.gameNetMgr, i = e && e.endinfo && e.endinfo.length ? e.endinfo : null;
this._finalEndinfo = i;
var n = [];
if (i) for (var a = 0; a < i.length; ++a) {
var s = i[a] || {};
if (s.userid > 0) {
var o = Number(s.score) || 0;
n.push((s.name || "玩家") + " " + (o > 0 ? "+" + o : o));
}
} else for (var r = t.seats || [], l = 0; l < r.length; ++l) {
var c = r[l];
c && c.userid > 0 && n.push((c.name || "玩家") + " " + (c.score > 0 ? "+" + c.score : c.score));
}
var h = [ "最终总分：" + n.join("   ") ], d = e && e.roundHistory && e.roundHistory.length ? e.roundHistory : this._overRounds || [];
d.length && h.push("");
for (var u = 0; u < d.length; ++u) {
for (var g = d[u] || {}, v = [], _ = g.scores || [], f = 0; f < _.length; ++f) {
var m = _[f] || {};
v.push((m.name || "玩家") + " " + (m.score > 0 ? "+" + m.score : m.score));
}
h.push("第" + (g.index || u + 1) + "局  " + v.join("   "));
}
var p = h.join("\n");
if (this._showFinalResult(h, i)) {
this._n.settlePanel && (this._n.settlePanel.active = !1);
this._n.finalSettlePanel && (this._n.finalSettlePanel.active = !1);
this.setStr(this._n.tipLabel, "整场结束");
} else if (null != this._n.finalSettlePanel) {
this._n.settlePanel.active = !1;
this.setBlackStr(this._n.finalSettleTitle, "整场结算");
this._fitSettleFont(this._n.finalSettleContent, h);
this.setBlackStr(this._n.finalSettleContent, p);
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
this._fitSettleFont(this._n.settleContent, h);
this.setBlackStr(this._n.settleContent, p);
this._n.settlePanel.active = !0;
this._popIn(this._n.settlePanel);
this.setStr(this._n.tipLabel, "整场结束");
}
},
_showFinalResult: function(e, t) {
var i = this._n.gameResult;
if (null == i) return !1;
for (var n = [], a = 0; a < i.childrenCount; ++a) {
var s = i.children[a];
s && /^card\d+$/.test(s.name) && n.push(s);
}
if (0 === n.length) return !1;
var o = cc.vv.gameNetMgr && cc.vv.gameNetMgr.seats || [], r = null;
if (t && t.length) {
r = [];
for (var l = 0; l < t.length; ++l) t[l] && t[l].userid > 0 && r.push(t[l]);
}
if ((!r || 0 === r.length) && 0 === (r = this._finalEndinfo || []).length) {
r = [];
for (var c = 0; c < o.length; ++c) o[c] && o[c].userid > 0 && r.push(o[c]);
}
for (var h = -Infinity, d = 0; d < r.length; ++d) {
var u = r[d] && Number(r[d].score) || 0;
u > h && (h = u);
}
for (var g = 0; g < n.length; ++g) {
var v = n[g], _ = r[g];
v.active = !!_;
if (_) {
var f = Number(_.score) || 0, m = f > 0 && f === h, p = v.getChildByName("bbCardBg");
if (p) {
var b = p.getComponent(cc.Sprite);
if (b) {
p._gpBgFrame || (p._gpBgFrame = b.spriteFrame);
this._winBgFrame && (b.spriteFrame = m ? this._winBgFrame : p._gpBgFrame);
}
p.color = m ? cc.color(255, 255, 255) : f > 0 ? cc.color(255, 132, 112) : f < 0 ? cc.color(128, 166, 255) : cc.color(235, 235, 235);
}
var C = v.getChildByName("bbAvatar");
if (C && _.userid) {
var y = C.getComponent("ImageLoader");
if (!y) try {
y = C.addComponent("ImageLoader");
} catch (e) {
y = null;
}
y && y.setUserID && y.setUserID(_.userid);
}
this.setStr(v.getChildByName("bbPName"), _.name || "");
this.setStr(v.getChildByName("bbPId"), null != _.userid ? "ID:" + _.userid : "");
var S = v.getChildByName("bbPScore");
this.setStr(S, f > 0 ? "+" + f : "" + f);
S && (S.color = f > 0 ? cc.color(255, 212, 70) : f < 0 ? cc.color(92, 232, 160) : cc.color(240, 240, 255));
var N = v.getChildByName("bbWinTag");
N && (N.active = m);
}
}
var B = i.getChildByName("infoBar"), M = B ? B.getChildByName("infoLabel") : null;
if (M) {
var w = cc.vv.gameNetMgr || {}, T = w.getWanfa && w.getWanfa() || "", x = new Date(), I = function(e) {
return e < 10 ? "0" + e : "" + e;
};
this.setStr(M, "房号：" + (w.roomId || "") + "   " + T + "   " + x.getFullYear() + "-" + (x.getMonth() + 1) + "-" + x.getDate() + " " + I(x.getHours()) + ":" + I(x.getMinutes()));
}
i.active = !0;
this._startResultCountdown();
return !0;
},
_startResultCountdown: function() {
if (this._n.resultCountdown) {
var e = this.settleCountdown > 0 ? this.settleCountdown : 15;
this._stopResultCountdown(!0);
this._resultDeadline = Date.now() + 1e3 * e;
this.setStr(this._n.resultCountdown, "" + e);
this.schedule(this._tickResultCountdown, .2);
}
},
_tickResultCountdown: function() {
if (this._resultDeadline) {
var e = Math.ceil((this._resultDeadline - Date.now()) / 1e3);
if (e > 0) this.setStr(this._n.resultCountdown, "" + e); else {
this._stopResultCountdown();
this.onExit();
}
}
},
_stopResultCountdown: function(e) {
this.unschedule(this._tickResultCountdown);
this._resultDeadline = 0;
!e && this._n && this._n.resultCountdown && this.setStr(this._n.resultCountdown, "");
},
_fitSettleFont: function(e, t) {
if (null != e) {
var i = e.getComponent(cc.Label);
if (i) {
for (var n = 0, a = 0; a < t.length; ++a) {
for (var s = 0, o = t[a] || "", r = 0; r < o.length; ++r) s += o.charCodeAt(r) > 255 ? 2 : 1;
s > n && (n = s);
}
var l = e.width > 0 ? e.width : e.parent ? .9 * e.parent.width : 630, c = n > 0 ? Math.floor(l / n) : 32;
c > 32 && (c = 32);
c < 14 && (c = 14);
i.fontSize = c;
i.lineHeight = c + 4;
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
var e = this.findNode(this.node, "bg_choose");
e && (e.active = !1);
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
_initEmojiSpine: function() {
if (this._n.emojis) {
this._emojiSpineNames || (this._emojiSpineNames = [ "yihuo", "kuaidian", "zhenbang", "aini", "daxiao", "yunle", "yishoulanpai", "dengchang", "jingle", "huaixiao", "keshui", "886", "wolaile", "dalaozaici", "biepao" ]);
var e = this;
this._emojiSpine = this._emojiSpine || {};
var t = this._emojiSpineNames;
(function i(n) {
if (n >= t.length) {
cc.vv && (cc.vv.emojiSpines = cc.vv.emojiSpines || e._emojiSpine);
e._buildEmojiSpinePanel();
} else cc.resources.load("anims/smile/" + t[n], sp.SkeletonData, function(a, s) {
s && (e._emojiSpine[t[n]] = s);
i(n + 1);
});
})(0);
}
},
_emojiSpineSize: function(e) {
var t = e && e.skeletonJson && e.skeletonJson.skeleton;
return {
w: t && t.width || 240,
h: t && t.height || 270
};
},
_buildEmojiSpinePanel: function() {
if (!this._emojiPanelBuilt && this._n.emojis) {
var e = this._n.emojis, t = e;
1 === e.children.length && e.children[0].children.length > 0 && (t = e.children[0]);
if (t && t.children && t.children.length) {
this._emojiPanelBuilt = !0;
var i = this, n = this._emojiSpineNames;
t.children.slice().forEach(function(e, t) {
var a = n[t];
if (a) {
var s = e.getComponent(cc.Button);
s && (s.enabled = !1);
e.off(cc.Node.EventType.TOUCH_END);
e.on(cc.Node.EventType.TOUCH_END, function() {
i._n.chatPanel && (i._n.chatPanel.active = !1);
cc.vv.net.send("emoji", a);
});
var o = i._emojiSpine[a];
if (o) {
var r = e.getComponent(cc.Sprite);
r && (r.enabled = !1);
var l = i._emojiSpineSize(o), c = e.width > 0 ? e.width : 80, h = e.height > 0 ? e.height : 80, d = new cc.Node("skel");
d.parent = e;
d.setPosition(0, 0);
d.scale = .9 * Math.min(c / l.w, h / l.h);
var u = d.addComponent(sp.Skeleton);
u.skeletonData = o;
u.setAnimation(0, "animation", !0);
}
}
});
}
}
},
onBtnChatClose: function() {
this._n.chatPanel && (this._n.chatPanel.active = !1);
},
showEmojiBubble: function(e, t) {
if (!(null == e || e < 0)) {
var i = this._emojiSpine ? this._emojiSpine[t] : null;
if (i) {
var n = this._seatViews, a = this._seatMap, s = cc.vv.gameNetMgr, o = a && a.length ? a.indexOf(e) : e === s.seatIndex ? 0 : 1;
if (!(o < 0) && n[o]) {
var r = n[o].root.getChildByName("ChatBubble");
if (r) {
r.active = !0;
var l = r.getComponent(cc.Label);
l && (l.string = "");
var c = r.getChildByName("New Label");
c && (c.active = !1);
var h = r.getChildByName("chatbg_ld");
h && (h.active = !1);
var d = r.getChildByName("emojiSpine");
d && d.destroy();
var u = i.skeletonJson && i.skeletonJson.skeleton, g = u && u.width || 240, v = u && u.height || 270, _ = r.width > 0 ? r.width : 140, f = r.height > 0 ? r.height : 140, m = .9 * Math.min(_ / g, f / v), p = new cc.Node("emojiSpine");
p.parent = r;
p.setPosition(0, 0);
p.scale = m;
p.runAction(cc.sequence(cc.scaleTo(.12, 1.4 * m), cc.scaleTo(.18, m)));
var b = p.addComponent(sp.Skeleton);
b.skeletonData = i;
b.setAnimation(0, "animation", !0);
this._chatBubbleTimers = this._chatBubbleTimers || {};
this._chatBubbleTimers[e] && clearTimeout(this._chatBubbleTimers[e]);
this._chatBubbleTimers[e] = setTimeout(function() {
r.active = !1;
cc.isValid(p) && p.destroy();
}, 3e3);
}
}
}
}
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
this._n.toprepareInfo && (this._n.toprepareInfo.active = !1);
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
_lose: null,
_cdLabel: null,
_cdTickCb: null
},
onLoad: function() {
if (null != cc.vv && null != cc.vv.gameNetMgr.conf) {
"xzdd" == cc.vv.gameNetMgr.conf.type ? this._gameover = this.node.getChildByName("game_over") : this._gameover = this.node.getChildByName("game_over_xlch");
this._gameover.active = !1;
this._roundSettleClosed = !1;
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
this._gameover.getChildByName("wanfa").getComponent(cc.Label).string = cc.vv.gameNetMgr.getWanfa();
for (var n = this._gameover.getChildByName("result_list"), a = 1; a <= 4; ++a) {
var s = "s" + a, o = n.getChildByName(s), r = {};
r.username = o.getChildByName("username").getComponent(cc.Label);
r.reason = o.getChildByName("reason").getComponent(cc.Label);
var l = o.getChildByName("fan");
null != l && (r.fan = l.getComponent(cc.Label));
r.score = o.getChildByName("score").getComponent(cc.Label);
r.hu = o.getChildByName("hu");
r.mahjongs = o.getChildByName("pai");
r.zhuang = o.getChildByName("zhuang");
r.hupai = o.getChildByName("hupai");
r._pengandgang = [];
this._seats.push(r);
}
var c = this;
this.node.on("game_over", function(e) {
c.onGameOver(e.detail);
});
this.node.on("game_end", function() {
c._isGameEnd = !0;
c._roundSettleClosed ? c._showGameResult() : c._pendingGameEnd = !0;
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
_getHuDelay: function() {
var e = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.conf : null, t = e && null != e.hu_delay ? Number(e.hu_delay) : 2;
isNaN(t) && (t = 2);
return Math.max(0, t);
},
_isRoundSettlePending: function() {
return null != this._overDelayCb || null != this._gameover && this._gameover.active;
},
_showGameResult: function() {
this._pendingGameEnd = !1;
this._stopCountdown();
this._gameresult && (this._gameresult.active = !0);
this._gameover && (this._gameover.active = !1);
},
startAutoReadyTimer: function() {
if (this._autoReadyCb) {
this.unschedule(this._autoReadyCb);
this._autoReadyCb = null;
}
this._stopCountdown();
var e = this, t = this._ensureSettleCountdown();
if (t) {
var i = 30;
t.node.active = !0;
t.string = "" + i;
this._cdTickCb = function() {
i--;
cc.isValid(t.node) && (t.string = i > 0 ? "" + i : "0");
};
this.schedule(this._cdTickCb, 1, 28);
}
this._autoReadyCb = function() {
e._autoReadyCb = null;
e._stopCountdown();
if (e._gameover && e._gameover.active) {
console.log("[结算]30秒未操作,自动关闭结算弹窗");
e.onBtnReadyClicked();
}
};
this.scheduleOnce(this._autoReadyCb, 30);
},
_ensureSettleCountdown: function() {
if (this._cdLabel && cc.isValid(this._cdLabel.node)) return this._cdLabel;
if (null == this._gameover) return null;
var e = function e(t, i) {
if (null == t) return null;
if (t.name == i) return t;
for (var n = t.children || [], a = 0; a < n.length; ++a) {
var s = e(n[a], i);
if (s) return s;
}
return null;
}(this._gameover, "settleCountdown");
if (null == e) {
var t = this._gameover.getChildByName("btnReady");
(e = new cc.Node("settleCountdown")).setContentSize(360, 40);
e.setPosition(0, (t ? t.y : -327) + 70);
e.color = cc.color(255, 236, 150);
this._gameover.addChild(e);
}
var i = e.getComponent(cc.Label);
null == i && (i = e.addComponent(cc.Label));
i.fontSize = i.fontSize || 28;
i.lineHeight = i.lineHeight || 32;
i.string = "";
this._cdLabel = i;
return i;
},
_stopCountdown: function() {
if (this._cdTickCb) {
this.unschedule(this._cdTickCb);
this._cdTickCb = null;
}
if (this._cdLabel && cc.isValid(this._cdLabel.node)) {
this._cdLabel.string = "";
this._cdLabel.node.active = !1;
}
},
onGameOver: function(e) {
this._roundSettleClosed = !1;
this._pendingGameEnd = !1;
var t = this._getHuDelay();
if (t > 0) {
var i = this;
this._overDelayCb && this.unschedule(this._overDelayCb);
this._overDelayCb = function() {
i._overDelayCb = null;
i._showGameOver(e);
};
this.scheduleOnce(this._overDelayCb, t);
} else this._showGameOver(e);
},
_showGameOver: function(e) {
var t = cc.vv.gameNetMgr.conf.type;
"zp" == t || "zp4" == t || "wujin" == t || "wujin4" == t || "zj" == t || "zj_bt" == t || "zj4" == t || "zj4_bt" == t ? this.onGameOver_ZJ(e) : "xzdd" == t ? this.onGameOver_XZDD(e) : this.onGameOver_XLCH(e);
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
for (var r = !1, l = [], c = a.hupai, h = 0; h < c.children.length; ++h) c.children[h].active = !1;
var d = 0, u = s.huinfo || [];
for (h = 0; h < u.length; ++h) {
var g = u[h];
r = r || g.ishupai;
if (g.ishupai) {
if (d < c.children.length) {
var v = c.children[d];
v.active = !0;
v.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", g.pai);
d++;
}
"zimo" == g.action ? l.push("自摸") : "hu" == g.action && l.push("接炮胡");
if (null != g.fan) {
l.push(g.fan + "台");
g.tailog && g.tailog.length && l.push("\n" + g.tailog.join("\n"));
}
} else "fangpao" == g.action && l.push("放炮");
}
a.hu.active = r;
var _ = s.angangs || [], f = s.diangangs || [], m = s.wangangs || [], p = s.pengs || [], b = s.chis || [];
_.length && l.push("暗杠x" + _.length);
f.length && l.push("明杠x" + f.length);
m.length && l.push("补杠x" + m.length);
a.username.string = cc.vv.gameNetMgr.seats[n] ? cc.vv.gameNetMgr.seats[n].name : "";
a.zhuang.active = cc.vv.gameNetMgr.button == n;
var C = cc.vv.gameNetMgr.button == n && cc.vv.gameNetMgr.laozhuang || 0;
this.updateSettleLaoZhuang(a, C);
a.reason.string = l.join("、");
s.score > 0 ? a.score.string = "+" + s.score : a.score.string = "" + s.score;
for (var y = 0; y < a.mahjongs.childrenCount; ++y) a.mahjongs.children[y].active = !1;
var S = (s.holds || []).slice();
"object" == typeof S && null != S.length || (S = []);
cc.vv.mahjongmgr.sortMJ(S);
var N = _.length + m.length + f.length, B = 3 * (p.length + N + b.length);
for (y = 0; y < S.length; ++y) {
var M = S[y], w = a.mahjongs.children[y + B];
if (null == w) break;
w.active = !0;
w.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", M);
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
var x = s.pengTiles && s.pengTiles[y] || null;
this.initPengAndGangs(a, T, p[y], "peng", x);
T++;
}
for (y = 0; y < b.length; ++y) {
var I = b[y];
if (I && I.length > 0) {
this.initChisGroup(a, T, I);
T++;
}
}
} else o.active = !1;
}
this.startAutoReadyTimer();
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
for (var n = this._seats[i], a = e[i], s = !1, o = a.angangs.length + a.wangangs.length + a.diangangs.length, r = a.numofgen, l = [], c = !1, h = 0; h < a.actions.length; ++h) {
var d = a.actions[h];
if ("zimo" == d.type || "ganghua" == d.type || "dianganghua" == d.type || "hu" == d.type || "gangpaohu" == d.type || "qiangganghu" == d.type || "chadajiao" == d.type) {
"7pairs" == a.pattern ? l.push("七对") : "l7pairs" == a.pattern ? l.push("龙七对") : "j7pairs" == a.pattern ? l.push("将七对") : "duidui" == a.pattern ? l.push("碰碰胡") : "jiangdui" == a.pattern && l.push("将对");
"zimo" == d.type ? l.push("自摸") : "ganghua" == d.type ? l.push("杠上花") : "dianganghua" == d.type ? l.push("点杠花") : "gangpaohu" == d.type ? l.push("杠炮胡") : "qiangganghu" == d.type ? l.push("抢杠胡") : "chadajiao" == d.type && (c = !0);
s = !0;
} else "fangpao" == d.type ? l.push("放炮") : "angang" == d.type ? l.push("暗杠") : "diangang" == d.type ? l.push("明杠") : "wangang" == d.type ? l.push("弯杠") : "fanggang" == d.type ? l.push("放杠") : "zhuanshougang" == d.type ? l.push("转手杠") : "beiqianggang" == d.type ? l.push("被抢杠") : "beichadajiao" == d.type && l.push("被查叫");
}
if (s) {
a.qingyise && l.push("清一色");
a.menqing && l.push("门清");
a.zhongzhang && l.push("中张");
a.jingouhu && l.push("金钩胡");
a.haidihu && l.push("海底胡");
a.tianhu && l.push("天胡");
a.dihu && l.push("地胡");
r > 0 && l.push("根x" + r);
c && l.push("查大叫");
}
for (var u = 0; u < 3; ++u) n.hu.children[u].active = !1;
a.huorder >= 0 && (n.hu.children[a.huorder].active = !0);
n.username.string = cc.vv.gameNetMgr.seats[i].name;
n.zhuang.active = cc.vv.gameNetMgr.button == i;
n.reason.string = l.join("、");
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
this.startAutoReadyTimer();
} else this._gameresult.active = !0;
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
for (var n = this._seats[i], a = e[i], s = !1, o = [], r = n.hupai, l = 0; l < r.children.length; ++l) r.children[l].active = !1;
var c = 0;
for (l = 0; l < a.huinfo.length; ++l) {
var h = a.huinfo[l];
s = s || h.ishupai;
if (h.ishupai && c < r.children.length) {
var d = r.children[c];
d.active = !0;
d.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", h.pai);
c++;
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
this.startAutoReadyTimer();
} else this._gameresult.active = !0;
},
initPengAndGangs: function(e, t, i, n, a) {
var s = null;
if (e._pengandgang.length <= t) {
s = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e._pengandgang.push(s);
e.mahjongs.addChild(s);
} else (s = e._pengandgang[t]).active = !0;
for (var o = [], r = 0; r < s.childrenCount; ++r) {
var l = s.children[r].getComponent(cc.Sprite);
l && o.push(l);
}
for (var c = 0, h = 0; h < o.length; ++h) {
var d = o[h];
if ("gang" == d.node.name) {
var u = "peng" != n;
d.node.active = u;
d.node.scaleX = 1;
d.node.scaleY = 1;
if ("angang" == n) {
d.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
d.node.scaleX = 1.4;
d.node.scaleY = 1.4;
} else d.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", i);
} else {
var g = "peng" == n && a && c < a.length ? a[c] : i;
d.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", g);
c++;
}
}
this._tightenMeld(s, e, t);
},
_tightenMeld: function(e, t, i) {
for (var n = [], a = 0; a < e.childrenCount; ++a) {
var s = e.children[a];
if (s && "gang" != s.name) {
var o = s.getComponent(cc.Sprite);
if (null != o) {
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
s.width = 55;
s.height = 84;
s.scaleX = 1;
s.scaleY = 1;
n.push(s);
}
}
}
if (0 == n.length) return 50;
for (var r = 0; r < n.length; ++r) n[r].x = 50 * r;
var l = e.getChildByName("gang");
l && n.length > 1 && (l.x = n[1].x);
var c = t ? t.mahjongs : null, h = e.parent;
if (c && h) {
for (var d = [], u = 0; u < c.childrenCount; ++u) {
var g = c.children[u];
g && "gang" != g.name && (t._pengandgang && t._pengandgang.indexOf(g) >= 0 || null != g.getComponent(cc.Sprite) && d.push(g));
}
if (d.length > 0) {
var v = d[Math.min(3 * i, d.length - 1)], _ = c.convertToWorldSpaceAR(cc.v2(v.x, v.y)), f = h.convertToNodeSpaceAR(_);
e.x = f.x - n[0].x * e.scaleX;
e.y = f.y - n[0].y * e.scaleY;
return 50 * n.length;
}
}
e.x = 50 * i * n.length;
return 50 * n.length;
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
}), s = [], o = 0; o < n.childrenCount; ++o) {
var r = n.children[o].getComponent(cc.Sprite);
r && s.push(r);
}
for (var l = 0, c = 0; c < s.length; ++c) {
var h = s[c];
if ("gang" == h.node.name) h.node.active = !1; else {
var d = l < a.length ? a[l] : a[a.length - 1];
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", d);
l++;
}
}
this._tightenMeld(n, e, t);
},
onBtnReadyClicked: function() {
console.log("onBtnReadyClicked");
if (this._autoReadyCb) {
this.unschedule(this._autoReadyCb);
this._autoReadyCb = null;
}
this._stopCountdown();
this._roundSettleClosed = !0;
this._isGameEnd || this._pendingGameEnd ? this._showGameResult() : cc.vv.net.send("ready");
this._gameover.active = !1;
this.node.emit("game_over_popup_closed");
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
_lose: null,
_cdLabel: null,
_cdTickCb: null
},
onLoad: function() {
if (null != cc.vv) {
var e = "xzdd" == (cc.vv.gameNetMgr.conf || {}).type ? "game_over" : "game_over_xlch";
this._gameover = this.node.getChildByName(e) || this.node.getChildByName("game_over_xlch") || this.node.getChildByName("game_over");
if (null != this._gameover) {
this._gameover.active = !1;
this._roundSettleClosed = !1;
this._pingju = this.findDeep(this._gameover, "pingju");
this._win = this.findDeep(this._gameover, "win");
this._lose = this.findDeep(this._gameover, "lose");
this._gameresult = this.node.getChildByName("game_result");
try {
var t = this.findDeep(this._gameover, "wanfa"), i = t ? t.getComponent(cc.Label) : null;
i && cc.vv.gameNetMgr.getWanfa && (i.string = cc.vv.gameNetMgr.getWanfa());
var n = this.findDeep(this._gameover, "result_list");
null == n && console.error("[GameOver] 结算弹窗缺少 result_list 列表节点");
for (var a = function(e, t) {
var i = e ? e.getChildByName(t) : null;
return i ? i.getComponent(cc.Label) : null;
}, s = 1; s <= 4 && null != n; ++s) {
var o = n.getChildByName("s" + s);
if (null == o) break;
var r = {};
r.username = a(o, "username");
r.reason = a(o, "reason");
r.score = a(o, "score");
r.fan = a(o, "fan");
r.hu = o.getChildByName("hu");
r.mahjongs = o.getChildByName("pai");
r.meldArea = o.getChildByName("meldArea");
r.zhuang = o.getChildByName("zhuang");
r.hupai = o.getChildByName("hupai");
r.avatar = o.getChildByName("useravatars");
r._pengandgang = [];
this._seats.push(r);
}
} catch (e) {
console.error("[GameOver] 结算弹窗节点初始化异常:", e && e.stack ? e.stack : e);
}
var l = this;
this.node.on("game_over", function(e) {
l.onGameOver(e.detail);
});
console.log("[GameOver] 结算弹窗初始化完成, 座位行数=" + this._seats.length);
this.node.on("game_end", function() {
l._isGameEnd = !0;
l._roundSettleClosed ? l._showGameResult() : l._pendingGameEnd = !0;
});
} else console.error("[GameOver] 场景里没有结算弹窗节点,跳过初始化");
}
},
setAvatar: function(e, t) {
if (null != e && null != t) {
var i = e.getComponent("ImageLoader");
if (null == i) try {
i = e.addComponent("ImageLoader");
} catch (e) {
i = null;
}
i && i.setUserID && i.setUserID(t);
}
},
showTitle: function(e) {
var t = {
pingju: this._pingju,
win: this._win,
lose: this._lose
};
for (var i in t) t[i] && (t[i].active = i == e);
},
findDeep: function(e, t) {
if (null == e) return null;
if (e.name == t) return e;
for (var i = e.children || [], n = 0; n < i.length; ++n) {
var a = this.findDeep(i[n], t);
if (a) return a;
}
return null;
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
_getHuDelay: function() {
var e = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.conf : null, t = e && null != e.hu_delay ? Number(e.hu_delay) : 2;
isNaN(t) && (t = 2);
return Math.max(0, t);
},
onGameOver: function(e) {
this._roundSettleClosed = !1;
this._pendingGameEnd = !1;
this._roundButton = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.button : -1;
var t = this._getHuDelay();
console.log("[GameOver] 收到小局结算, hu_delay=" + t + ", rows=" + (e ? e.length : 0));
if (t > 0) {
var i = this;
this._overDelayCb && this.unschedule(this._overDelayCb);
this._overDelayCb = function() {
i._overDelayCb = null;
i._showGameOver(e);
};
this.scheduleOnce(this._overDelayCb, t);
} else this._showGameOver(e);
},
_showGameOver: function(e) {
this._gameover && this._gameover.setSiblingIndex(this.node.childrenCount - 1);
var t = (cc.vv.gameNetMgr && cc.vv.gameNetMgr.conf ? cc.vv.gameNetMgr.conf : {}).type || "";
try {
"zj" == t || "zj_bt" == t || "zj4" == t || "zj4_bt" == t || "zj_lao" == t || "zj_zx" == t || "zj4_zx" == t ? this.onGameOver_ZJ(e) : "xzdd" == t ? this.onGameOver_XZDD(e) : this.onGameOver_XLCH(e);
} catch (e) {
console.error("[GameOver] 结算弹窗填充异常:", e && e.stack ? e.stack : e);
this._gameover && (this._gameover.active = !0);
}
},
onGameOver_ZJ: function(e) {
var t = cc.vv.gameNetMgr.conf ? cc.vv.gameNetMgr.conf.type : null;
console.log(e);
if (e && 0 != e.length) {
this._gameover.active = !0;
this._popIn(this._gameover);
this.showTitle("none");
for (var i = cc.vv.gameNetMgr.seatIndex, n = 0, a = 0; a < e.length; ++a) if (e[a] && e[a].userid == cc.vv.gameNetMgr.seats[i].userid) {
n = e[a].score;
break;
}
this.showTitle(n > 0 ? "win" : n < 0 ? "lose" : "pingju");
for (a = 0; a < this._seats.length; ++a) {
var s = this._seats[a], o = e[a], r = s.username.node.parent;
if (o) {
r.active = !0;
for (var l = !1, c = [], h = s.hupai, d = 0; d < h.children.length; ++d) h.children[d].active = !1;
var u = 0, g = o.huinfo || [];
for (d = 0; d < g.length; ++d) {
var v = g[d];
l = l || v.ishupai;
if (v.ishupai) {
if (u < h.children.length) {
var _ = h.children[u];
_.active = !0;
_.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", v.pai);
u++;
}
"zimo" == v.action ? c.push("自摸") : "hu" == v.action && c.push("接炮胡");
if ("zj_lao" == t) {
if (v.tailog && v.tailog.length) {
for (var f = [], m = 0; m < v.tailog.length; ++m) v.tailog[m].indexOf("×2") >= 0 && f.push(v.tailog[m]);
f.length && c.push(f.join("，"));
}
} else if (null != v.fan) {
c.push(v.fan + "台");
v.tailog && v.tailog.length && c.push("(" + v.tailog.join("，") + ")");
}
} else "fangpao" == v.action && c.push("放炮");
}
if ("zj_bt" == t) {
if (o.isBao) {
var p = "";
0 === o.baoModeOfRound ? p = "无财" : 1 === o.baoModeOfRound ? p = "独财" : 2 === o.baoModeOfRound && (p = "双财");
var b = "包家" + p;
o.baoTaiOfRound && (b += "包" + o.baoTaiOfRound + "台");
c.unshift(b);
}
var C = o.huBaseScore || 0, y = o.baoTaiScore || 0;
0 != C && c.push("胡牌分" + (C > 0 ? "+" : "") + C);
0 != y && c.push("包台分" + (y > 0 ? "+" : "") + y);
}
s.hu.active = l;
var S = o.angangs || [], N = o.diangangs || [], B = o.wangangs || [], M = o.pengs || [], w = o.chis || [];
S.length && c.push("暗杠x" + S.length);
N.length && c.push("明杠x" + N.length);
B.length && c.push("补杠x" + B.length);
s.username.string = cc.vv.gameNetMgr.seats[a] ? cc.vv.gameNetMgr.seats[a].name : "";
this.setAvatar(s.avatar, o.userid);
s.zhuang.active = cc.vv.gameNetMgr.button == a;
var T = cc.vv.gameNetMgr.button == a && cc.vv.gameNetMgr.laozhuang || 0;
this.updateSettleLaoZhuang(s, T);
s.reason.string = c.join("、");
o.score > 0 ? s.score.string = "+" + o.score : s.score.string = "" + o.score;
for (var x = 0; x < s.mahjongs.childrenCount; ++x) s.mahjongs.children[x].active = !1;
var I = (o.holds || []).slice();
"object" == typeof I && null != I.length || (I = []);
cc.vv.mahjongmgr.sortMJ(I);
var P = S.length + B.length + N.length, A = 3 * (M.length + P + w.length);
for (x = 0; x < I.length; ++x) {
var L = I[x], R = s.mahjongs.children[x + A];
if (null == R) break;
R.active = !0;
R.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", L);
}
for (x = 0; x < s._pengandgang.length; ++x) s._pengandgang[x].active = !1;
var k = 0;
for (x = 0; x < S.length; ++x) {
this.initPengAndGangs(s, k, S[x], "angang");
k++;
}
for (x = 0; x < N.length; ++x) {
this.initPengAndGangs(s, k, N[x], "diangang");
k++;
}
for (x = 0; x < B.length; ++x) {
this.initPengAndGangs(s, k, B[x], "wangang");
k++;
}
for (x = 0; x < M.length; ++x) {
var O = o.pengTiles && o.pengTiles[x] || null;
this.initPengAndGangs(s, k, M[x], "peng", O);
k++;
}
for (x = 0; x < w.length; ++x) {
var F = w[x];
if (F && F.length > 0) {
this.initChisGroup(s, k, F);
k++;
}
}
} else r.active = !1;
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
var n = this.findDeep(this._gameover, "settleCsArea");
if (n) {
n.active = !0;
var a = i >= 0 && i != t ? [ t, i ] : [ t ], s = n.getChildByName("csLab");
s && (s.active = !0);
for (var o = 0; o < 2; ++o) {
var r = n.getChildByName("cs" + o);
if (r) {
var l = r.getComponent(cc.Sprite);
if (o < a.length) {
r.active = !0;
l && (l.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", a[o]));
} else r.active = !1;
}
}
} else console.log("[结算财神] 场景内未找到 settleCsArea 节点,跳过显示(请在结算弹窗下手动添加)");
}
}
},
_isRoundSettlePending: function() {
return null != this._overDelayCb || null != this._gameover && this._gameover.active;
},
_showGameResult: function() {
this._pendingGameEnd = !1;
this._stopCountdown();
this._gameresult && (this._gameresult.active = !0);
this._gameover && (this._gameover.active = !1);
},
startAutoReadyTimer: function() {
if (this._autoReadyCb) {
this.unschedule(this._autoReadyCb);
this._autoReadyCb = null;
}
this._stopCountdown();
var e = this, t = this._ensureSettleCountdown();
if (t) {
var i = 30;
t.node.active = !0;
t.string = "" + i;
this._cdTickCb = function() {
i--;
cc.isValid(t.node) && (t.string = i > 0 ? "" + i : "0");
};
this.schedule(this._cdTickCb, 1, 28);
}
this._autoReadyCb = function() {
e._autoReadyCb = null;
e._stopCountdown();
if (e._gameover && e._gameover.active) {
console.log("[结算]30秒未操作,自动准备下一局");
e.onBtnReadyClicked();
}
};
this.scheduleOnce(this._autoReadyCb, 30);
},
_ensureSettleCountdown: function() {
if (this._cdLabel && cc.isValid(this._cdLabel.node)) return this._cdLabel;
if (null == this._gameover) return null;
var e = this.findDeep(this._gameover, "settleCountdown");
if (null == e) {
var t = this.findDeep(this._gameover, "btnReady");
(e = new cc.Node("settleCountdown")).setContentSize(360, 40);
e.setPosition(0, (t ? t.y : -327) + 70);
e.color = cc.color(255, 236, 150);
this._gameover.addChild(e);
}
var i = e.getComponent(cc.Label);
null == i && (i = e.addComponent(cc.Label));
i.fontSize = i.fontSize || 28;
i.lineHeight = i.lineHeight || 32;
i.string = "";
this._cdLabel = i;
return i;
},
_stopCountdown: function() {
if (this._cdTickCb) {
this.unschedule(this._cdTickCb);
this._cdTickCb = null;
}
if (this._cdLabel && cc.isValid(this._cdLabel.node)) {
this._cdLabel.string = "";
this._cdLabel.node.active = !1;
}
},
updateSettleLaoZhuang: function(e, t) {
var i = e.zhuang;
if (i) {
var n = i.getChildByName("laozhuang_ex");
if (null != n) {
var a = null != t && t >= 1;
n.active = a;
if (a) {
var s = n.getComponent(cc.Label);
s && (s.string = "老庄" + t);
}
}
}
},
onGameOver_XZDD: function(e) {
console.log(e);
if (0 != e.length) {
this._gameover.active = !0;
this._popIn(this._gameover);
var t = e[cc.vv.gameNetMgr.seatIndex].score;
this.showTitle(t > 0 ? "win" : t < 0 ? "lose" : "pingju");
for (var i = 0; i < 4; ++i) {
for (var n = this._seats[i], a = e[i], s = !1, o = a.angangs.length + a.wangangs.length + a.diangangs.length, r = a.numofgen, l = [], c = !1, h = 0; h < a.actions.length; ++h) {
var d = a.actions[h];
if ("zimo" == d.type || "ganghua" == d.type || "dianganghua" == d.type || "hu" == d.type || "gangpaohu" == d.type || "qiangganghu" == d.type || "chadajiao" == d.type) {
"7pairs" == a.pattern ? l.push("七对") : "l7pairs" == a.pattern ? l.push("龙七对") : "j7pairs" == a.pattern ? l.push("将七对") : "duidui" == a.pattern ? l.push("碰碰胡") : "jiangdui" == a.pattern && l.push("将对");
"zimo" == d.type ? l.push("自摸") : "ganghua" == d.type ? l.push("杠上花") : "dianganghua" == d.type ? l.push("点杠花") : "gangpaohu" == d.type ? l.push("杠炮胡") : "qiangganghu" == d.type ? l.push("抢杠胡") : "chadajiao" == d.type && (c = !0);
s = !0;
} else "fangpao" == d.type ? l.push("放炮") : "angang" == d.type ? l.push("暗杠") : "diangang" == d.type ? l.push("明杠") : "wangang" == d.type ? l.push("弯杠") : "fanggang" == d.type ? l.push("放杠") : "zhuanshougang" == d.type ? l.push("转手杠") : "beiqianggang" == d.type ? l.push("被抢杠") : "beichadajiao" == d.type && l.push("被查叫");
}
if (s) {
a.qingyise && l.push("清一色");
a.menqing && l.push("门清");
a.zhongzhang && l.push("中张");
a.jingouhu && l.push("金钩胡");
a.haidihu && l.push("海底胡");
a.tianhu && l.push("天胡");
a.dihu && l.push("地胡");
r > 0 && l.push("根x" + r);
c && l.push("查大叫");
}
for (var u = 0; u < 3; ++u) n.hu.children[u].active = !1;
a.huorder >= 0 && (n.hu.children[a.huorder].active = !0);
n.username.string = cc.vv.gameNetMgr.seats[i].name;
n.zhuang.active = cc.vv.gameNetMgr.button == i;
n.reason.string = l.join("、");
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
this.startAutoReadyTimer();
} else this._gameresult.active = !0;
},
onGameOver_XLCH: function(e) {
console.log(e);
if (0 != e.length) {
this._gameover.active = !0;
this._popIn(this._gameover);
var t = e[cc.vv.gameNetMgr.seatIndex] ? e[cc.vv.gameNetMgr.seatIndex].score : 0;
this.showTitle(t > 0 ? "win" : t < 0 ? "lose" : "pingju");
for (var i = Math.min(4, this._seats.length, e.length), n = 0; n < 4; ++n) {
var a = this._seats[n], s = e[n];
a && a.username && a.username.node && a.username.node.parent && (a.username.node.parent.active = n < i);
if (!(n >= i) && a && s) {
var o = !1, r = [], l = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[n] : null;
a.username && (a.username.string = l && l.name || s.name || "");
a.zhuang && (a.zhuang.active = (null != this._roundButton ? this._roundButton : -1) == n);
a.score && (a.score.string = s.score > 0 ? "+" + s.score : "" + (s.score || 0));
a.hu && (a.hu.active = !1);
this.setAvatar(a.avatar, s.userid);
var c = a.hupai, h = s.huinfo || [];
try {
if (c) for (var d = 0; d < c.children.length; ++d) c.children[d].active = !1;
var u = 0;
for (d = 0; d < h.length; ++d) {
var g = h[d];
o = o || g.ishupai;
if (g.ishupai && c && u < c.children.length) {
var v = c.children[u];
v.active = !0;
v.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", g.pai);
u++;
}
var _ = "", f = "", m = s;
if (g.ishupai) {
"hu" == g.action ? _ = "接炮胡" : "zimo" == g.action ? _ = "自摸" : "ganghua" == g.action ? _ = "杠上花" : "dianganghua" == g.action ? _ = "点杠花" : "gangpaohu" == g.action ? _ = "杠炮胡" : "qiangganghu" == g.action ? _ = "抢杠胡" : "chadajiao" == g.action && (_ = "查大叫");
var p = _ += "(";
if ("7pairs" == g.pattern) {
_ += "七对";
f = "、";
} else if ("l7pairs" == g.pattern) {
_ += "龙七对";
f = "、";
} else if ("j7pairs" == g.pattern) {
_ += "将七对";
f = "、";
} else if ("duidui" == g.pattern) {
_ += "碰碰胡";
f = "、";
} else if ("jiangdui" == g.pattern) {
_ += "将对";
f = "、";
}
if (g.haidihu) {
_ += f + "海底胡";
f = "、";
}
if (g.tianhu) {
_ += f + "天胡";
f = "、";
}
if (g.dihu) {
_ += f + "地胡";
f = "、";
}
if (m && m.qingyise) {
_ += f + "清一色";
f = "、";
}
if (m && m.menqing) {
_ += f + "门清";
f = "、";
}
if (m && m.jingouhu) {
_ += f + "金钩胡";
f = "、";
}
if (m && m.zhongzhang) {
_ += f + "中张";
f = "、";
}
if (g.numofgen > 0) {
_ += f + "根x" + g.numofgen;
f = "、";
}
if (g.tailog && g.tailog.length) _ = p + g.fan + "番：" + g.tailog.join("、") + ")"; else {
"" == f && (_ += "平胡");
_ += "、" + g.fan + "番)";
}
r.push(_);
} else {
_ = "fangpao" == g.action ? "放炮" : "gangpao" == g.action ? "杠上炮" : "beiqianggang" == g.action ? "被抢杠" : "被查大叫";
m = null;
for (var b = 0; b < e.length; ++b) if (e[b] && e[b].userid == g.target) {
m = e[b];
break;
}
null == m && e[g.target] && (m = e[g.target]);
var C = m && m.huinfo ? m.huinfo[g.index] : null;
if (null == C) continue;
r.push(_ + "(" + (C.fan || 0) + "番)");
}
}
a.hu && (a.hu.active = o);
var y = s.angangs || [], S = s.diangangs || [], N = s.wangangs || [], B = s.pengs || [], M = s.chis || [], w = s.holds || [];
y.length && r.push("暗杠x" + y.length);
S.length && r.push("明杠x" + S.length);
N.length && r.push("巴杠x" + N.length);
var T = s.hua || [];
o && T.length && r.push("花x" + T.length);
a.reason && (a.reason.string = r.join("、"));
var x = a.mahjongs;
if (x) for (var I = 0; I < x.childrenCount; ++I) (L = x.children[I]).active = !1;
cc.vv.mahjongmgr.sortMJ(w, s.dingque);
var P = y.length + N.length + S.length, A = 3 * (B.length + P + M.length);
for (I = 0; x && I < w.length; ++I) {
var L, R = w[I];
if (null != (L = x.children[I + A])) {
L.active = !0;
L.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", R);
}
}
for (I = 0; I < a._pengandgang.length; ++I) a._pengandgang[I].active = !1;
var k = 0;
for (I = 0; I < y.length; ++I) {
this.initPengAndGangs(a, k, y[I], "angang");
k++;
}
for (I = 0; I < S.length; ++I) {
this.initPengAndGangs(a, k, S[I], "diangang");
k++;
}
for (I = 0; I < N.length; ++I) {
this.initPengAndGangs(a, k, N[I], "wangang");
k++;
}
for (I = 0; I < B.length; ++I) {
this.initPengAndGangs(a, k, B[I], "peng");
k++;
}
for (I = 0; I < M.length; ++I) {
var O = M[I];
if (O && O.length > 0) {
this.initChisGroup(a, k, O);
k++;
}
}
} catch (e) {
console.error("[GameOver] 第" + (n + 1) + "行结算填充异常:", e && e.stack ? e.stack : e);
}
}
}
this.startAutoReadyTimer();
} else this._gameresult.active = !0;
},
initPengAndGangs: function(e, t, i, n, a) {
var s = null, o = e.meldArea || e.mahjongs;
if (e._pengandgang.length <= t) {
s = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e._pengandgang.push(s);
o.addChild(s);
} else (s = e._pengandgang[t]).active = !0;
for (var r = [], l = 0; l < s.childrenCount; ++l) {
var c = s.children[l].getComponent(cc.Sprite);
c && r.push(c);
}
for (var h = 0, d = 0; d < r.length; ++d) {
var u = r[d];
if ("gang" == u.node.name) {
var g = "peng" != n;
u.node.active = g;
u.node.scaleX = 1;
u.node.scaleY = 1;
if ("angang" == n) {
u.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
u.node.scaleX = 1.4;
u.node.scaleY = 1.4;
} else u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", i);
} else {
var v = "peng" == n && a && h < a.length ? a[h] : i;
u.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", v);
h++;
}
}
this._tightenMeld(s, e, t);
},
_tightenMeld: function(e, t, i) {
for (var n = [], a = 0; a < e.childrenCount; ++a) {
var s = e.children[a];
if (s && "gang" != s.name) {
var o = s.getComponent(cc.Sprite);
if (null != o) {
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
s.width = 55;
s.height = 84;
s.scaleX = 1;
s.scaleY = 1;
n.push(s);
}
}
}
if (0 == n.length) return 50;
for (var r = 0; r < n.length; ++r) n[r].x = 50 * r;
var l = e.getChildByName("gang");
l && n.length > 1 && (l.x = n[1].x);
var c = t ? t.mahjongs : null, h = e.parent;
if (c && h) {
for (var d = [], u = 0; u < c.childrenCount; ++u) {
var g = c.children[u];
g && "gang" != g.name && (t._pengandgang && t._pengandgang.indexOf(g) >= 0 || null != g.getComponent(cc.Sprite) && d.push(g));
}
if (d.length > 0) {
var v = d[Math.min(3 * i, d.length - 1)], _ = c.convertToWorldSpaceAR(cc.v2(v.x, v.y)), f = h.convertToNodeSpaceAR(_);
e.x = f.x - n[0].x * e.scaleX;
e.y = f.y - n[0].y * e.scaleY;
return 50 * n.length;
}
}
e.x = 50 * i * n.length;
return 50 * n.length;
},
initChisGroup: function(e, t, i) {
var n = null, a = e.meldArea || e.mahjongs;
if (e._pengandgang.length <= t) {
n = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
e._pengandgang.push(n);
a.addChild(n);
} else (n = e._pengandgang[t]).active = !0;
for (var s = i.slice().sort(function(e, t) {
return e - t;
}), o = [], r = 0; r < n.childrenCount; ++r) {
var l = n.children[r].getComponent(cc.Sprite);
l && o.push(l);
}
for (var c = 0, h = 0; h < o.length; ++h) {
var d = o[h];
if ("gang" == d.node.name) d.node.active = !1; else {
var u = c < s.length ? s[c] : s[s.length - 1];
d.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", u);
c++;
}
}
this._tightenMeld(n, e, t);
},
onBtnReadyClicked: function() {
console.log("onBtnReadyClicked");
if (this._autoReadyCb) {
this.unschedule(this._autoReadyCb);
this._autoReadyCb = null;
}
this._stopCountdown();
this._roundSettleClosed = !0;
this._isGameEnd || this._pendingGameEnd ? this._showGameResult() : cc.vv.net.send("ready");
this._gameover.active = !1;
this.node.emit("game_over_popup_closed");
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
var e = cc.find("Canvas/game_result/btnClose"), t = cc.find("Canvas/game_result/btnShare");
t && cc.vv.utils.addClickEvent(t, this.node, "GameResult", "onBtnCloseClicked");
e && (e.active = !1);
var i = this;
this._winBgFrame = null;
this._lastRenderArgs = null;
cc.resources.load("images/atlas/baoqei_f", cc.SpriteAtlas, function(e, t) {
if (!e && t) {
var n = t.getSpriteFrame("大赢家.png") || t.getSpriteFrame("大赢家");
if (n) {
i._winBgFrame = n;
i._lastRenderArgs && i.renderList(i._lastRenderArgs[0], i._lastRenderArgs[1]);
} else console.log("[GameResult] 图集里没有大赢家帧");
} else console.log("[GameResult] 大赢家图集加载失败", e);
});
this.node.on("game_end", function(e) {
var t = e.detail || {};
i._pendingEnd = {
endinfo: t.endinfo,
roundHistory: t.roundHistory
};
var n = cc.vv ? cc.vv.gameNetMgr : null;
if (n && n.roundSettleAwait) i._armEndFallback(); else {
var a = !1, s = i.getComponent("GameOver");
s && s._isRoundSettlePending && s._isRoundSettlePending() && (a = !0);
var o = i.getComponent("GameOverZP");
!a && o && o._isRoundSettlePending && o._isRoundSettlePending() && (a = !0);
a ? i._armEndFallback() : i._flushGameEnd();
}
});
this.node.on("game_over_popup_closed", function() {
var e = cc.vv ? cc.vv.gameNetMgr : null;
e && (e.roundSettleAwait = !1);
i._clearEndFallback();
i._flushGameEnd();
});
}
},
_armEndFallback: function() {
var e = this;
this._clearEndFallback();
this._endFallbackTimer = setTimeout(function() {
e._endFallbackTimer = null;
if (e._isRoundSettleShowing()) e._armEndFallback(); else {
cc.vv && cc.vv.gameNetMgr && (cc.vv.gameNetMgr.roundSettleAwait = !1);
e._flushGameEnd();
}
}, 8e3);
},
_isRoundSettleShowing: function() {
var e = this.getComponent("GameOver");
if (e && e._gameover && e._gameover.active) return !0;
var t = this.getComponent("GameOverZP");
if (t && t._gameover && t._gameover.active) return !0;
var i = cc.find("Canvas/game_over_xlch");
if (i && i.active) return !0;
var n = cc.find("Canvas/game_over");
return !(!n || !n.active);
},
_clearEndFallback: function() {
if (this._endFallbackTimer) {
clearTimeout(this._endFallbackTimer);
this._endFallbackTimer = null;
}
},
onDestroy: function() {
this._clearEndFallback();
this._stopExitCountdown();
},
_flushGameEnd: function() {
var e = this._pendingEnd;
if (e) {
this._pendingEnd = null;
this.onGameEnd(e.endinfo, e.roundHistory);
}
},
signedNum: function(e) {
return (e = e || 0) > 0 ? "+" + e : "" + e;
},
renderList: function(e, t) {
this._lastRenderArgs = [ e, t ];
if (null != this._gameresult) {
var i = this._gameresult;
this.setInfoLine(i);
var n = this.getCards(i);
if (0 !== n.length) {
var a = cc.vv.gameNetMgr.seats || [];
a.length > n.length && console.warn("[GameResult] 座位数(" + a.length + ")多于卡片数(" + n.length + "),多出的座位不显示");
for (var s = -Infinity, o = 0; o < a.length; ++o) {
var r = a[o] && Number(a[o].score) || 0;
r > s && (s = r);
}
for (var l = 0; l < n.length; ++l) {
var c = n[l], h = a[l];
c.node.active = !!h;
if (h) {
var d = Number(h.score) || 0, u = d > 0 && d == s;
if (c.bg) {
var g = c.bg.getComponent(cc.Sprite);
if (g) {
c._bgFrame || (c._bgFrame = g.spriteFrame);
this._winBgFrame && (g.spriteFrame = u ? this._winBgFrame : c._bgFrame);
}
c.bg.color = u ? cc.color(255, 255, 255) : d > 0 ? cc.color(255, 132, 112) : d < 0 ? cc.color(128, 166, 255) : cc.color(235, 235, 235);
}
if (c.avatar && h.userid) {
var v = c.avatar.getComponent("ImageLoader");
if (null == v) try {
v = c.avatar.addComponent("ImageLoader");
} catch (e) {}
v && v.setUserID && v.setUserID(h.userid);
}
this.setText(c.name, h.name || "");
this.setText(c.id, null != h.userid ? "ID:" + h.userid : "");
this.setText(c.score, this.signedNum(d));
c.score && (c.score.color = d > 0 ? cc.color(255, 212, 70) : d < 0 ? cc.color(92, 232, 160) : cc.color(240, 240, 255));
c.win && (c.win.active = d > 0 && d == s);
}
}
} else console.error("[GameResult] 场景缺少 game_result/card0、card1 玩家卡片");
}
},
getCards: function(e) {
for (var t = [], i = 0; i < e.childrenCount; ++i) {
var n = e.children[i];
n && /^card\d+$/.test(n.name) && t.push({
idx: parseInt(n.name.substring(4), 10),
node: n
});
}
t.sort(function(e, t) {
return e.idx - t.idx;
});
for (var a = [], s = 0; s < t.length; ++s) {
var o = t[s].node;
a.push({
node: o,
bg: o.getChildByName("bbCardBg"),
win: o.getChildByName("bbWinTag"),
avatar: o.getChildByName("bbAvatar"),
name: o.getChildByName("bbPName"),
id: o.getChildByName("bbPId"),
score: o.getChildByName("bbPScore")
});
}
return a;
},
setInfoLine: function(e) {
var t = e.getChildByName("infoBar"), i = t ? t.getChildByName("infoLabel") : null, n = i ? i.getComponent(cc.Label) : null;
if (null != n) {
var a = cc.vv.gameNetMgr || {}, s = a.getWanfa && a.getWanfa() || "", o = new Date(), r = function(e) {
return e < 10 ? "0" + e : "" + e;
}, l = o.getFullYear() + "-" + (o.getMonth() + 1) + "-" + o.getDate() + " " + r(o.getHours()) + ":" + r(o.getMinutes());
n.string = "房号：" + (a.roomId || "") + "   " + s + "   " + l;
}
},
setText: function(e, t) {
if (null != e) {
var i = e.getComponent(cc.Label);
i && (i.string = null == t ? "" : "" + t);
}
},
showTotalScore: function() {
this.renderList(null, null);
},
onGameEnd: function(e, t) {
null == this._gameresult && (this._gameresult = this.node.getChildByName("game_result"));
this._gameresult && (this._gameresult.active = !0);
this._startExitCountdown(30);
t && t.length > 0 ? this.renderList(null, t) : e ? this.renderList(e, null) : this.showTotalScore();
},
_startExitCountdown: function(e) {
this._stopExitCountdown();
var t = this._gameresult || this.node.getChildByName("game_result"), i = t ? this._findChildByName(t, "countdown") : null;
null == i && console.warn("[GameResult] 场景 game_result 下找不到 countdown 倒计时节点");
this._cdLabel = i ? i.getComponent(cc.Label) : null;
i && (i.active = !0);
this._cdLeft = e;
var n = this;
this._cdCb = function() {
n._cdLeft--;
n._cdLabel && (n._cdLabel.string = "" + Math.max(0, n._cdLeft));
if (n._cdLeft <= 0) {
n._stopExitCountdown();
n.onBtnCloseClicked();
}
};
this._cdLabel && (this._cdLabel.string = "" + this._cdLeft);
this.schedule(this._cdCb, 1);
},
_findChildByName: function(e, t) {
if (null == e) return null;
if (e.name === t) return e;
for (var i = e.children || [], n = 0; n < i.length; ++n) {
var a = this._findChildByName(i[n], t);
if (a) return a;
}
return null;
},
_stopExitCountdown: function() {
if (this._cdCb) {
this.unschedule(this._cdCb);
this._cdCb = null;
}
},
onBtnCloseClicked: function() {
this._stopExitCountdown();
cc.vv && cc.vv.net && cc.vv.net.send && cc.vv.net.send("leave_room");
var e = cc.vv.gameNetMgr;
e && e.exitToTableHall ? e.exitToTableHall() : cc.vv.sceneMgr ? cc.vv.sceneMgr.load("club") : cc.director.loadScene("club");
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
sss4: "十三水(4人)",
sss6: "十三水(6人)"
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
sss6: "十三水(6人)。两副牌共104张,每人发13张,与其余5家逐道比牌。\n· 牌型从大到小:同花顺 > 铁支 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 对子 > 单张。\n· 必须头道≤中道≤尾道,顺序不符不允许提交。\n· 每赢一道+1注;三道全胜打枪再+3注;赢过全部对手为全垒打,每家再+3注。\n· 特殊牌型通吃:一条龙×3、六对半×4、三同花/三顺子×5、三分天下×6。\n· 摆牌限时,超时系统自动摆牌;也可点「自动摆牌」。",
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
}, {
type: "sss6",
name: "十三水(6人)"
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
var l = this;
s.on(cc.Node.EventType.TOUCH_END, function(e) {
return function() {
l.select(e.idx);
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
wujin4: "五经(四人)",
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
var e = cc.vv && cc.vv.pendingReplay;
if (e) {
cc.vv.pendingReplay = null;
var t = this;
this.scheduleOnce(function() {
e.data ? t.buildReplay(e.data) : t.playReplay({
uuid: e.uuid
}, e.index);
}, 0);
}
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
var l = e.getChildByName("info" + r);
null != l && (l.getComponent(cc.Label).string = a[r] || "");
}
var c = e.getChildByName("btnOp");
c.idx = o;
c.getChildByName("Label").getComponent(cc.Label).string = s;
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
var l = s.addComponent(cc.Label);
l.string = a(t);
l.fontSize = Math.round(.5 * n);
l.lineHeight = n;
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
var l = {
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
this._rp = l;
for (var c = 0; c < l.players.length; ++c) {
var h = l.players[c], d = e.hands && e.hands[h.userid];
!d && e.finalHands && (d = e.finalHands[h.userid]);
l.hands[h.userid] = (d || []).slice();
l.melds[h.userid] = [];
l.folds[h.userid] = [];
}
this.buildSeats(l, i);
this.buildControls(l, i);
var u = new cc.Node("result");
u.parent = n;
u.setPosition(0, i.height / 2 - 34);
var g = u.addComponent(cc.Label);
g.string = "";
g.fontSize = 26;
g.lineHeight = 32;
u.color = cc.color(255, 226, 120);
l.resultLabel = g;
this.refresh(l);
this.loadAtlas(function() {
r.refresh(l);
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
var l = r.addComponent("ImageLoader");
l && l.setUserID(n.userid);
}
var c = new cc.Node("name");
c.parent = a;
var h = e.players.length <= 2 ? 1 == i : 2 == i;
c.setPosition(0, h ? 42 : -46);
var d = c.addComponent(cc.Label);
d.string = n.name || "玩家" + (n.userid || "");
d.fontSize = 22;
d.lineHeight = 26;
c.color = cc.color(255, 255, 255);
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
var l = r.addComponent(cc.Label);
l.string = "剩余" + e.wall + "张";
l.fontSize = 20;
l.lineHeight = 26;
r.color = cc.color(255, 255, 255);
e.wallLabel = l;
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
var l = new cc.Node("Label");
l.parent = o;
var c = l.addComponent(cc.Label);
c.string = t;
c.fontSize = 20;
c.lineHeight = 26;
l.color = cc.color(255, 255, 255);
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
var l = r.indexOf(i.pai);
l >= 0 && r.splice(l, 1);
}
e.lastDiscard = {
uid: o,
pai: i.pai
};
}
break;

case "game_chupai_notify_push":
var c = function(e) {
for (var t = 0; t < n.length; ++t) if (n[t].userid == e) return n[t];
return null;
}(i.userId);
null != c && null != i.holds && null != i.holds.length && "number" != typeof i.holds && (e.hands[c.userid] = i.holds.slice());
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
for (var l = n.pengs || [], c = 0; c < l.length; ++c) s.push({
t: "peng",
pai: l[c]
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
for (var r = e.melds[i] || [], l = 0; l < r.length; ++l) {
var c = r[l], h = "chi" == c.t ? c.pais || [] : [ c.pai, c.pai, c.pai, c.pai ].slice(0, "peng" == c.t ? 3 : 4);
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
var B = "";
if (e.hu && e.hu.si >= 0) {
var M = e.players[e.hu.si];
B = (M ? M.name || "玩家" + M.userid : "") + (e.hu.zimo ? " 自摸" : " 胡牌") + " " + e.hu.tai + "台";
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
cc.resources.load("images/avatars/" + e, cc.SpriteFrame, function(e, n) {
i(t, !e && n ? n : null);
});
}
var n = 3e5;
function a(e, t) {
null == cc.vv.baseInfoMap && (cc.vv.baseInfoMap = {});
var i = Date.now(), a = cc.vv.baseInfoMap[e];
if (a && (a.localKey || a.url) && i - (a.ts || 0) < n) t(e, a); else if (a && a._tryAt && i - a._tryAt < 5e3) t(e, a); else {
a ? a._tryAt = i : cc.vv.baseInfoMap[e] = {
_tryAt: i
};
cc.vv.http.sendRequest("/base_info", {
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
ts: Date.now(),
_tryAt: Date.now()
};
if (n || a) cc.vv.baseInfoMap[e] = s; else {
var o = cc.vv.baseInfoMap[e] || {};
o.name = s.name;
o.sex = s.sex;
o.url = null;
o.localKey = null;
o.ts = o.ts || s.ts;
o._tryAt = s._tryAt;
cc.vv.baseInfoMap[e] = o;
}
t(e, s);
} else {
var r = cc.vv.baseInfoMap[e] || {};
r._tryAt = Date.now();
cc.vv.baseInfoMap[e] = r;
t(e, {
url: null,
localKey: null
});
}
}, cc.vv.http.master_url);
}
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
this._userid !== t && (this._avatarRetry = 0);
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
}); else if (t && t.url) s = t.url, e, o = function(t, i) {
if (i && n._userid === e && n._appliedKey === a) {
n._spriteFrame = i;
n.setupSpriteFrame();
}
}, cc.assetManager.loadRemote(s, function(e, t) {
if (!e && t) {
var i = new cc.SpriteFrame(t, cc.Rect(0, 0, t.width, t.height));
o(0, i);
} else o(0, null);
}); else {
var s, o;
null == this._avatarRetry && (this._avatarRetry = 0);
if (this._avatarRetry < 3) {
this._avatarRetry++;
var r = e;
setTimeout(function() {
n.node && cc.isValid(n.node) && (n._userid !== r || n._spriteFrame || n.setUserID(parseInt(r) || r));
}, 5200);
}
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
function i(e, t) {
for (var i = String(null == e ? "" : e).split("."), n = String(null == t ? "" : t).split("."), a = Math.max(i.length, n.length), s = 0; s < a; ++s) {
var o = parseInt(i[s], 10);
isNaN(o) && (o = 0);
var r = parseInt(n[s], 10);
isNaN(r) && (r = 0);
if (o > r) return 1;
if (o < r) return -1;
}
return 0;
}
cc.Class({
extends: cc.Component,
properties: {
_splash: null,
tipLabel: cc.Label,
barNode: cc.Node,
barFillNode: cc.Node,
_stateStr: "",
_progress: 0,
_targetProgress: 0,
_isLoading: !1
},
onLoad: function() {
console.log("[Lodinglogin] onLoad enter");
window.__huChecked = !0;
this._initProgressBar();
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
if (!this._bootStarted) {
this._bootStarted = !0;
if (cc.sys.isNative && "undefined" != typeof jsb && jsb.AssetsManager) try {
this.checkHotUpdate();
} catch (e) {
console.error("[HotUpdate] 启动热更异常, 跳过热更:" + e);
this.checkVersion();
} else this.checkVersion();
}
},
clearHotUpdate: function() {
try {
cc.sys.localStorage.removeItem("HotUpdateSearchPaths");
} catch (e) {}
try {
cc.sys.localStorage.removeItem("HotUpdateAppliedPaths");
} catch (e) {}
if (cc.sys.isNative && "undefined" != typeof jsb && jsb.fileUtils) try {
var e = this._hotStoragePath();
if (jsb.fileUtils.isDirectoryExist && jsb.fileUtils.isDirectoryExist(e)) {
jsb.fileUtils.removeDirectory(e);
console.error("[HotUpdate] 已清除旧热更目录:" + e);
}
} catch (e) {}
},
applyHotUpdateSearchPaths: function() {
if (!cc.sys.isNative || "undefined" == typeof jsb || !jsb.fileUtils) return !1;
if (window.__bbHotBootApplied) {
console.error("[HotUpdate] 启动已应用热更版本 " + (window.__bbHotBootVersion || ""));
return !1;
}
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
var n = this._flattenPaths(i), a = null;
try {
a = jsb.fileUtils.getSearchPaths();
} catch (e) {
a = null;
}
if (a && this._flattenPaths(a) === n) return !1;
var s = this._buildStamp(), o = cc.sys.localStorage.getItem("HotUpdateBuildStamp");
if (s && o && o !== s) {
console.error("[HotUpdate] 包指纹变化, 丢弃旧热更: 记录=" + o + " 当前=" + s);
this.clearHotUpdate();
return !1;
}
var r = this._hotStoragePath();
if (jsb.fileUtils.isDirectoryExist && !jsb.fileUtils.isDirectoryExist(r)) {
console.error("[HotUpdate] 热更目录不存在, 丢弃记录:" + r);
this.clearHotUpdate();
return !1;
}
var l = r + "project.manifest", c = null;
try {
var h = jsb.fileUtils.getStringFromFile ? jsb.fileUtils.getStringFromFile(l) : null;
h && (c = (JSON.parse(h) || {}).version);
} catch (e) {
c = null;
}
if (!c) {
console.error("[HotUpdate] 热更清单缺失/不完整, 丢弃:" + l);
this.clearHotUpdate();
return !1;
}
jsb.fileUtils.setSearchPaths(i);
if (cc.sys.localStorage.getItem("HotUpdateAppliedPaths") === n) {
console.error("[HotUpdate] 同一组热更路径已重启过, 跳过重复重启");
return !1;
}
cc.sys.localStorage.setItem("HotUpdateAppliedPaths", n);
console.error("[HotUpdate] 已恢复热更搜索路径, 重启生效");
cc.game.restart();
return !0;
},
_hotStoragePath: function() {
return (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : "/") + "baobao_hotupdate/";
},
_buildStamp: function() {
try {
if (window.__bbBuildStamp) return window.__bbBuildStamp;
} catch (e) {}
var e = null;
try {
e = cc.assetManager && cc.assetManager.downloader && cc.assetManager.downloader.bundleVers;
} catch (t) {
e = null;
}
if (!e) try {
e = window._CCSettings && window._CCSettings.bundleVers;
} catch (t) {
e = null;
}
if (!e) return null;
var t = [];
for (var i in e) Object.prototype.hasOwnProperty.call(e, i) && t.push(i + ":" + e[i]);
t.sort();
return t.join("|");
},
_flattenPaths: function(e) {
var t = [];
(function e(i) {
for (var n = 0; n < i.length; ++n) Array.isArray(i[n]) ? e(i[n]) : t.push(String(i[n]));
})(e);
return t.join("|");
},
checkHotUpdate: function() {
var e = this, t = cc.vv && cc.vv.http && cc.vv.http.master_url ? cc.vv.http.master_url : "", n = this._hotStoragePath().replace(/\/$/, "");
console.error("[HotUpdate] 本地清单:project.manifest 服务器:" + t);
this.showHotTip("检查更新");
this._stateStr = "正在检查更新";
var a = null;
try {
a = new jsb.AssetsManager("project.manifest", n, i);
} catch (e) {
console.error("[HotUpdate] 创建管理器失败:" + e);
this.checkVersion();
return;
}
this._hotAm = a;
this._hotFailCount = 0;
a.setVerifyCallback(function() {
return !0;
});
a.setEventCallback(function(t) {
var i = t.getEventCode();
console.error("[HotUpdate] event:" + i + " " + (t.getMessage && t.getMessage() || ""));
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
e._hotCheckDone = !0;
e.showHotTip("发现新版本, 正在更新");
e._hotLastProgressAt = Date.now();
e._startHotDlWatch(a);
e.scheduleOnce(function() {
e._hotAm === a && a.update();
}, 0);
break;

case n.UPDATE_PROGRESSION:
e._stateStr = "正在更新资源";
e._isLoading = !0;
var s, o = t.getDownloadedFiles ? t.getDownloadedFiles() : 0, r = t.getTotalFiles ? t.getTotalFiles() : 0;
e._hotLastProgressAt = Date.now();
r > 0 && (e._stateStr = "正在更新资源 " + o + "/" + r);
r > 0 ? s = o / r * 100 : (s = t.getPercent()) <= 1 && (s *= 100);
s > 99 && (s = 99);
s / 100 > e._targetProgress && (e._targetProgress = s / 100);
break;

case n.UPDATE_FINISHED:
try {
var l = jsb.fileUtils.getSearchPaths(), c = a.getLocalManifest().getSearchPaths();
c && c.length && Array.prototype.unshift.apply(l, c);
cc.sys.localStorage.setItem("HotUpdateSearchPaths", JSON.stringify({
paths: l
}));
cc.sys.localStorage.setItem("HotUpdateBuildStamp", e._buildStamp() || "");
} catch (e) {
console.log("[HotUpdate] 保存搜索路径失败:", e);
}
e._stateStr = "更新完成, 请重新打开应用";
e.showHotTip("更新完成, 请重新打开应用");
e._finishHot();
e.checkVersion();
break;

case n.UPDATE_FAILED:
e._hotFailCount++;
if (e._hotFailCount <= 10) {
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
e._hotFailCount++;
if (e._hotFailCount > 3) {
e.showHotTip("更新失败, 跳过热更");
e._finishHot();
e.checkVersion();
}
}
});
this._hotCheckDone = !1;
this._hotWatchdog && clearTimeout(this._hotWatchdog);
this._hotWatchdog = setTimeout(function() {
if (!e._hotCheckDone && e._hotAm === a) {
console.error("[HotUpdate] 检查更新超时, 跳过热更");
e.showHotTip("检查更新超时, 跳过");
e._finishHot();
e.checkVersion();
}
}, 15e3);
a.checkUpdate();
},
_startHotDlWatch: function(e) {
var t = this;
this._hotDlTimer && clearInterval(this._hotDlTimer);
this._hotDlTimer = setInterval(function() {
if (t._hotAm && t._hotAm === e) {
if (!(Date.now() - (t._hotLastProgressAt || 0) < 9e4)) {
clearInterval(t._hotDlTimer);
t._hotDlTimer = null;
console.error("[HotUpdate] 下载超时(90秒无进展), 跳过热更");
t.showHotTip("更新超时, 跳过更新");
t._finishHot();
t.checkVersion();
}
} else {
clearInterval(t._hotDlTimer);
t._hotDlTimer = null;
}
}, 5e3);
},
_finishHot: function() {
this._hotCheckDone = !0;
if (this._hotDlTimer) {
clearInterval(this._hotDlTimer);
this._hotDlTimer = null;
}
if (this._hotWatchdog) {
clearTimeout(this._hotWatchdog);
this._hotWatchdog = null;
}
if (this._hotAm) {
try {
this._hotAm.setEventCallback(null);
} catch (e) {}
this._hotAm = null;
}
},
showHotTip: function(e) {
console.error("[HotUpdate] " + e);
this.tipLabel && cc.isValid(this.tipLabel.node) && (this.tipLabel.string = e);
},
onDestroy: function() {
if (this._hotDlTimer) {
clearInterval(this._hotDlTimer);
this._hotDlTimer = null;
}
if (this._hotWatchdog) {
clearTimeout(this._hotWatchdog);
this._hotWatchdog = null;
}
if (this._hotAm) {
try {
this._hotAm.setEventCallback(null);
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
var l = e("Utils");
cc.vv.utils = new l();
try {
var c = e("SceneMgr");
cc.vv.sceneMgr = new c();
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
if (!this._versionStarted) {
this._versionStarted = !0;
var e = this, t = 0, i = !1, n = function(t) {
if (!i) {
i = !0;
if (t && null != t.version) {
cc.vv.SI = t;
String(t.version) != String(cc.VERSION) && console.error("[Boot] 服务器版本" + t.version + " 与客户端" + cc.VERSION + " 不同, 继续启动");
} else console.error("[Boot] 获取服务器信息失败, 继续启动");
e.startPreloading();
}
};
(function a() {
t++;
e._stateStr = "正在连接服务器";
var s = null;
try {
s = cc.vv.http.sendRequest("/get_serverinfo", null, function(e) {
n(e);
});
} catch (e) {
n(null);
return;
}
setTimeout(function() {
if (!i) {
if (s) try {
s.abort();
} catch (e) {}
if (t >= 3) {
e._stateStr = "服务器无响应, 继续启动";
n(null);
} else {
e._stateStr = "连接失败，即将重试";
a();
}
}
}, 5e3);
})();
}
},
startPreloading: function() {
if (!this._preloadingStarted) {
this._preloadingStarted = !0;
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
}
},
onLoadComplete: function() {
if (!this._loginLaunched) {
this._loginLaunched = !0;
this._isLoading = !1;
this._progress = 1;
this._setBar(1);
this._stateStr = "准备登陆";
cc.vv && cc.vv.sceneMgr ? cc.vv.sceneMgr.load("login") : cc.director.loadScene("login");
cc.loader.onComplete = null;
}
},
_initProgressBar: function() {
var e = this.barNode, t = this.barFillNode;
if (!this._barNode && e && t && cc.isValid(e) && cc.isValid(t)) {
this._barNode = e;
this._barFillNode = t;
this._barW = e.width;
this._barPx = -1;
e.active = !1;
}
},
_setBar: function(e) {
if (this._barNode && this._barFillNode) {
e < 0 && (e = 0);
e > 1 && (e = 1);
this._barNode.active = e > 0;
var t = Math.round(e * this._barW);
if (t !== this._barPx) {
this._barPx = t;
this._barFillNode.width = t;
}
}
},
update: function(e) {
if (0 != this._stateStr.length) {
this.tipLabel.string = this._stateStr + " ";
if (this._isLoading) {
this._progress < this._targetProgress && (this._progress = Math.min(this._targetProgress, this._progress + .5 * e));
this.tipLabel.string += Math.floor(100 * this._progress) + "%";
this._setBar(this._progress);
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
var n = e("OpTiles"), a = e("DiceRoll"), s = e("OpeningFlow");
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
for (var n = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow", "DeskStyle", "Alert" ], o = 0; o < n.length; ++o) null == this.getComponent(n[o]) && this.addComponent(n[o]);
this.initView();
this.initEventHandlers();
try {
a.setOpeningVisible(this, !1);
} catch (e) {}
this.gameRoot && "game" === this.gameRoot.name || (this.gameRoot = this.node.getChildByName("game"));
this.prepareRoot && "prepare" === this.prepareRoot.name || (this.prepareRoot = this.node.getChildByName("prepare"));
this.gameRoot && (this.gameRoot.active = !1);
this.prepareRoot && (this.prepareRoot.active = !0);
this.prepareRoot && this.gameRoot && this.prepareRoot.setSiblingIndex(this.gameRoot.getSiblingIndex() + 1);
this.initWanfaLabel();
this._isGameInProgress() && s.restore(this, this._openingHooks(null));
cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("login");
}
},
_isGameInProgress: function() {
var e = cc.vv.gameNetMgr;
if ("begin" != e.gamestate) return !1;
for (var t = e.seats || [], i = 0; i < t.length; ++i) {
var n = t[i];
if (n) {
if (n.holds instanceof Array && n.holds.length > 0) return !0;
if (n.holdCount > 0) return !0;
}
}
return null != e.curaction || e.numOfMJ > 0;
},
initView: function() {
this._captureHoldBackFrames();
var e = this.node.getChildByName("game");
this._mjcount = e.getChildByName("mjcount").getComponent(cc.Label);
this._updateMjCount();
this._gamecount = e.getChildByName("gamecount").getComponent(cc.Label);
this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
for (var t = e.getChildByName("myself").getChildByName("holds"), i = 0; i < t.children.length; ++i) {
var n = t.children[i].getComponent(cc.Sprite);
this._myMJArr.push(n);
n.spriteFrame = null;
}
this._setupHandGestures();
var a = cc.view.getVisibleSize().width / 1280;
if (a < 1) {
t.scaleX *= a;
t.scaleY *= a;
}
var s = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (i = 0; i < s; ++i) {
var o = cc.vv.mahjongmgr.getSide(i), r = e.getChildByName(o);
if (null != r) {
this._playEfxs.push(r.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(r.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
}
}
var l = e.getChildByName("ops");
this._options = l;
this._opTpl = e.getChildByName("opTpl");
if (l) for (var c = 0; c < l.childrenCount; ++c) {
var h = l.children[c];
if ("op" == h.name) {
var d = h.getComponent(cc.Sprite);
d && (d.enabled = !1);
var u = h.getChildByName("opTarget");
u && (u.active = !1);
}
}
var g = l ? l.getChildByName("New Layout") : null;
if (g) {
var v = g.getComponent(cc.Button);
v && (v.enabled = !1);
g.active = !1;
}
this._baoPanel = l ? l.getChildByName("baoPanel") : null;
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
this._loadBaoModeFrames();
this._baoDjs = this._getDjs(this._baoPanel);
}
this._csPanel = l ? l.getChildByName("csPanel") : null;
if (this._csPanel) {
this._csPanel.active = !1;
this._csTip = this._findChildByName(this._csPanel, "lblTip", "btnSetCaishen");
var p = this._findChildByName(this._csPanel, "btnSetCaishen");
p && cc.vv.utils.addClickEvent(p, this.node, "MJGameBMJ", "onSetCaishenClicked");
this._csSelLabel = this._findChildByName(this._csPanel, "New Label", "djsSprite");
this._csPaiNodes = [ this._findChildByName(this._csPanel, "csPai1"), this._findChildByName(this._csPanel, "csPai2") ];
this._csWu = this._findChildByName(this._csPanel, "wu");
this._csDjs = this._getDjs(this._csPanel);
}
var b = cc.find("Canvas/tip_notice");
this._tipDjs = b ? this._getDjs(b) : null;
this.hideOptions();
this.hideChupai();
},
_findChildByName: function(e, t, i) {
if (null == e) return null;
for (var n = e.children || [], a = 0; a < n.length; ++a) {
var s = n[a];
if (s.name !== i) {
if (s.name === t) return s;
var o = this._findChildByName(s, t, i);
if (o) return o;
}
}
return null;
},
_getDjs: function(e) {
if (null == e) return null;
var t = this._findChildByName(e, "djsSprite");
if (null == t) return null;
var i = t.getChildByName("New Label");
t.active = !1;
return {
node: t,
label: i ? i.getComponent(cc.Label) : null
};
},
_startCaishenCountdown: function(e) {
this._stopCaishenCountdown();
var t = parseInt(e);
t > 0 || (t = 60);
this._csDjsLeft = t;
this._refreshCaishenDjs();
var i = this;
this._csDjsTimer = setInterval(function() {
if (cc.isValid(i.node)) {
i._csDjsLeft = i._csDjsLeft > 0 ? i._csDjsLeft - 1 : 0;
i._refreshCaishenDjs();
i._csDjsLeft <= 0 && i._stopCaishenCountdown();
} else i._stopCaishenCountdown();
}, 1e3);
},
_stopCaishenCountdown: function() {
if (this._csDjsTimer) {
clearInterval(this._csDjsTimer);
this._csDjsTimer = null;
}
this._csDjs && cc.isValid(this._csDjs.node) && (this._csDjs.node.active = !1);
this._tipDjs && cc.isValid(this._tipDjs.node) && (this._tipDjs.node.active = !1);
},
_refreshCaishenDjs: function() {
var e = "" + (null != this._csDjsLeft ? this._csDjsLeft : 0);
if (this._csDjs && cc.isValid(this._csDjs.node)) {
this._csDjs.node.active = !0;
this._csDjs.label && (this._csDjs.label.string = e);
}
if (this._tipDjs && cc.isValid(this._tipDjs.node)) {
this._tipDjs.node.active = !0;
this._tipDjs.label && (this._tipDjs.label.string = e);
}
},
_startBaoCountdown: function(e) {
this._stopBaoCountdown();
var t = parseInt(e);
t > 0 || (t = 15);
this._baoDjsLeft = t;
this._refreshBaoDjs();
var i = this;
this._baoDjsTimer = setInterval(function() {
if (cc.isValid(i.node)) {
i._baoDjsLeft = i._baoDjsLeft > 0 ? i._baoDjsLeft - 1 : 0;
i._refreshBaoDjs();
if (i._baoDjsLeft <= 0) {
i._stopBaoCountdown();
if (i._baoPanel && i._baoPanel.active) {
i._hideBaoPanel();
i._showWaitCaishenTip("你已放弃包，等待对家决策");
}
}
} else i._stopBaoCountdown();
}, 1e3);
},
_stopBaoCountdown: function() {
if (this._baoDjsTimer) {
clearInterval(this._baoDjsTimer);
this._baoDjsTimer = null;
}
this._baoDjs && cc.isValid(this._baoDjs.node) && (this._baoDjs.node.active = !1);
},
_refreshBaoDjs: function() {
if (this._baoDjs && cc.isValid(this._baoDjs.node)) {
this._baoDjs.node.active = !0;
this._baoDjs.label && (this._baoDjs.label.string = "" + (null != this._baoDjsLeft ? this._baoDjsLeft : 0));
}
},
_openingHooks: function(e) {
var t = this;
return {
clear: function() {
t._clearOpeningTable();
},
info: function() {
a.setOpeningVisible(t, !0);
t._updateMjCount && t._updateMjCount();
},
render: function() {
t.onGameBeign(!0, e);
},
deal: function() {
t._playDealAnim && t._playDealAnim();
},
caishen: function() {
t.initCaishenTip();
}
};
},
_clearOpeningTable: function() {
for (var e = 0; e < this._myMJArr.length; ++e) {
var t = this._myMJArr[e];
if (null != t && null != t.node) {
t.node.stopAllActions();
t.node.mjId = null;
t.spriteFrame = null;
t.node.active = !1;
t.node.y = 0;
}
}
var i = this.node.getChildByName("game"), n = i ? i.getChildByName("caishenTip") : null;
n && (n.active = !1);
var s = this.getComponent("MJRoom") || this.node.getComponent("MJRoom");
s && s.clearOpeningTable && s.clearOpeningTable();
a.setOpeningVisible(this, !1);
},
_updateMjCount: function() {
if (this._mjcount) {
var e = this.getComponent("MJRoom") || this.node.getComponent("MJRoom");
e && e.refreshBrickWall();
var t = e && null != e._brickRemainCount ? e._brickRemainCount : cc.vv.gameNetMgr.numOfMJ;
this._mjcount.string = "剩余" + t + "张";
}
},
hideChupai: function() {
for (var e = 0; e < this._chupaiSprite.length; ++e) this._chupaiSprite[e].node.active = !1;
},
_delayShowPrepare: function() {
var e = this;
this._pendingShowPrepare = !0;
if (!this._overClosedHooked) {
this._overClosedHooked = !0;
this.node.on("game_over_popup_closed", function() {
e._pendingShowPrepare = !1;
s.end(e, {
clear: function() {
e._clearOpeningTable();
}
});
if (!cc.vv.mahjongmgr || !cc.vv.mahjongmgr.is2Player()) {
e.gameRoot && (e.gameRoot.active = !1);
e.prepareRoot && (e.prepareRoot.active = !0);
}
});
}
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
var o = this.node;
this.scheduleOnce(function() {
if (cc.isValid(o)) {
o.emit("game_num", {
detail: e.numOfGames
});
o.emit("mj_count", {
detail: null
});
o.emit("game_start", {
detail: null
});
if (e.curaction) {
var t = e.curaction;
e.curaction = null;
o.emit("game_action", {
detail: t
});
}
}
}, 0);
}
}
var r = this.node;
this.scheduleOnce(function() {
if (cc.isValid(r)) {
e.waitBaoData && r.emit("bao_select", {
detail: e.waitBaoData
});
null != e.waitCaishenMode && r.emit("caishen_select", {
detail: {
mode: e.waitCaishenMode
}
});
}
}, 0);
var l = this;
this.node.on("game_start", function(e) {
var t = e && e.detail, i = cc.vv.gameNetMgr.conf, n = i && null != i.caishen ? parseInt(i.caishen) : -1, a = i && null != i.caishen2 ? parseInt(i.caishen2) : null, o = i && null != i.baoMode ? parseInt(i.baoMode) : -1, r = l.node.getChildByName("game"), c = r ? r.getChildByName("caishenTip") : null;
if (n < 0) {
l._curBaoMode = null;
l._caishen = null;
l._caishen2 = null;
l._csRetryCount = 0;
l._csRetryScheduled = !1;
l._clearBaoFlag();
if (c) {
var h = c.getChildByName("baoTaiLabel");
h && (h.active = !1);
0 !== o && (c.active = !1);
}
} else {
l._curBaoMode = o >= 0 ? o : null;
l._caishen = n;
l._caishen2 = a;
l._csRetryCount = 0;
l.scheduleOnce(function() {
if (cc.isValid(l.node)) {
l._showBaoInfo(t || {
baoTai: i ? i.baoTai : null,
baoMode: o,
baoSeatIndex: i ? i.baoSeatIndex : null
});
l.initCaishenTip();
}
}, 0);
}
s.start(l, l._openingHooks(t), e);
});
this.node.on("game_begin", function() {
s.begin(l, {
before: function() {
try {
l.onGameBeign();
} catch (e) {
console.error("[BMJ] onGameBeign error:", e);
}
},
clear: function() {
l._clearOpeningTable();
}
});
});
this.node.on("bao_select", function(e) {
var t = e && e.detail;
a.afterOpening(l, function() {
cc.isValid(l.node) && l.onBaoSelect(t);
});
});
this.node.on("bao_result", function(e) {
l.onBaoResult(e && e.detail);
});
this.node.on("caishen_select", function(e) {
l.onCaishenSelect(e && e.detail);
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
l.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && l.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || l.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? l.initMahjongs(!0) : cc.vv.replayMgr.isReplay() ? l.initMopai(e.seatIndex, t) : l.initMopai(e.seatIndex, -1);
}
});
this.node.on("game_action", function(e) {
l.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t);
0 == i && l.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
l.initMopai(t, e.pai);
l.revealOtherHolds(t, e.holds, e.pai);
e.zimo ? l.playEfx(i, "play_zimo") : l.playEfx(i, "play_hu");
cc.vv.mahjongmgr.playRandSFX(e.zimo ? "zimo" : "hu", e.zimo ? 2 : 3);
});
this.node.on("mj_count", function() {
l._updateMjCount();
});
this.node.on("game_num", function() {
l._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function(e) {
l.hideChiPanel();
l.revealAllOtherHolds(e.detail);
l.gameRoot && (l.gameRoot.active = !0);
l._delayShowPrepare();
});
this.node.on("game_chupai_notify", function(e) {
l.hideChupai();
l.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? l.initMahjongs() : l.initOtherMahjongs(i);
l.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
l.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? l.initMahjongs(!1, t) : l.initOtherMahjongs(t);
var n = l.getLocalIndex(t.seatindex);
l.playEfx(n, "play_peng");
cc.vv.mahjongmgr.playRandSFX("peng", 5);
l.hideOptions();
});
this.node.on("gang_notify", function(e) {
l.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? l.initMahjongs(!1, t) : l.initOtherMahjongs(t);
var n = l.getLocalIndex(t.seatindex);
if ("wangang" == i) {
l.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
l.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
l.hideOptions();
});
this.node.on("chi_notify", function(e) {
l._chiJustSent = !1;
l.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? l.initMahjongs(!1, t) : l.initOtherMahjongs(t);
var i = l.getLocalIndex(t.seatindex);
l.playEfx(i, "play_chi");
cc.vv.mahjongmgr.playRandSFX("chi", 4);
l.hideOptions();
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
for (var a = 0; a < this._options.childrenCount; ++a) {
var s = this._options.children[a];
if ("op" == s.name && 0 == s.active) {
s.active = !0;
var o = s.getChildByName("opTarget");
o && (o.active = !1);
var r = s.getChildByName(e);
r.active = !0;
r.pai = t;
r.gangpai = i && i.length ? i.slice() : null;
var l, c = this;
if (r.gangpai) l = r.gangpai.map(function(e) {
var t = n.build([ e, e, e ]);
t.opPai = e;
return t;
}); else if ("btnPeng" == e) {
var h = n.build([ t, t ]);
h.push(t);
l = [ h.sort(function(e, t) {
return e - t;
}) ];
} else l = [ [ t ] ];
var d = null;
"btnGang" == e ? d = function(e) {
cc.vv.net.send("gang", null != e.opPai ? e.opPai : e[0]);
c.hideOptions();
} : "btnPeng" == e ? d = function() {
cc.vv.net.send("peng");
c.hideOptions();
} : "btnHu" == e && (d = function() {
cc.vv.net.send("hu");
c.hideOptions();
});
n.show(this, r, l, d);
return;
}
}
},
addChiOption: function(e, t) {
for (var i = 0; i < this._options.childrenCount; ++i) {
var a = this._options.children[i];
if ("op" == a.name && 0 == a.active) {
a.active = !0;
var s = a.getChildByName("opTarget");
s && (s.active = !1);
var o = this.getChiButton(a);
if (o) {
o.active = !0;
o.pai = e;
o.chipai = t || null;
var r = [];
if (t && t.length) for (var l = 0; l < t.length; ++l) {
var c = t[l];
c && c.length >= 3 && r.push([ c[0], c[1], c[2] ].sort(function(e, t) {
return e - t;
}));
}
!r.length && null != e && e >= 0 && r.push([ e ]);
var h = this;
n.show(this, o, r, function(e) {
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
var a = i.getChildByName("btnChi");
a && (a.active = !1);
for (var s = 0; s < i.childrenCount; ++s) n.clear(i.children[s]);
}
}
e || (this._options.active = !1);
this.hideChiPanel();
this.cancelChiSelect();
}
},
showAction: function(e) {
if (e && e.chi && this._chiJustSent) {
this._chiJustSent = !1;
n.toast(this, "这两张不能吃,请重选");
}
if (!(this._baoPanel && this._baoPanel.active || this._csPanel && this._csPanel.active)) {
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
var a = null != this._caishen ? this._caishen : i ? i.caishen : null, s = null != this._caishen2 ? this._caishen2 : i ? i.caishen2 : null, o = null != a && a >= 0, r = t.getChildByName("title"), l = r ? r.getComponent(cc.Label) : null, c = t.getChildByName("cs1"), h = t.getChildByName("cs2"), d = t.getChildByName("wu");
if (o) {
t.active = !0;
!l || "无财" !== l.string && 0 !== l.string.length || (l.string = "财神");
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
if (c) {
c.active = !0;
u(c, a);
}
if (h) {
h.active = !0;
u(h, s);
}
d && (d.active = !1);
} else {
c && (c.active = !1);
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
var _ = this, f = g && c ? c.getComponent(cc.Sprite) : null, m = h ? h.getComponent(cc.Sprite) : null;
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
l && (l.string = "无财");
c && (c.active = !1);
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
var l = r.getChildByName("baoTaiLabel");
if (l) {
var c = l.getComponent(cc.Label);
c && (c.string = n);
l.active = n.length > 0;
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
var l = ((e - a) % n + n) % n, c = t._seats2[l];
if (c && c.node) {
var h = this._getBaoFlagNode(c.node);
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
var o = Math.floor(this._baoCurRank / 10), r = this._baoCurRank % 10, l = 2 === r ? "无财" : 1 === r ? "独财" : "双财";
s.string = "对家叫" + l + o + "台";
}
}
this._refreshBaoButtons();
this._highlightBaoMode(this._baoPanel.getChildByName("btnShuangCai"));
this._startBaoCountdown(e && e.bao_secs);
}
},
_refreshBaoButtons: function() {
if (this._baoPanel) for (var e = null != this._baoCurRank ? this._baoCurRank : -1, t = 2; t <= 7; ++t) {
var i = this._baoPanel.getChildByName("btnTai" + t);
i && (this._baoForced ? i.active = 2 === t : i.active = this._baoRank(t, this._baoMode) > e);
}
},
_loadBaoModeFrames: function() {
if (!this._baoModeFramesLoading && !this._baoBtnActiveFrame) {
this._baoModeFramesLoading = !0;
var e = this;
cc.resources.load("images/atlas/baoqei_b", cc.SpriteAtlas, function(t, i) {
e._baoModeFramesLoading = !1;
if (!t && i && cc.isValid(e)) {
e._baoBtnNormalFrame = i.getSpriteFrame("按钮-圆-1");
e._baoBtnActiveFrame = i.getSpriteFrame("按钮-圆-3");
e._baoPanel && e._baoPanel.active && e._highlightBaoMode(e._baoPanel.getChildByName([ "btnNoCai", "btnDuCai", "btnShuangCai" ][e._baoMode] || "btnShuangCai"));
}
});
}
},
_highlightBaoMode: function(e) {
for (var t = [ "btnNoCai", "btnDuCai", "btnShuangCai" ], i = 0; i < t.length; ++i) {
var n = this._baoPanel.getChildByName(t[i]);
if (n) {
var a = n === e ? 255 : 150;
n.opacity = a;
var s = n.getComponent(cc.Sprite);
if (s && this._baoBtnActiveFrame) {
var o = n === e ? this._baoBtnActiveFrame : this._baoBtnNormalFrame;
o && (s.spriteFrame = o);
}
for (var r = n.children || [], l = 0; l < r.length; ++l) r[l].getComponent(cc.Sprite) && (r[l].opacity = a);
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
this._stopBaoCountdown();
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
this._stopCaishenCountdown();
this._hideWaitCaishenTip();
this._caishen = parseInt(e.caishen);
this._caishen2 = null != e.caishen2 ? parseInt(e.caishen2) : null;
this._hideCsPanel();
this.initCaishenTip();
this.initMahjongs(!1);
} else if (parseInt(e.baoSeatIndex) != cc.vv.gameNetMgr.seatIndex) {
var t = [ "无财", "独财", "双财" ][parseInt(e.baoMode)] || "";
this._showWaitCaishenTip("对家已包" + t + parseInt(e.baoTai) + "台，等待对家定财神");
this._startCaishenCountdown(e.caishen_secs);
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
this._startCaishenCountdown(e.caishen_secs);
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
var i = this._findChildByName(this._csPanel, "btnSetCaishen");
i && (i.active = !1);
this._updateCsSelLabel();
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
this._stopCaishenCountdown();
cc.vv.net.send("caishen_select", {
pai: this._csPai
});
this._hideCsPanel();
}
},
_mjIdToName: function(e) {
if (null == e || e < 0 || e > 33) return "?";
var t = [ "一", "二", "三", "四", "五", "六", "七", "八", "九" ];
return e < 9 ? t[e] + "筒" : e < 18 ? t[e - 9] + "条" : e < 27 ? t[e - 18] + "万" : [ "中", "发", "白", "东", "西", "南", "北" ][e - 27];
},
_updateCsSelLabel: function() {
var e = null != this._csPai && this._csPai >= 0;
null != this._csTip && cc.isValid(this._csTip) && (this._csTip.active = !e);
var t = this._csMode;
(null == t || t < 0 || t > 2) && (t = 2);
var i = [ "无财", "独财", "双财" ][t], n = [];
if (e && t > 0) {
n.push(this._csPai);
2 === t && n.push(this._nextCaishenOf(this._csPai));
}
var a = [ null, null ];
if (2 === t) {
a[0] = null != n[0] ? n[0] : null;
a[1] = null != n[1] ? n[1] : null;
} else 1 === t && (a[1] = null != n[0] ? n[0] : null);
for (var s = this._csPaiNodes || [], o = 0; o < s.length; ++o) {
var r = s[o];
if (null != r && cc.isValid(r)) {
var l = a[o];
r.active = null != l;
if (null != l) {
var c = r.getComponent(cc.Sprite);
if (c) {
var h = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", l);
h && (c.spriteFrame = h);
}
}
}
}
if (null != this._csWu && cc.isValid(this._csWu)) {
var d = this._csWu.getComponent(cc.Label);
if (!e || 0 !== t && 1 !== t) this._csWu.active = !1; else {
d && (d.string = i);
this._csWu.active = !0;
}
}
if (null != this._csSelLabel && cc.isValid(this._csSelLabel)) {
this._csSelLabel.active = e;
var u = this._csSelLabel.getComponent(cc.Label);
if (null != u) if (0 === n.length) u.string = "已选择：" + i; else {
for (var g = [], v = 0; v < n.length; ++v) g.push(this._mjIdToName(n[v]));
u.string = "已选择：" + i + "（" + g.join("、") + "）";
}
}
},
_nextCaishenOf: function(e) {
if (e < 27) return 9 * Math.floor(e / 9) + (e % 9 + 1) % 9;
if (e <= 29) return 27 + (e - 27 + 1) % 3;
for (var t = [ 30, 32, 31, 33 ], i = 0; i < 4; ++i) if (t[i] === e) return t[(i + 1) % 4];
return e;
},
playEfx: function(e, t) {
var i = this._playEfxs[e], n = i ? i.node : null;
if (null == n) {
var a = this.node.getChildByName("game"), s = cc.vv.mahjongmgr.getSide(e), o = a ? a.getChildByName(s) : null;
if (n = o ? o.getChildByName("play_efx") : null) {
i = n.getComponent(cc.Animation);
this._playEfxs[e] = i;
}
}
if (null != n) {
n.active = !0;
i && i.play(t);
if (cc.vv && cc.vv.mahjongmgr) {
var r = null;
"play_hu" == t ? r = "mj_hu" : "play_zimo" == t ? r = "mj_zimo" : "play_chi" == t ? r = "mj_chi" : "play_peng" == t ? r = "mj_peng" : "play_guafeng" != t && "play_xiayu" != t && "play_gang" != t || (r = "mj_gang");
r && cc.vv.mahjongmgr.playSpineEfx(n, r);
}
}
},
onGameBeign: function() {
if (this._overHideCb) {
this.unschedule(this._overHideCb);
this._overHideCb = null;
}
this._pendingShowPrepare = !1;
this._stopCaishenCountdown();
this._hideWaitCaishenTip();
for (var e = 0; e < this._playEfxs.length; ++e) this._playEfxs[e] && this._playEfxs[e].node && (this._playEfxs[e].node.active = !1);
this.hideChupai();
this.hideOptions();
var t = this.node.getChildByName("game");
this._clearBaoFlag();
var i = t.getChildByName("caishenTip");
if (i) {
var n = i.getChildByName("baoTaiLabel");
if (n) {
var s = n.getComponent(cc.Label);
s && (s.string = "");
n.active = !1;
}
}
var o = t.getChildByName("huanpaiinfo");
null != o && (o.active = !1);
var r = [ "right", "up", "left" ];
for (e = 0; e < r.length; ++e) {
var l = t.getChildByName(r[e]);
if (null != l) if (cc.vv.mahjongmgr.getLocalIndexBySlot(e + 1) < 0) l.active = !1; else {
l.active = !0;
for (var c = l.getChildByName("holds"), h = 0; h < c.childrenCount; ++h) c.children[h].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var d = cc.vv.gameNetMgr.seats;
for (var e in d) {
var u = d[e];
if (0 != cc.vv.gameNetMgr.getLocalIndex(e)) {
this.initOtherMahjongs(u);
("number" == typeof u.holds ? u.holds : u.holds && u.holds.length || u.holdCount || 0) > 0 && (e == cc.vv.gameNetMgr.turn ? this.initMopai(e, -1) : this.initMopai(e, null));
}
}
this.showChupai();
if (null != cc.vv.gameNetMgr.curaction) {
this.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
a.setOpeningVisible(this, !0);
}
},
_playDealAnim: function() {
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, s) {
if (null != a && 0 != n.length) {
var o = a.convertToNodeSpaceAR(e);
n.sort(s);
for (var r = 0; r < n.length; ++r) {
var l = n[r], c = l.x, h = l.y, d = l.opacity;
t.push({
node: l,
x: c,
y: h,
op: d
});
l.setPosition(o);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(c, h)), cc.fadeTo(.15, d))));
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
for (var l = this.node.getChildByName("game"), c = cc.vv.gameNetMgr.seats || [], h = 0; h < c.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var u = cc.vv.mahjongmgr.getSide(d), g = l ? l.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
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
var t = this._findChildByName(this._csPanel, "btnSetCaishen"), i = this._findMJNode(e);
if (null == i || null == i.mjId) return;
for (var n = 0; n < this._myMJArr.length; ++n) if (i == this._myMJArr[n].node) {
if (this._csPaiNode == i) {
i.y = 0;
this._csPaiNode = null;
this._csPai = null;
t && (t.active = !1);
this._updateCsSelLabel();
return;
}
this._csPaiNode && (this._csPaiNode.y = 0);
i.y = 15;
this._csPaiNode = i;
this._csPai = i.mjId;
t && (t.active = !0);
this._updateCsSelLabel();
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
var l = o[0].mjId, c = o[1].mjId, h = this._chiSelect.pai;
o[0].y = 0;
o[1].y = 0;
this.cancelChiSelect();
this.hideOptions();
cc.vv.net.send("chi", [ l, c, h ]);
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
var n = cc.vv.gameNetMgr.getLocalIndex(e), a = cc.vv.mahjongmgr.getSide(n), s = cc.vv.mahjongmgr.getFoldPre(n), o = this.node.getChildByName("game").getChildByName(a).getChildByName("holds"), r = this.getMJIndex(a, 13), l = o.children[r];
if (null != l) {
if ("up" != a) {
l.scaleX = 1;
l.scaleY = 1;
}
if (null == t) {
l.active = !1;
if (0 == n) {
var c = l.getChildByName("csCorner");
c && (c.active = !1);
}
} else if (t >= 0) {
l.active = !0;
l.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(s, t);
if (0 == n) {
var h = cc.vv.gameNetMgr.conf || {}, d = h.caishen >= 0 && t == h.caishen || null != h.caishen2 && h.caishen2 >= 0 && t == h.caishen2;
i(l, d);
var u = l.getChildByName("csCorner");
u && (u.active = d);
}
} else if (null != t) {
l.active = !0;
l.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(a);
if (0 == n) {
var g = l.getChildByName("csCorner");
g && (g.active = !1);
}
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), s = 0; s < n.childrenCount; ++s) {
var o = n.children[s];
if ("up" != i) {
o.scaleX = 1;
o.scaleY = 1;
}
o.getComponent(cc.Sprite).spriteFrame = a;
}
},
_captureHoldBackFrames: function() {
if (!this._holdBackFrames) {
this._holdBackFrames = {};
var e = this.node.getChildByName("game");
if (null != e) for (var t = [ "myself", "up", "right", "left" ], i = 0; i < t.length; ++i) {
var n = e.getChildByName(t[i]), a = n ? n.getChildByName("holds") : null;
if (null != a && 0 !== a.childrenCount) {
var s = a.children[0].getComponent(cc.Sprite);
s && s.spriteFrame && (this._holdBackFrames[t[i]] = s.spriteFrame);
}
}
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = !!e.hued, n = cc.vv.mahjongmgr.getSide(t), a = this.node.getChildByName("game"), s = a ? a.getChildByName(n) : null, o = s ? s.getChildByName("holds") : null;
if (null != o) {
var r = e.chis || [], l = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + r.length;
l *= 3;
for (var c = 0; c < l; ++c) {
var h = this.getMJIndex(n, c);
null != o.children[h] && (o.children[h].active = !1);
}
var d = cc.vv.mahjongmgr.getFoldPre(t), u = this.sortHolds(e);
if (null != u && "object" == typeof u && null != u.length && 0 !== u.length) {
for (c = 0; c < u.length; ++c) {
h = this.getMJIndex(n, c + l);
if (null != o.children[h]) {
var g = o.children[h].getComponent(cc.Sprite);
if (null != g) {
g.node.active = !0;
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(d, u[c]);
if ("up" == n) {
g.node.scaleX = 1;
g.node.scaleY = 1;
}
}
}
}
this._hideUnusedHolds(n, o, l + u.length);
} else {
var v = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (c = l; c < l + v; ++c) {
h = this.getMJIndex(n, c);
var _ = o.children[h];
if (null != _) {
_.active = !0;
var f = this._holdBackFrames ? this._holdBackFrames[n] : null, m = _.getComponent(cc.Sprite);
f && m && (m.spriteFrame = f);
if ("up" == n) {
_.scaleX = 1;
_.scaleY = i ? 1 : -1;
}
}
}
this._hideUnusedHolds(n, o, l + v);
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
revealOtherHolds: function(e, t, i) {
if (t && "object" == typeof t && null != t.length && 0 !== t.length) {
var n = cc.vv.gameNetMgr.getLocalIndex(e);
if (0 != n) {
var a = cc.vv.mahjongmgr.getSide(n);
if ("up" == a) {
var s = this.node.getChildByName("game"), o = s ? s.getChildByName(a) : null, r = o ? o.getChildByName("holds") : null;
if (null != r) {
var l = t.slice();
l.length < 14 && null != i && i >= 0 && l.push(i);
var c = cc.vv.gameNetMgr.seats[e];
if (c) {
var h = c.holds;
c.holds = l;
this.initOtherMahjongs(c);
c.holds = h;
for (var d = 0; d < r.childrenCount; ++d) {
var u = r.children[d];
if (u) {
u.scaleX = 1;
u.scaleY = 1;
}
}
}
}
}
}
}
},
revealAllOtherHolds: function(e) {
if (e && "object" == typeof e && null != e.length) for (var t = 0; t < e.length; ++t) {
var i = e[t];
i && null != i.seatindex && 0 != cc.vv.gameNetMgr.getLocalIndex(i.seatindex) && i.holds && "object" == typeof i.holds && null != i.holds.length && 0 !== i.holds.length && this.revealOtherHolds(i.seatindex, i.holds, null);
}
},
sortHolds: function(e, t) {
var i = e.holds;
if (null == i || "object" != typeof i || null == i.length) return null;
var n = null, a = (i = i.slice()).length;
!t || 2 != a && 5 != a && 8 != a && 11 != a && 14 != a || (n = i.pop());
for (var s = cc.vv.gameNetMgr.conf, o = s ? s.caishen : -1, r = s ? s.caishen2 : -1, l = [], c = [], h = 0; h < i.length; ++h) {
var d = i[h];
o >= 0 && d == o || null != r && r >= 0 && d == r ? l.push(d) : c.push(d);
}
cc.vv.mahjongmgr.sortMJ(c);
i.length = 0;
for (var u = 0; u < l.length; ++u) i.push(l[u]);
for (var g = 0; g < c.length; ++g) i.push(c[g]);
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
var l = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), c = this._myMJArr[o], h = c ? c.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", o, "holds.length=", n.length, "startSlot=", o, "endSlot=", o + n.length - 1);
for (var d = [], u = 0; u < n.length; ++u) {
var g = n[u];
if (null == (_ = this._myMJArr[u + o]) || null == _.node) {
d.push("SLOT_" + (u + o) + "=NULL");
break;
}
_.node.mjId = g;
_.node.y = 0;
var v = l && u == n.length - 1;
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
var l = r.addComponent(cc.Graphics);
l.fillColor = cc.color(18, 18, 24, 235);
l.strokeColor = cc.color(255, 200, 90, 255);
l.lineWidth = 3;
l.rect(-n / 2, -60, n, 120);
l.fill();
l.stroke();
var c = new cc.Node("cap");
c.setContentSize(n, 26);
c.setPosition(0, 37);
o.addChild(c);
var h = c.addComponent(cc.Label);
h.string = "点击组合完成操作";
h.fontSize = 22;
h.lineHeight = 26;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
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
"peng" == t.actType ? cc.vv.net.send("peng") : "gang" == t.actType ? cc.vv.net.send("gang", t.targetPai) : t.paiList && this._sendChi(t.paiList);
this.hideChiPanel();
this.hideOptions();
}
},
_sendChi: function(e) {
if (!e || e.length < 3) this.hideOptions(); else {
var t = e.slice().sort(function(e, t) {
return e - t;
});
cc.vv.net.send("chi", t);
this.hideOptions();
}
},
_onChiButton: function(e) {
var t = e && e.chipai ? e.chipai : [];
if (t.length) if (1 != t.length) {
for (var i = [], n = 0; n < t.length; ++n) {
var a = t[n];
!a || a.length < 3 || i.push({
pais: a.slice().sort(function(e, t) {
return e - t;
}),
type: "chi",
pai: e.pai
});
}
i.length && this.showChiPanel(i);
} else this._sendChi(t[0]);
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) {
var a = t.gangpai && t.gangpai.length ? t.gangpai : [ t.pai ];
if (a.length > 1) {
n.flash(t);
return;
}
cc.vv.net.send("gang", a[0]);
} else if ("btnHu" == i) cc.vv.net.send("hu"); else if ("btnGuo" == i) {
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
} else this._onChiButton(t);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
this._stopCaishenCountdown();
this._stopBaoCountdown();
this._hideWaitCaishenTip();
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {
DiceRoll: "DiceRoll",
OpTiles: "OpTiles",
OpeningFlow: "OpeningFlow"
} ],
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
var n = e("OpTiles"), a = e("DiceRoll"), s = e("OpeningFlow");
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
for (var n = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow", "DeskStyle", "Alert" ], o = 0; o < n.length; ++o) null == this.getComponent(n[o]) && this.addComponent(n[o]);
this.initView();
this.initEventHandlers();
try {
a.setOpeningVisible(this, !1);
} catch (e) {}
this.gameRoot && "game" === this.gameRoot.name || (this.gameRoot = this.node.getChildByName("game"));
this.prepareRoot && "prepare" === this.prepareRoot.name || (this.prepareRoot = this.node.getChildByName("prepare"));
this.gameRoot && (this.gameRoot.active = !1);
this.prepareRoot && (this.prepareRoot.active = !0);
this.prepareRoot && this.gameRoot && this.prepareRoot.setSiblingIndex(this.gameRoot.getSiblingIndex() + 1);
this.initWanfaLabel();
this._isGameInProgress() && s.restore(this, this._openingHooks());
cc.vv.audioMgr.playBGM("bgFight.mp3");
} else cc.director.loadScene("loading");
}
},
_isGameInProgress: function() {
var e = cc.vv.gameNetMgr;
if ("begin" != e.gamestate) return !1;
for (var t = e.seats || [], i = 0; i < t.length; ++i) {
var n = t[i];
if (n) {
if (n.holds instanceof Array && n.holds.length > 0) return !0;
if (n.holdCount > 0) return !0;
}
}
return null != e.curaction || e.numOfMJ > 0;
},
initView: function() {
this._captureHoldBackFrames();
var e = this.node.getChildByName("game");
this._mjcount = e.getChildByName("mjcount").getComponent(cc.Label);
this._updateMjCount();
this._gamecount = e.getChildByName("gamecount").getComponent(cc.Label);
this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
for (var t = e.getChildByName("myself").getChildByName("holds"), i = 0; i < t.children.length; ++i) {
var n = t.children[i].getComponent(cc.Sprite);
this._myMJArr.push(n);
n.spriteFrame = null;
}
this._setupHandGestures();
var a = cc.view.getVisibleSize().width / 1280;
if (a < 1) {
t.scaleX *= a;
t.scaleY *= a;
}
var s = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (i = 0; i < s; ++i) {
var o = cc.vv.mahjongmgr.getSide(i), r = e.getChildByName(o);
if (null != r) {
this._playEfxs.push(r.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(r.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
}
}
var l = e.getChildByName("ops");
this._options = l;
this._opTpl = e.getChildByName("opTpl");
if (l) for (var c = 0; c < l.childrenCount; ++c) {
var h = l.children[c];
if ("op" == h.name) {
var d = h.getComponent(cc.Sprite);
d && (d.enabled = !1);
var u = h.getChildByName("opTarget");
u && (u.active = !1);
}
}
var g = l ? l.getChildByName("New Layout") : null;
if (g) {
var v = g.getComponent(cc.Button);
v && (v.enabled = !1);
g.active = !1;
}
this.hideOptions();
this.hideChupai();
},
_openingHooks: function() {
var e = this;
return {
clear: function() {
e._clearOpeningTable();
},
info: function() {
a.setOpeningVisible(e, !0);
e._updateMjCount && e._updateMjCount();
},
render: function(t) {
e.onGameBeign(!0, t && t.detail);
},
deal: function() {
e._playDealAnim && e._playDealAnim();
},
caishen: function() {
e.initCaishenTip();
}
};
},
_clearOpeningTable: function() {
for (var e = 0; e < this._myMJArr.length; ++e) {
var t = this._myMJArr[e];
if (null != t && null != t.node) {
t.node.stopAllActions();
t.node.mjId = null;
t.spriteFrame = null;
t.node.active = !1;
t.node.y = 0;
}
}
var i = this.node.getChildByName("game"), n = i ? i.getChildByName("caishenTip") : null;
n && (n.active = !1);
var s = this.getComponent("MJRoom") || this.node.getComponent("MJRoom");
s && s.clearOpeningTable && s.clearOpeningTable();
a.setOpeningVisible(this, !1);
},
_updateMjCount: function() {
if (this._mjcount) {
var e = this.getComponent("MJRoom") || this.node.getComponent("MJRoom");
e && e.refreshBrickWall();
var t = e && null != e._brickRemainCount ? e._brickRemainCount : cc.vv.gameNetMgr.numOfMJ;
this._mjcount.string = "剩余" + t + "张";
}
},
hideChupai: function() {
for (var e = 0; e < this._chupaiSprite.length; ++e) this._chupaiSprite[e].node.active = !1;
},
_delayShowPrepare: function() {
var e = this;
this._pendingShowPrepare = !0;
if (!this._overClosedHooked) {
this._overClosedHooked = !0;
this.node.on("game_over_popup_closed", function() {
e._pendingShowPrepare = !1;
s.end(e, {
clear: function() {
e._clearOpeningTable();
}
});
if (!cc.vv.mahjongmgr || !cc.vv.mahjongmgr.is2Player()) {
e.gameRoot && (e.gameRoot.active = !1);
e.prepareRoot && (e.prepareRoot.active = !0);
}
});
}
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
s.start(o, o._openingHooks(), e);
});
this.node.on("game_begin", function() {
s.begin(o, {
before: function() {
try {
o.onGameBeign();
} catch (e) {
console.error("[LDH] onGameBeign error:", e);
}
},
clear: function() {
o._clearOpeningTable();
}
});
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
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? o.initMahjongs(!0) : cc.vv.replayMgr.isReplay() ? o.initMopai(e.seatIndex, t) : o.initMopai(e.seatIndex, -1);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t);
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
o.initMopai(t, e.pai);
o.revealOtherHolds(t, e.holds, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.mahjongmgr.playRandSFX(e.zimo ? "zimo" : "hu", e.zimo ? 2 : 3);
});
this.node.on("mj_count", function() {
o._updateMjCount();
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function(e) {
o.hideChiPanel();
o.revealAllOtherHolds(e.detail);
o.gameRoot && (o.gameRoot.active = !0);
o._delayShowPrepare();
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
o._chiJustSent = !1;
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
addOption: function(e, t, i) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var s = this._options.children[a];
if ("op" == s.name && 0 == s.active) {
s.active = !0;
var o = s.getChildByName("opTarget");
o && (o.active = !1);
var r = s.getChildByName(e);
r.active = !0;
r.pai = t;
r.gangpai = i && i.length ? i.slice() : null;
var l, c = this;
if (r.gangpai) l = r.gangpai.map(function(e) {
var t = n.build([ e, e, e ]);
t.opPai = e;
return t;
}); else if ("btnPeng" == e) {
var h = n.build([ t, t ]);
h.push(t);
l = [ h.sort(function(e, t) {
return e - t;
}) ];
} else l = [ [ t ] ];
var d = null;
"btnGang" == e ? d = function(e) {
cc.vv.net.send("gang", null != e.opPai ? e.opPai : e[0]);
c.hideOptions();
} : "btnPeng" == e ? d = function() {
cc.vv.net.send("peng");
c.hideOptions();
} : "btnHu" == e && (d = function() {
cc.vv.net.send("hu");
c.hideOptions();
});
n.show(this, r, l, d);
return;
}
}
},
addChiOption: function(e, t) {
for (var i = 0; i < this._options.childrenCount; ++i) {
var a = this._options.children[i];
if ("op" == a.name && 0 == a.active) {
a.active = !0;
var s = a.getChildByName("opTarget");
s && (s.active = !1);
var o = this.getChiButton(a);
if (o) {
o.active = !0;
o.pai = e;
o.chipai = t || null;
var r = [];
if (t && t.length) for (var l = 0; l < t.length; ++l) {
var c = t[l];
c && c.length >= 3 && r.push([ c[0], c[1], c[2] ].sort(function(e, t) {
return e - t;
}));
}
!r.length && null != e && e >= 0 && r.push([ e ]);
var h = this;
n.show(this, o, r, function(e) {
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
for (var a = 0; a < t.childrenCount; ++a) n.clear(t.children[a]);
}
}
this.hideChiPanel();
this.cancelChiSelect();
}
},
showAction: function(e) {
if (e && e.chi && this._chiJustSent) {
this._chiJustSent = !1;
n.toast(this, "这两张不能吃,请重选");
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
var i = this._playEfxs[e], n = i ? i.node : null;
if (null == n) {
var a = this.node.getChildByName("game"), s = cc.vv.mahjongmgr.getSide(e), o = a ? a.getChildByName(s) : null;
if (n = o ? o.getChildByName("play_efx") : null) {
i = n.getComponent(cc.Animation);
this._playEfxs[e] = i;
}
}
if (null != n) {
n.active = !0;
i && i.play(t);
if (cc.vv && cc.vv.mahjongmgr) {
var r = null;
"play_hu" == t ? r = "mj_hu" : "play_zimo" == t ? r = "mj_zimo" : "play_chi" == t ? r = "mj_chi" : "play_peng" == t ? r = "mj_peng" : "play_guafeng" != t && "play_xiayu" != t && "play_gang" != t || (r = "mj_gang");
r && cc.vv.mahjongmgr.playSpineEfx(n, r);
}
}
},
onGameBeign: function() {
if (this._overHideCb) {
this.unschedule(this._overHideCb);
this._overHideCb = null;
}
this._pendingShowPrepare = !1;
for (var e = 0; e < this._playEfxs.length; ++e) this._playEfxs[e] && this._playEfxs[e].node && (this._playEfxs[e].node.active = !1);
this.hideChupai();
this.hideOptions();
var t = this.node.getChildByName("game"), i = t.getChildByName("huanpaiinfo");
null != i && (i.active = !1);
var n = [ "right", "up", "left" ];
for (e = 0; e < n.length; ++e) {
var s = t.getChildByName(n[e]);
if (null != s) if (cc.vv.mahjongmgr.getLocalIndexBySlot(e + 1) < 0) s.active = !1; else {
s.active = !0;
for (var o = s.getChildByName("holds"), r = 0; r < o.childrenCount; ++r) o.children[r].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var l = cc.vv.gameNetMgr.seats;
for (var e in l) {
var c = l[e];
if (0 != cc.vv.gameNetMgr.getLocalIndex(e)) {
this.initOtherMahjongs(c);
("number" == typeof c.holds ? c.holds : c.holds && c.holds.length || c.holdCount || 0) > 0 && (e == cc.vv.gameNetMgr.turn ? this.initMopai(e, -1) : this.initMopai(e, null));
}
}
this.showChupai();
if (null != cc.vv.gameNetMgr.curaction) {
this.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
a.setOpeningVisible(this, !0);
}
},
_playDealAnim: function() {
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, s) {
if (null != a && 0 != n.length) {
var o = a.convertToNodeSpaceAR(e);
n.sort(s);
for (var r = 0; r < n.length; ++r) {
var l = n[r], c = l.x, h = l.y, d = l.opacity;
t.push({
node: l,
x: c,
y: h,
op: d
});
l.setPosition(o);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(c, h)), cc.fadeTo(.15, d))));
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
for (var l = this.node.getChildByName("game"), c = cc.vv.gameNetMgr.seats || [], h = 0; h < c.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var u = cc.vv.mahjongmgr.getSide(d), g = l ? l.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
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
var l = this._findMJNode(e);
if (null != l) for (var c = 0; c < this._myMJArr.length; ++c) if (l == this._myMJArr[c].node) {
if (l == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._setTileY(this._selectedMJ, 0);
this._selectedMJ = null;
return;
}
null != this._selectedMJ && this._setTileY(this._selectedMJ, 0);
this._setTileY(l, 15);
this._selectedMJ = l;
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
var n = cc.vv.gameNetMgr.getLocalIndex(e), a = cc.vv.mahjongmgr.getSide(n), s = cc.vv.mahjongmgr.getFoldPre(n), o = this.node.getChildByName("game").getChildByName(a).getChildByName("holds"), r = this.getMJIndex(a, 13), l = o.children[r];
if (null != l) {
if ("up" != a) {
l.scaleX = 1;
l.scaleY = 1;
}
if (null == t) {
l.active = !1;
if (0 == n) {
var c = l.getChildByName("csCorner");
c && (c.active = !1);
}
} else if (t >= 0) {
l.active = !0;
l.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(s, t);
if (0 == n) {
var h = cc.vv.gameNetMgr.conf || {}, d = h.caishen >= 0 && t == h.caishen || null != h.caishen2 && h.caishen2 >= 0 && t == h.caishen2;
i(l, d);
var u = l.getChildByName("csCorner");
u && (u.active = d);
}
} else if (null != t) {
l.active = !0;
l.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(a);
if (0 == n) {
var g = l.getChildByName("csCorner");
g && (g.active = !1);
}
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), s = 0; s < n.childrenCount; ++s) {
var o = n.children[s];
if ("up" != i) {
o.scaleX = 1;
o.scaleY = 1;
}
o.getComponent(cc.Sprite).spriteFrame = a;
}
},
_captureHoldBackFrames: function() {
if (!this._holdBackFrames) {
this._holdBackFrames = {};
var e = this.node.getChildByName("game");
if (null != e) for (var t = [ "myself", "up", "right", "left" ], i = 0; i < t.length; ++i) {
var n = e.getChildByName(t[i]), a = n ? n.getChildByName("holds") : null;
if (null != a && 0 !== a.childrenCount) {
var s = a.children[0].getComponent(cc.Sprite);
s && s.spriteFrame && (this._holdBackFrames[t[i]] = s.spriteFrame);
}
}
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = !!e.hued, n = cc.vv.mahjongmgr.getSide(t), a = this.node.getChildByName("game"), s = a ? a.getChildByName(n) : null, o = s ? s.getChildByName("holds") : null;
if (null != o) {
var r = e.chis || [], l = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + r.length;
l *= 3;
for (var c = 0; c < l; ++c) {
var h = this.getMJIndex(n, c);
null != o.children[h] && (o.children[h].active = !1);
}
var d = cc.vv.mahjongmgr.getFoldPre(t), u = this.sortHolds(e);
if (null != u && "object" == typeof u && null != u.length && 0 !== u.length) {
for (c = 0; c < u.length; ++c) {
h = this.getMJIndex(n, c + l);
if (null != o.children[h]) {
var g = o.children[h].getComponent(cc.Sprite);
if (null != g) {
g.node.active = !0;
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(d, u[c]);
if ("up" == n) {
g.node.scaleX = 1;
g.node.scaleY = 1;
}
}
}
}
this._hideUnusedHolds(n, o, l + u.length);
} else {
var v = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (c = l; c < l + v; ++c) {
h = this.getMJIndex(n, c);
var _ = o.children[h];
if (null != _) {
_.active = !0;
var f = this._holdBackFrames ? this._holdBackFrames[n] : null, m = _.getComponent(cc.Sprite);
f && m && (m.spriteFrame = f);
if ("up" == n) {
_.scaleX = 1;
_.scaleY = i ? 1 : -1;
}
}
}
this._hideUnusedHolds(n, o, l + v);
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
revealOtherHolds: function(e, t, i) {
if (t && "object" == typeof t && null != t.length && 0 !== t.length) {
var n = cc.vv.gameNetMgr.getLocalIndex(e);
if (0 != n) {
var a = cc.vv.mahjongmgr.getSide(n);
if ("up" == a) {
var s = this.node.getChildByName("game"), o = s ? s.getChildByName(a) : null, r = o ? o.getChildByName("holds") : null;
if (null != r) {
var l = t.slice();
l.length < 14 && null != i && i >= 0 && l.push(i);
var c = cc.vv.gameNetMgr.seats[e];
if (c) {
var h = c.holds;
c.holds = l;
this.initOtherMahjongs(c);
c.holds = h;
for (var d = 0; d < r.childrenCount; ++d) {
var u = r.children[d];
if (u) {
u.scaleX = 1;
u.scaleY = 1;
}
}
}
}
}
}
}
},
revealAllOtherHolds: function(e) {
if (e && "object" == typeof e && null != e.length) for (var t = 0; t < e.length; ++t) {
var i = e[t];
i && null != i.seatindex && 0 != cc.vv.gameNetMgr.getLocalIndex(i.seatindex) && i.holds && "object" == typeof i.holds && null != i.holds.length && 0 !== i.holds.length && this.revealOtherHolds(i.seatindex, i.holds, null);
}
},
sortHolds: function(e, t) {
var i = e.holds;
if (null == i || "object" != typeof i || null == i.length) return null;
var n = null, a = (i = i.slice()).length;
!t || 2 != a && 5 != a && 8 != a && 11 != a && 14 != a || (n = i.pop());
for (var s = cc.vv.gameNetMgr.conf, o = s ? s.caishen : -1, r = s ? s.caishen2 : -1, l = [], c = [], h = 0; h < i.length; ++h) {
var d = i[h];
o >= 0 && d == o || null != r && r >= 0 && d == r ? l.push(d) : c.push(d);
}
cc.vv.mahjongmgr.sortMJ(c);
i.length = 0;
for (var u = 0; u < l.length; ++u) i.push(l[u]);
for (var g = 0; g < c.length; ++g) i.push(c[g]);
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
var l = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), c = this._myMJArr[o], h = c ? c.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", o, "holds.length=", n.length, "startSlot=", o, "endSlot=", o + n.length - 1);
for (var d = [], u = 0; u < n.length; ++u) {
var g = n[u];
if (null == (_ = this._myMJArr[u + o]) || null == _.node) {
d.push("SLOT_" + (u + o) + "=NULL");
break;
}
_.node.mjId = g;
_.node.y = 0;
var v = l && u == n.length - 1;
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
var l = r.addComponent(cc.Graphics);
l.fillColor = cc.color(18, 18, 24, 235);
l.strokeColor = cc.color(255, 200, 90, 255);
l.lineWidth = 3;
l.rect(-n / 2, -60, n, 120);
l.fill();
l.stroke();
var c = new cc.Node("cap");
c.setContentSize(n, 26);
c.setPosition(0, 37);
o.addChild(c);
var h = c.addComponent(cc.Label);
h.string = "点击组合完成操作";
h.fontSize = 22;
h.lineHeight = 26;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
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
"peng" == t.actType ? cc.vv.net.send("peng") : "gang" == t.actType ? cc.vv.net.send("gang", t.targetPai) : t.paiList && this._sendChi(t.paiList);
this.hideChiPanel();
this.hideOptions();
}
},
_sendChi: function(e) {
if (!e || e.length < 3) this.hideOptions(); else {
var t = e.slice().sort(function(e, t) {
return e - t;
});
cc.vv.net.send("chi", t);
this.hideOptions();
}
},
_onChiButton: function(e) {
var t = e && e.chipai ? e.chipai : [];
if (t.length) if (1 != t.length) {
for (var i = [], n = 0; n < t.length; ++n) {
var a = t[n];
!a || a.length < 3 || i.push({
pais: a.slice().sort(function(e, t) {
return e - t;
}),
type: "chi",
pai: e.pai
});
}
i.length && this.showChiPanel(i);
} else this._sendChi(t[0]);
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) {
var a = t.gangpai && t.gangpai.length ? t.gangpai : [ t.pai ];
if (a.length > 1) {
n.flash(t);
return;
}
cc.vv.net.send("gang", a[0]);
} else if ("btnHu" == i) cc.vv.net.send("hu"); else if ("btnGuo" == i) {
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
} else this._onChiButton(t);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {
DiceRoll: "DiceRoll",
OpTiles: "OpTiles",
OpeningFlow: "OpeningFlow"
} ],
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
var n = e("OpTiles"), a = e("DiceRoll"), s = e("OpeningFlow");
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
_holdsSlotCount: 17,
_options: null,
_selectedMJ: null,
_chupaiSprite: [],
_mjcount: null,
_gamecount: null,
_playEfxs: [],
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
this._dicePlaying = !1;
var e = this.node.getChildByName("game"), t = e ? e.getChildByName("hua_myself") : null;
this._huaSelfPos = t ? cc.v2(t.x, t.y) : null;
var i = this.node.getComponent(cc.Canvas);
if (null != i) {
if (!cc.sys.isNative) {
i.fitHeight = !0;
i.fitWidth = !1;
for (var n = cc.director.getScene().getComponentsInChildren(cc.Camera), a = 0; a < n.length; a++) {
n[a].clearFlags = cc.Camera.ClearFlags.COLOR;
n[a].backgroundColor = cc.color(30, 18, 12);
}
}
if (cc.vv) {
try {
var o = this.node.getChildByName("game_over_xlch");
o && [ "s3", "s4" ].forEach(function(e) {
var t = o.getChildByName(e);
if (t) {
t.removeFromParent();
t.destroy();
}
});
var r = this.getComponent("GameOver");
r && r._seats && r._seats.length && (r._seats = r._seats.filter(function(e) {
return e && e.username && e.username.node && e.username.node.parent;
}));
} catch (e) {
console.error("[Wujin] 清理结算弹窗 s3/s4 异常:", e && e.stack ? e.stack : e);
}
for (var l = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow", "DeskStyle", "Alert" ], c = 0; c < l.length; ++c) try {
null == this.getComponent(l[c]) && this.addComponent(l[c]);
} catch (e) {
console.error("[Wujin] 依赖脚本挂载失败 " + l[c] + ":", e && e.stack ? e.stack : e);
}
try {
this.initView();
} catch (e) {
console.error("[Wujin] initView 异常:", e && e.stack ? e.stack : e);
}
try {
this.initEventHandlers();
} catch (e) {
console.error("[Wujin] initEventHandlers 异常:", e && e.stack ? e.stack : e);
}
try {
this.gameRoot && "game" === this.gameRoot.name || (this.gameRoot = this.node.getChildByName("game"));
this.prepareRoot && "prepare" === this.prepareRoot.name || (this.prepareRoot = this.node.getChildByName("prepare"));
this.gameRoot && (this.gameRoot.active = !1);
this.prepareRoot && (this.prepareRoot.active = !0);
this.prepareRoot && this.gameRoot && this.prepareRoot.setSiblingIndex(this.gameRoot.getSiblingIndex() + 1);
this._setSeiziVisible(!1);
this.initWanfaLabel();
this._isGameInProgress() && s.restore(this, this._openingHooks());
} catch (e) {
console.error("[Wujin] onLoad 收尾异常:", e && e.stack ? e.stack : e);
}
cc.vv.audioMgr.playBGM("bgFight.mp3");
var h = this;
cc.resources.load("images/atlas/baoqei_g", cc.SpriteAtlas, function(e, t) {
!e && t && (h._diceAtlas = t);
});
} else cc.director.loadScene("loading");
}
},
_setSeiziVisible: function(e) {
var t = this.node ? this.node.getChildByName("game") : null, i = t ? t.getChildByName("seizi") : null;
i && (i.active = !!e);
},
_isGameInProgress: function() {
var e = cc.vv.gameNetMgr;
if ("begin" != e.gamestate) return !1;
for (var t = e.seats || [], i = 0; i < t.length; ++i) {
var n = t[i];
if (n) {
if (n.holds instanceof Array && n.holds.length > 0) return !0;
if (n.holdCount > 0) return !0;
}
}
return null != e.curaction || e.numOfMJ > 0;
},
initView: function() {
this._captureHoldBackFrames();
var e = this.node.getChildByName("game");
if (null != e) {
var t = e.getChildByName("mjcount");
if (t) {
this._mjcount = t.getComponent(cc.Label);
this._updateMjCount();
}
var i = e.getChildByName("gamecount");
if (i) {
this._gamecount = i.getComponent(cc.Label);
this._gamecount && (this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局");
}
var n = e.getChildByName("myself"), a = n ? n.getChildByName("holds") : null;
this._ensureHoldsSlots(e, "myself", this._holdsSlotCount);
for (var s = [ "up", "right", "left" ], o = 0; o < s.length; ++o) this._ensureHoldsSlots(e, s[o], this._holdsSlotCount);
for (var r = 0; a && r < a.children.length; ++r) {
var l = a.children[r].getComponent(cc.Sprite);
if (null != l) {
this._myMJArr.push(l);
l.spriteFrame = null;
}
}
this._setupHandGestures();
var c = cc.view.getVisibleSize().width / 1280;
if (a && c < 1) {
a.scaleX *= c;
a.scaleY *= c;
}
var h = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (r = 0; r < h; ++r) {
var d = cc.vv.mahjongmgr.getSide(r), u = e.getChildByName(d);
if (null != u) {
var g = u.getChildByName("play_efx");
this._playEfxs.push(g ? g.getComponent(cc.Animation) : null);
var v = u.getChildByName("ChuPai");
this._chupaiSprite.push(v && v.childrenCount > 0 ? v.children[0].getComponent(cc.Sprite) : null);
}
}
var _ = e.getChildByName("ops");
this._options = _;
this._opTpl = e.getChildByName("opTpl");
if (_) for (var f = 0; f < _.childrenCount; ++f) {
var m = _.children[f];
if ("op" == m.name) {
var p = m.getComponent(cc.Sprite);
p && (p.enabled = !1);
var b = m.getChildByName("opTarget");
b && (b.active = !1);
}
}
var C = _ ? _.getChildByName("New Layout") : null;
if (C) {
var y = C.getComponent(cc.Button);
y && (y.enabled = !1);
C.active = !1;
}
this.hideOptions();
this.hideChupai();
}
},
_ensureHoldsSlots: function(e, t, i) {
var n = e.getChildByName(t), a = n ? n.getChildByName("holds") : null;
if (null != a && i) {
var s = a.childrenCount;
if (!(s >= i || s < 2)) {
var o = a.children[s - 1], r = a.children[s - 2];
if (null != o && null != r) {
for (var l = o.x - r.x, c = o.y - r.y, h = Math.abs(c) > Math.abs(l), d = s; d < i; ++d) {
var u = cc.instantiate(o);
if (h) {
u.x = o.x;
u.y = o.y + c * (d - s + 1);
} else {
u.x = o.x + l * (d - s + 1);
u.y = o.y;
}
a.addChild(u);
}
if (h) {
var g = Math.abs((o.height || 88) * (o.scaleY || 1)), v = Math.abs(c);
v * (i - 1) + g > 900 && (v = Math.max(20, (900 - g) / (i - 1)));
for (var _ = (i - 1) * v / 2, f = c > 0 ? 1 : -1, m = 0; m < a.childrenCount; ++m) a.children[m].y = f > 0 ? m * v - _ : _ - m * v;
}
}
}
}
},
_openingHooks: function() {
var e = this;
return {
clear: function() {
e._clearOpeningTable();
},
info: function() {
a.setOpeningVisible(e, !0);
e._updateMjCount && e._updateMjCount();
},
render: function(t) {
e.onGameBeign(!0, t && t.detail);
},
deal: function() {
e._playDealAnim && e._playDealAnim();
},
caishen: function() {
e.initCaishenTip();
}
};
},
_clearOpeningTable: function() {
for (var e = 0; e < this._myMJArr.length; ++e) {
var t = this._myMJArr[e];
if (null != t && null != t.node) {
t.node.stopAllActions();
t.node.mjId = null;
t.spriteFrame = null;
t.node.active = !1;
t.node.y = 0;
}
}
var i = this.node.getChildByName("game"), n = i ? i.getChildByName("caishenTip") : null;
n && (n.active = !1);
var s = this.getComponent("MJRoom") || this.node.getComponent("MJRoom");
s && s.clearOpeningTable && s.clearOpeningTable();
a.setOpeningVisible(this, !1);
this._setSeiziVisible(!1);
},
_updateMjCount: function() {
var e = this.getComponent("MJRoom") || this.node.getComponent("MJRoom");
e && e.refreshBrickWall();
if (this._mjcount) {
var t = e && null != e._brickRemainCount ? e._brickRemainCount : cc.vv.gameNetMgr.numOfMJ;
this._mjcount.string = "剩余" + t + "张";
}
},
hideChupai: function() {
for (var e = 0; e < this._chupaiSprite.length; ++e) this._chupaiSprite[e] && this._chupaiSprite[e].node && (this._chupaiSprite[e].node.active = !1);
},
_delayShowPrepare: function() {
var e = this;
this._pendingShowPrepare = !0;
if (!this._overClosedHooked) {
this._overClosedHooked = !0;
this.node.on("game_over_popup_closed", function() {
e._pendingShowPrepare = !1;
s.end(e, {
clear: function() {
e._clearOpeningTable();
}
});
if (!cc.vv.mahjongmgr || !cc.vv.mahjongmgr.is2Player()) {
e.gameRoot && (e.gameRoot.active = !1);
e.prepareRoot && (e.prepareRoot.active = !0);
e._setSeiziVisible(!1);
}
});
}
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
s.start(o, o._openingHooks(), e);
});
this.node.on("game_begin", function() {
s.begin(o, {
before: function() {
try {
o.onGameBeign();
} catch (e) {
console.error("[Wujin] onGameBeign异常:", e && e.stack ? e.stack : e);
}
},
clear: function() {
o._clearOpeningTable();
},
roll: function(e) {
o._playDiceAnim(e);
}
});
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
o.applyMopai(e);
o._updateMjCount();
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t);
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
o.initMopai(t, e.pai);
o.revealOtherHolds(t, e.holds, e.pai);
e.zimo ? o.playEfx(i, "play_zimo") : o.playEfx(i, "play_hu");
cc.vv.mahjongmgr.playRandSFX(e.zimo ? "zimo" : "hu", e.zimo ? 2 : 3);
});
this.node.on("mj_count", function() {
o._updateMjCount();
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function(e) {
o.hideChiPanel();
o.hideYoujinPanel();
o.revealAllOtherHolds(e.detail);
o.gameRoot && (o.gameRoot.active = !0);
o._delayShowPrepare();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
o._playHuaHaixiu(t.si);
o.playHuaExchange(t);
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
addOption: function(e, t, i) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var s = this._options.children[a];
if ("op" == s.name && 0 == s.active) {
s.active = !0;
var o = s.getChildByName("opTarget");
o && (o.active = !1);
var r = s.getChildByName(e);
r.active = !0;
r.pai = t;
r.gangpai = i && i.length ? i.slice() : null;
var l, c = this;
if (r.gangpai) l = r.gangpai.map(function(e) {
var t = n.build([ e, e, e ]);
t.opPai = e;
return t;
}); else if ("btnPeng" == e) {
var h = n.build([ t, t ]);
h.push(t);
l = [ h.sort(function(e, t) {
return e - t;
}) ];
} else l = [ [ t ] ];
var d = null;
"btnGang" == e ? d = function(e) {
cc.vv.net.send("gang", null != e.opPai ? e.opPai : e[0]);
c.hideOptions();
} : "btnPeng" == e ? d = function() {
cc.vv.net.send("peng");
c.hideOptions();
} : "btnHu" == e && (d = function() {
cc.vv.net.send("hu");
c.hideOptions();
});
n.show(this, r, l, d);
return;
}
}
},
addChiOption: function(e, t) {
for (var i = 0; i < this._options.childrenCount; ++i) {
var a = this._options.children[i];
if ("op" == a.name && 0 == a.active) {
a.active = !0;
var s = a.getChildByName("opTarget");
s && (s.active = !1);
var o = this.getChiButton(a);
if (o) {
o.active = !0;
o.pai = e;
o.chipai = t || null;
var r = [];
if (t && t.length) for (var l = 0; l < t.length; ++l) {
var c = t[l];
c && c.length >= 3 && r.push([ c[0], c[1], c[2] ].sort(function(e, t) {
return e - t;
}));
}
!r.length && null != e && e >= 0 && r.push([ e ]);
var h = this;
n.show(this, o, r, function(e) {
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
var i = t.getChildByName("btnLabel");
i && (i.active = !1);
if (!t._chiBound) {
t._chiBound = !0;
cc.vv.utils.addClickEvent(t, this.node, "MJGameWujin", "onOptionClicked");
}
return t;
}
var n = e.getChildByName("btnPeng");
t = new cc.Node("btnChi");
e.addChild(t);
if (n) {
t.setPosition(n.getPosition());
t.setContentSize(n.getContentSize());
t.scaleX = n.scaleX;
t.scaleY = n.scaleY;
}
var a = t.addComponent(cc.Sprite);
a.type = cc.Sprite.Type.SIMPLE;
a.sizeMode = cc.Sprite.SizeMode.CUSTOM;
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
var s = new cc.Node("btnLabel");
t.addChild(s);
var o = s.addComponent(cc.Label);
o.string = "吃";
o.fontSize = 40;
o.lineHeight = 40;
o.overflow = cc.Label.Overflow.NONE;
o.enableWrapText = !1;
o.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = cc.color(255, 255, 255);
s.setPosition(0, 0);
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
var l = r.addComponent(cc.Label);
l.string = i;
l.fontSize = n || 40;
l.lineHeight = l.fontSize;
l.overflow = cc.Label.Overflow.NONE;
l.enableWrapText = !1;
l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
l.verticalAlign = cc.Label.VerticalAlign.CENTER;
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
for (var a = 0; a < t.childrenCount; ++a) n.clear(t.children[a]);
var s = t.getChildByName("btnQiangJin");
s && (s.active = !1);
var o = t.getChildByName("btnYouJin");
o && (o.active = !1);
var r = t.getChildByName("btnYouJinGo");
r && (r.active = !1);
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
if (e.gang) {
var i = e.gangpai && e.gangpai.length ? e.gangpai[0] : e.pai;
this.addOption("btnGang", i, e.gangpai);
}
e.chi && this.addChiOption(e.pai, e.chipai);
e.qiangjin && this.addZpOption("btnQiangJin", "抢金", e.pai, 32);
t && this.addZpOption("btnYouJin", "游金", e.pai);
e.youjingo && this.addZpOption("btnYouJinGo", "继续游金", e.pai, 28);
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
var i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game") || this.node, a = n.getChildByName("hua_" + i);
if (null == a) {
a = new cc.Node("huaArea_" + i);
var s = this._huaAreaPos(i);
a.setPosition(s.x, s.y);
n.addChild(a);
}
this._huaAreas[t] = a;
"myself" == i && null != this._huaSelfPos && a.setPosition(this._huaSelfPos.x, this._huaSelfPos.y);
return a;
},
_tileBodyFrame: function(e, t) {
var i = [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][t], n = cc.vv.mahjongmgr;
if (null == i || null == n) return null;
if ("up" == e) {
var a = n.bottomFoldAtlas;
return (a ? a.getSpriteFrame("B_" + i) : null) || (n.bottomAtlas ? n.bottomAtlas.getSpriteFrame("M_" + i) : null);
}
var s = "left" == e ? "L_" : "right" == e ? "R_" : "M_", o = "L_" == s ? n.leftAtlas : "R_" == s ? n.rightAtlas : n.bottomAtlas;
return o ? o.getSpriteFrame(s + i) : null;
},
_fillHuaArt: function(e, t, i, n) {
var a = this;
cc.vv.mahjongmgr.getHuaSpriteFrame(i, function(s) {
if (cc.isValid(e) && cc.isValid(t)) if (null == s) {
t.spriteFrame = a._tileBodyFrame(n, i);
var o = new cc.Node("name");
e.addChild(o);
var r = o.addComponent(cc.Label);
r.string = i >= 0 && i < 8 ? [ "梅", "兰", "竹", "菊", "春", "夏", "秋", "冬" ][i] : "花";
r.fontSize = 26;
r.lineHeight = 28;
r.overflow = cc.Label.Overflow.NONE;
r.enableWrapText = !1;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.verticalAlign = cc.Label.VerticalAlign.CENTER;
o.color = cc.color(220, 40, 40);
} else t.spriteFrame = s;
});
},
_playHuaHaixiu: function(e) {
this._haixiuUntil || (this._haixiuUntil = {});
var t = Date.now(), i = null == e ? -1 : e;
if (!(this._haixiuUntil[i] && t < this._haixiuUntil[i])) {
this._haixiuUntil[i] = t + 2400;
var n = this, a = function(e) {
if (e && cc.isValid(n.node)) {
var t = new cc.Node("huaHaixiu"), i = t.addComponent(cc.Sprite);
i.sizeMode = cc.Sprite.SizeMode.CUSTOM;
i.spriteFrame = e;
var a = e.getRect(), s = Math.round(300 * a.height / a.width);
t.setContentSize(300, s);
t.setPosition(0, 120);
t.scale = .4;
t.opacity = 0;
n.node.addChild(t);
t.setSiblingIndex(n.node.childrenCount - 1);
cc.tween(t).to(.35, {
scale: 1.1,
opacity: 255
}, {
easing: "backOut"
}).to(.15, {
scale: 1
}).delay(1).to(.35, {
opacity: 0,
position: cc.v3(0, 160, 0)
}).call(function() {
cc.isValid(t) && t.destroy();
}).start();
}
};
this._haixiuFrame ? a(this._haixiuFrame) : cc.resources.load("images/MJ/hua/haixiu", cc.SpriteFrame, function(e, t) {
if (!e && t) {
n._haixiuFrame = t;
a(t);
}
});
}
},
applyMopai: function(e) {
if (e) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? this.initMahjongs(!0) : cc.vv.replayMgr.isReplay() ? this.initMopai(e.seatIndex, t) : this.initMopai(e.seatIndex, -1);
}
},
playHuaExchange: function(e) {
var t = this.node.getChildByName("game");
if (null != t && null != e) {
var i = this, n = this.getComponent("MJRoom"), a = cc.vv.gameNetMgr.getLocalIndex(e.si), s = cc.vv.mahjongmgr.getSide(a), o = t.getChildByName(s), r = o ? o.getChildByName("holds") : null, l = null;
if (r) {
var c = this.getMJIndex(s, this._holdsSlotCount - 1);
l = r.children[c] || null;
}
var h = r ? cc.v2(r.x, r.y) : cc.v2(0, 0);
if (null != l) {
var d = r.convertToWorldSpaceAR(cc.v2(l.x, l.y));
h = t.convertToNodeSpaceAR(d);
}
var u = null, g = n ? n.getBrickTailNode() : null;
if (g && g.parent) {
var v = g.parent.convertToWorldSpaceAR(cc.v2(g.x, g.y));
u = t.convertToNodeSpaceAR(v);
}
var _ = this.getHuaArea(e.si), f = cc.v2(_ ? _.x : 0, _ ? _.y : 0);
if (_ && _.childrenCount > 0) {
var m = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[e.si] : null, p = m && m.hua && m.hua.length ? m.hua.length - 1 : 0;
p < 0 && (p = 0);
p > _.childrenCount - 1 && (p = _.childrenCount - 1);
var b = _.children[p];
f = cc.v2(_.x + b.x, _.y + b.y);
}
var C = null != e.pai ? e.pai - 34 : -1;
if (!(C < 0 || C > 7)) {
var y = this._tileBodyFrame(s, C), S = new cc.Node("huaFx"), N = S.addComponent(cc.Sprite);
N.sizeMode = cc.Sprite.SizeMode.CUSTOM;
S.setContentSize(55, 83);
null != y && (N.spriteFrame = y);
this._fillHuaArt(S, N, C, s);
S.setPosition(h.x, h.y);
S.scale = .85;
S.color = cc.color(255, 208, 90);
t.addChild(S);
cc.tween(S).delay(.12).to(1.05, {
position: cc.v3(f.x, f.y, 0),
scale: 1
}, {
easing: "quadOut"
}).call(function() {
cc.isValid(S) && S.destroy();
cc.vv.audioMgr.playSFX("fanpai.mp3");
i.initHuaArea(e.si);
i._updateMjCount();
}).delay(.4).call(function() {
if (u) {
var e = new cc.Node("huaDrawFx"), a = e.addComponent(cc.Sprite), s = g.getComponent(cc.Sprite);
a.spriteFrame = s ? s.spriteFrame : n ? n._brickFrame : null;
a.sizeMode = cc.Sprite.SizeMode.CUSTOM;
e.setContentSize(64, 82);
e.setPosition(u.x, u.y);
t.addChild(e);
cc.tween(e).to(.95, {
position: cc.v3(h.x, h.y, 0)
}, {
easing: "quadInOut"
}).call(function() {
cc.isValid(e) && e.destroy();
i._updateMjCount();
}).start();
} else i._updateMjCount();
}).start();
}
}
},
_fillHuaSlots: function(e, t, i) {
for (var n = 0; n < e.childrenCount; ++n) {
var a = e.children[n], s = n < t.length ? t[n] - 34 : -1, o = s >= 0 && s < 8;
a.active = o;
a.color = o ? cc.color(255, 208, 90) : cc.Color.WHITE;
var r = a.getComponent(cc.Sprite);
if (null != r) {
var l = a.getChildByName("huaArt");
l && l.destroy();
if (o) {
r.sizeMode = cc.Sprite.SizeMode.CUSTOM;
r.spriteFrame = this._tileBodyFrame(i, s);
this._fillHuaArt(a, r, s, i);
} else r.spriteFrame = null;
}
}
},
initHuaArea: function(e) {
var t = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[e] : null;
if (null != t) {
var i = this.getHuaArea(e);
if (null != i) {
if (0 == i.childrenCount) for (var n = 0; n < 8; ++n) {
var a = new cc.Node("slot" + n);
a.setContentSize(44, 64);
a.setPosition(48 * n + 22, 0);
a.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
i.addChild(a);
}
var s = cc.vv.gameNetMgr.getLocalIndex(e), o = cc.vv.mahjongmgr.getSide(s);
this._fillHuaSlots(i, t.hua || [], o);
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
var l = this.getHuaArea(e);
n.setPosition(l.x, l.y + 80);
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
for (var l = 0; l < e.length; ++l) {
var c = new cc.Node("yjItem" + l);
c.setContentSize(62, 90);
c.setPosition(51 + -i / 2 + 78 * l, -14);
n.addChild(c);
c.addComponent(cc.Button);
c.pai = e[l];
cc.vv.utils.addClickEvent(c, this.node, "MJGameWujin", "onYoujinItemClicked");
var h = c.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[l]);
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
var i = this._playEfxs[e], n = i ? i.node : null;
if (null == n) {
var a = this.node.getChildByName("game"), s = cc.vv.mahjongmgr.getSide(e), o = a ? a.getChildByName(s) : null;
if (n = o ? o.getChildByName("play_efx") : null) {
i = n.getComponent(cc.Animation);
this._playEfxs[e] = i;
}
}
if (null != n) {
n.active = !0;
i && i.play(t);
if (cc.vv && cc.vv.mahjongmgr) {
var r = null;
"play_hu" == t ? r = "mj_hu" : "play_zimo" == t ? r = "mj_zimo" : "play_chi" == t ? r = "mj_chi" : "play_peng" == t ? r = "mj_peng" : "play_guafeng" != t && "play_xiayu" != t && "play_gang" != t || (r = "mj_gang");
r && cc.vv.mahjongmgr.playSpineEfx(n, r);
}
}
},
onGameBeign: function() {
if (this._overHideCb) {
this.unschedule(this._overHideCb);
this._overHideCb = null;
}
this._clearHuaFx();
this._pendingShowPrepare = !1;
for (var e = 0; e < this._playEfxs.length; ++e) this._playEfxs[e] && this._playEfxs[e].node && (this._playEfxs[e].node.active = !1);
this.hideChupai();
this.hideOptions();
var t = this.node.getChildByName("game"), i = t.getChildByName("huanpaiinfo");
null != i && (i.active = !1);
var n = [ "right", "up", "left" ];
for (e = 0; e < n.length; ++e) {
var a = t.getChildByName(n[e]);
if (null != a) if ((cc.vv.mahjongmgr.getLocalIndexBySlot ? cc.vv.mahjongmgr.getLocalIndexBySlot(e + 1) : cc.vv.gameNetMgr.getLocalIndex(e + 1)) < 0) a.active = !1; else {
a.active = !0;
var s = a.getChildByName("holds");
if (null != s) for (var o = 0; o < s.childrenCount; ++o) s.children[o].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || cc.vv.replayMgr && cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var r = cc.vv.gameNetMgr.seats;
for (var e in r) {
var l = r[e];
if (0 != cc.vv.gameNetMgr.getLocalIndex(e)) {
this.initOtherMahjongs(l);
("number" == typeof l.holds ? l.holds : l.holds && l.holds.length || l.holdCount || 0) > 0 && (e == cc.vv.gameNetMgr.turn ? this.initMopai(e, -1) : this.initMopai(e, null));
}
}
this.initAllHuaAreas();
this.showChupai();
if (null != cc.vv.gameNetMgr.curaction) {
this.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
}
},
_dbg: function(e) {
try {
cc.vv && cc.vv.http && cc.vv.http.sendRequest("/dbg_log", {
m: String(e).substring(0, 300)
}, function() {});
} catch (e) {}
},
_clearHuaFx: function(e) {
if (e = e || (this.node ? this.node.getChildByName("game") : null)) for (var t = e.childrenCount - 1; t >= 0; --t) {
var i = e.children[t];
if (i && ("huaFx" === i.name || "huaDrawFx" === i.name)) {
i.stopAllActions();
i.destroy();
}
}
},
_playDiceAnim: function(e) {
var t = this;
try {
var i = this.node ? this.node.getChildByName("game") : null;
if (i && !i.active) {
this._diceWait = (this._diceWait || 0) + 1;
if (this._diceWait > 15) {
console.warn("[色子] 牌桌层一直未显示,放弃本轮掷色子");
e && e();
return;
}
this.scheduleOnce(function() {
t._playDiceAnim(e);
}, .2);
return;
}
var n = i ? i.getChildByName("seizi") : null, a = n ? n.getChildByName("Spriteseizi0") : null, s = n ? n.getChildByName("Spriteseizi1") : null;
if (null == n || null == a || null == s) {
console.warn("[色子] 节点缺失 game=" + !!i + " seizi=" + !!n + " d0=" + !!a + " d1=" + !!s);
e && e();
return;
}
var o = a.getComponent(cc.Sprite), r = s.getComponent(cc.Sprite);
this._dbg("play 进入 game=" + !!i + " active=" + (i ? i.active : "-") + " seizi=" + !!n + " sp0=" + !!o + " sp1=" + !!r);
if (null == o || null == r) {
console.warn("[色子] Spriteseizi 缺少 cc.Sprite 组件");
e && e();
return;
}
var l = [];
o.spriteFrame && l.push(o.spriteFrame);
r.spriteFrame && r.spriteFrame !== l[0] && l.push(r.spriteFrame);
var c = function(c) {
if (cc.isValid(n)) {
var h = [];
if (c) for (var d = 1; d <= 6; ++d) {
var u = c.getSpriteFrame("dice_" + d + ".png") || c.getSpriteFrame("dice_" + d);
u && h.push(u);
}
if (0 == h.length) {
h = l;
console.warn("[色子] 图集里没取到 dice_1~6 帧,改用场景已有牌面兜底,数量=" + h.length);
}
if (0 != h.length) {
t._dicePlaying = !0;
n.active = !0;
n.opacity = 255;
n.color = cc.Color.WHITE;
n.parent && n.setSiblingIndex(n.parent.childrenCount - 1);
var g = cc.view.getVisibleSize(), v = cc.view.getVisibleOrigin(), _ = i ? i.getChildByName("arrow") : null, f = _ && cc.isValid(_) ? _.convertToWorldSpaceAR(cc.v2(0, 0)) : cc.v2(v.x + g.width / 2, v.y + g.height / 2), m = cc.v2(v.x + g.width - .1 * g.width, v.y + .08 * g.height), p = cc.v2(v.x + g.width - .04 * g.width, v.y + .16 * g.height), b = function() {
return h[Math.floor(Math.random() * h.length)];
}, C = [ {
n: a,
sp: o,
startW: m,
off: cc.v2(-52, 8),
hx: a.x,
hy: a.y,
delay: 0,
spin: 0,
speed: 900,
lastFace: 0,
final: b(),
backAt: 1.5
}, {
n: s,
sp: r,
startW: p,
off: cc.v2(52, -8),
hx: s.x,
hy: s.y,
delay: .22,
spin: 0,
speed: 760,
lastFace: 0,
final: b(),
backAt: 1.62
} ];
s.active = !1;
var y = t._diceSeq = (t._diceSeq || 0) + 1, S = Date.now(), N = 0;
t._dbg("faces=" + h.length + " centerW=" + Math.round(f.x) + "," + Math.round(f.y) + " startW0=" + Math.round(m.x) + "," + Math.round(m.y) + " startW1=" + Math.round(p.x) + "," + Math.round(p.y) + " home=" + Math.round(a.x) + "," + Math.round(a.y) + " vs=" + Math.round(g.width) + "x" + Math.round(g.height) + " inHier=" + n.activeInHierarchy);
console.log("[色子] 开始播放,牌面数=" + h.length);
var B = setInterval(function() {
if (y === t._diceSeq && cc.isValid(n) && cc.isValid(a) && cc.isValid(s)) {
var i = (Date.now() - S) / 1e3, o = Math.min(.05, Math.max(0, i - N));
N = i;
for (var r = _ && cc.isValid(_) ? _.convertToWorldSpaceAR(cc.v2(0, 0)) : f, l = n.convertToNodeSpaceAR(r), c = 0; c < C.length; ++c) {
var h = C[c], d = h.n, u = h.sp;
if (!(i < h.delay)) {
d.active || (d.active = !0);
var v = n.convertToNodeSpaceAR(h.startW), m = cc.v2(l.x + h.off.x, l.y + h.off.y), p = i - h.delay;
if (p < .72) {
var M = p / .72, w = 1 - Math.pow(1 - M, 3);
d.setPosition(v.x + (m.x - v.x) * w, v.y + (m.y - v.y) * w + Math.sin(Math.PI * M) * g.height * .1);
h.spin += h.speed * o;
d.angle = -h.spin % 360;
d.setScale(2);
if (i - h.lastFace >= .07) {
h.lastFace = i;
u.spriteFrame = b();
}
} else if (i < h.backAt) {
var T = h.backAt - i, x = T < .2 ? Math.max(0, T / .2) : 1;
d.setPosition(m.x, m.y);
h.spin += h.speed * o * x;
d.angle = -h.spin % 360;
d.setScale(2);
if (T < .2) {
d.angle = 0;
u.spriteFrame = h.final;
} else if (i - h.lastFace >= .07) {
h.lastFace = i;
u.spriteFrame = b();
}
} else if (i < h.backAt + .45) {
var I = (i - h.backAt) / .45, P = I * I * (3 - 2 * I);
d.angle = 0;
u.spriteFrame = h.final;
d.setPosition(m.x + (h.hx - m.x) * P, m.y + (h.hy - m.y) * P);
d.setScale(2 - P);
} else {
d.setPosition(h.hx, h.hy);
d.setScale(1);
d.angle = 0;
u.spriteFrame = h.final;
}
}
}
if (i >= 2.15) {
clearInterval(B);
t._dicePlaying = !1;
t._dbg("done active=" + n.activeInHierarchy);
e && e();
}
} else clearInterval(B);
}, 30);
} else {
console.warn("[色子] 没有任何可用牌面,无法播放");
e && e();
}
} else e && e();
};
if (this._diceAtlas) {
c(this._diceAtlas);
return;
}
cc.resources.load("images/atlas/baoqei_g", cc.SpriteAtlas, function(e, i) {
e ? console.warn("[色子] 图集加载失败:", e && (e.message || e) || e) : i && (t._diceAtlas = i);
c(e ? null : i);
});
} catch (t) {
console.error("[色子] 播放异常:", t && t.stack ? t.stack : t);
e && e();
}
},
_playDealAnim: function() {
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, s) {
if (null != a && 0 != n.length) {
var o = a.convertToNodeSpaceAR(e);
n.sort(s);
for (var r = 0; r < n.length; ++r) {
var l = n[r], c = l.x, h = l.y, d = l.opacity;
d > 0 || (d = 255);
t.push({
node: l,
x: c,
y: h,
op: d
});
l.setPosition(o);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(c, h)), cc.fadeTo(.15, d))));
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
for (var l = this.node.getChildByName("game"), c = cc.vv.gameNetMgr.seats || [], h = 0; h < c.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var u = cc.vv.mahjongmgr.getSide(d), g = l ? l.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
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
var l = this._findMJNode(e);
if (null != l) for (var c = 0; c < this._myMJArr.length; ++c) if (l == this._myMJArr[c].node) {
if (l == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._setTileY(this._selectedMJ, 0);
this._selectedMJ = null;
return;
}
null != this._selectedMJ && this._setTileY(this._selectedMJ, 0);
this._setTileY(l, 15);
this._selectedMJ = l;
return;
}
} else console.log("not your turn." + cc.vv.gameNetMgr.turn);
},
shoot: function(e) {
null != e && cc.vv.net.send("chupai", e);
},
getMJIndex: function(e, t) {
return "right" == e || "up" == e ? this._holdsSlotCount - 1 - t : t;
},
initMopai: function(e, t) {
this._cancelDealAnim();
var n = cc.vv.gameNetMgr.getLocalIndex(e), a = cc.vv.mahjongmgr.getSide(n), s = cc.vv.mahjongmgr.getFoldPre(n), o = this.node.getChildByName("game").getChildByName(a).getChildByName("holds"), r = this.getMJIndex(a, this._holdsSlotCount - 1), l = o.children[r];
if (null != l) {
if ("up" != a) {
l.scaleX = 1;
l.scaleY = 1;
}
if (null == t) {
l.active = !1;
if (0 == n) {
var c = l.getChildByName("csCorner");
c && (c.active = !1);
}
} else if (t >= 0) {
l.active = !0;
var h = l.getComponent(cc.Sprite);
if (t >= 34 && t <= 41) {
h.spriteFrame = this._tileBodyFrame(a, t - 34);
this._fillHuaArt(l, h, t - 34, a);
} else h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(s, t);
if (0 == n) {
var d = cc.vv.gameNetMgr.conf || {}, u = d.caishen >= 0 && t == d.caishen || null != d.caishen2 && d.caishen2 >= 0 && t == d.caishen2;
i(l, u);
var g = l.getChildByName("csCorner");
g && (g.active = u);
}
} else if (null != t) {
l.active = !0;
(h = l.getComponent(cc.Sprite)).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(a);
if (0 == n) {
var v = l.getChildByName("csCorner");
v && (v.active = !1);
}
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), s = 0; s < n.childrenCount; ++s) {
var o = n.children[s];
if ("up" != i) {
o.scaleX = 1;
o.scaleY = 1;
}
o.getComponent(cc.Sprite).spriteFrame = a;
}
},
_captureHoldBackFrames: function() {
if (!this._holdBackFrames) {
this._holdBackFrames = {};
var e = this.node.getChildByName("game");
if (null != e) for (var t = [ "myself", "up", "right", "left" ], i = 0; i < t.length; ++i) {
var n = e.getChildByName(t[i]), a = n ? n.getChildByName("holds") : null;
if (null != a && 0 !== a.childrenCount) {
var s = a.children[0].getComponent(cc.Sprite);
s && s.spriteFrame && (this._holdBackFrames[t[i]] = s.spriteFrame);
}
}
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = !!e.hued, n = cc.vv.mahjongmgr.getSide(t), a = this.node.getChildByName("game"), s = a ? a.getChildByName(n) : null, o = s ? s.getChildByName("holds") : null;
if (null != o) {
var r = e.chis || [], l = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + r.length;
l *= 3;
for (var c = 0; c < l; ++c) {
var h = this.getMJIndex(n, c);
null != o.children[h] && (o.children[h].active = !1);
}
var d = cc.vv.mahjongmgr.getFoldPre(t), u = this.sortHolds(e);
if (null != u && "object" == typeof u && null != u.length && 0 !== u.length) {
for (c = 0; c < u.length; ++c) {
h = this.getMJIndex(n, c + l);
if (null != o.children[h]) {
var g = o.children[h].getComponent(cc.Sprite);
if (null != g) {
g.node.active = !0;
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(d, u[c]);
if ("up" == n) {
g.node.scaleX = 1;
g.node.scaleY = 1;
}
}
}
}
this._hideUnusedHolds(n, o, l + u.length);
} else {
var v = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (c = l; c < l + v; ++c) {
h = this.getMJIndex(n, c);
var _ = o.children[h];
if (null != _) {
_.active = !0;
var f = this._holdBackFrames ? this._holdBackFrames[n] : null, m = _.getComponent(cc.Sprite);
f && m && (m.spriteFrame = f);
if ("up" == n) {
_.scaleX = 1;
_.scaleY = i ? 1 : -1;
}
}
}
this._hideUnusedHolds(n, o, l + v);
}
}
}
}
},
_hideUnusedHolds: function(e, t, i) {
for (var n = i; n < t.childrenCount; ++n) {
var a = this.getMJIndex(e, n);
null != t.children[a] && (t.children[a].active = !1);
}
},
revealOtherHolds: function(e, t, i) {
if (t && "object" == typeof t && null != t.length && 0 !== t.length) {
var n = cc.vv.gameNetMgr.getLocalIndex(e);
if (0 != n) {
var a = cc.vv.mahjongmgr.getSide(n);
if ("up" == a) {
var s = this.node.getChildByName("game"), o = s ? s.getChildByName(a) : null, r = o ? o.getChildByName("holds") : null;
if (null != r) {
var l = t.slice();
null != i && i >= 0 && l.length % 3 == 1 && l.push(i);
var c = cc.vv.gameNetMgr.seats[e];
if (c) {
var h = c.holds;
c.holds = l;
this.initOtherMahjongs(c);
c.holds = h;
for (var d = 0; d < r.childrenCount; ++d) {
var u = r.children[d];
if (u) {
u.scaleX = 1;
u.scaleY = 1;
}
}
}
}
}
}
}
},
revealAllOtherHolds: function(e) {
if (e && "object" == typeof e && null != e.length) for (var t = 0; t < e.length; ++t) {
var i = e[t];
i && null != i.seatindex && 0 != cc.vv.gameNetMgr.getLocalIndex(i.seatindex) && i.holds && "object" == typeof i.holds && null != i.holds.length && 0 !== i.holds.length && this.revealOtherHolds(i.seatindex, i.holds, null);
}
},
sortHolds: function(e, t) {
var i = e.holds;
if (null == i || "object" != typeof i || null == i.length) return null;
var n = null, a = (i = i.slice()).length;
!t || 2 != a && 5 != a && 8 != a && 11 != a && 14 != a && 17 != a || (n = i.pop());
for (var s = cc.vv.gameNetMgr.conf, o = s ? s.caishen : -1, r = s ? s.caishen2 : -1, l = [], c = [], h = 0; h < i.length; ++h) {
var d = i[h];
o >= 0 && d == o || null != r && r >= 0 && d == r ? l.push(d) : c.push(d);
}
cc.vv.mahjongmgr.sortMJ(c);
i.length = 0;
for (var u = 0; u < l.length; ++u) i.push(l[u]);
for (var g = 0; g < c.length; ++g) i.push(c[g]);
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
var l = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length || 17 == n.length), c = this._myMJArr[o], h = c ? c.node.x : 0, d = l ? a : 0, u = (n.length - 1) * r + d;
if (r > 0 && n.length > 1 && h + u > 790) {
r = Math.max(40, (790 - h - d) / (n.length - 1));
u = (n.length - 1) * r + d;
0 == o && (h = -u / 2);
}
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", o, "holds.length=", n.length, "startSlot=", o, "endSlot=", o + n.length - 1);
for (var g = cc.vv.gameNetMgr.conf, v = g ? g.caishen : -1, _ = g ? g.caishen2 : -1, f = [], m = 0; m < n.length; ++m) {
var p = n[m];
if (null == (y = this._myMJArr[m + o]) || null == y.node) {
f.push("SLOT_" + (m + o) + "=NULL");
break;
}
y.node.mjId = p;
y.node.y = 0;
var b = l && m == n.length - 1;
r > 0 && (y.node.x = h + m * r + (b ? a : 0));
this.setSpriteFrameByMJID("M_", y, p);
var C = v >= 0 && p == v || null != _ && _ >= 0 && p == _;
y.node.color = C ? cc.color(255, 200, 90) : cc.Color.WHITE;
f.push("SLOT_" + (m + o) + "=" + p);
}
console.log("[initMahjongs] render:", f.join("|"));
for (m = 0; m < o; ++m) if (null != (y = this._myMJArr[m]) && null != y.node) {
y.node.mjId = null;
y.spriteFrame = null;
y.node.active = !1;
}
for (m = o + n.length; m < this._myMJArr.length; ++m) {
var y;
if (null != (y = this._myMJArr[m]) && null != y.node) {
y.node.mjId = null;
y.spriteFrame = null;
y.node.active = !1;
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
var l = r.addComponent(cc.Graphics);
l.fillColor = cc.color(18, 18, 24, 235);
l.strokeColor = cc.color(255, 200, 90, 255);
l.lineWidth = 3;
l.rect(-n / 2, -60, n, 120);
l.fill();
l.stroke();
var c = new cc.Node("cap");
c.setContentSize(n, 26);
c.setPosition(0, 37);
o.addChild(c);
var h = c.addComponent(cc.Label);
h.string = "点击组合完成操作";
h.fontSize = 22;
h.lineHeight = 26;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
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
this._sendChi(t.paiList);
return;
}
this.hideChiPanel();
this.hideOptions();
}
},
_sendChi: function(e) {
if (!e || e.length < 3) this.hideOptions(); else {
var t = e.slice().sort(function(e, t) {
return e - t;
});
cc.vv.net.send("chi", t);
this.hideOptions();
}
},
_onChiButton: function(e) {
var t = e && e.chipai ? e.chipai : [];
if (t.length) if (1 != t.length) {
for (var i = [], n = 0; n < t.length; ++n) {
var a = t[n];
!a || a.length < 3 || i.push({
pais: a.slice().sort(function(e, t) {
return e - t;
}),
type: "chi",
pai: e.pai
});
}
i.length && this.showChiPanel(i);
} else this._sendChi(t[0]);
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) {
var a = t.gangpai && t.gangpai.length ? t.gangpai : [ t.pai ];
if (a.length > 1) {
n.flash(t);
return;
}
cc.vv.net.send("gang", a[0]);
} else if ("btnHu" == i || "btnQiangJin" == i) cc.vv.net.send("hu"); else {
if ("btnYouJin" == i) {
var s = cc.vv.gameNetMgr.curaction, o = s && s.youjin ? s.youjin : this._lastYoujin || [];
this._lastYoujin = o;
this.showYoujinPanel(o);
return;
}
if ("btnYouJinGo" == i) {
cc.vv.net.send("youjin_go");
this.hideOptions();
} else if ("btnGuo" == i) {
var r = this._options.getChildByName("btnHu");
if (r && r.active && cc.vv.alert && cc.vv.alert.show) {
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
} else this._onChiButton(t);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {
DiceRoll: "DiceRoll",
OpTiles: "OpTiles",
OpeningFlow: "OpeningFlow"
} ],
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
var n = e("DiceRoll"), a = e("OpeningFlow");
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
console.log("[ZJLAO] onLoad 场景=" + (cc.director.getScene() ? cc.director.getScene().name : "null"));
var e = this.node.getComponent(cc.Canvas);
if (null != e) {
try {
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
for (var s = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow", "DeskStyle", "Alert" ], o = 0; o < s.length; ++o) try {
null == this.getComponent(s[o]) && this.addComponent(s[o]);
} catch (e) {
console.error("[ZJLAO] 组件初始化失败 " + s[o] + ":", e && e.stack ? e.stack : e);
}
this.initView();
} catch (e) {
console.error("[ZJLAO] onLoad 初始化异常:", e && e.stack ? e.stack : e);
}
try {
this.initEventHandlers();
try {
n.setOpeningVisible(this, !1);
} catch (e) {}
} catch (e) {
console.error("[ZJLAO] initEventHandlers 异常:", e && e.stack ? e.stack : e);
}
try {
this.gameRoot.active = !0;
this.prepareRoot.active = !0;
this.prepareRoot.setSiblingIndex(this.gameRoot.getSiblingIndex() + 1);
this.initWanfaLabel();
this._isGameInProgress() && a.restore(this, this._openingHooks());
cc.vv.audioMgr.playBGM("bgFight.mp3");
} catch (e) {
console.error("[ZJLAO] onLoad 收尾异常:", e && e.stack ? e.stack : e);
}
}
},
_isGameInProgress: function() {
var e = cc.vv.gameNetMgr;
if ("begin" != e.gamestate) return !1;
for (var t = e.seats || [], i = 0; i < t.length; ++i) {
var n = t[i];
if (n) {
if (n.holds instanceof Array && n.holds.length > 0) return !0;
if (n.holdCount > 0) return !0;
}
}
return null != e.curaction || e.numOfMJ > 0;
},
initView: function() {
this._captureHoldBackFrames();
var e = this.node.getChildByName("game"), t = e.getChildByName("mjcount"), i = e.getChildByName("gamecount");
this._mjcount = t ? t.getComponent(cc.Label) : null;
this._gamecount = i ? i.getComponent(cc.Label) : null;
this._gamecount && (this._gamecount.string = "剩余" + Math.max(0, cc.vv.gameNetMgr.maxNumOfGames - cc.vv.gameNetMgr.numOfGames) + "局");
this._setCountVisible("begin" == cc.vv.gameNetMgr.gamestate);
this._updateMjCount();
for (var n = e.getChildByName("myself").getChildByName("holds"), a = 0; a < n.children.length; ++a) {
var s = n.children[a].getComponent(cc.Sprite);
this._myMJArr.push(s);
s.spriteFrame = null;
}
for (a = 0; a < this._myMJArr.length; ++a) {
var o = this._myMJArr[a].node.getComponent(cc.Button);
if (null != o) {
var r = new cc.Component.EventHandler();
r.target = this.node;
r.component = "MJGameZJLAO";
r.handler = "onMJClicked";
r.customEventData = "";
o.clickEvents = [ r ];
}
}
this._setupHandGestures();
var l = cc.view.getVisibleSize().width / 1280;
if (l < 1) {
n.scaleX *= l;
n.scaleY *= l;
}
var c = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
for (a = 0; a < c; ++a) {
var h = cc.vv.mahjongmgr.getSide(a), d = e.getChildByName(h);
if (null != d) {
this._playEfxs.push(d.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(d.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
}
}
var u = e.getChildByName("ops");
this._options = u;
this._opTpl = e.getChildByName("opTpl");
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
_setCountVisible: function(e) {
this._mjcount && (this._mjcount.node.active = !!e);
this._gamecount && (this._gamecount.node.active = !!e);
},
_updateMjCount: function() {
if (this._mjcount) {
var e = this.getComponent("MJRoom");
e && e.refreshBrickWall();
var t = e && null != e._brickRemainCount ? e._brickRemainCount : cc.vv.gameNetMgr.numOfMJ;
this._mjcount.string = "剩余" + t + "张";
}
},
hideChupai: function() {
for (var e = 0; e < this._chupaiSprite.length; ++e) this._chupaiSprite[e].node.active = !1;
},
_delayShowPrepare: function() {
var e = this;
this._pendingShowPrepare = !0;
if (!this._overClosedHooked) {
this._overClosedHooked = !0;
this.node.on("game_over_popup_closed", function() {
e._pendingShowPrepare = !1;
a.end(e, {
clear: function() {
e._clearOpeningTable();
}
});
if (!cc.vv.mahjongmgr || !cc.vv.mahjongmgr.is2Player()) {
e.gameRoot && (e.gameRoot.active = !0);
e.prepareRoot && (e.prepareRoot.active = !0);
}
});
}
},
initEventHandlers: function() {
var e = cc.vv.gameNetMgr;
if ("begin" == e.gamestate && e.seats) {
for (var t = !1, i = 0; i < e.seats.length; ++i) {
var s = e.seats[i];
if (s && s.holds instanceof Array && s.holds.length > 0) {
t = !0;
break;
}
}
if (t) {
var o = this.node;
this.scheduleOnce(function() {
if (cc.isValid(o)) {
o.emit("game_num", {
detail: e.numOfGames
});
o.emit("mj_count", {
detail: null
});
o.emit("game_start", {
detail: null
});
if (e.curaction) {
var t = e.curaction;
e.curaction = null;
o.emit("game_action", {
detail: t
});
}
}
}, 0);
}
}
var r = this;
this.node.on("game_start", function(e) {
a.start(r, r._openingHooks(), e);
});
this.node.on("game_begin", function() {
a.begin(r, {
before: function() {
try {
r.onGameBeign();
} catch (e) {
console.error("[ZJLAO] onGameBeign error:", e);
}
},
clear: function() {
r._clearOpeningTable();
}
});
});
this.node.on("game_chupai", function(e) {
if (e = e.detail) {
r.hideChupai();
e.last != cc.vv.gameNetMgr.seatIndex && r.initMopai(e.last, null);
cc.vv.replayMgr.isReplay() || e.turn == cc.vv.gameNetMgr.seatIndex || r.initMopai(e.turn, -1);
}
});
this.node.on("game_mopai", function(e) {
if (e = e.detail) {
var t = e.pai;
0 == cc.vv.gameNetMgr.getLocalIndex(e.seatIndex) ? r.initMahjongs(!0) : cc.vv.replayMgr.isReplay() ? r.initMopai(e.seatIndex, t) : r.initMopai(e.seatIndex, -1);
}
});
this.node.on("game_action", function(e) {
r.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t);
0 == i && r.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
r.initMopai(t, e.pai);
r.revealOtherHolds(t, e.holds, e.pai);
e.zimo ? r.playEfx(i, "play_zimo") : r.playEfx(i, "play_hu");
cc.vv.mahjongmgr.playRandSFX(e.zimo ? "zimo" : "hu", e.zimo ? 2 : 3);
});
this.node.on("mj_count", function() {
if (!n.isPlaying()) {
r._setCountVisible("begin" == cc.vv.gameNetMgr.gamestate);
r._updateMjCount();
}
});
this.node.on("game_num", function() {
r._gamecount.string = "剩余" + Math.max(0, cc.vv.gameNetMgr.maxNumOfGames - cc.vv.gameNetMgr.numOfGames) + "局";
});
this.node.on("game_over", function(e) {
r.hideChiPanel();
r.revealAllOtherHolds(e.detail);
r.gameRoot && (r.gameRoot.active = !0);
r._delayShowPrepare();
});
this.node.on("game_chupai_notify", function(e) {
r.hideChupai();
r.hideOptions();
var t = e.detail;
if (t && t.seatData) {
var i = t.seatData;
i.seatindex == cc.vv.gameNetMgr.seatIndex || null != i.userid && i.userid == cc.vv.userMgr.userId ? r.initMahjongs() : r.initOtherMahjongs(i);
r.showChupai();
var n = cc.vv.mahjongmgr.getAudioURLByMJID(t.pai);
cc.vv.audioMgr.playSFX(n);
}
});
this.node.on("peng_notify", function(e) {
r.hideChupai();
var t = e.detail;
console.log("[peng_notify] seatData.userid=", t.userid, "seatindex=", t.seatindex, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
var i = t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId;
console.log("[peng_notify] selfId=", cc.vv.userMgr.userId, "seatIndex=", cc.vv.gameNetMgr.seatIndex, "isSelf=", i);
i ? r.initMahjongs(!1, t) : r.initOtherMahjongs(t);
var n = r.getLocalIndex(t.seatindex);
r.playEfx(n, "play_peng");
cc.vv.mahjongmgr.playRandSFX("peng", 5);
r.hideOptions();
});
this.node.on("gang_notify", function(e) {
r.hideChupai();
var t = (e = e.detail).seatData, i = e.gangtype;
console.log("[gang_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? r.initMahjongs(!1, t) : r.initOtherMahjongs(t);
var n = r.getLocalIndex(t.seatindex);
if ("wangang" == i) {
r.playEfx(n, "play_guafeng");
cc.vv.audioMgr.playSFX("guafeng.mp3");
} else {
r.playEfx(n, "play_xiayu");
cc.vv.audioMgr.playSFX("rain.mp3");
}
r.hideOptions();
});
this.node.on("chi_notify", function(e) {
r._chiJustSent = !1;
r.hideChupai();
var t = e.detail;
console.log("[chi_notify] seatData.userid=", t.userid, "holds=", "object" == typeof t.holds ? t.holds.length + ":" + JSON.stringify(t.holds) : t.holds);
t.seatindex == cc.vv.gameNetMgr.seatIndex || null != t.userid && t.userid == cc.vv.userMgr.userId ? r.initMahjongs(!1, t) : r.initOtherMahjongs(t);
var i = r.getLocalIndex(t.seatindex);
r.playEfx(i, "play_chi");
cc.vv.mahjongmgr.playRandSFX("chi", 4);
r.hideOptions();
});
cc.vv.gameNetMgr.dataEventHandler = this.node;
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
var r, l = this;
if (o.gangpai) r = o.gangpai.map(function(e) {
var t = l._buildOpTiles([ e, e, e ]);
t.opPai = e;
return t;
}); else if ("btnPeng" == e) {
var c = l._buildOpTiles([ t, t ]);
c.push(t);
r = [ c.sort(function(e, t) {
return e - t;
}) ];
} else r = [ [ t ] ];
var h = null;
"btnGang" == e ? h = function(e) {
cc.vv.net.send("gang", null != e.opPai ? e.opPai : e[0]);
l.hideOptions();
} : "btnPeng" == e ? h = function() {
cc.vv.net.send("peng");
l.hideOptions();
} : "btnHu" == e && (h = function() {
cc.vv.net.send("hu");
l.hideOptions();
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
var l = t[r];
l && l.length >= 3 && o.push([ l[0], l[1], l[2] ].sort(function(e, t) {
return e - t;
}));
}
!o.length && null != e && e >= 0 && o.push([ e ]);
var c = this;
this._showOpTiles(s, o, function(e) {
e.length >= 3 && c._sendChi(e);
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
var l = e[n];
if ((i[l] || 0) - (o[l] || 0) > 0) {
o[l] = (o[l] || 0) + 1;
r.push(l);
} else {
for (var c = l, h = 0; h < s.length; ++h) {
var d = s[h];
if ((i[d] || 0) - (o[d] || 0) > 0) {
o[d] = (o[d] || 0) + 1;
c = d;
break;
}
}
r.push(c);
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
var s = this._opTpl;
s && !cc.isValid(s) && (s = null);
var o = [];
if (s) for (var r = 0; r < s.childrenCount; ++r) {
var l = s.children[r];
"plate" != l.name && o.push(l);
}
var c = 55, h = 84, d = 47;
if (o.length >= 2) {
o[0].width > 0 && (c = o[0].width);
o[0].height > 0 && (h = o[0].height);
d = o[1].x - o[0].x;
}
var u = 8, g = s ? s.getChildByName("plate") : null;
if (g && o.length >= 1 && g.width > 0) {
var v = (g.width - (d * (o.length - 1) + c)) / 2;
v > 0 && (u = v);
}
for (var _ = g && g.height > 0 ? g.height : 0, f = [], m = 0; m < t.length; ++m) {
var p = t[m].length;
f.push({
w: d * (p - 1) + c + 2 * u,
h: _ > 0 ? _ : h + 12
});
}
var b = [];
for (m = 0; m < t.length; m += 2) {
var C = t.slice(m, m + 2), y = f.slice(m, m + 2), S = 0;
for (r = 0; r < y.length; ++r) S += y[r].w;
S += 14 * (y.length - 1);
b.push({
groups: C,
plates: y,
w: S
});
}
for (var N = h + 12, B = 150 + N / 2, M = N + 10, w = 0; w < b.length; ++w) for (var T = b[w], x = -T.w / 2, I = B + w * M, P = 0; P < T.groups.length; ++P) {
var A = T.groups[P], L = T.plates[P], R = new cc.Node("grp");
a.addChild(R);
R.setContentSize(L.w, L.h);
R.setPosition(x + L.w / 2, I);
var k = o.length >= A.length && A.length > 0;
if (!k) {
var O = R.addComponent(cc.Graphics);
O.roundRect(-L.w / 2, -L.h / 2, L.w, L.h, 6);
O.fillColor = cc.color(0, 0, 0, 150);
O.fill();
O.strokeColor = cc.color(255, 200, 90, 220);
O.lineWidth = 2;
O.stroke();
}
var F = -(d * (A.length - 1) + c) / 2 + c / 2;
if (k) {
var j = cc.instantiate(s);
j.active = !0;
R.addChild(j);
var E = [];
for (r = 0; r < j.childrenCount; ++r) {
var D = j.children[r];
"plate" != D.name && E.push(D);
}
var H = o[0].x, G = o[A.length - 1].x, z = (H + G) / 2;
j.setPosition(-z, 0);
var J = j.getChildByName("plate");
if (J) {
J.width = G - H + c + 2 * u;
J.x = z;
}
for (var U = 0; U < E.length; ++U) {
(q = E[U]).active = U < A.length;
if (q.active) {
if (Y = q.getComponent(cc.Sprite)) {
var V = q.width, W = q.height;
Y.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", A[U]);
V > 0 && W > 0 && q.setContentSize(V, W);
}
this._isCaishenPai(A[U]) && (q.color = cc.color(255, 208, 90));
this._setOpCaishenCorner(q, A[U]);
}
}
} else for (U = 0; U < A.length; ++U) {
var Y, q = new cc.Node("t");
R.addChild(q);
(Y = q.addComponent(cc.Sprite)).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", A[U]);
Y.sizeMode = cc.Sprite.SizeMode.CUSTOM;
q.setContentSize(c, h);
q.setPosition(F, 0);
this._isCaishenPai(A[U]) && (q.color = cc.color(255, 208, 90));
this._setOpCaishenCorner(q, A[U]);
F += d;
}
i && function(e, t) {
R.on(cc.Node.EventType.TOUCH_END, function(e) {
i(t);
e && e.stopPropagation();
});
}(0, A);
x += L.w + 14;
}
}
}
},
_sendChi: function(e) {
if (!e || e.length < 3) this.hideOptions(); else {
var t = e.slice().sort(function(e, t) {
return e - t;
});
cc.vv.net.send("chi", t);
this.hideOptions();
}
},
_onChiButton: function(e) {
var t = e && e.chipai ? e.chipai : [];
if (t.length) if (1 != t.length) {
for (var i = [], n = 0; n < t.length; ++n) {
var a = t[n];
!a || a.length < 3 || i.push({
pais: a.slice().sort(function(e, t) {
return e - t;
}),
type: "chi",
pai: e.pai
});
}
i.length && this.showChiPanel(i);
} else this._sendChi(t[0]);
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
var i = this._playEfxs[e], n = i ? i.node : null;
if (null == n) {
var a = this.node.getChildByName("game"), s = cc.vv.mahjongmgr.getSide(e), o = a ? a.getChildByName(s) : null;
if (n = o ? o.getChildByName("play_efx") : null) {
i = n.getComponent(cc.Animation);
this._playEfxs[e] = i;
}
}
if (null != n) {
n.active = !0;
i && i.play(t);
if (cc.vv && cc.vv.mahjongmgr) {
var r = null;
"play_hu" == t ? r = "mj_hu" : "play_zimo" == t ? r = "mj_zimo" : "play_chi" == t ? r = "mj_chi" : "play_peng" == t ? r = "mj_peng" : "play_guafeng" != t && "play_xiayu" != t && "play_gang" != t || (r = "mj_gang");
r && cc.vv.mahjongmgr.playSpineEfx(n, r);
}
}
},
_openingHooks: function() {
var e = this;
return {
clear: function() {
e._clearOpeningTable();
},
info: function() {
n.setOpeningVisible(e, !0);
e._setCountVisible(!0);
e._updateMjCount();
},
render: function(t) {
e.onGameBeign(!0, t && t.detail);
},
deal: function() {
e._playDealAnim && e._playDealAnim();
},
caishen: function() {
e.initCaishenTip();
}
};
},
_clearOpeningTable: function() {
for (var e = 0; e < this._myMJArr.length; ++e) {
var t = this._myMJArr[e];
if (null != t && null != t.node) {
t.node.stopAllActions();
t.node.mjId = null;
t.spriteFrame = null;
t.node.active = !1;
t.node.y = 0;
}
}
var i = this.node.getChildByName("game"), a = i ? i.getChildByName("caishenTip") : null;
a && (a.active = !1);
var s = this.getComponent("MJRoom") || this.node.getComponent("MJRoom");
s && s.clearOpeningTable && s.clearOpeningTable();
this._setCountVisible(!1);
n.setOpeningVisible(this, !1);
},
onGameBeign: function() {
if (this._overHideCb) {
this.unschedule(this._overHideCb);
this._overHideCb = null;
}
this._pendingShowPrepare = !1;
for (var e = 0; e < this._playEfxs.length; ++e) this._playEfxs[e] && this._playEfxs[e].node && (this._playEfxs[e].node.active = !1);
this.hideChupai();
this.hideOptions();
var t = this.node.getChildByName("game"), i = t.getChildByName("huanpaiinfo");
null != i && (i.active = !1);
var a = [ "right", "up", "left" ];
for (e = 0; e < a.length; ++e) {
var s = t.getChildByName(a[e]);
if (null != s) if (cc.vv.mahjongmgr.getLocalIndexBySlot(e + 1) < 0) s.active = !1; else {
s.active = !0;
for (var o = s.getChildByName("holds"), r = 0; r < o.childrenCount; ++r) o.children[r].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!0);
var l = cc.vv.gameNetMgr.seats;
for (var e in l) {
var c = l[e];
if (0 != cc.vv.gameNetMgr.getLocalIndex(e)) {
this.initOtherMahjongs(c);
("number" == typeof c.holds ? c.holds : c.holds && c.holds.length || c.holdCount || 0) > 0 && (e == cc.vv.gameNetMgr.turn ? this.initMopai(e, -1) : this.initMopai(e, null));
}
}
this.showChupai();
if (null != cc.vv.gameNetMgr.curaction) {
this.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
n.setOpeningVisible(this, !0);
}
},
_playDealAnim: function() {
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, s) {
if (null != a && 0 != n.length) {
var o = a.convertToNodeSpaceAR(e);
n.sort(s);
for (var r = 0; r < n.length; ++r) {
var l = n[r], c = l.x, h = l.y, d = l.opacity;
t.push({
node: l,
x: c,
y: h,
op: d
});
l.setPosition(o);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(c, h)), cc.fadeTo(.15, d))));
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
for (var l = this.node.getChildByName("game"), c = cc.vv.gameNetMgr.seats || [], h = 0; h < c.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var u = cc.vv.mahjongmgr.getSide(d), g = l ? l.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
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
var n = cc.vv.gameNetMgr.getLocalIndex(e), a = cc.vv.mahjongmgr.getSide(n), s = cc.vv.mahjongmgr.getFoldPre(n), o = this.node.getChildByName("game").getChildByName(a).getChildByName("holds"), r = this.getMJIndex(a, 13), l = o.children[r];
if (null != l) {
if ("up" != a) {
l.scaleX = 1;
l.scaleY = 1;
}
if (null == t) l.active = !1; else if (t >= 0) {
l.active = !0;
l.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(s, t);
if (0 == n) {
var c = cc.vv.gameNetMgr.conf || {}, h = c.caishen >= 0 && t == c.caishen || null != c.caishen2 && c.caishen2 >= 0 && t == c.caishen2;
i(l, h);
var d = l.getChildByName("csCorner");
d && (d.active = h);
}
} else if (null != t) {
l.active = !0;
l.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(a);
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), s = 0; s < n.childrenCount; ++s) {
var o = n.children[s];
if ("up" != i) {
o.scaleX = 1;
o.scaleY = 1;
}
o.getComponent(cc.Sprite).spriteFrame = a;
}
},
_captureHoldBackFrames: function() {
if (!this._holdBackFrames) {
this._holdBackFrames = {};
var e = this.node.getChildByName("game");
if (null != e) for (var t = [ "myself", "up", "right", "left" ], i = 0; i < t.length; ++i) {
var n = e.getChildByName(t[i]), a = n ? n.getChildByName("holds") : null;
if (null != a && 0 !== a.childrenCount) {
var s = a.children[0].getComponent(cc.Sprite);
s && s.spriteFrame && (this._holdBackFrames[t[i]] = s.spriteFrame);
}
}
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = !!e.hued, n = cc.vv.mahjongmgr.getSide(t), a = this.node.getChildByName("game"), s = a ? a.getChildByName(n) : null, o = s ? s.getChildByName("holds") : null;
if (null != o) {
var r = e.chis || [], l = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + r.length;
l *= 3;
for (var c = 0; c < l; ++c) {
var h = this.getMJIndex(n, c);
null != o.children[h] && (o.children[h].active = !1);
}
var d = cc.vv.mahjongmgr.getFoldPre(t), u = this.sortHolds(e);
if (null != u && "object" == typeof u && null != u.length && 0 !== u.length) {
for (c = 0; c < u.length; ++c) {
h = this.getMJIndex(n, c + l);
if (null != o.children[h]) {
var g = o.children[h].getComponent(cc.Sprite);
if (null != g) {
g.node.active = !0;
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(d, u[c]);
if ("up" == n) {
g.node.scaleX = 1;
g.node.scaleY = 1;
}
}
}
}
this._hideUnusedHolds(n, o, l + u.length);
} else {
var v = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (c = l; c < l + v; ++c) {
h = this.getMJIndex(n, c);
var _ = o.children[h];
if (null != _) {
_.active = !0;
var f = this._holdBackFrames ? this._holdBackFrames[n] : null, m = _.getComponent(cc.Sprite);
f && m && (m.spriteFrame = f);
if ("up" == n) {
_.scaleX = 1;
_.scaleY = i ? 1 : -1;
}
}
}
this._hideUnusedHolds(n, o, l + v);
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
revealOtherHolds: function(e, t, i) {
if (t && "object" == typeof t && null != t.length && 0 !== t.length) {
var n = cc.vv.gameNetMgr.getLocalIndex(e);
if (0 != n) {
var a = cc.vv.mahjongmgr.getSide(n);
if ("up" == a) {
var s = this.node.getChildByName("game"), o = s ? s.getChildByName(a) : null, r = o ? o.getChildByName("holds") : null;
if (null != r) {
var l = t.slice();
l.length < 14 && null != i && i >= 0 && l.push(i);
var c = cc.vv.gameNetMgr.seats[e];
if (c) {
var h = c.holds;
c.holds = l;
this.initOtherMahjongs(c);
c.holds = h;
for (var d = 0; d < r.childrenCount; ++d) {
var u = r.children[d];
if (u) {
u.scaleX = 1;
u.scaleY = 1;
}
}
}
}
}
}
}
},
revealAllOtherHolds: function(e) {
if (e && "object" == typeof e && null != e.length) for (var t = 0; t < e.length; ++t) {
var i = e[t];
i && null != i.seatindex && 0 != cc.vv.gameNetMgr.getLocalIndex(i.seatindex) && i.holds && "object" == typeof i.holds && null != i.holds.length && 0 !== i.holds.length && this.revealOtherHolds(i.seatindex, i.holds, null);
}
},
sortHolds: function(e, t) {
var i = e.holds;
if (null == i || "object" != typeof i || null == i.length) return null;
var n = null, a = (i = i.slice()).length;
!t || 2 != a && 5 != a && 8 != a && 11 != a && 14 != a || (n = i.pop());
for (var s = cc.vv.gameNetMgr.conf, o = s ? s.caishen : -1, r = s ? s.caishen2 : -1, l = [], c = [], h = 0; h < i.length; ++h) {
var d = i[h];
o >= 0 && d == o || null != r && r >= 0 && d == r ? l.push(d) : c.push(d);
}
cc.vv.mahjongmgr.sortMJ(c);
i.length = 0;
for (var u = 0; u < l.length; ++u) i.push(l[u]);
for (var g = 0; g < c.length; ++g) i.push(c[g]);
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
var l = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), c = this._myMJArr[o], h = c ? c.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", o, "holds.length=", n.length, "startSlot=", o, "endSlot=", o + n.length - 1);
for (var d = [], u = 0; u < n.length; ++u) {
var g = n[u];
if (null == (_ = this._myMJArr[u + o]) || null == _.node) {
d.push("SLOT_" + (u + o) + "=NULL");
break;
}
_.node.mjId = g;
_.node.y = 0;
var v = l && u == n.length - 1;
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
var l = r.addComponent(cc.Graphics);
l.fillColor = cc.color(18, 18, 24, 235);
l.strokeColor = cc.color(255, 200, 90, 255);
l.lineWidth = 3;
l.rect(-n / 2, -60, n, 120);
l.fill();
l.stroke();
var c = new cc.Node("cap");
c.setContentSize(n, 26);
c.setPosition(0, 37);
o.addChild(c);
var h = c.addComponent(cc.Label);
h.string = "点击组合完成操作";
h.fontSize = 22;
h.lineHeight = 26;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
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
"peng" == t.actType ? cc.vv.net.send("peng") : "gang" == t.actType ? cc.vv.net.send("gang", t.targetPai) : t.paiList && this._sendChi(t.paiList);
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
var l = r.getChildByName("btnHu");
if (l && l.active) {
s = l;
break;
}
}
}
if (a && s && cc.vv.alert && cc.vv.alert.show) {
var c = this;
cc.vv.alert.show(null, "当前可以胡牌，确定要过吗？", function() {
cc.vv.net.send("guo");
c.hideOptions();
}, !0);
return;
}
cc.vv.net.send("guo");
this.hideOptions();
}
} else this._onChiButton(t);
}
},
update: function() {},
onDestroy: function() {
console.log("onDestroy");
cc.vv && cc.vv.gameNetMgr.clear();
}
});
cc._RF.pop();
}, {
DiceRoll: "DiceRoll",
OpeningFlow: "OpeningFlow"
} ],
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
var n = e("OpTiles"), a = e("DiceRoll"), s = e("OpeningFlow");
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
_huaAreas: [],
_youjinLabels: [],
_youjinPanel: null,
_dealAnimating: !1,
_dealAnimNodes: null,
_dealAnimId: 0,
_pendingPlans: null,
_caishenPlanPanel: null,
_csTimeSprite: null,
_csTimeLabel: null,
_csTimeLeft: 0,
_csTimeTotal: 0,
_csTick: null,
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
for (var n = [ "NoticeTip", "GameOver", "PengGangs", "MJRoom", "TimePointer", "GameResult", "Chat", "Folds", "ReplayCtrl", "PopupMgr", "ReConnect", "Voice", "UserInfoShow", "DeskStyle", "Alert" ], o = 0; o < n.length; ++o) null == this.getComponent(n[o]) && this.addComponent(n[o]);
this.initView();
this.initEventHandlers();
try {
a.setOpeningVisible(this, !1);
} catch (e) {}
this.gameRoot && "game" === this.gameRoot.name || (this.gameRoot = this.node.getChildByName("game"));
this.prepareRoot && "prepare" === this.prepareRoot.name || (this.prepareRoot = this.node.getChildByName("prepare"));
this.gameRoot && (this.gameRoot.active = !1);
this.prepareRoot && (this.prepareRoot.active = !0);
this.prepareRoot && this.gameRoot && this.prepareRoot.setSiblingIndex(this.gameRoot.getSiblingIndex() + 1);
this.initWanfaLabel();
this._isGameInProgress() && s.restore(this, this._openingHooks());
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
_isGameInProgress: function() {
var e = cc.vv.gameNetMgr;
if ("begin" != e.gamestate) return !1;
for (var t = e.seats || [], i = 0; i < t.length; ++i) {
var n = t[i];
if (n) {
if (n.holds instanceof Array && n.holds.length > 0) return !0;
if (n.holdCount > 0) return !0;
}
}
return null != e.curaction || e.numOfMJ > 0;
},
_openingHooks: function() {
var e = this;
return {
clear: function() {
e._clearOpeningTable();
},
info: function() {
a.setOpeningVisible(e, !0);
e._updateMjCount && e._updateMjCount();
},
render: function(t) {
e.onGameBeign(!0, t && t.detail);
cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex && e._startCountdown();
},
deal: function() {
e._playDealAnim && e._playDealAnim();
},
caishen: function() {
e.initCaishenTip();
}
};
},
_clearOpeningTable: function() {
for (var e = 0; e < this._myMJArr.length; ++e) {
var t = this._myMJArr[e];
if (null != t && null != t.node) {
t.node.stopAllActions();
t.node.mjId = null;
t.spriteFrame = null;
t.node.active = !1;
t.node.y = 0;
}
}
var i = this.node.getChildByName("game"), n = i ? i.getChildByName("caishenTip") : null;
n && (n.active = !1);
var s = this.getComponent("MJRoom") || this.node.getComponent("MJRoom");
s && s.clearOpeningTable && s.clearOpeningTable();
a.setOpeningVisible(this, !1);
},
initView: function() {
this._captureHoldBackFrames();
var e = this;
this.scheduleOnce(function() {
var t = e.getComponent("MJRoom") || e.node.getComponent("MJRoom");
t && t.reorderBrickForZJZX && t.reorderBrickForZJZX();
}, 0);
this._selectedMJ = null;
this._chiSelect = null;
this._pendingPlans = null;
this._caishenPlanPanel && (this._caishenPlanPanel.active = !1);
this._chiHint && (this._chiHint.active = !1);
var t = this.node.getChildByName("game");
this._mjcount = t.getChildByName("mjcount").getComponent(cc.Label);
this._updateMjCount();
this._gamecount = t.getChildByName("gamecount").getComponent(cc.Label);
this._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
var i = this.node.getChildByName("infobar");
if (i) {
this._countdownLabel = i.getChildByName("countdownLabel");
this._countdownLabel && !this._countdownLabel.getComponent(cc.Label) && this._countdownLabel.addComponent(cc.Label);
}
for (var n = t.getChildByName("myself").getChildByName("holds"), a = 0; a < n.children.length; ++a) {
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
var l = cc.vv.mahjongmgr.getSide(a), c = t.getChildByName(l);
if (null != c) {
this._playEfxs.push(c.getChildByName("play_efx").getComponent(cc.Animation));
this._chupaiSprite.push(c.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
}
}
var h = t.getChildByName("ops");
this._options = h;
this._opTpl = t.getChildByName("opTpl");
if (h) for (var d = 0; d < h.childrenCount; ++d) {
var u = h.children[d];
if ("op" == u.name) {
var g = u.getComponent(cc.Sprite);
g && (g.enabled = !1);
var v = u.getChildByName("opTarget");
v && (v.active = !1);
}
}
if (h) for (var _ = 0; _ < h.childrenCount; ++_) {
var f = h.children[_];
if ("op" == f.name) {
var m = f.getChildByName("btnChi");
if (m) {
var p = m.getComponent(cc.Button);
p && 0 == p.clickEvents.length && cc.vv.utils.addClickEvent(m, this.node, "MJGameZJZX", "onOptionClicked");
}
}
}
var b = h ? h.getChildByName("New Layout") : null;
if (b) {
var C = b.getComponent(cc.Button);
C && (C.enabled = !1);
b.active = !1;
}
this.hideOptions();
this.hideChupai();
},
hideChupai: function() {
for (var e = 0; e < this._chupaiSprite.length; ++e) this._chupaiSprite[e].node.active = !1;
},
_delayShowPrepare: function() {
var e = this;
this._pendingShowPrepare = !0;
if (!this._overClosedHooked) {
this._overClosedHooked = !0;
this.node.on("game_over_popup_closed", function() {
e._pendingShowPrepare = !1;
s.end(e, {
clear: function() {
e._clearOpeningTable();
}
});
if (!cc.vv.mahjongmgr || !cc.vv.mahjongmgr.is2Player()) {
e.gameRoot && (e.gameRoot.active = !1);
e.prepareRoot && (e.prepareRoot.active = !0);
}
});
}
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
s.start(o, o._openingHooks(), e);
});
this.node.on("game_begin", function() {
s.begin(o, {
before: function() {
o.onGameBeign();
},
clear: function() {
o._clearOpeningTable();
}
});
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
} else cc.vv.replayMgr.isReplay() ? o.initMopai(e.seatIndex, t) : o.initMopai(e.seatIndex, -1);
}
});
this.node.on("game_action", function(e) {
o.showAction(e.detail);
});
this.node.on("hupai", function(e) {
var t = null != (e = e.detail).si ? e.si : e.seatindex, i = cc.vv.gameNetMgr.getLocalIndex(t);
0 == i && o.hideOptions();
cc.vv.gameNetMgr.seats[t].hued = !0;
o.initMopai(t, e.pai);
o.revealOtherHolds(t, e.holds, e.pai);
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
o._updateMjCount();
});
this.node.on("game_num", function() {
o._gamecount.string = cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
});
this.node.on("game_over", function(e) {
o.hideChiPanel();
o.hideYoujinPanel();
o.revealAllOtherHolds(e.detail);
o.gameRoot && (o.gameRoot.active = !0);
o._delayShowPrepare();
});
this.node.on("game_hua", function(e) {
var t = e.detail;
if (t) {
o.initHuaArea(t.si);
o._updateMjCount();
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
o._chiJustSent = !1;
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
addOption: function(e, t, i) {
for (var a = 0; a < this._options.childrenCount; ++a) {
var s = this._options.children[a];
if ("op" == s.name && 0 == s.active) {
s.active = !0;
var o = s.getChildByName("opTarget");
o && (o.active = !1);
var r = s.getChildByName(e);
r.active = !0;
r.pai = t;
r.gangpai = i && i.length ? i.slice() : null;
var l, c = this;
if (r.gangpai) l = r.gangpai.map(function(e) {
var t = n.build([ e, e, e ]);
t.opPai = e;
return t;
}); else if ("btnPeng" == e) {
var h = n.build([ t, t ]);
h.push(t);
l = [ h.sort(function(e, t) {
return e - t;
}) ];
} else l = [ [ t ] ];
var d = null;
"btnGang" == e ? d = function(e) {
cc.vv.net.send("gang", null != e.opPai ? e.opPai : e[0]);
c.hideOptions();
} : "btnPeng" == e ? d = function() {
cc.vv.net.send("peng");
c.hideOptions();
} : "btnHu" == e && (d = function() {
cc.vv.net.send("hu");
c.hideOptions();
});
n.show(this, r, l, d);
return;
}
}
},
addChiOption: function(e, t) {
for (var i = 0; i < this._options.childrenCount; ++i) {
var a = this._options.children[i];
if ("op" == a.name && 0 == a.active) {
a.active = !0;
var s = a.getChildByName("opTarget");
s && (s.active = !1);
var o = this.getChiButton(a);
if (o) {
o.active = !0;
o.pai = e;
o.chipai = t || null;
var r = [];
if (t && t.length) for (var l = 0; l < t.length; ++l) {
var c = t[l];
c && c.length >= 3 && r.push([ c[0], c[1], c[2] ].sort(function(e, t) {
return e - t;
}));
}
!r.length && null != e && e >= 0 && r.push([ e ]);
var h = this;
n.show(this, o, r, function(e) {
e.length >= 3 && h._sendChi(e);
});
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
var l = r.addComponent(cc.Label);
l.string = i;
l.fontSize = n || 40;
l.lineHeight = l.fontSize;
l.overflow = cc.Label.Overflow.NONE;
l.enableWrapText = !1;
l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
l.verticalAlign = cc.Label.VerticalAlign.CENTER;
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
var a = t.getChildByName("btnQiangJin");
a && (a.active = !1);
var s = t.getChildByName("btnYouJin");
s && (s.active = !1);
var o = t.getChildByName("btnYouJinGo");
o && (o.active = !1);
for (var r = 0; r < t.childrenCount; ++r) n.clear(t.children[r]);
}
}
this.hideChiPanel();
this.cancelChiSelect();
this.hideYoujinPanel();
}
},
showAction: function(e) {
if (e && e.chi && this._chiJustSent) {
this._chiJustSent = !1;
n.toast(this, "这两张不能吃,请重选");
}
this.hideCaishenPlanPanel();
this._options.active && this.hideOptions();
var t = this._options.getChildByName("New Layout");
t && (t.active = !1);
var i = !!(e && e.youjin && e.youjin.length > 0);
if (e && (e.hu || e.gang || e.peng || e.chi || e.qiangjin || i || e.youjingo)) {
this._options.active = !0;
e.hu && this.addOption("btnHu", e.pai);
e.peng && this.addOption("btnPeng", e.pai);
if (e.gang) {
var a = e.gangpai && e.gangpai.length ? e.gangpai[0] : e.pai;
this.addOption("btnGang", a, e.gangpai);
}
e.chi && this.addChiOption(e.pai, e.chipai);
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
_updateMjCount: function() {
if (this._mjcount) {
var e = this.getComponent("MJRoom") || this.node.getComponent("MJRoom");
e && e.refreshBrickWall();
var t = e && null != e._brickRemainCount ? e._brickRemainCount : cc.vv.gameNetMgr.numOfMJ;
this._mjcount.string = "剩余" + t + "张";
}
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
var l = r.addComponent(cc.Sprite);
l.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var c = o - 34, h = c >= 0 && c < 8 ? "M_" + [ "plum", "orchid", "bamboo", "chrysanthemum", "spring", "summer", "autumn", "winter" ][c] : null, d = h ? a.getSpriteFrame(h) : null;
if (null != d) l.spriteFrame = d; else {
var u = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
l.spriteFrame = u;
var g = new cc.Node("name");
r.addChild(g);
var v = g.addComponent(cc.Label);
v.string = c >= 0 && c < 8 ? [ "梅", "兰", "竹", "菊", "春", "夏", "秋", "冬" ][c] : "花";
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
var l = this.getHuaArea(e);
n.setPosition(l.x, l.y + 80);
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
for (var l = 0; l < e.length; ++l) {
var c = new cc.Node("yjItem" + l);
c.setContentSize(62, 90);
c.setPosition(51 + -i / 2 + 78 * l, -14);
n.addChild(c);
c.addComponent(cc.Button);
c.pai = e[l];
cc.vv.utils.addClickEvent(c, this.node, "MJGameZJZX", "onYoujinItemClicked");
var h = c.addComponent(cc.Sprite);
h.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", e[l]);
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
var i = this._playEfxs[e], n = i ? i.node : null;
if (null == n) {
var a = this.node.getChildByName("game"), s = cc.vv.mahjongmgr.getSide(e), o = a ? a.getChildByName(s) : null;
if (n = o ? o.getChildByName("play_efx") : null) {
i = n.getComponent(cc.Animation);
this._playEfxs[e] = i;
}
}
if (null != n) {
n.active = !0;
i && i.play(t);
if (cc.vv && cc.vv.mahjongmgr) {
var r = null;
"play_hu" == t ? r = "mj_hu" : "play_zimo" == t ? r = "mj_zimo" : "play_chi" == t ? r = "mj_chi" : "play_peng" == t ? r = "mj_peng" : "play_guafeng" != t && "play_xiayu" != t && "play_gang" != t || (r = "mj_gang");
r && cc.vv.mahjongmgr.playSpineEfx(n, r);
}
}
},
onGameBeign: function() {
if (this._overHideCb) {
this.unschedule(this._overHideCb);
this._overHideCb = null;
}
this._pendingShowPrepare = !1;
for (var e = 0; e < this._playEfxs.length; ++e) this._playEfxs[e] && this._playEfxs[e].node && (this._playEfxs[e].node.active = !1);
this.hideChupai();
this.hideOptions();
var t = this.node.getChildByName("game"), i = t.getChildByName("huanpaiinfo");
null != i && (i.active = !1);
var n = [ "right", "up", "left" ];
for (e = 0; e < n.length; ++e) {
var s = t.getChildByName(n[e]);
if (null != s) if (cc.vv.mahjongmgr.getLocalIndexBySlot(e + 1) < 0) s.active = !1; else {
s.active = !0;
for (var o = s.getChildByName("holds"), r = 0; r < o.childrenCount; ++r) o.children[r].active = !1;
}
}
if ("" != cc.vv.gameNetMgr.gamestate || 0 != cc.vv.replayMgr.isReplay()) {
this.gameRoot.active = !0;
this.prepareRoot.active = !1;
this.initMahjongs(!1);
var l = cc.vv.gameNetMgr.seats;
for (var e in l) {
var c = l[e];
if (0 != cc.vv.gameNetMgr.getLocalIndex(e)) {
this.initOtherMahjongs(c);
("number" == typeof c.holds ? c.holds : c.holds && c.holds.length || c.holdCount || 0) > 0 && (e == cc.vv.gameNetMgr.turn ? this.initMopai(e, -1) : this.initMopai(e, null));
}
}
this.initAllHuaAreas();
this.showChupai();
var h = this;
this.scheduleOnce(function() {
if (cc.isValid(h.node) && null != cc.vv.gameNetMgr.curaction) {
h.showAction(cc.vv.gameNetMgr.curaction);
cc.vv.gameNetMgr.curaction = null;
}
}, 0);
a.setOpeningVisible(this, !0);
}
},
_playDealAnim: function() {
this._cancelDealAnim();
for (var e = this.node.convertToWorldSpaceAR(cc.v2(0, 80)), t = [], i = 0, n = function(n, a, s) {
if (null != a && 0 != n.length) {
var o = a.convertToNodeSpaceAR(e);
n.sort(s);
for (var r = 0; r < n.length; ++r) {
var l = n[r], c = l.x, h = l.y, d = l.opacity;
t.push({
node: l,
x: c,
y: h,
op: d
});
l.setPosition(o);
l.opacity = 0;
l.runAction(cc.sequence(cc.delayTime(.06 * r), cc.spawn(cc.moveTo(.15, cc.v2(c, h)), cc.fadeTo(.15, d))));
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
for (var l = this.node.getChildByName("game"), c = cc.vv.gameNetMgr.seats || [], h = 0; h < c.length; ++h) {
var d = cc.vv.gameNetMgr.getLocalIndex(h);
if (0 != d) {
var u = cc.vv.mahjongmgr.getSide(d), g = l ? l.getChildByName(u) : null, v = g ? g.getChildByName("holds") : null;
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
var l = this._findMJNode(e);
if (null != l) for (var c = 0; c < this._myMJArr.length; ++c) if (l == this._myMJArr[c].node) {
if (l == this._selectedMJ) {
this.shoot(this._selectedMJ.mjId);
this._setTileY(this._selectedMJ, 0);
this._selectedMJ = null;
return;
}
null != this._selectedMJ && this._setTileY(this._selectedMJ, 0);
this._setTileY(l, 15);
this._selectedMJ = l;
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
var n = cc.vv.gameNetMgr.getLocalIndex(e), a = cc.vv.mahjongmgr.getSide(n), s = cc.vv.mahjongmgr.getFoldPre(n), o = this.node.getChildByName("game").getChildByName(a).getChildByName("holds"), r = this.getMJIndex(a, 13), l = o.children[r];
if (null != l) {
if ("up" != a) {
l.scaleX = 1;
l.scaleY = 1;
}
if (null == t) {
l.active = !1;
if (0 == n) {
var c = l.getChildByName("csCorner");
c && (c.active = !1);
}
} else if (t >= 0) {
l.active = !0;
l.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(s, t);
if (0 == n) {
var h = cc.vv.gameNetMgr.conf || {}, d = h.caishen >= 0 && t == h.caishen || null != h.caishen2 && h.caishen2 >= 0 && t == h.caishen2;
i(l, d);
var u = l.getChildByName("csCorner");
u && (u.active = d);
}
} else if (null != t) {
l.active = !0;
l.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(a);
if (0 == n) {
var g = l.getChildByName("csCorner");
g && (g.active = !1);
}
}
}
},
initEmptySprites: function(e) {
for (var t = cc.vv.gameNetMgr.getLocalIndex(e), i = cc.vv.mahjongmgr.getSide(t), n = this.node.getChildByName("game").getChildByName(i).getChildByName("holds"), a = cc.vv.mahjongmgr.getEmptySpriteFrame(i), s = 0; s < n.childrenCount; ++s) {
var o = n.children[s];
if ("up" != i) {
o.scaleX = 1;
o.scaleY = 1;
}
o.getComponent(cc.Sprite).spriteFrame = a;
}
},
_captureHoldBackFrames: function() {
if (!this._holdBackFrames) {
this._holdBackFrames = {};
var e = this.node.getChildByName("game");
if (null != e) for (var t = [ "myself", "up", "right", "left" ], i = 0; i < t.length; ++i) {
var n = e.getChildByName(t[i]), a = n ? n.getChildByName("holds") : null;
if (null != a && 0 !== a.childrenCount) {
var s = a.children[0].getComponent(cc.Sprite);
s && s.spriteFrame && (this._holdBackFrames[t[i]] = s.spriteFrame);
}
}
}
},
initOtherMahjongs: function(e) {
this._cancelDealAnim();
if (null != e) {
var t = this.getLocalIndex(e.seatindex);
if (0 != t) {
var i = !!e.hued, n = cc.vv.mahjongmgr.getSide(t), a = this.node.getChildByName("game"), s = a ? a.getChildByName(n) : null, o = s ? s.getChildByName("holds") : null;
if (null != o) {
var r = e.chis || [], l = (e.pengs ? e.pengs.length : 0) + (e.angangs ? e.angangs.length : 0) + (e.diangangs ? e.diangangs.length : 0) + (e.wangangs ? e.wangangs.length : 0) + r.length;
l *= 3;
for (var c = 0; c < l; ++c) {
var h = this.getMJIndex(n, c);
null != o.children[h] && (o.children[h].active = !1);
}
var d = cc.vv.mahjongmgr.getFoldPre(t), u = this.sortHolds(e);
if (null != u && "object" == typeof u && null != u.length && 0 !== u.length) {
for (c = 0; c < u.length; ++c) {
h = this.getMJIndex(n, c + l);
if (null != o.children[h]) {
var g = o.children[h].getComponent(cc.Sprite);
if (null != g) {
g.node.active = !0;
g.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(d, u[c]);
if ("up" == n) {
g.node.scaleX = 1;
g.node.scaleY = 1;
}
}
}
}
this._hideUnusedHolds(n, o, l + u.length);
} else {
var v = "number" == typeof e.holds ? e.holds : e.holdCount || 0;
for (c = l; c < l + v; ++c) {
h = this.getMJIndex(n, c);
var _ = o.children[h];
if (null != _) {
_.active = !0;
var f = this._holdBackFrames ? this._holdBackFrames[n] : null, m = _.getComponent(cc.Sprite);
f && m && (m.spriteFrame = f);
if ("up" == n) {
_.scaleX = 1;
_.scaleY = i ? 1 : -1;
}
}
}
this._hideUnusedHolds(n, o, l + v);
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
revealOtherHolds: function(e, t, i) {
if (t && "object" == typeof t && null != t.length && 0 !== t.length) {
var n = cc.vv.gameNetMgr.getLocalIndex(e);
if (0 != n) {
var a = cc.vv.mahjongmgr.getSide(n);
if ("up" == a) {
var s = this.node.getChildByName("game"), o = s ? s.getChildByName(a) : null, r = o ? o.getChildByName("holds") : null;
if (null != r) {
var l = t.slice();
l.length < 14 && null != i && i >= 0 && l.push(i);
var c = cc.vv.gameNetMgr.seats[e];
if (c) {
var h = c.holds;
c.holds = l;
this.initOtherMahjongs(c);
c.holds = h;
for (var d = 0; d < r.childrenCount; ++d) {
var u = r.children[d];
if (u) {
u.scaleX = 1;
u.scaleY = 1;
}
}
}
}
}
}
}
},
revealAllOtherHolds: function(e) {
if (e && "object" == typeof e && null != e.length) for (var t = 0; t < e.length; ++t) {
var i = e[t];
i && null != i.seatindex && 0 != cc.vv.gameNetMgr.getLocalIndex(i.seatindex) && i.holds && "object" == typeof i.holds && null != i.holds.length && 0 !== i.holds.length && this.revealOtherHolds(i.seatindex, i.holds, null);
}
},
sortHolds: function(e, t) {
var i = e.holds;
if (null == i || "object" != typeof i || null == i.length) return null;
var n = null, a = (i = i.slice()).length;
!t || 2 != a && 5 != a && 8 != a && 11 != a && 14 != a || (n = i.pop());
for (var s = cc.vv.gameNetMgr.conf, o = s ? s.caishen : -1, r = s ? s.caishen2 : -1, l = [], c = [], h = 0; h < i.length; ++h) {
var d = i[h];
o >= 0 && d == o || null != r && r >= 0 && d == r ? l.push(d) : c.push(d);
}
cc.vv.mahjongmgr.sortMJ(c);
i.length = 0;
for (var u = 0; u < l.length; ++u) i.push(l[u]);
for (var g = 0; g < c.length; ++g) i.push(c[g]);
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
var l = !!e && (2 == n.length || 5 == n.length || 8 == n.length || 11 == n.length || 14 == n.length), c = this._myMJArr[o], h = c ? c.node.x : 0;
console.log("[initMahjongs] _myMJArr.length=", this._myMJArr.length, "lackingNum=", o, "holds.length=", n.length, "startSlot=", o, "endSlot=", o + n.length - 1);
for (var d = cc.vv.gameNetMgr.conf, u = d ? d.caishen : -1, g = d ? d.caishen2 : -1, v = [], _ = 0; _ < n.length; ++_) {
var f = n[_];
if (null == (b = this._myMJArr[_ + o]) || null == b.node) {
v.push("SLOT_" + (_ + o) + "=NULL");
break;
}
b.node.mjId = f;
b.node.y = 0;
var m = l && _ == n.length - 1;
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
var l = r.addComponent(cc.Graphics);
l.fillColor = cc.color(18, 18, 24, 235);
l.strokeColor = cc.color(255, 200, 90, 255);
l.lineWidth = 3;
l.rect(-n / 2, -60, n, 120);
l.fill();
l.stroke();
var c = new cc.Node("cap");
c.setContentSize(n, 26);
c.setPosition(0, 37);
o.addChild(c);
var h = c.addComponent(cc.Label);
h.string = "点击组合完成操作";
h.fontSize = 22;
h.lineHeight = 26;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
c.color = cc.color(255, 225, 150);
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
"peng" == t.actType ? cc.vv.net.send("peng") : "gang" == t.actType ? cc.vv.net.send("gang", t.targetPai) : t.paiList && this._sendChi(t.paiList);
this.hideChiPanel();
this.hideOptions();
}
},
_sendChi: function(e) {
if (!e || e.length < 3) this.hideOptions(); else {
var t = e.slice().sort(function(e, t) {
return e - t;
});
cc.vv.net.send("chi", t);
this.hideOptions();
}
},
_onChiButton: function(e) {
var t = e && e.chipai ? e.chipai : [];
if (t.length) if (1 != t.length) {
for (var i = [], n = 0; n < t.length; ++n) {
var a = t[n];
!a || a.length < 3 || i.push({
pais: a.slice().sort(function(e, t) {
return e - t;
}),
type: "chi",
pai: e.pai
});
}
i.length && this.showChiPanel(i);
} else this._sendChi(t[0]);
},
onOptionClicked: function(e) {
var t = this._findBtnNode(e);
console.log("[ZJZX] onOptionClicked btn=" + (t ? t.name : "null"));
if (null != t) {
var i = t.name;
if ("btnChi" != i) {
this.cancelChiSelect();
if ("btnPeng" == i) cc.vv.net.send("peng"); else if ("btnGang" == i) {
var a = t.gangpai && t.gangpai.length ? t.gangpai : [ t.pai ];
if (a.length > 1) {
n.flash(t);
return;
}
cc.vv.net.send("gang", a[0]);
} else if ("btnHu" == i || "btnQiangJin" == i) {
this.hideOptions();
cc.vv.net.send("hu");
} else {
if ("btnYouJin" == i) {
var s = cc.vv.gameNetMgr.curaction, o = s && s.youjin ? s.youjin : this._lastYoujin || [];
this._lastYoujin = o;
this.showYoujinPanel(o);
return;
}
if ("btnYouJinGo" == i) {
cc.vv.net.send("youjin_go");
this.hideOptions();
} else if ("btnGuo" == i) {
var r = this._options.getChildByName("btnHu");
if (r && r.active && cc.vv.alert && cc.vv.alert.show) {
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
} else this._onChiButton(t);
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
var i = e.getChildByName("timeSprite");
if (i) {
this._csTimeSprite = i.getComponent(cc.Sprite);
if (this._csTimeSprite) {
this._csTimeSprite.type = cc.Sprite.Type.SIMPLE;
this._csTimeSprite.fillRange = 1;
}
var n = i.getChildByName("time");
n && (this._csTimeLabel = n.getComponent(cc.Label));
}
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
var l = s.getChildByName("btnSetCaishen");
l && (l.active = !0);
s.active = !0;
var c = s.parent;
c && s.setSiblingIndex(c.childrenCount - 1);
var h = this._pendingPlans || [];
if (0 !== h.length) {
var d = h[0];
this.startCaishenPlanCountdown();
var u = s.getChildByName("taiLabel");
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
startCaishenPlanCountdown: function() {
this.stopCaishenPlanCountdown();
var e = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.chupaiTimeout : 15;
(null == e || e <= 0) && (e = 15);
e = Math.max(3, e - 1);
this._csTimeTotal = e;
this._csTimeLeft = e;
this._refreshCaishenPlanTime();
var t = this;
this._csTick = function() {
t._csTimeLeft -= .2;
if (t._csTimeLeft <= 0) {
t._csTimeLeft = 0;
t._refreshCaishenPlanTime();
t.stopCaishenPlanCountdown();
t._caishenPlanPanel && t._caishenPlanPanel.active && t.onSetCaishenClicked();
} else t._refreshCaishenPlanTime();
};
this.schedule(this._csTick, .2);
},
stopCaishenPlanCountdown: function() {
if (this._csTick) {
this.unschedule(this._csTick);
this._csTick = null;
}
},
_refreshCaishenPlanTime: function() {
var e = Math.max(0, this._csTimeLeft);
this._csTimeLabel && (this._csTimeLabel.string = "" + Math.ceil(e));
},
hideCaishenPlanPanel: function() {
this.stopCaishenPlanCountdown();
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
}, {
DiceRoll: "DiceRoll",
OpTiles: "OpTiles",
OpeningFlow: "OpeningFlow"
} ],
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
try {
if (cc.vv.http && cc.vv.http.sendRequest) {
var e = cc.director.getScene() ? cc.director.getScene().name : "";
cc.vv.http.sendRequest("/dbg_log", {
m: "[mjroom] onLoad scene=" + e
}, null);
}
} catch (e) {}
for (var t = [ "initView", "initSeats", "initEventHandlers", "initStartButton", "applyCustomBtnSkins", "initBrickWall" ], i = 0; i < t.length; ++i) try {
this[t[i]]();
} catch (e) {
console.error("[MJRoom] " + t[i] + " 异常:", e && e.stack ? e.stack : e);
}
try {
this.initBrickHandlers();
} catch (e) {
console.error("[MJRoom] initBrickHandlers 异常:", e);
}
this.initNetExitListeners();
var n = this;
this.scheduleOnce(function() {
n.showSeatsInWaiting();
}, 0);
this.scheduleOnce(function() {
if (cc.isValid(n.node)) try {
n.initSeats();
} catch (e) {
console.error("[MJRoom] 延迟刷新座位异常:", e && e.stack ? e.stack : e);
}
}, 1);
this.node.on("game_over_popup_closed", function() {
n.flushTotalScorePanel();
cc.vv.mahjongmgr && cc.vv.mahjongmgr.is2Player() || n.scheduleOnce(function() {
n.showSeatsInWaiting(!0);
}, 0);
});
}
},
showSeatsInWaiting: function(e) {
if (cc.vv && cc.vv.gameNetMgr) {
var t = cc.vv.gameNetMgr, i = t.seats ? t.seats[t.seatIndex] : null, n = !!(i && i.holds && i.holds.length > 0);
if (e || "begin" != t.gamestate || !(n || t.numOfMJ > 0)) {
var a = this.node.getChildByName("game");
if (null != a) {
a.active || (a.active = !0);
for (var s = [ "myself", "up", "right", "left" ], o = 0; o < s.length; ++o) {
var r = a.getChildByName(s[o]);
if (null != r) {
var l = r.getChildByName("holds");
if (null != l) for (var c = 0; c < l.childrenCount; ++c) l.children[c].active = !1;
}
}
this._brickBuilt && this.refreshBrickWall();
this.initSeats();
null == this._startBtn && this.initStartButton();
this.updateStartBtnState();
!this._startBtn || this._startBtn.active || i && i.ready || (this._startBtn.active = !0);
}
}
}
},
initView: function() {
var e = this.node.getChildByName("prepare"), t = this.node.getChildByName("game");
e && t && e.getSiblingIndex() < t.getSiblingIndex() && e.setSiblingIndex(t.getSiblingIndex());
var i = e.getChildByName("btnBack");
if (i) {
var n = i.getComponent(cc.Button);
n && 0 == n.clickEvents.length && cc.vv.utils.addClickEvent(i, this.node, "MJRoom", "onBtnBackClicked");
}
var a = e.getChildByName("seats");
if (a) for (var s = 0; s < a.children.length; ++s) this._seats.push(a.children[s].getComponent("Seat"));
this.refreshBtns();
this.lblRoomNo = cc.find("Canvas/infobar/Z_room_txt/New Label").getComponent(cc.Label);
this._timeLabel = cc.find("Canvas/infobar/time").getComponent(cc.Label);
var o = cc.vv.gameNetMgr.roomId;
this.lblRoomNo.string = "房号:" + o;
var r = this.node.getChildByName("game"), l = cc.vv.mahjongmgr.is2Player() ? [ "myself", "up" ] : [ "myself", "right", "up", "left" ];
for (s = 0; s < l.length; ++s) {
var c = r.getChildByName(l[s]);
if (null != c) {
var h = c.getChildByName("seat");
null != h && this._seats2.push(h.getComponent("Seat"));
}
}
0 == this._seats.length && (this._seats = this._seats2);
var d = cc.find("Canvas/prepare/btnWeichat");
d && cc.vv.utils.addClickEvent(d, this.node, "MJRoom", "onBtnWeichatClicked");
var u = cc.find("Canvas/typeTitle");
if (null != u) {
for (s = 0; s < u.children.length; ++s) u.children[s].active = !1;
if (cc.vv.gameNetMgr.conf) {
var g = cc.vv.gameNetMgr.conf.type;
null != g && "" != g || (g = "xzdd");
var v = u.getChildByName(g);
v && (v.active = !0);
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
var t = cc.vv.gameNetMgr, i = t.seats, n = i ? i[t.seatIndex] : null, a = !!(n && n.holds && n.holds.length > 0), s = "begin" != t.gamestate || !a && !t.numOfMJ, o = !(!n || !n.ready);
e.active = s && !o;
var r = e.getComponent(cc.Button);
r && (r.interactable = !0);
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
this._brickRemainCount = 0;
this._brickZJLao = !(!cc.vv.gameNetMgr || !cc.vv.gameNetMgr.conf || "zj_lao" != cc.vv.gameNetMgr.conf.type);
t.zIndex = -1;
this._brickDrawable = [];
this._brick111 = !(!t.getChildByName("LT36") || !t.getChildByName("RT37"));
if (this._brick111) {
for (var i = this._brickDrawable, n = [], a = 0; a < 37; ++a) {
var s = t.getChildByName("LT" + (a < 10 ? "0" : "") + a);
s && n.push(s);
}
var o = [];
for (a = 0; a < n.length; a += 2) {
var r = [ n[a] ];
n[a + 1] && r.push(n[a + 1]);
o.push(r);
}
o.reverse();
for (a = 0; a < o.length; ++a) {
o[a].sort(function(e, t) {
return t.y - e.y;
});
for (var l = 0; l < o[a].length; ++l) i.push(o[a][l]);
}
for (a = 0; a < 36; a += 2) {
var c = t.getChildByName("U" + (a + 1 < 10 ? "0" : "") + (a + 1)), h = t.getChildByName("U" + (a < 10 ? "0" : "") + a);
c && i.push(c);
h && i.push(h);
}
for (a = 0; a < 38; ++a) {
var d = t.getChildByName("RT" + (a < 10 ? "0" : "") + a);
d && i.push(d);
}
this._brickDead = [];
this._brickTailGone = 0;
this.refreshBrickWall();
} else {
var u = [];
for (a = 0; a < 31; ++a) {
var g = t.getChildByName("LT" + (a < 10 ? "0" : "") + a);
g && u.push(g);
}
var v = this._brickZJLao, _ = cc.vv.gameNetMgr && cc.vv.gameNetMgr.conf || {}, f = _.type || _.game_type || "", m = (cc.director.getScene() && cc.director.getScene().name || "").indexOf("zjzx") >= 0 || "zj_zx" == f || "zj4_zx" == f || "zixuancaishen" == _.playStyle, p = this._brickDrawable;
if (m) {
var b = [];
for (a = 0; a < u.length; a += 2) {
var C = [ u[a] ];
u[a + 1] && C.push(u[a + 1]);
b.push(C);
}
b.reverse();
for (a = 0; a < b.length; ++a) {
b[a].sort(function(e, t) {
return t.y - e.y;
});
for (l = 0; l < b[a].length; ++l) p.push(b[a][l]);
}
for (a = 0; a < 16; a += 2) {
var y = [], S = t.getChildByName("U" + (a < 10 ? "0" : "") + a), N = t.getChildByName("U" + (a + 1 < 10 ? "0" : "") + (a + 1));
S && y.push(S);
N && y.push(N);
y.sort(function(e, t) {
return t.y - e.y;
});
for (l = 0; l < y.length; ++l) p.push(y[l]);
}
p.length && console.log("[MJRoom] 自选麻将摸牌顺序(前8): " + p.slice(0, 8).map(function(e) {
return e.name;
}).join(" -> "));
} else if (v) {
var B = [];
for (a = 0; a < u.length; a += 2) {
var M = [ u[a] ];
u[a + 1] && M.push(u[a + 1]);
B.push(M);
}
B.reverse();
for (a = 0; a < B.length; ++a) {
B[a].sort(function(e, t) {
return t.y - e.y;
});
for (l = 0; l < B[a].length; ++l) p.push(B[a][l]);
}
for (a = 0; a < 16; a += 2) {
var w = [], T = t.getChildByName("U" + (a < 10 ? "0" : "") + a), x = t.getChildByName("U" + (a + 1 < 10 ? "0" : "") + (a + 1));
T && w.push(T);
x && w.push(x);
w.sort(function(e, t) {
return t.y - e.y;
});
for (l = 0; l < w.length; ++l) p.push(w[l]);
}
} else {
for (a = u.length - 1; a >= 0; --a) p.push(u[a]);
for (a = 0; a < 16; a += 2) {
var I = t.getChildByName("U" + (a + 1 < 10 ? "0" : "") + (a + 1)), P = t.getChildByName("U" + (a < 10 ? "0" : "") + a);
I && p.push(I);
P && p.push(P);
}
}
this._brickDead = [];
for (a = 16; a < 36; ++a) {
var A = t.getChildByName("U" + a);
A && this._brickDead.push(A);
}
for (a = 0; a < 6; ++a) {
var L = t.getChildByName("RT0" + a);
L && this._brickDead.push(L);
}
this._brickTailGone = 0;
this.refreshBrickWall();
}
} else this._brickBuilt = !1;
}
},
consumeBrickTail: function(e) {
this._brickTailGone = Math.max(0, (this._brickTailGone || 0) + (e || 1));
},
getBrickTailNode: function() {
var e = (this._brickDrawable || []).concat(this._brickDead || []), t = e.length;
if (0 === t) return null;
if (this._brick111) {
var i = t - Math.max(1, this._brickTailGone || 0);
if (i >= 0 && i < t && e[i]) return e[i];
}
for (var n = t - 1; n >= 0; --n) if (e[n] && e[n].active) return e[n];
return null;
},
resetBrickRound: function() {
if (!this._brickBuilt || !this._brickWall || !cc.isValid(this._brickWall)) try {
this.initBrickWall();
} catch (e) {
console.error("[MJRoom] 补建牌墙异常:", e && e.stack ? e.stack : e);
}
for (var e = cc.vv ? cc.vv.gameNetMgr : null, t = e && e.seats ? e.seats : [], i = 0, n = 0, a = 0; a < t.length; ++a) {
var s = t[a];
if (s) {
s.hua && s.hua.length && (i += s.hua.length);
n += s.gangs instanceof Array && s.gangs.length ? s.gangs.length : (s.angangs ? s.angangs.length : 0) + (s.diangangs ? s.diangangs.length : 0) + (s.wangangs ? s.wangangs.length : 0);
}
}
this._brickTailGone = this._brick111 ? i + n : 0;
this.refreshBrickWall();
},
clearOpeningTable: function() {
var e = this.node ? this.node.getChildByName("game") : null;
if (e) {
for (var t = [ "myself", "up", "right", "left" ], i = [ "holds", "penggangs", "folds", "ChuPai" ], n = 0; n < t.length; ++n) {
var a = e.getChildByName(t[n]);
if (a) for (var s = 0; s < i.length; ++s) {
var o = a.getChildByName(i[s]);
if (o) for (var r = 0; r < o.childrenCount; ++r) o.children[r].active = !1;
}
}
for (var l = [ "hua_myself", "hua_up", "hua_left", "hua_right" ], c = 0; c < l.length; ++c) {
var h = e.getChildByName(l[c]);
if (h) for (var d = 0; d < h.childrenCount; ++d) h.children[d].active = !1;
}
var u = e.getChildByName("brickWall");
u && (u.active = !1);
}
},
refreshBrickWall: function() {
if (!this._brickBuilt || !this._brickWall || !cc.isValid(this._brickWall)) try {
this.initBrickWall();
} catch (e) {
console.error("[MJRoom] 补建牌墙异常:", e && e.stack ? e.stack : e);
}
if (this._brickBuilt) {
this._brickWall && (this._brickWall.active = !0);
var e = cc.vv ? cc.vv.gameNetMgr : null;
if (e) {
var t = null != e.numOfMJ ? Number(e.numOfMJ) : 0;
(isNaN(t) || t < 0) && (t = 0);
if (null == this._brickLastN || t > this._brickLastN) {
this._brickLastN = t;
this.resetBrickRound();
} else {
this._brickLastN = t;
var i = 26;
if (e.conf && null != e.conf.liuju_left) {
var n = Number(e.conf.liuju_left);
isNaN(n) || (i = Math.max(0, n));
}
var a = (this._brickDrawable || []).concat(this._brickDead || []), s = a.length;
if (0 !== s) {
var o = Math.max(0, Math.min(s, s - t)), r = Math.max(0, Math.min(o, this._brickTailGone || 0)), l = o - r, c = s - r, h = s - i - r;
h < l && (h = l);
for (var d = Math.max(0, c - h), u = 0, g = 0; g < s; ++g) {
var v = a[g];
if (v) {
var _ = g >= l && g < c;
v.active !== _ && (v.active = _);
var f = _ && g >= h;
v.color = f ? new cc.Color(200, 200, 200, 255) : cc.Color.WHITE;
_ && !f && u++;
}
}
this._brickRemainCount = u;
if (this._brickLogGone !== o || this._brickLogTail !== r) {
this._brickLogGone = o;
this._brickLogTail = r;
console.log("[牌墙] 剩" + t + "张 隐藏" + o + "(墙头" + l + "/墙尾" + r + ") 置灰" + d + " 可摸" + u);
}
}
}
}
}
},
reorderBrickForZJZX: function() {
var e = this._brickDrawable;
if (e && e.length) {
for (var t = {}, i = 0; i < e.length; ++i) e[i] && (t[e[i].name] = e[i]);
var n = [], a = [];
for (i = 0; i < 31; ++i) {
var s = "LT" + (i < 10 ? "0" : "") + i;
t[s] && n.push(t[s]);
}
for (i = 0; i < 16; ++i) {
var o = "U" + (i < 10 ? "0" : "") + i;
t[o] && a.push(t[o]);
}
if (!(n.length < 30)) {
var r = d(n, 2);
r.reverse();
var l = [];
for (i = 0; i < r.length; ++i) for (var c = 0; c < r[i].length; ++c) l.push(r[i][c]);
var h = d(a, 2);
for (i = 0; i < h.length; ++i) for (c = 0; c < h[i].length; ++c) l.push(h[i][c]);
for (i = 0; i < e.length; ++i) l.indexOf(e[i]) < 0 && l.push(e[i]);
this._brickDrawable = l;
console.log("[MJRoom] 自选麻将摸牌顺序(前8): " + l.slice(0, 8).map(function(e) {
return e.name;
}).join(" -> "));
this.refreshBrickWall();
}
}
function d(e, t) {
for (var i = [], n = 0; n < e.length; n += t) {
var a = [ e[n] ];
e[n + 1] && a.push(e[n + 1]);
a.sort(function(e, t) {
return t.y - e.y;
});
i.push(a);
}
return i;
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
console.log("[room] game_all_over_push:等小局结算关闭后显示本次游戏总分数");
t.queueTotalScorePanel(null);
}, s = function(e) {
if (e && (1 == e.final || e.endinfo)) {
console.log("[room] game_over_push(final):等小局结算关闭后显示本次游戏总分数");
t.queueTotalScorePanel(e);
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
queueTotalScorePanel: function(e) {
null == e && null != this._pendingTotalPanel || (this._pendingTotalPanel = {
data: e || null
});
var t = this;
this.scheduleOnce(function() {
var e = cc.vv ? cc.vv.gameNetMgr : null;
e && e.roundSettleAwait || t.flushTotalScorePanel();
}, 0);
},
flushTotalScorePanel: function() {
var e = this._pendingTotalPanel;
if (e) {
this._pendingTotalPanel = null;
this.showTotalScorePanel(e.data);
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
var i = this;
this.scheduleOnce(function() {
if (cc.isValid(i.node)) {
var e = cc.director.getScene(), t = e && e.name ? e.name : "";
"hall" != t && "club" != t && (i._leaving = !1);
}
}, 2);
cc.vv.gameNetMgr && (cc.vv.gameNetMgr._ignoreDisconnectOnce = !0);
var n = cc.vv.gameNetMgr;
n && n.exitToTableHall ? n.exitToTableHall() : cc.vv.sceneMgr ? cc.vv.sceneMgr.load("club") : cc.director.loadScene("club");
cc.vv.gameNetMgr && cc.vv.gameNetMgr.clearRoomState();
}
}
},
initEventHandlers: function() {
var e = this;
this.node.on("exit_result", function() {
e.leaveToHall();
});
this.node.on("dispress_push", function() {
e.leaveToHall();
});
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
initBrickHandlers: function() {
if (!this._brickHandlersReady) {
this._brickHandlersReady = !0;
var e = this;
this.node.on("game_start", function() {
e.resetBrickRound();
});
this.node.on("mj_count", function() {
e.refreshBrickWall();
});
this.node.on("game_hua", function() {
e.consumeBrickTail(1);
e.refreshBrickWall();
});
this.node.on("gang_notify", function() {
e.consumeBrickTail(1);
});
}
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
if (this._seats[t] && this._seats2[t]) {
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
}
},
onBtnSettingsClicked: function() {
cc.vv.popupMgr.showSettings();
},
_ignoreEarlyRoomTap: function() {
var e = cc.vv && cc.vv.roomEnteredAt ? cc.vv.roomEnteredAt : 0;
if (e && Date.now() - e < 1500) {
console.log("[room] 忽略进房瞬间的退出点击(切场景补发的TOUCH_END)");
return !0;
}
return !1;
},
onBtnBackClicked: function() {
if (!this._ignoreEarlyRoomTap()) {
var e = function() {
cc.vv.net.send("exit");
};
try {
if (cc.vv.alert && cc.vv.alert.show) {
cc.vv.alert.show(null, "是否确定退出房间？", e, !0);
return;
}
} catch (e) {
console.warn("[room] 退出确认框异常,直接发送exit:", e.message);
}
e();
}
},
onBtnChatClicked: function() {},
onBtnWeichatClicked: function() {
cc.vv.gameNetMgr.conf.type;
},
onBtnDissolveClicked: function() {
if (!this._ignoreEarlyRoomTap()) {
var e = function() {
cc.vv.gameNetMgr && "begin" == cc.vv.gameNetMgr.gamestate ? cc.vv.net.send("dissolve_request") : cc.vv.net.send("dispress");
};
cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show(null, "解散房间不扣房卡，是否确定解散？", e, !0) : e();
}
},
onBtnExit: function() {
if (!this._ignoreEarlyRoomTap()) {
var e = function() {
cc.vv.net.send("exit");
};
try {
if (cc.vv.alert && cc.vv.alert.show) {
cc.vv.alert.show(null, "是否确定退出房间？", e, !0);
return;
}
} catch (e) {
console.warn("[room] 退出确认框异常,直接发送exit:", e.message);
}
e();
}
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
if (this._guohu) {
this._guohu.active = !1;
var e = cc.find("Canvas/tip_notice/info");
this._info = e ? e.getComponent(cc.Label) : null;
var t = this;
this.node.on("push_notice", function(e) {
e = e.detail;
if (t._guohu && t._info) {
t._guohu.active = !0;
t._guohuTime = e.time;
t._info.string = e.info;
}
});
}
},
update: function(e) {
if (this._guohu && this._guohuTime > 0) {
this._guohuTime -= e;
this._guohuTime < 0 && (this._guohu.active = !1);
}
}
});
cc._RF.pop();
}, {} ],
OpTiles: [ function(e, t) {
"use strict";
cc._RF.push(t, "b1c8ecavR5BJopmUtd4y1TE", "OpTiles");
var i = {
clear: function(e) {
if (e) {
var t = e.getChildByName("opTiles");
t && t.destroy();
}
},
isCaishen: function(e) {
var t = cc.vv && cc.vv.gameNetMgr ? cc.vv.gameNetMgr.conf : null;
return !(!t || null == e || e < 0) && (e == t.caishen || null != t.caishen2 && t.caishen2 >= 0 && e == t.caishen2);
},
build: function(e) {
var t = cc.vv ? cc.vv.gameNetMgr : null;
if (!t || !e) return e ? e.slice() : [];
var i = t.seats ? t.seats[t.seatIndex] : null;
!i && t.getSelfData && (i = t.getSelfData());
var n = {};
if (i && i.holds) for (var a = 0; a < i.holds.length; ++a) n[i.holds[a]] = (n[i.holds[a]] || 0) + 1;
var s = t.conf || {}, o = [];
null != s.caishen && s.caishen >= 0 && o.push(s.caishen);
null != s.caishen2 && s.caishen2 >= 0 && s.caishen2 != s.caishen && o.push(s.caishen2);
for (var r = {}, l = [], c = 0; c < e.length; ++c) {
var h = e[c];
if ((n[h] || 0) - (r[h] || 0) > 0) {
r[h] = (r[h] || 0) + 1;
l.push(h);
} else {
for (var d = h, u = 0; u < o.length; ++u) {
var g = o[u];
if ((n[g] || 0) - (r[g] || 0) > 0) {
r[g] = (r[g] || 0) + 1;
d = g;
break;
}
}
l.push(d);
}
}
return l;
},
setCaishenCorner: function(e, t, i) {
if (t) {
var n = t.getChildByName("csCorner");
if (this.isCaishen(i)) {
if (!n) {
var a = e ? e.node : null, s = a ? a.getChildByName("game") : null, o = s ? s.getChildByName("csCornerOp") : null;
if (!o) return;
(n = cc.instantiate(o)).name = "csCorner";
t.addChild(n);
}
n.active = !0;
} else n && (n.active = !1);
}
},
flash: function(e) {
var t = e ? e.getChildByName("opTiles") : null;
if (t) {
t.stopAllActions();
t.scale = 1;
t.runAction(cc.sequence(cc.scaleTo(.12, 1.08), cc.scaleTo(.12, 1)));
}
},
toast: function(e, t) {
var i = e ? e.node : null;
if (i) {
var n = i.getChildByName("game") || i, a = n.getChildByName("opToast");
a && a.destroy();
var s = new cc.Node("opToast");
n.addChild(s);
s.setPosition(0, -250);
var o = s.addComponent(cc.Label);
o.string = t;
o.fontSize = 32;
o.lineHeight = 36;
o.overflow = cc.Label.Overflow.NONE;
s.color = cc.color(255, 220, 80);
var r = s.addComponent(cc.LabelOutline);
r.color = cc.color(60, 30, 0);
r.width = 3;
s.runAction(cc.sequence(cc.delayTime(1.6), cc.removeSelf()));
}
},
show: function(e, t, i, n) {
if (t) {
this.clear(t);
if (i && i.length) {
var a = e ? e._opTpl : null;
a && !cc.isValid(a) && (a = null);
var s = [];
if (a) for (var o = 0; o < a.childrenCount; ++o) {
var r = a.children[o];
"plate" != r.name && s.push(r);
}
var l = 55, c = 84, h = 47;
if (s.length >= 2) {
s[0].width > 0 && (l = s[0].width);
s[0].height > 0 && (c = s[0].height);
h = s[1].x - s[0].x;
}
var d = 8, u = a ? a.getChildByName("plate") : null;
if (u && s.length >= 1 && u.width > 0) {
var g = (u.width - (h * (s.length - 1) + l)) / 2;
g > 0 && (d = g);
}
for (var v = u && u.height > 0 ? u.height : 0, _ = v > 0 ? v : c + 12, f = c + 12, m = [], p = 0; p < i.length; p += 2) {
for (var b = i.slice(p, p + 2), C = 0, y = 0; y < b.length; ++y) C += h * (b[y].length - 1) + l + 2 * d;
C += 14 * (b.length - 1);
m.push({
groups: b,
w: C
});
}
var S = new cc.Node("opTiles");
t.addChild(S);
for (var N = 150 + f / 2, B = f + 10, M = 0; M < m.length; ++M) for (var w = m[M], T = -w.w / 2, x = N + M * B, I = 0; I < w.groups.length; ++I) {
var P = w.groups[I], A = h * (P.length - 1) + l + 2 * d, L = new cc.Node("grp");
S.addChild(L);
L.setContentSize(A, _);
L.setPosition(T + A / 2, x);
if (a && s.length >= P.length) {
var R = cc.instantiate(a);
R.active = !0;
L.addChild(R);
for (var k = [], O = 0; O < R.childrenCount; ++O) {
var F = R.children[O];
"plate" != F.name && k.push(F);
}
var j = s[0].x, E = s[P.length - 1].x, D = (j + E) / 2;
R.setPosition(-D, 0);
var H = R.getChildByName("plate");
if (H) {
H.width = E - j + l + 2 * d;
H.x = D;
}
for (var G = 0; G < k.length; ++G) {
var z = k[G];
z.active = G < P.length;
if (z.active) {
var J = z.getComponent(cc.Sprite);
if (J) {
var U = z.width, V = z.height;
J.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", P[G]);
U > 0 && V > 0 && z.setContentSize(U, V);
}
this.isCaishen(P[G]) && (z.color = cc.color(255, 208, 90));
this.setCaishenCorner(e, z, P[G]);
}
}
} else {
var W = L.addComponent(cc.Graphics);
W.roundRect(-A / 2, -_ / 2, A, _, 6);
W.fillColor = cc.color(0, 0, 0, 150);
W.fill();
W.strokeColor = cc.color(255, 200, 90, 220);
W.lineWidth = 2;
W.stroke();
for (var Y = -(h * (P.length - 1) + l) / 2 + l / 2, q = 0; q < P.length; ++q) {
var X = new cc.Node("t");
L.addChild(X);
var Z = X.addComponent(cc.Sprite);
Z.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", P[q]);
Z.sizeMode = cc.Sprite.SizeMode.CUSTOM;
X.setContentSize(l, c);
X.setPosition(Y, 0);
this.isCaishen(P[q]) && (X.color = cc.color(255, 208, 90));
this.setCaishenCorner(e, X, P[q]);
Y += h;
}
}
n && function(e, t) {
L.on(cc.Node.EventType.TOUCH_END, function(e) {
n(t);
e && e.stopPropagation();
});
}(0, P);
T += A + 14;
}
}
}
}
};
t.exports = i;
cc._RF.pop();
}, {} ],
OpeningFlow: [ function(e, t) {
"use strict";
cc._RF.push(t, "01932VI92BBsY7OUzcn/47J", "OpeningFlow");
var i = e("DiceRoll");
function n(e) {
e && e.node && cc.isValid(e.node) && ("waiting" === e._ofState ? a(e, !0) : e._ofState = "diceDone");
}
function a(e, t) {
var i = e._ofHooks || {};
e._ofState = "playing";
var n = e._ofData;
e._ofData = null;
if (i.info) try {
i.info();
} catch (e) {
console.error("[OpeningFlow] info 异常:", e && e.stack ? e.stack : e);
}
if (i.render) try {
i.render(n);
} catch (e) {
console.error("[OpeningFlow] render 异常:", e && e.stack ? e.stack : e);
}
if (t && i.deal) try {
i.deal();
} catch (e) {
console.error("[OpeningFlow] deal 异常:", e && e.stack ? e.stack : e);
}
if (i.caishen) try {
i.caishen();
} catch (e) {
console.error("[OpeningFlow] caishen 异常:", e && e.stack ? e.stack : e);
}
}
var s = {
begin: function(e, t) {
if (e && e.node) {
e._ofHooks = t || {};
e._ofData = null;
if (t && t.before) try {
t.before();
} catch (e) {
console.error("[OpeningFlow] before 异常:", e && e.stack ? e.stack : e);
}
if (cc.vv && cc.vv.replayMgr && cc.vv.replayMgr.isReplay && cc.vv.replayMgr.isReplay()) e._ofState = "idle"; else {
e._ofState = "dice";
if (t && t.clear) try {
t.clear();
} catch (e) {
console.error("[OpeningFlow] clear 异常:", e && e.stack ? e.stack : e);
}
var a = function() {
n(e);
};
if (t && t.roll) try {
t.roll(a);
} catch (e) {
console.error("[OpeningFlow] roll 异常:", e && e.stack ? e.stack : e);
a();
} else i.play(e.node, a);
}
}
},
start: function(e, t, i) {
if (e && e.node) {
t && (e._ofHooks = t);
e._ofData = i;
var n = e._ofState;
"dice" !== n ? "waiting" !== n && a(e, "diceDone" === n) : e._ofState = "waiting";
}
},
restore: function(e, t, i) {
if (e && e.node) {
t && (e._ofHooks = t);
e._ofData = i || null;
a(e, !1);
}
},
end: function(e, t) {
var i = t || e && e._ofHooks || {};
if (!(cc.vv && cc.vv.replayMgr && cc.vv.replayMgr.isReplay && cc.vv.replayMgr.isReplay()) && i.clear) try {
i.clear();
} catch (e) {
console.error("[OpeningFlow] clear 异常:", e && e.stack ? e.stack : e);
}
},
isOpening: function(e) {
return !(!e || "dice" !== e._ofState && "waiting" !== e._ofState && "diceDone" !== e._ofState);
}
};
t.exports = s;
cc._RF.pop();
}, {
DiceRoll: "DiceRoll"
} ],
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
[ "myself", "up", "left", "right" ].forEach(function(t) {
var i = e.getChildByName(t), n = i ? i.getChildByName("penggangs") : null, a = n ? n.getChildByName("meldTpl") : null;
a && (a.active = !1);
});
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
_isCaishenMeld: function() {
return null != this.node.getComponent("MJGameBMJ") || null != this.node.getComponent("MJGameZJLAO") || null != this.node.getComponent("MJGameLDH") || null != this.node.getComponent("MJGameZJZX") || null != this.node.getComponent("MJGameWujin");
},
_setCaishenCorner: function(e, t) {
if (this._isCaishenMeld() && e) {
var i = e.getChildByName("csCorner"), n = cc.vv.gameNetMgr && cc.vv.gameNetMgr.conf || {};
if (null != t && t >= 0 && (t == n.caishen || null != n.caishen2 && n.caishen2 >= 0 && t == n.caishen2)) {
if (!i) {
var a = this.node.getChildByName("game"), s = a ? a.getChildByName("csCornerMeld") : null;
if (!s) return;
(i = cc.instantiate(s)).name = "csCorner";
e.addChild(i);
}
i.active = !0;
e.color = cc.color(255, 208, 90);
} else {
i && (i.active = !1);
e.color = cc.Color.WHITE;
}
}
},
_setTileFrame: function(e, t) {
if (e && t) {
var i = e.node.width, n = e.node.height;
e.spriteFrame = t;
i > 0 && n > 0 && e.node.setContentSize(i, n);
}
},
_meldPool: function(e) {
e._meldPool || (e._meldPool = []);
return e._meldPool;
},
_createMeld: function(e, t) {
var i = this.node.getChildByName("game"), n = null;
!i || "up" != t && "myself" != t || (n = i.getChildByName("up" == t ? "meldTplUp" : "meldTplSelf"));
n || (n = e.getChildByName("meldTpl"));
var a = null;
(a = n ? cc.instantiate(n) : "left" == t || "right" == t ? cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft) : cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf)).active = !0;
a.setPosition(0, 0);
a.setScale(1, 1);
e.addChild(a);
this._meldPool(e).push(a);
return a;
},
hideSide: function(e) {
var t = this.node.getChildByName("game");
if (null != t) {
var i = t.getChildByName(e);
if (null != i) {
var n = i.getChildByName("penggangs");
if (n) for (var a = this._meldPool(n), s = 0; s < a.length; ++s) a[s].active = !1;
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
var l = r.getChildByName(s);
if (null != l) {
var c = l.getChildByName("penggangs");
if (null != c) {
for (var h = this._meldPool(c), d = 0; d < h.length; ++d) h[d].active = !1;
var u = 0, g = e.angangs || [];
for (d = 0; d < g.length; ++d) {
var v = g[d];
this.initPengAndGangs(c, s, o, u, v, "angang");
u++;
}
for (g = e.diangangs || [], d = 0; d < g.length; ++d) {
v = g[d];
this.initPengAndGangs(c, s, o, u, v, "diangang");
u++;
}
for (g = e.wangangs || [], d = 0; d < g.length; ++d) {
v = g[d];
this.initPengAndGangs(c, s, o, u, v, "wangang");
u++;
}
var _ = e.pengs || [];
for (d = 0; d < _.length; ++d) {
v = _[d];
var f = e.pengTiles && e.pengTiles[d] || null;
this.initPengAndGangs(c, s, o, u, v, "peng", f);
u++;
}
var m = e.chis || [];
for (d = 0; d < m.length; ++d) {
this.initChis(c, s, o, u, m[d]);
u++;
}
}
}
}
}
}
},
initChis: function(e, t, i, n, a) {
var s = null, o = this._meldPool(e);
o.length <= n ? s = this._createMeld(e, t) : (s = o[n]).active = !0;
if ("left" == t) s.y = -75 * n; else if ("right" == t) {
s.y = 75 * n;
s.zIndex = -n;
} else s.x = "myself" == t ? n * this._meldStride(s, 0) : -n * this._meldStride(s, 165);
for (var r = this._meldTileSprites(s), l = 0, c = 0; c < r.length; ++c) {
var h = r[c];
if ("gang" == h.node.name) h.node.active = !1; else {
var d = l < a.length ? a[l] : a[a.length - 1];
this._setTileFrame(h, cc.vv.mahjongmgr.getSpriteFrameByMJID(i, d));
this._setCaishenCorner(h.node, d);
l++;
}
}
},
_meldTileSprites: function(e) {
for (var t = [], i = 0; i < e.childrenCount; ++i) {
var n = e.children[i];
if ("gang" != n.name && 0 != n.name.indexOf("csCorner")) {
var a = n.getComponent(cc.Sprite);
if (a) {
n.active = !0;
t.push(a);
}
}
}
var s = e.getChildByName("gang");
if (s) {
var o = s.getComponent(cc.Sprite);
o && t.push(o);
}
return t;
},
_meldStride: function(e, t) {
for (var i = null, n = null, a = this._meldTileSprites(e), s = 0; s < a.length; ++s) {
var o = a[s].node, r = o.x - o.width * o.anchorX, l = o.x + o.width * (1 - o.anchorX);
(null == i || r < i) && (i = r);
(null == n || l > n) && (n = l);
}
return null == i ? t : Math.max(t, n - i + 2);
},
initPengAndGangs: function(e, t, i, n, a, s, o) {
var r = null, l = this._meldPool(e);
l.length <= n ? r = this._createMeld(e, t) : (r = l[n]).active = !0;
if ("left" == t) r.y = -75 * n; else if ("right" == t) {
r.y = 75 * n;
r.zIndex = -n;
} else r.x = "myself" == t ? n * this._meldStride(r, 0) : -n * this._meldStride(r, 165);
for (var c = this._meldTileSprites(r), h = 0, d = 0; d < c.length; ++d) {
var u = c[d];
if ("gang" == u.node.name) {
var g = "peng" != s;
u.node.active = g;
"angang" == s ? this._setTileFrame(u, cc.vv.mahjongmgr.getEmptySpriteFrame(t)) : this._setTileFrame(u, cc.vv.mahjongmgr.getSpriteFrameByMJID(i, a));
this._setCaishenCorner(u.node, g && "angang" != s ? a : null);
} else {
var v = "peng" == s && o && h < o.length ? o[h] : a;
this._setTileFrame(u, cc.vv.mahjongmgr.getSpriteFrameByMJID(i, v));
this._setCaishenCorner(u.node, v);
h++;
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
var i = e.states[t], n = cc.vv.gameNetMgr.seats && cc.vv.gameNetMgr.seats[t] ? cc.vv.gameNetMgr.seats[t] : null, a = n ? n.name : "";
a && (this._extraInfo += i ? "\n[已同意] " + a : "\n[待确认] " + a);
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
var i = [ "Spade", "Heart", "Club", "Diamond" ], n = [ "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K" ], a = {
head: 3,
mid: 5,
tail: 5
}, s = {
head: 0,
mid: 3,
tail: 8
}, o = {
head: "前道",
mid: "中道",
tail: "后道"
}, r = [ "tail", "mid", "head" ], l = [ "head", "mid", "tail" ], c = {
head: 0,
mid: 1,
tail: 2
}, h = [ 0, 5, 4, 3, 2, 1 ], d = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ], u = {
head: {
3: "冲三",
1: "对子"
},
mid: {
9: "五同",
8: "同花顺",
7: "铁支",
6: "葫芦",
5: "同花",
4: "顺子",
3: "三条",
2: "二对",
1: "对子"
},
tail: {
9: "五同",
8: "同花顺",
7: "铁支",
6: "葫芦",
5: "同花",
4: "顺子",
3: "三条",
2: "二对",
1: "对子"
}
}, g = [ "理牌中-1", "理牌中-2", "理牌中-3", "已完成", "特殊牌型", "对子", "二对", "三条", "冲三", "顺子", "同花", "葫芦", "铁支", "同花顺", "五同" ];
function v(e) {
return Math.floor(e % 52 / 13);
}
function _(e) {
var t = e % 52 % 13;
return 0 == t ? 14 : t + 1;
}
function f(e) {
return 3 - v(e);
}
function m(e, t, i) {
return {
lv: e,
key: t,
suit: i || []
};
}
function p(e, t) {
for (var i = -1, n = 0; n < e.length; ++n) _(e[n]) == t && (i = Math.max(i, f(e[n])));
return i;
}
function b(e) {
for (var t = e.slice().sort(function(e, t) {
return _(t) - _(e) || f(t) - f(e);
}), i = t.map(_), n = !0, a = 1; a < 5; ++a) if (v(t[a]) != v(t[0])) {
n = !1;
break;
}
var s = {};
for (a = 0; a < 5; ++a) s[i[a]] = (s[i[a]] || 0) + 1;
var o = Object.keys(s).map(Number);
o.sort(function(e, t) {
return s[t] - s[e] || t - e;
});
var r = s[o[0]] || 0, l = s[o[1]] || 0, c = 0;
5 == o.length && (i[0] - i[4] == 4 ? c = i[0] : 14 == i[0] && 5 == i[1] && 4 == i[2] && 3 == i[3] && 2 == i[4] && (c = 5));
if (5 == r) return m(9, [ o[0] ], [ p(t, o[0]) ]);
if (c && n) return m(8, [ c ], [ p(t, c) ]);
if (4 == r) return m(7, [ o[0], o[1] ], [ p(t, o[0]), p(t, o[1]) ]);
if (3 == r && 2 == l) return m(6, [ o[0], o[1] ], [ p(t, o[0]), p(t, o[1]) ]);
if (n) return m(5, i, t.map(f));
if (c) return m(4, [ c ], [ p(t, c) ]);
if (3 == r) {
for (var h = [ o[0] ], d = [ p(t, o[0]) ], u = 0; u < o.length; ++u) if (1 == s[o[u]]) {
h.push(o[u]);
d.push(p(t, o[u]));
}
return m(3, h, d);
}
if (2 == r && 2 == l) {
for (var g = Math.max(o[0], o[1]), b = Math.min(o[0], o[1]), C = 0, y = 0; y < o.length; ++y) 1 == s[o[y]] && (C = o[y]);
return m(2, [ g, b, C ], [ p(t, g), p(t, b), p(t, C) ]);
}
if (2 == r) {
for (var S = [ o[0] ], N = [ p(t, o[0]) ], B = 1; B < o.length; ++B) {
S.push(o[B]);
N.push(p(t, o[B]));
}
return m(1, S, N);
}
return m(0, i, t.map(f));
}
function C(e) {
var t = e.slice().sort(function(e, t) {
return _(t) - _(e) || f(t) - f(e);
}), i = t.map(_);
return i[0] == i[1] && i[1] == i[2] ? m(3, [ i[0] ], [ p(t, i[0]) ]) : i[0] == i[1] ? m(1, [ i[0], i[2] ], [ p(t, i[0]), p(t, i[2]) ]) : i[1] == i[2] ? m(1, [ i[1], i[0] ], [ p(t, i[1]), p(t, i[0]) ]) : m(0, i, t.map(f));
}
function y(e, t) {
if (e.lv != t.lv) return e.lv - t.lv;
for (var i = Math.min(e.key.length, t.key.length), n = 0; n < i; ++n) if (e.key[n] != t.key[n]) return e.key[n] - t.key[n];
for (var a = Math.min((e.suit || []).length, (t.suit || []).length), s = 0; s < a; ++s) if ((e.suit[s] || 0) != (t.suit[s] || 0)) return (e.suit[s] || 0) - (t.suit[s] || 0);
return 0;
}
function S(e) {
for (var t = v(e[0]), i = 1; i < e.length; ++i) if (v(e[i]) != t) return !1;
return !0;
}
function N(e, t) {
var i = e.map(_).sort(function(e, t) {
return t - e;
});
return 3 == t ? i[0] - i[2] == 2 || 14 == i[0] && 3 == i[1] && 2 == i[2] : i[0] - i[4] == 4 || 14 == i[0] && 5 == i[1] && 4 == i[2] && 3 == i[3] && 2 == i[4];
}
function B(e, t) {
if (!e || e.length < 13) return null;
var i = e.map(_), n = {};
i.forEach(function(e) {
n[e] = (n[e] || 0) + 1;
});
var a = Object.keys(n).map(Number), s = a.length, o = 0, r = 0, l = 0, c = 0;
a.forEach(function(e) {
var t = n[e];
t >= 4 ? o++ : 3 == t ? r++ : 2 == t ? l++ : c++;
});
for (var h = !0, d = 1; d < e.length; ++d) if (v(e[d]) != v(e[0])) {
h = !1;
break;
}
if (h) return "至尊青龙";
if (13 == s) return "一条龙";
if (12 == s) return "十二皇族";
if (t && t.head && t.mid && t.tail) {
var u = t.head, g = t.mid, f = t.tail;
if (3 == u.length && 5 == g.length && 5 == f.length && S(u) && S(g) && S(f) && N(u, 3) && N(g, 5) && N(f, 5)) return "三同花顺";
}
if (3 == o) return "三套炸弹";
for (var m = !0, p = !0, b = 0; b < i.length; ++b) {
i[b] < 8 && (m = !1);
i[b] > 8 && (p = !1);
}
if (m) return "全大";
if (p) return "全小";
for (var C = !0, y = !0, B = 0; B < e.length; ++B) {
var M = v(e[B]);
0 != M && 2 != M && (C = !1);
1 != M && 3 != M && (y = !1);
}
if (C || y) return "凑一色";
if (4 == r) return "四套三条";
if (1 == r && 5 == l) return "五对三条";
if (6 == l && 1 == c) return "六对半";
if (t && t.head && t.mid && t.tail) {
var w = t.head, T = t.mid, x = t.tail;
if (3 == w.length && 5 == T.length && 5 == x.length && S(w) && S(T) && S(x)) return "三同花";
if (3 == w.length && 5 == T.length && 5 == x.length && N(w, 3) && N(T, 5) && N(x, 5)) return "三顺子";
}
return null;
}
function M(e, t) {
var i = e.length;
if (i < 13) return [];
t = t || 4;
var n = {}, a = {}, s = function(t) {
var i = t.join(","), a = n[i];
if (!a) {
for (var s = [], o = 0; o < t.length; ++o) s.push(e[t[o]]);
a = b(s);
n[i] = a;
}
return a;
}, o = function(t) {
var i = t.join(","), n = a[i];
if (!n) {
for (var s = [], o = 0; o < t.length; ++o) s.push(e[t[o]]);
n = C(s);
a[i] = n;
}
return n;
}, r = {}, l = [];
(function e(t, n) {
if (5 != n.length) for (var a = t; a < i; ++a) {
n.push(a);
e(a + 1, n);
n.pop();
} else l.push(n.slice());
})(0, []);
for (var c = 0; c < l.length; ++c) {
for (var h = l[c], d = h.map(function(t) {
return e[t];
}), u = s(h), g = [], v = 0; v < i; ++v) h.indexOf(v) < 0 && g.push(v);
var _ = [];
(function e(t, i) {
if (5 != i.length) for (var n = t; n < g.length; ++n) {
i.push(n);
e(n + 1, i);
i.pop();
} else _.push(i.slice());
})(0, []);
for (var f = 0; f < _.length; ++f) {
for (var m = _[f].map(function(e) {
return g[e];
}), p = [], S = 0; S < i; ++S) h.indexOf(S) < 0 && m.indexOf(S) < 0 && p.push(S);
var N = o(p), B = s(m);
if (!(y(N, B) > 0 || y(B, u) > 0)) {
var M = 1e6 * w(u) + 1e3 * w(B) + w(N), T = N.lv + "|" + B.lv + "|" + u.lv, x = r[T];
x && x.sc >= M || (r[T] = {
sc: M,
head: p.map(function(t) {
return e[t];
}),
mid: m.map(function(t) {
return e[t];
}),
tail: d
});
}
}
}
var I = [];
for (var P in r) I.push(r[P]);
I.sort(function(e, t) {
return t.sc - e.sc;
});
return I.slice(0, t);
}
function w(e) {
var t = 1e4 * e.lv;
return (t += 100 * (e.key[0] || 0) + 10 * (e.key[1] || 0) + (e.key[2] || 0)) + .01 * (e.suit && e.suit[0] ? e.suit[0] : 0);
}
function T(e) {
for (var t = {}, i = 0; i < e.length; ++i) {
var n = _(e[i]);
(t[n] = t[n] || []).push(e[i]);
}
return t;
}
function x(e) {
return e.slice().sort(function(e, t) {
return _(t) - _(e) || f(t) - f(e);
});
}
function I(e, t) {
for (var i = {}, n = 0; n < e.length; ++n) if (null == t || v(e[n]) == t) {
var a = _(e[n]);
(!i[a] || f(e[n]) > f(i[a])) && (i[a] = e[n]);
}
for (var s = 14; s >= 5; --s) {
for (var o = [], r = !0, l = 0; l < 5; ++l) {
if (!i[s - l]) {
r = !1;
break;
}
o.push(i[s - l]);
}
if (r) return o;
}
return i[14] && i[5] && i[4] && i[3] && i[2] ? [ i[14], i[5], i[4], i[3], i[2] ] : null;
}
function P(e) {
for (var t = {}, i = 0; i < e.length; ++i) {
var n = v(e[i]);
(t[n] = t[n] || []).push(e[i]);
}
var a = null;
for (var s in t) {
var o = x(t[s]);
o.length >= 5 && (a || (a = o.slice(0, 5)));
}
return a;
}
function A(e, t) {
var i, n, a = T(t), s = Object.keys(a).map(Number).sort(function(e, t) {
return t - e;
});
if (9 == e) {
for (i = 0; i < s.length; ++i) if (a[s[i]].length >= 5) return x(a[s[i]]).slice(0, 5);
return null;
}
if (8 == e) {
var o = [ 0, 1, 2, 3 ];
for (i = 0; i < o.length; ++i) {
var r = I(t, o[i]);
if (r) return r;
}
return null;
}
if (7 == e) {
for (i = 0; i < s.length; ++i) if (a[n = s[i]].length >= 4) {
for (var l = x(a[n]).slice(0, 4), c = null, h = 0; h < s.length; ++h) if (s[h] != n) {
c = x(a[s[h]])[0];
break;
}
null != c && l.push(c);
return l;
}
return null;
}
if (6 == e) {
var d = null, u = null;
for (i = 0; i < s.length; ++i) a[s[i]].length >= 3 && null == d && (d = s[i]);
if (null == d) return null;
for (i = 0; i < s.length; ++i) if (s[i] != d && a[s[i]].length >= 2) {
u = s[i];
break;
}
return null == u ? null : x(a[d]).slice(0, 3).concat(x(a[u]).slice(0, 2));
}
if (5 == e) return P(t);
if (4 == e) return I(t, null);
if (3 == e) {
for (i = 0; i < s.length; ++i) if (a[s[i]].length >= 3) return x(a[s[i]]).slice(0, 3);
return null;
}
if (2 == e) {
var g = [];
for (i = 0; i < s.length; ++i) a[s[i]].length >= 2 && g.push(s[i]);
if (g.length < 2) return null;
var v = x(a[g[0]]).slice(0, 2).concat(x(a[g[1]]).slice(0, 2)), _ = null;
for (i = 0; i < s.length; ++i) if (s[i] != g[0] && s[i] != g[1]) {
_ = x(a[s[i]])[0];
break;
}
null != _ && v.push(_);
return v;
}
if (1 == e) {
for (i = 0; i < s.length; ++i) if (a[s[i]].length >= 2) return x(a[s[i]]).slice(0, 2);
return null;
}
return null;
}
function L(e, t) {
if (!t || t.length != a[e]) return null;
var i = "head" == e ? C(t) : b(t);
return (u[e] || {})[i.lv] || null;
}
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {
if (cc.vv) {
this._leaving = !1;
this._phase = "idle";
this._sat = !1;
this._playedOnce = !1;
this._dealing = !1;
this._confirmed = !1;
this._roundRevealed = !1;
this._pendingGameEnd = null;
this._pendingConfirm = !1;
this._autoMode = !0;
this._final = !1;
this._revealing = !1;
this._revealToken = 0;
this._revealTimer = null;
this._dealingSec = 0;
this._leftSec = 0;
this._arrangeDeadline = 0;
this._cards = [];
this._hand = [];
this._roads = {
head: [],
mid: [],
tail: []
};
this._picked = {};
this._candidates = [];
this._autoIdx = 0;
this._ownSpecial = null;
this._resultByRoom = {};
this._lastResult = null;
this._myUserId = cc.vv && cc.vv.userMgr ? cc.vv.userMgr.userId : 0;
this._seatSig = null;
this._imgs = {};
this._imgsReady = !1;
this._frames = null;
this._startFrames = null;
this._fxTimer = null;
this._n = {};
this._bindUI();
this._resetSeatsCards(!1);
this._loadCards();
this._loadImgs();
this._loadStartFx();
this._bindNet();
this._refreshSeats();
this.renderAll();
cc.vv.audioMgr && cc.vv.audioMgr.playBGM("bgFight.mp3");
this.schedule(this._tick, 1);
this.schedule(this._mbTick, .36);
} else cc.director.loadScene("loading");
},
onDestroy: function() {
this.unschedule(this._tick);
this.unschedule(this._mbTick);
if (this._revealTimer) {
clearTimeout(this._revealTimer);
this._revealTimer = null;
}
if (this._toastTimer) {
clearTimeout(this._toastTimer);
this._toastTimer = null;
}
if (this._fxTimer) {
clearInterval(this._fxTimer);
this._fxTimer = null;
}
if (this._sio && this._sioListeners) {
this._sio.removeListener("exit_result", this._sioListeners.exit_result);
this._sio.removeListener("dispress_push", this._sioListeners.dispress_push);
this._sioListeners = null;
}
cc.vv && cc.vv.gameNetMgr && cc.vv.gameNetMgr.dataEventHandler == this.node && (cc.vv.gameNetMgr.dataEventHandler = null);
},
_findIn: function(e, t) {
if (!e) return null;
if (e.name === t) return e;
for (var i = e.children, n = 0; n < i.length; ++n) {
var a = this._findIn(i[n], t);
if (a) return a;
}
return null;
},
_childLoose: function(e, t) {
if (!e) return null;
var i = e.getChildByName(t);
if (i) return i;
for (var n = 0; n < e.children.length; ++n) {
var a = e.children[n];
if (a.name && a.name.trim() === t) return a;
}
return null;
},
_find: function(e) {
var t = this._findIn(this.node, e);
if (t) return t;
var i = cc.director.getScene ? cc.director.getScene() : null;
return i && i !== this.node ? this._findIn(i, e) : null;
},
_labelOf: function(e) {
return e ? e.getComponent(cc.Label) : null;
},
_spriteOf: function(e) {
return e ? e.getComponent(cc.Sprite) : null;
},
_bindTap: function(e, t, i) {
e && e.on(cc.Node.EventType.TOUCH_END, function(e) {
e && e.stopPropagation && e.stopPropagation();
!i && cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("btnClick.wav");
t && t(e);
});
},
_sortedByX: function(e) {
return e.slice().sort(function(e, t) {
return e.x - t.x;
});
},
_seatInfo: function(e, t) {
if (!e) return null;
var i, n, a = null;
for (i = 0; i < e.children.length; ++i) if ("bbCards" === (n = e.children[i]).name || "01" === n.name) {
a = n;
break;
}
if (!a) for (i = 0; i < e.children.length; ++i) {
n = e.children[i];
for (var s = 0, o = 0; o < n.children.length; ++o) 0 === n.children[o].name.indexOf("bbCard") && s++;
if (s >= 10) {
a = n;
break;
}
}
var r = [];
if (a) for (i = 0; i < a.children.length; ++i) 0 === a.children[i].name.indexOf("bbCard") && r.push(a.children[i]);
var l = this._findIn(e, "bbMb"), c = null;
if (l) {
(c = l.getComponent(cc.Sprite)) || (c = l.addComponent(cc.Sprite));
l.active = !1;
l.parent && l.setSiblingIndex(l.parent.children.length - 1);
var h = this._findIn(l, "bbMianType");
h && (h.active = !1);
}
var d = this._findIn(e, "username"), u = this._childLoose(d, "avatar"), g = {}, v = {
head: "bbCards01",
mid: "bbCards02",
tail: "bbCards03"
}, _ = {
head: "bbDao0",
mid: "bbDao1",
tail: "bbDao2"
};
for (var f in v) {
var m = this._findIn(e, v[f]);
if (m) {
for (var p = [], b = 0; b < m.children.length; ++b) 0 === m.children[b].name.indexOf("bbCargmp") && p.push(m.children[b]);
m.active = !1;
g[f] = {
root: m,
cards: p,
dao: this._findIn(m, _[f]),
bx: m.scaleX,
by: m.scaleY
};
}
}
return {
root: e,
k: t,
box: a,
cards: r,
spots: g,
childOrder: a ? a.children.slice() : [],
mb: l,
mbSp: c,
mbAnim: !1,
mbIdx: 0,
ok: this._findIn(e, "okSprite"),
userNode: d,
nameNode: d ? d.getChildByName("name") : null,
scoreNode: d ? d.getChildByName("score") : null,
avatarNode: u,
avatarIcon: u ? this._findIn(u, "icon") : null,
zhuangNode: d ? d.getChildByName("bbZhuang") : null,
nameLb: d ? this._labelOf(d.getChildByName("name")) : null,
scoreLb: d ? this._labelOf(d.getChildByName("score")) : null,
summary: this._labelOf(this._findIn(e, "bbSummary")),
badges: null,
specialBadge: null,
roomSeat: -1,
player: null,
confirmed: !1,
special: null,
results: null
};
},
_panelInfo: function(e, t) {
if (!e) return null;
for (var i = this, n = {
root: e,
isAuto: t,
rows: [],
zd: [],
hand: [],
handHome: [],
typeBtns: []
}, a = 0; a < 3; ++a) {
var s = this._findIn(e, t ? "bg" + a + "-a" : "bg" + a);
if (s) {
for (var o = s, r = 0; r < s.children.length; ++r) if (0 === s.children[r].name.indexOf("bbarrbg")) {
o = s.children[r];
break;
}
for (var c = [], h = null, d = 0; d < o.children.length; ++d) {
var u = o.children[d];
0 === u.name.indexOf("bbArrCard") ? c.push(u) : "Spritea" === u.name && (h = u);
}
var g = {
bg: s,
wrap: o,
cards: c = this._sortedByX(c),
typeSp: h
};
n.rows.push(g);
(function(e, t) {
i._bindTap(t.bg, function(n) {
n && n.target && n.target !== t.bg || i.onRowTap(e);
});
for (var n = 0; n < t.cards.length; ++n) (function(n) {
i._bindTap(t.cards[n], function() {
i.onRowCardTap(e, n);
}, !0);
})(n);
})(l[a], g);
}
}
n.autoBtn = this._findIn(e, t ? "bbAutoBtn-a" : "bbAutoBtn");
n.okBtn = this._findIn(e, t ? "bbOkBtn-a" : "bbOkBtn");
n.reopenBtn = this._findIn(e, t ? "bbArrReopen-a" : "bbArrReopen");
var v = this._findIn(e, t ? "bbMidCd-a" : "bbMidCd");
n.cdLabel = this._labelOf(v);
n.cdRoot = this._findIn(e, t ? "djsSprite-a" : "djsSprite");
this._bindTap(n.autoBtn, function() {
t ? i.onManual() : i.onAuto();
});
this._bindTap(n.reopenBtn, function() {
i.onReopen();
});
this._bindTap(n.okBtn, function() {
i.onOk();
});
if (t) for (var _ = 0; _ < 4; ++_) {
var f = this._findIn(e, "zdSprite" + _);
if (f) {
var m = f.children.slice().sort(function(e, t) {
return t.y - e.y;
});
n.zd.push({
root: f,
parts: m
});
(function(e) {
i._bindTap(f, function() {
i.onPickCandidate(e);
});
})(_);
}
} else {
var p = this._findIn(e, "Spritepk");
if (p) {
n.hand = this._sortedByX(p.children);
n.handHome = [];
for (var b = 0; b < n.hand.length; ++b) {
n.handHome.push({
x: n.hand[b].x,
y: n.hand[b].y,
sx: n.hand[b].scaleX,
sy: n.hand[b].scaleY
});
(function(e) {
i._bindTap(n.hand[e], function() {
i.onHandTap(e);
}, !0);
})(b);
}
}
var C = this._findIn(e, "bootNode");
if (C) {
n.typeBtns = this._sortedByX(C.children);
for (var y = 0; y < n.typeBtns.length; ++y) (function(e) {
i._bindTap(n.typeBtns[e], function() {
i.onTypeBtn(e);
});
})(y);
}
}
return n;
},
_bindUI: function() {
var e = this, t = this._n;
t.seats = [];
for (var i = 0; i < 6; ++i) t.seats.push(this._seatInfo(this._find("bbSeat" + i), i));
t.auto = this._panelInfo(this._find("bbArrange-a"), !0);
t.manual = this._panelInfo(this._find("bbArrange"), !1);
t.prepare = this._find("prepare");
t.settle = this._find("settlePanel");
t.gameResult = this._find("game_result");
t.alert = this._find("alert");
t.shuffle = this._find("bbShuffleAnim");
t.tableRoot = this._find("up") || this._find("game") || this.node;
t.auto && (t.auto.root.active = !1);
t.manual && (t.manual.root.active = !1);
t.settle && (t.settle.active = !1);
t.gameResult && (t.gameResult.active = !1);
t.alert && (t.alert.active = !1);
t.shuffle && (t.shuffle.active = !1);
t.readyBtn = this._findIn(t.prepare, "readyBtn");
this._bindTap(t.readyBtn, function() {
e._sat = !0;
t.readyBtn && (t.readyBtn.active = !1);
e._refreshSitUI();
e.onReady();
});
this._bindTap(this._findIn(t.prepare, "exitBtn"), function() {
e.onExit();
});
this._bindTap(this._find("bbRuleBtn"), function() {
var t = e._find("bbRuleWin");
t && (t.active = !t.active);
});
this._bindTap(this._find("bbRuleClose"), function() {
var t = e._find("bbRuleWin");
t && (t.active = !1);
});
this._bindTap(this._findIn(t.settle, "settleAgainBtn"), function() {
e.onReady();
});
this._bindTap(this._findIn(t.settle, "bbDisbandBtn"), function() {
e.onDissolve();
});
this._bindTap(this._findIn(t.gameResult, "btnClose"), function() {
e.leaveRoom();
});
this._bindTap(this._find("btn_settings"), function() {
e.onBtnSettingsClicked();
});
if (t.alert) {
this._bindTap(this._findIn(t.alert, "btn_ok"), function() {
t.alert.active = !1;
var i = e._confirmOk;
e._confirmOk = null;
i && i();
}, !0);
this._bindTap(this._findIn(t.alert, "btn_cancel"), function() {
t.alert.active = !1;
e._confirmOk = null;
}, !0);
}
},
_loadCards: function() {
var e = this;
cc.resources.load("images/atlas/cards", cc.SpriteAtlas, function(t, i) {
if (!t && i) {
e._frames = i;
e.renderAll();
"reveal" === e._phase || "settle" === e._phase ? e._paintAllResults() : e._repaintBacks();
} else console.log("[SSS] 牌图加载失败", t);
});
},
_loadImgs: function() {
var e = this, t = g.length;
t ? g.forEach(function(i) {
cc.resources.load("images/png/" + i, cc.SpriteFrame, function(n, a) {
!n && a ? e._imgs[i] = a : console.log("[SSS] 图片加载失败", i, n);
if (--t <= 0) {
e._imgsReady = !0;
e.renderAll();
e._updateMbs();
}
});
}) : this._imgsReady = !0;
},
_img: function(e) {
return e && this._imgs[e] || null;
},
_atlasFrame: function(e) {
return this._frames && e && (this._frames.getSpriteFrame(e + ".png") || this._frames.getSpriteFrame(e)) || null;
},
_frameOf: function(e) {
if (!this._frames) return null;
var t = Number(e) % 52;
if (!(t >= 0 && t < 52)) return null;
var a = i[Math.floor(t / 13)] + n[t % 13];
return this._atlasFrame(a) || this._backFrame();
},
_backFrame: function() {
return this._atlasFrame("card_back");
},
_setCardFrame: function(e, t) {
if (e) {
var i = e.getComponent(cc.Sprite);
i && (i.spriteFrame = this._frameOf(t));
}
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
t._pendingConfirm = !1;
t._confirmed = !1;
t._toast(e && e.detail && e.detail.msg || "操作失败");
var i = t._ownSeat();
i && (i.confirmed = !1);
t.renderAll();
t._updateMbs();
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
t.renderAll();
});
this.node.on("user_state_changed", function() {
t._refreshSeats();
});
this.node.on("new_user", function() {
t._refreshSeats();
});
this.node.on("dissolve_notice", function() {
t._confirm("对方申请解散房间, 是否同意?", function() {
cc.vv.net.send("dissolve_agree");
});
});
this.node.on("dissolve_cancel", function() {
t._n.alert && (t._n.alert.active = !1);
t._toast("对方取消了解散");
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
"idle" === this._phase && e.sssStart && this.applyStart(e.sssStart);
},
applyStart: function(e) {
if (e) {
this._cancelReveal();
this._cards = (e.myCards || []).map(Number).sort(function(e, t) {
return e - t;
});
this._confirmed = !(!e.confirmed && !e.confirm);
this._pendingConfirm = !1;
this._final = !1;
this._revealing = !1;
this._hand = [];
this._picked = {};
this._roads = {
head: [],
mid: [],
tail: []
};
this._autoMode = !0;
this._candidates = [];
this._autoIdx = 0;
this._ownSpecial = null;
this._resultByRoom = {};
this._lastResult = null;
this._arrangeDeadline = e.arrangeDeadline || 0;
this._leftSec = null != e.arrangeSeconds ? e.arrangeSeconds : this._arrangeDeadline ? Math.max(0, Math.ceil((this._arrangeDeadline - Date.now()) / 1e3)) : 30;
this._n.settle && (this._n.settle.active = !1);
this._n.gameResult && (this._n.gameResult.active = !1);
this._n.prepare && (this._n.prepare.active = !1);
this._layoutSeats(e);
if (e.arrange && (e.arrange.head || []).length > 0) {
this._roads = {
head: (e.arrange.head || []).map(Number),
mid: (e.arrange.mid || []).map(Number),
tail: (e.arrange.tail || []).map(Number)
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
this._ownSpecial = B(this._cards, this._roads);
this._phase = "arrange";
this._dealing = !1;
this._resetSeatsCards(!0);
this.renderAll();
this._updateMbs();
} else {
this._phase = "dealing";
this._dealing = !0;
this._dealingSec = 0;
this._playedOnce = !0;
this._roundRevealed = !1;
this._pendingGameEnd = null;
this._resetSeatsCards(!1);
this.renderAll();
var n = this;
this._playStartAnim(function() {
cc.isValid(n.node) && n._dealFly(function() {
cc.isValid(n.node) && n._enterArrange();
});
});
}
}
},
_loadStartFx: function() {
var e = this;
cc.resources.loadDir("images/bbfx_start", cc.SpriteFrame, function(t, i) {
if (!t && i && i.length) {
i.sort(function(e, t) {
var i = parseInt(e.name, 10), n = parseInt(t.name, 10);
return isNaN(i) || isNaN(n) ? e.name < t.name ? -1 : e.name > t.name ? 1 : 0 : i - n;
});
e._startFrames = i;
} else console.log("[SSS] 开局动画加载失败", t);
});
},
_playStartAnim: function(e) {
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("start_game.mp3");
var t = this._startFrames;
if (t && t.length) {
var i = cc.view.getVisibleSize(), n = this.node.convertToNodeSpaceAR(cc.v2(i.width / 2, i.height / 2)), a = new cc.Node("sssFxStart");
a.parent = this.node;
a.setSiblingIndex(this.node.children.length - 1);
a.setPosition(n);
var s = a.addComponent(cc.Sprite);
s.spriteFrame = t[0];
var o = t[0].getOriginalSize().width, r = t[0].getOriginalSize().height;
a.setScale(.9 * Math.min(cc.winSize.width / o, cc.winSize.height / r));
var l = 0, c = t.length, h = this;
if (this._fxTimer) {
clearInterval(this._fxTimer);
this._fxTimer = null;
}
this._fxTimer = setInterval(function() {
if (cc.isValid(a) && cc.isValid(h.node)) if (++l >= c) {
clearInterval(h._fxTimer);
h._fxTimer = null;
a.destroy();
e();
} else s.spriteFrame = t[l]; else {
clearInterval(h._fxTimer);
h._fxTimer = null;
}
}, 50);
} else e();
},
_resetSeatsCards: function(e) {
for (var t = 0; t < this._n.seats.length; ++t) {
var i = this._n.seats[t];
if (i) {
for (var n = 0; n < i.cards.length; ++n) {
var a = i.cards[n];
a.stopAllActions();
a.active = !1;
a.opacity = 255;
var s = a.getComponent(cc.Sprite);
s && (s.spriteFrame = e ? this._backFrame() : null);
}
if (i.badges) for (var o in i.badges) i.badges[o] && (i.badges[o].active = !1);
i.specialBadge && (i.specialBadge.active = !1);
i.special = null;
i.results = null;
i.confirmed = !1;
i.revealed = {};
}
}
this._hideSpots();
this._updateMbs();
},
_dealFly: function(e) {
for (var t = this, i = [], n = 0; n < this._n.seats.length; ++n) this._n.seats[n] && this._n.seats[n].player && i.push(this._n.seats[n]);
if (i.length) {
for (var a = this._n.tableRoot, s = a ? a.convertToWorldSpaceAR(cc.v2(0, 0)) : cc.v2(0, 0), o = 0, r = 0, l = this._backFrame(), c = 0; c < 13; ++c) for (var h = 0; h < i.length; ++h) {
var d = i[h], u = d.cards[c];
if (u) {
var g = u.parent || d.box, v = g ? g.convertToNodeSpaceAR(s) : cc.v2(0, 0), _ = cc.v2(u.x, u.y), f = .012 * r;
f > o && (o = f);
var m = new cc.Node("sssDealGhost"), p = m.addComponent(cc.Sprite);
p.sizeMode = cc.Sprite.SizeMode.CUSTOM;
p.spriteFrame = l;
m.setContentSize(u.width, u.height);
var b = u.angle + (90 * Math.random() - 45);
m.angle = b;
m.setScale(.55, .55);
m.setPosition(v.x + 260 * (Math.random() - .5), v.y + 150 * (Math.random() - .5));
g && g.addChild(m);
(function(e, t, i, n, a, s) {
e.runAction(cc.sequence(cc.delayTime(f), cc.spawn(cc.moveTo(.34, i).easing(cc.easeQuadraticActionOut()), cc.scaleTo(.34, n, a), cc.rotateTo(.34, s)), cc.callFunc(function() {
t.active = !0;
t.opacity = 255;
var i = t.getComponent(cc.Sprite);
i && (i.spriteFrame = l);
cc.isValid(e) && e.destroy();
})));
})(m, u, _, u.scaleX, u.scaleY, u.angle);
r++;
} else r++;
}
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("deal.wav");
this.scheduleOnce(function() {
cc.isValid(t.node) && e();
}, o + .34 + .18);
} else e();
},
_enterArrange: function() {
if ("dealing" === this._phase) {
this._dealing = !1;
this._phase = "arrange";
this._dealingSec = 0;
this._autoMode = !0;
this._ownSpecial = B(this._cards, null);
this._buildCandidates();
if (this._candidates.length > 0) this._applyCandidate(0); else {
this._roads = {
head: [],
mid: [],
tail: []
};
this._hand = this._cards.slice();
}
this.renderAll();
this._updateMbs();
}
},
_layoutSeats: function(e) {
var t, i, n = cc.vv.gameNetMgr, a = n && n.seats ? n.seats : null, s = n && n.seatIndex >= 0 ? n.seatIndex : -1;
for (i = 0; i < this._n.seats.length; ++i) {
var o = this._n.seats[i];
if (o) {
o.player = null;
o.roomSeat = -1;
this._seatEmpty(o);
}
}
var r = a;
if (!r || !r.length) {
r = [];
var l = e && e.seats || [];
for (t = 0; t < l.length; ++t) {
var c = null != l[t].roomSeatIndex ? l[t].roomSeatIndex : l[t].seatindex;
null != c && (r[c] = {
userid: l[t].userid,
name: l[t].name,
score: 0
});
}
for (t = 0; t < r.length; ++t) r[t] || (r[t] = {
userid: 0
});
}
if (s < 0) for (t = 0; t < r.length; ++t) if (r[t] && r[t].userid == this._myUserId) {
s = t;
break;
}
s < 0 && (s = 0);
for (var d = [], u = 0; u < r.length; ++u) {
var g = (s + u) % r.length;
r[g] && r[g].userid > 0 && d.push(g);
}
var v = d.length;
if (!v) {
if (!(this._myUserId > 0)) return;
(r = (r || []).slice())[s] = {
userid: this._myUserId,
name: cc.vv.userMgr && cc.vv.userMgr.userName || "我",
score: 0
};
d = [ s ];
v = 1;
}
for (var _ = 2 === v ? [ 0, 3 ] : h.slice(0, v), f = n && n.sssConfirmed || {}, m = 0; m < v; ++m) {
var p = d[m], b = r[p], C = this._n.seats[_[m]];
if (C) {
C.root.active = !0;
C.roomSeat = p;
C.player = b;
C.userNode && (C.userNode.active = !0);
C.nameNode && (C.nameNode.active = !0);
C.scoreNode && (C.scoreNode.active = !0);
C.avatarNode && (C.avatarNode.active = !0);
C.zhuangNode && (C.zhuangNode.active = !0);
C.confirmed = !!(f[b.userid] || this._confirmed && b.userid == this._myUserId);
C.nameLb && (C.nameLb.string = b.name || "玩家" + (p + 1));
C.scoreLb && (C.scoreLb.string = "分数:" + (b.score || 0));
if (C.avatarIcon && b.userid) {
var y = C.avatarIcon.getComponent("ImageLoader");
if (!y) try {
y = C.avatarIcon.addComponent("ImageLoader");
} catch (e) {
y = null;
}
y && y.setUserID && y.setUserID(b.userid);
}
}
}
},
_seatEmpty: function(e) {
if (e) {
e.root && (e.root.active = !0);
e.userNode && (e.userNode.active = !0);
e.nameNode && (e.nameNode.active = !1);
e.scoreNode && (e.scoreNode.active = !1);
e.avatarNode && (e.avatarNode.active = !1);
e.zhuangNode && (e.zhuangNode.active = !1);
e.ok && (e.ok.active = !1);
}
},
_seatOfRoom: function(e) {
for (var t = 0; t < this._n.seats.length; ++t) {
var i = this._n.seats[t];
if (i && i.roomSeat === e) return i;
}
return null;
},
_seatOfUser: function(e) {
for (var t = 0; t < this._n.seats.length; ++t) {
var i = this._n.seats[t];
if (i && i.roomSeat >= 0 && i.player && i.player.userid == e) return i;
}
return null;
},
_ownSeat: function() {
for (var e = 0; e < this._n.seats.length; ++e) {
var t = this._n.seats[e];
if (t && t.player && t.player.userid == this._myUserId) return t;
}
return null;
},
_refreshSeats: function() {
this._layoutSeats(null);
this._updateMbs();
this._refreshSitUI();
},
_setMb: function(e, t) {
if (e && e.mb && e.mbSp) {
var i = this._img(t);
if (i) {
e.mbSp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
e.mbSp.spriteFrame = i;
var n = i.getRect ? i.getRect() : null, a = n ? n.width : 360, s = n ? n.height : 180, o = 0 === e.k ? 280 : 150, r = Math.min(1, o / a);
e.mb.setContentSize(a * r, s * r);
e.mb.active = !0;
} else e.mb.active = !1;
}
},
_updateMbs: function() {
for (var e = 0, t = 0, i = 0; i < this._n.seats.length; ++i) {
var n = this._n.seats[i];
if (n && n.player) {
e++;
n.confirmed && t++;
}
}
for (var a = e > 0 && t >= e, s = 0; s < this._n.seats.length; ++s) {
var o = this._n.seats[s];
if (o && o.player) if (o.cards && o.cards.length) {
var r = o.player.userid == this._myUserId;
if ("arrange" === this._phase) for (var l = this._backFrame(), c = 0; c < o.cards.length; ++c) {
var h = o.cards[c];
if (h) {
if (!h.active) {
h.stopAllActions();
h.active = !0;
}
h.opacity = 255;
var d = h.getComponent(cc.Sprite);
d && l && (d.spriteFrame = l);
}
}
if ("reveal" !== this._phase && "settle" !== this._phase) if ("idle" !== this._phase && "end" !== this._phase && "dealing" !== this._phase) if (a) {
o.mbAnim = !1;
this._setMb(o, null);
} else if (o.confirmed) {
o.mbAnim = !1;
this._setMb(o, "已完成");
} else if (r && this._ownSpecial) {
o.mbAnim = !1;
this._setMb(o, "特殊牌型");
} else {
o.mbAnim = !0;
this._setMb(o, "理牌中-" + (o.mbIdx % 3 + 1));
} else {
o.mbAnim = !1;
this._setMb(o, null);
} else {
o.mbAnim = !1;
this._setMb(o, null);
}
} else console.log("[SSS] 座位没找到牌节点 seat=" + o.k + " uid=" + o.player.userid);
}
},
_mbTick: function() {
if (this._imgsReady) for (var e = 0; e < this._n.seats.length; ++e) {
var t = this._n.seats[e];
if (t && t.player && t.mbAnim) {
t.mbIdx = (t.mbIdx + 1) % 3;
this._setMb(t, "理牌中-" + (t.mbIdx + 1));
}
}
},
onSssReady: function(e) {
if (e) {
var t = null != e.userid ? this._seatOfUser(e.userid) : null;
if (!t && null != e.seatindex) for (var i = cc.vv.gameNetMgr, n = i && i.sssSeats || [], a = 0; a < n.length; ++a) if (n[a] && n[a].seatindex == e.seatindex) {
t = this._seatOfRoom(n[a].roomSeatIndex);
break;
}
if (t) {
t.confirmed = !0;
if (t.player && t.player.userid == this._myUserId && e.auto) {
this._confirmed = !0;
this.renderAll();
}
}
this._updateMbs();
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
this._ownSpecial = B(this._cards, this._roads);
if (e.auto) this._confirmed = !0; else if (this._pendingConfirm) {
this._pendingConfirm = !1;
cc.vv.net.send("sss_confirm");
}
this.renderAll();
this._updateMbs();
}
},
_canArrange: function() {
return "arrange" === this._phase && !this._confirmed && !this._dealing;
},
_renderRow: function(e, t, i) {
if (e) {
for (var n = 0; n < e.cards.length; ++n) {
var a = e.cards[n], s = n < i.length;
a.active = s;
s && this._setCardFrame(a, i[n]);
}
if (e.typeSp) {
var o = L(t, i), r = e.typeSp.getComponent(cc.Sprite);
r && (r.spriteFrame = this._img(o));
e.typeSp.active = !!o;
}
}
},
_renderPanel: function(e) {
if (e) {
e.isAuto || !e.root || e.root.active || this._cleanFlyGhosts(e);
for (var t = 0; t < e.rows.length; ++t) {
var i = l[t];
this._renderRow(e.rows[t], i, this._roads[i] || []);
}
if (e.isAuto) for (var n = 0; n < e.zd.length; ++n) {
var a = e.zd[n], s = this._candidates[n];
a.root.active = !0;
if (s) {
a.root.color = cc.color(255, 255, 255);
for (var o = [ s.head, s.mid, s.tail ], r = 0; r < a.parts.length && r < 3; ++r) {
var c = a.parts[r], h = L(l[r], o[r]), d = c.getComponent(cc.Sprite);
d && (d.spriteFrame = this._img(h));
c.active = !!h;
}
a.root.opacity = n === this._autoIdx ? 255 : 170;
} else {
for (var u = 0; u < a.parts.length; ++u) a.parts[u].active = !1;
a.root.color = cc.color(110, 110, 110);
a.root.opacity = 255;
}
}
}
},
_renderHand: function() {
var e = this._n.manual;
if (e && e.hand.length) {
for (var t = "arrange" === this._phase && !this._autoMode, i = 0; i < e.hand.length; ++i) {
var n = e.hand[i], a = this._hand[i];
n.active = t && null != a;
if (n.active) {
var s = e.handHome[i], o = !!this._picked[a];
n.setPosition(s.x, s.y + (o ? 30 : 0));
n.setScale(s.sx * (o ? 1.06 : 1), s.sy * (o ? 1.06 : 1));
this._setCardFrame(n, a);
}
}
this._refreshTypeBtns();
}
},
_refreshTypeBtns: function() {
var e = this._n.manual;
if (e && e.typeBtns && e.typeBtns.length) for (var t = 0; t < e.typeBtns.length; ++t) {
var i = e.typeBtns[t];
if (i) {
var n = d[t], a = !(!n || !A(n, this._hand));
i.color = a ? cc.color(255, 255, 255) : cc.color(110, 110, 110);
}
}
},
_refreshPhase: function() {
var e = this._n, t = "arrange" === this._phase && !this._confirmed;
e.auto && (e.auto.root.active = t && this._autoMode);
e.manual && (e.manual.root.active = t && !this._autoMode);
e.prepare && (e.prepare.active = "idle" === this._phase || "end" === this._phase && !this._final);
},
_refreshSitUI: function() {
var e = this._ownSeat(), t = this._sat || !!(e && e.player && e.player.ready);
this._n.readyBtn && (this._n.readyBtn.active = !t);
for (var i = "dealing" === this._phase || "arrange" === this._phase || "reveal" === this._phase || "settle" === this._phase || "end" === this._phase, n = 0; n < this._n.seats.length; ++n) {
var a = this._n.seats[n];
if (a && a.ok) {
var s = !(!a.player || a.player.userid != this._myUserId), o = !(!a.player || !(a.player.ready || s && this._sat));
s && this._playedOnce && (o = !1);
a.ok.active = !i && o;
}
}
},
_refreshCountdown: function() {
var e = this._autoMode ? this._n.auto : this._n.manual;
if (e) {
var t = "arrange" === this._phase && !this._confirmed;
e.cdRoot && (e.cdRoot.active = t);
e.cdLabel && (e.cdLabel.string = t ? String(Math.max(0, this._leftSec || 0)) : "");
}
},
renderAll: function() {
this._roundRevealed || "reveal" === this._phase || "settle" === this._phase || this._repaintBacks();
this._refreshPhase();
this._renderPanel(this._n.auto);
this._renderPanel(this._n.manual);
this._renderHand();
this._refreshCountdown();
this._updateMbs();
this._refreshSitUI();
},
_tick: function() {
for (var e = cc.vv && cc.vv.gameNetMgr, t = e && e.seats || [], i = "", n = 0; n < t.length; ++n) i += (t[n] && t[n].userid || 0) + ",";
if (i !== this._seatSig) {
this._seatSig = i;
this._refreshSeats();
}
if ("dealing" !== this._phase) {
if ("arrange" === this._phase) {
this._arrangeDeadline ? this._leftSec = Math.max(0, Math.ceil((this._arrangeDeadline - Date.now()) / 1e3)) : this._leftSec > 0 && !this._confirmed && this._leftSec--;
this._refreshCountdown();
}
} else {
this._dealingSec++;
if (this._dealingSec >= 10) {
this._dealing = !1;
this._enterArrange();
}
}
},
_buildCandidates: function() {
this._candidates = this._cards.length >= 13 ? M(this._cards.slice(), 4) : [];
},
_applyCandidate: function(e) {
var t = this._candidates[e];
if (t) {
this._autoIdx = e;
this._roads = {
head: t.head.slice(),
mid: t.mid.slice(),
tail: t.tail.slice()
};
this._hand = [];
this._picked = {};
this._ownSpecial = B(this._cards, this._roads);
}
},
onPickCandidate: function(e) {
if (this._canArrange() && this._autoMode && this._candidates[e]) {
this._applyCandidate(e);
this.renderAll();
}
},
onAuto: function() {
if (this._canArrange()) {
this._autoMode = !0;
this._picked = {};
this._candidates.length || this._buildCandidates();
if (this._candidates.length) {
for (var e = this._roads, t = -1, i = 0; i < this._candidates.length; ++i) if (this._sameRoads(e, this._candidates[i])) {
t = i;
break;
}
this._applyCandidate(t >= 0 ? t : 0);
this.renderAll();
} else this._toast("自动摆牌失败");
}
},
_sameRoads: function(e, t) {
return !(!e || !t) && (e.head || []).slice().sort().join(",") + "|" + (e.mid || []).slice().sort().join(",") + "|" + (e.tail || []).slice().sort().join(",") == t.head.slice().sort().join(",") + "|" + t.mid.slice().sort().join(",") + "|" + t.tail.slice().sort().join(",");
},
onManual: function() {
if (this._canArrange()) {
this._autoMode = !1;
this._picked = {};
this._roads = {
head: [],
mid: [],
tail: []
};
this._hand = this._cards.slice().sort(function(e, t) {
return e - t;
});
this.renderAll();
}
},
onReopen: function() {
if (this._canArrange()) {
this._picked = {};
if (this._autoMode) {
this._buildCandidates();
this._candidates.length && this._applyCandidate(0);
} else {
this._roads = {
head: [],
mid: [],
tail: []
};
this._hand = this._cards.slice().sort(function(e, t) {
return e - t;
});
}
this.renderAll();
}
},
_pickedIds: function() {
for (var e = [], t = 0; t < this._hand.length; ++t) this._picked[this._hand[t]] && e.push(this._hand[t]);
return e;
},
onTypeBtn: function(e) {
if (this._canArrange() && !this._autoMode) {
var t = d[e];
if (t) {
var i = A(t, this._hand);
if (i && i.length) {
this._picked = {};
for (var n = 0; n < i.length; ++n) this._picked[i[n]] = !0;
this._renderHand();
} else this._toast("手牌中没有该牌型");
}
}
},
onHandTap: function(e) {
if (this._canArrange() && !this._autoMode) {
var t = this._hand[e];
if (null != t) {
this._picked[t] ? delete this._picked[t] : this._picked[t] = !0;
this._renderHand();
}
}
},
onRowTap: function(e) {
if (this._canArrange() && !this._autoMode) {
var t = this._pickedIds();
t.length ? this._placeInto(e, t) : this._toast("先选择手牌");
}
},
onRowCardTap: function(e, t) {
if (this._canArrange() && !this._autoMode) {
var i = this._roads[e] || [];
if (t >= i.length) {
var n = this._pickedIds();
n.length && this._placeInto(e, n);
} else if (this._pickedIds().length) this._placeInto(e, this._pickedIds()); else {
var a = i.splice(t, 1)[0];
this._hand.push(a);
this._hand.sort(function(e, t) {
return e - t;
});
this.renderAll();
}
}
},
_placeInto: function(e, t) {
var i = a[e], n = this._roads[e] || (this._roads[e] = []), s = i - n.length;
if (s <= 0) this._toast(o[e] + "已满"); else {
var r = t.slice(0, s);
this._flyCards(r, e);
for (var l = 0; l < r.length; ++l) {
var c = r[l], h = this._hand.indexOf(c);
h >= 0 && this._hand.splice(h, 1);
delete this._picked[c];
n.push(c);
}
this._renderHand();
this._renderPanel(this._n.manual);
}
},
_flyCards: function(e, t) {
var i = this._n.manual;
if (i && i.root) {
var n = i.rows[c[t]];
if (n) for (var a = (this._roads[t] || []).length, s = 0; s < e.length; ++s) {
var o = this._handNodeOf(e[s]), r = n.cards[a + s];
if (o && r) {
var l = i.root.convertToNodeSpaceAR(o.convertToWorldSpaceAR(cc.v2(0, 0))), h = i.root.convertToNodeSpaceAR(r.convertToWorldSpaceAR(cc.v2(0, 0))), d = new cc.Node("sssFly"), u = d.addComponent(cc.Sprite);
u.sizeMode = cc.Sprite.SizeMode.CUSTOM;
u.spriteFrame = this._frameOf(e[s]);
d.setContentSize(150, 195);
d.zIndex = 999;
i.root.addChild(d);
d.setPosition(l);
d.runAction(cc.sequence(cc.moveTo(.2, h).easing(cc.easeQuadraticActionIn()), cc.callFunc(function() {
d.destroy();
})));
}
}
}
},
_cleanFlyGhosts: function(e) {
if (e && e.root) for (var t = e.root.children.slice(), i = 0; i < t.length; ++i) t[i] && "sssFly" === t[i].name && t[i].destroy();
},
_handNodeOf: function(e) {
var t = this._n.manual;
if (!t) return null;
var i = this._hand.indexOf(e);
return i < 0 || i >= t.hand.length ? null : t.hand[i];
},
onOk: function() {
if ("arrange" === this._phase && !this._confirmed) {
var e = this._roads.head, t = this._roads.mid, i = this._roads.tail;
if (3 == e.length && 5 == t.length && 5 == i.length) {
if (!B(this._cards, this._roads)) {
if (y(C(e), b(t)) > 0) {
this._toast("倒水：前道不能大于中道");
return;
}
if (y(b(t), b(i)) > 0) {
this._toast("倒水：中道不能大于后道");
return;
}
}
this._pendingConfirm = !0;
this._confirmed = !0;
var n = this._ownSeat();
n && (n.confirmed = !0);
cc.vv.net.send("sss_arrange", {
head: e,
mid: t,
tail: i
});
this.renderAll();
this._updateMbs();
} else this._toast("请把 13 张牌全部摆到三道中");
}
},
onResult: function(e) {
if (e) {
this._cancelReveal();
this._lastResult = e;
this._resultByRoom = {};
for (var t = e.results || [], i = 0; i < t.length; ++i) t[i] && (this._resultByRoom[i] = t[i]);
this._phase = "reveal";
this._revealing = !0;
this._dealing = !1;
this._confirmed = !0;
this._final = !1;
this._picked = {};
this._n.auto && (this._n.auto.root.active = !1);
this._n.manual && (this._n.manual.root.active = !1);
this._n.prepare && (this._n.prepare.active = !1);
this._n.settle && (this._n.settle.active = !1);
this._n.gameResult && (this._n.gameResult.active = !1);
this._resetSeatsCards(!0);
for (var n = [], a = 0; a < this._n.seats.length; ++a) {
var s = this._n.seats[a];
if (s && s.player) {
var o = this._resultByRoom[s.roomSeat];
if (o) {
s.results = o;
s.special = o.special || null;
s.revealed = {};
s.confirmed = !0;
this._paintSeat(o, s, !1);
o.special && this._showSeatSpecial(s);
n.push(s);
}
}
}
this._updateMbs();
for (var r = [], l = [ "head", "mid", "tail" ], c = 0; c < l.length; ++c) for (var h = 0; h < n.length; ++h) r.push({
seat: n[h],
road: l[c]
});
var d = this, u = 0, g = null, v = ++this._revealToken;
this._revealTimer = setTimeout(function e() {
if (cc.isValid(d.node) && v === d._revealToken) if (u >= r.length) d._finishReveal(); else {
var t = r[u++];
if (g && g !== t.road) {
d._hideRoadBadges(g);
d._restoreRoadAll(g);
}
g = t.road;
var i = t.seat.results.arrange && t.seat.results.arrange[t.road] || [];
d._revealRoad(t.seat, t.road, i);
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX("fanpai.mp3");
d._revealTimer = setTimeout(e, 420);
}
}, 500);
}
},
_paintSeat: function(e, t, i) {
var n = e && e.arrange || {};
this._paintRoad(t, "head", n.head || [], i);
this._paintRoad(t, "mid", n.mid || [], i);
this._paintRoad(t, "tail", n.tail || [], i);
},
_paintRoad: function(e, t, i, n) {
for (var a = s[t], o = 0; o < i.length; ++o) {
var r = e.cards[a + o];
if (r) {
r.active = !0;
var l = r.getComponent(cc.Sprite);
l && (l.spriteFrame = n ? this._frameOf(i[o]) : this._backFrame());
}
}
},
_repaintBacks: function() {
var e = this._backFrame();
if (e) for (var t = 0; t < this._n.seats.length; ++t) {
var i = this._n.seats[t];
if (i && i.player) for (var n = 0; n < i.cards.length; ++n) {
var a = i.cards[n];
if (a.active) {
var s = a.getComponent(cc.Sprite);
s && (s.spriteFrame = e);
}
}
} else if (!this._warnedBack) {
this._warnedBack = !0;
console.log("[SSS] card_back.png 未加载");
}
},
_paintAllResults: function() {
for (var e = 0; e < this._n.seats.length; ++e) {
var t = this._n.seats[e];
if (t && t.results) for (var i = t.results.arrange || {}, n = 0; n < l.length; ++n) {
var a = l[n];
this._paintRoad(t, a, i[a] || [], !(!t.revealed || !t.revealed[a]));
}
}
},
_restoreRoad: function(e) {
this._restoreChildOrder(e);
},
_restoreAllRoadsNow: function() {
for (var e = 0; e < this._n.seats.length; ++e) {
var t = this._n.seats[e];
t && t.cards && this._restoreChildOrder(t);
}
},
_restoreChildOrder: function(e) {
var t = e && e.childOrder;
if (t && t.length && e.box) for (var i = 0; i < t.length; ++i) {
var n = t[i];
n && cc.isValid(n) && n.parent === e.box && n.getSiblingIndex() !== i && n.setSiblingIndex(i);
}
},
_restoreRoadAll: function(e) {
for (var t = 0; t < this._n.seats.length; ++t) {
var i = this._n.seats[t];
i && this._restoreRoad(i, e);
}
},
_revealRoad: function(e, t, i) {
if (e && i && i.length) {
e.revealed = e.revealed || {};
e.revealed[t] = !0;
e.specialBadge && (e.specialBadge.active = !1);
var n = this._dispIds(i);
this._playSpot(e, t, n);
}
},
_dispIds: function(e) {
for (var t = {}, i = 0; i < e.length; ++i) {
var n = _(e[i]);
t[n] = (t[n] || 0) + 1;
}
return e.slice().sort(function(e, i) {
var n = _(e), a = _(i);
return t[n] != t[a] ? t[a] - t[n] : n != a ? a - n : f(i) - f(e);
});
},
_playSpot: function(e, t, i) {
var n = this, a = e.spots && e.spots[t];
if (a && a.root && cc.isValid(a.root)) {
for (var s = 0; s < a.cards.length; ++s) {
var o = a.cards[s], r = s < i.length;
o.active = r;
var l = o.getComponent(cc.Sprite);
l && (l.spriteFrame = r ? this._frameOf(i[s]) : null);
}
var c = L(t, i);
if (a.dao) {
var h = a.dao.getComponent(cc.Label);
h && (h.string = c || "");
a.dao.active = !!c;
}
a.root.active = !0;
a.root.opacity = 255;
a.root.stopAllActions();
a.root.setScale(a.bx, a.by);
a.root.parent && a.root.setSiblingIndex(a.root.parent.children.length - 1);
a.root.runAction(cc.sequence(cc.scaleTo(.16, 1.18 * a.bx, 1.18 * a.by).easing(cc.easeSineOut()), cc.scaleTo(.16, a.bx, a.by).easing(cc.easeSineIn()), cc.scaleTo(.16, 1.18 * a.bx, 1.18 * a.by).easing(cc.easeSineOut()), cc.scaleTo(.16, a.bx, a.by).easing(cc.easeSineIn()), cc.delayTime(.12), cc.callFunc(function() {
if (cc.isValid(a.root)) {
a.root.active = !1;
a.root.setScale(a.bx, a.by);
n._flipRoad(e, t, i);
}
})));
} else this._flipRoad(e, t, i);
},
_hideSpots: function() {
for (var e = 0; e < this._n.seats.length; ++e) {
var t = this._n.seats[e];
if (t && t.spots) for (var i in t.spots) {
var n = t.spots[i];
if (n && n.root && cc.isValid(n.root)) {
n.root.stopAllActions();
n.root.active = !1;
n.root.setScale(n.bx, n.by);
}
}
}
},
_flipRoad: function(e, t, i) {
for (var n = s[t], a = e.box, o = [], r = 0; r < i.length; ++r) {
var l = e.cards[n + r];
if (l) {
l.stopAllActions();
l.active = !0;
l.opacity = 255;
var c = l.getComponent(cc.Sprite);
c && (c.spriteFrame = this._frameOf(i[r]));
o.push(l);
}
}
var h = e.childOrder || [];
o.sort(function(e, t) {
return h.indexOf(e) - h.indexOf(t);
});
for (var d = 0; d < o.length; ++d) a && o[d].setSiblingIndex(a.children.length - 1);
this._showRoadBadge(e, t, i);
},
_showSeatSpecial: function(e) {
if (e && e.box) {
if (!e.specialBadge) {
var t = new cc.Node("sssSpecial");
t.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
t.setContentSize(0 === e.k ? 240 : 160, 0 === e.k ? 110 : 74);
t.zIndex = 300;
e.box.addChild(t);
e.specialBadge = t;
}
var i = e.specialBadge.getComponent(cc.Sprite);
i && (i.spriteFrame = this._img("特殊牌型"));
e.specialBadge.active = !0;
e.specialBadge.setPosition(0, 0 === e.k ? 20 : 10);
e.specialBadge.setSiblingIndex(e.box.children.length - 1);
}
},
_showRoadBadge: function(e, t, i) {
if (e && e.box) {
var n = L(t, i);
if (n) {
e.badges || (e.badges = {});
var a = e.badges[t];
if (!a) {
(a = new cc.Node("sssBadge_" + t)).addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
a.setContentSize(0 === e.k ? 150 : 116, 0 === e.k ? 75 : 58);
a.zIndex = 200;
e.box.addChild(a);
e.badges[t] = a;
}
var o = this._img(n), r = a.getComponent(cc.Sprite);
r && (r.spriteFrame = o);
a.active = !!o;
a.opacity = 255;
for (var l = s[t], c = 0, h = 0, d = 0, u = 0; u < i.length; ++u) {
var g = e.cards[l + u];
if (g) {
c += g.x;
h += g.y;
d++;
}
}
if (d) {
c /= d;
h = h / d + (0 === e.k ? 10 : 5);
a.setPosition(c, h);
}
a.setSiblingIndex(e.box.children.length - 1);
a.stopAllActions();
a.setScale(.6, .6);
a.runAction(cc.scaleTo(.12, 1, 1).easing(cc.easeBackOut()));
}
}
},
_hideRoadBadges: function(e) {
for (var t = 0; t < this._n.seats.length; ++t) {
var i = this._n.seats[t];
if (i && i.badges) {
var n = i.badges[e];
if (n && n.active) {
n.stopAllActions();
n.runAction(cc.sequence(cc.fadeOut(.18), cc.callFunc(function() {
this.active = !1;
this.opacity = 255;
}, n)));
}
}
}
},
_finishReveal: function() {
this._revealing = !1;
this._phase = "settle";
this._roundRevealed = !0;
for (var e = 0; e < this._n.seats.length; ++e) {
var t = this._n.seats[e];
if (t && t.player) {
var i = this._resultByRoom[t.roomSeat];
t.results = i || t.results;
}
}
this._updateMbs();
for (var n = 0; n < this._n.seats.length; ++n) {
var a = this._n.seats[n];
if (a && a.player) {
var s = this._resultByRoom[a.roomSeat];
if (s) {
var o = s.delta || 0;
if (a.summary) {
a.summary.node.active = !0;
a.summary.string = (o >= 0 ? "+" : "") + o;
}
a.scoreLb && (a.scoreLb.string = "分数:" + (null != s.totalscore ? s.totalscore : o));
}
}
}
var r = this;
this.scheduleOnce(function() {
if (cc.isValid(r.node)) {
r._hideRoadBadges("head");
r._hideRoadBadges("mid");
r._hideRoadBadges("tail");
r._restoreRoadAll("tail");
if (r._pendingGameEnd) {
var e = r._pendingGameEnd;
r._pendingGameEnd = null;
r.onGameEnd(e);
}
}
}, 1.1);
this.scheduleOnce(function() {
cc.isValid(r.node) && r._showSettle();
}, 1.5);
this._refreshSitUI();
for (var l = null, c = 0; c < this._n.seats.length; ++c) {
var h = this._n.seats[c];
if (h && h.player && h.player.userid == this._myUserId) {
l = h;
break;
}
}
var d = l && l.results && l.results.delta || 0;
cc.vv && cc.vv.audioMgr && cc.vv.audioMgr.playSFX(d >= 0 ? "win.wav" : "lose.wav");
},
_showSettle: function() {
var e = this._n.settle;
if (e) {
var t = this._labelOf(this._findIn(e, "settleTitle"));
if (t) {
t.node.active = !0;
t.string = "本局结算";
}
var i = this._findIn(e, "bbSettleCards");
i && (i.active = !1);
for (var n = [], a = 0; a < this._n.seats.length; ++a) {
var s = this._n.seats[a];
if (s && s.player) {
var o = this._resultByRoom[s.roomSeat];
if (o) {
var r = o.delta || 0, l = (o.name || s.player.name || "玩家") + "  " + (r >= 0 ? "+" : "") + r;
null != o.totalscore && (l += "  (总 " + o.totalscore + ")");
o.special && (l += "  " + o.special);
o.gun > 0 && (l += "  打枪×" + o.gun);
n.push(l);
}
}
}
var c = this._findIn(e, "settleContent"), h = this._labelOf(c);
if (h) {
c.active = !0;
h.string = n.join("\n");
}
var d = this._labelOf(this._findIn(e, "settleRound"));
if (d) {
var u = cc.vv && cc.vv.gameNetMgr, g = u && u.numOfGames || 0, v = u && u.maxNumOfGames || 0;
d.string = g > 0 ? "第" + g + (v ? "/" + v : "") + "局" : "";
}
e.active = !0;
}
},
onGameEnd: function(e) {
if (this._revealing || "reveal" === this._phase) this._pendingGameEnd = e; else {
this._cancelReveal();
this._restoreAllRoadsNow();
this._phase = "end";
this._revealing = !1;
this._final = !0;
this._n.settle && (this._n.settle.active = !1);
for (var t = [], i = e && e.endinfo || [], n = 0; n < i.length; ++n) {
var a = i[n], s = a.score || 0;
t.push((a.name || "玩家") + "   " + (s >= 0 ? "+" : "") + s);
}
var o = this._labelOf(this._findIn(this._n.gameResult, "bbFinalInfo"));
o && (o.string = t.length ? t.join("\n") : "本局结束");
this._n.gameResult && (this._n.gameResult.active = !0);
this.renderAll();
}
},
onReady: function() {
var e = cc.vv && cc.vv.gameNetMgr;
if (e && e.maxNumOfGames > 0 && e.numOfGames >= e.maxNumOfGames) this._toast("已是最后一局"); else {
cc.vv.net.send("ready");
var t = this._ownSeat();
t && t.player && (t.player.ready = !0);
this._n.settle && (this._n.settle.active = !1);
this._n.gameResult && (this._n.gameResult.active = !1);
this._phase = "idle";
this._final = !1;
this._confirmed = !1;
this.renderAll();
}
},
onBtnSettingsClicked: function() {
var e = this._find("settings");
e && (e.active = !0);
},
showTip: function(e) {
this._toast(e);
},
_toast: function(e) {
if (e) {
if (!this._toastNode || !cc.isValid(this._toastNode)) {
var t = new cc.Node("sssToast"), i = t.addComponent(cc.Label);
i.fontSize = 34;
i.lineHeight = 44;
i.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
i.enableWrapText = !1;
var n = t.addComponent(cc.LabelOutline);
n.color = cc.color(0, 0, 0, 220);
n.width = 3;
t.color = cc.color(255, 236, 140);
t.zIndex = 9999;
this.node.addChild(t);
this._toastNode = t;
}
var a = this._toastNode.getComponent(cc.Label);
a && (a.string = e);
this._toastNode.setPosition(0, 380);
this._toastNode.active = !0;
this._toastNode.stopAllActions();
this._toastNode.opacity = 255;
this._toastNode.runAction(cc.sequence(cc.delayTime(1.6), cc.fadeOut(.35), cc.callFunc(function() {
this._toastNode && (this._toastNode.active = !1);
}, this)));
}
},
_confirm: function(e, t) {
var i = this._n.alert;
if (i) {
var n = this._labelOf(this._findIn(i, "content"));
n && (n.string = e || "");
var a = this._labelOf(this._findIn(i, "title"));
a && (a.string = "提示");
this._confirmOk = t;
i.active = !0;
} else t && t();
},
_cancelReveal: function() {
if (this._revealTimer) {
clearTimeout(this._revealTimer);
this._revealTimer = null;
}
this._revealToken = (this._revealToken || 0) + 1;
this._n && this._n.seats && this._hideSpots();
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
this._confirm("解散房间将结束本局, 是否确定解散?", function() {
"begin" == cc.vv.gameNetMgr.gamestate || "dealing" === e._phase || "arrange" === e._phase || "reveal" === e._phase ? cc.vv.net.send("dissolve_request") : cc.vv.net.send("dispress");
});
},
leaveRoom: function() {
if (!this._leaving) {
this._leaving = !0;
var e = cc.director.getScene ? cc.director.getScene() : null, t = e && e.name ? e.name : "";
if ("hall" !== t && "club" !== t) {
var i = cc.vv.gameNetMgr;
i && i.exitToTableHall ? i.exitToTableHall() : cc.vv.sceneMgr ? cc.vv.sceneMgr.load("club") : cc.director.loadScene("club");
}
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
var e = this.node.getChildByName("name");
this._lblName = e ? e.getComponent(cc.Label) : null;
var t = this.node.getChildByName("icon");
t && this._lblName && (this._lblName.node.width = t.width + 16);
if (this._lblName) {
this._lblName.fontSize = Math.min(this._lblName.fontSize, 18);
this._lblName.lineHeight = this._lblName.fontSize + 2;
this._lblName.enableWrapText = !1;
this._lblName.overflow = cc.Label.Overflow.CLAMP;
}
var i = this.node.getChildByName("score");
this._lblScore = i ? i.getComponent(cc.Label) : null;
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
var n = this._ncSprite.getChildByName("name"), a = this._ncSprite.getChildByName("score");
this._ncLblName = n ? n.getComponent(cc.Label) : null;
this._ncLblScore = a ? a.getComponent(cc.Label) : null;
this._ncSprite.active = !1;
}
this._chatBubble = this.node.getChildByName("ChatBubble");
if (null != this._chatBubble) {
this._chatBubble.active = !1;
var s = this._chatBubble.getChildByName("New Label");
s && (s.active = !1);
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
this._ready && (this._ready.active = this._isReady && this._canShowReady());
this._zhuang && (this._zhuang.active = this._isZhuang);
this.node.active = !0;
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
var l = t.getComponent(cc.Label);
l && (l.string = "老庄" + e);
}
},
_canShowReady: function() {
return !(!cc.vv || !cc.vv.gameNetMgr || 0 != cc.vv.gameNetMgr.numOfGames);
},
setReady: function(e) {
this._isReady = e;
this._ready && (this._ready.active = this._isReady && this._canShowReady());
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
var t = cc.vv && cc.vv.emojiSpines ? cc.vv.emojiSpines[e] : null;
if (t) this._showEmojiSpine(t); else {
this._clearEmojiSpine(!0);
this._emoji.getComponent(cc.Animation).play(e);
this._lastChatTime = 3;
}
}
},
_showEmojiSpine: function(e) {
this._clearEmojiSpine(!1);
var t = this._emoji.getComponent(cc.Sprite);
t && (t.enabled = !1);
var i = this._emoji.getComponent(cc.Animation);
i && i.stop();
var n = e.skeletonJson && e.skeletonJson.skeleton, a = n && n.width || 240, s = n && n.height || 270, o = this._emoji.width > 0 ? this._emoji.width : 160, r = this._emoji.height > 0 ? this._emoji.height : 160, l = .9 * Math.min(o / a, r / s), c = new cc.Node("emojiSpine");
c.parent = this._emoji;
c.setPosition(0, 0);
c.scale = l;
c.runAction(cc.sequence(cc.scaleTo(.12, 1.4 * l), cc.scaleTo(.18, l)));
var h = c.addComponent(sp.Skeleton);
h.skeletonData = e;
h.setAnimation(0, "animation", !0);
this._emojiSpineNode = c;
this._lastChatTime = 3;
},
_clearEmojiSpine: function(e) {
if (this._emojiSpineNode && cc.isValid(this._emojiSpineNode)) {
this._emojiSpineNode.stopAllActions();
this._emojiSpineNode.destroy();
}
this._emojiSpineNode = null;
if (e && this._emoji) {
var t = this._emoji.getComponent(cc.Sprite);
t && (t.enabled = !0);
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
this._clearEmojiSpine(!1);
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
_alertTime: -1,
_hideUntilFirstDiscard: !1
},
onLoad: function() {
var e = this.node.getChildByName("game");
this._arrow = e.getChildByName("arrow");
this._pointer = this._arrow.getChildByName("pointer");
this._timeLabel = this._arrow.getChildByName("lblTime").getComponent(cc.Label);
this._timeLabel.string = "00";
this._hideUntilFirstDiscard = this._noDiscardYet();
this.initPointer();
var t = this;
this.node.on("game_begin", function() {
t._hideUntilFirstDiscard = t._noDiscardYet();
t.startTurn();
});
this.node.on("game_start", function() {
t._hideUntilFirstDiscard = t._noDiscardYet();
t.startTurn();
});
this.node.on("game_chupai", function() {
t._hideUntilFirstDiscard = !1;
t.startTurn();
});
this.node.on("game_mopai", function() {
t.startTurn();
});
},
_noDiscardYet: function() {
var e = cc.vv ? cc.vv.gameNetMgr : null, t = e ? e.seats : null;
if (!t) return !1;
for (var i = 0; i < t.length; ++i) {
var n = t[i];
if (n && n.folds instanceof Array && n.folds.length > 0) return !1;
}
return !0;
},
startTurn: function() {
if (this._hideUntilFirstDiscard) {
this._arrow && (this._arrow.active = !1);
this._time = -1;
} else {
this.initPointer();
if (this._arrow.active) {
var e = cc.vv.gameNetMgr.chupaiTimeout;
(null == e || e <= 0) && (e = 15);
this._time = e;
this._alertTime = 3;
}
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
"/income_stats": "/club_admin/income_stats",
"/club_members_detail": "/club_admin/members",
"/partners": "/club_admin/partners",
"/rewards": "/club_admin/rewards",
"/reward_claim": "/club_admin/reward_claim",
"/reward_claim_all": "/club_admin/reward_claim_all",
"/club_game_configs": "/club_admin/game_configs",
"/game_unified": "/club_admin/game_unified",
"/partner/gems": "/club_admin/partner_gems",
"/partner/ratio": "/club_admin/partner_ratio",
"/partner/profit": "/club_admin/partner_profit",
"/partner/bean_logs": "/club_admin/partner_bean_logs",
"/partner_members": "/club_admin/partner_members",
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
this._pagers = {};
this._memberPageNo = 1;
this._partnerPageNo = 1;
this._partnerStatsPageNo = 1;
this._rewardPageNo = 1;
this._incomePageNo = 1;
this._tablePageNo = 1;
this._pagerSeq = 0;
this._statMonth = this._fmtYM(new Date());
this._statFrom = null;
this._statTo = null;
this._statPartnerId = 0;
this._statPartnerName = "";
this._bindUI();
this._loadClubInfo();
this._showPage("overview", !0);
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
this._codeiLabel = this._find("jlbcodei");
this._codeiLabel && (this._codeiLabel.active = !1);
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
var o = this._find("menu_xitosz"), r = this._find("overviewxitosz");
if (o && r) {
this._menuBtns.xitosz = o;
this._pages.xitosz = r;
var l = cc.vv && "boolean" == typeof cc.vv.adminClubTop ? cc.vv.adminClubTop : null;
o.active = !1 !== l;
o.on(cc.Node.EventType.TOUCH_END, function() {
e._showPage("xitosz");
});
}
this._bindOverviewPage();
this._bindMemberPage();
this._bindPartnerPage();
this._bindPartnerStatsPage();
this._bindRewardPage();
this._bindGameConfigPage();
this._bindPopups();
this._bindSysFeePage();
this._showPage("overview", !0);
},
_resolveClubId: function() {
var e = cc.vv && cc.vv.adminClubId ? parseInt(cc.vv.adminClubId) : 0;
e > 0 || (e = parseInt(cc.sys.localStorage.getItem("admin_club_id")) || 0);
return e > 0 ? e : 0;
},
_bindOverviewPage: function() {
var e = this, t = this._find("card_11");
t && (t.getChildByName("cxSprite") || t).on(cc.Node.EventType.TOUCH_END, function() {
e._showIncomeStatsDialog();
});
var i = [ "今日累收", "昨日累收", "前日累收", "当日实收", "昨日实收", "前日实收", "当日人次", "昨日人次", "前日人次", "整链总乐豆", "总人数" ];
this._overviewLabels = {};
for (var n = 0; n < i.length; n++) {
var a = this._find("card_" + n);
if (a) {
var s = a.getChildByName("value");
s && (this._overviewLabels[i[n]] = s);
}
}
},
_renderOverview: function() {
var e = this._overview;
(e.club_name || e.club_id) && this._clubInfoLabel && (this._clubInfoLabel.getComponent(cc.Label).string = (e.club_name || "未命名俱乐部") + "  (ID:" + (e.club_id || this._clubId || 0) + ")");
this._myGemsLabel && (this._myGemsLabel.getComponent(cc.Label).string = "我的豆豆: " + (e.my_gems || 0));
if (this._codeiLabel) {
var t = (Number(e.parent_clubid) || 0) > 0;
this._codeiLabel.active = t;
if (t) {
var i = Number(e.parent_profit_ratio) || 0, n = Number(e.parent_hidden_profit_ratio) || 0, a = Number(e.parent_fee_profit_ratio) || 0;
this._codeiLabel.getComponent(cc.Label).string = "我的抽点数：" + i + "/" + n + "/" + a + "%";
}
}
var s = cc.vv && "boolean" == typeof cc.vv.adminClubTop ? cc.vv.adminClubTop : null, o = e && e.club_id ? !((Number(e.parent_clubid) || 0) > 0) : !1 !== s;
if (this._menuBtns && this._menuBtns.xitosz) {
this._menuBtns.xitosz.active = o;
o || "xitosz" !== this._currentPage || this._showPage("overview");
}
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
_showIncomeStatsDialog: function() {
var e = this._incomeStatsWin || this._find("incomeStatsWin");
if (e) {
this._incomeStatsWin = e;
this._statDrop && (this._statDrop.active = !1);
this._refreshStatFilters();
e.active = !0;
e.setSiblingIndex(9999);
this._queryIncomeStats();
}
},
_fmtYM: function(e) {
var t = e.getMonth() + 1;
return e.getFullYear() + "-" + (t < 10 ? "0" + t : t);
},
_fmtDay: function(e) {
var t = e.getMonth() + 1, i = e.getDate();
return e.getFullYear() + "-" + (t < 10 ? "0" + t : t) + "-" + (i < 10 ? "0" + i : i);
},
_fmtDateTime: function(e) {
var t = Number(e) || 0;
if (t <= 0) return "-";
var i = new Date(1e3 * t), n = function(e) {
return e < 10 ? "0" + e : "" + e;
};
return i.getFullYear() + "-" + n(i.getMonth() + 1) + "-" + n(i.getDate()) + " " + n(i.getHours()) + ":" + n(i.getMinutes());
},
_btnLabel: function(e) {
if (!e) return null;
var t = e.getChildByName("TEXT_LABEL") || e.getChildByName("Label") || e.children[0];
return t ? t.getComponent(cc.Label) : null;
},
_refreshStatFilters: function() {
this._statMonthLabel && (this._statMonthLabel.string = this._statMonth || "选择月份");
this._statFromLabel && (this._statFromLabel.string = this._statFrom ? this._fmtDay(this._statFrom) : "开始日期");
this._statToLabel && (this._statToLabel.string = this._statTo ? this._fmtDay(this._statTo) : "结束日期");
this._statPidLabel && (this._statPidLabel.string = this._statPartnerId > 0 ? this._statPartnerName || "俱乐部 " + this._statPartnerId : "全部俱乐部");
},
_queryIncomeStats: function() {
var e = this;
if (this._canRequest()) {
var t = new Date(), i = null, a = null;
if (this._statMonth) {
var s = String(this._statMonth).split("-"), o = parseInt(s[0]), r = parseInt(s[1]);
if (o > 0 && r > 0) {
i = new Date(o, r - 1, 1);
a = new Date(o, r, 1);
}
}
if (!i) {
this._statFrom && (i = new Date(this._statFrom.getFullYear(), this._statFrom.getMonth(), this._statFrom.getDate()));
this._statTo && (a = new Date(this._statTo.getFullYear(), this._statTo.getMonth(), this._statTo.getDate() + 1));
i || (i = new Date(t.getFullYear(), t.getMonth(), 1));
a || (a = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1));
}
var l = Math.floor(i.getTime() / 1e3), c = Math.floor(a.getTime() / 1e3), h = this._statPartnerId || 0;
this._incomePageNo = 1;
n("/income_stats", {
club_id: this._clubId,
from: l,
to: c,
partner_club_id: h
}, function(t) {
if (t && 0 === t.errcode) e._renderIncomeStats(t); else {
e._renderIncomeStats({
total: 0,
list: []
});
t && t.errmsg && e._toast && e._toast(t.errmsg);
}
});
}
},
_toggleStatDrop: function(e) {
var t = this._statDrop;
if (t) if (t.active && this._statDropKind === e) t.active = !1; else {
this._statDropKind = e;
this._renderStatDrop(e);
t.active = !0;
var i = "partner" === e ? this._statPidBtn : this._statMonthBtn;
if (i && i.parent) {
var n = i.parent.convertToWorldSpaceAR(i.position), a = t.parent.convertToNodeSpaceAR(n);
t.setPosition(a.x, a.y - i.height / 2 - 4 - t.height / 2);
}
t.setSiblingIndex(t.parent.children.length - 1);
}
},
_renderStatDrop: function(e) {
var t = this._statDrop;
if (t) {
var i = t.getChildByName("dropItemTpl");
if (i) {
var n = t.getComponent(cc.Layout);
n && (n.enabled = !1);
this._clearList(t, i);
i.active = !1;
var a = this, s = [];
if ("partner" === e) {
s.push({
key: 0,
text: "全部俱乐部"
});
for (var o = this._partners || [], r = 0; r < o.length; r++) {
var l = o[r];
1 === (l.level || 1) && s.push({
key: Number(l.id) || 0,
text: (l.name || "未命名") + " (ID:" + l.id + ")"
});
}
} else for (var c = new Date(), h = 0; h < 12; h++) {
var d = this._fmtYM(new Date(c.getFullYear(), c.getMonth() - h, 1));
s.push({
key: d,
text: d
});
}
var u = "partner" === e ? this._statPidBtn : this._statMonthBtn, g = u ? u.width : 240, v = i.height || 52, _ = s.length * v + 8;
t.setContentSize(g, _);
for (var f = 0; f < s.length; f++) (function(n, s) {
var o = cc.instantiate(i);
o.active = !0;
o.parent = t;
o.setContentSize(g - 6, v);
o.setPosition(0, _ / 2 - v / 2 - s * v);
var r = o.getChildByName("Label");
if (r) {
r.setContentSize(g - 20, v - 4);
var l = r.getComponent(cc.Label);
if (l) {
l.string = n.text;
l.overflow = cc.Label.Overflow.CLAMP;
l.enableWrapText = !1;
}
}
o.on(cc.Node.EventType.TOUCH_END, function() {
t.active = !1;
if ("partner" === e) {
a._statPartnerId = n.key;
a._statPartnerName = n.text;
} else {
a._statMonth = n.key;
a._statFrom = null;
a._statTo = null;
}
a._refreshStatFilters();
a._queryIncomeStats();
});
})(s[f], f);
}
}
},
_openStatDatePicker: function(e) {
var t = this._datePickerWin;
if (t) if (t.active && this._statPickMode === e) t.active = !1; else {
this._statPickMode = e;
var i = ("from" === e ? this._statFrom : this._statTo) || new Date();
this._pickYear = i.getFullYear();
this._pickMonth = i.getMonth();
this._statDrop && (this._statDrop.active = !1);
t.active = !0;
t.setSiblingIndex(1e4);
this._renderDatePicker();
}
},
_renderDatePicker: function() {
var e = this._datePickerWin;
if (e) {
var t = e.getChildByName("panel");
if (t && t.getChildByName("content")) {
var i = this._pickMonth + 1;
this._pickYmLabel && (this._pickYmLabel.string = this._pickYear + "-" + (i < 10 ? "0" + i : i));
var n = this._dayGrid, a = this._dayTpl;
if (n && a) {
this._clearList(n, a);
a.active = !1;
for (var s = this, o = new Date(this._pickYear, this._pickMonth, 1).getDay(), r = new Date(this._pickYear, this._pickMonth + 1, 0).getDate(), l = a.width, c = a.height, h = -(n.width - l) / 2, d = (n.height - c) / 2, u = 0; u < r; u++) (function(t) {
var i = cc.instantiate(a);
i.active = !0;
i.parent = n;
var r = (o + t - 1) % 7, u = Math.floor((o + t - 1) / 7);
i.setPosition(h + r * l, d - u * c);
var g = i.getChildByName("Label") || i.getChildByName("TEXT_LABEL");
if (g) {
var v = g.getComponent(cc.Label);
v && (v.string = String(t));
var _ = "from" === s._statPickMode ? s._statFrom : s._statTo;
_ && _.getFullYear() === s._pickYear && _.getMonth() === s._pickMonth && _.getDate() === t && (g.color = cc.color(220, 60, 40));
}
i.on(cc.Node.EventType.TOUCH_END, function() {
var i = new Date(s._pickYear, s._pickMonth, t);
if ("from" === s._statPickMode) {
s._statFrom = i;
s._statTo && s._statTo.getTime() < i.getTime() && (s._statTo = null);
} else {
s._statTo = i;
s._statFrom && s._statFrom.getTime() > i.getTime() && (s._statFrom = null);
}
s._statMonth = null;
e.active = !1;
s._refreshStatFilters();
s._queryIncomeStats();
});
})(u + 1);
}
}
}
},
_renderIncomeStats: function(e) {
this._incomeStatsData = e || {
total: 0,
list: []
};
var t = Number(e && e.total) || 0;
this._statTotalLabel && (this._statTotalLabel.string = "总收入：" + t);
var i = this._statListContent, n = this._statRowTpl;
if (i && n) {
for (var a = i.children.slice(), s = 0; s < a.length; s++) a[s] !== n && a[s].destroy();
var o = e && e.list || [], r = this._pageSlice(o, this._incomePageNo, 15);
this._incomePageNo = r.page;
for (var l = 0; l < r.rows.length; l++) {
var c = r.rows[l], h = cc.instantiate(n);
h.active = !0;
h.parent = i;
h.setPosition(0, -40 - 80 * l);
var d = h.getChildByName("date"), u = h.getChildByName("profit");
d && (d.getComponent(cc.Label).string = String(c.day || ""));
u && (u.getComponent(cc.Label).string = String(c.income || 0));
}
var g = i.parent, v = g ? g.height : 600;
i.setContentSize(1020, Math.max(v, 80 * r.rows.length + 10));
i.setPosition(0, v / 2);
if (this._incomeStatsContent) {
var _ = this, f = this._getPager("incomeStats", this._incomeStatsContent, -this._incomeStatsContent.height / 2 + 60);
this._updatePager(f, r.total, r.page, 15, function(e) {
_._incomePageNo = e;
_._renderIncomeStats(_._incomeStatsData);
});
}
}
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
e._memberPageNo = 1;
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
_getPager: function(e, t) {
if (!t) return null;
this._pagers || (this._pagers = {});
var i = this._pagers[e];
if (i && cc.isValid(i.node)) return i;
var n = t.getChildByName("pagerBar");
if (!n) return null;
var a = n.getChildByName("prevBtn"), s = n.getChildByName("nextBtn"), o = n.getChildByName("jumpBtn"), r = n.getChildByName("pageLabel"), l = n.getChildByName("pageInput"), c = r ? r.getComponent(cc.Label) : null, h = l ? l.getComponent(cc.EditBox) : null;
if (h) {
h.string = "";
h.maxLength = 4;
}
var d = {
node: n,
prev: a,
next: s,
jump: o,
label: c,
input: h,
page: 1,
pages: 1,
total: 0,
pageSize: 20,
onGo: null
};
a && a.on(cc.Node.EventType.TOUCH_END, function() {
d.page > 1 && d.onGo && d.onGo(d.page - 1);
});
s && s.on(cc.Node.EventType.TOUCH_END, function() {
d.page < d.pages && d.onGo && d.onGo(d.page + 1);
});
var u = function() {
if (d.input && d.onGo) {
var e = parseInt(d.input.string, 10);
if (e > 0) {
e > d.pages && (e = d.pages);
d.onGo(e);
d.input.string = "";
} else d.input.string = "";
}
};
o && o.on(cc.Node.EventType.TOUCH_END, u);
l && l.on("editing-did-ended", u);
this._pagers[e] = d;
return d;
},
_updatePager: function(e, t, i, n, a) {
if (e) {
var s = Math.max(1, n || 20), o = Math.max(1, Math.ceil(t / s));
e.total = t;
e.pageSize = s;
e.pages = o;
e.page = Math.min(Math.max(1, i), o);
e.onGo = a;
e.node.active = !0;
e.label && (e.label.string = "第 " + e.page + "/" + o + " 页  共 " + t + " 条");
e.prev && (e.prev.opacity = e.page <= 1 ? 110 : 255);
e.next && (e.next.opacity = e.page >= o ? 110 : 255);
e.input && (e.input.string = "");
}
},
_pageSlice: function(e, t, i) {
var n = e.length, a = Math.max(1, Math.ceil(n / i)), s = Math.min(Math.max(1, t || 1), a), o = (s - 1) * i;
return {
page: s,
total: n,
rows: e.slice(o, o + i)
};
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
var a = this._pageSlice(n, this._memberPageNo, 20);
this._memberPageNo = a.page;
for (var s = 0; s < a.rows.length; s++) {
var o = a.rows[s], r = this._createMemberRow(t, o);
if (r) {
r.parent = e;
r.active = !0;
}
}
var l = this._getPager("member", this._pages.member, -this._pages.member.height / 2 + 46), c = this;
this._updatePager(l, a.total, a.page, 20, function(e) {
c._memberPageNo = e;
c._renderMembers();
});
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
for (var s in a) (function(e, a) {
var s = i.getChildByName(a);
if (s) if ("btn_partner" === a && t.is_partner) {
s.opacity = 120;
var o = s.getComponent(cc.Button);
o && (o.interactable = !1);
} else s.on(cc.Node.EventType.TOUCH_END, function() {
n._onMemberAction(e, t);
});
})(a[s], s);
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
this._partnerSearch = t.getChildByName("searchBox");
var n = function() {
e._partnerPageNo = 1;
e._renderPartners();
}, a = t.getChildByName("searchBtn");
a && a.on(cc.Node.EventType.TOUCH_END, n);
this._partnerSearch && this._partnerSearch.on("editing-did-ended", n);
var s = t.getChildByName("partnerScroll");
if (s) {
this._partnerScroll = s;
this._partnerContent = s.getChildByName("content");
this._partnerSv = s.getComponent(cc.ScrollView);
}
if (this._partnerContent) {
var o = this._partnerContent.getComponent(cc.Widget);
o && (o.enabled = !1);
var r = this._partnerContent.getComponent(cc.Layout);
r || (r = this._partnerContent.addComponent(cc.Layout));
r.type = cc.Layout.Type.VERTICAL;
r.resizeMode = cc.Layout.ResizeMode.CONTAINER;
r.verticalDirection = cc.Layout.VerticalDirection.TOP_TO_BOTTOM;
r.spacingY || (r.spacingY = 16);
r.paddingTop || (r.paddingTop = 10);
this._partnerLayout = r;
this._partnerContent.anchorY = 1;
}
}
},
_refreshPartnerScroll: function() {
if (this._partnerContent && this._partnerScroll) {
this._partnerLayout && this._partnerLayout.updateLayout();
this._partnerContent.y = this._partnerScroll.height / 2;
this._partnerSv && this._partnerSv.node.activeInHierarchy && this._partnerSv.scrollToTop(.01);
var e = this._partnerStatsContent, t = this._partnerStatsScroll || this._pages.partnerStats && this._pages.partnerStats.getChildByName("statsScroll");
if (e && t) {
this._partnerStatsLayout || (this._partnerStatsLayout = e.getComponent(cc.Layout));
this._partnerStatsSv || (this._partnerStatsSv = t.getComponent(cc.ScrollView));
this._partnerStatsScroll = t;
this._partnerStatsLayout && this._partnerStatsLayout.updateLayout();
e.y = t.height / 2;
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
}), n = this._partnerSearch ? this._partnerSearch.getComponent(cc.EditBox) : null, a = n ? String(n.string || "").replace(/^\s+|\s+$/g, "") : "";
a && (i = i.filter(function(e) {
return String(e.id).indexOf(a) >= 0 || e.name && e.name.indexOf(a) >= 0 || e.owner_name && e.owner_name.indexOf(a) >= 0 || e.owner_userid && String(e.owner_userid).indexOf(a) >= 0;
}));
console.log("[partnerPage render] direct children count=", i.length, "of total=", this._partners.length, "kw=", a);
var s = this._pageSlice(i, this._partnerPageNo, 20);
this._partnerPageNo = s.page;
for (var o = 0; o < s.rows.length; o++) {
var r = s.rows[o], l = this._createPartnerRow(t, r);
if (l) {
l.parent = e;
l.active = !0;
}
}
var c = this, h = this._getPager("partner", this._pages.partner, -this._pages.partner.height / 2 + 46);
this._updatePager(h, s.total, s.page, 20, function(e) {
c._partnerPageNo = e;
c._renderPartners();
});
var d = e.getComponent(cc.Layout);
d && d.updateLayout();
this._partnerContent.y = this._partnerScroll.height / 2;
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
var a = i.getComponent(cc.Layout);
a || (a = i.addComponent(cc.Layout));
a.type = cc.Layout.Type.VERTICAL;
a.resizeMode = cc.Layout.ResizeMode.CONTAINER;
a.verticalDirection = cc.Layout.VerticalDirection.TOP_TO_BOTTOM;
a.spacingY || (a.spacingY = 16);
a.paddingTop || (a.paddingTop = 10);
this._partnerStatsLayout = a;
i.anchorY = 1;
i.y = t.height / 2;
var s = t.getComponent(cc.ScrollView);
s && (s.content = i);
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
var i = this, n = this._partners.filter(function(e) {
return 1 === (e.level || 1);
}), a = this._pageSlice(n, this._partnerStatsPageNo, 20);
this._partnerStatsPageNo = a.page;
for (var s = 0; s < a.rows.length; s++) {
var o = a.rows[s], r = cc.instantiate(t);
r.name = "stats_" + o.id;
r.active = !0;
r.parent = e;
this._setAvatar(r, "avatar", o.headimg, o.owner_userid);
var l = o.owner_name || "未命名";
this._setLabel(r, "name", o.name || "-");
this._setLabel(r, "uid", l + "(" + o.owner_userid + ")");
this._setLabel(r, "members", String(o.member_count || 0));
this._setLabel(r, "gems", String(Number(o.total_gems) || 0));
this._setRatioLabel(r, this._ratioText(o));
this._setLabel(r, "rake", String(Number(o.today_rake) || 0));
this._setLabel(r, "profit", String(Number(o.today_partner_profit) || 0));
this._setLabel(r, "total", String(Number(o.total_partner_profit) || 0));
var c = r.getChildByName("btn_detail");
c && function(e) {
c.on(cc.Node.EventType.TOUCH_END, function() {
i._showPartnerBeanLogs(e);
});
}(o);
var h = r.getChildByName("btn_sub");
h && function(e) {
h.on(cc.Node.EventType.TOUCH_END, function() {
i._showPartnerChildrenDialog(e);
});
}(o);
}
var d = this._getPager("partnerStats", this._pages.partnerStats, -this._pages.partnerStats.height / 2 + 46);
this._updatePager(d, a.total, a.page, 20, function(e) {
i._partnerStatsPageNo = e;
i._renderPartnerStats();
});
var u = e.getComponent(cc.Layout);
u && u.updateLayout();
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
i.anchorY = 1;
i.y = t.height / 2;
this._rewardLayout = n;
this._rewardSv && (this._rewardSv.content = i);
this._rewardFilter = 0;
var a = this, s = this._find("tab_unclaimed", e), o = this._find("tab_claimed", e);
this._rewardTabs = [ s, o ];
s && s.on(cc.Node.EventType.TOUCH_END, function() {
if (0 !== a._rewardFilter) {
a._rewardFilter = 0;
a._rewardPageNo = 1;
a._renderRewards();
}
});
o && o.on(cc.Node.EventType.TOUCH_END, function() {
if (1 !== a._rewardFilter) {
a._rewardFilter = 1;
a._rewardPageNo = 1;
a._renderRewards();
}
});
this._rewardTotalUn = this._find("lbl_unclaimed_total", e);
this._rewardTotalCl = this._find("lbl_claimed_total", e);
var r = this._find("btn_claim_all", e);
this._rewardClaimAllBtn = r;
r && r.on(cc.Node.EventType.TOUCH_END, function() {
a._claimAllRewards();
});
}
}
}
},
_fmtRewardAmount: function(e) {
var t = Number(e);
isFinite(t) || (t = 0);
return String(parseFloat(t.toFixed(2)));
},
_claimAllRewards: function() {
if (!this._claiming && !this._claimingAll) {
var e = this;
this._claimingAll = !0;
n("/reward_claim_all", {
club_id: this._clubId
}, function(t) {
e._claimingAll = !1;
t && 0 === t.errcode && e._loadRewards();
});
}
},
_updateRewardTabs: function(e, t, i, n) {
var a = this._rewardTabs || [], s = [ "未领取(" + e + ")", "已领取(" + t + ")" ];
if (this._rewardTotalUn) {
var o = this._rewardTotalUn.getComponent(cc.Label);
o && (o.string = "未领取总金额：" + this._fmtRewardAmount(i));
}
if (this._rewardTotalCl) {
var r = this._rewardTotalCl.getComponent(cc.Label);
r && (r.string = "已领取总金额：" + this._fmtRewardAmount(n));
}
this._rewardClaimAllBtn && (this._rewardClaimAllBtn.active = 0 === this._rewardFilter && e > 0);
for (var l = 0; l < 2; l++) {
var c = a[l];
if (c && cc.isValid(c)) {
var h = c.getChildByName("Label"), d = h ? h.getComponent(cc.Label) : null;
d && (d.string = s[l]);
var u = this._rewardFilter === l ? cc.color(255, 255, 255) : cc.color(150, 150, 150);
c.color = u;
var g = c.getComponent(cc.Button);
if (g && g.transition === cc.Button.Transition.COLOR) {
g.normalColor = u;
g.hoverColor = u;
g.pressedColor = u;
}
}
}
},
_claimReward: function(e, t) {
if (e && !this._claiming) {
var i = this;
this._claiming = !0;
t && (t.active = !1);
n("/reward_claim", {
club_id: this._clubId,
id: e.id
}, function(n) {
i._claiming = !1;
if (n && 0 === n.errcode) {
e.claim_status = 1;
e.claim_time = Math.floor(Date.now() / 1e3);
i._renderRewards();
} else t && cc.isValid(t) && (t.active = !0);
});
}
},
_renderRewards: function() {
var e = this._rewardContent;
if (e) {
var t = e.getChildByName("rowTpl");
this._clearList(e, t);
if (t) {
t.active = !1;
for (var i = this._rewards || [], n = 0, a = 0, s = 0, o = 0, r = 0; r < i.length; r++) {
var l = Number(i[r].amount) || 0;
if (1 === Number(i[r].claim_status)) {
a++;
o += l;
} else {
n++;
s += l;
}
}
for (var c = 1 === this._rewardFilter ? 1 : 0, h = [], d = 0; d < i.length; d++) {
var u = i[d];
(1 === Number(u.claim_status) ? 1 : 0) === c && h.push(u);
}
var g = this._pageSlice(h, this._rewardPageNo, 20);
this._rewardPageNo = g.page;
for (var v = 0; v < g.rows.length; v++) {
var _ = this._createRewardRow(t, g.rows[v]);
if (_) {
_.parent = e;
_.active = !0;
}
}
var f = this, m = this._getPager("reward", this._pages.reward, -this._pages.reward.height / 2 + 46);
this._updatePager(m, g.total, g.page, 20, function(e) {
f._rewardPageNo = e;
f._renderRewards();
});
this._updateRewardTabs(n, a, s, o);
this._refreshRewardScroll();
}
}
},
_refreshRewardScroll: function() {
if (this._rewardContent) {
this._rewardLayout && this._rewardLayout.updateLayout();
this._rewardScroll && (this._rewardContent.y = this._rewardScroll.height / 2);
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
this._setLabel(i, "date", this._fmtDateTime(t.create_time));
var n = 1 === Number(t.claim_status), a = i.getChildByName("status");
if (a) {
var s = a.getComponent(cc.Label);
s && (s.string = n ? "已领取" : "未领取");
a.color = n ? cc.color(120, 220, 120) : cc.color(255, 210, 90);
}
var o, r, l, c = i.getChildByName("btn_claim");
if (c) {
c.active = !n;
n || (o = this, r = t, (l = c).on(cc.Node.EventType.TOUCH_END, function() {
o._claimReward(r, l);
}));
}
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
var e = this, t = this._gameConfigList;
if (t) {
this._renderGameTypes();
var i = t.getChildByName("configRowTpl");
this._clearList(t, i);
if (i) {
i.active = !1;
var n = this._clubTables.filter(function(t) {
return String(t.game_type) === String(e._selectedGameType);
}), a = this._pageSlice(n, this._tablePageNo, 4);
this._tablePageNo = a.page;
for (var s = 0; s < a.rows.length; s++) {
var o = this._createTableRow(i, a.rows[s]);
if (o) {
o.parent = t;
o.active = !0;
}
}
var r = this._getPager("gameTables", this._pages.gameConfig, -this._pages.gameConfig.height / 2 + 46);
this._updatePager(r, a.total, a.page, 4, function(t) {
e._tablePageNo = t;
e._renderGameConfigs();
});
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
var l = a.getChildByName("Label"), c = l ? l.getComponent(cc.Label) : a.getComponent(cc.Label);
c && (c.string = i._gameTypeName(n));
l && (l.color = s ? cc.color(255, 255, 255) : cc.color(60, 40, 0));
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
var l = this._findConfigForTable(t), c = !(!l || !Number(l.enabled));
this._setNodeLabel(r.getChildByName("Label"), c ? "关闭" : "开启");
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
room_fee_payer: n(i.room_fee_payer, t && null != t.room_fee_payer ? t.room_fee_payer : 1),
enter_fee: n(i.enter_fee, t ? t.enter_fee : 0)
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
_bindSysFeePage: function() {
try {
var e = this, t = this._pages ? this._pages.xitosz : null;
if (!t) return;
this._sysFeePage = t;
for (var i = [ "fee_rake_percentLabel", "face_scoreInput", "shuffle_scoreInput" ], n = 0; n < i.length; n++) {
var a = t.getChildByName(i[n]);
a && a.getComponent(cc.EditBox) && a.on("editing-did-ended", function() {
e._saveSysFees();
});
}
} catch (e) {
console.log("[clubAdmin] 系统设置绑定异常", e);
}
},
_sysFeeInput: function(e) {
var t = this._sysFeePage || (this._pages ? this._pages.xitosz : null), i = t ? t.getChildByName(e) : null;
return i ? i.getComponent(cc.EditBox) : null;
},
_loadSysFees: function() {
if (this._canRequest()) {
var e = this;
n("/club_admin/sys_fee_get", {
club_id: this._clubId
}, function(t) {
var i = t && 0 === t.errcode && t.data ? t.data : {}, n = {
fee_rake_percentLabel: null == i.enter_fee ? 1 : i.enter_fee,
face_scoreInput: null == i.face_score ? .1 : i.face_score,
shuffle_scoreInput: null == i.shuffle_score ? .5 : i.shuffle_score
};
for (var a in n) {
var s = e._sysFeeInput(a);
s && (s.string = String(n[a]));
}
});
}
},
_saveSysFees: function() {
if (this._canRequest()) {
var e = function(e, t) {
var i = this._sysFeeInput(e), n = i ? parseFloat(i.string) : NaN;
return isNaN(n) || n < 0 ? t : n;
}.bind(this);
n("/club_admin/sys_fee_save", {
club_id: this._clubId,
enter_fee: e("fee_rake_percentLabel", 1),
face_score: e("face_scoreInput", .1),
shuffle_score: e("shuffle_scoreInput", .5)
}, function(e) {
e && 0 === e.errcode || console.log("[clubAdmin] 系统收费保存失败", e);
});
}
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
this._clubId > 0 && ("overview" === e ? this._loadOverview() : "xitosz" === e ? this._loadSysFees() : "member" === e ? this._loadMembers() : "partner" === e ? this._loadPartners() : "partnerStats" === e ? this._loadPartners() : "reward" === e ? this._loadRewards() : "gameConfig" === e && this._loadGameConfigs());
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
e._gameUnified = t && t.unified ? t.unified : {};
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
this._tablePageNo = 1;
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
_prepareStatUI: function(e) {
if (this.node.getChildByName("popups")) {
for (var t = [ {
src: "monthInput",
dst: "monthBtn",
text: "选择月份"
}, {
src: "fromInput",
dst: "fromBtn",
text: "开始日期"
}, {
src: "toInput",
dst: "toBtn",
text: "结束日期"
}, {
src: "pidInput",
dst: "pidBtn",
text: "全部俱乐部"
} ], i = 0; i < t.length; i++) {
var n = e.getChildByName(t[i].dst) || e.getChildByName(t[i].src);
if (n) {
n.name = t[i].dst;
var a = n.getComponent(cc.EditBox);
if (a) {
a.enabled = !1;
a.destroy();
}
n.getComponent(cc.Button) || n.addComponent(cc.Button);
var s = n.getChildByName("TEXT_LABEL");
if (s) {
s.active = !0;
var o = s.getComponent(cc.Label);
o && !o.string && (o.string = t[i].text);
}
var r = n.getChildByName("PLACEHOLDER_LABEL");
r && (r.active = !1);
}
}
for (var l = [ "monthBtn", "fromBtn", "toBtn", "pidBtn" ], c = 0; c < l.length; c++) {
var h = e.getChildByName(l[c]);
if (h) {
var d = h.getChildByName("TEXT_LABEL") || h.getChildByName("Label");
if (d) {
var u = d.getComponent(cc.Label);
if (u) {
d.setContentSize(240, 50);
u.overflow = cc.Label.Overflow.CLAMP;
u.enableWrapText = !1;
}
}
}
}
if (!e.getChildByName("filterDrop")) {
var g = new cc.Node("filterDrop");
g.parent = e;
g.setContentSize(560, 660);
g.setPosition(0, -85);
var v = g.addComponent(cc.Sprite);
v.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var _ = e.parent ? e.parent.getComponent(cc.Sprite) : null;
_ && (v.spriteFrame = _.spriteFrame);
var f = g.addComponent(cc.Layout);
f.type = cc.Layout.Type.VERTICAL;
f.spacingY = 6;
f.paddingTop = 10;
f.paddingBottom = 10;
var m = this._find("gameTypeItemTpl");
if (m) {
var p = cc.instantiate(m);
p.name = "dropItemTpl";
p.parent = g;
p.setContentSize(500, 56);
p.active = !1;
var b = p.getChildByName("Label");
if (b) {
b.setContentSize(480, 50);
var C = b.getComponent(cc.Label);
C && (C.string = "");
}
}
g.active = !1;
}
}
},
_preparePartnerChildrenUI: function(e) {
if (!e.getChildByName("partnerChildrenWin")) {
var t = e.getChildByName("partnerBeanLogsWin");
if (t) {
var i = t.getChildByName("panel"), n = i ? i.getChildByName("content") : null;
if (n) {
var a = n.getChildByName("colAmount");
if (a) {
var s = a.getComponent(cc.Label);
s && (s.string = "数量");
}
}
var o = cc.instantiate(t);
o.name = "partnerChildrenWin";
o.active = !1;
e.addChild(o);
var r = o.getChildByName("panel"), l = r ? r.getChildByName("content") : null;
if (l) {
var c = this._popupTitle(r);
if (c) {
var h = c.getComponent(cc.Label);
h && (h.string = "下级俱乐部");
}
var d = l.getChildByName("tipLabel");
d && (d.active = !1);
var u = l.getChildByName("avatar");
u && (u.active = !1);
for (var g = [ -540, -180, 190, 540 ], v = [ 300, 340, 240, 240 ], _ = [ [ "colTime", "加入时间" ], [ "colType", "昵称ID" ], [ "colAmount", "现在豆豆数" ], [ "colRoom", "历史总赢亏" ] ], f = 0; f < _.length; f++) {
var m = l.getChildByName(_[f][0]);
if (m) {
m.setPosition(g[f], 350);
m.setContentSize(v[f], 50);
var p = m.getComponent(cc.Label);
p && (p.string = _[f][1]);
}
}
var b = l.getChildByName("colRemark");
b && b.removeFromParent();
var C = l.getChildByName("rowTpl");
if (C) {
for (var y = [ "time", "type", "amount", "room" ], S = 0; S < y.length; S++) {
var N = C.getChildByName(y[S]);
if (N) {
N.setPosition(g[S], 0);
N.setContentSize(v[S], 50);
N.setSiblingIndex(S);
var B = N.getComponent(cc.Label);
if (B) {
B.string = "";
B.enableWrapText = !1;
B.overflow = S <= 1 ? cc.Label.Overflow.SHRINK : cc.Label.Overflow.CLAMP;
}
}
}
var M = C.getChildByName("remark");
M && M.removeFromParent();
for (var w = 0; w < C.children.length; w++) C.children[w].active = !0;
}
}
}
}
},
_popupTitle: function(e) {
return e ? e.getChildByName("titleLabel") || this._find("titleLabel", e) || this._find("title", e) : null;
},
_bindPopups: function() {
var e = this;
this._popups = {};
this._rakePerRound = 1;
this._roomFeePayer = 1;
this._gemsMode = 1;
var t = this.node.getChildByName("popups");
if (t) {
(a = (n = (i = t.getChildByName("incomeStatsWin")) ? i.getChildByName("panel") : null) ? n.getChildByName("content") : null) && e._prepareStatUI(a);
var i, n, a;
this._preparePartnerChildrenUI(t);
for (var s = [ "memberRecordsWin", "memberBeanLogsWin", "partnerBeanLogsWin", "partnerChildrenWin", "partnerGemsWin", "partnerRatioWin", "partnerProfitWin", "incomeStatsWin", "datePickerWin", "gameConfigWin", "confirmWin", "addMemberWin", "addPartnerWin" ], o = 0; o < s.length; o++) (function(i) {
var n = t.getChildByName(i);
if (n) {
e._popups[i] = n;
var a = n.getChildByName("panel");
if (a) {
var s = a.getChildByName("closeBtn");
s && s.on(cc.Node.EventType.TOUCH_END, function() {
n.active = !1;
});
var o = n.getChildByName("mask");
o && o.on(cc.Node.EventType.TOUCH_END, function() {
n.active = !1;
});
var r = a.getChildByName("content");
if (r) {
var l = r.getChildByName("okBtn");
l && l.on(cc.Node.EventType.TOUCH_END, function() {
e._onPopupOk(i);
});
var c = r.getChildByName("cancelBtn");
c && c.on(cc.Node.EventType.TOUCH_END, function() {
n.active = !1;
});
if ("incomeStatsWin" === i) {
var h = r.getChildByName("queryBtn");
h && h.on(cc.Node.EventType.TOUCH_END, function() {
e._queryIncomeStats();
});
var d = r.getChildByName("totalLabel");
d && (e._statTotalLabel = d.getComponent(cc.Label));
var u = r.getChildByName("monthBtn");
if (u) {
e._statMonthBtn = u;
e._statMonthLabel = e._btnLabel(u);
u.on(cc.Node.EventType.TOUCH_END, function() {
e._toggleStatDrop("month");
});
}
var g = r.getChildByName("fromBtn");
if (g) {
e._statFromBtn = g;
e._statFromLabel = e._btnLabel(g);
g.on(cc.Node.EventType.TOUCH_END, function() {
e._openStatDatePicker("from");
});
}
var v = r.getChildByName("toBtn");
if (v) {
e._statToBtn = v;
e._statToLabel = e._btnLabel(v);
v.on(cc.Node.EventType.TOUCH_END, function() {
e._openStatDatePicker("to");
});
}
var _ = r.getChildByName("pidBtn");
if (_) {
e._statPidBtn = _;
e._statPidLabel = e._btnLabel(_);
_.on(cc.Node.EventType.TOUCH_END, function() {
e._toggleStatDrop("partner");
});
}
e._statDrop = r.getChildByName("filterDrop");
e._incomeStatsContent = r;
var f = r.getChildByName("statScroll");
if (f) {
e._statListContent = f.getChildByName("content");
e._statListContent && (e._statRowTpl = e._statListContent.getChildByName("rowTpl"));
}
}
if ("datePickerWin" === i) {
e._datePickerWin = n;
var m = r.getChildByName("prevBtn");
m && m.on(cc.Node.EventType.TOUCH_END, function() {
e._pickMonth--;
if (e._pickMonth < 0) {
e._pickMonth = 11;
e._pickYear--;
}
e._renderDatePicker();
});
var p = r.getChildByName("nextBtn");
p && p.on(cc.Node.EventType.TOUCH_END, function() {
e._pickMonth++;
if (e._pickMonth > 11) {
e._pickMonth = 0;
e._pickYear++;
}
e._renderDatePicker();
});
var b = r.getChildByName("ymLabel");
b && (e._pickYmLabel = b.getComponent(cc.Label));
var C = r.getChildByName("dayGrid");
if (C) {
e._dayGrid = C;
e._dayTpl = C.getChildByName("dayTpl");
}
}
if ("gameConfigWin" === i) {
var y = r.getChildByName("rakeSwitchBtn");
y && y.on(cc.Node.EventType.TOUCH_END, function() {
e._toggleRakeSwitch();
});
var S = r.getChildByName("payerBtn");
S && S.on(cc.Node.EventType.TOUCH_END, function() {
e._togglePayer();
});
}
if ("partnerGemsWin" === i) {
var N = r.getChildByName("btn_add");
N && N.on(cc.Node.EventType.TOUCH_END, function() {
e._setGemsMode(1);
});
var B = r.getChildByName("btn_sub");
B && B.on(cc.Node.EventType.TOUCH_END, function() {
e._setGemsMode(-1);
});
e._gemsAddSpr = N ? N.getComponent(cc.Sprite) : null;
e._gemsSubSpr = B ? B.getComponent(cc.Sprite) : null;
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
})(s[o]);
}
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
var r = null === n ? i / 2 - 60 : n - 6, l = e.getChildByName("pagerBar"), c = -i / 2 + 20;
if (l) {
var h = l.y + l.height / 2;
h > c && (c = h + 6);
}
var d = r - c;
if (d < 120) {
d = Math.max(120, i - 140);
r = i / 2 - 40;
}
var u = t - 20, g = r - d / 2, v = new cc.Node("listView");
v.parent = e;
v.setContentSize(u, d);
v.setPosition(0, g);
v.addComponent(cc.Mask).type = cc.Mask.Type.RECT;
var _ = new cc.Node("listContent");
_.parent = v;
_.anchorX = .5;
_.anchorY = 1;
_.setContentSize(u, d);
_.setPosition(0, d / 2);
var f = v.addComponent(cc.ScrollView);
f.horizontal = !1;
f.vertical = !0;
f.inertia = !0;
f.brake = .75;
f.elastic = !0;
f.bounceDuration = .23;
f.content = _;
f.enabled = !1;
f.enabled = !0;
l && l.setSiblingIndex(e.childrenCount - 1);
e._popupScroll = {
view: v,
sv: f,
list: _,
viewW: u,
viewH: d
};
return e._popupScroll;
},
_fillPopupList: function(e, t, i) {
if (e) {
for (var n = e.getChildByName("rowTpl"), a = this._ensurePopupScroll(e), s = e.children.length - 1; s >= 0; s--) {
var o = e.children[s];
if ("rowClone" === o.name) {
o.removeFromParent();
o.destroy();
}
}
for (var r = a.list.children.length - 1; r >= 0; r--) {
var l = a.list.children[r];
l.removeFromParent();
l.destroy();
}
if (n && t) {
n.active = !1;
var c = t || [];
i || (e._popupPage = 1);
var h = Math.max(1, Math.ceil(c.length / 15)), d = Math.min(Math.max(1, e._popupPage || 1), h);
e._popupPage = d;
e._popupRows = c;
var u = c.slice(15 * (d - 1), 15 * d), g = n.height + 8, v = n.height;
a.list.setContentSize(a.viewW, Math.max(a.viewH, u.length * g + 6));
a.list.setPosition(0, a.viewH / 2);
for (var _ = 0; _ < u.length; _++) {
var f = cc.instantiate(n);
f.name = "rowClone";
f.active = !0;
f.parent = a.list;
f.x = 0;
f.y = -(v / 2 + _ * g);
for (var m = u[_] || [], p = 0; p < f.children.length; p++) {
var b = f.children[p];
b.active = !0;
if (void 0 !== m[p] && null !== m[p]) {
var C = b.getComponent(cc.Label);
C && (C.string = String(m[p]));
}
}
}
u.length > 0 && a.sv.scrollToTop(.01);
var y = this;
e._pagerKey || (e._pagerKey = "popup_" + ++this._pagerSeq);
var S = this._getPager(e._pagerKey, e, -e.height / 2 + 64);
this._updatePager(S, c.length, d, 15, function(t) {
e._popupPage = t;
y._fillPopupList(e, e._popupRows, !0);
});
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
_setRuleRow: function(e, t, i, n) {
if (e) for (var a = [ t + "Label", t + "Input", t + "Btn" ], s = 0; s < a.length; s++) {
var o = e.getChildByName(a[s]);
if (o) {
o.active = !!i;
if (i) {
o.opacity = n ? 255 : 120;
var r = o.getComponent(cc.EditBox);
r && ("boolean" == typeof r.interactable ? r.interactable = !!n : r.enabled = !!n);
var l = o.getComponent(cc.Button);
l && "boolean" == typeof l.interactable && (l.interactable = !!n);
}
}
}
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
var l = n[r], c = l.create_time ? new Date(1e3 * l.create_time) : null, h = c ? c.getFullYear() + "-" + (c.getMonth() + 1) + "-" + c.getDate() : "未知日期";
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
var d = o[h], u = Number(l.amount) || 0;
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
var o = n[a], r = t._fmtDateTime(o.create_time);
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
this._setNodeLabel(this._popupTitle(a), "豆豆明细 - " + (e.name || ""));
this._setNodeLabel(s.getChildByName("tipLabel"), (e.name || "") + " (ID:" + e.id + ")");
this._setAvatar(s, "avatar", e.headimg, e.owner_userid);
this._fillPopupList(s, []);
n("/partner/bean_logs", {
club_id: this._clubId,
partner_club_id: e.id
}, function(e) {
var i = [];
if (e && 0 === e.errcode) for (var n = e.data || [], a = 0; a < n.length; a++) {
var o = n[a], r = t._fmtDateTime(o.create_time);
i.push([ r, o.change_type || "", o.amount || 0, o.roomid || "", o.name || "" ]);
}
0 === i.length && i.push([ "暂无明细", "", "", "", "" ]);
t._fillPopupList(s, i);
});
}
},
_showPartnerChildrenDialog: function(e) {
var t = this;
if (e) {
var i = this._openPopup("partnerChildrenWin", {
partner: e
});
i || (i = this._openPopup("partnerBeanLogsWin", {
partner: e
}));
if (i) {
var a = this._popupPanel(i), s = a.getChildByName("content"), o = this._popupTitle(a);
o && this._setNodeLabel(o, "成员列表 - " + (e.name || ""));
t._fillPopupList(s, [ [ "加载中...", "", "", "" ] ]);
n("/partner_members", {
club_id: this._clubId,
partner_club_id: e.id
}, function(e) {
for (var i = e && e.data || [], n = [], a = 0; a < i.length; a++) {
var o = i[a];
n.push([ t._fmtDateTime(o.join_time), (o.name || "") + "(" + o.userid + ")", String(Number(o.gems) || 0), String(Number(o.total_win_lose) || 0) ]);
}
n.length || n.push([ "暂无成员", "", "", "" ]);
t._fillPopupList(s, n);
});
}
}
},
_showPartnerProfitDialog: function(e) {
var t = this, i = this._openPopup("partnerProfitWin", {
partner: e
});
if (i) {
var a = this._popupPanel(i), s = a.getChildByName("content");
this._setNodeLabel(this._popupTitle(a), "收益详情 - " + e.name);
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
this._refreshGameUnified(function() {
n._dlgPanel === o && n._applyDlgGameType();
});
}
},
_refreshGameUnified: function(e) {
var t = this;
this._canRequest() ? n("/game_unified", {
club_id: this._clubId
}, function(i) {
i && 0 === i.errcode && i.unified && (t._gameUnified = i.unified);
e && e();
}) : e && e();
},
_applyDlgGameType: function() {
var e = this._dlgPanel, t = this._dlgContent;
if (e && t) {
var i = this._dlgIsEdit, n = this._dlgCfg, a = this._dlgTable ? "修改牌桌" : i ? "修改玩法" : "新建玩法";
this._setNodeLabel(e.getChildByName("titleLabel"), a + " - " + this._gameTypeName(this._dlgGameType));
var s = e.getChildByName("gameTypeBtn");
this._setNodeLabel(s ? s.getChildByName("Label") : null, this._gameTypeName(this._dlgGameType));
for (var o = 1 === Number(this._gameUnified && this._gameUnified[this._dlgGameType]), r = /^baobao/.test(this._dlgGameType), l = [ "rake_percent", "hidden_rake_percent", "room_fee" ], c = 0; c < l.length; c++) this._setRuleRow(t, l[c], !0, o);
this._setRuleRow(t, "rakeSwitch", !0, o);
this._setRuleRow(t, "payer", !0, o);
this._setRuleRow(t, "min_bean", !0, o && r);
this._setRuleRow(t, "kick_bean", !0, o && r);
this._setRuleRow(t, "min_players", !0, r);
this._setRuleRow(t, "max_players", !0, r);
this._setRuleRow(t, "face_score", !o, !o);
this._setRuleRow(t, "shuffle_score", !1, !1);
for (var h = null, d = 0; d < t.children.length; d++) {
var u = t.children[d].getComponent(cc.Label);
if (u && "进场费" === u.string) {
h = t.children[d];
break;
}
}
h && (h.active = !1);
var g = t.getChildByName("fee_rake_percentLabel");
g && (g.active = !1);
o || this._setNodeLabel(t.getChildByName("face_scoreLabel"), "房卡:");
var v = n;
if (!v) for (var _ = 0; _ < this._gameConfigs.length; _++) {
var f = this._gameConfigs[_];
if (f.game_type === this._dlgGameType && !f.inherited) {
v = f;
break;
}
}
var m = this._findGameType(this._dlgGameType), p = m && m.max_players ? m.max_players : 6;
this._setInput(t, "nameInput", n ? n.name : this._gameTypeName(this._dlgGameType));
this._setInput(t, "difenInput", v && v.difen_options ? v.difen_options[0] : 1);
this._setInput(t, "jushuInput", v && v.jushu_options ? v.jushu_options[0] : 8);
this._setInput(t, "min_playersInput", v ? v.min_players : 2);
this._setInput(t, "max_playersInput", v ? v.max_players_custom : p);
var b = 0;
v ? b = o ? Number(v.face_score) || 0 : v.cost_options && v.cost_options.length ? Number(v.cost_options[0]) : 2 : o || (b = 2);
this._setInput(t, "face_scoreInput", b);
this._setInput(t, "shuffle_scoreInput", v && v.shuffle_score || 0);
this._setInput(t, "min_beanInput", v && v.min_bean || 0);
this._setInput(t, "kick_beanInput", v && v.kick_bean || 0);
this._setInput(t, "rake_percentInput", v ? v.rake_percent : 0);
this._setInput(t, "hidden_rake_percentInput", v ? v.hidden_rake_percent : 0);
this._setInput(t, "fee_rake_percentLabel", v && Number(v.enter_fee) || 0);
this._setInput(t, "room_feeInput", v ? v.room_fee : 0);
this._rakePerRound = v && null != v.rake_per_round ? Number(v.rake_per_round) : 1;
this._roomFeePayer = v && null != v.room_fee_payer ? Number(v.room_fee_payer) : 1;
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
var l = String(this._allGameTypes[r].type || "");
if (l && !n[l]) {
n[l] = !0;
a.push(l);
}
}
for (var c = 0; c < a.length; c++) (function(n) {
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
})(a[c]);
}
},
_onPopupOk: function(e) {
var t = this, i = this._popupCtx || {}, a = this._popups ? this._popups[e] : null;
if (a) {
var s = this._popupPanel(a).getChildByName("content");
if ("memberRecordsWin" !== e && "memberBeanLogsWin" !== e && "partnerProfitWin" !== e) if ("confirmWin" !== e) if ("addMemberWin" !== e) if ("addPartnerWin" !== e) if ("partnerGemsWin" !== e) if ("partnerRatioWin" !== e) {
if ("gameConfigWin" === e) {
var o = i.cfg, r = i.gameType || this._dlgGameType || "baobao_shou", l = 1 === Number(this._gameUnified && this._gameUnified[r]), c = /^baobao/.test(r), h = this._findGameType(r), d = h && h.max_players ? Number(h.max_players) : 2, u = {
club_id: this._clubId,
game_type: r,
name: this._getInput(s, "nameInput"),
difen_options: [ parseInt(this._getInput(s, "difenInput")) || 1 ],
jushu_options: [ parseInt(this._getInput(s, "jushuInput")) || 8 ],
min_players: c ? parseInt(this._getInput(s, "min_playersInput")) || 2 : d,
max_players_custom: c ? parseInt(this._getInput(s, "max_playersInput")) || 6 : d,
face_score: l ? parseInt(this._getInput(s, "face_scoreInput")) || 0 : o && Number(o.face_score) || 0,
shuffle_score: parseInt(this._getInput(s, "shuffle_scoreInput")) || 0,
min_bean: c && parseInt(this._getInput(s, "min_beanInput")) || 0,
kick_bean: c && parseInt(this._getInput(s, "kick_beanInput")) || 0,
rake_percent: parseFloat(this._getInput(s, "rake_percentInput")) || 0,
hidden_rake_percent: parseFloat(this._getInput(s, "hidden_rake_percentInput")) || 0,
enter_fee: l ? parseInt(this._getInput(s, "fee_rake_percentLabel")) || 0 : o && Number(o.enter_fee) || 0,
room_fee: parseInt(this._getInput(s, "room_feeInput")) || 0,
rake_per_round: this._rakePerRound,
room_fee_payer: this._roomFeePayer
};
if (!u.name) {
t._tip("请填写配置名称");
return;
}
l || (u.cost_options = [ parseInt(this._getInput(s, "face_scoreInput")) || 0 ]);
var g = this._dlgTable || i.table;
if (g && g.id) {
u.id = g.id;
n("/club_admin/table_update", u, function(e) {
if (e && 0 === e.errcode) {
a.active = !1;
t._loadGameConfigs();
} else t._tip(e && e.errmsg ? e.errmsg : "操作失败");
});
return;
}
n(i.isEdit ? "/club_game_config/" + o.id : "/club_game_config", u, function(e) {
if (e && 0 === e.errcode) {
a.active = !1;
t._loadGameConfigs();
} else t._tip(e && e.errmsg ? e.errmsg : "操作失败");
});
}
} else {
var v = this._ratioDialogNodes(s), _ = parseFloat(this._getInputNode(v.inputRake));
if (isNaN(_) || _ < 0 || _ > 100) {
t._tip("请输入0-100之间的数字");
return;
}
var f = this._getInputNode(v.inputFee), m = parseFloat(f);
if ("" !== f && (isNaN(m) || m < 0 || m > 100)) {
t._tip("费用比例请输入0-100之间的数字");
return;
}
var p = this._getInputNode(v.inputHidden), b = parseFloat(p);
if ("" !== p && (isNaN(b) || b < 0 || b > 100)) {
t._tip("暗水比例请输入0-100之间的数字");
return;
}
var C = {
club_id: this._clubId,
partner_club_id: i.partner.id,
ratio: _
};
isNaN(m) || (C.fee_ratio = m);
isNaN(b) || (C.hidden_ratio = b);
console.log("[partnerRatio] save " + JSON.stringify(C));
n("/partner/ratio", C, function(e) {
if (e && 0 === e.errcode) {
a.active = !1;
t._loadPartners();
} else t._tip(e && e.errmsg ? e.errmsg : "操作失败");
});
} else {
var y = Math.abs(parseInt(this._getInput(s, "amountInput")));
if (isNaN(y) || 0 === y) {
t._tip("请输入有效数字");
return;
}
var S = this._gemsMode > 0 ? y : -y;
if (i.member) {
n("/club_member_gems", {
clubid: this._clubId,
userid: i.member.userid,
gems: S
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
gems: S
}, function(e) {
if (e && 0 === e.errcode) {
a.active = !1;
t._loadPartners();
} else t._tip(e && e.errmsg ? e.errmsg : "操作失败");
});
} else {
var N = parseInt(this._getInput(s, "uidInput"));
if (!(N > 0)) return;
n("/club_member/set_partner", {
club_id: this._clubId,
userid: N
}, function(e) {
if (e && 0 === e.errcode) {
a.active = !1;
t._loadPartners();
}
});
} else {
var B = parseInt(this._getInput(s, "uidInput"));
if (!(B > 0)) return;
n("/club_member/add", {
club_id: this._clubId,
userid: B
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
var l = new cc.Node("row" + t);
l.setContentSize(s, 68);
var c = e.height ? e.height / 2 - 34 : 110;
l.setPosition(0, c - 73 * t);
e.addChild(l);
var h = -s / 2 + 20, d = 26, u = 0, g = cc.Label.HorizontalAlign.LEFT;
if (o) {
h = 0;
d = 24;
u = .5;
g = cc.Label.HorizontalAlign.CENTER;
var v = new cc.Node("bgimg");
v.setContentSize(s, 68);
l.addChild(v);
var _ = v.addComponent(cc.Sprite);
_.sizeMode = cc.Sprite.SizeMode.CUSTOM;
_.type = cc.Sprite.Type.SIMPLE;
l._iconSp = _;
r._loadAtlasFrame("images/atlas/hall_ui", "club_game.png", function(e) {
if (e && cc.isValid(v)) {
l._iconNormal = e;
if (!l._selected || !l._iconSel) {
_.spriteFrame = e;
v.setContentSize(s, 68);
}
}
});
r._loadAtlasFrame("images/atlas/hall_ui", "club_game_on.png", function(e) {
if (e && cc.isValid(v)) {
l._iconSel = e;
if (l._selected) {
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
l.addChild(f);
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
l.addChild(p);
var b = p.addComponent(cc.Label);
b.string = n;
b.fontSize = 24;
b.lineHeight = 68;
b.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
b.verticalAlign = cc.Label.VerticalAlign.CENTER;
p.color = cc.color(0, 0, 0);
}
a && l.on(cc.Node.EventType.TOUCH_END, function() {
r._clubScrollMoved ? r._clubScrollMoved = !1 : a(l);
});
return l;
},
_clubMakeScrollBox: function(e, t, i, n) {
var a = this, s = this._clubFind(e, "box");
if (s) {
var o = this._clubFind(s, "view"), r = o ? this._clubFind(o, "content") : null, l = o ? o.width : 0, c = o ? o.height : 0;
if (r) {
var h = r.getChildByName("rowTpl"), d = r.getChildByName("emptyTip");
r.removeAllChildren();
h && r.addChild(h);
d && r.addChild(d);
}
this._clubScroll = {
view: o,
content: r,
vw: l,
vh: c
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
var s = this._clubFind(this._clubListArea, "gamesDrop");
s && (s.active = !1);
var o = this._clubFind(this._clubListArea, "box"), r = o ? o.getChildByName("view") : null, l = r ? r.getChildByName("content") : null;
if (l) {
var c = l.getChildByName("rowTpl"), h = l.getChildByName("emptyTip");
l.removeAllChildren();
c && l.addChild(c);
if (h) {
l.addChild(h);
h.active = !1;
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
e._hallMode = 1 == t.hall_mode;
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
e._hallMode = 1 == t.hall_mode;
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
var i = this._myClubs || [];
this._hallMode && i.length > 1 && (i = [ i[0] ]);
var n = Math.min(t.width || 880, 920), a = (t.height || 460) - 10, s = i.length > 0 ? i.length : 1;
this._clubMakeScrollBox(t, n, a, 80 * s + 20);
var o = this._clubScroll ? this._clubScroll.content : t;
if (o) {
var r = o.getChildByName("rowTpl");
r && (r.active = !1);
var l = o.getChildByName("emptyTip");
if (l) {
l.active = 0 == i.length;
if (0 == i.length) {
var c = l.getComponent(cc.Label);
c && (c.string = "您还没有加入任何俱乐部，请创建或加入！");
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
var l = s.getComponent(cc.Label);
l && e._clubClampLabel(l, t.name || "");
}
var c = a.getChildByName("sub");
if (c) {
var u = c.getComponent(cc.Label);
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
e._clubScrollMoved ? e._clubScrollMoved = !1 : e._hallMode ? e._clubOpenHallEntry(t) : e._wfOpenDetail(t);
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
t._hallMode = 1 == i.hall_mode;
if (t._hallMode && t._myClubs.length > 0) t._clubOpenHallEntry(t._myClubs[0]); else {
for (var n = null, a = 0; a < t._myClubs.length; a++) if (t._myClubs[a].id == e) {
n = t._myClubs[a];
break;
}
n ? t._wfOpenDetail(n) : t.openClubPanel();
}
} else t.openClubPanel();
});
},
_clubOpenHallEntry: function(e) {
e && this._wfOpenDetail(e, !0);
},
_clubOpenHallDetail: function(e) {
var t = this;
this._clubCur = {
id: e ? e.id : 0,
name: "牌桌大厅",
_hall: !0,
myClub: e
};
this._clubCurGame = null;
this._clubChipName = null;
this._clubChipsOpen = !1;
this._clubState = "detail";
this._clubTablesSig = null;
this._clubSetTop(!0, "牌桌大厅");
cc.vv.http.sendRequest("/club_hall_games", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(e) {
if (0 === e.errcode) {
t._clubGames = e.games || [];
t._clubRenderDetail();
} else cc.vv.wc.showError(e.errmsg || "获取玩法失败");
});
},
_wfOpenDetail: function(e, t) {
this._wfPanel && this._wfClose();
var i = cc.find("Canvas");
if (i) {
cc.view.getVisibleSize(), cc.view.getVisibleOrigin();
var n = i.getChildByName("wfPage");
if (n) {
n.active = !0;
for (var a = n.getComponentsInChildren(cc.Widget), s = 0; s < a.length; ++s) a[s].updateAlignment();
var o = n.getChildByName("mask");
o && (n._clubBound || o.on(cc.Node.EventType.TOUCH_START, function() {}));
n._clubBound = !0;
var r = n.getChildByName("listArea");
this._wfPanel = n;
this._wfBaked = !0;
this._wfSaved = {
panel: this._clubPanel,
area: this._clubListArea,
closeBtn: this._clubCloseBtn,
baked: this._clubBaked
};
this._clubBaked = !0;
this._clubPanel = n;
this._clubListArea = r;
this._clubCloseBtn = null;
this._wfSaved.panel && (this._wfSaved.panel.active = !1);
this._clubDetailBgNode = n.getChildByName("detailBgImg");
this._clubDetailFullBg = n.getChildByName("detailFullBg");
t ? this._clubOpenHallDetail(e) : this._clubOpenDetail(e);
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
var n = cc.vv.userMgr && cc.vv.userMgr.userId ? String(cc.vv.userMgr.userId) : "", a = this._clubCur && this._clubCur._hall ? this._myOwnedClub() : e, s = !(!n || !a || String(a.owner_userid) !== n);
this._admGame = null;
var o = i.getChildByName("boot"), r = (o ? o.getChildByName("glSprite") : null) || i.getChildByName("glSprite") || this._clubFind(i, "glSprite");
if (r) {
r.active = s;
if (!r._admBound) {
r._admBound = !0;
r.on(cc.Node.EventType.TOUCH_END, function() {
t._admOpen();
});
}
}
var l = i.getChildByName("KsSprite");
if (l && !l._wfBound) {
l._wfBound = !0;
l.on(cc.Node.EventType.TOUCH_END, function() {
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
var h = i.getChildByName("Sprite1") || (o ? o.getChildByName("Sprite1") : null) || this._clubFind(i, "Sprite1");
if (h && !h._wfRecBound) {
h._wfRecBound = !0;
h.on(cc.Node.EventType.TOUCH_END, function() {
t._wfOpenBeanLog();
});
}
var d = i.getChildByName("Sprite2") || (o ? o.getChildByName("Sprite2") : null) || this._clubFind(i, "Sprite2");
if (d && !d._wfZjBound) {
d._wfZjBound = !0;
d.on(cc.Node.EventType.TOUCH_END, function() {
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
var l = new cc.Node("sv");
l.setContentSize(r, o.height);
l.setPosition(a);
p.addChild(l);
l.setSiblingIndex(s);
var c = new cc.Node("view");
c.setContentSize(r, o.height);
l.addChild(c);
c.addComponent(cc.Mask).type = cc.Mask.Type.RECT;
var h = l.addComponent(cc.ScrollView);
h.horizontal = !1;
h.vertical = !0;
h.inertia = !0;
h.brake = .75;
i.parent = c;
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
var l = (i + 1) * r;
s.height < l && (s.height = l);
a = -o / 2 - i * r;
} else {
if (i >= 8) return null;
a = (s.height || 330) / 2 - o / 2 - i * r;
}
var c = cc.instantiate(t);
c.active = !0;
c.setPosition(0, a);
s.addChild(c);
for (var h = 0; h < n.length; ++h) {
var d = c.getChildByName("c" + h), u = d ? d.getComponent(cc.Label) : null;
u && (u.string = null == n[h] ? "-" : String(n[h]));
}
return c;
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
}, function(n) {
i._wfReplayLoading = !1;
if (0 === n.errcode) {
var a = n.replay;
if (a && a.events && a.events.length) {
var s = String(a.type || "");
if (0 === s.indexOf("baobao")) {
cc.vv.bbReplayData = a;
var o = cc.vv.gameNetMgr.sceneForType(s);
cc.director.loadScene(o);
} else {
cc.vv.pendingReplay = {
uuid: e,
index: t,
data: a
};
cc.director.loadScene("hall");
}
} else cc.vv.wc.showError("该局没有录像，无法回放");
} else {
var r = 1 === n.errcode ? "该局录像已过期" : 2 === n.errcode ? "没有该局回放权限" : n.errmsg || "获取回放失败";
cc.vv.wc.showError(r);
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
return 0 === t.indexOf("baobao_mian") ? "六宝免摆" : 0 === t.indexOf("baobao_shou") ? "六宝手动" : 0 === t.indexOf("baobao") ? "六宝" : "sss2" == t ? "十三水(2人)" : "sss4" == t ? "十三水(4人)" : "sss6" == t ? "十三水(6人)" : t || "-";
},
_wfOpenZhanji: function() {
var e = this, t = this._wfPopupOpen("zhanjiWin");
if (t) {
var i = t._wfSeq = (t._wfSeq || 0) + 1, n = this._wfPopupList(t);
this._wfPopupClearRows(n.list, n.tpl);
this._wfZhanjiHeader(t, n.tpl);
this._wfPopupSetLabel(t, "sum1", "房间数：0");
this._wfPopupSetLabel(t, "sum2", "");
this._wfPopupSetLabel(t, "sum3", "");
var a = this._clubFind(t, "emptyTip");
a && (a.active = !1);
cc.vv.http.sendRequest("/get_replay_list", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
}, function(s) {
if (cc.isValid(t) && t.active && t._wfSeq === i) if (0 === s.errcode) {
for (var o = s.list || [], r = 0, l = 0, c = 0; c < o.length; ++c) {
var h = o[c], d = h.games || [], u = Number(h.bean_total) || 0;
r += u;
var g = e._wfPopupAddRow(n.list, n.tpl, l, [ l + 1, h.table_name || e._wfGameName(h.type), e._wfFmtBean(u), e._wfPopupTime(d.length ? d[0].create_time : h.create_time), "-", h.roomid, d.length + "局", "-", "回放" ]);
if (g) {
e._wfZhanjiCell(g, "c2", e._wfFmtBean(u));
e._wfBindRoomReplay(g, h);
}
l++;
}
e._wfPopupSetLabel(t, "sum1", "房间数：" + o.length);
e._wfPopupSetLabel(t, "sum3", "合计：" + e._wfFmtBean(r));
a && cc.isValid(a) && (a.active = 0 == l);
} else cc.vv.wc.showError(s.errmsg || "获取战绩失败");
});
}
},
_wfZhanjiHeader: function(e, t) {
if (e) {
var i = this._clubFind(e, "h8");
if (i) {
var n = i.getComponent(cc.Label);
n && (n.string = "回放");
}
var a = this._clubFind(e, "h6"), s = t ? t.getChildByName("c2") : null;
if (a && s && a.parent) {
var o = a.parent;
if (!o.getChildByName("h_bean")) {
var r = cc.instantiate(a);
r.name = "h_bean";
r.parent = o;
r.active = !0;
r.setPosition(s.x, a.y);
var l = r.getComponent(cc.Label);
l && (l.string = "豆豆");
}
}
}
},
_wfZhanjiCell: function(e, t, i) {
var n = e ? e.getChildByName(t) : null;
if (n) {
n.active = !0;
var a = n.getComponent(cc.Label);
a && (a.string = i);
}
},
_wfFmtBean: function(e) {
var t = Math.round(100 * (Number(e) || 0)) / 100;
return t > 0 ? "+" + t : "" + t;
},
_wfBindRoomReplay: function(e, t) {
var i = this, n = e ? e.getChildByName("detailBtn") : null;
if (n && t) {
this._wfReplayLabel(n);
n.off(cc.Node.EventType.TOUCH_END);
n.on(cc.Node.EventType.TOUCH_END, function(e) {
e && e.stopPropagation && e.stopPropagation();
i._wfOpenRoundPicker(t);
});
}
},
_wfReplayLabel: function(e) {
var t = e ? e.getChildByName("detailLabel") : null;
t && t.getComponent(cc.Label) && (t.getComponent(cc.Label).string = "回放");
var i = e ? e.getChildByName("Label") : null;
i && i.getComponent(cc.Label) && (i.getComponent(cc.Label).string = "回放");
},
_wfOpenRoundPicker: function(e) {
var t = this;
if (e) {
var i = (e.games || []).slice();
i.sort(function(e, t) {
return (Number(e.index) || 0) - (Number(t.index) || 0);
});
if (0 != i.length) {
var n = cc.find("Canvas"), a = n ? n.getChildByName("zhanjiWin") : null;
if (n && a) {
var s = n.getChildByName("zhanjiPick");
s && s.destroy();
var o = cc.instantiate(a);
o.name = "zhanjiPick";
o.active = !0;
n.addChild(o);
this._wfPopupOpen("zhanjiPick");
var r = this._clubFind(o, "title");
r && r.getComponent(cc.Label) && (r.getComponent(cc.Label).string = "选择局数");
var l = this._clubFind(o, "emptyTip");
l && (l.active = !1);
this._wfPopupSetLabel(o, "sum1", "房间：" + (e.roomid || "-"));
this._wfPopupSetLabel(o, "sum2", "");
this._wfPopupSetLabel(o, "sum3", "");
var c = this._wfPopupList(o);
this._wfPopupClearRows(c.list, c.tpl);
this._wfZhanjiHeader(o, c.tpl);
for (var h = e.table_name || this._wfGameName(e.type), d = 0; d < i.length; ++d) {
var u = i[d], g = this._wfPopupAddRow(c.list, c.tpl, d, [ d + 1, h, this._wfFmtBean(u.win), this._wfPopupTime(u.create_time), "-", e.roomid, "第" + u.index + "局", "-", "回放" ]);
if (g) {
this._wfZhanjiCell(g, "c2", this._wfFmtBean(u.win));
(function(i) {
var n = g.getChildByName("detailBtn");
if (n) {
t._wfReplayLabel(n);
n.off(cc.Node.EventType.TOUCH_END);
n.on(cc.Node.EventType.TOUCH_END, function(n) {
n && n.stopPropagation && n.stopPropagation();
t._wfOpenReplay(e.uuid, i.index);
});
}
})(u);
}
}
}
} else cc.vv.wc.showError("该房间没有可回放的局");
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
var l = new Date();
l.setHours(0, 0, 0, 0);
r = Math.floor(l.getTime() / 1e3);
}
var c = e._wfLogSeq = (e._wfLogSeq || 0) + 1;
cc.vv.http.sendRequest("/my_bean_logs", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
from: r
}, function(t) {
if (cc.isValid(e) && e.active && e._wfLogSeq === c) if (0 === t.errcode) {
for (var a = t.logs || [], s = 0; s < a.length; ++s) {
var r = a[s], l = Number(r.amount) || 0, h = i._wfPopupAddRow(n.list, n.tpl, s, [ i._wfPopupTime(r.create_time), r.roomid || "-", r.table_name || i._wfGameName(r.game_type), r.change_type || "-", l > 0 ? "+" + l : String(l), "-" ]), d = 0 === String(r.game_type || "").indexOf("baobao");
h && i._wfBindDetail(h, d && r.room_uuid || "", d && parseInt(r.game_index) || 0);
}
o && cc.isValid(o) && (o.active = 0 == a.length);
} else cc.vv.wc.showError(t.errmsg || "获取乐豆记录失败");
});
}
},
_myOwnedClub: function() {
var e = this._myClubs || [], t = cc.vv.userMgr && cc.vv.userMgr.userId ? String(cc.vv.userMgr.userId) : "";
if (t) for (var i = 0; i < e.length; i++) if (String(e[i].owner_userid) === t) return e[i];
return e.length > 0 ? e[0] : null;
},
_admOpen: function() {
var e = this._clubCur, t = cc.vv.userMgr && cc.vv.userMgr.userId ? String(cc.vv.userMgr.userId) : "";
if (!e || !t || String(e.owner_userid) !== t) {
var i = this._myOwnedClub();
i && (e = i);
}
var n = e ? parseInt(e.id) : 0;
n > 0 || (n = parseInt(cc.vv.fromClubId) || 0);
if (n > 0) {
cc.vv.adminClubId = n;
cc.sys.localStorage.setItem("admin_club_id", n);
}
var a = e && null != e.parent_clubid ? e : this._myOwnedClub();
cc.vv.adminClubTop = a && null != a.parent_clubid ? 0 === Number(a.parent_clubid) : null;
cc.director.loadScene("clubAdmin");
},
_wfQuickJoin: function() {
for (var e = this._clubTableList || [], t = null, i = -1, n = 0; n < e.length; ++n) {
var a = e[n], s = this._clubMaxPlayers(a), o = Number(a.player_count) || 0, r = a.roomid && this._clubTableCardMap ? this._clubTableCardMap["r_" + a.roomid] : null;
if (r && r.slots) {
for (var l = 0, c = 0; c < r.slots.length; ++c) r.slots[c] && r.slots[c]._uid > 0 && ++l;
l > o && (o = l);
}
if (!(o >= s) && o > i) {
i = o;
t = a;
}
}
if (t) {
this._clubCardTouchAt = Date.now();
this._clubEnterTable(t);
} else cc.vv.wc.showError("当前没有可加入的牌桌");
},
_clubOpenDetail: function(e) {
var t = this;
this._clubCur = e;
this._clubCurGame = null;
this._clubChipName = null;
this._clubChipsOpen = !1;
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
var l = this._clubFind(t, "clubGems");
this._clubGemsNode = l;
var c = l && l.parent, h = c ? c.getChildByName("New Node") : null, d = h ? h.getChildByName("name") : null;
if (d && cc.vv.userMgr && cc.vv.userMgr.userId) {
cc.vv.baseInfoMap && delete cc.vv.baseInfoMap[cc.vv.userMgr.userId];
(d.getComponent("ImageLoader") || d.addComponent("ImageLoader")).setUserID(cc.vv.userMgr.userId);
}
var u = function(e) {
if (cc.isValid(l)) {
var t = l.getComponent(cc.Label);
t && (t.string = String(null == e ? 0 : e));
}
};
l && u(cc.vv.userMgr.gems);
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
if (l && l.parent) {
var g = l.parent.getChildByName("safeBtn") || this._clubFind(t, "safeBtn");
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
var B = this._clubFind(t, "tablesView") || this._clubFind(cc.find("Canvas"), "tablesView");
if (B) {
this._clubTablesNode = B.getChildByName("tables");
if (this._clubTablesNode) {
var M = this._clubFind(this._clubTablesNode, "sampleCard0");
M && (this._clubTpl = M);
var w = this._clubFind(this._clubTablesNode, "sampleCard2");
w && (this._clubTpl2 = w);
this._clubTablesNode.removeAllChildren();
if (!B._clubBound) {
B._clubBound = !0;
var T = 0, x = 0;
B.on(cc.Node.EventType.TOUCH_START, function(t) {
T = t.getLocation().x;
x = e._clubTablesNode ? e._clubTablesNode.x : 0;
e._clubTablesScrollMoved = !1;
});
B.on(cc.Node.EventType.TOUCH_MOVE, function(t) {
if (e._clubTablesNode) {
var i = B.width, n = e._clubTablesNode.width;
if (!(n <= i)) {
var a = t.getLocation().x - T;
Math.abs(a) > 6 && (e._clubTablesScrollMoved = !0);
var s = e._clubTablesRestX || 0, o = n - i;
e._clubTablesNode.x = Math.max(s - o, Math.min(s, x + a));
}
}
});
B.on(cc.Node.EventType.TOUCH_CANCEL, function() {
e._clubTablesScrollMoved = !1;
});
}
null == this._clubTablesRestY && (this._clubTablesRestY = this._clubTablesNode.y);
null == this._clubTablesRestX && (this._clubTablesRestX = this._clubTablesNode.x);
if (!this._clubCurGame && C.length > 0) {
var I = cc.vv.lastGameType, P = null;
if (I) for (var A = 0; A < C.length; ++A) {
var L = C[A].game_type || C[A].type;
if (L && L == I) {
P = C[A];
break;
}
}
this._clubCurGame = P || C[0];
}
for (var R = 0; R < this._clubGameRows.length; ++R) this._clubPaintRow(this._clubGameRows[R], C[R] === this._clubCurGame);
this._clubCurGame ? this._clubLoadTables() : this._clubAddRow(this._clubTablesNode, 0, "← 请先选择左侧玩法", "", null, 520);
}
}
}
},
_clubSelectGame: function(e, t) {
if (e !== this._clubCurGame) {
this._clubChipsOpen = !0;
this._clubChipsAnchor = t;
this._clubChipName = null;
this._clubCurGame = e;
for (var i = 0; i < this._clubGameRows.length; ++i) this._clubPaintRow(this._clubGameRows[i], this._clubGameRows[i] === t);
this._clubTablesSig = null;
this._clubRenderTableChips();
this._clubLoadTables();
} else {
this._clubChipsOpen = !this._clubChipsOpen;
this._clubChipsAnchor = t;
if (!this._clubChipsOpen && this._clubChipName) {
this._clubChipName = null;
this._clubTablesSig = null;
this._clubLoadTables();
}
this._clubRenderTableChips();
}
},
_clubPlaceDrop: function(e) {
var t = this._clubDropNode;
if (t && cc.isValid(t) && t.parent && cc.isValid(t.parent)) {
if (!e || !cc.isValid(e)) {
for (var i = this._clubGameRows || [], n = 0; n < i.length; ++n) if (i[n] && cc.isValid(i[n]) && i[n]._gm === this._clubCurGame) {
e = i[n];
break;
}
if (!e) return;
this._clubChipsAnchor = e;
}
if (e.parent) {
var a, s, o = e.parent;
if (o.parent === t.parent) {
a = o.x + e.x - e.width * e.anchorX + t.width / 2;
s = o.y + e.y - e.height * (1 - e.anchorY) - 4 - t.height / 2;
} else {
var r = o.convertToWorldSpaceAR(cc.v2(e.x - e.width * e.anchorX, e.y - e.height * (1 - e.anchorY))), l = t.parent.convertToNodeSpaceAR(r);
a = l.x + t.width / 2;
s = l.y - 4 - t.height / 2;
}
t.setPosition(a, s);
console.log("[俱乐部]gamesDrop 定位 按钮=" + e.name + " row=(" + e.x + "," + e.y + ") 容器=(" + o.x + "," + o.y + ") -> panel=(" + a + "," + s + ")");
}
}
},
_clubRenderTableChips: function() {
var e = this, t = this._clubListArea, i = (t ? this._clubFind(t, "gamesDrop") : null) || this._clubDropNode;
if (i && cc.isValid(i)) {
this._clubDropNode = i;
var n = !!this._clubChipsOpen;
i.active = n;
if (n) {
this._clubPlaceDrop(this._clubChipsAnchor);
var a = this;
if (!this._clubDropPlacing) {
this._clubDropPlacing = !0;
this.scheduleOnce(function() {
a._clubDropPlacing = !1;
a._clubChipsOpen && a._clubPlaceDrop(a._clubChipsAnchor);
}, 0);
}
var s = i.getChildByName("list"), o = s ? s.getComponent(cc.ScrollView) : null, r = s ? s.getChildByName("content") : null;
if (r) {
var l = s.getComponent(cc.Mask);
l && (l.enabled = !0);
var c = r.getChildByName("itemTpl");
if (c) {
r.children.slice().forEach(function(e) {
if (e !== c) {
e.active = !1;
e.removeFromParent();
e.destroy();
}
});
var h = this._clubCurGame || {}, d = (this._clubTableList || []).filter(function(e) {
return h._all || !h.game_type || e.game_type === h.game_type;
}), u = {}, g = [];
d.forEach(function(e) {
var t = String(null == e.name ? "" : e.name).replace(/^\s+|\s+$/g, ""), i = t || "#" + e.id;
if (!u[i]) {
u[i] = !0;
g.push({
key: i,
name: t,
table: e
});
}
});
var v = i.getChildByName("emptyTip");
v && (v.active = 0 === g.length);
var _ = c.height || 64;
r.height = Math.max(s.height, 6 + g.length * (_ + 6));
if (!s._dropScrollBound) {
s._dropScrollBound = !0;
var f = 0;
s.on(cc.Node.EventType.TOUCH_START, function(t) {
f = t.getLocation().y;
e._clubScrollMoved = !1;
});
s.on(cc.Node.EventType.TOUCH_MOVE, function(t) {
Math.abs(t.getLocation().y - f) > 6 && (e._clubScrollMoved = !0);
});
s.on(cc.Node.EventType.TOUCH_CANCEL, function() {
e._clubScrollMoved = !1;
});
}
if (!this._clubChipSel && !this._clubChipLoading) {
this._clubChipLoading = !0;
cc.resources.load("images/other/button_yellow", cc.SpriteFrame, function(t, i) {
e._clubChipLoading = !1;
if (!t && i) {
e._clubChipSel = i;
cc.isValid(r) && r.children.forEach(function(e) {
if ("tchip" === e.name && e._selected) {
var t = e.getChildByName("bgimg"), n = t ? t.getComponent(cc.Sprite) : null;
n && (n.spriteFrame = i);
}
});
}
});
}
g.forEach(function(t, i) {
var n = cc.instantiate(c);
n.name = "tchip";
n.active = !0;
n.setPosition(0, -(6 + _ / 2 + i * (_ + 6)));
var a = n.getChildByName("l");
if (a) {
var s = a.getComponent(cc.Label);
if (s) {
var o = t.name || "牌桌" + t.table.id;
s.string = o;
e._clubClampLabel(s, o);
}
}
var l = e._clubChipName === t.key;
n._selected = l;
var h = n.getChildByName("bgimg"), d = h ? h.getComponent(cc.Sprite) : null;
d && l && e._clubChipSel && (d.spriteFrame = e._clubChipSel);
r.addChild(n);
n.on(cc.Node.EventType.TOUCH_END, function() {
if (e._clubScrollMoved) e._clubScrollMoved = !1; else {
e._clubChipName = t.key;
e._clubChipsOpen = !1;
e._clubTablesSig = null;
e._clubLoadTables();
e._clubRenderTableChips();
}
});
});
o && o.scrollToTop(0);
} else console.log("[俱乐部]gamesDrop 缺少 itemTpl 模板");
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
return 0 === i.indexOf("baobao") ? 6 : "sss6" == i ? 6 : 0 === i.indexOf("zj4") || 0 === i.indexOf("zp4") || "wujin4" == i || "sss4" == i ? 4 : 2;
},
_clubAddTableCard: function(e, t, i) {
var n = this, a = this._clubMaxPlayers(i), s = this._clubCardTpl(a);
if (s) {
var o = s.width, r = s.height, l = 5 + o / 2 + Math.floor(t / 2) * (o + 5), c = -(5 + r / 2 + t % 2 * (r + 5)), h = cc.instantiate(s);
h.active = !0;
h.setPosition(l, c);
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
if (g) for (var B = 0; B < 2; B++) {
var M = u[B];
M._side = 0 === B ? "下左" : "上右";
y[B] = M;
this._clubSetSeat(M, _[B] || 0, f[B] || "");
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
var x = T.getComponent(cc.Label);
x && (x.string = i.name || "");
}
var I = {};
try {
I = JSON.parse(i.conf) || {};
} catch (e) {}
for (var P = this._clubCurGame || {}, A = P.difen_options || [], L = P.jushu_options || [], R = null != I.difen_value ? I.difen_value : "number" == typeof I.difen && null != A[I.difen] ? A[I.difen] : I.difen, k = null != I.jushu_value ? I.jushu_value : "number" == typeof I.jushuxuanze && null != L[I.jushuxuanze] ? L[I.jushuxuanze] : I.jushuxuanze, O = Number(I.min_bean) || 0, F = 0; F < h.children.length; ++F) {
var j = h.children[F];
if ("c" === j.name || "C" === j.name) {
var E = j.getComponent(cc.Label);
E && (E.string = "底分" + (null != R ? R : "-") + "  局数" + (null != k ? k : "-"));
}
}
var D = h.getChildByName("ca");
if (D) {
var H = 0 === String(i.game_type || I.type || "").indexOf("baobao");
D.active = H;
if (H) {
var G = D.getComponent(cc.Label);
G && (G.string = "入场：" + O + "，离场：" + (Number(I.kick_bean) || 0));
}
}
var z = h.getChildByName("btnClear");
if (z) {
z.active = !!i.can_clear;
if (i.can_clear) {
z.off(cc.Node.EventType.TOUCH_END);
z.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
n._clubTablesScrollMoved ? n._clubTablesScrollMoved = !1 : n._clubClearTable(i);
});
}
}
h.on(cc.Node.EventType.TOUCH_START, function() {
n._clubCardTouchAt = Date.now();
});
h.on(cc.Node.EventType.TOUCH_CANCEL, function() {
n._clubCardTouchAt = 0;
});
h.on(cc.Node.EventType.TOUCH_END, function() {
var e = Date.now() - (n._clubCardTouchAt || 0);
if (n._clubTablesScrollMoved) {
n._clubTablesScrollMoved = !1;
n._clubCardTouchAt = 0;
} else e <= 0 || e > 2e3 || n._clubEnterTable(i);
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
var r = cc.find("Canvas/alert/title"), l = cc.find("Canvas/alert/content");
r && (r = r.getComponent(cc.Label)) && (r.string = e);
l && (l = l.getComponent(cc.Label)) && (l.string = t);
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
var s = e.getChildByName("head");
if (s) if (t <= 0) s.active = !1; else {
var o = this, r = function() {
if (s && cc.isValid(s)) {
s.active = !0;
var e = s.getChildByName("img");
if (e) {
var i = e.getComponent(cc.Sprite), n = e.getComponent("ImageLoader"), a = !(!n || n._userid !== "" + t || !n._spriteFrame);
i && !a && (o._clubHeadFrame ? i.spriteFrame = o._clubHeadFrame : cc.resources.load("images/other/head", cc.SpriteFrame, function(e, t) {
if (!e && t) {
o._clubHeadFrame = t;
!cc.isValid(i) || n && n._spriteFrame || (i.spriteFrame = t);
}
}));
n && n.setUserID(t);
}
}
}, l = cc.vv.baseInfoMap && cc.vv.baseInfoMap[t];
null != l && null != l.sex && Date.now() - (l.ts || 0) < 3e5 ? r() : cc.vv.http.sendRequest("/base_info", {
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
r();
} else r();
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
t._clubSubSentKey = null;
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
var t = this._clubCurGame && this._clubCurGame.game_type ? this._clubCurGame.game_type : null, i = this._clubSubClubId + "|" + (t || "");
if (this._clubSubSentKey !== i) {
this._clubSubSentKey = i;
e.emit("club_subscribe", {
clubid: this._clubSubClubId,
game_type: t
});
}
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
for (var o = e.seats || [], r = [ 0, 0, 0, 0, 0, 0 ], l = this._clubUidNames || (this._clubUidNames = {}), c = 0; c < o.length; ++c) {
var h = o[c].seatindex, d = o[c].userid || 0;
d > 0 && o[c].name && (l[d] = o[c].name);
var u = s.map && h >= 0 && h < s.map.length ? s.map[h] : h;
u >= 0 && u < r.length && (r[u] = d);
}
for (var g = 0; g < s.slots.length; ++g) this._clubSetSeat(s.slots[g], r[g], l[r[g]] || "");
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
this._clubSubSentKey = null;
},
_clubLoadTables: function() {
this._clubStartTableWatch();
var e = this, t = !(!this._clubCur || !this._clubCur._hall), i = {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign
};
t || (i.clubid = this._clubCur.id);
var n = this._clubCurGame && this._clubCurGame.game_type;
n && (i.game_type = n);
cc.vv.http.sendRequest(t ? "/club_tables_hall" : "/club_tables", i, function(t) {
if (0 === t.errcode) {
var i = t.tables || [];
e._clubTableList = i;
e._clubMaybeQuickJoin(i);
var n = i, a = e._clubChipName;
a && (n = i.filter(function(e) {
var t = String(null == e.name ? "" : e.name).replace(/^\s+|\s+$/g, "");
return "#" === a.charAt(0) ? "#" + e.id === a : t === a;
}));
for (var s = "chip:" + (a || "") + ";", o = 0; o < n.length; ++o) s += (n[o].id || "") + ":" + (n[o].player_count || 0) + ":" + (n[o].user_id0 || 0) + "," + (n[o].user_id1 || 0) + "," + (n[o].user_id2 || 0) + "," + (n[o].user_id3 || 0) + "," + (n[o].user_id4 || 0) + "," + (n[o].user_id5 || 0) + ",";
if (s === e._clubTablesSig && e._clubTablesNode && e._clubTablesNode.childrenCount > 0) e._clubRenderTableChips(); else {
e._clubTablesSig = s;
e._clubTableCardMap = {};
if (!e._clubTablesNode || !cc.isValid(e._clubTablesNode)) {
var r = e._clubFind(cc.find("Canvas"), "tablesView");
e._clubTablesNode = r ? r.getChildByName("tables") : null;
if (!e._clubTablesNode) {
console.log("[俱乐部]tables容器缺失,无法渲染牌桌列表");
return;
}
}
var l = e._clubCardTpl();
l && (l.active = !1);
e._clubTablesNode.removeAllChildren();
var c = e._clubTablesNode.parent.width, h = l ? l.width : 360, d = Math.max(1, Math.ceil(n.length / 2));
e._clubTablesNode.width = Math.max(c, d * (h + 5) + 5);
if (0 != n.length) {
n.forEach(function(t, i) {
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
var i = "object" == typeof t && t.gameType || null;
if (i) {
for (var n = this, a = null, s = 0; s < e.length; ++s) {
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
cc.vv && n._clubEnterTable && n._clubEnterTable(a, !0);
}, 300);
}
}
}
},
_clubDbg: function(e) {
try {
cc.vv && cc.vv.http && cc.vv.http.sendRequest && cc.vv.http.sendRequest("/dbg_log", {
m: "[club] " + e
}, null);
} catch (e) {}
},
_clubEnterTable: function(e, t) {
this._doEnterTable(e, !!t);
},
_doEnterTable: function(e, t) {
var i = this, n = cc.vv.wc;
if (!t) {
var a = this._clubCardTouchAt || 0;
if (!a || Date.now() - a > 8e3) {
console.log("[进入房间]拦截非点击进桌 tableid=" + (e ? e.id : "?"));
return;
}
}
n.show("正在进入「" + e.name + "」");
console.log("[进入房间]请求桌面 tableid=" + e.id + " name=" + e.name);
this._clubDbg("enter tableid=" + e.id + " name=" + e.name + " type=" + (e.game_type || ""));
var s = "";
try {
s = String(new Error().stack || "").split("\n").slice(1, 4).join(" <- ").replace(/\s+/g, " ").substring(0, 200);
} catch (e) {}
console.log("[进入房间]触发来源:" + s);
var o = setTimeout(function() {
var e = cc.vv.wc || n;
e.hide();
e.showError("进入房间失败,请重试(服务未响应)");
}, 12e3);
cc.vv.http.sendRequest("/club_enter_table", {
account: cc.vv.userMgr.account,
sign: cc.vv.userMgr.sign,
tableid: e.id,
dbg: s
}, function(t) {
try {
if (null == t || 0 !== t.errcode) {
console.log("[进入房间]失败:" + (t ? t.errcode + " " + t.errmsg : "无响应"));
i._clubDbg("enter FAIL " + (t ? t.errcode + " " + t.errmsg : "no-response"));
clearTimeout(o);
n.hide();
if (t && 2222 == t.errcode) {
n.hide();
i._clubShowConfirm("提示", t.errmsg || "宝宝豆不足，无法进入桌面", null);
} else n.showError(t && t.errmsg ? t.errmsg : "进入桌面失败");
return;
}
console.log("[进入房间]成功 roomid=" + t.roomid + " ip=" + t.ip + ":" + t.port);
i._clubDbg("enter OK room=" + t.roomid + " ip=" + t.ip + ":" + t.port);
clearTimeout(o);
i._clubPanel && (i._clubPanel.active = !1);
i._clubStopTableWatch();
cc.vv.fromClub = !0;
i._clubCur && i._clubCur._hall ? cc.vv.fromClubId = Number(e.club_id) || 0 : cc.vv.fromClubId = i._clubCur ? i._clubCur.id : null;
cc.vv.gameNetMgr.connectGameServer(t);
var a = function e(t) {
if (cc.vv.wc === n) {
var i = cc.director.getScene() ? cc.director.getScene().name : "";
i && "club" !== i ? n.hide() : t <= 0 ? n.hide() : setTimeout(function() {
e(t - 1);
}, 300);
}
};
setTimeout(function() {
a(20);
}, 300);
} catch (e) {
console.log("[进入房间]异常:" + (e && e.message));
clearTimeout(o);
n.hide();
n.showError("进入房间异常:" + (e && e.message));
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
sss4: "十三水(4人)。52张牌每人13张,摆成头3/中5/尾5三道后与其他玩家逐道比牌。\n· 牌型从大到小:同花顺 > 铁支 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 对子 > 单张。\n· 必须头道≤中道≤尾道,顺序不符不允许提交。\n· 每赢一道+1注,三道全胜打枪再+3注;赢过全部对手为全垒打,每家再+3注。\n· 特殊牌型通吃:一条龙×3、六对半×4、三同花/三顺子×5、三分天下×6。\n· 摆牌限时,超时系统自动摆牌。",
sss6: "十三水(6人)。两副牌共104张,每人13张,摆成头3/中5/尾5三道后与其他玩家逐道比牌。\n· 牌型从大到小:同花顺 > 铁支 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 对子 > 单张。\n· 必须头道≤中道≤尾道,顺序不符不允许提交。\n· 每赢一道+1注,三道全胜打枪再+3注;赢过全部对手为全垒打,每家再+3注。\n· 特殊牌型通吃:一条龙×3、六对半×4、三同花/三顺子×5、三分天下×6。\n· 摆牌限时,超时系统自动摆牌。"
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
var l = cc.view.getVisibleSize(), c = cc.view.getVisibleOrigin();
n.setContentSize(l.width, l.height);
n.setPosition(n.parent.convertToNodeSpaceAR(cc.v2(c.x + l.width / 2, c.y + l.height / 2)));
if (cc.isValid(s)) {
var h = s.getComponent(cc.Widget);
h && (h.enabled = !1);
s.setContentSize(l.width, s.height);
var d = s.parent.convertToNodeSpaceAR(cc.v2(c.x + l.width / 2, 0));
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
var l = cc.vv.userMgr.oldRoomId;
cc.log("roomold", l);
if (null != l) {
cc.vv.userMgr.oldRoomId = null;
cc.vv.userMgr.enterRoom(l);
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
e._confirmLogout();
});
}
this._ensureLogoutBtns(t);
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
var l = this._winFind(t, "btnRename");
if (l && cc.isValid(l)) {
if (!l._bbRenameBound) {
l._bbRenameBound = !0;
l.on(cc.Node.EventType.TOUCH_END, function() {
e._showRenameWin();
});
}
this._btnRename = l;
(function e(t) {
for (var i = t.children.slice(), n = 0; n < i.length; n++) i[n] !== l && "btnRename" === String(i[n].name).trim() ? i[n].destroy() : e(i[n]);
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
var r = i(a, "TEXT_LABEL"), l = i(a, "PLACEHOLDER_LABEL");
if (!s.textLabel && r) {
r.active = !0;
s.textLabel = r.getComponent(cc.Label);
}
!s.placeholderLabel && l && (s.placeholderLabel = l.getComponent(cc.Label));
}
}
this._renameInput = s || a;
var c = t(n, "btnOk"), h = t(n, "btnCancel"), d = this;
c && c.on(cc.Node.EventType.TOUCH_END, function() {
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
if (i.switched) {
e._closeWin("bindWin");
cc.vv.wc.showAlert("已合并到原账号，正在切换...");
setTimeout(function() {
cc.vv.userMgr && cc.vv.userMgr.pwdAuth && cc.vv.userMgr.pwdAuth(t, n);
}, 800);
} else {
e._bindAccount = t;
cc.vv.wc.showAlert(i.changed ? "密码修改成功" : "绑定成功");
e._closeWin("bindWin");
var a = e._userInfoValueLabels && e._userInfoValueLabels["账号"];
a && cc.isValid(a.node) && (a.string = t);
}
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
var l = Math.floor(Math.random() * (r + 1)), c = o[r];
o[r] = o[l];
o[l] = c;
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
_ensureLogoutBtns: function(e) {
var t = this, i = this._winFind(e, "btnLogout");
if (i) {
var n = function(e, t) {
var i = e.getComponentInChildren(cc.Label);
i && (i.string = t);
};
n(i, "退出登录");
i.setPosition(-120, i.y);
if (!this._winFind(e, "btnDeleteAccount")) {
var a = cc.instantiate(i);
a.name = "btnDeleteAccount";
a.active = !0;
a.parent = i.parent;
a.setPosition(120, i.y);
n(a, "注销账号");
a.on(cc.Node.EventType.TOUCH_END, function() {
t._deleteAccount();
});
}
}
},
_confirmLogout: function() {
var e = function() {
cc.sys.localStorage.removeItem("wx_account");
cc.sys.localStorage.removeItem("wx_sign");
cc.sys.localStorage.removeItem("login_account");
cc.sys.localStorage.removeItem("login_sign");
cc.sys.localStorage.removeItem("login_type");
cc.vv.wc.show("正在退出...");
setTimeout(function() {
cc.director.loadScene("login");
}, 200);
};
cc.vv.alert && cc.vv.alert.show ? cc.vv.alert.show("退出登录", "确定要退出当前账号吗？", e, !0) : e();
},
_deleteAccount: function() {
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
_makeEditBox: function(e, t, i, n, a, s, o, r, l) {
var c = new cc.Node(t + "_bg");
c.parent = e;
c.setContentSize(a, s);
c.setPosition(i, n);
var h = c.addComponent(cc.Graphics);
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
u.inputMode = l && l.inputMode ? l.inputMode : cc.EditBox.InputMode.NUMERIC;
l && l.password && (u.inputFlag = cc.EditBox.InputFlag.PASSWORD);
l && l.maxLength && (u.maxLength = l.maxLength);
u.string = o;
return u;
},
_makeTextButton: function(e, t, i, n, a, s, o, r, l) {
var c = new cc.Node(t);
c.parent = e;
c.setContentSize(s, o);
c.setPosition(n, a);
var h = c.addComponent(cc.Graphics);
this._drawRoundRect(h, s, o, 10, r);
var d = new cc.Node("text");
d.parent = c;
var u = d.addComponent(cc.Label);
u.string = i;
u.fontSize = 28;
u.color = cc.Color.WHITE;
c._btnLabel = u;
c.on(cc.Node.EventType.TOUCH_END, function() {
cc.isValid(c) && l(c);
});
return c;
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
var l = new cc.Node("panel");
l.parent = s;
l.setContentSize(720, 840);
var c = l.addComponent(cc.Graphics);
this._drawRoundRect(c, 720, 840, 16, new cc.Color(30, 34, 44, 245));
this._makeLabel(l, "创建房间", 36, 0, 370);
this._makeLabel(l, "俱乐部：" + (e.name || ""), 22, 0, 322, new cc.Color(180, 180, 180, 255));
this._makeLabel(l, "玩法：", 26, -300, 240);
this._createGameBtns = [];
for (var h = 0; h < t.length; h++) (function(e) {
var n = t[e], a = 180 * e - 210, s = i._makeTextButton(l, "game_" + e, n.name || n.game_type, a, 240, 160, 64, new cc.Color(70, 76, 92, 255), function() {
i._createSelGame = n;
i._refreshCreateGameBtns();
i._fillCreateDefaults();
});
s._game = n;
i._createGameBtns.push(s);
})(h);
this._makeLabel(l, "玩法简介：", 22, -290, 165, new cc.Color(120, 170, 255, 255));
var d = new cc.Node("createIntro");
d.parent = l;
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
this._makeLabel(l, g[v][0], 26, -210, _);
this._createInputs[g[v][1]] = this._makeEditBox(l, g[v][1], 100, _, 300, 56, "0", "");
}
this._makeTextButton(l, "btnOk", "确定", -140, -380, 200, 72, new cc.Color(41, 121, 211, 255), function() {
i._submitCreateWin();
});
this._makeTextButton(l, "btnCancel", "取消", 140, -380, 200, 72, new cc.Color(90, 94, 106, 255), function() {
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
for (var s = t.jushu_options || [], o = parseInt(n(this._createInputs.jushuInput)), r = -1, l = 0; l < s.length; l++) if (Number(s[l]) === o) {
r = l;
break;
}
if (r < 0) cc.vv.wc.showError("局数只能为：" + (s.length ? s.join(" / ") : "玩法未配置")); else {
var c = parseInt(n(this._createInputs.minInput)), h = parseInt(n(this._createInputs.kickInput));
c >= 0 || (c = 0);
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
min_bean: c,
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
var l = e("Utils");
cc.vv.utils = new l();
try {
var c = e("SceneMgr");
cc.vv.sceneMgr = new c();
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
var l = r.addComponent(cc.Label);
l.string = "0%";
l.fontSize = 22;
l.lineHeight = 26;
}
i.active = !0;
this._preloadBaked || i.setPosition(0, -140);
var c = i.getChildByName("barBg"), h = c.width > 10 ? c.width : 520, d = c.height > 10 ? c.height : 30;
if (null == c.getComponent(cc.Sprite)) {
var u = c.getComponent(cc.Graphics) || c.addComponent(cc.Graphics);
u.clear();
u.fillColor = cc.color(0, 0, 0, 160);
u.roundRect(-h / 2, -d / 2, h, d, Math.min(d / 2, 12));
u.fill();
u.strokeColor = cc.color(255, 215, 120);
u.lineWidth = 2;
u.roundRect(-h / 2, -d / 2, h, d, Math.min(d / 2, 12));
u.stroke();
}
var g = i.getChildByName("barFill");
this._loadFillNode = g;
this._loadFillSprite = g.getComponent(cc.Sprite);
this._loadFill = this._loadFillSprite ? null : g.getComponent(cc.Graphics) || g.addComponent(cc.Graphics);
g.setPosition(-h / 2, 0);
this._loadFillW = h;
this._loadPct = i.getChildByName("pct").getComponent(cc.Label);
this._drawLoadProgress(0);
var v = [ "images", "textures", "sounds", "prefabs" ], _ = {}, f = 0;
v.forEach(function(t) {
_[t] = {
c: 0,
t: 0
};
cc.resources.loadDir(t, function(i, n) {
_[t].c = i;
_[t].t = n;
var a = 0, s = 0;
for (var o in _) {
a += _[o].c;
s += _[o].t;
}
e._drawLoadProgress(s > 0 ? a / s : 0);
}, function(i) {
i && console.log("[预载]目录加载失败:" + t, i);
++f >= v.length && e._onAllResLoaded();
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
var l = this._findChildByName(n, "btnCancel");
l && l.on(cc.Node.EventType.TOUCH_END, function() {
cc.isValid(n) && (n.active = !1);
});
var c = n.getChildByName("dim");
c && c.on(cc.Node.EventType.TOUCH_END, function() {
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
var l = new cc.Node("title");
l.setPosition(0, 150);
l.addComponent(cc.Label);
var c = l.getComponent(cc.Label);
c.fontSize = 32;
c.lineHeight = 38;
c.string = "账号登录";
l.color = cc.color(40, 40, 40, 255);
o.addChild(l);
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
var l = r.getComponent(cc.Label);
l.fontSize = 26;
l.lineHeight = 32;
l.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
l.verticalAlign = cc.Label.VerticalAlign.CENTER;
r.color = cc.color(30, 30, 30, 255);
s.addChild(r);
var c = new cc.Node("placeholderLabel");
c.setContentSize(420, 64);
c.setAnchorPoint(0, .5);
c.setPosition(-210, 0);
c.addComponent(cc.Label);
var h = c.getComponent(cc.Label);
h.fontSize = 26;
h.lineHeight = 32;
h.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
h.string = n;
c.color = cc.color(150, 150, 150, 255);
s.addChild(c);
var d = s.addComponent(cc.EditBox);
d.textLabel = l;
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
var l = r.addComponent(cc.Sprite);
l.sizeMode = cc.Sprite.SizeMode.CUSTOM;
s && (l.spriteFrame = s);
var c = new cc.Node("lbl");
c.addComponent(cc.Label);
var h = c.getComponent(cc.Label);
h.string = a;
h.fontSize = 28;
h.lineHeight = 34;
c.color = cc.color(255, 255, 255, 255);
r.addChild(c);
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
this._mask = this.node.parent ? this.node.parent.getChildByName("New Layout") : null;
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
onEnable: function() {
this._mask && cc.isValid(this._mask) && (this._mask.active = !0);
},
onDisable: function() {
this._mask && cc.isValid(this._mask) && (this._mask.active = !1);
},
onSlided: function(e) {
"yinxiao" == e.node.parent.name ? cc.vv.audioMgr.setSFXVolume(e.progress) : "yinyue" == e.node.parent.name && cc.vv.audioMgr.setBGMVolume(e.progress);
this.refreshVolume();
},
initButtonHandler: function(e) {
null != e && cc.vv.utils.addClickEvent(e, this.node, "setting", "onBtnClicked");
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
}, {}, [ "use_v2.0.x_cc.Toggle_event", "BBGame", "clubAdmin", "clubScene", "GPGame", "Alert", "CheckBox", "CreateRoom", "HallHelp", "History", "ImageLoader", "JoinGameInput", "hall", "setting", "Lodinglogin", "login", "Chat", "DeskStyle", "DiceRoll", "Folds", "GameOver", "GameOverZP", "GameResult", "MJGameBMJ", "MJGameLDH", "MJGameWujin", "MJGameZJLAO", "MJGameZJZX", "MJRoom", "NoticeTip", "OpTiles", "OpeningFlow", "PengGangs", "PopupMgr", "RadioButton", "RadioGroupMgr", "ReConnect", "ReplayCtrl", "Seat", "TimePointer", "UserInfoShow", "Voice", "SSSGame" ]);