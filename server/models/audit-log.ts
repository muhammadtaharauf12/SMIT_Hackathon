import mongoose, { Schema, Types } from "mongoose";

const auditLogSchema = new Schema(
  {
    organizationId: { type: Types.ObjectId, ref: "Organization", required: true, index: true },
    actorUserId: { type: Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, trim: true, maxlength: 80 },
    entityType: { type: String, required: true, trim: true, maxlength: 80 },
    entityId: { type: String, required: true, maxlength: 80 },
    summary: { type: String, required: true, trim: true, maxlength: 500 },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

auditLogSchema.index({ organizationId: 1, createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog ?? mongoose.model("AuditLog", auditLogSchema);
