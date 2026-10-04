import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { loadSavedTheme, applyThemeToDocument } from './lib/theme';

// Initialize custom theme variables
applyThemeToDocument(loadSavedTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

