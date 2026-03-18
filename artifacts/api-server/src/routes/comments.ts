import { Router, type IRouter } from "express";
import { db, commentsTable, reviewLikesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { CreateCommentBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/books/:id/comments", async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.bookId, bookId))
      .orderBy(commentsTable.createdAt);
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/books/:id/comments", async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    const body = CreateCommentBody.parse(req.body);
    const [comment] = await db
      .insert(commentsTable)
      .values({ bookId, name: body.name, comment: body.comment })
      .returning();
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: String(err) });
  }
});

router.get("/books/:id/likes", async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    const [result] = await db
      .select({ count: count() })
      .from(reviewLikesTable)
      .where(eq(reviewLikesTable.bookId, bookId));
    res.json({ count: result?.count ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/books/:id/like", async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    await db.insert(reviewLikesTable).values({ bookId });
    const [result] = await db
      .select({ count: count() })
      .from(reviewLikesTable)
      .where(eq(reviewLikesTable.bookId, bookId));
    res.json({ count: result?.count ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
