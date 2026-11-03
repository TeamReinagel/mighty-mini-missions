#!/usr/bin/env python3
"""Rebuild this supplied recording's 38 contiguous clips. No model or upload needed."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse,hashlib,json,re,shutil,subprocess
ROOT=Path(__file__).resolve().parent
TOKEN=re.compile(r"[A-Za-z0-9]+(?:['’][A-Za-z]+)?")
tokens=lambda s:[m.group().lower().replace('’',"'") for m in TOKEN.finditer(s)]

def regions(text):
    at=0;previous=None
    for m in re.finditer(r'“([^”]+)”',text):
        if at<m.start():yield at,m.start(),'narrator'
        attribution=re.match(r'\s*(Lark|Nib)\b',text[m.end():])
        speaker=attribution[1].lower() if attribution else previous or 'narrator'
        yield m.start()+1,m.end()-1,speaker
        previous=speaker;at=m.end()
    if at<len(text):yield at,len(text),'narrator'

def compile_manifest(plan):
    entries={};previous=0
    for index,p in enumerate(plan['paragraphs']):
        assert abs(p['sourceStart']-previous)<1e-8
        assert p['sourceEnd']>p['sourceStart']
        previous=p['sourceEnd'];cues=[]
        words=plan['words'][p['wordStart']:p['wordEnd']]
        for begin,end,speaker in regions(p['spokenText']):
            group=[w for w in words if begin<=w['charStart'] and w['charEnd']<=end]
            at=0
            while at<len(group):
                finish=min(len(group),at+28)
                if finish<len(group):
                    for q in range(finish,at+12,-1):
                        if re.search(r'[.!?]',p['spokenText'][group[q-1]['charEnd']:group[q]['charStart']]):finish=q;break
                lo=begin if at==0 else group[at]['charStart']
                hi=end if finish==len(group) else group[finish]['charStart']
                start=max(0,group[at]['start']-p['sourceStart'])
                stop=min(p['duration'],group[finish-1]['end']-p['sourceStart'])
                assert stop>start,(p['id'],start,stop)
                cues.append({'start':round(start,6),'end':round(stop,6),'speaker':speaker,'text':p['spokenText'][lo:hi].strip()})
                at=finish
        assert tokens(' '.join(c['text'] for c in cues))==tokens(p['spokenText']),p['id']
        if index==0:cues=plan['preambleCues']+cues
        assert all(b['start']>=a['end'] for a,b in zip(cues,cues[1:])),p['id']
        entries[p['id']]={k:p[k] for k in ['text','spokenText','file','sourceStart','sourceEnd','duration','source','gateAfter']}|{'cues':cues}
    assert abs(previous-plan['source']['duration'])<1e-8
    assert len(plan['boundaries'])==len(entries)-1
    for b in plan['boundaries']:assert b['quietInterval']['start']<b['cut']<b['quietInterval']['end']
    return {'status':'approved','approved':True,'manuscriptSHA256':plan['manuscriptSHA256'],'sourceSHA256':plan['source']['sha256'],'sourceName':plan['source']['name'],'sourceDuration':plan['source']['duration'],'alignmentMethod':plan['method'],'cutPolicy':plan['cutPolicy'],'recordingDifferences':plan['recordingDifferences'],'entries':entries}

def decoded_seconds(ffmpeg,path):
    r=subprocess.run([ffmpeg,'-v','error','-i',str(path),'-vn','-ar','44100','-ac','1','-f','s16le','pipe:1'],capture_output=True,check=True)
    return len(r.stdout)/2/44100

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--audio',type=Path)
    parser.add_argument('--ffmpeg',default=shutil.which('ffmpeg'))
    parser.add_argument('--alignment',type=Path,default=ROOT/'narration-alignment.json')
    parser.add_argument('--output',type=Path,default=ROOT.parent)
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args();plan=json.loads(args.alignment.read_text());manifest=compile_manifest(plan)
    if args.check:
        print(json.dumps({'paragraphs':len(manifest['entries']),'sourceDuration':manifest['sourceDuration'],'quietCuts':len(plan['boundaries']),'gates':[b['gate'] for b in plan['boundaries'] if b['gate']],'contiguousSource':True,'captionCues':sum(len(e['cues']) for e in manifest['entries'].values())},indent=2));return
    if not args.audio or not args.ffmpeg:parser.error('Pass --audio ORIGINAL_MP3 and --ffmpeg EXECUTABLE.')
    if hashlib.sha256(args.audio.read_bytes()).hexdigest()!=manifest['sourceSHA256']:raise ValueError('Source hash differs. A new recording needs new alignment.')
    assert abs(decoded_seconds(args.ffmpeg,args.audio)-manifest['sourceDuration'])<1/44100
    def encode(item):
        id,e=item;out=args.output/e['file'];out.parent.mkdir(parents=True,exist_ok=True)
        subprocess.run([args.ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(args.audio),'-af',f"atrim=start_sample={round(e['sourceStart']*44100)}:end_sample={round(e['sourceEnd']*44100)},asetpts=PTS-STARTPTS",'-vn','-map_metadata','-1','-c:a','libmp3lame','-b:a','192k','-ar','44100','-ac','1',str(out)],check=True)
        duration=decoded_seconds(args.ffmpeg,out)
        if round(duration*44100)!=round(e['duration']*44100):raise ValueError('Decoded clip length differs: '+id)
        return {'id':id,'file':e['file'],'sourceStart':e['sourceStart'],'sourceEnd':e['sourceEnd'],'decodedDuration':duration,'expectedDuration':e['duration'],'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
    with ThreadPoolExecutor(max_workers=4) as pool:audit=list(pool.map(encode,manifest['entries'].items()))
    args.output.mkdir(parents=True,exist_ok=True)
    (args.output/'recording.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    (args.output/'tools/recording-audit.json').write_text(json.dumps({'source':plan['source'],'allSourceRangesContiguous':True,'allCutsInMeasuredQuiet':True,'sourceCoverageSeconds':sum(e['duration'] for e in manifest['entries'].values()),'clips':audit},indent=2)+'\n')
    print('Encoded and decoded-verified',len(audit),'clips, covering all',manifest['sourceDuration'],'seconds.')

if __name__=='__main__':main()
