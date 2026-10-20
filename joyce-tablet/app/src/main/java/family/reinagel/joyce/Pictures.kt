package family.reinagel.joyce

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.util.Base64
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.min

object Pictures {
    fun marked(src: Bitmap, mark: MarkView.Mark): Bitmap {
        val copy = src.copy(Bitmap.Config.ARGB_8888, true)
        val canvas = Canvas(copy)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#E23D3D")
            style = Paint.Style.STROKE
            strokeWidth = max(6f, src.width / 160f)
        }
        if (mark.point) {
            canvas.drawCircle(mark.left, mark.top, max(24f, src.width / 22f), paint)
        } else {
            canvas.drawOval(RectF(mark.left, mark.top, mark.right, mark.bottom), paint)
        }
        return copy
    }

    fun crop(src: Bitmap, mark: MarkView.Mark): Bitmap {
        val rect = cropRect(mark, src)
        val result = Bitmap.createBitmap(src, rect.left, rect.top, rect.width(), rect.height())
        // Android may return src for a full-image crop; callers own and recycle the crop.
        return if (result === src) src.copy(Bitmap.Config.ARGB_8888, false) else result
    }

    fun jpeg(bitmap: Bitmap, maxEdge: Int, quality: Int): String {
        val longEdge = max(bitmap.width, bitmap.height).toFloat().coerceAtLeast(1f)
        val scale = min(1f, maxEdge / longEdge)
        val scaled = if (scale < 0.999f) {
            Bitmap.createScaledBitmap(
                bitmap,
                (bitmap.width * scale).toInt().coerceAtLeast(1),
                (bitmap.height * scale).toInt().coerceAtLeast(1),
                true
            )
        } else bitmap
        val stream = ByteArrayOutputStream()
        scaled.compress(Bitmap.CompressFormat.JPEG, quality, stream)
        if (scaled !== bitmap) scaled.recycle()
        return Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
    }

    private fun cropRect(mark: MarkView.Mark, src: Bitmap): Rect {
        val pad = if (mark.point) src.width * 0.16f else src.width * 0.05f
        val cx = (mark.left + mark.right) / 2f
        val cy = (mark.top + mark.bottom) / 2f
        val halfW = if (mark.point) pad else (mark.right - mark.left) / 2f + pad
        val halfH = if (mark.point) pad else (mark.bottom - mark.top) / 2f + pad
        val left = max(0, (cx - halfW).toInt())
        val top = max(0, (cy - halfH).toInt())
        val right = min(src.width, (cx + halfW).toInt()).coerceAtLeast(left + 1)
        val bottom = min(src.height, (cy + halfH).toInt()).coerceAtLeast(top + 1)
        return Rect(left, top, right, bottom)
    }
}
