// src/components/BTCChart.jsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import './BTCChart.css';
import './ui/AudioPanel.css';
import bitcoinIcon from '../assets/bitcoin.png';
import * as signalR from '@microsoft/signalr';
import useAudio from '../hooks/useAudio';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faVolumeHigh, 
  faVolumeXmark, 
  faPlay, 
  faPause, 
  faBackwardStep, 
  faForwardStep, 
  faRepeat 
} from '@fortawesome/free-solid-svg-icons';

// Constants
const PADDING = 40;
const LEFT_LABEL_WIDTH = 25;
const RIGHT_LABEL_WIDTH = 100;
const CHART_PADDING_RIGHT = 60;
const INITIAL_PRICE = 113000;
const UPPER_THRESHOLD = 150000;
const LOWER_THRESHOLD = 98000;
const DATA_LENGTH = 60;

// Timeframe configurations
const TIMEFRAME_CONFIG = {
  '1s': { interval: 1000, label: '1 Second', dataPoints: 60 },    // 60 seconds of data
  '15s': { interval: 15000, label: '15 Seconds', dataPoints: 60 }, // 15 minutes of data
  '30s': { interval: 30000, label: '30 Seconds', dataPoints: 60 }, // 30 minutes of data
  '1m': { interval: 60000, label: '1 Minute', dataPoints: 60 }     // 60 minutes of data
};

// Helper function to aggregate data points from raw data to 15s intervals
const aggregateRawTo15s = (rawData) => {
  if (!rawData.length) return [];
  
  const aggregated = [];
  const intervalMs = 15000; // 15 seconds
  
  // Use absolute time alignment - align to 15-second boundaries
  const buckets = new Map();
  
  rawData.forEach(point => {
    // Align to 15-second boundaries (e.g., :00, :15, :30, :45)
    const pointTime = point.time.getTime();
    const bucketStart = Math.floor(pointTime / intervalMs) * intervalMs;
    
    if (!buckets.has(bucketStart)) {
      buckets.set(bucketStart, []);
    }
    buckets.get(bucketStart).push(point);
  });
  
  // Create aggregated 15s points (using last price in each bucket)
  Array.from(buckets.keys()).sort((a, b) => a - b).forEach(bucketStart => {
    const bucketData = buckets.get(bucketStart);
    if (bucketData.length > 0) {
      const lastPoint = bucketData[bucketData.length - 1];
      aggregated.push({
        value: lastPoint.value,
        time: new Date(bucketStart),
        originalPoints: bucketData.length,
        bucketEnd: new Date(bucketStart + intervalMs - 1)
      });
    }
  });
  
  return aggregated;
};

// Helper function to aggregate 15s data to 30s intervals
const aggregate15sTo30s = (data15s) => {
  if (!data15s.length) return [];
  
  const aggregated = [];
  const intervalMs = 30000; // 30 seconds
  
  // Group 15s points into 30s buckets using absolute time alignment
  const buckets = new Map();
  
  data15s.forEach(point => {
    // Align to 30-second boundaries (e.g., :00, :30)
    const pointTime = point.time.getTime();
    const bucketStart = Math.floor(pointTime / intervalMs) * intervalMs;
    
    if (!buckets.has(bucketStart)) {
      buckets.set(bucketStart, []);
    }
    buckets.get(bucketStart).push(point);
  });
  
  // Create aggregated 30s points (using last price in each bucket)
  Array.from(buckets.keys()).sort((a, b) => a - b).forEach(bucketStart => {
    const bucketData = buckets.get(bucketStart);
    if (bucketData.length > 0) {
      const lastPoint = bucketData[bucketData.length - 1];
      aggregated.push({
        value: lastPoint.value,
        time: new Date(bucketStart),
        originalPoints: bucketData.length,
        bucketEnd: new Date(bucketStart + intervalMs - 1)
      });
    }
  });
  
  return aggregated;
};

// Helper function to aggregate 30s data to 1m intervals  
const aggregate30sTo1m = (data30s) => {
  if (!data30s.length) return [];
  
  const aggregated = [];
  const intervalMs = 60000; // 60 seconds (1 minute)
  
  // Group 30s points into 1m buckets using absolute time alignment
  const buckets = new Map();
  
  data30s.forEach(point => {
    // Align to 1-minute boundaries (e.g., :00)
    const pointTime = point.time.getTime();
    const bucketStart = Math.floor(pointTime / intervalMs) * intervalMs;
    
    if (!buckets.has(bucketStart)) {
      buckets.set(bucketStart, []);
    }
    buckets.get(bucketStart).push(point);
  });
  
  // Create aggregated 1m points (using last price in each bucket)
  Array.from(buckets.keys()).sort((a, b) => a - b).forEach(bucketStart => {
    const bucketData = buckets.get(bucketStart);
    if (bucketData.length > 0) {
      const lastPoint = bucketData[bucketData.length - 1];
      aggregated.push({
        value: lastPoint.value,
        time: new Date(bucketStart),
        originalPoints: bucketData.length,
        bucketEnd: new Date(bucketStart + intervalMs - 1)
      });
    }
  });
  
  return aggregated;
};

// Master hierarchical aggregation function
const getHierarchicalData = (rawData, targetTimeframe) => {
  if (!rawData.length) return [];
  
  const config = TIMEFRAME_CONFIG[targetTimeframe];
  if (!config) return [];
  
  switch (targetTimeframe) {
    case '1s':
      // Return raw data directly (last 60 points)
      return rawData.slice(-config.dataPoints);
      
    case '15s':
      // Aggregate raw data to 15s intervals
      const data15s = aggregateRawTo15s(rawData);
      return data15s.slice(-config.dataPoints);
      
    case '30s':
      // Raw → 15s → 30s
      const data15sFor30s = aggregateRawTo15s(rawData);
      const data30s = aggregate15sTo30s(data15sFor30s);
      return data30s.slice(-config.dataPoints);
      
    case '1m':
      // Raw → 15s → 30s → 1m
      const data15sFor1m = aggregateRawTo15s(rawData);
      const data30sFor1m = aggregate15sTo30s(data15sFor1m);
      const data1m = aggregate30sTo1m(data30sFor1m);
      return data1m.slice(-config.dataPoints);
      
    default:
      return rawData.slice(-config.dataPoints);
  }
};

// Pure function outside component
const getSmoothPath = (points) => {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [prevX, prevY] = points[i - 1];
    const [x, y] = points[i];
    const cx = (prevX + x) / 2;
    d += ` Q ${prevX},${prevY} ${cx},${(prevY + y) / 2}`;
  }
  
  // For the last segment, stop the line just before the dot (radius = 4)
  if (points.length > 1) {
    const [prevX, prevY] = points[points.length - 2];
    const [lastX, lastY] = points[points.length - 1];
    
    // Calculate the point that's 4-5 pixels before the dot center
    const dx = lastX - prevX;
    const dy = lastY - prevY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / length;
    const unitY = dy / length;
    
    // Stop the line 5 pixels before the dot center
    const stopX = lastX - unitX * 0;
    const stopY = lastY - unitY * 0;
    
    const cx = (prevX + stopX) / 2;
    d += ` Q ${prevX},${prevY} ${cx},${(prevY + stopY) / 2}`;
    d += ` T ${stopX},${stopY}`;
  }
  
  return d;
};

const formatNumber = (num) =>
  num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const BTCChart = () => {
  // Raw data storage (always 1-second intervals)
  const [rawData, setRawData] = useState(() => 
    Array.from({ length: DATA_LENGTH }, (_, i) => ({
      value: INITIAL_PRICE + Math.random() * 2000,
      time: new Date(Date.now() - (DATA_LENGTH - i) * 1000), // 1-second intervals
    }))
  );

  // Processed data for display (aggregated based on timeframe)
  const [data, setData] = useState(() => 
    Array.from({ length: DATA_LENGTH }, (_, i) => ({
      value: INITIAL_PRICE + Math.random() * 2000,
      time: new Date(Date.now() - (DATA_LENGTH - i) * 1000), // 1-second intervals
    }))
  );

  // State and refs
  const [scrollOffset, setScrollOffset] = useState(0);
  const [chartWidth, setChartWidth] = useState(800);
  const [open1Min, setOpen1Min] = useState(null);
  const [close1Min, setClose1Min] = useState(null);
  
  // Audio system - with error handling
  let audio;
  try {
    audio = useAudio();
  } catch (error) {
    console.error('Error initializing audio:', error);
    audio = {
      hasUserInteracted: false,
      forceEnableInteraction: () => {},
      playBetSound: () => {},
      playWinSound: () => {},
      playLoseSound: () => {},
      stopAllAudio: () => {}
    };
  }
  
  // Playlist data - ordered as requested
  const playlist = [
    { title: "Billionaire", file: "/audio/Billionaire.mp3" },
    { title: "Big Dreams", file: "/audio/Big Dreams.mp3" },
    { title: "Good luck to you", file: "/audio/Good luck to you.mp3" },
    { title: "To the Moon", file: "/audio/To the Moon.mp3" },
    { title: "Sit Back & Relax", file: "/audio/Sit Back & Relax.mp3" }
  ];
  
  // Background music state with playlist support
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [musicCurrentTime, setMusicCurrentTime] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const [isTrackChanging, setIsTrackChanging] = useState(false);
  const backgroundMusicRef = useRef(null);
  
  const intervalRef = useRef(null);
  const chartRef = useRef(null);
  const latestPriceRef = useRef(null);
  const openTimestampRef = useRef(null);
  const signalRConnectionRef = useRef(null);
  const activeBetsRef = useRef([]);
  const isResolvingBetsRef = useRef(false);
  const lastProcessedCandleRef = useRef(null);

  // Add state for result history
  const [resultHistory, setResultHistory] = useState([]);
  
  // Connection status state
  const [connectionStatus, setConnectionStatus] = useState({
    status: 'connecting', // 'connecting', 'connected', 'disconnected', 'fallback'
    message: 'Catching the Bitcoin stream...',
    isUsingFallback: false
  });

  // Dropdown state
  const [showHistory, setShowHistory] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('trends'); // 'trends' or 'bets'

  // Timeframe selection state
  const [selectedTimeframe, setSelectedTimeframe] = useState('1s'); // '1s', '15s', '30s', '1m'

  // Center connection status message state
  const [showCenterConnectionStatus, setShowCenterConnectionStatus] = useState(true);
  const connectionStatusTimeoutRef = useRef(null);

  // Function to add new price data
  const addNewPriceData = useCallback((newPrice) => {
    setRawData(prevRawData => {
      const newDataPoint = {
        value: newPrice,
        time: new Date(),
      };
      
      // Keep last 1000 raw data points to ensure we have enough for all timeframes
      const maxRawDataPoints = 1000;
      const updatedRawData = [...prevRawData, newDataPoint].slice(-maxRawDataPoints);
      
      console.log(`📊 Added new price: ${newPrice}, Raw data length: ${updatedRawData.length}`);
      return updatedRawData;
    });
  }, []);

  // Popup state for bet results
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [popupResult, setPopupResult] = useState(null); // { type: 'win' | 'loss', amount: number, totalWinnings?: number }

  // Betting interface state
  const [balance, setBalance] = useState(2000);
  const [betAmount, setBetAmount] = useState(100);
  const [selectedBet, setSelectedBet] = useState(null); // 'up' or 'down'
  const [activeBets, setActiveBets] = useState([]); // Array to track active bets
  const [bettingHistory, setBettingHistory] = useState([]); // Track betting results

  // Keep ref synchronized with activeBets state
  useEffect(() => {
    activeBetsRef.current = activeBets;
  }, [activeBets]);

  // Background music control functions
  const toggleBackgroundMusic = useCallback(() => {
    if (!backgroundMusicRef.current) return;
    
    if (backgroundMusicEnabled) {
      backgroundMusicRef.current.pause();
      setBackgroundMusicEnabled(false);
      console.log('🎵 Background music paused');
    } else {
      backgroundMusicRef.current.play().then(() => {
        setBackgroundMusicEnabled(true);
        console.log('🎵 Background music started');
      }).catch(error => {
        console.error('🎵 Error playing background music:', error);
      });
    }
  }, [backgroundMusicEnabled]);

  // Playlist navigation functions
  const playNextTrack = useCallback(() => {
    if (isTrackChanging) return; // Prevent rapid clicking
    
    setIsTrackChanging(true);
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    console.log(`🎵 Playing next track: ${playlist[nextIndex].title}`);
    
    // Pause current track immediately
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
    }
    
    // Update track index and reset time
    setCurrentTrackIndex(nextIndex);
    setMusicCurrentTime(0);
    
    // Use a simple timeout instead of complex event handling
    setTimeout(() => {
      if (backgroundMusicEnabled && backgroundMusicRef.current) {
        backgroundMusicRef.current.currentTime = 0;
        backgroundMusicRef.current.play().catch(error => {
          console.error('🎵 Error playing next track:', error);
        });
      }
      setIsTrackChanging(false);
    }, 200); // Short delay to allow audio element to update
  }, [currentTrackIndex, playlist, backgroundMusicEnabled, isTrackChanging]);

  const playPreviousTrack = useCallback(() => {
    if (isTrackChanging) return; // Prevent rapid clicking
    
    setIsTrackChanging(true);
    const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    console.log(`🎵 Playing previous track: ${playlist[prevIndex].title}`);
    
    // Pause current track immediately
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
    }
    
    // Update track index and reset time
    setCurrentTrackIndex(prevIndex);
    setMusicCurrentTime(0);
    
    // Use a simple timeout instead of complex event handling
    setTimeout(() => {
      if (backgroundMusicEnabled && backgroundMusicRef.current) {
        backgroundMusicRef.current.currentTime = 0;
        backgroundMusicRef.current.play().catch(error => {
          console.error('🎵 Error playing previous track:', error);
        });
      }
      setIsTrackChanging(false);
    }, 200); // Short delay to allow audio element to update
  }, [currentTrackIndex, playlist, backgroundMusicEnabled, isTrackChanging]);

  const handleSeek = useCallback((e) => {
    const newTime = parseFloat(e.target.value);
    setMusicCurrentTime(newTime);
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.currentTime = newTime;
    }
  }, []);

  const formatTime = useCallback((seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Betting functions
  const placeBet = (direction) => {
    // Ensure user interaction is detected when placing a bet (for sound effects only)
    if (!audio.hasUserInteracted) {
      console.log('🎵 Enabling audio interaction through bet placement');
      audio.forceEnableInteraction();
    }
    
    // Validation checks
    if (betAmount <= 0 || betAmount > balance) {
      alert(`Invalid bet amount. Please enter an amount between 1 and ${balance}`);
      return;
    }

    if (open1Min === null) {
      alert('Please wait for the current round to start');
      return;
    }

    // Check if user already has an active bet for this round
    const existingBet = activeBets.find(bet => bet.openTimestamp === openTimestampRef.current);
    if (existingBet) {
      alert('You already have a bet placed for this round');
      return;
    }

    // Create new bet
    const newBet = {
      id: Date.now(),
      direction: direction, // 'up' or 'down'
      amount: betAmount,
      openPrice: open1Min,
      openTimestamp: openTimestampRef.current,
      placedAt: new Date()
    };

    // Deduct balance and add bet
    setBalance(prevBalance => prevBalance - betAmount);
    setActiveBets(prevBets => [...prevBets, newBet]);
    setSelectedBet(direction);
    
    // Play bet sound effect
    audio.playBetSound();
    
    // Reset resolution flag when new bet is placed
    isResolvingBetsRef.current = false;

    console.log(`Bet placed: ${direction.toUpperCase()} - Amount: ${betAmount} - Open Price: ${open1Min}`);
  };

  const resolveBets = (finalPrice, trendDirection = null) => {
    console.log(`🎯 resolveBets called with price: ${finalPrice}, trend: ${trendDirection}`);
    
    // Prevent double resolution
    if (isResolvingBetsRef.current) {
      console.log('🚫 Already resolving bets, skipping...');
      return;
    }
    
    // Check if there are active bets before proceeding
    if (activeBetsRef.current.length === 0) {
      console.log('No active bets to resolve');
      return;
    }
    
    // Set flag to prevent double resolution immediately
    isResolvingBetsRef.current = true;
    
    console.log(`🎯 Resolving ${activeBetsRef.current.length} active bets at price ${finalPrice} with trend: ${trendDirection}`);
    const newBettingHistory = [];
    const currentActiveBets = [...activeBetsRef.current]; // Create a copy

    currentActiveBets.forEach(bet => {
      // Use trend direction if provided, otherwise calculate from price change
      let actualDirection;
      if (trendDirection) {
        actualDirection = trendDirection;
      } else {
        const priceChange = finalPrice - bet.openPrice;
        actualDirection = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'same';
      }
      
      let winnings = 0;
      let result = 'loss';

      if (bet.direction === actualDirection && actualDirection !== 'same') {
        // Winner - 1.975x payout (97.5% profit, 2.5% house edge)
        winnings = Math.floor(bet.amount * 1.975);
        result = 'win';
      } else if (actualDirection === 'same') {
        // Tie - return original bet
        winnings = bet.amount;
        result = 'tie';
      }
      // Loss case: winnings = 0, already handled

      console.log(`Bet result: ${bet.direction} → ${actualDirection} = ${result} (winnings: ${winnings})`);

      // Add to betting history
      newBettingHistory.push({
        ...bet,
        closePrice: finalPrice,
        actualTrend: actualDirection, // Add actual trend to betting history
        result: result,
        winnings: winnings,
        payout: winnings - bet.amount,
        resolvedAt: new Date()
      });

      // Add winnings to balance
      if (winnings > 0) {
        setBalance(prevBalance => {
          console.log(`💰 Adding ${winnings} winnings to balance (was: ${prevBalance})`);
          return prevBalance + winnings;
        });
      }
    });

    // Update history - avoid duplicates by checking timestamps
    setBettingHistory(prevHistory => {
      const existingTimestamps = new Set(prevHistory.map(bet => bet.placedAt.getTime()));
      const uniqueNewBets = newBettingHistory.filter(bet => !existingTimestamps.has(bet.placedAt.getTime()));
      return [...uniqueNewBets, ...prevHistory].slice(0, 50);
    });
    
    // Play win/lose sound effects based on results
    const hasWins = newBettingHistory.some(bet => bet.result === 'win');
    const hasLosses = newBettingHistory.some(bet => bet.result === 'loss');
    const hasTies = newBettingHistory.some(bet => bet.result === 'tie');
    
    console.log('🎵 Audio results:', { hasWins, hasLosses, hasTies, results: newBettingHistory.map(b => b.result) });
    
    if (hasWins && hasLosses) {
      // Mixed results - play win sound for any wins
      console.log('🎵 Playing win sound (mixed results)');
      audio.playWinSound();
    } else if (hasWins) {
      // All wins
      console.log('🎵 Playing win sound (all wins)');
      audio.playWinSound();
    } else if (hasLosses) {
      // All losses  
      console.log('🎵 Playing lose sound (all losses)');
      audio.playLoseSound();
    } else if (hasTies) {
      // All ties - play a neutral sound (let's use bet sound)
      console.log('🎵 Playing bet sound (ties)');
      audio.playBetSound();
    } else {
      console.log('🎵 No win/lose sounds to play');
    }
    
    // Show result popup
    if (newBettingHistory.length > 0) {
      const totalWinnings = newBettingHistory.reduce((sum, bet) => sum + (bet.payout > 0 ? bet.payout : 0), 0);
      const totalLosses = Math.abs(newBettingHistory.reduce((sum, bet) => sum + (bet.payout < 0 ? bet.payout : 0), 0));
      
      if (hasWins && !hasLosses) {
        // Pure win
        setPopupResult({
          type: 'win',
          amount: totalWinnings,
          totalWinnings: totalWinnings
        });
      } else if (hasLosses && !hasWins) {
        // Pure loss
        setPopupResult({
          type: 'loss',
          amount: totalLosses
        });
      } else if (hasWins && hasLosses) {
        // Mixed results - show net result
        const netAmount = totalWinnings - totalLosses;
        setPopupResult({
          type: netAmount > 0 ? 'win' : 'loss',
          amount: Math.abs(netAmount),
          totalWinnings: netAmount > 0 ? netAmount : undefined
        });
      }
      
      setShowResultPopup(true);
      
      // Auto-hide popup after 4 seconds
      setTimeout(() => {
        setShowResultPopup(false);
        setPopupResult(null);
      }, 4000);
    }
    
    // Clear active bets
    setActiveBets([]);
    setSelectedBet(null);
    
    // Reset flag after processing is complete
    setTimeout(() => {
      isResolvingBetsRef.current = false;
      console.log('🔓 Reset bet resolution flag');
    }, 2000); // Longer delay to prevent rapid successive calls
  };

  // Derived constants with dynamic length based on timeframe
  const currentConfig = TIMEFRAME_CONFIG[selectedTimeframe];
  const width = chartWidth;
  const height = 300;
  const centerY = height / 2;

  const latest = data[data.length - 1];
  const prev = data[data.length - 2] || latest;

  // Prevent rendering if data is empty or invalid
  if (!data.length || !latest || !latest.value || isNaN(latest.value)) {
    return (
      <div className="btc-chart-container" ref={chartRef}>
        <div style={{ color: "#fff", padding: 32 }}>Waiting for price updates...</div>
      </div>
    );
  }

  // Memoized calculations
  const pointSpacing = useMemo(() => (
    (width - LEFT_LABEL_WIDTH - RIGHT_LABEL_WIDTH) / (data.length - 1)
  ), [width, data.length]);

  const values = useMemo(() => data.map(d => d.value), [data]);
  let min = useMemo(() => Math.min(...values), [values]);
  let max = useMemo(() => Math.max(...values), [values]);

  // Aggressive dynamic Y-axis scaling to match 1s chart visibility
  const originalRange = max - min;
  
  // Much more aggressive scaling based on timeframe
  let targetRange;
  switch (selectedTimeframe) {
    case '1s':
      targetRange = Math.max(originalRange, 30); // Keep 1s as is
      break;
    case '15s':
      targetRange = Math.max(originalRange, 100); // Force minimum $100 range
      break;
    case '30s':
      targetRange = Math.max(originalRange, 150); // Force minimum $150 range
      break;
    case '1m':
      targetRange = Math.max(originalRange, 200); // Force minimum $200 range
      break;
    default:
      targetRange = Math.max(originalRange, 100);
  }
  
  // If we need to expand the range, do it around the center
  if (targetRange > originalRange) {
    const mid = (max + min) / 2;
    min = mid - targetRange / 2;
    max = mid + targetRange / 2;
  } else {
    // For larger ranges, add 20% padding to make movements dramatic
    const paddingPercent = 0.2;
    const padding = originalRange * paddingPercent;
    min = min - padding;
    max = max + padding;
  }

  const yRange = useMemo(() => max - min || 1, [min, max]);

  const scaleY = useCallback(val => {
    // Auto scaling: use actual data range
    const normalizedValue = (val - min) / yRange;
    const y = PADDING + (1 - normalizedValue) * (height - PADDING * 2);
    return Math.max(PADDING, Math.min(height - PADDING, y));
  }, [min, max, yRange, height]);

  const scaleX = useCallback(i => (
    (i / (data.length - 1)) * (width - LEFT_LABEL_WIDTH - RIGHT_LABEL_WIDTH) +
    LEFT_LABEL_WIDTH - scrollOffset
  ), [data.length, width, scrollOffset]);

  const latestX = useMemo(() => (
    width - RIGHT_LABEL_WIDTH / 2 - CHART_PADDING_RIGHT
  ), [width]);

  // Chart points
  const points = useMemo(() => {
    const pts = data.map((d, i) => [scaleX(i), scaleY(d.value)]);
    if (pts.length > 1) pts[pts.length - 1][0] = latestX;
    return pts;
  }, [data, scaleX, scaleY, latestX]);

  const smoothLinePath = useMemo(() => getSmoothPath(points), [points]);
  const fillPath = useMemo(() => (
    points.length > 0
      ? `${smoothLinePath} L ${points[points.length - 1][0]},${height - PADDING} L ${points[0][0]},${height - PADDING} Z`
      : ''
  ), [smoothLinePath, points, height]);

  // Labels
  const yLabels = useMemo(() => {
    const labels = [];
    const steps = 4; // number of intervals between top and bottom
    
    for (let i = 0; i <= steps; i++) {
      const y = PADDING + ((height - PADDING * 2) * i) / steps;
      // Auto scaling labels
      const value = max - (i / steps) * yRange;
      labels.push({ value, y });
    }
    return labels;
  }, [min, max, yRange, height]);

  // Direction calculations
  const { isUp, isDown, directionColor, arrow, directionClass, formattedPercentChange } = useMemo(() => {
    const isUpFlag = open1Min !== null ? latest.value > open1Min : false;
    const isDownFlag = open1Min !== null ? latest.value < open1Min : false;
    const percentChange = open1Min !== null 
      ? ((latest.value - open1Min) / open1Min) * 100 
      : 0;
      
    return {
      isUp: isUpFlag,
      isDown: isDownFlag,
      directionColor: isUpFlag ? '#5acc6d' : isDownFlag ? '#ff4c3e' : '#76a8e5',
      arrow: isUpFlag ? '▲' : isDownFlag ? '▼' : '',
      directionClass: isUpFlag ? 'up' : isDownFlag ? 'down' : 'same',
      formattedPercentChange: percentChange >= 0
        ? `+${percentChange.toFixed(4)}%`
        : `${percentChange.toFixed(4)}%`
    };
  }, [open1Min, latest.value]);

  // Threshold alerts
  const alertMessage = useMemo(() => {
    if (latest.value >= UPPER_THRESHOLD) return '🚨 Price exceeds upper threshold!';
    if (latest.value <= LOWER_THRESHOLD) return '⚠️ Price dropped below lower threshold!';
    return null;
  }, [latest.value]);

  // Open price position
  const openY = useMemo(() => {
    if (open1Min === null) return null;
    return scaleY(open1Min);
  }, [open1Min, scaleY]);

  // Effects
  
  // Aggregate data when timeframe changes using hierarchical system
  useEffect(() => {
    const config = TIMEFRAME_CONFIG[selectedTimeframe];
    if (!config || !rawData.length) return;
    
    console.log(`📊 Using hierarchical aggregation for timeframe: ${selectedTimeframe} (${config.label})`);
    
    // Use the new hierarchical aggregation system
    const newData = getHierarchicalData(rawData, selectedTimeframe);
    
    setData(newData);
    console.log(`📊 Chart now showing ${newData.length} data points for ${selectedTimeframe} timeframe (hierarchical)`);
    
    // Debug logging for alignment verification
    if (newData.length > 0) {
      console.log(`📊 First point: ${newData[0].value} at ${newData[0].time.toLocaleTimeString()}`);
      if (newData.length > 1) {
        console.log(`📊 Second point: ${newData[1].value} at ${newData[1].time.toLocaleTimeString()}`);
      }
    }
  }, [selectedTimeframe, rawData]);

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        setChartWidth(chartRef.current.offsetWidth);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    latestPriceRef.current = latest.value;
  }, [latest.value]);

  // Setup background music
  useEffect(() => {
    const audioElement = backgroundMusicRef.current;
    if (audioElement) {
      audioElement.volume = 0.3; // Fixed volume at 30%
      
      // Handle time updates
      const handleTimeUpdate = () => {
        setMusicCurrentTime(audioElement.currentTime);
      };
      
      // Handle duration change
      const handleLoadedMetadata = () => {
        setMusicDuration(audioElement.duration);
      };
      
      // Handle ended event - auto-play next track
      const handleEnded = () => {
        console.log('🎵 Track ended, playing next...');
        playNextTrack();
      };
      
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.addEventListener('ended', handleEnded);
      
      return () => {
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [playNextTrack]);

  // Handle track changes
  useEffect(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.load(); // Reload the audio element with new source
      setMusicCurrentTime(0);
      setMusicDuration(0);
    }
  }, [currentTrackIndex]);

  useEffect(() => {
    if (open1Min === null && data.length > 0) {
      setOpen1Min(data[data.length - 1].value);
      openTimestampRef.current = new Date();
    }
  }, [open1Min, data]);

  useEffect(() => {
    if (open1Min !== null && close1Min === null) {
      // Use the current timeframe interval for betting resolution
      const currentConfig = TIMEFRAME_CONFIG[selectedTimeframe];
      const bettingInterval = currentConfig ? currentConfig.interval * 60 : 60000; // 60 intervals for betting period
      
      console.log(`🎯 Setting betting timer for ${bettingInterval}ms (${selectedTimeframe} timeframe)`);
      
      const timer = setTimeout(() => {
        const finalPrice = latestPriceRef.current;
        setClose1Min(finalPrice);
      }, bettingInterval);
      return () => clearTimeout(timer);
    }
  }, [open1Min, close1Min, selectedTimeframe]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      audio.stopAllAudio();
    };
  }, [audio]);

  // Cleanup connection status timeout on unmount
  useEffect(() => {
    return () => {
      if (connectionStatusTimeoutRef.current) {
        clearTimeout(connectionStatusTimeoutRef.current);
      }
    };
  }, []);

  // SignalR connection effect with improved error handling
  useEffect(() => {
    let connectionAttempts = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // Reduced from 5000ms to 1000ms (1 second)
    let fallbackTimer = null;
    let isUsingFallback = false;
    let hasReceivedFirstRealData = false; // Flag to track first real data

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://pricehub.ciic.games/pricehub", { 
        withCredentials: false,
        timeout: 3000 // Reduced from 10000ms to 3000ms (3 seconds)
      })
      .withAutomaticReconnect([0, 500, 1000, 2000]) // Faster reconnect intervals
      .configureLogging(signalR.LogLevel.Warning) // Reduce log noise
      .build();

    signalRConnectionRef.current = connection;

    // Handle connection events
    connection.onclose((error) => {
      if (error) {
        console.warn("SignalR connection closed with error:", error.message);
        setConnectionStatus({
          status: 'disconnected',
          message: 'Connection lost',
          isUsingFallback: false
        });
      } else {
        console.info("SignalR connection closed cleanly");
      }
      
      // Start fallback if not already using it
      if (!isUsingFallback && connectionAttempts >= maxRetries) {
        startFallbackData();
      }
    });

    connection.onreconnecting((error) => {
      console.info("SignalR attempting to reconnect...");
      connectionAttempts++;
      setConnectionStatus({
        status: 'connecting',
        message: `Satoshi is waking up... (attempt ${connectionAttempts})`,
        isUsingFallback: isUsingFallback
      });
    });

    connection.onreconnected((connectionId) => {
      console.info("SignalR reconnected successfully");
      connectionAttempts = 0;
      setConnectionStatus({
        status: 'connected',
        message: 'Connected! Let’s ride these waves!',
        isUsingFallback: false
      });
      stopFallbackData();
    });

    // Start fallback data generation
    const startFallbackData = () => {
      if (isUsingFallback) return;
      
      isUsingFallback = true;
      setConnectionStatus({
        status: 'fallback',
        message: 'Using simulated data',
        isUsingFallback: true
      });
      console.info("🔄 Starting fallback mode - generating simulated BTC data");
      
      // Generate realistic Bitcoin price data
      let currentPrice = 65000 + Math.random() * 10000; // Base price between 65k-75k
      
      fallbackTimer = setInterval(() => {
        // Simulate realistic price movement (±0.1% to ±2%)
        const volatility = 0.001 + Math.random() * 0.019; // 0.1% to 2%
        const direction = Math.random() > 0.5 ? 1 : -1;
        const priceChange = currentPrice * volatility * direction;
        
        currentPrice = Math.max(50000, Math.min(100000, currentPrice + priceChange));
        
        const now = new Date();
        const openPrice = currentPrice - (Math.random() * 200 - 100); // Small difference for open
        
        // Add new price data using our timeframe system
        addNewPriceData(currentPrice);
        
        setOpen1Min(openPrice);
        setClose1Min(currentPrice);
        
        // NOTE: Don't add to resultHistory in fallback mode
        // Only SignalR candle data should populate trends
        // This prevents duplicate trend entries
        
        // Only resolve bets in fallback mode if SignalR is disconnected AND randomly (to avoid conflicts)
        if (connectionStatus.status === 'disconnected' && Math.random() > 0.95 && activeBetsRef.current.length > 0) {
          console.log(`🎯 [Fallback] Resolving ${activeBetsRef.current.length} active bets (SignalR disconnected)`);
          resolveBets(currentPrice);
        }
        
      }, 1000); // Update every second
    };

    // Stop fallback data generation
    const stopFallbackData = () => {
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
        fallbackTimer = null;
        isUsingFallback = false;
        setConnectionStatus({
          status: 'connected',
          message: 'Connected! Let’s ride these waves!',
          isUsingFallback: false
        });
        
        // Show center connection status for "Connected" message
        setShowCenterConnectionStatus(true);
        
        // Auto-hide after 2 seconds
        if (connectionStatusTimeoutRef.current) {
          clearTimeout(connectionStatusTimeoutRef.current);
        }
        connectionStatusTimeoutRef.current = setTimeout(() => {
          setShowCenterConnectionStatus(false);
        }, 2000);
        
        console.info("✅ Connected to live data - stopping fallback mode");
      }
    };

    connection.on("ReceivePrice", (msg) => {
      // Stop fallback when we receive real data
      stopFallbackData();

      if (
        msg.source === "stream" &&
        msg.data.symbol === "BTCUSDT" &&
        msg.data.closePrice &&
        msg.data.openPrice
      ) {
        const close = Number(msg.data.closePrice.replace(/,/g, ""));
        const open = Number(msg.data.openPrice.replace(/,/g, ""));

        if (!isNaN(close) && !isNaN(open)) {
          // Clear mock data and replace with real data on first reception
          if (!hasReceivedFirstRealData) {
            hasReceivedFirstRealData = true;
            console.info("🔄 First real data received, clearing mock data and replacing with real data");
            
            // Clear both raw data and display data, replace with current real price
            const now = new Date();
            const realDataPoints = Array.from({ length: DATA_LENGTH }, (_, i) => ({
              value: close, // Use the real price for all points initially
              time: new Date(now.getTime() - (DATA_LENGTH - i) * 1000)
            }));
            
            setRawData(realDataPoints);
            // The data will be automatically updated by the timeframe aggregation effect
          }
          
          // Add new price data using our timeframe system
          addNewPriceData(close);
          
          setOpen1Min(open);
          setClose1Min(close);
        }
      }

      // Only add to resultHistory if msg.source === "candle"
      if (
        msg.source === "candle" &&
        msg.data.symbol === "BTCUSDT" &&
        msg.data.closePrice &&
        msg.data.openPrice
      ) {
        // Create unique identifier for this candle
        const candleId = `${msg.data.dateTime}-${msg.data.openPrice}-${msg.data.closePrice}`;
        
        // Check if we've already processed this exact candle
        if (lastProcessedCandleRef.current === candleId) {
          console.log(`🔄 [SignalR] Skipping duplicate candle: ${candleId}`);
          return;
        }
        
        // Update last processed candle
        lastProcessedCandleRef.current = candleId;
        
        const newTrendResult = {
          dateTime: msg.data.dateTime,
          symbol: msg.data.symbol,
          openPrice: msg.data.openPrice,
          closePrice: msg.data.closePrice,
          trend: msg.data.trend
        };
        
        setResultHistory(prev => {
          // Check if this exact result already exists in history
          const isDuplicate = prev.some(item => 
            item.dateTime === newTrendResult.dateTime &&
            item.openPrice === newTrendResult.openPrice &&
            item.closePrice === newTrendResult.closePrice
          );
          
          if (isDuplicate) {
            console.log(`🚫 [SignalR] Prevented duplicate from being added to history`);
            return prev;
          }
          
          return [
            newTrendResult,
            ...prev.slice(0, 19)
          ];
        });
        
        console.log(`📊 [SignalR] New trend from candle: ${newTrendResult.trend.toUpperCase()} (${newTrendResult.openPrice} → ${newTrendResult.closePrice}) [${candleId}]`);
        
        // Resolve any active bets when a new trend is calculated
        if (activeBetsRef.current.length > 0) {
          console.log(`🎯 [SignalR] Resolving ${activeBetsRef.current.length} active bets`);
          resolveBets(parseFloat(msg.data.closePrice), msg.data.trend);
        }
      }
    });

    // Attempt to start connection with timeout
    const startConnection = async () => {
      try {
        setConnectionStatus({
          status: 'connecting',
          message: 'Catching the Bitcoin stream...',
          isUsingFallback: false
        });
        
        await connection.start();
        console.info("✅ Connected to SignalR Hub successfully!");
        connectionAttempts = 0;
        setConnectionStatus({
          status: 'connected',
          message: 'Connected! Let’s ride these waves!',
          isUsingFallback: false
        });
        
        // Show center connection status for "Connected" message and auto-hide after 2 seconds
        setShowCenterConnectionStatus(true);
        if (connectionStatusTimeoutRef.current) {
          clearTimeout(connectionStatusTimeoutRef.current);
        }
        connectionStatusTimeoutRef.current = setTimeout(() => {
          setShowCenterConnectionStatus(false);
        }, 2000);
      } catch (err) {
        connectionAttempts++;
        console.warn(`⚠️ SignalR connection attempt ${connectionAttempts} failed:`, err.message);
        
        if (connectionAttempts >= maxRetries) {
          console.info("🔄 Max connection attempts reached, starting fallback mode");
          startFallbackData();
        } else {
          setConnectionStatus({
            status: 'connecting',
            message: `Connection failed, retrying... (${connectionAttempts}/${maxRetries})`,
            isUsingFallback: false
          });
          // Faster retry - immediate for first retry, then use delay
          const delay = connectionAttempts === 1 ? 0 : retryDelay;
          setTimeout(startConnection, delay);
        }
      }
    };

    startConnection();

    return () => {
      stopFallbackData();
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop();
      }
    };
  }, [addNewPriceData]);

  // Render
  // Calculate rectX and rectWidth
  const rectWidth = 90;
  const rectX = Math.min(latestX + 22, width - rectWidth - 10); 

  return (
    <div className="btc-chart-container" ref={chartRef}>
      {/* Connection Status Indicator */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,
        background: connectionStatus.status === 'connected' ? 'rgba(76, 175, 80, 0.9)' :
                   connectionStatus.status === 'fallback' ? 'rgba(255, 193, 7, 0.9)' :
                   connectionStatus.status === 'connecting' ? 'rgba(33, 150, 243, 0.9)' :
                   'rgba(244, 67, 54, 0.9)',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
        display: 'none',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'currentColor',
          animation: connectionStatus.status === 'connecting' ? 'pulse 1.5s infinite' : 'none'
        }} />
        {connectionStatus.message}
      </div>

      {/* Timeframe Selection Controls - top right corner */}
      <div className="btc-timeframe-controls" style={{
        position: 'absolute',
        top: '50px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 8px',
        backgroundColor: 'rgba(26, 26, 26, 0.9)',
        borderRadius: '6px',
        border: '1px solid #333',
        zIndex: 10,
        backdropFilter: 'blur(10px)'
      }}>
        <span style={{
          color: '#ffffff',
          fontSize: '10px',
          fontWeight: '500',
          marginRight: '4px'
        }}>
          Time:
        </span>
        
        {['1s', '15s', '30s', '1m'].map((timeframe) => (
          <button
            key={timeframe}
            onClick={() => setSelectedTimeframe(timeframe)}
            style={{
              padding: '3px 6px',
              borderRadius: '3px',
              border: 'none',
              backgroundColor: selectedTimeframe === timeframe ? '#F6EB14' : '#333',
              color: selectedTimeframe === timeframe ? '#000' : '#fff',
              fontSize: '9px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase'
            }}
          >
            {timeframe}
          </button>
        ))}
      </div>
      
      {/* Add spacing between price and chart */}
      <div style={{ marginTop: '40px' }}>
        <svg width={width} height={height}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F6EB14" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EE377A" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Y-axis */}
        <g className="btc-y-axis">
          {yLabels.map((label, index) => (
            <g key={index}>
              <line
                x1={PADDING - 20}
                x2={width - 85}
                y1={label.y}
                y2={label.y}
                stroke="#333"
                strokeDasharray="4 2"
              />
              <text
                className="btc-y-axis-label"
                x={width - RIGHT_LABEL_WIDTH + 10}
                y={label.y + 0}
                fill="#fff"
                fontSize="12"
                fontFamily="monospace"
              >
                {formatNumber(label.value)}
              </text>
            </g>
          ))}
        </g>

        {/* Gradient area */}
        <path d={fillPath} fill="url(#grad)" stroke="none" />

        {/* Smooth line */}
        <path
          d={smoothLinePath}
          stroke="#F6EB14"
          strokeWidth="2"
          fill="none"
        />

        {/* Latest point */}
        <circle
          cx={points.length > 0 ? points[points.length - 1][0] : latestX}
          cy={points.length > 0 ? points[points.length - 1][1] : scaleY(latest.value)}
          r="4"
          fill="#F6EB14"
        />
        <g>
          <rect
            x={rectX}
            y={(points.length > 0 ? points[points.length - 1][1] : scaleY(latest.value)) - 12}
            width={rectWidth}
            height={23}
            rx="5"
            ry="5"
            fill={directionColor}
          />
          <text
            x={rectX + rectWidth / 2}
            y={(points.length > 0 ? points[points.length - 1][1] : scaleY(latest.value)) + 0}
            fill="#fff"
            fontSize="13"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {latest.value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </text>
        </g>

        {/* Time-based price labels - show at proper intervals */}
        {points.map((point, index) => {
          if (index >= data.length) return null;
          
          const [x, y] = point;
          const dataPoint = data[index];
          
          // Determine if this point should show a label based on timeframe
          let shouldShowLabel = false;
          
          switch (selectedTimeframe) {
            case '1s':
              // Show every 15th point (every 15 seconds)
              shouldShowLabel = index % 15 === 0;
              break;
            case '15s':
              // Show only the latest 5 price labels
              shouldShowLabel = index >= data.length - 5;
              break;
            case '30s':
              // Show only the latest 5 price labels
              shouldShowLabel = index >= data.length - 5;
              break;
            case '1m':
              // Show only the latest 5 price labels
              shouldShowLabel = index >= data.length - 5;
              break;
            default:
              shouldShowLabel = index % 10 === 0;
          }
          
          // Don't show label on the last point (main price label already shows it)
          if (index === points.length - 1) shouldShowLabel = false;
          
          // Don't show if not selected
          if (!shouldShowLabel) return null;
          
          // Improved positioning to avoid overlaps
          const isEvenIndex = Math.floor(index / 2) % 2 === 0;
          const verticalOffset = isEvenIndex ? -18 : 28; // More spacing between alternating labels
          const safeY = Math.max(15, Math.min(y + verticalOffset, height - 25)); // Keep within chart bounds
          
          return (
            <g key={`time-price-label-${index}`}>
              {/* Price text with better positioning */}
              <text
                x={x}
                y={safeY}
                fill="#929292"
                fontSize="8"
                fontWeight="500"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {dataPoint.value.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </text>
            </g>
          );
        })}

        {/* Time axis labels at bottom */}
        <g className="btc-time-axis">
          {data.map((dataPoint, index) => {
            // Calculate label interval for time axis
            let timeAxisInterval;
            switch (selectedTimeframe) {
              case '1s':
                timeAxisInterval = 15; // Show every 15 seconds
                break;
              case '15s':
                timeAxisInterval = 4; // Show every minute (4 * 15s)
                break;
              case '30s':
                timeAxisInterval = 2; // Show every minute (2 * 30s)
                break;
              case '1m':
                timeAxisInterval = 5; // Show every 5 minutes
                break;
              default:
                timeAxisInterval = 10;
            }
            
            // Only show labels at intervals and for the last point
            const shouldShowTimeLabel = index % timeAxisInterval === 0 || index === data.length - 1;
            if (!shouldShowTimeLabel) return null;
            
            const x = scaleX(index);
            if (index === data.length - 1) {
              // Position last label at the latest point
              const adjustedX = latestX;
              
              // Format time based on timeframe
              let timeFormat;
              const time = dataPoint.time;
              
              switch (selectedTimeframe) {
                case '1s':
                  timeFormat = time.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit',
                    minute: '2-digit', 
                    second: '2-digit' 
                  });
                  break;
                case '15s':
                case '30s':
                  timeFormat = time.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  });
                  break;
                case '1m':
                  timeFormat = time.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  });
                  break;
                default:
                  timeFormat = time.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    minute: '2-digit', 
                    second: '2-digit' 
                  });
              }
              
              return (
                <g key={`time-axis-${index}`}>
                  <text
                    x={adjustedX}
                    y={height - 10}
                    fill="#888"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {timeFormat}
                  </text>
                </g>
              );
            }
            
            // Format time for regular intervals
            let timeFormat;
            const time = dataPoint.time;
            
            switch (selectedTimeframe) {
              case '1s':
                timeFormat = time.toLocaleTimeString('en-US', { 
                  hour12: false, 
                  hour: '2-digit',
                  minute: '2-digit', 
                  second: '2-digit' 
                });
                break;
              case '15s':
              case '30s':
                timeFormat = time.toLocaleTimeString('en-US', { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                });
                break;
              case '1m':
                timeFormat = time.toLocaleTimeString('en-US', { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                });
                break;
              default:
                timeFormat = time.toLocaleTimeString('en-US', { 
                  hour12: false, 
                  minute: '2-digit', 
                  second: '2-digit' 
                });
            }
            
            return (
              <g key={`time-axis-${index}`}>
                <text
                  x={x}
                  y={height - 10}
                  fill="#888"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {timeFormat}
                </text>
              </g>
            );
          })}
        </g>
   
      </svg>
      
      {/* Center Connection Status Message */}
      {showCenterConnectionStatus && (
        <div className={`center-connection-status ${
          connectionStatus.status === 'connected' ? 'connected' : 
          connectionStatus.status === 'connecting' ? 'connecting' : 'waiting'
        }`}>
          {connectionStatus.message}
        </div>
      )}
      
      </div>

      {/* Price display with Open at the top */}
      <div className="btc-price">
        <div>
          <img
            src={bitcoinIcon}
            alt="BTC"
            className="btc-icon"
          />
          <span className="btc-usdt">BTC</span>
         
          <span
            className={`btc-value ${isUp ? 'up' : isDown ? 'down' : 'even'}`}
          >
            {latest.value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}({formattedPercentChange})
          </span>
          <span
            className={`btc-label ${isUp ? 'up' : isDown ? 'down' : 'even'}`}
          >
            {isUp && <><span style={{ marginRight: 5 }}>▲</span>UP</>}
            {isDown && <><span style={{ marginRight: 5 }}>▼</span>DOWN</>}
            {!isUp && !isDown && 'EVEN'}
          </span>
        </div>
        {alertMessage && <div className="btc-alert">{alertMessage}</div>}
      </div>

      {/* Trends and Betting Interface Container */}
      <div className="btc-bottom-container" style={{
        display: 'flex',
        gap: '8px',
        margin: '4px 16px 0 16px',
        maxWidth: 'calc(100% - 32px)'
      }}>

        {/* Trends display - left side */}
        <div className="btc-trends-container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#2a2a2a',
          borderRadius: '6px',
          flex: '0.8',
          minWidth: '400px',
          position: 'relative'
        }}>
          <span style={{
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: '500',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            whiteSpace: 'nowrap'
          }}>
            Trends
          </span>
          
          {/* Display recent trends as compact buttons */}
          {resultHistory.slice(0, 5).map((item, idx) => {
            const isLatest = idx === 0 && resultHistory.length > 0;
            return (
              <div
                key={idx}
                style={{
                  padding: '4px 8px',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#ffffff',
                  backgroundColor: item.trend === 'up' ? '#4CAF50' : item.trend === 'down' ? '#f44336' : '#76a8e5',
                  minWidth: '35px',
                  textAlign: 'center',
                  boxShadow: isLatest 
                    ? `0 0 8px ${item.trend === 'up' ? 'rgba(76, 175, 80, 0.6)' : item.trend === 'down' ? 'rgba(244, 67, 54, 0.6)' : 'rgba(118, 168, 229, 0.6)'}` 
                    : '0 1px 2px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  animation: isLatest ? 'latestPulse 2s infinite' : 'none',
                  border: isLatest ? '2px solid rgba(255, 255, 255, 0.3)' : 'none'
                }}
              >
                {item.trend.toUpperCase()}
              </div>
            );
          })}
          
          {/* Fill with compact placeholder if not enough history */}
          {Array.from({ length: Math.max(0, 5 - resultHistory.length) }, (_, idx) => (
            <div
              key={`placeholder-${idx}`}
              style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: '600',
                color: '#666',
                backgroundColor: '#333',
                minWidth: '35px',
                textAlign: 'center',
                opacity: 0.4
              }}
            >
              ---
            </div>
          ))}
          
          {/* Compact details button */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              marginLeft: 'auto',
              padding: '4px 8px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: '#444',
              color: '#ffffff',
              fontSize: '10px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#555'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#444'}
          >
            Details
          </button>
        </div>

        {/* Betting Interface - right side */}
        <div className="btc-betting-interface" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 20px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333',
          flex: '1.5',
          minWidth: '400px',
          gap: '10px'
        }}>
          {/* Balance Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            minWidth: 'auto'
          }}>
            <span style={{
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              whiteSpace: 'nowrap'
            }}>
              Balance: {balance}
            </span>
          </div>

          {/* Amount Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            flex: '0 0 auto'
          }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: '120px',
                  padding: '8px 8px 8px 65px',
                  borderRadius: '20px',
                  border: '1px solid #444',
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  fontSize: '15px',
                  textAlign: 'right',
                  outline: 'none',
                  height: '30px',
                  boxSizing: 'border-box',
                  appearance: 'textfield',
                  MozAppearance: 'textfield'
                }}
                min="1"
                max={balance}
              />
              <div style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                pointerEvents: 'none'
              }}>
                <span style={{
                  color: '#999',
                  fontSize: '12px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  whiteSpace: 'nowrap'
                }}>
                  Amount
                </span>
                <div style={{
                  width: '1px',
                  height: '14px',
                  backgroundColor: '#555',
                  opacity: 0.7
                }} />
              </div>
            </div>
          </div>

          {/* UP/DOWN Buttons */}
          <div className="button-container">
            <button
              className="button-half up-half"
              onClick={() => placeBet('up')}
            >
              <span className="up-text">UP</span>
            </button>
            <button
              className="button-half down-half"
              onClick={() => placeBet('down')}
            >
              <span className="down-text">DOWN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Transaction History */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '80vh',
            border: '1px solid #333',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #333'
            }}>
              <div>
                <h2 style={{
                  color: '#ffffff',
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: 0,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  marginBottom: '12px'
                }}>
                  📊 Trading History
                </h2>
                
                {/* Tab buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setActiveTab('trends')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: 'none',
                      backgroundColor: activeTab === 'trends' ? '#4CAF50' : '#333',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    Price Trends
                  </button>
                  <button
                    onClick={() => setActiveTab('bets')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: 'none',
                      backgroundColor: activeTab === 'bets' ? '#4CAF50' : '#333',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    Betting History ({bettingHistory.length})
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#333';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#888';
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{
              maxHeight: '60vh',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              {/* Price Trends Tab */}
              {activeTab === 'trends' && (
                <>
                  {resultHistory.length > 0 ? (
                    <div>
                      {/* Summary Stats */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px',
                        padding: '16px',
                        backgroundColor: '#252525',
                        borderRadius: '12px'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
                            Total Trades
                          </div>
                          <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                            {resultHistory.length}
                          </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
                        Up Trends
                      </div>
                      <div style={{ color: '#4CAF50', fontSize: '18px', fontWeight: '600' }}>
                        {resultHistory.filter(item => item.trend === 'up').length}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
                        Down Trends
                      </div>
                      <div style={{ color: '#f44336', fontSize: '18px', fontWeight: '600' }}>
                        {resultHistory.filter(item => item.trend === 'down').length}
                      </div>
                    </div>
                  </div>

                  {/* Transaction List */}
                  {resultHistory.map((item, idx) => (
                    <div key={idx} style={{
                      padding: '16px',
                      backgroundColor: idx % 2 === 0 ? '#222' : '#1a1a1a',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      border: '1px solid #333',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#2a2a2a'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = idx % 2 === 0 ? '#222' : '#1a1a1a'}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          color: '#cccccc',
                          fontSize: '14px',
                          fontFamily: 'monospace'
                        }}>
                          {new Date(item.dateTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })} at {new Date(item.dateTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          })}
                        </div>
                        
                        <div style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#ffffff',
                          backgroundColor: item.trend === 'up' ? '#4CAF50' : item.trend === 'down' ? '#f44336' : '#76a8e5'
                        }}>
                          {item.trend === 'up' ? '📈 UP' : item.trend === 'down' ? '📉 DOWN' : '➡️ EVEN'}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          color: '#ffffff',
                          fontSize: '16px',
                          fontFamily: 'monospace'
                        }}>
                          {item.symbol}: ${item.openPrice} → ${item.closePrice}
                        </div>
                        
                        <div style={{
                          color: item.trend === 'up' ? '#4CAF50' : item.trend === 'down' ? '#f44336' : '#888',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {item.trend === 'up' ? '+' : item.trend === 'down' ? '-' : '±'}
                          ${Math.abs(parseFloat(item.closePrice) - parseFloat(item.openPrice)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#888'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                  <div style={{ fontSize: '18px', marginBottom: '8px' }}>No price trends yet</div>
                  <div style={{ fontSize: '14px' }}>Price trends will appear here as trading rounds complete</div>
                </div>
              )}
                </>
              )}

              {/* Betting History Tab */}
              {activeTab === 'bets' && (
                <>
                  {bettingHistory.length > 0 ? (
                    <div>
                      {/* Betting Summary Stats */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px',
                        padding: '16px',
                        backgroundColor: '#252525',
                        borderRadius: '12px'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
                            Total Bets
                          </div>
                          <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>
                            {bettingHistory.length}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
                            Wins
                          </div>
                          <div style={{ color: '#4CAF50', fontSize: '18px', fontWeight: '600' }}>
                            {bettingHistory.filter(bet => bet.result === 'win').length}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
                            Total Winnings
                          </div>
                          <div style={{ color: '#4CAF50', fontSize: '18px', fontWeight: '600' }}>
                            ${bettingHistory.reduce((sum, bet) => sum + (bet.payout > 0 ? bet.payout : 0), 0)}
                          </div>
                        </div>
                      </div>

                      {/* Betting History List */}
                      {bettingHistory.map((bet, idx) => (
                        <div key={idx} style={{
                          padding: '16px',
                          backgroundColor: idx % 2 === 0 ? '#222' : '#1a1a1a',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          border: '1px solid #333',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#2a2a2a'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = idx % 2 === 0 ? '#222' : '#1a1a1a'}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <div style={{
                              color: '#cccccc',
                              fontSize: '14px',
                              fontFamily: 'monospace'
                            }}>
                              {bet.placedAt.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })} at {bet.placedAt.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                              })}
                            </div>
                            
                            <div style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#ffffff',
                              backgroundColor: bet.result === 'win' ? '#4CAF50' : bet.result === 'tie' ? '#ff9800' : '#f44336'
                            }}>
                              {bet.result === 'win' ? '🎉 WIN' : bet.result === 'tie' ? '🤝 TIE' : '❌ LOSS'}
                            </div>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <div style={{
                              color: '#ffffff',
                              fontSize: '16px',
                              fontFamily: 'monospace'
                            }}>
                              Bet: {bet.direction.toUpperCase()} ${bet.amount} | Result: {bet.actualTrend ? bet.actualTrend.toUpperCase() : 'N/A'}
                            </div>
                            
                            <div style={{
                              color: bet.payout > 0 ? '#4CAF50' : bet.payout < 0 ? '#f44336' : '#888',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              {bet.payout > 0 ? '+' : ''}${bet.payout}
                            </div>
                          </div>

                          <div style={{
                            color: '#888',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                          }}>
                            ${bet.openPrice} → ${bet.closePrice} | Winnings: ${bet.winnings}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#888'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
                      <div style={{ fontSize: '18px', marginBottom: '8px' }}>No betting history yet</div>
                      <div style={{ fontSize: '14px' }}>Place your first bet to see your betting history here</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed history dropdown (optional) */}
      {showHistory && (
        <div className="btc-result-history-list" style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          padding: '10px',
          marginTop: '10px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {resultHistory.slice(0, 9).map((item, idx) => (
            <div key={idx} style={{
              padding: '8px 12px',
              color: '#cccccc',
              fontSize: '12px',
              borderBottom: idx < Math.min(resultHistory.length - 1, 8) ? '1px solid #333' : 'none',
              fontFamily: 'monospace'
            }}>
              {new Date(item.dateTime).toLocaleString()} - {item.symbol}: {item.openPrice} → {item.closePrice} 
              <span style={{
                marginLeft: '8px',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '10px',
                backgroundColor: item.trend === 'up' ? '#4CAF50' : item.trend === 'down' ? '#f44336' : '#76a8e5'
              }}>
                {item.trend.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Audio Control Panel */}
      <div className="audio-control-panel">
        
        {/* Main Control Buttons Row */}
        <div className="audio-buttons-row">
          
          {/* Mute All Button (replacing shuffle) */}
          <button
            onClick={() => audio.toggleSounds()}
            className={`audio-btn audio-btn--mute ${!audio.isEnabled ? 'muted' : ''}`}
            title={audio.isEnabled ? 'Mute All Sounds' : 'Unmute All Sounds'}
          >
            <FontAwesomeIcon 
              icon={audio.isEnabled ? faVolumeHigh : faVolumeXmark} 
            />
          </button>

          {/* Previous Track Button */}
          <button
            onClick={playPreviousTrack}
            className="audio-btn audio-btn--track"
            title="Previous Track"
          >
            <FontAwesomeIcon icon={faBackwardStep} />
          </button>

          {/* Play/Pause Button (Main) */}
          <button
            onClick={toggleBackgroundMusic}
            className={`audio-btn audio-btn--main ${backgroundMusicEnabled ? 'playing' : ''}`}
            title={backgroundMusicEnabled ? 'Pause Background Music' : 'Play Background Music'}
          >
            <FontAwesomeIcon 
              icon={backgroundMusicEnabled ? faPause : faPlay} 
            />
          </button>

          {/* Next Track Button */}
          <button
            onClick={playNextTrack}
            className="audio-btn audio-btn--track"
            title="Next Track"
          >
            <FontAwesomeIcon icon={faForwardStep} />
          </button>

          {/* Repeat Button */}
          <button
            onClick={() => {/* TODO: Repeat functionality */}}
            className="audio-btn audio-btn--repeat"
            title="Repeat (Coming Soon)"
          >
            <FontAwesomeIcon icon={faRepeat} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="audio-progress-container">
          {/* Current Time */}
          <span className="audio-time audio-time--current">
            {formatTime(musicCurrentTime)}
          </span>

          {/* Progress Slider */}
          <div className="audio-progress-slider">
            <input
              type="range"
              min="0"
              max={musicDuration || 0}
              value={musicCurrentTime}
              onChange={handleSeek}
              className="audio-progress-input"
              style={{
                background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${
                  ((musicCurrentTime / (musicDuration || 1)) * 100)
                }%, #444 ${
                  ((musicCurrentTime / (musicDuration || 1)) * 100)
                }%, #444 100%)`
              }}
            />
          </div>

          {/* Total Duration */}
          <span className="audio-time">
            {formatTime(musicDuration)}
          </span>
        </div>

        {/* Track Info */}
        <div className="audio-track-info">
          {playlist[currentTrackIndex].title}
        </div>
      </div>

      {/* Result Popup */}
      {showResultPopup && popupResult && (
        <div className="result-popup-overlay">
          <div className={`result-popup-container ${popupResult.type}`}>
            {/* Main Result Text */}
            <div className="result-popup-main-text">
              {popupResult.type === 'win' ? 'Win' : 'Miss'}
            </div>

            {/* Subtitle */}
            <div className={`result-popup-subtitle ${popupResult.type}`}>
              {popupResult.type === 'win' ? 'Congratulations!' : 'Try again, Good luck!'}
            </div>

            {/* Amount */}
            <div className="result-popup-amount">
              {popupResult.type === 'win' ? '+' : '-'}${popupResult.amount}
            </div>
          </div>
        </div>
      )}

      {/* HTML5 Audio Element for Background Music */}
      <audio
        ref={backgroundMusicRef}
        preload="auto"
        style={{ display: 'none' }}
      >
        <source src={playlist[currentTrackIndex].file} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default BTCChart;