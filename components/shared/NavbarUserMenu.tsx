/**
 * components/shared/NavbarUserMenu.tsx
 *
 * Displays the Clerk UserButton avatar alongside the authenticated user's full name.
 */
"use client";

import React from "react";
import { UserButton, useUser } from "@clerk/nextjs";

export function NavbarUserMenu() {
  const { user, isLoaded } = useUser();
  const userName = user?.fullName || user?.firstName || user?.username || "";

  return (
    <div className="flex items-center gap-2.5">
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8 rounded-full border border-border shadow-sm",
          },
        }}
      />
      {isLoaded && userName && (
        <span className="hidden sm:inline-block text-xs font-mono font-medium text-foreground truncate max-w-[160px]">
          {userName}
        </span>
      )}
    </div>
  );
}
