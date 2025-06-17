// src/components/BTCChart.jsx
import React, { useEffect, useState, useRef } from 'react';
import './BTCChart.css';
import bitcoinIcon from '../assets/bitcoin.png';

const BTCChart = () => {
  const initialPrice = 105000;
  const [data, setData] = useState(
    Array.from({ length: 30 }, (_, i) => ({
      value: initialPrice + Math.random() * 2000,
      time: new Date(Date.now() - (30 - i) * 500),
    }))
  );
  const [openPrice] = useState(data[0].value);
  const [scrollOffset, setScrollOffset] = useState(0);
  const intervalRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(800);
  const chartRef = useRef(null);

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

  const width = chartWidth;
  const height = 300;
  const padding = 40;
  const leftLabelWidth = 25;
  const rightLabelWidth = 100;

  const pointSpacing = (width - leftLabelWidth - rightLabelWidth) / (data.length - 1);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setData((prev) => {
        const lastPrice = prev[prev.length - 1].value;
        const delta = (Math.random() - 0.5) * 100;
        const nextVal = lastPrice + delta;
        const now = new Date();
        return [...prev.slice(1), { value: nextVal, time: now }];
      });
      setScrollOffset((offset) => {
        const next = offset + pointSpacing / 20; // smooth scroll, adjust divisor for speed
        // When offset reaches one point, reset and let data shift
        return next >= pointSpacing ? 0 : next;
      });
    }, 1000); // faster interval for smoothness
    return () => clearInterval(intervalRef.current);
  }, [data.length, pointSpacing]);

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const yRange = max - min || 1;

  const scaleY = (val) =>
    height - ((val - min) / yRange) * (height - padding * 2) - padding;

  // Chart points move left by scrollOffset
  
  const scaleX = (i) =>
    (i / (data.length - 1)) * (width - leftLabelWidth - rightLabelWidth) +
    leftLabelWidth -
    scrollOffset;

  // For the latest dot, always fix at right edge
  const chartPaddingRight = 50; // or 20 for more gap
const latestX = width - rightLabelWidth / 2 - chartPaddingRight;
  const latestY = scaleY(data[data.length - 1].value);

  // Smooth curve generator
  const getSmoothPath = (points) => {
    if (points.length < 2) return '';
    const d = points.reduce((acc, point, i, a) => {
      const [x, y] = point;
      if (i === 0) return `M ${x},${y}`;
      const [prevX, prevY] = a[i - 1];
      const cx = (prevX + x) / 2;
      return acc + ` Q ${prevX},${prevY} ${cx},${(prevY + y) / 2}`;
    }, '');
    const [lastX, lastY] = points[points.length - 1];
    return d + ` T ${lastX},${lastY}`;
  };

  // When rendering, only show labels/points that are visible (x >= leftLabelWidth && x <= width - rightLabelWidth)
  const points = data.map((d, i) => [scaleX(i), scaleY(d.value)]);
if (points.length > 1) {
  points[points.length - 1][0] = latestX; // Make the last point align with the glowing dot
}
const pointArray = points;

  const smoothLinePath = getSmoothPath(pointArray);

  const fillPath = pointArray.length > 0
    ? `${smoothLinePath} L ${pointArray[pointArray.length - 1][0]},${height - padding} L ${pointArray[0][0]},${height - padding} Z`
    : '';

const numXLabels = 7;
const xLabels = Array.from({ length: numXLabels }, (_, i) => {
  // Evenly distribute labels across the visible chart area
  const dataIndex = Math.round(i * (data.length - 1) / (numXLabels - 1));
  const x = scaleX(dataIndex); // <-- Use scaleX so it scrolls with the chart

  const d = data[dataIndex];
  const time = d?.time?.toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) || '';

  return { time, x };
});


  const latest = data[data.length - 1];
  const prev = data[data.length - 2] || latest;

  const isUp = latest.value > prev.value;
  const priceDirection = isUp ? 'UP' : 'DOWN';
  const directionColor = isUp ? '#5acc6d' : '#ff4c3e';
  const arrow = isUp ? '▲' : '▼';
  const directionClass = isUp ? 'up' : 'down';

  // Threshold Alert Logic
  const upperThreshold = 117000;
  const lowerThreshold = 98000;
  const crossedUpper = latest.value >= upperThreshold;
  const crossedLower = latest.value <= lowerThreshold;

  const alertMessage = crossedUpper
    ? '🚨 Price exceeds upper threshold!'
    : crossedLower
    ? '⚠️ Price dropped below lower threshold!'
    : null;

  const percentChange = ((latest.value - prev.value) / prev.value) * 100;
  const formattedPercentChange =
    percentChange >= 0
      ? `+${percentChange.toFixed(2)}%`
      : `${percentChange.toFixed(2)}%`;

  const formatNumber = (num) =>
    num.toLocaleString('en-US', { maximumFractionDigits: 0 });

  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const value = max - ((max - min) / 4) * i;
    const y = scaleY(value);
    return { value, y };
  });

  const priceLabelRectWidth = 80;
  const labelMargin = 24;
  const maxRight = width - priceLabelRectWidth - 10;
  const priceLabelRectX = Math.min(latestX + labelMargin, maxRight);

  return (
  <div
    className="btc-chart-container"
    ref={chartRef}
  >
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
              x1={padding - 20}
              x2={width - 85} // or width - rightLabelWidth
              y1={label.y}
              y2={label.y}
              stroke="#333"
              strokeDasharray="4 2"
              />
              <text
              className="btc-y-axis-label"
              x={width - rightLabelWidth + 20} // aligns with the chart line
              textAnchor="start" // if you want left-aligned labels
              y={label.y + 4}
              fill="#fff"
              fontSize="12"
              fontFamily="monospace"
              textAnchor="start"
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

        {/* Gradient area fill */}
        <path 
        d={fillPath} 
        fill="url(#grad)" 
        stroke="none" 
        />

        {/* Smooth stroke */}
        <path
          d={smoothLinePath}
          stroke="#F6EB14"
          strokeWidth="2"
          fill="none"
        />

        {/* Glowing dot */}
        <circle cx={latestX} cy={latestY} r="4" fill="#F6EB14">
          <animate
            attributeName="r"
            values="4;6;4"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Floating price label */}
        <g>
        
        {/* Tag background */}
        <rect
            x={priceLabelRectX}
            y={latestY - 12}
            width={priceLabelRectWidth}
            height="24"
            rx="5"
            ry="5"
            fill={directionColor}
        />

        {/* Price text */}
        <text
            x={priceLabelRectX + priceLabelRectWidth / 2}
            y={latestY + 2}
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


      </svg>

      <div className="btc-price">
        <div>
            <img
                src={bitcoinIcon}
                alt="BTC"
                width="35"
                height="35"
                style={{ verticalAlign: 'middle' }}
            />
            <span className="btc-usdt">BTC/USDT:</span>{' '}
            <span className={`btc-value ${directionClass}`}>
            {latest.value.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}({formattedPercentChange})
            </span>
            
            <span className={`btc-direction ${directionClass}`}>
            <span className="btc-arrow">{arrow}</span>{' '}
            <span className="btc-label">{priceDirection}</span>
            </span>
        </div>

        {alertMessage && <div className="btc-alert">{alertMessage}</div>}
      </div>
    </div>
  );
};

export default BTCChart;