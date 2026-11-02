// Essential skill: problem-solving-1. Secure the catching cloth before releasing the apple chute.
export const EPISODE={
 id:'s1e2-apple-catcher',version:'2026-11-01-1',title:'The Apple Catcher',season:'The Map Pieces',number:2,
 targetMinutes:[8,10],taughtBefore:['m'],introduced:['a'],targets:['am'],review:['m'],
 completionItem:'apple-catcher:episode-complete',treasure:{id:'map-section-a',title:'The orchard map section'},
 annotations:{teams:[],bars:[],sight:[],defaultVisible:true,sliders:true},
 soundModels:{'the-start-of-apple:p2':'a'},
};

export const BEATS=[
 {id:'an-apple-at-camp',scene:'camp',visual:'camp',paragraphs:[
  'The apple was still beside the wagon wheel. It had rolled into camp after your moonstone adventure, and Nib had been guarding it very carefully. This morning, it had one small bite missing.',
  '“An investigation,” Nib explained solemnly. “I had to find out whether it was an apple.”',
  'Lark spread your surviving map on the explorer case. In the moonstone’s amber light, the orchard line appeared again. She packed the map, stone, journal, rope, and umbrella. Nib added the apple.',
  'As the wagon passed the camp oak, a wheel bumped its crooked root. “That tree has its foot out,” Nib complained mildly. Lark helped him steer around it. Then you followed the apple’s clue.'
 ]},
 {id:'our-old-hum',scene:'camp',visual:'camp',paragraphs:[
  'At the fork, Lark checked the little mark copied from your first adventure. You had met its closed-lip hum beside the lagoon. The new orchard clue could wait while you remembered the old one.',
  '“Which little letter makes our hum?” Lark asked gently.'
 ],gate:'review-m'},
 {id:'the-broken-catcher',scene:'orchard',visual:'loose',paragraphs:[
  'The orchard smelled of apples and damp leaves. A wooden chute sloped between two trees. Beneath it hung a catching cloth, but one corner had come loose. Fallen apples were heaped beside an old box on a low shelf.',
  'Three more apples waited behind a wooden stop at the top of the chute. Nothing was moving now.',
  '“I am an excellent apple basket,” Nib declared proudly. He spread his little arms. One apple filled them.',
  '“You are a rather small one,” Lark observed gently. “Let’s mend the catcher before we release the next apples. We must keep that old box safe.”'
 ]},
 {id:'the-start-of-apple',scene:'orchard',visual:'loose',paragraphs:[
  'A carved apple marked the brass catch. Beside it was a little letter with a round middle and a short stem: lowercase a. The other catch carried the m you knew.',
  '“Listen at the beginning of apple,” Lark invited softly. “Apple. Ant. That open little sound is the sound for this a. Listen.”',
  'Nib put his apple in the wagon, then stretched the cloth toward the post while Lark held the frame steady. The loose corner would reach the catch if you chose its new little letter.',
  '“Find the little letter for the start of apple,” Lark encouraged warmly.'
 ],gate:'find-a'},
 {id:'two-marks-one-loop',scene:'orchard',visual:'loose',paragraphs:[
  'The corner caught, but its fastening loop still dangled. Without that loop, a heavy apple could pull the cloth free again. Two wooden picture marks showed where the loop might go.',
  'Lark named them aloud: ant and moon. Nib kept both paws on the cloth. The waiting apples stayed behind their stop.',
  '“Which picture starts with the same little sound as apple?” Lark asked clearly. “Then fasten the loop before you let an apple down.”'
 ],gate:'choose-ant'},
 {id:'apples-in-the-cloth',scene:'orchard',visual:'ready',paragraphs:[
  'The loop held. You lifted the wooden stop, and an apple rolled down the chute into the cloth. It settled with a soft, comfortable thump. The old route box stayed safe on its shelf.',
  '“Caught!” Nib exclaimed delightedly. He clapped so hard that his empty pockets flapped.',
  'Lark and Nib gathered the apples from around the shelf. They put several in the picnic basket. Now the path to the box was clear, and the next apples had somewhere safe to land.'
 ]},
 {id:'our-first-little-word',scene:'orchard',visual:'cleared',paragraphs:[
  'Lark opened the journal on a flat board. She placed the new a beside your familiar m. Two little letters could do something new together.',
  '“Start with the open sound from apple,” Lark explained patiently. “Then close your lips into our hum. Keep them close together: am.”',
  '“I am an apple catcher,” Nib announced proudly. “A catcher who also enjoys a snack.”',
  'Lark pointed beneath the two letters. “Slide with me, then say am if you like,” Lark invited gently. “I’ll read the rest of our sentence.”'
 ],gate:'blend-am'},
 {id:'the-box-on-the-shelf',scene:'orchard',visual:'cleared',paragraphs:[
  'The old box had a little brass lift latch and an apple carved into its lid. It was dry and undented. Nib stood beside the shelf while Lark laid your surviving map on a flat board.',
  '“We can open it safely now,” Lark murmured eagerly. “Lift the latch. Then see where the paper inside belongs.”'
 ],gate:'fit-map'},
 {id:'the-first-missing-section',scene:'orchard',visual:'found',paragraphs:[
  'Inside lay a folded map section and an illustrated note. Lark read it aloud. Earlier explorers had kept pieces of their worn map in route boxes, so each part would stay safe until someone came along the path.',
  'Your original section had four empty spaces beside it. The orchard piece fitted one. Two sections together now; three spaces still waiting.',
  'Lark passed the moonstone above the joined paper. A hidden line appeared, leading through a windy hollow to a little roofed waystation on the ridge.',
  '“Another small clue,” Lark remarked thoughtfully. “Enough for our next adventure.”'
 ]},
 {id:'our-second-journal-page',scene:'orchard',visual:'found',paragraphs:[
  'Nib drew the catcher in the journal. In his picture, every pocket held an apple. Lark wrote their new little word in the sentence, and you could join its two sounds again whenever you wished.',
  'They tucked the first missing section into the case beside the original map. The moonstone and journal went with it. The empty route box closed neatly on its shelf.',
  '“I am an apple catcher,” Nib repeated contentedly. He tossed his saved apple a little way up and caught it himself.'
 ]},
 {id:'a-gust-and-an-idea',scene:'orchard',visual:'found',paragraphs:[
  'The catcher rested between the trees, fastened and ready. Your basket held apples for the road, and the ridge route was safe inside the case. The orchard’s little problem was solved.',
  'A gust ran through the branches. The wagon’s small pennant fluttered. Nib looked from the pennant to the folded picnic cloth, then toward the windy hollow.',
  '“I have an idea,” Nib whispered excitedly. Lark tucked the map away before the breeze could catch it. Together, you turned the wagon toward the ridge.'
 ]},
];

export const GATES={
 'review-m':{kind:'review',measure:'letter-sound recognition',prompt:'Which little letter makes our hum?',choices:['a','m'],answer:'m',
  hints:{a:'Bring your lips together for our hum. Look for the letter with two little humps.',m:'Our closed-lip hum goes with m.'},success:'Our familiar hum. We can follow the orchard clue.'},
 'find-a':{kind:'modeled',measure:'supported letter-sound recognition',prompt:'Find the little letter for the start of apple.',choices:['m','a'],answer:'a',
  hints:{m:'That is our closed-lip hum. Listen to the open sound at the start of apple.',a:'The new a makes the open sound at the start of apple.'},success:'The first catch holds the corner. Its loop still needs fastening.'},
 'choose-ant':{kind:'application',measure:'initial-sound discrimination',prompt:'Which picture starts with the same little sound as apple?',choices:['moon','ant'],answer:'ant',
  hints:{moon:'Moon starts with our hum. Listen to the beginning of ant.',ant:'Ant and apple begin with the same open little sound.'},success:'The cloth is fastened. The apple settles safely in the catcher.'},
 'blend-am':{kind:'model',measure:'supported blending',prompt:'Slide with Lark. Then say am if you like.',success:'We joined a and m: am. I am an apple catcher.'},
 'fit-map':{kind:'story',measure:'story participation',prompt:'Open the route box, then fit its piece into the apple-marked space.',success:'The orchard section is in place. Three spaces are still empty.'},
};
export const CHAPTER=[{adult:'I',child:'am',end:'an apple catcher.'}];
export function voiceParts(paragraph){
 const parts=[];let at=0,previous=null;
 for(const m of paragraph.matchAll(/“([^”]+)”/g)){
  if(m.index>at)parts.push({speaker:'narrator',text:paragraph.slice(at,m.index).trim()});
  const named=/^\s*(Lark|Nib)\b/.exec(paragraph.slice(m.index+m[0].length));
  const speaker=named?named[1].toLowerCase():previous||'narrator';parts.push({speaker,text:m[1]});previous=speaker;at=m.index+m[0].length;
 }
 if(at<paragraph.length)parts.push({speaker:'narrator',text:paragraph.slice(at).trim()});return parts.filter(p=>p.text);
}
