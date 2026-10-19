package family.reinagel.joyce

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.widget.Toast

object HelpOpener {
    fun open(context: Context, bitmap: Bitmap?) {
        if (bitmap == null) {
            BubbleService.reveal()
            Toast.makeText(context.applicationContext, "Joyce couldn't see the screen. Try again.", Toast.LENGTH_LONG).show()
            return
        }
        val old = HelpSession.bitmap
        if (old != null && old !== bitmap) old.recycle()
        HelpSession.bitmap = bitmap
        try {
            context.startActivity(
                Intent(context, HelpActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        } catch (_: Exception) {
            BubbleService.reveal()
            Toast.makeText(context.applicationContext, "Ask a grown-up to open Joyce.", Toast.LENGTH_LONG).show()
        }
    }
}
