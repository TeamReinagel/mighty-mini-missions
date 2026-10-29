"""Build the letter-sound clips (audio/s_*.wav) from the ElevenLabs recordings.

Usage (from otter-slide/): python3 tools/make_letter_sounds.py

Sources are the phoneme files in tools/source/elevenlabs/, copied from the
homeschool "Letter Sounds" folder. Each name is the sound, not the letter:
short a is a, short e is eh, short i is ih, short o is ah (the vowel in "pot"),
short u is uh, and c is the k sound. Clips are trimmed to the spoken part and
capped at just under half a second so a tap, a slide, and "c... a... t" still
say one sound at a time. Nothing is time-stretched.
"""
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_audio import SR, fade, save  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "source" / "elevenlabs"
# letter in the game -> phoneme file. c in cat/cup is the k sound.
LETTERS = {
    "a": "a", "e": "eh", "i": "ih", "o": "ah", "u": "uh",
    "b": "b", "c": "k", "d": "d", "f": "f", "g": "g", "h": "h",
    "j": "j", "l": "l", "m": "m", "n": "n", "p": "p", "r": "r",
    "s": "s", "t": "t", "v": "v", "w": "w", "x": "x", "z": "z",
}
# Otter Slide starts the next letter 0.55s later when it sounds a word out.
MAX_SECONDS = 0.48


def level(x, target, peak=0.95):
    """Scale to a loudness (RMS) so the sounds match each other, without clipping."""
    rms = float(np.sqrt((x ** 2).mean()))
    if rms <= 0:
        return x
    return x * min(target / rms, peak / float(np.abs(x).max()))


def load(name):
    mp3 = SRC / f"{name}.mp3"
    wav = SRC / f"{name}.wav"
    subprocess.run(
        ["afconvert", "-f", "WAVE", "-d", f"LEI16@{SR}", "-c", "1", str(mp3), str(wav)],
        check=True,
    )
    with wave.open(str(wav)) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    wav.unlink()
    return x


def spoken(x):
    """The part that is actually sound, starting at the attack, not the long tail."""
    hop = SR // 100
    n = len(x) // hop
    if n == 0:
        return x
    rms = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1))
    thr = max(0.0035, float(rms.max()) * 0.18)
    on = np.where(rms > thr)[0]
    if not len(on):
        return x
    a = max(0, on[0] * hop - int(SR * 0.015))
    b = min(len(x), (on[-1] + 1) * hop + int(SR * 0.04))
    seg = x[a:b]
    cap = int(SR * MAX_SECONDS)
    if len(seg) > cap:
        seg = seg[:cap]
    return fade(seg, 0.008, 0.035)


def main():
    missing = [name for name in LETTERS.values() if not (SRC / f"{name}.mp3").exists()]
    if missing:
        sys.exit(f"missing recordings: {', '.join(missing)}")
    for letter, name in LETTERS.items():
        save(f"s_{letter}", level(spoken(load(name)), 0.13))
    for f in sorted((ROOT / "audio").glob("s_*.wav")):
        with wave.open(str(f)) as w:
            print(f"{f.stem}: {w.getnframes() / SR:.2f}s")


if __name__ == "__main__":
    main()
