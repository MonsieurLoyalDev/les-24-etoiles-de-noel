"""Pack reviewed 4x2 generated sheets; nearest resize only, no redraw/background repair.
Usage: python scripts/prepare-polish-assets.py human.png fox.png [seats.png]
Original sheets stay outside the public source archive. Requires Pillow.
"""
from pathlib import Path
from PIL import Image
import sys,json
root=Path(__file__).resolve().parents[1]
out=root/'public/assets/narrative-polish';out.mkdir(exist_ok=True)
meta={}
for name,path in zip(['human','fox','seats'],sys.argv[1:]):
 source=Image.open(path).convert('RGBA')
 # Generated transparent PNGs contain alpha 1–31 quantisation dust in empty margins.
 # Discard only this near-invisible fringe; preserve the coloured sprite pixels.
 source.putalpha(source.getchannel('A').point(lambda a: 0 if a<32 else a))
 frames=[]
 for row in range(2):
  for col in range(4):
   frame=source.crop((round(col*source.width/4),round(row*source.height/2),round((col+1)*source.width/4),round((row+1)*source.height/2)))
   # Reject haze at cell corners rather than erasing it and inventing a contour.
   assert all(frame.getpixel(p)[3]==0 for p in [(0,0),(frame.width-1,0),(0,frame.height-1),(frame.width-1,frame.height-1)])
   frames.append(frame)
 canvas=Image.new('RGBA',(1024,512))
 groups=[]
 for row in range(2):
  boxes=[f.getbbox() for f in frames[row*4:row*4+4]]
  left=min(b[0] for b in boxes);top=min(b[1] for b in boxes)
  right=max(b[2] for b in boxes);bottom=max(b[3] for b in boxes)
  scale=min(224/(right-left),224/(bottom-top))
  for col in range(4):
   f=frames[row*4+col].crop((left,top,right,bottom))
   f=f.resize((round(f.width*scale),round(f.height*scale)),Image.Resampling.NEAREST)
   canvas.alpha_composite(f,(col*256+(256-f.width)//2,row*256+244-f.height))
  groups.append({'height':round((bottom-top)*scale),'width':round((right-left)*scale),'foot':244/256})
 canvas.save(out/(name+'.png'),optimize=True)
 meta[name]={'file':'/assets/narrative-polish/'+name+'.png','frameWidth':256,'frameHeight':256,'frames':8,'groups':groups}
(root/'src/narrative/polish-assets.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8')
print(json.dumps(meta))
