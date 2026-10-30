// Mighty Mini Missions · The Moon Path
// Full premiere content. Dialogue follows speech completion; only action beats carry fixed timing.
// Voice practice and supported rereads do not assess independent sound production.

export const EPISODE = {
  "title": "The Moon Path",
  "version": "moonpath-layered-v1",
  "scenes": [
    {
      "id": "excellent-brakes",
      "title": "An expedition with excellent brakes",
      "background": "camp",
      "mapStop": "camp",
      "beats": [
        {
          "id": "s1-wagon-entry",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "wagon",
          "action": "wagon-roll"
        },
        {
          "id": "s1-good-news",
          "kind": "line",
          "speaker": "nib",
          "text": "Lark! Good news! The Adventure Wagon is very fast!",
          "shot": "nib",
          "stage": "wagon"
        },
        {
          "id": "s1-brakes-question",
          "kind": "line",
          "speaker": "lark",
          "text": "And the brakes?",
          "shot": "lark",
          "stage": "wagon"
        },
        {
          "id": "s1-other-news",
          "kind": "line",
          "speaker": "nib",
          "text": "That's the other news!",
          "shot": "nib",
          "stage": "wagon"
        },
        {
          "id": "s1-runaway",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "wagon",
          "action": "wagon-roll"
        },
        {
          "id": "s1-scarf",
          "kind": "line",
          "speaker": "lark",
          "text": "Scarf!",
          "shot": "lark",
          "stage": "wagon"
        },
        {
          "id": "s1-scarf-stop",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "wagon",
          "action": "wagon-stop"
        },
        {
          "id": "s1-excellent",
          "kind": "line",
          "speaker": "nib",
          "text": "Excellent brakes.",
          "shot": "nib",
          "stage": "wagon"
        },
        {
          "id": "s1-discover-case",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 3,
          "stage": "case",
          "action": "map-open"
        },
        {
          "id": "s1-treasure-already",
          "kind": "line",
          "speaker": "nib",
          "text": "Did we find treasure already?",
          "shot": "nib",
          "stage": "case"
        },
        {
          "id": "s1-latch",
          "kind": "challenge",
          "type": "latch",
          "speaker": "lark",
          "text": "We found something. Want to open it with us? Lift that latch.",
          "shot": "interaction",
          "stage": "case",
          "expected": "open",
          "correct": {
            "id": "s1-latch-correct",
            "speaker": "nib",
            "text": "Let's see what's in here."
          },
          "incorrect": {
            "id": "s1-latch-retry",
            "speaker": "lark",
            "text": "The latch is right here on the front. Lift it to open the case."
          },
          "hint": {
            "id": "s1-latch-hint",
            "speaker": "lark",
            "text": "Touch the brass latch, or say open."
          },
          "choices": [
            {
              "id": "open",
              "label": "Lift the latch",
              "say": "open"
            }
          ]
        },
        {
          "id": "s1-case-open",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 3,
          "stage": "map",
          "action": "map-open"
        },
        {
          "id": "s1-clear-view",
          "kind": "line",
          "speaker": "nib",
          "text": "I can see where we're going!",
          "shot": "nib",
          "stage": "map"
        },
        {
          "id": "s1-hole",
          "kind": "line",
          "speaker": "lark",
          "text": "That's a hole.",
          "shot": "lark",
          "stage": "map"
        },
        {
          "id": "s1-clear-map",
          "kind": "line",
          "speaker": "nib",
          "text": "A very clear map.",
          "shot": "nib",
          "stage": "map"
        },
        {
          "id": "s1-introductions",
          "kind": "line",
          "speaker": "lark",
          "text": "I'm Lark. This is Nib. I draw maps.",
          "shot": "two",
          "stage": "map"
        },
        {
          "id": "s1-build",
          "kind": "line",
          "speaker": "nib",
          "text": "I build things.",
          "shot": "nib",
          "stage": "map"
        },
        {
          "id": "s1-finished",
          "kind": "line",
          "speaker": "nib",
          "text": "Almost finished things.",
          "shot": "nib",
          "stage": "map"
        },
        {
          "id": "s1-explorer",
          "kind": "line",
          "speaker": "lark",
          "text": "We could use another explorer.",
          "shot": "lark",
          "stage": "map"
        },
        {
          "id": "s1-map-reveal",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "map",
          "action": "map-open"
        },
        {
          "id": "s1-tree",
          "kind": "line",
          "speaker": "lark",
          "text": "The Treasure Tree.",
          "shot": "two",
          "stage": "map"
        }
      ]
    },
    {
      "id": "missing-map",
      "title": "A map with something missing",
      "background": "camp",
      "mapStop": "camp",
      "beats": [
        {
          "id": "s2-tree-treasure",
          "kind": "line",
          "speaker": "nib",
          "text": "Does the tree grow treasure?",
          "shot": "nib",
          "stage": "map"
        },
        {
          "id": "s2-room",
          "kind": "line",
          "speaker": "lark",
          "text": "There's a secret room inside it. Nobody at camp has found the way in.",
          "shot": "lark",
          "stage": "map"
        },
        {
          "id": "s2-first-map",
          "kind": "line",
          "speaker": "lark",
          "text": "My first camp map had this tree on it. I've wanted to find it ever since.",
          "shot": "lark",
          "stage": "map"
        },
        {
          "id": "s2-inside",
          "kind": "line",
          "speaker": "nib",
          "text": "What do you think is inside?",
          "shot": "nib",
          "stage": "map"
        },
        {
          "id": "s2-dont-know",
          "kind": "line",
          "speaker": "lark",
          "text": "I don't know yet. That's my favorite part.",
          "shot": "lark",
          "stage": "map"
        },
        {
          "id": "s2-fit",
          "kind": "line",
          "speaker": "nib",
          "text": "I could fit through that little door.",
          "shot": "nib",
          "stage": "map"
        },
        {
          "id": "s2-measure",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "two",
          "duration": 2,
          "stage": "map",
          "action": "map-open"
        },
        {
          "id": "s2-wriggling",
          "kind": "line",
          "speaker": "nib",
          "text": "With a small amount of wriggling.",
          "shot": "nib",
          "stage": "map"
        },
        {
          "id": "s2-missing",
          "kind": "line",
          "speaker": "lark",
          "text": "First we have to find it. Look. Most of the map is missing.",
          "shot": "lark",
          "stage": "map"
        },
        {
          "id": "s2-moonstone",
          "kind": "line",
          "speaker": "lark",
          "text": "But this piece shows our first treasure. A moonstone.",
          "shot": "two",
          "stage": "map"
        },
        {
          "id": "s2-start",
          "kind": "line",
          "speaker": "nib",
          "text": "Then that's where we start. With the bit we've got.",
          "shot": "nib",
          "stage": "map"
        },
        {
          "id": "s2-moon-rock",
          "kind": "line",
          "speaker": "nib",
          "text": "A rock from the moon?",
          "shot": "nib",
          "stage": "map"
        },
        {
          "id": "s2-hidden-trail",
          "kind": "line",
          "speaker": "lark",
          "text": "Maybe. See its light on the map? It makes a hidden trail appear.",
          "shot": "lark",
          "stage": "map"
        },
        {
          "id": "s2-lantern-light",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "map",
          "action": "stone-reveal"
        },
        {
          "id": "s2-next-piece",
          "kind": "line",
          "speaker": "lark",
          "text": "If we find that stone, we can look for the next missing piece.",
          "shot": "lark",
          "stage": "map"
        },
        {
          "id": "s2-flies-away",
          "kind": "line",
          "speaker": "nib",
          "text": "Let's find the rest before this one flies away.",
          "shot": "nib",
          "stage": "map"
        },
        {
          "id": "s2-route",
          "kind": "challenge",
          "type": "route",
          "speaker": "lark",
          "text": "Lagoon, woods, river. Will you show us the trail?",
          "shot": "interaction",
          "stage": "map",
          "expected": "river",
          "correct": {
            "id": "s2-route-correct",
            "speaker": "nib",
            "text": "You do the navigating. I'll carry the very important equipment."
          },
          "incorrect": {
            "id": "s2-route-retry",
            "speaker": "lark",
            "text": "Our trail goes from the lagoon, through the woods, to the river."
          },
          "hint": {
            "id": "s2-route-hint",
            "speaker": "lark",
            "text": "Follow the dotted line. Lagoon first, then woods, then river."
          },
          "choices": [
            {
              "id": "lagoon",
              "label": "Lagoon",
              "say": "lagoon"
            },
            {
              "id": "woods",
              "label": "Woods",
              "say": "woods"
            },
            {
              "id": "river",
              "label": "River",
              "say": "river"
            }
          ]
        },
        {
          "id": "s2-rope",
          "kind": "line",
          "speaker": "lark",
          "text": "We'll take this too.",
          "shot": "two",
          "stage": "map"
        },
        {
          "id": "s2-depart",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 7,
          "stage": "map",
          "action": "travel"
        }
      ]
    },
    {
      "id": "letter-lagoon",
      "title": "The little letter at the lagoon",
      "background": "lagoon",
      "mapStop": "lagoon",
      "beats": [
        {
          "id": "s3-arrive",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "lagoon",
          "action": "travel"
        },
        {
          "id": "s3-umbrella",
          "kind": "line",
          "speaker": "lark",
          "text": "That is not a boat.",
          "shot": "lark",
          "stage": "lagoon"
        },
        {
          "id": "s3-small-boat",
          "kind": "line",
          "speaker": "nib",
          "text": "It could be a very small boat.",
          "shot": "nib",
          "stage": "lagoon"
        },
        {
          "id": "s3-trail-machines",
          "kind": "line",
          "speaker": "lark",
          "text": "The old explorers put letter keys on their trail machines. Each key has a sound.",
          "shot": "lark",
          "stage": "lagoon"
        },
        {
          "id": "s3-letter-intro",
          "kind": "line",
          "speaker": "lark",
          "text": "Here's a better way. This little letter is m. It makes this sound: mmm.",
          "shot": "lark",
          "stage": "lagoon",
          "speakText": "Here's a better way. This little letter is em. It makes this sound. Mmm."
        },
        {
          "id": "s3-hum",
          "kind": "challenge",
          "type": "hum",
          "speaker": "lark",
          "text": "Lips together. Mmm. Can you make it with us?",
          "shot": "interaction",
          "stage": "lagoon",
          "expected": "m",
          "correct": {
            "id": "s3-hum-correct",
            "speaker": "nib",
            "text": "My nose is doing it too."
          },
          "incorrect": {
            "id": "s3-hum-retry",
            "speaker": "lark",
            "text": "Just a little hum. Mmm. You can hold the letter and listen with us."
          },
          "hint": {
            "id": "s3-hum-hint",
            "speaker": "lark",
            "text": "Put your lips together, gently. Mmm. Or touch m to listen."
          },
          "choices": [
            {
              "id": "m",
              "label": "Hold m and hum",
              "say": "mmm"
            }
          ]
        },
        {
          "id": "s3-working",
          "kind": "line",
          "speaker": "nib",
          "text": "Working properly.",
          "shot": "nib",
          "stage": "lagoon"
        },
        {
          "id": "s3-feel",
          "kind": "line",
          "speaker": "lark",
          "text": "Can you feel yours? Just a little hum. Mmm.",
          "shot": "lark",
          "stage": "lagoon"
        },
        {
          "id": "s3-moon-beginning",
          "kind": "line",
          "speaker": "lark",
          "text": "That's /m/. Listen to the beginning of moon: mmm…oon.",
          "shot": "lark",
          "stage": "lagoon",
          "speakText": "That's mmm. Listen to the beginning of moon. Mmm, oon. Moon."
        },
        {
          "id": "s3-moon-sound",
          "kind": "line",
          "speaker": "lark",
          "text": "Moon starts with /m/. And this letter shows that sound.",
          "shot": "lark",
          "stage": "lagoon",
          "speakText": "Moon starts with mmm. And this letter shows that sound."
        },
        {
          "id": "s3-first-platform",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "lagoon",
          "action": "bridge-rise"
        },
        {
          "id": "s3-dropped",
          "kind": "line",
          "speaker": "nib",
          "text": "I think your bridge dropped something.",
          "shot": "nib",
          "stage": "lagoon"
        },
        {
          "id": "s3-letter",
          "kind": "challenge",
          "type": "letter",
          "speaker": "lark",
          "text": "We need the letter for /m/. Put it back in the machine.",
          "shot": "interaction",
          "stage": "lagoon",
          "expected": "m",
          "correct": {
            "id": "s3-letter-correct",
            "speaker": "nib",
            "text": "A bridge you can hear!"
          },
          "incorrect": {
            "id": "s3-letter-retry",
            "speaker": "lark",
            "text": "That one makes a different sound. Find m, for mmm."
          },
          "hint": {
            "id": "s3-letter-hint",
            "speaker": "lark",
            "text": "Listen: mmm. Look for the little letter with two humps."
          },
          "choices": [
            {
              "id": "m",
              "label": "m",
              "say": "mmm"
            },
            {
              "id": "s",
              "label": "s",
              "say": "sss"
            }
          ],
          "speakText": "We need the letter for mmm. Put it back in the machine."
        },
        {
          "id": "s3-full-bridge",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "lagoon",
          "action": "bridge-rise"
        },
        {
          "id": "s3-cross",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 7,
          "stage": "lagoon",
          "action": "cross-bridge"
        },
        {
          "id": "s3-across",
          "kind": "line",
          "speaker": "lark",
          "text": "Key in. Bridge up. Explorers across.",
          "shot": "two",
          "stage": "lagoon"
        },
        {
          "id": "s3-better-boat",
          "kind": "line",
          "speaker": "nib",
          "text": "I like this boat much better.",
          "shot": "nib",
          "stage": "lagoon"
        }
      ]
    },
    {
      "id": "nibs-shortcut",
      "title": "Nib's shortcut",
      "background": "woods",
      "mapStop": "woods",
      "beats": [
        {
          "id": "s4-into-woods",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 5,
          "stage": "woods-moss",
          "action": "travel"
        },
        {
          "id": "s4-moon-trail",
          "kind": "line",
          "speaker": "lark",
          "text": "The moon trail. Moss, mushroom, then the dock.",
          "shot": "two",
          "stage": "woods-moss"
        },
        {
          "id": "s4-shortcut",
          "kind": "line",
          "speaker": "nib",
          "text": "Or… that way.",
          "shot": "nib",
          "stage": "woods-moss"
        },
        {
          "id": "s4-mud",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "woods-moss",
          "action": "mud-stuck"
        },
        {
          "id": "s4-long-cut",
          "kind": "line",
          "speaker": "nib",
          "text": "The shortcut has become a long cut.",
          "shot": "nib",
          "stage": "woods-moss"
        },
        {
          "id": "s4-pull-free",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 6,
          "stage": "woods-moss",
          "action": "mud-free"
        },
        {
          "id": "s4-clues",
          "kind": "line",
          "speaker": "lark",
          "text": "Let's use the trail clues.",
          "shot": "lark",
          "stage": "woods-moss"
        },
        {
          "id": "s4-wheels",
          "kind": "line",
          "speaker": "nib",
          "text": "You find the way. I'll watch the wheels.",
          "shot": "nib",
          "stage": "woods-moss"
        },
        {
          "id": "s4-help",
          "kind": "line",
          "speaker": "lark",
          "text": "That should help.",
          "shot": "lark",
          "stage": "woods-moss"
        },
        {
          "id": "s4-moss",
          "kind": "challenge",
          "type": "moss",
          "speaker": "lark",
          "text": "Listen: moss. Mmm…oss. Rock. Which one starts with /m/?",
          "shot": "interaction",
          "stage": "woods-moss",
          "expected": "moss",
          "correct": {
            "id": "s4-moss-correct",
            "speaker": "nib",
            "text": "It's a carpet. The woods have a carpet."
          },
          "incorrect": {
            "id": "s4-moss-retry",
            "speaker": "lark",
            "text": "Rock. Listen to the beginning: rock. We need mmm…oss. Try that beginning with me."
          },
          "hint": {
            "id": "s4-moss-hint",
            "speaker": "lark",
            "text": "Moss. Rock. Listen for mmm at the start: mmm…oss."
          },
          "choices": [
            {
              "id": "moss",
              "label": "Moss",
              "say": "moss"
            },
            {
              "id": "rock",
              "label": "Rock",
              "say": "rock"
            }
          ],
          "speakText": "Listen. Moss. Mmm, oss. Moss. Rock. Which one starts with mmm?"
        },
        {
          "id": "s4-moss-path",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "woods-moss",
          "action": "travel"
        },
        {
          "id": "s4-mushroom",
          "kind": "challenge",
          "type": "mushroom",
          "speaker": "lark",
          "text": "Next clue. Mushroom. Flower. Find the one that starts with /m/.",
          "shot": "interaction",
          "stage": "woods-mushroom",
          "expected": "mushroom",
          "correct": {
            "id": "s4-mushroom-correct",
            "speaker": "nib",
            "text": "Tiny mushroom. Big woods. Same beginning."
          },
          "incorrect": {
            "id": "s4-mushroom-retry",
            "speaker": "lark",
            "text": "Flower starts a different way. Listen: mmm…ushroom. Which path has the mushroom?"
          },
          "hint": {
            "id": "s4-mushroom-hint",
            "speaker": "lark",
            "text": "Mushroom. Mmm…ushroom. Listen to its beginning."
          },
          "choices": [
            {
              "id": "mushroom",
              "label": "Mushroom",
              "say": "mushroom"
            },
            {
              "id": "flower",
              "label": "Flower",
              "say": "flower"
            }
          ],
          "speakText": "Next clue. Mushroom. Flower. Find the one that starts with mmm."
        },
        {
          "id": "s4-river-view",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 6,
          "stage": "woods-mushroom",
          "action": "travel"
        },
        {
          "id": "s4-listened",
          "kind": "line",
          "speaker": "lark",
          "text": "That's what we listened for.",
          "shot": "lark",
          "stage": "woods-mushroom"
        },
        {
          "id": "s4-listen-river",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "two",
          "duration": 3,
          "stage": "woods-mushroom",
          "action": "travel"
        },
        {
          "id": "s4-treasure-spotted",
          "kind": "line",
          "speaker": "nib",
          "text": "There! That's our treasure!",
          "shot": "nib",
          "stage": "woods-mushroom"
        },
        {
          "id": "s4-mud-boot",
          "kind": "line",
          "speaker": "nib",
          "text": "You can keep that.",
          "shot": "nib",
          "stage": "woods-mushroom"
        }
      ]
    },
    {
      "id": "ferrymans-book",
      "title": "The ferryman's book",
      "background": "river",
      "mapStop": "shore",
      "beats": [
        {
          "id": "s5-dock",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "river-book",
          "action": "travel"
        },
        {
          "id": "s5-boat-book",
          "kind": "line",
          "speaker": "nib",
          "text": "A book about our boat.",
          "shot": "nib",
          "stage": "river-book"
        },
        {
          "id": "s5-bring-over",
          "kind": "line",
          "speaker": "lark",
          "text": "Let's see how to bring it over.",
          "shot": "lark",
          "stage": "river-book"
        },
        {
          "id": "s5-open-book",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "river-book",
          "action": "book-open"
        },
        {
          "id": "s5-book-one",
          "kind": "line",
          "speaker": "lark",
          "text": "The moon ferry carries a special lantern. Its moonstone light can show paths hidden in explorer maps.",
          "shot": "interaction",
          "stage": "river-book"
        },
        {
          "id": "s5-page-one",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 3,
          "stage": "river-book",
          "action": "book-open"
        },
        {
          "id": "s5-book-two",
          "kind": "line",
          "speaker": "lark",
          "text": "When the explorer finished a journey, the lantern came home on the ferry, ready for another adventure.",
          "shot": "interaction",
          "stage": "river-book"
        },
        {
          "id": "s5-need",
          "kind": "line",
          "speaker": "nib",
          "text": "That's exactly what we need.",
          "shot": "nib",
          "stage": "river-book"
        },
        {
          "id": "s5-same",
          "kind": "line",
          "speaker": "nib",
          "text": "It's the same lantern. Same boat, too.",
          "shot": "nib",
          "stage": "river-book"
        },
        {
          "id": "s5-dock-book",
          "kind": "line",
          "speaker": "lark",
          "text": "This book belongs to this dock. It can show us what to do.",
          "shot": "lark",
          "stage": "river-book"
        },
        {
          "id": "s5-coread",
          "kind": "challenge",
          "type": "coread",
          "speaker": "lark",
          "text": "To call the ferry home, first mend the mark on the dock. The mark is…",
          "shot": "interaction",
          "stage": "river-book",
          "expected": "m",
          "correct": {
            "id": "s5-coread-correct",
            "speaker": "lark",
            "text": "…m. Then ring the bell beside the same mark. The ferry will come home.",
            "speakText": "Em. Then ring the bell beside the same mark. The ferry will come home."
          },
          "incorrect": {
            "id": "s5-coread-retry",
            "speaker": "lark",
            "text": "This is our little letter m. You can make its sound, or hold the sound track and listen."
          },
          "hint": {
            "id": "s5-coread-hint",
            "speaker": "lark",
            "text": "Put your lips together. Mmm. You can slide beneath m to read with me."
          },
          "choices": [
            {
              "id": "m",
              "label": "m",
              "say": "mmm"
            }
          ]
        },
        {
          "id": "s5-book-plan",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 3,
          "stage": "river-book",
          "action": "book-open"
        },
        {
          "id": "s5-sequence",
          "kind": "challenge",
          "type": "sequence",
          "speaker": "nib",
          "text": "Hang on. What comes first? Fix the mark, or ring the bell?",
          "shot": "interaction",
          "stage": "river-book",
          "expected": "repair",
          "correct": {
            "id": "s5-sequence-correct",
            "speaker": "nib",
            "text": "Right. I'll get the boat rope ready. You fix the mark."
          },
          "incorrect": {
            "id": "s5-sequence-retry",
            "speaker": "lark",
            "text": "The mark is broken, so the call cannot reach the boat. Let’s mend it first."
          },
          "hint": {
            "id": "s5-sequence-hint",
            "speaker": "lark",
            "text": "The book shows two things. First mend the mark. Then ring its bell."
          },
          "choices": [
            {
              "id": "repair",
              "label": "Fix the mark",
              "say": "fix it"
            },
            {
              "id": "bell",
              "label": "Ring the bell",
              "say": "ring the bell"
            }
          ]
        },
        {
          "id": "s5-spare",
          "kind": "line",
          "speaker": "nib",
          "text": "And one spare.",
          "shot": "nib",
          "stage": "river-book"
        }
      ]
    },
    {
      "id": "little-letter-big-job",
      "title": "A little letter does a big job",
      "background": "river",
      "mapStop": "river",
      "beats": [
        {
          "id": "s6-groove",
          "kind": "line",
          "speaker": "lark",
          "text": "The groove is still here. We can mend it.",
          "shot": "lark",
          "stage": "river-trace"
        },
        {
          "id": "s6-rope-ready",
          "kind": "line",
          "speaker": "nib",
          "text": "I'll keep the rope ready. Tell me when you need me.",
          "shot": "nib",
          "stage": "river-trace"
        },
        {
          "id": "s6-demo",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 5,
          "stage": "river-trace",
          "action": "repair-glow"
        },
        {
          "id": "s6-trace",
          "kind": "challenge",
          "type": "trace",
          "speaker": "lark",
          "text": "Start at the bright dot. Down. Back up and over, down. Up and over, down.",
          "shot": "interaction",
          "stage": "river-trace",
          "expected": "m",
          "correct": {
            "id": "s6-trace-correct",
            "speaker": "nib",
            "text": "Look! It goes all the way to the bell."
          },
          "incorrect": {
            "id": "s6-trace-retry",
            "speaker": "lark",
            "text": "Here's the start."
          },
          "hint": {
            "id": "s6-trace-hint",
            "speaker": "lark",
            "text": "Follow the little light around this hill. You can lift your finger and keep going."
          },
          "choices": [
            {
              "id": "m",
              "label": "Trace m",
              "say": "m"
            }
          ]
        },
        {
          "id": "s6-circuit",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 5,
          "stage": "river-trace",
          "action": "repair-glow"
        },
        {
          "id": "s6-joined",
          "kind": "line",
          "speaker": "lark",
          "text": "The broken bit is joined up.",
          "shot": "lark",
          "stage": "river-trace"
        },
        {
          "id": "s6-boat-bit",
          "kind": "line",
          "speaker": "nib",
          "text": "Now for the boat bit.",
          "shot": "nib",
          "stage": "river-trace"
        },
        {
          "id": "s6-ferry-arrives",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 7,
          "stage": "river-rescue",
          "action": "boat-arrive"
        },
        {
          "id": "s6-made-m",
          "kind": "line",
          "speaker": "lark",
          "text": "You made m. Now its sound can call the ferry.",
          "shot": "lark",
          "stage": "river-rescue",
          "speakText": "You made em. Now its sound can call the ferry."
        },
        {
          "id": "s6-hello-treasure",
          "kind": "line",
          "speaker": "nib",
          "text": "Hello, treasure.",
          "shot": "nib",
          "stage": "river-rescue"
        },
        {
          "id": "s6-boat-away",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 5,
          "stage": "river-rescue",
          "action": "boat-drift"
        },
        {
          "id": "s6-lark",
          "kind": "line",
          "speaker": "nib",
          "text": "Lark?",
          "shot": "nib",
          "stage": "river-rescue"
        },
        {
          "id": "s6-see-it",
          "kind": "line",
          "speaker": "lark",
          "text": "I see it.",
          "shot": "lark",
          "stage": "river-rescue"
        },
        {
          "id": "s6-leaving",
          "kind": "line",
          "speaker": "nib",
          "text": "The boat is doing a leaving.",
          "shot": "nib",
          "stage": "river-rescue"
        }
      ]
    },
    {
      "id": "bring-mouse-home",
      "title": "Bring our mouse home",
      "background": "river",
      "mapStop": "river",
      "beats": [
        {
          "id": "s7-slow-current",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "river-rescue",
          "action": "boat-drift"
        },
        {
          "id": "s7-still-not",
          "kind": "line",
          "speaker": "nib",
          "text": "Still not a boat.",
          "shot": "nib",
          "stage": "river-rescue"
        },
        {
          "id": "s7-safe-stone",
          "kind": "line",
          "speaker": "lark",
          "text": "Keep the stone safe. We can call you back.",
          "shot": "lark",
          "stage": "river-rescue"
        },
        {
          "id": "s7-got-it",
          "kind": "line",
          "speaker": "nib",
          "text": "I've got the rope. I've got the lantern.",
          "shot": "nib",
          "stage": "river-rescue"
        },
        {
          "id": "s7-ready",
          "kind": "line",
          "speaker": "nib",
          "text": "Ready when you are.",
          "shot": "nib",
          "stage": "river-rescue"
        },
        {
          "id": "s7-bell",
          "kind": "challenge",
          "type": "bell",
          "speaker": "lark",
          "text": "Which letter makes /m/? Ring its bell.",
          "shot": "interaction",
          "stage": "river-rescue",
          "expected": "m",
          "correct": {
            "id": "s7-bell-correct",
            "speaker": "nib",
            "text": "I'm doing a coming back!"
          },
          "incorrect": {
            "id": "s7-bell-retry",
            "speaker": "lark",
            "text": "That bell has a different sound. We need m, for mmm. Look at the letters."
          },
          "hint": {
            "id": "s7-bell-hint",
            "speaker": "lark",
            "text": "Listen to the sound: mmm. Find its letter. You can touch a letter to hear its sound."
          },
          "choices": [
            {
              "id": "m",
              "label": "m",
              "say": "mmm"
            },
            {
              "id": "s",
              "label": "s",
              "say": "sss"
            }
          ],
          "speakText": "Which letter makes mmm? Ring its bell."
        },
        {
          "id": "s7-return",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 8,
          "stage": "river-rescue",
          "action": "boat-return"
        },
        {
          "id": "s7-rope-on",
          "kind": "line",
          "speaker": "lark",
          "text": "Rope on!",
          "shot": "lark",
          "stage": "river-rescue"
        },
        {
          "id": "s7-stopped",
          "kind": "line",
          "speaker": "nib",
          "text": "Boat stopped!",
          "shot": "nib",
          "stage": "river-rescue"
        },
        {
          "id": "s7-delivered",
          "kind": "line",
          "speaker": "nib",
          "text": "Treasure found. Mouse delivered.",
          "shot": "nib",
          "stage": "river-rescue"
        },
        {
          "id": "s7-remembered",
          "kind": "line",
          "speaker": "lark",
          "text": "You remembered m. That brought him home.",
          "shot": "lark",
          "stage": "river-rescue",
          "speakText": "You remembered em. That brought him home."
        }
      ]
    },
    {
      "id": "treasures-secret",
      "title": "The treasure has another secret",
      "background": "evening",
      "mapStop": "treasure",
      "beats": [
        {
          "id": "s8-evening",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 5,
          "stage": "stone",
          "action": "stone-reveal"
        },
        {
          "id": "s8-small",
          "kind": "line",
          "speaker": "nib",
          "text": "It's smaller than I thought.",
          "shot": "nib",
          "stage": "stone"
        },
        {
          "id": "s8-reveal",
          "kind": "challenge",
          "type": "reveal",
          "speaker": "lark",
          "text": "Try its light on the map.",
          "shot": "interaction",
          "stage": "stone",
          "expected": "orchard",
          "correct": {
            "id": "s8-reveal-correct",
            "speaker": "lark",
            "text": "There! Our next piece is in that orchard."
          },
          "incorrect": {
            "id": "s8-reveal-retry",
            "speaker": "lark",
            "text": "Sweep the moonstone light across the map."
          },
          "hint": {
            "id": "s8-reveal-hint",
            "speaker": "lark",
            "text": "Move the little light over the map. See what appears."
          },
          "choices": [
            {
              "id": "orchard",
              "label": "Sweep the light",
              "say": "show the path"
            }
          ]
        },
        {
          "id": "s8-path",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 5,
          "stage": "stone",
          "action": "stone-reveal"
        },
        {
          "id": "s8-after-orchard",
          "kind": "line",
          "speaker": "nib",
          "text": "And after the orchard?",
          "shot": "nib",
          "stage": "stone"
        },
        {
          "id": "s8-find-out",
          "kind": "line",
          "speaker": "lark",
          "text": "We'll find out when we get that piece.",
          "shot": "lark",
          "stage": "stone"
        },
        {
          "id": "s8-one-at-time",
          "kind": "line",
          "speaker": "nib",
          "text": "One adventure at a time.",
          "shot": "nib",
          "stage": "stone"
        },
        {
          "id": "s8-snacks",
          "kind": "line",
          "speaker": "nib",
          "text": "Does that map show snacks?",
          "shot": "nib",
          "stage": "stone"
        },
        {
          "id": "s8-sandwich-reveal",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 3,
          "stage": "stone",
          "action": "stone-reveal"
        },
        {
          "id": "s8-understands",
          "kind": "line",
          "speaker": "nib",
          "text": "It understands me.",
          "shot": "nib",
          "stage": "stone"
        },
        {
          "id": "s8-collect",
          "kind": "challenge",
          "type": "collect",
          "speaker": "lark",
          "text": "Our first treasure belongs in your collection. We can take it out when we need its light.",
          "shot": "interaction",
          "stage": "stone",
          "expected": "moonstone",
          "correct": {
            "id": "s8-collect-correct",
            "speaker": "lark",
            "text": "The moonstone is safe in your collection."
          },
          "incorrect": {
            "id": "s8-collect-retry",
            "speaker": "lark",
            "text": "Put the moonstone in its soft little space."
          },
          "hint": {
            "id": "s8-collect-hint",
            "speaker": "lark",
            "text": "Touch the moonstone, then its place in the treasure case."
          },
          "choices": [
            {
              "id": "moonstone",
              "label": "Keep the moonstone",
              "say": "keep it"
            }
          ]
        },
        {
          "id": "s8-store",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "stone",
          "action": "treasure-store"
        },
        {
          "id": "s8-basket",
          "kind": "line",
          "speaker": "lark",
          "text": "That goes in the picnic basket.",
          "shot": "lark",
          "stage": "stone"
        },
        {
          "id": "s8-different",
          "kind": "line",
          "speaker": "nib",
          "text": "Different kinds of treasure.",
          "shot": "nib",
          "stage": "stone"
        },
        {
          "id": "s8-home",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 5,
          "stage": "ending",
          "action": "travel"
        }
      ]
    },
    {
      "id": "our-first-chapter",
      "title": "Our first chapter",
      "background": "camp",
      "mapStop": "camp",
      "beats": [
        {
          "id": "s9-journal",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "journal",
          "action": "book-open"
        },
        {
          "id": "s9-one-chapter",
          "kind": "line",
          "speaker": "lark",
          "text": "One adventure. One chapter. Want to see ours?",
          "shot": "lark",
          "stage": "journal"
        },
        {
          "id": "s9-rescue-in",
          "kind": "line",
          "speaker": "nib",
          "text": "Did you put the rescue in?",
          "shot": "nib",
          "stage": "journal"
        },
        {
          "id": "s9-all-of-it",
          "kind": "line",
          "speaker": "lark",
          "text": "All of it.",
          "shot": "lark",
          "stage": "journal"
        },
        {
          "id": "s9-even-umbrella",
          "kind": "line",
          "speaker": "nib",
          "text": "Even the umbrella?",
          "shot": "nib",
          "stage": "journal"
        },
        {
          "id": "s9-especially",
          "kind": "line",
          "speaker": "lark",
          "text": "Especially the umbrella.",
          "shot": "lark",
          "stage": "journal"
        },
        {
          "id": "s9-page-1",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 2,
          "stage": "journal",
          "action": "book-open"
        },
        {
          "id": "s9-library-one",
          "kind": "line",
          "speaker": "lark",
          "text": "Lark, Nib, and a new explorer found a map. It had holes. It had a secret. It showed the way to a moonstone.",
          "shot": "interaction",
          "stage": "journal"
        },
        {
          "id": "s9-nose",
          "kind": "line",
          "speaker": "nib",
          "text": "And it had my nose in it.",
          "shot": "nib",
          "stage": "journal"
        },
        {
          "id": "s9-page-2",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 2,
          "stage": "journal",
          "action": "book-open"
        },
        {
          "id": "s9-reread",
          "kind": "challenge",
          "type": "reread",
          "speaker": "lark",
          "text": "They learned a little letter. It looked like this: m. It made this sound…",
          "shot": "interaction",
          "stage": "journal",
          "expected": "m",
          "correct": {
            "id": "s9-reread-correct",
            "speaker": "lark",
            "text": "Mmm. They listened for it at the beginning of moss and mushroom. It helped them find the river."
          },
          "incorrect": {
            "id": "s9-reread-retry",
            "speaker": "lark",
            "text": "Mmm. We can read this little part together."
          },
          "hint": {
            "id": "s9-reread-hint",
            "speaker": "lark",
            "text": "Lips together. Mmm. Hold or slide the sound track with me."
          },
          "choices": [
            {
              "id": "m",
              "label": "Read m together",
              "say": "mmm"
            }
          ],
          "speakText": "They learned a little letter. It looked like this. Em. It made this sound."
        },
        {
          "id": "s9-page-3",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 2,
          "stage": "journal",
          "action": "book-open"
        },
        {
          "id": "s9-library-three",
          "kind": "line",
          "speaker": "lark",
          "text": "A book showed them how to call the moon ferry. First, mend the mark. Then ring its bell. The explorers made m, and the dock worked again.",
          "shot": "interaction",
          "stage": "journal",
          "speakText": "A book showed them how to call the moon ferry. First, mend the mark. Then ring its bell. The explorers made em, and the dock worked again."
        },
        {
          "id": "s9-page-4",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 2,
          "stage": "journal",
          "action": "book-open"
        },
        {
          "id": "s9-library-four",
          "kind": "line",
          "speaker": "lark",
          "text": "When Nib drifted away, the explorers called the ferry home. Lark caught the rope. Nib pulled the boat close. The moonstone came back with him.",
          "shot": "interaction",
          "stage": "journal"
        },
        {
          "id": "s9-umbrella-help",
          "kind": "line",
          "speaker": "nib",
          "text": "The umbrella helped very little.",
          "shot": "nib",
          "stage": "journal"
        },
        {
          "id": "s9-page-5",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 2,
          "stage": "journal",
          "action": "book-open"
        },
        {
          "id": "s9-library-five",
          "kind": "line",
          "speaker": "lark",
          "text": "Moonstone light showed a hidden path on the map. Their next adventure waited in an orchard. Their first chapter waited here, ready to read again.",
          "shot": "interaction",
          "stage": "journal"
        },
        {
          "id": "s9-library-save",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 5,
          "stage": "journal",
          "action": "library-save"
        },
        {
          "id": "s9-bring-map",
          "kind": "line",
          "speaker": "lark",
          "text": "I'll bring the map next time.",
          "shot": "lark",
          "stage": "ending"
        },
        {
          "id": "s9-bring-wagon",
          "kind": "line",
          "speaker": "nib",
          "text": "I'll bring the wagon.",
          "shot": "nib",
          "stage": "ending"
        },
        {
          "id": "s9-new-brakes",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 3,
          "stage": "ending",
          "action": "wagon-stop"
        },
        {
          "id": "s9-those-brakes",
          "kind": "line",
          "speaker": "lark",
          "text": "Those are your brakes?",
          "shot": "lark",
          "stage": "ending"
        },
        {
          "id": "s9-comfortable",
          "kind": "line",
          "speaker": "nib",
          "text": "Very comfortable brakes.",
          "shot": "nib",
          "stage": "ending"
        },
        {
          "id": "s9-apple",
          "kind": "action",
          "speaker": "lark",
          "text": "",
          "shot": "wide",
          "duration": 4,
          "stage": "ending",
          "action": "apple-roll"
        },
        {
          "id": "s9-snack",
          "kind": "line",
          "speaker": "nib",
          "text": "Oh. The next adventure sent a snack.",
          "shot": "nib",
          "stage": "ending"
        }
      ]
    }
  ],
  "library": [
    {
      "id": "chapter-map",
      "title": "The torn map",
      "text": "Lark, Nib, and a new explorer found a map. It had holes. It had a secret. It showed the way to a moonstone.",
      "background": "camp"
    },
    {
      "id": "chapter-sound",
      "title": "The sound trail",
      "text": "They learned a little letter. It looked like this: m. It made this sound: mmm. They listened for it at the beginning of moss and mushroom. It helped them find the river.",
      "speakText": "They learned a little letter. It looked like this. Em. It made this sound. Mmm. They listened for it at the beginning of moss and mushroom. It helped them find the river.",
      "childSound": "m",
      "background": "woods"
    },
    {
      "id": "chapter-dock",
      "title": "The broken dock",
      "text": "A book showed them how to call the moon ferry. First, mend the mark. Then ring its bell. The explorers made m, and the dock worked again.",
      "speakText": "A book showed them how to call the moon ferry. First, mend the mark. Then ring its bell. The explorers made em, and the dock worked again.",
      "background": "river"
    },
    {
      "id": "chapter-return",
      "title": "The return",
      "text": "When Nib drifted away, the explorers called the ferry home. Lark caught the rope. Nib pulled the boat close. The moonstone came back with him.",
      "background": "river"
    },
    {
      "id": "chapter-next",
      "title": "What comes next",
      "text": "Moonstone light showed a hidden path on the map. Their next adventure waited in an orchard. Their first chapter waited here, ready to read again.",
      "background": "evening"
    }
  ]
};

export const VOICES = {
  "lark": {
    "voice": "marin",
    "instructions": "Perform Lark, a warm, capable, curious adult explorer and teal songbird. Natural conversational English, bright and brisk without rushing the listener. Treat the child as a partner. Let wonder and dry amusement emerge gently; avoid presenter emphasis, sing-song teaching, or baby talk. Read story passages with intimate warmth. Mmm is a clean voiced hum with lips closed and no added uh; em is the letter name. Keep the consonant model short and comfortable. Do not read punctuation or slash marks aloud."
  },
  "nib": {
    "voice": "cedar",
    "instructions": "Perform Nib, a small golden mouse with enormous confidence in his inventions. An earnest, warm, resourceful adult comic character. Conversational and nimble, with small changes of pace and sincere reactions. Keep the comedy grounded; no squeaking, caricature, cartoon falsetto, baby talk, or exaggerated punchlines. Give brief quiet lines room. Mmm is a clean closed-lip hum, never muh or em. Do not add words or read punctuation aloud."
  },
  "joyce": {
    "voice": "marin",
    "instructions": "Perform Joyce, a calm, kind companion who gives one specific useful cue and then waits. Respectful, natural English with a gentle pace, never a quiz-show host. No generic praise or repeated encouragement. Model mmm as a clean closed-lip hum without an added uh. Say em only for the letter name. Do not read slash marks or punctuation aloud."
  }
};

export const HELP_LINES = [
  {
    "id": "help-replay",
    "speaker": "joyce",
    "text": "We can hear that part again."
  },
  {
    "id": "help-mic-uncertain",
    "speaker": "joyce",
    "text": "I’m not sure what I heard. You can choose on the screen."
  },
  {
    "id": "help-mic-unavailable",
    "speaker": "joyce",
    "text": "You can keep going with your finger."
  },
  {
    "id": "help-phoneme",
    "speaker": "joyce",
    "text": "Lips together. Mmm. Just a little hum."
  },
  {
    "id": "help-phoneme-no-schwa",
    "speaker": "joyce",
    "text": "Mmm. Keep your lips together for the sound."
  },
  {
    "id": "help-touch-hum",
    "speaker": "joyce",
    "text": "Hold m to listen. You can hum along, or just listen.",
    "speakText": "Hold em to listen. You can hum along, or just listen."
  },
  {
    "id": "help-formation-start",
    "speaker": "joyce",
    "text": "Touch the bright dot. Down first."
  },
  {
    "id": "help-formation-hill",
    "speaker": "joyce",
    "text": "Follow the little light around this hill. You can lift your finger."
  },
  {
    "id": "help-formation-piece",
    "speaker": "joyce",
    "text": "You can fit the m piece into the groove.",
    "speakText": "You can fit the em piece into the groove."
  },
  {
    "id": "help-rescue-supported",
    "speaker": "lark",
    "text": "We found m together. That brought him home.",
    "speakText": "We found em together. That brought him home."
  },
  {
    "id": "help-library-ready",
    "speaker": "joyce",
    "text": "Your chapter is ready to read again."
  },
  {
    "id": "help-play-again",
    "speaker": "joyce",
    "text": "Play The Moon Path again."
  },
  {
    "id": "help-read-chapter",
    "speaker": "joyce",
    "text": "Read our chapter."
  },
  {
    "id": "help-route",
    "speaker": "joyce",
    "text": "Lagoon, woods, river. Follow the pictures along the trail."
  },
  {
    "id": "help-bell-sound-m",
    "speaker": "lark",
    "text": "Mmm."
  },
  {
    "id": "help-bell-sound-s",
    "speaker": "lark",
    "text": "Sss."
  },
  {
    "id": "help-object-moss",
    "speaker": "lark",
    "text": "Moss."
  },
  {
    "id": "help-object-rock",
    "speaker": "lark",
    "text": "Rock."
  },
  {
    "id": "help-object-mushroom",
    "speaker": "lark",
    "text": "Mushroom."
  },
  {
    "id": "help-object-flower",
    "speaker": "lark",
    "text": "Flower."
  },
  {
    "id": "help-continue",
    "speaker": "joyce",
    "text": "Continue our adventure."
  },
  {
    "id": "help-pause",
    "speaker": "joyce",
    "text": "Our adventure is paused. Come back when you are ready."
  }
];
