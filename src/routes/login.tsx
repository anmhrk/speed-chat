import { createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { signIn } from "@/backend/auth/auth-client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-8 left-8 z-10">
        <Button variant="ghost" asChild>
          <Link to="/">
            <ArrowLeft className="mr-1 !h-5 !w-5" />
            Back to chat
          </Link>
        </Button>
      </div>

      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
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
            size="lg"
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
