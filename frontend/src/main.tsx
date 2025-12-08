/**
 * MAIN ENTRY POINT
 * 
 * LEARNING: This is where React app starts
 * 
 * ReactDOM.createRoot:
 * - Creates a React root
 * - Mounts the app to the DOM
 * - Uses React 18's concurrent features
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { PresenceProvider } from './contexts/PresenceContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PresenceProvider>
    <App />
    </PresenceProvider>
  </React.StrictMode>
);

/**
 * LEARNING: React.StrictMode
 * 
 * WHY?
 * - Highlights potential problems in the app
 * - Activates additional checks and warnings
 * - Only runs in development mode
 * - Components render twice to catch side effects
 * 
 * WHAT IT CHECKS:
 * - Unsafe lifecycle methods
 * - Legacy string ref API usage
 * - Deprecated findDOMNode usage
 * - Unexpected side effects
 * - Legacy context API
 */

