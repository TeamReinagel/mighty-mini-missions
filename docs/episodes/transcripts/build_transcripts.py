"""Build the reading copies without changing approved production manuscripts."""
from pathlib import Path
import json, re, html, zipfile, math
from functools import lru_cache
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent
EPISODES = ROOT.parent
REPO = EPISODES.parent.parent
OUT = REPO / 'output/pdf/lark-nib-transcripts'
FONT = Path('/Users/stephaniereinagel/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')
for name, file in [('Story', 'LiberationSerif-Regular.ttf'), ('StoryBold', 'LiberationSerif-Bold.ttf'), ('StoryItalic', 'LiberationSerif-Italic.ttf'), ('Label', 'LiberationSans-Regular.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONT / file)))
pdfmetrics.registerFontFamily('Story', normal='Story', bold='StoryBold', italic='StoryItalic', boldItalic='StoryBold')

def metadata():
    result = {}
    for s in range(1,9):
        text = (EPISODES / f'season-{s}-episode-briefs.md').read_text()
        for chunk in re.split(r'(?=^## Episode )', text, flags=re.M)[1:]:
            m = re.match(r'## Episode (\d+) · (.+)', chunk)
            if not m: continue
            e, title = int(m[1]), m[2].strip()
            field = lambda label: (re.search(r'\*\*'+label+r':\*\* (.+)',chunk) or [None,''])[1]
            targets = re.findall(r'\*\*([^*]+)\*\*', field('Child-reading targets'))
            result[f'{s}.{e}'] = dict(season=s, episode=e, title=title, targets=targets, anchor=field('Dialogue anchor'))
    result['1.1'] = dict(season=1, episode=1, title='The Moon Path', targets=[])
    return result

META = metadata()
BOOKS = ['The Map Pieces','Through the Woods','The Long Path','The Storyboat','The Clockwork Garden','The Workshop of Almost','The Vanishing Brook','The Atlas We Make']

def slug(title):
    return re.sub(r'[^a-z0-9]+','-',title.lower().replace('’','').replace("'",'')).strip('-')

def make_draft(key, r):
    m = META[key]
    if isinstance(r, dict):
        names = {'sun':'Sun route: meadow', 'pine':'Pine route: lookout', 'reed':'Reed route: book stop'}
        return '\n\n'.join('## '+names[route]+'\n\n'+make_draft(key,row) for route,row in r.items())
    # Every record contains authored story prose and an explicitly audited child passage.
    opening, model, question, result, write, passage, comprehension, close = r
    targets = m['targets']
    words = ', '.join(targets)
    anchor = m.get('anchor','')
    previous = META.get(f"{m['season']}.{m['episode']-1}")
    if previous is None and m['season']>1:
        earlier = [v for v in META.values() if v['season']==m['season']-1]
        previous = max(earlier,key=lambda v:v['episode'])
    review = (previous or {}).get('targets',[])
    review = review[0] if review else 'map'
    fresh = key in {'5.15','7.10','8.7'}
    body = [opening]
    if anchor: body.append(anchor)
    body += [
        'Lark opened an earlier journal page on a flat, dry surface. Nib steadied its lower corner. One familiar word waited for another look.',
        '“Try our earlier word before we start,” Lark invited gently. “You can sound it out or ask for help.”',
        '> '+review,
        model,
    ]
    if not fresh:
        body += ['“Join the parts and check the whole meaning,” Lark invited gently. “You can hear a part again whenever you want.”',
                 f'On a little practice strip, you could try {words}. Lark supplied unfamiliar story names herself. Nib waited while you looked right through each word.']
    body += [question]
    supplied = [w for w in ['board','cover'] if re.search(r'\b'+w+r'\b',passage)] if m['season']==8 else []
    if supplied:
        body.append('Lark supplied '+', '.join(supplied)+' aloud before the passage. You could use those topic words with her help; their unprepared spellings were not words you had to decode alone.')
    body += [
        'A short passage stayed in view. Lark paired each needed capital with its lowercase form and familiar sound before you began, leaving the sentence meanings for you to discover.',
        '“Read the sentences in order,” Lark invited gently. “Let your finger follow if it helps. When you are ready, use the words to answer our question.”',
        '> '+passage.replace('\n\n','\n\n> '),
        comprehension,
        'Lark kept the passage open so you could point to the part that helped. Nib listened before adding the picture.',
        result,
        f'“Let\'s keep a written clue,” Lark suggested warmly. “Write {write} beside our picture. You can look at the example, follow it first, or try your own version. Then reread what you made.”',
        close,
    ]
    return '\n\n'.join(body)

def load_all():
    episodes = []
    existing = {'1.1':'moon-path-manuscript.txt','1.2':'s1e2-apple-catcher-manuscript.txt','1.3':'s1e3-sail-that-wouldnt-stay-manuscript.txt','2.1':'s2e1-bag-at-the-door-manuscript.txt','2.2':'s2e2-fan-at-the-fork-manuscript.txt'}
    records = {}
    for p in sorted(ROOT.glob('season-*-drafts.json')): records.update(json.loads(p.read_text()))
    for key, m in sorted(META.items(), key=lambda kv: (kv[1]['season'],kv[1]['episode'])):
        if key in existing:
            body = (EPISODES/existing[key]).read_text()
            body = re.sub(r'\[[^\]]+\]\s*','',body).strip()
            if key=='1.1': body = re.sub(r'^Mighty Mini Missions\. The Moon Path\.\s*','',body)
        elif key in records:
            body = make_draft(key,records[key])
        else:
            folder=ROOT/f"season-{m['season']}"
            candidates = list(folder.glob(f"s{m['season']:02d}e{m['episode']:02d}-*.txt")) + list(folder.glob(f"s{m['season']}e{m['episode']}-*.txt"))
            if not candidates: raise ValueError(f'Missing authored episode {key}')
            body = candidates[0].read_text().split('\n',2)[2].strip()
        title = m['title'].replace('’',"'")
        subtitle = f"Lark & Nib's Treasure Quest · Season {m['season']}, Episode {m['episode']}"
        file = f"s{m['season']:02d}e{m['episode']:02d}-{slug(title)}"
        source = ROOT/f"season-{m['season']}"/(file+'.txt')
        source.parent.mkdir(parents=True,exist_ok=True)
        source.write_text(title+'\n'+subtitle+'\n\n'+body+'\n')
        episodes.append(dict(**m, title_text=title, subtitle=subtitle, body=body, file=file))
    return episodes

TITLE = ParagraphStyle('title',fontName='StoryBold',fontSize=23,leading=27,textColor=HexColor('#203a3d'),spaceAfter=9)
SUB = ParagraphStyle('sub',fontName='Label',fontSize=10,leading=14,textColor=HexColor('#557075'),spaceAfter=22)
BODY = ParagraphStyle('body',fontName='Story',fontSize=11.5,leading=16.4,spaceAfter=9,allowWidows=0,allowOrphans=0)
READ = ParagraphStyle('reading',parent=BODY,fontName='StoryBold',fontSize=13,leading=19,leftIndent=16,rightIndent=16,borderColor=HexColor('#9bb1ac'),borderWidth=.6,borderPadding=10,spaceBefore=8,spaceAfter=16)
ROUTE = ParagraphStyle('route',parent=SUB,fontName='StoryBold',fontSize=16,leading=20,spaceBefore=6,spaceAfter=16)

def flow(ep):
    p = lambda t,style: Paragraph(html.escape(t),style)
    result=[KeepTogether([p(ep['title_text'],TITLE),p(ep['subtitle'],SUB)])]
    for para in re.split(r'\n\s*\n',ep['body']):
        para=para.strip().replace('—',' - ').replace('–','-').replace('‑','-')
        if not para:continue
        if para.startswith('## '):
            if len(result)>1:result.append(PageBreak())
            result.append(p(para[3:],ROUTE))
            continue
        result.append(p(para[2:] if para.startswith('> ') else para,READ if para.startswith('> ') else BODY))
    return balance_pages(result)

def balance_pages(parts):
    # Balance each episode or route separately, avoiding a nearly empty final page.
    sections=[[]]
    for part in parts:
        if isinstance(part,PageBreak):sections.append([])
        else:sections[-1].append(part)
    def measure(part):
        if isinstance(part,KeepTogether):return sum(measure(c) for c in part._content)
        return part.wrap(492,10000)[1]+part.getSpaceBefore()+part.getSpaceAfter()
    output=[]
    for section_no,section in enumerate(sections):
        if section_no:output.append(PageBreak())
        heights=[measure(p) for p in section]
        prefix=[0]
        for height in heights:prefix.append(prefix[-1]+height)
        page_count=max(1,math.ceil(prefix[-1]/665))
        while True:
            target=prefix[-1]/page_count
            @lru_cache(None)
            def best(end,count):
                if count==0:return (0,()) if end==0 else (math.inf,())
                answer=(math.inf,())
                for start in range(count-1,end):
                    amount=prefix[end]-prefix[start]
                    if amount>665:continue
                    cost,cuts=best(start,count-1)
                    candidate=(cost+(amount-target)**2,cuts+(end,))
                    if candidate[0]<answer[0]:answer=candidate
                return answer
            score,cuts=best(len(section),page_count)
            if math.isfinite(score):break
            page_count+=1
        start=0
        for page_no,stop in enumerate(cuts):
            if page_no:output.append(PageBreak())
            output.extend(section[start:stop]);start=stop
    return output

def footer(c,doc):
    c.saveState()
    c.setStrokeColor(HexColor('#d6dcd8'));c.setLineWidth(.5);c.line(54,43,558,43)
    c.setFont('Label',8);c.setFillColor(HexColor('#557075'))
    c.drawString(54,29,"Lark & Nib's Treasure Quest")
    c.drawRightString(558,29,str(doc.page));c.restoreState()

def pdf(path, eps):
    story=[]
    for i,ep in enumerate(eps):
        if i:story.append(PageBreak())
        story.extend(flow(ep))
    doc=SimpleDocTemplate(str(path),pagesize=(612,792),rightMargin=54,leftMargin=54,topMargin=48,bottomMargin=59,title="Lark & Nib's Treasure Quest - Episode Transcripts",author='Lark & Nib')
    doc.build(story,onFirstPage=footer,onLaterPages=footer)

def main():
    eps=load_all(); assert len(eps)==104,len(eps)
    OUT.mkdir(parents=True,exist_ok=True)
    index=[]
    for ep in eps:
        folder=OUT/f"season-{ep['season']}";folder.mkdir(exist_ok=True)
        path=folder/(ep['file']+'.pdf');pdf(path,[ep])
        reader=PdfReader(path);text='\n'.join(p.extract_text() for p in reader.pages)
        assert ep['title_text'] in text,ep['file']
        assert ep['subtitle'] in text,ep['file']
        assert len(reader.pages)>=1
        assert '\ufffd' not in text
        index.append(dict(season=ep['season'],episode=ep['episode'],title=ep['title_text'],file=str(path.relative_to(OUT)),pages=len(reader.pages),words=len(re.findall(r"\b[\w'-]+\b",ep['body'])),source='existing manuscript' if (ep['season'],ep['episode']) in [(1,1),(1,2),(1,3),(2,1),(2,2)] else 'new authored draft'))
    for s in range(1,9):pdf(OUT/f'season-{s}-{slug(BOOKS[s-1])}.pdf',[e for e in eps if e['season']==s])
    pdf(OUT/'lark-nib-complete-transcripts.pdf',eps)
    (OUT/'episode-index.json').write_text(json.dumps(index,indent=2)+'\n')
    with zipfile.ZipFile(OUT/'lark-nib-individual-transcripts.zip','w',zipfile.ZIP_DEFLATED) as z:
        for row in index:z.write(OUT/row['file'],row['file'])
        z.write(OUT/'episode-index.json','episode-index.json')
    print(json.dumps(dict(episodes=len(index),new_drafts=sum(r['source']=='new authored draft' for r in index),pages=sum(r['pages'] for r in index),words=sum(r['words'] for r in index),output=str(OUT)),indent=2))

if __name__=='__main__':main()
