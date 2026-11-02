import {EPISODE,BEATS,GATES,CHAPTER} from './episode.mjs';
import {freshState,restore,respond,addHelp,completeGate,releaseApple,placeMap,canFinish,canReport} from './logic.mjs';
import {AppleStage} from './stage.mjs?v=apple-cast-1';
import {Narrator,RECORDING} from './narration.mjs?v=apple-cast-1';
import {readingWord} from './reading.mjs';

const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const child=['max','gabi','connor','ethan'].includes(params.get('kid'))?params.get('kid'):null,review=params.get('review')==='1';
const storageKey=`treasure-quest.${EPISODE.id}:${review?'review:':''}${child||'guest'}`;
let state;try{state=restore(JSON.parse(localStorage.getItem(storageKey)||'null'));}catch{state=freshState();}
let run=0,started=false,paused=false,resumeRecorded=false,modelBusy=false,pieceSelected=false;
const stage=new AppleStage($('world'));
const voice=new Narrator({onSpeaker:s=>stage.speaker=s,onCaption:text=>$('caption').textContent=text,onFailure:()=>{$('next').hidden=false;}});
const beat=()=>BEATS[state.beat];
const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{/* Preview remains playable without storage. */}};
const stop=()=>{run++;resumeRecorded=false;voice.stop();};
const node=(tag,cls='',text='')=>{const n=document.createElement(tag);n.className=cls;n.textContent=text;return n;};
const button=(text,fn,cls='')=>{const b=node('button',cls,text);b.type='button';b.onclick=fn;return b;};
const art=(name,alt='',cls='')=>{const i=node('img',cls);i.src=`./assets/${name}.png`;i.alt=alt;i.draggable=false;return i;};
const say=text=>voice.read(text,'support');
let effects;
function storySound(cloth=false){
 try{const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;effects??=new AudioContext();effects.resume();const t=effects.currentTime,d=cloth?.12:.07,buffer=effects.createBuffer(1,Math.ceil(effects.sampleRate*d),effects.sampleRate),data=buffer.getChannelData(0);let seed=cloth?31:17;
  for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=(seed/1073741823.5-1)*Math.exp(-i/data.length*8)*.13;}
  const source=effects.createBufferSource(),filter=effects.createBiquadFilter();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=cloth?280:900;source.connect(filter).connect(effects.destination);source.start(t);
 }catch{/* The picture and speech still carry the action with effects off. */}
}
async function feedback(text,sound){$('feedback').hidden=false;$('feedback').textContent=text;const result=await say(text);if(sound&&result==='ended')await voice.sound(sound);}
function reportAttempt(attempt){
 if(!attempt||!child||review||state.reviewed||!voice.ready)return;
 window.MightyProgress?.log?.({player:child[0].toUpperCase()+child.slice(1),game:'apple-catcher',skill:attempt.supported?'Story participation':attempt.measure==='initial-sound discrimination'?'Initial sounds':'Letter sounds',item:`apple-catcher:${attempt.id}`,correct:attempt.correct,extra:{episode:EPISODE.id,firstResponse:true,supported:attempt.supported,choice:attempt.choice,measure:attempt.measure}});
}
function finishGate(id){if(!completeGate(state,id))return;save();$('next').hidden=false;$('help').hidden=true;feedback(GATES[id].success);}
function hint(id){addHelp(state,id);save();const g=GATES[id];feedback(g.hints?.[g.answer]||'We can take this little step together.',id==='review-m'?'m':id==='find-a'||id==='choose-ant'?'a':null);}
function choose(id,choice){
 const result=respond(state,id,choice);if(!result)return;reportAttempt(result.attempt);
 if(!result.correct){addHelp(state,id);save();feedback(GATES[id].hints[choice],id==='review-m'?'m':'a');return;}
 if(id==='find-a'){state.firstCatch=true;finishGate(id);}
 else if(id==='choose-ant'){state.chosenMark=true;save();renderSequence();feedback('Ant and apple start alike. Fasten the loop, then release an apple.');}
 else finishGate(id);
}
function showTurn(id){
 stop();state.atTurn=true;save();$('turn').hidden=false;$('turn').replaceChildren();$('next').hidden=true;$('feedback').hidden=true;
 const g=GATES[id];$('caption').textContent=g.prompt;$('help').hidden=['story','model'].includes(g.kind);$('help').onclick=()=>hint(id);
 if(id==='review-m'){
  const row=node('div','choice-row');for(const l of g.choices){const b=button(l,()=>choose(id,l),'letter-choice');b.setAttribute('aria-label',`Choose ${l}`);row.append(b);}$('turn').append(row);
 }else if(id==='find-a'){
  const frame=node('div','mechanism');frame.append(art('catcher-loose','The loose catcher corner beside two letter catches'));
  for(const [i,l]of g.choices.entries()){const b=button(l,()=>choose(id,l),`letter-choice ${i?'catch-right':'catch-left'}`);b.setAttribute('aria-label',`Choose ${l} catch`);frame.append(b);}$('turn').append(frame);
 }else if(id==='choose-ant'){
  if(state.chosenMark){renderSequence();return;}
  const row=node('div','choice-row');for(const name of g.choices){const b=button('',()=>choose(id,name),'picture-choice');b.setAttribute('aria-label',`Choose ${name}`);b.append(art(name+'-mark',name==='ant'?'Carved ant with six legs':'Carved crescent moon'));row.append(b);}$('turn').append(row);
 }else if(id==='blend-am')renderBlend();
 else if(id==='fit-map')renderMap();
}
function renderSequence(){
 $('turn').replaceChildren();$('caption').textContent='Fasten the cloth loop, then release an apple.';
 const frame=node('div','mechanism');frame.append(art(state.applesReleased?'catcher-caught':state.loopFastened?'catcher-ready':'catcher-loose','Apple chute held above a cloth catcher on its wooden frame'));
 const loop=button('',()=>{state.loopFastened=true;storySound();save();renderSequence();feedback('The loop is fastened. Now the cloth can catch an apple.');},`story-object fasten-object${state.loopFastened?' done-object':''}`);loop.setAttribute('aria-label',state.loopFastened?'Cloth loop fastened':'Fasten the cloth loop');loop.append(art('ant-mark','The ant-marked loop fastening'));loop.disabled=state.loopFastened;
 const release=button('',()=>{
  if(!releaseApple(state)){state.actions??=[];state.actions.push('release-before-fastening');save();feedback('The loop is still loose. The apple will wait here. Fasten the cloth loop first.');return;}
  storySound(true);save();renderSequence();finishGate('choose-ant');
 },'story-object release-object');release.setAttribute('aria-label',state.applesReleased?'Apple safely caught':'Release an apple');release.hidden=state.applesReleased;release.disabled=state.applesReleased;
 frame.append(loop,release);$('turn').append(frame,node('p','step-note',state.applesReleased?'The apple is safe in the cloth.':state.loopFastened?'The loop holds. The apple can come down.':'The cloth loop is loose. The apples are waiting.'));
 if(state.loopFastened&&state.applesReleased)finishGate('choose-ant');
}
function word(id){return readingWord('am',{onSupport:()=>{addHelp(state,id);save();},onSound:l=>voice.sound(l),onWord:async()=>{const generation=run;await say('am');if(id==='blend-am'&&generation===run&&state.atTurn&&beat().gate==='blend-am'){state.modelCompleted=true;save();$('word-ready').disabled=false;}}});}
function renderBlend(){
 const model=node('div','model'),done=button('Our word is ready',()=>finishGate('blend-am'));done.id='word-ready';done.disabled=!state.modelCompleted;model.append(word('blend-am'));
 const listen=button('Listen with Lark',async()=>{
  if(modelBusy)return;modelBusy=true;listen.disabled=true;const generation=run;addHelp(state,'blend-am');save();
  for(const l of ['a','m']){if(generation!==run)break;await voice.sound(l);}
  if(generation===run){await say('am');state.modelCompleted=true;save();done.disabled=false;}modelBusy=false;listen.disabled=false;
 });
 const controls=node('div','model-buttons');controls.append(listen,done);model.append(controls,node('p','adult-note','You can slide the two sounds, say the word with us, or listen to Lark.'));$('turn').append(model);
}
function renderMap(){
 $('turn').replaceChildren();pieceSelected=false;
 if(!state.boxOpen){
  const open=button('',()=>{state.boxOpen=true;save();renderMap();feedback('A map piece. Match its apple mark to the apple-marked space.');},'story-object box-object');open.setAttribute('aria-label','Open the route box');open.append(art('route-box','Closed wooden route box with a brass lift latch'));$('turn').append(open);return;
 }
 const work=node('div','map-work'),board=node('div','map-board');board.append(art('map-board','Original map section beside four empty spaces; the first space carries an apple mark'));
 const slot=button('',()=>drop(),'map-slot');slot.id='map-slot';slot.setAttribute('aria-label','Apple-marked map space');
 const piece=button('',()=>select(),'story-object map-piece');piece.id='map-piece';piece.setAttribute('aria-label','Pick up the orchard map piece');piece.append(art('map-section','Orchard map section with an apple mark'));
 let dragging=false,origin=null,settled=state.mapPlaced;
 const select=()=>{if(settled)return;pieceSelected=true;piece.classList.add('selected');slot.classList.add('ready');};
 const drop=()=>{
  if(settled)return;if(!pieceSelected){feedback('Pick up the orchard piece first.');return;}
  if(!placeMap(state,true))return;settled=true;storySound();piece.style.transform='';piece.hidden=true;slot.append(art('map-section','The orchard section fitted into its matching space'));slot.disabled=true;stage.current={...beat(),visual:'found'};save();finishGate('fit-map');
 };
 piece.onpointerdown=e=>{if(settled)return;e.preventDefault();dragging=true;origin={x:e.clientX,y:e.clientY};select();piece.setPointerCapture(e.pointerId);};
 piece.onpointermove=e=>{if(dragging)piece.style.transform=`translate(${e.clientX-origin.x}px,${e.clientY-origin.y}px)`;};
 piece.onpointerup=e=>{if(!dragging)return;dragging=false;const r=slot.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)drop();else{piece.style.transform='';feedback('Keep the piece. Its apple mark belongs with the apple-marked space.');}};
 piece.onpointercancel=()=>{dragging=false;piece.style.transform='';};
 board.append(slot);work.append(board,piece);$('turn').append(work,node('p','adult-note','Drag the piece into its space, or tap the piece and then tap its space.'));
 if(state.mapPlaced){piece.hidden=true;slot.append(art('map-section','The orchard section in place'));slot.disabled=true;finishGate('fit-map');}
}
async function readParagraph(){
 const current=beat(),id=`${current.id}:p${state.paragraph+1}`,text=current.paragraphs[state.paragraph],generation=++run;
 $('caption').textContent=RECORDING.entries[id]?.spokenText||text;$('turn').hidden=true;$('feedback').hidden=true;$('help').hidden=true;$('next').hidden=voice.ready;save();
 const result=await voice.read(text,id);if(generation!==run||paused)return;
 if(result==='ended'){if(EPISODE.soundModels[id])await voice.sound(EPISODE.soundModels[id]);if(generation===run&&!paused)advanceParagraph();}
}
function advanceParagraph(){if(state.atTurn)return;if(state.paragraph<beat().paragraphs.length-1){state.paragraph++;save();readParagraph();}else if(beat().gate&&!state.completed.includes(beat().gate))showTurn(beat().gate);else advanceBeat();}
function advanceBeat(){stop();if(state.beat===BEATS.length-1){if(canFinish(state)){state.finished=true;save();finish();}return;}state.beat++;state.paragraph=0;state.atTurn=false;save();showBeat();}
function showBeat(){stage.show(beat(),state);$('scene-name').textContent=beat().scene==='camp'?'Explorer Camp':'The apple orchard';if(state.atTurn&&!state.completed.includes(beat().gate))showTurn(beat().gate);else readParagraph();}
function finish(){
 stop();stage.show(BEATS.at(-1),state);$('story').hidden=true;$('finish').hidden=false;$('pause').disabled=true;
 if(canReport(state,{child,review,recordingReady:voice.ready})&&!state.completionReported){const queued=window.MightyProgress?.log?.({player:child[0].toUpperCase()+child.slice(1),game:'apple-catcher',skill:'Story participation',item:EPISODE.completionItem,correct:null,extra:{episode:EPISODE.id,completed:true}});if(queued!==false&&typeof window.MightyProgress?.log==='function'){state.completionReported=true;save();window.MightyProgress.flush?.();}}
}
function start(reset=false){stop();if(reset){state=freshState();save();}started=true;paused=false;$('welcome').hidden=true;$('finish').hidden=true;$('story').hidden=false;$('pause').disabled=false;if(state.finished)finish();else showBeat();}
$('start').onclick=()=>start();$('restart').onclick=()=>start(true);$('replay').onclick=()=>start(true);
$('next').onclick=()=>{const skipped=Boolean(voice.player.active);stop();if(state.atTurn)return;if(!voice.ready||skipped)state.reviewed=true;if(beat().gate&&state.completed.includes(beat().gate)&&state.paragraph===beat().paragraphs.length-1)advanceBeat();else advanceParagraph();};
$('again').onclick=()=>state.atTurn?say(GATES[beat().gate].prompt):readParagraph();
function pauseStory(){paused=true;if(voice.player.active){resumeRecorded=true;voice.player.pause();stage.speaker=null;}else stop();if(!$('paused').open)$('paused').showModal();}
$('pause').onclick=pauseStory;$('resume').onclick=()=>{paused=false;$('paused').close();if(resumeRecorded&&voice.player.active){resumeRecorded=false;voice.player.resume();}else if(state.atTurn)say(GATES[beat().gate].prompt);else readParagraph();};
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();
$('grownup').onclick=()=>{stop();paused=true;$('production-status').textContent=`${EPISODE.title}. Season 1 target: 8–10 minutes including normal turns. Narration: ${voice.ready?'6 minutes 40 seconds, with five pauses for your turns':'device preview; episode recording unavailable'}. First responses, support and story completion are separate.`;$('local-notes').textContent=JSON.stringify({attempts:state.attempts,helped:state.helped,actions:state.actions||[],completed:state.completed,mapSections:state.mapPlaced?2:1,reviewOnly:review||!voice.ready||state.reviewed},null,2);$('parent').showModal();};
$('parent').onclose=()=>{paused=false;if(started&&!state.finished&&!state.atTurn)readParagraph();};
BEATS.forEach((b,i)=>{const o=node('option','',`${i+1}. ${b.id.replaceAll('-',' ')}`);o.value=i;$('scene-select').append(o);});
$('jump').onclick=()=>{stop();state.beat=Number($('scene-select').value);state.paragraph=0;state.atTurn=false;state.reviewed=true;state.finished=false;if(state.beat>=6){state.firstCatch=true;state.loopFastened=true;state.applesReleased=true;}save();started=true;$('parent').close();$('welcome').hidden=true;$('finish').hidden=true;$('story').hidden=false;$('pause').disabled=false;showBeat();};
$('read').onclick=()=>{stop();$('chapter').replaceChildren();for(const row of CHAPTER){const line=node('div','shared-line');line.append(node('p','',row.adult),word('chapter-am'),node('p','',row.end));$('chapter').append(line,button('Model am',()=>say('am')));}$('library').showModal();};
const joyceBase=['localhost','127.0.0.1'].includes(location.hostname)?'https://mighty-mini-missions.netlify.app/classroom/':'../classroom/';for(const id of ['joyce-return','finish-return'])$(id).href=joyceBase+(child?`?kid=${child}`:'');
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!state.finished)pauseStory();});window.addEventListener('pagehide',()=>{save();voice.stop();});
Promise.all([voice.init(),stage.load((n,total)=>$('start').textContent=`Getting the crew ready ${n}/${total}…`)]).then(()=>{$('start').disabled=false;$('start').textContent=state.finished?'Open our collection':state.beat||state.paragraph||state.atTurn?'Continue our adventure':'Begin our adventure';$('restart').hidden=!state.beat&&!state.paragraph&&!state.atTurn&&!state.finished;$('audio-status').textContent=voice.ready?'Narrated with the supplied episode recording.':'Production preview with device narration. The new cast recording is pending.';}).catch(()=>{$('audio-status').textContent='Some story art could not load. Reload to try again.';$('start').textContent='Reload the story';$('start').disabled=false;$('start').onclick=()=>location.reload();});
