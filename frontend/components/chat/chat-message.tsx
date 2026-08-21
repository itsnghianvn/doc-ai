import ReactMarkdown from "react-markdown";

import { SourceCard } from "@/components/chat/source-card";

type Source = {
  chunk_id: string;
  score: number;
  content: string;
  start: number;
  end: number;
  page_start?: number | null;
  page_end?: number | null;
};

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  onSourceClick?: (source: Source) => void;
};

export function ChatMessage({
  role,
  content,
  sources,
  onSourceClick,
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
            isUser ? "text-zinc-300" : "text-zinc-500"
          }`}
        >
          {isUser ? "You" : "DocAI"}
        </p>

        {/* Message */}
        <div className="text-sm leading-6">
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="mb-3 last:mb-0">
                  {children}
                </p>
              ),

              strong: ({ children }) => (
                <strong className="font-semibold">
                  {children}
                </strong>
              ),

              ul: ({ children }) => (
                <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
                  {children}
                </ul>
              ),

              ol: ({ children }) => (
                <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
                  {children}
                </ol>
              ),

              li: ({ children }) => (
                <li>{children}</li>
              ),

              code: ({ children }) => (
                <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs">
                  {children}
                </code>
              ),

              pre: ({ children }) => (
                <pre className="mb-3 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
                  {children}
                </pre>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

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
                    onClick={() => onSourceClick?.(source)}
                  />
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}