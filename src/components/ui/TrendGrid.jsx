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
  hasActiveOrder,
  payoutData = {}, // Payout multipliers mapped to trend codes (static from API)
  currentPayoutText = null, // Dynamic payout text from OrderUpdate (e.g., "7.1 X × 4.9 X × 3.4")
  insuranceData = { section1: { isInsured: false }, section2: { isInsured: false } } // Insurance status
}) => {
  const patterns = gameMode.patterns || [];
  const gridLayout = gameMode.ui?.gridLayout || '2x2';

  // Helper to get candle color class
  const getCandleClass = (direction) => {
    if (direction === 'up') return 'green';
    if (direction === 'down') return 'red';
    return 'blue';
  };

  // Helper to parse payout string and get correct multiplier based on insurance
  const getPayout = (payoutString) => {
    if (!payoutString) return null;
    
    // Parse format like "7.1 X × 4.9 X × 3.4 X"
    const parts = payoutString.split('×').map(p => p.trim());
    
    if (parts.length >= 3) {
      // Has all 3 values: base, after insurance 1, after insurance 2
      if (insuranceData.section1.isInsured && insuranceData.section2.isInsured) {
        return parts[2].replace(' X', 'X'); // Show 3.4X (both insurances)
      } else if (insuranceData.section1.isInsured) {
        return parts[1].replace(' X', 'X'); // Show 4.9X (insurance 1 only)
      }
      return parts[0].replace(' X', 'X'); // Show 7.1X (no insurance)
    }
    
    // Fallback: return as-is if format is different
    return payoutString;
  };

  // Get payout for selected trend
  const selectedPattern = patterns.find(p => p.code === selectedTrend);
  
  // Use currentPayoutText if available (from active bet with insurance), otherwise use static payoutData
  const rawPayout = currentPayoutText || (selectedPattern ? payoutData[selectedPattern.code] : null);
  const selectedPayout = rawPayout ? getPayout(rawPayout) : null;

  return (
    <div className="trading-trend-section">
      <div className="trading-trend-header">
        <div className="trading-trend-label">Select Trend</div>
        {selectedPayout && (
          <div className="trading-trend-payout">Payout: {selectedPayout}</div>
        )}
      </div>
      
      <div className={`trading-trend-grid grid-${gridLayout}`}>
        {patterns.map((pattern) => {
          // Get payout for this specific pattern
          const patternPayout = payoutData[pattern.code] 
            ? getPayout(payoutData[pattern.code]) 
            : null;
          
          return (
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
              {patternPayout && (
                <div className="trend-payout">{patternPayout}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TrendGrid;
