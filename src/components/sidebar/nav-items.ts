import { BarChart, Briefcase, Calendar, Gear, Globe, LightningBolt, Puzzle, Shield, TrendUp } from "@box/blueprint-web-assets/icons/Medium";
import { BoxLogo } from "@box/blueprint-web-assets/icons/Logo";
import { type SidebarIcon, type SidebarNavItem } from "./types";
import appConfig from "../../data/json/app-config.json";

const iconMap: Record<string, SidebarIcon> = {
  TrendUp,
  Puzzle,
  Briefcase,
  Globe,
  Shield,
  LightningBolt,
  Gear,
  Calendar,
  BarChart,
};

export const primaryNavItems: SidebarNavItem[] = appConfig.sidebarMenuItems.map((section) => ({
  id: section.id,
  label: section.label,
  icon: iconMap[section.icon] ?? Puzzle,
  children: section.categories,
}));

export { BoxLogo };
