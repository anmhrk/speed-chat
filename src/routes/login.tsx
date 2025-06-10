import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { signIn } from "@/backend/auth/auth-client";
import { getUser } from "@/backend/auth/get-user";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const user = await getUser();

    if (user) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 left-4 z-10">
        <Link to="/">
          <Button variant="ghost">
            <ChevronLeft className="!h-5 !w-5" />
            Back to chat
          </Button>
        </Link>
      </div>

      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Hello! 👋</h1>
            <p className="text-muted-foreground text-lg">
              Sign in below to sync your chat history across devices ✨
            </p>
          </div>

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
            disabled={isLoading}
            className="h-12 w-full rounded-lg text-lg font-semibold"
          >
            {isLoading ? (
              <Loader2 className="!h-6 !w-6 animate-spin" />
            ) : (
              <>
                <img
                  src="/logos/google.svg"
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
