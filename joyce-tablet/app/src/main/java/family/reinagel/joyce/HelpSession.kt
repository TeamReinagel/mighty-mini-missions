package family.reinagel.joyce

import android.graphics.Bitmap

object HelpSession {
    var bitmap: Bitmap? = null
    var open: Boolean = false
    var onBitmap: ((Bitmap?) -> Unit)? = null

    /** Called when a screenshot is ready. The help screen may not exist yet. */
    fun deliver(bitmap: Bitmap?) {
        val listener = onBitmap
        if (listener != null) {
            listener(bitmap)
        } else if (open && bitmap != null) {
            this.bitmap = bitmap
        } else {
            bitmap?.recycle()
        }
    }
}
