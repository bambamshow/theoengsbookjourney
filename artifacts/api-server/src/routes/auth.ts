import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/auth/verify", (req, res) => {
  const password = process.env["ADMIN_PASSWORD"];
  if (!password) {
    return res.status(500).json({ error: "Server misconfiguration." });
  }
  const { password: submitted } = req.body as { password?: string };
  if (submitted === password) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: "Incorrect password." });
});

export default router;
