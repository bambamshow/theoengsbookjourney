import { Router, type IRouter } from "express";
import { db, booksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateBookBody, UpdateBookBody } from "@workspace/api-zod";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.get("/books", async (_req, res) => {
  try {
    const books = await db.select().from(booksTable).orderBy(booksTable.createdAt);
    res.json(books.map(b => ({
      ...b,
      coverUrl: b.coverUrl,
      seriesId: b.seriesId ?? null,
      seriesOrder: b.seriesOrder ?? null,
      review: b.review ?? null,
      rating: b.rating ?? null,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/books", requireAdmin, async (req, res) => {
  try {
    const body = CreateBookBody.parse(req.body);
    const [book] = await db.insert(booksTable).values({
      title: body.title,
      author: body.author,
      coverUrl: body.coverUrl,
      review: body.review ?? null,
      rating: body.rating ?? null,
      seriesId: body.seriesId ?? null,
      seriesOrder: body.seriesOrder ?? null,
    }).returning();
    res.status(201).json({
      ...book,
      review: book.review ?? null,
      rating: book.rating ?? null,
      seriesId: book.seriesId ?? null,
      seriesOrder: book.seriesOrder ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: String(err) });
  }
});

router.get("/books/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [book] = await db.select().from(booksTable).where(eq(booksTable.id, id));
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json({
      ...book,
      review: book.review ?? null,
      rating: book.rating ?? null,
      seriesId: book.seriesId ?? null,
      seriesOrder: book.seriesOrder ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/books/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = UpdateBookBody.parse(req.body);
    const [book] = await db.update(booksTable).set({
      title: body.title,
      author: body.author,
      coverUrl: body.coverUrl,
      review: body.review ?? null,
      rating: body.rating ?? null,
      seriesId: body.seriesId ?? null,
      seriesOrder: body.seriesOrder ?? null,
    }).where(eq(booksTable.id, id)).returning();
    if (!book) return res.status(404).json({ error: "Book not found" });
    res.json({
      ...book,
      review: book.review ?? null,
      rating: book.rating ?? null,
      seriesId: book.seriesId ?? null,
      seriesOrder: book.seriesOrder ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: String(err) });
  }
});

router.delete("/books/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(booksTable).where(eq(booksTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
