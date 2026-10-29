package es.tikitaka.club.avisos;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.browser.customtabs.CustomTabColorSchemeParams;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;
import com.google.androidbrowserhelper.trusted.TwaLauncher;

/** Chrome owns the Service Worker and PushManager; the verified service delegates notifications. */
public class MainActivity extends Activity {
    public static final String HOME="https://sanailcso.github.io/bares2/index.html";
    private TwaLauncher launcher;
    private boolean launched;
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        LinearLayout root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(32,64,32,32);
        root.setBackgroundColor(Color.rgb(246,244,238));
        TextView message=new TextView(this);
        message.setTextColor(Color.rgb(37,35,40));
        message.setText("Abriendo Tiki Taka…");
        root.addView(message);setContentView(root);
        try {getPackageManager().getPackageInfo("com.android.chrome",0);}
        catch(Exception missing) {
            message.setText("Para usar la app y recibir sus avisos, instala o activa Google Chrome.");
            Button install=new Button(this);install.setText("Abrir Google Play");
            install.setOnClickListener(v->startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse("https://play.google.com/store/apps/details?id=com.android.chrome"))));
            root.addView(install);return;
        }
        Uri url=Uri.parse(HOME);
        Uri requested=getIntent().getData();
        if(isClubUrl(requested))url=requested;
        int cream=Color.rgb(246,244,238);
        CustomTabColorSchemeParams colors=new CustomTabColorSchemeParams.Builder().setToolbarColor(cream).setNavigationBarColor(cream).setNavigationBarDividerColor(cream).build();
        TrustedWebActivityIntentBuilder builder=new TrustedWebActivityIntentBuilder(url)
            .setColorScheme(CustomTabsIntent.COLOR_SCHEME_LIGHT)
            .setDefaultColorSchemeParams(colors)
            .setColorSchemeParams(CustomTabsIntent.COLOR_SCHEME_DARK,colors);
        launcher=new TwaLauncher(this,"com.android.chrome");
        launcher.launch(builder,null,null,()->launched=true);
    }
    private static boolean isClubUrl(Uri u) {
        return u!=null && "https".equals(u.getScheme()) && "sanailcso.github.io".equals(u.getHost()) && (u.getPort()==-1||u.getPort()==443) && u.getPath()!=null && u.getPath().startsWith("/bares2/");
    }
    @Override protected void onRestart(){super.onRestart();if(launched)finish();}
    @Override protected void onDestroy(){if(launcher!=null)launcher.destroy();super.onDestroy();}
}
