// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BTCChart from './components/BTCChart';
import WinSharePage from './components/WinSharePage';
import './components/BTCChart/styles/index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/win" element={<WinSharePage />} />
        <Route path="/" element={
          <div className="btc-chart-wrapper">
            <BTCChart />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;