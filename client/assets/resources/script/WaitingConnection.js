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
            // 黑框是文字的兄弟节点 public_frame_a(13个场景结构一致), 不是父节点; 父节点是WaitingConnection根, 改它无效
            this._frame = this.node.getChildByName("public_frame_a") || this.lblContent.node.parent;
            if(this._frame){ this._origFrameW = this._frame.width; this._origFrameH = this._frame.height; }
            this._origLblX = this.lblContent.node.x;
            this._origLblY = this.lblContent.node.y;
            this._origLblW = this.lblContent.node.width;
            this._origOverflow = this.lblContent.overflow;
            this._origHAlign = this.lblContent.horizontalAlign;
            this._origVAlign = this.lblContent.verticalAlign;
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
        this._restoreLayout();   // 上一次错误提示改过黑框/文字, 先还原
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
    //黑框固定为场景里的方形尺寸(不再随文字拉伸), 文字超宽自动换行并上下左右居中
    showError:function(msg){
        var self = this;
        this.show(msg == null ? "操作失败,请重试" : String(msg));
        if(this.target){ this.target.active = false; }
        if(this.lblContent && this._frame){
            var lb = this.lblContent;
            var lbNode = lb.node;
            var fw = (this._origFrameW > 0) ? this._origFrameW : 300;
            var fh = (this._origFrameH > 0) ? this._origFrameH : 300;
            this._frame.setContentSize(fw, fh);
            lb.overflow = cc.Label.Overflow.CLAMP;            // 固定框: 超出宽度自动换行, 超出高度裁剪
            lbNode.setContentSize(Math.max(60, fw - 48), Math.max(40, fh - 48));
            lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
            lbNode.setPosition(0, 0);
        }
        if(this._errTimer){ clearTimeout(this._errTimer); }
        this._errTimer = setTimeout(function(){
            self._errTimer = null;
            self.hide();
        },3000);
    },
    // 还原加载态布局(转圈时黑框/文字回场景原位)
    _restoreLayout: function(){
        if(!this.lblContent || !this._frame) return;
        this._frame.setContentSize(this._origFrameW, this._origFrameH);
        this.lblContent.overflow = this._origOverflow;
        this.lblContent.horizontalAlign = this._origHAlign;
        this.lblContent.verticalAlign = this._origVAlign;
        this.lblContent.node.width = this._origLblW;
        this.lblContent.node.setPosition(this._origLblX, this._origLblY);
    }
});
