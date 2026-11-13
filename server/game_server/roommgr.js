var db = require('../utils/db');

var rooms = {};
var creatingRooms = {};

var userLocation = {};
var totalRooms = 0;

//定时解散无人/超时房间:
//1)任一座位玩家断线超过配置秒数,或在线但无真实操作超过配置秒数 → 自动解散
//  (秒数由后台玩法配置 t_game_config.auto_dissolve_seconds 设置,默认300秒;心跳game_ping不算操作)
//2)全员离线超过5分钟自动解散(兜底)
//3)创建超过4小时强制解散,保证房间不会永久存在
setInterval(function(){
    var userMgr = require('./usermgr'); //函数内加载,避免与usermgr循环依赖
    var now = Date.now();
    for(var roomId in rooms){
        var room = rooms[roomId];
        if(room == null || room.seats == null){ continue; }
        checkRoomAutoDissolve(room, userMgr, now);
        flushRoomScores(room);
    }
}, 60*1000);

//座位积分定期落库: 服务重启从 t_rooms 恢复房间时才能还原积分(宝宝玩法座位分是宝宝豆余额, 不写)
function flushRoomScores(room){
    var conf = room.conf || {};
    var type = conf.game_type || conf.type || "";
    if(type == "baobao_mian" || type == "baobao_shou"){ return; }
    for(var i = 0; i < room.seats.length; ++i){
        var s = room.seats[i];
        if(!s || !(s.userId > 0)){ continue; }
        if(s.savedScore === s.score){ continue; }
        s.savedScore = s.score;
        db.update_seat_score(room.id, i, s.score);
    }
}

//对单个房间执行自动解散检查
function checkRoomAutoDissolve(room, userMgr, now){
    var roomId = room.id;
    //4小时强制解散
    var createTime = (room.createTime || 0) * 1000;
    if(createTime > 0 && (now - createTime) >= 4*60*60*1000){
        console.log('[roommgr] force dissolve (4h timeout):', roomId);
        dissolveIdleRoom(room);
        return;
    }
    //统计是否有在线玩家
    var hasOnline = false;
    for(var i = 0; i < room.seats.length; ++i){
        var uid = room.seats[i].userId;
        if(uid > 0 && userMgr.isOnline(uid)){ hasOnline = true; break; }
    }
    //兜底:全员离线超过5分钟解散
    if(hasOnline){
        room.emptySince = null;
    }
    else if(room.emptySince == null){
        room.emptySince = now;
    }
    if(room.emptySince != null && now - room.emptySince >= 5*60*1000){
        dissolveIdleRoom(room);
        return;
    }
    //按玩法配置的秒数检查:任一玩家断线超时或在线无动作超时 → 解散
    var conf = room.conf || {};
    var type = conf.game_type || conf.type || null;
    getGameConfig(type, function(cfg){
        //异步回调时房间可能已被解散
        if(rooms[roomId] !== room){ return; }
        var sec = (cfg && cfg.auto_dissolve_seconds != null ? cfg.auto_dissolve_seconds : 300);
        if(!(sec > 0)){ sec = 300; }
        var limit = sec * 1000;
        for(var i = 0; i < room.seats.length; ++i){
            var uid = room.seats[i].userId;
            if(uid <= 0){ continue; }
            if(userMgr.isOnline(uid)){
                //在线但长时间无真实操作(心跳不算)
                var lastAct = userMgr.getLastActivity(uid);
                if(lastAct > 0 && (now - lastAct) >= limit){
                    console.log('[roommgr] auto dissolve (no activity ' + sec + 's): room=' + roomId + ' userId=' + uid);
                    dissolveIdleRoom(room);
                    return;
                }
            }
            else{
                //断线超过配置秒数
                var offSince = userMgr.getOfflineSince(uid);
                if(offSince > 0 && (now - offSince) >= limit){
                    console.log('[roommgr] auto dissolve (offline ' + sec + 's): room=' + roomId + ' userId=' + uid);
                    dissolveIdleRoom(room);
                    return;
                }
            }
        }
    });
}

function dissolveIdleRoom(room){
    var userMgr = require('./usermgr');
    for(var i = 0; i < room.seats.length; ++i){
        var uid = room.seats[i].userId;
        if(uid > 0 && userMgr.isOnline(uid)){
            userMgr.sendMsg(uid, 'dispress_push', {});
        }
    }
    console.log('[roommgr] idle room dissolved:', room.id);
    exports.destroy(room.id);   //销毁内部广播牌桌座位清空
}

// 从数据库读取玩法配置，带缓存
var configCache = {};
var CONFIG_CACHE_TTL = 30 * 1000; // 30秒缓存,保证后台修改台数/封顶等配置后自动生效
function getGameConfig(type, callback, force){
	var cached = configCache[type];
	if(!force && cached && (Date.now() - cached.time) < CONFIG_CACHE_TTL){
		callback(cached.cfg);
		return;
	}
	db.get_game_config(type, function(cfg){
		if(cfg){
			configCache[type] = {time: Date.now(), cfg: cfg};
		}
		callback(cfg);
	});
}

// 清除配置缓存（后台修改配置后调用）
exports.clearConfigCache = function(){
	configCache = {};
};

// 玩法类型 → 独立游戏管理器（诸暨三玩法各自独立文件）
function getGameMgrByType(type){
	if(type == "baobao_mian" || type == "baobao_shou"){
		return require("./gamemgr_baobao"); // 宝宝(6张) 免摆/手摆共用
	}
	if(type == "zj_lao"){
		return require("./gamemgr_zjlao");  // 诸暨赖倒胡(财神赖子/红中)
	}
	if(type == "zj" || type == "zj4"){
		return require("./gamemgr_ldh");    // 翻财神 2人/4人
	}
	if(type == "zj4_bt"){
		return require("./gamemgr_zj4_bt"); // 包麻将 4人
	}
	if(type == "zj_bt"){
		return require("./gamemgr_bmj");    // 包麻将 2人
	}
	if(type == "zj_zx" || type == "zj4_zx"){
		return require(type == "zj_zx" ? "./gamemgr_zjzx" : "./gamemgr_zjzx4"); // 自选财神 2人/4人
	}
	if(type == "zp"){
		return require("./gamemgr_zp");     // 漳浦麻将 2人
	}
	if(type == "zp4"){
		return require("./gamemgr_zp4");    // 漳浦金麻将 4人
	}
	if(type == "wujin" || type == "wujin4"){
		return require("./gamemgr_wujin");  // 漳浦无金 2人/4人
	}
	if(type == "guanpai2" || type == "guanpai3"){
		return require("./gamemgr_guanpai"); // 跑得快/关牌 2人/3人
	}
	if(type == "niuniu"){
		return require("./gamemgr_niuniu");  // 抢庄牛牛
	}
	if(type == "sss2" || type == "sss4" || type == "sss6"){
		return require("./gamemgr_sss");     // 十三水 2人/4人/6人
	}
	if(type == "dzpk"){
		return require("./gamemgr_dzpk");   // 德州扑克(仅服务端,无客户端场景)
	}
	// 旧数据兜底
	return require("./gamemgr_baobao");
}

function generateRoomId(){
	var roomId = "";
	for(var i = 0; i < 6; ++i){
		roomId += Math.floor(Math.random()*10);
	}
	return roomId;
}

function constructRoomFromDb(dbdata){
	var conf = JSON.parse(dbdata.base_info);
	// 向后兼容补齐:老房间从 DB 恢复时,conf 可能缺后续版本加的字段
	// 1) 先补 conf 自身已有的(驼峰/下划线/旧命名)
	if(conf.baseScore == null && conf.base != null) conf.baseScore = conf.base;
	if(conf.baseScore == null && conf.base_score != null) conf.baseScore = conf.base_score;
	if(conf.maxGames == null && conf.max_games != null) conf.maxGames = conf.max_games;
	if(conf.maxGames == null && conf.jushuxuanze != null) conf.maxGames = conf.jushuxuanze;
	if(conf.maxTai == null && conf.max_tai != null) conf.maxTai = conf.max_tai;
	// 2) 再从内存 configCache(游戏启动/新建房时已填充)拿最新后台配置补齐
	var type = conf.type;
	var cachedCfg = configCache[type];
	if(cachedCfg && cachedCfg.cfg){
		var c = cachedCfg.cfg;
		if(conf.maxTai == null) conf.maxTai = c.max_tai || 10;
		if(conf.taiRules == null) conf.taiRules = c.tai_rules || null;
	}else{
		// configCache 没命中(老房间首次恢复):用默认值兜底,同时触发一次 getGameConfig 把缓存填上
		if(conf.maxTai == null) conf.maxTai = 10;
		getGameConfig(type, function(){}, true); // force=true 强制查 DB 写缓存,后续新建房/恢复房就命中了
	}
	console.log("[constructRoomFromDb] roomId=", dbdata.id, " type=", type, " conf keys=", Object.keys(conf).join(","), " baseScore=", conf.baseScore, " maxTai=", conf.maxTai, " maxGames=", conf.maxGames, " taiRules=", conf.taiRules);

	var maxPlayers = conf.maxPlayers || 2;
	var roomInfo = {
		uuid:dbdata.uuid,
		id:dbdata.id,
		numOfGames:dbdata.num_of_turns,
		createTime:dbdata.create_time,
		nextButton:dbdata.next_button,
		seats:new Array(maxPlayers),
		conf:conf
	};

	roomInfo.gameMgr = getGameMgrByType(conf.type);
	var roomId = roomInfo.id;

	var _seatsLog = [];
	for(var i = 0; i < maxPlayers; ++i){
		var s = roomInfo.seats[i] = {};
		s.userId = dbdata["user_id" + i] || 0;
		s.score = dbdata["user_score" + i] || 0;
		s.name = dbdata["user_name" + i] || "";
		//注意:get_room_data 已把 user_name 从 base64 解成明文, 这里不能再解一次(会变乱码/空)
		s.savedScore = s.score;
		_seatsLog.push('#' + i + ' uid=' + s.userId + ' name=[' + s.name + '] score=' + s.score + ' (db.user_name' + i + '=[' + (dbdata["user_name" + i] || "") + '])');
		s.ready = false;
		s.seatIndex = i;
		s.numZiMo = 0;
		s.numJiePao = 0;
		s.numDianPao = 0;
		s.numAnGang = 0;
		s.numMingGang = 0;
		s.numChaJiao = 0;

		if(s.userId > 0){
			userLocation[s.userId] = {
				roomId:roomId,
				seatIndex:i
			};
		}
	}
	rooms[roomId] = roomInfo;
	console.log('[constructRoomFromDb seats] roomId=' + roomId + ' type=' + type + ' ' + _seatsLog.join(' | '));
	totalRooms++;
	return roomInfo;
}

exports.createRoom = function(creator,roomConf,gems,ip,port,callback){
	var type = roomConf.type;
	// 开放玩法: 宝宝(免摆/手摆) + 翻财神/包麻将/赖倒胡/自选财神/漳浦/无金/跑得快/牛牛
	var allowedTypes = ["baobao_mian","baobao_shou","zj","zj4","zj4_bt","zj_bt","zj_lao","zj_zx","zj4_zx","zp","zp4","wujin","wujin4","guanpai2","guanpai3","niuniu","sss2","sss4","sss6"];
	if(allowedTypes.indexOf(type) < 0){
		callback(1,null);
		return;
	}

	// 每个玩法各自的收费模式开关: 开=该玩法按俱乐部配置抽水/暗水/房费/表情/洗牌(不扣房卡); 关=只扣房卡
	require("./charge").unifiedCharge(type, function(unifiedOn){
	// 从数据库读取玩法配置（建房必须走最新配置,不走缓存,确保后台开关（去条子/单双财神等）立即生效）
	getGameConfig(type, function(cfg){
		if(!cfg){
			callback(1,null);
			return;
		}
		if(cfg.enabled == 0){
			callback(1,null);
			return;
		}
		var DI_FEN = cfg.difen_options;
		var JU_SHU = cfg.jushu_options;
		var JU_SHU_COST = cfg.cost_options;
		var CHIPS = cfg.chips_options || [1000];
		var maxPlayers = cfg.max_players || 2;

		if(roomConf.type == null || roomConf.difen == null || roomConf.jushuxuanze == null){
			callback(1,null);
			return;
		}
		//牌桌直接输入底分(difen_value)时跳过后台选项下标校验
		if(roomConf.difen_value == null && (roomConf.difen < 0 || roomConf.difen >= DI_FEN.length)){
			callback(1,null);
			return;
		}
		//俱乐部牌桌直接给实际局数(jushu_value)时同样跳过后台选项下标校验(俱乐部选项与全局配置可能不一致)
		if(roomConf.jushu_value == null && (roomConf.jushuxuanze < 0 || roomConf.jushuxuanze >= JU_SHU.length)){
			callback(1,null);
			return;
		}
		// 德州扑克：起始筹码选项校验
		if(type == "dzpk"){
			if(roomConf.chips == null || roomConf.chips < 0 || roomConf.chips >= CHIPS.length){
				callback(1,null);
				return;
			}
		}

		//俱乐部牌桌在conf里带了自己的房卡单价时以它为准(后台弹窗里配的房卡), 否则按全局局数选项取
		var cost = (roomConf.cost != null && Number(roomConf.cost) > 0) ? Number(roomConf.cost) : (JU_SHU_COST[roomConf.jushuxuanze] || 0);
		// 统一收费(抽水模式)不扣房卡; 关闭时所有玩法(含宝宝)都按房卡扣, 需要校验余额
		if(!unifiedOn && cost > gems){
			callback(2222,null);
			return;
		}

		var fnCreate = function(){
			var roomId = generateRoomId();
			if(rooms[roomId] != null || creatingRooms[roomId] != null){
				fnCreate();
			}
			else{
				creatingRooms[roomId] = true;
				db.is_room_exist(roomId, function(ret) {

					if(ret){
						delete creatingRooms[roomId];
						fnCreate();
					}
					else{
						var createTime = Math.ceil(Date.now()/1000);
						var conf = {
							type: roomConf.type,
							baseScore: roomConf.difen_value != null ? Number(roomConf.difen_value) : DI_FEN[roomConf.difen],
							maxGames: (roomConf.jushu_value != null && Number(roomConf.jushu_value) > 0) ? Number(roomConf.jushu_value) : JU_SHU[roomConf.jushuxuanze],
							cost: unifiedOn ? 0 : cost,
							unified_charge: unifiedOn ? 1 : 0,
							creator: creator,
							maxTai: cfg.max_tai || 10,
							maxPlayers: maxPlayers
						};

						//俱乐部牌桌:保留俱乐部id/玩法,供人数变化时向 club_<clubid> 广播(由大厅服写入conf)
						if(roomConf.clubid != null){ conf.clubid = roomConf.clubid; }
						if(roomConf.game_type != null){ conf.game_type = roomConf.game_type; }
						if(roomConf.club_table_id != null){ conf.club_table_id = roomConf.club_table_id; } //牌桌id随conf入房,推送人数时直接定位牌桌卡片
						if(roomConf.club_table_name != null){ conf.club_table_name = roomConf.club_table_name; } //玩家录入的真实牌桌名

						// 诸暨麻将特有配置
						if(type == "zj" || type == "zj_lao" || type == "zj_bt" || type == "zj4" || type == "zj4_bt" || type == "zj_zx" || type == "zj4_zx"){
							if(type == "zj" || type == "zj4") conf.playStyle = 'fancaishen';
							else if(type == "zj_bt" || type == "zj4_bt") conf.playStyle = 'baocaishen';
							else if(type == "zj_zx" || type == "zj4_zx") conf.playStyle = 'zixuancaishen';
							conf.maxTai = roomConf.maxTai || cfg.max_tai || 10;
							conf.caishen_cpg = cfg.caishen_cpg != null ? cfg.caishen_cpg : 1;
							conf.taiRules = roomConf.tai_rules || cfg.tai_rules || null;
							conf.baoSeatIndex = roomConf.baoSeatIndex != null ? roomConf.baoSeatIndex : -1;
							conf.baoTai = roomConf.baoTai || 2;
							conf.baoTaiFee = roomConf.baoTaiFee || 0;
							// 后台全局开关:财吃/财碰/财杠/点炮胡(赖倒胡与翻财神共用)
							conf.cai_chi = cfg.cai_chi != null ? cfg.cai_chi : 1;
							conf.cai_peng = cfg.cai_peng != null ? cfg.cai_peng : 1;
							conf.cai_gang = cfg.cai_gang != null ? cfg.cai_gang : 1;
							conf.cai_pure = cfg.cai_pure != null ? cfg.cai_pure : 0;
							// 后台全局开关:可胡点过是否弹二次确认(客户端据下发值决定,缺省开)
							conf.hu_guo_confirm = cfg.hu_guo_confirm != null ? cfg.hu_guo_confirm : 1;
							conf.dianpao_hu = cfg.dianpao_hu != null ? cfg.dianpao_hu : 1;
							// 二人诸暨玩法:是否去掉条子(仅 zj/zj_lao/zj_bt 生效,zj4/zj4_bt 忽略)
							conf.remove_tiao = cfg.remove_tiao != null ? cfg.remove_tiao : 0;
							conf.remove_wan = cfg.remove_wan != null ? cfg.remove_wan : 0;
							conf.remove_tong = cfg.remove_tong != null ? cfg.remove_tong : 0;
							// 俱乐部玩法配置的 remove_* 存在 tai_rules JSON 里,展开到 conf(俱乐部牌桌配置覆盖全局)
							var tr = conf.taiRules;
							if(typeof tr === 'string'){
								try{ tr = JSON.parse(tr); }catch(e){ tr = null; }
							}
							if(tr && typeof tr === 'object'){
								if(tr.remove_tiao != null) conf.remove_tiao = tr.remove_tiao;
								if(tr.remove_wan != null) conf.remove_wan = tr.remove_wan;
								if(tr.remove_tong != null) conf.remove_tong = tr.remove_tong;
							}
							// 翻财神/赖倒胡:财神模式(1=双财神7财,0=单财神4财)
							conf.cai7 = cfg.cai7 != null ? cfg.cai7 : 0;
							// 赖倒胡专属开关:天胡地胡翻倍/财吊翻倍
							if(type == "zj_lao"){
								conf.tianhu_di = cfg.tianhu_di != null ? cfg.tianhu_di : 1;
								conf.cai_diao = cfg.cai_diao != null ? cfg.cai_diao : 1;
							}
							// 包财神专属:每台包台分数(结算时包台分=包台数×此值)
							if(type == "zj_bt" || type == "zj4_bt"){
								conf.bao_tai_score = cfg.bao_tai_score != null ? cfg.bao_tai_score : 1;
								// 结算分:胡牌分=底分×2^(台数-1), 包台分=底分×2^(包台数-1), 底分取添加牌桌时选的底分
							}
							// 自选财神专属:老庄结算倍数(默认2)
							if(type == "zj_zx" || type == "zj4_zx"){
								conf.laozhuang_multiplier = cfg.laozhuang_multiplier != null ? cfg.laozhuang_multiplier : 2;
							}
						}

						// 漳浦麻将特有配置：台数规则优先用俱乐部自配(牌桌conf下发),空则用后台全局 tai_rules
						if(type == "zp" || type == "zp4" || type == "wujin" || type == "wujin4"){
							conf.taiRules = roomConf.tai_rules || cfg.tai_rules || null;
						}

						// 德州扑克特有配置：小盲、起始筹码
						if(type == "dzpk"){
							conf.smallBlind = DI_FEN[roomConf.difen];
							conf.chips = CHIPS[roomConf.chips];
						}

						// 十三水:摆牌超时来自 tai_rules.arrange_timeout(俱乐部/后台配置),默认30秒
						if(type == "sss2" || type == "sss4" || type == "sss6"){
							conf.taiRules = roomConf.tai_rules || cfg.tai_rules || null;
							var sssRules = conf.taiRules;
							if(typeof sssRules === "string"){
								try{ sssRules = JSON.parse(sssRules); }catch(e){ sssRules = null; }
							}
							if(sssRules && sssRules.arrange_timeout != null){
								var at = Number(sssRules.arrange_timeout);
								conf.arrangeTimeout = (at > 0) ? at : 30;
							}
						}

						// 宝宝(6张): 倍率表/有无庄/乌龙校验/摆牌超时 全部走 tai_rules(俱乐部自配优先)
						var isBaobao = (type == "baobao_mian" || type == "baobao_shou");
						if(isBaobao){
							conf.taiRules = roomConf.tai_rules || cfg.tai_rules || null;
							// 牌桌级开关(添加牌桌时选有庄/无庄): 优先于后台玩法配置
							if(roomConf.banker_mode != null){ conf.banker_mode = Number(roomConf.banker_mode) ? 1 : 0; }
							// 牌桌级宝宝豆: 进场最低 / 结算后低于该值请出
							conf.min_bean = Number(roomConf.min_bean) || 0;
							conf.kick_bean = Number(roomConf.kick_bean) || 0;
							// 表情分/洗牌分: 同样来自牌桌conf(俱乐部玩法配置同步), 0=不扣
							conf.face_score = Number(roomConf.face_score) || 0;
							conf.shuffle_score = Number(roomConf.shuffle_score) || 0;
						}

						// 俱乐部玩法配置(抽水/暗水/房费/表情/洗牌; 宝宝另含人数限制)
						// 统一收费开启时所有玩法都按它结算; 关闭时表情/洗牌/抽水等由charge模块统一拦截
						if(roomConf.clubid != null){
							var onClubCfg = function(clubCfg){
								if(clubCfg){
									//牌桌自身conf优先(每张牌桌参数独立), 缺失的字段才用玩法配置兜底
									var pick = function(k, def){
										if(roomConf[k] == null || roomConf[k] === ''){ return def; }
										var v = Number(roomConf[k]);
										return isNaN(v) ? def : v;
									};
									conf.clubGameConfig = {
										minPlayers: pick('min_players', clubCfg.min_players || 2),
										maxPlayers: pick('max_players', clubCfg.max_players_custom || 6),
										rakePercent: pick('rake_percent', clubCfg.rake_percent || 0),
										hiddenRakePercent: pick('hidden_rake_percent', clubCfg.hidden_rake_percent || 0),
										rakePerRound: pick('rake_per_round', clubCfg.rake_per_round != null ? clubCfg.rake_per_round : 1),
										roomFee: pick('room_fee', clubCfg.room_fee || 0),
										roomFeePayer: pick('room_fee_payer', clubCfg.room_fee_payer || 0),
										//费用类(进房/表情/洗牌)抽取比例: 未配置按100%(全额进俱乐部链)
										fee_rake_percent: pick('fee_rake_percent', (clubCfg.fee_rake_percent == null) ? 100 : (Number(clubCfg.fee_rake_percent) || 0)),
										club_id: clubCfg.club_id || 0,
										clubId: clubCfg.club_id || 0
									};
									conf.face_score = pick('face_score', conf.face_score != null ? conf.face_score : (Number(clubCfg.face_score) || 0));
									conf.shuffle_score = pick('shuffle_score', conf.shuffle_score != null ? conf.shuffle_score : (Number(clubCfg.shuffle_score) || 0));
									//记录配置id, 结算/扣费时按它实时重读DB, 馆主改配置后无需重建房间即可生效
									conf.game_config_id = clubCfg.id || cfgId || 0;
									// 俱乐部人数限制只对宝宝玩法生效(其它玩法人数由玩法固定)
									if(isBaobao && conf.clubGameConfig.maxPlayers > 0){
										maxPlayers = conf.clubGameConfig.maxPlayers;
										conf.maxPlayers = maxPlayers;
									}
								}
								// 继续创建房间(异步拿到配置后再建)
								finishCreateRoom();
							};
							// 优先用牌桌绑定的玩法配置id(同类型多套玩法时避免取错); 老牌桌回退按俱乐部+类型查
							var cfgId = Number(roomConf.game_config_id) || 0;
							if(cfgId > 0){
								db.club_game_get_config(cfgId, function(cfgById){
									if(cfgById){ onClubCfg(cfgById); }
									else { db.club_game_get_config_by_club_type(roomConf.clubid, type, onClubCfg); }
								});
							} else {
								db.club_game_get_config_by_club_type(roomConf.clubid, type, onClubCfg);
							}
						} else {
							finishCreateRoom();
						}

						function finishCreateRoom(){
							var roomInfo = {
								uuid:"",
								id:roomId,
								numOfGames:0,
								createTime:createTime,
								nextButton:0,
								seats:[],
								conf:conf
							};
							//非宝宝玩法(如跑得快/关牌)没有taiRules, JSON.stringify(undefined)是undefined, 直接.substring会崩掉建房
							var _taiDebug = conf.taiRules ? JSON.stringify(conf.taiRules) : "";
							console.log("[createRoom] roomId=", roomId, " type=", type, " conf keys=", Object.keys(conf), " baseScore=", conf.baseScore, " maxTai=", conf.maxTai, " maxGames=", conf.maxGames, " taiRules=", _taiDebug.substring(0,80));

							roomInfo.gameMgr = getGameMgrByType(type);
							console.log(roomInfo.conf);

							for(var i = 0; i < maxPlayers; ++i){
								roomInfo.seats.push({
									userId:0,
									score:0,
									name:"",
									ready:false,
									seatIndex:i,
									numZiMo:0,
									numJiePao:0,
									numDianPao:0,
									numAnGang:0,
									numMingGang:0,
									numChaJiao:0,
								});
							}


							//写入数据库
							db.create_room(roomInfo.id,roomInfo.conf,ip,port,createTime,function(uuid){
								delete creatingRooms[roomId];
								if(uuid != null){
									roomInfo.uuid = uuid;
									console.log(uuid);
									rooms[roomId] = roomInfo;
									totalRooms++;
									callback(0,roomId);
								}
								else{
									callback(3,null);
								}
							});
						}
					}
				});
			}
		}

		fnCreate();
	}, true);
	});
};

exports.destroy = function(roomId,callback){
	var roomInfo = rooms[roomId];
	if(roomInfo == null){
		if(callback){ callback(); }
		return;
	}

	//销毁前快照:牌桌解绑落库后统一广播座位清空,
	//避免各销毁入口(整场结束/投票解散/下一局人数不足/自动清房)漏推送导致牌桌列表残留有人
	var snap = null;
	try{
		snap = JSON.parse(JSON.stringify(roomInfo));
		snap.seats = [];
	}catch(e){}

	for(var i = 0; i < roomInfo.seats.length; ++i){
		var userId = roomInfo.seats[i].userId;
		if(userId > 0){
			delete userLocation[userId];
			db.set_room_id_of_user(userId,null);
		}
	}

	delete rooms[roomId];
	totalRooms--;
	db.delete_room(roomId);
	//同步解绑俱乐部牌桌(所有绑定到该房间的牌桌roomid置NULL):
	//否则牌桌列表LEFT JOIN出旧房间座位数据,牌桌一直显示被占用
	//回调在解绑落库后触发:调用方需等DB最终一致再回包/广播,否则客户端立即回查会读回旧数据
	db.club_unbind_room(roomId,function(){
		if(snap != null){
			try{ require('./socket_service').broadcastClubUpdatePublic(roomId,snap); }catch(e){}
		}
		if(callback){ callback(); }
	});
}

exports.getTotalRooms = function(){
	return totalRooms;
}

exports.getRoom = function(roomId){
	return rooms[roomId];
};

exports.isCreator = function(roomId,userId){
	var roomInfo = rooms[roomId];
	if(roomInfo == null){
		return false;
	}
	return roomInfo.conf.creator == userId;
};

exports.enterRoom = function(roomId,userId,userName,callback){
	var fnTakeSeat = function(room){
		if(exports.getUserRoom(userId) == roomId){
			//已存在
			return 0;
		}

		for(var i = 0; i < room.seats.length; ++i){
			var seat = room.seats[i];
			if(seat.userId <= 0){
				seat.userId = userId;
				seat.name = userName;
				seat.entryCharged = false; //新入座: 下一局开局时扣"进房首局"豆
				//宝宝玩法: 座位积分直接显示账户宝宝豆余额
				var rtype = room.conf && room.conf.type;
				if(rtype == "baobao_mian" || rtype == "baobao_shou"){
					db.get_user_data_by_userid(userId, function(ud){
						if(ud && ud.gems != null && seat.userId == userId) seat.score = ud.gems;
					});
				}
				else{
					//麻将房间: 座位积分按本房间从0起算, 否则新玩家会继承上一位坐这里的玩家的分数
					seat.score = 0;
					seat.savedScore = 0;
					db.update_seat_score(roomId,i,0);
				}
				userLocation[userId] = {
					roomId:roomId,
					seatIndex:i
				};
				//console.log(userLocation[userId]);
				db.update_seat_info(roomId,i,seat.userId,"",seat.name);
				//同步写用户房间绑定:退出/销毁时清NULL,保证DB绑定与内存一致(非房主进桌此前从未落盘)
				db.set_room_id_of_user(userId,roomId);
				//正常
				return 0;
			}
		}
		//房间已满
		return 1;
	}
	var room = rooms[roomId];
	if(room){
		var ret = fnTakeSeat(room);
		callback(ret);
	}
	else{
		db.get_room_data(roomId,function(dbdata){
			if(dbdata == null){
				//找不到房间
				callback(2);
			}
			else{
				//construct room.
				room = constructRoomFromDb(dbdata);
				//
				var ret = fnTakeSeat(room);
				callback(ret);
			}
		});
	}
};

exports.setReady = function(userId,value){
	var roomId = exports.getUserRoom(userId);
	if(roomId == null){
		return;
	}

	var room = exports.getRoom(roomId);
	if(room == null){
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if(seatIndex == null){
		return;
	}

	var s = room.seats[seatIndex];
	s.ready = value;
}

exports.isReady = function(userId){
	var roomId = exports.getUserRoom(userId);
	if(roomId == null){
		return;
	}

	var room = exports.getRoom(roomId);
	if(room == null){
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if(seatIndex == null){
		return;
	}

	var s = room.seats[seatIndex];
	return s.ready;
}


exports.getUserRoom = function(userId){
	var location = userLocation[userId];
	if(location != null){
		return location.roomId;
	}
	return null;
};

// 别名：gamemgr 中使用 getRoomIdOfUser，保持兼容
exports.getRoomIdOfUser = exports.getUserRoom;

exports.getUserSeat = function(userId){
	var location = userLocation[userId];
	//console.log(userLocation[userId]);
	if(location != null){
		return location.seatIndex;
	}
	return null;
};

//扣费(洗牌/表情)或加豆后, 把最新宝宝豆同步到房间座位分数并广播, 让房间里立刻看到分数变化
exports.refreshSeatGems = function(roomId,userId,done){
	var roomInfo = rooms[roomId];
	if(roomInfo == null){ if(done){ done(); } return; }
	db.get_user_data_by_userid(userId,function(ud){
		var score = (ud && ud.gems != null) ? (Number(ud.gems) || 0) : null;
		if(score != null){
			var seatIndex = exports.getUserSeat(userId);
			if(seatIndex != null && roomInfo.seats[seatIndex] && roomInfo.seats[seatIndex].userId == userId){
				roomInfo.seats[seatIndex].score = score;
			}
			var userMgr = require('./usermgr'); //函数内加载,避免与usermgr循环依赖
			userMgr.brocastInRoom(roomId,"bb_gems_push",{userid:userId,score:score});
		}
		if(done){ done(); }
	});
};

exports.getUserLocations = function(){
	return userLocation;
};

exports.exitRoom = function(userId,callback){
	var location = userLocation[userId];
	if(location == null){
		if(callback){ callback(); }
		return;
	}

	var roomId = location.roomId;
	var seatIndex = location.seatIndex;
	var room = rooms[roomId];
	delete userLocation[userId];
	if(room == null || seatIndex == null) {
		if(callback){ callback(); }
		return;
	}

	var seat = room.seats[seatIndex];
	seat.userId = 0;
	seat.name = "";
	seat.score = 0;       //退出清积分, 防止下一位进座继承
	seat.savedScore = 0;

	//清座位、清积分、清绑定三条SQL都落库后再回调,避免调用方立即回查读到旧座位(牌桌列表"退出后不更新")
	var left = 3;
	var done = function(){
		left--;
		if(left <= 0 && callback){ callback(); }
	};

	//同步清掉DB座位,否则俱乐部详情页/club_tables(LEFT JOIN t_rooms)仍显示已退出玩家
	db.update_seat_info(roomId,seatIndex,0,"","",done);
	db.update_seat_score(roomId,seatIndex,0,done);

	//条件清绑定:仅当DB绑定仍指向本房间才置NULL,
	//防止"退出→立刻重进新房间"时本清空SQL异步后到误清新房间的绑定
	db.set_room_id_of_user(userId,null,roomId,done);

	//退出仅清座位,不销毁房间:退出≠解散,房间必须保留供他人再进
	//空房由调用方判断后销毁(未开局退出)/自动解散定时器兜底回收(全员离线5分钟/创建超4小时)
};

//房间内已无任何占位玩家时销毁释放:仅在"未开局退出/整场打完退出/后台清桌"分支调用,
//对局进行中严禁调用(否则正在打牌的房间被误释放)
exports.destroyIfEmpty = function(roomId,callback){
	var roomInfo = rooms[roomId];
	if(roomInfo == null){
		if(callback){ callback(); }
		return;
	}
	for(var i = 0; i < roomInfo.seats.length; ++i){
		if(roomInfo.seats[i].userId > 0){
			if(callback){ callback(); }
			return;
		}
	}
	exports.destroy(roomId,callback);
};
