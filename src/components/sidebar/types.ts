import { type FunctionComponent, type SVGProps } from "react";

export type SidebarIcon = FunctionComponent<SVGProps<SVGSVGElement>>;

export interface SidebarNavChild {
  id: string;
  label: string;
}

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: SidebarIcon;
  children?: SidebarNavChild[];
}
