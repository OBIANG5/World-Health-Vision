/**
 * World-Vision · reference-inspired Earth colour atlas.
 *
 * Uses the V2 country GeoJSON to build a real geographical land mask once,
 * then paints a deterministic topographic-inspired, non-scientific colour map.
 * The map is projected onto the SAME rotating sphere as country hit-testing.
 * No remote imagery, weather, topographic or economic data is fabricated.
 *
 * The user-supplied eye/Earth reference (15 November 2026) provides the visual
 * direction: ink-blue water, emerald equatorial zones, orange Sahara, white
 * borders and cyan atmospheric rim.
 */
import type {FeatureCollection,Geometry} from "geojson";

export type EarthVisualTexture={
  width:number;
  height:number;
  data:Uint8ClampedArray;
};

export type EarthRasterSurface={
  canvas:HTMLCanvasElement;
  context:CanvasRenderingContext2D;
};

const RAD=Math.PI/180;
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const smooth=(a:number,b:number,t:number)=>{
  const v=clamp((t-a)/(b-a),0,1);
  return v*v*(3-2*v);
};
const hash=(x:number,y:number)=>{
  let n=(Math.imul(x,374761393)+Math.imul(y,668265263))|0;
  n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967295;
};
function noise(x:number,y:number):number{
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  const a=hash(ix,iy)+(hash(ix+1,iy)-hash(ix,iy))*u;
  const b=hash(ix,iy+1)+(hash(ix+1,iy+1)-hash(ix,iy+1))*u;
  return a+(b-a)*v;
}
function fractal(x:number,y:number):number{
  return .56*noise(x,y)+.29*noise(x*2.17+3.4,y*2.17+1.7)
    +.15*noise(x*4.57+12.1,y*4.57+5.8);
}
function pathRing(ctx:CanvasRenderingContext2D,ring:number[][],w:number,h:number):void{
  if(ring.length<3)return;
  let prev=ring[0][0];
  let unwrapped=prev;
  ctx.moveTo((unwrapped+180)/360*w,(90-ring[0][1])/180*h);
  for(let i=1;i<ring.length;i++){
    const lon=ring[i][0];
    let delta=lon-prev;
    if(delta>180)delta-=360;
    if(delta< -180)delta+=360;
    unwrapped+=delta;prev=lon;
    ctx.lineTo((unwrapped+180)/360*w,(90-ring[i][1])/180*h);
  }
  ctx.closePath();
}
function polygons(geometry:Geometry|null):number[][][][]{
  if(!geometry)return [];
  if(geometry.type==="Polygon")return [geometry.coordinates];
  if(geometry.type==="MultiPolygon")return geometry.coordinates;
  return [];
}
/** Rasterize country polygons using the same source as the existing pick(). */
function landMask(geo:FeatureCollection,w:number,h:number):Uint8ClampedArray{
  const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  if(!ctx)throw new Error("Canvas 2D unavailable for Earth atlas");
  ctx.fillStyle="#fff";
  for(const feature of geo.features){
    for(const poly of polygons(feature.geometry)){
      // Repeat at each wrap to avoid dateline cut-off in Russia/Pacific islands.
      for(const offset of [-w,0,w]){
        ctx.save();ctx.translate(offset,0);ctx.beginPath();
        for(const ring of poly)pathRing(ctx,ring,w,h);
        ctx.fill("evenodd");ctx.restore();
      }
    }
  }
  return ctx.getImageData(0,0,w,h).data;
}
const rgb=(r:number,g:number,b:number):[number,number,number]=>[r,g,b];
const mix=(a:[number,number,number],b:[number,number,number],t:number):[number,number,number]=>
 [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const inside=(lon:number,lat:number,minLon:number,maxLon:number,minLat:number,maxLat:number)=>{
  const a=smooth(minLon-5,minLon+5,lon)*(1-smooth(maxLon-5,maxLon+5,lon));
  const b=smooth(minLat-5,minLat+5,lat)*(1-smooth(maxLat-5,maxLat+5,lat));
  return a*b;
};
/** A vivid geographic-biome interpretation, not measured climate observations. */
function landColour(lon:number,lat:number,low:number,ridges:number):[number,number,number]{
  const forest=rgb(13,122,37),tropics=rgb(21,144,41),spring=rgb(84,163,30);
  const meadow=rgb(125,166,44),desert=rgb(242,155,53),dune=rgb(250,191,89);
  const rock=rgb(169,110,61),snow=rgb(222,239,240);
  let c: [number,number,number]=Math.abs(lat)<24?
    mix(forest,tropics,.20+low*.55):mix(spring,meadow,.34+low*.45);
  const sahara=inside(lon,lat,-20,39,12,35)
    *smooth(8,17,lat)*(1-smooth(34,42,lat));
  const saharaTransition=inside(lon,lat,-18,38,7,18)*.5;
  const arabia=inside(lon,lat,35,64,10,34);
  const centralAsia=inside(lon,lat,48,110,34,51)*.46;
  const southwesternUS=inside(lon,lat,-117,-102,23,40)*.55;
  const australia=inside(lon,lat,114,150,-34,-16)*.87;
  const kalahari=inside(lon,lat,12,32,-35,-19)*.79;
  const eastAfrica=inside(lon,lat,35,52,-5,17)*.43;
  const atacama=inside(lon,lat,-79,-68,-29,-10)*.66;
  const sandy=clamp(Math.max(sahara,saharaTransition,arabia,centralAsia,
    southwesternUS,australia,kalahari,eastAfrica,atacama),0,1);
  const shifting=clamp((low-.47)*.70, -.18,.18);
  c=mix(c,mix(desert,dune,.32+shifting),sandy);
  // Mountain ridges: Atlas, Alps, Andes, Himalaya and East Africa.
  const mountains=Math.max(
    inside(lon,lat,-10,12,29,37)*.55,
    inside(lon,lat,5,20,42,48)*.34,
    inside(lon,lat,-79,-67,-50,8)*.77,
    inside(lon,lat,69,105,26,38)*.90,
    inside(lon,lat,35,44,-9,15)*.27
  );
  const relief=(.24+Math.abs(ridges-.5)*1.3)*mountains;
  c=mix(c,rock,clamp(relief,0,.71));
  const vegetation=(low-.5)*31+(ridges-.5)*18;
  c=[c[0]+vegetation*.49,c[1]+vegetation,c[2]+vegetation*.35];
  if(Math.abs(lat)>66)c=mix(c,snow,smooth(65,84,Math.abs(lat))*.83);
  return c;
}
export function createEarthVisualTexture(geo:FeatureCollection):EarthVisualTexture{
  // 1152 × 576 balances locally rendered detail and phone startup cost.
  const width=1152,height=576;
  const mask=landMask(geo,width,height);
  const data=new Uint8ClampedArray(width*height*4);
  for(let y=0;y<height;y++){
    const lat=90-(y+.5)/height*180;
    for(let x=0;x<width;x++){
      const lon=(x+.5)/width*360-180,idx=(y*width+x)*4;
      const n=fractal((lon+180)/360*17,(lat+90)/180*13);
      const grain=fractal((lon+180)/360*63+4,(lat+90)/180*47+7);
      let colour:[number,number,number];
      if(mask[idx+3]>100){
        colour=landColour(lon,lat,n,grain);
      }else{
        const deep=rgb(0,32,99),royal=rgb(3,72,160),azure=rgb(5,91,182);
        const waves=clamp(.21+.72*n,.10,.78);
        colour=mix(mix(deep,royal,waves),azure,Math.max(0,grain-.56)*.31);
        // An intricate but subtle deep-water texture instead of flat paint.
        const shimmer=(grain-.5)*15;
        colour=[colour[0]+shimmer*.18,colour[1]+shimmer*.67,colour[2]+shimmer*1.1];
      }
      const latShade=1-.09*Math.max(0,(Math.abs(lat)-54)/36);
      // Reference-inspired cloud wisps are deliberately decorative, not weather.
      const cloud=fractal((lon+180)/360*53+19,(lat+90)/180*37+29);
      const wisp=Math.max(0,(cloud-.67)*3.5);
      const cloudAlpha=Math.min(.34,wisp*wisp*.62);
      data[idx]=clamp((colour[0]*latShade)*(1-cloudAlpha)+251*cloudAlpha,0,255);
      data[idx+1]=clamp((colour[1]*latShade)*(1-cloudAlpha)+250*cloudAlpha,0,255);
      data[idx+2]=clamp((colour[2]*latShade)*(1-cloudAlpha)+255*cloudAlpha,0,255);
      data[idx+3]=255;
    }
  }
  return {width,height,data};
}
/**
 * Forward projection from an equirectangular biome atlas to a real globe.
 * No UI pixel is used to decide which country was touched: the original
 * GeoJSON spherical inverse projection remains the authority.
 */
export function paintEarthTexture(
  ctx:CanvasRenderingContext2D,cx:number,cy:number,r:number,
  lon:number,lat:number,texture:EarthVisualTexture,raster:EarthRasterSurface
):void{
  const size=Math.max(8,Math.ceil(r*2));
  if(raster.canvas.width!==size||raster.canvas.height!==size){
    raster.canvas.width=size;raster.canvas.height=size;
  }
  const image=raster.context.createImageData(size,size),out=image.data;
  const origin=size/2,inv=1/origin;
  const angleLat=lat*RAD,c=Math.cos(angleLat),s=Math.sin(angleLat);
  const pix=texture.data,tw=texture.width,th=texture.height;
  for(let py=0;py<size;py++){
    const north=(origin-py-.5)*inv;
    for(let px=0;px<size;px++){
      const east=(px+.5-origin)*inv;
      const q=1-east*east-north*north;
      if(q<=0)continue;
      const z=Math.sqrt(q);
      const degrees=lon+Math.atan2(east,z*c-north*s)/RAD;
      const longitude=((degrees+180)%360+360)%360;
      const latitude=Math.asin(clamp(z*s+north*c,-1,1))/RAD;
      const tx=Math.max(0,Math.min(tw-1,Math.floor(longitude/360*tw)));
      const ty=Math.max(0,Math.min(th-1,Math.floor((90-latitude)/180*th)));
      const src=(ty*tw+tx)*4,dst=(py*size+px)*4;
      // Blue Marble-style daylight: lit centre, sculpted twilight limb.
      const daylight=.57+.43*Math.pow(z,.60);
      const sun=clamp(z*.75-east*.29+north*.24,0,1);
      const brilliance=Math.pow(sun,16)*10;
      out[dst]=clamp(pix[src]*daylight+brilliance*.3,0,255);
      out[dst+1]=clamp(pix[src+1]*daylight+brilliance*.65,0,255);
      out[dst+2]=clamp(pix[src+2]*daylight+brilliance,0,255);
      out[dst+3]=255;
    }
  }
  raster.context.putImageData(image,0,0);
  ctx.save();
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  ctx.drawImage(raster.canvas,cx-r,cy-r,r*2,r*2);
  ctx.restore();
}
