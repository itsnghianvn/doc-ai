"use client";

import { FileText, Plus } from "lucide-react";

import type { Document } from "@/types/document";
import { DocumentList } from "@/components/document/document-list";

type SidebarProps = {
  documents: Document[];
  selectedDocument: Document | null;
  onSelectDocument: (document: Document) => void;
  onDeleteDocument: (documentId: string) => Promise<void>;
  onUploadClick: () => void;
};

export function Sidebar({
  documents,
  selectedDocument,
  onSelectDocument,
  onDeleteDocument,
  onUploadClick,
}: SidebarProps) {
  return (
    <aside className="flex h-screen w-[280px] shrink-0 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black">
            <FileText size={16} className="text-white" />
          </div>

          <div>
            <h1 className="text-sm font-semibold text-zinc-900">
              DocAI
            </h1>

            <p className="text-[10px] text-zinc-400">
              Document intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="p-4">
        <button
          type="button"
          onClick={onUploadClick}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          <Plus size={17} />
          Upload PDF
        </button>
      </div>

      {/* Documents */}
      <div className="min-h-0 flex-1 px-3 pb-4">
        <DocumentList
          documents={documents}
          selectedDocument={selectedDocument}
          onSelect={onSelectDocument}
          onDelete={onDeleteDocument}
        />
      </div>

      {/* Footer */}
      <div className="border-t px-5 py-4">
        <p className="text-[11px] text-zinc-400">
          AI-powered document assistant
        </p>
      </div>
    </aside>
  );
}