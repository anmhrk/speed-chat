import type { Message } from "ai";
import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";

interface MessagesProps {
  messages: Message[];
  error: Error | undefined;
}

export function Messages({ messages, error }: MessagesProps) {
  return (
    <div className="flex w-full flex-col space-y-10">
      {messages.map((message) => (
        <div key={message.id} className="w-full">
          {message.role === "user" ? (
            <UserMessage message={message} />
          ) : (
            <AssistantMessage message={message} error={error} />
          )}
        </div>
      ))}
    </div>
  );
}
