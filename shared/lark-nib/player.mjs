import {NextStage} from './stage.mjs';
import {EpisodeAudio} from './audio.mjs?v=cast-1';
import {writingActivity,sentenceActivity} from './activities.mjs';
import {readingWord} from '../../bag-at-the-door/reading.mjs';
import {initialState,restoreState,markHelp,answer,settle,canFinish,canReport} from './state.mjs';
export function launchEpisode({EPISODE,BEATS,GATES,PASSAGE,base}){
 const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),child=['connor','gabi','max','ethan'].includes(params.get('kid'))?params.get('kid'):null,review=params.get('review')==='1';
 const key=`treasure-quest.${EPISODE.id}:${review?'review:':''}${child||'guest'}`;let state;try{state=restoreState(JSON.parse(localStorage.getItem(key)||'null'),EPISODE,BEATS,GATES);}catch{state=initialState(EPISODE);}
 let run=0,started=false,paused=false,modelBusy=false;
 const stage=new NextStage($('world'),{base,season:EPISODE.seasonNumber});
 const voice=new EpisodeAudio({base,beats:BEATS,onCaption:t=>$('caption').textContent=t,onSpeaker:s=>stage.speaker=s,onFailure:()=>{if(!state.activeGate&&!state.pendingNext)$('retry-audio').hidden=false;}});
 const node=(tag,cls='',text='')=>{const e=document.createElement(tag);e.className=cls;e.textContent=text;return e;};
 const button=(text,click,cls='')=>{const b=node('button',cls,text);b.type='button';b.onclick=click;return b;};
 const beat=()=>BEATS[state.beat];const save=()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{}};const stop=()=>{run++;voice.stop();};
 const helpUsed=id=>{markHelp(state,id);save();};
 function word(w,id){return readingWord({text:w,chunks:[...w].map(text=>({text,sound:text.toLowerCase(),mark:'plain'})),sight:false},{onSupport:()=>helpUsed(id),onSound:l=>voice.sound(l),onWord:async()=>{const generation=run;await voice.say(w);if(GATES[id]?.kind==='blend'&&generation===run&&state.activeGate===id)finishGate(id);}});}
 async function feedback(text){$('feedback').textContent=text;$('feedback').hidden=false;return voice.say(text);}
 function report(attempt){if(!attempt||!child||review||state.reviewed||state.previewOnly||voice.recording?.approved!==true||voice.recording?.status!=='approved')return;window.MightyProgress?.log?.({kid:child,player:child[0].toUpperCase()+child.slice(1),game:EPISODE.gameId,skill:attempt.supported?'Story participation':attempt.measure==='comprehension'?(EPISODE.seasonNumber===1?'Listening comprehension':'Reading comprehension'):attempt.measure==='sound application'?'Initial sounds':'Word recognition',item:`${EPISODE.gameId}:${attempt.id}`,correct:attempt.correct,extra:{episode:EPISODE.id,firstResponse:true,supported:attempt.supported,choice:attempt.choice,measure:attempt.measure}});}
 function continuePending(){if(paused||!state.pendingNext)return;state.pendingNext=null;save();advanceBeat();}
 async function finishGate(id){if(!settle(state,id,GATES))return;save();$('turn').inert=true;$('help').hidden=true;$('retry-audio').hidden=true;const generation=run;await feedback(GATES[id].success);if(generation===run&&!paused)continuePending();}
 function choose(id,value){const result=answer(state,id,value,GATES);if(!result)return;save();report(result.attempt);if(result.correct)finishGate(id);else feedback(GATES[id].hints[value]);}
 function showTurn(id){
  stop();state.activeGate=id;state.pendingNext=null;save();const g=GATES[id],root=$('turn');root.replaceChildren();root.hidden=false;root.inert=false;$('feedback').hidden=true;$('retry-audio').hidden=true;$('caption').textContent=g.prompt;$('help').hidden=['writing','ballast','blend'].includes(g.kind);
  $('help').onclick=()=>{helpUsed(id);if(g.kind==='sentences'){voice.say(g.prompt);return;}feedback(g.hints?.[g.answer]||g.prompt);if(g.phoneme)voice.sound(g.phoneme);};
  if(g.kind==='letters'||g.kind==='words'||g.kind==='pictures'){
   const row=node('div','choice-row');for(const value of g.choices){
    if(g.kind==='words'){
     const card=node('div','word-answer');card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`Choose ${value}`);card.append(word(value,id));card.onclick=()=>choose(id,value);card.onkeydown=e=>{if(e.target===card&&['Enter',' '].includes(e.key)){e.preventDefault();choose(id,value);}};row.append(card);
    }else{const b=button(g.kind==='letters'?value:'',()=>choose(id,value),g.kind==='letters'?'letter-answer':'picture-answer');b.setAttribute('aria-label',`Choose ${value.replaceAll('-',' ')}`);if(g.kind==='pictures')b.append(stage.picture(value));row.append(b);}
   }root.append(row);
   if(g.reread)root.append(button('Read the sentences again',()=>{helpUsed(id);showPassage(id,true);}));
  }else if(g.kind==='blend'){
   const model=node('div','model');model.append(word(g.word,id));model.append(button('Read with Lark',async()=>{if(modelBusy)return;modelBusy=true;helpUsed(id);const generation=run;for(const l of g.word){if(generation!==run)break;await voice.sound(l);}if(generation===run){await voice.say(g.word);if(generation===run)finishGate(id);}modelBusy=false;}));root.append(model);
  }else if(g.kind==='writing')root.append(writingActivity({letter:g.letter,onSupport:()=>helpUsed(id),onDone:()=>finishGate(id)}));
  else if(g.kind==='sentences')showPassage(id);
  else if(g.kind==='ballast'){
   const work=node('div','ballast'),art=stage.picture('sack'),track=document.createElement('input'),meter=document.createElement('progress');meter.max=100;meter.value=0;meter.setAttribute('aria-label','Sand level to the fill line');track.type='range';track.min='0';track.max='100';track.value='0';track.setAttribute('aria-label','Fill sand to the stitched line');
   let done=false;const complete=()=>{if(!done&&Number(track.value)>=97){done=true;finishGate(id);}};track.oninput=()=>{meter.value=Number(track.value);};track.onchange=complete;track.onpointerup=complete;track.onkeyup=complete;work.append(art,meter,track,node('p','activity-instruction','Move the sand to the stitched line.'));root.append(work);
  }
 }
 function showPassage(id,rereading=false){
  const root=$('turn');root.replaceChildren(node('p','reading-name-model','S s · P p — familiar sounds in the names Sam and Pip.'));
  root.append(sentenceActivity({sentences:PASSAGE,onSupport:()=>helpUsed(id),onWord:w=>voice.say(w),onDone:()=>rereading?showTurn(id):finishGate(id)}));
 }
 async function readParagraph(){
  const current=beat(),text=current.paragraphs[state.paragraph],id=`${current.id}:p${state.paragraph+1}`,generation=++run;
  $('caption').textContent=text;$('turn').hidden=true;$('feedback').hidden=true;$('help').hidden=true;$('retry-audio').hidden=true;save();const result=await voice.read(text,id);
  if(generation!==run||paused)return;if(result==='ended'){
   if(state.paragraph<current.paragraphs.length-1){state.paragraph++;readParagraph();}
   else{if(current.sound){await voice.sound(current.sound);if(generation!==run||paused)return;}if(current.gate&&!state.completed.includes(current.gate))showTurn(current.gate);else advanceBeat();}
  }
 }
 function advanceBeat(){stop();if(state.beat===BEATS.length-1){if(canFinish(state,BEATS,GATES)){state.finished=true;save();finish();}return;}state.beat++;state.paragraph=0;state.activeGate=null;save();showBeat();}
 function showBeat(){stage.show(beat());$('status').textContent=beat().scene==='ridge'?'The ridge waystation':beat().scene==='creek'?'The creek landing':'The woodland path';if(state.pendingNext)continuePending();else if(state.activeGate)showTurn(state.activeGate);else readParagraph();}
 function finish(){stop();document.body.classList.remove('in-story');$('story').hidden=true;$('finish').hidden=false;$('pause').disabled=true;if(canReport(state,{child,review,recording:voice.recording},BEATS,GATES)&&!state.completionReported){const queued=window.MightyProgress?.log?.({kid:child,player:child[0].toUpperCase()+child.slice(1),game:EPISODE.gameId,skill:'Story participation',item:EPISODE.completionItem,correct:null,extra:{episode:EPISODE.id,completed:true}});if(queued!==false&&typeof window.MightyProgress?.log==='function'){state.completionReported=true;save();}} }
 function start(reset=false){stop();if(reset)state=initialState(EPISODE);started=true;paused=false;if(voice.recording?.approved!==true)state.previewOnly=true;save();document.body.classList.add('in-story');$('welcome').hidden=true;$('finish').hidden=true;$('story').hidden=false;$('pause').disabled=false;if(state.finished)finish();else showBeat();}
 function pause(){if(paused)return;paused=true;if(voice.player.active)voice.pause();else stop();if(!$('paused').open)$('paused').showModal();}
 $('start').onclick=()=>start();$('restart').onclick=()=>start(true);$('replay').onclick=()=>start(true);$('pause').onclick=pause;
 $('resume').onclick=()=>{paused=false;$('paused').close();if(voice.player.active)voice.resume();else if(state.pendingNext)continuePending();else if(!state.activeGate)readParagraph();};
 $('again').onclick=()=>state.activeGate?voice.say(GATES[state.activeGate].prompt):readParagraph();$('retry-audio').onclick=readParagraph;
 $('grownup').onclick=()=>{stop();paused=true;$('local-notes').textContent=JSON.stringify({previewOnly:review||state.reviewed||state.previewOnly||!voice.recording?.approved,attempts:state.attempts,supported:state.helped,completed:state.completed},null,2);$('parent').showModal();};
 $('close-parent').onclick=()=>{$('parent').close();paused=false;if(started&&!state.finished){if(state.pendingNext)continuePending();else if(!state.activeGate)readParagraph();}};
 for(const [id,g]of Object.entries(GATES)){const o=node('option','',g.prompt);o.value=id;$('turn-select').append(o);}
 $('preview-turn').onclick=()=>{stop();const id=$('turn-select').value;state.reviewed=true;state.finished=false;state.pendingNext=null;state.beat=BEATS.findIndex(b=>b.gate===id);state.paragraph=beat().paragraphs.length-1;state.completed=state.completed.filter(x=>x!==id);started=true;paused=false;document.body.classList.add('in-story');$('welcome').hidden=true;$('finish').hidden=true;$('story').hidden=false;$('pause').disabled=false;stage.show(beat());showTurn(id);$('parent').close();};
 BEATS.forEach((b,i)=>{const o=node('option','',`${i+1}. ${b.id.replaceAll('-',' ')}`);o.value=i;$('scene-select').append(o);});
 $('preview-scene').onclick=()=>{stop();state.beat=Number($('scene-select').value);state.paragraph=0;state.reviewed=true;state.finished=false;state.pendingNext=null;state.activeGate=null;started=true;paused=false;$('parent').close();document.body.classList.add('in-story');$('welcome').hidden=true;$('finish').hidden=true;$('story').hidden=false;$('pause').disabled=false;showBeat();};
 const home=['localhost','127.0.0.1'].includes(location.hostname)?'https://mighty-mini-missions.netlify.app/classroom/':'../classroom/';for(const id of ['joyce-return','finish-return'])$(id).href=home+(child?`?kid=${child}`:'');
 $('read').onclick=()=>{$('chapter').replaceChildren();if(PASSAGE.length)for(const line of PASSAGE)$('chapter').append(node('p','collection-page',line));else $('chapter').append(node('p','support-hint','A grown-up reads: I'),word('am','chapter'),node('p','support-hint','a sailor.'));$('library').showModal();};$('close-library').onclick=()=>$('library').close();
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!state.finished)pause();});window.addEventListener('pagehide',()=>{save();voice.stop();});
 Promise.all([stage.load((n,total)=>$('start').textContent=`Getting the crew ready ${n}/${total}…`),voice.load()]).then(()=>{$('start').disabled=false;$('start').textContent=state.finished?'Open our collection':state.beat||state.activeGate||state.pendingNext?'Resume our adventure':'Begin our adventure';$('restart').hidden=!state.beat&&!state.activeGate&&!state.pendingNext&&!state.finished;$('audio-status').textContent=voice.recording.approved?'Narrated with the approved episode recording.':'Temporary preview voices · final cast recording pending';const duration=voice.recording.sourceDuration??voice.recording.narrationDuration;const seconds=Math.round(duration);$('production-status').textContent=`${EPISODE.title}. ${voice.recording.approved?'Supplied ElevenLabs':'Temporary local'} narration: ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}. ${EPISODE.nonReadingInteractions} extra non-reading activities. ${voice.recording.approved?'Short help and word models still use temporary preview voices. Review links and parent previews send no learning evidence.':'This preview sends no learning evidence and cannot complete a Joyce card.'}`;}).catch(error=>{$('audio-status').textContent='Some preview assets could not load. Reload to try again.';$('start').textContent='Reload preview';$('start').disabled=false;$('start').onclick=()=>location.reload();console.error(error);});
}
