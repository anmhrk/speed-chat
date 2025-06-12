import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SettingsWrapper } from "@/components/SettingsWrapper";

export const Route = createFileRoute("/settings")({
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: SettingsLayout,
});

function SettingsLayout() {
  return (
    <SettingsWrapper>
      <Outlet />
    </SettingsWrapper>
  );
}
