"""Draw the Christmas Word Run snowman icons without external dependencies beyond Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent

def draw_icon(size, maskable=False):
    scale = 4
    s = size * scale
    image = Image.new('RGB', (s, s), '#123e42')
    d = ImageDraw.Draw(image)
    for y in range(s):
        t = y / (s - 1)
        d.line((0, y, s, y), fill=tuple(round(a + (b-a)*t) for a,b in zip((37,104,95),(15,54,62))))
    # Vector-style drawing coordinates match the snowman used in the game.
    k = s / 210 * (.78 if maskable else .94)
    ox, oy = (s-200*k)/2, (s-210*k)/2
    def points(coords): return [(ox+x*k,oy+y*k) for x,y in coords]
    def ellipse(box,fill): d.ellipse([ox+box[0]*k,oy+box[1]*k,ox+box[2]*k,oy+box[3]*k],fill=fill)
    def line(coords,fill,width): d.line(points(coords),fill=fill,width=max(1,round(width*k)),joint='curve')
    def polygon(coords,fill): d.polygon(points(coords),fill=fill)
    line([(59,141),(28,125)],'#a77c52',7)
    line([(143,141),(172,124)],'#a77c52',7)
    ellipse((42,117,156,197),'#e5f4ec')
    ellipse((49,39,147,137),'#fcfcf0')
    ellipse((60,94,82,108),'#f2b8b5')
    ellipse((114,94,137,108),'#f2b8b5')
    ellipse((75,79,85,93),'#244653')
    ellipse((109,79,119,93),'#244653')
    polygon([(96,93),(122,100),(96,105)],'#ee9d53')
    line([(83,108),(88,113),(98,116),(107,112),(113,106)],'#244653',3)
    polygon([(55,124),(98,134),(143,123),(145,138),(98,147),(54,139)],'#29896d')
    polygon([(116,138),(138,140),(133,178),(113,174)],'#29896d')
    line([(116,158),(134,160)],'#f8d987',4)
    line([(115,168),(134,170)],'#f8d987',4)
    ellipse((90,154,98,162),'#315263')
    ellipse((90,173,98,181),'#315263')
    polygon([(54,65),(62,38),(79,17),(111,15),(135,24),(155,49),(134,46),(111,31),(108,65)],'#d63b52')
    ellipse((143,37,167,61),'#fff8e9')
    d.rounded_rectangle([ox+49*k,oy+55*k,ox+142*k,oy+76*k],radius=10*k,fill='#fff8e9')
    return image.resize((size,size),Image.Resampling.LANCZOS)

def main():
    out = ROOT/'icons'
    out.mkdir(exist_ok=True)
    for size in [192,512]: draw_icon(size).save(out/f'icon-{size}.png')
    draw_icon(512,True).save(out/'icon-maskable-512.png')

if __name__=='__main__': main()
