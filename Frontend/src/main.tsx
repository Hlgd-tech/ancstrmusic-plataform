import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Registro del Service Worker para la Progressive Web App (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('PWA Service Worker registrado con éxito:', registration.scope);
      })
      .catch((error) => {
        console.error('Error al registrar el Service Worker de la PWA:', error);
      });
  });
}
