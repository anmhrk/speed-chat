'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import type { Provider, ReasoningEffort } from '@/lib/models';
import { CHAT_MODELS } from '@/lib/models';

const chatConfigSchema = z.object({
  apiKeys: z.record(z.enum(['aiGateway', 'openai']), z.string()),
  model: z.enum(CHAT_MODELS.map((model) => model.name)),
  reasoningEffort: z.enum(['low', 'medium', 'high']),
  shouldUseReasoning: z.boolean(),
  searchWeb: z.boolean(),
});

type ChatConfig = z.infer<typeof chatConfigSchema>;

type ChatConfigContextType = ChatConfig & {
  setApiKeys: (apiKeys: Record<Provider, string>) => void;
  setModel: (model: string) => void;
  setReasoningEffort: (reasoningEffort: ReasoningEffort) => void;
  setShouldUseReasoning: (shouldUseReasoning: boolean) => void;
  setSearchWeb: (searchWeb: boolean) => void;
  isLoading: boolean;
};

const LOCAL_STORAGE_KEY = 'chat_config';

const DEFAULT_CONFIG: ChatConfig = {
  apiKeys: {
    aiGateway: '',
    openai: '',
  },
  model: CHAT_MODELS.find((model) => model.default)?.name ?? '',
  reasoningEffort: 'low',
  shouldUseReasoning: false,
  searchWeb: false,
};

const ChatConfigContext = createContext<ChatConfigContextType | undefined>(
  undefined
);

export function ChatConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [chatConfig, setChatConfig] = useState<ChatConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const rawConfig = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (rawConfig) {
        const parsedConfig = chatConfigSchema.safeParse(JSON.parse(rawConfig));

        if (parsedConfig.success) {
          setChatConfig(parsedConfig.data);
        } else {
          throw new Error(parsedConfig.error.message);
        }
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
      }
    } catch (error) {
      // TODO: Don't wipe the entire thing on bad parse. Only wipe the invalid fields.
      toast.error('Failed to load chat config. Default config will be used.', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      setChatConfig(DEFAULT_CONFIG);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChatConfigChange = (config: ChatConfig) => {
    setChatConfig(config);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  };

  const value: ChatConfigContextType = {
    ...chatConfig,
    setApiKeys: (apiKeys) => handleChatConfigChange({ ...chatConfig, apiKeys }),
    setModel: (model) => handleChatConfigChange({ ...chatConfig, model }),
    setReasoningEffort: (reasoningEffort) =>
      handleChatConfigChange({ ...chatConfig, reasoningEffort }),
    setShouldUseReasoning: (shouldUseReasoning) =>
      handleChatConfigChange({ ...chatConfig, shouldUseReasoning }),
    setSearchWeb: (searchWeb) =>
      handleChatConfigChange({ ...chatConfig, searchWeb }),
    isLoading,
  };

  return <ChatConfigContext value={value}>{children}</ChatConfigContext>;
}

export function useChatConfig() {
  const context = useContext(ChatConfigContext);
  if (!context) {
    throw new Error('useChatConfig must be used within a ChatConfigProvider');
  }
  return context;
}
