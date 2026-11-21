/**
 * Trading-Vision / MTA workflow — independent functional interpretation of
 * documented learning notes. Not the professor's licensed course content,
 * and not financial advice, execution, live prices or a trading signal.
 */
export type Locale = "fr" | "en";
export type Copy = { fr: string; en: string };
export type Direction = "undecided" | "long" | "short";
export type RouteMode = "fundamental" | "technical_exception";
export type StageId = "fundamental" | "price" | "parameters" | "participants" | "management" | "adverse" | "execution";
export type FieldKind = "text" | "textarea" | "number" | "datetime-local" | "select";
export interface StageField {
  key: string;
  label: Copy;
  hint?: Copy;
  kind?: FieldKind;
  required?: boolean;
  options?: readonly { value: string; label: Copy }[];
}
export interface Stage {
  id: StageId;
  title: Copy;
  question: Copy;
  fields: readonly StageField[];
}
export type EvidencePerspective = "national" | "regional" | "international" | "field" | "media" | "market" | "other";
export type EvidenceStance = "supports" | "challenges" | "context";
export interface Evidence {
  id: string;
  name: string;
  originalPublisher: string;
  url: string;
  publishedAt: string;
  perspective: EvidencePerspective;
  stance: EvidenceStance;
  observation: string;
}
export interface TradePlan {
  schemaVersion: 1;
  instrument: string;
  instrumentKind: string;
  direction: Direction;
  mode: RouteMode;
  fields: Record<string, string>;
  evidence: Evidence[];
}
const pair = (fr: string, en: string): Copy => ({ fr, en });
const field = (key: string, fr: string, en: string, required = false, kind: FieldKind = "textarea", hint?: Copy): StageField =>
  ({ key, label: pair(fr, en), required, kind, hint });

export const STAGES: readonly Stage[] = [
  { id: "fundamental", title: pair("01 · Thèse fondamentale", "01 · Fundamental thesis"),
    question: pair("Quel thème domine, qu'attendait déjà le marché et qu'est-ce qui a changé ?", "What drives the market, what was priced in, and what changed?"),
    fields: [
      field("theme", "Thème dominant et hypothèse", "Dominant theme and hypothesis", true),
      field("baseCurrency", "Économie / actif de base : arguments", "Base economy / asset: evidence", true),
      field("quoteCurrency", "Deuxième jambe / contrepartie : arguments", "Quote economy / other side: evidence", true),
      field("expectations", "Attentes connues AVANT l'événement", "Expectations known BEFORE the event", true),
      field("catalyst", "Fait nouveau, surprise et transmission", "New fact, surprise and transmission", true),
      field("technicalReason", "Si route technique exceptionnelle : pourquoi ?", "If exceptional technical route: why?"),
      field("contradictions", "Informations contraires / autre interprétation", "Contrary evidence / alternative reading"),
    ] },
  { id: "price", title: pair("02 · Price action", "02 · Price action"),
    question: pair("Le marché offre-t-il une structure exploitable, ou faut-il attendre ?", "Is there a valid price structure, or should we wait?"),
    fields: [
      field("timeframes", "Unités de temps : contexte / setup / déclencheur", "Timeframes: context / setup / trigger", true),
      field("setup", "Structure et configuration : tendance/range, zone, condition", "Structure and setup: trend/range, zone, condition", true),
      field("confluences", "Confluences examinées et dépendances entre elles", "Confluences and whether they share a common driver", true),
      field("entry", "Entrée envisagée (prix, non cotation en direct)", "Planned entry (price, NOT a live quote)", true, "number"),
      field("stop", "Stop justifié par invalidation structurelle", "Stop justified by structural invalidation", true, "number"),
      field("target", "Objectif cohérent avec la structure", "Target consistent with price structure", true, "number"),
    ] },
  { id: "parameters", title: pair("03 · Paramètres et risque", "03 · Parameters and risk"),
    question: pair("La perte prévue et les positions corrélées sont-elles compatibles avec le budget ?", "Do planned losses and correlated positions fit the risk budget?"),
    fields: [
      field("accountCurrency", "Devise du compte", "Account currency", true, "text"),
      field("rMax", "R max personnel en devise du compte (montant)", "Personal R max in account currency (amount)", true, "number"),
      field("riskPercent", "Fraction prévue du R max (%)", "Planned fraction of R max (%)", true, "number"),
      field("totalExposure", "Expositions existantes / moteurs communs", "Existing exposures / common drivers", true),
      field("transactionCosts", "Spread, frais, slippage, marge et limites", "Spread, fees, slippage, margin and limits"),
    ] },
  { id: "participants", title: pair("04 · Participants", "04 · Participants"),
    question: pair("Que montrent réellement le retail, le COT et les autres participants ?", "What do retail, COT and other participants actually reveal?"),
    fields: [
      field("retail", "Positionnement retail, échantillon, date et filtre", "Retail positioning, sample, date and filter", true),
      field("institutions", "Institutionnels : données, limites ou absence de données", "Institutional data, limitations or unavailable data", true),
    ] },
  { id: "management", title: pair("05 · Gestion anticipée", "05 · Management plan"),
    question: pair("Comment gérer impulsion, stagnation, annonces et week-end AVANT d'entrer ?", "How should momentum, stagnation, events and weekends be handled BEFORE entry?"),
    fields: [
      field("horizon", "Horizon et temps disponible", "Holding horizon and available time", true),
      field("impulse", "Plan si impulsion / si absence de suivi", "Plan if impulse / if no follow-through", true),
      field("announcements", "Annonces, risque de gap et week-end", "Events, gap risk and weekends", true),
      field("management", "Stop, partiels, ajout/réentrée : conditions et limite de risque", "Stop, partials, additions/re-entry: conditions and risk caps", true),
    ] },
  { id: "adverse", title: pair("06 · Scénario adverse", "06 · Adverse scenario"),
    question: pair("Qu'est-ce qui réfuterait la thèse ou rendrait l'exécution inacceptable ?", "What would invalidate the thesis or make execution unacceptable?"),
    fields: [
      field("fundInvalidation", "Fait qui invaliderait la thèse / l'attente", "Fundamental or expectation invalidation", true),
      field("priceInvalidation", "Déclencheur de refus / invalidation de structure", "No-trade trigger / structural invalidation", true),
      field("failureResponse", "Réaction prévue et motif de non-trade", "Planned response and no-trade rationale", true),
    ] },
  { id: "execution", title: pair("07 · Décision supervisée", "07 · Supervised decision"),
    question: pair("Les conditions sont-elles observées, sans confondre préparation et ordre exécuté ?", "Are conditions observed, without confusing preparation with an executed order?"),
    fields: [
      { ...field("orderType", "Type d'ordre envisagé", "Planned order type", true, "select"), options: [
        { value: "wait", label: pair("En attente — aucun ordre", "Waiting — no order") },
        { value: "market", label: pair("Ordre au marché envisagé", "Market order considered") },
        { value: "limit", label: pair("Ordre limite envisagé", "Limit order considered") },
        { value: "stop", label: pair("Ordre stop envisagé", "Stop order considered") },
      ] },
      field("trigger", "Condition exacte avant toute action humaine", "Exact condition before any human action", true),
      field("quoteAsOf", "Horodatage d'une cotation vérifiée (ou indiquer inconnue)", "Timestamp of verified quote (or state unavailable)", true),
      field("humanDecision", "Décision et justification (attendre / refuser / réexaminer)", "Decision and rationale (wait / reject / review)", true),
    ] },
];
export const STAGE_IDS: readonly StageId[] = STAGES.map((stage) => stage.id);

export function newTradePlan(): TradePlan {
  return { schemaVersion: 1, instrument: "", instrumentKind: "", direction: "undecided", mode: "fundamental", fields: {}, evidence: [] };
}

function positiveInput(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const number = Number(raw);
  return Number.isFinite(number) && number > 0 ? number : null;
}
export interface RiskReview {
  validGeometry: boolean;
  ratio: number | null;
  plannedRiskBudget: number | null;
  geometryNote: "missing" | "invalid" | "valid";
  riskNote: "missing" | "invalid" | "valid";
}
/** Geometry only: no pip value, position size or guaranteed fill is inferred. */
export function reviewRisk(plan: TradePlan): RiskReview {
  const entry = positiveInput(plan.fields.entry);
  const stop = positiveInput(plan.fields.stop);
  const target = positiveInput(plan.fields.target);
  const rMax = positiveInput(plan.fields.rMax);
  const pct = positiveInput(plan.fields.riskPercent);
  const geometryPresent = entry !== null && stop !== null && target !== null && plan.direction !== "undecided";
  const geometryValid = geometryPresent &&
    (plan.direction === "long" ? stop! < entry! && target! > entry! : stop! > entry! && target! < entry!);
  const ratio = geometryValid ? Math.abs(target! - entry!) / Math.abs(entry! - stop!) : null;
  const riskValid = rMax !== null && pct !== null && pct <= 100 && !!plan.fields.accountCurrency?.trim();
  return {
    validGeometry: geometryValid,
    ratio,
    plannedRiskBudget: riskValid ? rMax! * pct! / 100 : null,
    geometryNote: geometryValid ? "valid" : geometryPresent ? "invalid" : "missing",
    riskNote: riskValid ? "valid" : rMax !== null || pct !== null ? "invalid" : "missing",
  };
}
export function validEvidence(e: Evidence): boolean {
  if (!e.name.trim() || !e.originalPublisher.trim() || !e.observation.trim() || !e.publishedAt.trim()) return false;
  try {
    const url = new URL(e.url);
    const date = new Date(e.publishedAt);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password && Number.isFinite(date.valueOf()) && date.valueOf() <= Date.now();
  } catch { return false; }
}
export function independentSourceCount(items: readonly Evidence[]): number {
  return new Set(items.filter(validEvidence).map((item) => item.originalPublisher.trim().toLocaleLowerCase())).size;
}
export function stageMissing(plan: TradePlan, stage: Stage): string[] {
  const skipMacro = stage.id === "fundamental" && plan.mode === "technical_exception";
  const missing = stage.fields
    .filter((item) => item.required && !(skipMacro && ["baseCurrency", "quoteCurrency", "expectations", "catalyst"].includes(item.key)))
    .filter((item) => !(plan.fields[item.key] ?? "").trim())
    .map((item) => item.key);
  if (skipMacro && !plan.fields.technicalReason?.trim()) missing.push("technicalReason");
  if (stage.id === "price" && !reviewRisk(plan).validGeometry) missing.push("price-geometry");
  if (stage.id === "parameters" && reviewRisk(plan).riskNote !== "valid") missing.push("risk-budget");
  return [...new Set(missing)];
}
export function reviewPlan(plan: TradePlan): { completed: number; missingStages: StageId[]; limitations: string[] } {
  const missingStages = STAGES.filter((step) => stageMissing(plan, step).length > 0).map((stage) => stage.id);
  const limitations: string[] = [];
  if (!plan.instrument.trim() || !plan.instrumentKind.trim() || plan.direction === "undecided") limitations.push("instrument");
  if (plan.evidence.filter(validEvidence).length === 0) limitations.push("evidence");
  if (independentSourceCount(plan.evidence) < 2) limitations.push("single-origin");
  if (missingStages.length) limitations.push("incomplete");
  return { completed: STAGES.length - missingStages.length, missingStages, limitations };
}
/** Storage boundary: explicitly user-controlled, never silently synchronized. */
export function isTradePlan(value: unknown): value is TradePlan {
  if (!value || typeof value !== "object") return false;
  const obj = value as Partial<TradePlan>;
  return obj.schemaVersion === 1 &&
    typeof obj.instrument === "string" && obj.instrument.length < 150 &&
    typeof obj.instrumentKind === "string" && obj.instrumentKind.length < 100 &&
    (obj.direction === "undecided" || obj.direction === "long" || obj.direction === "short") &&
    (obj.mode === "fundamental" || obj.mode === "technical_exception") &&
    !!obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields) &&
    Object.keys(obj.fields).length <= 100 &&
    Object.values(obj.fields).every((v) => typeof v === "string" && v.length < 10000) &&
    Array.isArray(obj.evidence) && obj.evidence.length <= 50 &&
    obj.evidence.every((e) => {
      if (!e || typeof e !== "object") return false;
      const row = e as unknown as Record<string, unknown>;
      if (!["id", "name", "originalPublisher", "url", "publishedAt", "perspective", "stance", "observation"]
        .every((key) => typeof row[key] === "string" && (row[key] as string).length < 3000)) return false;
      return ["national", "regional", "international", "field", "media", "market", "other"].includes(row.perspective as string)
        && ["supports", "challenges", "context"].includes(row.stance as string);
    });
}
