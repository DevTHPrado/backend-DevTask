import { Router } from "express";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";

export const projectRouter = Router();

projectRouter.get("/", getProjects);
projectRouter.post("/", createProject);
projectRouter.put("/:id", updateProject);
projectRouter.delete("/:id", deleteProject);
