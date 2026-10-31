import {StoryStage,splitAtlas} from '../moon-path/stage.mjs';
import {prepareCharacterFrames} from '../moon-path/character-motion.mjs';

export class DoorStage extends StoryStage {
  constructor(canvas){super(canvas);this.visual='packed';this.packed=[];this.speaker=null;}
  async load(onProgress=()=>{}){
    const names=['library','camp','courier-bag','lark-talk','nib-talk','lark-walk','nib-walk','latch-closeup','strap-loop','felt-pad','invitation-hut','invitation-mill','invitation-fern','doorway-tag','reading-label'];let n=0;
    await Promise.all(names.map(async name=>{const img=new Image();img.src=new URL(`assets/${name}.png`,import.meta.url).href;await img.decode();this.images[name]=img;onProgress(++n,names.length);}));
    for(const name of ['lark','nib']){const frames=prepareCharacterFrames(name,splitAtlas(this.images[`${name}-talk`],true),splitAtlas(this.images[`${name}-walk`],true));this.frames[`${name}-talk`]=frames.talk;this.frames[`${name}-walk`]=frames.walk;}
    this.ready=true;
  }
  show(beat){this.scene={id:beat.id};this.visual=beat.visual;}
  draw(){
    const c=this.ctx,w=this.W,h=this.H;if(!w||!h)return;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,w,h);
    if(!this.images.library){c.fillStyle='#55412c';c.fillRect(0,0,w,h);return;}
    // The canvas keeps the plate's aspect ratio. No portrait crop changes support planes.
    c.drawImage(this.visual==='depart'&&this.images.camp?this.images.camp:this.images.library,0,0,w,h);if(!this.ready)return;
    const caught=['caught','unpacked','padded','lifted'].includes(this.visual),fly=this.visual==='lifted';
    const bx=w*(caught?.625:.60),by=h*.84,bw=w*.215,bh=h*.405;
    if(this.visual==='depart'){
      this.actor('lark',w*.39,h*.86,h*.39,{talking:this.speaker==='lark'});
      this.actor('nib',w*.86,h*.82,h*.39,{talking:this.speaker==='nib',flip:true});
    }else{
      this.actor('lark',w*(fly?.54:.36),h*(fly?.45:.86),h*(fly?.25:.39),{talking:this.speaker==='lark'});
      this.actor('nib',w*.86,h*.875,h*.43,{talking:this.speaker==='nib',flip:true});
    }
    // Bag base and character feet always meet the visible dry floor.
    c.save();c.globalAlpha=.22;c.fillStyle='#332219';c.beginPath();c.ellipse(bx,by,bw*.43,bh*.035,0,0,Math.PI*2);c.fill();c.restore();
    if(caught){
      c.drawImage(this.images['strap-loop'],w*.548,h*.36,w*.077,h*.15);
    }
    c.drawImage(this.images['courier-bag'],bx-bw/2,by-bh,bw,bh);
    if(['padded','lifted','free','packed','depart'].includes(this.visual)&&this.scene?.id!=='a-library-to-share'){
      const x=caught?w*.565:bx-bw*.1,y=caught?h*.40:by-bh*.77;
      c.drawImage(this.images['felt-pad'],x-h*.012,y-h*.012,h*.075,h*.05);
    }
    if(fly){
      // A short explicit flight cue distinguishes airborne Lark from standing characters.
      c.strokeStyle='#f8e5baaa';c.lineWidth=2;c.setLineDash([4,5]);c.beginPath();c.moveTo(w*.38,h*.67);c.quadraticCurveTo(w*.43,h*.45,w*.52,h*.45);c.stroke();c.setLineDash([]);
    }
    const loaded=['packed','caught','depart'].includes(this.visual);
    for(let i=0;i<3;i++){
      const ew=w*.045,eh=ew*.6;
      const x=loaded?bx-bw*.34+i*bw*.31:w*(.045+i*.055);
      const y=loaded?by-bh*.29:h*.425-eh;
      c.drawImage(this.images[['invitation-hut','invitation-mill','invitation-fern'][i]],x,y,ew,eh);
    }
  }
}
