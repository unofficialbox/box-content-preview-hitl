import { IconButton, Link, usePageNavigation } from "@box/blueprint-web";
import { Nav } from "@box/blueprint-web-assets/icons/Medium";
import clsx from "clsx";
import { useState } from "react";
import appConfig from "../../data/json/app-config.json";
import { BoxLogo, primaryNavItems } from "./nav-items";
import { SidebarNavItem } from "./SidebarNavItem";

export function Sidebar() {
  const { navigationExpanded, toggleNavigationExpanded } = usePageNavigation();
  const [activeItemId, setActiveItemId] = useState(appConfig.sidebarMenuItems[0]?.id || "");

  const handleSelectParent = (id: string) => {
    setActiveItemId(id);
  };

  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div
        className={clsx(
          "sidebar__header",
          !navigationExpanded && "sidebar__header--collapsed",
        )}
      >
        {navigationExpanded && (
          <div className="sidebar__branding">
            <Link className="sidebar__logo-link" href="/">
              <BoxLogo height={32} width={62} aria-label="Box home" />
            </Link>
            <span className="sidebar__subheader">{appConfig.appName}</span>
          </div>
        )}
        <IconButton
          aria-label={navigationExpanded ? "Collapse navigation" : "Expand navigation"}
          className="sidebar__nav-toggle"
          icon={Nav}
          onClick={toggleNavigationExpanded}
          size="large"
        />
      </div>

      <div className="sidebar__scroll-area">
        {primaryNavItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isCollapsed={!navigationExpanded}
            isSelected={activeItemId === item.id}
            onSelect={handleSelectParent}
            selectedChildId={null}
            onSelectChild={(_, parentId) => {
              if (parentId && activeItemId !== parentId) {
                setActiveItemId(parentId);
              }
            }}
          />
        ))}
      </div>

      {navigationExpanded && (
        <div className="sidebar__footer">
          <span className="sidebar__footer-text">{appConfig.appTitle}</span>
        </div>
      )}
    </nav>
  );
}
