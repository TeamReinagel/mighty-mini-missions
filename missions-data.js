// Fallback mission library for when `missions.json` can't be fetched (ex: file://).
// Canonical editable source is `missions.json` when running via a local server.
//
// This file is loaded as a plain script (not an ES module) so double-clicking
// `index.html` works in browsers that block module imports under file://.

window.MAX_MISSIONS_FALLBACK_DATA = {
  version: 1,
  notes: "Draft 1 mission library. Edit freely. Keep missions short, concrete, and screen-to-world.",
  missions: [
    {
      id: "build-bridge-pennies",
      category: "build",
      difficulty: "easy",
      level: "prek",
      minutes: "10–20",
      title: "Penny Bridge",
      prompt: "Build a bridge that can hold 10 pennies (or 10 rocks).",
      materials: ["Blocks/LEGO/Magna-Tiles or cardboard", "10 pennies (or small rocks)", "Tape (optional)"],
      steps: ["Build something that spans a gap.", "Test it with 1 penny at a time.", "If it fails, change ONE thing and try again."],
      siblingStation: "Give littles a bin of blocks and a “build a tower” mission.",
      skills: {
        forMax: "This helps you think like an engineer and learn from mistakes!",
        forParent: "Builds: spatial reasoning, iterative problem-solving, persistence through failure, early physics intuition (load distribution)."
      },
      twists: {
        easier: "Use just 5 pennies. Build with bigger blocks.",
        harder: "Bridge must span 12 inches. Use only paper and tape.",
        variant: "Build a ramp instead of a bridge. Roll a marble down it."
      }
    },
    {
      id: "build-marble-run",
      category: "build",
      difficulty: "medium",
      minutes: "15–30",
      title: "Marble Run (No Kit Needed)",
      prompt: "Make a ball track that goes from high to low without falling off.",
      materials: ["Cardboard strips OR paper towel tubes", "Tape", "A ball or marble", "Books/chairs for height"],
      steps: ["Pick a start and finish.", "Build one short ramp.", "Test, then add one more piece.", "Fix the wobbly part last."],
      siblingStation: "Tape a long paper strip to the floor and let littles roll cars down it.",
      skills: {
        forMax: "You're learning how things move and how to build step by step!",
        forParent: "Builds: systems thinking, gravity/force concepts, incremental design, cause-and-effect reasoning."
      },
      twists: {
        easier: "Use just 2 ramps. Start low and end low.",
        harder: "Add 3 turns or loops. Ball must go through all of them.",
        variant: "Build it outside on a hill. Use natural slopes."
      }
    },
    {
      id: "build-target-landing",
      category: "build",
      difficulty: "easy",
      minutes: "10–15",
      title: "Target Landing",
      prompt: "Create a target and practice landing beanbags/socks in it from 3 different spots.",
      materials: ["Laundry basket/bowl", "3 rolled socks/beanbags", "Tape or chalk"],
      steps: ["Put the target down.", "Mark 3 throw spots (close/medium/far).", "Try 3 throws from each spot.", "Move spots if it’s too easy/hard."],
      siblingStation: "Littles throw from the closest spot; praise effort, not score.",
      skills: {
        forMax: "This helps your body and brain work together to aim and adjust!",
        forParent: "Builds: hand-eye coordination, distance estimation, self-regulation (adjusting difficulty), gross motor control."
      },
      twists: {
        easier: "Use a big laundry basket. Throw from just 2 spots (close only).",
        harder: "Use a small bowl. Add a rule: must throw underhand only.",
        variant: "Try Nerf darts into bowls instead of socks."
      }
    },
    {
      id: "build-paper-airplane-lab",
      category: "build",
      difficulty: "medium",
      minutes: "15–25",
      title: "Paper Airplane Lab",
      prompt: "Make 2 planes and test which one flies farther (then change one fold).",
      materials: ["Paper", "Tape (optional)", "A hallway or outdoor space"],
      steps: ["Fold Plane A, fly it 3 times.", "Fold Plane B, fly it 3 times.", "Change ONE fold on the worse plane.", "Retest and pick a winner."],
      siblingStation: "Littles decorate planes with crayons/stickers.",
      skills: {
        forMax: "You're being a scientist—testing ideas and learning what works!",
        forParent: "Builds: experimental thinking, comparison skills, controlled variables, aerodynamics intuition, following directions."
      }
    },
    {
      id: "build-tape-road-city",
      category: "build",
      difficulty: "easy",
      minutes: "15–30",
      title: "Tape Road City",
      prompt: "Make a road map on the floor and add 3 places (home, store, park).",
      materials: ["Painter’s tape", "Toy cars", "Paper for signs (optional)"],
      steps: ["Lay down 2 long roads.", "Add 2 turns and 1 intersection.", "Name 3 places and park cars there.", "Make a rule: stop at signs, drive slow, etc."],
      siblingStation: "Littles get 2 cars each and a “park only in spots” rule.",
      skills: {
        forMax: "You're making your own world and learning how maps work!",
        forParent: "Builds: spatial mapping, symbolic representation, rule-making, social play, vocabulary (places, directions)."
      }
    },
    {
      id: "phonics-sound-hunt",
      category: "phonics",
      difficulty: "easy",
      minutes: "5–12",
      title: "Sound Hunt: {{SOUND}}",
      prompt: "Find 5 things that start with {{SOUND}} (or contain {{SOUND}}).",
      materials: ["Your house or outside", "Optional: sticky notes"],
      steps: ["Say the sound together: {{SOUND}}.", "Find 3 things fast.", "Find 2 more slow (hard mode).", "Optional: put a sticky note on each thing you found."],
      siblingStation: "Littles hunt colors: “Find 3 red things.”",
      skills: {
        forMax: "You're learning to hear sounds in words and find them everywhere!",
        forParent: "Builds: phonemic awareness, sound-letter connection, active recall, environmental print awareness."
      },
      twists: {
        easier: "Find just 3 things. Use the sound /m/ or /s/.",
        harder: "Find 7 things. Use a harder sound like /sh/ or /ch/.",
        variant: "Find things that END with the sound instead of start."
      }
    },
    {
      id: "phonics-chalk-sound-jumps",
      category: "phonics",
      difficulty: "easy",
      minutes: "5–10",
      title: "Chalk Sound Jumps",
      prompt: "Write a word and jump each sound.",
      materials: ["Chalk (or paper + marker)", "A word with 2–4 sounds (parent picks)"],
      steps: ["Parent writes a simple word (ex: map, sun, fish).", "Max says it slowly.", "Jump once per sound.", "Say the word fast at the end."],
      siblingStation: "Littles jump to shapes you draw (circle, square, triangle).",
      skills: {
        forMax: "Your body helps your brain remember sounds!",
        forParent: "Builds: phoneme segmentation, body-kinesthetic memory, blending sounds, movement-integrated learning."
      }
    },
    {
      id: "phonics-letter-tape-tag",
      category: "phonics",
      difficulty: "medium",
      minutes: "8–15",
      title: "Letter Tag",
      prompt: "Tape 6 letters around the room. Run to the one I call!",
      materials: ["6 sticky notes", "Marker"],
      steps: ["Write 6 letters (include 2 from Max’s current lessons).", "Tape them far apart.", "Call a letter; Max runs and touches it.", "Bonus: call a sound instead of the letter name."],
      siblingStation: "Littles run to a color card you call.",
      skills: {
        forMax: "You're learning letters by moving your whole body!",
        forParent: "Builds: letter recognition, letter-sound association, rapid recall, gross motor integration."
      }
    },
    {
      id: "phonics-rhyme-race",
      category: "phonics",
      difficulty: "medium",
      minutes: "6–12",
      title: "Rhyme Race",
      prompt: "Find or invent rhymes and do a movement for each one.",
      materials: ["Open space"],
      steps: ["Pick a word (cat).", "Say a rhyme (hat) → do 5 jumps.", "Say another rhyme (bat) → spin once.", "If stuck, switch words."],
      siblingStation: "Littles repeat the last word and do the movement too.",
      skills: {
        forMax: "You're learning that words can sound the same and that's fun!",
        forParent: "Builds: phonological awareness (rhyming), word families, creative thinking, movement-memory connection."
      }
    },
    {
      id: "math-jump-add",
      category: "math",
      difficulty: "easy",
      minutes: "6–12",
      title: "Jump + Add",
      prompt: "Do jumps, then add the totals.",
      materials: ["Die (optional)"],
      steps: ["Do {{N1}} jumps.", "Do {{N2}} jumps.", "How many jumps altogether?", "Show it with fingers or objects."],
      siblingStation: "Littles just copy the jumps and count to 5.",
      skills: {
        forMax: "You're learning to add by moving your body!",
        forParent: "Builds: early addition concepts, number sense, embodied math, quantity comparison."
      },
      twists: {
        easier: "Do just 2 jumps + 2 jumps. Use fingers to show the answer.",
        harder: "Do 6 jumps + 5 jumps. Write the answer on paper.",
        variant: "Do jumps, then subtract: do 5 jumps, then 'take away' 2 by sitting down."
      }
    },
    {
      id: "math-sticks-compare",
      category: "math",
      difficulty: "easy",
      minutes: "10–15",
      title: "Sticks: More / Less / Equal",
      prompt: "Collect sticks (or toys) and compare which pile has more.",
      materials: ["Outdoor sticks OR small toys", "2 bowls (optional)"],
      steps: ["Make pile A with {{N1}} items.", "Make pile B with {{N2}} items.", "Which is more? Which is less? Are they equal?", "If they're not equal, make them equal by moving items. If they're already equal, make one bigger than the other."],
      siblingStation: "Littles sort items by big/small into two piles.",
      skills: {
        forMax: "You're learning which pile has more, less, or the same!",
        forParent: "Builds: comparison skills, quantity relationships, one-to-one correspondence, equalizing sets."
      },
      twists: {
        easier: "Use just 3 and 4 items. Make them equal.",
        harder: "Use 8 and 12 items. Make them equal by moving items.",
        variant: "Make 3 piles instead of 2. Which has the most?"
      }
    },
    {
      id: "math-number-line-stomp",
      category: "math",
      difficulty: "medium",
      minutes: "8–15",
      title: "Number Line Stomp",
      prompt: "Make a number line and stomp the answer.",
      materials: ["Chalk or sticky notes (0–10)", "Open floor/driveway"],
      steps: ["Lay out 0–10 in order.", "Start on {{N1}}.", "Move forward {{N2}} steps.", "Say the number you land on (if you go past 10, stop at 10)."],
      siblingStation: "Littles hop on just 1–3.",
      skills: {
        forMax: "You're learning to count forward on a number line!",
        forParent: "Builds: number line concepts, addition as movement, sequential counting, spatial number representation."
      }
    },
    {
      id: "math-throw-count-graph",
      category: "math",
      difficulty: "hard",
      minutes: "15–25",
      title: "Throw + Count (Mini Data)",
      prompt: "Throw 10 times and make a tiny ‘graph’ with objects.",
      materials: ["Basket/target", "10 socks/beanbags", "10 small blocks"],
      steps: ["Throw 10 times; count hits vs misses.", "Make 2 block towers: hits and misses.", "Which tower is taller?", "Change distance and try again."],
      siblingStation: "Littles throw 3 times from close distance.",
      skills: {
        forMax: "You're learning to collect data and see patterns!",
        forParent: "Builds: data collection, comparison (taller/shorter), counting, early graphing concepts, persistence."
      }
    },
    {
      id: "nature-spot-3-signs",
      category: "nature",
      difficulty: "easy",
      minutes: "10–20",
      title: "Spot 3 Signs of Life",
      prompt: "Find 3 signs that an animal was here (tracks, holes, nests, chewed things).",
      materials: ["Outside"],
      steps: ["Walk slowly for 2 minutes.", "Find 1 sign and point to it.", "Find 2 more signs.", "Take a photo (optional)."],
      siblingStation: "Littles hunt “something tiny, something smooth, something rough.”",
      skills: {
        forMax: "You're learning to notice clues that animals leave behind!",
        forParent: "Builds: observation skills, inference, scientific thinking, attention to detail, nature awareness."
      }
    },
    {
      id: "nature-sort-by-texture",
      category: "nature",
      difficulty: "easy",
      minutes: "10–15",
      title: "Texture Sort",
      prompt: "Collect 10 items and sort by texture.",
      materials: ["Outside", "Optional: 2 bowls"],
      steps: ["Collect 10 nature items (safe ones).", "Make 2–3 categories: smooth/rough/soft.", "Sort them.", "Rename categories if needed."],
      siblingStation: "Littles make a ‘treasure pile’ and count to 5.",
      skills: {
        forMax: "You're learning to sort things by how they feel!",
        forParent: "Builds: classification skills, tactile discrimination, category creation, descriptive vocabulary."
      }
    },
    {
      id: "nature-color-quest",
      category: "nature",
      difficulty: "medium",
      minutes: "8–15",
      title: "Color Quest",
      prompt: "Find something in each color: green, brown, gray, and one surprise color.",
      materials: ["Outside"],
      steps: ["Find green.", "Find brown.", "Find gray.", "Pick a surprise color and find it."],
      siblingStation: "Littles just do green + brown.",
      skills: {
        forMax: "You're learning to find colors in nature and pick your own challenge!",
        forParent: "Builds: color recognition, visual scanning, choice-making, nature observation."
      }
    },
    {
      id: "nature-build-a-habitat",
      category: "nature",
      difficulty: "hard",
      minutes: "15–30",
      title: "Build a Tiny Habitat",
      prompt: "Build a ‘home’ for a pretend bug (no animals involved).",
      materials: ["Sticks/leaves/rocks", "A small space (corner of yard)"],
      steps: ["Pick a spot.", "Build walls and a roof.", "Add a ‘door’ and ‘food’ area.", "Test: can your bug get in/out?"],
      siblingStation: "Littles collect sticks into a bucket and deliver them.",
      skills: {
        forMax: "You're learning what animals need to live and how to build it!",
        forParent: "Builds: habitat understanding, systems thinking (needs: shelter, food, access), design thinking, nature connection."
      }
    },
    {
      id: "social-coop-obstacle-rules",
      category: "social",
      difficulty: "medium",
      minutes: "10–20",
      title: "Co-op Obstacle Course (3 Rules)",
      prompt: "Build an obstacle course with siblings and agree on 3 rules.",
      materials: ["Pillows, chairs, tape, cones", "Timer (optional)"],
      steps: ["Pick 3 obstacles.", "Pick 3 rules (no pushing, take turns, hands to self).", "Do one practice run together.", "Then everyone gets 1 turn."],
      siblingStation: "This IS the sibling activity; keep it short and restartable.",
      skills: {
        forMax: "You're learning to work together and make rules everyone agrees on!",
        forParent: "Builds: cooperation, rule-making, negotiation, turn-taking, sibling collaboration, self-regulation."
      }
    },
    {
      id: "social-role-play-store",
      category: "social",
      difficulty: "easy",
      minutes: "10–15",
      title: "Play Store",
      prompt: "Set up a store with 5 items and practice greetings + paying.",
      materials: ["5 household items", "Coins (real or pretend)", "Bag or basket"],
      steps: ["Make price tags 1–5.", "Practice: 'Hi!' 'Can I help you?'", "Buy 3 items.", "Switch roles."],
      siblingStation: "Littles pick 1 item and practice 'thank you.'",
      skills: {
        forMax: "You're learning how stores work and how to be polite!",
        forParent: "Builds: social scripts, money concepts, role-play, politeness routines, perspective-taking."
      }
    },
    {
      id: "responsibility-tool-helper",
      category: "responsibility",
      difficulty: "easy",
      minutes: "8–15",
      title: "Helper Mission",
      prompt: "Do one real helper job with a clear finish line.",
      materials: ["A real household job"],
      steps: ["Pick 1 job: wipe table, match socks, feed animals, water plants.", "Set a finish line (2 minutes or 10 items).", "Do it fast.", "Celebrate: ‘You helped our family.’"],
      siblingStation: "Littles do a mini-version: ‘put 5 toys in the bin.’",
      skills: {
        forMax: "You're learning to help your family and finish what you start!",
        forParent: "Builds: responsibility, task completion, contribution to household, executive function (finish line concept), pride in work."
      },
      twists: {
        easier: "Pick the easiest job. Finish line is just 5 items or 1 minute.",
        harder: "Do 2 jobs in a row. Set finish lines for both.",
        variant: "Time yourself. Try to beat your time next time."
      }
    },
    {
      id: "responsibility-money-math",
      category: "responsibility",
      difficulty: "medium",
      minutes: "10–20",
      title: "Money Mission",
      prompt: "Make 3 ‘items’ and pay for them with coins.",
      materials: ["Coins", "3 items", "Paper for price tags"],
      steps: ["Price items 1–5 cents.", "Pick an item and pay exactly.", "If you can’t, trade coins.", "Switch roles and be the cashier."],
      siblingStation: "Littles ‘buy’ with buttons or blocks.",
      skills: {
        forMax: "You're learning how money works and how to pay for things!",
        forParent: "Builds: money concepts, counting coins, exact payment, trading/exchange, real-world math application."
      },
      twists: {
        easier: "Use only pennies. Prices are 1, 2, or 3 cents.",
        harder: "Use nickels and dimes. Prices are 5, 10, or 15 cents.",
        variant: "Use real money at a real store (with parent). Buy one small item."
      }
    },
    {
      id: "build-earthquake-tower",
      category: "build",
      difficulty: "easy",
      minutes: "10–20",
      title: "Earthquake Tower",
      prompt: "Build the tallest tower that can survive an ‘earthquake.’",
      materials: ["Blocks/LEGO", "A cookie sheet or sturdy cardboard"],
      steps: ["Build a tall tower.", "Shake the tray gently (earthquake).", "Rebuild with one new idea (wider base, triangles).", "Try again."],
      siblingStation: "Littles build a short tower and do a tiny shake.",
      skills: {
        forMax: "You're learning what makes things strong and stable!",
        forParent: "Builds: structural engineering concepts, stability principles, cause-and-effect (base width affects stability), resilience thinking."
      }
    },
    {
      id: "build-boat-float",
      category: "build",
      difficulty: "medium",
      minutes: "15–25",
      title: "Float Test (Boat Builder)",
      prompt: "Build a boat that can hold 10 pennies without sinking.",
      materials: ["Foil OR recycled containers", "Bowl of water", "10 pennies/rocks", "Towel"],
      steps: ["Build a boat shape.", "Float it and add pennies slowly.", "If it sinks, change ONE thing (wider, taller sides).", "Retest."],
      siblingStation: "Littles do water play with cups nearby (separate bowl if needed).",
      skills: {
        forMax: "You're learning why some things float and others sink!",
        forParent: "Builds: buoyancy concepts, displacement understanding, iterative design, early physics (density, surface area)."
      }
    },
    {
      id: "build-catapult",
      category: "build",
      difficulty: "hard",
      minutes: "20–30",
      title: "Spoon Catapult",
      prompt: "Build a launcher that can hit a target.",
      materials: ["Plastic spoon", "Rubber bands", "Popsicle sticks OR cardboard", "Soft pom-poms/rolled paper"],
      steps: ["Build a simple catapult.", "Pick a target distance.", "Launch 5 times; count hits.", "Adjust angle or distance."],
      siblingStation: "Littles collect launched pom-poms into a bucket.",
      skills: {
        forMax: "You're learning about force, angles, and how to hit a target!",
        forParent: "Builds: trajectory concepts, angle/force relationships, precision practice, counting/data collection, mechanical thinking."
      }
    },
    {
      id: "build-maze-for-car",
      category: "build",
      difficulty: "medium",
      minutes: "15–25",
      title: "Maze Maker",
      prompt: "Build a maze for a toy car and try to solve it.",
      materials: ["Blocks/boxes", "Toy car", "Tape (optional)"],
      steps: ["Build 3 walls.", "Add 2 dead ends.", "Try to drive through.", "Change one wall to make it harder/easier."],
      siblingStation: "Littles get a ‘parking lot’ with 3 parking spaces.",
      skills: {
        forMax: "You're making puzzles and learning how to solve them!",
        forParent: "Builds: pathfinding logic, spatial problem-solving, perspective-taking (designer vs solver), difficulty calibration."
      }
    },
    {
      id: "phonics-letter-sprint",
      category: "phonics",
      difficulty: "easy",
      minutes: "5–10",
      title: "Letter Sprint",
      prompt: "Run and touch the letter {{LETTER}} five times (fast + silly).",
      materials: ["Sticky note with {{LETTER}}"],
      steps: ["Put {{LETTER}} on the wall.", "Start across the room.", "Run-touch-run back (x5).", "Say the sound each time."],
      siblingStation: "Littles run to a smiley face card.",
      skills: {
        forMax: "You're learning letters by moving your whole body!",
        forParent: "Builds: letter recognition, letter-sound association, rapid recall, gross motor integration."
      }
    },
    {
      id: "phonics-syllable-march",
      category: "phonics",
      difficulty: "medium",
      minutes: "6–12",
      title: "Syllable March",
      prompt: "March the syllables in names and objects.",
      materials: ["Your house"],
      steps: ["Pick a word (Max, mommy, dinosaur).", "Clap syllables.", "March one step per syllable.", "Find 5 more words."],
      siblingStation: "Littles march too; keep words short.",
      skills: {
        forMax: "You're learning to break words into parts by marching!",
        forParent: "Builds: syllable awareness, phonological segmentation, body-kinesthetic memory, word structure understanding."
      }
    },
    {
      id: "phonics-word-builder-mat",
      category: "phonics",
      difficulty: "hard",
      minutes: "10–15",
      title: "3-Sound Word Builder",
      prompt: "Build a 3-sound word with letter cards, then act it out.",
      materials: ["Paper letter cards OR fridge letters"],
      steps: ["Parent says a word (map/sun/fan).", "Max builds it.", "Max reads it.", "Act it out for 10 seconds."],
      siblingStation: "Littles match 3 letter cards that look the same.",
      skills: {
        forMax: "You're learning to build words and read them!",
        forParent: "Builds: phoneme-grapheme mapping, blending sounds, early reading, encoding (spelling), comprehension through acting."
      }
    },
    {
      id: "math-shape-hunt",
      category: "math",
      difficulty: "easy",
      minutes: "6–12",
      title: "Shape Hunt",
      prompt: "Find 10 shapes in the house or outside.",
      materials: ["Optional: paper to tally"],
      steps: ["Find 3 circles.", "Find 3 rectangles.", "Find 2 triangles.", "Pick 2 surprise shapes."],
      siblingStation: "Littles find circles only.",
      skills: {
        forMax: "You're learning to spot shapes everywhere around you!",
        forParent: "Builds: shape recognition, pattern spotting, visual discrimination, environmental awareness."
      }
    },
    {
      id: "math-subitize-sprint",
      category: "math",
      difficulty: "medium",
      minutes: "6–10",
      title: "How Many? (Fast Eyes)",
      prompt: "Show a small group of objects for 2 seconds; guess how many.",
      materials: ["5–10 small objects", "A cup/bowl"],
      steps: ["Put {{N1}} objects down.", "Cover, then reveal for 2 seconds.", "Max says how many.", "Count to check; repeat."],
      siblingStation: "Littles count to 3 with you.",
      skills: {
        forMax: "You're training your eyes to see numbers fast!",
        forParent: "Builds: subitizing (instant quantity recognition), working memory, visual processing speed, number sense."
      }
    },
    {
      id: "math-steps-measure",
      category: "math",
      difficulty: "medium",
      minutes: "8–15",
      title: "Measure With Steps",
      prompt: "Measure 3 things using your feet/steps.",
      materials: ["A hallway or yard"],
      steps: ["Measure the couch (steps).", "Measure the table (steps).", "Measure a doorway (steps).", "Which is longest? Shortest?"],
      siblingStation: "Littles measure 1 thing and cheer.",
      skills: {
        forMax: "You're learning to measure things with your own body!",
        forParent: "Builds: measurement concepts, comparison (longest/shortest), non-standard units, spatial estimation."
      }
    },
    {
      id: "nature-scavenger-5",
      category: "nature",
      difficulty: "easy",
      minutes: "10–20",
      title: "Nature Scavenger 5",
      prompt: "Find: something smooth, something rough, something pointy, something tiny, something that smells.",
      materials: ["Outside"],
      steps: ["Find each item and make a pile.", "Name each texture.", "Swap one item for a better one.", "Done."],
      siblingStation: "Littles find smooth + tiny.",
      skills: {
        forMax: "You're learning to notice textures and smells in nature!",
        forParent: "Builds: sensory awareness, descriptive vocabulary, observation skills, multi-sensory learning."
      }
    },
    {
      id: "nature-shadow-hunt",
      category: "nature",
      difficulty: "medium",
      minutes: "10–15",
      title: "Shadow Hunt",
      prompt: "Trace a shadow and come back later to see if it moved.",
      materials: ["Chalk", "Sunny spot"],
      steps: ["Trace your shadow.", "Mark the time (optional).", "Come back in 20–60 minutes.", "Trace again and compare."],
      siblingStation: "Littles trace their hands with chalk.",
      skills: {
        forMax: "You're learning how shadows move and change!",
        forParent: "Builds: time concepts, sun movement understanding, observation over time, scientific thinking (change detection)."
      }
    },
    {
      id: "social-compliment-pass",
      category: "social",
      difficulty: "easy",
      minutes: "5–10",
      title: "Compliment Pass",
      prompt: "Pass an object; when you get it, say one kind sentence.",
      materials: ["A soft ball or stuffed animal"],
      steps: ["Sit or stand in a circle.", "Pass the object.", "Say one kind sentence to the next person.", "Do 6 passes and stop while it’s fun."],
      siblingStation: "Littles can say ‘I like you’ or ‘thank you.’",
      skills: {
        forMax: "You're learning to say kind things to people!",
        forParent: "Builds: social-emotional skills, kindness practice, turn-taking, positive communication, emotional vocabulary."
      }
    },
    {
      id: "responsibility-laundry-sort-race",
      category: "responsibility",
      difficulty: "easy",
      minutes: "8–15",
      title: "Laundry Sort Race",
      prompt: "Sort laundry by person or type as fast as you can (with a finish line).",
      materials: ["Laundry basket", "2–4 piles"],
      steps: ["Make 3 piles (Max/mom/dad).", "Sort 10 items.", "Stop and celebrate.", "Optional: fold 3 easy items."],
      siblingStation: "Littles match socks or put washcloths in a pile.",
      skills: {
        forMax: "You're learning to help your family and finish jobs!",
        forParent: "Builds: responsibility, categorization, completion skills, contribution to household, sorting/classification."
      },
      twists: {
        easier: "Sort just 5 items into 2 piles (yours vs everyone else's).",
        harder: "Sort 15 items into 4 piles (add a 'towels' pile).",
        variant: "Sort by color instead of person (red, blue, white piles)."
      }
    },
    {
      id: "make-your-own",
      category: "social",
      difficulty: "any",
      minutes: "5–20",
      title: "Invent a Mission",
      prompt: "Make up your own challenge with 3 rules and a finish line.",
      materials: ["Whatever you want"],
      steps: ["Pick a theme (cars, animals, ninjas, space).", "Pick 3 rules.", "Halfway through, change ONE rule.", "Pick a finish line (time or task).", "Go."],
      siblingStation: "Let littles choose one rule (like ‘no yelling’ or ‘crawl only’).",
      skills: {
        forMax: "You're learning to make up your own games and change the rules!",
        forParent: "Builds: creativity, autonomy, rule-making, flexible thinking, ownership of learning, executive function (planning)."
      }
    },
    {
      id: "social-rule-remix",
      category: "social",
      difficulty: "medium",
      minutes: "10–20",
      title: "Rule Remix",
      prompt: "Pick any mission you've done before. Do it again, but halfway through change ONE rule.",
      materials: ["Any mission from before", "Your choice"],
      steps: ["Pick a mission you remember.", "Start doing it normally.", "When you're halfway done, stop and change ONE rule.", "Finish with the new rule."],
      siblingStation: "Littles watch and cheer when you change the rule.",
      skills: {
        forMax: "You're learning that rules can be changed and that's okay!",
        forParent: "Builds: flexible thinking, rule-bending creativity, sequence understanding (by reversing it), humor/playfulness."
      }
    },
    {
      id: "build-backwards-mission",
      category: "build",
      difficulty: "medium",
      minutes: "10–20",
      title: "Backwards Mission",
      prompt: "Pick a build mission and do the steps in reverse order.",
      materials: ["Any build mission", "Same materials as that mission"],
      steps: ["Pick a build mission (bridge, tower, maze, etc.).", "Read the steps backwards (last step first).", "Do it backwards and see what happens.", "If it's funny or weird, that's the point."],
      siblingStation: "Littles build normally and watch you do it backwards.",
      skills: {
        forMax: "You're learning that rules can be changed and that's okay!",
        forParent: "Builds: flexible thinking, rule-bending creativity, sequence understanding (by reversing it), humor/playfulness."
      }
    },
    {
      id: "music-rhythm-repeat",
      category: "social",
      difficulty: "easy",
      minutes: "5–10",
      title: "Rhythm Repeat",
      prompt: "Clap a pattern; copy it; add one beat.",
      materials: ["Your hands", "Optional: a drum or table"],
      steps: ["Parent claps a pattern (ex: clap-clap-pause-clap).", "Max copies it exactly.", "Max adds ONE beat to the pattern.", "Parent copies Max's new pattern."],
      siblingStation: "Littles just clap along (no pattern needed).",
      skills: {
        forMax: "You're learning patterns and making your own music!",
        forParent: "Builds: pattern recognition, rhythm awareness, auditory memory, creative expression, turn-taking."
      }
    },
    {
      id: "music-syllable-stomp",
      category: "social",
      difficulty: "medium",
      minutes: "6–12",
      title: "Syllable Stomp",
      prompt: "March syllables for 5 household objects.",
      materials: ["Your house", "Open space"],
      steps: ["Pick 5 objects (couch, table, window, etc.).", "Say each word slowly.", "Stomp once per syllable (couch = 1, table = 2).", "March around saying all 5 words."],
      siblingStation: "Littles march too and say 'stomp-stomp-stomp.'",
      skills: {
        forMax: "You're learning to break words into parts by marching!",
        forParent: "Builds: syllable awareness, phonological segmentation, body-kinesthetic memory, word structure understanding."
      }
    },
    {
      id: "music-sound-orchestra",
      category: "build",
      difficulty: "medium",
      minutes: "10–15",
      title: "Sound Orchestra",
      prompt: "Find 3 things that make different sounds; play them in order.",
      materials: ["3 objects that make sounds (pots, spoons, boxes, etc.)"],
      steps: ["Find 3 objects that make sounds.", "Test each one.", "Decide on an order (quiet → loud, or your choice).", "Play them in order 3 times."],
      siblingStation: "Littles get one 'instrument' and play along.",
      skills: {
        forMax: "You're learning to make music and put sounds in order!",
        forParent: "Builds: sound discrimination, sequencing, volume concepts (quiet/loud), creative expression, pattern-making."
      }
    },
    {
      id: "social-ask-wait-trade",
      category: "social",
      difficulty: "easy",
      minutes: "8–12",
      title: "Ask-Wait-Trade",
      prompt: "Practice asking for a toy, waiting 5 seconds, then trading.",
      materials: ["2 toys", "A sibling or parent"],
      steps: ["Pick 2 toys.", "Ask nicely: 'Can I have that toy?'", "Wait 5 seconds (count slowly).", "Trade toys and say 'thank you.'"],
      siblingStation: "This IS the sibling activity; practice with littles.",
      skills: {
        forMax: "You're learning to ask nicely, wait, and trade toys!",
        forParent: "Builds: social scripts, impulse control (waiting), negotiation skills, turn-taking, polite language."
      }
    },
    {
      id: "social-helper-interview",
      category: "social",
      difficulty: "medium",
      minutes: "10–15",
      title: "Helper Interview",
      prompt: "Ask a family member 3 questions and remember the answers.",
      materials: ["A family member", "Optional: paper to write"],
      steps: ["Pick someone to interview.", "Ask 3 questions (ex: favorite color, favorite food, favorite game).", "Listen to the answers.", "Tell someone else what you learned."],
      siblingStation: "Littles ask one question: 'What's your favorite color?'",
      skills: {
        forMax: "You're learning to ask questions and remember what people say!",
        forParent: "Builds: conversation skills, active listening, memory, perspective-taking, information gathering."
      }
    },
    {
      id: "nature-same-or-different",
      category: "nature",
      difficulty: "medium",
      minutes: "10–15",
      title: "Same or Different?",
      prompt: "Find 2 leaves (or rocks); list 3 ways they're the same and 3 ways they're different.",
      materials: ["Outside", "2 leaves OR 2 rocks"],
      steps: ["Find 2 similar items (2 leaves or 2 rocks).", "Look closely at both.", "Say 3 ways they're the same.", "Say 3 ways they're different."],
      siblingStation: "Littles find 2 items and say 'same' or 'different' for each.",
      skills: {
        forMax: "You're learning to notice what's the same and what's different!",
        forParent: "Builds: comparison skills, classification, descriptive vocabulary, observation, analytical thinking."
      }
    },
    {
      id: "nature-change-detector",
      category: "nature",
      difficulty: "hard",
      minutes: "5–10 (today) + 5–10 (tomorrow)",
      title: "Change Detector",
      prompt: "Pick one spot outside; visit it 2 days in a row and notice what changed.",
      materials: ["Outside", "Optional: chalk or photo"],
      steps: ["Pick one spot (a tree, a patch of grass, a rock).", "Look at it carefully today.", "Mark it or take a photo (optional).", "Come back tomorrow and see what changed."],
      siblingStation: "Littles help mark the spot with chalk or a stick.",
      skills: {
        forMax: "You're learning to notice how things change over time!",
        forParent: "Builds: observation over time, change detection, memory, scientific thinking, patience (waiting until tomorrow)."
      },
      twists: {
        easier: "Check the same spot 2 hours later (same day).",
        harder: "Check the same spot every day for 3 days. Draw what you see.",
        variant: "Pick 2 spots and compare which one changed more."
      }
    },
    {
      id: "responsibility-grocery-helper",
      category: "responsibility",
      difficulty: "medium",
      minutes: "15–25",
      title: "Grocery Helper",
      prompt: "Find 3 items at the store and help pay at the register.",
      materials: ["A real grocery store trip", "Shopping list (3 items)"],
      steps: ["Find the first item (with parent help if needed).", "Find the second item.", "Find the third item.", "Help pay at the register (hand money or card)."],
      siblingStation: "Littles ride in the cart and point to items.",
      skills: {
        forMax: "You're learning to shop and pay for things in real life!",
        forParent: "Builds: real-world independence, navigation, money handling, social interaction with store employees."
      },
      twists: {
        easier: "Find just 1 item. Parent pays.",
        harder: "Find 5 items. Count the total cost.",
        variant: "Use a small amount of your own money to buy one item."
      }
    },
    {
      id: "responsibility-paycheck-day",
      category: "responsibility",
      difficulty: "medium",
      minutes: "10–15",
      title: "Paycheck Day",
      prompt: "Count your earnings and decide: save or spend?",
      materials: ["Your paycheck money", "2 jars or envelopes (save/spend)"],
      steps: ["Count your money.", "Decide how much to save (at least {{N1}} cents).", "Put save money in one jar.", "Put spend money in the other jar."],
      siblingStation: "Littles sort coins by color (copper vs silver).",
      skills: {
        forMax: "You're learning to manage your money and make choices!",
        forParent: "Builds: money management, decision-making, delayed gratification, saving concepts, financial literacy."
      },
      twists: {
        easier: "Just count the money. Parent helps decide save/spend.",
        harder: "Count money, then write down how much you saved.",
        variant: "Decide what to buy with your 'spend' money before you go shopping."
      }
    },
    {
      id: "responsibility-table-reset",
      category: "responsibility",
      difficulty: "easy",
      minutes: "5–10",
      title: "Table Reset",
      prompt: "Clear the table, wipe it, and set it for the next meal.",
      materials: ["Dirty dishes", "Wet cloth", "Clean plates/utensils"],
      steps: ["Clear all dishes to the counter.", "Wipe the table clean.", "Set {{N1}} places (plates + forks).", "Done! Celebrate."],
      siblingStation: "Littles put napkins at each place.",
      skills: {
        forMax: "You're learning to reset the table and help your family!",
        forParent: "Builds: responsibility, multi-step task completion, household contribution, sequence following."
      },
      twists: {
        easier: "Just clear dishes. Parent wipes and sets.",
        harder: "Clear, wipe, set, AND put dishes in dishwasher.",
        variant: "Set the table fancy (add napkins folded in a special way)."
      }
    },
    {
      id: "responsibility-animal-care",
      category: "responsibility",
      difficulty: "easy",
      minutes: "8–12",
      title: "Animal Care Routine",
      prompt: "Do the full care routine for one animal (feed, water, check).",
      materials: ["Animal food", "Water", "One pet or farm animal"],
      steps: ["Fill food bowl (check amount).", "Fill water bowl (check if clean).", "Check if animal looks happy/healthy.", "Report to parent: 'All done!'"],
      siblingStation: "Littles watch and cheer.",
      skills: {
        forMax: "You're learning to take care of animals responsibly!",
        forParent: "Builds: responsibility, animal care, observation skills, routine completion, empathy."
      },
      twists: {
        easier: "Just feed. Parent does water.",
        harder: "Do 2 animals. Check both and report.",
        variant: "Take a photo of the animal after care and show it to parent."
      }
    },
    {
      id: "responsibility-plant-watering",
      category: "responsibility",
      difficulty: "easy",
      minutes: "5–10",
      title: "Plant Watering Route",
      prompt: "Water {{N1}} plants and check if they need more.",
      materials: ["Watering can or cup", "{{N1}} plants"],
      steps: ["Check first plant: is soil dry?", "Water if dry (just a little).", "Check next plant.", "Finish all {{N1}} plants."],
      siblingStation: "Littles help carry the watering can.",
      skills: {
        forMax: "You're learning to take care of plants!",
        forParent: "Builds: responsibility, plant care, observation (dry vs wet soil), routine completion."
      },
      twists: {
        easier: "Water just 2 plants. Parent checks if dry.",
        harder: "Water 5 plants. Write down which ones you watered.",
        variant: "Pick one plant to 'adopt' and check it every day for a week."
      }
    },
    {
      id: "responsibility-order-counter",
      category: "responsibility",
      difficulty: "medium",
      minutes: "5–10",
      title: "Order at Counter",
      prompt: "Practice ordering food at a counter (real or pretend).",
      materials: ["A counter (real restaurant or pretend at home)", "Menu or list"],
      steps: ["Look at the menu.", "Decide what you want.", "Say: 'Hi, I'd like [item], please.'", "Say 'thank you' when you get it."],
      siblingStation: "Littles practice saying 'please' and 'thank you.'",
      skills: {
        forMax: "You're learning to order food independently!",
        forParent: "Builds: independence, social scripts, confidence, polite language, real-world skills."
      },
      twists: {
        easier: "Practice at home first. Parent is the cashier.",
        harder: "Order at a real counter. Pay with your own money.",
        variant: "Order for someone else (sibling or parent)."
      }
    },
    {
      id: "responsibility-library-return",
      category: "responsibility",
      difficulty: "medium",
      minutes: "10–15",
      title: "Library Return",
      prompt: "Find the return shelf and put your book back in the right spot.",
      materials: ["A library book to return", "Library visit"],
      steps: ["Find the return shelf or cart.", "Put your book in the return spot.", "If returning to shelf, find the right letter section.", "Check: is it in the right place?"],
      siblingStation: "Littles pick one new book to check out.",
      skills: {
        forMax: "You're learning to return library books correctly!",
        forParent: "Builds: responsibility, library navigation, alphabetical order concepts, independence."
      },
      twists: {
        easier: "Just put book in return cart. Parent finds shelf.",
        harder: "Return 2 books. Find both shelf spots.",
        variant: "Check out a new book after returning the old one."
      }
    },
    {
      id: "responsibility-make-change",
      category: "responsibility",
      difficulty: "hard",
      minutes: "10–15",
      title: "Make Change",
      prompt: "Be the cashier. Someone pays with {{COIN}}; give them change.",
      materials: ["Coins", "Items priced 1–10 cents", "A 'customer' (parent or sibling)"],
      steps: ["Customer picks an item (price {{N1}} cents).", "Customer pays with {{COIN}}.", "Count: how much change do they get back?", "Give them the right coins."],
      siblingStation: "Littles 'buy' with buttons (no change needed).",
      skills: {
        forMax: "You're learning to be a cashier and make change!",
        forParent: "Builds: subtraction concepts, money math, role-play, real-world application."
      },
      twists: {
        easier: "Prices are 1–3 cents. Customer pays with 5 pennies.",
        harder: "Prices are 5–15 cents. Customer pays with a dime or nickel.",
        variant: "Use real money at a real store (with parent supervision)."
      }
    },
    {
      id: "phonics-sight-word-sprint",
      category: "phonics",
      difficulty: "medium",
      minutes: "6–12",
      title: "Sight Word Sprint",
      prompt: "Run to {{WORD}} written on the wall. Read it, then run back.",
      materials: ["Sticky notes with {{WORD}}", "Open space"],
      steps: ["Parent writes {{WORD}} on a sticky note.", "Tape it on the wall.", "Max runs to it, reads it, runs back.", "Repeat with 3 more words."],
      siblingStation: "Littles run to a picture card you show them.",
      skills: {
        forMax: "You're learning to read words by moving your body!",
        forParent: "Builds: sight word recognition, rapid recall, gross motor integration, reading fluency."
      },
      twists: {
        easier: "Use 2-letter words (at, it, is).",
        harder: "Use 4-letter words (that, this, with).",
        variant: "Read the word, then act it out before running back."
      }
    },
    {
      id: "phonics-cvc-word-bingo",
      category: "phonics",
      difficulty: "medium",
      minutes: "10–15",
      title: "CVC Word Bingo",
      prompt: "Make a bingo card with 3-sound words. Read them as you play.",
      materials: ["Paper", "Marker", "Small objects for markers"],
      steps: ["Draw a 3x3 grid (9 squares).", "Write a 3-sound word in each square (cat, dog, sun, etc.).", "Parent calls words.", "Cover the word when you hear it. Say 'Bingo!' when you get 3 in a row."],
      siblingStation: "Littles cover squares with stickers (no reading needed).",
      skills: {
        forMax: "You're learning to read 3-sound words in a fun game!",
        forParent: "Builds: CVC word reading, blending sounds, listening skills, game-playing."
      },
      twists: {
        easier: "Use just 6 words. 2x3 grid.",
        harder: "Use 4-letter words. 4x4 grid.",
        variant: "Make your own bingo card by writing the words yourself."
      }
    },
    {
      id: "phonics-letter-formation-race",
      category: "phonics",
      difficulty: "easy",
      minutes: "5–10",
      title: "Letter Formation Race",
      prompt: "Write the letter {{LETTER}} 5 times as fast as you can (neatly).",
      materials: ["Paper", "Marker or crayon"],
      steps: ["Parent shows the letter {{LETTER}}.", "Max writes it 5 times.", "Check: are they neat?", "If yes, celebrate! If not, try 2 more times."],
      siblingStation: "Littles scribble on their own paper.",
      skills: {
        forMax: "You're learning to write letters quickly and neatly!",
        forParent: "Builds: letter formation, fine motor skills, handwriting practice, speed + accuracy."
      },
      twists: {
        easier: "Write just 3 times. Use big paper.",
        harder: "Write 10 times. Use small lines.",
        variant: "Write the letter in different colors (rainbow letters)."
      }
    },
    {
      id: "math-coin-sort-race",
      category: "math",
      difficulty: "easy",
      minutes: "6–10",
      title: "Coin Sort Race",
      prompt: "Sort coins into piles by type (pennies, nickels, dimes).",
      materials: ["Mixed coins (10–20 total)", "3 bowls or piles"],
      steps: ["Dump coins on table.", "Make 3 piles: pennies, nickels, dimes.", "Sort as fast as you can.", "Count each pile when done."],
      siblingStation: "Littles sort by color (copper vs silver).",
      skills: {
        forMax: "You're learning to recognize different coins!",
        forParent: "Builds: coin recognition, sorting/classification, counting, money concepts."
      },
      twists: {
        easier: "Sort just pennies and nickels (2 piles).",
        harder: "Add quarters. Sort into 4 piles. Count total value.",
        variant: "Sort coins, then use them to 'buy' 3 items."
      }
    },
    {
      id: "math-pattern-blocks-copy",
      category: "math",
      difficulty: "medium",
      minutes: "10–15",
      title: "Pattern Blocks Copy",
      prompt: "Copy a pattern made with blocks, then make your own.",
      materials: ["Pattern blocks OR colored blocks", "Parent-made pattern"],
      steps: ["Parent makes a pattern (red-blue-red-blue).", "Max copies it exactly.", "Max makes a new pattern.", "Parent copies Max's pattern."],
      siblingStation: "Littles stack blocks in any order.",
      skills: {
        forMax: "You're learning to see patterns and make your own!",
        forParent: "Builds: pattern recognition, visual-spatial skills, sequencing, creative thinking."
      },
      twists: {
        easier: "Use just 2 colors. Pattern is 3 blocks long.",
        harder: "Use 3 colors. Pattern is 6 blocks long.",
        variant: "Make a pattern with shapes instead of colors (circle-square-circle)."
      }
    },
    {
      id: "math-dice-roll-add",
      category: "math",
      difficulty: "medium",
      minutes: "8–12",
      title: "Dice Roll Add",
      prompt: "Roll 2 dice and add the numbers together.",
      materials: ["2 dice", "Paper to write (optional)"],
      steps: ["Roll both dice.", "Say the first number.", "Say the second number.", "Add them together. Show with fingers or objects."],
      siblingStation: "Littles roll dice and count the dots.",
      skills: {
        forMax: "You're learning to add numbers from dice!",
        forParent: "Builds: addition practice, number recognition, subitizing (dice dots), mental math."
      },
      twists: {
        easier: "Use dice with dots 1–3 only. Add small numbers.",
        harder: "Roll 3 dice. Add all three numbers.",
        variant: "Roll dice, add them, then subtract 2 from the total."
      }
    },
    {
      id: "nature-bug-log",
      category: "nature",
      difficulty: "medium",
      minutes: "15–20",
      title: "Bug Log",
      prompt: "Find 3 bugs outside and draw them in a 'log book.'",
      materials: ["Outside", "Paper", "Crayons or markers"],
      steps: ["Find bug #1. Look closely.", "Draw it (simple is fine).", "Find bug #2 and draw it.", "Find bug #3 and draw it."],
      siblingStation: "Littles draw one bug or just scribble.",
      skills: {
        forMax: "You're learning to observe bugs and draw what you see!",
        forParent: "Builds: observation skills, scientific drawing, nature connection, attention to detail."
      },
      twists: {
        easier: "Find and draw just 1 bug.",
        harder: "Find 5 bugs. Write one word about each (big, red, fast).",
        variant: "Take photos of bugs instead of drawing them."
      }
    },
    {
      id: "nature-weather-reporter",
      category: "nature",
      difficulty: "easy",
      minutes: "5–10",
      title: "Weather Reporter",
      prompt: "Go outside and report the weather like a news reporter.",
      materials: ["Outside", "Optional: paper to write"],
      steps: ["Go outside and look around.", "Check: sunny, cloudy, rainy, windy?", "Check temperature: hot, warm, cool, cold?", "Report: 'Today's weather is...'"],
      siblingStation: "Littles just say 'sunny' or 'cloudy.'",
      skills: {
        forMax: "You're learning to observe and describe the weather!",
        forParent: "Builds: observation skills, descriptive vocabulary, weather concepts, public speaking practice."
      },
      twists: {
        easier: "Just say one word: sunny, cloudy, or rainy.",
        harder: "Report weather, then predict tomorrow's weather.",
        variant: "Make a weather chart and mark it every day for a week."
      }
    },
    {
      id: "nature-leaf-press",
      category: "nature",
      difficulty: "easy",
      minutes: "5–10 (today) + 2 minutes (later)",
      title: "Leaf Press",
      prompt: "Collect 5 leaves and press them between heavy books.",
      materials: ["Outside", "5 leaves", "2 heavy books"],
      steps: ["Collect 5 different leaves.", "Put them between 2 heavy books.", "Wait 2–3 days.", "Check: are they flat? Take them out."],
      siblingStation: "Littles collect leaves in a bag.",
      skills: {
        forMax: "You're learning to preserve leaves and wait for results!",
        forParent: "Builds: patience, nature collection, preservation concepts, delayed gratification."
      },
      twists: {
        easier: "Press just 2 leaves. Check tomorrow.",
        harder: "Press 10 leaves. Make a leaf book with labels.",
        variant: "Press leaves, then use them to make a leaf rubbing with crayons."
      }
    },
    { id: "phonics-blend-builder", category: "phonics", difficulty: "medium", level: "1st", minutes: "10–15", title: "Blend Builder", prompt: "Build words with consonant blends (bl, cr, st, etc.) using letter tiles; read each one and use it in a sentence.", materials: ["Letter tiles or cards (include blends: bl, cr, st, fl, tr, etc.)", "A flat surface"], steps: ["Pick a blend (bl, cr, st).", "Build 3 words that start with that blend.", "Read each word aloud.", "Use one word in a sentence."], siblingStation: "Littles match 2 letter cards that look the same.", skills: { forMax: "You're learning to read and use words with blends!", forParent: "Builds: consonant blend recognition, decoding, reading fluency, sentence building, vocabulary." } },
    { id: "phonics-sight-word-spy", category: "phonics", difficulty: "medium", level: "1st", minutes: "8–15", title: "Sight Word Spy", prompt: "Given 3 sight words, find them hidden around the house (written on cards placed by parent); read each one aloud and act it out.", materials: ["3 sight word cards (parent hides them)", "Your house"], steps: ["Parent hides 3 sight word cards.", "Find each card and read it aloud.", "Act out the word (or use it in a sentence).", "Collect all 3.", "Switch: you hide, parent finds."], siblingStation: "Littles hunt for a color card you hide.", skills: { forMax: "You're learning to read sight words anywhere!", forParent: "Builds: sight word recognition, reading in context, movement-integrated recall, game-based practice." } },
    { id: "phonics-word-family-flip", category: "phonics", difficulty: "medium", level: "1st", minutes: "8–15", title: "Word Family Flip", prompt: "Pick a word family (-at, -ig, -op); build 5+ words by swapping the first letter; race to read them all.", materials: ["Letter tiles or cards", "Word family ending card (-at, -ig, -op, -an, etc.)"], steps: ["Pick a word family (-at, -ig, -op).", "Build 5 words by changing the first letter.", "Read each word fast.", "Time yourself: can you read all 5 in 10 seconds?"], siblingStation: "Littles say the ending sound (-at, -at, -at).", skills: { forMax: "You're learning word families and reading faster!", forParent: "Builds: word family patterns, rapid decoding, phoneme substitution, reading fluency." } },
    { id: "phonics-sentence-builder", category: "phonics", difficulty: "hard", level: "1st", minutes: "10–18", title: "Sentence Builder", prompt: "Given 4–5 word cards, arrange them into a sentence; read it; then scramble and rebuild.", materials: ["4–5 word cards (e.g. The cat sat on the mat)", "A flat surface"], steps: ["Scramble the word cards.", "Arrange them into a sentence.", "Read the sentence aloud.", "Scramble again and rebuild.", "Try a different order (silly sentences allowed)."], siblingStation: "Littles put 2 cards in order.", skills: { forMax: "You're learning how words go together to make sentences!", forParent: "Builds: sentence structure, word order, reading comprehension, syntax awareness." } },
    { id: "math-add-to-20-relay", category: "math", difficulty: "medium", level: "1st", minutes: "12–20", title: "Add to 20 Relay", prompt: "Physical relay where each station has an addition problem (using objects); solve it to advance.", materials: ["3–4 stations (chairs, cones, or tape marks)", "Small objects at each station (blocks, rocks)", "Paper with addition problems (e.g. 5+7, 8+6)"], steps: ["Set up 3 stations with objects and a problem at each.", "Run to station 1; use objects to solve; say the answer.", "Run to station 2; solve; say the answer.", "Run to station 3; solve; finish.", "Do it again with new problems."], siblingStation: "Littles run the relay and count objects at each station.", skills: { forMax: "You're learning to add to 20 while moving!", forParent: "Builds: addition within 20, movement-integrated math, object-based counting, fluency." } },
    { id: "math-mystery-number", category: "math", difficulty: "medium", level: "1st", minutes: "8–15", title: "Mystery Number", prompt: "I'm thinking of a number. It's 3 more than 7. What is it? — physical number line + deduction.", materials: ["Number line (0–20) on floor with chalk or sticky notes", "Optional: small objects"], steps: ["Stand on a number.", "Parent gives a clue: 3 more than 7 or 2 less than 10.", "Walk to the answer.", "Say the number.", "Switch: you give a clue, parent finds it."], siblingStation: "Littles hop on just 1–5.", skills: { forMax: "You're learning to add and subtract in your head!", forParent: "Builds: mental math, number line reasoning, more/less than, deductive thinking." } },
    { id: "math-shape-builder", category: "math", difficulty: "medium", level: "1st", minutes: "12–20", title: "Shape Builder", prompt: "Build 2D shapes from sticks/straws; count sides and corners; combine shapes into a picture.", materials: ["Craft sticks, straws, or toothpicks", "Playdough or marshmallows for corners (optional)", "A flat surface"], steps: ["Build a triangle. Count sides and corners.", "Build a square. Count sides and corners.", "Build a rectangle. Compare to the square.", "Combine 2 shapes to make a picture (house, car, etc.)."], siblingStation: "Littles make a circle with one stick (or trace a shape).", skills: { forMax: "You're learning shapes and how they fit together!", forParent: "Builds: 2D shape recognition, sides and vertices, composition, geometry vocabulary." } },
    { id: "math-coin-counter", category: "math", difficulty: "medium", level: "1st", minutes: "10–18", title: "Coin Counter", prompt: "Real coins; Can you make 15 cents three different ways?", materials: ["Real coins (pennies, nickels, dimes)", "3 small bowls or spots"], steps: ["Pick a target (10, 15, or 20 cents).", "Make that amount one way. Put it in bowl 1.", "Make it a different way. Put it in bowl 2.", "Make it a third way. Put it in bowl 3.", "Count each way to check."], siblingStation: "Littles sort coins by type (big/small).", skills: { forMax: "You're learning how coins add up!", forParent: "Builds: coin values, equivalent amounts, counting money, flexible thinking." } },
    { id: "toddler-stack-3", category: "build", difficulty: "easy", level: "toddler", minutes: "2–5", title: "Stack 3", prompt: "Stack 3 blocks (or cups) as high as you can.", materials: ["3–5 blocks or plastic cups"], steps: ["Pick up one block.", "Put another on top.", "Add one more.", "Clap when it stands!"], siblingStation: "Same activity—everyone stacks.", skills: { forMax: "You're learning to balance and build!", forParent: "Builds: fine motor control, hand-eye coordination, cause-and-effect, persistence." } },
    { id: "toddler-balls-in-basket", category: "build", difficulty: "easy", level: "toddler", minutes: "3–6", title: "Balls in the Basket", prompt: "Put 5 balls (or rolled socks) into a basket.", materials: ["5 balls or rolled socks", "A basket or bowl"], steps: ["Put the basket on the floor.", "Pick up one ball and drop it in.", "Do it again with the rest.", "Dump them out and do it again!"], siblingStation: "Same activity—take turns or use two baskets.", skills: { forMax: "You're learning to aim and let go!", forParent: "Builds: hand-eye coordination, object permanence, counting, repetition." } },
    { id: "toddler-clap-with-me", category: "phonics", difficulty: "easy", level: "toddler", minutes: "2–5", title: "Clap With Me", prompt: "Clap to the beat of a nursery rhyme or song.", materials: ["Your hands", "A short song or rhyme"], steps: ["Sing or say a short rhyme (e.g. Pat-a-cake).", "Clap on the beat together.", "Do it again, faster or slower.", "Try stomping or tapping instead."], siblingStation: "Everyone claps together.", skills: { forMax: "You're learning rhythm and sounds!", forParent: "Builds: phonological awareness, rhythm, imitation, turn-taking." } },
    { id: "toddler-point-to-it", category: "phonics", difficulty: "easy", level: "toddler", minutes: "2–5", title: "Point to It", prompt: "When I say a word, point to that thing.", materials: ["3–5 familiar objects (ball, cup, shoe, etc.)"], steps: ["Put 3 objects in a row.", "Say one word: Ball.", "Toddler points to it.", "Switch: toddler picks, you point."], siblingStation: "Use colors: Point to red.", skills: { forMax: "You're learning that words mean things!", forParent: "Builds: receptive vocabulary, word-object association, listening, joint attention." } },
    { id: "toddler-count-to-3", category: "math", difficulty: "easy", level: "toddler", minutes: "2–5", title: "Count to 3", prompt: "Count 3 things together: 1, 2, 3.", materials: ["3 of anything (blocks, crackers, toys)"], steps: ["Point to the first one: One.", "Point to the second: Two.", "Point to the third: Three.", "Do it again. Let toddler try."], siblingStation: "Same—count together.", skills: { forMax: "You're learning numbers!", forParent: "Builds: one-to-one correspondence, number names, quantity sense." } },
    { id: "toddler-big-and-small", category: "math", difficulty: "easy", level: "toddler", minutes: "2–5", title: "Big and Small", prompt: "Find something big and something small.", materials: ["Things around the room (or outside)"], steps: ["Say: Can you find something BIG?", "Toddler finds one (or you help).", "Say: Can you find something small?", "Compare them: This one is bigger!"], siblingStation: "Everyone finds big and small.", skills: { forMax: "You're learning big and small!", forParent: "Builds: size comparison, vocabulary, observation, comparison." } },
    { id: "toddler-touch-a-leaf", category: "nature", difficulty: "easy", level: "toddler", minutes: "2–5", title: "Touch a Leaf", prompt: "Go outside and touch one leaf.", materials: ["Outside (or a leaf you bring in)"], steps: ["Go outside (or hold up a leaf).", "Say: Touch the leaf.", "Toddler touches it.", "Say: Soft? Rough? Green?"], siblingStation: "Everyone touches a leaf.", skills: { forMax: "You're learning about nature!", forParent: "Builds: sensory exploration, nature connection, vocabulary, observation." } },
    { id: "toddler-find-green", category: "nature", difficulty: "easy", level: "toddler", minutes: "2–5", title: "Find Green", prompt: "Find something green outside (or in the room).", materials: ["Outside or around the house"], steps: ["Say: Find something green.", "Walk together and look.", "When toddler points or picks: Yes! Green!", "Try another color next."], siblingStation: "Find red, then blue.", skills: { forMax: "You're learning colors in nature!", forParent: "Builds: color recognition, observation, vocabulary, outdoor time." } },
    { id: "toddler-hand-it-over", category: "social", difficulty: "easy", level: "toddler", minutes: "2–5", title: "Hand It Over", prompt: "Hand a toy to someone and say Here!", materials: ["A toy or object", "A person to give it to"], steps: ["Give toddler a toy.", "Say: Give it to [name].", "Toddler hands it over.", "Other person says Thank you! and gives it back."], siblingStation: "Pass a ball around the circle.", skills: { forMax: "You're learning to share and give!", forParent: "Builds: social scripts, turn-taking, giving, reciprocity." } },
    { id: "toddler-high-five", category: "social", difficulty: "easy", level: "toddler", minutes: "1–3", title: "High Five", prompt: "Give 3 people a high five.", materials: ["Family members or stuffed animals"], steps: ["Say: High five! and hold up your hand.", "Toddler slaps it.", "Do it with the next person.", "Celebrate: You did it!"], siblingStation: "Everyone gets a high five.", skills: { forMax: "You're learning to connect with people!", forParent: "Builds: social connection, imitation, motor planning, celebration." } },
    { id: "toddler-toys-in-bin", category: "responsibility", difficulty: "easy", level: "toddler", minutes: "2–5", title: "Toys in the Bin", prompt: "Put 3 toys in the bin.", materials: ["3 toys", "A bin or basket"], steps: ["Point to 3 toys on the floor.", "Say: Put them in the bin.", "Toddler puts them in (help if needed).", "Clap: You helped!"], siblingStation: "Everyone puts 3 in.", skills: { forMax: "You're learning to help!", forParent: "Builds: task completion, contribution, following directions, pride in work." } },
    { id: "toddler-wipe-table", category: "responsibility", difficulty: "easy", level: "toddler", minutes: "2–4", title: "Wipe the Table", prompt: "Wipe the table with a cloth.", materials: ["A damp cloth or sponge", "A table or tray"], steps: ["Give toddler the cloth.", "Say: Wipe the table.", "Toddler wipes (any which way).", "Say: Good helper!"], siblingStation: "Give littles a dry cloth to clean a toy.", skills: { forMax: "You're learning to help our family!", forParent: "Builds: practical life skills, contribution, imitation, motor skills." } },
    { id: "writing-sky-letters", category: "writing", difficulty: "easy", level: "prek", minutes: "3–5", title: "Sky Writing: {{LETTER}}", prompt: "Write a giant {{LETTER}} in the air, then on someone's back, then with one finger on the table.", materials: ["Your arm", "A partner's back", "A table"], steps: ["Grown-up writes {{LETTER}} big in the air first. Watch where it starts.", "Stand up. Write it in the sky with your whole arm, 3 times. Say each stroke out loud.", "Write it on a partner's back. They guess the letter.", "Write it small on the table with one finger."], siblingStation: "Littles draw big circles and lines in the air.", skills: { forMax: "You're teaching your arm the path of the letter, so your pencil knows it later!", forParent: "Builds: letter formation from the shoulder down, start point and stroke order, big-to-small motor control." } },
    { id: "writing-chalk-road", category: "writing", difficulty: "easy", level: "prek", minutes: "10–15", title: "Chalk Letter Road", prompt: "Draw giant chalk letters, then drive a toy car along each one, starting at the green dot.", materials: ["Sidewalk chalk (with green)", "A toy car", "Driveway or sidewalk"], steps: ["Pick 3 letters from Joyce's writing card this week.", "Draw each one huge. Put a green dot where it starts.", "Drive the car from the green dot along the letter, the way the pencil goes.", "Hard mode: draw it again, smaller, with your eyes on the green dot."], siblingStation: "Littles drive cars on a big chalk circle and a straight road.", skills: { forMax: "You're learning where each letter starts and which way it goes!", forParent: "Builds: letter formation through movement, directionality, visual tracking, gross-to-fine transfer." } },
    { id: "writing-salt-tray", category: "writing", difficulty: "easy", level: "prek", minutes: "5–10", title: "Salt Tray Letters", prompt: "Write letters with one finger in a tray of salt, then shake it smooth and go again.", materials: ["A baking tray or shallow box", "Salt, sugar, or sand"], steps: ["Pour a thin layer of salt in the tray.", "Write c, o, a, d, g. They all start like c.", "Shake the tray smooth after each one.", "Grown-up says a letter, you write it without looking at a model."], siblingStation: "Littles draw lines, circles, and their first letter in the salt.", skills: { forMax: "You're writing letters from memory, just like a real writer!", forParent: "Builds: independent letter recall (not tracing), formation families, tactile feedback, low-pressure practice." } },
    { id: "writing-shrink-ray", category: "writing", difficulty: "medium", level: "prek", minutes: "5–8", title: "Shrink Ray", prompt: "Write one letter giant, then zap it with the shrink ray: medium, small, and tiny.", materials: ["Paper or a whiteboard", "A marker or pencil"], steps: ["Write a letter giant, as big as your hand.", "Zap! Write it again, half as big.", "Zap! Write it small enough to fit inside a box on your writing paper.", "Zap! Can you make one tiny but still right?"], siblingStation: "Littles draw a big circle, then a smaller circle inside it.", skills: { forMax: "You're learning to make your letters any size you want!", forParent: "Builds: size control (Max's letters run much bigger than the lines), motor planning, self-monitoring." } },
    { id: "writing-label-your-build", category: "writing", difficulty: "medium", level: "kinder", minutes: "10–15", title: "Label Your Build", prompt: "Make a sign for something you built: its name, in your own writing.", materials: ["Something you built", "An index card or sticky note", "A pencil", "Tape"], steps: ["Choose a name for your build (1 to 3 words).", "Say the sounds. Grown-up helps with spelling if you ask.", "Write the sign. Leave a finger space between words.", "Tape it on your build and give someone the tour."], siblingStation: "Littles draw a picture sign for their own build.", skills: { forMax: "You're writing for real, so everyone knows what you made!", forParent: "Builds: purposeful writing, spelling by sound, word spacing, pride in work." } },
    { id: "writing-trainer-team", category: "writing", difficulty: "medium", level: "kinder", minutes: "10–15", title: "Trainer Team List", prompt: "Write your Pokémon team: 3 names, copied from your handbook.", materials: ["Your Pokémon handbook", "Lined writing paper", "A pencil"], steps: ["Pick 3 Pokémon for your team.", "Find each name in the handbook.", "Copy each name on its own line. Check: do the letters stay in the lines?", "Draw a Poké Ball next to each one."], siblingStation: "Littles draw their favorite Pokémon and write its first letter.", skills: { forMax: "You're making a real trainer roster in your own handwriting!", forParent: "Builds: copywork with a purpose, letter size on lines, attention to detail, interest-driven practice." } },
    { id: "writing-mail-carrier", category: "writing", difficulty: "medium", level: "kinder", minutes: "10–15", title: "Mail Carrier", prompt: "Write a little note to someone in the family and deliver it.", materials: ["Paper or a card", "A pencil or crayons", "Optional: an envelope"], steps: ["Pick who it's for.", "Write To and their name, then one short message (like I like you or Come play).", "Draw a picture and write your name at the bottom.", "Deliver it. Bonus: wait for a reply."], siblingStation: "Littles draw a picture card and scribble their name.", skills: { forMax: "You're sending real mail that someone gets to read!", forParent: "Builds: writing to communicate, names and short words, spacing, social connection." } }
  ],
  templateVariables: {
    SOUND: ["m", "s", "t", "p", "b", "k", "f", "sh", "ch", "th"],
    LETTER: ["M", "S", "T", "P", "B", "K", "F", "A", "E", "I", "O"],
    N1: [2, 3, 4, 5, 6],
    N2: [1, 2, 3, 4, 5],
    WORD: ["cat", "dog", "sun", "map", "hat", "bat", "fan", "pan", "can", "man"],
    COIN: ["5 pennies", "a nickel", "a dime", "10 pennies"],
    JOB: ["wipe table", "feed pet", "water plants", "match socks", "clear dishes"]
  }
};