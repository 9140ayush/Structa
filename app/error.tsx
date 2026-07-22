"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-danger/30 bg-danger/10">
          <AlertCircle className="h-7 w-7 text-danger" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="font-mono text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
        <button
          onClick={reset}
          className="rounded-md border border-border bg-secondary px-4 py-2 font-sans text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
