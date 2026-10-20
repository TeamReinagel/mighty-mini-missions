package family.reinagel.joyce

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Outline
import android.graphics.PixelFormat
import android.media.MediaRecorder
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.text.method.ScrollingMovementMethod
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewOutlineProvider
import android.view.WindowInsets
import android.view.WindowManager
import android.media.AudioAttributes
import android.widget.Button
import android.widget.Toast
import android.widget.LinearLayout
import android.media.AudioManager
import android.media.AudioFocusRequest
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale
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
    private var earPulse: ObjectAnimator? = null
    private var thinkStep = 0
    private var sessionId: String? = null
    private var hintsUsed = 0
    private var revealed = false
    private var outcomeSent = false
    private var sending = false
    private var showing = false
    private var closed = false
    private var recordingStarted = 0L
    private var voiceGeneration = 0
    private var lastSay = ""
    private var lastAudio = ""
    private var speech: TextToSpeech? = null
    private var speechReady = false
    private var speechDone: (() -> Unit)? = null
    private var playbackFile: File? = null
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private var focusRequest: AudioFocusRequest? = null

    val isShowing: Boolean get() = showing

    fun show(image: Bitmap) {
        if (showing) return
        bitmap = image
        showing = true
        paint(binding.ask)
        liftAboveSystemBars()
        binding.hint.movementMethod = ScrollingMovementMethod.getInstance()
        binding.mark.onMarked = {
            // A new mark means a new question, even on the same frozen screen.
            voiceGeneration++
            stopListening()
            releasePlayer()
            speech?.stop()
            speechDone = null
            if (!sessionId.isNullOrBlank() && !outcomeSent) {
                val oldId = sessionId!!
                thread { JoyceClient.outcome(Prefs.site(context), Prefs.key(context), oldId, "left") }
            }
            sessionId = null
            revealed = false
            outcomeSent = false
            hintsUsed = 0
            heard = ""
            transcript.clear()
            lastSay = ""
            lastAudio = ""
            binding.hint.visibility = View.GONE
            binding.gotIt.visibility = View.GONE
            binding.replay.visibility = View.GONE
            binding.ask.isEnabled = true
            binding.ask.text = context.getString(R.string.ask_joyce)
            beginListening()
        }
        binding.ask.isEnabled = false
        binding.ask.visibility = View.VISIBLE
        binding.ask.setOnClickListener { ask(followUp = !sessionId.isNullOrBlank()) }
        binding.gotIt.setOnClickListener { finishOutcome("got-it") }
        binding.back.setOnClickListener { dismiss(sendLeft = true) }
        binding.replay.setOnClickListener {
            voiceGeneration++
            stopListening()
            speakLine(lastSay, lastAudio, thenListen = !revealed)
        }
        binding.root.addOnLayoutChangeListener { _, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom ->
            if (right - left != oldRight - oldLeft || bottom - top != oldBottom - oldTop) fitPanel(right - left, bottom - top)
        }
        initSpeech()
        requestAudioFocus()
        binding.face.outlineProvider = object : ViewOutlineProvider() {
            override fun getOutline(view: View, outline: Outline) {
                outline.setOval(0, 0, view.width, view.height)
            }
        }
        binding.face.clipToOutline = true
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
            dismiss(sendLeft = false)
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
        voiceGeneration++
        listen = false
        stopListening()
        releasePlayer()
        speech?.stop()
        speech?.shutdown()
        speech = null
        audioFile?.delete()
        handler.removeCallbacksAndMessages(null)
        focusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
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
        val bottom = max(systemInset(bottom = true), (8 * context.resources.displayMetrics.density).toInt())
        val top = systemInset(bottom = false)
        val side = (8 * context.resources.displayMetrics.density).toInt()
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
        voiceGeneration++
        releasePlayer()
        speech?.stop()
        sending = true
        binding.replay.isEnabled = false
        binding.mark.locked = true
        listen = false
        stopListening()
        binding.ask.isEnabled = false
        binding.ask.text = "Joyce is thinking"
        binding.heard.text = "Joyce is thinking"
        binding.gotIt.visibility = android.view.View.GONE
        val question = heard.trim()
        val audio = if (question.isEmpty() && heardSpeech) readAudio() else null
        showThinking()
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
        hideThinking()
        binding.mark.locked = false
        binding.ask.visibility = View.VISIBLE
        binding.replay.isEnabled = true
        binding.hint.visibility = View.VISIBLE
        if (result.error != null) {
            binding.hint.text = result.error
            binding.ask.text = "Try again"
            binding.ask.isEnabled = binding.mark.mark != null
            binding.heard.text = "You can tap Ask Joyce or tell me again."
            if (result.resetSession) sessionId = null
            speakLine(result.error, "", thenListen = true)
            return
        }
        sessionId = result.sessionId.takeIf { result.saved && it.isNotBlank() }
        hintsUsed = result.hintsUsed
        revealed = result.revealed
        lastSay = result.spokenText.ifBlank { result.say }
        lastAudio = result.audioBase64
        if (result.question.isNotBlank()) addLine("You", result.question)
        addLine("Joyce", result.say)
        binding.gotIt.visibility = View.VISIBLE
        binding.replay.visibility = View.VISIBLE
        binding.ask.isEnabled = !revealed
        binding.ask.text = context.getString(R.string.ask_joyce)
        binding.heard.text = if (revealed) "Tap the check to go back, or mark a new question." else "Your turn. Talk or tap Ask Joyce."
        speakLine(lastSay, result.audioBase64, thenListen = !revealed)
    }

    private fun finishOutcome(outcome: String) {
        if (!outcomeSent) {
            outcomeSent = true
            val id = sessionId
            if (!id.isNullOrBlank()) {
                val site = Prefs.site(context)
                val key = Prefs.key(context)
                thread { JoyceClient.outcome(site, key, id, outcome) }
            }
        }
        // Returning to the learning app must not wait for a network speech request.
        dismiss(sendLeft = false)
    }

    private fun startRecorder() {
        if (recorder != null || !listen || closed) return
        audioFile?.delete()
        val file = File.createTempFile("joyce-question-", ".m4a", context.cacheDir)
        audioFile = file
        @Suppress("DEPRECATION")
        val rec = MediaRecorder()
        try {
            rec.setAudioSource(MediaRecorder.AudioSource.MIC)
            rec.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            rec.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            rec.setAudioSamplingRate(16000)
            rec.setAudioEncodingBitRate(64000)
            rec.setMaxDuration(20000)
            rec.setOnInfoListener { _, what, _ ->
                if (what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_DURATION_REACHED) handler.post { endListeningWindow() }
            }
            rec.setOutputFile(file.absolutePath)
            rec.prepare()
            rec.start()
            recorder = rec
        } catch (_: Exception) {
            try { rec.release() } catch (_: Exception) {}
            recorder = null
            file.delete()
        }
    }

    private fun stopListening() {
        listen = false
        hideListening()
        hideThinking()
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
        if (!file.exists() || file.length() < 2000 || file.length() > 1_400_000) return null
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
        // A local greeting avoids making every help session wait on the network.
        speakLine("Tap a word or circle a problem. Then talk, or tap Ask Joyce.", "", thenListen = true)
    }

    private fun canHear() = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    private val listenPoll = Runnable { pollSound() }

    private fun beginListening() {
        if (closed || revealed || sending) return
        binding.ask.isEnabled = binding.mark.mark != null
        binding.ask.text = context.getString(R.string.ask_joyce)
        if (!canHear()) {
            binding.heard.text = "Mark your question, then tap Ask Joyce."
            return
        }
        stopListening()
        audioFile?.delete()
        noise = 600
        heardSpeech = false
        speechStarted = 0L
        quietStarted = 0L
        listen = true
        recordingStarted = android.os.SystemClock.uptimeMillis()
        startRecorder()
        if (recorder == null) {
            listen = false
            binding.heard.text = "Tap Ask Joyce. The microphone is busy."
            return
        }
        showListening(hearing = false)
        binding.heard.text = if (binding.mark.mark == null) "Tap the word, then just tell Joyce." else "Joyce is listening."
        handler.postDelayed(listenPoll, 160)
    }

    private val thinkTick: Runnable = Runnable {
        val dots = listOf(binding.dot1, binding.dot2, binding.dot3)
        dots.forEachIndexed { index, dot ->
            dot.alpha = if (index == thinkStep) 1f else 0.25f
        }
        thinkStep = (thinkStep + 1) % dots.size
        handler.postDelayed(thinkTick, 350)
    }

    private fun showThinking() {
        earPulse?.cancel()
        binding.ear.visibility = View.GONE
        binding.status.visibility = View.VISIBLE
        binding.thinking.visibility = View.VISIBLE
        handler.removeCallbacks(thinkTick)
        thinkStep = 0
        handler.post(thinkTick)
    }

    private fun hideThinking() {
        handler.removeCallbacks(thinkTick)
        binding.thinking.visibility = View.GONE
        if (binding.ear.visibility != View.VISIBLE) binding.status.visibility = View.GONE
    }

    private fun showListening(hearing: Boolean) {
        hideThinking()
        binding.status.visibility = View.VISIBLE
        binding.ear.visibility = View.VISIBLE
        binding.ear.setImageResource(if (hearing) R.drawable.ic_ear_waves else R.drawable.ic_ear)
        binding.ear.contentDescription = if (hearing) "Joyce hears you" else context.getString(R.string.listening)
        if (hearing) {
            earPulse?.cancel()
            binding.ear.alpha = 1f
            return
        }
        if (earPulse?.isRunning == true) return
        binding.ear.alpha = 1f
        earPulse = ObjectAnimator.ofFloat(binding.ear, View.ALPHA, 1f, 0.35f).apply {
            duration = 650
            repeatMode = ValueAnimator.REVERSE
            repeatCount = ValueAnimator.INFINITE
            start()
        }
    }

    private fun hideListening() {
        earPulse?.cancel()
        earPulse = null
        binding.ear.alpha = 1f
        binding.ear.visibility = View.GONE
        if (binding.thinking.visibility != View.VISIBLE) binding.status.visibility = View.GONE
    }

    private fun pollSound() {
        if (!listen || closed || sending || revealed) return
        val amp = try {
            recorder?.maxAmplitude ?: 0
        } catch (_: Exception) {
            0
        }
        val now = android.os.SystemClock.uptimeMillis()
        if (now - recordingStarted >= 20000) {
            endListeningWindow()
            return
        }
        val loud = amp > max(noise * 3, 1200)
        if (!heardSpeech) {
            if (loud) {
                heardSpeech = true
                speechStarted = now
                quietStarted = 0L
                showListening(hearing = true)
                binding.heard.text = "Joyce hears you."
            } else if (amp in 1..4999) {
                noise = ((noise * 7 + amp) / 8).coerceAtLeast(300)
            }
        } else if (!loud) {
            if (quietStarted == 0L) quietStarted = now
            if (now - quietStarted > 1500 && now - speechStarted > 450) {
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

    private fun endListeningWindow() {
        if (!listen || closed || sending) return
        if (heardSpeech && binding.mark.mark != null) ask(followUp = !sessionId.isNullOrBlank())
        else {
            stopListening()
            audioFile?.delete()
            binding.heard.text = "Take your time. Tap Ask Joyce when you are ready."
            binding.ask.isEnabled = binding.mark.mark != null
        }
    }

    private fun requestAudioFocus() {
        val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
            .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
            .setOnAudioFocusChangeListener { change ->
                if (change < 0 && !closed) {
                    stopListening()
                    releasePlayer()
                    speech?.stop()
                    binding.heard.text = "Tap Ask Joyce when you are ready."
                }
            }.build()
        focusRequest = request
        audioManager.requestAudioFocus(request)
    }

    private fun initSpeech() {
        speech = TextToSpeech(context) { status ->
            handler.post {
                if (closed) return@post
                speechReady = status == TextToSpeech.SUCCESS
                if (speechReady) {
                    speech?.language = Locale.US
                    // Initialization is asynchronous. Speak the directions once ready,
                    // unless the child has already started their question.
                    if (voiceGeneration == 0 && binding.mark.mark == null && !sending) startVoice()
                }
            }
        }
        speech?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) {}
            override fun onDone(id: String?) { handler.post { if (!closed && id == voiceGeneration.toString()) { val done = speechDone; speechDone = null; done?.invoke() } } }
            @Deprecated("Legacy callback")
            override fun onError(id: String?) = onDone(id)
        })
    }

    private fun speakLine(text: String, audio: String, thenListen: Boolean) {
        if (closed) return
        stopListening()
        if (audio.isNotBlank()) { play(audio, text, thenListen); return }
        if (speechReady && text.isNotBlank()) {
            speechDone = { if (thenListen) beginListening() }
            val result = speech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, voiceGeneration.toString())
            if (result == TextToSpeech.SUCCESS) return
        }
        if (thenListen) beginListening()
    }

    private fun play(audioBase64: String, fallbackText: String, thenListen: Boolean) {
        hideThinking()
        stopListening()
        val generation = voiceGeneration
        fun fallback() {
            if (generation != voiceGeneration || closed) return
            releasePlayer()
            speakLine(fallbackText, "", thenListen)
        }
        try {
            releasePlayer()
            val file = File.createTempFile("joyce-say-", ".mp3", context.cacheDir)
            playbackFile = file
            file.writeBytes(Base64.decode(audioBase64, Base64.DEFAULT))
            val mp = MediaPlayer()
            mp.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            )
            mp.setDataSource(file.absolutePath)
            mp.setOnCompletionListener {
                if (thenListen) handler.postDelayed({ if (generation == voiceGeneration && !closed) beginListening() }, 300)
            }
            mp.setOnErrorListener { _, _, _ ->
                fallback()
                true
            }
            mp.setOnPreparedListener { if (!closed && generation == voiceGeneration) it.start() }
            player = mp
            mp.prepareAsync()
        } catch (_: Exception) {
            fallback()
        }
    }

    private fun releasePlayer() {
        try {
            player?.release()
        } catch (_: Exception) {
        }
        player = null
        playbackFile?.delete()
        playbackFile = null
    }

    private fun fitPanel(width: Int, height: Int) {
        val landscape = width > height
        binding.root.orientation = if (landscape) LinearLayout.HORIZONTAL else LinearLayout.VERTICAL
        binding.mark.layoutParams = LinearLayout.LayoutParams(if (landscape) 0 else -1, if (landscape) -1 else 0, 1f)
        val density = context.resources.displayMetrics.density
        val panelWidth = minOf((width * 0.43f).toInt(), (360 * density).toInt())
        val panelHeight = minOf((height * 0.48f).toInt(), (320 * density).toInt())
        binding.bar.layoutParams = LinearLayout.LayoutParams(if (landscape) panelWidth else -1, if (landscape) -1 else panelHeight)
        liftAboveSystemBars()
    }

    private fun restoreAfterSystemClose() {
        dismiss(sendLeft = true)
    }
}
