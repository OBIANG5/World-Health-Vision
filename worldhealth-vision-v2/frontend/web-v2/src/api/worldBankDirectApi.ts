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

// Interroge la Banque mondiale en lots afin d'éviter 40 requêtes simultanées sur mobile.
// API V2 : 60 indicateurs maximum par requête, les séries WDI nécessitent source=2.
// Les indicateurs WGI sont récupérés séparément : ils ne font pas tous partie de WDI.
export async function fetchWbMultipleLatest(
  iso3: string,
  codes: readonly string[],
): Promise<Record<string, WbLatestPoint>> {
  const result: Record<string, WbLatestPoint> = {};
  const wgi = codes.filter((code) => code.endsWith(".EST"));
  const wdi = codes.filter((code) => !code.endsWith(".EST"));
  const batches: string[][] = [];
  for (let start = 0; start < wdi.length; start += 12) {
    batches.push(wdi.slice(start, start + 12));
  }

  await Promise.all([
    ...batches.map(async (batch) => {
      const endpoint = `${WB_BASE}/country/${iso3}/indicator/${batch.join(";")}?source=2&format=json&mrv=6&per_page=900`;
      const json = await wbFetch(endpoint);
      const observations = parseWbObs(json) as Array<
        WbObservation & { indicator?: { id?: string } }
      >;
      for (const entry of observations) {
        const code = entry.indicator?.id;
        if (!code || !batch.includes(code) || entry.value === null || !Number.isFinite(entry.value)) continue;
        const existing = result[code];
        if (!existing || Number(entry.date) > Number(existing.year)) {
          result[code] = { value: entry.value, year: entry.date };
        }
      }
    }),
    ...wgi.map(async (code) => {
      const point = await fetchWbLatestValue(iso3, code);
      if (point) result[code] = point;
    }),
  ]);

  return result;
}
