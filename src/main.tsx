import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupAI } from './config/ai';

// Initialize AI configuration
setupAI();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);