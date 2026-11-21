/**
 * WORLD-VISION public UI deep-links: always safe on a static Vite preview,
 * GitHub Pages or Vercel, including nested base paths.
 *
 * Query routing intentionally avoids history-fallback server configuration.
 * Only non-personal public country codes, product IDs and view names enter URLs.
 * Free-text search is NEVER persisted in the URL or sent to analytics.
 */
import { useCallback, useEffect, useState } from "react";
import { VISION_PRODUCTS, type VisionId } from "../product/visionProducts";

export type WorldRoute =
  | { kind: "home" }
  | { kind: "visions"; product: VisionId }
  | { kind: "country"; iso3: string }
  | { kind: "sources" }
  | { kind: "radar" }
  | { kind: "money" }
  | { kind: "tourism" }
  | { kind: "search" }
  | { kind: "invalid" };

const knownVisionIds = new Set<string>(VISION_PRODUCTS.map((product) => product.id));
export const isVisionId = (id: string): id is VisionId => knownVisionIds.has(id);

export function parseWorldRoute(search: string): WorldRoute {
  const params = new URLSearchParams(search);
  const view = params.get("wv");
  if (!view || view === "home") return { kind: "home" };
  if (view === "visions") {
    const requested = params.get("product") ?? "atlas";
    return isVisionId(requested) ? { kind: "visions", product: requested } : { kind: "invalid" };
  }
  if (view === "country") {
    const iso3 = (params.get("iso3") ?? "").toUpperCase();
    return /^[A-Z]{3}$/.test(iso3) ? { kind: "country", iso3 } : { kind: "invalid" };
  }
  if (view === "sources" || view === "radar" || view === "money" || view === "tourism" || view === "search") {
    return { kind: view };
  }
  return { kind: "invalid" };
}

export function urlForWorldRoute(currentUrl: string, next: WorldRoute): string {
  const url = new URL(currentUrl);
  url.searchParams.delete("wv");
  url.searchParams.delete("iso3");
  url.searchParams.delete("product");
  switch (next.kind) {
    case "home":
      break;
    case "visions":
      url.searchParams.set("wv", "visions");
      url.searchParams.set("product", next.product);
      break;
    case "country":
      if (!/^[A-Z]{3}$/.test(next.iso3)) throw new Error("Unsafe country code for public URL");
      url.searchParams.set("wv", "country");
      url.searchParams.set("iso3", next.iso3);
      break;
    case "money":
    case "tourism":
    case "sources":
    case "radar":
    case "search":
      url.searchParams.set("wv", next.kind);
      break;
    case "invalid":
      throw new Error("Invalid route cannot be written to history");
  }
  // URL.pathname is kept verbatim: static builds may run under /world-vision/.
  return url.pathname + url.search + url.hash;
}

function readWorldRoute(): WorldRoute {
  return parseWorldRoute(window.location.search);
}

/**
 * Synchronizes only public navigation, never persisted private search text.
 * Back/forward are native and no remote router dependency is necessary.
 */
export function useWorldNavigation() {
  const [route, setRoute] = useState<WorldRoute>(readWorldRoute);

  useEffect(() => {
    function onPopState() { setRoute(readWorldRoute()); }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((target: WorldRoute, options?: { replace?: boolean }) => {
    const targetUrl = urlForWorldRoute(window.location.href, target);
    const oldUrl = window.location.pathname + window.location.search + window.location.hash;
    if (targetUrl !== oldUrl) {
      if (options?.replace) {
        window.history.replaceState(window.history.state, "", targetUrl);
      } else {
        window.history.pushState(window.history.state, "", targetUrl);
      }
    }
    setRoute(target);
  }, []);

  return { route, navigate };
}
