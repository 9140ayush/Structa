"use client";

/**
 * components/landing/Navbar.tsx — Landing page sticky navbar.
 *
 * Framer Motion scroll-linked backdrop blur + border reveal.
 * Clerk Show component for auth-aware CTA.
 * Integrated ThemeToggle for instant Dark/Light switching.
 */

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { StructaLogoBadge } from "@/components/shared/StructaLogo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Overview", href: "#overview" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "/pricing" },
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
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md group"
          aria-label="Structa home"
        >
          <StructaLogoBadge size="md" className="group-hover:scale-105" />
          <span className="font-heading font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
            Structa
          </span>
          <span className="font-mono text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
            v1.3
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-md text-sm font-sans text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth CTA + ThemeToggle */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <div className="h-5 w-px bg-border mx-1" />
          <Show
            when="signed-in"
            fallback={
              <>
                <Link
                  href="/sign-in"
                  className="px-3.5 py-1.5 rounded-md border border-border bg-card hover:bg-secondary text-foreground text-sm font-sans font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Sign In
                </Link>
                <Link
                  href="/explorer"
                  className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-sans font-semibold transition-colors duration-200 shadow-glow-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Explore a Repository
                </Link>
              </>
            }
          >
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-sans font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Dashboard
            </Link>
            <UserButton />
          </Show>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
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
          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <Show
              when="signed-in"
              fallback={
                <>
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center px-4 py-2 rounded-md border border-border bg-card text-foreground text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/explorer"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    Explore a Repository
                  </Link>
                </>
              }
            >
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold"
              >
                Dashboard
              </Link>
            </Show>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
