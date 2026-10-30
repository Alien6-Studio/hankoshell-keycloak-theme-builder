export interface CompositionStyle {
  color?: string; background?: string; fontSize?: number; fontWeight?: number;
  padding?: number; margin?: number; radius?: number; width?: number;
  imageHeight?: number; fit?: "contain" | "cover"; align?: "left" | "center" | "right"; lineHeight?: number;
}
export interface CompositionBlock {
  id: string; type: "heading" | "text" | "image" | "divider" | "button";
  zone: "header" | "aside" | "footer"; text: string; alt: string; src?: string; href?: string;
  align: "left" | "center" | "right"; style?: CompositionStyle;
}
export interface CompositionPage {
  blocks: CompositionBlock[]; layout: "left" | "center" | "right"; radius: number; accent: string; subject: string;
  brand: { name: string; mark: string; logo?: string; alt: string; size: number; fontSize: number; align: string; color: string };
  appearance: { background: string; surface: string; foreground: string; muted: string; font: string; density: string; padding: number; gap: number; contentWidth: number; backgroundImage?: string; backgroundFit: string };
  native: { copy: Record<string, string>; styles: Record<string, CompositionStyle>; background: string; foreground: string; inputBackground: string; inputBorder: string; padding: number; radius: number; gap: number; buttonBackground: string; buttonColor: string };
  i18n?: { defaultLocale: string; supportedLocales: string[]; messages: Record<string, Record<string, string>> };
}
export interface StudioComposition {
  format: "hanko.theme-studio.project/v1"; name: string; pages: Record<string, CompositionPage>;
}
