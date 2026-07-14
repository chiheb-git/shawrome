import {
  pgTable,
  serial,
  integer,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { carsTable } from "./cars";
import { usersTable } from "./users";

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  carId: integer("car_id")
    .references(() => carsTable.id)
    .notNull(),
  finalPrice: doublePrecision("final_price").notNull(),
  purchasePrice: doublePrecision("purchase_price").notNull(),
  profit: doublePrecision("profit").notNull(),
  profitPercent: doublePrecision("profit_percent").notNull(),
  sellerId: integer("seller_id")
    .references(() => usersTable.id)
    .notNull(),
  soldAt: timestamp("sold_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSaleSchema = createInsertSchema(salesTable).omit({
  id: true,
  soldAt: true,
});
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
