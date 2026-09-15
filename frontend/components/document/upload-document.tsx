"use client";

import { FileText, Loader2 } from "lucide-react";

type UploadDocumentProps = {
  file: File | null;
  loading: boolean;
  onUpload: () => void;
  onCancel: () => void;
};

export function UploadDocument({
  file,
  loading,
  onUpload,
  onCancel,
}: UploadDocumentProps) {
  if (!file) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-border bg-card p-4 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {file.name}
          </p>

          <p className="mt-0.5 text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(1)} MB
            {" · "}
            {loading ? "Processing..." : "Ready to upload"}
          </p>
        </div>

        <button
          type="button"
          onClick={onUpload}
          disabled={loading}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
        >
          {loading && (
            <Loader2 size={14} className="animate-spin" />
          )}
          {loading ? "Processing" : "Upload"}
        </button>
      </div>

      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="mt-2 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}
