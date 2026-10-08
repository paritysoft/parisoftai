import type { Platform } from "@/types/content";

/** Pure helpers shared by the /work and /products grids (unit-tested). */

export const MIN_ITEMS_FOR_FILTERS = 4;

export interface Filterable {
  platforms: Platform[];
  categories: string[];
  ownership?: "client" | "company";
}

export interface FilterState {
  platform: Platform | "all";
  category: string | "all";
  ownership: "client" | "company" | "all";
}

export const NO_FILTERS: FilterState = { platform: "all", category: "all", ownership: "all" };

export function filterOptions(items: Filterable[]) {
  const platforms = Array.from(new Set(items.flatMap((i) => i.platforms)));
  const categories = Array.from(new Set(items.flatMap((i) => i.categories))).sort((a, b) => a.localeCompare(b));
  const ownerships = Array.from(new Set(items.map((i) => i.ownership).filter((o): o is "client" | "company" => Boolean(o))));
  const enabled = items.length >= MIN_ITEMS_FOR_FILTERS;
  return {
    platforms: enabled && platforms.length > 1 ? platforms : [],
    categories: enabled && categories.length > 1 ? categories : [],
    ownerships: enabled && ownerships.length > 1 ? ownerships : [],
  };
}

export function applyFilters<T extends Filterable>(items: T[], f: FilterState): T[] {
  return items.filter(
    (i) =>
      (f.platform === "all" || i.platforms.includes(f.platform)) &&
      (f.category === "all" || i.categories.includes(f.category)) &&
      (f.ownership === "all" || i.ownership === f.ownership),
  );
}
