/**
 * Reusable World-Vision 10m country geometry projection.
 *
 * Uses the exact 50m/10m source TopoJSON supplied by world-atlas@2.0.2
 * (Natural Earth 4.1.0). Never uses procedurally invented political shapes.
 * NOTE: atlas IDs are ISO 3166-1 numeric-looking string IDs, NOT a complete
 * universal legal sovereignty register. De facto/cartographic point of view.
 */
import {geoAzimuthalEqualArea,geoCentroid,geoPath,geoDistance,geoContains} from "d3-geo";
import {feature} from "topojson-client";

const padId=id=>String(id).padStart(3,"0");
export const mapBox=[[143,390],[937,1040]];

/** Entire context is sourced from 50m, foreground country from 10m. */
export function countryFocusGeometry(detailAtlas,contextAtlas,countryId){
  if(!/^\d{3}$/.test(countryId))return null;
  const detailTopology=detailAtlas?.objects?.countries;
  const contextTopology=contextAtlas?.objects?.countries;
  if(!detailTopology?.geometries||!contextTopology?.geometries)return null;
  const selected=detailTopology.geometries.find(g=>padId(g.id)===countryId);
  if(!selected)return null;
  const selectedCountry=feature(detailAtlas,selected);
  const centroid=geoCentroid(selectedCountry);
  if(!centroid.every(Number.isFinite))return null;
  // Local azimuthal projection avoids meridian-seam jumps and minimizes country
  // distortion compared with pushing a tiny island onto a world screen.
  const projection=geoAzimuthalEqualArea()
    .rotate([-centroid[0],-centroid[1]])
    .clipAngle(145).precision(.3)
    .fitExtent(mapBox,selectedCountry);
  const path=geoPath(projection);
  const detailPath=path(selectedCountry)||"";
  if(detailPath.length<4)return null;
  // Only nearby countries are included in the visual context. This reduces
  // unrelated paths and avoids projecting antipodal borders behind the focus.
  const near=contextTopology.geometries.filter(g=>{
    const f=feature(contextAtlas,g);
    const center=geoCentroid(f);
    return center.every(Number.isFinite)&&geoDistance(centroid,center)<1.25;
  });
  const contextPath=near.map(g=>path(feature(contextAtlas,g))||"").join(" ");
  const centerXY=projection(centroid);
  return {
    countryId,centroid,centerXY,
    country:selectedCountry,
    contextPath,detailPath,
    projection,
    geoContainsPoint:(point)=>geoContains(selectedCountry,point)
  };
}
