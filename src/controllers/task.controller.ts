import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  UpdateTaskOrderAndStatusSchema,
} from "../validations/task.validation.js";

export async function getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.query.projectId as string | undefined;

    let tasks: any[];
    if (projectId && projectId !== "ALL") {
      tasks = await prisma.$queryRaw<any[]>`
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.order,
          t."technologies",
          t."frontendTech",
          t."backendTech",
          t."databaseTech",
          t."columnId",
          t."createdAt",
          t."updatedAt",
          COALESCE(SUM(te."durationSeconds"), 0)::int AS "totalDurationSeconds"
        FROM "Task" t
        JOIN "_ProjectToTask" pt ON pt."B" = t.id AND pt."A" = ${projectId}
        LEFT JOIN "TimeEntry" te ON te."taskId" = t.id
        GROUP BY t.id
        ORDER BY t.order ASC, t."createdAt" DESC;
      `;
    } else {
      tasks = await prisma.$queryRaw<any[]>`
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.order,
          t."technologies",
          t."frontendTech",
          t."backendTech",
          t."databaseTech",
          t."columnId",
          t."createdAt",
          t."updatedAt",
          COALESCE(SUM(te."durationSeconds"), 0)::int AS "totalDurationSeconds"
        FROM "Task" t
        LEFT JOIN "TimeEntry" te ON te."taskId" = t.id
        GROUP BY t.id
        ORDER BY t.order ASC, t."createdAt" DESC;
      `;
    }

    const taskProjects = await prisma.$queryRaw<
      Array<{ taskId: string; id: string; name: string; color: string; description: string | null }>
    >`
      SELECT pt."B" AS "taskId", p.id, p.name, p.color, p.description
      FROM "Project" p
      JOIN "_ProjectToTask" pt ON pt."A" = p.id;
    `;

    const projectsByTaskId: Record<string, any[]> = {};
    taskProjects.forEach((row) => {
      if (!projectsByTaskId[row.taskId]) {
        projectsByTaskId[row.taskId] = [];
      }
      projectsByTaskId[row.taskId].push({
        id: row.id,
        name: row.name,
        color: row.color,
        description: row.description,
      });
    });

    const enriched = tasks.map((t) => ({
      ...t,
      technologies: Array.isArray(t.technologies) ? t.technologies : [],
      frontendTech: Array.isArray(t.frontendTech) ? t.frontendTech : [],
      backendTech: Array.isArray(t.backendTech) ? t.backendTech : [],
      databaseTech: Array.isArray(t.databaseTech) ? t.databaseTech : [],
      totalDurationSeconds: Number(t.totalDurationSeconds || 0),
      projects: projectsByTaskId[t.id] || [],
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = CreateTaskSchema.parse(req.body);
    const taskId = "task_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    const maxOrderRows = await prisma.$queryRaw<Array<{ maxOrder: number | null }>>`
      SELECT MAX("order") AS "maxOrder" FROM "Task";
    `;

    const newOrder = (maxOrderRows[0]?.maxOrder ?? -1) + 1;

    const frontendTech = validated.frontendTech || [];
    const backendTech = validated.backendTech || [];
    const databaseTech = validated.databaseTech || [];
    const combinedTech = Array.from(
      new Set([...(validated.technologies || []), ...frontendTech, ...backendTech, ...databaseTech])
    );

    await prisma.$executeRawUnsafe(
      `INSERT INTO "Task" ("id", "title", "description", "status", "technologies", "frontendTech", "backendTech", "databaseTech", "columnId", "order", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW());`,
      taskId,
      validated.title.trim(),
      validated.description ? validated.description.trim() : null,
      validated.status,
      combinedTech,
      frontendTech,
      backendTech,
      databaseTech,
      validated.columnId || null,
      newOrder
    );

    for (const pId of validated.projectIds) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "_ProjectToTask" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        pId,
        taskId
      );
    }

    res.status(201).json({ success: true, data: { id: taskId } });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id || req.body.id;
    const validated = UpdateTaskSchema.parse({ ...req.body, id });

    const updates: string[] = ['"updatedAt" = NOW()'];
    const values: any[] = [validated.id];
    let idx = 2;

    if (validated.title !== undefined) {
      updates.push(`"title" = $${idx++}`);
      values.push(validated.title.trim());
    }
    if (validated.description !== undefined) {
      updates.push(`"description" = $${idx++}`);
      values.push(validated.description ? validated.description.trim() : null);
    }
    if (validated.status !== undefined) {
      updates.push(`"status" = $${idx++}`);
      values.push(validated.status);
    }
    if (validated.frontendTech !== undefined) {
      updates.push(`"frontendTech" = $${idx++}`);
      values.push(validated.frontendTech);
    }
    if (validated.backendTech !== undefined) {
      updates.push(`"backendTech" = $${idx++}`);
      values.push(validated.backendTech);
    }
    if (validated.databaseTech !== undefined) {
      updates.push(`"databaseTech" = $${idx++}`);
      values.push(validated.databaseTech);
    }
    if (
      validated.technologies !== undefined ||
      validated.frontendTech !== undefined ||
      validated.backendTech !== undefined ||
      validated.databaseTech !== undefined
    ) {
      const combined = Array.from(
        new Set([
          ...(validated.technologies || []),
          ...(validated.frontendTech || []),
          ...(validated.backendTech || []),
          ...(validated.databaseTech || []),
        ])
      );
      updates.push(`"technologies" = $${idx++}`);
      values.push(combined);
    }
    if (validated.columnId !== undefined) {
      updates.push(`"columnId" = $${idx++}`);
      values.push(validated.columnId || null);
    }
    if (validated.order !== undefined) {
      updates.push(`"order" = $${idx++}`);
      values.push(validated.order);
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "Task" SET ${updates.join(", ")} WHERE "id" = $1;`,
      ...values
    );

    if (validated.projectIds && validated.projectIds.length > 0) {
      await prisma.$executeRawUnsafe(`DELETE FROM "_ProjectToTask" WHERE "B" = $1;`, validated.id);
      for (const pId of validated.projectIds) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "_ProjectToTask" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
          pId,
          validated.id
        );
      }
    }

    res.json({ success: true, data: { id: validated.id } });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: "ID da tarefa é obrigatório." });
      return;
    }

    const taskId = String(id);
    await prisma.$executeRawUnsafe(`DELETE FROM "_ProjectToTask" WHERE "B" = $1;`, taskId);
    await prisma.$executeRawUnsafe(`DELETE FROM "TimeEntry" WHERE "taskId" = $1;`, taskId);
    await prisma.$executeRawUnsafe(`DELETE FROM "Task" WHERE "id" = $1;`, taskId);

    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}

export async function updateTaskOrderAndStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = UpdateTaskOrderAndStatusSchema.parse(req.body);
    const { taskId, columnId, newStatus, newOrder, orderedTaskIdsInColumn } = validated;

    await prisma.$executeRawUnsafe(
      `UPDATE "Task" SET "status" = $1, "columnId" = $2, "order" = $3, "updatedAt" = NOW() WHERE "id" = $4;`,
      newStatus,
      columnId || null,
      newOrder,
      taskId
    );

    for (let i = 0; i < orderedTaskIdsInColumn.length; i++) {
      const id = orderedTaskIdsInColumn[i];
      await prisma.$executeRawUnsafe(
        `UPDATE "Task" SET "order" = $1, "status" = $2, "columnId" = $3, "updatedAt" = NOW() WHERE "id" = $4;`,
        i,
        newStatus,
        columnId || null,
        id
      );
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
