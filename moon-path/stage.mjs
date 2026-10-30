import {prepareCharacterFrames} from './character-motion.mjs?v=mouth-layers-v3';
const IMAGE_NAMES=['camp','lagoon','woods','river','lark-talk','nib-talk','lark-walk','nib-walk','props'];
export const PROP={wagon:0,case:1,openCase:2,map:3,book:4,lantern:5,boat:6,umbrella:7,mushroom:8,moss:9,flower:10,rock:11,machine:12,bells:13,treasure:14,apple:15};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const ease=t=>t*t*(3-2*t);
const mix=(a,b,t)=>a+(b-a)*t;

export function splitAtlas(image,normalize=false){
  const frames=[];
  for(let i=0;i<16;i++){
    const sx=Math.round(i%4*image.width/4),sy=Math.round(Math.floor(i/4)*image.height/4),sw=Math.round((i%4+1)*image.width/4)-sx,sh=Math.round((Math.floor(i/4)+1)*image.height/4)-sy;
    const temp=document.createElement('canvas');temp.width=sw;temp.height=sh;
    const c=temp.getContext('2d',{willReadFrequently:true});c.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);
    const data=c.getImageData(0,0,sw,sh).data;
    let x0=sw,y0=sh,x1=0,y1=0;
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(data[(y*sw+x)*4+3]>35){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
    if(x0>=x1||y0>=y1){x0=0;y0=0;x1=sw-1;y1=sh-1;}
    const frame=document.createElement('canvas');frame.width=512;frame.height=512;const out=frame.getContext('2d');
    const w=x1-x0+1,h=y1-y0+1,ratio=Math.min(472/w,normalize?472/h:480/h),dw=w*ratio,dh=h*ratio;
    out.drawImage(temp,x0,y0,w,h,(512-dw)/2,normalize?492-dh:(512-dh)/2,dw,dh);
    frames.push(frame);
  }
  return frames;
}

export class StoryStage{
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.images={};this.frames={};this.time=0;this.last=performance.now();this.lastDraw=0;
    this.scene={background:'camp'};this.beat={stage:'wagon'};this.speaker=null;this.paused=false;this.welcome=true;this.challenge=null;this.motion=null;this.flags={};this.reveal={x:.35,y:.5,active:false,found:false};
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize=()=>{const r=canvas.getBoundingClientRect();const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);this.W=r.width;this.H=r.height;this.dpr=d;};
    new ResizeObserver(this.resize).observe(canvas);this.resize();
    this.tick=this.tick.bind(this);requestAnimationFrame(this.tick);
  }
  async load(onProgress=()=>{}){
    let n=0;await Promise.all(IMAGE_NAMES.map(async name=>{const img=new Image();img.decoding='async';img.src=`assets/${name}.png`;await img.decode();this.images[name]=img;onProgress(++n,IMAGE_NAMES.length);}));
    for(const name of ['lark','nib']){
      const frames=prepareCharacterFrames(name,splitAtlas(this.images[`${name}-talk`],true),splitAtlas(this.images[`${name}-walk`],true));
      this.frames[`${name}-talk`]=frames.talk;this.frames[`${name}-walk`]=frames.walk;
    }
    this.props=splitAtlas(this.images.props);this.ready=true;
  }
  set(scene,beat){if(this.scene.id!==scene.id){this.flags={};this.motion=null;this.reveal={x:.35,y:.5,active:false,found:false};if(scene.id==='bring-mouse-home')this.flags.drifted=true;if(scene.id==='our-first-chapter')this.flags.parked=true;}
    this.scene=scene;this.beat=beat;this.challenge=beat.kind==='challenge'?beat:null;this.speaker=null;
  }
  followNarration(cues,time,defaultStage){
    const reached=cues.filter(c=>c.at<=time);
    const latest=reached.at(-1),key=latest?.key||'initial';
    const backwards=time<(this.narrationTime??0)-.02;this.narrationTime=time;
    if(key===this.narrationVisualKey&&!backwards){if(this.motion?.narrated&&this.progress()>=1)this.motion=null;return;}
    this.narrationVisualKey=key;
    this.beat={...this.beat,stage:latest?.stage||defaultStage};
    // Reconstruct persistent flags when a saved recording resumes mid-clip.
    for(const cue of reached)Object.assign(this.flags,cue.flags||{});
    this.motion=null;
    if(latest?.action){this.cue(latest.action,latest.duration||3);this.motion.sourceAt=latest.at;this.motion.narrated=true;}
  }
  cue(action,duration=2){
    this.motion={name:action,start:this.time,duration:Math.max(.2,duration)};
    if(action==='wagon-stop')this.flags.parked=true;
    if(action==='bridge-rise')this.flags.bridge=true;
    if(action==='boat-arrive')this.flags.arrived=true;
    if(action==='boat-drift')this.flags.drifted=true;
    if(action==='boat-return'){this.flags.returned=true;this.flags.drifted=false;}
    if(action==='stone-reveal')this.reveal.found=true;
    if(action==='treasure-store')this.flags.stored=true;
    if(action==='repair-glow')this.flags.repaired=true;
  }
  progress(){if(!this.motion)return 0;const elapsed=this.motion.narrated?(this.narrationClock?.()??this.narrationTime)-this.motion.sourceAt:this.time-this.motion.start;return clamp(elapsed/this.motion.duration,0,1);}
  tick(now){const dt=Math.min(.1,(now-this.last)/1000);this.last=now;if(!this.paused)this.time+=dt;if(now-this.lastDraw>1000/16){this.lastDraw=now;this.draw();}requestAnimationFrame(this.tick);}
  background(ctx,w,h,bg,dim=false){const img=this.images[bg==='evening'?'river':bg]||this.images.camp;if(!img){ctx.fillStyle='#204950';ctx.fillRect(0,0,w,h);return;}const scale=Math.max(w/img.width,h/img.height),river=bg==='river'||bg==='evening';let x=(w-img.width*scale)/2;if(w/h<1.3&&river)x=0;else if(w/h<.8&&bg==='camp')x=(w-img.width*scale)*.15;ctx.drawImage(img,x,(h-img.height*scale)/2,img.width*scale,img.height*scale);if(dim){ctx.fillStyle='#10274455';ctx.fillRect(0,0,w,h);}}
  prop(index,x,y,w,h=w,ctx=this.ctx){if(this.props?.[index])ctx.drawImage(this.props[index],x-w/2,y-h/2,w,h);}
  actor(name,x,foot,size,{walking=false,talking=false,flip=false,ctx=this.ctx}={}){
    const frames=this.frames[`${name}-${walking?'walk':'talk'}`];if(!frames)return;
    let f=0;
    if(!this.reduced&&walking)f=Math.floor(this.time*12)%16;
    else if(!this.reduced&&talking)f=Math.floor(this.time*13)%16;
    ctx.save();ctx.globalAlpha=.2;ctx.fillStyle='#0d252a';ctx.filter=`blur(${size*.018}px)`;ctx.beginPath();ctx.ellipse(x,foot-size*.025,size*.27,size*.055,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();if(flip){ctx.translate(x,0);ctx.scale(-1,1);x=0;}ctx.drawImage(frames[f],x-size/2,foot-size,size,size);ctx.restore();
    if(ctx===this.ctx)this.lastFrames={...this.lastFrames,[name]:{frame:f,sheet:`${name}-${walking?'walk':'talk'}`}};
  }
  draw(){
    const c=this.ctx,w=this.W,h=this.H;if(!w||!h)return;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,w,h);
    this.background(c,w,h,this.scene.background,this.scene.background==='evening');if(!this.ready)return;
    const portrait=h/w>1.05,focus=!!this.challenge&&!this.welcome;const stage=this.beat.stage||'wagon';
    const motion=this.motion?.name||'',t=this.progress(),u=ease(t),travel=(motion==='travel'||motion==='cross-bridge')&&t<1;
    let lX=w*(focus?.16:.24),nX=w*(focus?.84:.75),foot=h*(portrait?.79:.83);
    let size=Math.min(w*(portrait?.45:.29),h*.58),nSize=size*.93;
    if(focus){size=Math.min(w*.23,h*.39);nSize=size*.95;}
    let nFoot=foot,lFoot=foot;let boatX=w*.78,boatY=h*.62,boatW=Math.min(w*.32,h*.60);
    if(this.flags.arrived)boatX=w*.62;
    if(this.flags.drifted)boatX=w*.8;
    if(this.flags.returned)boatX=w*.61;
    if(motion==='boat-arrive')boatX=mix(w*.81,w*.62,u);
    if(motion==='boat-drift')boatX=mix(w*.62,w*.81,u);
    if(motion==='boat-return')boatX=mix(w*.81,w*.61,u);
    if(this.welcome){lX=w*(portrait?.36:.68);nX=w*(portrait?.70:.86);size=Math.min(w*(portrait?.44:.27),h*.48);nSize=size*.95;lFoot=nFoot=h*(portrait?.86:.86);}
    if(travel&&!this.reduced){lX+=Math.sin(t*Math.PI)*w*.07;nX+=Math.sin(t*Math.PI)*w*.07;}
    if(stage==='wagon'&&!this.welcome){
      const wagonMoving=motion==='wagon-roll'&&!this.flags.parked&&t<1;
      let wagonX=w*.65;if(motion==='wagon-roll'&&!this.flags.parked)wagonX=mix(w*.44,w*.65,u);
      const wagonY=foot-size*.10;nX=wagonX;nFoot=wagonY-size*.15;nSize=size*.76;lX=wagonX-size*.8;
      this.actor('nib',nX,nFoot,nSize,{talking:this.speaker==='nib'});
      this.prop(PROP.wagon,wagonX,wagonY,Math.min(w*.38,h*.55));
      this.actor('lark',lX,lFoot,size,{walking:wagonMoving,talking:this.speaker==='lark'});
      return;
    }
    if(stage.startsWith('river-')){
      lX=w*.14;nX=w*(w/h<1.3?.32:.34);size=Math.min(w*(portrait?.36:.24),h*.48);nSize=size*.9;
      if(focus){lX=w*.12;size=Math.min(w*.21,h*.35);nSize=size*.86;}
      if(stage==='river-rescue'){
        nX=boatX;nFoot=boatY+boatW*.13;nSize=boatW*.62;
        if(this.flags.returned&&(motion!=='boat-return'||t>.9)){nX=w*.41;nFoot=foot;}
      }
      if(stage!=='river-rescue')this.prop(PROP.boat,boatX,boatY+boatW*.11,boatW);
    }
    // Props behind the cast. Their moving parts remain separate from the painted plates.
    if(stage==='case'&&!focus)this.prop(PROP.case,w*.50,h*.61,Math.min(w*.32,h*.49));
    if(stage==='map')this.prop(PROP.map,w*.51,h*.48,Math.min(w*.40,h*.61));
    if(stage==='lagoon'){
      if(!focus)this.prop(PROP.machine,w*.51,h*.64,Math.min(w*.23,h*.42));
      if(this.flags.bridge){c.save();c.globalAlpha=.24;c.strokeStyle='#fff1ad';c.lineWidth=5;for(let i=0;i<4;i++){c.beginPath();c.ellipse(w*(.25+i*.17),h*(.57-i*.06),w*.07,h*.025,0,0,Math.PI*2);c.stroke();}c.restore();}
    }
    if(stage==='woods-moss'||stage==='woods-mushroom'){
      if(!focus){this.prop(stage==='woods-moss'?PROP.moss:PROP.mushroom,w*.51,h*.67,Math.min(w*.20,h*.30));}
      if(motion==='mud-stuck'||motion==='mud-free')this.prop(PROP.wagon,w*.54,h*.77,Math.min(w*.28,h*.43));
    }
    if(stage==='river-book'&&!focus)this.prop(PROP.book,w*.56,h*.48,Math.min(w*.48,h*.72));
    if(stage==='river-trace'&&!focus)this.prop(PROP.machine,w*.57,h*.58,Math.min(w*.26,h*.5));
    if(stage==='river-rescue')this.prop(PROP.bells,w*.43,h*.57,Math.min(w*.19,h*.36));
    if(stage==='stone'){
      this.prop(PROP.map,w*.53,h*.48,Math.min(w*.45,h*.70));
      if(!focus)this.prop(PROP.lantern,w*.51,h*.66,Math.min(w*.17,h*.30));
    }
    if(stage==='journal')this.prop(PROP.book,w*.51,h*.48,Math.min(w*.54,h*.78));
    if(stage==='ending')this.prop(PROP.treasure,w*.51,h*.66,Math.min(w*.25,h*.41));
    this.actor('lark',lX,lFoot,size,{walking:travel,talking:this.speaker==='lark'||this.speaker==='joyce'});
    this.actor('nib',nX,nFoot,nSize,{walking:travel,talking:this.speaker==='nib'});
    if(stage==='river-rescue'){
      this.prop(PROP.lantern,boatX+boatW*.2,boatY-boatW*.1,boatW*.29);
      this.prop(PROP.boat,boatX,boatY+boatW*.24,boatW,boatW*.8);
      this.prop(PROP.umbrella,boatX+boatW*.22,boatY+boatW*.14,boatW*.3);
      if(this.flags.returned){c.save();c.strokeStyle='#b5945d';c.lineWidth=5;c.setLineDash([5,2]);c.beginPath();c.moveTo(w*.38,h*.62);c.quadraticCurveTo(w*.49,h*.70,boatX-boatW*.28,boatY+boatW*.18);c.stroke();c.restore();}
    }
    if(stage==='ending'&&this.flags.stored)this.prop(PROP.lantern,w*.51,h*.65,Math.min(w*.11,h*.2));
    if(motion==='apple-roll')this.prop(PROP.apple,mix(w*.85,w*.69,u),h*.79,Math.min(w*.07,h*.12));
    if(stage==='stone'&&((focus&&this.challenge?.type==='reveal')||this.reveal.found))this.drawReveal(w,h,c);
  }
  drawReveal(w,h,c){
    const bw=Math.min(680,w*.76),bh=h*.51,left=w*.5-bw/2,top=h*.21;
    const r=this.reveal;c.save();if(!r.found){c.beginPath();c.arc(left+bw*r.x,top+bh*r.y,Math.min(bw,bh)*.25,0,Math.PI*2);c.clip();}
    c.strokeStyle='#ffe39a';c.shadowColor='#ffd778';c.shadowBlur=12;c.lineWidth=5;c.setLineDash([7,7]);c.beginPath();c.moveTo(left+bw*.2,top+bh*.75);c.bezierCurveTo(left+bw*.65,top+bh*.68,left+bw*.3,top+bh*.28,left+bw*.76,top+bh*.26);c.stroke();c.setLineDash([]);this.prop(PROP.apple,left+bw*.76,top+bh*.26,bw*.12,bw*.12,c);c.restore();
    if(r.active&&!r.found){const grad=c.createRadialGradient(left+bw*r.x,top+bh*r.y,0,left+bw*r.x,top+bh*r.y,100);grad.addColorStop(0,'#fff8d855');grad.addColorStop(1,'#fff8d800');c.fillStyle=grad;c.fillRect(left,top,bw,bh);this.prop(PROP.lantern,left+bw*r.x,top+bh*r.y,Math.min(bw*.15,100));}
  }
  paintProp(canvas,index){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);this.prop(index,canvas.width/2,canvas.height/2,canvas.width,canvas.height,c);}
  paintMap(canvas){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);this.prop(PROP.map,canvas.width/2,canvas.height/2,canvas.width,canvas.height,c);}
  paintLibrary(canvas,page,index=0){const c=canvas.getContext('2d');const w=canvas.width,h=canvas.height;this.background(c,w,h,page.background||'camp');this.actor('lark',w*.29,h*.97,w*.50,{ctx:c});this.actor('nib',w*.72,h*.97,w*.43,{ctx:c});if(index===0)this.prop(PROP.map,w*.53,h*.55,w*.28,w*.28,c);if(index===2)this.prop(PROP.machine,w*.53,h*.65,w*.25,w*.25,c);if(index>=3)this.prop(PROP.lantern,w*.53,h*.65,w*.23,w*.23,c);}
  stats(){return {ready:this.ready,frames:Object.fromEntries(Object.entries(this.frames).map(([k,v])=>[k,v.length])),renderFps:16,actors:this.lastFrames,action:this.motion?.name};}
}
