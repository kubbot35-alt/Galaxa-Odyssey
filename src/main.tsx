import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { PlatformProvider } from './platform/PlatformContext';
import { LocaleProvider } from './config/content/locales/LocaleProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlatformProvider>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </PlatformProvider>
  </React.StrictMode>
);
