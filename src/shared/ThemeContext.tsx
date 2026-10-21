import { createContext, useContext } from "react";
type ThemeConfig = { social_position?: "before" | "after" };

export const ThemeContext = createContext<ThemeConfig>({});
export const useThemeConfig = () => useContext(ThemeContext);
