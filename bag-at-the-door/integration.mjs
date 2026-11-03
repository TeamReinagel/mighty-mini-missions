export const GAME_ID='bag-at-the-door';
export const COMPLETION_ITEM='bag-at-the-door:episode-complete';
export const SCHEDULE={kidId:'gabi',date:'2026-11-02'};

export function bagAtDoorCard(date,kidId){
  return {id:`${date}:game:${GAME_ID}`,kind:'game',part:'ela',gameId:GAME_ID,
    title:'The Bag at the Door',href:`../bag-at-the-door/?kid=${encodeURIComponent(kidId)}`,
    say:'Three invitations and one grabby latch. Help Lark and Nib get their delivery bag through the door.',
    goal:'Finish the adventure, then come back',skill:'Word recognition'};
}

// Kept for direct callers. Today with Joyce assigns the episode from lark-play/plan.mjs.
export function scheduledBagAtDoorCard(date,kidId){
  if(date!==SCHEDULE.date||kidId!==SCHEDULE.kidId)return null;
  return bagAtDoorCard(date,kidId);
}
