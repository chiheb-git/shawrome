import { pgTable, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { carsTable } from "./cars";

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  carId: integer("car_id")
    .references(() => carsTable.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("favorites_client_id_idx").on(table.clientId),
  index("favorites_car_id_idx").on(table.carId),
]);

export const insertFavoriteSchema = createInsertSchema(favoritesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favoritesTable.$inferSelect;
