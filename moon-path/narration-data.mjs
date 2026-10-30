// Generated from the supplied ElevenLabs narration and the portable local alignment.
export const NARRATION = {
  "source": {
    "name": "ElevenLabs_The_Moon_Path.mp3",
    "sha256": "c2b21eacab5c0c9f7f459f378c29f7a2bd3d5e5d72d1a01c326bb9463d536933",
    "duration": 1286.952375,
    "method": "Local MLX Whisper word timing; exact manuscript DTW at all13 gates and8 scene transitions; physical cuts centered in independently measured quiet intervals."
  },
  "gates": [
    {
      "id": "s1-latch",
      "at": 127.614127,
      "promptEnd": 127.21,
      "resumeStart": 128.03,
      "sourceChar": 1625,
      "resumeChar": 1627,
      "stage": "case",
      "mode": "required",
      "optional": false,
      "pauseAfter": "“Want to open it with us?” Lark asked.",
      "resumeAt": "The latch was cool beneath your fingers. You lifted it.",
      "quietInterval": {
        "start": 127.301587,
        "end": 127.926667,
        "duration": 0.625079
      },
      "boundaryConfidence": "high: exact manuscript DTW plus independently measured quiet interval"
    },
    {
      "id": "s2-route",
      "at": 302.66958,
      "promptEnd": 302.08,
      "resumeStart": 303.160998,
      "sourceChar": 3763,
      "resumeChar": 3765,
      "stage": "map",
      "mode": "guided-practice",
      "optional": false,
      "pauseAfter": "Together, you followed the surviving path: lagoon, woods, river.",
      "resumeAt": "Nib packed the picnic basket.",
      "quietInterval": {
        "start": 302.178163,
        "end": 303.160998,
        "duration": 0.982834
      },
      "boundaryConfidence": "high: exact manuscript DTW plus independently measured quiet interval"
    },
    {
      "id": "s3-hum",
      "at": 397.693979,
      "promptEnd": 397.01,
      "resumeStart": 398.25,
      "sourceChar": 4902,
      "resumeChar": 4904,
      "stage": "lagoon",
      "mode": "practice-touch-continue",
      "optional": true,
      "pauseAfter": "“Lips together. Mmm. You can try it with us,” Lark said gently.",
      "resumeAt": "The little hum hardly disturbed the dragonflies.",
      "quietInterval": {
        "start": 397.200431,
        "end": 398.187528,
        "duration": 0.987098
      },
      "boundaryConfidence": "high: exact manuscript DTW plus independently measured quiet interval"
    },
    {
      "id": "s3-letter",
      "at": 442.888764,
      "promptEnd": 442.43,
      "resumeStart": 443.43,
      "sourceChar": 5450,
      "resumeChar": 5452,
      "stage": "lagoon",
      "mode": "required",
      "optional": false,
      "pauseAfter": "“We need the little letter for mmm,” Lark said.",
      "resumeAt": "You examined the two keys. One had a straight stem and two little humps.",
      "quietInterval": {
        "start": 442.497234,
        "end": 443.280295,
        "duration": 0.783061
      },
      "boundaryConfidence": "high: exact manuscript DTW plus independently measured quiet interval"
    },
    {
      "id": "s4-moss",
      "at": 572.250703,
      "promptEnd": 571.73,
      "resumeStart": 572.71,
      "sourceChar": 7007,
      "resumeChar": 7009,
      "stage": "woods-moss",
      "mode": "required",
      "optional": false,
      "pauseAfter": "“Rock. Moss. Mmm… moss. Which one starts with our little hum?” Lark asked.",
      "resumeAt": "Moss. You led the way onto the green path.",
      "quietInterval": {
        "start": 571.974059,
        "end": 572.527347,
        "duration": 0.553288
      },
      "boundaryConfidence": "high: exact manuscript DTW plus independently measured quiet interval"
    },
    {
      "id": "s4-mushroom",
      "at": 600.623129,
      "promptEnd": 600.01,
      "resumeStart": 601.43,
      "sourceChar": 7339,
      "resumeChar": 7341,
      "stage": "woods-mushroom",
      "mode": "required",
      "optional": false,
      "pauseAfter": "“Mushroom. Flower. Listen for mmm at the beginning,” Lark said.",
      "resumeAt": "Mushroom began with the sound you knew.",
      "quietInterval": {
        "start": 600.085646,
        "end": 601.160612,
        "duration": 1.074966
      },
      "boundaryConfidence": "high: exact manuscript DTW plus independently measured quiet interval"
    },
    {
      "id": "s5-coread",
      "at": 709.30695,
      "promptEnd": 708.74,
      "resumeStart": 709.810068,
      "sourceChar": 8717,
      "resumeChar": 8719,
      "stage": "river-book",
      "mode": "optional-nonblocking",
      "optional": true,
      "pauseAfter": "There was the little letter again. A straight stem. Two humps. You had met it at the lagoon.",
      "resumeAt": "Nib reached for a bell rope, then stopped.",
      "quietInterval": {
        "start": 708.803832,
        "end": 709.810068,
        "duration": 1.006236
      },
      "boundaryConfidence": "high: exact manuscript DTW plus independently measured quiet interval"
    },
    {
      "id": "s5-sequence",
      "at": 719.649569,
      "promptEnd": 719.12,
      "resumeStart": 720.24,
      "sourceChar": 8834,
      "resumeChar": 8836,
      "stage": "river-book",
      "mode": "required",
      "optional": false,
      "pauseAfter": "“Hang on. What comes first? Fix the mark, or ring the bell?” Nib asked.",
      "resumeAt": "You looked from the book to the panel. The mark came first.",
      "quietInterval": {
        "start": 719.173855,
        "end": 720.125283,
        "duration": 0.951429
      },
      "boundaryConfidence": "high: exact manuscript DTW plus independently measured quiet interval"
    },
    {
      "id": "s6-trace",
      "at": 790.467177,
      "promptEnd": 789.81,
      "resumeStart": 790.985374,
      "sourceChar": 9802,
      "resumeChar": 9804,
      "stage": "river-trace",
      "mode": "required",
      "optional": false,
      "pauseAfter": "You can follow that little m in the air with your finger, if you like. One downstroke. Then two rounded humps, each coming down to the bottom.",
      "resumeAt": "At the dock, you worked slowly along the wide groove.",
      "quietInterval": {
        "start": 789.94898,
        "end": 790.985374,
        "duration": 1.036395
      },
      "boundaryConfidence": "high: exact manuscript DTW plus independently measured quiet interval"
    },
    {
      "id": "s7-bell",
      "at": 943.530657,
      "promptEnd": 943.13,
      "resumeStart": 943.97,
      "sourceChar": 11757,
      "resumeChar": 11759,
      "stage": "river-rescue",
      "mode": "required",
      "optional": false,
      "pauseAfter": "“Which little letter makes mmm?” Lark asked.",
      "resumeAt": "You found the straight stem and two humps. The little m.",
      "quietInterval": {
        "start": 943.195646,
        "end": 943.865669,
        "duration": 0.670023
      },
      "boundaryConfidence": "high: exact manuscript DTW plus independently measured quiet interval"
    },
    {
      "id": "s8-reveal",
      "at": 1035.620783,
      "promptEnd": 1035.15,
      "resumeStart": 1036.13,
      "sourceChar": 12888,
      "resumeChar": 12890,
      "stage": "stone",
      "mode": "required",
      "optional": false,
      "pauseAfter": "“Try its light on the map,” Lark said.",
      "resumeAt": "You unfolded the torn paper and moved the moonstone above it.",
      "quietInterval": {
        "start": 1035.220522,
        "end": 1036.021043,
        "duration": 0.800522
      },
      "boundaryConfidence": "high: exact manuscript DTW plus independently measured quiet interval"
    },
    {
      "id": "s8-collect",
      "at": 1110.360544,
      "promptEnd": 1109.95,
      "resumeStart": 1110.83,
      "sourceChar": 13819,
      "resumeChar": 13821,
      "stage": "stone",
      "mode": "required",
      "optional": false,
      "pauseAfter": "“Our first treasure belongs in your collection. We can take it out when we need its light,” Lark said.",
      "resumeAt": "You settled the stone into its place.",
      "quietInterval": {
        "start": 1109.995283,
        "end": 1110.725805,
        "duration": 0.730522
      },
      "boundaryConfidence": "high: exact manuscript DTW plus independently measured quiet interval"
    },
    {
      "id": "s9-reread",
      "at": 1188.888787,
      "promptEnd": 1188.13,
      "resumeStart": 1189.23,
      "sourceChar": 14829,
      "resumeChar": 14831,
      "stage": "journal",
      "mode": "optional-nonblocking",
      "optional": true,
      "pauseAfter": "When she reached the picture of m, Lark paused.",
      "resumeAt": "“And it made this sound… mmm,” Lark said gently.",
      "quietInterval": {
        "start": 1188.677823,
        "end": 1189.099751,
        "duration": 0.421927
      },
      "boundaryConfidence": "high: exact manuscript DTW plus independently measured quiet interval"
    }
  ],
  "scenes": [
    {
      "id": "excellent-brakes",
      "title": "An expedition with excellent brakes",
      "background": "camp",
      "mapStop": "camp",
      "beats": [
        {
          "id": "narration-01",
          "kind": "narration",
          "text": "The Moon Path\n\nLate afternoon lay golden over Explorer Camp. Below the treehouse, a narrow path wound between the roots of an enormous oak. It was a good path for walking. It was a pleasant path for pulling a wagon.\n\nIt was becoming a rather alarming path for riding in one.\n\nNib came bouncing down the hill in a little wooden cart. His red scarf streamed behind him. A picnic basket rattled at his feet, and his goggles kept slipping over his nose.\n\n“Lark! Good news! The Adventure Wagon is very fast!” Nib exclaimed.\n\nLark swooped out of the oak. She was a teal songbird in a well-used explorer's vest, and she had been having a perfectly quiet afternoon until the wagon arrived.\n\n“And the brakes?” Lark asked.\n\n“That's the other news!” Nib said.\n\nThe wagon struck a root. Nib's sandwich jumped out of the basket. He caught it with one paw while Lark grabbed the handle with both feet.\n\nAhead lay a very large puddle. Above it hung a very low branch.\n\n“Scarf!” Lark said.\n\nNib flung the end of his scarf around the branch. The wagon swung around the tree and stopped with a wooden squeak. Its flag carried on without it, then flopped over Nib's head.\n\n“Excellent brakes,” Nib said from beneath the flag.\n\nSomething crinkled beneath a wheel. Lark brushed away the leaves and uncovered a battered explorer's case. Its corners were green with age, but its brass latch still shone.\n\nNib lifted the flag off one eye.\n\n“Did we find treasure already?” Nib asked.\n\n“We found something,” Lark said.\n\nThen Lark noticed you beside the path. She moved over, leaving room between herself and Nib.\n\n“Want to open it with us?” Lark asked.",
          "speaker": "narrator",
          "stage": "wagon",
          "duration": 127.61412698412698,
          "audio": {
            "file": "assets/audio/narration/01.mp3",
            "duration": 127.61412698412698,
            "source": "elevenlabs-upload",
            "sourceStart": 0.0,
            "sourceEnd": 127.614127,
            "cues": [
              {
                "start": 0,
                "end": 0.96,
                "text": "The Moon Path",
                "speaker": "narrator"
              },
              {
                "start": 2.5,
                "end": 13.68,
                "text": "Late afternoon lay golden over Explorer Camp. Below the treehouse, a narrow path wound between the roots of an enormous oak. It was a good path for walking.",
                "speaker": "narrator"
              },
              {
                "start": 14.12,
                "end": 16.46,
                "text": "It was a pleasant path for pulling a wagon.",
                "speaker": "narrator"
              },
              {
                "start": 17.04,
                "end": 21.02,
                "text": "It was becoming a rather alarming path for riding in one.",
                "speaker": "narrator"
              },
              {
                "start": 21.72,
                "end": 32.8,
                "text": "Nib came bouncing down the hill in a little wooden cart. His red scarf streamed behind him. A picnic basket rattled at his feet, and his goggles kept slipping over his nose.",
                "speaker": "narrator"
              },
              {
                "start": 33.42,
                "end": 37.82,
                "text": "“Lark! Good news! The Adventure Wagon is very fast!”",
                "speaker": "nib"
              },
              {
                "start": 38.38,
                "end": 39.64,
                "text": "Nib exclaimed.",
                "speaker": "narrator"
              },
              {
                "start": 40.46,
                "end": 50.74,
                "text": "Lark swooped out of the oak. She was a teal songbird in a well-used explorer's vest, and she had been having a perfectly quiet afternoon until the wagon arrived.",
                "speaker": "narrator"
              },
              {
                "start": 51.02,
                "end": 52.44,
                "text": "“And the brakes?”",
                "speaker": "lark"
              },
              {
                "start": 53.02,
                "end": 54.24,
                "text": "Lark asked.",
                "speaker": "narrator"
              },
              {
                "start": 54.64,
                "end": 56.36,
                "text": "“That's the other news!”",
                "speaker": "nib"
              },
              {
                "start": 56.92,
                "end": 57.8,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 58.0,
                "end": 67.18,
                "text": "The wagon struck a root. Nib's sandwich jumped out of the basket. He caught it with one paw while Lark grabbed the handle with both feet.",
                "speaker": "narrator"
              },
              {
                "start": 67.66,
                "end": 72.7,
                "text": "Ahead lay a very large puddle. Above it hung a very low branch.",
                "speaker": "narrator"
              },
              {
                "start": 73.78,
                "end": 74.46,
                "text": "“Scarf!”",
                "speaker": "lark"
              },
              {
                "start": 74.78,
                "end": 75.86,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 76.66,
                "end": 88.08,
                "text": "Nib flung the end of his scarf around the branch. The wagon swung around the tree and stopped with a wooden squeak. Its flag carried on without it, then flopped over Nib's head.",
                "speaker": "narrator"
              },
              {
                "start": 88.64,
                "end": 90.06,
                "text": "“Excellent brakes,”",
                "speaker": "nib"
              },
              {
                "start": 90.62,
                "end": 92.78,
                "text": "Nib said from beneath the flag.",
                "speaker": "narrator"
              },
              {
                "start": 93.18,
                "end": 105.34,
                "text": "Something crinkled beneath a wheel. Lark brushed away the leaves and uncovered a battered explorer's case. Its corners were green with age, but its brass latch still shone.",
                "speaker": "narrator"
              },
              {
                "start": 105.84,
                "end": 107.96,
                "text": "Nib lifted the flag off one eye.",
                "speaker": "narrator"
              },
              {
                "start": 108.62,
                "end": 110.88,
                "text": "“Did we find treasure already?”",
                "speaker": "nib"
              },
              {
                "start": 111.38,
                "end": 112.6,
                "text": "Nib asked.",
                "speaker": "narrator"
              },
              {
                "start": 113.42,
                "end": 114.8,
                "text": "“We found something,”",
                "speaker": "lark"
              },
              {
                "start": 115.32,
                "end": 116.23,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 117.05,
                "end": 123.47,
                "text": "Then Lark noticed you beside the path. She moved over, leaving room between herself and Nib.",
                "speaker": "narrator"
              },
              {
                "start": 124.47,
                "end": 125.65,
                "text": "“Want to open it with us?”",
                "speaker": "lark"
              },
              {
                "start": 126.43,
                "end": 127.21,
                "text": "Lark asked.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-01-initial",
                "at": 0,
                "stage": "wagon",
                "flags": {
                  "parked": false,
                  "bridge": false,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              },
              {
                "key": "source-visual-01",
                "stage": "wagon",
                "action": "wagon-roll",
                "duration": 8,
                "at": 21.72
              },
              {
                "key": "source-visual-02",
                "stage": "wagon",
                "action": "wagon-stop",
                "duration": 4,
                "flags": {
                  "parked": true
                },
                "at": 76.66
              },
              {
                "key": "source-visual-03",
                "stage": "case",
                "at": 93.18
              }
            ]
          }
        },
        {
          "id": "s1-latch",
          "kind": "challenge",
          "stage": "case"
        },
        {
          "id": "narration-02",
          "kind": "narration",
          "text": "The latch was cool beneath your fingers. You lifted it. The lid sprang up, and a folded sheet of paper popped out, unfolded in the air, and landed squarely on Nib's face.\n\nHis nose poked through a hole in the middle.\n\n“I can see where we're going!” Nib said.\n\n“That's a hole,” Lark said.\n\n“A very clear map,” Nib said.\n\nLark gently unhooked the paper from his nose. She spread it across a stump, smoothing the creases with the edge of one wing.\n\n“I'm Lark. This is Nib. I draw maps,” Lark said.\n\n“I build things,” Nib said.\n\nHe glanced at the wagon.\n\n“Almost finished things,” Nib said.\n\n“We could use another explorer,” Lark said.\n\nYou leaned closer. Much of the map was missing. Ragged gaps interrupted its paths, and one whole edge had been torn away. But near the center stood a drawing of a magnificent tree. A tiny door nestled among its roots.\n\nLark's wing grew still.\n\n“The Treasure Tree,” Lark said softly.",
          "speaker": "narrator",
          "stage": "case",
          "duration": 79.05086167800454,
          "audio": {
            "file": "assets/audio/narration/02.mp3",
            "duration": 79.05086167800454,
            "source": "elevenlabs-upload",
            "sourceStart": 127.614127,
            "sourceEnd": 206.664989,
            "cues": [
              {
                "start": 0.415873,
                "end": 11.885873,
                "text": "The latch was cool beneath your fingers. You lifted it. The lid sprang up, and a folded sheet of paper popped out, unfolded in the air, and landed squarely on Nib's face.",
                "speaker": "narrator"
              },
              {
                "start": 12.325873,
                "end": 14.865873,
                "text": "His nose poked through a hole in the middle.",
                "speaker": "narrator"
              },
              {
                "start": 14.985873,
                "end": 17.425873,
                "text": "“I can see where we're going!”",
                "speaker": "nib"
              },
              {
                "start": 17.425873,
                "end": 18.885873,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 18.885873,
                "end": 20.505873,
                "text": "“That's a hole,”",
                "speaker": "lark"
              },
              {
                "start": 20.505873,
                "end": 22.145873,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 22.145873,
                "end": 24.685873,
                "text": "“A very clear map,”",
                "speaker": "nib"
              },
              {
                "start": 24.685873,
                "end": 26.205873,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 26.205873,
                "end": 34.985873,
                "text": "Lark gently unhooked the paper from his nose. She spread it across a stump, smoothing the creases with the edge of one wing.",
                "speaker": "narrator"
              },
              {
                "start": 34.985873,
                "end": 39.045873,
                "text": "“I'm Lark. This is Nib. I draw maps,”",
                "speaker": "lark"
              },
              {
                "start": 39.045873,
                "end": 40.645873,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 40.645873,
                "end": 42.805873,
                "text": "“I build things,”",
                "speaker": "nib"
              },
              {
                "start": 42.805873,
                "end": 44.505873,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 44.985873,
                "end": 46.385873,
                "text": "He glanced at the wagon.",
                "speaker": "narrator"
              },
              {
                "start": 47.125873,
                "end": 48.865873,
                "text": "“Almost finished things,”",
                "speaker": "nib"
              },
              {
                "start": 49.425873,
                "end": 50.305873,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 50.745873,
                "end": 52.985873,
                "text": "“We could use another explorer,”",
                "speaker": "lark"
              },
              {
                "start": 53.765873,
                "end": 54.705873,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 55.665873,
                "end": 68.665873,
                "text": "You leaned closer. Much of the map was missing. Ragged gaps interrupted its paths, and one whole edge had been torn away. But near the center stood a drawing of a magnificent tree.",
                "speaker": "narrator"
              },
              {
                "start": 69.105873,
                "end": 71.635873,
                "text": "A tiny door nestled among its roots.",
                "speaker": "narrator"
              },
              {
                "start": 72.655873,
                "end": 74.115873,
                "text": "Lark's wing grew still.",
                "speaker": "narrator"
              },
              {
                "start": 75.155873,
                "end": 76.235873,
                "text": "“The Treasure Tree,”",
                "speaker": "lark"
              },
              {
                "start": 77.395873,
                "end": 78.515873,
                "text": "Lark said softly.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-02-initial",
                "at": 0,
                "stage": "case",
                "flags": {
                  "parked": true,
                  "bridge": false,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              },
              {
                "key": "source-visual-04",
                "stage": "case",
                "action": "map-open",
                "duration": 3,
                "at": 0.415873
              },
              {
                "key": "source-visual-05",
                "stage": "map",
                "at": 12.325873
              },
              {
                "key": "source-visual-06",
                "stage": "map",
                "at": 55.665873
              }
            ]
          }
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
          "id": "narration-03",
          "kind": "narration",
          "text": "“Does it grow treasure?” Nib asked.\n\n“There's a secret room inside it. Nobody at camp has found the way in. My first camp map had this tree on it. I've wanted to find it ever since,” Lark said.\n\n“What do you think is inside?” Nib asked.\n\n“I don't know yet. That's my favorite part,” Lark said.\n\nNib measured the little door with his paws, then measured his tummy.\n\n“I could fit through that. With a small amount of wriggling,” Nib said.\n\nFirst, however, they would have to find it. Lark followed the broken trails with a feather. Most ended at empty spaces. One surviving corner showed a lagoon, a patch of woods, and a river dock. Beside the dock was a drawing of a crescent-shaped lantern. A pale stone glimmered inside it.\n\n“A moonstone. Look where its light falls,” Lark said.\n\nIn the picture, a faint trail appeared beneath the lantern's glow. It continued toward the outline of a missing map piece.\n\n“If we find that stone, its light might show us where to look next,” Lark said.\n\n“Then that's where we start. With the bit we've got,” Nib said.\n\nLark looked at him, then folded away the blank planning sheet she had already taken from her satchel.\n\nTogether, you followed the surviving path: lagoon, woods, river.",
          "speaker": "narrator",
          "stage": "map",
          "duration": 96.00458049886622,
          "audio": {
            "file": "assets/audio/narration/03.mp3",
            "duration": 96.00458049886622,
            "source": "elevenlabs-upload",
            "sourceStart": 206.664989,
            "sourceEnd": 302.66958,
            "cues": [
              {
                "start": 0.505011,
                "end": 1.485011,
                "text": "“Does it grow treasure?”",
                "speaker": "nib"
              },
              {
                "start": 2.605011,
                "end": 3.325011,
                "text": "Nib asked.",
                "speaker": "narrator"
              },
              {
                "start": 4.085011,
                "end": 14.215011,
                "text": "“There's a secret room inside it. Nobody at camp has found the way in. My first camp map had this tree on it. I've wanted to find it ever since,”",
                "speaker": "lark"
              },
              {
                "start": 14.895011,
                "end": 15.755011,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 16.435011,
                "end": 18.335011,
                "text": "“What do you think is inside?”",
                "speaker": "nib"
              },
              {
                "start": 18.975011,
                "end": 19.995011,
                "text": "Nib asked.",
                "speaker": "narrator"
              },
              {
                "start": 20.595011,
                "end": 23.615011,
                "text": "“I don't know yet. That's my favorite part,”",
                "speaker": "lark"
              },
              {
                "start": 24.475011,
                "end": 25.175011,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 25.935011,
                "end": 29.635011,
                "text": "Nib measured the little door with his paws, then measured his tummy.",
                "speaker": "narrator"
              },
              {
                "start": 30.415011,
                "end": 34.135011,
                "text": "“I could fit through that. With a small amount of wriggling,”",
                "speaker": "nib"
              },
              {
                "start": 34.535011,
                "end": 35.615011,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 36.515011,
                "end": 50.435011,
                "text": "First, however, they would have to find it. Lark followed the broken trails with a feather. Most ended at empty spaces. One surviving corner showed a lagoon, a patch of woods, and a river dock.",
                "speaker": "narrator"
              },
              {
                "start": 50.435011,
                "end": 57.395011,
                "text": "Beside the dock was a drawing of a crescent-shaped lantern. A pale stone glimmered inside it.",
                "speaker": "narrator"
              },
              {
                "start": 57.655011,
                "end": 60.975011,
                "text": "“A moonstone. Look where its light falls,”",
                "speaker": "lark"
              },
              {
                "start": 61.675011,
                "end": 62.575011,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 63.255011,
                "end": 71.395011,
                "text": "In the picture, a faint trail appeared beneath the lantern's glow. It continued toward the outline of a missing map piece.",
                "speaker": "narrator"
              },
              {
                "start": 71.755011,
                "end": 76.315011,
                "text": "“If we find that stone, its light might show us where to look next,”",
                "speaker": "lark"
              },
              {
                "start": 77.155011,
                "end": 77.775011,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 77.775011,
                "end": 82.045011,
                "text": "“Then that's where we start. With the bit we've got,”",
                "speaker": "nib"
              },
              {
                "start": 82.805011,
                "end": 83.385011,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 84.365011,
                "end": 89.695011,
                "text": "Lark looked at him, then folded away the blank planning sheet she had already taken from her satchel.",
                "speaker": "narrator"
              },
              {
                "start": 90.455011,
                "end": 95.415011,
                "text": "Together, you followed the surviving path: lagoon, woods, river.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-03-initial",
                "at": 0,
                "stage": "map",
                "flags": {
                  "parked": true,
                  "bridge": false,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              }
            ]
          }
        },
        {
          "id": "s2-route",
          "kind": "challenge",
          "stage": "map",
          "guided": true
        },
        {
          "id": "narration-04",
          "kind": "narration",
          "text": "Nib packed the picnic basket. Lark added a coil of rope. Nib added an umbrella and a wooden spoon. Nobody was quite sure about the spoon, but he seemed very certain.\n\nWith you beside them, the two explorers set off.",
          "speaker": "narrator",
          "stage": "map",
          "duration": 16.25199546485261,
          "audio": {
            "file": "assets/audio/narration/04.mp3",
            "duration": 16.25199546485261,
            "source": "elevenlabs-upload",
            "sourceStart": 302.66958,
            "sourceEnd": 318.921576,
            "cues": [
              {
                "start": 0.491418,
                "end": 11.42042,
                "text": "Nib packed the picnic basket. Lark added a coil of rope. Nib added an umbrella and a wooden spoon. Nobody was quite sure about the spoon, but he seemed very certain.",
                "speaker": "narrator"
              },
              {
                "start": 12.76042,
                "end": 15.64042,
                "text": "With you beside them, the two explorers set off.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-04-initial",
                "at": 0,
                "stage": "map",
                "flags": {
                  "parked": true,
                  "bridge": false,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              }
            ]
          }
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
          "id": "narration-05",
          "kind": "narration",
          "text": "The lagoon shone between tall reeds. Dragonflies hovered over a narrow channel, and the woods waited on the other side. Just beneath the water, you could make out a row of flat stepping platforms.\n\nNib opened his umbrella and studied it thoughtfully.\n\n“That is not a boat,” Lark said.\n\n“It could be a very small boat,” Nib said.\n\nA breeze turned it inside out. Nib folded it without another word.\n\nBeside the channel stood an old trail machine. A moon was carved above its lever. Below the moon sat a small square key bearing a little letter: m.\n\n“The old explorers put letter keys on their trail machines. Each key has a sound. This letter makes a little hum. Listen. Mmm,” Lark said.\n\nShe closed her beak. Nib pressed his lips together and tried the hum too.\n\n“Mmm,” Nib hummed.\n\nHis goggles trembled down his nose.\n\n“My nose is doing it too,” Nib said.\n\n“Lips together. Mmm. You can try it with us,” Lark said gently.",
          "speaker": "narrator",
          "stage": "lagoon",
          "duration": 78.77240362811791,
          "audio": {
            "file": "assets/audio/narration/05.mp3",
            "duration": 78.77240362811791,
            "source": "elevenlabs-upload",
            "sourceStart": 318.921576,
            "sourceEnd": 397.693979,
            "cues": [
              {
                "start": 0.648424,
                "end": 13.158424,
                "text": "The lagoon shone between tall reeds. Dragonflies hovered over a narrow channel, and the woods waited on the other side. Just beneath the water, you could make out a row of flat stepping platforms.",
                "speaker": "narrator"
              },
              {
                "start": 14.158424,
                "end": 16.978424,
                "text": "Nib opened his umbrella and studied it thoughtfully.",
                "speaker": "narrator"
              },
              {
                "start": 17.478424,
                "end": 19.538424,
                "text": "“That is not a boat,”",
                "speaker": "lark"
              },
              {
                "start": 20.058424,
                "end": 21.038424,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 21.378424,
                "end": 23.958424,
                "text": "“It could be a very small boat,”",
                "speaker": "nib"
              },
              {
                "start": 24.178424,
                "end": 25.518424,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 25.898424,
                "end": 30.578424,
                "text": "A breeze turned it inside out. Nib folded it without another word.",
                "speaker": "narrator"
              },
              {
                "start": 31.278424,
                "end": 41.978424,
                "text": "Beside the channel stood an old trail machine. A moon was carved above its lever. Below the moon sat a small square key bearing a little letter: m.",
                "speaker": "narrator"
              },
              {
                "start": 41.978424,
                "end": 52.838424,
                "text": "“The old explorers put letter keys on their trail machines. Each key has a sound. This letter makes a little hum. Listen. Mmm,”",
                "speaker": "lark"
              },
              {
                "start": 54.038424,
                "end": 54.698424,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 55.258424,
                "end": 60.318424,
                "text": "She closed her beak. Nib pressed his lips together and tried the hum too.",
                "speaker": "narrator"
              },
              {
                "start": 61.238424,
                "end": 61.918424,
                "text": "“Mmm,”",
                "speaker": "nib"
              },
              {
                "start": 63.118424,
                "end": 63.938424,
                "text": "Nib hummed.",
                "speaker": "narrator"
              },
              {
                "start": 64.498424,
                "end": 67.088424,
                "text": "His goggles trembled down his nose.",
                "speaker": "narrator"
              },
              {
                "start": 68.468424,
                "end": 69.988424,
                "text": "“My nose is doing it too,”",
                "speaker": "nib"
              },
              {
                "start": 70.768424,
                "end": 71.428424,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 72.368424,
                "end": 76.308424,
                "text": "“Lips together. Mmm. You can try it with us,”",
                "speaker": "lark"
              },
              {
                "start": 77.008424,
                "end": 78.088424,
                "text": "Lark said gently.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-05-initial",
                "at": 0,
                "stage": "lagoon",
                "flags": {
                  "parked": true,
                  "bridge": false,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              },
              {
                "key": "source-visual-07",
                "stage": "lagoon",
                "at": 0.648424
              }
            ]
          }
        },
        {
          "id": "s3-hum",
          "kind": "challenge",
          "stage": "lagoon",
          "optional": true
        },
        {
          "id": "narration-06",
          "kind": "narration",
          "text": "The little hum hardly disturbed the dragonflies. It was a comfortable sound, tucked behind closed lips.\n\nLark pointed to the moon above the machine.\n\n“Mmm… moon. Hear that sound at the beginning?” Lark asked.\n\nShe pressed the letter key. The machine hummed, and the first platform rose dripping from the water. But the key's retaining clip was loose. With a tiny clink, the key dropped out and landed beside a spare.\n\nOne was m. The other was s.\n\n“I think your bridge dropped something,” Nib said.\n\n“We need the little letter for mmm,” Lark said.",
          "speaker": "narrator",
          "stage": "lagoon",
          "duration": 45.19478458049887,
          "audio": {
            "file": "assets/audio/narration/06.mp3",
            "duration": 45.19478458049887,
            "source": "elevenlabs-upload",
            "sourceStart": 397.693979,
            "sourceEnd": 442.888764,
            "cues": [
              {
                "start": 0.556021,
                "end": 7.546021,
                "text": "The little hum hardly disturbed the dragonflies. It was a comfortable sound, tucked behind closed lips.",
                "speaker": "narrator"
              },
              {
                "start": 8.506021,
                "end": 11.246021,
                "text": "Lark pointed to the moon above the machine.",
                "speaker": "narrator"
              },
              {
                "start": 12.326021,
                "end": 16.146021,
                "text": "“Mmm… moon. Hear that sound at the beginning?”",
                "speaker": "lark"
              },
              {
                "start": 16.146021,
                "end": 17.746021,
                "text": "Lark asked.",
                "speaker": "narrator"
              },
              {
                "start": 18.046021,
                "end": 27.646021,
                "text": "She pressed the letter key. The machine hummed, and the first platform rose dripping from the water. But the key's retaining clip was loose.",
                "speaker": "narrator"
              },
              {
                "start": 28.006021,
                "end": 32.126021,
                "text": "With a tiny clink, the key dropped out and landed beside a spare.",
                "speaker": "narrator"
              },
              {
                "start": 33.116021,
                "end": 35.416021,
                "text": "One was m. The other was s.",
                "speaker": "narrator"
              },
              {
                "start": 36.636021,
                "end": 38.536021,
                "text": "“I think your bridge dropped something,”",
                "speaker": "nib"
              },
              {
                "start": 39.356021,
                "end": 40.016021,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 40.856021,
                "end": 42.876021,
                "text": "“We need the little letter for mmm,”",
                "speaker": "lark"
              },
              {
                "start": 43.996021,
                "end": 44.736021,
                "text": "Lark said.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-06-initial",
                "at": 0,
                "stage": "lagoon",
                "flags": {
                  "parked": true,
                  "bridge": false,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              }
            ]
          }
        },
        {
          "id": "s3-letter",
          "kind": "challenge",
          "stage": "lagoon"
        },
        {
          "id": "narration-07",
          "kind": "narration",
          "text": "You examined the two keys. One had a straight stem and two little humps. That was m, the letter Lark had shown you. You fitted it into the empty slot.\n\nThe hum returned. One by one, the platforms lifted until a dry path stretched across the channel.\n\n“A bridge you can hear!” Nib exclaimed.\n\nBefore crossing, Lark bent the loose clip back into place. Nib gave the key a careful wiggle. It stayed put.\n\nThen the wagon rolled safely over the water.\n\n“I like this boat much better,” Nib said.",
          "speaker": "narrator",
          "stage": "lagoon",
          "duration": 39.24294784580499,
          "audio": {
            "file": "assets/audio/narration/07.mp3",
            "duration": 39.24294784580499,
            "source": "elevenlabs-upload",
            "sourceStart": 442.888764,
            "sourceEnd": 482.131701,
            "cues": [
              {
                "start": 0.541236,
                "end": 10.551236,
                "text": "You examined the two keys. One had a straight stem and two little humps. That was m, the letter Lark had shown you. You fitted it into the empty slot.",
                "speaker": "narrator"
              },
              {
                "start": 11.351236,
                "end": 18.491236,
                "text": "The hum returned. One by one, the platforms lifted until a dry path stretched across the channel.",
                "speaker": "narrator"
              },
              {
                "start": 18.491236,
                "end": 20.991236,
                "text": "“A bridge you can hear!”",
                "speaker": "nib"
              },
              {
                "start": 21.511236,
                "end": 22.731236,
                "text": "Nib exclaimed.",
                "speaker": "narrator"
              },
              {
                "start": 23.371236,
                "end": 31.431236,
                "text": "Before crossing, Lark bent the loose clip back into place. Nib gave the key a careful wiggle. It stayed put.",
                "speaker": "narrator"
              },
              {
                "start": 31.501236,
                "end": 34.521236,
                "text": "Then the wagon rolled safely over the water.",
                "speaker": "narrator"
              },
              {
                "start": 35.681236,
                "end": 37.401236,
                "text": "“I like this boat much better,”",
                "speaker": "nib"
              },
              {
                "start": 38.281236,
                "end": 38.861236,
                "text": "Nib said.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-07-initial",
                "at": 0,
                "stage": "lagoon",
                "flags": {
                  "parked": true,
                  "bridge": false,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              },
              {
                "key": "source-visual-08",
                "stage": "lagoon",
                "action": "bridge-rise",
                "duration": 4,
                "flags": {
                  "bridge": true
                },
                "at": 11.351236
              },
              {
                "key": "source-visual-09",
                "stage": "lagoon",
                "action": "cross-bridge",
                "duration": 4,
                "at": 31.501236
              }
            ]
          }
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
          "id": "narration-08",
          "kind": "narration",
          "text": "The woods smelled of damp earth and green leaves. A storm had scattered branches across the paths and knocked down the direction signs. One trail marker remained: a moon above three carved pictures. Moss. A mushroom. The river dock.\n\nLark was studying the pictures when Nib spotted a muddy slope.\n\n“Or… that way,” Nib said.\n\nIt certainly looked shorter. It also swallowed the wagon's front wheel with a deep, satisfied plop.\n\nNib pulled. The wagon stayed where it was. His goggles slid down.\n\n“The shortcut has become a long cut,” Nib said.\n\nLark braced the wagon while Nib looped their rope around the axle. You helped them pull. The wheel came free so suddenly that Nib sat down in the mud.\n\nWhen he stood, one foot wore an enormous brown boot.\n\n“Let's use the trail clues,” Lark said.\n\n“You find the way. I'll watch the wheels,” Nib said.\n\nAt the first fork, bare rocks covered one path. Soft green moss carpeted the other.\n\nLark said both names slowly enough to hear their beginnings.\n\n“Rock. Moss. Mmm… moss. Which one starts with our little hum?” Lark asked.",
          "speaker": "narrator",
          "stage": "woods-moss",
          "duration": 90.11900226757369,
          "audio": {
            "file": "assets/audio/narration/08.mp3",
            "duration": 90.11900226757369,
            "source": "elevenlabs-upload",
            "sourceStart": 482.131701,
            "sourceEnd": 572.250703,
            "cues": [
              {
                "start": 0.458299,
                "end": 15.228299,
                "text": "The woods smelled of damp earth and green leaves. A storm had scattered branches across the paths and knocked down the direction signs. One trail marker remained: a moon above three carved pictures. Moss.",
                "speaker": "narrator"
              },
              {
                "start": 15.528299,
                "end": 17.628299,
                "text": "A mushroom. The river dock.",
                "speaker": "narrator"
              },
              {
                "start": 18.528299,
                "end": 22.408299,
                "text": "Lark was studying the pictures when Nib spotted a muddy slope.",
                "speaker": "narrator"
              },
              {
                "start": 22.908299,
                "end": 24.928299,
                "text": "“Or… that way,”",
                "speaker": "nib"
              },
              {
                "start": 25.168299,
                "end": 26.408299,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 26.648299,
                "end": 33.928299,
                "text": "It certainly looked shorter. It also swallowed the wagon's front wheel with a deep, satisfied plop.",
                "speaker": "narrator"
              },
              {
                "start": 34.848299,
                "end": 39.748299,
                "text": "Nib pulled. The wagon stayed where it was. His goggles slid down.",
                "speaker": "narrator"
              },
              {
                "start": 40.328299,
                "end": 43.228299,
                "text": "“The shortcut has become a long cut,”",
                "speaker": "nib"
              },
              {
                "start": 43.528299,
                "end": 44.628299,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 45.188299,
                "end": 55.228299,
                "text": "Lark braced the wagon while Nib looped their rope around the axle. You helped them pull. The wheel came free so suddenly that Nib sat down in the mud.",
                "speaker": "narrator"
              },
              {
                "start": 56.548299,
                "end": 60.088299,
                "text": "When he stood, one foot wore an enormous brown boot.",
                "speaker": "narrator"
              },
              {
                "start": 60.648299,
                "end": 62.748299,
                "text": "“Let's use the trail clues,”",
                "speaker": "lark"
              },
              {
                "start": 63.148299,
                "end": 64.208299,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 64.628299,
                "end": 67.348299,
                "text": "“You find the way. I'll watch the wheels,”",
                "speaker": "nib"
              },
              {
                "start": 68.008299,
                "end": 68.908299,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 69.528299,
                "end": 75.518299,
                "text": "At the first fork, bare rocks covered one path. Soft green moss carpeted the other.",
                "speaker": "narrator"
              },
              {
                "start": 76.898299,
                "end": 79.938299,
                "text": "Lark said both names slowly enough to hear their beginnings.",
                "speaker": "narrator"
              },
              {
                "start": 81.278299,
                "end": 87.738299,
                "text": "“Rock. Moss. Mmm… moss. Which one starts with our little hum?”",
                "speaker": "lark"
              },
              {
                "start": 88.778299,
                "end": 89.598299,
                "text": "Lark asked.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-08-initial",
                "at": 0,
                "stage": "woods-moss",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              },
              {
                "key": "source-visual-10",
                "stage": "woods-moss",
                "at": 0.458299
              },
              {
                "key": "source-visual-11",
                "stage": "woods-moss",
                "action": "mud-stuck",
                "duration": 6,
                "at": 26.648299
              },
              {
                "key": "source-visual-12",
                "stage": "woods-moss",
                "action": "mud-free",
                "duration": 4,
                "at": 51.228299
              }
            ]
          }
        },
        {
          "id": "s4-moss",
          "kind": "challenge",
          "stage": "woods-moss"
        },
        {
          "id": "narration-09",
          "kind": "narration",
          "text": "Moss. You led the way onto the green path. The wagon rolled easily, and Nib bounced once on the springy ground.\n\n“It's a carpet. The woods have a carpet,” Nib said.\n\nAt the next fork, a yellow flower nodded beside one trail. A small mushroom stood beside the other.\n\n“Mushroom. Flower. Listen for mmm at the beginning,” Lark said.",
          "speaker": "narrator",
          "stage": "woods-moss",
          "duration": 28.372426303854876,
          "audio": {
            "file": "assets/audio/narration/09.mp3",
            "duration": 28.372426303854876,
            "source": "elevenlabs-upload",
            "sourceStart": 572.250703,
            "sourceEnd": 600.623129,
            "cues": [
              {
                "start": 0.459297,
                "end": 8.109297,
                "text": "Moss. You led the way onto the green path. The wagon rolled easily, and Nib bounced once on the springy ground.",
                "speaker": "narrator"
              },
              {
                "start": 8.569297,
                "end": 11.789297,
                "text": "“It's a carpet. The woods have a carpet,”",
                "speaker": "nib"
              },
              {
                "start": 12.309297,
                "end": 13.349297,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 13.729297,
                "end": 20.659297,
                "text": "At the next fork, a yellow flower nodded beside one trail. A small mushroom stood beside the other.",
                "speaker": "narrator"
              },
              {
                "start": 22.079297,
                "end": 26.159297,
                "text": "“Mushroom. Flower. Listen for mmm at the beginning,”",
                "speaker": "lark"
              },
              {
                "start": 27.119297,
                "end": 27.759297,
                "text": "Lark said.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-09-initial",
                "at": 0,
                "stage": "woods-moss",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              },
              {
                "key": "source-visual-13",
                "stage": "woods-moss",
                "action": "travel",
                "duration": 4,
                "at": 0.459297
              },
              {
                "key": "source-visual-14",
                "stage": "woods-mushroom",
                "at": 13.729297
              }
            ]
          }
        },
        {
          "id": "s4-mushroom",
          "kind": "challenge",
          "stage": "woods-mushroom"
        },
        {
          "id": "narration-10",
          "kind": "narration",
          "text": "Mushroom began with the sound you knew. Its path curved around the hill, passed beneath a fallen branch, and opened onto the river.\n\nThere, across the shining water, a little ferry waited at an island landing. On its roof hung a crescent lantern. Something pale glowed inside.\n\n“There! That's our treasure!” Nib exclaimed.\n\nHe took a triumphant step. His mud boot stayed behind.\n\nNib looked back at it.\n\n“You can keep that,” Nib said.",
          "speaker": "narrator",
          "stage": "woods-mushroom",
          "duration": 35.635986394557825,
          "audio": {
            "file": "assets/audio/narration/10.mp3",
            "duration": 35.635986394557825,
            "source": "elevenlabs-upload",
            "sourceStart": 600.623129,
            "sourceEnd": 636.259116,
            "cues": [
              {
                "start": 0.806871,
                "end": 9.056871,
                "text": "Mushroom began with the sound you knew. Its path curved around the hill, passed beneath a fallen branch, and opened onto the river.",
                "speaker": "narrator"
              },
              {
                "start": 9.876871,
                "end": 20.736871,
                "text": "There, across the shining water, a little ferry waited at an island landing. On its roof hung a crescent lantern. Something pale glowed inside.",
                "speaker": "narrator"
              },
              {
                "start": 21.316871,
                "end": 23.416871,
                "text": "“There! That's our treasure!”",
                "speaker": "nib"
              },
              {
                "start": 24.186871,
                "end": 25.316871,
                "text": "Nib exclaimed.",
                "speaker": "narrator"
              },
              {
                "start": 25.316871,
                "end": 29.886871,
                "text": "He took a triumphant step. His mud boot stayed behind.",
                "speaker": "narrator"
              },
              {
                "start": 30.466871,
                "end": 32.146871,
                "text": "Nib looked back at it.",
                "speaker": "narrator"
              },
              {
                "start": 32.866871,
                "end": 33.686871,
                "text": "“You can keep that,”",
                "speaker": "nib"
              },
              {
                "start": 34.626871,
                "end": 35.246871,
                "text": "Nib said.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-10-initial",
                "at": 0,
                "stage": "woods-mushroom",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              },
              {
                "key": "source-visual-15",
                "stage": "woods-mushroom",
                "action": "travel",
                "duration": 5,
                "at": 0.806871
              }
            ]
          }
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
          "id": "narration-11",
          "kind": "narration",
          "text": "The dock was weathered silver by wind and water. Two bell ropes hung from a post. Beside them stood a copper control panel, streaked with dried mud.\n\nInside a dry wooden box, you found a book. The ferry on its cover looked exactly like the one across the river.\n\n“A book about our boat,” Nib said.\n\nLark settled beside you and opened it. The first picture showed an explorer holding a lantern over a map. Where the light touched the paper, a hidden path appeared.\n\n“The moon ferry carries a special lantern. Its moonstone light can show paths hidden in explorer maps,” Lark said.\n\n“That's exactly what we need,” Nib said.\n\nOn the next page, a drawing showed the dock's copper panel, then a bell. Lark read the instructions beneath it.\n\n“To call the ferry home, first mend the mark on the dock. Then ring the bell beside the same mark,” Lark said.\n\nThere was the little letter again. A straight stem. Two humps. You had met it at the lagoon.",
          "speaker": "narrator",
          "stage": "river-book",
          "duration": 73.0478231292517,
          "audio": {
            "file": "assets/audio/narration/11.mp3",
            "duration": 73.0478231292517,
            "source": "elevenlabs-upload",
            "sourceStart": 636.259116,
            "sourceEnd": 709.30695,
            "cues": [
              {
                "start": 0.430884,
                "end": 10.240884,
                "text": "The dock was weathered silver by wind and water. Two bell ropes hung from a post. Beside them stood a copper control panel, streaked with dried mud.",
                "speaker": "narrator"
              },
              {
                "start": 11.140884,
                "end": 18.040884,
                "text": "Inside a dry wooden box, you found a book. The ferry on its cover looked exactly like the one across the river.",
                "speaker": "narrator"
              },
              {
                "start": 18.480884,
                "end": 20.320884,
                "text": "“A book about our boat,”",
                "speaker": "nib"
              },
              {
                "start": 20.760884,
                "end": 21.780884,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 22.560884,
                "end": 33.300884,
                "text": "Lark settled beside you and opened it. The first picture showed an explorer holding a lantern over a map. Where the light touched the paper, a hidden path appeared.",
                "speaker": "narrator"
              },
              {
                "start": 33.300884,
                "end": 40.840884,
                "text": "“The moon ferry carries a special lantern. Its moonstone light can show paths hidden in explorer maps,”",
                "speaker": "lark"
              },
              {
                "start": 41.320884,
                "end": 42.320884,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 43.000884,
                "end": 45.280884,
                "text": "“That's exactly what we need,”",
                "speaker": "nib"
              },
              {
                "start": 45.960884,
                "end": 46.660884,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 47.420884,
                "end": 55.440884,
                "text": "On the next page, a drawing showed the dock's copper panel, then a bell. Lark read the instructions beneath it.",
                "speaker": "narrator"
              },
              {
                "start": 55.940884,
                "end": 63.670884,
                "text": "“To call the ferry home, first mend the mark on the dock. Then ring the bell beside the same mark,”",
                "speaker": "lark"
              },
              {
                "start": 64.690884,
                "end": 65.330884,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 65.930884,
                "end": 72.480884,
                "text": "There was the little letter again. A straight stem. Two humps. You had met it at the lagoon.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-11-initial",
                "at": 0,
                "stage": "river-book",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              },
              {
                "key": "source-visual-16",
                "stage": "river-book",
                "at": 0.430884
              },
              {
                "key": "source-visual-17",
                "stage": "river-book",
                "action": "book-open",
                "duration": 3,
                "at": 22.560884
              }
            ]
          }
        },
        {
          "id": "s5-coread",
          "kind": "challenge",
          "stage": "river-book",
          "optional": true
        },
        {
          "id": "narration-12",
          "kind": "narration",
          "text": "Nib reached for a bell rope, then stopped.\n\n“Hang on. What comes first? Fix the mark, or ring the bell?” Nib asked.",
          "speaker": "narrator",
          "stage": "river-book",
          "duration": 10.342607709750567,
          "audio": {
            "file": "assets/audio/narration/12.mp3",
            "duration": 10.342607709750567,
            "source": "elevenlabs-upload",
            "sourceStart": 709.30695,
            "sourceEnd": 719.649569,
            "cues": [
              {
                "start": 0.503118,
                "end": 2.89305,
                "text": "Nib reached for a bell rope, then stopped.",
                "speaker": "narrator"
              },
              {
                "start": 3.83305,
                "end": 8.21305,
                "text": "“Hang on. What comes first? Fix the mark, or ring the bell?”",
                "speaker": "nib"
              },
              {
                "start": 9.03305,
                "end": 9.81305,
                "text": "Nib asked.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-12-initial",
                "at": 0,
                "stage": "river-book",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              }
            ]
          }
        },
        {
          "id": "s5-sequence",
          "kind": "challenge",
          "stage": "river-book"
        },
        {
          "id": "narration-13",
          "kind": "narration",
          "text": "You looked from the book to the panel. The mark came first. Its copper groove was shaped like m, but the soft material inside had washed away. A break ran through the middle, leaving the bell post dark.\n\n“The groove is still here. We can mend it,” Lark said.\n\n“I'll get the boat rope ready. And one spare,” Nib said.\n\nHe made a sturdy loop, tested the knot, then made another loop large enough to fit over his own head. He considered it for a moment and wisely set it aside.",
          "speaker": "narrator",
          "stage": "river-book",
          "duration": 34.777800453514736,
          "audio": {
            "file": "assets/audio/narration/13.mp3",
            "duration": 34.777800453514736,
            "source": "elevenlabs-upload",
            "sourceStart": 719.649569,
            "sourceEnd": 754.427369,
            "cues": [
              {
                "start": 0.590431,
                "end": 9.850431,
                "text": "You looked from the book to the panel. The mark came first. Its copper groove was shaped like m, but the soft material inside had washed away.",
                "speaker": "narrator"
              },
              {
                "start": 10.210431,
                "end": 13.670431,
                "text": "A break ran through the middle, leaving the bell post dark.",
                "speaker": "narrator"
              },
              {
                "start": 14.070431,
                "end": 17.250431,
                "text": "“The groove is still here. We can mend it,”",
                "speaker": "lark"
              },
              {
                "start": 17.790431,
                "end": 18.550431,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 19.170431,
                "end": 22.330431,
                "text": "“I'll get the boat rope ready. And one spare,”",
                "speaker": "nib"
              },
              {
                "start": 22.810431,
                "end": 23.690431,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 24.170431,
                "end": 34.300431,
                "text": "He made a sturdy loop, tested the knot, then made another loop large enough to fit over his own head. He considered it for a moment and wisely set it aside.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-13-initial",
                "at": 0,
                "stage": "river-book",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              }
            ]
          }
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
          "id": "narration-14",
          "kind": "narration",
          "text": "Lark brushed the mud from the copper groove. A small pot of soft repair paste hung beside it, with a broad-tipped tool tucked into the handle. Nib stirred the paste with his wooden spoon, looking pleased that he had packed it after all. Then he passed you the tool.\n\n“Start at the top. Down. Back up and over, down. Up and over, down,” Lark said.\n\nYou can follow that little m in the air with your finger, if you like. One downstroke. Then two rounded humps, each coming down to the bottom.",
          "speaker": "narrator",
          "stage": "river-trace",
          "duration": 36.03981859410431,
          "audio": {
            "file": "assets/audio/narration/14.mp3",
            "duration": 36.03981859410431,
            "source": "elevenlabs-upload",
            "sourceStart": 754.427369,
            "sourceEnd": 790.467177,
            "cues": [
              {
                "start": 0.462631,
                "end": 9.192631,
                "text": "Lark brushed the mud from the copper groove. A small pot of soft repair paste hung beside it, with a broad-tipped tool tucked into the handle.",
                "speaker": "narrator"
              },
              {
                "start": 9.972631,
                "end": 17.012631,
                "text": "Nib stirred the paste with his wooden spoon, looking pleased that he had packed it after all. Then he passed you the tool.",
                "speaker": "narrator"
              },
              {
                "start": 17.832631,
                "end": 24.332631,
                "text": "“Start at the top. Down. Back up and over, down. Up and over, down,”",
                "speaker": "lark"
              },
              {
                "start": 24.972631,
                "end": 25.892631,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 26.412631,
                "end": 35.382631,
                "text": "You can follow that little m in the air with your finger, if you like. One downstroke. Then two rounded humps, each coming down to the bottom.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-14-initial",
                "at": 0,
                "stage": "river-trace",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              },
              {
                "key": "source-visual-18",
                "stage": "river-trace",
                "at": 0.462631
              }
            ]
          }
        },
        {
          "id": "s6-trace",
          "kind": "challenge",
          "stage": "river-trace"
        },
        {
          "id": "narration-15",
          "kind": "narration",
          "text": "At the dock, you worked slowly along the wide groove. Lark steadied the paste pot. Nib kept the rope out of the water. The first stem filled. Then the first hump. Then the second.\n\nA thread of light ran through the repaired letter, along the copper strip, and all the way to the bell post.\n\n“Look! It goes all the way to the bell,” Nib murmured.\n\nLark checked the book once more. First, mend the mark. Done. Next, ring the matching bell.\n\nShe gave the rope beneath m a gentle pull. A low, humming note traveled over the water. The ferry's little paddle began to turn, and the boat glided away from the island.\n\nNib caught its bow with his rope and pulled it alongside the dock.\n\n“Hello, treasure,” Nib whispered.\n\nHe stepped aboard and lifted the lantern from its hook. Its light shone through his whiskers.\n\nBehind him, the boarding rope slipped off a short post.\n\nThe dock began moving away.\n\nNo. The dock was staying exactly where it was.\n\n“Lark?” Nib asked.\n\n“I see it,” Lark said.\n\n“The boat is doing a leaving,” Nib said.",
          "speaker": "narrator",
          "stage": "river-trace",
          "duration": 82.35700680272109,
          "audio": {
            "file": "assets/audio/narration/15.mp3",
            "duration": 82.35700680272109,
            "source": "elevenlabs-upload",
            "sourceStart": 790.467177,
            "sourceEnd": 872.824173,
            "cues": [
              {
                "start": 0.518197,
                "end": 13.032823,
                "text": "At the dock, you worked slowly along the wide groove. Lark steadied the paste pot. Nib kept the rope out of the water. The first stem filled. Then the first hump. Then the second.",
                "speaker": "narrator"
              },
              {
                "start": 13.492823,
                "end": 20.112823,
                "text": "A thread of light ran through the repaired letter, along the copper strip, and all the way to the bell post.",
                "speaker": "narrator"
              },
              {
                "start": 21.072823,
                "end": 23.972823,
                "text": "“Look! It goes all the way to the bell,”",
                "speaker": "nib"
              },
              {
                "start": 24.572823,
                "end": 25.732823,
                "text": "Nib murmured.",
                "speaker": "narrator"
              },
              {
                "start": 26.432823,
                "end": 33.852823,
                "text": "Lark checked the book once more. First, mend the mark. Done. Next, ring the matching bell.",
                "speaker": "narrator"
              },
              {
                "start": 34.212823,
                "end": 45.652823,
                "text": "She gave the rope beneath m a gentle pull. A low, humming note traveled over the water. The ferry's little paddle began to turn, and the boat glided away from the island.",
                "speaker": "narrator"
              },
              {
                "start": 46.352823,
                "end": 50.072823,
                "text": "Nib caught its bow with his rope and pulled it alongside the dock.",
                "speaker": "narrator"
              },
              {
                "start": 50.612823,
                "end": 51.852823,
                "text": "“Hello, treasure,”",
                "speaker": "nib"
              },
              {
                "start": 52.592823,
                "end": 53.832823,
                "text": "Nib whispered.",
                "speaker": "narrator"
              },
              {
                "start": 53.832823,
                "end": 59.992823,
                "text": "He stepped aboard and lifted the lantern from its hook. Its light shone through his whiskers.",
                "speaker": "narrator"
              },
              {
                "start": 60.832823,
                "end": 64.492823,
                "text": "Behind him, the boarding rope slipped off a short post.",
                "speaker": "narrator"
              },
              {
                "start": 65.052823,
                "end": 67.212823,
                "text": "The dock began moving away.",
                "speaker": "narrator"
              },
              {
                "start": 68.032823,
                "end": 71.772823,
                "text": "No. The dock was staying exactly where it was.",
                "speaker": "narrator"
              },
              {
                "start": 72.342823,
                "end": 73.402823,
                "text": "“Lark?”",
                "speaker": "nib"
              },
              {
                "start": 74.342823,
                "end": 75.062823,
                "text": "Nib asked.",
                "speaker": "narrator"
              },
              {
                "start": 75.942823,
                "end": 76.602823,
                "text": "“I see it,”",
                "speaker": "lark"
              },
              {
                "start": 77.402823,
                "end": 78.082823,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 78.862823,
                "end": 80.362823,
                "text": "“The boat is doing a leaving,”",
                "speaker": "nib"
              },
              {
                "start": 81.362823,
                "end": 81.982823,
                "text": "Nib said.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-15-initial",
                "at": 0,
                "stage": "river-trace",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": false,
                  "arrived": false,
                  "drifted": false,
                  "returned": false,
                  "stored": false
                }
              },
              {
                "key": "source-visual-19",
                "stage": "river-trace",
                "action": "repair-glow",
                "duration": 4,
                "flags": {
                  "repaired": true
                },
                "at": 13.492823
              },
              {
                "key": "source-visual-20",
                "stage": "river-rescue",
                "at": 34.212823
              },
              {
                "key": "source-visual-21",
                "stage": "river-rescue",
                "action": "boat-arrive",
                "duration": 6,
                "flags": {
                  "arrived": true
                },
                "at": 40.912823
              },
              {
                "key": "source-visual-22",
                "stage": "river-rescue",
                "action": "boat-drift",
                "duration": 5,
                "flags": {
                  "drifted": true,
                  "returned": false
                },
                "at": 60.832823
              }
            ]
          }
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
          "id": "narration-16",
          "kind": "narration",
          "text": "The ferry drifted into a lazy circle of current. A thick bed of reeds waited beyond it, and Nib was safely in the middle of the boat, but he would much rather have been in the middle of the dock.\n\nHe opened the umbrella and tried to paddle.\n\nIt turned inside out.\n\n“Still not a boat,” Nib said.\n\nThis time, however, he found a job for it. He folded the umbrella around the lantern and nestled the bundle between his feet.\n\nLark flew to a low branch. She could reach Nib, but a mouse and a lantern were far too heavy for one small songbird to carry.\n\n“Keep the stone safe. We can call you back,” Lark said.\n\n“I've got the rope. I've got the lantern. Ready when you are,” Nib said.\n\nLark returned to the dock. The copper repair still glowed. Both bell ropes hung within reach: one beneath s, and one beneath m.\n\nYou knew what the book had said. Ring the bell beside the same mark.\n\n“Which little letter makes mmm?” Lark asked.",
          "speaker": "narrator",
          "stage": "river-rescue",
          "duration": 70.70648526077098,
          "audio": {
            "file": "assets/audio/narration/16.mp3",
            "duration": 70.70648526077098,
            "source": "elevenlabs-upload",
            "sourceStart": 872.824173,
            "sourceEnd": 943.530657,
            "cues": [
              {
                "start": 0.445827,
                "end": 10.815827,
                "text": "The ferry drifted into a lazy circle of current. A thick bed of reeds waited beyond it, and Nib was safely in the middle of the boat, but he would much rather have been in",
                "speaker": "narrator"
              },
              {
                "start": 10.815827,
                "end": 11.815827,
                "text": "the middle of the dock.",
                "speaker": "narrator"
              },
              {
                "start": 12.495827,
                "end": 15.295827,
                "text": "He opened the umbrella and tried to paddle.",
                "speaker": "narrator"
              },
              {
                "start": 15.295827,
                "end": 17.695827,
                "text": "It turned inside out.",
                "speaker": "narrator"
              },
              {
                "start": 18.455827,
                "end": 19.975827,
                "text": "“Still not a boat,”",
                "speaker": "nib"
              },
              {
                "start": 20.535827,
                "end": 21.535827,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 21.935827,
                "end": 29.755827,
                "text": "This time, however, he found a job for it. He folded the umbrella around the lantern and nestled the bundle between his feet.",
                "speaker": "narrator"
              },
              {
                "start": 30.495827,
                "end": 38.695827,
                "text": "Lark flew to a low branch. She could reach Nib, but a mouse and a lantern were far too heavy for one small songbird to carry.",
                "speaker": "narrator"
              },
              {
                "start": 39.395827,
                "end": 42.635827,
                "text": "“Keep the stone safe. We can call you back,”",
                "speaker": "lark"
              },
              {
                "start": 43.235827,
                "end": 44.195827,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 44.195827,
                "end": 48.535827,
                "text": "“I've got the rope. I've got the lantern. Ready when you are,”",
                "speaker": "nib"
              },
              {
                "start": 49.015827,
                "end": 49.935827,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 50.335827,
                "end": 60.345827,
                "text": "Lark returned to the dock. The copper repair still glowed. Both bell ropes hung within reach: one beneath s, and one beneath m.",
                "speaker": "narrator"
              },
              {
                "start": 61.265827,
                "end": 65.065827,
                "text": "You knew what the book had said. Ring the bell beside the same mark.",
                "speaker": "narrator"
              },
              {
                "start": 66.485827,
                "end": 68.285827,
                "text": "“Which little letter makes mmm?”",
                "speaker": "lark"
              },
              {
                "start": 69.465827,
                "end": 70.305827,
                "text": "Lark asked.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-16-initial",
                "at": 0,
                "stage": "river-rescue",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": true,
                  "arrived": true,
                  "drifted": true,
                  "returned": false,
                  "stored": false
                }
              },
              {
                "key": "source-visual-23",
                "stage": "river-rescue",
                "flags": {
                  "drifted": true,
                  "returned": false
                },
                "at": 0.445827
              }
            ]
          }
        },
        {
          "id": "s7-bell",
          "kind": "challenge",
          "stage": "river-rescue"
        },
        {
          "id": "narration-17",
          "kind": "narration",
          "text": "You found the straight stem and two humps. The little m. You took its rope and pulled.\n\nThe low note sounded again. A shiver passed through the ferry. Its paddle dipped into the river, turned, and brought the bow around toward home.\n\nNib sat up so quickly that his goggles tipped sideways.\n\n“I'm doing a coming back!” Nib exclaimed.\n\nAs the ferry drew near, he threw his spare loop. Lark caught it and slipped it over a broad dock post. Nib pulled from his end until the boat rested snugly against the wood.\n\n“Rope on!” Lark said.\n\n“Boat stopped!” Nib said.\n\nHe stepped ashore, checked the lantern, and let out a long breath.\n\n“Treasure found. Mouse delivered,” Nib said with relief.\n\nFor a moment, nobody hurried. Water tapped softly beneath the dock. Nib unwound the umbrella from the lantern and gave you a small, sincere wave.\n\nLark settled beside you.\n\n“A little letter did a big job,” Lark said.",
          "speaker": "narrator",
          "stage": "river-rescue",
          "duration": 72.90678004535147,
          "audio": {
            "file": "assets/audio/narration/17.mp3",
            "duration": 72.90678004535147,
            "source": "elevenlabs-upload",
            "sourceStart": 943.530657,
            "sourceEnd": 1016.437437,
            "cues": [
              {
                "start": 0.439343,
                "end": 6.469343,
                "text": "You found the straight stem and two humps. The little m. You took its rope and pulled.",
                "speaker": "narrator"
              },
              {
                "start": 7.069343,
                "end": 16.789343,
                "text": "The low note sounded again. A shiver passed through the ferry. Its paddle dipped into the river, turned, and brought the bow around toward home.",
                "speaker": "narrator"
              },
              {
                "start": 17.569343,
                "end": 20.689343,
                "text": "Nib sat up so quickly that his goggles tipped sideways.",
                "speaker": "narrator"
              },
              {
                "start": 21.589343,
                "end": 23.509343,
                "text": "“I'm doing a coming back!”",
                "speaker": "nib"
              },
              {
                "start": 23.909343,
                "end": 25.149343,
                "text": "Nib exclaimed.",
                "speaker": "narrator"
              },
              {
                "start": 25.509343,
                "end": 37.229343,
                "text": "As the ferry drew near, he threw his spare loop. Lark caught it and slipped it over a broad dock post. Nib pulled from his end until the boat rested snugly against the wood.",
                "speaker": "narrator"
              },
              {
                "start": 37.909343,
                "end": 38.789343,
                "text": "“Rope on!”",
                "speaker": "lark"
              },
              {
                "start": 40.969343,
                "end": 41.369343,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 41.369343,
                "end": 42.049343,
                "text": "“Boat stopped!”",
                "speaker": "nib"
              },
              {
                "start": 42.409343,
                "end": 43.329343,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 43.869343,
                "end": 48.449343,
                "text": "He stepped ashore, checked the lantern, and let out a long breath.",
                "speaker": "narrator"
              },
              {
                "start": 49.049343,
                "end": 51.829343,
                "text": "“Treasure found. Mouse delivered,”",
                "speaker": "nib"
              },
              {
                "start": 52.849343,
                "end": 54.109343,
                "text": "Nib said with relief.",
                "speaker": "narrator"
              },
              {
                "start": 54.709343,
                "end": 65.499343,
                "text": "For a moment, nobody hurried. Water tapped softly beneath the dock. Nib unwound the umbrella from the lantern and gave you a small, sincere wave.",
                "speaker": "narrator"
              },
              {
                "start": 66.459343,
                "end": 67.659343,
                "text": "Lark settled beside you.",
                "speaker": "narrator"
              },
              {
                "start": 68.659343,
                "end": 70.699343,
                "text": "“A little letter did a big job,”",
                "speaker": "lark"
              },
              {
                "start": 71.679343,
                "end": 72.299343,
                "text": "Lark said.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-17-initial",
                "at": 0,
                "stage": "river-rescue",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": true,
                  "arrived": true,
                  "drifted": true,
                  "returned": false,
                  "stored": false
                }
              },
              {
                "key": "source-visual-24",
                "stage": "river-rescue",
                "action": "boat-return",
                "duration": 6,
                "flags": {
                  "returned": true,
                  "drifted": false
                },
                "at": 7.069343
              }
            ]
          }
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
          "id": "narration-18",
          "kind": "narration",
          "text": "Evening was turning the river blue when the lantern opened. Inside rested a smooth, pale stone, small enough to fit in Nib's cupped paws.\n\n“It's smaller than I thought,” Nib said softly.\n\n“Try its light on the map,” Lark said.",
          "speaker": "narrator",
          "stage": "stone",
          "duration": 19.183356009070295,
          "audio": {
            "file": "assets/audio/narration/18.mp3",
            "duration": 19.183356009070295,
            "source": "elevenlabs-upload",
            "sourceStart": 1016.437437,
            "sourceEnd": 1035.620783,
            "cues": [
              {
                "start": 0.732563,
                "end": 10.112563,
                "text": "Evening was turning the river blue when the lantern opened. Inside rested a smooth, pale stone, small enough to fit in Nib's cupped paws.",
                "speaker": "narrator"
              },
              {
                "start": 11.012563,
                "end": 12.532563,
                "text": "“It's smaller than I thought,”",
                "speaker": "nib"
              },
              {
                "start": 13.512563,
                "end": 14.552563,
                "text": "Nib said softly.",
                "speaker": "narrator"
              },
              {
                "start": 15.232563,
                "end": 17.332563,
                "text": "“Try its light on the map,”",
                "speaker": "lark"
              },
              {
                "start": 18.092563,
                "end": 18.712563,
                "text": "Lark said.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-18-initial",
                "at": 0,
                "stage": "stone",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": true,
                  "arrived": true,
                  "drifted": false,
                  "returned": true,
                  "stored": false
                }
              },
              {
                "key": "source-visual-25",
                "stage": "stone",
                "at": 0.732563
              }
            ]
          }
        },
        {
          "id": "s8-reveal",
          "kind": "challenge",
          "stage": "stone"
        },
        {
          "id": "narration-19",
          "kind": "narration",
          "text": "You unfolded the torn paper and moved the moonstone above it. At first, nothing changed. Then a pale dot appeared. Another followed. A whole trail emerged beneath the glow, curving past the river toward a cluster of fruit trees.\n\nAn orchard.\n\nBeside it shone the outline of another map piece.\n\n“There! That's where we go next,” Lark exclaimed.\n\nNib followed the new trail with a paw until it reached the torn edge.\n\n“And after the orchard?” Nib asked.\n\n“We'll find out when we get that piece,” Lark said.\n\n“One adventure at a time,” Nib said.\n\nYou tilted the moonstone. Another faint drawing appeared in the margin: an explorer holding an extremely large sandwich.\n\nNib stared.\n\n“It understands me,” Nib murmured.\n\nLark opened a small treasure case. Inside was a soft-lined compartment, just the right size for the moonstone.\n\n“Our first treasure belongs in your collection. We can take it out when we need its light,” Lark said.",
          "speaker": "narrator",
          "stage": "stone",
          "duration": 74.73972789115646,
          "audio": {
            "file": "assets/audio/narration/19.mp3",
            "duration": 74.73972789115646,
            "source": "elevenlabs-upload",
            "sourceStart": 1035.620783,
            "sourceEnd": 1110.360544,
            "cues": [
              {
                "start": 0.509217,
                "end": 10.159217,
                "text": "You unfolded the torn paper and moved the moonstone above it. At first, nothing changed. Then a pale dot appeared. Another followed.",
                "speaker": "narrator"
              },
              {
                "start": 10.499217,
                "end": 16.759217,
                "text": "A whole trail emerged beneath the glow, curving past the river toward a cluster of fruit trees.",
                "speaker": "narrator"
              },
              {
                "start": 16.979217,
                "end": 18.279217,
                "text": "An orchard.",
                "speaker": "narrator"
              },
              {
                "start": 19.159217,
                "end": 22.339217,
                "text": "Beside it shone the outline of another map piece.",
                "speaker": "narrator"
              },
              {
                "start": 22.799217,
                "end": 25.379217,
                "text": "“There! That's where we go next,”",
                "speaker": "lark"
              },
              {
                "start": 25.779217,
                "end": 27.139217,
                "text": "Lark exclaimed.",
                "speaker": "narrator"
              },
              {
                "start": 27.139217,
                "end": 32.199217,
                "text": "Nib followed the new trail with a paw until it reached the torn edge.",
                "speaker": "narrator"
              },
              {
                "start": 32.579217,
                "end": 34.199217,
                "text": "“And after the orchard?”",
                "speaker": "nib"
              },
              {
                "start": 34.969217,
                "end": 35.819217,
                "text": "Nib asked.",
                "speaker": "narrator"
              },
              {
                "start": 36.239217,
                "end": 38.799217,
                "text": "“We'll find out when we get that piece,”",
                "speaker": "lark"
              },
              {
                "start": 39.259217,
                "end": 40.279217,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 40.939217,
                "end": 42.859217,
                "text": "“One adventure at a time,”",
                "speaker": "nib"
              },
              {
                "start": 43.589217,
                "end": 44.339217,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 44.819217,
                "end": 53.139217,
                "text": "You tilted the moonstone. Another faint drawing appeared in the margin: an explorer holding an extremely large sandwich.",
                "speaker": "narrator"
              },
              {
                "start": 53.819217,
                "end": 54.999217,
                "text": "Nib stared.",
                "speaker": "narrator"
              },
              {
                "start": 54.999217,
                "end": 57.199217,
                "text": "“It understands me,”",
                "speaker": "nib"
              },
              {
                "start": 57.599217,
                "end": 58.759217,
                "text": "Nib murmured.",
                "speaker": "narrator"
              },
              {
                "start": 59.479217,
                "end": 67.069217,
                "text": "Lark opened a small treasure case. Inside was a soft-lined compartment, just the right size for the moonstone.",
                "speaker": "narrator"
              },
              {
                "start": 67.289217,
                "end": 72.749217,
                "text": "“Our first treasure belongs in your collection. We can take it out when we need its light,”",
                "speaker": "lark"
              },
              {
                "start": 73.669217,
                "end": 74.329217,
                "text": "Lark said.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-19-initial",
                "at": 0,
                "stage": "stone",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": true,
                  "arrived": true,
                  "drifted": false,
                  "returned": true,
                  "stored": false
                }
              },
              {
                "key": "source-visual-26",
                "stage": "stone",
                "action": "stone-reveal",
                "duration": 4,
                "at": 10.499217
              }
            ]
          }
        },
        {
          "id": "s8-collect",
          "kind": "challenge",
          "stage": "stone"
        },
        {
          "id": "narration-20",
          "kind": "narration",
          "text": "You settled the stone into its place. Nib laid his sandwich beside it.\n\nLark looked at the sandwich. Then she looked at Nib.\n\n“That goes in the picnic basket,” Lark said.\n\n“Different kinds of treasure,” Nib said.",
          "speaker": "narrator",
          "stage": "stone",
          "duration": 17.834421768707482,
          "audio": {
            "file": "assets/audio/narration/20.mp3",
            "duration": 17.834421768707482,
            "source": "elevenlabs-upload",
            "sourceStart": 1110.360544,
            "sourceEnd": 1128.194966,
            "cues": [
              {
                "start": 0.469456,
                "end": 5.099456,
                "text": "You settled the stone into its place. Nib laid his sandwich beside it.",
                "speaker": "narrator"
              },
              {
                "start": 5.799456,
                "end": 9.349456,
                "text": "Lark looked at the sandwich. Then she looked at Nib.",
                "speaker": "narrator"
              },
              {
                "start": 10.469456,
                "end": 12.069456,
                "text": "“That goes in the picnic basket,”",
                "speaker": "lark"
              },
              {
                "start": 13.009456,
                "end": 13.669456,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 14.629456,
                "end": 15.889456,
                "text": "“Different kinds of treasure,”",
                "speaker": "nib"
              },
              {
                "start": 16.869456,
                "end": 17.489456,
                "text": "Nib said.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-20-initial",
                "at": 0,
                "stage": "stone",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": true,
                  "arrived": true,
                  "drifted": false,
                  "returned": true,
                  "stored": false
                }
              },
              {
                "key": "source-visual-27",
                "stage": "stone",
                "action": "treasure-store",
                "duration": 3,
                "flags": {
                  "stored": true
                },
                "at": 0.469456
              }
            ]
          }
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
          "id": "narration-21",
          "kind": "narration",
          "text": "By the time you reached camp, the treehouse windows glowed among the leaves. Nib parked the Adventure Wagon and wedged a large rock behind each wheel. Lark brought out the crew's journal.\n\nOn its first page, she had drawn the battered case, the torn map, and a small mouse with his nose poking through the middle.\n\n“One adventure. One chapter,” Lark said.\n\n“Did you put the rescue in?” Nib asked.\n\n“All of it,” Lark said.\n\n“Even the umbrella?” Nib asked.\n\n“Especially the umbrella,” Lark said.\n\nYou sat together beneath the treehouse lamp while Lark read. There was the lagoon, with its humming bridge. There were the mossy path and the little mushroom. There was the book that showed you what to do, and the broken mark you had mended together.\n\nWhen she reached the picture of m, Lark paused.",
          "speaker": "narrator",
          "stage": "journal",
          "duration": 60.693832199546485,
          "audio": {
            "file": "assets/audio/narration/21.mp3",
            "duration": 60.693832199546485,
            "source": "elevenlabs-upload",
            "sourceStart": 1128.194966,
            "sourceEnd": 1188.888787,
            "cues": [
              {
                "start": 0.415034,
                "end": 12.165034,
                "text": "By the time you reached camp, the treehouse windows glowed among the leaves. Nib parked the Adventure Wagon and wedged a large rock behind each wheel. Lark brought out the crew's journal.",
                "speaker": "narrator"
              },
              {
                "start": 12.165034,
                "end": 20.445034,
                "text": "On its first page, she had drawn the battered case, the torn map, and a small mouse with his nose poking through the middle.",
                "speaker": "narrator"
              },
              {
                "start": 20.445034,
                "end": 23.945034,
                "text": "“One adventure. One chapter,”",
                "speaker": "lark"
              },
              {
                "start": 24.505034,
                "end": 25.685034,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 25.685034,
                "end": 28.245034,
                "text": "“Did you put the rescue in?”",
                "speaker": "nib"
              },
              {
                "start": 29.055034,
                "end": 29.905034,
                "text": "Nib asked.",
                "speaker": "narrator"
              },
              {
                "start": 30.345034,
                "end": 31.345034,
                "text": "“All of it,”",
                "speaker": "lark"
              },
              {
                "start": 31.345034,
                "end": 32.885034,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 33.805034,
                "end": 34.565034,
                "text": "“Even the umbrella?”",
                "speaker": "nib"
              },
              {
                "start": 35.145034,
                "end": 36.385034,
                "text": "Nib asked.",
                "speaker": "narrator"
              },
              {
                "start": 37.245034,
                "end": 38.885034,
                "text": "“Especially the umbrella,”",
                "speaker": "lark"
              },
              {
                "start": 39.485034,
                "end": 40.585034,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 41.025034,
                "end": 50.625034,
                "text": "You sat together beneath the treehouse lamp while Lark read. There was the lagoon, with its humming bridge. There were the mossy path and the little mushroom.",
                "speaker": "narrator"
              },
              {
                "start": 50.625034,
                "end": 55.995034,
                "text": "There was the book that showed you what to do, and the broken mark you had mended together.",
                "speaker": "narrator"
              },
              {
                "start": 56.535034,
                "end": 59.935034,
                "text": "When she reached the picture of m, Lark paused.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-21-initial",
                "at": 0,
                "stage": "journal",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": true,
                  "arrived": true,
                  "drifted": false,
                  "returned": true,
                  "stored": true
                }
              },
              {
                "key": "source-visual-28",
                "stage": "journal",
                "flags": {
                  "parked": true
                },
                "at": 0.415034
              }
            ]
          }
        },
        {
          "id": "s9-reread",
          "kind": "challenge",
          "stage": "journal",
          "optional": true
        },
        {
          "id": "narration-22",
          "kind": "narration",
          "text": "“And it made this sound… mmm,” Lark said gently.\n\nThe next picture showed Nib on the ferry, one paw holding the rope and the other resting on the bundled lantern.\n\n“The umbrella helped very little,” Nib said.\n\nOn the last page, a moonlit trail led into an orchard. Beyond it, Lark had left the paper blank.\n\nThere would be more journeys to put there. More pieces of the map to find. More chapters to read again.\n\nFor now, your first adventure was safe between the covers. Lark placed the journal on the camp library shelf.\n\n“I'll bring the map next time,” Lark said.\n\n“I'll bring the wagon,” Nib said.\n\nHe proudly showed you his new brake: an enormous cushion tied across the wagon's front.\n\nLark studied it.\n\n“Those are your brakes?” Lark asked.\n\n“Very comfortable brakes,” Nib said.\n\nSomething small rustled down the path. An apple rolled out of the dusk, bumped against the wagon wheel, and stopped beside Nib's foot.\n\nHe picked it up. You all looked toward the distant orchard.\n\n“Oh. The next adventure sent a snack,” Nib said.\n\nAbove the treehouse, the first star appeared. On the library shelf, a new book waited. And inside the little treasure case, the moonstone shone softly, ready for whatever came next.",
          "speaker": "narrator",
          "stage": "journal",
          "duration": 98.06358276643991,
          "audio": {
            "file": "assets/audio/narration/22.mp3",
            "duration": 98.06358276643991,
            "source": "elevenlabs-upload",
            "sourceStart": 1188.888787,
            "sourceEnd": 1286.952375,
            "cues": [
              {
                "start": 0.341213,
                "end": 2.601213,
                "text": "“And it made this sound… mmm,”",
                "speaker": "lark"
              },
              {
                "start": 4.001213,
                "end": 4.941213,
                "text": "Lark said gently.",
                "speaker": "narrator"
              },
              {
                "start": 5.571213,
                "end": 12.651213,
                "text": "The next picture showed Nib on the ferry, one paw holding the rope and the other resting on the bundled lantern.",
                "speaker": "narrator"
              },
              {
                "start": 13.271213,
                "end": 15.571213,
                "text": "“The umbrella helped very little,”",
                "speaker": "nib"
              },
              {
                "start": 16.111213,
                "end": 16.991213,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 17.411213,
                "end": 24.691213,
                "text": "On the last page, a moonlit trail led into an orchard. Beyond it, Lark had left the paper blank.",
                "speaker": "narrator"
              },
              {
                "start": 25.431213,
                "end": 32.251213,
                "text": "There would be more journeys to put there. More pieces of the map to find. More chapters to read again.",
                "speaker": "narrator"
              },
              {
                "start": 32.911213,
                "end": 40.311213,
                "text": "For now, your first adventure was safe between the covers. Lark placed the journal on the camp library shelf.",
                "speaker": "narrator"
              },
              {
                "start": 40.311213,
                "end": 43.011213,
                "text": "“I'll bring the map next time,”",
                "speaker": "lark"
              },
              {
                "start": 43.511213,
                "end": 44.451213,
                "text": "Lark said.",
                "speaker": "narrator"
              },
              {
                "start": 44.811213,
                "end": 46.171213,
                "text": "“I'll bring the wagon,”",
                "speaker": "nib"
              },
              {
                "start": 47.111213,
                "end": 47.711213,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 48.151213,
                "end": 54.091213,
                "text": "He proudly showed you his new brake: an enormous cushion tied across the wagon's front.",
                "speaker": "narrator"
              },
              {
                "start": 54.711213,
                "end": 56.171213,
                "text": "Lark studied it.",
                "speaker": "narrator"
              },
              {
                "start": 56.631213,
                "end": 58.171213,
                "text": "“Those are your brakes?”",
                "speaker": "lark"
              },
              {
                "start": 58.851213,
                "end": 60.071213,
                "text": "Lark asked.",
                "speaker": "narrator"
              },
              {
                "start": 60.831213,
                "end": 62.551213,
                "text": "“Very comfortable brakes,”",
                "speaker": "nib"
              },
              {
                "start": 63.551213,
                "end": 64.151213,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 64.851213,
                "end": 73.491213,
                "text": "Something small rustled down the path. An apple rolled out of the dusk, bumped against the wagon wheel, and stopped beside Nib's foot.",
                "speaker": "narrator"
              },
              {
                "start": 74.071213,
                "end": 78.151213,
                "text": "He picked it up. You all looked toward the distant orchard.",
                "speaker": "narrator"
              },
              {
                "start": 78.911213,
                "end": 82.051213,
                "text": "“Oh. The next adventure sent a snack,”",
                "speaker": "nib"
              },
              {
                "start": 82.491213,
                "end": 83.531213,
                "text": "Nib said.",
                "speaker": "narrator"
              },
              {
                "start": 84.171213,
                "end": 97.251213,
                "text": "Above the treehouse, the first star appeared. On the library shelf, a new book waited. And inside the little treasure case, the moonstone shone softly, ready for whatever came next.",
                "speaker": "narrator"
              }
            ],
            "visuals": [
              {
                "key": "narration-22-initial",
                "at": 0,
                "stage": "journal",
                "flags": {
                  "parked": true,
                  "bridge": true,
                  "repaired": true,
                  "arrived": true,
                  "drifted": false,
                  "returned": true,
                  "stored": true
                }
              },
              {
                "key": "source-visual-29",
                "stage": "ending",
                "action": "library-save",
                "duration": 3,
                "flags": {
                  "stored": true
                },
                "at": 37.411213
              },
              {
                "key": "source-visual-30",
                "stage": "ending",
                "action": "apple-roll",
                "duration": 4,
                "at": 67.411213
              }
            ]
          }
        }
      ]
    }
  ]
};
