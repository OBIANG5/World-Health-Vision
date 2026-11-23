/**
 * One Vision registry, one service directory.
 * Every existing World-Vision product remains discoverable, but a planned
 * capability never masquerades as a working country-specific provider.
 * No separate hardcoded product copy or country coverage in the UI.
 */
import { useState } from "react";
import { VISION_PRODUCTS, type VisionId, type VisionProduct } from "../../product/visionProducts";
import { WorldIcon, type WorldIconName } from "../ui/WorldIcon";
import "../../styles/world-v3.css";

export type CountryDirectoryGroup =
  | "understand" | "finance" | "travel" | "shopping" | "follow" | "professional";

const GROUPS: readonly {
  id: CountryDirectoryGroup;
  label: { fr: string; en: string };
  icon: WorldIconName;
  summary: { fr: string; en: string };
}[] = [
  { id: "understand", label: { fr: "Comprendre le pays", en: "Understand the country" },
    icon: "globe", summary: { fr: "Atlas, statistiques, comparaisons et sources",
      en: "Atlas, indicators, comparisons and sources" }},
  { id: "finance", label: { fr: "Argent & marchés", en: "Money & markets" },
    icon: "markets", summary: { fr: "Devises, Trading Vision et marchés régionaux",
      en: "Currency, Trading Vision and regional markets" }},
  { id: "travel", label: { fr: "Voyager & vivre", en: "Travel & living" },
    icon: "travel", summary: { fr: "Tourisme, mobilité, destination et qualité de vie",
      en: "Tourism, mobility, destination and living" }},
  { id: "shopping", label: { fr: "Acheter & comparer", en: "Shop & compare" },
    icon: "scale", summary: { fr: "Price Vision, Panier Vision et prix locaux",
      en: "Price Vision, Panier Vision and local prices" }},
  { id: "follow", label: { fr: "Actualités & suivi", en: "News & following" },
    icon: "book", summary: { fr: "Actualités du pays, Radar, Watch Vision et Média",
      en: "Country news, Radar, Watch Vision and Media" }},
  { id: "professional", label: { fr: "Outils professionnels", en: "Professional tools" },
    icon: "layers", summary: { fr: "Méthodes, sources, exports et outils experts",
      en: "Methods, evidence, exports and expert tools" }},
];

/** Deliberately explicit; when VISION_PRODUCTS changes, the test contract
 * prevents silently omitting or duplicating any Vision. */
const PRODUCT_GROUP: Readonly<Record<VisionId, CountryDirectoryGroup>> = {
  atlas: "understand",
  money: "finance",
  trading: "finance",
  brvm: "finance",
  tourism: "travel",
  transport: "travel",
  price: "shopping",
  basket: "shopping",
  watch: "follow",
  radar: "follow",
  media: "follow",
};
const KEY_TO_ICON: Readonly<Record<VisionId, WorldIconName>> = {
  atlas: "map", money: "currency", trading: "markets", brvm: "markets",
  tourism: "compass", transport: "travel", price: "scale", basket: "regions",
  watch: "star", radar: "search", media: "book",
};

function stageText(stage: VisionProduct["stage"], lang: "fr" | "en") {
  return stage === "explorable"
    ? lang === "fr" ? "À explorer" : "Explore"
    : stage === "partial"
      ? lang === "fr" ? "Partiel" : "Partial"
      : lang === "fr" ? "En préparation" : "Planned";
}

export default function CountryServiceDirectory({
  iso3, countryName, language, onOpenVision, onOpenNews, onOpenFollow,
  onOpenData, onOpenCompare, onOpenSources, onOpenCurrency, onOpenTravel,
}: {
  iso3: string;
  countryName: string;
  language: "fr" | "en";
  onOpenVision: (id: VisionId) => void;
  onOpenNews: () => void;
  onOpenFollow: () => void;
  onOpenData: () => void;
  onOpenCompare: () => void;
  onOpenSources: () => void;
  onOpenCurrency: () => void;
  onOpenTravel: () => void;
}) {
  const [active, setActive] = useState<CountryDirectoryGroup>("understand");
  const fr = language === "fr";
  const group = GROUPS.find(g => g.id === active) ?? GROUPS[0];
  const products = VISION_PRODUCTS.filter(p => PRODUCT_GROUP[p.id] === active);

  const actionsByGroup: Partial<Record<CountryDirectoryGroup, {
    label: string; icon: WorldIconName; onClick: () => void;
  }[]>> = {
    understand: [
      { label: fr ? "Explorer les données" : "Explore indicators", icon: "markets", onClick: onOpenData },
      { label: fr ? "Comparer les pays" : "Compare countries", icon: "scale", onClick: onOpenCompare },
      { label: fr ? "Sources du pays" : "Country sources", icon: "book", onClick: onOpenSources },
    ],
    finance: [
      { label: fr ? "Ouvrir la conversion de devises" : "Open currency conversion", icon: "currency", onClick: onOpenCurrency },
    ],
    travel: [
      { label: fr ? "Préparer un voyage" : "Plan a trip", icon: "travel", onClick: onOpenTravel },
    ],
    follow: [
      { label: fr ? "Lire l’actualité du pays" : "Read country news", icon: "book", onClick: onOpenNews },
      { label: fr ? "Enregistrer ce pays" : "Save this country", icon: "star", onClick: onOpenFollow },
    ],
    professional: [
      { label: fr ? "Examiner les sources" : "Inspect sources", icon: "book", onClick: onOpenSources },
      { label: fr ? "Comparer les indicateurs" : "Compare indicators", icon: "scale", onClick: onOpenCompare },
    ],
  };

  return <section className="wv3-directory" aria-label={fr ? `Tous les services pour ${countryName}` :
    `All services for ${countryName}`}>
    <div className="wv3-directory-heading">
      <div>
        <span className="wv3-eyebrow">{fr ? "UN PAYS, PLUSIEURS VISIONS" : "ONE COUNTRY, MANY VISIONS"}</span>
        <h3>{fr ? `Explorer les services pour ${countryName}` : `Explore services for ${countryName}`}</h3>
      </div>
      <p>{fr
        ? "Les onze Visions sont consultables ici. Leur présence ne signifie pas que chaque service dispose déjà de données ou de prestataires dans ce pays."
        : "All eleven Visions are discoverable here. A listing does not prove the service has data or providers in this country."}</p>
    </div>
    <div className="wv3-directory-layout">
      <nav className="wv3-directory-categories" aria-label={fr ? "Familles de besoins" : "Service categories"}>
        {GROUPS.map(g => <button type="button" key={g.id}
          className={`wv3-directory-category${active === g.id ? " is-selected" : ""}`}
          aria-current={active === g.id ? "true" : undefined}
          onClick={() => setActive(g.id)}>
          <WorldIcon name={g.icon} size={19}/>
          <span>{g.label[language]}</span><WorldIcon name="arrow" size={15}/>
        </button>)}
      </nav>
      <div className="wv3-directory-detail" key={active}>
        <div className="wv3-directory-detail-head">
          <h4>{group.label[language]}</h4>
          <p>{group.summary[language]}</p>
        </div>
        {(actionsByGroup[active] ?? []).length > 0 && <div className="wv3-directory-actions">
          {(actionsByGroup[active] ?? []).map(action => <button key={action.label}
            type="button" onClick={action.onClick}>
            <WorldIcon name={action.icon} size={17}/>{action.label}
            <WorldIcon name="arrow" size={15}/>
          </button>)}
        </div>}
        {products.length > 0 && <div className="wv3-vision-rows" aria-label={fr ? "Visions de cette famille" : "Visions in this category"}>
          {products.map(product => <button type="button" key={product.id}
            className="wv3-vision-row" onClick={() => onOpenVision(product.id)}
            title={product.caveat[language]}>
            <WorldIcon name={KEY_TO_ICON[product.id]} size={19}/>
            <span><strong>{product.name}</strong><small>{product.tagline[language]}</small></span>
            <span className="wv3-product-stage" data-stage={product.stage}>{stageText(product.stage,language)}</span>
            <WorldIcon name="arrow" size={16}/>
          </button>)}
        </div>}
        {active === "professional" && <p className="wv3-directory-note">{fr
          ? "Les fonctions professionnelles, exports et accès aux données restent soumis aux droits de chaque source. Les mêmes preuves sont utilisées dans les autres Visions."
          : "Professional functions, exports and access to data depend on individual source rights. Evidence is shared across the Visions."}</p>}
        {active === "finance" && iso3 === "GAB" && <p className="wv3-directory-note">{fr
          ? "Le Gabon appartient à la CEMAC ; le contexte boursier régional pertinent est celui de la BVMAC. BRVM Vision concerne les marchés de l’UEMOA, sans être la bourse nationale du Gabon."
          : "Gabon belongs to CEMAC; its regional exchange context is BVMAC. The BRVM concerns UEMOA markets, not a Gabonese national exchange."}</p>}
        {active === "shopping" && <p className="wv3-directory-note">{fr
          ? "Les prix et stocks nécessitent une ville, un magasin et des offres observées. Aucune disponibilité locale n’est supposée."
          : "Prices and stock require a city, store and observed offers. Local coverage is never assumed."}</p>}
        {active === "follow" && <p className="wv3-directory-note">{fr
          ? "Les favoris actuels sont disponibles. Les alertes d’actualité et notifications automatiques constituent une fonction prévue de Watch Vision, non encore activée."
          : "Favorites work today. Automated news alerts and notifications are planned for Watch Vision, not yet active."}</p>}
      </div>
    </div>
  </section>;
}
