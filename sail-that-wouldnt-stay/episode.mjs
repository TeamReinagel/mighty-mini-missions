// Essential skill: planning-3. Check the steady wagon after the crew folds the sail and secures ballast.
export const EPISODE={id:'s1e3-sail-that-wouldnt-stay',gameId:'sail-that-wouldnt-stay',title:'The Sail That Wouldn’t Stay',season:'The Map Pieces',number:3,seasonNumber:1,version:'2026-11-03-cast-1',kid:'connor',targetMinutes:[8,10],introduced:['s'],taughtBefore:['m','a'],targets:['am'],review:['m','a'],completionItem:'sail-that-wouldnt-stay:episode-complete',treasure:'The sail journal page',nonReadingInteractions:1};
export const PASSAGE=[];
export const GATES={
 'review-am':{kind:'blend',category:'word reading',word:'am',prompt:'Read am. Slide its sounds, or read with Lark.',success:'Am. Our little word can travel with us.'},
 'new-s':{kind:'letters',category:'new sound',choices:['s','m'],answer:'s',phoneme:'s',supported:true,prompt:'Which letter makes the soft hiss we heard in the grass?',hints:{m:'That is our closed-lip hum. The new sound lets air hiss gently through.'},success:'Our soft hiss goes with s.'},
 'write-s':{kind:'writing',category:'writing',letter:'s',prompt:'Write s: curve round, then curve back.',success:'Your s curls across our journal page.'},
 'find-sack':{kind:'pictures',category:'sound application',choices:['mat','sack'],answer:'sack',phoneme:'s',prompt:'Listen: mat. Sack. Which starts with our soft hiss?',hints:{mat:'Mat begins with our hum. Listen to the beginning of sack.'},success:'Sack starts with our soft hiss. Lark brings it to the wagon.'},
 'fill-sack':{kind:'ballast',category:'story action',prompt:'Slide the sand up to the line on the sack.',success:'The sack is filled. Lark ties it low to the wagon.'},
 'check-story':{kind:'pictures',category:'comprehension',choices:['large-sail','small-sail'],answer:'small-sail',prompt:'Which sail helped our wagon stay steady?',hints:{'large-sail':'The huge cloth pulled sideways. Remember the smaller folded sail and the sand sack.'},success:'The small sail and low sand sack helped the wagon stay steady.'},
};
export const BEATS=[
 {id:'an-idea-in-the-breeze',scene:'woods',visual:'big-sail',paragraphs:[
 'The picnic cloth lay across the wagon. The apple catcher was behind you, and the first missing map section rested safely beside your original piece. The moonstone, rope, and journal were packed in the explorer case. Three spaces on the map were still empty.',
 'A breeze slipped through the hollow. The wagon’s pennant fluttered, and Nib’s idea grew taller than his ears.',
 '“A sail the size of the sky!” Nib announced grandly.',
 'He tied the picnic cloth to a light wooden mast while Lark set chocks beside the wheels. The wagon stayed parked on the broad, dry path. The cloth swelled above it like a very ambitious pillow.',
 '“A wagon the size of a mouse,” Lark replied cautiously. She held the rope and watched the cloth pull sideways.',
 'Nib opened the journal to the apple page. He pointed to the little word you had joined before.',
 '“I am a sailor,” Nib declared hopefully.',
 '“I’ll read the other words,” Lark offered warmly. “You can read am. Slide its two sounds, or join them with me.”'
 ],gate:'review-am'},
 {id:'a-sound-in-the-grass',scene:'woods',visual:'big-sail',paragraphs:[
 'The breeze grew stronger. Grass brushed against the wagon with a soft hiss. The wheels stayed snug beside their chocks, but the enormous sail tugged toward the side of the path.',
 'Nib gripped his scarf. He looked at the rope, then at Lark.',
 '“Perhaps the sky is a little large,” Nib admitted doubtfully.',
 '“We can make a smaller plan,” Lark replied calmly. She eased the rope until the cloth stopped pulling. Nobody climbed aboard.',
 'On the journal’s empty page, Lark drew a little curving letter. It bent one way, then the other: lowercase s.',
 '“Listen to the grass,” Lark invited softly. “Let a gentle stream of air make our soft hiss. No hum, and no extra little vowel. Listen to the sound, then find its letter.”'
 ],gate:'new-s',sound:'s'},
 {id:'a-small-curving-mark',scene:'woods',visual:'big-sail',paragraphs:[
 'Nib held the page flat on the explorer case. Lark drew the curving mark once more, slowly enough to follow.',
 '“It looks as if it knows a bend in the path,” Nib observed thoughtfully.',
 '“We’ll keep it beside today’s picture,” Lark suggested gently. “Curve round, then curve back. Write our new s.”'
 ],gate:'write-s'},
 {id:'something-under-the-shelter',scene:'woods',visual:'big-sail',paragraphs:[
 'Beside the path, a low supply shelter held a folded mat and an empty cloth sack. A shallow patch of dry sand lay nearby. Lark named both objects aloud. Mat. Sack.',
 'Nib considered sitting on the mat until the wind changed its mind. Then he looked at the empty sack, the sand, and the wagon’s low frame.',
 '“Something small could help something tall,” Nib murmured hopefully.',
 '“Let’s begin with the sound,” Lark invited warmly. “Mat. Sack. Which one starts with the soft hiss we just learned?”'
 ],gate:'find-sack'},
 {id:'a-sack-with-a-job',scene:'woods',visual:'big-sail',paragraphs:[
 'Lark brought the sack to a flat spot beside the wagon. She folded its top outward so the opening stayed wide. A stitched line showed how much sand it needed. The sack would rest low against the frame, with a rope loop to hold it.',
 'Nib scooped a little sand into it. The base spread into a soft, sturdy shape.',
 '“A sensible sack,” Nib declared approvingly. “It knows where the ground is.”',
 '“Fill it just to the stitched line,” Lark encouraged gently. “Then I’ll secure its loop. The wagon will keep waiting while we work.”'
 ],gate:'fill-sack'},
 {id:'less-sail-more-sense',scene:'woods',visual:'small-sail',paragraphs:[
 'The filled sack settled low beside the explorer case. Lark fastened its loop to the wagon’s frame. Nib folded the enormous cloth down and tied it into a small sail. Every fold made the mast look less surprised.',
 'The next breeze pressed against the little triangle. Lark tested the rope. The sack stayed low. The wheels stayed level. The small sail helped without pulling the parked wagon sideways.',
 'Nib studied his first enormous plan, now folded into something useful.',
 '“Still splendid,” Nib decided contentedly. “Just less sky.”',
 'Lark showed the two versions in the journal: the great billowing cloth, and the small folded sail beside the low sand sack.',
 '“Which sail helped our wagon stay steady?” Lark asked gently.'
 ],gate:'check-story'},
 {id:'up-to-the-ridge',scene:'ridge',visual:'small-sail',paragraphs:[
 'With the test finished, Lark removed the chocks. Nib took the handle while Lark guided the rope. Together, they brought the wagon up the broad path. The little sail helped when the breeze followed them. When it did not, your friends simply pulled.',
 'At the ridge waystation, they parked beneath the shelter and set the chocks beside the wheels again. The case was safe. The first map piece was safe. Nothing new had been added to the map.',
 'Lark drew the little sail and the sand sack on your next journal page. Your new s curled beside the picture. She read the connecting words aloud, and you could join am again whenever you wanted.',
 '“Small sail. Sensible sack. Splendid sailing,” Nib murmured with satisfaction.',
 'A soft tapping came from beneath the roof. Nib put one paw on the little table. Its far end rose a tiny way, then settled with another tap.',
 '“That table has an idea, too,” Nib whispered suspiciously.',
 'Lark smiled and set the journal safely on the flat floor. The wagon was steady, the windy hollow was behind you, and the tapping table could wait for your next adventure.'
 ]}
];
