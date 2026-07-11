import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const schemaDir = join(process.cwd(), "node_modules/box-ui-elements/es/api/schemas");
const aiAgentSelectorChunk = join(
  process.cwd(),
  "node_modules/@box/box-ai-agent-selector/dist/chunks/box-ai-agent-selector.js",
);
const patches = new Map([
  ["AiAgentBasicTextTool.js", ["AiAgentBasicTextTool"]],
  ["AiAgentExtractStructured.js", ["AiAgentExtractStructured"]],
  ["AiAgentReference.js", ["AiAgentReference"]],
  ["AiExtractResponse.js", ["AiExtractResponse"]],
  ["AiExtractStructured.js", ["AiExtractStructured"]],
  ["AiItemBase.js", ["AiItemBase"]],
  ["AiLlmEndpointParamsGoogle.js", ["AiLlmEndpointParamsGoogle"]],
  ["AiLlmEndpointParamsOpenAi.js", ["AiLlmEndpointParamsOpenAi"]],
]);

await Promise.all(Array.from(patches, async ([fileName, exportNames]) => {
  const filePath = join(schemaDir, fileName);
  const source = await readFile(filePath, "utf8");

  if (source.includes("box-content-preview-hitl patch")) {
    return;
  }

  const exports = exportNames
    .map((exportName) => `export const ${exportName} = undefined;`)
    .join("\n");

  await writeFile(filePath, [
    "/** box-content-preview-hitl patch: generated Flow-only schema shim for Bun ESM checks. */",
    exports,
    source,
  ].join("\n"));
}));

{
  const source = await readFile(aiAgentSelectorChunk, "utf8");
  let patched = source
    .replace("import '../styles/box-ai-agent-selector.css';var te =", "import '../styles/box-ai-agent-selector.css';\nconst ReactStatic = d;\nvar te =")
    .replace('var t = ne("react");', "var t = d;")
    .replace("var t = d;", "var t = ReactStatic;")
    .replace('var a = ne("react"),', "var a = d,")
    .replace("var a = d,", "var a = ReactStatic,");

  if (patched !== source) {
    await writeFile(aiAgentSelectorChunk, patched);
  }
}
