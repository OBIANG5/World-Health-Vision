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
  const nationalContexts=window.__WHV_PREVIEW_LOCAL_CONTEXT__||{};
  const countrySourceCoverage=window.__WHV_PREVIEW_COUNTRY_COVERAGE__||null;
  // These snapshots were extracted from versioned V24-V26 SQL migrations.
  // They are NOT responses from a running V2 Catalog or TimescaleDB service.
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

  const mediaPreviewStory={
    id:"story-gab-rgpl-2026",
    slug:"gabon-rgpl-2026-3518621-habitants",
    status:"publish_ready",
    title:"Gabon : le nouveau recensement fixe la population à 3 518 621 habitants",
    summary:"Le RGPL 2026 homologué au Gabon établit une population officielle de 3 518 621 habitants, très au-dessus des estimations internationales de 2025.",
    category:"démographie",
    language:"fr",
    country_iso3:"GAB",
    country_name:"Gabon",
    region:"Afrique centrale",
    breaking:false,
    detected_at:"2026-08-27T16:20:00Z",
    event_at:"2026-08-27T12:00:00Z",
    updated_at:"2026-11-12T18:30:00Z",
    verification_status:"verified",
    confidence_score:95,
    verification_report:{
      version:1,
      checked_at:"2026-11-12T17:00:00Z",
      model:"preview-verify",
      retrieved_urls:[
        "https://agpgabon.ga/rgpl-2026-le-gabon-compte-desormais-3-518-621-habitants/",
        "https://courconstitutionnelle.ga/"
      ],
      claims:[
        {
          claim:"Le RGPL 2026 homologué fixe la population gabonaise à 3 518 621 habitants.",
          status:"verified",
          supporting_urls:[
            "https://agpgabon.ga/rgpl-2026-le-gabon-compte-desormais-3-518-621-habitants/",
            "https://courconstitutionnelle.ga/"
          ],
          contradicting_urls:[],
          explanation:"Aperçu : les deux sources du seed World-Vision sont conservées comme provenance."
        }
      ],
      distinct_supporting_sources:2,
      has_primary_support:true,
      verdict:"verified",
      confidence_score:95
    },
    sources:[
      {
        id:"src-agp-rgpl",
        name:"Agence Gabonaise de Presse (AGP)",
        url:"https://agpgabon.ga/rgpl-2026-le-gabon-compte-desormais-3-518-621-habitants/",
        source_type:"press_agency",
        scope:"local",
        country_iso3:"GAB",
        is_primary:false,
        published_at:"2026-08-27T15:00:00Z",
        note:"Agence de presse nationale rapportant l'homologation des résultats.",
        rights_note:null
      },
      {
        id:"src-cour-constitutionnelle-gabon",
        name:"Cour constitutionnelle du Gabon",
        url:"https://courconstitutionnelle.ga/",
        source_type:"institution",
        scope:"local",
        country_iso3:"GAB",
        is_primary:true,
        published_at:"2026-08-27T12:00:00Z",
        note:"Institution ayant homologué les résultats définitifs du RGPL.",
        rights_note:null
      }
    ],
    score:{
      total:91,
      factors:{
        freshness:86,surprise:95,human_impact:64,importance:91,
        visual_potential:83,numerical_strength:98,undercoverage:96,
        francophone_relevance:88,africa_relevance:100,source_confidence:94,
        urgency:82,saturation_penalty:18
      },
      reasons:[
        "Chiffre officiel très fort et immédiatement compréhensible.",
        "Pertinence Afrique et francophone élevée.",
        "Deux sources locales conservées dans la provenance."
      ],
      model_version:"wv-editorial-v0.1"
    },
    hooks:[
      {
        id:"creative-hook-1",
        text:"🇬🇦 3,5 millions : le nouveau chiffre qui change la taille du Gabon.",
        score:96,
        rationale:"Chiffre clé immédiat et lisible.",
        claim_indexes:[1]
      },
      {
        id:"creative-hook-2",
        text:"🇬🇦 Le Gabon vient de changer d’échelle démographique.",
        score:92,
        rationale:"Angle court et mémorisable.",
        claim_indexes:[1]
      },
      {
        id:"creative-hook-3",
        text:"🇬🇦 Un recensement, et près d’un million d’habitants d’écart.",
        score:90,
        rationale:"Met en avant la surprise statistique.",
        claim_indexes:[1]
      }
    ],
    selected_hook_id:"creative-hook-1",
    creative_package:{
      version:1,
      created_at:"2026-11-12T17:10:00Z",
      model:"preview-creative",
      angle:"Le nouveau chiffre officiel change la lecture de la taille démographique du Gabon.",
      angle_claim_indexes:[1],
      target_duration_sec:16,
      hooks:[
        {
          id:"creative-hook-1",
          text:"🇬🇦 3,5 millions : le nouveau chiffre qui change la taille du Gabon.",
          score:96,
          rationale:"Chiffre clé immédiat et lisible.",
          claim_indexes:[1]
        },
        {
          id:"creative-hook-2",
          text:"🇬🇦 Le Gabon vient de changer d’échelle démographique.",
          score:92,
          rationale:"Angle court et mémorisable.",
          claim_indexes:[1]
        },
        {
          id:"creative-hook-3",
          text:"🇬🇦 Un recensement, et près d’un million d’habitants d’écart.",
          score:90,
          rationale:"Met en avant la surprise statistique.",
          claim_indexes:[1]
        }
      ],
      script_segments:[
        {
          text:"Le nouveau RGPL fixe la population du Gabon à 3 518 621 habitants.",
          claim_indexes:[1]
        },
        {
          text:"Le chiffre a été homologué et change fortement la lecture démographique du pays.",
          claim_indexes:[1]
        }
      ],
      caption:"Le nouveau recensement homologué fixe la population gabonaise à 3 518 621 habitants.",
      caption_claim_indexes:[1],
      hashtags:["#Gabon","#Démographie","#WorldVision"],
      scene_plan:[
        {
          order:1,purpose:"hook",on_screen_text:"3 518 621 HABITANTS",
          visual_kind:"typography",asset_query:null,claim_indexes:[1]
        },
        {
          order:2,purpose:"explain",on_screen_text:"UN NOUVEAU CHIFFRE OFFICIEL",
          visual_kind:"real_photo",asset_query:"Libreville Gabon skyline",claim_indexes:[1]
        },
        {
          order:3,purpose:"source_and_brand",on_screen_text:"Sources vérifiées",
          visual_kind:"source_card",asset_query:null,claim_indexes:[]
        }
      ]
    },
    script:"Le nouveau RGPL fixe la population du Gabon à 3 518 621 habitants. Le chiffre a été homologué et change fortement la lecture démographique du pays.",
    video_draft:{
      version:1,
      created_at:"2026-11-12T17:20:00Z",
      format:"9:16",width:1080,height:1920,fps:30,duration_sec:16,
      rendering_engine:"remotion",
      design_system_id:"wv-pilot-editorial-dark-v1",
      safe_zone_profile:"tiktok-conservative-v1",
      hook_id:"creative-hook-1",
      voiceover_script:"Le nouveau RGPL fixe la population du Gabon à 3 518 621 habitants. Le chiffre a été homologué et change fortement la lecture démographique du pays.",
      source_line:"Sources : Agence Gabonaise de Presse (AGP) · Cour constitutionnelle du Gabon",
      scenes:[
        {
          id:"scene-1",order:1,start_sec:0,duration_sec:5,purpose:"hook",
          narration:"Le nouveau RGPL fixe la population du Gabon à 3 518 621 habitants.",
          on_screen_text:"3 518 621 HABITANTS",visual_kind:"typography",
          asset_query:null,source_ids:["src-agp-rgpl"],asset_id:null,asset_url:null,
          asset_attribution:null,asset_license:null
        },
        {
          id:"scene-2",order:2,start_sec:5,duration_sec:8,purpose:"explain",
          narration:"Le chiffre a été homologué et change fortement la lecture démographique du pays.",
          on_screen_text:"UN NOUVEAU CHIFFRE OFFICIEL",visual_kind:"real_photo",
          asset_query:"Libreville Gabon skyline",source_ids:["src-cour-constitutionnelle-gabon"],
          asset_id:"asset-preview-libreville",
          asset_url:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Libreville.jpg/1024px-Libreville.jpg",
          asset_attribution:"Wikimedia Commons · aperçu de démonstration",
          asset_license:"licence à consulter sur Commons"
        },
        {
          id:"scene-3",order:3,start_sec:13,duration_sec:3,purpose:"source_and_brand",
          narration:null,on_screen_text:"Sources vérifiées",visual_kind:"source_card",
          asset_query:null,source_ids:["src-agp-rgpl","src-cour-constitutionnelle-gabon"],
          asset_id:null,asset_url:null,asset_attribution:null,asset_license:null
        }
      ]
    },
    voiceover:{
      id:"voice-preview",provider:"openai_realtime",model:"gpt-realtime-2.1-mini",
      voice:"marin",format:"wav",sample_rate_hz:24000,duration_sec:12.4,
      generated_at:"2026-11-12T17:25:00Z",
      renderer_url:"",transcript:"Le nouveau RGPL fixe la population du Gabon à 3 518 621 habitants. Le chiffre a été homologué et change fortement la lecture démographique du pays.",
      transcript_match_score:100,duration_fit:true,qa_passed:true,
      ai_generated_disclosure:"Voix générée par IA"
    },
    render_job:{
      id:"render-preview",story_id:"story-gab-rgpl-2026",
      render_profile:"canonical_newsroom_v1",status:"completed",progress:1,
      created_at:"2026-11-12T17:30:00Z",updated_at:"2026-11-12T17:31:00Z",
      output_url:null,output_sha256:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      error:null
    },
    target_duration_sec:16,
    assets:{photos:4,videos:0,official_documents:1,maps_or_charts:1},
    asset_bundle:{
      version:1,discovered_at:"2026-11-12T17:15:00Z",provider:"wikimedia_commons",
      assets:[
        {
          id:"asset-preview-libreville",provider:"wikimedia_commons",
          title:"Libreville — aperçu",kind:"image",
          source_page_url:"https://commons.wikimedia.org/",
          media_url:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Libreville.jpg/1024px-Libreville.jpg",
          thumbnail_url:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Libreville.jpg/320px-Libreville.jpg",
          mime_type:"image/jpeg",author:"Wikimedia contributor",
          license_name:"Voir fiche Commons",license_url:"https://commons.wikimedia.org/",
          attribution:"Wikimedia Commons · aperçu de démonstration",
          rights_status:"approved",
          rights_note:"Aperçu interface uniquement : consulter la fiche Commons avant réutilisation.",
          query:"Libreville Gabon skyline",discovered_at:"2026-11-12T17:15:00Z"
        }
      ],
      selections:[{scene_order:2,asset_id:"asset-preview-libreville"}],
      unresolved_scene_orders:[]
    },
    qa:{
      facts:"pass",spelling:"pass",safe_zones:"pass",logo_integrity:"pass",
      source_display:"pass",rights:"pass",audio:"pass",
      notes:["APERÇU STATIQUE : états de production simulés pour visualiser l’interface."]
    },
    qa_report:{
      version:1,checked_at:"2026-11-12T17:40:00Z",language_model:"preview-qa",
      all_passed:true,issues:[]
    },
    publication_package:{
      version:1,created_at:"2026-11-12T17:45:00Z",
      story_id:"story-gab-rgpl-2026",
      target_channels:["tiktok","whatsapp"],
      video_url:"",
      title:"Gabon : le nouveau recensement fixe la population à 3 518 621 habitants",
      caption:"Le nouveau recensement homologué fixe la population gabonaise à 3 518 621 habitants.",
      hashtags:["#Gabon","#Démographie","#WorldVision"],
      tiktok_caption:"Le nouveau recensement homologué fixe la population gabonaise à 3 518 621 habitants.\n\n#Gabon #Démographie",
      whatsapp_text:"*Gabon : le nouveau recensement fixe la population à 3 518 621 habitants*\n\nLe nouveau recensement homologué fixe la population gabonaise à 3 518 621 habitants.\n\n*Sources :*\n• Agence Gabonaise de Presse (AGP)\n• Cour constitutionnelle du Gabon\n\n_Voix générée par IA_",
      source_names:["Agence Gabonaise de Presse (AGP)","Cour constitutionnelle du Gabon"],
      source_urls:["https://agpgabon.ga/rgpl-2026-le-gabon-compte-desormais-3-518-621-habitants/","https://courconstitutionnelle.ga/"],
      ai_disclosure:"Voix générée par IA",
      creative_version:1,qa_version:1,
      manifest_sha256:"1111111111111111111111111111111111111111111111111111111111111111"
    },
    channel_exports:[
      {
        channel:"tiktok",render_profile:"tiktok_api_clean_v1",
        canonical_manifest_sha256:"1111111111111111111111111111111111111111111111111111111111111111",
        render_job:{
          id:"render-tiktok-preview",story_id:"story-gab-rgpl-2026",
          render_profile:"tiktok_api_clean_v1",status:"completed",progress:1,
          created_at:"2026-11-12T17:46:00Z",updated_at:"2026-11-12T17:47:00Z",
          output_url:null,
          output_sha256:"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          error:null
        }
      }
    ],
    publication_receipts:[],
    approval_note:"Aperçu statique de l’interface ; aucune publication externe n’a été effectuée."
  };
  const mediaDashboard={
    total:1,detected:0,verifying:0,candidates:0,in_production:0,
    preview_ready:0,publish_ready:1,published:0,rejected:0,top_score:91
  };

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
    if(path==="/api/media/stories") return json([mediaPreviewStory]);
    if(path==="/api/media/dashboard") return json(mediaDashboard);
    if(path==="/api/media/radar/scheduler") return json({
      enabled:true,interval_seconds:300,scan_hours:3,max_candidates:12,
      redis_connected:true,lock_held:false,
      heartbeat_at:"2026-11-12T18:25:00Z",
      last_run_at:"2026-11-12T18:20:00Z",
      last_run_status:"preview_snapshot",
      last_scan_id:"preview-radar-1",last_error:null
    });
    if(path==="/api/media/radar/scans/history") return json([{
      scan_id:"preview-radar-1",requested_at:"2026-11-12T18:20:00Z",
      hours:3,country_iso3:null,max_candidates:12,model:"preview-radar",
      query:"APERÇU STATIQUE — aucune recherche web exécutée depuis GitHack",
      retrieved_urls:[],candidates_found:1,candidates_accepted:1,
      candidates_rejected_without_retrieved_source:0,
      stories_created:["story-gab-rgpl-2026"],stories_deduplicated:[]
    }]);
    if(/^\/api\/media\/stories\/story-gab-rgpl-2026$/.test(path)) return json(mediaPreviewStory);
    if(/^\/api\/media\/stories\/story-gab-rgpl-2026\//.test(path)) return json(mediaPreviewStory);
    if(path==="/api/media/radar/scans" && (init&&String(init.method||"GET").toUpperCase()==="POST"))
      return json({scan_id:"preview-radar-manual",query:"aperçu",model:"preview-radar",
        retrieved_urls:[],candidates_found:1,candidates_accepted:1,
        candidates_rejected_without_retrieved_source:0,
        stories_created:[],stories_deduplicated:["story-gab-rgpl-2026"]});

        if(path==="/api/catalog/local-sources/coverage") {
      return countrySourceCoverage
        ?json(countrySourceCoverage)
        :json({detail:"Instantané des sources nationales absent"},503);
    }
    const localMatch=path.match(/^\/api\/catalog\/countries\/([A-Z]{3})\/local-context$/i);
    if(localMatch){
      const iso3=localMatch[1].toUpperCase();
      if(!byCode.has(iso3))return json({detail:"Pays introuvable"},404);
      const snapshot=nationalContexts[iso3];
      return snapshot
        ?json(snapshot)
        :json({detail:"Catalogue local non disponible dans cet aperçu"},503);
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
    if(/^\/api\/product\/countries\/[A-Z]{3}\/national-comparisons$/.test(path)){
      return json({detail:
        "Aperçu statique : comparaison nationale et séries internationales indisponibles sans backend. Le recensement local est une publication SQL documentée, non une observation ingérée."},503);
    }
    if(path.startsWith("/api/"))return json({detail:
       "Service backend désactivé dans l'aperçu : aucune donnée statistique simulée."},503);
    return baseFetch(input,init);
  };
  console.info("World Health Vision V2 — aperçu transparent sans backend, "+sources.length+
    " sources mondiales, "+Object.values(nationalContexts).reduce((n,c)=>n+c.localSourceCount,0)+
    " liens institutionnels locaux SQL versionnés ; aucune donnée économique mondiale simulée.");
})();