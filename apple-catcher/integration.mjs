export const GAME_ID='apple-catcher';
export const COMPLETION_ITEM='apple-catcher:episode-complete';
export const SCHEDULE={kidId:'connor',date:'2026-11-02'};

// One requested reading mission, replacing the usual reading card on this date only.
export function scheduledAppleCatcherCard(date,kidId){
 if(date!==SCHEDULE.date||kidId!==SCHEDULE.kidId)return null;
 return appleCatcherCard(date,kidId);
}
export function appleCatcherCard(date,kidId){
 return {id:`${date}:game:${GAME_ID}`,kind:'game',part:'ela',gameId:GAME_ID,title:'The Apple Catcher',href:`../apple-catcher/?kid=${encodeURIComponent(kidId)}`,say:'Help Lark and Nib mend an apple catcher and find the first missing map section.',goal:'Finish the adventure, then come back',skill:'Letter sounds'};
}
