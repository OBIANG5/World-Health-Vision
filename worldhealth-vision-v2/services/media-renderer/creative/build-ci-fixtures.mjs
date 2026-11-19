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
function makeSyntheticLandscape(filepath){
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
      const at=row+1+x*4;
      pixels[at]=Math.round(Math.min(255,r));
      pixels[at+1]=Math.round(Math.min(255,g));
      pixels[at+2]=Math.round(Math.min(255,b));
      pixels[at+3]=255;
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
p.shots[1].template="clean_video";
p.shots[1].media={kind:"video",file:"synthetic-clip.mp4"};
p.voice={file:"synthetic-tone.wav",label:"TEST SINE TONE — NOT A VOICE",volume:1};
fs.writeFileSync(outputJson,JSON.stringify(p,null,2)+"\n");
console.log("Synthetic image/video/audio fixtures created; not authentic news assets.");
