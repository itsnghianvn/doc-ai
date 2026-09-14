import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";


const apiMocks = vi.hoisted(() => ({
  chatWithDocument: vi.fn(),
  createConversation: vi.fn(),
  deleteConversation: vi.fn(),
  deleteDocument: vi.fn(),
  getConversationMessages: vi.fn(),
  getConversations: vi.fn(),
  getDocuments: vi.fn(),
  renameConversation: vi.fn(),
  uploadDocument: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  ...apiMocks,
  getApiErrorMessage: (_: unknown, fallback: string) =>
    fallback,
}));

const document = {
  document_id: "document-123",
  filename: "guide.pdf",
  pages: 3,
  characters: 1200,
  chunk_count: 4,
  preview: "A useful guide.",
  status: "ready" as const,
  error_message: null,
  created_at: "2026-09-14T00:00:00Z",
};

const conversation = {
  conversation_id: "conversation-123",
  document_id: document.document_id,
  title: "New conversation",
  created_at: "2026-09-14T00:00:00Z",
  updated_at: "2026-09-14T00:00:00Z",
};

describe("DocAI workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";

    apiMocks.getDocuments.mockResolvedValue([document]);
    apiMocks.getConversations.mockResolvedValue([]);
    apiMocks.getConversationMessages.mockResolvedValue([]);
    apiMocks.createConversation.mockResolvedValue(conversation);
    apiMocks.chatWithDocument.mockResolvedValue({
      answer: "The answer is on page two.",
      sources: [
        {
          chunk_id: "chunk-1",
          document_id: document.document_id,
          chunk_index: 1,
          score: 0.92,
          retrieval_score: 0.86,
          rerank_score: 0.95,
          content: "This evidence comes from page two.",
          start: 100,
          end: 140,
          page_start: 2,
          page_end: 2,
        },
      ],
    });
  });

  it("navigates the PDF when a retrieved source is clicked", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const input = await screen.findByPlaceholderText(
      "Ask something about your document..."
    );
    await user.type(input, "Where is the evidence?{enter}");

    expect(
      await screen.findByText("The answer is on page two.")
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Open source on page 2",
      })
    );

    const viewer = screen.getByTitle(
      "PDF document: guide.pdf"
    );
    expect(viewer.getAttribute("src")).toContain("#page=2");

    await waitFor(() => {
      expect(apiMocks.chatWithDocument).toHaveBeenCalledWith(
        "Where is the evidence?",
        document.document_id,
        [],
        conversation.conversation_id
      );
    });
  });

  it("switches the selected document from the document list", async () => {
    const secondDocument = {
      ...document,
      document_id: "document-456",
      filename: "second.pdf",
    };
    apiMocks.getDocuments.mockResolvedValue([
      document,
      secondDocument,
    ]);
    const user = userEvent.setup();

    render(<Home />);

    await user.click(
      await screen.findByRole("button", {
        name: /second\.pdf/i,
      })
    );

    expect(
      await screen.findByTitle("PDF document: second.pdf")
    ).toBeInTheDocument();
    expect(apiMocks.getConversations).toHaveBeenCalledWith(
      secondDocument.document_id
    );
  });
});
