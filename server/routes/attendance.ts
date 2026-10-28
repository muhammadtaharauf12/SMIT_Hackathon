import { Router } from "express";
import { Attendance } from "../models/attendance";
import { AttendanceCorrection } from "../models/attendance-correction";
import { Employee } from "../models/employee";
import { Organization } from "../models/organization";
import { LeaveRequest } from "../models/leave-request";
import { Holiday } from "../models/holiday";
import { User } from "../models/user";
import { Notification } from "../models/notification";
import { AuditLog } from "../models/audit-log";
import { durationMinutes, isLate, statusAfterCheckout } from "../utils/attendance-rules";
import { requireAuth, requireRole } from "../middleware/auth";
import { ConflictError, NotFoundError, ValidationError } from "../utils/validation";
import { companyDate, effectiveAttendanceStatus } from "../utils/company-date";

export const attendanceRouter = Router();
attendanceRouter.use(requireAuth);

const dateKey = companyDate;
const attendancePayload = (record: Record<string, unknown> | null) => record ? ({ id: String(record._id), attendanceDate: record.attendanceDate, checkIn: record.checkIn, checkOut: record.checkOut, durationMinutes: record.durationMinutes, status: effectiveAttendanceStatus(record as { status: string; checkOut?: Date | null; attendanceDate: string }), officeStart: record.officeStart, graceMinutes: record.graceMinutes }) : null;
const correctionPayload = (record: Record<string, unknown>) => ({ id: String(record._id), attendanceId: String(record.attendanceId), requestedCheckIn: record.requestedCheckIn, requestedCheckOut: record.requestedCheckOut, reason: record.reason, status: record.status, decisionComment: record.decisionComment, createdAt: record.createdAt });

const ownContext = async (userId: string) => {
  const user = await User.findById(userId).select("employeeId organizationId").lean();
  if (!user?.employeeId) throw new ValidationError("Your account is not linked to an employee profile");
  const [employee, organization] = await Promise.all([Employee.findOne({ _id: user.employeeId, organizationId: user.organizationId, status: "active" }).lean(), Organization.findById(user.organizationId).lean()]);
  if (!employee || !organization) throw new NotFoundError("Employee profile not found");
  return { user, employee, organization };
};

attendanceRouter.get("/today", requireRole("employee", "hr"), async (request, response, next) => {
  try { const { employee } = await ownContext(request.auth!.userId); const record = await Attendance.findOne({ employeeId: employee._id, attendanceDate: dateKey(new Date()) }).lean(); return response.json({ data: { attendance: attendancePayload(record) } }); } catch (error) { return next(error); }
});

attendanceRouter.get("/calendar", requireRole("employee", "hr"), async (request, response, next) => {
  try {
    const month = typeof request.query.month === "string" ? request.query.month : dateKey(new Date()).slice(0, 7);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new ValidationError("Month must use YYYY-MM");
    const { user, employee, organization } = await ownContext(request.auth!.userId);
    const start = `${month}-01`;
    const end = `${month}-${String(new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).getUTCDate()).padStart(2, "0")}`;
    const [records, leaves, holidays] = await Promise.all([
      Attendance.find({ organizationId: user.organizationId, employeeId: employee._id, attendanceDate: { $gte: start, $lte: end } }).lean(),
      LeaveRequest.find({ organizationId: user.organizationId, employeeId: employee._id, status: "approved", startDate: { $lte: end }, endDate: { $gte: start } }).select("startDate endDate").lean(),
      Holiday.find({ organizationId: user.organizationId, date: { $gte: start, $lte: end } }).select("date").lean(),
    ]);
    const recordByDate = new Map(records.map(record => [record.attendanceDate, record]));
    const holidayDates = new Set(holidays.map(holiday => holiday.date));
    const days: Array<{ date: string; status: string; checkIn: Date | null; checkOut: Date | null }> = [];
    for (let cursor = new Date(`${start}T00:00:00.000Z`); cursor <= new Date(`${end}T00:00:00.000Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const date = cursor.toISOString().slice(0, 10);
      const record = recordByDate.get(date);
      const onLeave = leaves.some(leave => leave.startDate <= date && leave.endDate >= date);
      const weekend = (organization.weekendDays ?? [0, 6]).includes(cursor.getUTCDay());
      const employed = employee.joinDate.toISOString().slice(0, 10) <= date && (!employee.exitDate || employee.exitDate.toISOString().slice(0, 10) >= date);
      const status = record ? effectiveAttendanceStatus(record) : holidayDates.has(date) ? "holiday" : weekend ? "weekend" : onLeave ? "on_leave" : employed && date < dateKey(new Date()) ? "absent" : "";
      days.push({ date, status, checkIn: record?.checkIn ?? null, checkOut: record?.checkOut ?? null });
    }
    return response.json({ data: { month, days } });
  } catch (error) { return next(error); }
});

attendanceRouter.post("/check-in", requireRole("employee", "hr"), async (request, response, next) => {
  try {
    const { user, employee, organization } = await ownContext(request.auth!.userId); const now = new Date(); const attendanceDate = dateKey(now);
    if (await Attendance.exists({ employeeId: employee._id, attendanceDate })) throw new ConflictError("You have already checked in today");
    const officeStart = organization.officeStart; const graceMinutes = organization.graceMinutes; const status = isLate(now, officeStart, graceMinutes) ? "late" : "present";
    const record = await Attendance.create({ organizationId: user.organizationId, employeeId: employee._id, userId: user._id, attendanceDate, checkIn: now, status, officeStart, graceMinutes });
    return response.status(201).json({ data: { attendance: attendancePayload(record.toObject()) } });
  } catch (error: unknown) { if (error instanceof Error && "code" in error && error.code === 11000) return next(new ConflictError("You have already checked in today")); return next(error); }
});

attendanceRouter.post("/check-out", requireRole("employee", "hr"), async (request, response, next) => {
  try {
    const { employee } = await ownContext(request.auth!.userId); const record = await Attendance.findOne({ employeeId: employee._id, attendanceDate: dateKey(new Date()) });
    if (!record) throw new NotFoundError("Check in before checking out");
    if (record.checkOut) throw new ConflictError("You have already checked out today");
    const now = new Date(); const duration = durationMinutes(record.checkIn, now); record.checkOut = now; record.durationMinutes = duration; record.status = statusAfterCheckout(record.status, duration); await record.save();
    return response.json({ data: { attendance: attendancePayload(record.toObject()) } });
  } catch (error) { return next(error); }
});

attendanceRouter.post("/corrections", requireRole("employee", "hr"), async (request, response, next) => {
  try {
    const { user, employee } = await ownContext(request.auth!.userId); const body = request.body as Record<string, unknown>; const attendanceDate = typeof body.attendanceDate === "string" ? body.attendanceDate : ""; const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : ""; const checkIn = typeof body.checkIn === "string" ? new Date(body.checkIn) : null; const checkOut = typeof body.checkOut === "string" && body.checkOut ? new Date(body.checkOut) : null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate) || !checkIn || Number.isNaN(checkIn.getTime()) || (checkOut && Number.isNaN(checkOut.getTime())) || (checkOut && checkOut <= checkIn) || !reason) throw new ValidationError("Provide a valid date, correction times, and reason");
    const attendance = await Attendance.findOne({ _id: body.attendanceId, organizationId: user.organizationId, employeeId: employee._id, attendanceDate }); if (!attendance) throw new NotFoundError("Attendance record not found");
    if (await AttendanceCorrection.exists({ attendanceId: attendance._id, status: "pending" })) throw new ConflictError("A correction is already awaiting HR review");
    const correction = await AttendanceCorrection.create({ organizationId: user.organizationId, attendanceId: attendance._id, employeeId: employee._id, requestedBy: user._id, requestedCheckIn: checkIn, requestedCheckOut: checkOut, reason }); return response.status(201).json({ data: { correction: correctionPayload(correction.toObject()) } });
  } catch (error) { return next(error); }
});

attendanceRouter.get("/corrections", requireRole("employee", "hr"), async (request, response, next) => {
  try { const { user, employee } = await ownContext(request.auth!.userId); const records = await AttendanceCorrection.find({ organizationId: user.organizationId, employeeId: employee._id }).sort({ createdAt: -1 }).limit(50).lean(); return response.json({ data: { corrections: records.map(correctionPayload) } }); } catch (error) { return next(error); }
});

attendanceRouter.get("/corrections/inbox", requireRole("admin", "hr"), async (request, response, next) => {
  try { const records = await AttendanceCorrection.find({ organizationId: request.auth!.organizationId, status: "pending" }).populate("employeeId", "name employeeCode").populate("attendanceId", "attendanceDate checkIn checkOut").sort({ createdAt: 1 }).limit(100).lean(); return response.json({ data: { corrections: records.map(record => ({ ...correctionPayload(record), employee: record.employeeId, attendance: record.attendanceId })) } }); } catch (error) { return next(error); }
});

attendanceRouter.patch("/corrections/:id/decision", requireRole("hr"), async (request, response, next) => {
  try {
    const body = request.body as Record<string, unknown>; const decision = typeof body.decision === "string" ? body.decision : ""; const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 500) : ""; if (!["approved", "rejected"].includes(decision)) throw new ValidationError("Decision must be approved or rejected"); const correction = await AttendanceCorrection.findOne({ _id: request.params.id, organizationId: request.auth!.organizationId, status: "pending" }); if (!correction) throw new NotFoundError("Pending correction not found"); if (String(correction.requestedBy) === request.auth!.userId) throw new ConflictError("You cannot decide your own correction");
    if (decision === "approved") { const attendance = await Attendance.findOne({ _id: correction.attendanceId, organizationId: correction.organizationId, employeeId: correction.employeeId }); if (!attendance) throw new NotFoundError("Attendance record not found"); attendance.checkIn = correction.requestedCheckIn; attendance.checkOut = correction.requestedCheckOut; attendance.durationMinutes = correction.requestedCheckOut ? durationMinutes(correction.requestedCheckIn, correction.requestedCheckOut) : null; if (attendance.durationMinutes !== null) attendance.status = statusAfterCheckout(attendance.status, attendance.durationMinutes); await attendance.save(); }
    correction.status = decision as "approved" | "rejected"; correction.decisionComment = comment; correction.decidedBy = request.auth!.userId as never; correction.decidedAt = new Date(); await correction.save(); await Notification.create({ organizationId: correction.organizationId, recipientUserId: correction.requestedBy, type: "correction_decision", title: `Attendance correction ${decision}`, message: `Your attendance correction request was ${decision}.${comment ? ` HR comment: ${comment}` : ""}` }); await AuditLog.create({ organizationId: correction.organizationId, actorUserId: request.auth!.userId, action: `attendance_correction.${decision}`, entityType: "AttendanceCorrection", entityId: String(correction._id), summary: `Attendance correction ${decision} for ${correction.requestedCheckIn.toISOString().slice(0, 10)}` }); return response.json({ data: { correction: correctionPayload(correction.toObject()) } });
  } catch (error) { return next(error); }
});

attendanceRouter.get("/board", requireRole("admin", "hr"), async (request, response, next) => {
  try {
    const attendanceDate = typeof request.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(request.query.date) ? request.query.date : dateKey(new Date());
    const status = typeof request.query.status === "string" && ["present", "late", "half_day", "missing_checkout", "absent", "on_leave"].includes(request.query.status) ? request.query.status : "";
    const search = typeof request.query.search === "string" ? request.query.search.trim().slice(0, 80) : "";
    const organizationId = request.auth!.organizationId;
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const employeeQuery: Record<string, unknown> = { organizationId, joinDate: { $lte: new Date(`${attendanceDate}T23:59:59.999Z`) }, $or: [{ exitDate: null }, { exitDate: { $gte: new Date(`${attendanceDate}T00:00:00.000Z`) } }] };
    if (search) employeeQuery.$and = [{ $or: [{ name: { $regex: escaped, $options: "i" } }, { employeeCode: { $regex: escaped, $options: "i" } }, { department: { $regex: escaped, $options: "i" } }] }];
    const employees = await Employee.find(employeeQuery).select("_id name employeeCode department designation").sort({ name: 1 }).limit(200).lean();
    const [records, leaves, organization, holiday] = await Promise.all([
      Attendance.find({ organizationId, attendanceDate, employeeId: { $in: employees.map(employee => employee._id) } }).lean(),
      LeaveRequest.find({ organizationId, status: "approved", startDate: { $lte: attendanceDate }, endDate: { $gte: attendanceDate } }).select("employeeId").lean(),
      Organization.findById(organizationId).select("weekendDays").lean(),
      Holiday.exists({ organizationId, date: attendanceDate }),
    ]);
    const recordByEmployee = new Map(records.map(record => [String(record.employeeId), record]));
    const leaveIds = new Set(leaves.map(leave => String(leave.employeeId)));
    const weekday = new Date(`${attendanceDate}T00:00:00.000Z`).getUTCDay();
    const working = !holiday && !(organization?.weekendDays ?? [0, 6]).includes(weekday);
    const rows = employees.flatMap(employee => {
      const record = recordByEmployee.get(String(employee._id));
      const derivedStatus = record ? effectiveAttendanceStatus(record) : leaveIds.has(String(employee._id)) ? "on_leave" : working && attendanceDate < dateKey(new Date()) ? "absent" : "";
      if (!derivedStatus || status && status !== derivedStatus) return [];
      return [{ id: record ? String(record._id) : `${derivedStatus}-${employee._id}`, employee: { id: String(employee._id), name: employee.name, employeeCode: employee.employeeCode, department: employee.department, designation: employee.designation }, checkIn: record?.checkIn ?? null, checkOut: record?.checkOut ?? null, durationMinutes: record?.durationMinutes ?? null, status: derivedStatus }];
    });
    return response.json({ data: { attendanceDate, records: rows } });
  } catch (error) { return next(error); }
});
