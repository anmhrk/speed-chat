import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-10 text-center">
      <Loader2 className="animate-spin size-6" />
    </div>
  );
}
