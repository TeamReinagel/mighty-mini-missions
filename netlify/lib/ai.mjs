// Small OpenAI chat helper shared by the report and Joyce.

async function chat({ system, user, userContent, model, env = process.env, fetchImpl = fetch, timeoutMs = 60000, temperature = 0.4, json = false }) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || env.OPENAI_MODEL || "gpt-4o-mini",
        temperature,
        ...(json ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent ?? user }
        ]
      })
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timer);
  }
}

export async function chatJSON(opts) {
  return JSON.parse((await chat({ ...opts, json: true })) || "{}");
}

export async function chatText(opts) {
  const text = (await chat(opts)).trim();
  if (!text) throw new Error("OpenAI returned an empty reply");
  return text;
}

/** Vision JSON call. `images` are `{ base64, mediaType, detail }`. */
export async function chatVisionJSON({ system, text, images, env = process.env, ...opts }) {
  const userContent = [
    { type: "text", text },
    ...(images || []).filter((img) => img?.base64).map((img) => ({
      type: "image_url",
      image_url: {
        url: `data:${img.mediaType || "image/jpeg"};base64,${img.base64}`,
        detail: img.detail || "auto"
      }
    }))
  ];
  const raw = await chat({
    ...opts,
    env,
    system,
    user: text,
    userContent,
    json: true,
    model: opts.model || env.OPENAI_VISION_MODEL || env.OPENAI_MODEL || "gpt-4o-mini"
  });
  return JSON.parse(raw || "{}");
}
