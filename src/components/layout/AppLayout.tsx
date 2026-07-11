import {
  BrandingStyles,
  Page,
  SupplementaryFonts,
  TooltipProvider,
} from "@box/blueprint-web";
import { BoxBlue100 } from "@box/blueprint-web-assets/tokens/tokens";
import type { WheelEvent } from "react";
import { useRef } from "react";
import { supplementaryFontFacesConfig } from "../../config/fonts";
import { HitlPreviewExample } from "../hitl/HitlPreviewExample";
import { Sidebar } from "../sidebar/Sidebar";

export function AppLayout() {
  const mainScrollRef = useRef<HTMLDivElement | null>(null);

  const handleMainWheel = (event: WheelEvent<HTMLDivElement>) => {
    const container = mainScrollRef.current;
    if (!container || event.ctrlKey || event.metaKey || !event.deltaY) return;

    const canScrollUp = event.deltaY < 0 && container.scrollTop > 0;
    const canScrollDown = event.deltaY > 0
      && container.scrollTop + container.clientHeight < container.scrollHeight;

    if (canScrollUp || canScrollDown) {
      event.preventDefault();
      event.stopPropagation();
      container.scrollTop += event.deltaY;
    }
  };

  return (
    <TooltipProvider>
      <BrandingStyles brandColor={BoxBlue100} />
      <SupplementaryFonts supplementaryFontFacesConfig={supplementaryFontFacesConfig} />
      <Page className="app-page">
        <Page.Navigation>
          <Sidebar />
        </Page.Navigation>

        <Page.GlobalHeader className="app-global-header" />

        <Page.MainSection>
          <Page.MainSection.Content>
            <div ref={mainScrollRef} className="app-main-scroll" onWheelCapture={handleMainWheel}>
              <HitlPreviewExample />
            </div>
          </Page.MainSection.Content>
        </Page.MainSection>
      </Page>
    </TooltipProvider>
  );
}
