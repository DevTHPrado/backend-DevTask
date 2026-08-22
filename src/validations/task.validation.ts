import { z } from "zod";

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "O título é obrigatório").max(120, "O título é muito longo"),
  description: z.string().max(1000, "A descrição é muito longa").optional(),
  status: z.string().default("STANDBY"),
  columnId: z.string().optional().nullable(),
  technologies: z.array(z.string()).default([]),
  frontendTech: z.array(z.string()).default([]),
  backendTech: z.array(z.string()).default([]),
  databaseTech: z.array(z.string()).default([]),
  projectIds: z.array(z.string()).min(1, "Selecione pelo menos um projeto"),
});

export const UpdateTaskSchema = z.object({
  id: z.string().min(1, "ID da tarefa é obrigatório"),
  title: z.string().min(1, "O título é obrigatório").max(120).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.string().optional(),
  columnId: z.string().optional().nullable(),
  order: z.number().int().optional(),
  technologies: z.array(z.string()).optional(),
  frontendTech: z.array(z.string()).optional(),
  backendTech: z.array(z.string()).optional(),
  databaseTech: z.array(z.string()).optional(),
  projectIds: z.array(z.string()).optional(),
});

export const UpdateTaskOrderAndStatusSchema = z.object({
  taskId: z.string().min(1),
  columnId: z.string().optional().nullable(),
  newStatus: z.string().min(1),
  newOrder: z.number().int().min(0),
  orderedTaskIdsInColumn: z.array(z.string()),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type UpdateTaskOrderAndStatusInput = z.infer<typeof UpdateTaskOrderAndStatusSchema>;
