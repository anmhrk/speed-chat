import type { Message } from "ai";
import { Check, Copy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface AssistantMessageProps {
  message: Message;
  reload: () => void;
}

export function AssistantMessage({ message, reload }: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);
  const isError = message.id.startsWith("error-");

  const handleCopy = () => {
    // TODO: Parse markdown as normal text before copying
    navigator.clipboard.writeText(message.content);
    toast.success("Copied to clipboard");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-start text-[15px]">
      <div className="group relative w-full">
        {isError ? (
          <div className="bg-destructive/10 flex justify-start rounded-lg p-3 text-[15px]">
            <div className="w-full">
              <div className="text-destructive break-words whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-foreground break-words whitespace-pre-wrap">
            {message.content}
          </div>
        )}

        <div className="absolute top-full left-0 mt-1 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          {!isError && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-8 w-8"
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {copied ? "Copied!" : "Copy message"}
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={reload}
                className="h-8 w-8"
              >
                <RotateCcw className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Retry message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
