/**
 * WORLD-VISION V3 / one honest world home, not six duplicated category cards.
 * The actual GlobeMap in EyeMapFrame is rendered independently beside this
 * content; we never replace it with a static photograph here.
 */
import { useState } from "react";
import { VISION_PRODUCTS, type VisionId } from "../../product/visionProducts";
import { VISION_SERVICE_GROUPS, VISION_SERVICE_GROUP_BY_ID, type CountryDirectoryGroup } from "../../product/visionNavigation";
import { WorldIcon } from "../ui/WorldIcon";

export default function WorldLandingV3({
  language, countriesCount, onSearch, onCompare, onMoney,
  onTravel, onVision, onOpenCountry, onSources,
}: {
  language: "fr" | "en";
  countriesCount: number;
  onSearch: () => void;
  onCompare: () => void;
  onMoney: () => void;
  onTravel: () => void;
  onVision: (id: VisionId) => void;
  onOpenCountry: () => void;
  onSources: () => void;
}) {
  const fr = language === "fr";
  const [active, setActive] = useState<CountryDirectoryGroup>("understand");
  const group = VISION_SERVICE_GROUPS.find(g => g.id === active) ?? VISION_SERVICE_GROUPS[0];
  const products = VISION_PRODUCTS.filter(p => VISION_SERVICE_GROUP_BY_ID[p.id] === active);
  return <div className="wv3-home" aria-label={fr ? "Découvrir World-Vision" : "Discover World-Vision"}>
    <section className="wv3-home-intro">
      <span className="wv3-eyebrow">WORLD-VISION / ATLAS</span>
      <h2>{fr ? "Voir le monde,\nle comprendre." : "See the world,\nunderstand it."}</h2>
      <p>{fr
        ? "Explorez un territoire, comprenez ses données, confrontez ses sources et accédez aux outils qui servent vos décisions."
        : "Explore a place, understand its data, compare its sources, and access tools for better decisions."}</p>
      <button type="button" className="wv3-home-search" onClick={onSearch}>
        <WorldIcon name="search" size={19}/>
        <span>{fr ? "Pays, région, donnée ou service…" : "Country, region, data or service…"}</span>
        <span className="wv3-search-shortcut">⌘ K</span>
      </button>
      <div className="wv3-home-quick" aria-label={fr ? "Actions fréquentes" : "Frequent actions"}>
        <button type="button" onClick={onOpenCountry}><WorldIcon name="map" size={17}/>{fr ? "Fiche pays" : "Country"}</button>
        <button type="button" onClick={onCompare}><WorldIcon name="scale" size={17}/>{fr ? "Comparer" : "Compare"}</button>
        <button type="button" onClick={onMoney}><WorldIcon name="currency" size={17}/>{fr ? "Monnaie" : "Currency"}</button>
        <button type="button" onClick={onTravel}><WorldIcon name="travel" size={17}/>{fr ? "Voyager" : "Travel"}</button>
      </div>
      <p className="wv3-home-disclosure">{fr
        ? `Répertoire géographique : ${countriesCount} économies et territoires. Cela ne signifie pas que toutes les données statistiques sont vérifiées.`
        : `Geographic directory: ${countriesCount} economies and territories. Not all statistical observations are verified.`}</p>
    </section>
    <section className="wv3-home-discovery" aria-label={fr ? "Explorer les services" : "Explore services"}>
      <div className="wv3-home-directory-header">
        <div>
          <span className="wv3-eyebrow">{fr ? "PLUSIEURS VISIONS, UNE PLATEFORME" : "MANY VISIONS, ONE PLATFORM"}</span>
          <h3>{fr ? "Que voulez-vous faire ?" : "What would you like to do?"}</h3>
        </div>
        <p>{fr ? "Choisissez un besoin, puis une Vision. Les services en préparation sont clairement signalés."
          : "Choose a task, then a Vision. Planned capabilities are clearly identified."}</p>
      </div>
      <div className="wv3-home-directory-grid">
        <nav className="wv3-home-tasks" aria-label={fr ? "Besoins" : "Tasks"}>
          {VISION_SERVICE_GROUPS.map(g => <button type="button" key={g.id}
            className={active === g.id ? "is-selected" : ""}
            aria-current={active === g.id ? "true" : undefined}
            onClick={() => setActive(g.id)}>
            <WorldIcon name={g.icon} size={19}/><span>{g.label[language]}</span>
            <WorldIcon name="arrow" size={15}/>
          </button>)}
        </nav>
        <div className="wv3-home-task-result" key={active}>
          <h4>{group.label[language]}</h4>
          <p>{group.summary[language]}</p>
          <div>
            {products.map(product => <button type="button" key={product.id} onClick={() => onVision(product.id)}>
              <span><strong>{product.name}</strong><small>{product.tagline[language]}</small></span>
              <span>{product.stage === "planned" ?
                (fr ? "En préparation" : "Planned") : product.stage === "partial" ?
                  (fr ? "Partiel" : "Partial") : (fr ? "À explorer" : "Explore")}</span>
              <WorldIcon name="arrow" size={16}/>
            </button>)}
            {active === "professional" && <button type="button" onClick={onSources}>
              <span><strong>{fr ? "Sources et méthodes" : "Sources and methods"}</strong>
                <small>{fr ? "Provenance et droits des données" : "Evidence and data rights"}</small></span>
              <WorldIcon name="arrow" size={16}/>
            </button>}
          </div>
        </div>
      </div>
    </section>
  </div>;
}
