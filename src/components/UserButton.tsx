import { useSession } from "@/backend/auth/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

export function UserButton() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center space-x-3 rounded-lg p-3 transition-colors hover:bg-gray-100">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="bg-background text-b flex w-full items-center space-x-3 rounded-lg p-3 transition-colors hover:bg-gray-100">
        <Link to="/login">Login</Link>
      </div>
    );
  }

  const { user } = session;

  return (
    <Button className="bg-background flex w-full items-center space-x-3 rounded-lg p-3 transition-colors hover:bg-gray-100">
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
        <p className="truncate text-sm font-medium text-gray-900">
          {user.name}
        </p>
      </div>
    </Button>
  );
}
