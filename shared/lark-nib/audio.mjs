import {storyAsset} from '../story-cache.mjs';
import {validateProductionRecording} from './recording.mjs';
import {VoicePlayer} from '../../moon-path/voice-player.mjs';
export class EpisodeAudio{
 constructor({base,beats,onCaption=()=>{},onSpeaker=()=>{},onFailure=()=>{}}){this.base=base;this.beats=beats;this.recording=null;this.story=false;this.audio=new Audio();this.onSpeaker=onSpeaker;this.player=new VoicePlayer({audio:this.audio,baseURL:base,getEntry:id=>this.recording?.entries[id],onCue:cue=>{onSpeaker(cue?.speaker||null);if(this.story&&cue)onCaption(cue.text);},onStopped:()=>onSpeaker(null),onError:onFailure});}
 async load(){
  const response=await fetch(new URL('preview-recording.json',this.base));if(!response.ok)throw new Error('Preview recording unavailable');const preview=await response.json();if(!preview.entries||Object.keys(preview.entries).length===0)throw new Error('Preview recording is empty');
  this.recording=preview;
  try{const r=await fetch(new URL('recording.json?v=cast-1',this.base));if(r.ok){const cast=await r.json();if(validateProductionRecording(cast,this.beats).length===0)this.recording={...cast,support:preview.support};}}catch{/* Keep the complete local preview until the approved cast is aligned. */}
 }
 stop(){this.player.stop();if(this.effect){this.effect.pause();this.effectResolve?.('cancelled');this.effect=null;this.effectResolve=null;}this.onSpeaker(null);}
 read(text,id){this.stop();this.story=true;return this.player.play({id,text});}
 async say(text){this.stop();this.story=false;const entry=this.recording?.support?.[text];if(!entry)return 'unavailable';const id=`support:${text}`;this.recording.entries[id]=entry;return this.player.play({id,text});}
 sound(letter){this.stop();this.story=false;const ext=letter==='f'?'mp3':'wav';return new Promise(resolve=>{const a=new Audio(storyAsset(new URL(`assets/audio/${letter}.${ext}`,this.base).href));this.effect=a;this.effectResolve=resolve;a.onended=()=>{this.effect=null;this.effectResolve=null;resolve('ended');};a.onerror=()=>resolve('unavailable');a.play().catch(()=>resolve('unavailable'));});}
 pause(){this.player.pause();this.onSpeaker(null);}
 resume(){return this.player.resume();}
}
