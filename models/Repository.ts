import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRepository extends Document {
  orgId: mongoose.Types.ObjectId;
  githubRepoId: string;
  name: string;
  url: string;
  isPrivate: boolean;
  lastSyncedAt?: Date;
  healthScore: number;
  /** Phase 11.5: Cached AI-generated repository explanation (technical mode) */
  repoExplanation?: string;
  repoExplanationAt?: Date;
  /** Phase 11.5: Cached AI-generated repository explanation (beginner mode) */
  repoExplanationBeginner?: string;
  repoExplanationBeginnerAt?: Date;
}

const RepositorySchema: Schema = new Schema<IRepository>({
  orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  githubRepoId: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  lastSyncedAt: { type: Date },
  healthScore: { type: Number, default: 100 },
  // Phase 11.5 — AI explanation cache
  repoExplanation: { type: String, default: "" },
  repoExplanationAt: { type: Date },
  repoExplanationBeginner: { type: String, default: "" },
  repoExplanationBeginnerAt: { type: Date },
});

export const Repository: Model<IRepository> =
  mongoose.models.Repository || mongoose.model<IRepository>("Repository", RepositorySchema);
