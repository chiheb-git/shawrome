import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  LoginBody,
  RefreshTokenBody,
  GetMeResponse,
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
} from "@workspace/api-zod";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  requireAuth,
} from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user || !user.active) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.json(
    LoginResponse.parse({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
      },
    }),
  );
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const parsed = RefreshTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    const accessToken = generateAccessToken({
      id: payload.id,
      email: payload.email,
      role: payload.role,
    });
    res.json(RefreshTokenResponse.parse({ accessToken }));
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.post("/auth/logout", requireAuth, async (_req, res): Promise<void> => {
  res.json(LogoutResponse.parse({ message: "Logged out successfully" }));
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(
    GetMeResponse.parse({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
    }),
  );
});

router.patch("/auth/me/password", requireAuth, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body as Record<string, unknown>;
  if (
    typeof currentPassword !== "string" || !currentPassword ||
    typeof newPassword !== "string" || newPassword.length < 6
  ) {
    res.status(400).json({ error: "currentPassword et newPassword (min 6 caractères) requis" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Mot de passe actuel incorrect" });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db
    .update(usersTable)
    .set({ passwordHash: newHash })
    .where(eq(usersTable.id, user.id));

  res.json({ message: "Mot de passe modifié avec succès" });
});

export default router;
