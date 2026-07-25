import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "./api";

const TOKEN_KEY = "shawrome_client_token";
const PROFILE_KEY = "shawrome_client_profile";

interface ClientProfile {
  id: number;
  name: string;
  email: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: ClientProfile;
}

export async function getClientToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getClientProfile(): Promise<ClientProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clientLogin(name: string, email: string): Promise<ClientProfile> {
  const data = await apiFetch<LoginResponse>("/api/auth/client-login", {
    method: "POST",
    body: JSON.stringify({ name, email }),
  });

  await AsyncStorage.setItem(TOKEN_KEY, data.accessToken);
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(data.user));

  return data.user;
}

export async function clientLogout(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(PROFILE_KEY);
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getClientToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function clearInvalidSession(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(PROFILE_KEY);
}

export async function getFavoriteIds(): Promise<number[]> {
  const token = await getClientToken();
  if (!token) return [];

  try {
    const data = await apiFetch<{ favorites: { carId: number }[] }>(
      "/api/favorites",
      { headers: await authHeaders() },
    );
    return data.favorites.map((f) => f.carId);
  } catch (e) {
    await clearInvalidSession();
    return [];
  }
}

export async function getFavoriteCars() {
  const token = await getClientToken();
  if (!token) return [];

  try {
    const data = await apiFetch<{ favorites: { carId: number; car: any }[] }>(
      "/api/favorites",
      { headers: await authHeaders() },
    );
    return data.favorites.map((f) => f.car);
  } catch (e) {
    await clearInvalidSession();
    return [];
  }
}

export async function addFavorite(carId: number): Promise<void> {
  try {
    await apiFetch("/api/favorites", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ carId }),
    });
  } catch (e) {
    await clearInvalidSession();
    throw new Error("Session expiree, reconnectez-vous");
  }
}

export async function removeFavorite(carId: number): Promise<void> {
  try {
    await apiFetch(`/api/favorites/${carId}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
  } catch (e) {
    await clearInvalidSession();
  }
}
