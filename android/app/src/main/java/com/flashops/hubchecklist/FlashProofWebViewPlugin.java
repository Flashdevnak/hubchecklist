package com.flashops.hubchecklist;

import android.app.Dialog;
import android.graphics.Color;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.regex.Pattern;
import org.json.JSONObject;

@CapacitorPlugin(name = "FlashProofWebViewPlugin")
public class FlashProofWebViewPlugin extends Plugin {
    private static final String ALLOWED_HOST = "api.flashexpress.com";
    private static final String ALLOWED_PATH = "/gw/nws/web/proof/go/";
    private static final long SEARCH_TIMEOUT_MS = 30000L;

    private Dialog dialog;
    private WebView webView;
    private PluginCall activeCall;
    private JSObject lastResult;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable timeoutRunnable;

    @PluginMethod
    public void isFlashProofWebViewAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", true);
        result.put("status", "available");
        result.put("message", "Android FlashProofWebViewPlugin พร้อมใช้งาน");
        call.resolve(result);
    }

    @PluginMethod
    public void openFlashProof(PluginCall call) {
        String url = call.getString("url", "");
        String phone = call.getString("phone", "");
        String vehicleBarcode = call.getString("vehicleBarcode", "");

        if (!isAllowedFlashUrl(url)) {
            resolveError(call, "invalid_url", "อนุญาตเฉพาะ https://api.flashexpress.com/gw/nws/web/proof/go/ เท่านั้น");
            return;
        }

        if (!Pattern.matches("^0[689][0-9]{8}$", phone)) {
            resolveError(call, "invalid_phone", "เบอร์โทรต้องเป็น 10 หลักและขึ้นต้นด้วย 06, 08 หรือ 09");
            return;
        }

        getActivity().runOnUiThread(() -> {
            closeDialog();
            activeCall = call;
            dialog = new Dialog(getActivity());
            dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
            webView = new WebView(getActivity());
            webView.setBackgroundColor(Color.WHITE);
            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setSupportMultipleWindows(false);
            webView.addJavascriptInterface(new FlashBridge(phone, vehicleBarcode, url), "FlashProofNative");
            webView.setWebChromeClient(new WebChromeClient());
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    return !isAllowedFlashUrl(request.getUrl().toString());
                }

                @Override
                public void onPageFinished(WebView view, String loadedUrl) {
                    if (!isAllowedFlashUrl(loadedUrl)) {
                        finishWithError("blocked_domain", "WebView ถูกบล็อกเพราะโดเมนไม่ถูกต้อง");
                        return;
                    }
                    handler.postDelayed(() -> runAutoFill(phone, vehicleBarcode, url), 900);
                }

                @Override
                public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                    if (request.isForMainFrame()) {
                        finishWithError("network_error", "โหลดหน้า Flash ไม่สำเร็จ");
                    }
                }
            });

            dialog.setContentView(webView);
            Window window = dialog.getWindow();
            if (window != null) {
                window.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
            }
            dialog.setOnDismissListener(d -> clearTimeout());
            dialog.show();
            Window shownWindow = dialog.getWindow();
            if (shownWindow != null) {
                shownWindow.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
            }

            timeoutRunnable = () -> finishWithError("timeout", "รอผลลัพธ์จากหน้า Flash นานเกินไป");
            handler.postDelayed(timeoutRunnable, SEARCH_TIMEOUT_MS);
            webView.loadUrl(url);
        });
    }

    @PluginMethod
    public void closeFlashProof(PluginCall call) {
        getActivity().runOnUiThread(this::closeDialog);
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("status", "closed");
        result.put("message", "ปิด Flash WebView แล้ว");
        call.resolve(result);
    }

    @PluginMethod
    public void getLastFlashProofResult(PluginCall call) {
        if (lastResult == null) {
            resolveError(call, "empty", "ยังไม่มีผลลัพธ์ Flash WebView");
            return;
        }

        JSObject response = new JSObject();
        response.put("success", true);
        response.put("status", "success");
        response.put("message", "โหลดผลลัพธ์ล่าสุดแล้ว");
        response.put("data", lastResult);
        call.resolve(response);
    }

    private void runAutoFill(String phone, String vehicleBarcode, String sourceUrl) {
        if (webView == null) return;
        webView.evaluateJavascript(buildAutomationScript(phone, vehicleBarcode, sourceUrl), value -> {
            if (value != null && value.contains("NO_PHONE_INPUT")) {
                finishWithError("no_input_found", "ไม่พบช่องกรอกเบอร์โทรในหน้า Flash");
            } else if (value != null && value.contains("NO_SEARCH_BUTTON")) {
                finishWithError("no_search_button", "ไม่พบปุ่มค้นหาในหน้า Flash");
            }
        });
    }

    private String buildAutomationScript(String phone, String vehicleBarcode, String sourceUrl) {
        return "(function(){"
            + "const phone=" + JSONObject.quote(phone) + ";"
            + "const vehicleBarcode=" + JSONObject.quote(vehicleBarcode) + ";"
            + "const sourceUrl=" + JSONObject.quote(sourceUrl) + ";"
            + "function visible(el){const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';}"
            + "function text(el){return (el.innerText||el.textContent||el.value||el.placeholder||'').trim();}"
            + "const labels=['เบอร์โทรศัพท์ของคนขับรถ','เบอร์โทรศัพท์','เบอร์โทร','phone'];"
            + "const inputs=Array.from(document.querySelectorAll('input[type=\"tel\"],input[type=\"number\"],input[type=\"text\"],input:not([type])')).filter(visible);"
            + "let input=inputs.find(el=>labels.some(label=>text(el).toLowerCase().includes(label.toLowerCase())||(el.placeholder||'').toLowerCase().includes(label.toLowerCase())));"
            + "if(!input) input=inputs.find(el=>{const box=el.closest('label,div,section,form')||el.parentElement;return box&&labels.some(label=>text(box).toLowerCase().includes(label.toLowerCase()));});"
            + "if(!input) input=inputs[0];"
            + "if(!input) return 'NO_PHONE_INPUT';"
            + "input.focus(); input.value=phone; input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true}));"
            + "const buttons=Array.from(document.querySelectorAll('button,input[type=\"submit\"],input[type=\"button\"],a')).filter(visible);"
            + "let button=buttons.find(el=>/ค้นหา|search/i.test(text(el)));"
            + "if(!button) button=buttons.find(el=>input.closest('form')&&input.closest('form').contains(el));"
            + "if(!button) return 'NO_SEARCH_BUTTON';"
            + "button.click();"
            + "let attempts=0;"
            + "const timer=setInterval(()=>{"
            + "attempts++;"
            + "const rawText=document.body.innerText||'';"
            + "const hasResult=/บันทึกสถานะรถเข้า-ออก|ชื่อสาขา|เวลาที่คาดว่าจะถึง|ระยะทาง|เลขซีลล็อตรถ|barcode|branch/i.test(rawText);"
            + "if(hasResult||attempts>20){"
            + "clearInterval(timer);"
            + "const rows=Array.from(document.querySelectorAll('tr')).map((tr,i)=>({index:i+1, text:Array.from(tr.children).map(td=>text(td)).join(' | ')})).filter(row=>row.text);"
            + "FlashProofNative.onExtracted(JSON.stringify({sourceUrl,vehicleBarcode,driverPhone:phone,rawText,htmlSnapshot:document.documentElement.outerHTML,status:hasResult?'success':'error',flashPageStatus:hasResult?'result_detected':'no_result_detected',routeRows:rows,extractedAt:new Date().toISOString()}));"
            + "}"
            + "},1200);"
            + "return 'SEARCH_STARTED';"
            + "})();";
    }

    private boolean isAllowedFlashUrl(String url) {
        try {
            Uri uri = Uri.parse(url);
            return "https".equalsIgnoreCase(uri.getScheme())
                && ALLOWED_HOST.equalsIgnoreCase(uri.getHost())
                && uri.getPath() != null
                && uri.getPath().contains(ALLOWED_PATH);
        } catch (Exception ignored) {
            return false;
        }
    }

    private void finishWithResult(JSObject data) {
        clearTimeout();
        lastResult = data;
        if (activeCall != null) {
            JSObject response = new JSObject();
            response.put("success", true);
            response.put("status", "success");
            response.put("message", "ดึงข้อมูลจาก Flash WebView แล้ว");
            response.put("data", data);
            activeCall.resolve(response);
            activeCall = null;
        }
    }

    private void finishWithError(String status, String message) {
        clearTimeout();
        if (activeCall != null) {
            resolveError(activeCall, status, message);
            activeCall = null;
        }
    }

    private void resolveError(PluginCall call, String status, String message) {
        JSObject response = new JSObject();
        response.put("success", false);
        response.put("status", "error");
        response.put("message", message);
        response.put("errorCode", status);
        call.resolve(response);
    }

    private void clearTimeout() {
        if (timeoutRunnable != null) {
            handler.removeCallbacks(timeoutRunnable);
            timeoutRunnable = null;
        }
    }

    private void closeDialog() {
        clearTimeout();
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        if (dialog != null && dialog.isShowing()) {
            dialog.dismiss();
        }
        dialog = null;
    }

    private class FlashBridge {
        FlashBridge(String phone, String vehicleBarcode, String sourceUrl) {}

        @JavascriptInterface
        public void onExtracted(String json) {
            handler.post(() -> {
                try {
                    JSObject data = new JSObject(json);
                    if (!data.has("routeRows")) {
                        data.put("routeRows", new JSArray());
                    }
                    finishWithResult(data);
                } catch (Exception exception) {
                    finishWithError("parse_error", "แปลงผลลัพธ์จาก Flash ไม่สำเร็จ");
                }
            });
        }
    }
}
