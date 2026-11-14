/*
 * World-Vision read-only newsroom archive.
 * REAL, source-verified COP31 case, not fictional news.
 *
 * The case begins as a source-backed working dossier embedded by the build.
 * When the GitHub Remotion workflow publishes an actual MP4, story.json
 * replaces that dossier. Media generation/approval/posting still requires
 * a connected backend, and no endpoint pretends otherwise.
 */
(() => {
  "use strict";
  const nativeFetch=window.fetch.bind(window);
  const archivePath="./media-pilots/cop31-risk-finance-2026-11-12/story.json";
  const workingCasePath="./editorial-case.json";
  let lastWasRealRender=false;

  const loadCase=async()=>{
    for(const [source,requiresVideo] of [[archivePath,true],[workingCasePath,false]]) {
      try {
        const response=await nativeFetch(source,{cache:"no-store"});
        if(!response.ok)continue;
        const candidate=await response.json();
        if(!candidate?.id || !candidate?.verification_report?.claims?.length)continue;
        if(requiresVideo && (
          candidate?.render_job?.status!=="completed" ||
          !/^[a-f0-9]{64}$/.test(candidate.render_job.output_sha256||"") ||
          !candidate.render_job.output_url
        )) continue;
        lastWasRealRender=requiresVideo;
        window.__WV_MEDIA_ARCHIVE_INFO={
          archive:true,real_news:true,
          rendered_mp4:requiresVideo,source_count:candidate.sources?.length||0,
          backend_connected:false,external_published:false,
        };
        return candidate;
      } catch (error) {
        console.warn("World-Vision newsroom archive unavailable:",source,error);
      }
    }
    window.__WV_MEDIA_ARCHIVE_INFO={
      archive:true,real_news:false,rendered_mp4:false,
      backend_connected:false,external_published:false,
    };
    return null;
  };

  const casePromise=loadCase();
  const json=(body,status=200)=>Promise.resolve(new Response(JSON.stringify(body),{
    status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
  }));
  window.fetch=(input,init)=>{
    const target=typeof input==="string"?input:input.url;
    const url=new URL(target,window.location.href);
    if(!url.pathname.startsWith("/api/media/"))return nativeFetch(input,init);
    const method=(init?.method||input?.method||"GET").toUpperCase();

    if(method==="GET"&&url.pathname==="/api/media/stories"){
      return casePromise.then(story=>json(story?[story]:[]));
    }
    if(method==="GET"&&url.pathname==="/api/media/dashboard"){
      return casePromise.then(story=>json({
        total:story?1:0,
        detected:story?.status==="detected"?1:0,
        verifying:story?.status==="verifying"?1:0,
        candidates:story?.status==="candidate"?1:0,
        in_production:story&&["approved","scripting","assets","rendering","qa"].includes(story.status)?1:0,
        preview_ready:story?.status==="preview_ready"?1:0,
        publish_ready:story?.status==="publish_ready"?1:0,
        published:0,rejected:0,top_score:story?.score?.total||0,
      }));
    }
    if(method==="GET"&&url.pathname==="/api/media/radar/scheduler"){
      return json({enabled:false,interval_seconds:300,scan_hours:6,max_candidates:12,
        redis_connected:false,lock_held:false,heartbeat_at:null,last_run_at:null,
        last_run_status:"ARCHIVE : aucun moteur RADAR connecté à ce site",last_error:null});
    }
    if(method==="GET"&&url.pathname==="/api/media/radar/scans/history"){
      return json([]);
    }
    return json({detail:
      "Archive réelle en lecture seule : le RADAR, la génération, la validation et la publication nécessitent le backend. Aucun résultat fictif n'est produit."
    },409);
  };

  function showNotice(){
    if(document.querySelector("#wv-media-demo-notice"))return;
    const banner=document.createElement("div");
    banner.id="wv-media-demo-notice";
    banner.setAttribute("role","status");
    banner.textContent="WORLD-VISION · ACTUALITÉ RÉELLE VÉRIFIÉE · archive en lecture seule";
    banner.style.cssText=[
      "position:sticky","top:0","width:100%","z-index:999999",
      "background:#123650","color:#dff5fc","padding:10px 14px",
      "font:750 11px/1.4 system-ui,sans-serif","letter-spacing:.035em",
      "text-align:center","border-bottom:1px solid #2ba9d859"
    ].join(";");
    document.body.insertBefore(banner,document.body.firstChild);
    casePromise.then(story=>{
      banner.textContent=!story
        ?"WORLD-VISION · DOSSIER RÉEL EN COURS DE CHARGEMENT · backend non connecté"
        : lastWasRealRender
          ?"WORLD-VISION · VIDÉO MP4 RÉELLE · sources ONU · non publiée · QA finale en attente"
          :"WORLD-VISION · DOSSIER ONU VÉRIFIÉ · rendu MP4 en cours de production";
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",showNotice,{once:true});
  else showNotice();
})();
