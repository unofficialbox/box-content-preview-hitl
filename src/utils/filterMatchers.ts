import type { FilterConfig } from "../types/app-config";

interface FilterContext {
  categoryLabels: Record<string, string>;
}

export function matchesFilter(
  item: Record<string, any>,
  filterConfig: FilterConfig,
  selected: Set<string>,
  _ctx: FilterContext,
): boolean {
  if (selected.size === 0) return true;

  if (filterConfig.deriveFromField) {
    const val = String(item[filterConfig.deriveFromField] || "");
    return selected.has(val);
  }

  if (filterConfig.matchPath) {
    const [arrayField, subField] = filterConfig.matchPath.split(".");
    const arr = item[arrayField!] as Array<Record<string, any>> | undefined;
    return !!arr && arr.some((entry) => selected.has(String(entry[subField!])));
  }

  if (filterConfig.matchField) {
    return selected.has(String(item[filterConfig.matchField] || ""));
  }

  if (filterConfig.options) {
    return selected.has(String(item[filterConfig.key] || ""));
  }

  return true;
}

export function deriveFilterOptions(
  items: Record<string, any>[],
  filterConfig: FilterConfig,
  _ctx: FilterContext,
): string[] {
  if (filterConfig.options) return filterConfig.options;

  if (filterConfig.deriveFromField) {
    const values = items.map((item) => String(item[filterConfig.deriveFromField!] || "")).filter(Boolean);
    return [...new Set(values)].sort();
  }

  return [];
}
