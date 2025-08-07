import { getUser } from '@/backend/auth/get-user';
import { ChatWrapper } from '@/components/chat-wrapper';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const PROMPT_SUGGESTIONS = [
  'Explain how AI learns in a way a 5 year old can understand',
  'How do I survive a long flight without losing my mind?',
  'What are the best sources of protein?',
  'Help me plan my summer vacation in Europe',
];

export default async function Home() {
  const user = await getUser();

  return (
    <ChatWrapper>
      <div className="flex h-full flex-col items-center justify-center space-y-10 text-center">
        <h1 className="font-medium text-3xl sm:text-4xl">
          {user
            ? `How can I help you ${user.name.split(' ')[0]}?`
            : 'How can I help you?'}
        </h1>
        <div className="w-full max-w-3xl">
          {PROMPT_SUGGESTIONS.map((suggestion, index) => (
            <div key={suggestion}>
              <Button
                className="h-auto w-full justify-start p-3 font-normal text-muted-foreground text-sm hover:text-foreground"
                variant="ghost"
              >
                {suggestion}
              </Button>
              {index < PROMPT_SUGGESTIONS.length - 1 && (
                <div className="px-3">
                  <Separator />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ChatWrapper>
  );
}
