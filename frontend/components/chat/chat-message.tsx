type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
};

export function ChatMessage({
  role,
  content,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-black text-white"
            : "bg-zinc-100 text-zinc-900"
        }`}
      >
        <p
          className={`mb-1 text-xs font-medium ${
            isUser
              ? "text-zinc-300"
              : "text-zinc-500"
          }`}
        >
          {isUser ? "You" : "DocAI"}
        </p>

        <p className="whitespace-pre-wrap text-sm leading-6">
          {content}
        </p>
      </div>
    </div>
  );
}
