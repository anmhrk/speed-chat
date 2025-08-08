import { getUser } from '@/backend/auth/get-user';
import { ChatWrapper } from '@/components/chat-wrapper';
import { PromptSuggestions } from '@/components/prompt-suggestions';

export default async function Home() {
  const user = await getUser();

  return (
    <ChatWrapper user={user}>
      <div className="flex h-full flex-col items-center justify-center space-y-10 text-center">
        <h1 className="font-medium text-3xl sm:text-4xl">
          {user
            ? `How can I help you, ${user.name.split(' ')[0]}?`
            : 'How can I help you?'}
        </h1>
        <PromptSuggestions />
      </div>
    </ChatWrapper>
  );
}
