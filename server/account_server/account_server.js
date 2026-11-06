var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require("../utils/http");
// fibers 已废弃，改用原生异步回调

var app = express();
var hallAddr = "";

function send(res,ret){
	var str = JSON.stringify(ret);
	res.send(str)
}

var config = null;

exports.start = function(cfg){
	config = cfg;
	hallAddr = config.HALL_IP  + ":" + config.HALL_CLIENT_PORT;
	app.listen(config.CLIENT_PORT);
	console.log("account server is listening on " + config.CLIENT_PORT);
}





//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

app.get('/register',function(req,res){
	var account = req.query.account;
	var password = req.query.password;

	var fnFailed = function(){
		send(res,{errcode:1,errmsg:"account has been used."});
	};

	var fnSucceed = function(){
		send(res,{errcode:0,errmsg:"ok"});	
	};

	db.is_user_exist(account,function(exist){
		if(exist){
			db.create_account(account,password,function(ret){
				if (ret) {
					fnSucceed();
				}
				else{
					fnFailed();
				}
			});
		}
		else{
			fnFailed();
			console.log("account has been used.");			
		}
	});
});

app.get('/get_version',function(req,res){
	var ret = {
		version:config.VERSION,
	}
	send(res,ret);
});

app.get('/get_serverinfo',function(req,res){
	get_wx_config(function(wx){
		var ret = {
			version:config.VERSION,
			hall:hallAddr,
			appweb:config.APP_WEB,
			wxlogin:wx.enabled ? 1 : 0,
		}
		send(res,ret);
	});
});

// 公开接口：客户端拉取玩法配置（小盲/手数/筹码等选项）
app.get('/game_config/:type',function(req,res){
	var type = req.params.type;
	db.get_game_config(type,function(cfg){
		if(cfg && cfg.enabled != 0){
			send(res,{errcode:0,errmsg:"ok",data:cfg});
		}
		else{
			send(res,{errcode:1,errmsg:"config not found"});
		}
	});
});

app.get('/guest',function(req,res){
	var raw = req.query.account || String(Date.now());
	//幂等处理:客户端localStorage可能存过完整账号,已带guest_前缀则不再重复添加,避免产生guest_guest_xxx脏账号
	var account = raw.indexOf("guest_") === 0 ? raw : "guest_" + raw;
	//已绑定微信的游客账号,统一按主账号登录,保证两种登录方式进同一存档
	db.get_bind_primary(account,function(primary){
		var loginAccount = primary || account;
		var sign = crypto.md5(loginAccount + req.ip + config.ACCOUNT_PRI_KEY);
		send(res,{
			errcode:0,
			errmsg:"ok",
			account:loginAccount,
			guest_account:account,
			halladdr:hallAddr,
			sign:sign
		});
	});
});

app.get('/auth',function(req,res){
	var account = req.query.account;
	var password = req.query.password;

	db.get_account_info(account,password,function(info){
		if(info == null){
			send(res,{errcode:1,errmsg:"invalid account"});
			return;
		}

        var viviAccount = "vivi_" + req.query.account;
        //已绑定到其他主账号(游客/微信)时,按主账号登录,保证账号密码登录进同一存档
        db.get_bind_primary(viviAccount,function(primary){
            var loginAccount = primary || viviAccount;
            var sign = crypto.md5(loginAccount + req.ip + config.ACCOUNT_PRI_KEY);
            var ret = {
                errcode:0,
                errmsg:"ok",
                account:loginAccount,
                halladdr:hallAddr,
                sign:sign
            }
            send(res,ret);
        });
	});
});

var appInfo = {
	Android:{
		appid:"wxe39f08522d35c80c",
		secret:"fa88e3a3ca5a11b06499902cea4b9c01",
	},
	iOS:{
		appid:"wxcb508816c5c4e2a4",
		secret:"7de38489ede63089269e3410d5905038",		
	},
	web:{
		appid:"",
		secret:"",
	}
};

//微信登录参数:后台"系统配置"可覆盖(t_sys_config),未配置时用上面的默认值
var wxCfgCache = {time:0, data:null};
function get_wx_config(callback){
	var now = Date.now();
	if(wxCfgCache.data && now - wxCfgCache.time < 60000){
		callback(wxCfgCache.data);
		return;
	}
	db.get_sys_config(function(map){
		var cfg = {
			enabled: map.wx_login != "0", //默认开启
			Android:{ appid: map.wx_appid_android || appInfo.Android.appid, secret: map.wx_secret_android || appInfo.Android.secret },
			iOS:{ appid: map.wx_appid_ios || appInfo.iOS.appid, secret: map.wx_secret_ios || appInfo.iOS.secret },
			web:{ appid: map.wx_appid_web || appInfo.web.appid, secret: map.wx_secret_web || appInfo.web.secret }
		};
		wxCfgCache = {time:now, data:cfg};
		callback(cfg);
	});
}

function get_access_token(code,info,callback){
	if(info == null || !info.appid || !info.secret){
		callback(false,null);
		return;
	}
	var data = {
		appid:info.appid,
		secret:info.secret,
		code:code,
		grant_type:"authorization_code"
	};

	http.get2("https://api.weixin.qq.com/sns/oauth2/access_token",data,callback,true);
}

function get_state_info(access_token,openid,callback){
	var data = {
		access_token:access_token,
		openid:openid
	};

	http.get2("https://api.weixin.qq.com/sns/userinfo",data,callback,true);
}

function create_user(account,name,sex,headimgurl,callback){
	var coins = 0;
	var gems = 0;
	db.is_user_exist(account,function(ret){
		if(!ret){
			db.create_user(account,name,coins,gems,sex,headimgurl,function(ret){
				callback();
			});
		}
		else{
			db.update_user_info(account,name,headimgurl,sex,function(ret){
				callback();
			});
		}
	});
};
app.get('/wechat_auth',function(req,res){
	var code = req.query.code;
	var os = req.query.os;
	if(code == null || code == "" || os == null || os == ""){
		send(res,{errcode:1,errmsg:"missing code"});
		return;
	}
	console.log(os);
	get_wx_config(function(wx){
		if(!wx.enabled){
			send(res,{errcode:2,errmsg:"wechat login disabled"});
			return;
		}
		var info = wx[os];
		if(info == null){ info = wx.web; }
		var send_result = function(account,bound,isGuestPrimary){
			var sign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
			send(res,{
				errcode:0,
				errmsg:"ok",
				account:account,
				halladdr:hallAddr,
				sign:sign,
				wx:1,
				bound:bound ? 1 : 0,
				bound_guest:isGuestPrimary ? 1 : 0
			});
		};
		get_access_token(code,info,function(suc,data){
			if(!suc || data == null || data.openid == null){
				send(res,{errcode:-1,errmsg:"wechat auth failed"});
				return;
			}
			get_state_info(data.access_token,data.openid,function(suc2,data2){
				if(!suc2 || data2 == null){
					send(res,{errcode:-1,errmsg:"wechat userinfo failed"});
					return;
				}
				var wxAccount = "wx_" + data2.openid;
				//bound=true表示该账号已绑定,主账号已有存档,不再重复创建微信角色
				var fnLogin = function(account,bound,isGuestPrimary){
					if(bound){
						send_result(account,bound,isGuestPrimary);
						return;
					}
					create_user(account,data2.nickname,data2.sex,data2.headimgurl,function(){
						send_result(account,bound,isGuestPrimary);
					});
				};
				//带本机游客账号时自动绑定(游客账号需已创建角色),绑定后主账号为游客账号
				var bindAccount = req.query.bind_account;
				if(bindAccount && bindAccount.indexOf("guest_") === 0 && bindAccount != wxAccount){
					db.is_user_exist(bindAccount,function(hasRole){
						if(!hasRole){
							fnLogin(wxAccount,false,false);
							return;
						}
						db.bind_accounts(bindAccount,wxAccount,function(primary){
							if(!primary){
								fnLogin(wxAccount,false,false);
								return;
							}
							fnLogin(primary,true,primary == bindAccount);
						});
					});
					return;
				}
				//未带绑定参数时:已绑定账号依旧按主账号登录
				db.get_bind_primary(wxAccount,function(primary){
					if(primary){
						fnLogin(primary,true,primary.indexOf("guest_") === 0);
						return;
					}
					fnLogin(wxAccount,false,false);
				});
			});
		});
	});
});

app.get('/base_info',function(req,res){
	var userid = req.query.userid;
	db.get_user_base_info(userid,function(data){
		var ret = {
	        errcode:0,
	        errmsg:"ok",
			name:data.name,
			sex:data.sex,
	        headimgurl:data.headimg
	    };
	    send(res,ret);
	});
});

//注销账号:删除用户及其创建的俱乐部、成员关系、绑定关系
app.get('/delete_account',function(req,res){
	var account = req.query.account;
	if(!account){
		send(res,{errcode:1,errmsg:"missing account"});
		return;
	}
	db.delete_user_account(account,function(ok){
		if(ok){
			send(res,{errcode:0,errmsg:"ok"});
		}
		else{
			send(res,{errcode:2,errmsg:"delete failed"});
		}
	});
});

//保险柜:查询玩家宝宝豆与保险柜余额
app.get('/safe_info',function(req,res){
	var account = req.query.account;
	if(!account){ send(res,{errcode:1,errmsg:"missing account"}); return; }
	db.get_user_data(account,function(data){
		if(data == null){ send(res,{errcode:2,errmsg:"user not found"}); return; }
		db.get_user_safe(data.userid,function(bal){
			if(bal == null){ send(res,{errcode:3,errmsg:"query failed"}); return; }
			send(res,{errcode:0,errmsg:"ok",gems:bal.gems,safe_beans:bal.safe_beans});
		});
	});
});

//保险柜:amount>0 存入(宝宝豆→保险柜), amount<0 取出(保险柜→宝宝豆)
app.get('/safe_transfer',function(req,res){
	var account = req.query.account;
	var amount = req.query.amount;
	if(!account || amount == null){ send(res,{errcode:1,errmsg:"missing params"}); return; }
	amount = parseInt(amount);
	if(!isFinite(amount) || amount === 0){ send(res,{errcode:2,errmsg:"invalid amount"}); return; }
	db.get_user_data(account,function(data){
		if(data == null){ send(res,{errcode:3,errmsg:"user not found"}); return; }
		db.safe_transfer(data.userid,amount,function(bal,reason){
			if(bal == false){ send(res,{errcode:4,errmsg:reason || "transfer failed"}); return; }
			send(res,{errcode:0,errmsg:"ok",gems:bal.gems,safe_beans:bal.safe_beans});
		});
	});
});

//查询当前账号的绑定状态:返回已绑定的用户名/微信标记(供登录检测与个人信息页展示)
app.get('/bind_status',function(req,res){
	var account = req.query.account;
	if(!account){ send(res,{errcode:1,errmsg:"missing account"}); return; }
	db.get_bind_primary(account,function(primary){
		primary = primary || account;
		db.get_bind_rows_by_primary(primary,function(rows){
			var bindName = null, wxBound = 0;
			for(var i = 0; i < rows.length; i++){
				var pair = [rows[i].account_a, rows[i].account_b];
				for(var j = 0; j < pair.length; j++){
					var acc = pair[j];
					if(acc.indexOf("vivi_") === 0){ bindName = acc.substring(5); }
					else if(acc.indexOf("wx_") === 0){ wxBound = 1; }
				}
			}
			//主账号本身就是微信/用户名账号的情况
			if(primary.indexOf("wx_") === 0){ wxBound = 1; }
			if(primary.indexOf("vivi_") === 0){ bindName = primary.substring(5); }
			send(res,{
				errcode:0,
				errmsg:"ok",
				bound_account:bindName, //已绑定的用户名(未绑定为null)
				wx:wxBound,             //是否绑定了微信
				guest:primary.indexOf("guest_") === 0 ? 1 : 0 //主账号是否游客账号
			});
		});
	});
});

//绑定用户名密码;已绑定过则视为修改密码
app.get('/bind_account',function(req,res){
	var account = req.query.account;
	var name = req.query.name;
	var password = req.query.password;
	if(!account || !name || !password){
		send(res,{errcode:1,errmsg:"missing params"});
		return;
	}
	//账号:8~11位数字或字母组合;密码:8~15位且同时包含数字和字母
	if(!/^[A-Za-z0-9]{8,11}$/.test(name)){
		send(res,{errcode:2,errmsg:"账号需为8~11位数字或字母组合"});
		return;
	}
	if(!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8,15}$/.test(password)){
		send(res,{errcode:2,errmsg:"密码需为8~15位且同时包含数字和字母"});
		return;
	}
	db.get_bind_primary(account,function(primary){
		primary = primary || account;
		var viviAccount = "vivi_" + name;
		db.get_account_row(name,function(row){
			if(row){
				//用户名已存在:仅当该账号已绑定在当前用户名下时,允许修改密码
				db.get_bind_primary(viviAccount,function(p2){
					if(p2 && p2 === primary){
						db.update_account_password(name,password,function(ok){
							if(ok){ send(res,{errcode:0,errmsg:"ok",changed:1}); }
							else{ send(res,{errcode:3,errmsg:"修改密码失败"}); }
						});
					}
					else{
						send(res,{errcode:4,errmsg:"该账号已被使用"});
					}
				});
				return;
			}
			//用户名未被占用:检查当前用户是否已绑定过其他用户名
			db.get_bind_rows_by_primary(primary,function(rows){
				for(var i = 0; i < rows.length; i++){
					var pair = [rows[i].account_a, rows[i].account_b];
					for(var j = 0; j < pair.length; j++){
						if(pair[j].indexOf("vivi_") === 0){
							send(res,{errcode:5,errmsg:"已绑定过账号，如需修改请输入原账号"});
							return;
						}
					}
				}
				db.create_account(name,password,function(ok){
					if(!ok){ send(res,{errcode:3,errmsg:"绑定失败"}); return; }
					db.bind_to_primary(primary,viviAccount,function(ok2){
						if(ok2){ send(res,{errcode:0,errmsg:"ok"}); }
						else{ send(res,{errcode:3,errmsg:"绑定失败"}); }
					});
				});
			});
		});
	});
});

//设置用户头像(本地内置头像key,如 avatar_01)
app.get('/set_avatar',function(req,res){
	var account = req.query.account;
	var avatar = req.query.avatar;
	if(!account || !avatar){ send(res,{errcode:1,errmsg:"missing params"}); return; }
	if(!/^avatar_\d{1,3}$/.test(avatar)){ send(res,{errcode:2,errmsg:"invalid avatar"}); return; }
	db.update_user_headimg(account,avatar,function(ok){
		if(ok){ send(res,{errcode:0,errmsg:"ok"}); }
		else{ send(res,{errcode:3,errmsg:"设置失败"}); }
	});
});

app.get('/image', function (req, res) {
	var url = req.query.url;
	if (!url) {
	  http.send(res, 1, 'invalid url', {});
	  return;
	}
	if(url.search('http://') != 0 && url.search('https://') != 0){
		http.send(res, 1, 'invalid url', {});
		return;
	}

	url = url.split('.jpg')[0];


	var safe = url.search('https://') == 0;
	console.log(url);
	http.getSync(url, null, safe, 'binary', function(err, data, type){
		if (err || !type || !data) {
		  http.send(res, 1, 'invalid url', true);
		  return;
		}
		res.writeHead(200, { "Content-Type": type });
		res.write(data, 'binary');
		res.end();
	});
});