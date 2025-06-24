import { ChatPage } from "@/components/chat-page";
import { getUser } from "@/lib/auth/get-user";

const greetingMessages = [
  "How can I help you?",
  "What can I do for you?",
  "What's on your mind today?",
  "How can I assist you today?",
  "Where should we begin?",
];

export default async function Home() {
  const greeting =
    greetingMessages[Math.floor(Math.random() * greetingMessages.length)];

  const user = await getUser();

  return <ChatPage greeting={greeting} user={user} />;
}
