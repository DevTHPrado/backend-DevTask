import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export const SESSION_COOKIE_NAME = "devtask_session";
export const SESSION_SECRET = process.env.SESSION_SECRET || "devtask-super-secret-key-2026-secure-token";
export const SESSION_DURATION_DAYS = 7;

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
  } catch {
    return false;
  }
}

export function createSessionToken(userId: string, username: string): string {
  const expiresAt = Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}:${username}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}:${signature}`;
}

export function verifySessionToken(token: string): { userId: string; username: string } | null {
  try {
    const parts = token.split(":");
    if (parts.length !== 4) return null;

    const [userId, username, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return null;
    }

    const payload = `${userId}:${username}:${expiresAtStr}`;
    const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"))) {
      return null;
    }

    return { userId, username };
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const sessionCookie = req.cookies?.[SESSION_COOKIE_NAME] || req.headers.authorization?.replace("Bearer ", "");

  if (!sessionCookie) {
    res.status(401).json({ success: false, error: "Usuário não autenticado." });
    return;
  }

  const session = verifySessionToken(sessionCookie);
  if (!session) {
    res.status(401).json({ success: false, error: "Sessão inválida ou expirada." });
    return;
  }

  req.user = session;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const sessionCookie = req.cookies?.[SESSION_COOKIE_NAME] || req.headers.authorization?.replace("Bearer ", "");

  if (sessionCookie) {
    const session = verifySessionToken(sessionCookie);
    if (session) {
      req.user = session;
    }
  }

  next();
}
