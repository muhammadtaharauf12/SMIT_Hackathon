import type { UserRole } from "../models/user";

export const toolNames = ["get_headcount", "get_attendance_summary", "get_late_comers", "get_leave_summary", "get_my_leave_balance", "get_payroll_summary", "search_employees"] as const;
export type AiToolName = typeof toolNames[number];

const descriptions: Record<AiToolName, string> = {
  get_headcount: "Get active employee headcount, optionally filtered by department.",
  get_attendance_summary: "Get attendance status totals for a month, optionally filtered by department.",
  get_late_comers: "Find the employees with the most late attendance records in a month.",
  get_leave_summary: "Get leave request totals and approved days, scoped to the employee for employee users.",
  get_my_leave_balance: "Get the signed-in employee's remaining annual, sick, casual, and unpaid leave balance.",
  get_payroll_summary: "Get monthly payroll totals, scoped to the employee's own payslip for employee users.",
  search_employees: "Search employee directory records by name, code, email, or department.",
};

export const toolDeclarations = toolNames.map(name => ({ name, description: descriptions[name], parameters: { type: "object", properties: { month: { type: "string", description: "Month in YYYY-MM format." }, department: { type: "string", description: "Exact department filter." }, query: { type: "string", description: "Employee search text." }, leaveType: { type: "string", enum: ["annual", "sick", "casual", "unpaid"] } } } }));

export const canUseTool = (role: UserRole, name: string) => {
  if (!toolNames.includes(name as AiToolName)) return false;
  if (role === "employee") return ["get_attendance_summary", "get_leave_summary", "get_my_leave_balance", "get_payroll_summary", "search_employees"].includes(name);
  return true;
};
