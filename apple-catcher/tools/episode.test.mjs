import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {EPISODE,BEATS,GATES,voiceParts} from '../episode.mjs';
import {freshState,restore,respond,addHelp,completeGate,releaseApple,placeMap,canFinish,canReport,targetsAreDecodable} from '../logic.mjs';
import {WORDS} from '../reading.mjs';import {validateRecording} from '../recording.mjs';import {sceneAnchors} from '../stage.mjs';
test('Episode 2 continues Moon Path and introduces only short a before its first word am',()=>{
 assert.deepEqual(EPISODE.taughtBefore,['m']);assert.deepEqual(EPISODE.introduced,['a']);assert.deepEqual(EPISODE.targets,['am']);assert(targetsAreDecodable());
 const text=BEATS.flatMap(b=>b.paragraphs).join(' ');assert(text.includes('moonstone adventure'));assert(text.includes('crooked root'));assert(text.includes('three spaces still waiting'));assert(text.includes('windy hollow'));assert(text.includes('pennant'));
 assert.deepEqual(WORDS.am.chunks.map(c=>c.sound),['a','m']);assert(WORDS.am.chunks.every(c=>c.mark==='plain'));assert.equal(WORDS.am.sight,false);
});
test('The five gates preserve review, new sound, application, first blending, and map handoff',()=>{
 assert.deepEqual(BEATS.filter(b=>b.gate).map(b=>b.gate),['review-m','find-a','choose-ant','blend-am','fit-map']);
 assert.equal(EPISODE.soundModels['the-start-of-apple:p2'],'a');assert.equal(BEATS.findIndex(b=>b.gate==='review-m')<BEATS.findIndex(b=>b.id==='the-start-of-apple'),true);
 assert.match(BEATS.find(b=>b.gate==='choose-ant').paragraphs[1],/ant and moon/);
});
test('The first m response is recognition evidence; a retry after support is not a new first try',()=>{
 const s=freshState();assert.equal(respond(s,'review-m','a').attempt.correct,false);addHelp(s,'review-m');assert.equal(respond(s,'review-m','m').attempt,null);assert.equal(s.attempts.length,1);
 const helped=freshState();addHelp(helped,'review-m');assert.equal(respond(helped,'review-m','m').attempt.correct,null);
});
test('The just-modeled a catch is supported while the unhinted ant choice measures only initial sounds',()=>{
 assert.equal(respond(freshState(),'find-a','a').attempt.correct,null);
 const r=respond(freshState(),'choose-ant','ant').attempt;assert.equal(r.correct,true);assert.equal(r.measure,'initial-sound discrimination');assert.equal(r.supported,false);
 const s=freshState();assert.equal(respond(s,'choose-ant','unknown'),null);assert.equal(s.attempts.length,0);
});
test('An early release is safe and cannot complete the repair; fastening must come first',()=>{
 const s=freshState();s.firstCatch=true;s.chosenMark=true;assert.equal(releaseApple(s),false);assert.equal(s.applesReleased,false);assert.equal(completeGate(s,'choose-ant'),false);
 s.loopFastened=true;assert.equal(releaseApple(s),true);assert.equal(completeGate(s,'choose-ant'),true);assert.equal(completeGate(s,'choose-ant'),false);
});
test('Opening the box, choosing a real target, and placing the section are required for the map gate',()=>{
 const s=freshState();assert.equal(placeMap(s,true),false);s.boxOpen=true;assert.equal(placeMap(s,false),false);assert.equal(completeGate(s,'fit-map'),false);
 assert.equal(placeMap(s,true),true);assert.equal(completeGate(s,'fit-map'),true);
});
test('Only the complete ending can report, and device narration, preview, and scene jumps cannot',()=>{
 const s=freshState();s.firstCatch=true;s.loopFastened=true;s.applesReleased=true;s.modelCompleted=true;s.boxOpen=true;s.mapPlaced=true;for(const id of Object.keys(GATES))completeGate(s,id);
 assert.equal(canFinish(s),false);s.beat=BEATS.length-1;s.finished=true;assert(canFinish(s));
 assert.equal(canReport(s,{child:'connor',review:false,recordingReady:false}),false);assert.equal(canReport(s,{child:'connor',review:true,recordingReady:true}),false);assert.equal(canReport(s,{child:'guest',review:false,recordingReady:true}),false);assert.equal(canReport(s,{child:'connor',review:false,recordingReady:true}),true);
 s.reviewed=true;assert.equal(canReport(s,{child:'connor',review:false,recordingReady:true}),false);
});
test('Corrupt or older bookmarks cannot invent a complete catcher, model, or collected map',()=>{
 const s=restore({version:EPISODE.version,beat:999,paragraph:-4,completed:Object.keys(GATES),attempts:[null],finished:true});assert.equal(s.beat,0);assert.equal(s.paragraph,0);assert.equal(s.finished,false);assert.equal(s.mapPlaced,false);assert.deepEqual(s.attempts,[]);
 assert.equal(restore({version:'s2e1',beat:3}).beat,0);
});
test('Continued quoted speech stays with the character and spoken performance attributions stay narrated',()=>{
 assert.deepEqual(voiceParts('“An investigation,” Nib explained solemnly. “I had to find out.”').map(p=>p.speaker),['nib','narrator','nib']);
 for(const p of BEATS.flatMap(b=>b.paragraphs))for(const q of p.matchAll(/“([^”]+)”/g))assert(voiceParts(p).some(part=>part.text===q[1]&&['lark','nib'].includes(part.speaker)),q[1]);
});
test('This episode has its own incomplete recording handoff and cannot accept the other episode’s timing',()=>{
 const m=JSON.parse(fs.readFileSync(new URL('../recording.template.json',import.meta.url)));assert.equal(Object.keys(m.entries).length,36);assert.equal(m.approved,false);assert(validateRecording(m).length>0);assert.equal(m.entries['our-old-hum:p2'].gateAfter,'review-m');
});
test('Character centers remain outside the catcher and share its physical floor on tablet and phone',()=>{
 for(const w of [390,820]){const h=w*940/1672,a=sceneAnchors(w,h);assert(a.larkX+h*.12<a.catcherX-a.catcherWidth/2);assert(a.nibX-h*.12>a.catcherX+a.catcherWidth/2);assert.equal(a.floor,h*.88);}
});
