import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './globals.css';
import './ui/theme.css';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import { ToastContainer } from 'react-toastify';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
    <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar />
  </React.StrictMode>
);
