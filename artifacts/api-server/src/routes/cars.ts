import { Router, type IRouter } from "express";
import { eq, and, gte, lte, ilike, or, SQL } from "drizzle-orm";
import { db, carsTable, usersTable, priceHistoryTable, salesTable } from "@workspace/db";
import {
  ListCarsQueryParams,
  ListCarsResponse,
  CreateCarBody,
  CreateCarResponse,
  GetCarParams,
  GetCarResponse,
  UpdateCarParams,
  UpdateCarBody,
  UpdateCarResponse,
  DeleteCarParams,
  DeleteCarResponse,
  UpdateCarStatusParams,
  UpdateCarStatusBody,
  UpdateCarStatusResponse,
  UpdateCarPriceParams,
  UpdateCarPriceBody,
  UpdateCarPriceResponse,
  UploadCarPhotosParams,
  UploadCarPhotosBody,
  UploadCarPhotosResponse,
  MarkCarAsSoldParams,
  MarkCarAsSoldResponse,
} from "@workspace/api-zod";
import {
  requireAuth,
  requireAdmin,
  requireSellerOrAdmin,
} from "../lib/auth";

const router: IRouter = Router();

async function formatCar(car: typeof carsTable.$inferSelect) {
  const [seller] = await db
    .select({ name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.id, car.sellerId))
    .limit(1);

  return {
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
    sellerName: seller?.name ?? "Unknown",
    soldAt: car.soldAt,
    createdAt: car.createdAt,
  };
}

router.get("/cars", async (req, res): Promise<void> => {
  const parsed = ListCarsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    brand,
    model,
    status,
    fuel,
    transmission,
    condition,
    yearMin,
    yearMax,
    priceMin,
    priceMax,
    mileageMax,
    search,
    sellerId,
    page = 1,
    limit = 20,
  } = parsed.data;

  const conditions: SQL[] = [];

  if (status) conditions.push(eq(carsTable.status, status as "available" | "reserved" | "sold"));
  if (fuel) conditions.push(eq(carsTable.fuel, fuel as "essence" | "diesel" | "hybride" | "electrique" | "gpl"));
  if (transmission) conditions.push(eq(carsTable.transmission, transmission as "manuelle" | "automatique"));
  if (condition) conditions.push(eq(carsTable.condition, condition as "neuf" | "occasion"));
  if (brand) conditions.push(ilike(carsTable.brand, `%${brand}%`));
  if (model) conditions.push(ilike(carsTable.model, `%${model}%`));
  if (yearMin) conditions.push(gte(carsTable.year, yearMin));
  if (yearMax) conditions.push(lte(carsTable.year, yearMax));
  if (priceMin) conditions.push(gte(carsTable.sellingPrice, priceMin));
  if (priceMax) conditions.push(lte(carsTable.sellingPrice, priceMax));
  if (mileageMax) conditions.push(lte(carsTable.mileage, mileageMax));
  if (sellerId) conditions.push(eq(carsTable.sellerId, sellerId));
  if (search) {
    conditions.push(
      or(
        ilike(carsTable.brand, `%${search}%`),
        ilike(carsTable.model, `%${search}%`),
        ilike(carsTable.color, `%${search}%`),
      )!,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const allCars = await db
    .select()
    .from(carsTable)
    .where(whereClause)
    .orderBy(carsTable.createdAt);

  const total = allCars.length;
  const offset = (page - 1) * limit;
  const paginated = allCars.slice(offset, offset + limit);

  const sellerIds = [...new Set(paginated.map((c) => c.sellerId))];
  const sellers = sellerIds.length > 0
    ? await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable)
    : [];
  const sellerMap = new Map(sellers.map((s) => [s.id, s.name]));

  const cars = paginated.map((car) => ({
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
  }));

  res.json(
    ListCarsResponse.parse({ cars, total, page, limit }),
  );
});

router.post("/cars", requireSellerOrAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCarBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sellerId, ...rest } = parsed.data;
  const effectiveSellerId =
    req.user!.role === "admin" && sellerId ? sellerId : req.user!.id;

  const [car] = await db
    .insert(carsTable)
    .values({
      ...rest,
      fuel: rest.fuel as "essence" | "diesel" | "hybride" | "electrique" | "gpl",
      transmission: rest.transmission as "manuelle" | "automatique",
      condition: rest.condition as "neuf" | "occasion",
      sellerId: effectiveSellerId,
    })
    .returning();

  const formatted = await formatCar(car);
  res.status(201).json(CreateCarResponse.parse(formatted));
});

router.get("/cars/:id", async (req, res): Promise<void> => {
  const params = GetCarParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [car] = await db
    .select()
    .from(carsTable)
    .where(eq(carsTable.id, params.data.id))
    .limit(1);

  if (!car) {
    res.status(404).json({ error: "Car not found" });
    return;
  }

  const formatted = await formatCar(car);
  res.json(GetCarResponse.parse(formatted));
});

router.put("/cars/:id", requireSellerOrAdmin, async (req, res): Promise<void> => {
  const params = UpdateCarParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCarBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(carsTable)
    .where(eq(carsTable.id, params.data.id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Car not found" });
    return;
  }

  if (req.user!.role !== "admin" && existing.sellerId !== req.user!.id) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const updateData: Partial<typeof carsTable.$inferInsert> = {};
  const d = parsed.data;
  if (d.brand !== undefined) updateData.brand = d.brand;
  if (d.model !== undefined) updateData.model = d.model;
  if (d.year !== undefined) updateData.year = d.year;
  if (d.mileage !== undefined) updateData.mileage = d.mileage;
  if (d.description !== undefined) updateData.description = d.description;
  if (d.purchasePrice !== undefined) updateData.purchasePrice = d.purchasePrice;
  if (d.sellingPrice !== undefined) updateData.sellingPrice = d.sellingPrice;
  if (d.fuel !== undefined) updateData.fuel = d.fuel as "essence" | "diesel" | "hybride" | "electrique" | "gpl";
  if (d.transmission !== undefined) updateData.transmission = d.transmission as "manuelle" | "automatique";
  if (d.color !== undefined) updateData.color = d.color;
  if (d.condition !== undefined) updateData.condition = d.condition as "neuf" | "occasion";
  if (d.sellerId !== undefined && req.user!.role === "admin") updateData.sellerId = d.sellerId;
  if (d.photos !== undefined) updateData.photos = d.photos;

  const [car] = await db
    .update(carsTable)
    .set(updateData)
    .where(eq(carsTable.id, params.data.id))
    .returning();

  const formatted = await formatCar(car);
  res.json(UpdateCarResponse.parse(formatted));
});

router.delete("/cars/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteCarParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [car] = await db
    .delete(carsTable)
    .where(eq(carsTable.id, params.data.id))
    .returning();

  if (!car) {
    res.status(404).json({ error: "Car not found" });
    return;
  }

  res.json(DeleteCarResponse.parse({ message: "Car deleted" }));
});

router.patch(
  "/cars/:id/status",
  requireSellerOrAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateCarStatusParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateCarStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(carsTable)
      .where(eq(carsTable.id, params.data.id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Car not found" });
      return;
    }

    if (req.user!.role !== "admin" && existing.sellerId !== req.user!.id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const [car] = await db
      .update(carsTable)
      .set({ status: parsed.data.status as "available" | "reserved" | "sold" })
      .where(eq(carsTable.id, params.data.id))
      .returning();

    const formatted = await formatCar(car);
    res.json(UpdateCarStatusResponse.parse(formatted));
  },
);

router.patch(
  "/cars/:id/price",
  requireSellerOrAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateCarPriceParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateCarPriceBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(carsTable)
      .where(eq(carsTable.id, params.data.id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Car not found" });
      return;
    }

    if (req.user!.role !== "admin" && existing.sellerId !== req.user!.id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Log price change to history
    await db.insert(priceHistoryTable).values({
      carId: existing.id,
      oldPrice: existing.sellingPrice,
      newPrice: parsed.data.sellingPrice,
      modifiedBy: req.user!.id,
    });

    const [car] = await db
      .update(carsTable)
      .set({ sellingPrice: parsed.data.sellingPrice })
      .where(eq(carsTable.id, params.data.id))
      .returning();

    const formatted = await formatCar(car);
    res.json(UpdateCarPriceResponse.parse(formatted));
  },
);

router.post(
  "/cars/:id/photos",
  requireSellerOrAdmin,
  async (req, res): Promise<void> => {
    const params = UploadCarPhotosParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UploadCarPhotosBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(carsTable)
      .where(eq(carsTable.id, params.data.id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Car not found" });
      return;
    }

    const newPhotos = [...existing.photos, ...parsed.data.photos];

    await db
      .update(carsTable)
      .set({ photos: newPhotos })
      .where(eq(carsTable.id, params.data.id));

    res.json(UploadCarPhotosResponse.parse({ photos: newPhotos }));
  },
);

router.post(
  "/cars/:id/sell",
  requireSellerOrAdmin,
  async (req, res): Promise<void> => {
    const params = MarkCarAsSoldParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [car] = await db
      .select()
      .from(carsTable)
      .where(eq(carsTable.id, params.data.id))
      .limit(1);

    if (!car) {
      res.status(404).json({ error: "Car not found" });
      return;
    }

    if (car.status === "sold") {
      res.status(400).json({ error: "Car is already sold" });
      return;
    }

    if (req.user!.role !== "admin" && car.sellerId !== req.user!.id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const profit = car.sellingPrice - car.purchasePrice;
    const profitPercent =
      car.purchasePrice > 0 ? (profit / car.purchasePrice) * 100 : 0;

    const now = new Date();

    await db
      .update(carsTable)
      .set({ status: "sold", soldAt: now })
      .where(eq(carsTable.id, car.id));

    const [sale] = await db
      .insert(salesTable)
      .values({
        carId: car.id,
        finalPrice: car.sellingPrice,
        purchasePrice: car.purchasePrice,
        profit,
        profitPercent,
        sellerId: car.sellerId,
      })
      .returning();

    const [seller] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, car.sellerId))
      .limit(1);

    res.json(
      MarkCarAsSoldResponse.parse({
        id: sale.id,
        carId: car.id,
        carBrand: car.brand,
        carModel: car.model,
        carYear: car.year,
        finalPrice: sale.finalPrice,
        purchasePrice: sale.purchasePrice,
        profit: sale.profit,
        profitPercent: sale.profitPercent,
        sellerId: car.sellerId,
        sellerName: seller?.name ?? "Unknown",
        soldAt: sale.soldAt,
      }),
    );
  },
);

export default router;
