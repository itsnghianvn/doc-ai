"use client";

import type { FormEvent } from "react";
import { Send, Loader2 } from "lucide-react";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  loading = false,
  onKeyDown,
}: ChatInputProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!value.trim() || loading) {
      return;
    }

    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask something about your document..."
          disabled={loading}
          rows={1}
          className="min-h-11 max-h-32 flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:bg-muted"
        />

        <button
          type="submit"
          disabled={!value.trim() || loading}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
          aria-label="Send message"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Press Enter to send · Shift + Enter for a new line
      </p>
    </form>
  );
}
