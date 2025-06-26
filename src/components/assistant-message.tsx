import {
  Check,
  Copy,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Download,
  Text,
  WrapText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, memo, useMemo, useCallback } from "react";
import type { Message } from "ai";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown";
import ShikiHighlighter, { Element, isInlineCode } from "react-shiki";
import { useTheme } from "next-themes";
import removeMarkdown from "remove-markdown";
import "katex/dist/katex.min.css";

interface AssistantMessageProps {
  message: Message;
  isLastMessage: boolean;
  reload: () => void;
}

export const AssistantMessage = memo(function AssistantMessage({
  message,
  isLastMessage,
  reload,
}: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);
  const isError = message.id.startsWith("error-");

  const handleCopy = () => {
    const plainText = removeMarkdown(message.content);
    navigator.clipboard.writeText(plainText);
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
          <div className="text-foreground">
            {message.parts?.map((part, partIndex) => {
              if (part.type === "reasoning") {
                return (
                  <ReasoningBlock
                    key={partIndex}
                    reasoning={part.reasoning || ""}
                  />
                );
              }

              if (part.type === "text") {
                return (
                  <div key={partIndex}>
                    <Markdown>{part.text}</Markdown>
                  </div>
                );
              }

              return null;
            })}
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

          {isLastMessage && (
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
          )}
        </div>
      </div>
    </div>
  );
});

export const CodeBlock = memo(function CodeBlock({
  className,
  children,
  node,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
  node?: Element;
}) {
  const { theme } = useTheme();
  const [wrapText, setWrapText] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const match = className?.match(/language-(\w+)/);
  const language = match ? match[1] : "text";
  const isInline = node ? isInlineCode(node) : false;
  const codeContent = String(children).replace(/\n$/, "");

  const handleCodeCopy = useCallback(() => {
    navigator.clipboard.writeText(codeContent);
    toast.success("Code copied to clipboard");
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [codeContent]);

  const handleCodeDownload = useCallback(() => {
    const blob = new Blob([codeContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [codeContent]);

  const codeBlockHeader = useMemo(
    () => (
      <div className="bg-primary/10 dark:bg-muted/80 flex items-center justify-between rounded-t-lg px-3">
        <span className="text-muted-foreground text-sm font-medium">
          {language}
        </span>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCodeDownload}
              >
                <Download className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Download code</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setWrapText(!wrapText)}
              >
                {wrapText ? (
                  <WrapText className="size-4" />
                ) : (
                  <Text className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {wrapText ? "Disable text wrapping" : "Enable text wrapping"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCodeCopy}
              >
                {codeCopied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {codeCopied ? "Copied!" : "Copy code"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    ),
    [language, codeCopied, handleCodeCopy, wrapText, handleCodeDownload]
  );

  return !isInline ? (
    <div className="mb-4 mt-8 w-full border rounded-xl overflow-hidden last:mb-0 relative">
      {codeBlockHeader}
      <ShikiHighlighter
        theme={{
          light: "one-light",
          dark: "one-dark-pro",
        }}
        defaultColor={theme}
        delay={150}
        language={language}
        showLanguage={false}
        showLineNumbers={false}
        addDefaultStyles={false}
        className={`[&>pre]:px-4 [&>pre]:py-4 [&>pre]:text-[14px] ${wrapText ? "[&>pre]:whitespace-pre-wrap" : "[&>pre]:overflow-auto"}`}
        {...props}
      >
        {codeContent}
      </ShikiHighlighter>
    </div>
  ) : (
    <code className="bg-muted rounded p-1 font-mono text-sm">{children}</code>
  );
});

const ReasoningBlock = memo(function ReasoningBlock({
  reasoning,
}: {
  reasoning: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex gap-2 w-full cursor-pointer hover:underline items-center justify-start p-4 px-0 text-sm font-medium">
        <span className="text-xs">
          {isOpen ? (
            <ChevronDown className="size-5" />
          ) : (
            <ChevronRight className="size-5" />
          )}
        </span>
        <span className="select-none">Reasoning</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pt-1 pb-5 text-sm whitespace-pre-wrap bg-muted/50 rounded-lg [&>*:last-child]:mb-0">
        <Markdown>{reasoning}</Markdown>
      </CollapsibleContent>
    </Collapsible>
  );
});
