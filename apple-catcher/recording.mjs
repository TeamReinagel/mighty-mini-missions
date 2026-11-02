import {BEATS} from './episode.mjs';
export const EXPECTED_TEXT=Object.fromEntries(BEATS.flatMap(b=>b.paragraphs.map((text,i)=>[`${b.id}:p${i+1}`,text])));
export const MANUSCRIPT_SHA256='92b4933bdc5d45d72489ffae800a0f0fbbb8b61696674a5e5f7c39bb8a0ac12a';
export function validateRecording(manifest){
  const errors=[];
  if(manifest?.approved!==true||manifest?.status!=='approved')errors.push('Recording is not approved');
  if(!/^[a-f0-9]{64}$/i.test(manifest?.sourceSHA256||''))errors.push('Missing source recording hash');
  if(!Number.isFinite(manifest?.sourceDuration)||manifest.sourceDuration<=0)errors.push('Missing decoded source duration');
  if(manifest?.manuscriptSHA256!==MANUSCRIPT_SHA256)errors.push('Recording targets a different manuscript');
  if(Object.keys(manifest?.entries||{}).length!==Object.keys(EXPECTED_TEXT).length)errors.push('Paragraph count differs from manuscript');
  let sourceEnd=0;const files=new Set();
  for(const[id,text]of Object.entries(EXPECTED_TEXT)){
    const e=manifest?.entries?.[id];
    if(!e||e.text!==text||!/^assets\/narration\/[\w.-]+\.(mp3|wav|m4a)$/.test(e.file||'')||!Number.isFinite(e.duration)||e.duration<=0){errors.push(`Missing or mismatched paragraph ${id}`);continue;}
    if(!Number.isFinite(e.sourceStart)||!Number.isFinite(e.sourceEnd)||Math.abs(e.sourceStart-sourceEnd)>.0001||e.sourceEnd<=e.sourceStart||Math.abs(e.duration-(e.sourceEnd-e.sourceStart))>.03||e.source!=='elevenlabs-upload')errors.push(`Invalid or noncontiguous source range ${id}`);
    sourceEnd=e.sourceEnd;
    if(files.has(e.file))errors.push(`Repeated recording file ${id}`);files.add(e.file);
    let previous=0;
    if(!e.cues?.length)errors.push(`Missing captions ${id}`);
    for(const c of e.cues||[]){if(!['narrator','lark','nib'].includes(c.speaker)||typeof c.text!=='string'||!c.text.trim()||!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<previous||!(c.end>c.start)||c.end>e.duration+.02)errors.push(`Invalid caption ${id}`);previous=c.end;}
  }
  if(Math.abs(sourceEnd-manifest?.sourceDuration)>.0001)errors.push('Clips do not cover the complete source recording');
  return errors;
}
