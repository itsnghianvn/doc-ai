import type { Source } from "@/types/chat";

/** Matches backend `RAG_RERANK_MIN_SCORE` (display relevance %). */
export const MIN_SOURCE_SCORE = 0.55;

export function filterSourcesByScore(
  sources: Source[] | undefined | null
): Source[] {
  if (!sources?.length) {
    return [];
  }

  return sources.filter((source) => source.score >= MIN_SOURCE_SCORE);
}
