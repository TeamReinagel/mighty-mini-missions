import {EPISODE,BEATS,GATES} from './episode.mjs';
export const freshState=()=>({version:EPISODE.version,beat:0,paragraph:0,atTurn:false,completed:[],attempts:[],helped:[],firstCatch:false,chosenMark:false,loopFastened:false,applesReleased:false,modelCompleted:false,boxOpen:false,mapPlaced:false,finished:false,reviewed:false,completionReported:false});
export function restore(raw){
 const s=raw?.version===EPISODE.version?{...freshState(),...raw}:freshState();
 if(!Number.isInteger(s.beat)||s.beat<0||s.beat>=BEATS.length)s.beat=0;
 if(!Number.isInteger(s.paragraph)||s.paragraph<0||s.paragraph>=BEATS[s.beat].paragraphs.length)s.paragraph=0;
 for(const k of ['completed','attempts','helped'])if(!Array.isArray(s[k]))s[k]=[];
 s.completed=[...new Set(s.completed.filter(id=>GATES[id]))];
  s.attempts=s.attempts.filter(a=>a&&GATES[a.id]&&typeof a.choice==='string');s.helped=s.helped.filter(id=>GATES[id]);
 for(const k of ['firstCatch','chosenMark','loopFastened','applesReleased','modelCompleted','boxOpen','mapPlaced','finished','reviewed','atTurn','completionReported'])s[k]=s[k]===true;
 if(!s.firstCatch){s.loopFastened=false;s.applesReleased=false;}
 if(!s.loopFastened)s.applesReleased=false;
 if(!s.boxOpen)s.mapPlaced=false;
 if(!s.loopFastened||!s.applesReleased)s.completed=s.completed.filter(id=>id!=='choose-ant');
 if(!s.modelCompleted)s.completed=s.completed.filter(id=>id!=='blend-am');
 if(!s.mapPlaced)s.completed=s.completed.filter(id=>id!=='fit-map');
 s.finished=s.finished&&canFinish(s);s.atTurn=s.atTurn&&Boolean(BEATS[s.beat].gate)&&!s.completed.includes(BEATS[s.beat].gate);
 return s;
}
export function addHelp(s,id){if(!s.helped.includes(id))s.helped.push(id);}
export function respond(s,id,choice){
 const g=GATES[id];if(!g?.choices?.includes(choice)||s.completed.includes(id))return null;
 const correct=choice===g.answer;let attempt=null;
 if(!s.attempts.some(a=>a.id===id)){
  const supported=g.kind==='modeled'||s.helped.includes(id);
  attempt={id,choice,correct:supported?null:correct,supported,measure:g.measure};s.attempts.push(attempt);
 }
 return {correct,attempt};
}
export function completeGate(s,id){
 if(!GATES[id]||s.completed.includes(id))return false;
 if(id==='choose-ant'&&(!s.loopFastened||!s.applesReleased))return false;
 if(id==='blend-am'&&!s.modelCompleted)return false;
 if(id==='fit-map'&&(!s.boxOpen||!s.mapPlaced))return false;
 if(!s.completed.includes(id))s.completed.push(id);s.atTurn=false;return true;
}
export function releaseApple(s){if(!s.loopFastened)return false;s.applesReleased=true;return true;}
export function placeMap(s,inTarget){if(!s.boxOpen||!inTarget)return false;s.mapPlaced=true;return true;}
export function canFinish(s){return s.beat===BEATS.length-1&&s.mapPlaced&&Object.keys(GATES).every(id=>s.completed.includes(id));}
export function canReport(s,{child,review,recordingReady}){return ['max','gabi','connor','ethan'].includes(child)&&!review&&!s.reviewed&&recordingReady===true&&s.finished&&canFinish(s);}
export function targetsAreDecodable(){const taught=new Set([...EPISODE.taughtBefore,...EPISODE.introduced]);return EPISODE.targets.every(w=>[...w].every(c=>taught.has(c)));}
