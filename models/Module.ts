import mongoose, { Schema, Document, Model } from "mongoose";

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

/** AI summary generation state — never fabricate a summary when AI fails. */
export type SummaryStatus = "pending" | "generating" | "done" | "failed" | "skipped";

export interface IModule extends Document {
  repoId: mongoose.Types.ObjectId;
  path: string;
  type: "file" | "folder";
  /** One-paragraph AI summary (populated in Phase 4). Empty string = not yet generated. */
  summary: string;
  /**
   * AI summary generation status.
   * - pending: queued but not started
   * - generating: in-flight
   * - done: successfully generated
   * - failed: OpenAI returned an error
   * - skipped: folder, binary, or oversized file — summary not applicable
   */
  summaryStatus: SummaryStatus;
  /** Lines of code (0 for folders) */
  loc: number;
  /** Heuristic complexity score 0..10 */
  complexityScore: number;
  /** Resolved absolute paths of modules this file imports */
  imports: mongoose.Types.ObjectId[];
  /** Resolved absolute paths of modules that import this file */
  importedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const ModuleSchema: Schema = new Schema<IModule>(
  {
    repoId: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      index: true,
    },
    path: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["file", "folder"],
      required: true,
    },
    summary: {
      type: String,
      default: "",
    },
    summaryStatus: {
      type: String,
      enum: ["pending", "generating", "done", "failed", "skipped"],
      default: "pending",
    },
    loc: {
      type: Number,
      default: 0,
    },
    complexityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    imports: [
      {
        type: Schema.Types.ObjectId,
        ref: "Module",
      },
    ],
    importedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "Module",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Compound index: one module per path per repository
ModuleSchema.index({ repoId: 1, path: 1 }, { unique: true });

// ---------------------------------------------------------------------------
// Model (cached singleton pattern for Mongoose + Next.js)
// ---------------------------------------------------------------------------

export const Module: Model<IModule> =
  mongoose.models.Module || mongoose.model<IModule>("Module", ModuleSchema);
