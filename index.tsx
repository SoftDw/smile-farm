
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Note: We are not importing index.css as styles are handled by Tailwind CDN

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
