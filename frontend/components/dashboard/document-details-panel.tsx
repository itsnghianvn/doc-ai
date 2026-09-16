"use client";

import {
  FileText,
  MessageSquarePlus,
  PanelLeftOpen,
  Trash2,
} from "lucide-react";

import type { Conversation } from "@/types/conversation";
import type { Document } from "@/types/document";

type DocumentDetailsPanelProps = {
  document: Document | null;
  conversations: Conversation[];
  onNewConversation: () => void;
  onViewDocument: () => void;
  onDeleteDocument: (documentId: string) => Promise<void>;
  onSelectConversation: (
    conversation: Conversation
  ) => Promise<void>;
};

export function DocumentDetailsPanel({
  document,
  conversations,
  onNewConversation,
  onViewDocument,
  onDeleteDocument,
  onSelectConversation,
}: DocumentDetailsPanelProps) {
  return (
    <aside className="hidden h-full w-[290px] shrink-0 overflow-y-auto border-l border-border bg-card p-4 xl:block 2xl:w-[310px]">
      <h2 className="text-xs font-semibold">Document Details</h2>

      {!document ? (
        <div className="mt-5 rounded-xl border border-dashed border-border p-5 text-center">
          <FileText
            size={21}
            className="mx-auto text-muted-foreground"
          />
          <p className="mt-3 text-xs font-medium">
            No document selected
          </p>
          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
            Select or upload a document to see its details.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-xl border border-border bg-muted/45 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <p className="break-words text-xs font-semibold leading-5">
                  {document.filename}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[10px] capitalize text-muted-foreground">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      document.status === "ready"
                        ? "bg-emerald-500"
                        : document.status === "processing"
                          ? "bg-amber-500"
                          : "bg-destructive"
                    }`}
                  />
                  {document.status}
                </p>
              </div>
            </div>
            {document.preview && (
              <p className="mt-3 line-clamp-4 text-[10px] leading-4 text-muted-foreground">
                {document.preview}
              </p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Pages" value={document.pages} />
            <Stat label="Chunks" value={document.chunk_count} />
            <Stat
              label="Characters"
              value={compactNumber(document.characters)}
            />
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quick actions
            </p>
            <div className="mt-2 space-y-2">
              <button
                type="button"
                onClick={onNewConversation}
                disabled={document.status !== "ready"}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
              >
                <MessageSquarePlus size={14} />
                New chat
              </button>
              <button
                type="button"
                onClick={onViewDocument}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-medium transition hover:bg-muted"
              >
                <PanelLeftOpen size={14} />
                View document
              </button>
              <button
                type="button"
                onClick={() =>
                  onDeleteDocument(document.document_id)
                }
                disabled={document.status === "processing"}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              >
                <Trash2 size={13} />
                Delete document
              </button>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recent conversations
            </p>
            {conversations.length === 0 ? (
              <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
                No conversations yet. Start with a suggested question.
              </p>
            ) : (
              <div className="mt-2 space-y-1">
                {conversations.slice(0, 5).map((conversation) => (
                  <button
                    key={conversation.conversation_id}
                    type="button"
                    onClick={() =>
                      void onSelectConversation(conversation)
                    }
                    className="w-full rounded-lg px-2.5 py-2 text-left transition hover:bg-muted"
                  >
                    <p className="truncate text-[11px] font-medium">
                      {conversation.title}
                    </p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                      {new Date(
                        conversation.updated_at
                      ).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-muted/70 px-2 py-2.5 text-center">
      <p className="text-sm font-semibold">{value}</p>
      <p className="mt-0.5 text-[9px] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
