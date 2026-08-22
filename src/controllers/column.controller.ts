import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import {
  CreateColumnSchema,
  UpdateColumnSchema,
  ReorderColumnsSchema,
} from "../validations/column.validation.js";

export async function getColumns(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let columns = await prisma.$queryRaw<any[]>`
      SELECT id, title, color, "isFinal", "order", "createdAt", "updatedAt" 
      FROM "Column" 
      ORDER BY "order" ASC, "createdAt" ASC;
    `;

    if (!columns || columns.length === 0) {
      const defaultCols = [
        { id: "col_standby", title: "Stand-by", color: "#f59e0b", isFinal: false, order: 0 },
        { id: "col_inprogress", title: "Em Andamento", color: "#3b82f6", isFinal: false, order: 1 },
        { id: "col_finalized", title: "Finalizado", color: "#10b981", isFinal: true, order: 2 },
      ];

      for (const col of defaultCols) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "Column" ("id", "title", "color", "order", "isFinal", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) ON CONFLICT ("id") DO NOTHING;`,
          col.id,
          col.title,
          col.color,
          col.order,
          col.isFinal
        );
      }

      columns = await prisma.$queryRaw<any[]>`
        SELECT id, title, color, "isFinal", "order", "createdAt", "updatedAt" 
        FROM "Column" 
        ORDER BY "order" ASC, "createdAt" ASC;
      `;
    }

    res.json({ success: true, data: columns });
  } catch (error) {
    next(error);
  }
}

export async function createColumn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = CreateColumnSchema.parse(req.body);
    const colId = "col_" + Date.now();

    const maxOrderRows = await prisma.$queryRaw<Array<{ maxOrder: number | null }>>`
      SELECT MAX("order") AS "maxOrder" FROM "Column";
    `;
    const newOrder = validated.order !== undefined ? validated.order : (maxOrderRows[0]?.maxOrder ?? -1) + 1;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "Column" ("id", "title", "color", "isFinal", "order", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW());`,
      colId,
      validated.title.trim(),
      validated.color,
      validated.isFinal ?? false,
      newOrder
    );

    res.status(201).json({ success: true, data: { id: colId } });
  } catch (error) {
    next(error);
  }
}

export async function updateColumn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id || req.body.id;
    const validated = UpdateColumnSchema.parse({ ...req.body, id });

    const updates: string[] = ['"updatedAt" = NOW()'];
    const values: any[] = [validated.id];
    let idx = 2;

    if (validated.title !== undefined) {
      updates.push(`"title" = $${idx++}`);
      values.push(validated.title.trim());
    }
    if (validated.color !== undefined) {
      updates.push(`"color" = $${idx++}`);
      values.push(validated.color);
    }
    if (validated.isFinal !== undefined) {
      updates.push(`"isFinal" = $${idx++}`);
      values.push(validated.isFinal);
    }
    if (validated.order !== undefined) {
      updates.push(`"order" = $${idx++}`);
      values.push(validated.order);
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "Column" SET ${updates.join(", ")} WHERE "id" = $1;`,
      ...values
    );

    res.json({ success: true, data: { id: validated.id } });
  } catch (error) {
    next(error);
  }
}

export async function deleteColumn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, error: "ID da coluna é obrigatório." });
      return;
    }

    const columnId = String(id);
    const otherCols = await prisma.$queryRaw<Array<{ id: string; title: string }>>`
      SELECT id, title FROM "Column" WHERE id != ${columnId} ORDER BY "order" ASC LIMIT 1;
    `;

    if (otherCols && otherCols.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Task" SET "columnId" = $1, "status" = $2 WHERE "columnId" = $3;`,
        otherCols[0].id,
        otherCols[0].title,
        columnId
      );
    }

    await prisma.$executeRawUnsafe(`DELETE FROM "Column" WHERE "id" = $1;`, columnId);

    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}

export async function reorderColumns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = ReorderColumnsSchema.parse(req.body);

    for (let i = 0; i < validated.columnIds.length; i++) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Column" SET "order" = $1, "updatedAt" = NOW() WHERE "id" = $2;`,
        i,
        validated.columnIds[i]
      );
    }

    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}
