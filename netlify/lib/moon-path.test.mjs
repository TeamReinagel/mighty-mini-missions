import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDay,handleClassroom,memoryStore} from './classroom.mjs';
import {COMPLETION_ITEM} from '../../moon-path/integration.mjs';

test('Connor receives Moon Path as reading on school days while other children keep their paths',()=>{
  for(const date of ['2026-10-19','2026-10-20','2026-10-21','2026-10-23']){
    const day=buildDay({kidId:'connor',date});
    assert.equal(day.cards.filter(card=>card.part==='ela').length,1);
    assert.equal(day.cards[0].gameId,'moon-path');
    assert.equal(day.cards[1].stepId,'connor-count-5');
    assert.equal(day.cards.filter(card=>card.part==='bonus').length,2);
  }
  for(const kidId of ['max','gabi','ethan'])assert.equal(buildDay({kidId,date:'2026-10-19'}).cards.some(card=>card.gameId==='moon-path'),false);
});

test('The reading checkmark requires an actual completion after opening, for the correct child',async()=>{
  const store=memoryStore(),start=Date.parse('2026-10-19T15:00:00Z');
  const call=(body,seconds)=>handleClassroom({store,env:{},body:{kid:'connor',...body},now:new Date(start+seconds*1000)});
  const today=await call({action:'today'},0),card=today.body.cards.find(c=>c.gameId==='moon-path');
  const events=async(seconds,rows)=>store.setJSON(`events/2026-10-19/${start+seconds*1000}-story`,rows);
  const completion={kid:'connor',game:'moon-path',skill:'Story participation',item:COMPLETION_ITEM,correct:null,extra:{completed:true}};
  const done=seconds=>call({action:'card',cardId:card.id,status:'done'},seconds);
  await events(1,[completion]);
  assert.equal((await done(2)).body.notYet,true);
  await call({action:'open',cardId:card.id},5);
  assert.equal((await done(6)).body.notYet,true);
  await events(7,Array.from({length:5},(_,i)=>({kid:'connor',game:'moon-path',item:'first-choice-'+i,correct:true})));
  assert.equal((await done(8)).body.notYet,true);
  await events(9,[{...completion,kid:'gabi'},{...completion,extra:{completed:false}}]);
  assert.equal((await done(10)).body.notYet,true);
  await events(11,[completion]);
  assert.equal((await done(12)).body.ok,true);
  assert.equal((await call({action:'today'},13)).body.dose.parts.find(p=>p.id==='ela').done,true);
});
