import {voiceParts} from './episode.mjs?v=apple-cast-1';
import {VoicePlayer} from '../moon-path/voice-player.mjs';
import {storyAsset} from '../shared/story-cache.mjs';
import {validateRecording} from './recording.mjs?v=apple-cast-1';
// The supplied cast recording is enabled only after its own source ranges and cues validate.
export const RECORDING={status:'awaiting-new-cast-recording',approved:false,entries:{}};
export class Narrator {
  constructor({onSpeaker=()=>{},onCaption=()=>{},onFailure=()=>{}}={}){
    this.onSpeaker=onSpeaker;this.onFailure=onFailure;this.generation=0;this.settle=null;this.preview=null;
    this.audio=new Audio();
    this.player=new VoicePlayer({audio:this.audio,getEntry:id=>RECORDING.entries[id],baseURL:import.meta.url,onCue:cue=>{onSpeaker(cue?.speaker||null);if(cue)onCaption(cue.text);},onStopped:()=>onSpeaker(null),onError:error=>onFailure(error)});
  }
  get ready(){return RECORDING.approved===true&&RECORDING.status==='approved';}
  async init(){
    try{
      const r=await fetch(new URL('recording.json?v=apple-cast-1',import.meta.url));if(!r.ok)return;
      const manifest=await r.json();if(validateRecording(manifest).length)return;
      Object.assign(RECORDING,manifest);
    }catch{/* An absent or incomplete production manifest stays in device preview. */}
  }
  stop(){this.generation++;this.settle?.('cancelled');this.settle=null;this.player.stop();window.speechSynthesis?.cancel();this.onSpeaker(null);if(this.preview){this.preview.pause();this.preview=null;}}
  async read(text,id){
    this.stop();const gen=this.generation;
    if(this.ready&&RECORDING.entries[id])return this.player.play({id,text});
    if(!window.speechSynthesis){this.onFailure(new Error('Device narration unavailable'));return 'unavailable';}
    for(const part of voiceParts(text)){
      if(gen!==this.generation)return 'cancelled';
      const result=await new Promise(resolve=>{
        this.settle=resolve;const u=new SpeechSynthesisUtterance(part.text);
        const vs=speechSynthesis.getVoices().filter(v=>v.lang.startsWith('en'));
        u.voice=vs.find(v=>/Samantha|Ava|Karen|Google US English/i.test(v.name))||vs[0]||null;
        u.rate=part.speaker==='nib'?.96:part.speaker==='lark'?.94:.95;u.pitch=part.speaker==='nib'?1.06:1;
        u.onstart=()=>{if(gen===this.generation)this.onSpeaker(part.speaker);};
        u.onend=()=>{if(gen===this.generation){this.settle=null;this.onSpeaker(null);resolve('ended');}};
        u.onerror=()=>{if(gen===this.generation){this.settle=null;this.onSpeaker(null);this.onFailure(new Error('Device narration stopped'));resolve('unavailable');}};
        speechSynthesis.speak(u);
      });
      if(result!=='ended')return result;
    }
    return 'ended';
  }
  async sound(letter){
    if(!/^[am]$/.test(letter))return this.read(letter,'support-word');
    this.stop();const gen=this.generation;
    return new Promise(resolve=>{
      this.settle=resolve;const audio=new Audio(storyAsset(new URL(`assets/audio/${letter}.wav`,import.meta.url).href));this.preview=audio;
      audio.onended=()=>{if(gen===this.generation){this.settle=null;resolve('ended');}};
      audio.onerror=()=>{if(gen===this.generation){this.settle=null;this.onFailure(new Error('Sound recording unavailable'));resolve('unavailable');}};
      audio.play().catch(()=>{if(gen===this.generation){this.settle=null;resolve('unavailable');}});
    });
  }
}
