import type { Message } from "ai";

interface AssistantMessageProps {
  message: Message;
  error: Error | undefined;
}

export function AssistantMessage({ message, error }: AssistantMessageProps) {
  return <div>AI: {error ? error.message : message.content}</div>;
}
