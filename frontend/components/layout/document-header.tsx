import { FileText } from "lucide-react";

export function DocumentHeader() {
  return (
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
  );
}