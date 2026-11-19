#!/usr/bin/env node
/**
 * Prepares the OFFICIAL NASA Blue Marble Next Generation June 2004 global
 * composite for the shared Remotion renderer and Vite player.
 *
 * No private uploads. No "random Earth" downloaded from a stock-media site.
 * No dependence on the user's uploaded reference being in the repository.
 *
 * Run: node creative/prepare-earth-texture.mjs
 *
 * This step is required before rendering a geo_story with geo.look="photo".
 * The raster is not silently swapped for a fake SVG; failed downloads fail.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";

const repoService=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const destinations=[
  path.join(repoService,"public/geo/nasa-blue-marble-june.jpg"),
  path.resolve(repoService,"../../frontend/web-v2/public/geo/nasa-blue-marble-june.jpg")
];
const nasaUrl="https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/june/world.200406.3x5400x2700.jpg";
const attribution="NASA Earth Observatory — Blue Marble: Next Generation (June 2004), 5400×2700 seasonal composite";
const maxBytes=25*1024*1024;
// SHA-256 recorded from the actual official NASA download in green CI #44567135931.
const pinnedSHA256="dc059529b8ed1cfcdd59747a7c3f259c93c1322bf88ca1ec8bab1dd71fcc57f5";
const expectedDimensions={width:5400,height:2700};
function imageDimensions(buffer){
  let i=2;
  while(i+9<buffer.length){
    if(buffer[i]!==0xff){i++;continue;}
    const marker=buffer[i+1],len=buffer.readUInt16BE(i+2);
    if([0xc0,0xc1,0xc2,0xc3].includes(marker)){
      return {height:buffer.readUInt16BE(i+5),width:buffer.readUInt16BE(i+7)};
    }
    i+=len+2;
  }
  return null;
}
const cached=destinations[0];
let raw=null;
if(fs.existsSync(cached)){
  const local=fs.readFileSync(cached);
  const dims=imageDimensions(local);
  if(dims?.width===expectedDimensions.width&&dims.height===expectedDimensions.height)raw=local;
}
if(!raw){
  const ac=new AbortController();
  const timeout=setTimeout(()=>ac.abort(),90000);
  try{
    const response=await fetch(nasaUrl,{signal:ac.signal,headers:{"User-Agent":"World-Vision-Media-Production/1.0 (NASA attribution retained)"}});
    if(!response.ok)throw new Error("NASA image fetch: HTTP "+response.status);
    const length=Number(response.headers.get("content-length")??0);
    if(length>maxBytes)throw new Error("NASA response too large");
    const chunks=[],reader=response.body?.getReader();
    if(!reader)throw new Error("NASA response body missing");
    let bytes=0;
    for(;;){
      const {value,done}=await reader.read();
      if(done)break;
      bytes+=value.byteLength;
      if(bytes>maxBytes)throw new Error("NASA JPEG exceeded 25 MB");
      chunks.push(value);
    }
    raw=Buffer.concat(chunks);
  }finally{clearTimeout(timeout);}
}
if(raw[0]!==0xff||raw[1]!==0xd8)throw new Error("NASA file not a JPEG");
const dims=imageDimensions(raw);
if(dims?.width!==expectedDimensions.width||dims.height!==expectedDimensions.height)
  throw new Error("NASA image resolution mismatch: "+JSON.stringify(dims));
const sha256=createHash("sha256").update(raw).digest("hex");
if(sha256!==pinnedSHA256)throw new Error("NASA Blue Marble digest changed; stop rather than silently replacing the licensed raster. Expected "+pinnedSHA256+" got "+sha256);
for(const p of destinations){
  fs.mkdirSync(path.dirname(p),{recursive:true});
  fs.writeFileSync(p,raw);
  fs.writeFileSync(p+".source.json",JSON.stringify({
    source_url:nasaUrl,source_org:"NASA Earth Observatory",
    attribution,year:2004,month:"June",
    nature:"visual seasonal composite; not live observations",
    sha256,bytes:raw.byteLength,width:dims.width,height:dims.height,
    usage_guidance:"https://www.nasa.gov/nasa-brand-center/images-and-media/"
  },null,2)+"\n");
}
console.log(JSON.stringify({status:"prepared",sha256,bytes:raw.length,destinations,source:nasaUrl}));
