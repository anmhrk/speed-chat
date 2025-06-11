import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import type { User } from "better-auth";

interface UserButtonProps {
  user: User | null | undefined;
}

export function UserButton({ user }: UserButtonProps) {
  if (!user) {
    return (
      <Link
        className="hover:bg-muted flex h-12 w-full items-center rounded-lg p-2 transition-colors"
        to="/login"
      >
        <LogIn className="mr-3 size-4" />
        Login
      </Link>
    );
  }

  return (
    <Link
      className="hover:bg-muted flex h-12 w-full items-center space-x-3 rounded-lg p-2 transition-colors"
      to="/settings"
    >
      <div className="flex-shrink-0">
        <Avatar>
          {user.image && (
            <AvatarImage
              src={user.image}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{user.name}</p>
      </div>
    </Link>
  );
}
