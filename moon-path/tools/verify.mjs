import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EPISODE,HELP_LINES} from '../episode.mjs';
import {freshProgress,readProgress,firstTry,heardChoice,tracePoints,advanceTrace,validateLocation} from '../logic.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await readFile(path.join(root,'assets/audio/manifest.json'),'utf8'));

test('The complete premiere has nine scenes and every voice line has a real recording',async()=>{
  assert.equal(EPISODE.scenes.length,9);assert.equal(EPISODE.library.length,5);
  const entries=[],ids=new Set();
  for(const scene of EPISODE.scenes)for(const beat of scene.beats){assert.ok(!ids.has(beat.id),'duplicate beat '+beat.id);ids.add(beat.id);if(beat.text)entries.push(beat);for(const key of ['correct','incorrect','hint'])if(beat[key]?.text)entries.push(beat[key]);}
  entries.push(...HELP_LINES,...EPISODE.library,{id:'phoneme-m',text:'Mmm.'});
  for(const entry of entries){const clip=manifest.lines[entry.id];assert.ok(clip,'missing audio '+entry.id);assert.ok(clip.duration>0,'unmeasured audio '+entry.id);assert.ok(clip.file.startsWith('assets/audio/')&&!clip.file.includes('..'));assert.ok((await stat(path.join(root,clip.file))).size>64);}
});
test('Every generated character sheet carries an alpha channel and a usable 4-by-4 atlas',async()=>{
  for(const name of ['lark-talk','nib-talk','lark-walk','nib-walk','props']){const png=await readFile(path.join(root,'assets',name+'.png'));assert.equal(png.toString('ascii',1,4),'PNG');assert.ok(png.readUInt32BE(16)>=1024);assert.ok(png.readUInt32BE(20)>=1024);assert.equal(png[25],6,'RGBA required for '+name);}
});
test('First choices remain separate from retries and help',()=>{
  const p=freshProgress(),beat={id:'choice',type:'letter',expected:'m'};
  firstTry(p,beat,'s');p.supported.push(beat.id);firstTry(p,beat,'m');assert.equal(p.attempts.length,1);assert.equal(p.attempts[0].correct,false);assert.equal(p.attempts[0].supported,false);
  firstTry(p,{id:'practice',type:'hum',expected:'m'},'m');assert.equal(p.attempts.length,1);
});
test('Ambiguous voice phrases cannot choose an answer',()=>{
  const choices=[{id:'m',say:'m'},{id:'s',say:'s'}];assert.equal(heardChoice('m or s',choices),null);assert.equal(heardChoice('mmm',choices)?.id,'m');assert.equal(heardChoice('something else',choices),null);
});
test('Tracing must start and follow the letter, and can resume after lifting',()=>{
  const points=tracePoints();assert.equal(advanceTrace(0,{x:1,y:1},points),0);let index=0;for(const point of points)index=advanceTrace(index,point,points);assert.ok(index>=points.length-5);
  let half=0;for(const point of points.slice(0,100))half=advanceTrace(half,point,points);const preserved=half;half=advanceTrace(half,points[half],points);assert.ok(half>=preserved);assert.ok(half<points.length-5);
});
test('Corrupt progress resets safely and stored locations stay inside the episode',()=>{
  assert.equal(readProgress({getItem:()=>'{broken'}).scene,0);const p=validateLocation({...freshProgress(),scene:999,beat:999},EPISODE);assert.equal(p.scene,8);assert.ok(p.beat<EPISODE.scenes[8].beats.length);
});
test('Published files contain no API secret or runtime dependency on Netlify speech',async()=>{
  for(const file of ['app.mjs','stage.mjs','episode.mjs','index.html']){const text=await readFile(path.join(root,file),'utf8');assert.ok(!/sk-(?:proj-)?[a-zA-Z0-9_-]{24,}/.test(text));assert.ok(!text.includes('api.openai.com'));assert.ok(!text.includes('speechSynthesis'));}
});
