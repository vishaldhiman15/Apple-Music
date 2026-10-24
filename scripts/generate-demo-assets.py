"""Rebuild the original vector artwork and procedural instrumental demo recordings.
Requires Python, NumPy and FFmpeg. No third-party recordings are included.
"""
from pathlib import Path
import hashlib,json,math,subprocess,numpy as np
from concurrent.futures import ProcessPoolExecutor
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'public/artwork';AUDIO=ROOT/'public/audio';ART.mkdir(parents=True,exist_ok=True);AUDIO.mkdir(exist_ok=True)
SPECS=[
 ('After Hours','Night Tapes','Electronic','#f84962','#341327','after',108,['City Lights','Last Train']),
 ('Soft Focus','Elliot Vale','Ambient','#b1b8a3','#29413d','soft',72,['Window Seat','Still Life']),
 ('Blue Hour','Northstar','Electronic','#92c7d5','#133b74','blue',100,['Ocean Drive','Fading Satellites']),
 ('Bloom','Mira Sol','Soul','#e9a1ab','#853b5a','bloom',86,['Golden Touch','Sunday Morning']),
 ('Light Leaks','Mira Sol','Jazz','#e4ac62','#71452f','sun',92,['Warmth','The Long Way Home']),
 ('Elsewhere','Akari','Ambient','#ccc4de','#514473','orbit',76,['Far From Here','Floating Gardens']),
 ('Headspace','Low Motion','Lo-fi','#94a37e','#344036','leaf',82,['Rain on Glass','Paper Planes']),
 ('Future Nostalgia','Northstar','Electronic','#ecbb6d','#a5525d','ripple',118,['Neon Memory','Signals']),
 ('Nocturne','Akari','Classical','#b4b7c8','#313849','night',68,['Felt Piano','A Small Infinity']),
 ('Motion Studies','Low Motion','Dance','#c2dc9b','#437258','motion',124,['First Light','Let It Move']),
 ('Velvet Sky','Night Tapes','R&B','#a18fc6','#432e68','velvet',90,['Slow Orbit','Constellations']),
 ('Daydreams','Elliot Vale','Acoustic','#d3c7ac','#847365','dunes',80,['Open Windows','Almost Summer'])]
def ID(s):return hashlib.sha256(s.encode()).hexdigest()[:24]
def svg(spec,index):
 title,artist,genre,c1,c2,kind,bpm,tracks=spec
 parts=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="{c2}"/><stop offset="1" stop-color="{c1}"/></linearGradient><radialGradient id="orb"><stop stop-color="#fff" stop-opacity=".9"/><stop offset=".35" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></radialGradient><filter id="grain"><feTurbulence baseFrequency=".55" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".09"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter></defs><rect width="1000" height="1000" fill="url(#g)"/>']
 if kind in ['after','night','velvet','blue']:
  parts+=[f'<circle cx="550" cy="500" r="320" fill="url(#orb)"/>']
  for i in range(24):
   cy=270+i*22;parts+=[f'<path d="M-80,{cy} Q450,{cy-260+index*4} 1080,{cy+90}" fill="none" stroke="{c2}" stroke-width="{4+i*.75}" opacity=".9"/>']
 elif kind in ['orbit','ripple','motion']:
  for i in range(18):
   rx=80+i*24;parts+=[f'<ellipse cx="520" cy="485" rx="{rx}" ry="{40+i*14}" transform="rotate({-32+index*4} 520 485)" fill="none" stroke="#fff" stroke-width="{1+i*.17}" opacity="{.1+i*.015}"/>']
  parts+=[f'<circle cx="540" cy="480" r="130" fill="url(#orb)"/>']
 elif kind=='bloom':
  for i in range(10):parts+=[f'<ellipse cx="500" cy="350" rx="105" ry="230" fill="{c1}" opacity=".65" transform="rotate({i*36} 500 500)"/>']
  parts+=['<circle cx="500" cy="500" r="105" fill="#f0d6af"/>']
 else:
  for i in range(12):
   cy=120+i*85;parts+=[f'<path d="M-50,{cy+190} C200,{cy-300} 650,{cy+340} 1070,{cy-60} L1070,1100 L-50,1100Z" fill="{c1 if i%2 else c2}" opacity=".36"/>']
  parts+=[f'<circle cx="680" cy="300" r="115" fill="#fff" opacity=".35"/>']
 parts+=['<rect width="1000" height="1000" fill="transparent" filter="url(#grain)"/>']
 if index in [0,2,3,7]:
  words=title.upper().split(' ');y=125
  for word in words:parts+=[f'<text x="65" y="{y}" fill="#fff" font-family="Helvetica,Arial,sans-serif" font-size="{100 if len(word)<9 else 82}" font-weight="700" letter-spacing="-5">{word}</text>'];y+=104
 else:parts+=[f'<text x="62" y="850" fill="#fff" font-family="Georgia,serif" font-size="{93 if len(title)<14 else 73}" font-style="italic">{title}</text>']
 parts+=[f'<text x="65" y="940" fill="#fff" fill-opacity=".8" font-family="Helvetica,Arial,sans-serif" font-size="22" letter-spacing="5">{artist.upper()} / ORIGINAL RECORDINGS</text></svg>']
 return ''.join(parts)
def midi(n):return 440*2**((n-69)/12)
def render_audio(args):
 i,j,spec=args;title,artist,genre,c1,c2,kind,bpm,names=spec;dest=AUDIO/f'{i+1:02d}-{j+1}.mp3'
 if dest.exists():return
 sr=32000;duration=48;length=duration*sr;out=np.zeros(length,dtype=np.float64);rng=np.random.default_rng(i*17+j+63);beat=60/bpm;root=[48,50,45,53,48,51,46,48,45,50,48,53][i]+j*2
 chords=[[0,3,7,10],[5,8,12,15],[8,12,15,19],[3,7,10,14]]
 def note(start,dur,n,gain=.08,soft=False):
  a=int(start*sr);num=min(int(dur*sr),length-a)
  if num<=0:return
  t=np.arange(num)/sr;f=midi(n);env=(1-np.exp(-t/(.045 if soft else .012)))*np.exp(-t/(dur*.55));env*=np.clip((dur-t)/.15,0,1)
  wave=np.sin(2*np.pi*f*t)+.22*np.sin(2*np.pi*f*2*t)+.08*np.sin(2*np.pi*f*3*t)
  out[a:a+num]+=wave*env*gain
 # Harmonically related pads, soft arpeggios and bass; each file has a unique seed and arrangement.
 for bar,start in enumerate(np.arange(0,duration,beat*4)):
  chord=chords[bar%4]
  for k in chord:note(start,beat*5,root+k,.025,True)
  for step in range(8):note(start+step*beat/2,beat*1.4,root+12+chord[(step+j)%4],.045 if genre not in ['Ambient','Classical'] else .032,True)
  if genre not in ['Ambient','Classical','Acoustic']:
   note(start,beat*2,root-12,.14)
   for b in range(4):
    a=int((start+b*beat)*sr);n=min(int(.3*sr),length-a)
    if n>0:
     t=np.arange(n)/sr;phase=2*np.pi*(45*t+55*.025*(1-np.exp(-t/.025)));out[a:a+n]+=.22*np.sin(phase)*np.exp(-t/0.075)
   for b in range(8):
    a=int((start+b*beat/2)*sr);n=min(int(.1*sr),length-a)
    if n>0:
     t=np.arange(n)/sr;noise=rng.normal(0,1,n);hp=noise-np.roll(noise,1);out[a:a+n]+=.012*hp*np.exp(-t/.02)
   for b in [1,3]:
    a=int((start+b*beat)*sr);n=min(int(.18*sr),length-a)
    if n>0:
     t=np.arange(n)/sr;out[a:a+n]+=.04*rng.normal(0,1,n)*np.exp(-t/.05)
 # Short stereo reflections, gentle saturation, fades.
 left=out.copy();right=out.copy()
 for delay,gain in [(.16,.16),(.33,.10),(.49,.07)]:
  k=int(sr*delay);left[k:]+=out[:-k]*gain;right[k+147:]+=out[:-(k+147)]*gain
 stereo=np.stack([left,right],axis=1);stereo=np.tanh(stereo*.9);stereo/=max(1,np.max(np.abs(stereo))/.84)
 fade=np.minimum(np.arange(length)/sr/1.2,(length-np.arange(length))/sr/2.5);stereo*=np.clip(fade,0,1)[:,None]
 proc=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','f32le','-ar',str(sr),'-ac','2','-i','-','-c:a','libmp3lame','-b:a','128k',str(dest)],input=stereo.astype('<f4').tobytes(),check=True)
 print(dest.name,flush=True)
if __name__=='__main__':
 albums=[];artists={};songs=[]
 for i,spec in enumerate(SPECS):
  title,artist,genre,c1,c2,kind,bpm,tracks=spec;aid=ID('album:'+title);arid=ID('artist:'+artist);art=f'/artwork/{i+1:02d}.svg';(ART/f'{i+1:02d}.svg').write_text(svg(spec,i))
  artists[arid]={'id':arid,'name':artist,'image':art,'bio':'Independent instrumental project. Original demo recordings made for this app.'}
  albums.append({'id':aid,'title':title,'artist':artist,'artistId':arid,'coverUrl':art,'year':'2026','genre':genre,'color':c2,'description':{'after':'The city gets quiet. The music gets louder. Atmospheric synths for your after-dark hours.','soft':'A softer soundtrack to a slower kind of day.','blue':'Somewhere between the last light and the first star.'}.get(kind,'A collection of original instrumental sketches. Find a little room to listen.'),'demo':True})
  for j,name in enumerate(tracks):songs.append({'id':ID('song:'+name),'title':name,'artist':artist,'artistId':arid,'albumId':aid,'albumTitle':title,'duration':48,'audioUrl':f'/audio/{i+1:02d}-{j+1}.mp3','coverUrl':art,'genre':genre,'releaseYear':'2026','explicit':False,'instrumental':True,'bpm':bpm,'demo':True,'color':c2,'trackNumber':j+1})
 (ROOT/'src/data/catalog.json').write_text(json.dumps({'albums':albums,'artists':list(artists.values()),'songs':songs},indent=2))
 with ProcessPoolExecutor(max_workers=3) as pool:list(pool.map(render_audio,[(i,j,s) for i,s in enumerate(SPECS) for j in range(2)]))
