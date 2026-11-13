// WorldHealthVision V2 — AlertsPanel (écran « bientôt disponible »)
// L'outil Alertes sera redéployé proprement : seuils sur indicateurs + suivi,
// pour les analystes économiques ET les particuliers. L'ancienne implémentation
// (seuils localStorage) reste dans l'historique git ; aucune logique backend
// n'est supprimée (les alertes s'appuieront sur les endpoints existants).

import { useLang } from "../../context/LanguageContext";
import {WorldIcon} from "../ui/WorldIcon";
import "../../styles/alerts.css";

type Props = { onClose: () => void };

export default function AlertsPanel({ onClose }: Props) {
  const fr = useLang() === "fr";

  return (
    <div className="al-panel">
      <div className="al-header">
        <div className="al-header-left">
          <span className="al-header-icon"><WorldIcon name="alert" size={23}/></span>
          <div>
            <h2 className="al-title">{fr ? "Alertes" : "Alerts"}</h2>
            <p className="al-subtitle">{fr ? "Bientôt disponible" : "Coming soon"}</p>
          </div>
        </div>
        <button type="button" className="al-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="al-body">
        <div className="al-empty" style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#cfe6fb", margin: 0 }}>
            <WorldIcon name="info" size={18}/> {fr ? "Cet outil arrive prochainement." : "This tool is coming soon."}
          </p>
          <p style={{ margin: 0, lineHeight: 1.6, color: "rgba(183,220,245,0.82)" }}>
            {fr
              ? "Les alertes vous permettront de définir des seuils sur les indicateurs (inflation, risque/sécurité, dette, coût de la vie, change…) et d'être prévenu dès qu'un pays franchit ces seuils."
              : "Alerts will let you set thresholds on indicators (inflation, risk/safety, debt, cost of living, FX…) and be notified as soon as a country crosses them."}
          </p>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 600, color: "rgba(183,220,245,0.85)" }}>
              {fr ? "Pour qui :" : "For whom:"}
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: "rgba(183,220,245,0.82)" }}>
              <li>{fr ? "Analystes économiques : surveiller des pays et signaux macro à grande échelle." : "Economic analysts: monitor countries and macro signals at scale."}</li>
              <li>{fr ? "Particuliers : suivre une destination (expatriation, voyage, investissement)." : "Individuals: track a destination (relocation, travel, investment)."}</li>
            </ul>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: "rgba(183,220,245,0.6)", lineHeight: 1.6 }}>
            {fr
              ? "Objectif : un suivi fiable et transparent, basé sur les mêmes sources multi-référentielles que le reste de la plateforme."
              : "Goal: reliable, transparent monitoring built on the same multi-source data as the rest of the platform."}
          </p>
        </div>
      </div>
    </div>
  );
}