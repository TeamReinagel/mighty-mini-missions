import test from 'node:test';
import assert from 'node:assert/strict';
import {BEATS,EPISODE,GATES,voiceParts} from '../episode.mjs';
import {freshState,restore,respond,completeGate,addHelp,canFinish,canReport,targetsAreDecodable} from '../logic.mjs';
import {WORDS} from '../reading.mjs';
import {validateRecording} from '../recording.mjs';
test('Opening inherits Season 1 and every child target uses only introduced mappings',()=>{
 assert.deepEqual(EPISODE.taughtBefore,['m','a','s','t','p','i','n','r']);assert.deepEqual(EPISODE.introduced,['d']);assert.equal(targetsAreDecodable(),true);
 for(const w of [...EPISODE.targets,...EPISODE.review])assert(WORDS[w]);
 assert(BEATS[0].paragraphs.join(' ').includes('Nothing was missing today'));
});
test('The five gate cuts follow their prompts and the story ends with all invitations still outbound',()=>{
 assert.equal(BEATS.filter(b=>b.gate).length,5);assert.deepEqual(BEATS.filter(b=>b.gate).map(b=>b.gate),Object.keys(GATES));
 assert(BEATS.at(-1).paragraphs.join(' ').includes('all three invitations safe'));
 assert(BEATS.at(-1).paragraphs.join(' ').includes('fish’s fin'));
});
test('Recognition after the pad model is supported transfer and cannot become independent decoding',()=>{
 const s=freshState();const result=respond(s,'find-pad','pad');assert.equal(result.attempt.correct,null);assert.equal(result.attempt.supported,true);assert.equal(result.correct,true);
});
test('A miss is one first response, then a useful supported retry rather than a second first try',()=>{
 const s=freshState();assert.equal(respond(s,'review-map','mat').attempt.correct,false);addHelp(s,'review-map');assert.equal(respond(s,'review-map','map').attempt,null);assert.equal(s.attempts.length,1);
});
test('Using the slider before a review answer records support',()=>{
 const s=freshState();addHelp(s,'review-map');assert.equal(respond(s,'review-map','map').attempt.correct,null);
});
test('Finishing and reporting require all gates, the final story beat, a real child, and an approved recording',()=>{
 const s=freshState();s.beat=BEATS.length-1;s.finished=true;assert.equal(canFinish(s),false);
 for(const id of Object.keys(GATES))completeGate(s,id);assert.equal(canFinish(s),true);
 assert.equal(canReport(s,{child:'connor',review:false,recordingReady:false}),false);
 assert.equal(canReport(s,{child:'connor',review:true,recordingReady:true}),false);
 assert.equal(canReport(s,{child:null,review:false,recordingReady:true}),false);
 assert.equal(canReport(s,{child:'connor',review:false,recordingReady:true}),true);
 s.reviewed=true;assert.equal(canReport(s,{child:'connor',review:false,recordingReady:true}),false);
});
test('Malformed bookmarks cannot open a completed episode or retain another version',()=>{
 assert.equal(restore({version:EPISODE.version,beat:999,completed:[],finished:true}).finished,false);
 assert.equal(restore({version:'old',beat:5}).beat,0);
 assert.deepEqual(restore({version:EPISODE.version,packed:['hut','hut','unknown']}).packed,['hut']);
});
test('Short vowel CVC words have three sound positions and no invented annotation',()=>{
 for(const w of Object.values(WORDS)){assert.equal(w.chunks.length,3);assert.equal(w.sight,false);assert(w.chunks.every(c=>c.mark==='plain'));}
});
test('Voice casting preserves quoted dialogue and its descriptive narrator attribution',()=>{
 assert.deepEqual(voiceParts('“Don’t drag it,” Lark urged gently.'),[{speaker:'lark',text:'Don’t drag it,'},{speaker:'narrator',text:'Lark urged gently.'}]);
 const source=BEATS.flatMap(b=>b.paragraphs);assert(source.filter(p=>p.includes('“')).every(p=>voiceParts(p).some(x=>['lark','nib'].includes(x.speaker))));
});
test('An unaligned recording cannot silently enable production reporting',()=>{
 assert(validateRecording({approved:false,entries:{}}).length>0);
 assert(validateRecording({approved:true,status:'approved',entries:{}}).some(e=>e.includes('hash')));
});
