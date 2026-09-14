import type { Source } from "@/types/chat";

export type Conversation = {
  conversation_id: string;
  document_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ConversationMessage = {
  message_id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[] | null;
  created_at: string;
};
