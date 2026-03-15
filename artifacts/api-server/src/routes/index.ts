import { Router, type IRouter } from "express";
import healthRouter from "./health";
import booksRouter from "./books";
import seriesRouter from "./series";

const router: IRouter = Router();

router.use(healthRouter);
router.use(booksRouter);
router.use(seriesRouter);

export default router;
