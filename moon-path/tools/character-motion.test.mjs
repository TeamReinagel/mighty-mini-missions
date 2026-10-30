import test from 'node:test';
import assert from 'node:assert/strict';
import {CHARACTER_RIGS,mouthWeight,bodyWeight,mixMaskedPixels} from '../character-motion.mjs';

test('Speech changes only the mouth and walking keeps every head pixel fixed',()=>{
  const width=512,base=new Uint8ClampedArray(width*width*4).fill(80),moving=new Uint8ClampedArray(base.length).fill(200);
  for(const rig of Object.values(CHARACTER_RIGS)){
    const talk=mixMaskedPixels(base,moving,width,(x,y)=>mouthWeight(x,y,rig.mouth));
    const walk=mixMaskedPixels(base,moving,width,(_x,y)=>bodyWeight(y,rig.bodyTop,rig.bodyBlend));
    let mouthChanged=0,bodyChanged=0;
    for(let y=0;y<width;y++)for(let x=0;x<width;x++){
      const p=(y*width+x)*4;
      if(talk[p]!==base[p]){mouthChanged++;assert.ok(x>rig.mouth.x&&x<rig.mouth.x+rig.mouth.w&&y>rig.mouth.y&&y<rig.mouth.y+rig.mouth.h);}
      if(y<=rig.bodyTop)assert.equal(walk[p],base[p]);else if(walk[p]!==base[p])bodyChanged++;
    }
    assert.ok(mouthChanged>500);assert.ok(bodyChanged>5000);
  }
});
test('A moving foot replaces transparent space without leaving an old foot behind',()=>{
  const base=new Uint8ClampedArray([200,100,50,255,0,0,0,0]);
  const next=new Uint8ClampedArray([0,0,0,0,200,100,50,255]);
  assert.deepEqual(mixMaskedPixels(base,next,2,()=>1),next);
  assert.deepEqual(mixMaskedPixels(base,next,2,()=>0),base);
  assert.deepEqual([...mixMaskedPixels(base,next,2,()=>.5)],[200,100,50,128,200,100,50,128]);
});
