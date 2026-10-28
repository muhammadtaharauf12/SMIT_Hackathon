import mongoose, { Schema, Types } from "mongoose";

const attendanceCorrectionSchema = new Schema(
  {
    organizationId: { type: Types.ObjectId, ref: "Organization", required: true, index: true },
    attendanceId: { type: Types.ObjectId, ref: "Attendance", required: true },
    employeeId: { type: Types.ObjectId, ref: "Employee", required: true, index: true },
    requestedBy: { type: Types.ObjectId, ref: "User", required: true },
    requestedCheckIn: { type: Date, required: true },
    requestedCheckOut: { type: Date, default: null },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    decisionComment: { type: String, trim: true, maxlength: 500, default: "" },
    decidedBy: { type: Types.ObjectId, ref: "User", default: null },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

attendanceCorrectionSchema.index({ attendanceId: 1, status: 1 });

export const AttendanceCorrection = mongoose.models.AttendanceCorrection ?? mongoose.model("AttendanceCorrection", attendanceCorrectionSchema);
