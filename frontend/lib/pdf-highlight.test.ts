import { describe, expect, it } from "vitest";

import {
  applySourceHighlight,
  findMatchingSpanIndexes,
} from "@/lib/pdf-highlight";


describe("PDF source highlighting", () => {
  it("matches a source across multiple PDF text spans", () => {
    const indexes = findMatchingSpanIndexes(
      [
        "Unrelated introduction",
        "Deep neural networks operate",
        "across millions of parameters,",
        "making their internal decisions difficult to inspect.",
      ],
      (
        "The black box problem occurs because deep neural " +
        "networks operate across millions of parameters, making " +
        "their internal decisions difficult to inspect."
      ),
    );

    expect(indexes).toEqual([1, 2, 3]);
  });

  it("adds highlight classes to matching text spans", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div class="react-pdf__Page__textContent">
        <span>AI analyzes medical imaging</span>
        <span>to detect critical conditions early</span>
        <span>Unrelated finance content</span>
      </div>
    `;

    const highlighted = applySourceHighlight(
      container,
      (
        "In healthcare AI analyzes medical imaging to detect " +
        "critical conditions early and assist doctors."
      ),
    );
    const spans = container.querySelectorAll("span");

    expect(highlighted).toBe(true);
    expect(spans[0]).toHaveClass("docai-source-highlight");
    expect(spans[1]).toHaveClass("docai-source-highlight");
    expect(spans[2]).not.toHaveClass(
      "docai-source-highlight"
    );
  });

  it("returns false when PDF text encoding prevents a match", () => {
    expect(
      findMatchingSpanIndexes(
        ["Completely different text"],
        "Expected source passage",
      )
    ).toEqual([]);
  });
});
