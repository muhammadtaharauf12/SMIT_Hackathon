import mongoose, { Schema, Types } from "mongoose";

const aiLogSchema = new Schema(
  {
    organizationId: { type: Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    questionLength: { type: Number, required: true, min: 0 },
    tools: { type: [String], default: [] },
    status: { type: String, enum: ["success", "provider_error", "timeout", "blocked"], required: true },
    latencyMs: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, collection: "ai_logs" },
);

export const AiLog = mongoose.models.AiLog ?? mongoose.model("AiLog", aiLogSchema);
