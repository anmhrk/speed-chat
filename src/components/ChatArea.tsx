import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ModelPicker } from "./ModelPicker";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatAreaProps {
  activeChat: string | null;
}

// Dummy messages for different chats
const dummyMessagesByChat: Record<string, Message[]> = {
  "1": [
    {
      id: "1-1",
      content:
        "Hi! I need help with React components. How do I pass props between parent and child components?",
      sender: "user",
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    },
    {
      id: "1-2",
      content:
        'Great question! In React, you can pass props from a parent component to a child component by adding them as attributes when you render the child component. Here\'s a simple example:\n\n```jsx\n// Parent component\nfunction Parent() {\n  const message = "Hello from parent!";\n  return <Child greeting={message} />;\n}\n\n// Child component\nfunction Child({ greeting }) {\n  return <h1>{greeting}</h1>;\n}\n```\n\nThe child component receives props as its first parameter, and you can destructure the specific props you need.',
      sender: "ai",
      timestamp: new Date(Date.now() - 3540000), // 59 minutes ago
    },
    {
      id: "1-3",
      content:
        "Thanks for the explanation! That makes sense. What about passing functions as props?",
      sender: "user",
      timestamp: new Date(Date.now() - 3480000), // 58 minutes ago
    },
    {
      id: "1-4",
      content:
        'You can absolutely pass functions as props! This is very common for handling events or callbacks. Here\'s an example:\n\n```jsx\n// Parent component\nfunction Parent() {\n  const handleClick = (message) => {\n    alert(`Button clicked: ${message}`);\n  };\n  \n  return <Child onButtonClick={handleClick} />;\n}\n\n// Child component\nfunction Child({ onButtonClick }) {\n  return (\n    <button onClick={() => onButtonClick("Hello!")}>\n      Click me\n    </button>\n  );\n}\n```\n\nThis pattern allows child components to communicate back to their parents.',
      sender: "ai",
      timestamp: new Date(Date.now() - 3420000), // 57 minutes ago
    },
  ],
  "2": [
    {
      id: "2-1",
      content:
        "I'm having trouble debugging my JavaScript code. The console shows an error but I can't figure out what's wrong.",
      sender: "user",
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
    },
    {
      id: "2-2",
      content:
        "I'd be happy to help you debug! Could you share the error message and the relevant code? Common debugging steps include:\n\n1. Check the browser console for error messages\n2. Use console.log() to trace variable values\n3. Use the browser debugger with breakpoints\n4. Verify variable names and function calls\n\nWhat specific error are you seeing?",
      sender: "ai",
      timestamp: new Date(Date.now() - 86340000),
    },
  ],
};

export function ChatArea({ activeChat }: ChatAreaProps) {
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages for active chat
  useEffect(() => {
    if (activeChat && dummyMessagesByChat[activeChat]) {
      setMessages(dummyMessagesByChat[activeChat]);
    } else {
      setMessages([]);
    }
  }, [activeChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!activeChat) return;

    // Add user message
    const userMessage: Message = {
      id: `${activeChat}-${Date.now()}`,
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(
      () => {
        const aiMessage: Message = {
          id: `${activeChat}-${Date.now()}-ai`,
          content:
            "This is a simulated AI response. In a real implementation, this would be connected to your AI backend service.",
          sender: "ai",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
      },
      1000 + Math.random() * 2000,
    ); // Random delay between 1-3 seconds
  };

  if (!activeChat) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-white">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
            <span className="text-2xl text-white">💬</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            How can I help you, Anmol?
          </h2>
          <div className="mb-8 grid grid-cols-2 gap-3">
            <button className="flex items-center space-x-2 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-purple-300 hover:bg-purple-50">
              <span className="text-lg">✨</span>
              <span className="text-sm font-medium text-gray-700">Create</span>
            </button>
            <button className="flex items-center space-x-2 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-purple-300 hover:bg-purple-50">
              <span className="text-lg">🔍</span>
              <span className="text-sm font-medium text-gray-700">Explore</span>
            </button>
            <button className="flex items-center space-x-2 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-purple-300 hover:bg-purple-50">
              <span className="text-lg">💻</span>
              <span className="text-sm font-medium text-gray-700">Code</span>
            </button>
            <button className="flex items-center space-x-2 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-purple-300 hover:bg-purple-50">
              <span className="text-lg">🎓</span>
              <span className="text-sm font-medium text-gray-700">Learn</span>
            </button>
          </div>
          <div className="space-y-3">
            <button className="block w-full rounded-lg p-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50">
              How does AI work?
            </button>
            <button className="block w-full rounded-lg p-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50">
              Are black holes real?
            </button>
            <button className="block w-full rounded-lg p-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50">
              How many Rs are in the word "strawberry"?
            </button>
            <button className="block w-full rounded-lg p-3 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50">
              What is the meaning of life?
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-white">
      {/* Header with model picker */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-6 py-4">
        <ModelPicker
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>

      {/* Messages area - this will take remaining space and be scrollable */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-3xl px-6 py-8">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isTyping && (
              <div className="mb-6 flex justify-start">
                <div className="flex max-w-[80%] items-start space-x-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                    <span className="text-sm text-white">🤖</span>
                  </div>
                  <div className="rounded-2xl bg-gray-100 px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input area - fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-3xl px-6">
          <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
      </div>
    </div>
  );
}
