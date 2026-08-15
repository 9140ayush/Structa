/**
 * app/(explorer)/layout.tsx — Layout for the explorer route group.
 *
 * Provides a clean page context without dashboard or organization chrome.
 */
import React from "react";

export default function ExplorerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {children}
    </div>
  );
}
