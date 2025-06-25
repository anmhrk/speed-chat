"use client";

import { ArrowUp, Globe, Paperclip, Square } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { AVAILABLE_MODELS, REASONING_EFFORTS } from "@/lib/models";
import { useSettingsContext } from "./settings-provider";
import { Providers } from "@/lib/types";
import { Toggle } from "./ui/toggle";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  stop: () => void;
  status: "submitted" | "streaming" | "ready" | "error";
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  stop,
  status,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { model, setModel, apiKeys, reasoningEffort, setReasoningEffort } =
    useSettingsContext();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      (e.target as HTMLTextAreaElement).form?.requestSubmit();
    }

    if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  };

  const hasApiKey = (provider: Providers) => {
    return apiKeys?.[provider] && apiKeys[provider].trim() !== "";
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border p-2 max-w-3xl w-full mx-auto"
    >
      <Textarea
        ref={inputRef}
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        className="placeholder:text-muted-foreground !bg-background max-h-[250px] min-h-[90px] w-full resize-none rounded-t-2xl border-0 !text-[15px] shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          {model && reasoningEffort && (
            <>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-auto min-w-[100px] p-2 text-sm rounded-xl">
                  {AVAILABLE_MODELS.find((m) => m.id === model)?.name}
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.sort((a, b) => {
                    if (a.provider !== b.provider) {
                      return a.provider.localeCompare(b.provider);
                    }
                    return a.name.localeCompare(b.name);
                  }).map((model) => {
                    const isDisabled = !hasApiKey(model.provider);
                    const selectItem = (
                      <SelectItem
                        key={model.id}
                        value={model.id}
                        disabled={isDisabled}
                      >
                        <div className="flex w-70 items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <model.icon className="size-4" />
                            {model.name}
                            <div className="text-xs">({model.provider})</div>
                          </div>
                        </div>
                      </SelectItem>
                    );

                    if (isDisabled) {
                      return (
                        <Tooltip key={model.id}>
                          <TooltipTrigger asChild>
                            <div className="w-full">{selectItem}</div>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">
                            API key not set for provider
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return selectItem;
                  })}
                </SelectContent>
              </Select>

              {AVAILABLE_MODELS.find((m) => m.id === model)?.reasoning && (
                <Select
                  value={reasoningEffort}
                  onValueChange={setReasoningEffort}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectTrigger
                        className="w-auto rounded-full text-sm flex"
                        hideChevron
                      >
                        {(() => {
                          const effort = REASONING_EFFORTS.find(
                            (e) => e.id === reasoningEffort
                          );
                          if (effort) {
                            const IconComponent = effort.icon;
                            return <IconComponent className="size-4" />;
                          }
                          return null;
                        })()}
                        <span className="hidden md:block">
                          {reasoningEffort!.charAt(0).toUpperCase() +
                            reasoningEffort!.slice(1)}
                        </span>
                      </SelectTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Set reasoning effort</TooltipContent>
                  </Tooltip>
                  <SelectContent>
                    {REASONING_EFFORTS.map((effort) => (
                      <SelectItem
                        key={effort.id}
                        value={effort.id}
                        className="flex items-center gap-2"
                      >
                        <effort.icon className="size-4" />
                        {effort.id.charAt(0).toUpperCase() + effort.id.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Toggle
                  variant="outline"
                  className="gap-1.5 rounded-full px-3 py-2 font-normal"
                >
                  <Globe className="size-4" />
                  <span className="hidden md:block">Search</span>
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent>Enable web search</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="gap-1.5 rounded-full px-3 py-2 font-normal"
              >
                <Paperclip className="size-4" />
                <span className="hidden md:block">Attach</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Only images are supported currently</TooltipContent>
          </Tooltip>
        </div>

        {status === "submitted" || status === "streaming" ? (
          <Button
            size="icon"
            onClick={stop}
            className="bg-muted-foreground hover:bg-muted-foreground/80 h-8 w-8"
          >
            <Square className="size-6" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            className="h-8 w-8"
          >
            <ArrowUp className="size-6" />
          </Button>
        )}
      </div>
    </form>
  );
}
