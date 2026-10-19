package family.reinagel.joyce

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

object Updater {
    data class Offer(val versionCode: Long, val versionName: String, val url: String)

    fun installedCode(context: Context): Long {
        val info = if (Build.VERSION.SDK_INT >= 33) {
            context.packageManager.getPackageInfo(context.packageName, PackageManager.PackageInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            context.packageManager.getPackageInfo(context.packageName, 0)
        }
        return if (Build.VERSION.SDK_INT >= 28) info.longVersionCode else {
            @Suppress("DEPRECATION")
            info.versionCode.toLong()
        }
    }

    fun look(site: String): Offer? {
        val (code, text) = get("${Prefs.cleanSite(site)}/joyce-latest.json")
        if (code !in 200..299 || !text.trimStart().startsWith("{")) return null
        val json = JSONObject(text)
        val versionCode = json.optLong("versionCode")
        val versionName = json.optString("versionName").ifBlank { versionCode.toString() }
        val url = directUrl(json.optString("url"))
        if (versionCode <= 0 || url.isBlank()) return null
        return Offer(versionCode, versionName, url)
    }

    fun download(context: Context, url: String): File? {
        val (code, bytes, type) = getBytes(url)
        if (code !in 200..299 || bytes.size < 100_000) return null
        if (type.contains("html") || bytes[0] != 'P'.code.toByte() || bytes[1] != 'K'.code.toByte()) return null
        val dir = File(context.cacheDir, "updates").apply { mkdirs() }
        val file = File(dir, "joyce-update.apk")
        FileOutputStream(file).use { it.write(bytes) }
        return file
    }

    fun install(context: Context, file: File) {
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.files", file)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(intent)
    }

    private fun directUrl(raw: String): String {
        val trimmed = raw.trim()
        val id = Regex("""/file/d/([A-Za-z0-9_-]+)""").find(trimmed)?.groupValues?.get(1)
            ?: Regex("""[?&]id=([A-Za-z0-9_-]+)""").find(trimmed)?.groupValues?.get(1)
        if (id.isNullOrBlank()) return trimmed
        return "https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t"
    }

    private fun get(url: String): Pair<Int, String> {
        val (code, bytes, _) = getBytes(url)
        return code to bytes.toString(Charsets.UTF_8)
    }

    private fun getBytes(url: String): Triple<Int, ByteArray, String> {
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            instanceFollowRedirects = true
            connectTimeout = 20_000
            readTimeout = 120_000
            setRequestProperty("User-Agent", "Mozilla/5.0")
            setRequestProperty("Accept", "*/*")
        }
        try {
            val code = conn.responseCode
            val type = conn.contentType.orEmpty()
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val bytes = stream?.use { it.readBytes() } ?: ByteArray(0)
            return Triple(code, bytes, type)
        } finally {
            conn.disconnect()
        }
    }
}
