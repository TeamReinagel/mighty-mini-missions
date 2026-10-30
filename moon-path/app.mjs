// Essential skill: listening-1. The child listens to clues and uses them to guide the crew.
import {EPISODE,HELP_LINES,NARRATION,narratedEntries} from './narrated-episode.mjs';
import {StoryStage,PROP} from './stage.mjs?v=mouth-layers-v3';
import {STORAGE_KEY,freshProgress,readProgress,firstTry,heardChoice,formatTime,tracePoints,advanceTrace,validateLocation} from './logic.mjs?v=narrated-v2';
import {VoicePlayer} from './voice-player.mjs';
import {episodeChild,childStorage,episodeReporter} from './integration.mjs';

const $=s=>document.querySelector(s), byId=id=>document.getElementById(id);
const theatre=byId('theatre'),interaction=byId('interaction');
const stage=new StoryStage(byId('world'));
const helpLines=new Map(HELP_LINES.map(x=>[x.id,x]));
const params=new URLSearchParams(location.search),review=params.has('review');
const child=episodeChild(params.get('kid'),window.MightyProgress?.currentKid());
const progressStorage=childStorage(review?sessionStorage:localStorage,child?.id);
const reporter=episodeReporter({child,review,log:entry=>{if(!window.MightyProgress)return false;window.MightyProgress.log(entry);return true;},flush:()=>window.MightyProgress?.flush()});
const turnIds=EPISODE.scenes.flatMap(scene=>scene.beats).filter(beat=>beat.kind==='challenge').map(beat=>beat.id);
let progress=validateLocation(readProgress(progressStorage),EPISODE),runToken=0,started=false,paused=false,modal=false,muted=false,captions=true;
let currentBeat=null,currentScene=null,challengeResolve=null,currentChallenge=null,activeChoice=null,recognition=null,bookIndex=0,bookAuto=false;
let chapterLine='',manifest={lines:{}},audioError=false,toastTimer,lastAudioSave=0;
const inputMemory=new Map();
let audioContext;

function unlockSound(){try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();}catch{}}
function effect(name='wood'){
  if(muted||!audioContext)return;
  const a=audioContext,t=a.currentTime;
  if(name==='water'||name==='page'){
    const duration=name==='water'?.3:.14,buf=a.createBuffer(1,a.sampleRate*duration,a.sampleRate),data=buf.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
    const src=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();src.buffer=buf;f.type='lowpass';f.frequency.value=name==='water'?900:2200;g.gain.value=.05;src.connect(f).connect(g).connect(a.destination);src.start();return;
  }
  const osc=a.createOscillator(),g=a.createGain();osc.type=name==='bell'?'sine':'triangle';osc.frequency.setValueAtTime(name==='bell'?620:name==='latch'?430:180,t);osc.frequency.exponentialRampToValueAtTime(name==='bell'?590:90,t+.18);g.gain.setValueAtTime(.055,t);g.gain.exponentialRampToValueAtTime(.001,t+(name==='bell'?.7:.2));osc.connect(g).connect(a.destination);osc.start();osc.stop(t+.75);
}
const voice=new VoicePlayer({
  audio:new Audio(),getEntry:id=>manifest.lines[id],baseURL:document.baseURI,
  onCue:(cue,line)=>{
    if(line.kind!=='narration'){stage.speaker=['lark','nib'].includes(line.speaker)?line.speaker:null;return;}
    if(cue){setCaption(cue);stage.speaker=['lark','nib'].includes(cue.speaker)?cue.speaker:null;}
    else stage.speaker=null;
    // Rebuild the current visual state from the media clock, including after
    // refresh or seeking. Decorative actions add no extra narration delays.
    const time=voice.audio.currentTime||0;
    stage.followNarration(line.audio?.visuals||[],time,line.stage);
  },
  onProgress:(line,time)=>{
    if(line.kind!=='narration'||currentBeat?.id!==line.id)return;
    progress.audio={id:line.id,offset:time};
    stage.followNarration(line.audio?.visuals||[],time,line.stage);
    if(performance.now()-lastAudioSave>2000){lastAudioSave=performance.now();save();}
  },
  onError:()=>{audioError=true;toast('The recording needs a retry. Keep exploring will retry from this spot.',6000);pause();},
  onStopped:()=>stage.speaker=null,
});
stage.narrationClock=()=>voice.audio.currentTime||0;
function save(){try{progressStorage.setItem(STORAGE_KEY,JSON.stringify(progress));}catch{}}
function toast(text,ms=3600){byId('toast').textContent=text;byId('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>byId('toast').hidden=true,ms);}
function setCaption(line){if(!line?.text){byId('caption').hidden=true;return;}byId('speaker').textContent=({nib:'Nib',joyce:'Joyce',lark:'Lark',narrator:'Narrator'})[line.speaker]||'Narrator';byId('line').textContent=line.text;byId('caption').hidden=!captions;}
async function say(line){setCaption(line);await voice.play(line);}
function stopRecognition(){recognition?.abort();recognition=null;byId('mic-button').classList.remove('listening');byId('mic-button').textContent='Speak';}
function cancel(){runToken++;voice.stop();stopRecognition();challengeResolve?.('cancelled');challengeResolve=null;currentChallenge=null;interaction.replaceChildren();byId('turn-tools').hidden=true;}
function wait(ms,token){return new Promise(resolve=>{let left=ms,last=performance.now();const tick=()=>{const now=performance.now();if(token!==runToken){resolve();return;}if(!paused&&!modal)left-=Math.min(100,now-last);last=now;if(left<=0)resolve();else setTimeout(tick,35);};tick();});}
function getBeat(){currentScene=EPISODE.scenes[progress.scene];currentBeat=currentScene.beats[progress.beat];return currentBeat;}
function supported(id){if(!progress.supported.includes(id)){progress.supported.push(id);reporter.support(progress,id);}save();}
function advance(){delete progress.audio;progress.beat++;if(progress.beat>=EPISODE.scenes[progress.scene].beats.length){progress.scene++;progress.beat=0;}if(progress.scene>=EPISODE.scenes.length){progress.scene=EPISODE.scenes.length-1;progress.beat=EPISODE.scenes.at(-1).beats.length-1;progress.complete=true;progress.chapter=true;progress.treasure=true;}save();}
function renderBookCopy(beat){
  if(!['river-book','journal'].includes(beat.stage)||beat.kind==='challenge')return;
  const read=beat.speaker==='lark'&&(beat.id.includes('read')||beat.id.includes('page')||beat.id.includes('book')||beat.id.includes('journal')||beat.id.includes('library'));
  if(read&&beat.text.length>35)chapterLine=beat.text;
  if(!chapterLine)return;
  const div=document.createElement('div');div.className='book-copy';div.textContent=chapterLine;interaction.append(div);
}
async function run(){
  const token=++runToken;stage.welcome=false;stage.paused=paused;started=true;
  while(token===runToken&&!progress.complete){
    while((paused||modal)&&token===runToken)await new Promise(r=>setTimeout(r,50));if(token!==runToken)return;
    const beat=getBeat();if(stage.scene.id!==currentScene.id)chapterLine='';stage.set(currentScene,beat);theatre.dataset.scene=currentScene.id;theatre.dataset.beat=beat.id;theatre.dataset.kind=beat.kind;
    interaction.replaceChildren();byId('turn-tools').hidden=true;currentChallenge=null;save();renderBookCopy(beat);
    if(beat.kind==='narration'){
      stage.narrationVisualKey=null;
      const offset=progress.audio?.id===beat.id?progress.audio.offset:0;
      setCaption(beat.audio.cues[0]||beat);
      await voice.play(beat,{offset});
    }else if(beat.kind==='line'){
      let line=beat;
      const bell=EPISODE.scenes.flatMap(s=>s.beats).find(b=>b.type==='bell');
      if(beat.id==='s7-remembered'&&progress.supported.includes(bell?.id))line=helpLines.get('help-rescue-supported');
      await say(line);if(token!==runToken)return;await wait(650,token);
    }else if(beat.kind==='action'){
      setCaption(beat.text?beat:null);stage.cue(beat.action,beat.duration||2);
      effect(beat.action?.includes('boat')?'water':beat.action?.includes('book')?'page':beat.action==='map-open'?'latch':'wood');
      if(beat.text)await voice.play(beat);
      await wait((beat.duration||2)*1000,token);
      if(beat.action==='treasure-store')progress.treasure=true;
      if(beat.action==='library-save')progress.chapter=true;
    }else if(beat.kind==='challenge'){
      await presentChallenge(beat,token);
    }
    if(token!==runToken)return;advance();
  }
  if(progress.complete)finish();
}
function finish(){cancel();stage.welcome=false;stage.challenge=null;stage.beat={stage:'ending'};stage.scene={id:'complete',background:'camp'};stage.flags.stored=true;byId('caption').hidden=true;byId('finish-screen').hidden=false;reporter.complete(progress,turnIds);updateMap();save();}
function resumeFromHere(){byId('welcome').hidden=true;byId('finish-screen').hidden=true;byId('pause-screen').hidden=true;paused=false;modal=false;stage.paused=false;if(progress.complete)finish();else run();}
function startOver(){cancel();const kept={treasure:progress.treasure,chapter:progress.chapter};progress={...freshProgress(),...kept};save();resumeFromHere();}
function pause(){if(!started||progress.complete)return;paused=true;stage.paused=true;voice.pause();stopRecognition();byId('pause-screen').hidden=false;byId('pause-button').textContent='Resume';save();}
function resume(){paused=false;stage.paused=false;byId('pause-screen').hidden=true;byId('pause-button').textContent='Pause';if(started&&!progress.complete&&!modal&&!voice.active&&!currentChallenge)run();else voice.resume();}

function makeTarget({id,label,index,x=50,y=54,size=23,letter=false}){
  const b=document.createElement('button');b.className=`target${letter?' letter-target':''}`;b.dataset.choice=id;b.setAttribute('aria-label',label||id);b.style.left=x+'%';b.style.top=y+'%';b.style.width=size+'vw';b.style.height=size+'vw';b.style.maxWidth='280px';b.style.maxHeight='280px';b.style.minWidth='85px';b.style.minHeight='85px';
  if(letter)b.textContent=id;else if(index!==undefined){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;stage.paintProp(canvas,index);b.append(canvas);}
  interaction.append(b);return b;
}
function note(text){const d=document.createElement('span');d.className='gesture-note';d.textContent=text;interaction.append(d);return d;}
function memoryFor(beat){progress.inputs??={};progress.inputs[beat.id]??={};return progress.inputs[beat.id];}

async function presentChallenge(beat,token){
  currentChallenge=beat;stage.challenge=beat;byId('turn-tools').hidden=false;theatre.dataset.challenge=beat.type;
  let settled=false,lastMiss=0;
  const done=new Promise(resolve=>challengeResolve=resolve);
  const choose=async id=>{
    if(settled||token!==runToken||paused||modal)return;
    const before=progress.attempts.length;firstTry(progress,beat,id);
    if(progress.attempts.length>before)reporter.practice(progress,progress.attempts.at(-1));save();
    if(id!==beat.expected){
      if(performance.now()-lastMiss<250)return;lastMiss=performance.now();supported(beat.id);effect('wood');
      await say(beat.incorrect);if(!settled&&token===runToken){setCaption(beat);byId('turn-tools').hidden=false;}return;
    }
    settled=true;stopRecognition();voice.stop();activeChoice=id;
    progress.completedTurns??=[];if(!progress.completedTurns.includes(beat.id))progress.completedTurns.push(beat.id);save();
    interaction.querySelectorAll('button').forEach(b=>b.disabled=true);interaction.querySelector(`[data-choice="${CSS.escape(id)}"]`)?.classList.add('correct');effect(['bell','coread','hum'].includes(beat.type)?'bell':'latch');
    if(beat.type==='letter')stage.flags.bridge=true;
    if(beat.type==='trace')stage.flags.repaired=true;
    if(beat.type==='bell')stage.cue('boat-return',4);
    if(beat.type==='collect'){progress.treasure=true;stage.flags.stored=true;save();}
    if(beat.type==='reveal'){stage.reveal.found=true;stage.cue('stone-reveal',3);}
    if(!beat.skipSuccess)await say(beat.correct);
    if(token!==runToken)return;await wait(beat.skipSuccess?120:350,token);byId('turn-tools').hidden=true;currentChallenge=null;stage.challenge=null;challengeResolve?.('complete');challengeResolve=null;
  };
  currentChallenge.choose=choose;
  if(beat.type==='latch'){
    const b=makeTarget({id:'open',label:'Lift the brass latch to open the explorer case',index:PROP.case,size:34,y:52});b.style.top='auto';b.style.bottom='17%';b.style.translate='-50% 0';b.addEventListener('click',()=>choose('open'));
    let sy; b.addEventListener('pointerdown',e=>{sy=e.clientY;b.setPointerCapture(e.pointerId);});b.addEventListener('pointerup',e=>{if(sy-e.clientY>12)choose('open');});
  }else if(beat.type==='route')buildRoute(beat,choose);
  else if(['letter','bell'].includes(beat.type)){
    const ids=beat.type==='bell'?['s','m']:['m','s'];ids.forEach((id,i)=>{const b=makeTarget({id,label:`${id} ${beat.type==='bell'?'bell rope':'letter key'}`,letter:true,x:i?65:35,y:52,size:21});if(beat.type==='bell'){const s=document.createElement('span');s.className='tiny-bell';s.textContent='Pull';b.append(s);}b.addEventListener('click',()=>choose(id));});
  }else if(['moss','mushroom'].includes(beat.type)){
    const choices=beat.type==='moss'?[{id:'rock',index:PROP.rock},{id:'moss',index:PROP.moss}]:[{id:'mushroom',index:PROP.mushroom},{id:'flower',index:PROP.flower}];
    choices.forEach((item,i)=>{const b=makeTarget({...item,label:`Choose the ${item.id} path`,x:i?66:34,y:54,size:25});let held=false,timer;b.addEventListener('pointerdown',()=>{held=false;timer=setTimeout(()=>{held=true;supported(beat.id);say(helpLines.get('help-object-'+item.id));},600);});b.addEventListener('pointerup',()=>clearTimeout(timer));b.addEventListener('pointercancel',()=>clearTimeout(timer));b.addEventListener('pointerleave',()=>clearTimeout(timer));b.addEventListener('click',()=>{if(!held)choose(item.id);});});
  }else if(['hum','coread','reread'].includes(beat.type))buildSound(beat,choose);
  else if(beat.type==='sequence'){
    [{id:'repair',index:PROP.machine,label:'Mend the broken mark first'},{id:'bell',index:PROP.bells,label:'Ring the bell first'}].forEach((o,i)=>{const b=makeTarget({...o,x:i?67:33,size:25,y:52});b.addEventListener('click',()=>choose(o.id));});
  }else if(beat.type==='trace')buildTrace(beat,choose);
  else if(beat.type==='reveal')buildReveal(beat,choose);
  else if(beat.type==='collect'){
    const stone=makeTarget({id:'moonstone',label:'Put the moonstone in your treasure collection',index:PROP.lantern,x:50,y:42,size:20});
    const box=makeTarget({id:'case',label:'Moonstone compartment',index:PROP.treasure,x:50,y:65,size:28});box.addEventListener('click',()=>choose('moonstone'));stone.addEventListener('click',()=>box.classList.add('hinted'));
    let drag=false;stone.addEventListener('pointerdown',e=>{drag=true;stone.setPointerCapture(e.pointerId);});stone.addEventListener('pointermove',e=>{if(!drag)return;const r=theatre.getBoundingClientRect();stone.style.left=(e.clientX-r.left)/r.width*100+'%';stone.style.top=(e.clientY-r.top)/r.height*100+'%';});stone.addEventListener('pointerup',e=>{drag=false;const r=box.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)choose('moonstone');else{stone.style.left='50%';stone.style.top='42%';box.classList.add('hinted');}});
  }
  if(beat.optional){
    const next=document.createElement('button');next.className='practice-continue';next.textContent='Keep exploring';next.setAttribute('aria-label','Continue without the optional sound practice');
    next.addEventListener('click',()=>choose(beat.expected));interaction.append(next);
  }
  if(beat.skipIntro)setCaption(beat);else await say(beat);
  await done;
}

function buildSound(beat,choose){
  const key=makeTarget({id:'m',label:'m. Hold to hear the sound or say it with us.',letter:true,x:50,y:43,size:20});
  const slider=document.createElement('div');slider.className='sound-slider';slider.setAttribute('role','slider');slider.tabIndex=0;slider.setAttribute('aria-label','Slide under m to hear its sound');slider.setAttribute('aria-valuemin','0');slider.setAttribute('aria-valuemax','100');slider.setAttribute('aria-valuenow','0');slider.innerHTML='<div class="fill"></div><span class="knob"></span>';interaction.append(slider);note('Slide, touch, or hum with us.');
  const complete=async()=>{supported(beat.id);await say({id:'phoneme-m',speaker:'lark',text:'Mmm.'});choose('m');};
  key.addEventListener('click',complete);let down=false,heard=false;
  const move=e=>{const r=slider.getBoundingClientRect(),p=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));slider.querySelector('.fill').style.width=p*100+'%';slider.querySelector('.knob').style.left=p*100+'%';slider.setAttribute('aria-valuenow',String(Math.round(p*100)));if(p>.08&&!heard){heard=true;voice.play({id:'phoneme-m',speaker:'lark',text:'Mmm.'});}if(p>.88){down=false;choose('m');}};
  slider.addEventListener('pointerdown',e=>{down=true;slider.setPointerCapture(e.pointerId);supported(beat.id);move(e);});slider.addEventListener('pointermove',e=>{if(down)move(e);});slider.addEventListener('pointerup',e=>{if(down)move(e);down=false;});slider.addEventListener('keydown',e=>{if(['Enter',' ','ArrowRight','End'].includes(e.key)){e.preventDefault();complete();}});
}
function buildRoute(beat,choose){
  const mem=memoryFor(beat);mem.route??=0;
  const panel=document.createElement('div');panel.className='route-panel';panel.dataset.routeProgress=mem.route;
  const art=document.createElement('canvas');art.width=800;art.height=600;stage.paintMap(art);panel.append(art);
  panel.insertAdjacentHTML('beforeend','<svg class="route-line" viewBox="0 0 800 600" preserveAspectRatio="none"><path d="M160 450 C270 430 300 280 400 300 S540 140 640 150" fill="none" stroke="#775334" stroke-width="7" stroke-dasharray="5 17" stroke-linecap="round"/></svg>');
  const nodes=[{name:'Lagoon',img:'lagoon',x:20,y:75},{name:'Woods',img:'woods',x:50,y:50},{name:'River',img:'river',x:80,y:25}];
  const buttons=[];nodes.forEach((n,i)=>{const b=document.createElement('button');b.className='route-node';b.dataset.choice=n.img;b.style.left=n.x+'%';b.style.top=n.y+'%';b.setAttribute('aria-label',n.name+' landmark');const img=new Image();img.src=`assets/${n.img}.png`;img.alt='';b.append(img);b.addEventListener('click',()=>hit(i));panel.append(b);buttons.push(b);const label=document.createElement('span');label.className='route-name';label.textContent=n.name;label.style.left=n.x+'%';label.style.top=(n.y+14)+'%';panel.append(label);});
  const refresh=()=>buttons.forEach((b,i)=>{b.classList.toggle('active',i===mem.route);b.classList.toggle('done',i<mem.route);});
  const hit=i=>{if(i!==mem.route){effect('wood');return;}mem.route++;save();panel.dataset.routeProgress=mem.route;effect('latch');refresh();if(mem.route===3)choose('river');};
  let down=false;panel.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;down=true;panel.setPointerCapture(e.pointerId);});panel.addEventListener('pointermove',e=>{if(!down||mem.route>=3)return;const r=panel.getBoundingClientRect(),n=nodes[mem.route];if(Math.hypot((e.clientX-r.left)/r.width*100-n.x,(e.clientY-r.top)/r.height*100-n.y)<14)hit(mem.route);});panel.addEventListener('pointerup',()=>down=false);
  interaction.append(panel);refresh();if(mem.route>=3)choose('river');
}
function buildTrace(beat,choose){
  const points=tracePoints(),mem=memoryFor(beat);mem.trace??=0;
  const panel=document.createElement('div');panel.className='trace-panel';panel.dataset.traceProgress=mem.trace;
  const svgNS='http://www.w3.org/2000/svg',svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox','0 0 500 600');svg.setAttribute('role','img');svg.setAttribute('aria-label','Lowercase m copper groove. Start at the bright dot and follow the light.');
  const pathData='M80 120 L80 492 L80 234 C80 84 245 78 245 264 L245 492 L245 234 C245 84 410 78 410 264 L410 492';
  const base=document.createElementNS(svgNS,'path');base.setAttribute('d',pathData);base.setAttribute('stroke','#6b432b');base.setAttribute('stroke-width','54');svg.append(base);
  const inner=base.cloneNode();inner.setAttribute('stroke','#dfb673');inner.setAttribute('stroke-width','36');svg.append(inner);
  const fill=base.cloneNode();fill.setAttribute('stroke','#fff0ad');fill.setAttribute('stroke-width','28');fill.style.filter='drop-shadow(0 0 6px #ffe19a)';svg.append(fill);
  const dot=document.createElementNS(svgNS,'circle');dot.setAttribute('r','24');dot.setAttribute('fill','#fff6bd');dot.setAttribute('stroke','#9b5e2c');dot.setAttribute('stroke-width','5');svg.append(dot);
  const label=document.createElement('span');label.className='trace-label';label.textContent='Follow the bright dot. Lifting your finger is okay.';panel.append(svg,label);interaction.append(panel);
  const total=fill.getTotalLength();
  const refresh=()=>{const p=mem.trace/(points.length-1);fill.style.strokeDasharray=`${p*total} ${total}`;const point=points[mem.trace];dot.setAttribute('cx',String(point.x*500));dot.setAttribute('cy',String(point.y*600));panel.dataset.traceProgress=mem.trace;};refresh();
  const point=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const q=p.matrixTransform(svg.getScreenCTM().inverse());return {x:q.x/500,y:q.y/600};};
  let down=false,lastHint=0;
  svg.addEventListener('pointerdown',e=>{e.preventDefault();const p=point(e),near=points[mem.trace];if(Math.hypot(p.x-near.x,p.y-near.y)>.15){if(performance.now()-lastHint>2500){lastHint=performance.now();say(helpLines.get('help-formation-start'));}return;}down=true;svg.setPointerCapture(e.pointerId);});
  svg.addEventListener('pointermove',e=>{if(!down)return;e.preventDefault();const next=advanceTrace(mem.trace,point(e),points);if(next>mem.trace){mem.trace=next;refresh();if(mem.trace>=points.length-5){down=false;choose('m');}}});
  svg.addEventListener('pointerup',()=>{down=false;save();});svg.addEventListener('pointercancel',()=>{down=false;save();});
  const guided=document.createElement('button');guided.className='repair-piece';guided.textContent='Fit the m piece';guided.setAttribute('aria-label','Use a guided m repair piece instead of tracing');guided.hidden=!progress.supported.includes(beat.id);guided.addEventListener('click',()=>{supported(beat.id);mem.trace=points.length-1;refresh();choose('m');});panel.append(guided);panel.guided=guided;
  currentChallenge.showGuided=()=>{guided.hidden=false;};
}
function buildReveal(beat,choose){
  const mem=memoryFor(beat);const field=document.createElement('div');field.className='reveal-field';field.tabIndex=0;field.setAttribute('role','button');field.setAttribute('aria-label','Move the moonstone light over the map to find the orchard');interaction.append(field);const hint=document.createElement('span');hint.className='reveal-hint';hint.textContent='Move the moonstone light across the map.';interaction.append(hint);
  stage.reveal={x:.25,y:.7,active:true,found:false};
  const move=e=>{const r=field.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));stage.reveal.x=x;stage.reveal.y=y;if(Math.hypot(x-.76,y-.26)<.2){stage.reveal.found=true;choose('orchard');}};
  let down=false;field.addEventListener('pointerdown',e=>{down=true;field.setPointerCapture(e.pointerId);move(e);});field.addEventListener('pointermove',e=>{if(down)move(e);});field.addEventListener('pointerup',()=>down=false);field.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();supported(beat.id);stage.reveal.found=true;choose('orchard');}});
}

async function requestHelp(){
  const beat=currentChallenge;if(!beat)return;supported(beat.id);
  const correct=interaction.querySelector(`[data-choice="${CSS.escape(beat.expected)}"]`);correct?.classList.add('hinted');
  if(beat.type==='trace'){beat.showGuided?.();await say(helpLines.get(memoryFor(beat).trace?'help-formation-hill':'help-formation-start'));}
  else await say(beat.hint);
  if(currentChallenge===beat)setCaption(beat);
}
async function startListening(){
  const beat=currentChallenge;if(!beat)return;const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){await say(helpLines.get('help-mic-unavailable'));setCaption(beat);return;}
  stopRecognition();voice.stop();recognition=new Recognition();recognition.lang='en-US';recognition.continuous=false;recognition.interimResults=false;recognition.maxAlternatives=1;recognition.onstart=()=>{byId('mic-button').classList.add('listening');byId('mic-button').textContent='Listening…';};recognition.onend=()=>{byId('mic-button').classList.remove('listening');byId('mic-button').textContent='Speak';};
  recognition.onerror=()=>{toast('Your finger works here too.');setCaption(beat);};
  recognition.onresult=event=>{
    if(currentChallenge!==beat)return;
    const result=event.results[0][0],choices=beat.choices?.length?beat.choices:[{id:beat.expected,say:beat.expected,label:beat.expected}],choice=heardChoice(result.transcript,choices);
    if(!choice){say(helpLines.get('help-mic-uncertain'));return;}
    // Always confirm a recognized answer: speech recognition is not evidence of a phoneme.
    const confirm=document.createElement('div');confirm.className='confirm-voice';const p=document.createElement('p');p.textContent=`I heard “${choice.say||choice.label||choice.id}”.`;const yes=document.createElement('button');yes.textContent='Use that';const no=document.createElement('button');no.textContent='Try again';yes.addEventListener('click',()=>{confirm.remove();beat.choose(choice.id);});no.addEventListener('click',()=>{confirm.remove();startListening();});confirm.append(p,yes,no);interaction.append(confirm);
  };
  try{recognition.start();}catch{toast('Use your finger to choose.');}
}

function openDialog(id){if(byId(id).open)return;cancel();modal=true;stage.paused=true;voice.stop();byId(id).showModal();if(id==='map-dialog')updateMap();if(id==='parent-dialog')updateParent();}
function closeDialog(id){const d=byId(id);if(d.open)d.close();}
function dialogClosed(){voice.stop();if([...document.querySelectorAll('dialog')].some(d=>d.open))return;modal=false;stage.paused=paused;if(started&&progress.complete)finish();else if(started&&!paused)run();}
function updateMap(){stage.paintMap(byId('map-art'));const ol=byId('map-stops');ol.replaceChildren();const stops=[['Camp',23,78,0],['Lagoon',30,60,2],['Woods',57,46,3],['River',75,25,5]];stops.forEach(([name,x,y,scene])=>{const li=document.createElement('li');li.textContent=name;li.style.left=x+'%';li.style.top=y+'%';li.classList.toggle('visited',progress.scene>scene||progress.complete);li.classList.toggle('current',Math.max(0,...stops.filter(z=>progress.scene>=z[3]).map(z=>z[3]))===scene&&!progress.complete);ol.append(li);});byId('collection-status').textContent=progress.treasure?'Moonstone · Your first treasure is in the collection.':'An empty space for your first treasure.';byId('map-library').hidden=!progress.chapter;}
function openLibrary(){if(!progress.chapter){toast('Your chapter will be here after the adventure.');return;}closeDialog('map-dialog');openDialog('library-dialog');bookIndex=0;renderLibrary();}
function renderLibrary(){voice.stop();const page=EPISODE.library[bookIndex];byId('page-title').textContent=page.title;byId('page-text').textContent=page.text;byId('book-page').textContent=`${bookIndex+1} / ${EPISODE.library.length}`;byId('book-prev').disabled=bookIndex===0;byId('book-next').textContent=bookIndex===EPISODE.library.length-1?'Close book':'Next';byId('book-next').setAttribute('aria-label',bookIndex===EPISODE.library.length-1?'Close book':'Next page');byId('library-sound').hidden=!page.childSound;stage.paintLibrary(byId('library-art'),page,bookIndex);effect('page');}
async function readLibraryPage(){const page=EPISODE.library[bookIndex];await voice.play({...page,speaker:'lark'});stage.speaker=null;}
function updateParent(){
  const select=byId('scene-select');select.replaceChildren();
  const option=(value,text)=>{const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o);};
  EPISODE.scenes.forEach((scene,si)=>{
    option(si+':0',`${si+1}. ${scene.title}`);
    scene.beats.forEach((beat,bi)=>{
      if(beat.kind!=='challenge')return;
      const before=scene.beats[bi-1];
      if(before?.kind==='narration')option(`${si}:${bi-1}:${Math.max(0,before.duration-10)}`,`    Lead-in: ${beat.type}`);
      option(si+':'+bi,`    Try: ${beat.type}`);
    });
  });
  const lastScene=EPISODE.scenes.length-1,lastBeat=EPISODE.scenes[lastScene].beats.length-1,last=EPISODE.scenes[lastScene].beats[lastBeat];
  option(`${lastScene}:${lastBeat}:${Math.max(0,last.duration-12)}`,'Listen: story ending');
  select.value=progress.scene+':0';
  const d=byId('build-status');d.replaceChildren();
  const pairs=[['Story recording','Your ElevenLabs narration · '+formatTime(NARRATION.source.duration)],['Interactive pauses',EPISODE.scenes.flatMap(s=>s.beats).filter(b=>b.kind==='challenge').length+' ready'],['Character animation','4 sheets × 16 frames'],['This playthrough',formatTime(progress.elapsed)],['Current scene',currentScene?.title||'Not started'],['Saved recording position',formatTime(progress.audio?.offset||0)],['Audio status',audioError?'A playback issue occurred':'ElevenLabs story / OpenAI help']];
  for(const [key,value]of pairs){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;d.append(dt,dd);}
  byId('practice-log').textContent=JSON.stringify({firstResponses:progress.attempts,support:progress.supported},null,2);
}

byId('start-button').addEventListener('click',()=>{unlockSound();if(progress.complete)startOver();else resumeFromHere();});byId('restart-button').addEventListener('click',()=>{unlockSound();startOver();});
byId('pause-button').addEventListener('click',()=>paused?resume():pause());byId('resume-button').addEventListener('click',resume);
byId('sound-button').addEventListener('click',()=>{unlockSound();muted=!muted;voice.audio.muted=muted;byId('sound-button').textContent=muted?'Sound off':'Sound on';byId('sound-button').setAttribute('aria-label',muted?'Enable voices':'Mute voices');});
byId('map-button').addEventListener('click',()=>openDialog('map-dialog'));byId('home').addEventListener('click',()=>openDialog('map-dialog'));byId('parent-button').addEventListener('click',()=>openDialog('parent-dialog'));
byId('help-button').addEventListener('click',requestHelp);byId('mic-button').addEventListener('click',startListening);
byId('repeat-button').addEventListener('click',()=>{if(currentChallenge)say(currentChallenge);else if(started&&!paused&&!modal)voice.repeatCue();});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(b.dataset.close)));
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',dialogClosed);d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
byId('again-button').addEventListener('click',startOver);byId('read-button').addEventListener('click',openLibrary);byId('map-library').addEventListener('click',openLibrary);
byId('book-prev').addEventListener('click',()=>{if(bookIndex>0){bookIndex--;renderLibrary();}});byId('book-next').addEventListener('click',()=>{if(bookIndex<EPISODE.library.length-1){bookIndex++;renderLibrary();}else closeDialog('library-dialog');});byId('book-read').addEventListener('click',readLibraryPage);byId('library-sound').addEventListener('click',()=>voice.play({id:'phoneme-m',speaker:'lark',text:'Mmm.'}));
byId('jump-button').addEventListener('click',()=>{const [scene,beat,offset]=byId('scene-select').value.split(':').map(Number);progress.previewed=true;progress.scene=scene;progress.beat=beat;progress.complete=false;delete progress.audio;if(Number.isFinite(offset)&&EPISODE.scenes[scene].beats[beat].kind==='narration')progress.audio={id:EPISODE.scenes[scene].beats[beat].id,offset};save();started=true;closeDialog('parent-dialog');byId('welcome').hidden=true;byId('finish-screen').hidden=true;});
byId('next-beat').addEventListener('click',()=>{progress.previewed=true;advance();started=true;closeDialog('parent-dialog');byId('welcome').hidden=true;});
byId('captions-button').addEventListener('click',()=>{captions=!captions;byId('captions-button').textContent=captions?'Captions on':'Captions off';byId('caption').hidden=!captions;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',save);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')&&started&&!progress.complete){paused?resume():pause();}});
setInterval(()=>{if(started&&!paused&&!modal&&!progress.complete){progress.elapsed++;if(progress.elapsed%10===0)save();}},1000);
for(const link of document.querySelectorAll('[data-joyce-return]')){
  link.href=child?`../classroom/?kid=${encodeURIComponent(child.id)}`:'../';
  link.addEventListener('click',()=>{save();reporter.flush();});
}

async function boot(){
  try{
    await Promise.all([stage.load((n,total)=>byId('load-status').textContent=`Painting the world… ${n} of ${total} assets ready.`),fetch('assets/audio/manifest.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('The voice manifest could not load.');return r.json();}).then(x=>manifest={...x,lines:{...x.lines,...narratedEntries()}})]);
    const hasProgress=progress.scene||progress.beat||(progress.audio?.offset||0)>0;
    byId('start-button').disabled=false;byId('start-button').textContent=progress.complete?'Play our adventure again':hasProgress?'Continue adventure':'Start adventure';byId('restart-button').hidden=!hasProgress||progress.complete;
    byId('load-status').textContent='The crew is ready. Your narrated adventure will pause when it is your turn.';
    theatre.dataset.ready='true';updateMap();
  }catch(error){byId('load-status').textContent='An adventure asset could not load. Refresh to try again.';byId('start-button').textContent='Please refresh';theatre.dataset.ready='error';console.error('Adventure loading failed:',error.message);}
}
window.MoonPath={get snapshot(){return {scene:currentScene?.id,beat:currentBeat?.id,kind:currentBeat?.kind,challenge:currentChallenge?.type,paused,complete:progress.complete,treasure:progress.treasure,chapter:progress.chapter,narration:voice.position,voiceClips:Object.keys(manifest.lines).length,animation:stage.stats()};}};
boot();
