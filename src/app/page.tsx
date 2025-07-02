import { ChatPage } from "@/components/chat-page";
import { getUser } from "@/lib/auth/get-user";

export default async function Home() {
  const user = await getUser();
  const name = user?.name.split(" ")[0];

  const greetings = [
    `How can I help you, ${name}?`,
    `What can I do for you, ${name}?`,
    `What's on your mind, ${name}?`,
    `How can I assist you, ${name}?`,
    `Where should we begin, ${name}?`,
    `Good to see you, ${name}!`,
    `Nice to see you, ${name}!`,
    `Welcome back, ${name}!`,
    `Ready when you are, ${name}!`,
  ];

  const randomGreeting =
    greetings[Math.floor(Math.random() * greetings.length)];

  return <ChatPage user={user} initialChatId="" greeting={randomGreeting} />;
}
