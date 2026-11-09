import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDay} from './classroom.mjs';
import {COMPLETION_ITEM} from '../../moon-path/integration.mjs';
import {episodeById,finishedEpisodes} from '../../lark-play/episodes.mjs';

// The Moon Path is Lark and Nib S1E1, which Connor has finished. It is not a reading game.
test('Connor never gets The Moon Path again, on any day',()=>{
  assert.equal(finishedEpisodes('connor',{})['moon-path'] < '2026-11-08',true);
  for(let d=12;d<=40;d+=1){
    const date=new Date(Date.UTC(2026,9,d)).toISOString().slice(0,10);
    for(const kidId of ['connor','gabi','max','ethan']){
      assert.equal(buildDay({kidId,date}).cards.some(card=>card.gameId==='moon-path'),false,`${kidId} ${date}`);
    }
  }
});

test('Its finish is still recognized by its real completion item',()=>{
  assert.equal(episodeById('moon-path').completionItem,COMPLETION_ITEM);
});
