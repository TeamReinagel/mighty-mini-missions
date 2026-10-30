import test from 'node:test';
import assert from 'node:assert/strict';
import {episodeChild,childStorage,episodeReporter,COMPLETION_ITEM} from '../integration.mjs';
import {EPISODE} from '../narrated-episode.mjs';
const turnIds=EPISODE.scenes.flatMap(s=>s.beats).filter(b=>b.kind==='challenge').map(b=>b.id);
const finished=()=>({complete:true,completedTurns:[...turnIds],supported:[]});

test('Explicit child links override the home profile and each child keeps a separate bookmark',()=>{
  assert.deepEqual(episodeChild('connor',{id:'max'}),{id:'connor',name:'Connor'});
  assert.equal(episodeChild('unrecognized',{id:'max'}),null);
  const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,v)=>data.set(key,v)};
  const connor=childStorage(storage,'connor'),gabi=childStorage(storage,'gabi');
  connor.setItem('bookmark','middle');gabi.setItem('bookmark','start');
  assert.equal(connor.getItem('bookmark'),'middle');assert.equal(gabi.getItem('bookmark'),'start');
});
test('First response and supported participation are distinct, and completion is never accuracy',()=>{
  const events=[],report=episodeReporter({child:{id:'connor',name:'Connor'},log:event=>events.push(event)}),p=finished();
  report.practice(p,{id:'letter',type:'letter',choice:'s',correct:false,supported:false});
  report.practice(p,{id:'bell',type:'bell',choice:'m',correct:true,supported:true});
  assert.equal(events[0].correct,false);assert.equal(events[0].player,'Connor');
  assert.equal(events[1].correct,null);assert.equal(events[1].extra.supported,true);
  assert.equal(report.complete(p,turnIds),true);assert.equal(report.complete(p,turnIds),false);
  assert.equal(events.at(-1).item,COMPLETION_ITEM);assert.equal(events.at(-1).correct,null);
});
test('Partial play, parent jumps, review mode, and unknown players produce no completion credit',()=>{
  const events=[],child={id:'connor',name:'Connor'},log=e=>events.push(e);
  for(const p of [{...finished(),complete:false},{...finished(),completedTurns:turnIds.slice(1)},{...finished(),previewed:true}]){
    assert.equal(episodeReporter({child,log}).complete(p,turnIds),false);
  }
  for(const options of [{child,review:true,log},{child:null,log}]){
    const report=episodeReporter(options),p=finished();
    report.practice(p,{id:'letter'});report.support(p,'letter');assert.equal(report.complete(p,turnIds),false);
  }
  assert.equal(events.length,0);
});
