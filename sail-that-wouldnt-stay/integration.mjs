import {openingPictures} from '../shared/story-cache.mjs';

export const GAME_ID='sail-that-wouldnt-stay';
export const COMPLETION_ITEM='sail-that-wouldnt-stay:episode-complete';
export function episodeCard(date,kidId){return {id:`${date}:game:${GAME_ID}`,kind:'game',part:'ela',gameId:GAME_ID,title:'The Sail That Wouldn’t Stay',href:`../sail-that-wouldnt-stay/?kid=${encodeURIComponent(kidId)}`,say:'A sail the size of the sky. A wagon the size of a mouse.',goal:'Finish the adventure, then come back',skill:'Word recognition',
 prefetch:[...openingPictures('moon-path',['woods','lark-talk','nib-talk','lark-walk','nib-walk']),...openingPictures(GAME_ID,['wagons','supplies','ridge'])]};}
// Today with Joyce assigns this episode from lark-play/episodes.mjs.
