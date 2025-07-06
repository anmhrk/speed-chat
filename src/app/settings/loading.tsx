import { Loader2 } from "lucide-react";

export default function SettingsLoading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
    </div>
  );
}
