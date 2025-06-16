import type { Message } from "ai";
import { AssistantMessage } from "@/components/AssistantMessage";
import { UserMessage } from "@/components/UserMessage";

interface MessagesProps {
  messages: Message[];
  reload: () => void;
  status: "error" | "submitted" | "streaming" | "ready";
  append: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
}

export function Messages({
  messages,
  reload,
  status,
  append,
  setMessages,
}: MessagesProps) {
  const showLoading =
    status === "submitted" && messages[messages.length - 1].role === "user";

  return (
    <div className="flex w-full flex-col gap-12">
      {messages.map((message, index) => (
        <div key={message.id} className="w-full" data-message-index={index}>
          {message.role === "user" ? (
            <UserMessage
              message={message}
              append={append}
              setMessages={setMessages}
              allMessages={messages}
            />
          ) : (
            <AssistantMessage message={message} reload={reload} />
          )}
        </div>
      ))}
      {showLoading && (
        <div className="w-full">
          <AssistantMessageLoader />
        </div>
      )}
    </div>
  );
}

function AssistantMessageLoader() {
  return (
    <div className="flex justify-start">
      <div className="w-full">
        <div className="flex items-center space-x-1">
          <div className="bg-primary/10 dark:bg-accent h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]"></div>
          <div className="bg-primary/10 dark:bg-accent h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]"></div>
          <div className="bg-primary/10 dark:bg-accent h-2 w-2 animate-bounce rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
