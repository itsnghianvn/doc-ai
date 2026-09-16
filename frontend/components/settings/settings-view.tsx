"use client";

import { RotateCcw, Settings } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MIN_SOURCE_SCORE } from "@/lib/source-utils";
import {
  DEFAULT_USER_PREFERENCES,
  resetUserPreferences,
  writeUserPreferences,
  type UserPreferences,
} from "@/lib/user-preferences";

function apiHostLabel() {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
    ).host;
  } catch {
    return "Not configured";
  }
}

type SettingsViewProps = {
  preferences: UserPreferences;
  onPreferencesChange: (preferences: UserPreferences) => void;
};

export function SettingsView({
  preferences,
  onPreferencesChange,
}: SettingsViewProps) {
  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const next = { ...preferences, [key]: value };
    writeUserPreferences(next);
    onPreferencesChange(next);
  };

  const handleReset = () => {
    const defaults = resetUserPreferences();
    onPreferencesChange(defaults);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Settings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Appearance and chat behavior. Saved on this device.
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Appearance</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose light or dark mode for the interface.
          </p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Chat & sources</h3>
          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={preferences.openWorkspaceOnSource}
              onChange={(event) =>
                updatePreference(
                  "openWorkspaceOnSource",
                  event.target.checked
                )
              }
              className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
            />
            <span>
              <span className="block text-sm font-medium">
                Open PDF when clicking a source
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Jump to the document workspace and page when you select a
                citation.
              </span>
            </span>
          </label>
          <p className="mt-4 text-xs text-muted-foreground">
            Sources below{" "}
            <span className="font-medium text-foreground">
              {Math.round(MIN_SOURCE_SCORE * 100)}% relevance
            </span>{" "}
            are hidden in chat (server-side RAG threshold).
          </p>
        </section>

        <section className="mt-4 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">About</h3>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">API</dt>
              <dd className="font-mono text-foreground">
                {apiHostLabel()}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Product</dt>
              <dd className="text-foreground">DocAI</dd>
            </div>
          </dl>
        </section>

        <button
          type="button"
          onClick={handleReset}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <RotateCcw size={13} />
          Reset preferences to defaults
        </button>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Default: open PDF on source ={" "}
          {DEFAULT_USER_PREFERENCES.openWorkspaceOnSource
            ? "on"
            : "off"}
          . Theme is stored separately.
        </p>
      </div>
    </div>
  );
}
