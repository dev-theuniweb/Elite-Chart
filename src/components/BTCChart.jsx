// src/components/BTCChart.jsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import './BTCChart/styles/index.css';
import bitcoinIcon from '../assets/bitcoin.png';
import bullIcon from '../assets/img/bull.png';
import bearIcon from '../assets/img/bear.png';
import evenIcon from '../assets/img/even.png';
import emptyRoundIcon from '../assets/img/empty-round.png';
import insuredIcon1 from '../assets/img/insured-icon-1.png';
import insuredIcon2 from '../assets/img/insured-icon-2.png';
import { generateShareUrl } from '../utils/shareUtils';
import * as signalR from '@microsoft/signalr';
import useAudio from '../hooks/useAudio';
import html2canvas from 'html2canvas';
import { GAME_MODES, getGameModeById } from '../constants/gameModeConfig';
import TrendGrid from './ui/TrendGrid';
import BattlePassPanel from './ui/BattlePassPanel';

// Constants
const PADDING = 20;
const LEFT_LABEL_WIDTH = 20;
const RIGHT_LABEL_WIDTH = 105;
const CHART_PADDING_RIGHT = 60;
const INITIAL_PRICE = 90000;
const UPPER_THRESHOLD = 120000;
const LOWER_THRESHOLD = 35000;
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

const BTCChart = ({ memberId, betAmount, setBetAmount, selectedTrend, setSelectedTrend, onGameModeChange }) => {
  
  // Raw data storage (always 1-second intervals)
  const [rawData, setRawData] = useState(() => {
    let basePrice = INITIAL_PRICE;
    return Array.from({ length: DATA_LENGTH }, (_, i) => {
      // Small random walk: ±$50 per second (realistic BTC movement)
      basePrice += (Math.random() - 0.5) * 100; // ±$50 change
      return {
        value: basePrice,
        time: new Date(Date.now() - (DATA_LENGTH - i) * 1000),
      };
    });
  });

  // Processed data for display (aggregated based on timeframe)
  const [data, setData] = useState(() => {
    let basePrice = INITIAL_PRICE;
    return Array.from({ length: DATA_LENGTH }, (_, i) => {
      // Small random walk: ±$50 per second (realistic BTC movement)
      basePrice += (Math.random() - 0.5) * 100; // ±$50 change
      return {
        value: basePrice,
        time: new Date(Date.now() - (DATA_LENGTH - i) * 1000),
      };
    });
  });

  // State and refs
  const [scrollOffset, setScrollOffset] = useState(0);
  const [chartWidth, setChartWidth] = useState(800);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  // Legacy betting state (keeping for backward compatibility)
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
      playEvenSound: () => {},
      stopAllAudio: () => {}
    };
  }
  

  // Airdrop animation system is now triggered via gift box in App.jsx
  
  const intervalRef = useRef(null);
  const chartRef = useRef(null);
  const latestPriceRef = useRef(null);
  const openTimestampRef = useRef(null);
  const signalRConnectionRef = useRef(null);
  // Legacy refs removed - now using bettingRounds state for multi-timeframe support
  const lastProcessedCandleRef = useRef(null);
  
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


  // Mobile keyboard handling
  const [isInputFocused, setIsInputFocused] = useState(false);
  const amountInputRef = useRef(null);
  const buyButtonRef = useRef(null);
  const winPopupRef = useRef(null);

  // Betting freeze for first 5 seconds (prevent betting during price loading)
  const [isBettingAllowed, setIsBettingAllowed] = useState(false);


  // 🎮 Game Mode Selection (NEW)
  const [currentGameMode, setCurrentGameMode] = useState(GAME_MODES.INSURANCE); // Default to Insurance Mode
  const [selectedGameModeKey, setSelectedGameModeKey] = useState('INSURANCE'); // Track mode key for UI
  const [isGameModeDropdownOpen, setIsGameModeDropdownOpen] = useState(false); // Custom dropdown state
  
  // Chart type selection state (Elite or Pro)
  const [selectedChartType, setSelectedChartType] = useState('elite'); // 'elite' or 'pro'
  
  // Timeframe selection state for chart display (always 1s for Elite chart)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1s'); // '1s', '15s', '30s', '1m'

  // 🎯 NEW: 90s Three-Phase Betting System
  const [individualBets, setIndividualBets] = useState([]); // Array to track individual user bets
  const [userTimer, setUserTimer] = useState({
    timeLeft: 90, // Countdown from 90s to 0
    isActive: false,
    betId: null,
    direction: null, // 'up' or 'down'
    status: 'ready', // 'ready', 'betting', 'resolving'
    // Price tracking for 3 phases
    startPrice: null,
    price30s: null,
    price60s: null,
    price90s: null,
    // Phase results
    phase30sResult: null, // 'up', 'down', or null
    phase60sResult: null,
    phase90sResult: null,
    // Timestamp tracking
    startTime: null,
    time30s: null,
    time60s: null,
    time90s: null
  });
  
  // Track resolved bet IDs to prevent React StrictMode duplicates
  const resolvedBetIdsRef = useRef(new Set());
  
  // Track active timers to prevent React StrictMode duplicates
  const activeTimersRef = useRef(new Set());
  
  // Track balance updates to prevent duplicates
  const balanceUpdatedBetsRef = useRef(new Set());
  
  // ✅ Track current price for timer without causing re-renders
  const currentPriceRef = useRef(null);
  
  // ✅ Track last logged price to avoid duplicate logs
  const lastLoggedPriceRef = useRef(null);

  // Center connection status message state
  const [showCenterConnectionStatus, setShowCenterConnectionStatus] = useState(true);
  const connectionStatusTimeoutRef = useRef(null);

  // 🎮 NEW: Game Engine Integration
  // Use local state for memberId only if not provided as prop
  const [localMemberId, setLocalMemberId] = useState('');
  const effectiveMemberId = memberId || localMemberId; // Prioritize prop over local state
  const setMemberId = memberId ? undefined : setLocalMemberId; // Only allow setting if not controlled by parent
  
  const [isGameEngineConnected, setIsGameEngineConnected] = useState(false);
  const [gameEngineConnection, setGameEngineConnection] = useState(null);
  const gameEngineConnectionRef = useRef(null);
  const [currentOrder, setCurrentOrder] = useState(null); // Track active order
  const [orderResults, setOrderResults] = useState({
    round1Result: null,
    round2Result: null,
    round3Result: null,
    round1Price: 0,
    round2Price: 0,
    round3Price: 0
  });
  
  // Insurance state - store transactionId and guid for insurance purchase
  const [orderTransactionData, setOrderTransactionData] = useState({
    transactionId: null,
    guid: null
  });
  const [isInsurancePurchased, setIsInsurancePurchased] = useState(false);
  
  // Insurance data from backend (Section 1 & 2)
  const [insuranceData, setInsuranceData] = useState({
    section1: {
      isInsured: false,
      id: null,
      percent: 0,
      amount: 0
    },
    section2: {
      isInsured: false,
      id: null,
      percent: 0,
      amount: 0
    }
  });
  
  // Insurance notification - single message only
  const [currentInsuranceMessage, setCurrentInsuranceMessage] = useState(null);
  const [isInsuranceFadingOut, setIsInsuranceFadingOut] = useState(false);
  const [purchasedInsurances, setPurchasedInsurances] = useState(new Set()); // Track which insurances are purchased (e.g., "Section 1", "Section 2")
  const insuranceTimeoutRef = useRef(null);
  
  // Rotating title for phase icons panel
  const [phaseTitle, setPhaseTitle] = useState('Trend Incoming...');
  const phaseTitles = ['Trend Incoming...', 'Market Pulse...', 'Bull Bear Clashing...'];

  // 🎮 Battle Pass State (for Battle Mode)
  const [battlePassWinnings, setBattlePassWinnings] = useState(0); // Track total winnings for the day
  const [activeBattlePasses, setActiveBattlePasses] = useState([]); // ['daily', 'weekly', 'monthly']

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
      
      // ✅ Only log when price actually changes (reduces duplicate logs)
      if (newPrice !== lastLoggedPriceRef.current && updatedRawData.length % 5 === 0) {
        console.log(`📊 Price: $${newPrice.toLocaleString()} | Total points: ${updatedRawData.length}`);
        lastLoggedPriceRef.current = newPrice;
      }
      return updatedRawData;
    });
    
    // Update betting rounds with new price - but we need to make sure dependencies are available
    // This will be called from an effect that has access to updateBettingRounds
  }, []);

  // Popup state for bet results
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [popupResult, setPopupResult] = useState(null); // { type: 'win' | 'loss', amount: number, totalWinnings?: number }
  const [animatedAmount, setAnimatedAmount] = useState(0); // Animated counter value
  const processedOrderIdRef = useRef(null); // Track processed order to prevent duplicate modals

  // Betting interface state
  const [balance, setBalance] = useState(2000);
  // betAmount and selectedTrend are now controlled by parent via props
  const [selectedBet, setSelectedBet] = useState(null); // 'up' or 'down'
  // Legacy activeBets state removed - now using bettingRounds.{timeframe}.activeBets for each timeframe
  const [bettingHistory, setBettingHistory] = useState([]); // Track betting results
  
  // Dynamic trends from API
  const [trendsList, setTrendsList] = useState([]);
  const [payoutPercent, setPayoutPercent] = useState(null);
  const [minAmount, setMinAmount] = useState('10.00');
  const [maxAmount, setMaxAmount] = useState('100.00');
  const [payoutData, setPayoutData] = useState({}); // Store payout multipliers mapped to trend codes
  const [currentPayoutText, setCurrentPayoutText] = useState(null); // Store dynamic payout text from OrderUpdate (e.g., "7.1 X × 4.9 X × 3.4")
  const [isPayoutRefreshing, setIsPayoutRefreshing] = useState(false); // Track if payout is being refreshed (block betting during :57-:03)

  // Legacy ref synchronization removed - using bettingRounds state instead

  // Function to handle insurance purchase
  const buyInsurance = useCallback((insurance) => {
    const insuranceCost = parseFloat(insurance.messageContent);
    
    // Check if already purchased
    if (purchasedInsurances.has(insurance.subType)) {
      console.log(`⚠️ [INSURANCE] Already purchased for ${insurance.subType}`);
      return;
    }
    
    // Check if user has enough balance
    if (balance < insuranceCost) {
      console.log(`⚠️ [INSURANCE] Insufficient balance. Need ${insuranceCost} GMCHIP`);
      return;
    }
    
    // Deduct balance (demo mode - no backend call)
    setBalance(prevBalance => {
      console.log(`🛡️ [INSURANCE DEMO] Purchasing ${insurance.subType} for ${insuranceCost} GMCHIP`);
      console.log(`💰 Balance: ${prevBalance} → ${prevBalance - insuranceCost}`);
      return prevBalance - insuranceCost;
    });
    
    // Mark as purchased
    setPurchasedInsurances(prev => {
      const updated = new Set([...prev, insurance.subType]);
      console.log(`🛡️ [INSURANCE] Purchased insurances: ${Array.from(updated).join(', ')}`);
      return updated;
    });
    
    // Dismiss the insurance offer message after purchase
    setIsInsuranceFadingOut(true);
    setTimeout(() => {
      setCurrentInsuranceMessage(null);
      setIsInsuranceFadingOut(false);
      if (insuranceTimeoutRef.current) {
        clearTimeout(insuranceTimeoutRef.current);
        insuranceTimeoutRef.current = null;
      }
    }, 200);
    
    console.log(`✅ [INSURANCE DEMO] ${insurance.subType} purchased successfully (demo mode)`);
  }, [balance, purchasedInsurances]);

  // 🎯 NEW: 90s Three-Phase Betting Function
  const placeBet = (direction) => {
    // Check if betting is allowed
    if (!isBettingAllowed) {
      alert('Please wait for price to stabilize before placing bets...');
      return;
    }

    // Check if user already has an active bet
    if (userTimer.isActive) {
      alert('You already have an active bet! Please wait for it to complete.');
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

    // Deduct balance immediately
    setBalance(prevBalance => {
      console.log(`💰 [90s BET] Deducting $${betAmount} from balance: $${prevBalance} → $${prevBalance - betAmount}`);
      return prevBalance - betAmount;
    });
    
    // Clear any previous insurance purchases
    setPurchasedInsurances(new Set());
    
    // Start 90s timer with 3 phases
    const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setUserTimer({
      timeLeft: 90,
      isActive: true,
      betId,
      direction,
      status: 'active',
      startPrice: currentPrice,
      betPrice: currentPrice, // For bet price indicator line
      price30s: null,
      price60s: null,
      price90s: null,
      phase30sResult: null,
      phase60sResult: null,
      phase90sResult: null,
      startTime: new Date(),
      time30s: null,
      time60s: null,
      time90s: null
    });
    
    // Play bet sound
    audio.playBetSound();
    
    console.log(`🎯 90s bet placed: ${direction.toUpperCase()} - $${betAmount} at $${currentPrice} [${betId}]`);
  };



  // Derived constants with dynamic length based on timeframe
  const currentConfig = TIMEFRAME_CONFIG[selectedTimeframe];
  const width = chartWidth;
  const height = 350;
  const centerY = height / 2;

  // 📱 Mobile-responsive label widths
  const leftLabelWidth = isMobile ? 10 : LEFT_LABEL_WIDTH;   // 5px for mobile, 20px for desktop
  const rightLabelWidth = isMobile ? 95 : RIGHT_LABEL_WIDTH; // 60px for mobile, 105px for desktop

  const latest = data[data.length - 1];
  const prev = data[data.length - 2] || latest;

  // Prevent rendering if data is empty or invalid
  if (!data.length || !latest || !latest.value || isNaN(latest.value)) {
    return (
      <div className="btc-chart-container" ref={chartRef}>
        <div className="waiting-for-price">Waiting for price updates...</div>
      </div>
    );
  }

  // Memoized calculations
  const pointSpacing = useMemo(() => (
    (width - leftLabelWidth - rightLabelWidth) / (data.length - 1)
  ), [width, data.length, leftLabelWidth, rightLabelWidth]);

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
    (i / (data.length - 1)) * (width - leftLabelWidth - rightLabelWidth) +
    leftLabelWidth - scrollOffset
  ), [data.length, width, scrollOffset, leftLabelWidth, rightLabelWidth]);

  const latestX = useMemo(() => {
    // Mobile-aware positioning to match grid line ending
    if (isMobile) {
      return width - rightLabelWidth - 5; // Conservative positioning for mobile
    }
    return width - rightLabelWidth / 2 - CHART_PADDING_RIGHT; // Desktop positioning
  }, [width, rightLabelWidth, isMobile]);

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
    const steps = 7; // number of intervals between top and bottom
    
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
    // Check if user has placed a bet
    const betPrice = userTimer?.betPrice;
    const comparePrice = (betPrice !== undefined && betPrice !== null) ? betPrice : open1Min;
    
    const isUpFlag = comparePrice !== null ? latest.value > comparePrice : false;
    const isDownFlag = comparePrice !== null ? latest.value < comparePrice : false;
    const percentChange = comparePrice !== null 
      ? ((latest.value - comparePrice) / comparePrice) * 100 
      : 0;
    
    // Log when using bet price vs open price
    if (betPrice !== undefined && betPrice !== null) {
      console.log(`🎨 [Price Label] Using BET price: ${betPrice}, Current: ${latest.value}, Class: ${isUpFlag ? 'up' : isDownFlag ? 'down' : 'even'}`);
    }
      
    return {
      isUp: isUpFlag,
      isDown: isDownFlag,
      directionColor: isUpFlag ? '#5acc6d' : isDownFlag ? '#ff4c3e' : '#76a8e5',
      arrow: isUpFlag ? '▲' : isDownFlag ? '▼' : '',
      directionClass: isUpFlag ? 'up' : isDownFlag ? 'down' : 'even',
      formattedPercentChange: percentChange >= 0
        ? `+${percentChange.toFixed(2)}%`
        : `${percentChange.toFixed(2)}%`
    };
  }, [open1Min, latest.value, userTimer?.betPrice]);

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
  useEffect(() => {
    if (memberId) {
      connectToGameEngine().then();
    }
  }, [memberId]);
  
  // ✅ Optimized: Aggregate data with reduced logging and smart updates
  useEffect(() => {
    const config = TIMEFRAME_CONFIG[selectedTimeframe];
    if (!config || !rawData.length) return;
    
    // Use the new hierarchical aggregation system
    const newData = getHierarchicalData(rawData, selectedTimeframe);
    
    setData(newData);
    
    // ✅ Update current price ref for timer
    if (newData.length > 0) {
      currentPriceRef.current = newData[newData.length - 1].value;
    }
    
    // ✅ Reduced logging - only log occasionally to reduce performance impact
    if (rawData.length % 10 === 0) {
      console.log(`📊 Chart updated: ${newData.length} points for ${selectedTimeframe} timeframe`);
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
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    latestPriceRef.current = latest.value;
  }, [latest.value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isGameModeDropdownOpen && !event.target.closest('.btc-game-mode-selector')) {
        setIsGameModeDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isGameModeDropdownOpen]);

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

  // Enable betting after 5 seconds (allow price to stabilize)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBettingAllowed(true);
      console.log('🎯 Betting enabled - price has stabilized');
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, []);
  
  // Check every second if we're in payout refresh window (:57-:03)
  useEffect(() => {
    const checkPayoutRefresh = () => {
      const now = new Date();
      const seconds = now.getSeconds();
      
      // Block betting during :57, :58, :59, :00, :01, :02, :03 (7-second window)
      const isRefreshWindow = seconds >= 57 || seconds <= 3;
      
      if (isRefreshWindow !== isPayoutRefreshing) {
        setIsPayoutRefreshing(isRefreshWindow);
        if (isRefreshWindow) {
          console.log('🔄 Payout refreshing - betting blocked');
        } else {
          console.log('✅ Payout refresh complete - betting enabled');
        }
      }
    };
    
    // Check immediately and then every second
    checkPayoutRefresh();
    const interval = setInterval(checkPayoutRefresh, 1000);
    
    return () => clearInterval(interval);
  }, [isPayoutRefreshing]);
  
  // Fetch game configuration on mount
  useEffect(() => {
    const fetchGameConfig = async () => {
      try {
        console.log('🎮 [API] Fetching game configuration...');
        const response = await fetch('https://api.iiifleche.io/api/v1/game/get/6', {
          headers: {
            'Authorization': 'Bearer DLn9rzEE_P-HTIufFKOn-SbpwBGw54SRm4c2jZUwWDykQGGfId2CV51Tpaa7QyaCu2-OHJcuQOokIpkCr7Gw71tPCnOg_tC_ylXB-2HnuAd5b5MHcOsICMVrlxvjZJSZqi27uuCBYZrapJgG1gtejUaZmqRVSLebZw9_1Shkbq3ze2Q10uEGVqLiJLLNdpVV5XFMAXVrTnQlJ3-L839KGpV-J9qww5Z-54G3bptL7kSS4cL2ulFLQmTYbLred5aL'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const response_data = await response.json();
        console.log('📊 [API] Game config received:', response_data);
        
        // Extract the actual data from the wrapper
        const data = response_data.Data || response_data;
        console.log('📊 [API] Actual game data:', data);
        
        // Parse trendsName into trend objects
        if (data.trendsName) {
          const trendNames = data.trendsName.split(',').map(t => t.trim());
          console.log('🎯 [API] Trend names:', trendNames);
          
          // Map trend names to codes (AU, SU, MU, QU, AD, SD, MD, QD)
          const trendCodes = ['AU', 'SU', 'MU', 'QU', 'AD', 'SD', 'MD', 'QD'];
          const trendDots = {
            'AU': ['up', 'up', 'up'],
            'SU': ['down', 'up', 'up'],
            'MU': ['up', 'down', 'up'],
            'QU': ['up', 'up', 'down'],
            'AD': ['down', 'down', 'down'],
            'SD': ['down', 'down', 'up'],
            'MD': ['down', 'up', 'down'],
            'QD': ['up', 'down', 'down']
          };
          
          const trendTypes = {
            'AU': 'up', 'SU': 'up', 'MU': 'up', 'QU': 'up',
            'AD': 'down', 'SD': 'down', 'MD': 'down', 'QD': 'down'
          };
          
          const parsedTrends = trendNames.map((name, index) => ({
            code: trendCodes[index],
            label: name,
            dots: trendDots[trendCodes[index]],
            enabled: true,
            type: trendTypes[trendCodes[index]]
          }));
          
          console.log('✅ [API] Parsed trends:', parsedTrends);
          
          // Only use API trends if count matches current game mode
          if (parsedTrends.length === currentGameMode.totalPatterns) {
            setTrendsList(parsedTrends);
            console.log(`✅ [API] Using ${parsedTrends.length} trends from API`);
          } else {
            console.log(`⚠️ [API] Trend count mismatch. API: ${parsedTrends.length}, Game Mode: ${currentGameMode.totalPatterns}. Using game mode patterns.`);
            setTrendsList([]);
          }
        } else {
          console.log('⚠️ [API] No trends in response, using game mode patterns');
          setTrendsList([]);
        }
        
        // Update min/max amounts
        if (data.minAmount) {
          setMinAmount(data.minAmount.toString());
          console.log(`💰 [API] Min amount: ${data.minAmount}`);
        }
        if (data.maxAmount) {
          setMaxAmount(data.maxAmount.toString());
          console.log(`💰 [API] Max amount: ${data.maxAmount}`);
        }
        
        // Store payout percent for future use
        if (data.payoutPercent) {
          setPayoutPercent(data.payoutPercent);
          console.log(`📈 [API] Payout percent: ${data.payoutPercent}%`);
        }
        
        // Parse Payout array and create mapping
        if (data.Payout && Array.isArray(data.Payout) && data.Payout.length > 0) {
          const payoutMapping = {};
          data.Payout.forEach(item => {
            if (item.BetNumber && item.PayoutPercent) {
              payoutMapping[item.BetNumber] = item.PayoutPercent;
            }
          });
          setPayoutData(payoutMapping);
          console.log('💰 [API] Payout multipliers:', payoutMapping);
        } else {
          console.log('⚠️ [API] No Payout array in response');
          setPayoutData({});
        }
        
      } catch (error) {
        console.error('❌ [API] Failed to fetch game config:', error);
        // Use game mode patterns on error (don't override)
        console.log('⚠️ [API] Error fetching config, using game mode patterns');
        setTrendsList([]);
        setPayoutData({});
      }
    };
    
    fetchGameConfig();
  }, []);
  
  // Rotate phase title every 3 seconds
  useEffect(() => {
    // Only rotate if we don't have final results yet
    if (orderResults.round3Result) {
      return;
    }
    
    const interval = setInterval(() => {
      setPhaseTitle(prevTitle => {
        const currentIndex = phaseTitles.indexOf(prevTitle);
        const nextIndex = (currentIndex + 1) % phaseTitles.length;
        return phaseTitles[nextIndex];
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [orderResults.round3Result]);

  // Show final trend result when all 3 rounds complete
  useEffect(() => {
    if (orderResults.round3Result && orderResults.round2Result && orderResults.round1Result) {
      // Determine the trend name based on the actual pattern of results
      const r1 = orderResults.round1Result.toLowerCase();
      const r2 = orderResults.round2Result.toLowerCase();
      const r3 = orderResults.round3Result.toLowerCase();
      
      let finalTrend = 'Complete';
      
      // Map the 3-round pattern to trend names
      if (r1 === 'up' && r2 === 'up' && r3 === 'up') {
        finalTrend = 'Mooning';
      } else if (r1 === 'up' && r2 === 'up' && r3 === 'down') {
        finalTrend = 'Out of Gas';
      } else if (r1 === 'up' && r2 === 'down' && r3 === 'up') {
        finalTrend = 'Rollercoaster';
      } else if (r1 === 'down' && r2 === 'up' && r3 === 'up') {
        finalTrend = 'Comeback';
      } else if (r1 === 'down' && r2 === 'down' && r3 === 'down') {
        finalTrend = 'Dumping';
      } else if (r1 === 'down' && r2 === 'down' && r3 === 'up') {
        finalTrend = 'Lucky Bounce';
      } else if (r1 === 'down' && r2 === 'up' && r3 === 'down') {
        finalTrend = 'Fake Out';
      } else if (r1 === 'up' && r2 === 'down' && r3 === 'down') {
        finalTrend = 'The Trap';
      }
      
      setPhaseTitle(finalTrend);
    }
  }, [orderResults.round3Result, orderResults.round2Result, orderResults.round1Result]);

  // Animate counter for result popup amount
  useEffect(() => {
    if (showResultPopup && popupResult) {
      const duration = 800; // 800ms animation duration
      const steps = 40; // Number of steps for smooth animation
      const stepDuration = duration / steps;
      const increment = popupResult.amount / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setAnimatedAmount(popupResult.amount);
          clearInterval(timer);
        } else {
          setAnimatedAmount(Math.floor(increment * currentStep));
        }
      }, stepDuration);

      // Trigger confetti effect for WIN results
      if (popupResult.type === 'win' && window.confetti) {
        // Play win sound
        audio.playWinSound();
        
        // Initial burst - natural slow falling confetti (matches Valentine card)
        window.confetti({
          particleCount: 300,      // Number of confetti pieces
          spread: 150,             // Wide spread angle
          origin: { y: 0.6 },      // Starting position (60% from top)
          // Using defaults for natural slow fall:
          // gravity: 1 (default)
          // startVelocity: 45 (default)
          // ticks: 200 (default)
        });
      } else if (popupResult.type === 'loss') {
        // Play lose sound
        audio.playLoseSound();
      } else if (popupResult.type === 'tie') {
        // Play even/tie sound
        audio.playEvenSound();
      }

      return () => clearInterval(timer);
    } else {
      setAnimatedAmount(0);
      // Reset confetti when modal closes
      if (window.confetti && window.confetti.reset) {
        window.confetti.reset();
      }
    }
  }, [showResultPopup, popupResult]);

  // 🎮 Game Mode Switching Handler
  const switchGameMode = useCallback((modeKey) => {
    const newMode = GAME_MODES[modeKey];
    if (!newMode) {
      console.error(`Invalid game mode: ${modeKey}`);
      return;
    }
    
    // Check if there's an active bet
    if (currentOrder !== null) {
      alert('Cannot switch game mode while a bet is active. Please wait for the current round to finish.');
      return;
    }
    
    console.log(`🎮 Switching to ${newMode.name} (GameID: ${newMode.id})`);
    setCurrentGameMode(newMode);
    setSelectedGameModeKey(modeKey);
    
    // Reset game-specific state when switching modes
    setSelectedTrend(null);
    setOrderResults({
      round1Result: null,
      round2Result: null,
      round3Result: null,
      round1Price: 0,
      round2Price: 0,
      round3Price: 0
    });
    setPurchasedInsurances(new Set());
    setCurrentInsuranceMessage(null);
    
    // Notify parent component of game mode change - pass both key and mode object
    if (onGameModeChange && typeof onGameModeChange === 'function') {
      onGameModeChange(modeKey, newMode);
    }
  }, [currentOrder, onGameModeChange]);

  // 🎮 Battle Pass - Purchase Handler
  const handlePurchaseBattlePass = useCallback((passType) => {
    // TODO: Implement API call to purchase battle pass with FEFE token
    console.log(`🎟️ Purchasing ${passType} battle pass`);
    
    // For now, just add to active passes
    setActiveBattlePasses(prev => {
      if (!prev.includes(passType)) {
        return [...prev, passType];
      }
      return prev;
    });
    
    alert(`${passType.charAt(0).toUpperCase() + passType.slice(1)} Battle Pass activated! (Coming soon)`);
  }, []);

  // 🎮 Battle Pass - Track winnings (only in Battle Mode)
  useEffect(() => {
    if (currentGameMode.id === 7) { // Battle Mode
      // Reset winnings at 5:00 AM daily
      const now = new Date();
      const resetTime = new Date();
      resetTime.setHours(5, 0, 0, 0);
      
      if (now.getHours() >= 5) {
        resetTime.setDate(resetTime.getDate() + 1);
      }
      
      const timeUntilReset = resetTime - now;
      
      const resetTimer = setTimeout(() => {
        console.log('🔄 Battle Pass reset - New day begins!');
        setBattlePassWinnings(0);
        setActiveBattlePasses([]);
      }, timeUntilReset);
      
      return () => clearTimeout(resetTimer);
    }
  }, [currentGameMode.id]);

  // 🎮 Game Engine SignalR Connection
  const connectToGameEngine = async () => {
    /** REMARK: remove !effectiveMemberId.trim() as will cause error*/
    if (!effectiveMemberId) {
      alert('Please enter Member ID!');
      return;
    }

    try {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`https://ge.iiifleche.io/hubs/order?memberId=${effectiveMemberId}`, {
          withCredentials: false,
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Hub listeners
      connection.on("OrderCreated", (data) => {
        try {
          console.log(`📥 OrderCreated received: ${JSON.stringify(data)}`);
          
          // Check for failure first
          if (data.isSuccess === false) {
            console.log(`❌ Order failed: ${data.message}`);
            alert(`Order failed: ${data.message}`);
            return;
          }
        
        // Process successful order (isSuccess = true or undefined means success)
        console.log(`✅ Order created successfully`);
        
        // 💾 Save transactionId and orderGuid for insurance
        if (data.transactionId && data.orderGuid) {
          setOrderTransactionData({
            transactionId: data.transactionId,
            guid: data.orderGuid
          });
          setIsInsurancePurchased(false); // Reset insurance status for new order
          console.log(`💾 Saved transaction data - ID: ${data.transactionId}, GUID: ${data.orderGuid}`);
        }
        
        // 🎯 Start 90s countdown timer
        const currentPrice = currentPriceRef.current || latest.value;
        setUserTimer({
          timeLeft: 90,
          isActive: true,
          betId: data.orderId || Date.now(),
          direction: currentOrder?.betNumber?.toLowerCase().includes('u') ? 'up' : 'down',
          status: 'active',
          startPrice: currentPrice,
          price30s: null,
          price60s: null,
          price90s: null,
          phase30sResult: null,
          phase60sResult: null,
          phase90sResult: null,
          startTime: new Date(),
          time30s: null,
          time60s: null,
          time90s: null,
          betPrice: currentPrice
        });
        
        console.log(`⏱️ Timer started! 90s countdown begins. Start price: $${currentPrice}`);
        } catch (error) {
          console.error('❌ Error processing OrderCreated:', error);
        }
      });

      connection.on("OrderUpdate", (data) => {
        try {
          console.log(`📈 Order Update: ${JSON.stringify(data)}`);
          
          // 💾 Save transactionId and orderGuid for insurance
          if (data.transactionId && data.orderGuid) {
            setOrderTransactionData({
              transactionId: data.transactionId,
              guid: data.orderGuid
            });
            console.log(`💾 Transaction data - ID: ${data.transactionId}, GUID: ${data.orderGuid}`);
          }
          
          // 🛡️ Capture insurance data from backend
          if (data.insuranceSection1 !== undefined || data.insuranceSection2 !== undefined) {
            setInsuranceData({
              section1: {
                isInsured: data.insuranceSection1 || false,
                id: data.insuranceSection1Id || null,
                percent: data.insuranceSection1Percent || 0,
                amount: data.insuranceSection1Amount || 0
              },
              section2: {
                isInsured: data.insuranceSection2 || false,
                id: data.insuranceSection2Id || null,
                percent: data.insuranceSection2Percent || 0,
                amount: data.insuranceSection2Amount || 0
              }
            });
            
            // Update purchased insurances set
            const newPurchased = new Set();
            if (data.insuranceSection1) newPurchased.add('Section 1');
            if (data.insuranceSection2) newPurchased.add('Section 2');
            setPurchasedInsurances(newPurchased);
            
            console.log(`🛡️ Insurance Status - Section 1: ${data.insuranceSection1 ? '✅' : '❌'} (${data.insuranceSection1Percent * 100}%, ${data.insuranceSection1Amount} GMCHIP)`);
            console.log(`🛡️ Insurance Status - Section 2: ${data.insuranceSection2 ? '✅' : '❌'} (${data.insuranceSection2Percent * 100}%, ${data.insuranceSection2Amount} GMCHIP)`);
          }
          
          // Handle insurance messages - show only latest one (Only in Insurance Mode)
          if (currentGameMode.hasInsurance && data.event === "INSURANCE" && data.messages && data.messages.length > 0) {
            // Get the last insurance message from the array
            const insuranceMsg = data.messages.find(msg => msg.mainType === "Insurance");
            
            if (insuranceMsg) {
              // ✅ Validation: Don't show Section 2 if Section 1 is not purchased
              // Use backend data directly since state hasn't updated yet
              if (insuranceMsg.subType === 'Section 2' && !data.insuranceSection1) {
                console.log('⚠️ [INSURANCE] Section 2 blocked - Section 1 must be purchased first');
                return; // Don't show Section 2 message
              }
              
              const newInsurance = {
                id: 'insurance-badge', // Stable key - always the same
                subType: insuranceMsg.subType, // "Section 1" or "Section 2"
                displayPosition: insuranceMsg.displayPosition,
                messageContent: insuranceMsg.messageContent,
                timestamp: Date.now()
              };
              
              // Clear existing timeout if any
              if (insuranceTimeoutRef.current) {
                clearTimeout(insuranceTimeoutRef.current);
              }
              
              // If there's a current message, fade it out first
              if (currentInsuranceMessage) {
                setIsInsuranceFadingOut(true);
                setTimeout(() => {
                  setIsInsuranceFadingOut(false);
                  setCurrentInsuranceMessage(newInsurance);
                }, 200); // 200ms fade out
              } else {
                // No current message, show immediately
                setCurrentInsuranceMessage(newInsurance);
              }
              
              console.log(`🛡️ Insurance: ${insuranceMsg.subType} - ${insuranceMsg.messageContent}`);
            }
          }
          
          // Capture payoutText for dynamic payout display
          if (data.payoutText) {
            setCurrentPayoutText(data.payoutText);
            console.log(`💰 Updated payoutText from OrderUpdate: ${data.payoutText}`);
          }
          
          // Update orderPrice from first OrderUpdate if available
          if (data.orderPrice && data.orderPrice > 0) {
            setCurrentOrder(prev => ({
              ...prev,
              orderPrice: data.orderPrice
            }));
            console.log(`📊 Updated 30s open price from API: ${data.orderPrice}`);
          }
          
          // Helper function to normalize result from API format to display format
          const normalizeResult = (result) => {
            if (!result || result === "") return null;
            const normalized = result.toUpperCase();
            if (normalized === "UP" || normalized === "WIN") return "up";
            if (normalized === "DOWN" || normalized === "LOSE") return "down";
            if (normalized === "SAME" || normalized === "TIE" || normalized === "DRAW") return "tie";
            return normalized.toLowerCase(); // fallback to lowercase
          };
          
          // Update round results progressively with normalized values
          if (data.round1Result !== undefined && data.round1Result !== "") {
            setOrderResults(prev => ({
              ...prev,
              round1Result: normalizeResult(data.round1Result),
              round1Price: data.round1Price
            }));
            console.log(`✅ Round 1 Result: ${data.round1Result} → ${normalizeResult(data.round1Result)}`);
          }
          if (data.round2Result !== undefined && data.round2Result !== "") {
            setOrderResults(prev => ({
              ...prev,
              round2Result: normalizeResult(data.round2Result),
              round2Price: data.round2Price
            }));
            console.log(`✅ Round 2 Result: ${data.round2Result} → ${normalizeResult(data.round2Result)}`);
          }
          if (data.round3Result !== undefined && data.round3Result !== "") {
            setOrderResults(prev => ({
              ...prev,
              round3Result: normalizeResult(data.round3Result),
              round3Price: data.round3Price
            }));
            console.log(`✅ Round 3 Result: ${data.round3Result} → ${normalizeResult(data.round3Result)}`);
          }
        } catch (error) {
          console.error('❌ Error processing OrderUpdate:', error);
        }
      });

      connection.on("InsuranceCreated", (data) => {
        try {
          console.log('🛡️ InsuranceCreated received:', data);
          if (data.isSuccess) {
            console.log(`✅ Insurance created: ${JSON.stringify(data)}`);
            
            // Mark the current section as purchased
            if (currentInsuranceMessage) {
              setPurchasedInsurances(prev => new Set([...prev, currentInsuranceMessage.subType]));
              console.log(`🛡️ Marked ${currentInsuranceMessage.subType} as purchased`);
            }
            
            // Insurance purchased successfully - no popup needed, just log to console
            console.log(`✅ Insurance purchased successfully! ${data.message || 'Your bet is now insured.'}`);
          } else {
            console.log(`❌ Insurance failed: ${data.message}`);
            alert(`❌ Insurance purchase failed: ${data.message}`);
          }
        } catch (error) {
          console.error('❌ Error processing InsuranceCreated:', error);
        }
      });

      connection.on("Error", (msg) => {
        try {
        console.log('❌ Error received:', msg);
        console.log(`❌ Error: ${JSON.stringify(msg)}`);
        
        // Show error alert to user
        const errorMessage = msg.message || msg.Message || JSON.stringify(msg);
        alert(`❌ Error: ${errorMessage}`);
        } catch (error) {
          console.error('❌ Error processing Error message:', error);
        }
      });

      connection.on("OrderResult", (data) => {
        try {
        console.log(`🏁 Final Result: ${JSON.stringify(data)}`);
        console.log(`🛡️ Active insurances at payout: ${Array.from(purchasedInsurances).join(', ') || 'none'}`);
        
        // Prevent duplicate processing of the same order result
        const orderId = data.orderId || data.memberId + '_' + data.orderDate;
        if (processedOrderIdRef.current === orderId) {
          console.log(`⚠️ Duplicate OrderResult ignored for order: ${orderId}`);
          return;
        }
        processedOrderIdRef.current = orderId;
        
        // Determine if user won, lost, or tied based on drawResult
        const drawResultUpper = data.drawResult ? data.drawResult.toUpperCase() : '';
        const isWin = drawResultUpper && drawResultUpper !== 'LOSE' && drawResultUpper !== 'TIE' && drawResultUpper !== 'DRAW';
        const isLose = drawResultUpper === 'LOSE';
        const isTie = drawResultUpper === 'TIE' || drawResultUpper === 'DRAW';
        
        // Get bet amount from API data, fallback to currentOrder or state
        const betAmountFromAPI = data.betAmount || currentOrder?.betAmount || betAmount;
        
        // Calculate payout amount based on result and game mode
        let payout = 0;
        if (isWin) {
          // WIN: Use backend's winLoseAmount (multiplied winnings) instead of bet amount
          payout = data.winLoseAmount || betAmountFromAPI; // Fallback to bet amount if winLoseAmount not provided
          
          // Apply insurance deductions if in Insurance Mode
          if (currentGameMode.hasInsurance) {
            let deductionLog = [];
            
            // Section 1 insurance: Deduct 30% from payout
            if (purchasedInsurances.has('Section 1')) {
              const deduction = payout * 0.30;
              payout = payout - deduction;
              deductionLog.push(`Section 1: -${deduction.toFixed(4)} GMCHIP (30%)`);
            }
            
            // Section 2 insurance: Deduct 30% from remaining payout
            if (purchasedInsurances.has('Section 2')) {
              const deduction = payout * 0.30;
              payout = payout - deduction;
              deductionLog.push(`Section 2: -${deduction.toFixed(4)} GMCHIP (30% of remaining)`);
            }
            
            if (deductionLog.length > 0) {
              console.log(`🛡️ Insurance deductions applied: ${deductionLog.join(', ')} → Final payout: ${payout.toFixed(4)} GMCHIP`);
            }
          }
        } else if (isTie) {
          // TIE: Different rules per game mode
          if (currentGameMode.tieRule === 'refund50') {
            // Insurance Mode: Return 50% of bet (insurance doesn't affect TIE outcome)
            payout = betAmountFromAPI * 0.5;
            console.log(`↩️ TIE in Insurance Mode: 50% refund = ${payout} GMCHIP (insurance doesn't change TIE payout)`);
          } else {
            // Battle/Extreme Mode: Player loses all
            payout = 0;
          }
        } else if (isLose) {
          payout = data.winLoseAmount || 0; // LOSE: 0 or negative amount (insurance doesn't affect LOSS)
        }
        
        // Add to betting history
        const historyEntry = {
          id: Date.now(),
          direction: data.betNumber || 'N/A',
          amount: betAmountFromAPI,
          result: isWin ? 'win' : isTie ? 'tie' : 'loss',
          payout: payout,
          winnings: isWin ? Math.abs(payout) : isTie ? Math.abs(payout) : 0,
          placedAt: new Date(),
          resolvedAt: new Date(),
          round1Result: orderResults.round1Result,
          round2Result: orderResults.round2Result,
          round3Result: orderResults.round3Result,
          round1Price: orderResults.round1Price,
          round2Price: orderResults.round2Price,
          round3Price: orderResults.round3Price
        };
        
        setBettingHistory(prevHistory => [historyEntry, ...prevHistory].slice(0, 50));
        
        // Normalize round results from backend
        const normalizeResult = (result) => {
          if (!result) return null;
          const normalized = result.toUpperCase();
          if (normalized === "UP" || normalized === "WIN") return "up";
          if (normalized === "DOWN" || normalized === "LOSE") return "down";
          if (normalized === "SAME" || normalized === "TIE" || normalized === "DRAW") return "tie";
          return normalized.toLowerCase();
        };

        // Show result popup
        if (isWin) {
          // WIN scenario
          const winAmount = Math.abs(payout);
          
          setPopupResult({
            type: 'win',
            amount: winAmount,
            totalWinnings: winAmount,
            round1Result: normalizeResult(data.round1Result),
            round2Result: normalizeResult(data.round2Result),
            round3Result: normalizeResult(data.round3Result)
          });
          setShowResultPopup(true);
          
          // Add winnings to balance
          setBalance(prevBalance => prevBalance + winAmount);
          
          // 🎮 Update Battle Pass winnings (only in Battle Mode)
          if (currentGameMode.id === 7) {
            setBattlePassWinnings(prev => prev + winAmount);
            console.log(`🎮 Battle Pass: +${winAmount} GMCHIP (Total: ${battlePassWinnings + winAmount})`);
          }
        } else if (isTie) {
          // TIE scenario - different handling per game mode
          const refundAmount = Math.abs(payout);
          
          setPopupResult({
            type: 'tie',
            amount: currentGameMode.tieRule === 'refund50' ? refundAmount : betAmountFromAPI,
            round1Result: normalizeResult(data.round1Result),
            round2Result: normalizeResult(data.round2Result),
            round3Result: normalizeResult(data.round3Result)
          });
          setShowResultPopup(true);
          
          // Insurance Mode: Refund 50% | Battle/Extreme: No refund
          if (currentGameMode.tieRule === 'refund50' && refundAmount > 0) {
            setBalance(prevBalance => prevBalance + refundAmount);
            console.log(`↩️ TIE - Refunded 50%: ${refundAmount} GMCHIP`);
          } else {
            console.log(`❌ TIE - No refund in ${currentGameMode.name}`);
          }
        } else if (isLose) {
          // LOSE scenario - show the bet amount from API that was lost
          setPopupResult({
            type: 'loss',
            amount: betAmountFromAPI,
            round1Result: normalizeResult(data.round1Result),
            round2Result: normalizeResult(data.round2Result),
            round3Result: normalizeResult(data.round3Result)
          });
          setShowResultPopup(true);
        }
        
        // Clear selection immediately
        setSelectedTrend(null);
        
        // Clear phase icons, order state, and purchased insurances after 8 seconds to allow users to see all results
        setTimeout(() => {
          setCurrentOrder(null);
          setPurchasedInsurances(new Set()); // Clear insurance badges
          setCurrentInsuranceMessage(null); // Clear any active insurance message
          setCurrentPayoutText(null); // Clear payout text for next bet
          console.log(`🧹 Cleared currentOrder and insurances - ready for next bet`);
        }, 8000);
        } catch (error) {
          console.error('❌ Error processing OrderResult:', error);
        }
      });

      connection.on("Pong", (msg) => {
        try {
          console.log(`🏓 Pong received: ${msg}`);
        } catch (error) {
          console.error('❌ Error processing Pong:', error);
        }
      });

      connection.onclose(() => {
        console.log("❌ Disconnected from game engine hub");
        setIsGameEngineConnected(false);
      });

      await connection.start();
      console.log("✅ Connected to Game Engine SignalR hub");
      setIsGameEngineConnected(true);
      setGameEngineConnection(connection);
      gameEngineConnectionRef.current = connection;
      
    } catch (err) {
      console.error("❌ Game Engine connection error:", err);
      alert(`Connection error: ${err.message}`);
      setIsGameEngineConnected(false);
    }
  };

  // Create order function for new betting system
  const createOrder = async (betNumber) => {
    // Reset previous order state before creating new order
    setOrderTransactionData({
      transactionId: null,
      guid: null
    });
    setIsInsurancePurchased(false);
    setInsuranceData({
      section1: { isInsured: false, id: null, percent: 0, amount: 0 },
      section2: { isInsured: false, id: null, percent: 0, amount: 0 }
    });
    setPurchasedInsurances(new Set());
    setOrderResults({
      round1Result: null,
      round2Result: null,
      round3Result: null,
      round1Price: 0,
      round2Price: 0,
      round3Price: 0
    });
    
    // Validate bet amount
    if (!betAmount || betAmount <= 0 || betAmount > balance) {
      alert(`Invalid bet amount. Please enter an amount between 1 and ${balance}`);
      return;
    }

    // Capture current price as the order price (30s open price)
    const currentPrice = data[data.length - 1]?.value || latest.value;

    const orderRequest = {
      MemberId: effectiveMemberId ? parseInt(effectiveMemberId) : null,
      GameId: currentGameMode.id, // 🎮 Use dynamic GameId based on selected mode
      BetNumber: betNumber,
      BetAmount: parseFloat(betAmount),
      OrderDate: new Date().toISOString(),
      OrderPrice: currentPrice,
      /**REMARK: missing this key*/
      Currency: "",
      Symbol: "BTCUSDT",
      DrawType: 1,
      InsuranceID: 0,
    };

    console.log(`📤 Creating order for ${currentGameMode.name} (GameID: ${currentGameMode.id}):`, orderRequest);

    try {
      // if (handleCreateOrder && typeof handleCreateOrder === 'function') {
      //   console.log('📤 [LIFTED STATE] Using parent handleCreateOrder');
      //   await handleCreateOrder(orderRequest);
      //   return;
      // }

      // Otherwise, use game engine connection (original architecture)
      if (!gameEngineConnectionRef.current || !isGameEngineConnected) {
        alert("⚠️ Not connected to game engine. Please connect first.");
        return;
      }

      console.log('📤 [GAME ENGINE] Using SignalR connection');
      await gameEngineConnectionRef.current.invoke("CreateOrder", orderRequest);
      
      // Store current order with the captured price for tracking
      setCurrentOrder({
        betNumber: betNumber,
        betAmount: betAmount,
        orderPrice: currentPrice,
        orderDate: orderRequest.OrderDate
      });
      
      console.log(`📊 Stored order with 30s open price: ${currentPrice}`);
      
      // Deduct balance immediately
      setBalance(prevBalance => prevBalance - betAmount);
      
      // Play bet sound
      audio.playBetSound();
      
      // Clear processed order ID for new bet
      processedOrderIdRef.current = null;
      
      // Note: State resets are done at the start of createOrder function
    } catch (err) {
      console.error("❌ Error creating order:", err);
      alert(`Error creating order: ${err.message}`);
    }
  };

  // Cleanup game engine connection on unmount
  useEffect(() => {
    return () => {
      if (gameEngineConnectionRef.current) {
        gameEngineConnectionRef.current.stop();
      }
    };
  }, []);

  // 🛡️ Create Insurance Function (Backend Integration)
  const createInsurance = async () => {
    // Validate prerequisites
    if (!orderTransactionData.transactionId || !orderTransactionData.guid) {
      alert('⚠️ No active order to insure. Please place a bet first.');
      return;
    }
    
    // Check if this specific section has already been purchased
    if (currentInsuranceMessage && purchasedInsurances.has(currentInsuranceMessage.subType)) {
      alert(`⚠️ ${currentInsuranceMessage.subType} insurance already purchased for this bet.`);
      return;
    }
    
    if (!gameEngineConnectionRef.current || !isGameEngineConnected) {
      alert('⚠️ Not connected to game engine. Please connect first.');
      return;
    }
    
    try {
      const request = {
        MemberId: effectiveMemberId ? parseInt(effectiveMemberId) : null,
        OrderGuiId: orderTransactionData.guid,
        TransactionId: orderTransactionData.transactionId
      };
      
      console.log(`📤 Sending CreateInsurance: ${JSON.stringify(request)}`);
      
      await gameEngineConnectionRef.current.invoke('CreateInsurance', request);
      console.log('✅ CreateInsurance invoked successfully');
      
    } catch (err) {
      console.error(`❌ Error invoking CreateInsurance: ${err.message}`, err);
      alert(`Error purchasing insurance: ${err.message}`);
    }
  };

  // SignalR connection effect with improved error handling
  useEffect(() => {
    let connectionAttempts = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // Reduced from 5000ms to 1000ms (1 second)
    let fallbackTimer = null;
    let isUsingFallback = false;
    let hasShownConnectedMessage = false; // Flag to prevent repeated connection messages

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
        
        // Show center connection status for "Connected" message ONLY ONCE
        if (!hasShownConnectedMessage) {
          hasShownConnectedMessage = true;
          setShowCenterConnectionStatus(true);
          
          // Auto-hide after 20 seconds
          if (connectionStatusTimeoutRef.current) {
            clearTimeout(connectionStatusTimeoutRef.current);
          }
          connectionStatusTimeoutRef.current = setTimeout(() => {
            setShowCenterConnectionStatus(false);
          }, 3000); // 3 seconds
        }
        
        console.info("✅ Connected to live data - stopping fallback mode");
      }
    };

    connection.on("ReceivePrice", (msg) => {
      try {
        // Check if connection is still valid before processing
        if (connection.state !== signalR.HubConnectionState.Connected) {
          console.warn('⚠️ Skipping message - connection not in Connected state');
          return;
        }

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
            // ✅ Simply add new price data - no clearing, no replacing
            // Real data will naturally replace mock data as it scrolls off
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
      } catch (error) {
        console.error('❌ Error processing ReceivePrice message:', error);
        // Don't throw - just log and continue
      }
    });

    // Attempt to start connection with timeout
    const startConnection = async () => {
      try {
        // Check if already connected or connecting
        if (connection.state === signalR.HubConnectionState.Connected) {
          console.log('ℹ️ Already connected to SignalR hub');
          return;
        }
        if (connection.state === signalR.HubConnectionState.Connecting) {
          console.log('ℹ️ Connection already in progress');
          return;
        }

        setConnectionStatus({
          status: 'connecting',
          message: 'Catching the Bitcoin stream...',
          isUsingFallback: false
        });
        
        await connection.start();
        console.info("✅ Connected to SignalR Hub successfully!");
        connectionAttempts = 0;
        hasShownConnectedMessage = true; // Mark as shown to prevent resets
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
        }, 3000); // 3 seconds
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
      
      // Safely disconnect SignalR with error handling
      try {
        if (connection && connection.state === signalR.HubConnectionState.Connected) {
          console.log('🔌 Disconnecting SignalR connection...');
          connection.stop().catch(err => {
            console.warn('⚠️ Error stopping SignalR connection:', err.message);
          });
        }
      } catch (error) {
        console.warn('⚠️ Error during cleanup:', error.message);
      }
    };
  }, [addNewPriceData]);

  // 🎯 NEW: 90s Three-Phase Timer with Checkpoints
  useEffect(() => {
    if (!userTimer.isActive) return;
    
    const interval = setInterval(() => {
      setUserTimer(prev => {
        if (!prev.isActive || !prev.startTime) return prev;
        
        // ✅ Calculate timeLeft based on ACTUAL elapsed time (prevents drift)
        const elapsed = Math.floor((Date.now() - prev.startTime.getTime()) / 1000);
        const newTimeLeft = Math.max(0, 90 - elapsed);
        
        // ✅ Use ref instead of data dependency to prevent interval recreation
        const currentPrice = currentPriceRef.current;
        
        if (!currentPrice) {
          console.warn('⚠️ No price data available for timer update');
          return { ...prev, timeLeft: newTimeLeft };
        }
        
        // ✅ Track if any checkpoint was triggered
        let checkpointTriggered = false;
        let updates = { timeLeft: newTimeLeft };
        
        // ✅ Checkpoint 1: 30s (timeLeft goes from 90 → 0, so at 60s remaining = 30s elapsed)
        if (newTimeLeft <= 60 && !prev.phase30sResult) {
          const priceChange = currentPrice - prev.startPrice;
          let result = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'tie';
          
          // 🛡️ Check if Round 1 insurance was purchased - auto-win
          if (purchasedInsurances.has('Section 1')) {
            result = prev.direction; // Force win based on user's bet direction
            console.log(`🛡️ [30s CHECKPOINT - INSURED] Insurance activated! Auto-win: ${result.toUpperCase()}`);
          } else {
            console.log(`📊 [30s CHECKPOINT] Start: $${prev.startPrice} → Now: $${currentPrice} | Result: ${result.toUpperCase()}`);
          }
          
          checkpointTriggered = true;
          updates = {
            ...updates,
            price30s: currentPrice,
            betPrice: currentPrice, // ✅ Update betPrice for 60s phase comparison
            phase30sResult: result,
            time30s: new Date()
          };
        }
        
        // ✅ Checkpoint 2: 60s (at 30s remaining = 60s elapsed)
        if (newTimeLeft <= 30 && !prev.phase60sResult) {
          const priceChange = currentPrice - prev.price30s;
          let result = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'tie';
          
          // 🛡️ Check if Round 2 insurance was purchased - auto-win
          if (purchasedInsurances.has('Section 2')) {
            result = prev.direction; // Force win based on user's bet direction
            console.log(`🛡️ [60s CHECKPOINT - INSURED] Insurance activated! Auto-win: ${result.toUpperCase()}`);
          } else {
            console.log(`📊 [60s CHECKPOINT] 30s Price: $${prev.price30s} → Now: $${currentPrice} | Result: ${result.toUpperCase()}`);
          }
          
          checkpointTriggered = true;
          updates = {
            ...updates,
            price60s: currentPrice,
            betPrice: currentPrice, // ✅ Update betPrice for 90s phase comparison
            phase60sResult: result,
            time60s: new Date()
          };
        }
        
        // ✅ Checkpoint 3: 90s (at 0s remaining = 90s elapsed)
        if (newTimeLeft === 0 && !prev.phase90sResult) {
          const priceChange = currentPrice - prev.price60s;
          const result = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'tie';
          
          console.log(`📊 [90s CHECKPOINT - FINAL] 60s Price: $${prev.price60s} → Now: $${currentPrice} | Result: ${result.toUpperCase()}`);
          console.log(`🎯 [ROUND COMPLETE] Results: 30s=${prev.phase30sResult} | 60s=${prev.phase60sResult} | 90s=${result}`);
          
          // TODO: Calculate payout based on results (skipped for now)
          
          // Reset timer after 3 seconds to show results
          setTimeout(() => {
            setUserTimer({
              timeLeft: 90,
              isActive: false,
              betId: null,
              direction: null,
              status: 'ready',
              startPrice: null,
              price30s: null,
              price60s: null,
              price90s: null,
              phase30sResult: null,
              phase60sResult: null,
              phase90sResult: null,
              startTime: null,
              time30s: null,
              time60s: null,
              time90s: null
            });
            setSelectedTrend(null); // Clear selection after timer completes
          }, 3000);
          
          return {
            ...prev,
            timeLeft: 0,
            price90s: currentPrice,
            phase90sResult: result,
            time90s: new Date(),
            status: 'completed'
          };
        }
        
        // Return with any checkpoint updates OR just timeLeft update
        return { ...prev, ...updates };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [userTimer.isActive]); // ✅ Removed 'data' dependency

  // Auto-dismiss insurance based on timer
  useEffect(() => {
    if (!currentInsuranceMessage || !userTimer.isActive) return;
    
    // Calculate elapsed time from timer
    const elapsed = 90 - userTimer.timeLeft;
    
    console.log(`🔍 [Insurance Timer] elapsed=${elapsed}s, type=${currentInsuranceMessage.subType}, timeLeft=${userTimer.timeLeft}s`);
    
    // Section 1: Dismiss after 25 seconds elapsed
    if (currentInsuranceMessage.subType === 'Section 1' && elapsed >= 25) {
      console.log(`🛡️ [Timer] Auto-dismissing Section 1 insurance at ${elapsed}s elapsed`);
      setIsInsuranceFadingOut(true);
      setTimeout(() => {
        setCurrentInsuranceMessage(null);
        setIsInsuranceFadingOut(false);
        if (insuranceTimeoutRef.current) {
          clearTimeout(insuranceTimeoutRef.current);
          insuranceTimeoutRef.current = null;
        }
      }, 200);
    }
    
    // Section 2: Dismiss after 55 seconds elapsed
    if (currentInsuranceMessage.subType === 'Section 2' && elapsed >= 55) {
      console.log(`🛡️ [Timer] Auto-dismissing Section 2 insurance at ${elapsed}s elapsed`);
      setIsInsuranceFadingOut(true);
      setTimeout(() => {
        setCurrentInsuranceMessage(null);
        setIsInsuranceFadingOut(false);
        if (insuranceTimeoutRef.current) {
          clearTimeout(insuranceTimeoutRef.current);
          insuranceTimeoutRef.current = null;
        }
      }, 200);
    }
  }, [currentInsuranceMessage, userTimer.timeLeft, userTimer.isActive]);


  // Render
  // Calculate rectX and rectWidth
  const rectWidth = 78;
  // Adjust label offset: less offset on mobile to keep it from extending too far right
  const labelOffset = isMobile ? 16 : 20; // Mobile: 10px (left of point), Desktop: 12px (right of point)
  const rectX = latestX + labelOffset; 

  return (
    <>
      {/* Two-Column Wrapper */}
      <div className="btc-two-column-wrapper">
        
        {/* LEFT: Existing Chart Container */}
        <div className="btc-chart-container" ref={chartRef}>

      {/* Connection Status Indicator */}
      <div className={`connection-status ${connectionStatus.status}`}>
        <div className={`status-indicator ${connectionStatus.status === 'connecting' ? 'connecting' : ''}`} />
        {connectionStatus.message}
      </div>

      {/* Timeframe Selection Controls with Clock Icon */}
      <div className="btc-timeframe-controls">
        {/* Chart Type Buttons - Elite Chart & Pro Chart */}
        {['elite', 'pro'].map((chartType) => {
          const getChartLabel = (type) => {
            if (type === 'elite') return 'Elite Chart';
            if (type === 'pro') return 'Pro Chart';
            return type;
          };
          
          return (
            <button
              key={chartType}
              onClick={() => setSelectedChartType(chartType)}
              className={`btc-timeframe-button ${selectedChartType === chartType ? 'active' : ''}`}
            >
              {getChartLabel(chartType)}
            </button>
          );
        })}
      </div>
      
      {/* Add spacing between price and chart */}
      <div className="btc-chart-svg-wrapper">
        
        {/* Elite Chart - Custom SVG Chart (1sec real-time) */}
        {selectedChartType === 'elite' && (
          <>
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
                x1={leftLabelWidth}
                x2={isMobile ? width - 90 : width - 100}
                y1={label.y}
                y2={label.y}
                stroke="#333"
                strokeDasharray="4 2"
              />
              <text
                className="btc-y-axis-label"
                x={width - rightLabelWidth + 18}/* Y-axis Pricing Padding-left */
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
          stroke="#fec300"
          strokeWidth="2"
          fill="none"
        />

        {/* Latest point */}
        <circle
          className="btc-latest-point"
          cx={(points.length > 0 ? points[points.length - 1][0] : latestX)}
          cy={points.length > 0 ? points[points.length - 1][1] : scaleY(latest.value)}
          r="4"
          fill="#fec300"
        />
        <g className="btc-current-price-label">
          <rect
            className={`btc-price-label-rect ${directionClass}`}
            x={rectX}
            y={(points.length > 0 ? points[points.length - 1][1] : scaleY(latest.value)) - 7}
            width={rectWidth}
            height={20}
            rx="4"
            ry="4"
          />
          <text
            className="btc-price-label-text"
            x={rectX + rectWidth / 2}
            y={(points.length > 0 ? points[points.length - 1][1] : scaleY(latest.value)) + 4}
            dominantBaseline="middle"
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

        {/* Bet Price Line and Label - Show when user has active order from game engine */}
        {currentOrder && (() => {
          // Determine current phase and price based on which round results are available
          let currentPhasePrice = null;
          let phaseLabel = null;
          
          // Logic: 
          // - orderPrice (from OrderCreated) = 30s open price (show immediately)
          // - round1Price (from OrderUpdate) = 60s open price (after 30s completes)
          // - round2Price (from OrderUpdate) = 90s open price (after 60s completes)
          
          // If round 2 result is available, show round2Price with [90s] label
          if (orderResults.round2Result && orderResults.round2Price && orderResults.round2Price > 0) {
            currentPhasePrice = orderResults.round2Price;
            phaseLabel = '90s';
          }
          // Else if round 1 result is available, show round1Price with [60s] label
          else if (orderResults.round1Result && orderResults.round1Price && orderResults.round1Price > 0) {
            currentPhasePrice = orderResults.round1Price;
            phaseLabel = '60s';
          }
          // Otherwise, show orderPrice from OrderCreated as [30s] (initial open price)
          else if (currentOrder.orderPrice && currentOrder.orderPrice > 0) {
            currentPhasePrice = currentOrder.orderPrice;
            phaseLabel = '30s';
          }
          
          // Only render if we have a valid price to show
          if (!currentPhasePrice || !phaseLabel) {
            console.log('⚠️ No price to display. currentOrder:', currentOrder, 'orderResults:', orderResults);
            return null;
          }
          
          console.log(`📊 Bet Price Indicator: ${currentPhasePrice.toFixed(2)} [${phaseLabel}]`);
          
          return (
            <g className="bet-price-indicator">
              {/* Horizontal dotted line at current phase price */}
              <line
                x1={isMobile ? "88" : "90"}
                x2={isMobile ? width - 90 : width - 90}
                y1={scaleY(currentPhasePrice)}
                y2={scaleY(currentPhasePrice)}
              />
              {/* Bet price label with phase indicator */}
              <g>
                <rect
                  x={isMobile ? "13" : "20"}
                  y={scaleY(currentPhasePrice) - 11}
                  width="112"
                  height="20"
                  rx="4"
                />
                <text
                  x={isMobile ? "70" : "75"}
                  y={scaleY(currentPhasePrice)}
                >
                  {currentPhasePrice.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} [{phaseLabel}]
                </text>
              </g>
            </g>
          );
        })()}

        {/* Binance Branding - Inside Chart */}
        <text className="chart-branding-text" x={isMobile ? "18" : "25"} y={height - 30}>
          Live feed from
        </text>
        <text className="chart-branding-logo" x={isMobile ? "79" : "92"} y={height - 30}>
          Binance
        </text>
   
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
      
      {/* Bottom Row Container - 3 Candles + Insurance Badges */}
      <div className="bottom-row-container">
        {/* Phase Result Icons - Left Side */}
        {currentOrder && (
          <div className="btc-phase-panel">
            <div className="btc-phase-title">{phaseTitle}</div>
            <div className="btc-phase-icons-chart">
              {/* Round 1 (30s) Result Icon */}
              {orderResults.round1Result && (
                <div className="btc-phase-icon-wrapper">
                  <div className="phase-candle">
                    <span className={`dot ${orderResults.round1Result === 'up' ? 'green' : orderResults.round1Result === 'down' ? 'red' : 'blue'}`}></span>
                  </div>
                </div>
              )}
              
              {/* Round 2 (60s) Result Icon */}
              {orderResults.round2Result && (
                <div className="btc-phase-icon-wrapper">
                  <div className="phase-candle">
                    <span className={`dot ${orderResults.round2Result === 'up' ? 'green' : orderResults.round2Result === 'down' ? 'red' : 'blue'}`}></span>
                  </div>
                </div>
              )}
              
              {/* Round 3 (90s) Result Icon */}
              {orderResults.round3Result && (
                <div className="btc-phase-icon-wrapper">
                  <div className="phase-candle">
                    <span className={`dot ${orderResults.round3Result === 'up' ? 'green' : orderResults.round3Result === 'down' ? 'red' : 'blue'}`}></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Insurance Badges - Right Side - Only in Insurance Mode */}
        {currentGameMode.hasInsurance && (purchasedInsurances.size > 0 || currentInsuranceMessage) && (
          <div className="insurance-badges">
            {/* Show Round 1 if purchased */}
            {purchasedInsurances.has('Section 1') && (
              <div className="insurance-badge section-1 purchased">
                <img src={insuredIcon1} alt="Round 1 Insured" className="insurance-icon" />
              </div>
            )}
            
            {/* Show Round 2 if purchased */}
            {purchasedInsurances.has('Section 2') && (
              <div className="insurance-badge section-2 purchased">
                <img src={insuredIcon2} alt="Round 2 Insured" className="insurance-icon" />
              </div>
            )}
            
            {/* Show active insurance offer if not purchased yet */}
            {currentInsuranceMessage && !isInsuranceFadingOut && !purchasedInsurances.has(currentInsuranceMessage.subType) && (
              <div 
                key="insurance-offer"
                className={`insurance-badge ${currentInsuranceMessage.subType.toLowerCase().replace(' ', '-')}`}
              >
                <img 
                  src={currentInsuranceMessage.subType === 'Section 1' ? insuredIcon1 : insuredIcon2} 
                  alt="Insurance" 
                  className="insurance-icon" 
                />
                <span className="insurance-text">
                  {currentInsuranceMessage.subType}: {currentInsuranceMessage.messageContent}
                </span>
                <button 
                  className="insurance-buy-btn"
                  onClick={createInsurance}
                >
                  BUY
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      </>
        )}
        
        {/* Pro Chart - TradingView Embedded Widget */}
        {selectedChartType === 'pro' && (
          <div className="tradingview-widget-container tradingview-flex-center">
            <iframe
              src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=BINANCE%3ABTCUSDT&interval=1&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=&utm_medium=widget&utm_campaign=chart&utm_term=BINANCE%3ABTCUSDT"
              className="tradingview-iframe"
              title="TradingView Chart"
            />
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
            })}
          </span>
          <span
            className={`btc-label ${isUp ? 'up' : isDown ? 'down' : 'even'}`}
          >
            {isUp && <><span className="btc-arrow-up">▲</span>UP</>}
            {isDown && <><span className="btc-arrow-down">▼</span>DOWN</>}
            {!isUp && !isDown && <><span className="btc-arrow-even">●</span>EVEN</>}
          </span>
        </div>
        {alertMessage && <div className="btc-alert">{alertMessage}</div>}
      </div>

      {/* 🎮 Game Mode Dropdown - Independent control */}
      <div className="btc-game-mode-selector">
        <div 
          className={`game-mode-dropdown ${currentOrder !== null ? 'disabled' : ''} ${isGameModeDropdownOpen ? 'open' : ''}`}
          onClick={() => !currentOrder && setIsGameModeDropdownOpen(!isGameModeDropdownOpen)}
          title="Select Game Mode"
        >
          <span className="game-mode-dropdown-label">{currentGameMode.label}</span>
          <span className="game-mode-dropdown-arrow">▼</span>
        </div>
        
        {isGameModeDropdownOpen && !currentOrder && (
          <div className="game-mode-dropdown-menu">
            {Object.keys(GAME_MODES).map((modeKey) => {
              const mode = GAME_MODES[modeKey];
              return (
                <div
                  key={modeKey}
                  className={`game-mode-dropdown-option ${selectedGameModeKey === modeKey ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    switchGameMode(modeKey);
                    setIsGameModeDropdownOpen(false);
                  }}
                >
                  {mode.label}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Battle Timer Display - Above everything */}
      <div className="btc-timer-container">
        <div className={`btc-timer-display ${
          // Show timer for 90s betting system
          userTimer.isActive
            ? (userTimer.timeLeft <= 3 ? 'blocked' : 'can-bet')
            : 'ready-to-bet'
        } ${
          userTimer.isActive && userTimer.betId ? (
            userTimer.direction === 'up' ? 'bet-up-active' : userTimer.direction === 'down' ? 'bet-down-active' : ''
          ) : ''
        }`}>
          {/* Progress Bar */}
          <div 
            className={`btc-timer-progress ${
              userTimer.isActive
                ? (userTimer.timeLeft <= 3 ? 'blocked' : 'can-bet')
                : 'ready-to-bet'
            } ${
              userTimer.isActive && userTimer.betId ? (
                userTimer.direction === 'up' ? 'bet-up-progress' : userTimer.direction === 'down' ? 'bet-down-progress' : ''
              ) : ''
            }`}
            style={{
              width: (() => {
                const totalTime = 90; // 90s betting system
                
                if (userTimer.isActive) {
                  const progress = (userTimer.timeLeft / totalTime) * 100;
                  return `${Math.max(0, Math.min(100, progress))}%`;
                } else {
                  // No active bet - show full yellow bar to indicate ready
                  return '100%';
                }
              })()
            }}
          ></div>
          {/* Timer Text */}
          <span className={`btc-timer-text ${
            !userTimer.isActive ? 'ready-state' : ''
          } ${
            userTimer.isActive && userTimer.betId ? (
              userTimer.direction === 'up' ? 'bet-up' : userTimer.direction === 'down' ? 'bet-down' : ''
            ) : ''
          }`}>
            {/* Show different messages based on bet status */}
            {!isBettingAllowed
              ? 'Waiting for price to stabilize...'
              : userTimer.isActive 
              ? `Bitcoin move locked – ${userTimer.timeLeft}s remaining`
              : 'Ready – Start 90s cycle!'
            }
          </span>
        </div>
      </div>

        </div> {/* Close btc-chart-container */}
        
        {/* RIGHT: New Trading Panel */}
        <div className="btc-trading-panel">
          
          {/* Balance Display */}
          <div className="trading-balance-section">
            <div className="trading-balance-label">Balance</div>
            <div className="trading-balance-value">
              <img 
                src="https://siteimg.iiifleche.io/Site/183_IIIF//220200_Market_Rates/Coin03.png" 
                alt={currentGameMode.defaultToken} 
                className="gmchip-icon"
              />
              <span className="gmchip-text">{currentGameMode.defaultToken}</span>
              <span className="gmchip-amount">
                {balance.toLocaleString('en-US', {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 4
                })}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="trading-amount-section">
            <input
              ref={amountInputRef}
              type="number"
              inputMode="numeric"
              value={betAmount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setBetAmount('');
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue >= 1) {
                    setBetAmount(Math.min(numValue, balance));
                  }
                }
              }}
              onFocus={(e) => {
                setIsInputFocused(true);
                // Scroll the input into view when keyboard opens
                setTimeout(() => {
                  e.target.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                  });
                }, 300); // Delay to allow keyboard to fully open
              }}
              onBlur={() => {
                setIsInputFocused(false);
              }}
              onKeyDown={(e) => {
                // Handle keyboard "NEXT" button (Enter key on mobile)
                if (e.key === 'Enter' && betAmount && betAmount > 0) {
                  e.preventDefault();
                  amountInputRef.current?.blur(); // Close keyboard
                  // Scroll to Buy button
                  setTimeout(() => {
                    buyButtonRef.current?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'center',
                      inline: 'nearest'
                    });
                  }, 100);
                }
              }}
              placeholder={`Min ${minAmount} - Max ${maxAmount}`}
              className="trading-amount-input"
            />
          </div>

          {/* Trend Grid Component - Dynamic 4 or 8 patterns */}
          <TrendGrid
            gameMode={currentGameMode}
            selectedTrend={selectedTrend}
            onTrendSelect={setSelectedTrend}
            isConnected={isGameEngineConnected}
            hasActiveOrder={currentOrder !== null}
            payoutData={payoutData}
            currentPayoutText={currentPayoutText}
            insuranceData={insuranceData}
          />

          {/* Buy Now Button */}
          <button 
            ref={buyButtonRef}
            className="trading-buy-button"
            onClick={() => {
              if (!selectedTrend) {
                alert('Please select a trend first');
                return;
              }
              if (!betAmount || betAmount <= 0) {
                alert('Please enter a bet amount');
                return;
              }
              createOrder(selectedTrend);
              // Keep selection visible after placing order (don't reset)
              // setSelectedTrend(null); 
            }}
            disabled={!isGameEngineConnected || currentOrder !== null || !selectedTrend || (currentOrder === null && isPayoutRefreshing)}
          >
            {isPayoutRefreshing && currentOrder === null ? 'Refreshing payout...' : 'Buy Now'}
          </button>

          {/* 🎮 Battle Pass Panel - Hidden (backend not ready) */}
          {false && currentGameMode.id === 7 && (
            <BattlePassPanel
              currentWinnings={battlePassWinnings}
              target={3000}
              activePasses={activeBattlePasses}
              onPurchasePass={handlePurchaseBattlePass}
            />
          )}

        </div> {/* Close btc-trading-panel */}
      </div> {/* Close btc-two-column-wrapper */}

      {/* Member Authentication UI - Game Engine */}
      {/* Only show if memberId not provided as prop (lifted state architecture) */}
      {!memberId && !isGameEngineConnected && (
        <div className="btc-member-auth">
          <input
            type="text"
            placeholder="Member ID"
            value={effectiveMemberId}
            onChange={(e) => {
              // Only allow local state if not controlled by parent
              if (setMemberId) {
                setMemberId(e.target.value);
              }
            }}
            disabled={isGameEngineConnected}
            className="btc-member-auth-input"
          />
          <button
            onClick={connectToGameEngine}
            disabled={isGameEngineConnected}
            className="btc-member-auth-button"
          >
            {isGameEngineConnected ? '✓ Connected' : 'Connect'}
          </button>
        </div>
      )}

      {/* Detailed history dropdown (optional) */}
      {showHistory && (
        <div className="btc-result-history-list">
          {resultHistory.slice(0, 9).map((item, idx) => (
            <div key={idx} className="btc-result-history-item">
              {new Date(item.dateTime).toLocaleString()} - {item.symbol}: {item.openPrice} → {item.closePrice} 
              <span className={`btc-result-history-badge ${item.trend}`}>
                {item.trend.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Result Popup - SIMPLIFIED VERSION */}
      {showResultPopup && popupResult && (
        <div className="result-popup-overlay">
          <div ref={winPopupRef} className={`result-popup-container ${popupResult.type}`}>
            {/* Close Button */}
            <button 
              className="result-popup-close"
              onClick={() => setShowResultPopup(false)}
            >
              ✕
            </button>

            {/* 1. Main Result Text (Title) */}
            <div className="result-popup-main-text">
              {popupResult.type === 'win' ? 'Win' : popupResult.type === 'tie' ? 'Draw' : 'Lose'}
            </div>

            {/* 2. Amount */}
            <div className="result-popup-amount">
              {popupResult.type === 'win' ? '+' : popupResult.type === 'tie' ? '' : '-'}${animatedAmount}
            </div>

            {/* 3. Game Results with Candle Bars */}
            {(popupResult.round1Result || popupResult.round2Result || popupResult.round3Result) && (
              <div className="result-popup-game-results">
                <div className="game-results-candles">
                  {popupResult.round1Result && (
                    <div className="result-candle-item">
                      <div className="result-candle-label">Section 1</div>
                      <div className={`result-candle ${popupResult.round1Result.toLowerCase()}`}>
                        <div className="candle-bar">
                          <div className="candle-wick-top"></div>
                          <div className="candle-body"></div>
                          <div className="candle-wick-bottom"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  {popupResult.round2Result && (
                    <div className="result-candle-item">
                      <div className="result-candle-label">Section 2</div>
                      <div className={`result-candle ${popupResult.round2Result.toLowerCase()}`}>
                        <div className="candle-bar">
                          <div className="candle-wick-top"></div>
                          <div className="candle-body"></div>
                          <div className="candle-wick-bottom"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  {popupResult.round3Result && (
                    <div className="result-candle-item">
                      <div className="result-candle-label">Section 3</div>
                      <div className={`result-candle ${popupResult.round3Result.toLowerCase()}`}>
                        <div className="candle-bar">
                          <div className="candle-wick-top"></div>
                          <div className="candle-body"></div>
                          <div className="candle-wick-bottom"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Subtitle */}
            <div className={`result-popup-subtitle ${popupResult.type}`}>
              {popupResult.type === 'win' ? 'Congratulations!' : popupResult.type === 'tie' ? 'Bet Refunded' : 'Try again, Good luck!'}
            </div>

            {/* 5. Share Buttons - Only for Win */}
            {popupResult.type === 'win' && (
              <div className="result-popup-share">
                <div className="share-title">Share Win:</div>
                <div className="share-buttons">
                  <button className="share-btn discord" onClick={() => {
                    const shareUrl = generateShareUrl(popupResult);
                    const discordText = `I just won $${popupResult.amount} on IIIfleche! Come check it out and challenge me!\n${shareUrl}`;
                    navigator.clipboard.writeText(discordText).then(() => {
                      // Open Discord web app in new tab
                      window.open('https://discord.com/channels/@me', '_blank');
                      // Show toast notification instead of alert
                      const toast = document.createElement('div');
                      toast.textContent = 'Share link copied! Paste it in Discord';
                      toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#5865F2;color:white;padding:12px 24px;border-radius:8px;z-index:99999;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
                      document.body.appendChild(toast);
                      setTimeout(() => toast.remove(), 3000);
                    });
                  }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                      <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                    </svg>
                  </button>
                  <button className="share-btn twitter" onClick={() => {
                    const shareUrl = generateShareUrl(popupResult);
                    const twitterText = `I just won $${popupResult.amount} on IIIfleche! Come check it out and challenge me!`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
                  }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>
                  <button className="share-btn telegram" onClick={() => {
                    const shareUrl = generateShareUrl(popupResult);
                    const telegramText = `I just won $${popupResult.amount} on IIIfleche! Come check it out and challenge me!`;
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(telegramText)}`, '_blank');
                  }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BTCChart;