"""Build the whole-word clips (audio/w_*.wav) with macOS text-to-speech.

Usage (from otter-slide/): python3 tools/make_audio.py
Needs macOS `say` with the "Ava (Premium)" voice, and `afconvert`. Writes audio/w_*.wav.
The letter sounds come from human recordings instead: see make_letter_sounds.py.
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


def save(name, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    OUT.mkdir(exist_ok=True)
    for word in WORDS:
        x = normalize(fade(trim(speak(word)), 0.005, 0.02))
        save(f"w_{word}", x)
    print(f"{len(WORDS)} words written")


if __name__ == "__main__":
    main()
