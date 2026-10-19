package family.reinagel.joyce

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.PointF
import android.graphics.RectF
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

class MarkView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null
) : View(context, attrs) {
    data class Mark(val left: Float, val top: Float, val right: Float, val bottom: Float, val point: Boolean)

    var image: Bitmap? = null
        set(value) {
            field = value
            compute()
            invalidate()
        }

    var mark: Mark? = null
        private set

    var onMarked: ((Mark) -> Unit)? = null
    var locked = false

    private val matrix = Matrix()
    private val inverse = Matrix()
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
    private val stroke = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#E23D3D")
        style = Paint.Style.STROKE
    }
    private var start = PointF()
    private var dragging = false

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        stroke.strokeWidth = 4f * resources.displayMetrics.density
        compute()
    }

    private fun compute() {
        val bmp = image ?: return
        if (width == 0 || height == 0) return
        val scale = min(width / bmp.width.toFloat(), height / bmp.height.toFloat())
        val dx = (width - bmp.width * scale) / 2f
        val dy = (height - bmp.height * scale) / 2f
        matrix.setScale(scale, scale)
        matrix.postTranslate(dx, dy)
        matrix.invert(inverse)
    }

    override fun onDraw(canvas: Canvas) {
        val bmp = image ?: return
        canvas.drawBitmap(bmp, matrix, paint)
        val current = mark ?: return
        val pts = floatArrayOf(current.left, current.top, current.right, current.bottom)
        matrix.mapPoints(pts)
        if (current.point) {
            canvas.drawCircle(pts[0], pts[1], 22f * resources.displayMetrics.density, stroke)
        } else {
            canvas.drawOval(RectF(pts[0], pts[1], pts[2], pts[3]), stroke)
        }
    }

    private fun toBitmap(event: MotionEvent): PointF {
        val pts = floatArrayOf(event.x, event.y)
        inverse.mapPoints(pts)
        val bmp = image
        if (bmp != null) {
            pts[0] = pts[0].coerceIn(0f, (bmp.width - 1).toFloat())
            pts[1] = pts[1].coerceIn(0f, (bmp.height - 1).toFloat())
        }
        return PointF(pts[0], pts[1])
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (locked || image == null) return false
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                start = toBitmap(event)
                dragging = true
                mark = Mark(start.x, start.y, start.x, start.y, true)
                invalidate()
                return true
            }
            MotionEvent.ACTION_MOVE, MotionEvent.ACTION_UP -> {
                if (!dragging) return false
                val now = toBitmap(event)
                val bmp = image ?: return true
                val slop = bmp.width * 0.035f
                val point = abs(now.x - start.x) < slop && abs(now.y - start.y) < slop
                mark = if (point) {
                    Mark(start.x, start.y, start.x, start.y, true)
                } else {
                    Mark(
                        min(start.x, now.x),
                        min(start.y, now.y),
                        max(start.x, now.x),
                        max(start.y, now.y),
                        false
                    )
                }
                if (event.actionMasked == MotionEvent.ACTION_UP) {
                    dragging = false
                    mark?.let { onMarked?.invoke(it) }
                }
                invalidate()
                return true
            }
        }
        return super.onTouchEvent(event)
    }
}
