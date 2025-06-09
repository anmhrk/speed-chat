import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { UserButton } from "./UserButton";

interface Chat {
  id: string;
  title: string;
  timestamp: string;
}

const dummyChats: Chat[] = [
  {
    id: "1",
    title: "Help with React components",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    title: "JavaScript debugging",
    timestamp: "1 day ago",
  },
  {
    id: "3",
    title: "CSS Grid layout",
    timestamp: "2 days ago",
  },
  {
    id: "4",
    title: "API integration",
    timestamp: "3 days ago",
  },
  {
    id: "5",
    title: "Database queries",
    timestamp: "1 week ago",
  },
];

interface ChatSidebarProps {
  activeChat: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({
  activeChat,
  onChatSelect,
  onNewChat,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200">
      <div className="p-4">
        <h1 className="mb-4 text-center text-xl font-semibold text-gray-900">
          AI Chat App
        </h1>
        <Button
          onClick={onNewChat}
          className="w-full bg-purple-600 py-2.5 font-medium text-white hover:bg-purple-700"
          size="default"
        >
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          <div className="mb-4">
            <h3 className="px-3 py-2 text-xs font-medium tracking-wider text-gray-500 uppercase">
              Yesterday
            </h3>
            <div className="space-y-1">
              {dummyChats.slice(0, 2).map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={`group cursor-pointer rounded-lg px-3 py-3 transition-all hover:bg-gray-100 ${
                    activeChat === chat.id
                      ? "border-l-4 border-purple-600 bg-purple-50"
                      : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="mt-0.5 h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-medium ${
                          activeChat === chat.id
                            ? "text-purple-800"
                            : "text-gray-900"
                        }`}
                      >
                        {chat.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {chat.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="px-3 py-2 text-xs font-medium tracking-wider text-gray-500 uppercase">
              Previous 7 Days
            </h3>
            <div className="space-y-1">
              {dummyChats.slice(2).map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={`group cursor-pointer rounded-lg px-3 py-3 transition-all hover:bg-gray-100 ${
                    activeChat === chat.id
                      ? "border-l-4 border-purple-600 bg-purple-50"
                      : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="mt-0.5 h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-medium ${
                          activeChat === chat.id
                            ? "text-purple-800"
                            : "text-gray-900"
                        }`}
                      >
                        {chat.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {chat.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-3">
        <UserButton />
      </div>
    </div>
  );
}
