import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SuggestionsProps {
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  setInput: (input: string) => void;
  promptSuggestions: string[] | undefined;
}

export function Suggestions({
  inputRef,
  setInput,
  promptSuggestions,
}: SuggestionsProps) {
  if (!promptSuggestions || promptSuggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl">
      {promptSuggestions.map((suggestion, index) => (
        <div key={index}>
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-3 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setInput(suggestion);
              inputRef.current?.focus();
            }}
          >
            {suggestion}
          </Button>
          {index < promptSuggestions.length - 1 && (
            <div className="px-3">
              <Separator />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
