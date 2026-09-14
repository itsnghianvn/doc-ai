"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Loader2,
  MessageSquareText,
  Upload,
  X,
} from "lucide-react";

import {
  chatWithDocument,
  deleteDocument,
  getApiErrorMessage,
  getDocuments,
  uploadDocument,
} from "@/lib/api";

import { ChatWindow } from "@/components/chat/chat-window";
import { PdfViewer } from "@/components/document/pdf-viewer";
import { UploadDocument } from "@/components/document/upload-document";
import { Sidebar } from "@/components/layout/sidebar";

import type { Message, Source } from "@/types/chat";
import type { Document } from "@/types/document";

type MobilePane = "document" | "chat";
const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<Document | null>(null);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [pdfPage, setPdfPage] = useState<number | null>(null);
  const [mobilePane, setMobilePane] =
    useState<MobilePane>("document");

  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
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
        setError(
          getApiErrorMessage(
            err,
            "Failed to load documents."
          )
        );
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

  const selectFile = (selectedFile: File) => {
    setError("");

    const hasPdfExtension =
      selectedFile.name.toLowerCase().endsWith(".pdf");
    const hasAllowedType =
      !selectedFile.type ||
      selectedFile.type === "application/pdf" ||
      selectedFile.type === "application/octet-stream";

    if (!hasPdfExtension || !hasAllowedType) {
      setError("Please select a valid PDF file.");
      return;
    }

    if (selectedFile.size > MAX_PDF_SIZE_BYTES) {
      setError("PDF files must be 20 MB or smaller.");
      return;
    }

    setFile(selectedFile);
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

    if (!selectedFile) {
      return;
    }

    selectFile(selectedFile);
  };

  const handleDragEnter = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    dragDepthRef.current += 1;
    setDragActive(true);
  };

  const handleDragLeave = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    dragDepthRef.current -= 1;

    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setDragActive(false);
    }
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragActive(false);

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      selectFile(droppedFile);
    }
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
      setPdfPage(null);
      setMobilePane("document");

      setMessages([]);
      setQuestion("");

      setFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        getApiErrorMessage(
          err,
          "Upload failed. Please try again."
        )
      );
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
    setPdfPage(null);
    setMobilePane("document");

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
    const document = documents.find(
      (item) => item.document_id === documentId
    );

    if (
      document &&
      !window.confirm(`Delete "${document.filename}"?`)
    ) {
      return;
    }

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
        setPdfPage(null);

        setMessages([]);
        setQuestion("");
      }
    } catch (err) {
      console.error("Delete error:", err);

      setError(
        getApiErrorMessage(
          err,
          "Failed to delete document. Please try again."
        )
      );
    }
  };

  /*
   * Chat
   */
  const handleChat = async (questionOverride?: string) => {
    const userQuestion = (
      questionOverride ?? question
    ).trim();

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
        getApiErrorMessage(
          err,
          "Failed to get an answer. Please try again."
        )
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleNewConversation = () => {
    if (chatLoading) {
      return;
    }

    setMessages([]);
    setQuestion("");
    setError("");
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
   * Open source in PDF
   */
  const handleSourceClick = (source: Source) => {
    if (
      !source.page_start ||
      source.document_id !== selectedDocument?.document_id
    ) {
      return;
    }

    setPdfPage(source.page_start);
    setMobilePane("document");
  };

  return (
    <div
      className="flex h-dvh overflow-hidden bg-zinc-50"
      onDragEnter={handleDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
        <header className="flex h-16 items-center justify-between gap-3 border-b bg-white px-3 sm:px-4 md:px-6">
          <div className="hidden min-w-0 md:block">
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

          <select
            value={selectedDocument?.document_id ?? ""}
            onChange={(event) => {
              const document = documents.find(
                (item) =>
                  item.document_id === event.target.value
              );

              if (document) {
                handleSelectDocument(document);
              }
            }}
            className="min-w-0 flex-1 truncate rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none md:hidden"
            aria-label="Select document"
          >
            {documents.length === 0 && (
              <option value="">No documents</option>
            )}
            {documents.map((document) => (
              <option
                key={document.document_id}
                value={document.document_id}
              >
                {document.filename}
              </option>
            ))}
          </select>

          <div className="flex shrink-0 items-center gap-2">
            {loading && (
              <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-2.5 py-2 text-xs text-zinc-600">
                <Loader2
                  size={14}
                  className="animate-spin"
                />
                <span className="hidden sm:inline">
                  Processing document...
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleUploadClick}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white disabled:opacity-50 md:hidden"
              aria-label="Upload PDF"
            >
              <Upload size={16} />
            </button>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col p-3 md:p-5">
          <div className="mb-3 grid grid-cols-2 rounded-lg bg-zinc-200/70 p-1 md:hidden">
            <button
              type="button"
              onClick={() => setMobilePane("document")}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mobilePane === "document"
                  ? "bg-white text-zinc-900"
                  : "text-zinc-500"
              }`}
            >
              <FileText size={14} />
              Document
            </button>

            <button
              type="button"
              onClick={() => setMobilePane("chat")}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                mobilePane === "chat"
                  ? "bg-white text-zinc-900"
                  : "text-zinc-500"
              }`}
            >
              <MessageSquareText size={14} />
              Chat
            </button>
          </div>

          <div className="grid min-h-0 flex-1 gap-5 md:grid-cols-2">
            {/* PDF Viewer */}
            <div
              className={`min-h-0 ${
                mobilePane === "document"
                  ? "flex"
                  : "hidden"
              } md:flex`}
            >
              <div className="min-h-0 min-w-0 flex-1">
                <PdfViewer
                  document={selectedDocument}
                  page={pdfPage}
                  onPageChange={setPdfPage}
                />
              </div>
            </div>

            {/* Chat */}
            <div
              className={`min-h-0 ${
                mobilePane === "chat"
                  ? "block"
                  : "hidden"
              } md:block ${
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
                onChat={() => handleChat()}
                onNewConversation={handleNewConversation}
                onSuggestionClick={handleChat}
                onKeyDown={handleKeyDown}
                onSourceClick={handleSourceClick}
              />
            </div>
          </div>
        </div>

        <UploadDocument
          file={file}
          loading={loading}
          onUpload={handleUpload}
          onCancel={() => setFile(null)}
        />

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg"
          >
            <p className="min-w-0 flex-1 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 rounded p-0.5 text-red-400 transition hover:bg-red-100 hover:text-red-700"
              aria-label="Dismiss error"
            >
              <X size={15} />
            </button>
          </div>
        )}
      </main>

      {dragActive && !loading && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/20 p-6">
          <div className="rounded-2xl border-2 border-dashed border-zinc-400 bg-white px-10 py-8 text-center">
            <Upload
              size={24}
              className="mx-auto text-zinc-600"
            />
            <p className="mt-3 text-sm font-semibold text-zinc-800">
              Drop your PDF here
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Maximum file size: 20 MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}