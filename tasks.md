# 任务清单 — 宝宝(6张)四项修复

- [x] T0 备份将被修改的 5 个文件（删除上一版备份，仅保留最新一版）
  - `server/game_server/gamemgr_baobao.js`
  - `server/game_server/roommgr.js`
  - `server/admin/club.html`
  - `client/assets/module/bbgame/scripts/BBGame.js`
  - `client/assets/resources/script/GameNetMgr.js`

- [x] T1 服务端：重进房间补发（`gamemgr_baobao.js`）
  - 抽出 `buildRevealPayload(game)`，`revealMian/revealShou` 复用
  - `doGameOver` 保存 `game.lastOver`
  - 重写 `resendGameState`：confirm/arrange/reveal/result 四阶段各自补发；`bb_resend_push` 带 `resend:true`；result 补发 `game_over_push`
  - `setReady`：存在牌局（含 gameOver 未清理）一律按进行中处理

- [x] T2 客户端：重进不卡（`GameNetMgr.js` + `BBGame.js`）
  - `bb_resend_push` 标记 `data.resend = true`
  - `onBbStart` 遇 `resend` 跳过洗牌/发牌动画
  - `_showPhaseUI` 增加 `reveal` / `result` 分支（不启动倒计时、不弹确认窗）

- [x] T3 有庄/无庄（`club.html` + `roommgr.js` + `gamemgr_baobao.js`）
  - 后台「添加牌桌」下拉 + 写入 `conf.banker_mode` + 卡片展示
  - 建房时 `conf.banker_mode` 透传
  - `bankerMode(game)` 优先读 `conf.banker_mode`，回落 `tai_rules`

- [x] T4 结算明牌（`BBGame.js`）
  - `_renderSettleCards(results)`：固定名 `bbSettleCards`，每家 6 张牌 + 昵称 + 牌型 + 分数
  - `applyGameOver` 调用并隐藏 `settleContent`；`onGameEnd` 保留行
  - 图集加载完成后若结算打开则重绘

- [x] T5 特效音效（`BBGame.js`）
  - `SFX.fire = guess/win.mp3`，`SFX.bomb = nv/gang.mp3`
  - `_fxFire`、`_fxBurst` 播放（判空 `cc.vv.audioMgr`）

- [x] T6 验证
  - `node --check` 服务端文件
  - 临时单测：`bankerMode` 三分支 + `resendGameState` 三阶段字段断言，跑通后删除脚本
  - 重启 `game_server`（9103）
  - 汇总给用户实测项（重进、庄/无庄、结算明牌、音效）

