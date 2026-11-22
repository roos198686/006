package com.baobao.scmj.wxapi;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

import com.tencent.mm.opensdk.modelbase.BaseReq;
import com.tencent.mm.opensdk.modelbase.BaseResp;
import com.tencent.mm.opensdk.modelmsg.SendAuth;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.IWXAPIEventHandler;
import com.vivigames.scmj.WXAPI;

// 微信授权回调入口。包名必须是 applicationId + ".wxapi", 类名必须 WXEntryActivity, 微信按此约定拉起
public class WXEntryActivity extends Activity implements IWXAPIEventHandler {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handle(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handle(intent);
    }

    private void handle(Intent intent) {
        IWXAPI api = WXAPI.getApi(this);
        if (api == null) {
            finish();
            return;
        }
        api.handleIntent(intent, this);
    }

    @Override
    public void onReq(BaseReq req) {
        // 微信向本应用发请求, 登录流程用不到
    }

    @Override
    public void onResp(BaseResp resp) {
        if (resp instanceof SendAuth.Resp) {
            SendAuth.Resp auth = (SendAuth.Resp) resp;
            if (resp.errCode == BaseResp.ErrCode.ERR_OK) {
                WXAPI.notifyLoginResult(auth.code);
            } else if (resp.errCode != BaseResp.ErrCode.ERR_USER_CANCEL) {
                WXAPI.toast(this, "微信授权失败(" + resp.errCode + ")");
            }
        }
        finish();
    }
}
