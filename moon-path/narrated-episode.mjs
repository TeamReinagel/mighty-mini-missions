import {EPISODE as original,HELP_LINES} from './episode.mjs';
import {NARRATION} from './narration-data.mjs';

const challenges=new Map(original.scenes.flatMap(s=>s.beats).filter(b=>b.kind==='challenge').map(b=>[b.id,b]));
export {HELP_LINES,NARRATION};
export const EPISODE={
  ...original,version:'moonpath-elevenlabs-narrated-v2',
  scenes:NARRATION.scenes.map(scene=>({...scene,beats:scene.beats.map(beat=>{
    if(beat.kind!=='challenge')return beat;
    const existing=challenges.get(beat.id);
    if(!existing)throw new Error('Unknown narrated interaction '+beat.id);
    return {...existing,...beat,skipIntro:true,skipSuccess:true};
  })})),
};

export function narratedEntries(){
  return Object.fromEntries(EPISODE.scenes.flatMap(s=>s.beats).filter(b=>b.kind==='narration').map(b=>[b.id,b.audio]));
}
