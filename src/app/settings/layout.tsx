import { SettingsWrapper } from "@/components/settings-wrapper";
import { getUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  const ua = (await headers()).get("user-agent") ?? "";
  const isAppleDevice = /Mac|iPhone|iPad|iPod/.test(ua);

  return (
    <SettingsWrapper user={user} isAppleDevice={isAppleDevice}>
      {children}
    </SettingsWrapper>
  );
}
