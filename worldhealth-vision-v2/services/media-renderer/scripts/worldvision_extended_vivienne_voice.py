#!/usr/bin/env python3
"""New editorial director's cut, same Vivienne persona, longer full-take reading.

The approved C5.2 remains frozen. This is NOT a changed voice, but a new
narration for a more complete cut on the SAME, independently checked event.
No blocks, insertions, artificial silence surgery, or forced fragments.
"""
import asyncio, hashlib, json, argparse
from pathlib import Path
import edge_tts

VOICE="fr-FR-VivienneMultilingualNeural"
TEXT=("À La Nouvelle-Orléans, un navire-citerne percute un bateau de croisière à quai ! "
"Sur le Mississippi où le choc survient, l'American Heritage bascule et plusieurs passagers tombent à l'eau. "
"Il est environ midi trente, ce vendredi treize novembre. "
"À bord, près de cent quatre-vingts personnes, passagers et membres d'équipage. "
"Des bateaux voisins, des employés du port et les équipes de secours se mobilisent pour les sortir du fleuve. "
"Trente-deux personnes sont conduites à l'hôpital pour recevoir des soins, sans blessure critique signalée. "
"Tous les occupants sont retrouvés. Aucun décès n'est annoncé. "
"Mais comment le navire-citerne Atlantic Asphalt a-t-il pu heurter un bateau immobilisé ? "
"Une enquête doit établir la cause exacte de l'accident.")

async def run(out,rate):
    out.mkdir(parents=True,exist_ok=True)
    tag="vivienne_extended_"+rate.replace("+","plus").replace("%","pct")
    audio=out/(tag+".mp3")
    words=[]
    source=edge_tts.Communicate(TEXT,VOICE,rate=rate,pitch="+0Hz",volume="+0%",boundary="WordBoundary")
    with audio.open("wb") as stream:
        async for chunk in source.stream():
            if chunk["type"]=="audio":
                stream.write(chunk["data"])
            elif chunk["type"]=="WordBoundary":
                words.append({"text":chunk.get("text"),
                              "time":round(chunk["offset"]/1e7,3),
                              "duration":round(chunk["duration"]/1e7,3)})
    if audio.stat().st_size<80000 or len(words)<65:
        raise RuntimeError("Audio incomplete: "+str(audio.stat().st_size)+" bytes")
    report={"voice":VOICE,"rate":rate,"pitch":"+0Hz",
            "text":TEXT,"word_count":len(words),"words":words,
            "source_text_sha256":hashlib.sha256(TEXT.encode()).hexdigest(),
            "mp3_sha256":hashlib.sha256(audio.read_bytes()).hexdigest(),
            "full_single_tts_take":True,"audio_spliced":False,
            "artificial_silence_inserted":False,"automated_silence_removed":False,
            "is_new_story_cut":True,"C52_reference_not_modified":True,
            "editorial_facts":["180 passengers and crew, approximately","32 hospitalized, no critical injuries","no fatalities","collision under investigation"],
            "sources":["https://apnews.com/article/757bed7a70ceb72f0d7140143fe2a764",
                       "https://www.cbsnews.com/news/tanker-cruise-collision-mississippi-river-new-orleans/"],
            "human_voice_review_pending":True,
            "commercial_voice_rights_not_confirmed":True}
    (out/(tag+"-report.json")).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf8")
    print(json.dumps({"audio":audio.name,"bytes":audio.stat().st_size,
                       "words":len(words),"rate":rate,"sha256":report["mp3_sha256"]}))

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--out",required=True,type=Path)
    p.add_argument("--rate",default="+5%")
    a=p.parse_args()
    asyncio.run(run(a.out,a.rate))
