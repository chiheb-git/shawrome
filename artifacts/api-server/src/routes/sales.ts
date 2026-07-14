import { Router, type IRouter } from "express";
import { eq, and, gte, lte, SQL, sql, desc } from "drizzle-orm";
import { db, salesTable, carsTable, usersTable } from "@workspace/db";
import {
  ListSalesQueryParams,
  ListSalesResponse,
  GetSaleStatsQueryParams,
  GetSaleStatsResponse,
  GetTopCarsQueryParams,
  GetTopCarsResponse,
  GetSellerStatsResponse,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function getPeriodStart(period: string): Date {
  const now = new Date();
  switch (period) {
    case "day":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

router.get("/sales", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListSalesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { period, from, to, sellerId, page = 1, limit = 20 } = parsed.data;
  const conditions: SQL[] = [];

  if (from) conditions.push(gte(salesTable.soldAt, new Date(from)));
  else if (period) conditions.push(gte(salesTable.soldAt, getPeriodStart(period)));
  if (to) conditions.push(lte(salesTable.soldAt, new Date(to)));

  // Sellers can only see their own sales
  if (req.user!.role === "seller") {
    conditions.push(eq(salesTable.sellerId, req.user!.id));
  } else if (sellerId) {
    conditions.push(eq(salesTable.sellerId, sellerId));
  }

  const allSales = await db
    .select()
    .from(salesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(salesTable.soldAt));

  const total = allSales.length;
  const offset = (page - 1) * limit;
  const paginated = allSales.slice(offset, offset + limit);

  const carIds = [...new Set(paginated.map((s) => s.carId))];
  const sellerIds = [...new Set(paginated.map((s) => s.sellerId))];

  const cars = await db.select().from(carsTable);
  const sellers = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);

  const carMap = new Map(cars.map((c) => [c.id, c]));
  const sellerMap = new Map(sellers.map((s) => [s.id, s.name]));

  const sales = paginated.map((sale) => {
    const car = carMap.get(sale.carId);
    return {
      id: sale.id,
      carId: sale.carId,
      carBrand: car?.brand ?? "Unknown",
      carModel: car?.model ?? "Unknown",
      carYear: car?.year ?? 0,
      finalPrice: sale.finalPrice,
      purchasePrice: sale.purchasePrice,
      profit: sale.profit,
      profitPercent: sale.profitPercent,
      sellerId: sale.sellerId,
      sellerName: sellerMap.get(sale.sellerId) ?? "Unknown",
      soldAt: sale.soldAt,
    };
  });

  res.json(ListSalesResponse.parse({ sales, total }));
});

router.get("/sales/stats", requireAuth, async (req, res): Promise<void> => {
  const parsed = GetSaleStatsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { period, sellerId } = parsed.data;
  const periodStart = getPeriodStart(period);
  const conditions: SQL[] = [gte(salesTable.soldAt, periodStart)];

  if (req.user!.role === "seller") {
    conditions.push(eq(salesTable.sellerId, req.user!.id));
  } else if (sellerId) {
    conditions.push(eq(salesTable.sellerId, sellerId));
  }

  const sales = await db
    .select()
    .from(salesTable)
    .where(and(...conditions))
    .orderBy(salesTable.soldAt);

  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.finalPrice, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const totalPurchaseCost = sales.reduce((sum, s) => sum + s.purchasePrice, 0);
  const profitPercent =
    totalPurchaseCost > 0 ? (totalProfit / totalPurchaseCost) * 100 : 0;

  // Build chart data grouped by day/week/month depending on period
  const chartMap = new Map<
    string,
    { revenue: number; profit: number; sales: number }
  >();

  for (const sale of sales) {
    const d = new Date(sale.soldAt);
    let label: string;
    if (period === "day") {
      label = `${d.getHours()}:00`;
    } else if (period === "week") {
      label = d.toLocaleDateString("fr-DZ", { weekday: "short" });
    } else if (period === "month") {
      label = `${d.getDate()}/${d.getMonth() + 1}`;
    } else {
      label = d.toLocaleDateString("fr-DZ", { month: "short" });
    }
    const existing = chartMap.get(label) ?? { revenue: 0, profit: 0, sales: 0 };
    chartMap.set(label, {
      revenue: existing.revenue + sale.finalPrice,
      profit: existing.profit + sale.profit,
      sales: existing.sales + 1,
    });
  }

  const chartData = Array.from(chartMap.entries()).map(([label, data]) => ({
    label,
    ...data,
  }));

  res.json(
    GetSaleStatsResponse.parse({
      period,
      totalSales,
      totalRevenue,
      totalProfit,
      totalPurchaseCost,
      profitPercent,
      chartData,
    }),
  );
});

router.get("/sales/top-cars", requireAdmin, async (req, res): Promise<void> => {
  const parsed = GetTopCarsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { period } = parsed.data;
  const periodStart = getPeriodStart(period);

  const sales = await db
    .select()
    .from(salesTable)
    .where(gte(salesTable.soldAt, periodStart));

  const cars = await db.select().from(carsTable);
  const carMap = new Map(cars.map((c) => [c.id, c]));

  // Aggregate by car model
  const carStats = new Map<
    number,
    { salesCount: number; totalRevenue: number; totalProfit: number }
  >();

  for (const sale of sales) {
    const existing = carStats.get(sale.carId) ?? {
      salesCount: 0,
      totalRevenue: 0,
      totalProfit: 0,
    };
    carStats.set(sale.carId, {
      salesCount: existing.salesCount + 1,
      totalRevenue: existing.totalRevenue + sale.finalPrice,
      totalProfit: existing.totalProfit + sale.profit,
    });
  }

  const topCars = Array.from(carStats.entries())
    .map(([carId, stats]) => {
      const car = carMap.get(carId);
      return {
        carId,
        brand: car?.brand ?? "Unknown",
        model: car?.model ?? "Unknown",
        year: car?.year ?? 0,
        salesCount: stats.salesCount,
        totalRevenue: stats.totalRevenue,
        totalProfit: stats.totalProfit,
      };
    })
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5);

  res.json(GetTopCarsResponse.parse({ topCars }));
});

router.get(
  "/sales/seller-stats",
  requireAdmin,
  async (req, res): Promise<void> => {
    const sales = await db.select().from(salesTable);
    const cars = await db.select().from(carsTable);
    const users = await db.select().from(usersTable).where(eq(usersTable.role, "seller"));
    const priceHistory = await db
      .select()
      .from((await import("@workspace/db")).priceHistoryTable);

    const sellerMap = new Map(users.map((u) => [u.id, u.name]));

    const stats = new Map<
      number,
      {
        totalSales: number;
        totalRevenue: number;
        totalProfit: number;
        carsManaged: number;
        priceDrops: number;
      }
    >();

    for (const user of users) {
      stats.set(user.id, {
        totalSales: 0,
        totalRevenue: 0,
        totalProfit: 0,
        carsManaged: cars.filter((c) => c.sellerId === user.id).length,
        priceDrops: priceHistory.filter(
          (h) => h.modifiedBy === user.id && h.newPrice < h.oldPrice,
        ).length,
      });
    }

    for (const sale of sales) {
      const existing = stats.get(sale.sellerId);
      if (existing) {
        existing.totalSales += 1;
        existing.totalRevenue += sale.finalPrice;
        existing.totalProfit += sale.profit;
      }
    }

    const sellers = Array.from(stats.entries()).map(([userId, s]) => ({
      userId,
      userName: sellerMap.get(userId) ?? "Unknown",
      ...s,
    }));

    res.json(GetSellerStatsResponse.parse({ sellers }));
  },
);

export default router;
