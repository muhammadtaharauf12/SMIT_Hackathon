import { Router } from "express";
import { Notification } from "../models/notification";
import { requireAuth } from "../middleware/auth";
import { NotFoundError } from "../utils/validation";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

const payload = (notification: Record<string, unknown>) => ({ id: String(notification._id), type: notification.type, title: notification.title, message: notification.message, readAt: notification.readAt, createdAt: notification.createdAt });

notificationsRouter.get("/", async (request, response, next) => {
  try { const records = await Notification.find({ organizationId: request.auth!.organizationId, recipientUserId: request.auth!.userId }).sort({ createdAt: -1 }).limit(50).lean(); const unreadCount = records.filter(record => !record.readAt).length; return response.json({ data: { notifications: records.map(payload), unreadCount } }); } catch (error) { return next(error); }
});

notificationsRouter.patch("/:id/read", async (request, response, next) => {
  try { const record = await Notification.findOneAndUpdate({ _id: request.params.id, organizationId: request.auth!.organizationId, recipientUserId: request.auth!.userId }, { $set: { readAt: new Date() } }, { new: true }).lean(); if (!record) throw new NotFoundError("Notification not found"); return response.json({ data: { notification: payload(record) } }); } catch (error) { return next(error); }
});

notificationsRouter.post("/read-all", async (request, response, next) => {
  try { await Notification.updateMany({ organizationId: request.auth!.organizationId, recipientUserId: request.auth!.userId, readAt: null }, { $set: { readAt: new Date() } }); return response.json({ data: { updated: true } }); } catch (error) { return next(error); }
});
