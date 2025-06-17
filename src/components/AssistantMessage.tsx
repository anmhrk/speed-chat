import type { Message } from "ai";
import { Check, Copy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, memo, useMemo, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import removeMarkdown from "remove-markdown";
import "katex/dist/katex.min.css";

interface AssistantMessageProps {
  message: Message;
  reload: () => void;
  isLastMessage: boolean;
}

const CodeBlock = memo(function CodeBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { theme } = useTheme();
  const [codeCopied, setCodeCopied] = useState(false);
  const match = /language-(\w+)/.exec(className ?? "");
  const isDark = theme === "dark";
  const language = match?.[1] || "text";
  const codeContent = String(children).replace(/\n$/, "");

  const handleCodeCopy = useCallback(() => {
    navigator.clipboard.writeText(codeContent);
    toast.success("Code copied to clipboard");
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [codeContent]);

  const codeBlockHeader = useMemo(
    () => (
      <div className="bg-muted/50 flex items-center justify-between border-b px-4">
        <span className="text-muted-foreground text-sm font-medium">
          {language}
        </span>
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
    ),
    [language, codeCopied, handleCodeCopy],
  );

  return match ? (
    <div className="my-4 w-full rounded-lg border">
      {codeBlockHeader}
      <SyntaxHighlighter
        language={language}
        style={isDark ? oneDark : oneLight}
        PreTag="div"
        customStyle={{
          fontSize: "14px",
          margin: 0,
        }}
        codeTagProps={{
          style: {
            fontFamily:
              "ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
          },
        }}
      >
        {codeContent}
      </SyntaxHighlighter>
    </div>
  ) : (
    // Inline code
    <code className="bg-muted rounded px-1 py-0.5 font-mono text-sm">
      {children}
    </code>
  );
});

export function AssistantMessage({
  message,
  reload,
  isLastMessage,
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
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code: ({ children, className }) => (
                  <CodeBlock className={className}>{children}</CodeBlock>
                ),

                hr: () => <hr className="border-border my-10" />,

                p: ({ children }) => (
                  <p className="my-4 whitespace-pre-wrap">{children}</p>
                ),

                ul: ({ children }) => (
                  <ul className="mb-4 list-disc pl-5">{children}</ul>
                ),

                ol: ({ children }) => (
                  <ol className="mb-4 list-decimal pl-5">{children}</ol>
                ),

                li: ({ children }) => <li className="mb-1 pl-2">{children}</li>,

                h1: ({ children }) => (
                  <h1 className="mt-6 mb-4 text-2xl font-bold">{children}</h1>
                ),

                h2: ({ children }) => (
                  <h2 className="mt-5 mb-3 text-xl font-bold">{children}</h2>
                ),

                h3: ({ children }) => (
                  <h3 className="mt-4 mb-3 text-lg font-bold">{children}</h3>
                ),

                h4: ({ children }) => (
                  <h4 className="mt-3 mb-2 text-base font-bold">{children}</h4>
                ),

                h5: ({ children }) => (
                  <h5 className="mt-3 mb-2 text-sm font-bold">{children}</h5>
                ),

                h6: ({ children }) => (
                  <h6 className="mt-3 mb-2 text-xs font-bold">{children}</h6>
                ),

                blockquote: ({ children }) => (
                  <blockquote className="border-primary bg-muted my-6 border-l-4 py-2 pl-4 italic">
                    {children}
                  </blockquote>
                ),

                table: ({ children }) => (
                  <div className="border-border my-6 overflow-hidden rounded-lg border">
                    <table className="min-w-full border-collapse">
                      {children}
                    </table>
                  </div>
                ),

                thead: ({ children }) => (
                  <thead className="bg-muted/50">{children}</thead>
                ),

                tbody: ({ children }) => <tbody>{children}</tbody>,

                th: ({ children }) => (
                  <th className="border-border border-r border-b px-4 py-2 text-left font-semibold last:border-r-0">
                    {children}
                  </th>
                ),

                td: ({ children }) => (
                  <td className="border-border border-r border-b px-4 py-2 last:border-r-0 [tr:last-child>&]:border-b-0">
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
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
}
