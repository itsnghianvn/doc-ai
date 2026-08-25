"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

import {
  chatWithDocument,
  deleteDocument,
  getDocuments,
  uploadDocument,
} from "@/lib/api";

import { ChatWindow } from "@/components/chat/chat-window";
import { Sidebar } from "@/components/layout/sidebar";

import type { Document } from "@/types/document";

type Source = {
  chunk_id: string;
  score: number;
  content: string;
  start: number;
  end: number;
  page_start?: number | null;
  page_end?: number | null;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<Document | null>(null);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /*
   * Load documents
   */
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const data = await getDocuments();

        setDocuments(data);

        if (data.length > 0) {
          setSelectedDocument(data[0]);
        }
      } catch (err) {
        console.error("Failed to load documents:", err);
        setError("Failed to load documents.");
      }
    };

    loadDocuments();
  }, []);

  /*
   * Auto scroll chat
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, chatLoading]);

  /*
   * Open file picker
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /*
   * Select PDF
   */
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0] ?? null;

    event.target.value = "";

    setError("");

    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }

    setFile(selectedFile);
  };

  /*
   * Upload document
   */
  const handleUpload = async () => {
    if (!file || loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await uploadDocument(file);

      setDocuments((prev) => [
        ...prev,
        data,
      ]);

      setSelectedDocument(data);

      setMessages([]);
      setQuestion("");

      setFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /*
   * Select document
   */
  const handleSelectDocument = (
    document: Document
  ) => {
    setSelectedDocument(document);

    setMessages([]);
    setQuestion("");
    setError("");
  };

  /*
   * Delete document
   */
  const handleDeleteDocument = async (
    documentId: string
  ) => {
    try {
      setError("");

      await deleteDocument(documentId);

      const remainingDocuments =
        documents.filter(
          (document) =>
            document.document_id !== documentId
        );

      setDocuments(remainingDocuments);

      if (
        selectedDocument?.document_id ===
        documentId
      ) {
        const nextDocument =
          remainingDocuments[0] ?? null;

        setSelectedDocument(nextDocument);

        setMessages([]);
        setQuestion("");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(
        "Failed to delete document. Please try again."
      );
    }
  };

  /*
   * Chat
   */
  const handleChat = async () => {
    const userQuestion = question.trim();

    if (!userQuestion || chatLoading) {
      return;
    }

    if (!selectedDocument) {
      setError("Please select a document first.");
      return;
    }

    if (!selectedDocument.document_id) {
      setError(
        "Selected document is missing document ID."
      );
      return;
    }

    try {
      setChatLoading(true);
      setError("");

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: userQuestion,
        },
      ]);

      setQuestion("");

      const data = await chatWithDocument(
        userQuestion,
        selectedDocument.document_id,
        messages
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);

      setError(
        "Failed to get an answer. Please try again."
      );
    } finally {
      setChatLoading(false);
    }
  };

  /*
   * Enter = send
   * Shift + Enter = newline
   */
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleChat();
    }
  };

  /*
   * PDF URL
   */
  const pdfUrl = selectedDocument?.filename
    ? `${process.env.NEXT_PUBLIC_API_URL}/upload/${encodeURIComponent(
        selectedDocument.filename
      )}`
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Sidebar */}
      <Sidebar
        documents={documents}
        selectedDocument={selectedDocument}
        onSelectDocument={handleSelectDocument}
        onDeleteDocument={handleDeleteDocument}
        onUploadClick={handleUploadClick}
      />

      {/* Main workspace */}
      <main className="min-w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="min-w-0">
            {selectedDocument ? (
              <>
                <h2 className="truncate text-sm font-semibold text-zinc-900">
                  {selectedDocument.filename}
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  {selectedDocument.pages}{" "}
                  {selectedDocument.pages === 1
                    ? "page"
                    : "pages"}{" "}
                  ·{" "}
                  {selectedDocument.chunk_count}{" "}
                  chunks
                </p>
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-zinc-900">
                  Document workspace
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Upload a PDF to get started
                </p>
              </>
            )}
          </div>

          {/* Upload status */}
          {loading && (
            <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-600">
              <Loader2
                size={14}
                className="animate-spin"
              />

              Processing document...
            </div>
          )}
        </header>

        {/* Workspace */}
        <div className="h-[calc(100vh-4rem)] p-5">
          <div className="grid h-full gap-5 lg:grid-cols-2">
            {/* PDF Viewer */}
            <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="flex h-14 shrink-0 items-center gap-2 border-b px-5">
                <FileText
                  size={17}
                  className="text-zinc-500"
                />

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Document
                  </h3>
                </div>
              </div>

              <div className="min-h-0 flex-1 bg-zinc-100">
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    title="PDF document"
                    className="h-full w-full border-0"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center">
                    <div>
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <FileText
                          size={24}
                          className="text-zinc-300"
                        />
                      </div>

                      <h3 className="mt-4 text-sm font-semibold text-zinc-700">
                        No document selected
                      </h3>

                      <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-400">
                        Upload a PDF from the sidebar
                        to start exploring your
                        document.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Chat */}
            <div
              className={`min-h-0 ${
                !selectedDocument
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              <ChatWindow
                messages={messages}
                question={question}
                chatLoading={chatLoading}
                messagesEndRef={messagesEndRef}
                onQuestionChange={setQuestion}
                onChat={handleChat}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </div>

        {/* Selected file upload confirmation */}
        {file && !loading && (
          <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border bg-white p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                <FileText
                  size={17}
                  className="text-zinc-600"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {file.name}
                </p>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Ready to upload
                </p>
              </div>

              <button
                type="button"
                onClick={handleUpload}
                className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white transition hover:bg-zinc-800"
              >
                Upload
              </button>
            </div>

            <button
              type="button"
              onClick={() => setFile(null)}
              className="mt-2 text-xs text-zinc-400 transition hover:text-zinc-700"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}