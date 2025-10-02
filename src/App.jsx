// src/App.jsx
import React from 'react';
import BTCChart from './components/BTCChart';
//import './App.css';
import './components/BTCChart/styles/index.css';

function App() {
  return (
    <div className="btc-chart-wrapper">
      <BTCChart />
    </div>
  );
}

export default App;