import type { Message } from "ai";

interface UserMessageProps {
  message: Message;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end text-[15px]">
      <div className="bg-accent max-w-[66.67%] rounded-lg px-4 py-3">
        <div className="break-words whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}
