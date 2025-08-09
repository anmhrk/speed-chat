// import { useMutation } from '@tanstack/react-query';
import type { UIMessage } from 'ai';
import { Check, Copy, PenBox } from 'lucide-react';
// import { useState } from 'react';
// import { orpc } from '@/backend/orpc';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
// import { useCustomChat } from '../providers/chat-provider';
import { MessageActionButton } from '.';

export function UserMessage({ message }: { message: UIMessage }) {
  // const { messages } = useCustomChat();
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  // const [isEditing, setIsEditing] = useState(false);
  const messageContent = message.parts.find(
    (part) => part.type === 'text'
  )?.text;
  // const [messagesToDelete, setMessagesToDelete] = useState<string[]>([]);

  // const deleteMessages = useMutation(
  //   orpc.chatActionsRouter.deleteMessages.mutationOptions()
  // );

  // const handleEditMessage = () => {
  //   setIsEditing(false);
  //   const editingMessageIndex = messages.findIndex((m) => m.id === message.id);

  //   const messagesToCheck = messages.slice(editingMessageIndex + 1);
  //   setMessagesToDelete(messagesToCheck.map((m) => m.id));
  //   deleteMessages.mutate();
  //   messages.splice(editingMessageIndex + 1);
  // };

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
            console.log('edit message');
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
