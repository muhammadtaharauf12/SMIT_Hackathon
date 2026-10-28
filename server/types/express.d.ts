import type { UserRole } from "../models/user";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; organizationId: string; role: UserRole; mustChangePassword: boolean };
    }
  }
}

export {};
