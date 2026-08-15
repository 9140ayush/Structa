import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISearchHistory extends Document {
  userId: string; // Clerk user ID
  canonicalKey: string; // e.g. "facebook/react"
  createdAt: Date;
}

const SearchHistorySchema = new Schema<ISearchHistory>(
  {
    userId: { type: String, required: true, index: true },
    canonicalKey: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Compound index for user activity query efficiency
SearchHistorySchema.index({ userId: 1, createdAt: -1 });

export const SearchHistory: Model<ISearchHistory> =
  mongoose.models.SearchHistory ||
  mongoose.model<ISearchHistory>("SearchHistory", SearchHistorySchema);
