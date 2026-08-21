"use client";

import { FileText, Loader2 } from "lucide-react";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";

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
  onKeyDown: (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => void;
  onSourceClick: (source: Source) => void;
};

export function ChatWindow({
  messages,
  question,
  chatLoading,
  messagesEndRef,
  onQuestionChange,
  onChat,
  onKeyDown,
  onSourceClick,
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
        {/* Empty state */}
        {messages.length === 0 && !chatLoading && (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <FileText
                size={22}
                className="text-zinc-500"
              />
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
          {/* Chat messages */}
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
              sources={message.sources}
              onSourceClick={onSourceClick}
            />
          ))}

          {/* Loading */}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-zinc-100 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />

                  DocAI is thinking...
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
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