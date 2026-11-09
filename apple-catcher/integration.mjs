import {openingPictures} from '../shared/story-cache.mjs';

export const GAME_ID='apple-catcher';
export const COMPLETION_ITEM='apple-catcher:episode-complete';
export function appleCatcherCard(date,kidId){
 return {id:`${date}:game:${GAME_ID}`,kind:'game',part:'ela',gameId:GAME_ID,title:'The Apple Catcher',href:`../apple-catcher/?kid=${encodeURIComponent(kidId)}`,say:'Help Lark and Nib mend an apple catcher and find the first missing map section.',goal:'Finish the adventure, then come back',skill:'Letter sounds',
  prefetch:openingPictures('apple-catcher',['orchard','catcher-loose','route-box','lark-talk','nib-talk','lark-walk','nib-walk'])};
}
// Today with Joyce assigns this episode from lark-play/episodes.mjs.
