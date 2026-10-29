package es.tikitaka.club.preview;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    public static final String HOME = "https://sanailcso.github.io/bares2/index.html";
    private static final int FILE_PICKER = 7;
    private WebView web;
    private ValueCallback<Uri[]> pendingFiles;
    private LinearLayout root;
    private LinearLayout error;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(246,244,238));
        if (Build.VERSION.SDK_INT >= 29) root.setForceDarkAllowed(false);
        root.setOnApplyWindowInsetsListener((view,insets)->{
            view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(246,244,238));
        if (Build.VERSION.SDK_INT >= 29) {
            web.setForceDarkAllowed(false);
            web.getSettings().setForceDark(WebSettings.FORCE_DARK_OFF);
        }
        if (Build.VERSION.SDK_INT >= 33) web.getSettings().setAlgorithmicDarkeningAllowed(false);
        WebView.setWebContentsDebuggingEnabled(false);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri=request.getUrl();
                if (isClubUrl(uri)) return false;
                String scheme=uri.getScheme();
                if ("https".equals(scheme) || "http".equals(scheme) || "mailto".equals(scheme) || "tel".equals(scheme)) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW,uri)); } catch(ActivityNotFoundException ignored) {}
                }
                return true;
            }
            @Override public void onPageFinished(WebView view,String url) { if (isClubUrl(Uri.parse(url))) error.setVisibility(View.GONE); }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError failure) {
                if(request.isForMainFrame()) error.setVisibility(View.VISIBLE);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if(pendingFiles!=null) pendingFiles.onReceiveValue(null);
                pendingFiles=callback;
                try { startActivityForResult(params.createIntent(),FILE_PICKER); }
                catch(ActivityNotFoundException ex) { pendingFiles=null;callback.onReceiveValue(null); }
                return true;
            }
        });
        error=new LinearLayout(this);
        error.setOrientation(LinearLayout.VERTICAL);
        error.setPadding(24,24,24,24);
        TextView message=new TextView(this);
        message.setText("No hemos podido conectar. Comprueba tu conexión y vuelve a intentarlo.");
        message.setTextColor(Color.rgb(37,35,40));
        error.addView(message);
        Button retry=new Button(this);retry.setText("Volver a intentar");
        retry.setOnClickListener(v->{error.setVisibility(View.GONE);web.loadUrl(HOME);});
        error.addView(retry);error.setVisibility(View.GONE);
        root.addView(error);
        root.addView(web,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,0,1));
        setContentView(root);
        web.loadUrl(HOME);
    }
    private static boolean isClubUrl(Uri uri) {
        return "https".equals(uri.getScheme()) && "sanailcso.github.io".equals(uri.getHost()) && (uri.getPort()==-1 || uri.getPort()==443) && uri.getPath()!=null && uri.getPath().startsWith("/bares2/");
    }
    @Override protected void onActivityResult(int request,int result,Intent data) {
        super.onActivityResult(request,result,data);
        if(request==FILE_PICKER && pendingFiles!=null) {
            pendingFiles.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));pendingFiles=null;
        }
    }
    @Override public void onBackPressed() { if(web.canGoBack()) web.goBack(); else super.onBackPressed(); }
    @Override protected void onDestroy() {
        if(pendingFiles!=null) {pendingFiles.onReceiveValue(null);pendingFiles=null;}
        if(web!=null) {root.removeView(web);web.destroy();web=null;}
        super.onDestroy();
    }
    WebView getWebViewForTest() { return web; }
}
