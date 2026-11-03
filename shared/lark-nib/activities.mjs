// Guided writing and self-paced sentence tracking are participation, never scored decoding.
export function writingActivity({letter,onDone,onSupport=()=>{}}){
 const root=document.createElement('div');root.className='writing-activity';
 const prompt=document.createElement('p');prompt.className='activity-instruction';prompt.textContent=`Trace ${letter}: round first, then the line.`;
 const canvas=document.createElement('canvas');canvas.width=360;canvas.height=260;canvas.className='writing-canvas';canvas.setAttribute('aria-label',`Writing space for lowercase ${letter}`);canvas.style.touchAction='none';
 const c=canvas.getContext('2d');let down=false,points=[],done=false;
 const line=(a,b,n=18)=>Array.from({length:n},(_,i)=>({x:a.x+(b.x-a.x)*i/(n-1),y:a.y+(b.y-a.y)*i/(n-1)}));
 const curve=(a,b,c,d,n=30)=>Array.from({length:n},(_,i)=>{const t=i/(n-1),u=1-t;return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};});
 const circle=Array.from({length:30},(_,i)=>{const t=-Math.PI/4-i/29*2*Math.PI;return {x:180+53*Math.cos(t),y:175+53*Math.sin(t)};});
 const strokes=letter==='s'?[curve({x:221,y:94},{x:106,y:48},{x:112,y:156},{x:180,y:150}),curve({x:180,y:150},{x:254,y:151},{x:242,y:250},{x:126,y:213})]:letter==='f'?[curve({x:226,y:75},{x:157,y:40},{x:175,y:127},{x:175,y:228}),line({x:132,y:132},{x:227,y:132})]:[circle,line({x:218,y:letter==='d'?62:123},{x:218,y:228})];
 const guides=strokes.flat();prompt.textContent=letter==='s'?'Trace s: curve round, then curve back.':letter==='f'?'Trace f: curve over, down, then across.':`Trace ${letter}: round first, then the line.`;
 const visited=new Set();
 const draw=()=>{c.clearRect(0,0,360,260);c.strokeStyle='#d7cfb7';c.lineWidth=2;for(const y of [62,122,228]){c.beginPath();c.moveTo(28,y);c.lineTo(332,y);c.stroke();}c.strokeStyle='#b5baaf';c.lineWidth=17;c.lineCap='round';c.lineJoin='round';for(const stroke of strokes){c.beginPath();stroke.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}c.fillStyle='#173d38';c.beginPath();c.arc(guides[0].x,guides[0].y,7,0,Math.PI*2);c.fill();c.strokeStyle='#173d38';c.lineWidth=10;for(const stroke of points){c.beginPath();stroke.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}};
 const finish=()=>{if(done)return;done=true;onDone({supported:true,measure:'guided writing participation'});};
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*360/r.width,y:(e.clientY-r.top)*260/r.height};};
 canvas.onpointerdown=e=>{if(done)return;e.preventDefault();onSupport();down=true;points.push([point(e)]);canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!down||done)return;const p=point(e);points.at(-1).push(p);guides.forEach((g,i)=>{if(Math.hypot(p.x-g.x,p.y-g.y)<29)visited.add(i);});draw();};
 canvas.onpointerup=()=>{down=false;let offset=0;const complete=strokes.every(stroke=>{const count=stroke.filter((_,i)=>visited.has(offset+i)).length;offset+=stroke.length;return count>=stroke.length*.72;});if(complete)finish();};canvas.onpointercancel=()=>{down=false;};
 const controls=document.createElement('div');controls.className='activity-actions';
 const clear=document.createElement('button');clear.textContent='Try the letter again';clear.onclick=()=>{points=[];visited.clear();draw();};
 const alternate=document.createElement('label');alternate.className='typing-alternative';alternate.textContent=`Or type ${letter}: `;
 const input=document.createElement('input');input.maxLength=1;input.autocomplete='off';input.autocapitalize='off';input.spellcheck=false;input.setAttribute('aria-label',`Type ${letter} instead of tracing`);input.oninput=()=>{onSupport();if(input.value.toLowerCase()===letter)finish();};alternate.append(input);controls.append(clear,alternate);root.append(prompt,canvas,controls);draw();return root;
}
export function sentenceActivity({sentences,onDone,onSupport=()=>{},onWord=()=>{}}){
 const root=document.createElement('div');root.className='sentence-activity';let index=0,settled=false;
 const show=()=>{
  root.replaceChildren();const instruction=document.createElement('p');instruction.className='activity-instruction';instruction.textContent='Read aloud. Move your finger under the sentence as you read.';
  const count=document.createElement('p');count.className='reading-count';count.textContent=`Sentence ${index+1} of ${sentences.length}`;
  const line=document.createElement('p');line.className='child-sentence';
  for(const text of sentences[index].split(' ')){const w=document.createElement('button');w.className='sentence-word';w.textContent=text;w.setAttribute('aria-label',`Help with ${text.replace(/[.,!?]/g,'')}`);w.onclick=()=>{onSupport();onWord(text.replace(/[.,!?]/g,''));};line.append(w);}
  const track=document.createElement('input');track.type='range';track.min='0';track.max='100';track.value='0';track.className='sentence-track';track.setAttribute('aria-label','Follow the sentence with your finger');
  let consumed=false;
  const finish=()=>{if(Number(track.value)<97||settled||consumed)return;consumed=true;if(index<sentences.length-1){index++;show();}else{settled=true;onDone({correct:null,measure:'sentence reading participation'});}};
  track.oninput=()=>{track.style.setProperty('--read-progress',track.value+'%');};track.onchange=finish;track.onpointerup=finish;track.onkeyup=finish;
  const note=document.createElement('p');note.className='activity-instruction';note.textContent='Tap a word if you want help. The story waits for your finger.';
  root.append(count,instruction,line,track,note);
 };show();return root;
}
