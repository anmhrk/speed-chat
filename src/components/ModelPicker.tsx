import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "./ui/button";
import { AVAILABLE_MODELS, REASONING_EFFORTS } from "@/lib/models";
import { Toggle } from "./ui/toggle";
import { Globe, Paperclip, Brain } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import type { Models, ReasoningEfforts } from "@/lib/types";

interface ModelPickerProps {
  selectedModel: Models;
  onModelChange: (modelId: Models) => void;
  reasoningEffort: ReasoningEfforts;
  onReasoningEffortChange: (reasoningEffort: ReasoningEfforts) => void;
  availableApiKeys?: Record<string, string> | null;
}

export function ModelPicker({
  selectedModel,
  onModelChange,
  reasoningEffort,
  onReasoningEffortChange,
  availableApiKeys,
}: ModelPickerProps) {
  // Check if a provider has an API key configured
  const hasApiKey = (provider: string) => {
    return (
      availableApiKeys?.[provider] && availableApiKeys[provider].trim() !== ""
    );
  };

  return (
    <div className="flex items-center gap-3">
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="h-8 w-auto min-w-[100px] text-sm">
          <div className="flex items-center gap-2">
            {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.logo}
            {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name}
          </div>
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_MODELS.sort((a, b) => {
            // First sort by provider
            if (a.provider !== b.provider) {
              return a.provider.localeCompare(b.provider);
            }
            // Within the same provider, sort by default (default models first)
            if (a.default && !b.default) return -1;
            if (!a.default && b.default) return 1;
            // If both or neither are default, sort by name
            return a.name.localeCompare(b.name);
          }).map((model) => {
            // Always allow Gemini 2.5 Flash (free usage), disable others without API keys
            const isDisabled =
              model.id !== "google/gemini-2.5-flash-preview-05-20" &&
              !hasApiKey(model.provider);
            const selectItem = (
              <SelectItem key={model.id} value={model.id} disabled={isDisabled}>
                <div className="flex w-70 items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {model.logo}
                    {model.name}
                    <div className="text-muted-foreground text-xs">
                      {model.provider}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {model.reasoning && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Brain className="size-4 text-cyan-400" />
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          Has reasoning capabilities
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {model.search && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Globe className="size-4 text-blue-400" />
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          Can search the web
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {model.attachments && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Paperclip className="size-4 text-green-400" />
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          Supports images and PDFs
                        </TooltipContent>
                      </Tooltip>
                    )}
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
                    {model.id === "google/gemini-2.5-flash-preview-05-20"
                      ? "Available for free usage (rate limited)"
                      : "API key not set for provider"}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return selectItem;
          })}
        </SelectContent>
      </Select>

      {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.reasoning && (
        <Select value={reasoningEffort} onValueChange={onReasoningEffortChange}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SelectTrigger className="h-8 w-auto min-w-[40px] text-sm md:min-w-[100px] [&>svg]:hidden md:[&>svg]:block">
                <div className="flex items-center gap-2">
                  {(() => {
                    const effort = REASONING_EFFORTS.find(
                      (e) => e.id === reasoningEffort,
                    );
                    if (effort) {
                      const IconComponent = effort.icon;
                      return <IconComponent className="size-4" />;
                    }
                    return null;
                  })()}
                  <span className="hidden md:block">
                    {reasoningEffort.charAt(0).toUpperCase() +
                      reasoningEffort.slice(1)}
                  </span>
                </div>
              </SelectTrigger>
            </TooltipTrigger>
            <TooltipContent>Set reasoning effort</TooltipContent>
          </Tooltip>
          <SelectContent>
            {REASONING_EFFORTS.map((effort) => (
              <SelectItem key={effort.id} value={effort.id}>
                <div className="flex items-center gap-2">
                  <effort.icon className="size-4" />
                  {effort.id.charAt(0).toUpperCase() + effort.id.slice(1)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.attachments && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Paperclip className="size-4" />
              <p className="hidden md:block">Attach</p>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Only images are supported currently</TooltipContent>
        </Tooltip>
      )}

      {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.search && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Toggle variant="outline" className="flex items-center gap-2">
                <Globe className="size-4" />
                <p className="hidden md:block">Search</p>
              </Toggle>
            </div>
          </TooltipTrigger>
          <TooltipContent>Enable web search</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
