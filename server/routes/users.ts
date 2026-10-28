import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { User } from "../models/user";
import { Employee } from "../models/employee";
import { Organization } from "../models/organization";
import { AuditLog } from "../models/audit-log";
import { hashPassword } from "../utils/password";
import { asRecord, ConflictError, emailString, passwordString, requiredString, safeUser, ValidationError, NotFoundError } from "../utils/validation";

export const usersRouter = Router(); usersRouter.use(requireAuth, requireRole("admin"));
usersRouter.post("/hr", async (request, response, next) => { try { const body = asRecord(request.body); const name = requiredString(body, "name"); const email = emailString(body); const temporaryPassword = passwordString(body, "temporaryPassword"); if (await User.exists({ email })) throw new ConflictError("A user with this email already exists"); const user = await User.create({ organizationId: request.auth?.organizationId, name, email, passwordHash: await hashPassword(temporaryPassword), role: "hr", mustChangePassword: true }); return response.status(201).json({ data: { user: safeUser(user.toObject()) } }); } catch (error) { return next(error); } });

usersRouter.get("/hr", async (request, response, next) => {
  try { const users = await User.find({ organizationId: request.auth!.organizationId, role: "hr" }).select("name email active employeeId").sort({ name: 1 }).lean(); return response.json({ data: { users: users.map(user => ({ id: String(user._id), name: user.name, email: user.email, active: user.active, hasProfile: Boolean(user.employeeId) })) } }); } catch (error) { return next(error); }
});

usersRouter.post("/hr/:id/profile", async (request, response, next) => {
  let employeeId: string | undefined;
  try {
    const body = asRecord(request.body);
    const user = await User.findOne({ _id: request.params.id, organizationId: request.auth!.organizationId, role: "hr" });
    if (!user) throw new NotFoundError("HR account not found");
    if (user.employeeId) throw new ConflictError("This HR account already has a staff profile");
    const employeeCode = requiredString(body, "employeeCode", 40).toUpperCase();
    const designation = requiredString(body, "designation", 100);
    const joinDate = requiredString(body, "joinDate", 10);
    const department = typeof body.department === "string" ? body.department.trim().slice(0, 100) : "HR";
    const organization = await Organization.findById(user.organizationId).select("departments designations").lean();
    if (organization?.departments?.length && !organization.departments.includes(department)) throw new ValidationError("Choose a configured department");
    if (organization?.designations?.length && !organization.designations.includes(designation)) throw new ValidationError("Choose a configured designation");
    const basicSalary = Number(body.basicSalary);
    const parsed = new Date(`${joinDate}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(joinDate) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== joinDate) throw new ValidationError("Enter a valid join date");
    if (!Number.isFinite(basicSalary) || basicSalary <= 0 || basicSalary > 1_000_000_000) throw new ValidationError("Basic salary must be greater than zero");
    if (await Employee.exists({ organizationId: user.organizationId, employeeCode })) throw new ConflictError("Employee code already exists");
    const employee = await Employee.create({ organizationId: user.organizationId, userId: user._id, employeeCode, name: user.name, email: user.email, designation, department, joinDate: parsed, basicSalary });
    employeeId = String(employee._id);
    user.employeeId = employee._id;
    await user.save();
    employeeId = undefined;
    await AuditLog.create({ organizationId: user.organizationId, actorUserId: request.auth!.userId, action: "hr.profile_linked", entityType: "Employee", entityId: String(employee._id), summary: `Staff profile linked for HR ${user.name}`, after: { employeeCode, designation, department, joinDate, basicSalary } });
    return response.status(201).json({ data: { employeeId: String(employee._id) } });
  } catch (error: unknown) {
    if (employeeId) await Employee.findByIdAndDelete(employeeId).catch(() => undefined);
    if (error instanceof Error && "code" in error && error.code === 11000) return next(new ConflictError("An employee with this code or email already exists"));
    return next(error);
  }
});

usersRouter.get("/", async (request, response, next) => {
  try { const users = await User.find({ organizationId: request.auth!.organizationId }).select("name email role active mustChangePassword employeeId").sort({ role: 1, name: 1 }).limit(200).lean(); return response.json({ data: { users: users.map(user => ({ ...safeUser(user), active: user.active })) } }); } catch (error) { return next(error); }
});

usersRouter.patch("/:id/deactivate", async (request, response, next) => {
  try {
    if (request.params.id === request.auth!.userId) throw new ConflictError("You cannot deactivate your own account");
    const user = await User.findOne({ _id: request.params.id, organizationId: request.auth!.organizationId });
    if (!user) throw new NotFoundError("User not found");
    if (!user.active) throw new ConflictError("Account is already inactive");
    user.active = false; user.tokenVersion += 1; await user.save();
    await AuditLog.create({ organizationId: user.organizationId, actorUserId: request.auth!.userId, action: "user.deactivated", entityType: "User", entityId: String(user._id), summary: `Account deactivated for ${user.email}`, before: { active: true }, after: { active: false } });
    return response.json({ data: { user: { ...safeUser(user.toObject()), active: false } } });
  } catch (error) { return next(error); }
});

usersRouter.post("/:id/reset-password", async (request, response, next) => {
  try {
    const body = asRecord(request.body);
    const temporaryPassword = passwordString(body, "temporaryPassword");
    const user = await User.findOne({ _id: request.params.id, organizationId: request.auth!.organizationId });
    if (!user) throw new NotFoundError("User not found");
    user.passwordHash = await hashPassword(temporaryPassword); user.mustChangePassword = true; user.tokenVersion += 1; await user.save();
    await AuditLog.create({ organizationId: user.organizationId, actorUserId: request.auth!.userId, action: "user.password_reset", entityType: "User", entityId: String(user._id), summary: `Temporary password issued for ${user.email}`, after: { mustChangePassword: true } });
    return response.json({ data: { user: safeUser(user.toObject()) } });
  } catch (error) { return next(error); }
});
