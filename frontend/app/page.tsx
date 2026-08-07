"use client";

import { useState } from "react";
import { chatWithDocument, uploadDocument } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  // Chat state
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Common error
  const [error, setError] = useState("");

  const handleUpload = async () => {
    console.log("🔥 UPLOAD CLICKED");

    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      console.log("📄 Uploading:", file.name);

      const data = await uploadDocument(file);

      console.log("✅ Upload success:", data);

      setResult(data);
    } catch (err) {
      console.error("❌ Upload error:", err);
      setError("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!question.trim()) {
      return;
    }

  const userQuestion = question.trim();

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

    console.log("💬 Question:", userQuestion);

    const data = await chatWithDocument(userQuestion);

    console.log("✅ Chat response:", data);

    // Add assistant message
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: data.answer,
      },
    ]);
  } catch (err) {
    console.error("❌ Chat error:", err);
    setError("Failed to get answer.");
  } finally {
    setChatLoading(false);
  }
};
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-16">

        {/* Header */}
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          DocAI
        </h1>

        <p className="mt-2 text-gray-600">
          Upload a PDF and chat with your document using AI.
        </p>

        {/* Upload */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">
            Upload Document
          </h2>

          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;

              setFile(selectedFile);
              setError("");
              setResult(null);
              setMessages([]);
            }}
            className="mt-4 w-full"
          />

          {file && (
            <p className="mt-3 text-sm text-gray-600">
              Selected: {file.name}
            </p>
          )}

          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-5"
          >
            {loading ? "Uploading..." : "Upload PDF"}
          </Button>

          {result && (
            <div className="mt-5 rounded-lg bg-green-50 p-4">
              <p className="font-medium text-green-700">
                Document uploaded successfully.
              </p>

              <p className="mt-1 text-sm text-green-600">
                {file?.name} · PDF processed successfully.
              </p>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">
            Chat with your document
          </h2>

          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask something about your document..."
            className="mt-4 min-h-32 w-full rounded-lg border border-zinc-200 p-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
          />

          <Button
            type="button"
            onClick={handleChat}
            disabled={!question.trim() || chatLoading}
            className="mt-4"
          >
            {chatLoading ? "Thinking..." : "Ask"}
          </Button>

          {messages.length > 0 && (
  <div className="mt-6 space-y-4">
    {messages.map((message, index) => (
      <div
        key={index}
        className={`flex ${
          message.role === "user"
            ? "justify-end"
            : "justify-start"
        }`}
      >
        <div
          className={`max-w-[80%] rounded-xl px-4 py-3 ${
            message.role === "user"
              ? "bg-black text-white"
              : "bg-zinc-100 text-zinc-900"
          }`}
        >
          <p className="mb-1 text-xs font-medium opacity-60">
            {message.role === "user" ? "You" : "DocAI"}
          </p>

          <p className="whitespace-pre-wrap text-sm leading-6">
            {message.content}
          </p>
        </div>
      </div>
    ))}
  </div>
)}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-500">
            {error}
          </p>
        )}

      </div>
    </main>
  );
}
