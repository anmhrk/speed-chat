import type { Message } from "ai";
import { AssistantMessage } from "@/components/assistant-message";
import { UserMessage } from "@/components/user-message";

interface MessagesProps {
  allMessages: Message[];
  status: "submitted" | "streaming" | "ready" | "error";
  reload: () => void;
  append: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
}

export function Messages({
  allMessages,
  status,
  reload,
  append,
  setMessages,
}: MessagesProps) {
  const showLoading =
    status === "submitted" &&
    allMessages[allMessages.length - 1].role === "user";

  return (
    <div className="flex w-full flex-col gap-8 max-w-3xl mx-auto pt-6 pb-16">
      {allMessages.map((message) => (
        <div key={message.id} className="w-full">
          {message.role === "user" ? (
            <UserMessage
              message={message}
              allMessages={allMessages}
              append={append}
              setMessages={setMessages}
            />
          ) : (
            <AssistantMessage
              message={message}
              isLastMessage={
                message.id === allMessages[allMessages.length - 1]?.id
              }
              reload={reload}
            />
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
