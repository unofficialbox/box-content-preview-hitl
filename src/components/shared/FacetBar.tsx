import { ChevronDown, Search } from "@box/blueprint-web-assets/icons/Medium";
import { useEffect, useRef, useState } from "react";

interface FacetDropdownProps {
  label: string;
  options: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onReset: () => void;
}

export function FacetDropdown({ label, options, selected, onToggle, onReset }: FacetDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const activeCount = selected.size;

  return (
    <div className="facet-dropdown" ref={ref}>
      <button
        type="button"
        className={`facet-dropdown__trigger ${activeCount > 0 ? "facet-dropdown__trigger--active" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {label}{activeCount > 0 && `: ${activeCount}`}
        <ChevronDown aria-hidden className="facet-dropdown__chevron" />
      </button>
      {open && (
        <div className="facet-dropdown__menu">
          {options.map((opt) => (
            <label key={opt} className="facet-dropdown__option">
              <input
                type="checkbox"
                checked={selected.has(opt)}
                onChange={() => onToggle(opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
          {activeCount > 0 && (
            <button type="button" className="facet-dropdown__reset" onClick={() => { onReset(); setOpen(false); }}>
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface FacetBarProps {
  filters: Array<{
    label: string;
    options: string[];
    selected: Set<string>;
    onToggle: (value: string) => void;
    onReset: () => void;
  }>;
  onResetAll: () => void;
}

export function FacetBar({ filters, onResetAll }: FacetBarProps) {
  const activeFilterCount = filters.reduce((sum, f) => sum + f.selected.size, 0);

  return (
    <div className="facet-bar">
      <div className="facet-bar__filters-icon">
        <Search aria-hidden className="facet-bar__icon" />
        All Filters{activeFilterCount > 0 && <span className="facet-bar__badge">{activeFilterCount}</span>}
      </div>
      {filters.map((f) => (
        <FacetDropdown
          key={f.label}
          label={f.label}
          options={f.options}
          selected={f.selected}
          onToggle={f.onToggle}
          onReset={f.onReset}
        />
      ))}
      {activeFilterCount > 0 && (
        <button type="button" className="facet-bar__reset" onClick={onResetAll}>
          Reset
        </button>
      )}
    </div>
  );
}
