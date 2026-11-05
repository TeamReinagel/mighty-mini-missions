import { BEATS, EPISODE, GATES } from './episode.mjs';
export const freshState=()=>({version:EPISODE.version,beat:0,completed:[],attempts:[],helped:[],packed:[],finished:false,reviewed:false,jumped:false});
export function restore(raw){
  const s=raw?.version===EPISODE.version?{...freshState(),...raw}:freshState();
  if(!Number.isInteger(s.beat)||s.beat<0||s.beat>=BEATS.length)s.beat=0;
  for(const key of ['completed','attempts','helped','packed'])if(!Array.isArray(s[key]))s[key]=[];
  s.completed=s.completed.filter(id=>GATES[id]);s.packed=[...new Set(s.packed.filter(id=>['hut','mill','fern'].includes(id)))];
  s.finished=s.finished===true&&Object.keys(GATES).every(id=>s.completed.includes(id));
  s.jumped=s.jumped===true;
  return s;
}
export function addHelp(s,id){if(!s.helped.includes(id))s.helped.push(id);}
export function respond(s,id,choice){
  const g=GATES[id];if(!g||s.completed.includes(id))return null;
  const correct=g.answer?choice===g.answer:true;
  let attempt=null;
  if(!s.attempts.some(a=>a.id===id)&&['review','modeled-transfer'].includes(g.kind)){
    const supported=g.kind==='modeled-transfer'||s.helped.includes(id);
    attempt={id,choice,correct:supported?null:correct,supported,kind:g.kind,measure:'word-label recognition'};
    s.attempts.push(attempt);
  }
  return {correct,attempt};
}
export function completeGate(s,id){if(!GATES[id])return;if(!s.completed.includes(id))s.completed.push(id);}
export function canFinish(s){return s.beat===BEATS.length-1&&Object.keys(GATES).every(id=>s.completed.includes(id));}
export function canReport(s,{child,review,recordingReady}){return Boolean(child)&&!review&&!s.jumped&&recordingReady===true&&s.finished&&canFinish(s);}
export function targetsAreDecodable(){const letters=new Set([...EPISODE.taughtBefore,...EPISODE.introduced]);return [...EPISODE.targets,...EPISODE.review].every(w=>[...w].every(l=>letters.has(l)));}
