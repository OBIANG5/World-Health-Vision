/**
 * WORLD-VISION editorial methods R2B: a dated, genuinely sourced TOPIC dossier.
 *
 * NOT a parsed GDELT cluster. NOT a verified fact-check. These source URLs,
 * dates and source-description paraphrases were individually checked against
 * public search-index summaries on 2026-11-21. The FULL original article
 * content has not been independently fetched, so claim status stays
 * DOCUMENT_LINK_RESEARCHED / ORIGINAL_TEXT_REVIEW_PENDING.
 * Local/national/international are publisher roles, not scores of truth.
 */
export type SourcePerspective = "national_news" | "international_primary" | "regional_business_news";
export type SourceDependence = "GOVERNMENT_RELEASE" | "ORIGINAL_INSTITUTION" | "CITES_OTHER_INTERVIEW";
export interface EditorialSourceLink {
  id: string;
  outlet: string;
  role: SourcePerspective;
  publishedDay: string;
  originalUrl: string;
  dependence: SourceDependence;
  summary: { fr: string; en: string };
  editorialIndependenceVerified: false;
  publisherFullTextFetched: false;
  sourceStatus: "LINK_AND_INDEX_EXCERPT_RESEARCHED";
}
export interface EditorialSourceCase {
  id: string;
  countryIso3: "GAB";
  asOfDay: string;
  question: { fr: string; en: string };
  context: { fr: string; en: string };
  editorialConclusion: { fr: string; en: string };
  claimVerified: false;
  sourceMaterialCopied: false;
  stage: "TOPIC_TIMELINE_NOT_SAME_EVENT";
  links: readonly EditorialSourceLink[];
}
export const EDITORIAL_GABON_IMF_CASE: EditorialSourceCase = {
  id: "gabon-imf-dialogue-2026-11-21",
  countryIso3: "GAB",
  asOfDay: "2026-11-21",
  question: {
    fr: "Gabon et FMI : où en sont les discussions sur un éventuel programme ?",
    en: "Gabon and the IMF: what stage have discussions reached?",
  },
  context: {
    fr: "Trois dates, trois origines éditoriales. Dossier thématique daté, constitué à partir de liens et d'extraits publics indexés : les articles complets et les éventuelles corrections doivent encore être examinés.",
    en: "Three dates, three editorial origins. Dated topic dossier sourced from public indexed links and excerpts: full article texts and any corrections remain to be checked.",
  },
  editorialConclusion: {
    fr: "Une visite technique, une intention de négocier et un objectif d'accord futur ne sont pas équivalents à une approbation du FMI. Ces documents ne suffisent pas à attester qu'un programme était formellement approuvé au 21 novembre 2026. Cette limite n'affirme pas qu'aucune décision ultérieure n'existe.",
    en: "A technical visit, an intention to negotiate and a future agreement target are not the same as IMF approval. These materials do not establish a formally approved programme as at 21 November 2026, nor rule out later decisions.",
  },
  claimVerified: false,
  sourceMaterialCopied: false,
  stage: "TOPIC_TIMELINE_NOT_SAME_EVENT",
  links: [
    {
      id: "agp-20260925",
      outlet: "AGP — Agence Gabonaise de Presse",
      role: "national_news",
      publishedDay: "2026-09-25",
      originalUrl: "https://agpgabon.ga/gabon-fmi-vers-louverture-de-negociations-formelles-pour-un-nouveau-programme-economique/",
      dependence: "GOVERNMENT_RELEASE",
      summary: {
        fr: "L'AGP rapporte, en s'appuyant sur une communication officielle, une rencontre autour d'une possible ouverture de négociations formelles. Le récit de l'agence ne prouve pas à lui seul une approbation par le FMI.",
        en: "AGP reports a meeting about potentially opening formal negotiations, based on an official government communication. This does not independently establish IMF programme approval.",
      },
      editorialIndependenceVerified: false,
      publisherFullTextFetched: false,
      sourceStatus: "LINK_AND_INDEX_EXCERPT_RESEARCHED",
    },
    {
      id: "imf-20260926",
      outlet: "FMI — Fonds monétaire international",
      role: "international_primary",
      publishedDay: "2026-09-26",
      originalUrl: "https://www.imf.org/fr/news/articles/2026/09/26/pr2305-imf-staff-concludes-visit-to-gabon",
      dependence: "ORIGINAL_INSTITUTION",
      summary: {
        fr: "Le FMI décrit une mission de discussions techniques sur les finances publiques et la dette, avec des échanges appelés à se poursuivre afin de préparer d'éventuelles discussions de programme.",
        en: "The IMF describes technical fiscal and debt discussions, with further exchanges expected as a step towards possible programme discussions.",
      },
      editorialIndependenceVerified: false,
      publisherFullTextFetched: false,
      sourceStatus: "LINK_AND_INDEX_EXCERPT_RESEARCHED",
    },
    {
      id: "ecomatin-20261120",
      outlet: "EcoMatin — média économique d'Afrique centrale",
      role: "regional_business_news",
      publishedDay: "2026-11-20",
      originalUrl: "https://ecomatin.net/le-gabon-vise-un-accord-avec-le-fmi-en-decembre-apres-une-revision-a-la-baisse-de-sa-dette",
      dependence: "CITES_OTHER_INTERVIEW",
      summary: {
        fr: "EcoMatin rapporte un objectif gouvernemental d'accord au niveau des services en décembre, en se référant à un entretien du ministre avec Bloomberg. C'est une échéance souhaitée, pas une approbation acquise.",
        en: "EcoMatin reports a government target of a staff-level agreement in December, citing a ministerial Bloomberg interview. This is a stated goal, not an approved outcome.",
      },
      editorialIndependenceVerified: false,
      publisherFullTextFetched: false,
      sourceStatus: "LINK_AND_INDEX_EXCERPT_RESEARCHED",
    },
  ],
};
export function validateEditorialSourceCase(value: EditorialSourceCase): boolean {
  if (value.claimVerified || value.sourceMaterialCopied ||
      value.stage !== "TOPIC_TIMELINE_NOT_SAME_EVENT" ||
      value.links.length < 2 || new Set(value.links.map((x) => x.id)).size !== value.links.length ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value.asOfDay)) return false;
  return value.links.every((link) => {
    try {
      const url = new URL(link.originalUrl);
      return url.protocol === "https:" && !url.username && !url.password &&
        url.hostname.includes(".") &&
        link.sourceStatus === "LINK_AND_INDEX_EXCERPT_RESEARCHED" &&
        link.publisherFullTextFetched === false &&
        link.editorialIndependenceVerified === false &&
        link.publishedDay <= value.asOfDay &&
        /\d{4}-\d{2}-\d{2}/.test(link.publishedDay);
    } catch { return false; }
  });
}
