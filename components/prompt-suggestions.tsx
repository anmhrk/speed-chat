'use client';

import { useCustomChat } from './providers/chat-provider';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

const PROMPT_SUGGESTIONS = [
  'Explain how AI works in a way a 5 year old can understand',
  'How do I survive a long flight without losing my mind?',
  'What are the best sources of protein?',
  'Help me plan my summer vacation in Europe',
];

export function PromptSuggestions() {
  const { setInput, inputRef } = useCustomChat();

  return (
    <div className="w-full max-w-3xl">
      {PROMPT_SUGGESTIONS.map((suggestion, index) => (
        <div key={suggestion}>
          <Button
            className="h-auto w-full justify-start p-3 font-normal text-muted-foreground text-sm hover:text-foreground"
            onClick={() => {
              setInput(suggestion);
              inputRef.current?.focus();
            }}
            variant="ghost"
          >
            {suggestion}
          </Button>
          {index < PROMPT_SUGGESTIONS.length - 1 && (
            <div className="px-3">
              <Separator />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
