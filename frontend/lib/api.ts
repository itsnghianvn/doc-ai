import axios from "axios";

import type { ChatResponse, Message } from "@/types/chat";
import type {
  Conversation,
  ConversationMessage,
} from "@/types/conversation";
import type { Document } from "@/types/document";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is required. Configure it in .env.local."
  );
}

const api = axios.create({
  baseURL: apiBaseUrl,
});

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
) => {
  if (
    axios.isAxiosError(error) &&
    typeof error.response?.data?.detail === "string"
  ) {
    return error.response.data.detail;
  }

  return fallback;
};

export const uploadDocument = async (
  file: File,
): Promise<Document> => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post<Document>(
    "/upload/",
    formData
  );

  return response.data;
};

export const chatWithDocument = async (
  question: string,
  documentId: string,
  history: Message[] = [],
  conversationId?: string,
): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>("/chat", {
    question,
    document_id: documentId,
    history,
    conversation_id: conversationId,
  });

  return response.data;
};

export const getDocuments = async (): Promise<Document[]> => {
  const response = await api.get<Document[]>("/documents/");
  return response.data;
};

export const deleteDocument = async (documentId: string) => {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data;
};

export const getConversations = async (
  documentId: string,
): Promise<Conversation[]> => {
  const response = await api.get<Conversation[]>(
    `/documents/${documentId}/conversations`
  );
  return response.data;
};

export const createConversation = async (
  documentId: string,
): Promise<Conversation> => {
  const response = await api.post<Conversation>(
    `/documents/${documentId}/conversations`,
    { title: "New conversation" }
  );
  return response.data;
};

export const renameConversation = async (
  conversationId: string,
  title: string,
): Promise<Conversation> => {
  const response = await api.patch<Conversation>(
    `/conversations/${conversationId}`,
    { title }
  );
  return response.data;
};

export const deleteConversation = async (
  conversationId: string,
) => {
  const response = await api.delete(
    `/conversations/${conversationId}`
  );
  return response.data;
};

export const getConversationMessages = async (
  conversationId: string,
): Promise<ConversationMessage[]> => {
  const response = await api.get<ConversationMessage[]>(
    `/conversations/${conversationId}/messages`
  );
  return response.data;
};

export default api;