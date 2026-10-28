import { Router } from "express";
import { Employee } from "../models/employee";
import { User } from "../models/user";
import { Organization } from "../models/organization";
import { AuditLog } from "../models/audit-log";
import { requireAuth, requireRole } from "../middleware/auth";
import { hashPassword } from "../utils/password";
import { asRecord, ConflictError, emailString, passwordString, requiredString, ValidationError } from "../utils/validation";

export const employeesRouter = Router();
employeesRouter.use(requireAuth);

const employeePayload = (employee: Record<string, unknown>) => ({
  id: String(employee._id), employeeCode: employee.employeeCode, name: employee.name, email: employee.email,
  phone: employee.phone, address: employee.address, department: employee.department, designation: employee.designation,
  employmentType: employee.employmentType, joinDate: employee.joinDate, exitDate: employee.exitDate, basicSalary: employee.basicSalary, status: employee.status,
});

employeesRouter.post("/", requireRole("hr"), async (request, response, next) => {
  let userId: string | undefined;
  let employeeId: string | undefined;
  try {
    const body = asRecord(request.body);
    const organizationId = request.auth?.organizationId;
    const employeeCode = requiredString(body, "employeeCode", 40).toUpperCase();
    const name = requiredString(body, "name");
    const email = emailString(body);
    const temporaryPassword = passwordString(body, "temporaryPassword");
    const designation = requiredString(body, "designation", 100);
    const department = typeof body.department === "string" ? body.department.trim() : "";
    const organization = await Organization.findById(organizationId).select("departments designations").lean();
    if (!organization) throw new ValidationError("Organization not found");
    if (organization.departments?.length && !organization.departments.includes(department)) throw new ValidationError("Choose a configured department");
    if (organization.designations?.length && !organization.designations.includes(designation)) throw new ValidationError("Choose a configured designation");
    const joinDate = requiredString(body, "joinDate", 10);
    const exitDate = typeof body.exitDate === "string" && body.exitDate ? body.exitDate : null;
    const basicSalary = Number(body.basicSalary);
    const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
    if (!organizationId || !validDate(joinDate)) throw new ValidationError("Enter a valid join date", { joinDate: "Use YYYY-MM-DD" });
    if (exitDate && (!validDate(exitDate) || exitDate < joinDate)) throw new ValidationError("Enter a valid exit date", { exitDate: "Exit date must be on or after the join date" });
    if (!Number.isFinite(basicSalary) || basicSalary <= 0 || basicSalary > 1_000_000_000) throw new ValidationError("Basic salary must be greater than zero", { basicSalary: "Invalid salary" });
    if (await User.exists({ email })) throw new ConflictError("A user with this email already exists");
    if (await Employee.exists({ organizationId, employeeCode })) throw new ConflictError("An employee with this code already exists");
    const user = await User.create({ organizationId, name, email, passwordHash: await hashPassword(temporaryPassword), role: "employee", mustChangePassword: true });
    userId = String(user._id);
    const employee = await Employee.create({ organizationId, userId: user._id, employeeCode, name, email, phone: typeof body.phone === "string" ? body.phone.trim() : "", address: typeof body.address === "string" ? body.address.trim() : "", department, designation, employmentType: body.employmentType ?? "full_time", joinDate: new Date(`${joinDate}T00:00:00.000Z`), exitDate: exitDate ? new Date(`${exitDate}T00:00:00.000Z`) : null, basicSalary });
    employeeId = String(employee._id);
    user.employeeId = employee._id;
    await user.save();
    userId = undefined;
    employeeId = undefined;
    await AuditLog.create({ organizationId, actorUserId: request.auth!.userId, action: "employee.created", entityType: "Employee", entityId: String(employee._id), summary: `Employee ${employeeCode} registered`, after: { employeeCode, name, department: employee.department, designation, joinDate, basicSalary } });
    return response.status(201).json({ data: { employee: employeePayload(employee.toObject()) } });
  } catch (error: unknown) {
    if (employeeId) await Employee.findByIdAndDelete(employeeId).catch(() => undefined);
    if (userId) await User.findByIdAndDelete(userId).catch(() => undefined);
    if (error instanceof Error && "code" in error && error.code === 11000) return next(new ConflictError("Employee code or email already exists"));
    return next(error);
  }
});

employeesRouter.get("/", async (request, response, next) => {
  try {
    const organizationId = request.auth?.organizationId;
    const role = request.auth?.role;
    const ownEmployeeId = request.auth?.userId;
    const page = Math.max(1, Math.min(1000, Number(request.query.page) || 1));
    const limit = Math.max(1, Math.min(50, Number(request.query.limit) || 20));
    const search = typeof request.query.search === "string" ? request.query.search.trim().slice(0, 80) : "";
    const query: Record<string, unknown> = { organizationId };
    if (role === "employee") {
      const user = await User.findById(ownEmployeeId).select("employeeId").lean();
      if (!user?.employeeId) return response.json({ data: { employees: [], page, limit, total: 0 } });
      query._id = user.employeeId;
    } else if (search) { const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); query.$or = [{ name: { $regex: escaped, $options: "i" } }, { email: { $regex: escaped, $options: "i" } }, { employeeCode: { $regex: escaped, $options: "i" } }, { department: { $regex: escaped, $options: "i" } }]; }
    const [employees, total] = await Promise.all([Employee.find(query).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(), Employee.countDocuments(query)]);
    return response.json({ data: { employees: employees.map(employeePayload), page, limit, total } });
  } catch (error) { return next(error); }
});

employeesRouter.get("/:id", async (request, response, next) => {
  try {
    const employee = await Employee.findOne({ _id: request.params.id, organizationId: request.auth?.organizationId }).lean();
    if (!employee) return response.status(404).json({ error: { code: "NOT_FOUND", message: "Employee not found" } });
    if (request.auth?.role === "employee" && String(employee.userId) !== request.auth.userId) return response.status(403).json({ error: { code: "FORBIDDEN", message: "You can only view your own employee profile" } });
    return response.json({ data: { employee: employeePayload(employee) } });
  } catch (error) { return next(error); }
});

employeesRouter.patch("/:id", async (request, response, next) => {
  try {
    const body = asRecord(request.body);
    const employee = await Employee.findOne({ _id: request.params.id, organizationId: request.auth!.organizationId });
    if (!employee) return response.status(404).json({ error: { code: "NOT_FOUND", message: "Employee not found" } });
    const role = request.auth!.role;
    if (role === "employee" && String(employee.userId) !== request.auth!.userId) return response.status(403).json({ error: { code: "FORBIDDEN", message: "You can only edit your own contact details" } });
    if (role === "admin") return response.status(403).json({ error: { code: "FORBIDDEN", message: "Only HR can update employee records" } });
    const fields = role === "hr" ? ["phone", "address", "department", "designation", "basicSalary", "status", "exitDate"] : ["phone", "address"];
    if (Object.keys(body).some(key => !fields.includes(key))) throw new ValidationError("This field cannot be changed from your role");
    if (role === "hr" && (body.department !== undefined || body.designation !== undefined)) {
      const organization = await Organization.findById(employee.organizationId).select("departments designations").lean();
      if (organization?.departments?.length && body.department !== undefined && !organization.departments.includes(body.department)) throw new ValidationError("Choose a configured department");
      if (organization?.designations?.length && body.designation !== undefined && !organization.designations.includes(body.designation)) throw new ValidationError("Choose a configured designation");
    }
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    for (const key of fields) {
      if (!(key in body)) continue;
      const value = body[key];
      if (["phone", "address", "department", "designation"].includes(key)) {
        const max = key === "phone" ? 30 : key === "address" ? 240 : 100;
        if (typeof value !== "string" || value.length > max || key === "designation" && !value.trim()) throw new ValidationError(`Invalid ${key}`);
        before[key] = employee.get(key); after[key] = value.trim(); employee.set(key, after[key]);
      } else if (key === "basicSalary") {
        const salary = Number(value); if (!Number.isFinite(salary) || salary <= 0 || salary > 1_000_000_000) throw new ValidationError("Invalid basic salary");
        before[key] = employee.basicSalary; after[key] = salary; employee.basicSalary = salary;
      } else if (key === "status") {
        if (value !== "active" && value !== "inactive") throw new ValidationError("Invalid employee status");
        before[key] = employee.status; after[key] = value; employee.status = value;
      } else if (key === "exitDate") {
        if (value !== null && (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) || new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value || value < employee.joinDate.toISOString().slice(0, 10))) throw new ValidationError("Invalid exit date");
        before[key] = employee.exitDate; after[key] = value; employee.exitDate = value ? new Date(`${value}T00:00:00.000Z`) : null;
      }
    }
    if (Object.keys(after).length) { await employee.save(); await AuditLog.create({ organizationId: employee.organizationId, actorUserId: request.auth!.userId, action: "employee.updated", entityType: "Employee", entityId: String(employee._id), summary: `Employee ${employee.employeeCode} updated`, before, after }); }
    return response.json({ data: { employee: employeePayload(employee.toObject()) } });
  } catch (error) { return next(error); }
});
