// WorldHealthVision V2 — TravelPanel (écran « bientôt disponible »)
// L'outil sera recentré sur les PRIX DU VOYAGE & TOURISME (vols, hôtels…) avec des
// données réelles et de terrain. Le coût de la vie général est déjà couvert par
// l'outil « Pouvoir d'achat », inutile de le dupliquer ici.
// L'ancienne version (estimation coût de séjour) reste dans l'historique git.

import { useLang } from "../../context/LanguageContext";
import "../../styles/travel.css";

type Props = { onClose: () => void };

export default function TravelPanel({ onClose }: Props) {
  const fr = useLang() === "fr";

  return (
    <div className="tv-panel">
      <div className="tv-header">
        <div className="tv-header-left">
          <span className="tv-header-icon">✈</span>
          <div>
            <h2 className="tv-header-title">{fr ? "Voyage & Tourisme" : "Travel & Tourism"}</h2>
            <p className="tv-header-sub">{fr ? "Bientôt disponible" : "Coming soon"}</p>
          </div>
        </div>
        <button type="button" className="tv-close-btn" onClick={onClose} aria-label="Fermer">✕</button>
      </div>

      <div className="tv-body">
        <div className="tv-hint" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#cfe6fb", margin: 0 }}>
            🚧 {fr ? "Cet outil arrive prochainement." : "This tool is coming soon."}
          </p>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            {fr
              ? "Il sera dédié aux prix réels du voyage et du tourisme — pas au coût de la vie général, qui est déjà couvert par l'outil « Pouvoir d'achat »."
              : "It will focus on real travel & tourism prices — not the general cost of living, which is already covered by the « Purchasing power » tool."}
          </p>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 600, color: "rgba(183,220,245,0.85)" }}>
              {fr ? "Au programme :" : "Planned:"}
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: "rgba(183,220,245,0.82)" }}>
              <li>{fr ? "Prix moyens des vols (aller-retour) vers chaque pays" : "Average flight prices (round-trip) to each country"}</li>
              <li>{fr ? "Prix moyens réels des hôtels sur place, par pays/ville" : "Real average hotel prices on the ground, by country/city"}</li>
              <li>{fr ? "Budget touristique indicatif (hébergement, repas, transport)" : "Indicative tourist budget (lodging, meals, transport)"}</li>
              <li>{fr ? "Meilleures périodes et repères de saisonnalité" : "Best periods and seasonality benchmarks"}</li>
            </ul>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: "rgba(183,220,245,0.6)", lineHeight: 1.6 }}>
            {fr
              ? "Objectif : des données concrètes et de terrain (prix réellement observés), pas seulement des indices macroéconomiques."
              : "Goal: concrete, ground-level data (actually observed prices), not just macroeconomic indices."}
          </p>
        </div>
      </div>
    </div>
  );
}