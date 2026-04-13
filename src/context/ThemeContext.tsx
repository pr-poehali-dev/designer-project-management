import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeId = "arena" | "terracotta" | "sage" | "navy" | "blush" | "graphite" | "sand";

export const THEMES: {
  id: ThemeId; label: string; accent: string; bg: string;
  sidebar: string; card: string; text: string; textMuted: string; dark?: boolean;
}[] = [
  { id: "arena",      label: "Арена",      accent: "#0A0A0A", bg: "#F5F5F5", sidebar: "#FFFFFF", card: "#FFFFFF", text: "#0A0A0A", textMuted: "#6B6B6B" },
  { id: "terracotta", label: "Terracotta", accent: "#C1440E", bg: "#FAF2EB", sidebar: "#FFF8F3", card: "#FFFFFF", text: "#2C1A0E", textMuted: "#8B6555" },
  { id: "sage",       label: "Sage",       accent: "#4A7C59", bg: "#EEF4EF", sidebar: "#F7FAF7", card: "#FFFFFF", text: "#1A2B1F", textMuted: "#5A7A62" },
  { id: "navy",       label: "Navy",       accent: "#1E3A5F", bg: "#E8F0F8", sidebar: "#F5F8FC", card: "#FFFFFF", text: "#0D1E35", textMuted: "#4A6585" },
  { id: "blush",      label: "Blush",      accent: "#B85C6E", bg: "#FBF0F3", sidebar: "#FEF8FA", card: "#FFFFFF", text: "#2D1520", textMuted: "#8B5A6A" },
  { id: "graphite",   label: "Graphite",   accent: "#A0A0A0", bg: "#1A1A1A", sidebar: "#222222", card: "#2C2C2C", text: "#F0F0F0", textMuted: "#909090", dark: true },
  { id: "sand",       label: "Sand",       accent: "#9C7C4A", bg: "#F5F0E8", sidebar: "#FBF8F3", card: "#FFFFFF", text: "#2A1F10", textMuted: "#7A6248" },
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