import mongoose, { Schema, Document, Model } from "mongoose";
import type { GraphPayload } from "@/types/graph";

export interface IPublicRepository extends Document {
  canonicalKey: string; // "owner/repo", lowercased, unique index
  owner: string;
  repo: string;
  name: string;
  url: string;
  description?: string;
  stars: number;
  language?: string;
  healthScore: number;
  graphPayload: GraphPayload;
  moduleCount: number;
  indexedAt: Date;
  defaultBranch: string;
  githubRepoId: string;
  isPrivate: boolean;
}

const PublicRepositorySchema = new Schema<IPublicRepository>(
  {
    canonicalKey: { type: String, required: true, unique: true, index: true },
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String, default: "" },
    stars: { type: Number, default: 0 },
    language: { type: String, default: "" },
    healthScore: { type: Number, default: 100 },
    graphPayload: { type: Schema.Types.Mixed, required: true },
    moduleCount: { type: Number, default: 0 },
    indexedAt: { type: Date, default: Date.now },
    defaultBranch: { type: String, required: true, default: "main" },
    githubRepoId: { type: String, required: true },
    isPrivate: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  },
);

export const PublicRepository: Model<IPublicRepository> =
  mongoose.models.PublicRepository ||
  mongoose.model<IPublicRepository>("PublicRepository", PublicRepositorySchema);
