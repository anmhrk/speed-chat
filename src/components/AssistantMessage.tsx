import type { Message } from "ai";

interface AssistantMessageProps {
  message: Message;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  const isError = message.content.startsWith("Error:");

  return (
    <div className="flex justify-start text-[15px]">
      <div className="w-full">
        <div
          className={`break-words whitespace-pre-wrap ${
            isError ? "text-red-500" : "text-foreground"
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
