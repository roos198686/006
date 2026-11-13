var crypto = require('../utils/crypto'); //加密工具
var express = require('express'); 
var db = require('../utils/db');  //数据库管理工具
var http = require('../utils/http'); //http 管理工具
var room_service = require("./room_service"); 
//应用级中间件绑定到 app 对象 使用
var app = express();
var config = null;

//内置头像数量(客户端 resources/images/avatars/avatar_01~avatar_18)
var AVATAR_COUNT = 18;
//随机生成一个内置头像key, 用于新建档/老账号补头像
function randomAvatarKey(){
	var n = Math.floor(Math.random() * AVATAR_COUNT) + 1;
	return "avatar_" + (n < 10 ? "0" + n : n);
}
//校验客户端传来的头像key(只允许 avatar_01~avatar_18)
function normalizeAvatarKey(key){
	var m = /^avatar_(\d{1,3})$/.exec(key || "");
	if(!m){ return null; }
	var n = Number(m[1]);
	if(n < 1 || n > AVATAR_COUNT){ return null; }
	return "avatar_" + (n < 10 ? "0" + n : n);
}

//判断账号密码都不为空
function check_account(req,res){
	var account = req.query.account;
	var sign = req.query.sign;
	if(account == null || sign == null){
		http.send(res,1,"unknown error");
		return false;
	}
	/*
	var serverSign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
	if(serverSign != sign){
		http.send(res,2,"login failed.");
		return false;
	}
	*/
	return true;
}

//设置跨域访问
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});


//login请求 
app.get('/login',function(req,res){
    //判断账号密码是否为空
    if(!check_account(req,res)){
		return;
	}
	//获取接受的ip
    var ip = req.ip;
    //校验ip
	if(ip.indexOf("::ffff:") != -1){
		ip = ip.substr(7);
	}
	//账号
    var account = req.query.account;
    //从数据库获取用户信息
	db.get_user_data(account,function(data){
        //如果查询为空 返回
        if(data == null){
			http.send(res,0,"ok");
			return;
		}
        //老账号(早期建档时headimg为空)补一个随机内置头像, 之后不再改动; 只补空值, 不影响已选头像
		db.get_user_base_info(data.userid,function(info){
			if(info && !info.headimg){
				db.update_user_headimg(account, randomAvatarKey());
			}
		});
        //返回数据库查询信息
		var ret = {
			account:data.account,
			userid:data.userid,
			name:data.name,
			lv:data.lv,
			exp:data.exp,
			coins:data.coins,
			gems:data.gems,
			ip:ip,
			sex:data.sex,
		};
        
        //数据库查询房间是否存在
		db.get_room_id_of_user(data.userid,function(roomId){
			//如果用户处于房间中，则需要对其房间进行检查。 如果房间还在，则通知用户进入
			if(roomId != null){
				//检查房间是否存在于数据库中
				db.is_room_exist(roomId,function (retval){
					if(retval){
						ret.roomid = roomId;
					}
					else{
						//如果房间不在了，表示信息不同步，清除掉用户记录
						db.set_room_id_of_user(data.userid,null);
					}
					http.send(res,0,"ok",ret);
				});
			}
			else {
				http.send(res,0,"ok",ret);
			}
		});
	});
});

//创建用户接口 游客登录创建用户名
app.get('/create_user',function(req,res){
    //判断账号密码是否不为空
    if(!check_account(req,res)){
		return;
	}
	var account = req.query.account; //账号
	var name = req.query.name;  //获取名字
	var headimg = normalizeAvatarKey(req.query.headimg); //首次建档随机头像(avatar_01~18), 非法值则用空
	var coins = 0;//初试金兵
	var gems = 0;//初试房卡
	console.log(name);
    //判断名字用户是否已经存在
	db.is_user_exist(account,function(ret){
        //如果不存在
        if(!ret){
            //数据库创建该用户
			db.create_user(account,name,coins,gems,0,headimg,function(ret){
               //返回为空 返回错误请求
                if (ret == null) {
					http.send(res,2,"system error.");
				}
				else{
                    //返会ok
					http.send(res,0,"ok");					
				}
			});
		}
		else{
            //用户已经存在
			http.send(res,1,"account have already exist.");
		}
	});
});


//创建房间
app.get('/create_private_room',function(req,res){
	//验证参数合法性
	var data = req.query;
	//验证玩家身份
	if(!check_account(req,res)){
		return;
	}
    //账号
	var account = data.account; 
    //置空
	data.account = null;
	data.sign = null;
    var conf = data.conf; //获取金兵数量
    //获取user数据 
	db.get_user_data(account,function(data){
        //如果数据为空 系统错误
        if(data == null){
			http.send(res,1,"system error");
			return;
        } 
        //获取用户id name
		var userId = data.userid; 
		var name = data.name;
		//验证玩家状态
		db.get_room_id_of_user(userId,function(roomId){
			if(roomId != null){
				http.send(res,-1,"user is playing in room now.");
				return;
			}
			//创建房间
			room_service.createRoom(account,userId,conf,function(err,roomId){
				if(err == 0 && roomId != null){
                    //进入房间
					room_service.enterRoom(userId,name,roomId,function(errcode,enterInfo){
						if(enterInfo){
							var ret = {
								roomid:roomId,
								ip:enterInfo.ip,
								port:enterInfo.port,
								token:enterInfo.token,
								time:Date.now()
							};
							ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
							http.send(res,0,"ok",ret);
						}
						else{
							http.send(res,errcode,"room doesn't exist.");
						}
					});
				}
				else{
					http.send(res,err,"create failed.");					
				}
			});
		});
	});
});


//进入房间
app.get('/enter_private_room',function(req,res){
	var data = req.query;
    var roomId = data.roomid;
    //判断房间id是否存在
	if(roomId == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
    }
    //判断账号是否是否不为空
	if(!check_account(req,res)){
		return;
	}
    //获取数据
	var account = data.account;
    //获取数据
	db.get_user_data(account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		var userId = data.userid;
		var name = data.name;

		//验证玩家状态
		//todo
		//进入房间前:若目标房间属于某俱乐部,校验当前用户是否为该俱乐部成员(未加入任何俱乐部或非本俱乐部则拒绝)
		var doEnterRoom = function(){
			room_service.enterRoom(userId,name,roomId,function(errcode,enterInfo,errmsg){
				if(enterInfo){
					var ret = {
						roomid:roomId,
						ip:enterInfo.ip,
						port:enterInfo.port,
						token:enterInfo.token,
						time:Date.now()
					};
					ret.sign = crypto.md5(roomId + ret.token + ret.time + config.ROOM_PRI_KEY);
					http.send(res,0,"ok",ret);
				}
				else{
					//透传游戏服errmsg(如"宝宝豆不足，无法进入房间"),客户端2222分支据此弹窗提示
					http.send(res,errcode,errmsg || "enter room failed.");
				}
			});
		};
		//查房间 conf,取出 clubid(俱乐部建房时写入)
		db.get_room_data(roomId,function(roomData){
			if(roomData == null){
				//房间不存在,交给后续 enterRoom 返回原"房间不存在"错误
				doEnterRoom();
				return;
			}
			var clubId = 0;
			try{
				var confObj = JSON.parse(roomData.base_info) || {};
				clubId = parseInt(confObj.clubid) || 0;
			}catch(e){ clubId = 0; }
			if(!(clubId > 0)){
				//普通房间(不属于任何俱乐部),放行
				doEnterRoom();
				return;
			}
			//俱乐部房间:校验用户是否为该俱乐部成员(未加入任何俱乐部 isMember=false)
			db.club_is_member(clubId,userId,function(isMember){
				if(!isMember){
					console.log('[enter_private_room] reject: userId=' + userId + ' not member of club ' + clubId + ' for room ' + roomId);
					http.send(res,3333,"该房间属于其他俱乐部，无法进入");
					return;
				}
				doEnterRoom();
			});
		});
	});
});

//获取历史记录
app.get('/get_history_list',function(req,res){
    var data = req.query; //数据合法性
    //账号合法性
	if(!check_account(req,res)){
		return;
    }
    //获取用户信息
	var account = data.account;
	db.get_user_data(account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
        var userId = data.userid;
        //数据库查询历史记录
		db.get_user_history(userId,function(history){
			http.send(res,0,"ok",{history:history});
		});
	});
});
//获取在哪个房间game
app.get('/get_games_of_room',function(req,res){
	var data = req.query;
    var uuid = data.uuid;
    //获取uuid
	if(uuid == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
    }
    //账号合法性
	if(!check_account(req,res)){
		return;
    }
    //数据库查询
	db.get_games_of_room(uuid,function(data){
		console.log(data);
		http.send(res,0,"ok",{data:data});
	});
});

//获取游戏细节
app.get('/get_detail_of_game',function(req,res){
	var data = req.query;
	var uuid = data.uuid;
    var index = data.index;
    //判断是否为空
	if(uuid == null || index == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
    }
    //验证账号合法性
	if(!check_account(req,res)){
		return;
    }
    //数据库获取细节
	db.get_detail_of_game(uuid,index,function(data){
		http.send(res,0,"ok",{data:data});
	});
});

//我的录像列表(3天内,房间->局两级)
app.get('/get_replay_list',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.get_replay_list(data.userid,3,function(list){
			http.send(res,0,"ok",{list:list});
		});
	});
});

//获取单局录像全量数据(仅参与者可看,上帝视角)
app.get('/get_replay',function(req,res){
	var data = req.query;
	var uuid = data.uuid;
	var index = parseInt(data.index, 10);
	if(uuid == null || isNaN(index)){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	//房号只允许字母数字,避免拼SQL注入
	if(!/^[A-Za-z0-9]+$/.test(uuid)){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	if(!check_account(req,res)){
		return;
	}
	db.get_user_data(data.account,function(user){
		if(user == null){
			http.send(res,-1,"system error");
			return;
		}
		db.get_replay(uuid,index,function(row){
			if(row == null){
				http.send(res,1,"replay not exist.");
				return;
			}
			//校验请求者是本局参与者
			var players = ("," + row.players + ",");
			if(players.indexOf("," + user.userid + ",") == -1){
				http.send(res,2,"no permission.");
				return;
			}
			http.send(res,0,"ok",{replay:JSON.parse(row.data)});
		});
	});
});

//获取房卡状态
app.get('/get_user_status',function(req,res){
    //账号合法性
	if(!check_account(req,res)){
		return;
    }
    //获取房卡数量
	var account = req.query.account;
	db.get_gems(account,function(data){
		if(data != null){
			http.send(res,0,"ok",{gems:data.gems});	
		}
		else{
			http.send(res,1,"get gems failed.");
		}
	});
});

//获的notcie信息
app.get('/get_message',function(req,res){
	if(!check_account(req,res)){
		return;
    }
    //type
	var type = req.query.type;
	
	if(type == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	//版本
    var version = req.query.version;
    //获取类型
	db.get_message(type,version,function(data){
		if(data != null){
			http.send(res,0,"ok",{msg:data.msg,version:data.version});	
		}
		else{
			http.send(res,1,"get message failed.");
		}
	});
});

//判断是否在线
app.get('/is_server_online',function(req,res){
	if(!check_account(req,res)){
		return;
    }
    //ip 端口
	var ip = req.query.ip;
    var port = req.query.port;
    //是否在线
	room_service.isServerOnline(ip,port,function(isonline){
		var ret = {
			isonline:isonline
		};
		http.send(res,0,"ok",ret);
	}); 
});

//==================== 俱乐部接口 ====================
//club名称防注入清洗(去引号反斜杠)
function cleanClubStr(s){
	return String(s).replace(/[\\'"]/g,"");
}

//我的俱乐部列表(附带是否代理,客户端据此显示创建按钮)
app.get('/club_list',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		var userId = data.userid;
		db.is_agent(userId,function(isAgent){
			db.club_list_of_user(userId,function(clubs){
				http.send(res,0,"ok",{is_agent:isAgent,clubs:clubs});
			});
		});
	});
});

//创建俱乐部:代理可开顶级俱乐部;社长可在自己的俱乐部下开子俱乐部(parentclid)
app.get('/club_create',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var name = req.query.name;
	if(name == null || name.length == 0){
		http.send(res,-1,"club name required.");
		return;
	}
	//上级俱乐部ID(可选,传了就是开子俱乐部)
	var parentClubId = parseInt(req.query.parentclid);
	if(!(parentClubId > 0)){
		parentClubId = 0;
	}
	//指定归属玩家ID(可选):开了就归到这个玩家名下,传了就校验该玩家是否存在
	var ownerUserid = parseInt(req.query.owneruserid);
	if(!(ownerUserid > 0)){
		ownerUserid = 0;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		var userId = data.userid;
		//校验归属玩家:必须真实存在,否则返回错误码5
		var checkOwner = function(cb){
			if(!(ownerUserid > 0) || ownerUserid === userId){
				cb(userId);
				return;
			}
			db.get_user_data_by_userid(ownerUserid,function(u){
				if(u == null){
					http.send(res,5,"user not found.");
					return;
				}
				cb(ownerUserid);
			});
		};
		var doCreate = function(pid, ownerId){
			db.club_create(cleanClubStr(name),ownerId,pid,function(clubId){
				if(clubId == null){
					http.send(res,1,"create failed.");
					return;
				}
				http.send(res,0,"ok",{clubid:clubId});
			});
		};
		if(parentClubId > 0){
			//子俱乐部:只有上级俱乐部的社长本人可以开
			db.club_get(parentClubId,function(club){
				if(club == null){
					http.send(res,3,"club not found.");
					return;
				}
				if(club.owner_userid != userId){
					http.send(res,4,"only club owner can create sub club.");
					return;
				}
				checkOwner(function(ownerId){ doCreate(parentClubId, ownerId); });
			});
			return;
		}
		db.is_agent(userId,function(isAgent){
			if(!isAgent){
				http.send(res,2,"only agent can create club.");
				return;
			}
			checkOwner(function(ownerId){ doCreate(0, ownerId); });
		});
	});
});

//我的乐豆流水(俱乐部"我的乐豆详情"记录页):from=起始时间戳,0表示全部
app.get('/my_bean_logs',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		var from = parseInt(req.query.from) || 0;
		db.get_bean_logs(data.userid, from, function(rows){
			http.send(res,0,"ok",{logs:rows || []});
		}, true);
	});
});

//加入俱乐部(输入俱乐部ID)
app.get('/club_join',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	if(!(clubId > 0)){
		http.send(res,-1,"clubid required.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get(clubId,function(club){
			if(club == null){
				http.send(res,3,"club not found.");
				return;
			}
			db.club_is_member(clubId,data.userid,function(isMember){
				if(isMember){
					http.send(res,4,"已在该俱乐部中");
					return;
				}
				db.club_join(clubId,data.userid,function(ok){
					if(!ok){
						http.send(res,1,"join failed.");
						return;
					}
					http.send(res,0,"ok",{clubid:clubId,name:club.name});
				});
			});
		});
	});
});

//拉人进俱乐部(仅社长,输入玩家ID直接拉入,无需对方确认)
app.get('/club_pull',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	var targetId = parseInt(req.query.userid);
	if(!(clubId > 0) || !(targetId > 0)){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get(clubId,function(club){
			if(club == null){
				http.send(res,3,"club not found.");
				return;
			}
			if(club.owner_userid != data.userid){
				http.send(res,4,"仅俱乐部管理员可拉人");
				return;
			}
			db.get_user_data_by_userid(targetId,function(target){
				if(target == null){
					http.send(res,5,"该玩家ID不存在，请确认后重试");
					return;
				}
				db.club_is_member(clubId,targetId,function(isMember){
					if(isMember){
						http.send(res,6,"该玩家已加入俱乐部");
						return;
					}
					db.club_join(clubId,targetId,function(ok){
						http.send(res,ok?0:1,ok?"ok":"pull failed.");
					});
				});
			});
		});
	});
});

//豆豆管理:按玩家ID查询昵称与宝宝豆余额(仅社长)
app.get('/club_member_info',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	var targetId = parseInt(req.query.userid);
	if(!(clubId > 0) || !(targetId > 0)){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get(clubId,function(club){
			if(club == null){
				http.send(res,3,"club not found.");
				return;
			}
			if(club.owner_userid != data.userid){
				http.send(res,4,"仅俱乐部管理员可操作");
				return;
			}
			db.get_user_data_by_userid(targetId,function(target){
				if(target == null){
					http.send(res,5,"该玩家ID不存在，请确认后重试");
					return;
				}
				//db.get_user_data_by_userid 已做过base64解码,这里直接使用,不能再解一次
				var name = target.name || target.account;
				http.send(res,0,"ok",{userid:Number(target.userid),name:name,gems:Number(target.gems)||0});
			});
		});
	});
});

//豆豆管理:给玩家增减宝宝豆(gems为增量,可为负;仅社长)
//加分(delta>0): 社长必须同步扣自己豆豆, 不足则拒绝; 扣分(delta<0): 仅扣目标玩家, 社长不涉及
//管理后台 /admin/user/gems 与 /admin/club_member/gems 不受此限制
app.get('/club_member_gems',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	var targetId = parseInt(req.query.userid);
	var delta = parseInt(req.query.gems);
	if(!(clubId > 0) || !(targetId > 0) || isNaN(delta) || delta === 0){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get(clubId,function(club){
			if(club == null){
				http.send(res,3,"club not found.");
				return;
			}
			if(club.owner_userid != data.userid){
				http.send(res,4,"仅俱乐部管理员可操作");
				return;
			}
			db.get_user_data_by_userid(targetId,function(target){
				if(target == null){
					http.send(res,5,"该玩家ID不存在，请确认后重试");
					return;
				}
				var cur = Number(target.gems)||0;
				//只有扣分才校验余额, 加分不能因为当前余额为负而被拦下
				if(delta < 0 && cur + delta < 0){
					http.send(res,8,"宝宝豆不足，最多可扣减" + cur);
					return;
				}
				var ownerCur = Number(data.gems)||0;
				// 一级俱乐部: 社长增减豆豆不受自身余额限制; 其余俱乐部(含其所有下级)仍按自身余额限制
				var noLimit = Number(club.is_top_level) === 1;
				// 给自己加豆: 一级俱乐部直接加(不走"先扣社长再加回自己"的净0流程); 下级俱乐部不允许
				if(targetId == data.userid){
					if(!noLimit){
						http.send(res,10,"非一级俱乐部不能给自己加豆豆");
						return;
					}
					db.add_user_gems(targetId, delta, function(ok){
						if(!ok){
							http.send(res,1,"修改宝宝豆失败");
							return;
						}
						http.send(res,0,"ok",{userid:targetId,gems:cur+delta});
					},{roomid:0,gameType:"",changeType:delta > 0 ? "俱乐部加豆" : "俱乐部调整",clubId:clubId});
					return;
				}
				// 加分: 社长必须同步扣豆豆, 余额不足拒绝(一级俱乐部除外)
				if(delta > 0){
					if(!noLimit && ownerCur < delta){
						http.send(res,9,"社长豆豆不足，自己只有" + ownerCur + "，无法给成员加" + delta);
						return;
					}
					// 先扣社长再给目标加; 目标加失败时回滚社长
					db.add_user_gems(data.userid, -delta, function(okOwner){
						if(!okOwner){
							http.send(res,1,"扣社长豆豆失败");
							return;
						}
						db.add_user_gems(targetId, delta, function(okTarget){
							if(!okTarget){
								// 补回社长
								db.add_user_gems(data.userid, delta, null,
									{roomid:0,gameType:"",changeType:"上分失败退还",clubId:clubId});
								http.send(res,1,"给成员加分失败,已退还社长豆豆");
								return;
							}
							http.send(res,0,"ok",{userid:targetId,gems:cur+delta});
						},{roomid:0,gameType:"",changeType:"社长给成员上分",clubId:clubId});
					},{roomid:0,gameType:"",changeType:"社长上分扣款",clubId:clubId});
					return;
				}
				// 扣分: 仅扣目标玩家, 社长不加不减
				db.add_user_gems(targetId, delta, function(ok){
					if(!ok){
						http.send(res,1,"修改宝宝豆失败");
						return;
					}
					http.send(res,0,"ok",{userid:targetId,gems:cur+delta});
				},{roomid:0,gameType:"",changeType:"社长调整",clubId:clubId});
			});
		});
	});
});

//成员管理页:俱乐部成员详情列表(仅社长)
app.get('/club_members_detail',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	if(!(clubId > 0)){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get(clubId,function(club){
			if(club == null){
				http.send(res,3,"club not found.");
				return;
			}
			if(club.owner_userid != data.userid){
				http.send(res,4,"仅俱乐部管理员可操作");
				return;
			}
			db.club_members_detail(clubId,function(list){
				http.send(res,0,"ok",{members:list});
			});
		});
	});
});

//成员管理页:查看某成员的豆豆交易明细(仅社长,目标必须是本俱乐部成员)
app.get('/club_member_logs',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	var targetId = parseInt(req.query.userid);
	if(!(clubId > 0) || !(targetId > 0)){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get(clubId,function(club){
			if(club == null){
				http.send(res,3,"club not found.");
				return;
			}
			if(club.owner_userid != data.userid){
				http.send(res,4,"仅俱乐部管理员可操作");
				return;
			}
			db.club_is_member(clubId,targetId,function(isMember){
				if(!isMember){
					http.send(res,6,"该玩家不是本俱乐部成员");
					return;
				}
				db.get_bean_logs(targetId,0,function(logs){
					http.send(res,0,"ok",{logs:logs});
				});
			});
		});
	});
});

//豆豆管理页:俱乐部豆豆流水(仅社长)
app.get('/club_bean_logs',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	if(!(clubId > 0)){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get(clubId,function(club){
			if(club == null){
				http.send(res,3,"club not found.");
				return;
			}
			if(club.owner_userid != data.userid){
				http.send(res,4,"仅俱乐部管理员可操作");
				return;
			}
			db.club_bean_logs(clubId,function(list){
				http.send(res,0,"ok",{logs:list});
			});
		});
	});
});

//子俱乐部页:子俱乐部列表(仅社长)
app.get('/club_sub_list',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	if(!(clubId > 0)){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get(clubId,function(club){
			if(club == null){
				http.send(res,3,"club not found.");
				return;
			}
			if(club.owner_userid != data.userid){
				http.send(res,4,"仅俱乐部管理员可操作");
				return;
			}
			db.club_sub_list(clubId,function(list){
				http.send(res,0,"ok",{subs:list});
			});
		});
	});
});

//退出俱乐部(社长不可退)
app.get('/club_quit',function(req,res){	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	if(!(clubId > 0)){
		http.send(res,-1,"clubid required.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get(clubId,function(club){
			if(club == null){
				http.send(res,3,"club not found.");
				return;
			}
			if(club.owner_userid == data.userid){
				http.send(res,4,"owner cannot quit.");
				return;
			}
			db.club_quit(clubId,data.userid,function(ok){
				http.send(res,ok?0:1,ok?"ok":"quit failed.");
			});
		});
	});
});

//俱乐部玩法列表(左侧列表,当前仅血战麻将)
app.get('/club_games',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	if(!(clubId > 0)){
		http.send(res,-1,"clubid required.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_is_member(clubId,data.userid,function(isMember){
			if(!isMember){
				http.send(res,2,"not club member.");
				return;
			}
			//俱乐部玩法列表改读独立的俱乐部玩法表(t_club_games),支持先加玩法再加牌桌
			db.club_games_with_count(clubId,function(rows){
				var games = rows.filter(function(r){ return r.enabled == 1; }).map(function(r){
					//底分/局数选项下发给客户端,牌桌卡片按桌conf换算显示
					var difens = [], jushus = [];
					try{ difens = JSON.parse(r.difen_options) || []; }catch(e){}
					try{ jushus = JSON.parse(r.jushu_options) || []; }catch(e){}
					return {
						id:r.id,
						game_type:r.game_type,
						name:r.name,
						table_count:r.table_count,
						difen_options:difens,
						jushu_options:jushus,
						enabled:true
					};
				});
				http.send(res,0,"ok",{games:games});
			});
		});
	});
});

//后台启用的玩法列表(大厅玩法介绍弹窗左侧列表)
app.get('/game_list',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	db.game_config_list(function(rows){
		var games = rows.map(function(r){
			return {type:r.type,name:r.name,max_players:r.max_players};
		});
		http.send(res,0,"ok",{games:games});
	});
});

//俱乐部某玩法的桌面列表(右侧列表,带人数);game_type缺省=返回全部玩法的桌面
app.get('/club_tables',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	var gameType = req.query.game_type; //可空:空=全部玩法
	if(!(clubId > 0)){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_is_member(clubId,data.userid,function(isMember){
			if(!isMember){
				//后台管理页:社长本人即使不在成员表也允许查看本俱乐部牌桌
				db.club_get(clubId,function(club){
					if(club == null || club.owner_userid != data.userid){
						http.send(res,2,"not club member.");
						return;
					}
					sendTables(club, true);
				});
				return;
			}
			db.club_get(clubId,function(club){
				sendTables(club, club != null && club.owner_userid == data.userid);
			});
		});
		function sendTables(club, isOwner){
			//all=1且是馆主(管理页)时返回全部牌桌,含已关闭玩法的;玩家大厅仍只显示启用玩法
			var showAll = (req.query.all == "1") && isOwner;
			db.club_tables(clubId,gameType,function(tables){
				//注入清桌权限标记:仅俱乐部创建者可在牌桌卡片上看到"清空"按钮
				var rows = (tables || []).map(function(t){
					t.can_clear = isOwner;
					return t;
				});
				http.send(res,0,"ok",{tables:rows});
			}, showAll);
		}
	});
});

//俱乐部后台清空牌桌:仅俱乐部创建者可操作;解散牌桌绑定房间、踢出所有玩家并彻底释放占用,
//清空后被占用的玩家可自由进入其它房间
app.get('/club_clear_table',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var tableId = parseInt(req.query.tableid);
	if(!(tableId > 0)){
		http.send(res,-1,"tableid required.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get_table(tableId,function(table){
			if(table == null){
				http.send(res,3,"table not found.");
				return;
			}
			db.club_get(table.club_id,function(club){
				if(club == null || club.owner_userid != data.userid){
					http.send(res,4,"only club owner can clear table.");
					return;
				}
				if(table.roomid == null){
					http.send(res,0,"ok");
					return;
				}
				var roomId = String(table.roomid);
				var finish = function(){
					db.club_set_table_room(tableId,null,function(){
						http.send(res,0,"ok");
					});
				};
				db.get_room_data(roomId,function(roomData){
					if(roomData == null){
						//房间已不存在(游戏服已销毁/重启丢失):直接解绑
						finish();
						return;
					}
					var sign = crypto.md5(roomId + config.ROOM_PRI_KEY);
					http.get(roomData.ip,roomData.port,"/clear_room",{roomid:roomId,sign:sign},function(ret,gdata){
						if(ret && gdata && gdata.errcode == 0){
							finish();
						}
						else{
							http.send(res,-2,"clear failed:" + ((gdata && gdata.errmsg) || "game server no response"));
						}
					});
				});
			});
		});
	});
});

//俱乐部添加牌桌:仅俱乐部创建者可操作;桌名按该玩法已有桌面序号自动生成(01、02…)
app.get('/club_add_table',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	var gameType = req.query.game_type;
	if(!(clubId > 0) || gameType == null || gameType === ''){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get(clubId,function(club){
			if(club == null){
				http.send(res,3,"club not found.");
				return;
			}
			if(club.owner_userid != data.userid){
				http.send(res,4,"only club owner can add table.");
				return;
			}
			//玩法必须已在本俱乐部配置(取底分选项用于回填下标);未配置时按全局玩法兜底,避免馆主加桌失败
			db.club_games_with_count(clubId,function(games){
				var g = null;
				for(var i = 0; i < (games || []).length; ++i){
					if(games[i].game_type == gameType){ g = games[i]; break; }
				}
				if(g == null){
					console.log('[club_add_table] club game not configured, fallback:', clubId, gameType);
				}
				var difens = [];
				try{ difens = JSON.parse(g ? g.difen_options : '[]') || []; }catch(e){}
				//俱乐部自配的台数规则随牌桌conf下发,游戏服优先用它(空则由全局默认值兜底)
				var clubTaiRules = null;
				try{ clubTaiRules = (g && g.tai_rules) ? JSON.parse(g.tai_rules) : null; }catch(e2){ clubTaiRules = null; }
				var difenVal = Number(req.query.difen_value);
				if(!(difenVal > 0)){ difenVal = Number(difens[0]) || 1; }
				//局数直接存实际局数值(jushu_value),不再依赖全局选项下标,避免俱乐部选项与全局配置不一致时局数错乱
				var jushuVal = parseInt(req.query.jushu_value);
				if(!(jushuVal > 0) && g){
					try{ var jsOpt = JSON.parse(g.jushu_options || '[]'); jushuVal = Number(jsOpt[0]) || 0; }catch(e3){}
				}
				//房卡单价: 关闭统一收费时按房卡扣, 取玩法配置 cost_options 第1项
				var clubCost = 0;
				try{ clubCost = Number((JSON.parse(g ? (g.cost_options || '[]') : '[]') || [])[0]) || 0; }catch(e4){ clubCost = 0; }
				var conf = {
					type: gameType,
					cost: clubCost,
					difen: Math.max(0,difens.indexOf(difenVal)),
					difen_value: difenVal,
					jushuxuanze: parseInt(req.query.jushuxuanze) || 0,
					jushu_value: (jushuVal > 0) ? jushuVal : null,
					banker_mode: (parseInt(req.query.banker_mode) === 0) ? 0 : 1,
					min_players: parseInt(req.query.min_players) || (g ? (g.min_players || 2) : 2),
					max_players: parseInt(req.query.max_players) || (g ? (g.max_players_custom || 6) : 6),
					face_score: parseInt(req.query.face_score) || (g ? (g.face_score || 0) : 0),
					shuffle_score: parseInt(req.query.shuffle_score) || (g ? (g.shuffle_score || 0) : 0),
					min_bean: parseInt(req.query.min_bean) || (g ? (g.min_bean || 0) : 0),
					kick_bean: parseInt(req.query.kick_bean) || (g ? (g.kick_bean || 0) : 0),
					rake_percent: g ? (g.rake_percent || 0) : 0,
					hidden_rake_percent: g ? (g.hidden_rake_percent || 0) : 0,
					rake_per_round: g && g.rake_per_round != null ? g.rake_per_round : 1,
					room_fee: g ? (g.room_fee || 0) : 0,
					room_fee_payer: g && g.room_fee_payer != null ? g.room_fee_payer : 1,
					game_config_id: g ? (g.id || 0) : 0,
					tai_rules: clubTaiRules
				};
				db.club_tables(clubId,gameType,function(tables){
					var maxNo = 0;
					(tables || []).forEach(function(t){
						var no = parseInt(t.name,10);
						if(!isNaN(no) && no > maxNo){ maxNo = no; }
					});
					var nextNo = maxNo > 0 ? maxNo + 1 : (tables || []).length + 1;
					var name = (nextNo < 10 ? '0' : '') + nextNo;
					db.club_add_table(clubId,gameType,name,JSON.stringify(conf),function(tableId){
						if(tableId == null){
							http.send(res,1,"add table failed.");
							return;
						}
						http.send(res,0,"ok",{tableid:tableId,name:name});
					});
				});
			});
		});
	});
});

//俱乐部玩法配置(底分/局数/台数规则):读取,仅馆主
app.get('/club_game_configs',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	if(!(clubId > 0)){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){ http.send(res,-1,"system error"); return; }
		db.club_get(clubId,function(club){
			if(club == null){ http.send(res,3,"club not found."); return; }
			if(club.owner_userid != data.userid){ http.send(res,4,"only club owner can edit game config."); return; }
			db.club_games_with_count(clubId,function(games){
				var src = games || [];
				var list = [];
				var pending = src.length;
				if(pending === 0){ http.send(res,0,"ok",{list:[]}); return; }
				src.forEach(function(g,idx){
					var difen = [], jushu = [], tai = null;
					try{ difen = JSON.parse(g.difen_options) || []; }catch(e1){}
					try{ jushu = JSON.parse(g.jushu_options) || []; }catch(e2){}
					try{ tai = g.tai_rules ? JSON.parse(g.tai_rules) : null; }catch(e3){ tai = null; }
					//带上后台全局默认台数规则:客户端把留空项显示成实际默认数值
					db.get_game_config(g.game_type,function(cfg){
						list[idx] = {
							game_type:g.game_type,
							name:g.name,
							difen_options:difen,
							jushu_options:jushu,
							tai_rules:tai,
							default_tai_rules:(cfg && cfg.tai_rules) ? cfg.tai_rules : null
						};
						if(--pending === 0){ http.send(res,0,"ok",{list:list}); }
					});
				});
			});
		});
	});
});

//俱乐部玩法配置:保存,仅馆主(台数规则留空=清空,按全局默认值)
app.get('/club_game_config_save',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	var gameType = req.query.game_type;
	if(!(clubId > 0) || gameType == null || gameType === ''){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){ http.send(res,-1,"system error"); return; }
		db.club_get(clubId,function(club){
			if(club == null){ http.send(res,3,"club not found."); return; }
			if(club.owner_userid != data.userid){ http.send(res,4,"only club owner can edit game config."); return; }
			db.club_game_get_by_type(clubId,gameType,function(g){
				if(g == null){ http.send(res,5,"club game not found."); return; }
				var fields = {};
				var difen = [];
				try{ difen = JSON.parse(req.query.difen_options || '[]') || []; }catch(e1){}
				var jushu = [];
				try{ jushu = JSON.parse(req.query.jushu_options || '[]') || []; }catch(e2){}
				var tai = null;
				try{ tai = req.query.tai_rules ? JSON.parse(req.query.tai_rules) : null; }catch(e3){ tai = null; }
				if(difen.length > 0){ fields.difen_options = difen; }
				if(jushu.length > 0){ fields.jushu_options = jushu; }
				fields.tai_rules = (tai && Object.keys(tai).length > 0) ? tai : null;
				db.club_game_update(g.id,fields,function(ok){
					if(!ok){ http.send(res,1,"save failed."); return; }
					http.send(res,0,"ok");
				});
			});
		});
	});
});

//俱乐部删除牌桌(仅馆主;牌桌有人开房时不可删)
app.get('/club_del_table',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	var tableId = parseInt(req.query.tableid);
	if(!(clubId > 0) || !(tableId > 0)){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get(clubId,function(club){
			if(club == null){
				http.send(res,3,"club not found.");
				return;
			}
			if(club.owner_userid != data.userid){
				http.send(res,4,"only club owner can delete table.");
				return;
			}
			db.club_get_table(tableId,function(table){
				if(table == null || table.club_id != clubId){
					http.send(res,5,"table not found.");
					return;
				}
				if(table.roomid != null && table.roomid !== ''){
					http.send(res,6,"table is in use, cannot delete.");
					return;
				}
				db.club_delete_table(tableId,function(ok){
					if(!ok){
						http.send(res,1,"delete table failed.");
						return;
					}
					http.send(res,0,"ok");
				});
			});
		});
	});
});

//俱乐部桌面人数实时订阅:返回游戏服的socket连接地址(ip/port来自配置文件,不硬编码)
app.get('/club_subscribe_info',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	//游戏服暴露给客户端的socket地址,由大厅服从配置读取后转发给客户端
	var ip = config.GAME_CLIENT_IP;
	var port = config.GAME_CLIENT_PORT;
	if(ip == null || port == null){
		http.send(res,1,"game server socket address not configured.");
		return;
	}
	http.send(res,0,"ok",{ip:ip,port:port});
});

//点击桌面进入游戏:复用桌面已绑定且未满的房间,否则按桌面配置建房并绑定
app.get('/club_enter_table',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var tableId = parseInt(req.query.tableid);
	if(!(tableId > 0)){
		http.send(res,-1,"tableid required.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		var userId = data.userid;
			var name = data.name;
			db.club_get_table(tableId,function(table){
			if(table == null){
				http.send(res,3,"table not found.");
				return;
			}
			//宝宝豆校验: 余额低于本牌桌配置的最低宝宝豆, 不允许进入桌面
			var minBean = 0;
			try{ minBean = Number((JSON.parse(table.conf) || {}).min_bean) || 0; }catch(e){ minBean = 0; }
			if(minBean > 0 && !(data.gems >= minBean)){
				http.send(res,2222,"宝宝豆不足" + minBean + "，无法进入桌面");
				return;
			}
			db.club_is_member(table.club_id,userId,function(isMember){
				if(!isMember){
					http.send(res,2,"not club member.");
					return;
				}
				db.get_room_id_of_user(userId,function(myRoomId){
					//仅当记录的房间正是本次点击桌面绑定的房间时才直接引导回去;
					//否则(如上一局残留的其它玩法房间,2人/4人场景前后端完全独立)必须先清除映射再按本桌面进桌,避免进错场景
					if(myRoomId != null && myRoomId == table.roomid){
						//已在本张桌面绑定的房间中,直接引导回去
						room_service.enterRoom(userId,name,myRoomId,function(errcode,enterInfo){
							if(enterInfo){
								var ret = {
									roomid:myRoomId,
									ip:enterInfo.ip,
									port:enterInfo.port,
									token:enterInfo.token,
									time:Date.now()
								};
								ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
								http.send(res,0,"ok",ret);
							}
							else if(errcode == 5){
								//占用其他房间被拒:透传,不清映射不重建
								http.send(res,5,"你已在其他房间中，请先退出原房间再进入其它桌面");
							}
							else{
								//记录的房间已失效(如游戏服重启后丢失):清除残留映射,改走桌面绑定的正常进桌流程
								db.set_room_id_of_user(userId,null,function(){
									proceedTable();
								});
							}
						});
						return;
					}
					if(myRoomId != null){
						//残留的是别的房间(不同桌面/不同玩法):清除映射后走本次点击桌面的正常进桌流程
						db.set_room_id_of_user(userId,null,function(){
							proceedTable();
						});
						return;
					}
					proceedTable();
				});
				var proceedTable = function(){
					//建房时把俱乐部id与玩法写入房间conf,供游戏服在人数变化时定位 club_<clubid> 广播
					var clubConf = table.conf;
					try{
						var confObj = JSON.parse(table.conf) || {};
						confObj.clubid = table.club_id;
						confObj.game_type = table.game_type;
						confObj.club_table_id = tableId; //牌桌id带进房间conf,人数变化推送可直接定位牌桌卡片,不依赖DB时序
						confObj.club_table_name = table.name || ""; //玩家录入的真实牌桌名称,奖励明细/战绩里显示
						confObj.game_config_id = table.game_config_id || 0; //牌桌绑定的玩法配置id,游戏服按它取抽水/暗水/房费等
						clubConf = JSON.stringify(confObj);
					}catch(e){ clubConf = table.conf; }
					var tryEnter = function(roomId){
						room_service.enterRoom(userId,name,roomId,function(errcode,enterInfo){
							if(enterInfo){
								var ret = {
									roomid:roomId,
									ip:enterInfo.ip,
									port:enterInfo.port,
									token:enterInfo.token,
									time:Date.now()
								};
								ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
								http.send(res,0,"ok",ret);
							}
							else if(errcode == 5){
								//玩家仍占用其他房间被游戏服拒绝:直接透传错误码,
								//严禁解绑/重建(否则会陷入无限建房循环且破坏牌桌绑定)
								http.send(res,5,"你已在其他房间中，请先退出原房间再进入其它桌面");
							}
							else{
								//绑定房间已失效:解绑重建
								db.club_set_table_room(tableId,null,function(){
									createAndEnter();
								});
							}
						});
					};
					var createAndEnter = function(){
						room_service.createRoom(req.query.account,userId,clubConf,function(err,roomId){
							if(err == 0 && roomId != null){
								db.club_set_table_room(tableId,roomId,function(){
									tryEnter(roomId);
								});
							}
							else{
								//2222=宝宝豆不足,单独提示,不再统一报create room failed
									http.send(res,err == null?1:err, err == 2222 ? "宝宝豆不足，无法创建房间" : "create room failed.");
							}
						});
					};
					var reuseBoundRoom = function(){
						if(table.roomid == null){
							createAndEnter();
							return;
						}
						db.get_room_data(table.roomid,function(roomData){
							if(roomData == null){
								//房间已不存在,解除绑定重建
								db.club_set_table_room(tableId,null,function(){
									createAndEnter();
								});
								return;
							}
							var count = 0;
							//按该房间实际人数上限判断是否满员(2人桌不能用固定4判定)
							var maxPlayers = 2;
							try{
								var roomConf = JSON.parse(roomData.base_info) || {};
								maxPlayers = roomConf.maxPlayers || 2;
							}catch(e){ maxPlayers = 2; }
							for(var i = 0; i < maxPlayers; ++i){
								if(roomData["user_id" + i] > 0){
									count++;
								}
							}
							if(count >= maxPlayers){
								//该桌已满员:拒绝进入,不再另开新房间
								http.send(res,4,"该桌已满员，无法进入");
								return;
							}
							else{
								tryEnter(table.roomid);
							}
						});
					};
					reuseBoundRoom();
				};
			});
		});
	});
});

// ============ 俱乐部管理后台(APP端) ============
// APP 的 HTTP.sendRequest 固定用 GET, 所以管理接口全部是 app.get, 参数走 query
function clubAdminAccess(req,res,cb){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.club_id || req.query.clubid);
	if(!(clubId > 0)){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){ http.send(res,-1,"system error"); return; }
		db.club_get(clubId,function(club){
			if(club == null){ http.send(res,3,"club not found."); return; }
			if(club.owner_userid != data.userid){ http.send(res,4,"only club owner can manage."); return; }
			cb(clubId,data,club);
		});
	});
}

//"1,2,5" -> [1,2,5]
function parseNumList(v,def){
	if(v == null || v === ''){ return def; }
	var arr = String(v).split(',');
	var ret = [];
	for(var i = 0;i < arr.length;i++){
		var n = parseInt(arr[i]);
		if(n > 0){ ret.push(n); }
	}
	return ret.length > 0 ? ret : def;
}

//只取请求里出现过的字段, 用于更新
function pickGameConfig(req,withDefault){
	var fields = {};
	if(req.query.name != null && req.query.name !== ''){ fields.name = req.query.name; }
	if(req.query.difen_options != null || withDefault){ fields.difen_options = parseNumList(req.query.difen_options,[1,2,5]); }
	if(req.query.jushu_options != null || withDefault){ fields.jushu_options = parseNumList(req.query.jushu_options,[4,8]); }
	if(req.query.cost_options != null || withDefault){ fields.cost_options = parseNumList(req.query.cost_options,[2,3]); }
	['sort','min_players','max_players_custom','rake_percent','hidden_rake_percent','fee_rake_percent','rake_per_round','room_fee','room_fee_payer','face_score','shuffle_score','min_bean','kick_bean'].forEach(function(k){
		if(req.query[k] != null && req.query[k] !== ''){ fields[k] = parseFloat(req.query[k]) || 0; }
	});
	//去万/去条/去筒(存 tai_rules JSON,三选互斥由客户端保证,服务端按优先级容错)
	['remove_wan','remove_tiao','remove_tong'].forEach(function(k){
		if(req.query[k] != null && req.query[k] !== ''){ fields[k] = (parseInt(req.query[k]) ? 1 : 0); }
	});
	if(req.query.enabled != null && req.query.enabled !== ''){ fields.enabled = (parseInt(req.query.enabled) ? 1 : 0); }
	return fields;
}

//总览
app.get('/club_admin/overview',function(req,res){
	clubAdminAccess(req,res,function(clubId,userData,club){
		db.club_overview(clubId,function(ov){
			var data = ov || {};
			//顶部展示:俱乐部名称+ID+本人豆豆总数
			data.club_id = clubId;
			data.club_name = club ? club.name : "";
			data.my_gems = Number(userData && userData.gems) || 0;
			http.send(res,0,"ok",{data:data});
		});
	});
});

//收入统计(按日): 顶部总收入 + 每日收入列表, 支持日期区间/下级俱乐部过滤
app.get('/club_admin/income_stats',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var from = parseInt(req.query.from) || 0;
		var to = parseInt(req.query.to) || 0;
		var pid = parseInt(req.query.partner_club_id) || 0;
		var now = Math.ceil(Date.now()/1000);
		if(to <= 0){ to = now; }
		if(from <= 0){ from = to - 30 * 86400; }
		var doQuery = function(){
			db.club_income_stats(clubId,from,to,pid,function(r){
				http.send(res,0,"ok",r || {total:0,list:[]});
			});
		};
		if(pid > 0){
			//只能查自己的直属下级俱乐部
			db.club_get(pid,function(pclub){
				if(pclub == null || Number(pclub.parent_clubid) !== Number(clubId)){ http.send(res,4,"partner club not found."); return; }
				doQuery();
			});
			return;
		}
		doQuery();
	});
});

//下级俱乐部成员列表(下级窗口用: 校验该俱乐部在当前管理员的链路上, 不受"只有社长能管"限制)
app.get('/club_admin/partner_members',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var pid = parseInt(req.query.partner_club_id) || 0;
		if(!(pid > 0)){ http.send(res,-1,"partner_club_id required"); return; }
		db.partner_list(clubId,function(list){
			var ok = false;
			(list || []).forEach(function(r){ if(Number(r.id) === pid){ ok = true; } });
			if(!ok){ http.send(res,4,"partner club not found."); return; }
			db.club_members_detail(pid,function(members){
				http.send(res,0,"ok",{data: members || []});
			});
		});
	});
});

//成员列表
app.get('/club_admin/members',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		db.club_members_detail(clubId,function(list){
			http.send(res,0,"ok",{data:list || []});
		});
	});
});

//添加成员
app.get('/club_admin/member_add',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var userid = parseInt(req.query.userid);
		if(!(userid > 0)){ http.send(res,-1,"userid required"); return; }
		db.club_member_add(clubId,userid,function(ok){
			http.send(res,ok ? 0 : -1,ok ? "ok" : "add member failed");
		});
	});
});

//删除成员
app.get('/club_admin/member_delete',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var userid = parseInt(req.query.userid);
		if(!(userid > 0)){ http.send(res,-1,"userid required"); return; }
		db.club_member_delete(clubId,userid,function(ok){
			http.send(res,ok ? 0 : -1,ok ? "ok" : "delete member failed");
		});
	});
});

//踢出成员(牌桌内的踢人需要游戏服配合, 这里先按移除成员处理)
app.get('/club_admin/member_kick',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var userid = parseInt(req.query.userid);
		if(!(userid > 0)){ http.send(res,-1,"userid required"); return; }
		db.club_member_delete(clubId,userid,function(ok){
			http.send(res,ok ? 0 : -1,ok ? "ok" : "kick member failed");
		});
	});
});

//设为合伙人
app.get('/club_admin/member_set_partner',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var userid = parseInt(req.query.userid);
		if(!(userid > 0)){ http.send(res,-1,"userid required"); return; }
		//先确认玩家存在,避免随便输入ID也"成功"
		db.get_user_base_info(userid,function(info){
			if(!info){ http.send(res,-1,"玩家不存在"); return; }
			db.club_member_set_partner(clubId,userid,req.query.name || "",function(newClubId){
				if(newClubId == null){ http.send(res,-1,"设置合伙人失败"); return; }
				http.send(res,0,"ok",{partner_club_id:newClubId});
			});
		});
	});
});

//成员战绩
app.get('/club_admin/member_records',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var userid = parseInt(req.query.userid);
		if(!(userid > 0)){ http.send(res,-1,"userid required"); return; }
		db.club_member_records(clubId,userid,parseInt(req.query.from_time) || 0,function(rows){
			http.send(res,0,"ok",{data:rows || []});
		});
	});
});

//成员豆豆明细
app.get('/club_admin/member_bean_logs',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var userid = parseInt(req.query.userid);
		if(!(userid > 0)){ http.send(res,-1,"userid required"); return; }
		db.club_member_bean_logs(clubId,userid,parseInt(req.query.from_time) || 0,function(rows){
			http.send(res,0,"ok",{data:rows || []});
		});
	});
});

//合伙人俱乐部豆豆流水(合伙人统计页「详情」)
app.get('/club_admin/partner_bean_logs',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var pid = parseInt(req.query.partner_club_id);
		if(!(pid > 0)){ http.send(res,-1,"partner_club_id required"); return; }
		db.club_get(pid,function(pclub){
			if(pclub == null){ http.send(res,3,"partner club not found."); return; }
			//必须是本俱乐部的下级俱乐部, 防止查看任意俱乐部流水
			if(pclub.parent_clubid != clubId){ http.send(res,4,"partner club not found."); return; }
			db.club_bean_logs(pid,function(rows){
				http.send(res,0,"ok",{data:rows || []});
			});
		});
	});
});

//合伙人列表
app.get('/club_admin/partners',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		db.partner_list(clubId,function(rows){
			http.send(res,0,"ok",{data:rows || []});
		});
	});
});

//给合伙人加豆
app.get('/club_admin/partner_gems',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var pid = parseInt(req.query.partner_club_id);
		var gems = parseInt(req.query.gems);
		if(!(pid > 0) || !(gems > 0)){ http.send(res,-1,"parameters don't match api requirements."); return; }
		db.club_get(pid,function(pclub){
			if(pclub == null){ http.send(res,3,"partner club not found."); return; }
			//必须是本俱乐部的下级俱乐部(合伙人), 防止给任意俱乐部加豆
			if(pclub.parent_clubid != clubId){ http.send(res,4,"partner club not found."); return; }
			db.add_user_gems(pclub.owner_userid,gems,function(ok){
				if(!ok){ http.send(res,-1,"system error"); return; }
				db.partner_upsert(clubId,pid,{},function(){
					db.partner_add_stats(clubId,pid,{partner_profit:gems},function(){
						http.send(res,0,"ok");
					});
				});
			});
		});
	});
});

//调整合伙人与本俱乐部的分成比例
app.get('/club_admin/partner_ratio',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var pid = parseInt(req.query.partner_club_id);
		var ratio = parseFloat(req.query.ratio);
		var feeRatio = (req.query.fee_ratio == null || req.query.fee_ratio === '') ? null : parseFloat(req.query.fee_ratio);
		var hiddenRatio = (req.query.hidden_ratio == null || req.query.hidden_ratio === '') ? null : parseFloat(req.query.hidden_ratio);
		if(!(pid > 0) || isNaN(ratio)){ http.send(res,-1,"parameters don't match api requirements."); return; }
		if(feeRatio != null && (isNaN(feeRatio) || feeRatio < 0 || feeRatio > 100)){ http.send(res,-1,"fee ratio invalid."); return; }
		if(hiddenRatio != null && (isNaN(hiddenRatio) || hiddenRatio < 0 || hiddenRatio > 100)){ http.send(res,-1,"hidden ratio invalid."); return; }
		db.club_get(pid,function(pclub){
			if(pclub == null){ http.send(res,3,"partner club not found."); return; }
			//必须是本俱乐部的下级俱乐部(合伙人)
			if(pclub.parent_clubid != clubId){ http.send(res,4,"partner club not found."); return; }
			var fields = {profit_ratio:ratio};
			if(feeRatio != null){ fields.fee_profit_ratio = feeRatio; }
			if(hiddenRatio != null){ fields.hidden_profit_ratio = hiddenRatio; }
			db.partner_upsert(clubId,pid,fields,function(ok){
				http.send(res,ok ? 0 : -1,ok ? "ok" : "update ratio failed");
			});
		});
	});
});

//合伙人收益详情
app.get('/club_admin/partner_profit',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var pid = parseInt(req.query.partner_club_id);
		if(!(pid > 0)){ http.send(res,-1,"parameters don't match api requirements."); return; }
		db.partner_profit_detail(clubId,pid,parseInt(req.query.from_time) || 0,function(rows){
			http.send(res,0,"ok",{data:rows || []});
		});
	});
});

//删除合伙人
app.get('/club_admin/partner_delete',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var pid = parseInt(req.query.partner_id || req.query.partner_club_id);
		if(!(pid > 0)){ http.send(res,-1,"parameters don't match api requirements."); return; }
		db.partner_delete(clubId,pid,function(ok){
			http.send(res,ok ? 0 : -1,ok ? "ok" : "delete partner failed");
		});
	});
});

//奖励明细
app.get('/club_admin/rewards',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		db.reward_logs(clubId,0,null,parseInt(req.query.from_time) || 0,function(rows){
			http.send(res,0,"ok",{data:rows || []});
		});
	});
});

//玩法配置列表
app.get('/club_admin/game_configs',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		//每个玩法各自的收费模式开关随玩法配置一起下发: 客户端据此决定哪些规则可编辑(关闭时置灰)
		db.query('SELECT type, unified_charge FROM t_game_config', function(err, rows){
			var unified = {};
			(rows || []).forEach(function(r){
				unified[r.type] = Number(r.unified_charge) === 1 ? 1 : 0;
			});
			db.club_game_get_configs(clubId,function(list){
				http.send(res,0,"ok",{data:list || [], unified: unified});
			});
		});
	});
});

//各玩法收费模式开关(轻量接口: 客户端每次打开添加/修改玩法弹窗时刷新, 后台改完立即生效)
app.get('/club_admin/game_unified',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		db.query('SELECT type, unified_charge FROM t_game_config', function(err, rows){
			var unified = {};
			(rows || []).forEach(function(r){
				unified[r.type] = Number(r.unified_charge) === 1 ? 1 : 0;
			});
			http.send(res,0,"ok",{unified: unified});
		});
	});
});

//新建玩法配置
app.get('/club_admin/game_config_save',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var gameType = req.query.game_type || "baobao_shou";
		var name = req.query.name || "";
		db.club_game_add_with_config(clubId,gameType,name,pickGameConfig(req,true),function(id){
			http.send(res,id != null ? 0 : -1,id != null ? "ok" : "create config failed");
		});
	});
});

//修改玩法配置(只能改本俱乐部的配置)
app.get('/club_admin/game_config_update',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var id = parseInt(req.query.id);
		if(!(id > 0)){ http.send(res,-1,"id required"); return; }
		db.club_game_get_config(id,function(cfg){
			if(cfg == null || cfg.club_id != clubId){ http.send(res,4,"config not found."); return; }
			db.club_game_update_config(id,pickGameConfig(req,false),function(ok){
				http.send(res,ok ? 0 : -1,ok ? "ok" : "update config failed");
			});
		});
	});
});

//修改单张牌桌的参数: 只写这张牌桌的conf, 同玩法的其它牌桌不受影响
app.get('/club_admin/table_update',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var tableId = parseInt(req.query.id);
		if(!(tableId > 0)){ http.send(res,-1,"id required"); return; }
		db.club_get_table(tableId,function(table){
			if(table == null || table.club_id != clubId){ http.send(res,4,"table not found."); return; }
			var conf = {};
			try{ conf = JSON.parse(table.conf || "{}") || {}; }catch(e){ conf = {}; }
			var num = function(k){
				if(req.query[k] == null || req.query[k] === ''){ return null; }
				var v = parseFloat(req.query[k]);
				return isNaN(v) ? null : v;
			};
			//底分/局数: 牌桌conf里是具体值, 写入后由牌桌自己决定(不再跟随玩法配置)
			var difen = parseNumList(req.query.difen_options,null);
			if(difen && difen.length){ conf.difen_value = difen[0]; conf.difen = 0; }
			var jushu = parseNumList(req.query.jushu_options,null);
			if(jushu && jushu.length){ conf.jushu_value = jushu[0]; conf.jushuxuanze = 0; }
			var cost = parseNumList(req.query.cost_options,null);
			if(cost && cost.length){ conf.cost = cost[0]; }
			var map = { min_players:'min_players', max_players_custom:'max_players', face_score:'face_score', shuffle_score:'shuffle_score', min_bean:'min_bean', kick_bean:'kick_bean', rake_percent:'rake_percent', hidden_rake_percent:'hidden_rake_percent', fee_rake_percent:'fee_rake_percent', rake_per_round:'rake_per_round', room_fee:'room_fee', room_fee_payer:'room_fee_payer' };
			for(var k in map){
				var v = num(k);
				if(v != null){ conf[map[k]] = v; }
			}
			var newName = (req.query.name != null && req.query.name !== '') ? req.query.name : table.name;
			db.club_update_table_conf(tableId,newName,conf,function(ok){
				http.send(res,ok ? 0 : -1,ok ? "ok" : "update table failed");
			});
		});
	});
});

//开启/关闭玩法(只能操作本俱乐部的配置)
app.get('/club_admin/game_config_close',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var id = parseInt(req.query.id);
		if(!(id > 0)){ http.send(res,-1,"id required"); return; }
		db.club_game_get_config(id,function(cfg){
			if(cfg == null || cfg.club_id != clubId){ http.send(res,4,"config not found."); return; }
			db.club_game_update_config(id,{enabled:(parseInt(req.query.enabled) ? 1 : 0)},function(ok){
				http.send(res,ok ? 0 : -1,ok ? "ok" : "update config failed");
			});
		});
	});
});

//删除玩法配置
app.get('/club_admin/game_config_delete',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var id = parseInt(req.query.id);
		if(!(id > 0)){ http.send(res,-1,"id required"); return; }
		db.club_game_get_config(id,function(cfg){
			if(cfg == null || cfg.club_id != clubId){ http.send(res,4,"config not found."); return; }
			db.club_game_delete(id,function(ok){
				http.send(res,ok ? 0 : -1,ok ? "ok" : "delete config failed");
			});
		});
	});
});

//删除牌桌(玩法管理页右侧是牌桌列表,删的是牌桌;牌桌删完后顺带清掉不再使用的本俱乐部玩法配置)
app.get('/club_admin/table_delete',function(req,res){
	clubAdminAccess(req,res,function(clubId){
		var tableId = parseInt(req.query.id);
		if(!(tableId > 0)){ http.send(res,-1,"id required"); return; }
		db.club_get_table(tableId,function(table){
			if(table == null || table.club_id != clubId){ http.send(res,4,"table not found."); return; }
			if(table.roomid != null && table.roomid !== ''){ http.send(res,6,"table is in use, cannot delete."); return; }
			//只删牌桌,不再级联删除玩法配置:玩法由管理员在玩法管理里自行关闭/删除
			db.club_delete_table(tableId,function(ok){
				if(!ok){ http.send(res,-1,"delete table failed."); return; }
				http.send(res,0,"ok");
			});
		});
	});
});

//初始化监听
exports.start = function($config){
	config = $config;
	app.listen(config.CLEINT_PORT);
	console.log("client service is listening on port " + config.CLEINT_PORT);
};