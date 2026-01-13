// src/components/ui/TrendGrid.jsx
import React from 'react';
import '../BTCChart/styles/TrendGrid.css';

/**
 * TrendGrid Component - Dynamic pattern selection grid
 * Supports 4-pattern (1x4) layout for Insurance Mode
 * and 8-pattern (2x4) layout for Battle/Extreme Modes
 */
const TrendGrid = ({ 
  gameMode, 
  selectedTrend, 
  onTrendSelect, 
  isConnected, 
  hasActiveOrder 
}) => {
  const patterns = gameMode.patterns || [];
  const gridLayout = gameMode.ui?.gridLayout || '2x2';

  // Helper to get candle color class
  const getCandleClass = (direction) => {
    if (direction === 'up') return 'green';
    if (direction === 'down') return 'red';
    return 'blue';
  };

  return (
    <div className="trading-trend-section">
      <div className="trading-trend-label">Select Trend</div>
      
      <div className={`trading-trend-grid grid-${gridLayout}`}>
        {patterns.map((pattern) => (
          <button
            key={pattern.code}
            className={`trend-button trend-${pattern.type} ${
              selectedTrend === pattern.code ? 'selected' : ''
            }`}
            onClick={() => pattern.enabled && onTrendSelect(pattern.code)}
            disabled={!pattern.enabled || !isConnected || hasActiveOrder}
            title={!pattern.enabled ? 'Coming soon' : pattern.label}
            style={{ opacity: !isConnected || !pattern.enabled ? 0.5 : 1 }}
          >
            <div className="trend-label">{pattern.label}</div>
            <div className="trend-dots">
              {pattern.dots.map((dot, index) => (
                <span key={index} className={`dot ${getCandleClass(dot)}`}></span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrendGrid;
