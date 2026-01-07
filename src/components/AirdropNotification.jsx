import React, { useState, useEffect } from 'react';
import './AirdropNotification.css';

const AirdropNotification = ({ isVisible, onClose }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      setCount(0);
      
      // Start counting animation after a delay
      const countTimer = setTimeout(() => {
        const targetCount = 5000;
        const duration = 1500; // 1.5 seconds to count
        const startTime = Date.now();

        const counter = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          setCount(Math.floor(progress * targetCount));

          if (progress === 1) {
            clearInterval(counter);
          }
        }, 16); // ~60fps

        return () => clearInterval(counter);
      }, 200); // Wait 200ms before starting count

      return () => clearTimeout(countTimer);
    } else {
      setShowAnimation(false);
      setCount(0);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="airdrop-notification-overlay">
      <div className="airdrop-notification-container">
        {/* Animated slot machine effect */}
        <div className="airdrop-content">
          {/* Line 1: Amount with counter */}
          <div className={`airdrop-line line1 ${showAnimation ? 'animate-in' : ''}`}>
            <div className="slot-machine counter-text">{count.toLocaleString()} FEFE</div>
          </div>

          {/* Line 2: Token arrival */}
          <div className={`airdrop-line line2 ${showAnimation ? 'animate-in' : ''}`}>
            <div className="slot-machine">$FEFE has arrived</div>
          </div>

          {/* Line 3: Thank you message */}
          <div className={`airdrop-line line3 ${showAnimation ? 'animate-in' : ''}`}>
            <div className="slot-machine">Thanks for being part of the iiifleche Community</div>
          </div>

          {/* Line 4: Claim button */}
          <div className={`airdrop-line line4 ${showAnimation ? 'animate-in' : ''}`}>
            <button className="claim-button">Claim your FEFE tokens</button>
          </div>

          {/* Close button */}
          <button className="close-button" onClick={onClose}>×</button>
        </div>
      </div>
    </div>
  );
};

export default AirdropNotification;
