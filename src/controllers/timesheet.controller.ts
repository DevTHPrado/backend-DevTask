import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";

export async function getTimeEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.query.projectId as string | undefined;

    const whereClause: any = {
      endedAt: { not: null },
    };

    if (projectId && projectId !== "ALL") {
      whereClause.task = {
        projects: {
          some: { id: projectId },
        },
      };
    }

    const entries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        task: {
          include: {
            projects: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    res.json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
}

export async function deleteTimeEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: "ID do apontamento é obrigatório." });
      return;
    }

    await prisma.timeEntry.delete({
      where: { id: String(id) },
    });

    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}
