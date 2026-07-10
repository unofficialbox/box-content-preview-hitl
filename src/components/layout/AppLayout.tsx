import {
  BrandingStyles,
  Page,
  SupplementaryFonts,
  TooltipProvider,
} from "@box/blueprint-web";
import { BoxBlue100 } from "@box/blueprint-web-assets/tokens/tokens";
import { useState } from "react";
import { supplementaryFontFacesConfig } from "../../config/fonts";
import appConfig from "../../data/json/app-config.json";
import { dataSourceMap } from "../../data/index";
import type { SectionConfig } from "../../types/app-config";
import { SectionView } from "../global/SectionView";
import { Sidebar } from "../sidebar/Sidebar";
import { GlobalHeaderActions, GlobalHeaderSearch } from "./GlobalHeaderActions";

export function AppLayout() {
  const [activeSection, setActiveSection] = useState(appConfig.defaultSection);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectParent = (id: string) => {
    setActiveSection(id);
    setActiveCategory(null);
  };

  const handleSelectChild = (childId: string | null, parentId?: string) => {
    if (parentId && activeSection !== parentId) {
      setActiveSection(parentId);
    }
    setActiveCategory(childId);
  };

  const section = appConfig.sidebarMenuItems.find((s) => s.id === activeSection) || appConfig.sidebarMenuItems[0]!;
  const data = dataSourceMap[section.dataSource] || [];

  return (
    <TooltipProvider>
      <BrandingStyles brandColor={BoxBlue100} />
      <SupplementaryFonts supplementaryFontFacesConfig={supplementaryFontFacesConfig} />
      <Page className="app-page" defaultMainContentSidebarVisible={false}>
        <Page.Navigation>
          <Sidebar
            onSelectChild={handleSelectChild}
            onSelectParent={handleSelectParent}
            activeChildId={activeCategory}
          />
        </Page.Navigation>

        <Page.GlobalHeader>
          <div className="global-header-grid">
            <div className="global-header-grid__search">
              <GlobalHeaderSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
            </div>
            <div className="global-header-grid__spacer" />
            <div className="global-header-grid__actions">
              <GlobalHeaderActions />
            </div>
          </div>
        </Page.GlobalHeader>

        <Page.PageHeader />

        <Page.MainSection>
          <Page.MainSection.Content>
            <SectionView
              key={section.id}
              section={section as SectionConfig}
              data={data}
              activeCategory={activeCategory}
              searchQuery={searchQuery}
            />
          </Page.MainSection.Content>
        </Page.MainSection>
      </Page>
    </TooltipProvider>
  );
}
