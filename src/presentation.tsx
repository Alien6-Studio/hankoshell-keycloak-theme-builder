import { createContext, useContext } from "react";
export const PresentationContext = createContext<{ css?: string; preview?: boolean }>({});
export const usePresentation = () => useContext(PresentationContext);
