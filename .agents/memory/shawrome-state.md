---
name: Shawrome Platform State
description: Current build state, completed work, and what remains for the Shawrome car dealership platform.
---

# Shawrome Platform State

## Completed

### Backend (artifacts/api-server)
- JWT auth middleware in `src/lib/auth.ts` (access 1h / refresh 7d)
- All routes: auth, client, cars, price-history, sales, dashboard, users, favorites, export
- ExcelJS export with 3 sheets (Ventes, Stock, Historique prix)
- Package: bcryptjs, jsonwebtoken, exceljs added to api-server/package.json

### Database (lib/db)
- Schema: users, cars, price_history, sales, favorites tables (with pgEnums)
- Pushed to Replit managed DATABASE_URL
- lib/db/src/index.ts reads NEON_DATABASE_URL || DATABASE_URL
- Seed script at scripts/seed.ts — run with `pnpm --filter @workspace/scripts run seed`
- Seeded: admin@shawrome.dz / admin123, seller@shawrome.dz / seller123, 5 sample cars

### Admin Panel (artifacts/admin-panel at /)
- Design subagent built all 8 pages: login, dashboard, cars, cars/new, cars/:id, price-history, sales, sellers
- Fixed: src/lib/utils.ts now exports `cn` (was missing from design subagent output)
- Fixed: health.ts removed non-existent HealthCheckResponse import
- Both workflows running cleanly

## Outstanding
1. **NEON_DATABASE_URL secret** — user's Neon DB URL optional; app works on Replit managed DB
2. **Seller Portal** — react-vite artifact at /seller/, needs design subagent
3. **Client Mobile App** — expo artifact at /mobile/

## Key decisions
- Photo upload: base64 JSON body stored as text[] in DB (no Cloudinary yet)
- Enums: car_status (available/reserved/sold), car_fuel, car_transmission, car_condition, user_role
- Currency: DZD, labels in French
- DB env var: NEON_DATABASE_URL || DATABASE_URL (Replit managed)

**Why:** Cloudinary integration deferred to keep first build simple; base64 stored directly. Neon DB optional so app works out of box.
