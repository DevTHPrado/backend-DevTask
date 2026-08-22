import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "../validations/auth.validation.js";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  AuthenticatedRequest,
} from "../middlewares/auth.middleware.js";

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || "Dados de login inválidos.",
      });
      return;
    }

    const { username, password } = parsed.data;

    const userRows = await prisma.$queryRaw<Array<{ id: string; username: string; password: string; name: string | null; avatar: string | null; color: string | null }>>`
      SELECT id, username, password, name, avatar, color FROM "User" 
      WHERE LOWER(username) = LOWER(${username.trim()}) 
      LIMIT 1;
    `;

    if (!userRows || userRows.length === 0) {
      res.status(401).json({ success: false, error: "Usuário ou senha incorretos." });
      return;
    }

    const user = userRows[0];
    const isValidPassword = verifyPassword(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({ success: false, error: "Usuário ou senha incorretos." });
      return;
    }

    const token = createSessionToken(user.id, user.username);

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      success: true,
      token,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar || "<>",
        color: user.color || "#3b82f6",
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || "Dados de cadastro inválidos.",
      });
      return;
    }

    const { username, name, password } = parsed.data;
    const normalizedUsername = username.toLowerCase().trim();

    const existingUsers = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "User" WHERE LOWER(username) = ${normalizedUsername} LIMIT 1;
    `;

    if (existingUsers && existingUsers.length > 0) {
      res.status(400).json({ success: false, error: "Este nome de usuário já está em uso." });
      return;
    }

    const userId = "usr_" + Date.now();
    const hashedPassword = hashPassword(password);

    await prisma.$executeRawUnsafe(
      `INSERT INTO "User" ("id", "username", "name", "password", "avatar", "color", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, '<>', '#3b82f6', NOW(), NOW());`,
      userId,
      normalizedUsername,
      name?.trim() || normalizedUsername,
      hashedPassword
    );

    const token = createSessionToken(userId, normalizedUsername);

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(201).json({
      success: true,
      token,
      data: {
        id: userId,
        username: normalizedUsername,
        name: name?.trim() || normalizedUsername,
        avatar: "<>",
        color: "#3b82f6",
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.json({ success: true, data: null });
      return;
    }

    const userRows = await prisma.$queryRaw<Array<{ id: string; username: string; name: string | null; avatar: string | null; color: string | null }>>`
      SELECT id, username, name, avatar, color FROM "User" WHERE id = ${req.user.userId} LIMIT 1;
    `;

    if (!userRows || userRows.length === 0) {
      res.json({ success: true, data: null });
      return;
    }

    const user = userRows[0];
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar || "<>",
        color: user.color || "#3b82f6",
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Usuário não autenticado." });
      return;
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || "Dados inválidos.",
      });
      return;
    }

    const { name, avatar, color, currentPassword, newPassword } = parsed.data;

    const userRows = await prisma.$queryRaw<Array<{ id: string; username: string; password: string; name: string | null; avatar: string | null; color: string | null }>>`
      SELECT id, username, password, name, avatar, color FROM "User" WHERE id = ${req.user.userId} LIMIT 1;
    `;

    if (!userRows || userRows.length === 0) {
      res.status(404).json({ success: false, error: "Usuário não encontrado." });
      return;
    }

    const user = userRows[0];

    if (newPassword && newPassword.trim()) {
      if (!currentPassword) {
        res.status(400).json({ success: false, error: "Informe sua senha atual para alterar a senha." });
        return;
      }

      const isCurrentValid = verifyPassword(currentPassword, user.password);
      if (!isCurrentValid) {
        res.status(400).json({ success: false, error: "A senha atual está incorreta." });
        return;
      }

      const hashedNew = hashPassword(newPassword);
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "password" = $1, "updatedAt" = NOW() WHERE id = $2;`,
        hashedNew,
        user.id
      );
    }

    const updates: string[] = ['"updatedAt" = NOW()'];
    const values: any[] = [user.id];
    let paramIdx = 2;

    if (name !== undefined) {
      updates.push(`"name" = $${paramIdx++}`);
      values.push(name.trim() || user.username);
    }

    if (avatar !== undefined) {
      updates.push(`"avatar" = $${paramIdx++}`);
      values.push(avatar.trim() || "<>");
    }

    if (color !== undefined) {
      updates.push(`"color" = $${paramIdx++}`);
      values.push(color.trim() || "#3b82f6");
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET ${updates.join(", ")} WHERE id = $1;`,
      ...values
    );

    const updatedUser = {
      id: user.id,
      username: user.username,
      name: name !== undefined ? (name.trim() || user.username) : user.name,
      avatar: avatar !== undefined ? (avatar.trim() || "<>") : (user.avatar || "<>"),
      color: color !== undefined ? (color.trim() || "#3b82f6") : (user.color || "#3b82f6"),
    };

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.json({ success: true, data: null });
}
