import { Check, Copy, Download, Text, WrapText } from "lucide-react";
import { useTheme } from "next-themes";
import { memo, useCallback, useMemo, useState } from "react";
import ShikiHighlighter, { type Element, isInlineCode } from "react-shiki";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCopyClipboard } from "@/hooks/use-copy-clipboard";

const regex = /language-(\w+)/;

export const Code = memo(function CodeBlock({
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
  const match = className?.match(regex);
  const language = match ? match[1] : "text";
  const isInline = node ? isInlineCode(node) : false;
  const codeContent = String(children).replace(regex, "");
  const { isCopied, copyToClipboard } = useCopyClipboard();

  const handleCodeDownload = useCallback(() => {
    const blob = new Blob([codeContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "code.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [codeContent]);

  const codeBlockHeader = useMemo(
    () => (
      <div className="flex items-center justify-between rounded-t-lg bg-muted/70 px-3 dark:bg-[#313244]">
        <span className="font-medium text-muted-foreground text-sm dark:text-white/70">
          {language}
        </span>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-8 w-8"
                onClick={handleCodeDownload}
                size="icon"
                variant="ghost"
              >
                <Download className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Download code</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-8 w-8"
                onClick={() => setWrapText(!wrapText)}
                size="icon"
                variant="ghost"
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
                className="h-8 w-8"
                onClick={() => copyToClipboard(codeContent)}
                size="icon"
                variant="ghost"
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

  return isInline ? (
    <code className="rounded bg-muted p-1 font-mono text-sm">{children}</code>
  ) : (
    <div className="relative mt-8 mb-4 w-full overflow-hidden rounded-xl border last:mb-0">
      {codeBlockHeader}
      <ShikiHighlighter
        addDefaultStyles={false}
        className={`[&>pre]:px-4 [&>pre]:py-4 [&>pre]:text-[14px] ${wrapText ? "[&>pre]:whitespace-pre-wrap" : "[&>pre]:overflow-auto"}`}
        defaultColor={theme}
        delay={150}
        language={language}
        showLanguage={false}
        showLineNumbers={false}
        theme={{
          light: "github-light",
          dark: "github-dark",
        }}
        {...props}
      >
        {codeContent}
      </ShikiHighlighter>
    </div>
  );
});
