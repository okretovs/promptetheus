import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { syncService } from './services/sync';

// Register service worker for PWA and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);

        // Start auto-sync service
        syncService.startAutoSync();
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
