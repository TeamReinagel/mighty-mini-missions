"""Build the letter-sound clips (audio/s_*.wav) from real human recordings.

Usage (from otter-slide/): python3 tools/make_letter_sounds.py
Needs `curl` and `afconvert`. Downloads are cached in tools/source/ipa/.

Source: the "IPA pronunciations" recordings by ipapronunciations on Freesound, CC0 (public
domain). Vowel files are the bare vowel. Consonant files say the consonant, then a vowel,
then two more takes. Clips stay at the recording's own speed. Stretching the short
consonants made them sound hollow, so nothing here is time-stretched. Vowels keep the
first brief spoken part. Stops keep the burst and a short bit of the vowel after it.
English has no held "j", so it's built from the start of [d] plus [zh] (the sound in
"measure"); "x" is [k] plus [s].
"""
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_audio import FRAME, SR, fade, frames, normalize, save  # noqa: E402

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
# A spoken short vowel, and the longest a consonant is allowed to run.
SPOKEN = 0.18
CONSONANT = 0.20


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


def cut(x, a, b):
    a = max(0, int(a))
    b = min(len(x), max(a + FRAME, int(b)))
    return x[a:b]


def cap(x, seconds):
    n = int(SR * seconds)
    return x[:n] if len(x) > n else x


def vowel_clip(sym):
    """The attack of the vowel, before the long wavering tail."""
    x = load(sym)
    rms, _ = frames(x)
    on = np.where(rms > rms.max() * 0.35)[0]
    if not len(on):
        on = np.where(rms > rms.max() * 0.08)[0]
    start = on[0] * FRAME
    return fade(cut(x, start, start + SR * SPOKEN), 0.008, 0.035)


def consonant(sym):
    """The consonant itself, at the speed it was spoken, cut off before the vowel."""
    x = load(sym)
    start, _, _, vowel = first_take(x)
    seg = cut(x, (start + 1) * FRAME, (vowel - 1) * FRAME)
    return fade(cap(seg, CONSONANT), 0.01, 0.03)


def stop(sym):
    """The release, plus a short voiced tail so it is a consonant and not a click."""
    x = load(sym)
    _, _, release, vowel = first_take(x)
    return fade(cut(x, release * FRAME - FRAME // 2, (vowel + 8) * FRAME), 0.003, 0.025)


def main():
    for letter, sym in VOWELS.items():
        save(f"s_{letter}", level(vowel_clip(sym), 0.17))
    for letter, sym in HELD.items():
        save(f"s_{letter}", level(consonant(sym), 0.14))
    for letter, sym in STOPS.items():
        save(f"s_{letter}", level(stop(sym), 0.17))

    # h: the end of the breath and the first touch of the vowel.
    x = load("h")
    _, _, _, vowel = first_take(x)
    save("s_h", level(fade(cut(x, (vowel - 6) * FRAME, (vowel + 4) * FRAME), 0.02, 0.03), 0.11))

    # w: the glide into the vowel.
    x = load("w")
    _, _, _, vowel = first_take(x)
    save("s_w", level(fade(cut(x, (vowel - 8) * FRAME, (vowel + 3) * FRAME), 0.01, 0.03), 0.13))

    # j: [d] release straight into a short [zh].
    x = load("d")
    _, _, release, _ = first_take(x)
    d = x[release * FRAME - FRAME // 2: (release + 2) * FRAME]
    zh = cap(consonant("zh"), 0.12)
    d = d * (np.abs(zh).max() * 1.3 / max(np.abs(d).max(), 1e-6))
    n = int(SR * 0.008)
    j = np.concatenate([d[:-n], d[-n:] * np.linspace(1, 0, n) + zh[:n] * np.linspace(0, 1, n), zh[n:]])
    save("s_j", level(fade(j, 0.003, 0.03), 0.14))

    # x: a [k] puff then a short [s], both at the recording's own speed.
    k = load("k")
    _, _, release, vowel = first_take(k)
    kk = fade(cut(k, release * FRAME - FRAME // 2, vowel * FRAME), 0.003, 0.01)
    ss = cap(consonant("s"), 0.14)
    gap = np.zeros(int(SR * 0.02), np.float32)
    save("s_x", level(np.concatenate([normalize(kk, 0.6), gap, normalize(ss, 0.6)]), 0.14))

    for f in sorted((ROOT / "audio").glob("s_*.wav")):
        with wave.open(str(f)) as w:
            print(f"{f.stem}: {w.getnframes() / SR:.2f}s")


if __name__ == "__main__":
    main()
