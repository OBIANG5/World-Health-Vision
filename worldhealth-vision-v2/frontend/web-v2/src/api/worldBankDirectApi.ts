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

// Récupère plusieurs indicateurs en parallèle — tolère les échecs partiels
export async function fetchWbMultipleLatest(
  iso3: string,
  codes: readonly string[],
): Promise<Record<string, WbLatestPoint>> {
  const settled = await Promise.allSettled(
    codes.map(async (code) => {
      const point = await fetchWbLatestValue(iso3, code);
      return { code, point };
    }),
  );
  const result: Record<string, WbLatestPoint> = {};
  for (const entry of settled) {
    if (entry.status === "fulfilled" && entry.value.point) {
      result[entry.value.code] = entry.value.point;
    }
  }
  return result;
}