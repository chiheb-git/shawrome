import { Router, type IRouter } from "express";
import { eq, and, gte, lte, SQL } from "drizzle-orm";
import { db, priceHistoryTable, carsTable, usersTable } from "@workspace/db";
import {
  ListPriceHistoryQueryParams,
  ListPriceHistoryResponse,
  GetCarPriceHistoryParams,
  GetCarPriceHistoryResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function formatHistory(rows: (typeof priceHistoryTable.$inferSelect)[]) {
  if (rows.length === 0) return [];

  const carIds = [...new Set(rows.map((r) => r.carId))];
  const modifierIds = [...new Set(rows.map((r) => r.modifiedBy))];

  const cars = await db
    .select({ id: carsTable.id, brand: carsTable.brand, model: carsTable.model })
    .from(carsTable);
  const modifiers = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable);

  const carMap = new Map(cars.map((c) => [c.id, c]));
  const modMap = new Map(modifiers.map((m) => [m.id, m.name]));

  return rows.map((row) => {
    const car = carMap.get(row.carId);
    return {
      id: row.id,
      carId: row.carId,
      carBrand: car?.brand ?? "Unknown",
      carModel: car?.model ?? "Unknown",
      oldPrice: row.oldPrice,
      newPrice: row.newPrice,
      modifiedBy: row.modifiedBy,
      modifiedByName: modMap.get(row.modifiedBy) ?? "Unknown",
      createdAt: row.createdAt,
    };
  });
}

router.get(
  "/price-history",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = ListPriceHistoryQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { carId, from, to, page = 1, limit = 20 } = parsed.data;
    const conditions: SQL[] = [];

    if (carId) conditions.push(eq(priceHistoryTable.carId, carId));
    if (from) conditions.push(gte(priceHistoryTable.createdAt, new Date(from)));
    if (to) conditions.push(lte(priceHistoryTable.createdAt, new Date(to)));

    const all = await db
      .select()
      .from(priceHistoryTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(priceHistoryTable.createdAt);

    const total = all.length;
    const offset = (page - 1) * limit;
    const paginated = all.slice(offset, offset + limit);

    const history = await formatHistory(paginated);
    res.json(ListPriceHistoryResponse.parse({ history, total }));
  },
);

router.get(
  "/price-history/:carId",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = GetCarPriceHistoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const rows = await db
      .select()
      .from(priceHistoryTable)
      .where(eq(priceHistoryTable.carId, params.data.carId))
      .orderBy(priceHistoryTable.createdAt);

    const history = await formatHistory(rows);
    res.json(GetCarPriceHistoryResponse.parse({ history, total: history.length }));
  },
);

export default router;
