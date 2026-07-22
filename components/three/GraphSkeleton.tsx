"use client";

import React from "react";
import { Loader2, Radio } from "lucide-react";

export function GraphSkeleton() {
  return (
    <div className="relative w-full h-full min-h-[500px] bg-background border border-border rounded-lg overflow-hidden flex flex-col items-center justify-center">
      {/* Radar background grid animation */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#242833_1px,transparent_1px),linear-gradient(to_bottom,#242833_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      {/* Pulsing center radar glow */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center px-4">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full border border-primary/40 bg-primary/10 shadow-glow-primary animate-pulse">
          <Radio
            className="w-8 h-8 text-primary animate-spin"
            style={{ animationDuration: "6s" }}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <h3 className="font-heading font-semibold text-foreground text-sm">
              Initializing 3D Engine & Graph Layout...
            </h3>
          </div>
          <p className="font-mono text-xs text-muted-foreground max-w-xs">
            Calculating spatial force vectors, LOC geometry boundaries, and dependency edges.
          </p>
        </div>
      </div>
    </div>
  );
}
