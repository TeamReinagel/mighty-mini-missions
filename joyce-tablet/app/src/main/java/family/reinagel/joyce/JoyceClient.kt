package family.reinagel.joyce

import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

object JoyceClient {
    data class HintResult(
        val say: String = "",
        val sessionId: String = "",
        val hintsUsed: Int = 0,
        val done: Boolean = false,
        val error: String? = null
    )

    fun ping(site: String, key: String): String {
        return try {
            val (code, body) = request(site, key, "GET", null)
            if (code in 200..299) "The key works."
            else body.optString("detail").ifBlank { body.optString("error") }.ifBlank { "Joyce couldn't connect ($code)." }
        } catch (_: Exception) {
            "Joyce needs the wifi, or the site address is wrong."
        }
    }

    fun help(
        site: String,
        key: String,
        kid: String,
        imageBase64: String,
        cropBase64: String,
        question: String,
        audioBase64: String?,
        sessionId: String?,
        followUp: Boolean
    ): HintResult {
        val json = JSONObject()
            .put("kid", kid)
            .put("imageBase64", imageBase64)
            .put("cropBase64", cropBase64)
            .put("question", question)
            .put("followUp", followUp)
        if (!sessionId.isNullOrBlank()) json.put("sessionId", sessionId)
        if (question.isBlank() && !audioBase64.isNullOrBlank()) {
            json.put("audioBase64", audioBase64)
            json.put("audioType", "audio/mp4")
        }
        return post(site, key, json)
    }

    fun outcome(site: String, key: String, sessionId: String, outcome: String) {
        val json = JSONObject()
            .put("action", "outcome")
            .put("sessionId", sessionId)
            .put("outcome", outcome)
        try {
            post(site, key, json)
        } catch (_: Exception) {
            // The help note is already saved. Missing the tap is still a true report.
        }
    }

    private fun post(site: String, key: String, json: JSONObject): HintResult {
        return try {
            val (code, body) = request(site, key, "POST", json)
            if (code !in 200..299) failure(code, body) else HintResult(
                say = body.optString("say"),
                sessionId = body.optString("sessionId"),
                hintsUsed = body.optInt("hintsUsed"),
                done = body.optBoolean("done")
            )
        } catch (_: IOException) {
            HintResult(error = "Joyce needs the wifi.")
        } catch (_: Exception) {
            HintResult(error = "Joyce couldn't answer. Try again.")
        }
    }

    private fun failure(code: Int, body: JSONObject): HintResult {
        val spoken = body.optString("error").ifBlank {
            if (code == 401) "That key didn't work. A grown-up can fix it in the Joyce app."
            else "Joyce couldn't answer. Try again."
        }
        return HintResult(error = spoken)
    }

    private fun request(site: String, key: String, method: String, json: JSONObject?): Pair<Int, JSONObject> {
        val conn = (URL("${Prefs.cleanSite(site)}/api/joyce-tablet").openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 20_000
            readTimeout = 60_000
            setRequestProperty("Authorization", "Bearer $key")
            setRequestProperty("Accept", "application/json")
            if (json != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json; charset=utf-8")
            }
        }
        try {
            if (json != null) {
                conn.outputStream.use { it.write(json.toString().toByteArray(Charsets.UTF_8)) }
            }
            val code = conn.responseCode
            val text = (if (code in 200..299) conn.inputStream else conn.errorStream)
                ?.bufferedReader()?.use { it.readText() }.orEmpty()
            val body = if (text.trimStart().startsWith("{")) JSONObject(text) else JSONObject()
            return code to body
        } finally {
            conn.disconnect()
        }
    }
}
