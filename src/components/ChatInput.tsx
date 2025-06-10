import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ChatInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
}

export function ChatInput({ prompt, setPrompt }: ChatInputProps) {
  const [model, setModel] = useState("o4-mini");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      // TODO: Handle message submission
      console.log("Sending message:", prompt);
      setPrompt("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="bg-background border-border relative rounded-lg border">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="placeholder:text-muted-foreground max-h-[400px] min-h-[120px] w-full resize-none border-0 bg-transparent p-4 text-sm focus-visible:ring-0"
            rows={4}
          />

          {/* Bottom controls */}
          <div className="border-border flex items-center justify-between border-t px-4 py-3">
            <div className="flex items-center gap-3">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="h-8 w-auto min-w-[100px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="o4-mini">o4-mini</SelectItem>
                  <SelectItem value="o4">o4</SelectItem>
                  <SelectItem value="claude-3-5-sonnet">
                    Claude 3.5 Sonnet
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" size="sm" className="h-8 px-2">
                🔗 High
              </Button>

              <Button variant="ghost" size="sm" className="h-8 px-2">
                📎 Attach
              </Button>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={!prompt.trim()}
              className="h-8"
            >
              ↑
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
