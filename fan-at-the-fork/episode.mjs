// Essential skill: listening-1. Use the whole spoken/printed clue to choose the fork.
export const EPISODE={id:'s2e2-fan-at-the-fork',gameId:'fan-at-the-fork',title:'The Fan at the Fork',season:'Through the Woods',number:2,seasonNumber:2,version:'2026-11-03-cast-1',kid:'gabi',targetMinutes:[9,11],introduced:['f'],taughtBefore:['m','a','s','t','p','i','n','r','d'],targets:['fan','fin','fit'],review:['am','pad'],completionItem:'fan-at-the-fork:episode-complete',treasure:'The fork journal page',nonReadingInteractions:0};
export const PASSAGE=['Sam ran.','Sam sat.','Pip did fan Sam.','Pip sat.'];
export const GATES={
 'review-am':{kind:'blend',category:'word reading',word:'am',prompt:'Read am. Slide the sounds, or read with Lark.',success:'Our little word is still with us.'},
 'new-f':{kind:'letters',category:'new sound',choices:['m','f'],answer:'f',supported:true,phoneme:'f',prompt:'Which letter makes the soft air sound at the start of fan?',hints:{m:'That is our closed-lip hum. Let air pass between your top teeth and lower lip.'},success:'The soft air sound goes with f.'},
 'choose-fin':{kind:'words',category:'word reading',choices:['fan','fin'],answer:'fin',supported:true,prompt:'Read both labels. Find fin for our route.',hints:{fan:'Keep f and n. Listen to the middle: the short i in pin.'},success:'Fin. The fish waymarker shows our route.'},
 'write-f':{kind:'writing',category:'writing',letter:'f',prompt:'Write f: curve over, down, then across.',success:'Your f is on the courier page.'},
 'find-fit':{kind:'words',category:'word reading',choices:['fit','fin'],answer:'fit',prompt:'Read the whole word. Find fit.',hints:{fin:'That ends with n. Listen to the quick t at the end of fit.'},success:'Fit. The strap lies flat without a twist.'},
 'read-note':{kind:'sentences',category:'sentence reading',prompt:'Read Nib’s small story. S and s, and P and p, make the same little sounds.',success:'You reached the end of the little story.'},
 'check-note':{kind:'words',category:'comprehension',choices:['Sam','Pip'],answer:'Pip',prompt:'Who used the fan in the little story?',hints:{Sam:'Read the sentence with fan again. Who did fan Sam?'},reread:true,success:'Pip used the fan. Sam had been running.'},
};
export const BEATS=[
 {id:'a-bag-that-travels',scene:'woods',visual:'bag',paragraphs:[
 'The library door was behind you now. Nib’s courier bag swung gently against his scarf. Its strap wore the soft pad from your first delivery adventure. Inside, three invitations rested in three separate pockets. Reed Hut, the Mill, and Fern Lodge were still waiting for their letters.',
 '“A dependable bag,” Nib declared proudly. He inspected the doorway tag once more, although the doorway was already far away.',
 '“And a whole woodland ahead,” Lark replied brightly. She opened the route book on a flat stone. Its first direction named the fork beneath the ferns. You followed a dry path, with the bag between your friends.',
 'Nib’s steps grew brisk. He was eager to make the first delivery. Lark paused beside a familiar little word on the first journal page.',
 '“Before our new clue, here is a word we already know,” Lark invited gently. “Read am. Slide its two sounds if you want to.”'
 ],gate:'review-am'},
 {id:'two-important-posts',scene:'woods',visual:'markers',paragraphs:[
 'At the fork stood two wooden posts. One held a carved fish, with a splendid fin rising from its back. The other carried a small wooden fan. Four broad blades turned whenever the breeze slipped between the trees.',
 'Nib watched the fan turn. He took a step toward its path.',
 '“Very lively directions,” Nib remarked approvingly. “That one must be important.”',
 '“It is moving,” Lark observed thoughtfully. “But movement doesn’t tell us which path the book names.”',
 'She rested the open book on the stone. Both little labels began with the same new letter: f. Lark showed its tall curved line and its short line across.',
 '“Listen to the start of fan,” Lark invited softly. “Touch your top teeth to your lower lip. Let the air flow gently. No hum, and no extra little vowel. Listen to our sound, then find its letter.”'
 ],gate:'new-f',sound:'f'},
 {id:'a-small-middle-matters',scene:'woods',visual:'markers',paragraphs:[
 'Lark set f beside the a and n you knew. She joined the sounds into fan. Then she changed just the middle letter. The little i from pin made fin.',
 'Nib looked from one label to the other. The beginnings matched. So did the endings. Only the small middle was different.',
 '“I nearly followed the biggest moving thing,” Nib admitted sheepishly.',
 '“We can read the whole word,” Lark reminded him warmly. “Our book names fin. Read both labels, and choose fin for our route.”'
 ],gate:'choose-fin'},
 {id:'the-quiet-marker',scene:'woods',visual:'fin',paragraphs:[
 'The little i settled the question. Lark pointed to the fish’s fin. Its path curved around the fern bank, away from the fan’s short viewing alcove. The crew stayed on dry ground. No one needed to cross the creek here.',
 'Nib gave the fan a courteous bow before leaving.',
 '“Excellent spinning,” Nib told it sincerely. “Different destination.”',
 'At a low resting stone, Lark opened your courier journal. She drew the fish post and left space beneath it for the new letter.',
 '“We can keep our f beside today’s clue,” Lark suggested gently. “Curve over, go down, then add the short line across. Write f on our page.”'
 ],gate:'write-f'},
 {id:'a-flat-strap',scene:'woods',visual:'bag',paragraphs:[
 'Nib lowered the bag onto the dry path before adjusting its strap. One edge had folded over near the soft pad. He smoothed the fold instead of tugging at it.',
 'Lark watched the strap settle flat. The bag still had room for every invitation. A tiny word on the journal’s checking strip ended with t. Nib studied it carefully.',
 '“Our last sound matters, too,” Nib remembered proudly.',
 '“It does,” Lark agreed warmly. “Read the whole little word. Find fit.”'
 ],gate:'find-fit'},
 {id:'a-story-for-the-rest',scene:'woods',visual:'bag',paragraphs:[
 'The strap fitted comfortably again. Lark rested while Nib drew a very small story on the spare half of the page. His drawings showed two little mice called Sam and Pip, and a hand fan.',
 '“A story about a fan,” Nib announced contentedly. “A fan that has no opinions about directions.”',
 'Lark showed you the names before the reading. Capital S made the same sound as little s. Capital P made the same sound as little p. You already knew every sound in the words below.',
 '“You can read this part yourself,” Lark invited gently. “Take each sentence in turn. Let your finger follow underneath, and tap a word if you want help.”'
 ],gate:'read-note'},
 {id:'what-the-page-tells',scene:'woods',visual:'bag',paragraphs:[
 'The little story had running, resting, and a helpful fan. Nib looked at his picture again. This time the picture could wait. The words told who had done each job.',
 '“Who used the fan in our little story?” Lark asked gently. “You can look back at the sentences.”'
 ],gate:'check-note'},
 {id:'the-pot-beside-the-water',scene:'creek',visual:'bag',paragraphs:[
 'Lark tucked the finished fork page into the route book. No new map section appeared. You had something more useful for today: the right path, a comfortable strap, and a clear record of the way you came.',
 'The ferns thinned. Ahead, the creek flashed between pale stones. The path ended on a broad dry bank. A little clay pot stood on a low stump, and a reed-roofed hut waited across the water.',
 '“Our first stop is getting nearer,” Lark murmured eagerly.',
 'Nib counted the bag’s pockets with one careful paw. Three invitations. All safe. None delivered yet.',
 '“First fork found,” Nib declared proudly. “First delivery still to come.”',
 'A breeze stirred the reeds. Behind you, the wooden fan kept turning beside its own path. Ahead, the quiet little pot held the next clue.'
 ]}
];
