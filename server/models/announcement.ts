import mongoose, { Schema, Types } from "mongoose";

const announcementSchema = new Schema({
  organizationId: { type: Types.ObjectId, ref: "Organization", required: true, index: true },
  authorUserId: { type: Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  body: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: true });
announcementSchema.index({ organizationId: 1, createdAt: -1 });

export const Announcement = mongoose.models.Announcement ?? mongoose.model("Announcement", announcementSchema);
