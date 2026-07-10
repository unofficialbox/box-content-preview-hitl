export interface CardFieldConfig {
  key: string;
  label?: string;
  type: "text" | "currency" | "date";
}

export interface FilterConfig {
  key: string;
  label: string;
  options?: string[];
  deriveFromField?: string;
  matchField?: string;
  matchPath?: string;
}

export interface CategoryConfig {
  id: string;
  label: string;
}

export interface GroupConfig {
  label: string;
  filterField: string;
  filterValue: string;
}

export interface PercentThresholdConfig {
  valueField: string;
  totalField: string;
  thresholds: { onTrack: number; atRisk: number };
}

export interface FieldMapEntry {
  label: string;
  color: "on-track" | "at-risk" | "off-track" | "not-started";
}

export interface FieldMapConfig {
  field: string;
  map: Record<string, FieldMapEntry>;
}

export type StatusConfig =
  | { strategy: "percent-threshold"; config: PercentThresholdConfig }
  | { strategy: "field-map"; config: FieldMapConfig };

export interface LayoutConfig {
  gridMinWidth?: number;
  gridGap?: number;
}

export interface SectionFeatures {
  selectable: boolean;
}

export interface SectionConfig {
  id: string;
  label: string;
  icon: string;
  defaultTitle: string;
  categories: CategoryConfig[];
  filters: FilterConfig[];
  dataSource: string;
  cardLayout: "metric";
  titleField: string;
  searchFields: string[];
  status: StatusConfig;
  cardFields: CardFieldConfig[];
  summaryTemplate?: string;
  groups?: GroupConfig[];
  layout?: LayoutConfig;
  features: SectionFeatures;
}

export interface AppConfig {
  appTitle: string;
  appName: string;
  defaultSection: string;
  sidebarMenuItems: SectionConfig[];
}
