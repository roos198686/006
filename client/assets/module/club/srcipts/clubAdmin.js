// 俱乐部管理后台 - 静态节点写在 clubAdmin.fire 中, 本脚本按节点名绑定
// 列表行与弹窗仍由代码创建
// 管理页接口走大厅服(9101)的 /club_admin/* 路由
// HTTP.sendRequest 的签名是 (path, data, handler, extraUrl), 没有 method 参数, 全部是 GET
var CLUB_ADMIN_ROUTES = {
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
                self._renderMembers();
            });
        }

        var scroll = page.getChildByName("memberScroll");
        if (scroll) this._memberContent = scroll.getChildByName("content");
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

        for (var i = 0; i < filtered.length; i++) {
            var m = filtered[i];
            // 行位置由 content 上的 cc.Layout 排列, JS 不参与布局
            var row = this._createMemberRow(tpl, m);
            if (row) { row.parent = content; row.active = true; }
        }
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
            (function (action) {
                var btn = row.getChildByName(key);
                if (!btn) return;
                btn.on(cc.Node.EventType.TOUCH_END, function () {
                    self._onMemberAction(action, member);
                });
            })(btns[key]);
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

        var scroll = page.getChildByName("partnerScroll");
        if (scroll) {
            this._partnerScroll = scroll;
            this._partnerContent = scroll.getChildByName("content");
            this._partnerSv = scroll.getComponent(cc.ScrollView);
        }
        if (this._partnerContent) {
            var widget = this._partnerContent.getComponent(cc.Widget);
            if (widget) { widget.enabled = false; }
            this._partnerLayout = this._partnerContent.getComponent(cc.Layout);
            this._partnerContent.anchorX = 0.5;
            this._partnerContent.anchorY = 1;
        }
    },

    // 切到 partner 页时 Layout 可能在 inactive 状态没重算, 激活后再同步一次
    _refreshPartnerScroll: function () {
        if (!this._partnerContent || !this._partnerScroll) return;
        if (this._partnerLayout) { this._partnerLayout.updateLayout(); }
        // content anchorY=1 顶对齐 ScrollView 顶部
        this._partnerContent.setPosition(0, this._partnerScroll.height / 2);
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
            pc.setPosition(0, ps.height / 2);
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
        console.log('[partnerPage render] direct children count=', direct.length, 'of total=', this._partners.length);
        for (var i = 0; i < direct.length; i++) {
            var p = direct[i];
            var row = this._createPartnerRow(tpl, p);
            if (row) { row.parent = content; row.active = true; }
        }
        // 强制重排一次,避免行添加时机导致的布局未刷新
        var lay = content.getComponent(cc.Layout);
        if (lay) { lay.updateLayout(); }
        // 位置设对 + 滚到顶
        this._partnerContent.setPosition(0, this._partnerScroll.height / 2);
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
    content.anchorX = 0.5; content.anchorY = 1;
    content.setPosition(0, scroll.height / 2);
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
    for (var i = 0; i < direct.length; i++) {
        var p = direct[i];
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
        content.anchorX = 0.5;
        content.anchorY = 1;
        content.setPosition(0, scroll.height / 2);
        this._rewardLayout = layout;
        if (this._rewardSv) { this._rewardSv.content = content; }
    },

    _renderRewards: function () {
        var content = this._rewardContent;
        if (!content) return;
        // 模板行 rowTpl 固化在场景 content 下,JS 只克隆填数据
        var tpl = content.getChildByName("rowTpl");
        this._clearList(content, tpl);
        if (!tpl) return;
        tpl.active = false;

        for (var i = 0; i < this._rewards.length; i++) {
            var r = this._rewards[i];
            var row = this._createRewardRow(tpl, r);
            if (row) { row.parent = content; row.active = true; }
        }
        // 行克隆完成后按实际行数重新计算 content 高度(可滚动), 并回到顶部
        this._refreshRewardScroll();
    },

    // 按实际行数重算滚动区域高度并回到顶部(切换页面时 content 可能还没激活过, 这里再同步一次)
    _refreshRewardScroll: function () {
        if (!this._rewardContent) return;
        if (this._rewardLayout) { this._rewardLayout.updateLayout(); }
        if (this._rewardScroll) { this._rewardContent.setPosition(0, this._rewardScroll.height / 2); }
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
        var list = this._gameConfigList;
        if (!list) return;
        // 左侧: 本俱乐部已有玩法; 右侧: 当前玩法下已添加的牌桌
        this._renderGameTypes();
        // 牌桌卡片模板 configRowTpl 固化在场景 configList 下,JS 只克隆填数据
        var tpl = list.getChildByName("configRowTpl");
        this._clearList(list, tpl);
        if (!tpl) return;
        tpl.active = false;

        for (var i = 0; i < this._clubTables.length; i++) {
            var table = this._clubTables[i];
            if (String(table.game_type) !== String(this._selectedGameType)) continue;
            var row = this._createTableRow(tpl, table);
            if (row) { row.parent = list; row.active = true; }
        }
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
    _bindPopups: function () {
        var self = this;
        this._popups = {};
        this._rakePerRound = 1;
        this._roomFeePayer = 1;
        this._gemsMode = 1; // 1=加豆豆 -1=减豆豆(减豆豆时仍输入正数)
        var root = this.node.getChildByName("popups");
        if (!root) { return; }
        var names = ["memberRecordsWin", "memberBeanLogsWin", "partnerBeanLogsWin", "partnerChildrenWin", "partnerGemsWin", "partnerRatioWin", "partnerProfitWin", "gameConfigWin", "confirmWin", "addMemberWin", "addPartnerWin"];
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
        var bottomY = -ch / 2 + 20;
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

        content._popupScroll = { view: view, sv: sv, list: list, viewW: viewW, viewH: viewH };
        return content._popupScroll;
    },

    // 用 content 下的 rowTpl 克隆表格行; rows 为二维数组, 每行按列顺序填文字
    _fillPopupList: function (content, rows) {
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
        var step = tpl.height + 8;
        var rowH = tpl.height;
        // 内容高度按行数撑开, 行从列表顶部往下排(不再依赖模板在场景里的 y)
        sc.list.setContentSize(sc.viewW, Math.max(sc.viewH, rows.length * step + 6));
        sc.list.setPosition(0, sc.viewH / 2);
        for (var i = 0; i < rows.length; i++) {
            var row = cc.instantiate(tpl);
            row.name = "rowClone";
            row.active = true;
            // 先入树再定位, 避免组件在未入树时按模板旧尺寸初始化
            row.parent = sc.list;
            row.x = 0;
            row.y = -(rowH / 2 + i * step);
            var cols = rows[i] || [];
            for (var j = 0; j < row.children.length; j++) {
                var cell = row.children[j];
                // 模板子标签可能在场景里被误设为未激活, 克隆行统一激活才能显示文字
                cell.active = true;
                if (cols[j] === undefined || cols[j] === null) { continue; }
                var lbl = cell.getComponent(cc.Label);
                if (lbl) { lbl.string = String(cols[j]); }
            }
        }
        if (rows.length > 0) { sc.sv.scrollToTop(0.01); }
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
        this._setNodeLabel(panel.getChildByName("titleLabel"), "豆豆明细 - " + (partner.name || ""));
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

    // 弹窗显示 partner 的直接下级列表
    _showPartnerChildrenDialog: function (partner) {
        var self = this;
        var win = this._openPopup("partnerChildrenWin", { partner: partner });
        if (!win) {
            // 场景未放 partnerChildrenWin 节点时, 复用乐豆记录弹窗兜底, 保证按钮可点
            win = this._openPopup("partnerBeanLogsWin", { partner: partner });
        }
        if (!win) { return; }
        var panel = this._popupPanel(win);
        var content = panel.getChildByName("content");
        var title = panel.getChildByName("titleLabel") || panel.getChildByName("title") || panel.getChildByName("titleLbl");
        if (title) { this._setNodeLabel(title, "下级俱乐部 - " + (partner.name || "")); }
        // 只填列表数据, 标题/头像等由场景静态内容决定
        var children = this._partners.filter(function (p) {
            return Number(p.parent_clubid) === Number(partner.id);
        });
        var rows = [];
        for (var i = 0; i < children.length; i++) {
            var c = children[i];
            var lvl = c.level || 2;
            rows.push([
                (lvl === 2 ? '二级' : '三级'),
                c.name || '-',
                c.owner_name ? (c.owner_name + '(' + c.owner_userid + ')') : ('ID:' + c.id),
                String(c.member_count || 0),
                String(Number(c.total_gems) || 0),
                self._ratioText(c)
            ]);
        }
        if (!rows.length) { rows.push(["暂无下级", "", "", "", "", ""]); }
        console.log('[partnerChildren] parent=' + partner.id + ' children=' + children.length);
        self._fillPopupList(content, rows);
    },

    _showPartnerProfitDialog: function (partner) {
        var self = this;
        var win = this._openPopup("partnerProfitWin", { partner: partner });
        if (!win) { return; }
        var panel = this._popupPanel(win);
        var content = panel.getChildByName("content");
        this._setNodeLabel(panel.getChildByName("titleLabel"), "收益详情 - " + partner.name);
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

        // 只显示当前玩法相关的配置项: 宝宝类显示全部; 其它玩法只保留名称/底分/局数/房卡
        var isBaobao = /^baobao/.test(this._dlgGameType);
        var baobaoOnly = [
            "shuffle_scoreLabel", "shuffle_scoreInput",
            "min_beanLabel", "min_beanInput", "kick_beanLabel", "kick_beanInput",
            "rake_percentLabel", "rake_percentInput", "hidden_rake_percentLabel", "hidden_rake_percentInput",
            "__feeRateHidden__",
            "room_feeLabel", "room_feeInput", "rakeSwitchLabel", "rakeSwitchBtn", "payerLabel", "payerBtn",
            "min_playersLabel", "min_playersInput", "max_playersLabel", "max_playersInput"
        ];
        for (var i = 0; i < baobaoOnly.length; i++) {
            var fn = content.getChildByName(baobaoOnly[i]);
            if (fn) fn.active = isBaobao;
        }
        // 费用类(房费/表情/洗牌)抽取比例不在此配置, 统一走合伙人设置
        // 隐藏费用抽取比例的标签与输入框
        var hideFeeRate = ["fee_rake_percentLabel", "fee_rake_percentInput"];
        for (var hi = 0; hi < hideFeeRate.length; hi++) {
            var hNode = content.getChildByName(hideFeeRate[hi]);
            if (hNode) hNode.active = false;
        }
        // 表情分这一行在其它玩法下复用为"房卡"(房卡按局扣, 进场扣), 只改文字不改布局
        this._setNodeLabel(content.getChildByName("face_scoreLabel"), isBaobao ? "表情分:" : "房卡:");

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
        // 宝宝玩法这一格是表情分; 其它玩法是房卡(取 cost_options 第1项)
        var faceOrCost = 0;
        if (base) {
            faceOrCost = isBaobao ? (base.face_score || 0)
                : ((base.cost_options && base.cost_options.length) ? Number(base.cost_options[0]) : 2);
        } else if (!isBaobao) {
            faceOrCost = 2;
        }
        this._setInput(content, "face_scoreInput", faceOrCost);
        this._setInput(content, "shuffle_scoreInput", base ? (base.shuffle_score || 0) : 0);
        this._setInput(content, "min_beanInput", base ? (base.min_bean || 0) : 0);
        this._setInput(content, "kick_beanInput", base ? (base.kick_bean || 0) : 0);
        this._setInput(content, "rake_percentInput", base ? base.rake_percent : 0);
        this._setInput(content, "hidden_rake_percentInput", base ? base.hidden_rake_percent : 0);
        // fee_rake_percent 已不再配置: 费用类收入全额进链, 上下级比例走合伙人设置
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
            // 只有宝宝类玩法有进场/离场/表情分/洗牌分/抽水/暗水/房费, 其它玩法统一存0
            var isBaobao = /^baobao/.test(gameType);
            // 非宝宝玩法都是固定人数玩法(人数由玩法决定, 不用手填), 房卡取"房卡"格
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
                face_score: isBaobao ? (parseInt(this._getInput(content, "face_scoreInput")) || 0) : 0,
                shuffle_score: isBaobao ? (parseInt(this._getInput(content, "shuffle_scoreInput")) || 0) : 0,
                min_bean: isBaobao ? (parseInt(this._getInput(content, "min_beanInput")) || 0) : 0,
                kick_bean: isBaobao ? (parseInt(this._getInput(content, "kick_beanInput")) || 0) : 0,
                rake_percent: isBaobao ? (parseFloat(this._getInput(content, "rake_percentInput")) || 0) : 0,
                hidden_rake_percent: isBaobao ? (parseFloat(this._getInput(content, "hidden_rake_percentInput")) || 0) : 0,
                // fee_rake_percent 不再提交
                room_fee: isBaobao ? (parseInt(this._getInput(content, "room_feeInput")) || 0) : 0,
                rake_per_round: isBaobao ? this._rakePerRound : 1,
                room_fee_payer: isBaobao ? this._roomFeePayer : 1
            };
            if (!data.name) { self._tip("请填写配置名称"); return; }
            // 非宝宝玩法: 房卡单价存 cost_options[0](建桌时写进牌桌conf.cost, 开局按局扣)
            if (!isBaobao) {
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
