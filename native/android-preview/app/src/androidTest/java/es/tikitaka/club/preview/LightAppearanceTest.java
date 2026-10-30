package es.tikitaka.club.preview;

import static org.junit.Assert.*;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Build;
import android.webkit.WebSettings;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class LightAppearanceTest {
    private String js(MainActivity activity,String script) throws Exception {
        CountDownLatch ready=new CountDownLatch(1);
        AtomicReference<String> value=new AtomicReference<>();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(()->activity.getWebViewForTest().evaluateJavascript(script,r->{value.set(r);ready.countDown();}));
        assertTrue("JavaScript callback",ready.await(5,TimeUnit.SECONDS));
        return value.get();
    }
    @Test public void liveLoginRemainsCreamInSystemDarkMode() throws Exception {
        var instrumentation=InstrumentationRegistry.getInstrumentation();
        var context=instrumentation.getTargetContext();
        assertEquals("Device actually requests night mode",Configuration.UI_MODE_NIGHT_YES,context.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK);
        MainActivity activity=(MainActivity)instrumentation.startActivitySync(new Intent(context,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        try {
            String ready="false";
            for(int i=0;i<120;i++) {
                ready=js(activity,"!!(document.getElementById('loginCard') && document.getElementById('loginBtn') && typeof window.render==='function')");
                if("true".equals(ready))break;
                Thread.sleep(500);
            }
            assertEquals("Current club login and JavaScript load", "true",ready);
            assertEquals("\"rgb(246, 244, 238)\"",js(activity,"getComputedStyle(document.body).backgroundColor"));
            assertEquals("\"rgb(255, 255, 255)\"",js(activity,"getComputedStyle(document.getElementById('loginCard')).backgroundColor"));
            instrumentation.runOnMainSync(()->{
                if(Build.VERSION.SDK_INT>=29)assertFalse(activity.getWebViewForTest().isForceDarkAllowed());
                if(Build.VERSION.SDK_INT>=33)assertFalse(activity.getWebViewForTest().getSettings().isAlgorithmicDarkeningAllowed());
                else if(Build.VERSION.SDK_INT>=29)assertEquals(WebSettings.FORCE_DARK_OFF,activity.getWebViewForTest().getSettings().getForceDark());
            });
            Thread.sleep(1000);
            Bitmap screen=instrumentation.getUiAutomation().takeScreenshot();
            assertNotNull(screen);
            int pixel=screen.getPixel(5,screen.getHeight()/2);
            assertTrue("Rendered background stays cream rather than being inverted",Math.abs(Color.red(pixel)-246)<8 && Math.abs(Color.green(pixel)-244)<8 && Math.abs(Color.blue(pixel)-238)<8);
            File folder=context.getExternalFilesDir(null);
            try(FileOutputStream out=new FileOutputStream(new File(folder,"android-dark-login.png"))){screen.compress(Bitmap.CompressFormat.PNG,100,out);}
        } finally {instrumentation.runOnMainSync(activity::finish);}
    }
}
