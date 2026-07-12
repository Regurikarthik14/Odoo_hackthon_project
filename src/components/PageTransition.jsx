import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  const [showCar, setShowCar] = useState(false);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      setShowCar(true);
      prevPath.current = location.pathname;
      const timer = setTimeout(() => setShowCar(false), 900);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Pick a random car emoji for variety
  const cars = ['🚗', '🚙', '🏎️', '🚕', '🚐'];
  const carRef = useRef(cars[Math.floor(Math.random() * cars.length)]);

  return (
    <>
      {showCar && (
        <div className="page-transition-overlay">
          <div className="car-trail" />
          <div className="car-animation">
            {carRef.current}
          </div>
          <div className="car-animation car-shadow">
            🚗
          </div>
        </div>
      )}
      <div className="page-content" key={location.pathname}>
        {children}
      </div>
    </>
  );
}
