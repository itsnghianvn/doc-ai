"use client";

import { FileText, MoreHorizontal } from "lucide-react";

import type { Document } from "@/types/document";

type DocumentCardProps = {
  document: Document;
  selected?: boolean;
  onSelect: (document: Document) => void;
  onDelete: (documentId: string) => Promise<void>;
};

export function DocumentCard({
  document,
  selected = false,
  onSelect,
  onDelete,
}: DocumentCardProps) {
  const statusLabel =
    document.status === "processing"
      ? "Processing"
      : document.status === "failed"
        ? "Failed"
        : "Ready";

  return (
    <div
      className={`group flex items-center gap-2.5 rounded-xl border p-2.5 transition ${
        selected
          ? "border-primary/20 bg-sidebar-accent"
          : "border-transparent hover:border-sidebar-border hover:bg-sidebar-accent/60"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(document)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary"
        >
          <FileText size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-sidebar-foreground">
            {document.filename}
          </p>

          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {document.pages}{" "}
            {document.pages === 1 ? "page" : "pages"}{" "}
            · {document.chunk_count} chunks
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                document.status === "processing"
                  ? "bg-amber-500"
                  : document.status === "failed"
                    ? "bg-red-500"
                    : "bg-emerald-500"
              }`}
            />
            {statusLabel}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onDelete(document.document_id)}
        disabled={document.status === "processing"}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-20"
        aria-label={`Delete ${document.filename}`}
        title={
          document.status === "processing"
            ? "Wait for processing to finish"
            : "Delete document"
        }
      >
        <MoreHorizontal size={15} />
      </button>
    </div>
  );
}