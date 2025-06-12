import type { Message } from "ai";

interface AssistantMessageProps {
  message: Message;
  error: Error | undefined;
}

export function AssistantMessage({ message, error }: AssistantMessageProps) {
  return (
    <div className="flex justify-start text-[15px]">
      <div className="w-full">
        <div className="text-foreground break-words whitespace-pre-wrap">
          {error ? (
            <div className="text-red-500">Error: {error.message}</div>
          ) : (
            message.content
          )}
        </div>
      </div>
    </div>
  );
}
