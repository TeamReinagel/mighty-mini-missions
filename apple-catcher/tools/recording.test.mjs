import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {validateRecording} from '../recording.mjs';
import {EPISODE} from '../episode.mjs';
const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url)));
const manifest=read('../recording.json'),plan=read('./narration-alignment.json'),audit=read('./recording-audit.json');
const tokens=s=>s.toLowerCase().replaceAll('’',"'").match(/[a-z0-9]+(?:'[a-z]+)?/g)||[];
test('The Apple Catcher recording covers the supplied source exactly once',()=>{
 assert.deepEqual(validateRecording(manifest),[]);assert.equal(Object.keys(manifest.entries).length,36);
 assert.equal(Object.values(manifest.entries)[0].sourceStart,0);assert.equal(Object.values(manifest.entries).at(-1).sourceEnd,manifest.sourceDuration);
 assert(Math.abs(audit.sourceCoverageSeconds-manifest.sourceDuration)<1e-8);
 assert.equal(manifest.sourceSHA256,'9fd6616328369f95accd7af8a3388b4e33b677005491bee399a7cafe57662a6f');
});
test('All 35 cuts are quiet and the five child turns precede their consequences',()=>{
 assert.equal(plan.boundaries.length,35);
 for(const b of plan.boundaries){assert(b.quietInterval.start<b.cut&&b.cut<b.quietInterval.end);assert(b.quietInterval.duration>=.1);assert.equal(manifest.entries[b.after].sourceEnd,b.cut);assert.equal(manifest.entries[b.before].sourceStart,b.cut);}
 assert.deepEqual(plan.boundaries.filter(b=>b.gate).map(b=>b.gate),['review-m','find-a','choose-ant','blend-am','fit-map']);
 assert.deepEqual(Object.values(manifest.entries).flatMap((e,i)=>e.gateAfter?[i+1]:[]),[6,14,17,24,26]);
 for(const b of plan.boundaries){const p=plan.paragraphs.find(p=>p.id===b.after),next=plan.paragraphs.find(p=>p.id===b.before);assert(plan.words[p.wordEnd-1].end<=b.cut);assert(plan.words[next.wordStart].start>=b.cut);}
});
test('The encoded clips match independently decoded durations and saved hashes',()=>{
 assert.equal(audit.clips.length,36);
 for(const c of audit.clips){const data=fs.readFileSync(new URL('../'+c.file,import.meta.url));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),c.sha256);assert(Math.abs(c.decodedDuration-c.expectedDuration)<=2/44100);}
});
test('Changed source ranges, manuscript, reused files or invalid cues cannot enable playback',()=>{
 for(const change of [m=>{Object.values(m.entries)[2].sourceStart+=.5;},m=>{m.manuscriptSHA256='0'.repeat(64);},m=>{Object.values(m.entries)[2].file=Object.values(m.entries)[1].file;},m=>{Object.values(m.entries)[0].cues[0].start=-1;}]){const m=structuredClone(manifest);change(m);assert(validateRecording(m).length>0);}
});
test('Timed captions cover the story and spoken title without altering the authored text',()=>{
 for(const [id,e]of Object.entries(manifest.entries)){
  const cues=id===plan.paragraphs[0].id?e.cues.slice(plan.preambleCues.length):e.cues;
  assert.deepEqual(tokens(cues.map(c=>c.text).join(' ')),tokens(e.spokenText));assert.equal(e.text,e.spokenText);
 }
 assert.equal(Object.values(manifest.entries)[0].cues[0].text,'The Apple Catcher.');
 assert.deepEqual(manifest.recordingDifferences,[]);
 const cues=manifest.entries['two-marks-one-loop:p3'].cues;
 assert(cues.some(c=>c.speaker==='lark'&&c.text==='Then fasten the loop before you let an apple down.'));
 assert(cues.some(c=>c.speaker==='narrator'&&c.text==='Lark asked clearly.'));
});
test('The separate short-a demonstration survives main narration integration',()=>{
 const id='the-start-of-apple:p2';assert.equal(EPISODE.soundModels[id],'a');assert.equal(manifest.entries[id].soundAfter,'a');
 const app=fs.readFileSync(new URL('../app.mjs',import.meta.url),'utf8');assert(app.includes('await voice.sound(EPISODE.soundModels[id])'));
});
