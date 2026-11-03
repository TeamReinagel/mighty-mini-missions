export function validateProductionRecording(manifest,beats){
 const errors=[],expected=beats.flatMap(b=>b.paragraphs.map((text,i)=>[`${b.id}:p${i+1}`,text]));
 if(manifest?.approved!==true||manifest?.status!=='approved')errors.push('Recording is not approved');
 if(!/^[a-f0-9]{64}$/i.test(manifest?.sourceSHA256||''))errors.push('Missing source recording hash');
 if(!(manifest?.sourceDuration>0))errors.push('Missing decoded source duration');
 if(Object.keys(manifest?.entries||{}).length!==expected.length)errors.push('Paragraph count does not match');
 let end=0;const files=new Set();
 for(const [id,text]of expected){const e=manifest?.entries?.[id];
  if(!e||e.text!==text||!/^assets\/narration\/[\w.-]+\.(mp3|m4a|wav)$/.test(e.file||'')||!(e.duration>0)){errors.push(`Missing or mismatched paragraph ${id}`);continue;}
  if(files.has(e.file))errors.push(`Repeated audio file ${id}`);files.add(e.file);
  if(Math.abs(e.sourceStart-end)>.001||!(e.sourceEnd>e.sourceStart)||Math.abs(e.sourceEnd-e.sourceStart-e.duration)>.04||e.source!=='elevenlabs-upload')errors.push(`Unverified source range ${id}`);end=e.sourceEnd;
  let cueEnd=0;if(!e.cues?.length)errors.push(`Missing cues ${id}`);for(const c of e.cues||[]){if(!['lark','nib','narrator'].includes(c.speaker)||!c.text||c.start<cueEnd||!(c.end>c.start)||c.end>e.duration+.03)errors.push(`Invalid cue ${id}`);cueEnd=c.end;}
 }
 if(Math.abs(end-manifest?.sourceDuration)>.001)errors.push('Clips do not cover the complete recording');
 return errors;
}
