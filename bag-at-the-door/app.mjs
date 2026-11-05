import {EPISODE,BEATS,GATES,CHAPTER} from './episode.mjs';
import {freshState,restore,addHelp,respond,completeGate,canFinish,canReport} from './logic.mjs';
import {readingWord} from './reading.mjs';
import {DoorStage} from './stage.mjs?v=original-art-4';
import {Narrator,RECORDING} from './narration.mjs?v=cast-1';
import {storyAsset} from '../shared/story-cache.mjs';

const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const child=['max','gabi','connor','ethan'].includes(params.get('kid'))?params.get('kid'):null;
const review=params.get('review')==='1',storageKey=`treasure-quest.${EPISODE.id}:${review?'review:':''}${child||'guest'}`;
let state;try{state=restore(JSON.parse(localStorage.getItem(storageKey)||'null'));}catch{state=freshState();}
let paragraph=0,turnOpen=false,run=0,started=false,paused=false,resumeRecorded=false,modelPlayed=false,selectedMail=null,strapSelected=false;
const stage=new DoorStage($('world'));
const voice=new Narrator({onSpeaker:s=>stage.speaker=s,onCaption:text=>$('caption').textContent=text,onFailure:()=>{$('next').hidden=false;}});
const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{/* Story works without persistent storage. */}};
const stop=()=>{run++;resumeRecorded=false;voice.stop();};
const beat=()=>BEATS[state.beat];
const saySupport=text=>voice.read(text,'support');
const joyceBase=['localhost','127.0.0.1'].includes(location.hostname)?'https://mighty-mini-missions.netlify.app/classroom/':'../classroom/';
for(const id of ['joyce-return','finish-return']){
  const link=$(id);link.href=`${joyceBase}${child?`?kid=${encodeURIComponent(child)}`:''}`;
  link.addEventListener('click',()=>{save();window.MightyProgress?.flush?.({keepalive:true});});
}
function button(text,fn,cls=''){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;b.addEventListener('click',fn);return b;}
function node(tag,cls='',text=''){const n=document.createElement(tag);n.className=cls;n.textContent=text;return n;}
function artwork(name,alt='',cls=''){const img=document.createElement('img');img.src=storyAsset(`./assets/${name}.png`);img.alt=alt;img.className=cls;img.draggable=false;return img;}
function reportAttempt(attempt){
  // Device narration and scene review are rehearsal only. Never create child evidence from this preview.
  if(!attempt||!child||review||state.reviewed||!voice.ready)return;
  window.MightyProgress?.log?.({kid:child,player:child[0].toUpperCase()+child.slice(1),game:'bag-at-the-door',skill:attempt.supported?'Story participation':'Word recognition',item:`bag-at-the-door:${attempt.id}`,correct:attempt.correct,extra:{episode:EPISODE.id,firstResponse:true,supported:attempt.supported,choice:attempt.choice,measure:attempt.measure}});
}
function feedback(text){$('feedback').hidden=false;$('feedback').textContent=text;saySupport(text);}
function help(id){addHelp(state,id);save();const g=GATES[id];feedback(g.hints?.[g.answer]||'Try the same little step with us. We can hold our places.');}
function word(word,id){return readingWord(word,{onSupport:()=>{addHelp(state,id);save();},onSound:l=>voice.sound(l),onWord:w=>saySupport(w)});}
function finishGate(id){completeGate(state,id);save();turnOpen=false;$('help').hidden=true;$('next').hidden=false;feedback(GATES[id].success);}
function showTurn(id){
  stop();turnOpen=true;modelPlayed=false;$('turn').hidden=false;$('turn').replaceChildren();$('next').hidden=true;
  const g=GATES[id];$('caption').textContent=g.prompt;$('help').hidden=g.kind==='story'||g.kind==='model';
  $('help').onclick=()=>help(id);const root=$('turn');
  if(['review','modeled-transfer'].includes(g.kind)){
    const row=node('div','choice-row');
    for(const w of g.words){
      const card=node('div','word-choice');card.append(word(w,id));
      card.setAttribute('role','button');card.setAttribute('aria-label',`Choose ${w}`);card.tabIndex=0;
      const choose=()=>{
        const result=respond(state,id,w);save();if(!result)return;reportAttempt(result.attempt);
        if(!result.correct){addHelp(state,id);save();feedback(g.hints[w]);return;}
        if(id==='find-pad'){
          root.replaceChildren(node('p','turn-title','The cupboard opens.'));
          const pad=button('',()=>{stage.visual='padded';finishGate(id);},'pad-prop');pad.setAttribute('aria-label','Take the pad');pad.append(artwork('felt-pad','Soft folded felt pad'));root.append(pad);
          feedback('A soft felt pad. Take it to protect the latch.');
        }else finishGate(id);
      };
      card.addEventListener('click',choose);
      card.addEventListener('keydown',e=>{if(e.target===card&&['Enter',' '].includes(e.key)){e.preventDefault();choose();}});
      row.append(card);
    }root.append(row);
  }else if(id==='model-pad'){
    const model=node('div','model');model.append(word('pad',id));const controls=node('div','model-buttons');
    const done=button('Our word is ready',()=>{if(modelPlayed)finishGate(id);});done.disabled=true;
    const modelButton=button('Listen with Lark',async()=>{
      modelButton.disabled=true;addHelp(state,id);save();const generation=run;
      for(const l of ['p','a','d']){if(generation!==run)break;await voice.sound(l);}
      if(generation===run){await saySupport('pad');modelPlayed=true;done.disabled=false;}modelButton.disabled=false;
    });
    controls.append(button('Hear d',()=>voice.sound('d')),modelButton,done);model.append(controls);root.append(model);
  }else if(id==='free-strap')renderStrap(root,id);
  else if(id==='pack-invitations')renderPacking(root,id);
}
function renderStrap(root,id){
  strapSelected=false;let dragging=false,origin=null,settled=false;
  const wrap=node('div','work-view'),scene=node('div','latch-art');
  scene.append(artwork('latch-closeup','Raised brass latch with a felt-protected catch and a clear opening','latch-plate'));
  const gap=button('',()=>drop(),'gap-hit');gap.id='strap-gap';gap.setAttribute('aria-label','Guide the strap through the opening');
  const strap=button('',()=>select(),'strap-prop');strap.id='loose-strap';strap.setAttribute('aria-label','Pick up the loose strap');strap.append(artwork('strap-loop','Loose woven cloth strap'));
  const select=()=>{if(settled)return;strapSelected=true;strap.classList.add('selected');gap.classList.add('ready');feedback('The strap is in your hand. Bring it through the clear opening.');};
  const drop=()=>{if(settled)return;if(!strapSelected){feedback('Pick up the loose strap first.');return;}settled=true;dragging=false;strap.style.transform='';strap.hidden=true;strap.disabled=true;gap.disabled=true;stage.visual='free';finishGate(id);};
  strap.addEventListener('pointerdown',e=>{if(settled)return;e.preventDefault();dragging=true;origin={x:e.clientX,y:e.clientY};select();strap.setPointerCapture(e.pointerId);});
  strap.addEventListener('pointermove',e=>{if(dragging)strap.style.transform=`translate(${e.clientX-origin.x}px,${e.clientY-origin.y}px)`;});
  strap.addEventListener('pointerup',e=>{
    if(!dragging)return;dragging=false;
    const r=gap.getBoundingClientRect();
    if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)drop();
    else strap.style.transform='';
  });
  strap.addEventListener('pointercancel',()=>{dragging=false;strap.style.transform='';});
  scene.append(gap,strap);wrap.append(scene);root.append(wrap,node('p','adult-note','Drag the strap, or tap it and then tap the opening. Lark and Nib will keep holding.'));
}
const PICTURES={hut:{art:'invitation-hut',name:'reed hut'},mill:{art:'invitation-mill',name:'mill wheel'},fern:{art:'invitation-fern',name:'fern'}};
function renderPacking(root,id){
  root.replaceChildren();selectedMail=null;
  const board=node('div','pack-board'),mail=node('div','mail-row'),bag=node('div','bag-pockets');
  const img=document.createElement('img');img.src=storyAsset('./assets/courier-bag.png');img.alt='Courier bag with three front pockets';bag.append(img);
  const choose=k=>{selectedMail=k;for(const b of mail.children)b.classList.toggle('selected',b.dataset.mail===k);};
  const drop=k=>{
    if(!selectedMail){feedback('Pick an invitation, then its matching pocket.');return;}
    if(selectedMail!==k){feedback(`Keep that invitation in your hand. This pocket has the ${PICTURES[k].name} picture.`);return;}
    if(!state.packed.includes(k))state.packed.push(k);save();renderPacking(root,id);
    if(state.packed.length===3)stage.visual='packed';else feedback('One invitation is in its own pocket. Choose the next one.');
  };
  for(const[k,p]of Object.entries(PICTURES)){
    if(!state.packed.includes(k)){
      const b=button('',()=>choose(k),'mail');b.append(artwork(p.art,`${p.name} invitation`));b.dataset.mail=k;b.setAttribute('aria-label',`Pick ${p.name} invitation`);b.draggable=true;
      b.addEventListener('dragstart',e=>{selectedMail=k;e.dataTransfer.setData('text/plain',k);});mail.append(b);
    }
    const pock=button('',()=>drop(k),`pocket${state.packed.includes(k)?' filled':''}`);pock.append(artwork(p.art,`${p.name} picture`));pock.dataset.pocket=k;pock.setAttribute('aria-label',`${p.name} pocket${state.packed.includes(k)?' filled':''}`);
    pock.disabled=state.packed.includes(k);pock.addEventListener('dragover',e=>e.preventDefault());pock.addEventListener('drop',e=>{e.preventDefault();drop(k);});bag.append(pock);
  }board.append(mail,bag);root.append(board);
  if(state.packed.length===3)finishGate(id);
}
async function readParagraph(){
  const current=beat(),text=current.paragraphs[paragraph],generation=++run;
  $('caption').textContent=text;$('feedback').hidden=true;$('turn').hidden=true;$('help').hidden=true;$('next').hidden=voice.ready;
  const result=await voice.read(text,`${current.id}:p${paragraph+1}`);
  if(generation!==run||paused)return;
  if(result==='ended')advanceParagraph();
}
function advanceParagraph(){
  if(turnOpen)return;
  if(paragraph<beat().paragraphs.length-1){paragraph++;readParagraph();}
  else if(beat().gate&&!state.completed.includes(beat().gate))showTurn(beat().gate);
  else advanceBeat();
}
function advanceBeat(){
  stop();if(state.beat===BEATS.length-1){if(canFinish(state)){state.finished=true;save();finish();}return;}
  state.beat++;paragraph=0;save();showBeat();
}
function showBeat(){stage.show(beat());$('scene-name').textContent=beat().scene==='path'?'The first direction':'The Treasure Tree library';turnOpen=false;readParagraph();}
function reportCompletion(){
  if(!canReport(state,{child,review,recordingReady:voice.ready})||state.completionReported)return;
  const queued=window.MightyProgress?.log?.({kid:child,player:child[0].toUpperCase()+child.slice(1),game:'bag-at-the-door',skill:'Story participation',item:EPISODE.completionItem,correct:null,extra:{episode:EPISODE.id,completed:true}});
  if(queued!==false&&typeof window.MightyProgress?.log==='function'){state.completionReported=true;save();window.MightyProgress.flush?.();}
}
function finish(){
  stop();$('story').hidden=true;$('finish').hidden=false;$('pause').disabled=true;
  reportCompletion();
}
function start(reset=false){
  stop();if(reset){state=freshState();save();}started=true;paused=false;paragraph=0;
  $('welcome').hidden=true;$('finish').hidden=true;$('story').hidden=false;$('pause').disabled=false;
  if(state.finished)finish();else showBeat();
}
$('start').onclick=()=>start();$('restart').onclick=()=>start(true);$('replay').onclick=()=>start(true);
$('next').onclick=()=>{const skippedNarration=Boolean(voice.player.active&&!voice.player.failed);stop();if(turnOpen)return;if(!voice.ready||skippedNarration)state.reviewed=true;if(beat().gate&&state.completed.includes(beat().gate)&&paragraph===beat().paragraphs.length-1)advanceBeat();else advanceParagraph();};
$('again').onclick=()=>{if(turnOpen)saySupport(GATES[beat().gate].prompt);else readParagraph();};
function pauseStory(){paused=true;if(voice.player.active){resumeRecorded=true;voice.player.pause();stage.speaker=null;}else stop();if(!$('paused').open)$('paused').showModal();}
$('pause').onclick=pauseStory;
$('resume').onclick=()=>{paused=false;$('paused').close();if(resumeRecorded&&voice.player.active){resumeRecorded=false;voice.player.resume();}else if(turnOpen)saySupport(GATES[beat().gate].prompt);else readParagraph();};
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();
$('grownup').onclick=()=>{stop();paused=true;const seconds=Math.round(RECORDING.sourceDuration||0);$('production-status').textContent=voice.ready?`${EPISODE.title}. Supplied ElevenLabs recording: ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}. The complete recording is retained, with five pauses for child turns. Season 2 allowance: 9–11 minutes including normal turns.`:`${EPISODE.title}. Device narration preview; supplied recording could not be loaded.`;$('local-notes').textContent=JSON.stringify({attempts:state.attempts,supported:state.helped,completedTurns:state.completed,reviewOnly:review||!voice.ready},null,2);$('parent').showModal();};
$('parent').addEventListener('close',()=>{paused=false;if(started&&!state.finished&&!turnOpen)readParagraph();});
BEATS.forEach((b,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${i+1}. ${b.id.replaceAll('-',' ')}`;$('scene-select').append(o);});
$('jump').onclick=()=>{stop();state.beat=Number($('scene-select').value);state.reviewed=true;state.jumped=true;state.finished=false;paragraph=0;save();$('parent').close();$('welcome').hidden=true;$('finish').hidden=true;$('story').hidden=false;started=true;showBeat();};
$('read').onclick=()=>{
  stop();$('chapter').replaceChildren();
  for(const row of CHAPTER){const section=node('section');section.append(node('p','chapter-text',row.adult));const target=node('div','chapter-target');target.append(word(row.child,'chapter-'+row.child),button('Model the word',()=>saySupport(row.child)));section.append(target);$('chapter').append(section);}
  $('library').showModal();
};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!state.finished)pauseStory();});
window.addEventListener('pagehide',()=>{save();voice.stop();});
Promise.all([voice.init(),stage.load((n,total)=>{$('start').textContent=`Getting the crew ready ${n}/${total}…`;})]).then(()=>{
  $('audio-status').textContent=voice.ready?'Narrated with your ElevenLabs recording.':'Production preview with device narration.';
  $('start').disabled=false;$('start').textContent=state.finished?'Open our collection':state.beat?'Continue our delivery':'Begin our delivery';$('restart').hidden=!state.beat&&!state.finished;
  if(state.finished)reportCompletion();
}).catch(()=>{$('start').disabled=false;$('start').textContent='Begin our delivery';$('scene-name').textContent='Art could not load · story and turns remain available';});
