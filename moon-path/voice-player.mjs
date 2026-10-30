export function validOffset(value,duration){
  return Number.isFinite(value)&&value>0&&Number.isFinite(duration)
    ?Math.min(value,Math.max(0,duration-.15)):0;
}

export function cueAt(cues,time){
  if(!Array.isArray(cues))return null;
  return cues.find(c=>time>=c.start&&time<c.end)||null;
}

// One media element owns the story clock. Pauses, help, seeking and scene
// changes cancel its listeners before another recording can start.
export class VoicePlayer{
  constructor({audio,getEntry,baseURL,onCue=()=>{},onProgress=()=>{},onError=()=>{},onStopped=()=>{}}){
    this.audio=audio;this.audio.preload='auto';this.getEntry=getEntry;this.baseURL=baseURL;
    this.onCue=onCue;this.onProgress=onProgress;this.onError=onError;this.onStopped=onStopped;
    this.serial=0;this.active=null;this.finish=null;this.lastCue=null;this.failed=false;
  }
  stop(){
    if(this.active)this.onProgress(this.active.line,this.audio.currentTime||0);
    this.audio.pause();this.serial++;this.finish?.('cancelled');this.onStopped();
  }
  async play(line,{offset=0}={}){
    this.stop();if(!line?.text)return;
    const entry=this.getEntry(line.id);
    if(!entry){this.onError(new Error('Missing recording'),line);return;}
    const serial=this.serial,seek=validOffset(offset,entry.duration);
    this.active={line,entry};this.lastCue=null;this.failed=false;
    this.audio.src=new URL(entry.file,this.baseURL).href;
    this.audio.playbackRate=entry.source==='elevenlabs-upload'?1:.95;
    this.audio.preservesPitch=true;
    return new Promise(resolve=>{
      let settled=false;
      const done=status=>{
        if(settled)return;settled=true;
        this.audio.onended=null;this.audio.onerror=null;this.audio.ontimeupdate=null;this.audio.onloadedmetadata=null;
        this.finish=null;this.active=null;this.onStopped();resolve(status);
      };
      this.finish=done;
      const tick=()=>{
        if(serial!==this.serial||settled)return;
        const time=this.audio.currentTime||0;
        const cue=cueAt(entry.cues,time);
        if(cue!==this.lastCue){this.lastCue=cue;this.onCue(cue,line);}
        this.onProgress(line,time);
      };
      this.audio.onloadedmetadata=()=>{if(serial!==this.serial||settled)return;this.audio.currentTime=seek;tick();};
      this.audio.ontimeupdate=tick;
      this.audio.onended=()=>{tick();done('ended');};
      const fail=error=>{if(serial!==this.serial||settled)return;this.failed=true;this.audio.pause();this.onError(error,line);};
      this.audio.onerror=()=>fail(new Error('Recording could not load'));
      this.audio.play().catch(fail);
      if(!seek)tick();
    });
  }
  pause(){this.audio.pause();if(this.active)this.onProgress(this.active.line,this.audio.currentTime||0);}
  resume(){
    if(!this.active)return;
    if(this.failed){
      const offset=this.audio.currentTime||0;this.failed=false;
      this.audio.load();
      this.audio.onloadedmetadata=()=>{if(this.active)this.audio.currentTime=validOffset(offset,this.active.entry.duration);};
    }
    const serial=this.serial;
    this.audio.play().catch(error=>{if(this.active&&serial===this.serial){this.failed=true;this.onError(error,this.active.line);}});
  }
  repeatCue(){
    if(!this.active)return;
    const cue=cueAt(this.active.entry.cues,this.audio.currentTime||0);
    this.audio.currentTime=cue?.start||0;this.lastCue=null;
    this.audio.ontimeupdate?.();this.resume();
  }
  get position(){return {id:this.active?.line.id,time:this.audio.currentTime||0,duration:this.active?.entry.duration||0};}
}
