/**
 * The ONE global World-Vision services menu.
 * Source: visionProducts (official names/stages) + visionNavigation (shared
 * task groups). No parallel menu with different products or made-up coverage.
 */
import { useState } from "react";
import { VISION_PRODUCTS, type VisionId } from "../../product/visionProducts";
import {
  VISION_SERVICE_GROUPS, VISION_SERVICE_GROUP_BY_ID,
  type CountryDirectoryGroup,
} from "../../product/visionNavigation";
import { WorldIcon, type WorldIconName } from "../ui/WorldIcon";

type MenuAction = {
  id: string;
  title: { fr: string; en: string };
  description: { fr: string; en: string };
  icon: WorldIconName;
  callback: () => void;
};
type MenuHandlers = {
  country: () => void;
  regions: () => void;
  sources: () => void;
  currency: () => void;
  purchasingPower: () => void;
  advisor: () => void;
  travel: () => void;
  destinationScore: () => void;
  retirement: () => void;
  realEstate: () => void;
  favorites: () => void;
  news: () => void;
  alerts: () => void;
};

export default function ServicesMegaMenuV3({
  language, onClose, onVision, handlers,
}: {
  language: "fr" | "en";
  onClose: () => void;
  onVision: (id: VisionId) => void;
  handlers: MenuHandlers;
}) {
  const fr = language === "fr";
  const [active, setActive] = useState<CountryDirectoryGroup>("understand");
  const actions: Record<CountryDirectoryGroup, MenuAction[]> = {
    understand: [
      { id: "country", title: { fr: "Explorer un pays", en: "Explore a country" },
        description: { fr: "Ouvrir une fiche géographique", en: "Open a geographic profile" },
        icon: "map", callback: handlers.country },
      { id: "regions", title: { fr: "Régions du monde", en: "World regions" },
        description: { fr: "Parcourir les territoires", en: "Browse territories" },
        icon: "regions", callback: handlers.regions },
      { id: "sources", title: { fr: "Sources et institutions", en: "Sources and institutions" },
        description: { fr: "Comparer les preuves disponibles", en: "Compare available evidence" },
        icon: "book", callback: handlers.sources },
    ],
    finance: [
      { id: "currency", title: { fr: "Convertir une devise", en: "Convert currencies" },
        description: { fr: "Taux de référence datés", en: "Dated reference rates" },
        icon: "currency", callback: handlers.currency },
      { id: "purchasing", title: { fr: "Pouvoir d'achat", en: "Purchasing power" },
        description: { fr: "Comparer les niveaux de vie", en: "Compare living standards" },
        icon: "scale", callback: handlers.purchasingPower },
      { id: "advisor", title: { fr: "Conseiller économique", en: "Economic advisor" },
        description: { fr: "Interpréter les indicateurs", en: "Interpret economic indicators" },
        icon: "advisor", callback: handlers.advisor },
    ],
    travel: [
      { id: "travel", title: { fr: "Préparer un voyage", en: "Plan a trip" },
        description: { fr: "Destination et transport", en: "Destination and transport" },
        icon: "travel", callback: handlers.travel },
      { id: "score", title: { fr: "Explorer une destination", en: "Explore a destination" },
        description: { fr: "Comparer des critères documentés", en: "Compare documented factors" },
        icon: "destination", callback: handlers.destinationScore },
      { id: "retirement", title: { fr: "Expatriation et retraite", en: "Relocation and retirement" },
        description: { fr: "Préparer un projet de vie", en: "Plan a relocation" },
        icon: "home", callback: handlers.retirement },
      { id: "realEstate", title: { fr: "Immobilier", en: "Real estate" },
        description: { fr: "Contextes locaux disponibles", en: "Available local context" },
        icon: "building", callback: handlers.realEstate },
    ],
    shopping: [],
    follow: [
      { id: "news", title: { fr: "Actualités par pays", en: "Country news" },
        description: { fr: "Choisir un pays et lire les dossiers datés", en: "Choose country and read dated reports" },
        icon: "book", callback: handlers.news },
      { id: "favorites", title: { fr: "Pays suivis", en: "Followed countries" },
        description: { fr: "Retrouver ses favoris enregistrés", en: "Open saved favorite countries" },
        icon: "star", callback: handlers.favorites },
      { id: "alerts", title: { fr: "Alertes existantes", en: "Current alert tools" },
        description: { fr: "Notifications automatiques d'actualités à venir", en: "Automated news notifications planned" },
        icon: "alert", callback: handlers.alerts },
    ],
    professional: [
      { id: "sourcePro", title: { fr: "Répertoire des sources", en: "Source directory" },
        description: { fr: "Documents, droits et méthodes", en: "Documents, rights and methods" },
        icon: "layers", callback: handlers.sources },
    ],
  };
  const group = VISION_SERVICE_GROUPS.find(g => g.id === active) ?? VISION_SERVICE_GROUPS[0];
  const products = VISION_PRODUCTS.filter(p => VISION_SERVICE_GROUP_BY_ID[p.id] === active);
  return <div className="wv3-service-menu" id="whv-tools-menu" role="dialog"
    aria-label={fr ? "Explorer les services World-Vision" : "Browse World-Vision services"}>
    <div className="wv3-service-menu-top">
      <div><strong>{fr ? "Tous les services" : "All services"}</strong>
        <span>{fr ? "Une plateforme, toutes les Visions" : "One platform, all the Visions"}</span></div>
      <button type="button" onClick={onClose} aria-label={fr ? "Fermer les services" : "Close services"}>
        <WorldIcon name="close" size={18}/>
      </button>
    </div>
    <div className="wv3-service-menu-layout">
      <nav className="wv3-service-menu-groups" aria-label={fr ? "Domaines" : "Domains"}>
        {VISION_SERVICE_GROUPS.map(g => <button type="button" key={g.id}
          aria-current={active === g.id ? "true" : undefined}
          className={active === g.id ? "is-selected" : ""}
          onClick={() => setActive(g.id)}>
          <WorldIcon name={g.icon} size={19}/>
          <span>{g.label[language]}</span><WorldIcon name="arrow" size={14}/>
        </button>)}
      </nav>
      <div className="wv3-service-menu-content" key={active}>
        <span className="wv3-eyebrow">{fr ? "VOS POSSIBILITÉS" : "YOUR OPTIONS"}</span>
        <h2>{group.label[language]}</h2>
        <p>{group.summary[language]}</p>
        <div className="wv3-service-menu-actions">
          {actions[active].map(action => <button type="button" key={action.id}
            onClick={action.callback}>
            <WorldIcon name={action.icon} size={17}/>
            <span><strong>{action.title[language]}</strong><small>{action.description[language]}</small></span>
            <WorldIcon name="arrow" size={15}/>
          </button>)}
        </div>
        <div className="wv3-service-menu-product-list">
          {products.map(product => <button key={product.id} type="button"
            onClick={() => onVision(product.id)}>
            <span><strong>{product.name}</strong><small>{product.tagline[language]}</small></span>
            <span>{product.stage === "planned" ? fr ? "En préparation" : "Planned"
              : product.stage === "partial" ? fr ? "Partiel" : "Partial" :
                fr ? "À explorer" : "Explore"}</span>
            <WorldIcon name="arrow" size={15}/>
          </button>)}
          {active === "professional" && <p className="wv3-menu-status">{fr
            ? "La réutilisation et l'export des données dépendent des droits des sources."
            : "Data reuse and export depend on individual source permissions."}</p>}
        </div>
      </div>
    </div>
  </div>;
}
