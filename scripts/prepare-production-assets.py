"""Technical atlas packing only. Preserve generated RGBA; no background recoloring.
Usage: python scripts/prepare-production-assets.py BAKER_SHEET PROP_SHEET
Raw image-generation outputs stay outside the public repository.
"""
import json
import sys
from pathlib import Path
from PIL import Image

target = Path(__file__).resolve().parents[1] / 'public/assets/production'
target.mkdir(parents=True, exist_ok=True)

def cells(path, cols, rows):
    image = Image.open(path).convert('RGBA')
    result = []
    for y in range(rows):
        for x in range(cols):
            cell = image.crop((round(x*image.width/cols), round(y*image.height/rows), round((x+1)*image.width/cols), round((y+1)*image.height/rows)))
            # Bound calculation only. Original alpha inside the crop is preserved.
            bounds = cell.getchannel('A').point(lambda a: 255 if a >= 32 else 0).getbbox()
            if not bounds:
                raise ValueError('Empty generated frame')
            result.append(cell.crop(bounds))
    return result

frames = cells(sys.argv[1], 4, 5)
atlas = Image.new('RGBA', (1024,1280))
height = max(frame.height for frame in frames)
for index, frame in enumerate(frames):
    size = (max(1, round(frame.width*224/height)), max(1, round(frame.height*224/height)))
    frame = frame.resize(size, Image.Resampling.NEAREST)
    atlas.paste(frame, ((index%4)*256+(256-frame.width)//2, (index//4)*256+244-frame.height))
atlas.save(target/'baker.png', optimize=True)
names = ['tree','oven','blue-letter','letter','book','stone']
for name, image in zip(names, cells(sys.argv[2],3,2)):
    limit = 384 if name == 'tree' else 256
    image.thumbnail((limit,limit),Image.Resampling.NEAREST)
    canvas=Image.new('RGBA',(image.width+4,image.height+4))
    canvas.paste(image,(2,2))
    canvas.save(target/f'{name}.png',optimize=True)
print(json.dumps({'frames':20,'props':len(names),'bytes':sum(p.stat().st_size for p in target.glob('*.png'))}))
