package family.reinagel.joyce

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.media.MediaRecorder
import android.media.projection.MediaProjectionConfig
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Base64
import android.view.View
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import family.reinagel.joyce.databinding.ActivityHelpBinding
import java.io.File
import java.util.Locale
import kotlin.concurrent.thread

class HelpActivity : AppCompatActivity() {
    private lateinit var binding: ActivityHelpBinding
    private val handler = Handler(Looper.getMainLooper())
    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private var pendingSpeech: String? = null
    private var recognizer: SpeechRecognizer? = null
    private var recorder: MediaRecorder? = null
    private var audioFile: File? = null
    private var heard = ""
    private var listen = false
    private var sessionId: String? = null
    private var hintsUsed = 0
    private var outcomeSent = false
    private var sending = false
    private var imageShown = false
    private var captureStarted = false
    private var voiceStarted = false

    private val micPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) startListening()
    }

    private val consent = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val data = result.data
        if (result.resultCode != RESULT_OK || data == null) {
            Toast.makeText(this, "Joyce needs screen sharing to help.", Toast.LENGTH_LONG).show()
            finish()
            return@registerForActivityResult
        }
        CaptureService.whenReady = { grabAndShow(600) }
        CaptureService.whenFailed = { giveUp() }
        val service = Intent(this, CaptureService::class.java).apply {
            action = CaptureService.ACTION_START
            putExtra(CaptureService.EXTRA_RESULT_CODE, result.resultCode)
            putExtra(CaptureService.EXTRA_DATA, data)
        }
        ContextCompat.startForegroundService(this, service)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        HelpSession.open = true
        overridePendingTransition(0, 0)
        // Stay invisible until the picture is ready, so this screen is already open
        // and Android does not send the child back to the other app.
        setContentView(FrameLayout(this).apply { setBackgroundColor(Color.TRANSPARENT) })
        BubbleService.instance?.setBubbleVisible(false)
        HelpSession.onBitmap = { bitmap ->
            if (bitmap == null) giveUp() else showImage(bitmap)
        }
        val existing = HelpSession.bitmap
        if (existing != null && !existing.isRecycled) showImage(existing)
        else if (CaptureService.instance?.isReady != true) handler.post { beginCapture() }
    }

    override fun onDestroy() {
        if (isChangingConfigurations) {
            super.onDestroy()
            return
        }
        if (!outcomeSent && !sessionId.isNullOrBlank()) {
            outcomeSent = true
            val id = sessionId!!
            val site = Prefs.site(this)
            val key = Prefs.key(this)
            thread { JoyceClient.outcome(site, key, id, "left") }
        }
        HelpSession.open = false
        HelpSession.onBitmap = null
        BubbleService.reveal()
        listen = false
        stopListening()
        tts?.shutdown()
        tts = null
        if (::binding.isInitialized) binding.mark.image = null
        HelpSession.bitmap?.recycle()
        HelpSession.bitmap = null
        super.onDestroy()
    }

    private fun beginCapture() {
        if (captureStarted || imageShown || isFinishing) return
        captureStarted = true
        val manager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val intent = if (Build.VERSION.SDK_INT >= 34) {
            manager.createScreenCaptureIntent(MediaProjectionConfig.createConfigForDefaultDisplay())
        } else {
            manager.createScreenCaptureIntent()
        }
        consent.launch(intent)
    }

    private fun grabAndShow(delayMs: Long) {
        handler.postDelayed({
            if (imageShown || isFinishing) return@postDelayed
            val capture = CaptureService.instance
            if (capture == null || !capture.isReady) {
                giveUp()
                return@postDelayed
            }
            capture.grab { bitmap ->
                if (isFinishing) {
                    bitmap?.recycle()
                    return@grab
                }
                if (bitmap == null) giveUp() else showImage(bitmap)
            }
        }, delayMs)
    }

    private fun giveUp() {
        if (isFinishing) return
        Toast.makeText(this, "Joyce couldn't see the screen. Try again.", Toast.LENGTH_LONG).show()
        finish()
    }

    private fun showImage(bitmap: android.graphics.Bitmap) {
        if (isFinishing) return
        val previous = HelpSession.bitmap
        if (previous != null && previous !== bitmap && !previous.isRecycled) previous.recycle()
        HelpSession.bitmap = bitmap
        imageShown = true
        if (!::binding.isInitialized) {
            binding = ActivityHelpBinding.inflate(layoutInflater)
            setContentView(binding.root)
            binding.mark.onMarked = { binding.ask.isEnabled = true }
            binding.ask.isEnabled = false
            binding.ask.setOnClickListener { ask(followUp = false) }
            binding.gotIt.setOnClickListener { finishOutcome("got-it") }
            binding.stuck.setOnClickListener { onStuck() }
        }
        binding.mark.image = bitmap
        startVoice()
    }

    private fun startVoice() {
        if (voiceStarted) return
        voiceStarted = true
        tts = TextToSpeech(this) { status ->
            if (status != TextToSpeech.SUCCESS) return@TextToSpeech
            ttsReady = true
            tts?.language = Locale.US
            tts?.setSpeechRate(0.92f)
            val pending = pendingSpeech
            pendingSpeech = null
            speak(pending ?: "Tap the word, or draw around the problem. Then tell me what you need.")
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            startListening()
        } else {
            micPermission.launch(Manifest.permission.RECORD_AUDIO)
        }
    }

    private fun ask(followUp: Boolean) {
        if (sending) return
        val bitmap = HelpSession.bitmap ?: return
        val mark = binding.mark.mark
        if (mark == null) return
        sending = true
        binding.mark.locked = true
        listen = false
        stopListening()
        binding.ask.isEnabled = false
        binding.ask.text = "Joyce is thinking"
        binding.heard.text = "Joyce is thinking"
        binding.outcome.visibility = View.GONE
        val question = heard.trim()
        val audio = if (question.isEmpty()) readAudio() else null
        val marked = Pictures.marked(bitmap, mark)
        val crop = Pictures.crop(bitmap, mark)
        val imageB64 = Pictures.jpeg(marked, 1280, 60)
        val cropB64 = Pictures.jpeg(crop, 900, 70)
        marked.recycle()
        crop.recycle()
        val site = Prefs.site(this)
        val key = Prefs.key(this)
        val kid = Prefs.kid(this)
        val existing = if (followUp) sessionId else null
        thread {
            val result = JoyceClient.help(site, key, kid, imageB64, cropB64, question, audio, existing, followUp)
            runOnUiThread {
                sending = false
                if (isFinishing) {
                    if (result.sessionId.isNotBlank() && !outcomeSent) {
                        outcomeSent = true
                        thread { JoyceClient.outcome(site, key, result.sessionId, "left") }
                    }
                    return@runOnUiThread
                }
                showHint(result)
            }
        }
    }

    private fun showHint(result: JoyceClient.HintResult) {
        binding.ask.visibility = View.GONE
        binding.hint.visibility = View.VISIBLE
        if (result.error != null) {
            binding.hint.text = result.error
            binding.mark.locked = false
            speak(result.error)
            if (sessionId.isNullOrBlank()) {
                binding.ask.visibility = View.VISIBLE
                binding.ask.isEnabled = binding.mark.mark != null
                binding.ask.text = getString(R.string.ask_joyce)
                binding.outcome.visibility = View.GONE
            } else {
                binding.ask.visibility = View.GONE
                binding.outcome.visibility = View.VISIBLE
            }
            return
        }
        sessionId = result.sessionId
        hintsUsed = result.hintsUsed
        binding.hint.text = result.say
        binding.heard.visibility = View.GONE
        if (result.done) {
            binding.outcome.visibility = View.GONE
            outcomeSent = true
            speakThenFinish(result.say)
        } else {
            binding.outcome.visibility = View.VISIBLE
            binding.mark.locked = false
            speak(result.say)
        }
    }

    private fun onStuck() {
        if (hintsUsed >= 2) finishOutcome("still-stuck")
        else ask(followUp = true)
    }

    private fun finishOutcome(outcome: String) {
        if (outcomeSent) {
            finish()
            return
        }
        outcomeSent = true
        val id = sessionId
        if (!id.isNullOrBlank()) {
            val site = Prefs.site(this)
            val key = Prefs.key(this)
            thread { JoyceClient.outcome(site, key, id, outcome) }
        }
        val line = when (outcome) {
            "got-it" -> "You did it."
            "still-stuck" -> "Ask a grown-up to sit with you for this one."
            else -> ""
        }
        if (line.isEmpty()) finish() else speakThenFinish(line)
    }

    private fun startListening() {
        listen = true
        if (SpeechRecognizer.isRecognitionAvailable(this)) startRecognizer() else startRecorder()
    }

    private fun startRecognizer() {
        if (!listen) return
        try {
            if (recognizer == null) {
                recognizer = SpeechRecognizer.createSpeechRecognizer(this).also { it.setRecognitionListener(listener) }
            }
            recognizer?.startListening(listenIntent())
        } catch (_: Exception) {
            startRecorder()
        }
    }

    private fun startRecorder() {
        if (recorder != null || !listen) return
        val file = File(cacheDir, "joyce-question.m4a")
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
        try {
            recognizer?.stopListening()
        } catch (_: Exception) {
        }
        try {
            recognizer?.destroy()
        } catch (_: Exception) {
        }
        recognizer = null
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

    private fun listenIntent() = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")
        putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
    }

    private val listener = object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {}
        override fun onBeginningOfSpeech() {}
        override fun onRmsChanged(rmsdB: Float) {}
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() {}
        override fun onError(error: Int) {
            if (!listen || error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) return
            if (error == SpeechRecognizer.ERROR_CLIENT) startRecorder()
            else handler.postDelayed({ if (listen) startRecognizer() }, 400)
        }
        override fun onResults(results: Bundle?) {
            val said = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()
            if (!said.isNullOrBlank()) heard = said
            showHeard()
            if (listen) handler.postDelayed({ if (listen) startRecognizer() }, 300)
        }
        override fun onPartialResults(partial: Bundle?) {
            val said = partial?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()
            if (!said.isNullOrBlank()) {
                heard = said
                showHeard()
            }
        }
        override fun onEvent(eventType: Int, params: Bundle?) {}
    }

    private fun showHeard() {
        if (sending) return
        binding.heard.text = if (heard.isBlank()) "Tap the word, or draw around the problem." else heard
    }

    private fun speak(text: String) {
        if (!ttsReady) {
            pendingSpeech = text
            return
        }
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "joyce")
    }

    private fun speakThenFinish(line: String) {
        val engine = tts
        if (!ttsReady || engine == null) {
            handler.postDelayed({ if (!isFinishing) finish() }, 1600)
            return
        }
        engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {}
            override fun onDone(utteranceId: String?) {
                handler.post { if (!isFinishing) finish() }
            }
            @Suppress("DEPRECATION")
            override fun onError(utteranceId: String?) {
                handler.post { if (!isFinishing) finish() }
            }
        })
        speak(line)
        handler.postDelayed({ if (!isFinishing) finish() }, 8000)
    }
}
