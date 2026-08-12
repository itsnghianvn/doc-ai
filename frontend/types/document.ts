export type Document = {
  filename: string;
  pages: number;
  characters: number;
  chunk_count: number;
  preview?: string;
};