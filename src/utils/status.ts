import type { SolutionStatus } from "../types/data";
import type { SectionConfig, PercentThresholdConfig, FieldMapConfig } from "../types/app-config";

export interface StatusResult {
  label: string;
  color: SolutionStatus;
  progress: number;
}

export function computeStatus(item: Record<string, any>, section: SectionConfig): StatusResult {
  const { status } = section;

  if (status.strategy === "percent-threshold") {
    const cfg = status.config as PercentThresholdConfig;
    const value = item[cfg.valueField] as number;
    const total = item[cfg.totalField] as number;
    const progress = total > 0 ? Math.round((value / total) * 100) : 0;

    const { onTrack, atRisk } = cfg.thresholds;
    let color: SolutionStatus = "off-track";
    let label = "Off Track";
    if (progress >= onTrack) { color = "on-track"; label = "On Track"; }
    else if (progress >= atRisk) { color = "at-risk"; label = "At Risk"; }
    return { label, color, progress };
  }

  if (status.strategy === "field-map") {
    const cfg = status.config as FieldMapConfig;
    const fieldValue = item[cfg.field] as string;
    const mapping = cfg.map[fieldValue];
    if (mapping) {
      return { label: mapping.label, color: mapping.color, progress: 0 };
    }
  }

  return { label: "Unknown", color: "off-track", progress: 0 };
}
