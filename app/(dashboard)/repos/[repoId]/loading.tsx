import React from "react";

export default function RepoLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse py-6 px-4 md:px-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded-md" />
          <div className="h-4 w-72 bg-muted/60 rounded-md" />
        </div>
        <div className="h-9 w-28 bg-muted rounded-lg" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="w-6 h-6 rounded-lg bg-muted/60" />
            </div>
            <div className="h-7 w-16 bg-muted rounded" />
            <div className="h-3 w-32 bg-muted/40 rounded" />
          </div>
        ))}
      </div>

      {/* Main content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-48 bg-muted/30 rounded-lg" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted/50 rounded" />
            <div className="h-4 w-4/5 bg-muted/40 rounded" />
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
              >
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-4 w-12 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
