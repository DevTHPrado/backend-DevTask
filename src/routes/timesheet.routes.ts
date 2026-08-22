import { Router } from "express";
import {
  getTimeEntries,
  deleteTimeEntry,
} from "../controllers/timesheet.controller.js";

export const timesheetRouter = Router();

timesheetRouter.get("/", getTimeEntries);
timesheetRouter.delete("/:id", deleteTimeEntry);
