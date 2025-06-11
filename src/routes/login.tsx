import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { signIn } from "@/backend/auth/auth-client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    if (context.user) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-8 left-8 z-10">
        <Button variant="ghost" onClick={() => router.navigate({ to: "/" })}>
          <ArrowLeft className="mr-1 !h-5 !w-5" />
          Back to chat
        </Button>
      </div>

      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-8 text-center">
          <p className="text-muted-foreground text-xl">
            Sign in below to sync your chat history across devices ✨
          </p>

          <Button
            onClick={() => {
              setIsLoading(true);
              signIn
                .social({
                  provider: "google",
                })
                .finally(() => {
                  setIsLoading(false);
                });
            }}
            variant="outline"
            disabled={isLoading}
            className="h-12 w-full rounded-lg text-lg font-semibold"
          >
            {isLoading ? (
              <Loader2 className="!h-6 !w-6 animate-spin" />
            ) : (
              <>
                <img
                  src="/logos/Google.svg"
                  alt="Google"
                  className="mr-1 h-6 w-6"
                />
                Continue with Google
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
