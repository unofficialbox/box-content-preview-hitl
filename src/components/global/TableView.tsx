import { InlineTable } from "@box/blueprint-web";
import { ChevronDown, ChevronUp } from "@box/blueprint-web-assets/icons/Medium";
import { useMemo, useState } from "react";
import type { SectionConfig } from "../../types/app-config";
import { renderFieldValue } from "./FieldRenderer";
import { computeStatus } from "../../utils/status";
import { StatusIndicator } from "../shared/StatusIndicator";

type SortDir = "asc" | "desc";

interface TableViewProps {
  items: Record<string, any>[];
  section: SectionConfig;
  selectedIds: Set<string>;
  onSelect?: (id: string, checked: boolean) => void;
}

function getSortValue(item: Record<string, any>, key: string, section: SectionConfig): string | number {
  if (key === "__title") return String(item[section.titleField] || "").toLowerCase();
  if (key === "__status") return computeStatus(item, section).label.toLowerCase();

  const field = section.cardFields.find((f) => f.key === key);
  if (!field) return "";

  if (field.type === "currency") return (item[key] as number) || 0;
  return String(item[key] || "").toLowerCase();
}

export function TableView({ items, section, selectedIds, onSelect }: TableViewProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const columns = [
    { key: "__title", label: section.titleField.charAt(0).toUpperCase() + section.titleField.slice(1) },
    ...section.cardFields.map((f) => ({
      key: f.key,
      label: f.label || f.key.charAt(0).toUpperCase() + f.key.slice(1),
    })),
    { key: "__status", label: "Status" },
  ];

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return items;
    return [...items].sort((a, b) => {
      const aVal = getSortValue(a, sortKey, section);
      const bVal = getSortValue(b, sortKey, section);
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [items, sortKey, sortDir, section]);

  return (
    <div className="table-view">
      <InlineTable fullSpan>
        <InlineTable.Thead>
          <InlineTable.Tr>
            {section.features.selectable && <InlineTable.Th style={{ width: 40 }} />}
            {columns.map((col) => (
              <InlineTable.Th key={col.key}>
                <button
                  type="button"
                  className="table-view__sort-btn"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="table-view__sort-icon">
                      {sortDir === "asc" ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
                    </span>
                  )}
                </button>
              </InlineTable.Th>
            ))}
          </InlineTable.Tr>
        </InlineTable.Thead>
        <InlineTable.Tbody>
          {sorted.map((item) => {
            const status = computeStatus(item, section);
            return (
              <InlineTable.Tr key={item.id}>
                {section.features.selectable && (
                  <InlineTable.Td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={(e) => onSelect?.(item.id, e.target.checked)}
                    />
                  </InlineTable.Td>
                )}
                <InlineTable.Td>{item[section.titleField]}</InlineTable.Td>
                {section.cardFields.map((field) => (
                  <InlineTable.Td key={field.key}>
                    {renderFieldValue(field, item)}
                  </InlineTable.Td>
                ))}
                <InlineTable.Td>
                  <StatusIndicator status={status.color} label={status.label} />
                </InlineTable.Td>
              </InlineTable.Tr>
            );
          })}
        </InlineTable.Tbody>
      </InlineTable>
    </div>
  );
}
