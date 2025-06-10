import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "./ui/button";
import type { Model } from "./ChatInput";

interface ModelPickerProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  models: Model[];
}

export function ModelPicker({
  models,
  selectedModel,
  onModelChange,
}: ModelPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="h-8 w-auto min-w-[100px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models
            .sort((a, b) => {
              // First sort by provider
              if (a.provider !== b.provider) {
                return a.provider.localeCompare(b.provider);
              }
              // Within the same provider, sort by default (default models first)
              if (a.default && !b.default) return -1;
              if (!a.default && b.default) return 1;
              // If both or neither are default, sort by name
              return a.name.localeCompare(b.name);
            })
            .map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  {model.logo}
                  {model.name}
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {models.find((m) => m.id === selectedModel)?.reasoning && (
        <Button variant="ghost" size="sm" className="h-8 px-2">
          🧠 Reasoning
        </Button>
      )}

      <Button variant="ghost" size="sm" className="h-8 px-2">
        📎 Attach
      </Button>
    </div>
  );
}
