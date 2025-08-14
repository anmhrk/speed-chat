import { useState } from "react";
import { toast } from "sonner";
import removeMarkdown from "remove-markdown";

export function useCopyClipboard() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(removeMarkdown(text));
      setIsCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy to clipboard");
    }
  };

  return {
    isCopied,
    copyToClipboard,
  };
}
