// Adresse IP locale de ton PC de dev — doit changer si ton reseau change.
// Le telephone (Expo Go) et le PC doivent etre sur le meme Wi-Fi.
const PROD_API_URL = "https://shawrome.onrender.com";

export const API_URL = PROD_API_URL;

export function apiUrl(path: string): string {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error ?? `Erreur HTTP ${res.status}`);
  }

  return res.json();
}
