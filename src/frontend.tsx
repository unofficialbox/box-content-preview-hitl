import "@box/blueprint-web/index.css";
import "../node_modules/@box/blueprint-web-assets/dist/tokens/tokens-css-vars.scss";
import "./styles/app-layout.css";
import { createRoot } from "react-dom/client";
import { App } from "./App";

[
  "/box-ui-elements/preview.css",
  "/box-ui-elements/sidebar.css",
].forEach((href) => {
  if (document.querySelector(`link[href="${href}"]`)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.append(link);
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);
