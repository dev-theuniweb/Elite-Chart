// src/components/ui/BattlePassPanel.jsx
import React, { useState, useEffect } from 'react';
import '../BTCChart/styles/BattlePassPanel.css';

/**
 * BattlePassPanel Component - Shows Battle Pass progress and purchase options
 * Only displayed in Battle Mode (GameID: 7)
 */
const BattlePassPanel = ({ 
  currentWinnings = 0, 
  target = 3000,
  activePasses = [],
  onPurchasePass
}) => {
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Calculate progress percentage
  const progress = Math.min((currentWinnings / target) * 100, 100);
  const isTargetReached = currentWinnings >= target;

  // Calculate time until 5:00 AM reset
  useEffect(() => {
    const calculateTimeUntilReset = () => {
      const now = new Date();
      const resetTime = new Date();
      resetTime.setHours(5, 0, 0, 0);
      
      // If current time is past 5 AM, set for tomorrow
      if (now.getHours() >= 5) {
        resetTime.setDate(resetTime.getDate() + 1);
      }
      
      const diff = resetTime - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m`;
    };

    setTimeUntilReset(calculateTimeUntilReset());
    
    // Update every minute
    const interval = setInterval(() => {
      setTimeUntilReset(calculateTimeUntilReset());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const passes = [
    {
      id: 'daily',
      type: 'Daily',
      reward: 500,
      cost: 'TBD',
      icon: '📅'
    },
    {
      id: 'weekly',
      type: 'Weekly',
      reward: 5000,
      cost: 'TBD',
      icon: '📆'
    },
    {
      id: 'monthly',
      type: 'Monthly',
      reward: 50000,
      cost: 'TBD',
      icon: '🗓️'
    }
  ];

  return (
    <div className="battle-pass-panel">
      {/* Header */}
      <div className="battle-pass-header">
        <div className="battle-pass-title">⚔️ Battle Pass</div>
        <div className="battle-pass-timer">
          <span className="timer-label">Resets in:</span>
          <span className="timer-value">{timeUntilReset}</span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="battle-pass-progress-section">
        <div className="progress-info">
          <span className="progress-label">Target Progress</span>
          <span className="progress-values">
            {currentWinnings.toLocaleString()} / {target.toLocaleString()} GMCHIP
          </span>
        </div>
        
        <div className="progress-bar-container">
          <div 
            className={`progress-bar-fill ${isTargetReached ? 'completed' : ''}`}
            style={{ width: `${progress}%` }}
          >
            <span className="progress-percentage">{Math.round(progress)}%</span>
          </div>
        </div>

        {isTargetReached && (
          <div className="progress-complete-badge">
            🏆 Target Reached! Reward Pool Available
          </div>
        )}
      </div>

      {/* Battle Passes */}
      <div className="battle-passes-list">
        <div className="passes-subtitle">Purchase Battle Pass</div>
        
        {passes.map((pass) => {
          const isActive = activePasses.includes(pass.id);
          
          return (
            <div key={pass.id} className={`battle-pass-card ${isActive ? 'active' : ''}`}>
              <div className="pass-icon">{pass.icon}</div>
              <div className="pass-details">
                <div className="pass-type">{pass.type} Pass</div>
                <div className="pass-reward">
                  <span className="reward-amount">{pass.reward.toLocaleString()}</span>
                  <span className="reward-token">GMCHIP</span>
                </div>
              </div>
              <div className="pass-action">
                {isActive ? (
                  <div className="pass-active-badge">✓ Active</div>
                ) : (
                  <button 
                    className="pass-buy-button"
                    onClick={() => onPurchasePass && onPurchasePass(pass.id)}
                    disabled
                  >
                    {pass.cost} FEFE
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reward Pool Info */}
      <div className="battle-pass-reward-info">
        <div className="reward-info-title">💰 Reward Pool</div>
        <div className="reward-info-amount">100,000 FEFE</div>
        <div className="reward-info-description">
          Win 3000 GMCHIP before 5:00 AM to enter reward pool
        </div>
      </div>
    </div>
  );
};

export default BattlePassPanel;
