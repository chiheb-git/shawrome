import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Use NEON_DATABASE_URL if provided (user's external Neon DB), otherwise fall back to Replit's managed DATABASE_URL
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or NEON_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isNeon = connectionString.includes("neon.tech");

export const pool = new Pool({
  connectionString,
  ssl: isNeon ? { rejectUnauthorized: false } : undefined,
  // Neon (plan gratuit) met le calcul en veille apres inactivite ("scale-to-zero").
  // Le reveil peut prendre 15-20s, et le reseau vers certaines regions AWS peut
  // etre instable de facon intermittente, donc on retente automatiquement.
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 10,
});

pool.on("error", (err) => {
  console.error("Erreur inattendue sur une connexion PG inactive:", err.message);
});

export async function queryWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Tentative ${attempt}/${retries} echouee: ${message}`);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

export const db = drizzle(pool, { schema });

export * from "./schema";
