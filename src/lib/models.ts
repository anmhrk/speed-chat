import type { ChatModel } from './types';

export const CHAT_MODELS: ChatModel[] = [
  {
    default: true,
    name: 'Claude Sonnet 4',
    id: 'anthropic/claude-sonnet-4',
    reasoning: 'hybrid',
  },
  {
    default: false,
    name: 'Claude Opus 4.1',
    id: 'anthropic/claude-opus-4.1',
    reasoning: 'hybrid',
  },
  {
    default: false,
    name: 'GPT 5',
    id: 'openai/gpt-5',
    reasoning: 'always',
  },
  {
    default: false,
    name: 'GPT 5 Mini',
    id: 'openai/gpt-5-mini',
    reasoning: 'always',
  },
  {
    default: false,
    name: 'Gemini 2.5 Flash',
    id: 'google/gemini-2.5-flash',
    reasoning: 'hybrid',
  },
  {
    default: false,
    name: 'Gemini 2.5 Pro',
    id: 'google/gemini-2.5-pro',
    reasoning: 'always',
  },
];
