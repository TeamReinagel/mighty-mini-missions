package family.reinagel.joyce

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.PixelFormat
import android.media.MediaRecorder
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowInsets
import android.view.WindowManager
import android.media.AudioAttributes
import android.widget.Button
import android.widget.Toast
import androidx.core.content.ContextCompat
import family.reinagel.joyce.databinding.ActivityHelpBinding
import java.io.File
import kotlin.concurrent.thread
import kotlin.math.max

/**
 * The help screen is an overlay, not an activity. Android will dismiss an activity
 * opened from the floating button, which sent the child back to the other app.
 */
class HelpPanel(
    private val context: Context,
    private val onClosed: () -> Unit
) {
    private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private val handler = Handler(Looper.getMainLooper())
    private val binding = ActivityHelpBinding.inflate(LayoutInflater.from(context))
    private var bitmap: Bitmap? = null
    private var player: MediaPlayer? = null
    private var recorder: MediaRecorder? = null
    private var audioFile: File? = null
    private var heard = ""
    private var listen = false
    private var sessionId: String? = null
    private var hintsUsed = 0
    private var revealed = false
    private var outcomeSent = false
    private var sending = false
    private var showing = false
    private var closed = false

    val isShowing: Boolean get() = showing

    fun show(image: Bitmap) {
        if (showing) return
        bitmap = image
        showing = true
        paint(binding.ask)
        paint(binding.gotIt)
        paint(binding.stuck)
        binding.back.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#E4DDD0"))
        binding.back.setTextColor(Color.parseColor("#243036"))
        liftAboveSystemBars()
        binding.mark.onMarked = { binding.ask.isEnabled = true }
        binding.ask.isEnabled = false
        binding.ask.setOnClickListener { ask(followUp = false) }
        binding.gotIt.setOnClickListener { finishOutcome("got-it") }
        binding.stuck.setOnClickListener { onStuck() }
        binding.back.setOnClickListener { dismiss(sendLeft = true) }
        binding.mark.image = image
        try {
            windowManager.addView(binding.root, layoutParams())
            binding.root.addOnAttachStateChangeListener(object : View.OnAttachStateChangeListener {
                override fun onViewAttachedToWindow(v: View) {}
                override fun onViewDetachedFromWindow(v: View) {
                    if (!closed) restoreAfterSystemClose()
                }
            })
        } catch (_: Exception) {
            showing = false
            image.recycle()
            bitmap = null
            Toast.makeText(context, "Ask a grown-up to open Joyce.", Toast.LENGTH_LONG).show()
            onClosed()
            return
        }
        startVoice()
    }

    fun dismiss(sendLeft: Boolean) {
        if (closed) return
        closed = true
        showing = false
        if (sendLeft && !outcomeSent && !sessionId.isNullOrBlank()) {
            outcomeSent = true
            val id = sessionId!!
            val site = Prefs.site(context)
            val key = Prefs.key(context)
            thread { JoyceClient.outcome(site, key, id, "left") }
        }
        listen = false
        stopListening()
        releasePlayer()
        binding.mark.image = null
        val shown = bitmap
        bitmap = null
        if (shown != null && !shown.isRecycled) shown.recycle()
        try {
            windowManager.removeView(binding.root)
        } catch (_: Exception) {
        }
        onClosed()
    }

    private fun layoutParams(): WindowManager.LayoutParams {
        return WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            PixelFormat.OPAQUE
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            if (Build.VERSION.SDK_INT >= 28) {
                layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }
    }

    private fun liftAboveSystemBars() {
        val bottom = max(systemInset(bottom = true), (72 * context.resources.displayMetrics.density).toInt())
        val top = systemInset(bottom = false)
        val side = (16 * context.resources.displayMetrics.density).toInt()
        binding.bar.setPadding(side, side, side, side + bottom)
        binding.mark.setPadding(0, top, 0, 0)
    }

    private fun systemInset(bottom: Boolean): Int {
        if (Build.VERSION.SDK_INT >= 30) {
            val insets = windowManager.currentWindowMetrics.windowInsets
                .getInsetsIgnoringVisibility(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
            return if (bottom) insets.bottom else insets.top
        }
        val name = if (bottom) "navigation_bar_height" else "status_bar_height"
        val id = context.resources.getIdentifier(name, "dimen", "android")
        return if (id > 0) context.resources.getDimensionPixelSize(id) else 0
    }

    private fun paint(button: Button) {
        button.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#2F6F6A"))
        button.setTextColor(Color.WHITE)
    }

    private fun ask(followUp: Boolean) {
        if (sending || revealed) return
        val picture = bitmap ?: return
        val mark = binding.mark.mark ?: return
        sending = true
        binding.mark.locked = true
        listen = false
        stopListening()
        binding.ask.isEnabled = false
        binding.ask.text = "Joyce is thinking"
        binding.heard.text = "Joyce is thinking"
        binding.outcome.visibility = android.view.View.GONE
        val question = heard.trim()
        val audio = if (question.isEmpty()) readAudio() else null
        val marked = Pictures.marked(picture, mark)
        val crop = Pictures.crop(picture, mark)
        val imageB64 = Pictures.jpeg(marked, 1280, 60)
        val cropB64 = Pictures.jpeg(crop, 1200, 80)
        marked.recycle()
        crop.recycle()
        val site = Prefs.site(context)
        val key = Prefs.key(context)
        val kid = Prefs.kid(context)
        val existing = if (followUp) sessionId else null
        thread {
            val result = JoyceClient.help(site, key, kid, imageB64, cropB64, question, audio, existing, followUp)
            handler.post {
                sending = false
                if (closed) {
                    if (result.sessionId.isNotBlank() && !outcomeSent) {
                        outcomeSent = true
                        thread { JoyceClient.outcome(site, key, result.sessionId, "left") }
                    }
                    return@post
                }
                showHint(result)
            }
        }
    }

    private fun showHint(result: JoyceClient.HintResult) {
        binding.ask.visibility = android.view.View.GONE
        binding.hint.visibility = android.view.View.VISIBLE
        if (result.error != null) {
            binding.hint.text = result.error
            binding.mark.locked = false
            speak(result.error, null)
            if (sessionId.isNullOrBlank()) {
                binding.ask.visibility = android.view.View.VISIBLE
                binding.ask.isEnabled = binding.mark.mark != null
                binding.ask.text = context.getString(R.string.ask_joyce)
                binding.outcome.visibility = android.view.View.GONE
            } else {
                binding.outcome.visibility = android.view.View.VISIBLE
            }
            return
        }
        sessionId = result.sessionId
        hintsUsed = result.hintsUsed
        revealed = result.revealed
        binding.hint.text = result.say
        binding.heard.visibility = android.view.View.GONE
        binding.outcome.visibility = android.view.View.VISIBLE
        if (result.revealed) {
            binding.stuck.visibility = android.view.View.GONE
            binding.mark.locked = true
        } else {
            binding.mark.locked = false
            if (hintsUsed >= 2) binding.stuck.text = context.getString(R.string.tell_me)
        }
        speak(result.say, result.audioBase64)
    }

    private fun onStuck() {
        if (revealed) return
        ask(followUp = true)
    }

    private fun finishOutcome(outcome: String) {
        if (outcomeSent) {
            dismiss(sendLeft = false)
            return
        }
        outcomeSent = true
        val id = sessionId
        if (!id.isNullOrBlank()) {
            val site = Prefs.site(context)
            val key = Prefs.key(context)
            thread { JoyceClient.outcome(site, key, id, outcome) }
        }
        val line = when (outcome) {
            "got-it" -> "You did it."
            else -> ""
        }
        if (line.isEmpty()) dismiss(sendLeft = false) else speakThenClose(line)
    }

    private fun startRecorder() {
        if (recorder != null || !listen || closed) return
        val file = File(context.cacheDir, "joyce-question.m4a")
        audioFile = file
        try {
            @Suppress("DEPRECATION")
            val rec = MediaRecorder()
            rec.setAudioSource(MediaRecorder.AudioSource.MIC)
            rec.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            rec.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            rec.setOutputFile(file.absolutePath)
            rec.prepare()
            rec.start()
            recorder = rec
        } catch (_: Exception) {
            recorder = null
        }
    }

    private fun stopListening() {
        listen = false
        val rec = recorder
        recorder = null
        if (rec != null) {
            try {
                rec.stop()
            } catch (_: Exception) {
            }
            rec.release()
        }
    }

    private fun readAudio(): String? {
        val file = audioFile ?: return null
        if (!file.exists() || file.length() < 2000) return null
        return Base64.encodeToString(file.readBytes(), Base64.NO_WRAP)
    }

    private fun showHeard() {
        if (sending || closed) return
        binding.heard.text = if (heard.isBlank()) "Tap the word, or draw around the problem." else heard
    }

    private fun startVoice() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            listen = true
            startRecorder()
            binding.heard.text = "Joyce is listening. Tap the word, then tap Ask Joyce."
        }
        val site = Prefs.site(context)
        val key = Prefs.key(context)
        thread {
            val audio = JoyceClient.speak(site, key, "Tap the word, or draw around the problem. Then tell me what you need.")
            handler.post { if (!closed) speak("", audio) }
        }
    }

    private fun speak(text: String, audioBase64: String?) {
        if (audioBase64.isNullOrBlank()) return
        play(audioBase64, thenClose = false)
    }

    private fun speakThenClose(line: String) {
        val site = Prefs.site(context)
        val key = Prefs.key(context)
        thread {
            val audio = JoyceClient.speak(site, key, line)
            handler.post {
                if (closed) return@post
                if (audio.isBlank()) {
                    handler.postDelayed({ if (!closed) dismiss(sendLeft = false) }, 1600)
                } else {
                    play(audio, thenClose = true)
                }
            }
        }
    }

    private fun play(audioBase64: String, thenClose: Boolean) {
        try {
            val file = File(context.cacheDir, "joyce-say.mp3")
            file.writeBytes(Base64.decode(audioBase64, Base64.DEFAULT))
            releasePlayer()
            val mp = MediaPlayer()
            mp.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            mp.setDataSource(file.absolutePath)
            mp.setOnCompletionListener {
                if (thenClose && !closed) dismiss(sendLeft = false)
            }
            mp.setOnErrorListener { _, _, _ ->
                if (thenClose && !closed) handler.post { if (!closed) dismiss(sendLeft = false) }
                true
            }
            mp.prepareAsync()
            mp.setOnPreparedListener { if (!closed) it.start() }
            player = mp
        } catch (_: Exception) {
            if (thenClose && !closed) dismiss(sendLeft = false)
        }
    }

    private fun releasePlayer() {
        try {
            player?.release()
        } catch (_: Exception) {
        }
        player = null
    }

    private fun restoreAfterSystemClose() {
        closed = true
        showing = false
        listen = false
        stopListening()
        releasePlayer()
        val shown = bitmap
        bitmap = null
        if (shown != null && !shown.isRecycled) shown.recycle()
        onClosed()
    }
}
