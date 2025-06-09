import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatArea } from "@/components/ChatArea";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [activeChat, setActiveChat] = useState<string | null>("1"); // Start with first chat selected

  const handleNewChat = () => {
    // In a real app, this would create a new chat in the backend
    const newChatId = `new-${Date.now()}`;
    setActiveChat(newChatId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar
        activeChat={activeChat}
        onChatSelect={setActiveChat}
        onNewChat={handleNewChat}
      />
      <ChatArea activeChat={activeChat} />
    </div>
  );
}
