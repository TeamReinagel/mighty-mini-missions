import test from 'node:test';
import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {EPISODE,NARRATION,narratedEntries} from '../narrated-episode.mjs';
import {freshProgress,readProgress,STORAGE_KEY} from '../logic.mjs';
import {StoryStage} from '../stage.mjs';

const beats=EPISODE.scenes.flatMap(s=>s.beats);
const story=beats.filter(b=>b.kind==='narration');
const turns=beats.filter(b=>b.kind==='challenge');

test('The narrated episode keeps all13 interactive turns and uses no old main dialogue beats',()=>{
  assert.equal(EPISODE.scenes.length,9);assert.equal(turns.length,13);
  assert.equal(new Set(turns.map(b=>b.id)).size,13);
  assert.ok(beats.every(b=>b.kind==='narration'||b.kind==='challenge'));
  assert.ok(turns.every(b=>b.skipIntro&&b.skipSuccess));
  assert.deepEqual(turns.filter(b=>b.optional).map(b=>b.type),['hum','coread','reread']);
  assert.equal(NARRATION.source.name,'ElevenLabs_The_Moon_Path.mp3');
  assert.match(NARRATION.source.sha256,/^[a-f0-9]{64}$/);
});

test('Spliced files cover the full supplied recording in order with no dropped or repeated audio',async()=>{
  assert.equal(story[0].audio.sourceStart,0);
  let end=0;
  for(const beat of story){
    const audio=beat.audio;
    assert.equal(audio.source,'elevenlabs-upload');
    assert.ok(Math.abs(audio.sourceStart-end)<.002,'gap or overlap at '+beat.id);
    assert.ok(audio.sourceEnd>audio.sourceStart);
    assert.ok(Math.abs(audio.duration-(audio.sourceEnd-audio.sourceStart))<.002);
    assert.ok(audio.file.startsWith('assets/audio/narration/')&&!audio.file.includes('..'));
    const file=fileURLToPath(new URL('../'+audio.file,import.meta.url));
    const info=await stat(file);assert.ok(info.size>1000);assert.ok(info.size<25*1024*1024,'hosting file limit');
    end=audio.sourceEnd;
  }
  assert.ok(Math.abs(end-NARRATION.source.duration)<.002);
  assert.equal(Object.keys(narratedEntries()).length,story.length);
});

test('Every response pause lies after the spoken prompt and before the narrated outcome',()=>{
  assert.equal(NARRATION.gates.length,13);
  for(const gate of NARRATION.gates){
    assert.ok(gate.at>=gate.promptEnd-.035,'cut clips prompt at '+gate.id);
    assert.ok(gate.at<=gate.resumeStart+.035,'cut reveals outcome at '+gate.id);
    assert.ok(turns.some(t=>t.id===gate.id));
  }
});

test('Timed captions and visual states stay within each recording, including its saved start state',()=>{
  for(const beat of story){
    let previous=-1;
    assert.ok(beat.audio.cues.length>0);
    for(const cue of beat.audio.cues){
      assert.ok(cue.text.trim());assert.ok(['narrator','lark','nib'].includes(cue.speaker));
      assert.ok(cue.start>=previous&&cue.start>=0&&cue.end>cue.start);
      assert.ok(cue.end<=beat.audio.duration+.035);previous=cue.start;
    }
    assert.equal(beat.audio.visuals[0].at,0);
    assert.ok(beat.audio.visuals[0].stage);
    assert.equal(new Set(beat.audio.visuals.map(c=>c.key)).size,beat.audio.visuals.length);
  }
});

test('Narrated bookmarks reject bad offsets and do not reuse old screenplay locations',()=>{
  const old={...freshProgress(),scene:8,beat:14,complete:true,treasure:true,chapter:true};
  const migrated=readProgress({getItem:key=>key===STORAGE_KEY?null:JSON.stringify(old)});
  assert.equal(migrated.scene,0);assert.equal(migrated.beat,0);assert.equal(migrated.complete,false);
  assert.equal(migrated.treasure,true);assert.equal(migrated.chapter,true);
  const bad=readProgress({getItem:()=>JSON.stringify({...freshProgress(),audio:{id:'n1',offset:-50}})});
  assert.equal(bad.audio,undefined);
});

test('Narrated motion follows media time during buffering and can replay within one visual cue',()=>{
  const stage=Object.create(StoryStage.prototype);let media=1;
  Object.assign(stage,{time:500,flags:{},beat:{stage:'river-rescue'},narrationClock:()=>media});
  const cues=[{key:'initial',at:0,stage:'river-rescue',flags:{returned:false}},{key:'return',at:.5,stage:'river-rescue',action:'boat-return',duration:10,flags:{returned:true}}];
  stage.followNarration(cues,media,'river-rescue');assert.equal(stage.progress(),.05);
  stage.time=900;assert.equal(stage.progress(),.05,'render time must not move the ferry while audio waits');
  media=12;stage.followNarration(cues,media,'river-rescue');assert.equal(stage.motion,null);
  media=2;stage.followNarration(cues,media,'river-rescue');assert.equal(stage.progress(),.15);
  media=.1;stage.followNarration(cues,media,'river-rescue');assert.equal(stage.flags.returned,false);
});
