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

export const priceHistoryTable = pgTable("price_history", {
  id: serial("id").primaryKey(),
  carId: integer("car_id")
    .references(() => carsTable.id, { onDelete: "cascade" })
    .notNull(),
  oldPrice: doublePrecision("old_price").notNull(),
  newPrice: doublePrecision("new_price").notNull(),
  modifiedBy: integer("modified_by")
    .references(() => usersTable.id)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPriceHistorySchema = createInsertSchema(priceHistoryTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistoryTable.$inferSelect;
