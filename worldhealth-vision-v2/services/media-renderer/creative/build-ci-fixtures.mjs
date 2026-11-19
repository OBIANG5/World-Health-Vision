#!/usr/bin/env node
/** Synthetic CI fixtures ONLY. No shots depict a news event. */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const [assetsDir,previousMaster,outputJson]=process.argv.slice(2);
if(!assetsDir||!previousMaster||!outputJson)throw new Error("Usage: build-ci-fixtures.mjs <assets> <previous-mp4> <project.json>");
fs.mkdirSync(assetsDir,{recursive:true});
const png="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+XzzZAAAAAElFTkSuQmCC";
fs.writeFileSync(path.join(assetsDir,"synthetic-pixel.png"),Buffer.from(png,"base64"));
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
p.shots[0].media={kind:"image",file:"synthetic-pixel.png",credit:"Synthetic technical fixture"};
p.shots[1].template="clean_video";
p.shots[1].media={kind:"video",file:"synthetic-clip.mp4"};
p.voice={file:"synthetic-tone.wav",label:"TEST SINE TONE — NOT A VOICE",volume:1};
fs.writeFileSync(outputJson,JSON.stringify(p,null,2)+"\n");
console.log("Synthetic image/video/audio fixtures created; not authentic news assets.");
