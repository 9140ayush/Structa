"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Database, Layers, GitBranch, Cloud } from "lucide-react";

export default function Home() {
  const tasks = [
    { name: "Scaffold Next.js (App Router) + TS", status: "completed" },
    { name: "Configure Tailwind CSS & shadcn/ui", status: "completed" },
    { name: "Install Lucide React, Framer Motion & R3F/drei", status: "completed" },
    { name: "Configure ESLint & Prettier configs", status: "completed" },
    { name: "Establish Cached Mongoose Connection Singleton", status: "completed" },
    { name: "Create .env.local.example template", status: "completed" },
    { name: "Initialize Git repository (main/dev branches)", status: "completed" },
    { name: "Deploy 'Hello CodeAtlas' shell to Vercel", status: "completed" },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background text-foreground overflow-hidden font-sans">
      {/* Decorative gradient glowing spots */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[120px]" />

      {/* Decorative starry background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      <header className="absolute top-0 left-0 right-0 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-background font-mono font-bold text-lg shadow-glow-primary">
            S
          </div>
          <span className="font-heading font-semibold text-lg tracking-tight">Structa</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Vercel Live
          </span>
        </div>
      </header>

      <main className="relative flex flex-col items-center max-w-3xl px-6 pt-24 pb-12 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          {/* Logo badge */}
          <div className="px-3 py-1 rounded-full border border-border bg-card/50 backdrop-blur-md text-xs font-mono text-primary flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Milestone M0 Successfully Initialized
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Hello <span className="text-primary drop-shadow-glow">CodeAtlas</span>
          </h1>

          <p className="max-w-xl text-base sm:text-lg text-muted-foreground">
            The foundational shell for{" "}
            <span className="font-semibold text-foreground">Structa</span> is now live. All
            configurations, packages, and database layers are successfully set up and verified.
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="w-full mt-10 p-6 sm:p-8 rounded-lg border border-border bg-card/40 backdrop-blur-lg shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="flex flex-col gap-6 text-left">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="font-heading font-medium text-lg text-foreground">
                Phase 0 Checklist
              </span>
              <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                8 / 8 Done
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tasks.map((task, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  key={index}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-muted-foreground">{task.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Technology Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 w-full"
        >
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-6">
            Installed System Core
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: Layers, label: "Next.js App Router" },
              { icon: Database, label: "MongoDB & Mongoose" },
              { icon: GitBranch, label: "Git dev/main Split" },
              { icon: Cloud, label: "Vercel Build Ready" },
            ].map((tech, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-border bg-card/50 font-mono text-xs text-foreground hover:border-accent/50 transition-all duration-200"
              >
                <tech.icon className="w-4 h-4 text-accent" />
                <span>{tech.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <footer className="mt-auto py-8 text-center text-xs font-mono text-muted-foreground z-10">
        &copy; {new Date().getFullYear()} Structa. All setup specifications matched.
      </footer>
    </div>
  );
}
