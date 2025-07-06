import { memo, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Markdown } from "@/components/messages/markdown";

export const ReasoningBlock = memo(function ReasoningBlock({
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
