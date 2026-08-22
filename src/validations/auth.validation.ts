import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "O usuário deve ter pelo menos 3 caracteres.")
    .max(50, "O usuário deve ter no máximo 50 caracteres.")
    .trim(),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "O usuário deve ter pelo menos 3 caracteres.")
    .max(50, "O usuário deve ter no máximo 50 caracteres.")
    .regex(/^[a-zA-Z0-9_-]+$/, "O usuário só pode conter letras, números, _ ou -.")
    .trim(),
  name: z.string().max(100, "O nome deve ter no máximo 100 caracteres.").optional(),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export const updateProfileSchema = z.object({
  name: z.string().max(100, "O nome deve ter no máximo 100 caracteres.").optional(),
  avatar: z.string().max(20, "Avatar inválido.").optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Cor hex inválida.").optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres.").optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
