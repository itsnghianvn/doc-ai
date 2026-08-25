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
        </div>
      </button>

      <button
        type="button"
        onClick={() => onDelete(document.document_id)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        title="Delete document"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}