"use client";

import { FileText, Loader2, Upload } from "lucide-react";

import type { Document } from "@/types/document";

type UploadDocumentProps = {
  file: File | null;
  loading: boolean;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
};

export function UploadDocument({
  file,
  loading,
  onFileChange,
  onUpload,
}: UploadDocumentProps) {
  return (
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
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(event) => {
            const selectedFile =
              event.target.files?.[0] ?? null;

            onFileChange(selectedFile);
          }}
          className="w-full text-sm"
        />

        {file && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-zinc-50 p-3">
            <FileText
              size={18}
              className="shrink-0 text-zinc-500"
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-800">
                {file.name}
              </p>

              <p className="text-xs text-zinc-500">
                PDF document
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onUpload}
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

        
      </div>
    </section>
  );
}