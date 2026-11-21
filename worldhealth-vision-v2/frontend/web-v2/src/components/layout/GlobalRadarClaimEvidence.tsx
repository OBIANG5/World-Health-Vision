import { useState } from "react";
import { useLang } from "../../context/LanguageContext";
import {
  GABON_IMF_CLAIMS_R2C,
  sourceForEvidence,
  validateEditorialClaimReview,
  type EditorialClaimReview,
  type EditorialClaimStatus,
} from "../../radar/editorialClaimReview";

const phrase = (lang: "fr" | "en", fr: string, en: string) => lang === "fr" ? fr : en;
function statusLabel(status: EditorialClaimStatus, lang: "fr" | "en") {
  switch (status) {
    case "POTENTIAL_DATE_DISCREPANCY":
      return phrase(lang, "Dates différentes dans les sources", "Different dates in published sources");
    case "PRIMARY_INSTITUTION_POSITION":
      return phrase(lang, "Position exprimée par l'institution", "Position stated by the institution");
    case "GOVERNMENT_TARGET_VIA_PRESS":
      return phrase(lang, "Objectif rapporté, pas une décision", "Reported target, not a decision");
    case "ATTRIBUTED_ESTIMATE_NOT_APPROVED":
      return phrase(lang, "Estimation attribuée, pas certifiée", "Attributed estimate, not certified");
  }
}
function ClaimDetail({ claim, lang }: {
  claim: EditorialClaimReview;
  lang: "fr" | "en";
}) {
  return <div className="radar-claim-details">
    <div className="radar-claim-evidence-list">
      {claim.evidence.map((item) => {
        const source = sourceForEvidence(item);
        if (!source) return null;
        return <article className="radar-claim-evidence" key={item.sourceId}>
          <div className="radar-claim-evidence-top">
            <strong>{source.outlet}</strong>
            <span>{source.publishedDay}</span>
          </div>
          <p className="radar-claim-reported">{item.reportedValue[lang]}</p>
          <p>{item.meaning[lang]}</p>
          <a href={source.originalUrl} target="_blank" rel="noopener noreferrer">
            {phrase(lang, "Consulter la publication source", "Read the source publication")} ↗
          </a>
        </article>;
      })}
    </div>
    <div className="radar-claim-interpretation">
      <strong>{phrase(lang, "Ce que l'on peut en conclure", "What the evidence supports")}</strong>
      <p>{claim.significance[lang]}</p>
    </div>
    <div className="radar-claim-todo">
      <strong>{phrase(lang, "Vérification encore nécessaire", "Further verification required")}</strong>
      <p>{claim.nextVerification[lang]}</p>
    </div>
  </div>;
}

/**
 * One reusable pattern: named claim, attributed source statements,
 * important limits, original links and next verification.
 *
 * It intentionally renders no arbitrary HTML, automatic summary of an
 * unseen source, trading instruction or falsely independent corroboration.
 */
export default function GlobalRadarClaimEvidence() {
  const lang = useLang();
  const [openedId, setOpenedId] = useState<string | null>("MISSION_END_DAY");
  if (!validateEditorialClaimReview(GABON_IMF_CLAIMS_R2C)) return null;
  return <section className="radar-claims" aria-label={phrase(lang,
    "Questions, preuves et désaccords documentaires", "Questions, evidence and source disagreements")}>
    <div className="radar-claims-header">
      <span className="radar-kicker">{phrase(lang,
        "CONFRONTATION DES AFFIRMATIONS", "COMPARE ATTRIBUTED CLAIMS")}</span>
      <h4>{phrase(lang,
        "Quatre questions concrètes, et ce qui reste à vérifier",
        "Four concrete questions, and what remains unverified")}</h4>
      <p>{phrase(lang,
        "Une déclaration du FMI, un article local relayant un communiqué, et une interview citée par un tiers n'ont pas la même force probante. Chaque observation est attribuée à sa source, datée et associée à ses limites.",
        "An IMF statement, local reporting of a government communication, and a secondhand interview carry different evidential weight. Each observation is dated, attributed and shown with its limitations.")}</p>
    </div>
    <div className="radar-claims-list">
      {GABON_IMF_CLAIMS_R2C.map((claim) => {
        const expanded = claim.id === openedId;
        return <section className="radar-claim" key={claim.id} data-claim-id={claim.id}>
          <button type="button" aria-expanded={expanded}
            aria-controls={"radar-claim-detail-" + claim.id}
            className={expanded ? "radar-claim-trigger active" : "radar-claim-trigger"}
            onClick={() => setOpenedId(expanded ? null : claim.id)}>
            <span className="radar-claim-title">{claim.headline[lang]}</span>
            <span className="radar-claim-status">{statusLabel(claim.status, lang)}</span>
            <span className="radar-claim-chevron" aria-hidden="true">{expanded ? "−" : "+"}</span>
          </button>
          {expanded && <div id={"radar-claim-detail-" + claim.id}>
            <ClaimDetail claim={claim} lang={lang} />
          </div>}
        </section>;
      })}
    </div>
    <p className="radar-claim-disclosure">{phrase(lang,
      "Dossier historique au 21/11/2026. Les pages et extraits publics indexés ont été consultés pour documenter les déclarations ; ni les archives intégrales, ni toutes les corrections, ni l'entretien Bloomberg d'origine ne sont certifiés. Les citations sont des reformulations originales. Aucun événement, ratio de dette ou accord FMI n'est automatiquement validé.",
      "Historical research as at 21 Nov 2026. Public indexed publisher text and excerpts were consulted to attribute statements; complete archives, every correction and the original Bloomberg interview remain unverified. Descriptions are original paraphrases. No underlying event, debt ratio or IMF programme is automatically certified.")}</p>
  </section>;
}
