import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatMessage } from "@/components/chat/chat-message";


describe("ChatMessage", () => {
  it("does not render unsafe markdown link protocols", () => {
    render(
      <ChatMessage
        role="assistant"
        content={
          "[unsafe](javascript:alert('xss')) " +
          "[safe](https://example.com)"
        }
      />
    );

    expect(
      screen.getByText("unsafe").closest("a")
    ).toHaveAttribute("href", "");
    expect(
      screen.getByRole("link", { name: "safe" })
    ).toHaveAttribute("href", "https://example.com");
  });
});
