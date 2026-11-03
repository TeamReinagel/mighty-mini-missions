import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {initialState,restoreState,answer,settle,markHelp,canFinish,canReport,decodable} from '../state.mjs';
for(const slug of ['fan-at-the-fork','sail-that-wouldnt-stay']){
 const {EPISODE,BEATS,GATES,PASSAGE}=await import(`../../../${slug}/episode.mjs`);
 const base=new URL(`../../../${slug}/`,import.meta.url);
 test(`${slug}: exact cumulative sound scope and the required literacy core`,()=>{
  assert.deepEqual(EPISODE.introduced,EPISODE.seasonNumber===1?['s']:['f']);
  for(const text of [...EPISODE.targets,...PASSAGE])assert(decodable(text,EPISODE),text);
  const categories=new Set(Object.values(GATES).map(g=>g.category));for(const category of ['new sound','word reading','writing','comprehension'])assert(categories.has(category));
  if(EPISODE.seasonNumber===2){assert(PASSAGE.length>=2);assert(categories.has('sentence reading'));}
  assert(Object.values(GATES).filter(g=>g.category==='story action').length<=1);
  assert.deepEqual(BEATS.filter(b=>b.gate).map(b=>b.gate),Object.keys(GATES));
 });
 test(`${slug}: a wrong choice earns one first response, with supported retries kept separate`,()=>{
  const id=Object.keys(GATES).find(id=>GATES[id].choices&&!GATES[id].supported),g=GATES[id],s=initialState(EPISODE),wrong=g.choices.find(v=>v!==g.answer);
  assert.equal(answer(s,id,'invented',GATES),null);assert.equal(answer(s,id,wrong,GATES).attempt.correct,false);assert.equal(answer(s,id,g.answer,GATES).attempt,null);assert.equal(s.attempts.length,1);assert(s.helped.includes(id));
  const helped=initialState(EPISODE);markHelp(helped,id);assert.equal(answer(helped,id,g.answer,GATES).attempt.correct,null);
 });
 test(`${slug}: finishing a task persists the automatic continuation and rejects a duplicate`,()=>{
  const s=initialState(EPISODE),id=Object.keys(GATES)[0];s.activeGate=id;assert.equal(settle(s,id,GATES),true);assert.equal(settle(s,id,GATES),false);
  const restored=restoreState(s,EPISODE,BEATS,GATES);assert.equal(restored.pendingNext,id);assert.equal(restored.activeGate,null);assert.deepEqual(restored.completed,[id]);
 });
 test(`${slug}: the real ending and all literacy tasks are required; preview audio never earns completion`,()=>{
  const s=initialState(EPISODE);s.beat=BEATS.length-1;s.finished=true;assert.equal(canFinish(s,BEATS,GATES),false);for(const id of Object.keys(GATES))settle(s,id,GATES);assert(canFinish(s,BEATS,GATES));
  assert.equal(canReport(s,{child:EPISODE.kid,review:false,recording:{approved:false,status:'local-preview'}},BEATS,GATES),false);
  assert.equal(canReport(s,{child:EPISODE.kid,review:false,recording:{approved:true,status:'approved'}},BEATS,GATES),true);s.previewOnly=true;assert.equal(canReport(s,{child:EPISODE.kid,review:false,recording:{approved:true,status:'approved'}},BEATS,GATES),false);s.previewOnly=false;s.reviewed=true;assert.equal(canReport(s,{child:EPISODE.kid,review:false,recording:{approved:true,status:'approved'}},BEATS,GATES),false);
 });
 test(`${slug}: preview clips cover every paragraph with valid speaker cues and matching audio hashes`,()=>{
  const m=JSON.parse(fs.readFileSync(new URL('preview-recording.json',base)));assert.equal(m.approved,false);assert.equal(m.status,'local-preview');let total=0;
  for(const b of BEATS)for(const [i,text]of b.paragraphs.entries()){
   const clip=m.entries[`${b.id}:p${i+1}`];assert.equal(clip.text,text);assert(clip.duration>0);total+=clip.duration;
   let end=0;for(const c of clip.cues){assert(c.start>=end-.001);assert(c.end>c.start);assert(c.end<=clip.duration+.01);assert(['narrator','lark','nib'].includes(c.speaker));end=c.end;}
   assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(clip.file,base))).digest('hex'),clip.sha256);
  }
  assert(Math.abs(total-m.narrationDuration)<.01);
  for(const g of Object.values(GATES))for(const text of [g.prompt,g.success,...Object.values(g.hints||{})]){assert(m.support[text],text);assert(fs.statSync(new URL(m.support[text].file,base)).size>100);}
 });
 test(`${slug}: corrupt and obsolete bookmarks cannot invent completion`,()=>{
  const s=restoreState({version:EPISODE.version,beat:999,paragraph:-2,completed:null,pendingNext:'invented',attempts:[null],helped:null,finished:true},EPISODE,BEATS,GATES);assert.equal(s.finished,false);assert.equal(s.beat,0);assert.equal(s.pendingNext,null);assert.equal(s.activeGate,null);assert.equal(s.attempts.length,0);assert.equal(restoreState({version:'old',beat:2},EPISODE,BEATS,GATES).beat,0);
 });
}
test('The fork passage uses only short single-letter mappings and no early sight words',async()=>{const {PASSAGE,EPISODE}=await import('../../../fan-at-the-fork/episode.mjs');assert.deepEqual(PASSAGE,['Sam ran.','Sam sat.','Pip did fan Sam.','Pip sat.']);assert(PASSAGE.every(s=>decodable(s,EPISODE)));});

test('Temporary speech cannot be promoted to cast audio by flipping approval flags',async()=>{
 const {validateProductionRecording}=await import('../recording.mjs');const {BEATS}=await import('../../../fan-at-the-fork/episode.mjs');const m=JSON.parse(fs.readFileSync(new URL('../../../fan-at-the-fork/preview-recording.json',import.meta.url)));m.approved=true;m.status='approved';assert(validateProductionRecording(m,BEATS).some(e=>e.includes('source')));
});
