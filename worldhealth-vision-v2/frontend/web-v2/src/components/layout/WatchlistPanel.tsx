// WorldHealthVision V2 — WatchlistPanel
// Panneau latéral affichant la liste des pays étoilés (watchlist).
// Accessible depuis le bouton "Favoris" dans la nav principale.
// Chaque entrée permet d'ouvrir directement la fiche pays du pays.

import type { CountrySummary } from "../../api/types";
import { useLang } from "../../context/LanguageContext";import {WorldIcon} from "../ui/WorldIcon";


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countryFlag(iso2?: string | null): string {
  if (!iso2 || iso2.length !== 2) return "—";
  const base = 0x1f1e6;
  const A = 65;
  const up = iso2.toUpperCase();
  return (
    String.fromCodePoint(up.charCodeAt(0) - A + base) +
    String.fromCodePoint(up.charCodeAt(1) - A + base)
  );
}

// ---------------------------------------------------------------------------
// Labels bilingues
// ---------------------------------------------------------------------------

const L = {
  fr: {
    title: "Favoris",
    subtitle: "Pays que vous suivez",
    empty: "Aucun pays en favori.",
    emptyHint: "Cliquez sur l'étoile ★ dans la fiche d'un pays pour l'ajouter.",
    voir: "Voir la fiche",
    retirer: "Retirer",
  },
  en: {
    title: "Watchlist",
    subtitle: "Countries you are following",
    empty: "No countries in watchlist.",
    emptyHint: "Click the ★ star in any country sheet to add it.",
    voir: "Open sheet",
    retirer: "Remove",
  },
} as const;

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

type Props = {
  watchedIso3s: Set<string>;
  countries: CountrySummary[];
  onOpenCountry: (iso3: string) => void;
  onRemove: (iso3: string) => void;
  onClose: () => void;
};

export default function WatchlistPanel({
  watchedIso3s,
  countries,
  onOpenCountry,
  onRemove,
  onClose,
}: Props) {
  const lang = useLang();
  const l = L[lang];

  // Résoudre les pays étoilés à partir du catalogue
  const watchedCountries = [...watchedIso3s]
    .map((iso3) => countries.find((c) => c.iso3 === iso3))
    .filter((c): c is CountrySummary => c !== undefined);

  // Pays étoilés mais pas encore dans le catalogue (sera affiché avec ISO3 brut)
  const unknownIso3s = [...watchedIso3s].filter(
    (iso3) => !countries.some((c) => c.iso3 === iso3),
  );

  return (
    <div className="watchlist-panel">
      {/* En-tête */}
      <div className="watchlist-panel-header">
        <div>
          <h3 className="watchlist-panel-title">
            <span className="watchlist-star-icon">★</span>
            {l.title}
          </h3>
          <p className="watchlist-panel-subtitle">{l.subtitle}</p>
        </div>
        <button
          type="button"
          className="watchlist-panel-close"
          onClick={onClose}
          aria-label="Fermer le panel watchlist"
        >
          ✕
        </button>
      </div>

      {/* Corps */}
      <div className="watchlist-panel-body">
        {watchedIso3s.size === 0 && (
          <div className="watchlist-empty">
            <p className="watchlist-empty-text">{l.empty}</p>
            <p className="watchlist-empty-hint">{l.emptyHint}</p>
          </div>
        )}

        {watchedCountries.map((country) => (
          <div key={country.iso3} className="watchlist-item">
            <span className="watchlist-item-flag">
              {countryFlag(country.iso2)}
            </span>
            <span className="watchlist-item-name">{country.displayName}</span>
            {country.currencyCode && (
              <span className="watchlist-item-currency">{country.currencyCode}</span>
            )}
            <div className="watchlist-item-actions">
              <button
                type="button"
                className="watchlist-item-btn watchlist-item-btn--open"
                onClick={() => {
                  onOpenCountry(country.iso3);
                  onClose();
                }}
              >
                {l.voir} →
              </button>
              <button
                type="button"
                className="watchlist-item-btn watchlist-item-btn--remove"
                onClick={() => onRemove(country.iso3)}
                aria-label={`Retirer ${country.displayName} des favoris`}
              >
                {l.retirer}
              </button>
            </div>
          </div>
        ))}

        {/* Pays étoilés dont l'ISO3 n'est pas encore dans le catalogue */}
        {unknownIso3s.map((iso3) => (
          <div key={iso3} className="watchlist-item watchlist-item--unknown">
            <span className="watchlist-item-flag"><WorldIcon name="globe" size={19}/></span>
            <span className="watchlist-item-name" style={{ opacity: 0.55 }}>{iso3}</span>
            <div className="watchlist-item-actions">
              <button
                type="button"
                className="watchlist-item-btn watchlist-item-btn--remove"
                onClick={() => onRemove(iso3)}
              >
                {l.retirer}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}