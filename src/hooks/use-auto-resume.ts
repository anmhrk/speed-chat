"use client";

import { useEffect } from "react";
import type { UIMessage } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";

export type DataPart = { type: "append-message"; message: string };

export interface Props {
  autoResume: boolean;
  initialMessages: UIMessage[];
  experimental_resume: UseChatHelpers["experimental_resume"];
  data: UseChatHelpers["data"];
  setMessages: UseChatHelpers["setMessages"];
}

export function useAutoResume({
  autoResume,
  initialMessages,
  experimental_resume,
  data,
  setMessages,
}: Props) {
  useEffect(() => {
    // Don't trigger if auto-resume is disabled or no messages loaded yet
    if (!autoResume || !initialMessages.length || !experimental_resume) return;

    const mostRecentMessage = initialMessages.at(-1);

    // Only resume if the last message is from the user (incomplete conversation)
    if (mostRecentMessage?.role === "user") {
      console.log(
        "[Auto Resume] Triggering resume for incomplete conversation",
        {
          chatId: window.location.pathname.split("/chat/")[1],
          lastMessageRole: mostRecentMessage.role,
          messageCount: initialMessages.length,
        }
      );

      // Add a small delay to ensure everything is initialized
      setTimeout(() => {
        try {
          experimental_resume();
        } catch (error) {
          console.error("[Auto Resume] Failed to resume:", error);
        }
      }, 100);
    } else {
      console.log(
        "[Auto Resume] Not resuming - last message is not from user",
        {
          lastMessageRole: mostRecentMessage?.role,
          messageCount: initialMessages.length,
        }
      );
    }

    // Include initialMessages in dependencies to trigger when messages actually load
  }, [autoResume, experimental_resume, initialMessages]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const dataPart = data[0] as DataPart;

    if (dataPart.type === "append-message") {
      console.log("[Auto Resume] Processing append-message data part");
      const message = JSON.parse(dataPart.message) as UIMessage;
      setMessages([...initialMessages, message]);
    }
  }, [data, initialMessages, setMessages]);
}
