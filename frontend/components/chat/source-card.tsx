type Source = {
  chunk_id: string;
  score: number;
  content: string;
  start: number;
  end: number;
};

type SourceCardProps = {
  source: Source;
  onClick?: () => void;
};

export function SourceCard({
  source,
  onClick,
}: SourceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-left transition hover:border-zinc-400 hover:bg-zinc-50"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-zinc-700">
          Document chunk
        </span>

        <span className="text-xs text-zinc-500">
          Relevance: {(source.score * 100).toFixed(1)}%
        </span>
      </div>

      <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-500">
        {source.content}
      </p>
    </button>
  );
}
