import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";

interface Model {
  id: string;
  name: string;
  description: string;
}

const dummyModels: Model[] = [
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "Most capable model, best for complex tasks",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast and efficient for most tasks",
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    description: "Excellent for analysis and reasoning",
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    description: "Balanced performance and speed",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    description: "Google's most advanced model",
  },
];

interface ModelPickerProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ModelPicker({
  selectedModel,
  onModelChange,
}: ModelPickerProps) {
  const selectedModelData = dummyModels.find(
    (model) => model.id === selectedModel,
  );

  return (
    <div className="flex items-center justify-center">
      <Select value={selectedModel} onValueChange={onModelChange}>
        <SelectTrigger className="h-9 w-auto border-none bg-transparent px-0 text-sm font-medium text-gray-700 shadow-none hover:bg-gray-50 focus:ring-0">
          <SelectValue placeholder="Select a model">
            {selectedModelData && (
              <div className="flex items-center space-x-1">
                <span>{selectedModelData.name}</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {dummyModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-gray-500">
                  {model.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
