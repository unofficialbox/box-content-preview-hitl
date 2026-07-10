import "@box/blueprint-web/index.css";
import "../node_modules/@box/blueprint-web-assets/dist/tokens/tokens-css-vars.scss";
import "./styles/app-layout.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
