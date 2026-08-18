"use client";

/**
 * components/landing/Navbar.tsx — Landing page sticky navbar.
 *
 * Framer Motion scroll-linked backdrop blur + border reveal.
 * Clerk Show component for auth-aware CTA.
 * design.md: motion-base 200ms ease-out for hover transitions.
 */

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { GitBranch, Menu, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Explorer", href: "/explorer" },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "border-b border-border bg-background/90 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-transparent"
      }`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
          aria-label="Structa home"
        >
          <div
            className="w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center text-background font-mono font-bold text-base shrink-0"
            style={{ boxShadow: "0 0 24px rgba(61,220,151,0.35)" }}
          >
            S
          </div>
          <span className="font-heading font-semibold text-lg tracking-tight text-foreground">
            Structa
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-md text-sm font-sans text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Show
            when="signed-in"
            fallback={
              <>
                <Link
                  href="/sign-in"
                  className="px-3.5 py-1.5 rounded-md border border-border bg-secondary/50 hover:bg-secondary text-foreground text-sm font-sans font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Sign In
                </Link>
                <Link
                  href="/explorer"
                  className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-background text-sm font-sans font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ boxShadow: "0 0 24px rgba(61,220,151,0.25)" }}
                >
                  Explore a Repository
                </Link>
              </>
            }
          >
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-background text-sm font-sans font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Dashboard
            </Link>
            <UserButton />
          </Show>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-4 space-y-1"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-md text-sm font-sans text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-border space-y-2">
            <Show
              when="signed-in"
              fallback={
                <>
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center px-4 py-2.5 rounded-md border border-border bg-secondary/50 text-foreground text-sm font-sans font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/explorer"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center px-4 py-2.5 rounded-md bg-primary text-background text-sm font-sans font-semibold"
                  >
                    Explore a Repository
                  </Link>
                </>
              }
            >
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-md bg-primary text-background text-sm font-sans font-semibold"
                >
                  Dashboard
                </Link>
                <UserButton />
              </div>
            </Show>
          </div>
          {/* Mobile brand icon */}
          <div className="pt-3 flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Explore any public GitHub repo — no signup required</span>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
