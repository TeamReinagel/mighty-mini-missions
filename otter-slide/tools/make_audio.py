"""Build the letter-sound and word clips with macOS text-to-speech.

Usage (from otter-slide/): python3 tools/make_audio.py
Needs macOS `say` with the "Ava (Premium)" voice, and `afconvert`. Writes audio/*.wav.

Speech engines can't say a lone phonics sound ("sss", short a), so each sound is cut from a
real word: vowels from the middle of p_t words, continuous consonants from the start of a word
(stretched so they can be held, "mmmm"), and stop consonants as a short clipped onset ("b").
"""
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "audio"
VOICE = "Ava (Premium)"
SR = 22050
FRAME = SR // 100  # 10 ms

WORDS = [
    "cat", "cap", "bat", "map", "hat", "fan", "van", "rat", "bag", "jam", "can",
    "dog", "log", "fox", "box", "mop", "pot", "top",
    "pig", "wig", "fin", "six", "bib", "lip", "zip",
    "sun", "bug", "rug", "cup", "bus", "nut", "jug",
    "bed", "hen", "pen", "ten", "net", "jet", "web",
]

# letter -> (how to cut it, source word)
SOUNDS = {
    "a": ("vowel", "pat"), "e": ("vowel", "pet"), "i": ("vowel", "pit"),
    "o": ("vowel", "pot"), "u": ("vowel", "putt"),
    "s": ("hiss", "sun"), "f": ("hiss", "fun"), "h": ("stop", "hut"),
    "m": ("hum", "mud"), "n": ("hum", "nut"), "l": ("hum", "luck"), "r": ("hum", "rug"),
    "v": ("hum", "vest"), "z": ("hum", "zuck"),
    "b": ("stop", "buck"), "c": ("stop", "cut"), "d": ("stop", "duck"), "g": ("stop", "gum"),
    "j": ("stop", "jump"), "p": ("stop", "puck"), "t": ("stop", "tuck"), "w": ("stop", "won"),
    "x": ("tail", "ox"),
}
HOLD = 0.42  # seconds a stretched sound lasts


def speak(text):
    with tempfile.TemporaryDirectory() as d:
        aiff, wav = Path(d) / "t.aiff", Path(d) / "t.wav"
        subprocess.run(["say", "-v", VOICE, "-o", str(aiff), text], check=True)
        subprocess.run(["afconvert", "-f", "WAVE", "-d", f"LEI16@{SR}", "-c", "1", str(aiff), str(wav)], check=True)
        with wave.open(str(wav)) as w:
            return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768


def frames(x):
    n = len(x) // FRAME
    f = x[: n * FRAME].reshape(n, FRAME)
    rms = np.sqrt((f ** 2).mean(1))
    zcr = (np.abs(np.diff(np.sign(f), axis=1)) > 0).mean(1)
    return rms, zcr


def onset(x, thresh=0.01):
    rms, _ = frames(x)
    i = int(np.argmax(rms > thresh))
    return i * FRAME


def trim(x, thresh=0.004):
    rms, _ = frames(x)
    on = np.where(rms > thresh)[0]
    if not len(on):
        return x
    return x[max(0, on[0] - 1) * FRAME: (on[-1] + 2) * FRAME]


def fade(x, inn=0.01, out=0.03):
    x = x.copy()
    a, b = int(SR * inn), int(SR * out)
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


def normalize(x, peak=0.85):
    m = np.abs(x).max()
    return x * (peak / m) if m > 0 else x


def stretch(x, seconds, win=0.03):
    """WSOLA time-stretch: hold a short steady sound longer without changing its pitch."""
    n = int(SR * win)
    hop = n // 2
    target = int(SR * seconds)
    if len(x) < n + 2:
        x = np.tile(x, (n + 2) // max(1, len(x)) + 1)
    w = np.hanning(n)
    out = np.zeros(target + n)
    norm = np.zeros(target + n)
    tol = n // 3
    prev = 0
    for k in range(0, target, hop):
        ideal = int(k / target * (len(x) - n))
        if k == 0:
            pos = ideal
        else:
            # Pick the input position whose start best continues the previous grain.
            want = x[prev + hop: prev + hop + n] if prev + hop + n <= len(x) else None
            lo, hi = max(0, ideal - tol), min(len(x) - n, ideal + tol)
            pos = ideal
            if want is not None and hi > lo:
                best = -np.inf
                for p in range(lo, hi):
                    c = float(np.dot(want[:hop], x[p: p + hop]))
                    if c > best:
                        best, pos = c, p
        out[k: k + n] += w * x[pos: pos + n]
        norm[k: k + n] += w
        prev = pos
    return out[:target] / np.maximum(norm[:target], 1e-3)


def cut(kind, word):
    x = speak(word)
    rms, zcr = frames(x)
    start = onset(x)
    i0 = start // FRAME
    if kind == "vowel":
        # The voiced stretch after the p burst and before the t closure; keep its steady middle.
        voiced = (rms > 0.02) & (zcr < 0.2)
        run_start = i0 + int(np.argmax(voiced[i0:]))
        run_end = run_start + int(np.argmin(voiced[run_start:])) if not voiced[run_start:].all() else len(voiced)
        a, b = run_start * FRAME, run_end * FRAME
        mid = x[a + (b - a) // 4: b - (b - a) // 6]
        return stretch(mid, HOLD)
    if kind == "hiss":
        # Voiceless run at the start of the word, before the vowel begins.
        end = i0 + int(np.argmax((zcr[i0:] < 0.2) & (rms[i0:] > 0.02)))
        seg = x[start + FRAME: max(start + 3 * FRAME, end * FRAME - FRAME)]
        return stretch(seg, HOLD * 0.9)
    if kind == "hum":
        # First few voiced frames of the word: the consonant before the vowel.
        seg = x[start + FRAME: start + 6 * FRAME]
        return stretch(seg, HOLD * 0.9)
    if kind == "stop":
        # Burst plus the very start of the vowel, clipped short so it's "b", not "buh".
        voice = i0 + int(np.argmax((zcr[i0:] < 0.2) & (rms[i0:] > 0.03)))
        end = max(start + 11 * FRAME, voice * FRAME + 5 * FRAME)
        return x[max(0, start - FRAME // 2): end]
    if kind == "tail":
        # Everything after the last silent gap (the closure before a final "ks").
        quiet = rms < 0.006
        last_loud = len(rms) - 1 - int(np.argmax(rms[::-1] > 0.006))
        gap = last_loud - int(np.argmax(quiet[:last_loud][::-1])) if quiet[:last_loud].any() else i0
        return x[gap * FRAME: (last_loud + 1) * FRAME]
    raise ValueError(kind)


def save(name, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    OUT.mkdir(exist_ok=True)
    for letter, (kind, word) in SOUNDS.items():
        x = normalize(fade(cut(kind, word), 0.008, 0.035 if kind != "stop" else 0.05))
        save(f"s_{letter}", x)
        print(f"s_{letter}: {len(x) / SR:.2f}s from '{word}' ({kind})")
    for word in WORDS:
        x = normalize(fade(trim(speak(word)), 0.005, 0.02))
        save(f"w_{word}", x)
    print(f"{len(WORDS)} words written")


if __name__ == "__main__":
    main()
