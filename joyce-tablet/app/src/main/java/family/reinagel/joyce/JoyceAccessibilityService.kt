package family.reinagel.joyce

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.os.Build
import android.provider.Settings
import android.view.Display
import android.view.accessibility.AccessibilityEvent
import androidx.core.content.ContextCompat

/** One-time screen access. Joyce takes a picture only when a child taps her. */
class JoyceAccessibilityService : AccessibilityService() {
    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) = Unit

    override fun onInterrupt() = Unit

    override fun onUnbind(intent: Intent?): Boolean {
        if (instance == this) instance = null
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        if (instance == this) instance = null
        super.onDestroy()
    }

    fun capture(onResult: (Bitmap?) -> Unit) {
        if (Build.VERSION.SDK_INT < 30) {
            onResult(null)
            return
        }
        takeScreenshot(
            Display.DEFAULT_DISPLAY,
            ContextCompat.getMainExecutor(this),
            object : TakeScreenshotCallback {
                override fun onSuccess(screenshot: ScreenshotResult) {
                    val buffer = screenshot.hardwareBuffer
                    try {
                        val hardware = Bitmap.wrapHardwareBuffer(buffer, screenshot.colorSpace)
                        val copy = hardware?.copy(Bitmap.Config.ARGB_8888, false)
                        hardware?.recycle()
                        onResult(copy)
                    } catch (_: Exception) {
                        onResult(null)
                    } finally {
                        try {
                            buffer.close()
                        } catch (_: Exception) {
                        }
                    }
                }

                override fun onFailure(errorCode: Int) {
                    onResult(null)
                }
            }
        )
    }

    companion object {
        var instance: JoyceAccessibilityService? = null

        fun enabled(context: Context): Boolean {
            val expected = ComponentName(context, JoyceAccessibilityService::class.java)
            val setting = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false
            return setting.split(':').any { ComponentName.unflattenFromString(it) == expected }
        }

        fun openSettings(context: Context) {
            val component = ComponentName(context, JoyceAccessibilityService::class.java).flattenToString()
            if (Build.VERSION.SDK_INT >= 33) {
                val details = Intent("android.settings.ACCESSIBILITY_DETAILS_SETTINGS").apply {
                    putExtra(Intent.EXTRA_COMPONENT_NAME, component)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                try {
                    context.startActivity(details)
                    return
                } catch (_: Exception) {
                }
            }
            context.startActivity(
                Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        }
    }
}
