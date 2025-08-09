import type { UIMessage } from 'ai';
import { Check, Copy, PenBox } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { MessageActionButton } from '.';

export function UserMessage({ message }: { message: UIMessage }) {
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const messageContent = message.parts.find(
    (part) => part.type === 'text'
  )?.text;

  return (
    <div className="group flex flex-col items-end gap-2">
      <div className="max-w-[80%] rounded-lg bg-primary/5 px-4 py-2 text-secondary-foreground dark:bg-primary/10">
        {messageContent}
      </div>
      <div className="flex items-center gap-2">
        <MessageActionButton
          icon={PenBox}
          label="Edit Message"
          onClick={() => {
            // TODO: Implement edit message
          }}
        />
        <MessageActionButton
          icon={isCopied ? Check : Copy}
          label="Copy to clipboard"
          onClick={() => {
            if (messageContent) {
              copyToClipboard(messageContent);
            }
          }}
        />
      </div>
    </div>
  );
}
