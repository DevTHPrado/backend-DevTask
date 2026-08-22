import { Router } from "express";
import {
  getActiveTimer,
  startTimer,
  stopTimer,
} from "../controllers/timer.controller.js";

export const timerRouter = Router();

timerRouter.get("/active", getActiveTimer);
timerRouter.post("/start", startTimer);
timerRouter.post("/stop", stopTimer);
