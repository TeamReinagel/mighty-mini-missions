import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDay} from './classroom.mjs';
import {COMPLETION_ITEM} from '../../apple-catcher/integration.mjs';
import {EPISODE} from '../../apple-catcher/episode.mjs';
import {episodeById,finishedEpisodes} from '../../lark-play/episodes.mjs';

test('The Apple Catcher is S1E2 in Connor’s list, and what it introduces matches the episode',()=>{
 const entry=episodeById('apple-catcher');
 assert.equal(entry.completionItem,EPISODE.completionItem);assert.equal(COMPLETION_ITEM,EPISODE.completionItem);
 assert.deepEqual(entry.sounds,EPISODE.introduced);assert.deepEqual(entry.words,EPISODE.targets);
 assert.equal(entry.card('2026-11-02','connor').href,'../apple-catcher/?kid=connor');
});

test('Connor finished The Apple Catcher, so no story day gives it to him again',()=>{
 assert(finishedEpisodes('connor',{})['apple-catcher']);
 for(const date of ['2026-11-09','2026-11-11','2026-11-13','2026-11-16','2026-11-18'])for(const kidId of ['connor','gabi','max','ethan']){
  assert(!buildDay({kidId,date}).cards.some(c=>c.gameId==='apple-catcher'),`${kidId} ${date}`);
 }
});
