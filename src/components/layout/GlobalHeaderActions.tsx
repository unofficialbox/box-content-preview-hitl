import { Avatar, SearchInput } from "@box/blueprint-web";
import { BoxBlue50 } from "@box/blueprint-web-assets/tokens/tokens";

interface GlobalHeaderSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function GlobalHeaderSearch({ searchQuery, onSearchChange }: GlobalHeaderSearchProps) {
  return (
    <SearchInput
      placeholder="Search"
      searchInputAriaLabel="Search"
      searchInputClearAriaLabel="Clear filter"
      value={searchQuery}
      onChange={(value: string) => onSearchChange(value)}
      variant="global"
    />
  );
}

export function GlobalHeaderActions() {
  return <Avatar color={BoxBlue50} size="medium" text="U" />;
}
