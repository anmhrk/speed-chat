export type ReasoningEffort = 'low' | 'medium' | 'high';

export type Provider = 'aiGateway' | 'openai';

export type ModelId =
  | 'anthropic/claude-sonnet-4'
  | 'anthropic/claude-opus-4.1'
  | 'openai/gpt-5'
  | 'openai/gpt-5-mini'
  | 'google/gemini-2.5-flash'
  | 'google/gemini-2.5-pro';

export type ChatModel = {
  name: string;
  id: ModelId;
  reasoning: 'none' | 'always' | 'hybrid';
  supportsAttachments: boolean;
};

export const CHAT_MODELS: ChatModel[] = [
  {
    name: 'Claude Sonnet 4',
    id: 'anthropic/claude-sonnet-4',
    reasoning: 'hybrid',
    supportsAttachments: true,
  },
  {
    name: 'Claude Opus 4.1',
    id: 'anthropic/claude-opus-4.1',
    reasoning: 'hybrid',
    supportsAttachments: true,
  },
  {
    name: 'GPT 5',
    id: 'openai/gpt-5',
    reasoning: 'always',
    supportsAttachments: true,
  },
  {
    name: 'GPT 5 Mini',
    id: 'openai/gpt-5-mini',
    reasoning: 'always',
    supportsAttachments: true,
  },
  {
    name: 'Gemini 2.5 Flash',
    id: 'google/gemini-2.5-flash',
    reasoning: 'hybrid',
    supportsAttachments: true,
  },
  {
    name: 'Gemini 2.5 Pro',
    id: 'google/gemini-2.5-pro',
    reasoning: 'always',
    supportsAttachments: true,
  },
];
