import { memo, useCallback, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Download, WrapText, Text, Check, Copy } from "lucide-react";
import ShikiHighlighter, { Element, isInlineCode } from "react-shiki";
import { useCopyClipboard } from "@/hooks/use-copy-clipboard";

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
  const match = className?.match(/language-(\w+)/);
  const language = match ? match[1] : "text";
  const isInline = node ? isInlineCode(node) : false;
  const codeContent = String(children).replace(/\n$/, "");
  const { isCopied, copyToClipboard } = useCopyClipboard();

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
      <div className="bg-muted/70 dark:bg-[#313244] flex items-center justify-between rounded-t-lg px-3">
        <span className="text-muted-foreground dark:text-white/70 text-sm font-medium">
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
                onClick={() => copyToClipboard(codeContent)}
              >
                {isCopied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isCopied ? "Copied!" : "Copy code"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    ),
    [
      language,
      isCopied,
      codeContent,
      copyToClipboard,
      wrapText,
      handleCodeDownload,
    ]
  );

  return !isInline ? (
    <div className="mb-4 mt-8 w-full border rounded-xl overflow-hidden last:mb-0 relative">
      {codeBlockHeader}
      <ShikiHighlighter
        theme={{
          light: "catppuccin-latte",
          dark: "catppuccin-mocha",
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
