import { memo } from "react";
import { ToolInvocation } from "ai";
import { Brain } from "lucide-react";
import { MemoryToolInvocation } from "@/lib/types";

export const MemoryBlock = memo(function MemoryBlock({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;
}) {
  const isAdding = toolInvocation.state !== "result";
  const memoryResult =
    toolInvocation.state === "result"
      ? (toolInvocation as MemoryToolInvocation).result
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
