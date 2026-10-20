(() => {
  "use strict";

  // Lakeshore Learning "300 Most Common Sight Words", in list order.
  const SIGHT_WORDS_300 = [
    // 1-50
    "the", "of", "and", "a", "to", "in", "is", "you", "that", "it",
    "he", "was", "for", "on", "are", "as", "with", "his", "they", "I",
    "at", "be", "this", "have", "from", "or", "one", "had", "by", "word",
    "but", "not", "what", "all", "were", "we", "when", "your", "can", "said",
    "there", "use", "an", "each", "which", "she", "do", "how", "their", "if",
    // 51-100
    "will", "up", "other", "about", "out", "many", "then", "them", "these", "so",
    "some", "her", "would", "make", "like", "him", "into", "time", "has", "look",
    "two", "more", "write", "go", "see", "number", "no", "way", "could", "people",
    "my", "than", "first", "water", "been", "call", "who", "oil", "now", "find",
    "long", "down", "day", "did", "get", "come", "made", "may", "part", "over",
    // 101-150
    "new", "sound", "take", "only", "little", "work", "know", "place", "year", "live",
    "me", "back", "give", "most", "very", "after", "thing", "our", "just", "name",
    "good", "sentence", "man", "think", "say", "great", "where", "help", "through", "much",
    "before", "line", "right", "too", "mean", "old", "any", "same", "tell", "boy",
    "follow", "came", "want", "show", "also", "around", "farm", "three", "small", "set",
    // 151-200
    "put", "end", "does", "another", "well", "large", "must", "big", "even", "such",
    "because", "turn", "here", "why", "ask", "went", "men", "read", "need", "land",
    "different", "home", "us", "move", "try", "kind", "hand", "picture", "again", "change",
    "off", "play", "spell", "air", "away", "animal", "house", "point", "page", "letter",
    "mother", "answer", "found", "study", "still", "learn", "should", "America", "world", "high",
    // 201-250
    "every", "near", "add", "food", "between", "own", "below", "country", "plant", "last",
    "school", "father", "keep", "tree", "never", "start", "city", "earth", "eye", "light",
    "thought", "head", "under", "story", "saw", "left", "don't", "few", "while", "along",
    "might", "close", "something", "seem", "next", "hard", "open", "example", "begin", "life",
    "always", "those", "both", "paper", "together", "got", "group", "often", "run", "important",
    // 251-300
    "until", "children", "side", "feet", "car", "mile", "night", "walk", "white", "sea",
    "began", "grow", "took", "river", "four", "carry", "state", "once", "book", "hear",
    "stop", "without", "second", "late", "miss", "idea", "enough", "eat", "face", "watch",
    "far", "Indian", "real", "almost", "let", "above", "girl", "sometimes", "mountain", "cut",
    "young", "talk", "soon", "list", "song", "being", "leave", "family", "it's", "afternoon"
  ];

  const wordsInRange = (from, to) => SIGHT_WORDS_300.slice(from - 1, to);

  // Ghost Word Run "Tricky Words" fill: Reading.com Parent Scope & Sequence words
  // introduced in lessons 97 back through 94 (most recent first), capped at 30.
  // Source: https://www.reading.com/uploads/parent_scope_and_sequence.pdf
  const TRICKY_FILL_WORDS = [
    // Lesson 97 (Al)
    "calls", "small", "real", "throws", "always", "almost", "baseball", "zero", "wall",
    // Lesson 96 (Review)
    "round", "clock", "scores", "would", "should", "base", "prize",
    // Lesson 95 (Soft c)
    "race", "fence", "twice", "place", "danced", "chance", "their", "our", "lace",
    // Lesson 94 (Review) — first 5 to reach 30
    "slip", "frown", "brown", "skates", "how"
  ];

  // Words that sound alike can't share a row: the child picks by ear, so both would be "right".
  const SOUND_ALIKE_GROUPS = [
    ["to", "two", "too"],
    ["for", "four"],
    ["there", "their"],
    ["write", "right"],
    ["no", "know"],
    ["one", "won"],
    ["by", "buy"],
    ["be", "bee"],
    ["see", "sea"],
    ["I", "eye"],
    ["hear", "here"],
    ["our", "hour"],
    ["would", "wood"],
    ["which", "witch"]
  ];

  // Trick-or-Treat Street rhyming: words in a family rhyme with each other and with no other family.
  // Only sight words and short words Max can sound out. Homophones inside a family (no/know) are
  // never used as prompt and answer together.
  const RHYME_FAMILIES = [
    ["cat", "hat", "bat", "sat", "mat", "that"],
    ["can", "man", "ran", "fan", "pan", "an"],
    ["big", "pig", "dig", "wig"],
    ["it", "sit", "hit", "bit"],
    ["hot", "not", "got", "pot", "dot"],
    ["fun", "run", "sun", "one"],
    ["up", "cup", "pup"],
    ["get", "wet", "pet", "net", "let", "yet"],
    ["ten", "men", "hen", "then", "when"],
    ["in", "pin", "win", "fin", "thin"],
    ["day", "way", "may", "say", "play", "they", "away"],
    ["he", "me", "we", "be", "see", "tree", "three", "she"],
    ["go", "no", "so", "snow", "grow", "show", "know"],
    ["my", "by", "fly", "try", "why", "sky", "high"],
    ["all", "ball", "call", "tall", "fall", "small"],
    ["look", "book", "took", "cook"],
    ["night", "light", "right", "might", "white", "write"],
    ["down", "town", "brown", "clown"],
    ["now", "how", "cow"],
    ["old", "cold", "told", "gold"],
    ["make", "take", "cake", "lake"],
    ["came", "name", "same", "game"],
    ["will", "hill", "still", "fill"],
    ["thing", "sing", "king", "ring", "bring"],
    ["and", "hand", "land", "sand", "band"],
    ["well", "tell", "bell", "yell", "spell"],
    ["kind", "find", "mind"],
    ["boy", "toy", "joy"],
    ["back", "black", "sack", "pack"],
    ["feet", "eat", "street", "sweet", "meet"],
    ["out", "about", "shout"],
    ["hop", "stop", "top", "mop"],
    ["red", "bed", "said", "head"],
    ["more", "four", "for", "door", "store"],
    ["car", "far", "star", "jar"],
    ["there", "where", "chair", "bear", "their"],
    ["you", "do", "who", "new", "blue", "zoo", "two"],
    ["house", "mouse"]
  ];

  // Families that sound close enough (man/hand, my/kind) to confuse a young listener.
  // Never shown as the right door and a wrong door on the same knock. Each entry names a word from each family.
  const NEAR_RHYMES = [
    ["can", "and"],
    ["my", "kind", "night"],
    ["he", "feet"],
    ["hot", "hop"],
    ["day", "make", "came"],
    ["go", "old"],
    ["now", "down", "out", "house"],
    ["in", "thing"],
    ["it", "big"]
  ];

  const sightWordLevels = [
    {
      id: "moonlit-meadow",
      name: "Moonlit Meadow",
      description: "Words 1-50 - 2 paths",
      minChoices: 2,
      maxChoices: 2,
      words: wordsInRange(1, 50)
    },
    {
      id: "pumpkin-path",
      name: "Pumpkin Path",
      description: "Words 51-100 - up to 3 paths",
      minChoices: 2,
      maxChoices: 3,
      words: wordsInRange(51, 100)
    },
    {
      id: "bat-cave",
      name: "Bat Cave",
      description: "Words 101-150 - up to 3 paths",
      minChoices: 2,
      maxChoices: 3,
      words: wordsInRange(101, 150)
    },
    {
      id: "haunted-hill",
      name: "Haunted Hill",
      description: "Words 151-200 - 3 paths",
      minChoices: 3,
      maxChoices: 3,
      words: wordsInRange(151, 200)
    },
    {
      id: "graveyard-grand-tour",
      name: "Graveyard Grand Tour",
      description: "All of words 1-200 mixed - 3 paths",
      minChoices: 3,
      maxChoices: 3,
      words: wordsInRange(1, 200)
    },
    {
      id: "witchs-woods",
      name: "Witch's Woods",
      description: "Stretch words 201-250 - 3 paths",
      minChoices: 3,
      maxChoices: 3,
      words: wordsInRange(201, 250)
    },
    {
      id: "midnight-mansion",
      name: "Midnight Mansion",
      description: "Stretch words 251-300 - 3 paths",
      minChoices: 3,
      maxChoices: 3,
      words: wordsInRange(251, 300)
    }
  ];

  window.GHOST_RUN_CONTENT = {
    sightWords: SIGHT_WORDS_300,
    trickyFillWords: TRICKY_FILL_WORDS,
    soundAlikeGroups: SOUND_ALIKE_GROUPS,
    rhymeFamilies: RHYME_FAMILIES,
    nearRhymes: NEAR_RHYMES,
    categories: [
      {
        id: "sight-words",
        name: "Sight Words",
        icon: "ABC",
        promptLabel: "Fly through",
        levels: sightWordLevels
      }
    ]
  };
})();
