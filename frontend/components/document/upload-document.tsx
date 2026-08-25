"use client";

import { useRef } from "react";
import { Loader2, Upload } from "lucide-react";

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
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(event) => {
          const selectedFile =
            event.target.files?.[0] ?? null;

          onFileChange(selectedFile);

          // Allow selecting the same file again.
          event.target.value = "";
        }}
      />

      {file && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border bg-white p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
              <Upload
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
              onClick={onUpload}
              disabled={loading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-black px-3 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                  Processing
                </>
              ) : (
                "Upload"
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => onFileChange(null)}
            disabled={loading}
            className="mt-2 text-xs text-zinc-400 transition hover:text-zinc-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}

      {!file && (
        <button
          type="button"
          onClick={handleSelectFile}
          className="hidden"
          aria-hidden="true"
        />
      )}
    </>
  );
}