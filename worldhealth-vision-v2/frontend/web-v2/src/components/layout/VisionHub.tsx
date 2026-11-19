import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WorldIcon, type WorldIconName } from "../ui/WorldIcon";
import {
  VISION_FAMILIES,
  VISION_PRODUCTS,
  type VisionAction,
  type VisionFamily,
  type VisionId,
  type VisionProduct,
} from "../../product/visionProducts";

type Locale = "fr" | "en";
type FamilyFilter = "all" | VisionFamily;

interface Props {
  open: boolean;
  language: Locale;
  onClose: () => void;
  onAction: (action: VisionAction) => void;
}

const icons: Record<VisionId, WorldIconName> = {
  atlas: "globe",
  watch: "alert",
  money: "currency",
  transport: "travel",
  tourism: "compass",
  price: "markets",
  basket: "scale",
  trading: "markets",
  brvm: "markets",
  radar: "search",
  media: "book",
};

function statusLabel(product: VisionProduct, language: Locale) {
  if (product.stage === "explorable") {
    return language === "fr" ? "Explorable · couverture variable" : "Explorable · coverage varies";
  }
  if (product.stage === "partial") {
    return language === "fr" ? "Outils partiels existants" : "Existing partial tools";
  }
  return language === "fr" ? "Fonctionnalité prévue" : "Planned capability";
}

/**
 * A real, navigable international product directory—not a collection of
 * dead links. Non-connected products open an honest capability detail.
 */
export default function VisionHub({ open, language, onClose, onAction }: Props) {
  const [family, setFamily] = useState<FamilyFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<VisionId>("atlas");
  const panelRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLElement>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(language === "fr" ? "fr" : "en");
    return VISION_PRODUCTS.filter((product) => {
      if (family !== "all" && product.family !== family) return false;
      if (!needle) return true;
      return [
        product.name, product.tagline[language], product.description[language],
        product.objective[language],
      ].some((value) => value.toLocaleLowerCase(language === "fr" ? "fr" : "en").includes(needle));
    });
  }, [family, language, query]);

  const selected = visible.find((product) => product.id === selectedId)
    ?? visible[0]
    ?? VISION_PRODUCTS.find((product) => product.id === selectedId)
    ?? VISION_PRODUCTS[0];

  function chooseProduct(id: VisionId) {
    setSelectedId(id);
    if (window.matchMedia("(max-width: 760px)").matches) {
      window.requestAnimationFrame(() => detailRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "start",
      }));
    }
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const controls = [...panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]',
      )].filter((node) => node.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  const goToSelected = () => {
    if (selected.action) onAction(selected.action);
  };

  return createPortal(
    <div className="vision-hub-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="vision-hub" role="dialog" aria-modal="true"
        aria-label={language === "fr" ? "Les univers World-Vision" : "World-Vision products"}
        ref={panelRef} tabIndex={-1}
      >
        <header className="vision-hub-header">
          <div className="vision-hub-title">
            <span className="vision-hub-kicker">WORLD-VISION · {language === "fr" ? "ÉCOSYSTÈME" : "ECOSYSTEM"}</span>
            <h2>{language === "fr" ? "Un monde. Plusieurs Visions." : "One world. Many Visions."}</h2>
            <p>{language === "fr"
              ? "Explorez les outils existants et les prochaines capacités. Leur maturité est affichée sans ambiguïté."
              : "Explore existing tools and planned capabilities. Each product's readiness is shown clearly."}</p>
          </div>
          <button type="button" className="vision-hub-close" onClick={onClose}
            aria-label={language === "fr" ? "Fermer les univers" : "Close ecosystem"}>
            <WorldIcon name="close" size={19}/>
          </button>
        </header>

        <div className="vision-hub-toolbar">
          <label className="vision-hub-search">
            <WorldIcon name="search" size={18}/>
            <span className="vision-visually-hidden">{language === "fr" ? "Rechercher un outil" : "Search for a product"}</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder={language === "fr" ? "Rechercher une Vision, un besoin..." : "Search a Vision or a goal..."}/>
          </label>
          <div className="vision-hub-filters" role="group"
            aria-label={language === "fr" ? "Filtrer les univers" : "Filter products"}>
            {VISION_FAMILIES.map(({ id, title }) => (
              <button key={id} type="button" onClick={() => {
                setFamily(id);
                const next = VISION_PRODUCTS.find((product) => id === "all" || product.family === id);
                if (next) setSelectedId(next.id);
              }}
                aria-pressed={family === id}
                className={family === id ? "vision-filter active" : "vision-filter"}>
                {title[language]}
              </button>
            ))}
          </div>
        </div>

        <div className="vision-hub-body">
          <div className="vision-hub-results" aria-label={language === "fr" ? "Plateformes" : "Products"}>
            <p className="vision-hub-count">
              {visible.length} {language === "fr" ? "univers dans cette sélection" : "products in this selection"}
            </p>
            <div className="vision-hub-grid">
              {visible.map((product) => (
                <button key={product.id} type="button"
                  onClick={() => chooseProduct(product.id)}
                  aria-pressed={selected.id === product.id}
                  className={selected.id === product.id ? "vision-product active" : "vision-product"}>
                  <span className="vision-product-head">
                    <span className="vision-product-icon"><WorldIcon name={icons[product.id]} size={21}/></span>
                    <span className={"vision-product-stage stage-" + product.stage}>
                      {statusLabel(product, language)}
                    </span>
                  </span>
                  <strong>{product.name}</strong>
                  <span className="vision-product-tagline">{product.tagline[language]}</span>
                  <span className="vision-product-disclosure">
                    {language === "fr" ? "Découvrir le périmètre" : "Explore scope"}
                    <WorldIcon name="arrow" size={14}/>
                  </span>
                </button>
              ))}
            </div>
            {visible.length === 0 && (
              <p className="vision-hub-empty">
                {language === "fr" ? "Aucun univers ne correspond à cette recherche." : "No product matches this search."}
              </p>
            )}
          </div>

          <aside className="vision-hub-detail" aria-live="polite" ref={detailRef}>
            <span className="vision-hub-detail-kicker">{language === "fr" ? "FICHE PRODUIT" : "PRODUCT BRIEF"}</span>
            <h3>{selected.name}</h3>
            <p className={"vision-detail-stage stage-" + selected.stage}>{statusLabel(selected, language)}</p>
            <p>{selected.description[language]}</p>
            <h4>{language === "fr" ? "Ce que nous voulons construire" : "What we intend to build"}</h4>
            <p>{selected.objective[language]}</p>
            <div className="vision-detail-trust">
              <WorldIcon name="info" size={18}/>
              <span>{selected.caveat[language]}</span>
            </div>
            {selected.action && (
              <button type="button" className="vision-detail-action" onClick={goToSelected}>
                {selected.actionLabel?.[language] ?? (language === "fr" ? "Ouvrir l'outil" : "Open tool")}
                <WorldIcon name="arrow" size={17}/>
              </button>
            )}
            {!selected.action && (
              <p className="vision-detail-future">
                {language === "fr"
                  ? "Parcours non publié : nous construirons l'outil complet avec ses sources et ses tests avant toute ouverture."
                  : "This workflow is not published. It will open only after its sources and end-to-end tests are ready."}
              </p>
            )}
          </aside>
        </div>
        <footer className="vision-hub-footer">
          <WorldIcon name="shield" size={15}/>
          <span>{language === "fr"
            ? "Un catalogue n'est pas une donnée collectée. Un prototype n'est pas un service opérationnel."
            : "A catalog is not ingested data. A prototype is not an operating service."}</span>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
