package es.tikitaka.club.avisos;

import android.app.Notification;
import android.content.Context;
import android.graphics.drawable.Icon;
import com.google.androidbrowserhelper.trusted.DelegationService;

/** Chrome provides the content; Tiki Taka supplies the Android notification identity/icon. */
public class TikiTakaNotificationService extends DelegationService {
    public static Notification brandNotification(Context context,Notification original) {
        return Notification.Builder.recoverBuilder(context,original)
            .setSmallIcon(Icon.createWithResource(context,R.drawable.ic_notification))
            .build();
    }

    @Override public boolean onNotifyNotificationWithChannel(String tag,int id,Notification notification,String channelName) {
        return super.onNotifyNotificationWithChannel(tag,id,brandNotification(this,notification),channelName);
    }
}
