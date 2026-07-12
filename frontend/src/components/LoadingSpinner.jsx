import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="steering-wheel-loader">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          {/* Outer ring */}
          <circle className="steering-wheel-outer" cx="50" cy="50" r="42" />
          {/* Inner decorative ring */}
          <circle className="steering-wheel-inner" cx="50" cy="50" r="32" strokeDasharray="80 30" />
          {/* Center hub */}
          <circle className="steering-wheel-center" cx="50" cy="50" r="8" opacity="0.9" />
          {/* Spokes */}
          <line className="steering-wheel-outer" x1="50" y1="8" x2="50" y2="22" />
          <line className="steering-wheel-outer" x1="50" y1="78" x2="50" y2="92" />
          <line className="steering-wheel-outer" x1="8" y1="50" x2="22" y2="50" />
          <line className="steering-wheel-outer" x1="78" y1="50" x2="92" y2="50" />
          {/* Diagonal spokes */}
          <line className="steering-wheel-inner" x1="20.3" y1="20.3" x2="29.3" y2="29.3" />
          <line className="steering-wheel-inner" x1="79.7" y1="20.3" x2="70.7" y2="29.3" />
          <line className="steering-wheel-inner" x1="20.3" y1="79.7" x2="29.3" y2="70.7" />
          <line className="steering-wheel-inner" x1="79.7" y1="79.7" x2="70.7" y2="70.7" />
        </svg>
      </div>
      <div className="loading-text">Loading FleetMaster Pro</div>
      <div className="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}
