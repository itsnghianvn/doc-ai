"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Upload, Loader2 } from "lucide-react";

import { chatWithDocument, uploadDocument } from "@/lib/api";
import { ChatWindow } from "@/components/chat/chat-window";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type UploadResult = {
  filename?: string;
  pages?: number;
  characters?: number;
  chunk_count?: number;
  chunks?: unknown[];
  preview?: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

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
    setResult(null);
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
    if (!file || loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);
      setMessages([]);
      setQuestion("");

      const data = await uploadDocument(file);

      setResult(data);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    const userQuestion = question.trim();

    if (!userQuestion || chatLoading || !result) {
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

  const pdfUrl = result?.filename
    ? `${process.env.NEXT_PUBLIC_API_URL}/upload/${encodeURIComponent(
        result.filename
      )}`
    : null;

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <FileText size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                DocAI
              </h1>

              <p className="text-sm text-zinc-500">
                AI-powered document assistant
              </p>
            </div>
          </div>
        </header>

        {/* Upload Section */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Upload size={18} />

            <h2 className="font-semibold text-zinc-900">
              Upload document
            </h2>
          </div>

          <p className="mt-1 text-sm text-zinc-500">
            Upload a PDF to start chatting with your document.
          </p>

          <div className="mt-5 rounded-xl border border-dashed border-zinc-300 p-5">
            {/* File input */}
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={loading}
              className="w-full text-sm disabled:cursor-not-allowed disabled:opacity-50"
            />

            {/* Selected file */}
            {file && (
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-zinc-50 p-3">
                <FileText
                  size={18}
                  className="shrink-0 text-zinc-500"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-800">
                    {file.name}
                  </p>

                  <p className="text-xs text-zinc-500">
                    PDF document
                  </p>
                </div>
              </div>
            )}

            {/* Upload button */}
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || loading}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Processing...
                </>
              ) : (
                <>
                  <Upload size={17} />
                  Upload PDF
                </>
              )}
            </button>

            {/* Upload success */}
            {result && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-sm font-medium text-green-700">
                  Document uploaded successfully.
                </p>

                {result.filename && (
                  <p className="mt-1 truncate text-xs text-green-600">
                    {result.filename}
                  </p>
                )}

                <div className="mt-2 flex gap-4 text-xs text-green-600">
                  {result.pages !== undefined && (
                    <span>
                      Pages: {result.pages}
                    </span>
                  )}

                  {result.chunk_count !== undefined && (
                    <span>
                      Chunks: {result.chunk_count}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

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

              {result?.filename && (
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {result.filename}
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
              !result
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