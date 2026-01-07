// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BTCChart from './components/BTCChart';
import WinSharePage from './components/WinSharePage';
import AirdropNotification from './components/AirdropNotification';
import useGiftBoxAnimation from './hooks/useGiftBoxAnimation';
import useAirdropAnimation from './hooks/useAirdropAnimation';
//import './App.css';
import './components/BTCChart/styles/index.css';

function App() {
  const [showNotification, setShowNotification] = useState(false);
  const [showGiftBox, setShowGiftBox] = useState(true);
  
  const handleAirdropTrigger = () => {
    triggerAirdrop();
    setShowNotification(true);
    setShowGiftBox(false);
  };

  const { triggerAirdrop } = useAirdropAnimation();
  const giftBoxRef = useGiftBoxAnimation({ onGiftBoxClick: handleAirdropTrigger });

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/win" element={<WinSharePage />} />
        <Route path="/" element={
          <div className="btc-chart-wrapper">
            <AirdropNotification 
              isVisible={showNotification} 
              onClose={() => setShowNotification(false)} 
            />
            {showGiftBox && (
              <div style={{ position: 'fixed', top: '0px', right: '50px', zIndex: 9999, pointerEvents: 'none' }}>
                <div
                  ref={giftBoxRef}
                  style={{
                    pointerEvents: 'auto',
                    width: 'auto',
                    height: 'auto',
                    transform: 'scale(0.25)',
                    transformOrigin: 'top right',
                  }}
                />
                <button
                  onClick={() => setShowGiftBox(false)}
                  className="gift-box-close-button"
                  style={{ pointerEvents: 'auto' }}
                >
                  ×
                </button>
              </div>
            )}
            <BTCChart />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;