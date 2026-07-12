import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import CarAnimation from './CarAnimation';
import './Layout.css';

export default function Layout() {
  const location = useLocation();
  const [carTrigger, setCarTrigger] = useState(0);

  useEffect(() => {
    setCarTrigger((prev) => prev + 1);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <CarAnimation trigger={carTrigger} />
    </div>
  );
}
