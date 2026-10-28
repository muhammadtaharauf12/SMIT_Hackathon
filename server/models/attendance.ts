import mongoose, { Schema, Types } from "mongoose";

export type AttendanceStatus = "present" | "late" | "half_day" | "missing_checkout";

const attendanceSchema = new Schema(
  {
    organizationId: { type: Types.ObjectId, ref: "Organization", required: true, index: true },
    employeeId: { type: Types.ObjectId, ref: "Employee", required: true, index: true },
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    attendanceDate: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, default: null },
    durationMinutes: { type: Number, default: null },
    status: { type: String, enum: ["present", "late", "half_day", "missing_checkout"], required: true },
    officeStart: { type: String, required: true },
    graceMinutes: { type: Number, required: true },
  },
  { timestamps: true },
);

attendanceSchema.index({ organizationId: 1, employeeId: 1, attendanceDate: 1 }, { unique: true });

export const Attendance = mongoose.models.Attendance ?? mongoose.model("Attendance", attendanceSchema);
