import React, { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleToggle = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleMobileToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <div className="app-layout">        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileOpen}
          onToggle={handleToggle}
          onMobileClose={handleMobileClose}
        />
      <div className={`main-area ${sidebarCollapsed ? 'expanded' : ''}`}>
        <Navbar pathname={location.pathname} onMenuToggle={handleMobileToggle} />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
