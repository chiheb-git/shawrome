import { Router, type IRouter } from "express";
import { gte, lte, and, SQL } from "drizzle-orm";
import { db, salesTable, carsTable, usersTable, priceHistoryTable } from "@workspace/db";
import { ExportExcelQueryParams } from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";
import ExcelJS from "exceljs";

const router: IRouter = Router();

const HEADER_COLOR = "FF1E3A5F";
const ALT_ROW_COLOR = "FFF5F5F5";
const TOTAL_COLOR = "FFE8F5E9";
const PROFIT_COLOR = "FF22C55E";
const LOSS_COLOR = "FFEF4444";
const WHITE = "FFFFFFFF";

function styleHeader(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  sheet.columns.forEach((_col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.font = { bold: true, color: { argb: WHITE }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_COLOR } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = { bottom: { style: "thin", color: { argb: "FFCCCCCC" } } };
  });
  headerRow.height = 22;
}

function altRow(row: ExcelJS.Row, idx: number) {
  if (idx % 2 === 1) {
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ALT_ROW_COLOR } };
    });
  }
}

function totalRow(sheet: ExcelJS.Worksheet, values: Record<string, unknown>): ExcelJS.Row {
  const row = sheet.addRow(values);
  row.font = { bold: true };
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_COLOR } };
    cell.border = { top: { style: "thin", color: { argb: "FF22C55E" } } };
  });
  return row;
}

router.get("/export/excel", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ExportExcelQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { from, to } = parsed.data;

  const dateConditions: SQL[] = [];
  if (from) dateConditions.push(gte(salesTable.soldAt, new Date(from)));
  if (to) dateConditions.push(lte(salesTable.soldAt, new Date(to)));

  const [sales, cars, users, priceHistory] = await Promise.all([
    db
      .select()
      .from(salesTable)
      .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
      .orderBy(salesTable.soldAt),
    db.select().from(carsTable),
    db.select().from(usersTable),
    db.select().from(priceHistoryTable).orderBy(priceHistoryTable.createdAt),
  ]);

  const carMap = new Map(cars.map((c) => [c.id, c]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Shawrome Platform";
  workbook.created = new Date();

  // ── Sheet 1: Ventes ──────────────────────────────────────────────────────
  const salesSheet = workbook.addWorksheet("Ventes");
  salesSheet.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Date", key: "date", width: 18 },
    { header: "Marque", key: "brand", width: 15 },
    { header: "Modèle", key: "model", width: 18 },
    { header: "Année", key: "year", width: 10 },
    { header: "Prix d'achat (DZD)", key: "purchase", width: 22 },
    { header: "Prix de vente (DZD)", key: "final", width: 22 },
    { header: "Profit (DZD)", key: "profit", width: 18 },
    { header: "Profit (%)", key: "pct", width: 12 },
    { header: "Vendeur", key: "seller", width: 20 },
  ];
  styleHeader(salesSheet);

  sales.forEach((sale, idx) => {
    const car = carMap.get(sale.carId);
    const seller = userMap.get(sale.sellerId);
    const row = salesSheet.addRow({
      id: sale.id,
      date: new Date(sale.soldAt).toLocaleDateString("fr-DZ"),
      brand: car?.brand ?? "-",
      model: car?.model ?? "-",
      year: car?.year ?? "-",
      purchase: sale.purchasePrice,
      final: sale.finalPrice,
      profit: sale.profit,
      pct: `${sale.profitPercent.toFixed(1)}%`,
      seller: seller?.name ?? "-",
    });
    altRow(row, idx);
    const profitCell = row.getCell("profit");
    profitCell.font = { color: { argb: sale.profit >= 0 ? PROFIT_COLOR : LOSS_COLOR }, bold: true };
  });

  totalRow(salesSheet, {
    id: "TOTAL",
    date: "",
    brand: "",
    model: "",
    year: "",
    purchase: sales.reduce((s, x) => s + x.purchasePrice, 0),
    final: sales.reduce((s, x) => s + x.finalPrice, 0),
    profit: sales.reduce((s, x) => s + x.profit, 0),
    pct: "",
    seller: `${sales.length} vente(s)`,
  });

  // ── Sheet 2: Profit / Perte ───────────────────────────────────────────────
  const plSheet = workbook.addWorksheet("Profit-Perte");
  plSheet.columns = [
    { header: "ID Vente", key: "id", width: 10 },
    { header: "Date", key: "date", width: 16 },
    { header: "Véhicule", key: "car", width: 28 },
    { header: "Vendeur", key: "seller", width: 20 },
    { header: "Prix achat (DZD)", key: "purchase", width: 20 },
    { header: "Prix vente (DZD)", key: "final", width: 20 },
    { header: "Profit brut (DZD)", key: "profit", width: 20 },
    { header: "Marge (%)", key: "pct", width: 12 },
    { header: "Résultat", key: "result", width: 12 },
  ];
  styleHeader(plSheet);

  const totalPurchase = sales.reduce((s, x) => s + x.purchasePrice, 0);
  const totalFinal = sales.reduce((s, x) => s + x.finalPrice, 0);
  const totalProfit = sales.reduce((s, x) => s + x.profit, 0);
  const overallPct = totalPurchase > 0 ? (totalProfit / totalPurchase) * 100 : 0;

  sales.forEach((sale, idx) => {
    const car = carMap.get(sale.carId);
    const seller = userMap.get(sale.sellerId);
    const row = plSheet.addRow({
      id: sale.id,
      date: new Date(sale.soldAt).toLocaleDateString("fr-DZ"),
      car: `${car?.brand ?? "-"} ${car?.model ?? "-"} (${car?.year ?? "-"})`,
      seller: seller?.name ?? "-",
      purchase: sale.purchasePrice,
      final: sale.finalPrice,
      profit: sale.profit,
      pct: `${sale.profitPercent.toFixed(1)}%`,
      result: sale.profit >= 0 ? "✅ Profit" : "❌ Perte",
    });
    altRow(row, idx);
    row.getCell("profit").font = { color: { argb: sale.profit >= 0 ? PROFIT_COLOR : LOSS_COLOR }, bold: true };
    row.getCell("result").font = { color: { argb: sale.profit >= 0 ? PROFIT_COLOR : LOSS_COLOR }, bold: true };
  });

  const plTotal = totalRow(plSheet, {
    id: "TOTAL",
    date: "",
    car: `${sales.length} vente(s)`,
    seller: "",
    purchase: totalPurchase,
    final: totalFinal,
    profit: totalProfit,
    pct: `${overallPct.toFixed(1)}%`,
    result: totalProfit >= 0 ? "PROFIT NET" : "PERTE NETTE",
  });
  plTotal.getCell("profit").font = { bold: true, color: { argb: totalProfit >= 0 ? PROFIT_COLOR : LOSS_COLOR } };
  plTotal.getCell("result").font = { bold: true, color: { argb: totalProfit >= 0 ? PROFIT_COLOR : LOSS_COLOR } };

  // ── Sheet 3: Historique des prix ──────────────────────────────────────────
  const priceSheet = workbook.addWorksheet("Historique-Prix");
  priceSheet.columns = [
    { header: "Date", key: "date", width: 18 },
    { header: "Voiture", key: "car", width: 28 },
    { header: "Ancien prix (DZD)", key: "old", width: 20 },
    { header: "Nouveau prix (DZD)", key: "new", width: 20 },
    { header: "Différence (DZD)", key: "diff", width: 20 },
    { header: "Var. %", key: "pct", width: 12 },
    { header: "Modifié par", key: "by", width: 20 },
  ];
  styleHeader(priceSheet);

  let totalDiff = 0;
  priceHistory.forEach((ph, idx) => {
    const car = carMap.get(ph.carId);
    const modifier = userMap.get(ph.modifiedBy);
    const diff = ph.newPrice - ph.oldPrice;
    const pct = ph.oldPrice > 0 ? ((diff / ph.oldPrice) * 100).toFixed(1) : "—";
    totalDiff += diff;
    const row = priceSheet.addRow({
      date: new Date(ph.createdAt).toLocaleDateString("fr-DZ"),
      car: `${car?.brand ?? "-"} ${car?.model ?? "-"} (${car?.year ?? "-"})`,
      old: ph.oldPrice,
      new: ph.newPrice,
      diff,
      pct: `${Number(pct) > 0 ? "+" : ""}${pct}%`,
      by: modifier?.name ?? "-",
    });
    altRow(row, idx);
    const diffCell = row.getCell("diff");
    diffCell.font = { color: { argb: diff >= 0 ? PROFIT_COLOR : LOSS_COLOR }, bold: true };
  });

  totalRow(priceSheet, {
    date: "TOTAL",
    car: `${priceHistory.length} modification(s)`,
    old: "",
    new: "",
    diff: totalDiff,
    pct: "",
    by: "",
  });

  // ── Sheet 4: Stock actuel ─────────────────────────────────────────────────
  const stockSheet = workbook.addWorksheet("Stock-Actuel");
  stockSheet.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Marque", key: "brand", width: 15 },
    { header: "Modèle", key: "model", width: 18 },
    { header: "Année", key: "year", width: 10 },
    { header: "Kilométrage", key: "km", width: 14 },
    { header: "Statut", key: "status", width: 14 },
    { header: "Prix achat (DZD)", key: "purchase", width: 20 },
    { header: "Prix vente (DZD)", key: "selling", width: 20 },
    { header: "Marge Estim. (DZD)", key: "margin", width: 20 },
    { header: "Carburant", key: "fuel", width: 12 },
    { header: "Vendeur", key: "seller", width: 18 },
    { header: "Date ajout", key: "date", width: 14 },
  ];
  styleHeader(stockSheet);

  const STATUS_LABELS: Record<string, string> = {
    available: "Disponible",
    reserved: "Réservé",
    sold: "Vendu",
  };

  let totalStockPurchase = 0;
  let totalStockSelling = 0;
  let totalStockMargin = 0;

  cars.forEach((car, idx) => {
    const seller = userMap.get(car.sellerId);
    const margin = car.sellingPrice - car.purchasePrice;
    totalStockPurchase += car.purchasePrice;
    totalStockSelling += car.sellingPrice;
    totalStockMargin += margin;

    const row = stockSheet.addRow({
      id: car.id,
      brand: car.brand,
      model: car.model,
      year: car.year,
      km: car.mileage.toLocaleString("fr-DZ"),
      status: STATUS_LABELS[car.status] ?? car.status,
      purchase: car.purchasePrice,
      selling: car.sellingPrice,
      margin,
      fuel: car.fuel,
      seller: seller?.name ?? "-",
      date: new Date(car.createdAt).toLocaleDateString("fr-DZ"),
    });
    altRow(row, idx);
    row.getCell("margin").font = { color: { argb: margin >= 0 ? PROFIT_COLOR : LOSS_COLOR } };
  });

  totalRow(stockSheet, {
    id: "TOTAL",
    brand: `${cars.length} véhicule(s)`,
    model: "",
    year: "",
    km: "",
    status: "",
    purchase: totalStockPurchase,
    selling: totalStockSelling,
    margin: totalStockMargin,
    fuel: "",
    seller: "",
    date: "",
  });

  // ── Output ────────────────────────────────────────────────────────────────
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="shawrome-export-${new Date().toISOString().slice(0, 10)}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
});

export default router;
