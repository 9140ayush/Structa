/**
 * models/ChatSession.ts — ChatSessions Mongoose model.
 *
 * Architecture.md §4:
 * ChatSessions: _id, repoId: ref Repositories, userId: ref Users,
 * messages: [{ role, content, createdAt }]
 *
 * Server-side only. Never import from a Client Component.
 */
import mongoose, { Schema, Document, Model } from "mongoose";

// ---------------------------------------------------------------------------
// Sub-types
// ---------------------------------------------------------------------------

export type MessageRole = "user" | "assistant" | "system";

export interface IChatMessage {
  _id?: mongoose.Types.ObjectId;
  role: MessageRole;
  content: string;
  /** Cited module IDs (paths) for AI answers — empty for user messages */
  citedModuleIds: string[];
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IChatSession extends Document {
  repoId: mongoose.Types.ObjectId;
  userId: string; // Clerk userId
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    citedModuleIds: {
      type: [String],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const ChatSessionSchema = new Schema<IChatSession>(
  {
    repoId: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Compound index: look up sessions by user + repo quickly
ChatSessionSchema.index({ repoId: 1, userId: 1 });

// ---------------------------------------------------------------------------
// Model (cached singleton pattern for Mongoose + Next.js)
// ---------------------------------------------------------------------------

export const ChatSession: Model<IChatSession> =
  mongoose.models.ChatSession || mongoose.model<IChatSession>("ChatSession", ChatSessionSchema);
