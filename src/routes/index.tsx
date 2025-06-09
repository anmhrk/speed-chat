import { signIn, signOut, useSession } from "@/backend/auth/auth-client";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { data: session } = useSession();

  return (
    <>
      {session ? (
        <>
          <p>Signed in as {session.user.name}</p>
          <Button onClick={() => signOut()}>Sign out</Button>
        </>
      ) : (
        <Button onClick={() => signIn.social({ provider: "google" })}>
          Sign in
        </Button>
      )}
    </>
  );
}
