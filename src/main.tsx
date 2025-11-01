import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import App from './App';
import './index.css';
import './preloader.css';

createRoot(document.getElementById('root')!).render(
      <App />
);

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available; please refresh.');
  },
  onOfflineReady() {
    console.log('App is ready to work offline.');
  },
});
