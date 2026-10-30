import { createHash } from "node:crypto";
import { buildTheme, previewTheme, type BuildOptions, type ThemeArtifact } from "./builder.js";
import { parseTheme } from "./config.js";
import { parseStudioProject } from "./studio-project.js";

export interface ProjectBuildOptions extends Omit<BuildOptions, "composition" | "renderer" | "runtimeAdapter"> { name?: string }
export interface ProjectArtifact extends ThemeArtifact { projectSha256: string; types: string[] }
function projectConfig(input: unknown, options: ProjectBuildOptions) {
  const project = parseStudioProject(input), page = project.pages["login:0"]!;
  const name = options.name || (input as { destination?: { theme?: string } }).destination?.theme || project.name;
  const palette = { background: page.appearance.background, foreground: page.native.foreground, primary: page.native.buttonBackground, primaryForeground: page.native.buttonColor, card: page.native.background, muted: page.appearance.muted, border: page.native.inputBorder, input: page.native.inputBackground };
  const config = parseTheme({ version: 1, name, headline: page.brand.name, logoUrl: page.brand.logo, fontFamily: page.appearance.font, colors: { light: palette, dark: palette }, layout: { cardRadius: page.native.radius + "px", controlRadius: page.radius + "px", contentWidth: page.appearance.contentWidth + "px" } });
  return { project, config };
}
export async function buildStudioProject(input: unknown, options: ProjectBuildOptions = {}): Promise<ProjectArtifact> {
  const { project, config } = projectConfig(input, options);
  const artifact = await buildTheme(config, { ...options, composition: project });
  return { ...artifact, projectSha256: createHash("sha256").update(JSON.stringify(project)).digest("hex"), types: ["login", ...(Object.keys(project.pages).some(key => key.startsWith("email:")) ? ["email"] : [])] };
}
export async function previewStudioProject(input: unknown, options: ProjectBuildOptions = {}): Promise<void> {
  const { project, config } = projectConfig(input, options);
  await previewTheme(config, { ...options, composition: project });
}
