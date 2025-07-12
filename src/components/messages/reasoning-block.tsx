import {
  AIReasoning,
  AIReasoningContent,
  AIReasoningTrigger,
} from "@/components/ui/kibo-ui/ai/reasoning";

export const ReasoningBlock = function ReasoningBlock({
  reasoning,
  isStreaming,
  duration,
}: {
  reasoning: string;
  isStreaming: boolean;
  duration?: number;
}) {
  return (
    <div className="w-full">
      <AIReasoning className="w-full" isStreaming={isStreaming} duration={duration}>
        <AIReasoningTrigger />
        <AIReasoningContent>{reasoning}</AIReasoningContent>
      </AIReasoning>
    </div>
  );
};
