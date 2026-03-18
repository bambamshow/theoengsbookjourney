import { Router, type IRouter } from "express";
import { db, seriesTable, booksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateSeriesBody, UpdateSeriesBody } from "@workspace/api-zod";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.get("/series", async (_req, res) => {
  try {
    const series = await db.select().from(seriesTable).orderBy(seriesTable.createdAt);
    res.json(series.map(s => ({
      ...s,
      description: s.description ?? null,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/series", requireAdmin, async (req, res) => {
  try {
    const body = CreateSeriesBody.parse(req.body);
    const [series] = await db.insert(seriesTable).values({
      name: body.name,
      description: body.description ?? null,
    }).returning();
    res.status(201).json({
      ...series,
      description: series.description ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: String(err) });
  }
});

router.get("/series/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [series] = await db.select().from(seriesTable).where(eq(seriesTable.id, id));
    if (!series) return res.status(404).json({ error: "Series not found" });
    const books = await db.select().from(booksTable).where(eq(booksTable.seriesId, id));
    res.json({
      ...series,
      description: series.description ?? null,
      books: books.map(b => ({
        ...b,
        review: b.review ?? null,
        rating: b.rating ?? null,
        seriesId: b.seriesId ?? null,
        seriesOrder: b.seriesOrder ?? null,
      })).sort((a, b) => (a.seriesOrder ?? 999) - (b.seriesOrder ?? 999)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/series/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = UpdateSeriesBody.parse(req.body);
    const [series] = await db.update(seriesTable).set({
      name: body.name,
      description: body.description ?? null,
    }).where(eq(seriesTable.id, id)).returning();
    if (!series) return res.status(404).json({ error: "Series not found" });
    res.json({
      ...series,
      description: series.description ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: String(err) });
  }
});

router.delete("/series/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(seriesTable).where(eq(seriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
