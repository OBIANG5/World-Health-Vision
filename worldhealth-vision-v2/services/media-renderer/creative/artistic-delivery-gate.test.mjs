import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {artisticSampleFrames,artisticDeliveryStatus,REVIEW_AXES,requireArtisticallyDeliverable} from './artistic-delivery-gate.mjs';
const p={shots:[{id:'one',durationFrames:90,template:'photo_story',transitionAfter:'dissolve',transitionFrames:10},{id:'two',durationFrames:150,template:'data_story',transitionAfter:'cut',transitionFrames:0}],directorBeats:[{startFrame:110,endFrame:160}],outro:{durationFrames:60},brandMark:'worldvision'};
test('review samples span EVERY shot, transition, beat, and silent outro',()=>{
 const f=artisticSampleFrames(p);
 for(const n of [0,44,80,84,89,110,134,154,159,229,230,289])assert.ok(f.includes(n),String(n));
 assert.equal(f.length,new Set(f).size);
});
test('successful voice validation never grants artistic or brand acceptance',()=>{
 const r=artisticDeliveryStatus(p,{profile_id:'vivienne-c5-2-impact-media'});
 assert.equal(r.status,'blocked');assert.equal(r.publication_authorized,false);
 assert.ok(r.blockers.includes('approved_current_brand_asset_missing'));
 assert.deepEqual(r.required_review_axes,REVIEW_AXES);
 assert.ok(artisticDeliveryStatus({...p,shots:[{...p.shots[0],titleTreatment:'cyan-slab'}]},null).blockers.includes('legacy_cyan_slab_requires_redesign'));
});
test('a candidate or forged approval cannot open the delivery boundary',()=>{
 for(const r of [{},{artistic_delivery:artisticDeliveryStatus(p,{})},{artistic_delivery:{status:'approved',publication_authorized:true}}])
   assert.throws(()=>requireArtisticallyDeliverable(r),/delivery refused/);
});
test('no legacy paper logo or decorative heading rails in shared production components',()=>{
 const src=name=>fs.readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
 assert.doesNotMatch(src('CreativeEdit.tsx'),/staticFile\("brand\/world-vision-official\.png"\)/);
 for(const name of ['PhotoMultilayer.tsx','DataMotion.tsx','GeoStory.tsx','CountryFocus.tsx'])
   assert.doesNotMatch(src(name),/borderLeft:\s*"(?:4|5)px solid/);
 assert.doesNotMatch(src('PhotoMultilayer.tsx'),/borderTop:\s*"3px solid "\+accent/);
 assert.match(src('CreativeEdit.tsx'),/editorialTypeface/);
 assert.match(src('AttentionTypography.tsx'),/data-wv-photo-caption-rail/);
});
