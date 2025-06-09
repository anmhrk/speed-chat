import { useState } from "react";
import { signIn, useSession } from "@/backend/auth/auth-client";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatArea } from "@/components/ChatArea";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { data: session, isPending } = useSession();
  const [activeChat, setActiveChat] = useState<string | null>("1"); // Start with first chat selected

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">
            AI Chat App
          </h1>
          <Button
            onClick={() => signIn.social({ provider: "google" })}
            className="w-full py-3 text-lg"
            size="lg"
          >
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

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
