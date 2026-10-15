# Kokoro speech test

On-device speech for Hatch Match. Open it from **Grown-up settings ? Kokoro speech test**, or go to `hatch-match/tts/` on the same host as the game.

The children’s game still uses the tablet’s built-in voice. This page does not change that.

## What it runs

Checked against kokoro-js 1.2.1 (3 May 2025) and the model card for `onnx-community/Kokoro-82M-v1.0-ONNX`:

| Piece | Choice |
| --- | --- |
| Library | `kokoro-js@1.2.1`, which bundles Transformers.js 3.5.1 and the eSpeak phonemizer |
| Weights | `q8` ? `onnx/model_quantized.onnx` (92,361,116 bytes). One file. |
| Runtime | `device: "wasm"` |
| Model revision | `1939ad2a8e416c0acfeecc08a694d14ef25f2231` |
| ONNX runtime | `ort-wasm-simd-threaded.jsep` from `@huggingface/transformers@3.5.1` |

`q8` is the quantization in the library’s browser example. In this build it maps to the `_quantized` file, not `model_q8f16.onnx`. WebGPU is documented with full-precision `fp32` (326 MB), a different file, and current Safari / ONNX Runtime WebGPU builds have been unreliable. The page never loads a second model.

Phonemizer data is inside `vendor/kokoro-1.2.1.web.js`. Voices download one at a time, the first time that voice is used.

## Where files live

One cache, `kokoro-hatch-v1`, holds the runtime, the model, the tokenizer, and any voices. kokoro-js would otherwise open `transformers-cache` and `kokoro-voices`; both names are redirected here.

The Hatch Match service worker does not store those files. **Reset saved speech** deletes `kokoro-hatch-v1` only. Game progress and the `hatch-v3` app cache stay.

The browser is asked to persist storage when Download is pressed. It can still say no, and it can still delete the files later when space is low. “Download once” means reuse while that cache is still there.

## Setup

The game is static. Serve `mighty-mini-missions` over http (a secure context). `file://` will not run the worker.

On Netlify, `/hatch-match/tts/*` is sent with Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy so Chrome can use more than one WASM thread. Without those headers the same model still runs, on one thread.

1. Open the test page.
2. Press **Download** and leave the tab open until it says **Ready**. The first run is about 90 MB.
3. Press **Speak**. **Stop** drops anything still queued.
4. Reload. It should warm up from saved files and not download the model again.
5. After that, the page can speak with the network off.

## Measured on this Mac

Cursor’s Chromium, 15 Oct 2026. The page was cross-origin isolated. `navigator.gpu` existed and was not used. “First audio” means the Web Audio graph showed a signal, not a microphone recording.

**First download and initialization** (Heart, two runs):

- 13.3 s from Download to Ready (11.5 s to fetch the model and create the session, 1.63 s silent prewarm).
- A second download later the same session was 19.0 s (17.3 s load, 1.68 s prewarm).
- The network log listed `model_quantized.onnx` (92,361,116 bytes) and `voices/af_heart.bin` (522,240 bytes), plus the small config and tokenizer files. No other ONNX file.
- Prewarm peak was 0.378 on 33,600 samples. Those samples were not played.

**Cached startup**, online, model already stored (Bella, two reloads):

- 1.74 s and 1.97 s from navigation to Ready.
- About 0.5 s to recreate the session and 1.1–1.3 s to prewarm.
- Network file list: none.

**Warm Speak**, model already prewarmed, Bella, the default five-sentence passage:

- 1.83 s from Speak until sound at the audio output.
- The first chunk, “Find little C.”, took 1.38 s to generate and was 1.77 s of audio.
- The full passage was 10.55 s of audio, generated in 8.08 s (0.77× realtime). A later pass of the same passage was 7.96 s (0.75×).
- Playback started while later sentences were still generating.

**Offline**, Chrome network emulation, `navigator.onLine === false`, after the files were saved:

- Reload reached Ready in 7.5 s. The document itself loaded in 16 ms. Recreating the session took 1.9 s and the silent prewarm took 5.3 s. Network file list: none.
- The next Speak, “Hello from the saved voice.”, took 1.63 s to generate 2.13 s of audio (0.76×) and the page ended on Finished speaking.
- An earlier offline pass, before the service worker learned to skip the network when `navigator.onLine` is false, also spoke successfully. That reload took 8.0 s to Ready, mostly waiting on failed network fetches.

**Reset:** the Kokoro cache’s files were removed. `hatch-v3` still had the game files and did not contain the model or the runtime. The speech report and voice preference were cleared.

`navigator.storage.persist()` was offered and this browser declined it. Saved files are best-effort.

## Not tested

- iPhone or iPad Safari, on a device. The runtime is WASM on purpose so it does not depend on WebGPU. A tap is required before audio can play; Download and Speak both resume the audio context. Safari without the cross-origin-isolation headers uses one WASM thread. Storage can be evicted, and this session did not get a persist grant, so a phone may ask for the download again after iOS clears site data.
- Speakers. The checks above are the Web Audio output and the discarded prewarm samples.

Stop was checked: after Stop, later sentences were not played. Changing voice downloads only that voice (about 510 KB), not another model.
