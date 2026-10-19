package family.reinagel.joyce

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import family.reinagel.joyce.databinding.ActivityMainBinding
import kotlin.concurrent.thread

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private var selectedKid = ""

    private val notifications = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) startJoyce(askMic = false)
        else status("Joyce needs notifications on so the tablet can show that the screen is shared.")
    }

    private val microphone = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (!granted) status("Joyce can't hear yet. A child can still point, and she can still help.")
        startJoyce(askMic = false)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        selectedKid = Prefs.kid(this)
        binding.site.setText(Prefs.site(this))
        binding.key.setText(Prefs.key(this))
        val kids = listOf(binding.kidMax, binding.kidGabi, binding.kidConnor, binding.kidEthan)
        kids.forEach { button ->
            button.setOnClickListener { select(button.tag.toString(), kids) }
        }
        if (selectedKid.isNotEmpty()) select(selectedKid, kids)
        binding.power.setOnClickListener {
            if (BubbleService.running) stopJoyce() else startJoyce()
        }
        binding.test.setOnClickListener { testKey() }
    }

    override fun onResume() {
        super.onResume()
        binding.power.text = if (BubbleService.running) "Turn Joyce off" else "Turn Joyce on"
        if (BubbleService.running) BubbleService.instance?.setBubbleVisible(true)
    }

    private fun select(id: String, kids: List<Button>) {
        selectedKid = id
        kids.forEach { button ->
            val on = button.tag == id
            button.backgroundTintList = ColorStateList.valueOf(Color.parseColor(if (on) "#2F6F6A" else "#E4DDD0"))
            button.setTextColor(if (on) Color.WHITE else Color.parseColor("#243036"))
        }
    }

    private fun startJoyce(askMic: Boolean = true) {
        val site = Prefs.cleanSite(binding.site.text.toString())
        val key = binding.key.text.toString().trim()
        if (selectedKid.isEmpty()) {
            status("Choose who this tablet is for.")
            return
        }
        if (!Prefs.siteOk(site) || key.isEmpty()) {
            status("Add the site and the tablet key first.")
            return
        }
        Prefs.save(this, selectedKid, site, key)
        if (!Settings.canDrawOverlays(this)) {
            status("Allow Joyce to show over other apps, then come back and turn her on.")
            startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
            return
        }
        if (askMic && ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            microphone.launch(Manifest.permission.RECORD_AUDIO)
            return
        }
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            notifications.launch(Manifest.permission.POST_NOTIFICATIONS)
            return
        }
        ContextCompat.startForegroundService(this, Intent(this, BubbleService::class.java))
        binding.power.text = "Turn Joyce off"
        status("Joyce is on. The first tap asks Android to share the whole screen. Leave that on for the learning block.")
    }

    private fun stopJoyce() {
        stopService(Intent(this, BubbleService::class.java))
        if (CaptureService.running) {
            startService(Intent(this, CaptureService::class.java).setAction(CaptureService.ACTION_STOP))
        }
        binding.power.text = "Turn Joyce on"
        status("Joyce is off.")
    }

    private fun testKey() {
        val site = Prefs.cleanSite(binding.site.text.toString())
        val key = binding.key.text.toString().trim()
        Prefs.save(this, selectedKid, site, key)
        if (!Prefs.siteOk(site) || key.isEmpty()) {
            status("Add the site and the tablet key first.")
            return
        }
        status("Checking...")
        thread {
            val message = JoyceClient.ping(site, key)
            runOnUiThread { status(message) }
        }
    }

    private fun status(text: String) {
        binding.status.text = text
    }
}
