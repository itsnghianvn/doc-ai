"use client";

import {
  Bot,
  FileText,
  Loader2,
  MessageSquarePlus,
  Sparkles,
} from "lucide-react";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import type { Message, Source } from "@/types/chat";

type ChatWindowProps = {
  messages: Message[];
  question: string;
  chatLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onQuestionChange: (value: string) => void;
  onChat: () => void;
  onNewConversation: () => void;
  onSuggestionClick: (question: string) => void;
  onKeyDown: (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => void;
  onSourceClick?: (source: Source) => void;
};

export function ChatWindow({
  messages,
  question,
  chatLoading,
  messagesEndRef,
  onQuestionChange,
  onChat,
  onNewConversation,
  onSuggestionClick,
  onKeyDown,
  onSourceClick,
}: ChatWindowProps) {
  const suggestedQuestions = [
    "Summarize this document",
    "What are the main ideas?",
    "What are the key applications?",
  ];

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black text-white">
            <Bot size={16} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-zinc-900">
              Chat with your document
            </h2>

            <p className="mt-0.5 hidden text-xs text-zinc-500 sm:block">
              Answers are grounded in the selected PDF.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNewConversation}
          disabled={messages.length === 0 || chatLoading}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          title="Clear the current conversation"
        >
          <MessageSquarePlus size={14} />
          <span className="hidden sm:inline">New chat</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {/* Empty state */}
        {messages.length === 0 && !chatLoading && (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
              <FileText
                size={22}
                className="text-zinc-500"
              />
            </div>

            <h3 className="mt-5 text-base font-semibold text-zinc-900">
              Start a conversation
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Ask questions about your document and
              DocAI will find the most relevant information
              for you.
            </p>

            {/* Suggested questions */}
            <div className="mt-6 w-full max-w-xl">
              <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-500">
                <Sparkles size={13} />
                Try asking
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {suggestedQuestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onSuggestionClick(suggestion)}
                    className="rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
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
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white">
                <Bot size={16} />
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />

                  <span>DocAI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 bg-white p-3 sm:p-4">
        <ChatInput
          value={question}
          onChange={onQuestionChange}
          onSubmit={onChat}
          loading={chatLoading}
          onKeyDown={onKeyDown}
        />

        <p className="mt-2 text-center text-[11px] text-zinc-400">
          DocAI answers based on the selected document.
        </p>
      </div>
    </section>
  );
}
