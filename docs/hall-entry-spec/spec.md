# 大厅「加入房间 / 创建房间」入口规格说明

## 需求（用户原话）
- hall大厅页，content节点下子节点second（加入房间）：点击跳出弹窗输入房间ID进入；房间不存在要提示；加入前验证房间进入限制，不符合要提示；复用大厅现有录入弹窗。
- 节点clubEntryBtn（创建房间）：点击验证是否俱乐部创建人，是则弹窗创建房间（与牌桌列表页不同——需选择玩法）；不是创建人则提示无权限。

## 已确认的现状（代码证据）
- `hall.fire` Canvas/content 下：first（贴图=创建房间.png）、second（贴图=加入房间.png，已核实 uuid→资源）、clubEntryBtn（贴图=俱乐部图集 jlb）。
- 大厅已有录入弹窗：`JoinGame` 节点（id 108），组件 `JoinGameInput.js`，已绑定到 hall.js 的 `joinGameWin`。
  - 进入流程：`cc.vv.userMgr.enterRoom(roomId)` → `/enter_private_room` → 游戏服 `/enter_room`。
  - 已有校验与提示：房间不存在（errcode 3/其他→"房间[xxx]不存在"）、房间满员（errcode 4→"已满"）、宝宝豆不足（errcode 2222→showAlert 服务端文案）。**服务端进入限制（min_bean）已在校验，无需改服务端。**
- `clubEntryBtn` 当前行为：hall.js `initClub()` 绑定 TOUCH_END → `loadScene("club")`（将被本次需求替换为创建房间）。
- 俱乐部接口（hall_server/client_service.js，全部现成）：
  - `/club_list` → 返回 clubs（含 owner_userid），判断是否创建人：`club.owner_userid == cc.vv.userMgr.userId`。
  - `/club_games?clubid=` → 返回该俱乐部已启用玩法（game_type/name/difen_options/jushu_options）。
  - `/club_add_table`（仅创建人，服务端二次校验）参数：clubid, game_type, difen_value, jushuxuanze(下标), banker_mode, min_bean, kick_bean；桌名服务端按序号自动生成。
  - `/club_enter_table?tableid=` → 校验宝宝豆（2222）并返回 ip/port/token/sign → `cc.vv.gameNetMgr.connectGameServer(ret)` 直接进房。
- clubScene.js 牌桌列表页加桌模式：底分默认第一项、局数第一项、宝宝豆/请出 0、banker_mode 固定 0（无庄）。

## 设计决策
1. **加入房间（second）**：hall.js 中为 `Canvas/content/second` 绑定 TOUCH_END → `onJoinGameClicked()` 打开现有 JoinGame 弹窗。校验与提示链路已完整，**仅加绑定，无其他改动**。
2. **创建房间（clubEntryBtn）**：替换 `initClub()` 原跳转俱乐部场景的绑定：
   - 点击 → `/club_list`，过滤 `owner_userid == userId` 的俱乐部；无 → `cc.vv.wc.showError("您不是俱乐部创建人，无权创建房间")`。
   - 有（取第一个自有俱乐部）→ `/club_games` 拉玩法 → 打开创建弹窗。
   - 弹窗内容：**玩法选择行**（该俱乐部已启用玩法逐个按钮，单选高亮，默认第一个；切换时底分/局数默认值跟随该玩法配置）+ 底分/局数/最低宝宝豆/请出阈值 4 个数字输入框（默认：底分第一项、局数第一项、0/0）+ 确定/取消。banker_mode 固定 0（与牌桌列表页一致）。
   - 确定 → `/club_add_table` → 成功 → 关弹窗并直接 `/club_enter_table` 进入新房间（2222→showAlert，其他→showError）；失败 → showError(errmsg)。
   - 取消 → 关弹窗。
3. **弹窗实现方式**：hall.fire 禁止手改场景 JSON（项目硬性规则），弹窗由 hall.js 动态构建（cc.Graphics 画底板/输入框底、cc.Label 文字、cc.EditBox 输入，零贴图依赖）；用户后续可在编辑器中自行固化到场景。
4. **服务端零改动**：所有接口与校验均已存在。
5. first 节点（创建房间.png 贴图）本次不动——用户明确指定的两个节点是 second 与 clubEntryBtn。

## 修改文件
- 仅 `D:\baobao_game\client\assets\module\hall\srcipts\hall.js`
  - onLoad/initClub 区域：新增 second 绑定；重写 initClub 为创建房间流程。
  - 新增方法：`_bindJoinRoomBtn`、`_onCreateRoomEntry`、`_fetchOwnerClubGames`、`_openCreateWin`、`_closeCreateWin`、`_submitCreateWin`、`_enterCreatedTable`（动态弹窗构建与提交、进房）。
- 修改前备份 hall.js 到 `_backups`（时间戳命名）。

## 验证步骤
1. 重启 Cocos Creator（防文件监听缓存），预览大厅。
2. 非创建人账号（?account= 游客号）点 clubEntryBtn → 提示无权限。
3. 创建人账号点 clubEntryBtn → 弹窗出现，可切换玩法、改参数 → 确定 → 进入房间（牌桌出现在该俱乐部列表）。
4. 点 second → 录入弹窗 → 输错房号提示不存在；输满员房提示已满；输 min_bean 高的房且宝宝豆不足 → 弹窗提示。
5. 确认原功能无回归：菜单按钮、战绩/帮助/消息弹窗、notice 滚动正常。
