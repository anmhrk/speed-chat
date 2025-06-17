import { SettingsWrapper } from "@/components/SettingsWrapper";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsWrapper>{children}</SettingsWrapper>;
}
