import mongoose, { Schema } from "mongoose";

const organizationSchema = new Schema(
  {
    singletonKey: { type: String, unique: true, default: "primary" },
    companyName: { type: String, required: true, trim: true, maxlength: 120 },
    officeStart: { type: String, required: true, default: "09:00" },
    graceMinutes: { type: Number, required: true, default: 15, min: 0, max: 180 },
    weekendDays: { type: [Number], required: true, default: [0, 6] },
    departments: { type: [String], default: [] },
    designations: { type: [String], default: [] },
    leaveQuotas: {
      annual: { type: Number, min: 0, max: 365, default: 14 },
      sick: { type: Number, min: 0, max: 365, default: 8 },
      casual: { type: Number, min: 0, max: 365, default: 10 },
    },
    officeLocation: {
      address: { type: String, trim: true, maxlength: 200, default: "" },
      latitude: { type: Number, min: -90, max: 90, default: null },
      longitude: { type: Number, min: -180, max: 180, default: null },
      radiusMeters: { type: Number, min: 25, max: 5000, default: 150 },
    },
  },
  { timestamps: true },
);

export const Organization = mongoose.models.Organization ?? mongoose.model("Organization", organizationSchema);
