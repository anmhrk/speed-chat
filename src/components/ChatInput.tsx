import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="py-6">
      <div className="relative flex items-end space-x-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mb-1 h-10 w-10 text-gray-400 hover:text-gray-600"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <form onSubmit={handleSubmit} className="relative flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="max-h-[120px] min-h-[52px] resize-none rounded-2xl border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-sm focus:border-purple-300 focus:bg-white focus:ring-purple-200"
            disabled={disabled}
          />
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="mt-3 flex items-center justify-center">
        <p className="text-xs text-gray-500">GPT-4.1</p>
      </div>
    </div>
  );
}
