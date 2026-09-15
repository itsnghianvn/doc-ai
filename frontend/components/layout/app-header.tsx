"use client";

import { useEffect, useRef } from "react";
import {
  FileText,
  LayoutDashboard,
  Loader2,
  Search,
  Upload,
} from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Document } from "@/types/document";

type AppHeaderProps = {
  documents: Document[];
  selectedDocument: Document | null;
  search: string;
  loading: boolean;
  hasProcessingDocuments: boolean;
  workspaceVisible: boolean;
  onSearchChange: (value: string) => void;
  onSelectDocument: (document: Document) => void;
  onUploadClick: () => void;
  onOpenDashboard: () => void;
};

export function AppHeader({
  documents,
  selectedDocument,
  search,
  loading,
  hasProcessingDocuments,
  workspaceVisible,
  onSearchChange,
  onSelectDocument,
  onUploadClick,
  onOpenDashboard,
}: AppHeaderProps) {
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () =>
      window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-3 sm:px-4 md:px-5">
      <div className="hidden min-w-0 flex-1 md:block">
        {selectedDocument ? (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText size={17} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-foreground">
                {selectedDocument.filename}
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {selectedDocument.pages} pages ·{" "}
                {selectedDocument.chunk_count} chunks
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                {selectedDocument.status === "ready"
                  ? "Ready"
                  : selectedDocument.status}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Document workspace
            </h2>
            <p className="text-xs text-muted-foreground">
              Upload a PDF to get started
            </p>
          </div>
        )}
      </div>

      <select
        value={selectedDocument?.document_id ?? ""}
        onChange={(event) => {
          const document = documents.find(
            (item) => item.document_id === event.target.value
          );
          if (document) {
            onSelectDocument(document);
          }
        }}
        className="min-w-0 flex-1 truncate rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none md:hidden"
        aria-label="Select document"
      >
        {documents.length === 0 && (
          <option value="">No documents</option>
        )}
        {documents.map((document) => (
          <option
            key={document.document_id}
            value={document.document_id}
          >
            {document.filename}
          </option>
        ))}
      </select>

      <label className="relative hidden w-full max-w-xs lg:block">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <span className="sr-only">Search documents</span>
        <input
          ref={searchRef}
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search documents..."
          className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-12 text-xs text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
          ⌘ K
        </span>
      </label>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {(loading || hasProcessingDocuments) && (
          <div className="flex h-8 items-center gap-2 rounded-lg bg-muted px-2.5 text-xs text-muted-foreground">
            <Loader2 size={13} className="animate-spin" />
            <span className="hidden sm:inline">Processing</span>
          </div>
        )}

        {workspaceVisible && (
          <button
            type="button"
            onClick={onOpenDashboard}
            className="hidden h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground sm:flex"
          >
            <LayoutDashboard size={13} />
            Dashboard
          </button>
        )}

        <button
          type="button"
          onClick={onUploadClick}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50 md:hidden"
          aria-label="Upload PDF"
        >
          <Upload size={14} />
        </button>

        <ThemeToggle />

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
          N
        </div>
      </div>
    </header>
  );
}
