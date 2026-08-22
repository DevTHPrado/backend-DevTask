import { z } from "zod";

export const StartTimerSchema = z.object({
  taskId: z.string().min(1, "ID da tarefa é obrigatório"),
});

export const StopTimerSchema = z.object({
  notes: z.string().max(500, "Notas muito longas").optional().nullable(),
});

export type StartTimerInput = z.infer<typeof StartTimerSchema>;
export type StopTimerInput = z.infer<typeof StopTimerSchema>;
