import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {validateProductionRecording} from '../recording.mjs';
const cases=[
 {slug:'fan-at-the-fork',label:'S2E2',clips:36,samples:17257007,sha:'b52383ce8c74f9feffd4370604143c7f049dfbe2bbaf2021f36c7ce2de323529',title:'The Fan at the Fork.',episode:'Season 2. Episode 2.',first:'The library door',bodyAt:6.08},
 {slug:'sail-that-wouldnt-stay',label:'S1E3',clips:38,samples:16720666,sha:'42df828e562acba46dce5771f1aa3bce4173f7841f1a1d7b87acd3a97b91156f',title:'The Sail That Wouldn’t Stay.',episode:'Season 1. Episode 3.',first:'The picnic cloth',bodyAt:6.6},
];
for(const spec of cases){
const {BEATS,GATES}=await import(`../../../${spec.slug}/episode.mjs`);
const base=new URL(`../../../${spec.slug}/`,import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(new URL(name,base)));
const cast=read('recording.json'),plan=read('tools/narration-alignment.json'),audit=read('tools/recording-audit.json');
test(`${spec.label}: supplied recording validates against all manuscript paragraphs`,()=>{
 assert.deepEqual(validateProductionRecording(cast,BEATS),[]);assert.equal(cast.sourceSHA256,spec.sha);assert.equal(Object.keys(cast.entries).length,spec.clips);assert.equal(cast.manuscriptSHA256,read('recording.template.json').manuscriptSHA256);
});
test(`${spec.label}: Decoded clips match their saved hashes and cover all source samples once in order`,()=>{
 let end=0,total=0;const files=new Set();
 for(const [id,e]of Object.entries(cast.entries)){
  assert.equal(e.sourceStart,end);end=e.sourceEnd;const frames=Math.round(e.duration*44100);total+=frames;assert(!files.has(e.file));files.add(e.file);
  const check=audit.clips.find(c=>c.id===id);assert(check);assert.equal(Math.round(check.decodedDuration*44100),frames);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(e.file,base))).digest('hex'),check.sha256);
 }
 assert.equal(end,cast.sourceDuration);assert.equal(total,spec.samples);assert.equal(total,Math.round(cast.sourceDuration*44100));
});
test(`${spec.label}: All physical cuts remain within measured silence, including all task pauses`,()=>{
 assert.equal(plan.boundaries.length,spec.clips-1);assert.deepEqual(plan.boundaries.filter(b=>b.gate).map(b=>b.gate),Object.keys(GATES));
 for(const b of plan.boundaries){assert(b.cut>b.quietInterval.start&&b.cut<b.quietInterval.end);const left=cast.entries[b.after],right=cast.entries[b.before];assert.equal(left.sourceEnd,b.cut);assert.equal(right.sourceStart,b.cut);assert(left.cues.every(c=>c.end<=left.duration+.00001));}
});
test(`${spec.label}: The spoken title, series and episode introduction are retained before the first story sentence`,()=>{
 const first=Object.values(cast.entries)[0];assert.equal(first.sourceStart,0);assert.equal(first.cues[0].text,spec.title);assert(first.cues.some(c=>c.text==='Lark and Nib’s Treasure Quest.'));assert(first.cues.some(c=>c.text===spec.episode));assert(first.cues.find(c=>c.text.startsWith(spec.first)).start>=spec.bodyAt);
});
test(`${spec.label}: Mismatched source ranges, duplicate media or invalid caption bounds reject cast playback`,()=>{
 const ids=Object.keys(cast.entries);
 for(const mutate of [m=>m.entries[ids[1]].sourceStart+=.1,m=>m.entries[ids[1]].file=m.entries[ids[0]].file,m=>m.entries[ids[0]].cues[0].end=999,m=>delete m.sourceSHA256]){const m=structuredClone(cast);mutate(m);assert(validateProductionRecording(m,BEATS).length>0);}
});
test(`${spec.label}: The player selects valid supplied audio and keeps the existing support recordings`,async()=>{
 const {EpisodeAudio}=await import('../audio.mjs');const previousAudio=globalThis.Audio,previousFetch=globalThis.fetch;
 class FakeAudio{addEventListener(){}removeEventListener(){}pause(){}load(){}}
 globalThis.Audio=FakeAudio;globalThis.fetch=async url=>({ok:true,json:async()=>structuredClone(String(url).includes('preview-recording')?read('preview-recording.json'):cast)});
 try{const voice=new EpisodeAudio({base,beats:BEATS});await voice.load();assert.equal(voice.recording.approved,true);assert.equal(voice.recording.sourceDuration,cast.sourceDuration);assert(voice.recording.support.am);}finally{globalThis.Audio=previousAudio;globalThis.fetch=previousFetch;}
});
test(`${spec.label}: The player falls back to unapproved preview audio when a cast source range is damaged`,async()=>{
 const {EpisodeAudio}=await import('../audio.mjs');const previousAudio=globalThis.Audio,previousFetch=globalThis.fetch;class FakeAudio{addEventListener(){}removeEventListener(){}pause(){}load(){}}
 const broken=structuredClone(cast);Object.values(broken.entries)[2].sourceEnd+=1;globalThis.Audio=FakeAudio;globalThis.fetch=async url=>({ok:true,json:async()=>structuredClone(String(url).includes('preview-recording')?read('preview-recording.json'):broken)});
 try{const voice=new EpisodeAudio({base,beats:BEATS});await voice.load();assert.equal(voice.recording.approved,false);assert.equal(voice.recording.status,'local-preview');}finally{globalThis.Audio=previousAudio;globalThis.fetch=previousFetch;}
});

}
