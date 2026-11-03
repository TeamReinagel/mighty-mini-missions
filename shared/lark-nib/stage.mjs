import {storyAsset} from '../story-cache.mjs';
import {StoryStage,splitAtlas} from '../../moon-path/stage.mjs';
import {prepareCharacterFrames} from '../../moon-path/character-motion.mjs';
export function splitPair(image){return [0,1].map(i=>{const c=document.createElement('canvas');c.width=Math.floor(image.width/2)-16;c.height=image.height-16;c.getContext('2d').drawImage(image,i*image.width/2+8,8,image.width/2-16,image.height-16,0,0,c.width,c.height);return c;});}
export class NextStage extends StoryStage{
 constructor(canvas,{base,season}){super(canvas);this.base=base;this.season=season;this.current={scene:'woods',visual:season===1?'big-sail':'bag'};this.parts={};}
 async load(progress=()=>{}){
 const files={woods:new URL('../../moon-path/assets/woods.png',import.meta.url),bag:new URL('../../bag-at-the-door/assets/courier-bag.png',import.meta.url),'lark-talk':new URL('../../moon-path/assets/lark-talk.png',import.meta.url),'nib-talk':new URL('../../moon-path/assets/nib-talk.png',import.meta.url),'lark-walk':new URL('../../moon-path/assets/lark-walk.png',import.meta.url),'nib-walk':new URL('../../moon-path/assets/nib-walk.png',import.meta.url)};
 if(this.season===1){files.ridge=new URL('assets/ridge.png',this.base);files.wagons=new URL('assets/wagons.png',this.base);files.supplies=new URL('assets/supplies.png',this.base);}else{files.creek=new URL('assets/creek.png',this.base);files.markers=new URL('assets/markers.png',this.base);}
 let n=0;await Promise.all(Object.entries(files).map(async([key,url])=>{const img=new Image();img.src=storyAsset(url.href);await img.decode();this.images[key]=img;progress(++n,Object.keys(files).length);}));
 for(const name of ['lark','nib']){const f=prepareCharacterFrames(name,splitAtlas(this.images[`${name}-talk`],true),splitAtlas(this.images[`${name}-walk`],true));this.frames[`${name}-talk`]=f.talk;this.frames[`${name}-walk`]=f.walk;}
 if(this.images.markers)[this.parts.fin,this.parts.fan]=splitPair(this.images.markers);
 if(this.images.wagons)[this.parts['large-sail'],this.parts['small-sail']]=splitPair(this.images.wagons);
 if(this.images.supplies)[this.parts.mat,this.parts.sack]=splitPair(this.images.supplies);
 this.ready=true;
 }
 show(beat){this.current=beat;}
 drawPart(image,x,bottom,width,height=width){if(image)this.ctx.drawImage(image,x-width/2,bottom-height,width,height);}
 draw(){const c=this.ctx,w=this.W,h=this.H;if(!w||!h)return;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,w,h);const bg=this.images[this.current.scene]||this.images.woods;if(bg)c.drawImage(bg,0,0,w,h);else{c.fillStyle='#775637';c.fillRect(0,0,w,h);}if(!this.ready)return;
 if(this.season===1){this.drawPart(this.parts[this.current.visual==='small-sail'?'small-sail':'large-sail'],w*.52,h*.89,h*.77,h*.77);}
 else {if(['markers','fin'].includes(this.current.visual)){this.drawPart(this.parts.fin,w*.41,h*.75,h*.43,h*.43);this.drawPart(this.parts.fan,w*.67,h*.73,h*.40,h*.40);}this.drawPart(this.images.bag,w*.52,h*.90,h*.33,h*.30);}
 // Every anchor is on the broad dry foreground. No boat or water contact is inferred.
 this.actor('lark',w*.17,h*.89,h*.39,{talking:this.speaker==='lark'});this.actor('nib',w*.85,h*.89,h*.42,{talking:this.speaker==='nib',flip:true});
 }
 picture(name){const c=document.createElement('canvas');c.width=260;c.height=230;c.className='activity-picture';c.setAttribute('aria-label',name.replaceAll('-',' '));const image=this.parts[name];if(image)c.getContext('2d').drawImage(image,0,0,260,230);return c;}
}
