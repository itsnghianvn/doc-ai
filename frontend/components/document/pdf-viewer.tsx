"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  Document as ReactPdfDocument,
  Page,
  pdfjs,
} from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";

import {
  applySourceHighlight,
  clearSourceHighlight,
} from "@/lib/pdf-highlight";
import type { Source } from "@/types/chat";
import type { Document } from "@/types/document";


pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type PdfViewerProps = {
  document: Document | null;
  page: number | null;
  source?: Source | null;
  onPageChange: (page: number) => void;
};

export function PdfViewer({
  document,
  page,
  source,
  onPageChange,
}: PdfViewerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(600);
  const [loadedPages, setLoadedPages] = useState<number | null>(
    null
  );
  const [renderedTextLayer, setRenderedTextLayer] =
    useState("");
  const [zoom, setZoom] = useState(1);
  const [highlightResult, setHighlightResult] = useState<{
    key: string;
    found: boolean;
  } | null>(null);

  const totalPages = Math.max(
    loadedPages ?? document?.pages ?? 1,
    1
  );
  const currentPage = Math.min(
    Math.max(page ?? 1, 1),
    totalPages
  );
  const pdfUrl = document?.document_id
    ? `${process.env.NEXT_PUBLIC_API_URL}/documents/${encodeURIComponent(
        document.document_id
      )}/file`
    : null;
  const renderedLayerKey = document
    ? `${document.document_id}:${currentPage}`
    : "";
  const highlightKey = source
    ? `${renderedLayerKey}:${source.chunk_id}`
    : "";
  const highlightState =
    highlightResult?.key === highlightKey
      ? highlightResult.found
        ? "found"
        : "missing"
      : "searching";

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const updateWidth = () => {
      setViewportWidth(Math.max(viewport.clientWidth, 280));
    };
    const observer = new ResizeObserver(updateWidth);

    updateWidth();
    observer.observe(viewport);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (
      !viewport ||
      !source ||
      source.page_start !== currentPage
    ) {
      if (viewport) {
        clearSourceHighlight(viewport);
      }
      return;
    }

    if (renderedTextLayer !== renderedLayerKey) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const found = applySourceHighlight(
        viewport,
        source.content
      );
      setHighlightResult({
        key: highlightKey,
        found,
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    currentPage,
    highlightKey,
    renderedLayerKey,
    renderedTextLayer,
    source,
  ]);

  const changePage = (nextPage: number) => {
    if (!document) {
      return;
    }

    onPageChange(
      Math.min(Math.max(nextPage, 1), totalPages)
    );
  };

  const changeZoom = (nextZoom: number) => {
    setRenderedTextLayer("");
    setZoom(Math.min(Math.max(nextZoom, 0.7), 2));
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <FileText
            size={16}
            className="shrink-0 text-muted-foreground"
          />

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {document?.filename ?? "Document"}
            </h3>

            {document && (
              <p className="text-[11px] text-muted-foreground">
                {totalPages}{" "}
                {totalPages === 1 ? "page" : "pages"}
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
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="sr-only">Current page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(event) =>
                  changePage(Number(event.target.value))
                }
                className="h-8 w-11 rounded-lg border border-input bg-background px-1 text-center text-xs font-medium text-foreground outline-none focus:border-primary/50"
              />
              <span>/ {totalPages}</span>
            </label>

            <button
              type="button"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>

            <div className="mx-1 h-5 w-px bg-border" />

            <button
              type="button"
              onClick={() => changeZoom(zoom - 0.15)}
              disabled={zoom <= 0.7}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:opacity-30 sm:flex"
              aria-label="Zoom out"
            >
              <ZoomOut size={15} />
            </button>

            <button
              type="button"
              onClick={() => changeZoom(zoom + 0.15)}
              disabled={zoom >= 2}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:opacity-30 sm:flex"
              aria-label="Zoom in"
            >
              <ZoomIn size={15} />
            </button>

            <a
              href={`${pdfUrl}#page=${currentPage}`}
              target="_blank"
              rel="noreferrer"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
              aria-label="Open PDF in a new tab"
              title="Open in new tab"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>

      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 overflow-auto bg-muted"
      >
        {source && source.page_start === currentPage && (
          <div
            className={`sticky left-3 top-3 z-20 ml-3 mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium shadow-sm ${
              highlightState === "found"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : highlightState === "missing"
                  ? "border-border bg-card text-muted-foreground"
                  : "border-border bg-card text-muted-foreground"
            }`}
          >
            {highlightState === "searching" && (
              <Loader2 size={11} className="animate-spin" />
            )}
            {highlightState === "found"
              ? "Source highlighted"
              : highlightState === "missing"
                ? "Source text not found on this page"
                : "Finding source text..."}
          </div>
        )}

        {pdfUrl ? (
          <ReactPdfDocument
            file={pdfUrl}
            onLoadSuccess={({ numPages }) =>
              setLoadedPages(numPages)
            }
            loading={
              <ViewerMessage
                loading
                message="Loading PDF..."
              />
            }
            error={
              <ViewerMessage message="Unable to load this PDF." />
            }
          >
            <div className="flex min-h-full justify-center p-4">
              <Page
                key={`${document?.document_id}:${currentPage}`}
                pageNumber={currentPage}
                width={Math.max(
                  (viewportWidth - 32) * zoom,
                  248
                )}
                renderAnnotationLayer={false}
                renderTextLayer
                onRenderTextLayerSuccess={() =>
                  setRenderedTextLayer(renderedLayerKey)
                }
                loading={
                  <ViewerMessage
                    loading
                    message={`Loading page ${currentPage}...`}
                  />
                }
              />
            </div>
          </ReactPdfDocument>
        ) : (
          <ViewerMessage message="Upload or select a PDF to start exploring it." />
        )}
      </div>
    </section>
  );
}

function ViewerMessage({
  message,
  loading = false,
}: {
  message: string;
  loading?: boolean;
}) {
  return (
    <div className="flex min-h-64 items-center justify-center px-6 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-card">
          {loading ? (
            <Loader2
              size={20}
              className="animate-spin text-muted-foreground"
            />
          ) : (
            <FileText size={22} className="text-muted-foreground/50" />
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  );
}
