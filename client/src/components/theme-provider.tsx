import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ColorPalette = "burgundy" | "ocean" | "forest" | "purple" | "sunset" | "slate";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  colorPalette: ColorPalette;
  setColorPalette: (palette: ColorPalette) => void;
}

export const COLOR_PALETTES: { id: ColorPalette; name: string; color: string }[] = [
  { id: "burgundy", name: "Burgundy", color: "hsl(355, 85%, 42%)" },
  { id: "ocean", name: "Ocean Blue", color: "hsl(210, 85%, 42%)" },
  { id: "forest", name: "Forest Green", color: "hsl(150, 65%, 35%)" },
  { id: "purple", name: "Royal Purple", color: "hsl(270, 65%, 50%)" },
  { id: "sunset", name: "Sunset Orange", color: "hsl(25, 90%, 48%)" },
  { id: "slate", name: "Slate Gray", color: "hsl(215, 25%, 40%)" },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexus-theme") as Theme;
      if (stored) return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  const [colorPalette, setColorPalette] = useState<ColorPalette>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nexus-color-palette") as ColorPalette;
      if (stored && COLOR_PALETTES.some(p => p.id === stored)) return stored;
    }
    return "burgundy";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("nexus-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    COLOR_PALETTES.forEach(p => {
      root.classList.remove(`palette-${p.id}`);
    });
    if (colorPalette !== "burgundy") {
      root.classList.add(`palette-${colorPalette}`);
    }
    localStorage.setItem("nexus-color-palette", colorPalette);
  }, [colorPalette]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, colorPalette, setColorPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
