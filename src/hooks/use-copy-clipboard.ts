import { useState } from 'react';
import removeMarkdown from 'remove-markdown';
import { toast } from 'sonner';

export function useCopyClipboard() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(removeMarkdown(text));
      setIsCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return {
    isCopied,
    copyToClipboard,
  };
}
