import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "O nome do projeto é obrigatório").max(60, "O nome é muito longo"),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Cor hex inválida"),
  description: z.string().max(500, "A descrição é muito longa").optional(),
});

export const UpdateProjectSchema = z.object({
  id: z.string().min(1, "ID do projeto é obrigatório"),
  name: z.string().min(1).max(60).optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/).optional(),
  description: z.string().max(500).optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
