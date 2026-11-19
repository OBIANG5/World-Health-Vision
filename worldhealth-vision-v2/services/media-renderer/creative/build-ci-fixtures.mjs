#!/usr/bin/env node
/** Synthetic CI fixtures ONLY. No shots depict a news event. */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {deflateSync} from "node:zlib";

/**
 * Deterministic abstract landscape, solely for testing framing and optical motion.
 * This is NOT photojournalism, stock footage, or an image of any real location.
 * A synthetic image is used so CI never depends on an external media website.
 */
function makeSyntheticLandscape(filepath,cutout=false,document=false){
  const width=540,height=960;
  const pixels=Buffer.alloc((width*4+1)*height);
  const frac=x=>Math.max(0,Math.min(1,x));
  const mix=(a,b,t)=>a+(b-a)*frac(t);
  for(let y=0;y<height;y++){
    const row=y*(width*4+1);pixels[row]=0;
    for(let x=0;x<width;x++){
      const t=y/height;
      const far=490+36*Math.sin(x/39)+17*Math.sin(x/16)+Math.cos(x/75)*30;
      const near=690+45*Math.sin(x/66)+19*Math.cos(x/21);
      const glow=Math.exp(-((x-365)**2+(y-300)**2)/(2*152**2));
      const moonDist=Math.hypot(x-371,y-300);
      const moon=moonDist<53?1:0;
      const horizonRipple=y>575?Math.pow(Math.abs(Math.cos(y/10+x/42)),10)*.055:0;
      const farMountain=y>far&&y<near;
      const foreground=y>=near;
      let r=mix(6,34,t)+65*glow+140*moon,
          g=mix(20,72,t)+90*glow+130*moon,
          b=mix(33,89,t)+110*glow+99*moon;
      if(farMountain){r=12+glow*13;g=41+glow*17;b=54+glow*22;}
      if(foreground){r=5+horizonRipple*110;g=27+horizonRipple*130;b=39+horizonRipple*141;}
      if(cutout&&!foreground){r=0;g=0;b=0;}
      if(document){
        // Abstract geometric "paper", NOT a mocked real report or actual text.
        r=236;g=243;b=244;
        if(x>42&&x<500&&y>50&&y<93){r=17;g=48;b=62;}
        if(x>52&&x<484&&y>108&&y<117){r=47;g=139;b=168;}
        if(x>52&&x<484&&y>430&&y<540){r=219;g=238;b=241;}
        const lines=(y>158&&y<885&&Math.floor((y-158)/38)%5!==4);
        const rowIndex=Math.floor((y-158)/38);
        const lineLen=185+((rowIndex*47)%263);
        const textBlock=lines && x>59 && x<Math.min(485,59+lineLen) && (y-158)%38<9;
        if(textBlock){r=80+(rowIndex%3)*8;g=100+(rowIndex%3)*5;b=108+(rowIndex%3)*4;}
        if(x>58&&x<482&&y>420&&y<424){r=54;g=152;b=179;}
        if(x>58&&x<482&&y>539&&y<543){r=54;g=152;b=179;}
        if(x>58&&x<63&&y>424&&y<539){r=54;g=152;b=179;}
      }
      const at=row+1+x*4;
      pixels[at]=Math.round(Math.min(255,r));
      pixels[at+1]=Math.round(Math.min(255,g));
      pixels[at+2]=Math.round(Math.min(255,b));
      pixels[at+3]=cutout?(foreground?255:0):255;
    }
  }
  const crcTable=new Uint32Array(256);
  for(let n=0;n<256;n++){
    let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):(c>>>1);
    crcTable[n]=c>>>0;
  }
  function crc32(buffer){
    let c=0xffffffff;
    for(const n of buffer)c=crcTable[(c^n)&255]^(c>>>8);
    return (c^0xffffffff)>>>0;
  }
  function chunk(type,data){
    const tag=Buffer.from(type,"ascii");
    const len=Buffer.alloc(4);len.writeUInt32BE(data.length);
    const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([tag,data])));
    return Buffer.concat([len,tag,data,crc]);
  }
  const header=Buffer.alloc(13);
  header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);
  header[8]=8;header[9]=6;
  const out=Buffer.concat([
    Buffer.from("89504e470d0a1a0a","hex"),
    chunk("IHDR",header),chunk("IDAT",deflateSync(pixels,{level:7})),chunk("IEND",Buffer.alloc(0))
  ]);
  fs.writeFileSync(filepath,out);
}


const [assetsDir,previousMaster,outputJson]=process.argv.slice(2);
if(!assetsDir||!previousMaster||!outputJson)throw new Error("Usage: build-ci-fixtures.mjs <assets> <previous-mp4> <project.json>");
fs.mkdirSync(assetsDir,{recursive:true});
const png="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+XzzZAAAAAElFTkSuQmCC";
fs.writeFileSync(path.join(assetsDir,"synthetic-pixel.png"),Buffer.from(png,"base64"));
makeSyntheticLandscape(path.join(assetsDir,"synthetic-landscape.png"));
makeSyntheticLandscape(path.join(assetsDir,"synthetic-foreground.png"),true);
makeSyntheticLandscape(path.join(assetsDir,"synthetic-document.png"),false,true);
fs.copyFileSync(previousMaster,path.join(assetsDir,"synthetic-clip.mp4"));
const sampleRate=48000,seconds=5.2,samples=Math.ceil(sampleRate*seconds),bits=16,channels=1;
const pcmBytes=samples*channels*bits/8;
const wav=Buffer.alloc(44+pcmBytes);
wav.write("RIFF",0);wav.writeUInt32LE(36+pcmBytes,4);wav.write("WAVE",8);
wav.write("fmt ",12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);
wav.writeUInt16LE(channels,22);wav.writeUInt32LE(sampleRate,24);
wav.writeUInt32LE(sampleRate*channels*bits/8,28);
wav.writeUInt16LE(channels*bits/8,32);wav.writeUInt16LE(bits,34);
wav.write("data",36);wav.writeUInt32LE(pcmBytes,40);
for(let i=0;i<samples;i++){
  const fade=Math.min(1,i/2200,(samples-i)/2200);
  const signal=Math.sin(i*2*Math.PI*220/sampleRate)*500*fade;
  wav.writeInt16LE(Math.round(signal),44+i*2);
}
fs.writeFileSync(path.join(assetsDir,"synthetic-tone.wav"),wav);
const gap=Buffer.from(wav);
for(let i=Math.floor(sampleRate*2.0);i<Math.floor(sampleRate*3.3);i++){
  gap.writeInt16LE(0,44+i*2);
}
fs.writeFileSync(path.join(assetsDir,"synthetic-tone-with-gap.wav"),gap);

const here=path.dirname(fileURLToPath(import.meta.url));
const p=JSON.parse(fs.readFileSync(path.join(here,"project.example.json"),"utf8"));
p.id="wv-fixture-with-image-video-audio";
p.title="TEST TECHNIQUE — médias externes, pas une actualité";
p.shots[0].template="focus_reveal";
p.shots[0].durationFrames=105;
p.shots[0].title="L’IMAGE PREND PLACE";
p.shots[0].subtitle="Atelier motion — exemple non journalistique";
p.shots[0].eyebrow="COMPOSITION FOURNIE";
p.shots[0].media={kind:"image",file:"synthetic-landscape.png",credit:"Original synthetic abstract CI landscape, not a news image"};
p.shots[0].foreground={file:"synthetic-foreground.png",credit:"Synthetic cutout for compositing test only"};
p.shots[1].template="clean_video";
p.shots[1].media={kind:"video",file:"synthetic-clip.mp4"};
p.voice={file:"synthetic-tone.wav",label:"TEST SINE TONE — NOT A VOICE",volume:1};
fs.writeFileSync(outputJson,JSON.stringify(p,null,2)+"\n");
// Dedicated journalistic-document-motion test. The "paper" contains only
// generated rectangles/lines, never a falsely attributed source or quote.
const documentProject=structuredClone(p);
documentProject.id="wv-document-focus-synthetic-only";
documentProject.title="DOCUMENT ABSTRAIT — TEST NON JOURNALISTIQUE";
documentProject.shots=[{
  id:"plan-document",
  template:"document_focus",
  durationFrames:140,
  title:"EXAMINER LE DOCUMENT",
  subtitle:"Une zone fournie, jamais réécrite par le logiciel.",
  eyebrow:"DOCUMENT TEST — AUCUNE ACTUALITÉ",
  media:{kind:"image",file:"synthetic-document.png",credit:"Generated abstract rectangles, no claims"},
  documentRegion:{x:.3,y:.40,width:.45,height:.20},
  motion:"locked",transitionAfter:"cut",transitionFrames:0
}];
documentProject.voice=null;
documentProject.music=null;
documentProject.outro=null;
const documentPath=path.join(path.dirname(outputJson),"worldvision-document-project.json");
fs.writeFileSync(documentPath,JSON.stringify(documentProject,null,2)+"\n");
// GEO-2 real 10m/50m country composition. Media is a synthetic geometric
// landscape, never a photograph of Gabon or a claimed news event.
const countryProject=structuredClone(p);
countryProject.id="wv-country-focus-gabon-synthetic";
countryProject.title="PAYS FOCUS 10m / 50m — TEST CARTOGRAPHIQUE";
countryProject.script="Cas technique uniquement : cartographie sourcée, photographie fictive et nombre fictif.";
countryProject.shots=[{
  id:"country-gabon",template:"country_focus",durationFrames:165,
  title:"GABON · UN PAYS EN FOCUS",
  subtitle:"Cartographie détaillée, paysage abstrait de démonstration et valeur fictive.",
  eyebrow:"DEMONSTRATION TECHNIQUE · AUCUNE ACTUALITÉ",
  media:{kind:"image",file:"synthetic-landscape.png",credit:"CI generated abstract landscape, not real Gabon"},
  foreground:{file:"synthetic-foreground.png",credit:"CI generated transparent synthetic mask, no real subject"},
  geo:{
    center:{lon:0,lat:10},
    spotlight:{countryId:"266"},
    target:{lon:11.6,lat:-.7,label:"POINT TEST"},
    metric:{label:"CHIFFRE TEST",value:42,unit:" TEST",precision:0}
  },
  motion:"locked",transitionAfter:"cut",transitionFrames:0,
  focus:{x:.5,y:.5}
}];
countryProject.voice=null;countryProject.music=null;countryProject.outro=null;
const countryPath=path.join(path.dirname(outputJson),"worldvision-country-focus-project.json");
fs.writeFileSync(countryPath,JSON.stringify(countryProject,null,2)+"\n");
console.log("Synthetic image/video/audio/document fixtures created; not authentic news assets.");
