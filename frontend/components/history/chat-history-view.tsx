"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  History,
  Loader2,
  MessageSquareText,
  Search,
  Trash2,
} from "lucide-react";

import { getAllConversations, getApiErrorMessage } from "@/lib/api";
import type { ConversationWithDocument } from "@/types/conversation";

type ChatHistoryViewProps = {
  onOpenConversation: (
    conversation: ConversationWithDocument
  ) => void;
  onDeleteConversation: (conversationId: string) => Promise<void>;
};

export function ChatHistoryView({
  onOpenConversation,
  onDeleteConversation,
}: ChatHistoryViewProps) {
  const [items, setItems] = useState<ConversationWithDocument[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getAllConversations();
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              err,
              "Failed to load chat history."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        (item.document_filename ?? "")
          .toLowerCase()
          .includes(query)
    );
  }, [items, search]);

  const refreshList = async () => {
    const data = await getAllConversations();
    setItems(data);
  };

  const handleDelete = async (
    conversation: ConversationWithDocument
  ) => {
    if (
      !window.confirm(`Delete "${conversation.title}"?`)
    ) {
      return;
    }

    try {
      await onDeleteConversation(conversation.conversation_id);
      await refreshList();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Failed to delete the conversation."
        )
      );
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <History size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Chat history
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              All conversations across your documents, newest first.
            </p>
          </div>
        </div>

        <label className="relative mt-6 block">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or document..."
            className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
        </label>

        {error && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              Loading conversations...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquareText
                size={28}
                className="text-muted-foreground/50"
              />
              <p className="mt-4 text-sm font-medium">
                {search.trim()
                  ? "No matching conversations"
                  : "No conversations yet"}
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Start chatting from a document dashboard to see history here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2 pb-4">
              {filtered.map((conversation) => (
                <li key={conversation.conversation_id}>
                  <div className="flex items-stretch gap-2 rounded-xl border border-border bg-card transition hover:border-primary/25">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenConversation(conversation)
                      }
                      className="min-w-0 flex-1 px-4 py-3 text-left"
                    >
                      <p className="truncate text-sm font-medium">
                        {conversation.title}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <FileText size={11} />
                          {conversation.document_filename ??
                            "Unknown document"}
                        </span>
                        <span>
                          {new Date(
                            conversation.updated_at
                          ).toLocaleString()}
                        </span>
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(conversation)}
                      className="flex w-10 shrink-0 items-center justify-center rounded-r-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Delete ${conversation.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
