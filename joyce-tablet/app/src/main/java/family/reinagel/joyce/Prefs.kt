package family.reinagel.joyce

import android.content.Context

object Prefs {
    private const val FILE = "joyce"

    private fun sp(ctx: Context) = ctx.getSharedPreferences(FILE, Context.MODE_PRIVATE)

    fun kid(ctx: Context) = sp(ctx).getString("kid", "").orEmpty()

    fun site(ctx: Context) = cleanSite(sp(ctx).getString("site", "").orEmpty())

    fun key(ctx: Context) = sp(ctx).getString("key", "").orEmpty()

    fun bubbleX(ctx: Context) = sp(ctx).getInt("bx", Int.MIN_VALUE)

    fun bubbleY(ctx: Context) = sp(ctx).getInt("by", Int.MIN_VALUE)

    fun save(ctx: Context, kid: String, site: String, key: String) {
        sp(ctx).edit()
            .putString("kid", kid)
            .putString("site", cleanSite(site))
            .putString("key", key.trim())
            .apply()
    }

    fun saveBubble(ctx: Context, x: Int, y: Int) {
        sp(ctx).edit().putInt("bx", x).putInt("by", y).apply()
    }

    fun cleanSite(raw: String): String {
        var s = raw.trim().trimEnd('/')
        s = s.removeSuffix("/api/joyce-tablet")
        return s.trimEnd('/')
    }

    fun siteOk(site: String) = site.startsWith("https://") || site.startsWith("http://")
}
