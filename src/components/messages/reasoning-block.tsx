import {
  AIReasoning,
  AIReasoningContent,
  AIReasoningTrigger,
} from "@/components/ui/kibo-ui/ai/reasoning";

export const ReasoningBlock = function ReasoningBlock({
  reasoning,
  isStreaming,
}: {
  reasoning: string;
  isStreaming: boolean;
}) {
  return (
    <div className="w-full">
      <AIReasoning className="w-full" isStreaming={isStreaming}>
        <AIReasoningTrigger />
        <AIReasoningContent>{reasoning}</AIReasoningContent>
      </AIReasoning>
    </div>
  );
};
