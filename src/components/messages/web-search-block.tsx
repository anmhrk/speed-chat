import { memo, useMemo, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Globe } from "lucide-react";
import Link from "next/link";
import type { WebSearchResult, WebSearchToolInvocation } from "@/lib/types";
import type { ToolInvocation } from "ai";

export const WebSearchBlock = memo(function WebSearchBlock({
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
        results.map((result: WebSearchResult) => new URL(result.url).hostname),
      ),
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
