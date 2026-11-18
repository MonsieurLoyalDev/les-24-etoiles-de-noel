"""Technical packing of generated RGBA only. Narrative photograph stays outside Git.
Usage: python prepare-lot-b-assets.py CHARACTER_ATLAS PROP_ATLAS LAKE_IMAGE PRIVATE_MEDIA_DIR
"""
from pathlib import Path
from PIL import Image
import sys
root=Path(__file__).resolve().parents[1]
target=root/'public/assets/production';private=Path(sys.argv[4]).resolve()
if private.is_relative_to(root.resolve()):raise ValueError('Private narrative media must stay outside the public checkout')
private.mkdir(parents=True,exist_ok=True)
def cells(path,cols,rows):
 im=Image.open(path).convert('RGBA');out=[]
 for y in range(rows):
  for x in range(cols):
   cell=im.crop((round(x*im.width/cols),round(y*im.height/rows),round((x+1)*im.width/cols),round((y+1)*im.height/rows)))
   box=cell.getchannel('A').point(lambda a:255 if a>=32 else 0).getbbox()
   if not box:raise ValueError('Empty source cell')
   out.append(cell.crop(box))
 return out
frames=cells(sys.argv[1],4,5);atlas=Image.new('RGBA',(1024,1280));height=max(f.height for f in frames)
for i,f in enumerate(frames):
 f=f.resize((round(f.width*224/height),round(f.height*224/height)),Image.Resampling.NEAREST)
 atlas.paste(f,((i%4)*256+(256-f.width)//2,(i//4)*256+244-f.height))
atlas.save(target/'clockmaker.png',optimize=True)
for name,im in zip(['clock','music-box','gears','memory-photo','boat','blossom','lantern-off','lantern-on'],cells(sys.argv[2],4,2)):
 im.thumbnail((384,384),Image.Resampling.NEAREST);canvas=Image.new('RGBA',(im.width+4,im.height+4));canvas.paste(im,(2,2))
 canvas.save((private if name=='memory-photo' else target)/(name+'.png'),optimize=True)
im=Image.open(sys.argv[3]).convert('RGBA');im.thumbnail((768,512),Image.Resampling.NEAREST)
canvas=Image.new('RGBA',(im.width+4,im.height+4));canvas.paste(im,(2,2));canvas.save(target/'lake.png',optimize=True)
print('Packed 20 character frames, eight generic public resources and one private photograph.')
