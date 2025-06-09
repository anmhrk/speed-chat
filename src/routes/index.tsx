import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/ChatArea";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <ChatArea />
    </div>
  );
}
