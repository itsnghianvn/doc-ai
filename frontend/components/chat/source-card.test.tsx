import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SourceCard } from "@/components/chat/source-card";


describe("SourceCard", () => {
  it("disables navigation when page metadata is unavailable", () => {
    const onClick = vi.fn();

    render(
      <SourceCard
        source={{
          chunk_id: "chunk-1",
          document_id: "document-1",
          score: 0.8,
          retrieval_score: 0.8,
          content: "Source content.",
          start: 0,
          end: 15,
          page_start: null,
          page_end: null,
        }}
        onClick={onClick}
      />
    );

    expect(
      screen.getByRole("button", {
        name: "Source page unavailable",
      })
    ).toBeDisabled();
    expect(
      screen.getByText("Page unavailable")
    ).toBeInTheDocument();
    expect(onClick).not.toHaveBeenCalled();
  });
});
