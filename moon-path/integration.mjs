export const GAME_ID='moon-path';
export const COMPLETION_ITEM='moon-path:episode-complete';
const KIDS=new Set(['max','gabi','connor','ethan']);

export function moonPathCard(date,kidId){
  return {id:`${date}:game:${GAME_ID}`,kind:'game',part:'ela',gameId:GAME_ID,
    title:'The Moon Path',href:`../moon-path/?kid=${encodeURIComponent(kidId)}`,
    say:'Lark and Nib have a missing map. Help them find the moonstone.',
    goal:'Finish the adventure, then come back',skill:'Letter sounds'};
}

export function episodeChild(query,active){
  const id=query||active?.id;
  return KIDS.has(id)?{id,name:id[0].toUpperCase()+id.slice(1)}:null;
}
export function childStorage(storage,id='guest'){
  return {getItem:key=>storage.getItem(`${key}:${id}`),setItem:(key,value)=>storage.setItem(`${key}:${id}`,value)};
}
export function canReportCompletion(progress,turnIds){
  return progress.complete===true&&!progress.previewed&&turnIds.length>0&&turnIds.every(id=>progress.completedTurns?.includes(id));
}

export function episodeReporter({child,review=false,log=()=>{},flush=()=>{}}){
  const allowed=progress=>Boolean(child)&&!review&&!progress.previewed;
  return {
    practice(progress,attempt){
      if(!allowed(progress)||!attempt)return;
      log({player:child.name,game:GAME_ID,skill:attempt.supported?'Story participation':attempt.type==='sequence'?'Story sequence':'Letter sounds',
        item:`moon-path:${attempt.id}`,correct:attempt.supported?null:attempt.correct,
        extra:{episode:'moon-path',firstResponse:true,supported:attempt.supported,choice:attempt.choice,type:attempt.type}});
    },
    support(progress,id){
      if(!allowed(progress))return;
      log({player:child.name,game:GAME_ID,skill:'Story participation',item:`moon-path:help:${id}`,correct:null,extra:{episode:'moon-path',supported:true}});
    },
    complete(progress,turnIds){
      if(!allowed(progress)||progress.completionReported||!canReportCompletion(progress,turnIds))return false;
      const queued=log({player:child.name,game:GAME_ID,skill:'Story participation',item:COMPLETION_ITEM,correct:null,
        extra:{episode:'moon-path',completed:true,turns:turnIds.length,supportedTurns:progress.supported.length}});
      if(queued===false)return false;
      progress.completionReported=true;flush();return true;
    },
    flush,
  };
}
