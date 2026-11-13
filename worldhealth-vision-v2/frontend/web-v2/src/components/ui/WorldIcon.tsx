import type {ReactNode,SVGProps} from "react";

/** Local 24px line icon system. No emoji fonts, remote requests or icon bundle. */
export type WorldIconName =
  | "globe" | "map" | "regions" | "compass" | "markets" | "travel"
  | "shield" | "search" | "star" | "currency" | "scale" | "advisor"
  | "destination" | "home" | "building" | "alert" | "menu"
  | "arrow" | "chevron" | "close" | "info" | "book" | "layers";

const symbols: Record<WorldIconName, ReactNode> = {
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3.4 12h17.2M12 3c-4 5-4 13 0 18M12 3c4 5 4 13 0 18"/></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/></>,
  regions: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  compass: <><circle cx="12" cy="12" r="9"/><path d="m16.8 7.2-3 6.6-6.6 3 3-6.6z"/></>,
  markets: <><path d="M3 19V5M3 19h18M6 14l5-5 4 3 6-7"/><path d="M16 5h5v5"/></>,
  travel: <><path d="M21 3 9 15m12-12-7 18-4.5-7.5L2 9z"/></>,
  shield: <><path d="M12 2 20 5v6c0 5-3.5 8.7-8 11-4.5-2.3-8-6-8-11V5z"/><path d="m9 12 2 2 4-4"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>,
  currency: <><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5c-.8-1-2.3-1.5-3.7-1.5-2.2 0-3.8 1.1-3.8 2.7 0 4.1 8 1 8 5.1 0 1.6-1.6 2.7-4 2.7-1.6 0-3.2-.5-4.1-1.8M12 5v14"/></>,
  scale: <><path d="M12 3v18M5 7h14M5 7l-3 6h6zM19 7l-3 6h6zM7 21h10"/></>,
  advisor: <><path d="M5 20v-9a7 7 0 0 1 14 0v9M5 16H3v-5h2M19 16h2v-5h-2M19 18c0 2-2 3-6 3h-2"/></>,
  destination: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></>,
  home: <><path d="m3 11 9-8 9 8v9H3zM9 20v-7h6v7"/></>,
  building: <><path d="M4 21V5l8-3 8 3v16M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2M11 21v-4h2v4"/></>,
  alert: <><path d="M12 3 2 21h20z"/><path d="M12 9v5M12 17h.01"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
  chevron: <path d="m6 9 6 6 6-6"/>,
  close: <path d="M5 5 19 19M19 5 5 19"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
  book: <><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1zM12 6v14"/></>,
  layers: <><path d="m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5"/></>,
};
type Props=SVGProps<SVGSVGElement>&{name:WorldIconName;size?:number};
export function WorldIcon({name,size=19,style,...props}:Props){
 return <svg {...props} width={size} height={size} viewBox="0 0 24 24"
  fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
  strokeLinejoin="round" focusable="false" aria-hidden="true"
  style={{display:"inline-block",verticalAlign:"middle",flexShrink:0,...style}}>
  {symbols[name]}
 </svg>;
}
