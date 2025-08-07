'use client';

import {
  ArrowUp,
  Brain,
  ChevronDown,
  Globe,
  type LucideIcon,
  Paperclip,
  PenLine,
  Settings2,
  WandSparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useChatConfig } from '@/components/providers/chat-config-provider';
import { CHAT_MODELS } from '@/lib/models';
import { getModelIcon } from './model-icons';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function ChatInput() {
  const [input, setInput] = useState('');
  const { model, setModel, isLoading } = useChatConfig();

  return (
    <form className="mx-auto w-full max-w-3xl shrink-0 rounded-xl bg-[#F5F5F5] p-2 px-4 sm:px-2 dark:bg-[#262626]">
      <Textarea
        autoFocus
        className="!text-[15px] !bg-transparent max-h-[200px] min-h-[80px] w-full resize-none border-0 px-1 shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
        onChange={(e) => setInput(e.target.value)}
        placeholder="Send a message"
        value={input}
      />
      <div className="flex justify-between px-1 pt-2">
        <div className="flex items-center gap-2">
          <SettingsPopover />
          <SettingsIndicators />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isLoading} variant="chatInput">
                {isLoading ? null : model}
                <ChevronDown className="text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl p-2">
              <div className="flex flex-col gap-1">
                {CHAT_MODELS.sort((a, b) =>
                  a.id.split('/')[0].localeCompare(b.id.split('/')[0])
                ).map((m) => (
                  <DropdownMenuItem
                    className="flex items-center gap-2 rounded-lg py-2"
                    key={m.id}
                    onClick={() => setModel(m.name)}
                  >
                    {getModelIcon(m.id)}
                    {m.name}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="rounded-full"
            disabled={!input}
            size="icon"
            type="submit"
          >
            <ArrowUp className="size-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </form>
  );
}

function SettingsPopover() {
  const {
    model,
    reasoningEffort,
    setReasoningEffort,
    shouldUseReasoning,
    setShouldUseReasoning,
    searchWeb,
    setSearchWeb,
  } = useChatConfig();

  const currentModel = CHAT_MODELS.find((m) => m.name === model);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" type="button" variant="chatInput">
                <Settings2 className="size-5" strokeWidth={1.7} />
                <span className="sr-only">Settings</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 rounded-xl p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="size-5" strokeWidth={1.7} />
                    <span className="text-sm">Attach files</span>
                  </div>
                  <Button size="sm" variant="outline">
                    Attach
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="size-5" strokeWidth={1.7} />
                    <span className="text-sm">Enable web search</span>
                  </div>
                  <Switch checked={searchWeb} onCheckedChange={setSearchWeb} />
                </div>

                {currentModel?.reasoning !== 'none' && (
                  <div className="space-y-4">
                    {currentModel?.reasoning === 'hybrid' && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="size-5" strokeWidth={1.7} />
                          <span className="text-sm">Enable reasoning</span>
                        </div>
                        <Switch
                          checked={shouldUseReasoning}
                          onCheckedChange={setShouldUseReasoning}
                        />
                      </div>
                    )}

                    {(shouldUseReasoning ||
                      currentModel?.reasoning === 'always') && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <WandSparkles className="size-5" strokeWidth={1.7} />
                          <span className="text-sm">
                            Choose reasoning effort
                          </span>
                        </div>
                        <div className="grid w-full grid-cols-3 gap-2">
                          {(['low', 'medium', 'high'] as const).map(
                            (effort) => (
                              <Button
                                key={effort}
                                onClick={() => setReasoningEffort(effort)}
                                size="sm"
                                variant={
                                  reasoningEffort === effort
                                    ? 'default'
                                    : 'outline'
                                }
                              >
                                {effort.charAt(0).toUpperCase() +
                                  effort.slice(1)}
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                <Button className="w-full" variant="outline">
                  <PenLine className="mr-1 size-5" strokeWidth={1.7} />
                  Use custom prompt
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </TooltipTrigger>
      <TooltipContent>Settings</TooltipContent>
    </Tooltip>
  );
}

function SettingsIndicators() {
  const {
    searchWeb,
    shouldUseReasoning,
    setSearchWeb,
    setShouldUseReasoning,
    reasoningEffort,
    model,
  } = useChatConfig();

  const currentModel = CHAT_MODELS.find((m) => m.name === model);
  const isHybrid = currentModel?.reasoning === 'hybrid';

  const indicators: {
    icon: LucideIcon;
    text: string;
    type: 'search' | 'reasoning';
    onClick: () => void;
    tooltip: string;
    showX: boolean;
  }[] = [];

  if (searchWeb) {
    indicators.push({
      icon: Globe,
      text: 'Search',
      type: 'search' as const,
      onClick: () => setSearchWeb(false),
      tooltip: 'Web search enabled',
      showX: true,
    });
  }

  if (shouldUseReasoning || currentModel?.reasoning === 'always') {
    indicators.push({
      icon: Brain,
      text: reasoningEffort.charAt(0).toUpperCase() + reasoningEffort.slice(1),
      type: 'reasoning' as const,
      onClick: () => {
        if (isHybrid) {
          setShouldUseReasoning(false);
        }
      },
      tooltip: 'Reasoning enabled',
      showX: isHybrid,
    });
  }

  return (
    <div className="flex items-center gap-2">
      {indicators.map((indicator) => (
        <Tooltip key={indicator.type}>
          <TooltipTrigger asChild>
            <Button
              className="gap-1 rounded-full border border-blue-100 bg-[#F5FAFF] text-blue-400 hover:bg-[#F5FAFF] dark:bg-[#3B4044] dark:text-blue-400 dark:hover:bg-[#3B4044]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                indicator.onClick();
              }}
            >
              <indicator.icon className="size-5" strokeWidth={1.7} />
              <span className="hidden font-normal text-[13px] sm:block">
                {indicator.text}
              </span>
              {indicator.showX && (
                <X className="size-4 text-blue-400" strokeWidth={1.7} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{indicator.tooltip}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
