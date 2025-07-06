"use client";

import { Button } from "@/components/ui/button";
import { getMemories, deleteMemory } from "@/lib/db/actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash, Brain, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Memory } from "@/lib/db/schema";
import { toast } from "sonner";

export default function MemoryPage() {
  const queryClient = useQueryClient();

  const {
    data: memories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["memories"],
    queryFn: getMemories,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start justify-between py-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load memories</p>
          <Button
            variant="outline"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["memories"] })
            }
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="size-5" />
          <h2 className="text-lg font-semibold">Your Memories</h2>
        </div>
      </div>

      {memories.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No memories yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Start chatting with Speed Chat and it will automatically remember
            useful details about you, like your preferences, goals, and context
            that helps provide better responses.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {memories.map((memory: Memory) => (
            <div key={memory.id}>
              <div className="flex items-start justify-between py-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm leading-relaxed break-words">
                    {memory.memory}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    <span>
                      Added{" "}
                      {format(
                        new Date(memory.createdAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    queryClient.setQueryData(["memories"], (old: Memory[]) =>
                      old.filter((m) => m.id !== memory.id)
                    );
                    try {
                      deleteMemory(memory.id);
                    } catch {
                      toast.error(`Failed to delete memory: ${memory.memory}`);
                    }
                  }}
                  className="ml-4 text-muted-foreground hover:text-destructive"
                >
                  <Trash className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
