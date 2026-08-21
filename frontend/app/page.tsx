"use client";

import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";

import {
  chatWithDocument,
  deleteDocument,
  getDocuments,
  uploadDocument,
} from "@/lib/api";

import { ChatWindow } from "@/components/chat/chat-window";
import { UploadDocument } from "@/components/document/upload-document";
import { DocumentHeader } from "@/components/layout/document-header";
import { DocumentList } from "@/components/document/document-list";

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

  const [selectedSource, setSelectedSource] =
    useState<Source | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleSourceClick = (source: Source) => {
    if (!source.page_start) {
      return;
    }

    if (!selectedDocument?.filename) {
      return;
    }

    const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL}/upload/${encodeURIComponent(
      selectedDocument.filename
    )}`;

    window.open(
      `${pdfUrl}#page=${source.page_start}`,
      "_blank"
    );
  };
  
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load documents when the page starts
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const data = await getDocuments();
        setDocuments(data);
      } catch (err) {
        console.error("Failed to load documents:", err);
      }
    };

    loadDocuments();
  }, []);

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, chatLoading]);

  // Handle file selection
  const handleFileChange = (selectedFile: File | null) => {
    setError("");
    setMessages([]);
    setQuestion("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setFile(null);
      setError("Please select a PDF file.");
      return;
    }

    setFile(selectedFile);
  };

  // Upload document
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      setMessages([]);
      setQuestion("");

      const data = await uploadDocument(file);

      setDocuments((prev) => [...prev, data]);
      setSelectedDocument(data);
      setFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Select document
  const handleSelectDocument = (document: Document) => {
    setSelectedDocument(document);
    setMessages([]);
    setQuestion("");
    setError("");
  };

  // Delete document
  const handleDeleteDocument = async (documentId: string) => {
    try {
      setError("");

      await deleteDocument(documentId);

      setDocuments((prev) =>
        prev.filter(
          (document) => document.document_id !== documentId
        )
      );

      if (selectedDocument?.document_id === documentId) {
        setSelectedDocument(null);
        setMessages([]);
        setQuestion("");
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete document. Please try again.");
    }
  };

  // Chat with selected document
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
      setError("Selected document is missing document ID.");
      return;
    }

    try {
      setChatLoading(true);
      setError("");

      // Add user message immediately
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
        messages,
      );

      // Add assistant response + sources
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

  // Enter = send, Shift + Enter = new line
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleChat();
    }
  };

  // PDF preview URL
  const pdfUrl = selectedDocument?.filename
    ? `${process.env.NEXT_PUBLIC_API_URL}/upload/${encodeURIComponent(
        selectedDocument.filename
      )}`
    : null;

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <DocumentHeader />

        {/* Upload */}
        <UploadDocument
          file={file}
          loading={loading}
          onFileChange={handleFileChange}
          onUpload={handleUpload}
        />

        {/* Document List */}
        <DocumentList
          documents={documents}
          selectedDocument={selectedDocument}
          onSelect={handleSelectDocument}
          onDelete={handleDeleteDocument}
        />

        {/* Document + Chat */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* PDF Viewer */}
          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText size={18} />

                <h2 className="font-semibold text-zinc-900">
                  Document
                </h2>
              </div>

              {selectedDocument?.filename && (
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {selectedDocument.filename}
                </p>
              )}
            </div>

            <div className="h-[650px] bg-zinc-100">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title="PDF document"
                  className="h-full w-full border-0"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <div>
                    <FileText
                      size={40}
                      className="mx-auto text-zinc-300"
                    />

                    <p className="mt-3 text-sm text-zinc-500">
                      Upload a PDF to preview it here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Chat */}
          <div
            className={
              !selectedDocument
                ? "pointer-events-none opacity-50"
                : ""
            }
          >
            <ChatWindow
              messages={messages}
              question={question}
              chatLoading={chatLoading}
              messagesEndRef={messagesEndRef}
              onQuestionChange={setQuestion}
              onChat={handleChat}
              onKeyDown={handleKeyDown}
              onSourceClick={handleSourceClick}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}