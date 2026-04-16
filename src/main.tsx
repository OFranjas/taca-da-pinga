import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './globals.css';
import './ui/theme.css';
import App from './App';
import { Toaster } from '@/components/ui/sonner';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
    <Toaster position="bottom-right" duration={3000} />
  </React.StrictMode>
);
