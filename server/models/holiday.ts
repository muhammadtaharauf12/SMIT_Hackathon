import mongoose, { Schema, Types } from "mongoose";

const holidaySchema = new Schema(
  {
    organizationId: { type: Types.ObjectId, ref: "Organization", required: true, index: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    name: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { timestamps: true },
);

holidaySchema.index({ organizationId: 1, date: 1 }, { unique: true });

export const Holiday = mongoose.models.Holiday ?? mongoose.model("Holiday", holidaySchema);
