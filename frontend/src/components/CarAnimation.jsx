import { useEffect, useState } from 'react';
import './CarAnimation.css';

export default function CarAnimation({ trigger }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!visible) return null;

  return (
    <div className="car-animation-overlay">
      <div className="car-track">
        <div className="car-body">
          <div className="car-top"></div>
          <div className="car-bottom">
            <div className="car-window front-window"></div>
            <div className="car-window rear-window"></div>
          </div>
          <div className="wheel wheel-front"></div>
          <div className="wheel wheel-rear"></div>
        </div>
      </div>
    </div>
  );
}
