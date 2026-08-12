import { FileText } from "lucide-react";

import type { Document } from "@/types/document";

type DocumentCardProps = {
  document: Document;
};

export function DocumentCard({ document }: DocumentCardProps) {
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