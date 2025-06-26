import type { Message } from "ai";
import { AssistantMessage } from "@/components/assistant-message";
import { UserMessage } from "@/components/user-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScroll } from "@/hooks/use-scroll";

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
  const { scrollAreaRef } = useScroll();

  const showLoading =
    status === "submitted" &&
    allMessages[allMessages.length - 1].role === "user";

  return (
    <ScrollArea className="h-full px-3" ref={scrollAreaRef}>
      <div className="flex w-full flex-col gap-10 max-w-[750px] mx-auto py-16">
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
    </ScrollArea>
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
