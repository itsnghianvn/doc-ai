"use client";

export type UserPreferences = {
  openWorkspaceOnSource: boolean;
};

const STORAGE_KEY = "docai-preferences";

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  openWorkspaceOnSource: true,
};

export function readUserPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_USER_PREFERENCES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_USER_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      openWorkspaceOnSource:
        parsed.openWorkspaceOnSource ??
        DEFAULT_USER_PREFERENCES.openWorkspaceOnSource,
    };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function writeUserPreferences(
  preferences: UserPreferences
): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export function resetUserPreferences(): UserPreferences {
  writeUserPreferences(DEFAULT_USER_PREFERENCES);
  return DEFAULT_USER_PREFERENCES;
}
