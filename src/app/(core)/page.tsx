import { ChatPage } from "@/components/ChatPage";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";

export default async function Home() {
  const preloadedUser = await preloadQuery(
    api.auth.getCurrentUser,
    {},
    { token: await convexAuthNextjsToken() },
  );

  return <ChatPage preloadedUser={preloadedUser} />;
}
