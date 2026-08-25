"use client";

import { FileText } from "lucide-react";

import type { Document } from "@/types/document";
import { DocumentCard } from "./document-card";

type DocumentListProps = {
  documents: Document[];
  selectedDocument: Document | null;
  onSelect: (document: Document) => void;
  onDelete: (documentId: string) => Promise<void>;
};

export function DocumentList({
  documents,
  selectedDocument,
  onSelect,
  onDelete,
}: DocumentListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Documents
        </p>

        {documents.length > 0 && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
            {documents.length}
          </span>
        )}
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
              <FileText
                size={18}
                className="text-zinc-400"
              />
            </div>

            <p className="mt-3 text-sm font-medium text-zinc-700">
              No documents
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-400">
              Upload a PDF to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map((document) => (
              <DocumentCard
                key={document.document_id}
                document={document}
                selected={
                  selectedDocument?.document_id ===
                  document.document_id
                }
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}