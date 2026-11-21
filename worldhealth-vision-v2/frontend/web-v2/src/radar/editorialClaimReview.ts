/**
 * World-Vision R2C — cross-article statement review, NOT an automated fact-check.
 *
 * Original sources were consulted via public indexed publisher content on
 * 2026-11-21 (Gabon AGP 25 Sep; IMF official press release 26 Sep; EcoMatin 20 Nov).
 * Search-index access is NOT proof that every full publisher page, correction
 * history or upstream Bloomberg interview was independently retrieved.
 *
 * Claims concern what a named source SAID, not the ultimate truth of the
 * underlying event, accounting number, date or prediction. Summaries are
 * original paraphrases. Do not store copied article text, quotes or images.
 */
import {
  EDITORIAL_GABON_IMF_CASE,
  type EditorialSourceCase,
  type EditorialSourceLink,
} from "./editorialSourceCase";

export type EditorialClaimQuestion =
  | "MISSION_END_DAY"
  | "PROGRAMME_DISCUSSIONS_STAGE"
  | "DECEMBER_STAFF_LEVEL_TARGET"
  | "GOVERNMENT_DEBT_AUDIT_RATIO";
export type EditorialClaimStatus =
  | "POTENTIAL_DATE_DISCREPANCY"
  | "PRIMARY_INSTITUTION_POSITION"
  | "GOVERNMENT_TARGET_VIA_PRESS"
  | "ATTRIBUTED_ESTIMATE_NOT_APPROVED";
export type EditorialEvidencePath =
  | "IMF_ORIGINAL_RELEASE_INDEX"
  | "AGP_GOVERNMENT_COMMUNIQUE_RELAY"
  | "ECOMATIN_CITING_BLOOMBERG";

export interface EditorialClaimEvidence {
  /** Must point to a source in the original dossier, never to a new URL. */
  sourceId: string;
  /** Evidence records only publisher's ATTRIBUTION, not independent fact-check. */
  evidencePath: EditorialEvidencePath;
  reportedValue: { fr: string; en: string };
  meaning: { fr: string; en: string };
  /** No upstream publisher excerpt may be copied into a new premium product. */
  reproducedQuote: false;
  originalPublisherDocumentReviewed: false;
}
export interface EditorialClaimReview {
  id: EditorialClaimQuestion;
  status: EditorialClaimStatus;
  headline: { fr: string; en: string };
  evidence: readonly EditorialClaimEvidence[];
  significance: { fr: string; en: string };
  nextVerification: { fr: string; en: string };
  /** Unequivocally NOT an event or financial figure objectively certified. */
  independentFactCheckComplete: false;
  asOfDay: string;
}

export const GABON_IMF_CLAIMS_R2C: readonly EditorialClaimReview[] = [
  {
    id: "MISSION_END_DAY",
    status: "POTENTIAL_DATE_DISCREPANCY",
    headline: {
      fr: "La date de fin de mission est-elle identique dans les publications ?",
      en: "Do the publications agree on when the mission ended?",
    },
    evidence: [
      {
        sourceId: "agp-20260925",
        evidencePath: "AGP_GOVERNMENT_COMMUNIQUE_RELAY",
        reportedValue: { fr: "19 septembre 2026", en: "19 September 2026" },
        meaning: {
          fr: "L'AGP évoque une mission de deux semaines « achevée le 19 septembre » en relayant un communiqué gouvernemental.",
          en: "AGP, reporting a government communication, describes the two-week mission as ending on 19 September.",
        },
        reproducedQuote: false,
        originalPublisherDocumentReviewed: false,
      },
      {
        sourceId: "imf-20260926",
        evidencePath: "IMF_ORIGINAL_RELEASE_INDEX",
        reportedValue: { fr: "14–25 septembre 2026", en: "14–25 September 2026" },
        meaning: {
          fr: "Le communiqué du FMI date explicitement la visite de son équipe du 14 au 25 septembre.",
          en: "The IMF release expressly dates its team's visit from 14 to 25 September.",
        },
        reproducedQuote: false,
        originalPublisherDocumentReviewed: false,
      },
    ],
    significance: {
      fr: "Écart de chronologie à investiguer, pas une erreur définitivement attribuée : les auteurs peuvent qualifier différemment la visite ou une étape de celle-ci.",
      en: "A timeline discrepancy to investigate, not a conclusively attributed error: the sources may refer to different phases of the visit.",
    },
    nextVerification: {
      fr: "Comparer les communiqués datés, l'ordre du jour du 23 septembre et tout correctif de l'AGP avant de fixer la date comme un fait.",
      en: "Compare dated original statements, the 23 September meeting and any AGP correction before establishing an authoritative date.",
    },
    independentFactCheckComplete: false,
    asOfDay: "2026-11-21",
  },
  {
    id: "PROGRAMME_DISCUSSIONS_STAGE",
    status: "PRIMARY_INSTITUTION_POSITION",
    headline: {
      fr: "Le FMI annonçait-il un programme approuvé fin septembre ?",
      en: "Did the IMF announce an approved programme in September?",
    },
    evidence: [
      {
        sourceId: "imf-20260926",
        evidencePath: "IMF_ORIGINAL_RELEASE_INDEX",
        reportedValue: {
          fr: "Discussions techniques en cours ; préparer d'éventuelles négociations",
          en: "Technical discussions ongoing; prepare for potential programme talks",
        },
        meaning: {
          fr: "Le FMI décrit des échanges budgétaires et sur la dette devant se poursuivre, sans annoncer l'approbation d'un programme.",
          en: "The IMF reports ongoing fiscal and debt talks and does not announce programme approval in that statement.",
        },
        reproducedQuote: false,
        originalPublisherDocumentReviewed: false,
      },
    ],
    significance: {
      fr: "La source primaire permet de distinguer le statut annoncé le 26 septembre de l'interprétation des médias. Elle ne suffit pas à prouver l'absence de toute décision plus récente.",
      en: "The primary source establishes what was announced on 26 September; it cannot rule out later decisions.",
    },
    nextVerification: {
      fr: "Avant d'afficher « programme approuvé », chercher une décision datée du Conseil d'administration du FMI dans ses communiqués et la fiche pays.",
      en: "Before displaying 'approved programme', require a dated IMF Executive Board decision from an official release or country page.",
    },
    independentFactCheckComplete: false,
    asOfDay: "2026-11-21",
  },
  {
    id: "DECEMBER_STAFF_LEVEL_TARGET",
    status: "GOVERNMENT_TARGET_VIA_PRESS",
    headline: {
      fr: "L'accord évoqué pour décembre est-il une décision du FMI ?",
      en: "Is the December agreement a decision by the IMF?",
    },
    evidence: [
      {
        sourceId: "ecomatin-20261120",
        evidencePath: "ECOMATIN_CITING_BLOOMBERG",
        reportedValue: {
          fr: "Objectif gouvernemental : accord au niveau des services en décembre ; examen éventuel en janvier",
          en: "Government target: December staff-level agreement; possible Board consideration in January",
        },
        meaning: {
          fr: "EcoMatin rapporte l'objectif présenté par le ministre Thierry Minko dans un entretien Bloomberg du 19 novembre ; l'interview originale n'a pas été directement contrôlée dans ce dossier.",
          en: "EcoMatin relays Minister Thierry Minko's stated goal from a 19 November Bloomberg interview; that original interview has not been directly reviewed here.",
        },
        reproducedQuote: false,
        originalPublisherDocumentReviewed: false,
      },
    ],
    significance: {
      fr: "Une échéance annoncée par le gouvernement ne constitue ni un accord au niveau des services déjà signé, ni une approbation du Conseil d'administration.",
      en: "A government-stated target is neither a concluded staff-level agreement nor Executive Board approval.",
    },
    nextVerification: {
      fr: "Retrouver l'entretien Bloomberg d'origine (accès/licence), puis un communiqué FMI ultérieur daté confirmant ou infirmant chaque étape.",
      en: "Review the original Bloomberg interview within its access rights, then seek subsequent dated IMF releases confirming or revising each step.",
    },
    independentFactCheckComplete: false,
    asOfDay: "2026-11-21",
  },
  {
    id: "GOVERNMENT_DEBT_AUDIT_RATIO",
    status: "ATTRIBUTED_ESTIMATE_NOT_APPROVED",
    headline: {
      fr: "Le ratio de dette proche de 69 % est-il validé par le FMI ?",
      en: "Has the IMF validated the reported debt ratio near 69%?",
    },
    evidence: [
      {
        sourceId: "ecomatin-20261120",
        evidencePath: "ECOMATIN_CITING_BLOOMBERG",
        reportedValue: {
          fr: "Audit gouvernemental rapporté : environ 69 % du PIB",
          en: "Reported government audit: approximately 69% of GDP",
        },
        meaning: {
          fr: "EcoMatin présente ce ratio comme le résultat d'un audit national et indique expressément que le FMI n'a pas encore validé ses conclusions à la date de l'article.",
          en: "EcoMatin presents the ratio as a national audit finding and reports that the IMF had not validated that audit as of the article date.",
        },
        reproducedQuote: false,
        originalPublisherDocumentReviewed: false,
      },
    ],
    significance: {
      fr: "Ne pas transformer une estimation nationale contestable ou révisable en statistique officielle certifiée par une institution internationale.",
      en: "Do not re-label a revisable national estimate as an internationally certified statistic.",
    },
    nextVerification: {
      fr: "Comparer les documents originaux de l'audit, le périmètre de dette, le dénominateur PIB, les séries du FMI et les révisions avant tout graphique chiffré.",
      en: "Review the original audit, debt perimeter, GDP denominator, IMF statistical series and revisions before publishing quantitative charts.",
    },
    independentFactCheckComplete: false,
    asOfDay: "2026-11-21",
  },
];

const PATH_BY_SOURCE: Record<string, EditorialEvidencePath> = {
  "agp-20260925": "AGP_GOVERNMENT_COMMUNIQUE_RELAY",
  "imf-20260926": "IMF_ORIGINAL_RELEASE_INDEX",
  "ecomatin-20261120": "ECOMATIN_CITING_BLOOMBERG",
};

export function sourceForEvidence(
  evidence: EditorialClaimEvidence,
  dossier: EditorialSourceCase = EDITORIAL_GABON_IMF_CASE,
): EditorialSourceLink | null {
  return dossier.links.find((link) => link.id === evidence.sourceId) ?? null;
}

export function validateEditorialClaimReview(
  items: readonly EditorialClaimReview[],
  dossier: EditorialSourceCase = EDITORIAL_GABON_IMF_CASE,
): boolean {
  if (dossier.claimVerified !== false || dossier.sourceMaterialCopied !== false ||
      dossier.stage !== "TOPIC_TIMELINE_NOT_SAME_EVENT" ||
      items.length < 1 || items.length > 12) return false;
  const claimIds = new Set<string>();
  for (const item of items) {
    if (claimIds.has(item.id) || item.independentFactCheckComplete !== false ||
        item.asOfDay !== dossier.asOfDay || item.evidence.length < 1 ||
        item.evidence.length > 4 || !item.headline.fr || !item.headline.en ||
        !item.significance.fr || !item.significance.en ||
        !item.nextVerification.fr || !item.nextVerification.en) return false;
    claimIds.add(item.id);
    const evidenceIds = new Set<string>();
    for (const evidence of item.evidence) {
      const source = sourceForEvidence(evidence, dossier);
      if (!source || evidenceIds.has(source.id) ||
          PATH_BY_SOURCE[source.id] !== evidence.evidencePath ||
          evidence.reproducedQuote !== false ||
          evidence.originalPublisherDocumentReviewed !== false ||
          source.publishedDay > item.asOfDay ||
          source.publisherFullTextFetched !== false ||
          source.editorialIndependenceVerified !== false ||
          source.sourceStatus !== "LINK_AND_INDEX_EXCERPT_RESEARCHED" ||
          !evidence.reportedValue.fr || !evidence.reportedValue.en ||
          !evidence.meaning.fr || !evidence.meaning.en) return false;
      evidenceIds.add(source.id);
    }
    // Contradiction must visibly retain multiple dated observations.
    if (item.status === "POTENTIAL_DATE_DISCREPANCY" &&
        (item.evidence.length < 2 ||
          new Set(item.evidence.map((e) => e.reportedValue.fr)).size < 2)) return false;
    if (item.status === "PRIMARY_INSTITUTION_POSITION" &&
        !item.evidence.some((e) => e.evidencePath === "IMF_ORIGINAL_RELEASE_INDEX")) return false;
    if (item.status === "GOVERNMENT_TARGET_VIA_PRESS" &&
        !item.evidence.some((e) => e.evidencePath === "ECOMATIN_CITING_BLOOMBERG")) return false;
  }
  return true;
}
