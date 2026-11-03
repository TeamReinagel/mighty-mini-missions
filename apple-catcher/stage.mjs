import {StoryStage,splitAtlas,PROP} from '../moon-path/stage.mjs';
import {prepareCharacterFrames} from '../moon-path/character-motion.mjs';
import {storyAsset} from '../shared/story-cache.mjs';

export function sceneAnchors(w,h){return {floor:h*.88,larkX:w*.17,nibX:w*.85,catcherX:w*.52,catcherWidth:w*.44};}
export class AppleStage extends StoryStage{
 constructor(canvas){super(canvas);this.current={scene:'orchard',visual:'loose'};this.state={};this.bounds=new Map();}
 async load(onProgress=()=>{}){
  const names=['camp','orchard','catcher-loose','catcher-ready','catcher-caught','route-box','map-board','map-section','ant-mark','moon-mark','reading-label','props','lark-talk','nib-talk','lark-walk','nib-walk'];let n=0;
  await Promise.all(names.map(async name=>{const img=new Image();img.src=storyAsset(new URL(`assets/${name}.png`,import.meta.url).href);await img.decode();this.images[name]=img;onProgress(++n,names.length);}));
  for(const name of ['lark','nib']){const f=prepareCharacterFrames(name,splitAtlas(this.images[`${name}-talk`],true),splitAtlas(this.images[`${name}-walk`],true));this.frames[`${name}-talk`]=f.talk;this.frames[`${name}-walk`]=f.walk;}
  this.props=splitAtlas(this.images.props);this.ready=true;this.setRatio();
 }
 setRatio(){const image=this.images[this.current.scene==='camp'?'camp':'orchard'];if(image)this.canvas.parentElement.style.aspectRatio=`${image.width}/${image.height}`;}
 show(beat,state){this.current=beat;this.state=state;this.setRatio();}
 crop(image){
  if(this.bounds.has(image))return this.bounds.get(image);
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
  const data=c.getImageData(0,0,canvas.width,canvas.height).data;let l=canvas.width,t=canvas.height,r=0,b=0;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(data[(y*canvas.width+x)*4+3]>40){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  const rect=r>l&&b>t?{x:l,y:t,w:r-l+1,h:b-t+1}:{x:0,y:0,w:image.width,h:image.height};this.bounds.set(image,rect);return rect;
 }
 bitmap(image,x,bottom,width){if(!image)return null;const r=this.crop(image),height=width*r.h/r.w;this.ctx.drawImage(image,r.x,r.y,r.w,r.h,x-width/2,bottom-height,width,height);return {left:x-width/2,top:bottom-height,width,height};}
 draw(){
  const c=this.ctx,w=this.W,h=this.H;if(!w||!h)return;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,w,h);
  const bg=this.images[this.current.scene==='camp'?'camp':'orchard'];if(!bg){c.fillStyle='#775637';c.fillRect(0,0,w,h);return;}
  c.drawImage(bg,0,0,w,h);if(!this.ready)return;
  if(this.current.scene==='camp'){
   this.bitmap(this.props[PROP.wagon],w*.53,h*.88,w*.28);
   this.bitmap(this.props[PROP.case],w*.52,h*.75,w*.105);
   this.bitmap(this.props[PROP.lantern],w*.51,h*.65,w*.045);
   this.bitmap(this.props[PROP.apple],w*.665,h*.88,w*.04);
   this.actor('lark',w*.26,h*.875,h*.40,{talking:this.speaker==='lark'});
   this.actor('nib',w*.81,h*.88,h*.42,{talking:this.speaker==='nib',flip:true});return;
  }
  const a=sceneAnchors(w,h),secured=this.state.loopFastened||this.current.visual!=='loose';
  const r=this.bitmap(this.images[this.state.applesReleased?'catcher-caught':secured?'catcher-ready':'catcher-loose'],a.catcherX,a.floor,a.catcherWidth);
  // Positions are relative to the actual alpha-cropped frame, then checked in the composite.
  if(r){
   this.bitmap(this.images['route-box'],r.left+r.width*.82,r.top+r.height*.315,r.width*.21);

  }
  if(['loose','ready'].includes(this.current.visual))for(let i=0;i<3;i++)this.bitmap(this.props[PROP.apple],w*(.61+i*.035),h*(.89+(i%2)*.015),w*.033);
  this.bitmap(this.props[PROP.case],w*.285,h*.90,w*.10);
  if(this.current.visual==='found')this.bitmap(this.images['map-section'],w*.285,h*.79,w*.075);
  this.actor('lark',a.larkX,a.floor,h*.39,{talking:this.speaker==='lark'});
  this.actor('nib',a.nibX,a.floor,h*.42,{talking:this.speaker==='nib',flip:true});
 }
}
