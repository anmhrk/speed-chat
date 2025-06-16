import { SettingsWrapper } from "@/components/SettingsWrapper";
import { getUser } from "@/lib/auth/get-user";
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

  return <SettingsWrapper>{children}</SettingsWrapper>;
}
