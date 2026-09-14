import {
  ArrowUpRight,
  FileText,
} from "lucide-react";

import type { Source } from "@/types/chat";

type SourceCardProps = {
  source: Source;
  onClick?: () => void;
};

export function SourceCard({
  source,
  onClick,
}: SourceCardProps) {
  const relevance = source.score * 100;

  const pageLabel =
    source.page_start && source.page_end
      ? source.page_start === source.page_end
        ? `Page ${source.page_start}`
        : `Pages ${source.page_start}–${source.page_end}`
      : "Document source";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!source.page_start}
      aria-label={
        source.page_start
          ? `Open source on ${pageLabel.toLowerCase()}`
          : "Source page unavailable"
      }
      className="group w-full rounded-xl border border-zinc-200 bg-white p-3.5 text-left transition hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-1 disabled:cursor-default disabled:hover:border-zinc-200 disabled:hover:bg-white disabled:hover:shadow-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
            <FileText
              size={14}
              className="text-zinc-500"
            />
          </div>

          <span className="truncate text-xs font-medium text-zinc-700">
            {pageLabel}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-xs font-medium text-zinc-500">
            {relevance.toFixed(1)}%
          </span>

          {source.page_start && (
            <ArrowUpRight
              size={14}
              className="text-zinc-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-700"
            />
          )}
        </div>
      </div>

      {/* Relevance bar */}
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-zinc-700 transition-all"
          style={{
            width: `${Math.min(relevance, 100)}%`,
          }}
        />
      </div>

      {/* Excerpt */}
      <p className="mt-3 line-clamp-3 text-xs leading-5 text-zinc-500">
        {source.content}
      </p>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400">
          Source excerpt
        </span>

        {source.page_start ? (
          <span className="text-[11px] font-medium text-zinc-500 transition group-hover:text-zinc-900">
            View source →
          </span>
        ) : (
          <span className="text-[11px] text-zinc-400">
            Page unavailable
          </span>
        )}
      </div>
    </button>
  );
}