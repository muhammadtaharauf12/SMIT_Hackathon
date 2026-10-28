import { Router } from "express";
import { Organization } from "../models/organization";
import { User } from "../models/user";
import { hashPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { asRecord, ConflictError, emailString, passwordString, requiredString, safeUser } from "../utils/validation";

export const setupRouter = Router();
setupRouter.get("/status", async (_request, response, next) => { try { const organization = await Organization.exists({ singletonKey: "primary" }); response.json({ data: { setupRequired: !organization } }); } catch (error) { next(error); } });
setupRouter.post("/", async (request, response, next) => { let organization; try { const body = asRecord(request.body); const companyName = requiredString(body, "companyName"); const adminName = requiredString(body, "adminName"); const adminEmail = emailString(body, "adminEmail"); const adminPassword = passwordString(body, "adminPassword"); if (await Organization.exists({ singletonKey: "primary" })) throw new ConflictError("The organization is already set up"); organization = await Organization.create({ companyName }); const admin = await User.create({ organizationId: organization._id, name: adminName, email: adminEmail, passwordHash: await hashPassword(adminPassword), role: "admin" }); response.status(201).json({ data: { token: signToken({ sub: String(admin._id), ver: admin.tokenVersion }), organization: { id: organization._id, companyName }, user: safeUser(admin.toObject()) } }); } catch (error: unknown) { if (organization?._id) await Organization.findByIdAndDelete(organization._id).catch(() => undefined); if (error instanceof Error && "code" in error && error.code === 11000) return next(new ConflictError("The organization or Admin email already exists")); return next(error); } });
