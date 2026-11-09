import {openingPictures} from '../shared/story-cache.mjs';

export const GAME_ID='fan-at-the-fork';
export const COMPLETION_ITEM='fan-at-the-fork:episode-complete';
export function episodeCard(date,kidId){return {id:`${date}:game:${GAME_ID}`,kind:'game',part:'ela',gameId:GAME_ID,title:'The Fan at the Fork',href:`../fan-at-the-fork/?kid=${encodeURIComponent(kidId)}`,say:'One moving fan. One quiet fish. Which path does the book name?',goal:'Finish the adventure, then come back',skill:'Word recognition',
 prefetch:[...openingPictures('moon-path',['woods','lark-talk','nib-talk','lark-walk','nib-walk']),...openingPictures('bag-at-the-door',['courier-bag']),...openingPictures(GAME_ID,['creek','markers'])]};}
// Today with Joyce assigns this episode from lark-play/episodes.mjs.
