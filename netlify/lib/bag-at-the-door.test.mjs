import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDay} from './classroom.mjs';
import {COMPLETION_ITEM} from '../../bag-at-the-door/integration.mjs';
import {EPISODE} from '../../bag-at-the-door/episode.mjs';
import {episodeById,finishedEpisodes} from '../../lark-play/episodes.mjs';

test('The Bag at the Door is S2E1 in Gabi’s list, and what it introduces matches the episode',()=>{
 const entry=episodeById('bag-at-the-door');
 assert.equal(entry.completionItem,EPISODE.completionItem);assert.equal(COMPLETION_ITEM,EPISODE.completionItem);
 assert.deepEqual(entry.sounds,EPISODE.introduced);assert.deepEqual(entry.words,EPISODE.targets);
 assert.equal(entry.card('2026-11-02','gabi').href,'../bag-at-the-door/?kid=gabi');
 assert.equal(entry.handsOn.title,'Three invitations');
});

test('Gabi finished The Bag at the Door, so no story day gives it to her again',()=>{
 assert(finishedEpisodes('gabi',{})['bag-at-the-door']);
 for(const date of ['2026-11-09','2026-11-11','2026-11-13','2026-11-16'])for(const kidId of ['connor','gabi','max','ethan']){
  assert(!buildDay({kidId,date}).cards.some(c=>c.gameId==='bag-at-the-door'),`${kidId} ${date}`);
 }
});
