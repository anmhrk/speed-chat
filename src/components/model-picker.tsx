import { AVAILABLE_MODELS } from "@/lib/models";
import { ScrollArea } from "./ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { REASONING_EFFORTS } from "@/lib/models";
import { Brain, File, Images, ChevronDown, Star, StarOff } from "lucide-react";
import { useSettingsContext } from "@/components/settings-provider";
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
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import type { ModelConfig, Models } from "@/lib/types";

export function ModelPicker() {
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
  } = useSettingsContext();

  const chatModels = AVAILABLE_MODELS.filter((m) => !m.imageGeneration).sort(
    (a, b) => a.id.localeCompare(b.id)
  );

  const imageModels = AVAILABLE_MODELS.filter((m) => m.imageGeneration).sort(
    (a, b) => a.id.localeCompare(b.id)
  );

  // Get favorite models (both chat and image)
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
  };

  const renderModelItem = (modelItem: ModelConfig) => (
    <CommandItem
      key={modelItem.id}
      value={`${modelItem.name} ${modelItem.providerName}`}
      onSelect={() => onModelSelect(modelItem.id)}
      disabled={!hasApiKeyForProvider(modelItem.providerId)}
      className="group rounded-xl mx-1 p-3 hover:bg-accent/50 transition-all duration-200 cursor-pointer border-0 data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed relative"
    >
      <Button
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          toggleFavoriteModel(modelItem.id);
        }}
        className="absolute -top-1 -left-1 inline-flex items-center justify-center h-5 w-5 rounded-full transition-all duration-200 z-10 bg-yellow-200 dark:bg-yellow-900 border-2 border-yellow-400 dark:border-yellow-600 opacity-0 group-hover:opacity-100 hover:scale-110"
      >
        {isFavoriteModel(modelItem.id) ? (
          <StarOff className="h-3 w-3 text-yellow-600 dark:text-yellow-400 fill-current" />
        ) : (
          <Star className="h-3 w-3 text-yellow-600 dark:text-yellow-400 fill-current" />
        )}
      </Button>

      <div className="flex items-start justify-between w-full gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">{modelItem.icon}</div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm truncate">
                {modelItem.name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground capitalize">
              {modelItem.providerName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {modelItem.reasoning && (
            <Tooltip>
              <TooltipTrigger>
                <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-200 dark:bg-blue-900">
                  <Brain className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Has reasoning capabilities</TooltipContent>
            </Tooltip>
          )}
          {modelItem.pdfInput && (
            <Tooltip>
              <TooltipTrigger>
                <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-purple-200 dark:bg-purple-900">
                  <File className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent>PDF attachment support</TooltipContent>
            </Tooltip>
          )}
          {modelItem.imageInput && (
            <Tooltip>
              <TooltipTrigger>
                <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-cyan-200 dark:bg-cyan-900">
                  <Images className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Image attachment support</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </CommandItem>
  );

  return (
    <>
      {isHydrated && model && reasoningEffort && (
        <>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="justify-between font-normal">
                <div className="flex items-center gap-2.5">
                  {selectedModel?.icon}
                  <span className="font-normal text-sm">
                    {selectedModel?.name}
                  </span>
                </div>
                <ChevronDown className="size-4 shrink-0 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="min-w-[400px] min-h-[460px] p-0 border overflow-hidden backdrop-blur-xl shadow-xl rounded-2xl"
              align="start"
            >
              <Command>
                <CommandInput
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search models..."
                  className="!bg-transparent"
                />
                <CommandList className="max-h-none h-[460px]">
                  <CommandEmpty>
                    No models found for "{search.toLowerCase()}"
                  </CommandEmpty>

                  <ScrollArea className="h-full">
                    <div className="space-y-3 mt-2">
                      {favoriteModelItems.length > 0 && (
                        <CommandGroup>
                          <div className="px-3 py-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              Favorite Models
                            </h4>
                          </div>
                          <div className="space-y-0.5">
                            {favoriteModelItems.map(renderModelItem)}
                          </div>
                          <CommandSeparator className="mx-1 mt-3" />
                        </CommandGroup>
                      )}

                      {nonFavoriteChatModels.length > 0 && (
                        <CommandGroup>
                          <div className="px-3 py-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Chat Models
                            </h4>
                          </div>
                          <div className="space-y-0.5">
                            {nonFavoriteChatModels.map(renderModelItem)}
                          </div>
                          {nonFavoriteImageModels.length > 0 && (
                            <CommandSeparator className="mx-1 mt-3" />
                          )}
                        </CommandGroup>
                      )}

                      {nonFavoriteImageModels.length > 0 && (
                        <CommandGroup>
                          <div className="px-3 py-2">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Image Models
                            </h4>
                          </div>
                          <div className="space-y-0.5">
                            {nonFavoriteImageModels.map(renderModelItem)}
                          </div>
                        </CommandGroup>
                      )}
                    </div>
                  </ScrollArea>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {AVAILABLE_MODELS.find((m) => m.id === model)?.reasoning && (
            <Select value={reasoningEffort} onValueChange={setReasoningEffort}>
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
        </>
      )}
    </>
  );
}
