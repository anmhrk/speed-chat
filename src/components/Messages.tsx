import type { Message } from "ai";
import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";

interface MessagesProps {
  messages: Message[];
  reload: () => void;
}

export function Messages({ messages, reload: _reload }: MessagesProps) {
  return (
    <div className="flex w-full flex-col space-y-10">
      {messages.map((message, index) => (
        <div key={message.id} className="w-full" data-message-index={index}>
          {message.role === "user" ? (
            <UserMessage message={message} />
          ) : (
            <AssistantMessage message={message} />
          )}
        </div>
      ))}
    </div>
  );
}
