import { describe, expect, it, vi } from "vitest";

import {
  applySourceHighlight,
  clearSourceHighlight,
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
      <div class="react-pdf__Page">
        <div class="react-pdf__Page__textContent">
          <span>AI analyzes medical imaging</span>
          <span>to detect critical conditions early</span>
          <span>Unrelated finance content</span>
        </div>
      </div>
    `;
    const page = container.querySelector<HTMLElement>(
      ".react-pdf__Page"
    )!;
    const spans = container.querySelectorAll("span");
    vi.spyOn(page, "getBoundingClientRect").mockReturnValue(
      createRect(10, 20, 600, 800)
    );
    vi.spyOn(spans[0], "getClientRects").mockReturnValue(
      [createRect(30, 50, 180, 14)] as unknown as DOMRectList
    );
    vi.spyOn(spans[1], "getClientRects").mockReturnValue(
      [createRect(30, 66, 210, 14)] as unknown as DOMRectList
    );

    const highlighted = applySourceHighlight(
      container,
      (
        "In healthcare AI analyzes medical imaging to detect " +
        "critical conditions early and assist doctors."
      ),
    );
    expect(highlighted).toBe(true);
    expect(spans[0]).toHaveClass("docai-source-highlight");
    expect(spans[1]).toHaveClass("docai-source-highlight");
    expect(spans[2]).not.toHaveClass(
      "docai-source-highlight"
    );
    expect(
      page.querySelectorAll(".docai-source-highlight-overlay")
    ).toHaveLength(2);
    expect(
      page.querySelector<HTMLElement>(
        ".docai-source-highlight-overlay"
      )
    ).toHaveStyle({
      left: "20px",
      top: "30px",
    });

    clearSourceHighlight(container);
    expect(
      page.querySelectorAll(".docai-source-highlight-overlay")
    ).toHaveLength(0);
    expect(spans[0]).not.toHaveClass(
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

const createRect = (
  left: number,
  top: number,
  width: number,
  height: number,
): DOMRect =>
  ({
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width,
    x: left,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;
