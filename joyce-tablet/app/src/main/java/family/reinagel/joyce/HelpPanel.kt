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
import android.text.method.ScrollingMovementMethod
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
    private val transcript = StringBuilder()
    private var noise = 600
    private var heardSpeech = false
    private var speechStarted = 0L
    private var quietStarted = 0L
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
        liftAboveSystemBars()
        binding.hint.movementMethod = ScrollingMovementMethod.getInstance()
        binding.mark.onMarked = { if (!canHear()) binding.ask.isEnabled = true }
        binding.ask.isEnabled = false
        if (canHear()) binding.ask.visibility = android.view.View.GONE
        binding.ask.setOnClickListener { ask(followUp = !sessionId.isNullOrBlank()) }
        binding.gotIt.setOnClickListener { finishOutcome("got-it") }
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
        binding.gotIt.visibility = android.view.View.GONE
        val question = heard.trim()
        val audio = if (question.isEmpty()) readAudio() else null
        if (canHear() && question.isEmpty() && audio == null) {
            sending = false
            binding.mark.locked = false
            beginListening()
            return
        }
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
        binding.hint.visibility = android.view.View.VISIBLE
        if (result.error != null) {
            binding.hint.text = result.error
            binding.mark.locked = false
            speak(result.error, null)
            if (sessionId.isNullOrBlank()) {
                if (!canHear()) {
                    binding.ask.visibility = android.view.View.VISIBLE
                    binding.ask.isEnabled = binding.mark.mark != null
                    binding.ask.text = context.getString(R.string.ask_joyce)
                }
                binding.gotIt.visibility = android.view.View.GONE
            } else {
                binding.gotIt.visibility = android.view.View.VISIBLE
                if (canHear()) beginListening() else {
                    binding.ask.visibility = android.view.View.VISIBLE
                    binding.ask.isEnabled = true
                    binding.ask.text = context.getString(R.string.ask_joyce)
                }
            }
            return
        }
        sessionId = result.sessionId
        hintsUsed = result.hintsUsed
        revealed = result.revealed
        if (result.question.isNotBlank()) addLine("You", result.question)
        addLine("Joyce", result.say)
        binding.heard.visibility = android.view.View.VISIBLE
        binding.gotIt.visibility = android.view.View.VISIBLE
        binding.ask.visibility = if (canHear()) android.view.View.GONE else android.view.View.VISIBLE
        if (result.revealed) {
            binding.mark.locked = true
            binding.heard.text = "You got there."
        } else {
            binding.mark.locked = false
            if (!canHear()) {
                binding.ask.isEnabled = true
                binding.ask.text = context.getString(R.string.ask_joyce)
            }
            binding.heard.text = if (canHear()) "Joyce is listening." else "Tap Ask Joyce when you are ready."
        }
        if (result.audioBase64.isBlank()) {
            if (!result.revealed) beginListening()
        } else {
            play(result.audioBase64, thenClose = false, thenListen = !result.revealed)
        }
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
        handler.removeCallbacks(listenPoll)
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

    private fun addLine(who: String, text: String) {
        if (transcript.isNotEmpty()) transcript.append("\n\n")
        transcript.append(who).append(": ").append(text)
        binding.hint.text = transcript.toString()
    }

    private fun startVoice() {
        val site = Prefs.site(context)
        val key = Prefs.key(context)
        thread {
            val audio = JoyceClient.speak(site, key, "Tap the word, then tell me what you see.")
            handler.post {
                if (closed) return@post
                if (audio.isBlank()) beginListening() else play(audio, thenClose = false, thenListen = true)
            }
        }
    }

    private fun canHear() = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    private val listenPoll = Runnable { pollSound() }

    private fun beginListening() {
        if (closed || revealed || sending) return
        if (!canHear()) return
        stopListening()
        audioFile?.delete()
        noise = 600
        heardSpeech = false
        speechStarted = 0L
        quietStarted = 0L
        listen = true
        startRecorder()
        binding.heard.text = if (binding.mark.mark == null) "Tap the word, then just tell Joyce." else "Joyce is listening."
        handler.postDelayed(listenPoll, 160)
    }

    private fun pollSound() {
        if (!listen || closed || sending || revealed) return
        val amp = try {
            recorder?.maxAmplitude ?: 0
        } catch (_: Exception) {
            0
        }
        val now = android.os.SystemClock.uptimeMillis()
        val loud = amp > max(noise * 3, 1200)
        if (!heardSpeech) {
            if (loud) {
                heardSpeech = true
                speechStarted = now
                quietStarted = 0L
                binding.heard.text = "Joyce hears you."
            } else if (amp in 1..4999) {
                noise = ((noise * 7 + amp) / 8).coerceAtLeast(300)
            }
        } else if (!loud) {
            if (quietStarted == 0L) quietStarted = now
            if (now - quietStarted > 900 && now - speechStarted > 450) {
                if (binding.mark.mark == null) {
                    binding.heard.text = "Tap the word, then just tell Joyce."
                    beginListening()
                } else {
                    ask(followUp = !sessionId.isNullOrBlank())
                }
                return
            }
        } else {
            quietStarted = 0L
        }
        handler.postDelayed(listenPoll, 120)
    }

    private fun speak(text: String, audioBase64: String?) {
        if (audioBase64.isNullOrBlank()) return
        play(audioBase64, thenClose = false, thenListen = false)
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
                    play(audio, thenClose = true, thenListen = false)
                }
            }
        }
    }

    private fun play(audioBase64: String, thenClose: Boolean, thenListen: Boolean) {
        stopListening()
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
                if (thenListen) handler.postDelayed({ beginListening() }, 300)
                if (thenClose && !closed) dismiss(sendLeft = false)
            }
            mp.setOnErrorListener { _, _, _ ->
                if (thenListen) beginListening()
                if (thenClose && !closed) handler.post { if (!closed) dismiss(sendLeft = false) }
                true
            }
            mp.prepareAsync()
            mp.setOnPreparedListener { if (!closed) it.start() }
            player = mp
        } catch (_: Exception) {
            if (thenListen) beginListening()
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
