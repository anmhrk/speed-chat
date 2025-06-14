import type { Message } from "ai";
import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";

interface MessagesProps {
  messages: Message[];
  reload: () => void;
  status: "error" | "submitted" | "streaming" | "ready";
}

export function Messages({ messages, reload: _reload, status }: MessagesProps) {
  const showLoading =
    status === "submitted" && messages[messages.length - 1].role === "user";

  return (
    <div className="flex w-full flex-col gap-10">
      {messages.map((message, index) => (
        <div key={message.id} className="w-full" data-message-index={index}>
          {message.role === "user" ? (
            <UserMessage message={message} />
          ) : (
            <AssistantMessage message={message} />
          )}
        </div>
      ))}
      {showLoading && (
        <div className="w-full">
          <AssistantLoadingMessage />
        </div>
      )}
    </div>
  );
}

function AssistantLoadingMessage() {
  return (
    <div className="flex justify-start">
      <div className="w-full">
        <div className="flex items-center space-x-1">
          <div className="bg-accent h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]"></div>
          <div className="bg-accent h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]"></div>
          <div className="bg-accent h-2 w-2 animate-bounce rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
