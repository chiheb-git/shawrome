// En production (Cloudflare Pages), il n'y a pas de proxy Vite -> on pointe
// directement vers le backend Render. En dev, le proxy Vite gere deja /api.
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
