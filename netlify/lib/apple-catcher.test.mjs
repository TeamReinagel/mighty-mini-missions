import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDay,handleClassroom,memoryStore} from './classroom.mjs';
import {COMPLETION_ITEM,SCHEDULE} from '../../apple-catcher/integration.mjs';
import {EPISODE} from '../../apple-catcher/episode.mjs';

test('The Apple Catcher replaces Connor’s reading mission on November 2 only',()=>{
 const day=buildDay({kidId:'connor',date:SCHEDULE.date});
 assert.equal(day.weekday,'Monday');
 assert.deepEqual(day.cards.map(c=>c.id),[
  '2026-11-02:game:apple-catcher','2026-11-02:game:snack-count:connor-count-5',
  '2026-11-02:game:monster-hunt','2026-11-02:move:Build a tower'
 ]);
 const story=day.cards.find(c=>c.gameId==='apple-catcher');
 assert.equal(day.cards.filter(c=>c.part==='ela').length,1);
 assert.equal(story.href,'../apple-catcher/?kid=connor');assert.equal(COMPLETION_ITEM,EPISODE.completionItem);
 for(const kidId of ['max','gabi','ethan'])assert(!buildDay({kidId,date:SCHEDULE.date}).cards.some(c=>c.gameId==='apple-catcher'));
 for(const date of ['2026-10-26','2026-11-01','2026-11-03','2026-11-09'])assert(!buildDay({kidId:'connor',date}).cards.some(c=>c.gameId==='apple-catcher'));
 assert(buildDay({kidId:'gabi',date:SCHEDULE.date}).cards.some(c=>c.gameId==='bag-at-the-door'));
});

test('A previously pinned reading lesson or check does not add a second reading mission',()=>{
 const state={days:{[SCHEDULE.date]:{board:{shorter:false,lessons:[{id:'connor-names-1',missed:[]},{id:'connor-count-5',missed:[]}],check:{stepId:'connor-names-1',items:[{item:'letter-a'}]}}}}};
 const day=buildDay({kidId:'connor',date:SCHEDULE.date,state});
 assert.deepEqual(day.cards.filter(c=>c.part==='ela').map(c=>c.gameId),['apple-catcher']);
 assert(day.cards.some(c=>c.part==='math'));assert(day.cards.some(c=>c.part==='bonus'));
 const tomorrow=buildDay({kidId:'connor',date:'2026-11-03',state});assert(!tomorrow.cards.some(c=>c.gameId==='apple-catcher'));
});

test('Connor’s reading checkmark needs his exact episode completion after opening, without changing mastery',async()=>{
 const store=memoryStore(),start=Date.parse('2026-11-02T15:00:00Z');
 const call=(body,seconds)=>handleClassroom({store,env:{},body:{kid:'connor',...body},now:new Date(start+seconds*1000)});
 const today=await call({action:'today'},0),card=today.body.cards.find(c=>c.gameId==='apple-catcher');
 const events=(seconds,rows)=>store.setJSON(`events/2026-11-02/${start+seconds*1000}-story`,rows);
 const completion={kid:'connor',game:'apple-catcher',skill:'Story participation',item:COMPLETION_ITEM,correct:null,extra:{completed:true,episode:EPISODE.id}};
 const done=seconds=>call({action:'card',cardId:card.id,status:'done'},seconds);
 await events(1,[completion]);assert.equal((await done(2)).body.notYet,true);
 await call({action:'open',cardId:card.id},5);assert.equal((await done(6)).body.notYet,true);
 await events(7,[{...completion,item:'apple-catcher:review-m',correct:true},{...completion,kid:'gabi'},{...completion,game:'bag-at-the-door'},{...completion,extra:{completed:false}}]);
 assert.equal((await done(8)).body.notYet,true);
 const before=structuredClone((await store.get('classroom/kid/connor',{type:'json'})).steps);
 await events(9,[completion]);assert.equal((await done(10)).body.ok,true);
 const after=await call({action:'today'},11);
 assert.equal(after.body.cards.find(c=>c.gameId==='apple-catcher').done,true);
 assert.equal(after.body.dose.parts.find(p=>p.id==='ela').done,true);
 assert.equal(after.body.dose.parts.find(p=>p.id==='math').done,false);
 assert.deepEqual((await store.get('classroom/kid/connor',{type:'json'})).steps,before);
});
