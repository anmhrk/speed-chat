import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { signIn } from "@/backend/auth/auth-client";
import { getSessionServer } from "@/backend/auth/get-session-server";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const session = await getSessionServer();

    if (session) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 left-4 z-10">
        <Link to="/">
          <Button variant="ghost">← Back to chat</Button>
        </Link>
      </div>

      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Hello! 👋</h1>
            <p className="text-muted-foreground text-xl">
              Sign in below to increase your message limits
            </p>
          </div>

          <Button
            onClick={() =>
              signIn.social({
                provider: "google",
              })
            }
            className="h-12 w-full text-lg font-semibold"
          >
            <img
              src="/logos/google.svg"
              alt="Google"
              className="mr-1 h-5 w-5"
            />
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
