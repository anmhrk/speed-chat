import type { Message } from "ai";
import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";

interface MessagesProps {
  messages: Message[];
  reload: () => void;
  status: "error" | "submitted" | "streaming" | "ready";
}

export function Messages({ messages, reload: _reload, status }: MessagesProps) {
  const shouldShowLoading =
    status === "submitted" &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "user";

  const loadingMessage: Message = {
    id: "loading-temp",
    role: "assistant",
    content: "",
    createdAt: new Date(),
  };

  const displayMessages = shouldShowLoading
    ? [...messages, loadingMessage]
    : messages;

  return (
    <div className="flex w-full flex-col space-y-10">
      {displayMessages.map((message, index) => {
        const isLoadingMessage = message.id === "loading-temp";

        return (
          <div key={message.id} className="w-full" data-message-index={index}>
            {message.role === "user" ? (
              <UserMessage message={message} />
            ) : (
              <AssistantMessage
                message={message}
                isLoading={isLoadingMessage}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
