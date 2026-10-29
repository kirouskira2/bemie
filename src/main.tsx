import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  // Desregistrar Service Workers residuais/órfãos para evitar 'no-op fetch handler' no localhost
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {
      // Ignorar erros silenciosamente
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);

