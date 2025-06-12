import type { Message } from "ai";

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  return <div>User: {message.content}</div>;
}
