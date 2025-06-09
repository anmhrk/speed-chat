import { useSession } from "@/backend/auth/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";

export function UserButton() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center space-x-3 rounded-lg p-2 transition-colors">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Link
        className="hover:bg-muted flex w-full items-center rounded-lg p-2 transition-colors"
        to="/login"
      >
        <LogIn className="mr-3 size-4" />
        Login
      </Link>
    );
  }

  const { user } = session;

  return (
    <Link
      className="hover:bg-muted flex w-full items-center space-x-3 rounded-lg p-2 transition-colors"
      to="/settings"
    >
      <div className="flex-shrink-0">
        <Avatar>
          <AvatarImage
            src={user.image ?? ""}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover"
          />

          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.name}</p>
      </div>
    </Link>
  );
}
