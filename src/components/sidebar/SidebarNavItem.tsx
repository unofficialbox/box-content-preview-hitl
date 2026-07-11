import clsx from "clsx";
import { type SidebarNavItem as SidebarNavItemType } from "./types";

interface SidebarNavItemProps {
  item: SidebarNavItemType;
  isSelected: boolean;
  isCollapsed: boolean;
  onSelect: (id: string) => void;
}

export function SidebarNavItem({
  item,
  isSelected,
  isCollapsed,
  onSelect,
}: SidebarNavItemProps) {
  const Icon = item.icon;

  const handleClick = () => {
    onSelect(item.id);
  };

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
        onClick={handleClick}
      >
        <span className="sidebar-nav-item__icon">
          <Icon aria-hidden />
        </span>
        {!isCollapsed && <span className="sidebar-nav-item__label">{item.label}</span>}
      </button>
    </div>
  );
}
