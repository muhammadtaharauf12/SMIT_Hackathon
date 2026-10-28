import mongoose, { Schema, Types } from "mongoose";

const notificationSchema = new Schema(
  {
    organizationId: { type: Types.ObjectId, ref: "Organization", required: true, index: true },
    recipientUserId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["leave_decision", "correction_decision", "payslip"], required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientUserId: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification ?? mongoose.model("Notification", notificationSchema);
