"use client";

import { FileText, Trash2 } from "lucide-react";

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
      className={`group flex items-center gap-3 rounded-xl border p-3 transition ${
        selected
          ? "border-zinc-300 bg-zinc-100"
          : "border-transparent hover:border-zinc-200 hover:bg-zinc-50"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(document)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            selected ? "bg-white" : "bg-zinc-100"
          }`}
        >
          <FileText size={17} className="text-zinc-600" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-800">
            {document.filename}
          </p>

          <p className="mt-0.5 text-xs text-zinc-500">
            {document.pages}{" "}
            {document.pages === 1 ? "page" : "pages"}{" "}
            · {document.chunk_count} chunks
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-400">
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
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-20 md:opacity-0 md:group-hover:opacity-100"
        title={
          document.status === "processing"
            ? "Wait for processing to finish"
            : "Delete document"
        }
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}