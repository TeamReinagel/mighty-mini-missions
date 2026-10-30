# The Moon Path · Recording notes

A narrated adaptation of the complete Mighty Mini Missions premiere. The listener remains the third explorer. The prose describes everything needed to follow the story without animation. The occasional invitation to hum or think is followed by the story's resolution, so the recording plays through without a button, response detector, or branching edit.

## Files

- `the-moon-path-audiobook.txt`: complete annotated master. Every change of actor is marked `[VOICE: NARRATOR]`, `[VOICE: LARK]`, or `[VOICE: NIB]`.
- `the-moon-path-elevenlabs-import.txt`: identical spoken manuscript and delivery tags, with the editor-only voice labels removed. Use this for import into ElevenLabs Studio.
- `the-moon-path-voice-blocks.csv`: the same manuscript in 146 numbered voice blocks, for reference or a custom production workflow. This CSV is not a native Studio import format.

## Cast and performance

**Narrator:** an inviting adult storyteller; warm, observant, and lightly amused. This could be the established Joyce voice. Read the prose as a story being told to one child. Let the more exciting passages pick up naturally without rushing the clues. The narrator is telling the story, rather than appearing as an extra character at the dock.

**Lark:** a distinct, clear voice; capable, curious, and affectionate. She enjoys figuring things out with the listener. Keep her invitations conversational.

**Nib:** a distinct, bright voice; earnest, impulsive, and confident in his inventions. Let his certainty carry the jokes. A natural speaking voice will work better here than a very high squeak.

All three are roles to which you assign your chosen ElevenLabs voices; these are not ElevenLabs voice IDs. Each `[VOICE: ...]` cue applies until the next one. Quotation marks surround character speech; narration between them is also recorded.

## ElevenLabs setup

Create an Audio project in Studio and import the clean TXT. Choose Eleven v4 or Eleven v3 for the square-bracket delivery tags. Use the annotated master to assign Narrator, Lark, and Nib to their text, then generate, review, and export the whole project as one recording. Studio supports text imports, assigning voices to selected passages, and exporting a project. [Official Studio guide](https://elevenlabs.io/docs/eleven-creative/products/studio)

**The `[VOICE: ...]` labels are editing annotations, not native voice-switch commands.** Remove those labels from the synthesis text after assigning voices, or use the clean import copy. In Text to Dialogue, the actual voice is selected separately for each turn; audio tags guide its delivery. [Official Text to Dialogue guide](https://elevenlabs.io/docs/overview/capabilities/text-to-dialogue)

Keep tags such as `[excited]`, `[whispering]`, `[short pause]`, and `[long pause]` in the synthesis text. Tags are performance requests; they do not guarantee exact pause lengths. If a listening beat needs more room, extend it in the editor after listening. [Official audio-tag guide](https://elevenlabs.io/blog/v3-audiotags)

## Listening check

The manuscript has **about 2,700 spoken words**. At roughly 125–145 words per minute, expect about **19–22 minutes of speech**, plus pauses. This is an estimate; no new ElevenLabs recording has been generated or timed. This prose version is longer than the original episode's 15-minute production target.

`Mmm` means the comfortable, closed-lip consonant hum, without an added “uh.” The printed letter `m` may be read as its name when the text identifies the letter. Check the hum, the opening sound of “moss” and “mushroom,” and the shape directions before rendering the full project. If the model says “em” where the script requests a hum, replace that short take with a clean hum.

The listener's actions are imagined events within a fixed story, not records of what a child actually answered or learned. The prose retains the torn map, Treasure Tree mystery, lagoon crossing, sound trail, ferry book, letter repair, mouse rescue, moonstone reveal, treasure collection, journal, and orchard ending.
