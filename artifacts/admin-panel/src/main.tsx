import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';
import App from './App';
import './index.css';

// En production (Cloudflare Pages), il n'y a pas de proxy Vite -> on pointe
// directement vers le backend Render. En dev, le proxy Vite gere deja /api.
const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

createRoot(document.getElementById('root')!).render(<App />);
