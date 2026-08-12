import { FileText } from "lucide-react";

import type { Document } from "@/types/document";

type DocumentListProps = {
  documents: Document[];
  selectedDocument: Document | null;
  onSelect: (document: Document) => void;
};

export function DocumentList({
  documents,
  selectedDocument,
  onSelect,
}: DocumentListProps) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-zinc-900">
            Your documents
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Select a document to start chatting.
          </p>
        </div>

        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          {documents.length}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {documents.map((document) => {
          const isSelected =
            selectedDocument?.filename === document.filename;

          return (
            <button
              key={document.filename}
              type="button"
              onClick={() => onSelect(document)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                isSelected
                  ? "border-black bg-zinc-50"
                  : "border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <FileText size={18} className="text-zinc-600" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-800">
                  {document.filename}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {document.pages}{" "}
                  {document.pages === 1 ? "page" : "pages"} ·{" "}
                  {document.chunk_count} chunks
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}