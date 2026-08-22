import { Router } from "express";
import {
  login,
  register,
  getCurrentUser,
  updateProfile,
  logout,
} from "../controllers/auth.controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.post("/logout", logout);
authRouter.get("/me", optionalAuth, getCurrentUser);
authRouter.put("/profile", requireAuth, updateProfile);
