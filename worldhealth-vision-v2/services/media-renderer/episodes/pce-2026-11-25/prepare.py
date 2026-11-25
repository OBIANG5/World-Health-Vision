import asyncio, json, math, hashlib, subprocess, re, unicodedata, wave, array, os
from pathlib import Path
import edge_tts
import requests
from PIL import Image
BASE=Path("output/pce-2026-11-25")
BASE.mkdir(parents=True,exist_ok=True)
ASSETS=BASE/"assets"; ASSETS.mkdir(exist_ok=True)
parts=[
"Trois virgule huit pour cent. Aux États-Unis, les prix repartent à la hausse. En septembre, cette inflation annuelle était de trois virgule sept pour cent.",
"Mais les ménages ne consomment pas davantage. Leurs dépenses augmentent de zéro virgule trois pour cent en dollars, tandis que le volume de consommation reste quasiment stable.",
"Le problème pour la Réserve fédérale, c'est que sa cible reste deux pour cent. Les marchés anticipent une hausse des taux en décembre, mais la décision n'est pas encore prise.",
"Des crédits plus chers pourraient alors peser davantage sur les ménages et les entreprises."
]
text=" ".join(parts)
profile="fr-FR-VivienneMultilingualNeural"
url="https://bea.gov/news/2026/personal-income-and-outlays-october-2026"
photos=[
("shop.jpg","https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/20250219-USDA-FNS-UNK-0006_(54498997849).jpg/1280px-20250219-USDA-FNS-UNK-0006_(54498997849).jpg","USDA · archives 2025"),
("market.jpg","https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/WIC%2C_Seattle%2C_Washington_%2820241113-USDA-FNS-UNK-0075%29.jpg/1920px-WIC%2C_Seattle%2C_Washington_%2820241113-USDA-FNS-UNK-0075%29.jpg","USDA · archives 2024"),
("fed.jpg","https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/FOMC_01302024_vetted_9681_(53499605577).jpg/1280px-FOMC_01302024_vetted_9681_(53499605577).jpg","Federal Reserve · archives 2024")
]
for name,source,credit in photos:
    r=requests.get(source,headers={"User-Agent":"World-Vision editorial review/1.0 (source attribution and non-public review)"},timeout=60)
    r.raise_for_status()
    tmp=ASSETS/(name+".tmp");tmp.write_bytes(r.content)
    with Image.open(tmp) as img:
        img=img.convert("RGB");img.thumbnail((2200,2200));img.save(ASSETS/name,quality=95)
    tmp.unlink()
async def voice():
    events=[]
    with (BASE/"voice-raw.mp3").open("wb") as f:
        async for chunk in edge_tts.Communicate(text,profile,rate="+8%",boundary="WordBoundary").stream():
            if chunk["type"]=="audio":f.write(chunk["data"])
            elif chunk["type"]=="WordBoundary":events.append(chunk)
    return events
events=asyncio.run(voice())
if not events:raise RuntimeError("No actual word boundaries from voice service")
(BASE/"word-boundaries.json").write_text(json.dumps(events,ensure_ascii=False,indent=2))
subprocess.run(["ffmpeg","-v","error","-y","-i",str(BASE/"voice-raw.mp3"),"-af","loudnorm=I=-16:TP=-2:LRA=7","-ar","48000",str(ASSETS/"vivienne.wav")],check=True)
duration=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(ASSETS/"vivienne.wav")],text=True).strip())
def normal(s):return "".join(c for c in unicodedata.normalize("NFC",s).casefold() if c.isalnum())
words=text.split()
actual="".join(normal(e["text"]) for e in events)
expected="".join(normal(w) for w in words)
if actual!=expected:raise RuntimeError("TTS boundaries do not match exact script: "+actual+" != "+expected)
# Map actual character boundaries to exact script words. Never estimate an offset.
spans=[]; pos=0
for e in events:
    n=len(normal(e["text"]))
    if n:spans.append((pos,pos+n,e["offset"]/1e7,(e["offset"]+e["duration"])/1e7))
    pos+=n
captions=[];pos=0;last=0
for w in words:
    n=len(normal(w))
    matches=[s for s in spans if s[0]<pos+n and s[1]>pos]
    if not matches:raise RuntimeError("No actual alignment for "+w)
    # Reject a service boundary spanning multiple whole words, not divide by guess.
    if matches[0][0]<pos or matches[-1][1]>pos+n:raise RuntimeError("Non-exact boundary at "+w)
    start=max(last,round(matches[0][2]*30));end=max(start+1,round(matches[-1][3]*30))
    captions.append(dict(text=w,startFrame=start,endFrame=end,emphasis=normal(w) in {"trois","huit","paradoxe","stable","deux","taux","chers","décembre"}))
    last=end;pos+=n
starts=[];i=0
for part in parts:
    starts.append(captions[i]["startFrame"]);i+=len(part.split())
starts[0]=0
end=max(math.ceil(duration*30)+55,last+55)
# Cuts on actual first spoken words; no artificial speech timing.
lengths=[starts[j+1]-starts[j] for j in range(3)]+[end-starts[3]]
if any(x<150 for x in lengths[:3]):raise RuntimeError("Photo scene too short for legible reveal: "+str(lengths))
source={"publisher":"BEA","dataset":"Personal Income and Outlays · oct. 2026","asOf":"2026-11-25","url":url}
def shot(i,title,subtitle,eyebrow,first,second,domain,precision,src=source):
    d=lengths[i]
    return {"id":"plan-"+str(i+1),"template":"photo_story","durationFrames":d,"title":title,"subtitle":subtitle,"eyebrow":eyebrow,"motion":"locked","transitionAfter":"cut","transitionFrames":0,"media":{"kind":"image","file":photos[i][0],"credit":photos[i][2]},"photo":{"camera":{"zoomFrom":1.045,"zoomTo":1.15,"panX":12 if i!=1 else -12,"panY":-10,"startFrame":0,"endFrame":d-8},"comparison":{"title":"Inflation annuelle" if i==0 else "Dépenses en octobre · sur un mois" if i==1 else "Inflation annuelle et cible","first":{"label":first[0],"value":first[1]},"second":{"label":second[0],"value":second[1]},"domain":{"min":0,"max":domain},"unit":"%","precision":precision,"locale":"fr-FR","source":src,"startFrame":10,"endFrame":min(d-10,85)}}}
shots=[
shot(0,"3,8 %","Les prix accélèrent de nouveau","ÉTATS-UNIS · 25 NOV. 2026",("Septembre",3.7),("Octobre",3.8),5,1,dict(source,dataset="PCE annuel · BEA / Reuters")),
shot(1,"PAYER PLUS. ACHETER AUTANT.","Les dépenses en dollars progressent, pas les volumes.","LE PARADOXE · OCTOBRE",("En dollars",0.3),("En volume (arrondi)",0.0),0.5,1),
shot(2,"LA FED SOUS PRESSION","Une hausse en décembre est anticipée, pas décidée.","TAUX D'INTÉRÊT · ARCHIVES",("Cible de la Fed",2.0),("PCE octobre",3.8),5,1,dict(source,dataset="BEA · cible Fed / Reuters")),
{"id":"plan-4","template":"kinetic","durationFrames":lengths[3],"title":"DES CRÉDITS\nPLUS CHERS ?","subtitle":"Ménages et entreprises : le risque d'un crédit plus coûteux.","eyebrow":"CE QUE CELA CHANGE","titleTreatment":"cyan-slab","motion":"locked","transitionAfter":"cut","transitionFrames":0}
]
shots[0]["titleFrameZero"]=True
# Each semantic reveal corresponds to a real sequence of words, not invented timing.
excerpts=["Trois virgule huit pour cent.","Mais les ménages ne consomment pas davantage.","sa cible reste deux pour cent.","Des crédits plus chers"]
beats=[]
for i,excerpt in enumerate(excerpts):
    ix=text.index(excerpt)
    j=len(text[:ix].split());k=j+len(excerpt.split())-1
    beats.append({"id":"beat-"+str(i+1),"shotId":shots[i]["id"],"startFrame":captions[j]["startFrame"],"endFrame":captions[k]["endFrame"],"intent":["hook","rehook","rehook","impact"][i],"idea":["L'inflation annuelle accélère","Les dépenses réelles stagnent","La cible de 2 % reste éloignée","Le crédit risque de coûter plus cher"][i],"spokenExcerpt":excerpt,"proofNote":"BEA, communiqué du 25 novembre 2026; Reuters, 25 novembre 2026; archives illustratives","visualDirection":"Révélation graduelle des valeurs sourcées sur le plan original; coupe sur la narration.","audioDirection":"Accent discret original, pas de faux son documentaire."})
# Generate original low-volume sound design; no third-party musical recordings.
def wav(path,secs,fn):
    sr=24000; samples=array.array("h",(int(32767*max(-1,min(1,fn(i/sr)))) for i in range(round(secs*sr))))
    with wave.open(str(path),"wb") as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes(samples.tobytes())
wav(ASSETS/"accent.wav",0.55,lambda t:0.22*math.sin(2*math.pi*(120*t+105*t*t))*math.exp(-9*t)*min(1,t/.025))
wav(ASSETS/"bed.wav",end/30,lambda t:0.07*(math.sin(2*math.pi*55*t)+0.4*math.sin(2*math.pi*82.41*t)+0.22*math.sin(2*math.pi*110*t))*min(1,t/1.5,max(0,(end/30-t)/1.5))*(0.6+0.4*math.sin(math.pi*t/2)**2))
p={"schema_version":"worldvision-creative-project-v1","id":"wv-pce-2026-11-25","title":"États-Unis : l'inflation accélère, la consommation cale","script":text,"fps":30,"aspect_ratio":"9:16","brandMark":"worldvision","style":{"background":"#071827","ink":"#f5fbff","accent":"#24d9d3"},"shots":shots,"wordCaptions":captions,"directorBeats":beats,"soundCues":[{"file":"accent.wav","startFrame":b["startFrame"],"durationFrames":15,"volume":0.22,"label":"Accent original synthétisé"} for b in beats],"voice":{"file":"vivienne.wav","label":"Vivienne C5.2 — nouvelle prise +8%","volume":1},"music":{"file":"bed.wav","label":"Ambiance originale synthétisée","volume":0.17},"outro":None}
(BASE/"project.json").write_text(json.dumps(p,ensure_ascii=False,indent=2))
sha=lambda b:hashlib.sha256(b).hexdigest()
manifest={"schema_version":"worldvision-owner-review-voice-v1","project_id":p["id"],"voice_profile_id":"vivienne-c5-2-impact-media","provider_voice_id":profile,"speaking_rate":"+8%","script_sha256":sha(text.encode()),"voice_file":"vivienne.wav","voice_sha256":sha((ASSETS/"vivienne.wav").read_bytes()),"recording_scope":"new_take_for_this_exact_script","human_listening":"pending_owner_review","publication_authorized":False,"rights_status":"not_yet_verified"}
(BASE/"voice-manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print("REAL VIVIENNE",duration,"seconds;",len(captions),"words;",lengths)
