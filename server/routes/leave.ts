import { Router } from "express";
import { Employee } from "../models/employee";
import { LeaveRequest, LeaveType } from "../models/leave-request";
import { User } from "../models/user";
import { Holiday } from "../models/holiday";
import { Organization } from "../models/organization";
import { Notification } from "../models/notification";
import { AuditLog } from "../models/audit-log";
import { overlaps, workingDays } from "../utils/leave-rules";
import { companyDate, validIsoDate } from "../utils/company-date";
import { requireAuth, requireRole } from "../middleware/auth";
import { ConflictError, NotFoundError, asRecord, requiredString, ValidationError } from "../utils/validation";

export const leaveRouter = Router();
leaveRouter.use(requireAuth);

const limitsFor = (organization: { leaveQuotas?: { annual?: number; sick?: number; casual?: number } } | null): Record<LeaveType, number | null> => ({ annual: organization?.leaveQuotas?.annual ?? 14, sick: organization?.leaveQuotas?.sick ?? 8, casual: organization?.leaveQuotas?.casual ?? 10, unpaid: null });
const leaveTypes: LeaveType[] = ["annual", "sick", "casual", "unpaid"];
const payload = (request: Record<string, unknown>) => ({ id: String(request._id), leaveType: request.leaveType, startDate: request.startDate, endDate: request.endDate, days: request.days, reason: request.reason, status: request.status, decisionComment: request.decisionComment, createdAt: request.createdAt });

const employeeContext = async (userId: string) => {
  const user = await User.findById(userId).select("employeeId organizationId").lean();
  if (!user?.employeeId) throw new ValidationError("Your account is not linked to an employee profile");
  const employee = await Employee.findOne({ _id: user.employeeId, organizationId: user.organizationId, status: "active" }).lean();
  if (!employee) throw new NotFoundError("Employee profile not found");
  return { user, employee };
};

const approvedDays = async (organizationId: string, employeeId: unknown, leaveType: LeaveType, year: string, excludeId?: string, includePending = false) => {
  const query: Record<string, unknown> = { organizationId, employeeId, leaveType, startDate: { $gte: `${year}-01-01`, $lte: `${year}-12-31` }, status: includePending ? { $in: ["approved", "pending"] } : "approved" }; if (excludeId) query._id = { $ne: excludeId };
  const records = await LeaveRequest.find(query).select("days").lean(); return records.reduce((total, record) => total + record.days, 0);
};

leaveRouter.get("/summary", requireRole("employee", "hr"), async (request, response, next) => {
  try {
    const { user, employee } = await employeeContext(request.auth!.userId); const requests = await LeaveRequest.find({ organizationId: user.organizationId, employeeId: employee._id }).sort({ createdAt: -1 }).limit(50).lean(); const organization = await Organization.findById(user.organizationId).select("leaveQuotas").lean(); const limits = limitsFor(organization);
    const balances = await Promise.all(leaveTypes.map(async leaveType => { const limit = limits[leaveType]; const used = await approvedDays(String(user.organizationId), employee._id, leaveType, companyDate().slice(0, 4)); return { leaveType, limit, used, remaining: limit === null ? null : Math.max(0, limit - used) }; }));
    return response.json({ data: { balances, requests: requests.map(payload) } });
  } catch (error) { return next(error); }
});

leaveRouter.post("/", requireRole("employee", "hr"), async (request, response, next) => {
  try {
    const { user, employee } = await employeeContext(request.auth!.userId); const body = asRecord(request.body); const leaveType = requiredString(body, "leaveType", 20) as LeaveType; const startDate = requiredString(body, "startDate", 10); const endDate = requiredString(body, "endDate", 10); const reason = requiredString(body, "reason", 500);
    if (!leaveTypes.includes(leaveType) || !validIsoDate(startDate) || !validIsoDate(endDate) || startDate > endDate) throw new ValidationError("Choose a valid leave type and date range");
    if (startDate.slice(0, 4) !== endDate.slice(0, 4)) throw new ValidationError("Submit separate leave requests for each calendar year");
    const [holidayRecords, organization] = await Promise.all([Holiday.find({ organizationId: user.organizationId, date: { $gte: startDate, $lte: endDate } }).select("date").lean(), Organization.findById(user.organizationId).select("weekendDays leaveQuotas").lean()]); const holidays = new Set(holidayRecords.map(holiday => holiday.date)); const days = workingDays(startDate, endDate, holidays, organization?.weekendDays ?? [0, 6]); if (!days) throw new ValidationError("Leave must include at least one working day");
    const existing = await LeaveRequest.find({ organizationId: user.organizationId, employeeId: employee._id, status: { $in: ["pending", "approved"] } }).select("startDate endDate").lean(); if (existing.some(record => overlaps(startDate, endDate, record.startDate, record.endDate))) throw new ValidationError("This leave overlaps another pending or approved request");
    const limit = limitsFor(organization)[leaveType]; const used = await approvedDays(String(user.organizationId), employee._id, leaveType, startDate.slice(0, 4), undefined, true); if (limit !== null && used + days > limit) throw new ValidationError(`Your ${leaveType} leave balance is not enough`, { leaveType: "Insufficient balance" });
    const created = await LeaveRequest.create({ organizationId: user.organizationId, employeeId: employee._id, userId: user._id, leaveType, startDate, endDate, days, reason }); return response.status(201).json({ data: { request: payload(created.toObject()) } });
  } catch (error) { return next(error); }
});

leaveRouter.post("/:id/cancel", requireRole("employee", "hr"), async (request, response, next) => {
  try { const { user, employee } = await employeeContext(request.auth!.userId); const record = await LeaveRequest.findOne({ _id: request.params.id, organizationId: user.organizationId, employeeId: employee._id }); if (!record) throw new NotFoundError("Leave request not found"); if (!["pending", "approved"].includes(record.status)) throw new ConflictError("This leave request cannot be cancelled"); record.status = "cancelled"; await record.save(); return response.json({ data: { request: payload(record.toObject()) } }); } catch (error) { return next(error); }
});

leaveRouter.get("/inbox", requireRole("admin", "hr"), async (request, response, next) => {
  try { const status = typeof request.query.status === "string" && ["pending", "approved", "rejected", "cancelled"].includes(request.query.status) ? request.query.status : "pending"; const records = await LeaveRequest.find({ organizationId: request.auth!.organizationId, status }).populate("employeeId", "name employeeCode department").sort({ createdAt: 1 }).limit(100).lean(); return response.json({ data: { requests: records.map(record => ({ ...payload(record), employee: record.employeeId })) } }); } catch (error) { return next(error); }
});

leaveRouter.patch("/:id/decision", requireRole("hr"), async (request, response, next) => {
  try { const body = asRecord(request.body); const decision = requiredString(body, "decision", 10); const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 500) : ""; if (!["approved", "rejected"].includes(decision)) throw new ValidationError("Decision must be approved or rejected"); const record = await LeaveRequest.findOne({ _id: request.params.id, organizationId: request.auth!.organizationId, status: "pending" }); if (!record) throw new NotFoundError("Pending leave request not found"); if (String(record.userId) === request.auth!.userId) throw new ConflictError("You cannot decide your own leave request"); if (decision === "approved") { const organization = await Organization.findById(record.organizationId).select("leaveQuotas").lean(); const limit = limitsFor(organization)[record.leaveType as LeaveType]; const used = await approvedDays(request.auth!.organizationId, record.employeeId, record.leaveType as LeaveType, record.startDate.slice(0, 4), String(record._id)); if (limit !== null && used + record.days > limit) throw new ValidationError("This approval would exceed the employee leave balance"); } record.status = decision as "approved" | "rejected"; record.decisionComment = comment; record.decidedBy = request.auth!.userId as never; record.decidedAt = new Date(); await record.save(); await Notification.create({ organizationId: record.organizationId, recipientUserId: record.userId, type: "leave_decision", title: `Leave request ${decision}`, message: `Your ${record.leaveType} leave request for ${record.startDate} to ${record.endDate} was ${decision}.${comment ? ` HR comment: ${comment}` : ""}` }); await AuditLog.create({ organizationId: record.organizationId, actorUserId: request.auth!.userId, action: `leave.${decision}`, entityType: "LeaveRequest", entityId: String(record._id), summary: `${record.leaveType} leave request ${decision} for ${record.startDate} to ${record.endDate}`, before: { status: "pending" }, after: { status: decision, comment } }); return response.json({ data: { request: payload(record.toObject()) } }); } catch (error) { return next(error); }
});
