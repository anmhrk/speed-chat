import type { Message } from "ai";

export function Messages({ messages }: { messages: Message[] }) {
  return (
    <div className="flex-1 flex flex-col">
      {messages.map((message) => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
}
