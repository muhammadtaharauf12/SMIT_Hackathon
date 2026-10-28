import { Router } from "express";
import { AuditLog } from "../models/audit-log";
import { requireAuth, requireRole } from "../middleware/auth";

export const auditRouter = Router();
auditRouter.use(requireAuth, requireRole("admin"));

auditRouter.get("/", async (request, response, next) => {
  try { const action = typeof request.query.action === "string" ? request.query.action.trim().slice(0, 80) : ""; const query: Record<string, unknown> = { organizationId: request.auth!.organizationId }; if (action) query.action = action; const records = await AuditLog.find(query).populate("actorUserId", "name email role").sort({ createdAt: -1 }).limit(100).lean(); return response.json({ data: { logs: records.map(record => ({ id: String(record._id), action: record.action, entityType: record.entityType, entityId: record.entityId, summary: record.summary, before: record.before, after: record.after, createdAt: record.createdAt, actor: record.actorUserId })) } }); } catch (error) { return next(error); }
});
