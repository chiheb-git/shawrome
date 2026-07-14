/**
 * Seed script — creates the initial admin user and sample data.
 * Run with: pnpm --filter @workspace/scripts run seed
 */
import { db, usersTable, carsTable, salesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // ── Admin user ────────────────────────────────────────────────
  const [existingAdmin] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, "admin@shawrome.dz"))
    .limit(1);

  if (!existingAdmin) {
    const hash = await bcrypt.hash("admin123", 10);
    const [admin] = await db
      .insert(usersTable)
      .values({
        name: "Admin Shawrome",
        email: "admin@shawrome.dz",
        passwordHash: hash,
        role: "admin",
        active: true,
      })
      .returning();
    console.log("✅ Admin created:", admin.email);
  } else {
    console.log("ℹ️  Admin already exists");
  }

  // ── Seller user ───────────────────────────────────────────────
  const [existingSeller] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, "seller@shawrome.dz"))
    .limit(1);

  let sellerId: number;

  if (!existingSeller) {
    const hash = await bcrypt.hash("seller123", 10);
    const [seller] = await db
      .insert(usersTable)
      .values({
        name: "Karim Benali",
        email: "seller@shawrome.dz",
        passwordHash: hash,
        role: "seller",
        phone: "+213 555 123 456",
        active: true,
      })
      .returning();
    sellerId = seller.id;
    console.log("✅ Seller created:", seller.email);
  } else {
    sellerId = existingSeller.id;
    console.log("ℹ️  Seller already exists");
  }

  // ── Sample cars ───────────────────────────────────────────────
  const existingCars = await db
    .select({ id: carsTable.id })
    .from(carsTable)
    .limit(1);

  if (existingCars.length === 0) {
    const sampleCars = [
      {
        brand: "Toyota",
        model: "Corolla",
        year: 2022,
        mileage: 25000,
        description: "Excellent état, entretien régulier",
        purchasePrice: 2400000,
        sellingPrice: 2900000,
        fuel: "essence" as const,
        transmission: "automatique" as const,
        color: "Blanc Nacré",
        condition: "occasion" as const,
        status: "available" as const,
        photos: [] as string[],
        sellerId,
      },
      {
        brand: "Hyundai",
        model: "Tucson",
        year: 2023,
        mileage: 8000,
        description: "Quasi neuf, garantie constructeur",
        purchasePrice: 4500000,
        sellingPrice: 5200000,
        fuel: "essence" as const,
        transmission: "automatique" as const,
        color: "Gris Métallisé",
        condition: "occasion" as const,
        status: "reserved" as const,
        photos: [] as string[],
        sellerId,
      },
      {
        brand: "Volkswagen",
        model: "Golf 8",
        year: 2023,
        mileage: 5000,
        description: "Première main, full options",
        purchasePrice: 5200000,
        sellingPrice: 6100000,
        fuel: "diesel" as const,
        transmission: "automatique" as const,
        color: "Bleu Marine",
        condition: "neuf" as const,
        status: "available" as const,
        photos: [] as string[],
        sellerId,
      },
      {
        brand: "Renault",
        model: "Clio 5",
        year: 2021,
        mileage: 42000,
        description: "Très bon état général",
        purchasePrice: 1800000,
        sellingPrice: 2200000,
        fuel: "essence" as const,
        transmission: "manuelle" as const,
        color: "Rouge",
        condition: "occasion" as const,
        status: "sold" as const,
        photos: [] as string[],
        sellerId,
        soldAt: new Date("2025-06-15"),
      },
      {
        brand: "Mercedes",
        model: "Classe C",
        year: 2022,
        mileage: 15000,
        description: "Luxe premium, toutes options",
        purchasePrice: 8500000,
        sellingPrice: 9800000,
        fuel: "essence" as const,
        transmission: "automatique" as const,
        color: "Noir",
        condition: "occasion" as const,
        status: "available" as const,
        photos: [] as string[],
        sellerId,
      },
    ];

    const insertedCars = await db
      .insert(carsTable)
      .values(sampleCars)
      .returning();
    console.log(`✅ ${insertedCars.length} sample cars created`);

    // Create a sale for the sold car
    const soldCar = insertedCars.find((c) => c.status === "sold");
    if (soldCar) {
      const profit = soldCar.sellingPrice - soldCar.purchasePrice;
      const profitPercent = (profit / soldCar.purchasePrice) * 100;
      await db.insert(salesTable).values({
        carId: soldCar.id,
        finalPrice: soldCar.sellingPrice,
        purchasePrice: soldCar.purchasePrice,
        profit,
        profitPercent,
        sellerId,
        soldAt: soldCar.soldAt ?? new Date(),
      });
      console.log("✅ Sample sale created");
    }
  } else {
    console.log("ℹ️  Cars already seeded");
  }

  console.log("\n🎉 Seed complete!");
  console.log("   Admin login:  admin@shawrome.dz / admin123");
  console.log("   Seller login: seller@shawrome.dz / seller123");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
