"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { searchChats } from "@/lib/db/actions";
import { MessageSquare, Hash, User as UserIcon, Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { User } from "better-auth";
import Link from "next/link";

interface SearchChatsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function SearchChats({ isOpen, onOpenChange, user }: SearchChatsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const debouncedSetQuery = debounce((query: string) => {
      setDebouncedQuery(query);
    }, 500);

    debouncedSetQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["search-chats", debouncedQuery],
    queryFn: () => searchChats(debouncedQuery),
    enabled: Boolean(debouncedQuery.trim()),
    staleTime: 5 * 60 * 1000,
  });

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          className="bg-fuchsia-200 dark:bg-fuchsia-800 rounded px-0.5"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Search Chats</DialogTitle>
      <DialogContent className="max-w-2xl p-0" showCloseButton={false}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search chats and messages..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            disabled={!user}
          />
          <CommandList className="max-h-[400px]">
            {user ? (
              <>
                {!debouncedQuery.trim() ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                    Start typing to search through your chats and messages
                  </div>
                ) : isLoading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : error ? (
                  <div className="py-6 text-center text-sm text-destructive">
                    Error searching chats
                  </div>
                ) : !searchResults || searchResults.length === 0 ? (
                  <CommandEmpty>
                    No chats found matching &quot;{debouncedQuery}&quot;
                  </CommandEmpty>
                ) : (
                  <CommandGroup heading="Search Results">
                    {searchResults.map((result) => (
                      <Link
                        key={result.chat.id}
                        href={`/chat/${result.chat.id}`}
                        className="flex flex-col items-start gap-2 p-4 cursor-pointer hover:bg-accent rounded-sm"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              {result.titleMatch
                                ? highlightMatch(
                                    result.chat.title,
                                    debouncedQuery
                                  )
                                : result.chat.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(result.chat.updatedAt),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </div>
                          </div>
                          {result.chat.isPinned && (
                            <Hash className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>

                        {result.matchingMessages.length > 0 && (
                          <div className="w-full pl-6 space-y-1">
                            {result.matchingMessages.map((message) => (
                              <div
                                key={message.id}
                                className="text-xs text-muted-foreground bg-muted/50 rounded p-2"
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  {message.role === "user" ? (
                                    <UserIcon className="h-3 w-3" />
                                  ) : (
                                    <Bot className="h-3 w-3" />
                                  )}
                                  <span className="font-medium capitalize">
                                    {message.role}
                                  </span>
                                </div>
                                <div className="text-xs">
                                  {highlightMatch(
                                    truncateText(message.content, 100),
                                    debouncedQuery
                                  )}
                                </div>
                              </div>
                            ))}
                            {result.matchingMessages.length === 3 && (
                              <div className="text-xs text-muted-foreground italic">
                                More matches in this chat...
                              </div>
                            )}
                          </div>
                        )}
                      </Link>
                    ))}
                  </CommandGroup>
                )}
              </>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Please sign in to search through your chats and messages
              </div>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
