export type Document = {
  document_id: string;
  filename: string;
  pages: number;
  characters: number;
  chunk_count: number;
  chunks: unknown[];
  preview: string;
};