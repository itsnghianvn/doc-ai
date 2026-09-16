"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/layout/theme-provider";

export function ThemeToggle() {
  const { mounted, setTheme, theme } = useTheme();

  return (
    <div
      className="flex items-center rounded-full border border-border bg-muted/60 p-0.5"
      aria-label="Color theme"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        disabled={!mounted}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
          theme === "light"
            ? "bg-card text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Use light theme"
        aria-pressed={theme === "light"}
      >
        <Sun size={13} />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        disabled={!mounted}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
          theme === "dark"
            ? "bg-card text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Use dark theme"
        aria-pressed={theme === "dark"}
      >
        <Moon size={13} />
      </button>
    </div>
  );
}
