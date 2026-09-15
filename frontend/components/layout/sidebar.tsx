"use client";

import {
  FileText,
  History,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";

import type { Document } from "@/types/document";
import { DocumentList } from "@/components/document/document-list";

type SidebarProps = {
  documents: Document[];
  selectedDocument: Document | null;
  onSelectDocument: (document: Document) => void;
  onDeleteDocument: (documentId: string) => Promise<void>;
  onUploadClick: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenDashboard: () => void;
};

export function Sidebar({
  documents,
  selectedDocument,
  onSelectDocument,
  onDeleteDocument,
  onUploadClick,
  search,
  onSearchChange,
  onOpenDashboard,
}: SidebarProps) {
  const filteredDocuments = documents.filter((document) =>
    document.filename
      .toLowerCase()
      .includes((search ?? "").toLowerCase())
  );

  return (
    <aside className="hidden h-screen w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex xl:w-[280px]">
      <div className="flex h-16 items-center px-4 xl:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <FileText size={16} className="text-white" />
          </div>

          <div>
            <h1 className="text-sm font-semibold text-sidebar-foreground">
              DocAI
            </h1>

            <p className="text-[10px] text-muted-foreground">
              Document Intelligence
            </p>
          </div>
        </div>
      </div>

      <nav className="space-y-1 px-3 pb-3">
        <button
          type="button"
          onClick={onOpenDashboard}
          className="flex w-full items-center gap-2.5 rounded-lg bg-sidebar-accent px-3 py-2 text-xs font-medium text-sidebar-accent-foreground"
        >
          <FileText size={14} />
          Documents
        </button>
        <button
          type="button"
          disabled
          title="Global chat history is not available yet"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground opacity-60"
        >
          <History size={14} />
          Chat History
        </button>
        <button
          type="button"
          disabled
          title="Settings are not available yet"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground opacity-60"
        >
          <Settings size={14} />
          Settings
        </button>
      </nav>

      <div className="px-3 pb-4">
        <button
          type="button"
          onClick={onUploadClick}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-110"
        >
          <Plus size={17} />
          Upload PDF
        </button>
      </div>

      <div className="min-h-0 flex-1 px-3 pb-4">
        <label className="relative mb-3 block">
          <Search
            size={13}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <span className="sr-only">Search documents</span>
          <input
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Search documents..."
            className="h-8 w-full rounded-lg border border-sidebar-border bg-background/60 pl-8 pr-3 text-[11px] text-sidebar-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
          />
        </label>
        <DocumentList
          documents={filteredDocuments}
          selectedDocument={selectedDocument}
          onSelect={onSelectDocument}
          onDelete={onDeleteDocument}
        />
      </div>

      <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles size={15} />
          </div>
          <div>
            <p className="text-xs font-semibold">Your AI assistant</p>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              Ask questions, explore sources, and navigate exact pages.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}