// 俱乐部管理后台 - 静态节点写在 clubAdmin.fire 中, 本脚本按节点名绑定
// 列表行与弹窗仍由代码创建
// 管理页接口走大厅服(9101)的 /club_admin/* 路由
// HTTP.sendRequest 的签名是 (path, data, handler, extraUrl), 没有 method 参数, 全部是 GET
var CLUB_ADMIN_ROUTES = {
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

function clubReq(path, data, handler) {
    var d = data || {};
    if (cc.vv && cc.vv.userMgr && cc.vv.userMgr.account) { d.account = cc.vv.userMgr.account; }
    if (!d.sign) { d.sign = "1"; }
    //club_id兜底: 调用方没传(或组件_clubId尚未就绪)时, 从俱乐部场景写入的上下文取
    if (d.club_id == null && d.clubid == null) {
        var cid = (cc.vv && cc.vv.adminClubId) ? parseInt(cc.vv.adminClubId) : 0;
        if (!(cid > 0)) { cid = parseInt(cc.sys.localStorage.getItem("admin_club_id")) || 0; }
        if (cid > 0) { d.club_id = cid; }
    }
    var p = path;
    var m;
    if ((m = /^\/partner\/(\d+)$/.exec(path))) {
        d.partner_id = m[1];
        p = "/club_admin/partner_delete";
    } else if ((m = /^\/club_game_config\/(\d+)\/close$/.exec(path))) {
        d.id = m[1];
        p = "/club_admin/game_config_close";
    } else if ((m = /^\/club_game_config\/(\d+)\/delete$/.exec(path))) {
        d.id = m[1];
        p = "/club_admin/game_config_delete";
    } else if ((m = /^\/club_game_config\/(\d+)$/.exec(path))) {
        d.id = m[1];
        p = "/club_admin/game_config_update";
    } else if (path === "/club_game_config") {
        p = "/club_admin/game_config_save";
    } else {
        p = CLUB_ADMIN_ROUTES[path] || path;
    }
    cc.vv.http.sendRequest(p, d, handler);
}

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad: function () {
        // 必须在 _bindUI 之前取到俱乐部ID: _bindUI 会切到总览页并请求 /club_overview,
        // 此时 _clubId 还是 null 就会发出 club_id=null 的 404 请求
        this._clubId = this._resolveClubId();
        this._clubName = "";
        this._currentPage = "overview"; // overview/member/partner/partnerStats/reward/gameConfig/operationLog
        this._members = [];
        this._partners = [];
        this._gameConfigs = [];
        this._allGameTypes = [];
        this._selectedGameType = "";
        this._clubTables = [];
        this._rewards = [];
        this._overview = {};
        // 列表分页: 每个列表各自记住当前页码
        this._pagers = {};
        this._memberPageNo = 1;
        this._partnerPageNo = 1;
        this._partnerStatsPageNo = 1;
        this._rewardPageNo = 1;
        this._incomePageNo = 1;
        this._tablePageNo = 1;
        this._pagerSeq = 0;

        // 收入统计筛选状态(默认本月)
        this._statMonth = this._fmtYM(new Date());
        this._statFrom = null;
        this._statTo = null;
        this._statPartnerId = 0;
        this._statPartnerName = "";

        this._bindUI();
        this._loadClubInfo();
    },

    // ============ 节点查找 ============
    _find: function (name, node) {
        node = node || this.node;
        if (node.name === name) return node;
        var children = node.children;
        for (var i = 0; i < children.length; i++) {
            var ret = this._find(name, children[i]);
            if (ret) return ret;
        }
        return null;
    },

    // ============ UI 绑定 ============
    _bindUI: function () {
        var self = this;

        // 顶部
        this._clubInfoLabel = this._find("clubInfo");
        this._myGemsLabel = this._find("myGems");
        var closeBtn = this._find("closeBtn");
        if (closeBtn) {
            closeBtn.on(cc.Node.EventType.TOUCH_END, function () {
                //返回必须落到确定显示的页面: 管理页只从俱乐部详情页进入, 返回时强制回本俱乐部详情页,
                //不依赖可能已丢失/串台的 cc.vv.fromClubId 残留状态(否则 club 场景可能落到空白)
                if (self._clubId > 0) {
                    cc.vv.fromClubId = self._clubId;
                    cc.vv.fromClub = true;
                }
                cc.director.loadScene("club");
            });
        }

        // 左侧菜单
        this._menuBtns = {};
        var keys = ["overview", "member", "partner", "partnerStats", "reward", "gameConfig", "operationLog"];
        for (var i = 0; i < keys.length; i++) {
            (function (key) {
                var btn = self._find("menu_" + key);
                if (!btn) return;
                self._menuBtns[key] = btn;
                btn.on(cc.Node.EventType.TOUCH_END, function () {
                    self._showPage(key);
                });
            })(keys[i]);
        }

        // 页面容器
        this._pages = {};
        for (var j = 0; j < keys.length; j++) {
            var page = this._find(keys[j] + "Page");
            if (page) this._pages[keys[j]] = page;
        }

        this._bindOverviewPage();
        this._bindMemberPage();
        this._bindPartnerPage();
        this._bindPartnerStatsPage();
        this._bindRewardPage();
        this._bindGameConfigPage();
        this._bindPopups();

        // 默认显示总览(noLoad: 只切页面, 数据统一由 _loadClubInfo 加载, 避免重复请求)
        this._showPage("overview", true);
    },

    // 俱乐部ID来源: 从俱乐部场景跳转时写入 cc.vv.adminClubId, 其次本地存储
    _resolveClubId: function () {
        var id = (cc.vv && cc.vv.adminClubId) ? parseInt(cc.vv.adminClubId) : 0;
        if (!(id > 0)) {
            id = parseInt(cc.sys.localStorage.getItem("admin_club_id")) || 0;
        }
        return id > 0 ? id : 0;
    },

    // ============ 总览页 ============
    _bindOverviewPage: function () {
        var self = this;
        // 收入统计卡片(card_11): 点按钮 cxSprite 弹统计弹窗
        var statCard = this._find("card_11");
        if (statCard) {
            var statBtn = statCard.getChildByName("cxSprite") || statCard;
            statBtn.on(cc.Node.EventType.TOUCH_END, function () {
                self._showIncomeStatsDialog();
            });
        }
        // 卡片 value Label 按标题绑定
        var titles = ["今日累收", "昨日累收", "前日累收", "当日实收", "昨日实收", "前日实收", "当日人次", "昨日人次", "前日人次", "整链总乐豆", "总人数"];
        this._overviewLabels = {};
        for (var i = 0; i < titles.length; i++) {
            var card = this._find("card_" + i);
            if (!card) continue;
            var value = card.getChildByName("value");
            if (value) this._overviewLabels[titles[i]] = value;
        }
    },

    _renderOverview: function () {
        var d = this._overview;
        // 顶部: 俱乐部名称 + ID + 本人豆豆总数
        if (d.club_name || d.club_id) {
            if (this._clubInfoLabel) {
                this._clubInfoLabel.getComponent(cc.Label).string = (d.club_name || "未命名俱乐部") + "  (ID:" + (d.club_id || this._clubId || 0) + ")";
            }
        }
        if (this._myGemsLabel) {
            this._myGemsLabel.getComponent(cc.Label).string = "我的豆豆: " + (d.my_gems || 0);
        }
        this._setOverviewLabel("今日累收", d.today_rake || 0);
        this._setOverviewLabel("昨日累收", d.yesterday_rake || 0);
        this._setOverviewLabel("前日累收", d.before_yesterday_rake || 0);
        this._setOverviewLabel("当日实收", d.today_net !== undefined ? d.today_net : (d.today_rake || 0));
        this._setOverviewLabel("昨日实收", d.yesterday_net !== undefined ? d.yesterday_net : (d.yesterday_rake || 0));
        this._setOverviewLabel("前日实收", d.before_yesterday_net !== undefined ? d.before_yesterday_net : (d.before_yesterday_rake || 0));
        this._setOverviewLabel("当日人次", d.today_rounds || 0);
        this._setOverviewLabel("昨日人次", d.yesterday_rounds || 0);
        this._setOverviewLabel("前日人次", d.before_yesterday_rounds || 0);
        this._setOverviewLabel("整链总乐豆", d.total_gems || 0);
        this._setOverviewLabel("总人数", d.member_count || 0);
    },

    _setOverviewLabel: function (key, value) {
        if (this._overviewLabels[key]) {
            this._overviewLabels[key].getComponent(cc.Label).string = String(value);
        }
    },

    // ============ 收入统计弹窗(card_11 -> cxSprite) ============
    _showIncomeStatsDialog: function () {
        var win = this._incomeStatsWin || this._find("incomeStatsWin");
        if (!win) { return; }
        this._incomeStatsWin = win;
        if (this._statDrop) { this._statDrop.active = false; }
        this._refreshStatFilters();
        win.active = true;
        win.setSiblingIndex(9999);
        this._queryIncomeStats();
    },

    _fmtYM: function (dt) {
        var m = dt.getMonth() + 1;
        return dt.getFullYear() + "-" + (m < 10 ? "0" + m : m);
    },

    _fmtDay: function (dt) {
        var m = dt.getMonth() + 1, dd = dt.getDate();
        return dt.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (dd < 10 ? "0" + dd : dd);
    },

    // 秒级时间戳 -> "YYYY-MM-DD HH:mm"
    _fmtDateTime: function (ts) {
        var n = Number(ts) || 0;
        if (n <= 0) { return "-"; }
        var dt = new Date(n * 1000);
        var p = function (v) { return v < 10 ? "0" + v : "" + v; };
        return dt.getFullYear() + "-" + p(dt.getMonth() + 1) + "-" + p(dt.getDate()) + " " + p(dt.getHours()) + ":" + p(dt.getMinutes());
    },

    // 按钮/输入框里的文字 Label
    _btnLabel: function (node) {
        if (!node) { return null; }
        var n = node.getChildByName("TEXT_LABEL") || node.getChildByName("Label") || node.children[0];
        return n ? n.getComponent(cc.Label) : null;
    },

    _refreshStatFilters: function () {
        if (this._statMonthLabel) { this._statMonthLabel.string = this._statMonth || "选择月份"; }
        if (this._statFromLabel) { this._statFromLabel.string = this._statFrom ? this._fmtDay(this._statFrom) : "开始日期"; }
        if (this._statToLabel) { this._statToLabel.string = this._statTo ? this._fmtDay(this._statTo) : "结束日期"; }
        if (this._statPidLabel) {
            this._statPidLabel.string = (this._statPartnerId > 0) ? (this._statPartnerName || ("俱乐部 " + this._statPartnerId)) : "全部俱乐部";
        }
    },

    // 查询: 选了月份按整月; 否则按日期区间(只选一边也行); 都没选默认本月
    _queryIncomeStats: function () {
        var self = this;
        if (!this._canRequest()) { return; }
        var now = new Date();
        var from = null, to = null;
        if (this._statMonth) {
            var mp = String(this._statMonth).split("-");
            var my = parseInt(mp[0]), mm = parseInt(mp[1]);
            if (my > 0 && mm > 0) {
                from = new Date(my, mm - 1, 1);
                to = new Date(my, mm, 1);
            }
        }
        if (!from) {
            if (this._statFrom) { from = new Date(this._statFrom.getFullYear(), this._statFrom.getMonth(), this._statFrom.getDate()); }
            if (this._statTo) { to = new Date(this._statTo.getFullYear(), this._statTo.getMonth(), this._statTo.getDate() + 1); }
            if (!from) { from = new Date(now.getFullYear(), now.getMonth(), 1); }
            if (!to) { to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); }
        }
        var fromTs = Math.floor(from.getTime() / 1000);
        var toTs = Math.floor(to.getTime() / 1000);
        var pid = this._statPartnerId || 0;
        this._incomePageNo = 1;
        clubReq("/income_stats", { club_id: this._clubId, from: fromTs, to: toTs, partner_club_id: pid }, function (ret) {
            if (ret && ret.errcode === 0) {
                self._renderIncomeStats(ret);
            } else {
                self._renderIncomeStats({ total: 0, list: [] });
                if (ret && ret.errmsg) { self._toast && self._toast(ret.errmsg); }
            }
        });
    },

    // ============ 下拉(月份 / 下级俱乐部) ============
    _toggleStatDrop: function (kind) {
        var drop = this._statDrop;
        if (!drop) { return; }
        if (drop.active && this._statDropKind === kind) { drop.active = false; return; }
        this._statDropKind = kind;
        this._renderStatDrop(kind);
        drop.active = true;
        // 直接贴在所点按钮下方, 宽度跟按钮一致(不再是一个大背景面板)
        var btn = (kind === "partner") ? this._statPidBtn : this._statMonthBtn;
        if (btn && btn.parent) {
            var wp = btn.parent.convertToWorldSpaceAR(btn.position);
            var lp = drop.parent.convertToNodeSpaceAR(wp);
            drop.setPosition(lp.x, lp.y - btn.height / 2 - 4 - drop.height / 2);
        }
        drop.setSiblingIndex(drop.parent.children.length - 1);
    },

    _renderStatDrop: function (kind) {
        var drop = this._statDrop;
        if (!drop) { return; }
        var tpl = drop.getChildByName("dropItemTpl");
        if (!tpl) { return; }
        // 场景里放了 Layout 也关掉, 行位置由这里统一排
        var lay = drop.getComponent(cc.Layout);
        if (lay) { lay.enabled = false; }
        this._clearList(drop, tpl);
        tpl.active = false;
        var self = this;
        var items = [];
        if (kind === "partner") {
            items.push({ key: 0, text: "全部俱乐部" });
            var ps = this._partners || [];
            for (var i = 0; i < ps.length; i++) {
                var p = ps[i];
                if ((p.level || 1) !== 1) { continue; }
                items.push({ key: Number(p.id) || 0, text: (p.name || "未命名") + " (ID:" + p.id + ")" });
            }
        } else {
            var now = new Date();
            for (var k = 0; k < 12; k++) {
                var ym = this._fmtYM(new Date(now.getFullYear(), now.getMonth() - k, 1));
                items.push({ key: ym, text: ym });
            }
        }
        var btn = (kind === "partner") ? this._statPidBtn : this._statMonthBtn;
        var w = btn ? btn.width : 240;
        var rowH = tpl.height || 52;
        var h = items.length * rowH + 8;
        drop.setContentSize(w, h);
        for (var j = 0; j < items.length; j++) {
            (function (it, idx) {
                var row = cc.instantiate(tpl);
                row.active = true;
                row.parent = drop;
                row.setContentSize(w - 6, rowH);
                row.setPosition(0, h / 2 - rowH / 2 - idx * rowH);
                var lb = row.getChildByName("Label");
                if (lb) {
                    lb.setContentSize(w - 20, rowH - 4);
                    var l = lb.getComponent(cc.Label);
                    if (l) { l.string = it.text; l.overflow = cc.Label.Overflow.CLAMP; l.enableWrapText = false; }
                }
                row.on(cc.Node.EventType.TOUCH_END, function () {
                    drop.active = false;
                    if (kind === "partner") {
                        self._statPartnerId = it.key;
                        self._statPartnerName = it.text;
                    } else {
                        self._statMonth = it.key;
                        self._statFrom = null;
                        self._statTo = null;
                    }
                    self._refreshStatFilters();
                    self._queryIncomeStats();
                });
            })(items[j], j);
        }
    },

    // ============ 日期选择器 ============
    _openStatDatePicker: function (mode) {
        var win = this._datePickerWin;
        if (!win) { return; }
        if (win.active && this._statPickMode === mode) { win.active = false; return; }
        this._statPickMode = mode;
        var base = (mode === "from" ? this._statFrom : this._statTo) || new Date();
        this._pickYear = base.getFullYear();
        this._pickMonth = base.getMonth();
        if (this._statDrop) { this._statDrop.active = false; }
        // 位置/尺寸完全由场景节点决定(不在这里改)
        win.active = true;
        win.setSiblingIndex(10000);
        this._renderDatePicker();
    },

    _renderDatePicker: function () {
        var win = this._datePickerWin;
        if (!win) { return; }
        var panel = win.getChildByName("panel");
        var content = panel ? panel.getChildByName("content") : null;
        if (!content) { return; }
        var mStr = (this._pickMonth + 1);
        if (this._pickYmLabel) { this._pickYmLabel.string = this._pickYear + "-" + (mStr < 10 ? "0" + mStr : mStr); }
        var grid = this._dayGrid;
        var tpl = this._dayTpl;
        if (!grid || !tpl) { return; }
        this._clearList(grid, tpl);
        tpl.active = false;
        var self = this;
        var startCol = new Date(this._pickYear, this._pickMonth, 1).getDay();
        var days = new Date(this._pickYear, this._pickMonth + 1, 0).getDate();
        // 按场景里格子实际尺寸排布, 场景调整大小后不用改代码
        var cellW = tpl.width, cellH = tpl.height;
        var x0 = -(grid.width - cellW) / 2;
        var y0 = (grid.height - cellH) / 2;
        for (var i = 0; i < days; i++) {
            (function (day) {
                var row = cc.instantiate(tpl);
                row.active = true;
                row.parent = grid;
                var col = (startCol + day - 1) % 7;
                var r = Math.floor((startCol + day - 1) / 7);
                row.setPosition(x0 + col * cellW, y0 - r * cellH);
                var lb = row.getChildByName("Label") || row.getChildByName("TEXT_LABEL");
                if (lb) {
                    var l = lb.getComponent(cc.Label);
                    if (l) { l.string = String(day); }
                    var sel = (self._statPickMode === "from" ? self._statFrom : self._statTo);
                    if (sel && sel.getFullYear() === self._pickYear && sel.getMonth() === self._pickMonth && sel.getDate() === day) {
                        lb.color = cc.color(220, 60, 40);
                    }
                }
                row.on(cc.Node.EventType.TOUCH_END, function () {
                    var dt = new Date(self._pickYear, self._pickMonth, day);
                    if (self._statPickMode === "from") {
                        self._statFrom = dt;
                        if (self._statTo && self._statTo.getTime() < dt.getTime()) { self._statTo = null; }
                    } else {
                        self._statTo = dt;
                        if (self._statFrom && self._statFrom.getTime() > dt.getTime()) { self._statFrom = null; }
                    }
                    self._statMonth = null;
                    win.active = false;
                    self._refreshStatFilters();
                    self._queryIncomeStats();
                });
            })(i + 1);
        }
    },

    _renderIncomeStats: function (data) {
        this._incomeStatsData = data || { total: 0, list: [] };
        var total = Number(data && data.total) || 0;
        if (this._statTotalLabel) { this._statTotalLabel.string = "总收入：" + total; }
        var content = this._statListContent;
        var rowTpl = this._statRowTpl;
        if (!content || !rowTpl) { return; }
        var olds = content.children.slice();
        for (var i = 0; i < olds.length; i++) {
            if (olds[i] !== rowTpl) { olds[i].destroy(); }
        }
        var list = (data && data.list) || [];
        var rowH = 80;
        // 只渲染当前页
        var pageSize = 15;
        var sl = this._pageSlice(list, this._incomePageNo, pageSize);
        this._incomePageNo = sl.page;
        for (var j = 0; j < sl.rows.length; j++) {
            var r = sl.rows[j];
            var row = cc.instantiate(rowTpl);
            row.active = true;
            row.parent = content;
            row.setPosition(0, -rowH / 2 - j * rowH);
            var dn = row.getChildByName("date");
            var pn = row.getChildByName("profit");
            if (dn) { dn.getComponent(cc.Label).string = String(r.day || ""); }
            if (pn) { pn.getComponent(cc.Label).string = String(r.income || 0); }
        }
        // content 锚点(0.5,1): y 取视口顶部高度, 让列表贴住顶部而不是留空
        var svNode = content.parent;
        var viewH = svNode ? svNode.height : 600;
        content.setContentSize(1020, Math.max(viewH, sl.rows.length * rowH + 10));
        content.setPosition(0, viewH / 2);
        if (this._incomeStatsContent) {
            var self = this;
            var pager = this._getPager("incomeStats", this._incomeStatsContent, -this._incomeStatsContent.height / 2 + 60);
            this._updatePager(pager, sl.total, sl.page, pageSize, function (p) {
                self._incomePageNo = p;
                self._renderIncomeStats(self._incomeStatsData);
            });
        }
    },

    // ============ 成员页 ============
    _bindMemberPage: function () {
        var self = this;
        var page = this._pages.member;
        if (!page) return;

        var addBtn = page.getChildByName("addBtn");
        if (addBtn) {
            addBtn.on(cc.Node.EventType.TOUCH_END, function () {
                self._showAddMemberDialog();
            });
        }

        this._memberSearch = page.getChildByName("searchBox");

        var searchBtn = page.getChildByName("searchBtn");
        if (searchBtn) {
            searchBtn.on(cc.Node.EventType.TOUCH_END, function () {
                self._memberPageNo = 1;
                self._renderMembers();
            });
        }

        var scroll = page.getChildByName("memberScroll");
        if (scroll) { this._memberContent = scroll.getChildByName("content"); }
    },

    // 清空列表内容: 只删克隆行和场景示例行, 保留 rowTpl 模板本身
    _clearList: function (content, tpl) {
        for (var k = content.children.length - 1; k >= 0; k--) {
            var n = content.children[k];
            if (n === tpl) { continue; }
            n.removeFromParent();
            n.destroy();
        }
    },

    // ============ 通用分页条(外观在场景 memberPage/pagerBar, JS 只克隆填字) ============
    // key: 每张列表唯一; parent: 分页条挂载的节点(页面或弹窗 content)
    _getPager: function (key, parent, bottomY) {
        if (!parent) { return null; }
        if (!this._pagers) { this._pagers = {}; }
        var old = this._pagers[key];
        if (old && cc.isValid(old.node)) { return old; }
        // 分页条直接取场景里摆好的节点, JS 不改位置/尺寸/对齐
        var bar = parent.getChildByName("pagerBar");
        if (!bar) { return null; }

        var prev = bar.getChildByName("prevBtn");
        var next = bar.getChildByName("nextBtn");
        var jump = bar.getChildByName("jumpBtn");
        var labelNode = bar.getChildByName("pageLabel");
        var inputBox = bar.getChildByName("pageInput");
        var lbl = labelNode ? labelNode.getComponent(cc.Label) : null;
        var eb = inputBox ? inputBox.getComponent(cc.EditBox) : null;
        if (eb) {
            eb.string = "";
            eb.maxLength = 4;
        }

        var pager = {
            node: bar, prev: prev, next: next, jump: jump, label: lbl, input: eb,
            page: 1, pages: 1, total: 0, pageSize: 20, onGo: null
        };
        if (prev) {
            prev.on(cc.Node.EventType.TOUCH_END, function () {
                if (pager.page > 1 && pager.onGo) { pager.onGo(pager.page - 1); }
            });
        }
        if (next) {
            next.on(cc.Node.EventType.TOUCH_END, function () {
                if (pager.page < pager.pages && pager.onGo) { pager.onGo(pager.page + 1); }
            });
        }
        var doJump = function () {
            if (!pager.input || !pager.onGo) { return; }
            var v = parseInt(pager.input.string, 10);
            if (!(v > 0)) { pager.input.string = ""; return; }
            if (v > pager.pages) { v = pager.pages; }
            pager.onGo(v);
            pager.input.string = "";
        };
        if (jump) { jump.on(cc.Node.EventType.TOUCH_END, doJump); }
        if (inputBox) { inputBox.on("editing-did-ended", doJump); }

        this._pagers[key] = pager;
        return pager;
    },

    // total 为当前筛选后的总条数; 只有超过一页才显示分页条
    _updatePager: function (pager, total, page, pageSize, onGo) {
        if (!pager) { return; }
        var size = Math.max(1, pageSize || 20);
        var pages = Math.max(1, Math.ceil(total / size));
        pager.total = total;
        pager.pageSize = size;
        pager.pages = pages;
        pager.page = Math.min(Math.max(1, page), pages);
        pager.onGo = onGo;
        // 分页条常显: 不足一页/没有数据时也显示, 只把上下页按钮置灰
        pager.node.active = true;
        if (pager.label) { pager.label.string = "第 " + pager.page + "/" + pages + " 页  共 " + total + " 条"; }
        if (pager.prev) { pager.prev.opacity = pager.page <= 1 ? 110 : 255; }
        if (pager.next) { pager.next.opacity = pager.page >= pages ? 110 : 255; }
        if (pager.input) { pager.input.string = ""; }
    },

    _pageSlice: function (list, pageNo, pageSize) {
        var total = list.length;
        var pages = Math.max(1, Math.ceil(total / pageSize));
        var p = Math.min(Math.max(1, pageNo || 1), pages);
        var start = (p - 1) * pageSize;
        return { page: p, total: total, rows: list.slice(start, start + pageSize) };
    },

    _renderMembers: function () {
        var content = this._memberContent;
        if (!content) return;
        // 模板行 rowTpl 固化在场景 content 下,JS 只克隆填数据,不创建任何控件
        var tpl = content.getChildByName("rowTpl");
        this._clearList(content, tpl);
        if (!tpl) return;
        tpl.active = false;

        var searchText = this._memberSearch ? this._memberSearch.getComponent(cc.EditBox).string : "";
        var filtered = this._members;
        if (searchText) {
            filtered = this._members.filter(function (m) {
                return String(m.userid).indexOf(searchText) >= 0 || (m.name && m.name.indexOf(searchText) >= 0);
            });
        }

        // 只渲染当前页, 避免成员过多时一次创建大量节点卡死
        var pageSize = 20;
        var sl = this._pageSlice(filtered, this._memberPageNo, pageSize);
        this._memberPageNo = sl.page;
        for (var i = 0; i < sl.rows.length; i++) {
            var m = sl.rows[i];
            // 行位置由 content 上的 cc.Layout 排列, JS 不参与布局
            var row = this._createMemberRow(tpl, m);
            if (row) { row.parent = content; row.active = true; }
        }
        var pager = this._getPager("member", this._pages.member, -this._pages.member.height / 2 + 46);
        var self2 = this;
        this._updatePager(pager, sl.total, sl.page, pageSize, function (p) {
            self2._memberPageNo = p;
            self2._renderMembers();
        });
    },

    _createMemberRow: function (tpl, member) {
        if (!tpl) return null;
        var row = cc.instantiate(tpl);
        row.name = "member_" + member.userid;

        this._setAvatar(row, "avatar", member.headimg, member.userid);
        this._setLabel(row, "name", member.name || "未知");
        this._setLabel(row, "uid", "ID:" + member.userid);
        this._setLabel(row, "gems", String(member.gems || 0));

        var self = this;
        var btns = { btn_del: "delete", btn_kick: "kick", btn_records: "records", btn_beans: "beanLogs", btn_partner: "setPartner", btn_addgems: "addGems" };
        for (var key in btns) {
            (function (action, btnKey) {
                var btn = row.getChildByName(btnKey);
                if (!btn) return;
                //已经是合伙人的成员, "设为合伙人"置灰且不再响应点击
                if (btnKey === "btn_partner" && member.is_partner) {
                    btn.opacity = 120;
                    var comp = btn.getComponent(cc.Button);
                    if (comp) { comp.interactable = false; }
                    return;
                }
                btn.on(cc.Node.EventType.TOUCH_END, function () {
                    self._onMemberAction(action, member);
                });
            })(btns[key], key);
        }

        return row;
    },

    // 给行内的 Label 节点填文字(节点固化在模板里,JS 只改内容)
    _setLabel: function (row, nodeName, text) {
        var n = row.getChildByName(nodeName);
        if (!n) return;
        var lbl = n.getComponent(cc.Label);
        if (lbl) lbl.string = text;
    },

    // 比例列: 抽水/暗水/费用 三个比例, 如 10/10/10
    _ratioText: function (p) {
        function n(v) { return Number(v) || 0; }
        return n(p.profit_ratio) + "/" + n(p.hidden_profit_ratio) + "/" + n(p.fee_profit_ratio);
    },
    // 比例列文字比单个数字长, 场景里节点宽度只有 100, 用 SHRINK 自动缩放避免被截成只剩一个数
    _setRatioLabel: function (row, text) {
        var n = row.getChildByName("ratio");
        if (!n) return;
        var lbl = n.getComponent(cc.Label);
        if (!lbl) return;
        lbl.overflow = cc.Label.Overflow.SHRINK;
        lbl.string = text;
    },

    //列表头像统一走ImageLoader,用接口最新headimg覆盖缓存,同一玩家换头像后也会刷新
    _setAvatar: function (row, nodeName, headimg, userid) {
        var n = row.getChildByName(nodeName);
        if (!n || !n.getComponent(cc.Sprite)) return;
        var loader = n.getComponent("ImageLoader") || n.addComponent("ImageLoader");
        if (!headimg || !(userid > 0)) {
            loader.clearAvatar();
            return;
        }
        var isLocal = /^avatar_\d{1,3}$/.test(headimg);
        if (cc.vv.baseInfoMap == null) { cc.vv.baseInfoMap = {}; }
        cc.vv.baseInfoMap[userid] = {
            localKey: isLocal ? headimg : null,
            url: isLocal ? null : headimg + ".jpg",
            ts: Date.now()
        };
        loader.setUserID(userid);
    },

    _onMemberAction: function (action, member) {
        var self = this;
        var userid = member.userid;
        var clubId = this._clubId;

        if (action === "delete") {
            this._confirm("确定删除成员 " + member.name + "?", function () {
                clubReq("/club_member/delete", { club_id: clubId, userid: userid }, function (ret) {
                    if (ret && ret.errcode === 0) {
                        self._loadMembers();
                    }
                });
            });
        } else if (action === "kick") {
            this._confirm("确定踢出成员 " + member.name + "?", function () {
                clubReq("/club_member/kick", { club_id: clubId, userid: userid }, function (ret) {
                    if (ret && ret.errcode === 0) {
                        self._loadMembers();
                    }
                });
            });
        } else if (action === "records") {
            this._showMemberRecords(member);
        } else if (action === "beanLogs") {
            this._showMemberBeanLogs(member);
        } else if (action === "addGems") {
            this._showMemberGemsDialog(member);
        } else if (action === "setPartner") {
            this._confirm("将 " + member.name + " 设为合伙人?", function () {
                clubReq("/club_member/set_partner", { club_id: clubId, userid: userid }, function (ret) {
                    if (ret && ret.errcode === 0) {
                        self._loadPartners();
                        self._loadMembers();
                    }
                });
            });
        }
    },

    // ============ 合伙人页 ============
    _bindPartnerPage: function () {
        var self = this;
        var page = this._pages.partner;
        if (!page) return;

        var addBtn = page.getChildByName("addPartnerBtn");
        if (addBtn) {
            addBtn.on(cc.Node.EventType.TOUCH_END, function () {
                self._showAddPartnerDialog();
            });
        }

        // 合伙人搜索: 支持按钮点击和输入框回车, 搜索后回到第 1 页
        this._partnerSearch = page.getChildByName("searchBox");
        var doPartnerSearch = function () {
            self._partnerPageNo = 1;
            self._renderPartners();
        };
        var searchBtn = page.getChildByName("searchBtn");
        if (searchBtn) { searchBtn.on(cc.Node.EventType.TOUCH_END, doPartnerSearch); }
        if (this._partnerSearch) { this._partnerSearch.on("editing-did-ended", doPartnerSearch); }

        var scroll = page.getChildByName("partnerScroll");
        if (scroll) {
            this._partnerScroll = scroll;
            this._partnerContent = scroll.getChildByName("content");
            this._partnerSv = scroll.getComponent(cc.ScrollView);
        }
        if (this._partnerContent) {
            var widget = this._partnerContent.getComponent(cc.Widget);
            if (widget) { widget.enabled = false; }
            // 场景里 content 的 Layout 类型是 NONE(未配置), 所有行会堆在原点重叠;
            // 强制改为纵向排列、随行数撑高, 与奖励页保持一致
            var lay = this._partnerContent.getComponent(cc.Layout);
            if (!lay) { lay = this._partnerContent.addComponent(cc.Layout); }
            lay.type = cc.Layout.Type.VERTICAL;
            lay.resizeMode = cc.Layout.ResizeMode.CONTAINER;
            lay.verticalDirection = cc.Layout.VerticalDirection.TOP_TO_BOTTOM;
            if (!lay.spacingY) { lay.spacingY = 16; }
            if (!lay.paddingTop) { lay.paddingTop = 10; }
            this._partnerLayout = lay;
            this._partnerContent.anchorY = 1;
        }
    },

    // 切到 partner 页时 Layout 可能在 inactive 状态没重算, 激活后再同步一次
    _refreshPartnerScroll: function () {
        if (!this._partnerContent || !this._partnerScroll) return;
        if (this._partnerLayout) { this._partnerLayout.updateLayout(); }
        // content anchorY=1 顶对齐 ScrollView 顶部
        this._partnerContent.y = this._partnerScroll.height / 2;
        if (this._partnerSv && this._partnerSv.node.activeInHierarchy) {
            this._partnerSv.scrollToTop(0.01);
        }
        // partnerStatsPage 同理
        var pc = this._partnerStatsContent;
        var ps = this._partnerStatsScroll || (this._pages.partnerStats && this._pages.partnerStats.getChildByName("statsScroll"));
        if (pc && ps) {
            if (!this._partnerStatsLayout) this._partnerStatsLayout = pc.getComponent(cc.Layout);
            if (!this._partnerStatsSv) this._partnerStatsSv = ps.getComponent(cc.ScrollView);
            this._partnerStatsScroll = ps;
            if (this._partnerStatsLayout) this._partnerStatsLayout.updateLayout();
            pc.y = ps.height / 2;
            if (this._partnerStatsSv && this._partnerStatsSv.node.activeInHierarchy) {
                this._partnerStatsSv.scrollToTop(0.01);
            }
        }
    },

    _renderPartners: function () {
        var content = this._partnerContent;
        console.log('[partnerPage render] content=', !!content, '_partners.length=', this._partners.length, 'this._partnerContent=', !!this._partnerContent);
        if (!content) return;
        // 模板行 rowTpl 固化在场景 content 下,JS 只克隆填数据
        var tpl = content.getChildByName("rowTpl");
        this._clearList(content, tpl);
        if (!tpl) return;
        tpl.active = false;

        // 只渲染直接下级(level=1, 归属当前顶级俱乐部的)
        var direct = this._partners.filter(function(p){ return (p.level || 1) === 1; });
        // 搜索过滤: 合伙人名称 / 社长昵称 / 社长ID / 合伙人ID
        var eb = this._partnerSearch ? this._partnerSearch.getComponent(cc.EditBox) : null;
        var kw = eb ? String(eb.string || "").replace(/^\s+|\s+$/g, "") : "";
        if (kw) {
            direct = direct.filter(function (p) {
                return String(p.id).indexOf(kw) >= 0
                    || (p.name && p.name.indexOf(kw) >= 0)
                    || (p.owner_name && p.owner_name.indexOf(kw) >= 0)
                    || (p.owner_userid && String(p.owner_userid).indexOf(kw) >= 0);
            });
        }
        console.log('[partnerPage render] direct children count=', direct.length, 'of total=', this._partners.length, 'kw=', kw);
        var pageSize = 20;
        var sl = this._pageSlice(direct, this._partnerPageNo, pageSize);
        this._partnerPageNo = sl.page;
        for (var i = 0; i < sl.rows.length; i++) {
            var p = sl.rows[i];
            var row = this._createPartnerRow(tpl, p);
            if (row) { row.parent = content; row.active = true; }
        }
        var self2 = this;
        var pager = this._getPager("partner", this._pages.partner, -this._pages.partner.height / 2 + 46);
        this._updatePager(pager, sl.total, sl.page, pageSize, function (p) {
            self2._partnerPageNo = p;
            self2._renderPartners();
        });
        // 强制重排一次,避免行添加时机导致的布局未刷新
        var lay = content.getComponent(cc.Layout);
        if (lay) { lay.updateLayout(); }
        // 位置设对 + 滚到顶
        this._partnerContent.y = this._partnerScroll.height / 2;
        if (this._partnerSv) { this._partnerSv.scrollToTop(0.01); }
        var contentPos = content.getPosition();
        console.log('[partnerPage render] done, content.children=' + content.children.length + ' contentSize=' + content.width + 'x' + content.height);
    },

    _createPartnerRow: function (tpl, partner, showLevelTag) {
        if (!tpl) return null;
        var row = cc.instantiate(tpl);
        row.name = "partner_" + partner.id;

        var ownerTxt = partner.owner_name ? (partner.owner_name + '(' + partner.owner_userid + ')') : '';

        this._setAvatar(row, "avatar", partner.headimg, partner.owner_userid);
        this._setLabel(row, "name", partner.name || "未命名");
        this._setLabel(row, "uid", ownerTxt || ("ID:" + partner.id));
        this._setLabel(row, "members", String(partner.member_count || 0));
        this._setLabel(row, "gems", String(Number(partner.total_gems) || 0));
        this._setRatioLabel(row, this._ratioText(partner));

        var self = this;
        var btns = { btn_gems: "gems", btn_ratio: "ratio", btn_profit: "profit", btn_del: "delete" };
        for (var key in btns) {
            (function (action) {
                var btn = row.getChildByName(key);
                if (!btn) return;
                btn.on(cc.Node.EventType.TOUCH_END, function (evt) {
                    evt.stopPropagation && evt.stopPropagation();
                    self._onPartnerAction(action, partner);
                });
            })(btns[key]);
        }

        // 下级按钮 btn_sub: 场景里手动加好, 这里只绑事件
        var btnSub = row.getChildByName("btn_sub");
        if (btnSub) {
            btnSub.on(cc.Node.EventType.TOUCH_END, function (evt) {
                evt.stopPropagation && evt.stopPropagation();
                self._showPartnerChildrenDialog(partner);
            });
        }

        return row;
    },

    _onPartnerAction: function (action, partner) {
        var self = this;
        var clubId = this._clubId;
        var partnerId = partner.id;

        if (action === "gems") {
            this._showPartnerGemsDialog(partner);
        } else if (action === "ratio") {
            this._showPartnerRatioDialog(partner);
        } else if (action === "profit") {
            this._showPartnerProfitDialog(partner);
        } else if (action === "delete") {
            this._confirm("确定删除合伙人 " + partner.name + "?", function () {
                clubReq("/partner/" + partnerId, { club_id: clubId }, function (ret) {
                    if (ret && ret.errcode === 0) {
                        self._loadPartners();
                    }
                }, "DELETE");
            });
        }
    },

    // ============ 合伙人统计页 ============
_bindPartnerStatsPage: function () {
    var page = this._pages.partnerStats;
    if (!page) return;
    var scroll = page.getChildByName('statsScroll');
    if (!scroll) return;
    var content = scroll.getChildByName('content');
    if (!content) return;
    this._partnerStatsContent = content;
    // 场景 content 挂了 cc.Widget(alignFlags=40=BOTTOM+VCENTER), 每次强制拉回底部导致行叠一起
    var widget = content.getComponent(cc.Widget);
    if (widget) { widget.enabled = false; }
    // 同合伙人页: 场景 Layout 类型为 NONE, 不排列子节点会导致行重叠
    var lay = content.getComponent(cc.Layout);
    if (!lay) { lay = content.addComponent(cc.Layout); }
    lay.type = cc.Layout.Type.VERTICAL;
    lay.resizeMode = cc.Layout.ResizeMode.CONTAINER;
    lay.verticalDirection = cc.Layout.VerticalDirection.TOP_TO_BOTTOM;
    if (!lay.spacingY) { lay.spacingY = 16; }
    if (!lay.paddingTop) { lay.paddingTop = 10; }
    this._partnerStatsLayout = lay;
    content.anchorY = 1;
    content.y = scroll.height / 2;
    var sv = scroll.getComponent(cc.ScrollView);
    if (sv) { sv.content = content; }
},

_renderPartnerStats: function () {
    var content = this._partnerStatsContent;
    if (!content) return;
    var tpl = content.getChildByName('rowTpl');
    this._clearList(content, tpl);
    if (!tpl) return;
    tpl.active = false;
    var self = this;
    // 只显示直接下级(level=1)
    var direct = this._partners.filter(function(p){ return (p.level || 1) === 1; });
    var pageSize = 20;
    var sl = this._pageSlice(direct, this._partnerStatsPageNo, pageSize);
    this._partnerStatsPageNo = sl.page;
    for (var i = 0; i < sl.rows.length; i++) {
        var p = sl.rows[i];
        var row = cc.instantiate(tpl);
        row.name = 'stats_' + p.id; row.active = true; row.parent = content;
        this._setAvatar(row, 'avatar', p.headimg, p.owner_userid);
        var ownerN = p.owner_name || '未命名';
        // partnerStatsPage 自己的 rowTpl 已带 label: name/uid/members/gems/ratio/rake/profit/total/btn_detail/avatar
        this._setLabel(row, 'name', p.name || '-');
        this._setLabel(row, 'uid', ownerN + '(' + p.owner_userid + ')');
        this._setLabel(row, 'members', String(p.member_count || 0));
        this._setLabel(row, 'gems', String(Number(p.total_gems) || 0));
        this._setRatioLabel(row, this._ratioText(p));
        this._setLabel(row, 'rake', String(Number(p.today_rake) || 0));
        this._setLabel(row, 'profit', String(Number(p.today_partner_profit) || 0));
        this._setLabel(row, 'total', String(Number(p.total_partner_profit) || 0));
        var btn = row.getChildByName('btn_detail');
        if (btn) {
            (function (partner) {
                btn.on(cc.Node.EventType.TOUCH_END, function () {
                    self._showPartnerBeanLogs(partner);
                });
            })(p);
        }
        // 下级按钮 btn_sub: 场景里手动加好, 这里只绑事件
        var btnSub = row.getChildByName('btn_sub');
        if (btnSub) {
            (function (partner) {
                btnSub.on(cc.Node.EventType.TOUCH_END, function () {
                    self._showPartnerChildrenDialog(partner);
                });
            })(p);
        }
    }
    var pager = this._getPager("partnerStats", this._pages.partnerStats, -this._pages.partnerStats.height / 2 + 46);
    this._updatePager(pager, sl.total, sl.page, pageSize, function (p) {
        self._partnerStatsPageNo = p;
        self._renderPartnerStats();
    });
    var lay = content.getComponent(cc.Layout);
    if (lay) { lay.updateLayout(); }
},

_bindRewardPage: function () {
        var page = this._pages.reward;
        if (!page) return;
        var scroll = page.getChildByName("rewardScroll");
        if (!scroll) return;
        var content = scroll.getChildByName("content");
        if (!content) return;
        this._rewardScroll = scroll;
        this._rewardSv = scroll.getComponent(cc.ScrollView);
        this._rewardContent = content;

        // 场景里 content 的 Layout 为 NONE, 高度固定 980 不随行数增长, 导致列表没有可滚动范围;
        // 改为 CONTAINER 由行数自动撑高, 并把 content 顶边对齐到 ScrollView 顶部
        var layout = content.getComponent(cc.Layout);
        if (!layout) {
            layout = content.addComponent(cc.Layout);
            layout.type = cc.Layout.Type.VERTICAL;
            layout.paddingTop = 10;
            layout.spacingY = 16;
        }
        layout.resizeMode = cc.Layout.ResizeMode.CONTAINER;
        layout.verticalDirection = cc.Layout.VerticalDirection.TOP_TO_BOTTOM;
        content.anchorY = 1;
        content.y = scroll.height / 2;
        this._rewardLayout = layout;
        if (this._rewardSv) { this._rewardSv.content = content; }

        // 列表上方「未领取 / 已领取」标签(表头右侧), 默认看未领取
        this._rewardFilter = 0;
        var self = this;
        var tabUn = this._find("tab_unclaimed", page);
        var tabCl = this._find("tab_claimed", page);
        this._rewardTabs = [tabUn, tabCl];
        if (tabUn) {
            tabUn.on(cc.Node.EventType.TOUCH_END, function () {
                if (self._rewardFilter === 0) return;
                self._rewardFilter = 0;
                self._rewardPageNo = 1;
                self._renderRewards();
            });
        }
        if (tabCl) {
            tabCl.on(cc.Node.EventType.TOUCH_END, function () {
                if (self._rewardFilter === 1) return;
                self._rewardFilter = 1;
                self._rewardPageNo = 1;
                self._renderRewards();
            });
        }
        // 两个按钮右侧: 未领取/已领取 总金额
        this._rewardTotalUn = this._find("lbl_unclaimed_total", page);
        this._rewardTotalCl = this._find("lbl_claimed_total", page);
        // 一键领取: 只在"未领取"标签下且有待领取时显示
        var btnAll = this._find("btn_claim_all", page);
        this._rewardClaimAllBtn = btnAll;
        if (btnAll) {
            btnAll.on(cc.Node.EventType.TOUCH_END, function () {
                self._claimAllRewards();
            });
        }
    },

    // 金额显示: 最多两位小数, 去掉无意义的0
    _fmtRewardAmount: function (v) {
        var n = Number(v);
        if (!isFinite(n)) n = 0;
        return String(parseFloat(n.toFixed(2)));
    },

    // 一键领取当前俱乐部全部未领取奖励
    _claimAllRewards: function () {
        if (this._claiming || this._claimingAll) return;
        var self = this;
        this._claimingAll = true;
        clubReq("/reward_claim_all", { club_id: this._clubId }, function (ret) {
            self._claimingAll = false;
            if (ret && ret.errcode === 0) {
                self._loadRewards();
            }
        });
    },

    // 刷新两个标签的文字(带总数)、总金额、选中态
    _updateRewardTabs: function (unclaimed, claimed, unAmt, clAmt) {
        var tabs = this._rewardTabs || [];
        var texts = ["未领取(" + unclaimed + ")", "已领取(" + claimed + ")"];

        // 总金额
        if (this._rewardTotalUn) {
            var u = this._rewardTotalUn.getComponent(cc.Label);
            if (u) { u.string = "未领取总金额：" + this._fmtRewardAmount(unAmt); }
        }
        if (this._rewardTotalCl) {
            var c = this._rewardTotalCl.getComponent(cc.Label);
            if (c) { c.string = "已领取总金额：" + this._fmtRewardAmount(clAmt); }
        }
        // 一键领取按钮: 仅未领取标签且有条目时显示
        if (this._rewardClaimAllBtn) {
            this._rewardClaimAllBtn.active = (this._rewardFilter === 0 && unclaimed > 0);
        }

        for (var i = 0; i < 2; i++) {
            var tab = tabs[i];
            if (!tab || !cc.isValid(tab)) continue;
            var lbNode = tab.getChildByName("Label");
            var lb = lbNode ? lbNode.getComponent(cc.Label) : null;
            if (lb) { lb.string = texts[i]; }
            var sel = (this._rewardFilter === i);
            var col = sel ? cc.color(255, 255, 255) : cc.color(150, 150, 150);
            tab.color = col;
            // 按钮是颜色过渡模式, 不改 normalColor 的话触摸后会被还原成白色
            var btn = tab.getComponent(cc.Button);
            if (btn && btn.transition === cc.Button.Transition.COLOR) {
                btn.normalColor = col;
                btn.hoverColor = col;
                btn.pressedColor = col;
            }
        }
    },

    // 手动领取一条奖励(服务端到账并标记已领取)
    _claimReward: function (reward, btn) {
        if (!reward || this._claiming) return;
        var self = this;
        this._claiming = true;
        if (btn) { btn.active = false; }
        clubReq("/reward_claim", { club_id: this._clubId, id: reward.id }, function (ret) {
            self._claiming = false;
            if (ret && ret.errcode === 0) {
                reward.claim_status = 1;
                reward.claim_time = Math.floor(Date.now() / 1000);
                self._renderRewards();
            } else if (btn && cc.isValid(btn)) {
                btn.active = true;
            }
        });
    },

    _renderRewards: function () {
        var content = this._rewardContent;
        if (!content) return;
        // 模板行 rowTpl 固化在场景 content 下,JS 只克隆填数据
        var tpl = content.getChildByName("rowTpl");
        this._clearList(content, tpl);
        if (!tpl) return;
        tpl.active = false;

        // 统计已领取/未领取总数, 并按当前标签过滤
        var all = this._rewards || [];
        var unclaimed = 0, claimed = 0, unAmt = 0, clAmt = 0;
        for (var n = 0; n < all.length; n++) {
            var amt = Number(all[n].amount) || 0;
            if (Number(all[n].claim_status) === 1) { claimed++; clAmt += amt; }
            else { unclaimed++; unAmt += amt; }
        }
        var filter = (this._rewardFilter === 1) ? 1 : 0;
        var matched = [];
        for (var n2 = 0; n2 < all.length; n2++) {
            var rr = all[n2];
            if (((Number(rr.claim_status) === 1) ? 1 : 0) === filter) { matched.push(rr); }
        }
        // 只渲染当前页
        var pageSize = 20;
        var sl = this._pageSlice(matched, this._rewardPageNo, pageSize);
        this._rewardPageNo = sl.page;
        for (var i = 0; i < sl.rows.length; i++) {
            var row = this._createRewardRow(tpl, sl.rows[i]);
            if (row) { row.parent = content; row.active = true; }
        }
        var self2 = this;
        var pager = this._getPager("reward", this._pages.reward, -this._pages.reward.height / 2 + 46);
        this._updatePager(pager, sl.total, sl.page, pageSize, function (p) {
            self2._rewardPageNo = p;
            self2._renderRewards();
        });
        this._updateRewardTabs(unclaimed, claimed, unAmt, clAmt);
        // 行克隆完成后按实际行数重新计算 content 高度(可滚动), 并回到顶部
        this._refreshRewardScroll();
    },

    // 按实际行数重算滚动区域高度并回到顶部(切换页面时 content 可能还没激活过, 这里再同步一次)
    _refreshRewardScroll: function () {
        if (!this._rewardContent) return;
        if (this._rewardLayout) { this._rewardLayout.updateLayout(); }
        if (this._rewardScroll) { this._rewardContent.y = this._rewardScroll.height / 2; }
        if (this._rewardSv && this._rewardSv.node.activeInHierarchy && this._rewards.length > 0) {
            this._rewardSv.scrollToTop(0.01);
        }
    },

    _createRewardRow: function (tpl, reward) {
        if (!tpl) return null;
        var row = cc.instantiate(tpl);
        row.name = "reward_" + reward.id;

        this._setLabel(row, "type", this._rewardTypeName(reward.reward_type));
        this._setLabel(row, "amount", String(Number(reward.amount) || 0));
        this._setLabel(row, "game", this._rewardGameName(reward));
        this._setLabel(row, "room", String(reward.roomid || 0));
        this._setLabel(row, "date", new Date(reward.create_time * 1000).toLocaleString());

        // 状态 + 领取按钮(已领取的行不显示按钮)
        var claimed = (Number(reward.claim_status) === 1);
        var stNode = row.getChildByName("status");
        if (stNode) {
            var stLb = stNode.getComponent(cc.Label);
            if (stLb) { stLb.string = claimed ? "已领取" : "未领取"; }
            stNode.color = claimed ? cc.color(120, 220, 120) : cc.color(255, 210, 90);
        }
        var btn = row.getChildByName("btn_claim");
        if (btn) {
            btn.active = !claimed;
            if (!claimed) {
                (function (self, rw, b) {
                    b.on(cc.Node.EventType.TOUCH_END, function () {
                        self._claimReward(rw, b);
                    });
                })(this, reward, btn);
            }
        }

        return row;
    },

    // 奖励类型: 明确写出是什么奖励(抽水/暗水/合伙人分成/房费/表情扣豆/洗牌扣豆)
    // 老数据里的"游戏奖励"实际是合伙人分成, 统一显示成清楚的名字
    _rewardTypeName: function (t) {
        var s = String(t || "");
        if (!s) return "其他";
        if (s === "游戏奖励") return "合伙人分成";
        return s;
    },

    // 玩法列: 显示玩家在牌桌管理里录入的真实牌桌名称, 没有桌名才回退玩法名
    _rewardGameName: function (reward) {
        var tn = reward && reward.table_name ? String(reward.table_name) : "";
        if (tn) return tn;
        var type = reward ? reward.game_type : "";
        var name = this._gameTypeName(type);
        if (name && name !== type) return name;
        var s = String(type || "");
        if (s.indexOf("baobao_mian") === 0) return "六宝免摆";
        if (s.indexOf("baobao_shou") === 0) return "六宝手动";
        if (s.indexOf("baobao") === 0) return "六宝";
        return name || "-";
    },

    // ============ 玩法管理页 ============
    _bindGameConfigPage: function () {
        var self = this;
        var page = this._pages.gameConfig;
        if (!page) return;

        this._gameTypeList = page.getChildByName("typeList");
        this._gameConfigList = page.getChildByName("configList");

        var newBtn = page.getChildByName("newBtn");
        if (newBtn) {
            newBtn.on(cc.Node.EventType.TOUCH_END, function () {
                // 新玩法默认用左侧当前选中的总玩法
                self._showGameConfigDialog(null, self._selectedGameType);
            });
        }
    },

    _renderGameConfigs: function () {
        var self = this;
        var list = this._gameConfigList;
        if (!list) return;
        // 左侧: 本俱乐部已有玩法; 右侧: 当前玩法下已添加的牌桌
        this._renderGameTypes();
        // 牌桌卡片模板 configRowTpl 固化在场景 configList 下,JS 只克隆填数据
        var tpl = list.getChildByName("configRowTpl");
        this._clearList(list, tpl);
        if (!tpl) return;
        tpl.active = false;

        // 当前玩法下的牌桌, 只渲染当前页
        var tables = this._clubTables.filter(function (t) {
            return String(t.game_type) === String(self._selectedGameType);
        });
        var pageSize = 4;
        var sl = this._pageSlice(tables, this._tablePageNo, pageSize);
        this._tablePageNo = sl.page;
        for (var i = 0; i < sl.rows.length; i++) {
            var row = this._createTableRow(tpl, sl.rows[i]);
            if (row) { row.parent = list; row.active = true; }
        }
        var pager = this._getPager("gameTables", this._pages.gameConfig, -this._pages.gameConfig.height / 2 + 46);
        this._updatePager(pager, sl.total, sl.page, pageSize, function (p) {
            self._tablePageNo = p;
            self._renderGameConfigs();
        });
    },

    // 左侧玩法列表: 本俱乐部已有的玩法(含一级俱乐部继承下来的), 点击切换右侧牌桌列表
    _renderGameTypes: function () {
        var list = this._gameTypeList;
        if (!list) return;
        var tpl = list.getChildByName("typeTpl");
        this._clearList(list, tpl);
        if (!tpl) return;
        tpl.active = false;

        var self = this;
        var seen = {};
        var types = [];
        for (var i = 0; i < this._gameConfigs.length; i++) {
            var t = String(this._gameConfigs[i].game_type || "");
            if (!t || seen[t]) continue;
            seen[t] = true;
            types.push(t);
        }
        for (var j = 0; j < types.length; j++) {
            (function (type) {
                var node = cc.instantiate(tpl);
                node.name = "type_" + type;
                var sel = (self._selectedGameType === type);
                // 每行背景: bgOff(黄底) / bgOn(红底选中), 文字挂在 Label 子节点
                var bgOff = node.getChildByName("bgOff");
                var bgOn = node.getChildByName("bgOn");
                if (bgOff) bgOff.active = !sel;
                if (bgOn) bgOn.active = sel;
                var lblNode = node.getChildByName("Label");
                var lbl = lblNode ? lblNode.getComponent(cc.Label) : node.getComponent(cc.Label);
                if (lbl) lbl.string = self._gameTypeName(type);
                if (lblNode) lblNode.color = sel ? cc.color(255, 255, 255) : cc.color(60, 40, 0);
                node.on(cc.Node.EventType.TOUCH_END, function () {
                    self._selectedGameType = type;
                    self._loadClubTables();
                });
                node.parent = list;
                node.active = true;
            })(types[j]);
        }
    },

    // 右侧一行 = 一张牌桌
    _createTableRow: function (tpl, table) {
        if (!tpl) return null;
        var row = cc.instantiate(tpl);
        row.name = "table_" + table.id;

        this._setLabel(row, "cname", table.name || ("牌桌" + table.id));

        var conf = {};
        try { conf = JSON.parse(table.conf || "{}") || {}; } catch (e) { conf = {}; }
        // 宝宝玩法: 底分/局数/人数/进场/离场; 其它玩法(二人/四人): 只看底分/局数
        var isBaobao = String(conf.type || table.game_type || "").indexOf("baobao") === 0;
        var summary = "底分:" + (conf.difen_value != null ? conf.difen_value : "-")
            + " 局数:" + (conf.jushu_value != null ? conf.jushu_value : "-");
        if (isBaobao) {
            summary += " 人数:" + (conf.min_players || 2) + "-" + (conf.max_players || table.max_players || 2) + "人"
                + " 进场:" + (conf.min_bean || 0) + " 离场:" + (conf.kick_bean || 0);
        }
        this._setLabel(row, "params", summary);

        var self = this;
        // 关闭按钮: 切换该牌桌所属玩法配置的启用状态, 文字随状态变(关闭/开启)
        var closeBtn = row.getChildByName("btn_close");
        if (closeBtn) {
            var cfg = this._findConfigForTable(table);
            var enabled = !!(cfg && Number(cfg.enabled));
            this._setNodeLabel(closeBtn.getChildByName("Label"), enabled ? "关闭" : "开启");
            closeBtn.on(cc.Node.EventType.TOUCH_END, function () {
                self._toggleTableConfig(table);
            });
        }

        var editBtn = row.getChildByName("btn_edit");
        if (editBtn) {
            editBtn.on(cc.Node.EventType.TOUCH_END, function () {
                self._editTable(table);
            });
        }
        var delBtn = row.getChildByName("btn_del");
        if (delBtn) {
            delBtn.on(cc.Node.EventType.TOUCH_END, function () {
                self._deleteTable(table);
            });
        }

        return row;
    },

    // 牌桌绑定的玩法配置;没有绑定则取同类型的第一个本俱乐部配置
    _findConfigForTable: function (table) {
        var cid = Number(table.game_config_id) || 0;
        var sameType = null;
        for (var i = 0; i < this._gameConfigs.length; i++) {
            var cfg = this._gameConfigs[i];
            if (cid > 0 && Number(cfg.id) === cid) return cfg;
            if (!sameType && String(cfg.game_type) === String(table.game_type) && Number(cfg.inherited) !== 1) sameType = cfg;
        }
        return sameType;
    },

    _editTable: function (table) {
        var cfg = this._findConfigForTable(table);
        // 编辑的是这张牌桌自己的参数, 保存只写该牌桌的conf, 同玩法其它牌桌不受影响
        this._showGameConfigDialog(this._tableAsDlgCfg(table, cfg), null, table);
    },

    // 把牌桌conf整理成弹窗需要的字段(缺的字段用玩法配置兜底)
    _tableAsDlgCfg: function (table, cfg) {
        var conf = {};
        try { conf = JSON.parse(table.conf || "{}") || {}; } catch (e) { conf = {}; }
        var num = function (v, def) {
            return (v != null && v !== '' && !isNaN(Number(v))) ? Number(v) : def;
        };
        var difen = num(conf.difen_value, null);
        if (difen == null && conf.difen != null && cfg && cfg.difen_options) {
            difen = cfg.difen_options[Number(conf.difen) || 0];
        }
        if (difen == null) { difen = (cfg && cfg.difen_options && cfg.difen_options[0]) || 1; }
        var jushu = num(conf.jushu_value, 0);
        if (!(jushu > 0)) { jushu = (cfg && cfg.jushu_options && cfg.jushu_options[0]) || 8; }
        var cost = num(conf.cost, null);
        if (cost == null) { cost = (cfg && cfg.cost_options && cfg.cost_options.length) ? Number(cfg.cost_options[0]) : 2; }
        return {
            id: cfg ? cfg.id : 0,
            game_type: table.game_type,
            name: table.name || (cfg ? cfg.name : ""),
            inherited: 0,
            difen_options: [difen],
            jushu_options: [jushu],
            cost_options: [cost],
            min_players: num(conf.min_players, cfg ? cfg.min_players : 2),
            max_players_custom: num(conf.max_players, cfg ? cfg.max_players_custom : 6),
            face_score: num(conf.face_score, cfg ? cfg.face_score : 0),
            shuffle_score: num(conf.shuffle_score, cfg ? cfg.shuffle_score : 0),
            min_bean: num(conf.min_bean, cfg ? cfg.min_bean : 0),
            kick_bean: num(conf.kick_bean, cfg ? cfg.kick_bean : 0),
            rake_percent: num(conf.rake_percent, cfg ? cfg.rake_percent : 0),
            hidden_rake_percent: num(conf.hidden_rake_percent, cfg ? cfg.hidden_rake_percent : 0),
            rake_per_round: num(conf.rake_per_round, (cfg && cfg.rake_per_round != null) ? cfg.rake_per_round : 1),
            room_fee: num(conf.room_fee, cfg ? cfg.room_fee : 0),
            room_fee_payer: num(conf.room_fee_payer, (cfg && cfg.room_fee_payer != null) ? cfg.room_fee_payer : 1)
        };
    },

    // 关闭/开启该牌桌所属的玩法配置
    _toggleTableConfig: function (table) {
        var self = this;
        var cfg = this._findConfigForTable(table);
        if (!cfg) { this._tip("该牌桌没有可修改的玩法配置"); return; }
        if (Number(cfg.inherited) === 1) { this._tip("一级俱乐部的玩法请到上级俱乐部修改"); return; }
        var next = Number(cfg.enabled) ? 0 : 1;
        clubReq("/club_game_config/" + cfg.id + "/close", { club_id: this._clubId, enabled: next }, function (ret) {
            if (ret && ret.errcode === 0) {
                self._tip(next ? "已开启" : "已关闭");
                self._loadGameConfigs();
            } else {
                self._tip(ret && ret.errmsg ? ret.errmsg : "操作失败");
            }
        });
    },

    // 删除的是牌桌, 不是玩法
    _deleteTable: function (table) {
        var self = this;
        this._confirm("确定删除牌桌 " + (table.name || table.id) + "?", function () {
            clubReq("/club_admin/table_delete", { club_id: self._clubId, id: table.id }, function (ret) {
                if (ret && ret.errcode === 0) {
                    self._tip("已删除");
                    self._loadGameConfigs();
                } else {
                    self._tip(ret && ret.errmsg ? ret.errmsg : "删除失败");
                }
            });
        });
    },

    // ============ 页面切换 ============
    _showPage: function (key, noLoad) {
        this._currentPage = key;
        for (var k in this._pages) {
            this._pages[k].active = (k === key);
        }
        // 菜单选中态: 每个按钮下都有 selBg 节点(选中图), 只切 active, 不改任何位置尺寸
        if (this._menuBtns) {
            for (var m in this._menuBtns) {
                var sel = this._menuBtns[m].getChildByName("selBg");
                if (sel) { sel.active = (m === key); }
            }
        }
        if (noLoad) return;
        // 奖励明细页激活后再同步一次滚动区域(切页复用时 Layout 可能在未激活状态下没重算)
        if (key === "reward") { this._refreshRewardScroll(); }
        if (key === "partner" || key === "partnerStats") { this._refreshPartnerScroll(key); }
        // 没有俱乐部ID时不发 club_id=null 的请求
        if (!(this._clubId > 0)) return;
        if (key === "overview") this._loadOverview();
        else if (key === "member") this._loadMembers();
        else if (key === "partner") this._loadPartners();
        else if (key === "partnerStats") this._loadPartners(); // 统计页也用合伙人数据
        else if (key === "reward") this._loadRewards();
        else if (key === "gameConfig") this._loadGameConfigs();
    },

    // ============ 数据加载(全部真实数据, 无演示兜底) ============
    _loadClubInfo: function () {
        if (!(this._clubId > 0)) this._clubId = this._resolveClubId();
        if (!(this._clubId > 0) || !this._canRequest()) {
            this._members = [];
            this._partners = [];
            this._gameConfigs = [];
            this._rewards = [];
            this._overview = {};
            if (this._clubInfoLabel) {
                this._clubInfoLabel.getComponent(cc.Label).string = "俱乐部: 未登录或未选择俱乐部";
            }
            if (this._myGemsLabel) {
                this._myGemsLabel.getComponent(cc.Label).string = "我的豆豆: 0";
            }
            this._renderOverview();
            this._renderMembers();
            this._renderPartners();
            this._renderPartnerStats();
            this._renderGameConfigs();
            this._renderRewards();
            return;
        }
        // 先把各列表按空数据渲染一遍, 清掉场景里遗留的示例行, 再拉真实数据
        this._renderOverview();
        this._renderMembers();
        this._renderPartners();
        this._renderPartnerStats();
        this._renderGameConfigs();
        this._renderRewards();
        // 首屏数据
        this._loadOverview();
        this._loadMembers();
        this._loadPartners();
        this._loadGameConfigs();
        this._loadRewards();
    },

    _canRequest: function () {
        return !!(cc.vv && cc.vv.http && cc.vv.http.sendRequest);
    },

    _loadOverview: function () {
        if (!this._canRequest()) { return; }
        var self = this;
        clubReq("/club_overview", { club_id: this._clubId }, function (ret) {
            self._overview = (ret && ret.errcode === 0 && ret.data) ? ret.data : {};
            self._renderOverview();
        });
    },

    _loadMembers: function () {
        if (!this._canRequest()) { return; }
        var self = this;
        clubReq("/club_members_detail", { club_id: this._clubId }, function (ret) {
            self._members = (ret && ret.errcode === 0 && ret.data) ? ret.data : [];
            self._renderMembers();
        });
    },

    _loadPartners: function () {
        if (!this._canRequest()) { return; }
        var self = this;
        clubReq("/partners", { club_id: this._clubId }, function (ret) {
            self._partners = (ret && ret.errcode === 0 && ret.data) ? ret.data : [];
            console.log('[loadPartners] _partners.length=', self._partners.length, 'raw=', JSON.stringify(self._partners).substring(0, 200));
            self._renderPartners();
            self._renderPartnerStats();
        });
    },

    _loadGameConfigs: function () {
        if (!this._canRequest()) { return; }
        var self = this;
        // 玩法配置同时用于左侧玩法列表和"修改牌桌"时取配置内容
        clubReq("/club_game_configs", { club_id: this._clubId }, function (ret) {
            self._gameConfigs = (ret && ret.errcode === 0 && ret.data) ? ret.data : [];
            // 每个玩法各自的收费模式开关: 关闭时抽水/暗水/房费/表情/洗牌置灰, 只留房卡可编辑
            self._gameUnified = (ret && ret.unified) ? ret.unified : {};
            // /game_list 只用来取玩法的显示名称
            clubReq("/game_list", {}, function (gret) {
                self._allGameTypes = (gret && gret.errcode === 0 && gret.games) ? gret.games : [];
                // 左侧只列本俱乐部已有玩法, 选中项不在其中时切到第一个
                if (!self._selectedGameType || !self._hasClubGameType(self._selectedGameType)) {
                    self._selectedGameType = self._gameConfigs.length ? String(self._gameConfigs[0].game_type) : "";
                }
                self._loadClubTables();
            });
        });
    },

    _hasClubGameType: function (type) {
        for (var i = 0; i < this._gameConfigs.length; i++) {
            if (String(this._gameConfigs[i].game_type) === String(type)) return true;
        }
        return false;
    },

    _findGameType: function (type) {
        var games = this._allGameTypes || [];
        for (var i = 0; i < games.length; i++) {
            if (String(games[i].type) === String(type)) return games[i];
        }
        return null;
    },

    _gameTypeName: function (type) {
        // 优先显示后台添加玩法时填写的自定义玩法名(t_club_games.name), 本俱乐部自己的配置优先于继承配置
        if (type && this._gameConfigs) {
            var inheritedName = "";
            for (var i = 0; i < this._gameConfigs.length; i++) {
                var c = this._gameConfigs[i];
                if (String(c.game_type) !== String(type)) continue;
                var n = String(c.name || "");
                if (!n) continue;
                if (Number(c.inherited) !== 1) return n;
                if (!inheritedName) inheritedName = n;
            }
            if (inheritedName) return inheritedName;
        }
        var g = this._findGameType(type);
        return (g && g.name) ? g.name : (type || "");
    },

    // 右侧牌桌列表: 只取当前左侧选中的玩法
    _loadClubTables: function () {
        if (!this._canRequest()) { return; }
        if (!this._selectedGameType) {
            this._clubTables = [];
            this._renderGameConfigs();
            return;
        }
        var self = this;
        this._tablePageNo = 1;
        clubReq("/club_tables", { clubid: this._clubId, game_type: this._selectedGameType, all: 1 }, function (ret) {
            self._clubTables = (ret && ret.errcode === 0 && ret.tables) ? ret.tables : [];
            self._renderGameConfigs();
        });
    },

    _loadRewards: function () {
        if (!this._canRequest()) { return; }
        var self = this;
        clubReq("/rewards", { club_id: this._clubId }, function (ret) {
            self._rewards = (ret && ret.errcode === 0 && ret.data) ? ret.data : [];
            self._renderRewards();
        });
    },

    // ============ 工具函数 ============
    _createLabel: function (text, fontSize, color) {
        var node = new cc.Node("label");
        var label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        node.color = color || new cc.Color(255, 255, 255);
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        return node;
    },

    // ============ 弹窗(节点全部固化在场景 popups 下, JS 只填数据) ============
    // 收入统计筛选条: 场景里可能是旧的 EditBox 版本(编辑器会回写场景), 这里在运行时统一改造成
    // 「月份下拉 / 开始日期 / 结束日期 / 下级俱乐部分」按钮 + 日历选择器, 不依赖场景文件改动
    _prepareStatUI: function (content) {
        var root = this.node.getChildByName("popups");
        if (!root) { return; }
        // 1) 输入框 -> 按钮
        var defs = [
            { src: "monthInput", dst: "monthBtn", text: "选择月份" },
            { src: "fromInput", dst: "fromBtn", text: "开始日期" },
            { src: "toInput", dst: "toBtn", text: "结束日期" },
            { src: "pidInput", dst: "pidBtn", text: "全部俱乐部" }
        ];
        for (var i = 0; i < defs.length; i++) {
            var node = content.getChildByName(defs[i].dst) || content.getChildByName(defs[i].src);
            if (!node) { continue; }
            node.name = defs[i].dst;
            var eb = node.getComponent(cc.EditBox);
            if (eb) { eb.enabled = false; eb.destroy(); }
            if (!node.getComponent(cc.Button)) { node.addComponent(cc.Button); }
            var tl = node.getChildByName("TEXT_LABEL");
            if (tl) {
                tl.active = true;
                var lb = tl.getComponent(cc.Label);
                if (lb && !lb.string) { lb.string = defs[i].text; }
            }
            var pl = node.getChildByName("PLACEHOLDER_LABEL");
            if (pl) { pl.active = false; }
        }
        // 回显文字过长时截断, 不超出按钮
        var btns = ["monthBtn", "fromBtn", "toBtn", "pidBtn"];
        for (var b = 0; b < btns.length; b++) {
            var bn = content.getChildByName(btns[b]);
            if (!bn) { continue; }
            var tl2 = bn.getChildByName("TEXT_LABEL") || bn.getChildByName("Label");
            if (!tl2) { continue; }
            var l2 = tl2.getComponent(cc.Label);
            if (l2) {
                tl2.setContentSize(240, 50);
                l2.overflow = cc.Label.Overflow.CLAMP;
                l2.enableWrapText = false;
            }
        }
        // 2) 下拉面板
        if (!content.getChildByName("filterDrop")) {
            var drop = new cc.Node("filterDrop");
            drop.parent = content;
            drop.setContentSize(560, 660);
            drop.setPosition(0, -85);
            var sp = drop.addComponent(cc.Sprite);
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            var psp = content.parent ? content.parent.getComponent(cc.Sprite) : null;
            if (psp) { sp.spriteFrame = psp.spriteFrame; }
            var lay = drop.addComponent(cc.Layout);
            lay.type = cc.Layout.Type.VERTICAL;
            lay.spacingY = 6;
            lay.paddingTop = 10;
            lay.paddingBottom = 10;
            var tplSrc = this._find("gameTypeItemTpl");
            if (tplSrc) {
                var tpl = cc.instantiate(tplSrc);
                tpl.name = "dropItemTpl";
                tpl.parent = drop;
                tpl.setContentSize(500, 56);
                tpl.active = false;
                var lblNode = tpl.getChildByName("Label");
                if (lblNode) {
                    lblNode.setContentSize(480, 50);
                    var lbl = lblNode.getComponent(cc.Label);
                    if (lbl) { lbl.string = ""; }
                }
            }
            drop.active = false;
        }
    },

    // 下级俱乐部弹窗: 场景里没有独立窗口, 之前兜底复用乐豆明细窗口导致列内容对不上。
    // 这里克隆乐豆明细窗口, 改成 4 列: 加入时间 / 昵称ID / 现在豆豆数 / 历史总赢亏
    _preparePartnerChildrenUI: function (root) {
        if (root.getChildByName("partnerChildrenWin")) { return; }
        var src = root.getChildByName("partnerBeanLogsWin");
        if (!src) { return; }
        // 乐豆明细列头之前被改成下级用的, 还原成豆豆流水
        var srcPanel = src.getChildByName("panel");
        var srcContent = srcPanel ? srcPanel.getChildByName("content") : null;
        if (srcContent) {
            var amt = srcContent.getChildByName("colAmount");
            if (amt) { var al = amt.getComponent(cc.Label); if (al) { al.string = "数量"; } }
        }
        var win = cc.instantiate(src);
        win.name = "partnerChildrenWin";
        win.active = false;
        root.addChild(win);
        var panel = win.getChildByName("panel");
        var content = panel ? panel.getChildByName("content") : null;
        if (!content) { return; }
        var title = this._popupTitle(panel);
        if (title) { var tl = title.getComponent(cc.Label); if (tl) { tl.string = "下级俱乐部"; } }
        var tip = content.getChildByName("tipLabel");
        if (tip) { tip.active = false; }
        var av = content.getChildByName("avatar");
        if (av) { av.active = false; }
        var xs = [-540, -180, 190, 540];
        var widths = [300, 340, 240, 240];
        var heads = [["colTime", "加入时间"], ["colType", "昵称ID"], ["colAmount", "现在豆豆数"], ["colRoom", "历史总赢亏"]];
        for (var i = 0; i < heads.length; i++) {
            var c = content.getChildByName(heads[i][0]);
            if (!c) { continue; }
            c.setPosition(xs[i], 350);
            c.setContentSize(widths[i], 50);
            var l = c.getComponent(cc.Label);
            if (l) { l.string = heads[i][1]; }
        }
        var colRemark = content.getChildByName("colRemark");
        if (colRemark) { colRemark.removeFromParent(); }
        var tpl = content.getChildByName("rowTpl");
        if (!tpl) { return; }
        var cells = ["time", "type", "amount", "room"];
        for (var j = 0; j < cells.length; j++) {
            var cell = tpl.getChildByName(cells[j]);
            if (!cell) { continue; }
            cell.setPosition(xs[j], 0);
            cell.setContentSize(widths[j], 50);
            cell.setSiblingIndex(j);
            var cl = cell.getComponent(cc.Label);
            if (cl) {
                cl.string = "";
                cl.enableWrapText = false;
                cl.overflow = (j <= 1) ? cc.Label.Overflow.SHRINK : cc.Label.Overflow.CLAMP;
            }
        }
        var remark = tpl.getChildByName("remark");
        if (remark) { remark.removeFromParent(); }
        for (var k = 0; k < tpl.children.length; k++) { tpl.children[k].active = true; }
    },

    // 弹窗标题可能挂在 panel 下的子节点里(如 New Sprite/titleLabel), 递归找
    _popupTitle: function (panel) {
        if (!panel) { return null; }
        return panel.getChildByName("titleLabel") || this._find("titleLabel", panel) || this._find("title", panel);
    },

    _bindPopups: function () {
        var self = this;
        this._popups = {};
        this._rakePerRound = 1;
        this._roomFeePayer = 1;
        this._gemsMode = 1; // 1=加豆豆 -1=减豆豆(减豆豆时仍输入正数)
        var root = this.node.getChildByName("popups");
        if (!root) { return; }
        // 收入统计: 先把筛选条改造成下拉/日期选择器(场景可能被编辑器回写成旧版)
        (function () {
            var statWin = root.getChildByName("incomeStatsWin");
            var statPanel = statWin ? statWin.getChildByName("panel") : null;
            var statContent = statPanel ? statPanel.getChildByName("content") : null;
            if (statContent) { self._prepareStatUI(statContent); }
        })();
        // 下级俱乐部: 场景没有独立窗口时, 运行时克隆乐豆明细窗口改成 6 列
        this._preparePartnerChildrenUI(root);
        var names = ["memberRecordsWin", "memberBeanLogsWin", "partnerBeanLogsWin", "partnerChildrenWin", "partnerGemsWin", "partnerRatioWin", "partnerProfitWin", "incomeStatsWin", "datePickerWin", "gameConfigWin", "confirmWin", "addMemberWin", "addPartnerWin"];
        for (var i = 0; i < names.length; i++) {
            // IIFE 固定每个弹窗自己的 win, 否则回调里全部指向最后一个弹窗
            (function (nm) {
                var win = root.getChildByName(nm);
                if (!win) { return; }
                self._popups[nm] = win;
                var panel = win.getChildByName("panel");
                if (!panel) { return; }
                var closeBtn = panel.getChildByName("closeBtn");
                if (closeBtn) { closeBtn.on(cc.Node.EventType.TOUCH_END, function () { win.active = false; }); }
                var content = panel.getChildByName("content");
                if (!content) { return; }
                var okBtn = content.getChildByName("okBtn");
                if (okBtn) { okBtn.on(cc.Node.EventType.TOUCH_END, function () { self._onPopupOk(nm); }); }
                var cancelBtn = content.getChildByName("cancelBtn");
                if (cancelBtn) { cancelBtn.on(cc.Node.EventType.TOUCH_END, function () { win.active = false; }); }
                if (nm === "incomeStatsWin") {
                    var qBtn = content.getChildByName("queryBtn");
                    if (qBtn) { qBtn.on(cc.Node.EventType.TOUCH_END, function () { self._queryIncomeStats(); }); }
                    var totalNode = content.getChildByName("totalLabel");
                    if (totalNode) { self._statTotalLabel = totalNode.getComponent(cc.Label); }
                    var mb = content.getChildByName("monthBtn");
                    if (mb) {
                        self._statMonthBtn = mb;
                        self._statMonthLabel = self._btnLabel(mb);
                        mb.on(cc.Node.EventType.TOUCH_END, function () { self._toggleStatDrop("month"); });
                    }
                    var fb = content.getChildByName("fromBtn");
                    if (fb) {
                        self._statFromBtn = fb;
                        self._statFromLabel = self._btnLabel(fb);
                        fb.on(cc.Node.EventType.TOUCH_END, function () { self._openStatDatePicker("from"); });
                    }
                    var tb = content.getChildByName("toBtn");
                    if (tb) {
                        self._statToBtn = tb;
                        self._statToLabel = self._btnLabel(tb);
                        tb.on(cc.Node.EventType.TOUCH_END, function () { self._openStatDatePicker("to"); });
                    }
                    var pb = content.getChildByName("pidBtn");
                    if (pb) {
                        self._statPidBtn = pb;
                        self._statPidLabel = self._btnLabel(pb);
                        pb.on(cc.Node.EventType.TOUCH_END, function () { self._toggleStatDrop("partner"); });
                    }
                    self._statDrop = content.getChildByName("filterDrop");
                    self._incomeStatsContent = content;
                    var scNode = content.getChildByName("statScroll");
                    if (scNode) {
                        self._statListContent = scNode.getChildByName("content");
                        if (self._statListContent) { self._statRowTpl = self._statListContent.getChildByName("rowTpl"); }
                    }
                }
                if (nm === "datePickerWin") {
                    self._datePickerWin = win;
                    var prevBtn = content.getChildByName("prevBtn");
                    if (prevBtn) {
                        prevBtn.on(cc.Node.EventType.TOUCH_END, function () {
                            self._pickMonth--;
                            if (self._pickMonth < 0) { self._pickMonth = 11; self._pickYear--; }
                            self._renderDatePicker();
                        });
                    }
                    var nextBtn = content.getChildByName("nextBtn");
                    if (nextBtn) {
                        nextBtn.on(cc.Node.EventType.TOUCH_END, function () {
                            self._pickMonth++;
                            if (self._pickMonth > 11) { self._pickMonth = 0; self._pickYear++; }
                            self._renderDatePicker();
                        });
                    }
                    var ymNode = content.getChildByName("ymLabel");
                    if (ymNode) { self._pickYmLabel = ymNode.getComponent(cc.Label); }
                    var gridNode = content.getChildByName("dayGrid");
                    if (gridNode) {
                        self._dayGrid = gridNode;
                        self._dayTpl = gridNode.getChildByName("dayTpl");
                    }
                }
                if (nm === "gameConfigWin") {
                    var rakeBtn = content.getChildByName("rakeSwitchBtn");
                    if (rakeBtn) { rakeBtn.on(cc.Node.EventType.TOUCH_END, function () { self._toggleRakeSwitch(); }); }
                    var payerBtn = content.getChildByName("payerBtn");
                    if (payerBtn) { payerBtn.on(cc.Node.EventType.TOUCH_END, function () { self._togglePayer(); }); }
                }
                if (nm === "partnerGemsWin") {
                    // 加豆豆/减豆豆 两个按钮: 点哪个就走哪种模式, 减豆豆时输入正数即可
                    var addBtn = content.getChildByName("btn_add");
                    if (addBtn) { addBtn.on(cc.Node.EventType.TOUCH_END, function () { self._setGemsMode(1); }); }
                    var subBtn = content.getChildByName("btn_sub");
                    if (subBtn) { subBtn.on(cc.Node.EventType.TOUCH_END, function () { self._setGemsMode(-1); }); }
                    // 缓存两个按钮的常态图, 并异步载入选中的高亮图
                    self._gemsAddSpr = addBtn ? addBtn.getComponent(cc.Sprite) : null;
                    self._gemsSubSpr = subBtn ? subBtn.getComponent(cc.Sprite) : null;
                    if (self._gemsAddSpr) { self._gemsAddNormal = self._gemsAddSpr.spriteFrame; }
                    if (self._gemsSubSpr) { self._gemsSubNormal = self._gemsSubSpr.spriteFrame; }
                    cc.loader.loadRes("images/other/ref_btn_add2", cc.SpriteFrame, function (err, sf) {
                        if (!err && sf) { self._gemsAddSel = sf; self._refreshGemsButtons(); }
                    });
                    cc.loader.loadRes("images/other/ref_btn_sub2", cc.SpriteFrame, function (err, sf) {
                        if (!err && sf) { self._gemsSubSel = sf; self._refreshGemsButtons(); }
                    });
                }
            })(names[i]);
        }
    },

    _openPopup: function (name, ctx) {
        var win = this._popups ? this._popups[name] : null;
        if (!win) { return null; }
        this._popupCtx = ctx || {};
        win.active = true;
        // 提到最前面, 不被其他弹窗遮
        win.setSiblingIndex(9999);
        // 修正 confirmWin 的错误消息 Label 自动换行
        if (name === "confirmWin") {
            var panel = win.getChildByName("panel");
            if (panel) {
                var content = panel.getChildByName("content");
                if (content) {
                    var msgLbl = content.getChildByName("msgLabel") || content.getChildByName("tipLabel") || content.children[0];
                    if (msgLbl) {
                        var lbl = msgLbl.getComponent(cc.Label);
                        if (lbl) {
                            lbl.enableWrapText = true;
                            lbl.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
                        }
                    }
                }
            }
        }
        return win;
    },

    _popupPanel: function (win) {
        return win ? win.getChildByName("panel") : null;
    },

    _setNodeLabel: function (node, text) {
        if (!node) { return; }
        var lbl = node.getComponent(cc.Label);
        if (lbl) { lbl.string = text; }
    },

    // 为弹窗列表创建可滚动区域(首次调用时创建, 之后复用):
    // 在 content 里放一个带 Mask 的 ScrollView, 行克隆到其内部的 listContent, 列表超长时可上下拖动/滚轮滚动
    _ensurePopupScroll: function (content) {
        if (content._popupScroll) { return content._popupScroll; }
        var cw = content.width;
        var ch = content.height;
        // 顶部留出列头高度: 取所有 col* 列头的最低边缘
        var headerBottom = null;
        for (var i = 0; i < content.childrenCount; i++) {
            var c = content.children[i];
            if (c.name.indexOf("col") === 0) {
                var bottom = c.y - c.height / 2;
                if (headerBottom === null || bottom < headerBottom) { headerBottom = bottom; }
            }
        }
        var topY = headerBottom === null ? (ch / 2 - 60) : (headerBottom - 6);
        // 列表底部停在场景里摆好的分页条上方(位置由场景决定, JS 不移动分页条)
        var pagerBar = content.getChildByName("pagerBar");
        var bottomY = -ch / 2 + 20;
        if (pagerBar) {
            var pagerTop = pagerBar.y + pagerBar.height / 2;
            if (pagerTop > bottomY) { bottomY = pagerTop + 6; }
        }
        var viewH = topY - bottomY;
        if (viewH < 120) {
            viewH = Math.max(120, ch - 140);
            topY = ch / 2 - 40;
        }
        var viewW = cw - 20;
        var centerY = topY - viewH / 2;

        var view = new cc.Node("listView");
        view.parent = content;
        view.setContentSize(viewW, viewH);
        view.setPosition(0, centerY);
        var mask = view.addComponent(cc.Mask);
        mask.type = cc.Mask.Type.RECT;

        var list = new cc.Node("listContent");
        list.parent = view;
        list.anchorX = 0.5;
        list.anchorY = 1;
        list.setContentSize(viewW, viewH);
        list.setPosition(0, viewH / 2);

        var sv = view.addComponent(cc.ScrollView);
        sv.horizontal = false;
        sv.vertical = true;
        sv.inertia = true;
        sv.brake = 0.75;
        sv.elastic = true;
        sv.bounceDuration = 0.23;
        sv.content = list;
        // 组件在 content 赋值前已执行过 onEnable(那时 content 为空, 不会监听内容尺寸变化),
        // 这里重走一次启用流程, 让 ScrollView 绑定内容节点的尺寸/位置事件, 滚动边界才准确
        sv.enabled = false;
        sv.enabled = true;

        // 分页条是场景里的节点, 提前创建列表后要把它提到最上层
        if (pagerBar) { pagerBar.setSiblingIndex(content.childrenCount - 1); }

        content._popupScroll = { view: view, sv: sv, list: list, viewW: viewW, viewH: viewH };
        return content._popupScroll;
    },

    // 用 content 下的 rowTpl 克隆表格行; rows 为二维数组, 每行按列顺序填文字
    // keepPage=true 时保持当前页码(翻页用), 否则回到第 1 页
    _fillPopupList: function (content, rows, keepPage) {
        if (!content) { return; }
        var tpl = content.getChildByName("rowTpl");
        var sc = this._ensurePopupScroll(content);
        // 只清理上一次克隆出来的行, 保留列头和关闭按钮
        for (var k = content.children.length - 1; k >= 0; k--) {
            var old = content.children[k];
            if (old.name === "rowClone") { old.removeFromParent(); old.destroy(); }
        }
        for (var k2 = sc.list.children.length - 1; k2 >= 0; k2--) {
            var oldRow = sc.list.children[k2];
            oldRow.removeFromParent();
            oldRow.destroy();
        }
        if (!tpl || !rows) { return; }
        tpl.active = false;

        // 只渲染当前页, 明细记录很多时也不会一次创建几百行
        var all = rows || [];
        var pageSize = 15;
        if (!keepPage) { content._popupPage = 1; }
        var pages = Math.max(1, Math.ceil(all.length / pageSize));
        var pageNo = Math.min(Math.max(1, content._popupPage || 1), pages);
        content._popupPage = pageNo;
        content._popupRows = all;
        var showRows = all.slice((pageNo - 1) * pageSize, pageNo * pageSize);

        var step = tpl.height + 8;
        var rowH = tpl.height;
        // 内容高度按行数撑开, 行从列表顶部往下排(不再依赖模板在场景里的 y)
        sc.list.setContentSize(sc.viewW, Math.max(sc.viewH, showRows.length * step + 6));
        sc.list.setPosition(0, sc.viewH / 2);
        for (var i = 0; i < showRows.length; i++) {
            var row = cc.instantiate(tpl);
            row.name = "rowClone";
            row.active = true;
            // 先入树再定位, 避免组件在未入树时按模板旧尺寸初始化
            row.parent = sc.list;
            row.x = 0;
            row.y = -(rowH / 2 + i * step);
            var cols = showRows[i] || [];
            for (var j = 0; j < row.children.length; j++) {
                var cell = row.children[j];
                // 模板子标签可能在场景里被误设为未激活, 克隆行统一激活才能显示文字
                cell.active = true;
                if (cols[j] === undefined || cols[j] === null) { continue; }
                var lbl = cell.getComponent(cc.Label);
                if (lbl) { lbl.string = String(cols[j]); }
            }
        }
        if (showRows.length > 0) { sc.sv.scrollToTop(0.01); }

        var self = this;
        if (!content._pagerKey) { content._pagerKey = "popup_" + (++this._pagerSeq); }
        var pager = this._getPager(content._pagerKey, content, -content.height / 2 + 64);
        this._updatePager(pager, all.length, pageNo, pageSize, function (p) {
            content._popupPage = p;
            self._fillPopupList(content, content._popupRows, true);
        });
    },

    _getInput: function (content, nodeName) {
        var n = content ? content.getChildByName(nodeName) : null;
        var eb = n ? n.getComponent(cc.EditBox) : null;
        return eb ? String(eb.string || "").trim() : "";
    },

    _setInput: function (content, nodeName, value) {
        var n = content ? content.getChildByName(nodeName) : null;
        var eb = n ? n.getComponent(cc.EditBox) : null;
        if (eb) { eb.string = value === undefined || value === null ? "" : String(value); }
    },
    // 收费规则行: active=是否显示, enabled=是否可编辑(关闭统一收费时置灰且不可编辑)
    _setRuleRow: function (content, baseName, active, enabled) {
        if (!content) { return; }
        var names = [baseName + "Label", baseName + "Input", baseName + "Btn"];
        for (var i = 0; i < names.length; i++) {
            var node = content.getChildByName(names[i]);
            if (!node) { continue; }
            node.active = !!active;
            if (!active) { continue; }
            node.opacity = enabled ? 255 : 120;
            var eb = node.getComponent(cc.EditBox);
            if (eb) {
                if (typeof eb.interactable === "boolean") { eb.interactable = !!enabled; }
                else { eb.enabled = !!enabled; }
            }
            var btn = node.getComponent(cc.Button);
            if (btn && typeof btn.interactable === "boolean") { btn.interactable = !!enabled; }
        }
    },
    // 比例弹窗的节点(不依赖节点名): 场景里三行说明文字都叫 tipLabel, 暗水输入框还叫 hiddenTipLabel,
    // 这里按"从上到下"的顺序取 3 个 Label 和 3 个 EditBox, 名字怎么起都不会错位
    _ratioDialogNodes: function (content) {
        var labels = [], inputs = [];
        if (!content) { return {}; }
        (function walk(n) {
            var ch = n.children;
            for (var i = 0; i < ch.length; ++i) {
                var c = ch[i];
                if (c.getComponent(cc.Label)) { labels.push(c); }
                if (c.getComponent(cc.EditBox)) { inputs.push(c); }
                walk(c);
            }
        })(content);
        // 去掉 EditBox 内部自带的文字节点, 以及按钮上的文字
        labels = labels.filter(function (n) {
            if (n.parent && n.parent.getComponent(cc.EditBox)) { return false; }
            if (n.parent && /(okBtn|cancelBtn|closeBtn)$/.test(n.parent.name)) { return false; }
            return true;
        });
        labels.sort(function (a, b) { return b.y - a.y; });
        inputs.sort(function (a, b) { return b.y - a.y; });
        var r = {
            tipRake: labels[0], tipHidden: labels[1], tipFee: labels[2],
            inputRake: inputs[0], inputHidden: inputs[1], inputFee: inputs[2]
        };
        console.log('[partnerRatio] labels=' + labels.length + ' inputs=' + inputs.length +
            ' tips=[' + labels.map(function (n) { return n.getComponent(cc.Label).string; }).join(' | ') + ']');
        return r;
    },
    _setInputNode: function (node, value) {
        var eb = node ? node.getComponent(cc.EditBox) : null;
        if (eb) { eb.string = value === undefined || value === null ? "" : String(value); }
    },
    _getInputNode: function (node) {
        var eb = node ? node.getComponent(cc.EditBox) : null;
        return eb ? (eb.string || "") : "";
    },

    _showMemberRecords: function (member) {
        var self = this;
        var win = this._openPopup("memberRecordsWin", { member: member });
        if (!win) { return; }
        var panel = this._popupPanel(win);
        var content = panel.getChildByName("content");
        this._setNodeLabel(panel.getChildByName("titleLabel"), "战绩 - " + member.name);
        this._setNodeLabel(content.getChildByName("tipLabel"), member.name + " (ID:" + member.userid + ")");
        this._setAvatar(content, "avatar", member.headimg, member.userid);
        this._fillPopupList(content, []);
        clubReq("/club_member/records", {
            club_id: this._clubId,
            userid: member.userid
        }, function (ret) {
            var rows = [];
            if (ret && ret.errcode === 0) {
                var list = ret.data || [];
                //接口返回的是「对局结算」流水, 按天聚合: 局数=条数, 赢/输=条数, 输赢分=amount合计
                var days = [], map = {};
                for (var i = 0; i < list.length; i++) {
                    var r = list[i];
                    var d = r.create_time ? new Date(r.create_time * 1000) : null;
                    var key = d ? (d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate()) : "未知日期";
                    if (!map[key]) { map[key] = { day: key, rounds: 0, win: 0, lose: 0, score: 0 }; days.push(map[key]); }
                    var g = map[key];
                    var amt = Number(r.amount) || 0;
                    g.rounds++;
                    if (amt > 0) { g.win++; } else if (amt < 0) { g.lose++; }
                    g.score += amt;
                }
                for (var j = 0; j < days.length; j++) {
                    var g2 = days[j];
                    rows.push([g2.day, g2.rounds, g2.win, g2.lose, g2.score]);
                }
            }
            if (rows.length === 0) { rows.push(["暂无战绩", "", "", "", ""]); }
            self._fillPopupList(content, rows);
        });
    },

    _showMemberBeanLogs: function (member) {
        var self = this;
        var win = this._openPopup("memberBeanLogsWin", { member: member });
        if (!win) { return; }
        var panel = this._popupPanel(win);
        var content = panel.getChildByName("content");
        this._setNodeLabel(panel.getChildByName("titleLabel"), "豆豆明细 - " + member.name);
        this._setNodeLabel(content.getChildByName("tipLabel"), member.name + " (ID:" + member.userid + ")");
        this._setAvatar(content, "avatar", member.headimg, member.userid);
        this._fillPopupList(content, []);
        clubReq("/club_member/bean_logs", {
            club_id: this._clubId,
            userid: member.userid
        }, function (ret) {
            var rows = [];
            if (ret && ret.errcode === 0) {
                var list = ret.data || [];
                for (var i = 0; i < list.length; i++) {
                    var r = list[i];
                    var t = r.create_time ? new Date(r.create_time * 1000).toLocaleString() : "";
                    rows.push([t, r.change_type || "", r.amount || 0, r.roomid || "", r.remark || ""]);
                }
            }
            if (rows.length === 0) { rows.push(["暂无明细", "", "", "", ""]); }
            self._fillPopupList(content, rows);
        });
    },

    // 合伙人统计「详情」: 该俱乐部全部成员的豆豆流水
    _showPartnerBeanLogs: function (partner) {
        var self = this;
        var win = this._openPopup("partnerBeanLogsWin", { partner: partner });
        if (!win) { return; }
        var panel = this._popupPanel(win);
        var content = panel.getChildByName("content");
        this._setNodeLabel(this._popupTitle(panel), "豆豆明细 - " + (partner.name || ""));
        this._setNodeLabel(content.getChildByName("tipLabel"), (partner.name || "") + " (ID:" + partner.id + ")");
        this._setAvatar(content, "avatar", partner.headimg, partner.owner_userid);
        this._fillPopupList(content, []);
        clubReq("/partner/bean_logs", {
            club_id: this._clubId,
            partner_club_id: partner.id
        }, function (ret) {
            var rows = [];
            if (ret && ret.errcode === 0) {
                var list = ret.data || [];
                for (var i = 0; i < list.length; i++) {
                    var r = list[i];
                    var t = r.create_time ? new Date(r.create_time * 1000).toLocaleString() : "";
                    rows.push([t, r.change_type || "", r.amount || 0, r.roomid || "", r.name || ""]);
                }
            }
            if (rows.length === 0) { rows.push(["暂无明细", "", "", "", ""]); }
            self._fillPopupList(content, rows);
        });
    },

    // 弹窗显示该下级俱乐部的成员列表(加入时间/昵称ID/现在豆豆数/历史总赢亏)
    _showPartnerChildrenDialog: function (partner) {
        var self = this;
        if (!partner) { return; }
        var win = this._openPopup("partnerChildrenWin", { partner: partner });
        if (!win) {
            // 场景未放 partnerChildrenWin 节点时, 复用乐豆记录弹窗兜底, 保证按钮可点
            win = this._openPopup("partnerBeanLogsWin", { partner: partner });
        }
        if (!win) { return; }
        var panel = this._popupPanel(win);
        var content = panel.getChildByName("content");
        var title = this._popupTitle(panel);
        if (title) { this._setNodeLabel(title, "成员列表 - " + (partner.name || "")); }
        self._fillPopupList(content, [["加载中...", "", "", ""]]);
        //这个按钮进去的是该俱乐部的全部玩家
        clubReq("/partner_members", { club_id: this._clubId, partner_club_id: partner.id }, function (ret) {
            var list = (ret && ret.data) || [];
            var rows = [];
            for (var i = 0; i < list.length; i++) {
                var m = list[i];
                // 列: 加入时间 / 昵称ID / 现在豆豆数 / 历史总赢亏
                rows.push([
                    self._fmtDateTime(m.join_time),
                    (m.name || "") + "(" + m.userid + ")",
                    String(Number(m.gems) || 0),
                    String(Number(m.total_win_lose) || 0)
                ]);
            }
            if (!rows.length) { rows.push(["暂无成员", "", "", ""]); }
            self._fillPopupList(content, rows);
        });
    },

    _showPartnerProfitDialog: function (partner) {
        var self = this;
        var win = this._openPopup("partnerProfitWin", { partner: partner });
        if (!win) { return; }
        var panel = this._popupPanel(win);
        var content = panel.getChildByName("content");
        this._setNodeLabel(this._popupTitle(panel), "收益详情 - " + partner.name);
        this._fillPopupList(content, []);
        clubReq("/partner/profit", {
            club_id: this._clubId,
            partner_club_id: partner.id
        }, function (ret) {
            var rows = [];
            if (ret && ret.errcode === 0) {
                var list = ret.data || [];
                for (var i = 0; i < list.length; i++) {
                    var r = list[i];
                    rows.push([r.day || "", Number(r.total) || 0, r.cnt || 0]);
                }
            }
            if (rows.length === 0) { rows.push(["暂无收益记录", "", ""]); }
            self._fillPopupList(content, rows);
        });
    },

    _setGemsMode: function (mode) {
        this._gemsMode = mode;
        this._refreshGemsButtons();
        this._updateGemsTip();
    },

    // 加/减豆豆按钮: 选中的那个换成高亮图(ref_btn_add2/ref_btn_sub2), 另一个还原常态图
    _refreshGemsButtons: function () {
        if (this._gemsAddSpr) {
            this._gemsAddSpr.spriteFrame = (this._gemsMode > 0 && this._gemsAddSel) ? this._gemsAddSel : this._gemsAddNormal;
        }
        if (this._gemsSubSpr) {
            this._gemsSubSpr.spriteFrame = (this._gemsMode < 0 && this._gemsSubSel) ? this._gemsSubSel : this._gemsSubNormal;
        }
    },

    _updateGemsTip: function () {
        var win = this._popups ? this._popups.partnerGemsWin : null;
        if (!win) { return; }
        var content = this._popupPanel(win).getChildByName("content");
        var ctx = this._popupCtx || {};
        var cur = ctx.member ? (ctx.member.gems || 0) : (ctx.partner ? (ctx.partner.total_gems || 0) : 0);
        var modeText = this._gemsMode > 0 ? "加豆豆" : "减豆豆";
        this._setNodeLabel(content.getChildByName("tipLabel"), "当前乐豆: " + cur + "    方式: " + modeText);
    },

    _showPartnerGemsDialog: function (partner) {
        var win = this._openPopup("partnerGemsWin", { partner: partner });
        if (!win) { return; }
        var content = this._popupPanel(win).getChildByName("content");
        this._gemsMode = 1;
        this._setInput(content, "amountInput", "");
        this._refreshGemsButtons();
        this._updateGemsTip();
    },

    // 成员加减豆豆: 复用伙伴页的加减豆豆弹窗, 提交时按 ctx.member 走成员接口
    _showMemberGemsDialog: function (member) {
        var win = this._openPopup("partnerGemsWin", { member: member });
        if (!win) { return; }
        var content = this._popupPanel(win).getChildByName("content");
        this._gemsMode = 1;
        this._setInput(content, "amountInput", "");
        this._refreshGemsButtons();
        this._updateGemsTip();
    },

    _showPartnerRatioDialog: function (partner) {
        var win = this._openPopup("partnerRatioWin", { partner: partner });
        if (!win) { return; }
        var content = this._popupPanel(win).getChildByName("content");
        var rn = this._ratioDialogNodes(content);
        this._setNodeLabel(rn.tipRake, "当前抽水比例：" + (partner.profit_ratio || 0) + "%");
        this._setNodeLabel(rn.tipHidden, "当前暗水比例：" + (partner.hidden_profit_ratio || 0) + "%");
        this._setNodeLabel(rn.tipFee, "当前房费/洗牌/表情比例：" + (partner.fee_profit_ratio || 0) + "%");
        this._setInputNode(rn.inputRake, "");
        this._setInputNode(rn.inputHidden, "");
        this._setInputNode(rn.inputFee, "");
    },

    _showAddMemberDialog: function () {
        var win = this._openPopup("addMemberWin", {});
        if (!win) { return; }
        var content = this._popupPanel(win).getChildByName("content");
        this._setInput(content, "uidInput", "");
    },

    _showAddPartnerDialog: function () {
        var win = this._openPopup("addPartnerWin", {});
        if (!win) { return; }
        var content = this._popupPanel(win).getChildByName("content");
        this._setInput(content, "uidInput", "");
    },

    _confirm: function (msg, onOk) {
        var win = this._openPopup("confirmWin", { onOk: onOk });
        if (!win) {
            if (onOk) { onOk(); }
            return;
        }
        var content = this._popupPanel(win).getChildByName("content");
        this._setNodeLabel(content.getChildByName("msgLabel"), msg);
    },

    _tip: function (msg) {
        var win = this._openPopup("confirmWin", {});
        if (!win) { return; }
        var content = this._popupPanel(win).getChildByName("content");
        this._setNodeLabel(content.getChildByName("msgLabel"), msg);
    },

    _toggleRakeSwitch: function () {
        this._rakePerRound = this._rakePerRound ? 0 : 1;
        this._refreshRakePayerUi();
    },

    _togglePayer: function () {
        this._roomFeePayer = this._roomFeePayer ? 0 : 1;
        this._refreshRakePayerUi();
    },

    // 抽水/房费支付: 说明文字和按钮上的文字都跟着配置值走
    _refreshRakePayerUi: function () {
        var content = this._dlgContent;
        if (!content) { return; }
        this._setNodeLabel(content.getChildByName("rakeSwitchLabel"), this._rakePerRound ? "抽水方式：每小局" : "抽水方式：整场");
        var rakeBtn = content.getChildByName("rakeSwitchBtn");
        this._setNodeLabel(rakeBtn ? rakeBtn.getChildByName("Label") : null, this._rakePerRound ? "每小局" : "整场");
        this._setNodeLabel(content.getChildByName("payerLabel"), this._roomFeePayer ? "房费谁出：大赢家" : "房费谁出：不扣");
        var payerBtn = content.getChildByName("payerBtn");
        this._setNodeLabel(payerBtn ? payerBtn.getChildByName("Label") : null, this._roomFeePayer ? "大赢家" : "不扣");
    },

    _showGameConfigDialog: function (cfg, gameType, table) {
        var self = this;
        var isEdit = !!cfg;
        this._dlgGameType = cfg ? cfg.game_type : (gameType || this._selectedGameType || "baobao_shou");
        var win = this._openPopup("gameConfigWin", { cfg: cfg, isEdit: isEdit, gameType: this._dlgGameType, table: table || null });
        if (!win) { return; }
        var panel = this._popupPanel(win);
        this._dlgPanel = panel;
        this._dlgContent = panel.getChildByName("content");
        this._dlgCfg = cfg;
        this._dlgIsEdit = isEdit;
        this._dlgTable = table || null;

        // 玩法选择按钮: 新建时可切换玩法, 修改时固定(不允许改玩法的牌桌类型)
        if (!this._gameTypePickerBound) {
            this._gameTypePickerBound = true;
            var typeBtn = panel.getChildByName("gameTypeBtn");
            if (typeBtn) {
                typeBtn.on(cc.Node.EventType.TOUCH_END, function () {
                    if (self._dlgIsEdit) { return; }
                    self._toggleGameTypeDrop();
                });
            }
        }
        this._applyDlgGameType();
        // 打开弹窗时重新拉一次各玩法收费模式开关: 后台改完开关, 客户端不用重进页面也能立即生效
        this._refreshGameUnified(function () {
            if (self._dlgPanel === panel) { self._applyDlgGameType(); }
        });
    },

    //只刷新"玩法->收费模式"映射, 不重新拉玩法列表/牌桌
    _refreshGameUnified: function (done) {
        var self = this;
        if (!this._canRequest()) { if (done) { done(); } return; }
        clubReq("/game_unified", { club_id: this._clubId }, function (ret) {
            if (ret && ret.errcode === 0 && ret.unified) {
                self._gameUnified = ret.unified;
            }
            if (done) { done(); }
        });
    },

    // 按当前弹窗选中的玩法刷新: 标题/玩法按钮文字/配置项显隐/输入框默认值
    _applyDlgGameType: function () {
        var panel = this._dlgPanel;
        var content = this._dlgContent;
        if (!panel || !content) { return; }
        var isEdit = this._dlgIsEdit;
        var cfg = this._dlgCfg;
        var titlePrefix = this._dlgTable ? "修改牌桌" : (isEdit ? "修改玩法" : "新建玩法");
        this._setNodeLabel(panel.getChildByName("titleLabel"), titlePrefix + " - " + this._gameTypeName(this._dlgGameType));
        var typeBtn = panel.getChildByName("gameTypeBtn");
        this._setNodeLabel(typeBtn ? typeBtn.getChildByName("Label") : null, this._gameTypeName(this._dlgGameType));

        // 每个玩法各自的收费模式开关(后台玩法配置下发): 开=该玩法可配置抽水/暗水/房费/表情/洗牌
        var unified = Number(this._gameUnified && this._gameUnified[this._dlgGameType]) === 1;
        var isBaobao = /^baobao/.test(this._dlgGameType);
        // 收费规则: 全部显示; 未开启收费模式时只置灰不可编辑, 不隐藏
        var ruleRows = ["shuffle_score", "rake_percent", "hidden_rake_percent", "room_fee"];
        for (var i = 0; i < ruleRows.length; i++) {
            this._setRuleRow(content, ruleRows[i], true, unified);
        }
        this._setRuleRow(content, "rakeSwitch", true, unified);
        this._setRuleRow(content, "payer", true, unified);
        // 宝宝豆门槛: 仅宝宝玩法可编辑, 其它玩法显示但置灰
        this._setRuleRow(content, "min_bean", true, unified && isBaobao);
        this._setRuleRow(content, "kick_bean", true, unified && isBaobao);
        // 人数限制: 仅宝宝玩法可编辑, 其它玩法显示但置灰
        this._setRuleRow(content, "min_players", true, isBaobao);
        this._setRuleRow(content, "max_players", true, isBaobao);
        // 表情分/房卡共用一行: 开启时是表情分, 关闭时是房卡(房卡按局扣, 进场扣)
        this._setRuleRow(content, "face_score", true, true);
        // 进场费: 复用现有"进场费"标签 + fee_rake_percentLabel 输入框(节点名历史遗留)
        // 统一收费开启时可编辑; 关闭时只置灰, 不隐藏
        var enterFeeLabel = null;
        for (var efIdx = 0; efIdx < content.children.length; efIdx++) {
            var efLabelCmp = content.children[efIdx].getComponent(cc.Label);
            if (efLabelCmp && efLabelCmp.string === "进场费") { enterFeeLabel = content.children[efIdx]; break; }
        }
        var enterFeeInput = content.getChildByName("fee_rake_percentLabel");
        if (enterFeeLabel) { enterFeeLabel.active = true; enterFeeLabel.opacity = unified ? 255 : 120; }
        if (enterFeeInput) {
            enterFeeInput.active = true;
            enterFeeInput.opacity = unified ? 255 : 120;
            var enterFeeEb = enterFeeInput.getComponent(cc.EditBox);
            if (enterFeeEb) {
                if (typeof enterFeeEb.interactable === "boolean") { enterFeeEb.interactable = !!unified; }
                else { enterFeeEb.enabled = !!unified; }
            }
        }
        // 统一收费开启时这一行是"表情分"; 关闭时复用为"房卡"(房卡按局扣, 进场扣), 只改文字不改布局
        this._setNodeLabel(content.getChildByName("face_scoreLabel"), unified ? "表情分:" : "房卡:");

        // 同一玩法在一个俱乐部只允许一条配置: 再次新建时带出已有配置的数值, 避免覆盖成默认值
        var base = cfg;
        if (!base) {
            for (var k = 0; k < this._gameConfigs.length; k++) {
                var g = this._gameConfigs[k];
                if (g.game_type === this._dlgGameType && !g.inherited) { base = g; break; }
            }
        }
        // 新建时桌名默认用玩法名(如"跑得快(2人)"), 最多人数取全局配置(如跑得快2人=2)
        var gt = this._findGameType(this._dlgGameType);
        var defMax = (gt && gt.max_players) ? gt.max_players : 6;
        this._setInput(content, "nameInput", cfg ? cfg.name : this._gameTypeName(this._dlgGameType));
        this._setInput(content, "difenInput", base && base.difen_options ? base.difen_options[0] : 1);
        this._setInput(content, "jushuInput", base && base.jushu_options ? base.jushu_options[0] : 8);
        this._setInput(content, "min_playersInput", base ? base.min_players : 2);
        this._setInput(content, "max_playersInput", base ? base.max_players_custom : defMax);
        // 统一收费开启时这一格是表情分; 关闭时是房卡(取 cost_options 第1项)
        var faceOrCost = 0;
        if (base) {
            faceOrCost = unified ? (Number(base.face_score) || 0)
                : ((base.cost_options && base.cost_options.length) ? Number(base.cost_options[0]) : 2);
        } else if (!unified) {
            faceOrCost = 2;
        }
        this._setInput(content, "face_scoreInput", faceOrCost);
        this._setInput(content, "shuffle_scoreInput", base ? (base.shuffle_score || 0) : 0);
        this._setInput(content, "min_beanInput", base ? (base.min_bean || 0) : 0);
        this._setInput(content, "kick_beanInput", base ? (base.kick_bean || 0) : 0);
        this._setInput(content, "rake_percentInput", base ? base.rake_percent : 0);
        this._setInput(content, "hidden_rake_percentInput", base ? base.hidden_rake_percent : 0);
        // fee_rake_percentLabel 现在用作"进场费"输入(节点名历史遗留)
        this._setInput(content, "fee_rake_percentLabel", base ? (Number(base.enter_fee) || 0) : 0);
        this._setInput(content, "room_feeInput", base ? base.room_fee : 0);

        this._rakePerRound = (base && base.rake_per_round != null) ? Number(base.rake_per_round) : 1;
        this._roomFeePayer = (base && base.room_fee_payer != null) ? Number(base.room_fee_payer) : 1;
        this._refreshRakePayerUi();
    },

    // 玩法下拉: 新建时列全部可选玩法(可新建本俱乐部还没有的玩法)
    _toggleGameTypeDrop: function () {
        var drop = this._dlgPanel ? this._dlgPanel.getChildByName("gameTypeDrop") : null;
        if (!drop) { return; }
        if (drop.active) { drop.active = false; return; }
        this._renderGameTypeDrop(drop);
        drop.active = true;
    },

    _renderGameTypeDrop: function (drop) {
        var tpl = drop.getChildByName("gameTypeItemTpl");
        if (!tpl) { return; }
        this._clearList(drop, tpl);
        tpl.active = false;
        var self = this;
        var seen = {};
        var types = [];
        // 只列本俱乐部可用的玩法(含一级俱乐部继承下来的), 不列项目里的全部玩法;
        // 本俱乐部还没有任何玩法时(如一级俱乐部首次建玩法)才退回 /game_list
        for (var i = 0; i < this._gameConfigs.length; i++) {
            var it = String(this._gameConfigs[i].game_type || "");
            if (!it || seen[it]) { continue; }
            seen[it] = true;
            types.push(it);
        }
        if (!types.length) {
            for (var j = 0; j < this._allGameTypes.length; j++) {
                var at = String(this._allGameTypes[j].type || "");
                if (!at || seen[at]) { continue; }
                seen[at] = true;
                types.push(at);
            }
        }
        for (var i2 = 0; i2 < types.length; i2++) {
            var t = types[i2];
            (function (type) {
                var row = cc.instantiate(tpl);
                row.name = "gameType_" + type;
                var lblNode = row.getChildByName("Label");
                if (lblNode) {
                    var lbl = lblNode.getComponent(cc.Label);
                    if (lbl) {
                        lbl.string = self._gameTypeName(type);
                        lblNode.color = (type === self._dlgGameType) ? cc.color(220, 60, 40) : cc.color(0, 0, 0);
                    }
                }
                row.on(cc.Node.EventType.TOUCH_END, function () {
                    drop.active = false;
                    if (type === self._dlgGameType) { return; }
                    self._dlgGameType = type;
                    if (self._popupCtx) { self._popupCtx.gameType = type; }
                    self._applyDlgGameType();
                });
                row.parent = drop;
                row.active = true;
            })(t);
        }
    },

    _onPopupOk: function (name) {
        var self = this;
        var ctx = this._popupCtx || {};
        var win = this._popups ? this._popups[name] : null;
        if (!win) { return; }
        var content = this._popupPanel(win).getChildByName("content");

        if (name === "memberRecordsWin" || name === "memberBeanLogsWin" || name === "partnerProfitWin") {
            win.active = false;
            return;
        }

        if (name === "confirmWin") {
            win.active = false;
            if (ctx.onOk) { ctx.onOk(); }
            return;
        }

        if (name === "addMemberWin") {
            var uidAdd = parseInt(this._getInput(content, "uidInput"));
            if (!(uidAdd > 0)) { return; }
            clubReq("/club_member/add", {
                club_id: this._clubId,
                userid: uidAdd
            }, function (ret) {
                if (ret && ret.errcode === 0) {
                    win.active = false;
                    self._loadMembers();
                }
            });
            return;
        }

        if (name === "addPartnerWin") {
            var pidAdd = parseInt(this._getInput(content, "uidInput"));
            if (!(pidAdd > 0)) { return; }
            clubReq("/club_member/set_partner", {
                club_id: this._clubId,
                userid: pidAdd
            }, function (ret) {
                if (ret && ret.errcode === 0) {
                    win.active = false;
                    self._loadPartners();
                }
            });
            return;
        }

        if (name === "partnerGemsWin") {
            var inputVal = Math.abs(parseInt(this._getInput(content, "amountInput")));
            if (isNaN(inputVal) || inputVal === 0) { self._tip("请输入有效数字"); return; }
            // 减豆豆模式直接输入正数, 由模式决定正负
            var amount = this._gemsMode > 0 ? inputVal : -inputVal;
            // 成员页: 走 /club_member_gems(gems 是增量, 可为负)
            if (ctx.member) {
                clubReq("/club_member_gems", {
                    clubid: this._clubId,
                    userid: ctx.member.userid,
                    gems: amount
                }, function (ret) {
                    if (ret && ret.errcode === 0) {
                        win.active = false;
                        self._loadMembers();
                    } else {
                        self._tip(ret && ret.errmsg ? ret.errmsg : "操作失败");
                    }
                });
                return;
            }
            clubReq("/partner/gems", {
                club_id: this._clubId,
                partner_club_id: ctx.partner.id,
                gems: amount
            }, function (ret) {
                if (ret && ret.errcode === 0) {
                    win.active = false;
                    self._loadPartners();
                } else {
                    self._tip(ret && ret.errmsg ? ret.errmsg : "操作失败");
                }
            });
            return;
        }

        if (name === "partnerRatioWin") {
            var rn = this._ratioDialogNodes(content);
            var ratio = parseFloat(this._getInputNode(rn.inputRake));
            if (isNaN(ratio) || ratio < 0 || ratio > 100) { self._tip("请输入0-100之间的数字"); return; }
            var feeRaw = this._getInputNode(rn.inputFee);
            var feeRatio = parseFloat(feeRaw);
            if (feeRaw !== "" && (isNaN(feeRatio) || feeRatio < 0 || feeRatio > 100)) { self._tip("费用比例请输入0-100之间的数字"); return; }
            var hiddenRaw = this._getInputNode(rn.inputHidden);
            var hiddenRatio = parseFloat(hiddenRaw);
            if (hiddenRaw !== "" && (isNaN(hiddenRatio) || hiddenRatio < 0 || hiddenRatio > 100)) { self._tip("暗水比例请输入0-100之间的数字"); return; }
            var params = {
                club_id: this._clubId,
                partner_club_id: ctx.partner.id,
                ratio: ratio
            };
            if (!isNaN(feeRatio)) { params.fee_ratio = feeRatio; }
            if (!isNaN(hiddenRatio)) { params.hidden_ratio = hiddenRatio; }
            console.log('[partnerRatio] save ' + JSON.stringify(params));
            clubReq("/partner/ratio", params, function (ret) {
                if (ret && ret.errcode === 0) {
                    win.active = false;
                    self._loadPartners();
                } else {
                    self._tip(ret && ret.errmsg ? ret.errmsg : "操作失败");
                }
            });
            return;
        }

        if (name === "gameConfigWin") {
            var cfg = ctx.cfg;
            var gameType = ctx.gameType || this._dlgGameType || "baobao_shou";
            // 该玩法的收费模式开启: 保存抽水/暗水/房费/表情分/洗牌分; 关闭: 只保存房卡
            var unified = Number(this._gameUnified && this._gameUnified[gameType]) === 1;
            var isBaobao = /^baobao/.test(gameType);
            // 非宝宝玩法都是固定人数玩法(人数由玩法决定, 不用手填)
            var gt2 = this._findGameType(gameType);
            var fixMax = (gt2 && gt2.max_players) ? Number(gt2.max_players) : 2;
            var data = {
                club_id: this._clubId,
                game_type: gameType,
                name: this._getInput(content, "nameInput"),
                difen_options: [parseInt(this._getInput(content, "difenInput")) || 1],
                jushu_options: [parseInt(this._getInput(content, "jushuInput")) || 8],
                min_players: isBaobao ? (parseInt(this._getInput(content, "min_playersInput")) || 2) : fixMax,
                max_players_custom: isBaobao ? (parseInt(this._getInput(content, "max_playersInput")) || 6) : fixMax,
                // 这一格开启时是表情分; 关闭时是房卡, 表情分保留原值(不覆盖)
                face_score: unified ? (parseInt(this._getInput(content, "face_scoreInput")) || 0)
                    : ((cfg && Number(cfg.face_score)) || 0),
                shuffle_score: parseInt(this._getInput(content, "shuffle_scoreInput")) || 0,
                min_bean: isBaobao ? (parseInt(this._getInput(content, "min_beanInput")) || 0) : 0,
                kick_bean: isBaobao ? (parseInt(this._getInput(content, "kick_beanInput")) || 0) : 0,
                rake_percent: parseFloat(this._getInput(content, "rake_percentInput")) || 0,
                hidden_rake_percent: parseFloat(this._getInput(content, "hidden_rake_percentInput")) || 0,
                // 进场费: 统一收费开启时可配; 关闭时保留原值不覆盖
                enter_fee: unified ? (parseInt(this._getInput(content, "fee_rake_percentLabel")) || 0)
                    : ((cfg && Number(cfg.enter_fee)) || 0),
                room_fee: parseInt(this._getInput(content, "room_feeInput")) || 0,
                rake_per_round: this._rakePerRound,
                room_fee_payer: this._roomFeePayer
            };
            if (!data.name) { self._tip("请填写配置名称"); return; }
            // 关闭统一收费: 房卡单价存 cost_options[0](建桌时写进牌桌conf.cost, 开局按局扣)
            if (!unified) {
                data.cost_options = [parseInt(this._getInput(content, "face_scoreInput")) || 0];
            }
            // 修改牌桌: 只更新这张牌桌自己的参数, 不写玩法配置, 不影响同玩法的其它牌桌
            var dlgTable = this._dlgTable || ctx.table;
            if (dlgTable && dlgTable.id) {
                data.id = dlgTable.id;
                clubReq("/club_admin/table_update", data, function (ret) {
                    if (ret && ret.errcode === 0) {
                        win.active = false;
                        self._loadGameConfigs();
                    } else {
                        self._tip(ret && ret.errmsg ? ret.errmsg : "操作失败");
                    }
                });
                return;
            }
            var url = ctx.isEdit ? "/club_game_config/" + cfg.id : "/club_game_config";
            clubReq(url, data, function (ret) {
                if (ret && ret.errcode === 0) {
                    win.active = false;
                    self._loadGameConfigs();
                } else {
                    self._tip(ret && ret.errmsg ? ret.errmsg : "操作失败");
                }
            });
        }
    }
});
