import jwt from "jsonwebtoken";

import { env } from "../config/env";

export type AuthTokenPayload = {
  sub: string;
  ver?: number;
};

export const signToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });

export const verifyToken = (token: string): AuthTokenPayload =>
  jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
