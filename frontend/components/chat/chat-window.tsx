"use client";

import { FileText, Loader2 } from "lucide-react";

import { ChatInput } from "@/components/chat/chat-input";

type Source = {
  chunk_id: string;
  score: number;
  content: string;
  start: number;
  end: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

type ChatWindowProps = {
  messages: Message[];
  question: string;
  chatLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onQuestionChange: (value: string) => void;
  onChat: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

export function ChatWindow({
  messages,
  question,
  chatLoading,
  messagesEndRef,
  onQuestionChange,
  onChat,
  onKeyDown,
}: ChatWindowProps) {
  return (
    <section className="mt-6 flex min-h-[550px] flex-col rounded-2xl border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h2 className="font-semibold text-zinc-900">
          Chat with your document
        </h2>

        <p className="text-sm text-zinc-500">
          Ask questions based on the uploaded PDF.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && !chatLoading && (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <FileText size={22} className="text-zinc-500" />
            </div>

            <h3 className="mt-4 font-medium text-zinc-800">
              Start a conversation
            </h3>

            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Ask anything about your uploaded document.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {messages.map((message, index) => {
            const isUser = message.role === "user";

            return (
              <div
                key={index}
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
                  <p
                    className={`mb-1 text-xs font-medium ${
                      isUser ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    {isUser ? "You" : "DocAI"}
                  </p>

                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {message.content}
                  </p>

                  {/* Sources */}
                  {!isUser &&
                    message.sources &&
                    message.sources.length > 0 && (
                      <div className="mt-4 border-t border-zinc-200 pt-3">
                        <p className="mb-2 text-xs font-semibold text-zinc-600">
                          Sources
                        </p>

                        <div className="space-y-2">
                          {message.sources.map((source) => (
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
          })}

          {chatLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-zinc-100 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Loader2 size={15} className="animate-spin" />
                  DocAI is thinking...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <ChatInput
        value={question}
        onChange={onQuestionChange}
        onSubmit={onChat}
        loading={chatLoading}
        onKeyDown={onKeyDown}
      />
    </section>
  );
}