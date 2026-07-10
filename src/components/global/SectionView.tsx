import { Text } from "@box/blueprint-web";
import { GridView, Table } from "@box/blueprint-web-assets/icons/Medium";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SectionConfig } from "../../types/app-config";
import { matchesFilter, deriveFilterOptions } from "../../utils/filterMatchers";
import { FacetBar } from "../shared/FacetBar";
import { CardShell } from "./CardShell";
import { TableView } from "./TableView";

interface SectionViewProps {
  section: SectionConfig;
  data: Record<string, any>[];
  activeCategory?: string | null;
  searchQuery?: string;
}

export function SectionView({ section, data, activeCategory, searchQuery = "" }: SectionViewProps) {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [items, setItems] = useState<Record<string, any>[]>(data);
  const [selectedIds] = useState<Set<string>>(new Set());
  const [filterStates, setFilterStates] = useState<Map<string, Set<string>>>(() => {
    const map = new Map<string, Set<string>>();
    section.filters.forEach((f) => map.set(f.key, new Set()));
    return map;
  });

  useEffect(() => { setItems(data); }, [data]);

  const categoryLabels: Record<string, string> = useMemo(() =>
    Object.fromEntries(section.categories.map((c) => [c.id, c.label])),
    [section.categories]
  );

  const filterCtx = useMemo(() => ({ categoryLabels }), [categoryLabels]);

  const query = searchQuery.toLowerCase();

  const filtered = useMemo(() => items.filter((item) => {
    const matchesCategory = !activeCategory || item.category === activeCategory;
    const matchesSearch = !query || section.searchFields.some((field) => {
      const val = item[field];
      return typeof val === "string" && val.toLowerCase().includes(query);
    });

    const passesFilters = section.filters.every((filterConfig) =>
      matchesFilter(item, filterConfig, filterStates.get(filterConfig.key)!, filterCtx)
    );

    return matchesCategory && matchesSearch && passesFilters;
  }), [items, activeCategory, query, section.searchFields, section.filters, filterStates, filterCtx]);

  const toggleFilter = useCallback((key: string, value: string) => {
    setFilterStates((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(key)!);
      if (set.has(value)) set.delete(value); else set.add(value);
      next.set(key, set);
      return next;
    });
  }, []);

  const resetFilter = useCallback((key: string) => {
    setFilterStates((prev) => {
      const next = new Map(prev);
      next.set(key, new Set());
      return next;
    });
  }, []);

  const resetAllFilters = useCallback(() => {
    setFilterStates((prev) => {
      const next = new Map(prev);
      for (const key of next.keys()) next.set(key, new Set());
      return next;
    });
  }, []);

  const gridStyle = section.layout ? {
    gridTemplateColumns: `repeat(auto-fill, minmax(${section.layout.gridMinWidth || 300}px, 1fr))`,
    ...(section.layout.gridGap ? { gap: `${section.layout.gridGap}px` } : {}),
  } : undefined;

  const title = activeCategory ? (categoryLabels[activeCategory] || section.label) : section.defaultTitle;

  return (
    <div className="main-page">
      <div className="main-page__header">
        <div className="main-page__header-start">
          <Text as="h1" variant="titleLarge">{title}</Text>
        </div>
        <div className="main-page__header-end">
          <div className="view-toggle">
            <button
              type="button"
              className={`view-toggle__btn ${viewMode === "cards" ? "view-toggle__btn--active" : ""}`}
              onClick={() => setViewMode("cards")}
              aria-label="Card view"
            >
              <GridView aria-hidden />
            </button>
            <button
              type="button"
              className={`view-toggle__btn ${viewMode === "table" ? "view-toggle__btn--active" : ""}`}
              onClick={() => setViewMode("table")}
              aria-label="Table view"
            >
              <Table aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <FacetBar
        filters={section.filters.map((f) => ({
          label: f.label,
          options: deriveFilterOptions(items, f, filterCtx),
          selected: filterStates.get(f.key)!,
          onToggle: (v: string) => toggleFilter(f.key, v),
          onReset: () => resetFilter(f.key),
        }))}
        onResetAll={resetAllFilters}
      />

      {viewMode === "table" ? (
        <TableView
          items={filtered}
          section={section}
          selectedIds={selectedIds}
          onSelect={section.features.selectable ? undefined : undefined}
        />
      ) : section.groups && section.groups.length > 0 ? (
        section.groups.map((group) => {
          const groupItems = filtered.filter((item) => item[group.filterField] === group.filterValue);
          if (groupItems.length === 0) return null;
          return (
            <div key={group.label} className="section-group">
              <Text as="h2" variant="titleMedium" className="section-group__heading">{group.label}</Text>
              <div className="solution-grid" style={gridStyle}>
                {groupItems.map((item) => (
                  <CardShell key={item.id} item={item} section={section} />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="solution-grid" style={gridStyle}>
          {filtered.map((item) => (
            <CardShell key={item.id} item={item} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}
