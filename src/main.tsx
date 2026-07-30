import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

// Ensure window.fetch assignment safeguard
try {
  if (typeof window !== 'undefined') {
    const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
    let _currentFetch = nativeFetch;
    Object.defineProperty(window, 'fetch', {
      get() {
        return _currentFetch;
      },
      set(fn) {
        _currentFetch = fn;
      },
      configurable: true,
      enumerable: true
    });
  }
} catch {
  // Ignore if fetch descriptor is fixed
}

// Google Client ID — loaded from VITE_GOOGLE_CLIENT_ID environment variable.
// This value is intentionally public and safe to expose to the browser.
// It is NOT the secret — only the Client ID.
const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID as string | undefined;

if (!GOOGLE_CLIENT_ID) {
  // Throw at app startup so the error is immediately visible in the browser console.
  // This prevents silent failure with a fake client ID.
  throw new Error(
    '[StockAI] VITE_GOOGLE_CLIENT_ID is not set. ' +
    'Add it to your .env file (local) and to Vercel Environment Variables (production). ' +
    'Google Sign-In will not work without it.'
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
