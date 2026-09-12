import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * Visible foreground-service example for Android.
 *
 * Purpose:
 * - Keeps a clearly visible persistent notification while active.
 * - Sends a simple heartbeat to your own HTTPS server.
 * - Does NOT read, list, upload, or remotely browse device files.
 * - Does NOT hide itself or bypass Android permissions.
 *
 * Required AndroidManifest.xml entries in a real Android app:
 *
 * <uses-permission android:name="android.permission.INTERNET" />
 * <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
 *
 * <application ...>
 *   <service
 *       android:name=".VisibleServerHeartbeatService"
 *       android:exported="false"
 *       android:foregroundServiceType="dataSync" />
 * </application>
 *
 * On Android 13+, request POST_NOTIFICATIONS at runtime if your app needs
 * normal notification permission behavior.
 *
 * Start this service only after an explicit user action from your Activity:
 *
 * val intent = Intent(this, VisibleServerHeartbeatService::class.java)
 * androidx.core.content.ContextCompat.startForegroundService(this, intent)
 */
class VisibleServerHeartbeatService : Service() {

    companion object {
        private const val CHANNEL_ID = "roomkhoj_visible_service"
        private const val NOTIFICATION_ID = 1001
        private const val HEARTBEAT_INTERVAL_MS = 60_000L

        // Replace with your own HTTPS endpoint.
        private const val HEARTBEAT_URL = "https://example.com/api/device/heartbeat"
    }

    private val handler = Handler(Looper.getMainLooper())
    private val executor = Executors.newSingleThreadExecutor()

    private val heartbeatTask = object : Runnable {
        override fun run() {
            sendHeartbeat()
            handler.postDelayed(this, HEARTBEAT_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        handler.post(heartbeatTask)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // START_NOT_STICKY is intentional: Android should not silently resurrect
        // this service after it is explicitly stopped.
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        handler.removeCallbacks(heartbeatTask)
        executor.shutdownNow()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("RoomKhoj connection active")
            .setContentText("This device is connected to your server. No files are being accessed.")
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "RoomKhoj background connection",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows when the RoomKhoj server connection service is active."
            }

            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }

    private fun sendHeartbeat() {
        executor.execute {
            var connection: HttpURLConnection? = null
            try {
                connection = (URL(HEARTBEAT_URL).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 10_000
                    readTimeout = 10_000
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json")
                }

                val body = """{"status":"online"}"""
                connection.outputStream.use { output ->
                    output.write(body.toByteArray(Charsets.UTF_8))
                }

                // Consume the response code so the request completes.
                connection.responseCode
            } catch (_: Exception) {
                // In production, use non-sensitive local logging and retry/backoff.
            } finally {
                connection?.disconnect()
            }
        }
    }
}
