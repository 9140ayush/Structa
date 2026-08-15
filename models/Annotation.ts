import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnnotation extends Document {
  repositoryId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  authorId: string; // Clerk user ID
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnnotationSchema = new Schema<IAnnotation>(
  {
    repositoryId: {
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
    authorId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  },
);

// Optimization index for loading annotations on graph load
AnnotationSchema.index({ repositoryId: 1, moduleId: 1 });

export const Annotation: Model<IAnnotation> =
  mongoose.models.Annotation || mongoose.model<IAnnotation>("Annotation", AnnotationSchema);
