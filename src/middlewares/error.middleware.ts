import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Unhandled Error:", err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: err.issues[0]?.message || "Dados de entrada inválidos.",
      issues: err.issues,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: err?.message || "Erro interno do servidor.",
  });
}
