import { ArrowUpRight } from "lucide-react";

import type { Source } from "@/types/chat";

type SourceCardProps = {
  source: Source;
  onClick?: () => void;
};

export function SourceCard({
  source,
  onClick,
}: SourceCardProps) {
  const relevance = Math.round(
    Math.max(0, Math.min(source.score, 1)) * 100
  );

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
      className="group w-full rounded-lg border border-zinc-200 bg-white p-3 text-left transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:cursor-default disabled:bg-zinc-50/50"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-xs font-medium text-zinc-700">
          {pageLabel}
        </span>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[11px] text-zinc-400">
            {relevance}% relevant
          </span>

          {source.page_start && (
            <ArrowUpRight
              size={13}
              className="text-zinc-400 transition group-hover:text-zinc-700"
            />
          )}
        </div>
      </div>

      <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-500">
        {source.content}
      </p>

      {!source.page_start && (
        <p className="mt-1.5 text-[11px] text-zinc-400">
          Page unavailable
        </p>
      )}
    </button>
  );
}