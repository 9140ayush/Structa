import mongoose, { Schema, Document, Model } from "mongoose";

export interface IModuleVisit extends Document {
  repoId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  userId: string;
  visitCount: number;
  updatedAt: Date;
}

const ModuleVisitSchema = new Schema<IModuleVisit>(
  {
    repoId: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      index: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    visitCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
  },
);

// Aggregate visits atomically per repo, module, and user to avoid unbounded list growth
ModuleVisitSchema.index({ repoId: 1, moduleId: 1, userId: 1 }, { unique: true });

export const ModuleVisit: Model<IModuleVisit> =
  mongoose.models.ModuleVisit || mongoose.model<IModuleVisit>("ModuleVisit", ModuleVisitSchema);
