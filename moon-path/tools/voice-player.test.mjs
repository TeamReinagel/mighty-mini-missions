import test from 'node:test';
import assert from 'node:assert/strict';
import {VoicePlayer,validOffset,cueAt} from '../voice-player.mjs';

class FakeAudio{
  currentTime=0;paused=true;muted=false;loads=0;
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
  load(){this.loads++;}
  time(value){this.currentTime=value;this.ontimeupdate?.();}
  end(){this.onended?.();}
}
const entry={file:'assets/audio/narration/test.mp3',source:'elevenlabs-upload',duration:30,
  cues:[{start:0,end:5,text:'Before the choice.',speaker:'narrator'},{start:5,end:30,text:'A little letter.',speaker:'lark'}]};
const make=(overrides={})=>{
  const audio=new FakeAudio(),events=[];
  const player=new VoicePlayer({audio,getEntry:()=>entry,baseURL:'https://example.test/',
    onCue:c=>events.push(c),...overrides});
  return {audio,events,player};
};
const line={id:'narrated-1',kind:'narration',text:'A narrated passage.'};

test('A pause holds the passage until the media actually ends',async()=>{
  const {audio,player}=make();let ended=false;
  const promise=player.play(line).then(result=>{ended=true;return result;});
  audio.time(12);player.pause();await Promise.resolve();
  assert.equal(audio.paused,true);assert.equal(ended,false);
  player.resume();assert.equal(audio.paused,false);assert.equal(audio.currentTime,12);
  assert.equal(audio.playbackRate,1);audio.end();assert.equal(await promise,'ended');
});

test('Resume and Again follow the recording clock, not the start of the scene',async()=>{
  const progress=[],{audio,player,events}=make({onProgress:(_,t)=>progress.push(t)});
  const promise=player.play(line,{offset:17});audio.onloadedmetadata();
  assert.equal(audio.currentTime,17);assert.equal(events.at(-1).text,'A little letter.');
  player.repeatCue();assert.equal(audio.currentTime,5);assert.equal(progress.at(-1),5);
  player.stop();assert.equal(await promise,'cancelled');
});

test('Cancelling an old passage cannot finish or overwrite the next passage',async()=>{
  const {audio,player}=make();const first=player.play(line),staleEnd=audio.onended;
  let secondEnded=false;
  const second=player.play({...line,id:'narrated-2'}).then(x=>{secondEnded=true;return x;});
  assert.equal(await first,'cancelled');staleEnd();await Promise.resolve();
  assert.equal(secondEnded,false);assert.equal(player.position.id,'narrated-2');
  audio.end();assert.equal(await second,'ended');
});

test('A failed recording waits for retry rather than silently skipping the story',async()=>{
  let failures=0,ended=false;
  const {audio,player}=make({onError:()=>failures++});
  const promise=player.play(line).then(x=>{ended=true;return x;});audio.time(8);audio.onerror();
  await Promise.resolve();assert.equal(failures,1);assert.equal(ended,false);
  player.resume();assert.equal(audio.loads,1);audio.onloadedmetadata();assert.equal(audio.currentTime,8);
  audio.end();assert.equal(await promise,'ended');
});

test('Invalid bookmarks cannot seek outside the playable recording',()=>{
  assert.equal(validOffset(-3,30),0);assert.equal(validOffset(NaN,30),0);
  assert.equal(validOffset(900,30),29.85);assert.equal(cueAt(entry.cues,4).speaker,'narrator');
  assert.equal(cueAt(entry.cues,5).speaker,'lark');assert.equal(cueAt(entry.cues,30),null);
});
