package es.tikitaka.club.avisos;

import static org.junit.Assert.*;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.Icon;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class NotificationBrandingTest {
    @Test public void chromeIconIsReplacedAndActualAndroidNotificationKeepsTikiTaka() throws Exception {
        var instrumentation=InstrumentationRegistry.getInstrumentation();
        var context=instrumentation.getTargetContext();
        var manager=(NotificationManager)context.getSystemService(NotificationManager.class);
        manager.createNotificationChannel(new NotificationChannel("branding-test","Prueba de identidad",NotificationManager.IMPORTANCE_DEFAULT));
        Notification original=new Notification.Builder(context.createPackageContext("com.android.chrome",0),"branding-test")
            .setSmallIcon(Icon.createWithResource("com.android.chrome",android.R.drawable.ic_dialog_info))
            .setContentTitle("Tiki Taka · aviso de prueba")
            .setContentText("El aviso debe mostrar el icono de Tiki Taka.")
            .setLargeIcon(BitmapFactory.decodeResource(context.getResources(),R.mipmap.ic_launcher))
            .build();
        Notification branded=TikiTakaNotificationService.brandNotification(context,original);
        assertEquals("es.tikitaka.club.avisos",branded.getSmallIcon().getResPackage());
        assertEquals(R.drawable.ic_notification,branded.getSmallIcon().getResId());
        assertEquals(original.extras.getCharSequence(Notification.EXTRA_TITLE),branded.extras.getCharSequence(Notification.EXTRA_TITLE));
        assertNotNull("The icon can also be decoded for the Chrome delegation protocol",BitmapFactory.decodeResource(context.getResources(),R.drawable.ic_notification));
        try {
            manager.notify("branding-test",901,branded);
            Thread.sleep(700);
            var active=manager.getActiveNotifications();
            var posted=java.util.Arrays.stream(active).filter(n->n.getId()==901).findFirst().orElseThrow();
            assertEquals("es.tikitaka.club.avisos",posted.getPackageName());
            assertEquals("es.tikitaka.club.avisos",posted.getNotification().getSmallIcon().getResPackage());
            instrumentation.getUiAutomation().executeShellCommand("cmd statusbar expand-notifications").close();
            Thread.sleep(500);
            Bitmap screen=instrumentation.getUiAutomation().takeScreenshot();
            assertNotNull(screen);
            try(FileOutputStream out=new FileOutputStream(new File(context.getExternalFilesDir(null),"android-branding-panel.png"))){screen.compress(Bitmap.CompressFormat.PNG,100,out);}
        } finally {manager.cancel("branding-test",901);}
    }
}
