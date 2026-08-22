import { z } from "zod";

export const CreateColumnSchema = z.object({
  title: z.string().min(1, "O título da coluna é obrigatório").max(40, "Título muito longo"),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Cor hex inválida").default("#3b82f6"),
  isFinal: z.boolean().default(false),
  order: z.number().int().optional(),
});

export const UpdateColumnSchema = z.object({
  id: z.string().min(1, "ID da coluna é obrigatório"),
  title: z.string().min(1).max(40).optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/).optional(),
  isFinal: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const ReorderColumnsSchema = z.object({
  columnIds: z.array(z.string()).min(1),
});

export type CreateColumnInput = z.infer<typeof CreateColumnSchema>;
export type UpdateColumnInput = z.infer<typeof UpdateColumnSchema>;
export type ReorderColumnsInput = z.infer<typeof ReorderColumnsSchema>;
