import {memo,useMemo} from "react";
import GlobeMap from "../map/GlobeMap";
import type {CountrySummary} from "../../api/types";
import "../../styles/eye.css";

/** World-Vision's unified interactive globe.
 * The obsolete Leaflet eye-map alternative has been retired from the UI.
 * Country interactions still open the SAME canonical V2 country profiles. */
type Props={
 drawerOpen:boolean;
 countries:CountrySummary[];
 selectedCountryIso3:string;
 onCountryClick:(iso3:string)=>void;
};
function EyeMapFrame({drawerOpen,countries,selectedCountryIso3,onCountryClick}:Props){
 const countriesMap=useMemo(()=>new Map(countries.map(c=>[c.iso3,c])),[countries]);
 return <section className={"eye-stage globe-mode whv-electric-stage"+(drawerOpen?" drawer-open":"")}
   aria-label="World-Vision — globe terrestre interactif">
   <GlobeMap countriesMap={countriesMap}
     selectedCountryIso3={selectedCountryIso3} onCountryClick={onCountryClick}/>
 </section>;
}
export default memo(EyeMapFrame);
