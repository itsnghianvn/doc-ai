export type Document = {
  document_id: string;
  filename: string;
  pages: number;
  characters: number;
  chunk_count: number;
  preview: string;
  status: "processing" | "ready" | "failed";
  error_message?: string | null;
  created_at: string;
};