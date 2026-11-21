import { useState } from "react";
import { useLang } from "../../context/LanguageContext";
import {
  EDITORIAL_GABON_IMF_CASE, validateEditorialSourceCase,
  type EditorialSourceLink,
} from "../../radar/editorialSourceCase";

const phrase = (lang: "fr" | "en", fr: string, en: string) => lang === "fr" ? fr : en;
function roleLabel(link: EditorialSourceLink, lang: "fr" | "en") {
  switch (link.role) {
    case "national_news": return phrase(lang, "Agence nationale gabonaise", "Gabonese national news agency");
    case "international_primary": return phrase(lang, "Institution internationale · source primaire", "International institution · primary source");
    case "regional_business_news": return phrase(lang, "Média économique régional", "Regional business publication");
  }
}
function dependencyLabel(link: EditorialSourceLink, lang: "fr" | "en") {
  switch (link.dependence) {
    case "GOVERNMENT_RELEASE": return phrase(lang, "Relate un communiqué gouvernemental", "Relays government communication");
    case "ORIGINAL_INSTITUTION": return phrase(lang, "Communiqué de l'institution concernée", "Statement by the institution itself");
    case "CITES_OTHER_INTERVIEW": return phrase(lang, "Cite une interview d'un autre média", "Cites an interview from another publisher");
  }
}
function SourceView({ link, lang, chosen, onToggle, disabled }: {
  link: EditorialSourceLink;
  lang: "fr" | "en";
  chosen: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}) {
  return <article className="radar-case-source">
    <p className="radar-case-date">{link.publishedDay} · {roleLabel(link, lang)}</p>
    <h4>{link.outlet}</h4>
    <p>{link.summary[lang]}</p>
    <small>{dependencyLabel(link, lang)}</small>
    <div className="radar-candidate-actions">
      {onToggle && <button type="button" aria-pressed={chosen} disabled={disabled}
        className={chosen ? "radar-pick active" : "radar-pick"} onClick={onToggle}>
        {chosen ? phrase(lang, "Retirer", "Remove") : phrase(lang, "Confronter", "Compare")}
      </button>}
      <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="radar-original">
        {phrase(lang, "Accéder à la source", "Open original source")} ↗
      </a>
    </div>
  </article>;
}
/**
 * One dated human-researched *topic* pilot, NOT an automatic GDELT cluster,
 * claim verification or premium media article reuse.
 */
export default function GlobalRadarEditorialPilot() {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const caseFile = EDITORIAL_GABON_IMF_CASE;
  if (!validateEditorialSourceCase(caseFile)) return null;
  const selected = caseFile.links.filter((link) => chosen.includes(link.id))
    .sort((a, b) => chosen.indexOf(a.id) - chosen.indexOf(b.id));
  function toggle(link: EditorialSourceLink) {
    setChosen((prev) => prev.includes(link.id)
      ? prev.filter((id) => id !== link.id)
      : prev.length < 2 ? [...prev, link.id] : prev);
  }
  return <section className="radar-case" aria-label={phrase(lang,
    "Dossier de recherche de sources, Gabon et FMI", "Source research dossier, Gabon and IMF")}>
    <div className="radar-case-header">
      <div>
        <span className="radar-kicker">{phrase(lang, "EXEMPLE DOCUMENTAIRE RÉEL · GABON", "REAL-SOURCE DOCUMENTARY PILOT · GABON")}</span>
        <h3>{caseFile.question[lang]}</h3>
        <p>{phrase(lang, "Chronologie figée au", "Historical snapshot as of")} {caseFile.asOfDay} —
          {" "}{phrase(lang, "3 sources distinctes, sans validation des faits", "3 distinct sources, no fact verification")}</p>
      </div>
      <button type="button" className="radar-case-toggle"
        aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? phrase(lang, "Réduire le dossier", "Collapse dossier")
          : phrase(lang, "Explorer les trois perspectives", "Explore three perspectives")}
      </button>
    </div>
    {open && <div className="radar-case-body">
      <p className="radar-case-intro">{caseFile.context[lang]}</p>
      <div className="radar-case-source-grid">
        {caseFile.links.map((link) => <SourceView key={link.id} link={link}
          lang={lang} chosen={chosen.includes(link.id)}
          disabled={chosen.length >= 2 && !chosen.includes(link.id)}
          onToggle={() => toggle(link)} />)}
      </div>
      {selected.length === 2 && <section className="radar-case-comparison" aria-label={phrase(lang,
        "Confrontation de deux sources", "Comparison of two sources")}>
        <h4>{phrase(lang, "Deux publications, pas nécessairement deux confirmations",
          "Two publications, not necessarily two confirmations")}</h4>
        <div className="radar-comparison-grid">
          {selected.map((link) => <SourceView key={link.id} link={link} lang={lang} chosen={true} />)}
        </div>
        <p>{phrase(lang,
          "Les documents datent d'étapes différentes et citent parfois d'autres communiqués ou interviews. La différence d'origine ne prouve ni accord des faits ni contradiction. Les textes complets restent à examiner.",
          "These sources cover different stages and may repeat other releases or interviews. Separate outlets prove neither agreement nor contradiction. Full texts still require review.")}</p>
      </section>}
      <div className="radar-case-analysis">
        <strong>{phrase(lang, "Question de vérification : quel statut est réellement démontré ?",
          "Verification question: which procedural stage is actually evidenced?")}</strong>
        <p>{caseFile.editorialConclusion[lang]}</p>
      </div>
      <p className="radar-case-warning">{phrase(lang,
        "Contexte de recherche issu de liens et d'extraits publics indexés le 21 novembre 2026. Ce dossier n'est ni une revue intégrale des articles, ni une décision du FMI, ni une mise à jour automatique. Les résumés sont des reformulations originales ; ouvrez les sources, leurs versions et leurs éventuelles corrections avant toute publication journalistique.",
        "Research context uses public indexed links and excerpts checked on 21 November 2026. This is neither a full-text review, nor an IMF decision, nor an automated update. Summaries are original paraphrases; consult the original documents and revisions before journalism/publication.")}</p>
    </div>}
  </section>;
}
