// Adresse IP locale de ton PC de dev — doit changer si ton reseau change.
// Le telephone (Expo Go) et le PC doivent etre sur le meme Wi-Fi.
const DEV_API_URL = "http://10.195.181.88:3000";

export const API_URL = DEV_API_URL;

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
