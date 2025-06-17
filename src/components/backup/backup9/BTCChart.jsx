// src/components/BTCChart.jsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import './BTCChart.css';
import bitcoinIcon from '../assets/bitcoin.png';

// Constants
const PADDING = 40;
const LEFT_LABEL_WIDTH = 25;
const RIGHT_LABEL_WIDTH = 100;
const CHART_PADDING_RIGHT = 50;
const NUM_X_LABELS = 7;
const INITIAL_PRICE = 105000;
const UPPER_THRESHOLD = 117000;
const LOWER_THRESHOLD = 98000;
const DATA_LENGTH = 30;

// Pure function outside component
const getSmoothPath = (points) => {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [prevX, prevY] = points[i - 1];
    const [x, y] = points[i];
    const cx = (prevX + x) / 2;
    d += ` Q ${prevX},${prevY} ${cx},${(prevY + y) / 2}`;
  }
  return d + ` T ${points[points.length - 1][0]},${points[points.length - 1][1]}`;
};

const formatNumber = (num) => num.toLocaleString('en-US', { maximumFractionDigits: 0 });

const BTCChart = () => {
  // State and refs
  const [data, setData] = useState(() => 
    Array.from({ length: DATA_LENGTH }, (_, i) => ({
      value: INITIAL_PRICE + Math.random() * 2000,
      time: new Date(Date.now() - (DATA_LENGTH - i) * 500),
    }))
  );
  const [scrollOffset, setScrollOffset] = useState(0);
  const [chartWidth, setChartWidth] = useState(800);
  const [open1Min, setOpen1Min] = useState(null);
  const [close1Min, setClose1Min] = useState(null);
  const [countdown, setCountdown] = useState(60);
  
  const intervalRef = useRef(null);
  const chartRef = useRef(null);
  const latestPriceRef = useRef(null);
  const openTimestampRef = useRef(null);

  // Derived constants
  const width = chartWidth;
  const height = 300;
  const openPrice = data[0]?.value || INITIAL_PRICE;
  const latest = data[data.length - 1];
  const prev = data[data.length - 2] || latest;

  // Memoized calculations
  const pointSpacing = useMemo(() => (
    (width - LEFT_LABEL_WIDTH - RIGHT_LABEL_WIDTH) / (data.length - 1)
  ), [width, data.length]);

  const values = useMemo(() => data.map(d => d.value), [data]);
  const min = useMemo(() => Math.min(...values), [values]);
  const max = useMemo(() => Math.max(...values), [values]);
  const yRange = useMemo(() => max - min || 1, [min, max]);

  const scaleY = useCallback(val => (
    height - ((val - min) / yRange) * (height - PADDING * 2) - PADDING
  ), [min, yRange, height]);

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
  const xLabels = useMemo(() => {
    return Array.from({ length: NUM_X_LABELS }, (_, i) => {
      const dataIndex = Math.round(i * (data.length - 1) / (NUM_X_LABELS - 1));
      return {
        time: data[dataIndex]?.time?.toLocaleTimeString([], {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) || '',
        x: scaleX(dataIndex)
      };
    });
  }, [data, scaleX]);

  const yLabels = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const value = max - ((max - min) / 4) * i;
      return { value, y: scaleY(value) };
    });
  }, [min, max, scaleY]);

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
      directionColor: isUpFlag ? '#5acc6d' : isDownFlag ? '#ff4c3e' : '#ff8c3e',
      arrow: isUpFlag ? '▲' : isDownFlag ? '▼' : '',
      directionClass: isUpFlag ? 'up' : isDownFlag ? 'down' : 'same',
      formattedPercentChange: percentChange >= 0
        ? `+${percentChange.toFixed(2)}%`
        : `${percentChange.toFixed(2)}%`
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
    const unclampedY = scaleY(open1Min);
    return Math.max(50, Math.min(height - PADDING, unclampedY));
  }, [open1Min, scaleY, height]);

  // Effects
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

  useEffect(() => {
    if (open1Min === null && data.length > 0) {
      setOpen1Min(data[data.length - 1].value);
      openTimestampRef.current = new Date();
    }
  }, [open1Min, data]);

  useEffect(() => {
    if (open1Min !== null && close1Min === null) {
      const timer = setTimeout(() => {
        setClose1Min(latestPriceRef.current);
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [open1Min, close1Min]);

  useEffect(() => {
    if (open1Min !== null && close1Min === null) {
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown(prev => prev > 1 ? prev - 1 : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [open1Min, close1Min]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setData(prev => {
        const lastPrice = prev[prev.length - 1].value;
        const nextVal = lastPrice + (Math.random() - 0.5) * 100;
        return [...prev.slice(1), { value: nextVal, time: new Date() }];
      });
      
      setScrollOffset(offset => (offset + pointSpacing / 20) >= pointSpacing ? 0 : offset + pointSpacing / 20);
    }, 1000);
    
    return () => clearInterval(intervalRef.current);
  }, [pointSpacing]);

  // Render
  return (
    <div className="btc-chart-container" ref={chartRef}>
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
                x={width - RIGHT_LABEL_WIDTH + 20}
                y={label.y + 4}
                fill="#fff"
                fontSize="12"
                fontFamily="monospace"
              >
                {formatNumber(label.value)}
              </text>
            </g>
          ))}
        </g>

        {/* X-axis labels */}
        {xLabels.map((label, index) => (
          <text
            key={index}
            x={label.x}
            y={height - 17}
            fill="#888"
            fontSize="13"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {label.time}
          </text>
        ))}

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
        <circle cx={latestX} cy={scaleY(latest.value)} r="4" fill="#F6EB14">
          <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
        </circle>

        {/* Price label */}
        <g>
          <rect
            x={Math.min(latestX + 24, width - 90)}
            y={scaleY(latest.value) - 12}
            width={80}
            height={24}
            rx="5"
            ry="5"
            fill={directionColor}
          />
          <text
            x={Math.min(latestX + 24, width - 90) + 40}
            y={scaleY(latest.value) + 2}
            fill="#fff"
            fontSize="12"
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

        {/* Open price indicator */}
        {open1Min !== null && openY !== null && (
          <>
            <line
              className="btc-open-line"
              x1={LEFT_LABEL_WIDTH + 145}
              x2={width - RIGHT_LABEL_WIDTH}
              y1={openY}
              y2={openY}
            />
            <g className="btc-open-label-group">
              <rect
                className="btc-open-label-bg"
                x={LEFT_LABEL_WIDTH}
                y={openY - 16}
                width={145}
                height={28}
                rx="6"
              />
              <text
                className="btc-open-label-text"
                x={LEFT_LABEL_WIDTH + 12}
                y={openY}
                dominantBaseline="middle"
              >
                {`Open: ${open1Min.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`}
              </text>
            </g>
          </>
        )}
      </svg>

      {/* Price display */}
      <div className="btc-price">
        <div>
          <img
            src={bitcoinIcon}
            alt="BTC"
            width="35"
            height="35"
            style={{ verticalAlign: 'middle' }}
          />
          <span className="btc-usdt">BTC/USDT:</span>
          <span className={`btc-value ${directionClass}`}>
            {latest.value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}({formattedPercentChange})
          </span>
          <span className={`btc-direction ${directionClass}`}>
            <span className="btc-arrow">{arrow}</span>
            <span className="btc-label">{isUp ? 'UP' : isDown ? 'DOWN' : 'SAME'}</span>
          </span>
        </div>
        {alertMessage && <div className="btc-alert">{alertMessage}</div>}
      </div>

      {/* Open/Close display */}
      <div className="btc-oc">
        <span className="btc-oc-label">
          Open: {open1Min ? open1Min.toLocaleString('en-US', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
          }) : '--'}
        </span>
        <span className={`btc-oc-label btc-oc-close ${close1Min ? 
          (close1Min > open1Min ? 'btc-oc-close-up' : 
           close1Min < open1Min ? 'btc-oc-close-down' : 
           'btc-oc-close-same') : ''}`}
        >
          Close: {close1Min 
            ? close1Min.toLocaleString('en-US', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })
            : `${latest.value.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} (${countdown}s)`
          }
        </span>
      </div>
    </div>
  );
};

export default BTCChart;