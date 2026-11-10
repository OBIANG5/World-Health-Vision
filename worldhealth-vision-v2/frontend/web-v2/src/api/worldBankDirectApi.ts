// Appels directs à l'API publique de la Banque Mondiale depuis le navigateur.
// L'API WB supporte CORS (Access-Control-Allow-Origin: *) — aucun proxy nécessaire.
// Utilisé comme source de secours quand le backend WHV n'est pas disponible.

const WB_BASE = "https://api.worldbank.org/v2";
const TIMEOUT_MS = 12000;

export type WbLatestPoint = { value: number; year: string };
export type WbHistoryPoint = { year: string; value: number };

interface WbObservation {
  date: string;
  value: number | null;
}

async function wbFetch(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseWbObs(json: unknown): WbObservation[] {
  if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) return [];
  return json[1] as WbObservation[];
}

export async function fetchWbLatestValue(
  iso3: string,
  code: string,
): Promise<WbLatestPoint | null> {
  const url = `${WB_BASE}/country/${iso3}/indicator/${encodeURIComponent(code)}?format=json&mrv=5&per_page=5`;
  const obs = parseWbObs(await wbFetch(url));
  const found = obs.find((o) => o.value !== null);
  if (!found || found.value === null) return null;
  return { value: found.value, year: found.date };
}

export async function fetchWbHistory(
  iso3: string,
  code: string,
  limit = 60,
): Promise<WbHistoryPoint[]> {
  const url = `${WB_BASE}/country/${iso3}/indicator/${encodeURIComponent(code)}?format=json&mrv=${limit}&per_page=${limit}`;
  const obs = parseWbObs(await wbFetch(url));
  return obs
    .filter((o): o is WbObservation & { value: number } => o.value !== null)
    .map((o) => ({ year: o.date, value: o.value }))
    .reverse();
}

// Une fiche pays charge parfois 40+ indicateurs. La Banque mondiale prend
// en charge plusieurs codes séparés par des points-virgules dans un même appel.
// Des paquets de 12 évitent des dizaines de connexions simultanées sur mobile.
const WB_BATCH_SIZE = 12;
const WB_FALLBACK_CONCURRENCY = 3;
const WGI_CODES = new Set(["RL.EST", "CC.EST", "GE.EST", "PV.EST", "VA.EST", "RQ.EST"]);

interface WbMultiObservation extends WbObservation {
  indicator?: { id?: string };
}

async function fetchWbLatestBatch(
  iso3: string,
  codes: readonly string[],
  source: number,
): Promise<Record<string, WbLatestPoint> | null> {
  const indicatorPath = codes.map(encodeURIComponent).join(";");
  const url = `${WB_BASE}/country/${encodeURIComponent(iso3)}/indicator/${indicatorPath}?format=json&source=${source}&mrv=8&per_page=1000`;
  const response = await wbFetch(url);
  if (!Array.isArray(response) || !Array.isArray(response[1])) return null;

  const result: Record<string, WbLatestPoint> = {};
  const expected = new Set(codes);
  for (const row of response[1] as WbMultiObservation[]) {
    const code = row.indicator?.id;
    if (!code || !expected.has(code) || typeof row.value !== "number") continue;
    const previous = result[code];
    if (!previous || row.date > previous.year) {
      result[code] = { value: row.value, year: row.date };
    }
  }
  return result;
}

async function fetchWbFallbackLimited(
  iso3: string,
  codes: readonly string[],
): Promise<Record<string, WbLatestPoint>> {
  const data: Record<string, WbLatestPoint> = {};
  let nextIndex = 0;
  await Promise.all(Array.from(
    { length: Math.min(WB_FALLBACK_CONCURRENCY, codes.length) },
    async () => {
      while (nextIndex < codes.length) {
        const code = codes[nextIndex++];
        const point = await fetchWbLatestValue(iso3, code);
        if (point) data[code] = point;
      }
    },
  ));
  return data;
}

export async function fetchWbMultipleLatest(
  iso3: string,
  codes: readonly string[],
): Promise<Record<string, WbLatestPoint>> {
  if (codes.length === 0) return {};

  const groups: Array<{ codes: string[]; source: number }> = [];
  for (const source of [2, 3]) {
    const sourceCodes = codes.filter(code => WGI_CODES.has(code) === (source === 3));
    for (let index = 0; index < sourceCodes.length; index += WB_BATCH_SIZE) {
      groups.push({ codes: sourceCodes.slice(index, index + WB_BATCH_SIZE), source });
    }
  }

  const settled = await Promise.all(groups.map(async group => {
    const batched = await fetchWbLatestBatch(iso3, group.codes, group.source);
    // Repli borné uniquement si la requête groupée n'est pas disponible.
    // Une série absente d'une réponse valide ne doit pas déclencher 40 requêtes.
    return batched ?? fetchWbFallbackLimited(iso3, group.codes);
  }));

  return Object.assign({}, ...settled) as Record<string, WbLatestPoint>;
}