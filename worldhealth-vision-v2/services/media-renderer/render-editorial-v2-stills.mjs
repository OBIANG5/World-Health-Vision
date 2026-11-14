/**
 * Professional editorial storyboard audit: render real frames from the actual
 * Remotion composition before spending compute on a 42.1s whole movie.
 */
import path from "node:path";
import {fileURLToPath} from "node:url";
import {mkdirSync,readFileSync,statSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {bundle} from "@remotion/bundler";
import {selectComposition,renderStill} from "@remotion/renderer";

const base=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(base,"output/editorial-v2/still-audit");
mkdirSync(out,{recursive:true});
const cases=[
 ["leaders",57],["globe",207],["city",315],
 ["newstart-archive",402],["newstart-expiry",527],
 ["china",680],["iran-ukraine",885],
 ["uncertainty",1076],["silent-signature",1220]
];
const url=await bundle({entryPoint:path.join(base,"src/editorial-v2-index.ts"),onProgress:()=>{}});
const c=await selectComposition({serveUrl:url,id:"WVEditorialV2"});
if(c.width!==1080||c.height!==1920||c.fps!==30||c.durationInFrames!==1263)
 throw Error("Wrong V2 composition format");
const files=[];
for(const [label,frame] of cases){
 const target=path.join(out,label+".png");
 console.log("RENDER STYLEFRAME",label,frame);
 await renderStill({composition:c,serveUrl:url,output:target,frame,imageFormat:"png"});
 const bytes=readFileSync(target);
 files.push({label,frame,second:frame/30,sha256:createHash("sha256").update(bytes).digest("hex"),bytes:statSync(target).size});
}
if(new Set(files.map(x=>x.sha256)).size!==files.length)
 throw Error("Duplicate unrelated scenes in storyboard");
const info={name:"World-Vision v2 scene storyboard",status:"QUALITY_REVIEW_ONLY",
 artistic_approved:false,source_composition:"WVEditorialV2",frames:files,
 output_type:"real Remotion stills, not generated illustrations",
 official_logo_source:"G0 SHA-pinned",globe:"real NASA/Natural Earth segment preserved",
 voice_used:false,publishable:false};
writeFileSync(path.join(out,"scene-audit.json"),JSON.stringify(info,null,2)+"\n");
console.log(JSON.stringify(info));
