import type { Message } from "ai";
import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";

interface MessagesProps {
  messages: Message[];
  error: Error | undefined;
}

export function Messages({ messages, error }: MessagesProps) {
  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
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
