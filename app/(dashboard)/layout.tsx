import React from "react";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Background radial glow */}
      <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-200px] left-[10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute top-[-100px] right-[10%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/65 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-background font-mono font-bold text-lg shadow-glow-primary transition-all duration-300 group-hover:scale-105">
                S
              </div>
              <span className="font-heading font-semibold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/80 group-hover:to-primary transition-colors">
                Structa
              </span>
              <span className="font-mono text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                v0.1.0
              </span>
            </Link>

            <div className="h-6 w-px bg-border hidden sm:block" />

            {/* Org Switcher */}
            <div className="hidden sm:block">
              <OrganizationSwitcher
                appearance={{
                  elements: {
                    rootBox: "flex items-center text-sm font-medium",
                    organizationSwitcherTrigger:
                      "text-foreground hover:bg-secondary/80 hover:text-foreground font-sans px-3 py-1.5 rounded-md border border-border bg-card/50 transition-colors",
                    organizationSwitcherTriggerIcon: "text-muted-foreground",
                  },
                }}
              />
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border">
              <Link
                href="/dashboard"
                className="px-3 py-1 px-[10px] rounded-md text-xs font-mono font-medium transition-all bg-primary text-background shadow-sm"
              >
                Workspace
              </Link>
              <Link
                href="/explorer"
                className="px-3 py-1 px-[10px] rounded-md text-xs font-mono font-medium transition-all text-muted-foreground hover:text-foreground"
              >
                Explorer
              </Link>
            </div>

            {/* Admin / Settings Navigation Entry */}
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card/50 hover:bg-secondary text-xs font-mono font-medium text-muted-foreground hover:text-foreground transition-colors"
              title="Organization Settings & Administration"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Admin</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile Admin Link */}
            <Link
              href="/admin"
              className="sm:hidden p-1.5 rounded-md border border-border bg-card/50 text-muted-foreground hover:text-foreground"
              title="Admin Settings"
            >
              <ShieldCheck className="w-4 h-4 text-accent" />
            </Link>

            {/* Mobile Org Switcher */}
            <div className="sm:hidden">
              <OrganizationSwitcher
                appearance={{
                  elements: {
                    rootBox: "flex items-center text-xs",
                    organizationSwitcherTrigger:
                      "text-foreground hover:bg-secondary px-2.5 py-1.5 rounded-md border border-border bg-card/50",
                  },
                }}
              />
            </div>

            {/* User Button */}
            <div className="flex items-center gap-2.5 border-l border-border pl-4">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 rounded-full border border-border shadow-sm",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative flex-1 z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-6 text-center text-xs font-mono text-muted-foreground z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} Structa. All rights reserved.</span>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Secure Workspace
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
