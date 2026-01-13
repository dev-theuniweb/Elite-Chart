// src/components/ui/ConnectionStatus.jsx

import React, { useState, useEffect } from 'react';
import '../BTCChart/styles/ConnectionStatus.css';

/**
 * Connection status notification component
 * Shows user-friendly messages about connection state and fallback mode
 */
const ConnectionStatus = ({ 
  signalRState, 
  showDetails = false,
  position = 'top-center',
  autoHide = true,
  hideDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  // Determine if we should show the status
  useEffect(() => {
    const shouldShowStatus = signalRState.usingFallback || 
                           signalRState.isReconnecting || 
                           signalRState.error ||
                           signalRState.status === 'connecting';
    
    setShouldShow(shouldShowStatus);
    
    if (shouldShowStatus) {
      setIsVisible(true);
    } else if (autoHide) {
      const timer = setTimeout(() => setIsVisible(false), hideDelay);
      return () => clearTimeout(timer);
    }
  }, [signalRState, autoHide, hideDelay]);

  // Auto-hide for certain states
  useEffect(() => {
    if (signalRState.status === 'connected' && !signalRState.usingFallback && autoHide) {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [signalRState.status, signalRState.usingFallback, autoHide]);

  if (!shouldShow && !isVisible) return null;

  const getStatusInfo = () => {
    if (signalRState.usingFallback) {
      return {
        icon: '📊',
        message: 'Demo Mode Active',
        detail: 'Using simulated data for demonstration',
        color: '#ffaa00',
        bgColor: 'rgba(255, 170, 0, 0.1)',
        borderColor: 'rgba(255, 170, 0, 0.3)'
      };
    }

    if (signalRState.isReconnecting) {
      return {
        icon: '🔄',
        message: 'Reconnecting...',
        detail: `Attempt ${signalRState.retryCount + 1}`,
        color: '#4CAF50',
        bgColor: 'rgba(76, 175, 80, 0.1)',
        borderColor: 'rgba(76, 175, 80, 0.3)'
      };
    }

    if (signalRState.status === 'connecting') {
      return {
        icon: '🔌',
        message: 'Connecting...',
        detail: 'Establishing connection to price feed',
        color: '#2196F3',
        bgColor: 'rgba(33, 150, 243, 0.1)',
        borderColor: 'rgba(33, 150, 243, 0.3)'
      };
    }

    if (signalRState.error) {
      return {
        icon: '⚠️',
        message: 'Connection Issue',
        detail: 'Will switch to demo mode if connection fails',
        color: '#ff4444',
        bgColor: 'rgba(255, 68, 68, 0.1)',
        borderColor: 'rgba(255, 68, 68, 0.3)'
      };
    }

    if (signalRState.status === 'connected') {
      return {
        icon: '✅',
        message: 'Connected',
        detail: 'Live price data active',
        color: '#4CAF50',
        bgColor: 'rgba(76, 175, 80, 0.1)',
        borderColor: 'rgba(76, 175, 80, 0.3)'
      };
    }

    return {
      icon: '❓',
      message: 'Unknown Status',
      detail: '',
      color: '#888',
      bgColor: 'rgba(136, 136, 136, 0.1)',
      borderColor: 'rgba(136, 136, 136, 0.3)'
    };
  };

  const positionStyles = {
    'top-left': { top: 20, left: 20 },
    'top-center': { top: 20, left: '50%', transform: 'translateX(-50%)' },
    'top-right': { top: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'bottom-center': { bottom: 20, left: '50%', transform: 'translateX(-50%)' },
    'bottom-right': { bottom: 20, right: 20 }
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      className="connection-status-notification"
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 1000,
        background: statusInfo.bgColor,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${statusInfo.borderColor}`,
        borderRadius: '8px',
        padding: '12px 16px',
        color: statusInfo.color,
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '200px',
        maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <span style={{ fontSize: '16px' }}>{statusInfo.icon}</span>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', marginBottom: '2px' }}>
          {statusInfo.message}
        </div>
        {showDetails && statusInfo.detail && (
          <div style={{ 
            fontSize: '12px', 
            opacity: 0.8,
            lineHeight: 1.3
          }}>
            {statusInfo.detail}
          </div>
        )}
      </div>

      {/* Close button for persistent states */}
      {(signalRState.usingFallback || !autoHide) && (
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            color: statusInfo.color,
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            fontSize: '12px',
            opacity: 0.7,
            lineHeight: 1
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.7'}
        >
          ✕
        </button>
      )}

      {/* Progress indicator for connecting states */}
      {(signalRState.status === 'connecting' || signalRState.isReconnecting) && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: `2px solid ${statusInfo.color}`,
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}
    </div>
  );
};

/**
 * Compact connection indicator for persistent display
 */
export const ConnectionIndicator = ({ signalRState, onClick }) => {
  const getIndicatorColor = () => {
    if (signalRState.usingFallback) return '#ffaa00';
    if (signalRState.status === 'connected') return '#4CAF50';
    if (signalRState.isReconnecting || signalRState.status === 'connecting') return '#2196F3';
    return '#ff4444';
  };

  const getIndicatorIcon = () => {
    if (signalRState.usingFallback) return '📊';
    if (signalRState.status === 'connected') return '🔗';
    if (signalRState.isReconnecting) return '🔄';
    if (signalRState.status === 'connecting') return '🔌';
    return '⚠️';
  };

  return (
    <div
      onClick={onClick}
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 999,
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: `${getIndicatorColor()}20`,
        border: `2px solid ${getIndicatorColor()}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)'
      }}
      title={signalRState.statusMessage || signalRState.status}
    >
      {getIndicatorIcon()}
    </div>
  );
};

export default ConnectionStatus;
