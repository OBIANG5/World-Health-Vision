/* World Health Vision V2 — aperçu navigateur sans services Docker.
   Ce fichier n'est pas une nouvelle interface : il fournit seulement les réponses
   minimales au frontend React d'origine. Aucune statistique économique inventée. */
(() => {
  const countries=window.__WHV_PREVIEW_COUNTRIES__||[];
  const byCode=new Map(countries.map(c=>[c.iso3,c]));
  // Exact country and region metadata comes from V2's World Bank registry.
  // Both geographic regions and subregions are searchable; data are not invented.
  const regionMap=new Map();
  for(const country of countries) {
    for(const [code,name,type] of [
      [country.regionCode,country.regionName,"REGION"],
      [country.subregionCode,country.subregionName,"SUBREGION"],
    ]) {
      if(!code)continue;
      if(!regionMap.has(code))regionMap.set(code,{
        code,displayName:name||code,type,countryCount:0,aggregateCount:0
      });
      regionMap.get(code).countryCount++;
    }
  }
  const regions=[...regionMap.values()].sort((a,b)=>
    a.type.localeCompare(b.type)||a.displayName.localeCompare(b.displayName));
  const sources=window.__WHV_PREVIEW_SOURCES__||[];
  // axios choisit son adaptateur fetch plutôt que XMLHttpRequest.
  try { window.XMLHttpRequest=undefined; } catch(_) {}
  for(const key of ["localStorage","sessionStorage"]) {
    try { window[key].getItem("__whv_probe__"); }
    catch(_) {
      const values=new Map();
      try { Object.defineProperty(window,key,{configurable:true,value:{
        getItem:k=>values.has(String(k))?values.get(String(k)):null,
        setItem:(k,v)=>values.set(String(k),String(v)),
        removeItem:k=>values.delete(String(k)),
        clear:()=>values.clear(),key:i=>[...values.keys()][i]??null,
        get length(){return values.size;}
      }}); } catch(_) {}
    }
  }
  const baseFetch=window.fetch.bind(window);
  const json=(body,status=200)=>Promise.resolve(new Response(JSON.stringify(body),
        {status,headers:{"content-type":"application/json;charset=utf-8"}}));
  const light=c=>c?({iso3:c.iso3,displayName:c.displayName,
      regionCode:c.regionCode,regionName:c.regionName,
      subregionCode:c.subregionCode,subregionName:c.subregionName,
      aggregate:false,active:true,dataQualityTier:0}):null;
  window.fetch=(input,init)=>{
    const raw=typeof input==="string"?input:String(input&&input.url||input);
    // Direct World Bank API remains LIVE (no invented or suppressed statistics).
    if (/countries\.geojson(?:[?#]|$)/i.test(raw))
      return baseFetch(new URL("./countries.geojson",document.baseURI),init);
    let path="";
    try { path=new URL(raw,document.baseURI).pathname; } catch(_) {}
    // Frankfurter is a publicly accessible, keyless CORS-enabled reference-rate API.
    // The original frontend expects the /fx-api path supplied by Vite in local dev.
    if (path==="/fx-api" || path.startsWith("/fx-api/")) {
      const src=new URL(raw,document.baseURI);
      const suffix=src.pathname.slice("/fx-api".length);
      const endpoint="https://api.frankfurter.dev/v1"+suffix+src.search;
      return baseFetch(endpoint,{...init,mode:"cors",credentials:"omit"});
    }
    if(path==="/api/catalog/countries") return json({count:countries.length,items:countries});
    if(path.startsWith("/api/catalog/countries/")){
      const country=byCode.get(decodeURIComponent(path.split("/").at(-1)).toUpperCase());
      return country?json(country):json({detail:"Pays introuvable dans le catalogue"},404);
    }
    if(path==="/api/catalog/regions") return json({count:regions.length,items:regions});
    if(path.startsWith("/api/catalog/regions/")) {
      const code=decodeURIComponent(path.split("/").at(-1));
      const match=regions.find(region=>region.code===code);
      return match?json(match):json({detail:"Région non référencée"},404);
    }
    if(path==="/api/catalog/sources") return json({count:sources.length,items:sources});
    if(path.startsWith("/api/catalog/sources/")) {
      const code=decodeURIComponent(path.split("/").at(-1));
      const match=sources.find(source=>source.code===code);
      return match?json(match):json({detail:"Source non référencée"},404);
    }
    const countrySnap=path.match(/^\/api\/product\/countries\/([A-Z]{3})\/(economic-snapshot|relative-cost-snapshot)$/);
    if(countrySnap){
      const c=light(byCode.get(countrySnap[1]));
      if(!c)return json({detail:"Pays indisponible"},404);
      const body={country:c,generatedAtUtc:"",lensCount:0,highlights:[],lenses:[]};
      if(countrySnap[2]==="relative-cost-snapshot")
        Object.assign(body,{decisionSignalCount:0,decisionSignals:[]});
      return json(body);
    }
    const regionSnap=path.match(/^\/api\/product\/regions\/([^/]+)\/(economic|relative-cost)-snapshot$/);
    if(regionSnap){
      const r=regions.find(x=>x.code===decodeURIComponent(regionSnap[1]));
      if(!r)return json({detail:"Région indisponible"},404);
      const body={region:r,generatedAtUtc:"",lensCount:0,highlights:[],lenses:[]};
      if(regionSnap[2]==="relative-cost")Object.assign(body,{decisionSignalCount:0,decisionSignals:[]});
      return json(body);
    }
    if(path.startsWith("/api/"))return json({detail:
       "Service backend désactivé dans l'aperçu : aucune donnée statistique simulée."},503);
    return baseFetch(input,init);
  };
  console.info("World Health Vision V2 — aperçu transparent sans backend, "+sources.length+" sources référencées (pas nécessairement ingérées).");
})();