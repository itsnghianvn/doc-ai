export type Source = {
  chunk_id: string;
  document_id: string;
  chunk_index?: number | null;
  score: number;
  content: string;
  start: number;
  end: number;
  page_start?: number | null;
  page_end?: number | null;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

export type ChatResponse = {
  answer: string;
  sources: Source[];
};
