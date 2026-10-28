import mongoose, { Schema, Types } from "mongoose";

export type LeaveType = "annual" | "sick" | "casual" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

const leaveRequestSchema = new Schema(
  {
    organizationId: { type: Types.ObjectId, ref: "Organization", required: true, index: true },
    employeeId: { type: Types.ObjectId, ref: "Employee", required: true, index: true },
    userId: { type: Types.ObjectId, ref: "User", required: true },
    leaveType: { type: String, enum: ["annual", "sick", "casual", "unpaid"], required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    days: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending", index: true },
    decisionComment: { type: String, trim: true, maxlength: 500, default: "" },
    decidedBy: { type: Types.ObjectId, ref: "User", default: null },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

leaveRequestSchema.index({ organizationId: 1, employeeId: 1, startDate: 1, endDate: 1 });

export const LeaveRequest = mongoose.models.LeaveRequest ?? mongoose.model("LeaveRequest", leaveRequestSchema);
