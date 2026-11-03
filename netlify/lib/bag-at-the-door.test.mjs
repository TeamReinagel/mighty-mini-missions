import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDay,handleClassroom,memoryStore} from './classroom.mjs';
import {COMPLETION_ITEM,SCHEDULE} from '../../bag-at-the-door/integration.mjs';
import {EPISODE} from '../../bag-at-the-door/episode.mjs';

test('Gabi’s November 2 reading is the episode, with math and a bonus still beside it',()=>{
 const day=buildDay({kidId:'gabi',date:SCHEDULE.date});
 assert.equal(day.weekday,'Monday');
 assert.deepEqual(day.cards.map(c=>c.id),[
  '2026-11-02:game:bag-at-the-door',
  '2026-11-02:game:snack-count:gabi-count-10','2026-11-02:game:monster-hunt','2026-11-02:move:Three invitations'
 ]);
 const story=day.cards.find(c=>c.gameId==='bag-at-the-door');assert.equal(story.part,'ela');
 assert.equal(story.href,'../bag-at-the-door/?kid=gabi');assert.equal(COMPLETION_ITEM,EPISODE.completionItem);
 for(const kidId of ['max','connor','ethan'])assert(!buildDay({kidId,date:SCHEDULE.date}).cards.some(c=>c.gameId==='bag-at-the-door'));
 for(const date of ['2026-10-26','2026-11-01','2026-11-03','2026-11-09'])assert(!buildDay({kidId:'gabi',date}).cards.some(c=>c.gameId==='bag-at-the-door'));
});

test('The mission checkmark needs Gabi’s exact completed episode after opening',async()=>{
 const store=memoryStore(),start=Date.parse('2026-11-02T15:00:00Z');
 const call=(body,seconds)=>handleClassroom({store,env:{},body:{kid:'gabi',...body},now:new Date(start+seconds*1000)});
 const today=await call({action:'today'},0),card=today.body.cards.find(c=>c.gameId==='bag-at-the-door');
 const events=(seconds,rows)=>store.setJSON(`events/2026-11-02/${start+seconds*1000}-story`,rows);
 const completion={kid:'gabi',game:'bag-at-the-door',skill:'Story participation',item:COMPLETION_ITEM,correct:null,extra:{completed:true,episode:EPISODE.id}};
 const done=seconds=>call({action:'card',cardId:card.id,status:'done'},seconds);
 await events(1,[completion]);assert.equal((await done(2)).body.notYet,true);
 await call({action:'open',cardId:card.id},5);assert.equal((await done(6)).body.notYet,true);
 await events(7,[{...completion,item:'bag-at-the-door:review-map',correct:true},{...completion,kid:'connor'},{...completion,game:'moon-path'},{...completion,extra:{completed:false}}]);
 assert.equal((await done(8)).body.notYet,true);
 const before=structuredClone((await store.get('classroom/kid/gabi',{type:'json'})).steps);
 await events(9,[completion]);assert.equal((await done(10)).body.ok,true);
 const after=await call({action:'today'},11);
 assert.equal(after.body.cards.find(c=>c.gameId==='bag-at-the-door').done,true);
 assert.equal(after.body.dose.parts.find(p=>p.id==='ela').done,true);
 assert.deepEqual((await store.get('classroom/kid/gabi',{type:'json'})).steps,before);
});
