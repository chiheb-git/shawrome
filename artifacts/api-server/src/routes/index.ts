import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import clientRouter from "./client";
import carsRouter from "./cars";
import priceHistoryRouter from "./price-history";
import salesRouter from "./sales";
import dashboardRouter from "./dashboard";
import usersRouter from "./users";
import favoritesRouter from "./favorites";
import exportRouter from "./export";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(clientRouter);
router.use(carsRouter);
router.use(priceHistoryRouter);
router.use(salesRouter);
router.use(dashboardRouter);
router.use(usersRouter);
router.use(favoritesRouter);
router.use(exportRouter);

export default router;
