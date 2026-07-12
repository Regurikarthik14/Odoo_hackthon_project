import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

export default function PageTransition({ children }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('enter');

  useEffect(() => {
    setTransitionStage('exit');
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setTransitionStage('enter');
    }, 200);
    return () => clearTimeout(timeout);
  }, [location.pathname, children]);

  return (
    <div className={`page-transition page-${transitionStage}`}>
      {displayChildren}
    </div>
  );
}
