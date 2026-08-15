import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISnapshot extends Document {
  repoId: mongoose.Types.ObjectId;
  commitSha: string;
  graphJson: unknown; // GraphPayload shape
  diffFromPrevious?: unknown; // Diff changes compared to the previous snapshot
  createdAt: Date;
}

const SnapshotSchema = new Schema<ISnapshot>(
  {
    repoId: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      index: true,
    },
    commitSha: {
      type: String,
      required: true,
    },
    graphJson: {
      type: Schema.Types.Mixed,
      required: true,
    },
    diffFromPrevious: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Enforce single snapshot per repository commit SHA
SnapshotSchema.index({ repoId: 1, commitSha: 1 }, { unique: true });

export const Snapshot: Model<ISnapshot> =
  mongoose.models.Snapshot || mongoose.model<ISnapshot>("Snapshot", SnapshotSchema);
