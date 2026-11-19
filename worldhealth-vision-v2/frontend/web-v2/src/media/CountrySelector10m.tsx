import {useMemo} from "react";
import atlas10 from "world-atlas/countries-10m.json";

/**
 * Loaded only if a journalist edits a country-focus plan.
 * World Atlas 10m country identities are NOT an authoritative legal list of
 * internationally recognized states. De facto polygons, Natural Earth 4.1.
 */
export default function CountrySelector10m({value,onChange}:{
  value:string;onChange:(id:string)=>void;
}){
  const countries=useMemo(()=>{
    type Geometry={id?:string|number;properties?:{name?:string}};
    const geometry=(atlas10 as unknown as {objects:{countries:{geometries:Geometry[]}}})
      .objects.countries.geometries;
    const unique=new Map<string,string>();
    for(const g of geometry){
      const id=String(g.id).padStart(3,"0");
      if(/^\d{3}$/.test(id))unique.set(id,g.properties?.name??"Code "+id);
    }
    return [...unique].map(([id,name])=>({id,name}))
      .sort((a,b)=>a.name.localeCompare(b.name,"fr"));
  },[]);
  return <label>PAYS / UNITÉ GÉOGRAPHIQUE DU RÉFÉRENTIEL 1:10m
    <select value={value} onChange={event=>onChange(event.target.value)}>
      <option value="">Choisir explicitement un territoire présent dans l'atlas</option>
      {countries.map(country=><option value={country.id} key={country.id}>
        {country.name} · {country.id}
      </option>)}
    </select>
    <span className="wvc-hint">Données Natural Earth 4.1, simplification 1:10m.
      Les limites suivent une représentation cartographique de facto ; consulter
      les sources officielles, territoires contestés et périodes avant publication.</span>
  </label>;
}
