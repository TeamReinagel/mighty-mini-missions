// All coordinates refer to the normalized 512-pixel character canvas.
// A stable pose supplies the eyes, head, hands and silhouette during speech.
export const CHARACTER_RIGS={
  lark:{mouth:{x:176,y:190,w:114,h:66},sources:[{x:176,y:196,w:114,h:66},{x:174,y:196,w:114,h:66}],bodyTop:250,bodyBlend:38},
  nib:{mouth:{x:272,y:238,w:120,h:72},sources:[{x:263,y:242,w:120,h:72},{x:266,y:234,w:112,h:74}],bodyTop:300,bodyBlend:30},
};
const TALK_CYCLE=[0,0,1,1,0,2,2,0,1,1,2,0,1,2,0,0];

export function mouthWeight(x,y,{x:left,y:top,w,h}){
  const radius=Math.hypot((x-left-w/2)/(w/2),(y-top-h/2)/(h/2));
  return Math.max(0,Math.min(1,(1-radius)/.16));
}
export function bodyWeight(y,top,blend){return Math.max(0,Math.min(1,(y-top)/blend));}

// Blend premultiplied colors so transparent moving feet replace the old feet
// cleanly. Pixels outside the selected region remain byte-for-byte unchanged.
export function mixMaskedPixels(base,moving,width,weight){
  const result=new Uint8ClampedArray(base);
  for(let p=0;p<base.length;p+=4){
    const pixel=p/4,w=weight(pixel%width,Math.floor(pixel/width));if(w<=0)continue;
    if(w>=1){result.set(moving.subarray(p,p+4),p);continue;}
    const a0=base[p+3]*(1-w),a1=moving[p+3]*w,a=a0+a1;
    for(let c=0;c<3;c++)result[p+c]=a?(base[p+c]*a0+moving[p+c]*a1)/a:0;
    result[p+3]=a;
  }
  return result;
}

function canvas(){const c=document.createElement('canvas');c.width=c.height=512;return c;}
function pixels(c){return c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,512,512).data;}
function composite(base,moving,weight){
  const c=canvas(),ctx=c.getContext('2d'),image=ctx.createImageData(512,512);
  image.data.set(mixMaskedPixels(base,moving,512,weight));ctx.putImageData(image,0,0);return c;
}

export function prepareCharacterFrames(name,talk,walk){
  const rig=CHARACTER_RIGS[name],base=pixels(talk[0]);
  const mouths=[talk[0],...rig.sources.map((source,i)=>{
    const layer=canvas(),ctx=layer.getContext('2d'),target=rig.mouth;
    ctx.drawImage(talk[i===0?1:3],source.x,source.y,source.w,source.h,target.x,target.y,target.w,target.h);
    return composite(base,pixels(layer),(x,y)=>mouthWeight(x,y,target));
  })];
  const walkBase=pixels(walk[0]);
  return {
    talk:TALK_CYCLE.map(index=>mouths[index]),
    walk:walk.map(frame=>composite(walkBase,pixels(frame),(_x,y)=>bodyWeight(y,rig.bodyTop,rig.bodyBlend))),
  };
}
