"use client";

/**
 * components/landing/AIUnderstanding.tsx — AI Intelligence section.
 *
 * Animates: question → evidence chain lighting up → streamed answer with citation chips.
 * Framer Motion — no GSAP.
 * design.md §7: Citation chips use --accent/10 bg, --accent/25 border, --accent text, radius-full.
 * Explicitly framed as AI → Repository Graph → Evidence → Explanation (per PRD.md non-goal).
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, FileCode, Play } from "lucide-react";

// ---------------------------------------------------------------------------
// Evidence chain
// ---------------------------------------------------------------------------

const EVIDENCE_CHAIN = [
  { path: "middleware.ts", delay: 0.4 },
  { path: "auth.service.ts", delay: 0.9 },
  { path: "session.service.ts", delay: 1.4 },
  { path: "user.repository.ts", delay: 1.9 },
];

const ANSWER_TEXT =
  "Authentication in this repository flows through a layered pipeline. Incoming requests hit `middleware.ts` first, which delegates to `auth.service.ts` for Clerk session verification. Verified sessions are cached in `session.service.ts`, while user data is fetched and persisted via `user.repository.ts`. Private routes are gated at the middleware layer — no authenticated session, no route access.";

// ---------------------------------------------------------------------------
// Typewriter helper
// ---------------------------------------------------------------------------

function useTypewriter(text: string, active: boolean, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setDisplayed("");
      indexRef.current = 0;
      return;
    }
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [active, text, speed]);

  return displayed;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIUnderstanding() {
  const [playing, setPlaying] = useState(false);
  const [evidenceStep, setEvidenceStep] = useState(-1);
  const [answerActive, setAnswerActive] = useState(false);
  const displayedAnswer = useTypewriter(ANSWER_TEXT, answerActive, 14);

  const resetAndPlay = () => {
    setPlaying(false);
    setEvidenceStep(-1);
    setAnswerActive(false);
    setTimeout(() => {
      setPlaying(true);
      // Stagger evidence chain lights
      EVIDENCE_CHAIN.forEach((item, i) => {
        setTimeout(() => setEvidenceStep(i), item.delay * 1000);
      });
      // Start typewriter after all evidence revealed
      setTimeout(() => setAnswerActive(true), 2400);
    }, 80);
  };

  return (
    <section className="relative py-24 px-4 sm:px-6" aria-labelledby="ai-section-heading">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(61,220,151,0.04),transparent)]" />

      <div className="relative max-w-6xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            AI intelligence
          </p>
          <h2
            id="ai-section-heading"
            className="font-heading font-bold text-foreground tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            {"Don't Just See the Code. "}
            <span className="text-primary" style={{ textShadow: "0 0 30px rgba(61,220,151,0.3)" }}>
              Understand It.
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Ask anything about a repository. Answers are grounded in the parsed module graph — never
            a generic chatbot, always evidence-backed.
          </p>
        </motion.div>

        {/* Demo panel */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-[16px] border border-border bg-surface overflow-hidden shadow-[0_0_60px_rgba(61,220,151,0.06)]">
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-elevated">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-accent/10 border border-accent/25 text-accent">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-sm text-foreground">
                    Ask the Codebase
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    vercel/next.js — grounded in repo data
                  </p>
                </div>
              </div>
              <button
                id="ai-demo-play"
                onClick={resetAndPlay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/15 border border-primary/25 text-primary font-mono text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Play AI demonstration"
              >
                <Play className="w-3 h-3" />
                {playing ? "Replay" : "Play Demo"}
              </button>
            </div>

            {/* Chat body */}
            <div className="p-5 space-y-5 min-h-[320px]">
              {/* User question */}
              <div className="flex gap-3 justify-end">
                <div className="px-4 py-3 rounded-xl rounded-tr-sm bg-primary/10 border border-primary/20 text-sm font-mono text-foreground max-w-[80%]">
                  How does authentication work in this repository?
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="text-xs text-primary font-mono font-bold">U</span>
                </div>
              </div>

              {/* Evidence chain */}
              <AnimatePresence>
                {playing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 flex-wrap"
                  >
                    <span className="text-xs font-mono text-muted-foreground">Evidence chain:</span>
                    {EVIDENCE_CHAIN.map((item, i) => (
                      <motion.span
                        key={item.path}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={
                          evidenceStep >= i
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0.2, scale: 0.85 }
                        }
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-xs border transition-all ${
                          evidenceStep >= i
                            ? "bg-accent/15 border-accent/35 text-accent shadow-[0_0_10px_rgba(124,156,255,0.2)]"
                            : "bg-border/20 border-border/40 text-muted-foreground/30"
                        }`}
                      >
                        <FileCode className="w-3 h-3 shrink-0" aria-hidden="true" />
                        {item.path}
                      </motion.span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Answer with typewriter */}
              <AnimatePresence>
                {answerActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="px-4 py-3 rounded-xl rounded-tl-sm bg-surface-elevated border border-border text-sm font-mono text-foreground leading-relaxed">
                        {displayedAnswer}
                        {displayedAnswer.length < ANSWER_TEXT.length && (
                          <span className="inline-block w-0.5 h-3.5 bg-accent ml-0.5 animate-pulse" />
                        )}
                      </div>

                      {/* Citation chips — exact MessageBubble styling */}
                      {displayedAnswer.length > 80 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-wrap gap-1.5"
                        >
                          {EVIDENCE_CHAIN.map((item) => (
                            <button
                              key={item.path}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border bg-accent/10 border-accent/25 text-accent hover:bg-accent/20 hover:border-accent/50 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                              aria-label={`Jump to ${item.path} in the 3D graph`}
                            >
                              <FileCode className="w-3 h-3 shrink-0" aria-hidden="true" />
                              {item.path}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty state nudge */}
              {!playing && (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3 text-muted-foreground">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-sm font-mono">
                    Press <span className="text-accent font-semibold">Play Demo</span> to see AI →
                    Evidence → Explanation
                  </p>
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="px-5 py-3 border-t border-border bg-surface-elevated">
              <p className="text-[10px] font-mono text-muted-foreground text-center">
                Answers are always grounded in parsed module summaries — not a generic chatbot
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
