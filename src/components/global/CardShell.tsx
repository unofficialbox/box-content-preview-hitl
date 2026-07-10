import { Text } from "@box/blueprint-web";
import type { SectionConfig } from "../../types/app-config";
import { computeStatus, type StatusResult } from "../../utils/status";
import { ProgressBar } from "../shared/ProgressBar";
import { MetricField } from "./FieldRenderer";

interface CardShellProps {
  item: Record<string, any>;
  section: SectionConfig;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}

export function CardShell({ item, section, selected, onSelect }: CardShellProps) {
  const statusResult: StatusResult = computeStatus(item, section);
  const title = item[section.titleField] || "";

  return (
    <div className={`card ${selected ? "card--selected" : ""}`}>
      <div className="card__header">
        <Text as="span" variant="titleMedium">
          {title}
        </Text>
        <div className="card__header-right">
          <div className="card__status-group">
            <span className={`card__status card__status--${statusResult.color}`}>
              {statusResult.label}
            </span>
          </div>
          {section.features.selectable && onSelect && (
            <input
              type="checkbox"
              className="card__checkbox"
              checked={selected || false}
              onChange={(e) => onSelect(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      </div>

      <div className="card__metrics">
        {section.cardFields.map((field) => (
          <MetricField key={field.key} field={field} item={item} section={section} />
        ))}
      </div>

      <ProgressBar progress={statusResult.progress} status={statusResult.color} />

      {section.summaryTemplate && (
        <div className="card__deals">
          <Text as="span" variant="bodySmall" className="card__body">
            {renderSummary(section.summaryTemplate, item)}
          </Text>
        </div>
      )}
    </div>
  );
}

function renderSummary(template: string, item: Record<string, any>): string {
  return template.replace(/\{([^}]+)\}/g, (_, path: string) => {
    const parts = path.split(".");
    if (parts.length === 1) return String(item[parts[0]!] ?? "");

    const arr = item[parts[0]!];
    if (!Array.isArray(arr)) return "0";
    if (parts[1] === "length") return String(arr.length);

    const expr = parts.slice(1).join(".");
    if (expr.includes("=")) {
      const [field, value] = expr.split("=");
      return String(arr.filter((entry: any) => String(entry[field!]) === value).length);
    }
    return String(arr.filter((entry: any) => entry.status === expr).length);
  });
}
