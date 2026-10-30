export const STORAGE_KEY='mmm-moonpath-narrated-v2';
export const ASSESSED=new Set(['letter','moss','mushroom','sequence','bell']);
export function freshProgress(){return {scene:0,beat:0,treasure:false,chapter:false,complete:false,attempts:[],supported:[],inputs:{},elapsed:0};}
export function readProgress(storage){try{
  const p=JSON.parse(storage.getItem(STORAGE_KEY));
  if(!p){const old=JSON.parse(storage.getItem('mmm-moonpath-layered-v1'));return {...freshProgress(),treasure:old?.treasure===true,chapter:old?.chapter===true};}
  if(!Number.isInteger(p.scene)||!Number.isInteger(p.beat))return freshProgress();
  const audio=p.audio&&typeof p.audio.id==='string'&&Number.isFinite(p.audio.offset)&&p.audio.offset>=0?p.audio:undefined;
  return {...freshProgress(),...p,audio,attempts:Array.isArray(p.attempts)?p.attempts:[],supported:Array.isArray(p.supported)?p.supported:[],inputs:p.inputs&&typeof p.inputs==='object'&&!Array.isArray(p.inputs)?p.inputs:{}};
}catch{return freshProgress();}}
export function firstTry(progress,beat,choice){if(!ASSESSED.has(beat.type)||progress.attempts.some(a=>a.id===beat.id))return;progress.attempts.push({id:beat.id,type:beat.type,choice,correct:choice===beat.expected,supported:progress.supported.includes(beat.id),at:new Date().toISOString()});}
export function heardChoice(transcript,choices=[]){const s=String(transcript).toLowerCase().replace(/[^a-z\s]/g,' ').trim();const tokens=s.split(/\s+/);const found=choices.filter(c=>{const aliases=[c.id,c.say,c.label].filter(Boolean).map(x=>x.toLowerCase());if(c.id==='m')aliases.push('mmm','mm','em','hum');return aliases.some(a=>tokens.includes(a)||s===a);});return found.length===1?found[0]:null;}
export function formatTime(seconds){const n=Math.round(seconds||0);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
export function tracePoints(){const pts=[];const line=(a,b,n)=>{for(let i=0;i<n;i++){const t=i/n;pts.push({x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t});}};const curve=(a,b,c,d,n)=>{for(let i=0;i<n;i++){const t=i/n,u=1-t;pts.push({x:u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],y:u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]});}};line([.16,.2],[.16,.82],38);line([.16,.82],[.16,.39],27);curve([.16,.39],[.16,.14],[.49,.13],[.49,.44],39);line([.49,.44],[.49,.82],23);line([.49,.82],[.49,.39],27);curve([.49,.39],[.49,.14],[.82,.13],[.82,.44],39);line([.82,.44],[.82,.82],23);pts.push({x:.82,y:.82});return pts;}
export function advanceTrace(index,point,points=tracePoints()){let best=index,dist=Infinity;for(let i=Math.max(0,index-3);i<Math.min(points.length,index+29);i++){const d=Math.hypot(points[i].x-point.x,points[i].y-point.y);if(d<dist){dist=d;best=i;}}return dist<.11?Math.max(index,best):index;}
export function validateLocation(progress,episode){const scene=Math.max(0,Math.min(episode.scenes.length-1,progress.scene));const beat=Math.max(0,Math.min(episode.scenes[scene].beats.length-1,progress.beat));return {...progress,scene,beat};}
