import { SettingsWrapper } from "@/components/settings-wrapper";
import { getUser } from "@/lib/actions";
import { redirect } from "next/navigation";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  return <SettingsWrapper user={user}>{children}</SettingsWrapper>;
}
