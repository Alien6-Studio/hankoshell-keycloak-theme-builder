import { mergeTheme, parseTheme, parseAppearance, type ThemeConfig } from "./config.js";
export { parseAppearance } from "./config.js";
export type { AppearanceProfile } from "./config.js";

export interface ExperienceManifest {
  contract: "hanko.experience/v1";
  id: string;
  version: string;
  surfaces: ReadonlyArray<{
    id: string;
    kind: "authentication" | "self-service" | "administration";
    capabilities: readonly string[];
  }>;
}

const identifier = /^[a-z][a-z0-9._-]{0,127}$/;
export function parseExperience(input: unknown): ExperienceManifest {
  const value = plain(input);
  exact(value, ["contract", "id", "version", "surfaces"]);
  if (value.contract !== "hanko.experience/v1" || !validIdentifier(value.id) || typeof value.version !== "string" || !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(value.version)) throw new Error("Unsupported experience contract");
  if (!Array.isArray(value.surfaces) || value.surfaces.length > 64) throw new Error("Invalid experience surfaces");
  const ids = new Set();
  for (const item of value.surfaces) {
    const surface = plain(item); exact(surface, ["id", "kind", "capabilities"]);
    if (!validIdentifier(surface.id) || ids.has(surface.id) || !["authentication", "self-service", "administration"].includes(String(surface.kind))) throw new Error("Invalid experience surface");
    ids.add(surface.id);
    if (!Array.isArray(surface.capabilities) || surface.capabilities.length > 32 || surface.capabilities.some(capability => !validIdentifier(capability)) || new Set(surface.capabilities).size !== surface.capabilities.length) throw new Error("Invalid experience capabilities");
  }
  return structuredClone(value) as unknown as ExperienceManifest;
}

export function applyAppearance(base: ThemeConfig, input: unknown): ThemeConfig {
  return mergeTheme(parseTheme(base), parseAppearance(input).appearance);
}

function plain(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input) || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) throw new Error("Expected a plain contract object");
  return input as Record<string, unknown>;
}
function exact(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).some(key => !keys.includes(key))) throw new Error("Unknown contract property");
}
function validIdentifier(value: unknown): value is string { return typeof value === "string" && identifier.test(value); }
