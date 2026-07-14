import { Router, type IRouter } from "express";
import { eq, gte, and, SQL, desc } from "drizzle-orm";
import { db, salesTable, carsTable, usersTable } from "@workspace/db";
import {
  GetAdminDashboardResponse,
  GetSellerDashboardResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function getPeriodStart(
  unit: "day" | "week" | "month" | "year",
): Date {
  const now = new Date();
  switch (unit) {
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
  }
}

async function computePeriodSummary(
  start: Date,
  sellerIdFilter?: number,
) {
  const conditions: SQL[] = [gte(salesTable.soldAt, start)];
  if (sellerIdFilter) conditions.push(eq(salesTable.sellerId, sellerIdFilter));

  const sales = await db
    .select()
    .from(salesTable)
    .where(and(...conditions));

  const totalSales = sales.length;
  const revenue = sales.reduce((s, x) => s + x.finalPrice, 0);
  const profit = sales.reduce((s, x) => s + x.profit, 0);
  const purchaseCost = sales.reduce((s, x) => s + x.purchasePrice, 0);
  const profitPercent = purchaseCost > 0 ? (profit / purchaseCost) * 100 : 0;

  return { sales: totalSales, revenue, profit, profitPercent };
}

router.get(
  "/dashboard/admin",
  requireAuth,
  async (req, res): Promise<void> => {
    if (req.user!.role !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    const allCars = await db.select().from(carsTable);
    const totalCars = allCars.length;
    const availableCars = allCars.filter((c) => c.status === "available").length;
    const reservedCars = allCars.filter((c) => c.status === "reserved").length;
    const soldCars = allCars.filter((c) => c.status === "sold").length;

    const [todayStats, weekStats, monthStats, yearStats] = await Promise.all([
      computePeriodSummary(getPeriodStart("day")),
      computePeriodSummary(getPeriodStart("week")),
      computePeriodSummary(getPeriodStart("month")),
      computePeriodSummary(getPeriodStart("year")),
    ]);

    // Recent sales
    const recentSalesRaw = await db
      .select()
      .from(salesTable)
      .orderBy(desc(salesTable.soldAt))
      .limit(10);

    const cars = await db.select().from(carsTable);
    const sellers = await db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable);
    const carMap = new Map(cars.map((c) => [c.id, c]));
    const sellerMap = new Map(sellers.map((s) => [s.id, s.name]));

    const recentSales = recentSalesRaw.map((sale) => {
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

    // Top sellers
    const allSellers = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.role, "seller"));
    const allSales = await db.select().from(salesTable);
    const { priceHistoryTable } = await import("@workspace/db");
    const allPriceHistory = await db.select().from(priceHistoryTable);

    const topSellers = allSellers.map((u) => {
      const userSales = allSales.filter((s) => s.sellerId === u.id);
      return {
        userId: u.id,
        userName: u.name,
        totalSales: userSales.length,
        totalRevenue: userSales.reduce((s, x) => s + x.finalPrice, 0),
        totalProfit: userSales.reduce((s, x) => s + x.profit, 0),
        carsManaged: allCars.filter((c) => c.sellerId === u.id).length,
        priceDrops: allPriceHistory.filter(
          (h) => h.modifiedBy === u.id && h.newPrice < h.oldPrice,
        ).length,
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json(
      GetAdminDashboardResponse.parse({
        totalCars,
        availableCars,
        reservedCars,
        soldCars,
        todayStats,
        weekStats,
        monthStats,
        yearStats,
        recentSales,
        topSellers,
      }),
    );
  },
);

router.get(
  "/dashboard/seller",
  requireAuth,
  async (req, res): Promise<void> => {
    if (req.user!.role !== "seller" && req.user!.role !== "admin") {
      res.status(403).json({ error: "Seller or admin access required" });
      return;
    }

    const sellerId = req.user!.id;

    const myCars = await db
      .select()
      .from(carsTable)
      .where(eq(carsTable.sellerId, sellerId));

    const [todayStats, weekStats, monthStats] = await Promise.all([
      computePeriodSummary(getPeriodStart("day"), sellerId),
      computePeriodSummary(getPeriodStart("week"), sellerId),
      computePeriodSummary(getPeriodStart("month"), sellerId),
    ]);

    const recentSalesRaw = await db
      .select()
      .from(salesTable)
      .where(eq(salesTable.sellerId, sellerId))
      .orderBy(desc(salesTable.soldAt))
      .limit(5);

    const carMap = new Map(myCars.map((c) => [c.id, c]));

    const recentSales = recentSalesRaw.map((sale) => {
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
        sellerName: req.user!.email,
        soldAt: sale.soldAt,
      };
    });

    res.json(
      GetSellerDashboardResponse.parse({
        myCars: myCars.length,
        availableCars: myCars.filter((c) => c.status === "available").length,
        soldCars: myCars.filter((c) => c.status === "sold").length,
        reservedCars: myCars.filter((c) => c.status === "reserved").length,
        todayStats,
        weekStats,
        monthStats,
        recentSales,
      }),
    );
  },
);

export default router;
