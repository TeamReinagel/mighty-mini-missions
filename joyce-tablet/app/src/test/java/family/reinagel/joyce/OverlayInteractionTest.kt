package family.reinagel.joyce

import android.content.Context
import android.graphics.Bitmap
import android.view.MotionEvent
import android.view.View
import android.widget.LinearLayout
import android.widget.ImageButton
import android.widget.Button
import android.view.LayoutInflater
import android.view.ContextThemeWrapper
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [26, 28, 33, 35])
class OverlayInteractionTest {
    private fun context(): Context = ContextThemeWrapper(RuntimeEnvironment.getApplication(), R.style.Theme_Joyce)
    private fun markView(): MarkView = MarkView(context()).apply {
        image = Bitmap.createBitmap(1000, 1000, Bitmap.Config.ARGB_8888)
        layout(0, 0, 1000, 1000)
    }
    private fun touch(view: MarkView, action: Int, x: Float, y: Float) {
        val event = MotionEvent.obtain(0, 0, action, x, y, 0)
        view.onTouchEvent(event)
        event.recycle()
    }

    @Test fun closedCircleSelectsWholeProblem() {
        val view = markView()
        touch(view, MotionEvent.ACTION_DOWN, 200f, 200f)
        touch(view, MotionEvent.ACTION_MOVE, 600f, 200f)
        touch(view, MotionEvent.ACTION_MOVE, 600f, 500f)
        touch(view, MotionEvent.ACTION_MOVE, 200f, 500f)
        touch(view, MotionEvent.ACTION_UP, 200f, 200f)
        val mark = view.mark!!
        assertFalse(mark.point)
        assertEquals(200f, mark.left, 0.1f)
        assertEquals(600f, mark.right, 0.1f)
        assertEquals(500f, mark.bottom, 0.1f)
    }

    @Test fun aSmallFingerWobbleStillMeansOneTap() {
        val view = markView()
        touch(view, MotionEvent.ACTION_DOWN, 200f, 200f)
        touch(view, MotionEvent.ACTION_MOVE, 210f, 215f)
        touch(view, MotionEvent.ACTION_UP, 202f, 203f)
        assertTrue(view.mark!!.point)
    }

    @Test fun cancelledGestureKeepsPreviousSelection() {
        val view = markView()
        touch(view, MotionEvent.ACTION_DOWN, 200f, 200f)
        touch(view, MotionEvent.ACTION_UP, 200f, 200f)
        val original = view.mark
        touch(view, MotionEvent.ACTION_DOWN, 800f, 800f)
        touch(view, MotionEvent.ACTION_CANCEL, 800f, 800f)
        assertEquals(original, view.mark)
    }

    @Test fun lockedSelectionCannotChangeDuringRequest() {
        val view = markView()
        touch(view, MotionEvent.ACTION_DOWN, 200f, 200f)
        touch(view, MotionEvent.ACTION_UP, 200f, 200f)
        val original = view.mark
        view.locked = true
        touch(view, MotionEvent.ACTION_DOWN, 800f, 800f)
        touch(view, MotionEvent.ACTION_UP, 800f, 800f)
        assertEquals(original, view.mark)
    }

    @Test fun selectingNewImageClearsOldMark() {
        val view = markView()
        touch(view, MotionEvent.ACTION_DOWN, 200f, 200f)
        touch(view, MotionEvent.ACTION_UP, 200f, 200f)
        view.image = Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888)
        assertNull(view.mark)
    }

    @Test fun paddedScreenshotMapsTapToCorrectWord() {
        val view = MarkView(context()).apply {
            setPadding(0, 100, 0, 0)
            image = Bitmap.createBitmap(1000, 1000, Bitmap.Config.ARGB_8888)
            layout(0, 0, 1000, 1100)
        }
        touch(view, MotionEvent.ACTION_DOWN, 200f, 300f)
        touch(view, MotionEvent.ACTION_UP, 200f, 300f)
        assertEquals(200f, view.mark!!.top, 0.1f)
    }

    @Test fun fullScreenCropCanBeRecycledWithoutDestroyingOriginal() {
        val source = Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888)
        val crop = Pictures.crop(source, MarkView.Mark(0f, 0f, 100f, 100f, false))
        assertNotSame(source, crop)
        crop.recycle()
        assertFalse(source.isRecycled)
        val second = Pictures.crop(source, MarkView.Mark(50f, 50f, 50f, 50f, true))
        assertTrue(second.width > 0)
    }

    @Test fun edgeTapMakesValidCrop() {
        val source = Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888)
        for (x in listOf(0f, 99f)) for (y in listOf(0f, 99f)) {
            val crop = Pictures.crop(source, MarkView.Mark(x, y, x, y, true))
            assertTrue(crop.width in 1..100)
            assertTrue(crop.height in 1..100)
            crop.recycle()
        }
        assertFalse(source.isRecycled)
    }

    @Test fun childControlsRemainVisibleInPortraitAndLandscape() {
        val density = context().resources.displayMetrics.density
        for ((wDp, hDp) in listOf(800 to 1280, 1280 to 800, 640 to 360, 360 to 640)) {
            val w = (wDp * density).toInt()
            val h = (hDp * density).toInt()
            val panel = HelpPanel(context()) {}
            val bindingField = HelpPanel::class.java.getDeclaredField("binding").apply { isAccessible = true }
            val binding = bindingField.get(panel) as family.reinagel.joyce.databinding.ActivityHelpBinding
            val fit = HelpPanel::class.java.getDeclaredMethod("fitPanel", Int::class.javaPrimitiveType, Int::class.javaPrimitiveType).apply { isAccessible = true }
            fit.invoke(panel, w, h)
            binding.gotIt.visibility = View.VISIBLE
            binding.replay.visibility = View.VISIBLE
            binding.root.measure(View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(h, View.MeasureSpec.EXACTLY))
            binding.root.layout(0, 0, w, h)
            assertTrue("Screenshot must stay visible at $wDp x $hDp", binding.mark.height > h * 0.3)
            for (button in listOf(binding.back, binding.gotIt, binding.replay, binding.ask)) {
                assertTrue("Touch target must be at least 48dp", button.height >= 48 * density)
                assertTrue("Controls cannot extend beyond panel", button.bottom <= (button.parent as View).height)
            }
        }
    }
    private fun binding(panel: HelpPanel): family.reinagel.joyce.databinding.ActivityHelpBinding {
        return HelpPanel::class.java.getDeclaredField("binding").apply { isAccessible = true }.get(panel) as family.reinagel.joyce.databinding.ActivityHelpBinding
    }

    @Test fun pointOnlyChildCanAskWithoutMicrophonePermission() {
        val panel = HelpPanel(context()) {}
        panel.show(Bitmap.createBitmap(1000, 1000, Bitmap.Config.ARGB_8888))
        val b = binding(panel)
        b.mark.layout(0, 0, 1000, 1000)
        assertEquals(View.VISIBLE, b.ask.visibility)
        assertFalse(b.ask.isEnabled)
        touch(b.mark, MotionEvent.ACTION_DOWN, 200f, 200f)
        touch(b.mark, MotionEvent.ACTION_UP, 200f, 200f)
        assertTrue(b.ask.isEnabled)
        panel.dismiss(false)
    }

    @Test fun newMarkAfterAnswerStartsNewQuestionAndClearsReplay() {
        val panel = HelpPanel(context()) {}
        panel.show(Bitmap.createBitmap(1000, 1000, Bitmap.Config.ARGB_8888))
        val b = binding(panel)
        b.mark.layout(0, 0, 1000, 1000)
        val show = HelpPanel::class.java.getDeclaredMethod("showHint", JoyceClient.HintResult::class.java).apply { isAccessible = true }
        show.invoke(panel, JoyceClient.HintResult(say = "The word is cat.", revealed = true))
        assertFalse(b.ask.isEnabled)
        assertEquals(View.VISIBLE, b.replay.visibility)
        touch(b.mark, MotionEvent.ACTION_DOWN, 600f, 600f)
        touch(b.mark, MotionEvent.ACTION_UP, 600f, 600f)
        assertTrue(b.ask.isEnabled)
        assertEquals(View.GONE, b.replay.visibility)
        assertEquals(View.GONE, b.hint.visibility)
        panel.dismiss(false)
    }

    @Test fun gotItClosesImmediatelyAndOnlyOnce() {
        var closed = 0
        val panel = HelpPanel(context()) { closed++ }
        val image = Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888)
        panel.show(image)
        binding(panel).gotIt.performClick()
        assertFalse(panel.isShowing)
        assertEquals(1, closed)
        assertTrue(image.isRecycled)
        panel.dismiss(false)
        assertEquals(1, closed)
    }

    @Test fun silentListeningWindowReturnsToTapControl() {
        val panel = HelpPanel(context()) {}
        panel.show(Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888))
        val b = binding(panel)
        b.mark.layout(0, 0, 100, 100)
        touch(b.mark, MotionEvent.ACTION_DOWN, 50f, 50f)
        touch(b.mark, MotionEvent.ACTION_UP, 50f, 50f)
        HelpPanel::class.java.getDeclaredField("listen").apply { isAccessible = true }.set(panel, true)
        HelpPanel::class.java.getDeclaredMethod("endListeningWindow").apply { isAccessible = true }.invoke(panel)
        assertTrue(b.ask.isEnabled)
        assertTrue(b.heard.text.contains("Take your time"))
        panel.dismiss(false)
    }

    @Test fun spokenDirectionsWaitForLocalVoiceToBeReady() {
        val panel = HelpPanel(context()) {}
        panel.show(Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888))
        val voice = org.robolectric.Shadows.shadowOf(org.robolectric.shadows.ShadowTextToSpeech.getLastTextToSpeechInstance())
        voice.onInitListener.onInit(android.speech.tts.TextToSpeech.SUCCESS)
        org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle()
        assertEquals("Tap a word or circle a problem. Then talk, or tap Ask Joyce.", voice.lastSpokenText)
        panel.dismiss(false)
    }

    @Test fun lateVoiceStartupDoesNotInterruptAChildWhoAlreadyMarked() {
        val panel = HelpPanel(context()) {}
        panel.show(Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888))
        val b = binding(panel)
        b.mark.layout(0, 0, 100, 100)
        touch(b.mark, MotionEvent.ACTION_DOWN, 50f, 50f)
        touch(b.mark, MotionEvent.ACTION_UP, 50f, 50f)
        val voice = org.robolectric.Shadows.shadowOf(org.robolectric.shadows.ShadowTextToSpeech.getLastTextToSpeechInstance())
        voice.clearLastSpokenText()
        voice.onInitListener.onInit(android.speech.tts.TextToSpeech.SUCCESS)
        org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle()
        assertNull(voice.lastSpokenText)
        assertTrue(b.ask.isEnabled)
        panel.dismiss(false)
    }

    @Test fun brokenCloudAudioStillSpeaksTheFinalAnswerLocally() {
        val panel = HelpPanel(context()) {}
        panel.show(Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888))
        val voice = org.robolectric.Shadows.shadowOf(org.robolectric.shadows.ShadowTextToSpeech.getLastTextToSpeechInstance())
        voice.onInitListener.onInit(android.speech.tts.TextToSpeech.SUCCESS)
        org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle()
        val show = HelpPanel::class.java.getDeclaredMethod("showHint", JoyceClient.HintResult::class.java).apply { isAccessible = true }
        show.invoke(panel, JoyceClient.HintResult(say = "The word is cat.", spokenText = "The word is cat.", revealed = true, audioBase64 = "a"))
        assertEquals("The word is cat.", voice.lastSpokenText)
        assertFalse(binding(panel).ask.isEnabled)
        panel.dismiss(false)
    }

    @Test
    @org.robolectric.annotation.GraphicsMode(org.robolectric.annotation.GraphicsMode.Mode.NATIVE)
    @Config(sdk = [35])
    fun renderRepresentativeReadingAndMathLayouts() {
        for ((w, h) in listOf(800 to 1280, 1280 to 800)) {
            val panel = HelpPanel(context()) {}
            val b = binding(panel)
            val picture = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            val canvas = android.graphics.Canvas(picture)
            canvas.drawColor(android.graphics.Color.rgb(248, 249, 253))
            val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply { color = android.graphics.Color.rgb(32, 55, 71); textSize = 44f }
            canvas.drawText("Reading practice", 50f, 100f, paint)
            canvas.drawText("I found a little boat.", 50f, 220f, paint)
            canvas.drawText("Math practice", 50f, 380f, paint)
            canvas.drawText("14 − 6 = ?", 50f, 480f, paint)
            b.mark.image = picture
            b.hint.visibility = View.VISIBLE
            b.hint.text = "Joyce: Start with fourteen objects. Take away six, one at a time."
            b.heard.text = "Your turn. Talk or tap Ask Joyce."
            b.gotIt.visibility = View.VISIBLE
            b.replay.visibility = View.VISIBLE
            b.ask.isEnabled = true
            HelpPanel::class.java.getDeclaredMethod("fitPanel", Int::class.javaPrimitiveType, Int::class.javaPrimitiveType).apply { isAccessible = true }.invoke(panel, w, h)
            b.root.measure(View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(h, View.MeasureSpec.EXACTLY))
            b.root.layout(0, 0, w, h)
            val output = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            b.root.draw(android.graphics.Canvas(output))
            val directory = java.io.File("build/reports/joyce-layouts").apply { mkdirs() }
            java.io.FileOutputStream(java.io.File(directory, "layout-${w}x${h}.png")).use { output.compress(Bitmap.CompressFormat.PNG, 100, it) }
            output.recycle()
            picture.recycle()
        }
    }

    @Test
    @Config(shadows = [SingleUseProjectionShadow::class])
    fun screenSharingReusesItsVirtualDisplayForSecondQuestion() {
        val controller = org.robolectric.Robolectric.buildService(CaptureService::class.java).create()
        val service = controller.get()
        val projection = org.robolectric.shadow.api.Shadow.newInstanceOf(android.media.projection.MediaProjection::class.java)
        projection.registerCallback(object : android.media.projection.MediaProjection.Callback() {}, android.os.Handler(android.os.Looper.getMainLooper()))
        CaptureService::class.java.getDeclaredField("projection").apply { isAccessible = true }.set(service, projection)
        val field = CaptureService::class.java.getDeclaredField("virtualDisplay").apply { isAccessible = true }
        val main = org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper())
        var results = 0
        service.grab { it?.recycle(); results++ }
        main.idle()
        val firstDisplay = field.get(service)
        assertNotNull(firstDisplay)
        main.idleFor(java.time.Duration.ofSeconds(3))
        service.grab { it?.recycle(); results++ }
        main.idle()
        assertSame(firstDisplay, field.get(service))
        main.idleFor(java.time.Duration.ofSeconds(3))
        assertEquals(2, results)
        controller.destroy()
    }

    @Test fun lateScreenshotAfterServiceShutdownIsDiscarded() {
        val controller = org.robolectric.Robolectric.buildService(BubbleService::class.java).create()
        val service = controller.get()
        controller.destroy()
        val image = Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888)
        service.showHelp(image)
        assertTrue(image.isRecycled)
    }

}


/** Models Android 14's documented one-createVirtualDisplay-call-per-consent rule. */
@org.robolectric.annotation.Implements(android.media.projection.MediaProjection::class)
class SingleUseProjectionShadow {
    private var created = false

    @org.robolectric.annotation.Implementation
    fun registerCallback(callback: android.media.projection.MediaProjection.Callback, handler: android.os.Handler?) {}

    @org.robolectric.annotation.Implementation
    fun stop() {}

    @org.robolectric.annotation.Implementation
    fun createVirtualDisplay(name: String, width: Int, height: Int, density: Int, flags: Int,
        surface: android.view.Surface?, callback: android.hardware.display.VirtualDisplay.Callback?, handler: android.os.Handler?): android.hardware.display.VirtualDisplay {
        check(!created) { "A projection consent token cannot create a second virtual display" }
        created = true
        val manager = RuntimeEnvironment.getApplication().getSystemService(Context.DISPLAY_SERVICE) as android.hardware.display.DisplayManager
        return manager.createVirtualDisplay(name, width, height, density, surface, flags, callback, handler)
    }
}
