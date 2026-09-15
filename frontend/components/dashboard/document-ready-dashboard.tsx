"use client";

import {
  ArrowRight,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Plus,
  Sparkles,
} from "lucide-react";

import { ChatInput } from "@/components/chat/chat-input";
import type { Document } from "@/types/document";

const PROMPTS = [
  {
    question: "What is the main topic of this document?",
    description: "Get a concise overview of the key content.",
    icon: FileText,
  },
  {
    question: "Summarize the key points in simple terms.",
    description: "Quick and easy understanding.",
    icon: Lightbulb,
  },
  {
    question: "What are the main applications mentioned?",
    description: "Find practical use cases and examples.",
    icon: MessageSquareText,
  },
];

type DocumentReadyDashboardProps = {
  document: Document | null;
  question: string;
  chatLoading: boolean;
  onQuestionChange: (value: string) => void;
  onChat: () => void;
  onSuggestionClick: (question: string) => void;
  onKeyDown: (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => void;
  onUploadClick: () => void;
};

export function DocumentReadyDashboard({
  document,
  question,
  chatLoading,
  onQuestionChange,
  onChat,
  onSuggestionClick,
  onKeyDown,
  onUploadClick,
}: DocumentReadyDashboardProps) {
  if (!document) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText size={28} />
          </div>
          <h2 className="mt-5 text-xl font-semibold">
            Add your first document
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Upload a PDF to ask questions, inspect sources, and navigate
            directly to cited pages.
          </p>
          <button
            type="button"
            onClick={onUploadClick}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-110"
          >
            <Plus size={16} />
            Upload PDF
          </button>
        </div>
      </div>
    );
  }

  if (document.status !== "ready") {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {document.status === "processing" ? (
              <Loader2 size={27} className="animate-spin" />
            ) : (
              <FileText size={27} />
            )}
          </div>
          <h2 className="mt-5 text-xl font-semibold">
            {document.status === "processing"
              ? "Preparing your document"
              : "Document processing failed"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {document.status === "processing"
              ? "Extracting pages, creating chunks, and indexing content."
              : document.error_message ||
                "Delete this document and try uploading it again."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
        <div className="docai-hero-glow relative flex h-40 w-56 items-center justify-center">
          <div className="absolute h-24 w-20 -translate-x-4 rotate-[-5deg] rounded-2xl border border-primary/15 bg-card/55" />
          <div className="absolute h-24 w-20 translate-x-4 rotate-[5deg] rounded-2xl border border-primary/15 bg-card/70" />
          <div className="relative flex h-24 w-20 flex-col rounded-2xl border border-primary/20 bg-card p-3 text-left">
            <FileText size={22} className="text-primary" />
            <span className="mt-3 h-1.5 w-12 rounded-full bg-primary/20" />
            <span className="mt-2 h-1.5 w-9 rounded-full bg-primary/15" />
            <span className="mt-2 h-1.5 w-11 rounded-full bg-primary/10" />
            <span className="absolute -right-3 bottom-3 flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageSquareText size={13} />
            </span>
          </div>
          <Sparkles
            size={17}
            className="absolute right-5 top-6 text-primary"
          />
        </div>

        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          Your document is ready
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Ask a question about the content, and DocAI will find the most
          relevant information with sources and page references.
        </p>

        <div className="mt-7 grid w-full max-w-3xl gap-3 md:grid-cols-3">
          {PROMPTS.map((prompt) => {
            const Icon = prompt.icon;
            return (
              <button
                key={prompt.question}
                type="button"
                onClick={() =>
                  onSuggestionClick(prompt.question)
                }
                disabled={chatLoading}
                className="group flex min-h-28 flex-col rounded-xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon size={15} />
                  </span>
                  <span className="text-xs font-medium leading-5">
                    {prompt.question}
                  </span>
                </div>
                <span className="mt-2 pl-11 text-[10px] leading-4 text-muted-foreground">
                  {prompt.description}
                </span>
                <ArrowRight
                  size={13}
                  className="ml-auto mt-auto text-primary transition group-hover:translate-x-0.5"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl shrink-0 px-4 pb-4 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-3">
          <ChatInput
            value={question}
            onChange={onQuestionChange}
            onSubmit={onChat}
            loading={chatLoading}
            onKeyDown={onKeyDown}
          />
          <p className="mt-1 text-right text-[9px] text-muted-foreground">
            Powered by Gemini
          </p>
        </div>
      </div>
    </div>
  );
}
