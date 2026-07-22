import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrganizationMember {
  userId: mongoose.Types.ObjectId;
  role: "admin" | "editor" | "viewer";
}

export interface IOrganization extends Document {
  clerkOrgId: string;
  name: string;
  ownerId: mongoose.Types.ObjectId;
  members: IOrganizationMember[];
  plan: "free" | "pro";
  createdAt: Date;
}

const OrganizationSchema: Schema = new Schema<IOrganization>({
  clerkOrgId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      role: { type: String, enum: ["admin", "editor", "viewer"], required: true },
    },
  ],
  plan: { type: String, enum: ["free", "pro"], default: "free" },
  createdAt: { type: Date, default: Date.now },
});

export const Organization: Model<IOrganization> =
  mongoose.models.Organization || mongoose.model<IOrganization>("Organization", OrganizationSchema);
