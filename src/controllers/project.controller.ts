import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
} from "../validations/project.validation.js";

export async function getProjects(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawProjects = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        color: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        tasksCount: number | bigint;
        totalDurationSeconds: number | bigint;
      }>
    >`
      SELECT 
        p.id,
        p.name,
        p.color,
        p.description,
        p."createdAt",
        p."updatedAt",
        COUNT(DISTINCT pt."B")::int AS "tasksCount",
        COALESCE(SUM(te."durationSeconds"), 0)::int AS "totalDurationSeconds"
      FROM "Project" p
      LEFT JOIN "_ProjectToTask" pt ON pt."A" = p.id
      LEFT JOIN "Task" t ON t.id = pt."B"
      LEFT JOIN "TimeEntry" te ON te."taskId" = t.id
      GROUP BY p.id
      ORDER BY p."createdAt" ASC;
    `;

    const enrichedProjects = rawProjects.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      description: p.description,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      _count: {
        tasks: Number(p.tasksCount),
      },
      totalDurationSeconds: Number(p.totalDurationSeconds),
    }));

    res.json({ success: true, data: enrichedProjects });
  } catch (error) {
    next(error);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = CreateProjectSchema.parse(req.body);
    const projectId = "proj_" + Date.now();

    await prisma.$executeRawUnsafe(
      `INSERT INTO "Project" ("id", "name", "color", "description", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, NOW(), NOW());`,
      projectId,
      validated.name.trim(),
      validated.color,
      validated.description ? validated.description.trim() : null
    );

    res.status(201).json({ success: true, data: { id: projectId } });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id || req.body.id;
    const validated = UpdateProjectSchema.parse({ ...req.body, id });

    const updates: string[] = ['"updatedAt" = NOW()'];
    const values: any[] = [validated.id];
    let idx = 2;

    if (validated.name !== undefined) {
      updates.push(`"name" = $${idx++}`);
      values.push(validated.name.trim());
    }
    if (validated.color !== undefined) {
      updates.push(`"color" = $${idx++}`);
      values.push(validated.color);
    }
    if (validated.description !== undefined) {
      updates.push(`"description" = $${idx++}`);
      values.push(validated.description ? validated.description.trim() : null);
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "Project" SET ${updates.join(", ")} WHERE "id" = $1;`,
      ...values
    );

    res.json({ success: true, data: { id: validated.id } });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: "ID do projeto é obrigatório." });
      return;
    }

    const projectId = String(id);
    await prisma.$executeRawUnsafe(`DELETE FROM "_ProjectToTask" WHERE "A" = $1;`, projectId);
    await prisma.$executeRawUnsafe(`DELETE FROM "Project" WHERE "id" = $1;`, projectId);

    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}
