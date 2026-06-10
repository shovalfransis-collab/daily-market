import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { StockDetailWrapper } from './components/StockDetailWrapper';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/stock/:symbol" element={<StockDetailWrapper />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
