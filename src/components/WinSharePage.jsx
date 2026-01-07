// src/components/WinSharePage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './WinSharePage.css';
import logo from '../assets/img/iiifleche-logo.png';
import { decodeShareData } from '../utils/shareUtils';

const WinSharePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [winData, setWinData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get encoded data first (new format)
    const encodedData = searchParams.get('d');
    let data = null;
    
    if (encodedData) {
      // Decode the Base64 data
      const decodedData = decodeShareData(encodedData);
      if (decodedData) {
        data = {
          amount: decodedData.amount,
          section1Result: decodedData.s1,
          section2Result: decodedData.s2,
          section3Result: decodedData.s3,
          trendName: decodedData.trend,
          timestamp: new Date(parseInt(decodedData.time))
        };
      }
    } else {
      // Fallback to old format for backward compatibility
      const amount = searchParams.get('amount');
      const section1 = searchParams.get('s1');
      const section2 = searchParams.get('s2');
      const section3 = searchParams.get('s3');
      const trend = searchParams.get('trend');
      const timestamp = searchParams.get('time');

      if (amount && section1 && section2 && section3) {
        data = {
          amount: parseFloat(amount),
          section1Result: section1,
          section2Result: section2,
          section3Result: section3,
          trendName: trend || 'Rollercoaster',
          timestamp: timestamp ? new Date(parseInt(timestamp)) : new Date()
        };
      }
    }

    if (data) {
      setWinData(data);
      setLoading(false);

      // Update meta tags for social sharing
      const shareUrl = window.location.href;
      const shareTitle = `I just won $${data.amount} on IIIfleche!`;
      const shareDescription = `Come check it out and challenge me! ${data.trendName} pattern - On-Chain Bitcoin prediction game.`;
      const shareImage = `${window.location.protocol}//${window.location.host}/share-preview.png?v=2`;

      // Update document title
      document.title = shareTitle;

      // Update or create meta tags
      const updateMetaTag = (property, content, isProperty = true) => {
        const attr = isProperty ? 'property' : 'name';
        let element = document.querySelector(`meta[${attr}="${property}"]`);
        
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(attr, property);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };

      // Open Graph meta tags
      updateMetaTag('og:type', 'website');
      updateMetaTag('og:url', shareUrl);
      updateMetaTag('og:title', shareTitle);
      updateMetaTag('og:description', shareDescription);
      updateMetaTag('og:image', shareImage);
      updateMetaTag('og:image:width', '1200');
      updateMetaTag('og:image:height', '630');

      // Twitter Card meta tags
      updateMetaTag('twitter:card', 'summary_large_image', false);
      updateMetaTag('twitter:url', shareUrl, false);
      updateMetaTag('twitter:title', shareTitle, false);
      updateMetaTag('twitter:description', shareDescription, false);
      updateMetaTag('twitter:image', shareImage, false);

      // General meta tags
      updateMetaTag('title', shareTitle, false);
      updateMetaTag('description', shareDescription, false);
    } else {
      // If no valid data, redirect to home
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="win-share-page">
        <div className="loading">Loading win details...</div>
      </div>
    );
  }

  if (!winData) {
    return (
      <div className="win-share-page">
        <div className="error">Invalid share link. Redirecting to home...</div>
      </div>
    );
  }

  return (
    <div className="win-share-page">
      <div className="win-share-container">
        {/* Logo/Brand */}
        <div className="win-share-brand">
          <img src={logo} alt="iiifleche" className="brand-logo" />
        </div>

        {/* Win Result */}
        <div className="win-share-result">
          <div className="result-title">Win</div>
          <div className="result-amount">+${winData.amount}</div>
        </div>

        {/* Game Results */}
        <div className="win-share-game-results">
          <div className="game-results-title">{winData.trendName}</div>
          <div className="game-results-candles">
            <div className="result-candle-item">
              <div className="result-candle-label">Section 1</div>
              <div className={`result-candle ${winData.section1Result.toLowerCase()}`}>
                <div className="candle-bar">
                  <div className="candle-wick-top"></div>
                  <div className="candle-body"></div>
                  <div className="candle-wick-bottom"></div>
                </div>
              </div>
            </div>
            <div className="result-candle-item">
              <div className="result-candle-label">Section 2</div>
              <div className={`result-candle ${winData.section2Result.toLowerCase()}`}>
                <div className="candle-bar">
                  <div className="candle-wick-top"></div>
                  <div className="candle-body"></div>
                  <div className="candle-wick-bottom"></div>
                </div>
              </div>
            </div>
            <div className="result-candle-item">
              <div className="result-candle-label">Section 3</div>
              <div className={`result-candle ${winData.section3Result.toLowerCase()}`}>
                <div className="candle-bar">
                  <div className="candle-wick-top"></div>
                  <div className="candle-body"></div>
                  <div className="candle-wick-bottom"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Congratulations */}
        <div className="win-share-subtitle">
          <p>Congratulations on this amazing win!</p>
        </div>

        {/* Call to Action */}
        <div className="win-share-cta">
          <button onClick={() => window.location.href = '/'} className="play-now-btn">
            PLAY NOW
          </button>
          <p className="cta-text">Think you can beat this? Try your luck!</p>
          <p className="timestamp">{winData.timestamp.toLocaleString()}</p>
        </div>

        {/* Footer */}
        <div className="win-share-footer">
          <p>Every shot is risk . Every Win is yours. On-Chain game. </p>
          <div className="social-links">
            <a href="https://discord.gg/mbYakjpttv" target="_blank" rel="noopener noreferrer" className="social-link discord">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
            </a>
            <a href="https://x.com/IIIFleche?s=20" target="_blank" rel="noopener noreferrer" className="social-link twitter">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://t.me/IIIFleche" target="_blank" rel="noopener noreferrer" className="social-link telegram">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinSharePage;
