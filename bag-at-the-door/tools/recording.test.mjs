import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {validateRecording} from '../recording.mjs';
import {voiceParts,BEATS} from '../episode.mjs';
const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url)));
const manifest=read('../recording.json'),plan=read('./narration-alignment.json'),audit=read('./recording-audit.json');
test('The supplied recording passes validation and covers the full source once',()=>{
 assert.deepEqual(validateRecording(manifest),[]);assert.equal(Object.keys(manifest.entries).length,56);
 assert.equal(Object.values(manifest.entries)[0].sourceStart,0);assert.equal(Object.values(manifest.entries).at(-1).sourceEnd,manifest.sourceDuration);
 assert(Math.abs(audit.sourceCoverageSeconds-manifest.sourceDuration)<1e-8);
 assert.equal(manifest.sourceSHA256,'eecde67d0c38ae67b69d5d8fb0910fdbc26f4564a1f10e74a58cb51d0fd65fed');
});
test('All 55 physical cuts fall in measured quiet, and all five prompts end before their consequences',()=>{
 assert.equal(plan.boundaries.length,55);
 for(const b of plan.boundaries){assert(b.quietInterval.start<b.cut&&b.cut<b.quietInterval.end);assert.equal(manifest.entries[b.after].sourceEnd,b.cut);assert.equal(manifest.entries[b.before].sourceStart,b.cut);}
 assert.deepEqual(plan.boundaries.filter(b=>b.gate).map(b=>b.gate),['review-map','model-pad','find-pad','free-strap','pack-invitations']);
 for(const b of plan.boundaries.filter(b=>b.gate)){const p=plan.paragraphs.find(p=>p.id===b.after),next=plan.paragraphs.find(p=>p.id===b.before);assert(plan.words[p.wordEnd-1].end<=b.cut);assert(plan.words[next.wordStart].start>=b.cut);}
});
test('Every encoded clip matches the decoded-duration audit and saved file hash',()=>{
 assert.equal(audit.clips.length,56);
 for(const c of audit.clips){const data=fs.readFileSync(new URL('../'+c.file,import.meta.url));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),c.sha256);assert(Math.abs(c.decodedDuration-c.expectedDuration)<=2/44100);}
});
test('A missing source range, changed manuscript, repeated clip or invalid caption cannot enable the recording',()=>{
 for(const change of [m=>{Object.values(m.entries)[2].sourceStart+=.5;},m=>{m.manuscriptSHA256='0'.repeat(64);},m=>{Object.values(m.entries)[2].file=Object.values(m.entries)[1].file;},m=>{Object.values(m.entries)[0].cues[0].start=-1;}]){const m=structuredClone(manifest);change(m);assert(validateRecording(m).length>0);}
});
test('Continued quotations animate the named character while attributions stay with the narrator',()=>{
 assert.deepEqual(voiceParts('“We found a library,” Lark declared delightedly. “Now we need readers!”').map(p=>p.speaker),['lark','narrator','lark']);
 const cues=manifest.entries['a-library-to-share:p2'].cues;
 assert(cues.some(c=>c.speaker==='lark'&&c.text==='Now we need readers!'));assert(cues.some(c=>c.speaker==='narrator'&&c.text==='Lark declared delightedly.'));
});
test('Captions preserve the recorded title and explicitly document wording differences without changing the authored story',()=>{
 assert.equal(Object.values(manifest.entries)[0].cues[0].text,'The Bag at the Door.');
 assert.equal(manifest.recordingDifferences.length,3);
 assert(!manifest.entries['check-the-three-deliveries:p1'].cues.some(c=>c.text.includes('You did not need')));
 assert(BEATS.find(b=>b.id==='check-the-three-deliveries').paragraphs[0].includes('You did not need'));
});
