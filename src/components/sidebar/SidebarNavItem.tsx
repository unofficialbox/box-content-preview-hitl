import { ChevronDown, ChevronRight } from "@box/blueprint-web-assets/icons/Medium";
import clsx from "clsx";
import { useState } from "react";
import { type SidebarNavItem as SidebarNavItemType } from "./types";

interface SidebarNavItemProps {
  item: SidebarNavItemType;
  isSelected: boolean;
  isCollapsed: boolean;
  onSelect: (id: string) => void;
  selectedChildId: string | null;
  onSelectChild: (id: string, parentId: string) => void;
}

export function SidebarNavItem({
  item,
  isSelected,
  isCollapsed,
  onSelect,
  selectedChildId,
  onSelectChild,
}: SidebarNavItemProps) {
  const Icon = item.icon;
  const [expanded, setExpanded] = useState(isSelected);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    onSelect(item.id);
    if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div className="sidebar-nav-item-group">
      <button
        type="button"
        className={clsx(
          "sidebar-nav-item",
          isSelected && "sidebar-nav-item--selected",
          isCollapsed && "sidebar-nav-item--collapsed",
        )}
        aria-current={isSelected ? "page" : undefined}
        aria-expanded={hasChildren ? expanded : undefined}
        onClick={handleClick}
      >
        <span className="sidebar-nav-item__icon">
          <Icon aria-hidden />
        </span>
        {!isCollapsed && <span className="sidebar-nav-item__label">{item.label}</span>}
        {!isCollapsed && hasChildren && (
          <span className="sidebar-nav-item__chevron">
            <Chevron aria-hidden />
          </span>
        )}
      </button>

      {hasChildren && expanded && !isCollapsed && (
        <div className="sidebar-nav-item__children">
          {item.children!.map((child) => (
            <button
              key={child.id}
              type="button"
              className={clsx(
                "sidebar-nav-child",
                selectedChildId === child.id && "sidebar-nav-child--selected",
              )}
              onClick={() => onSelectChild(child.id, item.id)}
            >
              {child.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
