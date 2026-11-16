//强制加载JS版socket.io客户端,兼容两种模块包装:
//1.打包bundle:库无导出,执行时通过副作用把window.io设为v2协议客户端(覆盖jsb引擎预置的0.9老协议客户端)
//2.预览/quick-scripts:库通过module.exports导出,需手动把导出对象赋给window.io
//(jsb引擎预置的0.9老客户端与服务端socket.io 2.x不兼容,握手后无法解析导致原生端进房黑屏)
var __jsbio = require("socket-io");
if( __jsbio != null && __jsbio.connect) { window.io = __jsbio; }
 
var Global = cc.Class({
    extends: cc.Component,
    statics: {
        ip:"",
        sio:null,
        isPinging:false,
        fnDisconnect:null,
        handlers:{},
        addHandler:function(event,fn){
            if(this.handlers[event]){
                console.log("event:" + event + "' handler has been registered.");
                return;
            }

            var handler = function(data){
                //console.log(event + "(" + typeof(data) + "):" + (data? data.toString():"null"));
                if(event != "disconnect" && typeof(data) == "string"){
                    data = JSON.parse(data);
                }
                fn(data);
            };
            
            this.handlers[event] = handler; 
            if(this.sio){
                console.log("register:function " + event);
                this.sio.on(event,handler);
            }
        },
        connect:function(fnConnect,fnError) {
            var self = this;
            
            var opts = {
                'reconnection':true,
                'force new connection': true,
                'transports':['websocket', 'polling']
            }
            //jsb无window.location,无协议头的host:port无法被JS版socket.io解析,必须显式补http://
            var url = this.ip;
            if(url.indexOf('://') < 0){ url = 'http://' + url; }
            //同一页面重复进房/断线重连会新建socket(旧房间的socket仍存活)。
            //必须先把旧socket的监听全部摘掉再断开:否则服务端踢旧socket时发的 kick_offline / disconnect
            //会通过旧监听回调进来,把新建的socket一起close掉——服务端已登录成功,客户端却永远等不到
            //login_result,表现为一直卡在"正在进入房间",刷新页面后才正常(刷新后不存在旧socket)。
            var oldSio = this.sio;
            this.sio = null;
            if(oldSio){
                try{ oldSio.removeAllListeners(); }catch(e){}
                try{ oldSio.disconnect(); }catch(e){}
            }
            var sio = this.sio = window.io.connect(url,opts);
            //每个回调只认自己创建的那个socket,过期socket的任何事件一律丢弃
            var isCurrent = function(){ return self.sio === sio; };
            // 全局监听所有socket事件(调试用)
            sio.on('reconnect',function(){
                if(!isCurrent()){ return; }
                console.log('reconnection');
            });
            // socket.io 2.x 的 manager onAny
            if(sio.io && sio.io.onAny){
                sio.io.onAny(function(event,data){
                    if(!isCurrent()){ return; }
                    if(event.indexOf('game_') === 0 || event.indexOf('hu') >= 0 || event.indexOf('caishen') >= 0){
                        console.log('[socket.io onAny]', event, typeof(data) === 'string' ? data.substring(0,100) : data);
                    }
                });
            }
            sio.on('connect',function(data){
                if(!isCurrent()){ return; }
                sio.connected = true;
                fnConnect(data);
            });
            
            sio.on('disconnect',function(data){
                if(!isCurrent()){ return; } //旧socket断开不影响当前连接
                console.log("disconnect");
                sio.connected = false;
                self.close();
            });
            
            sio.on('connect_failed',function (){
                if(!isCurrent()){ return; }
                console.log('connect_failed');
                if(fnError){ fnError(); }
            });

            sio.on('connect_error',function (){
                if(!isCurrent()){ return; }
                console.log('connect_error');
                if(fnError){ fnError(); }
            });
            
            console.log("[Net.connect] handlers keys:", Object.keys(this.handlers));
            var bindHandler = function(key,value){
                if(key == 'disconnect'){
                    self.fnDisconnect = value;
                }
                else{
                    console.log("[Net.connect] register sio.on:", key);
                    sio.on(key,function(d){
                        if(!isCurrent()){ return; }
                        value(d);
                    });
                }
            };
            for(var key in this.handlers){
                var value = this.handlers[key];
                if(typeof(value) == "function"){
                    bindHandler(key,value);
                }
            }
            
            this.startHearbeat(sio);
        },
        
        startHearbeat:function(sio){
            sio = sio || this.sio;
            if(!sio){ return; }
            var self = this;
            sio.on('game_pong',function(){
                if(self.sio !== sio){ return; }
                console.log('game_pong');
                self.lastRecieveTime = Date.now(); 
            });
            this.lastRecieveTime = Date.now();
            console.log(1);
            if(!self.isPinging){
                console.log(1);
                self.isPinging = true;
                setInterval(function(){
                    console.log(3);
                    if(self.sio){
                        console.log(4);
                        if(Date.now() - self.lastRecieveTime > 10000){
                            self.close();
                        }
                        else{
                            self.ping();
                        }                        
                    }
                },5000);
            }   
        },
        send:function(event,data){
            if(this.sio && this.sio.connected){
                if(data != null && (typeof(data) == "object")){
                    data = JSON.stringify(data);
                    //console.log(data);              
                }
                this.sio.emit(event,data);                
            }
        },
        
        ping:function(){
            this.send('game_ping');
        },
        
        close:function(){
            console.log('close');
            //只关闭当前连接的socket,并立刻置空:避免旧socket的断开事件把新连接一起清掉
            var sio = this.sio;
            this.sio = null;
            if(sio){
                sio.connected = false;
                try{ sio.disconnect(); }catch(e){}
            }
            if(this.fnDisconnect){
                var fn = this.fnDisconnect;
                this.fnDisconnect = null;
                fn();
            }
        },
        
        test:function(fnResult){
            var xhr = null;
            var fn = function(ret){
                fnResult(ret.isonline);
                xhr = null;
            }
            
            var arr = this.ip.split(':');
            var data = {
                account:cc.vv.userMgr.account,
                sign:cc.vv.userMgr.sign,
                ip:arr[0],
                port:arr[1],
            }
            xhr = cc.vv.http.sendRequest("/is_server_online",data,fn);
            setTimeout(function(){
                if(xhr){
                    xhr.abort();
                    fnResult(false);                    
                }
            },1500);
            /*
            var opts = {
                'reconnection':true,
                'force new connection': true,
                'transports':['websocket', 'polling']
            }
            var self = this;
            this.testsio = window.io.connect(this.ip,opts);
            this.testsio.on('connect',function(){
                console.log('connect');
                self.testsio.close();
                self.testsio = null;
                fnResult(true);
            });
            this.testsio.on('connect_error',function(){
                console.log('connect_failed');
                self.testsio = null;
                fnResult(false);
            });
            */
        }
    },
});