import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import { ThemeProvider } from "@/components/layout/theme-provider";


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

vi.mock("@/components/document/pdf-viewer", () => ({
  PdfViewer: ({
    document,
    page,
    source,
  }: {
    document: { filename: string } | null;
    page: number | null;
    source?: { content: string } | null;
  }) => (
    <div
      data-testid="pdf-viewer"
      data-page={page ?? 1}
      data-source={source?.content ?? ""}
    >
      {document?.filename ?? "No document"}
    </div>
  ),
}));

const sampleDocument = {
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
  document_id: sampleDocument.document_id,
  title: "New conversation",
  created_at: "2026-09-14T00:00:00Z",
  updated_at: "2026-09-14T00:00:00Z",
};

function renderHome() {
  return render(
    <ThemeProvider>
      <Home />
    </ThemeProvider>
  );
}

describe("DocAI workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";

    apiMocks.getDocuments.mockResolvedValue([sampleDocument]);
    apiMocks.getConversations.mockResolvedValue([]);
    apiMocks.getConversationMessages.mockResolvedValue([]);
    apiMocks.createConversation.mockResolvedValue(conversation);
    apiMocks.chatWithDocument.mockResolvedValue({
      answer: "The answer is on page two.",
      sources: [
        {
          chunk_id: "chunk-1",
          document_id: sampleDocument.document_id,
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

  it("shows a recoverable error when the backend is unavailable", async () => {
    apiMocks.getDocuments.mockRejectedValueOnce(
      new Error("connection refused")
    );

    renderHome();

    expect(
      await screen.findByText("Failed to load documents.")
    ).toBeInTheDocument();
    expect(screen.getByText("DocAI")).toBeInTheDocument();
  });

  it("opens the document-ready dashboard by default", async () => {
    renderHome();

    expect(
      await screen.findByText("Your document is ready")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /What is the main topic of this document/,
      })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("pdf-viewer")).not.toBeInTheDocument();
  });

  it("opens the PDF workspace from View document", async () => {
    const user = userEvent.setup();
    renderHome();

    await screen.findByText("Your document is ready");
    await user.click(
      screen.getByRole("button", { name: "View document" })
    );

    expect(screen.getByTestId("pdf-viewer")).toHaveTextContent(
      "guide.pdf"
    );
    expect(
      screen.queryByText("Your document is ready")
    ).not.toBeInTheDocument();
  });

  it("navigates the PDF when a retrieved source is clicked", async () => {
    const user = userEvent.setup();
    renderHome();

    const input = await screen.findByPlaceholderText(
      "Ask something about your document..."
    );
    await user.type(input, "Where is the evidence?{enter}");

    expect(
      await screen.findByText("The answer is on page two.")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("pdf-viewer")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Open source on page 2",
      })
    );

    const viewer = screen.getByTestId("pdf-viewer");
    expect(viewer).toHaveAttribute("data-page", "2");
    expect(viewer).toHaveAttribute(
      "data-source",
      "This evidence comes from page two."
    );

    await waitFor(() => {
      expect(apiMocks.chatWithDocument).toHaveBeenCalledWith(
        "Where is the evidence?",
        sampleDocument.document_id,
        [],
        conversation.conversation_id
      );
    });
  });

  it("removes an optimistic message when chat fails", async () => {
    apiMocks.chatWithDocument.mockRejectedValueOnce(
      new Error("provider unavailable")
    );
    const user = userEvent.setup();
    renderHome();

    const input = await screen.findByPlaceholderText(
      "Ask something about your document..."
    );
    await user.type(input, "Question that fails{enter}");

    expect(
      await screen.findByText(
        "Failed to get an answer. Please try again."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Question that fails")
    ).not.toBeInTheDocument();
  });

  it("switches the selected document from the document list", async () => {
    const secondDocument = {
      ...sampleDocument,
      document_id: "document-456",
      filename: "second.pdf",
    };
    apiMocks.getDocuments.mockResolvedValue([
      sampleDocument,
      secondDocument,
    ]);
    const user = userEvent.setup();

    renderHome();

    await user.click(
      await screen.findByRole("button", {
        name: /^second\.pdf/,
      })
    );

    expect(
      await screen.findByRole("heading", { name: "second.pdf" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("pdf-viewer")).not.toBeInTheDocument();
    expect(apiMocks.getConversations).toHaveBeenCalledWith(
      secondDocument.document_id
    );

    await user.click(
      screen.getByRole("button", { name: "View document" })
    );
    expect(screen.getByTestId("pdf-viewer")).toHaveTextContent(
      "second.pdf"
    );
  });

  it("persists the selected color theme", async () => {
    const user = userEvent.setup();
    renderHome();

    const darkToggle = await screen.findByRole("button", {
      name: "Use dark theme",
    });
    await waitFor(() => expect(darkToggle).toBeEnabled());
    await user.click(darkToggle);

    expect(document.documentElement.classList.contains("dark")).toBe(
      true
    );
    expect(window.localStorage.getItem("docai-theme")).toBe("dark");

    const lightToggle = screen.getByRole("button", {
      name: "Use light theme",
    });
    await user.click(lightToggle);

    expect(document.documentElement.classList.contains("dark")).toBe(
      false
    );
    expect(window.localStorage.getItem("docai-theme")).toBe("light");
  });
});
