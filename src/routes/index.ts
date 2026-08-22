import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { taskRouter } from "./task.routes.js";
import { projectRouter } from "./project.routes.js";
import { columnRouter } from "./column.routes.js";
import { timerRouter } from "./timer.routes.js";
import { timesheetRouter } from "./timesheet.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/tasks", taskRouter);
apiRouter.use("/projects", projectRouter);
apiRouter.use("/columns", columnRouter);
apiRouter.use("/timer", timerRouter);
apiRouter.use("/timesheet", timesheetRouter);

apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "DevTask Backend API",
    timestamp: new Date().toISOString(),
  });
});
