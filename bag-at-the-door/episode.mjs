// Essential skill: teamwork-1. The crew holds the latch, lowers the bag, and guides its strap together.
export const EPISODE = {
  id: 's2e1-bag-at-the-door', version: '2026-10-31-1', title: 'The Bag at the Door',
  season: 'Through the Woods', targetMinutes: [9, 11],
  taughtBefore: ['m','a','s','t','p','i','n','r'], introduced: ['d'],
  targets: ['pad','sad','did','dim'], review: ['map','mat'],
  // Every letter in this episode's target words represents a separate short sound.
  // Do not add arches, long-vowel bars, or sight-word underlines to these words.
  annotations: {teams: [], bars: [], sight: [], defaultVisible: true, sliders: true},
  completionItem: 'bag-at-the-door:episode-complete',
  treasure: {id:'doorway-tag', title:'The doorway tag', word:'d'},
};

export const BEATS = [
  {id:'a-library-to-share', scene:'library', visual:'packed', paragraphs:[
    'Morning slipped through the open door of the Treasure Tree. Yesterday’s damp leaves glittered outside. Inside, your finished adventure stood on the shelf: The Map Pieces. The whole map rested safely in its folio, beside the moonstone. Nothing was missing today.',
    '“We found a library,” Lark declared delightedly. “Now we need readers!”',
    'On the packing shelf lay three fresh invitations. Lark read their destinations aloud: Reed Hut, the Mill, and Fern Lodge. Nib dropped one into each of his new courier bag’s three pockets.',
    '“Three deliveries,” Nib announced grandly. “One dependable mouse.”',
    'He ducked under the strap. The bag settled with a soft thump. It was rather wider than the dependable mouse.'
  ]},
  {id:'bring-the-map', scene:'library', visual:'packed', paragraphs:[
    'Lark brought two closed folios down from the shelf. They looked almost alike. One held the map; the other held your folded mat. Each had its own little label.',
    '“Let’s take the map,” Lark suggested warmly. “Which label says map?”'
  ], gate:'review-map'},
  {id:'a-difficult-departure', scene:'door', visual:'caught', paragraphs:[
    'With the map tucked safely into the bag, Nib marched toward the door. His feet made determined little pats across the boards. The bottom of the bag passed through. The middle passed through. Then the strap stopped dead.',
    '“I have arrived,” Nib declared.',
    'He glanced back at the packing shelf.',
    '“At a very nearby destination,” Nib added doubtfully.',
    'A loose loop had caught beneath the brass latch. The door was wide enough. The bag was wide enough. The strap had simply found the one place it could not pass.'
  ]},
  {id:'do-not-drag', scene:'door', visual:'unpacked', paragraphs:[
    'Nib gave a small tug. The latch pressed a dent into the cloth.',
    '“Don’t drag it,” Lark urged gently. “We’ll rub a hole in our delivery bag.”',
    'You helped set the bag on the dry floor. Lark lifted the three invitations out, one by one, and laid them safely on the packing shelf. Nobody had received a delivery yet.',
    'Nib drooped beside the doorway.',
    '“A splendid bag,” Nib murmured sadly.',
    '“A rather grabby latch,” Lark replied thoughtfully. “We need something soft between the brass and the strap.”'
  ]},
  {id:'a-small-new-sound', scene:'shelf', visual:'unpacked', paragraphs:[
    'The shelf had two little cupboards. Their contents were hidden behind wooden doors. Lark drew a round shape, then a tall line beside it, on a small slate. A lowercase d.',
    '“Listen to the beginning of dip,” Lark invited softly. “A quick little sound. Your tongue touches just behind your top teeth, then lets go.”',
    'Nib tried it once. A tiny puff disturbed a speck of dust.',
    '“A small sound for a difficult door,” Nib observed hopefully.',
    'Lark set three letters in a row: p, a, d.',
    '“Here are two sounds we know and our new one,” Lark explained patiently. “We can join them: pad. A soft pad can protect the strap. Slide with me, then say the whole word if you like.”'
  ], gate:'model-pad'},
  {id:'the-cupboard-label', scene:'shelf', visual:'unpacked', paragraphs:[
    'Nib leaned toward the cupboard nearest him. Then he paused. Both labels began with p. Both had a in the middle. That would not tell him which cupboard held the pad.',
    '“I nearly picked the first one,” Nib admitted sheepishly.',
    '“The last sound matters too,” Lark reminded him gently. “Find pad on the shelf.”'
  ], gate:'find-pad'},
  {id:'a-pad-for-the-latch', scene:'door', visual:'padded', paragraphs:[
    'The cupboard opened. Inside lay a folded felt pad, just the right size. You carried it to the doorway. Its soft cloth wrapped around the sharp lower edge of the latch, leaving the handle clear.',
    'Nib touched the strap. No new scrape. No deep dent.',
    '“A padded problem,” Nib announced proudly.',
    '“A protected strap,” Lark corrected him with a chuckle. “The loop is still caught underneath. We’ll need to do different jobs together.”',
    'Lark fluttered up to lift the latch. Nib lowered the bag until its base rested on the floor. That made the strap slack. A clear opening appeared above the loose loop.'
  ]},
  {id:'three-small-jobs', scene:'door', visual:'lifted', paragraphs:[
    '“I’ll hold this up,” Lark called steadily.',
    '“I’ll keep the bag down,” Nib answered determinedly.',
    'The loose strap rested within reach. You could guide it through the opening while your friends held their places. Nobody needed to tug.',
    '“Bring the strap through the gap,” Lark urged encouragingly. “We’ll hold it for you.”'
  ], gate:'free-strap'},
  {id:'out-without-a-dent', scene:'door', visual:'free', paragraphs:[
    'The loop slipped clear. Lark lowered the latch only after the cloth was free. Nib took one careful step backward. The bag came with him.',
    '“It did!” Nib exclaimed delightedly. “It did go through!”',
    'He examined the strap from end to end. The pad had kept it from tearing. Lark folded the pad around the strap’s worn spot and fastened its small cloth tie. It could travel with the bag now.',
    '“We didn’t need a bigger door,” Lark remarked thoughtfully.',
    '“Or a smaller mouse,” Nib added with relief. “Excellent news for the mouse.”'
  ]},
  {id:'check-the-three-deliveries', scene:'packing', visual:'free', paragraphs:[
    'The three invitations still waited on the dry shelf. Lark read their destinations again and pointed to the matching pictures on the bag’s pockets: a reed-roofed hut, the Mill wheel, and Fern Lodge’s fern. You did not need to read those names yourself.',
    'Nib held the pockets open, one at a time. Lark kept the bag steady. There was a separate place for every invitation.',
    '“Three invitations,” Lark counted calmly. “Three pockets. Put each picture with its matching pocket, and we’ll check them together.”'
  ], gate:'pack-invitations'},
  {id:'our-first-courier-page', scene:'packing', visual:'packed', paragraphs:[
    'One invitation in each pocket. Three invitations altogether. The map and route book lay in the main compartment, away from the damp patch on Nib’s scarf.',
    'Lark opened a fresh journal. She drew the caught strap, the pad, and three friends doing three useful jobs. Nib added a very large doorway and a very small dent.',
    'Beside the drawing, Lark fastened a little wooden tag from the packing shelf. She had written d on it.',
    '“Our doorway tag,” Lark explained warmly. “For the first page of our delivery adventure.”',
    'Nib held it up, then tucked it into your collection pocket. Your first courier page was ready to read again.'
  ]},
  {id:'the-first-direction', scene:'path', visual:'depart', paragraphs:[
    'Outside, daylight dappled the dry path. Nib checked that the strap lay flat before lifting the bag. This time he passed through the door without a tug.',
    'Lark opened the route book on a low, level stump. Its first picture showed a fish’s fin beside a fork in the path. She read the next direction aloud. That little word would be your next discovery.',
    '“First stop: Reed Hut,” Lark announced brightly.',
    '“First job: done,” Nib declared proudly.',
    'He looked down at his dependable bag.',
    '“Next job: delivery,” Nib declared eagerly.',
    'With all three invitations safe, you set off together. Behind you, the library door rested open. Ahead, the woodland had readers to find.'
  ]},
];

export const GATES = {
  'review-map': {kind:'review', skill:'Word recognition', prompt:'Which label says map?', words:['mat','map'], answer:'map',
    hints:{mat:'That ends with t. Look for the word ending in p.',map:'Start with m, then a, then p. Join the sounds.'},
    success:'The map folio is packed. The mat stays on the shelf.'},
  'model-pad': {kind:'model', skill:'Supported blending', prompt:'Slide with Lark. Then say pad if you like.', words:['pad'],
    success:'We joined p, a, and d. Pad.'},
  'find-pad': {kind:'modeled-transfer', skill:'Supported word recognition', prompt:'Find pad on the shelf.', words:['pan','pad'], answer:'pad',
    hints:{pan:'That ends with n. We need the quick d sound at the end.',pad:'Keep p and a, then read the final d. Join them: pad.'},
    success:'The pad cupboard opens. Take the soft pad to the latch.'},
  'free-strap': {kind:'story', skill:'Story participation', prompt:'Bring the strap through the gap.',
    success:'The strap is through. Lark can lower the latch.'},
  'pack-invitations': {kind:'story', skill:'Story participation', prompt:'Match the three pictures to the three pockets.',
    success:'All three invitations are packed. Nothing has been delivered yet.'},
};

export const CHAPTER = [
  {adult:'Nib’s bag caught beneath the latch. We found a soft', child:'pad', end:'.'},
  {adult:'At first Nib drooped. Lark described how he felt:', child:'sad', end:'.'},
  {adult:'The cupboard was dark inside. Lark called it', child:'dim', end:'.'},
  {adult:'Could the bag go through? It', child:'did', end:'.'},
];

// Separate voice turns without asking an actor to speak a production label.
export function voiceParts(paragraph) {
  const parts=[]; let at=0,previousSpeaker=null;
  const matcher=/“([^”]+)”/g;
  for(const m of paragraph.matchAll(matcher)) {
    if(m.index>at)parts.push({speaker:'narrator',text:paragraph.slice(at,m.index).trim()});
    const attribution=/^\s*(Lark|Nib)\b/.exec(paragraph.slice(m.index+m[0].length));
    const speaker=attribution?attribution[1].toLowerCase():previousSpeaker||'narrator';
    parts.push({speaker,text:m[1]});previousSpeaker=speaker;
    at=m.index+m[0].length;
  }
  if(at<paragraph.length)parts.push({speaker:'narrator',text:paragraph.slice(at).trim()});
  return parts.filter(p=>p.text);
}
