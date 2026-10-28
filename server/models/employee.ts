import mongoose, { Schema, Types } from "mongoose";

const employeeSchema = new Schema(
  {
    organizationId: { type: Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: Types.ObjectId, ref: "User", required: true, unique: true },
    employeeCode: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    address: { type: String, trim: true, maxlength: 240, default: "" },
    department: { type: String, trim: true, maxlength: 100, default: "" },
    designation: { type: String, required: true, trim: true, maxlength: 100 },
    employmentType: { type: String, enum: ["full_time", "part_time", "contract"], default: "full_time" },
    joinDate: { type: Date, required: true },
    exitDate: { type: Date, default: null },
    basicSalary: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
  },
  { timestamps: true },
);

employeeSchema.index({ organizationId: 1, employeeCode: 1 }, { unique: true });
employeeSchema.index({ organizationId: 1, email: 1 }, { unique: true });

export const Employee = mongoose.models.Employee ?? mongoose.model("Employee", employeeSchema);
