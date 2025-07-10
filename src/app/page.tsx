import { ChatPage } from "@/components/chat-page";
import { getUser } from "@/lib/auth/get-user";
import { getRandomGreeting, getRandomPromptSuggestions } from "@/lib/random";

export default async function Home() {
  const user = await getUser();
  const name = user?.name.split(" ")[0];

  const randomGreeting = getRandomGreeting(name ?? "");
  const randomPromptSuggestions = getRandomPromptSuggestions("text");

  return (
    <ChatPage
      user={user}
      greeting={randomGreeting}
      promptSuggestions={randomPromptSuggestions}
    />
  );
}
