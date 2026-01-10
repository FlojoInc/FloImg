interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps) {
  // Check if it's a command
  const isCommand = content.startsWith("/");

  return (
    <div className="flex justify-end">
      <div
        className={`max-w-[80%] px-4 py-2 rounded-2xl rounded-br-md ${
          isCommand ? "bg-zinc-800 text-teal-400 font-mono text-sm" : "bg-teal-600 text-white"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
