import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {
 normalizeLongitude,assertCoordinate,easeCinematic,interpolateGlobe,
 listCountryTargets,targetForStory,GEO_TARGETING_VERSION,
} from "./geoTargeting.mjs";
const fixture=JSON.parse(readFileSync(fileURLToPath(new URL("../../public/countries.geojson",import.meta.url)),"utf8"));
const coords=p=>[p.lon,p.lat];
const distance=(a,b)=>Math.hypot(a.lon-b.lon,a.lat-b.lat);

test("version is explicit, longitude handles the date line",()=>{
 assert.equal(GEO_TARGETING_VERSION,"wv-geotarget-1");
 assert.equal(normalizeLongitude(190),-170);
 assert.equal(normalizeLongitude(-190),170);
 assert.equal(normalizeLongitude(180),180);
 assert.equal(normalizeLongitude(-180),-180);
 assert.throws(()=>assertCoordinate(500,0),RangeError);
 assert.throws(()=>assertCoordinate(0,91),RangeError);
 assert.throws(()=>assertCoordinate(NaN,20),RangeError);
});
test("easing is monotonic and endpoints exact",()=>{
 assert.equal(easeCinematic(-1),0);
 assert.equal(easeCinematic(0),0);
 assert.equal(easeCinematic(1),1);
 assert.equal(easeCinematic(3),1);
 for(let i=0;i<100;i++)assert.ok(easeCinematic((i+1)/100)>=easeCinematic(i/100));
});
test("great-circle motion preserves start and target, crosses dateline by short route",()=>{
 const start={lon:171,lat:-17},end={lon:-177,lat:-15};
 assert.ok(distance(interpolateGlobe(start,end,0),start)<1e-8);
 assert.ok(distance(interpolateGlobe(start,end,1),end)<1e-8);
 const middle=interpolateGlobe(start,end,.5);
 assert.ok(Math.abs(middle.lon)>170,"must pass close to 180°, not spin across Greenwich");
 assert.ok(middle.lat>=-19&&middle.lat<=-13);
});
test("nearly antipodal navigation never creates NaN or a polar flip",()=>{
 const start={lon:30,lat:0},end={lon:-150,lat:0};
 for(let i=0;i<=20;i++){
  const v=interpolateGlobe(start,end,i/20);
  assert.ok(Number.isFinite(v.lon)&&Number.isFinite(v.lat));
  assert.ok(v.lat>=-90&&v.lat<=90);
 }
 assert.deepEqual(coords(interpolateGlobe(start,end,1)),[-150,0]);
});
test("real checked V2 GeoJSON yields discoverable countries, no pseudo ISO3",()=>{
 const countries=listCountryTargets(fixture);
 assert.ok(countries.length>=190,"Expected a genuinely international map source");
 assert.ok(countries.every(c=>/^[A-Z]{3}$/.test(c.iso3)&&c.iso3!=="-99"));
 assert.equal(countries.filter(c=>c.iso3==="FRA").length,1);
 const gabon=countries.find(c=>c.iso3==="GAB");
 const mali=countries.find(c=>c.iso3==="MLI");
 const niger=countries.find(c=>c.iso3==="NER");
 const japan=countries.find(c=>c.iso3==="JPN");
 const fiji=countries.find(c=>c.iso3==="FJI");
 for(const c of [gabon,mali,niger,japan,fiji]){
   assert.ok(c&&Number.isFinite(c.lon)&&Number.isFinite(c.lat));
   assert.ok(c.lon>=-180&&c.lon<=180&&c.lat>=-90&&c.lat<=90);
 }
 assert.ok(mali.lat>10&&mali.lat<27,"Sahara country focus must be in Mali region");
 assert.ok(niger.lat>10&&niger.lat<25,"Sahara country focus must be in Niger region");
 assert.ok(gabon.lon>8&&gabon.lon<16,"Gabon must be geographically in central Africa");
});
test("news story ISO3 controls target, without guessing unrelated countries",()=>{
 const countries=listCountryTargets(fixture);
 assert.equal(targetForStory({country_iso3:"gab"},countries)?.iso3,"GAB");
 assert.equal(targetForStory({country_iso3:""},countries),null);
 assert.equal(targetForStory({country_iso3:null},countries),null);
 assert.equal(targetForStory({country_iso3:"-99"},countries),null);
 assert.equal(targetForStory(null,countries),null);
 assert.equal(targetForStory({country_iso3:"ZZZ"},countries),null);
});
test("invalid GeoJSON fails closed, no fake map source",()=>{
 assert.throws(()=>listCountryTargets(null),TypeError);
 assert.throws(()=>listCountryTargets({type:"Other",features:[]}),TypeError);
});
