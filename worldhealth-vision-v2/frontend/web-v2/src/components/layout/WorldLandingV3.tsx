/**
 * World-Vision Atlas home — geographical entry point and genuine Vision directory.
 * The real interactive Earth is rendered independently by EyeMapFrame.
 */
import { useState } from "react";
import { VISION_PRODUCTS, type VisionId } from "../../product/visionProducts";
import { VISION_SERVICE_GROUPS, VISION_SERVICE_GROUP_BY_ID, type CountryDirectoryGroup } from "../../product/visionNavigation";
import { WorldIcon } from "../ui/WorldIcon";

export default function WorldLandingV3({
  language, countriesCount, onSearch, onCompare, onMoney, onTravel,
  onVision, onOpenCountry, onSources,
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
  const group = VISION_SERVICE_GROUPS.find(item => item.id === active) ?? VISION_SERVICE_GROUPS[0];
  const products = VISION_PRODUCTS.filter(item => VISION_SERVICE_GROUP_BY_ID[item.id] === active);
  return (
    <main className="wv3-home wv5-home" aria-label={fr ? "Atlas World-Vision" : "World-Vision Atlas"}>
      <section className="wv5-hero" aria-labelledby="wv5-home-title">
        <div className="wv3-home-intro wv5-intro">
          <span className="wv5-kicker">{fr ? "ATLAS MONDIAL" : "WORLD ATLAS"}</span>
          <h2 id="wv5-home-title" className="wv5-home-title">
            {fr ? "Explorer le monde." : "Explore the world."}
          </h2>
          <p className="wv5-home-description">
            {fr
              ? "Voir le monde, le comprendre. Explorez un pays, ses données, ses sources et les services disponibles."
              : "See the world, understand it. Explore a country, its data, original sources and available services."}
          </p>
          <button type="button" className="wv3-home-search wv5-search" onClick={onSearch}>
            <WorldIcon name="search" size={20}/>
            <span>{fr ? "Rechercher un pays ou une région" : "Find a country or region"}</span>
            <span className="wv3-search-shortcut" aria-hidden="true">⌘ K</span>
          </button>
        </div>
        <div className="wv5-earth-space" aria-hidden="true"/>
        <div className="wv5-globe-caption">
          <span>{fr ? "Tournez le globe, choisissez un pays." : "Rotate the globe, choose a country."}</span>
          <a href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/"
            target="_blank" rel="noopener noreferrer">
            {fr ? "Imagerie d’archive" : "Archive imagery"}
          </a>
        </div>
        <nav className="wv3-home-quick wv5-quick" aria-label={fr ? "Accès directs" : "Quick actions"}>
          <button type="button" onClick={onOpenCountry}>
            <WorldIcon name="map" size={18}/>{fr ? "Fiche pays" : "Country profile"}
            <WorldIcon name="arrow" size={15}/>
          </button>
          <button type="button" onClick={onCompare}>
            <WorldIcon name="scale" size={18}/>{fr ? "Comparer" : "Compare"}
            <WorldIcon name="arrow" size={15}/>
          </button>
          <button type="button" onClick={onMoney}>
            <WorldIcon name="currency" size={18}/>{fr ? "Monnaie" : "Currency"}
            <WorldIcon name="arrow" size={15}/>
          </button>
          <button type="button" onClick={onTravel}>
            <WorldIcon name="travel" size={18}/>{fr ? "Voyager" : "Travel"}
            <WorldIcon name="arrow" size={15}/>
          </button>
        </nav>
      </section>
      <section className="wv3-home-discovery wv5-directory" aria-label={fr ? "Tous les services" : "All services"}>
        <header className="wv3-home-directory-header wv5-directory-header">
          <div>
            <span className="wv5-kicker">{fr ? "UN MONDE · PLUSIEURS VISIONS" : "ONE WORLD · MANY VISIONS"}</span>
            <h3>{fr ? "Que souhaitez-vous faire ?" : "What would you like to do?"}</h3>
          </div>
          <p>{fr
            ? "Choisissez un besoin. Les fonctionnalités disponibles et celles en préparation sont distinguées."
            : "Choose a goal. Available and upcoming features are clearly distinguished."}</p>
        </header>
        <div className="wv3-home-directory-grid wv5-directory-layout">
          <nav className="wv3-home-tasks wv5-tasks" aria-label={fr ? "Besoins" : "Goals"}>
            {VISION_SERVICE_GROUPS.map((item, index) => (
              <button type="button" key={item.id}
                className={active === item.id ? "is-selected" : ""}
                aria-pressed={active === item.id}
                onClick={() => setActive(item.id)}>
                <span className="wv5-task-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="wv5-task-label">{item.label[language]}</span>
                <WorldIcon name="arrow" size={17}/>
              </button>
            ))}
          </nav>
          <div className="wv3-home-task-result wv5-task-result" key={active}>
            <span className="wv5-kicker">{fr ? "OUTILS ET SERVICES" : "TOOLS AND SERVICES"}</span>
            <h4>{group.label[language]}</h4>
            <p>{group.summary[language]}</p>
            <div className="wv5-products">
              {products.map(product => (
                <button type="button" key={product.id} onClick={() => onVision(product.id)}>
                  <span className="wv5-product-label">
                    <strong>{product.name}</strong>
                    <small>{product.tagline[language]}</small>
                  </span>
                  <span className="wv5-product-state">{product.stage === "planned"
                    ? (fr ? "En préparation" : "Planned")
                    : product.stage === "partial" ? (fr ? "Partiel" : "Partial")
                      : (fr ? "À explorer" : "Explore")}</span>
                  <WorldIcon name="arrow" size={17}/>
                </button>
              ))}
              {active === "professional" && (
                <button type="button" onClick={onSources}>
                  <span className="wv5-product-label">
                    <strong>{fr ? "Sources et méthodes" : "Sources and methods"}</strong>
                    <small>{fr ? "Provenance et droits des données" : "Data provenance and rights"}</small>
                  </span>
                  <WorldIcon name="arrow" size={17}/>
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="wv5-directory-note">
          {fr ? "Répertoire géographique : " : "Geographic directory: "}
          {countriesCount}
          {fr
            ? " économies et territoires. Toutes les statistiques ne sont pas encore vérifiées."
            : " economies and territories. Not all observations are verified."}
        </p>
      </section>
    </main>
  );
}
