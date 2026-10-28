import mongoose, { Schema, Types } from "mongoose";

const payrollRunSchema = new Schema(
  {
    organizationId: { type: Types.ObjectId, ref: "Organization", required: true, index: true },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    status: { type: String, enum: ["draft", "finalized"], default: "draft" },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    expectedSlips: { type: Number, required: true, min: 0, default: 0 },
    finalizedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
payrollRunSchema.index({ organizationId: 1, month: 1 }, { unique: true });

const payslipSchema = new Schema(
  {
    organizationId: { type: Types.ObjectId, ref: "Organization", required: true, index: true },
    payrollRunId: { type: Types.ObjectId, ref: "PayrollRun", required: true, index: true },
    employeeId: { type: Types.ObjectId, ref: "Employee", required: true, index: true },
    month: { type: String, required: true },
    basicSalary: { type: Number, required: true, min: 0 },
    hra: { type: Number, required: true, min: 0 },
    medical: { type: Number, required: true, min: 0 },
    grossPay: { type: Number, required: true, min: 0 },
    deductions: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    workingDays: { type: Number, required: true, min: 0, default: 0 },
    absentDays: { type: Number, required: true, min: 0, default: 0 },
    unpaidLeaveDays: { type: Number, required: true, min: 0, default: 0 },
    halfDayUnits: { type: Number, required: true, min: 0, default: 0 },
    attendanceDeduction: { type: Number, required: true, min: 0, default: 0 },
    prorationFactor: { type: Number, required: true, min: 0, max: 1, default: 1 },
    netPay: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);
payslipSchema.index({ payrollRunId: 1, employeeId: 1 }, { unique: true });

export const PayrollRun = mongoose.models.PayrollRun ?? mongoose.model("PayrollRun", payrollRunSchema);
export const Payslip = mongoose.models.Payslip ?? mongoose.model("Payslip", payslipSchema);
