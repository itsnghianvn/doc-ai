type Source = {
  chunk_id: string;
  score: number;
  content: string;
  start: number;
  end: number;
};

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

export function ChatMessage({
  role,
  content,
  sources,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-black text-white"
            : "bg-zinc-100 text-zinc-900"
        }`}
      >
        {/* Sender */}
        <p
          className={`mb-1 text-xs font-medium ${
            isUser
              ? "text-zinc-300"
              : "text-zinc-500"
          }`}
        >
          {isUser ? "You" : "DocAI"}
        </p>

        {/* Message */}
        <p className="whitespace-pre-wrap text-sm leading-6">
          {content}
        </p>

        {/* Sources */}
        {!isUser &&
          sources &&
          sources.length > 0 && (
            <div className="mt-4 border-t border-zinc-200 pt-3">
              <p className="mb-2 text-xs font-semibold text-zinc-600">
                Sources
              </p>

              <div className="space-y-2">
                {sources.map((source) => (
                  <div
                    key={source.chunk_id}
                    className="rounded-lg border border-zinc-200 bg-white p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-zinc-700">
                        Document chunk
                      </span>

                      <span className="text-xs text-zinc-500">
                        Relevance:{" "}
                        {(source.score * 100).toFixed(1)}%
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-500">
                      {source.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}