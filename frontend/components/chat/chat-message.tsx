import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";

import { SourceCard } from "@/components/chat/source-card";
import type { Source } from "@/types/chat";

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
      className={`flex gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot size={16} />
        </div>
      )}

      <div
        className={`min-w-0 ${
          isUser
            ? "max-w-[88%] sm:max-w-[80%]"
            : "max-w-[calc(100%-2.75rem)] sm:max-w-[85%]"
        }`}
      >
        {/* Sender */}
        <div
          className={`mb-1.5 flex items-center gap-2 text-xs font-medium ${
            isUser
              ? "justify-end text-muted-foreground"
              : "text-muted-foreground"
          }`}
        >
          {isUser && <span>You</span>}
          {isUser && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
              <User size={13} className="text-muted-foreground" />
            </div>
          )}
          {!isUser && <span>DocAI</span>}
        </div>

        {/* Message bubble */}
        <div
          className={
            isUser
              ? "rounded-2xl bg-primary px-4 py-3 text-primary-foreground"
              : "py-1 text-foreground"
          }
        >
          <div
            className={`text-sm leading-6 ${
              isUser ? "text-primary-foreground" : "text-foreground"
            }`}
          >
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

                li: ({ children }) => <li>{children}</li>,

                code: ({ children }) => (
                  <code
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      isUser
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {children}
                  </code>
                ),

                pre: ({ children }) => (
                  <pre className="mb-3 overflow-x-auto rounded-lg bg-foreground p-3 text-xs text-background last:mb-0">
                    {children}
                  </pre>
                ),

                h1: ({ children }) => (
                  <h1 className="mb-3 text-lg font-semibold">
                    {children}
                  </h1>
                ),

                h2: ({ children }) => (
                  <h2 className="mb-2 text-base font-semibold">
                    {children}
                  </h2>
                ),

                h3: ({ children }) => (
                  <h3 className="mb-2 text-sm font-semibold">
                    {children}
                  </h3>
                ),

                blockquote: ({ children }) => (
                  <blockquote className="mb-3 border-l-2 border-border pl-3 text-muted-foreground">
                    {children}
                  </blockquote>
                ),

                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-border underline-offset-2 hover:decoration-foreground"
                  >
                    {children}
                  </a>
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
              <div className="mt-4 border-t border-border pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">
                    Sources
                  </p>

                  <span className="text-xs text-muted-foreground">
                    {sources.length}{" "}
                    {sources.length === 1
                      ? "source"
                      : "sources"}
                  </span>
                </div>

                <div className="space-y-2">
                  {sources.map((source) => (
                    <SourceCard
                      key={source.chunk_id}
                      source={source}
                      onClick={() =>
                        onSourceClick?.(source)
                      }
                    />
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}