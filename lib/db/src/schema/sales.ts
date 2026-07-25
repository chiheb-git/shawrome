import {
  pgTable,
  serial,
  integer,
  doublePrecision,
  timestamp,
  index,
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
}, (table) => [
  index("sales_car_id_idx").on(table.carId),
  index("sales_seller_id_idx").on(table.sellerId),
  index("sales_sold_at_idx").on(table.soldAt),
]);

export const insertSaleSchema = createInsertSchema(salesTable).omit({
  id: true,
  soldAt: true,
});
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
