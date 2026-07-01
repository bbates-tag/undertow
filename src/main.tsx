import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useGame } from './state/store';
import './index.css';

// load save + resume before first paint
useGame.getState().boot();

// dev console handle for testing (not present in production builds)
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__undertow = useGame;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// offline support: cache-first service worker (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // offline caching is a nice-to-have; the game runs fine without it
    });
  });
}
