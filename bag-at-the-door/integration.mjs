import {openingPictures} from '../shared/story-cache.mjs';

export const GAME_ID='bag-at-the-door';
export const COMPLETION_ITEM='bag-at-the-door:episode-complete';
export function bagAtDoorCard(date,kidId){
  return {id:`${date}:game:${GAME_ID}`,kind:'game',part:'ela',gameId:GAME_ID,
    title:'The Bag at the Door',href:`../bag-at-the-door/?kid=${encodeURIComponent(kidId)}`,
    say:'Three invitations and one grabby latch. Help Lark and Nib get their delivery bag through the door.',
    goal:'Finish the adventure, then come back',skill:'Word recognition',
    prefetch:openingPictures('bag-at-the-door',['library','courier-bag','felt-pad','lark-talk','nib-talk','lark-walk','nib-walk'])};
}
// Today with Joyce assigns this episode from lark-play/episodes.mjs.
