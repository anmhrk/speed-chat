import SettingsGeneralPage from "@/components/SettingsGeneralPage";
import { getUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";

export default async function GeneralPage() {
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  return <SettingsGeneralPage user={user} />;
}
