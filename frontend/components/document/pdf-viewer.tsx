"use client";

import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
} from "lucide-react";

import type { Document } from "@/types/document";

type PdfViewerProps = {
  document: Document | null;
  page: number | null;
  onPageChange: (page: number) => void;
};

export function PdfViewer({
  document,
  page,
  onPageChange,
}: PdfViewerProps) {
  const currentPage = Math.min(
    Math.max(page ?? 1, 1),
    document?.pages ?? 1
  );
  const baseUrl = document?.filename
    ? `${process.env.NEXT_PUBLIC_API_URL}/upload/${encodeURIComponent(
        document.filename
      )}`
    : null;
  const pdfUrl = baseUrl
    ? `${baseUrl}#page=${currentPage}`
    : null;

  const changePage = (nextPage: number) => {
    if (!document) {
      return;
    }

    onPageChange(
      Math.min(Math.max(nextPage, 1), document.pages)
    );
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <FileText
            size={16}
            className="shrink-0 text-zinc-500"
          />

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-zinc-900">
              {document?.filename ?? "Document"}
            </h3>

            {document && (
              <p className="text-[11px] text-zinc-400">
                {document.pages}{" "}
                {document.pages === 1 ? "page" : "pages"}
              </p>
            )}
          </div>
        </div>

        {document && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <label className="flex items-center gap-1 text-xs text-zinc-500">
              <span className="sr-only">Current page</span>
              <input
                type="number"
                min={1}
                max={document.pages}
                value={currentPage}
                onChange={(event) =>
                  changePage(Number(event.target.value))
                }
                className="h-8 w-11 rounded-lg border border-zinc-200 bg-white px-1 text-center text-xs font-medium text-zinc-700 outline-none focus:border-zinc-400"
              />
              <span>/ {document.pages}</span>
            </label>

            <button
              type="button"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage >= document.pages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>

            <a
              href={pdfUrl ?? undefined}
              target="_blank"
              rel="noreferrer"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100"
              aria-label="Open PDF in a new tab"
              title="Open in new tab"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 bg-zinc-100">
        {pdfUrl ? (
          <iframe
            key={pdfUrl}
            src={pdfUrl}
            title={`PDF document: ${document?.filename}`}
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                <FileText
                  size={22}
                  className="text-zinc-300"
                />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-zinc-700">
                No document selected
              </h3>

              <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-400">
                Upload or select a PDF to start exploring it.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
