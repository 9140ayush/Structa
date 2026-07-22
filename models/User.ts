import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  email: string;
  name: string;
  avatarUrl: string;
  plan: "free" | "pro";
  createdAt: Date;
}

const UserSchema: Schema = new Schema<IUser>({
  clerkId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  name: { type: String },
  avatarUrl: { type: String },
  plan: { type: String, enum: ["free", "pro"], default: "free" },
  createdAt: { type: Date, default: Date.now },
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
