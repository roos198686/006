window.__require = function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var b = o.split("/");
        b = b[b.length - 1];
        if (!t[b]) {
          var a = "function" == typeof __require && __require;
          if (!u && a) return a(b, !0);
          if (i) return i(b, !0);
          throw new Error("Cannot find module '" + o + "'");
        }
        o = b;
      }
      var f = n[o] = {
        exports: {}
      };
      t[o][0].call(f.exports, function(e) {
        var n = t[o][1][e];
        return s(n || e);
      }, f, f.exports, e, t, n, r);
    }
    return n[o].exports;
  }
  var i = "function" == typeof __require && __require;
  for (var o = 0; o < r.length; o++) s(r[o]);
  return s;
}({
  AnysdkMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "dfe3edwzmNFyohgr8CILrto", "AnysdkMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        _isCapturing: false
      },
      onLoad: function onLoad() {},
      init: function init() {
        this.ANDROID_API = "com/vivigames/scmj/WXAPI";
        this.IOS_API = "AppController";
      },
      login: function login() {
        cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod(this.ANDROID_API, "Login", "()V") : cc.sys.os == cc.sys.OS_IOS ? jsb.reflection.callStaticMethod(this.IOS_API, "login") : console.log("platform:" + cc.sys.os + " dosn't implement share.");
      },
      share: function share(title, desc) {
        cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod(this.ANDROID_API, "Share", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V", cc.vv.SI.appweb, title, desc) : cc.sys.os == cc.sys.OS_IOS ? jsb.reflection.callStaticMethod(this.IOS_API, "share:shareTitle:shareDesc:", cc.vv.SI.appweb, title, desc) : console.log("platform:" + cc.sys.os + " dosn't implement share.");
      },
      copyText: function copyText(text) {
        text = "" + (null == text ? "" : text);
        if (cc.sys.isNative && "undefined" != typeof jsb && jsb.reflection) try {
          if (cc.sys.os == cc.sys.OS_ANDROID) return !!jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "copyText", "(Ljava/lang/String;)Z", text);
          if (cc.sys.os == cc.sys.OS_IOS) return !!jsb.reflection.callStaticMethod(this.IOS_API, "copyText:", text);
        } catch (e) {
          console.log("[anysdk] copyText native fail", e);
        }
        try {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          ta.style.top = "0";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          var ok = document.execCommand("copy");
          document.body.removeChild(ta);
          return !!ok;
        } catch (e2) {
          console.log("[anysdk] copyText dom fail", e2);
        }
        return false;
      },
      copyShareLink: function copyShareLink() {
        var url = cc.vv.SI && cc.vv.SI.appweb ? "" + cc.vv.SI.appweb : "";
        if (!url) return false;
        return this.copyText(url);
      },
      shareResult: function shareResult() {
        if (this._isCapturing) return;
        this._isCapturing = true;
        var size = cc.director.getWinSize();
        var currentDate = new Date();
        var fileName = "result_share.jpg";
        var fullPath = jsb.fileUtils.getWritablePath() + fileName;
        jsb.fileUtils.isFileExist(fullPath) && jsb.fileUtils.removeFile(fullPath);
        var texture = new cc.RenderTexture(Math.floor(size.width), Math.floor(size.height));
        texture.setPosition(cc.p(size.width / 2, size.height / 2));
        texture.begin();
        cc.director.getRunningScene().visit();
        texture.end();
        texture.saveToFile(fileName, cc.IMAGE_FORMAT_JPG);
        var self = this;
        var tryTimes = 0;
        var fn = function fn() {
          if (jsb.fileUtils.isFileExist(fullPath)) {
            var height = 100;
            var scale = height / size.height;
            var width = Math.floor(size.width * scale);
            cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod(self.ANDROID_API, "ShareIMG", "(Ljava/lang/String;II)V", fullPath, width, height) : cc.sys.os == cc.sys.OS_IOS ? jsb.reflection.callStaticMethod(self.IOS_API, "shareIMG:width:height:", fullPath, width, height) : console.log("platform:" + cc.sys.os + " dosn't implement share.");
            self._isCapturing = false;
          } else {
            tryTimes++;
            if (tryTimes > 10) {
              console.log("time out...");
              return;
            }
            setTimeout(fn, 50);
          }
        };
        setTimeout(fn, 50);
      },
      onLoginResp: function onLoginResp(code) {
        var data = {
          code: code,
          os: cc.sys.os
        };
        var fn = function fn(ret) {
          if (0 == ret.errcode) {
            cc.sys.localStorage.setItem("wx_account", ret.account);
            cc.sys.localStorage.setItem("wx_sign", ret.sign);
          } else if (cc.vv.wc && cc.vv.wc.showError) {
            cc.vv.wc.showError("wechat login disabled" == ret.errmsg ? "\u540e\u53f0\u5df2\u5173\u95ed\u5fae\u4fe1\u767b\u5f55" : "\u5fae\u4fe1\u767b\u5f55\u5931\u8d25,\u8bf7\u91cd\u8bd5");
            return;
          }
          cc.vv.userMgr.onAuth(ret);
        };
        cc.vv.http.sendRequest("/wechat_auth", data, fn);
      }
    });
    cc._RF.pop();
  }, {} ],
  AudioMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "f7582YPQ3hJ1J1oYxH3MYpi", "AudioMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        bgmVolume: 1,
        sfxVolume: 1,
        bgmAudioID: -1
      },
      init: function init() {
        if (this._inited) return;
        this._inited = true;
        this._clips = {};
        this._bgmUrl = null;
        this._unlocked = false;
        var self = this;
        "number" !== typeof this.bgmVolume && (this.bgmVolume = 1);
        "number" !== typeof this.sfxVolume && (this.sfxVolume = 1);
        var t = cc.sys.localStorage.getItem("bgmVolume");
        if (null != t) {
          var v = parseFloat(t);
          v >= 0 && v <= 1 && (this.bgmVolume = v);
        }
        var t2 = cc.sys.localStorage.getItem("sfxVolume");
        if (null != t2) {
          var v2 = parseFloat(t2);
          v2 >= 0 && v2 <= 1 && (this.sfxVolume = v2);
        }
        cc.game.on(cc.game.EVENT_HIDE, function() {
          console.log("cc.audioEngine.pauseAll");
          cc.audioEngine.pauseAll();
        });
        cc.game.on(cc.game.EVENT_SHOW, function() {
          console.log("cc.audioEngine.resumeAll");
          self.resumeAll();
        });
        var unlock = function unlock() {
          self._onUserGesture();
        };
        if ("undefined" !== typeof document && document.addEventListener) {
          document.addEventListener("touchstart", unlock, false);
          document.addEventListener("touchend", unlock, false);
          document.addEventListener("mousedown", unlock, false);
        }
        "undefined" !== typeof wx && wx && wx.onTouchStart && wx.onTouchStart(unlock);
      },
      _onUserGesture: function _onUserGesture() {
        if (this._unlocked) return;
        this._unlocked = true;
        var isWX = "undefined" !== typeof wx && wx && wx.getSystemInfoSync;
        if (!cc.sys.isBrowser && !isWX) return;
        try {
          cc.audioEngine.resumeAll();
        } catch (e) {}
        if (this._bgmUrl) {
          if (this.bgmAudioID >= 0) {
            try {
              cc.audioEngine.stop(this.bgmAudioID);
            } catch (e) {}
            this.bgmAudioID = -1;
          }
          this.playBGM(this._bgmUrl);
        }
      },
      _loadClip: function _loadClip(url, cb) {
        var self = this;
        var cache = this._clips || (this._clips = {});
        if (cache[url]) {
          cb(cache[url]);
          return;
        }
        var hasExt = /\.[^\/]+$/.test(url);
        var noExt = hasExt ? url.replace(/\.[^\/]+$/, "") : url;
        var wav = /\.wav$/i.test(url);
        var tries = hasExt ? [ "sounds/" + url, "sounds/" + noExt, "sounds/" + noExt + (wav ? ".mp3" : ".wav") ] : [ "sounds/" + url + ".mp3", "sounds/" + url, "sounds/" + url + ".wav" ];
        var i = 0;
        function next() {
          if (i >= tries.length) {
            console.log("[AudioMgr]\u52a0\u8f7d\u5931\u8d25:", url);
            cb(null);
            return;
          }
          var path = tries[i++];
          cc.resources.load(path, cc.AudioClip, function(err, clip) {
            if (err || !clip) {
              next();
              return;
            }
            cache[url] = clip;
            cb(clip);
          });
        }
        next();
      },
      playBGM: function playBGM(url) {
        var self = this;
        this._bgmUrl = url;
        this._loadClip(url, function(clip) {
          if (!clip) return;
          if (self.bgmAudioID >= 0) {
            try {
              cc.audioEngine.stop(self.bgmAudioID);
            } catch (e) {}
            self.bgmAudioID = -1;
          }
          self.bgmAudioID = cc.audioEngine.play(clip, true, self.bgmVolume);
        });
      },
      playSFX: function playSFX(url) {
        var self = this;
        this.sfxVolume > 0 && this._loadClip(url, function(clip) {
          if (!clip) return;
          cc.audioEngine.play(clip, false, self.sfxVolume);
        });
      },
      setSFXVolume: function setSFXVolume(v) {
        if (this.sfxVolume != v) {
          cc.sys.localStorage.setItem("sfxVolume", v);
          this.sfxVolume = v;
        }
      },
      setBGMVolume: function setBGMVolume(v, force) {
        this.bgmAudioID >= 0 && (v > 0 ? cc.audioEngine.resume(this.bgmAudioID) : cc.audioEngine.pause(this.bgmAudioID));
        if (this.bgmVolume != v || force) {
          cc.sys.localStorage.setItem("bgmVolume", v);
          this.bgmVolume = v;
          this.bgmAudioID >= 0 && cc.audioEngine.setVolume(this.bgmAudioID, v);
        }
      },
      pauseAll: function pauseAll() {
        cc.audioEngine.pauseAll();
      },
      resumeAll: function resumeAll() {
        cc.audioEngine.resumeAll();
        this.bgmVolume <= 0 && this.bgmAudioID >= 0 && cc.audioEngine.pause(this.bgmAudioID);
      }
    });
    cc._RF.pop();
  }, {} ],
  GameNetMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "4c5cfC0K1VGQYg9AqndkIE9", "GameNetMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        dataEventHandler: null,
        roomId: null,
        maxNumOfGames: 0,
        numOfGames: 0,
        numOfMJ: 0,
        seatIndex: -1,
        seats: null,
        turn: -1,
        button: -1,
        chupai: -1,
        gamestate: "",
        isOver: false,
        dissoveData: null,
        waitCaishenMode: null,
        waitBaoData: null,
        bbMyCards: null,
        bbMySeat: -1,
        bbSeats: null,
        bbBankerSeat: 0,
        bbBankerMode: true,
        bbGameType: null,
        bbPhase: null,
        bbArrangeDeadline: 0,
        bbMyDaos: null,
        bbArranged: false,
        _ignoreDisconnectOnce: false,
        roomBackScene: "",
        roomBackClubId: null
      },
      reset: function reset() {
        this.turn = -1;
        this.chupai = -1;
        this.button = -1;
        this.gamestate = "";
        this.curaction = null;
        if (null == this.seats) return;
        for (var i = 0; i < this.seats.length; ++i) {
          this.seats[i].holds = [];
          this.seats[i].folds = [];
          this.seats[i].pengs = [];
          this.seats[i].chis = [];
          this.seats[i].angangs = [];
          this.seats[i].diangangs = [];
          this.seats[i].wangangs = [];
          this.seats[i].hua = [];
          this.seats[i].ready = false;
          this.seats[i].hued = false;
        }
      },
      clear: function clear() {
        this.dataEventHandler = null;
        if (null == this.isOver) {
          this.seats = null;
          this.roomId = null;
          this.maxNumOfGames = 0;
          this.numOfGames = 0;
        }
      },
      clearRoomState: function clearRoomState() {
        this.reset();
        this.roomId = null;
        this.seats = null;
        this.conf = null;
        this.numOfMJ = 0;
        this.numOfGames = 0;
        this.maxNumOfGames = 0;
        this.laozhuang = 0;
        this.isOver = false;
        this.dissoveData = null;
        this.overData = null;
        this.waitCaishenMode = null;
        this.waitBaoData = null;
        this.bbMyCards = null;
        this.bbMySeat = -1;
        this.bbSeats = null;
        this.bbBankerSeat = 0;
        this.bbBankerMode = true;
        this.bbGameType = null;
        this.bbPhase = null;
        this.bbArrangeDeadline = 0;
        this.bbMyDaos = null;
        this.bbArranged = false;
        this.bbWatching = false;
        this.bbReveal = null;
        this.bbOverDetails = null;
        this.sssStart = null;
        this.sssMyCards = null;
        this.sssMySeat = -1;
        this.sssSeats = null;
        this.sssArrange = null;
        this.sssArrangeDeadline = 0;
        this.sssConfirmed = null;
        this.sssResult = null;
        this._pendingEvents = [];
      },
      exitToTableHall: function exitToTableHall() {
        var cid = 0;
        this.roomBackClubId && (cid = parseInt(this.roomBackClubId) || 0);
        cid > 0 || !cc.vv.fromClubId || (cid = parseInt(cc.vv.fromClubId) || 0);
        cid > 0 || !this.conf || !this.conf.clubid || (cid = parseInt(this.conf.clubid) || 0);
        if (cid > 0) {
          cc.vv.fromClub = true;
          cc.vv.fromClubId = cid;
        }
        console.log("[\u9000\u51fa\u623f\u95f4]\u56de\u724c\u684c\u5927\u5385 clubId=" + cid);
        cc.vv.sceneMgr ? cc.vv.sceneMgr.load("club") : cc.director.loadScene("club");
      },
      onLoad: function onLoad() {
        this._pendingEvents = [];
        var handler = null, self = this;
        Object.defineProperty(this, "dataEventHandler", {
          configurable: true,
          get: function get() {
            return handler;
          },
          set: function set(v) {
            handler = v;
            if (v && self._pendingEvents.length) {
              var q = self._pendingEvents;
              self._pendingEvents = [];
              for (var i = 0; i < q.length; ++i) {
                console.log("[GameNetMgr] \u91cd\u653e\u4e8b\u4ef6", q[i].event);
                v.emit(q[i].event, {
                  detail: q[i].data
                });
              }
            }
          }
        });
      },
      dispatchEvent: function dispatchEvent(event, data) {
        console.log("[GameNetMgr.dispatchEvent] event=", event, " dataEventHandler=", !!this.dataEventHandler);
        if (this.dataEventHandler) this.dataEventHandler.emit(event, {
          detail: data
        }); else {
          null == this._pendingEvents && (this._pendingEvents = []);
          this._pendingEvents.length < 300 && this._pendingEvents.push({
            event: event,
            data: data
          });
          console.error("[GameNetMgr.dispatchEvent] dataEventHandler is NULL! event=" + event + " \u5df2\u5165\u961f\u5f85\u91cd\u653e");
        }
      },
      getSeatIndexByID: function getSeatIndexByID(userId) {
        for (var i = 0; i < this.seats.length; ++i) {
          var s = this.seats[i];
          if (s.userid == userId) return i;
        }
        return -1;
      },
      isOwner: function isOwner() {
        return 0 == this.seatIndex;
      },
      getSeatByID: function getSeatByID(userId) {
        var seatIndex = this.getSeatIndexByID(userId);
        var seat = this.seats[seatIndex];
        return seat;
      },
      getSelfData: function getSelfData() {
        return this.seats[this.seatIndex];
      },
      getLocalIndex: function getLocalIndex(index) {
        var len = this.seats ? this.seats.length : 2;
        var ret = (index - this.seatIndex + len) % len;
        return ret;
      },
      sceneForType: function sceneForType(t) {
        t = String(t || "");
        if (0 === t.indexOf("baobao_shou")) return "mjgame_bb_shou";
        if (0 === t.indexOf("baobao")) return "mjgame_bb_mian";
        if ("zj_lao" == t) return "mjgame_zjlao";
        if ("zj_bt" == t) return "mjgame_bmj";
        if ("zj_zx" == t) return "mjgame_zjzx";
        if ("zp" == t) return "mjgame_zp";
        if ("wujin" == t) return "mjgame_wujin";
        if ("wujin4" == t) return "mjgame_wujin4";
        if ("guanpai2" == t) return "mjgame_gp2";
        if ("guanpai3" == t) return "mjgame_gp3";
        if ("sss2" == t || "sss4" == t || "sss6" == t) return "mjgame_sss";
        if ("zj" == t || "zj4" == t || "zj4_bt" == t) return "mjgame_ldh";
        return "mjgame_bb_mian";
      },
      getGameScene: function getGameScene() {
        return this.sceneForType(this.conf && this.conf.type);
      },
      prepareReplay: function prepareReplay(roomInfo, detailOfGame) {
        this.roomId = roomInfo.id;
        this.seats = roomInfo.seats;
        this.turn = detailOfGame.base_info.button;
        var baseInfo = detailOfGame.base_info;
        for (var i = 0; i < this.seats.length; ++i) {
          var s = this.seats[i];
          s.seatindex = i;
          s.score = null;
          s.holds = baseInfo.game_seats[i];
          s.pengs = [];
          s.chis = [];
          s.angangs = [];
          s.diangangs = [];
          s.wangangs = [];
          s.folds = [];
          cc.vv.userMgr.userId == s.userid && (this.seatIndex = i);
        }
        this.conf = {
          type: baseInfo.type
        };
        null == this.conf.type && (this.conf.type = "zj");
      },
      getWanfa: function getWanfa() {
        var conf = this.conf;
        if (null == conf) {
          console.log("[getWanfa] conf IS NULL");
          return "";
        }
        var dbg = {};
        for (var k in conf) dbg[k] = "string" === typeof conf[k] && conf[k].length > 60 ? conf[k].substring(0, 60) + "..." : conf[k];
        console.log("[getWanfa] conf keys=", Object.keys(conf), "dbg=", JSON.stringify(dbg));
        var name = "\u5b9d\u5b9d";
        "baobao_mian" == conf.type ? name = "\u5b9d\u5b9d\u514d\u6446" : "baobao_shou" == conf.type ? name = "\u5b9d\u5b9d\u624b\u52a8\u6446" : conf.club_table_name ? name = conf.club_table_name : conf.type && (name = conf.type);
        var strArr = [ name ];
        var baseScore = null != conf.baseScore ? conf.baseScore : null != conf.base_score ? conf.base_score : conf.base;
        console.log("[getWanfa] baseScore=", baseScore, " conf.baseScore=", conf.baseScore, " conf.base_score=", conf.base_score, " conf.base=", conf.base);
        null != baseScore && "" !== baseScore && baseScore > 0 ? strArr.push("\u5e95\u5206" + baseScore) : console.log("[getWanfa] baseScore SKIPPED (null/empty/0)");
        var maxTaiVal = null != conf.maxTai ? conf.maxTai : conf.max_tai;
        var isBaobao = "baobao_mian" == conf.type || "baobao_shou" == conf.type;
        console.log("[getWanfa] maxTaiVal=", maxTaiVal, " conf.maxTai=", conf.maxTai);
        !isBaobao && null != maxTaiVal && maxTaiVal > 0 && strArr.push(maxTaiVal + "\u53f0\u5c01\u9876");
        console.log("[getWanfa] maxGames=", conf.maxGames, " conf.max_games=", conf.max_games);
        null != conf.maxGames && conf.maxGames > 0 && strArr.push(conf.maxGames + "\u5c40");
        var isZJTai = "zj" == conf.type || "zj_bt" == conf.type || "zj4" == conf.type || "zj4_bt" == conf.type || "zj_zx" == conf.type || "zj4_zx" == conf.type;
        if (isZJTai) {
          var tr = conf.taiRules;
          if (null != tr && "string" === typeof tr) try {
            tr = JSON.parse(tr);
          } catch (e) {
            console.log("[getWanfa] taiRules parse FAIL:", e.message);
            tr = null;
          }
          console.log("[getWanfa] taiRules after parse=", tr);
          var minTai = tr && null != tr.min_tai ? Number(tr.min_tai) : 1;
          minTai > 0 && strArr.push(minTai + "\u53f0\u8d77\u80e1");
        }
        var result = strArr.join(" ");
        console.log("[getWanfa] FINAL=", result);
        return result;
      },
      applyPushHolds: function applyPushHolds(seatData, holds) {
        if (null == seatData || null == holds) return;
        "[object Array]" === Object.prototype.toString.call(holds) ? seatData.holds = holds : "number" === typeof holds && (seatData.holdCount = holds);
      },
      initSeatData: function initSeatData(s) {
        null == s.holds && (s.holds = []);
        null == s.folds && (s.folds = []);
        null == s.pengs && (s.pengs = []);
        null == s.chis && (s.chis = []);
        null == s.angangs && (s.angangs = []);
        null == s.diangangs && (s.diangangs = []);
        null == s.wangangs && (s.wangangs = []);
        null == s.hued && (s.hued = false);
        null == s.ready && (s.ready = false);
      },
      initHandlers: function initHandlers() {
        var self = this;
        cc.vv.net.addHandler("login_result", function(data) {
          console.log(data);
          if (self._loginTimer) {
            clearTimeout(self._loginTimer);
            self._loginTimer = null;
          }
          if (0 === data.errcode) {
            var data = data.data;
            self.roomId = data.roomid;
            self.conf = data.conf;
            self.maxNumOfGames = data.conf.maxGames;
            self.numOfGames = data.numofgames;
            self.seats = data.seats;
            for (var si = 0; si < self.seats.length; ++si) self.seats[si].seatindex = si;
            self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
            self.isOver = false;
            self.overData = null;
            self.bbOverDetails = null;
            self.bbMyCards = null;
            self.bbMyDaos = null;
            self.bbPhase = null;
            self.bbArranged = false;
            self.bbMyMian = null;
            data.conf && data.conf.type && (cc.vv.lastGameType = data.conf.type);
            var _cid = data.conf && Number(data.conf.clubid) || Number(cc.vv.fromClubId) || 0;
            self.roomBackClubId = _cid > 0 ? _cid : null;
          } else {
            var hadRoom = null != self.roomId;
            self.clearRoomState();
            var failMsg = data.errmsg || "\u8fdb\u5165\u623f\u95f4\u5931\u8d25";
            failMsg.indexOf("\u5b9d\u5b9d\u8c46") >= 0 ? cc.vv.wc.showAlert(failMsg) : cc.vv.wc.showError(failMsg);
            hadRoom && setTimeout(function() {
              self.exitToTableHall();
            }, 1200);
          }
        });
        cc.vv.net.addHandler("login_finished", function(data) {
          console.log("login_finished");
          if (self._loginTimer) {
            clearTimeout(self._loginTimer);
            self._loginTimer = null;
          }
          var sceneName = self.getGameScene();
          console.log("[\u8fdb\u5165\u623f\u95f4]\u52a0\u8f7d\u573a\u666f " + sceneName);
          var onSceneLaunched = function onSceneLaunched() {
            if (self.overData) {
              var od = self.overData;
              self.overData = null;
              self.bbOverDetails = od.details || null;
              self.dispatchEvent("game_over", od.results);
              if (od.endinfo) {
                self.isOver = true;
                self.dispatchEvent("game_end", {
                  endinfo: od.endinfo,
                  roundHistory: od.roundHistory || null
                });
              }
            }
          };
          var ok = null;
          try {
            ok = cc.vv.sceneMgr ? cc.vv.sceneMgr.load(sceneName, onSceneLaunched) : cc.director.loadScene(sceneName, onSceneLaunched);
          } catch (e) {
            console.log("[\u8fdb\u5165\u623f\u95f4]\u52a0\u8f7d\u573a\u666f\u5f02\u5e38:" + (e && e.message));
          }
          false === ok && cc.vv.wc.showError("\u573a\u666f " + sceneName + " \u672a\u5bfc\u5165,\u8bf7\u5728Cocos Creator\u4e2d\u5237\u65b0\u8d44\u6e90\u540e\u91cd\u8bd5");
        });
        cc.vv.net.addHandler("exit_result", function(data) {
          self._ignoreDisconnectOnce = true;
          setTimeout(function() {
            self._ignoreDisconnectOnce = false;
          }, 3e3);
          self.clearRoomState();
          self.dispatchEvent("exit_result", {});
        });
        cc.vv.net.addHandler("exit_notify_push", function(data) {
          var userId = data;
          var s = self.getSeatByID(userId);
          if (null != s) {
            s.userid = 0;
            s.name = "";
            self.dispatchEvent("user_state_changed", s);
          }
        });
        cc.vv.net.addHandler("dispress_push", function(data) {
          self._ignoreDisconnectOnce = true;
          setTimeout(function() {
            self._ignoreDisconnectOnce = false;
          }, 3e3);
          self.clearRoomState();
          self.dispatchEvent("dispress_push", null);
        });
        cc.vv.net.addHandler("kick_offline", function(data) {
          console.log("[kick_offline] \u88ab\u5176\u4ed6\u8bbe\u5907\u9876\u4e0b\u7ebf:", data && data.reason);
          self._ignoreDisconnectOnce = true;
          self.clearRoomState();
          self.dispatchEvent("kick_offline", data);
          setTimeout(function() {
            cc.vv.sceneMgr ? cc.vv.sceneMgr.load("hall") : cc.director.loadScene("hall");
          }, 100);
        });
        cc.vv.net.addHandler("disconnect", function(data) {
          if (self._ignoreDisconnectOnce) return;
          var doLoad = function doLoad(name) {
            cc.vv.sceneMgr ? cc.vv.sceneMgr.load(name) : cc.director.loadScene(name);
          };
          if (null == self.roomId) self.exitToTableHall(); else if (false == self.isOver) {
            cc.vv.userMgr.oldRoomId = self.roomId;
            self.dispatchEvent("disconnect");
          } else self.roomId = null;
        });
        cc.vv.net.addHandler("new_user_comes_push", function(data) {
          var seatIndex = data.seatindex;
          if (self.seats[seatIndex].userid > 0) self.seats[seatIndex].online = true; else {
            data.online = true;
            self.seats[seatIndex] = data;
          }
          self.dispatchEvent("new_user", self.seats[seatIndex]);
        });
        cc.vv.net.addHandler("user_state_push", function(data) {
          var userId = data.userid;
          var seat = self.getSeatByID(userId);
          seat.online = data.online;
          self.dispatchEvent("user_state_changed", seat);
        });
        cc.vv.net.addHandler("user_ready_push", function(data) {
          console.log("[BB] user_ready_push recv", JSON.stringify(data));
          var userId = data.userid;
          var seat = self.getSeatByID(userId);
          seat.ready = data.ready;
          self.dispatchEvent("user_state_changed", seat);
        });
        cc.vv.net.addHandler("game_start_push", function(data) {
          console.log("game_start_push");
          self.button = data.button;
          self.laozhuang = data.laozhuang || 0;
          self.turn = null != data.turn ? data.turn : data.button;
          self.numOfMJ = data.numofmj;
          self.gamestate = "begin";
          null == self.conf && (self.conf = {});
          self.conf.liuju_left = null != data.liuju_left ? Math.max(0, Number(data.liuju_left) || 0) : null;
          self.conf.hu_delay = null != data.hu_delay ? Math.max(0, Number(data.hu_delay) || 0) : null;
          self.dispatchEvent("mj_count");
          self.conf.caishen = data.caishen;
          self.conf.caishen2 = data.caishen2;
          self.conf.fanPai = data.fanPai;
          self.conf.playStyle = data.playStyle;
          null != data.hu_guo_confirm && (self.conf.hu_guo_confirm = data.hu_guo_confirm);
          self.conf.gang_liuju = data.gang_liuju || 0;
          self.conf.baoDone = false;
          self.conf.baoMode = null != data.baoMode ? data.baoMode : -1;
          self.conf.baoSeatIndex = null != data.baoSeatIndex ? data.baoSeatIndex : -1;
          self.conf.baoTai = null != data.baoTai ? data.baoTai : 0;
          null != data.chupaiTimeout && (self.chupaiTimeout = data.chupaiTimeout);
          for (var i = 0; i < data.seats.length; ++i) {
            var sd = data.seats[i];
            var seat = self.seats[i];
            seat.seatindex = i;
            seat.userid = sd.userid;
            seat.name = sd.name;
            seat.score = sd.score;
            self.applyPushHolds(seat, sd.holds);
            sd.pengs instanceof Array && (seat.pengs = sd.pengs);
            sd.pengTiles instanceof Array && (seat.pengTiles = sd.pengTiles);
            sd.chis instanceof Array && (seat.chis = sd.chis);
            sd.angangs instanceof Array && (seat.angangs = sd.angangs);
            sd.diangangs instanceof Array && (seat.diangangs = sd.diangangs);
            sd.wangangs instanceof Array && (seat.wangangs = sd.wangangs);
            sd.folds instanceof Array && (seat.folds = sd.folds);
            sd.hua instanceof Array && (seat.hua = sd.hua);
            null != sd.youjin && (seat.youjinLevel = sd.youjin);
            self.initSeatData(seat);
            seat.ready = false;
            seat.hued = false;
          }
          self.selectingCaishen = !!data.selectingCaishen;
          data.plans && data.plans.length > 0 && (self.waitCaishenPlans = data.plans);
          self.dispatchEvent("game_start");
        });
        cc.vv.net.addHandler("game_mopai_push", function(data) {
          console.log("game_mopai_push");
          var seat = self.seats[data.si];
          if (null == seat) return;
          self.applyPushHolds(seat, data.holds);
          self.numOfMJ = data.numofmj;
          self.turn = data.si;
          self.dispatchEvent("mj_count");
          self.dispatchEvent("game_mopai", {
            seatIndex: data.si,
            pai: data.pai
          });
        });
        cc.vv.net.addHandler("game_chupai_push", function(data) {
          console.log("game_chupai_push");
          self.doTurnChange(data.si);
        });
        cc.vv.net.addHandler("game_chupai_notify_push", function(data) {
          var si = self.getSeatIndexByID(data.userId);
          if (si < 0) return;
          var seatData = self.seats[si];
          self.applyPushHolds(seatData, data.holds);
          self.chupai = data.pai;
          null == seatData.folds && (seatData.folds = []);
          seatData.folds.push(data.pai);
          self.dispatchEvent("game_chupai_notify", {
            seatData: seatData,
            pai: data.pai
          });
        });
        cc.vv.net.addHandler("game_peng_push", function(data) {
          console.log("game_peng_push", JSON.stringify(data));
          var seatData = self.seats[data.si];
          if (null == seatData) return;
          self.removeFoldOfTurn(data.pai);
          self.applyPushHolds(seatData, data.holds);
          null == seatData.pengs && (seatData.pengs = []);
          seatData.pengs.push(data.pai);
          data.pengTiles instanceof Array && (seatData.pengTiles = data.pengTiles);
          self.turn = data.si;
          console.log("[game_peng_push] seatIndex=", self.seatIndex, "updated holds=", seatData.holds ? "object" === typeof seatData.holds ? seatData.holds.length : seatData.holds : "null");
          self.dispatchEvent("peng_notify", seatData);
        });
        cc.vv.net.addHandler("game_gang_push", function(data) {
          console.log("game_gang_push");
          var seatData = self.seats[data.si];
          if (null == seatData) return;
          self.applyPushHolds(seatData, data.holds);
          data.pengs instanceof Array && (seatData.pengs = data.pengs);
          data.pengTiles instanceof Array && (seatData.pengTiles = data.pengTiles);
          null == seatData.pengs && (seatData.pengs = []);
          null == seatData.angangs && (seatData.angangs = []);
          null == seatData.diangangs && (seatData.diangangs = []);
          null == seatData.wangangs && (seatData.wangangs = []);
          var gangtype = data.gangtype || "";
          if ("wan" == gangtype) {
            var idx = seatData.pengs.indexOf(data.pai);
            -1 != idx && seatData.pengs.splice(idx, 1);
            seatData.wangangs.push(data.pai);
          } else if ("ming" == gangtype) {
            self.removeFoldOfTurn(data.pai);
            seatData.diangangs.push(data.pai);
          } else seatData.angangs.push(data.pai);
          self.turn = data.si;
          self.dispatchEvent("gang_notify", {
            seatData: seatData,
            gangtype: "wan" == gangtype ? "wangang" : "ming" == gangtype ? "diangang" : "angang",
            pai: data.pai
          });
        });
        cc.vv.net.addHandler("game_chi_push", function(data) {
          console.log("game_chi_push");
          var seatData = self.seats[data.si];
          if (null == seatData) return;
          self.removeFoldOfTurn(self.chupai);
          self.applyPushHolds(seatData, data.holds);
          null == seatData.chis && (seatData.chis = []);
          var pais = data.pais.slice().sort(function(a, b) {
            return a - b;
          });
          seatData.chis.push(pais);
          self.turn = data.si;
          self.dispatchEvent("chi_notify", seatData);
        });
        cc.vv.net.addHandler("game_action_push", function(data) {
          self.curaction = data;
          console.log(data);
          self.dispatchEvent("game_action", data);
        });
        cc.vv.net.addHandler("game_hu_push", function(data) {
          console.log("game_hu_push");
          self.dispatchEvent("hupai", data);
        });
        cc.vv.net.addHandler("game_hua_push", function(data) {
          console.log("game_hua_push");
          var seat = self.seats[data.si];
          seat && data.hua instanceof Array && (seat.hua = data.hua);
          if (null != data.numofmj) {
            self.numOfMJ = data.numofmj;
            self.dispatchEvent("mj_count");
          }
          self.dispatchEvent("game_hua", data);
        });
        cc.vv.net.addHandler("game_youjin_push", function(data) {
          console.log("game_youjin_push");
          var seat = self.seats[data.si];
          seat && (seat.youjinLevel = data.level || 0);
          self.dispatchEvent("game_youjin", data);
        });
        cc.vv.net.addHandler("game_fenbing_push", function(data) {
          console.log("game_fenbing_push");
          self.dispatchEvent("game_fenbing", data);
        });
        cc.vv.net.addHandler("bao_select_push", function(data) {
          console.log("bao_select_push");
          self.waitBaoData = data;
          self.dispatchEvent("bao_select", data);
        });
        cc.vv.net.addHandler("bao_turn_push", function(data) {
          console.log("bao_turn_push");
          self.dispatchEvent("bao_turn", data);
        });
        cc.vv.net.addHandler("bao_result_push", function(data) {
          console.log("bao_result_push", JSON.stringify(data));
          self.waitBaoData = null;
          null == self.conf && (self.conf = {});
          self.conf.baoMode = data.baoMode;
          if (null != data.caishen && data.caishen >= 0) {
            self.conf.caishen = data.caishen;
            self.conf.caishen2 = data.caishen2;
            self.conf.fanPai = data.fanPai;
            self.conf.baoDone = true;
            self.waitCaishenMode = null;
          }
          null != data.numofmj && (self.numOfMJ = data.numofmj);
          self.dispatchEvent("bao_result", data);
        });
        cc.vv.net.addHandler("caishen_select_push", function(data) {
          console.log("caishen_select_push");
          self.waitCaishenMode = data && null != data.mode ? data.mode : 1;
          self.dispatchEvent("caishen_select", data);
        });
        cc.vv.net.addHandler("game_caishen_plans_push", function(data) {
          console.log("game_caishen_plans_push", JSON.stringify(data));
          if (!data || !data.plans) {
            self.waitCaishenPlans = null;
            self.dispatchEvent("game_caishen_plans", {
              plans: []
            });
            return;
          }
          self.waitCaishenPlans = data.plans;
          self.dispatchEvent("game_caishen_plans", {
            plans: data.plans
          });
        });
        function onGpStartData(data) {
          self.gamestate = "begin";
          self.gpMyCards = (data && data.myCards ? data.myCards : []).slice();
          self.gpMySeat = data && null != data.mySeat ? data.mySeat : self.seatIndex;
          self.gpTurn = data ? null != data.startSeat ? data.startSeat : data.turn : 0;
          self.gpFreePlay = !data || !!data.freePlay;
          self.gpLastPlay = data && data.lastPlay ? data.lastPlay : null;
          self.gpSeats = data ? data.seats : null;
          self.gpTurnDeadline = data ? data.turnDeadline : 0;
          self.waitGpStart = data;
          self.dispatchEvent("gp_start", data);
        }
        cc.vv.net.addHandler("gp_start_push", function(data) {
          console.log("gp_start_push", data ? JSON.stringify(data.myCards) : "");
          onGpStartData(data);
        });
        cc.vv.net.addHandler("gp_resend_push", function(data) {
          console.log("gp_resend_push", data ? JSON.stringify(data.myCards) : "");
          onGpStartData(data);
        });
        cc.vv.net.addHandler("gp_chupai_push", function(data) {
          if (!data) return;
          console.log("gp_chupai_push seat=", data.seatIndex);
          if (data.seatIndex == self.gpMySeat && self.gpMyCards) {
            var rest = self.gpMyCards.slice();
            (data.pais || []).forEach(function(p) {
              var ix = rest.indexOf(p);
              ix >= 0 && rest.splice(ix, 1);
            });
            self.gpMyCards = rest;
          }
          data.seats && (self.gpSeats = data.seats);
          self.gpFreePlay = false;
          self.gpLastPlay = {
            seatIndex: data.seatIndex,
            type: data.type,
            key: data.key,
            len: data.len,
            bombLevel: data.bombLevel || 0,
            pais: (data.pais || []).slice()
          };
          self.dispatchEvent("gp_chupai", data);
        });
        cc.vv.net.addHandler("gp_turn_push", function(data) {
          if (!data) return;
          console.log("gp_turn_push turn=", data.turn);
          self.gpTurn = data.turn;
          self.gpFreePlay = !!data.freePlay;
          self.gpLastPlay = data.lastPlay || null;
          data.seats && (self.gpSeats = data.seats);
          self.gpTurnDeadline = data.turnDeadline;
          self.dispatchEvent("gp_turn", data);
        });
        cc.vv.net.addHandler("gp_pass_push", function(data) {
          if (!data) return;
          console.log("gp_pass_push seat=", data.seatIndex);
          self.dispatchEvent("gp_pass", data);
        });
        cc.vv.net.addHandler("gp_newround_push", function(data) {
          if (!data) return;
          console.log("gp_newround_push turn=", data.turn);
          self.gpTurn = data.turn;
          self.gpTurnDeadline = data.turnDeadline;
          self.gpFreePlay = true;
          self.gpLastPlay = null;
          self.dispatchEvent("gp_newround", data);
        });
        cc.vv.net.addHandler("gp_error_push", function(data) {
          console.log("gp_error_push", data && data.msg);
          self.dispatchEvent("gp_error", data);
        });
        function onBbStartData(data) {
          self.gamestate = "begin";
          self.bbMyCards = (data && data.myCards ? data.myCards : []).slice();
          self.bbMySeat = data && null != data.mySeat ? data.mySeat : self.seatIndex;
          self.bbWatching = !!(data && (data.watching || data.mySeat < 0));
          self.bbReveal = data && data.reveal ? data.reveal : null;
          self.bbSeats = data ? data.seats : null;
          self.bbBankerSeat = data ? data.bankerSeat : 0;
          self.bbBankerMode = !data || !!data.bankerMode;
          self.bbGameType = data ? data.gameType : null;
          self.bbPhase = data ? data.phase : null;
          self.bbArrangeDeadline = data && data.arrangeDeadline || 0;
          self.bbConfirmDeadline = data && data.confirmDeadline || 0;
          self.bbConfirmed = !!data && !!data.confirmed;
          self.bbMyMian = data && data.myMian ? data.myMian : null;
          self.bbMyDaos = data && data.myDaos ? data.myDaos : null;
          self.bbArranged = !!data && !!data.arranged;
          self.dispatchEvent("bb_start", data);
        }
        cc.vv.net.addHandler("bb_start_push", function(data) {
          console.log("bb_start_push", data ? JSON.stringify(data.myCards) : "");
          onBbStartData(data);
        });
        cc.vv.net.addHandler("bb_resend_push", function(data) {
          console.log("bb_resend_push", data ? JSON.stringify(data.myCards) : "");
          data && (data.resend = true);
          onBbStartData(data);
        });
        cc.vv.net.addHandler("bb_reveal_push", function(data) {
          console.log("bb_reveal_push");
          self.dispatchEvent("bb_reveal", data);
        });
        cc.vv.net.addHandler("bb_wait_next_push", function(data) {
          console.log("bb_wait_next_push");
          self.dispatchEvent("bb_wait_next", data || {});
        });
        cc.vv.net.addHandler("bb_arrange_start_push", function(data) {
          console.log("bb_arrange_start_push deadline=", data && data.deadline);
          data && (self.bbArrangeDeadline = data.deadline || 0);
          self.dispatchEvent("bb_arrange_start", data);
        });
        cc.vv.net.addHandler("bb_arrange_ok_push", function(data) {
          self.dispatchEvent("bb_arrange_ok", data);
        });
        cc.vv.net.addHandler("bb_error_push", function(data) {
          console.log("bb_error_push", data && data.msg);
          self.dispatchEvent("bb_error", data);
        });
        cc.vv.net.addHandler("bb_confirm_start_push", function(data) {
          console.log("bb_confirm_start_push deadline=", data && data.deadline);
          data && (self.bbConfirmDeadline = data.deadline || 0);
          self.dispatchEvent("bb_confirm_start", data);
        });
        cc.vv.net.addHandler("bb_confirm_ok_push", function(data) {
          self.dispatchEvent("bb_confirm_ok", data);
        });
        cc.vv.net.addHandler("bb_continue_ok_push", function(data) {
          self.dispatchEvent("bb_continue_ok", data);
        });
        cc.vv.net.addHandler("bb_kicked_push", function(data) {
          console.log("bb_kicked_push", data && data.msg);
          self.dispatchEvent("bb_kicked", data);
        });
        function onSssStartData(data) {
          self.gamestate = "begin";
          self.sssStart = data;
          self.sssMyCards = (data && data.myCards ? data.myCards : []).slice();
          self.sssMySeat = data && null != data.mySeat ? data.mySeat : self.seatIndex;
          self.sssSeats = data && data.seats ? data.seats : null;
          self.sssArrangeDeadline = data && data.arrangeDeadline || 0;
          self.sssConfirmed = {};
          if (data && data.seats) for (var i = 0; i < data.seats.length; ++i) data.seats[i] && data.seats[i].confirmed && (self.sssConfirmed[data.seats[i].userid] = true);
          self.dispatchEvent("sss_start", data);
        }
        cc.vv.net.addHandler("sss_start_push", function(data) {
          console.log("sss_start_push", data ? JSON.stringify(data.myCards) : "");
          onSssStartData(data);
        });
        cc.vv.net.addHandler("sss_arrange_ok_push", function(data) {
          console.log("sss_arrange_ok_push");
          self.sssArrange = data;
          self.dispatchEvent("sss_arrange_ok", data);
        });
        cc.vv.net.addHandler("sss_ready_push", function(data) {
          if (data && null != data.userid) {
            null == self.sssConfirmed && (self.sssConfirmed = {});
            self.sssConfirmed[data.userid] = true;
          }
          self.dispatchEvent("sss_ready", data);
        });
        cc.vv.net.addHandler("sss_error_push", function(data) {
          console.log("sss_error_push", data && data.msg);
          self.dispatchEvent("sss_error", data);
        });
        cc.vv.net.addHandler("sss_result_push", function(data) {
          console.log("sss_result_push");
          self.sssResult = data;
          self.dispatchEvent("sss_result", data);
        });
        cc.vv.net.addHandler("game_begin_push", function(data) {
          console.log("game_begin_push");
          self.button = data;
          self.turn = self.button;
          self.gamestate = "begin";
          self.dispatchEvent("game_begin");
        });
        cc.vv.net.addHandler("game_num_push", function(data) {
          self.numOfGames = data;
          self.dispatchEvent("game_num", data);
        });
        cc.vv.net.addHandler("game_over_push", function(data) {
          console.log("game_over_push");
          null == self.conf && (self.conf = {});
          null != data.caishen && (self.conf.caishen = data.caishen);
          null != data.caishen2 && (self.conf.caishen2 = data.caishen2);
          var results = data.results;
          for (var i = 0; i < self.seats.length; ++i) {
            var seat = self.seats[i];
            if (results && results[i]) {
              var r = results[i];
              seat.score = r.totalscore;
              seat.holds = r.holds || [];
              seat.pengs = r.pengs || [];
              seat.chis = r.chis || [];
              seat.folds = r.folds || [];
              seat.angangs = r.angangs || [];
              seat.diangangs = r.diangangs || [];
              seat.wangangs = r.wangangs || [];
              seat.hued = false;
              if (r.huinfo) for (var h = 0; h < r.huinfo.length; ++h) r.huinfo[h].ishupai && (seat.hued = true);
            } else seat.score = 0;
          }
          self.bbResultDeadline = data.resultDeadline || 0;
          self.bbResultTimeout = data.resultTimeout || 0;
          self.bbOverDetails = data.details || null;
          self.overData = data;
          self.roundSettleAwait = true;
          self.dispatchEvent("game_over", results);
          if (data.endinfo) {
            self.isOver = true;
            self.dispatchEvent("game_end", {
              endinfo: data.endinfo,
              roundHistory: data.roundHistory || null
            });
          }
          self.reset();
          for (var i = 0; i < self.seats.length; ++i) self.dispatchEvent("user_state_changed", self.seats[i]);
        });
        cc.vv.net.addHandler("chat_push", function(data) {
          self.dispatchEvent("chat_push", data);
        });
        cc.vv.net.addHandler("quick_chat_push", function(data) {
          self.dispatchEvent("quick_chat_push", data);
        });
        cc.vv.net.addHandler("emoji_push", function(data) {
          self.dispatchEvent("emoji_push", data);
        });
        cc.vv.net.addHandler("bb_gems_push", function(data) {
          if (!data || null == data.userid) return;
          var seat = self.getSeatByID(data.userid);
          if (null == seat) return;
          null != data.score && (seat.score = data.score);
          self.dispatchEvent("user_state_changed", seat);
        });
        cc.vv.net.addHandler("dissolve_notice_push", function(data) {
          console.log("dissolve_notice_push");
          self.dissoveData = data;
          self.dispatchEvent("dissolve_notice", data);
        });
        cc.vv.net.addHandler("dissolve_cancel_push", function(data) {
          self.dissoveData = null;
          self.dispatchEvent("dissolve_cancel", data);
        });
        cc.vv.net.addHandler("voice_msg_push", function(data) {
          self.dispatchEvent("voice_msg", data);
        });
      },
      removeFoldOfTurn: function removeFoldOfTurn(pai) {
        if (this.turn < 0 || null == this.seats) return;
        var discarder = this.seats[this.turn];
        if (discarder && discarder.folds) {
          var fi = discarder.folds.lastIndexOf(pai);
          -1 != fi && discarder.folds.splice(fi, 1);
        }
      },
      doTurnChange: function doTurnChange(si) {
        var data = {
          last: this.turn,
          turn: si
        };
        this.turn = si;
        this.dispatchEvent("game_chupai", data);
      },
      connectGameServer: function connectGameServer(data) {
        this.dissoveData = null;
        var _bs = cc.director.getScene ? cc.director.getScene() : null;
        cc.vv.fromClub || cc.vv.fromClubId ? this.roomBackScene = "club" : this.roomBackScene = _bs && _bs.name ? _bs.name : "";
        this.roomBackClubId = cc.vv.fromClubId || this.roomBackClubId || null;
        cc.vv.net.ip = (window.__rewriteHost ? window.__rewriteHost(data.ip) : data.ip) + ":" + data.port;
        console.log(cc.vv.net.ip);
        var self = this;
        var onConnectOK = function onConnectOK() {
          console.log("onConnectOK");
          var sd = {
            token: data.token,
            roomid: data.roomid,
            time: data.time,
            sign: data.sign
          };
          cc.vv.net.send("login", sd);
        };
        var onConnectFailed = function onConnectFailed() {
          console.log("failed.");
          cc.vv.wc.showError("\u8fde\u63a5\u6e38\u620f\u670d\u5931\u8d25(" + cc.vv.net.ip + "),\u8bf7\u786e\u8ba4\u6e38\u620f\u670d\u5df2\u542f\u52a8");
        };
        cc.vv.wc.show("\u6b63\u5728\u8fdb\u5165\u623f\u95f4");
        console.log("[\u8fdb\u5165\u623f\u95f4]\u8fde\u63a5\u6e38\u620f\u670d " + cc.vv.net.ip);
        var self2 = this;
        this._loginTimer = setTimeout(function() {
          self2._loginTimer = null;
          cc.vv.wc.showError("\u8fdb\u5165\u623f\u95f4\u8d85\u65f6(" + cc.vv.net.ip + "),\u8bf7\u91cd\u8bd5");
        }, 8e3);
        try {
          cc.vv.net.connect(onConnectOK, onConnectFailed);
        } catch (e) {
          console.log("[\u8fdb\u5165\u623f\u95f4]\u8fde\u63a5\u521d\u59cb\u5316\u5f02\u5e38:" + (e && e.message));
          if (this._loginTimer) {
            clearTimeout(this._loginTimer);
            this._loginTimer = null;
          }
          cc.vv.wc.showError("\u8fde\u63a5\u521d\u59cb\u5316\u5931\u8d25:" + (e && e.message));
        }
      }
    });
    cc._RF.pop();
  }, {} ],
  Global: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "c0244demoVIG4jTu1XDASHs", "Global");
    "use strict";
    var Global = cc.Class({
      extends: cc.Component,
      statics: {
        isstarted: false,
        netinited: false,
        userguid: 0,
        nickname: "",
        money: 0,
        lv: 0,
        roomId: 0
      }
    });
    cc._RF.pop();
  }, {} ],
  HTTP: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "73df3nV5IZAPoFSW/0IES+m", "HTTP");
    "use strict";
    var _host = "127.0.0.1";
    var _isAndroid = false;
    if ("undefined" !== typeof cc) {
      cc.sys && cc.sys.isNative ? _host = "47.239.100.68" : "undefined" !== typeof location && location.hostname && (_host = location.hostname);
      cc.sys && cc.sys.platform === cc.sys.ANDROID && (_isAndroid = true);
    }
    var URL = "http://" + _host + ":9100";
    function rewriteHost(raw) {
      return raw;
    }
    "undefined" !== typeof window && (window.__rewriteHost = rewriteHost);
    cc.VERSION = 20180108;
    var HTTP = cc.Class({
      extends: cc.Component,
      statics: {
        sessionId: 0,
        userId: 0,
        master_url: URL,
        url: URL,
        sendRequest: function sendRequest(path, data, handler, extraUrl) {
          var xhr = cc.loader.getXMLHttpRequest();
          xhr.timeout = 15e3;
          var str = "?";
          for (var k in data) {
            "?" != str && (str += "&");
            str += k + "=" + data[k];
          }
          null == extraUrl && (extraUrl = HTTP.url);
          var requestURL = extraUrl + path + encodeURI(str);
          console.log("RequestURL:" + requestURL);
          xhr.open("GET", requestURL, true);
          cc.sys.isNative && xhr.setRequestHeader("Accept-Encoding", "gzip,deflate", "text/html;charset=UTF-8");
          xhr.onreadystatechange = function() {
            if (4 === xhr.readyState && xhr.status >= 200 && xhr.status < 300) {
              console.log("http res(" + xhr.responseText.length + "):" + xhr.responseText);
              try {
                var ret = JSON.parse(xhr.responseText);
                null !== handler && handler(ret);
              } catch (e) {
                console.log("err:" + e);
              } finally {
                cc.vv && cc.vv.wc;
              }
            } else if (4 === xhr.readyState) {
              console.log("http failed status:" + xhr.status);
              cc.vv && cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError("\u7f51\u7edc\u8bf7\u6c42\u5931\u8d25(" + xhr.status + "),\u8bf7\u786e\u8ba4\u670d\u52a1\u5df2\u542f\u52a8");
            }
          };
          xhr.onerror = function() {
            console.log("http onerror");
            cc.vv && cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError("\u65e0\u6cd5\u8fde\u63a5\u670d\u52a1\u5668,\u8bf7\u786e\u8ba4\u670d\u52a1\u5df2\u542f\u52a8");
          };
          xhr.ontimeout = function() {
            console.log("http ontimeout");
            cc.vv && cc.vv.wc && cc.vv.wc.showError && cc.vv.wc.showError("\u8bf7\u6c42\u8d85\u65f6,\u8bf7\u91cd\u8bd5");
          };
          cc.vv && cc.vv.wc;
          xhr.send();
          return xhr;
        }
      }
    });
    cc._RF.pop();
  }, {} ],
  MahjongMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "e4fb97mwvFL3qT4H0AbOojz", "MahjongMgr");
    "use strict";
    var mahjongSprites = [];
    cc.Class({
      extends: cc.Component,
      properties: {
        leftAtlas: {
          default: null,
          type: cc.SpriteAtlas
        },
        rightAtlas: {
          default: null,
          type: cc.SpriteAtlas
        },
        bottomAtlas: {
          default: null,
          type: cc.SpriteAtlas
        },
        bottomFoldAtlas: {
          default: null,
          type: cc.SpriteAtlas
        },
        pengPrefabSelf: {
          default: null,
          type: cc.Prefab
        },
        pengPrefabLeft: {
          default: null,
          type: cc.Prefab
        },
        emptyAtlas: {
          default: null,
          type: cc.SpriteAtlas
        },
        holdsEmpty: {
          default: [],
          type: [ cc.SpriteFrame ]
        },
        _sides: null,
        _pres: null,
        _foldPres: null
      },
      onLoad: function onLoad() {
        if (null == cc.vv) return;
        this._sides = [ "myself", "right", "up", "left" ];
        this._pres = [ "M_", "R_", "B_", "L_" ];
        this._foldPres = [ "B_", "R_", "B_", "L_" ];
        cc.vv.mahjongmgr = this;
        for (var i = 1; i < 10; ++i) mahjongSprites.push("dot_" + i);
        for (var i = 1; i < 10; ++i) mahjongSprites.push("bamboo_" + i);
        for (var i = 1; i < 10; ++i) mahjongSprites.push("character_" + i);
        mahjongSprites.push("red");
        mahjongSprites.push("green");
        mahjongSprites.push("white");
        mahjongSprites.push("wind_east");
        mahjongSprites.push("wind_west");
        mahjongSprites.push("wind_south");
        mahjongSprites.push("wind_north");
      },
      getMahjongSpriteByID: function getMahjongSpriteByID(id) {
        return mahjongSprites[id];
      },
      getMahjongType: function getMahjongType(id) {
        if (id >= 0 && id < 9) return 0;
        if (id >= 9 && id < 18) return 1;
        if (id >= 18 && id < 27) return 2;
      },
      getSpriteFrameByMJID: function getSpriteFrameByMJID(pre, mjid) {
        var spriteFrameName = this.getMahjongSpriteByID(mjid);
        spriteFrameName = pre + spriteFrameName;
        if ("M_" == pre) return this.bottomAtlas.getSpriteFrame(spriteFrameName);
        if ("B_" == pre) return this.bottomFoldAtlas.getSpriteFrame(spriteFrameName);
        if ("L_" == pre) return this.leftAtlas.getSpriteFrame(spriteFrameName);
        if ("R_" == pre) return this.rightAtlas.getSpriteFrame(spriteFrameName);
      },
      getAudioURLByMJID: function getAudioURLByMJID(id) {
        var realId = 0;
        id >= 0 && id < 9 ? realId = id + 21 : id >= 9 && id < 18 ? realId = id - 8 : id >= 18 && id < 27 ? realId = id - 7 : id >= 27 && id < 34 && (realId = [ 71, 81, 91, 31, 41, 51, 61 ][id - 27]);
        return "nv/" + realId + ".mp3";
      },
      getHuaSpriteFrame: function getHuaSpriteFrame(idx, cb) {
        var names = [ "mei", "lan", "zhu", "ju", "chun", "xia", "qiu", "dong" ];
        if (idx < 0 || idx >= names.length) {
          cb && cb(null);
          return;
        }
        var cache = this._huaSpriteFrames || (this._huaSpriteFrames = {});
        var key = names[idx];
        if (cache[key]) {
          cb && cb(cache[key]);
          return;
        }
        var waitKey = "wait_" + key;
        if (cache[waitKey]) {
          cb && cache[waitKey].push(cb);
          return;
        }
        cache[waitKey] = cb ? [ cb ] : [];
        cc.resources.load("images/MJ/hua/hua_" + key, cc.SpriteFrame, function(err, sf) {
          var list = cache[waitKey] || [];
          delete cache[waitKey];
          !err && sf && (cache[key] = sf);
          for (var i = 0; i < list.length; ++i) list[i] && list[i](cache[key] || null);
        });
      },
      playRandSFX: function playRandSFX(prefix, count) {
        var idx = 1 + Math.floor(Math.random() * count);
        cc.vv.audioMgr.playSFX("nv/" + prefix + idx + ".mp3");
      },
      playHuSpine: function playHuSpine(parentNode, zimo) {
        this.playSpineEfx(parentNode, zimo ? "mj_zimo" : "mj_hu");
      },
      playSpineEfx: function playSpineEfx(parentNode, key) {
        if (!parentNode || !cc.isValid(parentNode) || "undefined" === typeof sp) return;
        var self = this;
        var cache = this._huSpineCache || (this._huSpineCache = {});
        var old = parentNode.getChildByName("hu_spine");
        old && old.destroy();
        var play = function play(sd) {
          if (!sd || !cc.isValid(parentNode)) return;
          var n = new cc.Node("hu_spine");
          n.layer = parentNode.layer;
          parentNode.addChild(n);
          n.setPosition(0, 0);
          var sk = n.addComponent(sp.Skeleton);
          sk.skeletonData = sd;
          sk.premultipliedAlpha = false;
          sk.setAnimation(0, "animation", false);
          self.scheduleOnce(function() {
            cc.isValid(n) && n.destroy();
          }, 1.6);
        };
        if (cache[key]) {
          play(cache[key]);
          return;
        }
        cc.resources.load("spine/" + key + "/" + key, sp.SkeletonData, function(err, sd) {
          if (err || !sd) {
            console.log("[MahjongMgr] \u80e1\u724c\u52a8\u753b\u52a0\u8f7d\u5931\u8d25:", key, err);
            return;
          }
          cache[key] = sd;
          play(sd);
        });
      },
      getEmptySpriteFrame: function getEmptySpriteFrame(side) {
        if ("up" == side) return this.emptyAtlas.getSpriteFrame("e_mj_b_up");
        if ("myself" == side) return this.emptyAtlas.getSpriteFrame("e_mj_b_bottom");
        if ("left" == side) return this.emptyAtlas.getSpriteFrame("e_mj_b_left");
        if ("right" == side) return this.emptyAtlas.getSpriteFrame("e_mj_b_right");
      },
      getHoldsEmptySpriteFrame: function getHoldsEmptySpriteFrame(side) {
        if ("up" == side) return this.emptyAtlas.getSpriteFrame("e_mj_up");
        if ("myself" == side) return null;
        if ("left" == side) return this.emptyAtlas.getSpriteFrame("e_mj_left");
        if ("right" == side) return this.emptyAtlas.getSpriteFrame("e_mj_right");
      },
      sortMJ: function sortMJ(mahjongs, dingque) {
        var self = this;
        mahjongs.sort(function(a, b) {
          if (dingque >= 0) {
            var t1 = self.getMahjongType(a);
            var t2 = self.getMahjongType(b);
            if (t1 != t2) {
              if (dingque == t1) return 1;
              if (dingque == t2) return -1;
            }
          }
          return a - b;
        });
      },
      is2Player: function is2Player() {
        return !!(cc.vv && cc.vv.gameNetMgr && cc.vv.gameNetMgr.seats && 2 == cc.vv.gameNetMgr.seats.length);
      },
      getSide: function getSide(localIndex) {
        if (this.is2Player()) return 0 == localIndex ? "myself" : "up";
        return this._sides[localIndex];
      },
      getPre: function getPre(localIndex) {
        if (this.is2Player()) return 0 == localIndex ? "M_" : "B_";
        return this._pres[localIndex];
      },
      getFoldPre: function getFoldPre(localIndex) {
        if (this.is2Player()) return "B_";
        return this._foldPres[localIndex];
      },
      getSlotIndex: function getSlotIndex(localIndex) {
        if (this.is2Player()) return 0 == localIndex ? 0 : 2;
        return localIndex;
      },
      getLocalIndexBySlot: function getLocalIndexBySlot(slot) {
        if (this.is2Player()) return 2 == slot ? 1 : -1;
        return slot;
      }
    });
    cc._RF.pop();
  }, {} ],
  Net: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "21784k1nCpOz70Z2In10GT7", "Net");
    "use strict";
    var __jsbio = require("socket-io");
    null != __jsbio && __jsbio.connect && (window.io = __jsbio);
    var Global = cc.Class({
      extends: cc.Component,
      statics: {
        ip: "",
        sio: null,
        isPinging: false,
        fnDisconnect: null,
        handlers: {},
        addHandler: function addHandler(event, fn) {
          if (this.handlers[event]) {
            console.log("event:" + event + "' handler has been registered.");
            return;
          }
          var handler = function handler(data) {
            "disconnect" != event && "string" == typeof data && (data = JSON.parse(data));
            fn(data);
          };
          this.handlers[event] = handler;
          if (this.sio) {
            console.log("register:function " + event);
            this.sio.on(event, handler);
          }
        },
        connect: function connect(fnConnect, fnError) {
          var self = this;
          var opts = {
            reconnection: true,
            "force new connection": true,
            transports: [ "websocket", "polling" ]
          };
          var url = this.ip;
          url.indexOf("://") < 0 && (url = "http://" + url);
          this.sio = window.io.connect(url, opts);
          this.sio.on("reconnect", function() {
            console.log("reconnection");
          });
          this.sio.io && this.sio.io.onAny && this.sio.io.onAny(function(event, data) {
            (0 === event.indexOf("game_") || event.indexOf("hu") >= 0 || event.indexOf("caishen") >= 0) && console.log("[socket.io onAny]", event, "string" === typeof data ? data.substring(0, 100) : data);
          });
          this.sio.on("connect", function(data) {
            self.sio.connected = true;
            fnConnect(data);
          });
          this.sio.on("disconnect", function(data) {
            console.log("disconnect");
            self.sio.connected = false;
            self.close();
          });
          this.sio.on("connect_failed", function() {
            console.log("connect_failed");
            fnError && fnError();
          });
          this.sio.on("connect_error", function() {
            console.log("connect_error");
            fnError && fnError();
          });
          console.log("[Net.connect] handlers keys:", Object.keys(this.handlers));
          for (var key in this.handlers) {
            var value = this.handlers[key];
            if ("function" == typeof value) if ("disconnect" == key) this.fnDisconnect = value; else {
              console.log("[Net.connect] register sio.on:", key);
              this.sio.on(key, value);
            }
          }
          this.startHearbeat();
        },
        startHearbeat: function startHearbeat() {
          this.sio.on("game_pong", function() {
            console.log("game_pong");
            self.lastRecieveTime = Date.now();
          });
          this.lastRecieveTime = Date.now();
          var self = this;
          console.log(1);
          if (!self.isPinging) {
            console.log(1);
            self.isPinging = true;
            setInterval(function() {
              console.log(3);
              if (self.sio) {
                console.log(4);
                Date.now() - self.lastRecieveTime > 1e4 ? self.close() : self.ping();
              }
            }, 5e3);
          }
        },
        send: function send(event, data) {
          if (this.sio && this.sio.connected) {
            null != data && "object" == typeof data && (data = JSON.stringify(data));
            this.sio.emit(event, data);
          }
        },
        ping: function ping() {
          this.send("game_ping");
        },
        close: function close() {
          console.log("close");
          if (this.sio && this.sio.connected) {
            this.sio.connected = false;
            this.sio.disconnect();
            this.sio = null;
          }
          if (this.fnDisconnect) {
            this.fnDisconnect();
            this.fnDisconnect = null;
          }
        },
        test: function test(fnResult) {
          var xhr = null;
          var fn = function fn(ret) {
            fnResult(ret.isonline);
            xhr = null;
          };
          var arr = this.ip.split(":");
          var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            ip: arr[0],
            port: arr[1]
          };
          xhr = cc.vv.http.sendRequest("/is_server_online", data, fn);
          setTimeout(function() {
            if (xhr) {
              xhr.abort();
              fnResult(false);
            }
          }, 1500);
        }
      }
    });
    cc._RF.pop();
  }, {
    "socket-io": "socket-io"
  } ],
  OnBack: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "74331fmhv1GrY7cIXQ35kuc", "OnBack");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {},
      onLoad: function onLoad() {
        var btn = this.node.getChildByName("btn_back");
        cc.vv.utils.addClickEvent(btn, this.node, "OnBack", "onBtnClicked");
      },
      onBtnClicked: function onBtnClicked(event) {
        "btn_back" == event.target.name && (this.node.active = false);
      }
    });
    cc._RF.pop();
  }, {} ],
  ReplayMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "445e3qeTe1HrZvjs7b24OFj", "ReplayMgr");
    "use strict";
    var ACTION_CHUPAI = 1;
    var ACTION_MOPAI = 2;
    var ACTION_PENG = 3;
    var ACTION_GANG = 4;
    var ACTION_HU = 5;
    cc.Class({
      extends: cc.Component,
      properties: {
        _lastAction: null,
        _actionRecords: null,
        _currentIndex: 0
      },
      onLoad: function onLoad() {},
      clear: function clear() {
        this._lastAction = null;
        this._actionRecords = null;
        this._currentIndex = 0;
      },
      init: function init(data) {
        this._actionRecords = data.action_records;
        null == this._actionRecords && (this._actionRecords = {});
        this._currentIndex = 0;
        this._lastAction = null;
      },
      isReplay: function isReplay() {
        return null != this._actionRecords;
      },
      getNextAction: function getNextAction() {
        if (this._currentIndex >= this._actionRecords.length) return null;
        var si = this._actionRecords[this._currentIndex++];
        var action = this._actionRecords[this._currentIndex++];
        var pai = this._actionRecords[this._currentIndex++];
        return {
          si: si,
          type: action,
          pai: pai
        };
      },
      takeAction: function takeAction() {
        var action = this.getNextAction();
        null != this._lastAction && this._lastAction.type == ACTION_CHUPAI && null != action && action.type != ACTION_PENG && action.type != ACTION_GANG && action.type != ACTION_HU && cc.vv.gameNetMgr.doGuo(this._lastAction.si, this._lastAction.pai);
        this._lastAction = action;
        if (null == action) return -1;
        var nextActionDelay = 1;
        if (action.type == ACTION_CHUPAI) {
          cc.vv.gameNetMgr.doChupai(action.si, action.pai);
          return 1;
        }
        if (action.type == ACTION_MOPAI) {
          cc.vv.gameNetMgr.doMopai(action.si, action.pai);
          cc.vv.gameNetMgr.doTurnChange(action.si);
          return .5;
        }
        if (action.type == ACTION_PENG) {
          cc.vv.gameNetMgr.doPeng(action.si, action.pai);
          cc.vv.gameNetMgr.doTurnChange(action.si);
          return 1;
        }
        if (action.type == ACTION_GANG) {
          cc.vv.gameNetMgr.dispatchEvent("hangang_notify", action.si);
          cc.vv.gameNetMgr.doGang(action.si, action.pai);
          cc.vv.gameNetMgr.doTurnChange(action.si);
          return 1;
        }
        if (action.type == ACTION_HU) {
          cc.vv.gameNetMgr.doHu({
            seatindex: action.si,
            hupai: action.pai,
            iszimo: false
          });
          return 1.5;
        }
      }
    });
    cc._RF.pop();
  }, {} ],
  SceneMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "8eb78uXeJtM/rUfyST3ggEK", "SceneMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      ctor: function ctor() {
        this.SCENE_LIST = [ "login", "loading", "hall", "club", "mjgame_bb_mian", "mjgame_bb_shou", "mjgame", "mjgame_ldh", "mjgame_bmj", "mjgame_zjlao", "mjgame_zjzx", "mjgame_zjzx4", "mjgame_zp", "mjgame_zp4", "mjgame_wujin", "mjgame_wujin4", "mjgame_gp2", "mjgame_gp3" ];
        this._preloaded = {};
        this._isTransitioning = false;
        this._transitionStart = 0;
      },
      init: function init() {
        var self = this;
        var remaining = this.SCENE_LIST.slice();
        var inFlight = 0;
        var MAX_FLIGHT = 3;
        var doNext = function doNext() {
          if (0 === remaining.length) return;
          if (inFlight >= MAX_FLIGHT) return;
          var name = remaining.shift();
          inFlight++;
          try {
            cc.director.preloadScene(name, null, function(err) {
              inFlight--;
              err ? console.warn("[SceneMgr] preloadScene(" + name + ") err:", err) : self._preloaded[name] = true;
              doNext();
            });
          } catch (e) {
            inFlight--;
            console.warn("[SceneMgr] preloadScene(" + name + ") exc:", e.message);
            doNext();
          }
          doNext();
        };
        doNext();
      },
      load: function load(sceneName, onLaunched, opts) {
        opts = opts || {};
        if (this._isTransitioning) {
          if (this._transitionStart && !(Date.now() - this._transitionStart > 3e3)) {
            console.warn("[SceneMgr] \u5df2\u6709\u5207\u6362\u5728\u8fdb\u884c,\u5ffd\u7565\u91cd\u590d\u5207\u573a\u666f:", sceneName);
            return false;
          }
          console.warn("[SceneMgr] \u4e0a\u6b21\u5207\u6362\u8d85\u8fc73\u79d2\u672a\u5b8c\u6210,\u5f3a\u5236\u590d\u4f4d\u540e\u7ee7\u7eed\u5207:", sceneName);
          this._isTransitioning = false;
          this._transitionStart = 0;
        }
        if (!sceneName) {
          console.warn("[SceneMgr] load: sceneName empty");
          return false;
        }
        var cur = cc.director.getScene();
        var curName = cur ? cur.name : "";
        if (curName === sceneName && !opts.force) {
          console.log("[SceneMgr] \u5df2\u7ecf\u5728 " + sceneName + ", \u8df3\u8fc7");
          onLaunched && onLaunched();
          return true;
        }
        this._isTransitioning = true;
        this._transitionStart = Date.now();
        var self = this;
        var cb = function cb() {
          if (onLaunched) try {
            onLaunched();
          } catch (e) {
            console.warn("[SceneMgr] onLaunched err:", e.message);
          }
          self._isTransitioning = false;
          self._transitionStart = 0;
        };
        var ok = false;
        try {
          ok = cc.director.loadScene(sceneName, cb);
        } catch (e) {
          console.warn("[SceneMgr] loadScene(" + sceneName + ") exc:", e.message);
          self._isTransitioning = false;
          self._transitionStart = 0;
        }
        if (false === ok) {
          console.warn("[SceneMgr] loadScene(" + sceneName + ") returned false (scene not imported?)");
          self._isTransitioning = false;
          self._transitionStart = 0;
        }
        return true;
      }
    });
    cc._RF.pop();
  }, {} ],
  SelectPlayway: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "7c36fbnLl9G+ITRQJdKnKcW", "SelectPlayway");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        first: {
          default: null,
          type: cc.Node
        },
        playway: {
          default: null,
          type: cc.Prefab
        },
        content: {
          default: null,
          type: cc.Node
        }
      },
      onLoad: function onLoad() {}
    });
    cc._RF.pop();
  }, {} ],
  UserMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "49846wj4bdFWoRYOeYfGhJ2", "UserMgr");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        account: null,
        userId: null,
        userName: null,
        lv: 0,
        exp: 0,
        coins: 0,
        gems: 0,
        safe_beans: 0,
        sign: 0,
        ip: "",
        sex: 0,
        roomData: null,
        oldRoomId: null
      },
      guestAuth: function guestAuth() {
        var account = cc.args["account"];
        null == account && (account = cc.sys.localStorage.getItem("account"));
        if (null == account) {
          account = Date.now();
          cc.sys.localStorage.setItem("account", account);
        }
        this._authType = "guest";
        cc.vv.http.sendRequest("/guest", {
          account: account
        }, this.onAuth, cc.vv.http.master_url);
      },
      pwdAuth: function pwdAuth(account, password) {
        if (!account || !password) {
          cc.vv.wc && cc.vv.wc.showError("\u8bf7\u8f93\u5165\u8d26\u53f7\u548c\u5bc6\u7801");
          return;
        }
        this._authType = "pwd";
        cc.vv.http.sendRequest("/auth", {
          account: account,
          password: password
        }, this.onAuth, cc.vv.http.master_url);
      },
      hasSavedSession: function hasSavedSession() {
        var acc = cc.sys.localStorage.getItem("login_account");
        var sign = cc.sys.localStorage.getItem("login_sign");
        return !!(acc && sign);
      },
      autoLogin: function autoLogin(onFail) {
        if (!this.hasSavedSession()) return false;
        this.account = cc.sys.localStorage.getItem("login_account");
        this.sign = cc.sys.localStorage.getItem("login_sign");
        cc.vv.SI && cc.vv.SI.hall && (cc.vv.http.url = "http://" + (window.__rewriteHost ? window.__rewriteHost(cc.vv.SI.hall) : cc.vv.SI.hall));
        this._autoLoginFail = onFail || null;
        this.login();
        return true;
      },
      onAuth: function onAuth(ret) {
        var self = cc.vv.userMgr;
        if (0 !== ret.errcode) {
          console.log(ret.errmsg);
          cc.vv.wc && cc.vv.wc.showError(ret.errmsg || "\u767b\u5f55\u5931\u8d25");
        } else {
          self.account = ret.account;
          self.sign = ret.sign;
          cc.sys.localStorage.setItem("login_account", self.account);
          cc.sys.localStorage.setItem("login_sign", null == self.sign ? "" : String(self.sign));
          cc.sys.localStorage.setItem("login_type", self._authType || "guest");
          cc.vv.http.url = "http://" + (window.__rewriteHost ? window.__rewriteHost(cc.vv.SI.hall) : cc.vv.SI.hall);
          self.login();
        }
      },
      _ensureWc: function _ensureWc() {
        if (!cc.vv.wc || !cc.isValid(cc.vv.wc.node)) {
          var wcn = cc.find("Canvas/WaitingConnection");
          wcn && (wcn.active = true);
        }
        return cc.vv.wc;
      },
      login: function login() {
        var self = this;
        var onLogin = function onLogin(ret) {
          if (0 !== ret.errcode) {
            console.log(ret.errmsg);
            cc.sys.localStorage.removeItem("login_account");
            cc.sys.localStorage.removeItem("login_sign");
            cc.vv.wc && cc.vv.wc.hide();
            var f = self._autoLoginFail;
            self._autoLoginFail = null;
            f && f(ret);
          } else if (ret.userid) {
            console.log(ret);
            self.account = ret.account;
            self.userId = ret.userid;
            self.userName = ret.name;
            self.lv = ret.lv;
            self.exp = ret.exp;
            self.coins = ret.coins;
            self.gems = ret.gems;
            self.roomData = ret.roomid;
            self.sex = ret.sex;
            self.ip = ret.ip;
            self._autoLoginFail = null;
            cc.vv && cc.vv.sceneMgr ? cc.vv.sceneMgr.load("hall") : cc.director.loadScene("hall");
          } else self.create(self._genDefaultName());
        };
        this._ensureWc();
        cc.vv.wc.show("\u6b63\u5728\u767b\u5f55\u6e38\u620f");
        cc.vv.http.sendRequest("/login", {
          account: this.account,
          sign: this.sign
        }, onLogin);
      },
      _genDefaultName: function _genDefaultName() {
        var xing = [ "\u6b27\u9633", "\u4e0a\u5b98", "\u8bf8\u845b", "\u5b87\u6587", "\u53f8\u9a6c", "\u5357\u5bab", "\u6155\u5bb9", "\u7687\u752b", "\u7aef\u6728", "\u72ec\u5b64", "\u8f69\u8f95", "\u4e1c\u65b9", "\u590f\u4faf", "\u957f\u5b59", "\u4ee4\u72d0", "\u53f8\u5f92" ];
        var ming = [ "\u5b50\u58a8", "\u6e05\u548c", "\u77e5\u8fdc", "\u5609\u8a00", "\u666f\u884c", "\u82e5\u6eaa", "\u4e66\u8a00", "\u601d\u8fdc", "\u4ea6\u8fb0", "\u661f\u91ce", "\u660e\u8f69", "\u4fee\u6587", "\u8bed\u5ae3", "\u5b89\u7136", "\u661f\u6cb3", "\u6c90\u9633", "\u82e5\u5c18", "\u6587\u660a", "\u5ff5\u5b89", "\u96e8\u8fb0" ];
        return xing[Math.floor(Math.random() * xing.length)] + ming[Math.floor(Math.random() * ming.length)];
      },
      _genDefaultAvatar: function _genDefaultAvatar() {
        var n = Math.floor(18 * Math.random()) + 1;
        return "avatar_" + (n < 10 ? "0" + n : n);
      },
      create: function create(name) {
        var self = this;
        var onCreate = function onCreate(ret) {
          0 !== ret.errcode ? console.log(ret.errmsg) : self.login();
        };
        var data = {
          account: this.account,
          sign: this.sign,
          name: name,
          headimg: this._genDefaultAvatar()
        };
        cc.vv.http.sendRequest("/create_user", data, onCreate);
      },
      enterRoom: function enterRoom(roomId, callback) {
        var self = this;
        var onEnter = function onEnter(ret) {
          if (0 !== ret.errcode) if (-1 == ret.errcode) setTimeout(function() {
            self.enterRoom(roomId, callback);
          }, 5e3); else {
            cc.vv.wc.hide();
            null != callback && callback(ret);
          } else {
            null != callback && callback(ret);
            cc.vv.gameNetMgr.connectGameServer(ret);
          }
        };
        var data = {
          account: cc.vv.userMgr.account,
          sign: cc.vv.userMgr.sign,
          roomid: roomId
        };
        this._ensureWc();
        cc.vv.wc.show("\u6b63\u5728\u8fdb\u5165\u623f\u95f4 " + roomId);
        cc.vv.http.sendRequest("/enter_private_room", data, onEnter);
      },
      getHistoryList: function getHistoryList(callback) {
        var self = this;
        var onGet = function onGet(ret) {
          if (0 !== ret.errcode) console.log(ret.errmsg); else {
            console.log(ret.history);
            null != callback && callback(ret.history);
          }
        };
        var data = {
          account: cc.vv.userMgr.account,
          sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/get_history_list", data, onGet);
      },
      getGamesOfRoom: function getGamesOfRoom(uuid, callback) {
        var self = this;
        var onGet = function onGet(ret) {
          if (0 !== ret.errcode) console.log(ret.errmsg); else {
            console.log(ret.data);
            callback(ret.data);
          }
        };
        var data = {
          account: cc.vv.userMgr.account,
          sign: cc.vv.userMgr.sign,
          uuid: uuid
        };
        cc.vv.http.sendRequest("/get_games_of_room", data, onGet);
      },
      getDetailOfGame: function getDetailOfGame(uuid, index, callback) {
        var self = this;
        var onGet = function onGet(ret) {
          if (0 !== ret.errcode) console.log(ret.errmsg); else {
            console.log(ret.data);
            callback(ret.data);
          }
        };
        var data = {
          account: cc.vv.userMgr.account,
          sign: cc.vv.userMgr.sign,
          uuid: uuid,
          index: index
        };
        cc.vv.http.sendRequest("/get_detail_of_game", data, onGet);
      }
    });
    cc._RF.pop();
  }, {} ],
  Utils: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "bf040eJWYNO6aWuiHWq60SX", "Utils");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {},
      addClickEvent: function addClickEvent(node, target, component, handler) {
        console.log(component + ":" + handler);
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
      },
      addSlideEvent: function addSlideEvent(node, target, component, handler) {
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;
        var slideEvents = node.getComponent(cc.Slider).slideEvents;
        slideEvents.push(eventHandler);
      }
    });
    cc._RF.pop();
  }, {} ],
  VoiceMgr: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "04f79lfizNB5a8M0o33HmPW", "VoiceMgr");
    "use strict";
    var radix = 12;
    var base = 128 - radix;
    function crypto(value) {
      value -= base;
      var h = Math.floor(value / radix) + base;
      var l = value % radix + base;
      return String.fromCharCode(h) + String.fromCharCode(l);
    }
    var encodermap = {};
    var decodermap = {};
    for (var i = 0; i < 256; ++i) {
      var code = null;
      var v = i + 1;
      code = v >= base ? crypto(v) : String.fromCharCode(v);
      encodermap[i] = code;
      decodermap[code] = i;
    }
    function encode(data) {
      var content = "";
      var len = data.length;
      var a = len >> 24 & 255;
      var b = len >> 16 & 255;
      var c = len >> 8 & 255;
      var d = 255 & len;
      content += encodermap[a];
      content += encodermap[b];
      content += encodermap[c];
      content += encodermap[d];
      for (var i = 0; i < data.length; ++i) content += encodermap[data[i]];
      return content;
    }
    function getCode(content, index) {
      var c = content.charCodeAt(index);
      c = c >= base ? content.charAt(index) + content.charAt(index + 1) : content.charAt(index);
      return c;
    }
    function decode(content) {
      var index = 0;
      var len = 0;
      for (var i = 0; i < 4; ++i) {
        var c = getCode(content, index);
        index += c.length;
        var v = decodermap[c];
        len |= v << 8 * (3 - i);
      }
      var newData = new Uint8Array(len);
      var cnt = 0;
      while (index < content.length) {
        var c = getCode(content, index);
        index += c.length;
        newData[cnt] = decodermap[c];
        cnt++;
      }
      return newData;
    }
    cc.Class({
      extends: cc.Component,
      properties: {
        onPlayCallback: null,
        _voiceMediaPath: null
      },
      init: function init() {
        if (cc.sys.isNative) {
          this._voiceMediaPath = jsb.fileUtils.getWritablePath() + "/voicemsgs/";
          this.setStorageDir(this._voiceMediaPath);
        }
      },
      prepare: function prepare(filename) {
        if (!cc.sys.isNative) return;
        cc.vv.audioMgr.pauseAll();
        this.clearCache(filename);
        cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "prepare", "(Ljava/lang/String;)V", filename) : cc.sys.os == cc.sys.OS_IOS && jsb.reflection.callStaticMethod("VoiceSDK", "prepareRecord:", filename);
      },
      release: function release() {
        if (!cc.sys.isNative) return;
        cc.vv.audioMgr.resumeAll();
        cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "release", "()V") : cc.sys.os == cc.sys.OS_IOS && jsb.reflection.callStaticMethod("VoiceSDK", "finishRecord");
      },
      cancel: function cancel() {
        if (!cc.sys.isNative) return;
        cc.vv.audioMgr.resumeAll();
        cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "cancel", "()V") : cc.sys.os == cc.sys.OS_IOS && jsb.reflection.callStaticMethod("VoiceSDK", "cancelRecord");
      },
      writeVoice: function writeVoice(filename, voiceData) {
        if (!cc.sys.isNative) return;
        if (voiceData && voiceData.length > 0) {
          var fileData = decode(voiceData);
          var url = this._voiceMediaPath + filename;
          this.clearCache(filename);
          jsb.fileUtils.writeDataToFile(fileData, url);
        }
      },
      clearCache: function clearCache(filename) {
        if (cc.sys.isNative) {
          var url = this._voiceMediaPath + filename;
          jsb.fileUtils.isFileExist(url) && jsb.fileUtils.removeFile(url);
          jsb.fileUtils.isFileExist(url + ".wav") && jsb.fileUtils.removeFile(url + ".wav");
        }
      },
      play: function play(filename) {
        if (!cc.sys.isNative) return;
        cc.vv.audioMgr.pauseAll();
        cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoicePlayer", "play", "(Ljava/lang/String;)V", filename) : cc.sys.os == cc.sys.OS_IOS && jsb.reflection.callStaticMethod("VoiceSDK", "play:", filename);
      },
      stop: function stop() {
        if (!cc.sys.isNative) return;
        cc.vv.audioMgr.resumeAll();
        cc.sys.os == cc.sys.OS_ANDROID ? jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoicePlayer", "stop", "()V") : cc.sys.os == cc.sys.OS_IOS && jsb.reflection.callStaticMethod("VoiceSDK", "stopPlay");
      },
      getVoiceLevel: function getVoiceLevel(maxLevel) {
        return Math.floor(Math.random() * maxLevel + 1);
      },
      getVoiceData: function getVoiceData(filename) {
        if (cc.sys.isNative) {
          var url = this._voiceMediaPath + filename;
          console.log("getVoiceData:" + url);
          var fileData = jsb.fileUtils.getDataFromFile(url);
          if (fileData) {
            var content = encode(fileData);
            return content;
          }
        }
        return "";
      },
      download: function download() {},
      setStorageDir: function setStorageDir(dir) {
        if (!cc.sys.isNative) return;
        if (cc.sys.os == cc.sys.OS_ANDROID) jsb.reflection.callStaticMethod("com/vivigames/voicesdk/VoiceRecorder", "setStorageDir", "(Ljava/lang/String;)V", dir); else if (cc.sys.os == cc.sys.OS_IOS) {
          jsb.reflection.callStaticMethod("VoiceSDK", "setStorageDir:", dir);
          jsb.fileUtils.isDirectoryExist(dir) || jsb.fileUtils.createDirectory(dir);
        }
      }
    });
    cc._RF.pop();
  }, {} ],
  WaitingConnection: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "31f47RcytJJ67ul1CLdirxD", "WaitingConnection");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        target: cc.Node,
        _isShow: false,
        lblContent: cc.Label
      },
      onLoad: function onLoad() {
        if (null == cc.vv) return null;
        cc.vv.wc = this;
        if (this.lblContent) {
          this._frame = this.node.getChildByName("public_frame_a") || this.lblContent.node.parent;
          if (this._frame) {
            this._origFrameW = this._frame.width;
            this._origFrameH = this._frame.height;
          }
          this._origLblX = this.lblContent.node.x;
          this._origLblY = this.lblContent.node.y;
          this._origLblW = this.lblContent.node.width;
          this._origOverflow = this.lblContent.overflow;
          this._origWrap = this.lblContent.enableWrapText;
          this._origHAlign = this.lblContent.horizontalAlign;
          this._origVAlign = this.lblContent.verticalAlign;
        }
        this.node.active = this._isShow;
      },
      update: function update(dt) {
        this.target.angle = this.target.angle + 90 * dt;
      },
      show: function show(content) {
        this._isShow = true;
        if (this.node) {
          this.node.active = this._isShow;
          var parent = this.node.parent;
          if (parent) {
            var vs = cc.view.getVisibleSize();
            var vo = cc.view.getVisibleOrigin();
            this.node.setPosition(parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width / 2, vo.y + vs.height / 2)));
          }
        }
        this.target && (this.target.active = true);
        this._restoreLayout();
        if (this.lblContent) {
          null == content && (content = "");
          this.lblContent.string = content;
        }
      },
      hide: function hide() {
        this._isShow = false;
        this.node && (this.node.active = this._isShow);
      },
      showAlert: function showAlert(msg, title) {
        if (null == cc.vv.alert) {
          var canvas = cc.find("Canvas");
          if (canvas) try {
            canvas.addComponent(require("Alert"));
          } catch (e) {
            console.log("[wc.showAlert]Alert\u8865\u6302\u5931\u8d25:", e && e.message);
          }
        }
        var alertNode = cc.find("Canvas/alert");
        if (alertNode) {
          this.hide();
          var tNode = cc.find("Canvas/alert/title");
          var cNode = cc.find("Canvas/alert/content");
          if (tNode) {
            var tLb = tNode.getComponent(cc.Label);
            tLb && (tLb.string = null == title ? "\u63d0\u793a" : String(title));
          }
          if (cNode) {
            var cLb = cNode.getComponent(cc.Label);
            cLb && (cLb.string = null == msg ? "" : String(msg));
          }
          alertNode.active = true;
          return;
        }
        this.showError(msg);
      },
      showError: function showError(msg) {
        var self = this;
        this.show(null == msg ? "\u64cd\u4f5c\u5931\u8d25,\u8bf7\u91cd\u8bd5" : String(msg));
        this.target && (this.target.active = false);
        if (this.lblContent && this._frame) {
          var lb = this.lblContent;
          var lbNode = lb.node;
          var fw = this._origFrameW > 0 ? this._origFrameW : 300;
          var fh = this._origFrameH > 0 ? this._origFrameH : 300;
          this._frame.setContentSize(fw, fh);
          lb.enableWrapText = true;
          lb.overflow = cc.Label.Overflow.CLAMP;
          lbNode.setContentSize(Math.max(60, fw - 48), Math.max(40, fh - 48));
          lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
          lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
          lbNode.setPosition(0, 0);
        }
        this._errTimer && clearTimeout(this._errTimer);
        this._errTimer = setTimeout(function() {
          self._errTimer = null;
          self.hide();
        }, 3e3);
      },
      _restoreLayout: function _restoreLayout() {
        if (!this.lblContent || !this._frame) return;
        this._frame.setContentSize(this._origFrameW, this._origFrameH);
        this.lblContent.overflow = this._origOverflow;
        this.lblContent.enableWrapText = this._origWrap;
        this.lblContent.horizontalAlign = this._origHAlign;
        this.lblContent.verticalAlign = this._origVAlign;
        this.lblContent.node.width = this._origLblW;
        this.lblContent.node.setPosition(this._origLblX, this._origLblY);
      }
    });
    cc._RF.pop();
  }, {
    Alert: void 0
  } ],
  playway: [ function(require, module, exports) {
    "use strict";
    cc._RF.push(module, "af6f4wEbYlIp6soloWanW8g", "playway");
    "use strict";
    cc.Class({
      extends: cc.Component,
      properties: {
        atlas: {
          default: null,
          type: cc.SpriteAtlas
        }
      },
      onLoad: function onLoad() {}
    });
    cc._RF.pop();
  }, {} ],
  "socket-io": [ function(require, module, exports) {
    (function(global) {
      "use strict";
      cc._RF.push(module, "393290vPc1IIYfh8FrmxcNZ", "socket-io");
      "use strict";
      (function(f) {
        if ("object" === typeof exports && "undefined" !== typeof module) module.exports = f(); else if ("function" === typeof define && define.amd) define([], f); else {
          var g;
          g = "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : "undefined" !== typeof self ? self : this;
          g.io = f();
        }
      })(function() {
        var define, module, exports;
        return function e(t, n, r) {
          function s(o, u) {
            if (!n[o]) {
              if (!t[o]) {
                var a = "function" == typeof require && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f;
              }
              var l = n[o] = {
                exports: {}
              };
              t[o][0].call(l.exports, function(e) {
                var n = t[o][1][e];
                return s(n || e);
              }, l, l.exports, e, t, n, r);
            }
            return n[o].exports;
          }
          var i = "function" == typeof require && require;
          for (var o = 0; o < r.length; o++) s(r[o]);
          return s;
        }({
          1: [ function(_dereq_, module, exports) {
            module.exports = _dereq_("./lib/");
          }, {
            "./lib/": 2
          } ],
          2: [ function(_dereq_, module, exports) {
            module.exports = _dereq_("./socket");
            module.exports.parser = _dereq_("engine.io-parser");
          }, {
            "./socket": 3,
            "engine.io-parser": 19
          } ],
          3: [ function(_dereq_, module, exports) {
            (function(global) {
              var transports = _dereq_("./transports");
              var Emitter = _dereq_("component-emitter");
              var debug = _dereq_("debug")("engine.io-client:socket");
              var index = _dereq_("indexof");
              var parser = _dereq_("engine.io-parser");
              var parseuri = _dereq_("parseuri");
              var parsejson = _dereq_("parsejson");
              var parseqs = _dereq_("parseqs");
              module.exports = Socket;
              function noop() {}
              function Socket(uri, opts) {
                if (!(this instanceof Socket)) return new Socket(uri, opts);
                opts = opts || {};
                if (uri && "object" == typeof uri) {
                  opts = uri;
                  uri = null;
                }
                if (uri) {
                  uri = parseuri(uri);
                  opts.hostname = uri.host;
                  opts.secure = "https" == uri.protocol || "wss" == uri.protocol;
                  opts.port = uri.port;
                  uri.query && (opts.query = uri.query);
                } else opts.host && (opts.hostname = parseuri(opts.host).host);
                this.secure = null != opts.secure ? opts.secure : global.location && "https:" == location.protocol;
                opts.hostname && !opts.port && (opts.port = this.secure ? "443" : "80");
                this.agent = opts.agent || false;
                this.hostname = opts.hostname || (global.location ? location.hostname : "localhost");
                this.port = opts.port || (global.location && location.port ? location.port : this.secure ? 443 : 80);
                this.query = opts.query || {};
                "string" == typeof this.query && (this.query = parseqs.decode(this.query));
                this.upgrade = false !== opts.upgrade;
                this.path = (opts.path || "/engine.io").replace(/\/$/, "") + "/";
                this.forceJSONP = !!opts.forceJSONP;
                this.jsonp = false !== opts.jsonp;
                this.forceBase64 = !!opts.forceBase64;
                this.enablesXDR = !!opts.enablesXDR;
                this.timestampParam = opts.timestampParam || "t";
                this.timestampRequests = opts.timestampRequests;
                this.transports = opts.transports || [ "polling", "websocket" ];
                this.readyState = "";
                this.writeBuffer = [];
                this.policyPort = opts.policyPort || 843;
                this.rememberUpgrade = opts.rememberUpgrade || false;
                this.binaryType = null;
                this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
                this.perMessageDeflate = false !== opts.perMessageDeflate && (opts.perMessageDeflate || {});
                true === this.perMessageDeflate && (this.perMessageDeflate = {});
                this.perMessageDeflate && null == this.perMessageDeflate.threshold && (this.perMessageDeflate.threshold = 1024);
                this.pfx = opts.pfx || null;
                this.key = opts.key || null;
                this.passphrase = opts.passphrase || null;
                this.cert = opts.cert || null;
                this.ca = opts.ca || null;
                this.ciphers = opts.ciphers || null;
                this.rejectUnauthorized = void 0 === opts.rejectUnauthorized || opts.rejectUnauthorized;
                var freeGlobal = "object" == typeof global && global;
                freeGlobal.global === freeGlobal && opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0 && (this.extraHeaders = opts.extraHeaders);
                this.open();
              }
              Socket.priorWebsocketSuccess = false;
              Emitter(Socket.prototype);
              Socket.protocol = parser.protocol;
              Socket.Socket = Socket;
              Socket.Transport = _dereq_("./transport");
              Socket.transports = _dereq_("./transports");
              Socket.parser = _dereq_("engine.io-parser");
              Socket.prototype.createTransport = function(name) {
                debug('creating transport "%s"', name);
                var query = clone(this.query);
                query.EIO = parser.protocol;
                query.transport = name;
                this.id && (query.sid = this.id);
                var transport = new transports[name]({
                  agent: this.agent,
                  hostname: this.hostname,
                  port: this.port,
                  secure: this.secure,
                  path: this.path,
                  query: query,
                  forceJSONP: this.forceJSONP,
                  jsonp: this.jsonp,
                  forceBase64: this.forceBase64,
                  enablesXDR: this.enablesXDR,
                  timestampRequests: this.timestampRequests,
                  timestampParam: this.timestampParam,
                  policyPort: this.policyPort,
                  socket: this,
                  pfx: this.pfx,
                  key: this.key,
                  passphrase: this.passphrase,
                  cert: this.cert,
                  ca: this.ca,
                  ciphers: this.ciphers,
                  rejectUnauthorized: this.rejectUnauthorized,
                  perMessageDeflate: this.perMessageDeflate,
                  extraHeaders: this.extraHeaders
                });
                return transport;
              };
              function clone(obj) {
                var o = {};
                for (var i in obj) obj.hasOwnProperty(i) && (o[i] = obj[i]);
                return o;
              }
              Socket.prototype.open = function() {
                var transport;
                if (this.rememberUpgrade && Socket.priorWebsocketSuccess && -1 != this.transports.indexOf("websocket")) transport = "websocket"; else {
                  if (0 === this.transports.length) {
                    var self = this;
                    setTimeout(function() {
                      self.emit("error", "No transports available");
                    }, 0);
                    return;
                  }
                  transport = this.transports[0];
                }
                this.readyState = "opening";
                try {
                  transport = this.createTransport(transport);
                } catch (e) {
                  this.transports.shift();
                  this.open();
                  return;
                }
                transport.open();
                this.setTransport(transport);
              };
              Socket.prototype.setTransport = function(transport) {
                debug("setting transport %s", transport.name);
                var self = this;
                if (this.transport) {
                  debug("clearing existing transport %s", this.transport.name);
                  this.transport.removeAllListeners();
                }
                this.transport = transport;
                transport.on("drain", function() {
                  self.onDrain();
                }).on("packet", function(packet) {
                  self.onPacket(packet);
                }).on("error", function(e) {
                  self.onError(e);
                }).on("close", function() {
                  self.onClose("transport close");
                });
              };
              Socket.prototype.probe = function(name) {
                debug('probing transport "%s"', name);
                var transport = this.createTransport(name, {
                  probe: 1
                }), failed = false, self = this;
                Socket.priorWebsocketSuccess = false;
                function onTransportOpen() {
                  if (self.onlyBinaryUpgrades) {
                    var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
                    failed = failed || upgradeLosesBinary;
                  }
                  if (failed) return;
                  debug('probe transport "%s" opened', name);
                  transport.send([ {
                    type: "ping",
                    data: "probe"
                  } ]);
                  transport.once("packet", function(msg) {
                    if (failed) return;
                    if ("pong" == msg.type && "probe" == msg.data) {
                      debug('probe transport "%s" pong', name);
                      self.upgrading = true;
                      self.emit("upgrading", transport);
                      if (!transport) return;
                      Socket.priorWebsocketSuccess = "websocket" == transport.name;
                      debug('pausing current transport "%s"', self.transport.name);
                      self.transport.pause(function() {
                        if (failed) return;
                        if ("closed" == self.readyState) return;
                        debug("changing transport and sending upgrade packet");
                        cleanup();
                        self.setTransport(transport);
                        transport.send([ {
                          type: "upgrade"
                        } ]);
                        self.emit("upgrade", transport);
                        transport = null;
                        self.upgrading = false;
                        self.flush();
                      });
                    } else {
                      debug('probe transport "%s" failed', name);
                      var err = new Error("probe error");
                      err.transport = transport.name;
                      self.emit("upgradeError", err);
                    }
                  });
                }
                function freezeTransport() {
                  if (failed) return;
                  failed = true;
                  cleanup();
                  transport.close();
                  transport = null;
                }
                function onerror(err) {
                  var error = new Error("probe error: " + err);
                  error.transport = transport.name;
                  freezeTransport();
                  debug('probe transport "%s" failed because of error: %s', name, err);
                  self.emit("upgradeError", error);
                }
                function onTransportClose() {
                  onerror("transport closed");
                }
                function onclose() {
                  onerror("socket closed");
                }
                function onupgrade(to) {
                  if (transport && to.name != transport.name) {
                    debug('"%s" works - aborting "%s"', to.name, transport.name);
                    freezeTransport();
                  }
                }
                function cleanup() {
                  transport.removeListener("open", onTransportOpen);
                  transport.removeListener("error", onerror);
                  transport.removeListener("close", onTransportClose);
                  self.removeListener("close", onclose);
                  self.removeListener("upgrading", onupgrade);
                }
                transport.once("open", onTransportOpen);
                transport.once("error", onerror);
                transport.once("close", onTransportClose);
                this.once("close", onclose);
                this.once("upgrading", onupgrade);
                transport.open();
              };
              Socket.prototype.onOpen = function() {
                debug("socket open");
                this.readyState = "open";
                Socket.priorWebsocketSuccess = "websocket" == this.transport.name;
                this.emit("open");
                this.flush();
                if ("open" == this.readyState && this.upgrade && this.transport.pause) {
                  debug("starting upgrade probes");
                  for (var i = 0, l = this.upgrades.length; i < l; i++) this.probe(this.upgrades[i]);
                }
              };
              Socket.prototype.onPacket = function(packet) {
                if ("opening" == this.readyState || "open" == this.readyState) {
                  debug('socket receive: type "%s", data "%s"', packet.type, packet.data);
                  this.emit("packet", packet);
                  this.emit("heartbeat");
                  switch (packet.type) {
                   case "open":
                    this.onHandshake(parsejson(packet.data));
                    break;

                   case "pong":
                    this.setPing();
                    this.emit("pong");
                    break;

                   case "error":
                    var err = new Error("server error");
                    err.code = packet.data;
                    this.onError(err);
                    break;

                   case "message":
                    this.emit("data", packet.data);
                    this.emit("message", packet.data);
                  }
                } else debug('packet received with socket readyState "%s"', this.readyState);
              };
              Socket.prototype.onHandshake = function(data) {
                this.emit("handshake", data);
                this.id = data.sid;
                this.transport.query.sid = data.sid;
                this.upgrades = this.filterUpgrades(data.upgrades);
                this.pingInterval = data.pingInterval;
                this.pingTimeout = data.pingTimeout;
                this.onOpen();
                if ("closed" == this.readyState) return;
                this.setPing();
                this.removeListener("heartbeat", this.onHeartbeat);
                this.on("heartbeat", this.onHeartbeat);
              };
              Socket.prototype.onHeartbeat = function(timeout) {
                clearTimeout(this.pingTimeoutTimer);
                var self = this;
                self.pingTimeoutTimer = setTimeout(function() {
                  if ("closed" == self.readyState) return;
                  self.onClose("ping timeout");
                }, timeout || self.pingInterval + self.pingTimeout);
              };
              Socket.prototype.setPing = function() {
                var self = this;
                clearTimeout(self.pingIntervalTimer);
                self.pingIntervalTimer = setTimeout(function() {
                  debug("writing ping packet - expecting pong within %sms", self.pingTimeout);
                  self.ping();
                  self.onHeartbeat(self.pingTimeout);
                }, self.pingInterval);
              };
              Socket.prototype.ping = function() {
                var self = this;
                this.sendPacket("ping", function() {
                  self.emit("ping");
                });
              };
              Socket.prototype.onDrain = function() {
                this.writeBuffer.splice(0, this.prevBufferLen);
                this.prevBufferLen = 0;
                0 === this.writeBuffer.length ? this.emit("drain") : this.flush();
              };
              Socket.prototype.flush = function() {
                if ("closed" != this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
                  debug("flushing %d packets in socket", this.writeBuffer.length);
                  this.transport.send(this.writeBuffer);
                  this.prevBufferLen = this.writeBuffer.length;
                  this.emit("flush");
                }
              };
              Socket.prototype.write = Socket.prototype.send = function(msg, options, fn) {
                this.sendPacket("message", msg, options, fn);
                return this;
              };
              Socket.prototype.sendPacket = function(type, data, options, fn) {
                if ("function" == typeof data) {
                  fn = data;
                  data = void 0;
                }
                if ("function" == typeof options) {
                  fn = options;
                  options = null;
                }
                if ("closing" == this.readyState || "closed" == this.readyState) return;
                options = options || {};
                options.compress = false !== options.compress;
                var packet = {
                  type: type,
                  data: data,
                  options: options
                };
                this.emit("packetCreate", packet);
                this.writeBuffer.push(packet);
                fn && this.once("flush", fn);
                this.flush();
              };
              Socket.prototype.close = function() {
                if ("opening" == this.readyState || "open" == this.readyState) {
                  this.readyState = "closing";
                  var self = this;
                  this.writeBuffer.length ? this.once("drain", function() {
                    this.upgrading ? waitForUpgrade() : close();
                  }) : this.upgrading ? waitForUpgrade() : close();
                }
                function close() {
                  self.onClose("forced close");
                  debug("socket closing - telling transport to close");
                  self.transport.close();
                }
                function cleanupAndClose() {
                  self.removeListener("upgrade", cleanupAndClose);
                  self.removeListener("upgradeError", cleanupAndClose);
                  close();
                }
                function waitForUpgrade() {
                  self.once("upgrade", cleanupAndClose);
                  self.once("upgradeError", cleanupAndClose);
                }
                return this;
              };
              Socket.prototype.onError = function(err) {
                debug("socket error %j", err);
                Socket.priorWebsocketSuccess = false;
                this.emit("error", err);
                this.onClose("transport error", err);
              };
              Socket.prototype.onClose = function(reason, desc) {
                if ("opening" == this.readyState || "open" == this.readyState || "closing" == this.readyState) {
                  debug('socket close with reason: "%s"', reason);
                  var self = this;
                  clearTimeout(this.pingIntervalTimer);
                  clearTimeout(this.pingTimeoutTimer);
                  this.transport.removeAllListeners("close");
                  this.transport.close();
                  this.transport.removeAllListeners();
                  this.readyState = "closed";
                  this.id = null;
                  this.emit("close", reason, desc);
                  self.writeBuffer = [];
                  self.prevBufferLen = 0;
                }
              };
              Socket.prototype.filterUpgrades = function(upgrades) {
                var filteredUpgrades = [];
                for (var i = 0, j = upgrades.length; i < j; i++) ~index(this.transports, upgrades[i]) && filteredUpgrades.push(upgrades[i]);
                return filteredUpgrades;
              };
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {
            "./transport": 4,
            "./transports": 5,
            "component-emitter": 15,
            debug: 17,
            "engine.io-parser": 19,
            indexof: 23,
            parsejson: 26,
            parseqs: 27,
            parseuri: 28
          } ],
          4: [ function(_dereq_, module, exports) {
            var parser = _dereq_("engine.io-parser");
            var Emitter = _dereq_("component-emitter");
            module.exports = Transport;
            function Transport(opts) {
              this.path = opts.path;
              this.hostname = opts.hostname;
              this.port = opts.port;
              this.secure = opts.secure;
              this.query = opts.query;
              this.timestampParam = opts.timestampParam;
              this.timestampRequests = opts.timestampRequests;
              this.readyState = "";
              this.agent = opts.agent || false;
              this.socket = opts.socket;
              this.enablesXDR = opts.enablesXDR;
              this.pfx = opts.pfx;
              this.key = opts.key;
              this.passphrase = opts.passphrase;
              this.cert = opts.cert;
              this.ca = opts.ca;
              this.ciphers = opts.ciphers;
              this.rejectUnauthorized = opts.rejectUnauthorized;
              this.extraHeaders = opts.extraHeaders;
            }
            Emitter(Transport.prototype);
            Transport.prototype.onError = function(msg, desc) {
              var err = new Error(msg);
              err.type = "TransportError";
              err.description = desc;
              this.emit("error", err);
              return this;
            };
            Transport.prototype.open = function() {
              if ("closed" == this.readyState || "" == this.readyState) {
                this.readyState = "opening";
                this.doOpen();
              }
              return this;
            };
            Transport.prototype.close = function() {
              if ("opening" == this.readyState || "open" == this.readyState) {
                this.doClose();
                this.onClose();
              }
              return this;
            };
            Transport.prototype.send = function(packets) {
              if ("open" != this.readyState) throw new Error("Transport not open");
              this.write(packets);
            };
            Transport.prototype.onOpen = function() {
              this.readyState = "open";
              this.writable = true;
              this.emit("open");
            };
            Transport.prototype.onData = function(data) {
              var packet = parser.decodePacket(data, this.socket.binaryType);
              this.onPacket(packet);
            };
            Transport.prototype.onPacket = function(packet) {
              this.emit("packet", packet);
            };
            Transport.prototype.onClose = function() {
              this.readyState = "closed";
              this.emit("close");
            };
          }, {
            "component-emitter": 15,
            "engine.io-parser": 19
          } ],
          5: [ function(_dereq_, module, exports) {
            (function(global) {
              var XMLHttpRequest = _dereq_("xmlhttprequest-ssl");
              var XHR = _dereq_("./polling-xhr");
              var JSONP = _dereq_("./polling-jsonp");
              var websocket = _dereq_("./websocket");
              exports.polling = polling;
              exports.websocket = websocket;
              function polling(opts) {
                var xhr;
                var xd = false;
                var xs = false;
                var jsonp = false !== opts.jsonp;
                if (global.location) {
                  var isSSL = "https:" == location.protocol;
                  var port = location.port;
                  port || (port = isSSL ? 443 : 80);
                  xd = opts.hostname != location.hostname || port != opts.port;
                  xs = opts.secure != isSSL;
                }
                opts.xdomain = xd;
                opts.xscheme = xs;
                xhr = new XMLHttpRequest(opts);
                if ("open" in xhr && !opts.forceJSONP) return new XHR(opts);
                if (!jsonp) throw new Error("JSONP disabled");
                return new JSONP(opts);
              }
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {
            "./polling-jsonp": 6,
            "./polling-xhr": 7,
            "./websocket": 9,
            "xmlhttprequest-ssl": 10
          } ],
          6: [ function(_dereq_, module, exports) {
            (function(global) {
              var Polling = _dereq_("./polling");
              var inherit = _dereq_("component-inherit");
              module.exports = JSONPPolling;
              var rNewline = /\n/g;
              var rEscapedNewline = /\\n/g;
              var callbacks;
              var index = 0;
              function empty() {}
              function JSONPPolling(opts) {
                Polling.call(this, opts);
                this.query = this.query || {};
                if (!callbacks) {
                  global.___eio || (global.___eio = []);
                  callbacks = global.___eio;
                }
                this.index = callbacks.length;
                var self = this;
                callbacks.push(function(msg) {
                  self.onData(msg);
                });
                this.query.j = this.index;
                global.document && global.addEventListener && global.addEventListener("beforeunload", function() {
                  self.script && (self.script.onerror = empty);
                }, false);
              }
              inherit(JSONPPolling, Polling);
              JSONPPolling.prototype.supportsBinary = false;
              JSONPPolling.prototype.doClose = function() {
                if (this.script) {
                  this.script.parentNode.removeChild(this.script);
                  this.script = null;
                }
                if (this.form) {
                  this.form.parentNode.removeChild(this.form);
                  this.form = null;
                  this.iframe = null;
                }
                Polling.prototype.doClose.call(this);
              };
              JSONPPolling.prototype.doPoll = function() {
                var self = this;
                var script = document.createElement("script");
                if (this.script) {
                  this.script.parentNode.removeChild(this.script);
                  this.script = null;
                }
                script.async = true;
                script.src = this.uri();
                script.onerror = function(e) {
                  self.onError("jsonp poll error", e);
                };
                var insertAt = document.getElementsByTagName("script")[0];
                insertAt ? insertAt.parentNode.insertBefore(script, insertAt) : (document.head || document.body).appendChild(script);
                this.script = script;
                var isUAgecko = "undefined" != typeof navigator && /gecko/i.test(navigator.userAgent);
                isUAgecko && setTimeout(function() {
                  var iframe = document.createElement("iframe");
                  document.body.appendChild(iframe);
                  document.body.removeChild(iframe);
                }, 100);
              };
              JSONPPolling.prototype.doWrite = function(data, fn) {
                var self = this;
                if (!this.form) {
                  var form = document.createElement("form");
                  var area = document.createElement("textarea");
                  var id = this.iframeId = "eio_iframe_" + this.index;
                  var iframe;
                  form.className = "socketio";
                  form.style.position = "absolute";
                  form.style.top = "-1000px";
                  form.style.left = "-1000px";
                  form.target = id;
                  form.method = "POST";
                  form.setAttribute("accept-charset", "utf-8");
                  area.name = "d";
                  form.appendChild(area);
                  document.body.appendChild(form);
                  this.form = form;
                  this.area = area;
                }
                this.form.action = this.uri();
                function complete() {
                  initIframe();
                  fn();
                }
                function initIframe() {
                  if (self.iframe) try {
                    self.form.removeChild(self.iframe);
                  } catch (e) {
                    self.onError("jsonp polling iframe removal error", e);
                  }
                  try {
                    var html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
                    iframe = document.createElement(html);
                  } catch (e) {
                    iframe = document.createElement("iframe");
                    iframe.name = self.iframeId;
                    iframe.src = "javascript:0";
                  }
                  iframe.id = self.iframeId;
                  self.form.appendChild(iframe);
                  self.iframe = iframe;
                }
                initIframe();
                data = data.replace(rEscapedNewline, "\\\n");
                this.area.value = data.replace(rNewline, "\\n");
                try {
                  this.form.submit();
                } catch (e) {}
                this.iframe.attachEvent ? this.iframe.onreadystatechange = function() {
                  "complete" == self.iframe.readyState && complete();
                } : this.iframe.onload = complete;
              };
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {
            "./polling": 8,
            "component-inherit": 16
          } ],
          7: [ function(_dereq_, module, exports) {
            (function(global) {
              var XMLHttpRequest = _dereq_("xmlhttprequest-ssl");
              var Polling = _dereq_("./polling");
              var Emitter = _dereq_("component-emitter");
              var inherit = _dereq_("component-inherit");
              var debug = _dereq_("debug")("engine.io-client:polling-xhr");
              module.exports = XHR;
              module.exports.Request = Request;
              function empty() {}
              function XHR(opts) {
                Polling.call(this, opts);
                if (global.location) {
                  var isSSL = "https:" == location.protocol;
                  var port = location.port;
                  port || (port = isSSL ? 443 : 80);
                  this.xd = opts.hostname != global.location.hostname || port != opts.port;
                  this.xs = opts.secure != isSSL;
                } else this.extraHeaders = opts.extraHeaders;
              }
              inherit(XHR, Polling);
              XHR.prototype.supportsBinary = true;
              XHR.prototype.request = function(opts) {
                opts = opts || {};
                opts.uri = this.uri();
                opts.xd = this.xd;
                opts.xs = this.xs;
                opts.agent = this.agent || false;
                opts.supportsBinary = this.supportsBinary;
                opts.enablesXDR = this.enablesXDR;
                opts.pfx = this.pfx;
                opts.key = this.key;
                opts.passphrase = this.passphrase;
                opts.cert = this.cert;
                opts.ca = this.ca;
                opts.ciphers = this.ciphers;
                opts.rejectUnauthorized = this.rejectUnauthorized;
                opts.extraHeaders = this.extraHeaders;
                return new Request(opts);
              };
              XHR.prototype.doWrite = function(data, fn) {
                var isBinary = "string" !== typeof data && void 0 !== data;
                var req = this.request({
                  method: "POST",
                  data: data,
                  isBinary: isBinary
                });
                var self = this;
                req.on("success", fn);
                req.on("error", function(err) {
                  self.onError("xhr post error", err);
                });
                this.sendXhr = req;
              };
              XHR.prototype.doPoll = function() {
                debug("xhr poll");
                var req = this.request();
                var self = this;
                req.on("data", function(data) {
                  self.onData(data);
                });
                req.on("error", function(err) {
                  self.onError("xhr poll error", err);
                });
                this.pollXhr = req;
              };
              function Request(opts) {
                this.method = opts.method || "GET";
                this.uri = opts.uri;
                this.xd = !!opts.xd;
                this.xs = !!opts.xs;
                this.async = false !== opts.async;
                this.data = void 0 != opts.data ? opts.data : null;
                this.agent = opts.agent;
                this.isBinary = opts.isBinary;
                this.supportsBinary = opts.supportsBinary;
                this.enablesXDR = opts.enablesXDR;
                this.pfx = opts.pfx;
                this.key = opts.key;
                this.passphrase = opts.passphrase;
                this.cert = opts.cert;
                this.ca = opts.ca;
                this.ciphers = opts.ciphers;
                this.rejectUnauthorized = opts.rejectUnauthorized;
                this.extraHeaders = opts.extraHeaders;
                this.create();
              }
              Emitter(Request.prototype);
              Request.prototype.create = function() {
                var opts = {
                  agent: this.agent,
                  xdomain: this.xd,
                  xscheme: this.xs,
                  enablesXDR: this.enablesXDR
                };
                opts.pfx = this.pfx;
                opts.key = this.key;
                opts.passphrase = this.passphrase;
                opts.cert = this.cert;
                opts.ca = this.ca;
                opts.ciphers = this.ciphers;
                opts.rejectUnauthorized = this.rejectUnauthorized;
                var xhr = this.xhr = new XMLHttpRequest(opts);
                var self = this;
                try {
                  debug("xhr open %s: %s", this.method, this.uri);
                  xhr.open(this.method, this.uri, this.async);
                  try {
                    if (this.extraHeaders) {
                      xhr.setDisableHeaderCheck(true);
                      for (var i in this.extraHeaders) this.extraHeaders.hasOwnProperty(i) && xhr.setRequestHeader(i, this.extraHeaders[i]);
                    }
                  } catch (e) {}
                  this.supportsBinary && (xhr.responseType = "arraybuffer");
                  if ("POST" == this.method) try {
                    this.isBinary ? xhr.setRequestHeader("Content-type", "application/octet-stream") : xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
                  } catch (e) {}
                  "withCredentials" in xhr && (xhr.withCredentials = true);
                  if (this.hasXDR()) {
                    xhr.onload = function() {
                      self.onLoad();
                    };
                    xhr.onerror = function() {
                      self.onError(xhr.responseText);
                    };
                  } else xhr.onreadystatechange = function() {
                    if (4 != xhr.readyState) return;
                    200 == xhr.status || 1223 == xhr.status ? self.onLoad() : setTimeout(function() {
                      self.onError(xhr.status);
                    }, 0);
                  };
                  debug("xhr data %s", this.data);
                  xhr.send(this.data);
                } catch (e) {
                  setTimeout(function() {
                    self.onError(e);
                  }, 0);
                  return;
                }
                if (global.document) {
                  this.index = Request.requestsCount++;
                  Request.requests[this.index] = this;
                }
              };
              Request.prototype.onSuccess = function() {
                this.emit("success");
                this.cleanup();
              };
              Request.prototype.onData = function(data) {
                this.emit("data", data);
                this.onSuccess();
              };
              Request.prototype.onError = function(err) {
                this.emit("error", err);
                this.cleanup(true);
              };
              Request.prototype.cleanup = function(fromError) {
                if ("undefined" == typeof this.xhr || null === this.xhr) return;
                this.hasXDR() ? this.xhr.onload = this.xhr.onerror = empty : this.xhr.onreadystatechange = empty;
                if (fromError) try {
                  this.xhr.abort();
                } catch (e) {}
                global.document && delete Request.requests[this.index];
                this.xhr = null;
              };
              Request.prototype.onLoad = function() {
                var data;
                try {
                  var contentType;
                  try {
                    contentType = this.xhr.getResponseHeader("Content-Type").split(";")[0];
                  } catch (e) {}
                  if ("application/octet-stream" === contentType) data = this.xhr.response; else if (this.supportsBinary) try {
                    data = String.fromCharCode.apply(null, new Uint8Array(this.xhr.response));
                  } catch (e) {
                    var ui8Arr = new Uint8Array(this.xhr.response);
                    var dataArray = [];
                    for (var idx = 0, length = ui8Arr.length; idx < length; idx++) dataArray.push(ui8Arr[idx]);
                    data = String.fromCharCode.apply(null, dataArray);
                  } else data = this.xhr.responseText;
                } catch (e) {
                  this.onError(e);
                }
                null != data && this.onData(data);
              };
              Request.prototype.hasXDR = function() {
                return "undefined" !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
              };
              Request.prototype.abort = function() {
                this.cleanup();
              };
              if (global.document) {
                Request.requestsCount = 0;
                Request.requests = {};
                global.attachEvent ? global.attachEvent("onunload", unloadHandler) : global.addEventListener && global.addEventListener("beforeunload", unloadHandler, false);
              }
              function unloadHandler() {
                for (var i in Request.requests) Request.requests.hasOwnProperty(i) && Request.requests[i].abort();
              }
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {
            "./polling": 8,
            "component-emitter": 15,
            "component-inherit": 16,
            debug: 17,
            "xmlhttprequest-ssl": 10
          } ],
          8: [ function(_dereq_, module, exports) {
            var Transport = _dereq_("../transport");
            var parseqs = _dereq_("parseqs");
            var parser = _dereq_("engine.io-parser");
            var inherit = _dereq_("component-inherit");
            var yeast = _dereq_("yeast");
            var debug = _dereq_("debug")("engine.io-client:polling");
            module.exports = Polling;
            var hasXHR2 = function() {
              var XMLHttpRequest = _dereq_("xmlhttprequest-ssl");
              var xhr = new XMLHttpRequest({
                xdomain: false
              });
              return null != xhr.responseType;
            }();
            function Polling(opts) {
              var forceBase64 = opts && opts.forceBase64;
              hasXHR2 && !forceBase64 || (this.supportsBinary = false);
              Transport.call(this, opts);
            }
            inherit(Polling, Transport);
            Polling.prototype.name = "polling";
            Polling.prototype.doOpen = function() {
              this.poll();
            };
            Polling.prototype.pause = function(onPause) {
              var pending = 0;
              var self = this;
              this.readyState = "pausing";
              function pause() {
                debug("paused");
                self.readyState = "paused";
                onPause();
              }
              if (this.polling || !this.writable) {
                var total = 0;
                if (this.polling) {
                  debug("we are currently polling - waiting to pause");
                  total++;
                  this.once("pollComplete", function() {
                    debug("pre-pause polling complete");
                    --total || pause();
                  });
                }
                if (!this.writable) {
                  debug("we are currently writing - waiting to pause");
                  total++;
                  this.once("drain", function() {
                    debug("pre-pause writing complete");
                    --total || pause();
                  });
                }
              } else pause();
            };
            Polling.prototype.poll = function() {
              debug("polling");
              this.polling = true;
              this.doPoll();
              this.emit("poll");
            };
            Polling.prototype.onData = function(data) {
              var self = this;
              debug("polling got data %s", data);
              var callback = function callback(packet, index, total) {
                "opening" == self.readyState && self.onOpen();
                if ("close" == packet.type) {
                  self.onClose();
                  return false;
                }
                self.onPacket(packet);
              };
              parser.decodePayload(data, this.socket.binaryType, callback);
              if ("closed" != this.readyState) {
                this.polling = false;
                this.emit("pollComplete");
                "open" == this.readyState ? this.poll() : debug('ignoring poll - transport state "%s"', this.readyState);
              }
            };
            Polling.prototype.doClose = function() {
              var self = this;
              function close() {
                debug("writing close packet");
                self.write([ {
                  type: "close"
                } ]);
              }
              if ("open" == this.readyState) {
                debug("transport open - closing");
                close();
              } else {
                debug("transport not open - deferring close");
                this.once("open", close);
              }
            };
            Polling.prototype.write = function(packets) {
              var self = this;
              this.writable = false;
              var callbackfn = function callbackfn() {
                self.writable = true;
                self.emit("drain");
              };
              var self = this;
              parser.encodePayload(packets, this.supportsBinary, function(data) {
                self.doWrite(data, callbackfn);
              });
            };
            Polling.prototype.uri = function() {
              var query = this.query || {};
              var schema = this.secure ? "https" : "http";
              var port = "";
              false !== this.timestampRequests && (query[this.timestampParam] = yeast());
              this.supportsBinary || query.sid || (query.b64 = 1);
              query = parseqs.encode(query);
              this.port && ("https" == schema && 443 != this.port || "http" == schema && 80 != this.port) && (port = ":" + this.port);
              query.length && (query = "?" + query);
              var ipv6 = -1 !== this.hostname.indexOf(":");
              return schema + "://" + (ipv6 ? "[" + this.hostname + "]" : this.hostname) + port + this.path + query;
            };
          }, {
            "../transport": 4,
            "component-inherit": 16,
            debug: 17,
            "engine.io-parser": 19,
            parseqs: 27,
            "xmlhttprequest-ssl": 10,
            yeast: 30
          } ],
          9: [ function(_dereq_, module, exports) {
            (function(global) {
              var Transport = _dereq_("../transport");
              var parser = _dereq_("engine.io-parser");
              var parseqs = _dereq_("parseqs");
              var inherit = _dereq_("component-inherit");
              var yeast = _dereq_("yeast");
              var debug = _dereq_("debug")("engine.io-client:websocket");
              var BrowserWebSocket = global.WebSocket || global.MozWebSocket;
              var WebSocket = BrowserWebSocket;
              if (!WebSocket && "undefined" === typeof window) try {
                WebSocket = _dereq_("ws");
              } catch (e) {}
              module.exports = WS;
              function WS(opts) {
                var forceBase64 = opts && opts.forceBase64;
                forceBase64 && (this.supportsBinary = false);
                this.perMessageDeflate = opts.perMessageDeflate;
                Transport.call(this, opts);
              }
              inherit(WS, Transport);
              WS.prototype.name = "websocket";
              WS.prototype.supportsBinary = true;
              WS.prototype.doOpen = function() {
                if (!this.check()) return;
                var self = this;
                var uri = this.uri();
                var protocols = void 0;
                var opts = {
                  agent: this.agent,
                  perMessageDeflate: this.perMessageDeflate
                };
                opts.pfx = this.pfx;
                opts.key = this.key;
                opts.passphrase = this.passphrase;
                opts.cert = this.cert;
                opts.ca = this.ca;
                opts.ciphers = this.ciphers;
                opts.rejectUnauthorized = this.rejectUnauthorized;
                this.extraHeaders && (opts.headers = this.extraHeaders);
                this.ws = BrowserWebSocket ? new WebSocket(uri) : new WebSocket(uri, protocols, opts);
                void 0 === this.ws.binaryType && (this.supportsBinary = false);
                if (this.ws.supports && this.ws.supports.binary) {
                  this.supportsBinary = true;
                  this.ws.binaryType = "buffer";
                } else this.ws.binaryType = "arraybuffer";
                this.addEventListeners();
              };
              WS.prototype.addEventListeners = function() {
                var self = this;
                this.ws.onopen = function() {
                  self.onOpen();
                };
                this.ws.onclose = function() {
                  self.onClose();
                };
                this.ws.onmessage = function(ev) {
                  self.onData(ev.data);
                };
                this.ws.onerror = function(e) {
                  self.onError("websocket error", e);
                };
              };
              "undefined" != typeof navigator && /iPad|iPhone|iPod/i.test(navigator.userAgent) && (WS.prototype.onData = function(data) {
                var self = this;
                setTimeout(function() {
                  Transport.prototype.onData.call(self, data);
                }, 0);
              });
              WS.prototype.write = function(packets) {
                var self = this;
                this.writable = false;
                var total = packets.length;
                for (var i = 0, l = total; i < l; i++) (function(packet) {
                  parser.encodePacket(packet, self.supportsBinary, function(data) {
                    if (!BrowserWebSocket) {
                      var opts = {};
                      packet.options && (opts.compress = packet.options.compress);
                      if (self.perMessageDeflate) {
                        var len = "string" == typeof data ? global.Buffer.byteLength(data) : data.length;
                        len < self.perMessageDeflate.threshold && (opts.compress = false);
                      }
                    }
                    try {
                      BrowserWebSocket ? self.ws.send(data) : self.ws.send(data, opts);
                    } catch (e) {
                      debug("websocket closed before onclose event");
                    }
                    --total || done();
                  });
                })(packets[i]);
                function done() {
                  self.emit("flush");
                  setTimeout(function() {
                    self.writable = true;
                    self.emit("drain");
                  }, 0);
                }
              };
              WS.prototype.onClose = function() {
                Transport.prototype.onClose.call(this);
              };
              WS.prototype.doClose = function() {
                "undefined" !== typeof this.ws && this.ws.close();
              };
              WS.prototype.uri = function() {
                var query = this.query || {};
                var schema = this.secure ? "wss" : "ws";
                var port = "";
                this.port && ("wss" == schema && 443 != this.port || "ws" == schema && 80 != this.port) && (port = ":" + this.port);
                this.timestampRequests && (query[this.timestampParam] = yeast());
                this.supportsBinary || (query.b64 = 1);
                query = parseqs.encode(query);
                query.length && (query = "?" + query);
                var ipv6 = -1 !== this.hostname.indexOf(":");
                return schema + "://" + (ipv6 ? "[" + this.hostname + "]" : this.hostname) + port + this.path + query;
              };
              WS.prototype.check = function() {
                return !!WebSocket && !("__initialize" in WebSocket && this.name === WS.prototype.name);
              };
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {
            "../transport": 4,
            "component-inherit": 16,
            debug: 17,
            "engine.io-parser": 19,
            parseqs: 27,
            ws: void 0,
            yeast: 30
          } ],
          10: [ function(_dereq_, module, exports) {
            var hasCORS = _dereq_("has-cors");
            module.exports = function(opts) {
              var xdomain = opts.xdomain;
              var xscheme = opts.xscheme;
              var enablesXDR = opts.enablesXDR;
              try {
                if ("undefined" != typeof XMLHttpRequest && (!xdomain || hasCORS)) return new XMLHttpRequest();
              } catch (e) {}
              try {
                if ("undefined" != typeof XDomainRequest && !xscheme && enablesXDR) return new XDomainRequest();
              } catch (e) {}
              if (!xdomain) try {
                return new ActiveXObject("Microsoft.XMLHTTP");
              } catch (e) {}
            };
          }, {
            "has-cors": 22
          } ],
          11: [ function(_dereq_, module, exports) {
            module.exports = after;
            function after(count, callback, err_cb) {
              var bail = false;
              err_cb = err_cb || noop;
              proxy.count = count;
              return 0 === count ? callback() : proxy;
              function proxy(err, result) {
                if (proxy.count <= 0) throw new Error("after called too many times");
                --proxy.count;
                if (err) {
                  bail = true;
                  callback(err);
                  callback = err_cb;
                } else 0 !== proxy.count || bail || callback(null, result);
              }
            }
            function noop() {}
          }, {} ],
          12: [ function(_dereq_, module, exports) {
            module.exports = function(arraybuffer, start, end) {
              var bytes = arraybuffer.byteLength;
              start = start || 0;
              end = end || bytes;
              if (arraybuffer.slice) return arraybuffer.slice(start, end);
              start < 0 && (start += bytes);
              end < 0 && (end += bytes);
              end > bytes && (end = bytes);
              if (start >= bytes || start >= end || 0 === bytes) return new ArrayBuffer(0);
              var abv = new Uint8Array(arraybuffer);
              var result = new Uint8Array(end - start);
              for (var i = start, ii = 0; i < end; i++, ii++) result[ii] = abv[i];
              return result.buffer;
            };
          }, {} ],
          13: [ function(_dereq_, module, exports) {
            (function(chars) {
              exports.encode = function(arraybuffer) {
                var bytes = new Uint8Array(arraybuffer), i, len = bytes.length, base64 = "";
                for (i = 0; i < len; i += 3) {
                  base64 += chars[bytes[i] >> 2];
                  base64 += chars[(3 & bytes[i]) << 4 | bytes[i + 1] >> 4];
                  base64 += chars[(15 & bytes[i + 1]) << 2 | bytes[i + 2] >> 6];
                  base64 += chars[63 & bytes[i + 2]];
                }
                len % 3 === 2 ? base64 = base64.substring(0, base64.length - 1) + "=" : len % 3 === 1 && (base64 = base64.substring(0, base64.length - 2) + "==");
                return base64;
              };
              exports.decode = function(base64) {
                var bufferLength = .75 * base64.length, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
                if ("=" === base64[base64.length - 1]) {
                  bufferLength--;
                  "=" === base64[base64.length - 2] && bufferLength--;
                }
                var arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
                for (i = 0; i < len; i += 4) {
                  encoded1 = chars.indexOf(base64[i]);
                  encoded2 = chars.indexOf(base64[i + 1]);
                  encoded3 = chars.indexOf(base64[i + 2]);
                  encoded4 = chars.indexOf(base64[i + 3]);
                  bytes[p++] = encoded1 << 2 | encoded2 >> 4;
                  bytes[p++] = (15 & encoded2) << 4 | encoded3 >> 2;
                  bytes[p++] = (3 & encoded3) << 6 | 63 & encoded4;
                }
                return arraybuffer;
              };
            })("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
          }, {} ],
          14: [ function(_dereq_, module, exports) {
            (function(global) {
              var BlobBuilder = global.BlobBuilder || global.WebKitBlobBuilder || global.MSBlobBuilder || global.MozBlobBuilder;
              var blobSupported = function() {
                try {
                  var a = new Blob([ "hi" ]);
                  return 2 === a.size;
                } catch (e) {
                  return false;
                }
              }();
              var blobSupportsArrayBufferView = blobSupported && function() {
                try {
                  var b = new Blob([ new Uint8Array([ 1, 2 ]) ]);
                  return 2 === b.size;
                } catch (e) {
                  return false;
                }
              }();
              var blobBuilderSupported = BlobBuilder && BlobBuilder.prototype.append && BlobBuilder.prototype.getBlob;
              function mapArrayBufferViews(ary) {
                for (var i = 0; i < ary.length; i++) {
                  var chunk = ary[i];
                  if (chunk.buffer instanceof ArrayBuffer) {
                    var buf = chunk.buffer;
                    if (chunk.byteLength !== buf.byteLength) {
                      var copy = new Uint8Array(chunk.byteLength);
                      copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
                      buf = copy.buffer;
                    }
                    ary[i] = buf;
                  }
                }
              }
              function BlobBuilderConstructor(ary, options) {
                options = options || {};
                var bb = new BlobBuilder();
                mapArrayBufferViews(ary);
                for (var i = 0; i < ary.length; i++) bb.append(ary[i]);
                return options.type ? bb.getBlob(options.type) : bb.getBlob();
              }
              function BlobConstructor(ary, options) {
                mapArrayBufferViews(ary);
                return new Blob(ary, options || {});
              }
              module.exports = function() {
                return blobSupported ? blobSupportsArrayBufferView ? global.Blob : BlobConstructor : blobBuilderSupported ? BlobBuilderConstructor : void 0;
              }();
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {} ],
          15: [ function(_dereq_, module, exports) {
            module.exports = Emitter;
            function Emitter(obj) {
              if (obj) return mixin(obj);
            }
            function mixin(obj) {
              for (var key in Emitter.prototype) obj[key] = Emitter.prototype[key];
              return obj;
            }
            Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
              this._callbacks = this._callbacks || {};
              (this._callbacks[event] = this._callbacks[event] || []).push(fn);
              return this;
            };
            Emitter.prototype.once = function(event, fn) {
              var self = this;
              this._callbacks = this._callbacks || {};
              function on() {
                self.off(event, on);
                fn.apply(this, arguments);
              }
              on.fn = fn;
              this.on(event, on);
              return this;
            };
            Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
              this._callbacks = this._callbacks || {};
              if (0 == arguments.length) {
                this._callbacks = {};
                return this;
              }
              var callbacks = this._callbacks[event];
              if (!callbacks) return this;
              if (1 == arguments.length) {
                delete this._callbacks[event];
                return this;
              }
              var cb;
              for (var i = 0; i < callbacks.length; i++) {
                cb = callbacks[i];
                if (cb === fn || cb.fn === fn) {
                  callbacks.splice(i, 1);
                  break;
                }
              }
              return this;
            };
            Emitter.prototype.emit = function(event) {
              this._callbacks = this._callbacks || {};
              var args = [].slice.call(arguments, 1), callbacks = this._callbacks[event];
              if (callbacks) {
                callbacks = callbacks.slice(0);
                for (var i = 0, len = callbacks.length; i < len; ++i) callbacks[i].apply(this, args);
              }
              return this;
            };
            Emitter.prototype.listeners = function(event) {
              this._callbacks = this._callbacks || {};
              return this._callbacks[event] || [];
            };
            Emitter.prototype.hasListeners = function(event) {
              return !!this.listeners(event).length;
            };
          }, {} ],
          16: [ function(_dereq_, module, exports) {
            module.exports = function(a, b) {
              var fn = function fn() {};
              fn.prototype = b.prototype;
              a.prototype = new fn();
              a.prototype.constructor = a;
            };
          }, {} ],
          17: [ function(_dereq_, module, exports) {
            exports = module.exports = _dereq_("./debug");
            exports.log = log;
            exports.formatArgs = formatArgs;
            exports.save = save;
            exports.load = load;
            exports.useColors = useColors;
            exports.storage = "undefined" != typeof chrome && "undefined" != typeof chrome.storage ? chrome.storage.local : localstorage();
            exports.colors = [ "lightseagreen", "forestgreen", "goldenrod", "dodgerblue", "darkorchid", "crimson" ];
            function useColors() {
              return "WebkitAppearance" in document.documentElement.style || window.console && (console.firebug || console.exception && console.table) || navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31;
            }
            exports.formatters.j = function(v) {
              return JSON.stringify(v);
            };
            function formatArgs() {
              var args = arguments;
              var useColors = this.useColors;
              args[0] = (useColors ? "%c" : "") + this.namespace + (useColors ? " %c" : " ") + args[0] + (useColors ? "%c " : " ") + "+" + exports.humanize(this.diff);
              if (!useColors) return args;
              var c = "color: " + this.color;
              args = [ args[0], c, "color: inherit" ].concat(Array.prototype.slice.call(args, 1));
              var index = 0;
              var lastC = 0;
              args[0].replace(/%[a-z%]/g, function(match) {
                if ("%%" === match) return;
                index++;
                "%c" === match && (lastC = index);
              });
              args.splice(lastC, 0, c);
              return args;
            }
            function log() {
              return "object" === typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
            }
            function save(namespaces) {
              try {
                null == namespaces ? exports.storage.removeItem("debug") : exports.storage.debug = namespaces;
              } catch (e) {}
            }
            function load() {
              var r;
              try {
                r = exports.storage.debug;
              } catch (e) {}
              return r;
            }
            exports.enable(load());
            function localstorage() {
              try {
                return window.localStorage;
              } catch (e) {}
            }
          }, {
            "./debug": 18
          } ],
          18: [ function(_dereq_, module, exports) {
            exports = module.exports = debug;
            exports.coerce = coerce;
            exports.disable = disable;
            exports.enable = enable;
            exports.enabled = enabled;
            exports.humanize = _dereq_("ms");
            exports.names = [];
            exports.skips = [];
            exports.formatters = {};
            var prevColor = 0;
            var prevTime;
            function selectColor() {
              return exports.colors[prevColor++ % exports.colors.length];
            }
            function debug(namespace) {
              function disabled() {}
              disabled.enabled = false;
              function enabled() {
                var self = enabled;
                var curr = +new Date();
                var ms = curr - (prevTime || curr);
                self.diff = ms;
                self.prev = prevTime;
                self.curr = curr;
                prevTime = curr;
                null == self.useColors && (self.useColors = exports.useColors());
                null == self.color && self.useColors && (self.color = selectColor());
                var args = Array.prototype.slice.call(arguments);
                args[0] = exports.coerce(args[0]);
                "string" !== typeof args[0] && (args = [ "%o" ].concat(args));
                var index = 0;
                args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
                  if ("%%" === match) return match;
                  index++;
                  var formatter = exports.formatters[format];
                  if ("function" === typeof formatter) {
                    var val = args[index];
                    match = formatter.call(self, val);
                    args.splice(index, 1);
                    index--;
                  }
                  return match;
                });
                "function" === typeof exports.formatArgs && (args = exports.formatArgs.apply(self, args));
                var logFn = enabled.log || exports.log || console.log.bind(console);
                logFn.apply(self, args);
              }
              enabled.enabled = true;
              var fn = exports.enabled(namespace) ? enabled : disabled;
              fn.namespace = namespace;
              return fn;
            }
            function enable(namespaces) {
              exports.save(namespaces);
              var split = (namespaces || "").split(/[\s,]+/);
              var len = split.length;
              for (var i = 0; i < len; i++) {
                if (!split[i]) continue;
                namespaces = split[i].replace(/\*/g, ".*?");
                "-" === namespaces[0] ? exports.skips.push(new RegExp("^" + namespaces.substr(1) + "$")) : exports.names.push(new RegExp("^" + namespaces + "$"));
              }
            }
            function disable() {
              exports.enable("");
            }
            function enabled(name) {
              var i, len;
              for (i = 0, len = exports.skips.length; i < len; i++) if (exports.skips[i].test(name)) return false;
              for (i = 0, len = exports.names.length; i < len; i++) if (exports.names[i].test(name)) return true;
              return false;
            }
            function coerce(val) {
              if (val instanceof Error) return val.stack || val.message;
              return val;
            }
          }, {
            ms: 25
          } ],
          19: [ function(_dereq_, module, exports) {
            (function(global) {
              var keys = _dereq_("./keys");
              var hasBinary = _dereq_("has-binary");
              var sliceBuffer = _dereq_("arraybuffer.slice");
              var base64encoder = _dereq_("base64-arraybuffer");
              var after = _dereq_("after");
              var utf8 = _dereq_("utf8");
              var isAndroid = navigator.userAgent.match(/Android/i);
              var isPhantomJS = /PhantomJS/i.test(navigator.userAgent);
              var dontSendBlobs = isAndroid || isPhantomJS;
              exports.protocol = 3;
              var packets = exports.packets = {
                open: 0,
                close: 1,
                ping: 2,
                pong: 3,
                message: 4,
                upgrade: 5,
                noop: 6
              };
              var packetslist = keys(packets);
              var err = {
                type: "error",
                data: "parser error"
              };
              var Blob = _dereq_("blob");
              exports.encodePacket = function(packet, supportsBinary, utf8encode, callback) {
                if ("function" == typeof supportsBinary) {
                  callback = supportsBinary;
                  supportsBinary = false;
                }
                if ("function" == typeof utf8encode) {
                  callback = utf8encode;
                  utf8encode = null;
                }
                var data = void 0 === packet.data ? void 0 : packet.data.buffer || packet.data;
                if (global.ArrayBuffer && data instanceof ArrayBuffer) return encodeArrayBuffer(packet, supportsBinary, callback);
                if (Blob && data instanceof global.Blob) return encodeBlob(packet, supportsBinary, callback);
                if (data && data.base64) return encodeBase64Object(packet, callback);
                var encoded = packets[packet.type];
                void 0 !== packet.data && (encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data));
                return callback("" + encoded);
              };
              function encodeBase64Object(packet, callback) {
                var message = "b" + exports.packets[packet.type] + packet.data.data;
                return callback(message);
              }
              function encodeArrayBuffer(packet, supportsBinary, callback) {
                if (!supportsBinary) return exports.encodeBase64Packet(packet, callback);
                var data = packet.data;
                var contentArray = new Uint8Array(data);
                var resultBuffer = new Uint8Array(1 + data.byteLength);
                resultBuffer[0] = packets[packet.type];
                for (var i = 0; i < contentArray.length; i++) resultBuffer[i + 1] = contentArray[i];
                return callback(resultBuffer.buffer);
              }
              function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
                if (!supportsBinary) return exports.encodeBase64Packet(packet, callback);
                var fr = new FileReader();
                fr.onload = function() {
                  packet.data = fr.result;
                  exports.encodePacket(packet, supportsBinary, true, callback);
                };
                return fr.readAsArrayBuffer(packet.data);
              }
              function encodeBlob(packet, supportsBinary, callback) {
                if (!supportsBinary) return exports.encodeBase64Packet(packet, callback);
                if (dontSendBlobs) return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
                var length = new Uint8Array(1);
                length[0] = packets[packet.type];
                var blob = new Blob([ length.buffer, packet.data ]);
                return callback(blob);
              }
              exports.encodeBase64Packet = function(packet, callback) {
                var message = "b" + exports.packets[packet.type];
                if (Blob && packet.data instanceof global.Blob) {
                  var fr = new FileReader();
                  fr.onload = function() {
                    var b64 = fr.result.split(",")[1];
                    callback(message + b64);
                  };
                  return fr.readAsDataURL(packet.data);
                }
                var b64data;
                try {
                  b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
                } catch (e) {
                  var typed = new Uint8Array(packet.data);
                  var basic = new Array(typed.length);
                  for (var i = 0; i < typed.length; i++) basic[i] = typed[i];
                  b64data = String.fromCharCode.apply(null, basic);
                }
                message += global.btoa(b64data);
                return callback(message);
              };
              exports.decodePacket = function(data, binaryType, utf8decode) {
                if ("string" == typeof data || void 0 === data) {
                  if ("b" == data.charAt(0)) return exports.decodeBase64Packet(data.substr(1), binaryType);
                  if (utf8decode) try {
                    data = utf8.decode(data);
                  } catch (e) {
                    return err;
                  }
                  var type = data.charAt(0);
                  if (Number(type) != type || !packetslist[type]) return err;
                  return data.length > 1 ? {
                    type: packetslist[type],
                    data: data.substring(1)
                  } : {
                    type: packetslist[type]
                  };
                }
                var asArray = new Uint8Array(data);
                var type = asArray[0];
                var rest = sliceBuffer(data, 1);
                Blob && "blob" === binaryType && (rest = new Blob([ rest ]));
                return {
                  type: packetslist[type],
                  data: rest
                };
              };
              exports.decodeBase64Packet = function(msg, binaryType) {
                var type = packetslist[msg.charAt(0)];
                if (!global.ArrayBuffer) return {
                  type: type,
                  data: {
                    base64: true,
                    data: msg.substr(1)
                  }
                };
                var data = base64encoder.decode(msg.substr(1));
                "blob" === binaryType && Blob && (data = new Blob([ data ]));
                return {
                  type: type,
                  data: data
                };
              };
              exports.encodePayload = function(packets, supportsBinary, callback) {
                if ("function" == typeof supportsBinary) {
                  callback = supportsBinary;
                  supportsBinary = null;
                }
                var isBinary = hasBinary(packets);
                if (supportsBinary && isBinary) {
                  if (Blob && !dontSendBlobs) return exports.encodePayloadAsBlob(packets, callback);
                  return exports.encodePayloadAsArrayBuffer(packets, callback);
                }
                if (!packets.length) return callback("0:");
                function setLengthHeader(message) {
                  return message.length + ":" + message;
                }
                function encodeOne(packet, doneCallback) {
                  exports.encodePacket(packet, !!isBinary && supportsBinary, true, function(message) {
                    doneCallback(null, setLengthHeader(message));
                  });
                }
                map(packets, encodeOne, function(err, results) {
                  return callback(results.join(""));
                });
              };
              function map(ary, each, done) {
                var result = new Array(ary.length);
                var next = after(ary.length, done);
                var eachWithIndex = function eachWithIndex(i, el, cb) {
                  each(el, function(error, msg) {
                    result[i] = msg;
                    cb(error, result);
                  });
                };
                for (var i = 0; i < ary.length; i++) eachWithIndex(i, ary[i], next);
              }
              exports.decodePayload = function(data, binaryType, callback) {
                if ("string" != typeof data) return exports.decodePayloadAsBinary(data, binaryType, callback);
                if ("function" === typeof binaryType) {
                  callback = binaryType;
                  binaryType = null;
                }
                var packet;
                if ("" == data) return callback(err, 0, 1);
                var length = "", n, msg;
                for (var i = 0, l = data.length; i < l; i++) {
                  var chr = data.charAt(i);
                  if (":" != chr) length += chr; else {
                    if ("" == length || length != (n = Number(length))) return callback(err, 0, 1);
                    msg = data.substr(i + 1, n);
                    if (length != msg.length) return callback(err, 0, 1);
                    if (msg.length) {
                      packet = exports.decodePacket(msg, binaryType, true);
                      if (err.type == packet.type && err.data == packet.data) return callback(err, 0, 1);
                      var ret = callback(packet, i + n, l);
                      if (false === ret) return;
                    }
                    i += n;
                    length = "";
                  }
                }
                if ("" != length) return callback(err, 0, 1);
              };
              exports.encodePayloadAsArrayBuffer = function(packets, callback) {
                if (!packets.length) return callback(new ArrayBuffer(0));
                function encodeOne(packet, doneCallback) {
                  exports.encodePacket(packet, true, true, function(data) {
                    return doneCallback(null, data);
                  });
                }
                map(packets, encodeOne, function(err, encodedPackets) {
                  var totalLength = encodedPackets.reduce(function(acc, p) {
                    var len;
                    len = "string" === typeof p ? p.length : p.byteLength;
                    return acc + len.toString().length + len + 2;
                  }, 0);
                  var resultArray = new Uint8Array(totalLength);
                  var bufferIndex = 0;
                  encodedPackets.forEach(function(p) {
                    var isString = "string" === typeof p;
                    var ab = p;
                    if (isString) {
                      var view = new Uint8Array(p.length);
                      for (var i = 0; i < p.length; i++) view[i] = p.charCodeAt(i);
                      ab = view.buffer;
                    }
                    resultArray[bufferIndex++] = isString ? 0 : 1;
                    var lenStr = ab.byteLength.toString();
                    for (var i = 0; i < lenStr.length; i++) resultArray[bufferIndex++] = parseInt(lenStr[i]);
                    resultArray[bufferIndex++] = 255;
                    var view = new Uint8Array(ab);
                    for (var i = 0; i < view.length; i++) resultArray[bufferIndex++] = view[i];
                  });
                  return callback(resultArray.buffer);
                });
              };
              exports.encodePayloadAsBlob = function(packets, callback) {
                function encodeOne(packet, doneCallback) {
                  exports.encodePacket(packet, true, true, function(encoded) {
                    var binaryIdentifier = new Uint8Array(1);
                    binaryIdentifier[0] = 1;
                    if ("string" === typeof encoded) {
                      var view = new Uint8Array(encoded.length);
                      for (var i = 0; i < encoded.length; i++) view[i] = encoded.charCodeAt(i);
                      encoded = view.buffer;
                      binaryIdentifier[0] = 0;
                    }
                    var len = encoded instanceof ArrayBuffer ? encoded.byteLength : encoded.size;
                    var lenStr = len.toString();
                    var lengthAry = new Uint8Array(lenStr.length + 1);
                    for (var i = 0; i < lenStr.length; i++) lengthAry[i] = parseInt(lenStr[i]);
                    lengthAry[lenStr.length] = 255;
                    if (Blob) {
                      var blob = new Blob([ binaryIdentifier.buffer, lengthAry.buffer, encoded ]);
                      doneCallback(null, blob);
                    }
                  });
                }
                map(packets, encodeOne, function(err, results) {
                  return callback(new Blob(results));
                });
              };
              exports.decodePayloadAsBinary = function(data, binaryType, callback) {
                if ("function" === typeof binaryType) {
                  callback = binaryType;
                  binaryType = null;
                }
                var bufferTail = data;
                var buffers = [];
                var numberTooLong = false;
                while (bufferTail.byteLength > 0) {
                  var tailArray = new Uint8Array(bufferTail);
                  var isString = 0 === tailArray[0];
                  var msgLength = "";
                  for (var i = 1; ;i++) {
                    if (255 == tailArray[i]) break;
                    if (msgLength.length > 310) {
                      numberTooLong = true;
                      break;
                    }
                    msgLength += tailArray[i];
                  }
                  if (numberTooLong) return callback(err, 0, 1);
                  bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
                  msgLength = parseInt(msgLength);
                  var msg = sliceBuffer(bufferTail, 0, msgLength);
                  if (isString) try {
                    msg = String.fromCharCode.apply(null, new Uint8Array(msg));
                  } catch (e) {
                    var typed = new Uint8Array(msg);
                    msg = "";
                    for (var i = 0; i < typed.length; i++) msg += String.fromCharCode(typed[i]);
                  }
                  buffers.push(msg);
                  bufferTail = sliceBuffer(bufferTail, msgLength);
                }
                var total = buffers.length;
                buffers.forEach(function(buffer, i) {
                  callback(exports.decodePacket(buffer, binaryType, true), i, total);
                });
              };
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {
            "./keys": 20,
            after: 11,
            "arraybuffer.slice": 12,
            "base64-arraybuffer": 13,
            blob: 14,
            "has-binary": 21,
            utf8: 29
          } ],
          20: [ function(_dereq_, module, exports) {
            module.exports = Object.keys || function keys(obj) {
              var arr = [];
              var has = Object.prototype.hasOwnProperty;
              for (var i in obj) has.call(obj, i) && arr.push(i);
              return arr;
            };
          }, {} ],
          21: [ function(_dereq_, module, exports) {
            (function(global) {
              var isArray = _dereq_("isarray");
              module.exports = hasBinary;
              function hasBinary(data) {
                function _hasBinary(obj) {
                  if (!obj) return false;
                  if (global.Buffer && global.Buffer.isBuffer(obj) || global.ArrayBuffer && obj instanceof ArrayBuffer || global.Blob && obj instanceof Blob || global.File && obj instanceof File) return true;
                  if (isArray(obj)) {
                    for (var i = 0; i < obj.length; i++) if (_hasBinary(obj[i])) return true;
                  } else if (obj && "object" == typeof obj) {
                    obj.toJSON && (obj = obj.toJSON());
                    for (var key in obj) if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) return true;
                  }
                  return false;
                }
                return _hasBinary(data);
              }
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {
            isarray: 24
          } ],
          22: [ function(_dereq_, module, exports) {
            try {
              module.exports = "undefined" !== typeof XMLHttpRequest && "withCredentials" in new XMLHttpRequest();
            } catch (err) {
              module.exports = false;
            }
          }, {} ],
          23: [ function(_dereq_, module, exports) {
            var indexOf = [].indexOf;
            module.exports = function(arr, obj) {
              if (indexOf) return arr.indexOf(obj);
              for (var i = 0; i < arr.length; ++i) if (arr[i] === obj) return i;
              return -1;
            };
          }, {} ],
          24: [ function(_dereq_, module, exports) {
            module.exports = Array.isArray || function(arr) {
              return "[object Array]" == Object.prototype.toString.call(arr);
            };
          }, {} ],
          25: [ function(_dereq_, module, exports) {
            var s = 1e3;
            var m = 60 * s;
            var h = 60 * m;
            var d = 24 * h;
            var y = 365.25 * d;
            module.exports = function(val, options) {
              options = options || {};
              if ("string" == typeof val) return parse(val);
              return options["long"] ? _long(val) : _short(val);
            };
            function parse(str) {
              str = "" + str;
              if (str.length > 1e4) return;
              var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
              if (!match) return;
              var n = parseFloat(match[1]);
              var type = (match[2] || "ms").toLowerCase();
              switch (type) {
               case "years":
               case "year":
               case "yrs":
               case "yr":
               case "y":
                return n * y;

               case "days":
               case "day":
               case "d":
                return n * d;

               case "hours":
               case "hour":
               case "hrs":
               case "hr":
               case "h":
                return n * h;

               case "minutes":
               case "minute":
               case "mins":
               case "min":
               case "m":
                return n * m;

               case "seconds":
               case "second":
               case "secs":
               case "sec":
               case "s":
                return n * s;

               case "milliseconds":
               case "millisecond":
               case "msecs":
               case "msec":
               case "ms":
                return n;
              }
            }
            function _short(ms) {
              if (ms >= d) return Math.round(ms / d) + "d";
              if (ms >= h) return Math.round(ms / h) + "h";
              if (ms >= m) return Math.round(ms / m) + "m";
              if (ms >= s) return Math.round(ms / s) + "s";
              return ms + "ms";
            }
            function _long(ms) {
              return plural(ms, d, "day") || plural(ms, h, "hour") || plural(ms, m, "minute") || plural(ms, s, "second") || ms + " ms";
            }
            function plural(ms, n, name) {
              if (ms < n) return;
              if (ms < 1.5 * n) return Math.floor(ms / n) + " " + name;
              return Math.ceil(ms / n) + " " + name + "s";
            }
          }, {} ],
          26: [ function(_dereq_, module, exports) {
            (function(global) {
              var rvalidchars = /^[\],:{}\s]*$/;
              var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
              var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
              var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
              var rtrimLeft = /^\s+/;
              var rtrimRight = /\s+$/;
              module.exports = function parsejson(data) {
                if ("string" != typeof data || !data) return null;
                data = data.replace(rtrimLeft, "").replace(rtrimRight, "");
                if (global.JSON && JSON.parse) return JSON.parse(data);
                if (rvalidchars.test(data.replace(rvalidescape, "@").replace(rvalidtokens, "]").replace(rvalidbraces, ""))) return new Function("return " + data)();
              };
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {} ],
          27: [ function(_dereq_, module, exports) {
            exports.encode = function(obj) {
              var str = "";
              for (var i in obj) if (obj.hasOwnProperty(i)) {
                str.length && (str += "&");
                str += encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]);
              }
              return str;
            };
            exports.decode = function(qs) {
              var qry = {};
              var pairs = qs.split("&");
              for (var i = 0, l = pairs.length; i < l; i++) {
                var pair = pairs[i].split("=");
                qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
              }
              return qry;
            };
          }, {} ],
          28: [ function(_dereq_, module, exports) {
            var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
            var parts = [ "source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor" ];
            module.exports = function parseuri(str) {
              var src = str, b = str.indexOf("["), e = str.indexOf("]");
              -1 != b && -1 != e && (str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ";") + str.substring(e, str.length));
              var m = re.exec(str || ""), uri = {}, i = 14;
              while (i--) uri[parts[i]] = m[i] || "";
              if (-1 != b && -1 != e) {
                uri.source = src;
                uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ":");
                uri.authority = uri.authority.replace("[", "").replace("]", "").replace(/;/g, ":");
                uri.ipv6uri = true;
              }
              return uri;
            };
          }, {} ],
          29: [ function(_dereq_, module, exports) {
            (function(global) {
              (function(root) {
                var freeExports = "object" == typeof exports && exports;
                var freeModule = "object" == typeof module && module && module.exports == freeExports && module;
                var freeGlobal = "object" == typeof global && global;
                freeGlobal.global !== freeGlobal && freeGlobal.window !== freeGlobal || (root = freeGlobal);
                var stringFromCharCode = String.fromCharCode;
                function ucs2decode(string) {
                  var output = [];
                  var counter = 0;
                  var length = string.length;
                  var value;
                  var extra;
                  while (counter < length) {
                    value = string.charCodeAt(counter++);
                    if (value >= 55296 && value <= 56319 && counter < length) {
                      extra = string.charCodeAt(counter++);
                      if (56320 == (64512 & extra)) output.push(((1023 & value) << 10) + (1023 & extra) + 65536); else {
                        output.push(value);
                        counter--;
                      }
                    } else output.push(value);
                  }
                  return output;
                }
                function ucs2encode(array) {
                  var length = array.length;
                  var index = -1;
                  var value;
                  var output = "";
                  while (++index < length) {
                    value = array[index];
                    if (value > 65535) {
                      value -= 65536;
                      output += stringFromCharCode(value >>> 10 & 1023 | 55296);
                      value = 56320 | 1023 & value;
                    }
                    output += stringFromCharCode(value);
                  }
                  return output;
                }
                function checkScalarValue(codePoint) {
                  if (codePoint >= 55296 && codePoint <= 57343) throw Error("Lone surrogate U+" + codePoint.toString(16).toUpperCase() + " is not a scalar value");
                }
                function createByte(codePoint, shift) {
                  return stringFromCharCode(codePoint >> shift & 63 | 128);
                }
                function encodeCodePoint(codePoint) {
                  if (0 == (4294967168 & codePoint)) return stringFromCharCode(codePoint);
                  var symbol = "";
                  if (0 == (4294965248 & codePoint)) symbol = stringFromCharCode(codePoint >> 6 & 31 | 192); else if (0 == (4294901760 & codePoint)) {
                    checkScalarValue(codePoint);
                    symbol = stringFromCharCode(codePoint >> 12 & 15 | 224);
                    symbol += createByte(codePoint, 6);
                  } else if (0 == (4292870144 & codePoint)) {
                    symbol = stringFromCharCode(codePoint >> 18 & 7 | 240);
                    symbol += createByte(codePoint, 12);
                    symbol += createByte(codePoint, 6);
                  }
                  symbol += stringFromCharCode(63 & codePoint | 128);
                  return symbol;
                }
                function utf8encode(string) {
                  var codePoints = ucs2decode(string);
                  var length = codePoints.length;
                  var index = -1;
                  var codePoint;
                  var byteString = "";
                  while (++index < length) {
                    codePoint = codePoints[index];
                    byteString += encodeCodePoint(codePoint);
                  }
                  return byteString;
                }
                function readContinuationByte() {
                  if (byteIndex >= byteCount) throw Error("Invalid byte index");
                  var continuationByte = 255 & byteArray[byteIndex];
                  byteIndex++;
                  if (128 == (192 & continuationByte)) return 63 & continuationByte;
                  throw Error("Invalid continuation byte");
                }
                function decodeSymbol() {
                  var byte1;
                  var byte2;
                  var byte3;
                  var byte4;
                  var codePoint;
                  if (byteIndex > byteCount) throw Error("Invalid byte index");
                  if (byteIndex == byteCount) return false;
                  byte1 = 255 & byteArray[byteIndex];
                  byteIndex++;
                  if (0 == (128 & byte1)) return byte1;
                  if (192 == (224 & byte1)) {
                    var byte2 = readContinuationByte();
                    codePoint = (31 & byte1) << 6 | byte2;
                    if (codePoint >= 128) return codePoint;
                    throw Error("Invalid continuation byte");
                  }
                  if (224 == (240 & byte1)) {
                    byte2 = readContinuationByte();
                    byte3 = readContinuationByte();
                    codePoint = (15 & byte1) << 12 | byte2 << 6 | byte3;
                    if (codePoint >= 2048) {
                      checkScalarValue(codePoint);
                      return codePoint;
                    }
                    throw Error("Invalid continuation byte");
                  }
                  if (240 == (248 & byte1)) {
                    byte2 = readContinuationByte();
                    byte3 = readContinuationByte();
                    byte4 = readContinuationByte();
                    codePoint = (15 & byte1) << 18 | byte2 << 12 | byte3 << 6 | byte4;
                    if (codePoint >= 65536 && codePoint <= 1114111) return codePoint;
                  }
                  throw Error("Invalid UTF-8 detected");
                }
                var byteArray;
                var byteCount;
                var byteIndex;
                function utf8decode(byteString) {
                  byteArray = ucs2decode(byteString);
                  byteCount = byteArray.length;
                  byteIndex = 0;
                  var codePoints = [];
                  var tmp;
                  while (false !== (tmp = decodeSymbol())) codePoints.push(tmp);
                  return ucs2encode(codePoints);
                }
                var utf8 = {
                  version: "2.0.0",
                  encode: utf8encode,
                  decode: utf8decode
                };
                if ("function" == typeof define && "object" == typeof define.amd && define.amd) define(function() {
                  return utf8;
                }); else if (freeExports && !freeExports.nodeType) if (freeModule) freeModule.exports = utf8; else {
                  var object = {};
                  var hasOwnProperty = object.hasOwnProperty;
                  for (var key in utf8) hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
                } else root.utf8 = utf8;
              })(this);
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {} ],
          30: [ function(_dereq_, module, exports) {
            var alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(""), length = 64, map = {}, seed = 0, i = 0, prev;
            function encode(num) {
              var encoded = "";
              do {
                encoded = alphabet[num % length] + encoded;
                num = Math.floor(num / length);
              } while (num > 0);
              return encoded;
            }
            function decode(str) {
              var decoded = 0;
              for (i = 0; i < str.length; i++) decoded = decoded * length + map[str.charAt(i)];
              return decoded;
            }
            function yeast() {
              var now = encode(+new Date());
              if (now !== prev) return seed = 0, prev = now;
              return now + "." + encode(seed++);
            }
            for (;i < length; i++) map[alphabet[i]] = i;
            yeast.encode = encode;
            yeast.decode = decode;
            module.exports = yeast;
          }, {} ],
          31: [ function(_dereq_, module, exports) {
            var url = _dereq_("./url");
            var parser = _dereq_("socket.io-parser");
            var Manager = _dereq_("./manager");
            var debug = _dereq_("debug")("socket.io-client");
            module.exports = exports = lookup;
            var cache = exports.managers = {};
            function lookup(uri, opts) {
              if ("object" == typeof uri) {
                opts = uri;
                uri = void 0;
              }
              opts = opts || {};
              var parsed = url(uri);
              var source = parsed.source;
              var id = parsed.id;
              var path = parsed.path;
              var sameNamespace = cache[id] && path in cache[id].nsps;
              var newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
              var io;
              if (newConnection) {
                debug("ignoring socket cache for %s", source);
                io = Manager(source, opts);
              } else {
                if (!cache[id]) {
                  debug("new io instance for %s", source);
                  cache[id] = Manager(source, opts);
                }
                io = cache[id];
              }
              return io.socket(parsed.path);
            }
            exports.protocol = parser.protocol;
            exports.connect = lookup;
            exports.Manager = _dereq_("./manager");
            exports.Socket = _dereq_("./socket");
          }, {
            "./manager": 32,
            "./socket": 34,
            "./url": 35,
            debug: 39,
            "socket.io-parser": 47
          } ],
          32: [ function(_dereq_, module, exports) {
            var eio = _dereq_("engine.io-client");
            var Socket = _dereq_("./socket");
            var Emitter = _dereq_("component-emitter");
            var parser = _dereq_("socket.io-parser");
            var on = _dereq_("./on");
            var bind = _dereq_("component-bind");
            var debug = _dereq_("debug")("socket.io-client:manager");
            var indexOf = _dereq_("indexof");
            var Backoff = _dereq_("backo2");
            var has = Object.prototype.hasOwnProperty;
            module.exports = Manager;
            function Manager(uri, opts) {
              if (!(this instanceof Manager)) return new Manager(uri, opts);
              if (uri && "object" == typeof uri) {
                opts = uri;
                uri = void 0;
              }
              opts = opts || {};
              opts.path = opts.path || "/socket.io";
              this.nsps = {};
              this.subs = [];
              this.opts = opts;
              this.reconnection(false !== opts.reconnection);
              this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
              this.reconnectionDelay(opts.reconnectionDelay || 1e3);
              this.reconnectionDelayMax(opts.reconnectionDelayMax || 5e3);
              this.randomizationFactor(opts.randomizationFactor || .5);
              this.backoff = new Backoff({
                min: this.reconnectionDelay(),
                max: this.reconnectionDelayMax(),
                jitter: this.randomizationFactor()
              });
              this.timeout(null == opts.timeout ? 2e4 : opts.timeout);
              this.readyState = "closed";
              this.uri = uri;
              this.connecting = [];
              this.lastPing = null;
              this.encoding = false;
              this.packetBuffer = [];
              this.encoder = new parser.Encoder();
              this.decoder = new parser.Decoder();
              this.autoConnect = false !== opts.autoConnect;
              this.autoConnect && this.open();
            }
            Manager.prototype.emitAll = function() {
              this.emit.apply(this, arguments);
              for (var nsp in this.nsps) has.call(this.nsps, nsp) && this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
            };
            Manager.prototype.updateSocketIds = function() {
              for (var nsp in this.nsps) has.call(this.nsps, nsp) && (this.nsps[nsp].id = this.engine.id);
            };
            Emitter(Manager.prototype);
            Manager.prototype.reconnection = function(v) {
              if (!arguments.length) return this._reconnection;
              this._reconnection = !!v;
              return this;
            };
            Manager.prototype.reconnectionAttempts = function(v) {
              if (!arguments.length) return this._reconnectionAttempts;
              this._reconnectionAttempts = v;
              return this;
            };
            Manager.prototype.reconnectionDelay = function(v) {
              if (!arguments.length) return this._reconnectionDelay;
              this._reconnectionDelay = v;
              this.backoff && this.backoff.setMin(v);
              return this;
            };
            Manager.prototype.randomizationFactor = function(v) {
              if (!arguments.length) return this._randomizationFactor;
              this._randomizationFactor = v;
              this.backoff && this.backoff.setJitter(v);
              return this;
            };
            Manager.prototype.reconnectionDelayMax = function(v) {
              if (!arguments.length) return this._reconnectionDelayMax;
              this._reconnectionDelayMax = v;
              this.backoff && this.backoff.setMax(v);
              return this;
            };
            Manager.prototype.timeout = function(v) {
              if (!arguments.length) return this._timeout;
              this._timeout = v;
              return this;
            };
            Manager.prototype.maybeReconnectOnOpen = function() {
              !this.reconnecting && this._reconnection && 0 === this.backoff.attempts && this.reconnect();
            };
            Manager.prototype.open = Manager.prototype.connect = function(fn) {
              debug("readyState %s", this.readyState);
              if (~this.readyState.indexOf("open")) return this;
              debug("opening %s", this.uri);
              this.engine = eio(this.uri, this.opts);
              var socket = this.engine;
              var self = this;
              this.readyState = "opening";
              this.skipReconnect = false;
              var openSub = on(socket, "open", function() {
                self.onopen();
                fn && fn();
              });
              var errorSub = on(socket, "error", function(data) {
                debug("connect_error");
                self.cleanup();
                self.readyState = "closed";
                self.emitAll("connect_error", data);
                if (fn) {
                  var err = new Error("Connection error");
                  err.data = data;
                  fn(err);
                } else self.maybeReconnectOnOpen();
              });
              if (false !== this._timeout) {
                var timeout = this._timeout;
                debug("connect attempt will timeout after %d", timeout);
                var timer = setTimeout(function() {
                  debug("connect attempt timed out after %d", timeout);
                  openSub.destroy();
                  socket.close();
                  socket.emit("error", "timeout");
                  self.emitAll("connect_timeout", timeout);
                }, timeout);
                this.subs.push({
                  destroy: function destroy() {
                    clearTimeout(timer);
                  }
                });
              }
              this.subs.push(openSub);
              this.subs.push(errorSub);
              return this;
            };
            Manager.prototype.onopen = function() {
              debug("open");
              this.cleanup();
              this.readyState = "open";
              this.emit("open");
              var socket = this.engine;
              this.subs.push(on(socket, "data", bind(this, "ondata")));
              this.subs.push(on(socket, "ping", bind(this, "onping")));
              this.subs.push(on(socket, "pong", bind(this, "onpong")));
              this.subs.push(on(socket, "error", bind(this, "onerror")));
              this.subs.push(on(socket, "close", bind(this, "onclose")));
              this.subs.push(on(this.decoder, "decoded", bind(this, "ondecoded")));
            };
            Manager.prototype.onping = function() {
              this.lastPing = new Date();
              this.emitAll("ping");
            };
            Manager.prototype.onpong = function() {
              this.emitAll("pong", new Date() - this.lastPing);
            };
            Manager.prototype.ondata = function(data) {
              this.decoder.add(data);
            };
            Manager.prototype.ondecoded = function(packet) {
              this.emit("packet", packet);
            };
            Manager.prototype.onerror = function(err) {
              debug("error", err);
              this.emitAll("error", err);
            };
            Manager.prototype.socket = function(nsp) {
              var socket = this.nsps[nsp];
              if (!socket) {
                socket = new Socket(this, nsp);
                this.nsps[nsp] = socket;
                var self = this;
                socket.on("connecting", onConnecting);
                socket.on("connect", function() {
                  socket.id = self.engine.id;
                });
                this.autoConnect && onConnecting();
              }
              function onConnecting() {
                ~indexOf(self.connecting, socket) || self.connecting.push(socket);
              }
              return socket;
            };
            Manager.prototype.destroy = function(socket) {
              var index = indexOf(this.connecting, socket);
              ~index && this.connecting.splice(index, 1);
              if (this.connecting.length) return;
              this.close();
            };
            Manager.prototype.packet = function(packet) {
              debug("writing packet %j", packet);
              var self = this;
              if (self.encoding) self.packetBuffer.push(packet); else {
                self.encoding = true;
                this.encoder.encode(packet, function(encodedPackets) {
                  for (var i = 0; i < encodedPackets.length; i++) self.engine.write(encodedPackets[i], packet.options);
                  self.encoding = false;
                  self.processPacketQueue();
                });
              }
            };
            Manager.prototype.processPacketQueue = function() {
              if (this.packetBuffer.length > 0 && !this.encoding) {
                var pack = this.packetBuffer.shift();
                this.packet(pack);
              }
            };
            Manager.prototype.cleanup = function() {
              debug("cleanup");
              var sub;
              while (sub = this.subs.shift()) sub.destroy();
              this.packetBuffer = [];
              this.encoding = false;
              this.lastPing = null;
              this.decoder.destroy();
            };
            Manager.prototype.close = Manager.prototype.disconnect = function() {
              debug("disconnect");
              this.skipReconnect = true;
              this.reconnecting = false;
              "opening" == this.readyState && this.cleanup();
              this.backoff.reset();
              this.readyState = "closed";
              this.engine && this.engine.close();
            };
            Manager.prototype.onclose = function(reason) {
              debug("onclose");
              this.cleanup();
              this.backoff.reset();
              this.readyState = "closed";
              this.emit("close", reason);
              this._reconnection && !this.skipReconnect && this.reconnect();
            };
            Manager.prototype.reconnect = function() {
              if (this.reconnecting || this.skipReconnect) return this;
              var self = this;
              if (this.backoff.attempts >= this._reconnectionAttempts) {
                debug("reconnect failed");
                this.backoff.reset();
                this.emitAll("reconnect_failed");
                this.reconnecting = false;
              } else {
                var delay = this.backoff.duration();
                debug("will wait %dms before reconnect attempt", delay);
                this.reconnecting = true;
                var timer = setTimeout(function() {
                  if (self.skipReconnect) return;
                  debug("attempting reconnect");
                  self.emitAll("reconnect_attempt", self.backoff.attempts);
                  self.emitAll("reconnecting", self.backoff.attempts);
                  if (self.skipReconnect) return;
                  self.open(function(err) {
                    if (err) {
                      debug("reconnect attempt error");
                      self.reconnecting = false;
                      self.reconnect();
                      self.emitAll("reconnect_error", err.data);
                    } else {
                      debug("reconnect success");
                      self.onreconnect();
                    }
                  });
                }, delay);
                this.subs.push({
                  destroy: function destroy() {
                    clearTimeout(timer);
                  }
                });
              }
            };
            Manager.prototype.onreconnect = function() {
              var attempt = this.backoff.attempts;
              this.reconnecting = false;
              this.backoff.reset();
              this.updateSocketIds();
              this.emitAll("reconnect", attempt);
            };
          }, {
            "./on": 33,
            "./socket": 34,
            backo2: 36,
            "component-bind": 37,
            "component-emitter": 38,
            debug: 39,
            "engine.io-client": 1,
            indexof: 42,
            "socket.io-parser": 47
          } ],
          33: [ function(_dereq_, module, exports) {
            module.exports = on;
            function on(obj, ev, fn) {
              obj.on(ev, fn);
              return {
                destroy: function destroy() {
                  obj.removeListener(ev, fn);
                }
              };
            }
          }, {} ],
          34: [ function(_dereq_, module, exports) {
            var parser = _dereq_("socket.io-parser");
            var Emitter = _dereq_("component-emitter");
            var toArray = _dereq_("to-array");
            var on = _dereq_("./on");
            var bind = _dereq_("component-bind");
            var debug = _dereq_("debug")("socket.io-client:socket");
            var hasBin = _dereq_("has-binary");
            module.exports = exports = Socket;
            var events = {
              connect: 1,
              connect_error: 1,
              connect_timeout: 1,
              connecting: 1,
              disconnect: 1,
              error: 1,
              reconnect: 1,
              reconnect_attempt: 1,
              reconnect_failed: 1,
              reconnect_error: 1,
              reconnecting: 1,
              ping: 1,
              pong: 1
            };
            var emit = Emitter.prototype.emit;
            function Socket(io, nsp) {
              this.io = io;
              this.nsp = nsp;
              this.json = this;
              this.ids = 0;
              this.acks = {};
              this.receiveBuffer = [];
              this.sendBuffer = [];
              this.connected = false;
              this.disconnected = true;
              this.io.autoConnect && this.open();
            }
            Emitter(Socket.prototype);
            Socket.prototype.subEvents = function() {
              if (this.subs) return;
              var io = this.io;
              this.subs = [ on(io, "open", bind(this, "onopen")), on(io, "packet", bind(this, "onpacket")), on(io, "close", bind(this, "onclose")) ];
            };
            Socket.prototype.open = Socket.prototype.connect = function() {
              if (this.connected) return this;
              this.subEvents();
              this.io.open();
              "open" == this.io.readyState && this.onopen();
              this.emit("connecting");
              return this;
            };
            Socket.prototype.send = function() {
              var args = toArray(arguments);
              args.unshift("message");
              this.emit.apply(this, args);
              return this;
            };
            Socket.prototype.emit = function(ev) {
              if (events.hasOwnProperty(ev)) {
                emit.apply(this, arguments);
                return this;
              }
              var args = toArray(arguments);
              var parserType = parser.EVENT;
              hasBin(args) && (parserType = parser.BINARY_EVENT);
              var packet = {
                type: parserType,
                data: args
              };
              packet.options = {};
              packet.options.compress = !this.flags || false !== this.flags.compress;
              if ("function" == typeof args[args.length - 1]) {
                debug("emitting packet with ack id %d", this.ids);
                this.acks[this.ids] = args.pop();
                packet.id = this.ids++;
              }
              this.connected ? this.packet(packet) : this.sendBuffer.push(packet);
              delete this.flags;
              return this;
            };
            Socket.prototype.packet = function(packet) {
              packet.nsp = this.nsp;
              this.io.packet(packet);
            };
            Socket.prototype.onopen = function() {
              debug("transport is open - connecting");
              "/" != this.nsp && this.packet({
                type: parser.CONNECT
              });
            };
            Socket.prototype.onclose = function(reason) {
              debug("close (%s)", reason);
              this.connected = false;
              this.disconnected = true;
              delete this.id;
              this.emit("disconnect", reason);
            };
            Socket.prototype.onpacket = function(packet) {
              if (packet.nsp != this.nsp) return;
              switch (packet.type) {
               case parser.CONNECT:
                this.onconnect();
                break;

               case parser.EVENT:
               case parser.BINARY_EVENT:
                this.onevent(packet);
                break;

               case parser.ACK:
               case parser.BINARY_ACK:
                this.onack(packet);
                break;

               case parser.DISCONNECT:
                this.ondisconnect();
                break;

               case parser.ERROR:
                this.emit("error", packet.data);
              }
            };
            Socket.prototype.onevent = function(packet) {
              var args = packet.data || [];
              debug("emitting event %j", args);
              if (null != packet.id) {
                debug("attaching ack callback to event");
                args.push(this.ack(packet.id));
              }
              this.connected ? emit.apply(this, args) : this.receiveBuffer.push(args);
            };
            Socket.prototype.ack = function(id) {
              var self = this;
              var sent = false;
              return function() {
                if (sent) return;
                sent = true;
                var args = toArray(arguments);
                debug("sending ack %j", args);
                var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;
                self.packet({
                  type: type,
                  id: id,
                  data: args
                });
              };
            };
            Socket.prototype.onack = function(packet) {
              var ack = this.acks[packet.id];
              if ("function" == typeof ack) {
                debug("calling ack %s with %j", packet.id, packet.data);
                ack.apply(this, packet.data);
                delete this.acks[packet.id];
              } else debug("bad ack %s", packet.id);
            };
            Socket.prototype.onconnect = function() {
              this.connected = true;
              this.disconnected = false;
              this.emit("connect");
              this.emitBuffered();
            };
            Socket.prototype.emitBuffered = function() {
              var i;
              for (i = 0; i < this.receiveBuffer.length; i++) emit.apply(this, this.receiveBuffer[i]);
              this.receiveBuffer = [];
              for (i = 0; i < this.sendBuffer.length; i++) this.packet(this.sendBuffer[i]);
              this.sendBuffer = [];
            };
            Socket.prototype.ondisconnect = function() {
              debug("server disconnect (%s)", this.nsp);
              this.destroy();
              this.onclose("io server disconnect");
            };
            Socket.prototype.destroy = function() {
              if (this.subs) {
                for (var i = 0; i < this.subs.length; i++) this.subs[i].destroy();
                this.subs = null;
              }
              this.io.destroy(this);
            };
            Socket.prototype.close = Socket.prototype.disconnect = function() {
              if (this.connected) {
                debug("performing disconnect (%s)", this.nsp);
                this.packet({
                  type: parser.DISCONNECT
                });
              }
              this.destroy();
              this.connected && this.onclose("io client disconnect");
              return this;
            };
            Socket.prototype.compress = function(compress) {
              this.flags = this.flags || {};
              this.flags.compress = compress;
              return this;
            };
          }, {
            "./on": 33,
            "component-bind": 37,
            "component-emitter": 38,
            debug: 39,
            "has-binary": 41,
            "socket.io-parser": 47,
            "to-array": 51
          } ],
          35: [ function(_dereq_, module, exports) {
            (function(global) {
              var parseuri = _dereq_("parseuri");
              var debug = _dereq_("debug")("socket.io-client:url");
              module.exports = url;
              function url(uri, loc) {
                var obj = uri;
                var loc = loc || global.location;
                null == uri && (uri = loc.protocol + "//" + loc.host);
                if ("string" == typeof uri) {
                  "/" == uri.charAt(0) && (uri = "/" == uri.charAt(1) ? loc.protocol + uri : loc.host + uri);
                  if (!/^(https?|wss?):\/\//.test(uri)) {
                    debug("protocol-less url %s", uri);
                    uri = "undefined" != typeof loc ? loc.protocol + "//" + uri : "https://" + uri;
                  }
                  debug("parse %s", uri);
                  obj = parseuri(uri);
                }
                obj.port || (/^(http|ws)$/.test(obj.protocol) ? obj.port = "80" : /^(http|ws)s$/.test(obj.protocol) && (obj.port = "443"));
                obj.path = obj.path || "/";
                var ipv6 = -1 !== obj.host.indexOf(":");
                var host = ipv6 ? "[" + obj.host + "]" : obj.host;
                obj.id = obj.protocol + "://" + host + ":" + obj.port;
                obj.href = obj.protocol + "://" + host + (loc && loc.port == obj.port ? "" : ":" + obj.port);
                return obj;
              }
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {
            debug: 39,
            parseuri: 45
          } ],
          36: [ function(_dereq_, module, exports) {
            module.exports = Backoff;
            function Backoff(opts) {
              opts = opts || {};
              this.ms = opts.min || 100;
              this.max = opts.max || 1e4;
              this.factor = opts.factor || 2;
              this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
              this.attempts = 0;
            }
            Backoff.prototype.duration = function() {
              var ms = this.ms * Math.pow(this.factor, this.attempts++);
              if (this.jitter) {
                var rand = Math.random();
                var deviation = Math.floor(rand * this.jitter * ms);
                ms = 0 == (1 & Math.floor(10 * rand)) ? ms - deviation : ms + deviation;
              }
              return 0 | Math.min(ms, this.max);
            };
            Backoff.prototype.reset = function() {
              this.attempts = 0;
            };
            Backoff.prototype.setMin = function(min) {
              this.ms = min;
            };
            Backoff.prototype.setMax = function(max) {
              this.max = max;
            };
            Backoff.prototype.setJitter = function(jitter) {
              this.jitter = jitter;
            };
          }, {} ],
          37: [ function(_dereq_, module, exports) {
            var slice = [].slice;
            module.exports = function(obj, fn) {
              "string" == typeof fn && (fn = obj[fn]);
              if ("function" != typeof fn) throw new Error("bind() requires a function");
              var args = slice.call(arguments, 2);
              return function() {
                return fn.apply(obj, args.concat(slice.call(arguments)));
              };
            };
          }, {} ],
          38: [ function(_dereq_, module, exports) {
            module.exports = Emitter;
            function Emitter(obj) {
              if (obj) return mixin(obj);
            }
            function mixin(obj) {
              for (var key in Emitter.prototype) obj[key] = Emitter.prototype[key];
              return obj;
            }
            Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
              this._callbacks = this._callbacks || {};
              (this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);
              return this;
            };
            Emitter.prototype.once = function(event, fn) {
              function on() {
                this.off(event, on);
                fn.apply(this, arguments);
              }
              on.fn = fn;
              this.on(event, on);
              return this;
            };
            Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
              this._callbacks = this._callbacks || {};
              if (0 == arguments.length) {
                this._callbacks = {};
                return this;
              }
              var callbacks = this._callbacks["$" + event];
              if (!callbacks) return this;
              if (1 == arguments.length) {
                delete this._callbacks["$" + event];
                return this;
              }
              var cb;
              for (var i = 0; i < callbacks.length; i++) {
                cb = callbacks[i];
                if (cb === fn || cb.fn === fn) {
                  callbacks.splice(i, 1);
                  break;
                }
              }
              return this;
            };
            Emitter.prototype.emit = function(event) {
              this._callbacks = this._callbacks || {};
              var args = [].slice.call(arguments, 1), callbacks = this._callbacks["$" + event];
              if (callbacks) {
                callbacks = callbacks.slice(0);
                for (var i = 0, len = callbacks.length; i < len; ++i) callbacks[i].apply(this, args);
              }
              return this;
            };
            Emitter.prototype.listeners = function(event) {
              this._callbacks = this._callbacks || {};
              return this._callbacks["$" + event] || [];
            };
            Emitter.prototype.hasListeners = function(event) {
              return !!this.listeners(event).length;
            };
          }, {} ],
          39: [ function(_dereq_, module, exports) {
            arguments[4][17][0].apply(exports, arguments);
          }, {
            "./debug": 40,
            dup: 17
          } ],
          40: [ function(_dereq_, module, exports) {
            arguments[4][18][0].apply(exports, arguments);
          }, {
            dup: 18,
            ms: 44
          } ],
          41: [ function(_dereq_, module, exports) {
            (function(global) {
              var isArray = _dereq_("isarray");
              module.exports = hasBinary;
              function hasBinary(data) {
                function _hasBinary(obj) {
                  if (!obj) return false;
                  if (global.Buffer && global.Buffer.isBuffer && global.Buffer.isBuffer(obj) || global.ArrayBuffer && obj instanceof ArrayBuffer || global.Blob && obj instanceof Blob || global.File && obj instanceof File) return true;
                  if (isArray(obj)) {
                    for (var i = 0; i < obj.length; i++) if (_hasBinary(obj[i])) return true;
                  } else if (obj && "object" == typeof obj) {
                    obj.toJSON && "function" == typeof obj.toJSON && (obj = obj.toJSON());
                    for (var key in obj) if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) return true;
                  }
                  return false;
                }
                return _hasBinary(data);
              }
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {
            isarray: 43
          } ],
          42: [ function(_dereq_, module, exports) {
            arguments[4][23][0].apply(exports, arguments);
          }, {
            dup: 23
          } ],
          43: [ function(_dereq_, module, exports) {
            arguments[4][24][0].apply(exports, arguments);
          }, {
            dup: 24
          } ],
          44: [ function(_dereq_, module, exports) {
            arguments[4][25][0].apply(exports, arguments);
          }, {
            dup: 25
          } ],
          45: [ function(_dereq_, module, exports) {
            arguments[4][28][0].apply(exports, arguments);
          }, {
            dup: 28
          } ],
          46: [ function(_dereq_, module, exports) {
            (function(global) {
              var isArray = _dereq_("isarray");
              var isBuf = _dereq_("./is-buffer");
              exports.deconstructPacket = function(packet) {
                var buffers = [];
                var packetData = packet.data;
                function _deconstructPacket(data) {
                  if (!data) return data;
                  if (isBuf(data)) {
                    var placeholder = {
                      _placeholder: true,
                      num: buffers.length
                    };
                    buffers.push(data);
                    return placeholder;
                  }
                  if (isArray(data)) {
                    var newData = new Array(data.length);
                    for (var i = 0; i < data.length; i++) newData[i] = _deconstructPacket(data[i]);
                    return newData;
                  }
                  if ("object" == typeof data && !(data instanceof Date)) {
                    var newData = {};
                    for (var key in data) newData[key] = _deconstructPacket(data[key]);
                    return newData;
                  }
                  return data;
                }
                var pack = packet;
                pack.data = _deconstructPacket(packetData);
                pack.attachments = buffers.length;
                return {
                  packet: pack,
                  buffers: buffers
                };
              };
              exports.reconstructPacket = function(packet, buffers) {
                var curPlaceHolder = 0;
                function _reconstructPacket(data) {
                  if (data && data._placeholder) {
                    var buf = buffers[data.num];
                    return buf;
                  }
                  if (isArray(data)) {
                    for (var i = 0; i < data.length; i++) data[i] = _reconstructPacket(data[i]);
                    return data;
                  }
                  if (data && "object" == typeof data) {
                    for (var key in data) data[key] = _reconstructPacket(data[key]);
                    return data;
                  }
                  return data;
                }
                packet.data = _reconstructPacket(packet.data);
                packet.attachments = void 0;
                return packet;
              };
              exports.removeBlobs = function(data, callback) {
                function _removeBlobs(obj, curKey, containingObject) {
                  if (!obj) return obj;
                  if (global.Blob && obj instanceof Blob || global.File && obj instanceof File) {
                    pendingBlobs++;
                    var fileReader = new FileReader();
                    fileReader.onload = function() {
                      containingObject ? containingObject[curKey] = this.result : bloblessData = this.result;
                      --pendingBlobs || callback(bloblessData);
                    };
                    fileReader.readAsArrayBuffer(obj);
                  } else if (isArray(obj)) for (var i = 0; i < obj.length; i++) _removeBlobs(obj[i], i, obj); else if (obj && "object" == typeof obj && !isBuf(obj)) for (var key in obj) _removeBlobs(obj[key], key, obj);
                }
                var pendingBlobs = 0;
                var bloblessData = data;
                _removeBlobs(bloblessData);
                pendingBlobs || callback(bloblessData);
              };
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {
            "./is-buffer": 48,
            isarray: 43
          } ],
          47: [ function(_dereq_, module, exports) {
            var debug = _dereq_("debug")("socket.io-parser");
            var json = _dereq_("json3");
            var isArray = _dereq_("isarray");
            var Emitter = _dereq_("component-emitter");
            var binary = _dereq_("./binary");
            var isBuf = _dereq_("./is-buffer");
            exports.protocol = 4;
            exports.types = [ "CONNECT", "DISCONNECT", "EVENT", "BINARY_EVENT", "ACK", "BINARY_ACK", "ERROR" ];
            exports.CONNECT = 0;
            exports.DISCONNECT = 1;
            exports.EVENT = 2;
            exports.ACK = 3;
            exports.ERROR = 4;
            exports.BINARY_EVENT = 5;
            exports.BINARY_ACK = 6;
            exports.Encoder = Encoder;
            exports.Decoder = Decoder;
            function Encoder() {}
            Encoder.prototype.encode = function(obj, callback) {
              debug("encoding packet %j", obj);
              if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) encodeAsBinary(obj, callback); else {
                var encoding = encodeAsString(obj);
                callback([ encoding ]);
              }
            };
            function encodeAsString(obj) {
              var str = "";
              var nsp = false;
              str += obj.type;
              if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
                str += obj.attachments;
                str += "-";
              }
              if (obj.nsp && "/" != obj.nsp) {
                nsp = true;
                str += obj.nsp;
              }
              if (null != obj.id) {
                if (nsp) {
                  str += ",";
                  nsp = false;
                }
                str += obj.id;
              }
              if (null != obj.data) {
                nsp && (str += ",");
                str += json.stringify(obj.data);
              }
              debug("encoded %j as %s", obj, str);
              return str;
            }
            function encodeAsBinary(obj, callback) {
              function writeEncoding(bloblessData) {
                var deconstruction = binary.deconstructPacket(bloblessData);
                var pack = encodeAsString(deconstruction.packet);
                var buffers = deconstruction.buffers;
                buffers.unshift(pack);
                callback(buffers);
              }
              binary.removeBlobs(obj, writeEncoding);
            }
            function Decoder() {
              this.reconstructor = null;
            }
            Emitter(Decoder.prototype);
            Decoder.prototype.add = function(obj) {
              var packet;
              if ("string" == typeof obj) {
                packet = decodeString(obj);
                if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) {
                  this.reconstructor = new BinaryReconstructor(packet);
                  0 === this.reconstructor.reconPack.attachments && this.emit("decoded", packet);
                } else this.emit("decoded", packet);
              } else {
                if (!isBuf(obj) && !obj.base64) throw new Error("Unknown type: " + obj);
                if (!this.reconstructor) throw new Error("got binary data when not reconstructing a packet");
                packet = this.reconstructor.takeBinaryData(obj);
                if (packet) {
                  this.reconstructor = null;
                  this.emit("decoded", packet);
                }
              }
            };
            function decodeString(str) {
              var p = {};
              var i = 0;
              p.type = Number(str.charAt(0));
              if (null == exports.types[p.type]) return error();
              if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
                var buf = "";
                while ("-" != str.charAt(++i)) {
                  buf += str.charAt(i);
                  if (i == str.length) break;
                }
                if (buf != Number(buf) || "-" != str.charAt(i)) throw new Error("Illegal attachments");
                p.attachments = Number(buf);
              }
              if ("/" == str.charAt(i + 1)) {
                p.nsp = "";
                while (++i) {
                  var c = str.charAt(i);
                  if ("," == c) break;
                  p.nsp += c;
                  if (i == str.length) break;
                }
              } else p.nsp = "/";
              var next = str.charAt(i + 1);
              if ("" !== next && Number(next) == next) {
                p.id = "";
                while (++i) {
                  var c = str.charAt(i);
                  if (null == c || Number(c) != c) {
                    --i;
                    break;
                  }
                  p.id += str.charAt(i);
                  if (i == str.length) break;
                }
                p.id = Number(p.id);
              }
              if (str.charAt(++i)) try {
                p.data = json.parse(str.substr(i));
              } catch (e) {
                return error();
              }
              debug("decoded %s as %j", str, p);
              return p;
            }
            Decoder.prototype.destroy = function() {
              this.reconstructor && this.reconstructor.finishedReconstruction();
            };
            function BinaryReconstructor(packet) {
              this.reconPack = packet;
              this.buffers = [];
            }
            BinaryReconstructor.prototype.takeBinaryData = function(binData) {
              this.buffers.push(binData);
              if (this.buffers.length == this.reconPack.attachments) {
                var packet = binary.reconstructPacket(this.reconPack, this.buffers);
                this.finishedReconstruction();
                return packet;
              }
              return null;
            };
            BinaryReconstructor.prototype.finishedReconstruction = function() {
              this.reconPack = null;
              this.buffers = [];
            };
            function error(data) {
              return {
                type: exports.ERROR,
                data: "parser error"
              };
            }
          }, {
            "./binary": 46,
            "./is-buffer": 48,
            "component-emitter": 49,
            debug: 39,
            isarray: 43,
            json3: 50
          } ],
          48: [ function(_dereq_, module, exports) {
            (function(global) {
              module.exports = isBuf;
              function isBuf(obj) {
                return global.Buffer && global.Buffer.isBuffer(obj) || global.ArrayBuffer && obj instanceof ArrayBuffer;
              }
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {} ],
          49: [ function(_dereq_, module, exports) {
            arguments[4][15][0].apply(exports, arguments);
          }, {
            dup: 15
          } ],
          50: [ function(_dereq_, module, exports) {
            (function(global) {
              (function() {
                var isLoader = "function" === typeof define && define.amd;
                var objectTypes = {
                  function: true,
                  object: true
                };
                var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;
                var root = objectTypes[typeof window] && window || this, freeGlobal = freeExports && objectTypes[typeof module] && module && !module.nodeType && "object" == typeof global && global;
                !freeGlobal || freeGlobal["global"] !== freeGlobal && freeGlobal["window"] !== freeGlobal && freeGlobal["self"] !== freeGlobal || (root = freeGlobal);
                function runInContext(context, exports) {
                  context || (context = root["Object"]());
                  exports || (exports = root["Object"]());
                  var Number = context["Number"] || root["Number"], String = context["String"] || root["String"], Object = context["Object"] || root["Object"], Date = context["Date"] || root["Date"], SyntaxError = context["SyntaxError"] || root["SyntaxError"], TypeError = context["TypeError"] || root["TypeError"], Math = context["Math"] || root["Math"], nativeJSON = context["JSON"] || root["JSON"];
                  if ("object" == typeof nativeJSON && nativeJSON) {
                    exports.stringify = nativeJSON.stringify;
                    exports.parse = nativeJSON.parse;
                  }
                  var objectProto = Object.prototype, getClass = objectProto.toString, _isProperty, _forEach, undef;
                  var isExtended = new Date(-0xc782b5b800cec);
                  try {
                    isExtended = -109252 == isExtended.getUTCFullYear() && 0 === isExtended.getUTCMonth() && 1 === isExtended.getUTCDate() && 10 == isExtended.getUTCHours() && 37 == isExtended.getUTCMinutes() && 6 == isExtended.getUTCSeconds() && 708 == isExtended.getUTCMilliseconds();
                  } catch (exception) {}
                  function has(name) {
                    if (has[name] !== undef) return has[name];
                    var isSupported;
                    if ("bug-string-char-index" == name) isSupported = "a" != "a"[0]; else if ("json" == name) isSupported = has("json-stringify") && has("json-parse"); else {
                      var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
                      if ("json-stringify" == name) {
                        var stringify = exports.stringify, stringifySupported = "function" == typeof stringify && isExtended;
                        if (stringifySupported) {
                          (value = function value() {
                            return 1;
                          }).toJSON = value;
                          try {
                            stringifySupported = "0" === stringify(0) && "0" === stringify(new Number()) && '""' == stringify(new String()) && stringify(getClass) === undef && stringify(undef) === undef && stringify() === undef && "1" === stringify(value) && "[1]" == stringify([ value ]) && "[null]" == stringify([ undef ]) && "null" == stringify(null) && "[null,null,null]" == stringify([ undef, getClass, null ]) && stringify({
                              a: [ value, true, false, null, "\0\b\n\f\r\t" ]
                            }) == serialized && "1" === stringify(null, value) && "[\n 1,\n 2\n]" == stringify([ 1, 2 ], null, 1) && '"-271821-04-20T00:00:00.000Z"' == stringify(new Date(-864e13)) && '"+275760-09-13T00:00:00.000Z"' == stringify(new Date(864e13)) && '"-000001-01-01T00:00:00.000Z"' == stringify(new Date(-621987552e5)) && '"1969-12-31T23:59:59.999Z"' == stringify(new Date(-1));
                          } catch (exception) {
                            stringifySupported = false;
                          }
                        }
                        isSupported = stringifySupported;
                      }
                      if ("json-parse" == name) {
                        var parse = exports.parse;
                        if ("function" == typeof parse) try {
                          if (0 === parse("0") && !parse(false)) {
                            value = parse(serialized);
                            var parseSupported = 5 == value["a"].length && 1 === value["a"][0];
                            if (parseSupported) {
                              try {
                                parseSupported = !parse('"\t"');
                              } catch (exception) {}
                              if (parseSupported) try {
                                parseSupported = 1 !== parse("01");
                              } catch (exception) {}
                              if (parseSupported) try {
                                parseSupported = 1 !== parse("1.");
                              } catch (exception) {}
                            }
                          }
                        } catch (exception) {
                          parseSupported = false;
                        }
                        isSupported = parseSupported;
                      }
                    }
                    return has[name] = !!isSupported;
                  }
                  if (!has("json")) {
                    var functionClass = "[object Function]", dateClass = "[object Date]", numberClass = "[object Number]", stringClass = "[object String]", arrayClass = "[object Array]", booleanClass = "[object Boolean]";
                    var charIndexBuggy = has("bug-string-char-index");
                    if (!isExtended) {
                      var floor = Math.floor;
                      var Months = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334 ];
                      var getDay = function getDay(year, month) {
                        return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
                      };
                    }
                    (_isProperty = objectProto.hasOwnProperty) || (_isProperty = function isProperty(property) {
                      var members = {}, constructor;
                      if ((members.__proto__ = null, members.__proto__ = {
                        toString: 1
                      }, members).toString != getClass) _isProperty = function isProperty(property) {
                        var original = this.__proto__, result = property in (this.__proto__ = null, this);
                        this.__proto__ = original;
                        return result;
                      }; else {
                        constructor = members.constructor;
                        _isProperty = function isProperty(property) {
                          var parent = (this.constructor || constructor).prototype;
                          return property in this && !(property in parent && this[property] === parent[property]);
                        };
                      }
                      members = null;
                      return _isProperty.call(this, property);
                    });
                    _forEach = function forEach(object, callback) {
                      var size = 0, Properties, members, property;
                      (Properties = function Properties() {
                        this.valueOf = 0;
                      }).prototype.valueOf = 0;
                      members = new Properties();
                      for (property in members) _isProperty.call(members, property) && size++;
                      Properties = members = null;
                      if (size) _forEach = 2 == size ? function forEach(object, callback) {
                        var members = {}, isFunction = getClass.call(object) == functionClass, property;
                        for (property in object) isFunction && "prototype" == property || _isProperty.call(members, property) || !(members[property] = 1) || !_isProperty.call(object, property) || callback(property);
                      } : function forEach(object, callback) {
                        var isFunction = getClass.call(object) == functionClass, property, isConstructor;
                        for (property in object) isFunction && "prototype" == property || !_isProperty.call(object, property) || (isConstructor = "constructor" === property) || callback(property);
                        (isConstructor || _isProperty.call(object, property = "constructor")) && callback(property);
                      }; else {
                        members = [ "valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor" ];
                        _forEach = function forEach(object, callback) {
                          var isFunction = getClass.call(object) == functionClass, property, length;
                          var hasProperty = !isFunction && "function" != typeof object.constructor && objectTypes[typeof object.hasOwnProperty] && object.hasOwnProperty || _isProperty;
                          for (property in object) isFunction && "prototype" == property || !hasProperty.call(object, property) || callback(property);
                          for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property)) ;
                        };
                      }
                      return _forEach(object, callback);
                    };
                    if (!has("json-stringify")) {
                      var Escapes = {
                        92: "\\\\",
                        34: '\\"',
                        8: "\\b",
                        12: "\\f",
                        10: "\\n",
                        13: "\\r",
                        9: "\\t"
                      };
                      var leadingZeroes = "000000";
                      var toPaddedString = function toPaddedString(width, value) {
                        return (leadingZeroes + (value || 0)).slice(-width);
                      };
                      var unicodePrefix = "\\u00";
                      var quote = function quote(value) {
                        var result = '"', index = 0, length = value.length, useCharIndex = !charIndexBuggy || length > 10;
                        var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
                        for (;index < length; index++) {
                          var charCode = value.charCodeAt(index);
                          switch (charCode) {
                           case 8:
                           case 9:
                           case 10:
                           case 12:
                           case 13:
                           case 34:
                           case 92:
                            result += Escapes[charCode];
                            break;

                           default:
                            if (charCode < 32) {
                              result += unicodePrefix + toPaddedString(2, charCode.toString(16));
                              break;
                            }
                            result += useCharIndex ? symbols[index] : value.charAt(index);
                          }
                        }
                        return result + '"';
                      };
                      var serialize = function serialize(property, object, callback, properties, whitespace, indentation, stack) {
                        var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
                        try {
                          value = object[property];
                        } catch (exception) {}
                        if ("object" == typeof value && value) {
                          className = getClass.call(value);
                          if (className != dateClass || _isProperty.call(value, "toJSON")) "function" == typeof value.toJSON && (className != numberClass && className != stringClass && className != arrayClass || _isProperty.call(value, "toJSON")) && (value = value.toJSON(property)); else if (value > -1 / 0 && value < 1 / 0) {
                            if (getDay) {
                              date = floor(value / 864e5);
                              for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++) ;
                              for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++) ;
                              date = 1 + date - getDay(year, month);
                              time = (value % 864e5 + 864e5) % 864e5;
                              hours = floor(time / 36e5) % 24;
                              minutes = floor(time / 6e4) % 60;
                              seconds = floor(time / 1e3) % 60;
                              milliseconds = time % 1e3;
                            } else {
                              year = value.getUTCFullYear();
                              month = value.getUTCMonth();
                              date = value.getUTCDate();
                              hours = value.getUTCHours();
                              minutes = value.getUTCMinutes();
                              seconds = value.getUTCSeconds();
                              milliseconds = value.getUTCMilliseconds();
                            }
                            value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) + "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) + "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) + "." + toPaddedString(3, milliseconds) + "Z";
                          } else value = null;
                        }
                        callback && (value = callback.call(object, property, value));
                        if (null === value) return "null";
                        className = getClass.call(value);
                        if (className == booleanClass) return "" + value;
                        if (className == numberClass) return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
                        if (className == stringClass) return quote("" + value);
                        if ("object" == typeof value) {
                          for (length = stack.length; length--; ) if (stack[length] === value) throw TypeError();
                          stack.push(value);
                          results = [];
                          prefix = indentation;
                          indentation += whitespace;
                          if (className == arrayClass) {
                            for (index = 0, length = value.length; index < length; index++) {
                              element = serialize(index, value, callback, properties, whitespace, indentation, stack);
                              results.push(element === undef ? "null" : element);
                            }
                            result = results.length ? whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : "[" + results.join(",") + "]" : "[]";
                          } else {
                            _forEach(properties || value, function(property) {
                              var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
                              element !== undef && results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
                            });
                            result = results.length ? whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : "{" + results.join(",") + "}" : "{}";
                          }
                          stack.pop();
                          return result;
                        }
                      };
                      exports.stringify = function(source, filter, width) {
                        var whitespace, callback, properties, className;
                        if (objectTypes[typeof filter] && filter) if ((className = getClass.call(filter)) == functionClass) callback = filter; else if (className == arrayClass) {
                          properties = {};
                          for (var index = 0, length = filter.length, value; index < length; value = filter[index++], 
                          (className = getClass.call(value), className == stringClass || className == numberClass) && (properties[value] = 1)) ;
                        }
                        if (width) if ((className = getClass.call(width)) == numberClass) {
                          if ((width -= width % 1) > 0) for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ") ;
                        } else className == stringClass && (whitespace = width.length <= 10 ? width : width.slice(0, 10));
                        return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
                      };
                    }
                    if (!has("json-parse")) {
                      var fromCharCode = String.fromCharCode;
                      var Unescapes = {
                        92: "\\",
                        34: '"',
                        47: "/",
                        98: "\b",
                        116: "\t",
                        110: "\n",
                        102: "\f",
                        114: "\r"
                      };
                      var Index, Source;
                      var abort = function abort() {
                        Index = Source = null;
                        throw SyntaxError();
                      };
                      var lex = function lex() {
                        var source = Source, length = source.length, value, begin, position, isSigned, charCode;
                        while (Index < length) {
                          charCode = source.charCodeAt(Index);
                          switch (charCode) {
                           case 9:
                           case 10:
                           case 13:
                           case 32:
                            Index++;
                            break;

                           case 123:
                           case 125:
                           case 91:
                           case 93:
                           case 58:
                           case 44:
                            value = charIndexBuggy ? source.charAt(Index) : source[Index];
                            Index++;
                            return value;

                           case 34:
                            for (value = "@", Index++; Index < length; ) {
                              charCode = source.charCodeAt(Index);
                              if (charCode < 32) abort(); else if (92 == charCode) {
                                charCode = source.charCodeAt(++Index);
                                switch (charCode) {
                                 case 92:
                                 case 34:
                                 case 47:
                                 case 98:
                                 case 116:
                                 case 110:
                                 case 102:
                                 case 114:
                                  value += Unescapes[charCode];
                                  Index++;
                                  break;

                                 case 117:
                                  begin = ++Index;
                                  for (position = Index + 4; Index < position; Index++) {
                                    charCode = source.charCodeAt(Index);
                                    charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70 || abort();
                                  }
                                  value += fromCharCode("0x" + source.slice(begin, Index));
                                  break;

                                 default:
                                  abort();
                                }
                              } else {
                                if (34 == charCode) break;
                                charCode = source.charCodeAt(Index);
                                begin = Index;
                                while (charCode >= 32 && 92 != charCode && 34 != charCode) charCode = source.charCodeAt(++Index);
                                value += source.slice(begin, Index);
                              }
                            }
                            if (34 == source.charCodeAt(Index)) {
                              Index++;
                              return value;
                            }
                            abort();

                           default:
                            begin = Index;
                            if (45 == charCode) {
                              isSigned = true;
                              charCode = source.charCodeAt(++Index);
                            }
                            if (charCode >= 48 && charCode <= 57) {
                              48 == charCode && (charCode = source.charCodeAt(Index + 1), charCode >= 48 && charCode <= 57) && abort();
                              isSigned = false;
                              for (;Index < length && (charCode = source.charCodeAt(Index), charCode >= 48 && charCode <= 57); Index++) ;
                              if (46 == source.charCodeAt(Index)) {
                                position = ++Index;
                                for (;position < length && (charCode = source.charCodeAt(position), charCode >= 48 && charCode <= 57); position++) ;
                                position == Index && abort();
                                Index = position;
                              }
                              charCode = source.charCodeAt(Index);
                              if (101 == charCode || 69 == charCode) {
                                charCode = source.charCodeAt(++Index);
                                43 != charCode && 45 != charCode || Index++;
                                for (position = Index; position < length && (charCode = source.charCodeAt(position), 
                                charCode >= 48 && charCode <= 57); position++) ;
                                position == Index && abort();
                                Index = position;
                              }
                              return +source.slice(begin, Index);
                            }
                            isSigned && abort();
                            if ("true" == source.slice(Index, Index + 4)) {
                              Index += 4;
                              return true;
                            }
                            if ("false" == source.slice(Index, Index + 5)) {
                              Index += 5;
                              return false;
                            }
                            if ("null" == source.slice(Index, Index + 4)) {
                              Index += 4;
                              return null;
                            }
                            abort();
                          }
                        }
                        return "$";
                      };
                      var get = function get(value) {
                        var results, hasMembers;
                        "$" == value && abort();
                        if ("string" == typeof value) {
                          if ("@" == (charIndexBuggy ? value.charAt(0) : value[0])) return value.slice(1);
                          if ("[" == value) {
                            results = [];
                            for (;;hasMembers || (hasMembers = true)) {
                              value = lex();
                              if ("]" == value) break;
                              if (hasMembers) if ("," == value) {
                                value = lex();
                                "]" == value && abort();
                              } else abort();
                              "," == value && abort();
                              results.push(get(value));
                            }
                            return results;
                          }
                          if ("{" == value) {
                            results = {};
                            for (;;hasMembers || (hasMembers = true)) {
                              value = lex();
                              if ("}" == value) break;
                              if (hasMembers) if ("," == value) {
                                value = lex();
                                "}" == value && abort();
                              } else abort();
                              "," != value && "string" == typeof value && "@" == (charIndexBuggy ? value.charAt(0) : value[0]) && ":" == lex() || abort();
                              results[value.slice(1)] = get(lex());
                            }
                            return results;
                          }
                          abort();
                        }
                        return value;
                      };
                      var update = function update(source, property, callback) {
                        var element = walk(source, property, callback);
                        element === undef ? delete source[property] : source[property] = element;
                      };
                      var walk = function walk(source, property, callback) {
                        var value = source[property], length;
                        if ("object" == typeof value && value) if (getClass.call(value) == arrayClass) for (length = value.length; length--; ) update(value, length, callback); else _forEach(value, function(property) {
                          update(value, property, callback);
                        });
                        return callback.call(source, property, value);
                      };
                      exports.parse = function(source, callback) {
                        var result, value;
                        Index = 0;
                        Source = "" + source;
                        result = get(lex());
                        "$" != lex() && abort();
                        Index = Source = null;
                        return callback && getClass.call(callback) == functionClass ? walk((value = {}, 
                        value[""] = result, value), "", callback) : result;
                      };
                    }
                  }
                  exports["runInContext"] = runInContext;
                  return exports;
                }
                if (freeExports && !isLoader) runInContext(root, freeExports); else {
                  var nativeJSON = root.JSON, previousJSON = root["JSON3"], isRestored = false;
                  var JSON3 = runInContext(root, root["JSON3"] = {
                    noConflict: function noConflict() {
                      if (!isRestored) {
                        isRestored = true;
                        root.JSON = nativeJSON;
                        root["JSON3"] = previousJSON;
                        nativeJSON = previousJSON = null;
                      }
                      return JSON3;
                    }
                  });
                  root.JSON = {
                    parse: JSON3.parse,
                    stringify: JSON3.stringify
                  };
                }
                isLoader && define(function() {
                  return JSON3;
                });
              }).call(this);
            }).call(this, "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : "undefined" !== typeof global ? global : {});
          }, {} ],
          51: [ function(_dereq_, module, exports) {
            module.exports = toArray;
            function toArray(list, index) {
              var array = [];
              index = index || 0;
              for (var i = index || 0; i < list.length; i++) array[i - index] = list[i];
              return array;
            }
          }, {} ]
        }, {}, [ 31 ])(31);
      });
      cc._RF.pop();
    }).call(this, "undefined" !== typeof global ? global : "undefined" !== typeof self ? self : "undefined" !== typeof window ? window : {});
  }, {} ]
}, {}, [ "socket-io", "AnysdkMgr", "AudioMgr", "GameNetMgr", "Global", "HTTP", "MahjongMgr", "Net", "OnBack", "ReplayMgr", "SceneMgr", "SelectPlayway", "UserMgr", "Utils", "VoiceMgr", "WaitingConnection", "playway" ]);