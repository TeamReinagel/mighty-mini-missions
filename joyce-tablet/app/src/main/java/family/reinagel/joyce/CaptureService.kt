package family.reinagel.joyce

import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Point
import android.graphics.Rect
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.Looper
import android.view.WindowManager
import androidx.core.app.NotificationCompat

class CaptureService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private val readerThread = HandlerThread("joyce-capture").apply { start() }
    private val readerHandler = Handler(readerThread.looper)
    private var projection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    var isReady = false
        private set

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
        running = true
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startAsForeground()
        when (intent?.action) {
            ACTION_STOP -> stopProjection()
            ACTION_START -> startProjection(intent)
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        releaseDisplay()
        try {
            projection?.stop()
        } catch (_: Exception) {
        }
        projection = null
        isReady = false
        readerThread.quitSafely()
        if (instance == this) instance = null
        running = false
        super.onDestroy()
    }

    fun grab(onResult: (Bitmap?) -> Unit) {
        handler.post { grabOnMain(onResult) }
    }

    private fun startProjection(intent: Intent) {
        if (isReady) {
            fireReady()
            return
        }
        val code = intent.getIntExtra(EXTRA_RESULT_CODE, Activity.RESULT_CANCELED)
        val data = if (Build.VERSION.SDK_INT >= 33) {
            intent.getParcelableExtra(EXTRA_DATA, Intent::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(EXTRA_DATA)
        }
        if (data == null) {
            fireFailed()
            return
        }
        try {
            val manager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            val created = manager.getMediaProjection(code, data)
            created.registerCallback(object : MediaProjection.Callback() {
                override fun onStop() {
                    isReady = false
                    projection = null
                    releaseDisplay()
                }
            }, handler)
            projection = created
            isReady = true
            fireReady()
        } catch (_: Exception) {
            isReady = false
            fireFailed()
            return
        }
    }

    private fun grabOnMain(onResult: (Bitmap?) -> Unit) {
        val proj = projection
        if (proj == null) {
            onResult(null)
            return
        }
        releaseDisplay()
        val bounds = screenSize()
        val width = bounds.width() - bounds.width() % 2
        val height = bounds.height() - bounds.height() % 2
        if (width < 2 || height < 2) {
            onResult(null)
            return
        }
        val reader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
        var delivered = false
        fun finish(bitmap: Bitmap?) {
            if (delivered) return
            delivered = true
            releaseDisplay()
            onResult(bitmap)
        }
        reader.setOnImageAvailableListener({ source ->
            val image = source.acquireLatestImage() ?: return@setOnImageAvailableListener
            val bitmap = try {
                imageToBitmap(image)
            } catch (_: Exception) {
                null
            } finally {
                image.close()
            }
            if (bitmap == null) return@setOnImageAvailableListener
            if (looksBlank(bitmap)) {
                bitmap.recycle()
                return@setOnImageAvailableListener
            }
            handler.post { finish(bitmap) }
        }, readerHandler)
        try {
            virtualDisplay = proj.createVirtualDisplay(
                "joyce-help",
                width,
                height,
                resources.displayMetrics.densityDpi,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                reader.surface,
                null,
                readerHandler
            )
            imageReader = reader
        } catch (_: Exception) {
            finish(null)
            return
        }
        handler.postDelayed({
            if (delivered) return@postDelayed
            val image = try {
                reader.acquireLatestImage()
            } catch (_: Exception) {
                null
            }
            val bitmap = if (image != null) {
                try {
                    imageToBitmap(image)
                } catch (_: Exception) {
                    null
                } finally {
                    image.close()
                }
            } else null
            finish(bitmap)
        }, 2000)
    }

    private fun screenSize(): Rect {
        val wm = getSystemService(WINDOW_SERVICE) as WindowManager
        return if (Build.VERSION.SDK_INT >= 30) {
            wm.currentWindowMetrics.bounds
        } else {
            val point = Point()
            @Suppress("DEPRECATION")
            wm.defaultDisplay.getRealSize(point)
            Rect(0, 0, point.x, point.y)
        }
    }

    private fun releaseDisplay() {
        try {
            virtualDisplay?.release()
        } catch (_: Exception) {
        }
        try {
            imageReader?.close()
        } catch (_: Exception) {
        }
        virtualDisplay = null
        imageReader = null
    }

    private fun stopProjection() {
        releaseDisplay()
        try {
            projection?.stop()
        } catch (_: Exception) {
        }
        projection = null
        isReady = false
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun startAsForeground() {
        val channelId = "joyce-capture"
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) {
            manager.createNotificationChannel(
                NotificationChannel(channelId, "Joyce screen sharing", NotificationManager.IMPORTANCE_LOW)
            )
        }
        val stop = PendingIntent.getService(
            this,
            1,
            Intent(this, CaptureService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_stat_joyce)
            .setContentTitle("Joyce can see the screen")
            .setContentText("This stays on for the learning block.")
            .setOngoing(true)
            .addAction(0, "Stop sharing", stop)
            .build()
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(22, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
        } else {
            startForeground(22, notification)
        }
    }

    companion object {
        const val ACTION_START = "family.reinagel.joyce.CAPTURE_START"
        const val ACTION_STOP = "family.reinagel.joyce.CAPTURE_STOP"
        const val EXTRA_RESULT_CODE = "resultCode"
        const val EXTRA_DATA = "data"
        var instance: CaptureService? = null
        var running = false
        var whenReady: (() -> Unit)? = null
        var whenFailed: (() -> Unit)? = null

        fun fireReady() {
            val listener = whenReady
            whenReady = null
            whenFailed = null
            listener?.invoke()
        }

        fun fireFailed() {
            val listener = whenFailed
            whenReady = null
            whenFailed = null
            listener?.invoke()
        }

        private fun imageToBitmap(image: Image): Bitmap? {
            val plane = image.planes.firstOrNull() ?: return null
            val buffer = plane.buffer
            val pixelStride = plane.pixelStride
            val rowStride = plane.rowStride
            val width = image.width
            val height = image.height
            if (pixelStride <= 0) return null
            val paddedWidth = width + (rowStride - pixelStride * width) / pixelStride
            val bitmap = Bitmap.createBitmap(paddedWidth.coerceAtLeast(width), height, Bitmap.Config.ARGB_8888)
            buffer.rewind()
            bitmap.copyPixelsFromBuffer(buffer)
            if (paddedWidth == width) return bitmap
            val cropped = Bitmap.createBitmap(bitmap, 0, 0, width, height)
            bitmap.recycle()
            return cropped
        }

        private fun looksBlank(bitmap: Bitmap): Boolean {
            val points = listOf(
                bitmap.width / 2 to bitmap.height / 2,
                bitmap.width / 4 to bitmap.height / 4,
                3 * bitmap.width / 4 to bitmap.height / 4,
                bitmap.width / 4 to 3 * bitmap.height / 4
            )
            return points.all { (x, y) ->
                val color = bitmap.getPixel(x.coerceIn(0, bitmap.width - 1), y.coerceIn(0, bitmap.height - 1))
                Color.red(color) < 8 && Color.green(color) < 8 && Color.blue(color) < 8
            }
        }
    }
}
