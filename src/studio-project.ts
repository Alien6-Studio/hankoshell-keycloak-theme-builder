import { createRequire } from "node:module";
import type { StudioComposition } from "./composition-types.js";

const contracts = createRequire(import.meta.url)("./studio-contracts/validate.cjs") as { validate(kind: string, value: unknown): { valid: boolean; errors: string[] } };
export function parseStudioProject(input: unknown): StudioComposition {
  const checked = contracts.validate("project", input);
  if (!checked.valid) throw new Error("Invalid Studio project: " + checked.errors.join("; "));
  const value = input as StudioComposition & { plugins?: unknown[]; theme?: unknown; outputs?: unknown };
  if (value.plugins?.length || Object.hasOwn(value, "theme") || Object.hasOwn(value, "outputs")) throw new Error("This project requires an unsupported renderer");
  if (!value.pages["login:0"]) throw new Error("The project must include the login screen");
  for (const [key, page] of Object.entries(value.pages)) {
    if (!/^(?:login:[0-2]|email:[0-2]|account:[0-4]|admin:[0-5]|welcome:0)$/.test(key)) throw new Error("Unsupported project screen: " + key);
    if (!page.appearance || !page.brand || !page.native?.copy || !page.native.styles || !page.i18n || page.blocks.some(block => !["heading", "text", "image", "divider", "button"].includes(block.type))) throw new Error("Complete this screen in the Studio before compiling: " + key);
    if (/^(login|email):/.test(key)) for (const block of page.blocks) {
      if (block.type === "image" && (!block.src || !block.alt?.trim())) throw new Error("Compiled images require an image and alternative text: " + key);
      if (block.type === "button" && block.href?.startsWith("#")) throw new Error("Replace preview-only screen links with application URLs before compiling: " + key);
    }
  }
  return structuredClone(value);
}
