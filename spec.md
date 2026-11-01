# 宝宝(6张)四项修复 — 实施方案

> 项目：`d:\baobao_game`（Cocos Creator 2.4.15 + Node.js）
> 禁止改动 `d:\babykylin_scmj`；禁止手改 `.fire/.prefab` 的 JSON、禁止改任何 `.meta`/uuid。

## 需求

1. 重新进入房间会卡住（疑似卡在旧倒计时/旧阶段）
2. 俱乐部后台「添加牌桌」可选「有庄 / 无庄」；有庄=闲家只与庄家比，无庄=各玩家互比
3. 结算弹窗要有所有玩家的 6 张明牌
4. 刚加的同花顺/炸弹动画加音效

## 1. 重进房间卡住

### 根因
- 服务端 `resendGameState` 在 `game.gameOver` 时直接 `return`；`phase=="reveal"` 时也只补发 `bb_resend_push`。
- 客户端 `bb_resend_push` 与 `bb_start_push` 共用 `onBbStart`，重进必然重播发牌动画；`_showPhaseUI` 只处理 `arrange/confirm`，`phase=="reveal"` 落入免摆的兜底分支 → 弹出确认窗并等一个已失效的倒计时 → 卡住。
- `phase=="result"` 重进时收不到结算数据，只能等 30 秒自动续局，表现为“卡住等倒计时”。

### 改动
**`server/game_server/gamemgr_baobao.js`**
- 抽出 `buildRevealPayload(game)`（免摆/手摆两种），`revealMian`/`revealShou` 复用它。
- `doGameOver`：组装 `overData` 后保存 `game.lastOver = overData`。
- `exports.resendGameState(roomId, userId)` 重写：
  - `game == null` → return。
  - 用户在 `gameSeats` 内：
    - `phase == "result"` 或 `game.gameOver`：`userMgr.sendMsg(userId,'game_over_push', game.lastOver)`，并补发 `bb_resend_push`（`resend:true, phase:"result"`，不带弹窗倒计时）以保证座位/房间信息完整。
    - `phase == "reveal"`：补发 `bb_resend_push`（`resend:true, phase:"reveal", reveal: buildRevealPayload(game)`）。
    - 其它阶段：保持现有 `bb_resend_push`，追加 `resend:true`。
  - 用户不在 `gameSeats`（观战/排队）：`phase=="reveal"` 时补发 `bb_reveal_push`（保持观战），否则不补发。
- `exports.setReady`：只要 `games[roomId] != null` 就按“本局进行中”处理（在局内→补发；不在局内→`bb_wait_next_push`），避免结算阶段被误判为可开局而覆盖牌局。

**`client/assets/resources/script/GameNetMgr.js`**
- `bb_resend_push` 处理器：`data.resend = true` 后再 `onBbStartData(data)`。

**`client/assets/module/bbgame/scripts/BBGame.js`**
- `onBbStart`：`data.resend` 为真时跳过洗牌/发牌动画（`_dealing=false`），直接 `renderCards()` + `_showPhaseUI(data, nm)`。
- `_showPhaseUI` 新增分支（放在 confirm 分支前）：
  - `phase=="reveal"`：隐藏确认/摆牌弹窗，用 `data.reveal.players` 写入 `_revealByGs`，`_revealCounts` 全为 6，`renderCards()`，`showTip("等待结算…")`，不启动任何倒计时。
  - `phase=="result"`：隐藏确认/摆牌弹窗，`showTip("等待结算…")`。
- 结算推送到达后走现有 `applyGameOver`；`_fxRunning/_revealRunning` 在重进时重置（已有逻辑）。

## 2. 有庄 / 无庄（按牌桌配置）

### 改动
**`server/admin/club.html`**
- 「添加牌桌」弹窗新增下拉 `tbl_banker_mode`：`有庄(1)` / `无庄(0)`，默认有庄。
- `saveTable()` 的 `conf` 增加 `banker_mode: parseInt(...)||0`。
- 牌桌卡片展示 `有庄/无庄`。

**`server/game_server/roommgr.js`**（baobao 分支，约 331-334 行）
```js
if(type == "baobao_mian" || type == "baobao_shou"){
    conf.taiRules = cfg.tai_rules || null;
    if(roomConf.banker_mode != null){ conf.banker_mode = Number(roomConf.banker_mode) ? 1 : 0; }
}
```
> `t_club_tables.conf` → 大厅 `club_enter_table` → 房间 `base_info` 已自动透传 `banker_mode`；老牌桌无该字段时回落后台 `tai_rules.banker_mode`。

**`server/game_server/gamemgr_baobao.js`**
```js
function bankerMode(game){
    if(game.conf.banker_mode != null) return !!Number(game.conf.banker_mode);
    var tr = taiRules(game); return tr.banker_mode != null ? !!Number(tr.banker_mode) : true;
}
```
`doGameOver` 的比大小配对方（`game.bankerMode`）与客户端“(庄)”标记、房间顶部“庄:xxx”自动跟随，无需另改。

## 3. 结算弹窗显示明牌

**`client/assets/module/bbgame/scripts/BBGame.js`**
- 新增 `_renderSettleCards(results)`：在 `settlePanel` 内创建固定名 `bbSettleCards` 容器（只创建一次，复用）。
  - 每家一行（最多 6 行）：`昵称(+庄)`、6 张牌 `cc.Sprite`（`frameOf(id)`，未加载时用 `_cardBack`）、`牌型/三道 ×倍率`、`+/-分 (总:xxx)`。
  - 牌尺寸约 40×56、行间距按行数自适应；整体居中，避开标题与底部按钮。
- `applyGameOver`：拿到 `results` 后调用 `_renderSettleCards(results)`，并将 `settleContent` 隐藏（避免与牌面重叠）；按钮/倒计时逻辑不变。
- `onGameEnd`：保留 `bbSettleCards` 当前行（末局仍在），`settleContent` 仅用于整场总分时可显示在底部，若空间不足则隐藏。
- `loadCardFrames` 完成回调：若 `settlePanel` 处于打开状态且已有 `_lastResults`，重绘一次（解决图集异步未加载时空白牌）。

> 不改 `.fire`：容器与行全部代码创建，避免手工编辑场景 JSON 造成 `__id__` 错位/编辑器崩溃。

## 4. 特效音效

**现状**：项目无火焰/爆炸音频，且无音频生成能力（无法合成拟真音效）。
**改动**：`BBGame.js` 增加常量
```js
var SFX = { fire: "guess/win.mp3", bomb: "nv/gang.mp3" };
```
- `_fxFire` 播放 `cc.vv.audioMgr.playSFX(SFX.fire)`；
- `_fxBurst` 每次爆炸播放 `cc.vv.audioMgr.playSFX(SFX.bomb)`（`_fxBomb` 有多目标时逐个播）。
- 调用前判空 `cc.vv && cc.vv.audioMgr`。
- 后续若提供专用 `fire.mp3/bomb.mp3` 放入 `client/assets/resources/sounds/`，只改常量即可。

## 验证

1. `node --check` 三个服务端文件（`gamemgr_baobao.js`、`roommgr.js`、`account_server/admin_api.js` 不涉及逻辑改动）。
2. 本地 Node 单测（临时脚本，验证后删除）：
   - `bankerMode`：`conf.banker_mode=0/1/缺省+tai_rules` 三种分支。
   - `resendGameState`：mock `userMgr.sendMsg`，构造 `phase=confirm/reveal/result` 局面，断言推送事件与字段。
3. 重启 `game_server`（9103）后由用户实测：
   - 对局中退出→重进：不重播发牌、不弹失效确认窗，直接回到当前阶段；结算阶段重进直接看到结算。
   - 后台添加牌桌选“无庄”→ 新房间结算按两两互比；选“有庄”→ 只与庄家比。
   - 结算弹窗每家 6 张明牌、牌型与分数正常。
   - 同花顺/炸弹动画有音效。
4. 客户端改完需重启 Cocos Creator 编辑器再预览。

## 影响面 / 回滚

- 仅改：`gamemgr_baobao.js`、`roommgr.js`、`club.html`、`BBGame.js`、`GameNetMgr.js`。
- 不含数据库迁移；老牌桌/老房间字段缺省时行为与现在一致。
- 改前备份同名文件（只保留最新一版备份，删除上一版备份）。
