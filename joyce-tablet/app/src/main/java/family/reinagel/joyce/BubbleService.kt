package family.reinagel.joyce

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.ActivityOptions
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Outline
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.widget.Toast
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewOutlineProvider
import android.view.WindowManager
import android.widget.ImageView
import androidx.core.app.NotificationCompat
import kotlin.math.abs

class BubbleService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var windowManager: WindowManager
    private var bubble: ImageView? = null
    private var params: WindowManager.LayoutParams? = null
    private var panel: HelpPanel? = null
    private var captureBusy = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
        running = true
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        startAsForeground()
        addBubble()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_HIDE -> setBubbleVisible(false)
            ACTION_SHOW -> setBubbleVisible(true)
            else -> if (bubble == null) addBubble()
        }
        return START_STICKY
    }

    override fun onDestroy() {
        panel?.dismiss(sendLeft = true)
        panel = null
        bubble?.let {
            try {
                windowManager.removeView(it)
            } catch (_: Exception) {
            }
        }
        bubble = null
        if (instance == this) instance = null
        running = false
        super.onDestroy()
    }

    fun setBubbleVisible(visible: Boolean) {
        bubble?.visibility = if (visible) View.VISIBLE else View.GONE
    }

    fun showHelp(bitmap: android.graphics.Bitmap) {
        captureBusy = false
        if (panel?.isShowing == true) {
            bitmap.recycle()
            return
        }
        val help = HelpPanel(this) {
            panel = null
            setBubbleVisible(true)
        }
        panel = help
        help.show(bitmap)
        if (help.isShowing) setBubbleVisible(false)
    }

    private fun onBubbleTap() {
        if (panel?.isShowing == true || captureBusy) return
        val eyes = JoyceAccessibilityService.instance
        if (eyes != null) {
            if (CaptureService.running) {
                startService(Intent(this, CaptureService::class.java).setAction(CaptureService.ACTION_STOP))
            }
            captureBusy = true
            setBubbleVisible(false)
            handler.postDelayed({
                val service = JoyceAccessibilityService.instance
                if (service == null) {
                    captureBusy = false
                    setBubbleVisible(true)
                    askToShare()
                    return@postDelayed
                }
                service.capture { bitmap ->
                    captureBusy = false
                    if (bitmap == null) {
                        setBubbleVisible(true)
                        Toast.makeText(this, "Joyce couldn't see the screen. Try again.", Toast.LENGTH_LONG).show()
                    } else {
                        showHelp(bitmap)
                    }
                }
            }, 150)
            return
        }
        val capture = CaptureService.instance
        if (capture?.isReady == true) {
            captureBusy = true
            handler.postDelayed({
                capture.grab { bitmap ->
                    captureBusy = false
                    if (bitmap == null) {
                        setBubbleVisible(true)
                        Toast.makeText(this, "Joyce couldn't see the screen. Try again.", Toast.LENGTH_LONG).show()
                    } else {
                        showHelp(bitmap)
                    }
                }
            }, 200)
            return
        }
        askToShare()
    }

    private fun askToShare() {
        try {
            val intent = Intent(this, CaptureConsentActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            val options = ActivityOptions.makeCustomAnimation(this, 0, 0)
            if (Build.VERSION.SDK_INT >= 34) {
                options.pendingIntentBackgroundActivityStartMode =
                    ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED
            }
            startActivity(intent, options.toBundle())
        } catch (_: Exception) {
            Toast.makeText(this, "Ask a grown-up to open Joyce.", Toast.LENGTH_LONG).show()
        }
    }

    private fun addBubble() {
        if (bubble != null) return
        if (!android.provider.Settings.canDrawOverlays(this)) {
            stopSelf()
            return
        }
        val size = (80 * resources.displayMetrics.density).toInt()
        val view = ImageView(this).apply {
            setImageResource(R.drawable.joyce_avatar)
            scaleType = ImageView.ScaleType.FIT_CENTER
            contentDescription = "Ask Joyce"
            outlineProvider = object : ViewOutlineProvider() {
                override fun getOutline(v: View, outline: Outline) {
                    outline.setOval(0, 0, v.width, v.height)
                }
            }
            clipToOutline = true
            elevation = 6 * resources.displayMetrics.density
        }
        val layout = WindowManager.LayoutParams(
            size,
            size,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            val savedX = Prefs.bubbleX(this@BubbleService)
            val savedY = Prefs.bubbleY(this@BubbleService)
            x = if (savedX == Int.MIN_VALUE) resources.displayMetrics.widthPixels - size - 24 else savedX
            y = if (savedY == Int.MIN_VALUE) resources.displayMetrics.heightPixels / 2 else savedY
        }
        view.setOnTouchListener(dragListener(layout, view))
        try {
            windowManager.addView(view, layout)
        } catch (_: Exception) {
            stopSelf()
            return
        }
        bubble = view
        params = layout
    }

    private fun dragListener(layout: WindowManager.LayoutParams, view: View): View.OnTouchListener {
        var downX = 0f
        var downY = 0f
        var startX = 0
        var startY = 0
        var moved = false
        val slop = 12 * resources.displayMetrics.density
        return View.OnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    downX = event.rawX
                    downY = event.rawY
                    startX = layout.x
                    startY = layout.y
                    moved = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - downX).toInt()
                    val dy = (event.rawY - downY).toInt()
                    if (abs(dx) > slop || abs(dy) > slop) moved = true
                    layout.x = startX + dx
                    layout.y = startY + dy
                    try {
                        windowManager.updateViewLayout(view, layout)
                    } catch (_: Exception) {
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (moved) Prefs.saveBubble(this, layout.x, layout.y) else onBubbleTap()
                    true
                }
                else -> false
            }
        }
    }

    private fun startAsForeground() {
        val channelId = "joyce-bubble"
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) {
            manager.createNotificationChannel(
                NotificationChannel(channelId, "Joyce button", NotificationManager.IMPORTANCE_LOW)
            )
        }
        val open = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.drawable.ic_stat_joyce)
            .setContentTitle("Joyce is nearby")
            .setContentText("Tap Joyce to ask for help.")
            .setContentIntent(open)
            .setOngoing(true)
            .build()
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(21, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(21, notification)
        }
    }

    companion object {
        const val ACTION_SHOW = "family.reinagel.joyce.SHOW"
        const val ACTION_HIDE = "family.reinagel.joyce.HIDE"
        var instance: BubbleService? = null
        var running = false

        fun reveal() {
            instance?.setBubbleVisible(true)
        }
    }
}
