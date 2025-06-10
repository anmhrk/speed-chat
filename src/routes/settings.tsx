import { signOut } from "@/backend/auth/auth-client";
import { Button } from "@/components/ui/button";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Button
      onClick={async () => {
        await signOut();
        redirect({ to: "/" });
      }}
    >
      Sign out
    </Button>
  );
}
