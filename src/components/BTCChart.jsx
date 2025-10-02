// src/components/BTCChart.jsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import './BTCChart/styles/index.css';
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
const PADDING = 20;
const LEFT_LABEL_WIDTH = 20;
const RIGHT_LABEL_WIDTH = 105;
const CHART_PADDING_RIGHT = 60;
const INITIAL_PRICE = 113000;
const UPPER_THRESHOLD = 150000;
const LOWER_THRESHOLD = 98000;
const DATA_LENGTH = 60;

// Timeframe configurations
const TIMEFRAME_CONFIG = {
  '1s': { interval: 1000, label: '1 Second', dataPoints: 60 },    // 60 seconds of data
  '15s': { interval: 15000, label: '15 Seconds', dataPoints: 40 }, // 10 minutes of data (more manageable)
  '30s': { interval: 30000, label: '30 Seconds', dataPoints: 30 }, // 15 minutes of data 
  '1m': { interval: 60000, label: '1 Minute', dataPoints: 20 }     // 20 minutes of data
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
  // Legacy betting state (keeping for backward compatibility)
  const [open1Min, setOpen1Min] = useState(null);
  const [close1Min, setClose1Min] = useState(null);

  // Multi-timeframe betting rounds state
  const [bettingRounds, setBettingRounds] = useState({
    '15s': {
      currentRound: null,
      nextRound: null,
      openPrice: null,
      closePrice: null,
      startTime: null,
      endTime: null,
      status: 'waiting', // 'waiting', 'active', 'closing', 'closed'
      activeBets: [],
      resolved: false
    },
    '30s': {
      currentRound: null,
      nextRound: null,
      openPrice: null,
      closePrice: null,
      startTime: null,
      endTime: null,
      status: 'waiting',
      activeBets: [],
      resolved: false
    },
    '1m': {
      currentRound: null,
      nextRound: null,
      openPrice: null,
      closePrice: null,
      startTime: null,
      endTime: null,
      status: 'waiting',
      activeBets: [],
      resolved: false
    }
  });
  
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
  // Legacy refs removed - now using bettingRounds state for multi-timeframe support
  const lastProcessedCandleRef = useRef(null);

  // Add state for timeframe-specific trend history
  const [trendHistory, setTrendHistory] = useState({
    '15s': [],
    '30s': [],
    '1m': []
  });
  
  // Legacy resultHistory for backward compatibility (will be deprecated)
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


  // Timeframe selection state for chart display
  const [selectedTimeframe, setSelectedTimeframe] = useState('1s'); // '1s', '15s', '30s', '1m'
  
  // Battle period selection state for betting
  const [selectedBattlePeriod, setSelectedBattlePeriod] = useState('15s'); // '15s', '30s', '1m'

  // 🎯 NEW: Individual User Betting System
  const [individualBets, setIndividualBets] = useState([]); // Array to track individual user bets
  const [userTimer, setUserTimer] = useState({
    timeLeft: 0,
    isActive: false,
    betId: null,
    timeframe: null,
    status: 'ready' // 'ready', 'betting', 'resolving'
  });
  
  // Track resolved bet IDs to prevent React StrictMode duplicates
  const resolvedBetIdsRef = useRef(new Set());
  
  // Track active timers to prevent React StrictMode duplicates
  const activeTimersRef = useRef(new Set());
  
  // Track balance updates to prevent duplicates
  const balanceUpdatedBetsRef = useRef(new Set());

  // Multi-timeframe battle timer state - all timeframes run simultaneously
  const [battleTimers, setBattleTimers] = useState({
    '15s': {
      timeLeft: 0,
      canBet: true,
      status: 'waiting',
      message: 'Waiting for next round...',
      roundNumber: 0,
      nextRoundStart: null
    },
    '30s': {
      timeLeft: 0,
      canBet: true,
      status: 'waiting',
      message: 'Waiting for next round...',
      roundNumber: 0,
      nextRoundStart: null
    },
    '1m': {
      timeLeft: 0,
      canBet: true,
      status: 'waiting',
      message: 'Waiting for next round...',
      roundNumber: 0,
      nextRoundStart: null
    }
  });

  // Keep single battleTimer for backward compatibility with UI
  const [battleTimer, setBattleTimer] = useState({
    timeLeft: 0,
    canBet: true,
    status: 'waiting', // 'waiting', 'active', 'blocked'
    message: 'Waiting for next round...'
  });

  const battleTimerRef = useRef(null);

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
    
    // Update betting rounds with new price - but we need to make sure dependencies are available
    // This will be called from an effect that has access to updateBettingRounds
  }, []);

  // Popup state for bet results
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [popupResult, setPopupResult] = useState(null); // { type: 'win' | 'loss', amount: number, totalWinnings?: number }

  // Betting interface state
  const [balance, setBalance] = useState(2000);
  const [betAmount, setBetAmount] = useState(100);
  const [selectedBet, setSelectedBet] = useState(null); // 'up' or 'down'
  // Legacy activeBets state removed - now using bettingRounds.{timeframe}.activeBets for each timeframe
  const [bettingHistory, setBettingHistory] = useState([]); // Track betting results

  // Legacy ref synchronization removed - using bettingRounds state instead

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

  // Multi-timeframe battle timer calculation functions
  const calculateMultiBattleTimers = useCallback(() => {
    const now = new Date();
    const currentSeconds = now.getSeconds();
    const currentMinutes = now.getMinutes();
    const currentHours = now.getHours();
    
    const timers = {};
    
    // 🎯 HYBRID: Include 15s in synchronized system for trend capture (but individual betting remains separate)
    const timeframes = [
      { key: '15s', interval: 15, unit: 'seconds' },
      { key: '30s', interval: 30, unit: 'seconds' },
      { key: '1m', interval: 60, unit: 'seconds' }
    ];
    
    timeframes.forEach(({ key, interval, unit }) => {
      let timeLeft, roundStart, roundEnd, canBet, status, message, roundNumber, nextRoundStart;
      
      if (unit === 'seconds') {
        // All intervals sync to minute start (0 seconds)
        // Calculate where we are in the current interval cycle
        const secondsFromMinuteStart = currentSeconds;
        
        // Find current interval within the minute
        const currentInterval = Math.floor(secondsFromMinuteStart / interval);
        
        // Calculate this interval's boundaries
        roundStart = currentInterval * interval;
        roundEnd = roundStart + interval;
        
        // Special handling for 60s (1 minute) - it's always a full minute
        if (interval === 60) {
          // 1-minute rounds always start at minute 0 and end at minute 60
          // They don't follow the interval subdivision logic
          roundStart = 0;
          roundEnd = 60;
          timeLeft = 60 - secondsFromMinuteStart;
          
          // 1-minute rounds complete only at the top of each minute (0 seconds)
          // Unlike 30s which completes at both 30s and 60s (0s)
        } else {
          // For 15s and 30s intervals - they subdivide the minute
          if (roundEnd <= 60) {
            // Normal case: interval fits within current minute
            timeLeft = roundEnd - secondsFromMinuteStart;
          } else {
            // Edge case: interval would exceed minute boundary
            // This shouldn't happen with 15s and 30s, but handle it
            timeLeft = 60 - secondsFromMinuteStart;
          }
        }
        
        // Ensure timeLeft is always positive
        if (timeLeft <= 0) {
          timeLeft = interval;
        }
        
        // Calculate round number for unique identification
        const totalSecondsToday = currentHours * 3600 + currentMinutes * 60 + currentSeconds;
        roundNumber = Math.floor(totalSecondsToday / interval);
        
        // Calculate next round start time
        nextRoundStart = new Date();
        if (interval === 60) {
          // 1 minute always starts at next minute
          nextRoundStart.setHours(currentHours, currentMinutes + 1, 0, 0);
        } else {
          // 15s and 30s: next start is at roundEnd (if within minute) or next minute
          if (roundEnd < 60) {
            nextRoundStart.setHours(currentHours, currentMinutes, roundEnd, 0);
          } else {
            nextRoundStart.setHours(currentHours, currentMinutes + 1, 0, 0);
          }
        }
      }
      
      // Check if betting is allowed (block last 3 seconds)
      canBet = timeLeft > 3;
      status = canBet ? 'active' : 'blocked';
      
      if (canBet) {
        message = `${key.toUpperCase()} Round - ${timeLeft}s left to bet`;
      } else {
        message = `Next round in ${timeLeft}s`;
      }
      
      timers[key] = {
        timeLeft,
        canBet,
        status,
        message,
        roundNumber,
        nextRoundStart,
        interval,
        roundStart,
        roundEnd
      };
      
      // Debug logging for synchronization verification
      if (currentSeconds % 10 === 0) { // Log every 10 seconds to reduce spam
        console.log(`⏰ [Sync Debug] ${key}: timeLeft=${timeLeft}, roundStart=${roundStart}, roundEnd=${roundEnd}, currentSeconds=${currentSeconds}`);
      }
    });
    
    return timers;
  }, []);

  // Legacy single battle timer calculation (for backward compatibility)
  const calculateBattleTimer = useCallback((timeframe) => {
    const multiTimers = calculateMultiBattleTimers();
    return multiTimers[timeframe] || {
      timeLeft: 0,
      canBet: false,
      status: 'waiting',
      message: 'Invalid timeframe'
    };
  }, [calculateMultiBattleTimers]);

  const updateBattleTimers = useCallback(() => {
    const newTimers = calculateMultiBattleTimers();
    setBattleTimers(newTimers);
    
    // Update single timer for backward compatibility
    const selectedTimer = newTimers[selectedBattlePeriod];
    if (selectedTimer) {
      setBattleTimer({
        timeLeft: selectedTimer.timeLeft,
        canBet: selectedTimer.canBet,
        status: selectedTimer.status,
        message: selectedTimer.message
      });
    }
  }, [calculateMultiBattleTimers, selectedBattlePeriod]);

  // 15s Trend capture using real SignalR price data
  const captureTrendFor15s = useCallback((roundNumber, openPrice, closePrice) => {
    if (!openPrice || !closePrice) {
      console.log(`📊 [15s] Cannot capture trend for round #${roundNumber} - missing price data`);
      return;
    }

    // Check if we've already captured this round (additional safety check)
    setTrendHistory(prevTrends => {
      const existingTrends = prevTrends['15s'] || [];
      const alreadyCaptured = existingTrends.some(trend => trend.roundNumber === roundNumber);
      
      if (alreadyCaptured) {
        console.log(`📊 [15s] Round #${roundNumber} trend already captured, skipping duplicate`);
        return prevTrends; // Return unchanged state
      }

      // Calculate trend based on real price movement
      const priceChange = closePrice - openPrice;
      const trend = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'even';

      // Create trend result with real data
      const trendResult = {
        dateTime: new Date().toISOString(),
        symbol: 'BTCUSDT',
        openPrice: openPrice.toFixed(2),
        closePrice: closePrice.toFixed(2),
        trend: trend,
        timeframe: '15s',
        intervalDuration: '15s',
        timestamp: new Date(),
        priceChange: priceChange.toFixed(2),
        roundNumber: roundNumber
      };

      console.log(`📊 [15s] Round #${roundNumber} trend captured: ${trend.toUpperCase()} (${openPrice.toFixed(2)} → ${closePrice.toFixed(2)}, ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)})`);

      // Add to 15s trend history
      return {
        ...prevTrends,
        '15s': [trendResult, ...existingTrends.slice(0, 19)] // Keep latest 20 trends
      };
    });
  }, []);

  // 30s Trend capture using real SignalR price data
  const captureTrendFor30s = useCallback((roundNumber, openPrice, closePrice) => {
    if (!openPrice || !closePrice) {
      console.log(`📊 [30s] Cannot capture trend for round #${roundNumber} - missing price data`);
      return;
    }

    // Check if we've already captured this round (additional safety check)
    setTrendHistory(prevTrends => {
      const existingTrends = prevTrends['30s'] || [];
      const alreadyCaptured = existingTrends.some(trend => trend.roundNumber === roundNumber);
      
      if (alreadyCaptured) {
        console.log(`📊 [30s] Round #${roundNumber} trend already captured, skipping duplicate`);
        return prevTrends; // Return unchanged state
      }

      // Calculate trend based on real price movement
      const priceChange = closePrice - openPrice;
      const trend = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'even';

      // Create trend result with real data
      const trendResult = {
        dateTime: new Date().toISOString(),
        symbol: 'BTCUSDT',
        openPrice: openPrice.toFixed(2),
        closePrice: closePrice.toFixed(2),
        trend: trend,
        timeframe: '30s',
        intervalDuration: '30s',
        timestamp: new Date(),
        priceChange: priceChange.toFixed(2),
        roundNumber: roundNumber
      };

      console.log(`📊 [30s] Round #${roundNumber} trend captured: ${trend.toUpperCase()} (${openPrice.toFixed(2)} → ${closePrice.toFixed(2)}, ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)})`);

      // Add to 30s trend history
      return {
        ...prevTrends,
        '30s': [trendResult, ...existingTrends.slice(0, 19)] // Keep latest 20 trends
      };
    });
  }, []);

  // 1m Trend capture using real SignalR price data
  const captureTrendFor1m = useCallback((roundNumber, openPrice, closePrice) => {
    if (!openPrice || !closePrice) {
      console.log(`📊 [1m] Cannot capture trend for round #${roundNumber} - missing price data`);
      return;
    }

    // Check if we've already captured this round (additional safety check)
    setTrendHistory(prevTrends => {
      const existingTrends = prevTrends['1m'] || [];
      const alreadyCaptured = existingTrends.some(trend => trend.roundNumber === roundNumber);
      
      if (alreadyCaptured) {
        console.log(`📊 [1m] Round #${roundNumber} trend already captured, skipping duplicate`);
        return prevTrends; // Return unchanged state
      }

      // Calculate trend based on real price movement
      const priceChange = closePrice - openPrice;
      const trend = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'even';

      // Create trend result with real data
      const trendResult = {
        dateTime: new Date().toISOString(),
        symbol: 'BTCUSDT',
        openPrice: openPrice.toFixed(2),
        closePrice: closePrice.toFixed(2),
        trend: trend,
        timeframe: '1m',
        intervalDuration: '1m',
        timestamp: new Date(),
        priceChange: priceChange.toFixed(2),
        roundNumber: roundNumber
      };

      console.log(`📊 [1m] Round #${roundNumber} trend captured: ${trend.toUpperCase()} (${openPrice.toFixed(2)} → ${closePrice.toFixed(2)}, ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)})`);

      // Add to 1m trend history
      return {
        ...prevTrends,
        '1m': [trendResult, ...existingTrends.slice(0, 19)] // Keep latest 20 trends
      };
    });
  }, []);

  // Helper function to get current round for a timeframe
  const getCurrentRound = useCallback((timeframe) => {
    return bettingRounds[timeframe];
  }, [bettingRounds]);



  // Multi-timeframe betting round management
  const updateBettingRounds = useCallback((currentPrice) => {
    const timers = calculateMultiBattleTimers();
    
    setBettingRounds(prevRounds => {
      const newRounds = { ...prevRounds };
      
      Object.keys(timers).forEach(timeframe => {
        // 🎯 HYBRID: For 15s, only handle trend capture (not betting rounds)
        // Individual betting is handled separately, but we still want synchronized trends
        const timer = timers[timeframe];
        const round = newRounds[timeframe];
        
        // Check if a new round should start
        if (!round.currentRound || timer.roundNumber !== round.currentRound) {
          // For all timeframes: Start new round but only for trend tracking (not betting)
          // All betting is now individual-based
          newRounds[timeframe] = {
            ...round,
            currentRound: timer.roundNumber,
            openPrice: currentPrice,
            closePrice: null,
            startTime: new Date(),
            endTime: new Date(Date.now() + timer.interval * 1000),
            status: 'trend-only', // All timeframes are trend-only now
            activeBets: [], // No timeframes use synchronized bets anymore
            resolved: false,
            trendCaptured: false
          };
          
          console.log(`🎲 Started new ${timeframe} trend-only round #${timer.roundNumber} at price ${currentPrice}`);
        }
        
        // Update round status based on timer
        else if (round.currentRound === timer.roundNumber) {
          // For 15s and 30s: Only handle trend capture, skip betting logic (individual betting handled separately)
          if (timeframe === '15s') {
            // Update close price for trend calculation
            newRounds[timeframe] = {
              ...round,
              closePrice: currentPrice
            };
            
            // Capture trend when round completes (timeLeft <= 1)
            if (timer.timeLeft <= 1 && !round.trendCaptured && round.openPrice && currentPrice) {
              console.log(`📊 [15s Sync] Capturing trend for round #${timer.roundNumber}: ${round.openPrice} → ${currentPrice}`);
              captureTrendFor15s(timer.roundNumber, round.openPrice, currentPrice);
              newRounds[timeframe] = {
                ...newRounds[timeframe],
                trendCaptured: true,
                status: 'closed'
              };
            }
            return; // Skip betting logic for 15s
          }
          
          // For 30s: Only handle trend capture, skip betting logic (individual betting handled separately)
          if (timeframe === '30s') {
            // Update close price for trend calculation
            newRounds[timeframe] = {
              ...round,
              closePrice: currentPrice
            };
            
            // Capture trend when round completes (timeLeft <= 1)
            if (timer.timeLeft <= 1 && !round.trendCaptured && round.openPrice && currentPrice) {
              console.log(`📊 [30s Sync] Capturing trend for round #${timer.roundNumber}: ${round.openPrice} → ${currentPrice}`);
              captureTrendFor30s(timer.roundNumber, round.openPrice, currentPrice);
              newRounds[timeframe] = {
                ...newRounds[timeframe],
                trendCaptured: true,
                status: 'closed'
              };
            }
            return; // Skip betting logic for 30s
          }
          
          // For 1m: Only handle trend capture, skip betting logic (individual betting handled separately)
          if (timeframe === '1m') {
            // Update close price for trend calculation
            newRounds[timeframe] = {
              ...round,
              closePrice: currentPrice
            };
            
            // Capture trend when round completes (timeLeft <= 1)
            if (timer.timeLeft <= 1 && !round.trendCaptured && round.openPrice && currentPrice) {
              console.log(`📊 [1m Sync] Capturing trend for round #${timer.roundNumber}: ${round.openPrice} → ${currentPrice}`);
              captureTrendFor1m(timer.roundNumber, round.openPrice, currentPrice);
              newRounds[timeframe] = {
                ...newRounds[timeframe],
                trendCaptured: true,
                status: 'closed'
              };
            }
            return; // Skip betting logic for 1m
          }
          
          // Continue with betting logic for 30s and 1m
          newRounds[timeframe] = {
            ...round,
            status: timer.canBet ? 'active' : 'closing'
          };
          
          // Set close price when betting closes (3s before round end)
          if (!timer.canBet && !round.closePrice) {
            newRounds[timeframe].closePrice = currentPrice;
            newRounds[timeframe].status = 'closing'; // Keep as closing, not closed yet
            
            console.log(`🚫 Betting closed for ${timeframe} round #${timer.roundNumber} at price ${currentPrice}`);
          }
          
          // Capture trend when round ends - different conditions for different timeframes
          let shouldCaptureTrend = false;
          
          if (timeframe === '15s') {
            // 15s rounds end every 15 seconds
            shouldCaptureTrend = timer.timeLeft <= 1 && !round.trendCaptured;
          } else if (timeframe === '30s') {
            // 30s rounds end every 30 seconds (at 30s and 60s/0s marks)
            shouldCaptureTrend = timer.timeLeft <= 1 && !round.trendCaptured;
          } else if (timeframe === '1m') {
            // 1m rounds end only every 60 seconds (at minute boundaries)
            // Check current seconds to ensure we're at a minute boundary
            const currentSeconds = new Date().getSeconds();
            const isMinuteBoundary = currentSeconds <= 1 || currentSeconds >= 59;
            shouldCaptureTrend = timer.timeLeft <= 1 && !round.trendCaptured && isMinuteBoundary;
          }
          
          if (shouldCaptureTrend && round.openPrice) {
            newRounds[timeframe].status = 'closed';
            newRounds[timeframe].trendCaptured = true;
            
            console.log(`🎯 Round ended for ${timeframe} round #${timer.roundNumber} - capturing trend (timeLeft: ${timer.timeLeft}, currentSeconds: ${new Date().getSeconds()})`);
            
            // Calculate if multiple timeframes are ending simultaneously
            const currentTime = new Date();
            const currentSeconds = currentTime.getSeconds();
            
            // Check if this is a synchronized ending point
            const isSyncPoint = currentSeconds % 30 === 0 || timer.timeLeft <= 1;
            const isMinuteBoundary = currentSeconds === 0 || timer.timeLeft <= 1;
            
            // For synchronized endings, use a common reference price
            let syncedOpenPrice = round.openPrice;
            let syncedClosePrice = round.closePrice || currentPrice;
            
            // Synchronize pricing for overlapping timeframes
            if (isSyncPoint && (timeframe === '15s' || timeframe === '30s')) {
              // Both 15s and 30s should use the same 30-second reference period
              const thirtySecondRound = newRounds['30s'];
              if (thirtySecondRound && thirtySecondRound.openPrice) {
                syncedOpenPrice = thirtySecondRound.openPrice;
                console.log(`🔄 [${timeframe}] Using synchronized pricing: open=${syncedOpenPrice} (from 30s round)`);
              }
            }
            
            // For 1-minute rounds, synchronize with 30s rounds for consistent measurement
            if (isMinuteBoundary && timeframe === '1m') {
              // 1m should measure the same period as 2x 30s rounds combined
              // Use the 1m round's own open price, but ensure it started at minute boundary
              const oneMinuteRound = newRounds['1m'];
              if (oneMinuteRound && oneMinuteRound.openPrice) {
                syncedOpenPrice = oneMinuteRound.openPrice;
                console.log(`🔄 [${timeframe}] Using 1m round pricing: open=${syncedOpenPrice} (full minute from ${oneMinuteRound.startTime})`);
              }
            }
            
            // Capture trend for 15s timeframe when round actually ends
            if (timeframe === '15s') {
              console.log(`🔥 About to capture 15s trend for round #${timer.roundNumber}: open=${syncedOpenPrice}, close=${syncedClosePrice}`);
              console.log(`📊 [15s] Round details: startTime=${round.startTime}, currentTime=${new Date()}`);
              // Add a delay to ensure trend appears after countdown timer reaches 0
              setTimeout(() => {
                captureTrendFor15s(timer.roundNumber, syncedOpenPrice, syncedClosePrice);
              }, 1500); // 1.5 second delay to ensure timer completes
            }
            
            // Capture trend for 30s timeframe when round actually ends
            if (timeframe === '30s') {
              console.log(`🔥 About to capture 30s trend for round #${timer.roundNumber}: open=${syncedOpenPrice}, close=${syncedClosePrice}`);
              console.log(`📊 [30s] Round details: startTime=${round.startTime}, currentTime=${new Date()}`);
              // Add a delay to ensure trend appears after countdown timer reaches 0
              setTimeout(() => {
                captureTrendFor30s(timer.roundNumber, syncedOpenPrice, syncedClosePrice);
              }, 1500); // 1.5 second delay to ensure timer completes
            }
            
            // Capture trend for 1m timeframe when round actually ends
            if (timeframe === '1m') {
              console.log(`🔥 About to capture 1m trend for round #${timer.roundNumber}: open=${syncedOpenPrice}, close=${syncedClosePrice}`);
              console.log(`📊 [1m] Round details: startTime=${round.startTime}, currentTime=${new Date()}, duration=${((new Date() - new Date(round.startTime)) / 1000).toFixed(1)}s`);
              // Add a delay to ensure trend appears after countdown timer reaches 0
              setTimeout(() => {
                captureTrendFor1m(timer.roundNumber, syncedOpenPrice, syncedClosePrice);
              }, 1500); // 1.5 second delay to ensure timer completes
            }
          }
          
          // Debug: Log timer status for all timeframes with completion check details
          if (timeframe === '15s') {
            console.log(`⏰ [15s Debug] Round #${timer.roundNumber}: timeLeft=${timer.timeLeft}, canBet=${timer.canBet}, trendCaptured=${round.trendCaptured}, status=${newRounds[timeframe].status}`);
          }
          
          if (timeframe === '30s') {
            console.log(`⏰ [30s Debug] Round #${timer.roundNumber}: timeLeft=${timer.timeLeft}, canBet=${timer.canBet}, trendCaptured=${round.trendCaptured}, status=${newRounds[timeframe].status}`);
          }
          
          if (timeframe === '1m') {
            const currentSeconds = new Date().getSeconds();
            const isMinuteBoundary = currentSeconds <= 1 || currentSeconds >= 59;
            console.log(`⏰ [1m Debug] Round #${timer.roundNumber}: timeLeft=${timer.timeLeft}, currentSeconds=${currentSeconds}, isMinuteBoundary=${isMinuteBoundary}, canBet=${timer.canBet}, trendCaptured=${round.trendCaptured}, status=${newRounds[timeframe].status}`);
          }
        }
      });
      
      return newRounds;
    });
  }, [calculateMultiBattleTimers, captureTrendFor15s, captureTrendFor30s, captureTrendFor1m]);

  // Add bet to specific timeframe round
  const addBetToRound = useCallback((timeframe, bet) => {
    setBettingRounds(prevRounds => {
      const newRounds = { ...prevRounds };
      const round = newRounds[timeframe];
      
      if (round && round.status === 'active') {
        newRounds[timeframe] = {
          ...round,
          activeBets: [...round.activeBets, { ...bet, timeframe }]
        };
        
        console.log(`💰 Added ${bet.direction} bet of ${bet.amount} to ${timeframe} round #${round.currentRound}`);
      }
      
      return newRounds;
    });
  }, []);

  // 🎯 NEW: Individual Betting Helper Functions
  const createIndividualBet = useCallback((direction, amount, timeframe, currentPrice) => {
    const now = new Date();
    const duration = timeframe === '15s' ? 15000 : timeframe === '30s' ? 30000 : 60000;
    const endTime = new Date(now.getTime() + duration);
    
    const newBet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      direction,
      amount,
      timeframe,
      startTime: now,
      endTime,
      startPrice: currentPrice,
      endPrice: null,
      status: 'active',
      result: null,
      payout: 0
    };
    
    console.log(`🎯 Created individual ${timeframe} bet:`, newBet);
    return newBet;
  }, []);

  const startIndividualTimer = useCallback((bet) => {
    // Prevent React StrictMode from creating duplicate timers
    if (activeTimersRef.current.has(bet.id)) {
      console.log(`🛡️ Timer for bet ${bet.id} already active, preventing duplicate`);
      return;
    }
    
    activeTimersRef.current.add(bet.id);
    
    const duration = bet.timeframe === '15s' ? 15000 : bet.timeframe === '30s' ? 30000 : 60000;
    const endTime = bet.endTime.getTime();
    
    // Update user timer
    setUserTimer({
      timeLeft: Math.ceil((endTime - Date.now()) / 1000),
      isActive: true,
      betId: bet.id,
      timeframe: bet.timeframe,
      status: 'betting',
      betPrice: bet.startPrice
    });

    // Start countdown
    const countdown = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((endTime - now) / 1000);
      
      if (remaining <= 0) {
        clearInterval(countdown);
        // Remove from active timers
        activeTimersRef.current.delete(bet.id);
        setUserTimer(prev => ({ ...prev, timeLeft: 0, status: 'resolving' }));
        // Resolve the bet
        setTimeout(() => resolveIndividualBet(bet.id), 500);
      } else {
        setUserTimer(prev => ({ ...prev, timeLeft: remaining }));
      }
    }, 1000);

    console.log(`⏰ Started ${bet.timeframe} countdown for bet ${bet.id}`);
  }, []);

  const resolveIndividualBet = useCallback((betId) => {
    const currentPrice = latestPriceRef.current;
    if (!currentPrice) return;

    // Check if this bet has already been resolved (React StrictMode protection)
    if (resolvedBetIdsRef.current.has(betId)) {
      console.log(`🛡️ Bet ${betId} already processed, preventing React StrictMode duplicate`);
      return;
    }

    // Mark this bet as being resolved
    resolvedBetIdsRef.current.add(betId);
    
    setIndividualBets(prevBets => {
      const betIndex = prevBets.findIndex(bet => bet.id === betId);
      if (betIndex === -1) return prevBets;

      const bet = prevBets[betIndex];
      
      // Double-check if bet is already resolved 
      if (bet.status === 'completed') {
        console.log(`⚠️ Bet ${betId} already resolved, skipping duplicate resolution`);
        return prevBets;
      }
      
      const priceChange = currentPrice - bet.startPrice;
      let result = 'tie';
      let payout = bet.amount; // Return original amount for tie
      
      if (priceChange > 0 && bet.direction === 'up') {
        result = 'win';
        payout = Math.floor(bet.amount * 1.975); // 97.5% profit
      } else if (priceChange < 0 && bet.direction === 'down') {
        result = 'win';
        payout = Math.floor(bet.amount * 1.975); // 97.5% profit
      } else if (priceChange !== 0) {
        result = 'loss';
        payout = 0; // Lose everything
      }

      const resolvedBet = {
        ...bet,
        endPrice: currentPrice,
        status: 'completed',
        result,
        payout
      };

      console.log(`🎯 Resolved ${bet.timeframe} bet ${betId}: ${bet.direction.toUpperCase()} | ${bet.startPrice} → ${currentPrice} | ${result.toUpperCase()} | $${payout}`);

      // Update balance ONLY if not already updated for this bet
      if (payout > 0 && !balanceUpdatedBetsRef.current.has(betId)) {
        balanceUpdatedBetsRef.current.add(betId);
        setBalance(prevBalance => {
          console.log(`💰 [WIN PAYOUT] Adding $${payout} to balance: $${prevBalance} → $${prevBalance + payout}`);
          return prevBalance + payout;
        });
      } else if (payout > 0) {
        console.log(`🛡️ Balance already updated for bet ${betId}, skipping duplicate payout`);
      }

      // Show popups and play audio
      if (result === 'win') {
        audio.playWinSound();
        setPopupResult({
          type: 'win',
          amount: payout - bet.amount,
          openPrice: bet.startPrice,
          closePrice: currentPrice
        });
        setShowResultPopup(true);
        setTimeout(() => {
          setShowResultPopup(false);
          setPopupResult(null);
        }, 3000);
      } else if (result === 'loss') {
        audio.playLoseSound();
        setPopupResult({
          type: 'loss',
          amount: bet.amount,
          openPrice: bet.startPrice,
          closePrice: currentPrice
        });
        setShowResultPopup(true);
        setTimeout(() => {
          setShowResultPopup(false);
          setPopupResult(null);
        }, 3000);
      }

      // Reset user timer
      setUserTimer({
        timeLeft: 0,
        isActive: false,
        betId: null,
        timeframe: null,
        status: 'ready'
      });

      // Add resolved bet to betting history
      const historyEntry = {
        ...resolvedBet,
        placedAt: bet.startTime,
        resolvedAt: new Date(),
        actualTrend: priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'same'
      };
      
      setBettingHistory(prevHistory => {
        const exists = prevHistory.some(historyBet => 
          historyBet.id === bet.id || 
          (historyBet.placedAt.getTime() === bet.startTime.getTime() && 
           historyBet.direction === bet.direction && 
           historyBet.amount === bet.amount)
        );
        
        if (exists) {
          console.log(`⚠️ Bet ${bet.id} already exists in history, skipping duplicate`);
          return prevHistory;
        }
        
        return [historyEntry, ...prevHistory.slice(0, 49)];
      });

      // Update the bet in the array
      const newBets = [...prevBets];
      newBets[betIndex] = resolvedBet;
      
      return newBets;
    });
    
    // Clean up tracking after a delay to ensure all processing is complete
    setTimeout(() => {
      resolvedBetIdsRef.current.delete(betId);
      balanceUpdatedBetsRef.current.delete(betId);
    }, 2000);
  }, [audio, setBalance, setBettingHistory]);

  // 🎯 NEW: Individual bet placement function
  const placeIndividualBet = useCallback((direction) => {
    // Check if user already has an active individual bet
    if (userTimer.isActive) {
      alert(`You already have an active ${userTimer.timeframe} bet! Please wait for it to complete.`);
      return;
    }

    // Ensure user interaction is detected
    if (!audio.hasUserInteracted) {
      console.log('🎵 Enabling audio interaction through bet placement');
      audio.forceEnableInteraction();
    }
    
    // Validation checks
    if (betAmount <= 0 || betAmount > balance) {
      alert(`Invalid bet amount. Please enter an amount between 1 and ${balance}`);
      return;
    }

    const currentPrice = data[data.length - 1]?.value;
    if (!currentPrice) {
      alert('Please wait for price data to load');
      return;
    }

    // Create individual bet
    const newBet = createIndividualBet(direction, betAmount, selectedBattlePeriod, currentPrice);
    
    // Deduct balance immediately
    setBalance(prevBalance => {
      console.log(`💰 [INDIVIDUAL BET] Deducting $${betAmount} from balance: $${prevBalance} → $${prevBalance - betAmount}`);
      return prevBalance - betAmount;
    });
    
    // Add to individual bets array
    setIndividualBets(prevBets => [...prevBets, newBet]);
    
    // Start the countdown timer
    startIndividualTimer(newBet);
    
    // Play bet sound
    audio.playBetSound();
    
    console.log(`🎯 Individual ${selectedBattlePeriod} bet placed: ${direction.toUpperCase()} - $${betAmount} at $${currentPrice}`);
    
  }, [userTimer, audio, betAmount, balance, data, selectedBattlePeriod, createIndividualBet, startIndividualTimer, setBalance, setIndividualBets]);

  // Betting functions
  const placeBet = (direction) => {
    // 🎯 NEW: Individual betting for all timeframes (15s, 30s, 1m)
    if (selectedBattlePeriod === '15s' || selectedBattlePeriod === '30s' || selectedBattlePeriod === '1m') {
      placeIndividualBet(direction);
      return; // Explicitly return to prevent old system from running
    }
    
    // Old synchronized betting system removed - now using individual betting for all timeframes
    console.warn(`⚠️ Fallback: ${selectedBattlePeriod} should use individual betting system`);
  };



  // Derived constants with dynamic length based on timeframe
  const currentConfig = TIMEFRAME_CONFIG[selectedTimeframe];
  const width = chartWidth;
  const height = 270;
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
  
  // More balanced dynamic Y-axis scaling for smoother charts
  let targetRange;
  switch (selectedTimeframe) {
    case '1s':
      targetRange = Math.max(originalRange, 30); // Keep 1s as is
      break;
    case '15s':
      targetRange = Math.max(originalRange, 50); // Reduced from 100 for smoother look
      break;
    case '30s':
      targetRange = Math.max(originalRange, 70); // Reduced from 150 for smoother look
      break;
    case '1m':
      targetRange = Math.max(originalRange, 100); // Reduced from 200 for smoother look
      break;
    default:
      targetRange = Math.max(originalRange, 50);
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
      directionClass: isUpFlag ? 'up' : isDownFlag ? 'down' : 'even',
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

  // Get current timeframe trends for display
  const currentTimeframeTrends = useMemo(() => {
    const trends = trendHistory[selectedBattlePeriod] || [];
    console.log(`📊 [Display] Showing ${trends.length} trends for ${selectedBattlePeriod} timeframe`);
    return trends;
  }, [trendHistory, selectedBattlePeriod]);

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

  // Auto-scroll effect for smooth chart movement (like 1s chart)
  useEffect(() => {
    if (data.length > 0) {
      const maxPoints = TIMEFRAME_CONFIG[selectedTimeframe]?.dataPoints || 60;
      if (data.length > maxPoints * 0.8) { // Start scrolling when 80% full
        const excessPoints = data.length - maxPoints;
        const scrollAmount = excessPoints * pointSpacing * 0.5; // Smooth scroll
        setScrollOffset(scrollAmount);
      } else {
        setScrollOffset(0); // Reset scroll for new data
      }
    }
  }, [data.length, selectedTimeframe, pointSpacing]);

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
        
        // Only resolve bets in fallback mode if SignalR is disconnected (new multi-timeframe system handles this automatically)
        // The betting rounds effect will handle resolution automatically when rounds close
        
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
        
        console.log(`📊 [SignalR] Received candle data: ${msg.data.trend.toUpperCase()} (${msg.data.openPrice} → ${msg.data.closePrice}) [${candleId}]`);
        
        // Trend generation removed - will be rebuilt with proper timeframe-specific logic
        
        // Betting resolution is now handled automatically by the multi-timeframe betting rounds effect
        // No manual resolution needed here as rounds close automatically based on timers
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

  // Multi-timeframe battle timer useEffect - runs every second to update all timers
  useEffect(() => {
    // Initial timer calculation for all timeframes
    updateBattleTimers();
    
    // Set up interval to update all timers every second
    battleTimerRef.current = setInterval(() => {
      updateBattleTimers();
    }, 1000);
    
    return () => {
      if (battleTimerRef.current) {
        clearInterval(battleTimerRef.current);
      }
    };
  }, [selectedBattlePeriod, updateBattleTimers]);

  // Multi-timeframe betting rounds effect - updates when price changes
  useEffect(() => {
    if (data && data.length > 0) {
      const currentPrice = data[data.length - 1].value;
      updateBettingRounds(currentPrice);
    }
  }, [data, updateBettingRounds]); // Simplified dependencies





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
      <div className="btc-timeframe-controls">
        <span className="btc-timeframe-label">
          Time:
        </span>
        
        {['1s', '15s', '30s', '1m'].map((timeframe) => (
          <button
            key={timeframe}
            onClick={() => setSelectedTimeframe(timeframe)}
            className={`btc-timeframe-button ${selectedTimeframe === timeframe ? 'active' : ''}`}
          >
            {timeframe}
          </button>
        ))}
      </div>
      
      {/* Add spacing between price and chart */}
      <div style={{ marginTop: '50px' }}>
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
                x1={LEFT_LABEL_WIDTH}
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

        {/* Time-based price labels - HIDDEN FOR CLEANER CHART APPEARANCE */}
        {/* Commented out to remove messy price labels from chart as requested */}

        {/* Time axis labels at bottom - HIDDEN FOR CLEANER UI */}

        {/* Bet Price Line and Label - Show when user has active bet */}
        {userTimer.isActive && userTimer.betPrice && (
          <g className="bet-price-indicator">
            {/* Horizontal dotted line at bet price */}
            <line
              x1="95"
              x2={width - RIGHT_LABEL_WIDTH}
              y1={scaleY(userTimer.betPrice)}
              y2={scaleY(userTimer.betPrice)}
            />
            {/* Bet price label */}
            <g>
              <rect
                x="20"
                y={scaleY(userTimer.betPrice) - 10}
                width="90"
                height="20"
                rx="4"
              />
              <text
                x="57"
                y={scaleY(userTimer.betPrice)}
              >
                {userTimer.betPrice.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </text>
            </g>
          </g>
        )}
   
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

      {/* Battle Timer Display - Above everything */}
      <div className="btc-timer-container">
        <div className={`btc-timer-display ${
          // Show individual timer for all timeframes (15s, 30s, 1m)
          (selectedBattlePeriod === '15s' || selectedBattlePeriod === '30s' || selectedBattlePeriod === '1m') && userTimer.isActive
            ? (userTimer.timeLeft <= 3 ? 'blocked' : 'can-bet')
            : (battleTimer.canBet ? 'can-bet' : 'blocked')
        } ${
          (selectedBattlePeriod === '15s' || selectedBattlePeriod === '30s' || selectedBattlePeriod === '1m') && !userTimer.isActive ? 'ready-to-bet' : ''
        } ${
          userTimer.isActive && userTimer.betId ? (() => {
            const currentBet = individualBets.find(bet => bet.id === userTimer.betId);
            return currentBet?.direction === 'up' ? 'bet-up-active' : currentBet?.direction === 'down' ? 'bet-down-active' : '';
          })() : ''
        }`}>
          {/* Progress Bar */}
          <div 
            className={`btc-timer-progress ${
              selectedBattlePeriod === '15s' && userTimer.isActive
                ? (userTimer.timeLeft <= 3 ? 'blocked' : 'can-bet')
                : (battleTimer.timeLeft <= 3 ? 'blocked' : 'can-bet')
            } ${
              userTimer.isActive && userTimer.betId ? (() => {
                const currentBet = individualBets.find(bet => bet.id === userTimer.betId);
                return currentBet?.direction === 'up' ? 'bet-up-progress' : currentBet?.direction === 'down' ? 'bet-down-progress' : '';
              })() : ''
            }`}
            style={{
              width: (() => {
                const totalTime = selectedBattlePeriod === '15s' ? 15 : 
                                selectedBattlePeriod === '30s' ? 30 : 60;
                
                // For all individual betting timeframes: show progress only when bet is active
                if (selectedBattlePeriod === '15s' || selectedBattlePeriod === '30s' || selectedBattlePeriod === '1m') {
                  if (userTimer.isActive) {
                    const progress = (userTimer.timeLeft / totalTime) * 100;
                    return `${Math.max(0, Math.min(100, progress))}%`;
                  } else {
                    // No active bet - show full yellow bar to indicate ready
                    return '100%';
                  }
                }
                
                // Use synchronized timer for 30s and 1m
                const progress = (battleTimer.timeLeft / totalTime) * 100;
                return `${Math.max(0, Math.min(100, progress))}%`;
              })()
            }}
          ></div>
          {/* Timer Text */}
          <span className={`btc-timer-text ${
            (selectedBattlePeriod === '15s' || selectedBattlePeriod === '30s' || selectedBattlePeriod === '1m') && !userTimer.isActive ? 'ready-state' : ''
          } ${
            userTimer.isActive && userTimer.betId ? (() => {
              const currentBet = individualBets.find(bet => bet.id === userTimer.betId);
              return currentBet?.direction === 'up' ? 'bet-up' : currentBet?.direction === 'down' ? 'bet-down' : '';
            })() : ''
          }`}>
            {/* Show different messages based on timeframe and bet status */}
            {(selectedBattlePeriod === '15s' || selectedBattlePeriod === '30s' || selectedBattlePeriod === '1m')
              ? (userTimer.isActive 
                  ? (() => {
                      const currentBet = individualBets.find(bet => bet.id === userTimer.betId);
                      if (currentBet?.direction === 'up') {
                        return `Bullish move locked – ${userTimer.timeLeft}s remaining`;
                      } else if (currentBet?.direction === 'down') {
                        return `Bearish move locked – ${userTimer.timeLeft}s remaining`;
                      } else {
                        return `Your ${selectedBattlePeriod} bet: ${userTimer.timeLeft}s remaining`;
                      }
                    })()
                  : `Ready – Start ${selectedBattlePeriod} cycle!`)
              : battleTimer.message
            }
          </span>
        </div>
      </div>

      {/* Battle Period + Betting Interface Row */}
      <div className="btc-control-row">

        {/* Battle Period Selection Panel - Left Side */}
        <div className="btc-battle-period-container">
          <span className="btc-battle-period-label">
            Battle Timer:
          </span>
          
          {/* Battle Period Buttons */}
          {['15s', '30s', '1m'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedBattlePeriod(period)}
              className={`btc-period-button ${selectedBattlePeriod === period ? 'active' : ''} ${
                userTimer.isActive ? 'disabled' : ''
              }`}
              disabled={userTimer.isActive}
            >
              {period === '15s' ? '15SEC' : period === '30s' ? '30SEC' : '1MIN'}
            </button>
          ))}
          

        </div>

        {/* Betting Interface - Right Side */}
        <div className="btc-betting-interface">
          {/* Balance Display */}
          <div className="btc-balance-display">
            <span className="btc-balance-text">
              Balance: {balance}
            </span>
          </div>

          {/* Amount Input */}
          <div className="btc-amount-container">
            <div className="btc-amount-input-wrapper">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="btc-amount-input"
                min="1"
                max={balance}
              />
              <div className="btc-amount-label">
                Amount
              </div>
            </div>
          </div>

          {/* UP/DOWN Buttons */}
          <div className="button-container">
            <button
              className={`button-half up-half ${
                userTimer.isActive ? 'disabled' : ''
              }`}
              onClick={() => placeBet('up')}
              disabled={userTimer.isActive}
            >
              <span className="up-text">UP</span>
            </button>
            <button
              className={`button-half down-half ${
                userTimer.isActive ? 'disabled' : ''
              }`}
              onClick={() => placeBet('down')}
              disabled={userTimer.isActive}
            >
              <span className="down-text">DOWN</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trends Display Container - Below Betting Interface */}
      <div className="btc-trends-full-container">

        {/* Trends display - full width */}
        <div className="btc-trends-container">
          <span className="btc-trends-label">
            {selectedBattlePeriod.toUpperCase()} Trends
          </span>
          
          {/* Display recent trends as compact buttons */}
          {currentTimeframeTrends.slice(0, 12).map((item, idx) => {
            const isLatest = idx === 0 && currentTimeframeTrends.length > 0;
            const trendClass = item.trend === 'up' ? 'up' : item.trend === 'down' ? 'down' : 'draw';
            return (
              <div
                key={`${item.timeframe}-${idx}`}
                className={`btc-trend-button ${trendClass} ${isLatest ? 'latest' : ''}`}
                style={{
                  boxShadow: isLatest 
                    ? `0 0 8px ${item.trend === 'up' ? 'rgba(76, 175, 80, 0.6)' : item.trend === 'down' ? 'rgba(244, 67, 54, 0.6)' : 'rgba(118, 168, 229, 0.6)'}` 
                    : '0 1px 2px rgba(0,0,0,0.2)',
                  animation: isLatest ? 'latestPulse 2s infinite' : 'none',
                  border: isLatest ? '2px solid rgba(255, 255, 255, 0.3)' : 'none'
                }}
              >
                {item.trend.toUpperCase()}
              </div>
            );
          })}
          
          {/* Fill with compact placeholder if not enough history */}
          {Array.from({ length: Math.max(0, 12 - currentTimeframeTrends.length) }, (_, idx) => (
            <div
              key={`placeholder-${idx}`}
              className="btc-trend-button"
              style={{
                backgroundColor: '#333',
                color: '#666',
                opacity: 0.4,
                boxShadow: 'none'
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
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  📊 Trading History
                </h2>
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
              {bettingHistory.length > 0 ? (
                <div>
                  {/* Summary Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
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
                        Ties
                      </div>
                      <div style={{ color: '#76a8e5', fontSize: '18px', fontWeight: '600' }}>
                        {bettingHistory.filter(bet => bet.result === 'tie').length}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
                        Losses
                      </div>
                      <div style={{ color: '#f44336', fontSize: '18px', fontWeight: '600' }}>
                        {bettingHistory.filter(bet => bet.result === 'loss').length}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}>
                        Net P&L
                      </div>
                      <div style={{ 
                        color: bettingHistory.reduce((sum, bet) => sum + (bet.payout - bet.amount), 0) >= 0 ? '#4CAF50' : '#f44336', 
                        fontSize: '18px', 
                        fontWeight: '600' 
                      }}>
                        ${bettingHistory.reduce((sum, bet) => sum + (bet.payout - bet.amount), 0)}
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
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600',
                            color: '#fff',
                            backgroundColor: '#555'
                          }}>
                            {bet.timeframe || '15s'}
                          </div>
                          <div style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#ffffff',
                            backgroundColor: bet.result === 'win' ? '#4CAF50' : bet.result === 'tie' ? '#76a8e5' : '#f44336'
                          }}>
                            {bet.result === 'win' ? 'WIN' : bet.result === 'tie' ? 'EVEN' : 'LOSS'}
                          </div>
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
                          {bet.direction.toUpperCase()} ${bet.amount} | Open Price ${bet.startPrice} → Closing Price ${bet.endPrice}
                        </div>
                        
                        <div style={{
                          color: bet.payout - bet.amount > 0 ? '#4CAF50' : bet.payout - bet.amount < 0 ? '#f44336' : '#888',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {bet.payout - bet.amount > 0 ? '+' : ''}${bet.payout - bet.amount}
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
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
                  <div style={{ fontSize: '18px', marginBottom: '8px' }}>No betting history yet</div>
                  <div style={{ fontSize: '14px' }}>Place your first bet to see your betting history here</div>
                </div>
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

            {/* Price Information */}
            <div className="result-popup-prices">
              Open Price {popupResult.openPrice.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} - Closing Price {popupResult.closePrice.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
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