"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-8 left-8 z-10">
        <Button variant="ghost" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-1 !h-5 !w-5" />
          Back to chat
        </Button>
      </div>

      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Button
            onClick={() => {
              setIsLoading(true);
              signIn("google", {
                redirectTo: "/",
              }).finally(() => {
                setIsLoading(false);
              });
            }}
            variant="outline"
            size="lg"
            disabled={isLoading}
            className="h-12 w-full space-x-2 rounded-lg text-lg font-semibold"
          >
            {isLoading ? (
              <Loader2 className="!h-6 !w-6 animate-spin" />
            ) : (
              <>
                <Image
                  src="/Google.svg"
                  width={24}
                  height={24}
                  alt="Google Logo"
                  unoptimized
                />
                <span>Continue with Google</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
