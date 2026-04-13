import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeId = "arena" | "terracotta" | "sage" | "navy" | "blush" | "graphite" | "sand";

export const THEMES: { id: ThemeId; label: string; accent: string; bg: string; dark?: boolean }[] = [
  { id: "arena",      label: "Арена",      accent: "#0A0A0A", bg: "#F5F5F5" },
  { id: "terracotta", label: "Terracotta", accent: "#C1440E", bg: "#FAF2EB" },
  { id: "sage",       label: "Sage",       accent: "#4A7C59", bg: "#EEF4EF" },
  { id: "navy",       label: "Navy",       accent: "#1E3A5F", bg: "#E8F0F8" },
  { id: "blush",      label: "Blush",      accent: "#B85C6E", bg: "#FBF0F3" },
  { id: "graphite",   label: "Graphite",   accent: "#A0A0A0", bg: "#1A1A1A", dark: true },
  { id: "sand",       label: "Sand",       accent: "#9C7C4A", bg: "#F5F0E8" },
];

interface ThemeCtx {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: "arena", setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    return (localStorage.getItem("app_theme") as ThemeId) || "arena";
  });

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem("app_theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
