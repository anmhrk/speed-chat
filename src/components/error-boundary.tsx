'use client';

import { ConvexError } from 'convex/values';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from './ui/button';

function ErrorFallback({ error }: { error: unknown }) {
  const errorMessage: string =
    error instanceof ConvexError
      ? error.data
      : error instanceof Error
        ? error.message
        : 'Unexpected error occurred';

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center space-y-6">
      <h1 className="font-bold text-2xl">Something went wrong</h1>
      <p className="text-muted-foreground">{errorMessage}</p>
      <Button
        onClick={() => {
          window.location.href = '/';
        }}
      >
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
