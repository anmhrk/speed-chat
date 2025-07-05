import {
  Check,
  Copy,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Download,
  Text,
  WrapText,
  ExternalLink,
  Globe,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, memo, useMemo, useCallback } from "react";
import type { Message, ToolInvocation } from "ai";
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
import { UseChatHelpers } from "@ai-sdk/react";
import Link from "next/link";
import Image from "next/image";

interface WebSearchResult {
  url: string;
  title: string;
  content: string;
  rank: number;
  publishedDate?: string;
}

type WebSearchToolInvocation = ToolInvocation & {
  toolName: "webSearch";
  result?: {
    query: string;
    results: WebSearchResult[];
    totalResults: number;
  };
};

interface AssistantMessageProps {
  message: Message;
  isLastMessage: boolean;
  reload: UseChatHelpers["reload"];
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

              if (part.type === "tool-invocation") {
                if (part.toolInvocation.toolName === "generateImage") {
                  return (
                    <div
                      key={partIndex}
                      className="flex flex-wrap gap-2 mt-4 w-full relative max-w-[66.67%]"
                    >
                      {part.toolInvocation.state === "result" ? (
                        <div className="relative group/image">
                          <Image
                            src={(part.toolInvocation as any).result.imageUrl}
                            alt="Generated Image"
                            className="rounded-md w-full max-w-[400px] h-auto aspect-auto cursor-pointer"
                            loading="lazy"
                            width={400}
                            height={300}
                          />

                          <div className="absolute top-1 right-1 flex gap-1.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full h-7 w-7 !bg-black/90 hover:!bg-black/90 text-white hover:text-white opacity-0 group-hover/image:opacity-100 transition-opacity"
                                  asChild
                                >
                                  <Link
                                    href={
                                      (part.toolInvocation as any).result
                                        .imageUrl
                                    }
                                    target="_blank"
                                  >
                                    <ExternalLink className="size-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                Open in new tab
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full h-7 w-7 !bg-black/90 hover:!bg-black/90 text-white hover:text-white opacity-0 group-hover/image:opacity-100 transition-opacity"
                                  onMouseDown={async (e) => {
                                    e.stopPropagation();
                                    e.preventDefault();

                                    const response = await fetch(
                                      (part.toolInvocation as any).result
                                        .imageUrl
                                    );
                                    const blob = await response.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = "image";
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }}
                                >
                                  <Download className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                Download image
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ) : (
                        <div>Generating image...</div>
                      )}
                    </div>
                  );
                }

                if (part.toolInvocation.toolName === "webSearch") {
                  return (
                    <WebSearchBlock
                      key={partIndex}
                      toolInvocation={part.toolInvocation}
                    />
                  );
                }

                if (part.toolInvocation.toolName === "addMemory") {
                  return (
                    <MemoryBlock
                      key={partIndex}
                      toolInvocation={part.toolInvocation}
                    />
                  );
                }
              }

              return null;
            })}
          </div>
        )}

        <div className="absolute top-full left-0 mt-1 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          {!isError &&
            !message.parts?.some(
              (part) =>
                part.type === "tool-invocation" &&
                part.toolInvocation.toolName === "generateImage"
            ) && (
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
                  onClick={() => reload()}
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

  if (!reasoning) return null;

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

const WebSearchBlock = memo(function WebSearchBlock({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isSearching = toolInvocation.state !== "result";
  const webSearchResult =
    toolInvocation.state === "result"
      ? (toolInvocation as WebSearchToolInvocation).result
      : undefined;
  const results = webSearchResult?.results || [];

  // Extract unique domains for favicon display
  const domains = useMemo(() => {
    if (!results.length) return [];
    const uniqueDomains = Array.from(
      new Set(
        results.map((result: WebSearchResult) => new URL(result.url).hostname)
      )
    ).slice(0, 4); // Limit to 4 domains for display
    return uniqueDomains;
  }, [results]);

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
        <div className="flex items-center gap-2">
          <Globe className="size-4" />
          <span className="select-none">
            {isSearching ? "Searching the web..." : "Searched the web"}
          </span>
          {!isSearching && domains.length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              {domains.map((domain, index) => (
                <img
                  key={`${domain}-${index}`}
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                  alt={`${domain} favicon`}
                  className={`size-4 rounded-sm ${
                    index > 0 && "-ml-1.5"
                  } z-[${domains.length - index}]`}
                />
              ))}
            </div>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pt-1 pb-5 text-sm bg-muted/50 rounded-lg [&>*:last-child]:mb-0">
        {isSearching ? (
          <div className="flex items-center gap-2 py-2">
            <div className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
            <span>Searching...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result: WebSearchResult, index: number) => (
              <div key={index} className="border-l-2 border-primary/20 pl-3">
                <div className="flex items-start gap-2">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${
                      new URL(result.url).hostname
                    }&sz=32`}
                    alt="favicon"
                    className="size-4 mt-0.5 rounded-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight mb-1">
                      <Link
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-primary"
                      >
                        {result.title}
                      </Link>
                    </h4>
                    <p className="text-xs text-muted-foreground mb-1">
                      {new URL(result.url).hostname}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {result.content?.substring(0, 200)}
                      {result.content?.length > 200 && "..."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
});

const MemoryBlock = memo(function MemoryBlock({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;
}) {
  const isAdding = toolInvocation.state !== "result";
  const memoryResult =
    toolInvocation.state === "result"
      ? (toolInvocation as any).result
      : undefined;
  const memoryText = memoryResult?.memory || toolInvocation.args?.memory || "";

  return (
    <div className="my-3 text-xs text-muted-foreground">
      {isAdding ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin size-3 border border-muted-foreground border-t-transparent rounded-full" />
          <span>Adding to memory...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Brain className="size-3" />
          <span>Memory added: {memoryText}</span>
        </div>
      )}
    </div>
  );
});
