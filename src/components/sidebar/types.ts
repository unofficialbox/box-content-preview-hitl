import { type FunctionComponent, type SVGProps } from "react";

export type SidebarIcon = FunctionComponent<SVGProps<SVGSVGElement>>;

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: SidebarIcon;
}
