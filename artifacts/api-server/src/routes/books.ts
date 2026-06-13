import { Router, type IRouter } from "express";
import { db, booksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateBookBody, UpdateBookBody } from "@workspace/api-zod";
import { requireAdmin } from "../middleware/auth";
import {
  getNotionBooks,
  getNotionBook,
  createNotionBook,
  updateNotionBook,
  deleteNotionBook,
  isNotionEnabled,
  type NotionBook,
} from "../notion-service";

const router: IRouter = Router();

// Deterministic hash from Notion ID to a small int
function hashNotionId(notionId: string): number {
  let hash = 0;
  for (let i = 0; i < notionId.length; i++) {
    const char = notionId.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash) % 1000000;
}

function mapNotionBook(n: NotionBook): {
  id: number;
  title: string;
  author: string;
  coverUrl: string;
  review: string | null;
  rating: number | null;
  seriesId: number | null;
  seriesOrder: number | null;
  pages: number | null;
  finishedAt: string | null;
  notionId: string | null;
  createdAt: string;
} {
  return {
    id: hashNotionId(n.notionId),
    title: n.title,
    author: n.author,
    coverUrl: n.coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
    review: n.review ?? null,
    rating: n.rating ?? null,
    seriesId: null,
    seriesOrder: null,
    pages: n.pages ?? null,
    finishedAt: n.finishedAt ?? null,
    notionId: n.notionId,
    createdAt: n.createdAt,
  };
}

async function syncNotionBooksToLocal() {
  if (!isNotionEnabled()) return;
  const notionBooks = await getNotionBooks();
  for (const nb of notionBooks) {
    const existing = await db.select().from(booksTable).where(eq(booksTable.notionId, nb.notionId)).limit(1);
    if (existing.length === 0) {
      await db.insert(booksTable).values({
        title: nb.title,
        author: nb.author,
        coverUrl: nb.coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
        review: nb.review ?? null,
        rating: nb.rating ?? null,
        pages: nb.pages ?? null,
        finishedAt: nb.finishedAt ? new Date(nb.finishedAt) : null,
        notionId: nb.notionId,
      });
    } else {
      await db.update(booksTable).set({
        title: nb.title,
        author: nb.author,
        coverUrl: nb.coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
        review: nb.review ?? null,
        rating: nb.rating ?? null,
        pages: nb.pages ?? null,
        finishedAt: nb.finishedAt ? new Date(nb.finishedAt) : null,
      }).where(eq(booksTable.notionId, nb.notionId));
    }
  }
}

router.get("/books", async (_req, res) => {
  try {
    if (isNotionEnabled()) {
      await syncNotionBooksToLocal();
    }
    const books = await db.select().from(booksTable).orderBy(booksTable.createdAt);
    res.json(books.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      coverUrl: b.coverUrl,
      review: b.review ?? null,
      rating: b.rating ?? null,
      seriesId: b.seriesId ?? null,
      seriesOrder: b.seriesOrder ?? null,
      pages: b.pages ?? null,
      finishedAt: b.finishedAt ? b.finishedAt.toISOString() : null,
      notionId: b.notionId ?? null,
      createdAt: b.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/books", requireAdmin, async (req, res) => {
  try {
    const body = CreateBookBody.parse(req.body);
    if (isNotionEnabled()) {
      const nb = await createNotionBook({
        title: body.title,
        author: body.author,
        coverUrl: body.coverUrl,
        review: body.review ?? null,
        rating: body.rating ?? null,
        pages: body.pages ?? null,
        finishedAt: body.finishedAt ? body.finishedAt.toISOString() : null,
      });
      // Sync to local DB
      await db.insert(booksTable).values({
        title: nb.title,
        author: nb.author,
        coverUrl: nb.coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
        review: nb.review ?? null,
        rating: nb.rating ?? null,
        pages: nb.pages ?? null,
        finishedAt: nb.finishedAt ? new Date(nb.finishedAt) : null,
        notionId: nb.notionId,
      });
      return res.status(201).json(mapNotionBook(nb));
    } else {
      const [book] = await db.insert(booksTable).values({
        title: body.title,
        author: body.author,
        coverUrl: body.coverUrl,
        review: body.review ?? null,
        rating: body.rating ?? null,
        seriesId: body.seriesId ?? null,
        seriesOrder: body.seriesOrder ?? null,
        pages: body.pages ?? null,
        finishedAt: body.finishedAt ? new Date(body.finishedAt) : null,
      }).returning();
      return res.status(201).json({
        id: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        review: book.review ?? null,
        rating: book.rating ?? null,
        seriesId: book.seriesId ?? null,
        seriesOrder: book.seriesOrder ?? null,
        pages: book.pages ?? null,
        finishedAt: book.finishedAt ? book.finishedAt.toISOString() : null,
        notionId: book.notionId ?? null,
        createdAt: book.createdAt.toISOString(),
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: String(err) });
  }
});

router.get("/books/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    // Try to get from Notion first (if it's a Notion UUID)
    if (isNotionEnabled() && id.includes("-")) {
      const nb = await getNotionBook(id);
      if (nb) {
        res.json(mapNotionBook(nb));
        return;
      }
    }
    // Fallback to local DB
    const numId = parseInt(id, 10);
    if (!isNaN(numId)) {
      const [book] = await db.select().from(booksTable).where(eq(booksTable.id, numId));
      if (book) {
        res.json({
          id: book.id,
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
          review: book.review ?? null,
          rating: book.rating ?? null,
          seriesId: book.seriesId ?? null,
          seriesOrder: book.seriesOrder ?? null,
          pages: book.pages ?? null,
          finishedAt: book.finishedAt ? book.finishedAt.toISOString() : null,
          notionId: book.notionId ?? null,
          createdAt: book.createdAt.toISOString(),
        });
        return;
      }
    }
    res.status(404).json({ error: "Book not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/books/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const body = UpdateBookBody.parse(req.body);
    if (isNotionEnabled() && id.includes("-")) {
      const nb = await updateNotionBook(id, {
        title: body.title,
        author: body.author,
        coverUrl: body.coverUrl,
        review: body.review ?? null,
        rating: body.rating ?? null,
        pages: body.pages ?? null,
        finishedAt: body.finishedAt ? body.finishedAt.toISOString() : null,
      });
      if (!nb) return res.status(404).json({ error: "Book not found" });
      // Sync to local DB
      await db.update(booksTable).set({
        title: nb.title,
        author: nb.author,
        coverUrl: nb.coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
        review: nb.review ?? null,
        rating: nb.rating ?? null,
        pages: nb.pages ?? null,
        finishedAt: nb.finishedAt ? new Date(nb.finishedAt) : null,
      }).where(eq(booksTable.notionId, nb.notionId));
      return res.json(mapNotionBook(nb));
    }
    // Fallback to local DB
    const numId = parseInt(id, 10);
    const [book] = await db.update(booksTable).set({
      title: body.title,
      author: body.author,
      coverUrl: body.coverUrl,
      review: body.review ?? null,
      rating: body.rating ?? null,
      seriesId: body.seriesId ?? null,
      seriesOrder: body.seriesOrder ?? null,
      pages: body.pages ?? null,
      finishedAt: body.finishedAt ? new Date(body.finishedAt) : null,
    }).where(eq(booksTable.id, numId)).returning();
    if (!book) return res.status(404).json({ error: "Book not found" });
    return res.json({
      id: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      review: book.review ?? null,
      rating: book.rating ?? null,
      seriesId: book.seriesId ?? null,
      seriesOrder: book.seriesOrder ?? null,
      pages: book.pages ?? null,
      finishedAt: book.finishedAt ? book.finishedAt.toISOString() : null,
      notionId: book.notionId ?? null,
      createdAt: book.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: String(err) });
  }
});

router.delete("/books/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    if (isNotionEnabled() && id.includes("-")) {
      await deleteNotionBook(id);
      await db.delete(booksTable).where(eq(booksTable.notionId, id));
      res.status(204).send();
      return;
    }
    const numId = parseInt(id, 10);
    await db.delete(booksTable).where(eq(booksTable.id, numId));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
