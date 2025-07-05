"use client";

import { Button } from "@/components/ui/button";
import { getMemories, deleteMemory } from "@/lib/db/actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash, Brain, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Memory } from "@/lib/db/schema";

export default function MemoryPage() {
  const queryClient = useQueryClient();
  const [deletingMemories, setDeletingMemories] = useState<Set<string>>(
    new Set()
  );

  const {
    data: memories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["memories"],
    queryFn: getMemories,
  });

  const handleDeleteMemory = async (memoryId: string, memoryText: string) => {
    if (
      confirm(
        `Are you sure you want to delete this memory? This action cannot be undone.\n\n"${memoryText}"`
      )
    ) {
      try {
        setDeletingMemories((prev) => new Set(prev).add(memoryId));
        await deleteMemory(memoryId);
        queryClient.invalidateQueries({ queryKey: ["memories"] });
        toast.success("Memory deleted successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete memory");
      } finally {
        setDeletingMemories((prev) => {
          const newSet = new Set(prev);
          newSet.delete(memoryId);
          return newSet;
        });
      }
    }
  };

  const handleClearAllMemories = async () => {
    if (
      confirm(
        `Are you sure you want to delete all ${memories.length} memories? This action cannot be undone.`
      )
    ) {
      try {
        const deletePromises = memories.map((memory) =>
          deleteMemory(memory.id)
        );
        await Promise.all(deletePromises);
        queryClient.invalidateQueries({ queryKey: ["memories"] });
        toast.success("All memories deleted successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete all memories");
      }
    }
  };

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
        <>
          <div className="space-y-4">
            {memories.map((memory: Memory, index: number) => (
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
                    onClick={() => handleDeleteMemory(memory.id, memory.memory)}
                    disabled={deletingMemories.has(memory.id)}
                    className="ml-4 text-muted-foreground hover:text-destructive"
                  >
                    <Trash className="size-4" />
                  </Button>
                </div>
                {index < memories.length - 1 && <Separator />}
              </div>
            ))}
          </div>

          {memories.length > 1 && (
            <>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium text-destructive">
                    Clear All Memories
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Remove all stored memories permanently
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleClearAllMemories}
                  disabled={deletingMemories.size > 0}
                >
                  <Trash className="mr-2 size-4" />
                  Clear All
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
