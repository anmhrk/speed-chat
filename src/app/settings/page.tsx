import SettingsGeneralPage from "@/components/SettingsGeneralPage";
import { preloadQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "../../../convex/_generated/api";

export default async function GeneralPage() {
  const preloadedUser = await preloadQuery(
    api.auth.getCurrentUser,
    {},
    { token: await convexAuthNextjsToken() },
  );

  return <SettingsGeneralPage preloadedUser={preloadedUser} />;
}
