"use client";

import { FileText, Trash2, Loader2 } from "lucide-react";

import type { Document } from "@/types/document";

type DocumentCardProps = {
  document: Document;
  onDelete: (documentId: string) => Promise<void>;
};

export function DocumentCard({
  document,
  onDelete,
}: DocumentCardProps) {
  return (
    <div className="mt-4 rounded-xl border bg-zinc-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">
          <FileText size={20} className="text-zinc-600" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900">
            {document.filename}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            PDF document
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDelete(document.document_id)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50"
          title="Delete document"
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-zinc-500">Pages</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {document.pages}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Chunks</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {document.chunk_count}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Characters</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">
            {document.characters}
          </p>
        </div>
      </div>
    </div>
  );
}