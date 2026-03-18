import { Router, type IRouter } from "express";
import healthRouter from "./health";
import booksRouter from "./books";
import seriesRouter from "./series";
import commentsRouter from "./comments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(booksRouter);
router.use(seriesRouter);
router.use(commentsRouter);

export default router;
