import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const password = process.env["ADMIN_PASSWORD"];
  if (!password) {
    return res.status(500).json({ error: "Server misconfiguration: ADMIN_PASSWORD not set." });
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7);
  if (token !== password) {
    return res.status(403).json({ error: "Forbidden: incorrect password." });
  }

  next();
}
