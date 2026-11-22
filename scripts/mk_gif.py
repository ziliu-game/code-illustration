import cairosvg, glob, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
FONT='/usr/share/fonts/truetype/arphic/ukai.ttc'

OUT = sys.argv[1] if len(sys.argv) > 1 else 'sheet.gif'
WORDS = sys.argv[2:] or ['山水', '风雨', '车船', '花木', '小猫', '学校']
HERE = os.path.dirname(os.path.abspath(__file__))
TILE = 250
COLS, ROWS = 3, 2
FPS, FRAMES = 13, 40

def frames_of(word):
    d = '/tmp/anim_' + word
    os.system(f'rm -rf {d} && mkdir -p {d}')
    subprocess.run(['node', os.path.join(HERE, 'anim.js'), word], check=True)
    for f in sorted(glob.glob(d + '/*.svg')):
        cairosvg.svg2png(url=f, write_to=f.replace('.svg', '.png'), output_width=TILE, output_height=TILE)
    return sorted(glob.glob(d + '/*.png'))

paths = {w: frames_of(w) for w in WORDS}
W = TILE * COLS + 20 * (COLS + 1)
ROW_H = TILE + 54
H = 46 + 20 + ROW_H * ROWS + 10
out = []
for i in range(FRAMES):
    sheet = Image.new('RGB', (W, H), '#fdfaf3')
    for k, w in enumerate(WORDS):
        r, c = divmod(k, COLS)
        x = 20 + c * (TILE + 20)
        y = 46 + 20 + r * ROW_H
        sheet.paste(Image.open(paths[w][i]).convert('RGB'), (x, y))
        ImageDraw.Draw(sheet).text((x + TILE // 2, y + TILE + 6), w, font=ImageFont.truetype(FONT, 26, index=0), fill='#8a8073', anchor='ma')
    d = ImageDraw.Draw(sheet)
    d.text((W // 2, 26), '墨线涂鸦 · 逐笔书写', font=ImageFont.truetype(FONT, 34, index=0), fill='#2b2622', anchor='ma')
    out.append(sheet)
# 首帧换成"已画完"状态，避免静态缩略图是空白
out = out[-4:] + out
out[0].save(OUT, save_all=True, append_images=out[1:], duration=1000 // FPS, loop=0, optimize=True)
print('gif', os.path.getsize(OUT) // 1024, 'KB', W, H)
