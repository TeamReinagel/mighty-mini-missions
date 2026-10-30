#!/usr/bin/env python3
"""Rebuild the Moon Path's static narrated clips from the supplied original MP3.

Requires Python3 and FFmpeg with libmp3lame. No ASR model, API, key, or upload is
needed: the checked-in alignment records the approved local timing pass.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

SCRIPTS=Path(__file__).resolve().parent
PROJECT=SCRIPTS.parent
TOKEN=re.compile(r"[A-Za-z0-9]+(?:['’][A-Za-z]+)?")

def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def file_hash(path):
    digest=hashlib.sha256()
    with open(path,"rb") as stream:
        for block in iter(lambda:stream.read(1024*1024),b""):
            digest.update(block)
    return digest.hexdigest()

def audio_seconds(ffmpeg,path,sample_rate):
    # Decode one clip at a time and count PCM samples. This honors MP3 gapless
    # metadata and needs no separate ffprobe/macOS-only tool.
    result=subprocess.run([ffmpeg,"-hide_banner","-loglevel","error","-i",str(path),"-vn","-ar",str(sample_rate),"-ac","1","-f","s16le","pipe:1"],capture_output=True,check=True)
    return len(result.stdout)/(2*sample_rate)

def paragraph_regions(alignment):
    text=alignment["manuscriptText"]
    regions=[]
    for paragraph in alignment["paragraphs"]:
        begin,end=paragraph["charStart"],paragraph["charEnd"]
        cursor=begin
        for match in re.finditer(r"“.*?”",text[begin:end],re.S):
            quote_start,quote_end=begin+match.start(),begin+match.end()
            if quote_start>cursor:
                regions.append({"start":cursor,"end":quote_start,"speaker":"narrator"})
            attribution=re.match(r"\s*(Lark|Nib)\b",text[quote_end:])
            if not attribution:
                raise ValueError("A quoted passage has no recognized prose attribution.")
            regions.append({"start":quote_start,"end":quote_end,"speaker":attribution.group(1).lower()})
            cursor=quote_end
        if cursor<end:
            regions.append({"start":cursor,"end":end,"speaker":"narrator"})
    return regions

def cue_groups(words,text,maximum):
    index=0
    while index<len(words):
        end=min(len(words),index+maximum)
        if end<len(words):
            # Prefer a sentence boundary within the last part of this group.
            for candidate in range(end,index+max(5,maximum//3),-1):
                after=text[words[candidate-1]["charEnd"]:words[candidate]["charStart"]]
                if re.search(r"[.!?…]",after):
                    end=candidate
                    break
        yield index,end,words[index:end]
        index=end

def captions_for(chunk,alignment,regions,maximum):
    cues=[]
    text=alignment["manuscriptText"]
    for region in regions:
        begin=max(region["start"],chunk["charStart"])
        end=min(region["end"],chunk["charEnd"])
        if begin>=end:
            continue
        words=[word for word in alignment["words"] if word["charStart"]>=begin and word["charEnd"]<=end]
        for group_start,group_end,group in cue_groups(words,text,maximum):
            lo=begin if group_start==0 else group[0]["charStart"]
            hi=end if group_end==len(words) else words[group_end]["charStart"]
            cue_text=text[lo:hi].strip()
            if not cue_text:
                continue
            start=max(0,group[0]["start"]-chunk["sourceStart"])
            finish=min(chunk["duration"],group[-1]["end"]-chunk["sourceStart"])
            if finish<start:
                raise ValueError("A caption ends before it starts.")
            cues.append({"start":round(start,6),"end":round(finish,6),"text":cue_text,"speaker":region["speaker"]})
    return sorted(cues,key=lambda cue:(cue["start"],cue["end"]))

def compile_layout(alignment,plan):
    text=alignment["manuscriptText"]
    words=alignment["words"]
    if hashlib.sha256(text.encode("utf-8")).hexdigest()!=alignment["manuscriptSha256"]:
        raise ValueError("The portable manuscript hash does not match its exact text.")
    if any(right["start"]<left["start"] for left,right in zip(words,words[1:])):
        raise ValueError("Word starts must be monotonic before caption compilation.")
    metas={scene["id"]:scene for scene in plan["scenes"]}
    gates=sorted(alignment["gates"],key=lambda gate:gate["at"])
    if len(gates)!=13 or len(alignment["scenes"])!=9:
        raise ValueError("This edition expects nine scenes and thirteen interaction gates.")
    events=[]
    for index,event in enumerate(plan["visuals"],1):
        if text.count(event["anchor"])!=1:
            raise ValueError("A visual anchor must match the manuscript exactly once.")
        char=text.index(event["anchor"])
        word=next(word for word in words if word["charStart"]>=char)
        events.append({**event,"key":f"source-visual-{index:02d}","sourceChar":char,"sourceTime":word["start"]})
    events.sort(key=lambda event:event["sourceTime"])
    regions=paragraph_regions(alignment)
    chunks=[]
    scenes=[]
    for scene_index,boundary in enumerate(alignment["scenes"]):
        meta=metas[boundary["id"]]
        scene_start=boundary["suggestedCut"]
        scene_end=alignment["scenes"][scene_index+1]["suggestedCut"] if scene_index+1<len(alignment["scenes"]) else alignment["source"]["duration"]
        char_start=boundary["charStart"]
        if char_start>0 and text[char_start-1]=="“":
            char_start-=1
        next_char=alignment["scenes"][scene_index+1]["charStart"] if scene_index+1<len(alignment["scenes"]) else len(text)
        if next_char<len(text) and next_char>0 and text[next_char-1]=="“":
            next_char-=1
        scene_gates=[gate for gate in gates if scene_start<gate["at"]<scene_end]
        points=[{"at":scene_start,"char":char_start}]+[{"at":gate["at"],"char":gate["sourceChar"],"gate":gate} for gate in scene_gates]+[{"at":scene_end,"char":next_char}]
        beats=[]
        for left,right in zip(points,points[1:]):
            number=len(chunks)+1
            duration=right["at"]-left["at"]
            if duration<=0:
                raise ValueError("Narration source intervals must have positive duration.")
            chunk={"id":f"narration-{number:02d}","file":f"assets/audio/narration/{number:02d}.mp3","sourceStart":left["at"],"sourceEnd":right["at"],"duration":duration,"charStart":left["char"],"charEnd":right["char"],"sceneId":meta["id"]}
            flags=dict(plan["flagDefaults"])
            stage=meta["initialStage"]
            for event in events:
                if event["sourceTime"]<=left["at"]:
                    flags.update(event.get("flags",{}))
                    if event["sourceTime"]>=scene_start:
                        stage=event["stage"]
            visual_cues=[{"key":f"{chunk['id']}-initial","at":0,"stage":stage,"flags":flags}]
            for event in events:
                if left["at"]<event["sourceTime"]<right["at"]:
                    cue={key:event[key] for key in ["key","stage","action","duration","flags"] if key in event}
                    cue["at"]=round(event["sourceTime"]-left["at"],6)
                    visual_cues.append(cue)
            chunk["visuals"]=visual_cues
            chunk["cues"]=captions_for(chunk,alignment,regions,plan.get("captionMaximumWords",35))
            chunk["text"]=text[left["char"]:right["char"]].strip()
            chunk["stage"]=stage
            chunks.append(chunk)
            beats.append({"id":chunk["id"],"kind":"narration","text":chunk["text"],"speaker":"narrator","stage":stage,"duration":duration,"audio":{"file":chunk["file"],"duration":duration,"source":"elevenlabs-upload","sourceStart":chunk["sourceStart"],"sourceEnd":chunk["sourceEnd"],"cues":chunk["cues"],"visuals":visual_cues}})
            if "gate" in right:
                gate=right["gate"]
                challenge={"id":gate["id"],"kind":"challenge","stage":gate["stage"]}
                if gate["optional"]:
                    challenge["optional"]=True
                if gate["id"]=="s2-route":
                    challenge["guided"]=True
                beats.append(challenge)
        scenes.append({key:meta[key] for key in ["id","title","background","mapStop"]}|{"beats":beats})
    if len(chunks)!=22 or chunks[0]["sourceStart"]!=0 or chunks[-1]["sourceEnd"]!=alignment["source"]["duration"]:
        raise ValueError("Expected exactly22 contiguous chunks covering the complete decoded recording.")
    if any(abs(left["sourceEnd"]-right["sourceStart"])>1e-7 for left,right in zip(chunks,chunks[1:])):
        raise ValueError("The source cut audit found a gap or overlap.")
    if len({cue["key"] for chunk in chunks for cue in chunk["visuals"]})!=sum(len(chunk["visuals"]) for chunk in chunks):
        raise ValueError("Visual keys must be globally unique.")
    narration={"source":alignment["source"],"gates":gates,"scenes":scenes}
    return narration,chunks

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audio",type=Path,help="Original ElevenLabs_The_Moon_Path.mp3 (kept outside dist).")
    parser.add_argument("--ffmpeg",default=os.environ.get("FFMPEG_BIN"),help="FFmpeg executable; otherwise use PATH.")
    parser.add_argument("--alignment",type=Path,default=SCRIPTS/"narration-alignment.json")
    parser.add_argument("--plan",type=Path,default=SCRIPTS/"narration-edit-plan.json")
    parser.add_argument("--dist",type=Path,default=PROJECT)
    parser.add_argument("--audit",type=Path,help="Optional path for a detailed source-cut/encoding audit JSON.")
    parser.add_argument("--check",action="store_true",help="Validate portable inputs and cut/caption layout without encoding or writing.")
    args=parser.parse_args()
    alignment,plan=read_json(args.alignment),read_json(args.plan)
    narration,chunks=compile_layout(alignment,plan)
    if args.check:
        print(json.dumps({"chunks":len(chunks),"scenes":len(narration["scenes"]),"gates":len(narration["gates"]),"duration":alignment["source"]["duration"],"captionCues":sum(len(chunk["cues"]) for chunk in chunks),"maximumCaptionWords":max(len(TOKEN.findall(cue["text"])) for chunk in chunks for cue in chunk["cues"]),"allSourceRangesContiguous":True},indent=2))
        return
    if not args.audio or not args.audio.is_file():
        parser.error("Pass --audio PATH to the original supplied MP3.")
    if file_hash(args.audio)!=alignment["source"]["sha256"]:
        raise ValueError("The supplied audio hash differs from the aligned original. Re-align before rebuilding.")
    ffmpeg=args.ffmpeg or shutil.which("ffmpeg")
    if not ffmpeg:
        parser.error("FFmpeg was not found. Pass --ffmpeg PATH or set FFMPEG_BIN.")
    encoding=plan["encoding"]
    args.dist.mkdir(parents=True,exist_ok=True)
    folder=args.dist/"assets/audio/narration"
    folder.mkdir(parents=True,exist_ok=True)
    def encode(chunk):
        output=args.dist/chunk["file"]
        temp=output.with_suffix(".tmp.mp3")
        command=[ffmpeg,"-hide_banner","-loglevel","error","-nostdin","-y","-ss",f"{chunk['sourceStart']:.6f}","-i",str(args.audio),"-t",f"{chunk['sourceEnd']-chunk['sourceStart']:.6f}","-vn","-map_metadata","-1","-c:a",encoding["codec"],"-b:a",encoding["bitrate"],"-ar",str(encoding["sampleRate"]),"-ac",str(encoding["channels"]),"-write_xing","1",str(temp)]
        subprocess.run(command,check=True,capture_output=True)
        temp.replace(output)
        duration=audio_seconds(ffmpeg,output,encoding["sampleRate"])
        return {"id":chunk["id"],"file":chunk["file"],"sourceStart":chunk["sourceStart"],"sourceEnd":chunk["sourceEnd"],"sourceDuration":round(chunk["sourceEnd"]-chunk["sourceStart"],6),"encodedDecodedDuration":duration,"bytes":output.stat().st_size}
    encoded=[]
    with ThreadPoolExecutor(max_workers=2) as pool:
        for result in pool.map(encode,chunks):
            encoded.append(result)
            print(f"Encoded {result['id']} ({result['encodedDecodedDuration']:.3f}s)",flush=True)
    actual={item["id"]:item for item in encoded}
    for scene in narration["scenes"]:
        for beat in scene["beats"]:
            if beat["kind"]=="narration":
                duration=actual[beat["id"]]["encodedDecodedDuration"]
                beat["duration"]=duration
                beat["audio"]["duration"]=duration
    module="// Generated from the supplied ElevenLabs narration and the portable local alignment.\nexport const NARRATION = "+json.dumps(narration,ensure_ascii=False,indent=2)+";\n"
    (args.dist/"narration-data.mjs").write_text(module,encoding="utf-8")
    audit={"source":alignment["source"],"chunks":encoded,"chunkCount":len(encoded),"allSourceRangesContiguous":True,"sourceOmissions":[],"sourceOverlaps":[],"sourceCoveredSeconds":sum(item["sourceDuration"] for item in encoded),"encodedDecodedSeconds":sum(item["encodedDecodedDuration"] for item in encoded),"encoding":encoding,"largestFile":max(encoded,key=lambda item:item["bytes"]),"totalBytes":sum(item["bytes"] for item in encoded),"captionCues":sum(len(chunk["cues"]) for chunk in chunks),"visualCues":sum(len(chunk["visuals"]) for chunk in chunks)}
    if args.audit:
        args.audit.parent.mkdir(parents=True,exist_ok=True)
        args.audit.write_text(json.dumps(audit,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({key:audit[key] for key in ["chunkCount","allSourceRangesContiguous","sourceCoveredSeconds","encodedDecodedSeconds","totalBytes","largestFile","captionCues","visualCues"]},indent=2))

if __name__=="__main__":
    try:
        main()
    except (ValueError,RuntimeError,subprocess.CalledProcessError) as error:
        print(f"Narration rebuild failed: {error}",file=sys.stderr)
        raise SystemExit(1)
