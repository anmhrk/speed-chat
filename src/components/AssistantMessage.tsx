import type { Message } from "ai";

interface AssistantMessageProps {
  message: Message;
  reload: () => void;
}

export function AssistantMessage({ message, reload }: AssistantMessageProps) {
  const isError = message.id.startsWith("error-");

  return (
    <div className="flex justify-start text-[15px]">
      <div className="w-full">
        {isError ? (
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
