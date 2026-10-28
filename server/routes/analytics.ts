import { Router } from "express";
import { Attendance } from "../models/attendance";
import { AttendanceCorrection } from "../models/attendance-correction";
import { Employee } from "../models/employee";
import { LeaveRequest } from "../models/leave-request";
import { PayrollRun, Payslip } from "../models/payroll";
import { requireAuth } from "../middleware/auth";
import { companyDate, validIsoDate } from "../utils/company-date";
import { Holiday } from "../models/holiday";
import { Organization } from "../models/organization";
import { effectiveAttendanceStatus } from "../utils/company-date";
import { ValidationError } from "../utils/validation";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

analyticsRouter.get("/summary", async (request, response, next) => {
  try {
    const today = typeof request.query.date === "string" ? request.query.date : companyDate();
    if (!validIsoDate(today)) throw new ValidationError("Date must use YYYY-MM-DD");
    const currentMonth = today.slice(0, 7);
    const department = typeof request.query.department === "string" ? request.query.department.trim().slice(0, 100) : "";
    const organizationId = request.auth!.organizationId;
    if (request.auth!.role === "employee") {
      const employee = await Employee.findOne({ userId: request.auth!.userId, organizationId }).select("_id name employeeCode department").lean();
      if (!employee) return response.json({ data: { role: "employee", employee: null, attendanceToday: null, pendingLeave: 0, payslip: null } });
      const [attendanceToday, pendingLeave, finalizedRuns] = await Promise.all([Attendance.findOne({ organizationId, employeeId: employee._id, attendanceDate: today }).lean(), LeaveRequest.countDocuments({ organizationId, employeeId: employee._id, status: "pending" }), PayrollRun.find({ organizationId, status: "finalized" }).select("_id").lean()]);
      const payslip = await Payslip.findOne({ organizationId, employeeId: employee._id, payrollRunId: { $in: finalizedRuns.map(run => run._id) } }).sort({ month: -1 }).lean();
      return response.json({ data: { role: "employee", employee, attendanceToday, pendingLeave, payslip: payslip ? { month: payslip.month, netPay: payslip.netPay } : null } });
    }
    const [attendance, pendingLeave, pendingCorrections, payroll, employed, approvedLeave, organization, holiday] = await Promise.all([Attendance.find({ organizationId, attendanceDate: today }).select("employeeId status checkOut attendanceDate").lean(), LeaveRequest.countDocuments({ organizationId, status: "pending" }), AttendanceCorrection.countDocuments({ organizationId, status: "pending" }), PayrollRun.findOne({ organizationId, month: currentMonth }).lean(), Employee.find({ organizationId, ...(department ? { department } : {}), joinDate: { $lte: new Date(`${today}T23:59:59.999Z`) }, $or: [{ exitDate: null }, { exitDate: { $gte: new Date(`${today}T00:00:00.000Z`) } }] }).select("_id status").lean(), LeaveRequest.find({ organizationId, status: "approved", startDate: { $lte: today }, endDate: { $gte: today } }).select("employeeId").lean(), Organization.findById(organizationId).select("weekendDays").lean(), Holiday.exists({ organizationId, date: today })]);
    const payrollEmployees = payroll && department ? await Employee.find({ organizationId, department }).select("_id").lean() : []; const payslips = payroll ? await Payslip.find({ organizationId, payrollRunId: payroll._id, ...(department ? { employeeId: { $in: payrollEmployees.map(employee => employee._id) } } : {}) }).select("grossPay netPay").lean() : [];
    const scopedIds = new Set(employed.map(employee => String(employee._id))); const filteredAttendance = attendance.filter(record => scopedIds.has(String(record.employeeId))); const scopedPending = department ? await LeaveRequest.countDocuments({ organizationId, status: "pending", employeeId: { $in: employed.map(employee => employee._id) } }) : pendingLeave; const scopedCorrections = department ? await AttendanceCorrection.countDocuments({ organizationId, status: "pending", employeeId: { $in: employed.map(employee => employee._id) } }) : pendingCorrections; const statusCounts = filteredAttendance.reduce<Record<string, number>>((counts, record) => { const status = effectiveAttendanceStatus(record); counts[status] = (counts[status] ?? 0) + 1; return counts; }, {});
    const attendedIds = new Set(filteredAttendance.map(record => String(record.employeeId)));
    const leaveIds = new Set(approvedLeave.filter(leave => scopedIds.has(String(leave.employeeId))).map(leave => String(leave.employeeId)));
    const working = !holiday && !(organization?.weekendDays ?? [0, 6]).includes(new Date(`${today}T00:00:00.000Z`).getUTCDay());
    const absent = working && today <= companyDate() ? employed.filter(employee => !attendedIds.has(String(employee._id)) && !leaveIds.has(String(employee._id))).length : 0;
    const expected = working && today <= companyDate() ? Math.max(0, employed.length - leaveIds.size) : 0;
    const presentOrLate = (statusCounts.present ?? 0) + (statusCounts.late ?? 0);
    const attendanceRate = expected ? Math.round(((statusCounts.present ?? 0) + (statusCounts.late ?? 0) + (statusCounts.missing_checkout ?? 0) + (statusCounts.half_day ?? 0) * 0.5) / expected * 100) : null;
    const latePercent = presentOrLate ? Math.round((statusCounts.late ?? 0) / presentOrLate * 100) : null;
    return response.json({ data: { role: request.auth!.role, date: today, department: department || null, headcount: employed.filter(employee => employee.status === "active").length, attendance: { total: filteredAttendance.length, present: statusCounts.present ?? 0, late: statusCounts.late ?? 0, halfDay: statusCounts.half_day ?? 0, missingCheckout: statusCounts.missing_checkout ?? 0, absent, onLeave: leaveIds.size, attendanceRate, latePercent }, approvals: { leave: scopedPending, corrections: scopedCorrections }, payroll: payroll ? { month: payroll.month, status: payroll.status, gross: payslips.reduce((sum, slip) => sum + slip.grossPay, 0), net: payslips.reduce((sum, slip) => sum + slip.netPay, 0) } : null } });
  } catch (error) { return next(error); }
});
