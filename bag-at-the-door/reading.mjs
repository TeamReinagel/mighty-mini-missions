// The screenshot convention is retained, with explicit word-level metadata rather than guessed pronunciations.
// This lesson uses short single-letter mappings only. Arches/bars/yellow are deliberately absent in its words.
export const WORDS = Object.fromEntries(['map','mat','pad','pan','sad','did','dim'].map(word=>[word,{text:word,chunks:[...word].map(text=>({text,sound:text,mark:'plain'})),sight:false}]));
export const MARK_POLICY={arch:'coral arch above one-sound letter team',bar:'green bar above long vowel or soft c/g',sight:'yellow underline under whole sight word',slider:'one continuous word track; sound positions follow graphemes'};
export function readingWord(word,{onSound=()=>{},onWord=()=>{},onSupport=()=>{},interactive=true}={}){
  const data=typeof word==='string'?WORDS[word]:word;
  if(!data)throw new Error(`Word needs an explicit reading annotation: ${word}`);
  const wrap=document.createElement('span');wrap.className='read-word';wrap.dataset.word=data.text;
  const glyphs=document.createElement('span');glyphs.className='glyphs';glyphs.setAttribute('aria-label',data.text);
  if(data.sight)glyphs.classList.add('sight');
  for(const c of data.chunks){const span=document.createElement('span');span.className=`chunk ${c.mark||'plain'}${c.silent?' silent':''}`;span.textContent=c.text;glyphs.append(span);}
  wrap.append(glyphs);
  const track=document.createElement('span');track.className=`word-track${data.sight?' sight-track':''}`;
  const chunks=data.sight?[{text:data.text,sound:data.text}]:data.chunks.filter(c=>!c.silent);
  const fill=document.createElement('span');fill.className='track-fill';track.append(fill);
  const thumb=document.createElement('span');thumb.className='track-thumb';thumb.textContent='Ⅱ';track.append(thumb);
  if(interactive){
    track.tabIndex=0;track.setAttribute('role','slider');track.setAttribute('aria-label',`Blend ${data.text}`);
    track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(chunks.length));track.setAttribute('aria-valuenow','0');
    let down=false,last=-1,ratio=0;
    const show=(r,speak=true)=>{ratio=Math.max(0,Math.min(1,r));fill.style.width=`${ratio*100}%`;thumb.style.left=`${ratio*100}%`;const i=Math.min(chunks.length-1,Math.floor(ratio*chunks.length));track.setAttribute('aria-valuenow',String(i+1));track.setAttribute('aria-valuetext',chunks[i].text);if(speak&&i!==last){last=i;onSound(chunks[i].sound);} };
    const move=e=>{const rect=track.getBoundingClientRect();show((e.clientX-rect.left)/rect.width);};
    track.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();onSupport();last=-1;down=true;track.setPointerCapture(e.pointerId);move(e);});
    track.addEventListener('pointermove',e=>{if(down)move(e);});
    track.addEventListener('pointerup',e=>{e.preventDefault();e.stopPropagation();if(!down)return;down=false;if(ratio>=.92)onWord(data.text);});
    track.addEventListener('pointercancel',()=>{down=false;});
    track.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
    track.addEventListener('keydown',e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();onSupport();let pos=e.key==='Home'?0:e.key==='End'?1:ratio+(e.key==='ArrowRight'?1:-1)/chunks.length;show(pos);if(e.key==='End')onWord(data.text);}});
  } else track.setAttribute('aria-hidden','true');
  wrap.append(track);return wrap;
}
