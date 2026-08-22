import { Router } from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskOrderAndStatus,
} from "../controllers/task.controller.js";

export const taskRouter = Router();

taskRouter.get("/", getTasks);
taskRouter.post("/", createTask);
taskRouter.put("/reorder", updateTaskOrderAndStatus);
taskRouter.put("/:id", updateTask);
taskRouter.delete("/:id", deleteTask);
