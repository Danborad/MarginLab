"""把一串帧拼成网格大图，便于一次看清整段动画。"""
import sys, glob, os
from PIL import Image, ImageDraw

out = sys.argv[1]
pattern = sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
cell_w = int(sys.argv[4]) if len(sys.argv) > 4 else 320

files = sorted(glob.glob(pattern))
if not files:
    raise SystemExit("no files: " + pattern)

first = Image.open(files[0])
ratio = first.height / first.width
cell_h = int(cell_w * ratio)
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), (16, 16, 20))
draw = ImageDraw.Draw(sheet)

for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((cell_w, cell_h), Image.LANCZOS)
    x = (i % cols) * cell_w
    y = (i // cols) * cell_h
    sheet.paste(im, (x, y))
    draw.text((x + 6, y + 4), os.path.basename(f).replace(".png", ""), fill=(255, 240, 120))

sheet.save(out)
print(out, sheet.size, len(files))
