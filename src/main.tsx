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

// Google Client ID should be provided via environment variables in production.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
