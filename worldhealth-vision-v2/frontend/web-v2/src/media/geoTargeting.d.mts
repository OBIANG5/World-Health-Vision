/** Type contract for deterministic geotargeting used by React and future renderer. */
export type LonLat={lon:number;lat:number};
export type CountryTarget=LonLat&{iso3:string;name:string};
export type CountryGeoJSON={
  type:"FeatureCollection";
  features:Array<{
    type:"Feature";
    properties?:{"ISO3166-1-Alpha-3"?:string;name?:string;[key:string]:unknown};
    geometry?:{type:string;coordinates:unknown}|null;
  }>;
};
export const START_POSE: Readonly<LonLat>;
export const GEO_TARGETING_VERSION:string;
export function normalizeLongitude(lon:number):number;
export function assertCoordinate(lon:number,lat:number):LonLat;
export function easeCinematic(progress:number):number;
export function interpolateGlobe(from:LonLat,to:LonLat,progress:number):LonLat;
export function listCountryTargets(collection:CountryGeoJSON):CountryTarget[];
export function targetForStory(story:{country_iso3?:string|null}|null|undefined,countries:CountryTarget[]):CountryTarget|null;
