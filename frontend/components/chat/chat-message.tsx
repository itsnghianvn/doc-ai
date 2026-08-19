import { SourceCard } from "@/components/chat/source-card";

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
                  <SourceCard
                    key={source.chunk_id}
                    source={source}
                  />
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
