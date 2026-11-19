import type {GeoProjection} from "d3-geo";
export type CountryFocusGeometry={
  countryId:string;
  centroid:[number,number];
  centerXY:[number,number]|null;
  country:unknown;
  detailPath:string;
  contextPath:string;
  projection:GeoProjection;
  geoContainsPoint:(point:[number,number])=>boolean;
};
export const mapBox:[[number,number],[number,number]];
export function countryFocusGeometry(
  detailAtlas:unknown,contextAtlas:unknown,countryId:string
):CountryFocusGeometry|null;
