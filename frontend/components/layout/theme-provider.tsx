"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  mounted: boolean;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(
  null
);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const initialTheme =
        document.documentElement.classList.contains("dark")
          ? "dark"
          : "light";
      setThemeState(initialTheme);
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mounted,
      setTheme: (nextTheme) => {
        document.documentElement.classList.toggle(
          "dark",
          nextTheme === "dark"
        );
        localStorage.setItem("docai-theme", nextTheme);
        setThemeState(nextTheme);
      },
    }),
    [mounted, theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used within ThemeProvider."
    );
  }

  return context;
}
