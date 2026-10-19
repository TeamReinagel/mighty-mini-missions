package family.reinagel.joyce

import android.content.Intent
import android.media.projection.MediaProjectionConfig
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

/** Asks Android for screen sharing, then hands the picture to the overlay. */
class CaptureConsentActivity : AppCompatActivity() {
    private val handler = Handler(Looper.getMainLooper())
    private var started = false

    private val consent = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val data = result.data
        if (result.resultCode != RESULT_OK || data == null) {
            BubbleService.reveal()
            Toast.makeText(applicationContext, "Joyce needs screen sharing to help.", Toast.LENGTH_LONG).show()
            finish()
            return@registerForActivityResult
        }
        CaptureService.whenReady = { grabAfterReturningToTheApp() }
        CaptureService.whenFailed = {
            BubbleService.reveal()
            Toast.makeText(applicationContext, "Joyce couldn't see the screen. Try again.", Toast.LENGTH_LONG).show()
            finish()
        }
        val service = Intent(this, CaptureService::class.java).apply {
            action = CaptureService.ACTION_START
            putExtra(CaptureService.EXTRA_RESULT_CODE, result.resultCode)
            putExtra(CaptureService.EXTRA_DATA, data)
        }
        ContextCompat.startForegroundService(this, service)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (started) return
        started = true
        val manager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val intent = if (Build.VERSION.SDK_INT >= 34) {
            manager.createScreenCaptureIntent(MediaProjectionConfig.createConfigForDefaultDisplay())
        } else {
            manager.createScreenCaptureIntent()
        }
        consent.launch(intent)
    }

    private fun grabAfterReturningToTheApp() {
        finish()
        handler.postDelayed({
            val capture = CaptureService.instance
            if (capture == null || !capture.isReady) {
                BubbleService.reveal()
                Toast.makeText(applicationContext, "Joyce couldn't see the screen. Try again.", Toast.LENGTH_LONG).show()
                return@postDelayed
            }
            capture.grab { bitmap ->
                val host = BubbleService.instance
                if (bitmap == null || host == null) {
                    bitmap?.recycle()
                    BubbleService.reveal()
                    Toast.makeText(applicationContext, "Joyce couldn't see the screen. Try again.", Toast.LENGTH_LONG).show()
                } else {
                    host.showHelp(bitmap)
                }
            }
        }, 700)
    }
}
