import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "./ui/button";
import { AVAILABLE_MODELS, REASONING_EFFORTS } from "./ChatInput";

interface ModelPickerProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  reasoningEffort: string;
  onReasoningEffortChange: (reasoningEffort: string) => void;
}

export function ModelPicker({
  selectedModel,
  onModelChange,
  reasoningEffort,
  onReasoningEffortChange,
}: ModelPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="h-8 w-auto min-w-[100px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_MODELS.sort((a, b) => {
            // First sort by provider
            if (a.provider !== b.provider) {
              return a.provider.localeCompare(b.provider);
            }
            // Within the same provider, sort by default (default models first)
            if (a.default && !b.default) return -1;
            if (!a.default && b.default) return 1;
            // If both or neither are default, sort by name
            return a.name.localeCompare(b.name);
          }).map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center gap-2">
                {model.logo}
                {model.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.reasoning && (
        <>
          <Select
            value={reasoningEffort}
            onValueChange={onReasoningEffortChange}
          >
            <SelectTrigger className="h-8 w-auto min-w-[100px] text-sm">
              <SelectValue />
            </SelectTrigger>
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
        </>
      )}

      {/* TODO: Implement this properly */}
      <Button variant="outline">📎 Attach</Button>
    </div>
  );
}
