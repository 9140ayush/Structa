import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRepository extends Document {
  orgId: mongoose.Types.ObjectId;
  githubRepoId: string;
  name: string;
  url: string;
  isPrivate: boolean;
  lastSyncedAt?: Date;
  healthScore: number;
}

const RepositorySchema: Schema = new Schema<IRepository>({
  orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  githubRepoId: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  lastSyncedAt: { type: Date },
  healthScore: { type: Number, default: 100 },
});

export const Repository: Model<IRepository> =
  mongoose.models.Repository || mongoose.model<IRepository>("Repository", RepositorySchema);
