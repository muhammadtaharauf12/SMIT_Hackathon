import { Router } from "express";
import { Announcement } from "../models/announcement";
import { AuditLog } from "../models/audit-log";
import { requireAuth, requireRole } from "../middleware/auth";
import { asRecord, requiredString } from "../utils/validation";

export const announcementsRouter = Router();
announcementsRouter.use(requireAuth);

const payload = (record: Record<string, unknown>) => ({ id: String(record._id), title: record.title, body: record.body, createdAt: record.createdAt });

announcementsRouter.get("/", async (request, response, next) => {
  try {
    const records = await Announcement.find({ organizationId: request.auth!.organizationId }).sort({ createdAt: -1 }).limit(20).lean();
    return response.json({ data: { announcements: records.map(payload) } });
  } catch (error) { return next(error); }
});

announcementsRouter.post("/", requireRole("admin", "hr"), async (request, response, next) => {
  try {
    const body = asRecord(request.body);
    const title = requiredString(body, "title", 120);
    const content = requiredString(body, "body", 1000);
    const record = await Announcement.create({ organizationId: request.auth!.organizationId, authorUserId: request.auth!.userId, title, body: content });
    await AuditLog.create({ organizationId: request.auth!.organizationId, actorUserId: request.auth!.userId, action: "announcement.created", entityType: "Announcement", entityId: String(record._id), summary: `Announcement posted: ${title}` });
    return response.status(201).json({ data: { announcement: payload(record.toObject()) } });
  } catch (error) { return next(error); }
});
