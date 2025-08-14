"use client";

import { ErrorBoundary } from "react-error-boundary";
import { ConvexError } from "convex/values";
import { Button } from "./ui/button";

function ErrorFallback({ error }: { error: any }) {
  const errorMessage: string =
    error instanceof ConvexError
      ? error.data
      : error instanceof Error
        ? error.message
        : "Unexpected error occurred";

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full space-y-6">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">{errorMessage}</p>
      <Button onClick={() => (window.location.href = "/")}>
        Go to home page
      </Button>
    </div>
  );
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>
  );
}
