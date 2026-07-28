import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
