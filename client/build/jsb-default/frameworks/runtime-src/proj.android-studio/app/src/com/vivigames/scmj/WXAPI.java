package com.vivigames.scmj;

import android.app.Activity;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.widget.Toast;

import com.tencent.mm.opensdk.modelmsg.SendAuth;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;

import org.cocos2dx.lib.Cocos2dxActivity;
import org.cocos2dx.lib.Cocos2dxHelper;
import org.cocos2dx.lib.Cocos2dxJavascriptJavaBridge;

// 微信登录原生桥接。JS 调用: jsb.reflection.callStaticMethod("com/vivigames/scmj/WXAPI", "Login", "()V")
// AppID 配置在 AndroidManifest.xml 的 meta-data WX_APPID, 不在代码里写死
public final class WXAPI {
    private static IWXAPI api;

    private WXAPI() {}

    // AppActivity.onCreate 调用, 提前注册, 保证微信回调时 api 已就绪
    public static void init(Context context) {
        if (api != null) return;
        String appId = getAppId(context);
        if (appId == null || appId.length() == 0) return;
        api = WXAPIFactory.createWXAPI(context.getApplicationContext(), appId, true);
        api.registerApp(appId);
    }

    public static IWXAPI getApi(Context context) {
        if (api == null) init(context);
        return api;
    }

    private static String getAppId(Context context) {
        try {
            ApplicationInfo info = context.getPackageManager().getApplicationInfo(
                    context.getPackageName(), PackageManager.GET_META_DATA);
            if (info.metaData != null) {
                return info.metaData.getString("WX_APPID", "");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }

    public static void Login() {
        Context context = Cocos2dxActivity.getContext();
        IWXAPI wx = getApi(context);
        if (wx == null) {
            toast(context, "微信AppID未配置");
            return;
        }
        if (!wx.isWXAppInstalled()) {
            toast(context, "请先安装微信");
            return;
        }
        SendAuth.Req req = new SendAuth.Req();
        req.scope = "snsapi_userinfo";
        req.state = "baobao_" + System.currentTimeMillis();
        boolean ok = wx.sendReq(req);
        if (!ok) {
            toast(context, "无法调起微信, 请检查微信开放平台配置");
        }
    }

    // WXEntryActivity 收到授权结果后调用, 切到 GL 线程回传 code 给 JS
    public static void notifyLoginResult(final String code) {
        Cocos2dxHelper.runOnGLThread(new Runnable() {
            @Override
            public void run() {
                Cocos2dxJavascriptJavaBridge.evalString(
                        "if(cc.vv&&cc.vv.anysdkMgr){cc.vv.anysdkMgr.onLoginResp('" + code + "');}");
            }
        });
    }

    public static void toast(final Context context, final String msg) {
        if (!(context instanceof Activity)) return;
        ((Activity) context).runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(context, msg, Toast.LENGTH_SHORT).show();
            }
        });
    }
}
