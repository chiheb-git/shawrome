import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const carStatusEnum = pgEnum("car_status", [
  "available",
  "reserved",
  "sold",
]);
export const carFuelEnum = pgEnum("car_fuel", [
  "essence",
  "diesel",
  "hybride",
  "electrique",
  "gpl",
]);
export const carTransmissionEnum = pgEnum("car_transmission", [
  "manuelle",
  "automatique",
]);
export const carConditionEnum = pgEnum("car_condition", ["neuf", "occasion"]);

export const carsTable = pgTable("cars", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  mileage: integer("mileage").notNull(),
  description: text("description"),
  purchasePrice: doublePrecision("purchase_price").notNull(),
  sellingPrice: doublePrecision("selling_price").notNull(),
  fuel: carFuelEnum("fuel").notNull(),
  transmission: carTransmissionEnum("transmission").notNull(),
  color: text("color").notNull(),
  condition: carConditionEnum("condition").notNull(),
  status: carStatusEnum("status").notNull().default("available"),
  photos: text("photos").array().notNull().default([]),
  sellerId: integer("seller_id")
    .references(() => usersTable.id)
    .notNull(),
  soldAt: timestamp("sold_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCarSchema = createInsertSchema(carsTable).omit({
  id: true,
  createdAt: true,
  soldAt: true,
  status: true,
});
export type InsertCar = z.infer<typeof insertCarSchema>;
export type Car = typeof carsTable.$inferSelect;
