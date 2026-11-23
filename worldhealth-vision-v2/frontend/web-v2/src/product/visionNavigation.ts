/** Shared, typed, centralized service IA for both world home and country hub. */
import type { VisionId } from "./visionProducts";
import type { WorldIconName } from "../components/ui/WorldIcon";
export type CountryDirectoryGroup =
  | "understand" | "finance" | "travel" | "shopping" | "follow" | "professional";

export const VISION_SERVICE_GROUPS: readonly {
  id: CountryDirectoryGroup;
  label: { fr: string; en: string };
  icon: WorldIconName;
  summary: { fr: string; en: string };
}[] = [
  { id: "understand", label: { fr: "Comprendre le pays", en: "Understand the country" },
    icon: "globe", summary: { fr: "Atlas, statistiques, comparaisons et sources",
      en: "Atlas, indicators, comparisons and sources" }},
  { id: "finance", label: { fr: "Argent & marchés", en: "Money & markets" },
    icon: "markets", summary: { fr: "Devises, Trading Vision et marchés régionaux",
      en: "Currency, Trading Vision and regional markets" }},
  { id: "travel", label: { fr: "Voyager & vivre", en: "Travel & living" },
    icon: "travel", summary: { fr: "Tourisme, mobilité, destination et qualité de vie",
      en: "Tourism, mobility, destination and living" }},
  { id: "shopping", label: { fr: "Acheter & comparer", en: "Shop & compare" },
    icon: "scale", summary: { fr: "Price Vision, Panier Vision et prix locaux",
      en: "Price Vision, Panier Vision and local prices" }},
  { id: "follow", label: { fr: "Actualités & suivi", en: "News & following" },
    icon: "book", summary: { fr: "Actualités du pays, Radar, Watch Vision et Média",
      en: "Country news, Radar, Watch Vision and Media" }},
  { id: "professional", label: { fr: "Outils professionnels", en: "Professional tools" },
    icon: "layers", summary: { fr: "Méthodes, sources, exports et outils experts",
      en: "Methods, evidence, exports and expert tools" }},
];

/** Deliberately explicit; when VISION_PRODUCTS changes, the test contract
 * prevents silently omitting or duplicating any Vision. */
export const VISION_SERVICE_GROUP_BY_ID: Readonly<Record<VisionId, CountryDirectoryGroup>> = {
  atlas: "understand",
  money: "finance",
  trading: "finance",
  brvm: "finance",
  tourism: "travel",
  transport: "travel",
  price: "shopping",
  basket: "shopping",
  watch: "follow",
  radar: "follow",
  media: "follow",
};
export const VISION_PRODUCT_ICONS: Readonly<Record<VisionId, WorldIconName>> = {
  atlas: "map", money: "currency", trading: "markets", brvm: "markets",
  tourism: "compass", transport: "travel", price: "scale", basket: "regions",
  watch: "star", radar: "search", media: "book",
};

