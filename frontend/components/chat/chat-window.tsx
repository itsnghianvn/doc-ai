"use client";

import {
  Bot,
  FileText,
  Loader2,
  MessageSquarePlus,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import type { Message, Source } from "@/types/chat";
import type { Conversation } from "@/types/conversation";

type ChatWindowProps = {
  messages: Message[];
  question: string;
  chatLoading: boolean;
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onQuestionChange: (value: string) => void;
  onChat: () => void;
  onNewConversation: () => void;
  onConversationChange: (conversationId: string) => void;
  onRenameConversation: () => void;
  onDeleteConversation: () => void;
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
  conversations,
  selectedConversation,
  messagesEndRef,
  onQuestionChange,
  onChat,
  onNewConversation,
  onConversationChange,
  onRenameConversation,
  onDeleteConversation,
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
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <div className="flex min-h-8 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot size={16} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-foreground">
                Chat with your document
              </h2>

              <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                Answers are grounded in the selected PDF.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNewConversation}
            disabled={chatLoading}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            title="Start a new conversation"
          >
            <MessageSquarePlus size={14} />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </div>

        {conversations.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            <select
              value={
                selectedConversation?.conversation_id ?? ""
              }
              onChange={(event) =>
                onConversationChange(event.target.value)
              }
              disabled={chatLoading}
              className="min-w-0 flex-1 truncate rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-muted-foreground outline-none focus:border-primary/50"
              aria-label="Select conversation"
            >
              {conversations.map((conversation) => (
                <option
                  key={conversation.conversation_id}
                  value={conversation.conversation_id}
                >
                  {conversation.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onRenameConversation}
              disabled={!selectedConversation || chatLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
              aria-label="Rename conversation"
            >
              <Pencil size={13} />
            </button>

            <button
              type="button"
              onClick={onDeleteConversation}
              disabled={!selectedConversation || chatLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
              aria-label="Delete conversation"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {messages.length === 0 && !chatLoading && (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <FileText
                size={22}
                className="text-muted-foreground"
              />
            </div>

            <h3 className="mt-5 text-base font-semibold text-foreground">
              Start a conversation
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Ask questions about your document and
              DocAI will find the most relevant information
              for you.
            </p>

            <div className="mt-6 w-full max-w-xl">
              <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles size={13} />
                Try asking
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {suggestedQuestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onSuggestionClick(suggestion)}
                    className="rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/30 hover:bg-accent hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
              sources={message.sources}
              onSourceClick={onSourceClick}
            />
          ))}

          {chatLoading && (
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot size={16} />
              </div>

              <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />

                  <span>DocAI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card p-3 sm:p-4">
        <ChatInput
          value={question}
          onChange={onQuestionChange}
          onSubmit={onChat}
          loading={chatLoading}
          onKeyDown={onKeyDown}
        />

        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          DocAI answers based on the selected document.
        </p>
      </div>
    </section>
  );
}
