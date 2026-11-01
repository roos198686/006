cc.Class({
    extends: cc.Component,
    properties: {
        target:cc.Node,
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _isShow:false,
        lblContent:cc.Label,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return null;
        }

        cc.vv.wc = this;
        //等待提示文字统一深色
        if(this.lblContent){
            this.lblContent.node.color = cc.color(90,50,20);
        }
        this.node.active = this._isShow;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        //v2.1.0起rotation已废弃,改用angle(angle = -rotation),保持原旋转方向与速度
        this.target.angle = this.target.angle + dt*90;
    },

    show:function(content){
        this._isShow = true;
        if(this.node){
            this.node.active = this._isShow;
            //强制居中到屏幕中心,避免场景节点摆放偏移
            var parent = this.node.parent;
            if(parent){
                var vs = cc.view.getVisibleSize();
                var vo = cc.view.getVisibleOrigin();
                this.node.setPosition(parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width/2, vo.y + vs.height/2)));
            }
        }
        if(this.target){ this.target.active = true; } //加载等待时显示转圈
        if(this.lblContent){
            if(content == null){
                content = "";
            }
            this.lblContent.string = content;
        }
    },
    hide:function(){
        this._isShow = false;
        if(this.node){
            this.node.active = this._isShow;
        }
    },
    //弹窗提示:需用户点击确定才关闭(用于宝宝豆不足等必须让用户看清的提示)
    //Alert组件未挂载到任何场景(恒为undefined),这里运行时补挂到Canvas上(组件onLoad内自行绑定场景内alert节点与按钮)
    showAlert:function(msg,title){
        if(cc.vv.alert == null){
            var canvas = cc.find("Canvas");
            if(canvas){
                try{
                    canvas.addComponent(require("Alert"));
                }catch(e){
                    console.log("[wc.showAlert]Alert补挂失败:", e && e.message);
                }
            }
        }
        //直接操作场景内alert节点:两个按钮按场景配置常显,不隐藏不挪位
        var alertNode = cc.find("Canvas/alert");
        if(alertNode){
            this.hide(); //先收起等待遮罩,避免遮挡弹窗
            var tNode = cc.find("Canvas/alert/title");
            var cNode = cc.find("Canvas/alert/content");
            if(tNode){
                var tLb = tNode.getComponent(cc.Label);
                if(tLb){ tLb.string = title == null ? "提示" : String(title); }
            }
            if(cNode){
                var cLb = cNode.getComponent(cc.Label);
                if(cLb){ cLb.string = msg == null ? "" : String(msg); }
            }
            alertNode.active = true;
            return;
        }
        this.showError(msg); //兜底:场景无alert节点时退回3秒文字提示
    },
    //失败提示:直接复用等待遮罩显示错误原因,不依赖恒为undefined的cc.vv.alert,3秒后自动隐藏
    //错误提示是纯文字消息,不显示转圈(转圈仅用于加载等待)
    showError:function(msg){
        var self = this;
        this.show(msg == null ? "操作失败,请重试" : String(msg));
        if(this.target){ this.target.active = false; }
        if(this._errTimer){ clearTimeout(this._errTimer); }
        this._errTimer = setTimeout(function(){
            self._errTimer = null;
            self.hide();
        },3000);
    }
});
