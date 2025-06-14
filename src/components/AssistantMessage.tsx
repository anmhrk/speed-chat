import type { Message } from "ai";

interface AssistantMessageProps {
  message: Message;
  isLoading: boolean;
}

export function AssistantMessage({
  message,
  isLoading,
}: AssistantMessageProps) {
  const isError = message.id.startsWith("error-");

  return (
    <div className="flex justify-start text-[15px]">
      <div className="w-full">
        {isLoading ? (
          <div className="text-muted-foreground break-words whitespace-pre-wrap">
            <BouncingDotsLoader />
          </div>
        ) : isError ? (
          <ErrorMessage content={message.content} />
        ) : (
          <div className="text-foreground break-words whitespace-pre-wrap">
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorMessage({ content }: { content: string }) {
  return (
    <div className="bg-destructive/10 flex justify-start rounded-lg p-3 text-[15px]">
      <div className="w-full">
        <div className="text-destructive break-words whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
}

function BouncingDotsLoader() {
  return (
    <div className="flex items-center space-x-1">
      <div className="bg-accent h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]"></div>
      <div className="bg-accent h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]"></div>
      <div className="bg-accent h-2 w-2 animate-bounce rounded-full"></div>
    </div>
  );
}
