#!/usr/bin/env python3
"""World-Vision S04 New START — authentic archive, editorial motion design.
7.9s / 237 frames / H264 / vertical 1080x1920. SILENT until approved voice.
The Prague 2010 photo is an archived US government work, NOT a 2026 meeting.
"""
import argparse,hashlib,json,math,subprocess
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageEnhance
import numpy as np

W,H,FPS,FRAMES=1080,1920,30,237
NAVY=(3,17,38); CYAN=(76,221,248); ICE=(177,235,246)
WHITE=(246,251,255); MUTED=(151,188,210)
def e(x):
 x=max(0.,min(1.,x));return 1-(1-x)**3
def s(x):
 x=max(0.,min(1.,x));return x*x*(3-2*x)
def gate(t,a,b,f=.25):return s((t-a)/f)*(1-s((t-b)/f))
# The actual glyphs come from Manrope Variable (OFL 1.1); supplied to --font
# by the reproducible rendering workflow, and pinned by SHA256. Never fall back
# silently to a generic workstation font.
FONT_PATH=None
CACHE={}
def font(z,bold=True):
 if FONT_PATH is None:
  raise RuntimeError('Pinned Manrope variable font was not configured')
 weight=800 if bold else 500
 k=(z,weight)
 if k not in CACHE:
  face=ImageFont.truetype(str(FONT_PATH),z)
  face.set_variation_by_axes([weight])
  CACHE[k]=face
 return CACHE[k]
def tx(im,txt,x,y,z,color=WHITE,opacity=1,offset=0,bold=True):
 if opacity<=0:return
 layer=Image.new('RGBA',(W,H)); d=ImageDraw.Draw(layer)
 d.text((x,y+offset),txt,font=font(z,bold),fill=(*color,int(255*min(1,opacity))))
 im.alpha_composite(layer)
def lab(im,txt,x,y,z=24,color=ICE,spacing=1):
 d=ImageDraw.Draw(im,'RGBA')
 for c in txt:
  d.text((x,y),c,font=font(z,False),fill=(*color,255))
  x+=d.textlength(c,font=font(z,False))+spacing
def background():
 y,x=np.mgrid[0:H,0:W].astype('float32')
 a=np.exp(-(((x-810)/740)**2+((y-515)/710)**2))*.45
 b=np.exp(-(((x-100)/670)**2+((y-1590)/790)**2))*.23
 ar=np.empty((H,W,3),dtype=np.uint8)
 for k in range(3):ar[:,:,k]=np.clip(NAVY[k]+[11,44,78][k]*a+[5,27,47][k]*b,0,255).astype('uint8')
 im=Image.fromarray(ar,'RGB');d=ImageDraw.Draw(im,'RGBA')
 for px in range(90,1030,90):d.line((px,346,px,1665),fill=(139,218,245,17))
 for py in range(348,1700,90):d.line((75,py,1015,py),fill=(139,218,245,14))
 d.line((78,315,1002,315),fill=(146,221,245,62),width=2)
 d.line((78,1741,1002,1741),fill=(146,221,245,62),width=2)
 return im.convert('RGBA')
BASE=background()
def source_photo(path):
 im=Image.open(path).convert('RGB')
 im=ImageEnhance.Color(im).enhance(.88)
 w,h=im.size; aspect=920/598
 if w/h>aspect:
  c=int(h*aspect);im=im.crop(((w-c)//2,0,(w+c)//2,h))
 else:
  c=int(w/aspect);im=im.crop((0,(h-c)//2,w,(h+c)//2))
 return im.resize((920,598),Image.Resampling.LANCZOS).convert('RGBA')
def official_logo(path):
 im=Image.open(path).convert('RGBA');im.thumbnail((112,76),Image.Resampling.LANCZOS);return im
def frame(t,logo,photo):
 im=BASE.copy();d=ImageDraw.Draw(im,'RGBA')
 d.ellipse((719,1370,1370,2021),outline=(76,221,248,28),width=2)
 d.ellipse((781,1430,1307,1956),outline=(76,221,248,22),width=2)
 # No player-like progress bar or production-only overlays are burnt in.
 # A: arms reduction, 0-3.2s
 p=gate(t,-.13,3.23,.32)
 if p>.001:
  k=e((t-.14)/.65);dy=int((1-k)*42)
  tx(im,"L'ENJEU DES DISCUSSIONS",82,386+dy,27,ICE,p*k)
  d=ImageDraw.Draw(im,'RGBA')
  d.rounded_rectangle((82,478,82+int(216*e((t-.29)/.59)),487),radius=4,fill=(*CYAN,int(235*p)))
  for title,y,z,c,delay in [
   ('RÉDUIRE',537,107,WHITE,.20),('LES ARSENAUX',673,70,WHITE,.38),
   ('NUCLÉAIRES',788,100,CYAN,.57)]:
   q=e((t-delay)/.55)*p
   tx(im,title,78,y,z,c,q,int((1-q)*40))
  d=ImageDraw.Draw(im,'RGBA');cx,cy=550,1262
  for r in (247,192,123):
   a=(cx-r,cy-r,cx+r,cy+r)
   d.arc(a,188+t*22,481+t*22,fill=(76,221,248,int(98*p)),width=3)
   d.arc(a,32-t*18,115-t*18,fill=(180,235,249,int(57*p)),width=2)
  for deg,r in [(45,247),(181,192),(291,123)]:
   v=math.radians(deg+t*17);px=cx+r*math.cos(v);py=cy+r*math.sin(v)
   d.ellipse((px-7,py-7,px+7,py+7),fill=(*CYAN,int(195*p)))
  tx(im,'CONTRÔLE DES ARMEMENTS',276,1570,29,ICE,p*e((t-.76)/.55))
 # B: historic authentic treaty signature, 2.87-6.17
 p=gate(t,2.86,6.19,.33)
 if p>.001:
  k=e((t-3.04)/.5);dy=int((1-k)*48)
  tx(im,'NEW START',80,364+dy,112,WHITE,p*k)
  tx(im,'TRAITÉ AMÉRICANO-RUSSE · 2010',83,518+dy,27,ICE,p*k,bold=False)
  d=ImageDraw.Draw(im,'RGBA')
  d.rounded_rectangle((72,605+dy,1008,1223+dy),radius=16,
   fill=(8,42,71,int(224*p)),outline=(112,218,245,int(150*p)),width=3)
  # Genuine news archive photo with mild dolly, no synthetic faces
  sz=1+.03*e((t-3.05)/2.6)
  if sz>1.0001:
   w,h=round(920*sz),round(598*sz);q=photo.resize((w,h),Image.Resampling.BICUBIC)
   moving=q.crop(((w-920)//2,(h-598)//2,(w-920)//2+920,(h-598)//2+598))
  else:moving=photo
  if p<.999:
   moving=moving.copy();moving.putalpha(int(p*255))
  im.alpha_composite(moving,(80,613+dy))
  d=ImageDraw.Draw(im,'RGBA')
  d.rounded_rectangle((96,1126+dy,663,1198+dy),radius=6,fill=(2,13,28,int(229*p)))
  tx(im,'ARCHIVES · PRAGUE · 8 AVRIL 2010',118,1144+dy,23,WHITE,p,bold=False)
  q=e((t-3.68)/.6)*p
  tx(im,'WASHINGTON  /  MOSCOU',80,1323,39,CYAN,q,int((1-q)*35))
  tx(im,'UN ACCORD SUR LES ARMES STRATÉGIQUES',82,1409,22,ICE,p,bold=False)
  # Archive photo credit stays in the machine-readable manifest and publication caption.
 # C: expiration, 5.9-7.9
 p=gate(t,5.88,8.09,.33)
 if p>.001:
  k=e((t-6.05)/.54);dy=int((1-k)*55)
  tx(im,'FIN DU DERNIER TRAITÉ BILATÉRAL',80,415+dy,24,ICE,p*k,bold=False)
  tx(im,'05.02.2026',77,544+dy,105,WHITE,p*k)
  d=ImageDraw.Draw(im,'RGBA')
  d.line((80,716,80+int(919*e((t-6.29)/.64)),716),fill=(*CYAN,int(226*p)),width=4)
  q=e((t-6.37)/.48)
  tx(im,'NEW START',76,782,100,CYAN,p*q,int((1-q)*27))
  q=e((t-6.57)/.5)
  tx(im,'A EXPIRÉ',77,925,112,WHITE,p*q,int((1-q)*29))
  q=e((t-6.96)/.6)
  d=ImageDraw.Draw(im,'RGBA')
  d.line((80,1220,80+int(365*q),1220),fill=(134,230,253,int(152*p)),width=4)
  d.line((1000-int(365*q),1220,1000,1220),fill=(134,230,253,int(152*p)),width=4)
  tx(im,'ET APRÈS ?',385,1376,40,ICE,p*q)
 # Program identity, always on top; official brand bytes never redrawn
 d=ImageDraw.Draw(im,'RGBA')
 d.rounded_rectangle((77,72,209,170),radius=10,fill=(247,247,245,255))
 im.alpha_composite(logo,(86+(112-logo.width)//2,82+(76-logo.height)//2))
 tx(im,'WORLD–VISION',233,90,35,WHITE)
 tx(im,'VOIR LE MONDE, LE COMPRENDRE.',233,144,15,ICE,bold=False)
 # Only the programme identity and editorial storytelling may appear on-screen.
 # The segment ID, pipeline status, credits, and audio notes live in JSON, not video frames.
 tx(im,'DIPLOMATIE INTERNATIONALE',81,255,23,ICE,bold=False)
 return im.convert('RGB')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def main():
 ap=argparse.ArgumentParser()
 ap.add_argument('--logo',type=Path,required=True)
 ap.add_argument('--photo',type=Path,required=True)
 ap.add_argument('--font',type=Path,required=True,help='Pinned Manrope variable TTF')
 ap.add_argument('--output',type=Path,required=True)
 a=ap.parse_args()
 assert a.logo.is_file() and a.photo.is_file() and a.font.is_file(),"Original assets and Manrope font required; no placeholder allowed"
 global FONT_PATH
 FONT_PATH=a.font
 assert sha(a.font)=='3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6','Font digest mismatch; refusing unapproved typography'
 a.output.parent.mkdir(parents=True,exist_ok=True)
 lg=official_logo(a.logo);ph=source_photo(a.photo)
 cmd=['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgb24','-video_size',
 f'{W}x{H}','-framerate',str(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','veryfast',
 '-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(a.output)]
 p=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
 try:
  for n in range(FRAMES):p.stdin.write(frame(n/FPS,lg,ph).tobytes())
  p.stdin.close()
  err=p.stderr.read().decode(errors='replace')
  if p.wait()!=0:raise RuntimeError(err)
 finally:
  if p.poll() is None:p.kill()
 data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(a.output)]))
 v=next(x for x in data['streams'] if x['codec_type']=='video')
 assert (v['width'],v['height'],v['codec_name'])==(1080,1920,'h264')
 assert int(v['nb_frames'])==FRAMES
 assert abs(float(data['format']['duration'])-7.9)<.05
 assert not any(z['codec_type']=='audio' for z in data['streams'])
 record={
 'id':'S04','event':'Summit announced for Shenzhen (2026-11-19)',
 'mode':'EDITORIAL_TECHNICAL_PREVIEW','published':False,'approved':False,
 'seconds':7.9,'frames':237,'fps':30,'pixels':[1080,1920],
 'sha256':sha(a.output),'bytes':a.output.stat().st_size,
 'photo_sha256':sha(a.photo),'logo_sha256':sha(a.logo),
 'font_family':'Manrope Variable (OFL-1.1)','font_sha256':sha(a.font),
 'clean_plate':True,'embedded_preview_labels':False,'technical_metadata_on_screen':False,
 'photo':'Chuck Kennedy/White House 2010 signing, public domain, historic archive NOT 2026',
 'photo_source':'https://commons.wikimedia.org/wiki/File:Obama_and_Medvedev_sign_New_START.jpg',
 'fact':'New START expired 2026-02-05',
 'fact_source':'https://www.diplomatie.gouv.fr/en/presse-et-ressources/decouvrir-et-informer/actualites/expiration-du-traite-new-start',
 'audio':'NONE — final voice and subtitles NOT aligned',
 'archive_credit_for_caption':'Photo : Chuck Kennedy / The White House (2010). Original archive, not footage of the 2026 summit.',
 'release_notice':'Use this clean plate as the only source for assembly; never reuse V1/V2 in the final edit.'}
 a.output.with_suffix('.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(record,ensure_ascii=False))
if __name__=='__main__':main()
