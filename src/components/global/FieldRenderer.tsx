import type { CardFieldConfig, SectionConfig, PercentThresholdConfig } from "../../types/app-config";

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface FieldRendererProps {
  field: CardFieldConfig;
  item: Record<string, any>;
  section?: SectionConfig;
}

export function renderFieldValue(field: CardFieldConfig, item: Record<string, any>): string {
  const { key, type } = field;
  const value = item[key];
  if (value == null) return "—";

  switch (type) {
    case "currency":
      return formatCurrency(value as number);
    case "date":
      return formatDate(value as string);
    case "text":
    default:
      return String(value);
  }
}

function getPipelineCoverageClass(field: CardFieldConfig, item: Record<string, any>, section?: SectionConfig): string {
  if (!section || section.status.strategy !== "percent-threshold") return "";
  const cfg = section.status.config as PercentThresholdConfig;
  if (field.key === cfg.valueField || field.key === cfg.totalField) return "";

  const target = (item[cfg.totalField] as number) || 0;
  const closed = (item[cfg.valueField] as number) || 0;
  const pipeline = (item[field.key] as number) || 0;
  const gap = target - closed;
  if (gap <= 0) return "card__metric-value--pipeline-green";
  const coverage = pipeline / gap;
  if (coverage >= 2) return "card__metric-value--pipeline-green";
  if (coverage >= 1) return "card__metric-value--pipeline-orange";
  return "card__metric-value--pipeline-red";
}

export function MetricField({ field, item, section }: FieldRendererProps) {
  const value = renderFieldValue(field, item);
  const colorClass = getPipelineCoverageClass(field, item, section);
  return (
    <div className="card__metric">
      <span className={`card__metric-value${colorClass ? ` ${colorClass}` : ""}`}>{value}</span>
      <span className="card__metric-label">{field.label || field.key}</span>
    </div>
  );
}
