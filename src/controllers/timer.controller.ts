import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import {
  StartTimerSchema,
  StopTimerSchema,
} from "../validations/timer.validation.js";

export async function getActiveTimer(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const active = await prisma.timeEntry.findFirst({
      where: { endedAt: null },
      include: {
        task: {
          include: {
            projects: true,
          },
        },
      },
    });

    if (!active) {
      res.json({ success: true, data: null });
      return;
    }

    res.json({
      success: true,
      data: {
        id: active.id,
        taskId: active.taskId,
        startedAt: active.startedAt.toISOString(),
        notes: active.notes,
        task: {
          id: active.task.id,
          title: active.task.title,
          status: active.task.status,
          columnId: active.task.columnId,
          projects: (active.task.projects || []).map((p) => ({
            id: p.id,
            name: p.name,
            color: p.color,
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function startTimer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = StartTimerSchema.parse(req.body);
    const now = new Date();

    const active = await prisma.timeEntry.findFirst({
      where: { endedAt: null },
    });

    if (active) {
      if (active.taskId === validated.taskId) {
        res.json({
          success: true,
          data: {
            id: active.id,
            taskId: active.taskId,
            startedAt: active.startedAt.toISOString(),
          },
        });
        return;
      }

      const elapsed = Math.max(
        0,
        Math.floor((now.getTime() - active.startedAt.getTime()) / 1000)
      );

      await prisma.timeEntry.update({
        where: { id: active.id },
        data: {
          endedAt: now,
          durationSeconds: elapsed,
        },
      });
    }

    const newEntry = await prisma.timeEntry.create({
      data: {
        taskId: validated.taskId,
        startedAt: now,
        endedAt: null,
        durationSeconds: 0,
      },
    });

    const task = await prisma.task.findUnique({
      where: { id: validated.taskId },
    });

    if (task) {
      if (task.status.toLowerCase().includes("stand") || task.status === "STANDBY") {
        const inProgressCol = await prisma.column.findFirst({
          where: {
            OR: [
              { title: { contains: "Andamento", mode: "insensitive" } },
              { isFinal: false, order: 1 },
            ],
          },
        });

        if (inProgressCol) {
          await prisma.task.update({
            where: { id: validated.taskId },
            data: {
              status: inProgressCol.title,
              columnId: inProgressCol.id,
            },
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        id: newEntry.id,
        taskId: validated.taskId,
        startedAt: newEntry.startedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function stopTimer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = StopTimerSchema.parse(req.body || {});
    const now = new Date();

    const active = await prisma.timeEntry.findFirst({
      where: { endedAt: null },
    });

    if (!active) {
      res.status(400).json({ success: false, error: "Nenhum timer ativo encontrado para parar." });
      return;
    }

    const elapsedSeconds = Math.max(
      0,
      Math.floor((now.getTime() - active.startedAt.getTime()) / 1000)
    );

    await prisma.timeEntry.update({
      where: { id: active.id },
      data: {
        endedAt: now,
        durationSeconds: elapsedSeconds,
        notes: validated.notes ? validated.notes.trim() : null,
      },
    });

    res.json({
      success: true,
      data: {
        id: active.id,
        durationSeconds: elapsedSeconds,
      },
    });
  } catch (error) {
    next(error);
  }
}
