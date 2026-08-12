"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Upload, Loader2 } from "lucide-react";

import { chatWithDocument, uploadDocument } from "@/lib/api";
import { ChatWindow } from "@/components/chat/chat-window";

import type { Document } from "@/types/document";
import { DocumentCard } from "@/components/document/document-card";
import { UploadDocument } from "@/components/document/upload-document";
import { DocumentHeader } from "@/components/layout/document-header";
import { DocumentList } from "@/components/document/document-list";

type Message = {
  role: "user" | "assistant";
  content: string;
};


export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, chatLoading]);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setError("");
    
    setMessages([]);

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
      setMessages([]);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    const userQuestion = question.trim();

    if (!userQuestion || chatLoading || !selectedDocument) {
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

      const data = await chatWithDocument(userQuestion);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setError("Failed to get an answer. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleChat();
    }
  };

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

        {/* Upload Section */}
        <UploadDocument
          file={file}
          loading={loading}
          onFileChange={(selectedFile) => {
            setFile(selectedFile);
            setError("");
            setMessages([]);
          }}
          onUpload={handleUpload}
        />

        <DocumentList
          documents={documents}
          selectedDocument={selectedDocument}
          onSelect={(document) => {
            setSelectedDocument(document);
            setMessages([]);
            setError("");
          }}
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