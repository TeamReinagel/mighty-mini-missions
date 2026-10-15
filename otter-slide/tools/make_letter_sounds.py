"""Build the letter-sound clips (audio/s_*.wav) from real human recordings.

Usage (from otter-slide/): python3 tools/make_letter_sounds.py
Needs `curl` and `afconvert`. Downloads are cached in tools/source/ipa/.

Source: the "IPA pronunciations" recordings by ipapronunciations on Freesound, CC0 (public
domain). Vowel files are the bare vowel. Consonant files say the consonant held on its own, then
a vowel, then two more takes; we keep only the part before that first vowel. English has no
held "j", so it's built from the start of [d] plus [zh] (the sound in "measure"); "x" is [k] plus [s].
"""
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_audio import FRAME, SR, fade, frames, normalize, save, stretch  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "tools" / "source" / "ipa"
USER = 14110264

# sound -> Freesound sound id ([æ] [ɛ] [ɪ] [ɑ] [ʌ] [ɹ] [ʒ] spelled ae eh ih ah uh r zh)
IDS = {
    "ae": 640320, "eh": 640342, "ih": 640328, "ah": 640339, "uh": 640330,
    "b": 640377, "k": 640378, "d": 640375, "f": 640374, "g": 640381, "h": 640380,
    "l": 640383, "m": 640382, "n": 640412, "p": 640411, "r": 640432, "s": 640416,
    "t": 640415, "v": 640414, "w": 642662, "z": 640419, "zh": 640407,
}
VOWELS = {"a": "ae", "e": "eh", "i": "ih", "o": "ah", "u": "uh"}
HELD = {"f": "f", "l": "l", "m": "m", "n": "n", "r": "r", "s": "s", "v": "v", "z": "z"}
STOPS = {"b": "b", "c": "k", "d": "d", "g": "g", "p": "p", "t": "t"}
HOLD = 0.42


def level(x, target, peak=0.95):
    """Scale to a loudness (RMS) so the sounds match each other, without clipping."""
    rms = float(np.sqrt((x ** 2).mean()))
    return x * min(target / rms, peak / float(np.abs(x).max()))


def load(sym):
    CACHE.mkdir(parents=True, exist_ok=True)
    sid = IDS[sym]
    mp3, wav = CACHE / f"{sid}.mp3", CACHE / f"{sid}.wav"
    if not mp3.exists():
        url = f"https://cdn.freesound.org/previews/{sid // 1000}/{sid}_{USER}-hq.mp3"
        subprocess.run(["curl", "-sfL", url, "-o", str(mp3)], check=True)
    subprocess.run(["afconvert", "-f", "WAVE", "-d", f"LEI16@{SR}", "-c", "1", str(mp3), str(wav)], check=True)
    with wave.open(str(wav)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    wav.unlink()
    return x


def first_take(x):
    """Frame indexes in the first take of a consonant file: where the sound starts, where the
    held consonant ends, where a stop releases, and where the loud vowel arrives."""
    rms, zcr = frames(x[: SR])
    start = int(np.argmax(rms > 0.006))
    vowel = start + int(np.argmax(((rms > rms.max() * 0.45) & (zcr < 0.2))[start:]))
    level = np.median(rms[start + 2: start + 10])
    held_end = vowel
    if vowel > start + 3:
        held_end = start + 3 + int(np.argmax(rms[start + 3: vowel + 1] > level * 1.6))
    release = vowel
    while release > start and rms[release - 1] >= 0.025:
        release -= 1
    return start, held_end, release, vowel


def held(sym):
    x = load(sym)
    start, end, _, _ = first_take(x)
    seg = x[(start + 1) * FRAME: (end - 1) * FRAME]
    if len(seg) / SR < HOLD * 0.9:
        seg = stretch(seg, HOLD)
    return fade(seg, 0.02, 0.05)


def stop(sym):
    """Release burst and a sliver of the vowel: "b", not "buh"."""
    x = load(sym)
    _, _, release, vowel = first_take(x)
    end = max(release + 10, vowel + 4)
    return fade(x[max(0, release * FRAME - FRAME // 2): end * FRAME], 0.004, 0.05)


def main():
    for letter, sym in VOWELS.items():
        x = load(sym)
        rms, _ = frames(x)
        on = np.where(rms > rms.max() * 0.08)[0]
        save(f"s_{letter}", level(fade(x[on[0] * FRAME: (on[-1] + 1) * FRAME], 0.01, 0.06), 0.17))
    for letter, sym in HELD.items():
        save(f"s_{letter}", level(held(sym), 0.14))
    for letter, sym in STOPS.items():
        save(f"s_{letter}", level(stop(sym), 0.17))

    # h: the breath plus the first touch of the vowel so it can be heard.
    x = load("h")
    start, _, _, vowel = first_take(x)
    save("s_h", level(fade(x[start * FRAME: (vowel + 3) * FRAME], 0.03, 0.05), 0.11))

    # w: the glide into the vowel, cut early.
    x = load("w")
    start, _, _, vowel = first_take(x)
    save("s_w", level(fade(x[start * FRAME: (vowel + 2) * FRAME], 0.01, 0.05), 0.13))

    # j: [d] release straight into a short [zh].
    x = load("d")
    _, _, release, _ = first_take(x)
    d = x[release * FRAME - FRAME // 2: (release + 2) * FRAME]
    zh = held("zh")[: int(SR * 0.22)]
    d = d * (np.abs(zh).max() * 1.3 / np.abs(d).max())
    n = int(SR * 0.008)
    j = np.concatenate([d[:-n], d[-n:] * np.linspace(1, 0, n) + zh[:n] * np.linspace(0, 1, n), zh[n:]])
    save("s_j", level(fade(j, 0.003, 0.05), 0.14))

    # x: a [k] puff then [s].
    k = load("k")
    _, _, release, vowel = first_take(k)
    kk = fade(k[release * FRAME - FRAME // 2: vowel * FRAME], 0.003, 0.01)
    ss = held("s")[: int(SR * 0.3)]
    gap = np.zeros(int(SR * 0.03), np.float32)
    save("s_x", level(np.concatenate([normalize(kk, 0.6), gap, normalize(ss, 0.6)]), 0.14))

    for f in sorted((ROOT / "audio").glob("s_*.wav")):
        with wave.open(str(f)) as w:
            print(f"{f.stem}: {w.getnframes() / SR:.2f}s")


if __name__ == "__main__":
    main()
