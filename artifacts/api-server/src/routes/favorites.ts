import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import {
  db,
  favoritesTable,
  carsTable,
  usersTable,
} from "@workspace/db";
import {
  ListFavoritesResponse,
  AddFavoriteBody,
  AddFavoriteResponse,
  RemoveFavoriteParams,
  RemoveFavoriteResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/favorites", requireAuth, async (req, res): Promise<void> => {
  const userFavorites = await db
    .select()
    .from(favoritesTable)
    .where(eq(favoritesTable.clientId, req.user!.id));

  const carIds = userFavorites.map((f) => f.carId);
  const cars = await db.select().from(carsTable);
  const sellers = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable);

  const carMap = new Map(cars.map((c) => [c.id, c]));
  const sellerMap = new Map(sellers.map((s) => [s.id, s.name]));

  const favorites = userFavorites
    .map((fav) => {
      const car = carMap.get(fav.carId);
      if (!car) return null;
      return {
        id: fav.id,
        carId: fav.carId,
        car: {
          id: car.id,
          brand: car.brand,
          model: car.model,
          year: car.year,
          mileage: car.mileage,
          description: car.description,
          purchasePrice: car.purchasePrice,
          sellingPrice: car.sellingPrice,
          fuel: car.fuel,
          transmission: car.transmission,
          color: car.color,
          condition: car.condition,
          status: car.status,
          photos: car.photos,
          sellerId: car.sellerId,
          sellerName: sellerMap.get(car.sellerId) ?? "Unknown",
          soldAt: car.soldAt,
          createdAt: car.createdAt,
        },
        createdAt: fav.createdAt,
      };
    })
    .filter(Boolean);

  res.json(ListFavoritesResponse.parse({ favorites }));
});

router.post("/favorites", requireAuth, async (req, res): Promise<void> => {
  const parsed = AddFavoriteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { carId } = parsed.data;

  const [car] = await db
    .select()
    .from(carsTable)
    .where(eq(carsTable.id, carId))
    .limit(1);

  if (!car) {
    res.status(404).json({ error: "Car not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(favoritesTable)
    .where(
      and(
        eq(favoritesTable.clientId, req.user!.id),
        eq(favoritesTable.carId, carId),
      ),
    )
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "Already in favorites" });
    return;
  }

  const [fav] = await db
    .insert(favoritesTable)
    .values({ clientId: req.user!.id, carId })
    .returning();

  const sellers = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable);
  const sellerMap = new Map(sellers.map((s) => [s.id, s.name]));

  res.status(201).json(
    AddFavoriteResponse.parse({
      id: fav.id,
      carId: fav.carId,
      car: {
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        mileage: car.mileage,
        description: car.description,
        purchasePrice: car.purchasePrice,
        sellingPrice: car.sellingPrice,
        fuel: car.fuel,
        transmission: car.transmission,
        color: car.color,
        condition: car.condition,
        status: car.status,
        photos: car.photos,
        sellerId: car.sellerId,
        sellerName: sellerMap.get(car.sellerId) ?? "Unknown",
        soldAt: car.soldAt,
        createdAt: car.createdAt,
      },
      createdAt: fav.createdAt,
    }),
  );
});

router.delete(
  "/favorites/:carId",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = RemoveFavoriteParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [deleted] = await db
      .delete(favoritesTable)
      .where(
        and(
          eq(favoritesTable.clientId, req.user!.id),
          eq(favoritesTable.carId, params.data.carId),
        ),
      )
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Favorite not found" });
      return;
    }

    res.json(RemoveFavoriteResponse.parse({ message: "Removed from favorites" }));
  },
);

export default router;
