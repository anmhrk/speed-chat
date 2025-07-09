import type { User } from "better-auth";

interface WelcomeSectionProps {
  user: User | null;
  greeting?: string;
  temporaryChat: boolean;
  className?: string;
}

export function WelcomeSection({
  user,
  greeting,
  temporaryChat,
  className = "",
}: WelcomeSectionProps) {
  if (temporaryChat) {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <h1 className="mb-2 text-3xl font-medium sm:text-4xl">
          Temporary chat
        </h1>
        <p className="text-muted-foreground text-md max-w-sm text-center mb-8">
          This chat won&apos;t appear in your chat history and will be cleared
          when you close the tab.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <h1 className="mb-4 text-3xl font-medium sm:text-4xl">
        {user ? greeting : "How can I help you?"}
      </h1>
    </div>
  );
}
