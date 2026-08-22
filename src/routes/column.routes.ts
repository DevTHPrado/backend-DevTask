import { Router } from "express";
import {
  getColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from "../controllers/column.controller.js";

export const columnRouter = Router();

columnRouter.get("/", getColumns);
columnRouter.post("/", createColumn);
columnRouter.put("/reorder", reorderColumns);
columnRouter.put("/:id", updateColumn);
columnRouter.delete("/:id", deleteColumn);
