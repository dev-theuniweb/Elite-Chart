// src/components/BTCChart.jsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import './BTCChart.css';
import bitcoinIcon from '../assets/bitcoin.png';
import * as signalR from '@microsoft/signalr';

// Constants
const PADDING = 40;
const LEFT_LABEL_WIDTH = 25;
const RIGHT_LABEL_WIDTH = 100;
const CHART_PADDING_RIGHT = 70;
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

const formatNumber = (num) =>
  num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
  const signalRConnectionRef = useRef(null);

  // Add state for result history
  const [resultHistory, setResultHistory] = useState([]);

  // Dropdown state
  const [showHistory, setShowHistory] = useState(false);

  // Derived constants
  const width = chartWidth;
  const height = 300;
  const latest = data[data.length - 1];
  const prev = data[data.length - 2] || latest;

  // Prevent rendering if data is empty or invalid
  if (!data.length || !latest || isNaN(latest.value)) {
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

  // Add minimum range for Y-axis
  const MIN_Y_RANGE = 10; // or 5, or whatever makes sense for your scale
  if (max - min < MIN_Y_RANGE) {
    const mid = (max + min) / 2;
    min = mid - MIN_Y_RANGE / 2;
    max = mid + MIN_Y_RANGE / 2;
  }

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

  // SignalR connection effect
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://pricehub.ciic.games/pricehub", { withCredentials: false })
      .withAutomaticReconnect()
      .build();

    signalRConnectionRef.current = connection;

    connection.on("ReceivePrice", (msg) => {
      console.log("Received SignalR message:", msg);

      if (
        msg.source === "stream" &&
        msg.data.symbol === "BTCUSDT" &&
        msg.data.closePrice &&
        msg.data.openPrice
      ) {
        const close = Number(msg.data.closePrice.replace(/,/g, ""));
        const open = Number(msg.data.openPrice.replace(/,/g, ""));

        if (!isNaN(close) && !isNaN(open)) {
          setData(prev => [
            ...prev.slice(1),
            {
              value: close,
              time: new Date(msg.data.dateTime)
            }
          ]);
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
        setResultHistory(prev => [
          {
            dateTime: msg.data.dateTime,
            symbol: msg.data.symbol,
            openPrice: msg.data.openPrice,
            closePrice: msg.data.closePrice,
            trend: msg.data.trend
          },
          ...prev.slice(0, 19)
        ]);
      }
    });

    connection.start()
      .then(() => console.log("Connected to SignalR Hub!"))
      .catch(err => console.error("SignalR connection error: ", err));

    return () => {
      connection.stop();
    };
  }, []);

  // Render
  // Calculate rectX and rectWidth
  const rectWidth = 90;
  const rectX = Math.min(latestX + 22, width - rectWidth);

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
            x={rectX}
            y={scaleY(latest.value) - 12}
            width={rectWidth}
            height={24}
            rx="5"
            ry="5"
            fill={directionColor}
          />
          <text
            x={rectX + rectWidth / 2}
            y={scaleY(latest.value) + 2}
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

      {/* Price display with Open at the top */}
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
          <span style={{ color: "#ff8c3e", fontWeight: 700, marginLeft: 8, marginRight: 10 }}>
            Open:{open1Min ? open1Min.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
          </span>
          <span
            className={`btc-value ${isUp ? 'up' : isDown ? 'down' : 'even'}`}
          >
            Close:{latest.value.toLocaleString('en-US', {
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

      {/* Result history dropdown */}
      <div className="btc-result-history-container">
        <div className="btc-result-history-header" onClick={() => setShowHistory(v => !v)}>
          <span>
            {resultHistory[0]
              ? (
                <>
                  {resultHistory[0].dateTime} {resultHistory[0].symbol} @ {resultHistory[0].openPrice}
                  {" → "}
                  {resultHistory[0].closePrice}
                  {" "}
                  <span className={
                    resultHistory[0].trend === "down"
                      ? "btc-result-history-trend-down"
                      : resultHistory[0].trend === "up"
                        ? "btc-result-history-trend-up"
                        : "btc-result-history-trend-even"
                  }>
                    [
                    {resultHistory[0].trend === "down" && <span className="btc-result-history-chevron">▼</span>}
                    {resultHistory[0].trend === "up" && <span className="btc-result-history-chevron">▲</span>}
                    {" "}{resultHistory[0].trend.toUpperCase()}
                    ]
                  </span>
                </>
              )
              : "No results yet"}
          </span>
          <span className={`btc-dropdown-arrow${showHistory ? " open" : ""}`}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <polyline
                points="6 9 12 15 18 9"
                fill="none"
                stroke="#5f6675"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        {showHistory && (
          <div className="btc-result-history-list">
            {resultHistory.slice(1, 10).map((item, idx) => (
              <div key={idx} className="btc-result-history-item">
                {item.dateTime} {item.symbol} @ {item.openPrice}
                {" → "}
                {item.closePrice}
                {" "}
                <span className={
                  item.trend === "down"
                    ? "btc-result-history-trend-down"
                    : item.trend === "up"
                      ? "btc-result-history-trend-up"
                      : "btc-result-history-trend-even"
                }>
                  [
                  {item.trend === "down" && <span className="btc-result-history-chevron">▼</span>}
                  {item.trend === "up" && <span className="btc-result-history-chevron">▲</span>}
                  {(item.trend === "down" || item.trend === "up") && " "}
                  {item.trend.toUpperCase()}
                  ]
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BTCChart;