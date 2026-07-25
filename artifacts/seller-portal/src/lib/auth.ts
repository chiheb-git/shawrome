import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "shawrome_seller_token";
const REFRESH_KEY = "shawrome_seller_refresh";

export interface SellerUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  active: boolean;
  createdAt: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function initAuth(): void {
  setAuthTokenGetter(() => getToken());
}

export async function login(email: string, password: string): Promise<SellerUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "Identifiants invalides");
  }

  const data = await res.json();
  const user: SellerUser = data.user;

  // Vérification stricte du rôle : un compte non-seller ne doit jamais
  // accéder à cette interface, même si le login backend a réussi.
  if (user.role !== "seller") {
    throw new Error("Cet espace est réservé aux vendeurs.");
  }

  setToken(data.accessToken);
  setRefreshToken(data.refreshToken);
  return user;
}

export async function getCurrentUser(): Promise<SellerUser | null> {
  const token = getToken();
  if (!token) return null;

  const res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    clearToken();
    return null;
  }

  const user: SellerUser = await res.json();

  if (user.role !== "seller") {
    clearToken();
    return null;
  }

  return user;
}

export function logout(): void {
  clearToken();
  window.location.href = "/login";
}
