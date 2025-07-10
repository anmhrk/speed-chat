import { AVAILABLE_MODELS } from "@/lib/models";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  REASONING_EFFORTS,
  shouldShowReasoningPill,
  shouldShowReasoningControls,
  isImageGenerationModel,
  hasReasoningCapability,
  supportsImageInput,
  supportsPdfInput,
} from "@/lib/models";
import {
  Brain,
  File,
  Images,
  ChevronDown,
  Star,
  Sparkles,
  StarOff,
  Check,
} from "lucide-react";
import { useSettingsContext } from "./providers/settings-provider";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "./ui/command";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "./ui/dialog";
import { cn } from "@/lib/utils";
import type { ModelConfig, Models } from "@/lib/types";
import { Switch } from "./ui/switch";

export function ModelPicker({
  hasFilesUploaded,
}: {
  hasFilesUploaded: boolean;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const {
    isHydrated,
    model,
    reasoningEffort,
    setModel,
    setReasoningEffort,
    hasApiKeyForProvider,
    favoriteModels,
    toggleFavoriteModel,
    isFavoriteModel,
    reasoningEnabled,
    setReasoningEnabled,
  } = useSettingsContext();

  const chatModels = AVAILABLE_MODELS.filter(
    (m) => !isImageGenerationModel(m.id)
  ).sort((a, b) => a.id.localeCompare(b.id));

  const imageModels = AVAILABLE_MODELS.filter((m) =>
    isImageGenerationModel(m.id)
  ).sort((a, b) => a.id.localeCompare(b.id));

  const favoriteModelItems = AVAILABLE_MODELS.filter((m) =>
    favoriteModels.includes(m.id)
  ).sort((a, b) => a.id.localeCompare(b.id));

  // Filter out favorites from regular lists
  const nonFavoriteChatModels = chatModels.filter(
    (m) => !favoriteModels.includes(m.id)
  );
  const nonFavoriteImageModels = imageModels.filter(
    (m) => !favoriteModels.includes(m.id)
  );

  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === model);

  const onModelSelect = (modelId: Models) => {
    setModel(modelId);
    setIsOpen(false);
    setSearch("");
  };

  const renderModelItem = (modelItem: ModelConfig) => {
    const isSelected = modelItem.id === model;
    const isFavorite = isFavoriteModel(modelItem.id);
    const isDisabled =
      !hasApiKeyForProvider(modelItem.providerId) ||
      (isImageGenerationModel(modelItem.id) && hasFilesUploaded);

    return (
      <CommandItem
        key={modelItem.id}
        value={`${modelItem.name} ${modelItem.providerName}`}
        onSelect={() => onModelSelect(modelItem.id)}
        disabled={isDisabled}
        className={cn(
          "group relative flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed aria-selected:bg-accent/30",
          isSelected && "bg-accent/50 border border-accent-foreground/20"
        )}
      >
        <Button
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteModel(modelItem.id);
          }}
          className="absolute -top-1 -left-1 inline-flex items-center justify-center h-4 w-4 rounded-full transition-all duration-200 z-10 bg-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-900 border-2 border-yellow-400 dark:border-yellow-600 opacity-0 group-hover:opacity-100 hover:scale-110"
        >
          {isFavorite ? (
            <StarOff className="size-3 text-yellow-600 dark:text-yellow-400 fill-current" />
          ) : (
            <Star className="size-3 text-yellow-600 dark:text-yellow-400 fill-current" />
          )}
        </Button>

        <div className="flex-shrink-0">{modelItem.icon}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-medium text-sm",
                isSelected && "text-foreground"
              )}
            >
              {modelItem.name}
            </span>
            {isSelected && <Check className="size-4" />}
          </div>
          <span className="text-xs text-muted-foreground">
            {modelItem.providerName}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {hasReasoningCapability(modelItem.id) && (
            <Tooltip>
              <TooltipTrigger>
                <div className="h-5 w-5 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Brain className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Has reasoning capabilities</TooltipContent>
            </Tooltip>
          )}
          {supportsImageInput(modelItem.id) && (
            <Tooltip>
              <TooltipTrigger>
                <div className="h-5 w-5 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Images className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Supports image input</TooltipContent>
            </Tooltip>
          )}
          {supportsPdfInput(modelItem.id) && (
            <Tooltip>
              <TooltipTrigger>
                <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center">
                  <File className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Supports PDF input</TooltipContent>
            </Tooltip>
          )}
        </div>
      </CommandItem>
    );
  };

  const reasoningEffortConfig = REASONING_EFFORTS.find(
    (e) => e.id === reasoningEffort
  );

  const shouldShowPill = selectedModel
    ? shouldShowReasoningPill(selectedModel.id, reasoningEnabled)
    : false;

  return (
    <>
      {isHydrated && model && reasoningEffort && (
        <div className="flex items-center gap-1">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 font-normal gap-1.5"
              >
                <div className="flex items-center gap-2">
                  {selectedModel?.icon}
                  <span className="text-sm">{selectedModel?.name}</span>
                  {shouldShowPill && reasoningEffortConfig && (
                    <div
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs",
                        "bg-violet-500/10 dark:bg-violet-400/20 text-violet-600 dark:text-violet-400"
                      )}
                    >
                      <reasoningEffortConfig.icon className="h-3 w-3" />
                      <span className="capitalize hidden md:inline">
                        {reasoningEffortConfig.id}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronDown className="size-4 opacity-70" />
              </Button>
            </DialogTrigger>
            <DialogContent className="p-2 shadow-lg backdrop-blur-xl rounded-xl border bg-popover">
              <DialogTitle className="sr-only">Select Model</DialogTitle>
              <Command
                className="rounded-lg"
                onMouseLeave={() => {
                  // Reset internal hover state when mouse leaves the item
                  // Cos hover state was persisting when leaving the item and I didnt like that
                  const commandItems = document.querySelectorAll("[cmdk-item]");
                  commandItems.forEach((item) => {
                    item.removeAttribute("aria-selected");
                    item.removeAttribute("data-selected");
                  });
                }}
              >
                <CommandInput
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search models..."
                  className="h-9 border-0 bg-transparent focus:ring-0"
                />
                <CommandList className="max-h-[350px] w-full overflow-y-auto">
                  <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                    No models found for &quot;{search}&quot;
                  </CommandEmpty>
                  {favoriteModelItems.length > 0 && (
                    <>
                      <CommandGroup>
                        <div className="flex items-center gap-1.5 p-2 text-xs font-medium text-muted-foreground">
                          <Star className="h-3 w-3" />
                          Favorites
                        </div>
                        <div className="space-y-1">
                          {favoriteModelItems.map(renderModelItem)}
                        </div>
                      </CommandGroup>
                      <CommandSeparator className="my-2" />
                    </>
                  )}
                  {nonFavoriteChatModels.length > 0 && (
                    <CommandGroup>
                      <div className="flex items-center gap-1.5 p-2 text-xs font-medium text-muted-foreground">
                        <Sparkles className="h-3 w-3" />
                        Chat Models
                      </div>
                      <div className="space-y-1">
                        {nonFavoriteChatModels.map(renderModelItem)}
                      </div>
                    </CommandGroup>
                  )}
                  {nonFavoriteImageModels.length > 0 && (
                    <>
                      <CommandSeparator className="my-2" />
                      <CommandGroup>
                        <div className="flex items-center gap-1.5 p-2 text-xs font-medium text-muted-foreground">
                          <Images className="h-3 w-3" />
                          Image Models
                        </div>
                        <div className="space-y-1">
                          {nonFavoriteImageModels.map(renderModelItem)}
                        </div>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>

              {selectedModel &&
                shouldShowReasoningControls(selectedModel.id) &&
                !search.trim() && (
                  <div className="pt-3 border-t space-y-3">
                    {selectedModel?.features.reasoning.toggleable && (
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <div>
                            <div className="text-sm font-medium">
                              Allow Reasoning
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Let the model think before answering
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={reasoningEnabled}
                          onCheckedChange={setReasoningEnabled}
                        />
                      </div>
                    )}

                    {selectedModel?.features.reasoning.supportsEffort && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-1">
                          <div className="text-sm font-medium text-muted-foreground">
                            Reasoning Effort
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {REASONING_EFFORTS.map((effort) => (
                            <Button
                              key={effort.id}
                              variant="outline"
                              size="sm"
                              onClick={() => setReasoningEffort(effort.id)}
                              className={cn(
                                "flex flex-col items-center gap-1 px-2 py-2 h-auto rounded-lg transition-all",
                                reasoningEffort === effort.id
                                  ? "bg-violet-500/10 hover:bg-violet-500/10 dark:bg-violet-400/20 dark:hover:bg-violet-400/20 border-violet-500/20 dark:border-violet-400/30"
                                  : "border-border hover:border-accent-foreground/20"
                              )}
                            >
                              <effort.icon
                                className={cn(
                                  "h-4 w-4",
                                  reasoningEffort === effort.id
                                    ? "text-violet-600 dark:text-violet-400"
                                    : "text-muted-foreground"
                                )}
                              />
                              <span
                                className={cn(
                                  "text-xs font-medium capitalize",
                                  reasoningEffort === effort.id
                                    ? "text-violet-600 dark:text-violet-400"
                                    : "text-muted-foreground"
                                )}
                              >
                                {effort.id}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </>
  );
}
